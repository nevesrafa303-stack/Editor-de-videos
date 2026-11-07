// core.mjs — peças comuns da variação 3 (benefícios, viajantes) do anúncio "Vila Nova Star pelo CNPJ/MEI" (story 9:16): tempos da locução,
// utilidades de animação (palavras, tremida), vídeos, ícones, fonte das informações do hospital,
// avisos legais obrigatórios, grão/clarões e a escrita do index.html com trilha, locução e efeitos.
// O visual fica no build.mjs. Base: ../sao-luiz-capital-cnpj/tools/core.mjs.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
export const W = 1080;
export const H = 1920;
export const FPS = 30;
export const r3 = (x) => Math.round(x * 1000) / 1000;

// ───────────── locução e grade da trilha ─────────────
export const WORDS = JSON.parse(readFileSync(join(ROOT, "assets/voice/vo.words.json"), "utf8"));
export const GRID = JSON.parse(readFileSync(join(ROOT, "tools/grid.json"), "utf8"));
export const D = GRID.total;
const norm = (s) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]/g, "");
function word(text, after = 0) {
  const w = WORDS.find((x) => norm(x.word) === norm(text) && x.start >= after - 0.001);
  if (!w) throw new Error(`palavra não encontrada: ${text} depois de ${after}`);
  return w;
}
export const at = (t, after = 0) => word(t, after).start;
export const end = (t, after = 0) => word(t, after).end;
// inícios de uma sequência de palavras faladas, a partir de `after`
export function seq(text, after = 0) {
  const out = [];
  let t = after;
  for (const w of text.split(" ")) {
    t = at(w, t);
    out.push(t);
    t += 0.01;
  }
  return out;
}

// ───────────── fontes, palavras e composições ─────────────
export const fontFaces = (list) =>
  list
    .map(([f, w, file, style = "normal"]) => `@font-face{font-family:"${f}";font-weight:${w};font-style:${style};font-display:block;src:url("assets/fonts/${file}.woff2") format("woff2");}`)
    .join("\n");

export function wspans(p, text, cls = "") {
  return text
    .split(" ")
    .map((w, i) => `<span class="w"><span class="wi${cls ? " " + cls : ""}" id="${p}${i}">${w}</span></span>`)
    .join(" ");
}

// estilos que toda cena usa (a variação acrescenta os dela)
export const baseCss = (p) => `
#${p}-root{position:absolute;inset:0;width:${W}px;height:${H}px;overflow:hidden;}
.${p}-full{position:absolute;left:0;top:0;width:${W}px;height:${H}px;}
.w{display:inline-block;overflow:hidden;vertical-align:top;padding:0.1em 0.04em 0.06em;margin:-0.1em -0.04em -0.06em;}
.wi{display:inline-block;}
.ln{position:absolute;left:0;width:${W}px;text-align:center;white-space:nowrap;}
.vw{position:absolute;overflow:hidden;}
.vw video,.vw img{position:absolute;left:0;top:0;width:100%;height:100%;object-fit:cover;display:block;}
.roll{display:inline-flex;overflow:hidden;vertical-align:top;font-variant-numeric:tabular-nums;}
.rd{display:inline-block;overflow:hidden;}
.rs{display:flex;flex-direction:column;text-align:center;}
.rs span{display:block;}
.rc{display:inline-block;}
`;

export function scene(id, dur, css, body, lines) {
  return {
    id,
    dur: r3(dur),
    html: `<template>
<style>${css}</style>
<div id="${id}-root" data-composition-id="${id}" data-start="0" data-duration="${r3(dur)}" data-width="${W}" data-height="${H}">${body}
</div>
<script>
(function(){
const tl = gsap.timeline({ paused: true });
${lines.join("\n")}
window.__timelines["${id}"] = tl;
})();
</script>
</template>
`,
  };
}

// vídeo de banco (sem som) dentro de uma cena, com início local à cena
export const video = (id, name, t0, dur) =>
  `<video id="${id}" class="clip" src="assets/video/${name}.mp4" muted playsinline data-start="${r3(t0)}" data-duration="${r3(dur)}"></video>`;

