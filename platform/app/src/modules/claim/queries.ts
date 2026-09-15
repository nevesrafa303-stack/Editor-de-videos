/**
 * Consultas de faturamento por guia.
 *
 * Toda consulta daqui responde a uma pergunta de dinheiro que o particular nao
 * faz: "o que ja executei e ainda nao faturei", "o que faturei e ainda nao
 * recebi", "o que o convenio recusou e ate quando da para recorrer". Sao tres
 * filas distintas, e por isso a tela de faturamento nao e uma lista so.
 */
import { sql } from "kysely";
import type { TenantContext } from "@/server/context";
import { NotFound } from "@/shared/errors";
import type { BatchStatus, ClaimStatus, DenialStatus } from "@/modules/claim/schema";

export type ClaimSummary = {
  /** Executado, guia emitida, ainda sem lote. */
  aFaturarCents: number;
  aFaturarCount: number;
  /**
   * Enviado ao convenio e ainda sem resposta.
   *
   * Desconta o que JA foi glosado: glosa nao esta esperando repasse, esta
   * esperando recurso, e ela tem coluna propria. Sem descontar, o mesmo
   * dinheiro aparecia nas duas — e quem somasse as colunas veria o dobro do
   * que a clinica tem a receber.
   */
  enviadoCents: number;
  enviadoCount: number;
  /** Glosa sem desfecho. */
  glosadoCents: number;
  glosadoCount: number;
  /** Glosa cujo prazo de recurso vence nos proximos 7 dias. */
  vencendoCount: number;
  /** Glosa que perdeu o prazo sem ninguem recorrer. */
  vencidoCents: number;
};

export async function getClaimSummary(ctx: TenantContext): Promise<ClaimSummary> {
  ctx.assert("claim.read");

  const linha = await sql<{
    a_faturar_cents: number; a_faturar_count: number;
    enviado_cents: number; enviado_count: number;
    glosado_cents: number; glosado_count: number;
    vencendo_count: number; vencido_cents: number;
  }>`
    select
      coalesce(sum(c.billed_cents) filter (where c.status = 'open'), 0) as a_faturar_cents,
      count(*) filter (where c.status = 'open')                          as a_faturar_count,
      coalesce(sum(c.billed_cents - c.paid_cents - c.denied_cents)
               filter (where c.status in ('batched', 'submitted')), 0)   as enviado_cents,
      count(*) filter (where c.status in ('batched', 'submitted'))       as enviado_count,
      coalesce((select sum(d.amount_cents - d.recovered_cents) from claim_denial d
                 where d.status in ('open', 'appealed', 'expired')), 0)  as glosado_cents,
      coalesce((select count(*) from claim_denial d
                 where d.status in ('open', 'appealed', 'expired')), 0)  as glosado_count,
      coalesce((select count(*) from claim_denial d
                 where d.status = 'open'
                   and d.appeal_deadline between current_date and current_date + 7), 0)
                                                                         as vencendo_count,
      coalesce((select sum(d.amount_cents) from claim_denial d
                 where d.status = 'expired'), 0)                         as vencido_cents
    from claim c
    where c.status <> 'canceled'
  `.execute(ctx.db);

  const r = linha.rows[0];

  return {
    aFaturarCents: Number(r?.a_faturar_cents ?? 0),
    aFaturarCount: Number(r?.a_faturar_count ?? 0),
    enviadoCents: Number(r?.enviado_cents ?? 0),
    enviadoCount: Number(r?.enviado_count ?? 0),
    glosadoCents: Number(r?.glosado_cents ?? 0),
    glosadoCount: Number(r?.glosado_count ?? 0),
    vencendoCount: Number(r?.vencendo_count ?? 0),
    vencidoCents: Number(r?.vencido_cents ?? 0),
  };
}

export type ClaimRow = {
  id: string;
  number: number | null;
  status: ClaimStatus;
  patientId: string;
  patientName: string;
  payerId: string;
  payerName: string;
  billedCents: number;
  paidCents: number;
  deniedCents: number;
  issuedOn: string;
  authorizationCode: string | null;
  itemCount: number;
};

/** As guias emitidas que ainda nao entraram em lote: a fila do faturamento. */
export async function listPendingClaims(ctx: TenantContext): Promise<ClaimRow[]> {
  ctx.assert("claim.read");
  return listClaimsWhere(ctx, (q) => q.where("c.status", "=", "open"));
}

export async function listClaimsOfBatch(
  ctx: TenantContext,
  batchId: string,
): Promise<ClaimRow[]> {
  ctx.assert("claim.read");
  return listClaimsWhere(ctx, (q) => q.where("c.batch_id", "=", batchId));
}

type ClaimQuery = ReturnType<typeof baseClaimQuery>;

