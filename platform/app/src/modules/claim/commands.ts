/**
 * Escritas de faturamento por guia.
 *
 * Quase nada aqui calcula dinheiro. As somas da guia e do lote vem de trigger,
 * a glosa nasce dentro de `settle_claim_item` e o prazo de recurso sai do
 * demonstrativo — tudo no banco. Este arquivo decide PERMISSAO e ORDEM: quem
 * pode enviar um lote, quem pode conferir um repasse, e o que precisa estar
 * pronto antes.
 */
import { sql } from "kysely";
import type { TenantContext } from "@/server/context";
import { NotFound, ValidationError } from "@/shared/errors";
import { toValidationError } from "@/shared/zod";
import {
  addToBatchSchema,
  authorizationSchema,
  resolveDenialSchema,
  settleItemSchema,
  type AddToBatchInput,
  type AuthorizationInput,
  type ResolveDenialInput,
  type SettleItemInput,
} from "@/modules/claim/schema";

/**
 * Leva guias para o lote da competencia.
 *
 * O lote e por CONVENIO e UNIDADE, entao guias de convenios diferentes viram
 * lotes diferentes na mesma acao — o que e o certo: convenio nao recebe lote
 * misturado. `open_claim_batch` cria o que faltar e e idempotente.
 */
export async function addClaimsToBatch(
  ctx: TenantContext,
  input: AddToBatchInput,
): Promise<{ lotes: number; guias: number }> {
  ctx.assert("claim.write");

  const parsed = addToBatchSchema.safeParse(input);
  if (!parsed.success) throw toValidationError(parsed.error, "Confira as guias.");
  const data = parsed.data;

  const guias = await ctx.db
    .selectFrom("claim")
    .select(["id", "unit_id", "payer_id", "status"])
    .where("id", "in", data.claimIds)
    .execute();

  const disponiveis = guias.filter((g) => g.status === "open");

  if (disponiveis.length === 0) {
    throw new ValidationError(
      { claimIds: ["Nenhuma destas guias está esperando lote."] },
      "Essas guias já foram faturadas ou canceladas.",
    );
  }

  const competencia = data.competence ?? new Date().toISOString().slice(0, 10);
  const lotes = new Set<string>();

  for (const guia of disponiveis) {
    const resultado = await sql<{ open_claim_batch: string }>`
      select open_claim_batch(
        ${ctx.session.tenantId}::uuid,
        ${guia.unit_id}::uuid,
        ${guia.payer_id}::uuid,
        ${competencia}::date,
        ${ctx.session.membershipId}::uuid
      )
    `.execute(ctx.db);

    const loteId = resultado.rows[0]?.open_claim_batch;
    if (!loteId) continue;

    await ctx.db
      .updateTable("claim")
      .set({ batch_id: loteId, status: "batched" })
      .where("id", "=", guia.id)
      .execute();

    lotes.add(loteId);
  }

  return { lotes: lotes.size, guias: disponiveis.length };
}

/** Tira a guia do lote e devolve para a fila. So antes do envio. */
export async function removeClaimFromBatch(
  ctx: TenantContext,
  claimId: string,
): Promise<void> {
  ctx.assert("claim.write");

  const guia = await ctx.db
    .selectFrom("claim")
    .select(["id", "status"])
    .where("id", "=", claimId)
    .executeTakeFirst();

  if (!guia) throw new NotFound("Guia");

  // A transicao batched -> open existe na maquina de estados; qualquer outro
  // estado o banco recusa, e a mensagem dele e melhor que uma nossa.
  await ctx.db
    .updateTable("claim")
    .set({ batch_id: null, status: "open" })
    .where("id", "=", claimId)
    .execute();
}

export async function submitBatch(
  ctx: TenantContext,
  batchId: string,
): Promise<{ guias: number }> {
  ctx.assert("claim.submit");

  const resultado = await sql<{ submit_claim_batch: number }>`
    select submit_claim_batch(${batchId}::uuid, ${ctx.session.membershipId}::uuid)
  `.execute(ctx.db);

  return { guias: Number(resultado.rows[0]?.submit_claim_batch ?? 0) };
}

/**
 * Registra a data do demonstrativo.
 *
 * Vem antes da conferencia de proposito: e dela que sai o prazo de recurso de
 * toda glosa do lote. Conferir primeiro e datar depois deixaria as glosas com
 * prazo contado de hoje, que e mais do que a clinica realmente tem.
 */
export async function setRemittanceDate(
  ctx: TenantContext,
  batchId: string,
  date: string,
): Promise<void> {
  ctx.assert("claim.settle");

  const row = await ctx.db
    .updateTable("claim_batch")
    .set({ remittance_date: date })
    .where("id", "=", batchId)
    .returning("id")
    .executeTakeFirst();

  if (!row) throw new NotFound("Lote");
}

export async function settleItem(
  ctx: TenantContext,
  input: SettleItemInput,
): Promise<{ glosou: boolean }> {
  ctx.assert("claim.settle");

  const parsed = settleItemSchema.safeParse(input);
  if (!parsed.success) throw toValidationError(parsed.error, "Confira a conferência.");
  const data = parsed.data;

  const resultado = await sql<{ settle_claim_item: string | null }>`
    select settle_claim_item(
      ${data.itemId}::uuid,
      ${data.paidCents}::bigint,
      ${data.reasonCode}::text,
      ${data.reason}::text
    )
  `.execute(ctx.db);

  return { glosou: resultado.rows[0]?.settle_claim_item != null };
}

export async function settleBatch(
  ctx: TenantContext,
  batchId: string,
): Promise<{ guias: number }> {
  ctx.assert("claim.settle");

  const resultado = await sql<{ settle_claim_batch: number }>`
    select settle_claim_batch(${batchId}::uuid)
  `.execute(ctx.db);

  return { guias: Number(resultado.rows[0]?.settle_claim_batch ?? 0) };
}

export async function resolveDenial(
  ctx: TenantContext,
  input: ResolveDenialInput,
): Promise<void> {
  ctx.assert("claim.appeal");

  const parsed = resolveDenialSchema.safeParse(input);
  if (!parsed.success) throw toValidationError(parsed.error, "Confira o desfecho da glosa.");
  const data = parsed.data;

  await sql`
    select resolve_claim_denial(
      ${data.denialId}::uuid,
      ${data.status}::claim_denial_status,
      ${data.recoveredCents}::bigint,
      ${data.notes}::text
    )
  `.execute(ctx.db);
}

/**
 * Numero da autorizacao, anotado a mao.
 *
 * Sem ele, auditoria do convenio glosa o que ja foi pago — e a clinica devolve
 * dinheiro meses depois, quando o procedimento ja foi feito e o insumo, gasto.
 */
export async function setClaimAuthorization(
  ctx: TenantContext,
  input: AuthorizationInput,
): Promise<void> {
  ctx.assert("claim.write");

  const parsed = authorizationSchema.safeParse(input);
  if (!parsed.success) throw toValidationError(parsed.error, "Confira a autorização.");
  const data = parsed.data;

  const row = await ctx.db
    .updateTable("claim")
    .set({
      authorization_code: data.code,
      authorization_valid_until: data.validUntil,
    })
    .where("id", "=", data.claimId)
    .returning("id")
    .executeTakeFirst();

  if (!row) throw new NotFound("Guia");
}
