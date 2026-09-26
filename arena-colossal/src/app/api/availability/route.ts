import type { NextRequest } from 'next/server';

import { getClientIp, rateLimit } from '@/lib/http/rate-limit';
import { errorResponse, okResponse } from '@/lib/http/responses';
import { availabilityQuerySchema } from '@/lib/validation/booking';
import { getAvailability } from '@/services/booking/availability';
import { getBookingWindow } from '@/services/booking/schedule';

/** A disponibilidade muda a cada reserva: nada de cache. */
export const dynamic = 'force-dynamic';

/**
 * GET /api/availability?date=YYYY-MM-DD&service=<slug>
 *
 * Devolve a grade do dia com cada horario marcado como livre ou ocupado.
 * Esta e' a unica forma de o navegador saber o que esta disponivel — e ainda
 * assim o horario e' revalidado no POST, porque a grade envelhece em segundos.
 */
export async function GET(request: NextRequest) {
  const ip = getClientIp(request.headers);

  // Limite generoso: navegar pelo calendario dispara varias consultas legitimas.
  const limit = rateLimit(`availability:${ip}`, 120, 60_000);
  if (!limit.allowed) {
    return errorResponse('rate_limited', 429, { retryAfterSeconds: limit.retryAfterSeconds });
  }

  const parsed = availabilityQuerySchema.safeParse({
    date: request.nextUrl.searchParams.get('date') ?? '',
    service: request.nextUrl.searchParams.get('service') ?? '',
  });

  if (!parsed.success) {
    return errorResponse('invalid_request', 400);
  }

  try {
    const availability = await getAvailability(parsed.data.date, parsed.data.service);
    return okResponse({ ...availability, window: getBookingWindow() });
  } catch (error) {
    console.error('[api/availability] falha inesperada', error);
    return errorResponse('unexpected', 503);
  }
}
