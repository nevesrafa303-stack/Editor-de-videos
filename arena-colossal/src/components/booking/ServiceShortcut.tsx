'use client';

import type { ReactNode } from 'react';

import { track } from '@/lib/analytics';

/** Evento que liga os atalhos da página ao formulário de agendamento. */
export const EVENTO_SELECIONAR_SERVICO = 'arena:selecionar-servico';

type ServiceShortcutProps = {
  slug: string;
  children: ReactNode;
  /** De onde partiu o atalho — entra no funil do analytics. */
  source: string;
  className?: string;
};

/**
 * Atalho que leva ao agendamento COM o serviço já escolhido.
 *
 * A seção "Quando procurar a Arena" promete que o serviço indicado já vai
 * marcado. Um link para `#agendamento` apenas rolaria a página e deixaria o
 * visitante escolher de novo — promessa quebrada logo no primeiro clique.
 *
 * A comunicação é por `CustomEvent` em vez de navegação: nada recarrega, o
 * rascunho preenchido até aqui não se perde e a âncora continua funcionando
 * normalmente para a rolagem.
 */
export function ServiceShortcut({ slug, children, source, className }: ServiceShortcutProps) {
  return (
    <a
      href="#agendamento"
      className={className}
      onClick={() => {
        window.dispatchEvent(new CustomEvent(EVENTO_SELECIONAR_SERVICO, { detail: slug }));
        track('select_service', { service: slug, source });
      }}
    >
      {children}
    </a>
  );
}
