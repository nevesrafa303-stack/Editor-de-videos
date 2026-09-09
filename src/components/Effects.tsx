import React from 'react';
import {AbsoluteFill, useCurrentFrame, interpolate} from 'remotion';

/** Flash branco de 3 frames na saida de cada insert (4.6 / 4.7). */
export const Flashes: React.FC<{frames: number[]}> = ({frames}) => {
  const frame = useCurrentFrame();
  const ativo = frames.find((f) => frame >= f && frame < f + 3);
  if (ativo === undefined) return null;
  const op = interpolate(frame - ativo, [0, 2], [0.85, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return <AbsoluteFill style={{backgroundColor: '#FFFFFF', opacity: op}} />;
};

/** 4.10 Fade to black nos ultimos ~15 frames. */
export const FadeToBlack: React.FC<{durationInFrames: number; fadeFrames?: number}> = ({
  durationInFrames,
  fadeFrames = 15,
}) => {
  const frame = useCurrentFrame();
  const inicio = durationInFrames - fadeFrames;
  if (frame < inicio) return null;
  const op = interpolate(frame, [inicio, durationInFrames - 1], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return <AbsoluteFill style={{backgroundColor: '#000000', opacity: op}} />;
};
