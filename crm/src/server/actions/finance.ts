"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertPermission } from "@/server/tenant";
import { parseBRL } from "@/lib/money";
import { parseISODate } from "@/lib/date";
import { toActionState, type ActionState } from "@/server/actions/types";
import type { PaymentMethod } from "@/generated/prisma/enums";

const paymentSchema = z.object({
  installmentId: z.string().min(1),
  amount: z.string().optional(),
  method: z.string().min(1, "Informe a forma de pagamento."),
  paidAt: z.string().optional(),
  note: z.string().optional(),
});

/**
 * Baixa de parcela. Aceita pagamento parcial: a parcela so vira PAGA quando a
 * soma dos recebimentos alcanca o valor. Pagar a mais e erro de digitacao, não
 * credito, entao barramos.
 */
export async function registerPayment(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const { db, clinicId, session } = await assertPermission("finance:write");

    const input = paymentSchema.parse({
      installmentId: formData.get("installmentId"),
      amount: formData.get("amount") ?? "",
      method: formData.get("method"),
      paidAt: formData.get("paidAt") ?? "",
      note: formData.get("note") ?? "",
    });

    const installment = await db.installment.findUnique({
      where: { id: input.installmentId },
    });
    if (!installment) return { error: "Parcela não encontrada." };
    if (installment.status === "CANCELADA") return { error: "Parcela cancelada." };

    const remaining = installment.amountCents - installment.paidCents;
    if (remaining <= 0) return { error: "Esta parcela já esta quitada." };

    const typed = parseBRL(input.amount);
    const amountCents = typed > 0 ? typed : remaining;

    if (amountCents > remaining) {
      return { error: "O valor informado e maior do que o saldo da parcela." };
    }

    const paidCents = installment.paidCents + amountCents;

    await db.$transaction([
      db.payment.create({
        data: {
          clinicId,
          installmentId: installment.id,
          amountCents,
          method: input.method as PaymentMethod,
          paidAt: input.paidAt ? parseISODate(input.paidAt) : new Date(),
          userId: session.userId,
          note: input.note || null,
        },
      }),
      db.installment.update({
        where: { id: installment.id },
        data: {
          paidCents,
          method: input.method as PaymentMethod,
          status: paidCents >= installment.amountCents ? "PAGA" : "ABERTA",
        },
      }),
    ]);

    revalidatePath("/financeiro");
    revalidatePath(`/pacientes/${installment.patientId}`);
    revalidatePath("/painel");
    return {
      success:
        paidCents >= installment.amountCents
          ? "Parcela quitada."
          : "Pagamento parcial registrado.",
    };
  } catch (error) {
    return toActionState(error);
  }
}

export async function cancelInstallment(formData: FormData): Promise<void> {
  const { db } = await assertPermission("finance:write");
  const id = String(formData.get("id"));

  const installment = await db.installment.findUnique({ where: { id } });
  if (!installment) return;
  if (installment.paidCents > 0) {
    throw new Error("Parcela com pagamento registrado não pode ser cancelada.");
  }

  await db.installment.update({ where: { id }, data: { status: "CANCELADA" } });

  revalidatePath("/financeiro");
  revalidatePath(`/pacientes/${installment.patientId}`);
}

/** Estorna um recebimento lancado por engano e devolve a parcela para aberta. */
export async function reversePayment(formData: FormData): Promise<void> {
  const { db } = await assertPermission("finance:write");
  const id = String(formData.get("id"));

  const payment = await db.payment.findUnique({ where: { id } });
  if (!payment) return;

  const installment = await db.installment.findUnique({
    where: { id: payment.installmentId },
  });
  if (!installment) return;

  const paidCents = Math.max(installment.paidCents - payment.amountCents, 0);

  await db.$transaction([
    db.payment.delete({ where: { id } }),
    db.installment.update({
      where: { id: installment.id },
      data: {
        paidCents,
        status: paidCents >= installment.amountCents ? "PAGA" : "ABERTA",
      },
    }),
  ]);

  revalidatePath("/financeiro");
  revalidatePath(`/pacientes/${installment.patientId}`);
}

/** Lançamento avulso, para venda de produto ou cobranca fora de orçamento. */
export async function createManualInstallment(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const { db, clinicId } = await assertPermission("finance:write");

    const patientId = String(formData.get("patientId") || "");
    const amountCents = parseBRL(String(formData.get("amount") ?? ""));
    const dueDateRaw = String(formData.get("dueDate") || "");

    if (!patientId) return { error: "Selecione o paciente." };
    if (amountCents <= 0) return { error: "Informe um valor maior que zero." };
    if (!dueDateRaw) return { error: "Informe o vencimento." };

    await db.installment.create({
      data: {
        clinicId,
        patientId,
        number: 1,
        totalCount: 1,
        dueDate: parseISODate(dueDateRaw),
        amountCents,
      },
    });

    revalidatePath("/financeiro");
    revalidatePath(`/pacientes/${patientId}`);
    return { success: "Lançamento criado." };
  } catch (error) {
    return toActionState(error);
  }
}
