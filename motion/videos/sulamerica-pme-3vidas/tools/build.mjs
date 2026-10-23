#!/usr/bin/env node
// build.mjs — anúncio SulAmérica PME (3 vidas, R$ 1.770,30/mês com IOF) na voz de um corretor,
// story 9:16 e feed 1:1.
//
//   node tools/build.mjs story   -> compositions/*.html + index.html
//   node tools/build.mjs feed    -> feed/compositions/*.html + feed/index.html
//
// Sete cenas + fundo + legendas palavra a palavra + camada de toque/grão. Os tempos saem das
// palavras da locução (assets/voice/vo.words.json, transcrição Scribe da tomada escolhida).
// Informações da cotação enviada (assets/ref/cotacao-sulamerica.jpg): SulAmérica PME | Capital –
// 03 a 04 vidas – Apólice 12 meses, Especial Vital QP R1, compulsório, 30% de coparticipação,
// reembolso, apartamento, nacional, sem taxa de inscrição, 2,38% de IOF, valores por faixa.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const FMT = process.argv[2] === "feed" ? "feed" : "story";
const ST = FMT === "story";
const W = 1080;
const H = ST ? 1920 : 1080;
const FPS = 30;
const D = 44.0;
const r3 = (x) => Math.round(x * 1000) / 1000;
const pick = (s, f) => (ST ? s : f);

// paleta SulAmérica
const NAVY = "#001E62";
const DEEP = "#00123D";
const ORANGE = "#F26522";
const ORANGE2 = "#F7941D";
const INK = "#0B1B4A";
const SOFT = "#EEF3FF";
const MUTED = "#4A5578";
const GREEN = "#0E9F4A";
const HL = "#FF9A4D"; // palavra ativa da legenda (laranja claro, contraste no marinho)

// ───────────── locução ─────────────
const WORDS = JSON.parse(readFileSync(join(ROOT, "assets/voice/vo.words.json"), "utf8"));
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
const at = (t, after = 0) => word(t, after).start;
const end = (t, after = 0) => word(t, after).end;

const T = {};
T.ei = at("ei");
T.voce = at("voce");
T.cnpj = at("cnpj");
T.e1 = at("e");
T.plano = at("plano");
T.empresarial = at("empresarial");
T.serio = at("serio");
T.entao = at("entao");
T.atencao = at("atencao");
T.olha = at("olha");
T.sula = at("sulamerica");
T.pme = at("pme");
T.tres = at("tres");
T.vidas = at("vidas");
T.mil = at("mil");
T.setecentos = at("setecentos");
T.setenta = at("setenta");
T.trinta1 = at("trinta", T.setenta);
T.centavos = at("centavos");
T.mes = at("mes");
T.iof = at("iof");
T.hein = at("hein");
T.e_pra = at("e", T.hein);
T.zero = at("zero");
T.vinte = at("vinte", T.zero);
T.outra = at("outra");
T.trinta3 = at("trinta", T.outra);
T.oito = at("oito");
T.tem2 = at("tem", T.oito);
T.abrangencia = at("abrangencia");
T.apartamento = at("apartamento");
T.copart = at("coparticipacao");
T.reembolso = at("reembolso");
T.sem = at("sem");
T.inscricao = at("inscricao");
T.quer = at("quer");
T.contratar = at("contratar");
T.me = at("me");
T.whatsapp = at("whatsapp");
T.ajudo = at("ajudo");
T.condicoes = at("condicoes");
T.familia = at("familia");
T.nao2 = at("nao", T.familia);
T.saude2 = at("saude", T.nao2);
T.precisar = at("precisar");
T.clica = at("clica");
T.botao = at("botao");
T.comigo = at("comigo");
const TAP = r3(T.botao + 0.12);

// ───────────── utilidades ─────────────
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
.sweep{position:absolute;left:0;top:0;width:100%;height:100%;background:linear-gradient(105deg,rgba(255,255,255,0) 35%,rgba(255,255,255,.55) 50%,rgba(255,255,255,0) 65%);mix-blend-mode:screen;}
.lg{position:relative;display:inline-block;}
.lg img{position:absolute;left:0;top:0;width:100%;height:100%;}
`;

// logo SulAmérica (onda laranja + texto branco, lockup oficial)
const logo = (p, w) => {
  const h = Math.round((w * 280) / 1097);
  return `<span class="lg" id="${p}-logo" style="width:${w}px;height:${h}px"><img id="${p}-lgw" src="assets/img/logo-wave.png" alt="" /><img id="${p}-lgt" src="assets/img/logo-text.png" alt="SulAmérica" /></span>`;
};

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
  const drift = (sel, dur, to = 1.02) => add(`tl.fromTo("${sel}",{scale:1},{scale:${to},duration:${r3(dur)},ease:"none"},0);`);
  const shake = (sel, t, amp = 10) =>
    [1, -0.8, 0.5, -0.25, 0].forEach((k, i) => add(`tl.set("${sel}",{x:${r3(k * amp)},y:${r3(-k * amp * 0.6)}},${r3(t + i / FPS)});`));
  return { a, L, add, words, drift, shake };
}

const ICONS = {
  check: `<path d="M12 25l8 8 16-18"/>`,
  building: `<path d="M8 42V10l16-5v37M24 16l16 5v21M4 42h40M14 16h4M14 23h4M14 30h4M30 26h4M30 33h4"/>`,
  heart: `<path d="M24 41S7 30.5 7 18.5A9 9 0 0 1 24 14a9 9 0 0 1 17 4.5C41 30.5 24 41 24 41z"/><path d="M24 20v10M19 25h10"/>`,
  globe: `<circle cx="24" cy="24" r="17"/><path d="M7 24h34M24 7c5 5 7 11 7 17s-2 12-7 17c-5-5-7-11-7-17s2-12 7-17z"/>`,
  bed: `<path d="M5 36V12M5 28h38v8M43 28v-4a6 6 0 0 0-6-6H22v10"/><circle cx="13" cy="22" r="4"/>`,
  percent: `<path d="M12 36L36 12"/><circle cx="14" cy="14" r="5"/><circle cx="34" cy="34" r="5"/>`,
  refund: `<path d="M38 18A15 15 0 1 0 39 30"/><path d="M39 9v9h-9"/><path d="M24 15v18M28 19.5c-1-1.5-2.5-2-4-2-2.5 0-4 1.3-4 3s1.6 2.6 4 3 4 1.3 4 3.2-1.8 3-4 3c-1.8 0-3.3-.6-4.4-2"/>`,
  ticket: `<path d="M6 16a4 4 0 0 0 0 8v8h36v-8a4 4 0 0 0 0-8V8H6z" transform="translate(0 4)"/><path d="M10 40L38 10"/>`,
  search: `<circle cx="20" cy="20" r="13"/><path d="M30 30l12 12"/>`,
  chat: `<path d="M24 6C13 6 5 13.5 5 23c0 3.6 1.2 7 3.3 9.7L6 42l9.7-3.1c2.5 1.2 5.3 1.9 8.3 1.9 11 0 19-7.5 19-17S35 6 24 6z"/><path d="M17 20c0 6 5 11 11 11l3-3-4-2-2 2c-2-1-4-3-5-5l2-2-2-4z"/>`,
  person: `<circle cx="24" cy="16" r="8"/><path d="M8 44c0-9 7-15 16-15s16 6 16 15"/>`,
  send: `<path d="M8 24L42 8 34 42 24 28z"/><path d="M24 28L42 8"/>`,
};
const icon = (name, size, { id = "", sw = 3.4, color = "#fff", fill = "none" } = {}) =>
  `<svg ${id ? `id="${id}" ` : ""}viewBox="0 0 48 48" width="${size}" height="${size}" fill="${fill}" stroke="${color}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`;

// rosto surpreso (reação do "Sério?!")
const face = (size, id) => `<svg id="${id}" viewBox="0 0 100 100" width="${size}" height="${size}" aria-hidden="true">
  <circle cx="50" cy="50" r="46" fill="#FFD25A" stroke="${INK}" stroke-width="4"/>
  <path d="M26 30q8-8 16-2M58 28q8-6 16 2" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>
  <circle cx="35" cy="44" r="6" fill="${INK}"/><circle cx="65" cy="44" r="6" fill="${INK}"/>
  <ellipse id="${id}-m" cx="50" cy="70" rx="9" ry="12" fill="${INK}"/></svg>`;

// colunas de dígitos que rolam até o valor (formato X.XXX,XX)
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

