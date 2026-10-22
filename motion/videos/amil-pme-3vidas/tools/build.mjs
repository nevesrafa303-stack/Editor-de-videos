#!/usr/bin/env node
// build.mjs — anúncio Amil "3 vidas" (Plano de Saúde Empresarial, a partir de R$ 1.166,21), story 9:16 e feed 1:1.
//
//   node tools/build.mjs story   -> compositions/*.html + index.html
//   node tools/build.mjs feed    -> feed/compositions/*.html + feed/index.html
//
// Sete cenas + fundo + camada de toque/grão. Os tempos saem das palavras da locução
// (assets/voice/vo.words.json, transcrição Scribe da tomada escolhida). Visual tirado da peça
// enviada: azul-marinho com índigo da Amil, cartão branco do preço, pílulas índigo, painel de
// benefícios com checks, Saira Semi Condensed nos títulos e Poppins no texto.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const FMT = process.argv[2] === "feed" ? "feed" : "story";
const ST = FMT === "story";
const W = 1080;
const H = ST ? 1920 : 1080;
const FPS = 30;
const D = 36.5;
const r3 = (x) => Math.round(x * 1000) / 1000;
const pick = (s, f) => (ST ? s : f);

// paleta (da peça)
const NAVY = "#0C0A4E";
const INDIGO = "#4B2BFF";
const INK = "#0E0A55";
const LILAC = "#B7A8FF";
const SOFT = "#EEF0FF";
const MUTED = "#4B4F75";

// ───────────── locução ─────────────
const WORDS = JSON.parse(readFileSync(join(ROOT, "assets/voice/vo.words.json"), "utf8"));
const norm = (s) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]/g, "");
// primeira ocorrência da palavra a partir do instante `after`
function word(text, after = 0) {
  const w = WORDS.find((x) => norm(x.word) === norm(text) && x.start >= after - 0.001);
  if (!w) throw new Error(`palavra não encontrada: ${text} depois de ${after}`);
  return w;
}
const at = (t, after = 0) => word(t, after).start;
const end = (t, after = 0) => word(t, after).end;

// marcos
const T = {
  psiu: at("psiu"),
  voce: at("voce"),
  cnpj1: at("cnpj"),
  sabia: at("sabia"),
  plano: at("plano"),
  saude: at("saude"),
  empresarial: at("empresarial"),
  amil: at("amil"),
  tres: at("tres"),
  vidas: at("vidas"),
  partir: at("partir"),
  mil: at("mil"),
  cento: at("cento"),
  sessenta: at("sessenta"),
  seis: at("seis"),
  vinte: at("vinte"),
  um: at("um", at("vinte")),
  centavos: at("centavos"),
  esse: at("esse"),
  dois: at("dois"),
  adultos: at("adultos"),
  trinta: at("trinta"),
  jovem: at("jovem"),
  dezoito: at("dezoito"),
  olha: at("olha"),
  junto: at("junto"),
  acesso: at("acesso"),
  norte: at("norte"),
  rede: at("rede"),
  dor2: at("dor", at("rede")),
  acomodacao: at("acomodacao"),
  quarto: at("quarto"),
  cobertura: at("cobertura"),
  nacional: at("nacional"),
  so: at("so"),
  detalhe: at("detalhe"),
  exclusivo: at("exclusivo"),
  cnpj2: at("cnpj", at("exclusivo")),
  valores: at("valores"),
  mudam: at("mudam"),
  faixa: at("faixa"),
  etaria: at("etaria"),
  regiao: at("regiao"),
  entao: at("entao"),
  nao: at("nao"),
  fica: at("fica"),
  achismo: at("achismo"),
  toque: at("toque"),
  solicite: at("solicite"),
  cotacao: at("cotacao"),
  descubra: at("descubra"),
  empresa: at("empresa"),
};
const TAP = r3(end("cotacao") + 0.12);

// ───────────── utilidades ─────────────
const FONTS = [
  ["SairaSC", 300, "normal", "SairaSemiCondensed-normal-300"],
  ["SairaSC", 500, "normal", "SairaSemiCondensed-normal-500"],
  ["SairaSC", 700, "normal", "SairaSemiCondensed-normal-700"],
  ["SairaSC", 800, "normal", "SairaSemiCondensed-normal-800"],
  ["Poppins", 400, "normal", "Poppins-normal-400"],
  ["Poppins", 500, "normal", "Poppins-normal-500"],
  ["Poppins", 600, "normal", "Poppins-normal-600"],
  ["Poppins", 400, "italic", "Poppins-italic-400"],
]
  .map(([f, w, s, file]) => `@font-face{font-family:"${f}";font-weight:${w};font-style:${s};font-display:block;src:url("assets/fonts/${file}.woff2") format("woff2");}`)
  .join("\n");

// palavras com máscara (cada uma sobe de dentro da própria caixa)
function wspans(p, text, cls = "") {
  return text
    .split(" ")
    .map((w, i) => `<span class="w"><span class="wi${cls ? " " + cls : ""}" id="${p}${i}">${w}</span></span>`)
    .join(" ");
}

const base = (p) => `
${FONTS}
#${p}-root{position:absolute;inset:0;width:${W}px;height:${H}px;overflow:hidden;font-family:"Poppins",Arial,sans-serif;color:#fff;}
.${p}-full{position:absolute;left:0;top:0;width:${W}px;height:${H}px;}
.d{font-family:"SairaSC",Arial,sans-serif;}
.w{display:inline-block;overflow:hidden;vertical-align:top;padding:0.1em 0.04em 0.06em;margin:-0.1em -0.04em -0.06em;}
.wi{display:inline-block;}
.logo{display:inline-block;-webkit-mask:url("assets/img/amil-logo.png") center/contain no-repeat;mask:url("assets/img/amil-logo.png") center/contain no-repeat;}
.sweep{position:absolute;left:0;top:0;width:100%;height:100%;background:linear-gradient(105deg,rgba(255,255,255,0) 35%,rgba(255,255,255,.55) 50%,rgba(255,255,255,0) 65%);mix-blend-mode:screen;}
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
  // palavras: sobem no instante em que são ditas
  const words = (p, times, dur = 0.42, from = 110) =>
    times.forEach((t, i) =>
      add(`tl.fromTo("#${p}${i}",{yPercent:${from},opacity:0},{yPercent:0,opacity:1,duration:${dur},ease:"power3.out"},${r3(Math.max(0, L(t) - 0.06))});`),
    );
  // respiração de câmera da cena inteira
  const drift = (sel, dur, to = 1.025) => add(`tl.fromTo("${sel}",{scale:1},{scale:${to},duration:${r3(dur)},ease:"none"},0);`);
  // tremida curta (impacto)
  const shake = (sel, t, amp = 10) =>
    [1, -0.8, 0.5, -0.25, 0].forEach((k, i) => add(`tl.set("${sel}",{x:${r3(k * amp)},y:${r3(-k * amp * 0.6)}},${r3(t + i / FPS)});`));
  return { a, L, add, words, drift, shake };
}

const ICONS = {
  check: `<path d="M12 25l8 8 16-18"/>`,
  pin: `<path d="M24 43s13-12.5 13-23a13 13 0 1 0-26 0c0 10.5 13 23 13 23z"/><circle cx="24" cy="20" r="5"/>`,
  bed: `<path d="M5 36V12M5 28h38v8M43 28v-4a6 6 0 0 0-6-6H22v10"/><circle cx="13" cy="22" r="4"/>`,
  globe: `<circle cx="24" cy="24" r="17"/><path d="M7 24h34M24 7c5 5 7 11 7 17s-2 12-7 17c-5-5-7-11-7-17s2-12 7-17z"/>`,
  arrow: `<path d="M10 24h28M28 14l10 10-10 10"/>`,
  updown: `<path d="M16 8v32M8 16l8-8 8 8M32 40V8M24 32l8 8 8-8"/>`,
  bang: `<circle cx="24" cy="24" r="19"/><path d="M24 14v13M24 33v.5"/>`,
  age: `<circle cx="17" cy="15" r="6"/><path d="M6 40c0-7 5-12 11-12s11 5 11 12"/><circle cx="34" cy="21" r="4.5"/><path d="M27 40c0-5 3-9 7-9s7 4 7 9"/>`,
};
const icon = (name, size, { id = "", sw = 3.4, color = "#fff", fill = "none" } = {}) =>
  `<svg ${id ? `id="${id}" ` : ""}viewBox="0 0 48 48" width="${size}" height="${size}" fill="${fill}" stroke="${color}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`;

// pessoa (avatar vetorial): adulto ou jovem
function person(size, { young = false, id = "", grad = "pg" } = {}) {
  const k = young ? 0.84 : 1;
  const hr = r3(30 * k);
  const hy = r3(84 - (1 - k) * 18);
  const sw = r3(58 * k);
  return `<svg ${id ? `id="${id}" ` : ""}viewBox="0 0 200 200" width="${size}" height="${size}" aria-hidden="true">
    <defs><linearGradient id="${grad}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#C9BEFF"/><stop offset="1" stop-color="${INDIGO}"/></linearGradient>
    <clipPath id="${grad}-c"><circle cx="100" cy="100" r="92"/></clipPath></defs>
    <circle cx="100" cy="100" r="92" fill="rgba(255,255,255,.08)" stroke="rgba(183,168,255,.55)" stroke-width="3"/>
    <g clip-path="url(#${grad}-c)" fill="url(#${grad})">
      <circle cx="100" cy="${hy}" r="${hr}"/>
      <path d="M${100 - sw - 16} 205 C${100 - sw - 10} ${hy + 60} ${100 - 30} ${hy + 40} 100 ${hy + 40} C${100 + 30} ${hy + 40} ${100 + sw + 10} ${hy + 60} ${100 + sw + 16} 205 Z"/>
    </g>
  </svg>`;
}

