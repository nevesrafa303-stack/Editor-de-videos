// Corpo do script use_figma (Plugin API) que monta uma variação (Story + Feed) a partir das camadas
// extraídas por extrair-camadas.mjs. gerar-figma.py injeta a especificação (SPEC) e o traçado do logo (LOGO_D).
const SPEC = __SPEC__;
const LOGO_D = __LOGO_D__;
const fontes = new Set();
const coletar = itens => itens.forEach(it => {
  if (it.k === 't') it.runs.forEach(r => fontes.add(r.fam + '|' + r.sty));
  if (it.k === 'f') coletar(it.itens);
});
SPEC.quadros.forEach(q => coletar(q.itens));
await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
const faltando = [];
for (const f of fontes) {
  const [family, style] = f.split('|');
  try { await figma.loadFontAsync({ family, style }); } catch (e) { faltando.push(f); }
}
const fonteDe = r => faltando.includes(r.fam + '|' + r.sty) ? { family: 'Inter', style: 'Regular' } : { family: r.fam, style: r.sty };
const solido = (c, op = 1) => ({ type: 'SOLID', color: { r: c.r, g: c.g, b: c.b }, opacity: op });
const fotos = [], texturas = [], erros = [];

async function montar(pai, itens) {
  for (const it of itens) {
    try {
      if (it.k === 'r' || it.k === 'x') {
        const n = figma.createRectangle();
        n.name = it.k === 'x' ? it.n : it.n;
        n.resize(Math.max(it.w, 0.01), Math.max(it.h, 0.01));
        n.fills = it.k === 'x' ? [] : it.fills;
        if (it.raios) [n.topLeftRadius, n.topRightRadius, n.bottomRightRadius, n.bottomLeftRadius] = it.raios;
        if (it.stroke) { n.strokes = [solido(it.stroke.color, it.stroke.op)]; n.strokeWeight = it.stroke.peso; n.strokeAlign = 'INSIDE'; if (it.stroke.dash) n.dashPattern = [7, 6]; }
        if (it.fx && it.fx.length) n.effects = it.fx;
        if (it.op !== undefined && it.op < 1) n.opacity = it.op;
        pai.appendChild(n); n.x = it.x; n.y = it.y;
        if (it.k === 'x') texturas.push({ id: n.id, raster: it.raster });
      } else if (it.k === 's') {
        const n = figma.createNodeFromSvg(it.svg.replace('__D__', LOGO_D));
        n.name = it.n; pai.appendChild(n); n.x = it.x; n.y = it.y;
      } else if (it.k === 'l') {
        const w = it.vertical ? it.peso : it.w, h = it.vertical ? it.h : it.peso;
        const hex = '#' + [it.color.r, it.color.g, it.color.b].map(v => Math.round(v * 255).toString(16).padStart(2, '0')).join('');
        const [x1, y1, x2, y2] = it.vertical ? [w / 2, 0, w / 2, h] : [0, h / 2, w, h / 2];
        const n = figma.createNodeFromSvg(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${hex}" stroke-width="${it.peso}" stroke-dasharray="${it.dash.join(' ')}"/></svg>`);
        n.name = it.n; pai.appendChild(n); n.x = it.x; n.y = it.vertical ? it.y : it.y - h / 2;
      } else if (it.k === 'i') {
        const n = figma.createRectangle();
        n.name = it.n; n.resize(it.w, it.h);
        n.fills = [{ type: 'SOLID', color: { r: .85, g: .85, b: .85 }, opacity: .4 }];
        if (it.fx && it.fx.length) n.effects = it.fx;
        if (it.mask) {
          const m = figma.createRectangle();
          m.name = 'Máscara (esmaece a borda)'; m.resize(it.w, it.h); m.fills = [it.mask];
          pai.appendChild(m); m.x = it.x; m.y = it.y;
          pai.appendChild(n); n.x = it.x; n.y = it.y;
          m.isMask = true; m.maskType = 'ALPHA';
          const g = figma.group([m, n], pai); g.name = 'Pessoas · recorte Adobe Photoshop';
        } else { pai.appendChild(n); n.x = it.x; n.y = it.y; }
        fotos.push({ id: n.id, src: it.src });
      } else if (it.k === 't') {
        const n = figma.createText();
        const r0 = it.runs[0];
        n.fontName = fonteDe(r0);
        n.characters = it.text;
        for (const r of it.runs) {
          n.setRangeFontName(r.s, r.e, fonteDe(r));
          n.setRangeFontSize(r.s, r.e, r.size);
          n.setRangeFills(r.s, r.e, [solido(r.color, r.op)]);
          n.setRangeLetterSpacing(r.s, r.e, { unit: 'PIXELS', value: r.ls });
          n.setRangeTextCase(r.s, r.e, r.upper ? 'UPPER' : 'ORIGINAL');
        }
        n.lineHeight = it.lhAuto ? { unit: 'AUTO' } : { unit: 'PIXELS', value: it.lh };
        n.textAlignHorizontal = it.align;
        if (it.w) { n.textAutoResize = 'HEIGHT'; n.resize(it.w, n.height); } else n.textAutoResize = 'WIDTH_AND_HEIGHT';
        if (it.fx && it.fx.length) n.effects = it.fx;
        n.name = it.n; pai.appendChild(n); n.x = it.x; n.y = it.y;
      } else if (it.k === 'f') {
        const n = figma.createFrame();
        n.name = it.n; n.resize(it.w, it.h); n.fills = []; n.clipsContent = false;
        pai.appendChild(n); n.x = it.x; n.y = it.y;
        await montar(n, it.itens);
        if (it.furos && it.furos.length) {
          const base = figma.createRectangle(); base.resize(it.w, it.h); n.appendChild(base);
          const partes = [base];
          for (const f of it.furos) {
            const e = figma.createEllipse(); e.resize(2 * f.r, 2 * f.r); n.appendChild(e); e.x = f.cx - f.r; e.y = f.cy - f.r; partes.push(e);
          }
          const sub = figma.subtract(partes, n); sub.name = 'Máscara dos furos do picote'; sub.isMask = true; n.insertChild(0, sub);
        }
        if (it.fx && it.fx.length) n.effects = it.fx;
        if (it.rot) {
          const t = it.rot * Math.PI / 180, a = Math.cos(t), b = Math.sin(t), cx = it.x + it.w / 2, cy = it.y + it.h / 2;
          n.relativeTransform = [[a, -b, cx - (a * it.w / 2 - b * it.h / 2)], [b, a, cy - (b * it.w / 2 + a * it.h / 2)]];
        }
      }
    } catch (e) { erros.push((it.n || it.k) + ': ' + e.message); }
  }
}

const quadros = [];
for (const q of SPEC.quadros) {
  const fr = figma.createFrame();
  fr.name = q.nome; fr.resize(q.w, q.h); fr.clipsContent = true; fr.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
  figma.currentPage.appendChild(fr); fr.x = q.x; fr.y = q.y;
  await montar(fr, q.itens);
  quadros.push({ id: fr.id, nome: fr.name, filhos: fr.findAll(() => true).length });
}
return { quadros, fotos, texturas, fontesFaltando: faltando, erros };
