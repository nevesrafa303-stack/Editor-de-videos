/**
 * Leitura do prontuario.
 *
 * Duas coisas separam este modulo dos demais:
 *
 * 1. Toda leitura deixa rastro (`ctx.recordChartAccess`). Numa investigacao a
 *    pergunta e quem ABRIU a ficha, nao quem editou.
 * 2. A politica restritiva da rede ja filtrou no banco. Nao ha segunda
 *    checagem aqui de proposito: duas versoes da mesma regra divergem.
 */
import { sql } from "kysely";
import type { TenantContext } from "@/server/context";
import { NotFound } from "@/shared/errors";
import type { FormField, Surface, ToothCondition } from "@/modules/chart/schema";

export type ToothState = {
  code: string;
  quadrant: number;
  position: number;
  namePt: string;
  arch: "upper" | "lower";
  side: "right" | "left";
  entries: {
    id: string;
    condition: ToothCondition;
    surfaces: Surface[];
    status: string;
    notes: string | null;
    recordedAt: Date;
    provider: string | null;
  }[];
};

export type ChartNote = {
  id: string;
  content: string;
  createdAt: Date;
  provider: string;
  providerId: string;
  signedAt: Date | null;
  lockedAt: Date | null;
  amendsNoteId: string | null;
  amendmentReason: string | null;
  appointmentAt: Date | null;
  /** Aditamentos que corrigem esta evolucao. */
  amendments: { id: string; content: string; createdAt: Date; provider: string; reason: string }[];
};

export type PatientChart = {
  patient: {
    id: string;
    code: number;
    fullName: string;
    birthDate: string | null;
    phone: string;
    taxId: string | null;
  };
  alerts: string[];
  anamnesis: {
    responseId: string | null;
    templateId: string;
    templateName: string;
    fields: FormField[];
    answers: Record<string, string | boolean>;
    filledAt: Date | null;
    filledBy: string | null;
  } | null;
  notes: ChartNote[];
  teeth: ToothState[];
  can: { write: boolean; amend: boolean };
};