function baseClaimQuery(ctx: TenantContext) {
  return ctx.db
    .selectFrom("claim as c")
    .innerJoin("patient as p", "p.id", "c.patient_id")
    .innerJoin("payer as pay", "pay.id", "c.payer_id")
    .select([
      "c.id", "c.number", "c.status", "c.billed_cents", "c.paid_cents",
      "c.denied_cents", "c.issued_on", "c.authorization_code",
      "c.patient_id", "p.full_name as patient_name",
      "c.payer_id", "pay.name as payer_name",
      (eb) =>
        eb
          .selectFrom("claim_item as ci")
          .select((e) => e.fn.countAll<number>().as("n"))
          .whereRef("ci.claim_id", "=", "c.id")
          .as("item_count"),
    ]);
}

async function listClaimsWhere(
  ctx: TenantContext,
  filtro: (q: ClaimQuery) => ClaimQuery,
): Promise<ClaimRow[]> {
  const rows = await filtro(baseClaimQuery(ctx))
    .where("c.status", "<>", "canceled")
    .orderBy("pay.name", "asc")
    .orderBy("c.issued_on", "asc")
    .execute();

  return rows.map((c) => ({
    id: c.id as string,
    number: c.number === null ? null : Number(c.number),
    status: c.status as ClaimStatus,
    patientId: c.patient_id as string,
    patientName: c.patient_name,
    payerId: c.payer_id as string,
    payerName: c.payer_name,
    billedCents: Number(c.billed_cents),
    paidCents: Number(c.paid_cents),
    deniedCents: Number(c.denied_cents),
    issuedOn: c.issued_on as unknown as string,
    authorizationCode: c.authorization_code,
    itemCount: Number(c.item_count ?? 0),
  }));
}

export type BatchRow = {
  id: string;
  code: string | null;
  status: BatchStatus;
  payerId: string;
  payerName: string;
  competence: string;
  submittedAt: Date | null;
  remittanceDate: string | null;
  billedCents: number;
  paidCents: number;
  claimCount: number;
  /** Linhas ainda sem conferencia. Zero libera o fechamento do lote. */
  pendentes: number;
};

export async function listBatches(ctx: TenantContext): Promise<BatchRow[]> {
  ctx.assert("claim.read");

  const rows = await ctx.db
    .selectFrom("claim_batch as b")
    .innerJoin("payer as pay", "pay.id", "b.payer_id")
    .select([
      "b.id", "b.code", "b.status", "b.competence", "b.submitted_at",
      "b.remittance_date", "b.billed_cents", "b.paid_cents",
      "b.payer_id", "pay.name as payer_name",
      (eb) =>
        eb
          .selectFrom("claim as c")
          .select((e) => e.fn.countAll<number>().as("n"))
          .whereRef("c.batch_id", "=", "b.id")
          .where("c.status", "<>", "canceled")
          .as("claim_count"),
      (eb) =>
        eb
          .selectFrom("claim_item as ci")
          .innerJoin("claim as c2", "c2.id", "ci.claim_id")
          .select((e) => e.fn.countAll<number>().as("n"))
          .whereRef("c2.batch_id", "=", "b.id")
          .where("c2.status", "=", "submitted")
          .where("ci.paid_cents", "is", null)
          .as("pendentes"),
    ])
    .where("b.status", "<>", "canceled")
    .orderBy("b.competence", "desc")
    .orderBy("pay.name", "asc")
    .execute();

  return rows.map((b) => ({
    id: b.id as string,
    code: b.code,
    status: b.status as BatchStatus,
    payerId: b.payer_id as string,
    payerName: b.payer_name,
    competence: b.competence as unknown as string,
    submittedAt: b.submitted_at,
    remittanceDate: (b.remittance_date as unknown as string) ?? null,
    billedCents: Number(b.billed_cents),
    paidCents: Number(b.paid_cents),
    claimCount: Number(b.claim_count ?? 0),
    pendentes: Number(b.pendentes ?? 0),
  }));
}

export type ClaimItemRow = {
  id: string;
  description: string;
  toothCode: string | null;
  regionCode: string | null;
  quantity: number;
  billedCents: number;
  /** `null` = ainda nao conferido. Zero significa "conferido, nao pagaram nada". */
  paidCents: number | null;
  deniedCents: number;
};

export type ClaimDetail = {
  claim: ClaimRow;
  items: ClaimItemRow[];
  batch: { id: string; code: string | null; status: BatchStatus } | null;
  denials: DenialRow[];
};

