// Lista das peças. render.mjs e os layouts leem daqui.
// grupo: gestante (15% Ensaio Gestante) · newborn (20% Combo Gestante + Newborn) · juntos (as duas fotos e os dois descontos)
// quadros[fmt]: molduras das fotos em px da peça (ver montarQuadros em base.js). forma: arco | ret | impresso | card.
// As fotos são as originais do estúdio, sem nenhuma alteração; a escala nunca passa de 1 (sem ampliar).

export const FOTOS = {
  vermelho: 'vermelho.jpg',
  jeans: 'jeans.jpg',
  sentada: 'sentada.jpg',
  'branco-tenis': 'branco-tenis.jpg',
  'marrom-tule': 'marrom-tule.jpg',
  holofote: 'holofote-blazer-pdf.jpg',
  'nb-tule-vertical': 'newborn-menina-tule-vertical.jpg',
  'nb-tule-deitada': 'newborn-menina-tule-deitada.jpg',
  'nb-touca': 'newborn-menino-touca.jpg',
  'nb-azul-vertical': 'newborn-menino-azul-vertical.jpg',
  'nb-renda': 'newborn-menina-renda.jpg',
  'nb-botoes': 'newborn-menino-botoes.jpg',
};

export const PECAS = [
  // ── Gestante · 15% OFF Ensaio Gestante ──────────────────────────────────────────
  { id: 'g1-capa-vermelho', layout: 'capa', grupo: 'gestante', variante: 'um-v',
    quadros: {
      story: [{ foto: 'vermelho', forma: 'arco', x: 250, y: 450, w: 580, h: 760, fx: .6, fy: .6, zoom: .86 }],
      feed: [{ foto: 'vermelho', forma: 'arco', x: 80, y: 150, w: 440, h: 1050, fx: .62, fy: .6, zoom: .9 }],
    } },
  { id: 'g2-papel-jeans', layout: 'editorial', grupo: 'gestante',
    quadros: {
      story: [{ foto: 'jeans', forma: 'impresso', x: 230, y: 850, w: 620, h: 800, rot: 2.5, fx: .5, fy: .44, zoom: .8 }],
      feed: [{ foto: 'jeans', forma: 'impresso', x: 585, y: 110, w: 430, h: 1080, rot: 2, fx: .52, fy: .5, zoom: .84 }],
    } },
  { id: 'g3-convite-holofote', layout: 'convite', grupo: 'gestante',
    quadros: {
      story: [{ foto: 'holofote', forma: 'card', x: 50, y: 250, w: 480, h: 1270, fx: .43, fy: .5 }],
      feed: [{ foto: 'holofote', forma: 'card', x: 40, y: 40, w: 470, h: 1270, fx: .43, fy: .5 }],
    } },

  // ── Newborn · 20% OFF Combo Gestante + Newborn ──────────────────────────────────
  { id: 'n1-capa-tule', layout: 'capa', grupo: 'newborn', variante: 'um-h',
    quadros: {
      story: [{ foto: 'nb-tule-deitada', forma: 'ret', x: 70, y: 470, w: 940, h: 680, fx: .48, fy: .5 }],
      feed: [{ foto: 'nb-tule-deitada', forma: 'ret', x: 60, y: 235, w: 960, h: 630, fx: .48, fy: .5 }],
    } },
  { id: 'n2-papel-botoes', layout: 'editorial', grupo: 'newborn',
    quadros: {
      story: [{ foto: 'nb-botoes', forma: 'impresso', x: 100, y: 920, w: 880, h: 620, rot: -2, fx: .5, fy: .5, zoom: .72 }],
      feed: [{ foto: 'nb-botoes', forma: 'impresso', x: 565, y: 330, w: 450, h: 580, rot: 2.5, fx: .5, fy: .5 }],
    } },
  { id: 'n3-convite-tule', layout: 'convite', grupo: 'newborn',
    quadros: {
      story: [{ foto: 'nb-tule-vertical', forma: 'card', x: 50, y: 250, w: 480, h: 1270, fx: .27, fy: .5 }],
      feed: [{ foto: 'nb-tule-vertical', forma: 'card', x: 40, y: 40, w: 470, h: 1270, fx: .27, fy: .5 }],
    } },

  // ── Juntos · gestante + newborn, os dois descontos ──────────────────────────────
  { id: 'j1-capa-sentada-azul', layout: 'capa', grupo: 'juntos', variante: 'dois',
    quadros: {
      story: [
        { foto: 'sentada', forma: 'arco', x: 80, y: 530, w: 440, h: 640, fx: .55, fy: .7, zoom: .72 },
        { foto: 'nb-azul-vertical', forma: 'arco', x: 560, y: 530, w: 440, h: 640, fx: .5, fy: .55, zoom: .6 },
      ],
      feed: [
        { foto: 'sentada', forma: 'arco', x: 80, y: 235, w: 440, h: 620, fx: .55, fy: .7, zoom: .7 },
        { foto: 'nb-azul-vertical', forma: 'arco', x: 560, y: 235, w: 440, h: 620, fx: .5, fy: .55, zoom: .58 },
      ],
    } },
  { id: 'j2-papel-tenis-touca', layout: 'editorial', grupo: 'juntos',
    quadros: {
      story: [
        { foto: 'branco-tenis', forma: 'impresso', x: 470, y: 900, w: 520, h: 690, rot: 3, fx: .5, fy: .64, zoom: .8, z: 1 },
        { foto: 'nb-touca', forma: 'impresso', x: 70, y: 1330, w: 600, h: 420, rot: -3, fx: .5, fy: .5, zoom: .66, z: 2 },
      ],
      feed: [
        { foto: 'branco-tenis', forma: 'impresso', x: 600, y: 70, w: 400, h: 560, rot: 3, fx: .5, fy: .63, zoom: .62, z: 1 },
        { foto: 'nb-touca', forma: 'impresso', x: 545, y: 705, w: 460, h: 330, rot: -3, fx: .5, fy: .5, zoom: .52, z: 2 },
      ],
    } },
  { id: 'j3-convite-tule-renda', layout: 'convite', grupo: 'juntos',
    quadros: {
      story: [
        { foto: 'marrom-tule', forma: 'card', x: 50, y: 250, w: 480, h: 760, fx: .52, fy: .68, zoom: .72 },
        { foto: 'nb-renda', forma: 'card', x: 50, y: 1030, w: 480, h: 490, fx: .5, fy: .5, zoom: .5 },
      ],
      feed: [
        { foto: 'marrom-tule', forma: 'card', x: 40, y: 40, w: 470, h: 760, fx: .52, fy: .68, zoom: .7 },
        { foto: 'nb-renda', forma: 'card', x: 40, y: 820, w: 470, h: 490, fx: .5, fy: .5, zoom: .5 },
      ],
    } },
];
