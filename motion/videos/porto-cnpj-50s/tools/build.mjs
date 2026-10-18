#!/usr/bin/env node
// build.mjs — filme Porto 50 s "Para de rolar", story 9:16 e feed 1:1.
//
//   node tools/build.mjs story   -> compositions/*.html + index.html
//   node tools/build.mjs feed    -> feed/compositions/*.html + feed/index.html
//
// O filme é uma página só que rola de verdade. Depois do gancho (um feed que para
// com o toque do dedo), as seções B..I ficam empilhadas numa página alta e a
// posição de rolagem Y(t) sai de uma lista de gestos: arrasto + inércia (flick),
// rolagem lenta com o dedo (drag), retorno elástico no fim da lista/página
// (rubber-band). Cada cena desenha a sua seção em (topo da seção − Y(t)) com as
// mesmas curvas, então as cenas vizinhas andam coladas como uma página contínua.
// Dentro das seções há rolagens aninhadas (extrato de boletos com cabeçalho fixo
// por ano) e um carrossel horizontal com snap. O dedo, a barra de rolagem e o
// desfoque de movimento (proporcional à velocidade) saem dos mesmos gestos.
// Os tempos vêm das palavras da locução (assets/voice/vo.words.json).

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const FMT = process.argv[2] === "feed" ? "feed" : "story";
const ST = FMT === "story";
const W = 1080;
const H = ST ? 1920 : 1080;
const FPS = 30;
const D = 50;
const r3 = (x) => Math.round(x * 1000) / 1000;
const pick = (s, f) => (ST ? s : f);

// paleta
const INK = "#0B1530";
const ROYAL = "#2146C3";
const SKY = "#3A90EE";
const PBLUE = "#0A6FD0"; // azul de texto sobre claro (contraste)
const ICE = "#8CCBFF";
const CORAL = "#F0483C";
const MINT = "#2BD4A4";
const PAPER = "#F4F6FA";
const LAV = "#EEF2F9";
const MUTED = "#5B6478";

// ───────────── locução ─────────────
const WORDS = JSON.parse(readFileSync(join(ROOT, "assets/voice/vo.words.json"), "utf8"));
const norm = (s) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]/g, "");
function word(text, n = 0) {
  const hits = WORDS.filter((w) => norm(w.word) === norm(text));
  if (!hits[n]) throw new Error(`palavra não encontrada: ${text} #${n}`);
  return hits[n];
}
const at = (t, n = 0) => word(t, n).start;
const end = (t, n = 0) => word(t, n).end;
const LOCK = end("oitenta");

// ───────────── curvas (as mesmas do GSAP, para calcular posições aqui) ─────────────
const EZ = {
  none: (p) => p,
  "power1.in": (p) => p * p,
  "power2.in": (p) => p ** 3,
  "power1.out": (p) => 1 - (1 - p) ** 2,
  "power2.out": (p) => 1 - (1 - p) ** 3,
  "power3.out": (p) => 1 - (1 - p) ** 4,
  "power4.out": (p) => 1 - (1 - p) ** 5,
  "power2.inOut": (p) => (p < 0.5 ? 4 * p ** 3 : 1 - (-2 * p + 2) ** 3 / 2),
  "power3.inOut": (p) => (p < 0.5 ? 8 * p ** 4 : 1 - (-2 * p + 2) ** 4 / 2),
  "sine.inOut": (p) => -(Math.cos(Math.PI * p) - 1) / 2,
};

// gesto de arremesso: o dedo arrasta (power1.in) e solta; a inércia (power4.out)
// começa com a mesma velocidade da soltura: 2·d1/td = 5·d2/tm.
function flick(t, from, to, { td = 0.14, tm = 0.9, over = 0, back = 0.34, finger = null } = {}) {
  const target = to + over * Math.sign(to - from);
  const k = (2.5 * td) / tm;
  const d2 = (target - from) / (1 + k);
  const d1 = target - from - d2;
  const segs = [
    { t, dur: td, from, to: from + d1, ease: "power1.in", kind: "drag" },
    { t: t + td, dur: tm, from: from + d1, to: target, ease: "power4.out", kind: "momentum" },
  ];
  if (over) segs.push({ t: t + td + tm, dur: back, from: target, to, ease: "power2.inOut", kind: "rubber" });
  return { type: "flick", t, end: segs[segs.length - 1].t + segs[segs.length - 1].dur, segs, finger, d1, td };
}
// rolagem lenta com o dedo encostado
function drag(t, dur, from, to, { finger = null, ease = "sine.inOut" } = {}) {
  return { type: "drag", t, end: t + dur, segs: [{ t, dur, from, to, ease, kind: "drag" }], finger, d1: to - from, td: dur };
}
const segsOf = (moves) => moves.flatMap((m) => m.segs).sort((a, b) => a.t - b.t);
function valueAt(segs, t, init = 0) {
  let v = init;
  for (const s of segs) {
    if (t < s.t) break;
    if (t >= s.t + s.dur) v = s.to;
    else return s.from + (s.to - s.from) * EZ[s.ease]((t - s.t) / s.dur);
  }
  return v;
}

