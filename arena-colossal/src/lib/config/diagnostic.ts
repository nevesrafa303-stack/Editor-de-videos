import { getService, type Service } from './services';

/**
 * Diagnóstico — "monte o processo do seu carro".
 *
 * O que isto é: um motor de recomendação DETERMINÍSTICO. Quatro perguntas,
 * pesos fixos por resposta, resultado sempre igual para a mesma entrada. Não
 * há modelo, sorteio nem chamada externa — o que significa que a sugestão é
 * auditável e a Arena consegue conferir, regra por regra, por que um serviço
 * entrou na lista.
 *
 * O que isto NÃO é: um orçamento nem um laudo. A pintura de um carro não se
 * lê por formulário. Por isso todo resultado sai rotulado como ponto de
 * partida, e a avaliação presencial continua sendo quem decide — exatamente o
 * que o restante do site afirma.
 *
 * Como ajustar: mexa nos pesos em `PESOS`. Nada mais precisa mudar; a ordem do
 * processo vem da sequência técnica em `ORDEM_TECNICA`, não da pontuação.
 */

export type OpcaoId = string;

export type Pergunta = {
  id: string;
  titulo: string;
  /** Uma linha de contexto — o porquê da pergunta, não a repetição dela. */
  ajuda: string;
  opcoes: {
    id: OpcaoId;
    rotulo: string;
    /** Frase curta que aparece sob o rótulo. */
    detalhe: string;
  }[];
};

export const perguntas: Pergunta[] = [
  {
    id: 'rotina',
    titulo: 'Como o carro vive?',
    ajuda: 'A rotina define o tipo de sujeira que a pintura acumula — e ela é diferente em cada uma.',
    opcoes: [
      { id: 'garagem', rotulo: 'Guardado em garagem', detalhe: 'Sai pouco, dorme coberto ou fechado.' },
      { id: 'rua', rotulo: 'Na rua, todo dia', detalhe: 'Sol, chuva, poeira e estacionamento aberto.' },
      { id: 'litoral', rotulo: 'Perto do mar', detalhe: 'Maresia e salinidade em contato constante.' },
      { id: 'estrada', rotulo: 'Muita estrada', detalhe: 'Insetos, piche e quilometragem alta.' },
    ],
  },
  {
    id: 'pintura',
    titulo: 'Como está a pintura hoje?',
    ajuda: 'Seja honesto aqui: é o que mais muda o processo sugerido.',
    opcoes: [
      { id: 'nova', rotulo: 'Nova ou impecável', detalhe: 'Sem marcas visíveis sob o sol.' },
      { id: 'opaca', rotulo: 'Perdeu brilho', detalhe: 'Parece apagada, sem profundidade.' },
      { id: 'marcada', rotulo: 'Com riscos e marcas', detalhe: 'Teias de lavagem, manchas, pontos ásperos.' },
      { id: 'naosei', rotulo: 'Não sei dizer', detalhe: 'Nunca olhei com atenção.' },
    ],
  },
  {
    id: 'interior',
    titulo: 'E por dentro?',
    ajuda: 'O interior tem processo próprio: ele não melhora porque a pintura melhorou.',
    opcoes: [
      { id: 'limpo', rotulo: 'Só a poeira do dia a dia', detalhe: 'Nada impregnado.' },
      { id: 'uso', rotulo: 'Marcas de uso', detalhe: 'Bancos e plásticos com desgaste aparente.' },
      { id: 'odor', rotulo: 'Odor que não sai', detalhe: 'Volta sempre, mesmo depois de limpar.' },
      { id: 'familia', rotulo: 'Crianças ou pet', detalhe: 'Tecido, pelos e o que vem junto.' },
    ],
  },
  {
    id: 'objetivo',
    titulo: 'O que você quer no fim?',
    ajuda: 'O mesmo carro pede caminhos diferentes dependendo do destino.',
    opcoes: [
      { id: 'proteger', rotulo: 'Proteger o que está bom', detalhe: 'Segurar o estado atual por mais tempo.' },
      { id: 'recuperar', rotulo: 'Recuperar o brilho', detalhe: 'Trazer de volta o que se perdeu.' },
      { id: 'vender', rotulo: 'Entregar impecável', detalhe: 'Venda, devolução de locação ou presente.' },
      { id: 'manter', rotulo: 'Manutenção regular', detalhe: 'Entrar num ciclo e não deixar acumular.' },
    ],
  },
];

