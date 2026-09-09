import React from 'react';
import {AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig, spring} from 'remotion';
import type {KeywordGroup} from '../types';
import {glowShadow, type Theme} from '../theme';
import {displayFontFamily} from '../fonts';

/**
 * 4.5 Keywords em destaque — gancho e listas de comandos.
 *
 * Aparecem UMA A UMA no timestamp exato da fala, EMPILHAM, e somem JUNTAS em
 * corte seco no fim do grupo. Entrada com spring de ~8 frames.
 * Cada aparicao tem um hit sincronizado (agendado em data.sfx pelo 04_build_edl).
 */
const Item: React.FC<{
  text: string;
  appearAt: number;
  theme: Theme;
  mode: KeywordGroup['mode'];
}> = ({text, appearAt, theme, mode}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  if (frame < appearAt) return null;

  const s = spring({
    frame: frame - appearAt,
    fps,
    config: {damping: 200, stiffness: 220, mass: 0.6},
    durationInFrames: 8,
  });

  const size = mode === 'hook' ? theme.tamanhoKeyword : Math.round(theme.tamanhoKeyword * 0.52);

  return (
    <div
      style={{
        transform: `scale(${0.82 + s * 0.18})`,
        opacity: s,
        fontFamily: displayFontFamily,
        fontWeight: 900,
        fontSize: size,
        lineHeight: 1.12,
        letterSpacing: mode === 'hook' ? 1.5 : 0.8,
        textAlign: 'center',
        color: theme.corKeyword,
        textShadow:
          theme.estiloKeyword === 'glow'
            ? glowShadow(theme.corKeyword)
            : '0 6px 26px rgba(0,0,0,0.7)',
        padding: '0 4%',
      }}
    >
      {text.toLocaleUpperCase('pt-BR')}
    </div>
  );
};

const Group: React.FC<{group: KeywordGroup; theme: Theme}> = ({group, theme}) => (
  <AbsoluteFill style={{alignItems: 'center'}}>
    <div
      style={{
        position: 'absolute',
        // Sobre o peito, ACIMA da faixa de legenda (55%). As duas camadas
        // coexistem no gancho, entao precisam de trilhos verticais separados.
        top: group.mode === 'hook' ? '38%' : '50%',
        transform: 'translateY(-50%)',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: group.mode === 'hook' ? 18 : 30,
      }}
    >
      {group.items.map((it, i) => (
        <Item
          key={i}
          text={it.text}
          appearAt={it.at - group.from}
          theme={theme}
          mode={group.mode}
        />
      ))}
    </div>
  </AbsoluteFill>
);

export const KeywordStacks: React.FC<{groups: KeywordGroup[]; theme: Theme}> = ({
  groups,
  theme,
}) => (
  <>
    {groups.map((g, i) => (
      <Sequence key={i} from={g.from} durationInFrames={g.durationInFrames}>
        <Group group={g} theme={theme} />
      </Sequence>
    ))}
  </>
);