// ───────────── utilidades ─────────────
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const brl = (v) => {
  const c = Math.round(v * 100);
  const int = Math.floor(c / 100)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${int},${String(c % 100).padStart(2, "0")}`;
};
const FONTS =
  [400, 500, 600, 700, 800]
    .map(
      (w) =>
        `@font-face{font-family:"Poppins";font-weight:${w};font-style:normal;font-display:block;src:url("assets/fonts/Poppins-${w}.woff2") format("woff2");}`,
    )
    .join("\n") +
  `\n@font-face{font-family:"Instrument Serif";font-weight:400;font-style:italic;font-display:block;src:url("assets/fonts/InstrumentSerif-Italic.woff2") format("woff2");}`;

// palavras com máscara; *texto* vira serifa itálica
function wspans(p, text, cls = "") {
  let i = 0;
  return text
    .split(" ")
    .map((w) => {
      const it = /^\*.*\*[.,:?!]?$/.test(w) || w.startsWith("*") || w.endsWith("*");
      const clean = w.replace(/\*/g, "");
      return `<span class="w"><span class="wi${it ? " it" : ""}${cls ? " " + cls : ""}" id="${p}${i++}">${clean}</span></span>`;
    })
    .join(" ");
}
// *a b c* marca várias palavras seguidas como itálicas
function wsp(p, text, cls = "") {
  let on = false;
  const parts = text.split(" ").map((w) => {
    const startIt = w.startsWith("*");
    const endIt = /\*[.,:?!]?$/.test(w);
    if (startIt) on = true;
    const res = on ? `*${w.replace(/\*/g, "")}*` : w;
    if (endIt) on = false;
    return res;
  });
  return wspans(p, parts.join(" "), cls);
}

const base = (p) => `
${FONTS}
#${p}-root{position:absolute;inset:0;width:${W}px;height:${H}px;overflow:hidden;font-family:"Poppins",Arial,sans-serif;color:${INK};}
.${p}-full{position:absolute;left:0;top:0;width:${W}px;height:${H}px;}
.${p}-abs{position:absolute;}
.${p}-lbl{position:absolute;font-weight:600;letter-spacing:.18em;text-transform:uppercase;white-space:nowrap;}
.${p}-h{position:absolute;font-weight:700;letter-spacing:-.04em;line-height:1;white-space:nowrap;}
.it{font-family:"Instrument Serif",Georgia,serif;font-style:italic;font-weight:400;letter-spacing:-.01em;}
.w{display:inline-block;overflow:hidden;vertical-align:top;padding:0.12em 0.04em 0.06em;margin:-0.12em -0.04em -0.06em;}
.wi{display:inline-block;}
`;

function scene(id, dur, css, body, lines) {
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

function TL(st) {
  const a = [];
  const L = (g) => r3(g - st);
  const add = (s) => a.push(s);
  // revelação por palavra (máscara)
  const words = (p, n, times, dur = 0.42, from = 110) => {
    for (let i = 0; i < n; i++)
      add(`tl.fromTo("#${p}${i}",{yPercent:${from},opacity:0},{yPercent:0,opacity:1,duration:${dur},ease:"power3.out"},${r3(Math.max(0, L(times[i]) - 0.08))});`);
  };
  return { a, L, add, words };
}

const ICONS = {
  tooth: `<path d="M14 9c-4 0-6 3-6 7 0 4 2 6 3 10 1 4 1 9 3 9s2-5 4-8c1-1 2-1 3 0 2 3 2 8 4 8s2-5 3-9c1-4 3-6 3-10 0-4-2-7-6-7-3 0-4 2-6 2s-3-2-5-2z"/>`,
  heart: `<path d="M24 38S8 28 8 17c0-5 4-8 8-8 3 0 6 2 8 5 2-3 5-5 8-5 4 0 8 3 8 8 0 11-16 21-16 21z"/><path d="M11 22h7l3-5 4 9 3-4h9"/>`,
  case: `<rect x="7" y="15" width="34" height="23" rx="4"/><path d="M18 15v-4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v4M7 25h34M24 23v5"/>`,
  shield: `<path d="M24 6l15 5v11c0 9-6 16-15 20C15 38 9 31 9 22V11z"/><path d="M17 23l5 5 9-10"/>`,
  check: `<path d="M12 25l8 8 16-18"/>`,
  doc: `<path d="M14 6h14l8 8v26a2 2 0 0 1-2 2H14a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z"/><path d="M28 6v8h8M18 24h12M18 31h12M18 17h5"/>`,
  cal: `<rect x="7" y="10" width="34" height="30" rx="5"/><path d="M7 19h34M16 6v8M32 6v8"/><path d="M21 27a3 3 0 1 1 4 3c-1 1-1 1-1 3M24 36v.5"/>`,
  arrowUp: `<path d="M24 38V12M13 22l11-11 11 11"/>`,
  laptop: `<rect x="9" y="11" width="30" height="20" rx="3"/><path d="M5 37h38"/>`,
  phone: `<rect x="15" y="6" width="18" height="36" rx="4"/><path d="M22 36h4"/>`,
  heartLike: `<path d="M24 39S8 29 8 18c0-5 4-9 9-9 3 0 5 2 7 4 2-2 4-4 7-4 5 0 9 4 9 9 0 11-16 21-16 21z"/>`,
  bubble: `<path d="M40 22c0 8-7 14-16 14-2 0-4 0-6-1l-9 4 2-7c-2-3-3-6-3-10 0-8 7-14 16-14s16 6 16 14z"/>`,
  send: `<path d="M42 7L20 26M42 7l-14 35-8-16-15-6z"/>`,
  mark: `<path d="M13 7h22v34l-11-8-11 8z"/>`,
};
const icon = (name, size, { id = "", sw = 3.2, color = "#fff", fill = "none" } = {}) =>
  `<svg ${id ? `id="${id}" ` : ""}viewBox="0 0 48 48" width="${size}" height="${size}" fill="${fill}" stroke="${color}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${ICONS[name]}</svg>`;

// ───────────── página: seções empilhadas e gestos ─────────────
const SEC = {};
{
  const order = pick(
    [["B", 1920], ["C", 1800], ["D", 3300], ["E", 1920], ["F", 1920], ["G", 2200], ["H", 1000], ["I", 1920]],
    [["B", 1080], ["C", 1200], ["D", 2300], ["E", 1080], ["F", 1080], ["G", 1180], ["H", 600], ["I", 1080]],
  );
  let y = 0;
  for (const [k, h] of order) {
    SEC[k] = { top: y, h };
    y += h;
  }
  SEC.pageH = y;
  SEC.maxY = y - H;
}
// pontos de toque (coordenadas da tela)
const FX = pick({ x: 760, y: 1320 }, { x: 800, y: 820 });
const T = {
  m1: end("comparou") + 0.03,
  m2: end("caro") + 0.1,
  drift: at("pode", 1) - 0.22,
  m3: at("mantendo") - 0.37,
  m4: end("qualidade") + 0.02,
  m5: LOCK + 0.2,
  m6: end("antiacaro") + 0.02,
  n1: at("mostra") - 0.75,
  n2: at("quanto") - 0.42,
  m7: end("economizar") + 0.07,
  m8: at("agora") + 0.08,
};
const dD1 = pick(360, 420);
const dD2 = pick(1640, 1220);
const dG = pick(140, 50);
const yH = pick(SEC.H.top - 300, SEC.H.top);
const PAGE = [
  flick(T.m1, 0, SEC.C.top, { tm: 0.82, finger: FX }),
  drag(T.m1 + 1.0, 1.0, SEC.C.top, SEC.C.top + pick(120, 90), { finger: { x: FX.x, y: FX.y - pick(120, 80) } }),
  flick(T.m2, SEC.C.top + pick(120, 90), SEC.D.top, { tm: 0.86, finger: FX }),
  drag(T.drift, 2.25, SEC.D.top, SEC.D.top + dD1, { finger: { x: FX.x, y: FX.y - pick(80, 60) } }),
  flick(T.m3, SEC.D.top + dD1, SEC.D.top + dD2, { tm: 0.86, finger: FX }),
  flick(T.m4, SEC.D.top + dD2, SEC.E.top, { tm: 0.82, finger: FX }),
  flick(T.m5, SEC.E.top, SEC.F.top, { tm: 0.82, finger: FX }),
  flick(T.m6, SEC.F.top, SEC.G.top, { tm: 0.82, finger: FX }),
  flick(T.n1, SEC.G.top, SEC.G.top + dG, { td: 0.12, tm: 0.62, finger: FX }),
  flick(T.n2, SEC.G.top + dG, SEC.G.top + 2 * dG, { td: 0.12, tm: 0.62, finger: FX }),
  flick(T.m7, SEC.G.top + 2 * dG, yH, { tm: 0.86, finger: FX }),
  flick(T.m8, yH, SEC.maxY, { tm: 0.9, over: pick(130, 90), back: 0.4, finger: FX }),
];
const PSEG = segsOf(PAGE);
const Y = (t) => valueAt(PSEG, t, 0);

// emite as tweens de rolagem de um elemento (y = topo − Y) para uma cena
function scrollTweens(add, L, sel, top, st, sd, { segs = PSEG, init = 0, sign = -1, prop = "y", blur = null } = {}) {
  const v0 = valueAt(segs, st, init);
  add(`tl.set("${sel}",{${prop}:${r3(top + sign * v0)}},0);`);
  for (const s of segs) {
    if (s.t + s.dur <= st + 1e-6 || s.t >= st + sd) continue;
    if (s.t < st - 1e-6) throw new Error(`${sel}: gesto começa antes da cena (${s.t} < ${st})`);
    add(
      `tl.fromTo("${sel}",{${prop}:${r3(top + sign * s.from)}},{${prop}:${r3(top + sign * s.to)},duration:${r3(s.dur)},ease:"${s.ease}",immediateRender:false},${L(s.t)});`,
    );
  }
  // desfoque de movimento vertical: sobe no arrasto, cai com a velocidade na inércia
  if (blur) {
    for (const s of segs) {
      if (s.t + s.dur <= st + 1e-6 || s.t >= st + sd || Math.abs(s.to - s.from) < 300) continue;
      if (s.kind === "drag" && s.dur < 0.3) {
        add(`tl.set("${blur.el}",{filter:"url(#${blur.f})"},${L(s.t)});`);
        add(`tl.fromTo("#${blur.f}-g",{attr:{stdDeviation:"0 0"}},{attr:{stdDeviation:"0 ${blur.max}"},duration:${r3(s.dur)},ease:"power1.in",immediateRender:false},${L(s.t)});`);
      } else if (s.kind === "momentum") {
        add(`tl.fromTo("#${blur.f}-g",{attr:{stdDeviation:"0 ${blur.max}"}},{attr:{stdDeviation:"0 0"},duration:${r3(s.dur * 0.7)},ease:"power3.out",immediateRender:false},${L(s.t)});`);
        add(`tl.set("${blur.el}",{filter:"none"},${r3(L(s.t) + s.dur * 0.7)});`);
      }
    }
  }
}
const vblur = (f) => `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><filter id="${f}" x="0" y="-5%" width="100%" height="110%"><feGaussianBlur id="${f}-g" stdDeviation="0 0"/></filter></svg>`;

// cena de página: janela do tamanho da tela + seção posicionada pela rolagem
function pageScene(p, key, st, sd, css, inner, extraTop = "") {
  const { a, L, add, words } = TL(st);
  const s = SEC[key];
  const cssAll =
    base(p) +
    `
#${p}-vp{position:absolute;left:0;top:0;width:${W}px;height:${H}px;overflow:hidden;}
#${p}-pg{position:absolute;left:0;top:0;width:${W}px;height:${s.h}px;}
${css}`;
  const body = `
  ${vblur(`${p}-vb`)}
  <div id="${p}-vp"><div id="${p}-pg" data-layout-allow-overflow>${inner}</div></div>${extraTop}`;
  scrollTweens(add, L, `#${p}-pg`, s.top, st, sd, { sign: -1, blur: { el: `#${p}-vp`, f: `${p}-vb`, max: pick(7, 5) } });
  return { a, L, add, words, css: cssAll, body };
}

const scenes = [];

// ═════════════ 1 · FEED: "Para de rolar." ═════════════
const POST = pick(
  { x: 24, w: 1032, hd: 128, mh: 1290, act: 112, cap: 96, pad: 24, gap: 28, top: 40, ours: 5, rest: 172, r: 36, k: 1 },
  { x: 160, w: 760, hd: 100, mh: 760, act: 90, cap: 70, pad: 20, gap: 24, top: 30, ours: 5, rest: 40, r: 28, k: 0.74 },
);
POST.h = POST.hd + POST.mh + POST.act + POST.cap + POST.pad;
POST.stride = POST.h + POST.gap;
const STOP = at("rolar") + 0.08;
{
  const p = "s1";
  const st = 0;
  const dur = 3.75;
  const { a, L, add } = TL(st);
  const k = POST.k;
  const ourTop = POST.top + POST.ours * POST.stride;
  const yRest = ourTop - POST.rest;
  const speed = pick(9500, 6200);
  const y0 = yRest - STOP * speed;
  const feedSegs = [
    { t: 0, dur: STOP, from: y0, to: yRest, ease: "none", kind: "fly" },
    { t: STOP, dur: 0.08, from: yRest, to: yRest + pick(18, 12), ease: "power2.out", kind: "bump" },
    { t: STOP + 0.08, dur: 0.24, from: yRest + pick(18, 12), to: yRest, ease: "power2.inOut", kind: "bump" },
  ];
  const nPosts = POST.ours + 2;
  const MEDIA = ["grad:#FFB74D,#F0483C", "feed-p2.jpg", "grad:#7C4DFF,#E040FB", "feed-p7.jpg", "grad:#2BD4A4,#0A6FD0", null, "feed-p6.jpg"];
  const R = rng(55);
  let posts = "";
  for (let i = 0; i < nPosts; i++) {
    const y = POST.top + i * POST.stride;
    const ours = i === POST.ours;
    const m = MEDIA[i];
    const mediaBg = ours ? "" : m.startsWith("grad:") ? `background:linear-gradient(150deg,${m.slice(5).split(",")[0]},${m.slice(5).split(",")[1]});` : `background:url('assets/img/${m}') 50% 50%/cover no-repeat;`;
    const skel = (w, h, c = "#E6E9F0") => `<div style="width:${w}px;height:${h}px;border-radius:${h / 2}px;background:${c}"></div>`;
    const head = ours
      ? `<div class="s1-av s1-av-ours">${icon("shield", Math.round(40 * k), { sw: 3.4 })}</div><div class="s1-nm"><b>Plano de Saúde CNPJ</b><span>Patrocinado</span></div>`
      : `<div class="s1-av" style="background:hsl(${Math.round(R() * 360)},35%,82%)"></div><div class="s1-nm">${skel(Math.round((180 + R() * 120) * k), Math.round(18 * k), "#D9DDE6")}${skel(Math.round((110 + R() * 60) * k), Math.round(14 * k))}</div>`;
    // posts de outras contas: foto ou cartaz colorido com "texto" (barras), como num feed real
    const poster = m && m.startsWith("grad:") ? `<div style="position:absolute;left:${Math.round(70 * k)}px;top:${Math.round(POST.mh * 0.3)}px;display:flex;flex-direction:column;gap:${Math.round(26 * k)}px">${skel(Math.round(POST.w * 0.66), Math.round(64 * k), "rgba(255,255,255,.92)")}${skel(Math.round(POST.w * 0.48), Math.round(64 * k), "rgba(255,255,255,.92)")}${skel(Math.round(POST.w * 0.3), Math.round(30 * k), "rgba(255,255,255,.6)")}</div>` : "";
    const media = ours ? `<div id="s1-media" class="s1-media s1-ours">${""}</div>` : `<div class="s1-media" style="${mediaBg}">${poster}</div>`;
    posts += `<div class="s1-post" ${ours ? 'id="s1-our"' : ""} style="top:${y}px"><div class="s1-hd">${head}<div class="s1-dots">•••</div></div>${media}<div class="s1-act">${icon("heartLike", Math.round(46 * k), { color: INK, sw: 2.6 })}${icon("bubble", Math.round(46 * k), { color: INK, sw: 2.6 })}${icon("send", Math.round(44 * k), { color: INK, sw: 2.6 })}<div style="flex:1"></div>${icon("mark", Math.round(44 * k), { color: INK, sw: 2.6 })}</div><div class="s1-cap">${skel(Math.round(POST.w * 0.82), Math.round(16 * k))}${skel(Math.round(POST.w * 0.55), Math.round(16 * k))}</div></div>`;
  }
  const mk = pick(
    { pad: 72, l1: { top: 150, s: 150 }, l2: { top: 300, s: 270 }, ul: 600, sub: { top: 760, s: 62 }, badge: { top: 930, w: 400, h: 150, s: 96 } },
    { pad: 56, l1: { top: 80, s: 104 }, l2: { top: 186, s: 186 }, ul: 400, sub: { top: 470, s: 40 }, badge: { top: 560, w: 290, h: 110, s: 70 } },
  );
  const css =
    base(p) +
    `
#s1-bg{background:#EEF0F4;}
#s1-vp{position:absolute;left:0;top:0;width:${W}px;height:${H}px;overflow:hidden;}
#s1-feed{position:absolute;left:0;top:0;width:${W}px;height:${POST.top + nPosts * POST.stride}px;}
.s1-post{position:absolute;left:${POST.x}px;width:${POST.w}px;height:${POST.h}px;border-radius:${POST.r}px;background:#fff;box-shadow:0 10px 30px rgba(11,21,48,.06);overflow:hidden;}
.s1-hd{height:${POST.hd}px;display:flex;align-items:center;gap:${Math.round(20 * k)}px;padding:0 ${Math.round(28 * k)}px;}
.s1-av{width:${Math.round(72 * k)}px;height:${Math.round(72 * k)}px;border-radius:50%;flex:none;display:flex;align-items:center;justify-content:center;}
.s1-av-ours{background:linear-gradient(135deg,${ROYAL},${SKY});box-shadow:0 0 0 ${Math.round(4 * k)}px #fff,0 0 0 ${Math.round(7 * k)}px ${SKY};}
.s1-nm{display:flex;flex-direction:column;gap:${Math.round(10 * k)}px;flex:1;}
.s1-nm b{font-weight:600;font-size:${Math.round(30 * k)}px;letter-spacing:-.01em;line-height:1;color:${INK};}
.s1-nm span{font-weight:500;font-size:${Math.round(22 * k)}px;line-height:1;color:#6B7385;}
.s1-dots{font-size:${Math.round(30 * k)}px;color:#6B7385;letter-spacing:.1em;}
.s1-media{position:relative;width:${POST.w}px;height:${POST.mh}px;overflow:hidden;}
.s1-ours{background:radial-gradient(120% 70% at 85% 100%,#2462E0 0%,rgba(36,98,224,0) 60%),linear-gradient(165deg,#0B1530 0%,#12285E 70%,#1A3F9E 100%);}
.s1-act{height:${POST.act}px;display:flex;align-items:center;gap:${Math.round(30 * k)}px;padding:0 ${Math.round(28 * k)}px;}
.s1-cap{display:flex;flex-direction:column;gap:${Math.round(14 * k)}px;padding:0 ${Math.round(28 * k)}px;}
#s1-mc{position:absolute;left:0;top:0;width:${POST.w}px;height:${POST.mh}px;}
#s1-l1{left:${mk.pad}px;top:${mk.l1.top}px;font-size:${mk.l1.s}px;color:#fff;letter-spacing:-.05em;}
#s1-l2{left:${mk.pad - 6}px;top:${mk.l2.top}px;font-size:${mk.l2.s}px;color:${ICE};line-height:1;}
#s1-ul{position:absolute;left:${mk.pad}px;top:${mk.ul}px;}
#s1-sub{left:${mk.pad}px;top:${mk.sub.top}px;font-size:${mk.sub.s}px;font-weight:600;color:rgba(255,255,255,.88);letter-spacing:-.025em;line-height:1.12;white-space:normal;width:${POST.w - 2 * mk.pad}px;}
#s1-badge{position:absolute;overflow:hidden;left:${mk.pad}px;top:${mk.badge.top}px;height:${mk.badge.h}px;padding:0 ${Math.round(mk.badge.h * 0.36)}px 0 ${Math.round(mk.badge.h * 0.2)}px;border-radius:${mk.badge.h / 2}px;display:flex;align-items:center;gap:${Math.round(mk.badge.h * 0.18)}px;background:linear-gradient(135deg,rgba(255,255,255,.22),rgba(255,255,255,.06));border:2px solid rgba(255,255,255,.4);box-shadow:0 30px 60px rgba(0,0,0,.3);}
#s1-bk{width:${Math.round(mk.badge.h * 0.68)}px;height:${Math.round(mk.badge.h * 0.68)}px;border-radius:50%;background:${MINT};display:flex;align-items:center;justify-content:center;flex:none;}
#s1-bt{font-weight:800;font-size:${mk.badge.s}px;letter-spacing:-.03em;color:#fff;line-height:1;}
#s1-shine{position:absolute;left:-200px;top:0;width:140px;height:100%;background:linear-gradient(90deg,rgba(255,255,255,0),rgba(255,255,255,.5),rgba(255,255,255,0));}
`;
  const mc = `<div id="s1-mc">
      <div id="s1-l1" class="s1-h">Para de</div>
      <div id="s1-l2" class="s1-h it">rolar.</div>
      <svg id="s1-ul" width="${Math.round(560 * k)}" height="${Math.round(60 * k)}" viewBox="0 0 560 60"><path id="s1-ulp" d="M8 40 C 140 12, 330 8, 552 30" fill="none" stroke="${ICE}" stroke-width="10" stroke-linecap="round" stroke-dasharray="600 700" stroke-dashoffset="600"/></svg>
      <div id="s1-sub" class="s1-h">${wspans("s1s", "Isso aqui é pra quem tem")}</div>
      <div id="s1-badge"><div id="s1-shine"></div><div id="s1-bk">${icon("check", Math.round(mk.badge.h * 0.42), { sw: 6, color: INK })}</div><span id="s1-bt">CNPJ</span></div>
    </div>`;
  posts = posts.replace(`<div id="s1-media" class="s1-media s1-ours"></div>`, `<div id="s1-media" class="s1-media s1-ours">${mc}</div>`);
  const body = `
  ${vblur("s1-vb")}
  <div id="s1-bg" class="${p}-full"></div>
  <div id="s1-vp"><div id="s1-feed" data-layout-allow-overflow>${posts}</div></div>`;
  add(`tl.set("#s1-feed",{y:${r3(-y0)}},0);`);
  for (const s of feedSegs)
    add(`tl.fromTo("#s1-feed",{y:${r3(-s.from)}},{y:${r3(-s.to)},duration:${r3(s.dur)},ease:"${s.ease}",immediateRender:false},${r3(s.t)});`);
  // desfoque enquanto voa; nítido no toque
  add(`tl.set("#s1-vp",{filter:"url(#s1-vb)"},0);`);
  add(`tl.set("#s1-vb-g",{attr:{stdDeviation:"0 ${pick(13, 9)}"}},0);`);
  add(`tl.set("#s1-vb-g",{attr:{stdDeviation:"0 0"}},${r3(STOP)});`);
  add(`tl.set("#s1-vp",{filter:"none"},${r3(STOP)});`);
  add(`tl.fromTo("#s1-l2",{scaleY:1.16,y:-14},{scaleY:1,y:0,duration:0.4,ease:"back.out(3)",transformOrigin:"0% 100%"},${r3(STOP)});`);
  add(`tl.fromTo("#s1-ulp",{attr:{"stroke-dashoffset":600}},{attr:{"stroke-dashoffset":0},duration:0.4,ease:"power2.out"},${r3(STOP + 0.12)});`);
  const subT = [at("isso"), at("aqui"), at("e"), at("pra"), at("quem"), at("tem")];
  subT.forEach((t, i) => add(`tl.fromTo("#s1s${i}",{yPercent:110,opacity:0},{yPercent:0,opacity:1,duration:0.4,ease:"power3.out"},${r3(L(t) - 0.08)});`));
  add(`tl.fromTo("#s1-badge",{scale:0.6,opacity:0,y:30},{scale:1,opacity:1,y:0,duration:0.5,ease:"back.out(1.7)"},${r3(L(at("cnpj")) - 0.12)});`);
  add(`tl.fromTo("#s1-shine",{x:0},{x:${mk.badge.w + 400},duration:0.7,ease:"power2.inOut"},${r3(L(at("cnpj")) + 0.25)});`);
  // o post se abre e vira a tela (a próxima cena entra por cima)
  const z0 = 3.2;
  const mTop = POST.rest + POST.hd;
  const sc = r3((H / POST.mh) * 1.02);
  add(`tl.set("#s1-vp",{transformOrigin:"${W / 2}px ${r3(mTop + POST.mh / 2)}px"},0);`);
  add(`tl.to("#s1-vp",{scale:${sc},y:${r3(H / 2 - (mTop + POST.mh / 2))},duration:0.5,ease:"power3.inOut"},${z0});`);
  add(`tl.to("#s1-mc",{opacity:0,duration:0.22,ease:"power1.in"},${z0});`);
  scenes.push({ st, track: 0, ...scene(p, dur, css, body, a), feedSegs });
}

// ═════════════ 2 · EXTRATO (rolagem aninhada) ═════════════
{
  const p = "s2";
  const st = 3.3;
  const sd = visEnd("B") - st;
  const pg = pageScene(p, "B", st, sd, "", "");
  const { a, L, add, words } = pg;
  const G2 = pick(
    { lbl: 250, t1: { top: 296, s: 96 }, t2: { top: 392, s: 128 }, panel: { x: 60, y: 580, w: 960, h: 900 }, row: 124, sep: 66, hd: 74, fs: 30 },
    { lbl: 46, t1: { top: 76, s: 66 }, t2: { top: 138, s: 92 }, panel: { x: 60, y: 252, w: 960, h: 772 }, row: 106, sep: 58, hd: 64, fs: 27 },
  );
  const P = G2.panel;
  const MESES = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];
  // conteúdo da lista: 2026 (SET..JAN; OUT entra depois), 2025, 2024, 2023
  const items = [];
  const years = [2026, 2025, 2024, 2023];
  for (const yv of years) {
    items.push({ sep: yv });
    const last = yv === 2026 ? 8 : 11;
    for (let m = last; m >= 0; m--) items.push({ y: yv, m });
  }
  let y = G2.hd; // primeiro separador fica sob o cabeçalho fixo
  const sepPos = [];
  let rows = "";
  for (const it of items) {
    if (it.sep) {
      if (it.sep !== 2026) sepPos.push({ y: y, year: it.sep });
      if (it.sep !== 2026) rows += `<div class="s2-sep" style="top:${y}px">${it.sep}</div>`;
      if (it.sep !== 2026) y += G2.sep;
      continue;
    }
    rows += `<div class="s2-row" style="top:${y}px"><div class="s2-ic">${icon("doc", Math.round(G2.row * 0.36), { color: ICE, sw: 2.8 })}</div><div class="s2-tx"><b>Plano de saúde</b><span>Boleto · ${MESES[it.m]}/${it.y}</span></div><div class="s2-am"><b>R$ ●●●,●●</b><span class="s2-chip">PAGO</span></div></div>`;
    y += G2.row;
  }
  const listH = y + 30;
  const maxL = listH - P.h;
  // gestos da lista
  const LT = { ins: at("boleto") - 0.05, chega: at("chega"), paga: at("paga") - 0.04, fl: at("e", 1) - 0.02 };
  const LIST = [flick(LT.fl, 0, maxL, { td: 0.14, tm: 1.5, over: pick(90, 70), back: 0.34, finger: { x: P.x + P.w * 0.72, y: P.y + P.h * 0.72 } })];
  const LSEG = segsOf(LIST);
  const css = `
#s2-sec{position:absolute;left:0;top:0;width:${W}px;height:${SEC.B.h}px;background:radial-gradient(90% 50% at 80% 0%,#1C3577 0%,rgba(28,53,119,0) 60%),linear-gradient(180deg,#0B1530 0%,#0E1E48 100%);}
#s2-lbl{left:${P.x}px;top:${G2.lbl}px;font-size:${pick(22, 18)}px;color:#7F93C9;}
#s2-t1{left:${P.x}px;top:${G2.t1.top}px;font-size:${G2.t1.s}px;color:#fff;}
#s2-t2{left:${P.x - 4}px;top:${G2.t2 ? G2.t2.top : 0}px;font-size:${G2.t2 ? G2.t2.s : 0}px;color:${ICE};}
#s2-panel{position:absolute;left:${P.x}px;top:${P.y}px;width:${P.w}px;height:${P.h}px;border-radius:${pick(40, 34)}px;background:rgba(255,255,255,.045);border:1.5px solid rgba(255,255,255,.09);overflow:hidden;}
#s2-clip{position:absolute;inset:0;overflow:hidden;}
#s2-list{position:absolute;left:0;top:0;width:${P.w}px;height:${listH}px;}
.s2-row{position:absolute;left:0;width:${P.w}px;height:${G2.row}px;display:flex;align-items:center;padding:0 ${pick(32, 28)}px;gap:${pick(24, 20)}px;border-bottom:1px solid rgba(255,255,255,.06);}
.s2-ic{width:${Math.round(G2.row * 0.62)}px;height:${Math.round(G2.row * 0.62)}px;border-radius:${pick(20, 18)}px;background:rgba(140,203,255,.12);display:flex;align-items:center;justify-content:center;flex:none;}
.s2-tx{display:flex;flex-direction:column;gap:${pick(8, 6)}px;flex:1;}
.s2-tx b{font-weight:600;font-size:${G2.fs}px;color:#fff;line-height:1;letter-spacing:-.01em;}
.s2-tx span{font-weight:500;font-size:${Math.round(G2.fs * 0.74)}px;color:#8B98B8;line-height:1;}
.s2-am{display:flex;flex-direction:column;align-items:flex-end;gap:${pick(10, 8)}px;}
.s2-am b{font-weight:600;font-size:${Math.round(G2.fs * 0.94)}px;color:#fff;line-height:1;font-variant-numeric:tabular-nums;}
.s2-chip{font-weight:700;font-size:${Math.round(G2.fs * 0.58)}px;letter-spacing:.14em;color:${MINT};background:rgba(43,212,164,.14);border-radius:99px;padding:${pick(6, 5)}px ${pick(14, 12)}px ${pick(5, 4)}px;line-height:1;}
.s2-sep{position:absolute;left:0;width:${P.w}px;height:${G2.sep}px;display:flex;align-items:center;padding:0 ${pick(32, 28)}px;font-weight:700;font-size:${Math.round(G2.fs * 0.86)}px;color:${ICE};letter-spacing:.04em;background:rgba(255,255,255,.03);}
#s2-hdr{position:absolute;left:0;top:0;width:${P.w}px;height:${G2.hd}px;display:flex;align-items:center;justify-content:space-between;padding:0 ${pick(32, 28)}px;background:#132453;border-bottom:1px solid rgba(255,255,255,.08);}
#s2-yr{font-weight:700;font-size:${Math.round(G2.fs * 0.95)}px;color:#fff;letter-spacing:.02em;}
#s2-hdr span{font-weight:600;font-size:${Math.round(G2.fs * 0.6)}px;letter-spacing:.18em;color:#7F93C9;}
#s2-newwrap{position:absolute;left:0;top:${G2.hd}px;width:${P.w}px;height:${G2.row}px;overflow:hidden;}
#s2-new{position:absolute;left:0;top:0;width:${P.w}px;height:${G2.row}px;background:#16295C;}
#s2-hl{position:absolute;inset:0;background:rgba(140,203,255,.16);opacity:0;}
#s2-pend{position:absolute;right:0;bottom:0;color:#FF8A80;background:rgba(240,72,60,.18);}
#s2-paid{position:absolute;right:0;bottom:0;opacity:0;display:flex;align-items:center;gap:6px;}
#s2-amw{position:relative;width:${pick(190, 170)}px;height:${Math.round(G2.row * 0.56)}px;}
#s2-amw b{position:absolute;right:0;top:0;}
#s2-sb{position:absolute;right:6px;top:${G2.hd + 8}px;width:6px;height:${Math.round(((P.h - G2.hd) * (P.h - G2.hd)) / listH)}px;border-radius:3px;background:rgba(255,255,255,.4);opacity:0;}
#s2-dim{position:absolute;left:0;top:0;width:${W}px;height:${H}px;background:rgba(5,10,25,.55);opacity:0;}
#s2-sheet{position:absolute;left:0;top:${pick(1000, 470)}px;width:${W}px;height:${pick(920, 610)}px;border-radius:${pick(52, 40)}px ${pick(52, 40)}px 0 0;background:#fff;box-shadow:0 -30px 80px rgba(0,0,0,.35);}
#s2-handle{position:absolute;left:${W / 2 - 44}px;top:${pick(22, 18)}px;width:88px;height:9px;border-radius:5px;background:#D5DAE5;}
#s2-sl{left:${P.x}px;top:${pick(72, 58)}px;font-size:${pick(22, 18)}px;color:${MUTED};display:flex;align-items:center;gap:14px;}
#s2-q1{left:${P.x}px;top:${pick(128, 104)}px;font-size:${pick(72, 60)}px;color:${INK};}
#s2-q2{left:${P.x}px;top:${pick(214, 178)}px;font-size:${pick(72, 60)}px;color:${INK};}
#s2-q3{left:${P.x - 4}px;top:${pick(288, 240)}px;font-size:${pick(150, 112)}px;color:${PBLUE};}
`;
  const newRow = `<div id="s2-newwrap"><div id="s2-new" class="s2-row" style="top:0"><div id="s2-hl"></div><div class="s2-ic">${icon("doc", Math.round(G2.row * 0.36), { color: ICE, sw: 2.8 })}</div><div class="s2-tx"><b>Plano de saúde</b><span>Boleto · OUT/2026</span></div><div id="s2-amw"><b class="s2-amb" style="font-weight:600;font-size:${Math.round(G2.fs * 0.94)}px;color:#fff;line-height:1;font-variant-numeric:tabular-nums">R$ ●●●,●●</b><span id="s2-pend" class="s2-chip">PENDENTE</span><span id="s2-paid" class="s2-chip">${icon("check", Math.round(G2.fs * 0.6), { color: MINT, sw: 6 })}PAGO</span></div></div></div>`;
  const inner = `<div id="s2-sec">
      <div id="s2-lbl" class="${p}-lbl">Plano de saúde · Boletos</div>
      <div id="s2-t1" class="${p}-h">${wspans("s2a", "Todo mês,")}</div><div id="s2-t2" class="${p}-h">${wsp("s2b", "*o boleto chega.*")}</div>
      <div id="s2-panel" aria-hidden="true" data-layout-allow-overlap><div id="s2-clip"><div id="s2-list">${rows}</div>${newRow}</div><div id="s2-hdr"><div id="s2-yr">2026</div><span>PLANO DE SAÚDE</span></div><div id="s2-sb"></div></div>
    </div>
    <div id="s2-dim"></div>
    <div id="s2-sheet"><div id="s2-handle"></div>
      <div id="s2-sl" class="${p}-lbl">${icon("cal", pick(34, 28), { color: MUTED, sw: 3 })}<span>Comparação de planos</span></div>
      <div id="s2-q1" class="${p}-h">${wspans("s2q", "Quando foi a última vez")}</div>
      <div id="s2-q2" class="${p}-h">${wspans("s2r", "que você")}</div>
      <div id="s2-q3" class="${p}-h">${wsp("s2c", "*comparou?*")}</div>
    </div>`;
  pg.body = pg.body.replace(`<div id="${p}-pg" data-layout-allow-overflow></div>`, `<div id="${p}-pg" data-layout-allow-overflow>${inner}</div>`);
  // entrada: a tela do post vira este app
  add(`tl.fromTo("#s2-root",{opacity:0},{opacity:1,duration:0.3,ease:"power1.out"},0);`);
  add(`tl.fromTo("#s2-lbl",{opacity:0,y:12},{opacity:1,y:0,duration:0.4,ease:"power2.out"},0.15);`);
  words("s2a", 2, [at("todo"), at("mes")], 0.45);
  words("s2b", 3, [at("o"), at("boleto"), at("chega")], 0.45);
  add(`tl.fromTo("#s2-panel",{opacity:0,y:60},{opacity:1,y:0,duration:0.6,ease:"power3.out"},0.12);`);
  // boleto novo entra no topo e empurra a lista
  add(`tl.set("#s2-list",{y:0},0);`);
  add(`tl.fromTo("#s2-newwrap",{height:0},{height:${G2.row},duration:0.45,ease:"power3.out"},${L(LT.ins)});`);
  add(`tl.fromTo("#s2-list",{y:0},{y:${G2.row},duration:0.45,ease:"power3.out",immediateRender:false},${L(LT.ins)});`);
  add(`tl.fromTo("#s2-new",{y:-40,opacity:0},{y:0,opacity:1,duration:0.45,ease:"power3.out"},${L(LT.ins)});`);
  add(`tl.fromTo("#s2-hl",{opacity:0},{opacity:1,duration:0.2,ease:"power1.out"},${L(LT.chega)});`);
  add(`tl.to("#s2-hl",{opacity:0,duration:0.8,ease:"power1.in"},${r3(L(LT.chega) + 0.3)});`);
  add(`tl.to("#s2-pend",{opacity:0,scale:0.6,duration:0.16,ease:"power2.in"},${L(LT.paga)});`);
  add(`tl.fromTo("#s2-paid",{opacity:0,scale:1.6},{opacity:1,scale:1,duration:0.32,ease:"back.out(2.2)"},${r3(L(LT.paga) + 0.12)});`);
  // arremesso: a lista inteira (com o boleto novo) corre até 2023 e volta no limite
  const listTop = G2.row; // lista deslocada pelo boleto novo
  for (const s of LSEG) {
    add(`tl.fromTo("#s2-list",{y:${r3(listTop - s.from)}},{y:${r3(listTop - s.to)},duration:${r3(s.dur)},ease:"${s.ease}",immediateRender:false},${L(s.t)});`);
    add(`tl.fromTo("#s2-newwrap",{y:${r3(-s.from)}},{y:${r3(-s.to)},duration:${r3(s.dur)},ease:"${s.ease}",immediateRender:false},${L(s.t)});`);
  }
  // desfoque proporcional à velocidade (só o recorte da lista)
  {
    const [sd1, sm] = LSEG;
    add(`tl.set("#s2-clip",{filter:"url(#s2-lb)"},${L(sd1.t)});`);
    add(`tl.fromTo("#s2-lb-g",{attr:{stdDeviation:"0 0"}},{attr:{stdDeviation:"0 ${pick(16, 12)}"},duration:${r3(sd1.dur)},ease:"power1.in",immediateRender:false},${L(sd1.t)});`);
    add(`tl.fromTo("#s2-lb-g",{attr:{stdDeviation:"0 ${pick(16, 12)}"}},{attr:{stdDeviation:"0 0"},duration:${r3(sm.dur * 0.75)},ease:"power3.out",immediateRender:false},${L(sm.t)});`);
    add(`tl.set("#s2-clip",{filter:"none"},${r3(L(sm.t) + sm.dur * 0.75)});`);
  }
  // barra de rolagem da lista
  {
    const track = P.h - G2.hd - 16 - Math.round(((P.h - G2.hd) * (P.h - G2.hd)) / listH);
    const yb = (v) => r3((Math.max(0, Math.min(maxL, v)) / maxL) * track);
    add(`tl.fromTo("#s2-sb",{opacity:0},{opacity:1,duration:0.12},${L(LT.fl)});`);
    for (const s of LSEG) add(`tl.fromTo("#s2-sb",{y:${yb(s.from)}},{y:${yb(s.to)},duration:${r3(s.dur)},ease:"${s.ease}",immediateRender:false},${L(s.t)});`);
    const le = LSEG[LSEG.length - 1];
    add(`tl.to("#s2-sb",{opacity:0,duration:0.4},${r3(L(le.t + le.dur) + 0.5)});`);
  }
  // cabeçalho fixo: o ano troca quando o separador chega ao topo
  {
    for (const sp of sepPos) {
      let tc = null;
      for (let t = LT.fl; t < LT.fl + 2.4; t += 0.002) {
        if (listTop + sp.y - valueAt(LSEG, t) <= G2.hd) {
          tc = t;
          break;
        }
      }
      if (tc !== null) add(`tl.set("#s2-yr",{textContent:"${sp.year}"},${L(tc)});`);
    }
  }
  // folha de baixo com a pergunta
  const sh0 = at("quando") - 0.3;
  add(`tl.fromTo("#s2-dim",{opacity:0},{opacity:1,duration:0.5,ease:"power1.out"},${L(sh0)});`);
  add(`tl.fromTo("#s2-sheet",{y:${pick(1000, 700)}},{y:0,duration:0.6,ease:"power3.out"},${L(sh0)});`);
  add(`tl.fromTo("#s2-sl",{opacity:0},{opacity:1,duration:0.3},${r3(L(sh0) + 0.25)});`);
  words("s2q", 5, [at("quando"), at("foi"), at("a"), at("ultima"), at("vez")], 0.42);
  words("s2r", 2, [at("que"), at("voce", 1)], 0.42);
  add(`tl.fromTo("#s2c0",{yPercent:110,opacity:0,scale:1.15},{yPercent:0,opacity:1,scale:1,duration:0.5,ease:"back.out(1.4)"},${r3(L(at("comparou")) - 0.08)});`);
  pg.css += css.replace(/^\n/, "");
  const sc = scene(p, sd, pg.css, pg.body.replace(vblur(`${p}-vb`), vblur(`${p}-vb`) + vblur("s2-lb")), a);
  scenes.push({ st, track: 1, ...sc, LSEG, LIST });
}

