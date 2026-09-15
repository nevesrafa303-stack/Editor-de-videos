/**
 * Consultas do funil.
 *
 * O funil existe para responder UMA pergunta: onde estao parados os negocios, e
 * o que falta fazer em cada um. Por isso a consulta principal devolve as etapas
 * com os cartoes dentro — e nao uma lista que a tela teria de agrupar depois,
 * perdendo as etapas vazias, que sao justamente as que contam alguma coisa.
 */
import { sql } from "kysely";
import type { TenantContext } from "@/server/context";
import { NotFound } from "@/shared/errors";
import type {
  ActivityKind,
  LeadStatus,
  OpportunityStatus,
  TaskPriority,
} from "@/modules/funnel/schema";

export type CardRow = {
  id: string;
  title: string;
  status: OpportunityStatus;
  amountCents: number;
  stageId: string;
  /** Quem é a pessoa: lead ainda não convertido, ou paciente. */
  personName: string;
  leadId: string | null;
  patientId: string | null;
  phone: string;
  ownerName: string | null;
  lastActivityAt: Date | null;
  nextActionAt: Date | null;
  /** Dias sem contato. `null` quando nunca houve. */
  diasSemContato: number | null;
  /** Passou de `cooling_days` da etapa sem contato nenhum. */
  esfriando: boolean;
  quoteCount: number;
};

export type StageColumn = {
  id: string;
  code: string;
  name: string;
  sortOrder: number;
  winProbability: number;
  coolingDays: number;
  isWon: boolean;
  isLost: boolean;
  cards: CardRow[];
  totalCents: number;
};

export type FunnelBoard = {
  pipelineId: string;
  pipelineName: string;
  stages: StageColumn[];
  /** Soma ponderada pela probabilidade da etapa. */
  previstoCents: number;
  abertoCents: number;
  esfriandoCount: number;
  atrasadoCount: number;
  /** Ganho no mês corrente. O quadro só mostra o que está aberto. */
  ganhoNoMesCents: number;
  ganhoNoMesCount: number;
};

export async function getBoard(ctx: TenantContext): Promise<FunnelBoard> {
  ctx.assert("opportunity.read");

  const pipeline = await ctx.db
    .selectFrom("pipeline")
    .select(["id", "name"])
    .where("is_active", "=", true)
    .orderBy("is_default", "desc")
    .executeTakeFirst();

  if (!pipeline) throw new NotFound("Funil");

  const etapas = await ctx.db
    .selectFrom("pipeline_stage")
    .select([
      "id", "code", "name", "sort_order", "win_probability",
      "cooling_days", "is_won", "is_lost",
    ])
    .where("pipeline_id", "=", pipeline.id)
    .orderBy("sort_order", "asc")
    .execute();

  const [cartoes, ganho] = await Promise.all([
    listCards(ctx, { pipelineId: pipeline.id as string, aberta: true }),
    ctx.db
      .selectFrom("opportunity")
      .select((eb) => [
        eb.fn.sum<number>("amount_cents").as("soma"),
        eb.fn.countAll<number>().as("quantos"),
      ])
      .where("status", "=", "won")
      .where("deleted_at", "is", null)
      .where(sql<boolean>`date_trunc('month', closed_at) = date_trunc('month', now())`)
      .executeTakeFirst(),
  ]);

  const stages: StageColumn[] = etapas.map((e) => {
    const cards = cartoes.filter((c) => c.stageId === e.id);
    return {
      id: e.id as string,
      code: e.code,
      name: e.name,
      sortOrder: e.sort_order,
      winProbability: Number(e.win_probability),
      coolingDays: e.cooling_days,
      isWon: e.is_won,
      isLost: e.is_lost,
      cards,
      totalCents: cards.reduce((s, c) => s + c.amountCents, 0),
    };
  });

  const agora = Date.now();

  return {
    pipelineId: pipeline.id as string,
    pipelineName: pipeline.name,
    stages,
    // Ponderar pela probabilidade da etapa é a diferença entre "tenho
    // R$ 80.000 no funil" e "espero fechar R$ 22.000" — e só a segunda frase
    // serve para decidir alguma coisa.
    previstoCents: stages.reduce(
      (s, e) => s + Math.round(e.totalCents * e.winProbability),
      0,
    ),
    abertoCents: stages.reduce((s, e) => s + e.totalCents, 0),
    esfriandoCount: cartoes.filter((c) => c.esfriando).length,
    atrasadoCount: cartoes.filter(
      (c) => c.nextActionAt !== null && c.nextActionAt.getTime() < agora,
    ).length,
    ganhoNoMesCents: Number(ganho?.soma ?? 0),
    ganhoNoMesCount: Number(ganho?.quantos ?? 0),
  };
}

