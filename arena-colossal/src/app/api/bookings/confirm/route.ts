import type { NextRequest } from 'next/server';

import { getRepository } from '@/db';
import { getService } from '@/lib/config/services';
import { getClientIp, rateLimit } from '@/lib/http/rate-limit';
import { errorResponse, okResponse } from '@/lib/http/responses';
import { formatBookingStartTime, formatBookingTimeRange } from '@/services/booking/format';

export const dynamic = 'force-dynamic';

/**
 * POST /api/bookings/confirm  — body: `{ "bookingId": "..." }`
 *
 * Consulta o estado de um agendamento e o resultado de cada canal de
 * notificacao. E' o que a tela de confirmacao usa para dizer "avisamos a Arena"
 * com honestidade, e o que a equipe usa para diagnosticar entrega.
 *
 * Deliberadamente SOMENTE LEITURA e sem dado pessoal na resposta: o ID do
 * agendamento circula por e-mail e URL, entao ele nao pode virar chave de
 * acesso a nome, telefone ou e-mail de ninguem.
 */
export async function POST(request: NextRequest) {
  const ip = getClientIp(request.headers);

  const limit = rateLimit(`confirm:${ip}`, 30, 60_000);
  if (!limit.allowed) {
    return errorResponse('rate_limited', 429, { retryAfterSeconds: limit.retryAfterSeconds });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return errorResponse('invalid_request', 400);
  }

  const bookingId =
    typeof payload === 'object' && payload !== null
      ? (payload as { bookingId?: unknown }).bookingId
      : undefined;

  if (typeof bookingId !== 'string' || bookingId.length === 0 || bookingId.length > 64) {
    return errorResponse('invalid_request', 400);
  }

  try {
    const repository = await getRepository();
    const booking = await repository.getBooking(bookingId);

    if (booking === null) {
      return errorResponse('invalid_request', 404);
    }

    const notifications = await repository.listNotifications(booking.id);
    const service = getService(booking.serviceSlug);

    return okResponse({
      booking: {
        id: booking.id,
        status: booking.status,
        serviceName: service?.name ?? booking.serviceSlug,
        date: booking.date,
        time: formatBookingStartTime(booking),
        timeRange: formatBookingTimeRange(booking),
        calendarSynced: booking.googleEventId !== null,
      },
      notifications: notifications.map((notification) => ({
        channel: notification.channel,
        status: notification.status,
      })),
    });
  } catch (error) {
    console.error('[api/bookings/confirm] falha inesperada', error);
    return errorResponse('unexpected', 503);
  }
}
