// lib.mjs — peças comuns das variações do anúncio do Einstein (story 9:16): tempos da locução,
// estilos-base, utilidades de animação (palavras, tremida, números que rolam), ícones, cubos das
// operadoras, observações obrigatórias, fundo, clarões/grão e a escrita do index.html com o áudio.
// Mesmas peças de ../einstein-cnpj-milionario/tools/build.mjs (variação 1).

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
export const W = 1080;
export const H = 1920;
export const FPS = 30;
export const r3 = (x) => Math.round(x * 1000) / 1000;

// paleta: azul-meia-noite, champanhe, vermelho da conta e verde da economia
export const NIGHT = "#070B14";
export const NAVY = "#0E1A2E";
export const CH = "#E8C27A";
export const CH2 = "#F7DFA8";
export const INK = "#0B1220";
export const SLATE = "#4F5F75";
export const MUTED = "#C3CEDD";
export const GREEN = "#22A06B";
export const RED = "#E5484D";
export const RED2 = "#FF6B6B";

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
// primeira grafia encontrada (o Scribe pode escrever "décimo sexto" ou "16º")
export function atAny(texts, after = 0) {
  for (const t of texts) {
    const w = WORDS.find((x) => norm(x.word) === norm(t) && x.start >= after - 0.001);
    if (w) return w.start;
  }
  throw new Error(`nenhuma palavra encontrada: ${texts.join("/")} depois de ${after}`);
}
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

// ───────────── estilos e composições ─────────────
const FONTS = [
  ["Mont", 500, "Montserrat-500"],
  ["Mont", 700, "Montserrat-700"],
  ["Mont", 800, "Montserrat-800"],
  ["Mont", 900, "Montserrat-900"],
  ["Poppins", 400, "Poppins-normal-400"],
  ["Poppins", 500, "Poppins-normal-500"],
  ["Poppins", 600, "Poppins-normal-600"],
]
  .map(([f, w, file]) => `@font-face{font-family:"${f}";font-weight:${w};font-style:normal;font-display:block;src:url("assets/fonts/${file}.woff2") format("woff2");}`)
  .join("\n");

export function wspans(p, text, cls = "") {
  return text
    .split(" ")
    .map((w, i) => `<span class="w"><span class="wi${cls ? " " + cls : ""}" id="${p}${i}">${w}</span></span>`)
    .join(" ");
}

