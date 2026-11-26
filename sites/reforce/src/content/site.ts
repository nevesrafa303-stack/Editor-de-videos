// Todos os textos do site. Fonte: "Apresentação Institucional Reforce" (PDF, 26 páginas).
// Números, cases, nomes e cargos são os da apresentação: ao atualizar, mude só aqui.

export const marca = {
  nome: "Reforce Consultoria",
  assinatura: "Projetos de Capital e Infraestrutura",
  email: "comercial@reforceconsultoria.com.br",
  telefone: "+55 51 98209-8161",
  // WhatsApp: 55 + DDD + número, só dígitos (o mesmo telefone da apresentação).
  whatsapp: "5551982098161",
  escritorios: [
    { cidade: "Sapucaia", uf: "RS", tipo: "Sede" },
    { cidade: "Ouro Branco", uf: "MG", tipo: "Filial" },
  ],
};

export const nav = [
  { href: "#abordagem", label: "Abordagem" },
  { href: "#atuacao", label: "Atuação" },
  { href: "#metodo", label: "Método" },
  { href: "#cases", label: "Cases" },
  { href: "#equipe", label: "Equipe" },
];

export const cta = "Fale com a Reforce";

export const hero = {
  etiqueta: "Projetos de capital · Paradas · Infraestrutura",
  titulo: ["Planejamento", "que chega até", "a execução"],
  texto: "Gestão integrada, planejamento de campo e acompanhamento próximo para projetos industriais complexos.",
  secundario: "Ver resultados",
};

export const numeros = [
  { valor: 25, prefixo: "+", sufixo: "", rotulo: "consultores especializados" },
  { valor: 5, prefixo: "", sufixo: "", rotulo: "estados com atuação" },
  { valor: 6.1, prefixo: "R$ ", sufixo: " mi", decimais: 1, rotulo: "em valor capturado para o cliente em 16 meses" },
  { valor: 520, prefixo: "R$ ", sufixo: " mi", rotulo: "em projetos de capital com atuação da Reforce" },
];

export const abordagem = {
  kicker: "Planejamento que chega à execução",
  titulo: "Por que a conexão entre planejamento e campo é essencial?",
  texto:
    "Um cronograma só tem valor quando chega ao campo. Sem rotina, a informação se fragmenta e o desvio aparece tarde demais. Com gestão integrada, ele aparece a tempo de ser corrigido.",
  estados: [
    {
      id: "tradicional",
      rotulo: "Modelo tradicional",
      texto: "Informações fragmentadas, sem rotinas",
      resultado: "Reação tardia",
    },
    {
      id: "reforce",
      rotulo: "Nossa abordagem",
      texto: "Planejamento integrado à ação em campo e rotinas diárias",
      resultado: "Alta previsibilidade",
    },
    {
      id: "resultado",
      rotulo: "Resultado",
      texto: "Conectar, antecipar, comunicar",
      resultado: "Gestão contínua",
    },
  ],
  // Cronograma ilustrativo de uma parada (dias). "atraso" = dias que a tarefa escorrega no modelo tradicional.
  tarefas: [
    { nome: "Bloqueio e liberação", inicio: 0, duracao: 2, atraso: 1 },
    { nome: "Desmontagem", inicio: 2, duracao: 4, atraso: 2 },
    { nome: "Troca de componentes", inicio: 5, duracao: 6, atraso: 4 },
    { nome: "Montagem", inicio: 10, duracao: 4, atraso: 6 },
    { nome: "Testes e comissionamento", inicio: 14, duracao: 3, atraso: 8 },
    { nome: "Partida", inicio: 17, duracao: 1, atraso: 9 },
  ],
  diasPlano: 18,
};

export const setores = {
  titulo: "Experiência construída em ambientes industriais complexos e diversificados",
  lista: [
    { id: "siderurgia", nome: "Siderurgia", texto: "Fornos, laminação e sinterização: paradas em que cada hora conta." },
    { id: "mineracao", nome: "Mineração", texto: "Operação contínua, equipamentos de grande porte e frentes simultâneas." },
    { id: "ferroviario", nome: "Ferroviário", texto: "Pátios, terminais e janelas curtas de intervenção." },
    { id: "petroquimico", nome: "Petroquímico", texto: "Plantas de processo com exigências rígidas de segurança." },
    { id: "papel-celulose", nome: "Papel e Celulose", texto: "Linhas contínuas em que a parada geral precisa ser cirúrgica." },
  ],
};

export type Atuacao = {
  id: string;
  titulo: string;
  texto: string;
  entregas: string[];
  fluxoTitulo: string;
  fluxo: { titulo: string; texto: string }[];
  prova?: { texto: string; href: string };
};