// fim de um gesto da página que começa em t
const moveEnd = (t) => PAGE.find((m) => Math.abs(m.t - t) < 1e-6).end;
// a cena de uma seção existe enquanto alguma parte dela pode estar na tela
function visStart(key) {
  const s = SEC[key];
  for (const m of PAGE) if (Math.max(...m.segs.flatMap((g) => [g.from, g.to])) + H > s.top + 1) return m.t - 0.02;
  throw new Error(`seção ${key} nunca aparece`);
}
function visEnd(key) {
  const s = SEC[key];
  let e = null;
  for (const m of PAGE) if (Math.min(...m.segs.flatMap((g) => [g.from, g.to])) < s.top + s.h - 1) e = m.end + 0.1;
  return e;
}

// ═════════════ 3 · "Você pode estar pagando caro." ═════════════
{
  const p = "s3";
  const st = visStart("C");
  const sd = visEnd("C") - st;
  const pg = pageScene(p, "C", st, sd, "", "");
  const { a, L, add, words } = pg;
  const g = pick(
    { lbl: [72, 300], l1: [72, 340, 104], l2: [72, 452, 104], l3: [62, 520, 330], rc: { x: 230, y: 900, w: 640, k: 1 }, bd: [790, 860, 132] },
    { lbl: [60, 300], l1: [60, 336, 76], l2: [60, 420, 76], l3: [52, 488, 230], rc: { x: 664, y: 300, w: 372, k: 0.6 }, bd: [972, 272, 90] },
  );
  const k = g.rc.k;
  const MES = ["JAN", "FEV", "MAR", "ABR", "MAI"];
  const rrows = MES.map((m) => `<div class="s3-rr"><span>${m} · plano de saúde</span><b>R$ ●●●,●●</b></div>`).join("");
  pg.css += `
#s3-sec{position:absolute;left:0;top:0;width:${W}px;height:${SEC.C.h}px;background:linear-gradient(180deg,${PAPER} 0%,#FFFFFF 100%);}
#s3-lbl{left:${g.lbl[0]}px;top:${g.lbl[1]}px;font-size:${pick(22, 18)}px;color:${MUTED};}
#s3-l1{left:${g.l1[0]}px;top:${g.l1[1]}px;font-size:${g.l1[2]}px;color:${INK};}
#s3-l2{left:${g.l2[0]}px;top:${g.l2[1]}px;font-size:${g.l2[2]}px;color:${INK};}
#s3-l3{left:${g.l3[0]}px;top:${g.l3[1]}px;font-size:${g.l3[2]}px;color:${CORAL};line-height:.9;}
#s3-rcw{position:absolute;left:${g.rc.x}px;top:${g.rc.y}px;width:${g.rc.w}px;}
#s3-rot{transform:rotate(-3deg);transform-origin:50% 0;}
#s3-rc{position:relative;width:${g.rc.w}px;padding:${Math.round(44 * k)}px ${Math.round(44 * k)}px ${Math.round(70 * k)}px;background:#fff;border-radius:${Math.round(18 * k)}px ${Math.round(18 * k)}px 0 0;box-shadow:0 40px 80px rgba(11,21,48,.14);-webkit-mask:linear-gradient(#000,#000) top/100% calc(100% - ${Math.round(18 * k)}px) no-repeat,conic-gradient(from -45deg at bottom,#0000,#000 1deg 89deg,#0000 90deg) bottom/${Math.round(36 * k)}px ${Math.round(18 * k)}px repeat-x;mask:linear-gradient(#000,#000) top/100% calc(100% - ${Math.round(18 * k)}px) no-repeat,conic-gradient(from -45deg at bottom,#0000,#000 1deg 89deg,#0000 90deg) bottom/${Math.round(36 * k)}px ${Math.round(18 * k)}px repeat-x;}
.s3-rh{font-weight:700;font-size:${Math.round(22 * k)}px;letter-spacing:.16em;color:${INK};padding-bottom:${Math.round(22 * k)}px;border-bottom:${Math.max(2, Math.round(3 * k))}px dashed #D5DAE5;}
.s3-rr{display:flex;justify-content:space-between;align-items:center;padding:${Math.round(18 * k)}px 0;border-bottom:1px solid #EEF1F6;font-size:${Math.round(25 * k)}px;color:#3B4357;}
.s3-rr b{font-weight:600;font-variant-numeric:tabular-nums;}
.s3-rt{display:flex;justify-content:space-between;align-items:flex-end;padding-top:${Math.round(26 * k)}px;margin-top:${Math.round(8 * k)}px;border-top:${Math.max(2, Math.round(3 * k))}px dashed #D5DAE5;}
.s3-rt span{font-weight:700;font-size:${Math.round(22 * k)}px;letter-spacing:.14em;color:${INK};}
#s3-tot{font-weight:700;font-size:${Math.round(50 * k)}px;color:${CORAL};font-variant-numeric:tabular-nums;line-height:1;}
#s3-bd{position:absolute;left:${g.bd[0] - g.bd[2] / 2}px;top:${g.bd[1] - g.bd[2] / 2}px;width:${g.bd[2]}px;height:${g.bd[2]}px;border-radius:50%;background:${CORAL};display:flex;align-items:center;justify-content:center;box-shadow:0 20px 40px rgba(240,72,60,.4);}
`;
  const inner = `<div id="s3-sec">
      <div id="s3-lbl" class="${p}-lbl">Sua mensalidade</div>
      <div id="s3-l1" class="${p}-h">${wspans("s3a", pick("Você pode estar", "Você pode"))}</div>
      <div id="s3-l2" class="${p}-h">${wspans("s3b", pick("pagando", "estar pagando"))}</div>
      <div id="s3-l3" class="${p}-h">${wsp("s3c", "*caro.*")}</div>
      <div id="s3-rcw"><div id="s3-rot"><div id="s3-rc"><div class="s3-rh">RECIBO · PLANO DE SAÚDE</div>${rrows}<div class="s3-rt"><span>TOTAL NO ANO</span><b id="s3-tot">R$ ?.???,??</b></div></div></div></div>
      <div id="s3-bd">${icon("arrowUp", Math.round(g.bd[2] * 0.5), { sw: 5 })}</div>
    </div>`;
  pg.body = pg.body.replace(`<div id="${p}-pg" data-layout-allow-overflow></div>`, `<div id="${p}-pg" data-layout-allow-overflow>${inner}</div>`);
  if (ST) {
    words("s3a", 3, [at("voce", 2), at("pode"), at("estar")], 0.42);
    words("s3b", 1, [at("pagando")], 0.42);
  } else {
    words("s3a", 2, [at("voce", 2), at("pode")], 0.42);
    words("s3b", 2, [at("estar"), at("pagando")], 0.42);
  }
  add(`tl.fromTo("#s3c0",{yPercent:100,opacity:0,scale:1.2},{yPercent:0,opacity:1,scale:1,duration:0.55,ease:"back.out(1.5)"},${r3(L(at("caro")) - 0.1)});`);
  add(`tl.fromTo("#s3-bd",{scale:0,rotation:-40},{scale:1,rotation:0,duration:0.5,ease:"back.out(2)"},${r3(L(at("caro")) + 0.05)});`);
  add(`tl.fromTo("#s3-tot",{scale:1},{scale:1.12,duration:0.12,ease:"power2.out"},${r3(L(at("caro")) + 0.05)});`);
  add(`tl.to("#s3-tot",{scale:1,duration:0.4,ease:"power2.out"},${r3(L(at("caro")) + 0.17)});`);
  // paralaxe: o recibo anda um pouco mais rápido que o texto
  scrollTweens(add, L, "#s3-rcw", 0.18 * SEC.C.top, st, sd, { sign: -0.18 });
  scenes.push({ st, track: 2, ...scene(p, sd, pg.css, pg.body, a) });
}

