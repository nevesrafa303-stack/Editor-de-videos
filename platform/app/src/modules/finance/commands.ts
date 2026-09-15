/**
 * Escritas do financeiro.
 *
 * Nada aqui calcula dinheiro por conta propria. O saldo da parcela, a multa,
 * os juros e a comissao vem do banco — as mesmas funcoes que a tela mostra e
 * que um script de correcao usaria. Duas versoes da conta do dinheiro e como
 * uma clinica descobre, no fim do mes, que o sistema e o extrato discordam.
 */
import { sql } from "kysely";
import type { TenantContext } from "@/server/context";
import { BusinessRuleError, Forbidden, NotFound, ValidationError } from "@/shared/errors";
import { toValidationError } from "@/shared/zod";
import {
  cashMovementSchema,
  closeCashSchema,
  openCashSchema,
  receivePaymentSchema,
  reversePaymentSchema,
  type CashMovementInput,
  type CloseCashInput,
  type OpenCashInput,
  type ReceivePaymentInput,
  type ReversePaymentInput,
} from "@/modules/finance/schema";

export type ReceiptSummary = {
  paymentId: string;
  /** O que o paciente entregou: principal + multa + juros. */
  amountCents: number;
  /** A parte que abateu a parcela. */
  principalCents: number;
  fineCents: number;
  interestCents: number;
  waived: boolean;
  installmentStatus: string;
};

/**
 * Registra um recebimento.
 *
 * O valor devido vem de `installment_charges` na hora — nao do que a tela
 * mandou. Se a tela calculou com dados de ontem, quem manda e o banco.
 */
export async function receivePayment(
  ctx: TenantContext,
  input: ReceivePaymentInput,
): Promise<ReceiptSummary> {
  ctx.assert("payment.register");

  const parsed = receivePaymentSchema.safeParse(input);
  if (!parsed.success) throw toValidationError(parsed.error, "Confira o recebimento.");
  const data = parsed.data;

  const cobranca = await sql<{
    balance_cents: number;
    fine_cents: number;
    interest_cents: number;
    status: string;
  }>`
    select c.balance_cents, c.fine_cents, c.interest_cents, i.status::text
    from installment i
    cross join lateral installment_charges(i.id) c
    where i.id = ${data.installmentId}::uuid
  `.execute(ctx.db);

  const linha = cobranca.rows[0];
  if (!linha) throw new NotFound("Parcela");

  if (linha.status === "paid") {
    throw new BusinessRuleError("Esta parcela já está quitada.");
  }
  if (linha.status === "canceled") {
    throw new BusinessRuleError("Esta parcela foi cancelada.");
  }

  const saldo = Number(linha.balance_cents);
  const encargosDevidos = data.waiveCharges
    ? 0
    : Number(linha.fine_cents) + Number(linha.interest_cents);
  const devido = saldo + encargosDevidos;

  if (data.amountCents > devido) {
    throw new ValidationError(
      { amountCents: [`O valor recebido passa do devido (${formatar(devido)}).`] },
      "O valor recebido passa do devido.",
    );
  }

  // O valor digitado e o TOTAL que o paciente entregou. O que cabe no saldo
  // abate a parcela; o que passa dele e mora.
  //
  // Recebimento parcial paga principal primeiro de proposito: a parcela anda,
  // e a mora do que sobrar e recalculada na proxima vez — cobrar encargo antes
  // do principal faria a divida parecer nao andar, o que e verdade contabil e
  // pessimo para a conversa no balcao.
  const principal = Math.min(data.amountCents, saldo);
  const encargosRecebidos = Math.min(data.amountCents - principal, encargosDevidos);
  const multa = Math.min(encargosRecebidos, data.waiveCharges ? 0 : Number(linha.fine_cents));
  const juros = encargosRecebidos - multa;

  const metodo = await ctx.db
    .selectFrom("payment_method")
    .select(["id", "name", "affects_cash_session", "fee_percent"])
    .where("id", "=", data.paymentMethodId)
    .where("is_active", "=", true)
    .executeTakeFirst();

  if (!metodo) throw new NotFound("Forma de pagamento");

  // Dinheiro em especie precisa de caixa aberto: sem isso nao ha o que
  // conferir no fim do dia, e a quebra de caixa vira invisivel.
  const caixa = metodo.affects_cash_session ? await exigirCaixaAberto(ctx) : null;

  const taxa = Math.floor(((principal + encargosRecebidos) * Number(metodo.fee_percent ?? 0)) / 100);

  const nota = [
    data.notes,
    data.waiveCharges && Number(linha.fine_cents) + Number(linha.interest_cents) > 0
      ? `Multa e juros perdoados por ${ctx.session.userName}.`
      : null,
    multa + juros > 0 ? `Inclui ${formatar(multa)} de multa e ${formatar(juros)} de juros.` : null,
  ]
    .filter(Boolean)
    .join(" ");

  const pagamento = await ctx.db
    .insertInto("payment")
    .values({
      tenant_id: ctx.session.tenantId,
      unit_id: ctx.unitId(),
      installment_id: data.installmentId,
      patient_id: await pacienteDaParcela(ctx, data.installmentId),
      payment_method_id: metodo.id,
      ...(caixa ? { cash_session_id: caixa } : {}),
      amount_cents: principal,
      fine_cents: multa,
      interest_cents: juros,
      fee_cents: taxa,
      notes: nota || null,
      created_by: ctx.session.membershipId,
    })
    .returning("id")
    .executeTakeFirstOrThrow();

  if (caixa) {
    await ctx.db
      .insertInto("cash_movement")
      .values({
        tenant_id: ctx.session.tenantId,
        session_id: caixa,
        kind: "payment",
        // Na gaveta entra o que o paciente entregou, mora inclusa.
        amount_cents: principal + encargosRecebidos,
        payment_id: pagamento.id,
        description: `Recebimento · ${metodo.name}`,
        created_by: ctx.session.membershipId,
      })
      .execute();
  }

  const depois = await ctx.db
    .selectFrom("installment")
    .select("status")
    .where("id", "=", data.installmentId)
    .executeTakeFirstOrThrow();

  return {
    paymentId: pagamento.id as string,
    amountCents: principal + encargosRecebidos,
    principalCents: principal,
    fineCents: multa,
    interestCents: juros,
    waived: data.waiveCharges,
    installmentStatus: depois.status,
  };
}