// mini mapa com pino (Norte D'Or)
function mapTile(size, p) {
  return `<svg viewBox="0 0 180 180" width="${size}" height="${size}" aria-hidden="true">
    <rect width="180" height="180" rx="28" fill="${SOFT}"/>
    <g stroke="#D3D6F2" stroke-width="10" stroke-linecap="round" fill="none">
      <path d="M-10 52 L190 30"/><path d="M-10 128 L190 150"/><path d="M40 -10 L64 190"/><path d="M128 -10 L112 190"/>
    </g>
    <g stroke="#E2E4F7" stroke-width="5" fill="none"><path d="M-10 92 L190 86"/><path d="M88 -10 L92 190"/></g>
    <circle id="${p}-ring" cx="90" cy="112" r="10" fill="none" stroke="${INDIGO}" stroke-width="4"/>
    <g id="${p}-pin"><path d="M90 116s26-25 26-46a26 26 0 1 0-52 0c0 21 26 46 26 46z" fill="${INDIGO}"/><circle cx="90" cy="70" r="10" fill="#fff"/></g>
  </svg>`;
}

// colunas de dígitos que rolam até o valor (caça-níquel)
function rollPrice(p, fs) {
  const LH = Math.round(fs * 1.0);
  const digits = "1166 21".replace(" ", "").split("").map(Number);
  let k = 0;
  const col = (d) => {
    const seq = [];
    for (let r = 0; r < 2; r++) for (let n = 0; n < 10; n++) seq.push(n);
    for (let n = 0; n <= d; n++) seq.push(n);
    return `<span class="dc"><span class="sz">${d}</span><span class="ds" id="${p}-ds${k++}">${seq.join("<br>")}</span></span>`;
  };
  const html = `<span id="${p}-rs" class="pr-rs">R$</span><span class="pr-sp"></span>${col(digits[0])}<span class="pr-pt">.</span>${col(digits[1])}${col(digits[2])}${col(digits[3])}<span class="pr-pt">,</span>${col(digits[4])}${col(digits[5])}`;
  const css = `.dc{position:relative;display:inline-block;height:${LH}px;overflow:hidden;vertical-align:top;}
.sz{display:inline-block;line-height:${LH}px;visibility:hidden;}
.ds{position:absolute;left:0;right:0;top:0;text-align:center;line-height:${LH}px;}
.pr-rs,.pr-pt{display:inline-block;line-height:${LH}px;vertical-align:top;}
.pr-sp{display:inline-block;width:.2em;}`;
  return { html, css, LH, finals: digits.map((d) => 20 + d) };
}

const scenes = [];

// ═════════════ fundo: marinho com brilhos índigo e grade de pontos ═════════════
{
  const p = "bg";
  const { a, add } = TL(0);
  const css =
    base(p) +
    `
#bg-base{background:radial-gradient(120% 70% at 50% 0%,#1A1488 0%,${NAVY} 55%,#07052E 100%);}
.bg-blob{position:absolute;border-radius:50%;}
#bg-b1{left:${pick(-380, -360)}px;top:${pick(-300, -380)}px;width:${pick(1100, 940)}px;height:${pick(1100, 940)}px;background:radial-gradient(closest-side,rgba(75,43,255,.55),rgba(75,43,255,0));}
#bg-b2{left:${pick(420, 520)}px;top:${pick(1150, 560)}px;width:${pick(1100, 900)}px;height:${pick(1100, 900)}px;background:radial-gradient(closest-side,rgba(120,90,255,.38),rgba(120,90,255,0));}
#bg-dots{position:absolute;left:0;top:0;width:${W}px;height:${H + 480}px;background:radial-gradient(circle,rgba(183,168,255,.16) 2px,rgba(183,168,255,0) 2.6px) 0 0/48px 48px;-webkit-mask:linear-gradient(180deg,rgba(0,0,0,.0),rgba(0,0,0,.9) 30%,rgba(0,0,0,.9) 70%,rgba(0,0,0,0));mask:linear-gradient(180deg,rgba(0,0,0,.0),rgba(0,0,0,.9) 30%,rgba(0,0,0,.9) 70%,rgba(0,0,0,0));}
#bg-vig{background:radial-gradient(110% 75% at 50% 45%,rgba(0,0,0,0) 55%,rgba(3,2,24,.6) 100%);}
`;
  const body = `
  <div id="bg-base" class="${p}-full"></div>
  <div id="bg-b1" class="bg-blob" data-layout-allow-overflow aria-hidden="true"></div><div id="bg-b2" class="bg-blob" data-layout-allow-overflow aria-hidden="true"></div>
  <div id="bg-dots" data-layout-allow-overflow aria-hidden="true"></div>
  <div id="bg-vig" class="${p}-full"></div>`;
  add(`tl.fromTo("#bg-b1",{x:0,y:0},{x:${pick(180, 140)},y:${pick(240, 140)},duration:9.125,ease:"sine.inOut",repeat:3,yoyo:true},0);`);
  add(`tl.fromTo("#bg-b2",{x:0,y:0},{x:${pick(-240, -180)},y:${pick(-280, -160)},duration:7.3,ease:"sine.inOut",repeat:4,yoyo:true},0);`);
  add(`tl.fromTo("#bg-dots",{y:0},{y:-480,duration:${D},ease:"none"},0);`);
  scenes.push({ st: 0, track: 0, ...scene(p, D, css, body, a) });
}

// ═════════════ 1 · gancho: "Psiu… você que tem CNPJ." ═════════════
{
  const p = "s1";
  const st = 0;
  const dur = T.sabia - 0.12;
  const { a, L, add, words, shake } = TL(st);
  const g = pick({ ps: 0.40, py: 700, vy: 860, cy: 990, cs: 360, vs: 76 }, { ps: 0.3, py: 250, vy: 380, cy: 480, cs: 300, vs: 64 });
  const css =
    base(p) +
    `
#s1-dark{background:radial-gradient(60% 40% at 50% ${Math.round(((g.cy + g.cs / 2) / H) * 100)}%,rgba(40,24,170,.55),rgba(5,3,28,.96) 70%);}
#s1-psiu{position:absolute;left:0;width:${W}px;top:${g.py}px;text-align:center;font-weight:300;font-size:${pick(130, 110)}px;letter-spacing:.04em;line-height:1;color:rgba(255,255,255,.9);}
#s1-v{position:absolute;left:0;width:${W}px;top:${g.vy}px;text-align:center;font-weight:500;font-size:${g.vs}px;line-height:1;letter-spacing:.01em;}
#s1-cw{position:absolute;left:0;width:${W}px;top:${g.cy}px;text-align:center;}
#s1-cnpj{display:inline-block;font-weight:800;font-size:${g.cs}px;line-height:1;letter-spacing:-.01em;background:linear-gradient(180deg,#FFFFFF 30%,${LILAC} 100%);-webkit-background-clip:text;background-clip:text;color:transparent;filter:drop-shadow(0 0 40px rgba(75,43,255,.85));}
#s1-ring{position:absolute;left:${W / 2 - 300}px;top:${g.cy + g.cs / 2 - 300}px;width:600px;height:600px;border-radius:50%;border:6px solid rgba(183,168,255,.8);opacity:0;}
.s1-ln{position:absolute;top:${g.cy + g.cs / 2}px;height:4px;width:${pick(420, 360)}px;background:linear-gradient(90deg,rgba(183,168,255,0),rgba(255,255,255,.95));opacity:0;}
#s1-l1{left:-${pick(420, 360)}px;}
#s1-l2{left:${W}px;transform-origin:0 50%;}
`;
  const body = `
  <div id="s1-dark" class="${p}-full"></div>
  <div id="s1-wrap" class="${p}-full">
    <div id="s1-psiu" class="d">psiu…</div>
    <div id="s1-v" class="d">${wspans("s1v", "você que tem")}</div>
    <div id="s1-ring" aria-hidden="true" data-layout-allow-overflow></div>
    <div id="s1-l1" class="s1-ln" aria-hidden="true" data-layout-allow-overflow></div><div id="s1-l2" class="s1-ln" aria-hidden="true" data-layout-allow-overflow></div>
    <div id="s1-cw"><span id="s1-cnpj" class="d">CNPJ</span></div>
  </div>`;
  // sussurro: entra desfocado, respirando
  add(`tl.fromTo("#s1-psiu",{opacity:0,scale:0.9,filter:"blur(16px)"},{opacity:1,scale:1,filter:"blur(0px)",duration:0.6,ease:"power2.out"},${L(T.psiu)});`);
  add(`tl.to("#s1-psiu",{opacity:0.45,y:-${pick(50, 30)},scale:0.82,duration:0.5,ease:"power2.inOut"},${r3(L(T.voce) - 0.1)});`);
  words("s1v", [T.voce, at("que"), at("tem")], 0.36);
  // CNPJ bate com peso
  const tc = L(T.cnpj1);
  add(`tl.fromTo("#s1-cnpj",{scale:2.3,opacity:0,filter:"blur(12px)"},{scale:1,opacity:1,filter:"blur(0px)",duration:0.2,ease:"power4.in"},${r3(tc - 0.12)});`);
  add(`tl.fromTo("#s1-ring",{scale:0.4,opacity:0.9},{scale:${pick(1.6, 1.4)},opacity:0,duration:0.7,ease:"power2.out",immediateRender:false},${r3(tc + 0.08)});`);
  add(`tl.fromTo("#s1-l1",{x:0,opacity:0},{x:${pick(560, 470)},opacity:1,duration:0.18,ease:"power2.out"},${r3(tc + 0.06)});`);
  add(`tl.to("#s1-l1",{opacity:0,duration:0.3},${r3(tc + 0.24)});`);
  add(`tl.fromTo("#s1-l2",{x:0,opacity:0,scaleX:-1},{x:-${pick(560, 470)},opacity:1,scaleX:-1,duration:0.18,ease:"power2.out"},${r3(tc + 0.06)});`);
  add(`tl.to("#s1-l2",{opacity:0,duration:0.3},${r3(tc + 0.24)});`);
  shake("#s1-wrap", r3(tc + 0.08), pick(14, 11));
  add(`tl.fromTo("#s1-cw",{scale:1},{scale:1.06,duration:${r3(dur - tc - 0.46)},ease:"none"},${r3(tc + 0.1)});`);
  // saída: o CNPJ atravessa a câmera
  add(`tl.to("#s1-cw",{scale:7,opacity:0,duration:0.32,ease:"power3.in"},${r3(dur - 0.34)});`);
  add(`tl.to(["#s1-psiu","#s1-v"],{opacity:0,duration:0.2},${r3(dur - 0.34)});`);
  add(`tl.to("#s1-dark",{opacity:0,duration:0.3,ease:"power1.in"},${r3(dur - 0.3)});`);
  scenes.push({ st, track: 1, ...scene(p, dur, css, body, a) });
}

