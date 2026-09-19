import { getRepository } from '@/db';
import { features } from '@/lib/config/env';
import { okResponse } from '@/lib/http/responses';

export const dynamic = 'force-dynamic';

/**
 * GET /api/health
 *
 * Diagnostico de configuracao: diz o que esta ligado e o que ainda falta
 * conectar. Feito para o deploy — abrir esta rota depois de publicar responde
 * "o agendamento vai funcionar de verdade?" sem precisar testar no escuro.
 *
 * Nao expoe valor de credencial nenhuma: apenas booleanos.
 */
export async function GET() {
  const repository = await getRepository();

  const blocking: string[] = [];
  if (!features.database) {
    blocking.push('DATABASE_URL ausente — agendamentos ficam em memória e somem no restart.');
  }
  if (!features.businessHours) {
    blocking.push('BOOKING_HOURS ausente — a grade de horários fica vazia.');
  }

  const degraded: string[] = [];
  if (!features.calendar) degraded.push('Google Calendar desligado — eventos não são criados.');
  if (!features.email) degraded.push('Resend desligado — nenhum e-mail é enviado.');
  if (!features.whatsapp) degraded.push('WhatsApp Cloud API desligada — a equipe não recebe aviso.');
  if (!features.turnstile) degraded.push('Turnstile desligado — apenas rate limiting e honeypot.');

  return okResponse({
    status: blocking.length === 0 ? 'ready' : 'incomplete',
    storageDriver: repository.driver,
    features,
    blocking,
    degraded,
  });
}
