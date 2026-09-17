/* =============================================================================
   CONFIG — ÚNICO ARQUIVO QUE VOCÊ PRECISA EDITAR PARA PUBLICAR
   -----------------------------------------------------------------------------
   Troque os valores marcados com  // ⚠️ TROCAR  pelos dados reais.
   O site inteiro (links, telefone, endereço, redes, SEO) lê daqui.
   ========================================================================== */

window.SITE = {
  /* --- Identidade ------------------------------------------------------- */
  nome: 'Dra. Consuelo Vasconcelos',
  especialidade: 'Odontologia Estética e Harmonização Orofacial',
  cro: 'CRO-XX 00000', // ⚠️ TROCAR — nº de inscrição no Conselho
  responsavelTecnico: 'Dra. Consuelo Vasconcelos — CRO-XX 00000', // ⚠️ TROCAR

  /* --- Contato ---------------------------------------------------------- */
  // Somente dígitos, com DDI 55 e DDD. Ex.: 5585999998888
  whatsapp: '5585999998888', // ⚠️ TROCAR
  // Como o telefone aparece escrito na tela
  telefoneExibicao: '(85) 99999-8888', // ⚠️ TROCAR
  email: 'contato@draconsuelovasconcelos.com.br', // ⚠️ TROCAR

  /* --- Endereço --------------------------------------------------------- */
  endereco: {
    linha1: 'Rua Exemplo, 1234 — Sala 501', // ⚠️ TROCAR
    linha2: 'Bairro Exemplo · Fortaleza/CE', // ⚠️ TROCAR
    cep: '60000-000', // ⚠️ TROCAR
    // Cole aqui o link "Compartilhar" do Google Maps
    mapaLink: 'https://maps.google.com/?q=Fortaleza+CE', // ⚠️ TROCAR
    // Cole aqui o src do iframe "Incorporar um mapa" do Google Maps.
    // Deixe null para o site mostrar um cartão elegante no lugar do mapa.
    mapaEmbed: null, // ⚠️ TROCAR (opcional)
  },

  /* --- Horários --------------------------------------------------------- */
  horarios: [
    { dias: 'Segunda a quinta', hora: '09h — 19h' },
    { dias: 'Sexta-feira', hora: '09h — 17h' },
    { dias: 'Sábado', hora: '09h — 13h (agenda reduzida)' },
    { dias: 'Domingo e feriados', hora: 'Fechado' },
  ],

  /* --- Redes sociais ---------------------------------------------------- */
  redes: {
    instagram: 'https://instagram.com/draconsuelovasconcelos', // ⚠️ TROCAR
    // Deixe null para o ícone não aparecer
    facebook: null,
    youtube: null,
    tiktok: null,
  },

  /* --- Mensagem pré-preenchida do WhatsApp ------------------------------ */
  mensagemWhatsapp:
    'Olá! Vim pelo site e gostaria de agendar uma avaliação com a Dra. Consuelo.',

  /* --- SEO -------------------------------------------------------------- */
  site: 'https://draconsuelovasconcelos.com.br',
  cidade: 'Fortaleza', // ⚠️ TROCAR
  uf: 'CE', // ⚠️ TROCAR
};
