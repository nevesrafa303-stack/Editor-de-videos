// Todo o texto da página fica aqui. Itens marcados com "CONFIRMAR" dependem do cliente.

export const empresa = {
  nome: "LAKS Company",
  cnpj: "39.401.879/0001-19",
  cidade: "Balneário Camboriú",
  uf: "SC",
  horario: "Segunda a sexta, das 9h às 18h",
  // CONFIRMAR: e-mail para contato e para pedidos de titulares (LGPD). Enquanto vazio, a
  // política de privacidade aponta para o Instagram.
  email: "",
  redes: [
    { nome: "Instagram", url: "https://www.instagram.com/lakscompany/" },
    { nome: "LinkedIn", url: "https://www.linkedin.com/company/lakscompany/" },
    { nome: "YouTube", url: "https://www.youtube.com/@lakscompany" },
    { nome: "TikTok", url: "https://www.tiktok.com/@lakscompany" },
  ],
} as const;

export const nav = [
  { href: "#comofunciona", label: "Método" },
  { href: "#casesdesucesso", label: "Cases" },
  { href: "#quemsomos", label: "Quem somos" },
] as const;

export const hero = {
  // A palavra em `destaque` vai em laranja.
  titulo: ["Aumentamos o", "faturamento da", "sua corretora."],
  destaque: "faturamento",
  subtitulo:
    "A #1 aceleradora de marketing e vendas de planos de saúde. Leads qualificados, anúncios que convertem e um processo comercial que fecha.",
  ctaPrincipal: "Quero meu diagnóstico gratuito",
  ctaSecundario: "Ver resultados",
} as const;

// Algarismo grande, prefixo e unidade em corpo menor (fica legível em duas colunas no celular).
export const numeros = {
  titulo: "Números de",
  destaque: "camisa 10.",
  itens: [
    { prefixo: "", valor: 400, unidade: "+", rotulo: "corretoras ativas" },
    { prefixo: "R$", valor: 50, unidade: "mi+", rotulo: "investidos em anúncios" },
    { prefixo: "", valor: 70, unidade: "mil+", rotulo: "leads por mês para clientes" },
    { prefixo: "", valor: 70, unidade: "+", rotulo: "especialistas no time" },
  ],
} as const;

// Cena "o jogo": cada dor é um gol contra no placar; no fim a tela vira e a LAKS vira o jogo.
export const manifesto = {
  titulo: "O jogo que a sua corretora está perdendo",
  placar: { casa: "Sua corretora", fora: "O mercado", placarVirada: 7 },
  lances: [
    { minuto: "08'", texto: "Lead caro." },
    { minuto: "21'", texto: "Lead frio." },
    { minuto: "34'", texto: "Contato da cidade errada." },
    { minuto: "52'", texto: "Curioso sem perfil." },
    { minuto: "67'", texto: "Cotação que nunca vira contrato." },
    { minuto: "88'", texto: "E o dono fazendo marketing no intervalo entre uma reunião e outra." },
  ],
  virada: "A LAKS existe para virar esse jogo.",
  viradaLink: "Veja como no Método MAPA",
} as const;

// Faixa de texto grande que corre com a rolagem, entre o manifesto e o método.
export const faixa = [
  ["Leads qualificados", "Anúncios que convertem", "Time comercial que fecha"],
  ["Planos de saúde", "Seguros", "PME", "Adesão", "Individual", "Empresarial"],
] as const;

export const mapa = {
  titulo: "Método MAPA",
  intro:
    "Método proprietário para construir um canal previsível de aquisição de clientes no digital, feito exclusivamente para corretoras de seguros e planos de saúde.",
  passos: [
    {
      letra: "M",
      nome: "Matriz ideal de clientes",
      texto:
        "Mapeamos quem é o cliente ideal para cada produto que você vende, para que cada real de anúncio fale com quem realmente contrata.",
    },
    {
      letra: "A",
      nome: "Anúncios impulsores",
      texto:
        "Criativos e campanhas sob medida para cada produto e perfil de cliente, feitos para atrair quem tem intenção de contratar, não curiosos.",
    },
    {
      letra: "P",
      nome: "Proposta estratégica",
      texto:
        "Um playbook de atendimento: como abordar no WhatsApp, quando enviar a cotação e como conduzir o lead até o fechamento.",
    },
    {
      letra: "A",
      nome: "Análise pro-sales",
      texto:
        "Lemos o funil de ponta a ponta, do clique ao contrato, para encontrar o gargalo que está travando as suas vendas e corrigir rápido.",
    },
  ],
} as const;

