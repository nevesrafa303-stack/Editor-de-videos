import 'server-only';

import { getRepository } from '@/db';
import type { BusyInterval } from '@/db/types';
import { features, serverEnv } from '@/lib/config/env';
import { getService } from '@/lib/config/services';
import { calendarService } from '@/services/calendar';

import { buildDaySlots, getDayBounds, isWithinBookingWindow, type Slot } from './schedule';

export type SlotView = {
  time: string;
  available: boolean;
};

export type AvailabilityView = {
  date: string;
  service: string;
  timezone: string;
  /** `false` quando `BOOKING_HOURS` ainda nao foi configurado. */
  scheduleConfigured: boolean;
  /**
   * `true` quando o Google Calendar nao respondeu. Os horarios continuam sendo
   * exibidos (calculados so com o banco), mas a UI avisa que a confirmacao
   * final acontece no envio.
   */
  degraded: boolean;
  slots: SlotView[];
};

function overlaps(slot: Slot, interval: { start: Date; end: Date }): boolean {
  return slot.startsAt < interval.end && slot.endsAt > interval.start;
}

/**
 * Concilia as duas fontes de ocupacao.
 *
 * Todo agendamento confirmado vira evento no Google Calendar. Somar as duas
 * listas cruas contaria o mesmo compromisso duas vezes, entao: quando o
 * Calendar respondeu, ele e' a verdade para o que ja virou evento, e do banco
 * entram apenas os agendamentos que ainda nao tem evento (falha na criacao,
 * ou integracao desligada) e os bloqueios manuais.
 */
function mergeBusy(
  dbBusy: BusyInterval[],
  calendarBusy: { start: Date; end: Date }[] | null,
): { intervals: { start: Date; end: Date }[]; degraded: boolean } {
  if (calendarBusy === null) {
    return { intervals: dbBusy, degraded: true };
  }

  if (!features.calendar) {
    return { intervals: dbBusy, degraded: false };
  }

  const withoutEvent = dbBusy.filter((interval) => interval.googleEventId === null);
  return { intervals: [...withoutEvent, ...calendarBusy], degraded: false };
}

/** Quantos compromissos ativos colidem com o slot. */
function countConflicts(slot: Slot, intervals: { start: Date; end: Date }[]): number {
  return intervals.reduce((total, interval) => (overlaps(slot, interval) ? total + 1 : total), 0);
}

/**
 * Grade de horarios de um dia, ja marcando o que esta livre.
 *
 * Horarios ocupados continuam na resposta (marcados como indisponiveis): ver o
 * horario riscado comunica muito melhor que ele sumir da tela.
 */
export async function getAvailability(
  isoDate: string,
  serviceSlug: string,
): Promise<AvailabilityView> {
  const { timezone, concurrency } = serverEnv.booking;

  const base: AvailabilityView = {
    date: isoDate,
    service: serviceSlug,
    timezone,
    scheduleConfigured: features.businessHours,
    degraded: false,
    slots: [],
  };

  const service = getService(serviceSlug);
  if (service === null || !features.businessHours || !isWithinBookingWindow(isoDate)) {
    return base;
  }

  const slots = buildDaySlots(isoDate, service.durationMinutes);
  if (slots.length === 0) return base;

  const { from, to } = getDayBounds(isoDate);
  const repository = await getRepository();

  // O servico pode terminar depois da meia-noite civil; a janela consultada
  // acompanha a duracao para nao perder colisao na virada do dia.
  const windowEnd = new Date(to.getTime() + service.durationMinutes * 60_000);

  const [dbBusy, calendarBusy] = await Promise.all([
    repository.findBusyIntervals(from, windowEnd),
    calendarService.getBusyIntervals(from, windowEnd),
  ]);

  const { intervals, degraded } = mergeBusy(dbBusy, calendarBusy);

  return {
    ...base,
    degraded,
    slots: slots.map((slot) => ({
      time: slot.time,
      available: countConflicts(slot, intervals) < concurrency,
    })),
  };
}

/**
 * Revalida um horario especifico no momento da confirmacao.
 *
 * A grade que o cliente viu pode ter minutos de idade. Esta funcao devolve o
 * slot exato (com instantes UTC) apenas se ele continuar existindo e livre.
 */
export async function resolveSlot(
  isoDate: string,
  time: string,
  serviceSlug: string,
): Promise<
  | { ok: true; slot: Slot }
  | { ok: false; reason: 'schedule_unconfigured' | 'out_of_window' | 'invalid_slot' | 'slot_taken' }
> {
  if (!features.businessHours) return { ok: false, reason: 'schedule_unconfigured' };
  if (!isWithinBookingWindow(isoDate)) return { ok: false, reason: 'out_of_window' };

  const service = getService(serviceSlug);
  if (service === null) return { ok: false, reason: 'invalid_slot' };

  const slot = buildDaySlots(isoDate, service.durationMinutes).find(
    (candidate) => candidate.time === time,
  );
  if (!slot) return { ok: false, reason: 'invalid_slot' };

  const repository = await getRepository();
  const windowEnd = new Date(slot.endsAt.getTime());

  const [dbBusy, calendarBusy] = await Promise.all([
    repository.findBusyIntervals(slot.startsAt, windowEnd),
    calendarService.getBusyIntervals(slot.startsAt, windowEnd),
  ]);

  const { intervals } = mergeBusy(dbBusy, calendarBusy);
  if (countConflicts(slot, intervals) >= serverEnv.booking.concurrency) {
    return { ok: false, reason: 'slot_taken' };
  }

  return { ok: true, slot };
}
