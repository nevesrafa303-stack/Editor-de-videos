'use client';

import Script from 'next/script';
import { useEffect, useId, useRef } from 'react';

import { site } from '@/lib/config/site';

type TurnstileProps = {
  onToken: (token: string | null) => void;
};

type TurnstileApi = {
  render: (
    element: HTMLElement,
    options: {
      sitekey: string;
      theme: string;
      language: string;
      callback: (token: string) => void;
      'expired-callback': () => void;
      'error-callback': () => void;
    },
  ) => string;
  remove: (widgetId: string) => void;
};

/**
 * Widget do Cloudflare Turnstile.
 *
 * Renderiza `null` quando `NEXT_PUBLIC_TURNSTILE_SITE_KEY` nao esta definido —
 * e nesse caso o backend tambem pula a verificacao, entao nao existe estado em
 * que o formulario fique travado esperando um token que nunca vem.
 *
 * A site key e' publica por definicao. A secret key vive so no servidor.
 */
export function Turnstile({ onToken }: TurnstileProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const id = useId();

  useEffect(() => {
    if (site.turnstileSiteKey === null) return;

    let cancelled = false;

    const tryRender = () => {
      if (cancelled || widgetIdRef.current !== null) return;

      const api = (window as unknown as { turnstile?: TurnstileApi }).turnstile;
      const container = containerRef.current;
      if (!api || !container || site.turnstileSiteKey === null) return;

      widgetIdRef.current = api.render(container, {
        sitekey: site.turnstileSiteKey,
        theme: 'dark',
        language: 'pt-BR',
        callback: (token) => onToken(token),
        'expired-callback': () => onToken(null),
        'error-callback': () => onToken(null),
      });
    };

    // O script e' carregado por <Script>; aguardamos ele aparecer no window.
    const interval = window.setInterval(tryRender, 200);
    tryRender();

    return () => {
      cancelled = true;
      window.clearInterval(interval);

      const api = (window as unknown as { turnstile?: TurnstileApi }).turnstile;
      if (api && widgetIdRef.current !== null) api.remove(widgetIdRef.current);
      widgetIdRef.current = null;
    };
  }, [onToken]);

  if (site.turnstileSiteKey === null) return null;

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="lazyOnload"
      />
      <div ref={containerRef} id={id} />
    </>
  );
}
