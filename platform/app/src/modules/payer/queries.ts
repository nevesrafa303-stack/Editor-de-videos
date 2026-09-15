/**
 * Consultas de convenio.
 *
 * A tabela de preco de um convenio e comparada com a particular o tempo todo:
 * a pergunta que a clinica faz nao e "quanto o convenio paga", e "quanto eu
 * deixo de ganhar". Por isso as duas vem juntas em toda consulta daqui.
 */
import { sql } from "kysely";
import type { TenantContext } from "@/server/context";
import { NotFound } from "@/shared/errors";
import type { BillingMode, PayerKind } from "@/modules/payer/schema";

export type PayerRow = {
  id: string;
  code: string;
  name: string;
  kind: PayerKind;
  billingMode: BillingMode;
  settlementDays: number;
  adminFeePercent: number;
  isActive: boolean;
  notes: string | null;
  /** Quantos procedimentos ja tem preco proprio. */
  precos: number;
};

export async function listPayers(ctx: TenantContext): Promise<PayerRow[]> {
  ctx.assert("price.read");

  const rows = await ctx.db
    .selectFrom("payer as p")
    .select([
      "p.id", "p.code", "p.name", "p.kind", "p.billing_mode",
      "p.settlement_days", "p.admin_fee_percent", "p.is_active", "p.notes",
      (eb) =>
        eb
          .selectFrom("price_list as pl")
          .innerJoin("price_list_item as pli", "pli.price_list_id", "pl.id")
          .select((e) => e.fn.countAll<number>().as("n"))
          .whereRef("pl.payer_id", "=", "p.id")
          .where("pl.status", "=", "active")
          .as("precos"),
    ])
    .orderBy("p.is_active", "desc")
    .orderBy("p.name", "asc")
    .execute();

  return rows.map((p) => ({
    id: p.id as string,
    code: p.code,
    name: p.name,
    kind: p.kind as PayerKind,
    billingMode: p.billing_mode as BillingMode,
    settlementDays: p.settlement_days,
    adminFeePercent: Number(p.admin_fee_percent),
    isActive: p.is_active,
    notes: p.notes,
    precos: Number(p.precos ?? 0),
  }));
}

export type PayerPriceRow = {
  procedureId: string;
  procedureName: string;
  categoria: string | null;
  particularCents: number | null;
  convenioCents: number | null;
  maxDiscountPercent: number;
  custoCents: number;
  /** Parte do paciente. Só faz sentido em convênio faturado por guia. */
  patientShareCents: number;
};

export type PayerDetail = {
  payer: PayerRow;
  precos: PayerPriceRow[];
  /** Soma das diferenças: o que a clínica abre mão por atender este convênio. */
  diferencaCents: number;
};

export async function getPayer(ctx: TenantContext, payerId: string): Promise<PayerDetail> {
  ctx.assert("price.read");

  const todos = await listPayers(ctx);
  const payer = todos.find((p) => p.id === payerId);
  if (!payer) throw new NotFound("Convênio");

  // Um procedimento por linha, com o preço particular e o do convênio lado a
  // lado. `resolve_price` decide cada um — a precedência é do banco.
  const linhas = await sql<{
    procedure_id: string;
    procedure_name: string;
    categoria: string | null;
    particular_cents: number | null;
    convenio_cents: number | null;
    max_discount_percent: number | null;
    custo_cents: number | null;
    patient_share_cents: number | null;
  }>`
    select
      pr.id as procedure_id,
      pr.name as procedure_name,
      pc.name as categoria,
      (select rp.price_cents from resolve_price(
        ${ctx.session.tenantId}::uuid, pr.id, ${ctx.session.activeUnitId}::uuid, null) rp
      ) as particular_cents,
      pli.price_cents as convenio_cents,
      pli.max_discount_percent,
      pli.expected_cost_cents as custo_cents,
      pli.patient_share_cents
    from procedure pr
    left join procedure_category pc on pc.id = pr.category_id
    left join price_list pl
      on pl.payer_id = ${payerId}::uuid and pl.status = 'active'
    left join price_list_item pli
      on pli.price_list_id = pl.id and pli.procedure_id = pr.id
    where pr.is_active
    order by pc.name nulls last, pr.name
  `.execute(ctx.db);

  const precos = linhas.rows.map((r) => ({
    procedureId: r.procedure_id,
    procedureName: r.procedure_name,
    categoria: r.categoria,
    particularCents: r.particular_cents === null ? null : Number(r.particular_cents),
    convenioCents: r.convenio_cents === null ? null : Number(r.convenio_cents),
    maxDiscountPercent: Number(r.max_discount_percent ?? 0),
    custoCents: Number(r.custo_cents ?? 0),
    patientShareCents: Number(r.patient_share_cents ?? 0),
  }));

  const diferencaCents = precos.reduce(
    (soma, p) =>
      p.convenioCents !== null && p.particularCents !== null
        ? soma + (p.particularCents - p.convenioCents)
        : soma,
    0,
  );

  return { payer, precos, diferencaCents };
}

/** Convenios ativos, para o seletor do orcamento. */
export async function listActivePayers(ctx: TenantContext) {
  ctx.assert("quote.read");

  const rows = await ctx.db
    .selectFrom("payer")
    .select(["id", "name", "billing_mode"])
    .where("is_active", "=", true)
    .orderBy("name", "asc")
    .execute();

  return rows.map((p) => ({
    id: p.id as string,
    name: p.name,
    billingMode: p.billing_mode as BillingMode,
  }));
}
