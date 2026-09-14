"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { assertPermission } from "@/server/tenant";
import { onlyDigits } from "@/lib/br";
import { parseBRL } from "@/lib/money";
import { parseISODate } from "@/lib/date";
import { LEAD_STAGES, SOURCE_LABEL, STAGE_LABEL, type Stage } from "@/domain/funnel";
import { toActionState, type ActionState } from "@/server/actions/types";
import type { ActivityType, LeadSource } from "@/generated/prisma/enums";

const leadSchema = z.object({
  name: z.string().trim().min(3, "Informe o nome do lead."),
  phone: z
    .string()
    .trim()
    .transform(onlyDigits)
    .refine((value) => value.length >= 10, "Telefone deve ter DDD + número."),
  email: z.string().trim().optional(),
  source: z.string().refine((value) => value in SOURCE_LABEL, "Origem inválida."),
  interest: z.string().trim().optional(),
  value: z.string().optional(),
  ownerId: z.string().optional(),
  nextFollowUpAt: z.string().optional(),
});

export async function createLead(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const { db, clinicId, session } = await assertPermission("leads:write");

    const input = leadSchema.parse({
      name: formData.get("name"),
      phone: formData.get("phone"),
      email: formData.get("email") ?? "",
      source: formData.get("source") ?? "OUTRO",
      interest: formData.get("interest") ?? "",
      value: formData.get("value") ?? "",
      ownerId: formData.get("ownerId") ?? "",
      nextFollowUpAt: formData.get("nextFollowUpAt") ?? "",
    });

    const lead = await db.lead.create({
      data: {
        clinicId,
        name: input.name,
        phone: input.phone,
        email: input.email || null,
        source: input.source as LeadSource,
        interest: input.interest || null,
        valueCents: parseBRL(input.value),
        ownerId: input.ownerId || session.userId,
        nextFollowUpAt: input.nextFollowUpAt ? parseISODate(input.nextFollowUpAt) : null,
      },
    });

    await db.leadActivity.create({
      data: {
        clinicId,
        leadId: lead.id,
        userId: session.userId,
        type: "NOTA",
        content: `Lead criado via ${SOURCE_LABEL[input.source] ?? input.source}.`,
      },
    });

    revalidatePath("/funil");
    return { success: `Lead ${input.name} adicionado ao funil.` };
  } catch (error) {
    return toActionState(error);
  }
}

/** Move o lead de etapa e deixa o rastro na linha do tempo. */
export async function moveLeadStage(leadId: string, stage: Stage): Promise<void> {
  const { db, clinicId, session } = await assertPermission("leads:write");

  if (!LEAD_STAGES.includes(stage)) throw new Error("Etapa inválida.");

  const lead = await db.lead.findUnique({ where: { id: leadId } });
  if (!lead) throw new Error("Lead não encontrado.");
  if (lead.stage === stage) return;

  await db.lead.update({
    where: { id: leadId },
    data: {
      stage,
      stageChangedAt: new Date(),
      ...(stage === "GANHO" || stage === "PERDIDO" ? { nextFollowUpAt: null } : {}),
    },
  });

  await db.leadActivity.create({
    data: {
      clinicId,
      leadId,
      userId: session.userId,
      type: "MUDANCA_ETAPA",
      content: `${STAGE_LABEL[lead.stage as Stage]} -> ${STAGE_LABEL[stage]}`,
    },
  });

  revalidatePath("/funil");
  revalidatePath(`/funil/${leadId}`);
  revalidatePath("/painel");
}