async function listCards(
  ctx: TenantContext,
  filtro: { pipelineId?: string; aberta?: boolean; patientId?: string },
): Promise<CardRow[]> {
  let q = ctx.db
    .selectFrom("opportunity as o")
    .leftJoin("lead as l", "l.id", "o.lead_id")
    .leftJoin("patient as p", "p.id", "o.patient_id")
    .leftJoin("pipeline_stage as ps", "ps.id", "o.stage_id")
    .leftJoin("membership as m", "m.id", "o.owner_id")
    .leftJoin("app_user as u", "u.id", "m.user_id")
    .select([
      "o.id", "o.title", "o.status", "o.amount_cents", "o.stage_id",
      "o.lead_id", "o.patient_id", "o.last_activity_at", "o.next_action_at",
      "u.full_name as owner_name",
      "ps.cooling_days",
      sql<string>`coalesce(p.full_name, l.full_name)`.as("person_name"),
      sql<string>`coalesce(p.phone, l.phone)`.as("phone"),
      sql<number | null>`
        case when o.last_activity_at is null then null
             else extract(day from now() - o.last_activity_at)::int end
      `.as("dias_sem_contato"),
      (eb) =>
        eb
          .selectFrom("quote as q")
          .select((e) => e.fn.countAll<number>().as("n"))
          .whereRef("q.opportunity_id", "=", "o.id")
          .where("q.deleted_at", "is", null)
          .as("quote_count"),
    ])
    .where("o.deleted_at", "is", null);

  if (filtro.pipelineId) q = q.where("o.pipeline_id", "=", filtro.pipelineId);
  if (filtro.aberta) q = q.where("o.status", "=", "open");
  if (filtro.patientId) q = q.where("o.patient_id", "=", filtro.patientId);

  const rows = await q
    // Atrasado primeiro, depois o que esfria antes: a ordem do cartão é a
    // ordem de quem precisa de atenção.
    .orderBy(sql`o.next_action_at asc nulls last`)
    .orderBy(sql`o.last_activity_at asc nulls first`)
    .execute();

  return rows.map((o) => {
    const dias = o.dias_sem_contato === null ? null : Number(o.dias_sem_contato);

    return {
      id: o.id as string,
      title: o.title,
      status: o.status as OpportunityStatus,
      amountCents: Number(o.amount_cents),
      stageId: o.stage_id as string,
      personName: o.person_name,
      leadId: (o.lead_id as string) ?? null,
      patientId: (o.patient_id as string) ?? null,
      phone: o.phone,
      ownerName: o.owner_name,
      lastActivityAt: o.last_activity_at,
      nextActionAt: o.next_action_at,
      diasSemContato: dias,
      // Sem contato nenhum conta como esfriando: negócio aberto que ninguém
      // tocou é exatamente o que se perde por silêncio.
      esfriando: dias === null || dias >= (o.cooling_days ?? 7),
      quoteCount: Number(o.quote_count ?? 0),
    };
  });
}

export type ActivityRow = {
  id: string;
  kind: ActivityKind | "stage_change" | "system";
  body: string;
  by: string | null;
  occurredAt: Date;
};

