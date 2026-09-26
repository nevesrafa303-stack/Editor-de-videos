import 'server-only';

import { serverEnv } from '@/lib/config/env';
import { minutesToLabel, utcToMinutes } from '@/lib/utils/timezone';
import type { Booking } from '@/db/types';

/** `14:30 – 16:30`, sempre no horario local da operacao. */
export function formatBookingTimeRange(booking: Pick<Booking, 'startsAt' | 'endsAt'>): string {
  const { timezone } = serverEnv.booking;
  const start = minutesToLabel(utcToMinutes(booking.startsAt, timezone));
  const end = minutesToLabel(utcToMinutes(booking.endsAt, timezone));
  return `${start} – ${end}`;
}

/** Apenas o horario de inicio (`14:30`). */
export function formatBookingStartTime(booking: Pick<Booking, 'startsAt'>): string {
  return minutesToLabel(utcToMinutes(booking.startsAt, serverEnv.booking.timezone));
}