// ═════════════ 2 · a foto do hospital + cartão: "3 vidas a partir de R$ 1.166,21" ═════════════
{
  const p = "s2";
  const st = T.sabia - 0.3;
  const dur = T.esse - 0.2 - st;
  const { a, L, add, words, drift, shake } = TL(st);
  const g = pick(
    { ph: { x: 40, y: 280, w: 1000, h: 520, r: 40 }, card: { x: 40, y: 720, w: 1000, h: 760, r: 36 }, pill: { y: 40, h: 120, fs: 70 },
      vid: { y: 196, fs: 206 }, ppl: { x: 652, y: 236, s: 92 }, ap: { y: 440, fs: 60, lx: 380, lw: 580 }, pr: { y: 524, fs: 196 }, tab: { w: 300, h: 112, lw: 196, lh: 60 } },
    { ph: { x: 40, y: 40, w: 1000, h: 360, r: 32 }, card: { x: 40, y: 330, w: 1000, h: 610, r: 32 }, pill: { y: 28, h: 96, fs: 58 },
      vid: { y: 140, fs: 170 }, ppl: { x: 652, y: 172, s: 80 }, ap: { y: 330, fs: 50, lx: 320, lw: 640 }, pr: { y: 396, fs: 166 }, tab: { w: 250, h: 92, lw: 162, lh: 50 } },
  );
  const R = rollPrice(p, g.pr.fs);
  // a foto cobre o painel (proporção 2,14:1)
  const iw = Math.max(g.ph.w, Math.round(g.ph.h * (1620 / 757)));
  const ih = Math.round(iw * (757 / 1620));
  const css =
    base(p) +
    R.css +
    `
#s2-ph{position:absolute;left:${g.ph.x}px;top:${g.ph.y}px;width:${g.ph.w}px;height:${g.ph.h}px;border-radius:${g.ph.r}px;overflow:hidden;box-shadow:0 30px 70px rgba(3,2,30,.55);}
#s2-img{position:absolute;left:${Math.round((g.ph.w - iw) / 2)}px;top:${Math.round((g.ph.h - ih) / 2)}px;width:${iw}px;height:${ih}px;background:url('assets/img/hospital-wide.jpg') center/cover no-repeat;transform-origin:62% 55%;}
#s2-shade{position:absolute;left:0;top:0;width:100%;height:100%;background:linear-gradient(180deg,rgba(12,10,78,0) 55%,rgba(12,10,78,.45) 100%);}
#s2-dim{position:absolute;left:0;top:0;width:100%;height:100%;background:rgba(6,4,40,1);opacity:0;}
#s2-tab{position:absolute;left:0;top:0;width:${g.tab.w}px;height:${g.tab.h}px;background:#fff;border-radius:0 0 ${Math.round(g.tab.h * 0.55)}px 0;display:flex;align-items:center;padding-left:${Math.round(g.tab.h * 0.36)}px;}
#s2-logo{width:${g.tab.lw}px;height:${g.tab.lh}px;background:${INDIGO};}
#s2-card{position:absolute;left:${g.card.x}px;top:${g.card.y}px;width:${g.card.w}px;height:${g.card.h}px;border-radius:${g.card.r}px;background:#fff;box-shadow:0 40px 90px rgba(3,2,30,.5);color:${INK};overflow:hidden;}
#s2-pill{position:absolute;left:40px;top:${g.pill.y}px;width:${g.card.w - 80}px;height:${g.pill.h}px;border-radius:${Math.round(g.pill.h * 0.18)}px;background:${INDIGO};color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:${g.pill.fs}px;line-height:1;white-space:nowrap;box-shadow:0 14px 30px rgba(75,43,255,.35);}
#s2-vid{position:absolute;left:40px;top:${g.vid.y}px;font-weight:300;font-size:${g.vid.fs}px;line-height:1;white-space:nowrap;letter-spacing:-.01em;}
.s2-pp{position:absolute;top:${g.ppl.y}px;}
#s2-ap{position:absolute;left:40px;top:${g.ap.y}px;font-weight:400;font-size:${g.ap.fs}px;line-height:1;white-space:nowrap;}
#s2-line{position:absolute;left:${g.ap.lx}px;top:${g.ap.y + Math.round(g.ap.fs * 0.6)}px;width:${g.ap.lw}px;height:3px;background:${INK};transform-origin:0 50%;}
#s2-pr{position:absolute;left:36px;top:10px;font-weight:800;font-size:${g.pr.fs}px;letter-spacing:-.02em;white-space:nowrap;}
#s2-prw{position:absolute;left:0;top:${g.pr.y - 10}px;width:100%;height:${g.pr.fs + 20}px;overflow:hidden;}
`;
  const ppl = [0, 1, 2]
    .map((i) => `<div class="s2-pp" id="s2-pp${i}" style="left:${g.ppl.x + i * (g.ppl.s + 12)}px">${person(g.ppl.s, { young: i === 2, grad: `s2g${i}` })}</div>`)
    .join("");
  const body = `
  <div id="s2-cam" class="${p}-full">
  <div id="s2-wrap" class="${p}-full">
    <div id="s2-ph" data-layout-allow-overlap><div id="s2-img"></div><div id="s2-shade"></div><div id="s2-dim"></div>
      <div id="s2-sw" class="sweep" aria-hidden="true"></div>
      <div id="s2-tab"><span id="s2-logo" class="logo" role="img" aria-label="Amil"></span></div></div>
    <div id="s2-card" data-layout-allow-overlap>
      <div id="s2-pill" class="d"><span>${wspans("s2w", "Plano de Saúde Empresarial")}</span></div>
      <div id="s2-vid" class="d"><span class="w"><span class="wi" id="s2-n3">3</span></span> <span class="w"><span class="wi" id="s2-vd">vidas</span></span></div>
      ${ppl}
      <div id="s2-ap">${wspans("s2a", "a partir de")}</div><div id="s2-line"></div>
      <div id="s2-prw"><div id="s2-pr" class="d">${R.html}</div><div id="s2-psw" class="sweep" aria-hidden="true"></div></div>
    </div>
  </div>
  </div>`;
  drift("#s2-cam", dur, 1.02);
  // foto abre do centro e a câmera assenta
  add(`tl.fromTo("#s2-ph",{clipPath:"inset(0% 50% 0% 50% round ${g.ph.r}px)"},{clipPath:"inset(0% 0% 0% 0% round ${g.ph.r}px)",duration:0.65,ease:"expo.out"},0.06);`);
  add(`tl.fromTo("#s2-img",{scale:1.3},{scale:1,duration:1.1,ease:"expo.out"},0.06);`);
  add(`tl.to("#s2-img",{scale:1.1,duration:${r3(dur - 1.2)},ease:"none"},1.16);`);
  add(`tl.fromTo("#s2-sw",{xPercent:-100},{xPercent:100,duration:1.0,ease:"power2.inOut"},0.45);`);
  add(`tl.fromTo("#s2-tab",{xPercent:-100},{xPercent:0,duration:0.5,ease:"power3.out"},0.35);`);
  add(`tl.fromTo("#s2-logo",{opacity:0,x:-30},{opacity:1,x:0,duration:0.45,ease:"power3.out"},0.6);`);
  // no "Amil" o logo pulsa
  add(`tl.fromTo("#s2-logo",{scale:1},{scale:1.14,duration:0.18,ease:"power2.out",immediateRender:false},${r3(L(T.amil) - 0.04)});`);
  add(`tl.to("#s2-logo",{scale:1,duration:0.4,ease:"back.out(2)"},${r3(L(T.amil) + 0.14)});`);
  // cartão sobe no "plano", título palavra por palavra
  add(`tl.fromTo("#s2-card",{y:${pick(260, 200)},opacity:0},{y:0,opacity:1,duration:0.55,ease:"power3.out"},${r3(L(T.plano) - 0.3)});`);
  add(`tl.fromTo("#s2-pill",{scaleX:0.2,opacity:0},{scaleX:1,opacity:1,duration:0.4,ease:"power3.out"},${r3(L(T.plano) - 0.15)});`);
  words("s2w", [T.plano, at("de"), T.saude, T.empresarial], 0.38);
  // 3 vidas + as três pessoas
  add(`tl.fromTo("#s2-n3",{yPercent:110},{yPercent:0,duration:0.42,ease:"power3.out"},${r3(L(T.tres) - 0.06)});`);
  add(`tl.fromTo("#s2-vd",{yPercent:110},{yPercent:0,duration:0.42,ease:"power3.out"},${r3(L(T.vidas) - 0.06)});`);
  [0, 1, 2].forEach((i) =>
    add(`tl.fromTo("#s2-pp${i}",{scale:0.3,opacity:0,y:30},{scale:1,opacity:1,y:0,duration:0.45,ease:"back.out(2.2)"},${r3(L(T.tres) + i * 0.13)});`),
  );
  words("s2a", [at("a", T.vidas), T.partir, at("de", T.partir)], 0.36);
  add(`tl.fromTo("#s2-line",{scaleX:0},{scaleX:1,duration:0.6,ease:"power3.inOut"},${r3(L(T.partir) + 0.1)});`);
  // tensão antes do preço: foto escurece, tudo aproxima um pouco
  add(`tl.to("#s2-dim",{opacity:0.45,duration:0.6,ease:"power1.in"},${r3(L(T.mil) - 0.6)});`);
  add(`tl.fromTo("#s2-wrap",{scale:1},{scale:${pick(1.05, 1.04)},duration:0.5,ease:"power2.in",transformOrigin:"50% ${pick(70, 75)}%"},${r3(L(T.mil) - 0.5)});`);
  add(`tl.to("#s2-wrap",{scale:1,duration:0.45,ease:"back.out(1.6)"},${r3(L(T.mil))});`);
  // preço: R$ aparece e cada dígito rola até o valor no instante em que é dito
  const t0 = r3(L(T.mil) - 0.06);
  add(`tl.fromTo("#s2-pr",{opacity:0},{opacity:1,duration:0.08},${t0});`);
  add(`tl.fromTo("#s2-rs",{scale:1.4,opacity:0},{scale:1,opacity:1,duration:0.3,ease:"power4.out"},${t0});`);
  const lands = [T.mil + 0.14, T.cento + 0.12, T.sessenta + 0.16, T.seis + 0.1, T.vinte + 0.12, T.um + 0.1];
  lands.forEach((tl_, i) =>
    add(`tl.fromTo("#s2-ds${i}",{y:0},{y:${-R.finals[i] * R.LH},duration:${r3(L(tl_) - t0)},ease:"power3.out"},${t0});`),
  );
  shake("#s2-card", r3(L(T.mil)), pick(8, 6));
  add(`tl.fromTo("#s2-psw",{xPercent:-100},{xPercent:100,duration:0.8,ease:"power2.inOut"},${r3(L(T.centavos) - 0.05)});`);
  add(`tl.fromTo("#s2-pr",{scale:1},{scale:1.04,duration:0.22,ease:"power2.out",transformOrigin:"0% 50%"},${r3(L(T.centavos))});`);
  add(`tl.to("#s2-pr",{scale:1,duration:0.4,ease:"power2.inOut"},${r3(L(T.centavos) + 0.22)});`);
  // saída em chicote para a esquerda
  add(`tl.to("#s2-wrap",{x:-${pick(320, 280)},opacity:0,duration:0.24,ease:"power3.in"},${r3(dur - 0.24)});`);
  scenes.push({ st, track: 2, ...scene(p, dur, css, body, a) });
}