// ═════════════ 4 · CNPJ: "pode reduzir bastante… mesma qualidade" ═════════════
{
  const p = "s4";
  const st = visStart("D");
  const sd = visEnd("D") - st;
  const pg = pageScene(p, "D", st, sd, "", "");
  const { a, L, add, words } = pg;
  const g = pick(
    {
      h1: [300, 78], h2: [392, 78], card: { x: 160, y: 560, w: 760, h: 460, k: 1 },
      t1: [72, 1110, 90], t2: [62, 1196, 196], chart: { lbl: [72, 1438], pts: [[84, 1540], [220, 1556], [330, 1536], [470, 1664], [600, 1646], [740, 1780], [880, 1764], [996, 1866]], base: 1900 },
      hosp: { x: 72, y: 2120, w: 936, h: 560 }, ok: [118, 2628, 104], c1: [72, 2740, 66], c2: [62, 2812, 132],
    },
    {
      h1: [80, 56], h2: null, card: { x: 230, y: 180, w: 620, h: 376, k: 0.82 },
      t1: [60, 660, 72], t2: [52, 728, 150], chart: { lbl: [560, 640], pts: [[560, 720], [640, 732], [710, 718], [800, 812], [870, 800], [950, 904], [1016, 962]], base: 1000 },
      hosp: { x: 160, y: 1480, w: 760, h: 460 }, ok: [196, 1892, 84], c1: [160, 1970, 50], c2: [152, 2028, 100],
    },
  );
  const k = g.card.k;
  const pts = g.chart.pts;
  const pathD = pts.map(([x, y], i) => `${i ? "L" : "M"}${x} ${y}`).join(" ");
  const area = `${pathD} L${pts[pts.length - 1][0]} ${g.chart.base} L${pts[0][0]} ${g.chart.base} Z`;
  const len = Math.round(pts.slice(1).reduce((s, q, i) => s + Math.hypot(q[0] - pts[i][0], q[1] - pts[i][1]), 0));
  const [ex, ey] = pts[pts.length - 1];
  const [px, py] = pts[pts.length - 2];
  const ang = r3((Math.atan2(ey - py, ex - px) * 180) / Math.PI);
  const hs = (1.12 * g.hosp.w) / 1080;
  pg.css += `
#s4-sec{position:absolute;left:0;top:0;width:${W}px;height:${SEC.D.h}px;background:linear-gradient(180deg,#1B3DB4 0%,#2257D8 40%,#2B72EA 75%,#3184F0 100%);overflow:hidden;}
.s4-ring{position:absolute;border-radius:50%;border:2px solid rgba(255,255,255,.12);}
.s4-hd{position:absolute;left:0;width:${W}px;text-align:center;font-weight:600;color:#fff;letter-spacing:-.03em;line-height:1;white-space:nowrap;}
#s4-card{position:absolute;left:${g.card.x}px;top:${g.card.y}px;width:${g.card.w}px;height:${g.card.h}px;border-radius:${Math.round(40 * k)}px;background:linear-gradient(135deg,rgba(255,255,255,.3),rgba(255,255,255,.08));border:2px solid rgba(255,255,255,.5);box-shadow:0 40px 90px rgba(5,15,60,.45);overflow:hidden;color:#fff;}
#s4-chip{position:absolute;left:${Math.round(48 * k)}px;top:${Math.round(52 * k)}px;width:${Math.round(70 * k)}px;height:${Math.round(52 * k)}px;border-radius:${Math.round(12 * k)}px;background:linear-gradient(135deg,#F6F9FF,#A9C3F2);}
#s4-pj{position:absolute;right:${Math.round(48 * k)}px;top:${Math.round(64 * k)}px;font-weight:600;font-size:${Math.round(20 * k)}px;letter-spacing:.26em;color:rgba(255,255,255,.88);}
#s4-cn{position:absolute;left:${Math.round(44 * k)}px;top:${Math.round(140 * k)}px;font-weight:800;font-size:${Math.round(176 * k)}px;letter-spacing:-.05em;line-height:1;}
#s4-num{position:absolute;left:${Math.round(48 * k)}px;top:${Math.round(370 * k)}px;font-weight:600;font-size:${Math.round(32 * k)}px;letter-spacing:.08em;color:rgba(255,255,255,.9);}
#s4-ring{position:absolute;right:${Math.round(-70 * k)}px;bottom:${Math.round(-100 * k)}px;width:${Math.round(330 * k)}px;height:${Math.round(330 * k)}px;border-radius:50%;border:${Math.round(28 * k)}px solid rgba(255,255,255,.12);}
#s4-shine{position:absolute;left:-300px;top:-40px;width:200px;height:${g.card.h + 80}px;background:linear-gradient(90deg,rgba(255,255,255,0),rgba(255,255,255,.55),rgba(255,255,255,0));}
#s4-t1{left:${g.t1[0]}px;top:${g.t1[1]}px;font-size:${g.t1[2]}px;color:#fff;}
#s4-t2{left:${g.t2[0]}px;top:${g.t2[1]}px;font-size:${g.t2[2]}px;color:#D6EAFF;line-height:.95;}
#s4-chart{position:absolute;left:0;top:0;}
#s4-clbl{left:${g.chart.lbl[0]}px;top:${g.chart.lbl[1]}px;font-size:${pick(20, 16)}px;color:rgba(255,255,255,.78);}
#s4-hosp{position:absolute;left:${g.hosp.x}px;top:${g.hosp.y}px;width:${g.hosp.w}px;height:${g.hosp.h}px;border-radius:${pick(40, 32)}px;overflow:hidden;box-shadow:0 0 0 ${pick(6, 5)}px rgba(255,255,255,.9),0 40px 90px rgba(5,15,60,.45);}
#s4-himg{position:absolute;left:${-Math.round(0.06 * g.hosp.w)}px;top:${-Math.round(50 * hs)}px;width:${Math.round(1.12 * g.hosp.w)}px;height:${Math.round(1920 * hs)}px;background:url("assets/img/plate.png") 0 0/${Math.round(1.12 * g.hosp.w)}px ${Math.round(1920 * hs)}px no-repeat;}
#s4-ok{position:absolute;left:${g.ok[0] - g.ok[2] / 2}px;top:${g.ok[1] - g.ok[2] / 2}px;width:${g.ok[2]}px;height:${g.ok[2]}px;border-radius:50%;background:#fff;display:flex;align-items:center;justify-content:center;box-shadow:0 16px 40px rgba(5,15,60,.35);}
#s4-c1{left:${g.c1[0]}px;top:${g.c1[1]}px;font-size:${g.c1[2]}px;font-weight:600;color:#fff;}
#s4-c2{left:${g.c2[0]}px;top:${g.c2[1]}px;font-size:${g.c2[2]}px;color:#fff;line-height:.95;}
`;
  const inner = `<div id="s4-sec">
      <div class="s4-ring" style="left:${pick(560, 700)}px;top:${pick(-160, -220)}px;width:900px;height:900px"></div>
      <div class="s4-ring" style="left:${pick(-420, -460)}px;top:${pick(1300, 900)}px;width:860px;height:860px"></div>
      ${
        ST
          ? `<div class="s4-hd" style="top:${g.h1[0]}px;font-size:${g.h1[1]}px">${wspans("s4a", "E muita gente")}</div><div class="s4-hd" style="top:${g.h2[0]}px;font-size:${g.h2[1]}px">${wspans("s4b", "já descobriu:")}</div>`
          : `<div class="s4-hd" style="top:${g.h1[0]}px;font-size:${g.h1[1]}px">${wspans("s4a", "E muita gente")} ${wspans("s4b", "já descobriu:")}</div>`
      }
      <div id="s4-card"><div id="s4-ring"></div><div id="s4-chip"></div><div id="s4-pj">PESSOA JURÍDICA</div><div id="s4-cn">CNPJ</div><div id="s4-num">••.•••.•••/0001-••</div><div id="s4-shine"></div></div>
      <div id="s4-t1" class="${p}-h">${wspans("s4c", "pode reduzir")}</div>
      <div id="s4-t2" class="${p}-h">${wsp("s4d", "*bastante*")}</div>
      <div id="s4-clbl" class="${p}-lbl">Valor da mensalidade</div>
      <svg id="s4-chart" viewBox="0 0 ${W} ${SEC.D.h}" width="${W}" height="${SEC.D.h}">
        <defs><linearGradient id="s4-ag" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".22"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>
        <path id="s4-area" d="${area}" fill="url(#s4-ag)" opacity="0"/>
        <path id="s4-cl" d="${pathD}" fill="none" stroke="#fff" stroke-width="${pick(10, 8)}" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="${len} ${len + 60}" stroke-dashoffset="${len}"/>
        <g transform="translate(${ex} ${ey}) rotate(${ang})"><path id="s4-ch" d="M-8 -26 L30 0 L-8 26 Z" fill="#fff" opacity="0"/></g>
      </svg>
      <div id="s4-hosp"><div id="s4-himg"></div></div>
      <div id="s4-ok">${icon("check", Math.round(g.ok[2] * 0.6), { color: ROYAL, sw: 5.5 })}</div>
      <div id="s4-c1" class="${p}-h">${wspans("s4e", "mantendo a")}</div>
      <div id="s4-c2" class="${p}-h">${wsp("s4f", "*mesma qualidade.*")}</div>
    </div>`;
  pg.body = pg.body.replace(`<div id="${p}-pg" data-layout-allow-overflow></div>`, `<div id="${p}-pg" data-layout-allow-overflow>${inner}</div>`);
  words("s4a", 3, [at("e", 2), at("muita"), at("gente")], 0.42);
  words("s4b", 2, [at("ja"), at("descobriu")], 0.42);
  const cIn = at("usar") - 0.12;
  add(`tl.fromTo("#s4-card",{rotationY:75,y:60,opacity:0,transformPerspective:1600},{rotationY:0,y:0,opacity:1,duration:0.66,ease:"power3.out"},${L(cIn)});`);
  add(`tl.fromTo("#s4-cn",{scale:1},{scale:1.07,duration:0.12,ease:"power2.out"},${L(at("cnpj", 1))});`);
  add(`tl.to("#s4-cn",{scale:1,duration:0.4,ease:"power2.out"},${r3(L(at("cnpj", 1)) + 0.12)});`);
  add(`tl.fromTo("#s4-shine",{x:0},{x:${g.card.w + 600},duration:0.75,ease:"power2.inOut"},${r3(L(at("cnpj", 1)) + 0.05)});`);
  words("s4c", 2, [at("pode", 1), at("reduzir")], 0.42);
  add(`tl.fromTo("#s4d0",{yPercent:100,opacity:0},{yPercent:0,opacity:1,duration:0.55,ease:"power3.out"},${r3(L(at("bastante")) - 0.1)});`);
  add(`tl.fromTo("#s4-clbl",{opacity:0},{opacity:1,duration:0.4},${r3(L(T.drift) + 0.1)});`);
  // o gráfico é desenhado pela própria rolagem (mesma curva e duração)
  add(`tl.fromTo("#s4-cl",{attr:{"stroke-dashoffset":${len}}},{attr:{"stroke-dashoffset":0},duration:2.25,ease:"sine.inOut"},${L(T.drift)});`);
  add(`tl.fromTo("#s4-area",{opacity:0},{opacity:1,duration:1.2,ease:"power1.inOut"},${r3(L(T.drift) + 1.0)});`);
  add(`tl.fromTo("#s4-ch",{opacity:0,scale:0.3},{opacity:1,scale:1,duration:0.3,ease:"back.out(2)",transformOrigin:"50% 50%"},${r3(L(T.drift) + 2.2)});`);
  // hospital: paralaxe da foto dentro do cartão
  scrollTweens(add, L, "#s4-himg", -0.04 * (SEC.D.top + dD2), st, sd, { sign: 0.04 });
  add(`tl.fromTo("#s4-ok",{scale:0,opacity:0},{scale:1,opacity:1,duration:0.45,ease:"back.out(2)"},${r3(L(at("mesma")) - 0.15)});`);
  words("s4e", 2, [at("mantendo"), at("a", 1)], 0.42);
  add(`tl.fromTo("#s4f0",{yPercent:100,opacity:0},{yPercent:0,opacity:1,duration:0.5,ease:"power3.out"},${r3(L(at("mesma")) - 0.08)});`);
  add(`tl.fromTo("#s4f1",{yPercent:100,opacity:0},{yPercent:0,opacity:1,duration:0.5,ease:"power3.out"},${r3(L(at("qualidade")) - 0.08)});`);
  scenes.push({ st, track: 3, ...scene(p, sd, pg.css, pg.body, a) });
}

