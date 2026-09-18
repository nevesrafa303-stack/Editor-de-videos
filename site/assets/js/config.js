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
    // Link canônico do estabelecimento no Google Maps. O CID veio do link que a
    // pessoa usuária enviou (ftid 0x94d8cde22e7f6527:0xcc4018a4e7c697fb).
    mapaLink: 'https://maps.google.com/?cid=14717790678789036027',
    // Mapa embutido. O formato com `q=<endereço>&output=embed` é o único que o
    // Google serve sem chave de API — `ftid` e `cid` funcionam em link normal,
    // mas não em iframe, e devolvem tela em branco.
    mapaEmbed: 'https://maps.google.com/maps?q=R.%20Herc%C3%ADlio%20Luz%2C%20642%20-%20Centro%2C%20Itaja%C3%AD%20-%20SC%2C%2088301-001&hl=pt-BR&z=17&output=embed',
    // Traça a rota a partir de onde a pessoa estiver
    rotaLink: 'https://www.google.com/maps/dir/?api=1&destination=R.+Herc%C3%ADlio+Luz%2C+642+-+Centro%2C+Itaja%C3%AD+-+SC%2C+88301-001',
  },

  /* --- Avaliações Google ------------------------------------------------ */
  google: {
    nota: '5,0',
    quantidade: 5,
    // ⚠️ CONFIRMAR — troque pelo link "Escrever avaliação"/perfil do Google Business
    link: 'https://www.google.com/maps/search/?api=1&query=Consult%C3%B3rio+Odontol%C3%B3gico+Dra.+Consuelo+Vasconcelos+Itaja%C3%AD',
  },

  /* --- Horários --------------------------------------------------------- */
  horarios: [
    { dias: 'Segunda a sábado', hora: '09h30 — 18h00' },
    { dias: 'Domingo', hora: 'Fechado' },
  ],

  /* --- Redes sociais ---------------------------------------------------- */
  // O site atual tem ícones de Instagram, Facebook, YouTube, Pinterest e TikTok,
  // mas os prints não mostram as URLs. Confirme cada uma e preencha.
  redes: {
    instagram: 'https://instagram.com/draconsuelovasconcelos', // ⚠️ CONFIRMAR o @
    facebook: null,  // ⚠️ CONFIRMAR
    youtube: null,   // ⚠️ CONFIRMAR
    pinterest: null, // ⚠️ CONFIRMAR
    tiktok: null,    // ⚠️ CONFIRMAR
  },

  /* --- Mensagem pré-preenchida do WhatsApp ------------------------------ */
  mensagemWhatsapp:
    'Olá, Dra. Consuelo! Vim pelo site e quero agendar minha avaliação.',

  /* --- SEO -------------------------------------------------------------- */
  site: 'https://draconsuelovasconcelos.com.br',
  cidade: 'Itajaí',
  uf: 'SC',
};