// ═════════════ 3 · composição: 2 adultos até 38 + 1 jovem até 18 ═════════════
{
  const p = "s3";
  const st = T.esse - 0.32;
  const dur = T.olha - 0.2 - st;
  const { a, L, add, words, drift } = TL(st);
  const g = pick(
    { hy: 356, hs: 70, chy: 456, chh: 92, chs: 52, cy: 626, ch: 580, cw: 300, xs: [60, 390, 720], av: 200, avy: 40, lb: 268, lbs: 40, ate: 330, ates: 32, num: 362, nums: 150, an: 518, ans: 30, by: 1251, ly: 1326, ls: 84 },
    { hy: 50, hs: 58, chy: 132, chh: 76, chs: 44, cy: 250, ch: 500, cw: 300, xs: [60, 390, 720], av: 160, avy: 30, lb: 206, lbs: 34, ate: 256, ates: 28, num: 286, nums: 130, an: 424, ans: 26, by: 790, ly: 848, ls: 66 },
  );
  const ages = [38, 38, 18];
  const labels = ["ADULTO", "ADULTO", "JOVEM"];
  const css =
    base(p) +
    `
#s3-h{position:absolute;left:0;width:${W}px;top:${g.hy}px;text-align:center;font-weight:500;font-size:${g.hs}px;line-height:1;}
#s3-chw{position:absolute;left:0;width:${W}px;top:${g.chy}px;text-align:center;}
#s3-chip{display:inline-flex;align-items:center;height:${g.chh}px;padding:0 ${Math.round(g.chh * 0.5)}px;border-radius:${g.chh}px;background:${INDIGO};font-weight:700;font-size:${g.chs}px;box-shadow:0 14px 36px rgba(75,43,255,.45);}
.s3-c{position:absolute;top:${g.cy}px;width:${g.cw}px;height:${g.ch}px;border-radius:34px;background:linear-gradient(180deg,rgba(255,255,255,.13),rgba(255,255,255,.04));border:2px solid rgba(255,255,255,.16);box-shadow:0 30px 60px rgba(3,2,30,.35);}
.s3-av{position:absolute;left:${(g.cw - g.av) / 2}px;top:${g.avy}px;}
.s3-lb{position:absolute;left:0;width:100%;top:${g.lb}px;text-align:center;font-weight:700;font-size:${g.lbs}px;letter-spacing:.14em;color:${LILAC};}
.s3-ate{position:absolute;left:0;width:100%;top:${g.ate}px;text-align:center;font-size:${g.ates}px;color:rgba(255,255,255,.85);}
.s3-num{position:absolute;left:0;width:100%;top:${g.num}px;text-align:center;font-weight:800;font-size:${g.nums}px;line-height:1;font-variant-numeric:tabular-nums;}
.s3-an{position:absolute;left:0;width:100%;top:${g.an}px;text-align:center;font-size:${g.ans}px;color:rgba(255,255,255,.85);}
#s3-br{position:absolute;left:0;top:${g.by}px;}
#s3-lw{position:absolute;left:0;width:${W}px;top:${g.ly}px;text-align:center;font-weight:700;font-size:${g.ls}px;line-height:1;}
#s3-lw b{color:${LILAC};font-weight:700;}
`;
  const cards = [0, 1, 2]
    .map(
      (i) => `<div class="s3-c" id="s3-c${i}" style="left:${g.xs[i]}px">
      <div class="s3-av">${person(g.av, { young: i === 2, grad: `s3g${i}` })}</div>
      <div class="s3-lb d">${labels[i]}</div><div class="s3-ate">até</div>
      <div class="s3-num d"><span id="s3-n${i}">0</span></div><div class="s3-an">anos</div></div>`,
    )
    .join("");
  const bw = g.xs[2] + g.cw - g.xs[0];
  const bx0 = g.xs[0];
  const bh = 46;
  const brPath = `M${bx0} 0 Q${bx0} ${bh / 2} ${bx0 + 26} ${bh / 2} L${W / 2 - 26} ${bh / 2} Q${W / 2} ${bh / 2} ${W / 2} ${bh} Q${W / 2} ${bh / 2} ${W / 2 + 26} ${bh / 2} L${bx0 + bw - 26} ${bh / 2} Q${bx0 + bw} ${bh / 2} ${bx0 + bw} 0`;
  const body = `
  <div id="s3-cam" class="${p}-full">
  <div id="s3-wrap" class="${p}-full">
    <div id="s3-h" class="d">${wspans("s3h", "Esse valor é para")}</div>
    <div id="s3-chw"><span id="s3-chip" class="d">R$ 1.166,21</span></div>
    ${cards}
    <svg id="s3-br" viewBox="0 0 ${W} ${bh + 4}" width="${W}" height="${bh + 4}" aria-hidden="true"><path id="s3-brp" d="${brPath}" fill="none" stroke="${LILAC}" stroke-width="4" stroke-linecap="round" pathLength="1" stroke-dasharray="1 1" stroke-dashoffset="1"/></svg>
    <div id="s3-lw" class="d">= <b>3 vidas</b></div>
  </div>
  </div>`;
  drift("#s3-cam", dur, 1.02);
  add(`tl.fromTo("#s3-wrap",{x:${pick(320, 280)},opacity:0},{x:0,opacity:1,duration:0.4,ease:"power3.out"},0);`);
  words("s3h", [T.esse, at("valor"), at("e", T.esse), at("pra")], 0.36);
  add(`tl.fromTo("#s3-chip",{scale:0.5,opacity:0},{scale:1,opacity:1,duration:0.45,ease:"back.out(2)"},${r3(L(at("valor")) + 0.1)});`);
  const cin = [T.dois, T.adultos, T.jovem];
  cin.forEach((t, i) => add(`tl.fromTo("#s3-c${i}",{y:${pick(140, 100)},opacity:0,rotationY:-35},{y:0,opacity:1,rotationY:0,duration:0.55,ease:"power3.out",transformPerspective:900},${r3(L(t) - 0.12)});`));
  // idades contam até 38 / 18 quando são ditas
  const cnt = (i, to, t) => {
    for (let s = 0; s <= 12; s++) add(`tl.set("#s3-n${i}",{textContent:"${Math.round(to * (1 - Math.pow(1 - s / 12, 3)))}"},${r3(L(t) + (s / 12) * 0.5)});`);
  };
  cnt(0, 38, T.trinta);
  cnt(1, 38, T.trinta);
  cnt(2, 18, T.dezoito);
  [0, 1].forEach((i) => add(`tl.fromTo("#s3-c${i}",{scale:1},{scale:1.04,duration:0.2,ease:"power2.out",immediateRender:false},${r3(L(T.trinta) + 0.45)});`));
  [0, 1].forEach((i) => add(`tl.to("#s3-c${i}",{scale:1,duration:0.35,ease:"power2.inOut"},${r3(L(T.trinta) + 0.65)});`));
  add(`tl.fromTo("#s3-c2",{scale:1},{scale:1.05,duration:0.2,ease:"power2.out",immediateRender:false},${r3(L(T.dezoito) + 0.4)});`);
  add(`tl.to("#s3-c2",{scale:1,duration:0.35,ease:"power2.inOut"},${r3(L(T.dezoito) + 0.6)});`);
  // chave juntando as três: "= 3 vidas"
  const tb = r3(L(end("dezoito")) - 0.2);
  add(`tl.to("#s3-brp",{attr:{"stroke-dashoffset":0},duration:0.45,ease:"power2.inOut"},${tb});`);
  add(`tl.fromTo("#s3-lw",{y:30,opacity:0},{y:0,opacity:1,duration:0.4,ease:"power3.out"},${r3(tb + 0.25)});`);
  add(`tl.to("#s3-wrap",{y:-${pick(90, 60)},opacity:0,scale:0.96,duration:0.24,ease:"power2.in"},${r3(dur - 0.24)});`);
  scenes.push({ st, track: 3, ...scene(p, dur, css, body, a) });
}

