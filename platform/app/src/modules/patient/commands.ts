/**
 * Escritas de paciente.
 *
 * Todas passam por `ctx.assert(...)` antes de tocar o banco — a permissao e
 * verificada no servidor, nunca so na tela. O `tenant_id` explicito satisfaz o
 * tipo; quem garante o valor e o WITH CHECK da policy.
 */
import type { TenantContext } from "@/server/context";
import { Conflict, NotFound, ValidationError } from "@/shared/errors";
import { createPatientSchema, type CreatePatientInput } from "@/modules/patient/schema";

export type CreatedPatient = { id: string; code: number; fullName: string };

export async function createPatient(
  ctx: TenantContext,
  input: CreatePatientInput,
): Promise<CreatedPatient> {
  ctx.assert("patient.write");

  const parsed = createPatientSchema.safeParse(input);
  if (!parsed.success) throw toValidationError(parsed.error);
  const data = parsed.data;

  if (data.taxId) {
    const duplicate = await ctx.db
      .selectFrom("patient")
      .select(["id", "full_name"])
      .where("tax_id", "=", data.taxId)
      .where("deleted_at", "is", null)
      .executeTakeFirst();

    if (duplicate) {
      throw new Conflict(`Este CPF ja esta cadastrado para ${duplicate.full_name}.`);
    }
  }

  const row = await ctx.db
    .insertInto("patient")
    .values({
      tenant_id: ctx.session.tenantId,
      origin_unit_id: ctx.session.activeUnitId,
      full_name: data.fullName,
      phone: data.phone,
      email: data.email,
      tax_id: data.taxId,
      birth_date: data.birthDate,
      gender: data.gender ?? null,
      source_id: data.sourceId ?? null,
      notes: data.notes,
    })
    .returning(["id", "code", "full_name"])
    .executeTakeFirstOrThrow();

  return { id: row.id, code: row.code, fullName: row.full_name };
}

export async function updatePatient(
  ctx: TenantContext,
  patientId: string,
  input: CreatePatientInput,
): Promise<void> {
  ctx.assert("patient.write");

  const parsed = createPatientSchema.safeParse(input);
  if (!parsed.success) throw toValidationError(parsed.error);
  const data = parsed.data;

  const result = await ctx.db
    .updateTable("patient")
    .set({
      full_name: data.fullName,
      phone: data.phone,
      email: data.email,
      tax_id: data.taxId,
      birth_date: data.birthDate,
      gender: data.gender ?? null,
      notes: data.notes,
    })
    .where("id", "=", patientId)
    .where("deleted_at", "is", null)
    .executeTakeFirst();

  // Zero linhas aqui significa "nao existe" ou "e de outra clinica" — e a
  // resposta e a mesma de proposito: nao confirmamos a existencia de registro
  // que a sessao nao pode ver.
  if (Number(result.numUpdatedRows) === 0) throw new NotFound("Paciente");
}

/** Inativacao logica. Historico clinico e financeiro permanece. */
export async function deactivatePatient(
  ctx: TenantContext,
  patientId: string,
): Promise<void> {
  ctx.assert("patient.delete");

  const result = await ctx.db
    .updateTable("patient")
    .set({ status: "inactive" })
    .where("id", "=", patientId)
    .where("deleted_at", "is", null)
    .executeTakeFirst();

  if (Number(result.numUpdatedRows) === 0) throw new NotFound("Paciente");
}

function toValidationError(error: { issues: { path: PropertyKey[]; message: string }[] }) {
  const details: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.map(String).join(".") || "_";
    details[key] = [...(details[key] ?? []), issue.message];
  }
  return new ValidationError(details);
}
