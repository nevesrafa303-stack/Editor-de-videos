// As 6 peças de Natal, cada uma em Story (1080×1920) e Feed (1080×1350). render.mjs, conferir.mjs e peca.html leem daqui.
// Copy aprovada em 09/11/2026. Sem valores (a cliente está trocando os lotes) e sem logo.
//
// fotos: janela da foto em px da peça (exportada em 2x). A foto só é cortada e reduzida: preenche a janela com a
//   menor escala possível (escala ≤ 1 px exportado por px da foto) e fx/fy (0–1) dizem que parte fica no centro
//   quando sobra foto. forma: ret | arco | impresso.
// blocos: colunas de texto centralizadas a partir de `top`. Itens: [tipo, texto, { fs: tamanho, mt: margem acima }].
//   tipos: selo · caps (Cinzel) · script (Great Vibes) · divisor · apoio · cta.
// Story: todo texto entre y=230 e y=1536 (fora das barras do Story).

export const SELO = 'Ensaio de Natal 2026';
export const CTA = 'Agende seu ensaio de Natal';

const S = { selo: 26, caps: 46, script: 150, apoio: 29, cta: 24 };   // tamanhos padrão no Story
const F = { selo: 21, caps: 36, script: 112, apoio: 23, cta: 19 };   // e no Feed