// ═════════════ 4 · benefícios: Norte D'Or, quarto, cobertura nacional ═════════════
{
  const p = "s4";
  const st = T.olha - 0.3;
  const dur = T.so - 0.12 - st;
  const { a, L, add, words, drift } = TL(st);
  const g = pick(
    { py: 370, ph: 72, ps: 38, ty: 476, ts: 96, ry: [640, 900, 1160], rh: 230, tile: 180, rt: 64, rs: 31, ck: 78 },
    { py: 40, ph: 60, ps: 32, ty: 122, ts: 78, ry: [250, 470, 690], rh: 196, tile: 150, rt: 54, rs: 27, ck: 66 },
  );
  const rows = [
    { t: "Acesso ao Norte D’Or", s: "Rede D’Or · Cascadura, Rio de Janeiro", ic: "map" },
    { t: "Acomodação em quarto", s: "Tipo de acomodação do plano", ic: "bed" },
    { t: "Cobertura nacional", s: "Abrangência em todo o Brasil", ic: "globe" },
  ];
  const pad = Math.round((g.rh - g.tile) / 2);
  const css =
    base(p) +
    `
#s4-pw{position:absolute;left:0;width:${W}px;top:${g.py}px;text-align:center;}
#s4-pill{display:inline-flex;align-items:center;height:${g.ph}px;padding:0 ${Math.round(g.ph * 0.5)}px;border-radius:${g.ph}px;background:#fff;color:${INDIGO};font-weight:700;font-size:${g.ps}px;letter-spacing:.02em;box-shadow:0 12px 30px rgba(3,2,30,.35);}
#s4-t{position:absolute;left:0;width:${W}px;top:${g.ty}px;text-align:center;font-weight:700;font-size:${g.ts}px;line-height:1;}
#s4-t .hl{color:${LILAC};}
.s4-r{position:absolute;left:40px;width:1000px;height:${g.rh}px;border-radius:32px;background:#fff;color:${INK};box-shadow:0 26px 60px rgba(3,2,30,.45);}
.s4-tile{position:absolute;left:${pad}px;top:${pad}px;width:${g.tile}px;height:${g.tile}px;border-radius:28px;background:${SOFT};display:flex;align-items:center;justify-content:center;overflow:hidden;}
.s4-tt{position:absolute;left:${pad * 2 + g.tile}px;top:${Math.round(g.rh / 2 - g.rt * 0.95)}px;font-weight:700;font-size:${g.rt}px;line-height:1;white-space:nowrap;}
.s4-ts{position:absolute;left:${pad * 2 + g.tile}px;top:${Math.round(g.rh / 2 + g.rt * 0.22)}px;font-weight:500;font-size:${g.rs}px;color:${MUTED};white-space:nowrap;}
.s4-ck{position:absolute;right:${pad + 4}px;top:${Math.round((g.rh - g.ck) / 2)}px;width:${g.ck}px;height:${g.ck}px;}
`;
  const ck = (i) => `<svg class="s4-ck" viewBox="0 0 80 80" aria-hidden="true">
      <circle cx="40" cy="40" r="36" fill="none" stroke="#D9DCF5" stroke-width="5"/>
      <circle id="s4-cf${i}" cx="40" cy="40" r="38" fill="${INDIGO}" opacity="0"/>
      <path id="s4-cp${i}" d="M24 41l11 11 21-24" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" pathLength="1" stroke-dasharray="1 1" stroke-dashoffset="1"/></svg>`;
  const tileIcon = (r, i) => (r.ic === "map" ? mapTile(g.tile, `s4m${i}`) : icon(r.ic, Math.round(g.tile * 0.56), { color: INDIGO, sw: 3.4 }));
  const body = `
  <div id="s4-cam" class="${p}-full">
  <div id="s4-wrap" class="${p}-full">
    <div id="s4-pw"><span id="s4-pill" class="d">BENEFÍCIOS EXCLUSIVOS</span></div>
    <div id="s4-t" class="d">${wspans("s4t", "Olha o que vem junto").replace('<span class="wi" id="s4t4">', '<span class="wi hl" id="s4t4">')}</div>
    ${rows
      .map(
        (r, i) => `<div class="s4-r" id="s4-r${i}" style="top:${g.ry[i]}px">
      <div class="s4-tile">${tileIcon(r, i)}</div>
      <div class="s4-tt d">${r.t}</div><div class="s4-ts">${r.s}</div>${ck(i)}</div>`,
      )
      .join("")}
  </div>
  </div>`;
  drift("#s4-cam", dur, 1.02);
  add(`tl.fromTo("#s4-wrap",{y:${pick(90, 60)},opacity:0},{y:0,opacity:1,duration:0.35,ease:"power3.out"},0);`);
  add(`tl.fromTo("#s4-pill",{scale:0.6,opacity:0},{scale:1,opacity:1,duration:0.45,ease:"back.out(2)"},${r3(L(T.olha) - 0.1)});`);
  words("s4t", [T.olha, at("o", T.olha), at("que", T.olha), at("vem"), T.junto], 0.36);
  // cada linha entra no instante do benefício e ganha o check quando ele termina de ser dito
  const rin = [T.acesso, T.acomodacao, T.cobertura];
  const rck = [T.dor2 + 0.05, T.quarto + 0.15, T.nacional + 0.2];
  rin.forEach((t, i) => {
    add(`tl.fromTo("#s4-r${i}",{x:${pick(1100, 1100)},rotation:3},{x:0,rotation:0,duration:0.55,ease:"power4.out"},${r3(L(t) - 0.2)});`);
    add(`tl.to("#s4-cf${i}",{opacity:1,duration:0.15},${r3(L(rck[i]))});`);
    add(`tl.to("#s4-cp${i}",{attr:{"stroke-dashoffset":0},duration:0.3,ease:"power2.out"},${r3(L(rck[i]) + 0.05)});`);
    add(`tl.fromTo("#s4-r${i}",{scale:1},{scale:1.03,duration:0.15,ease:"power2.out",immediateRender:false},${r3(L(rck[i]))});`);
    add(`tl.to("#s4-r${i}",{scale:1,duration:0.3,ease:"power2.inOut"},${r3(L(rck[i]) + 0.15)});`);
  });
  // pino cai no mapa no "Norte D'Or"
  add(`tl.fromTo("#s4m0-pin",{y:-120,opacity:0},{y:0,opacity:1,duration:0.5,ease:"bounce.out"},${r3(L(T.norte) - 0.15)});`);
  add(`tl.fromTo("#s4m0-ring",{attr:{r:8},opacity:0.9},{attr:{r:60},opacity:0,duration:0.9,ease:"power2.out"},${r3(L(T.norte) + 0.35)});`);
  add(`tl.fromTo("#s4m0-ring",{attr:{r:8},opacity:0.9},{attr:{r:60},opacity:0,duration:0.9,ease:"power2.out",immediateRender:false},${r3(L(T.rede) + 0.35)});`);
  // saída: as linhas vão embora em sequência
  [0, 1, 2].forEach((i) => add(`tl.to("#s4-r${i}",{x:-1150,duration:0.3,ease:"power3.in"},${r3(dur - 0.36 + i * 0.04)});`));
  add(`tl.to(["#s4-pw","#s4-t"],{opacity:0,y:-40,duration:0.25,ease:"power2.in"},${r3(dur - 0.3)});`);
  scenes.push({ st, track: 4, ...scene(p, dur, css, body, a) });
}

