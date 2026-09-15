/**
 * Escritas de orcamento.
 *
 * Duas coisas nao sao decididas aqui, de proposito:
 *
 * - O TOTAL. `quote.total_cents` e coluna gerada e `subtotal_cents` vem de
 *   trigger sobre os itens. Nao existe caminho em que o total e os itens
 *   discordem — nem por update parcial, nem por importacao, nem por script.
 * - O TETO DE DESCONTO. A regra vive no trigger `check_quote_discount`, que
 *   combina o limite da tabela de precos com a alcada do papel. Este arquivo
 *   so decide se PEDE aprovacao antes de tentar.
 */
import { createHash } from "node:crypto";
import type { TenantContext } from "@/server/context";
import { Forbidden, NotFound, ValidationError } from "@/shared/errors";
import { toValidationError } from "@/shared/zod";
import {
  acceptQuoteSchema,
  addItemSchema,
  changeQuoteStatusSchema,
  createQuoteSchema,
  setDiscountSchema,
  setTermsSchema,
  type AcceptQuoteInput,
  type AddItemInput,
  type ChangeQuoteStatusInput,
  type CreateQuoteInput,
  type SetDiscountInput,
  type SetTermsInput,
} from "@/modules/quote/schema";

/** Status em que o orcamento ainda aceita edicao de itens e condicoes. */
const EDITAVEL = ["draft", "negotiating"] as const;

export async function createQuote(
  ctx: TenantContext,
  input: CreateQuoteInput,
): Promise<{ id: string; number: number }> {
  ctx.assert("quote.write");

  const parsed = createQuoteSchema.safeParse(input);
  if (!parsed.success) throw toValidationError(parsed.error, "Confira os dados do orçamento.");
  const data = parsed.data;

  const validade = new Date();
  validade.setDate(validade.getDate() + data.validDays);

  // Sem profissional no orcamento nao ha a quem comissionar, e a comissao
  // nasce do recebimento deste documento. O padrao segue o plano de
  // tratamento que originou a proposta; na falta dele, quem esta criando —
  // desde que atenda.
  const profissional =
    data.providerId ??
    (await profissionalDoPlano(ctx, data.planItemIds)) ??
    (ctx.session.isProvider ? ctx.session.membershipId : null);

  const quote = await ctx.db
    .insertInto("quote")
    .values({
      tenant_id: ctx.session.tenantId,
      unit_id: ctx.unitId(),
      patient_id: data.patientId,
      provider_id: profissional,
      payer_id: data.payerId ?? null,
      created_by: ctx.session.membershipId,
      title: data.title,
      notes: data.notes,
      valid_until: validade.toISOString().slice(0, 10),
    })
    .returning(["id", "number"])
    .executeTakeFirstOrThrow();

  if (data.planItemIds.length > 0) {
    await trazerDoPlano(ctx, quote.id as string, data.planItemIds);
  }

  return { id: quote.id as string, number: Number(quote.number) };
}

/**
 * Traz itens do plano de tratamento para o orcamento.
 *
 * O preco vem de `resolve_price` na data de hoje e fica CONGELADO no item.
 * Reajustar a tabela amanha nao muda a proposta que o paciente recebeu — que e
 * a razao de a tabela de precos ser versionada.
 */
async function trazerDoPlano(
  ctx: TenantContext,
  quoteId: string,
  planItemIds: string[],
): Promise<void> {
  const itens = await ctx.db
    .selectFrom("treatment_plan_item as i")
    .innerJoin("treatment_plan as p", "p.id", "i.treatment_plan_id")
    .select([
      "i.id", "i.description", "i.tooth_code", "i.surfaces", "i.region_code",
      "i.quantity", "i.unit_price_cents", "i.procedure_id",
    ])
    .where("i.id", "in", planItemIds)
    .where("i.status", "=", "planned")
    .where("i.quote_item_id", "is", null)
    .orderBy("i.sort_order", "asc")
    .execute();

  let ordem = 0;

  for (const item of itens) {
    const preco = item.procedure_id
      ? await resolverPreco(ctx, item.procedure_id)
      : null;

    const novo = await ctx.db
      .insertInto("quote_item")
      .values({
        tenant_id: ctx.session.tenantId,
        quote_id: quoteId,
        procedure_id: item.procedure_id,
        description: item.description,
        tooth_code: item.tooth_code,
        surfaces: item.surfaces,
        region_code: item.region_code,
        quantity: String(item.quantity),
        unit_price_cents: preco?.priceCents ?? item.unit_price_cents,
        unit_cost_cents: preco?.costCents ?? 0,
        price_list_item_id: preco?.itemId ?? null,
        sort_order: ordem++,
      })
      .returning("id")
      .executeTakeFirstOrThrow();

    // O vinculo nos dois sentidos: o plano sabe que virou proposta, e a
    // proposta sabe de onde veio. Sem isso, o mesmo procedimento entra em dois
    // orcamentos e a clinica cobra duas vezes.
    await ctx.db
      .updateTable("treatment_plan_item")
      .set({ quote_item_id: novo.id })
      .where("id", "=", item.id)
      .execute();
  }
}

