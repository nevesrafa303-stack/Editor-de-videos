"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { formAction } from "@/server/next/action";
import { centavosDeTexto as reais } from "@/shared/money";
import type { ActionState } from "@/shared/action-state";
import {
  acceptQuote,
  addQuoteItem,
  changeQuoteStatus,
  createQuote,
  removeQuoteItem,
  setQuoteDiscount,
  setQuotePayer,
  setQuoteTerms,
} from "@/modules/quote/commands";
import { QUOTE_ACTIONS, type QuoteAction } from "@/modules/quote/schema";
import type { Surface } from "@/modules/chart/schema";

const criar = formAction(async (ctx, formData) => {
  const { id } = await createQuote(ctx, {
    patientId: String(formData.get("patientId") ?? ""),
    payerId: String(formData.get("payerId") ?? "") || null,
    opportunityId: String(formData.get("opportunityId") ?? "") || null,
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
    procedureId: String(formData.get("procedureId") ?? "") || null,
    description: String(formData.get("description") ?? ""),
    toothCode: String(formData.get("toothCode") ?? "") || null,
    surfaces: formData.getAll("surfaces").map(String) as Surface[],
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

/**
 * Trocar o convenio REPRECIFICA a proposta.
 *
 * A tela diz quantos itens mudaram de preco, porque o numero na frente do
 * paciente acabou de mudar e quem trocou precisa ver isso acontecer — nao
 * descobrir depois, quando o total nao bate com o que foi falado.
 */
const trocarConvenio = formAction(async (ctx, formData) => {
  const quoteId = String(formData.get("quoteId") ?? "");
  const payerId = String(formData.get("payerId") ?? "") || null;

  const { reprecificados } = await setQuotePayer(ctx, quoteId, payerId);

  revalidatePath(`/orcamentos/${quoteId}`);

  if (reprecificados === 0) {
    return {
      success: payerId
        ? "Convênio aplicado. Nenhum item tinha preço de tabela para reprecificar."
        : "Voltou para particular.",
    };
  }

  return {
    success: `Convênio aplicado. ${reprecificados} ${
      reprecificados === 1 ? "item reprecificado" : "itens reprecificados"
    }.`,
  };
}, "quote.write");

export async function trocarConvenioAction(
  previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return trocarConvenio(previous, formData);
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


const ROTULO: Record<string, string> = {
  sent: "Orçamento enviado ao paciente.",
  negotiating: "Reaberto para negociação.",
  rejected: "Perda registrada.",
  expired: "Marcado como vencido.",
  canceled: "Orçamento cancelado.",
};
