"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertPermission } from "@/server/tenant";
import { addMinutes, findConflicts, type BusyBlock } from "@/domain/scheduling";
import { formatDateTime } from "@/lib/date";
import { toActionState, type ActionState } from "@/server/actions/types";
import type { AppointmentStatus } from "@/generated/prisma/enums";

const appointmentSchema = z.object({
  patientId: z.string().min(1, "Selecione o paciente."),
  professionalId: z.string().min(1, "Selecione o profissional."),
  roomId: z.string().transform((value) => value || null).nullable(),
  procedureId: z.string().transform((value) => value || null).nullable(),
  startsAt: z.string().min(1, "Informe data e hora."),
  durationMin: z.coerce.number().int().min(5).max(480),
  notes: z.string().trim().transform((value) => value || null).nullable(),
});

/**
 * Carrega a agenda do dia para checar conflito. Buscamos o dia inteiro (e não
 * so a janela do agendamento) porque e barato e evita erro de borda com
 * atendimentos longos que comecam antes da janela.
 */
async function busyOnDay(
  db: Awaited<ReturnType<typeof assertPermission>>["db"],
  day: Date,
): Promise<BusyBlock[]> {
  const start = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 0, 0, 0, 0);
  const end = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 23, 59, 59, 999);

  const rows = await db.appointment.findMany({
    where: {
      startsAt: { gte: start, lte: end },
      status: { notIn: ["CANCELADO", "FALTOU"] },
    },
    select: {
      id: true,
      professionalId: true,
      roomId: true,
      startsAt: true,
      endsAt: true,
    },
  });

  return rows.map((row) => ({ ...row, startsAt: row.startsAt, endsAt: row.endsAt }));
}

export async function createAppointment(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const { db, clinicId } = await assertPermission("agenda:write");

    const input = appointmentSchema.parse({
      patientId: formData.get("patientId"),
      professionalId: formData.get("professionalId"),
      roomId: formData.get("roomId") ?? "",
      procedureId: formData.get("procedureId") ?? "",
      startsAt: formData.get("startsAt"),
      durationMin: formData.get("durationMin"),
      notes: formData.get("notes") ?? "",
    });

    const startsAt = new Date(input.startsAt);
    if (Number.isNaN(startsAt.getTime())) return { error: "Data e hora invalidas." };
    const endsAt = addMinutes(startsAt, input.durationMin);

    const conflicts = findConflicts(
      {
        professionalId: input.professionalId,
        roomId: input.roomId,
        startsAt,
        endsAt,
      },
      await busyOnDay(db, startsAt),
    );

    if (conflicts.length > 0) {
      return { error: conflictMessage(conflicts, input.professionalId) };
    }

    await db.appointment.create({
      data: {
        clinicId,
        patientId: input.patientId,
        professionalId: input.professionalId,
        roomId: input.roomId,
        procedureId: input.procedureId,
        startsAt,
        endsAt,
        notes: input.notes,
      },
    });

    revalidatePath("/agenda");
    revalidatePath("/painel");
    revalidatePath(`/pacientes/${input.patientId}`);
    return { success: `Agendado para ${formatDateTime(startsAt)}.` };
  } catch (error) {
    return toActionState(error);
  }
}

export async function rescheduleAppointment(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const { db } = await assertPermission("agenda:write");
    const id = String(formData.get("id"));
    const startsAtRaw = String(formData.get("startsAt"));
    const durationMin = Number(formData.get("durationMin"));

    const current = await db.appointment.findUnique({ where: { id } });
    if (!current) return { error: "Agendamento não encontrado." };

    const startsAt = new Date(startsAtRaw);
    if (Number.isNaN(startsAt.getTime())) return { error: "Data e hora invalidas." };

    const endsAt = addMinutes(
      startsAt,
      Number.isFinite(durationMin) && durationMin > 0
        ? durationMin
        : Math.round((current.endsAt.getTime() - current.startsAt.getTime()) / 60_000),
    );

    const conflicts = findConflicts(
      {
        id,
        professionalId: current.professionalId,
        roomId: current.roomId,
        startsAt,
        endsAt,
      },
      await busyOnDay(db, startsAt),
    );

    if (conflicts.length > 0) {
      return { error: conflictMessage(conflicts, current.professionalId) };
    }

    await db.appointment.update({
      where: { id },
      data: { startsAt, endsAt, status: "AGENDADO" },
    });

    revalidatePath("/agenda");
    return { success: `Remarcado para ${formatDateTime(startsAt)}.` };
  } catch (error) {
    return toActionState(error);
  }
}

const STATUSES: AppointmentStatus[] = [
  "AGENDADO",
  "CONFIRMADO",
  "ATENDIDO",
  "FALTOU",
  "CANCELADO",
];

export async function setAppointmentStatus(formData: FormData): Promise<void> {
  const { db } = await assertPermission("agenda:write");
  const id = String(formData.get("id"));
  const status = String(formData.get("status")) as AppointmentStatus;

  if (!STATUSES.includes(status)) throw new Error("Status inválido.");

  const appointment = await db.appointment.update({ where: { id }, data: { status } });

  revalidatePath("/agenda");
  revalidatePath("/painel");
  revalidatePath(`/pacientes/${appointment.patientId}`);
}

function conflictMessage(conflicts: BusyBlock[], professionalId: string): string {
  const sameProfessional = conflicts.some((c) => c.professionalId === professionalId);
  return sameProfessional
    ? "Este profissional já tem atendimento nesse horario."
    : "A sala escolhida já esta ocupada nesse horario.";
}
