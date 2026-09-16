"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { formAction } from "@/server/next/action";
import { centavosDeTexto as reais } from "@/shared/money";
import { comAviso } from "@/shared/flash";
import { formatQuantidade } from "@/modules/stock/schema";
import type { ActionState } from "@/shared/action-state";
import {
  adjustBalance,
  blockLot,
  executePlanItem,
  registerLoss,
  registerPurchase,
  revertPlanItem,
  unblockLot,
} from "@/modules/stock/commands";

/**
 * Toda acao daqui revalida `/estoque` alem da propria tela.
 *
 * A lista de estoque e a que mostra "abaixo do minimo", e uma entrada que nao
 * tira o produto do alerta faz a pessoa lancar duas vezes.
 */
function atualizarEstoque(productId?: string): void {
  revalidatePath("/estoque");
  revalidatePath("/estoque/validade");
  if (productId) revalidatePath(`/estoque/${productId}`);
}

const entrada = formAction(async (ctx, formData) => {
  const productId = String(formData.get("productId") ?? "");

  await registerPurchase(ctx, {
    productId,
    quantity: String(formData.get("quantity") ?? ""),
    unitCostCents: reais(formData.get("unitCost")),
    lotNumber: String(formData.get("lotNumber") ?? ""),
    expiresOn: String(formData.get("expiresOn") ?? ""),
    invoiceNumber: String(formData.get("invoiceNumber") ?? ""),
    notes: String(formData.get("notes") ?? ""),
  });

  atualizarEstoque(productId);
  redirect(comAviso(`/estoque/${productId}`, "Entrada registrada."));
}, "inventory.write");

export async function registrarEntradaAction(
  previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return entrada(previous, formData);
}

const perda = formAction(async (ctx, formData) => {
  const productId = String(formData.get("productId") ?? "");

  await registerLoss(ctx, {
    productId,
    lotId: String(formData.get("lotId") ?? "") || null,
    quantity: String(formData.get("quantity") ?? ""),
    reason: String(formData.get("reason") ?? ""),
  });

  atualizarEstoque(productId);
  redirect(comAviso(`/estoque/${productId}`, "Perda registrada."));
}, "inventory.write");

export async function registrarPerdaAction(
  previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return perda(previous, formData);
}

const acerto = formAction(async (ctx, formData) => {
  const productId = String(formData.get("productId") ?? "");

  const { diferenca } = await adjustBalance(ctx, {
    productId,
    lotId: String(formData.get("lotId") ?? "") || null,
    countedQuantity: String(formData.get("countedQuantity") ?? ""),
    reason: String(formData.get("reason") ?? ""),
  });

  atualizarEstoque(productId);

  // A frase diz o que MUDOU, com sinal. "Acerto registrado" deixa quem contou
  // sem saber se o sistema entendeu sobra ou falta — que e a unica coisa que
  // ele queria confirmar.
  const aviso =
    diferenca === 0
      ? "A contagem bateu com o sistema: nada foi lançado."
      : diferenca > 0
        ? `Sobrou ${formatQuantidade(diferenca)} a mais do que o sistema tinha.`
        : `Faltou ${formatQuantidade(Math.abs(diferenca))} em relação ao sistema.`;

  redirect(comAviso(`/estoque/${productId}`, aviso));
}, "inventory.write");

export async function acertarSaldoAction(
  previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return acerto(previous, formData);
}

const bloquear = formAction(async (ctx, formData) => {
  const productId = String(formData.get("productId") ?? "");
  const lotId = String(formData.get("lotId") ?? "");

  if (String(formData.get("desbloquear") ?? "") === "1") {
    await unblockLot(ctx, lotId);
    atualizarEstoque(productId);
    redirect(comAviso(`/estoque/${productId}`, "Lote liberado."));
  }

  await blockLot(ctx, lotId, String(formData.get("reason") ?? ""));
  atualizarEstoque(productId);
  redirect(comAviso(`/estoque/${productId}`, "Lote bloqueado. Ele não sai mais em consumo."));
}, "inventory.write");

export async function bloquearLoteAction(
  previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return bloquear(previous, formData);
}

/**
 * Executar o procedimento.
 *
 * A mensagem conta quantas movimentacoes sairam, e nao so "executado": e assim
 * que quem clicou percebe, na hora, que a ficha tecnica do procedimento esta
 * vazia — em vez de descobrir no inventario do mes que vem.
 */
const executar = formAction(async (ctx, formData) => {
  const patientId = String(formData.get("patientId") ?? "");

  const movimentos = await executePlanItem(ctx, {
    itemId: String(formData.get("itemId") ?? ""),
    appointmentId: String(formData.get("appointmentId") ?? "") || null,
  });

  revalidatePath(`/pacientes/${patientId}`);
  atualizarEstoque();

  redirect(
    comAviso(
      `/pacientes/${patientId}`,
      movimentos === 0
        ? "Procedimento executado. Nenhum material saiu: este procedimento não tem ficha técnica."
        : movimentos === 1
          ? "Procedimento executado e 1 material baixado do estoque."
          : `Procedimento executado e ${movimentos} materiais baixados do estoque.`,
    ),
  );
}, "treatment_plan.execute");

export async function executarProcedimentoAction(
  previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return executar(previous, formData);
}

const estornar = formAction(async (ctx, formData) => {
  const patientId = String(formData.get("patientId") ?? "");

  const devolvidos = await revertPlanItem(ctx, {
    itemId: String(formData.get("itemId") ?? ""),
    reason: String(formData.get("reason") ?? ""),
  });

  revalidatePath(`/pacientes/${patientId}`);
  atualizarEstoque();

  redirect(
    comAviso(
      `/pacientes/${patientId}`,
      devolvidos === 0
        ? "Execução estornada. Não havia material para devolver."
        : `Execução estornada e ${devolvidos === 1 ? "o material devolvido" : `${devolvidos} materiais devolvidos`} ao estoque.`,
    ),
  );
}, "treatment_plan.execute");

export async function estornarProcedimentoAction(
  previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return estornar(previous, formData);
}
