import React from 'react';
import {AbsoluteFill, Sequence, useCurrentFrame, interpolate} from 'remotion';
import type {CaptionBlock} from '../types';
import {applyCase, captionShadow, type Theme} from '../theme';
import {captionFontFamily} from '../fonts';

/**
 * 4.4 Legendas — discretas, 36-44px, 2-5 palavras, ~55% da altura, fade de 3 frames.
 * Sem karaoke, sem emoji, sem animacao chamativa.
 */
const Block: React.FC<{block: CaptionBlock; theme: Theme}> = ({block, theme}) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 3], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const palavras = block.text.split(/\s+/).filter(Boolean);

  return (
    <AbsoluteFill
      style={{
        justifyContent: 'flex-start',
        alignItems: 'center',
        opacity,
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: `${theme.alturaLegenda * 100}%`,
          transform: 'translateY(-50%)',
          width: '82%',
          textAlign: 'center',
          fontFamily: captionFontFamily(theme),
          fontFeatureSettings: '"kern" 1',
          fontSize: theme.tamanhoLegenda,
          fontWeight: theme.pesoLegenda,
          fontStyle: theme.italicoLegenda ? 'italic' : 'normal',
          lineHeight: 1.28,
          letterSpacing: 0.2,
          color: theme.corTexto,
          textShadow: captionShadow,
        }}
      >
        {palavras.map((p, i) => (
          <span
            key={i}
            style={{
              color:
                block.highlightIndex === i ? theme.corDestaque : theme.corTexto,
              fontWeight:
                block.highlightIndex === i ? 800 : theme.pesoLegenda,
            }}
          >
            {applyCase(p, theme.caixaLegenda)}
            {i < palavras.length - 1 ? ' ' : ''}
          </span>
        ))}
      </div>
    </AbsoluteFill>
  );
};

export const Captions: React.FC<{blocks: CaptionBlock[]; theme: Theme}> = ({
  blocks,
  theme,
}) => (
  <>
    {blocks.map((b, i) => (
      <Sequence key={i} from={b.from} durationInFrames={b.durationInFrames}>
        <Block block={b} theme={theme} />
      </Sequence>
    ))}
  </>
);
