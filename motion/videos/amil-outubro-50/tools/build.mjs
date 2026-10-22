#!/usr/bin/env node
// build.mjs — anúncio Amil "Só em outubro" (Plano Empresarial, 50% nas duas primeiras mensalidades,
// 3 vidas com coparticipação a partir de R$ 1.123,17), story 9:16 e feed 1:1.
//
//   node tools/build.mjs story   -> compositions/*.html + index.html
//   node tools/build.mjs feed    -> feed/compositions/*.html + feed/index.html
//
// Sete cenas + fundo + camada de toque/grão. Os tempos saem das palavras da locução
// (assets/voice/vo.words.json, transcrição Scribe da tomada escolhida). Visual tirado da peça de
// outubro: marinho com curvas índigo em cima, área branca embaixo, pílula índigo de 2 linhas, caixa
// lavanda do 50%, Montserrat pesada nos títulos e Poppins no texto. Âmbar só para a urgência.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const FMT = process.argv[2] === "feed" ? "feed" : "story";
const ST = FMT === "story";
const W = 1080;
const H = ST ? 1920 : 1080;
const FPS = 30;
const D = 32.5;
const r3 = (x) => Math.round(x * 1000) / 1000;
const pick = (s, f) => (ST ? s : f);

// paleta (da peça)
const NAVY = "#0A0850";
const INDIGO = "#3020F0";
const INK = "#0E0A55";
const LAV = "#ECEBFE";
const LILAC = "#B7A8FF";
const AMBER = "#FFC542";
const MUTED = "#3A3870";

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

const T = {};
T.atencao = at("atencao");
T.isso = at("isso");
T.vale = at("vale");
T.outubro1 = at("outubro");
T.plano1 = at("plano");
T.empresarial = at("empresarial");
T.amil = at("amil");
T.cinquenta1 = at("cinquenta");
T.desconto = at("desconto");
T.duas = at("duas");
T.primeiras = at("primeiras");
T.mensalidades = at("mensalidades");
T.plano2 = at("plano", T.mensalidades);
T.tres1 = at("tres", T.plano2);
T.vidas = at("vidas");
T.com2 = at("com", T.vidas);
T.copart = at("coparticipacao");
T.a = at("a", T.copart);
T.mil = at("mil");
T.cento = at("cento", T.mil);
T.vinte = at("vinte");
T.tres2 = at("tres", T.vinte);
T.dezessete = at("dezessete");
T.centavos = at("centavos");
T.esse = at("esse");
T.uma = at("uma", T.esse);
T.dezoito = at("dezoito");
T.um = at("um", T.dezoito);
T.trinta1 = at("trinta", T.um);
T.mais = at("mais");
T.trinta2 = at("trinta", T.mais);
T.exclusivo = at("exclusivo");
T.cnpj = at("cnpj");
T.mas = at("mas");
T.corre = at("corre");
T.promocao = at("promocao");
T.termina = at("termina");
T.d31 = at("31");
T.outubro2 = at("outubro", T.d31);
T.toque = at("toque");
T.solicite = at("solicite");
T.cotacao = at("cotacao");
T.personalizada = at("personalizada");
T.aproveite = at("aproveite");
T.cinquenta2 = at("cinquenta", T.aproveite);
T.mes = at("mes");
const TAP = r3(end("personalizada") + 0.1);

// ───────────── utilidades ─────────────
const FONTS = [
  ["Mont", 800, "normal", "Montserrat-800"],
  ["Mont", 900, "normal", "Montserrat-900"],
  ["Poppins", 400, "normal", "Poppins-normal-400"],
  ["Poppins", 500, "normal", "Poppins-normal-500"],
  ["Poppins", 600, "normal", "Poppins-normal-600"],
]
  .map(([f, w, s, file]) => `@font-face{font-family:"${f}";font-weight:${w};font-style:${s};font-display:block;src:url("assets/fonts/${file}.woff2") format("woff2");}`)
  .join("\n");

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
.d{font-family:"Mont",Arial,sans-serif;}
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
  const words = (p, times, dur = 0.42, from = 110) =>
    times.forEach((t, i) =>
      add(`tl.fromTo("#${p}${i}",{yPercent:${from},opacity:0},{yPercent:0,opacity:1,duration:${dur},ease:"power3.out"},${r3(Math.max(0, L(t) - 0.06))});`),
    );
  const drift = (sel, dur, to = 1.025) => add(`tl.fromTo("${sel}",{scale:1},{scale:${to},duration:${r3(dur)},ease:"none"},0);`);
  const shake = (sel, t, amp = 10) =>
    [1, -0.8, 0.5, -0.25, 0].forEach((k, i) => add(`tl.set("${sel}",{x:${r3(k * amp)},y:${r3(-k * amp * 0.6)}},${r3(t + i / FPS)});`));
  return { a, L, add, words, drift, shake };
}

const ICONS = {
  check: `<path d="M12 25l8 8 16-18"/>`,
  arrow: `<path d="M10 24h28M28 14l10 10-10 10"/>`,
  alert: `<path d="M24 7L43 40H5z"/><path d="M24 19v10M24 34v.5"/>`,
  clock: `<circle cx="24" cy="26" r="16"/><path d="M24 17v9l6 4M19 5h10M24 5v5"/>`,
};
const icon = (name, size, { id = "", sw = 3.4, color = "#fff", fill = "none" } = {}) =>
  `<svg ${id ? `id="${id}" ` : ""}viewBox="0 0 48 48" width="${size}" height="${size}" fill="${fill}" stroke="${color}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`;

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

