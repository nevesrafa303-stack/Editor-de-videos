import 'server-only';

import { serverEnv } from '@/lib/config/env';

/**
 * Transporte de e-mail transacional via Resend (HTTP puro).
 *
 * Trocar para SendGrid/Postmark significa substituir este arquivo: a assinatura
 * `sendEmail` e' o unico ponto que o resto do sistema conhece.
 */

export class EmailError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EmailError';
  }
}

export type SendEmailInput = {
  to: string[];
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
};

export async function sendEmail(input: SendEmailInput): Promise<string> {
  const { apiKey, from } = serverEnv.email;

  if (apiKey === null || from === null) {
    throw new EmailError('RESEND_API_KEY ou EMAIL_FROM ausente.');
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
      ...(input.replyTo ? { reply_to: input.replyTo } : {}),
    }),
    cache: 'no-store',
  });

  const data = (await response.json().catch(() => ({}))) as {
    id?: string;
    message?: string;
  };

  if (!response.ok) {
    throw new EmailError(data.message ?? `Resend respondeu ${response.status}.`);
  }

  return data.id ?? 'unknown';
}
