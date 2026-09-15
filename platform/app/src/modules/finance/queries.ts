/**
 * Consultas do financeiro.
 *
 * Uma decisao atravessa este arquivo: multa e juros NUNCA sao lidos de coluna.
 * Parcela vencida vale um numero diferente a cada dia — congelar isso seria
 * mentir amanha. O calculo vem de `installment_charges`, a mesma funcao que o
 * recebimento usa, entao a tela e a cobranca nunca discordam.
 */
import { sql } from "kysely";
import type { TenantContext } from "@/server/context";
import { NotFound } from "@/shared/errors";
import {
  listInstallmentsSchema,
  type InstallmentStatus,
  type ListInstallmentsInput,
} from "@/modules/finance/schema";

export type InstallmentRow = {
  id: string;
  receivableId: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  number: number;
  totalCount: number;
  dueOn: string;
  status: InstallmentStatus;
  amountCents: number;
  paidCents: number;
  balanceCents: number;
  lateDays: number;
  fineCents: number;
  interestCents: number;
  totalDueCents: number;
  description: string | null;
  quoteId: string | null;
};

const RECORTE_SQL = {
  vencidas: sql`i.status in ('open', 'partially_paid') and i.due_on < current_date`,
  hoje: sql`i.status in ('open', 'partially_paid') and i.due_on = current_date`,
  semana: sql`i.status in ('open', 'partially_paid') and i.due_on between current_date and current_date + 7`,
  abertas: sql`i.status in ('open', 'partially_paid')`,
  pagas: sql`i.status = 'paid'`,
} as const;

export async function listInstallments(
  ctx: TenantContext,
  input: ListInstallmentsInput = {},
): Promise<{ items: InstallmentRow[]; total: number }> {
  ctx.assert("receivable.read");
  const filter = listInstallmentsSchema.parse(input);

  const recorte = RECORTE_SQL[filter.recorte];
  const busca = filter.search ? `%${filter.search}%` : null;

  const linhas = await sql<{
    id: string;
    receivable_id: string;
    patient_id: string;
    patient_name: string;
    patient_phone: string;
    number: number;
    total_count: number;
    due_on: string;
    status: InstallmentStatus;
    amount_cents: number;
    paid_cents: number;
    balance_cents: number;
    late_days: number;
    fine_cents: number;
    interest_cents: number;
    description: string | null;
    quote_id: string | null;
    total_rows: number;
  }>`
    select
      i.id, i.receivable_id, i.patient_id,
      p.full_name as patient_name, p.phone as patient_phone,
      i.number, i.total_count, i.due_on, i.status,
      i.amount_cents, i.paid_cents,
      c.balance_cents, c.late_days, c.fine_cents, c.interest_cents,
      r.description, r.quote_id,
      count(*) over () as total_rows
    from installment i
    join patient p on p.id = i.patient_id
    join receivable r on r.id = i.receivable_id
    cross join lateral installment_charges(i.id) c
    where ${recorte}
      and (${filter.patientId ?? null}::uuid is null or i.patient_id = ${filter.patientId ?? null}::uuid)
      and (${busca}::text is null or p.full_name ilike ${busca}::text)
    order by i.due_on asc, p.full_name asc
    limit ${filter.limit} offset ${filter.offset}
  `.execute(ctx.db);

  return {
    items: linhas.rows.map((r) => ({
      id: r.id,
      receivableId: r.receivable_id,
      patientId: r.patient_id,
      patientName: r.patient_name,
      patientPhone: r.patient_phone,
      number: r.number,
      totalCount: r.total_count,
      dueOn: r.due_on,
      status: r.status,
      amountCents: Number(r.amount_cents),
      paidCents: Number(r.paid_cents),
      balanceCents: Number(r.balance_cents),
      lateDays: Number(r.late_days),
      fineCents: Number(r.fine_cents),
      interestCents: Number(r.interest_cents),
      totalDueCents:
        Number(r.balance_cents) + Number(r.fine_cents) + Number(r.interest_cents),
      description: r.description,
      quoteId: r.quote_id,
    })),
    total: Number(linhas.rows[0]?.total_rows ?? 0),
  };
}

export type FinanceOverview = {
  aReceberCents: number;
  vencidoCents: number;
  vencidoCount: number;
  recebidoMesCents: number;
  venceSemanaCents: number;
  comissaoMesCents: number;
  caixa: CashSession | null;
};

