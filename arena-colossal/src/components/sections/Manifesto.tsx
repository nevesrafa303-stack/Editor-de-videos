'use client';

import { useRef } from 'react';

import { AnimatedText } from '@/components/ui/AnimatedText';
import { Reveal } from '@/components/ui/Reveal';
import { useGsapContext } from '@/lib/hooks/useGsapContext';
import { useIsDesktopPointer } from '@/lib/hooks/useMediaQuery';

import styles from './Manifesto.module.css';

/**
 * Manifesto — a secao que muda o enquadramento antes de falar de servico.
 *
 * Composicao editorial de proposito: as quatro afirmacoes ficam em uma grade
 * de duas colunas com numeracao, nunca empilhadas uma palavra por linha. No
 * desktop, a coluna esquerda fica sticky enquanto a direita rola — o contraste
 * de ritmo e' o que da peso ao texto.
 */
const CLAIMS = [
  { index: '01', text: 'É presença.' },
  { index: '02', text: 'É conquista.' },
  { index: '03', text: 'É cuidado.' },
  { index: '04', text: 'É parte da sua história.' },
];

export function Manifesto() {
  const sectionRef = useRef<HTMLElement>(null);
  const isDesktopPointer = useIsDesktopPointer();

  useGsapContext(
    sectionRef,
    ({ gsap, root }) => {
      const rule = root.querySelector(`.${styles.rule}`);
      if (!rule) return;

      gsap.fromTo(
        rule,
        { scaleX: 0 },
        {
          scaleX: 1,
          ease: 'none',
          scrollTrigger: { trigger: root, start: 'top 75%', end: 'bottom 60%', scrub: 0.5 },
        },
      );
    },
    { enabled: isDesktopPointer },
  );

  return (
    <section ref={sectionRef} id="experiencia" className={`section ${styles.section}`}>
      <div className={`container ${styles.inner}`}>
        <div className={styles.headline}>
          <Reveal variant="fade">
            <p className="eyebrow">Não é apenas lavagem</p>
          </Reveal>

          <AnimatedText
            as="h2"
            className={styles.title}
            text={'Seu carro não é\napenas um carro.'}
          />
        </div>

        <div className={styles.claims}>
          <ul className={styles.claimList}>
            {CLAIMS.map((claim, index) => (
              <Reveal as="li" key={claim.index} className={styles.claim} delay={index * 90}>
                <span className={styles.claimIndex}>{claim.index}</span>
                <span className={styles.claimText}>{claim.text}</span>
              </Reveal>
            ))}
          </ul>

          <span className={styles.rule} aria-hidden="true" />

          <Reveal variant="up" delay={120}>
            <p className={styles.closing}>
              Por isso, aqui, <em>cada detalhe importa</em>.
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
