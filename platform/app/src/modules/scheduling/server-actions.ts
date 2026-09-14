"use server";

import { revalidatePath } from "next/cache";
import { formAction } from "@/server/next/action";
import type { ActionState } from "@/shared/action-state";
import { changeAppointmentStatus, createAppointment } from "@/modules/scheduling/commands";
import { APPOINTMENT_ACTIONS, type AppointmentAction } from "@/modules/scheduling/schema";
import { redirect } from "next/navigation";

const mudarStatus = formAction(async (ctx, formData) => {
  const to = String(formData.get("to") ?? "");
  if (!APPOINTMENT_ACTIONS.includes(to as AppointmentAction)) {
    return { error: "Acao desconhecida." };
  }

  const reason = String(formData.get("reason") ?? "").trim();

  const { status } = await changeAppointmentStatus(ctx, {
    appointmentId: String(formData.get("appointmentId") ?? ""),
    to: to as AppointmentAction,
    ...(reason ? { reason } : {}),
  });

  revalidatePath("/agenda");
  return { success: ROTULO[status] ?? "Agendamento atualizado." };
});

export async function mudarStatusAction(
  previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return mudarStatus(previous, formData);
}

const agendar = formAction(async (ctx, formData) => {
  const data = String(formData.get("date") ?? "");

  await createAppointment(ctx, {
    patientId: String(formData.get("patientId") ?? ""),
    providerId: String(formData.get("providerId") ?? ""),
    procedureId: String(formData.get("procedureId") ?? "") || null,
    date: data,
    time: String(formData.get("time") ?? ""),
    durationMinutes: Number(formData.get("durationMinutes") ?? 60),
    notes: String(formData.get("notes") ?? ""),
  });

  revalidatePath("/agenda");
  redirect(`/agenda?data=${encodeURIComponent(data)}&agendado=1`);
}, "appointment.write");

export async function agendarAction(
  previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return agendar(previous, formData);
}

const ROTULO: Record<string, string> = {
  confirmed: "Consulta confirmada.",
  arrived: "Chegada registrada.",
  in_progress: "Atendimento iniciado.",
  completed: "Atendimento concluido.",
  no_show: "Falta registrada.",
  canceled: "Agendamento cancelado.",
  scheduled: "Agendamento reaberto.",
};
