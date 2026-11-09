// As 6 peças de Natal (versão 2), cada uma em Story (1080×1920) e Feed (1080×1350).
// render.mjs, conferir.mjs e peca.html leem daqui.
//
// Pedidos de 09/11/2026:
//   "está muito genérico, use as imagens em destaque, em todo o criativo": a foto ocupa a peça inteira (ou 2–3 fotos
//     empilhadas, separadas por um filete marfim) e o texto fica direto sobre o CENÁRIO (cortina, árvore, parede da
//     Varanda de Natal), nunca sobre as pessoas. Na imagem: selo + título; o "Agende" vai no botão do anúncio (Enviar mensagem).
//   "Destaque mais a frase Ensaio de Natal 2026": o selo virou uma faixa dourada (fita com as pontas recortadas).
//
// paineis: janela de cada foto em px da peça (exportada em 2x). A foto só é cortada e reduzida: preenche a janela
//   com a menor escala possível (≤ 1 px exportado por px da foto) e fx/fy (0–1) dizem que parte fica no centro;
//   z > 1 aproxima um pouco (só corte: a escala continua ≤ 1).
// faixa: a faixa "Ensaio de Natal 2026", centralizada em x..x+w (padrão: a peça toda), com o topo em `top`.
// textos: blocos de texto. x, w = coluna; top = topo; tom: 'escuro' (letra clara sobre fundo escuro) ou 'claro'
//   (letra vinho sobre fundo claro). Itens: [tipo, texto, { fs: tamanho, mt: margem acima }].
//   tipos: caps (Cinzel) · script (Great Vibes) · rot (rótulo em Cinzel).
// Story: todo texto entre y=230 e y=1536 (fora das barras do Story).

export const SELO = 'Ensaio de Natal 2026';

const S = { faixa: 40, caps: 44, script: 120, rot: 30 };   // tamanhos padrão no Story
const F = { faixa: 32, caps: 36, script: 100, rot: 26 };   // e no Feed
export const TAMANHOS = { story: S, feed: F };

const tela = (foto, extra = {}) => ({ foto, x: 0, y: 0, w: 1080, h: extra.h ?? 1920, ...extra });

