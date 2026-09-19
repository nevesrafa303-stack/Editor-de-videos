'use client';

import { useId, useState } from 'react';

import { MediaFrame } from '@/components/ui/MediaFrame';
import { Reveal } from '@/components/ui/Reveal';
import { SectionTitle } from '@/components/ui/SectionTitle';

import styles from './BeforeAfter.module.css';

/**
 * Casos de antes/depois.
 *
 * ESTRUTURA PRONTA, CONTEUDO PENDENTE: nenhum resultado, numero ou promessa e'
 * inventado aqui. Cada caso aponta para dois arquivos em
 * `/public/images/before-after/`; enquanto eles nao existirem, a moldura mostra
 * o placeholder com o rotulo do que entra ali.
 *
 * Para publicar um caso real: coloque os arquivos e ajuste `label` para o
 * servico efetivamente executado.
 */
const CASES = [
  {
    id: 'caso-01',
    label: 'Polimento técnico',
    before: '/images/before-after/caso-01-antes.jpg',
    after: '/images/before-after/caso-01-depois.jpg',
  },
  {
    id: 'caso-02',
    label: 'Higienização interna',
    before: '/images/before-after/caso-02-antes.jpg',
    after: '/images/before-after/caso-02-depois.jpg',
  },
  {
    id: 'caso-03',
    label: 'Restauração de faróis',
    before: '/images/before-after/caso-03-antes.jpg',
    after: '/images/before-after/caso-03-depois.jpg',
  },
] as const;

export function BeforeAfter() {
  return (
    <section id="resultados" className={`section ${styles.section}`} aria-label="Antes e depois">
      <div className={`container ${styles.inner}`}>
        <SectionTitle
          eyebrow="Resultados"
          title={'Você vê o resultado.\nNós vemos cada detalhe.'}
          description="Arraste a barra para comparar. Cada caso é um veículo real atendido na Arena — publicado só depois de o cliente autorizar."
        />

        <ul className={styles.grid}>
          {CASES.map((item, index) => (
            <Reveal as="li" key={item.id} variant="up" delay={index * 90} className={styles.gridItem}>
              <ComparisonSlider label={item.label} before={item.before} after={item.after} />
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}

type ComparisonSliderProps = {
  label: string;
  before: string;
  after: string;
};

/**
 * Comparador antes/depois.
 *
 * O controle e' um `<input type="range">` real, transparente, cobrindo toda a
 * area. Isso entrega de graca: arrasto com mouse, arrasto no toque, setas do
 * teclado, Home/End e o papel de slider anunciado por leitor de tela — sem uma
 * linha de codigo de drag manual.
 */
function ComparisonSlider({ label, before, after }: ComparisonSliderProps) {
  const [position, setPosition] = useState(50);
  const labelId = useId();

  return (
    <figure className={styles.card}>
      <div
        className={styles.viewport}
        style={{ '--position': `${position}%` } as React.CSSProperties}
        data-cursor="grab"
      >
        <div className={styles.layer}>
          <MediaFrame
            src={after}
            alt={`Depois — ${label}`}
            placeholderLabel="Foto — depois"
            ratio="4 / 3"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        </div>

        <div className={`${styles.layer} ${styles.beforeLayer}`}>
          <MediaFrame
            src={before}
            alt={`Antes — ${label}`}
            placeholderLabel="Foto — antes"
            ratio="4 / 3"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        </div>

        <span className={styles.tagBefore} aria-hidden="true">
          Antes
        </span>
        <span className={styles.tagAfter} aria-hidden="true">
          Depois
        </span>

        <span className={styles.handle} aria-hidden="true">
          <span className={styles.handleGrip} />
        </span>

        <input
          className={styles.range}
          type="range"
          min={0}
          max={100}
          step={1}
          value={position}
          onChange={(event) => setPosition(Number(event.target.value))}
          aria-labelledby={labelId}
          aria-valuetext={`${position}% do antes visível`}
        />
      </div>

      <figcaption id={labelId} className={styles.caption}>
        {label}
      </figcaption>
    </figure>
  );
}