export const base = (p) => `
${FONTS}
#${p}-root{position:absolute;inset:0;width:${W}px;height:${H}px;overflow:hidden;font-family:"Poppins",Arial,sans-serif;color:#fff;}
.${p}-full{position:absolute;left:0;top:0;width:${W}px;height:${H}px;}
.d{font-family:"Mont",Arial,sans-serif;}
.w{display:inline-block;overflow:hidden;vertical-align:top;padding:0.1em 0.04em 0.06em;margin:-0.1em -0.04em -0.06em;}
.wi{display:inline-block;}
.ln{position:absolute;left:0;width:${W}px;text-align:center;white-space:nowrap;}
.ch{color:${CH};}
.red{color:${RED2};}
.kk{position:absolute;left:0;width:${W}px;text-align:center;font-weight:700;font-size:28px;letter-spacing:.18em;color:${CH};}
.pill{position:absolute;left:0;width:${W}px;display:flex;justify-content:center;}
.pill>div{display:flex;align-items:center;gap:12px;padding:12px 30px;border:2px solid rgba(232,194,122,.7);border-radius:60px;background:rgba(232,194,122,.1);font-weight:700;font-size:26px;letter-spacing:.12em;color:${CH};}
.sweep{position:absolute;left:0;top:0;width:100%;height:100%;background:linear-gradient(105deg,rgba(255,255,255,0) 35%,rgba(255,255,255,.55) 50%,rgba(255,255,255,0) 65%);mix-blend-mode:screen;}
.shift{position:absolute;left:0;width:${W}px;}
.ph{position:absolute;overflow:hidden;background:${NAVY};}
.ph img{display:block;width:100%;height:100%;object-fit:cover;}
.roll{display:inline-flex;overflow:hidden;vertical-align:top;font-variant-numeric:tabular-nums;}
.rd{display:inline-block;overflow:hidden;}
.rs{display:flex;flex-direction:column;text-align:center;}
.rs span{display:block;}
.rc{display:inline-block;}
.legal{position:absolute;left:90px;width:${W - 180}px;text-align:center;font-size:20px;line-height:1.4;color:rgba(255,255,255,.86);}
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
  pin: `<path d="M24 44s14-13.5 14-24a14 14 0 0 0-28 0c0 10.5 14 24 14 24z"/><circle cx="24" cy="20" r="5"/>`,
  building: `<path d="M8 42V10l16-5v37M24 16l16 5v21M4 42h40M14 16h4M14 23h4M14 30h4M30 26h4M30 33h4"/>`,
  person: `<circle cx="24" cy="16" r="8"/><path d="M8 44c0-9 7-15 16-15s16 6 16 15"/>`,
  shield: `<path d="M24 4l16 6v12c0 10-7 18-16 22C15 40 8 32 8 22V10z"/><path d="M17 24l5 5 9-10"/>`,
  hospital: `<path d="M9 42V12h30v30M4 42h40M20 42v-8h8v8M24 17v9M19.5 21.5h9"/>`,
  star: `<path d="M24 5l5.6 12.2 13.4 1.5-10 9 2.8 13.2L24 34.2 12.2 40.9 15 27.7l-10-9 13.4-1.5z"/>`,
  globe: `<circle cx="24" cy="24" r="18"/><path d="M6 24h36M24 6c6 6 6 30 0 36M24 6c-6 6-6 30 0 36"/>`,
  form: `<rect x="10" y="8" width="28" height="36" rx="4"/><path d="M18 8V5h12v3M16 20h16M16 28h16M16 36h10"/>`,
  down: `<path d="M12 10l12 12 12-12M12 24l12 12 12-12"/>`,
  tag: `<path d="M6 24V8a2 2 0 0 1 2-2h16l18 18-18 18z"/><circle cx="15" cy="15" r="3"/><path d="M22 27l8 8M30 27l-8 8"/>`,
  lockBody: `<rect x="9" y="22" width="30" height="22" rx="5"/><path d="M24 31v5"/>`,
  shackle: `<path d="M15 22v-6a9 9 0 0 1 18 0v6"/>`,
  alert: `<path d="M24 6L44 40H4z"/><path d="M24 19v10M24 34v.5"/>`,
  calendar: `<rect x="7" y="10" width="34" height="32" rx="4"/><path d="M7 19h34M16 5v9M32 5v9"/>`,
  scale: `<path d="M24 6v36M14 42h20M8 14h32M8 14l-6 14a6 6 0 0 0 12 0zM40 14l-6 14a6 6 0 0 0 12 0z"/>`,
  search: `<circle cx="21" cy="21" r="13"/><path d="M31 31l11 11M15 21l4.5 4.5L27 17"/>`,
  refresh: `<path d="M40 14A18 18 0 0 0 8 20M8 34a18 18 0 0 0 32-6"/><path d="M40 6v8h-8M8 42v-8h8"/>`,
};
export const icon = (name, size, { id = "", sw = 3.4, color = "#fff", fill = "none" } = {}) =>
  `<svg ${id ? `id="${id}" ` : ""}viewBox="0 0 48 48" width="${size}" height="${size}" fill="${fill}" stroke="${color}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`;

export const IMG = {
  fachada: "assets/img/einstein-fachada.jpg",
  atrio: "assets/img/einstein-atrio.jpg",
  suite: "assets/img/quarto-suite.jpg",
  robo: "assets/img/cirurgia-robotica.jpg",
};
// cubos das operadoras (k = largura relativa para a face ficar do mesmo tamanho visual)
const CUBE = {
  alice: { src: "assets/img/cubo-alice.png", alt: "Alice", k: 1.0, ar: 529 / 445 },
  amil: { src: "assets/img/cubo-amil.png", alt: "Amil", k: 1.0, ar: 532 / 451 },
  bradesco: { src: "assets/img/cubo-bradesco.png", alt: "Bradesco", k: 1.03, ar: 196 / 193 },
  sulamerica: { src: "assets/img/cubo-sulamerica.png", alt: "SulAmérica", k: 1.1, ar: 242 / 259 },
};
export const cube = (id, key, w, style = "") => {
  const c = CUBE[key];
  const iw = Math.round(w * c.k);
  return `<img id="${id}" src="${c.src}" alt="${c.alt}" style="width:${iw}px;height:${Math.round(iw * c.ar)}px;${style}" />`;
};