// ═════════════ 5 · "Só um detalhe: é exclusivo para CNPJ" + valores por faixa etária e região ═════════════
{
  const p = "s5";
  const st = T.so - 0.2;
  const dur = T.entao - 0.12 - st;
  const { a, L, add, words, drift, shake } = TL(st);
  const g = pick(
    { ly: 330, ls: 50, sx: 90, sy: 450, sw: 900, sh: 440, s1: 76, s1y: 66, s2: 250, s2y: 150, chy: 990, chh: 96, chs: 46, cy: 1130, ch: 270, cw: 490, ct: 52, cap: 1440, caps: 36 },
    { ly: 44, ls: 42, sx: 140, sy: 120, sw: 800, sh: 360, s1: 62, s1y: 52, s2: 206, s2y: 124, chy: 520, chh: 84, chs: 40, cy: 640, ch: 250, cw: 490, ct: 46, cap: 930, caps: 32 },
  );
  const css =
    base(p) +
    `
#s5-l{position:absolute;left:0;width:${W}px;top:${g.ly}px;display:flex;justify-content:center;align-items:center;gap:16px;font-weight:600;font-size:${g.ls}px;color:${LILAC};line-height:1;}
#s5-sw{position:absolute;left:${g.sx}px;top:${g.sy}px;width:${g.sw}px;height:${g.sh}px;}
#s5-st{position:absolute;inset:0;border-radius:40px;background:${INDIGO};box-shadow:0 40px 90px rgba(40,20,200,.5);transform:rotate(-4deg);}
#s5-st::after{content:"";position:absolute;inset:22px;border-radius:26px;border:5px dashed rgba(255,255,255,.55);}
#s5-s1{position:absolute;left:0;width:100%;top:${g.s1y}px;text-align:center;font-weight:500;font-size:${g.s1}px;line-height:1;letter-spacing:.06em;}
#s5-s2{position:absolute;left:0;width:100%;top:${g.s2y}px;text-align:center;font-weight:800;font-size:${g.s2}px;line-height:1;}
#s5-chw{position:absolute;left:0;width:${W}px;top:${g.chy}px;text-align:center;}
#s5-chip{display:inline-flex;align-items:center;gap:18px;height:${g.chh}px;padding:0 ${Math.round(g.chh * 0.5)}px;border-radius:${g.chh}px;background:#fff;color:${INK};font-weight:600;font-size:${g.chs}px;box-shadow:0 14px 34px rgba(3,2,30,.4);}
#s5-chip b{font-family:"SairaSC",Arial,sans-serif;font-weight:800;font-size:1.15em;}
.s5-c{position:absolute;top:${g.cy}px;width:${g.cw}px;height:${g.ch}px;border-radius:32px;background:linear-gradient(180deg,rgba(255,255,255,.14),rgba(255,255,255,.05));border:2px solid rgba(255,255,255,.18);}
.s5-ic{position:absolute;left:34px;top:30px;}
.s5-ct{position:absolute;left:${34 + 70 + 18}px;top:${30 + 35 - Math.round(g.ct * 0.55)}px;font-weight:700;font-size:${g.ct}px;line-height:1;}
.s5-trk{position:absolute;left:40px;right:40px;top:${Math.round(g.ch * 0.66)}px;height:10px;border-radius:10px;background:rgba(255,255,255,.18);}
.s5-tk{position:absolute;top:-5px;width:4px;height:20px;border-radius:2px;background:rgba(255,255,255,.35);}
#s5-kn{position:absolute;left:-17px;top:-12px;width:34px;height:34px;border-radius:50%;background:#fff;box-shadow:0 0 0 8px rgba(183,168,255,.35);}
.s5-dot{position:absolute;width:16px;height:16px;border-radius:50%;background:rgba(255,255,255,.3);}
#s5-pin{position:absolute;}
#s5-cap{position:absolute;left:0;width:${W}px;top:${g.cap}px;text-align:center;font-weight:500;font-size:${g.caps}px;color:rgba(255,255,255,.88);}
`;
  const tw = g.cw - 80;
  const ticks = Array.from({ length: 10 }, (_, i) => `<span class="s5-tk" style="left:${Math.round((i / 9) * (tw - 4))}px"></span>`).join("");
  // pontos de "regiões" espalhados e um pino que passeia entre eles
  const dots = [
    [70, 0.58],
    [150, 0.74],
    [230, 0.6],
    [300, 0.8],
    [380, 0.64],
  ].map(([x, yk]) => [x, Math.round(g.ch * yk)]);
  const dotsHtml = dots.map(([x, y]) => `<span class="s5-dot" style="left:${x}px;top:${y}px"></span>`).join("");
  const body = `
  <div id="s5-cam" class="${p}-full">
  <div id="s5-wrap" class="${p}-full">
    <div id="s5-l">${icon("bang", Math.round(g.ls * 1.1), { color: LILAC, sw: 3.6 })}<span class="w"><span class="wi" id="s5l0">Só</span></span> <span class="w"><span class="wi" id="s5l1">um</span></span> <span class="w"><span class="wi" id="s5l2">detalhe:</span></span></div>
    <div id="s5-sw"><div id="s5-st"><div id="s5-s1" class="d">EXCLUSIVO PARA</div><div id="s5-s2" class="d">CNPJ</div></div></div>
    <div id="s5-chw"><span id="s5-chip">${icon("updown", Math.round(g.chs * 1.05), { color: INDIGO, sw: 4 })}<span>a partir de <b>R$ 1.166,21</b></span></span></div>
    <div class="s5-c" id="s5-ca" style="left:40px"><div class="s5-ic">${icon("age", 70, { color: LILAC, sw: 3.2 })}</div><div class="s5-ct d">Faixa etária</div>
      <div class="s5-trk">${ticks}<span id="s5-kn"></span></div></div>
    <div class="s5-c" id="s5-cb" style="left:550px"><div class="s5-ic">${icon("pin", 70, { color: LILAC, sw: 3.2 })}</div><div class="s5-ct d">Região</div>
      ${dotsHtml}<div id="s5-pin" style="left:${dots[0][0] - 17}px;top:${dots[0][1] - 40}px">${icon("pin", 50, { color: "#fff", fill: INDIGO, sw: 3 })}</div></div>
    <div id="s5-cap">Valores sujeitos à faixa etária e região.</div>
  </div>
  </div>`;
  drift("#s5-cam", dur, 1.02);
  add(`tl.fromTo("#s5-l svg",{scale:0,rotation:-90},{scale:1,rotation:0,duration:0.45,ease:"back.out(2)"},${r3(L(T.so) - 0.1)});`);
  words("s5l", [T.so, at("um", T.so), T.detalhe], 0.34);
  // carimbo "EXCLUSIVO PARA CNPJ"
  const ts = L(T.exclusivo);
  add(`tl.fromTo("#s5-sw",{scale:1.9,opacity:0},{scale:1,opacity:1,duration:0.2,ease:"power4.in"},${r3(ts - 0.14)});`);
  shake("#s5-wrap", r3(ts + 0.06), pick(14, 11));
  add(`tl.fromTo("#s5-s2",{scale:1},{scale:1.06,duration:0.18,ease:"power2.out"},${r3(L(T.cnpj2))});`);
  add(`tl.to("#s5-s2",{scale:1,duration:0.35,ease:"power2.inOut"},${r3(L(T.cnpj2) + 0.18)});`);
  // os valores mudam: chip do preço e os dois controles
  add(`tl.to("#s5-sw",{scale:0.86,y:-${pick(60, 40)},duration:0.5,ease:"power3.inOut"},${r3(L(T.valores) - 0.3)});`);
  add(`tl.fromTo("#s5-chip",{y:40,opacity:0},{y:0,opacity:1,duration:0.4,ease:"power3.out"},${r3(L(T.valores) - 0.1)});`);
  add(`tl.fromTo("#s5-chip svg",{y:0},{y:-8,duration:0.25,ease:"sine.inOut",repeat:5,yoyo:true},${r3(L(T.mudam))});`);
  add(`tl.fromTo("#s5-ca",{y:120,opacity:0},{y:0,opacity:1,duration:0.45,ease:"power3.out"},${r3(L(T.faixa) - 0.25)});`);
  add(`tl.fromTo("#s5-cb",{y:120,opacity:0},{y:0,opacity:1,duration:0.45,ease:"power3.out"},${r3(L(T.regiao) - 0.35)});`);
  // o cursor da faixa etária e o pino da região andam
  const kx = (k) => Math.round(k * (tw - 4));
  add(`tl.fromTo("#s5-kn",{x:${kx(0.1)}},{x:${kx(0.75)},duration:0.9,ease:"power2.inOut"},${r3(L(T.faixa))});`);
  add(`tl.to("#s5-kn",{x:${kx(0.4)},duration:0.8,ease:"power2.inOut"},${r3(L(T.faixa) + 0.95)});`);
  const pinHops = [2, 4, 1];
  pinHops.forEach((d, i) =>
    add(`tl.to("#s5-pin",{x:${dots[d][0] - dots[0][0]},y:${dots[d][1] - dots[0][1]},duration:0.35,ease:"power2.inOut"},${r3(L(T.regiao) + i * 0.4)});`),
  );
  add(`tl.fromTo("#s5-cap",{opacity:0},{opacity:1,duration:0.4},${r3(L(T.regiao) + 0.2)});`);
  add(`tl.to("#s5-wrap",{opacity:0,scale:0.95,duration:0.25,ease:"power2.in"},${r3(dur - 0.25)});`);
  scenes.push({ st, track: 5, ...scene(p, dur, css, body, a) });
}

// ═════════════ 6 · "Então não fica no achismo." ═════════════
{
  const p = "s6";
  const st = T.entao - 0.2;
  const dur = T.toque - 0.06 - st;
  const { a, L, add, words } = TL(st);
  const g = pick({ ey: 690, es: 58, ny: 780, ns: 112, ay: 905, as: 232 }, { ey: 250, es: 50, ny: 330, ns: 92, ay: 440, as: 196 });
  const qs = pick(
    [
      [130, 520, 120, -12],
      [880, 600, 150, 10],
      [170, 1250, 140, 8],
      [860, 1300, 110, -10],
      [520, 430, 90, 4],
    ],
    [
      [110, 120, 100, -12],
      [900, 170, 120, 10],
      [140, 760, 120, 8],
      [880, 800, 96, -10],
      [520, 860, 80, 4],
    ],
  );
  const css =
    base(p) +
    `
#s6-e{position:absolute;left:0;width:${W}px;top:${g.ey}px;text-align:center;font-weight:500;font-size:${g.es}px;color:${LILAC};line-height:1;}
#s6-n{position:absolute;left:0;width:${W}px;top:${g.ny}px;text-align:center;font-weight:700;font-size:${g.ns}px;line-height:1;}
#s6-aw{position:absolute;left:0;width:${W}px;top:${g.ay}px;text-align:center;}
#s6-a{display:inline-block;position:relative;font-weight:800;font-size:${g.as}px;line-height:1;}
#s6-x{position:absolute;left:-3%;top:52%;width:106%;height:${Math.round(g.as * 0.08)}px;border-radius:20px;background:${INDIGO};box-shadow:0 0 30px rgba(75,43,255,.9);transform-origin:0 50%;}
.s6-q{position:absolute;font-weight:300;color:rgba(183,168,255,.35);line-height:1;}
`;
  const body = `
  <div id="s6-wrap" class="${p}-full">
    ${qs.map(([x, y, s, r], i) => `<div class="s6-q d" id="s6-q${i}" style="left:${x}px;top:${y}px;font-size:${s}px" aria-hidden="true"><span style="display:inline-block;transform:rotate(${r}deg)">?</span></div>`).join("")}
    <div id="s6-e">${wspans("s6e", "Então")}</div>
    <div id="s6-n" class="d">${wspans("s6n", "não fica no")}</div>
    <div id="s6-aw"><span id="s6-a" class="d"><span class="w"><span class="wi" id="s6a0">achismo.</span></span><span id="s6-x"></span></span></div>
  </div>`;
  qs.forEach((_, i) => add(`tl.fromTo("#s6-q${i}",{opacity:0,y:30},{opacity:1,y:-20,duration:0.9,ease:"sine.out"},${r3(0.05 + i * 0.08)});`));
  words("s6e", [T.entao], 0.36);
  words("s6n", [T.nao, T.fica, at("no", T.fica)], 0.34);
  words("s6a", [T.achismo], 0.4);
  const tx = r3(L(end("achismo")) - 0.05);
  add(`tl.fromTo("#s6-x",{scaleX:0},{scaleX:1,duration:0.22,ease:"power3.out"},${tx});`);
  qs.forEach((_, i) => add(`tl.to("#s6-q${i}",{opacity:0,scale:0.4,duration:0.25,ease:"power2.in"},${r3(tx + 0.05)});`));
  add(`tl.to("#s6-wrap",{y:-${pick(160, 100)},opacity:0,duration:0.26,ease:"power3.in"},${r3(dur - 0.26)});`);
  scenes.push({ st, track: 6, ...scene(p, dur, css, body, a) });
}

