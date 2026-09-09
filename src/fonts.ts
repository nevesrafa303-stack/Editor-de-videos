import {loadFont} from '@remotion/fonts';
import {staticFile, continueRender, delayRender} from 'remotion';
import manifesto from './generated/fonts.json';
import type {Theme} from './theme';

/**
 * Fontes 100% LOCAIS (public/fonts, baixadas uma vez por scripts/00_fonts.mjs).
 * Nenhuma requisicao de rede durante o render — o mesmo bruto sempre gera o
 * mesmo video, em qualquer maquina.
 */
const handle = delayRender('carregando fontes locais');

Promise.all(
  manifesto.map((f) =>
    loadFont({
      family: f.familia,
      url: staticFile(f.arquivo),
      weight: f.peso,
      style: f.estilo,
    }),
  ),
)
  .then(() => continueRender(handle))
  .catch((err) => {
    // Sem as fontes o layout muda: falhar alto e melhor que entregar errado.
    throw err;
  });

const STACKS: Record<Theme['fonteLegenda'], string> = {
  Montserrat: "'Montserrat', 'Helvetica Neue', Arial, sans-serif",
  'Playfair Display': "'Playfair Display', Georgia, 'Times New Roman', serif",
  Lora: "'Lora', Georgia, serif",
};

/** Fonte das legendas conforme o theme, com stack de fallback real. */
export const captionFontFamily = (theme: Theme): string => STACKS[theme.fonteLegenda];

/** Keywords, motion e end card usam sempre o sans pesado — leitura em CAPS. */
export const displayFontFamily = STACKS.Montserrat;
