// Comum aos três layouts: lê a peça (?p=id) e o formato (#story/#feed), monta as molduras das fotos e
// os blocos de oferta, e avisa o render (window.__ready). Conteúdo fixo deste projeto (sem entrada externa).
import { PECAS, FOTOS } from './dados.js';

export const CONDICAO = 'Condição Especial somente em Novembro';
export const NOTA = '*Válido para reservas realizadas em novembro de 2026.';
// Pedido de 03/11: deixar claro que é ensaio fotográfico. Gestante sozinha = 15%, newborn sozinho = 20% e
// as peças com as duas fotos (grupo juntos) = Combo Gestante + Newborn 20%.
export const OFERTAS = {
  gestante: { rotulo: 'Ensaio de Gestante*', pct: '15%' },
  newborn: { rotulo: 'Ensaio de Newborn*', pct: '20%' },
  combo: { rotulo: 'Combo Gestante + Newborn*', pct: '20%' },
};
export const pctHTML = o => `<span class="pct-linha"><span class="pct">${o.pct}</span><span class="off">OFF</span></span>`;

export function peca() {
  const fmt = location.hash.slice(1) || 'story';
  const id = new URLSearchParams(location.search).get('p');
  const p = PECAS.find(x => x.id === id) || PECAS[0];
  document.body.classList.add(fmt, `grupo-${p.grupo}`, `fotos-${p.quadros[fmt].length}`);
  if (p.variante) document.body.classList.add(p.variante);
  return { p, fmt };
}

// Molduras: x, y, w, h = janela da foto em px da peça (1080 de largura; exportada em 2x).
// A foto só é cortada e reduzida: escala = px exportados por px da foto original, nunca acima de 1.
// regiao = [x0, y0, x1, y1] (0–1): parte da foto que tem de aparecer inteira e centralizada na janela
// (a pessoa ou o bebê com uma folga); sem regiao, usa fx/fy (centro) e zoom (escala), como antes.
// legenda: no impresso, a borda de baixo é mais alta e leva um texto. Chave de OFERTAS → rótulo + desconto;
// qualquer outro texto → só esse texto (ex.: 'Ensaio de Gestante' nas peças do combo).
export async function montarQuadros(lista, alvo = document.body) {
  window.__escalas = [];
  for (const q of lista) {
    const m = document.createElement('div');
    m.className = `moldura forma-${q.forma || 'ret'}`;
    const b = q.forma === 'impresso' ? (q.borda ?? 16) : 0;
    const leg = q.legenda ? (q.leg ?? 132) : 0;
    Object.assign(m.style, { left: `${q.x - b}px`, top: `${q.y - b}px`, width: `${q.w + 2 * b}px`, height: `${q.h + 2 * b + leg}px`,
      transform: q.rot ? `rotate(${q.rot}deg)` : '', zIndex: q.z ?? 1 });
    if (b) { m.style.setProperty('--borda', `${b}px`); m.style.setProperty('--leg', `${leg}px`); }
    const jan = document.createElement('div'); jan.className = 'janela';
    if (q.forma === 'arco') jan.style.borderRadius = `${q.w / 2}px ${q.w / 2}px 20px 20px`;
    const img = new Image(); img.alt = ''; img.src = `../assets/fotos/originais/${FOTOS[q.foto]}`;
    jan.appendChild(img); m.appendChild(jan);
    if (q.forma === 'arco') {
      const c = document.createElement('div'); c.className = 'contorno';
      c.style.borderRadius = `${q.w / 2 + 16}px ${q.w / 2 + 16}px 34px 34px`; m.appendChild(c);
    }
    if (q.legenda) {
      const o = OFERTAS[q.legenda], l = document.createElement('div'); l.className = 'legenda';
      l.innerHTML = o ? `<span class="rot">${o.rotulo}</span>${pctHTML(o)}` : `<span class="nome">${q.legenda}</span>`;
      m.appendChild(l);
    }
    alvo.appendChild(m);
    await img.decode();
    const nw = img.naturalWidth, nh = img.naturalHeight, X = 2; // fator de exportação
    const minimo = Math.max(q.w * X / nw, q.h * X / nh);
    let escala = Math.max(minimo, q.zoom || 0), fx = q.fx ?? .5, fy = q.fy ?? .5;
    if (q.regiao) {
      const [x0, y0, x1, y1] = q.regiao;
      escala = Math.max(minimo, Math.min(q.w * X / ((x1 - x0) * nw), q.h * X / ((y1 - y0) * nh)));
      fx = (x0 + x1) / 2; fy = (y0 + y1) / 2;
    }
    const w = nw * escala / X, h = nh * escala / X;
    const left = Math.min(0, Math.max(q.w - w, q.w / 2 - fx * w));
    const top = Math.min(0, Math.max(q.h - h, q.h / 2 - fy * h));
    Object.assign(img.style, { width: `${w}px`, height: `${h}px`, left: `${left}px`, top: `${top}px` });
    window.__escalas.push({ foto: q.foto, escala: +escala.toFixed(3) });
  }
}

export async function pronto() {
  document.body.offsetHeight;
  await Promise.all(['400 40px Bellefair', '400 40px "Gilda Display"', '500 20px Montserrat', '600 20px Montserrat', '700 20px Montserrat']
    .map(f => document.fonts.load(f)));
  await document.fonts.ready;
  await Promise.all([...document.images].map(i => i.decode().catch(() => {})));
  window.__ready = true;
}
