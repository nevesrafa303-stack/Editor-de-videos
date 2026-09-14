/**
 * Porta publica do modulo de agenda.
 *
 * Fora daqui, importa-se `@/modules/scheduling` — nunca um arquivo interno.
 */
export {
  getDayAgenda,
  type DayAgenda,
  type AgendaAppointment,
  type AgendaProvider,
  type AgendaBlock,
} from "@/modules/scheduling/queries";

export { changeAppointmentStatus, createAppointment } from "@/modules/scheduling/commands";

export {
  agendaFilterSchema,
  changeStatusSchema,
  createAppointmentSchema,
  APPOINTMENT_ACTIONS,
  type AgendaFilter,
  type AppointmentAction,
  type ChangeStatusInput,
  type CreateAppointmentInput,
} from "@/modules/scheduling/schema";
