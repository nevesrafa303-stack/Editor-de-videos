"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { assertPermission } from "@/server/tenant";
import { planTotals } from "@/domain/plan";
import { buildInstallments } from "@/domain/installments";
import { parseBRL } from "@/lib/money";
import { parseISODate } from "@/lib/date";
import { toActionState, type ActionState } from "@/server/actions/types";
import type { PaymentMethod, PlanStatus } from "@/generated/prisma/enums";

/**
 * Número sequencial por clínica (ORC-0001). Duas recepcionistas criando
 * orçamento no mesmo segundo podem pegar o mesmo número; a unique do banco
 * barra e tentamos de novo.
 */
async function nextPlanNumber(
  db: Awaited<ReturnType<typeof assertPermission>>["db"],
): Promise<number> {
  const last = await db.treatmentPlan.aggregate({ _max: { number: true } });
  return (last._max.number ?? 0) + 1;
}

export async function createPlan(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  let planId = "";

  try {
    const { db, clinicId, session } = await assertPermission("plans:write");

    const patientId = String(formData.get("patientId") || "");
    if (!patientId) return { error: "Selecione o paciente." };

    const professionalId = String(formData.get("professionalId") || "") || session.userId;
    const notes = String(formData.get("notes") || "").trim() || null;

    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        const plan = await db.treatmentPlan.create({
          data: {
            clinicId,
            patientId,
            professionalId,
            notes,
            number: await nextPlanNumber(db),
          },
        });
        planId = plan.id;
        break;
      } catch (error) {
        const code = (error as { code?: string }).code;
        if (code !== "P2002" || attempt === 2) throw error;
      }
    }
  } catch (error) {
    return toActionState(error);
  }

  revalidatePath("/orcamentos");
  redirect(`/orcamentos/${planId}`);
}

const itemSchema = z.object({
  planId: z.string().min(1),
  procedureId: z.string().optional(),
  description: z.string().trim().optional(),
  teeth: z.string().optional(),
  region: z.string().trim().optional(),
  quantity: z.coerce.number().int().min(1).max(99),
  unitPrice: z.string().optional(),
});

export async function addPlanItem(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const { db, clinicId } = await assertPermission("plans:write");

    const input = itemSchema.parse({
      planId: formData.get("planId"),
      procedureId: formData.get("procedureId") ?? "",
      description: formData.get("description") ?? "",
      teeth: formData.get("teeth") ?? "",
      region: formData.get("region") ?? "",
      quantity: formData.get("quantity") || 1,
      unitPrice: formData.get("unitPrice") ?? "",
    });

    const plan = await db.treatmentPlan.findUnique({ where: { id: input.planId } });
    if (!plan) return { error: "Orçamento não encontrado." };
    if (plan.status === "APROVADO" || plan.status === "CONCLUIDO") {
      return { error: "Orçamento aprovado não pode ser alterado. Crie um novo." };
    }

    const procedure = input.procedureId
      ? await db.procedure.findUnique({ where: { id: input.procedureId } })
      : null;

    const description = input.description || procedure?.name;
    if (!description) return { error: "Escolha um procedimento ou descreva o item." };

    // O preço digitado vence o do catalogo: negociacao acontece.
    const typedPrice = parseBRL(input.unitPrice);
    const unitPriceCents = typedPrice > 0 ? typedPrice : (procedure?.priceCents ?? 0);

    await db.treatmentPlanItem.create({
      data: {
        clinicId,
        planId: input.planId,
        procedureId: procedure?.id ?? null,
        description,
        teeth: parseTeeth(input.teeth),
        region: input.region || null,
        quantity: input.quantity,
        unitPriceCents,
      },
    });

    revalidatePath(`/orcamentos/${input.planId}`);
    return { success: "Item adicionado." };
  } catch (error) {
    return toActionState(error);
  }
}

/** "11, 12 21" -> ["11","12","21"] */
function parseTeeth(raw?: string): string[] {
  if (!raw) return [];
  return [...new Set(raw.split(/[^0-9]+/).filter((tooth) => tooth.length === 2))];
}

export async function removePlanItem(formData: FormData): Promise<void> {
  const { db } = await assertPermission("plans:write");
  const id = String(formData.get("id"));

  const item = await db.treatmentPlanItem.findUnique({ where: { id } });
  if (!item) return;

  const plan = await db.treatmentPlan.findUnique({ where: { id: item.planId } });
  if (plan?.status === "APROVADO" || plan?.status === "CONCLUIDO") {
    throw new Error("Orçamento aprovado não pode ser alterado.");
  }

  await db.treatmentPlanItem.delete({ where: { id } });
  revalidatePath(`/orcamentos/${item.planId}`);
}

