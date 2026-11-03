// Comum aos três layouts: lê a peça (?p=id) e o formato (#story/#feed), monta as molduras das fotos e
// os blocos de oferta, e avisa o render (window.__ready). Conteúdo fixo deste projeto (sem entrada externa).
import { PECAS, FOTOS } from './dados.js';

export const CONDICAO = 'Condição Especial somente em Novembro';
export const NOTA = '*Válido para reservas realizadas em novembro de 2026.';
export const OFERTAS = {
  gestante: { rotulo: 'Ensaio Gestante*', pct: '15%' },
  newborn: { rotulo: 'Combo Gestante + Newborn*', pct: '20%' },
};
// grupo da peça → ofertas que ela mostra (gestante = 15%, newborn = 20%, juntos = as duas)
export const ofertasDo = g => (g === 'juntos' ? ['gestante', 'newborn'] : [g]).map(k => OFERTAS[k]);

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
// fx, fy = ponto da foto (0–1) que fica no centro da janela; zoom = escala desejada (padrão: a mínima que cobre).
export async function montarQuadros(lista, alvo = document.body) {
  window.__escalas = [];
  for (const q of lista) {
    const m = document.createElement('div');
    m.className = `moldura forma-${q.forma || 'ret'}`;
    const b = q.forma === 'impresso' ? (q.borda ?? 16) : 0;
    Object.assign(m.style, { left: `${q.x - b}px`, top: `${q.y - b}px`, width: `${q.w + 2 * b}px`, height: `${q.h + 2 * b}px`,
      transform: q.rot ? `rotate(${q.rot}deg)` : '', zIndex: q.z ?? 1 });
    if (b) m.style.setProperty('--borda', `${b}px`);
    const jan = document.createElement('div'); jan.className = 'janela';
    if (q.forma === 'arco') jan.style.borderRadius = `${q.w / 2}px ${q.w / 2}px 20px 20px`;
    const img = new Image(); img.alt = ''; img.src = `../assets/fotos/originais/${FOTOS[q.foto]}`;
    jan.appendChild(img); m.appendChild(jan);
    if (q.forma === 'arco') {
      const c = document.createElement('div'); c.className = 'contorno';
      c.style.borderRadius = `${q.w / 2 + 16}px ${q.w / 2 + 16}px 34px 34px`; m.appendChild(c);
    }
    alvo.appendChild(m);
    await img.decode();
    const nw = img.naturalWidth, nh = img.naturalHeight, X = 2; // fator de exportação
    const minimo = Math.max(q.w * X / nw, q.h * X / nh);
    const escala = Math.max(minimo, q.zoom || 0);
    const w = nw * escala / X, h = nh * escala / X;
    const left = Math.min(0, Math.max(q.w - w, q.w / 2 - (q.fx ?? .5) * w));
    const top = Math.min(0, Math.max(q.h - h, q.h / 2 - (q.fy ?? .5) * h));
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