// ═════════════ 5 · OFERTA PORTO ═════════════
{
  const p = "s5";
  const st = visStart("E");
  const sd = visEnd("E") - st;
  const pg = pageScene(p, "E", st, sd, "", "");
  const { a, L, add } = pg;
  const g = pick(
    {
      logo: { x: 375, y: 262, w: 330 }, pill: { top: 372, h: 58, fs: 23, x: null },
      stage: { x: 60, y: 468, w: 960, h: 716 }, ppl: 610, price: { x: 60, y: 1206, w: 960, h: 184 }, foot: { x: 60, y: 1410, w: 960, fs: 19, lh: 25, al: "center" },
    },
    {
      logo: { x: 60, y: 64, w: 230 }, pill: { top: 140, h: 46, fs: 18, x: 60 },
      stage: { x: 560, y: 60, w: 460, h: 960 }, ppl: 660, price: { x: 60, y: 456, w: 460, h: 150 }, foot: { x: 60, y: 626, w: 460, fs: 16, lh: 21, al: "left" },
    },
  );
  g.logo.h = r3((g.logo.w * 32) / 140);
  // família: recorte 768x1376, pessoas em x 52–721, y 386–1375
  const fs = g.ppl / 989;
  const fw = Math.round(768 * fs);
  const fh = Math.round(1376 * fs);
  const fcx = g.stage.x + g.stage.w / 2;
  const fx = Math.round(fcx - ((52 + 721) / 2) * fs) - g.stage.x;
  const fy = g.stage.h - Math.round(1375 * fs);
  const head = (hx, hy) => [Math.round(g.stage.x + fx + hx * fs), Math.round(g.stage.y + fy + hy * fs)];
  const HEADS = [head(255, 450), head(405, 555), head(528, 535)];
  const chips = pick(
    [
      { cx: 200, cy: 640, t: "ADULTO", s: "até 38 anos" },
      { cx: 552, cy: 520, t: "ADULTO", s: "até 38 anos" },
      { cx: 880, cy: 640, t: "JOVEM", s: "até 18 anos" },
    ],
    null,
  );
  pg.css += `
#s5-sec{position:absolute;left:0;top:0;width:${W}px;height:${SEC.E.h}px;background:radial-gradient(70% 40% at 15% 10%,#FFFFFF 0%,rgba(255,255,255,0) 70%),${LAV};}
#s5-logo{position:absolute;left:${g.logo.x}px;top:${g.logo.y}px;width:${g.logo.w}px;height:${g.logo.h}px;}
#s5-pill{position:absolute;${ST ? `left:0;width:${W}px;display:flex;justify-content:center;` : `left:${g.pill.x}px;`}top:${g.pill.top}px;}
#s5-pill span{display:block;height:${g.pill.h}px;line-height:${g.pill.h}px;padding:0 ${Math.round(g.pill.h * 0.55)}px;border-radius:${g.pill.h / 2}px;background:${ROYAL};color:#fff;font-weight:700;font-size:${g.pill.fs}px;letter-spacing:.08em;white-space:nowrap;}
#s5-stage{position:absolute;left:${g.stage.x}px;top:${g.stage.y}px;width:${g.stage.w}px;height:${g.stage.h}px;border-radius:${pick(48, 40)}px;overflow:hidden;background:radial-gradient(60% 55% at 50% 62%,#CFE0FF 0%,#E7EEFB 55%,#F7F9FD 100%);box-shadow:0 30px 70px rgba(11,21,48,.12);}
#s5-three{position:absolute;left:0;width:${g.stage.w}px;top:${pick(-120, 40)}px;text-align:center;font-size:${pick(900, 640)}px;line-height:1;color:rgba(33,70,195,.08);}
#s5-fam{position:absolute;left:${fx}px;top:${fy}px;width:${fw}px;height:${fh}px;}
#s5-fam img{display:block;width:100%;height:100%;}
#s5-leads{position:absolute;left:0;top:0;}
.s5-chip{position:absolute;width:230px;padding:${pick(12, 10)}px 0;border-radius:18px;background:#fff;box-shadow:0 14px 34px rgba(11,21,48,.16);text-align:center;}
.s5-chip b{display:block;font-weight:700;font-size:21px;letter-spacing:.14em;color:${INK};}
.s5-chip span{display:block;font-weight:500;font-size:19px;color:${MUTED};}
#s5-big{position:absolute;left:60px;top:200px;font-weight:700;font-size:120px;letter-spacing:-.05em;line-height:1;color:${INK};}
#s5-big .it{font-size:1.1em;color:${ROYAL};}
.s5-fchip{position:absolute;left:60px;height:38px;line-height:38px;padding:0 18px;border-radius:19px;background:#fff;color:${INK};font-weight:600;font-size:17px;box-shadow:0 8px 20px rgba(11,21,48,.1);white-space:nowrap;}
#s5-price{position:absolute;left:${g.price.x}px;top:${g.price.y}px;width:${g.price.w}px;height:${g.price.h}px;border-radius:${pick(40, 32)}px;background:${INK};color:#fff;overflow:hidden;box-shadow:0 30px 60px rgba(11,21,48,.25);}
#s5-p3{position:absolute;left:44px;top:34px;font-weight:700;font-size:54px;letter-spacing:-.04em;line-height:1;}
#s5-pf{position:absolute;left:${pick(46, 34)}px;top:${pick(108, 30)}px;font-weight:600;font-size:${pick(20, 16)}px;letter-spacing:.18em;color:#8FA3D1;}
#s5-pv{position:absolute;${ST ? "right:44px;top:30px;" : "left:34px;top:58px;"}display:flex;align-items:flex-end;white-space:nowrap;}
#s5-pz{position:relative;display:flex;align-items:flex-end;transform-origin:80% 80%;}
#s5-cur{font-weight:600;font-size:${pick(32, 26)}px;line-height:1;margin:0 12px ${pick(14, 10)}px 0;color:#BFD0F5;}
#s5-num{font-weight:700;font-size:${pick(112, 72)}px;line-height:1;font-variant-numeric:tabular-nums;letter-spacing:-.03em;}
#s5-ast{font-weight:700;font-size:${pick(60, 42)}px;line-height:1;align-self:flex-start;margin-left:4px;color:${ICE};}
#s5-flare{position:absolute;left:-80px;top:-60px;width:${pick(560, 420)}px;height:${pick(260, 200)}px;border-radius:50%;background:radial-gradient(closest-side,rgba(140,203,255,.55),rgba(140,203,255,0));opacity:0;}
#s5-foot{position:absolute;left:${g.foot.x}px;top:${g.foot.y}px;width:${g.foot.w}px;text-align:${g.foot.al};font-weight:400;font-size:${g.foot.fs}px;line-height:${g.foot.lh}px;color:#4A5266;}
`;
  let chipsHtml = "";
  let leads = "";
  if (ST) {
    chips.forEach((c, i) => {
      chipsHtml += `<div class="s5-chip" id="s5-c${i}" style="left:${c.cx - 115}px;top:${c.cy - 40}px"><b>${c.t}</b><span>${c.s}</span></div>`;
      const [hx, hy] = HEADS[i];
      const sx = i === 0 ? c.cx + 115 : i === 2 ? c.cx - 115 : c.cx;
      const sy = i === 1 ? c.cy + 40 : c.cy;
      const tx = hx + (i === 0 ? -30 : i === 2 ? 30 : 0);
      const ty = hy - (i === 1 ? 46 : 8);
      leads += `<path id="s5-ld${i}" d="M${sx} ${sy} L${tx} ${ty}" stroke="${ROYAL}" stroke-width="3" fill="none" stroke-dasharray="400 500" stroke-dashoffset="400"/><circle id="s5-dt${i}" cx="${tx}" cy="${ty}" r="9" fill="${ROYAL}" stroke="#fff" stroke-width="4" opacity="0"/>`;
    });
  } else {
    chipsHtml = `<div id="s5-big" class="${p}-h">3 <span class="it">vidas</span></div><div class="s5-fchip" id="s5-c0" style="top:${g.pill.top + 196}px">2 adultos até 38 anos</div><div class="s5-fchip" id="s5-c1" style="top:${g.pill.top + 244}px">1 jovem até 18 anos</div>`;
  }
  const FOOT_TEXT = "*2 adultos até 38 anos e 1 jovem até 18 anos | Os valores podem variar conforme o perfil do beneficiário.";
  const inner = `<div id="s5-sec">
      <img id="s5-logo" src="assets/img/porto-logo.svg" alt="Porto" />
      <div id="s5-pill"><span>PLANO DE SAÚDE PARA CNPJ</span></div>
      <div id="s5-stage"><div id="s5-three" class="it" aria-hidden="true" data-layout-allow-occlusion>3</div><div id="s5-fam"><img src="assets/img/ai-family-cutout.png" alt="" /></div></div>
      <svg id="s5-leads" viewBox="0 0 ${W} ${SEC.E.h}" width="${W}" height="${SEC.E.h}">${leads}</svg>
      ${chipsHtml}
      <div id="s5-price">${ST ? `<div id="s5-p3">3 vidas</div>` : ""}<div id="s5-pf">A PARTIR DE</div><div id="s5-pv"><div id="s5-pz"><div id="s5-flare"></div><span id="s5-cur">R$</span><span id="s5-num">0,00</span><span id="s5-ast">*</span></div></div></div>
      <div id="s5-foot">${FOOT_TEXT}</div>
    </div>`;
  pg.body = pg.body.replace(`<div id="${p}-pg" data-layout-allow-overflow></div>`, `<div id="${p}-pg" data-layout-allow-overflow>${inner}</div>`);
  add(`tl.fromTo("#s5-logo",{clipPath:"inset(0% 100% 0% 0%)"},{clipPath:"inset(0% 0% 0% 0%)",duration:0.6,ease:"power3.out"},${r3(L(at("porto")) - 0.05)});`);
  add(`tl.fromTo("#s5-pill",{opacity:0,y:16,scale:0.9},{opacity:1,y:0,scale:1,duration:0.42,ease:"back.out(1.6)"},${r3(L(at("plano", 1)) - 0.1)});`);
  add(`tl.fromTo("#s5-three",{opacity:0,scale:0.85},{opacity:1,scale:1,duration:0.8,ease:"power3.out"},${r3(L(at("comeca")) - 0.1)});`);
  add(`tl.fromTo("#s5-fam img",{scale:1},{scale:1.035,duration:${r3(sd - L(at("porto")))},ease:"sine.inOut",transformOrigin:"50% 100%"},${L(at("porto"))});`);
  const t3 = L(at("tres"));
  if (ST) {
    [0, 1, 2].forEach((i) => {
      const t = r3(t3 - 0.05 + i * 0.16);
      add(`tl.fromTo("#s5-c${i}",{opacity:0,scale:0.8,y:10},{opacity:1,scale:1,y:0,duration:0.36,ease:"back.out(1.8)"},${t});`);
      add(`tl.fromTo("#s5-ld${i}",{attr:{"stroke-dashoffset":400}},{attr:{"stroke-dashoffset":0},duration:0.35,ease:"power2.out"},${r3(t + 0.1)});`);
      add(`tl.fromTo("#s5-dt${i}",{opacity:0,scale:0},{opacity:1,scale:1,duration:0.25,ease:"back.out(2)",transformOrigin:"50% 50%"},${r3(t + 0.4)});`);
    });
  } else {
    add(`tl.fromTo("#s5-big",{opacity:0,y:30},{opacity:1,y:0,duration:0.45,ease:"power3.out"},${r3(t3 - 0.1)});`);
    [0, 1].forEach((i) => add(`tl.fromTo("#s5-c${i}",{opacity:0,x:-20},{opacity:1,x:0,duration:0.35,ease:"power3.out"},${r3(t3 + 0.2 + i * 0.15)});`));
  }
  add(`tl.fromTo("#s5-foot",{opacity:0},{opacity:1,duration:0.4,ease:"power1.out"},${r3(L(at("a", 2)))});`);
  {
    const t0 = L(at("novecentos"));
    const t1 = L(LOCK);
    const steps = Math.round((t1 - t0) * FPS);
    for (let s = 0; s <= steps; s++) {
      const q = s / steps;
      add(`tl.set("#s5-num",{textContent:"${s === steps ? "942,80" : brl(942.8 * (1 - Math.pow(1 - q, 3)))}"},${r3(t0 + q * (t1 - t0))});`);
    }
    add(`tl.fromTo("#s5-pz",{scale:1},{scale:1.08,duration:0.12,ease:"power2.out"},${r3(t1)});`);
    add(`tl.to("#s5-pz",{scale:1,duration:0.4,ease:"power2.out"},${r3(t1 + 0.12)});`);
    add(`tl.fromTo("#s5-flare",{opacity:0,scale:0.7},{opacity:1,scale:1,duration:0.14,ease:"power2.out"},${r3(t1)});`);
    add(`tl.to("#s5-flare",{opacity:0,scale:1.25,duration:0.5,ease:"power2.out"},${r3(t1 + 0.14)});`);
  }
  scenes.push({ st, track: 4, ...scene(p, sd, pg.css, pg.body, a) });
}

