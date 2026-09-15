/**
 * Escritas do funil.
 *
 * O que NAO se decide aqui: ganhar. A oportunidade e ganha pelo trigger que
 * observa o aceite do orcamento (0029), e nao ha caminho nesta camada que
 * marque "ganha" sem documento. Foi decisao de produto: funil que diz "fechei
 * R$ 8.000" com o financeiro vazio e um relatorio em que ninguem confia.
 */
import { sql } from "kysely";
import type { TenantContext } from "@/server/context";
import { NotFound, ValidationError } from "@/shared/errors";
import { toValidationError } from "@/shared/zod";
import {
  logActivitySchema,
  loseSchema,
  moveStageSchema,
  newLeadSchema,
  newTaskSchema,
  type LogActivityInput,
  type LoseInput,
  type MoveStageInput,
  type NewLeadInput,
  type NewTaskInput,
} from "@/modules/funnel/schema";

/**
 * Lead e oportunidade, na mesma transacao.
 *
 * Quem atende o telefone tem uma pessoa do outro lado: pedir dois cadastros
 * seguidos e o jeito de a metade dos leads ficar pela metade.
 */
export async function createLead(
  ctx: TenantContext,
  input: NewLeadInput,
): Promise<{ leadId: string; opportunityId: string }> {
  ctx.assert("lead.write");

  const parsed = newLeadSchema.safeParse(input);
  if (!parsed.success) throw toValidationError(parsed.error, "Confira os dados do contato.");
  const data = parsed.data;

  const funil = await ctx.db
    .selectFrom("pipeline")
    .select("id")
    .where("is_active", "=", true)
    .orderBy("is_default", "desc")
    .executeTakeFirst();

  if (!funil) throw new NotFound("Funil");

  const primeira = await ctx.db
    .selectFrom("pipeline_stage")
    .select("id")
    .where("pipeline_id", "=", funil.id)
    .where("is_won", "=", false)
    .where("is_lost", "=", false)
    .orderBy("sort_order", "asc")
    .executeTakeFirst();

  if (!primeira) throw new NotFound("Etapa inicial do funil");

  const lead = await ctx.db
    .insertInto("lead")
    .values({
      tenant_id: ctx.session.tenantId,
      unit_id: ctx.unitId(),
      full_name: data.fullName,
      phone: data.phone,
      email: data.email,
      source_id: data.sourceId ?? null,
      interest: data.interest,
      owner_id: data.ownerId ?? ctx.session.membershipId,
    })
    .returning("id")
    .executeTakeFirstOrThrow();

  const oportunidade = await ctx.db
    .insertInto("opportunity")
    .values({
      tenant_id: ctx.session.tenantId,
      unit_id: ctx.unitId(),
      pipeline_id: funil.id,
      stage_id: primeira.id,
      lead_id: lead.id,
      title: data.interest ?? `Contato de ${data.fullName.split(" ")[0]}`,
      amount_cents: data.amountCents,
      owner_id: data.ownerId ?? ctx.session.membershipId,
      source_id: data.sourceId ?? null,
    })
    .returning("id")
    .executeTakeFirstOrThrow();

  return { leadId: lead.id as string, opportunityId: oportunidade.id as string };
}

/**
 * Move de etapa.
 *
 * Etapa de GANHO nao se alcanca por aqui: quem ganha e o aceite do orcamento.
 * Etapa de PERDA tambem nao, porque perder exige motivo — e o motivo e o que
 * alimenta o relatorio que explica por que a clinica perde.
 */
export async function moveStage(ctx: TenantContext, input: MoveStageInput): Promise<void> {
  ctx.assert("opportunity.write");

  const parsed = moveStageSchema.safeParse(input);
  if (!parsed.success) throw toValidationError(parsed.error, "Confira a etapa.");
  const data = parsed.data;

  const etapa = await ctx.db
    .selectFrom("pipeline_stage")
    .select(["id", "is_won", "is_lost", "name"])
    .where("id", "=", data.stageId)
    .executeTakeFirst();

  if (!etapa) throw new NotFound("Etapa");

  if (etapa.is_won) {
    throw new ValidationError(
      { stageId: ["Ganhar é o aceite do orçamento."] },
      "Esta etapa é alcançada quando o paciente aceita o orçamento — não movendo o cartão. " +
        "Assim o funil e o financeiro nunca discordam.",
    );
  }

  if (etapa.is_lost) {
    throw new ValidationError(
      { stageId: ["Perder exige motivo."] },
      "Use “Registrar perda”: sem o motivo não há relatório que explique por que a clínica perde.",
    );
  }

  const row = await ctx.db
    .updateTable("opportunity")
    .set({ stage_id: data.stageId })
    .where("id", "=", data.opportunityId)
    .where("status", "=", "open")
    .returning("id")
    .executeTakeFirst();

  if (!row) {
    throw new ValidationError(
      { _: ["Oportunidade fechada não se move."] },
      "Este negócio já foi fechado. Reabra antes de mover.",
    );
  }
}

