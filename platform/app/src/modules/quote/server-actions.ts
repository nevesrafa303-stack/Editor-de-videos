"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { formAction } from "@/server/next/action";
import type { ActionState } from "@/shared/action-state";
import {
  acceptQuote,
  addQuoteItem,
  changeQuoteStatus,
  createQuote,
  removeQuoteItem,
  setQuoteDiscount,
  setQuoteTerms,
} from "@/modules/quote/commands";
import { QUOTE_ACTIONS, type QuoteAction } from "@/modules/quote/schema";

const criar = formAction(async (ctx, formData) => {
  const { id } = await createQuote(ctx, {
    patientId: String(formData.get("patientId") ?? ""),
    title: String(formData.get("title") ?? ""),
    validDays: Number(formData.get("validDays") ?? 15),
    planItemIds: formData.getAll("planItemIds").map(String),
  });

  revalidatePath("/orcamentos");
  redirect(`/orcamentos/${id}`);
}, "quote.write");

export async function criarOrcamentoAction(
  previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return criar(previous, formData);
}

const adicionar = formAction(async (ctx, formData) => {
  const quoteId = String(formData.get("quoteId") ?? "");

  await addQuoteItem(ctx, {
    quoteId,
    description: String(formData.get("description") ?? ""),
    toothCode: String(formData.get("toothCode") ?? "") || null,
    quantity: Number(formData.get("quantity") ?? 1),
    unitPriceCents: reais(formData.get("unitPrice")),
  });

  revalidatePath(`/orcamentos/${quoteId}`);
  return { success: "Item adicionado." };
}, "quote.write");

export async function adicionarItemAction(
  previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return adicionar(previous, formData);
}

const remover = formAction(async (ctx, formData) => {
  const quoteId = String(formData.get("quoteId") ?? "");
  await removeQuoteItem(ctx, String(formData.get("itemId") ?? ""));

  revalidatePath(`/orcamentos/${quoteId}`);
  return { success: "Item removido." };
}, "quote.write");

export async function removerItemAction(
  previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return remover(previous, formData);
}

const descontar = formAction(async (ctx, formData) => {
  const quoteId = String(formData.get("quoteId") ?? "");

  await setQuoteDiscount(ctx, {
    quoteId,
    discountCents: reais(formData.get("discount")),
    approve: formData.get("approve") === "1",
  });

  revalidatePath(`/orcamentos/${quoteId}`);
  return { success: "Desconto atualizado." };
}, "quote.write");

export async function descontoAction(
  previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return descontar(previous, formData);
}

const condicoes = formAction(async (ctx, formData) => {
  const quoteId = String(formData.get("quoteId") ?? "");

  await setQuoteTerms(ctx, {
    quoteId,
    installmentCount: Number(formData.get("installmentCount") ?? 1),
    downPaymentCents: reais(formData.get("downPayment")),
    validUntil: String(formData.get("validUntil") ?? "") || null,
  });

  revalidatePath(`/orcamentos/${quoteId}`);
  return { success: "Condições atualizadas." };
}, "quote.write");

export async function condicoesAction(
  previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return condicoes(previous, formData);
}

const mudarStatus = formAction(async (ctx, formData) => {
  const quoteId = String(formData.get("quoteId") ?? "");
  const to = String(formData.get("to") ?? "");

  if (!QUOTE_ACTIONS.includes(to as QuoteAction)) return { error: "Ação desconhecida." };

  const motivo = String(formData.get("lossReasonId") ?? "");

  const { status } = await changeQuoteStatus(ctx, {
    quoteId,
    to: to as QuoteAction,
    ...(motivo ? { lossReasonId: motivo } : {}),
    lossNotes: String(formData.get("lossNotes") ?? "") || null,
  });

  revalidatePath(`/orcamentos/${quoteId}`);
  revalidatePath("/orcamentos");
  return { success: ROTULO[status] ?? "Orçamento atualizado." };
}, "quote.write");

export async function mudarStatusAction(
  previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return mudarStatus(previous, formData);
}

const aceitar = formAction(async (ctx, formData) => {
  const quoteId = String(formData.get("quoteId") ?? "");

  await acceptQuote(ctx, {
    quoteId,
    signedBy: String(formData.get("signedBy") ?? ""),
  });

  revalidatePath(`/orcamentos/${quoteId}`);
  revalidatePath("/orcamentos");
  return { success: "Aceite registrado e assinado." };
}, "quote.accept");

export async function aceitarAction(
  previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return aceitar(previous, formData);
}

/**
 * "1.234,56" -> 123456. Aceita o que a recepcao realmente digita: com ponto,
 * sem ponto, com virgula, so o inteiro.
 */
function reais(valor: FormDataEntryValue | null): number {
  const texto = String(valor ?? "").trim();
  if (!texto) return 0;

  const limpo = texto.replace(/[^\d,.-]/g, "");
  const normalizado = limpo.includes(",")
    ? limpo.replace(/\./g, "").replace(",", ".")
    : limpo;

  const numero = Number(normalizado);
  return Number.isFinite(numero) ? Math.round(numero * 100) : 0;
}

const ROTULO: Record<string, string> = {
  sent: "Orçamento enviado ao paciente.",
  negotiating: "Reaberto para negociação.",
  rejected: "Perda registrada.",
  expired: "Marcado como vencido.",
  canceled: "Orçamento cancelado.",
};