// ═════════════ 6 · BENEFÍCIOS: carrossel com snap ═════════════
const CAR = pick({ x0: 140, w: 800, h: 920, y: 492, gap: 36, k: 1 }, { x0: 60, w: 520, h: 740, y: 232, gap: 28, k: 0.7 });
CAR.stride = CAR.w + CAR.gap;
const SWIPES = [at("seguro") - 0.26, at("servicos") - 0.26, at("protecao") - 0.26].map((t, i) => {
  const from = i * CAR.stride;
  const to = (i + 1) * CAR.stride;
  const d1 = pick(150, 110);
  return {
    t,
    d1,
    td: 0.12,
    segs: [
      { t, dur: 0.12, from, to: from + d1, ease: "power1.in" },
      { t: t + 0.12, dur: 0.55, from: from + d1, to, ease: "power3.out" },
    ],
  };
});
{
  const p = "s6";
  const st = visStart("F");
  const sd = visEnd("F") - st;
  const pg = pageScene(p, "F", st, sd, "", "");
  const { a, L, add } = pg;
  const k = CAR.k;
  const NAMES = [
    ["Plano<br>odontológico", "tooth", "b-odonto.jpg", "50% 40%"],
    ["Seguro<br>de vida", "heart", "b-vida.jpg", "50% 35%"],
    ["Serviços<br>ocupacionais", "case", "b-ocup.jpg", "45% 50%"],
    ["Proteção<br>antiácaro", "shield", "b-acaro.jpg", "60% 50%"],
  ];
  pg.css += `
#s6-sec{position:absolute;left:0;top:0;width:${W}px;height:${SEC.F.h}px;background:radial-gradient(80% 45% at 90% 20%,#1A3172 0%,rgba(26,49,114,0) 60%),${INK};}
#s6-lbl{left:${pick(72, 60)}px;top:${pick(262, 60)}px;font-size:${pick(22, 18)}px;color:#7F93C9;}
#s6-tt{position:absolute;left:${pick(72, 60)}px;top:${pick(300, 90)}px;font-weight:700;font-size:${pick(86, 62)}px;letter-spacing:-.04em;line-height:1;color:#fff;white-space:nowrap;}
#s6-tt .it{font-size:1.24em;color:${ICE};}
#s6-trk{position:absolute;left:0;top:${CAR.y}px;height:${CAR.h}px;}
.s6-cd{position:absolute;top:0;width:${CAR.w}px;height:${CAR.h}px;border-radius:${Math.round(44 * k)}px;overflow:hidden;background:#13244F;box-shadow:0 40px 80px rgba(0,0,0,.4);}
.s6-ph{position:absolute;inset:0;background-size:cover;background-repeat:no-repeat;}
.s6-sh{position:absolute;inset:0;background:linear-gradient(180deg,rgba(11,21,48,0) 38%,rgba(11,21,48,.55) 62%,rgba(11,21,48,.94) 100%);}
.s6-ix{position:absolute;left:${Math.round(36 * k)}px;top:${Math.round(34 * k)}px;padding:${Math.round(10 * k)}px ${Math.round(18 * k)}px;border-radius:99px;background:rgba(11,21,48,.45);border:1.5px solid rgba(255,255,255,.35);font-weight:600;font-size:${Math.round(22 * k)}px;letter-spacing:.14em;color:#fff;}
.s6-ic{position:absolute;left:${Math.round(44 * k)}px;bottom:${Math.round(232 * k)}px;width:${Math.round(96 * k)}px;height:${Math.round(96 * k)}px;border-radius:50%;background:${SKY};display:flex;align-items:center;justify-content:center;box-shadow:0 12px 30px rgba(58,144,238,.45);}
.s6-nm{position:absolute;left:${Math.round(44 * k)}px;bottom:${Math.round(52 * k)}px;font-weight:700;font-size:${Math.round(66 * k)}px;line-height:1.02;letter-spacing:-.035em;color:#fff;}
#s6-dots{position:absolute;left:0;width:${W}px;top:${CAR.y + CAR.h + pick(44, 22)}px;display:flex;justify-content:center;gap:12px;}
.s6-d{width:12px;height:12px;border-radius:6px;background:rgba(255,255,255,.28);}
#s6-dact{position:absolute;left:0;top:0;width:12px;height:12px;border-radius:6px;background:#fff;box-shadow:0 0 0 4px rgba(255,255,255,.18);}
#s6-dw{position:relative;display:flex;gap:12px;}
`;
  const cards = NAMES.map(
    ([nm, ic, img, pos], i) =>
      `<div class="s6-cd" style="left:${i * CAR.stride}px"><div class="s6-ph" id="s6-ph${i}" style="background-image:url('assets/img/${img}');background-position:${pos}"></div><div class="s6-sh"></div><div class="s6-ix">0${i + 1} / 04</div><div class="s6-ic">${icon(ic, Math.round(56 * k), { sw: 3.4 })}</div><div class="s6-nm">${nm}</div></div>`,
  ).join("");
  const inner = `<div id="s6-sec">
      <div id="s6-lbl" class="${p}-lbl">Benefícios</div>
      <div id="s6-tt">E ainda <span class="it">vem com:</span></div>
      <div id="s6-trk">${cards}</div>
      <div id="s6-dots"><div id="s6-dw"><div class="s6-d"></div><div class="s6-d"></div><div class="s6-d"></div><div class="s6-d"></div><div id="s6-dact"></div></div></div>
    </div>`;
  pg.body = pg.body.replace(`<div id="${p}-pg" data-layout-allow-overflow></div>`, `<div id="${p}-pg" data-layout-allow-overflow>${inner}</div>`);
  add(`tl.fromTo("#s6-tt",{opacity:0,y:30},{opacity:1,y:0,duration:0.5,ease:"power3.out"},${r3(L(at("com", 1)) - 0.1)});`);
  add(`tl.fromTo("#s6-lbl",{opacity:0},{opacity:1,duration:0.4},${r3(L(at("com", 1)) - 0.2)});`);
  // carrossel: arrasto + snap; o ponto ativo acompanha
  for (const sw of SWIPES) {
    for (const s of sw.segs)
      add(`tl.fromTo("#s6-trk",{x:${r3(CAR.x0 - s.from)}},{x:${r3(CAR.x0 - s.to)},duration:${r3(s.dur)},ease:"${s.ease}",immediateRender:false},${L(s.t)});`);
  }
  add(`tl.set("#s6-trk",{x:${CAR.x0}},0);`);
  SWIPES.forEach((sw, i) => {
    add(`tl.fromTo("#s6-dact",{x:${i * 24}},{x:${(i + 1) * 24},duration:0.5,ease:"power3.out",immediateRender:false},${L(sw.t + 0.12)});`);
  });
  // a foto do cartão anda um pouco a menos que o cartão (paralaxe horizontal)
  NAMES.forEach((_, i) => {
    add(`tl.set("#s6-ph${i}",{x:${r3(i * CAR.stride * 0.12)}},0);`);
    SWIPES.forEach((sw) => {
      for (const s of sw.segs)
        add(`tl.fromTo("#s6-ph${i}",{x:${r3((i * CAR.stride - s.from) * 0.12)}},{x:${r3((i * CAR.stride - s.to) * 0.12)},duration:${r3(s.dur)},ease:"${s.ease}",immediateRender:false},${L(s.t)});`);
    });
  });
  scenes.push({ st, track: 5, ...scene(p, sd, pg.css, pg.body, a) });
}

