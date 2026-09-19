import 'server-only';

import { features, serverEnv } from '@/lib/config/env';

/**
 * Verificacao do Cloudflare Turnstile.
 *
 * Sem `TURNSTILE_SECRET_KEY` a verificacao e' pulada — o site continua
 * funcionando com rate limiting + honeypot como defesa. Assim que a chave e'
 * configurada, o token passa a ser obrigatorio: nao existe estado intermediario
 * em que um token invalido seja aceito.
 */
export async function verifyTurnstile(
  token: string | null,
  remoteIp: string,
): Promise<{ ok: boolean; detail?: string }> {
  if (!features.turnstile) return { ok: true };

  if (token === null || token.length === 0) {
    return { ok: false, detail: 'Token de verificação ausente.' };
  }

  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        secret: serverEnv.turnstile.secretKey ?? '',
        response: token,
        ...(remoteIp !== 'unknown' ? { remoteip: remoteIp } : {}),
      }),
      cache: 'no-store',
    });

    const data = (await response.json()) as { success?: boolean; 'error-codes'?: string[] };

    if (data.success === true) return { ok: true };
    return { ok: false, detail: data['error-codes']?.join(', ') ?? 'Verificação recusada.' };
  } catch (error) {
    // Cloudflare fora do ar nao pode travar o agendamento da Arena.
    console.error('[turnstile] verificação indisponível', error);
    return { ok: true, detail: 'Verificação indisponível — liberado com rate limiting.' };
  }
}
