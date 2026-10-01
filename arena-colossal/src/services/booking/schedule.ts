import 'server-only';

import { serverEnv } from '@/lib/config/env';
import {
  isoDateWeekday,
  minutesToLabel,
  todayIsoDate,
  utcToIsoDate,
  zonedToUtc,
} from '@/lib/utils/timezone';

const WEEKDAY_NAMES = [
  'Domingo',
  'Segunda',
  'Terça',
  'Quarta',
  'Quinta',
  'Sexta',
  'Sábado',
] as const;

export type Slot = {
  /** `"14:30"` — horario local da operacao. */
  time: string;
  startsAt: Date;
  endsAt: Date;
};

/**
 * Primeiro e ultimo dia que o cliente pode escolher.
 *
 * O primeiro dia respeita a antecedencia minima: com 12h de antecedencia, quem
 * acessa as 20h nao deve nem ver o dia seguinte comecando as 8h como opcao. Sem
 * esse deslocamento, o cliente escolheria uma data so para descobrir na tela
 * seguinte que ela nao tem horario nenhum.
 */
export function getBookingWindow(): { first: string; last: string } {
  const { timezone, maxAdvanceDays, minNoticeHours } = serverEnv.booking;

  const earliest = new Date(Date.now() + minNoticeHours * 3_600_000);
  const first = utcToIsoDate(earliest, timezone);

  const [year, month, day] = todayIsoDate(timezone).split('-').map(Number) as [
    number,
    number,
    number,
  ];
  const last = new Date(Date.UTC(year, month - 1, day + maxAdvanceDays)).toISOString().slice(0, 10);

  return { first, last };
}

export function isBlackoutDate(isoDate: string): boolean {
  return serverEnv.booking.blackoutDates.includes(isoDate);
}

export function isWithinBookingWindow(isoDate: string): boolean {
  const { first, last } = getBookingWindow();
  return isoDate >= first && isoDate <= last;
}

/**
 * Gera a grade de horarios candidatos de um dia para um servico.
 *
 * "Candidato" significa apenas: cabe dentro de uma janela de atendimento e
 * respeita a antecedencia minima. Se o horario esta livre ou nao e' decidido em
 * `availability.ts`, que cruza esta grade com a agenda real.
 *
 * Um servico so entra na grade se terminar DENTRO da janela — nao existe
 * polimento de 8h comecando as 17h.
 */
export function buildDaySlots(isoDate: string, durationMinutes: number): Slot[] {
  const { timezone, slotMinutes, minNoticeHours, businessHours } = serverEnv.booking;

  if (businessHours.length === 0) return [];
  if (isBlackoutDate(isoDate)) return [];

  const weekday = isoDateWeekday(isoDate);
  const windows = businessHours.filter((window) => window.weekday === weekday);
  if (windows.length === 0) return [];

  const earliestAllowed = new Date(Date.now() + minNoticeHours * 3_600_000);
  const slots: Slot[] = [];

  for (const window of windows) {
    for (
      let minutes = window.openMinutes;
      minutes + durationMinutes <= window.closeMinutes;
      minutes += slotMinutes
    ) {
      const startsAt = zonedToUtc(isoDate, minutes, timezone);
      if (startsAt < earliestAllowed) continue;

      slots.push({
        time: minutesToLabel(minutes),
        startsAt,
        endsAt: new Date(startsAt.getTime() + durationMinutes * 60_000),
      });
    }
  }

  return slots;
}

/** Limites do dia civil em UTC — usado para consultar agenda e Calendar. */
export function getDayBounds(isoDate: string): { from: Date; to: Date } {
  const { timezone } = serverEnv.booking;
  return {
    from: zonedToUtc(isoDate, 0, timezone),
    to: zonedToUtc(isoDate, 24 * 60, timezone),
  };
}

export type BusinessHoursLine = { day: string; hours: string };

/**
 * Horario de funcionamento para exibicao, agrupando dias com a mesma janela.
 *
 * Devolve `[]` quando `BOOKING_HOURS` nao esta configurado: o rodape entao nao
 * mostra horario nenhum, em vez de inventar um.
 */
export function describeBusinessHours(): BusinessHoursLine[] {
  const { businessHours } = serverEnv.booking;
  if (businessHours.length === 0) return [];

  const byWeekday = new Map<number, string[]>();
  for (const window of businessHours) {
    const label = `${minutesToLabel(window.openMinutes)} – ${minutesToLabel(window.closeMinutes)}`;
    const list = byWeekday.get(window.weekday) ?? [];
    list.push(label);
    byWeekday.set(window.weekday, list);
  }

  // Segunda -> domingo, na ordem em que uma pessoa espera ler.
  const order = [1, 2, 3, 4, 5, 6, 0];
  const lines: BusinessHoursLine[] = [];
  let current: { start: number; end: number; hours: string } | null = null;

  for (const weekday of order) {
    const hours = byWeekday.get(weekday)?.join(', ') ?? null;

    if (hours === null) {
      if (current) {
        lines.push(formatRange(current));
        current = null;
      }
      continue;
    }

    if (current && current.hours === hours) {
      current.end = weekday;
    } else {
      if (current) lines.push(formatRange(current));
      current = { start: weekday, end: weekday, hours };
    }
  }

  if (current) lines.push(formatRange(current));
  return lines;
}

function formatRange(range: { start: number; end: number; hours: string }): BusinessHoursLine {
  const start = WEEKDAY_NAMES[range.start] ?? '';
  const end = WEEKDAY_NAMES[range.end] ?? '';
  return {
    day: range.start === range.end ? start : `${start} a ${end}`,
    hours: range.hours,
  };
}

/** Janelas de atendimento em formato `HH:MM` — usado no JSON-LD. */
export function getOpeningWindows(): { weekday: number; open: string; close: string }[] {
  return serverEnv.booking.businessHours.map((window) => ({
    weekday: window.weekday,
    open: minutesToLabel(window.openMinutes),
    close: minutesToLabel(window.closeMinutes),
  }));
}

/** Configuracao de agenda que o formulario precisa conhecer no cliente. */
export type PublicBookingConfig = {
  firstDate: string;
  lastDate: string;
  /** Dias da semana com atendimento (0 = domingo). */
  openWeekdays: number[];
  blackoutDates: string[];
  scheduleConfigured: boolean;
  timezone: string;
};

/**
 * Dados publicos da agenda, injetados no formulario pelo servidor.
 *
 * Com isso o seletor de data ja nasce sabendo quais dias estao fechados — sem
 * uma requisicao por dia so para descobrir que a Arena nao abre no domingo.
 * Nada aqui e' sensivel: sao os mesmos horarios que qualquer cliente ve.
 */
export function getPublicBookingConfig(): PublicBookingConfig {
  const window = getBookingWindow();
  const openWeekdays = [...new Set(serverEnv.booking.businessHours.map((entry) => entry.weekday))];

  return {
    firstDate: window.first,
    lastDate: window.last,
    openWeekdays: openWeekdays.sort((a, b) => a - b),
    blackoutDates: serverEnv.booking.blackoutDates,
    scheduleConfigured: openWeekdays.length > 0,
    timezone: serverEnv.booking.timezone,
  };
}
