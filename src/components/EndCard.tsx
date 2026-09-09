import React from 'react';
import {
  AbsoluteFill,
  Sequence,
  Img,
  useCurrentFrame,
  useVideoConfig,
  spring,
  staticFile,
} from 'remotion';
import type {EndCard as EndCardData} from '../types';
import {type Theme} from '../theme';
import {displayFontFamily} from '../fonts';

/**
 * 4.9 End card — OBRIGATORIO, 3-5s. Logo se fornecido, senao nome + titulo
 * em tipografia do theme. A trilha sobe aqui (nao ha fala) — ver 05_audio.mjs.
 */
export const EndCard: React.FC<{card: EndCardData; theme: Theme}> = ({card, theme}) => (
  <Sequence from={card.from} durationInFrames={card.durationInFrames}>
    <Inner theme={theme} />
  </Sequence>
);

const Inner: React.FC<{theme: Theme}> = ({theme}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const s = spring({frame, fps, config: {damping: 200}, durationInFrames: 18});

  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.fundoEndCard,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <div
        style={{
          opacity: s,
          transform: `scale(${0.94 + s * 0.06})`,
          textAlign: 'center',
          padding: '0 10%',
        }}
      >
        {theme.logoSrc ? (
          <Img src={staticFile(theme.logoSrc)} style={{width: 520, objectFit: 'contain'}} />
        ) : (
          <>
            <div
              style={{
                fontFamily: displayFontFamily,
                fontWeight: 900,
                fontSize: 82,
                letterSpacing: 2,
                lineHeight: 1.1,
                color: theme.corEndCardTexto,
              }}
            >
              {theme.nomeApresentador.toLocaleUpperCase('pt-BR')}
            </div>
            <div
              style={{
                marginTop: 22,
                width: 120,
                height: 3,
                backgroundColor: theme.corEndCardTexto,
                opacity: 0.5,
                marginLeft: 'auto',
                marginRight: 'auto',
              }}
            />
            <div
              style={{
                marginTop: 22,
                fontFamily: displayFontFamily,
                fontWeight: 500,
                fontSize: 34,
                letterSpacing: 4,
                color: theme.corEndCardTexto,
                opacity: 0.82,
              }}
            >
              {theme.tituloApresentador.toLocaleUpperCase('pt-BR')}
            </div>
          </>
        )}
      </div>
    </AbsoluteFill>
  );
};
