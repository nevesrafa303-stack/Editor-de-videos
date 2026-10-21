// Gera a imagem de compartilhamento (og) e o ícone da Apple a partir de og-src.html e icon-src.html.
// Uso: node render-og.mjs   (precisa do Playwright: npm i -g playwright, ou PLAYWRIGHT_MODULE=/caminho/playwright)
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const here = new URL('.', import.meta.url).pathname;
const app = new URL('../../laks/src/app/', import.meta.url).pathname;
const b = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const p = await b.newPage({ viewport: { width: 1200, height: 630 } });
await p.goto('file://' + here + 'og-src.html', { waitUntil: 'networkidle' });
await p.evaluate(() => document.fonts.ready);
for (const nome of ['opengraph-image.jpg', 'twitter-image.jpg']) {
  await p.screenshot({ path: app + nome, type: 'jpeg', quality: 86 });
}
await p.setViewportSize({ width: 180, height: 180 });
await p.goto('file://' + here + 'icon-src.html');
await p.screenshot({ path: app + 'apple-icon.png' });
await b.close();
console.log('ok:', app);
