import type { NextRequest } from 'next/server';

import { serverEnv } from '@/lib/config/env';
import { getClientIp, rateLimit } from '@/lib/http/rate-limit';
import { errorResponse, okResponse } from '@/lib/http/responses';
import { bookingRequestSchema, fieldErrors } from '@/lib/validation/booking';
import { createBooking } from '@/services/booking';
import { verifyTurnstile } from '@/services/captcha/turnstile';

export const dynamic = 'force-dynamic';

/**
 * POST /api/bookings
 *
 * Cria o agendamento. Camadas de defesa, em ordem:
 *   1. rate limiting por IP;
 *   2. honeypot + Turnstile;
 *   3. validacao/sanitizacao com o MESMO schema do frontend (a validacao do
 *      cliente e' conveniencia, esta e' a que vale);
 *   4. revalidacao do horario contra banco + Google Calendar;
 *   5. insercao atomica com checagem de sobreposicao (anti reserva dupla).
 */
export async function POST(request: NextRequest) {
  const ip = getClientIp(request.headers);

  const limit = rateLimit(`bookings:${ip}`, serverEnv.rateLimit.bookingsPerHour, 3_600_000);
  if (!limit.allowed) {
    return errorResponse('rate_limited', 429, { retryAfterSeconds: limit.retryAfterSeconds });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return errorResponse('invalid_request', 400);
  }

  const parsed = bookingRequestSchema.safeParse(payload);
  if (!parsed.success) {
    return errorResponse('invalid_request', 400, { fields: fieldErrors(parsed.error) });
  }

  const captcha = await verifyTurnstile(parsed.data.turnstileToken ?? null, ip);
  if (!captcha.ok) {
    console.warn('[api/bookings] Turnstile recusou a requisição:', captcha.detail);
    return errorResponse('captcha_failed', 403);
  }

  try {
    const result = await createBooking(parsed.data);

    if (!result.ok) {
      // "Horário ocupado" e' 409; problema de configuracao/infra e' 503.
      const status = result.reason === 'slot_taken' ? 409 : result.reason === 'storage_error' ? 503 : 400;
      return errorResponse(result.reason, status);
    }

    return okResponse({ booking: result.confirmation }, 201);
  } catch (error) {
    console.error('[api/bookings] falha inesperada', error);
    return errorResponse('unexpected', 503);
  }
}
