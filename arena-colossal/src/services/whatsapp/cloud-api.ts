import 'server-only';

import { serverEnv } from '@/lib/config/env';

/**
 * Transporte da WhatsApp Cloud API (Meta).
 *
 * Decisao explicita: NADA de automacao de WhatsApp Web. Numero e' ativo da
 * Arena — automacao nao oficial derruba conta. Aqui so entra a API oficial, e a
 * troca por outro provedor homologado (Twilio, 360dialog, Zenvia) significa
 * escrever outro arquivo neste diretorio, sem tocar no resto do sistema.
 */

const GRAPH_VERSION = 'v21.0';

export class WhatsAppError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WhatsAppError';
  }
}

type SendResult = { messageId: string };

async function post(body: Record<string, unknown>): Promise<SendResult> {
  const { accessToken, phoneNumberId } = serverEnv.whatsapp;

  if (accessToken === null || phoneNumberId === null) {
    throw new WhatsAppError('Credenciais da WhatsApp Cloud API ausentes.');
  }

  const response = await fetch(
    `https://graph.facebook.com/${GRAPH_VERSION}/${phoneNumberId}/messages`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    },
  );

  const data = (await response.json().catch(() => ({}))) as {
    messages?: { id: string }[];
    error?: { message?: string; code?: number };
  };

  if (!response.ok) {
    throw new WhatsAppError(
      data.error?.message ?? `WhatsApp Cloud API respondeu ${response.status}.`,
    );
  }

  return { messageId: data.messages?.[0]?.id ?? 'unknown' };
}

/**
 * Mensagem de texto livre.
 *
 * So e' entregue dentro da janela de 24h de atendimento da Meta. Para avisos
 * fora dessa janela, use `sendTemplateMessage`.
 */
export function sendTextMessage(to: string, body: string): Promise<SendResult> {
  return post({
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: 'text',
    text: { preview_url: false, body },
  });
}

/** Mensagem baseada em template aprovado — funciona fora da janela de 24h. */
export function sendTemplateMessage(
  to: string,
  templateName: string,
  languageCode: string,
  parameters: string[],
): Promise<SendResult> {
  return post({
    messaging_product: 'whatsapp',
    to,
    type: 'template',
    template: {
      name: templateName,
      language: { code: languageCode },
      components: [
        {
          type: 'body',
          parameters: parameters.map((text) => ({ type: 'text', text })),
        },
      ],
    },
  });
}