export function TL(st) {
  const a = [];
  const L = (g) => r3(g - st);
  const add = (s) => a.push(s);
  // palavras de uma linha subindo cada uma na hora em que é falada (tempos absolutos)
  const words = (p, times, dur = 0.4) =>
    times.forEach((t, i) =>
      add(`tl.fromTo("#${p}${i}",{yPercent:110,opacity:0},{yPercent:0,opacity:1,duration:${dur},ease:"power3.out"},${r3(Math.max(0, L(t) - 0.06))});`),
    );
  const shake = (sel, t, amp = 10) =>
    [1, -0.8, 0.5, -0.25, 0].forEach((q, i) => add(`tl.set("${sel}",{x:${r3(q * amp)},y:${r3(-q * amp * 0.6)}},${r3(t + i / FPS)});`));
  // número que rola até o valor: uma coluna 0–9 por dígito (só transform, seguro para seek); os
  // dígitos só aparecem quando começam a rolar
  const roll = (id, text, t0, t1, lh) => {
    add(`tl.fromTo("#${id}-rw",{opacity:0},{opacity:1,duration:0.15},${r3(Math.max(0, t0 - 0.05))});`);
    [...text]
      .filter((c) => /\d/.test(c))
      .map(Number)
      .forEach((d, i) => {
        const s = r3(t0 + i * 0.05);
        add(`tl.fromTo("#${id}${i}",{y:0},{y:${-(10 + d) * lh},duration:${r3(Math.max(0.3, t1 - s))},ease:"power3.out"},${s});`);
      });
  };
  return { a, L, add, words, shake, roll };
}
export function rollHTML(id, text, size, lh) {
  let k = 0;
  return (
    `<span class="roll" id="${id}-rw" style="height:${lh}px;font-size:${size}px;line-height:${lh}px">` +
    [...text]
      .map((ch) => {
        if (!/\d/.test(ch)) return `<span class="rc">${ch}</span>`;
        const i = k++;
        return `<span class="rd" style="height:${lh}px"><span class="rs" id="${id}${i}" data-layout-allow-overflow data-layout-allow-occlusion>${Array.from({ length: 20 }, (_, j) => `<span>${j % 10}</span>`).join("")}</span></span>`;
      })
      .join("") +
    `</span>`
  );
}

const ICONS = {
  check: `<path d="M12 25l8 8 16-18"/>`,
  x: `<path d="M14 14l20 20M34 14L14 34"/>`,
  building: `<path d="M8 42V10l16-5v37M24 16l16 5v21M4 42h40M14 16h4M14 23h4M14 30h4M30 26h4M30 33h4"/>`,
  person: `<circle cx="24" cy="15" r="8"/><path d="M8 44c0-9 7-16 16-16s16 7 16 16"/>`,
  child: `<circle cx="24" cy="19" r="6.5"/><path d="M12 44c0-7.5 5.5-13 12-13s12 5.5 12 13"/>`,
  view: `<rect x="6" y="8" width="36" height="32" rx="3"/><path d="M24 8v32M6 24h36"/>`,
  bell: `<path d="M6 37h36M24 13v-4M20 9h8M9 37a15 15 0 0 1 30 0"/>`,
  chef: `<path d="M15 41h18v-8H15zM15 33c-5 0-8-3.5-8-8a7 7 0 0 1 8.5-6.8 8.5 8.5 0 0 1 17 0A7 7 0 0 1 41 25c0 4.5-3 8-8 8"/>`,
  bed: `<path d="M5 38V12M5 30h38v8M5 24h38v6M12 24v-5h10v5"/>`,
  moon: `<path d="M34 30A14 14 0 0 1 20 10a14 14 0 1 0 14 20z"/>`,
  icu: `<path d="M4 34h40M8 34V22h32v12M14 22v-6h12v6M30 28h6M33 25v6"/><path d="M6 40v-6M42 40v-6"/>`,
  scan: `<rect x="6" y="10" width="36" height="28" rx="14"/><circle cx="24" cy="24" r="7"/>`,
  plane: `<path d="M21 4h4l10 17 9 1c2 0 3 1 3 2s-1 2-3 2l-9 1-10 17h-4l5-17-9-1-4 5h-3l2-7-2-7h3l4 5 9-1z"/>`,
  video: `<rect x="5" y="13" width="26" height="22" rx="4"/><path d="M31 21l12-7v20l-12-7z"/>`,
  phone: `<rect x="14" y="4" width="20" height="40" rx="4"/><path d="M21 38h6"/>`,
  globe: `<circle cx="24" cy="24" r="18"/><path d="M6 24h36M24 6c-7 6-7 30 0 36M24 6c7 6 7 30 0 36"/>`,
  suitcase: `<rect x="6" y="14" width="36" height="26" rx="4"/><path d="M18 14V8h12v6M6 26h36"/>`,
  pin: `<path d="M24 44s14-13.5 14-24a14 14 0 0 0-28 0c0 10.5 14 24 14 24z"/><circle cx="24" cy="20" r="5"/>`,
  people: `<circle cx="17" cy="16" r="6"/><circle cx="33" cy="16" r="6"/><path d="M4 40c0-7 6-12 13-12s13 5 13 12M30 28c7 0 14 5 14 12"/>`,
  family: `<circle cx="15" cy="13" r="5.5"/><circle cx="33" cy="13" r="5.5"/><circle cx="24" cy="26" r="4"/><path d="M5 40c0-6.5 4.5-11 10-11 3 0 5.5 1.2 7 3M43 40c0-6.5-4.5-11-10-11-3 0-5.5 1.2-7 3M17 44c0-4 3-7 7-7s7 3 7 7"/>`,
  trophy: `<path d="M15 6h18v12a9 9 0 0 1-18 0zM15 10H7v3a7 7 0 0 0 8 7M33 10h8v3a7 7 0 0 1-8 7M24 27v8M16 42h16M19 35h10v7H19z"/>`,
  shield: `<path d="M24 4l16 6v12c0 10-7 18-16 22C15 40 8 32 8 22V10z"/><path d="M17 24l5 5 9-10"/>`,
  hospital: `<path d="M9 42V12h30v30M4 42h40M20 42v-8h8v8M24 17v9M19.5 21.5h9"/>`,
  form: `<rect x="10" y="8" width="28" height="36" rx="4"/><path d="M18 8V5h12v3M16 20h16M16 28h16M16 36h10"/>`,
  down: `<path d="M12 10l12 12 12-12M12 24l12 12 12-12"/>`,
  search: `<circle cx="21" cy="21" r="13"/><path d="M31 31l11 11"/>`,
  alert: `<path d="M24 6L44 40H4z"/><path d="M24 19v10M24 34v.5"/>`,
  calendar: `<rect x="7" y="10" width="34" height="32" rx="4"/><path d="M7 19h34M16 5v9M32 5v9"/>`,
  stetho: `<path d="M12 6v12a8 8 0 0 0 16 0V6"/><path d="M20 26v6a9 9 0 0 0 18 0v-4"/><circle cx="38" cy="24" r="4"/>`,
  pulse: `<path d="M4 26h9l4-10 6 20 5-14 3 4h13"/>`,
  lock: `<rect x="9" y="22" width="30" height="22" rx="5"/><path d="M15 22v-6a9 9 0 0 1 18 0v6M24 31v5"/>`,
  infinity: `<path d="M24 24c-4-5-7.5-8-11-8a8 8 0 0 0 0 16c3.5 0 7-3 11-8s7.5-8 11-8a8 8 0 0 1 0 16c-3.5 0-7-3-11-8z"/>`,
  cursor: `<path d="M10 6l26 16-11 3 7 13-6 3-7-13-9 8z"/>`,
};
export const icon = (name, size, { id = "", sw = 3.4, color = "#fff", fill = "none" } = {}) =>
  `<svg ${id ? `id="${id}" ` : ""}viewBox="0 0 48 48" width="${size}" height="${size}" fill="${fill}" stroke="${color}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`;