// ═════════════ 7 · COMPARATIVO ═════════════
{
  const p = "s7";
  const st = visStart("G");
  const sd = visEnd("G") - st;
  const pg = pageScene(p, "G", st, sd, "", "");
  const { a, L, add, words } = pg;
  const g = pick(
    {
      ph: { x: 72, y: 250, w: 936, h: 600 }, t1: [72, 900, 88], t2: [62, 990, 128], t3: [72, 1130, 88],
      card: { x: 72, y: 1262, w: 936, h: 540 }, pad: 44, rows: [104, 210], chip: { y: 382, h: 110 },
    },
    {
      ph: { x: 60, y: 80, w: 440, h: 930 }, t1: [540, 92, 60], t2: [532, 156, 92], t3: [540, 262, 60],
      card: { x: 540, y: 360, w: 480, h: 650 }, pad: 32, rows: [96, 196], chip: { y: 470, h: 140 },
    },
  );
  pg.css += `
#s7-sec{position:absolute;left:0;top:0;width:${W}px;height:${SEC.G.h}px;background:linear-gradient(180deg,#FFFFFF 0%,${PAPER} 100%);}
#s7-ph{position:absolute;left:${g.ph.x}px;top:${g.ph.y}px;width:${g.ph.w}px;height:${g.ph.h}px;border-radius:${pick(40, 34)}px;overflow:hidden;box-shadow:0 30px 70px rgba(11,21,48,.16);}
#s7-pi{position:absolute;left:0;top:-80px;width:100%;height:${g.ph.h + 160}px;background:url("assets/img/ai-consult.png") 50% 42%/cover no-repeat;}
#s7-t1{left:${g.t1[0]}px;top:${g.t1[1]}px;font-size:${g.t1[2]}px;color:${INK};}
#s7-t2{left:${g.t2[0]}px;top:${g.t2[1]}px;font-size:${g.t2[2]}px;color:${CORAL};line-height:.95;}
#s7-t3{left:${g.t3[0]}px;top:${g.t3[1]}px;font-size:${g.t3[2]}px;color:${INK};}
#s7-card{position:absolute;left:${g.card.x}px;top:${g.card.y}px;width:${g.card.w}px;height:${g.card.h}px;border-radius:${pick(40, 32)}px;background:#fff;border:1.5px solid #E3E8F2;box-shadow:0 30px 70px rgba(11,21,48,.12);}
#s7-hd{position:absolute;left:${g.pad}px;top:${pick(38, 30)}px;font-weight:700;font-size:${pick(21, 16)}px;letter-spacing:.16em;color:${PBLUE};}
#s7-live{position:absolute;right:${g.pad}px;top:${pick(40, 32)}px;display:flex;align-items:center;gap:10px;font-weight:600;font-size:${pick(17, 13)}px;letter-spacing:.16em;color:${MUTED};}
#s7-dot{width:12px;height:12px;border-radius:50%;background:${MINT};}
.s7-rw{position:absolute;left:${g.pad}px;width:${g.card.w - 2 * g.pad}px;}
.s7-lb{font-weight:600;font-size:${pick(27, 21)}px;color:${INK};}
.s7-vl{position:absolute;right:0;top:0;font-weight:700;font-size:${pick(28, 21)}px;color:${INK};font-variant-numeric:tabular-nums;}
.s7-tr{position:relative;margin-top:${pick(14, 10)}px;height:${pick(22, 18)}px;border-radius:11px;background:#EEF2F9;overflow:hidden;}
.s7-fl{position:absolute;left:0;top:0;height:100%;border-radius:11px;transform-origin:0 50%;}
#s7-eco{position:absolute;left:${g.pad}px;top:${g.chip.y}px;width:${g.card.w - 2 * g.pad}px;height:${g.chip.h}px;border-radius:${pick(55, 28)}px;background:${MINT};display:flex;${ST ? "align-items:center;justify-content:space-between;padding:0 36px;" : "flex-direction:column;justify-content:center;gap:8px;padding:0 26px;"}overflow:hidden;}
#s7-eco b{font-weight:700;font-size:${pick(20, 15)}px;letter-spacing:.16em;color:${INK};}
#s7-eco span{font-weight:800;font-size:${pick(30, 24)}px;color:${INK};white-space:nowrap;}
#s7-esh{position:absolute;left:-200px;top:0;width:140px;height:100%;background:linear-gradient(90deg,rgba(255,255,255,0),rgba(255,255,255,.75),rgba(255,255,255,0));}
`;
  const inner = `<div id="s7-sec">
      <div id="s7-ph"><div id="s7-pi"></div></div>
      <div id="s7-t1" class="${p}-h">${wspans("s7a", "A gente compara")}</div>
      <div id="s7-t2" class="${p}-h">${wsp("s7b", "*seu plano atual*")}</div>
      <div id="s7-t3" class="${p}-h">${wspans("s7c", "com o mercado.")}</div>
      <div id="s7-card">
        <div id="s7-hd">ANÁLISE COMPARATIVA</div>
        <div id="s7-live"><div id="s7-dot"></div>COM NÚMEROS</div>
        <div class="s7-rw" style="top:${g.rows[0]}px"><div class="s7-lb">Seu plano atual</div><div class="s7-vl" id="s7-v0">R$ ●●●,●●</div><div class="s7-tr"><div class="s7-fl" id="s7-f0" style="width:92%;background:linear-gradient(90deg,#FF8A65,${CORAL})"></div></div></div>
        <div class="s7-rw" style="top:${g.rows[1]}px"><div class="s7-lb">Plano para CNPJ</div><div class="s7-vl" id="s7-v1">R$ ●●●,●●</div><div class="s7-tr"><div class="s7-fl" id="s7-f1" style="width:58%;background:linear-gradient(90deg,${ICE},${PBLUE})"></div></div></div>
        <div id="s7-eco"><b>SUA ECONOMIA</b><span>Descubra na simulação →</span><div id="s7-esh"></div></div>
      </div>
    </div>`;
  pg.body = pg.body.replace(`<div id="${p}-pg" data-layout-allow-overflow></div>`, `<div id="${p}-pg" data-layout-allow-overflow>${inner}</div>`);
  // foto com paralaxe vertical ligada à rolagem
  scrollTweens(add, L, "#s7-pi", -0.2 * (SEC.G.top + dG), st, sd, { sign: 0.2 });
  words("s7a", 3, [at("a", 3), at("gente", 1), at("compara")], 0.42);
  words("s7b", 3, [at("seu"), at("plano", 3), at("atual")], 0.45);
  words("s7c", 3, [at("com", 2), at("o", 5), at("mercado")], 0.42);
  add(`tl.fromTo("#s7-f0",{scaleX:0},{scaleX:1,duration:0.8,ease:"power2.out"},${r3(L(at("atual")) - 0.05)});`);
  add(`tl.fromTo("#s7-f1",{scaleX:0},{scaleX:1,duration:0.8,ease:"power2.out"},${r3(L(at("mercado")) - 0.05)});`);
  add(`tl.fromTo("#s7-dot",{opacity:1},{opacity:0.25,duration:0.5,ease:"sine.inOut",repeat:${Math.floor((sd - 1) / 0.5) - 1},yoyo:true},0.6);`);
  {
    const R = rng(7272);
    const s0 = L(at("numeros")) - 0.1;
    for (let t = s0; t < s0 + 0.85; t += 1 / 15) {
      add(`tl.set("#s7-v0",{textContent:"R$ ${brl(800 + R() * 2200)}"},${r3(t)});`);
      add(`tl.set("#s7-v1",{textContent:"R$ ${brl(500 + R() * 1400)}"},${r3(t)});`);
    }
    add(`tl.set("#s7-v0",{textContent:"R$ ?"},${r3(s0 + 0.9)});`);
    add(`tl.set("#s7-v1",{textContent:"R$ ?"},${r3(s0 + 0.9)});`);
  }
  const e0 = L(at("economizar")) - 0.2;
  add(`tl.fromTo("#s7-eco",{opacity:0,scale:0.85},{opacity:1,scale:1,duration:0.45,ease:"back.out(1.6)"},${r3(e0)});`);
  add(`tl.fromTo("#s7-esh",{x:0},{x:${g.card.w + 200},duration:0.8,ease:"power2.inOut"},${r3(e0 + 0.35)});`);
  scenes.push({ st, track: 6, ...scene(p, sd, pg.css, pg.body, a) });
}

// ═════════════ 8 · SIMULAÇÃO + a peça da Porto no fim da página ═════════════
const AD = pick(
  {
    plate: "assets/img/plate.png",
    block: { top: 715, h: 470, w: 755, r: 60 },
    title: { left: 76, top: 12, size: 52, lh: 64 },
    lives: { top: 178, size: 40 },
    price: { left: 74, top: 236, num: 72 },
    card: { top: 1058, h: 316, w: 691, r: 48 },
    items: { y: [55, 123, 191, 259], left: 84, size: 33, ic: 50 },
    logo: { left: 727, top: 1214, w: 294 },
    foot: { left: 723, top: 1290, w: 330, size: 20, lh: 26 },
    cta: { top: 1402, h: 134, row: false, text: 42 },
    btn: { x: 540, y: 1497 },
  },
  {
    plate: "assets/img/plate-feed.png",
    block: { top: 315, h: 478, w: 668, r: 40 },
    title: { left: 90, top: 11, size: 49, lh: 60 },
    lives: { top: 162, size: 40 },
    price: { left: 88, top: 221, num: 72 },
    card: { top: 648, h: 272, w: 593, r: 40 },
    items: { y: [41, 106, 171, 234], left: 66, size: 27, ic: 42 },
    logo: { left: 662, top: 812, w: 227 },
    foot: { left: 659, top: 873, w: 400, size: 18, lh: 23 },
    cta: { top: 976, h: 104, row: true, text: 38 },
    btn: { x: 838, y: 1028 },
  },
);
SEC.HI = { top: SEC.H.top, h: SEC.H.h + SEC.I.h + 400 };
const TAP = at("botao") - 0.02;
{
  const p = "s8";
  const st = visStart("H");
  const sd = D - st;
  const pg = pageScene(p, "HI", st, sd, "", "");
  const { a, L, add, words } = pg;
  const g = pick(
    { lbl: [72, 110], h1: [72, 150, 124], h2: [60, 262, 196], pill: { x: 72, y: 500, h: 96, fs: 42 } },
    { lbl: [60, 76], h1: [60, 110, 98], h2: [50, 200, 152], pill: { x: 60, y: 392, h: 76, fs: 34 } },
  );
  const IT = SEC.H.h; // topo da peça dentro desta cena
  const ITEMS = [
    ["PLANO ODONTOLÓGICO", "tooth"],
    ["SEGURO DE VIDA", "heart"],
    ["SERVIÇOS OCUPACIONAIS", "case"],
    ["PROTEÇÃO ANTIÁCARO", "shield"],
  ];
  const LOGO_H = r3((AD.logo.w * 32) / 140);
  const y0 = (v) => IT + v;
  pg.css += `
#s8-hsec{position:absolute;left:0;top:0;width:${W}px;height:${SEC.H.h}px;background:linear-gradient(180deg,${PAPER} 0%,${LAV} 100%);}
#s8-lbl{left:${g.lbl[0]}px;top:${g.lbl[1]}px;font-size:${pick(22, 18)}px;color:${MUTED};}
#s8-h1{left:${g.h1[0]}px;top:${g.h1[1]}px;font-size:${g.h1[2]}px;color:${INK};}
#s8-h2{left:${g.h2[0]}px;top:${g.h2[1]}px;font-size:${g.h2[2]}px;color:${PBLUE};line-height:.95;}
#s8-pill{position:absolute;left:${g.pill.x}px;top:${g.pill.y}px;height:${g.pill.h}px;padding:0 ${Math.round(g.pill.h * 0.42)}px 0 ${Math.round(g.pill.h * 0.3)}px;border-radius:${g.pill.h / 2}px;background:${ROYAL};display:flex;align-items:center;gap:${Math.round(g.pill.h * 0.18)}px;color:#fff;font-weight:700;font-size:${g.pill.fs}px;letter-spacing:-.02em;white-space:nowrap;box-shadow:0 20px 40px rgba(33,70,195,.3);}
#s8-isec{position:absolute;left:0;top:${IT}px;width:${W}px;height:${SEC.I.h + 400}px;background:linear-gradient(180deg,${LAV} 0%,${LAV} ${SEC.I.h}px,#DCE2EE ${SEC.I.h}px,#DCE2EE 100%);}
#s8-photo{position:absolute;left:0;top:${IT}px;width:${W}px;height:${H}px;}
#s8-block{position:absolute;left:0;top:${y0(AD.block.top)}px;width:${AD.block.w}px;height:${AD.block.h}px;background:${SKY};border-radius:0 ${AD.block.r}px ${AD.block.r}px 0;color:#fff;}
#s8-title{position:absolute;left:${AD.title.left}px;top:${AD.title.top}px;font-weight:600;font-size:${AD.title.size}px;line-height:${AD.title.lh}px;white-space:nowrap;}
#s8-lives{position:absolute;left:${AD.title.left}px;top:${AD.lives.top}px;font-weight:600;font-size:${AD.lives.size}px;line-height:50px;white-space:nowrap;}
#s8-price{position:absolute;left:${AD.price.left}px;top:${AD.price.top}px;height:86px;display:flex;align-items:flex-end;white-space:nowrap;}
#s8-cur{font-weight:600;font-size:26px;line-height:1;margin:0 10px 10px 2px;}
#s8-num{font-weight:600;font-size:${AD.price.num}px;line-height:1;letter-spacing:-.005em;}
#s8-ast{font-weight:600;font-size:60px;line-height:1;margin-left:4px;align-self:flex-start;}
#s8-card{position:absolute;left:0;top:${y0(AD.card.top)}px;width:${AD.card.w}px;height:${AD.card.h}px;background:${ROYAL};border-radius:0 ${AD.card.r}px ${AD.card.r}px 0;}
.s8-item{position:absolute;left:${AD.items.left}px;height:0;display:flex;align-items:center;}
.s8-ic{width:${AD.items.ic}px;height:${AD.items.ic}px;flex:none;border-radius:50%;background:${SKY};display:flex;align-items:center;justify-content:center;}
.s8-it{margin-left:${Math.round(AD.items.size * 0.66)}px;font-weight:500;font-size:${AD.items.size}px;line-height:44px;color:#fff;white-space:nowrap;letter-spacing:.01em;}
#s8-logo{position:absolute;left:${AD.logo.left}px;top:${y0(AD.logo.top)}px;width:${AD.logo.w}px;height:${LOGO_H}px;}
#s8-foot{position:absolute;left:${AD.foot.left}px;top:${y0(AD.foot.top)}px;width:${AD.foot.w}px;font-weight:400;font-size:${AD.foot.size}px;line-height:${AD.foot.lh}px;color:#2B3140;}
#s8-cta{position:absolute;left:0;top:${y0(AD.cta.top)}px;width:${W}px;height:${AD.cta.h}px;background:${SKY};}
#s8-cta-in{position:absolute;inset:0;display:flex;flex-direction:${AD.cta.row ? "row" : "column"};align-items:center;justify-content:center;gap:${AD.cta.row ? 30 : 8}px;}
#s8-cta-text{font-weight:700;font-size:${AD.cta.text}px;line-height:${AD.cta.text + 6}px;letter-spacing:-.02em;color:#fff;white-space:nowrap;}
#s8-btn-pop{position:relative;}
#s8-ring{position:absolute;inset:0;border-radius:999px;border:3px solid rgba(255,255,255,.95);opacity:0;}
#s8-btn{position:relative;height:56px;padding:0 10px 0 30px;display:flex;align-items:center;gap:14px;border-radius:999px;background:#fff;box-shadow:0 8px 22px rgba(20,40,110,.25);}
#s8-btn-t{font-weight:700;font-size:${pick(25, 22)}px;line-height:1;color:${ROYAL};white-space:nowrap;}
#s8-btn-a{width:40px;height:40px;border-radius:50%;background:${ROYAL};display:flex;align-items:center;justify-content:center;}
`;
  const itemsHtml = ITEMS.map(
    ([t, ic], i) =>
      `<div class="s8-item" style="top:${AD.items.y[i]}px"><div class="s8-ic">${icon(ic, Math.round(AD.items.ic * 0.6))}</div><div class="s8-it">${t}</div></div>`,
  ).join("");
  const FOOT_TEXT = "*2 adultos até 38 anos e 1 jovem até 18 anos | Os valores podem variar conforme o perfil do beneficiário.";
  const inner = `<div id="s8-hsec">
      <div id="s8-lbl" class="${p}-lbl">Próximo passo</div>
      <div id="s8-h1" class="${p}-h">${wspans("s8a", "Simulação")}</div>
      <div id="s8-h2" class="${p}-h">${wsp("s8b", "*gratuita,*")}</div>
      <div id="s8-pill">${icon("laptop", Math.round(g.pill.h * 0.5), { sw: 3.2 })}${icon("phone", Math.round(g.pill.h * 0.42), { sw: 3.2 })}<span>100% online</span></div>
    </div>
    <div id="s8-isec"></div>
    <img id="s8-photo" src="${AD.plate}" alt="Hospital Dr. Beda" />
    <div id="s8-block" data-layout-allow-overflow>
      <div id="s8-title"><div>Plano de Saúde</div><div>para CNPJ</div></div>
      <div id="s8-lives">3 vidas a partir de</div>
      <div id="s8-price"><span id="s8-cur">R$</span><span id="s8-num">942,80</span><span id="s8-ast">*</span></div>
    </div>
    <div id="s8-card">${itemsHtml}</div>
    <img id="s8-logo" src="assets/img/porto-logo.svg" alt="Porto" />
    <div id="s8-foot">${FOOT_TEXT}</div>
    <div id="s8-cta" data-layout-allow-overflow><div id="s8-cta-in"><div id="s8-cta-text">Simulação Gratuita 100% Online</div><div id="s8-btn-pop"><div id="s8-ring"></div><div id="s8-btn"><span id="s8-btn-t">Falar com especialista</span><span id="s8-btn-a"><svg id="s8-arrow" viewBox="0 0 24 24" width="22" height="22"><path d="M5 12h12M12 6l6 6-6 6" fill="none" stroke="#fff" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/></svg></span></div></div></div></div>`;
  pg.body = pg.body.replace(`<div id="${p}-pg" data-layout-allow-overflow></div>`, `<div id="${p}-pg" data-layout-allow-overflow>${inner}</div>`);
  words("s8a", 1, [at("simulacao")], 0.5);
  add(`tl.fromTo("#s8b0",{yPercent:100,opacity:0},{yPercent:0,opacity:1,duration:0.55,ease:"power3.out"},${r3(L(at("gratuita")) - 0.1)});`);
  add(`tl.fromTo("#s8-lbl",{opacity:0},{opacity:1,duration:0.4},${r3(L(at("simulacao")) - 0.3)});`);
  add(`tl.fromTo("#s8-pill",{opacity:0,scale:0.7,x:-20},{opacity:1,scale:1,x:0,duration:0.5,ease:"back.out(1.7)"},${r3(L(at("cem")) - 0.1)});`);
  // toque no botão
  add(`tl.fromTo("#s8-btn",{scale:1},{scale:0.94,duration:0.1,ease:"power2.in"},${L(TAP)});`);
  add(`tl.to("#s8-btn",{scale:1,duration:0.3,ease:"back.out(2)"},${r3(L(TAP) + 0.1)});`);
  add(`tl.fromTo("#s8-ring",{opacity:0.95,scale:1},{opacity:0,scale:1.35,duration:0.7,ease:"power2.out"},${r3(L(TAP) + 0.05)});`);
  add(`tl.fromTo("#s8-ring",{opacity:0.9,scale:1},{opacity:0,scale:1.35,duration:0.7,ease:"power2.out",immediateRender:false},${r3(L(at("especialista")) + 0.05)});`);
  for (let t = L(at("especialista")) + 0.9, i = 0; t + 1.0 <= sd - 1.4; t += 1.0, i++) {
    add(`tl.fromTo("#s8-btn",{scale:1},{scale:1.05,duration:0.5,ease:"sine.inOut",immediateRender:false},${r3(t)});`);
    add(`tl.to("#s8-btn",{scale:1,duration:0.5,ease:"sine.inOut"},${r3(t + 0.5)});`);
    add(`tl.fromTo("#s8-arrow",{x:0},{x:5,duration:0.5,ease:"sine.inOut"${i ? ",immediateRender:false" : ""}},${r3(t)});`);
    add(`tl.to("#s8-arrow",{x:0,duration:0.5,ease:"sine.inOut"},${r3(t + 0.5)});`);
  }
  scenes.push({ st, track: 7, ...scene(p, sd, pg.css, pg.body, a) });
}