// ═════════════ fundo: marinho com a onda laranja da marca ═════════════
{
  const p = "bg";
  const { a, add } = TL(0);
  const wave = (y, amp, len) => {
    let d = `M-200 ${y}`;
    for (let x = -200; x < W + 400; x += len) d += ` C${x + len * 0.35} ${y - amp} ${x + len * 0.65} ${y + amp} ${x + len} ${y}`;
    return d;
  };
  const css =
    base(p) +
    `
#bg-base{background:radial-gradient(90% 60% at 50% 22%,#0A2C80 0%,${NAVY} 45%,${DEEP} 100%);}
#bg-glow{position:absolute;left:${pick(380, 420)}px;top:${pick(1250, 640)}px;width:${pick(1100, 900)}px;height:${pick(1100, 900)}px;border-radius:50%;background:radial-gradient(closest-side,rgba(242,101,34,.28),rgba(242,101,34,0));}
#bg-w{position:absolute;left:0;top:0;}
#bg-vig{background:radial-gradient(110% 75% at 50% 45%,rgba(0,0,0,0) 55%,rgba(0,8,30,.55) 100%);}
`;
  const body = `
  <div id="bg-base" class="${p}-full"></div>
  <div id="bg-glow" data-layout-allow-overflow aria-hidden="true"></div>
  <svg id="bg-w" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" aria-hidden="true" data-layout-allow-overflow>
    <defs><linearGradient id="bg-g" x1="0" x2="1"><stop offset="0" stop-color="${ORANGE2}" stop-opacity="0"/><stop offset=".4" stop-color="${ORANGE2}" stop-opacity=".55"/><stop offset="1" stop-color="${ORANGE}" stop-opacity=".2"/></linearGradient></defs>
    <g id="bg-w1"><path d="${wave(pick(1660, 960), pick(70, 50), 560)}" fill="none" stroke="url(#bg-g)" stroke-width="5"/></g>
    <g id="bg-w2"><path d="${wave(pick(1720, 1010), pick(50, 36), 420)}" fill="none" stroke="url(#bg-g)" stroke-width="3" opacity=".6"/></g>
    <g id="bg-w3"><path d="${wave(pick(170, 70), pick(40, 30), 500)}" fill="none" stroke="url(#bg-g)" stroke-width="3" opacity=".45"/></g>
  </svg>
  <div id="bg-vig" class="${p}-full"></div>`;
  add(`tl.fromTo("#bg-w1",{x:0},{x:-560,duration:${D},ease:"none"},0);`);
  add(`tl.fromTo("#bg-w2",{x:-420},{x:0,duration:${D},ease:"none"},0);`);
  add(`tl.fromTo("#bg-w3",{x:0},{x:-500,duration:${D},ease:"none"},0);`);
  add(`tl.fromTo("#bg-glow",{x:0,y:0,scale:1},{x:${pick(-180, -140)},y:${pick(-200, -120)},scale:1.2,duration:11,ease:"sine.inOut",repeat:3,yoyo:true},0);`);
  scenes.push({ st: 0, track: 0, ...scene(p, D, css, body, a) });
}

// ═════════════ 1 · gancho: "Ei… você tem CNPJ? E ainda não tem plano de saúde empresarial? Sério?!" ═════════════
{
  const p = "s1";
  const st = 0;
  const dur = T.olha - 0.3;
  const { a, L, add, shake } = TL(st);
  const g = pick(
    { cx: 120, cy: 330, cw: 840, ch: 330, cs: 130, ix: 150, py: 760, ph: 300, ps: 64, sx: 620, sy: 620, sw: 400, ss: 92, fz: 130 },
    { cx: 160, cy: 70, cw: 760, ch: 280, cs: 110, ix: 120, py: 410, ph: 250, ps: 54, sx: 600, sy: 360, sw: 360, ss: 80, fz: 110 },
  );
  const css =
    base(p) +
    `
.s1-c{position:absolute;left:${g.cx}px;width:${g.cw}px;border-radius:36px;background:#fff;color:${INK};box-shadow:0 30px 70px rgba(0,8,30,.5);}
#s1-c1{top:${g.cy}px;height:${g.ch}px;}
#s1-c2{top:${g.py}px;height:${g.ph}px;}
.s1-ic{position:absolute;left:44px;top:50%;margin-top:-${g.ix / 2}px;width:${g.ix}px;height:${g.ix}px;border-radius:32px;background:${SOFT};display:flex;align-items:center;justify-content:center;}
#s1-cn{position:absolute;left:${44 + g.ix + 40}px;top:${Math.round(g.ch / 2 - g.cs * 0.62)}px;font-weight:900;font-size:${g.cs}px;line-height:1;letter-spacing:-.02em;color:${NAVY};}
#s1-cl{position:absolute;left:${44 + g.ix + 44}px;top:${Math.round(g.ch / 2 + g.cs * 0.45)}px;font-weight:500;font-size:${Math.round(g.cs * 0.25)}px;color:${MUTED};}
#s1-ok{position:absolute;right:40px;top:50%;margin-top:-48px;width:96px;height:96px;border-radius:50%;background:${ORANGE};display:flex;align-items:center;justify-content:center;box-shadow:0 10px 26px rgba(242,101,34,.45);}
#s1-pt{position:absolute;left:${44 + g.ix + 40}px;top:${Math.round(g.ph / 2 - g.ps * 1.08)}px;font-weight:800;font-size:${g.ps}px;line-height:1.08;color:${NAVY};letter-spacing:-.02em;}
#s1-box{position:absolute;right:44px;top:50%;margin-top:-50px;width:100px;height:100px;border-radius:24px;border:6px dashed #B9C3DD;display:flex;align-items:center;justify-content:center;font-family:"Mont",Arial,sans-serif;font-weight:900;font-size:70px;color:${ORANGE};}
#s1-sw{position:absolute;left:${g.sx}px;top:${g.sy}px;width:${g.sw}px;height:${Math.round(g.sw * 0.56)}px;}
#s1-st{position:absolute;inset:0;border-radius:40px;background:${ORANGE};display:flex;align-items:center;justify-content:center;font-weight:900;font-size:${g.ss}px;letter-spacing:-.02em;box-shadow:0 20px 50px rgba(0,8,30,.5);transform:rotate(-8deg);}
#s1-st::after{content:"";position:absolute;left:60px;bottom:-34px;border-left:26px solid transparent;border-right:26px solid transparent;border-top:40px solid ${ORANGE};}
#s1-fw{position:absolute;left:${g.sx - Math.round(g.fz * 0.55)}px;top:${g.sy - Math.round(g.fz * 0.55)}px;}
.s1-ha{position:absolute;font-weight:800;font-size:${pick(46, 40)}px;color:${HL};}
`;
  const body = `
  <div id="s1-wrap" class="${p}-full">
    <div class="s1-c" id="s1-c1"><div class="s1-ic">${icon("building", Math.round(g.ix * 0.6), { color: NAVY, sw: 3.2 })}</div>
      <div id="s1-cn" class="d">CNPJ</div><div id="s1-cl">Sua empresa</div>
      <div id="s1-ok">${icon("check", 60, { color: "#fff", sw: 6 })}</div></div>
    <div class="s1-c" id="s1-c2"><div class="s1-ic">${icon("heart", Math.round(g.ix * 0.6), { color: ORANGE, sw: 3.4 })}</div>
      <div id="s1-pt" class="d">Plano de saúde<br>empresarial</div><div id="s1-box"><span id="s1-q">?</span></div></div>
    <div id="s1-sw"><div id="s1-st" class="d">Sério?!</div></div>
    <div id="s1-fw">${face(g.fz, "s1-face")}</div>
    <div class="s1-ha d" id="s1-h0" style="left:${g.sx + g.sw - 60}px;top:${g.sy - 20}px" aria-hidden="true" data-layout-allow-overlap>haha</div>
    <div class="s1-ha d" id="s1-h1" style="left:${g.sx + g.sw * 0.45}px;top:${g.sy - 60}px" aria-hidden="true" data-layout-allow-overlap>ha</div>
    <div class="s1-ha d" id="s1-h2" style="left:${g.sx + 30}px;top:${g.sy - 30}px" aria-hidden="true" data-layout-allow-overlap>haha</div>
  </div>`;
  // "Ei, você tem CNPJ?" — o cartão da empresa sobe e ganha o check
  add(`tl.fromTo("#s1-c1",{y:${pick(160, 120)},opacity:0,rotation:-3},{y:0,opacity:1,rotation:0,duration:0.55,ease:"back.out(1.5)"},${r3(L(T.voce) - 0.2)});`);
  add(`tl.fromTo("#s1-cn",{opacity:0,x:-30},{opacity:1,x:0,duration:0.35,ease:"power3.out"},${r3(L(T.cnpj) - 0.05)});`);
  add(`tl.fromTo("#s1-ok",{scale:0,rotation:-90},{scale:1,rotation:0,duration:0.45,ease:"back.out(2.4)"},${r3(L(T.cnpj) + 0.15)});`);
  // "E ainda não tem plano de saúde empresarial?" — o cartão do plano chega vazio
  add(`tl.fromTo("#s1-c2",{y:${pick(160, 120)},opacity:0,rotation:3},{y:0,opacity:1,rotation:0,duration:0.55,ease:"back.out(1.5)"},${r3(L(T.plano) - 0.25)});`);
  add(`tl.fromTo("#s1-q",{scale:0},{scale:1,duration:0.35,ease:"back.out(3)"},${r3(L(T.empresarial) + 0.1)});`);
  add(`tl.fromTo("#s1-q",{scale:1},{scale:1.25,duration:0.22,ease:"sine.inOut",repeat:3,yoyo:true,immediateRender:false},${r3(L(T.empresarial) + 0.45)});`);
  // "Sério?!" — balão e rosto surpreso; a risada sacode o balão
  const ts = L(T.serio);
  add(`tl.fromTo("#s1-sw",{scale:0.2,opacity:0},{scale:1,opacity:1,duration:0.35,ease:"back.out(2.6)"},${r3(ts - 0.1)});`);
  add(`tl.fromTo("#s1-fw",{scale:0,rotation:-40},{scale:1,rotation:0,duration:0.4,ease:"back.out(2.6)"},${r3(ts)});`);
  add(`tl.fromTo("#s1-face-m",{attr:{ry:4}},{attr:{ry:12},duration:0.2,ease:"power2.out"},${r3(ts + 0.05)});`);
  shake("#s1-wrap", r3(ts + 0.05), pick(12, 9));
  const tl0 = r3(L(end("serio")) + 0.1);
  add(`tl.fromTo("#s1-sw",{rotation:0},{rotation:6,duration:0.12,ease:"sine.inOut",repeat:7,yoyo:true,immediateRender:false},${tl0});`);
  add(`tl.fromTo("#s1-fw",{y:0},{y:-14,duration:0.12,ease:"sine.inOut",repeat:7,yoyo:true,immediateRender:false},${tl0});`);
  [0, 1, 2].forEach((i) => add(`tl.fromTo("#s1-h${i}",{y:20,opacity:0,scale:0.6},{y:-${pick(90, 70)},opacity:1,scale:1,duration:0.7,ease:"power2.out"},${r3(tl0 + i * 0.22)});`));
  [0, 1, 2].forEach((i) => add(`tl.to("#s1-h${i}",{opacity:0,duration:0.25},${r3(tl0 + 0.72 + i * 0.22)});`));
  add(`tl.to("#s1-face-m",{attr:{ry:6},duration:0.2},${r3(tl0)});`);
  // "Então presta atenção" — tudo sai para abrir a oferta
  add(`tl.to(["#s1-c1","#s1-c2"],{x:-${pick(1100, 1100)},duration:0.4,ease:"power3.in",stagger:0.06},${r3(L(T.atencao) - 0.1)});`);
  add(`tl.to(["#s1-sw","#s1-fw"],{scale:0,opacity:0,duration:0.3,ease:"power3.in"},${r3(L(T.atencao) - 0.1)});`);
  scenes.push({ st, track: 1, ...scene(p, dur, css, body, a) });
}

