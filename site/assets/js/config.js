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
    mapaLink: 'https://www.google.com/maps/search/?api=1&query=Consult%C3%B3rio+Odontol%C3%B3gico+Dra.+Consuelo+Vasconcelos+R.+Herc%C3%ADlio+Luz+642+Itaja%C3%AD+SC',
    // Cole o src do iframe "Incorporar um mapa" do Google Maps para exibir o mapa embutido
    mapaEmbed: null, // ⚠️ OPCIONAL
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