/** O profissional responsavel pelo plano de onde vieram os itens. */
async function profissionalDoPlano(
  ctx: TenantContext,
  planItemIds: string[],
): Promise<string | null> {
  if (planItemIds.length === 0) return null;

  const row = await ctx.db
    .selectFrom("treatment_plan_item as i")
    .innerJoin("treatment_plan as p", "p.id", "i.treatment_plan_id")
    .select("p.provider_id")
    .where("i.id", "in", planItemIds)
    .executeTakeFirst();

  return row?.provider_id ?? null;
}

async function resolverPreco(
  ctx: TenantContext,
  procedureId: string,
): Promise<{ itemId: string; priceCents: number; costCents: number } | null> {
  const row = await ctx.db
    .selectFrom("price_list as pl")
    .innerJoin("price_list_item as pli", "pli.price_list_id", "pl.id")
    .select(["pli.id", "pli.price_cents", "pli.expected_cost_cents"])
    .where("pli.procedure_id", "=", procedureId)
    .where("pl.status", "=", "active")
    .orderBy("pl.valid_from", "desc")
    .limit(1)
    .executeTakeFirst();

  if (!row) return null;

  return {
    itemId: row.id as string,
    priceCents: row.price_cents,
    costCents: row.expected_cost_cents,
  };
}

export async function addQuoteItem(
  ctx: TenantContext,
  input: AddItemInput,
): Promise<{ id: string }> {
  ctx.assert("quote.write");

  const parsed = addItemSchema.safeParse(input);
  if (!parsed.success) throw toValidationError(parsed.error, "Confira os dados do item.");
  const data = parsed.data;

  await exigirEditavel(ctx, data.quoteId);

  const preco = data.procedureId ? await resolverPreco(ctx, data.procedureId) : null;

  const row = await ctx.db
    .insertInto("quote_item")
    .values({
      tenant_id: ctx.session.tenantId,
      quote_id: data.quoteId,
      procedure_id: data.procedureId ?? null,
      description: data.description,
      tooth_code: data.toothCode,
      region_code: data.regionCode,
      quantity: String(data.quantity),
      unit_price_cents: data.unitPriceCents,
      unit_cost_cents: preco?.costCents ?? 0,
      discount_cents: data.discountCents,
      price_list_item_id: preco?.itemId ?? null,
    })
    .returning("id")
    .executeTakeFirstOrThrow();

  return { id: row.id as string };
}

export async function removeQuoteItem(ctx: TenantContext, itemId: string): Promise<void> {
  ctx.assert("quote.write");

  const item = await ctx.db
    .selectFrom("quote_item")
    .select(["id", "quote_id"])
    .where("id", "=", itemId)
    .executeTakeFirst();

  if (!item) throw new NotFound("Item");
  await exigirEditavel(ctx, item.quote_id);

  // O item do plano volta a ficar disponivel para outro orcamento.
  await ctx.db
    .updateTable("treatment_plan_item")
    .set({ quote_item_id: null })
    .where("quote_item_id", "=", itemId)
    .execute();

  await ctx.db.deleteFrom("quote_item").where("id", "=", itemId).execute();
}

/**
 * Desconto de cabecalho.
 *
 * Quem nao tem alcada pode pedir aprovacao na mesma acao, e ai o teto passa a
 * ser o de quem aprovou. A checagem final continua sendo do banco: aqui so
 * decidimos se carimbamos a aprovacao antes de tentar.
 */