export const atuacoes: { titulo: string; texto: string; lista: Atuacao[] } = {
  titulo: "Nossas atuações",
  texto: "Capacidades integradas para conectar planejamento, gestão e execução.",
  lista: [
    {
      id: "projetos",
      titulo: "Planejamento de projetos",
      texto:
        "Criação de cronogramas, análise de caminhos críticos, avanço físico e financeiro, gestão de restrições e contratadas.",
      entregas: ["Cronogramas", "Caminho crítico", "Avanço físico e financeiro", "Gestão de restrições", "Gestão de contratadas"],
      fluxoTitulo: "Jornada da execução",
      fluxo: [
        { titulo: "Entender e estruturar", texto: "Escopo, objetivos, cronograma, responsabilidades e governança." },
        { titulo: "Preparar e mobilizar", texto: "Recursos, materiais, interfaces, riscos, equipe e comunicação." },
        { titulo: "Acompanhar e corrigir", texto: "Campo, produtividade, indicadores, desvios, riscos e mudanças." },
        { titulo: "Encerrar", texto: "Resultados, registros, pendências e lições aprendidas." },
      ],
      prova: { texto: "R$ 520 mi em projetos de capital em andamento", href: "#projetos" },
    },
    {
      id: "paradas",
      titulo: "Planejamento de paradas",
      texto: "Cronograma executivo, mobilização, programação de curto prazo, produtividade e comissionamento.",
      entregas: ["Cronograma executivo", "Mobilização", "Programação de curto prazo", "Produtividade", "Comissionamento"],
      fluxoTitulo: "Ciclo completo de paradas",
      fluxo: [
        {
          titulo: "Planejamento integrado",
          texto: "Coordenação entre manutenção, engenharia, operação, suprimentos, contratadas e comissionamento.",
        },
        {
          titulo: "Preparação",
          texto: "Definição de marcos, plano de ataque, mobilização de recursos e identificação de restrições.",
        },
        { titulo: "Execução", texto: "Acompanhamento diário, turnos estruturados, produtividade e gestão de desvios." },
        { titulo: "Encerramento", texto: "Documentação, resultados, pendências, lições aprendidas e relatório final." },
      ],
      prova: { texto: "Parada entregue antes do prazo previsto", href: "#case-1" },
    },
    {
      id: "materiais",
      titulo: "Gestão de materiais",
      texto: "Recebimento, inspeção, inventário, preservação, rastreabilidade e disponibilidade.",
      entregas: ["Recebimento", "Inspeção", "Inventário", "Preservação", "Rastreabilidade", "Disponibilidade"],
      fluxoTitulo: "Fluxo de controle de materiais",
      fluxo: [
        { titulo: "Planejar", texto: "Relacionar necessidades de materiais ao cronograma executivo do projeto." },
        { titulo: "Receber", texto: "Receber, inspecionar e preservar conforme especificações técnicas." },
        { titulo: "Rastrear", texto: "Monitorar entradas, saídas, localização e status dos materiais." },
        { titulo: "Controlar", texto: "Detectar e gerenciar divergências, perdas e pendências." },
      ],
      prova: { texto: "R$ 6,1 mi capturados para o cliente em 16 meses", href: "#valor" },
    },
    {
      id: "contratos",
      titulo: "Gestão contratual",
      texto: "Equipe dedicada à prevenção de divergências contratuais, pleitos e proteção contratual.",
      entregas: ["Prevenção de divergências", "Pleitos", "Proteção contratual", "RDOs e atas", "Mapeamento de interferências"],
      fluxoTitulo: "Como validamos riscos contratuais",
      fluxo: [
        {
          titulo: "Gestão preventiva de desvios",
          texto: "Escopo, prazo e produtividade monitorados para evitar impactos contratuais.",
        },
        {
          titulo: "Comunicação e decisão",
          texto: "Integração entre cliente, contratadas, planejamento e operação em tempo real.",
        },
        {
          titulo: "Evidências documentais",
          texto: "RDOs, atas, registros fotográficos e mapeamento de interferências.",
        },
        { titulo: "Acompanhamento direto", texto: "Capacitação técnica e preservação de informações críticas." },
      ],
    },
    {
      id: "fiscalizacao",
      titulo: "Fiscalização de campo",
      texto:
        "A equipe de fiscalização da Reforce garante a execução das atividades conforme o planejado, com segurança, qualidade e cumprimento dos prazos.",
      entregas: ["Segurança", "Qualidade", "Cumprimento de prazos", "Rotinas diárias de campo"],
      fluxoTitulo: "Rotinas que levam o plano ao campo",
      fluxo: [
        { titulo: "Pull Planning", texto: "Gestão colaborativa no início da parada para antecipar as entregas críticas." },
        { titulo: "Look Ahead", texto: "Rotinas de antecipação conduzidas conforme a necessidade do projeto." },
        { titulo: "Construtibilidade", texto: "Reuniões de construtibilidade e correção de rota com as equipes." },
        { titulo: "Check-in e check-out", texto: "Rotina diária no campo: o que foi feito, o que trava e o que vem." },
      ],
      prova: { texto: "Veja as rotinas em campo", href: "#campo" },
    },
  ],
};