// ═════════════ 2 · oferta: "SulAmérica PME pra três vidas por R$ 1.770,30 por mês, já com IOF" ═════════════
{
  const p = "s2";
  const st = T.olha - 0.4;
  const dur = T.e_pra - 0.25 - st;
  const { a, L, add, drift, shake } = TL(st);
  const g = pick(
    { lw: 620, ly: 300, my: 500, ms: 120, by: 520, bh: 84, bs: 40, ay: 640, as: 32, vy: 730, vs: 66, ps: 96, ry: 880, rs: 168, ux: 0, uy: 1080, us: 52, kx: 600, ky: 1150, ks: 52 },
    { lw: 440, ly: 34, my: 180, ms: 96, by: 192, bh: 70, bs: 34, ag: 0, ay: 292, as: 28, vy: 360, vs: 56, ps: 80, ry: 470, rs: 156, uy: 640, us: 46, kx: 610, ky: 690, ks: 46 },
  );
  const R = rollPrice(p, g.rs, [1, 7, 7, 0, 3, 0]);
  const css =
    base(p) +
    R.css +
    `
#s2-lw{position:absolute;left:0;width:${W}px;top:${g.ly}px;text-align:center;}
#s2-row{position:absolute;left:0;width:${W}px;top:${g.my}px;display:flex;justify-content:center;align-items:center;gap:28px;}
#s2-pme{font-weight:900;font-size:${g.ms}px;line-height:1;letter-spacing:-.02em;}
#s2-bd{display:inline-flex;height:${g.bh}px;border-radius:10px;overflow:hidden;font-weight:800;font-size:${g.bs}px;box-shadow:0 10px 24px rgba(0,8,30,.4);}
#s2-bd span{display:flex;align-items:center;padding:0 22px;}
#s2-bd .o{background:${ORANGE};}
#s2-bd .n{background:#fff;color:${NAVY};}
#s2-ap{position:absolute;left:0;width:${W}px;top:${g.ay}px;text-align:center;font-weight:500;font-size:${g.as}px;color:rgba(255,255,255,.85);letter-spacing:.04em;}
#s2-vr{position:absolute;left:0;width:${W}px;top:${g.vy}px;display:flex;justify-content:center;align-items:center;gap:18px;}
.s2-p{width:${g.ps}px;height:${g.ps}px;border-radius:50%;background:rgba(255,255,255,.12);border:3px solid rgba(255,255,255,.5);display:flex;align-items:center;justify-content:center;}
#s2-v{font-weight:800;font-size:${g.vs}px;margin-left:14px;}
#s2-rw{position:absolute;left:0;width:${W}px;top:${g.ry - 10}px;height:${g.rs + 20}px;text-align:center;overflow:hidden;}
#s2-pr{display:inline-block;margin-top:10px;font-weight:900;font-size:${g.rs}px;letter-spacing:-.045em;white-space:nowrap;text-shadow:0 0 40px rgba(242,101,34,.45);}
#s2-um{position:absolute;left:0;width:${W}px;top:${g.uy}px;text-align:center;font-weight:700;font-size:${g.us}px;color:rgba(255,255,255,.9);}
#s2-kw{position:absolute;left:${g.kx}px;top:${g.ky}px;}
#s2-k{padding:14px 30px;border-radius:18px;background:${ORANGE};font-weight:900;font-size:${g.ks}px;letter-spacing:.02em;transform:rotate(-6deg);box-shadow:0 16px 40px rgba(0,8,30,.45);border:4px solid rgba(255,255,255,.85);}
`;
  const body = `
  <div id="s2-cam" class="${p}-full">
  <div id="s2-wrap" class="${p}-full">
    <div id="s2-lw">${logo(p, g.lw)}</div>
    <div id="s2-row"><span id="s2-pme" class="d">PME</span><span id="s2-bd" class="d"><span class="o">Capital</span><span class="n">03 a 04 vidas</span></span></div>
    <div id="s2-ap">Apólice 12 meses</div>
    <div id="s2-vr">${[0, 1, 2].map((i) => `<span class="s2-p" id="s2-p${i}">${icon("person", Math.round(g.ps * 0.6), { color: "#fff", sw: 3.4 })}</span>`).join("")}<span id="s2-v" class="d">3 vidas</span></div>
    <div id="s2-rw"><span id="s2-pr" class="d">${R.html}</span><div id="s2-psw" class="sweep" aria-hidden="true"></div></div>
    <div id="s2-um" class="d">por mês</div>
    <div id="s2-kw"><div id="s2-k" class="d">JÁ COM IOF</div></div>
  </div>
  </div>`;
  drift("#s2-cam", dur, 1.02);
  // logo: a onda se desenha da esquerda para a direita e o nome aparece
  add(`tl.fromTo("#s2-lgw",{clipPath:"inset(0% 100% 0% 0%)"},{clipPath:"inset(0% 0% 0% 0%)",duration:0.7,ease:"power2.inOut"},${r3(L(T.sula) - 0.4)});`);
  add(`tl.fromTo("#s2-lgt",{opacity:0,y:16},{opacity:1,y:0,duration:0.45,ease:"power3.out"},${r3(L(T.sula) - 0.05)});`);
  add(`tl.fromTo("#s2-pme",{scale:1.5,opacity:0},{scale:1,opacity:1,duration:0.3,ease:"power4.out"},${r3(L(T.pme) - 0.05)});`);
  add(`tl.fromTo("#s2-bd",{x:60,opacity:0},{x:0,opacity:1,duration:0.4,ease:"power3.out"},${r3(L(T.pme) + 0.15)});`);
  add(`tl.fromTo("#s2-ap",{opacity:0},{opacity:1,duration:0.4},${r3(L(T.pme) + 0.35)});`);
  [0, 1, 2].forEach((i) => add(`tl.fromTo("#s2-p${i}",{scale:0,y:20},{scale:1,y:0,duration:0.4,ease:"back.out(2.4)"},${r3(L(T.tres) + i * 0.12)});`));
  add(`tl.fromTo("#s2-v",{opacity:0,x:-20},{opacity:1,x:0,duration:0.35,ease:"power3.out"},${r3(L(T.vidas) - 0.05)});`);
  // preço: cada dígito rola até o valor quando é dito
  const t0 = r3(L(T.mil) - 0.08);
  add(`tl.fromTo("#s2-pr",{opacity:0},{opacity:1,duration:0.08},${t0});`);
  add(`tl.fromTo("#s2-rs",{scale:1.4,opacity:0},{scale:1,opacity:1,duration:0.3,ease:"power4.out"},${t0});`);
  const lands = [T.mil + 0.14, T.setecentos + 0.14, T.setenta + 0.12, T.setenta + 0.3, T.trinta1 + 0.12, T.trinta1 + 0.3];
  lands.forEach((tl_, i) => add(`tl.fromTo("#s2-ds${i}",{y:0},{y:${-R.finals[i] * R.LH},duration:${r3(L(tl_) - t0)},ease:"power3.out"},${t0});`));
  add(`tl.fromTo("#s2-psw",{xPercent:-100},{xPercent:100,duration:0.8,ease:"power2.inOut"},${r3(L(T.centavos) + 0.1)});`);
  add(`tl.fromTo("#s2-um",{opacity:0,y:20},{opacity:1,y:0,duration:0.35,ease:"power3.out"},${r3(L(T.mes) - 0.15)});`);
  // "já com IOF, hein!" — carimbo
  add(`tl.fromTo("#s2-kw",{scale:2.2,opacity:0},{scale:1,opacity:1,duration:0.2,ease:"power4.in"},${r3(L(T.iof) - 0.12)});`);
  shake("#s2-wrap", r3(L(T.iof) + 0.08), pick(10, 8));
  add(`tl.fromTo("#s2-kw",{scale:1},{scale:1.1,duration:0.15,ease:"power2.out",immediateRender:false},${r3(L(T.hein))});`);
  add(`tl.to("#s2-kw",{scale:1,duration:0.3,ease:"back.out(2)"},${r3(L(T.hein) + 0.15)});`);
  add(`tl.to("#s2-wrap",{y:-${pick(120, 80)},opacity:0,duration:0.25,ease:"power3.in"},${r3(dur - 0.25)});`);
  scenes.push({ st, track: 2, ...scene(p, dur, css, body, a) });
}

