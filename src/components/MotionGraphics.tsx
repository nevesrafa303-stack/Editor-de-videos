import React from 'react';
import {
  AbsoluteFill,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
} from 'remotion';
import type {Motion} from '../types';
import {type Theme} from '../theme';
import {displayFontFamily} from '../fonts';

/**
 * 4.7 Motion graphics — OBRIGATORIO, 3-5s, no MEIO do video (nunca gancho nem CTA).
 * Narracao continua por baixo; elementos sincronizados com as palavras faladas.
 */

const useAppear = (at: number, from: number, dur = 9) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const appear = at - from;
  if (frame < appear) return null;
  return spring({
    frame: frame - appear,
    fps,
    config: {damping: 200, stiffness: 200, mass: 0.6},
    durationInFrames: dur,
  });
};

/** Tipografia cinetica: palavras empilhando ("PENSE. CRIE. FACA."). */
const Kinetic: React.FC<{m: Motion; theme: Theme}> = ({m, theme}) => (
  <div style={{display: 'flex', flexDirection: 'column', gap: 30, alignItems: 'center'}}>
    {m.items.map((it, i) => (
      <KineticWord key={i} text={it.text} at={it.at} from={m.from} accent={!!it.accent} theme={theme} />
    ))}
  </div>
);

const KineticWord: React.FC<{
  text: string;
  at: number;
  from: number;
  accent: boolean;
  theme: Theme;
}> = ({text, at, from, accent, theme}) => {
  const s = useAppear(at, from);
  if (s === null) return null;
  return (
    <div
      style={{
        opacity: s,
        transform: `translateY(${(1 - s) * 26}px) scale(${0.9 + s * 0.1})`,
        fontFamily: displayFontFamily,
        fontWeight: 900,
        fontSize: 96,
        letterSpacing: 2,
        color: accent ? theme.corDestaque : theme.corInsertTexto,
      }}
    >
      {text.toLocaleUpperCase('pt-BR')}
    </div>
  );
};

/** Pictogramas: stick figures geometricos + palavras acumulando ao redor. */
const Pictograms: React.FC<{m: Motion; theme: Theme}> = ({m, theme}) => {
  const frame = useCurrentFrame();
  const c = theme.corInsertTexto;
  const passo = interpolate(frame, [0, 20], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div style={{position: 'absolute', inset: 0}}>
      <svg
        viewBox="0 0 200 200"
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: 460,
          height: 460,
          transform: 'translate(-50%, -50%)',
        }}
      >
        {/* stick figure: cabeca, tronco, bracos, pernas */}
        <circle cx="100" cy="52" r="22" fill="none" stroke={c} strokeWidth="7" />
        <line x1="100" y1="74" x2="100" y2="130" stroke={c} strokeWidth="7" strokeLinecap="round" />
        <line
          x1="100" y1="92"
          x2={100 - 34 * passo} y2={104 - 16 * passo}
          stroke={c} strokeWidth="7" strokeLinecap="round"
        />
        <line
          x1="100" y1="92"
          x2={100 + 34 * passo} y2={104 - 16 * passo}
          stroke={c} strokeWidth="7" strokeLinecap="round"
        />
        <line x1="100" y1="130" x2="74" y2="176" stroke={c} strokeWidth="7" strokeLinecap="round" />
        <line x1="100" y1="130" x2="126" y2="176" stroke={c} strokeWidth="7" strokeLinecap="round" />
      </svg>

      {m.items.map((it, i) => (
        <PictoWord key={i} item={it} index={i} total={m.items.length} from={m.from} theme={theme} />
      ))}
    </div>
  );
};

const PictoWord: React.FC<{
  item: Motion['items'][number];
  index: number;
  total: number;
  from: number;
  theme: Theme;
}> = ({item, index, total, from, theme}) => {
  const s = useAppear(item.at, from);
  if (s === null) return null;
  // Distribui as palavras em circulo ao redor do pictograma.
  const ang = (index / Math.max(total, 1)) * Math.PI * 2 - Math.PI / 2;
  const raio = 400;
  return (
    <div
      style={{
        position: 'absolute',
        left: `calc(50% + ${Math.cos(ang) * raio}px)`,
        top: `calc(50% + ${Math.sin(ang) * raio * 0.9}px)`,
        transform: `translate(-50%, -50%) scale(${0.85 + s * 0.15})`,
        opacity: s,
        fontFamily: displayFontFamily,
        fontWeight: 800,
        fontSize: 44,
        letterSpacing: 1,
        whiteSpace: 'nowrap',
        color: item.accent ? theme.corDestaque : theme.corInsertTexto,
      }}
    >
      {item.text.toLocaleUpperCase('pt-BR')}
    </div>
  );
};

