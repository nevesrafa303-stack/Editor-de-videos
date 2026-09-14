/** Regras da agenda: conflitos, expediente e grade de horários. */

export type Slot = { startsAt: Date; endsAt: Date };

export type BusyBlock = Slot & {
  id: string;
  professionalId: string;
  roomId?: string | null;
};

export function overlaps(a: Slot, b: Slot): boolean {
  return a.startsAt < b.endsAt && b.startsAt < a.endsAt;
}

/**
 * Encontra conflitos de um horário contra o que já esta na agenda.
 * Um profissional não pode estar em dois lugares; uma sala também não pode
 * receber dois atendimentos ao mesmo tempo.
 */
export function findConflicts(
  candidate: Slot & { professionalId: string; roomId?: string | null; id?: string },
  busy: BusyBlock[],
): BusyBlock[] {
  return busy.filter((block) => {
    if (candidate.id && block.id === candidate.id) return false;
    if (!overlaps(candidate, block)) return false;

    const sameProfessional = block.professionalId === candidate.professionalId;
    const sameRoom =
      !!candidate.roomId && !!block.roomId && block.roomId === candidate.roomId;

    return sameProfessional || sameRoom;
  });
}

export type WorkingHours = {
  /** 0 = domingo ... 6 = sabado. */
  weekdays: number[];
  startHour: number;
  endHour: number;
  slotMinutes: number;
};

export const DEFAULT_WORKING_HOURS: WorkingHours = {
  weekdays: [1, 2, 3, 4, 5, 6],
  startHour: 8,
  endHour: 20,
  slotMinutes: 30,
};

/** Grade de horários de um dia, usada para desenhar a agenda. */
export function daySlots(day: Date, hours: WorkingHours = DEFAULT_WORKING_HOURS): Date[] {
  const slots: Date[] = [];
  const cursor = new Date(day.getFullYear(), day.getMonth(), day.getDate(), hours.startHour, 0, 0, 0);
  const end = new Date(day.getFullYear(), day.getMonth(), day.getDate(), hours.endHour, 0, 0, 0);

  while (cursor < end) {
    slots.push(new Date(cursor));
    cursor.setMinutes(cursor.getMinutes() + hours.slotMinutes);
  }
  return slots;
}

/** Horarios livres do profissional num dia, para uma duração pedida. */
export function freeSlots(
  day: Date,
  durationMin: number,
  busy: Slot[],
  hours: WorkingHours = DEFAULT_WORKING_HOURS,
): Date[] {
  if (!hours.weekdays.includes(day.getDay())) return [];

  const closing = new Date(day.getFullYear(), day.getMonth(), day.getDate(), hours.endHour, 0, 0, 0);

  return daySlots(day, hours).filter((start) => {
    const candidate = { startsAt: start, endsAt: addMinutes(start, durationMin) };
    if (candidate.endsAt > closing) return false;
    return !busy.some((block) => overlaps(candidate, block));
  });
}

export function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60_000);
}

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
}

export function endOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}

export function startOfWeek(date: Date): Date {
  const start = startOfDay(date);
  // Semana comeca na segunda-feira, como a maioria das clínicas organiza.
  const offset = (start.getDay() + 6) % 7;
  start.setDate(start.getDate() - offset);
  return start;
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
}

export function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}
