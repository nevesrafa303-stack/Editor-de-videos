// Comum a todos os layouts: lê a peça (?p=id) e o formato (#story ou #feed)
// e avisa o render quando fontes e imagens estiverem prontas (window.__ready).
import { PECAS, FOTOS } from './dados.js';

export function peca() {
  const fmt = location.hash.slice(1) || 'story';
  document.body.classList.add(fmt);
  const id = new URLSearchParams(location.search).get('p');
  const p = PECAS.find(x => x.id === id) || PECAS[0];
  document.body.classList.add(`tema-${p.tema || 'escuro'}`);
  return { p, fmt, foto: `../assets/fotos/${FOTOS[p.foto]}`, recorte: `../assets/fotos/recortes/${p.foto}.png` };
}

export function posiciona(el, q) {
  Object.assign(el.style, { width: `${q.w}px`, left: `${q.x}px`, top: `${q.y}px` });
}

export async function pronto() {
  document.body.offsetHeight; // força o layout para as fontes começarem a carregar
  await Promise.all(['400 40px Bellefair', '400 40px "Gilda Display"', '500 20px Montserrat', '600 20px Montserrat', '700 20px Montserrat']
    .map(f => document.fonts.load(f)));
  await document.fonts.ready;
  await Promise.all([...document.images].map(i => i.decode().catch(() => {})));
  window.__ready = true;
}

// Textos pedidos pela cliente
export const CONDICAO = 'Condição Especial somente em Novembro';
export const NOTA = '*Válido para reservas realizadas em novembro de 2026.';