export type TaskRow = {
  id: string;
  title: string;
  status: string;
  priority: TaskPriority;
  dueAt: Date | null;
  assignedTo: string | null;
  opportunityId: string | null;
  opportunityTitle: string | null;
  personName: string | null;
};

export type OpportunityDetail = {
  card: CardRow;
  pipelineId: string;
  stageName: string;
  lead: { id: string; status: LeadStatus; interest: string | null } | null;
  activities: ActivityRow[];
  tasks: TaskRow[];
  quotes: { id: string; number: number; status: string; totalCents: number }[];
  historico: { id: string; from: string | null; to: string; at: Date; by: string | null }[];
  lossReason: string | null;
  lossNotes: string | null;
};

export async function getOpportunity(
  ctx: TenantContext,
  id: string,
): Promise<OpportunityDetail> {
  ctx.assert("opportunity.read");

  const [card] = await listCards(ctx, {}).then((todos) =>
    todos.filter((c) => c.id === id),
  );
  if (!card) throw new NotFound("Oportunidade");

  const base = await ctx.db
    .selectFrom("opportunity as o")
    .innerJoin("pipeline_stage as ps", "ps.id", "o.stage_id")
    .leftJoin("loss_reason as lr", "lr.id", "o.loss_reason_id")
    .select(["o.pipeline_id", "ps.name as stage_name", "lr.name as loss_reason", "o.loss_notes"])
    .where("o.id", "=", id)
    .executeTakeFirstOrThrow();

  const [lead, atividades, tarefas, orcamentos, historico] = await Promise.all([
    card.leadId
      ? ctx.db
          .selectFrom("lead")
          .select(["id", "status", "interest"])
          .where("id", "=", card.leadId)
          .executeTakeFirst()
      : Promise.resolve(undefined),

    ctx.db
      .selectFrom("activity as a")
      .leftJoin("membership as m", "m.id", "a.performed_by")
      .leftJoin("app_user as u", "u.id", "m.user_id")
      .select(["a.id", "a.kind", "a.body", "a.occurred_at", "u.full_name as by"])
      .where("a.opportunity_id", "=", id)
      .orderBy("a.occurred_at", "desc")
      .execute(),

    ctx.db
      .selectFrom("task as t")
      .leftJoin("membership as m", "m.id", "t.assigned_to")
      .leftJoin("app_user as u", "u.id", "m.user_id")
      .select([
        "t.id", "t.title", "t.status", "t.priority", "t.due_at",
        "u.full_name as assigned_to",
      ])
      .where("t.opportunity_id", "=", id)
      .orderBy(sql`t.status = 'open' desc`)
      .orderBy("t.due_at", "asc")
      .execute(),

    ctx.db
      .selectFrom("quote")
      .select(["id", "number", "status", "total_cents"])
      .where("opportunity_id", "=", id)
      .where("deleted_at", "is", null)
      .orderBy("number", "desc")
      .execute(),

    ctx.db
      .selectFrom("opportunity_stage_history as h")
      .leftJoin("pipeline_stage as de", "de.id", "h.from_stage_id")
      .innerJoin("pipeline_stage as para", "para.id", "h.to_stage_id")
      .leftJoin("membership as m", "m.id", "h.changed_by")
      .leftJoin("app_user as u", "u.id", "m.user_id")
      .select([
        "h.id", "de.name as de", "para.name as para", "h.changed_at",
        "u.full_name as by",
      ])
      .where("h.opportunity_id", "=", id)
      .orderBy("h.changed_at", "desc")
      .execute(),
  ]);

  return {
    card,
    pipelineId: base.pipeline_id as string,
    stageName: base.stage_name,
    lead: lead
      ? {
          id: lead.id as string,
          status: lead.status as LeadStatus,
          interest: lead.interest,
        }
      : null,
    activities: atividades.map((a) => ({
      id: a.id as string,
      kind: a.kind as ActivityRow["kind"],
      body: a.body,
      by: a.by,
      occurredAt: a.occurred_at,
    })),
    tasks: tarefas.map((t) => ({
      id: t.id as string,
      title: t.title,
      status: t.status,
      priority: t.priority as TaskPriority,
      dueAt: t.due_at,
      assignedTo: t.assigned_to,
      opportunityId: id,
      opportunityTitle: null,
      personName: null,
    })),
    quotes: orcamentos.map((q) => ({
      id: q.id as string,
      number: Number(q.number),
      status: q.status,
      totalCents: Number(q.total_cents ?? 0),
    })),
    historico: historico.map((h) => ({
      id: h.id as string,
      from: h.de,
      to: h.para,
      at: h.changed_at,
      by: h.by,
    })),
    lossReason: base.loss_reason,
    lossNotes: base.loss_notes,
  };
}