// ───────────── fonte das informações e rede ─────────────
export const SRC_TXT =
  "Benefícios citados como exemplo de plano empresarial com o Hospital Vila Nova Star na rede: seguro viagem nacional e internacional, " +
  "abrangência nacional, telemedicina (Médico na Tela, serviço extracontratual) e check-up no Hospital Vila Nova Star (básico, para " +
  "empresas, exceto carteira adesão), conforme material comercial do plano SulAmérica Especial Mais. Benefícios e rede variam conforme " +
  "operadora, plano e categoria; confirme na cotação.";
export const NET_TXT =
  "Hospital Vila Nova Star (Rede D'Or), Vila Nova Conceição, São Paulo; a disponibilidade varia conforme operadora, plano e acomodação. " +
  "Exclusivo para CNPJ/MEI, a partir de 3 vidas, na capital de São Paulo.";

export const OBS = {
  rede: "Consulte a disponibilidade da rede hospitalar.",
  varia: "A rede credenciada pode variar conforme plano contratado.",
  cob: "Cobertura e rede sujeitas à modalidade contratada.",
  eleg: "Consulte condições e elegibilidade.",
  analise: "Condições sujeitas à análise comercial.",
  faixa: "Valores sujeitos à faixa etária e região.",
  ref: "Valores referenciais sujeitos às regras da operadora.",
  perfil: "Os valores podem variar conforme perfil do beneficiário.",
  img: "Imagem meramente ilustrativa.",
  oferta: "Oferta sujeita à disponibilidade comercial.",
};
export const LEGAL_ALL = [OBS.rede, OBS.varia, OBS.cob, OBS.eleg, OBS.analise, OBS.faixa, OBS.perfil, OBS.img].join(" ");

