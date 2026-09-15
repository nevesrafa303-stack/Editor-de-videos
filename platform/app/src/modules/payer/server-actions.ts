"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { formAction } from "@/server/next/action";
import type { ActionState } from "@/shared/action-state";
import { savePayer, setPayerPrice } from "@/modules/payer/commands";
import { centavosDeTexto } from "@/shared/money";
import { BILLING_MODES, PAYER_KINDS, type BillingMode, type PayerKind } from "@/modules/payer/schema";

const salvar = formAction(async (ctx, formData) => {
  const id = String(formData.get("id") ?? "") || null;

  const { id: salvo } = await savePayer(ctx, {
    id,
    code: String(formData.get("code") ?? "")
      .trim()
      .toUpperCase(),
    name: String(formData.get("name") ?? ""),
    kind: escolha(formData.get("kind"), PAYER_KINDS, "insurance"),
    billingMode: escolha(formData.get("billingMode"), BILLING_MODES, "reimbursement"),
    settlementDays: Number(formData.get("settlementDays") ?? 0),
    adminFeePercent: Number(String(formData.get("adminFeePercent") ?? "0").replace(",", ".")),
    notes: String(formData.get("notes") ?? ""),
    isActive: formData.get("isActive") !== "0",
  });

  revalidatePath("/convenios");

  // Convênio novo abre direto na tabela de preços: cadastrar o nome não serve
  // para nada enquanto nenhum procedimento tem preço.
  if (!id) redirect(`/convenios/${salvo}`);

  revalidatePath(`/convenios/${salvo}`);
  return { success: "Convênio salvo." };
}, "price.write");

export async function salvarConvenioAction(
  previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return salvar(previous, formData);
}

const precificar = formAction(async (ctx, formData) => {
  const payerId = String(formData.get("payerId") ?? "");

  await setPayerPrice(ctx, {
    payerId,
    procedureId: String(formData.get("procedureId") ?? ""),
    priceCents: centavosDeTexto(formData.get("price")),
    maxDiscountPercent: Number(String(formData.get("maxDiscountPercent") ?? "0").replace(",", ".")),
    patientShareCents: centavosDeTexto(formData.get("patientShare")),
  });

  revalidatePath(`/convenios/${payerId}`);
  return { success: "Preço atualizado." };
}, "price.write");

export async function precificarAction(
  previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return precificar(previous, formData);
}


/** Valor de `select` vindo do formulario, com padrao quando nao bate. */
function escolha<T extends string>(
  valor: FormDataEntryValue | null,
  validos: readonly T[],
  padrao: T,
): T {
  const texto = String(valor ?? "");
  return validos.includes(texto as T) ? (texto as T) : padrao;
}
