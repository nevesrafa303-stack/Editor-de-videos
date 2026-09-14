/**
 * Escritas do prontuario.
 *
 * Aqui a regra de ouro e: nada se apaga. Evolucao clinica fechada nao pode ser
 * reescrita — corrige-se com aditamento, e a original permanece. Registro de
 * odontograma nao some: e SUPERSEDIDO, e a versao anterior continua legivel.
 * Quem garante isso e o banco (trigger + `superseded_at`); este arquivo apenas
 * fala a mesma lingua.
 */
import { createHash } from "node:crypto";
import { sql } from "kysely";
import type { TenantContext } from "@/server/context";
import { Forbidden, NotFound, ValidationError } from "@/shared/errors";
import { toValidationError } from "@/shared/zod";
import {
  addNoteSchema,
  amendNoteSchema,
  recordToothSchema,
  saveAnamnesisSchema,
  WHOLE_TOOTH,
  type AddNoteInput,
  type AmendNoteInput,
  type FormField,
  type RecordToothInput,
  type SaveAnamnesisInput,
} from "@/modules/chart/schema";

/**
 * Assinatura eletronica simples: hash do que foi escrito, de quem escreveu e
 * de quando. Nao prova identidade como um certificado ICP-Brasil, mas detecta
 * adulteracao — e e o que o MVP promete. Trocar por assinatura qualificada
 * depois nao muda o resto do prontuario.
 */
function assinar(content: string, membershipId: string, at: Date): string {
  return createHash("sha256")
    .update(`${membershipId}|${at.toISOString()}|${content}`)
    .digest("hex");
}

export async function addClinicalNote(
  ctx: TenantContext,
  input: AddNoteInput,
): Promise<{ id: string }> {
  ctx.assert("chart.write");

  const parsed = addNoteSchema.safeParse(input);
  if (!parsed.success) throw toValidationError(parsed.error, "Confira os dados do prontuario.");
  const data = parsed.data;

  // Evolucao e escrita por quem atendeu. Sem membership de profissional nao ha
  // autoria clinica possivel — e prontuario sem autor nao vale nada em pericia.
  if (!ctx.session.isProvider) {
    throw new Forbidden(
      "Somente profissional de saude registra evolucao clinica.",
      "chart.write",
    );
  }

  const agora = new Date();

  const row = await ctx.db
    .insertInto("clinical_note")
    .values({
      tenant_id: ctx.session.tenantId,
      unit_id: ctx.session.activeUnitId,
      patient_id: data.patientId,
      appointment_id: data.appointmentId ?? null,
      provider_id: ctx.session.membershipId,
      content: data.content,
      signed_at: agora,
      signature_hash: assinar(data.content, ctx.session.membershipId, agora),
    })
    .returning("id")
    .executeTakeFirstOrThrow();

  return { id: row.id as string };
}

export async function amendClinicalNote(
  ctx: TenantContext,
  input: AmendNoteInput,
): Promise<{ id: string }> {
  ctx.assert("chart.amend");

  const parsed = amendNoteSchema.safeParse(input);
  if (!parsed.success) throw toValidationError(parsed.error, "Confira os dados do prontuario.");
  const data = parsed.data;

  const original = await ctx.db
    .selectFrom("clinical_note")
    .select(["id", "patient_id", "appointment_id", "amends_note_id"])
    .where("id", "=", data.noteId)
    .executeTakeFirst();

  if (!original) throw new NotFound("Evolucao");

  // Aditamento de aditamento vira corrente sem fim: o leitor perde qual e a
  // versao valida. Corrige-se sempre a evolucao original.
  if (original.amends_note_id) {
    throw new ValidationError(
      { content: ["Corrija a evolucao original, nao o aditamento."] },
      "Esta evolucao ja e um aditamento.",
    );
  }

  const agora = new Date();

  const row = await ctx.db
    .insertInto("clinical_note")
    .values({
      tenant_id: ctx.session.tenantId,
      unit_id: ctx.session.activeUnitId,
      patient_id: original.patient_id,
      appointment_id: original.appointment_id,
      provider_id: ctx.session.membershipId,
      content: data.content,
      amends_note_id: original.id,
      amendment_reason: data.reason,
      signed_at: agora,
      signature_hash: assinar(data.content, ctx.session.membershipId, agora),
    })
    .returning("id")
    .executeTakeFirstOrThrow();

  // A original e fechada: a partir daqui ela so existe como historico.
  await ctx.db
    .updateTable("clinical_note")
    .set({ locked_at: agora })
    .where("id", "=", original.id)
    .where("locked_at", "is", null)
    .execute();

  return { id: row.id as string };
}