export const PECAS = [
  // 1 · Veludo vermelho — "O Natal da sua família, eternizado"
  { id: 'n1-veludo', tema: 'marfim', fotos: ['ANA_9127', 'ANA_9320'],
    story: {
      fotos: [{ foto: 'ANA_9127', forma: 'ret', x: 60, y: 742, w: 960, h: 1118, fy: .52 }],
      blocos: [{ top: 258, itens: [['selo'], ['caps', 'O Natal da sua família,', { mt: 26 }], ['script', 'eternizado', { mt: -6 }],
        ['apoio', 'Cortina de veludo, árvore iluminada<br>e a família toda reunida.', { mt: 4 }], ['cta', CTA, { mt: 26 }]] }],
    },
    feed: {
      fotos: [{ foto: 'ANA_9127', forma: 'ret', x: 60, y: 360, w: 470, h: 682 },
              { foto: 'ANA_9320', forma: 'ret', x: 550, y: 360, w: 470, h: 682, fy: .55 }],
      blocos: [{ top: 72, itens: [['selo'], ['caps', 'O Natal da sua família,', { fs: 40, mt: 22 }], ['script', 'eternizado', { fs: 130, mt: -8 }]] },
               { top: 1080, itens: [['apoio', 'Cortina de veludo, árvore iluminada<br>e a família toda reunida.', { fs: 25 }], ['cta', CTA, { mt: 24 }]] }],
    } },

  // 2 · Casinha do Papai Noel — "Bem-vindos à Casinha do Papai Noel"
  { id: 'n2-casinha', tema: 'vinho', fotos: ['ANA_9390'],
    story: {
      fotos: [{ foto: 'ANA_9390', forma: 'ret', x: 56, y: 56, w: 968, h: 839 }],
      blocos: [{ top: 948, itens: [['selo'], ['caps', 'Bem-vindos à', { fs: 52, mt: 26 }], ['script', 'Casinha do<br>Papai Noel', { fs: 128, mt: -2 }],
        ['apoio', 'Um cenário inteiro de Natal<br>esperando a sua família.', { fs: 31, mt: 16 }], ['cta', CTA, { fs: 25, mt: 32 }]] }],
      ornamento: 1700,
    },
    feed: {
      fotos: [{ foto: 'ANA_9390', forma: 'ret', x: 56, y: 56, w: 968, h: 790, fy: .5 }],
      blocos: [{ top: 892, itens: [['selo'], ['caps', 'Bem-vindos à', { fs: 32, mt: 20 }], ['script', 'Casinha do Papai Noel', { fs: 96, mt: 8 }],
        ['apoio', 'Um cenário inteiro de Natal esperando a sua família.', { fs: 24, mt: 10 }], ['cta', CTA, { mt: 26 }]] }],
    } },

  // 3 · A cartinha para o Papai Noel
  { id: 'n3-cartinha', tema: 'verde', fotos: ['ANA_9178', 'ANA_9363', 'ANA_9359'],
    story: {
      fotos: [{ foto: 'ANA_9178', forma: 'ret', x: 60, y: 646, w: 460, h: 690 },
              { foto: 'ANA_9363', forma: 'ret', x: 560, y: 646, w: 460, h: 690 }],
      blocos: [{ top: 258, itens: [['selo'], ['script', 'A cartinha para<br>o Papai Noel', { fs: 112, mt: 14 }],
          ['caps', 'vira lembrança para a vida toda', { fs: 33, mt: 8 }]] },
        { top: 1376, itens: [['apoio', 'Ensaio de Natal para crianças e famílias.'], ['cta', CTA, { mt: 28 }]] }],
      ornamento: 1700,
    },
    feed: {
      fotos: [{ foto: 'ANA_9359', forma: 'ret', x: 56, y: 56, w: 968, h: 703 }],
      blocos: [{ top: 806, itens: [['selo'], ['script', 'A cartinha para o Papai Noel', { fs: 92, mt: 14 }],
        ['caps', 'vira lembrança para a vida toda', { fs: 30, mt: 6 }], ['apoio', 'Ensaio de Natal para crianças e famílias.', { fs: 24, mt: 18 }],
        ['cta', CTA, { mt: 30 }]] }],
    } },

  // 4 · Neve caindo e sorrisos de verdade
  { id: 'n4-neve', tema: 'vinho', fotos: ['ANA_9265', 'ANA_9215', 'ANA_9209'],
    story: {
      fotos: [{ foto: 'ANA_9265', forma: 'ret', x: 56, y: 56, w: 968, h: 646 },
              { foto: 'ANA_9215', forma: 'ret', x: 56, y: 1200, w: 968, h: 646 }],
      blocos: [{ top: 744, itens: [['selo'], ['script', 'Neve caindo', { fs: 134, mt: 30 }], ['caps', 'e sorrisos de verdade', { fs: 42, mt: -6 }],
        ['apoio', 'Ensaio de Natal com cenário de neve no estúdio.', { fs: 26, mt: 12 }], ['cta', CTA, { mt: 22 }]] }],
    },
    feed: {
      fotos: [{ foto: 'ANA_9209', forma: 'ret', x: 56, y: 626, w: 968, h: 646 }],
      blocos: [{ top: 78, itens: [['selo'], ['script', 'Neve caindo', { fs: 144, mt: 30 }], ['caps', 'e sorrisos de verdade', { fs: 42, mt: -6 }],
        ['apoio', 'Ensaio de Natal com cenário de neve no estúdio.', { fs: 24, mt: 16 }], ['cta', CTA, { mt: 30 }]] }],
    } },

  // 5 · O melhor presente é estar na foto
  { id: 'n5-familia', tema: 'vinho', fotos: ['ANA_9135', 'ANA_9405'],
    story: {
      fotos: [{ foto: 'ANA_9135', forma: 'impresso', x: 74, y: 70, w: 932, h: 670, borda: 16 },
              { foto: 'ANA_9405', forma: 'impresso', x: 74, y: 1214, w: 932, h: 622, borda: 16 }],
      blocos: [{ top: 800, itens: [['selo'], ['caps', 'O melhor presente', { fs: 52, mt: 24 }], ['script', 'é estar na foto', { fs: 140, mt: -6 }],
        ['apoio', 'Ensaio de Natal em família.', { mt: 18 }], ['cta', CTA, { mt: 24 }]] }],
    },
    feed: {
      fotos: [{ foto: 'ANA_9135', forma: 'impresso', x: 74, y: 380, w: 932, h: 670, borda: 16 }],
      blocos: [{ top: 76, itens: [['selo'], ['caps', 'O melhor presente', { fs: 46, mt: 22 }], ['script', 'é estar na foto', { fs: 124, mt: -8 }]] },
               { top: 1102, itens: [['apoio', 'Ensaio de Natal em família.', { fs: 25 }], ['cta', CTA, { mt: 24 }]] }],
    } },

  // 6 · Dois cenários de Natal: escolha o seu
  { id: 'n6-cenarios', tema: 'marfim', fotos: ['ANA_9355', 'ANA_9214'],
    story: {
      fotos: [{ foto: 'ANA_9355', forma: 'arco', x: 60, y: 588, w: 460, h: 690 },
              { foto: 'ANA_9214', forma: 'arco', x: 560, y: 588, w: 460, h: 690, fy: .5 }],
      blocos: [{ top: 258, itens: [['selo'], ['script', 'Dois cenários de Natal', { fs: 112, mt: 12 }], ['caps', 'escolha o seu', { fs: 44, mt: -2 }]] },
               { top: 1440, itens: [['cta', CTA, { fs: 25 }]] }],
      rotulos: { top: 1306, x: 60, w: 960, col: 460, gap: 40, fs: 28, ou: 84, itens: ['Veludo<br>vermelho', 'Casinha do<br>Papai Noel'] },
      ornamento: 1700,
    },
    feed: {
      fotos: [{ foto: 'ANA_9355', forma: 'arco', x: 70, y: 318, w: 450, h: 675 },
              { foto: 'ANA_9214', forma: 'arco', x: 560, y: 318, w: 450, h: 675 }],
      blocos: [{ top: 72, itens: [['selo'], ['script', 'Dois cenários de Natal', { fs: 100, mt: 14 }], ['caps', 'escolha o seu', { fs: 40, mt: -2 }]] },
               { top: 1170, itens: [['cta', CTA]] }],
      rotulos: { top: 1024, x: 70, w: 940, col: 450, gap: 40, fs: 24, ou: 72, itens: ['Veludo<br>vermelho', 'Casinha do<br>Papai Noel'] },
    } },
];

export const TAMANHOS = { story: S, feed: F };
