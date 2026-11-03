// Todo o texto da página fica aqui, tirado de clubedasagencias.com.br. Itens marcados com "CONFIRMAR"
// dependem do cliente.

// CONFIRMAR: dados da próxima edição. As datas abaixo são as do site atual (25 e 26/09/2026), que já passaram.
export const evento = {
  nome: "Imersão Clube das Agências",
  sigla: "CDA",
  cidade: "Balneário Camboriú–SC",
  local: "Riviera Business & Mall",
  datas: "25 e 26 de setembro de 2026",
  datasCurtas: "25 e 26 set",
  inicio: "2026-09-25T09:00:00-03:00",
  fim: "2026-09-26T18:00:00-03:00",
  horario: "Das 9h às 18h",
  credenciamento: "A partir das 8h30",
  vagas: 50,
  // Porcentagem de ingressos vendidos mostrada na barra (o site atual mostra 86%).
  vendidos: 86,
  whatsapp: "5547933003856",
  mapa: "https://www.google.com/maps/search/?api=1&query=Riviera+Business+%26+Mall+Balne%C3%A1rio+Cambori%C3%BA",
} as const;

export const nav = [
  { href: "#pilares", label: "Programação" },
  { href: "#ingressos", label: "Ingressos" },
  { href: "#mentores", label: "Mentores" },
  { href: "#faq", label: "Dúvidas" },
] as const;

export const cta = "Garantir meu ingresso";

export const hero = {
  selo: "Exclusivo para donos de agência que faturam acima de R$ 30 mil/mês",
  // A parte em `destaque` vai no degradê da marca.
  titulo: "Domine os 5 pilares que sustentam uma agência de",
  destaque: "R$ 15 milhões",
  complemento: "com +350 clientes ativos e churn abaixo de 10%.",
  subtitulo:
    "2 dias de imersão presencial para entrar nos bastidores de uma operação real e construir uma agência que fatura acima de R$ 500 mil por mês.",
  video: "Veja como foi a última edição",
} as const;

// Faixa que corre com a rolagem logo depois da abertura.
export const faixa = [
  ["2 dias presenciais", "50 vagas", "Balneário Camboriú", "Bastidores da LAKS"],
  ["Aquisição", "Comercial", "Operação", "Gestão", "Cultura"],
] as const;

export const numeros = {
  titulo: "Uma operação real, aberta para você",
  itens: [
    { prefixo: "R$ ", valor: 15, unidade: " mi", rotulo: "de faturamento na agência que você vai ver por dentro" },
    { prefixo: "", valor: 350, unidade: "+", rotulo: "clientes ativos ao mesmo tempo" },
    { prefixo: "<", valor: 10, unidade: "%", rotulo: "de churn, com processo e não com sorte" },
    { prefixo: "", valor: evento.vagas, unidade: "", rotulo: "vagas, para o conteúdo ser aplicado de verdade" },
  ],
} as const;

export const pilares = {
  titulo: "O que você vai dominar no Clube das Agências",
  intro: "Aquisição, comercial, operação, gestão e cultura: os pilares de uma agência que escala, na prática.",
  itens: [
    {
      nome: "Aquisição",
      titulo: "Como construir demanda previsível sem depender de indicação",
      texto:
        "Entenda como posicionamento, oferta, aquisição e previsibilidade trabalham juntos para transformar uma agência comum em uma operação que escala.",
    },
    {
      nome: "Comercial",
      titulo: "Como montar um time que vende sem depender do dono",
      texto:
        "Aprenda como construir um comercial capaz de vender todos os dias, aumentar ticket médio, elevar margens e reduzir a dependência do dono nas vendas.",
    },
    {
      nome: "Operação",
      titulo: "O processo que sustenta +350 clientes ativos com churn abaixo de 10%",
      texto: "Tenha acesso ao exato processo operacional que usamos para gerenciar mais de 350 clientes ativos, com churn inferior a 10%.",
    },
    {
      nome: "Gestão",
      titulo: "Os números que mostram para onde a agência está indo",
      texto: "DRE, margem por cliente e metas por área que cada um acompanha de perto.",
    },
    {
      nome: "Cultura",
      titulo: "Como fazer o time ter sede pelo resultado junto com você",
      texto: "Time que enxerga o número e tem metas claras começa a se importar como dono.",
    },
  ],
} as const;

