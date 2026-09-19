'use client';

import { useEffect, useRef, useState, type ElementType, type ReactNode } from 'react';

import styles from './Reveal.module.css';

type RevealProps = {
  children: ReactNode;
  /** Tag renderizada. Use a semantica certa do contexto (li, section, figure...). */
  as?: ElementType;
  /** Direcao/forma da entrada. */
  variant?: 'up' | 'fade' | 'mask';
  /** Atraso em ms — use com moderacao, escadinha longa parece lentidao. */
  delay?: number;
  className?: string;
};

/**
 * Entrada de conteudo no scroll, feita com IntersectionObserver + transicao CSS.
 *
 * Por que nao GSAP aqui: reveals simples sao a maior parte do site e rodam
 * inteiramente no compositor (opacity/transform). Manter isso em CSS evita
 * carregar uma lib de animacao para 90% da pagina.
 *
 * A regra de acessibilidade esta em globals.css: com `prefers-reduced-motion`,
 * `[data-reveal]` ja nasce no estado final — o conteudo nunca depende do
 * observer para ficar visivel.
 */
export function Reveal({
  children,
  as: Tag = 'div',
  variant = 'up',
  delay = 0,
  className,
}: RevealProps) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // Sem suporte a observer (ou em ambiente de teste), mostra direto.
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.12 },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      data-reveal={variant}
      data-visible={visible ? 'true' : 'false'}
      style={delay > 0 ? { transitionDelay: `${delay}ms` } : undefined}
      className={[styles.reveal, className].filter(Boolean).join(' ')}
    >
      {children}
    </Tag>
  );
}
