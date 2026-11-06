// Ajusta o HTML gerado por gerar-express.py ao que o importador do Adobe Express aceita:
// 1) o Express ignora vertical-align, então cada preço com centavos/R$ "subidos" vira caixas de texto separadas,
//    posicionadas onde o navegador desenhou cada trecho;
// 2) textos centralizados sem largura ganham a largura medida, para continuarem centrados com outra fonte;
// 3) o Express não tem Courier Prime nem Gabarito: Courier Prime vira Inconsolata (a única monoespaçada dele, só
//    Regular) com +0,1em de espaçamento, para manter a largura de cada caractere e as colunas alinhadas;
//    Gabarito vira Figtree, do mesmo desenho geométrico.
// Uso: node ferramentas/preparar-express.mjs <entrada.html> <saida.html>
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const require = createRequire(import.meta.url);
const { chromium } = require(path.join(execFileSync('npm', ['root', '-g']).toString().trim(), 'playwright'));
const [entrada, saida] = process.argv.slice(2).map(p => path.resolve(p));

const navegador = await chromium.launch();
const pagina = await navegador.newPage({ viewport: { width: 1080, height: 1920 } });
await pagina.goto('file://' + entrada, { waitUntil: 'networkidle' });
await pagina.evaluate(() => document.fonts.ready);
const html = await pagina.evaluate(() => {
  const r2 = v => Math.round(v * 100) / 100;
  const slides = [...document.querySelectorAll('.slide')];
  let partidos = 0, larguras = 0;
  for (const slide of slides) {
    // 1) preços com trechos subidos -> uma caixa por trecho
    for (const p of [...slide.querySelectorAll('p')]) {
      const spans = [...p.querySelectorAll(':scope > span')];
      if (!spans.some(s => s.style.verticalAlign)) continue;
      for (const s of spans) {
        // offsetLeft/Top do trecho são relativos ao parágrafo e ignoram rotação do grupo, ao contrário do getBoundingClientRect
        const b = { left: parseFloat(p.style.left) + s.offsetLeft, top: parseFloat(p.style.top) + s.offsetTop, height: s.offsetHeight };
        const q = p.cloneNode(false);
        q.style.left = r2(b.left) + 'px'; q.style.top = r2(b.top) + 'px';
        q.style.removeProperty('width'); q.style.whiteSpace = 'nowrap'; q.style.textAlign = 'left';
        q.style.fontFamily = s.style.fontFamily; q.style.fontWeight = s.style.fontWeight; q.style.fontSize = s.style.fontSize;
        q.style.lineHeight = r2(b.height) + 'px';
        const t = s.cloneNode(true); t.style.removeProperty('vertical-align'); t.style.lineHeight = r2(b.height) + 'px';
        q.appendChild(t); p.before(q);
      }
      p.remove(); partidos++;
    }
    // 2) centralizados sem largura -> largura medida
    for (const p of slide.querySelectorAll('p')) {
      if (p.style.textAlign === 'center' && !p.style.width) {
        p.style.width = Math.ceil(p.offsetWidth + 2) + 'px'; larguras++;
      }
    }
  }
  // 3) troca de fontes (no parágrafo e em cada trecho)
  for (const el of document.querySelectorAll('.slide p, .slide span')) {
    const fam = el.style.fontFamily.replace(/["']/g, '');
    if (fam === 'Courier Prime') {
      const tam = parseFloat(el.style.fontSize || getComputedStyle(el).fontSize);
      const ls = parseFloat(el.style.letterSpacing) || 0;
      el.style.fontFamily = "'Inconsolata'"; el.style.fontWeight = '400';
      el.style.letterSpacing = r2(ls + 0.1 * tam) + 'px';
    } else if (fam === 'Gabarito') el.style.fontFamily = "'Figtree'";
  }
  const link = document.querySelector('link[href*="fonts.googleapis.com/css2"]');
  link.href = 'https://fonts.googleapis.com/css2?family=Montserrat:wght@800;900&family=Poppins:wght@500;600;700'
    + '&family=Inconsolata:wght@400&family=Caveat:wght@700&family=Figtree:wght@700;900&display=swap';
  console.log(`preços partidos: ${partidos}, larguras fixadas: ${larguras}`);
  return '<!doctype html>\n' + document.documentElement.outerHTML;
});
fs.writeFileSync(saida, html);
console.log(saida, html.length);
await navegador.close();