export const paraQuem = {
  titulo: "Essa imersão é para você que quer fazer sua agência vender todos os dias com time, método e escala",
  intro:
    "Para donos de agência e gestores de tráfego que já sabem entregar, mas querem acelerar a aquisição de clientes, montar time comercial e escalar para múltiplos 6 dígitos.",
  itens: [
    "Tem dificuldade em gerar clientes novos de forma previsível",
    "Depende demais do dono para vender e fechar contratos",
    "Não tem um processo claro de vendas nem time comercial rodando",
    "Quer sair do “freela premium” e construir uma agência que cresce rápido",
    "Quer aprender os bastidores reais de quem faz 200k, 300k, 500k por mês com agência",
  ],
  instrucao: "Ligue o que acontece hoje na sua agência.",
  // Resposta conforme a quantidade de chaves ligadas: 0, 1–2, 3–4, 5.
  respostas: [
    "Ligue as chaves para ver se a imersão é para você.",
    "Já tem sinal de que a operação está segurando o crescimento.",
    "A imersão foi feita para o momento da sua agência.",
    "Você é exatamente quem a gente quer na sala.",
  ],
  resumo:
    "Essa imersão é para quem quer fazer a agência crescer rápido, com aquisição previsível, vendas recorrentes e um time que sustenta a escala, e não apenas “ter tudo organizado”.",
  cta: "Quero escalar minha agência",
} as const;

export const galeria = {
  titulo: "Por dentro da última edição",
  intro: "Dois dias de conteúdo, networking e bastidores. Arraste para ver.",
  // Quadros do vídeo da última edição (originais em sites/_fontes/clube/videos).
  itens: [
    { img: "praia", legenda: "Balneário Camboriú, a cidade da imersão", formato: "largo" },
    { img: "hermano-palco", legenda: "Hermano no palco", formato: "alto" },
    { img: "caderno", legenda: "O kit do CDA", formato: "largo" },
    { img: "networking", legenda: "Networking entre donos de agência", formato: "alto" },
    { img: "palco", legenda: "Conteúdo direto do palco", formato: "largo" },
    { img: "coffee", legenda: "Coffee break nos dois dias", formato: "alto" },
    { img: "placa", legenda: "As placas de faturamento", formato: "alto" },
    { img: "mentorados-placas", legenda: "Mentorados no palco com as placas", formato: "largo" },
    { img: "plateia", legenda: "A sala cheia na última edição", formato: "largo" },
  ],
} as const;

export const informacoes = {
  titulo: "O que você precisa saber",
  campos: [
    { rotulo: "Data", valor: evento.datas },
    { rotulo: "Horário", valor: evento.horario },
    { rotulo: "Credenciamento", valor: evento.credenciamento },
    { rotulo: "Local", valor: `${evento.local}, ${evento.cidade}` },
    { rotulo: "Para quem", valor: "Donos de agência que querem romper os 6 dígitos de faturamento mensal" },
  ],
} as const;

export const depoimentos = {
  titulo: "Dezenas de agências já escalaram com o método",
  intro: "Donos de agência que passaram pela RISE, a mentoria do Hermano, contam com a placa de faturamento na mão.",
  destaques: [
    { valor: "R$ 17 mil → R$ 150 mil", texto: "R$ 50 mil já nos 3 primeiros meses" },
    { valor: "R$ 7 mil → R$ 50 mil", texto: "de gestor autônomo a assessoria de tráfego" },
    { valor: "R$ 45 mil → R$ 100 mil", texto: "em quase um ano de mentoria" },
  ],
  // Os mesmos vídeos da RISE (pedido do cliente).
  videos: [
    {
      id: "placa-150k-processo",
      // CONFIRMAR: nome e agência de quem fala.
      nome: "Placa 150K",
      empresa: "Mentorado RISE desde 2023",
      citacao:
        "Em três meses de mentoria a gente saiu de 17 para 50. Hoje, um ano e três meses depois, estamos batendo 150k de faturamento.",
      duracao: "1:36",
    },
    {
      id: "placa-150k-captacao",
      // CONFIRMAR: nomes e agência dos sócios.
      nome: "Placa 150K",
      empresa: "Sócios, mentorados desde 2023",
      citacao:
        "A gente faturava perto de 20 e poucos mil por mês. Hoje está faturando 150. O nosso primeiro funil validado foi o que a gente aprendeu dentro da RISE.",
      duracao: "1:08",
    },
    {
      id: "placa-50k-rafael",
      // CONFIRMAR: sobrenome e nome da assessoria.
      nome: "Rafael",
      empresa: "Assessoria de tráfego pago",
      citacao: "Eu entrei faturando 7 mil e agora a gente está faturando uma média de 50 mil por mês. O Hermano é skin in the game.",
      duracao: "0:47",
    },
    {
      id: "placa-100k-direcionamento",
      // CONFIRMAR: nomes e agência dos sócios.
      nome: "Placa 100K",
      empresa: "Sócios, quase 1 ano de mentoria",
      citacao:
        "Faltava um direcionamento cirúrgico do que tinha que ser feito. O Hermano mostra a verdade da vida do dono de agência e que é possível sim ganhar muita grana.",
      duracao: "1:21",
    },
  ],
} as const;