// colunas de dígitos que rolam até o valor (formato X.XXX,XX); cada coluna tem a largura do dígito final
function rollPrice(p, fs, digits) {
  const LH = Math.round(fs * 1.0);
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
.pr-sp{display:inline-block;width:.22em;}`;
  return { html, css, LH, finals: digits.map((d) => 20 + d) };
}

const scenes = [];

// ═════════════ fundo: marinho com curvas índigo (como o topo da peça) ═════════════
{
  const p = "bg";
  const { a, add } = TL(0);
  const css =
    base(p) +
    `
#bg-base{background:radial-gradient(90% 60% at 50% 30%,#0A0640 0%,${NAVY} 45%,#160FA8 100%);}
.bg-c{position:absolute;border-radius:50%;}
#bg-c1{left:${pick(-700, -640)}px;top:${pick(-760, -720)}px;width:${pick(1300, 1150)}px;height:${pick(1300, 1150)}px;background:radial-gradient(closest-side,rgba(48,32,240,0) 78%,rgba(70,50,255,.85) 92%,rgba(70,50,255,0) 100%);}
#bg-c2{left:${pick(560, 640)}px;top:${pick(1180, 560)}px;width:${pick(1200, 1000)}px;height:${pick(1200, 1000)}px;background:radial-gradient(closest-side,rgba(48,32,240,0) 74%,rgba(80,60,255,.7) 90%,rgba(80,60,255,0) 100%);}
#bg-g{left:${pick(-200, -200)}px;top:${pick(700, 300)}px;width:${pick(1500, 1300)}px;height:${pick(1500, 1300)}px;background:radial-gradient(closest-side,rgba(60,40,255,.45),rgba(60,40,255,0));}
#bg-vig{background:radial-gradient(110% 75% at 50% 45%,rgba(0,0,0,0) 55%,rgba(3,2,24,.55) 100%);}
`;
  const body = `
  <div id="bg-base" class="${p}-full"></div>
  <div id="bg-g" class="bg-c" data-layout-allow-overflow aria-hidden="true"></div>
  <div id="bg-c1" class="bg-c" data-layout-allow-overflow aria-hidden="true"></div><div id="bg-c2" class="bg-c" data-layout-allow-overflow aria-hidden="true"></div>
  <div id="bg-vig" class="${p}-full"></div>`;
  add(`tl.fromTo("#bg-c1",{rotation:0,x:0},{rotation:25,x:${pick(80, 60)},duration:${D},ease:"none"},0);`);
  add(`tl.fromTo("#bg-c2",{rotation:0,y:0},{rotation:-20,y:${pick(-160, -90)},duration:${D},ease:"none"},0);`);
  add(`tl.fromTo("#bg-g",{x:0,y:0},{x:${pick(160, 120)},y:${pick(-260, -140)},duration:8.125,ease:"sine.inOut",repeat:3,yoyo:true},0);`);
  scenes.push({ st: 0, track: 0, ...scene(p, D, css, body, a) });
}

// ═════════════ 1 · gancho: "Atenção: isso aqui só vale em outubro!" ═════════════
{
  const p = "s1";
  const st = 0;
  const dur = T.plano1 - 0.3;
  const { a, L, add, words, shake } = TL(st);
  const g = pick(
    { py: 430, ph: 92, ps: 46, wy: 580, ws: 70, cx: 200, cy: 740, cw: 680, ch: 560, hh: 150, os: 132, ys: 52 },
    { py: 70, ph: 80, ps: 40, wy: 190, ws: 58, cx: 270, cy: 300, cw: 540, ch: 440, hh: 116, os: 104, ys: 42 },
  );
  const css =
    base(p) +
    `
#s1-pw{position:absolute;left:0;width:${W}px;top:${g.py}px;text-align:center;}
#s1-pill{display:inline-flex;align-items:center;gap:16px;height:${g.ph}px;padding:0 ${Math.round(g.ph * 0.5)}px;border-radius:${g.ph}px;background:${AMBER};color:${INK};font-weight:900;font-size:${g.ps}px;letter-spacing:.08em;box-shadow:0 0 50px rgba(255,197,66,.55);}
#s1-w{position:absolute;left:0;width:${W}px;top:${g.wy}px;text-align:center;font-weight:800;font-size:${g.ws}px;line-height:1;letter-spacing:-.02em;}
#s1-cal{position:absolute;left:${g.cx}px;top:${g.cy}px;width:${g.cw}px;height:${g.ch}px;}
#s1-pg{position:absolute;inset:0;border-radius:36px;background:#fff;overflow:hidden;box-shadow:0 50px 100px rgba(3,2,30,.55);}
#s1-hd{position:absolute;left:0;top:0;width:100%;height:${g.hh}px;background:${INDIGO};}
.s1-rg{position:absolute;top:-${Math.round(g.hh * 0.22)}px;width:${Math.round(g.hh * 0.2)}px;height:${Math.round(g.hh * 0.5)}px;border-radius:20px;background:#D9D6FF;box-shadow:inset 0 -6px 0 rgba(0,0,0,.15);}
#s1-ou{position:absolute;left:0;width:100%;top:${Math.round(g.hh + (g.ch - g.hh) / 2 - g.os * 0.72)}px;text-align:center;font-weight:900;font-size:${g.os}px;line-height:1;color:${INK};letter-spacing:-.03em;}
#s1-yr{position:absolute;left:0;width:100%;top:${Math.round(g.hh / 2 - g.ys / 2)}px;text-align:center;font-weight:800;font-size:${g.ys}px;line-height:1;letter-spacing:.2em;}
#s1-so{position:absolute;left:0;width:100%;top:${Math.round(g.hh + (g.ch - g.hh) / 2 + g.os * 0.42)}px;text-align:center;font-weight:900;font-size:${Math.round(g.os * 0.36)}px;color:${INDIGO};letter-spacing:.14em;}
`;
  const body = `
  <div id="s1-wrap" class="${p}-full">
    <div id="s1-pw"><span id="s1-pill" class="d">${icon("alert", Math.round(g.ps * 1.05), { color: INK, sw: 4 })}ATENÇÃO</span></div>
    <div id="s1-w" class="d">${wspans("s1w", "isso aqui só vale em")}</div>
    <div id="s1-cal"><div id="s1-pg">
      <div id="s1-hd"><div id="s1-yr" class="d">2026</div></div>
      <div id="s1-ou" class="d">OUTUBRO</div><div id="s1-so" class="d">SÓ ESTE MÊS</div>
    </div>
    <div class="s1-rg" style="left:${Math.round(g.cw * 0.22)}px"></div><div class="s1-rg" style="left:${Math.round(g.cw * 0.74)}px"></div></div>
  </div>`;
  add(`tl.fromTo("#s1-pill",{scale:0.4,opacity:0},{scale:1,opacity:1,duration:0.35,ease:"back.out(2.4)"},${r3(L(T.atencao))});`);
  add(`tl.fromTo("#s1-pill",{scale:1},{scale:1.08,duration:0.12,ease:"power2.out",immediateRender:false},${r3(L(T.atencao) + 0.4)});`);
  add(`tl.to("#s1-pill",{scale:1,duration:0.25,ease:"power2.inOut"},${r3(L(T.atencao) + 0.52)});`);
  words("s1w", [T.isso, at("aqui"), at("so"), T.vale, at("em", T.vale)], 0.34);
  // a folha de outubro cai virando
  const tc = L(T.outubro1);
  add(`tl.fromTo("#s1-cal",{rotationX:-95,opacity:0,y:-60},{rotationX:0,opacity:1,y:0,duration:0.42,ease:"back.out(1.4)",transformPerspective:1200,transformOrigin:"50% 0%"},${r3(tc - 0.18)});`);
  add(`tl.fromTo("#s1-ou",{scale:1.25,opacity:0},{scale:1,opacity:1,duration:0.3,ease:"power4.out"},${r3(tc + 0.05)});`);
  add(`tl.fromTo("#s1-so",{opacity:0,y:20},{opacity:1,y:0,duration:0.3,ease:"power3.out"},${r3(tc + 0.25)});`);
  shake("#s1-wrap", r3(tc + 0.15), pick(12, 9));
  add(`tl.to("#s1-wrap",{scale:1.35,opacity:0,duration:0.3,ease:"power3.in"},${r3(dur - 0.3)});`);
  scenes.push({ st, track: 1, ...scene(p, dur, css, body, a) });
}

// ═════════════ 2 · "Plano Empresarial Amil com 50% de desconto nas duas primeiras mensalidades" ═════════════
{
  const p = "s2";
  const st = T.plano1 - 0.4;
  const dur = T.plano2 - 0.22 - st;
  const { a, L, add, words, drift, shake } = TL(st);
  const g = pick(
    { ly: 330, lw: 250, lh: 80, ty: 440, ts: 96, py: 580, ps: 330, dy: 940, ds: 66, cy: 1070, cw: 450, ch: 330, cs: 130 },
    { ly: 34, lw: 180, lh: 58, ty: 110, ts: 72, py: 190, ps: 250, dy: 470, ds: 52, cy: 570, cw: 430, ch: 260, cs: 100 },
  );
  const css =
    base(p) +
    `
#s2-lw{position:absolute;left:0;width:${W}px;top:${g.ly}px;text-align:center;}
#s2-logo{width:${g.lw}px;height:${g.lh}px;background:#fff;}
#s2-t{position:absolute;left:0;width:${W}px;top:${g.ty}px;text-align:center;font-weight:800;font-size:${g.ts}px;line-height:1;letter-spacing:-.02em;}
#s2-pw{position:absolute;left:0;width:${W}px;top:${g.py}px;text-align:center;}
#s2-pct{display:inline-block;font-weight:900;font-size:${g.ps}px;line-height:1;letter-spacing:-.05em;text-shadow:0 0 60px rgba(90,70,255,.9);}
#s2-pct sup{font-size:.5em;vertical-align:.7em;letter-spacing:0;}
#s2-burst{position:absolute;left:${W / 2 - 400}px;top:${g.py + g.ps / 2 - 400}px;width:800px;height:800px;opacity:0;}
#s2-d{position:absolute;left:0;width:${W}px;top:${g.dy}px;text-align:center;font-weight:900;font-size:${g.ds}px;line-height:1;letter-spacing:.02em;color:${AMBER};}
.s2-c{position:absolute;top:${g.cy}px;width:${g.cw}px;height:${g.ch}px;border-radius:32px;background:#fff;color:${INK};box-shadow:0 30px 70px rgba(3,2,30,.45);}
.s2-n{position:absolute;left:36px;top:${Math.round(g.ch * 0.16)}px;font-weight:900;font-size:${g.cs}px;line-height:1;color:${INDIGO};}
.s2-l{position:absolute;left:38px;top:${Math.round(g.ch * 0.16 + g.cs * 1.02)}px;font-weight:600;font-size:${Math.round(g.cs * 0.22)}px;color:${MUTED};letter-spacing:.06em;}
.s2-st{position:absolute;right:${Math.round(g.cw * 0.05)}px;top:${Math.round(g.ch * 0.14)}px;width:${Math.round(g.cw * 0.34)}px;height:${Math.round(g.cw * 0.34)}px;}
.s2-sti{position:absolute;inset:0;border-radius:50%;background:${INDIGO};border:6px dashed rgba(255,255,255,.6);display:flex;flex-direction:column;align-items:center;justify-content:center;color:#fff;transform:rotate(-12deg);box-shadow:0 14px 30px rgba(48,32,240,.45);}
.s2-sti b{font-family:"Mont",Arial,sans-serif;font-weight:900;font-size:${Math.round(g.cw * 0.1)}px;line-height:1;letter-spacing:-.03em;}
.s2-sti span{font-family:"Mont",Arial,sans-serif;font-weight:900;font-size:${Math.round(g.cw * 0.042)}px;letter-spacing:.14em;}
`;
  const rays = Array.from({ length: 16 }, (_, i) => {
    const an = (i / 16) * Math.PI * 2;
    const x1 = 400 + Math.cos(an) * 230;
    const y1 = 400 + Math.sin(an) * 230;
    const x2 = 400 + Math.cos(an) * 380;
    const y2 = 400 + Math.sin(an) * 380;
    return `<path d="M${r3(x1)} ${r3(y1)} L${r3(x2)} ${r3(y2)}"/>`;
  }).join("");
  const cards = [0, 1]
    .map(
      (i) => `<div class="s2-c" id="s2-c${i}" style="left:${i ? W - 70 - g.cw : 70}px"><div class="s2-n d">${i + 1}ª</div><div class="s2-l">MENSALIDADE</div>
      <div class="s2-st" id="s2-st${i}"><div class="s2-sti"><b>−50%</b><span>OFF</span></div></div></div>`,
    )
    .join("");
  const body = `
  <div id="s2-cam" class="${p}-full">
  <div id="s2-wrap" class="${p}-full">
    <div id="s2-lw"><span id="s2-logo" class="logo" role="img" aria-label="Amil"></span></div>
    <div id="s2-t" class="d">${wspans("s2t", "Plano Empresarial")}</div>
    <svg id="s2-burst" viewBox="0 0 800 800" aria-hidden="true" data-layout-allow-overflow><g stroke="${LILAC}" stroke-width="8" stroke-linecap="round">${rays}</g></svg>
    <div id="s2-pw"><span id="s2-pct" class="d"><span id="s2-num">0</span><sup>%</sup></span></div>
    <div id="s2-d" class="d">${wspans("s2d", "DE DESCONTO")}</div>
    ${cards}
  </div>
  </div>`;
  drift("#s2-cam", dur, 1.02);
  add(`tl.fromTo("#s2-wrap",{scale:0.8,opacity:0},{scale:1,opacity:1,duration:0.4,ease:"power3.out"},0);`);
  words("s2t", [T.plano1, T.empresarial], 0.4);
  add(`tl.fromTo("#s2-logo",{opacity:0,y:-20},{opacity:1,y:0,duration:0.45,ease:"power3.out"},${r3(L(T.amil) - 0.1)});`);
  // 50% conta e explode no "cinquenta"
  const t0 = L(T.cinquenta1);
  add(`tl.fromTo("#s2-pct",{scale:1.6,opacity:0},{scale:1,opacity:1,duration:0.3,ease:"power4.out"},${r3(t0 - 0.06)});`);
  for (let s = 0; s <= 15; s++) add(`tl.set("#s2-num",{textContent:"${Math.round(50 * (1 - Math.pow(1 - s / 15, 3)))}"},${r3(t0 + (s / 15) * 0.55)});`);
  add(`tl.fromTo("#s2-burst",{scale:0.5,opacity:1,rotation:0},{scale:1.25,opacity:0,rotation:20,duration:0.8,ease:"power2.out",immediateRender:false},${r3(t0 + 0.02)});`);
  shake("#s2-wrap", r3(t0 + 0.05), pick(14, 10));
  words("s2d", [at("de", T.cinquenta1), T.desconto], 0.36);
  // as duas mensalidades com o carimbo
  [T.duas, T.primeiras].forEach((t, i) =>
    add(`tl.fromTo("#s2-c${i}",{y:${pick(200, 150)},opacity:0,rotation:${i ? 6 : -6}},{y:0,opacity:1,rotation:${i ? 2 : -2},duration:0.5,ease:"power3.out"},${r3(L(t) - 0.15)});`),
  );
  [0, 1].forEach((i) =>
    add(`tl.fromTo("#s2-st${i}",{scale:2.2,opacity:0},{scale:1,opacity:1,duration:0.18,ease:"power4.in"},${r3(L(T.mensalidades) + i * 0.22)});`),
  );
  add(`tl.to("#s2-wrap",{x:-${pick(320, 280)},opacity:0,duration:0.24,ease:"power3.in"},${r3(dur - 0.24)});`);
  scenes.push({ st, track: 2, ...scene(p, dur, css, body, a) });
}

// ═════════════ 3 · "Plano para três vidas, com coparticipação, a partir de R$ 1.123,17" ═════════════
{
  const p = "s3";
  const st = T.plano2 - 0.3;
  const dur = T.esse - 0.2 - st;
  const { a, L, add, words, drift, shake } = TL(st);
  const g = pick(
    { px: 80, py: 480, pw: 920, ph: 220, ps: 72, ay: 790, as: 48, ry: 870, rs: 200, cy: 1160, ch: 96, cs: 40 },
    { px: 100, py: 90, pw: 880, ph: 180, ps: 60, ay: 330, as: 40, ry: 395, rs: 188, cy: 650, ch: 84, cs: 34 },
  );
  const R = rollPrice(p, g.rs, [1, 1, 2, 3, 1, 7]);
  const css =
    base(p) +
    R.css +
    `
#s3-pill{position:absolute;left:${g.px}px;top:${g.py}px;width:${g.pw}px;height:${g.ph}px;border-radius:40px;background:${INDIGO};box-shadow:0 30px 70px rgba(48,32,240,.5);display:flex;flex-direction:column;align-items:center;justify-content:center;font-weight:800;font-size:${g.ps}px;line-height:1.12;letter-spacing:-.01em;}
#s3-a{position:absolute;left:0;width:${W}px;top:${g.ay}px;text-align:center;font-weight:800;font-size:${g.as}px;letter-spacing:.14em;line-height:1;}
#s3-rw{position:absolute;left:0;width:${W}px;top:${g.ry - 10}px;height:${g.rs + 20}px;text-align:center;overflow:hidden;}
#s3-pr{display:inline-block;margin-top:10px;font-weight:900;font-size:${g.rs}px;letter-spacing:-.045em;white-space:nowrap;text-shadow:0 0 50px rgba(90,70,255,.8);}
#s3-cw{position:absolute;left:0;width:${W}px;top:${g.cy}px;text-align:center;}
#s3-chip{display:inline-flex;align-items:center;gap:14px;height:${g.ch}px;padding:0 ${Math.round(g.ch * 0.5)}px;border-radius:${g.ch}px;background:${AMBER};color:${INK};font-weight:600;font-size:${g.cs}px;box-shadow:0 0 40px rgba(255,197,66,.4);}
#s3-chip b{font-family:"Mont",Arial,sans-serif;font-weight:900;}
`;
  const body = `
  <div id="s3-cam" class="${p}-full">
  <div id="s3-wrap" class="${p}-full">
    <div id="s3-pill" class="d"><span>${wspans("s3p", "Plano para 3 Vidas")}</span><span>${wspans("s3q", "com coparticipação")}</span></div>
    <div id="s3-a" class="d">${wspans("s3a", "A PARTIR DE")}</div>
    <div id="s3-rw"><span id="s3-pr" class="d">${R.html}</span><div id="s3-psw" class="sweep" aria-hidden="true"></div></div>
    <div id="s3-cw"><span id="s3-chip"><b>50% OFF</b> nas 2 primeiras mensalidades</span></div>
  </div>
  </div>`;
  drift("#s3-cam", dur, 1.02);
  add(`tl.fromTo("#s3-wrap",{x:${pick(320, 280)},opacity:0},{x:0,opacity:1,duration:0.4,ease:"power3.out"},0);`);
  add(`tl.fromTo("#s3-pill",{scaleX:0.3,opacity:0},{scaleX:1,opacity:1,duration:0.45,ease:"power3.out"},${r3(L(T.plano2) - 0.2)});`);
  words("s3p", [T.plano2, at("para", T.plano2), T.tres1, T.vidas], 0.36);
  words("s3q", [T.com2, T.copart], 0.4);
  words("s3a", [T.a, at("partir"), at("de", at("partir"))], 0.34);
  // preço: cada dígito rola até o valor no instante em que é dito
  const t0 = r3(L(T.mil) - 0.08);
  add(`tl.fromTo("#s3-pr",{opacity:0},{opacity:1,duration:0.08},${t0});`);
  add(`tl.fromTo("#s3-rs",{scale:1.4,opacity:0},{scale:1,opacity:1,duration:0.3,ease:"power4.out"},${t0});`);
  const lands = [T.mil + 0.14, T.cento + 0.12, T.vinte + 0.14, T.tres2 + 0.1, T.dezessete + 0.12, T.dezessete + 0.4];
  lands.forEach((tl_, i) => add(`tl.fromTo("#s3-ds${i}",{y:0},{y:${-R.finals[i] * R.LH},duration:${r3(L(tl_) - t0)},ease:"power3.out"},${t0});`));
  shake("#s3-wrap", r3(L(T.mil)), pick(9, 7));
  add(`tl.fromTo("#s3-psw",{xPercent:-100},{xPercent:100,duration:0.8,ease:"power2.inOut"},${r3(L(T.centavos) - 0.05)});`);
  add(`tl.fromTo("#s3-chip",{y:40,opacity:0},{y:0,opacity:1,duration:0.4,ease:"back.out(1.8)"},${r3(L(T.centavos) + 0.05)});`);
  add(`tl.to("#s3-wrap",{y:-${pick(90, 60)},opacity:0,scale:0.96,duration:0.24,ease:"power2.in"},${r3(dur - 0.24)});`);
  scenes.push({ st, track: 3, ...scene(p, dur, css, body, a) });
}

// ═════════════ 4 · "uma vida de 18 anos, um adulto de 33 e mais um de até 38" ═════════════
{
  const p = "s4";
  const st = T.esse - 0.3;
  const dur = T.exclusivo - 0.2 - st;
  const { a, L, add, words, drift } = TL(st);
  const g = pick(
    { hy: 440, hs: 70, chy: 540, chh: 92, chs: 52, cy: 720, ch: 600, cw: 300, xs: [60, 390, 720], av: 200, avy: 40, lb: 268, lbs: 40, ate: 330, ates: 32, num: 362, nums: 150, an: 518, ans: 30 },
    { hy: 60, hs: 58, chy: 142, chh: 76, chs: 44, cy: 280, ch: 520, cw: 300, xs: [60, 390, 720], av: 160, avy: 30, lb: 206, lbs: 34, ate: 256, ates: 28, num: 286, nums: 130, an: 424, ans: 26 },
  );
  const ages = [18, 33, 38];
  const labels = ["VIDA", "ADULTO", "ADULTO"];
  const pre = ["de", "de", "até"];
  const css =
    base(p) +
    `
#s4-h{position:absolute;left:0;width:${W}px;top:${g.hy}px;text-align:center;font-weight:800;font-size:${g.hs}px;line-height:1;letter-spacing:-.02em;}
#s4-chw{position:absolute;left:0;width:${W}px;top:${g.chy}px;text-align:center;}
#s4-chip{display:inline-flex;align-items:center;height:${g.chh}px;padding:0 ${Math.round(g.chh * 0.5)}px;border-radius:${g.chh}px;background:${INDIGO};font-weight:900;font-size:${g.chs}px;box-shadow:0 14px 36px rgba(48,32,240,.45);}
.s4-c{position:absolute;top:${g.cy}px;width:${g.cw}px;height:${g.ch}px;border-radius:34px;background:linear-gradient(180deg,rgba(255,255,255,.14),rgba(255,255,255,.05));border:2px solid rgba(255,255,255,.18);box-shadow:0 30px 60px rgba(3,2,30,.35);}
.s4-av{position:absolute;left:${(g.cw - g.av) / 2}px;top:${g.avy}px;}
.s4-lb{position:absolute;left:0;width:100%;top:${g.lb}px;text-align:center;font-weight:900;font-size:${g.lbs}px;letter-spacing:.12em;color:${LILAC};}
.s4-ate{position:absolute;left:0;width:100%;top:${g.ate}px;text-align:center;font-size:${g.ates}px;color:rgba(255,255,255,.88);}
.s4-num{position:absolute;left:0;width:100%;top:${g.num}px;text-align:center;font-weight:900;font-size:${g.nums}px;line-height:1;letter-spacing:-.04em;}
.s4-an{position:absolute;left:0;width:100%;top:${g.an}px;text-align:center;font-size:${g.ans}px;color:rgba(255,255,255,.88);}
`;
  const cards = [0, 1, 2]
    .map(
      (i) => `<div class="s4-c" id="s4-c${i}" style="left:${g.xs[i]}px">
      <div class="s4-av">${person(g.av, { young: i === 0, grad: `s4g${i}` })}</div>
      <div class="s4-lb d">${labels[i]}</div><div class="s4-ate">${pre[i]}</div>
      <div class="s4-num d"><span id="s4-n${i}">0</span></div><div class="s4-an">anos</div></div>`,
    )
    .join("");
  const body = `
  <div id="s4-cam" class="${p}-full">
  <div id="s4-wrap" class="${p}-full">
    <div id="s4-h" class="d">${wspans("s4h", "Esse valor é para")}</div>
    <div id="s4-chw"><span id="s4-chip" class="d">3 vidas · R$ 1.123,17</span></div>
    ${cards}
  </div>
  </div>`;
  drift("#s4-cam", dur, 1.02);
  add(`tl.fromTo("#s4-wrap",{y:${pick(90, 60)},opacity:0},{y:0,opacity:1,duration:0.35,ease:"power3.out"},0);`);
  words("s4h", [T.esse, at("valor"), at("e", T.esse), at("pra")], 0.36);
  add(`tl.fromTo("#s4-chip",{scale:0.5,opacity:0},{scale:1,opacity:1,duration:0.45,ease:"back.out(2)"},${r3(L(at("valor")) + 0.1)});`);
  [T.uma, T.um, T.mais].forEach((t, i) =>
    add(`tl.fromTo("#s4-c${i}",{y:${pick(140, 100)},opacity:0,rotationY:-35},{y:0,opacity:1,rotationY:0,duration:0.55,ease:"power3.out",transformPerspective:900},${r3(L(t) - 0.12)});`),
  );
  // idades: aparecem quando começam a ser ditas e contam até o valor
  [T.dezoito, T.trinta1, T.trinta2].forEach((t, i) => {
    add(`tl.fromTo("#s4-n${i}",{opacity:0},{opacity:1,duration:0.08},${r3(L(t))});`);
    for (let s = 0; s <= 12; s++) add(`tl.set("#s4-n${i}",{textContent:"${Math.round(ages[i] * (1 - Math.pow(1 - s / 12, 3)))}"},${r3(L(t) + (s / 12) * 0.5)});`);
    add(`tl.fromTo("#s4-c${i}",{scale:1},{scale:1.05,duration:0.2,ease:"power2.out",immediateRender:false},${r3(L(t) + 0.45)});`);
    add(`tl.to("#s4-c${i}",{scale:1,duration:0.35,ease:"power2.inOut"},${r3(L(t) + 0.65)});`);
  });
  add(`tl.to("#s4-wrap",{opacity:0,scale:0.95,duration:0.22,ease:"power2.in"},${r3(dur - 0.22)});`);
  scenes.push({ st, track: 4, ...scene(p, dur, css, body, a) });
}

// ═════════════ 5 · "Exclusivo para CNPJ." ═════════════
{
  const p = "s5";
  const st = T.exclusivo - 0.25;
  const dur = T.mas - 0.12 - st;
  const { a, L, add, shake } = TL(st);
  const g = pick({ sx: 90, sy: 700, sw: 900, sh: 460, s1: 80, s1y: 74, s2: 270, s2y: 160 }, { sx: 140, sy: 300, sw: 800, sh: 400, s1: 68, s1y: 62, s2: 236, s2y: 140 });
  const css =
    base(p) +
    `
#s5-sw{position:absolute;left:${g.sx}px;top:${g.sy}px;width:${g.sw}px;height:${g.sh}px;}
#s5-st{position:absolute;inset:0;border-radius:44px;background:${INDIGO};box-shadow:0 40px 90px rgba(40,20,200,.5);transform:rotate(-4deg);}
#s5-st::after{content:"";position:absolute;inset:22px;border-radius:28px;border:5px dashed rgba(255,255,255,.55);}
#s5-s1{position:absolute;left:0;width:100%;top:${g.s1y}px;text-align:center;font-weight:800;font-size:${g.s1}px;line-height:1;letter-spacing:.04em;}
#s5-s2{position:absolute;left:0;width:100%;top:${g.s2y}px;text-align:center;font-weight:900;font-size:${g.s2}px;line-height:1;letter-spacing:-.03em;}
#s5-ring{position:absolute;left:${g.sx - 60}px;top:${g.sy - 60}px;width:${g.sw + 120}px;height:${g.sh + 120}px;border-radius:70px;border:6px solid rgba(183,168,255,.8);opacity:0;}
`;
  const body = `
  <div id="s5-wrap" class="${p}-full">
    <div id="s5-ring" aria-hidden="true" data-layout-allow-overflow></div>
    <div id="s5-sw"><div id="s5-st"><div id="s5-s1" class="d">EXCLUSIVO PARA</div><div id="s5-s2" class="d">CNPJ</div></div></div>
  </div>`;
  const ts = L(T.exclusivo);
  add(`tl.fromTo("#s5-sw",{scale:2,opacity:0},{scale:1,opacity:1,duration:0.2,ease:"power4.in"},${r3(ts - 0.14)});`);
  add(`tl.fromTo("#s5-ring",{scale:0.85,opacity:0.9},{scale:1.15,opacity:0,duration:0.7,ease:"power2.out",immediateRender:false},${r3(ts + 0.06)});`);
  shake("#s5-wrap", r3(ts + 0.06), pick(14, 11));
  add(`tl.fromTo("#s5-s2",{scale:1},{scale:1.08,duration:0.18,ease:"power2.out"},${r3(L(T.cnpj))});`);
  add(`tl.to("#s5-s2",{scale:1,duration:0.35,ease:"power2.inOut"},${r3(L(T.cnpj) + 0.18)});`);
  add(`tl.to("#s5-wrap",{scale:0.9,opacity:0,duration:0.2,ease:"power2.in"},${r3(dur - 0.2)});`);
  scenes.push({ st, track: 5, ...scene(p, dur, css, body, a) });
}

// ═════════════ 6 · "Mas corre, porque a promoção termina em 31 de outubro." ═════════════
{
  const p = "s6";
  const st = T.mas - 0.2;
  const dur = T.toque - 0.1 - st;
  const { a, L, add, words, shake } = TL(st);
  const g = pick(
    { ty: 340, ts: 120, cx: 60, cy: 520, cw: 960, ch: 820, hh: 124, hs: 58, wy: 150, ws: 28, gy: 200, rh: 118, ns: 50, by: 1440, bs: 44 },
    { ty: 30, ts: 84, cx: 190, cy: 140, cw: 700, ch: 680, hh: 96, hs: 46, wy: 112, ws: 22, gy: 150, rh: 100, ns: 40, by: 920, bs: 36 },
  );
  const pad = 28;
  const cwid = (g.cw - pad * 2) / 7;
  const first = 4; // 1/10/2026 é quinta-feira (domingo = 0)
  const cells = [];
  for (let d = 1; d <= 31; d++) {
    const k = first + d - 1;
    const c = k % 7;
    const r = Math.floor(k / 7);
    cells.push({ d, x: r3(pad + c * cwid), y: g.gy + r * g.rh });
  }
  const cs = Math.round(Math.min(cwid, g.rh) * 0.8);
  const css =
    base(p) +
    `
#s6-t{position:absolute;left:0;width:${W}px;top:${g.ty}px;text-align:center;font-weight:900;font-size:${g.ts}px;line-height:1;letter-spacing:-.03em;color:${AMBER};}
#s6-cal{position:absolute;left:${g.cx}px;top:${g.cy}px;width:${g.cw}px;height:${g.ch}px;border-radius:36px;background:#fff;color:${INK};overflow:hidden;box-shadow:0 40px 90px rgba(3,2,30,.5);}
#s6-hd{position:absolute;left:0;top:0;width:100%;height:${g.hh}px;background:${INDIGO};color:#fff;display:flex;align-items:center;justify-content:center;gap:18px;font-weight:900;font-size:${g.hs}px;letter-spacing:.04em;}
.s6-wd{position:absolute;top:${g.wy}px;width:${r3(cwid)}px;text-align:center;font-weight:600;font-size:${g.ws}px;color:${MUTED};}
.s6-d{position:absolute;width:${r3(cwid)}px;height:${g.rh}px;display:flex;align-items:center;justify-content:center;}
.s6-dc{position:absolute;left:${r3((cwid - cs) / 2)}px;top:${Math.round((g.rh - cs) / 2)}px;width:${cs}px;height:${cs}px;border-radius:50%;background:${LAV};opacity:0;}
.s6-dn{position:relative;font-family:"Mont",Arial,sans-serif;font-weight:800;font-size:${g.ns}px;letter-spacing:-.02em;}
#s6-c31 .s6-dc{background:${AMBER};}
#s6-ring{position:absolute;left:${r3(cells[30].x + cwid / 2 - cs)}px;top:${Math.round(cells[30].y + g.rh / 2 - cs)}px;width:${cs * 2}px;height:${cs * 2}px;border-radius:50%;border:6px solid ${AMBER};opacity:0;}
#s6-tag{position:absolute;left:${r3(g.cx + Math.min(cells[30].x + cwid / 2 - g.ns * 2.6, g.cw - g.ns * 5.4))}px;top:${g.cy + g.ch + 16}px;padding:10px 22px;border-radius:14px;background:${INK};color:#fff;font-family:"Mont",Arial,sans-serif;font-weight:900;font-size:${Math.round(g.ns * 0.62)}px;letter-spacing:.08em;white-space:nowrap;}
#s6-b{position:absolute;left:0;width:${W}px;top:${g.by}px;text-align:center;font-weight:600;font-size:${g.bs}px;line-height:1.2;}
#s6-b b{color:${AMBER};font-weight:600;}
`;
  const wd = ["D", "S", "T", "Q", "Q", "S", "S"].map((l, i) => `<div class="s6-wd" style="left:${r3(pad + i * cwid)}px">${l}</div>`).join("");
  const days = cells
    .map((c) => `<div class="s6-d" id="s6-c${c.d}" style="left:${c.x}px;top:${c.y}px"><span class="s6-dc"></span><span class="s6-dn">${c.d}</span></div>`)
    .join("");
  const body = `
  <div id="s6-wrap" class="${p}-full">
    <div id="s6-t" class="d">${wspans("s6t", "Mas corre!")}</div>
    <div id="s6-cal"><div id="s6-hd" class="d">${icon("clock", Math.round(g.hs * 1.05), { color: "#fff", sw: 3.6 })}OUTUBRO 2026</div>${wd}${days}
      <div id="s6-ring" aria-hidden="true"></div></div><div id="s6-tag">ÚLTIMO DIA ▲</div>
    <div id="s6-b">${wspans("s6b", "A promoção termina em <b>31/10</b>")}</div>
  </div>`;
  words("s6t", [T.mas, T.corre], 0.3);
  shake("#s6-wrap", r3(L(T.corre) + 0.05), pick(10, 8));
  add(`tl.fromTo("#s6-cal",{y:${pick(160, 120)},opacity:0},{y:0,opacity:1,duration:0.45,ease:"power3.out"},${r3(L(at("porque")) - 0.25)});`);
  // os dias vão passando até o 30; o 31 acende no "31"
  const t1 = L(T.promocao) - 0.05;
  const t2 = L(T.d31) - 0.12;
  for (let d = 1; d <= 30; d++) {
    const t = r3(t1 + ((t2 - t1) * (d - 1)) / 29);
    add(`tl.to("#s6-c${d} .s6-dc",{opacity:1,duration:0.08},${t});`);
    add(`tl.to("#s6-c${d} .s6-dn",{opacity:0.35,duration:0.08},${t});`);
  }
  const t31 = L(T.d31);
  add(`tl.fromTo("#s6-c31 .s6-dc",{scale:0.3,opacity:0},{scale:1,opacity:1,duration:0.3,ease:"back.out(2.4)"},${r3(t31 - 0.04)});`);
  add(`tl.fromTo("#s6-c31",{scale:1},{scale:1.25,duration:0.2,ease:"power2.out"},${r3(t31)});`);
  add(`tl.to("#s6-c31",{scale:1.1,duration:0.3,ease:"power2.inOut"},${r3(t31 + 0.2)});`);
  add(`tl.fromTo("#s6-ring",{scale:0.5,opacity:1},{scale:1.4,opacity:0,duration:0.7,ease:"power2.out",immediateRender:false},${r3(t31 + 0.02)});`);
  add(`tl.fromTo("#s6-tag",{y:20,opacity:0,scale:0.6},{y:0,opacity:1,scale:1,duration:0.35,ease:"back.out(2)"},${r3(t31 + 0.12)});`);
  words("s6b", [T.promocao - 0.1, T.promocao, T.termina, at("em", T.termina), T.d31], 0.34);
  add(`tl.to("#s6-wrap",{y:-${pick(140, 90)},opacity:0,duration:0.24,ease:"power3.in"},${r3(dur - 0.24)});`);
  scenes.push({ st, track: 6, ...scene(p, dur, css, body, a) });
}

// ═════════════ 7 · CTA: a peça de outubro se monta ═════════════
const BTN = pick({ x: 50, y: 1345, w: 980, h: 120 }, { x: 60, y: 846, w: 960, h: 100 });
{
  const p = "s7";
  const st = T.toque - 0.2;
  const dur = D - st;
  const { a, L, add, drift } = TL(st);
  const g = pick(
    {
      wy: 735, ly: 240, lw: 230, lh: 72, ty: 325, ts: 84, ay: 425, as: 36, py: 466, ps: 166,
      pill: { x: 90, y: 660, w: 900, h: 150, fs: 56 },
      box: { x: 50, y: 840, w: 980, h: 240, ns: 136, ds: 36, dx: 375, rs: 44, rp: 34 },
      stk: { x: 870, y: 790, s: 170 },
      ex: { y: 1100, h: 80, fs: 46 }, l1: 1196, vt: { y: 1206, fs: 27 }, l2: 1286, dc: { y: 1296, fs: 22 }, bt: 44, ans: { y: 1486, fs: 19 },
    },
    {
      wy: 395, ly: 28, lw: 180, lh: 56, ty: 92, ts: 66, ay: 170, as: 28, py: 204, ps: 128,
      pill: { x: 120, y: 345, w: 840, h: 100, fs: 40 },
      box: { x: 60, y: 470, w: 960, h: 170, ns: 104, ds: 28, dx: 330, rs: 34, rp: 27 },
      stk: { x: 905, y: 425, s: 124 },
      ex: { y: 655, h: 60, fs: 36 }, l1: 728, vt: { y: 736, fs: 22 }, l2: 802, dc: { y: 810, fs: 18 }, bt: 40, ans: { y: 964, fs: 16 },
    },
  );
  const css =
    base(p) +
    `
#s7-white{position:absolute;left:0;top:${g.wy}px;width:${W}px;height:${H - g.wy}px;background:#fff;box-shadow:0 -20px 60px rgba(3,2,30,.35);}
#s7-lw{position:absolute;left:0;width:${W}px;top:${g.ly}px;text-align:center;}
#s7-logo{width:${g.lw}px;height:${g.lh}px;background:#fff;}
#s7-t{position:absolute;left:0;width:${W}px;top:${g.ty}px;text-align:center;font-weight:800;font-size:${g.ts}px;line-height:1;letter-spacing:-.025em;}
#s7-a{position:absolute;left:0;width:${W}px;top:${g.ay}px;text-align:center;font-weight:800;font-size:${g.as}px;line-height:1;letter-spacing:.14em;}
#s7-pw{position:absolute;left:0;width:${W}px;top:${g.py}px;height:${g.ps}px;text-align:center;overflow:hidden;}
#s7-pr{display:inline-block;font-weight:900;font-size:${g.ps}px;line-height:1;letter-spacing:-.045em;white-space:nowrap;}
#s7-pill{position:absolute;left:${g.pill.x}px;top:${g.pill.y}px;width:${g.pill.w}px;height:${g.pill.h}px;border-radius:30px;background:${INDIGO};display:flex;flex-direction:column;align-items:center;justify-content:center;font-weight:800;font-size:${g.pill.fs}px;line-height:1.12;box-shadow:0 20px 50px rgba(48,32,240,.45);}
#s7-box{position:absolute;left:${g.box.x}px;top:${g.box.y}px;width:${g.box.w}px;height:${g.box.h}px;border-radius:30px;background:${LAV};color:${INK};}
#s7-n{position:absolute;left:0;width:${g.box.dx}px;top:${Math.round(g.box.h / 2 - g.box.ns * 0.62)}px;text-align:center;font-weight:900;font-size:${g.box.ns}px;line-height:1;letter-spacing:-.05em;color:${INDIGO};}
#s7-dd{position:absolute;left:0;width:${g.box.dx}px;top:${Math.round(g.box.h / 2 + g.box.ns * 0.42)}px;text-align:center;font-weight:900;font-size:${g.box.ds}px;line-height:1;color:${INDIGO};}
#s7-dv{position:absolute;left:${g.box.dx}px;top:${Math.round(g.box.h * 0.16)}px;width:3px;height:${Math.round(g.box.h * 0.68)}px;background:${INDIGO};}
#s7-r1{position:absolute;left:${g.box.dx + 34}px;top:${Math.round(g.box.h / 2 - g.box.rs * 1.45)}px;font-weight:800;font-size:${g.box.rs}px;line-height:1.1;letter-spacing:-.02em;}
#s7-r2{position:absolute;left:${g.box.dx + 34}px;top:${Math.round(g.box.h / 2 + g.box.rs * 0.95)}px;font-weight:800;font-size:${g.box.rp}px;line-height:1;color:${INDIGO};letter-spacing:-.01em;}
#s7-stk{position:absolute;left:${g.stk.x}px;top:${g.stk.y}px;width:${g.stk.s}px;height:${g.stk.s}px;}
#s7-stki{position:absolute;inset:0;border-radius:50%;background:${AMBER};color:${INK};display:flex;flex-direction:column;align-items:center;justify-content:center;transform:rotate(12deg);box-shadow:0 14px 34px rgba(3,2,30,.35);font-family:"Mont",Arial,sans-serif;font-weight:900;line-height:1.05;text-align:center;}
#s7-stki span{font-size:${Math.round(g.stk.s * 0.13)}px;letter-spacing:.06em;}
#s7-stki b{font-size:${Math.round(g.stk.s * 0.24)}px;font-weight:900;letter-spacing:-.03em;}
#s7-ex{position:absolute;left:${g.box.x}px;top:${g.ex.y}px;width:${g.box.w}px;height:${g.ex.h}px;border-radius:24px;background:${LAV};display:flex;align-items:center;justify-content:center;font-weight:900;font-size:${g.ex.fs}px;color:${INDIGO};letter-spacing:.01em;}
.s7-ln{position:absolute;left:${g.box.x + 10}px;width:${g.box.w - 20}px;height:2px;background:rgba(48,32,240,.35);}
#s7-vt{position:absolute;left:0;width:${W}px;top:${g.vt.y}px;text-align:center;font-weight:500;font-size:${g.vt.fs}px;line-height:1.28;color:${INK};}
#s7-dc{position:absolute;left:0;width:${W}px;top:${g.dc.y}px;text-align:center;font-size:${g.dc.fs}px;color:${MUTED};}
#s7-bw{position:absolute;left:${BTN.x}px;top:${BTN.y}px;width:${BTN.w}px;height:${BTN.h}px;}
#s7-ring{position:absolute;inset:0;border-radius:${Math.round(BTN.h * 0.26)}px;border:4px solid rgba(48,32,240,.9);opacity:0;}
#s7-btn{position:absolute;inset:0;border-radius:${Math.round(BTN.h * 0.26)}px;background:${INDIGO};display:flex;align-items:center;justify-content:center;gap:16px;font-weight:800;font-size:${g.bt}px;letter-spacing:-.01em;box-shadow:0 20px 50px rgba(48,32,240,.45),inset 0 2px 0 rgba(255,255,255,.25);overflow:hidden;}
#s7-ans{position:absolute;left:0;width:${W}px;top:${g.ans.y}px;text-align:center;font-size:${g.ans.fs}px;color:${MUTED};}
`;
  const body = `
  <div id="s7-cam" class="${p}-full">
  <div id="s7-wrap" class="${p}-full">
    <div id="s7-white"></div>
    <div id="s7-lw"><span id="s7-logo" class="logo" role="img" aria-label="Amil"></span></div>
    <div id="s7-t" class="d">Plano Empresarial</div>
    <div id="s7-a" class="d">A PARTIR DE</div>
    <div id="s7-pw"><span id="s7-pr" class="d">R$ 1.123,17</span><div id="s7-psw" class="sweep" aria-hidden="true"></div></div>
    <div id="s7-pill" class="d" data-layout-allow-overlap><span>Plano para 3 Vidas</span><span>com coparticipação</span></div>
    <div id="s7-box" class="d"><div id="s7-n">50%</div><div id="s7-dd">DE DESCONTO</div><div id="s7-dv"></div>
      <div id="s7-r1">nas primeiras<br>duas mensalidades</div><div id="s7-r2">Promoção para Outubro</div></div>
    <div id="s7-stk" data-layout-allow-overlap><div id="s7-stki"><span>SÓ ATÉ</span><b>31/10</b></div></div>
    <div id="s7-ex" class="d">EXCLUSIVO PARA CNPJ</div>
    <div class="s7-ln" style="top:${g.l1}px"></div>
    <div id="s7-vt">Valor referente a uma vida de 18 anos,<br>um adulto de 33 anos e mais um até 38 anos</div>
    <div class="s7-ln" style="top:${g.l2}px"></div>
    <div id="s7-dc">Cobertura e rede sujeitas à modalidade contratada.</div>
    <div id="s7-bw"><div id="s7-ring"></div><div id="s7-btn" class="d"><span>Solicite uma cotação personalizada!</span>${icon("arrow", Math.round(g.bt * 0.9), { id: "s7-arrow", color: "#fff", sw: 4.4 })}<div id="s7-bsw" class="sweep" aria-hidden="true"></div></div></div>
    <div id="s7-ans">Amil · ANS nº 326305</div>
  </div>
  </div>`;
  drift("#s7-cam", dur, 1.012);
  // a peça se monta em cascata
  add(`tl.fromTo("#s7-white",{yPercent:100},{yPercent:0,duration:0.5,ease:"power4.out"},0.05);`);
  add(`tl.fromTo("#s7-logo",{opacity:0,y:-20},{opacity:1,y:0,duration:0.4,ease:"power3.out"},0.1);`);
  add(`tl.fromTo("#s7-t",{opacity:0,y:30},{opacity:1,y:0,duration:0.4,ease:"power3.out"},0.16);`);
  add(`tl.fromTo("#s7-a",{opacity:0},{opacity:1,duration:0.35},0.24);`);
  add(`tl.fromTo("#s7-pr",{scale:1.25,opacity:0},{scale:1,opacity:1,duration:0.4,ease:"power4.out"},0.26);`);
  add(`tl.fromTo("#s7-pill",{scaleX:0.4,opacity:0},{scaleX:1,opacity:1,duration:0.45,ease:"power3.out"},0.34);`);
  add(`tl.fromTo("#s7-box",{y:60,opacity:0},{y:0,opacity:1,duration:0.45,ease:"power3.out"},0.42);`);
  add(`tl.fromTo("#s7-ex",{y:60,opacity:0},{y:0,opacity:1,duration:0.45,ease:"power3.out"},0.5);`);
  add(`tl.fromTo(["#s7-vt","#s7-dc",".s7-ln","#s7-ans"],{opacity:0},{opacity:1,duration:0.4},0.6);`);
  add(`tl.fromTo("#s7-bw",{scale:0.6,opacity:0},{scale:1,opacity:1,duration:0.5,ease:"back.out(1.8)"},${r3(L(T.solicite) - 0.12)});`);
  add(`tl.fromTo("#s7-bsw",{xPercent:-100},{xPercent:100,duration:0.9,ease:"power2.inOut"},${r3(L(T.solicite) + 0.2)});`);
  // selo "SÓ ATÉ 31/10" no "aproveite os 50%"
  add(`tl.fromTo("#s7-stk",{scale:2.2,opacity:0,rotation:-30},{scale:1,opacity:1,rotation:0,duration:0.24,ease:"power4.in"},${r3(L(T.aproveite) - 0.1)});`);
  add(`tl.fromTo("#s7-n",{scale:1},{scale:1.12,duration:0.18,ease:"power2.out"},${r3(L(T.cinquenta2))});`);
  add(`tl.to("#s7-n",{scale:1,duration:0.35,ease:"power2.inOut"},${r3(L(T.cinquenta2) + 0.18)});`);
  add(`tl.fromTo("#s7-psw",{xPercent:-100},{xPercent:100,duration:0.8,ease:"power2.inOut"},${r3(L(T.mes) - 0.4)});`);
  // toque no botão
  const tp = L(TAP);
  add(`tl.fromTo("#s7-btn",{scale:1},{scale:0.95,duration:0.1,ease:"power2.in"},${tp});`);
  add(`tl.to("#s7-btn",{scale:1,duration:0.3,ease:"back.out(2)"},${r3(tp + 0.1)});`);
  add(`tl.fromTo("#s7-ring",{opacity:0.95,scale:1},{opacity:0,scale:1.12,duration:0.7,ease:"power2.out"},${r3(tp + 0.05)});`);
  for (let t = tp + 1.0, i = 0; t + 1.0 <= dur - 1.2; t += 1.0, i++) {
    add(`tl.fromTo("#s7-btn",{scale:1},{scale:1.03,duration:0.5,ease:"sine.inOut",immediateRender:false},${r3(t)});`);
    add(`tl.to("#s7-btn",{scale:1,duration:0.5,ease:"sine.inOut"},${r3(t + 0.5)});`);
    add(`tl.fromTo("#s7-ring",{opacity:0.7,scale:1},{opacity:0,scale:1.1,duration:0.9,ease:"power2.out",immediateRender:false},${r3(t)});`);
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
  const fx = BTN.x + BTN.w * 0.7;
  const fy = BTN.y + BTN.h * 0.56;
  const NOISE =
    "data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E";
  const css = `#ui-root{position:absolute;inset:0;width:${W}px;height:${H}px;overflow:hidden;pointer-events:none;}
#ui-f{position:absolute;left:${fx - FS / 2}px;top:${fy - FS / 2}px;width:${FS}px;height:${FS}px;border-radius:50%;background:radial-gradient(circle,rgba(255,255,255,.75) 0 34%,rgba(255,255,255,.32) 36% 100%);border:2px solid rgba(255,255,255,.95);box-shadow:0 0 0 1.5px rgba(14,10,85,.35),0 10px 26px rgba(5,4,40,.45);opacity:0;}
#ui-fl{position:absolute;inset:0;background:radial-gradient(70% 50% at 50% 45%,rgba(220,210,255,.9),rgba(110,90,255,.35) 60%,rgba(48,32,240,0));opacity:0;}
#ui-tex{position:absolute;left:-128px;top:-128px;width:${W + 256}px;height:${H + 256}px;background:url("${NOISE}") 0 0/256px 256px repeat;opacity:.045;mix-blend-mode:overlay;}`;
  const body = `<div id="ui-fl" aria-hidden="true"></div><div id="ui-tex" data-layout-allow-overflow aria-hidden="true"></div><div id="ui-f"></div>`;
  [
    [T.outubro1 - 0.02, 0.4],
    [T.cinquenta1 - 0.02, 0.5],
    [T.toque - 0.16, 0.45],
  ].forEach(([t, o], i) => {
    add(`tl.fromTo("#ui-fl",{opacity:0},{opacity:${o},duration:0.08,ease:"power2.out"${i ? ",immediateRender:false" : ""}},${r3(t)});`);
    add(`tl.to("#ui-fl",{opacity:0,duration:0.45,ease:"power2.out"},${r3(t + 0.08)});`);
  });
  add(`tl.fromTo("#ui-f",{opacity:0,x:${pick(150, 120)},y:${pick(200, 150)},scale:1.15},{opacity:1,x:0,y:0,scale:1,duration:0.5,ease:"power3.out"},${r3(TAP - 0.55)});`);
  add(`tl.to("#ui-f",{scale:0.82,duration:0.1,ease:"power2.in"},${r3(TAP)});`);
  add(`tl.to("#ui-f",{scale:1,duration:0.18,ease:"power2.out"},${r3(TAP + 0.12)});`);
  add(`tl.to("#ui-f",{opacity:0,x:${pick(90, 70)},y:${pick(120, 90)},duration:0.4,ease:"power2.in"},${r3(TAP + 0.5)});`);
  let s = 31;
  const R = () => ((s = (s * 1103515245 + 12345) % 2147483648) / 2147483648);
  const pos = [];
  for (let t = 0; t < D; t += 2 / FPS) pos.push(Math.round((R() - 0.5) * 200), Math.round((R() - 0.5) * 200));
  add(`const P = [${pos.join(",")}];`);
  add(`for (let i = 0; i < P.length / 2; i++) tl.set("#ui-tex", { x: P[2 * i], y: P[2 * i + 1] }, Math.round((i * 2 / ${FPS}) * 1000) / 1000);`);
  scenes.push({ st: 0, track: 9, ...scene(p, D, css, body, a) });
}

// ═════════════ áudio ═════════════
const HITS = JSON.parse(readFileSync(join(ROOT, "assets/audio/sfx_hits.json"), "utf8"));
const SFX = [
  ["alert", T.atencao, 0.42],
  ["whoosh", T.isso - 0.2, 0.22],
  ["flip", T.outubro1 - 0.12, 0.55],
  ["impact", T.outubro1 + 0.02, 0.38],
  ["whoosh", T.plano1 - 0.4, 0.36],
  ["shimmer", T.amil, 0.26],
  ["riser", T.cinquenta1 - 0.02, 0.4],
  ["impact", T.cinquenta1 - 0.03, 0.55],
  ["counter", T.cinquenta1 + 0.02, 0.2],
  ["card", T.duas - 0.15, 0.28],
  ["card", T.primeiras - 0.15, 0.28],
  ["stamp", T.mensalidades, 0.5],
  ["stamp", T.mensalidades + 0.22, 0.42],
  ["whoosh", T.plano2 - 0.32, 0.36],
  ["riser", T.mil - 0.02, 0.3],
  ["impact", T.mil - 0.03, 0.42],
  ["counter", T.mil + 0.02, 0.18],
  ["shimmer", T.centavos, 0.24],
  ["tap", T.centavos + 0.1, 0.22],
  ["whoosh", T.esse - 0.3, 0.32],
  ["card", T.uma - 0.12, 0.26],
  ["card", T.um - 0.12, 0.26],
  ["card", T.mais - 0.12, 0.26],
  ["whoosh", T.exclusivo - 0.3, 0.3],
  ["stamp", T.exclusivo, 0.7],
  ["impact", T.exclusivo + 0.02, 0.3],
  ["alert", T.corre, 0.3],
  ["clock", T.promocao - 0.05, 0.34],
  ["impact", T.d31, 0.45],
  ["stamp", T.d31 + 0.1, 0.4],
  ["riser", T.toque - 0.12, 0.4],
  ["impact", T.toque - 0.1, 0.5],
  ["shimmer", T.solicite, 0.3],
  ["tap", TAP, 0.75],
  ["check", TAP + 0.05, 0.32],
  ["stamp", T.aproveite - 0.1, 0.45],
  ["shimmer", T.mes - 0.4, 0.22],
];
const SFX_DUR = { counter: 0.9, clock: r3(T.d31 - T.promocao + 0.1) };
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
  `<audio id="el-bgm" src="assets/audio/bgm.wav" data-start="0" data-duration="${D}" data-track-index="20" data-volume="0.46"></audio>`,
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