// ═════════════ 7 · CTA: a peça se monta, "Solicite sua cotação" ═════════════
const BTN = pick({ x: 160, y: 1316, w: 760, h: 136 }, { x: 190, y: 890, w: 700, h: 108 });
{
  const p = "s7";
  const st = T.toque - 0.2;
  const dur = D - st;
  const { a, L, add, drift } = TL(st);
  const g = pick(
    {
      ph: { x: 40, y: 240, w: 1000, h: 500, r: 36 }, tab: { w: 290, h: 106, lw: 186, lh: 58 },
      card: { x: 40, y: 650, w: 520, h: 560 }, pill: { y: 28, h: 124, fs: 52 }, vid: { y: 168, fs: 140 }, ap: { y: 318, fs: 44, lx: 268, lw: 222 }, pr: { y: 372, fs: 104 }, fn: { y: 492, fs: 21 },
      rc: { x: 590, w: 450 }, ex: { y: 760, h: 66, fs: 37 }, bp: { y: 850, h: 360, py: 28, phh: 54, pfs: 28, rows: [112, 186, 260], rfs: 29, cb: 38 },
      va: { y: 1250, fs: 34 }, bt: 62, ans: { y: 1484, fs: 21 },
    },
    {
      ph: { x: 30, y: 30, w: 1020, h: 380, r: 30 }, tab: { w: 240, h: 88, lw: 156, lh: 48 },
      card: { x: 30, y: 318, w: 500, h: 506 }, pill: { y: 22, h: 104, fs: 44 }, vid: { y: 140, fs: 112 }, ap: { y: 262, fs: 36, lx: 222, lw: 250 }, pr: { y: 306, fs: 94 }, fn: { y: 418, fs: 18 },
      rc: { x: 560, w: 490 }, ex: { y: 428, h: 58, fs: 32 }, bp: { y: 504, h: 320, py: 24, phh: 48, pfs: 25, rows: [98, 164, 230], rfs: 26, cb: 34 },
      va: { y: 846, fs: 28 }, bt: 50, ans: { y: 1022, fs: 18 },
    },
  );
  const iw = Math.max(g.ph.w, Math.round(g.ph.h * (1620 / 757)));
  const ih = Math.round(iw * (757 / 1620));
  const css =
    base(p) +
    `
#s7-ph{position:absolute;left:${g.ph.x}px;top:${g.ph.y}px;width:${g.ph.w}px;height:${g.ph.h}px;border-radius:${g.ph.r}px;overflow:hidden;box-shadow:0 30px 70px rgba(3,2,30,.5);}
#s7-img{position:absolute;left:${Math.round((g.ph.w - iw) / 2)}px;top:${Math.round((g.ph.h - ih) / 2)}px;width:${iw}px;height:${ih}px;background:url('assets/img/hospital-wide.jpg') center/cover no-repeat;transform-origin:62% 50%;}
#s7-tab{position:absolute;left:0;top:0;width:${g.tab.w}px;height:${g.tab.h}px;background:#fff;border-radius:0 0 ${Math.round(g.tab.h * 0.55)}px 0;display:flex;align-items:center;padding-left:${Math.round(g.tab.h * 0.34)}px;}
#s7-logo{width:${g.tab.lw}px;height:${g.tab.lh}px;background:${INDIGO};}
#s7-card{position:absolute;left:${g.card.x}px;top:${g.card.y}px;width:${g.card.w}px;height:${g.card.h}px;border-radius:28px;background:#fff;color:${INK};box-shadow:0 30px 70px rgba(3,2,30,.5);}
#s7-pill{position:absolute;left:28px;top:${g.pill.y}px;width:${g.card.w - 56}px;height:${g.pill.h}px;border-radius:16px;background:${INDIGO};color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;font-weight:700;font-size:${g.pill.fs}px;line-height:1.0;}
#s7-vid{position:absolute;left:28px;top:${g.vid.y}px;font-weight:300;font-size:${g.vid.fs}px;line-height:1;white-space:nowrap;}
#s7-ap{position:absolute;left:28px;top:${g.ap.y}px;font-size:${g.ap.fs}px;line-height:1;}
#s7-line{position:absolute;left:${g.ap.lx}px;top:${g.ap.y + Math.round(g.ap.fs * 0.6)}px;width:${g.ap.lw}px;height:3px;background:${INK};}
#s7-pr{position:absolute;left:26px;top:0;font-weight:800;font-size:${g.pr.fs}px;line-height:1;letter-spacing:-.02em;white-space:nowrap;}
#s7-prw{position:absolute;left:0;top:${g.pr.y}px;width:100%;height:${g.pr.fs}px;overflow:hidden;}
#s7-fn{position:absolute;left:28px;top:${g.fn.y}px;width:${g.card.w - 56}px;font-style:italic;font-size:${g.fn.fs}px;line-height:1.35;color:#2E2A66;}
#s7-ex{position:absolute;left:${g.rc.x}px;top:${g.ex.y}px;width:${g.rc.w}px;height:${g.ex.h}px;border-radius:12px;background:${INDIGO};display:flex;align-items:center;justify-content:center;font-weight:500;font-size:${g.ex.fs}px;letter-spacing:.02em;}
#s7-bp{position:absolute;left:${g.rc.x}px;top:${g.bp.y}px;width:${g.rc.w}px;height:${g.bp.h}px;border-radius:28px;background:${INDIGO};box-shadow:0 30px 70px rgba(40,20,200,.4);}
#s7-bph{position:absolute;left:24px;top:${g.bp.py}px;height:${g.bp.phh}px;padding:0 22px;border-radius:${g.bp.phh}px;background:#fff;color:${INDIGO};display:flex;align-items:center;font-weight:700;font-size:${g.bp.pfs}px;white-space:nowrap;}
.s7-row{position:absolute;left:28px;display:flex;align-items:center;gap:16px;font-weight:500;font-size:${g.bp.rfs}px;white-space:nowrap;}
.s7-cb{width:${g.bp.cb}px;height:${g.bp.cb}px;border-radius:8px;background:#fff;display:flex;align-items:center;justify-content:center;}
#s7-va{position:absolute;left:0;width:${W}px;top:${g.va.y}px;text-align:center;font-weight:500;font-size:${g.va.fs}px;letter-spacing:.02em;}
#s7-bw{position:absolute;left:${BTN.x}px;top:${BTN.y}px;width:${BTN.w}px;height:${BTN.h}px;}
#s7-ring{position:absolute;inset:0;border-radius:${Math.round(BTN.h * 0.28)}px;border:4px solid rgba(183,168,255,.95);opacity:0;}
#s7-btn{position:absolute;inset:0;border-radius:${Math.round(BTN.h * 0.28)}px;background:${INDIGO};display:flex;align-items:center;justify-content:center;gap:18px;font-weight:700;font-size:${g.bt}px;box-shadow:0 20px 50px rgba(75,43,255,.55),inset 0 2px 0 rgba(255,255,255,.25);overflow:hidden;}
#s7-ans{position:absolute;left:0;width:${W}px;top:${g.ans.y}px;text-align:center;font-size:${g.ans.fs}px;color:rgba(255,255,255,.72);}
`;
  const rows = ["Acesso ao Norte D’Or", "Acomodação Quarto", "Cobertura Nacional"];
  const body = `
  <div id="s7-cam" class="${p}-full">
  <div id="s7-wrap" class="${p}-full">
    <div id="s7-ph" data-layout-allow-overlap><div id="s7-img"></div><div id="s7-sw" class="sweep" aria-hidden="true"></div>
      <div id="s7-tab"><span id="s7-logo" class="logo" role="img" aria-label="Amil"></span></div></div>
    <div id="s7-card" data-layout-allow-overlap>
      <div id="s7-pill" class="d"><span>Plano de Saúde</span><span>Empresarial</span></div>
      <div id="s7-vid" class="d">3 vidas</div>
      <div id="s7-ap">a partir de</div><div id="s7-line"></div>
      <div id="s7-prw"><div id="s7-pr" class="d">R$ 1.166,21</div><div id="s7-psw" class="sweep" aria-hidden="true"></div></div>
      <div id="s7-fn">3 vidas sendo: 2 adultos até 38 anos e 1 jovem até 18 anos.</div>
    </div>
    <div id="s7-ex" class="d">EXCLUSIVO PARA CNPJ</div>
    <div id="s7-bp"><div id="s7-bph" class="d">BENEFÍCIOS EXCLUSIVOS:</div>
      ${rows.map((r, i) => `<div class="s7-row" id="s7-r${i}" style="top:${g.bp.rows[i]}px"><span class="s7-cb">${icon("check", Math.round(g.bp.cb * 0.8), { color: INDIGO, sw: 6 })}</span>${r}</div>`).join("")}
    </div>
    <div id="s7-va" class="d">VALORES SUJEITOS À FAIXA ETÁRIA E REGIÃO.</div>
    <div id="s7-bw"><div id="s7-ring"></div><div id="s7-btn" class="d"><span>Solicite sua cotação</span>${icon("arrow", Math.round(g.bt * 0.9), { id: "s7-arrow", color: "#fff", sw: 4.4 })}<div id="s7-bsw" class="sweep" aria-hidden="true"></div></div></div>
    <div id="s7-ans">Imagem ilustrativa. Amil · ANS nº 326305</div>
  </div>
  </div>`;
  drift("#s7-cam", dur, 1.015);
  // a peça se monta em cascata
  add(`tl.fromTo("#s7-ph",{clipPath:"inset(0% 0% 100% 0% round ${g.ph.r}px)"},{clipPath:"inset(0% 0% 0% 0% round ${g.ph.r}px)",duration:0.6,ease:"expo.out"},0.1);`);
  add(`tl.fromTo("#s7-img",{scale:1.25},{scale:1,duration:1.0,ease:"expo.out"},0.1);`);
  add(`tl.to("#s7-img",{scale:1.08,duration:${r3(dur - 1.2)},ease:"none"},1.1);`);
  add(`tl.fromTo("#s7-tab",{xPercent:-100},{xPercent:0,duration:0.45,ease:"power3.out"},0.3);`);
  add(`tl.fromTo("#s7-card",{y:${pick(220, 160)},opacity:0},{y:0,opacity:1,duration:0.5,ease:"power3.out"},0.22);`);
  add(`tl.fromTo("#s7-ex",{x:${pick(220, 180)},opacity:0},{x:0,opacity:1,duration:0.45,ease:"power3.out"},0.34);`);
  add(`tl.fromTo("#s7-bp",{x:${pick(260, 200)},opacity:0},{x:0,opacity:1,duration:0.5,ease:"power3.out"},0.42);`);
  [0, 1, 2].forEach((i) => add(`tl.fromTo("#s7-r${i}",{x:30,opacity:0},{x:0,opacity:1,duration:0.35,ease:"power3.out"},${r3(0.62 + i * 0.1)});`));
  add(`tl.fromTo("#s7-va",{opacity:0},{opacity:1,duration:0.4},0.75);`);
  add(`tl.fromTo("#s7-bw",{scale:0.6,opacity:0},{scale:1,opacity:1,duration:0.5,ease:"back.out(1.8)"},${r3(L(T.solicite) - 0.12)});`);
  add(`tl.fromTo("#s7-bsw",{xPercent:-100},{xPercent:100,duration:0.9,ease:"power2.inOut"},${r3(L(T.solicite) + 0.2)});`);
  add(`tl.fromTo("#s7-ans",{opacity:0},{opacity:1,duration:0.5},1.0);`);
  add(`tl.fromTo("#s7-sw",{xPercent:-100},{xPercent:100,duration:1.1,ease:"power2.inOut"},0.5);`);
  // toque no botão
  const tp = L(TAP);
  add(`tl.fromTo("#s7-btn",{scale:1},{scale:0.94,duration:0.1,ease:"power2.in"},${tp});`);
  add(`tl.to("#s7-btn",{scale:1,duration:0.3,ease:"back.out(2)"},${r3(tp + 0.1)});`);
  add(`tl.fromTo("#s7-ring",{opacity:0.95,scale:1},{opacity:0,scale:1.25,duration:0.7,ease:"power2.out"},${r3(tp + 0.05)});`);
  add(`tl.fromTo("#s7-psw",{xPercent:-100},{xPercent:100,duration:0.8,ease:"power2.inOut"},${r3(L(T.empresa) - 0.3)});`);
  for (let t = tp + 1.0, i = 0; t + 1.0 <= dur - 1.2; t += 1.0, i++) {
    add(`tl.fromTo("#s7-btn",{scale:1},{scale:1.04,duration:0.5,ease:"sine.inOut",immediateRender:false},${r3(t)});`);
    add(`tl.to("#s7-btn",{scale:1,duration:0.5,ease:"sine.inOut"},${r3(t + 0.5)});`);
    add(`tl.fromTo("#s7-ring",{opacity:0.7,scale:1},{opacity:0,scale:1.2,duration:0.9,ease:"power2.out",immediateRender:false},${r3(t)});`);
    add(`tl.fromTo("#s7-arrow",{x:0},{x:8,duration:0.5,ease:"sine.inOut"${i ? ",immediateRender:false" : ""}},${r3(t)});`);
    add(`tl.to("#s7-arrow",{x:0,duration:0.5,ease:"sine.inOut"},${r3(t + 0.5)});`);
  }
  scenes.push({ st, track: 7, ...scene(p, dur, css, body, a) });
}

