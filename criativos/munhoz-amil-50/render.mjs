// Renderiza cada peça em Story (1080x1920) e Feed (1080x1350) para final/.
// Uso: node render.mjs [filtro]   ex.: node render.mjs v3
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const require = createRequire(import.meta.url);
const { chromium } = require(path.join(execSync('npm root -g').toString().trim(), 'playwright'));

const ROOT = path.dirname(new URL(import.meta.url).pathname);
const OUT = path.join(ROOT, 'final');
const FORMATS = { story: [1080, 1920], feed: [1080, 1350] };
const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg', '.png': 'image/png', '.ttf': 'font/ttf', '.woff2': 'font/woff2' };

const server = http.createServer((req, res) => {
  const file = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
  if (!file.startsWith(ROOT) || !fs.existsSync(file)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
}).listen(0);
const port = server.address().port;

const filter = process.argv[2] || '';
const pieces = fs.readdirSync(path.join(ROOT, 'pecas')).filter(f => /^v\d.*\.html$/.test(f) && f.includes(filter)).sort();
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
for (const piece of pieces) {
  for (const [fmt, [w, h]] of Object.entries(FORMATS)) {
    const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
    await page.goto(`http://localhost:${port}/pecas/${piece}#${fmt}`);
    await page.waitForFunction(() => window.__ready === true);
    await page.evaluate(() => Promise.all([...document.images].map(i => i.decode().catch(() => {}))));
    const name = `${piece.replace('.html', '')}-${fmt}.png`;
    await page.screenshot({ path: path.join(OUT, name) });
    console.log('ok', name);
    await page.close();
  }
}
await browser.close();
server.close();
