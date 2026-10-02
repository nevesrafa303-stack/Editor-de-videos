// Gera assets/guia-investidor-luiz-quadros.pdf a partir de guia-src.html
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const here = new URL('.', import.meta.url).pathname;
const out = new URL('../../luiz-quadros/assets/guia-investidor-luiz-quadros.pdf', import.meta.url).pathname;
const b = await chromium.launch();
const p = await b.newPage();
await p.goto('file://' + here + 'guia-src.html', { waitUntil: 'networkidle' });
await p.waitForTimeout(500);
await p.pdf({ path: out, format: 'A4', printBackground: true, preferCSSPageSize: true });
await b.close();
console.log(out);
