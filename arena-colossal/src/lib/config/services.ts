/**
 * Catalogo de servicos.
 *
 * Esta lista e' a unica fonte de verdade: alimenta a secao de servicos, o passo
 * 01 do agendamento, a validacao do backend e o titulo do evento no Google
 * Calendar.
 *
 * SOBRE `durationMinutes`: e' o tempo que o slot ocupa na agenda. Os valores
 * abaixo sao PADROES DE PARTIDA e precisam ser ajustados para a operacao real
 * da Arena (veja README > "O que ainda precisa ser configurado"). Nenhum preco
 * e' publicado no site — precificacao de estetica automotiva depende de porte,
 * estado e inspecao do veiculo.
 */

export type Service = {
  /** Identificador estavel usado em URLs, API e analytics. */
  slug: string;
  /** Numero exibido na direcao de arte (01..10). */
  index: string;
  name: string;
  /** Uma frase — aparece no card e no resumo do agendamento. */
  summary: string;
  /** Paragrafo curto — aparece no estado expandido/hover do card. */
  description: string;
  /** Duracao do bloco reservado na agenda, em minutos. */
  durationMinutes: number;
  /** Caminho da imagem real quando existir; ate la o placeholder assume. */
  image: string;
};

export const services: Service[] = [
  {
    slug: 'lavagem-tecnica',
    index: '01',
    name: 'Lavagem Técnica / Detalhada',
    summary: 'A base de todo trabalho sério. Nada avança sem ela.',
    description:
      'Pré-lavagem, descontaminação de superfície e secagem controlada com toque mínimo. Cada etapa existe para remover sujeira sem gerar micro-riscos na pintura.',
    durationMinutes: 120,
    image: '/images/services/lavagem-tecnica.jpg',
  },
  {
    slug: 'higienizacao-interna',
    index: '02',
    name: 'Higienização Interna',
    summary: 'O interior volta a ser um ambiente, não um depósito de tempo.',
    description:
      'Extração profunda de tecidos, tratamento de carpetes, teto e plásticos internos. O objetivo não é cheiro: é remover o que causa o cheiro.',
    durationMinutes: 180,
    image: '/images/services/higienizacao-interna.jpg',
  },
  {
    slug: 'higienizacao-couro',
    index: '03',
    name: 'Higienização de Couro',
    summary: 'Couro limpo, hidratado e com o toque original preservado.',
    description:
      'Limpeza com pH controlado, remoção de oleosidade acumulada e hidratação específica para cada tipo de acabamento. Couro tratado errado não volta atrás.',
    durationMinutes: 120,
    image: '/images/services/higienizacao-couro.jpg',
  },
  {
    slug: 'higienizacao-ar-condicionado',
    index: '04',
    name: 'Higienização do Ar-Condicionado',
    summary: 'O que você respira dentro do carro também é detalhe.',
    description:
      'Tratamento do sistema de ventilação e do evaporador, atacando a origem do odor e do acúmulo biológico — não apenas mascarando com aroma.',
    durationMinutes: 60,
    image: '/images/services/higienizacao-ar.jpg',
  },
  {
    slug: 'descontaminacao',
    index: '05',
    name: 'Descontaminação',
    summary: 'A pintura precisa estar limpa de verdade antes de brilhar.',
    description:
      'Remoção de contaminação ferrosa e resinosa impregnada no verniz. É o passo invisível que define a qualidade de tudo que vem depois.',
    durationMinutes: 90,
    image: '/images/services/descontaminacao.jpg',
  },
  {
    slug: 'polimento-tecnico',
    index: '06',
    name: 'Polimento Técnico',
    summary: 'Correção medida, não remoção agressiva de verniz.',
    description:
      'Leitura da pintura, definição de combinação de boina e composto, e correção por etapas. Trabalho conduzido com iluminação técnica para avaliar cada passe.',
    durationMinutes: 480,
    image: '/images/services/polimento-tecnico.jpg',
  },
  {
    slug: 'vitrificacao',
    index: '07',
    name: 'Vitrificação',
    summary: 'Proteção real sobre uma superfície devidamente preparada.',
    description:
      'Aplicação de proteção cerâmica após correção e preparo da pintura, com cura controlada. Proteção aplicada sobre pintura suja é proteção desperdiçada.',
    durationMinutes: 480,
    image: '/images/services/vitrificacao.jpg',
  },
  {
    slug: 'protecao-plasticos',
    index: '08',
    name: 'Proteção de Plásticos',
    summary: 'Plásticos externos que param de envelhecer antes do carro.',
    description:
      'Tratamento e proteção de plásticos externos contra desbotamento por UV, devolvendo profundidade sem aparência oleosa.',
    durationMinutes: 60,
    image: '/images/services/protecao-plasticos.jpg',
  },
  {
    slug: 'protecao-pneus',
    index: '09',
    name: 'Proteção de Pneus',
    summary: 'Acabamento fosco, uniforme e sem respingo.',
    description:
      'Limpeza profunda da borracha e aplicação de proteção com acabamento controlado — o conjunto de rodas é a primeira coisa que denuncia um trabalho apressado.',
    durationMinutes: 45,
    image: '/images/services/protecao-pneus.jpg',
  },
  {
    slug: 'restauracao-farois',
    index: '10',
    name: 'Restauração / Proteção de Faróis',
    summary: 'Transparência recuperada e protegida contra o próximo ciclo.',
    description:
      'Lixamento progressivo, refino e proteção da lente. Restaurar sem proteger apenas adia o amarelamento para daqui a alguns meses.',
    durationMinutes: 180,
    image: '/images/services/restauracao-farois.jpg',
  },
];

const bySlug = new Map(services.map((service) => [service.slug, service]));

export function getService(slug: string): Service | null {
  return bySlug.get(slug) ?? null;
}

export function isServiceSlug(slug: string): boolean {
  return bySlug.has(slug);
}

export const serviceSlugs = services.map((service) => service.slug);