/**
 * Peso de cada resposta sobre cada serviço.
 *
 * Um serviço entra no processo quando soma `LIMIAR` ou mais. Os números são
 * relativos entre si — o que importa é a ordem de grandeza, não a escala.
 */
const PESOS: Record<string, Record<OpcaoId, Partial<Record<string, number>>>> = {
  rotina: {
    garagem: { 'lavagem-tecnica': 2 },
    rua: { 'lavagem-tecnica': 3, descontaminacao: 2, 'protecao-plasticos': 2 },
    litoral: { 'lavagem-tecnica': 3, descontaminacao: 3, vitrificacao: 2, 'protecao-plasticos': 2 },
    estrada: { 'lavagem-tecnica': 3, descontaminacao: 3, 'restauracao-farois': 2, 'protecao-pneus': 1 },
  },
  pintura: {
    nova: { vitrificacao: 3 },
    opaca: { descontaminacao: 2, 'polimento-tecnico': 3 },
    marcada: { descontaminacao: 3, 'polimento-tecnico': 4, 'restauracao-farois': 1 },
    // Sem leitura da pintura, o processo começa pelo que revela o estado real.
    naosei: { 'lavagem-tecnica': 3, descontaminacao: 2 },
  },
  interior: {
    limpo: { 'higienizacao-ar-condicionado': 1 },
    uso: { 'higienizacao-interna': 3, 'higienizacao-couro': 2 },
    odor: { 'higienizacao-interna': 4, 'higienizacao-ar-condicionado': 4 },
    familia: { 'higienizacao-interna': 4, 'higienizacao-ar-condicionado': 2, 'higienizacao-couro': 1 },
  },
  objetivo: {
    proteger: { vitrificacao: 3, 'protecao-plasticos': 2, 'protecao-pneus': 2 },
    recuperar: { 'polimento-tecnico': 3, 'restauracao-farois': 2, vitrificacao: 1 },
    vender: {
      'polimento-tecnico': 3,
      'higienizacao-interna': 3,
      'restauracao-farois': 3,
      'protecao-pneus': 2,
    },
    manter: { 'lavagem-tecnica': 3, 'protecao-plasticos': 1, 'protecao-pneus': 1 },
  },
};

/** Justificativa exibida quando a resposta puxou um serviço para a lista. */
const MOTIVOS: Record<string, Record<OpcaoId, string>> = {
  rotina: {
    garagem: 'carro guardado acumula menos, mas ainda precisa da base bem feita',
    rua: 'exposição diária na rua',
    litoral: 'maresia em contato constante',
    estrada: 'quilometragem e impacto de estrada',
  },
  pintura: {
    nova: 'pintura ainda impecável — é a hora de proteger',
    opaca: 'brilho perdido',
    marcada: 'riscos e marcas visíveis',
    naosei: 'estado da pintura ainda desconhecido',
  },
  interior: {
    limpo: 'interior em dia',
    uso: 'marcas de uso no interior',
    odor: 'odor persistente',
    familia: 'uso com crianças ou pet',
  },
  objetivo: {
    proteger: 'objetivo de proteger o estado atual',
    recuperar: 'objetivo de recuperar o brilho',
    vender: 'objetivo de entregar impecável',
    manter: 'objetivo de manutenção regular',
  },
};

/**
 * Sequência técnica do trabalho.
 *
 * O processo sugerido é ORDENADO POR AQUI, nunca por pontuação: proteção
 * depois de correção, correção depois de descontaminação, descontaminação
 * depois de lavagem. Inverter isso seria sugerir um trabalho que a própria
 * seção "Processo" diz que não se faz.
 */
const ORDEM_TECNICA = [
  'lavagem-tecnica',
  'descontaminacao',
  'polimento-tecnico',
  'restauracao-farois',
  'vitrificacao',
  'higienizacao-interna',
  'higienizacao-couro',
  'higienizacao-ar-condicionado',
  'protecao-plasticos',
  'protecao-pneus',
];

const LIMIAR = 3;
/** Teto de itens: uma lista de dez serviços não é recomendação, é catálogo. */
const MAXIMO = 5;

/**
 * A lavagem técnica é a BASE de qualquer trabalho na pintura — o site inteiro
 * afirma isso ("a base de todo trabalho sério; nada avança sem ela").
 *
 * Sem esta regra, o corte por pontuação chegava a descartá-la justamente nos
 * casos mais pesados, onde a pontuação se concentra em correção e proteção:
 * o diagnóstico sugeria polir um carro que ele mesmo nunca mandou lavar. Ela
 * entra fora da disputa por pontos sempre que houver trabalho de pintura.
 */
