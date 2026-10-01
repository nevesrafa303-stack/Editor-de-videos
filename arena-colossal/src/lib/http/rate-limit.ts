import 'server-only';

/**
 * Rate limiting em memoria, por janela deslizante simples.
 *
 * LIMITACAO CONHECIDA E ACEITA: o contador vive no processo. Em deploy com
 * varias instancias cada uma tem o seu, entao o limite efetivo e'
 * `limite x instancias`. Isso e' suficiente contra script de spam ingenuo, que
 * e' a ameaca real de um formulario de agendamento. Para um limite global,
 * troque o `Map` por Redis/Upstash mantendo esta mesma assinatura.
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

/** Remove buckets vencidos para o Map nao crescer sem limite. */
function sweep(now: number): void {
  if (buckets.size < 500) return;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  /** Segundos ate a janela reabrir — vira o header `Retry-After`. */
  retryAfterSeconds: number;
};

export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  sweep(now);

  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, retryAfterSeconds: 0 };
  }

  bucket.count += 1;
  const allowed = bucket.count <= limit;

  return {
    allowed,
    remaining: Math.max(0, limit - bucket.count),
    retryAfterSeconds: allowed ? 0 : Math.ceil((bucket.resetAt - now) / 1000),
  };
}

/**
 * IP do cliente a partir dos headers de proxy.
 *
 * `x-forwarded-for` e' falsificavel por quem fala direto com a aplicacao, entao
 * isto so e' confiavel atras de um proxy que reescreve o header (Vercel, Nginx,
 * Cloudflare). E' mitigacao de abuso, nao controle de acesso.
 */
export function getClientIp(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }

  return headers.get('x-real-ip') ?? headers.get('cf-connecting-ip') ?? 'unknown';
}