/** Contador animado para estatistica. */
const Counter: React.FC<{m: Motion; theme: Theme}> = ({m, theme}) => {
  const frame = useCurrentFrame();
  const valor = Math.round(
    interpolate(frame, [4, Math.max(m.durationInFrames - 20, 24)], [0, m.counterTo ?? 0], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }),
  );
  return (
    <div style={{textAlign: 'center'}}>
      <div
        style={{
          fontFamily: displayFontFamily,
          fontWeight: 900,
          fontSize: 220,
          lineHeight: 1,
          color: theme.corDestaque === '#FFFFFF' ? theme.corInsertTexto : theme.corDestaque,
        }}
      >
        {valor}
        {m.counterSuffix ?? ''}
      </div>
      {m.headline ? (
        <div
          style={{
            marginTop: 26,
            fontFamily: displayFontFamily,
            fontWeight: 700,
            fontSize: 46,
            letterSpacing: 1,
            color: theme.corInsertTexto,
            padding: '0 10%',
          }}
        >
          {m.headline.toLocaleUpperCase('pt-BR')}
        </div>
      ) : null}
    </div>
  );
};

/** Contraste em duas colunas (certo vs errado). */
const TwoColumns: React.FC<{m: Motion; theme: Theme}> = ({m, theme}) => {
  const [esq, dir] = m.labels ?? ['', ''];
  const meio = Math.ceil(m.items.length / 2);
  const cols: [string, Motion['items']][] = [
    [esq, m.items.slice(0, meio)],
    [dir, m.items.slice(meio)],
  ];
  return (
    <div style={{display: 'flex', width: '100%', height: '100%'}}>
      {cols.map(([label, items], ci) => (
        <div
          key={ci}
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: 24,
            padding: '0 6%',
            borderLeft: ci === 1 ? `3px solid ${theme.corInsertTexto}33` : undefined,
          }}
        >
          <div
            style={{
              fontFamily: displayFontFamily,
              fontWeight: 900,
              fontSize: 48,
              marginBottom: 12,
              color: ci === 1 ? theme.corDestaque : theme.corInsertTexto,
            }}
          >
            {label.toLocaleUpperCase('pt-BR')}
          </div>
          {items.map((it, i) => (
            <ColItem key={i} item={it} from={m.from} theme={theme} />
          ))}
        </div>
      ))}
    </div>
  );
};

const ColItem: React.FC<{item: Motion['items'][number]; from: number; theme: Theme}> = ({
  item,
  from,
  theme,
}) => {
  const s = useAppear(item.at, from);
  if (s === null) return null;
  return (
    <div
      style={{
        opacity: s,
        transform: `translateY(${(1 - s) * 18}px)`,
        fontFamily: displayFontFamily,
        fontWeight: 700,
        fontSize: 38,
        lineHeight: 1.24,
        color: theme.corInsertTexto,
      }}
    >
      {item.text}
    </div>
  );
};

/** Checklist com carimbo final (ex.: itens + "NAO E ASSEDIO"). */
const ChecklistStamp: React.FC<{m: Motion; theme: Theme}> = ({m, theme}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const carimboAt = Math.max(m.durationInFrames - 26, 10);
  const cs =
    frame >= carimboAt
      ? spring({
          frame: frame - carimboAt,
          fps,
          config: {damping: 12, stiffness: 260, mass: 0.8},
          durationInFrames: 14,
        })
      : 0;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 26,
        padding: '0 10%',
        width: '100%',
      }}
    >
      {m.items.map((it, i) => (
        <ColItem key={i} item={it} from={m.from} theme={theme} />
      ))}
      {m.stamp && cs > 0 ? (
        <div
          style={{
            marginTop: 44,
            alignSelf: 'center',
            transform: `rotate(-9deg) scale(${1.5 - cs * 0.5})`,
            opacity: Math.min(cs * 1.6, 1),
            border: `8px solid ${theme.corDestaque === '#FFFFFF' ? '#E53935' : theme.corDestaque}`,
            color: theme.corDestaque === '#FFFFFF' ? '#E53935' : theme.corDestaque,
            padding: '18px 40px',
            borderRadius: 12,
            fontFamily: displayFontFamily,
            fontWeight: 900,
            fontSize: 62,
            letterSpacing: 2,
          }}
        >
          {m.stamp.toLocaleUpperCase('pt-BR')}
        </div>
      ) : null}
    </div>
  );
};

const Body: React.FC<{m: Motion; theme: Theme}> = ({m, theme}) => {
  switch (m.kind) {
    case 'pictograms':
      return <Pictograms m={m} theme={theme} />;
    case 'counter':
      return <Counter m={m} theme={theme} />;
    case 'two-columns':
      return <TwoColumns m={m} theme={theme} />;
    case 'checklist-stamp':
      return <ChecklistStamp m={m} theme={theme} />;
    case 'kinetic':
    default:
      return <Kinetic m={m} theme={theme} />;
  }
};

export const MotionGraphics: React.FC<{motions: Motion[]; theme: Theme}> = ({
  motions,
  theme,
}) => (
  <>
    {motions.map((m, i) => (
      <Sequence key={i} from={m.from} durationInFrames={m.durationInFrames}>
        <AbsoluteFill
          style={{
            backgroundColor: theme.fundoInsert,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Body m={m} theme={theme} />
        </AbsoluteFill>
      </Sequence>
    ))}
  </>
);
