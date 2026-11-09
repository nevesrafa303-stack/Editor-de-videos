// Confere cada peça (pecas/dados.js) nos dois formatos:
//  - nenhuma foto ampliada: escala de exportação ≤ 1 px por px da foto (as fotos só são cortadas/reduzidas);
//  - quanto de cada foto aparece (largura × altura), para o cenário não ser cortado demais (pedido da cliente);
//  - Story: todo texto entre y=230 e y=1536; fonte mínima 19 px (Story) e 16 px (Feed);
//  - contraste WCAG de cada texto contra o fundo real atrás das letras (ferramentas/contraste.py).
// Uso (na pasta do projeto): node ferramentas/conferir.mjs [filtro]
import { createRequire } from 'node:module';
import { execSync, execFileSync } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const require = createRequire(import.meta.url);
const { chromium } = require(path.join(execSync('npm root -g').toString().trim(), 'playwright'));
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const { PECAS } = await import(path.join(ROOT, 'pecas/dados.js'));
const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg', '.png': 'image/png', '.ttf': 'font/ttf' };
const server = http.createServer((req, res) => {
  const file = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
  if (!file.startsWith(ROOT) || !fs.existsSync(file)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
}).listen(0);

const filtro = process.argv[2] || '';
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'conferir-'));
const browser = await chromium.launch();
let falhas = 0;
for (const p of PECAS.filter(x => x.id.includes(filtro))) {
  for (const [fmt, h] of [['story', 1920], ['feed', 1350]]) {
    const page = await browser.newPage({ viewport: { width: 1080, height: h } });
    await page.goto(`http://localhost:${server.address().port}/pecas/peca.html?p=${p.id}#${fmt}`);
    await page.waitForFunction(() => window.__ready === true);
    const escalas = await page.evaluate(() => window.__escalas);
    const textos = await page.evaluate(() => {
      const out = [];
      for (const el of document.querySelectorAll('body *')) {
        if (!el.offsetParent || !el.getClientRects().length) continue;
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
    const comTexto = path.join(tmp, `${p.id}-${fmt}-texto.png`);
    await page.screenshot({ path: comTexto });
    await page.addStyleTag({ content: '*{color:transparent!important;text-shadow:none!important}' });
    const fundo = path.join(tmp, `${p.id}-${fmt}.png`);
    await page.screenshot({ path: fundo });
    await page.close();
    const json = path.join(tmp, `${p.id}-${fmt}.json`);
    fs.writeFileSync(json, JSON.stringify(textos));
    const r = JSON.parse(execFileSync('python3', ['-I', path.join(ROOT, 'ferramentas/contraste.py'), fundo, json, comTexto]).toString());
    const topo = Math.min(...textos.map(t => t.y)), base = Math.max(...textos.map(t => t.y + t.h));
    const menor = Math.min(...textos.map(t => t.fs));
    const erros = [];
    for (const e of escalas) if (e.escala > 1.001) erros.push(`foto ${e.foto} ampliada (${e.escala}x)`);
    if (fmt === 'story' && (topo < 230 || base > 1536)) erros.push(`texto fora da zona segura (y ${Math.round(topo)}–${Math.round(base)})`);
    if (menor < (fmt === 'story' ? 19 : 16)) erros.push(`fonte de ${menor}px abaixo do mínimo`);
    const vistos = new Set();
    for (const c of r.filter(c => !c.ok)) { if (vistos.has(c.texto)) continue; vistos.add(c.texto); erros.push(`contraste ${c.razao}:1 (mín. ${c.min}) em "${c.texto}"`); }
    falhas += erros.length;
    const esc = escalas.map(e => `${e.escala}(${Math.round(e.mostra[0] * 100)}×${Math.round(e.mostra[1] * 100)}%)`).join(' ');
    console.log(`${p.id.padEnd(24)} ${fmt.padEnd(5)} fotos ${esc.padEnd(34)} texto y ${Math.round(topo)}–${Math.round(base)} · fonte ≥${menor}px · contraste ≥${Math.min(...r.map(c => c.razao))}:1 ${erros.length ? '\n   ✗ ' + erros.join('\n   ✗ ') : '✓'}`);
  }
}
await browser.close();
server.close();
process.exit(falhas ? 1 : 0);