// observações obrigatórias (texto exato, só por escrito — ver CLAUDE.md da raiz)
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
};
// cotações (do vídeo de referência, a pedido do cliente)
export const QUOTES = {
  alice: { label: "1 pessoa · 30 anos", op: "Alice", plan: "Exclusivo", spec: "Saúde PME · Apartamento · Copart. 30%", price: "1.345,06", txt: "1 pessoa de 30 anos – Alice Exclusivo, coparticipação 30%, R$ 1.345,06/mês" },
  amil: { label: "Casal", op: "Amil", plan: "Black I R1", spec: "Saúde PME · Apartamento · Coparticipação", price: "2.745,50", txt: "casal – Amil Black I R1, com coparticipação, R$ 2.745,50/mês" },
  bradesco: { label: "Família · 3 pessoas", op: "Bradesco Saúde", plan: "Nacional Plus 4", spec: "Saúde PME · Apto · Copart. 30% · 390 hospitais", price: "4.238,19", txt: "família de 3 pessoas – Bradesco Saúde Nacional Plus 4, coparticipação 30%, R$ 4.238,19/mês" },
  sulamerica: { label: "Família · 3 pessoas", op: "SulAmérica Saúde", plan: "Executivo R1", spec: "Saúde PME · Apto · Copart. 30% · 341 hospitais", price: "4.351,21", txt: "família de 3 pessoas – SulAmérica Saúde Executivo R1, coparticipação 30%, R$ 4.351,21/mês" },
};
export const cotacoes = (keys) => `Cotações referenciais Saúde PME, apartamento: ${keys.map((k) => QUOTES[k].txt).join("; ")}.`;

// ═════════════ fundo: azul-meia-noite com brilho champanhe ═════════════
export function bgScene() {
  const p = "bg";
  const { a, add } = TL(0);
  const css =
    base(p) +
    `
#bg-base{background:radial-gradient(95% 55% at 50% 32%,#16294A 0%,${NAVY} 46%,${NIGHT} 100%);}
.bg-gl{position:absolute;border-radius:50%;}
#bg-ch{left:-220px;top:280px;width:1300px;height:1300px;background:radial-gradient(closest-side,rgba(232,194,122,.2),rgba(232,194,122,0));}
#bg-bl{left:120px;top:860px;width:1300px;height:1300px;background:radial-gradient(closest-side,rgba(80,130,230,.18),rgba(80,130,230,0));}
#bg-dots{position:absolute;left:0;top:-72px;}
#bg-vig{background:radial-gradient(110% 75% at 50% 45%,rgba(0,0,0,0) 55%,rgba(2,5,12,.66) 100%);}
`;
  const body = `
  <div id="bg-base" class="${p}-full"></div>
  <div id="bg-ch" class="bg-gl" data-layout-allow-overflow aria-hidden="true"></div>
  <div id="bg-bl" class="bg-gl" data-layout-allow-overflow aria-hidden="true"></div>
  <svg id="bg-dots" width="${W}" height="${H + 144}" aria-hidden="true" data-layout-allow-overflow>
    <defs><pattern id="bg-pt" width="36" height="36" patternUnits="userSpaceOnUse"><circle cx="18" cy="18" r="1.8" fill="rgba(255,255,255,.06)"/></pattern></defs>
    <rect width="${W}" height="${H + 144}" fill="url(#bg-pt)"/></svg>
  <div id="bg-vig" class="${p}-full"></div>`;
  add(`tl.fromTo("#bg-dots",{y:0},{y:72,duration:${D},ease:"none"},0);`);
  add(`tl.fromTo("#bg-ch",{x:0,y:0,scale:1},{x:240,y:-160,scale:1.18,duration:${D},ease:"sine.inOut"},0);`);
  add(`tl.fromTo("#bg-bl",{x:0,y:0,scale:1},{x:-260,y:120,scale:1.12,duration:${D},ease:"sine.inOut"},0);`);
  return { st: 0, track: 0, ...scene(p, D, css, body, a) };
}

// ═════════════ clarões (nos golpes) e grão ═════════════
export function uiScene(flashes) {
  const p = "ui";
  const { a, add } = TL(0);
  const NOISE =
    "data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E";
  const css = `#ui-root{position:absolute;inset:0;width:${W}px;height:${H}px;overflow:hidden;pointer-events:none;}
#ui-fl{position:absolute;inset:0;background:radial-gradient(70% 50% at 50% 45%,rgba(255,240,210,.85),rgba(232,194,122,.3) 60%,rgba(232,194,122,0));opacity:0;}
#ui-tex{position:absolute;left:-128px;top:-128px;width:${W + 256}px;height:${H + 256}px;background:url("${NOISE}") 0 0/256px 256px repeat;opacity:.05;mix-blend-mode:overlay;}`;
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
  return { st: 0, track: 9, ...scene(p, D, css, body, a) };
}

// ═════════════ saída: compositions/*.html + index.html (trilha, locução e efeitos) ═════════════
export function writeOutput(scenes, SFX) {
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
    `<audio id="el-bgm" src="assets/audio/bgm.wav" data-start="0" data-duration="${D}" data-track-index="20" data-volume="0.75"></audio>`,
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
      html, body { width: ${W}px; height: ${H}px; overflow: hidden; background: ${NIGHT}; }
      #root { position: relative; width: ${W}px; height: ${H}px; overflow: hidden; background: ${NIGHT}; }
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