const BASE = 'lavagem-tecnica';
const EXIGEM_BASE = ['descontaminacao', 'polimento-tecnico', 'vitrificacao'];

export type Respostas = Record<string, OpcaoId>;

export type ItemRecomendado = {
  service: Service;
  /** Por que este serviço entrou — em linguagem de gente. */
  motivo: string;
};

export type Recomendacao = {
  itens: ItemRecomendado[];
  /** Soma das durações, em minutos. */
  duracaoTotal: number;
  /** Serviço por onde começar o agendamento. */
  principal: Service | null;
  /** Resumo em uma frase, montado a partir das respostas. */
  resumo: string;
};

/**
 * Monta o processo sugerido.
 *
 * Função pura: mesma entrada, mesma saída. Roda no cliente sem requisição —
 * o diagnóstico responde instantaneamente e funciona mesmo com a API fora.
 */
export function montarRecomendacao(respostas: Respostas): Recomendacao {
  const pontos = new Map<string, number>();
  const motivos = new Map<string, string>();

  for (const [perguntaId, opcaoId] of Object.entries(respostas)) {
    const pesosDaResposta = PESOS[perguntaId]?.[opcaoId];
    if (!pesosDaResposta) continue;

    for (const [slug, peso] of Object.entries(pesosDaResposta)) {
      if (typeof peso !== 'number') continue;
      const anterior = pontos.get(slug) ?? 0;
      pontos.set(slug, anterior + peso);

      // O motivo exibido é o da resposta que mais puxou o serviço.
      const motivoAtual = MOTIVOS[perguntaId]?.[opcaoId];
      if (motivoAtual && peso >= 3) motivos.set(slug, motivoAtual);
    }
  }

  const aprovados = [...pontos.entries()]
    .filter(([, total]) => total >= LIMIAR)
    .sort((a, b) => b[1] - a[1])
    .slice(0, MAXIMO)
    .map(([slug]) => slug);

  if (aprovados.some((slug) => EXIGEM_BASE.includes(slug)) && !aprovados.includes(BASE)) {
    aprovados.push(BASE);
    motivos.set(BASE, 'é a base de qualquer trabalho na pintura');
  }

  const itens = ORDEM_TECNICA.filter((slug) => aprovados.includes(slug))
    .map((slug) => {
      const service = getService(slug);
      if (service === null) return null;
      return { service, motivo: motivos.get(slug) ?? 'combina com o restante do processo' };
    })
    .filter((item): item is ItemRecomendado => item !== null);

  const duracaoTotal = itens.reduce((total, item) => total + item.service.durationMinutes, 0);

  return {
    itens,
    duracaoTotal,
    principal: itens[0]?.service ?? null,
    resumo: montarResumo(respostas, itens.length),
  };
}

function montarResumo(respostas: Respostas, quantidade: number): string {
  if (quantidade === 0) {
    return 'Com o que você respondeu, o caminho começa por uma avaliação presencial — é ela que define o resto.';
  }

  const rotina = MOTIVOS.rotina?.[respostas.rotina ?? ''] ?? '';
  const objetivo = MOTIVOS.objetivo?.[respostas.objetivo ?? ''] ?? '';

  const partes = [rotina, objetivo].filter((parte) => parte.length > 0);
  const contexto = partes.length > 0 ? ` a partir de ${partes.join(' e ')}` : '';

  return `Montamos ${quantidade} ${quantidade === 1 ? 'etapa' : 'etapas'} na ordem técnica${contexto}.`;
}

/** Texto colado nas observações do agendamento — a Arena chega sabendo do quê se trata. */
export function montarObservacao(recomendacao: Recomendacao, respostas: Respostas): string {
  if (recomendacao.itens.length === 0) return '';

  const respostasLegiveis = perguntas
    .map((pergunta) => {
      const opcao = pergunta.opcoes.find((item) => item.id === respostas[pergunta.id]);
      return opcao ? `${pergunta.titulo} ${opcao.rotulo}` : null;
    })
    .filter((linha): linha is string => linha !== null);

  return [
    'Processo sugerido pelo diagnóstico do site:',
    recomendacao.itens.map((item, index) => `${index + 1}. ${item.service.name}`).join(' · '),
    '',
    respostasLegiveis.join(' | '),
  ].join('\n');
}