export const PECAS = [
  // 1 · Veludo vermelho — "O Natal da sua família, eternizado". Faixa no alto da cortina; título à direita, acima do pai.
  { id: 'n1-veludo', fotos: ['ANA_9127'],
    story: {
      paineis: [tela('ANA_9127')],
      faixa: { top: 244 },
      textos: [{ x: 586, w: 480, top: 352, tom: 'escuro', itens: [
        ['caps', 'O Natal da<br>sua família,', { fs: 52 }], ['script', 'eternizado', { fs: 128, mt: -4 }]] }],
    },
    feed: {
      paineis: [tela('ANA_9127', { h: 1350, fy: .42 })],
      faixa: { top: 36 },
      textos: [{ x: 600, w: 460, top: 122, tom: 'escuro', itens: [
        ['caps', 'O Natal da<br>sua família,', { fs: 48 }], ['script', 'eternizado', { fs: 118, mt: -6 }]] }],
    } },

  // 2 · Varanda de Natal — faixa e título na parede da varanda, acima da família.
  //   Nome do cenário no catálogo do estúdio (Carol, 09/11/2026): "Varanda de Natal", e não "Casinha do Papai Noel".
  { id: 'n2-varanda', fotos: ['ANA_9214'],
    story: {
      paineis: [tela('ANA_9214')],
      faixa: { top: 248 },
      textos: [{ x: 60, w: 960, top: 346, tom: 'claro', itens: [
        ['caps', 'Bem-vindos à', { fs: 48 }], ['script', 'Varanda de Natal', { fs: 120, mt: -4 }]] }],
    },
    feed: {
      paineis: [tela('ANA_9214', { h: 1350, fy: .5 })],
      faixa: { top: 40 },
      textos: [{ x: 60, w: 960, top: 120, tom: 'claro', itens: [
        ['caps', 'Bem-vindos à', { fs: 42 }], ['script', 'Varanda de Natal', { fs: 106, mt: -4 }]] }],
    } },

  // 3 · A cartinha para o Papai Noel — faixa e título na árvore e na cortina, acima da menina.
  { id: 'n3-cartinha', fotos: ['ANA_9178', 'ANA_9363'],
    story: {
      paineis: [tela('ANA_9178')],
      faixa: { top: 250 },
      textos: [{ x: 60, w: 960, top: 352, tom: 'escuro', itens: [
        ['script', 'A cartinha para<br>o Papai Noel', { fs: 124 }], ['caps', 'vira lembrança<br>para a vida toda', { fs: 44, mt: 4 }]] }],
    },
    feed: {
      paineis: [tela('ANA_9363', { h: 1350, fy: .55 })],
      faixa: { top: 36 },
      textos: [{ x: 60, w: 960, top: 118, tom: 'escuro', itens: [
        ['script', 'A cartinha para o Papai Noel', { fs: 86 }], ['caps', 'vira lembrança para a vida toda', { fs: 30, mt: 0 }]] }],
    } },

  // 4 · Neve caindo e sorrisos de verdade — três fotos da neve; faixa e título nas árvores nevadas, à direita da menina.
  { id: 'n4-neve', fotos: ['ANA_9209', 'ANA_9265', 'ANA_9215'],
    story: {
      paineis: [tela('ANA_9209', { h: 636 }), tela('ANA_9265', { y: 642, h: 636 }), tela('ANA_9215', { y: 1284, h: 636 })],
      faixa: { x: 584, w: 490, top: 700, fs: 28 },
      textos: [{ x: 584, w: 490, top: 782, tom: 'claro', itens: [
        ['script', 'Neve caindo', { fs: 98 }], ['caps', 'e sorrisos<br>de verdade', { fs: 48, mt: -4 }]] }],
    },
    feed: {
      paineis: [tela('ANA_9265', { h: 672 }), tela('ANA_9209', { y: 678, h: 672 })],
      faixa: { x: 586, w: 480, top: 36, fs: 26 },
      textos: [{ x: 586, w: 480, top: 106, tom: 'claro', itens: [
        ['script', 'Neve caindo', { fs: 100 }], ['caps', 'e sorrisos<br>de verdade', { fs: 46, mt: -4 }]] }],
    } },

  // 5 · O melhor presente é estar na foto — faixa e título na cortina e na guirlanda, acima da família.
  { id: 'n5-familia', fotos: ['ANA_9320'],
    story: {
      paineis: [tela('ANA_9320')],
      faixa: { top: 240 },
      textos: [{ x: 60, w: 960, top: 334, tom: 'escuro', itens: [
        ['caps', 'O melhor presente', { fs: 52 }], ['script', 'é estar na foto', { fs: 112, mt: -12 }]] }],
    },
    feed: {
      paineis: [tela('ANA_9320', { h: 1350, fy: .45 })],
      faixa: { top: 36 },
      textos: [{ x: 60, w: 960, top: 118, tom: 'escuro', itens: [
        ['caps', 'O melhor presente', { fs: 48 }], ['script', 'é estar na foto', { fs: 118, mt: -12 }]] }],
    } },

  // 6 · Dois cenários de Natal: escolha o seu — veludo em cima, Varanda de Natal embaixo, cada um com o seu nome.
  { id: 'n6-cenarios', fotos: ['ANA_9359', 'ANA_9390'],
    story: {
      paineis: [tela('ANA_9359', { h: 957 }), tela('ANA_9390', { y: 963, h: 957 })],
      faixa: { top: 234, fs: 32 },
      textos: [
        { x: 60, w: 960, top: 306, tom: 'escuro', itens: [
          ['script', 'Dois cenários de Natal', { fs: 84 }], ['caps', 'escolha o seu', { fs: 28, mt: -8 }]] },
        { x: 40, w: 420, top: 862, tom: 'escuro', itens: [['rot', 'Veludo vermelho']] },
        { x: 60, w: 960, top: 990, tom: 'claro', itens: [['rot', 'Varanda de Natal']] }],
    },
    feed: {
      paineis: [tela('ANA_9359', { h: 672, fy: .5 }), tela('ANA_9390', { y: 678, h: 672, fy: .42 })],
      faixa: { top: 24, fs: 26 },
      textos: [
        { x: 60, w: 960, top: 84, tom: 'escuro', itens: [
          ['script', 'Dois cenários de Natal', { fs: 80 }], ['caps', 'escolha o seu', { fs: 28, mt: -8 }]] },
        { x: 30, w: 400, top: 600, tom: 'escuro', itens: [['rot', 'Veludo vermelho', { fs: 24 }]] },
        { x: 60, w: 960, top: 688, tom: 'claro', itens: [['rot', 'Varanda de Natal', { fs: 24 }]] }],
    } },
];
