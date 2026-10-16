import React from 'react';
import {Composition} from 'remotion';
import {Reel} from './Reel';
import {reelData} from './data';
import type {ReelData} from './types';
import {AportAd} from './aport/AportAd';
import {CRIATIVOS, DURACAO, FORMATOS, FPS, type Formato} from './aport/data';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="Reel"
      component={Reel as React.FC<Record<string, unknown>>}
      width={reelData.width}
      height={reelData.height}
      fps={reelData.fps}
      durationInFrames={reelData.durationInFrames}
      defaultProps={{data: reelData} as unknown as Record<string, unknown>}
    />
    {CRIATIVOS.flatMap((criativo) =>
      (Object.keys(FORMATOS) as Formato[]).map((formato) => (
        <Composition
          key={`${criativo.id}-${formato}`}
          id={`Aport-${criativo.id}-${formato === 'feed' ? 'Feed' : 'Stories'}`}
          component={AportAd}
          width={FORMATOS[formato].width}
          height={FORMATOS[formato].height}
          fps={FPS}
          durationInFrames={DURACAO}
          defaultProps={{criativo, formato}}
        />
      )),
    )}
  </>
);

export type {ReelData};
