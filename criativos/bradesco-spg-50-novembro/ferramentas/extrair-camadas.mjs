// Converte cada peça (pecas/b*.html, Story e Feed) numa árvore de camadas para montar no Figma:
// retângulos com preenchimento sólido/degradê, cantos, bordas e sombras; SVG (logo, ícones, curvas);
// textos vivos com estilos por trecho; fotos (recortes do Adobe) com máscara de esmaecimento; grupos girados.
// Texturas que o Figma não reproduz (degradê repetido da "fachada") saem como PNG à parte.
// Uso: node ferramentas/extrair-camadas.mjs <pasta-de-saida>
// Saída: <saida>/<peca>-<formato>.json e <saida>/raster-<peca>-<formato>-<n>.png
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const require = createRequire(import.meta.url);
const { chromium } = require(path.join(execSync('npm root -g').toString().trim(), 'playwright'));
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const OUT = path.resolve(process.argv[2] || 'camadas');
fs.mkdirSync(OUT, { recursive: true });
const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.ttf': 'font/ttf' };
const server = http.createServer((req, res) => {
  const file = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
  if (!file.startsWith(ROOT) || !fs.existsSync(file)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
}).listen(0);

// ---------- roda dentro da página ----------
function extrair() {
  const FONTES = { Mont: 'Montserrat', Poppins: 'Poppins' };
  const ESTILOS = { Montserrat: { 800: 'ExtraBold', 900: 'Black' },
    Poppins: { 400: 'Regular', 500: 'Medium', 600: 'SemiBold', 700: 'Bold', 800: 'ExtraBold' } };
  const r2 = v => Math.round(v * 100) / 100;
  const cor = s => {
    const m = s.match(/rgba?\(([^)]+)\)/); if (!m) return null;
    const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number);
    return { r: r2(p[0] / 255), g: r2(p[1] / 255), b: r2(p[2] / 255), a: p.length > 3 ? p[3] : 1 };
  };
  const partes = s => { // separa por vírgula de nível zero
    const out = []; let d = 0, cur = '';
    for (const ch of s) { if (ch === '(') d++; if (ch === ')') d--; if (ch === ',' && d === 0) { out.push(cur.trim()); cur = ''; } else cur += ch; }
    if (cur.trim()) out.push(cur.trim()); return out;
  };
  const sombras = (s, tipo) => { // box-shadow / text-shadow / filter drop-shadow
    if (!s || s === 'none') return [];
    let lista = tipo === 'filtro' ? [...s.matchAll(/drop-shadow\((.*?\))\s*([-\d.]+px)\s+([-\d.]+px)\s+([-\d.]+px)\)/g)]
      .map(m => `${m[1]} ${m[2]} ${m[3]} ${m[4]}`) : partes(s);
    return lista.map(p => {
      const c = cor(p); const nums = p.replace(/rgba?\([^)]*\)/, '').trim().split(/\s+/).map(parseFloat);
      return { type: 'DROP_SHADOW', color: { r: c.r, g: c.g, b: c.b, a: c.a }, offset: { x: nums[0] || 0, y: nums[1] || 0 },
        radius: nums[2] || 0, spread: nums[3] || 0, visible: true, blendMode: 'NORMAL' };
    });
  };
  const inv = m => { // inversa de matriz afim 2x3
    const [[a, c, e], [b, d, f]] = m; const det = a * d - b * c;
    return [[d / det, -c / det, (c * f - d * e) / det], [-b / det, a / det, (b * e - a * f) / det]];
  };
  const paradas = (lista, tam) => {
    const st = lista.map(p => { const c = cor(p); const pos = p.replace(/rgba?\([^)]*\)/, '').trim();
      let v = null; if (pos.endsWith('%')) v = parseFloat(pos) / 100; else if (pos.endsWith('px')) v = parseFloat(pos) / tam;
      return { color: c, position: v }; });
    st.forEach((s, i) => { if (s.position === null) s.position = st.length === 1 ? 0 : i / (st.length - 1); });
    return st.map(s => ({ position: Math.min(1, Math.max(0, r2(s.position * 1000) / 1000)), color: s.color }));
  };
  const degrade = (g, w, h) => { // CSS gradient computado -> pintura do Figma
    const lin = g.match(/^linear-gradient\((.*)\)$/s), rad = g.match(/^radial-gradient\((.*)\)$/s);
    if (lin) {
      const ps = partes(lin[1]); let ang = 180;
      if (/deg$/.test(ps[0])) ang = parseFloat(ps.shift());
      else if (/^to /.test(ps[0])) { const t = ps.shift(); ang = { 'to top': 0, 'to right': 90, 'to bottom': 180, 'to left': 270 }[t] ?? 180; }
      const t = ang * Math.PI / 180, dx = Math.sin(t), dy = -Math.cos(t);
      const L = Math.abs(w * dx) + Math.abs(h * dy);
      const p0 = [w / 2 - dx * L / 2, h / 2 - dy * L / 2], v = [dx * L, dy * L], n = [-v[1], v[0]];
      // M: espaço do degradê -> pixels; depois normaliza por w,h
      const M = [[v[0] / w, n[0] / w, (p0[0] - n[0] * .5) / w], [v[1] / h, n[1] / h, (p0[1] - n[1] * .5) / h]];
      return { type: 'GRADIENT_LINEAR', gradientTransform: inv(M), gradientStops: paradas(ps, L) };
    }
    if (rad) {
      const ps = partes(rad[1]); let rx = w / 2, ry = h / 2, cx = w / 2, cy = h / 2;
      if (!cor(ps[0]) || /at |closest|farthest|%|px/.test(ps[0].replace(/rgba?\([^)]*\)/g, ''))) {
        const forma = ps.shift(); const [tam, onde] = forma.split(' at ');
        const px = (s, base) => s.endsWith('%') ? parseFloat(s) / 100 * base : parseFloat(s);
        if (onde) { const [x, y] = onde.trim().split(/\s+/); cx = px(x, w); cy = px(y ?? '50%', h); }
        const tt = (tam || '').trim().split(/\s+/).filter(Boolean);
        if (tt[0] === 'closest-side') { rx = Math.min(cx, w - cx); ry = Math.min(cy, h - cy); }
        else if (tt.length === 2) { rx = px(tt[0], w); ry = px(tt[1], h); }
        else if (tt.length === 1 && tt[0] !== 'ellipse' && tt[0] !== 'circle') { rx = ry = px(tt[0], w); }
      }
      const M = [[2 * rx / w, 0, (cx - rx) / w], [0, 2 * ry / h, (cy - ry) / h]];
      return { type: 'GRADIENT_RADIAL', gradientTransform: inv(M), gradientStops: paradas(ps, rx) };
    }
    return null;
  };
  const pinturas = (cs, w, h) => {
    const out = [];
    const bc = cor(cs.backgroundColor); if (bc && bc.a > 0) out.push({ type: 'SOLID', color: { r: bc.r, g: bc.g, b: bc.b }, opacity: bc.a });
    if (cs.backgroundImage !== 'none') partes(cs.backgroundImage).reverse().forEach(g => { const p = degrade(g, w, h); if (p) out.push(p); });
    return out;
  };
  const raio = (v, w, h) => v.endsWith('%') ? Math.min(w, h) * parseFloat(v) / 100 : Math.min(parseFloat(v), Math.min(w, h) / 2);
  const visivel = el => { const cs = getComputedStyle(el); return cs.display !== 'none' && cs.visibility !== 'hidden' && parseFloat(cs.opacity) > 0; };
  const nome = el => (el.className && typeof el.className === 'string' ? el.className.trim().split(/\s+/)[0] : el.tagName.toLowerCase());
  const lh = (cs, alt) => cs.lineHeight === 'normal' ? alt : parseFloat(cs.lineHeight);
  const rasters = [];

  const inlineSo = el => [...el.querySelectorAll('*')].every(d => {
    if (/^(svg|img)$/i.test(d.tagName)) return false;
    const ds = getComputedStyle(d).display; return ds === 'inline' || ds === 'none';
  });
  const fonte = cs => {
    const fam = FONTES[cs.fontFamily.split(',')[0].replace(/["']/g, '').trim()] || 'Poppins';
    const w = parseInt(cs.fontWeight); const tab = ESTILOS[fam];
    const sty = tab[w] || tab[Object.keys(tab).reduce((a, b) => Math.abs(b - w) < Math.abs(a - w) ? b : a)];
    return { fam, sty };
  };
  // Monta um bloco de texto (elemento só com filhos inline, ou nó de texto solto)
  const bloco = (raiz, nos, o) => {
    const chars = []; // {ch, est}
    const estilos = [];
    const add = (txt, el) => {
      const cs = getComputedStyle(el); const f = fonte(cs); const c = cor(cs.color);
      const est = { fam: f.fam, sty: f.sty, size: parseFloat(cs.fontSize), color: { r: c.r, g: c.g, b: c.b }, op: c.a,
        ls: cs.letterSpacing === 'normal' ? 0 : parseFloat(cs.letterSpacing), upper: cs.textTransform === 'uppercase' };
      const k = JSON.stringify(est); let i = estilos.findIndex(e => JSON.stringify(e) === k); if (i < 0) { estilos.push(est); i = estilos.length - 1; }
      for (const ch of txt.replace(/[ \t\n\r]+/g, ' ')) {
        const ult = chars[chars.length - 1]?.ch;
        if (ch === ' ' && (!chars.length || ult === ' ' || ult === '\n')) continue;
        chars.push({ ch, est: i });
      }
    };
    const quebra = () => { while (chars.length && chars[chars.length - 1].ch === ' ') chars.pop(); chars.push({ ch: '\n', est: chars.length ? chars[chars.length - 1].est : 0 }); };
    const andar = n => {
      if (n.nodeType === 3) { add(n.textContent, n.parentElement); return; }
      if (n.nodeType !== 1 || getComputedStyle(n).display === 'none') return;
      if (n.tagName === 'BR') { quebra(); return; }
      n.childNodes.forEach(andar);
    };
    nos.forEach(andar);
    while (chars.length && /[ \n]/.test(chars[chars.length - 1].ch)) chars.pop();
    if (!chars.length) return null;
    const texto = chars.map(c => c.ch).join('');
    const runs = []; chars.forEach((c, i) => { const u = runs[runs.length - 1]; if (u && u.est === c.est) u.e = i + 1; else runs.push({ s: i, e: i + 1, est: c.est }); });
    // geometria
    const rg = document.createRange();
    if (nos.length === 1 && nos[0].nodeType === 3) rg.selectNodeContents(nos[0]); else rg.selectNodeContents(raiz);
    const rs = [...rg.getClientRects()].filter(r => r.width > 1 && r.height > 1);
    if (!rs.length) return null;
    // agrupa os retângulos em linhas (trechos de tamanhos diferentes na mesma linha se sobrepõem na vertical)
    const ord = [...rs].sort((a, b) => a.top - b.top); const grupos = [];
    for (const r of ord) { const g = grupos[grupos.length - 1];
      if (g && r.top < g.bottom - Math.min(r.height, g.h) * .4) { g.rs.push(r); g.bottom = Math.max(g.bottom, r.bottom); }
      else grupos.push({ rs: [r], bottom: r.bottom, h: r.height }); }
    const csR = getComputedStyle(raiz);
    const maior = grupos[0].rs.reduce((a, b) => (b.height > a.height ? b : a));
    const alt = lh(csR, maior.height);
    const x = Math.min(...rs.map(r => r.left));
    const y = maior.top - (alt - maior.height) / 2;
    const multi = grupos.length > texto.split('\n').length;
    const b = raiz.getBoundingClientRect();
    const pad = parseFloat(csR.paddingLeft) + parseFloat(csR.paddingRight);
    const w = multi ? b.width - pad + 2 : null;
    const sh = sombras(csR.textShadow, 'texto');
    return { k: 't', n: texto.slice(0, 40).replace(/\n/g, ' '), x: r2(x - o.x), y: r2(y - o.y), w: w && r2(w), lh: r2(alt),
      lhAuto: csR.lineHeight === 'normal', align: csR.textAlign === 'center' ? 'CENTER' : 'LEFT', text: texto,
      runs: runs.map(r => ({ s: r.s, e: r.e, ...estilos[r.est] })), fx: sh };
  };

  const walk = (el, o, itens) => {
    if (!visivel(el)) return;
    const cs = getComputedStyle(el);
    const tag = el.tagName.toLowerCase();
    let b = el.getBoundingClientRect();
    if (tag === 'svg') {
      const c = el.cloneNode(true); const corAtual = cs.color;
      c.setAttribute('width', r2(b.width)); c.setAttribute('height', r2(b.height)); c.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      c.removeAttribute('class');
      const s = new XMLSerializer().serializeToString(c).replace(/currentColor/g, corAtual);
      itens.push({ k: 's', n: el.closest('.logo') ? 'Logo Bradesco Saúde' : (el.closest('[data-icone]') ? 'ícone/' + el.closest('[data-icone]').dataset.icone : 'forma ' + nome(el)),
        x: r2(b.left - o.x), y: r2(b.top - o.y), w: r2(b.width), h: r2(b.height), svg: s });
      return;
    }
    if (tag === 'img') {
      const m = cs.webkitMaskImage || cs.maskImage;
      itens.push({ k: 'i', n: 'Foto · ' + el.getAttribute('src').split('/').pop(), src: el.getAttribute('src').split('/').pop(),
        x: r2(b.left - o.x), y: r2(b.top - o.y), w: r2(b.width), h: r2(b.height), fx: sombras(cs.filter, 'filtro'),
        mask: m && m !== 'none' ? degrade(partes(m)[0], b.width, b.height) : null });
      return;
    }
    // grupo: girado, com sombra de filtro ou com máscara de furos
    const tf = cs.transform !== 'none' ? cs.transform : null;
    const mask = cs.webkitMaskImage && cs.webkitMaskImage !== 'none' ? cs.webkitMaskImage : null;
    const fxFiltro = sombras(cs.filter, 'filtro');
    if ((tf || mask || fxFiltro.length) && el !== document.body) {
      let rot = 0;
      if (tf) { const m = tf.match(/matrix\(([^)]+)\)/)[1].split(',').map(Number); rot = Math.atan2(m[1], m[0]) * 180 / Math.PI; el.style.transform = 'none'; b = el.getBoundingClientRect(); }
      const g = { k: 'f', n: nome(el), x: r2(b.left - o.x), y: r2(b.top - o.y), w: r2(b.width), h: r2(b.height), rot: r2(rot), fx: fxFiltro, itens: [] };
      if (mask) g.furos = [...mask.matchAll(/radial-gradient\(([\d.]+)px at ([\d.]+)(px|%) ([\d.]+)(px|%)/g)]
        .map(m => ({ r: +m[1], cx: m[3] === '%' ? +m[2] / 100 * b.width : +m[2], cy: m[5] === '%' ? +m[4] / 100 * b.height : +m[4] }));
      const o2 = { x: b.left, y: b.top };
      caixa(el, cs, b, o2, g.itens, true);
      filhos(el, o2, g.itens);
      if (tf) el.style.transform = '';
      itens.push(g); return;
    }
    caixa(el, cs, b, o, itens, false);
    filhos(el, o, itens);
  };
  const caixa = (el, cs, b, o, itens, dentro) => {
    if (el === document.body) return;
    const x = r2(b.left - o.x), y = r2(b.top - o.y), w = r2(b.width), h = r2(b.height);
    if (/repeating-linear-gradient/.test(cs.backgroundImage)) {
      if (h <= 4) { // linha tracejada
        const c = cor(cs.backgroundImage); const nums = [...cs.backgroundImage.matchAll(/([\d.]+)px/g)].map(m => +m[1]);
        itens.push({ k: 'l', n: 'linha tracejada', x, y: r2(y + h / 2), w, color: c, peso: h, dash: [nums[1] || 10, (nums[3] || 18) - (nums[1] || 10)] });
      } else { el.dataset.raster = rasters.length; rasters.push(el); itens.push({ k: 'x', n: 'Textura ' + nome(el), x, y, w, h, raster: rasters.length - 1 }); }
      return;
    }
    const fills = pinturas(cs, b.width, b.height);
    const bw = ['Top', 'Right', 'Bottom', 'Left'].map(s => parseFloat(cs['border' + s + 'Width']));
    const bs = ['Top', 'Right', 'Bottom', 'Left'].map(s => cs['border' + s + 'Style']);
    const fx = sombras(cs.boxShadow, 'caixa');
    if (bs[3] === 'dashed' && bw[3] > 0 && bw[0] === 0) { // picote
      itens.push({ k: 'l', n: 'picote', x, y, h, vertical: true, color: cor(cs.borderLeftColor), peso: bw[3], dash: [9, 7] });
    }
    const uniforme = bw.every(v => v === bw[0]) && bw[0] > 0 && bs.every(s => s === 'solid');
    if (!fills.length && !uniforme && !fx.length) return;
    const raios = ['TopLeft', 'TopRight', 'BottomRight', 'BottomLeft'].map(c => raio(cs['border' + c + 'Radius'].split(' ')[0], b.width, b.height));
    const it = { k: 'r', n: nome(el), x, y, w, h, fills, raios, fx, op: parseFloat(cs.opacity),
      css: { bgi: cs.backgroundImage, bgc: cs.backgroundColor, br: raios.map(v => v + 'px').join(' '), sh: cs.boxShadow,
        bd: uniforme ? `${bw[0]}px solid ${cs.borderTopColor}` : null } };
    if (uniforme) { const c = cor(cs.borderTopColor); it.stroke = { color: { r: c.r, g: c.g, b: c.b }, op: c.a, peso: bw[0] }; }
    itens.push(it);
  };
  const filhos = (el, o, itens) => {
    const cs = getComputedStyle(el);
    const temTexto = [...el.querySelectorAll('*')].length >= 0 && el.textContent.trim();
    if (temTexto && el !== document.body && inlineSo(el) && !/^(svg)$/i.test(el.tagName)) {
      const t = bloco(el, [...el.childNodes], o); if (t) itens.push(t); return;
    }
    for (const n of el.childNodes) {
      if (n.nodeType === 3) { if (n.textContent.trim()) { const t = bloco(el, [n], o); if (t) itens.push(t); } continue; }
      if (n.nodeType === 1) walk(n, o, itens);
    }
  };
  const itens = [];
  // fundo da página
  const csb = getComputedStyle(document.body);
  const fb = pinturas(csb, innerWidth, innerHeight);
  if (fb.length) itens.push({ k: 'r', n: 'Fundo', x: 0, y: 0, w: innerWidth, h: innerHeight, fills: fb, raios: [0, 0, 0, 0], fx: [], op: 1,
    css: { bgi: csb.backgroundImage, bgc: csb.backgroundColor, br: '0px', sh: 'none', bd: null } });
  filhos(document.body, { x: 0, y: 0 }, itens);
  return { w: innerWidth, h: innerHeight, itens, rasters: rasters.length };
}

const pecas = fs.readdirSync(path.join(ROOT, 'pecas')).filter(f => /^b\d.*\.html$/.test(f)).sort();
const browser = await chromium.launch();
for (const peca of pecas) {
  for (const [fmt, h] of [['story', 1920], ['feed', 1350]]) {
    const page = await browser.newPage({ viewport: { width: 1080, height: h }, deviceScaleFactor: 2 });
    await page.goto(`http://localhost:${server.address().port}/pecas/${peca}#${fmt}`);
    await page.waitForFunction(() => window.__ready === true);
    const spec = await page.evaluate(extrair);
    const base = `${peca.replace('.html', '')}-${fmt}`;
    // texturas: só o elemento, fundo transparente
    for (let i = 0; i < spec.rasters; i++) {
      await page.evaluate(i => {
        document.body.style.background = 'transparent';
        for (const el of document.body.querySelectorAll('*')) el.style.visibility = 'hidden';
        const alvo = document.querySelector(`[data-raster="${i}"]`); alvo.style.visibility = 'visible';
      }, i);
      const el = await page.$(`[data-raster="${i}"]`);
      await el.screenshot({ path: path.join(OUT, `raster-${base}-${i}.png`), omitBackground: true });
    }
    fs.writeFileSync(path.join(OUT, `${base}.json`), JSON.stringify(spec));
    console.log(base, JSON.stringify(spec).length, 'bytes,', spec.rasters, 'textura(s)');
    await page.close();
  }
}
await browser.close();
server.close();