export async function loseOpportunity(ctx: TenantContext, input: LoseInput): Promise<void> {
  ctx.assert("opportunity.write");

  const parsed = loseSchema.safeParse(input);
  if (!parsed.success) throw toValidationError(parsed.error, "Confira o motivo da perda.");
  const data = parsed.data;

  const perdida = await ctx.db
    .selectFrom("opportunity as o")
    .innerJoin("pipeline_stage as ps", "ps.pipeline_id", "o.pipeline_id")
    .select("ps.id")
    .where("o.id", "=", data.opportunityId)
    .where("ps.is_lost", "=", true)
    .executeTakeFirst();

  const row = await ctx.db
    .updateTable("opportunity")
    .set({
      status: "lost",
      closed_at: new Date(),
      loss_reason_id: data.lossReasonId,
      loss_notes: data.notes,
      ...(perdida ? { stage_id: perdida.id } : {}),
    })
    .where("id", "=", data.opportunityId)
    .where("status", "=", "open")
    .returning("id")
    .executeTakeFirst();

  if (!row) throw new NotFound("Oportunidade aberta");
}

export async function reopenOpportunity(ctx: TenantContext, id: string): Promise<void> {
  ctx.assert("opportunity.write");

  const row = await ctx.db
    .updateTable("opportunity")
    .set({ status: "open", closed_at: null, loss_reason_id: null, loss_notes: null })
    .where("id", "=", id)
    .where("status", "<>", "open")
    .returning("id")
    .executeTakeFirst();

  if (!row) throw new NotFound("Oportunidade fechada");
}

/** Registra um contato. É o que mantém o negócio quente — e o que prova que foi. */
export async function logActivity(
  ctx: TenantContext,
  input: LogActivityInput,
): Promise<void> {
  ctx.assert("opportunity.write");

  const parsed = logActivitySchema.safeParse(input);
  if (!parsed.success) throw toValidationError(parsed.error, "Confira o registro.");
  const data = parsed.data;

  await ctx.db
    .insertInto("activity")
    .values({
      tenant_id: ctx.session.tenantId,
      opportunity_id: data.opportunityId,
      kind: data.kind,
      body: data.body,
      performed_by: ctx.session.membershipId,
    })
    .execute();
}

export async function createTask(ctx: TenantContext, input: NewTaskInput): Promise<void> {
  ctx.assert("task.write");

  const parsed = newTaskSchema.safeParse(input);
  if (!parsed.success) throw toValidationError(parsed.error, "Confira a tarefa.");
  const data = parsed.data;

  // A data chega como hora LOCAL da clinica ("2026-09-20T14:30", sem fuso). O
  // banco guarda timestamptz, entao o fuso da sessao e quem completa a
  // informacao — o do servidor diria outra hora.
  await sql`
    insert into task (tenant_id, unit_id, opportunity_id, title, due_at,
                      priority, assigned_to, created_by)
    values (
      ${ctx.session.tenantId}::uuid,
      ${ctx.unitId()}::uuid,
      ${data.opportunityId}::uuid,
      ${data.title},
      (${data.dueAt}::timestamp at time zone ${ctx.session.timezone}),
      ${data.priority},
      ${data.assignedTo ?? ctx.session.membershipId}::uuid,
      ${ctx.session.membershipId}::uuid
    )
  `.execute(ctx.db);
}

export async function completeTask(ctx: TenantContext, taskId: string): Promise<void> {
  ctx.assert("task.write");

  const row = await ctx.db
    .updateTable("task")
    .set({
      status: "done",
      completed_at: new Date(),
      completed_by: ctx.session.membershipId,
    })
    .where("id", "=", taskId)
    .where("status", "=", "open")
    .returning("id")
    .executeTakeFirst();

  if (!row) throw new NotFound("Tarefa aberta");
}

/**
 * Lead vira paciente.
 *
 * E passo obrigatorio do caminho, nao detalhe administrativo: o orcamento exige
 * paciente. A funcao do banco cuida dos tres lados — nasce o cadastro, o lead
 * sai da fila, e a oportunidade passa a apontar para a pessoa.
 */
export async function convertLead(
  ctx: TenantContext,
  leadId: string,
): Promise<{ patientId: string }> {
  ctx.assert("patient.write");

  const resultado = await sql<{ convert_lead_to_patient: string }>`
    select convert_lead_to_patient(${leadId}::uuid)
  `.execute(ctx.db);

  const patientId = resultado.rows[0]?.convert_lead_to_patient;
  if (!patientId) throw new NotFound("Lead");

  return { patientId };
}
