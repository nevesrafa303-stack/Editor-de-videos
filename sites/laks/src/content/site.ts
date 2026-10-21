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
  selo: "#1 aceleradora de marketing & vendas de planos de saúde",
  // A palavra em `destaque` ganha o gradiente laranja.
  titulo: ["Aumentamos o", "faturamento da", "sua corretora."],
  destaque: "faturamento",
  subtitulo:
    "Leads qualificados, anúncios que convertem e um processo comercial que fecha. O time de Marketing e Vendas da LAKS jogando no time da sua corretora de planos de saúde e seguros.",
  ctaPrincipal: "Quero meu diagnóstico gratuito",
  ctaSecundario: "Ver resultados",
} as const;

export const numeros = [
  { valor: 400, prefixo: "", sufixo: "+", rotulo: "corretoras ativas" },
  { valor: 50, prefixo: "R$ ", sufixo: " mi+", rotulo: "investidos em anúncios" },
  { valor: 70, prefixo: "", sufixo: " mil+", rotulo: "leads gerados por mês para clientes" },
  { valor: 70, prefixo: "", sufixo: "+", rotulo: "especialistas no time" },
] as const;

export const manifesto = {
  antes:
    "Lead caro. Lead frio. Contato da cidade errada, curioso sem perfil, cotação que nunca vira contrato. E o dono da corretora fazendo marketing no intervalo entre uma reunião e outra.",
  virada: "A LAKS existe para virar esse jogo.",
} as const;

export const mapa = {
  titulo: "Método MAPA",
  intro:
    "O nosso método proprietário para construir um canal de aquisição de clientes previsível no digital, feito exclusivamente para corretoras de seguros e planos de saúde.",
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
  proposito: ["Impulsionar", "Educar", "Acelerar"],
  propositoComplemento: "empresas. Esse é o nosso propósito.",
  sede: "Sede física em Balneário Camboriú",
  // CONFIRMAR: nome e cargo do fundador (aparece só como legenda da foto).
  fundador: { nome: "", cargo: "Fundador da LAKS" },
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
