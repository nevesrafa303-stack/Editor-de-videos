// Gera um HTML único (tudo embutido) da home para testar sem servidor.
// Uso, com o site rodando em produção (cd sites/laks && npm run build && npm start):
//   cd sites/_fontes/laks && npm install && node preview/build-preview.mjs [http://localhost:3000] [saida.html]
// Imagens saem do otimizador do Next (WebP, uma largura por imagem); os vídeos são recomprimidos
// em qualidade menor (ffmpeg) só para a prévia não ficar pesada.
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { build } from "esbuild";

const aqui = path.dirname(new URL(import.meta.url).pathname);
const raizRepo = path.resolve(aqui, "../../../..");
const base = (process.argv[2] || "http://localhost:3000").replace(/\/$/, "");
const saida = path.resolve(process.argv[3] || path.join(raizRepo, "entregas/laks-preview.html"));
const publicDir = path.resolve(aqui, "../../../laks/public");

const cache = new Map();
async function baixar(url, accept) {
  const chave = `${url}|${accept ?? ""}`;
  if (!cache.has(chave)) {
    const r = await fetch(new URL(url, base), { headers: accept ? { Accept: accept } : {} });
    if (!r.ok) throw new Error(`${r.status} ${url}`);
    cache.set(chave, { tipo: r.headers.get("content-type").split(";")[0], dados: Buffer.from(await r.arrayBuffer()) });
  }
  return cache.get(chave);
}
const dataUri = ({ tipo, dados }) => `data:${tipo};base64,${dados.toString("base64")}`;
const desescapar = (s) => s.replace(/&amp;/g, "&");

// Escolhe uma única largura do srcset: o suficiente para telas retina sem pesar demais.
function escolher(srcset, sizes) {
  const cands = srcset.split(",").map((c) => c.trim().split(/\s+/)).map(([u, w]) => ({ u, w: parseInt(w) || 0 }));
  const px = sizes?.match(/(\d+)px\s*$/);
  const alvo = px ? Number(px[1]) * 2 : /100vw/.test(sizes ?? "") || !sizes ? 1600 : 750;
  return (cands.filter((c) => c.w >= alvo).sort((a, b) => a.w - b.w)[0] ?? cands.sort((a, b) => b.w - a.w)[0]).u;
}

async function trocarAssincrono(texto, regex, fn) {
  const partes = [];
  let ultimo = 0;
  for (const m of texto.matchAll(regex)) {
    partes.push(texto.slice(ultimo, m.index), await fn(m));
    ultimo = m.index + m[0].length;
  }
  return partes.join("") + texto.slice(ultimo);
}

let html = (await baixar("/")).dados.toString("utf8");

// CSS embutido, com as fontes dentro.
let css = "";
for (const [, href] of html.matchAll(/<link rel="stylesheet" href="([^"]+)"[^>]*>/g)) {
  let bloco = (await baixar(href)).dados.toString("utf8");
  // As fontes vêm como url(../media/...), relativas ao arquivo CSS.
  bloco = await trocarAssincrono(bloco, /url\((?!["']?(?:data:|#|%23))["']?([^)"']+)["']?\)/g, async (m) =>
    `url(${dataUri(await baixar(new URL(m[1], new URL(href, base)).pathname))})`,
  );
  css += bloco + "\n";
}
html = html.replace(/<link rel="stylesheet"[^>]*>/g, "");
html = html.replace("</head>", () => `<style>${css}</style></head>`);

// Tira o runtime do Next (a prévia usa um script próprio) e links que não fazem sentido offline.
html = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, "");
html = html.replace(/<link rel="(preload|modulepreload|expect|manifest|apple-touch-icon|preconnect|dns-prefetch)"[^>]*>/g, "");
html = await trocarAssincrono(html, /<link rel="icon" href="([^"]+)"[^>]*>/g, async (m) => `<link rel="icon" href="${dataUri(await baixar(desescapar(m[1])))}">`);
html = html.replace(/<meta property="og:[^>]*>|<meta name="twitter:[^>]*>/g, "");

// Imagens do next/image: uma largura em WebP, embutida.
html = await trocarAssincrono(html, /<img\b[^>]*>/g, async (m) => {
  let tag = m[0];
  // O React escreve srcSet (S maiúsculo): os atributos são casados sem diferenciar maiúsculas.
  const srcset = tag.match(/\ssrcset="([^"]+)"/i)?.[1];
  const sizes = tag.match(/\ssizes="([^"]+)"/i)?.[1];
  const src = srcset ? escolher(desescapar(srcset), sizes) : desescapar(tag.match(/\ssrc="([^"]+)"/)[1]);
  tag = tag.replace(/\ssrcset="[^"]*"/i, "").replace(/\ssizes="[^"]*"/i, "");
  return tag.replace(/\ssrc="[^"]*"/, ` src="${dataUri(await baixar(src, "image/webp,*/*"))}"`);
});
html = await trocarAssincrono(html, /<source\b([^>]*)\ssrcset="([^"]+)"([^>]*)>/gi, async (m) =>
  `<source${m[1]} srcset="${dataUri(await baixar(escolher(desescapar(m[2]), "100vw"), "image/webp,*/*"))}"${m[3]}>`,
);

// Links para outras páginas do site não existem na prévia.
html = html.replace(/href="\/(politica-de-privacidade|obrigado1|obrigado2)"/g, 'href="#" data-previa-link=""');

// Vídeos dos depoimentos, recomprimidos para a prévia.
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "laks-previa-"));
const videos = {};
for (const arq of fs.readdirSync(path.join(publicDir, "videos")).filter((f) => f.endsWith(".mp4"))) {
  const id = arq.replace(/^depoimento-/, "").replace(/\.mp4$/, "");
  const destino = path.join(tmp, arq);
  execFileSync("ffmpeg", ["-v", "error", "-y", "-i", path.join(publicDir, "videos", arq), "-vf", "scale=270:-2", "-c:v", "libx264",
    "-preset", "slow", "-crf", "31", "-profile:v", "high", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "48k", "-ac", "1",
    "-movflags", "+faststart", destino]);
  videos[id] = dataUri({ tipo: "video/mp4", dados: fs.readFileSync(destino) });
}
fs.rmSync(tmp, { recursive: true, force: true });

const pacote = await build({
  entryPoints: [path.join(aqui, "entrada.ts")],
  bundle: true,
  minify: true,
  format: "iife",
  target: "es2019",
  write: false,
  legalComments: "none",
});
const js = pacote.outputFiles[0].text.replace(/<\/script/gi, "<\\/script");
// Funções de substituição: o JS minificado tem "$" que o replace com string interpretaria.
html = html.replace(
  "</body>",
  () => `<script>window.__LAKS_VIDEOS__=${JSON.stringify(videos)};</script><script>${js}</script></body>`,
);

const sobras = [...html.matchAll(/(?:src|href|srcset|poster)="(\/[^"]*)"/gi)].map((m) => m[1]).filter((u) => u !== "/");
const cssSobras = [...html.matchAll(/url\((?!["']?(?:data:|#|%23))([^)]+)\)/g)].map((m) => m[1]);
sobras.push(...cssSobras);
if (sobras.length) throw new Error("Referências locais não embutidas: " + [...new Set(sobras)].slice(0, 10).join(", "));

fs.mkdirSync(path.dirname(saida), { recursive: true });
fs.writeFileSync(saida, html);
console.log(`${saida}: ${(fs.statSync(saida).size / 1e6).toFixed(2)} MB`);