// ═════════════ dedo, clarões e grão ═════════════
{
  const p = "ui";
  const { a, add } = TL(0);
  const FS = pick(96, 82);
  const fx = BTN.x + BTN.w * 0.66;
  const fy = BTN.y + BTN.h * 0.56;
  const NOISE =
    "data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E";
  const css = `#ui-root{position:absolute;inset:0;width:${W}px;height:${H}px;overflow:hidden;pointer-events:none;}
#ui-f{position:absolute;left:${fx - FS / 2}px;top:${fy - FS / 2}px;width:${FS}px;height:${FS}px;border-radius:50%;background:radial-gradient(circle,rgba(255,255,255,.75) 0 34%,rgba(255,255,255,.32) 36% 100%);border:2px solid rgba(255,255,255,.95);box-shadow:0 0 0 1.5px rgba(14,10,85,.25),0 10px 26px rgba(5,4,40,.4);opacity:0;}
#ui-fl{position:absolute;inset:0;background:radial-gradient(70% 50% at 50% 45%,rgba(220,210,255,.9),rgba(120,90,255,.35) 60%,rgba(75,43,255,0));opacity:0;}
#ui-tex{position:absolute;left:-128px;top:-128px;width:${W + 256}px;height:${H + 256}px;background:url("${NOISE}") 0 0/256px 256px repeat;opacity:.045;mix-blend-mode:overlay;}`;
  const body = `<div id="ui-fl" aria-hidden="true"></div><div id="ui-tex" data-layout-allow-overflow aria-hidden="true"></div><div id="ui-f"></div>`;
  // clarões nas viradas (gancho → foto, preço, CTA)
  [
    [T.sabia - 0.32, 0.55],
    [T.mil - 0.02, 0.35],
    [T.toque - 0.16, 0.45],
  ].forEach(([t, o], i) => {
    add(`tl.fromTo("#ui-fl",{opacity:0},{opacity:${o},duration:0.08,ease:"power2.out"${i ? ",immediateRender:false" : ""}},${r3(t)});`);
    add(`tl.to("#ui-fl",{opacity:0,duration:0.45,ease:"power2.out"},${r3(t + 0.08)});`);
  });
  add(`tl.fromTo("#ui-f",{opacity:0,x:${pick(170, 130)},y:${pick(230, 170)},scale:1.15},{opacity:1,x:0,y:0,scale:1,duration:0.5,ease:"power3.out"},${r3(TAP - 0.55)});`);
  add(`tl.to("#ui-f",{scale:0.82,duration:0.1,ease:"power2.in"},${r3(TAP)});`);
  add(`tl.to("#ui-f",{scale:1,duration:0.18,ease:"power2.out"},${r3(TAP + 0.12)});`);
  add(`tl.to("#ui-f",{opacity:0,x:${pick(90, 70)},y:${pick(120, 90)},duration:0.4,ease:"power2.in"},${r3(TAP + 0.5)});`);
  // grão: posições sorteadas aqui (fixas), trocadas a cada 2 quadros
  let s = 77;
  const R = () => ((s = (s * 1103515245 + 12345) % 2147483648) / 2147483648);
  const pos = [];
  for (let t = 0; t < D; t += 2 / FPS) pos.push(Math.round((R() - 0.5) * 200), Math.round((R() - 0.5) * 200));
  add(`const P = [${pos.join(",")}];`);
  add(`for (let i = 0; i < P.length / 2; i++) tl.set("#ui-tex", { x: P[2 * i], y: P[2 * i + 1] }, Math.round((i * 2 / ${FPS}) * 1000) / 1000);`);
  scenes.push({ st: 0, track: 9, ...scene(p, D, css, body, a) });
}

// ═════════════ áudio ═════════════
// efeitos do ElevenLabs: o build alinha o golpe de cada arquivo (sfx_hits.json) ao instante pedido
const HITS = JSON.parse(readFileSync(join(ROOT, "assets/audio/sfx_hits.json"), "utf8"));
const SFX = [
  ["drone", 0.0, 0.5],
  ["shimmer", T.psiu, 0.18],
  ["impact", T.cnpj1, 0.6],
  ["whoosh", T.sabia - 0.3, 0.42],
  ["shimmer", T.sabia - 0.15, 0.32],
  ["card", T.plano - 0.25, 0.4],
  ["shimmer", T.amil, 0.32],
  ["tap", T.tres, 0.32],
  ["tap", T.tres + 0.13, 0.3],
  ["tap", T.tres + 0.26, 0.3],
  ["riser", T.mil - 0.02, 0.5],
  ["impact", T.mil, 0.72],
  ["counter", T.mil + 0.02, 0.3],
  ["shimmer", T.centavos, 0.28],
  ["whoosh", T.esse - 0.3, 0.42],
  ["card", T.dois - 0.12, 0.38],
  ["card", T.adultos - 0.12, 0.38],
  ["card", T.jovem - 0.12, 0.38],
  ["check", end("dezoito") - 0.05, 0.4],
  ["whoosh", T.olha - 0.32, 0.36],
  ["shimmer", T.olha, 0.28],
  ["card", T.acesso - 0.2, 0.4],
  ["pin", T.norte + 0.2, 0.5],
  ["check", T.dor2 + 0.05, 0.45],
  ["card", T.acomodacao - 0.2, 0.4],
  ["check", T.quarto + 0.15, 0.45],
  ["card", T.cobertura - 0.2, 0.4],
  ["check", T.nacional + 0.2, 0.45],
  ["whoosh", T.so - 0.3, 0.32],
  ["stamp", T.exclusivo, 0.85],
  ["impact", T.exclusivo + 0.02, 0.3],
  ["tap", T.valores - 0.05, 0.3],
  ["card", T.faixa - 0.25, 0.32],
  ["card", T.regiao - 0.35, 0.32],
  ["whoosh", T.entao - 0.25, 0.3],
  ["stamp", end("achismo") - 0.03, 0.45],
  ["riser", T.toque - 0.12, 0.45],
  ["impact", T.toque - 0.1, 0.55],
  ["shimmer", T.solicite, 0.32],
  ["tap", TAP, 0.75],
  ["check", TAP + 0.05, 0.32],
  ["shimmer", T.empresa - 0.3, 0.22],
];
const SFX_DUR = { counter: 2.3 };
function allocTracks(items, first) {
  const ends = [];
  return items.map((it) => {
    let k = ends.findIndex((e) => e <= it.at + 1e-6);
    if (k < 0) k = ends.push(0) - 1;
    ends[k] = it.at + it.dur;
    return first + k;
  });
}
const sfxItems = SFX.map(([name, t, vol]) => {
  const h = HITS[name];
  const at0 = r3(Math.max(0, t - h.hit));
  return { name, at: at0, vol, dur: r3(Math.min(SFX_DUR[name] ?? h.dur, h.dur, D - at0)) };
}).sort((x, y) => x.at - y.at);
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
  `<audio id="el-bgm" src="assets/audio/bgm.wav" data-start="0" data-duration="${D}" data-track-index="20" data-volume="0.55"></audio>`,
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
      html, body { width: ${W}px; height: ${H}px; overflow: hidden; background: ${NAVY}; }
      #root { position: relative; width: ${W}px; height: ${H}px; overflow: hidden; background: ${NAVY}; }
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
writeFileSync(join(ROOT, "tools", "timing.json"), JSON.stringify({ ...T, tap: TAP, end: D }, null, 1));
console.log(`${FMT} ${W}x${H}: ${D}s, ${scenes.length} composições, ${SFX.length} SFX`);