// ═════════════ grão e clarões (por cima de tudo) ═════════════
export function uiScene(flashes, { color = "255,236,214", grain = 0.05, track = 9 } = {}) {
  const p = "ui";
  const { a, add } = TL(0);
  const NOISE =
    "data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E";
  const css = `#ui-root{position:absolute;inset:0;width:${W}px;height:${H}px;overflow:hidden;pointer-events:none;}
#ui-fl{position:absolute;inset:0;background:radial-gradient(70% 50% at 50% 45%,rgba(${color},.9),rgba(${color},.3) 60%,rgba(${color},0));opacity:0;}
#ui-tex{position:absolute;left:-128px;top:-128px;width:${W + 256}px;height:${H + 256}px;background:url("${NOISE}") 0 0/256px 256px repeat;opacity:${grain};mix-blend-mode:overlay;}`;
  const body = `<div id="ui-fl" aria-hidden="true"></div><div id="ui-tex" data-layout-allow-overflow aria-hidden="true"></div>`;
  flashes.forEach(([t, o], i) => {
    add(`tl.fromTo("#ui-fl",{opacity:0},{opacity:${o},duration:0.08,ease:"power2.out"${i ? ",immediateRender:false" : ""}},${r3(t)});`);
    add(`tl.to("#ui-fl",{opacity:0,duration:0.45,ease:"power2.out"},${r3(t + 0.08)});`);
  });
  let s = 71;
  const R = () => ((s = (s * 1103515245 + 12345) % 2147483648) / 2147483648);
  const pos = [];
  for (let t = 0; t < D; t += 2 / FPS) pos.push(Math.round((R() - 0.5) * 200), Math.round((R() - 0.5) * 200));
  add(`const P = [${pos.join(",")}];`);
  add(`for (let i = 0; i < P.length / 2; i++) tl.set("#ui-tex", { x: P[2 * i], y: P[2 * i + 1] }, Math.round((i * 2 / ${FPS}) * 1000) / 1000);`);
  return { st: 0, track, ...scene(p, D, css, body, a) };
}

// ═════════════ saída: compositions/*.html + index.html (trilha, locução e efeitos) ═════════════
export function writeOutput(scenes, SFX, { bg = "#000", bgmVolume = 0.75 } = {}) {
  const HITS = JSON.parse(readFileSync(join(ROOT, "assets/audio/sfx_hits.json"), "utf8"));
  const SFX_DUR = { impact: 1.2, counter: 0.7 };
  const items = SFX.map(([name, t, vol]) => {
    const h = HITS[name];
    const at0 = r3(Math.max(0, t - h.hit));
    return { name, at: at0, vol, dur: r3(Math.min(SFX_DUR[name] ?? h.dur, h.dur, D - at0)) };
  }).sort((x, y) => x.at - y.at);
  const ends = [];
  const tracks = items.map((it) => {
    let q = ends.findIndex((e) => e <= it.at + 1e-6);
    if (q < 0) q = ends.push(0) - 1;
    ends[q] = it.at + it.dur;
    return 30 + q;
  });
  const voDur = r3(Number(readFileSync(join(ROOT, "assets/voice/vo.dur"), "utf8")));
  mkdirSync(join(ROOT, "compositions"), { recursive: true });
  for (const s of scenes) writeFileSync(join(ROOT, `compositions/${s.id}.html`), s.html);
  const mounts = scenes
    .map(
      (s) =>
        `<div id="el-${s.id}" class="scene" data-composition-id="${s.id}" data-composition-src="compositions/${s.id}.html" data-start="${r3(s.st)}" data-duration="${s.dur}" data-track-index="${s.track}"></div>`,
    )
    .join("\n      ");
  const audio = [
    `<audio id="el-bgm" src="assets/audio/bgm.wav" data-start="0" data-duration="${D}" data-track-index="20" data-volume="${bgmVolume}"></audio>`,
    `<audio id="el-vo-voice" data-audio-group="voiceover" src="assets/voice/vo.wav" data-start="0" data-duration="${Math.min(voDur, D)}" data-track-index="21" data-volume="1"></audio>`,
    ...items.map(
      (x, i) =>
        `<audio id="el-sfx-${i}" src="assets/audio/sfx_${x.name}.wav" data-start="${x.at}" data-duration="${x.dur}" data-track-index="${tracks[i]}" data-volume="${x.vol}"></audio>`,
    ),
  ].join("\n      ");
  const html = `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=${W}, height=${H}" />
    <script src="assets/vendor/gsap.min.js"></script>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body { width: ${W}px; height: ${H}px; overflow: hidden; background: ${bg}; }
      #root { position: relative; width: ${W}px; height: ${H}px; overflow: hidden; background: ${bg}; }
      .scene { position: absolute; inset: 0; width: 100%; height: 100%; }
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="${D}" data-width="${W}" data-height="${H}">
      ${mounts}
      ${audio}
    </div>
    <script>
      window.__timelines = window.__timelines || {};
      window.__timelines["main"] = gsap.timeline({ paused: true });
    </script>
  </body>
</html>
`;
  writeFileSync(join(ROOT, "index.html"), html);
  console.log(`story ${W}x${H}: ${D}s, ${scenes.length} composições, ${SFX.length} SFX`);
}