export async function addLeadActivity(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const { db, clinicId, session } = await assertPermission("leads:write");

    const leadId = String(formData.get("leadId"));
    const type = String(formData.get("type") || "NOTA") as ActivityType;
    const content = String(formData.get("content") || "").trim();
    const followUp = String(formData.get("nextFollowUpAt") || "");

    if (!content) return { error: "Escreva o que aconteceu no contato." };

    const lead = await db.lead.findUnique({ where: { id: leadId } });
    if (!lead) return { error: "Lead não encontrado." };

    await db.leadActivity.create({
      data: { clinicId, leadId, userId: session.userId, type, content },
    });

    if (followUp) {
      await db.lead.update({
        where: { id: leadId },
        data: { nextFollowUpAt: parseISODate(followUp) },
      });
    }

    revalidatePath(`/funil/${leadId}`);
    revalidatePath("/funil");
    return { success: "Contato registrado." };
  } catch (error) {
    return toActionState(error);
  }
}

export async function updateLead(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const { db } = await assertPermission("leads:write");
    const id = String(formData.get("id"));

    const input = leadSchema.parse({
      name: formData.get("name"),
      phone: formData.get("phone"),
      email: formData.get("email") ?? "",
      source: formData.get("source") ?? "OUTRO",
      interest: formData.get("interest") ?? "",
      value: formData.get("value") ?? "",
      ownerId: formData.get("ownerId") ?? "",
      nextFollowUpAt: formData.get("nextFollowUpAt") ?? "",
    });

    await db.lead.update({
      where: { id },
      data: {
        name: input.name,
        phone: input.phone,
        email: input.email || null,
        source: input.source as LeadSource,
        interest: input.interest || null,
        valueCents: parseBRL(input.value),
        ownerId: input.ownerId || null,
        nextFollowUpAt: input.nextFollowUpAt ? parseISODate(input.nextFollowUpAt) : null,
      },
    });

    revalidatePath(`/funil/${id}`);
    revalidatePath("/funil");
    return { success: "Lead atualizado." };
  } catch (error) {
    return toActionState(error);
  }
}

export async function markLeadLost(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const { db, clinicId, session } = await assertPermission("leads:write");
    const id = String(formData.get("id"));
    const reason = String(formData.get("lostReason") || "").trim();

    if (!reason) return { error: "Registre o motivo da perda." };

    await db.lead.update({
      where: { id },
      data: { stage: "PERDIDO", lostReason: reason, stageChangedAt: new Date(), nextFollowUpAt: null },
    });

    await db.leadActivity.create({
      data: {
        clinicId,
        leadId: id,
        userId: session.userId,
        type: "MUDANCA_ETAPA",
        content: `Perdido: ${reason}`,
      },
    });

    revalidatePath(`/funil/${id}`);
    revalidatePath("/funil");
    return { success: "Lead marcado como perdido." };
  } catch (error) {
    return toActionState(error);
  }
}

/**
 * Converte o lead em paciente. E o momento em que o funil vira operação: o
 * cadastro nasce com a origem preservada, para o relatório de aquisicao
 * continuar fazendo sentido depois da venda.
 */
export async function convertLeadToPatient(formData: FormData): Promise<void> {
  const { db, clinicId, session } = await assertPermission("patients:write");
  const id = String(formData.get("id"));

  const lead = await db.lead.findUnique({ where: { id } });
  if (!lead) throw new Error("Lead não encontrado.");
  if (lead.patientId) redirect(`/pacientes/${lead.patientId}`);

  const existing = await db.patient.findFirst({ where: { phone: lead.phone } });

  const patient =
    existing ??
    (await db.patient.create({
      data: {
        clinicId,
        name: lead.name,
        phone: lead.phone,
        email: lead.email,
        source: lead.source,
      },
    }));

  await db.lead.update({
    where: { id },
    data: {
      patientId: patient.id,
      stage: "GANHO",
      stageChangedAt: new Date(),
      nextFollowUpAt: null,
    },
  });

  await db.leadActivity.create({
    data: {
      clinicId,
      leadId: id,
      userId: session.userId,
      type: "MUDANCA_ETAPA",
      content: existing
        ? "Lead vinculado a um paciente já cadastrado."
        : "Lead convertido em paciente.",
    },
  });

  revalidatePath("/funil");
  revalidatePath("/pacientes");
  redirect(`/pacientes/${patient.id}`);
}
