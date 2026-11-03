// Lista das peças. render.mjs e os layouts leem daqui.
// grupo: gestante (Ensaio de Gestante 15%) · newborn (Ensaio de Newborn 20%) · juntos (as duas fotos, cada uma com o seu desconto)
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

// Onde está a pessoa / o bebê em cada foto (x0, y0, x1, y1 de 0 a 1), já com folga em volta.
// Medido nas fotos originais: a moldura mostra essa região inteira e centralizada.
const R = {
  vermelho: [.29, .30, .75, .96],          // corpo inteiro, do coque à barra do vestido
  jeans: [.20, .24, .82, .87],             // da cabeça ao quadril
  sentada: [.12, .34, .90, .95],           // sentada de pernas cruzadas
  'branco-tenis': [.30, .30, .72, .96],    // corpo inteiro com os tênis de bebê no rosto
  'marrom-tule': [.31, .37, .77, .97],     // corpo inteiro
  holofote: [.23, .31, .80, .95],          // a modelo dentro do círculo de luz da própria foto
  'nb-tule-deitada': [.16, .22, .84, .86],
  'nb-botoes': [.14, .22, .86, .88],
  'nb-touca': [.17, .24, .84, .88],
  'nb-renda': [.12, .26, .90, .88],
  'nb-tule-vertical': [.16, .16, .86, .93],
  'nb-azul-vertical': [.24, .17, .86, .96],
};
const f = (foto, forma, x, y, w, h, extra = {}) => ({ foto, forma, x, y, w, h, regiao: R[foto], ...extra });

export const PECAS = [
  // ── Gestante · Ensaio de Gestante 15% OFF ──────────────────────────────────────
  { id: 'g1-capa-vermelho', layout: 'capa', grupo: 'gestante', variante: 'um-v',
    quadros: { story: [f('vermelho', 'arco', 70, 490, 450, 850)], feed: [f('vermelho', 'arco', 80, 240, 440, 830)] } },
  { id: 'g2-papel-jeans', layout: 'editorial', grupo: 'gestante', variante: 'lado',
    quadros: { story: [f('jeans', 'impresso', 280, 850, 520, 790, { rot: 2.5 })],
      feed: [f('jeans', 'impresso', 560, 230, 470, 760, { rot: 2 })] } },
  { id: 'g3-convite-holofote', layout: 'convite', grupo: 'gestante',
    quadros: { story: [f('holofote', 'card', 60, 500, 480, 800)], feed: [f('holofote', 'card', 60, 250, 470, 780)] } },

  // ── Newborn · Ensaio de Newborn 20% OFF ────────────────────────────────────────
  { id: 'n1-capa-tule', layout: 'capa', grupo: 'newborn', variante: 'um-h',
    quadros: { story: [f('nb-tule-deitada', 'ret', 110, 500, 860, 540)], feed: [f('nb-tule-deitada', 'ret', 140, 235, 800, 500)] } },
  { id: 'n2-papel-botoes', layout: 'editorial', grupo: 'newborn', variante: 'foto-topo',
    quadros: { story: [f('nb-botoes', 'impresso', 90, 880, 900, 590, { rot: -2 })],
      feed: [f('nb-botoes', 'impresso', 150, 110, 780, 500, { rot: -1.5 })] } },
  { id: 'n3-convite-tule', layout: 'convite', grupo: 'newborn',
    quadros: { story: [f('nb-tule-vertical', 'card', 60, 500, 480, 800)], feed: [f('nb-tule-vertical', 'card', 60, 250, 470, 780)] } },

  // ── Juntos · Combo Gestante + Newborn 20% (as duas fotos) ──────────────────────
  { id: 'j1-capa-sentada-azul', layout: 'capa', grupo: 'juntos', variante: 'dois',
    quadros: {
      story: [f('sentada', 'arco', 80, 540, 440, 560), f('nb-azul-vertical', 'arco', 560, 540, 440, 560)],
      feed: [f('sentada', 'arco', 80, 225, 440, 480), f('nb-azul-vertical', 'arco', 560, 225, 440, 480)],
    } },
  { id: 'j2-papel-tenis-touca', layout: 'editorial', grupo: 'juntos', variante: 'texto-topo',
    quadros: {
      story: [
        f('branco-tenis', 'impresso', 600, 800, 380, 600, { rot: 3, legenda: 'Ensaio de Gestante', leg: 72, z: 1 }),
        f('nb-touca', 'impresso', 70, 950, 540, 370, { rot: -3, legenda: 'Ensaio de Newborn', leg: 72, z: 2 }),
      ],
      feed: [
        f('branco-tenis', 'impresso', 110, 520, 340, 600, { rot: -2.5, legenda: 'Ensaio de Gestante', leg: 62, z: 1 }),
        f('nb-touca', 'impresso', 500, 600, 480, 330, { rot: 2.5, legenda: 'Ensaio de Newborn', leg: 62, z: 2 }),
      ],
    } },
  { id: 'j3-convite-tule-renda', layout: 'convite', grupo: 'juntos',
    quadros: {
      story: [f('marrom-tule', 'card', 60, 490, 420, 640), f('nb-renda', 'card', 60, 1160, 420, 300)],
      feed: [f('marrom-tule', 'card', 60, 245, 360, 560), f('nb-renda', 'card', 60, 840, 420, 290)],
    } },
];
