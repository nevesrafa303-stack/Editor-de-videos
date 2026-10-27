// Todo o texto da página fica aqui. Junta skillsales.com.br e hermanodotrafego.com.br; quando os dois
// divergem, vale o skillsales (versão mais nova). Itens marcados com "CONFIRMAR" dependem do cliente.

export const marca = {
  nome: "Mentoria RISE",
  mentor: "Leonardo Fernandes, o Hermano",
  // CONFIRMAR: empresa responsável pelos dados (razão social e CNPJ) e e-mail para pedidos de titulares (LGPD).
  razaoSocial: "",
  cnpj: "",
  email: "",
} as const;

export const nav = [
  { href: "#metodo", label: "Método" },
  { href: "#entregas", label: "Entregas" },
  { href: "#resultados", label: "Resultados" },
  { href: "#hermano", label: "Hermano" },
] as const;

export const cta = "Aplicar para uma vaga";

export const hero = {
  selo: "Exclusivo para donos de agência que faturam acima de R$ 30 mil/mês",
  // A parte em `destaque` vai no degradê dourado.
  titulo: ["É hora de", "dominar a operação", "da sua agência."],
  destaque: "dominar a operação",
  subtitulo:
    "A RISE é a mentoria de aceleração para donos de agência que não querem largar a operação: querem controlá-la. O método que ajudou mais de 500 agências a romper os R$ 30 mil por mês e escalar para mais de R$ 2 milhões por ano.",
  secundario: "Ver resultados",
  // Os bastidores da LAKS, a agência do Hermano.
  provas: [
    { valor: "350+", rotulo: "clientes ativos na LAKS" },
    { valor: "R$ 1 mi", rotulo: "de faturamento por mês" },
    { valor: "500+", rotulo: "agências mentoradas" },
  ],
} as const;

export const faixa = [
  ["Escala", "Estrutura", "Implementação"],
  ["Modelo de negócio", "Comercial", "Operação", "Liderança"],
] as const;

export const problema = {
  titulo: "Você já tem cliente…",
  subtitulo: "Mas ainda não tem um modelo de negócio que escala.",
  texto:
    "O problema não é falta de tráfego. Nem falta de esforço. Na maioria dos casos, o crescimento trava porque existe um gargalo escondido na operação:",
  gargalos: [
    "Uma oferta fraca para vender tickets maiores",
    "Um comercial que depende do dono para fechar",
    "Um sistema inconsistente de geração de demanda",
    "Uma operação que cresce em faturamento, mas não em lucro",
  ],
  fecho: "Sem isso, você cresce no esforço. Não na estratégia.",
  virada: "Enquanto muitos falam em “sair do operacional”, você vai aprender a estruturar:",
  estrutura: ["Um modelo que gera demanda", "Um comercial que fecha", "Uma máquina que coloca cliente novo todo mês"],
} as const;

export const manifesto = {
  nao: "A RISE não é",
  fuga: "fuga.",
  e: "É",
  metodo: "método.",
  texto:
    "É onde você aprende a crescer como empresário sem abandonar o que faz a agência funcionar: o chão da operação.",
} as const;

export const paraQuem = {
  titulo: "Para quem é a RISE",
  sim: {
    titulo: "A RISE é pra você se…",
    instrucao: "Toque nos itens que valem para a sua agência hoje.",
    // Resposta do autodiagnóstico conforme a quantidade de itens marcados: 0, 1–2, 3–5, 6 ou mais.
    respostas: [
      "Marque os itens para ver o seu resultado.",
      "Já existem sinais de que a operação está segurando o crescimento.",
      "Você tem o perfil da RISE: a agência já vende e precisa de estrutura para escalar.",
      "A RISE foi feita para o momento da sua agência.",
    ],
    itens: [
      "Sua agência já vende, mas cresce sem previsibilidade.",
      "Você virou o gargalo: a agência depende 100% de você para funcionar.",
      "Já tentou montar equipe, mas o time não roda sem você em cima.",
      "Seu pré-venda não agenda o suficiente e o closer não fecha como deveria.",
      "O faturamento oscila e a margem aperta.",
      "Quer sair do “pacotão de serviços” e se posicionar como agência de performance.",
      "Quer estruturar vendas, operação e liderança, com squads enxutos e foco em resultado.",
      "Está pronto para ser líder de operação, e não só mais um executor apagando incêndio.",
    ],
  },
  nao: {
    titulo: "E não é pra você se…",
    itens: [
      "Está começando do zero ou ainda não vende serviços.",
      "Procura “mais leads” sem estruturar a operação.",
      "Acredita que vai escalar delegando tudo e saindo da operação.",
      "Busca uma fórmula mágica ou uma mentoria motivacional.",
      "Não quer mudar processos, decisões e postura como dono.",
    ],
  },
} as const;

export const estrutura = {
  // Frase grande: a primeira parte apaga e a segunda acende com a rolagem.
  antes: "As agências não travam por falta de lead.",
  depois: "Elas travam por falta de estrutura.",
  intro: "Sem processo claro:",
  sintomas: [
    "Cada venda é um esforço novo",
    "O comercial não é replicável",
    "A operação vira incêndio diário",
    "O dono trabalha mais conforme a agência cresce",
  ],
  fecho: "A RISE existe para corrigir isso na raiz.",
} as const;

