"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { assertPermission } from "@/server/tenant";
import { isValidCPF, onlyDigits } from "@/lib/br";
import { parseISODate } from "@/lib/date";
import { SOURCE_LABEL } from "@/domain/funnel";
import type { LeadSource } from "@/generated/prisma/enums";
import { toActionState, type ActionState } from "@/server/actions/types";

const optionalText = z
  .string()
  .trim()
  .transform((value) => (value === "" ? null : value))
  .nullable();

const patientSchema = z.object({
  name: z.string().trim().min(3, "Informe o nome completo."),
  phone: z
    .string()
    .trim()
    .transform(onlyDigits)
    .refine((value) => value.length >= 10, "Telefone deve ter DDD + número."),
  email: optionalText.refine(
    (value) => value === null || z.email().safeParse(value).success,
    "E-mail inválido.",
  ),
  document: optionalText.refine(
    (value) => value === null || isValidCPF(value),
    "CPF inválido.",
  ),
  birthDate: optionalText,
  source: z
    .string()
    .trim()
    .transform((value) => (value === "" ? null : value))
    .nullable()
    .refine(
      (value) => value === null || value in SOURCE_LABEL,
      "Origem inválida.",
    ),
  notes: optionalText,
  zipCode: optionalText,
  street: optionalText,
  number: optionalText,
  city: optionalText,
  state: optionalText,
  consentData: z.coerce.boolean().optional(),
  consentImage: z.coerce.boolean().optional(),
});

function readPatientForm(formData: FormData) {
  const parsed = patientSchema.parse({
    name: formData.get("name"),
    phone: formData.get("phone"),
    email: formData.get("email") ?? "",
    document: formData.get("document") ?? "",
    birthDate: formData.get("birthDate") ?? "",
    source: formData.get("source") ?? "",
    notes: formData.get("notes") ?? "",
    zipCode: formData.get("zipCode") ?? "",
    street: formData.get("street") ?? "",
    number: formData.get("number") ?? "",
    city: formData.get("city") ?? "",
    state: formData.get("state") ?? "",
    consentData: formData.get("consentData") === "on",
    consentImage: formData.get("consentImage") === "on",
  });

  return {
    name: parsed.name,
    phone: parsed.phone,
    email: parsed.email,
    document: parsed.document ? onlyDigits(parsed.document) : null,
    birthDate: parsed.birthDate ? parseISODate(parsed.birthDate) : null,
    source: (parsed.source as LeadSource | null) ?? null,
    notes: parsed.notes,
    zipCode: parsed.zipCode,
    street: parsed.street,
    number: parsed.number,
    city: parsed.city,
    state: parsed.state,
    consent: { data: !!parsed.consentData, image: !!parsed.consentImage },
  };
}

export async function createPatient(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  let patientId: string;

  try {
    const { db, clinicId } = await assertPermission("patients:write");
    const input = readPatientForm(formData);

    if (input.document) {
      const duplicate = await db.patient.findFirst({
        where: { document: input.document },
        select: { id: true, name: true },
      });
      if (duplicate) {
        return { error: `Este CPF já esta cadastrado para ${duplicate.name}.` };
      }
    }

    const patient = await db.patient.create({
      data: {
        // `clinicId` e obrigatório no tipo e sobrescrito pela camada de tenant:
        // o compilador impede o esquecimento, o runtime impede o valor errado.
        clinicId,
        name: input.name,
        phone: input.phone,
        email: input.email,
        document: input.document,
        birthDate: input.birthDate,
        source: input.source,
        notes: input.notes,
        zipCode: input.zipCode,
        street: input.street,
        number: input.number,
        city: input.city,
        state: input.state,
        consentDataAt: input.consent.data ? new Date() : null,
        consentImageAt: input.consent.image ? new Date() : null,
      },
    });

    patientId = patient.id;
  } catch (error) {
    return toActionState(error);
  }

  revalidatePath("/pacientes");
  redirect(`/pacientes/${patientId}`);
}

export async function updatePatient(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const { db } = await assertPermission("patients:write");
    const id = String(formData.get("id"));
    const input = readPatientForm(formData);

    const current = await db.patient.findUnique({ where: { id } });
    if (!current) return { error: "Paciente não encontrado." };

    if (input.document && input.document !== current.document) {
      const duplicate = await db.patient.findFirst({
        where: { document: input.document, id: { not: id } },
        select: { name: true },
      });
      if (duplicate) {
        return { error: `Este CPF já esta cadastrado para ${duplicate.name}.` };
      }
    }

    await db.patient.update({
      where: { id },
      data: {
        name: input.name,
        phone: input.phone,
        email: input.email,
        document: input.document,
        birthDate: input.birthDate,
        source: input.source,
        notes: input.notes,
        zipCode: input.zipCode,
        street: input.street,
        number: input.number,
        city: input.city,
        state: input.state,
        // O aceite so e registrado na primeira vez; desmarcar revoga.
        consentDataAt: input.consent.data ? (current.consentDataAt ?? new Date()) : null,
        consentImageAt: input.consent.image ? (current.consentImageAt ?? new Date()) : null,
      },
    });

    revalidatePath(`/pacientes/${id}`);
    revalidatePath("/pacientes");
    return { success: "Cadastro atualizado." };
  } catch (error) {
    return toActionState(error);
  }
}

export async function setPatientActive(formData: FormData): Promise<void> {
  const { db } = await assertPermission("patients:write");
  const id = String(formData.get("id"));
  const active = formData.get("active") === "true";

  await db.patient.update({ where: { id }, data: { active } });
  revalidatePath(`/pacientes/${id}`);
  revalidatePath("/pacientes");
}
