import 'server-only';

import { getRepository } from '@/db';
import type { BookingWithRelations } from '@/db/types';
import { serverEnv } from '@/lib/config/env';
import { getService } from '@/lib/config/services';
import type { BookingRequest } from '@/lib/validation/booking';
import { calendarService } from '@/services/calendar';
import { emailService } from '@/services/email';
import { whatsappService } from '@/services/whatsapp';

import { formatBookingStartTime, formatBookingTimeRange } from './format';
import { resolveSlot } from './availability';

export type BookingFailure =
  | 'schedule_unconfigured'
  | 'out_of_window'
  | 'invalid_slot'
  | 'slot_taken'
  | 'storage_error';

/** Resumo devolvido ao cliente. So contem o que a tela de confirmacao precisa. */
export type BookingConfirmation = {
  id: string;
  serviceName: string;
  serviceSlug: string;
  date: string;
  time: string;
  timeRange: string;
  vehicle: string;
  customerName: string;
  /** ISO UTC — usado pelo botao "adicionar ao calendário" do cliente. */
  startsAt: string;
  endsAt: string;
};

export type CreateBookingResult =
  | { ok: true; confirmation: BookingConfirmation }
  | { ok: false; reason: BookingFailure };

/**
 * Orquestra o agendamento completo.
 *
 * ORDEM E' DELIBERADA: o agendamento e' PERSISTIDO PRIMEIRO. So depois vem
 * Calendar, WhatsApp e e-mail. Se qualquer integracao cair, o horario do
 * cliente continua reservado e a falha fica registrada em `Notification` para
 * reprocessamento — nunca o contrario.
 *
 * As notificacoes rodam em paralelo e nenhuma delas lanca excecao: elas
 * devolvem status. A resposta ao cliente nao espera nada alem do necessario
 * para ele ver a confirmacao.
 */
export async function createBooking(request: BookingRequest): Promise<CreateBookingResult> {
  const slotResolution = await resolveSlot(request.date, request.time, request.serviceSlug);
  if (!slotResolution.ok) {
    return { ok: false, reason: slotResolution.reason };
  }

  const repository = await getRepository();

  let created;
  try {
    created = await repository.createBooking(
      {
        customer: { name: request.name, phone: request.phone, email: request.email },
        vehicle: {
          brand: request.vehicleBrand,
          model: request.vehicleModel,
          year: request.vehicleYear,
        },
        serviceSlug: request.serviceSlug,
        date: request.date,
        startsAt: slotResolution.slot.startsAt,
        endsAt: slotResolution.slot.endsAt,
        notes: request.notes,
      },
      serverEnv.booking.concurrency,
    );
  } catch (error) {
    console.error('[booking] falha ao persistir agendamento', error);
    return { ok: false, reason: 'storage_error' };
  }

  if (!created.ok) {
    // A corrida foi perdida entre a tela de horarios e o envio.
    return { ok: false, reason: 'slot_taken' };
  }

  const booking = created.booking;
  await dispatchNotifications(booking);

  return { ok: true, confirmation: toConfirmation(booking) };
}

/**
 * Dispara as notificacoes e registra o resultado de cada canal.
 *
 * Tudo aqui e' best-effort: uma excecao nao pode escapar e virar erro na tela
 * de um cliente cujo horario ja esta reservado.
 */
async function dispatchNotifications(booking: BookingWithRelations): Promise<void> {
  const repository = await getRepository();

  const calendarTask = (async () => {
    if (!calendarService.isEnabled) {
      await repository.recordNotification({
        bookingId: booking.id,
        channel: 'calendar',
        status: 'skipped',
        detail: 'Google Calendar não configurado.',
      });
      return;
    }

    try {
      const eventId = await calendarService.createBookingEvent(booking);
      await repository.updateBooking(booking.id, { googleEventId: eventId });
      await repository.recordNotification({
        bookingId: booking.id,
        channel: 'calendar',
        status: 'sent',
        detail: `event_id=${eventId}`,
      });
    } catch (error) {
      console.error('[booking] evento do Google Calendar não criado', error);
      await repository.recordNotification({
        bookingId: booking.id,
        channel: 'calendar',
        status: 'failed',
        detail: error instanceof Error ? error.message : 'Erro desconhecido.',
      });
    }
  })();

  const whatsappTask = (async () => {
    const result = await whatsappService.notifyNewBooking(booking);
    await repository.recordNotification({
      bookingId: booking.id,
      channel: 'whatsapp_internal',
      status: result.status,
      detail: result.detail,
    });
  })();

  const internalEmailTask = (async () => {
    const result = await emailService.sendInternalNotification(booking);
    await repository.recordNotification({
      bookingId: booking.id,
      channel: 'email_internal',
      status: result.status,
      detail: result.detail,
    });
  })();

  const customerEmailTask = (async () => {
    const result = await emailService.sendCustomerConfirmation(booking);
    await repository.recordNotification({
      bookingId: booking.id,
      channel: 'email_customer',
      status: result.status,
      detail: result.detail,
    });
  })();

  await Promise.allSettled([calendarTask, whatsappTask, internalEmailTask, customerEmailTask]);

  // O horario esta reservado independentemente do resultado das notificacoes.
  await repository.updateBooking(booking.id, { status: 'confirmed' });
}

function toConfirmation(booking: BookingWithRelations): BookingConfirmation {
  const service = getService(booking.serviceSlug);

  return {
    id: booking.id,
    serviceName: service?.name ?? booking.serviceSlug,
    serviceSlug: booking.serviceSlug,
    date: booking.date,
    time: formatBookingStartTime(booking),
    timeRange: formatBookingTimeRange(booking),
    vehicle: [booking.vehicle.brand, booking.vehicle.model, booking.vehicle.year]
      .filter((part) => part !== null && part !== '')
      .join(' '),
    customerName: booking.customer.name,
    startsAt: booking.startsAt.toISOString(),
    endsAt: booking.endsAt.toISOString(),
  };
}