// ═════════════ 3 · a cotação: faixas etárias, valores, IOF, total ═════════════
{
  const p = "s3";
  const st = T.e_pra - 0.35;
  const dur = T.tem2 - 0.12 - st;
  const { a, L, add, drift } = TL(st);
  const g = pick(
    { x: 70, y: 280, w: 940, h: 1050, hh: 150, hs: 44, ss: 26, ly: 180, rows: [235, 355, 475], rh: 104, rs: 48, ic: 64, dv: 600, t1: 625, t2: 680, ts: 32, fy: 750, fh: 170, fl: 38, fp: 86, ny: 960, ns: 28 },
    { x: 140, y: 26, w: 800, h: 890, hh: 120, hs: 36, ss: 22, ly: 140, rows: [180, 270, 360], rh: 84, rs: 40, ic: 52, dv: 462, t1: 480, t2: 524, ts: 27, fy: 584, fh: 150, fl: 32, fp: 72, ny: 770, ns: 24 },
  );
  const rows = [
    ["0 a 18 anos", "R$ 379,08"],
    ["29 a 33 anos", "R$ 652,21"],
    ["34 a 38 anos", "R$ 697,86"],
  ];
  const pad = 50;
  const css =
    base(p) +
    `
#s3-c{position:absolute;left:${g.x}px;top:${g.y}px;width:${g.w}px;height:${g.h}px;border-radius:40px;background:#fff;color:${INK};overflow:hidden;box-shadow:0 40px 90px rgba(0,8,30,.55);}
#s3-hd{position:absolute;left:0;top:0;width:100%;height:${g.hh}px;background:${NAVY};}
#s3-ht{position:absolute;left:${pad}px;top:${Math.round(g.hh / 2 - g.hs * 0.95)}px;font-weight:800;font-size:${g.hs}px;color:#fff;}
#s3-hs{position:absolute;left:${pad}px;top:${Math.round(g.hh / 2 + g.hs * 0.25)}px;font-weight:500;font-size:${g.ss}px;color:rgba(255,255,255,.85);}
#s3-hb{position:absolute;right:${pad}px;top:${Math.round(g.hh / 2 - 26)}px;height:52px;padding:0 20px;border-radius:26px;background:${ORANGE};display:flex;align-items:center;font-family:"Mont",Arial,sans-serif;font-weight:800;font-size:${Math.round(g.ss * 1.05)}px;color:#fff;}
.s3-lb{position:absolute;top:${g.ly}px;font-weight:600;font-size:${g.ss}px;color:${MUTED};letter-spacing:.08em;}
.s3-r{position:absolute;left:${pad - 16}px;width:${g.w - (pad - 16) * 2}px;height:${g.rh}px;border-radius:24px;background:${SOFT};}
.s3-ic{position:absolute;left:18px;top:${Math.round((g.rh - g.ic) / 2)}px;width:${g.ic}px;height:${g.ic}px;border-radius:50%;background:${NAVY};display:flex;align-items:center;justify-content:center;}
.s3-a{position:absolute;left:${18 + g.ic + 24}px;top:${Math.round(g.rh / 2 - g.rs * 0.62)}px;font-weight:800;font-size:${g.rs}px;line-height:1;}
.s3-v{position:absolute;right:26px;top:${Math.round(g.rh / 2 - g.rs * 0.62)}px;font-weight:800;font-size:${g.rs}px;line-height:1;color:${NAVY};}
#s3-dv{position:absolute;left:${pad}px;top:${g.dv}px;width:${g.w - pad * 2}px;height:3px;background:#D5DCEE;}
.s3-t{position:absolute;left:${pad}px;width:${g.w - pad * 2}px;display:flex;justify-content:space-between;font-weight:600;font-size:${g.ts}px;color:${MUTED};}
#s3-f{position:absolute;left:${pad - 16}px;top:${g.fy}px;width:${g.w - (pad - 16) * 2}px;height:${g.fh}px;border-radius:30px;background:${ORANGE};color:#fff;box-shadow:0 18px 40px rgba(242,101,34,.4);}
#s3-fl{position:absolute;left:34px;top:${Math.round(g.fh / 2 - g.fl * 0.6)}px;font-weight:800;font-size:${g.fl}px;line-height:1.05;}
#s3-fp{position:absolute;right:34px;top:${Math.round(g.fh / 2 - g.fp * 0.62)}px;font-weight:900;font-size:${g.fp}px;line-height:1;letter-spacing:-.04em;}
#s3-n{position:absolute;left:0;width:100%;top:${g.ny}px;text-align:center;font-weight:500;font-size:${g.ns}px;color:${MUTED};}
#s3-n b{color:${GREEN};font-weight:600;}
`;
  const body = `
  <div id="s3-cam" class="${p}-full">
  <div id="s3-wrap" class="${p}-full">
    <div id="s3-c">
      <div id="s3-hd"><div id="s3-ht" class="d">Sua cotação</div><div id="s3-hs">SulAmérica PME · Capital · Apólice 12 meses</div><div id="s3-hb">3 vidas</div></div>
      <div class="s3-lb" style="left:${pad}px">FAIXA ETÁRIA</div><div class="s3-lb" style="right:${pad}px">VALOR</div>
      ${rows
        .map(
          ([a_, v], i) => `<div class="s3-r" id="s3-r${i}" style="top:${g.rows[i]}px"><div class="s3-ic">${icon("person", Math.round(g.ic * 0.58), { color: "#fff", sw: 3.6 })}</div>
        <div class="s3-a d">${a_}</div><div class="s3-v d">${v}</div></div>`,
        )
        .join("")}
      <div id="s3-dv"></div>
      <div class="s3-t" id="s3-t1" style="top:${g.t1}px"><span>Total</span><span>R$ 1.729,15</span></div>
      <div class="s3-t" id="s3-t2" style="top:${g.t2}px"><span>IOF (2,38%)</span><span>+ R$ 41,15</span></div>
      <div id="s3-f"><div id="s3-fl" class="d">Total<br>com IOF</div><div id="s3-fp" class="d">R$ 1.770,30</div><div id="s3-fsw" class="sweep" aria-hidden="true"></div></div>
      <div id="s3-n">Taxa de inscrição: <b>sem taxa</b></div>
    </div>
  </div>
  </div>`;
  drift("#s3-cam", dur, 1.02);
  add(`tl.fromTo("#s3-c",{y:${pick(240, 180)},opacity:0,scale:0.94},{y:0,opacity:1,scale:1,duration:0.5,ease:"power3.out"},0.05);`);
  // cada faixa entra quando é dita
  [T.zero, T.vinte, T.trinta3].forEach((t, i) =>
    add(`tl.fromTo("#s3-r${i}",{x:120,opacity:0},{x:0,opacity:1,duration:0.4,ease:"back.out(1.6)"},${r3(L(t) - 0.15)});`),
  );
  add(`tl.fromTo(["#s3-t1","#s3-t2"],{opacity:0,y:14},{opacity:1,y:0,duration:0.3,ease:"power3.out",stagger:0.12},${r3(L(T.oito) - 0.2)});`);
  add(`tl.fromTo("#s3-f",{scale:0.9,opacity:0},{scale:1,opacity:1,duration:0.4,ease:"back.out(1.8)"},0.35);`);
  add(`tl.fromTo("#s3-n",{opacity:0},{opacity:1,duration:0.4},0.55);`);
  add(`tl.fromTo("#s3-fsw",{xPercent:-100},{xPercent:100,duration:0.9,ease:"power2.inOut"},${r3(L(T.oito) + 0.05)});`);
  add(`tl.to("#s3-wrap",{x:-${pick(320, 280)},opacity:0,duration:0.24,ease:"power3.in"},${r3(dur - 0.24)});`);
  scenes.push({ st, track: 3, ...scene(p, dur, css, body, a) });
}