export async function getFinanceOverview(ctx: TenantContext): Promise<FinanceOverview> {
  ctx.assert("receivable.read");

  const resumo = await sql<{
    a_receber: number;
    vencido: number;
    vencido_count: number;
    vence_semana: number;
    recebido_mes: number;
    comissao_mes: number;
  }>`
    select
      coalesce((
        select sum(i.amount_cents - i.paid_cents) from installment i
        where i.status in ('open', 'partially_paid')
      ), 0) as a_receber,
      coalesce((
        select sum(i.amount_cents - i.paid_cents) from installment i
        where i.status in ('open', 'partially_paid') and i.due_on < current_date
      ), 0) as vencido,
      coalesce((
        select count(*) from installment i
        where i.status in ('open', 'partially_paid') and i.due_on < current_date
      ), 0) as vencido_count,
      coalesce((
        select sum(i.amount_cents - i.paid_cents) from installment i
        where i.status in ('open', 'partially_paid')
          and i.due_on between current_date and current_date + 7
      ), 0) as vence_semana,
      coalesce((
        select sum(p.amount_cents) from payment p
        where p.status = 'confirmed'
          and p.paid_at >= date_trunc('month', now())
      ), 0) as recebido_mes,
      coalesce((
        select sum(ce.amount_cents) from commission_entry ce
        where ce.status <> 'canceled'
          and ce.reference_month = date_trunc('month', now())::date
      ), 0) as comissao_mes
  `.execute(ctx.db);

  const linha = resumo.rows[0];

  return {
    aReceberCents: Number(linha?.a_receber ?? 0),
    vencidoCents: Number(linha?.vencido ?? 0),
    vencidoCount: Number(linha?.vencido_count ?? 0),
    venceSemanaCents: Number(linha?.vence_semana ?? 0),
    recebidoMesCents: Number(linha?.recebido_mes ?? 0),
    comissaoMesCents: Number(linha?.comissao_mes ?? 0),
    caixa: await getOpenCashSession(ctx),
  };
}

export type CashSession = {
  id: string;
  status: string;
  openedAt: Date;
  openedBy: string;
  openingCents: number;
  entradasCents: number;
  saidasCents: number;
  esperadoCents: number;
  movimentos: {
    id: string;
    kind: string;
    amountCents: number;
    description: string | null;
    at: Date;
    by: string | null;
  }[];
};

/**
 * O caixa aberto da unidade ativa.
 *
 * So dinheiro em especie passa por aqui: PIX e cartao caem na conta e nao
 * mudam o que a gaveta tem que ter no fim do dia. O que decide e
 * `payment_method.affects_cash_session`.
 */
export async function getOpenCashSession(ctx: TenantContext): Promise<CashSession | null> {
  if (!ctx.can("cash.open") && !ctx.can("receivable.read")) return null;

  const sessao = await ctx.db
    .selectFrom("cash_session as s")
    .innerJoin("membership as m", "m.id", "s.opened_by")
    .innerJoin("app_user as u", "u.id", "m.user_id")
    .select(["s.id", "s.status", "s.opened_at", "s.opening_cents", "u.full_name as opened_by"])
    .where("s.status", "=", "open")
    .where("s.unit_id", "=", ctx.session.activeUnitId ?? ctx.unitId())
    .orderBy("s.opened_at", "desc")
    .limit(1)
    .executeTakeFirst();

  if (!sessao) return null;

  const movimentos = await ctx.db
    .selectFrom("cash_movement as cm")
    .leftJoin("membership as m", "m.id", "cm.created_by")
    .leftJoin("app_user as u", "u.id", "m.user_id")
    .select([
      "cm.id", "cm.kind", "cm.amount_cents", "cm.description",
      "cm.created_at", "u.full_name as by",
    ])
    .where("cm.session_id", "=", sessao.id)
    .orderBy("cm.created_at", "desc")
    .execute();

  const entradas = movimentos
    .filter((m) => m.amount_cents > 0)
    .reduce((soma, m) => soma + m.amount_cents, 0);
  const saidas = movimentos
    .filter((m) => m.amount_cents < 0)
    .reduce((soma, m) => soma + m.amount_cents, 0);

  return {
    id: sessao.id as string,
    status: sessao.status,
    openedAt: sessao.opened_at,
    openedBy: sessao.opened_by,
    openingCents: sessao.opening_cents,
    entradasCents: entradas,
    saidasCents: saidas,
    esperadoCents: sessao.opening_cents + entradas + saidas,
    movimentos: movimentos.map((m) => ({
      id: m.id as string,
      kind: m.kind,
      amountCents: m.amount_cents,
      description: m.description,
      at: m.created_at,
      by: m.by,
    })),
  };
}

export async function getPaymentMethods(ctx: TenantContext) {
  ctx.assert("receivable.read");

  return ctx.db
    .selectFrom("payment_method")
    .select(["id", "name", "kind", "affects_cash_session", "max_installments"])
    .where("is_active", "=", true)
    .orderBy("name", "asc")
    .execute();
}

/** Recebimentos de uma parcela, para a tela poder estornar o certo. */
export async function getInstallmentPayments(ctx: TenantContext, installmentId: string) {
  ctx.assert("receivable.read");

  const parcela = await ctx.db
    .selectFrom("installment")
    .select("id")
    .where("id", "=", installmentId)
    .executeTakeFirst();

  if (!parcela) throw new NotFound("Parcela");

  return ctx.db
    .selectFrom("payment as p")
    .innerJoin("payment_method as pm", "pm.id", "p.payment_method_id")
    .leftJoin("membership as m", "m.id", "p.created_by")
    .leftJoin("app_user as u", "u.id", "m.user_id")
    .select([
      "p.id", "p.amount_cents", "p.status", "p.paid_at", "p.notes",
      "p.reversal_reason", "pm.name as method", "u.full_name as by",
    ])
    .where("p.installment_id", "=", installmentId)
    .orderBy("p.paid_at", "desc")
    .execute();
}
