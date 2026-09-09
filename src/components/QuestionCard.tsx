import React from 'react';
import {AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig, spring} from 'remotion';
import type {QaCard} from '../types';
import {type Theme} from '../theme';
import {displayFontFamily} from '../fonts';

/**
 * 4.8 Abertura Q&A — card estilo Instagram Stories no terco superior.
 * Sai em corte seco quando a resposta comeca (a Sequence simplesmente termina).
 */
export const QuestionCard: React.FC<{card: QaCard | null; theme: Theme}> = ({card, theme}) => {
  if (!card) return null;
  return (
    <Sequence from={card.from} durationInFrames={card.durationInFrames}>
      <Inner card={card} theme={theme} />
    </Sequence>
  );
};

const Inner: React.FC<{card: QaCard; theme: Theme}> = ({card, theme}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const s = spring({frame, fps, config: {damping: 200}, durationInFrames: 12});

  return (
    <AbsoluteFill style={{justifyContent: 'flex-start', alignItems: 'center', paddingTop: '22%'}}>
      <div
        style={{
          width: '78%',
          backgroundColor: '#FFFFFF',
          borderRadius: 24,
          padding: '30px 34px 34px',
          boxShadow: '0 24px 70px rgba(0,0,0,0.45)',
          transform: `translateY(${(1 - s) * 40}px) scale(${0.94 + s * 0.06})`,
          opacity: s,
        }}
      >
        <div
          style={{
            fontFamily: displayFontFamily,
            fontWeight: 800,
            fontSize: 22,
            letterSpacing: 2.4,
            color: '#8A8A8F',
            marginBottom: 16,
          }}
        >
          {card.header.toLocaleUpperCase('pt-BR')}
        </div>
        <div
          style={{
            fontFamily: displayFontFamily,
            fontWeight: 600,
            fontSize: 40,
            lineHeight: 1.3,
            color: '#111111',
          }}
        >
          {card.question}
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** Blur leve no video enquanto o card esta em foco. Aplicado por fora, no Reel. */
export const qaBlurAmount = (frame: number, card: QaCard | null): number => {
  if (!card) return 0;
  const dentro = frame >= card.from && frame < card.from + card.durationInFrames;
  return dentro ? 6 : 0;
};
