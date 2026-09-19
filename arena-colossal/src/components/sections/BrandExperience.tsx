'use client';

import { useRef } from 'react';

import { AnimatedText } from '@/components/ui/AnimatedText';
import { MediaFrame } from '@/components/ui/MediaFrame';
import { Reveal } from '@/components/ui/Reveal';
import { useGsapContext } from '@/lib/hooks/useGsapContext';
import { useIsDesktopPointer } from '@/lib/hooks/useMediaQuery';

import styles from './BrandExperience.module.css';

/**
 * A Arena por dentro.
 *
 * Grade assimetrica de propósito: imagem grande, respiro, imagem pequena. Cada
 * figura tem um `data-speed` diferente e o parallax so desloca `y` — o efeito
 * "caro" vem do descompasso entre as colunas, nao de filtro ou 3D.
 */
const FRAMES = [
  {
    src: '/images/team/ambiente.jpg',
    alt: 'Área de trabalho da Arena Colossal',
    label: 'Foto — ambiente',
    ratio: '4 / 5',
    speed: 0.12,
    size: 'tall',
  },
  {
    src: '/images/process/equipe.jpg',
    alt: 'Equipe da Arena Colossal em trabalho de detalhamento',
    label: 'Foto — equipe em trabalho',
    ratio: '4 / 3',
    speed: -0.08,
    size: 'wide',
  },
  {
    src: '/images/process/produtos.jpg',
    alt: 'Produtos e equipamentos utilizados no processo',
    label: 'Foto — produtos e equipamentos',
    ratio: '1 / 1',
    speed: 0.16,
    size: 'small',
  },
  {
    src: '/images/process/detalhe.jpg',
    alt: 'Detalhe de acabamento durante o processo',
    label: 'Foto — detalhe do processo',
    ratio: '3 / 4',
    speed: -0.14,
    size: 'small',
  },
] as const;

export function BrandExperience() {
  const sectionRef = useRef<HTMLElement>(null);
  const isDesktopPointer = useIsDesktopPointer();

  useGsapContext(
    sectionRef,
    ({ gsap, root }) => {
      gsap.utils.toArray<HTMLElement>('[data-speed]').forEach((figure) => {
        const speed = Number(figure.dataset.speed ?? 0);
        if (speed === 0) return;

        gsap.fromTo(
          figure,
          { yPercent: -speed * 100 },
          {
            yPercent: speed * 100,
            ease: 'none',
            scrollTrigger: { trigger: root, start: 'top bottom', end: 'bottom top', scrub: 0.7 },
          },
        );
      });
    },
    { enabled: isDesktopPointer },
  );

  return (
    <section ref={sectionRef} className={`section ${styles.section}`} aria-label="A Arena por dentro">
      <div className={`container ${styles.inner}`}>
        <div className={styles.statement}>
          <Reveal variant="fade">
            <p className="eyebrow">A Arena</p>
          </Reveal>
          <AnimatedText
            as="h2"
            className={styles.title}
            text={'Um lugar construído\npara olhar de perto.'}
          />
          <Reveal variant="up" delay={100}>
            <p className={styles.text}>
              Iluminação técnica, bancada organizada e produto certo para cada superfície. Nada
              aqui é improviso — e é isso que aparece no resultado.
            </p>
          </Reveal>
        </div>

        <div className={styles.gallery}>
          {FRAMES.map((frame) => (
            <figure
              key={frame.src}
              className={styles.figure}
              data-size={frame.size}
              data-speed={frame.speed}
            >
              <MediaFrame
                src={frame.src}
                alt={frame.alt}
                placeholderLabel={frame.label}
                ratio={frame.ratio}
                sizes="(max-width: 768px) 100vw, 40vw"
              />
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