export const metodo = {
  kicker: "Jornada da execução",
  titulo: "Como entregamos resultados",
  fases: [
    { titulo: "Entender e estruturar", itens: ["escopo", "objetivos", "cronograma", "responsabilidades", "governança"] },
    { titulo: "Preparar e mobilizar", itens: ["recursos", "materiais", "interfaces", "riscos", "equipe e comunicação"] },
    { titulo: "Acompanhar e corrigir", itens: ["campo", "produtividade", "indicadores", "desvios", "riscos e mudanças"] },
    { titulo: "Encerrar", itens: ["resultados", "registros", "pendências", "lições aprendidas"] },
  ],
};

export const tecnologia = {
  kicker: "Tecnologia e gestão visual",
  titulo: "Informação certa, na hora da decisão",
  texto: "Tecnologia e gestão visual aplicadas para ampliar a eficiência, a previsibilidade e a tomada de decisão.",
  paineis: [
    {
      id: "skids",
      rotulo: "Avanço por turno",
      titulo: "Ferramenta própria",
      texto:
        "Desenvolvida por especialistas em planejamento, apoia a nós e aos nossos clientes trazendo as principais informações de forma célere e automática.",
      imagem: "painel-skids-pbt",
      alt: "Painel de avanço da parada SKIDS PBT: previsto acumulado 11,32%, realizado acumulado 11,23% e desvio de -0,09%, com o avanço do turno atual.",
      kpis: [
        { rotulo: "Previsto acumulado", valor: "11,32%" },
        { rotulo: "Realizado acumulado", valor: "11,23%" },
        { rotulo: "Desvio acumulado", valor: "-0,09%", alerta: true },
      ],
    },
    {
      id: "restricoes",
      rotulo: "Restrições críticas",
      titulo: "Dashboard de restrições",
      texto:
        "Agilidade em acompanhar impedimentos do projeto, facilitando ações preventivas para evitar atrasos no cronograma.",
      imagem: "painel-restricoes",
      alt: "Dashboard de restrições da parada de laminação: 121 restrições, 116 concluídas, 5 pendentes e taxa de conclusão de 95,87%.",
      kpis: [
        { rotulo: "Restrições", valor: "121" },
        { rotulo: "Concluídas", valor: "116" },
        { rotulo: "Taxa de conclusão", valor: "95,87%" },
      ],
    },
  ],
};

export const campo = {
  kicker: "Liderança e comunicação com diferentes times",
  titulo: "O plano acontece no campo",
  texto: "Integração entre equipes para alinhar prioridades, antecipar riscos e fortalecer a execução do projeto.",
  fotos: [
    { id: "campo-pull-planning", legenda: "Pull Planning de início de parada: gestão colaborativa para antecipar as entregas críticas." },
    { id: "campo-look-ahead", legenda: "Condução das rotinas de Look Ahead, conforme a necessidade do projeto." },
    { id: "campo-check-in-out", legenda: "Rotina diária de check-in e check-out." },
    { id: "campo-construtibilidade", legenda: "Reuniões de construtibilidade e correção de rota." },
    { id: "campo-check-diario-sinterizacao", legenda: "Check diário da parada geral da Sinterização." },
    { id: "campo-equipe-pull-planning", legenda: "Equipes integradas no Pull Planning da parada." },
  ],
};