export const entregas = {
  titulo: "O que você recebe como mentorado",
  itens: [
    {
      icone: "diagnostico",
      titulo: "Diagnóstico profundo da sua operação",
      texto: "Pra identificar o que está travando sua escala hoje e onde está vazando dinheiro, tempo e energia.",
    },
    {
      icone: "plano",
      titulo: "Plano de estruturação comercial",
      texto: "Pra organizar captação, pré-venda, fechamento e garantir previsibilidade nas entradas da agência.",
    },
    {
      icone: "squads",
      titulo: "Formação de squads e liderança",
      texto: "Pra tirar o peso das suas costas e montar um time que executa com qualidade, mesmo com você por perto.",
    },
    {
      icone: "acompanhamento",
      titulo: "Acompanhamento direto com o Hermano e time de estrategistas",
      texto: "Nada de teoria. Só processo validado e executável, testado em agências que já faturam.",
    },
  ],
} as const;

export const metodo = {
  titulo: "A RISE é uma mentoria anual, com foco em:",
  focos: ["Modelo de negócio lucrativo", "Comercial que converte", "Operacional que entrega", "Dono que lidera"],
  frase: "Você não aprende “o que fazer”. Você estrutura e aplica, com acompanhamento estratégico.",
  pilaresTitulo: "Trabalhamos em cima de três pilares",
  pilares: [
    { icone: "posicionamento", titulo: "Modelo de negócio e posicionamento" },
    { icone: "comercial", titulo: "Processo comercial e previsibilidade de vendas" },
    { icone: "operacao", titulo: "Organização da operação e liderança do time" },
  ],
  laks: "Você vai aprender a gerir pessoas, processos e vendas com a mesma estrutura que sustenta a LAKS Company.",
} as const;

// Valores em milhares de reais (MRR) tirados dos prints da #PlacaRISE (grupo Networking RISE, out/2025).
export const placas = {
  titulo: "Resultados de quem aplicou",
  intro: "Prints do grupo de mentorados, postados pelos próprios donos de agência na #PlacaRISE.",
  resumo: "de faturamento mensal recorrente (MRR) das 6 agências somado, antes e depois da RISE.",
  itens: [
    { agencia: "LURE Digital", pessoa: "Samuel", antes: 50, depois: 300, imagem: "placa-lure-digital" },
    { agencia: "LVX Digital", pessoa: "Lucas", antes: 48, depois: 220, imagem: "placa-lvx-digital" },
    { agencia: "Suntech Mídia", pessoa: "Gabriel Ribeiro", antes: 30, depois: 120, imagem: "placa-suntech-midia" },
    { agencia: "Whale Marketing & Vendas", pessoa: "", antes: 24, depois: 65, imagem: "placa-whale-marketing" },
    { agencia: "Marketproads", pessoa: "Vitor Hugo", antes: 30, depois: 70, imagem: "placa-vitor-hugo-marketproads" },
    { agencia: "G2V Company", pessoa: "Gabriel e Gabi", antes: 18, depois: 40, imagem: "placa-g2v-company" },
  ],
} as const;

export const depoimentos = {
  titulo: "Quem recebeu a placa, conta.",
  intro: "Depoimentos gravados no evento da RISE, com a placa de faturamento na mão.",
  destaques: [
    { valor: "R$ 17 mil → R$ 150 mil", texto: "R$ 50 mil já nos 3 primeiros meses de mentoria" },
    { valor: "R$ 7 mil → R$ 50 mil", texto: "de gestor autônomo a assessoria de tráfego" },
    { valor: "R$ 45 mil → R$ 100 mil", texto: "em quase um ano de mentoria" },
  ],
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
      citacao:
        "Eu entrei faturando 7 mil e agora a gente está faturando uma média de 50 mil por mês. O Hermano é skin in the game.",
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

export const dominar = {
  titulo: ["Você não precisa sair do operacional.", "Você precisa dominar a operação."],
  texto: [
    "A maioria busca fórmulas que prometem liberdade total. O que o Hermano construiu, e o que a RISE ensina, é que a liberdade só vem quando você entende o jogo melhor do que todo mundo.",
    "Isso não é sobre delegar tudo. É sobre liderar com processo, com método, com clareza.",
  ],
} as const;

export const hermano = {
  nome: "Leonardo Fernandes,",
  apelido: "o Hermano.",
  // Trajetória contada na primeira pessoa, como no site atual (linha do tempo da seção).
  trajetoria: [
    {
      marco: "2019",
      texto:
        "Lancei minha primeira agência e tive que aprender a escalar do zero: noites sem dormir, processos falhos e clientes que não renovaram.",
    },
    { marco: "R$ 5 milhões", texto: "Depois de criar um sistema replicável, bati 5 milhões com a minha operação de tráfego." },
    { marco: "LAKS Company", texto: "Hoje sou diretor da LAKS, minha agência com mais de 350 clientes ativos." },
    {
      marco: "Hermano Soluções Digitais",
      texto: "Minha empresa de educação, com mais de 1.000 alunos. Já ajudei mais de 500 agências a baterem mais de 1 milhão ao ano.",
    },
    { marco: "RISE", texto: "Compartilho os exatos processos que transformaram minhas operações e podem transformar a sua também." },
  ],
  numeros: [
    { prefixo: "R$ ", valor: 5, unidade: " mi", rotulo: "com a operação de tráfego" },
    { prefixo: "", valor: 500, unidade: "+", rotulo: "agências ajudadas" },
    { prefixo: "", valor: 350, unidade: "+", rotulo: "clientes ativos na LAKS" },
    { prefixo: "", valor: 1000, unidade: "+", rotulo: "alunos na Hermano Soluções Digitais" },
  ],
} as const;

export const final = {
  titulo: "Se você está pronto para ser dono de uma operação previsível e lucrativa,",
  destaque: "a RISE é o próximo passo.",
  texto: "A aplicação é o primeiro passo para entrar na RISE.",
} as const;