const beneficios = [
  "2 dias completos de imersão",
  "Kit do CDA",
  "Coffee break (2 dias de evento)",
  "Networking com outros donos de agência que já estão no jogo",
  "Frameworks e materiais complementares",
  "Área exclusiva durante o evento com café premium",
  "Jantar com os fundadores da LAKS no dia 24/09",
  "Visita ao escritório da LAKS",
] as const;

const mensagem = (ingresso: string) =>
  `https://wa.me/${evento.whatsapp}?text=${encodeURIComponent(`Olá, quero garantir o INGRESSO ${ingresso} do Clube das Agências.`)}`;

// CONFIRMAR: preços, parcelas e disponibilidade. No site atual o Diamond aparece como esgotado.
export const ingressos = {
  titulo: "Garanta já seu ingresso",
  aviso: "Últimas vagas",
  itens: [
    {
      nome: "Black",
      de: "R$ 2.497",
      parcelas: "12x R$ 106,14",
      pix: "R$ 1.097",
      inclui: 5,
      esgotado: false,
      link: mensagem("BLACK"),
    },
    {
      nome: "Diamond",
      de: "R$ 6.997",
      parcelas: "12x R$ 386,11",
      pix: "R$ 3.997",
      inclui: 8,
      esgotado: true,
      link: mensagem("DIAMOND"),
    },
  ],
  beneficios,
} as const;

export const mentores = {
  titulo: "Seus mentores nos dias da imersão",
  itens: [
    {
      id: "hermano",
      nome: "Leonardo Fernandes",
      apelido: "Hermano",
      instagram: "eu.hermano",
      tema: "Modelo de negócio, gestão e liderança",
      bio: [
        "Mentor, estrategista e criador da metodologia RISE, que ajudou centenas de agências a escalarem seus negócios.",
        "Com uma carreira focada em resultados previsíveis e sustentáveis, desenvolveu playbooks e estratégias que impulsionam agências para faturamentos acima de R$ 500 mil mensais.",
      ],
    },
    {
      id: "saimon",
      nome: "Saimon Oliveira",
      apelido: "",
      instagram: "saimoonoliveira",
      tema: "Gestão operacional e eficiência",
      bio: [
        "Responsável por liderar um time com mais de 50 pessoas e construir a jornada de sucesso de mais de 300 projetos ativos.",
        "Vai te mostrar como montar uma equipe de sucesso e transformar sua operação em uma máquina de receita.",
      ],
    },
    {
      id: "gabriel",
      nome: "Gabriel Dias",
      apelido: "",
      instagram: "gabrieudiaz",
      tema: "Comercial e crescimento",
      bio: [
        "Lidera a frente comercial da LAKS e é especialista em estruturação e escala de times inside sales. Foi um dos responsáveis por elevar a receita mensal da LAKS de R$ 70 mil para mais de R$ 500 mil em menos de 10 meses.",
        "Vai te mostrar como construir um processo comercial eficiente e capaz de triplicar a receita da sua agência nos próximos 3 meses.",
      ],
    },
  ],
} as const;

export const faq = {
  titulo: "Perguntas frequentes",
  itens: [
    {
      pergunta: "Este evento é para mim?",
      resposta: "Este evento é para gestores de tráfego ou donos de agência que desejam escalar para além de R$ 500 mil por mês.",
    },
    {
      pergunta: "Preciso ter uma agência grande?",
      // CONFIRMAR: o topo do site fala em R$ 30 mil/mês; esta resposta, em R$ 20 mil/mês.
      resposta: "Este evento é indicado para agências com faturamento recorrente acima de R$ 20 mil por mês.",
    },
    {
      pergunta: "O evento é presencial?",
      resposta: `Sim, será realizado em Balneário Camboriú nos dias ${evento.datas.replace(" de 2026", "")}. O endereço exato será enviado após sua inscrição.`,
    },
    {
      pergunta: "Quantas vagas estão disponíveis?",
      resposta: `São apenas ${evento.vagas} vagas, para garantir um aprendizado exclusivo e de alta qualidade.`,
    },
  ],
  suporte: {
    titulo: "Ainda com dúvidas?",
    texto: "Se não encontrou a resposta que precisava, fale com o nosso suporte pelo WhatsApp.",
    botao: "Chamar suporte",
    link: `https://wa.me/${evento.whatsapp}?text=${encodeURIComponent("Olá! Preciso de mais informações sobre a Imersão Clube das Agências.")}`,
  },
} as const;

export const final = {
  titulo: "Hora de agir",
  texto:
    "Chegou o momento de transformar sua agência e se posicionar como líder no mercado. Não perca a oportunidade de implementar estratégias comprovadas e gerar resultados previsíveis.",
  cta: "Quero escalar minha agência",
} as const;
