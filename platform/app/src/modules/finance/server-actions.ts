"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { formAction } from "@/server/next/action";
import type { ActionState } from "@/shared/action-state";
import {
  addCashMovement,
  closeCashSession,
  openCashSession,
  receivePayment,
  reversePayment,
} from "@/modules/finance/commands";
import { CASH_MOVEMENT_KINDS, type CashMovementKind } from "@/modules/finance/schema";
import { formatBRL } from "@/shared/format";
import { comAviso } from "@/shared/flash";

const receber = formAction(async (ctx, formData) => {
  const recibo = await receivePayment(ctx, {
    installmentId: String(formData.get("installmentId") ?? ""),
    paymentMethodId: String(formData.get("paymentMethodId") ?? ""),
    amountCents: reais(formData.get("amount")),
    waiveCharges: formData.get("waiveCharges") === "on",
    notes: String(formData.get("notes") ?? "") || null,
  });

  revalidatePath("/financeiro");
  revalidatePath("/financeiro/caixa");

  const mora = recibo.fineCents + recibo.interestCents;

  const extras =
    mora > 0
      ? ` Sendo ${formatBRL(recibo.principalCents)} de parcela e ${formatBRL(mora)} de multa e juros.`
      : recibo.waived
        ? " Multa e juros perdoados."
        : "";

  const mensagem =
    (recibo.installmentStatus === "paid"
      ? `Recebido ${formatBRL(recibo.amountCents)}. Parcela quitada.`
      : `Recebido ${formatBRL(recibo.amountCents)}. A parcela segue em aberto.`) + extras;

  // Volta para o mesmo recorte e a mesma busca: quem estava trabalhando na
  // lista de vencidas continua nela.
  const recorte = String(formData.get("recorte") ?? "vencidas");
  const busca = String(formData.get("busca") ?? "");

  redirect(
    comAviso(`/financeiro?recorte=${encodeURIComponent(recorte)}&busca=${encodeURIComponent(busca)}`, mensagem),
  );
}, "payment.register");

export async function receberAction(
  previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return receber(previous, formData);
}

const estornar = formAction(async (ctx, formData) => {
  await reversePayment(ctx, {
    paymentId: String(formData.get("paymentId") ?? ""),
    reason: String(formData.get("reason") ?? ""),
  });

  revalidatePath("/financeiro");
  revalidatePath("/financeiro/caixa");
  return { success: "Estorno registrado. O pagamento continua no histórico." };
}, "payment.reverse");

export async function estornarAction(
  previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return estornar(previous, formData);
}

const abrirCaixa = formAction(async (ctx, formData) => {
  await openCashSession(ctx, {
    openingCents: reais(formData.get("opening")),
    notes: String(formData.get("notes") ?? "") || null,
  });

  revalidatePath("/financeiro/caixa");
  revalidatePath("/financeiro");

  // O formulario de abertura e substituido pela gaveta: sem isto, nada
  // confirma que o caixa abriu.
  redirect(comAviso("/financeiro/caixa", "Caixa aberto."));
}, "cash.open");

export async function abrirCaixaAction(
  previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return abrirCaixa(previous, formData);
}

const fecharCaixa = formAction(async (ctx, formData) => {
  const fechamento = await closeCashSession(ctx, {
    sessionId: String(formData.get("sessionId") ?? ""),
    countedCents: reais(formData.get("counted")),
    notes: String(formData.get("notes") ?? "") || null,
  });

  revalidatePath("/financeiro/caixa");
  revalidatePath("/financeiro");

  const mensagem =
    fechamento.differenceCents === 0
      ? "Caixa fechado. O contado bate com o esperado."
      : `Caixa fechado com ${fechamento.differenceCents > 0 ? "sobra" : "falta"} de ` +
        `${formatBRL(Math.abs(fechamento.differenceCents))}. A diferença ficou registrada.`;

  redirect(comAviso("/financeiro/caixa", mensagem));
}, "cash.close");

export async function fecharCaixaAction(
  previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return fecharCaixa(previous, formData);
}

const movimentar = formAction(async (ctx, formData) => {
  const kind = String(formData.get("kind") ?? "");
  if (!CASH_MOVEMENT_KINDS.includes(kind as CashMovementKind)) {
    return { error: "Tipo de movimentação desconhecido." };
  }

  await addCashMovement(ctx, {
    sessionId: String(formData.get("sessionId") ?? ""),
    kind: kind as CashMovementKind,
    amountCents: reais(formData.get("amount")),
    description: String(formData.get("description") ?? ""),
  });

  revalidatePath("/financeiro/caixa");
  return { success: "Movimentação registrada." };
}, "cash.open");

export async function movimentarCaixaAction(
  previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return movimentar(previous, formData);
}

/** "1.234,56" -> 123456. Aceita o que a recepcao digita de verdade. */
function reais(valor: FormDataEntryValue | null): number {
  const texto = String(valor ?? "").trim();
  if (!texto) return 0;

  const limpo = texto.replace(/[^\d,.-]/g, "");
  const normalizado = limpo.includes(",") ? limpo.replace(/\./g, "").replace(",", ".") : limpo;
  const numero = Number(normalizado);

  return Number.isFinite(numero) ? Math.round(numero * 100) : 0;
}