// ═════════════ 4 · benefícios ═════════════
{
  const p = "s4";
  const st = T.tem2 - 0.25;
  const dur = T.quer - 0.12 - st;
  const { a, L, add, words, drift } = TL(st);
  const g = pick(
    { py: 290, ph: 60, ps: 28, ty: 375, ts: 84, ry: [490, 650, 810, 970, 1130], rh: 140, ic: 96, rs: 42, ck: 66 },
    { py: 28, ph: 52, ps: 24, ty: 96, ts: 64, ry: [190, 330, 470, 610, 750], rh: 124, ic: 84, rs: 36, ck: 58 },
  );
  const rows = [
    ["globe", "Abrangência nacional", T.abrangencia],
    ["bed", "Acomodação em apartamento", T.apartamento],
    ["percent", "Coparticipação de 30%", T.copart],
    ["refund", "Reembolso", T.reembolso],
    ["ticket", "Sem taxa de inscrição", T.sem],
  ];
  const pad = Math.round((g.rh - g.ic) / 2);
  const css =
    base(p) +
    `
#s4-pw{position:absolute;left:0;width:${W}px;top:${g.py}px;text-align:center;}
#s4-pill{display:inline-flex;align-items:center;height:${g.ph}px;padding:0 ${Math.round(g.ph * 0.5)}px;border-radius:${g.ph}px;background:${ORANGE};font-weight:800;font-size:${g.ps}px;letter-spacing:.08em;}
#s4-t{position:absolute;left:0;width:${W}px;top:${g.ty}px;text-align:center;font-weight:900;font-size:${g.ts}px;line-height:1;letter-spacing:-.02em;}
.s4-r{position:absolute;left:60px;width:960px;height:${g.rh}px;border-radius:30px;background:#fff;color:${NAVY};box-shadow:0 22px 50px rgba(0,8,30,.4);}
.s4-ic{position:absolute;left:${pad}px;top:${pad}px;width:${g.ic}px;height:${g.ic}px;border-radius:50%;background:${ORANGE};display:flex;align-items:center;justify-content:center;}
.s4-tx{position:absolute;left:${pad * 2 + g.ic + 6}px;top:${Math.round(g.rh / 2 - g.rs * 0.62)}px;font-weight:800;font-size:${g.rs}px;line-height:1;white-space:nowrap;letter-spacing:-.01em;}
.s4-ck{position:absolute;right:${pad + 4}px;top:${Math.round((g.rh - g.ck) / 2)}px;width:${g.ck}px;height:${g.ck}px;}
`;
  const ck = (i) => `<svg class="s4-ck" viewBox="0 0 80 80" aria-hidden="true">
      <circle cx="40" cy="40" r="36" fill="none" stroke="#D5DCEE" stroke-width="5"/>
      <circle id="s4-cf${i}" cx="40" cy="40" r="38" fill="${GREEN}" opacity="0"/>
      <path id="s4-cp${i}" d="M24 41l11 11 21-24" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" pathLength="1" stroke-dasharray="1 1" stroke-dashoffset="1"/></svg>`;
  const body = `
  <div id="s4-cam" class="${p}-full">
  <div id="s4-wrap" class="${p}-full">
    <div id="s4-pw"><span id="s4-pill" class="d">ESPECIAL VITAL QP R1</span></div>
    <div id="s4-t" class="d">${wspans("s4t", "E ainda tem:")}</div>
    ${rows
      .map(
        ([ic, tx], i) => `<div class="s4-r" id="s4-r${i}" style="top:${g.ry[i]}px"><div class="s4-ic">${icon(ic, Math.round(g.ic * 0.56), { color: "#fff", sw: 3.4 })}</div>
      <div class="s4-tx d">${tx}</div>${ck(i)}</div>`,
      )
      .join("")}
  </div>
  </div>`;
  drift("#s4-cam", dur, 1.02);
  add(`tl.fromTo("#s4-pill",{scale:0.5,opacity:0},{scale:1,opacity:1,duration:0.4,ease:"back.out(2)"},0.05);`);
  words("s4t", [st + 0.12, st + 0.2, T.tem2], 0.36);
  rows.forEach(([, , t], i) => {
    add(`tl.fromTo("#s4-r${i}",{x:1100,rotation:2},{x:0,rotation:0,duration:0.5,ease:"power4.out"},${r3(L(t) - 0.2)});`);
    add(`tl.to("#s4-cf${i}",{opacity:1,duration:0.15},${r3(L(t) + 0.3)});`);
    add(`tl.to("#s4-cp${i}",{attr:{"stroke-dashoffset":0},duration:0.3,ease:"power2.out"},${r3(L(t) + 0.35)});`);
  });
  [0, 1, 2, 3, 4].forEach((i) => add(`tl.to("#s4-r${i}",{x:-1150,duration:0.3,ease:"power3.in"},${r3(dur - 0.36 + i * 0.03)});`));
  add(`tl.to(["#s4-pw","#s4-t"],{opacity:0,y:-40,duration:0.25,ease:"power2.in"},${r3(dur - 0.3)});`);
  scenes.push({ st, track: 4, ...scene(p, dur, css, body, a) });
}

// ═════════════ 5 · "Quer saber se você pode contratar?" ═════════════
{
  const p = "s5";
  const st = T.quer - 0.2;
  const dur = T.me - 0.1 - st;
  const { a, L, add, words } = TL(st);
  const g = pick({ cy: 420, cw: 620, ch: 300, cs: 110, ty: 840, ts: 92, ms: 230 }, { cy: 110, cw: 560, ch: 260, cs: 96, ty: 520, ts: 78, ms: 200 });
  const cx = (W - g.cw) / 2;
  const css =
    base(p) +
    `
#s5-c{position:absolute;left:${cx}px;top:${g.cy}px;width:${g.cw}px;height:${g.ch}px;border-radius:34px;background:#fff;color:${NAVY};box-shadow:0 30px 70px rgba(0,8,30,.5);}
#s5-ic{position:absolute;left:40px;top:50%;margin-top:-${Math.round(g.ch * 0.25)}px;}
#s5-cn{position:absolute;left:${40 + Math.round(g.ch * 0.5) + 30}px;top:${Math.round(g.ch / 2 - g.cs * 0.62)}px;font-weight:900;font-size:${g.cs}px;line-height:1;}
#s5-mg{position:absolute;left:${cx + g.cw * 0.45}px;top:${g.cy + g.ch * 0.2}px;}
#s5-t{position:absolute;left:0;width:${W}px;top:${g.ty}px;text-align:center;font-weight:900;font-size:${g.ts}px;line-height:1.08;letter-spacing:-.02em;}
#s5-t .hl{color:${HL};}
`;
  const body = `
  <div id="s5-wrap" class="${p}-full">
    <div id="s5-c"><div id="s5-ic">${icon("building", Math.round(g.ch * 0.5), { color: NAVY, sw: 3 })}</div><div id="s5-cn" class="d">CNPJ</div></div>
    <div id="s5-mg">${icon("search", g.ms, { color: ORANGE, sw: 4.4 })}</div>
    <div id="s5-t" class="d">${wspans("s5a", "Você pode")}<br>${wspans("s5b", "contratar?", "hl")}</div>
  </div>`;
  add(`tl.fromTo("#s5-c",{scale:0.7,opacity:0},{scale:1,opacity:1,duration:0.4,ease:"back.out(1.8)"},0.02);`);
  add(`tl.fromTo("#s5-mg",{x:-${pick(320, 260)},y:60,opacity:0,rotation:-20},{x:0,y:0,opacity:1,rotation:0,duration:0.5,ease:"power3.out"},0.12);`);
  add(`tl.to("#s5-mg",{x:-${pick(220, 180)},duration:0.5,ease:"sine.inOut",yoyo:true,repeat:1},0.65);`);
  words("s5a", [T.quer, at("saber")], 0.34);
  words("s5b", [at("pode", T.quer)], 0.34);
  add(`tl.to("#s5-wrap",{scale:0.9,opacity:0,duration:0.2,ease:"power2.in"},${r3(dur - 0.2)});`);
  scenes.push({ st, track: 5, ...scene(p, dur, css, body, a) });
}