export async function reversePayment(
  ctx: TenantContext,
  input: ReversePaymentInput,
): Promise<void> {
  ctx.assert("payment.reverse");

  const parsed = reversePaymentSchema.safeParse(input);
  if (!parsed.success) throw toValidationError(parsed.error, "Confira o estorno.");
  const data = parsed.data;

  // O estorno nao apaga o pagamento: muda o status e guarda o motivo. A
  // trigger de protecao do banco recusa qualquer outra coisa.
  const row = await ctx.db
    .updateTable("payment")
    .set({
      status: "reversed",
      reversed_at: new Date(),
      reversal_reason: data.reason,
    })
    .where("id", "=", data.paymentId)
    .where("status", "=", "confirmed")
    .returning(["id", "cash_session_id", "gross_cents", "tenant_id"])
    .executeTakeFirst();

  if (!row) throw new NotFound("Pagamento confirmado");

  if (row.cash_session_id) {
    await ctx.db
      .insertInto("cash_movement")
      .values({
        tenant_id: ctx.session.tenantId,
        session_id: row.cash_session_id,
        kind: "refund",
        amount_cents: -(row.gross_cents ?? 0),
        payment_id: row.id,
        description: `Estorno · ${data.reason}`,
        created_by: ctx.session.membershipId,
      })
      .execute();
  }
}

export async function openCashSession(
  ctx: TenantContext,
  input: OpenCashInput = {},
): Promise<{ id: string }> {
  ctx.assert("cash.open");

  const parsed = openCashSchema.safeParse(input);
  if (!parsed.success) throw toValidationError(parsed.error, "Confira a abertura do caixa.");
  const data = parsed.data;

  const unidade = ctx.unitId();

  const aberto = await ctx.db
    .selectFrom("cash_session")
    .select("id")
    .where("unit_id", "=", unidade)
    .where("status", "=", "open")
    .executeTakeFirst();

  if (aberto) {
    throw new BusinessRuleError(
      "Já existe um caixa aberto nesta unidade. Feche o atual antes de abrir outro.",
    );
  }

  const row = await ctx.db
    .insertInto("cash_session")
    .values({
      tenant_id: ctx.session.tenantId,
      unit_id: unidade,
      opened_by: ctx.session.membershipId,
      opening_cents: data.openingCents,
      notes: data.notes ?? null,
    })
    .returning("id")
    .executeTakeFirstOrThrow();

  return { id: row.id as string };
}

