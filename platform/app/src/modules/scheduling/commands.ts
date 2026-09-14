/**
 * Escritas da agenda.
 *
 * Nenhuma delas valida transicao de status: quem faz isso e o trigger
 * `assert_state_transition`, sobre a tabela `state_transition`. Repetir a
 * regra aqui criaria duas versoes dela, e uma hora elas discordariam — o
 * importador e o job noturno nao passam por este arquivo.
 */
import { sql } from "kysely";
import type { TenantContext } from "@/server/context";
import { NotFound, ValidationError } from "@/shared/errors";
import {
  changeStatusSchema,
  createAppointmentSchema,
  type ChangeStatusInput,
  type CreateAppointmentInput,
} from "@/modules/scheduling/schema";

/** Cancelar e marcar falta pesam diferente: mexem no faturamento do dia. */
const PERMISSAO_POR_DESTINO = {
  confirmed: "appointment.write",
  arrived: "appointment.write",
  in_progress: "appointment.write",
  completed: "appointment.write",
  no_show: "appointment.cancel",
  canceled: "appointment.cancel",
} as const;

export async function changeAppointmentStatus(
  ctx: TenantContext,
  input: ChangeStatusInput,
): Promise<{ id: string; status: string }> {
  const parsed = changeStatusSchema.safeParse(input);
  if (!parsed.success) throw toValidationError(parsed.error);
  const data = parsed.data;

  ctx.assert(PERMISSAO_POR_DESTINO[data.to]);

  if (data.to === "canceled" && !data.reason) {
    throw new ValidationError(
      { reason: ["Informe o motivo do cancelamento."] },
      "Informe o motivo do cancelamento.",
    );
  }

  const row = await ctx.db
    .updateTable("appointment")
    .set({
      status: data.to,
      ...(data.to === "canceled"
        ? { cancel_reason: data.reason ?? null, canceled_by: "clinic" as const }
        : {}),
    })
    .where("id", "=", data.appointmentId)
    .where("deleted_at", "is", null)
    .returning(["id", "status"])
    .executeTakeFirst();

  if (!row) throw new NotFound("Agendamento");
  return { id: row.id as string, status: row.status };
}

export async function createAppointment(
  ctx: TenantContext,
  input: CreateAppointmentInput,
): Promise<{ id: string }> {
  ctx.assert("appointment.write");

  const parsed = createAppointmentSchema.safeParse(input);
  if (!parsed.success) throw toValidationError(parsed.error);
  const data = parsed.data;

  const unitId = ctx.unitId();

  const unit = await ctx.db
    .selectFrom("unit")
    .select("timezone")
    .where("id", "=", unitId)
    .executeTakeFirst();

  if (!unit) throw new NotFound("Unidade");

  // O horario digitado e local. Converter no banco, com a tabela de fusos
  // dele, evita a classe de bug em que a consulta das 14h vira 17h em UTC e
  // reaparece no dia seguinte para quem esta em outro fuso.
  const instante = await sql<{ starts_at: Date; ends_at: Date }>`
    select
      (${data.date} || ' ' || ${data.time})::timestamp at time zone ${unit.timezone} as starts_at,
      ((${data.date} || ' ' || ${data.time})::timestamp
        + make_interval(mins => ${data.durationMinutes})) at time zone ${unit.timezone} as ends_at
  `.execute(ctx.db);

  const janela = instante.rows[0];
  if (!janela) throw new ValidationError({ time: ["Horario invalido."] });

  const row = await ctx.db
    .insertInto("appointment")
    .values({
      tenant_id: ctx.session.tenantId,
      unit_id: unitId,
      patient_id: data.patientId,
      provider_id: data.providerId,
      procedure_id: data.procedureId ?? null,
      starts_at: janela.starts_at,
      ends_at: janela.ends_at,
      notes: data.notes,
      origin: "reception",
      created_by: ctx.session.membershipId,
    })
    .returning("id")
    .executeTakeFirstOrThrow();

  return { id: row.id as string };
}

function toValidationError(error: { issues: { path: PropertyKey[]; message: string }[] }) {
  const fieldErrors: Record<string, string[]> = {};

  for (const issue of error.issues) {
    const campo = String(issue.path[0] ?? "_");
    (fieldErrors[campo] ??= []).push(issue.message);
  }

  return new ValidationError(fieldErrors, "Confira os dados do agendamento.");
}
