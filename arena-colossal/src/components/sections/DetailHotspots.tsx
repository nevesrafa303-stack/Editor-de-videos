'use client';

import { useId, useState } from 'react';

import { MediaFrame } from '@/components/ui/MediaFrame';
import { Reveal } from '@/components/ui/Reveal';
import { SectionTitle } from '@/components/ui/SectionTitle';

import styles from './DetailHotspots.module.css';

/**
 * Pontos de inspecao sobre a foto do veiculo.
 *
 * `x`/`y` sao percentuais da moldura — a marcacao acompanha a imagem em
 * qualquer largura, sem media query por ponto.
 */
const HOTSPOTS = [
  {
    id: 'pintura',
    label: 'Pintura',
    x: 30,
    y: 38,
    text: 'Leitura da espessura do verniz antes de qualquer correção. É o que define até onde dá para polir com segurança.',
  },
  {
    id: 'farois',
    label: 'Faróis',
    x: 13,
    y: 55,
    text: 'Lente tratada por etapas de refino e protegida no fim — restaurar sem proteger só adia o amarelamento.',
  },
  {
    id: 'rodas',
    label: 'Rodas',
    x: 22,
    y: 78,
    text: 'Limpeza de face interna, aro e cava. É a região que mais denuncia trabalho apressado.',
  },
  {
    id: 'couro',
    label: 'Couro',
    x: 60,
    y: 46,
    text: 'pH controlado, remoção de oleosidade e hidratação específica para o acabamento de cada banco.',
  },
  {
    id: 'painel',
    label: 'Painel',
    x: 72,
    y: 34,
    text: 'Plásticos e telas tratados sem produto oleoso: acabamento fosco, do jeito que saiu de fábrica.',
  },
  {
    id: 'acabamentos',
    label: 'Acabamentos',
    x: 85,
    y: 62,
    text: 'Frisos, borrachas e detalhes cromados — os pontos onde o olho encosta depois que tudo já está limpo.',
  },
] as const;

export function DetailHotspots() {
  const [activeId, setActiveId] = useState<string>(HOTSPOTS[0].id);
  const panelId = useId();

  const active = HOTSPOTS.find((hotspot) => hotspot.id === activeId) ?? HOTSPOTS[0];

  return (
    <section className={`section ${styles.section}`} aria-label="Detalhes do trabalho">
      <div className={`container ${styles.inner}`}>
        <SectionTitle
          eyebrow="Inspeção"
          title={'Olhe mais\nde perto.'}
          description="Cada ponto do veículo pede um critério diferente. Toque nos marcadores para ver o que observamos antes de encostar a máquina."
        />

        <Reveal variant="mask" className={styles.stage}>
          <div className={styles.imageWrapper}>
            <MediaFrame
              src="/images/services/detalhes.jpg"
              alt="Veículo em detalhamento na Arena Colossal, com pontos de inspeção destacados"
              placeholderLabel="Foto — veículo para mapa de detalhes"
              ratio="16 / 10"
              sizes="(max-width: 1024px) 100vw, 60vw"
            />

            {/* `group` + botoes: navegavel por teclado, anunciavel por leitor de tela. */}
            <div className={styles.hotspots} role="group" aria-label="Pontos de inspeção">
              {HOTSPOTS.map((hotspot) => (
                <button
                  key={hotspot.id}
                  type="button"
                  className={styles.hotspot}
                  style={{ left: `${hotspot.x}%`, top: `${hotspot.y}%` }}
                  data-active={hotspot.id === activeId}
                  aria-pressed={hotspot.id === activeId}
                  aria-controls={panelId}
                  onClick={() => setActiveId(hotspot.id)}
                  onMouseEnter={() => setActiveId(hotspot.id)}
                  onFocus={() => setActiveId(hotspot.id)}
                >
                  <span className={styles.hotspotDot} aria-hidden="true" />
                  <span className={styles.hotspotPulse} aria-hidden="true" />
                  <span className="visually-hidden">{hotspot.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* `aria-live` para que a troca de ponto seja percebida sem visao. */}
          <div id={panelId} className={styles.panel} aria-live="polite">
            <p className={styles.panelLabel}>{active.label}</p>
            <p className={styles.panelText}>{active.text}</p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
