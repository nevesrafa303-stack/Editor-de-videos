import 'server-only';

import { features, serverEnv } from '@/lib/config/env';
import { getService } from '@/lib/config/services';
import type { BookingWithRelations } from '@/db/types';

import { CalendarError, createCalendarEvent, fetchBusyIntervals } from './google-calendar';

export { CalendarError };

export const calendarService = {
  isEnabled: features.calendar,

  /**
   * Ocupacao vinda do Google Calendar.
   *
   * Falha aqui NAO pode derrubar a tela de horarios: se o Google estiver fora,
   * devolvemos `null` e a disponibilidade e' calculada apenas com o banco —
   * conservador o suficiente para nao mostrar horario fantasma como livre, e a
   * verificacao definitiva acontece de novo na confirmacao.
   */
  async getBusyIntervals(from: Date, to: Date): Promise<{ start: Date; end: Date }[] | null> {
    if (!features.calendar) return [];

    try {
      return await fetchBusyIntervals(from, to);
    } catch (error) {
      console.error('[calendar] freeBusy falhou', error);
      return null;
    }
  },

  /** Cria o evento do agendamento. Lanca `CalendarError` em caso de falha. */
  async createBookingEvent(booking: BookingWithRelations): Promise<string> {
    const service = getService(booking.serviceSlug);
    const serviceName = service?.name ?? booking.serviceSlug;

    const description = [
      `Cliente: ${booking.customer.name}`,
      `WhatsApp: ${formatPhone(booking.customer.phone)}`,
      `E-mail: ${booking.customer.email}`,
      `Veículo: ${[booking.vehicle.brand, booking.vehicle.model, booking.vehicle.year].filter(Boolean).join(' ')}`,
      `Serviço: ${serviceName}`,
      booking.notes ? `Observações: ${booking.notes}` : 'Observações: —',
      '',
      `Agendamento #${booking.id}`,
      'Criado automaticamente pelo site da Arena Colossal.',
    ].join('\n');

    return createCalendarEvent({
      summary: `ARENA COLOSSAL — ${serviceName} — ${booking.customer.name}`,
      description,
      startsAt: booking.startsAt,
      endsAt: booking.endsAt,
      timeZone: serverEnv.booking.timezone,
      requestId: booking.id,
    });
  },
};

function formatPhone(digits: string): string {
  return digits.startsWith('55') ? `+${digits}` : digits;
}
