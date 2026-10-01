import 'server-only';

import { features, serverEnv } from '@/lib/config/env';
import type { BookingWithRelations } from '@/db/types';

import { sendTemplateMessage, sendTextMessage, WhatsAppError } from './cloud-api';
import { buildInternalBookingMessage, buildInternalTemplateParams } from './templates';

export { WhatsAppError };

export type NotificationResult =
  | { status: 'sent'; detail: string }
  | { status: 'skipped'; detail: string }
  | { status: 'failed'; detail: string };

export const whatsappService = {
  isEnabled: features.whatsapp,

  /**
   * Avisa a equipe da Arena sobre um novo agendamento.
   *
   * Nunca lanca: o agendamento do cliente ja esta salvo quando esta funcao roda
   * e uma falha de notificacao nao pode virar erro na tela dele. O resultado
   * volta como status para ser gravado em `Notification` e reprocessado depois.
   */
  async notifyNewBooking(booking: BookingWithRelations): Promise<NotificationResult> {
    if (!features.whatsapp) {
      return {
        status: 'skipped',
        detail: 'WhatsApp Cloud API não configurada (WHATSAPP_ACCESS_TOKEN / PHONE_NUMBER_ID / NOTIFY_TO).',
      };
    }

    const to = serverEnv.whatsapp.notifyTo;
    if (to === null) {
      return { status: 'skipped', detail: 'WHATSAPP_NOTIFY_TO não configurado.' };
    }

    try {
      const { templateName, templateLang } = serverEnv.whatsapp;

      const result = templateName
        ? await sendTemplateMessage(
            to,
            templateName,
            templateLang,
            buildInternalTemplateParams(booking),
          )
        : await sendTextMessage(to, buildInternalBookingMessage(booking));

      return { status: 'sent', detail: `message_id=${result.messageId}` };
    } catch (error) {
      const detail = error instanceof Error ? error.message : 'Erro desconhecido.';
      console.error('[whatsapp] falha ao notificar novo agendamento', error);
      return { status: 'failed', detail };
    }
  },
};
