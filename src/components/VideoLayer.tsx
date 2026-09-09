import React from 'react';
import {AbsoluteFill, useCurrentFrame, interpolate, staticFile} from 'remotion';
import {Video} from '@remotion/media';
import type {Segment} from '../types';

/**
 * 4.1 Reframe 9:16 + 4.2 corte frame-accurate + 4.3 punch-in / micro-translate / creep.
 *
 * O mezzanine ja chega vertical e com o color grade embutido (03_mezzanine.sh),
 * numa resolucao ~1.5x maior que 1080x1920 para o zoom maximo (135%) nao perder
 * qualidade. Aqui so escalamos e transladamos.
 */
export const VideoLayer: React.FC<{
  segment: Segment;
  fps: number;
  src: string;
  width: number;
}> = ({segment, fps, src, width}) => {
  const frame = useCurrentFrame();

  // Creep zoom: cresce linearmente ao longo do segmento (imperceptivel, evita quadro estatico).
  const creep = interpolate(
    frame,
    [0, segment.durationInFrames],
    [0, segment.creep],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
  );

  const scale = segment.scale + creep;
  const tx = segment.translateX * width;

  return (
    <AbsoluteFill style={{overflow: 'hidden', backgroundColor: '#000'}}>
      <AbsoluteFill
        style={{
          transform: `translateX(${tx}px) scale(${scale})`,
          // Troca de escala e SECA no frame do corte: nenhuma transicao CSS aqui.
          willChange: 'transform',
        }}
      >
        <Video
          src={staticFile(src)}
          // trimBefore em frames: corte frame-accurate direto do mezzanine.
          trimBefore={Math.round(segment.srcStart * fps)}
          trimAfter={Math.round(segment.srcEnd * fps)}
          // O audio final vem da faixa tratada (Etapa 3); o do video fica mudo.
          volume={0}
          style={{width: '100%', height: '100%', objectFit: 'cover'}}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