/** As etapas do funil, para o seletor de "mover para". */
export async function listStages(ctx: TenantContext, pipelineId: string) {
  ctx.assert("opportunity.read");

  const rows = await ctx.db
    .selectFrom("pipeline_stage")
    .select(["id", "name", "sort_order", "is_won", "is_lost"])
    .where("pipeline_id", "=", pipelineId)
    .orderBy("sort_order", "asc")
    .execute();

  return rows.map((s) => ({
    id: s.id as string,
    name: s.name,
    sortOrder: s.sort_order,
    isWon: s.is_won,
    isLost: s.is_lost,
  }));
}

/**
 * Tarefas abertas da CLÍNICA, as atrasadas primeiro.
 *
 * De todo mundo, não só de quem está olhando: numa clínica de três pessoas uma
 * fila compartilhada é mais útil que três privadas — quem está no balcão vê que
 * o retorno da Renata venceu, mesmo que a tarefa seja da Carla. Por isso cada
 * linha mostra o responsável.
 */
export async function listOpenTasks(ctx: TenantContext): Promise<TaskRow[]> {
  ctx.assert("task.read");

  const rows = await ctx.db
    .selectFrom("task as t")
    .leftJoin("opportunity as o", "o.id", "t.opportunity_id")
    .leftJoin("lead as l", "l.id", "o.lead_id")
    .leftJoin("patient as p", "p.id", "o.patient_id")
    .leftJoin("membership as m", "m.id", "t.assigned_to")
    .leftJoin("app_user as u", "u.id", "m.user_id")
    .select([
      "t.id", "t.title", "t.status", "t.priority", "t.due_at",
      "t.opportunity_id", "o.title as opportunity_title",
      "u.full_name as assigned_to",
      sql<string | null>`coalesce(p.full_name, l.full_name)`.as("person_name"),
    ])
    .where("t.status", "=", "open")
    .orderBy(sql`t.due_at asc nulls last`)
    .execute();

  return rows.map((t) => ({
    id: t.id as string,
    title: t.title,
    status: t.status,
    priority: t.priority as TaskPriority,
    dueAt: t.due_at,
    assignedTo: t.assigned_to,
    opportunityId: (t.opportunity_id as string) ?? null,
    opportunityTitle: t.opportunity_title,
    personName: t.person_name,
  }));
}

/** Motivos de perda ativos, para o formulário. */
export async function listLossReasons(ctx: TenantContext) {
  ctx.assert("opportunity.read");

  const rows = await ctx.db
    .selectFrom("loss_reason")
    .select(["id", "name", "category"])
    .where("is_active", "=", true)
    .orderBy("name", "asc")
    .execute();

  return rows.map((r) => ({ id: r.id as string, name: r.name, category: r.category }));
}

/** Origens de captação, para o cadastro de lead. */
export async function listSources(ctx: TenantContext) {
  ctx.assert("lead.read");

  const rows = await ctx.db
    .selectFrom("acquisition_source")
    .select(["id", "name"])
    .where("is_active", "=", true)
    .orderBy("name", "asc")
    .execute();

  return rows.map((r) => ({ id: r.id as string, name: r.name }));
}
