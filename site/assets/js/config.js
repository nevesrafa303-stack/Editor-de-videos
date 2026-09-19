/* =============================================================================
   CONFIG — dados extraídos do site atual (draconsuelovasconcelos.com.br)
   -----------------------------------------------------------------------------
   Os campos marcados com  // ⚠️ CONFIRMAR  eu não consegui ler dos prints.
   Todo o resto veio do site publicado e está correto.
   ========================================================================== */

window.SITE = {
  /* --- Identidade ------------------------------------------------------- */
  nome: 'Dra. Consuelo Vasconcelos',
  especialidade: 'Odontologia & Estética Avançada',
  titulo: 'Cirurgiã-Dentista',
  cro: 'CRO-SC 25523',
  responsavelTecnico: 'Dra. Consuelo Vasconcelos — Cirurgiã-Dentista, CRO-SC 25523',

  /* --- Contato ---------------------------------------------------------- */
  whatsapp: '5547988603900',
  telefoneExibicao: '(47) 98860-3900',
  email: null, // ⚠️ CONFIRMAR — não aparece no site atual. Deixe null para ocultar.

  /* --- Endereço --------------------------------------------------------- */
  endereco: {
    linha1: 'R. Hercílio Luz, 642 — Sala 304, segundo andar',
    linha2: 'Centro · Itajaí — SC',
    cep: '88301-001',
    referencia: 'No calçadão da Hercílio Luz, no Centro de Itajaí.',
    // Link curto oficial de compartilhamento da ficha no Google Maps, enviado
    // pela pessoa usuária. Abre a ficha do consultório no app, no celular.
    mapaLink: 'https://maps.app.goo.gl/m1uq5LL771gd7M6t7',
    // Mesma ficha, na forma longa (CID). Vai nos dados estruturados do Google
    // (schema.org/hasMap), que preferem URL definitiva em vez de encurtador.
    mapaCanonico: 'https://maps.google.com/?cid=14717790678789036027',
    // Mapa embutido. A busca é pelo NOME do consultório, não pelo endereço:
    // é assim que o Google mostra o card do estabelecimento (nome, endereço e
    // nota) em vez de um pin solto. Não precisa de chave de API.
    //
    // Para controle exato, dá para colar aqui o código oficial: no Google Maps,
    // abra a ficha do consultório → Compartilhar → Incorporar um mapa → copie
    // só o endereço que está dentro de src="..." (começa com
    // https://www.google.com/maps/embed?pb=...). Os dois formatos funcionam.
    mapaEmbed: 'https://maps.google.com/maps?q=Consult%C3%B3rio%20Odontol%C3%B3gico%20-%20Dra.%20Consuelo%20Vasconcelos%2C%20R.%20Herc%C3%ADlio%20Luz%2C%20642%20-%20Sl%20304%2C%20segundo%20andar%20-%20Centro%2C%20Itaja%C3%AD%20-%20SC%2C%2088301-001&hl=pt-BR&z=17&output=embed',
    // Traça a rota a partir de onde a pessoa estiver
    rotaLink: 'https://www.google.com/maps/dir/?api=1&destination=R.+Herc%C3%ADlio+Luz%2C+642+-+Centro%2C+Itaja%C3%AD+-+SC%2C+88301-001',
  },

  /* --- Avaliações Google ------------------------------------------------ */
  google: {
    nota: '5,0',
    quantidade: 5,
    // Mesma ficha do Maps: é lá que ficam as avaliações públicas.
    link: 'https://maps.app.goo.gl/m1uq5LL771gd7M6t7',
  },

  /* --- Horários --------------------------------------------------------- */
  horarios: [
    { dias: 'Segunda a sábado', hora: '09h30 — 18h00' },
    { dias: 'Domingo', hora: 'Fechado' },
  ],

  /* --- Redes sociais ---------------------------------------------------- */
  // O site atual tem ícones de Instagram, Facebook, YouTube, Pinterest e TikTok,
  // mas os prints não mostram as URLs. As que ficarem em null somem da página,
  // em vez de virar link quebrado.
  redes: {
    instagram: 'https://instagram.com/consuelo_vasc',  // confirmado pela Dra.
    facebook: null,  // ⚠️ CONFIRMAR
    youtube: null,   // ⚠️ CONFIRMAR
    pinterest: null, // ⚠️ CONFIRMAR
    tiktok: null,    // ⚠️ CONFIRMAR
  },

  /* --- Mensagem pré-preenchida do WhatsApp ------------------------------ */
  // Usada nos botões soltos de WhatsApp, fora do formulário.
  mensagemWhatsapp:
    'Olá, Dra. Consuelo! Vim pelo site e quero agendar minha avaliação.',

  /* --- Mensagem por assunto do formulário -------------------------------
     A chave é o `value` de cada <option> no seletor "Sobre o que você quer
     falar". Cada escolha manda uma frase própria, escrita na voz da paciente,
     em vez de um "Quero falar sobre: X" genérico. Mexeu nas opções do HTML?
     Mexa aqui também — um assunto sem frase cai na genérica, não quebra. */
  mensagensPorAssunto: {
    profilaxia:
      'Quero agendar uma limpeza e saber como funciona a avaliação.',
    restauracao:
      'Acho que tenho um dente precisando de restauração e queria uma avaliação.',
    clareamento:
      'Tenho interesse em clarear os dentes e queria saber quais opções combinam com o meu caso.',
    extracao:
      'Preciso avaliar uma extração e gostaria de entender o procedimento e a recuperação.',
    botox:
      'Tenho interesse em toxina botulínica e queria uma avaliação para entender o que faz sentido no meu rosto.',
    preenchimento:
      'Tenho interesse em preenchimento com ácido hialurônico e queria uma avaliação para entender o resultado possível.',
    bioestimulador:
      'Tenho interesse em bioestimulador de colágeno e queria entender como funciona e em quanto tempo o resultado aparece.',
    microagulhamento:
      'Tenho interesse em microagulhamento e queria saber quantas sessões o meu caso pediria.',
    avaliar:
      'Ainda não sei qual procedimento preciso e queria marcar uma avaliação para entender o que o meu caso pede.',
  },

  /* --- SEO -------------------------------------------------------------- */
  site: 'https://draconsuelovasconcelos.com.br',
  cidade: 'Itajaí',
  uf: 'SC',
};
