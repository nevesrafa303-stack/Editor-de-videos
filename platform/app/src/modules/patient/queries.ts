/**
 * Consultas de paciente.
 *
 * Nenhuma delas escreve `where tenant_id = ...`: o cliente que chega em `ctx`
 * ja esta preso a clinica da sessao pelo RLS. Repetir o filtro aqui daria uma
 * falsa sensacao de que ele e o que protege.
 */
import { sql } from "kysely";
import type { TenantContext } from "@/server/context";
import { NotFound } from "@/shared/errors";
import { onlyDigits } from "@/shared/br";
import { listPatientsSchema, type ListPatientsInput } from "@/modules/patient/schema";

export type PatientListItem = {
  id: string;
  code: number;
  fullName: string;
  phone: string;
  taxId: string | null;
  birthDate: string | null;
  status: string;
  lastVisitAt: Date | null;
  nextAppointmentAt: Date | null;
  openBalanceCents: number;
};

export async function listPatients(
  ctx: TenantContext,
  input: ListPatientsInput = {},
): Promise<{ items: PatientListItem[]; total: number }> {
  ctx.assert("patient.read");
  const filter = listPatientsSchema.parse(input);

  let query = ctx.db.selectFrom("patient").where("deleted_at", "is", null);

  if (!filter.includeInactive) {
    query = query.where("status", "=", "active");
  }

  if (filter.search) {
    const digits = onlyDigits(filter.search);
    query = query.where((eb) =>
      eb.or([
        eb("full_name", "ilike", `%${filter.search}%`),
        ...(digits.length >= 3
          ? [eb("phone", "like", `%${digits}%`), eb("tax_id", "like", `%${digits}%`)]
          : []),
      ]),
    );
  }

  const [rows, count] = await Promise.all([
    query
      .select([
        "id", "code", "full_name", "phone", "tax_id", "birth_date",
        "status", "last_visit_at", "next_appointment_at", "open_balance_cents",
      ])
      .orderBy("full_name", "asc")
      .limit(filter.limit)
      .offset(filter.offset)
      .execute(),
    query.select((eb) => eb.fn.countAll<number>().as("total")).executeTakeFirst(),
  ]);

  return {
    items: rows.map((row) => ({
      id: row.id,
      code: row.code,
      fullName: row.full_name,
      phone: row.phone,
      taxId: row.tax_id,
      birthDate: row.birth_date,
      status: row.status,
      lastVisitAt: row.last_visit_at,
      nextAppointmentAt: row.next_appointment_at,
      openBalanceCents: row.open_balance_cents,
    })),
    total: Number(count?.total ?? 0),
  };
}

/**
 * Resumo do paciente: o que a clinica precisa ver antes de atender.
 *
 * Uma consulta so, com subconsultas, em vez de seis idas ao banco — esta tela
 * abre a cada paciente chamado, o dia inteiro.
 */
export async function getPatientSummary(ctx: TenantContext, patientId: string) {
  ctx.assert("patient.read");

  const patient = await ctx.db
    .selectFrom("patient")
    .selectAll()
    .where("id", "=", patientId)
    .where("deleted_at", "is", null)
    .executeTakeFirst();

  if (!patient) throw new NotFound("Paciente");

  const stats = await sql<{
    open_quotes: number;
    open_quote_cents: number;
    overdue_cents: number;
    pending_items: number;
    next_appointment: Date | null;
    last_note_at: Date | null;
    signals: number;
  }>`
    select
      (select count(*)::int from quote q
        where q.patient_id = ${patientId} and q.status in ('sent', 'negotiating')) as open_quotes,
      (select coalesce(sum(q.total_cents), 0)::bigint from quote q
        where q.patient_id = ${patientId} and q.status in ('sent', 'negotiating')) as open_quote_cents,
      (select coalesce(sum(i.amount_cents - i.paid_cents), 0)::bigint from installment i
        where i.patient_id = ${patientId}
          and i.status in ('open', 'partially_paid') and i.due_on < current_date) as overdue_cents,
      (select count(*)::int from treatment_plan_item tpi
         join treatment_plan tp on tp.id = tpi.treatment_plan_id
        where tp.patient_id = ${patientId} and tpi.status = 'planned') as pending_items,
      (select min(a.starts_at) from appointment a
        where a.patient_id = ${patientId} and a.starts_at >= now()
          and a.status in ('scheduled', 'confirmed')) as next_appointment,
      (select max(cn.created_at) from clinical_note cn
        where cn.patient_id = ${patientId}) as last_note_at,
      (select count(*)::int from patient_signal ps
        where ps.patient_id = ${patientId} and ps.resolved_at is null) as signals
  `.execute(ctx.db);

  return { patient, stats: stats.rows[0] };
}

/**
 * Prontuario. Diferente das demais: alem da permissao, registra a LEITURA.
 * A politica restritiva da rede (se ligada) ja filtrou no banco — aqui nao ha
 * segunda checagem justamente para nao existirem duas versoes da regra.
 */
export async function getPatientChart(ctx: TenantContext, patientId: string) {
  ctx.assert("chart.read");

  const [notes, anamnesis, teeth] = await Promise.all([
    ctx.db
      .selectFrom("clinical_note")
      .select(["id", "content", "created_at", "provider_id", "amends_note_id"])
      .where("patient_id", "=", patientId)
      .orderBy("created_at", "desc")
      .limit(50)
      .execute(),
    ctx.db
      .selectFrom("form_response")
      .select(["id", "answers", "alerts", "created_at"])
      .where("patient_id", "=", patientId)
      .orderBy("created_at", "desc")
      .limit(1)
      .executeTakeFirst(),
    ctx.db
      .selectFrom("odontogram_entry")
      .select(["tooth_code", "surfaces", "condition", "status", "recorded_at"])
      .where("patient_id", "=", patientId)
      .where("superseded_at", "is", null)
      .execute(),
  ]);

  await ctx.recordChartAccess({ patientId, entity: "clinical_note" });

  return { notes, anamnesis: anamnesis ?? null, teeth };
}
