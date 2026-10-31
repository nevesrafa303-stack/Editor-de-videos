// Lista única das peças. O render.mjs e as páginas de layout leem daqui.
// quadro = posição da foto em px de CSS (a peça é desenhada em 1080 de largura e exportada em 2x):
//   w = largura da foto, x/y = canto superior esquerdo. No convite, relativo à coluna da foto (540 px).
// luz = círculo do holofote (cx, cy = centro; d = diâmetro). sombra = sombra no chão sob a modelo.
// A cliente pediu só a porcentagem de desconto: nenhuma peça mostra valor em reais.

// nitidas/ = fotos do estúdio ampliadas 2x (Real-ESRGAN) com a textura original devolvida (ferramentas/refinar.py)
export const FOTOS = {
  vermelho: 'nitidas/vermelho.jpg',
  'marrom-tule': 'nitidas/marrom-tule.jpg',
  sentada: 'nitidas/sentada.jpg',
  jeans: 'nitidas/jeans.jpg',
  'branco-tenis': 'nitidas/branco-tenis.jpg',
};

export const PECAS = [
  { id: 'd1-capa-vermelho', layout: 'capa', tema: 'escuro', foto: 'vermelho',
    quadro: { story: { w: 1200, x: 0, y: -39 }, feed: { w: 1300, x: -45, y: -290 } } },
  { id: 'd2-holofote-sentada', layout: 'holofote', foto: 'sentada',
    quadro: { story: { w: 952, x: 64, y: 536 }, feed: { w: 774, x: 153, y: 270 } },
    luz: { story: { cx: 540, cy: 1340, d: 660 }, feed: { cx: 540, cy: 908, d: 520 } },
    sombra: { story: { cx: 540, cy: 1842, w: 820, h: 110 }, feed: { cx: 540, cy: 1330, w: 680, h: 90 } } },
  { id: 'd3-convite-jeans', layout: 'convite', foto: 'jeans', fundo: '#565656',
    quadro: { story: { w: 1124, x: -348, y: 270 }, feed: { w: 851, x: -198, y: 100 } } },
  { id: 'd4-capa-clara-branco', layout: 'capa', tema: 'claro', foto: 'branco-tenis',
    quadro: { story: { w: 1150, x: -35, y: -28 }, feed: { w: 1250, x: -85, y: -281 } } },
  { id: 'd5-holofote-jeans', layout: 'holofote', foto: 'jeans',
    quadro: { story: { w: 860, x: 67, y: 662 }, feed: { w: 630, x: 194, y: 428 } },
    luz: { story: { cx: 540, cy: 1330, d: 680 }, feed: { cx: 540, cy: 908, d: 520 } } },
  { id: 'd6-capa-clara-marrom', layout: 'capa', tema: 'claro', foto: 'marrom-tule',
    quadro: { story: { w: 1300, x: -142, y: -278 }, feed: { w: 1450, x: -221, y: -589 } } },
  { id: 'd7-convite-sentada', layout: 'convite', foto: 'sentada', fundo: '#525252',
    quadro: { story: { w: 1280, x: -370, y: 0 }, feed: { w: 900, x: -180, y: 0 } } },
];
