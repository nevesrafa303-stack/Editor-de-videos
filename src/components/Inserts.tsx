import React from 'react';
import {
  AbsoluteFill,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
  staticFile,
} from 'remotion';
import {Video} from '@remotion/media';
import type {Insert} from '../types';
import {type Theme} from '../theme';
import {displayFontFamily} from '../fonts';

/** Envelope de layout: fullscreen, PiP metade inferior, ou painel lower-half. */
const LayoutFrame: React.FC<{
  layout: Insert['layout'];
  theme: Theme;
  children: React.ReactNode;
}> = ({layout, theme, children}) => {
  if (layout === 'fullscreen') {
    return (
      <AbsoluteFill style={{backgroundColor: theme.fundoInsert}}>{children}</AbsoluteFill>
    );
  }

  // PiP e painel ocupam a metade de baixo; o apresentador continua visivel em cima.
  const claro = theme.fundoInsert !== '#0E0E10';
  return (
    <AbsoluteFill style={{justifyContent: 'flex-end'}}>
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '50%',
          backgroundColor: theme.fundoInsert,
          overflow: 'hidden',
        }}
      >
        {/* Gradiente suave no topo do painel — costura com o video acima. */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 120,
            zIndex: 2,
            background: `linear-gradient(to bottom, ${
              claro ? 'rgba(244,242,237,0)' : 'rgba(14,14,16,0)'
            }, ${theme.fundoInsert})`,
            transform: 'translateY(-100%)',
          }}
        />
        {children}
      </div>
    </AbsoluteFill>
  );
};

/** Itens que acumulam um a um, cada um com pop sincronizado. */
const StackedItems: React.FC<{
  items: Insert['items'];
  from: number;
  theme: Theme;
  variant: 'list' | 'kinetic';
}> = ({items, from, theme, variant}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: variant === 'list' ? 'flex-start' : 'center',
        gap: variant === 'list' ? 26 : 34,
        padding: variant === 'list' ? '0 9%' : '0 8%',
      }}
    >
      {items.map((it, i) => {
        const appear = it.at - from;
        if (frame < appear) return null;
        const s = spring({
          frame: frame - appear,
          fps,
          config: {damping: 200, stiffness: 200, mass: 0.6},
          durationInFrames: 9,
        });
        return (
          <div
            key={i}
            style={{
              opacity: s,
              transform:
                variant === 'list'
                  ? `translateX(${(1 - s) * -28}px)`
                  : `scale(${0.86 + s * 0.14})`,
              fontFamily: displayFontFamily,
              fontWeight: variant === 'list' ? 800 : 900,
              fontSize: variant === 'list' ? 46 : 62,
              lineHeight: 1.2,
              color: theme.corInsertTexto,
              letterSpacing: variant === 'kinetic' ? 1.2 : 0,
              textAlign: variant === 'list' ? 'left' : 'center',
            }}
          >
            {variant === 'list' ? `— ${it.text}` : it.text.toLocaleUpperCase('pt-BR')}
          </div>
        );
      })}
    </div>
  );
};

/** Tier 3: mockup de celular com as palavras "digitadas" na tela. */
const DeviceMockup: React.FC<{insert: Insert; theme: Theme}> = ({insert, theme}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const entra = spring({frame, fps, config: {damping: 200}, durationInFrames: 12});

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <div
        style={{
          width: 520,
          height: 'auto',
          minHeight: 640,
          borderRadius: 44,
          border: `10px solid ${theme.corInsertTexto}`,
          backgroundColor: theme.fundoInsert === '#0E0E10' ? '#17171B' : '#FFFFFF',
          padding: '46px 32px',
          transform: `translateY(${(1 - entra) * 60}px) scale(${0.94 + entra * 0.06})`,
          opacity: entra,
          boxShadow: '0 30px 80px rgba(0,0,0,0.45)',
          display: 'flex',
          flexDirection: 'column',
          gap: 22,
        }}
      >
        {insert.title ? (
          <div
            style={{
              fontFamily: displayFontFamily,
              fontWeight: 800,
              fontSize: 26,
              letterSpacing: 2,
              opacity: 0.55,
              color: theme.corInsertTexto,
            }}
          >
            {insert.title.toLocaleUpperCase('pt-BR')}
          </div>
        ) : null}
        {insert.items.map((it, i) => {
          const appear = it.at - insert.from;
          if (frame < appear) return null;
          // "Digitando": revela caractere a caractere em ~10 frames.
          const chars = Math.ceil(
            interpolate(frame - appear, [0, 10], [0, it.text.length], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            }),
          );
          return (
            <div
              key={i}
              style={{
                fontFamily: displayFontFamily,
                fontWeight: 700,
                fontSize: 38,
                color: theme.corInsertTexto,
                lineHeight: 1.25,
              }}
            >
              {it.text.slice(0, chars)}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const InsertBody: React.FC<{insert: Insert; theme: Theme}> = ({insert, theme}) => {
  switch (insert.kind) {
    case 'broll-file':
      return (
        <Video
          src={staticFile(insert.src as string)}
          volume={0}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      );
    case 'device-mockup':
      return <DeviceMockup insert={insert} theme={theme} />;
    case 'list-panel':
      return (
        <StackedItems items={insert.items} from={insert.from} theme={theme} variant="list" />
      );
    case 'kinetic-type':
    default:
      return (
        <StackedItems items={insert.items} from={insert.from} theme={theme} variant="kinetic" />
      );
  }
};

export const Inserts: React.FC<{inserts: Insert[]; theme: Theme}> = ({inserts, theme}) => (
  <>
    {inserts.map((ins, i) => (
      <Sequence key={i} from={ins.from} durationInFrames={ins.durationInFrames}>
        <LayoutFrame layout={ins.layout} theme={theme}>
          <InsertBody insert={ins} theme={theme} />
        </LayoutFrame>
      </Sequence>
    ))}
  </>
);