// ═════════════ 6 · conversa no WhatsApp: "Me chama no WhatsApp que eu te ajudo…" ═════════════
{
  const p = "s6";
  const st = T.me - 0.2;
  const dur = T.nao2 - 0.15 - st;
  const { a, L, add, drift } = TL(st);
  const g = pick(
    { x: 190, y: 270, w: 700, h: 1070, br: 70, hh: 130, ms: 32, b1: 220, b2: 420, ty: 420, b3: 420, iy: 950 },
    { x: 300, y: 26, w: 480, h: 890, br: 56, hh: 104, ms: 24, b1: 170, b2: 330, ty: 330, b3: 330, iy: 800 },
  );
  const sw = g.w - 32;
  const css =
    base(p) +
    `
#s6-ph{position:absolute;left:${g.x}px;top:${g.y}px;width:${g.w}px;height:${g.h}px;border-radius:${g.br}px;background:#10162B;padding:16px;box-shadow:0 50px 100px rgba(0,8,30,.6),inset 0 0 0 3px rgba(255,255,255,.12);}
#s6-sc{position:relative;width:100%;height:100%;border-radius:${g.br - 14}px;overflow:hidden;background:#EFEAE2;color:#1B1F2A;}
#s6-hd{position:absolute;left:0;top:0;width:100%;height:${g.hh}px;background:${NAVY};display:flex;align-items:center;gap:20px;padding:24px 28px 0;}
#s6-av{width:${Math.round(g.hh * 0.56)}px;height:${Math.round(g.hh * 0.56)}px;border-radius:50%;background:${ORANGE};display:flex;align-items:center;justify-content:center;}
#s6-nm{color:#fff;font-weight:600;font-size:${Math.round(g.ms * 0.95)}px;line-height:1.2;}
#s6-nm span{display:block;font-weight:400;font-size:${Math.round(g.ms * 0.7)}px;color:#BFE9CF;}
.s6-b{position:absolute;max-width:${Math.round(sw * 0.78)}px;padding:${Math.round(g.ms * 0.6)}px ${Math.round(g.ms * 0.8)}px;border-radius:${Math.round(g.ms * 0.8)}px;font-size:${g.ms}px;line-height:1.3;box-shadow:0 2px 0 rgba(0,0,0,.08);}
#s6-b1{right:24px;top:${g.b1}px;background:#D9FDD3;border-top-right-radius:6px;}
#s6-b2{left:24px;top:${g.b2}px;background:#fff;border-top-left-radius:6px;}
#s6-ty{position:absolute;left:24px;top:${g.ty}px;background:#fff;border-radius:${Math.round(g.ms * 0.8)}px;padding:${Math.round(g.ms * 0.55)}px ${Math.round(g.ms * 0.8)}px;display:flex;gap:10px;}
.s6-d{width:${Math.round(g.ms * 0.4)}px;height:${Math.round(g.ms * 0.4)}px;border-radius:50%;background:#9AA3B5;}
.s6-tk{display:block;text-align:right;font-size:${Math.round(g.ms * 0.62)}px;color:#5B8DEF;margin-top:4px;}
#s6-in{position:absolute;left:18px;right:18px;top:${g.iy}px;height:${Math.round(g.ms * 2.6)}px;display:flex;gap:14px;align-items:center;}
#s6-if{flex:1;height:100%;border-radius:${g.ms * 2}px;background:#fff;color:#8A93A6;font-size:${g.ms}px;display:flex;align-items:center;padding-left:26px;}
#s6-sd{width:${Math.round(g.ms * 2.6)}px;height:${Math.round(g.ms * 2.6)}px;border-radius:50%;background:${GREEN};display:flex;align-items:center;justify-content:center;}
`;
  const body = `
  <div id="s6-cam" class="${p}-full">
  <div id="s6-wrap" class="${p}-full">
    <div id="s6-ph"><div id="s6-sc">
      <div id="s6-hd"><div id="s6-av">${icon("person", Math.round(g.hh * 0.34), { color: "#fff", sw: 3.6 })}</div><div id="s6-nm">Seu consultor SulAmérica PME<span>online</span></div></div>
      <div class="s6-b" id="s6-b1">Oi! Tenho CNPJ e quero a cotação do SulAmérica PME.<span class="s6-tk" id="s6-tk"><svg viewBox="0 0 36 20" width="${Math.round(g.ms * 1.1)}" height="${Math.round(g.ms * 0.62)}" aria-hidden="true"><path d="M2 11l5 5 11-12M14 14l2 2 11-12" fill="none" stroke="#3B82F6" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg></span></div>
      <div id="s6-ty"><span class="s6-d" id="s6-d0"></span><span class="s6-d" id="s6-d1"></span><span class="s6-d" id="s6-d2"></span></div>
      <div class="s6-b" id="s6-b2">Oi! Eu te ajudo a ver as condições pra você e pra sua família.</div>
      <div id="s6-in"><div id="s6-if">Mensagem</div><div id="s6-sd">${icon("send", Math.round(g.ms * 1.2), { color: "#fff", sw: 3.4 })}</div></div>
    </div></div>
  </div>
  </div>`;
  drift("#s6-cam", dur, 1.02);
  add(`tl.fromTo("#s6-ph",{y:${pick(500, 400)},rotation:-6,opacity:0},{y:0,rotation:0,opacity:1,duration:0.55,ease:"power4.out"},0.02);`);
  add(`tl.fromTo("#s6-b1",{scale:0.5,opacity:0,y:30},{scale:1,opacity:1,y:0,duration:0.35,ease:"back.out(2)",transformOrigin:"100% 100%"},${r3(L(T.whatsapp))});`);
  add(`tl.fromTo("#s6-tk",{opacity:0},{opacity:1,duration:0.2},${r3(L(T.whatsapp) + 0.5)});`);
  // digitando… e a resposta do consultor quando ele diz "eu te ajudo"
  add(`tl.fromTo("#s6-ty",{opacity:0,scale:0.6},{opacity:1,scale:1,duration:0.18,ease:"back.out(2)"},${r3(L(T.whatsapp) + 0.4)});`);
  [0, 1, 2].forEach((i) => add(`tl.fromTo("#s6-d${i}",{y:0},{y:-10,duration:0.18,ease:"sine.inOut",repeat:3,yoyo:true},${r3(L(T.whatsapp) + 0.5 + i * 0.1)});`));
  add(`tl.to("#s6-ty",{opacity:0,duration:0.1},${r3(L(T.ajudo) - 0.05)});`);
  add(`tl.fromTo("#s6-b2",{scale:0.5,opacity:0,y:30},{scale:1,opacity:1,y:0,duration:0.35,ease:"back.out(2)",transformOrigin:"0% 100%"},${r3(L(T.ajudo) - 0.02)});`);
  add(`tl.to("#s6-wrap",{y:-${pick(160, 100)},opacity:0,duration:0.26,ease:"power3.in"},${r3(dur - 0.26)});`);
  scenes.push({ st, track: 6, ...scene(p, dur, css, body, a) });
}

