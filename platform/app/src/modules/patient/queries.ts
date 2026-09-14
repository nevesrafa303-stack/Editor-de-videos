/**
 * Consultas de paciente.
 *
 * Nenhuma delas escreve `where tenant_id = ...`: o cliente que chega em `ctx`
 * ja esta preso a clinica da sessao pelo RLS. Repetir o filtro aqui daria uma
 * falsa sensacao de que ele e o que protege.
 */
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
 * Resumo do paciente: tudo que a clínica precisa ver antes de chamar o nome.
 *
 * É a tela que o produto promete ("o paciente em uma tela"), então ela é uma
 * ida ao banco com consultas paralelas, e não seis telas em abas. Abre a cada
 * paciente atendido, o dia inteiro.
 */
export async function getPatientOverview(ctx: TenantContext, patientId: string) {
  ctx.assert("patient.read");

  const patient = await ctx.db
    .selectFrom("patient")
    .selectAll()
    .where("id", "=", patientId)
    .where("deleted_at", "is", null)
    .executeTakeFirst();

  if (!patient) throw new NotFound("Paciente");

  const [consultas, parcelas, orcamentos, pendentes, sinais, alertas, ultimaEvolucao] =
    await Promise.all([
      ctx.db
        .selectFrom("appointment as a")
        .leftJoin("procedure as p", "p.id", "a.procedure_id")
        .innerJoin("membership as m", "m.id", "a.provider_id")
        .innerJoin("app_user as u", "u.id", "m.user_id")
        .select([
          "a.id", "a.starts_at", "a.status", "a.notes",
          "p.name as procedimento", "u.full_name as profissional", "m.agenda_color as cor",
        ])
        .where("a.patient_id", "=", patientId)
        .where("a.deleted_at", "is", null)
        .orderBy("a.starts_at", "desc")
        .limit(8)
        .execute(),

      ctx.db
        .selectFrom("installment")
        .select(["id", "number", "total_count", "due_on", "amount_cents", "paid_cents", "status"])
        .where("patient_id", "=", patientId)
        .where("status", "in", ["open", "partially_paid"])
        .orderBy("due_on", "asc")
        .limit(12)
        .execute(),

      ctx.db
        .selectFrom("quote")
        .select(["id", "number", "status", "total_cents", "valid_until", "sent_at"])
        .where("patient_id", "=", patientId)
        .where("status", "in", ["sent", "negotiating"])
        .orderBy("created_at", "desc")
        .limit(6)
        .execute(),

      ctx.db
        .selectFrom("treatment_plan_item as i")
        .innerJoin("treatment_plan as p", "p.id", "i.treatment_plan_id")
        .select(["i.id", "i.description", "i.tooth_code", "i.region_code", "i.unit_price_cents", "i.quantity"])
        .where("p.patient_id", "=", patientId)
        .where("p.status", "in", ["draft", "active"])
        .where("i.status", "=", "planned")
        .orderBy("i.sort_order", "asc")
        .limit(12)
        .execute(),

      ctx.db
        .selectFrom("patient_signal")
        .select(["id", "kind", "severity", "value_cents", "reason", "due_on"])
        .where("patient_id", "=", patientId)
        .where("resolved_at", "is", null)
        .orderBy("severity", "desc")
        .limit(6)
        .execute(),

      ctx.db
        .selectFrom("form_response")
        .select(["alerts", "created_at"])
        .where("patient_id", "=", patientId)
        .orderBy("created_at", "desc")
        .limit(1)
        .executeTakeFirst(),

      ctx.db
        .selectFrom("clinical_note as n")
        .leftJoin("membership as m", "m.id", "n.provider_id")
        .leftJoin("app_user as u", "u.id", "m.user_id")
        .select(["n.id", "n.created_at", "u.full_name as profissional"])
        .where("n.patient_id", "=", patientId)
        .orderBy("n.created_at", "desc")
        .limit(1)
        .executeTakeFirst(),
    ]);

  const hoje = new Date();
  const emAberto = parcelas.reduce((soma, p) => soma + p.amount_cents - p.paid_cents, 0);
  const atrasado = parcelas
    .filter((p) => new Date(`${p.due_on}T00:00:00`) < new Date(hoje.toDateString()))
    .reduce((soma, p) => soma + p.amount_cents - p.paid_cents, 0);

  return {
    patient,
    consultas,
    parcelas,
    orcamentos,
    pendentes,
    sinais,
    alertas: alertas?.alerts ?? [],
    ultimaEvolucao: ultimaEvolucao ?? null,
    totais: {
      emAbertoCents: emAberto,
      atrasadoCents: atrasado,
      // total_cents é coluna gerada: o tipo vem anulável, o valor nunca é.
      orcamentoAbertoCents: orcamentos.reduce((soma, o) => soma + (o.total_cents ?? 0), 0),
      pendentesCents: pendentes.reduce(
        (soma, i) => soma + Math.round(Number(i.quantity) * i.unit_price_cents),
        0,
      ),
    },
  };
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
