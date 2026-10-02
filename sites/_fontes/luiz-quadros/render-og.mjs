// Gera assets/img/og.jpg e os ícones a partir de og-src.html e icon-src.html
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const here = new URL('.', import.meta.url).pathname;
const img = new URL('../../luiz-quadros/assets/img/', import.meta.url).pathname;
const b = await chromium.launch();
let p = await b.newPage({ viewport: { width: 1200, height: 630 } });
await p.goto('file://' + here + 'og-src.html'); await p.waitForTimeout(600);
await p.screenshot({ path: img + 'og.jpg', type: 'jpeg', quality: 86 });
p = await b.newPage({ viewport: { width: 512, height: 512 } });
await p.goto('file://' + here + 'icon-src.html'); await p.waitForTimeout(600);
await p.screenshot({ path: img + 'icon-512.png' });
await b.close();
