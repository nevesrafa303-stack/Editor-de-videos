"use server";

import { revalidatePath } from "next/cache";
import { formAction } from "@/server/next/action";
import type { ActionState } from "@/shared/action-state";
import {
  addClinicalNote,
  amendClinicalNote,
  recordTooth,
  saveAnamnesis,
} from "@/modules/chart/commands";
import { SURFACES, TOOTH_CONDITIONS, type Surface, type ToothCondition } from "@/modules/chart/schema";

const registrar = formAction(async (ctx, formData) => {
  const patientId = String(formData.get("patientId") ?? "");
  const condition = String(formData.get("condition") ?? "");

  if (!TOOTH_CONDITIONS.includes(condition as ToothCondition)) {
    return { error: "Condição desconhecida." };
  }

  const surfaces = formData
    .getAll("surfaces")
    .map(String)
    .filter((s): s is Surface => SURFACES.includes(s as Surface));

  const { superseded } = await recordTooth(ctx, {
    patientId,
    toothCode: String(formData.get("toothCode") ?? ""),
    condition: condition as ToothCondition,
    surfaces,
    status: "existing",
    notes: String(formData.get("notes") ?? ""),
  });

  revalidatePath(`/pacientes/${patientId}/prontuario`);

  return {
    success:
      superseded > 0
        ? `Registrado. ${superseded} registro(s) anterior(es) deste dente passaram a histórico.`
        : "Registrado no odontograma.",
  };
}, "chart.write");

export async function registrarDenteAction(
  previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return registrar(previous, formData);
}

const evoluir = formAction(async (ctx, formData) => {
  const patientId = String(formData.get("patientId") ?? "");

  await addClinicalNote(ctx, {
    patientId,
    content: String(formData.get("content") ?? ""),
  });

  revalidatePath(`/pacientes/${patientId}/prontuario`);
  return { success: "Evolução registrada e assinada." };
}, "chart.write");

export async function novaEvolucaoAction(
  previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return evoluir(previous, formData);
}

const aditar = formAction(async (ctx, formData) => {
  const patientId = String(formData.get("patientId") ?? "");

  await amendClinicalNote(ctx, {
    noteId: String(formData.get("noteId") ?? ""),
    content: String(formData.get("content") ?? ""),
    reason: String(formData.get("reason") ?? ""),
  });

  revalidatePath(`/pacientes/${patientId}/prontuario`);
  return { success: "Aditamento registrado. A evolução original permanece." };
}, "chart.amend");

export async function aditarEvolucaoAction(
  previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return aditar(previous, formData);
}

const salvarAnamnese = formAction(async (ctx, formData) => {
  const patientId = String(formData.get("patientId") ?? "");
  const templateId = String(formData.get("templateId") ?? "");
  const chaves = String(formData.get("campos") ?? "").split(",").filter(Boolean);

  const answers: Record<string, string | boolean> = {};
  for (const chave of chaves) {
    const tipo = String(formData.get(`tipo:${chave}`) ?? "text");
    answers[chave] =
      tipo === "boolean" ? formData.get(chave) === "sim" : String(formData.get(chave) ?? "");
  }

  const { alerts } = await saveAnamnesis(ctx, { patientId, templateId, answers });

  revalidatePath(`/pacientes/${patientId}/prontuario`);
  revalidatePath(`/pacientes/${patientId}`);

  return {
    success:
      alerts.length > 0
        ? `Anamnese salva. ${alerts.length} alerta(s) passam a aparecer no topo da ficha.`
        : "Anamnese salva. Nenhum alerta clínico.",
  };
}, "chart.write");

export async function salvarAnamneseAction(
  previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return salvarAnamnese(previous, formData);
}
