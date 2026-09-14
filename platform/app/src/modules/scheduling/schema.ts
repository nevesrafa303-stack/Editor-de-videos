import { z } from "zod";

/** `YYYY-MM-DD` — o mesmo formato que o parser de `date` devolve do banco. */
export const diaSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Data invalida.");

export const agendaFilterSchema = z.object({
  date: diaSchema,
  unitId: z.uuid().optional(),
  providerId: z.uuid().optional(),
});

export type AgendaFilter = z.input<typeof agendaFilterSchema>;

/**
 * Transicoes que a agenda oferece.
 *
 * A lista de destinos validos vive no banco (`state_transition`) e e cobrada
 * por trigger. Aqui ficam apenas os destinos que ESTA tela sabe operar — o
 * banco continua sendo quem diz nao.
 */
export const APPOINTMENT_ACTIONS = [
  "confirmed",
  "arrived",
  "in_progress",
  "completed",
  "no_show",
  "canceled",
] as const;

export type AppointmentAction = (typeof APPOINTMENT_ACTIONS)[number];

export const changeStatusSchema = z.object({
  appointmentId: z.uuid(),
  to: z.enum(APPOINTMENT_ACTIONS),
  reason: z.string().trim().max(500).optional(),
});

export type ChangeStatusInput = z.input<typeof changeStatusSchema>;

export const createAppointmentSchema = z
  .object({
    patientId: z.uuid("Escolha o paciente."),
    providerId: z.uuid("Escolha o profissional."),
    procedureId: z.uuid().nullish(),
    date: diaSchema,
    /** `HH:MM` no fuso da unidade. */
    time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Horario invalido."),
    durationMinutes: z.coerce.number().int().min(5).max(480).default(60),
    notes: z.string().trim().max(1000).nullish(),
  })
  .transform((v) => ({ ...v, notes: v.notes?.length ? v.notes : null }));

export type CreateAppointmentInput = z.input<typeof createAppointmentSchema>;
