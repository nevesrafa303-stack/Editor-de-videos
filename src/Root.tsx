import React from 'react';
import {Composition} from 'remotion';
import {Reel} from './Reel';
import {reelData} from './data';
import type {ReelData} from './types';

export const RemotionRoot: React.FC = () => (
  <Composition
    id="Reel"
    component={Reel as React.FC<Record<string, unknown>>}
    width={reelData.width}
    height={reelData.height}
    fps={reelData.fps}
    durationInFrames={reelData.durationInFrames}
    defaultProps={{data: reelData} as unknown as Record<string, unknown>}
  />
);

export type {ReelData};
