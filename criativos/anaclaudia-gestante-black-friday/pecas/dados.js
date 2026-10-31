// Lista única das peças. O render.mjs e as páginas de layout leem daqui.
// quadro = posição da foto em px de CSS (a peça é desenhada em 1080 de largura e exportada em 2x):
//   w = largura da foto, x/y = canto superior esquerdo. No convite, relativo à coluna da foto (540 px).
// luz = círculo do holofote (cx, cy = centro; d = diâmetro). sombra = sombra no chão sob a modelo.

// Pacote Ouro — Ensaio Gestante (proposta comercial, pág. 6): 12x de R$ 54,50 sem juros = R$ 654,00; à vista R$ 545,00.
export const OURO = { total: 654, vista: 545 };
export const reais = v => v.toFixed(2).replace('.', ',');
export const parcela = n => reais(OURO.total / n); // 12 → 54,50 · 8 → 81,75 · 6 → 109,00

// originais/ = fotos enviadas pelo estúdio
export const FOTOS = {
  vermelho: 'originais/vermelho.jpg',
  'marrom-tule': 'originais/marrom-tule.jpg',
  sentada: 'originais/sentada.jpg',
  jeans: 'originais/jeans.jpg',
  'branco-tenis': 'originais/branco-tenis.jpg',
};

const CAPA_VERMELHO = { story: { w: 1280, x: -96, y: -90 }, feed: { w: 1104, x: -22, y: -236 } };
const HOLOFOTE_SENTADA = {
  quadro: { story: { w: 952, x: 64, y: 504 }, feed: { w: 774, x: 153, y: 262 } },
  luz: { story: { cx: 540, cy: 1308, d: 660 }, feed: { cx: 540, cy: 900, d: 520 } },
  sombra: { story: { cx: 540, cy: 1810, w: 820, h: 110 }, feed: { cx: 540, cy: 1322, w: 680, h: 90 } },
};
const CONVITE_JEANS = { story: { w: 1124, x: -348, y: 270 }, feed: { w: 851, x: -198, y: 100 } };

export const PECAS = [
  // Texto pedido pela cliente (15% ensaio gestante, 20% combo gestante + newborn)
  { id: 'd1-capa-vermelho', layout: 'capa', tema: 'escuro', foto: 'vermelho', oferta: 'desconto', quadro: CAPA_VERMELHO },
  { id: 'd2-holofote-sentada', layout: 'holofote', foto: 'sentada', oferta: 'desconto', ...HOLOFOTE_SENTADA },
  { id: 'd3-convite-jeans', layout: 'convite', foto: 'jeans', oferta: 'desconto', quadro: CONVITE_JEANS },

  // Pacote Ouro parcelado (12x, 8x, 6x)
  { id: 'o1-capa-vermelho-12x', layout: 'capa', tema: 'escuro', foto: 'vermelho', oferta: 'ouro', parcelas: 12,
    quadro: { story: { w: 1280, x: -96, y: -140 }, feed: { w: 1104, x: -22, y: -262 } } },
  { id: 'o2-capa-clara-branco-12x', layout: 'capa', tema: 'claro', foto: 'branco-tenis', oferta: 'ouro', parcelas: 12,
    quadro: { story: { w: 1150, x: -35, y: -60 }, feed: { w: 1080, x: 0, y: -292 } } },
  { id: 'o3-holofote-jeans-8x', layout: 'holofote', foto: 'jeans', oferta: 'ouro', parcelas: 8,
    quadro: { story: { w: 860, x: 67, y: 660 }, feed: { w: 630, x: 194, y: 428 } },
    luz: { story: { cx: 540, cy: 1290, d: 660 }, feed: { cx: 540, cy: 900, d: 520 } } },
  { id: 'o4-capa-clara-marrom-8x', layout: 'capa', tema: 'claro', foto: 'marrom-tule', oferta: 'ouro', parcelas: 8,
    quadro: { story: { w: 1230, x: -75, y: -290 }, feed: { w: 1120, x: -20, y: -440 } } },
  { id: 'o5-convite-sentada-6x', layout: 'convite', foto: 'sentada', oferta: 'ouro', parcelas: 6, fundo: '#525252',
    quadro: { story: { w: 1280, x: -370, y: 0 }, feed: { w: 900, x: -180, y: 0 } } },
  { id: 'o6-holofote-sentada-6x', layout: 'holofote', foto: 'sentada', oferta: 'ouro', parcelas: 6, ...HOLOFOTE_SENTADA },
];
