/**
 * Consultas de orcamento.
 *
 * O orcamento e o documento que liga o clinico ao dinheiro: nasce do plano de
 * tratamento e, quando aceito, vira parcela a receber. Por isso tudo aqui
 * carrega o total e o status juntos — numero sem estado nao decide nada.
 */
import { sql } from "kysely";
import type { TenantContext } from "@/server/context";
import { NotFound } from "@/shared/errors";
import { listQuotesSchema, type ListQuotesInput, type QuoteStatus } from "@/modules/quote/schema";

export type QuoteListItem = {
  id: string;
  number: number;
  patientId: string;
  patientName: string;
  title: string | null;
  status: QuoteStatus;
  subtotalCents: number;
  discountCents: number;
  totalCents: number;
  validUntil: string | null;
  sentAt: Date | null;
  createdAt: Date;
  itemCount: number;
};

export async function listQuotes(
  ctx: TenantContext,
  input: ListQuotesInput = {},
): Promise<{ items: QuoteListItem[]; total: number; totals: Record<string, number> }> {
  ctx.assert("quote.read");
  const filter = listQuotesSchema.parse(input);

  let base = ctx.db.selectFrom("quote as q").where("q.deleted_at", "is", null);

  if (filter.status) base = base.where("q.status", "=", filter.status);
  if (filter.patientId) base = base.where("q.patient_id", "=", filter.patientId);

  if (filter.search) {
    const termo = `%${filter.search}%`;
    const numero = Number(filter.search.replace(/\D/g, ""));

    base = base.where((eb) =>
      eb.or([
        eb("q.title", "ilike", termo),
        eb.exists(
          eb
            .selectFrom("patient as p")
            .select("p.id")
            .whereRef("p.id", "=", "q.patient_id")
            .where("p.full_name", "ilike", termo),
        ),
        ...(Number.isFinite(numero) && numero > 0 ? [eb("q.number", "=", numero)] : []),
      ]),
    );
  }

  const [rows, contagem, porStatus] = await Promise.all([
    base
      .innerJoin("patient as p", "p.id", "q.patient_id")
      .select([
        "q.id", "q.number", "q.patient_id", "p.full_name as patient_name", "q.title",
        "q.status", "q.subtotal_cents", "q.discount_cents", "q.total_cents",
        "q.valid_until", "q.sent_at", "q.created_at",
        (eb) =>
          eb
            .selectFrom("quote_item as qi")
            .select((e) => e.fn.countAll<number>().as("n"))
            .whereRef("qi.quote_id", "=", "q.id")
            .as("item_count"),
      ])
      .orderBy("q.created_at", "desc")
      .limit(filter.limit)
      .offset(filter.offset)
      .execute(),

    base.select((eb) => eb.fn.countAll<number>().as("total")).executeTakeFirst(),

    // Quanto dinheiro esta parado em cada estagio. E a pergunta que o dono faz
    // primeiro: "quanto tenho em proposta esperando resposta?"
    ctx.db
      .selectFrom("quote")
      .select(["status", (eb) => eb.fn.sum<number>("total_cents").as("soma")])
      .where("deleted_at", "is", null)
      .groupBy("status")
      .execute(),
  ]);

  return {
    items: rows.map((r) => ({
      id: r.id as string,
      number: Number(r.number),
      patientId: r.patient_id,
      patientName: r.patient_name,
      title: r.title,
      status: r.status as QuoteStatus,
      subtotalCents: r.subtotal_cents,
      discountCents: r.discount_cents,
      totalCents: r.total_cents ?? 0,
      validUntil: r.valid_until,
      sentAt: r.sent_at,
      createdAt: r.created_at,
      itemCount: Number(r.item_count ?? 0),
    })),
    total: Number(contagem?.total ?? 0),
    totals: Object.fromEntries(porStatus.map((s) => [s.status, Number(s.soma ?? 0)])),
  };
}

export type QuoteDetail = {
  id: string;
  number: number;
  status: QuoteStatus;
  title: string | null;
  notes: string | null;
  patient: { id: string; name: string; phone: string };
  provider: string | null;
  createdBy: string | null;
  subtotalCents: number;
  discountCents: number;
  totalCents: number;
  expectedCostCents: number;
  downPaymentCents: number;
  installmentCount: number;
  validUntil: string | null;
  sentAt: Date | null;
  acceptedAt: Date | null;
  createdAt: Date;
  discountApprovedBy: string | null;
  items: {
    id: string;
    description: string;
    toothCode: string | null;
    regionCode: string | null;
    quantity: number;
    unitPriceCents: number;
    discountCents: number;
    totalCents: number;
  }[];
  historico: { id: string; from: string | null; to: string; at: Date; by: string | null }[];
  /** Teto de desconto de quem esta olhando, e o da tabela de precos. */
  ceiling: { roleCents: number; tableCents: number; effectiveCents: number; rolePercent: number };
  can: { write: boolean; approveDiscount: boolean; accept: boolean };
};

