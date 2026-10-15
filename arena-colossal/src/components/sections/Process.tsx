'use client';

import { useRef } from 'react';

import { Reveal } from '@/components/ui/Reveal';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { useGsapContext } from '@/lib/hooks/useGsapContext';
import { usePrefersReducedMotion } from '@/lib/hooks/useMediaQuery';

import styles from './Process.module.css';

const STEPS = [
  {
    index: '01',
    name: 'Avaliação',
    text: 'O veículo é lido antes de ser tocado: estado da pintura, do interior e o uso real do dia a dia. É aqui que o processo é definido — não antes.',
  },
  {
    index: '02',
    name: 'Preparação',
    text: 'Pré-lavagem, descontaminação e secagem controlada. Nenhuma etapa seguinte acontece sobre superfície suja.',
  },
  {
    index: '03',
    name: 'Tratamento',
    text: 'Correção e higienização conforme o que a avaliação apontou. Trabalho por etapas, com conferência entre elas.',
  },
  {
    index: '04',
    name: 'Detalhamento',
    text: 'As áreas que ninguém fotografa: frisos, soleiras, cavas, grades e acabamentos internos.',
  },
  {
    index: '05',
    name: 'Proteção',
    text: 'Aplicação da proteção adequada ao resultado obtido, com o tempo de cura respeitado.',
  },
  {
    index: '06',
    name: 'Entrega',
    text: 'Conferência final sob iluminação técnica e explicação do que foi feito — e de como manter.',
  },
] as const;

/**
 * Processo.
 *
 * A linha de progresso e' amarrada ao scroll (GSAP scrub) e as etapas entram
 * uma a uma. Com movimento reduzido a linha ja nasce cheia e as etapas ficam
 * visiveis: a informacao nunca depende da animacao.
 */
export function Process() {
  const sectionRef = useRef<HTMLElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  useGsapContext(sectionRef, ({ gsap, root }) => {
    const progress = root.querySelector(`.${styles.progressFill}`);
    const list = root.querySelector(`.${styles.list}`);
    if (!progress || !list) return;

    gsap.fromTo(
      progress,
      { scaleY: 0 },
      {
        scaleY: 1,
        ease: 'none',
        scrollTrigger: {
          trigger: list,
          start: 'top 65%',
          end: 'bottom 75%',
          scrub: 0.5,
        },
      },
    );

    gsap.utils.toArray<HTMLElement>(`.${styles.step}`).forEach((step) => {
      gsap.fromTo(
        step,
        { opacity: 0.22, x: 12 },
        {
          opacity: 1,
          x: 0,
          duration: 0.6,
          ease: 'power2.out',
          scrollTrigger: { trigger: step, start: 'top 82%', toggleActions: 'play none none reverse' },
        },
      );
    });
  });

  return (
    <section
      ref={sectionRef}
      id="processo"
      className={`section ${styles.section}`}
      aria-label="Processo"
    >
      <div className={`container ${styles.inner}`}>
        <div className={styles.head}>
          <SectionTitle
            eyebrow="Processo"
            title={'Do primeiro detalhe\nao último.'}
            description="Seis etapas na mesma ordem, em todo veículo. O que muda é a profundidade de cada uma — definida na avaliação, não no orçamento."
          />
        </div>

        <ol className={styles.list} data-static={prefersReducedMotion}>
          <span className={styles.progressTrack} aria-hidden="true">
            <span className={styles.progressFill} />
          </span>

          {STEPS.map((step) => (
            <li key={step.index} className={styles.step}>
              <Reveal variant="fade" className={styles.stepInner}>
                <span className={styles.stepIndex}>{step.index}</span>
                <div className={styles.stepContent}>
                  <h3 className={styles.stepName}>{step.name}</h3>
                  <p className={styles.stepText}>{step.text}</p>
                </div>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
