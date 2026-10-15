'use client';

import { useRef } from 'react';

import { Button } from '@/components/ui/Button';
import { MediaFrame } from '@/components/ui/MediaFrame';
import { useGsapContext } from '@/lib/hooks/useGsapContext';
import { useIsDesktopPointer } from '@/lib/hooks/useMediaQuery';
import { track } from '@/lib/analytics';
import { site } from '@/lib/config/site';

import styles from './Hero.module.css';

/**
 * Abertura cinematografica.
 *
 * O CTA principal esta no primeiro quadro, sem esperar animacao: a headline e o
 * botao sao renderizados no servidor e so ganham movimento depois. Nenhuma
 * conversao depende de JavaScript ter carregado.
 *
 * O parallax e' um `translateY` do fundo amarrado ao scroll — so no desktop,
 * so com movimento permitido, e limitado a `transform` para nao gerar reflow.
 */
export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const isDesktopPointer = useIsDesktopPointer();

  useGsapContext(
    sectionRef,
    ({ gsap, root }) => {
      const media = root.querySelector(`.${styles.media}`);
      const content = root.querySelector(`.${styles.content}`);
      if (!media || !content) return;

      gsap
        .timeline({
          scrollTrigger: {
            trigger: root,
            start: 'top top',
            end: 'bottom top',
            scrub: 0.6,
          },
        })
        .to(media, { yPercent: 14, scale: 1.06, ease: 'none' }, 0)
        .to(content, { yPercent: -8, opacity: 0.25, ease: 'none' }, 0);
    },
    { enabled: isDesktopPointer },
  );

  return (
    <section ref={sectionRef} id="top" className={styles.hero} aria-labelledby="hero-title">
      <div className={styles.mediaWrapper} aria-hidden="true">
        <div className={styles.media}>
          <MediaFrame
            src="/images/hero/hero.jpg"
            alt=""
            placeholderLabel="Foto de abertura — detalhe do veículo"
            ratio="auto"
            priority
            sizes="100vw"
            className={styles.mediaFrame}
          />
        </div>
        <div className={styles.scrim} />
      </div>

      <div className={`container ${styles.content}`}>
        <p className={styles.eyebrow}>
          <span>{site.location.city}</span>
          <span aria-hidden="true">—</span>
          <span>{site.location.state}</span>
        </p>

        <h1 id="hero-title" className={styles.title}>
          <span className={styles.titleLine}>
            <span>Seu carro.</span>
          </span>
          <span className={styles.titleLine}>
            {' '}
            <span data-accent="true">Outro nível.</span>
          </span>
        </h1>

        <p className={styles.lead}>
          Estética automotiva para quem entende que cuidado, precisão e presença fazem diferença.
        </p>

        <div className={styles.actions}>
          <Button
            href="#agendamento"
            size="lg"
            onClick={() => track('start_booking', { source: 'hero' })}
          >
            Agendar serviço
          </Button>
          <Button href="#experiencia" variant="outline" size="lg">
            Explorar a Arena
          </Button>
        </div>
      </div>

      <a className={styles.scrollCue} href="#experiencia">
        <span className={styles.scrollLabel}>Role</span>
        <span className={styles.scrollLine} aria-hidden="true" />
      </a>
    </section>
  );
}