export async function togglePlanItemDone(formData: FormData): Promise<void> {
  const { db } = await assertPermission("plans:write");
  const id = String(formData.get("id"));

  const item = await db.treatmentPlanItem.findUnique({ where: { id } });
  if (!item) return;

  await db.treatmentPlanItem.update({
    where: { id },
    data: { done: !item.done, doneAt: item.done ? null : new Date() },
  });

  // Todos os itens executados: o plano se fecha sozinho.
  const pending = await db.treatmentPlanItem.count({
    where: { planId: item.planId, done: false, id: { not: id } },
  });

  if (pending === 0 && item.done === false) {
    await db.treatmentPlan.update({
      where: { id: item.planId },
      data: { status: "CONCLUIDO" },
    });
  }

  revalidatePath(`/orcamentos/${item.planId}`);
}

export async function updatePlan(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const { db } = await assertPermission("plans:write");
    const id = String(formData.get("id"));

    const discountCents = parseBRL(String(formData.get("discount") ?? ""));
    const notes = String(formData.get("notes") || "").trim() || null;
    const status = String(formData.get("status") || "") as PlanStatus;

    const plan = await db.treatmentPlan.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!plan) return { error: "Orçamento não encontrado." };

    if (plan.status === "APROVADO" && status !== "APROVADO") {
      return { error: "Orçamento aprovado não volta para rascunho." };
    }

    const totals = planTotals(plan.items, discountCents);
    if (discountCents > totals.subtotalCents) {
      return { error: "O desconto não pode ser maior que o valor do orçamento." };
    }

    await db.treatmentPlan.update({
      where: { id },
      data: {
        discountCents,
        notes,
        ...(status && status !== plan.status ? { status } : {}),
      },
    });

    revalidatePath(`/orcamentos/${id}`);
    revalidatePath("/orcamentos");
    return { success: "Orçamento atualizado." };
  } catch (error) {
    return toActionState(error);
  }
}

const approveSchema = z.object({
  id: z.string().min(1),
  count: z.coerce.number().int().min(1).max(48),
  firstDueDate: z.string().min(1, "Informe o primeiro vencimento."),
  downPayment: z.string().optional(),
  method: z.string().optional(),
});

/**
 * Aprovar o orçamento e o único ponto em que o comercial vira financeiro:
 * gera as parcelas a receber de uma vez, dentro de uma transacao, para não
 * existir plano aprovado sem recebivel.
 */
export async function approvePlan(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  let approved: { planId: string; count: number } | null = null;

  try {
    const { db, clinicId } = await assertPermission("finance:write");

    const input = approveSchema.parse({
      id: formData.get("id"),
      count: formData.get("count") || 1,
      firstDueDate: formData.get("firstDueDate"),
      downPayment: formData.get("downPayment") ?? "",
      method: formData.get("method") ?? "",
    });

    const plan = await db.treatmentPlan.findUnique({
      where: { id: input.id },
      include: { items: true },
    });
    if (!plan) return { error: "Orçamento não encontrado." };
    if (plan.status === "APROVADO" || plan.status === "CONCLUIDO") {
      return { error: "Este orçamento já foi aprovado." };
    }
    if (plan.items.length === 0) return { error: "Adicione ao menos um item." };

    const totals = planTotals(plan.items, plan.discountCents);
    if (totals.totalCents <= 0) return { error: "O valor total precisa ser maior que zero." };

    const parcels = buildInstallments({
      totalCents: totals.totalCents,
      count: input.count,
      firstDueDate: parseISODate(input.firstDueDate),
      downPaymentCents: parseBRL(input.downPayment),
    });

    await db.$transaction([
      db.treatmentPlan.update({
        where: { id: plan.id },
        data: { status: "APROVADO", approvedAt: new Date() },
      }),
      db.installment.createMany({
        data: parcels.map((parcel) => ({
          clinicId,
          patientId: plan.patientId,
          planId: plan.id,
          number: parcel.number,
          totalCount: parcel.totalCount,
          dueDate: parcel.dueDate,
          amountCents: parcel.amountCents,
          method: (input.method || null) as PaymentMethod | null,
        })),
      }),
    ]);

    revalidatePath(`/orcamentos/${plan.id}`);
    revalidatePath("/orcamentos");
    revalidatePath("/financeiro");
    revalidatePath(`/pacientes/${plan.patientId}`);

    approved = { planId: plan.id, count: parcels.length };
  } catch (error) {
    return toActionState(error);
  }

  // A aprovacao trava o orçamento e o formulario some da tela junto com a
  // mensagem de sucesso. O aviso volta pela URL, já no estado novo da pagina.
  redirect(`/orcamentos/${approved.planId}?aprovado=${approved.count}`);
}
