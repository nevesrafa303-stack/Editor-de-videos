/**
 * ETAPA 0 — THEME (identidade visual)
 *
 * Toda a estetica do video e parametrizada aqui. O preset e escolhido pelo nicho
 * do apresentador (deduzido da transcricao por scripts/04_build_edl.mjs) ou
 * sobrescrito por marca do usuario em data/brand.json.
 */

export type PresetName = 'autoridade' | 'editorial' | 'acolhedor';

export type Theme = {
  preset: PresetName;

  /** Familia da legenda. Resolvida em fonts.ts para uma fonte do Google Fonts. */
  fonteLegenda: 'Montserrat' | 'Playfair Display' | 'Lora';
  pesoLegenda: number;
  italicoLegenda: boolean;
  /** minusculas sem pontuacao final | frase normal com pontuacao */
  caixaLegenda: 'lower' | 'sentence';
  /** GUIA DE ESTILO: 36-44px. Legendas discretas, nunca gigantes. */
  tamanhoLegenda: number;
  /** Posicao vertical do bloco de legenda, fracao da altura (0.55 = 55%). */
  alturaLegenda: number;

  corTexto: string;
  /** Cor de enfase da marca. Usada em palavra inline e no motion. */
  corDestaque: string;

  /** Estilo das keywords empilhadas do gancho / comandos. */
  estiloKeyword: 'glow' | 'solid';
  corKeyword: string;
  tamanhoKeyword: number;

  /** Fundo dos inserts (motion, painel de lista, B-roll tipografico). */
  fundoInsert: string;
  corInsertTexto: string;

  /** End card. */
  fundoEndCard: string;
  corEndCardTexto: string;

  /** Assinatura: usada quando nao ha arquivo de logo. */
  nomeApresentador: string;
  tituloApresentador: string;
  /** Caminho em public/ para o logo, se fornecido. */
  logoSrc: string | null;
};

const base = {
  corTexto: '#FFFFFF',
  tamanhoLegenda: 40,
  alturaLegenda: 0.55,
  tamanhoKeyword: 78,
} as const;

export const PRESETS: Record<PresetName, Omit<Theme, 'nomeApresentador' | 'tituloApresentador' | 'logoSrc'>> = {
  // Advogado, medico, financeiro — autoridade sobria (default)
  autoridade: {
    ...base,
    preset: 'autoridade',
    fonteLegenda: 'Montserrat',
    pesoLegenda: 500,
    italicoLegenda: false,
    caixaLegenda: 'lower',
    corDestaque: '#FFFFFF',
    estiloKeyword: 'glow',
    corKeyword: '#FFFFFF',
    fundoInsert: '#0E0E10',
    corInsertTexto: '#FFFFFF',
    fundoEndCard: '#0E0E10',
    corEndCardTexto: '#FFFFFF',
  },
  // Produtora, criador, lifestyle — editorial
  editorial: {
    ...base,
    preset: 'editorial',
    fonteLegenda: 'Playfair Display',
    pesoLegenda: 500,
    italicoLegenda: false,
    caixaLegenda: 'sentence',
    corDestaque: '#E53935',
    estiloKeyword: 'solid',
    corKeyword: '#E53935',
    fundoInsert: '#F4F2ED',
    corInsertTexto: '#111111',
    fundoEndCard: '#111111',
    corEndCardTexto: '#F4F2ED',
  },
  // Psicologo, terapeuta, educador — acolhedor
  acolhedor: {
    ...base,
    preset: 'acolhedor',
    fonteLegenda: 'Lora',
    pesoLegenda: 500,
    italicoLegenda: true,
    caixaLegenda: 'lower',
    corDestaque: '#FFFFFF',
    estiloKeyword: 'solid',
    corKeyword: '#FFFFFF',
    fundoInsert: '#F4F2ED',
    corInsertTexto: '#1B1B1B',
    fundoEndCard: '#2A2A2E',
    corEndCardTexto: '#FFFFFF',
  },
};

export const buildTheme = (
  preset: PresetName,
  assinatura: {nome: string; titulo: string; logoSrc?: string | null},
): Theme => ({
  ...PRESETS[preset],
  nomeApresentador: assinatura.nome,
  tituloApresentador: assinatura.titulo,
  logoSrc: assinatura.logoSrc ?? null,
});

/** Sombra multicamada do keyword branco com glow (padrao dominante em autoridade). */
export const glowShadow = (cor: string) =>
  [
    `0 0 10px ${cor}`,
    `0 0 24px ${cor}`,
    `0 0 48px ${cor}`,
    `0 0 80px ${cor}66`,
    '0 6px 24px rgba(0,0,0,0.55)',
  ].join(', ');

/** Sombra discreta da legenda — legibilidade sem chamar atencao. */
export const captionShadow = '0 2px 10px rgba(0,0,0,0.75), 0 0 3px rgba(0,0,0,0.9)';

export const applyCase = (texto: string, caixa: Theme['caixaLegenda']) => {
  if (caixa === 'lower') return texto.toLocaleLowerCase('pt-BR').replace(/[.,;!?]+$/u, '');
  return texto;
};