export async function getQuote(ctx: TenantContext, quoteId: string): Promise<QuoteDetail> {
  ctx.assert("quote.read");

  const quote = await ctx.db
    .selectFrom("quote as q")
    .innerJoin("patient as p", "p.id", "q.patient_id")
    .leftJoin("membership as mp", "mp.id", "q.provider_id")
    .leftJoin("app_user as up", "up.id", "mp.user_id")
    .leftJoin("membership as mc", "mc.id", "q.created_by")
    .leftJoin("app_user as uc", "uc.id", "mc.user_id")
    .leftJoin("membership as ma", "ma.id", "q.discount_approved_by")
    .leftJoin("app_user as ua", "ua.id", "ma.user_id")
    .select([
      "q.id", "q.number", "q.status", "q.title", "q.notes",
      "q.subtotal_cents", "q.discount_cents", "q.total_cents", "q.expected_cost_cents",
      "q.down_payment_cents", "q.installment_count", "q.valid_until",
      "q.sent_at", "q.accepted_at", "q.created_at",
      "p.id as patient_id", "p.full_name as patient_name", "p.phone as patient_phone",
      "up.full_name as provider", "uc.full_name as created_by",
      "ua.full_name as approved_by",
    ])
    .where("q.id", "=", quoteId)
    .where("q.deleted_at", "is", null)
    .executeTakeFirst();

  if (!quote) throw new NotFound("Orçamento");

  const [itens, historico, teto] = await Promise.all([
    ctx.db
      .selectFrom("quote_item")
      .select([
        "id", "description", "tooth_code", "region_code", "quantity",
        "unit_price_cents", "discount_cents", "total_cents", "sort_order",
      ])
      .where("quote_id", "=", quoteId)
      .orderBy("sort_order", "asc")
      .orderBy("created_at", "asc")
      .execute(),

    ctx.db
      .selectFrom("quote_status_history as h")
      .leftJoin("membership as m", "m.id", "h.changed_by")
      .leftJoin("app_user as u", "u.id", "m.user_id")
      .select(["h.id", "h.from_status", "h.to_status", "h.changed_at", "u.full_name as by"])
      .where("h.quote_id", "=", quoteId)
      .orderBy("h.changed_at", "desc")
      .execute(),

    // O mesmo calculo que o trigger faz. Mostrar o teto ANTES de a pessoa
    // digitar evita o erro que so aparece no envio, quando o paciente ja esta
    // do outro lado do balcao.
    sql<{ table_cap: number; role_percent: number }>`
      select
        coalesce((
          select sum(((qi.quantity * qi.unit_price_cents)
                       * coalesce(pli.max_discount_percent, 100) / 100)::bigint)
          from quote_item qi
          left join price_list_item pli on pli.id = qi.price_list_item_id
          where qi.quote_id = ${quoteId}::uuid
        ), 0)::bigint as table_cap,
        coalesce((
          select r.max_discount_percent
          from membership m join role r on r.id = m.role_id
          where m.id = ${ctx.session.membershipId}::uuid
        ), 0) as role_percent
    `.execute(ctx.db),
  ]);

  const linha = teto.rows[0];
  const tableCents = Number(linha?.table_cap ?? 0);
  const rolePercent = Number(linha?.role_percent ?? 0);
  const roleCents = Math.floor((quote.subtotal_cents * rolePercent) / 100);

  return {
    id: quote.id as string,
    number: Number(quote.number),
    status: quote.status as QuoteStatus,
    title: quote.title,
    notes: quote.notes,
    patient: {
      id: quote.patient_id,
      name: quote.patient_name,
      phone: quote.patient_phone,
    },
    provider: quote.provider,
    createdBy: quote.created_by,
    subtotalCents: quote.subtotal_cents,
    discountCents: quote.discount_cents,
    totalCents: quote.total_cents ?? 0,
    expectedCostCents: quote.expected_cost_cents,
    downPaymentCents: quote.down_payment_cents,
    installmentCount: quote.installment_count,
    validUntil: quote.valid_until,
    sentAt: quote.sent_at,
    acceptedAt: quote.accepted_at,
    createdAt: quote.created_at,
    discountApprovedBy: quote.approved_by,
    items: itens.map((i) => ({
      id: i.id as string,
      description: i.description,
      toothCode: i.tooth_code,
      regionCode: i.region_code,
      quantity: Number(i.quantity),
      unitPriceCents: i.unit_price_cents,
      discountCents: i.discount_cents,
      totalCents: i.total_cents ?? 0,
    })),
    historico: historico.map((h) => ({
      id: h.id as string,
      from: h.from_status,
      to: h.to_status,
      at: h.changed_at,
      by: h.by,
    })),
    ceiling: {
      roleCents,
      tableCents,
      effectiveCents: Math.min(roleCents, tableCents),
      rolePercent,
    },
    can: {
      write: ctx.can("quote.write"),
      approveDiscount: ctx.can("quote.approve_discount"),
      accept: ctx.can("quote.accept"),
    },
  };
}

/** Itens do plano de tratamento que ainda nao viraram orcamento. */
export async function getPlanItemsForQuote(ctx: TenantContext, patientId: string) {
  ctx.assert("quote.write");

  return ctx.db
    .selectFrom("treatment_plan_item as i")
    .innerJoin("treatment_plan as p", "p.id", "i.treatment_plan_id")
    .leftJoin("procedure as proc", "proc.id", "i.procedure_id")
    .select([
      "i.id", "i.description", "i.tooth_code", "i.region_code", "i.quantity",
      "i.unit_price_cents", "i.procedure_id", "proc.name as procedure_name",
    ])
    .where("p.patient_id", "=", patientId)
    .where("p.status", "in", ["draft", "active"])
    .where("i.status", "=", "planned")
    .where("i.quote_item_id", "is", null)
    .orderBy("i.sort_order", "asc")
    .execute();
}