// ═════════════ 7 · CTA: "Clica no botão e fala comigo!" ═════════════
const BTN = pick({ x: 90, y: 1036, w: 900, h: 140 }, { x: 140, y: 584, w: 800, h: 104 });
{
  const p = "s7";
  const st = T.nao2 - 0.3;
  const dur = D - st;
  const { a, L, add, words, drift } = TL(st);
  const g = pick(
    { lw: 520, ly: 270, ty: 440, ts: 74, cy: 640, ch: 360, cl: 40, cp: 112, cx: 70, cw: 940, ks: 24, bt: 50, fy: 1206, fs: 19, y1: 30, y2: 84, y3: 208, y4: 268 },
    { lw: 360, ly: 26, ty: 130, ts: 54, cy: 282, ch: 284, cl: 32, cp: 88, cx: 140, cw: 800, ks: 20, bt: 42, fy: 712, fs: 17, y1: 22, y2: 66, y3: 164, y4: 212 },
  );
  const css =
    base(p) +
    `
#s7-lw{position:absolute;left:0;width:${W}px;top:${g.ly}px;text-align:center;}
#s7-t{position:absolute;left:0;width:${W}px;top:${g.ty}px;text-align:center;font-weight:900;font-size:${g.ts}px;line-height:1.08;letter-spacing:-.02em;}
#s7-t .hl{color:${HL};}
#s7-c{position:absolute;left:${g.cx}px;top:${g.cy}px;width:${g.cw}px;height:${g.ch}px;border-radius:36px;background:#fff;color:${NAVY};box-shadow:0 30px 70px rgba(0,8,30,.5);text-align:center;}
#s7-cl{position:absolute;left:0;width:100%;top:${g.y1}px;font-weight:800;font-size:${g.cl}px;}
#s7-cp{position:absolute;left:0;width:100%;top:${g.y2}px;font-weight:900;font-size:${g.cp}px;line-height:1;letter-spacing:-.045em;}
#s7-cp small{font-size:.36em;letter-spacing:0;font-weight:700;margin-left:.15em;}
#s7-ci{position:absolute;left:0;width:100%;top:${g.y3}px;}
#s7-ci span{display:inline-block;padding:6px 18px;border-radius:20px;background:${ORANGE};color:#fff;font-family:"Mont",Arial,sans-serif;font-weight:800;font-size:${Math.round(g.cl * 0.72)}px;}
#s7-ck{position:absolute;left:30px;right:30px;top:${g.y4}px;line-height:1.35;font-weight:500;font-size:${g.ks}px;color:${MUTED};}
#s7-bw{position:absolute;left:${BTN.x}px;top:${BTN.y}px;width:${BTN.w}px;height:${BTN.h}px;}
#s7-ring{position:absolute;inset:0;border-radius:${BTN.h}px;border:5px solid rgba(37,211,102,.9);opacity:0;}
#s7-btn{position:absolute;inset:0;border-radius:${BTN.h}px;background:${GREEN};display:flex;align-items:center;justify-content:center;gap:22px;font-weight:800;font-size:${g.bt}px;box-shadow:0 20px 50px rgba(14,159,74,.5),inset 0 2px 0 rgba(255,255,255,.3);overflow:hidden;}
#s7-f{position:absolute;left:${pick(70, 60)}px;width:${W - pick(140, 120)}px;top:${g.fy}px;text-align:center;font-size:${g.fs}px;line-height:1.4;color:rgba(255,255,255,.8);}
`;
  const body = `
  <div id="s7-cam" class="${p}-full">
  <div id="s7-wrap" class="${p}-full">
    <div id="s7-lw">${logo(p, g.lw)}</div>
    <div id="s7-t" class="d">${wspans("s7a", "Cuide da saúde")}<br>${wspans("s7b", "antes de precisar", "hl")}</div>
    <div id="s7-c">
      <div id="s7-cl" class="d">SulAmérica PME · 3 vidas</div>
      <div id="s7-cp" class="d">R$ 1.770,30<small>/mês</small></div>
      <div id="s7-ci"><span>já com IOF</span></div>
      <div id="s7-ck">Nacional · Apartamento · Coparticipação · Reembolso · Sem taxa de inscrição</div>
    </div>
    <div id="s7-bw"><div id="s7-ring"></div><div id="s7-btn" class="d">${icon("chat", Math.round(g.bt * 1.25), { id: "s7-chat", color: "#fff", sw: 3.2 })}<span>Fale comigo no WhatsApp</span><div id="s7-bsw" class="sweep" aria-hidden="true"></div></div></div>
    <div id="s7-f">Cotação SulAmérica PME | Capital – 03 a 04 vidas – Apólice 12 meses · Especial Vital QP R1 · Compulsório · 30% de coparticipação · Reembolso. Valores para 3 beneficiários (0 a 18, 29 a 33 e 34 a 38 anos): R$ 1.729,15 + IOF de 2,38% = R$ 1.770,30/mês. Sem taxa de inscrição. Contratação sujeita à análise e às condições da operadora.</div>
  </div>
  </div>`;
  drift("#s7-cam", dur, 1.015);
  add(`tl.fromTo("#s7-lgw",{clipPath:"inset(0% 100% 0% 0%)"},{clipPath:"inset(0% 0% 0% 0%)",duration:0.6,ease:"power2.inOut"},0.05);`);
  add(`tl.fromTo("#s7-lgt",{opacity:0},{opacity:1,duration:0.4},0.3);`);
  words("s7a", [T.nao2, at("deixa"), T.saude2], 0.36);
  words("s7b", [at("so", T.saude2), at("quando", T.saude2), T.precisar], 0.36);
  add(`tl.fromTo("#s7-c",{y:${pick(200, 150)},opacity:0},{y:0,opacity:1,duration:0.5,ease:"power3.out"},0.4);`);
  add(`tl.fromTo("#s7-bw",{scale:0.6,opacity:0},{scale:1,opacity:1,duration:0.5,ease:"back.out(1.8)"},0.7);`);
  add(`tl.fromTo("#s7-f",{opacity:0},{opacity:1,duration:0.5},0.9);`);
  // "Clica no botão" — brilho, toque e pulsos
  add(`tl.fromTo("#s7-bsw",{xPercent:-100},{xPercent:100,duration:0.8,ease:"power2.inOut"},${r3(L(T.clica) - 0.1)});`);
  add(`tl.fromTo("#s7-chat",{rotation:0},{rotation:14,duration:0.1,ease:"sine.inOut",repeat:5,yoyo:true},${r3(L(T.clica))});`);
  const tp = L(TAP);
  add(`tl.fromTo("#s7-btn",{scale:1},{scale:0.95,duration:0.1,ease:"power2.in"},${tp});`);
  add(`tl.to("#s7-btn",{scale:1,duration:0.3,ease:"back.out(2)"},${r3(tp + 0.1)});`);
  add(`tl.fromTo("#s7-ring",{opacity:0.95,scale:1},{opacity:0,scale:1.15,duration:0.7,ease:"power2.out"},${r3(tp + 0.05)});`);
  for (let t = tp + 1.0, i = 0; t + 1.0 <= dur - 0.9; t += 1.0, i++) {
    add(`tl.fromTo("#s7-btn",{scale:1},{scale:1.04,duration:0.5,ease:"sine.inOut",immediateRender:false},${r3(t)});`);
    add(`tl.to("#s7-btn",{scale:1,duration:0.5,ease:"sine.inOut"},${r3(t + 0.5)});`);
    add(`tl.fromTo("#s7-ring",{opacity:0.7,scale:1},{opacity:0,scale:1.12,duration:0.9,ease:"power2.out",immediateRender:false},${r3(t)});`);
  }
  scenes.push({ st, track: 7, ...scene(p, dur, css, body, a) });
}