export const cases = {
  kicker: "Cases",
  titulo: "Resultados documentados",
  lista: [
    {
      id: "case-1",
      numero: "01",
      titulo: "Gestão integrada da parada",
      contexto: "Troca dos skids móveis do forno de reaquecimento LPBT",
      destaque: "Parada entregue para a operação antes do prazo previsto.",
      metricas: [
        { valor: 65, sufixo: "+", rotulo: "impactos identificados" },
        { valor: 40, sufixo: "+", rotulo: "lições aprendidas identificadas" },
        { valor: 120, sufixo: "+", rotulo: "restrições mapeadas, acompanhadas e resolvidas" },
        { valor: 60, sufixo: "+", rotulo: "relatórios de acompanhamento emitidos" },
        { valor: 1080, sufixo: "+", rotulo: "horas-homem de acompanhamento de campo" },
      ],
      registro:
        "A Reforce atuou de forma enérgica, tanto com planejamento estratégico quanto no tático, dando todo suporte ao cliente no acompanhamento, tratamento de dados, apoio à tomada de decisões e previsibilidade.",
    },
    {
      id: "case-2",
      numero: "02",
      titulo: "Gestão de materiais MS1 · 2025",
      contexto:
        "Inventários, conferência dos recebimentos e validação técnica de materiais de acordo com cada projeto, aumentando a rastreabilidade e identificando divergências críticas entre documentação e realidade de campo.",
      destaque: "R$ 3,5 mi em valor identificado.",
      itens: [
        { valor: "R$ 1,7 mi", texto: "de valor identificado em divergências (valor capturado da montadora)" },
        {
          valor: "R$ 1,5 mi",
          texto: "de valor estimado em materiais faltantes (comprados e recebidos antes da implantação)",
        },
        {
          valor: "R$ 270 mil",
          texto: "em divergências de cabos elétricos, sendo 12 mil metros (capturado da montadora)",
        },
      ],
    },
    {
      id: "case-3",
      numero: "03",
      titulo: "Gestão de materiais Pátios · 2026",
      contexto:
        "Inventário dos materiais dos projetos Blendagem e Drenagem, garantindo a confiabilidade das informações e a aprovação jurídica para o processo de distrato da empresa contratada.",
      destaque: "Materiais validados e divergências identificadas.",
      itens: [
        { valor: "11.775 itens", texto: "conferidos fisicamente em 14 dias de inventário" },
        { valor: "R$ 2,6 mi", texto: "de valor identificado em divergências (valor capturado da montadora)" },
        { valor: "Retomada", texto: "condução do repasse dos materiais para a nova montadora, retomando a implantação" },
      ],
    },
  ],
  valor: {
    titulo: "Valor capturado para o cliente Gerdau",
    periodo: "Últimos 16 meses · casos documentados de sucesso na gestão de materiais",
    partes: [
      { rotulo: "Case 2 · Gestão de materiais", valor: 3.5 },
      { rotulo: "Case 3 · Avaliação de inventário", valor: 2.6 },
    ],
    total: 6.1,
  },
  projetos: {
    titulo: "Principais projetos em andamento",
    texto: "Onde a Reforce está atuando no cliente Gerdau.",
    lista: [
      {
        nome: "Blendagem",
        valor: 380,
        itens: [
          "Planejamento estratégico",
          "Rotinas de LPS",
          "Análise e controle de RDOs",
          "Gestão de materiais",
          "Comissionamento",
        ],
      },
      {
        nome: "AGF",
        valor: 85,
        itens: [
          "Construtibilidade",
          "Planejamento estratégico",
          "Rotinas de LPS",
          "Rotina de paradas operacionais",
          "Aquisição e controle de materiais",
        ],
      },
      {
        nome: "Drenagem",
        valor: 55,
        itens: ["Planejamento estratégico", "Rotinas de LPS", "Análise e controle de RDOs", "Comissionamento"],
      },
    ],
  },
};

export const presenca = {
  kicker: "Presença nacional",
  titulo: "Mobilização em todo o território nacional",
  texto: "Capacidade de mobilização em todo o território nacional para atender as demandas dos clientes.",
  estados: [
    { uf: "rs", nome: "Rio Grande do Sul" },
    { uf: "sp", nome: "São Paulo" },
    { uf: "rj", nome: "Rio de Janeiro" },
    { uf: "mg", nome: "Minas Gerais" },
    { uf: "am", nome: "Amazonas" },
  ],
};

export const diferenciais = {
  kicker: "Por que contratar a Reforce?",
  titulo: "Liderança próxima às decisões críticas",
  lista: [
    { titulo: "Flexibilidade de escopo", texto: "Adaptamos o planejamento às mudanças sem perder os objetivos principais." },
    { titulo: "Mobilização rápida", texto: "Equipes e recursos disponíveis para fases críticas e aceleração de entregas." },
    { titulo: "Colaboração integrada", texto: "Cliente, contratadas, operação, engenharia, suprimentos e campo." },
    {
      titulo: "Capacitação e liderança ativa",
      texto: "Transferência de conhecimento e participação nas decisões críticas.",
    },
  ],
};

