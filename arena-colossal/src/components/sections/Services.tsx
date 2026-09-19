'use client';

import { useEffect, useRef } from 'react';

import { MediaFrame } from '@/components/ui/MediaFrame';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { track } from '@/lib/analytics';
import { services } from '@/lib/config/services';
import { useGsapContext } from '@/lib/hooks/useGsapContext';
import { useIsDesktopPointer } from '@/lib/hooks/useMediaQuery';
import { formatDuration } from '@/lib/utils/format';

import styles from './Services.module.css';

/**
 * Servicos.
 *
 * Duas leituras da mesma lista, nao duas listas:
 *   - DESKTOP: a secao e' fixada e os dez paineis correm na horizontal conforme
 *     o scroll vertical. E' a direcao de arte que tira a secao do formato
 *     "grade de dez cards iguais".
 *   - MOBILE/TOUCH: carrossel horizontal nativo com scroll-snap. Sem pin, sem
 *     sequestro de scroll — o dedo continua fazendo o que o sistema faz.
 *
 * A marcacao e' uma `<ol>` nos dois casos: a ordem dos servicos tem sentido
 * (e' a sequencia tecnica), e leitor de tela anuncia "item 3 de 10".
 */
export function Services() {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLOListElement>(null);
  const isDesktopPointer = useIsDesktopPointer();

  useGsapContext(
    sectionRef,
    ({ gsap, root }) => {
      const trackEl = trackRef.current;
      const viewport = root.querySelector<HTMLElement>(`.${styles.viewport}`);
      if (!trackEl || !viewport) return;

      // Distancia real a percorrer, recalculada em cada resize pelo ScrollTrigger.
      const distance = () => Math.max(0, trackEl.scrollWidth - viewport.clientWidth);

      gsap.to(trackEl, {
        x: () => -distance(),
        ease: 'none',
        scrollTrigger: {
          trigger: root,
          start: 'top top',
          // O curso vertical acompanha o horizontal: a sensacao fica 1:1.
          end: () => `+=${distance()}`,
          pin: true,
          scrub: 0.8,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });
    },
    { enabled: isDesktopPointer },
  );

  // `view_service` uma unica vez por servico — mostra onde o interesse para.
  useEffect(() => {
    const trackEl = trackRef.current;
    if (!trackEl || typeof IntersectionObserver === 'undefined') return;

    const seen = new Set<string>();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const slug = (entry.target as HTMLElement).dataset.service;
          if (!entry.isIntersecting || !slug || seen.has(slug)) continue;
          seen.add(slug);
          track('view_service', { service: slug });
        }
      },
      { threshold: 0.6 },
    );

    for (const item of trackEl.querySelectorAll('[data-service]')) observer.observe(item);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} id="servicos" className={styles.section} aria-label="Serviços">
      <div className={`container ${styles.head}`}>
        <SectionTitle
          eyebrow="Serviços"
          title={'Precisão em\ncada detalhe.'}
          description="Dez frentes de trabalho que se combinam conforme o estado e o uso do veículo. Nenhuma delas existe isolada — o processo é definido na avaliação."
          className={styles.title}
        />
        <p className={styles.hint} aria-hidden="true">
          <span className={styles.hintLine} />
          Arraste ou role para percorrer
        </p>
      </div>

      <div className={styles.viewport}>
        <ol ref={trackRef} className={styles.track}>
          {services.map((service) => (
            <li key={service.slug} className={styles.panel} data-service={service.slug}>
              <article className={styles.card}>
                <div className={styles.cardMedia}>
                  <MediaFrame
                    src={service.image}
                    alt={`Arena Colossal — ${service.name}`}
                    placeholderLabel={`Foto — ${service.name}`}
                    ratio="4 / 3"
                    sizes="(max-width: 1024px) 82vw, 420px"
                  />
                </div>

                <div className={styles.cardBody}>
                  <div className={styles.cardHead}>
                    <span className={styles.cardIndex}>{service.index}</span>
                    <span className={styles.cardDuration}>
                      {formatDuration(service.durationMinutes)}
                    </span>
                  </div>

                  <h3 className={styles.cardTitle}>{service.name}</h3>
                  <p className={styles.cardSummary}>{service.summary}</p>
                  <p className={styles.cardDescription}>{service.description}</p>
                </div>
              </article>
            </li>
          ))}

          <li className={styles.panel} aria-hidden="true">
            <div className={styles.endCard}>
              <p className={styles.endTitle}>O processo certo depende do seu carro.</p>
              <a href="#agendamento" className={styles.endLink}>
                Agendar avaliação
              </a>
            </div>
          </li>
        </ol>
      </div>
    </section>
  );
}