export async function getClaim(ctx: TenantContext, claimId: string): Promise<ClaimDetail> {
  ctx.assert("claim.read");

  const [encontrada] = await listClaimsWhere(ctx, (q) => q.where("c.id", "=", claimId));
  if (!encontrada) throw new NotFound("Guia");

  const [itens, lote, glosas] = await Promise.all([
    ctx.db
      .selectFrom("claim_item")
      .select([
        "id", "description", "tooth_code", "region_code", "quantity",
        "billed_cents", "paid_cents", "denied_cents",
      ])
      .where("claim_id", "=", claimId)
      .orderBy("sort_order", "asc")
      .execute(),

    ctx.db
      .selectFrom("claim_batch as b")
      .innerJoin("claim as c", "c.batch_id", "b.id")
      .select(["b.id", "b.code", "b.status"])
      .where("c.id", "=", claimId)
      .executeTakeFirst(),

    listDenials(ctx, { claimId }),
  ]);

  return {
    claim: encontrada,
    items: itens.map((i) => ({
      id: i.id as string,
      description: i.description,
      toothCode: i.tooth_code,
      regionCode: i.region_code,
      quantity: Number(i.quantity),
      billedCents: Number(i.billed_cents),
      paidCents: i.paid_cents === null ? null : Number(i.paid_cents),
      deniedCents: Number(i.denied_cents),
    })),
    batch: lote
      ? { id: lote.id as string, code: lote.code, status: lote.status as BatchStatus }
      : null,
    denials: glosas,
  };
}

export type DenialRow = {
  id: string;
  claimId: string;
  claimNumber: number | null;
  itemDescription: string;
  patientName: string;
  payerName: string;
  amountCents: number;
  recoveredCents: number;
  reasonCode: string | null;
  reason: string;
  status: DenialStatus;
  appealDeadline: string | null;
  /** Dias ate o prazo. Negativo quando ja venceu. */
  diasParaPrazo: number | null;
  /** O que foi escrito ao recorrer, e o que o convenio respondeu. */
  appealNotes: string | null;
  resolutionNotes: string | null;
};

export async function listDenials(
  ctx: TenantContext,
  filtro: { claimId?: string; abertas?: boolean } = {},
): Promise<DenialRow[]> {
  ctx.assert("claim.read");

  let q = ctx.db
    .selectFrom("claim_denial as d")
    .innerJoin("claim_item as ci", "ci.id", "d.claim_item_id")
    .innerJoin("claim as c", "c.id", "d.claim_id")
    .innerJoin("patient as p", "p.id", "c.patient_id")
    .innerJoin("payer as pay", "pay.id", "c.payer_id")
    .select([
      "d.id", "d.claim_id", "c.number as claim_number", "ci.description",
      "p.full_name as patient_name", "pay.name as payer_name",
      "d.amount_cents", "d.recovered_cents", "d.reason_code", "d.reason",
      "d.status", "d.appeal_deadline", "d.appeal_notes", "d.resolution_notes",
      sql<number>`d.appeal_deadline - current_date`.as("dias"),
    ]);

  if (filtro.claimId) q = q.where("d.claim_id", "=", filtro.claimId);
  if (filtro.abertas) q = q.where("d.status", "in", ["open", "appealed", "expired"]);

  const rows = await q
    .orderBy("d.appeal_deadline", "asc")
    .orderBy("d.created_at", "asc")
    .execute();

  return rows.map((d) => ({
    id: d.id as string,
    claimId: d.claim_id as string,
    claimNumber: d.claim_number === null ? null : Number(d.claim_number),
    itemDescription: d.description,
    patientName: d.patient_name,
    payerName: d.payer_name,
    amountCents: Number(d.amount_cents),
    recoveredCents: Number(d.recovered_cents),
    reasonCode: d.reason_code,
    reason: d.reason,
    status: d.status as DenialStatus,
    appealDeadline: (d.appeal_deadline as unknown as string) ?? null,
    diasParaPrazo: d.dias === null ? null : Number(d.dias),
    appealNotes: d.appeal_notes,
    resolutionNotes: d.resolution_notes,
  }));
}

export type BatchDetail = {
  batch: BatchRow;
  claims: (ClaimRow & { items: ClaimItemRow[] })[];
};

export async function getBatch(ctx: TenantContext, batchId: string): Promise<BatchDetail> {
  ctx.assert("claim.read");

  const lote = (await listBatches(ctx)).find((b) => b.id === batchId);
  if (!lote) throw new NotFound("Lote");

  const guias = await listClaimsOfBatch(ctx, batchId);

  const linhas = await ctx.db
    .selectFrom("claim_item")
    .select([
      "id", "claim_id", "description", "tooth_code", "region_code", "quantity",
      "billed_cents", "paid_cents", "denied_cents",
    ])
    .where(
      "claim_id",
      "in",
      guias.length > 0 ? guias.map((g) => g.id) : [""],
    )
    .orderBy("sort_order", "asc")
    .execute();

  return {
    batch: lote,
    claims: guias.map((g) => ({
      ...g,
      items: linhas
        .filter((i) => i.claim_id === g.id)
        .map((i) => ({
          id: i.id as string,
          description: i.description,
          toothCode: i.tooth_code,
          regionCode: i.region_code,
          quantity: Number(i.quantity),
          billedCents: Number(i.billed_cents),
          paidCents: i.paid_cents === null ? null : Number(i.paid_cents),
          deniedCents: Number(i.denied_cents),
        })),
    })),
  };
}