export const lideranca = [
  {
    id: "equipe-elias-mota",
    nome: "Elias Mota",
    cargo: "Diretor Comercial",
    anos: 12,
    bio: "Mais de 12 anos de experiência em planejamento de projetos. Atua na gestão estratégica de contratos, liderança e desenvolvimento de novos negócios, com foco no relacionamento com clientes e na geração de resultados sustentáveis.",
  },
  {
    id: "equipe-daniel-negrao",
    nome: "Daniel Negrão",
    cargo: "Gerente Especialista",
    anos: 20,
    bio: "Mais de 20 anos de experiência em planejamento e gestão de projetos industriais, no Brasil e no exterior, com foco em projetos de capital, engenharia, paradas de manutenção, eficiência e integração de projetos.",
  },
  {
    id: "equipe-marcus-lopes",
    nome: "Marcus Lopes",
    cargo: "Gerente de Contratos",
    anos: 15,
    bio: "Mais de 15 anos de experiência em gestão de obras, projetos, contratos e operações industriais, com foco em liderança de equipes multidisciplinares, projetos CAPEX, produtividade, segurança e resultados.",
  },
];

export const equipe = [
  { id: "equipe-carieli-korthais", nome: "Carieli Korthais", area: "administrativo", cargo: "Consultor Administrativo" },
  { id: "equipe-thiago-mota", nome: "Thiago Mota", area: "planejamento", cargo: "Consultor de Planejamento" },
  { id: "equipe-danyell-marques", nome: "Danyell Marques", area: "planejamento", cargo: "Consultor de Planejamento" },
  { id: "equipe-luis-machado", nome: "Luís Machado", area: "planejamento", cargo: "Consultor de Planejamento" },
  { id: "equipe-hugo-castro", nome: "Hugo Castro", area: "planejamento", cargo: "Consultor de Planejamento" },
  { id: "equipe-lucas-santos", nome: "Lucas Santos", area: "planejamento", cargo: "Consultor de Planejamento" },
  { id: "equipe-alessandro-meneleu", nome: "Alessandro Meneleu", area: "planejamento", cargo: "Consultor de Planejamento" },
  { id: "equipe-gustavo-miranda", nome: "Gustavo Miranda", area: "planejamento", cargo: "Consultor de Planejamento" },
  { id: "equipe-everson-gabriel", nome: "Everson Gabriel", area: "materiais", cargo: "Consultor de Materiais" },
  { id: "equipe-carlos-luz", nome: "Carlos Luz", area: "materiais", cargo: "Consultor de Materiais" },
  { id: "equipe-mauro-vieira", nome: "Mauro Vieira", area: "materiais", cargo: "Consultor de Materiais" },
  { id: "equipe-edson-menezes", nome: "Edson Menezes", area: "materiais", cargo: "Consultor de Materiais" },
] as const;

export const areasEquipe = [
  { id: "todos", rotulo: "Todos" },
  { id: "planejamento", rotulo: "Planejamento" },
  { id: "materiais", rotulo: "Materiais" },
  { id: "administrativo", rotulo: "Administrativo" },
];

export const valores = {
  titulo: "Nossos valores",
  texto: "Princípios sólidos orientam cada decisão, cada projeto e cada relação.",
  lista: [
    { titulo: "Integridade física e mental", texto: "Priorizar a segurança, o cuidado e o bem-estar das pessoas." },
    { titulo: "Ética", texto: "Conduzir ações com integridade e respeito, promovendo transparência e confiança." },
    { titulo: "Responsabilidade técnica", texto: "Aplicar conhecimento, rigor e profissionalismo em cada contrato." },
    { titulo: "Foco em resultados", texto: "Trabalhar com dedicação e visão de longo prazo para gerar valor real." },
    { titulo: "Disciplina", texto: "Transformar planejamentos em execução e compromisso em resultados consistentes." },
  ],
};

export const contato = {
  kicker: "Vamos conversar",
  titulo: "Mais previsibilidade começa com um plano.",
  texto: "Experiência, método e presença para executar projetos complexos. Conte o seu desafio: a mensagem sai pronta para o nosso time comercial.",
  demandas: [
    "Planejamento de projeto",
    "Parada de manutenção",
    "Gestão de materiais",
    "Gestão contratual",
    "Fiscalização de campo",
  ],
  segmentos: ["Siderurgia", "Mineração", "Ferroviário", "Petroquímico", "Papel e Celulose", "Outro segmento"],
  momentos: ["Ainda no planejamento", "Em mobilização", "Em execução", "Em encerramento"],
};
