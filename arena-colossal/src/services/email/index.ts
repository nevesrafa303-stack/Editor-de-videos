import 'server-only';

import { features, serverEnv } from '@/lib/config/env';
import type { BookingWithRelations } from '@/db/types';

import { EmailError, sendEmail } from './resend';
import { customerBookingEmail, internalBookingEmail } from './templates';

export { EmailError };

export type EmailResult =
  | { status: 'sent'; detail: string }
  | { status: 'skipped'; detail: string }
  | { status: 'failed'; detail: string };

/**
 * Nenhuma funcao daqui lanca excecao: e-mail e' notificacao, nao pre-requisito
 * do agendamento. Cada resultado vira uma linha em `Notification`.
 */
export const emailService = {
  isEnabled: features.email,

  async sendInternalNotification(booking: BookingWithRelations): Promise<EmailResult> {
    if (!features.email) {
      return { status: 'skipped', detail: 'Resend não configurado (RESEND_API_KEY / EMAIL_FROM).' };
    }

    const to = serverEnv.email.internalTo;
    if (to === null) {
      return { status: 'skipped', detail: 'EMAIL_TO_INTERNAL não configurado.' };
    }

    try {
      const content = internalBookingEmail(booking);
      const id = await sendEmail({
        to: [to],
        ...content,
        // Responder o e-mail interno cai direto na caixa do cliente.
        replyTo: booking.customer.email,
      });
      return { status: 'sent', detail: `resend_id=${id}` };
    } catch (error) {
      console.error('[email] falha na notificação interna', error);
      return {
        status: 'failed',
        detail: error instanceof Error ? error.message : 'Erro desconhecido.',
      };
    }
  },

  async sendCustomerConfirmation(booking: BookingWithRelations): Promise<EmailResult> {
    if (!features.email) {
      return { status: 'skipped', detail: 'Resend não configurado (RESEND_API_KEY / EMAIL_FROM).' };
    }

    try {
      const content = customerBookingEmail(booking);
      const id = await sendEmail({ to: [booking.customer.email], ...content });
      return { status: 'sent', detail: `resend_id=${id}` };
    } catch (error) {
      console.error('[email] falha na confirmação para o cliente', error);
      return {
        status: 'failed',
        detail: error instanceof Error ? error.message : 'Erro desconhecido.',
      };
    }
  },
};
