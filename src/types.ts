/** Contratos de dados entre os scripts Node (EDL) e o Remotion. */

export type Word = {t: string; start: number; end: number};

/** Bloco de legenda: 2-5 palavras agrupadas por pausa natural de fala. */
export type CaptionBlock = {
  /** frames relativos ao inicio do video final */
  from: number;
  durationInFrames: number;
  text: string;
  /** indice da palavra do bloco que recebe corDestaque (theme editorial), ou null */
  highlightIndex: number | null;
};

/** Keyword empilhada (gancho ou lista de comandos). */
export type Keyword = {
  text: string;
  /** frame absoluto no video final em que entra */
  at: number;
};

export type KeywordGroup = {
  from: number;
  durationInFrames: number;
  items: Keyword[];
  /** 'hook' = palavras soltas grandes; 'commands' = frases imperativas menores */
  mode: 'hook' | 'commands';
};

export type InsertKind =
  | 'broll-file'
  | 'device-mockup'
  | 'kinetic-type'
  | 'list-panel';

export type InsertLayout = 'fullscreen' | 'pip-lower' | 'lower-panel';

export type Insert = {
  kind: InsertKind;
  layout: InsertLayout;
  from: number;
  durationInFrames: number;
  /** itens que acumulam um a um; cada um com o frame de aparicao */
  items: {text: string; at: number}[];
  /** para 'broll-file': caminho em public/ */
  src?: string;
  title?: string;
};

export type MotionKind =
  | 'kinetic'
  | 'pictograms'
  | 'counter'
  | 'two-columns'
  | 'checklist-stamp';

export type Motion = {
  kind: MotionKind;
  from: number;
  durationInFrames: number;
  items: {text: string; at: number; accent?: boolean}[];
  /** counter: valor final; checklist: texto do carimbo; two-columns: rotulos */
  headline?: string;
  stamp?: string;
  counterTo?: number;
  counterSuffix?: string;
  labels?: [string, string];
};

/** Um corte da EDL virando uma <Sequence> com o video trimado. */
export type Segment = {
  /** segundos no mezzanine */
  srcStart: number;
  srcEnd: number;
  /** frames no video final */
  from: number;
  durationInFrames: number;
  /** punch-in: 1.0 | 1.18 | 1.25-1.35 (enfase) */
  scale: number;
  /** micro-variacao de enquadramento, fracao da largura (-0.025 .. 0.025) */
  translateX: number;
  /** creep zoom: escala extra somada linearmente ao longo do segmento */
  creep: number;
  /** afirmacao forte -> zoom de enfase dedicado */
  emphasis: boolean;
  text: string;
};

export type QaCard = {
  from: number;
  durationInFrames: number;
  header: string;
  question: string;
};

export type SfxEvent = {
  /** hit | whoosh | pop | riser | flash */
  kind: 'hit' | 'whoosh' | 'pop' | 'riser';
  at: number;
  /** ganho linear calibrado por medicao (scripts/06_sfx.mjs) */
  gain: number;
};

export type EndCard = {
  from: number;
  durationInFrames: number;
};

export type ReelData = {
  fps: number;
  width: number;
  height: number;
  durationInFrames: number;
  /** mezzanine em public/ */
  videoSrc: string;
  /** faixa de audio ja tratada (voz + trilha) em public/, ou null p/ usar audio do mezzanine */
  audioSrc: string | null;
  musicSrc: string | null;
  segments: Segment[];
  captions: CaptionBlock[];
  keywordGroups: KeywordGroup[];
  inserts: Insert[];
  motions: Motion[];
  qaCard: QaCard | null;
  endCard: EndCard;
  sfx: SfxEvent[];
  /** frames com flash branco de saida de insert */
  flashes: number[];
  themePreset: 'autoridade' | 'editorial' | 'acolhedor';
  assinatura: {nome: string; titulo: string; logoSrc: string | null};
};