export async function recordTooth(
  ctx: TenantContext,
  input: RecordToothInput,
): Promise<{ id: string; superseded: number }> {
  ctx.assert("chart.write");

  const parsed = recordToothSchema.safeParse(input);
  if (!parsed.success) throw toValidationError(parsed.error, "Confira os dados do prontuario.");
  const data = parsed.data;

  const agora = new Date();

  const novo = await ctx.db
    .insertInto("odontogram_entry")
    .values({
      tenant_id: ctx.session.tenantId,
      patient_id: data.patientId,
      tooth_code: data.toothCode,
      surfaces: data.surfaces,
      condition: data.condition,
      status: data.status,
      source: "exam",
      provider_id: ctx.session.membershipId,
      notes: data.notes,
      recorded_at: agora,
    })
    .returning("id")
    .executeTakeFirstOrThrow();

  // O que o registro novo substitui. Condicao de dente inteiro ("ausente")
  // substitui tudo daquele dente; condicao de face substitui apenas o que
  // disputa a MESMA face. Carie na oclusal e restauracao na mesial convivem.
  let alvos = ctx.db
    .updateTable("odontogram_entry")
    .set({ superseded_at: agora, superseded_by: novo.id })
    .where("patient_id", "=", data.patientId)
    .where("tooth_code", "=", data.toothCode)
    .where("superseded_at", "is", null)
    .where("id", "!=", novo.id);

  if (!WHOLE_TOOTH.has(data.condition)) {
    alvos = alvos.where((eb) =>
      eb.or([
        // Registro anterior de dente inteiro continua valendo; so some se o
        // novo tambem for de dente inteiro.
        sql<boolean>`array_length(surfaces, 1) is not null and surfaces && ${sql.val(
          data.surfaces,
        )}::tooth_surface[]`,
      ]),
    );
  }

  const resultado = await alvos.executeTakeFirst();

  return { id: novo.id as string, superseded: Number(resultado?.numUpdatedRows ?? 0) };
}

export async function saveAnamnesis(
  ctx: TenantContext,
  input: SaveAnamnesisInput,
): Promise<{ id: string; alerts: string[] }> {
  ctx.assert("chart.write");

  const parsed = saveAnamnesisSchema.safeParse(input);
  if (!parsed.success) throw toValidationError(parsed.error, "Confira os dados do prontuario.");
  const data = parsed.data;

  const template = await ctx.db
    .selectFrom("form_template")
    .select(["id", "schema"])
    .where("id", "=", data.templateId)
    .where("is_active", "=", true)
    .executeTakeFirst();

  if (!template) throw new NotFound("Formulario");

  const fields = (template.schema as FormField[]) ?? [];
  const faltando = fields
    .filter((f) => f.required && !preenchido(data.answers[f.key]))
    .map((f) => f.key);

  if (faltando.length > 0) {
    throw new ValidationError(
      Object.fromEntries(faltando.map((k) => [k, ["Campo obrigatorio."]])),
      "Responda os campos obrigatorios.",
    );
  }

  const alerts = derivarAlertas(fields, data.answers);

  const row = await ctx.db
    .insertInto("form_response")
    .values({
      tenant_id: ctx.session.tenantId,
      patient_id: data.patientId,
      form_template_id: template.id,
      answers: JSON.stringify(data.answers),
      alerts,
      filled_by: ctx.session.membershipId,
    })
    .returning("id")
    .executeTakeFirstOrThrow();

  return { id: row.id as string, alerts };
}

/**
 * Alertas materializados na resposta, nao recalculados na leitura.
 *
 * Se fossem derivados na hora de mostrar, mudar o formulario mudaria
 * retroativamente o que a ficha de 2023 alertava — e o prontuario tem que
 * dizer o que dizia na epoca.
 */
function derivarAlertas(
  fields: FormField[],
  answers: Record<string, string | boolean>,
): string[] {
  const alerts: string[] = [];

  for (const field of fields) {
    const regra = field.alert_if;
    if (!regra) continue;

    const valor = answers[field.key];

    if (regra.equals !== undefined && valor === regra.equals) {
      alerts.push(regra.text);
    } else if (regra.filled && typeof valor === "string" && valor.trim().length > 0) {
      alerts.push(regra.text.replace("{valor}", valor.trim()));
    }
  }

  return alerts;
}

function preenchido(valor: string | boolean | undefined): boolean {
  if (typeof valor === "boolean") return true;
  return typeof valor === "string" && valor.trim().length > 0;
}

