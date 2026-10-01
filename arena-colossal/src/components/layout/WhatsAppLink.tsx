'use client';

import type { ReactNode } from 'react';

import { track } from '@/lib/analytics';
import { site } from '@/lib/config/site';

type WhatsAppLinkProps = {
  children: ReactNode;
  /** De onde o clique partiu — o funil so e' legivel com esta origem. */
  source: string;
  className?: string;
};

/**
 * Link de WhatsApp com rastreamento.
 *
 * Renderiza `null` quando `NEXT_PUBLIC_WHATSAPP_NUMBER` nao esta configurado:
 * melhor nao existir do que existir e nao levar a lugar nenhum.
 */
export function WhatsAppLink({ children, source, className }: WhatsAppLinkProps) {
  if (site.contact.whatsappLink === null) return null;

  return (
    <a
      href={site.contact.whatsappLink}
      className={className}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => track('click_whatsapp', { source })}
    >
      {children}
    </a>
  );
}