export async function getPatientChart(
  ctx: TenantContext,
  patientId: string,
): Promise<PatientChart> {
  ctx.assert("chart.read");

  const patient = await ctx.db
    .selectFrom("patient")
    .select(["id", "code", "full_name", "birth_date", "phone", "tax_id"])
    .where("id", "=", patientId)
    .where("deleted_at", "is", null)
    .executeTakeFirst();

  if (!patient) throw new NotFound("Paciente");

  // A tabela `patient` NAO tem a policy restritiva de prontuario — quem tem
  // sao as tabelas clinicas. Sem esta pergunta, um profissional barrado pela
  // politica da rede abria a ficha e via odontograma vazio e nenhuma
  // evolucao: parecia um paciente sem historico, e era um acesso negado.
  // Pior, o acesso entrava na trilha como se tivesse acontecido.
  //
  // A pergunta e feita ao BANCO, com a mesma funcao que as policies usam.
  // Reimplementar a regra aqui criaria duas versoes dela.
  const permitido = await sql<{ pode: boolean }>`
    select can_view_patient_chart(${patientId}::uuid) as pode
  `.execute(ctx.db);

  if (!permitido.rows[0]?.pode) {
    // Mesma resposta de "paciente de outra rede": quem nao pode ver o
    // prontuario tambem nao deve descobrir que ele existe.
    throw new NotFound("Paciente");
  }

  const [resposta, template, notas, aditamentos, dentes, registros] = await Promise.all([
    ctx.db
      .selectFrom("form_response as fr")
      .leftJoin("membership as m", "m.id", "fr.filled_by")
      .leftJoin("app_user as u", "u.id", "m.user_id")
      .select([
        "fr.id", "fr.form_template_id", "fr.answers", "fr.alerts",
        "fr.created_at", "u.full_name as filled_by_name",
      ])
      .where("fr.patient_id", "=", patientId)
      .orderBy("fr.created_at", "desc")
      .limit(1)
      .executeTakeFirst(),

    ctx.db
      .selectFrom("form_template")
      .select(["id", "name", "schema"])
      .where("kind", "=", "anamnesis")
      .where("is_active", "=", true)
      .orderBy("version", "desc")
      .limit(1)
      .executeTakeFirst(),

    ctx.db
      .selectFrom("clinical_note as n")
      .innerJoin("membership as m", "m.id", "n.provider_id")
      .innerJoin("app_user as u", "u.id", "m.user_id")
      .leftJoin("appointment as a", "a.id", "n.appointment_id")
      .select([
        "n.id", "n.content", "n.created_at", "n.provider_id", "n.signed_at",
        "n.locked_at", "n.amends_note_id", "n.amendment_reason",
        "u.full_name as provider", "a.starts_at as appointment_at",
      ])
      .where("n.patient_id", "=", patientId)
      .where("n.amends_note_id", "is", null)
      .orderBy("n.created_at", "desc")
      .limit(50)
      .execute(),

    ctx.db
      .selectFrom("clinical_note as n")
      .innerJoin("membership as m", "m.id", "n.provider_id")
      .innerJoin("app_user as u", "u.id", "m.user_id")
      .select([
        "n.id", "n.content", "n.created_at", "n.amends_note_id",
        "n.amendment_reason", "u.full_name as provider",
      ])
      .where("n.patient_id", "=", patientId)
      .where("n.amends_note_id", "is not", null)
      .orderBy("n.created_at", "asc")
      .execute(),

    ctx.db
      .selectFrom("tooth")
      .select(["code", "quadrant", "position", "name_pt", "arch", "side"])
      .where("dentition", "=", "permanent")
      .orderBy("quadrant", "asc")
      .orderBy("position", "asc")
      .execute(),

    ctx.db
      .selectFrom("odontogram_entry as e")
      .leftJoin("membership as m", "m.id", "e.provider_id")
      .leftJoin("app_user as u", "u.id", "m.user_id")
      .select([
        "e.id", "e.tooth_code", "e.surfaces", "e.condition", "e.status",
        "e.notes", "e.recorded_at", "u.full_name as provider",
      ])
      .where("e.patient_id", "=", patientId)
      .where("e.superseded_at", "is", null)
      .where("e.status", "!=", "canceled")
      .orderBy("e.recorded_at", "asc")
      .execute(),
  ]);

  // O registro de acesso e parte do trabalho, nao um efeito colateral: sai na
  // mesma transacao da leitura. Se a transacao voltar atras, o log volta junto.
  await ctx.recordChartAccess({ patientId, entity: "clinical_note" });

  const porNota = new Map<string, ChartNote["amendments"]>();
  for (const a of aditamentos) {
    const chave = a.amends_note_id as string;
    const lista = porNota.get(chave) ?? [];
    lista.push({
      id: a.id as string,
      content: a.content,
      createdAt: a.created_at,
      provider: a.provider,
      reason: a.amendment_reason ?? "",
    });
    porNota.set(chave, lista);
  }

  const porDente = new Map<string, ToothState["entries"]>();
  for (const r of registros) {
    const lista = porDente.get(r.tooth_code) ?? [];
    lista.push({
      id: r.id as string,
      condition: r.condition as ToothCondition,
      surfaces: (r.surfaces ?? []) as Surface[],
      status: r.status,
      notes: r.notes,
      recordedAt: r.recorded_at,
      provider: r.provider,
    });
    porDente.set(r.tooth_code, lista);
  }

  return {
    patient: {
      id: patient.id as string,
      code: patient.code,
      fullName: patient.full_name,
      birthDate: patient.birth_date,
      phone: patient.phone,
      taxId: patient.tax_id,
    },
    alerts: resposta?.alerts ?? [],
    anamnesis: template
      ? {
          responseId: (resposta?.id as string | undefined) ?? null,
          templateId: template.id as string,
          templateName: template.name,
          fields: (template.schema as FormField[]) ?? [],
          answers: (resposta?.answers as Record<string, string | boolean>) ?? {},
          filledAt: resposta?.created_at ?? null,
          filledBy: resposta?.filled_by_name ?? null,
        }
      : null,
    notes: notas.map((n) => ({
      id: n.id as string,
      content: n.content,
      createdAt: n.created_at,
      provider: n.provider,
      providerId: n.provider_id,
      signedAt: n.signed_at,
      lockedAt: n.locked_at,
      amendsNoteId: n.amends_note_id,
      amendmentReason: n.amendment_reason,
      appointmentAt: n.appointment_at,
      amendments: porNota.get(n.id as string) ?? [],
    })),
    teeth: dentes.map((d) => ({
      code: d.code,
      quadrant: d.quadrant,
      position: d.position,
      namePt: d.name_pt,
      arch: d.arch as "upper" | "lower",
      side: d.side as "right" | "left",
      entries: porDente.get(d.code) ?? [],
    })),
    can: { write: ctx.can("chart.write"), amend: ctx.can("chart.amend") },
  };
}

/**
 * Quem abriu esta ficha, e quando.
 *
 * A LGPD exige a trilha; ela so vale se alguem puder LER. Um log que ninguem
 * consulta e um custo de armazenamento com aparencia de conformidade.
 */
export async function getChartAccessLog(ctx: TenantContext, patientId: string) {
  ctx.assert("audit.read");

  return ctx.db
    .selectFrom("phi_access_log as l")
    .leftJoin("app_user as u", "u.id", "l.actor_id")
    .select(["l.id", "l.entity", "l.purpose", "l.occurred_at", "l.ip_address", "u.full_name as actor"])
    .where("l.patient_id", "=", patientId)
    .orderBy("l.occurred_at", "desc")
    .limit(100)
    .execute();
}
