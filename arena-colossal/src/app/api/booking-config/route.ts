import { getClientIp, rateLimit } from '@/lib/http/rate-limit';
import { errorResponse, okResponse } from '@/lib/http/responses';
import { getPublicBookingConfig } from '@/services/booking/schedule';

/**
 * A janela de agendamento comeca "hoje": ela muda todo dia. Por isso esta rota
 * e' dinamica, mesmo a home sendo estatica.
 */
export const dynamic = 'force-dynamic';

/**
 * GET /api/booking-config
 *
 * Janela de datas, dias de atendimento e bloqueios — o que o seletor de data
 * precisa saber antes de consultar qualquer horario.
 *
 * Nao expoe nada sensivel: sao os mesmos horarios que qualquer cliente ve na
 * porta da Arena.
 */
export async function GET(request: Request) {
  const limit = rateLimit(`config:${getClientIp(request.headers)}`, 60, 60_000);
  if (!limit.allowed) {
    return errorResponse('rate_limited', 429, { retryAfterSeconds: limit.retryAfterSeconds });
  }

  return okResponse({ config: getPublicBookingConfig() });
}