// ═════════════ dedo, barra de rolagem e grão (por cima de tudo) ═════════════
const GESTURES = [];
{
  // toque que para o feed
  GESTURES.push({ kind: "hold", t: STOP - 0.07, x: pick(560, 600), y: pick(1180, 760), until: STOP + 0.42 });
  // lista do extrato
  const s2 = scenes.find((s) => s.id === "s2");
  const lf = s2.LIST[0];
  GESTURES.push({ kind: "v", t: lf.t, x: lf.finger.x, y: lf.finger.y, d: lf.d1, td: lf.td });
  for (const m of PAGE) if (m.finger) GESTURES.push({ kind: m.type === "drag" ? "vdrag" : "v", t: m.t, x: m.finger.x, y: m.finger.y, d: m.d1, td: m.td, ease: m.segs[0].ease });
  for (const sw of SWIPES) GESTURES.push({ kind: "h", t: sw.t, x: pick(800, 820), y: CAR.y + CAR.h * 0.6 - SEC.F.h + SEC.F.h, d: sw.d1, td: sw.td });
  GESTURES.push({ kind: "tap", t: TAP, x: AD.btn.x, y: AD.btn.y });
}
{
  const p = "ui";
  const st = 0;
  const { a, add } = TL(st);
  const FS = pick(96, 80);
  const NOISE =
    "data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E";
  const thumbH = Math.round((H * H) / SEC.pageH);
  const track = H - 24 - thumbH;
  const css = `#ui-root{position:absolute;inset:0;width:${W}px;height:${H}px;overflow:hidden;pointer-events:none;}
.ui-f{position:absolute;width:${FS}px;height:${FS}px;border-radius:50%;background:radial-gradient(circle,rgba(255,255,255,.7) 0 34%,rgba(255,255,255,.32) 36% 100%);border:2px solid rgba(255,255,255,.9);box-shadow:0 0 0 1.5px rgba(11,21,48,.18),0 10px 26px rgba(11,21,48,.32);opacity:0;}
#ui-sb{position:absolute;right:8px;top:12px;width:7px;height:${thumbH}px;border-radius:4px;background:rgba(110,120,140,.62);box-shadow:0 0 0 1px rgba(255,255,255,.35);opacity:0;}
#ui-tex{position:absolute;left:-128px;top:-128px;width:${W + 256}px;height:${H + 256}px;background:url("${NOISE}") 0 0/256px 256px repeat;opacity:.035;mix-blend-mode:overlay;}`;
  let body = `<div id="ui-tex" data-layout-allow-overflow></div><div id="ui-sb"></div>`;
  GESTURES.forEach((gs, i) => {
    const id = `ui-f${i}`;
    body += `<div class="ui-f" id="${id}" style="left:${gs.x - FS / 2}px;top:${gs.y - FS / 2}px"></div>`;
    const t0 = r3(gs.t - 0.06);
    if (gs.kind === "hold") {
      add(`tl.fromTo("#${id}",{opacity:0,scale:1.3},{opacity:1,scale:1,duration:0.08,ease:"power2.out"},${t0});`);
      add(`tl.to("#${id}",{scale:0.88,duration:0.12,ease:"power2.out"},${r3(gs.t + 0.04)});`);
      add(`tl.to("#${id}",{opacity:0,scale:1.15,duration:0.2,ease:"power2.in"},${r3(gs.until)});`);
    } else if (gs.kind === "tap") {
      add(`tl.fromTo("#${id}",{opacity:0,x:${pick(160, 120)},y:${pick(220, 160)},scale:1.15},{opacity:1,x:0,y:0,scale:1,duration:0.5,ease:"power3.out"},${r3(gs.t - 0.55)});`);
      add(`tl.to("#${id}",{scale:0.82,duration:0.1,ease:"power2.in"},${r3(gs.t)});`);
      add(`tl.to("#${id}",{scale:1,duration:0.18,ease:"power2.out"},${r3(gs.t + 0.12)});`);
      add(`tl.to("#${id}",{opacity:0,x:${pick(90, 70)},y:${pick(120, 90)},duration:0.4,ease:"power2.in"},${r3(gs.t + 0.45)});`);
    } else {
      const prop = gs.kind === "h" ? "x" : "y";
      const ez = gs.kind === "vdrag" ? gs.ease : "power1.in";
      add(`tl.fromTo("#${id}",{opacity:0,scale:1.25},{opacity:1,scale:1,duration:0.08,ease:"power2.out"},${t0});`);
      add(`tl.fromTo("#${id}",{${prop}:0},{${prop}:${r3(-gs.d)},duration:${r3(gs.td)},ease:"${ez}"},${r3(gs.t)});`);
      add(`tl.to("#${id}",{${prop}:${r3(-gs.d - (gs.kind === "vdrag" ? 20 : Math.min(140, gs.d * 0.5)))},opacity:0,scale:0.85,duration:0.16,ease:"power1.out"},${r3(gs.t + gs.td)});`);
    }
  });
  // barra de rolagem da página: aparece com o gesto e some depois
  {
    const yb = (v) => r3((Math.max(0, Math.min(SEC.maxY, v)) / SEC.maxY) * track);
    add(`tl.set("#ui-sb",{y:0},0);`);
    for (const m of PAGE) {
      add(`tl.to("#ui-sb",{opacity:1,duration:0.12,ease:"power1.out"},${r3(m.t)});`);
      for (const s of m.segs) add(`tl.fromTo("#ui-sb",{y:${yb(s.from)}},{y:${yb(s.to)},duration:${r3(s.dur)},ease:"${s.ease}",immediateRender:false},${r3(s.t)});`);
      const next = PAGE.find((n) => n.t > m.t);
      if (!next || next.t - m.end > 0.9) add(`tl.to("#ui-sb",{opacity:0,duration:0.4,ease:"power1.in"},${r3(m.end + 0.45)});`);
    }
  }
  const R = rng(99);
  const pos = [];
  for (let t = 0; t < D; t += 2 / FPS) pos.push(Math.round((R() - 0.5) * 200), Math.round((R() - 0.5) * 200));
  add(`const P = [${pos.join(",")}];`);
  add(`for (let i = 0; i < P.length / 2; i++) tl.set("#ui-tex", { x: P[2 * i], y: P[2 * i + 1] }, Math.round((i * 2 / ${FPS}) * 1000) / 1000);`);
  scenes.push({ st, track: 9, ...scene(p, D, css, body, a) });
}

// ═════════════ áudio ═════════════
const SFX_LEN = {
  whoosh: 1.0, tick: 0.14, counter: 2.23, impact: 3.0, shimmer: 3.0, pop: 0.5, chime: 2.2, stamp: 0.5,
  scramble_short: 1.1, riser: 1.6, drop: 0.9, notify: 1.2, swipe: 0.5, rubber: 0.5, tap: 0.3, sheet: 0.8,
  feedfly: 0.9, listfly: 2.0,
};
const SFX = [
  ["feedfly", 0.0, 0.5],
  ["impact", r3(STOP - 0.01), 0.5],
  ["rubber", r3(STOP + 0.02), 0.45],
  ["swipe", r3(STOP + 0.12), 0.18],
  ["pop", r3(at("cnpj") - 0.1), 0.4],
  ["shimmer", r3(at("cnpj") + 0.25), 0.2],
  ["whoosh", 3.1, 0.35],
  ["notify", r3(at("boleto") - 0.05), 0.4],
  ["tick", r3(at("chega")), 0.25],
  ["stamp", r3(at("paga") + 0.08), 0.45],
  ["listfly", r3(at("e", 1) - 0.02), 0.42],
  ["rubber", r3(at("e", 1) + 1.62), 0.3],
  ["sheet", r3(at("quando") - 0.3), 0.4],
  ["tick", r3(at("comparou")), 0.3],
  ...PAGE.filter((m) => m.type === "flick").map((m) => ["swipe", r3(m.t - 0.02), 0.32]),
  ["pop", r3(at("caro") + 0.05), 0.4],
  ["impact", r3(at("caro")), 0.3],
  ["whoosh", r3(at("usar") - 0.15), 0.25],
  ["shimmer", r3(at("cnpj", 1) + 0.05), 0.22],
  ["drop", r3(at("bastante")), 0.38],
  ["pop", r3(at("mesma") - 0.15), 0.35],
  ["shimmer", r3(at("qualidade")), 0.2],
  ["chime", r3(at("porto")), 0.34],
  ["pop", r3(at("plano", 1)), 0.25],
  ["tick", r3(at("tres") - 0.05), 0.2],
  ["tick", r3(at("tres") + 0.11), 0.17],
  ["tick", r3(at("tres") + 0.27), 0.15],
  ["counter", r3(at("novecentos")), 0.35],
  ["impact", r3(LOCK), 0.4],
  ["shimmer", r3(LOCK), 0.2],
  ...SWIPES.flatMap((sw) => [
    ["swipe", r3(sw.t), 0.3],
    ["tick", r3(sw.t + 0.6), 0.16],
  ]),
  ["tick", r3(at("atual")), 0.18],
  ["tick", r3(at("mercado")), 0.18],
  ["scramble_short", r3(at("numeros") - 0.1), 0.22],
  ["pop", r3(at("economizar") - 0.2), 0.35],
  ["chime", r3(at("economizar")), 0.22],
  ["pop", r3(at("cem") - 0.1), 0.35],
  ["rubber", r3(PAGE[PAGE.length - 1].segs[1].t + PAGE[PAGE.length - 1].segs[1].dur - 0.05), 0.35],
  ["tap", r3(TAP), 0.5],
  ["pop", r3(TAP + 0.05), 0.3],
  ["tick", r3(at("especialista")), 0.15],
];
function allocTracks(items, first) {
  const ends = [];
  return items.map((it) => {
    let k = ends.findIndex((e) => e <= it.at + 1e-6);
    if (k < 0) k = ends.push(0) - 1;
    ends[k] = it.at + it.dur;
    return first + k;
  });
}
const sfxItems = SFX.map(([name, t, vol]) => ({ name, at: Math.max(0, t), vol, dur: SFX_LEN[name] })).sort((x, y) => x.at - y.at);
const sfxTracks = allocTracks(sfxItems, 30);
const voDur = r3(Number(readFileSync(join(ROOT, "assets/voice/vo.dur"), "utf8")));

// ═════════════ saída ═════════════
const OUT = ST ? ROOT : join(ROOT, "feed");
mkdirSync(join(OUT, "compositions"), { recursive: true });
for (const s of scenes) writeFileSync(join(OUT, `compositions/${s.id}.html`), s.html);
const mounts = scenes
  .map(
    (s) =>
      `<div id="el-${s.id}" class="scene" data-composition-id="${s.id}" data-composition-src="compositions/${s.id}.html" data-start="${r3(s.st)}" data-duration="${s.dur}" data-track-index="${s.track}"></div>`,
  )
  .join("\n      ");
const audio = [
  `<audio id="el-bgm" src="assets/audio/bgm.wav" data-start="0" data-duration="${D}" data-track-index="20" data-volume="0.5"></audio>`,
  `<audio id="el-vo-voice" data-audio-group="voiceover" src="assets/voice/vo.wav" data-start="0" data-duration="${Math.min(voDur, D)}" data-track-index="21" data-volume="1"></audio>`,
  ...sfxItems.map(
    (x, i) =>
      `<audio id="el-sfx-${i}" src="assets/audio/sfx_${x.name}.wav" data-start="${x.at}" data-duration="${x.dur}" data-track-index="${sfxTracks[i]}" data-volume="${x.vol}"></audio>`,
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
      html, body { width: ${W}px; height: ${H}px; overflow: hidden; background: ${INK}; }
      #root { position: relative; width: ${W}px; height: ${H}px; overflow: hidden; background: ${INK}; }
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
writeFileSync(join(OUT, "index.html"), html);
// resumo dos gestos (para a trilha e conferência)
writeFileSync(
  join(ROOT, "tools", `gestures-${FMT}.json`),
  JSON.stringify({ STOP, LOCK, T, page: PAGE.map((m) => ({ type: m.type, t: r3(m.t), end: r3(m.end) })), swipes: SWIPES.map((s) => r3(s.t)), tap: r3(TAP) }, null, 1),
);
console.log(`${FMT} ${W}x${H}: ${D}s, ${scenes.length} composições, ${SFX.length} SFX, página ${SEC.pageH}px`);
