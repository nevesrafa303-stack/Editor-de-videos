// Confere as regras do CLAUDE.md em cada peça (pecas/b*.html), nos dois formatos:
//  - Story: todo texto entre y=230 e y=1536 (zonas cobertas pela interface ficam livres);
//  - tamanho mínimo do texto: 19 px no Story, 16 px no Feed;
//  - contraste (WCAG): 4,5:1 para texto comum e 3:1 para texto grande (≥24 px, ou ≥18,7 px em negrito),
//    medido contra o fundo real renderizado (pior caso dentro da caixa do texto).
// Uso: node ferramentas/conferir.mjs [filtro]
import { createRequire } from 'node:module';
import { execSync, execFileSync } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const require = createRequire(import.meta.url);
const { chromium } = require(path.join(execSync('npm root -g').toString().trim(), 'playwright'));
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg', '.png': 'image/png', '.ttf': 'font/ttf' };
const server = http.createServer((req, res) => {
  const file = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
  if (!file.startsWith(ROOT) || !fs.existsSync(file)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
}).listen(0);

const filtro = process.argv[2] || '';
const pecas = fs.readdirSync(path.join(ROOT, 'pecas')).filter(f => /^[abs]\d.*\.html$/.test(f) && f.includes(filtro)).sort();
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'conferir-'));
const browser = await chromium.launch();
let falhas = 0;
for (const peca of pecas) {
  for (const [fmt, h] of [['story', 1920]]) {
    const page = await browser.newPage({ viewport: { width: 1080, height: h } });
    await page.goto(`http://localhost:${server.address().port}/pecas/${peca}#${fmt}`);
    await page.waitForFunction(() => window.__ready === true);
    const textos = await page.evaluate(() => {
      const out = [];
      for (const el of document.querySelectorAll('body *')) {
        if (!el.offsetParent && getComputedStyle(el).position !== 'fixed') continue;
        if (![...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())) continue;
        // caixas só das letras (Range dos nós de texto), sem padding nem borda do elemento
        const cs = getComputedStyle(el);
        for (const n of el.childNodes) {
          if (n.nodeType !== 3 || !n.textContent.trim()) continue;
          const rg = document.createRange(); rg.selectNodeContents(n);
          for (const r of rg.getClientRects()) {
            if (r.width < 2 || r.height < 2) continue;
            out.push({ texto: el.textContent.trim().slice(0, 40), x: r.left, y: r.top, w: r.width, h: r.height,
              fs: parseFloat(cs.fontSize), peso: parseInt(cs.fontWeight), cor: cs.color });
          }
        }
      }
      return out;
    });
    // duas fotos da página: com texto e sem texto. Onde elas diferem estão as letras;
    // o contraste é medido só contra o fundo que fica atrás das letras.
    const comTexto = path.join(tmp, `${peca}-${fmt}-texto.png`);
    await page.screenshot({ path: comTexto });
    await page.addStyleTag({ content: '*{color:transparent!important;text-shadow:none!important;-webkit-text-stroke:0!important}' });
    const png = path.join(tmp, `${peca}-${fmt}.png`);
    await page.screenshot({ path: png });
    await page.close();
    const json = path.join(tmp, `${peca}-${fmt}.json`);
    fs.writeFileSync(json, JSON.stringify(textos));
    const r = JSON.parse(execFileSync('python3', ['-I', path.join(ROOT, 'ferramentas/contraste.py'), png, json, comTexto]).toString());
    const topo = Math.min(...textos.map(t => t.y)), base = Math.max(...textos.map(t => t.y + t.h));
    const menor = Math.min(...textos.map(t => t.fs));
    const erros = [];
    if (fmt === 'story' && (topo < 290 || base > 1536)) erros.push(`texto fora da zona segura Story + recorte do Feed (y ${Math.round(topo)}–${Math.round(base)})`);
    if (menor < (fmt === 'story' ? 19 : 16)) erros.push(`fonte de ${menor}px abaixo do mínimo`);
    const vistos = new Set();
    for (const c of r.filter(c => !c.ok)) { if (vistos.has(c.texto)) continue; vistos.add(c.texto); erros.push(`contraste ${c.razao}:1 (mín. ${c.min}) em "${c.texto}"`); }
    falhas += erros.length;
    console.log(`${peca.padEnd(22)} ${fmt.padEnd(5)} texto y ${Math.round(topo)}–${Math.round(base)} · menor fonte ${menor}px · pior contraste ${Math.min(...r.map(c => c.razao))}:1 ${erros.length ? '\n   ✗ ' + erros.join('\n   ✗ ') : '✓'}`);
  }
}
await browser.close();
server.close();
process.exit(falhas ? 1 : 0);
