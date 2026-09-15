"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { formAction } from "@/server/next/action";
import { centavosDeTexto as reais } from "@/shared/money";
import { comAviso } from "@/shared/flash";
import type { ActionState } from "@/shared/action-state";
import {
  addClaimsToBatch,
  removeClaimFromBatch,
  resolveDenial,
  setClaimAuthorization,
  setRemittanceDate,
  settleBatch,
  settleItem,
  submitBatch,
} from "@/modules/claim/commands";
import { DENIAL_ACTIONS, type DenialAction } from "@/modules/claim/schema";

const faturar = formAction(async (ctx, formData) => {
  const { lotes, guias } = await addClaimsToBatch(ctx, {
    claimIds: formData.getAll("claimIds").map(String),
    competence: String(formData.get("competence") ?? "") || null,
  });

  revalidatePath("/faturamento");

  // Faturar ESVAZIA a fila, e a mensagem presa ao formulario sumiria com ele:
  // o painel troca a lista pelo estado vazio no exato caso de sucesso. O
  // recado viaja na URL e e desenhado pela pagina, que continua existindo.
  redirect(
    comAviso(
      "/faturamento",
      lotes === 1
        ? `${guias} ${guias === 1 ? "guia faturada" : "guias faturadas"} no lote da competência.`
        : `${guias} guias em ${lotes} lotes — um por convênio, como o convênio recebe.`,
    ),
  );
}, "claim.write");

export async function faturarAction(
  previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return faturar(previous, formData);
}

const tirarDoLote = formAction(async (ctx, formData) => {
  const claimId = String(formData.get("claimId") ?? "");
  const batchId = String(formData.get("batchId") ?? "");
  await removeClaimFromBatch(ctx, claimId);

  revalidatePath("/faturamento");

  // A guia sai da tela do lote junto com a mensagem; o aviso vai pela URL.
  redirect(comAviso(`/faturamento/lotes/${batchId}`, "Guia devolvida para a fila."));
}, "claim.write");

export async function tirarDoLoteAction(
  previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return tirarDoLote(previous, formData);
}

const enviar = formAction(async (ctx, formData) => {
  const batchId = String(formData.get("batchId") ?? "");
  const { guias } = await submitBatch(ctx, batchId);

  revalidatePath("/faturamento");

  // Enviar troca o painel de envio pelo de conferencia: outro caso em que a
  // tela muda de forma no sucesso.
  redirect(
    comAviso(
      `/faturamento/lotes/${batchId}`,
      `Lote enviado com ${guias} ${guias === 1 ? "guia" : "guias"}.`,
    ),
  );
}, "claim.submit");

export async function enviarLoteAction(
  previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return enviar(previous, formData);
}

/**
 * A data do demonstrativo vem ANTES da conferencia.
 *
 * E dela que sai o prazo de recurso de toda glosa do lote. Conferir primeiro e
 * datar depois daria a cada glosa um prazo contado de hoje — mais tempo do que
 * a clinica realmente tem, que e a forma mais silenciosa de perder o prazo.
 */
const datar = formAction(async (ctx, formData) => {
  const batchId = String(formData.get("batchId") ?? "");
  await setRemittanceDate(ctx, batchId, String(formData.get("remittanceDate") ?? ""));

  revalidatePath(`/faturamento/lotes/${batchId}`);
  return { success: "Data do demonstrativo registrada. O prazo de recurso conta dela." };
}, "claim.settle");

export async function datarRepasseAction(
  previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return datar(previous, formData);
}

const conferir = formAction(async (ctx, formData) => {
  const batchId = String(formData.get("batchId") ?? "");

  const { glosou } = await settleItem(ctx, {
    itemId: String(formData.get("itemId") ?? ""),
    paidCents: reais(formData.get("paid")),
    reasonCode: String(formData.get("reasonCode") ?? ""),
    reason: String(formData.get("reason") ?? ""),
  });

  revalidatePath(`/faturamento/lotes/${batchId}`);

  return {
    success: glosou
      ? "Conferido. A diferença virou glosa, com prazo para recorrer."
      : "Conferido: pago por inteiro.",
  };
}, "claim.settle");

export async function conferirAction(
  previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return conferir(previous, formData);
}

const fechar = formAction(async (ctx, formData) => {
  const batchId = String(formData.get("batchId") ?? "");
  const { guias } = await settleBatch(ctx, batchId);

  revalidatePath("/faturamento");

  redirect(
    comAviso(
      `/faturamento/lotes/${batchId}`,
      `Lote fechado com ${guias} ${guias === 1 ? "guia" : "guias"}.`,
    ),
  );
}, "claim.settle");

export async function fecharLoteAction(
  previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return fechar(previous, formData);
}

const recorrer = formAction(async (ctx, formData) => {
  const status = String(formData.get("status") ?? "");

  await resolveDenial(ctx, {
    denialId: String(formData.get("denialId") ?? ""),
    status: DENIAL_ACTIONS.includes(status as DenialAction)
      ? (status as DenialAction)
      : "appealed",
    recoveredCents: reais(formData.get("recovered")),
    notes: String(formData.get("notes") ?? ""),
  });

  revalidatePath("/faturamento");

  // "Recuperada" e "perda aceita" tiram a glosa da lista de abertas; recorrer
  // so muda o rotulo. So o primeiro caso precisaria do aviso na URL, mas manter
  // os tres iguais evita que o proximo desfecho novo esqueca disso.
  redirect(comAviso("/faturamento/glosas", ROTULO[status] ?? "Glosa atualizada."));
}, "claim.appeal");

export async function recorrerAction(
  previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return recorrer(previous, formData);
}

const autorizar = formAction(async (ctx, formData) => {
  const claimId = String(formData.get("claimId") ?? "");

  await setClaimAuthorization(ctx, {
    claimId,
    code: String(formData.get("code") ?? ""),
    validUntil: String(formData.get("validUntil") ?? ""),
  });

  revalidatePath(`/faturamento/guias/${claimId}`);
  return { success: "Autorização registrada." };
}, "claim.write");

export async function autorizarAction(
  previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return autorizar(previous, formData);
}

const ROTULO: Record<string, string> = {
  appealed: "Recurso registrado. A glosa continua contando até o convênio responder.",
  recovered: "Recuperado. O valor voltou para a linha da guia.",
  written_off: "Aceita como perda.",
};
