"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { formAction } from "@/server/next/action";
import { centavosDeTexto as reais } from "@/shared/money";
import { comAviso } from "@/shared/flash";
import type { ActionState } from "@/shared/action-state";
import {
  completeTask,
  convertLead,
  createLead,
  createTask,
  logActivity,
  loseOpportunity,
  moveStage,
  reopenOpportunity,
} from "@/modules/funnel/commands";
import { ACTIVITY_KINDS, TASK_PRIORITIES } from "@/modules/funnel/schema";
import type { ActivityKind, TaskPriority } from "@/modules/funnel/schema";

const cadastrar = formAction(async (ctx, formData) => {
  const { opportunityId } = await createLead(ctx, {
    fullName: String(formData.get("fullName") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    email: String(formData.get("email") ?? ""),
    sourceId: String(formData.get("sourceId") ?? "") || null,
    interest: String(formData.get("interest") ?? ""),
    amountCents: reais(formData.get("amount")),
  });

  revalidatePath("/funil");
  redirect(`/funil/${opportunityId}`);
}, "lead.write");

export async function cadastrarContatoAction(
  previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return cadastrar(previous, formData);
}

/**
 * Mover o cartao.
 *
 * O cartao sai da coluna em que estava no exato caso de sucesso, levando junto
 * qualquer mensagem presa ao formulario. Por isso o aviso viaja na URL — a
 * mesma decisao do financeiro e do faturamento.
 */
const mover = formAction(async (ctx, formData) => {
  const opportunityId = String(formData.get("opportunityId") ?? "");

  await moveStage(ctx, {
    opportunityId,
    stageId: String(formData.get("stageId") ?? ""),
  });

  revalidatePath("/funil");
  redirect(comAviso(voltarPara(formData, opportunityId), "Negócio movido de etapa."));
}, "opportunity.write");

export async function moverEtapaAction(
  previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return mover(previous, formData);
}

const perder = formAction(async (ctx, formData) => {
  const opportunityId = String(formData.get("opportunityId") ?? "");

  await loseOpportunity(ctx, {
    opportunityId,
    lossReasonId: String(formData.get("lossReasonId") ?? ""),
    notes: String(formData.get("notes") ?? ""),
  });

  revalidatePath("/funil");
  redirect(
    comAviso(
      voltarPara(formData, opportunityId),
      "Perda registrada. O motivo alimenta o relatório de perda.",
    ),
  );
}, "opportunity.write");

export async function registrarPerdaAction(
  previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return perder(previous, formData);
}

const reabrir = formAction(async (ctx, formData) => {
  const opportunityId = String(formData.get("opportunityId") ?? "");
  await reopenOpportunity(ctx, opportunityId);

  revalidatePath("/funil");
  redirect(comAviso(`/funil/${opportunityId}`, "Negócio de volta ao funil."));
}, "opportunity.write");

export async function reabrirAction(
  previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return reabrir(previous, formData);
}

const registrar = formAction(async (ctx, formData) => {
  const opportunityId = String(formData.get("opportunityId") ?? "");
  const kind = String(formData.get("kind") ?? "note");

  await logActivity(ctx, {
    opportunityId,
    kind: ACTIVITY_KINDS.includes(kind as ActivityKind) ? (kind as ActivityKind) : "note",
    body: String(formData.get("body") ?? ""),
  });

  revalidatePath(`/funil/${opportunityId}`);
  revalidatePath("/funil");
  return { success: "Contato registrado." };
}, "opportunity.write");

export async function registrarContatoAction(
  previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return registrar(previous, formData);
}

const agendar = formAction(async (ctx, formData) => {
  const opportunityId = String(formData.get("opportunityId") ?? "");
  const priority = String(formData.get("priority") ?? "normal");

  await createTask(ctx, {
    opportunityId,
    title: String(formData.get("title") ?? ""),
    dueAt: String(formData.get("dueAt") ?? ""),
    priority: TASK_PRIORITIES.includes(priority as TaskPriority)
      ? (priority as TaskPriority)
      : "normal",
  });

  revalidatePath(`/funil/${opportunityId}`);
  revalidatePath("/funil");
  return { success: "Próxima ação marcada." };
}, "task.write");

export async function marcarAcaoAction(
  previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return agendar(previous, formData);
}

const concluir = formAction(async (ctx, formData) => {
  await completeTask(ctx, String(formData.get("taskId") ?? ""));

  revalidatePath("/funil");
  revalidatePath("/funil/pendencias");

  // A tarefa sai da fila no sucesso; o recado precisa sobreviver a isso.
  redirect(comAviso(voltarPara(formData, null), "Tarefa concluída."));
}, "task.write");

export async function concluirTarefaAction(
  previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return concluir(previous, formData);
}

const converter = formAction(async (ctx, formData) => {
  const opportunityId = String(formData.get("opportunityId") ?? "");
  await convertLead(ctx, String(formData.get("leadId") ?? ""));

  revalidatePath(`/funil/${opportunityId}`);
  redirect(
    comAviso(
      `/funil/${opportunityId}`,
      "Paciente criado. Agora dá para orçar — e o aceite fecha o negócio.",
    ),
  );
}, "patient.write");

export async function converterLeadAction(
  previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return converter(previous, formData);
}

/** De onde a ação foi disparada: o quadro, a ficha ou a fila de pendências. */
function voltarPara(formData: FormData, opportunityId: string | null): string {
  const de = String(formData.get("de") ?? "");
  if (de === "quadro") return "/funil";
  if (de === "pendencias") return "/funil/pendencias";
  return opportunityId ? `/funil/${opportunityId}` : "/funil";
}
