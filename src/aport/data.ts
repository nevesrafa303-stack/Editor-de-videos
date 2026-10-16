import assets from '../generated/aport-assets.json';

/**
 * Criativos Aport Seguros — briefing LAKS "Copy Criativos 01/09/26".
 * Cada criativo sai em Feed (1080×1350) e Stories (1080×1920).
 */

export type OperadoraId = 'bradesco' | 'sulamerica' | 'porto';

export type Operadora = {
  nome: string;
  /** cor principal da operadora */
  primaria: string;
  /** tom escuro para barra de CTA e contraste */
  escura: string;
  /** fundo claro dos cards */
  clara: string;
  /** destaque (check dos benefícios, brilho do CTA) */
  destaque: string;
  /** marca em texto usada enquanto o PNG oficial não estiver em assets/aport/logos */
  wordmark: {linha1: string; linha2?: string; cor: string; cor2?: string};
};

export const OPERADORAS: Record<OperadoraId, Operadora> = {
  bradesco: {
    nome: 'Bradesco Saúde',
    primaria: '#CC092F',
    escura: '#7A0019',
    clara: '#FDEEF1',
    destaque: '#FFD3DC',
    wordmark: {linha1: 'bradesco', linha2: 'saúde', cor: '#CC092F'},
  },
  sulamerica: {
    nome: 'SulAmérica',
    primaria: '#F26522',
    escura: '#001E62',
    clara: '#FFF2EA',
    destaque: '#FFB48A',
    wordmark: {linha1: 'SulAmérica', cor: '#001E62', cor2: '#F26522'},
  },
  porto: {
    nome: 'Porto Seguro',
    primaria: '#0046C0',
    escura: '#00245F',
    clara: '#EAF2FF',
    destaque: '#00A0DF',
    wordmark: {linha1: 'Porto', linha2: 'saúde', cor: '#0046C0'},
  },
};

export type Criativo = {
  id: string;
  operadora: OperadoraId;
  h1: string;
  vidas: string;
  preco: number;
  beneficios: string[];
  h4: string;
  h5: string;
  cta: string;
  /** foto do hospital (arquivo em assets/aport/hospitais) */
  hospital?: {arquivo: string; nome: string};
};

const H1 = 'Plano de Saúde para CNPJ';
const H4 = '2 adultos até 38 anos e 1 jovem até 18 anos';
const H5 = 'Os valores podem variar conforme o perfil do beneficiário.';
const CTA = 'Simulação Gratuita 100% Online';

const BEN_BRADESCO = ['Ampla rede referenciada', 'Telemedicina', 'Suporte direcionado para pacientes com TEA'];
const BEN_SULAMERICA = ["Atendimento Rede D'Or", 'Plano odontológico'];
const BEN_PORTO = ['Plano odontológico', 'Seguro de vida', 'Serviços ocupacionais', 'Proteção antiácaro'];

const DR_BEDA = {arquivo: 'dr-beda.png', nome: 'Hospital Dr. Beda'};
const NURSING = {arquivo: 'nursing-care.png', nome: 'Hospital Nursing Care'};

const base = {h1: H1, vidas: '3 vidas', h4: H4, h5: H5, cta: CTA};

export const CRIATIVOS: Criativo[] = [
  {...base, id: '01', operadora: 'bradesco', preco: 1697.9, beneficios: BEN_BRADESCO},
  {...base, id: '02', operadora: 'bradesco', preco: 1697.9, beneficios: BEN_BRADESCO, hospital: DR_BEDA},
  {...base, id: '03', operadora: 'sulamerica', preco: 1014.97, beneficios: BEN_SULAMERICA},
  {...base, id: '04', operadora: 'sulamerica', preco: 1014.97, beneficios: BEN_SULAMERICA, hospital: NURSING},
  {...base, id: '05', operadora: 'porto', preco: 942.8, beneficios: BEN_PORTO},
  {...base, id: '06', operadora: 'porto', preco: 942.8, beneficios: BEN_PORTO, hospital: DR_BEDA},
];

export const FORMATOS = {
  feed: {width: 1080, height: 1350},
  stories: {width: 1080, height: 1920},
} as const;
export type Formato = keyof typeof FORMATOS;

export const FPS = 30;
export const DURACAO = 12 * FPS;

/** logos oficiais presentes em public/aport/logos (gerado por scripts/aport/prepare.mjs) */
export const LOGOS_DISPONIVEIS: Record<string, string> = assets.logos;