export type CashClosing = {
  expectedCents: number;
  countedCents: number;
  differenceCents: number;
};

export async function closeCashSession(
  ctx: TenantContext,
  input: CloseCashInput,
): Promise<CashClosing> {
  ctx.assert("cash.close");

  const parsed = closeCashSchema.safeParse(input);
  if (!parsed.success) throw toValidationError(parsed.error, "Confira o fechamento.");
  const data = parsed.data;

  const sessao = await ctx.db
    .selectFrom("cash_session")
    .select(["id", "opening_cents", "opened_by", "status"])
    .where("id", "=", data.sessionId)
    .executeTakeFirst();

  if (!sessao) throw new NotFound("Caixa");
  if (sessao.status !== "open") throw new BusinessRuleError("Este caixa já foi fechado.");

  // Quem abriu fecha. Outra pessoa fechando o caixa alheio precisa de
  // permissao de auditoria — senao a conferencia perde o dono.
  if (sessao.opened_by !== ctx.session.membershipId && !ctx.can("cash.audit")) {
    throw new Forbidden(
      "Este caixa foi aberto por outra pessoa. Só quem abriu, ou quem audita, pode fechar.",
      "cash.audit",
    );
  }

  const soma = await ctx.db
    .selectFrom("cash_movement")
    .select((eb) => eb.fn.sum<number>("amount_cents").as("total"))
    .where("session_id", "=", data.sessionId)
    .executeTakeFirst();

  const esperado = sessao.opening_cents + Number(soma?.total ?? 0);

  await ctx.db
    .updateTable("cash_session")
    .set({
      status: "closed",
      closed_at: new Date(),
      closed_by: ctx.session.membershipId,
      counted_cents: data.countedCents,
      expected_cents: esperado,
      notes: data.notes ?? null,
    })
    .where("id", "=", data.sessionId)
    .execute();

  return {
    expectedCents: esperado,
    countedCents: data.countedCents,
    differenceCents: data.countedCents - esperado,
  };
}

export async function addCashMovement(
  ctx: TenantContext,
  input: CashMovementInput,
): Promise<void> {
  ctx.assert("cash.open");

  const parsed = cashMovementSchema.safeParse(input);
  if (!parsed.success) throw toValidationError(parsed.error, "Confira a movimentação.");
  const data = parsed.data;

  // Sangria e ajuste negativo saem do caixa; suprimento entra.
  const sinal = data.kind === "supply" ? 1 : -1;

  await ctx.db
    .insertInto("cash_movement")
    .values({
      tenant_id: ctx.session.tenantId,
      session_id: data.sessionId,
      kind: data.kind,
      amount_cents: sinal * data.amountCents,
      description: data.description,
      created_by: ctx.session.membershipId,
    })
    .execute();
}

async function exigirCaixaAberto(ctx: TenantContext): Promise<string> {
  const aberto = await ctx.db
    .selectFrom("cash_session")
    .select("id")
    .where("unit_id", "=", ctx.unitId())
    .where("status", "=", "open")
    .executeTakeFirst();

  if (!aberto) {
    throw new BusinessRuleError(
      "Não há caixa aberto nesta unidade. Abra o caixa antes de receber em dinheiro.",
    );
  }

  return aberto.id as string;
}

async function pacienteDaParcela(ctx: TenantContext, installmentId: string): Promise<string> {
  const row = await ctx.db
    .selectFrom("installment")
    .select("patient_id")
    .where("id", "=", installmentId)
    .executeTakeFirst();

  if (!row) throw new NotFound("Parcela");
  return row.patient_id;
}

const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const formatar = (cents: number) => BRL.format(cents / 100);