export async function setQuoteDiscount(
  ctx: TenantContext,
  input: SetDiscountInput,
): Promise<void> {
  ctx.assert("quote.write");

  const parsed = setDiscountSchema.safeParse(input);
  if (!parsed.success) throw toValidationError(parsed.error, "Confira o desconto.");
  const data = parsed.data;

  await exigirEditavel(ctx, data.quoteId);

  if (data.approve && !ctx.can("quote.approve_discount")) {
    throw new Forbidden(
      "Seu perfil não aprova desconto acima do teto.",
      "quote.approve_discount",
    );
  }

  await ctx.db
    .updateTable("quote")
    .set({
      discount_cents: data.discountCents,
      ...(data.approve
        ? { discount_approved_by: ctx.session.membershipId, discount_approved_at: new Date() }
        : {}),
    })
    .where("id", "=", data.quoteId)
    .execute();
}

export async function setQuoteTerms(ctx: TenantContext, input: SetTermsInput): Promise<void> {
  ctx.assert("quote.write");

  const parsed = setTermsSchema.safeParse(input);
  if (!parsed.success) throw toValidationError(parsed.error, "Confira as condições.");
  const data = parsed.data;

  await exigirEditavel(ctx, data.quoteId);

  await ctx.db
    .updateTable("quote")
    .set({
      installment_count: data.installmentCount,
      down_payment_cents: data.downPaymentCents,
      valid_until: data.validUntil ?? null,
    })
    .where("id", "=", data.quoteId)
    .execute();
}

export async function changeQuoteStatus(
  ctx: TenantContext,
  input: ChangeQuoteStatusInput,
): Promise<{ status: string }> {
  ctx.assert("quote.write");

  const parsed = changeQuoteStatusSchema.safeParse(input);
  if (!parsed.success) throw toValidationError(parsed.error, "Confira a mudança de status.");
  const data = parsed.data;

  if (data.to === "rejected" && !data.lossReasonId) {
    throw new ValidationError(
      { lossReasonId: ["Escolha o motivo da perda."] },
      "Orçamento perdido precisa de motivo — é o que alimenta o relatório de perda.",
    );
  }

  const row = await ctx.db
    .updateTable("quote")
    .set({
      status: data.to,
      ...(data.to === "sent" ? { sent_at: new Date() } : {}),
      ...(data.to === "rejected"
        ? {
            rejected_at: new Date(),
            loss_reason_id: data.lossReasonId ?? null,
            loss_notes: data.lossNotes ?? null,
          }
        : {}),
    })
    .where("id", "=", data.quoteId)
    .where("deleted_at", "is", null)
    .returning("status")
    .executeTakeFirst();

  if (!row) throw new NotFound("Orçamento");
  return { status: row.status };
}

/**
 * Aceite do paciente.
 *
 * Assinatura eletronica simples: hash do conteudo do orcamento, de quem
 * assinou e de quando, mais o IP. Nao prova identidade como um certificado
 * ICP-Brasil, mas detecta adulteracao — e o `quote_accepted_signature` do banco
 * recusa um aceite sem ela.
 */
export async function acceptQuote(ctx: TenantContext, input: AcceptQuoteInput): Promise<void> {
  ctx.assert("quote.accept");

  const parsed = acceptQuoteSchema.safeParse(input);
  if (!parsed.success) throw toValidationError(parsed.error, "Confira o aceite.");
  const data = parsed.data;

  const quote = await ctx.db
    .selectFrom("quote")
    .select(["id", "number", "total_cents", "status"])
    .where("id", "=", data.quoteId)
    .where("deleted_at", "is", null)
    .executeTakeFirst();

  if (!quote) throw new NotFound("Orçamento");

  const agora = new Date();
  const hash = createHash("sha256")
    .update(
      `${quote.id}|${quote.number}|${quote.total_cents}|${data.signedBy}|${agora.toISOString()}`,
    )
    .digest("hex");

  await ctx.db
    .updateTable("quote")
    .set({
      status: "accepted",
      accepted_at: agora,
      signed_hash: hash,
      signed_ip: ctx.request.ip ?? null,
      signed_user_agent: `${data.signedBy} · ${ctx.request.userAgent ?? "sem navegador"}`,
    })
    .where("id", "=", data.quoteId)
    .execute();
}

async function exigirEditavel(ctx: TenantContext, quoteId: string): Promise<void> {
  const quote = await ctx.db
    .selectFrom("quote")
    .select("status")
    .where("id", "=", quoteId)
    .where("deleted_at", "is", null)
    .executeTakeFirst();

  if (!quote) throw new NotFound("Orçamento");

  if (!EDITAVEL.includes(quote.status as (typeof EDITAVEL)[number])) {
    throw new ValidationError(
      { _: ["Orçamento fechado não se edita."] },
      "Este orçamento não está mais em edição. Reabra para negociação antes de alterar.",
    );
  }
}
