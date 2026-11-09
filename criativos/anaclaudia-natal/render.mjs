// Renderiza as 6 peças de pecas/dados.js em Story e Feed, em 2x (Story 2160x3840, Feed 2160x2700), para final/.
// Uso: node render.mjs [filtro]   ex.: node render.mjs n3
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { PECAS } from './pecas/dados.js';

const require = createRequire(import.meta.url);
const { chromium } = require(path.join(execSync('npm root -g').toString().trim(), 'playwright'));

const ROOT = path.dirname(new URL(import.meta.url).pathname);
const OUT = path.join(ROOT, 'final');
const FORMATS = { story: [1080, 1920], feed: [1080, 1350] };
const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg', '.png': 'image/png', '.ttf': 'font/ttf' };

const server = http.createServer((req, res) => {
  const file = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
  if (!file.startsWith(ROOT) || !fs.existsSync(file)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
}).listen(0);
const port = server.address().port;

const filtro = process.argv[2] || '';
fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();
for (const p of PECAS.filter(x => x.id.includes(filtro))) {
  for (const [fmt, [w, h]] of Object.entries(FORMATS)) {
    const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 2 });
    await page.goto(`http://localhost:${port}/pecas/peca.html?p=${p.id}#${fmt}`);
    await page.waitForFunction(() => window.__ready === true);
    const nome = `${p.id}-${fmt}.png`;
    await page.screenshot({ path: path.join(OUT, nome) });
    console.log('ok', nome, JSON.stringify(await page.evaluate(() => window.__escalas)));
    await page.close();
  }
}
await browser.close();
server.close();