export const depoimentos = {
  titulo: "Nossos resultados falam por nós.",
  intro: "Donos e diretores de corretoras contam, com as próprias palavras, o que mudou depois da LAKS.",
  destaques: [
    { valor: "180 leads", texto: "em menos de um mês", fonte: "Malta & Nardelli" },
    { valor: "Quase 2 anos", texto: "de parceria contínua", fonte: "Fiorano Seguros" },
    { valor: "27 anos", texto: "de mercado e confiança na LAKS", fonte: "RSIM Consultoria" },
  ],
  videos: [
    {
      id: "malta-nardelli",
      // CONFIRMAR: nome de quem fala no vídeo.
      nome: "Malta & Nardelli",
      empresa: "Malta & Nardelli Seguros e Benefícios",
      citacao: "Em menos de um mês, a gente teve uma captação de 180 leads. Quem não confia e não acredita está perdendo tempo.",
      duracao: "0:20",
    },
    {
      id: "rsim-gustavo-bispo",
      nome: "Gustavo Bispo",
      empresa: "Diretor comercial, RSIM Consultoria",
      citacao: "Testamos outros prestadores e não atenderam. A LAKS é bem preparada em estrutura e em pessoas, com relatórios semanais. É tudo que um empresário procura.",
      duracao: "1:10",
    },
    {
      id: "mybro-silvio-toni",
      nome: "Sílvio Toni",
      empresa: "myBro Corretora",
      citacao: "Leads de qualidade, leads que convertem. Se um dia isso perder a qualidade, eu venho a público avisar você. Vale a pena.",
      duracao: "1:04",
    },
    {
      id: "fiorano-seguros",
      // CONFIRMAR: nome de quem fala no vídeo.
      nome: "Fiorano Seguros",
      empresa: "Cliente há quase 2 anos",
      citacao: "Não é custo. Isso libera o meu tempo para pensar em outras coisas e deixo a geração de leads com a LAKS.",
      duracao: "0:36",
    },
    {
      id: "gebara-alex-gebara",
      nome: "Alex Gebara",
      empresa: "Gebara Seguros, 25 anos de mercado",
      citacao: "A gente acabava perdendo tempo e dinheiro para trazer cliente no digital. Dispensa comentar: o trabalho e o resultado são muito bons.",
      duracao: "1:00",
    },
  ],
} as const;

export const quemSomos = {
  lema: "Vivemos o que vendemos.",
  texto:
    "Somos um time obcecado por resultado. Criamos soluções sob medida, lado a lado com cada cliente, unindo marketing digital, tráfego pago e a estruturação do processo de vendas para colocar a sua corretora em outro patamar.",
  sede: "Sede física em Balneário Camboriú",
  sedeTexto:
    "Mais de 70 especialistas em marketing, tráfego e vendas trabalhando no mesmo lugar, com rotina, método e acompanhamento semanal de cada cliente.",
  // CONFIRMAR: nome e cargo do fundador (aparece só como legenda da foto).
  fundador: { nome: "", cargo: "Fundador da LAKS" },
} as const;

export const proposito = {
  palavras: ["Impulsionar", "Educar", "Acelerar"],
  complemento: "Esse é o propósito da LAKS com cada corretora que entra no time.",
} as const;

export const checklist = {
  titulo: "A LAKS é para você que quer:",
  itens: [
    "Aumentar o retorno dos seus investimentos em anúncios pagos",
    "Atrair mais leads qualificados e aumentar o volume de conversões",
    "Elevar a performance do time de vendas e a taxa de conversão",
    "Conectar-se de verdade com o seu público-alvo para vender cada vez mais",
    "Ter anúncios que se destacam e geram resultado",
  ],
  fechamento: "Marcou 3 ou mais? Então a LAKS é para você.",
} as const;

export const diagnostico = {
  titulo: "Vamos acelerar?",
  intro:
    "Preencha o formulário e agende uma consultoria gratuita com um especialista em marketing e vendas para corretoras.",
  passos: [
    { titulo: "Entendemos o momento", texto: "Como a sua corretora vende hoje, quais produtos e onde estão os clientes." },
    { titulo: "Identificamos o que falta", texto: "O que está travando o crescimento: lead, anúncio, atendimento ou funil." },
    { titulo: "Entregamos o plano", texto: "Um plano de ação estratégico para a sua corretora vender mais." },
  ],
  retorno: "Um especialista entra em contato em até 1 dia útil pelo WhatsApp (DDD 47 ou 48) ou por ligação.",
} as const;
