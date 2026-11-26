// Gera a imagem de compartilhamento (Open Graph/Twitter) e o ícone da Apple a partir de og-src.html e
// icon-src.html. Uso: node render-og.mjs (precisa do Playwright com Chromium instalado).
import { chromium } from "playwright";
import path from "node:path";
const aqui = path.dirname(new URL(import.meta.url).pathname);
const app = path.resolve(aqui, "../../reforce/src/app");
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1200, height: 630 } });
await p.goto("file://" + path.join(aqui, "og-src.html"), { waitUntil: "networkidle" });
await p.screenshot({ path: path.join(app, "opengraph-image.jpg"), type: "jpeg", quality: 86 });
await p.screenshot({ path: path.join(app, "twitter-image.jpg"), type: "jpeg", quality: 86 });
await p.setViewportSize({ width: 180, height: 180 });
await p.goto("file://" + path.join(aqui, "icon-src.html"));
await p.screenshot({ path: path.join(app, "apple-icon.png") });
await b.close();
console.log("ok");
