"use server";

import { revalidatePath } from "next/cache";
import { assertPermission } from "@/server/tenant";
import { parseChart, type ChartData } from "@/domain/odontogram";
import { ANAMNESIS_QUESTIONS } from "@/domain/anamnesis";
import { toActionState, type ActionState } from "@/server/actions/types";
import type { AttachmentKind } from "@/generated/prisma/enums";


export async function saveAnamnesis(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const { db, clinicId } = await assertPermission("clinical:write");
    const patientId = String(formData.get("patientId"));

    const answers: Record<string, boolean> = {};
    for (const question of ANAMNESIS_QUESTIONS) {
      answers[question.key] = formData.get(`q_${question.key}`) === "on";
    }

    const payload = {
      answers,
      allergies: String(formData.get("allergies") || "").trim() || null,
      medications: String(formData.get("medications") || "").trim() || null,
      conditions: String(formData.get("conditions") || "").trim() || null,
    };

    await db.anamnesis.upsert({
      where: { patientId },
      create: { clinicId, patientId, ...payload },
      update: payload,
    });

    revalidatePath(`/pacientes/${patientId}`);
    return { success: "Anamnese salva." };
  } catch (error) {
    return toActionState(error);
  }
}

export async function addClinicalNote(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const { db, clinicId, session } = await assertPermission("clinical:write");

    const patientId = String(formData.get("patientId"));
    const content = String(formData.get("content") || "").trim();
    const performed = String(formData.get("performed") || "").trim() || null;

    if (!content) return { error: "Descreva a evolução do atendimento." };

    await db.clinicalNote.create({
      data: {
        clinicId,
        patientId,
        professionalId: session.userId,
        content,
        performed,
      },
    });

    revalidatePath(`/pacientes/${patientId}`);
    return { success: "Evolução registrada." };
  } catch (error) {
    return toActionState(error);
  }
}

/** Grava o odontograma inteiro. O componente envia o mapa completo, entao um
 *  salvamento concorrente sobrescreve — aceitavel: quem edita o mapa e o
 *  profissional que esta com o paciente na cadeira. */
export async function saveToothChart(
  patientId: string,
  chart: ChartData,
): Promise<void> {
  const { db, clinicId } = await assertPermission("clinical:write");

  const data = parseChart(chart) as object;

  await db.toothChart.upsert({
    where: { patientId },
    create: { clinicId, patientId, data },
    update: { data },
  });

  revalidatePath(`/pacientes/${patientId}`);
}

export async function addAttachment(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const { db, clinicId } = await assertPermission("clinical:write");

    const patientId = String(formData.get("patientId"));
    const url = String(formData.get("url") || "").trim();
    const kind = String(formData.get("kind") || "DOCUMENTO") as AttachmentKind;
    const caption = String(formData.get("caption") || "").trim() || null;

    if (!url) return { error: "Informe o endereço do arquivo." };
    if (!/^https?:\/\//i.test(url)) return { error: "O endereço deve comecar com http(s)://" };

    const patient = await db.patient.findUnique({
      where: { id: patientId },
      select: { consentImageAt: true },
    });

    if ((kind === "FOTO_ANTES" || kind === "FOTO_DEPOIS") && !patient?.consentImageAt) {
      return {
        error: "O paciente ainda não autorizou o uso de imagem. Registre o consentimento no cadastro.",
      };
    }

    await db.attachment.create({ data: { clinicId, patientId, url, kind, caption } });

    revalidatePath(`/pacientes/${patientId}`);
    return { success: "Anexo registrado." };
  } catch (error) {
    return toActionState(error);
  }
}