// ═════════════ legendas palavra a palavra ═════════════
// grupos com o texto de exibição e o intervalo de palavras (índices em vo.words.json)
const CAP = [
  [["Ei,", 0], ["você", 1], ["tem", 2], ["CNPJ?", 3]],
  [["E", 4], ["ainda", 5], ["não", 6], ["tem", 7]],
  [["plano", 8], ["de", 9], ["saúde", 10], ["empresarial?", 11]],
  [["Sério?!", 12]],
  [["Então", 13], ["presta", 14], ["atenção.", 15]],
  [["Olha", 16], ["só:", 17], ["SulAmérica", 18], ["PME", 19]],
  [["pra", 20], ["3", 21], ["vidas", 22]],
  [["por", 23], ["R$ 1.770,30", 24, 31], ["por", 32], ["mês,", 33]],
  [["já", 34], ["com", 35], ["IOF,", 36], ["hein!", 37]],
  [["É", 38], ["pra", 39], ["uma", 40], ["pessoa", 41]],
  [["de", 42], ["0 a 18", 43, 45], ["anos,", 46]],
  [["uma", 47], ["de", 48], ["29 a 33", 49, 55]],
  [["e", 56], ["outra", 57], ["de", 58], ["34 a 38.", 59, 65]],
  [["Tem", 66], ["abrangência", 67], ["nacional,", 68]],
  [["apartamento,", 69]],
  [["coparticipação,", 70]],
  [["reembolso", 71]],
  [["e", 72], ["sem", 73], ["taxa", 74], ["de", 75], ["inscrição.", 76]],
  [["Quer", 77], ["saber", 78], ["se", 79], ["você", 80]],
  [["pode", 81], ["contratar?", 82]],
  [["Me", 83], ["chama", 84], ["no", 85], ["WhatsApp", 86]],
  [["que", 87], ["eu", 88], ["te", 89], ["ajudo", 90]],
  [["a", 91], ["ver", 92], ["as", 93], ["condições", 94]],
  [["pra", 95], ["você", 96], ["e", 97], ["pra", 98], ["sua", 99], ["família.", 100]],
  [["Não", 101], ["deixa", 102], ["pra", 103], ["pensar", 104]],
  [["na", 105], ["saúde", 106], ["só", 107]],
  [["quando", 108], ["precisar,", 109], ["tá?", 110]],
  [["Clica", 111], ["no", 112], ["botão", 113]],
  [["e", 114], ["fala", 115], ["comigo!", 116]],
];
{
  const p = "cap";
  const { a, add } = TL(0);
  const g = pick({ y: 1390, h: 110, fs: 54 }, { y: 950, h: 92, fs: 44 });
  const css =
    base(p) +
    `
.cap-g{position:absolute;left:40px;width:${W - 80}px;top:${g.y}px;height:${g.h}px;display:flex;justify-content:center;align-items:center;opacity:0;}
.cap-in{display:inline-block;padding:10px 26px;border-radius:24px;background:rgba(0,12,40,.62);font-family:"Mont",Arial,sans-serif;font-weight:800;font-size:${g.fs}px;line-height:1.15;letter-spacing:-.01em;word-spacing:.06em;white-space:nowrap;}
.cap-w{display:inline-block;color:rgba(255,255,255,.45);}
`;
  const tok = (gi, k) => `cap-w${gi}-${k}`;
  const body = CAP.map(
    (grp, gi) =>
      `<div class="cap-g" id="cap-g${gi}"><span class="cap-in">${grp.map(([tx], k) => `<span class="cap-w" id="${tok(gi, k)}">${tx}</span>`).join(" ")}</span></div>`,
  ).join("\n");
  const s0 = (gi) => WORDS[CAP[gi][0][1]].start;
  const e0 = (gi) => {
    const last = CAP[gi][CAP[gi].length - 1];
    return WORDS[last[2] ?? last[1]].end;
  };
  CAP.forEach((grp, gi) => {
    const on = r3(Math.max(0, s0(gi) - 0.08));
    const next = gi + 1 < CAP.length ? s0(gi + 1) - 0.1 : D - 0.2;
    const off = r3(Math.min(next, e0(gi) + 0.9));
    add(`tl.fromTo("#cap-g${gi}",{opacity:0,y:18},{opacity:1,y:0,duration:0.14,ease:"power2.out"},${on});`);
    add(`tl.to("#cap-g${gi}",{opacity:0,duration:0.1},${r3(Math.max(on + 0.2, off))});`);
    grp.forEach(([, i0, i1], k) => {
      const ws = WORDS[i0].start;
      const we = WORDS[i1 ?? i0].end;
      add(`tl.set("#${tok(gi, k)}",{color:"${HL}"},${r3(ws)});`);
      add(`tl.set("#${tok(gi, k)}",{color:"#FFFFFF"},${r3(Math.max(ws + 0.12, we))});`);
    });
  });
  scenes.push({ st: 0, track: 8, ...scene(p, D, css, body, a) });
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
#ui-f{position:absolute;left:${fx - FS / 2}px;top:${fy - FS / 2}px;width:${FS}px;height:${FS}px;border-radius:50%;background:radial-gradient(circle,rgba(255,255,255,.75) 0 34%,rgba(255,255,255,.32) 36% 100%);border:2px solid rgba(255,255,255,.95);box-shadow:0 0 0 1.5px rgba(0,18,61,.35),0 10px 26px rgba(0,8,30,.45);opacity:0;}
#ui-fl{position:absolute;inset:0;background:radial-gradient(70% 50% at 50% 40%,rgba(255,220,190,.85),rgba(242,101,34,.3) 60%,rgba(242,101,34,0));opacity:0;}
#ui-tex{position:absolute;left:-128px;top:-128px;width:${W + 256}px;height:${H + 256}px;background:url("${NOISE}") 0 0/256px 256px repeat;opacity:.04;mix-blend-mode:overlay;}`;
  const body = `<div id="ui-fl" aria-hidden="true"></div><div id="ui-tex" data-layout-allow-overflow aria-hidden="true"></div><div id="ui-f"></div>`;
  [
    [T.sula - 0.05, 0.4],
    [T.nao2 - 0.25, 0.3],
  ].forEach(([t, o], i) => {
    add(`tl.fromTo("#ui-fl",{opacity:0},{opacity:${o},duration:0.08,ease:"power2.out"${i ? ",immediateRender:false" : ""}},${r3(t)});`);
    add(`tl.to("#ui-fl",{opacity:0,duration:0.45,ease:"power2.out"},${r3(t + 0.08)});`);
  });
  add(`tl.fromTo("#ui-f",{opacity:0,x:${pick(150, 120)},y:${pick(200, 150)},scale:1.15},{opacity:1,x:0,y:0,scale:1,duration:0.5,ease:"power3.out"},${r3(TAP - 0.55)});`);
  add(`tl.to("#ui-f",{scale:0.82,duration:0.1,ease:"power2.in"},${r3(TAP)});`);
  add(`tl.to("#ui-f",{scale:1,duration:0.18,ease:"power2.out"},${r3(TAP + 0.12)});`);
  add(`tl.to("#ui-f",{opacity:0,x:${pick(90, 70)},y:${pick(120, 90)},duration:0.4,ease:"power2.in"},${r3(TAP + 0.5)});`);
  let s = 53;
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
  ["pop", T.ei, 0.22],
  ["card", T.voce - 0.15, 0.28],
  ["check", T.cnpj + 0.2, 0.32],
  ["card", T.plano - 0.2, 0.28],
  ["tap", T.empresarial + 0.12, 0.22],
  ["boing", T.serio, 0.5],
  ["pop", T.serio + 0.02, 0.3],
  ["whoosh", T.atencao - 0.1, 0.3],
  ["riser", T.sula - 0.05, 0.36],
  ["impact", T.sula - 0.05, 0.42],
  ["shimmer", T.sula, 0.32],
  ["tap", T.pme, 0.22],
  ["card", T.pme + 0.15, 0.22],
  ["pop", T.tres, 0.22],
  ["pop", T.tres + 0.12, 0.2],
  ["pop", T.tres + 0.24, 0.2],
  ["counter", T.mil, 0.18],
  ["shimmer", T.centavos + 0.1, 0.22],
  ["stamp", T.iof, 0.6],
  ["whoosh", T.e_pra - 0.35, 0.32],
  ["card", T.e_pra - 0.3, 0.26],
  ["pop", T.zero - 0.12, 0.26],
  ["pop", T.vinte - 0.12, 0.26],
  ["pop", T.trinta3 - 0.12, 0.26],
  ["check", T.oito, 0.28],
  ["whoosh", T.tem2 - 0.25, 0.3],
  ["check", T.abrangencia + 0.3, 0.26],
  ["check", T.apartamento + 0.3, 0.26],
  ["check", T.copart + 0.3, 0.26],
  ["check", T.reembolso + 0.3, 0.26],
  ["check", T.sem + 0.3, 0.26],
  ["whoosh", T.quer - 0.2, 0.28],
  ["tap", T.quer + 0.4, 0.2],
  ["whoosh", T.me - 0.2, 0.3],
  ["pop", T.whatsapp, 0.42],
  ["pop", T.ajudo, 0.42],
  ["whoosh", T.nao2 - 0.3, 0.26],
  ["shimmer", T.nao2 - 0.2, 0.26],
  ["shimmer", T.clica, 0.28],
  ["tap", TAP, 0.75],
  ["check", TAP + 0.05, 0.3],
];
const SFX_DUR = { counter: 2.4 };
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
  `<audio id="el-bgm" src="assets/audio/bgm.wav" data-start="0" data-duration="${D}" data-track-index="20" data-volume="0.42"></audio>`,
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
console.log(`${FMT} ${W}x${H}: ${D}s, ${scenes.length} composições, ${SFX.length} SFX, ${CAP.length} grupos de legenda`);
