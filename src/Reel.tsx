import React from 'react';
import {AbsoluteFill, Audio, Sequence, useCurrentFrame, staticFile} from 'remotion';
import type {ReelData} from './types';
import {buildTheme} from './theme';
import {VideoLayer} from './components/VideoLayer';
import {Captions} from './components/Captions';
import {KeywordStacks} from './components/KeywordStack';
import {Inserts} from './components/Inserts';
import {MotionGraphics} from './components/MotionGraphics';
import {QuestionCard, qaBlurAmount} from './components/QuestionCard';
import {EndCard} from './components/EndCard';
import {Flashes, FadeToBlack} from './components/Effects';

/** Duracao de cada efeito, espelhando scripts/lib/sfx_spec.mjs. */
const SFX_DURACAO: Record<string, number> = {hit: 0.34, whoosh: 0.45, pop: 0.08, riser: 1.6};

/**
 * ETAPA 4 — Montagem. Ordem de empilhamento (de baixo para cima):
 *   video (cortes+punch-in) -> inserts/B-roll -> motion -> legendas -> keywords
 *   -> card Q&A -> end card -> flashes -> fade final
 */
export const Reel: React.FC<{data: ReelData}> = ({data}) => {
  const frame = useCurrentFrame();
  const theme = buildTheme(data.themePreset, data.assinatura);

  const blur = qaBlurAmount(frame, data.qaCard);

  // Legendas ocultas quando outro elemento ja exibe na tela o texto falado (4.4):
  // inserts tipograficos, painel de lista, motion e pilhas de COMANDOS.
  // O gancho e a excecao: ali as keywords sao palavras soltas tiradas de uma
  // frase maior, entao a legenda continua somando.
  const cobertoPorTexto = [
    ...data.inserts.filter((i) => i.kind !== 'broll-file'),
    ...data.motions,
    ...data.keywordGroups.filter((g) => g.mode === 'commands'),
  ].some((x) => frame >= x.from && frame < x.from + x.durationInFrames);

  const legendas = cobertoPorTexto ? [] : data.captions;

  return (
    <AbsoluteFill style={{backgroundColor: '#000000'}}>
      {/* --- Video: um <Sequence> por segmento da EDL --- */}
      <AbsoluteFill style={{filter: blur ? `blur(${blur}px)` : undefined}}>
        {data.segments.map((seg, i) => (
          <Sequence key={i} from={seg.from} durationInFrames={seg.durationInFrames}>
            <VideoLayer segment={seg} fps={data.fps} src={data.videoSrc} width={data.width} />
          </Sequence>
        ))}
      </AbsoluteFill>

      {/* --- Audio tratado (voz -14 LUFS + trilha) --- */}
      {data.audioSrc ? <Audio src={staticFile(data.audioSrc)} /> : null}

      {/* --- SFX: um <Audio> por evento, no frame exato, com ganho calibrado --- */}
      {data.sfx.map((e, i) => (
        <Sequence
          key={`sfx-${i}`}
          from={e.at}
          durationInFrames={Math.ceil(SFX_DURACAO[e.kind] * data.fps) + 1}
        >
          <Audio src={staticFile(`sfx/${e.kind}.wav`)} volume={e.gain} />
        </Sequence>
      ))}

      {/* --- Inserts / B-roll --- */}
      <Inserts inserts={data.inserts} theme={theme} />

      {/* --- Motion graphics --- */}
      <MotionGraphics motions={data.motions} theme={theme} />

      {/* --- Legendas --- */}
      <Captions blocks={legendas} theme={theme} />

      {/* --- Keywords em destaque --- */}
      <KeywordStacks groups={data.keywordGroups} theme={theme} />

      {/* --- Abertura Q&A --- */}
      <QuestionCard card={data.qaCard} theme={theme} />

      {/* --- End card --- */}
      <EndCard card={data.endCard} theme={theme} />

      {/* --- Acabamento --- */}
      <Flashes frames={data.flashes} />
      <FadeToBlack durationInFrames={data.durationInFrames} />
    </AbsoluteFill>
  );
};
