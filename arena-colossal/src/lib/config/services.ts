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

  /** Etapas do servico, na ordem em que acontecem. Alimenta a pagina propria. */
  etapas: string[];
  /** Em que situacao este servico faz sentido. */
  indicado: string;
  /**
   * O que este servico NAO resolve.
   *
   * Existe de proposito: e' o campo que impede a pagina de virar folheto. Quem
   * compra estetica automotiva ja ouviu promessa demais, e dizer o limite do
   * servico e' o que separa quem entende de quem so vende.
   */
  naoResolve: string;
  /** Servicos que costumam vir junto, por sequencia tecnica. */
  combina: string[];
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
    etapas: [
      'Pré-lavagem com espuma para soltar a sujeira solta antes de qualquer contato.',
      'Lavagem por contato com luvas separadas por área e enxágue controlado.',
      'Limpeza de rodas, cavas e caixas com produto específico para cada superfície.',
      'Secagem com toalhas dedicadas e ar comprimido em frestas e acabamentos.',
    ],
    indicado:
      'Toda manutenção periódica, e obrigatoriamente antes de qualquer trabalho de correção ou proteção.',
    naoResolve:
      'Não remove riscos, manchas impregnadas nem oxidação. Lavar não corrige pintura — só revela o estado real dela.',
    combina: ['descontaminacao', 'protecao-pneus', 'protecao-plasticos'],
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
    etapas: [
      'Retirada de tapetes e aspiração profunda, incluindo trilhos e vãos.',
      'Aplicação de químicas específicas por tipo de superfície e tempo de ação controlado.',
      'Extração por injeção e sucção em tecidos, carpetes e teto.',
      'Secagem assistida para o interior não fechar úmido.',
    ],
    indicado:
      'Carro recém-comprado, uso com crianças ou pet, e qualquer interior que já não responde à limpeza comum.',
    naoResolve:
      'Não recupera tecido rasgado, plástico trincado nem mancha que já pigmentou a fibra. Extração remove o que está impregnado, não o que já é dano.',
    combina: ['higienizacao-ar-condicionado', 'higienizacao-couro'],
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
    etapas: [
      'Identificação do tipo de acabamento — couro pintado, semianilina e sintético pedem processos diferentes.',
      'Limpeza com pH controlado e escova macia, removendo oleosidade acumulada.',
      'Neutralização e secagem.',
      'Hidratação específica com acabamento fosco natural.',
    ],
    indicado:
      'Bancos com brilho oleoso, toque pegajoso ou escurecimento nas áreas de maior contato.',
    naoResolve:
      'Não recupera couro ressecado a ponto de trincar, nem repinta desgaste que já chegou ao substrato. Couro perdido não volta com química.',
    combina: ['higienizacao-interna'],
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
    etapas: [
      'Avaliação do fluxo e da origem do odor.',
      'Tratamento do evaporador e das dutas de ventilação.',
      'Troca ou limpeza do filtro de cabine, conforme o estado.',
      'Teste de circulação após o tratamento.',
    ],
    indicado:
      'Odor que volta sempre que o ar liga, principalmente depois de período parado ou de exposição à umidade.',
    naoResolve:
      'Não conserta o sistema. Vazamento, compressor ou falta de gás são manutenção mecânica — aqui se trata o que causa cheiro, não o que causa pane.',
    combina: ['higienizacao-interna'],
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
    etapas: [
      'Diagnóstico da contaminação por toque e por leitura visual.',
      'Descontaminação ferrosa com químico específico.',
      'Remoção de resíduos resinosos e piche.',
      'Descontaminação mecânica com clay quando a superfície ainda pede.',
    ],
    indicado:
      'Pintura áspera ao toque, pontinhos alaranjados no verniz e qualquer carro que vá receber polimento ou proteção.',
    naoResolve:
      'Não corrige riscos nem devolve brilho sozinha. É a etapa que prepara a superfície — o brilho vem do polimento.',
    combina: ['lavagem-tecnica', 'polimento-tecnico', 'vitrificacao'],
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
    etapas: [
      'Medição da espessura do verniz e leitura dos defeitos sob iluminação técnica.',
      'Teste de combinação em área controlada, definindo boina e composto.',
      'Corte por etapas, com conferência entre cada passe.',
      'Refino e remoção de hologramas.',
    ],
    indicado:
      'Pintura opaca, com teias de lavagem, marcas circulares ou perda de profundidade.',
    naoResolve:
      'Não recupera risco que passou do verniz, nem substitui pintura. Polir é remover camada — e camada não volta; por isso a medição vem antes.',
    combina: ['descontaminacao', 'vitrificacao'],
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
    etapas: [
      'Conferência de que a preparação está fechada — sem ela, a proteção não é aplicada.',
      'Limpeza de painel para remover qualquer resíduo de polimento.',
      'Aplicação da proteção cerâmica por seções.',
      'Cura controlada, com o veículo abrigado pelo tempo necessário.',
    ],
    indicado:
      'Carro novo, ou qualquer pintura logo após a correção — é o momento em que a proteção rende mais.',
    naoResolve:
      'Não impede risco, batida nem marca de lavagem malfeita. Proteção facilita a manutenção e resiste a intempérie; ela não blinda a pintura.',
    combina: ['polimento-tecnico', 'descontaminacao'],
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
    etapas: [
      'Limpeza profunda do plástico, removendo resíduo e produto antigo.',
      'Avaliação do nível de desbotamento.',
      'Aplicação de proteção com barreira UV.',
      'Remoção do excesso para acabamento fosco, sem aspecto oleoso.',
    ],
    indicado:
      'Parachoques, frisos, retrovisores e grades que começaram a esbranquiçar.',
    naoResolve:
      'Não recupera plástico já craquelado ou queimado a fundo. A proteção segura o que sobrou e evita o próximo estágio.',
    combina: ['lavagem-tecnica', 'protecao-pneus'],
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
    etapas: [
      'Limpeza profunda da borracha, removendo produto antigo acumulado.',
      'Secagem completa antes da aplicação.',
      'Aplicação uniforme da proteção.',
      'Remoção do excesso para não respingar na pintura ao rodar.',
    ],
    indicado:
      'Acabamento final de qualquer serviço, e manutenção de quem não abre mão do conjunto de rodas em dia.',
    naoResolve:
      'Não recupera borracha ressecada nem corrige pneu envelhecido. Acabamento é acabamento, não é conservação de pneu.',
    combina: ['lavagem-tecnica', 'protecao-plasticos'],
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
    etapas: [
      'Avaliação da lente — amarelamento superficial e verniz descascado pedem caminhos diferentes.',
      'Lixamento progressivo por granas até uniformizar a superfície.',
      'Refino e polimento da lente.',
      'Aplicação de proteção UV, sem a qual o amarelamento volta.',
    ],
    indicado:
      'Farol amarelado, opaco ou com perda visível de alcance à noite.',
    naoResolve:
      'Não resolve lente trincada, embaçamento interno por infiltração nem defeito elétrico. Isso é troca ou reparo, não restauração.',
    combina: ['polimento-tecnico', 'lavagem-tecnica'],
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
