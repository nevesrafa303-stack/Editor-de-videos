import 'server-only';

import { NextResponse } from 'next/server';

/**
 * Mensagens de erro voltadas ao cliente.
 *
 * Regra: o usuario nunca ve stack trace, nome de servico externo ou codigo HTTP
 * cru. Ele ve o que aconteceu e o que fazer a seguir — com o WhatsApp da Arena
 * como saida garantida. O detalhe tecnico fica no log do servidor.
 */
export const ERROR_MESSAGES = {
  schedule_unconfigured:
    'A agenda online ainda não está disponível. Fale com a Arena pelo WhatsApp que reservamos seu horário.',
  out_of_window: 'Essa data está fora do período de agendamento. Escolha outra data.',
  invalid_slot: 'Esse horário não está mais na agenda. Selecione outro horário disponível.',
  slot_taken: 'Esse horário acabou de ser reservado. Escolha outro horário disponível.',
  storage_error:
    'Não conseguimos confirmar esse horário agora. Tente novamente ou fale diretamente com a Arena pelo WhatsApp.',
  invalid_request: 'Confira os dados informados e tente novamente.',
  rate_limited: 'Recebemos várias tentativas deste dispositivo. Aguarde alguns minutos e tente de novo.',
  captcha_failed: 'Não conseguimos validar que você é uma pessoa. Recarregue a página e tente novamente.',
  unexpected:
    'Não conseguimos confirmar esse horário agora. Tente novamente ou fale diretamente com a Arena pelo WhatsApp.',
} as const;

export type ErrorCode = keyof typeof ERROR_MESSAGES;

export function errorResponse(
  code: ErrorCode,
  status: number,
  extra?: { fields?: Record<string, string>; retryAfterSeconds?: number },
): NextResponse {
  const headers = new Headers();
  if (extra?.retryAfterSeconds) {
    headers.set('Retry-After', String(extra.retryAfterSeconds));
  }

  return NextResponse.json(
    { ok: false, code, message: ERROR_MESSAGES[code], fields: extra?.fields ?? null },
    { status, headers },
  );
}

export function okResponse<T extends object>(data: T, status = 200): NextResponse {
  return NextResponse.json({ ok: true, ...data }, { status });
}
