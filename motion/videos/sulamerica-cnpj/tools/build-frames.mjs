#!/usr/bin/env node
// build-frames.mjs — gera as 5 sub-composições do filme white-label
// "SulAmérica para CNPJ" (sem marca de corretora).
//
//   node tools/build-frames.mjs   -> compositions/frames/0N-*.html
//
// Tudo que parece "aleatório" (bokeh, grão, raios) é sorteado AQUI, com semente
// fixa, e escrito estático no HTML: o runtime não tem Math.random nem relógio.
// Grade musical: 100 BPM, compasso 2.4 s — os marcos de cada cena (checks,
// trava de preço) caem nos tempos usados pelos SFX em audio_meta.json.

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "compositions/frames");
const W = 1080;
const H = 1920;

// Locução: cada fala entra 0.2 s após o início da cena (tools/voice.py).
// Os tempos abaixo vêm dos word_timestamps da HeyGen + esse 0.2 s.
const NAVY = "#07122B";
const GOLD = "#C9A86A";
const PAPER = "#F4F7FF";
const ORANGE = "#F26522";
const SA_NAVY = "#001E62";

// ───────────────────────── utilidades ─────────────────────────

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
const r2 = (x) => Math.round(x * 100) / 100;

const FONTS = `
@font-face{font-family:"Lora";font-weight:500;font-style:italic;font-display:block;src:url("assets/fonts/Lora-500-Italic.woff2") format("woff2");}
@font-face{font-family:"Montserrat";font-weight:500;font-style:normal;font-display:block;src:url("assets/fonts/Montserrat-500.woff2") format("woff2");}
@font-face{font-family:"Montserrat";font-weight:700;font-style:normal;font-display:block;src:url("assets/fonts/Montserrat-700.woff2") format("woff2");}
@font-face{font-family:"Montserrat";font-weight:800;font-style:normal;font-display:block;src:url("assets/fonts/Montserrat-800.woff2") format("woff2");}
@font-face{font-family:"Montserrat";font-weight:900;font-style:normal;font-display:block;src:url("assets/fonts/Montserrat-900.woff2") format("woff2");}`;

const GRAIN_SVG =
  "data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E";

/** CSS comum a toda cena, com prefixo p para não colidir no index montado */
function baseCss(p, tint) {
  return `
${FONTS}
#${p}-root{position:absolute;inset:0;width:100%;height:100%;overflow:hidden;color:${PAPER};font-family:"Montserrat",Arial,sans-serif;}
.${p}-ground{position:absolute;inset:0;overflow:hidden;background:${NAVY};}
.${p}-bg{position:absolute;inset:-6%;}
.${p}-ray{position:absolute;top:-30%;width:260px;height:160%;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.11),transparent);filter:blur(28px);mix-blend-mode:screen;}
.${p}-bokeh{position:absolute;border-radius:50%;background:radial-gradient(circle,rgba(255,255,255,0.85) 0%,rgba(255,255,255,0.25) 45%,rgba(255,255,255,0) 70%);mix-blend-mode:screen;}
.${p}-stage{position:absolute;inset:0;}
.${p}-grain{position:absolute;inset:0;overflow:hidden;pointer-events:none;mix-blend-mode:overlay;opacity:0.16;}
.${p}-grain-tex{position:absolute;top:-50%;left:-50%;width:200%;height:200%;background:url("${GRAIN_SVG}");background-size:256px 256px;}
.${p}-vignette{position:absolute;inset:0;pointer-events:none;background:radial-gradient(120% 85% at 50% 45%,rgba(0,0,0,0) 55%,rgba(0,0,0,0.55) 100%);}
.${p}-tint{position:absolute;inset:0;background:${tint};}
`;
}

/** raios de luz + bokeh determinísticos */
function atmosphere(p, seed, { rays = 3, bokeh = 26, color = "255,255,255" } = {}) {
  const R = rng(seed);
  let html = "";
  const anims = [];
  for (let i = 0; i < rays; i++) {
    const x = r2(-200 + R() * (W + 200));
    const rot = r2(-28 + R() * 14);
    const op = r2(0.35 + R() * 0.5);
    html += `<div class="${p}-ray" id="${p}-ray${i}" data-layout-allow-overflow style="left:${x}px;opacity:${op}"></div>`;
    anims.push({ sel: `#${p}-ray${i}`, dx: r2(60 + R() * 140), rot0: rot, rot: r2(rot + (R() - 0.5) * 6), op: r2(op * (0.4 + R() * 0.6)) });
  }
  const bk = [];
  for (let i = 0; i < bokeh; i++) {
    const s = r2(8 + Math.pow(R(), 2.2) * 120);
    const x = r2(R() * W);
    const y = r2(R() * H);
    const blur = r2(s > 60 ? 6 + R() * 10 : R() * 3);
    const op = r2(0.08 + R() * (s > 60 ? 0.2 : 0.55));
    html += `<div class="${p}-bokeh" id="${p}-bk${i}" style="width:${s}px;height:${s}px;left:${x}px;top:${y}px;filter:blur(${blur}px);opacity:${op};background:radial-gradient(circle,rgba(${color},0.9) 0%,rgba(${color},0.25) 45%,rgba(${color},0) 70%)"></div>`;
    bk.push({ sel: `#${p}-bk${i}`, dy: r2(-(40 + R() * 160) * (s / 60 + 0.4)), dx: r2((R() - 0.5) * 60) });
  }
  return { html, anims, bk };
}

function atmosphereTl(p, atm, D) {
  const lines = [];
  for (const a of atm.anims) {
    lines.push(`tl.fromTo("${a.sel}",{x:0,rotation:${a.rot0}},{x:${a.dx},rotation:${a.rot},opacity:${a.op},duration:${D},ease:"sine.inOut"},0);`);
  }
  for (const b of atm.bk) {
    lines.push(`tl.fromTo("${b.sel}",{x:0,y:0},{x:${b.dx},y:${b.dy},duration:${D},ease:"none"},0);`);
  }
  return lines.join("\n");
}

/** grão de filme: salta de posição 12x por segundo (stepped, seek-safe) */
function grainTl(p, D, seed) {
  const R = rng(seed);
  const lines = [];
  const step = 1 / 12;
  for (let t = 0; t < D; t += step) {
    lines.push(`tl.set("#${p}-grain-tex",{x:${Math.round((R() - 0.5) * 300)},y:${Math.round((R() - 0.5) * 300)}},${r2(t)});`);
  }
  return lines.join("\n");
}

const overlays = (p) =>
  `<div class="${p}-vignette"></div><div class="${p}-grain"><div class="${p}-grain-tex" id="${p}-grain-tex"></div></div>`;

function frameFile({ id, p, D, css, ground, stage, tl }) {
  return `<template>
<style>
${css}
</style>
<div id="${p}-root" data-composition-id="${id}" data-start="0" data-duration="${D}" data-width="${W}" data-height="${H}">
  <div class="clip ${p}-ground" id="${p}-ground" data-start="0" data-duration="${D}" data-track-index="0">
${ground}
  </div>
  <div class="${p}-stage" id="${p}-stage">
${stage}
  </div>
  ${overlays(p)}
</div>
<script src="assets/vendor/gsap.min.js"></script>
<script>
(function(){
const tl = gsap.timeline({ paused: true });
${tl}
window.__timelines["${id}"] = tl;
})();
</script>
</template>
`;
}

/** rodas de dígitos (number-wheel do registry, montadas estaticamente) */
function priceWheel(p, value) {
  // value: "1.697,90"
  let html = "";
  const strips = [];
  let i = 0;
  for (const ch of value) {
    if (!/\d/.test(ch)) {
      html += `<span class="${p}-pw-sep">${ch}</span>`;
      continue;
    }
    const stops = 10 + Number(ch);
    let digits = "";
    for (let k = 0; k <= stops; k++) digits += `<span>${k % 10}</span>`;
    html += `<span class="${p}-pw-digit"><span class="${p}-pw-strip" id="${p}-pw${i}" data-layout-allow-overflow>${digits}</span></span>`;
    strips.push({ sel: `#${p}-pw${i}`, yp: r2((-100 * stops) / (stops + 1)) });
    i++;
  }
  return { html, strips };
}

const CHECK_SVG = (p, i, color) =>
  `<svg class="${p}-check" viewBox="0 0 56 56"><circle cx="28" cy="28" r="26" fill="${color}"/><path id="${p}-ck${i}" d="M16 29 l8 8 l16 -18" fill="none" stroke="#fff" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="40" stroke-dashoffset="40"/></svg>`;

// ───────────────────────── cenas ─────────────────────────

const SA_WORD = (p, size = 72) =>
  `<span class="${p}-wm" style="font-size:${size}px;color:${SA_NAVY}">Sul<span style="color:${ORANGE}">América</span></span>`;

const pillCss = (p) => `
.${p}-pill-wrap{position:absolute;left:0;right:0;display:flex;justify-content:center;}
.${p}-pill{height:132px;padding:0 60px;display:flex;align-items:center;border-radius:999px;background:#fff;box-shadow:0 24px 60px rgba(0,0,0,0.35),0 0 0 6px rgba(255,255,255,0.12);white-space:nowrap;}
.${p}-wm{font-weight:800;line-height:1;letter-spacing:-0.02em;}
.${p}-tag-wrap{position:absolute;left:0;right:0;display:flex;justify-content:center;}
.${p}-tag{padding:18px 40px;border-radius:999px;background:${ORANGE};color:#fff;font-weight:800;font-size:36px;letter-spacing:0.14em;white-space:nowrap;box-shadow:0 14px 40px rgba(242,101,34,0.45);}
`;

const footText =
  "*Valores para 2 adultos até 38 anos e 1 jovem até 18 anos. Os valores podem variar conforme o perfil do beneficiário.";

// 01 — dor: hospital em tela cheia + "Está pagando caro no plano de saúde?"
function pain() {
  const p = "s1";
  const D = 4.0;
  const atm = atmosphere(p, 111, { rays: 2, bokeh: 10, color: "255,190,150" });
  const W1 = [
    { w: "Está", at: 0.47, line: 0 },
    { w: "pagando", at: 0.74, line: 0 },
    { w: "caro", at: 1.17, line: 1 },
    { w: "no", at: 1.67, line: 2 },
    { w: "plano", at: 2.02, line: 2 },
    { w: "de", at: 2.29, line: 2 },
    { w: "saúde?", at: 2.37, line: 2 },
  ];
  const lines = [[], [], []];
  W1.forEach((x, i) => lines[x.line].push(`<span class="${p}-w" id="${p}-w${i}">${x.w}</span>`));
  const stage = `
<div class="${p}-head">
  <div class="${p}-line ${p}-l1">${lines[0].join("")}</div>
  <div class="${p}-line ${p}-l2"><span class="${p}-caro-wrap">${lines[1].join("")}<span class="${p}-swipe" id="${p}-swipe"></span></span></div>
  <div class="${p}-line ${p}-l3">${lines[2].join("")}</div>
</div>`;
  const css =
    baseCss(p, "transparent") +
    `
.${p}-bg{background:${NAVY};}
.${p}-photo{position:absolute;inset:-3%;background:url('assets/img/nursing-care.png') 50% 38%/cover no-repeat;filter:blur(1px) saturate(1.05) contrast(1.05);}
.${p}-shade{position:absolute;inset:0;background:linear-gradient(180deg,rgba(7,18,43,0.3) 0%,rgba(7,18,43,0.1) 22%,rgba(7,18,43,0.5) 44%,rgba(7,18,43,0.88) 58%,rgba(7,18,43,0.96) 100%);}
.${p}-warm{position:absolute;left:50%;top:66%;width:1000px;height:700px;margin:-350px 0 0 -500px;border-radius:50%;background:radial-gradient(closest-side,rgba(242,101,34,0.35),rgba(242,101,34,0));}
.${p}-head{position:absolute;left:50px;right:50px;top:960px;display:flex;flex-direction:column;align-items:center;}
.${p}-line{display:flex;gap:0.24em;justify-content:center;line-height:1.05;}
.${p}-l1{font-weight:800;font-size:104px;letter-spacing:-0.025em;}
.${p}-l2{margin:6px 0 34px;}
.${p}-caro-wrap{position:relative;display:inline-block;font-weight:900;font-size:250px;line-height:1;letter-spacing:-0.03em;color:${ORANGE};text-shadow:0 0 70px rgba(242,101,34,0.55);}
.${p}-swipe{position:absolute;left:2%;right:2%;top:100%;height:14px;border-radius:10px;background:linear-gradient(90deg,#fff,rgba(255,255,255,0.75));box-shadow:0 0 30px rgba(255,255,255,0.55);transform-origin:0% 50%;}
.${p}-l3{font-weight:800;font-size:84px;letter-spacing:-0.02em;color:rgba(244,247,255,0.95);}
.${p}-w{display:inline-block;}
`;
  const ground = `<div class="${p}-bg" id="${p}-bg" data-layout-allow-overflow></div><div class="${p}-photo" id="${p}-photo" data-layout-allow-overflow></div><div class="${p}-shade"></div><div class="${p}-warm" id="${p}-warm"></div>${atm.html}`;
  const tl = [
    atmosphereTl(p, atm, D),
    `tl.fromTo("#${p}-photo",{scale:1.32},{scale:1.08,duration:0.9,ease:"expo.out"},0);`,
    `tl.to("#${p}-photo",{scale:1.18,y:-40,duration:${r2(D - 0.9)},ease:"none"},0.9);`,
    `tl.fromTo("#${p}-warm",{opacity:0,scale:0.6},{opacity:1,scale:1.1,duration:1.4,ease:"power2.out"},1.1);`,
    `tl.fromTo("#${p}-stage",{scale:1.0},{scale:1.05,duration:${D},ease:"none"},0);`,
    ...W1.map((x, i) =>
      i === 2
        ? `tl.fromTo("#${p}-w${i}",{opacity:0,scale:1.6,filter:"blur(10px)"},{opacity:1,scale:1,filter:"blur(0px)",duration:0.35,ease:"back.out(2)"},${r2(x.at - 0.06)});`
        : `tl.fromTo("#${p}-w${i}",{opacity:0,y:40,filter:"blur(12px)"},{opacity:1,y:0,filter:"blur(0px)",duration:0.4,ease:"power3.out"},${r2(x.at - 0.06)});`,
    ),
    `tl.fromTo("#${p}-swipe",{scaleX:0},{scaleX:1,duration:0.35,ease:"power3.inOut"},1.55);`,
    grainTl(p, D, 811),
  ].join("\n");
  return { file: "01-dor.html", content: frameFile({ id: "01-dor", p, D, css, ground, stage, tl }) };
}

// 02 — virada: exclusivo para CNPJ, SulAmérica, valores abaixo do individual
function turn() {
  const p = "s2";
  const D = 6.0;
  const atm = atmosphere(p, 222, { rays: 2, bokeh: 10, color: "255,170,120" });
  const stage = `
<div class="${p}-tag-wrap" style="top:300px"><div class="${p}-tag" id="${p}-tag">EXCLUSIVO PARA CNPJ</div></div>
<div class="${p}-pill-wrap" style="top:430px"><div class="${p}-pill" id="${p}-pill">${SA_WORD(p, 76)}</div></div>
<div class="${p}-title" id="${p}-title">Plano de Saúde Empresarial</div>
<div class="${p}-chart" id="${p}-chart">
  <div class="${p}-col"><div class="${p}-bar ${p}-ind" id="${p}-b0"></div><div class="${p}-lbl">Plano individual</div></div>
  <div class="${p}-col"><div class="${p}-bar ${p}-cnpj" id="${p}-b1"><svg class="${p}-down" id="${p}-down" viewBox="0 0 60 60"><path d="M30 54 L6 20 H20 V4 H40 V20 H54 Z" fill="${ORANGE}"/></svg></div><div class="${p}-lbl ${p}-lbl-on">SulAmérica CNPJ</div></div>
</div>
<div class="${p}-claim" id="${p}-claim">Valores <b>abaixo</b> do plano individual</div>`;
  const css =
    baseCss(p, "transparent") +
    pillCss(p) +
    `
.${p}-bg{background:radial-gradient(90% 60% at 50% 25%,#0b2a73 0%,${SA_NAVY} 45%,${NAVY} 85%);}
.${p}-glow{position:absolute;left:50%;top:58%;width:1100px;height:900px;margin:-450px 0 0 -550px;border-radius:50%;background:radial-gradient(closest-side,rgba(242,101,34,0.3),rgba(242,101,34,0));}
.${p}-title{position:absolute;left:0;right:0;top:618px;text-align:center;font-weight:800;font-size:66px;letter-spacing:-0.01em;}
.${p}-chart{position:absolute;left:150px;right:150px;top:740px;height:560px;display:flex;justify-content:space-between;align-items:flex-end;padding-bottom:70px;}
.${p}-col{position:relative;width:300px;height:100%;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;}
.${p}-bar{width:220px;border-radius:24px 24px 8px 8px;transform-origin:50% 100%;}
.${p}-ind{height:440px;background:linear-gradient(180deg,rgba(255,255,255,0.45),rgba(255,255,255,0.12));border:2px solid rgba(255,255,255,0.35);}
.${p}-cnpj{position:relative;height:230px;background:linear-gradient(180deg,#ff8a4a,${ORANGE});box-shadow:0 0 60px rgba(242,101,34,0.55);display:flex;justify-content:center;}
.${p}-down{position:absolute;top:-96px;width:72px;height:72px;filter:drop-shadow(0 0 18px rgba(242,101,34,0.7));}
.${p}-lbl{position:absolute;bottom:-62px;width:340px;text-align:center;font-weight:700;font-size:32px;color:rgba(244,247,255,0.7);}
.${p}-lbl-on{color:#fff;}
.${p}-claim{position:absolute;left:60px;right:60px;top:1390px;text-align:center;font-weight:700;font-size:58px;line-height:1.15;text-wrap:balance;}
.${p}-claim b{font-weight:900;color:${ORANGE};}
`;
  const ground = `<div class="${p}-bg" id="${p}-bg" data-layout-allow-overflow></div><div class="${p}-glow" id="${p}-glow"></div>${atm.html}`;
  const tl = [
    atmosphereTl(p, atm, D),
    `tl.fromTo("#${p}-bg",{scale:1.08},{scale:1.0,duration:${D},ease:"sine.out"},0);`,
    `tl.fromTo("#${p}-stage",{scale:1.03},{scale:1.0,duration:${D},ease:"power1.out"},0);`,
    `tl.fromTo("#${p}-tag",{opacity:0,scale:0.6},{opacity:1,scale:1,duration:0.45,ease:"back.out(2)"},0.8);`,
    `tl.fromTo("#${p}-pill",{opacity:0,y:-30,scale:0.85},{opacity:1,y:0,scale:1,duration:0.5,ease:"back.out(1.6)"},2.15);`,
    `tl.fromTo("#${p}-title",{opacity:0,y:30},{opacity:1,y:0,duration:0.4,ease:"power3.out"},2.45);`,
    `tl.fromTo("#${p}-glow",{opacity:0},{opacity:1,duration:1.2,ease:"power1.out"},2.3);`,
    `tl.fromTo("#${p}-chart",{opacity:0},{opacity:1,duration:0.3,ease:"power1.out"},3.0);`,
    `tl.fromTo("#${p}-b0",{scaleY:0},{scaleY:1,duration:0.55,ease:"power3.out"},3.05);`,
    `tl.fromTo("#${p}-b1",{scaleY:0},{scaleY:1,duration:0.55,ease:"power3.out"},3.55);`,
    `tl.fromTo("#${p}-down",{opacity:0,y:-30},{opacity:1,y:0,duration:0.35,ease:"bounce.out"},4.0);`,
    `tl.fromTo("#${p}-claim",{opacity:0,y:30,filter:"blur(10px)"},{opacity:1,y:0,filter:"blur(0px)",duration:0.45,ease:"power3.out"},3.95);`,
    grainTl(p, D, 812),
  ].join("\n");
  return { file: "02-virada.html", content: frameFile({ id: "02-virada", p, D, css, ground, stage, tl }) };
}

// 03 — hospital de referência + benefícios
function hospital() {
  const p = "s3";
  const D = 6.0;
  const atm = atmosphere(p, 333, { rays: 2, bokeh: 8, color: "255,190,150" });
  const BEN = [
    { t: "Atendimento Rede D'Or", at: 1.2 },
    { t: "Hospitais de referência", at: 2.05 },
    { t: "Plano odontológico", at: 3.6 },
  ];
  const ben = BEN.map((b, i) => `<div class="${p}-ben" id="${p}-b${i}">${CHECK_SVG(p, i, ORANGE)}<span>${b.t}</span></div>`).join("\n");
  const stage = `
<div class="${p}-card" id="${p}-card">
  <div class="${p}-img" id="${p}-img" data-layout-allow-overflow></div>
  <div class="${p}-shade"></div>
  <div class="${p}-chip" id="${p}-chip"><span class="${p}-pin"><svg viewBox="0 0 40 40" width="38" height="38"><path d="M15 4h10v11h11v10H25v11H15V25H4V15h11z" fill="#fff"/></svg></span><span><b>Hospital Nursing Care</b><small>Hospital de referência</small></span></div>
</div>
<div class="${p}-list">
${ben}
</div>`;
  const css =
    baseCss(p, "transparent") +
    `
.${p}-bg{background:${NAVY};}
.${p}-blur{position:absolute;inset:-6%;background:url('assets/img/nursing-care.png') 50% 40%/cover no-repeat;filter:blur(28px) brightness(0.45) saturate(1.2);}
.${p}-tintb{position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,30,98,0.55),rgba(7,18,43,0.85));}
.${p}-card{position:absolute;left:90px;right:90px;top:240px;height:900px;border-radius:44px;overflow:hidden;box-shadow:0 40px 100px rgba(0,0,0,0.55),0 0 0 3px rgba(255,255,255,0.18);}
.${p}-img{position:absolute;inset:-4%;background:url('assets/img/nursing-care.png') 50% 30%/cover no-repeat;filter:saturate(1.08) contrast(1.05);}
.${p}-shade{position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,0) 55%,rgba(7,18,43,0.85) 100%);}
.${p}-chip{position:absolute;left:36px;right:36px;bottom:36px;display:flex;align-items:center;gap:22px;padding:24px 30px;border-radius:28px;background:rgba(255,255,255,0.14);border:1.5px solid rgba(255,255,255,0.3);backdrop-filter:blur(18px);}
.${p}-pin{display:flex;align-items:center;justify-content:center;width:70px;height:70px;border-radius:50%;background:${ORANGE};font-size:38px;font-weight:900;color:#fff;flex:0 0 auto;}
.${p}-chip b{display:block;font-weight:800;font-size:46px;line-height:1.1;}
.${p}-chip small{display:block;font-weight:600;font-size:30px;color:rgba(244,247,255,0.8);margin-top:4px;}
.${p}-list{position:absolute;left:100px;right:80px;top:1190px;display:flex;flex-direction:column;gap:26px;}
.${p}-ben{display:flex;align-items:center;gap:26px;font-weight:800;font-size:52px;line-height:1.1;text-shadow:0 2px 14px rgba(0,0,0,0.45);}
.${p}-check{flex:0 0 auto;width:64px;height:64px;filter:drop-shadow(0 0 16px ${ORANGE});}
`;
  const ground = `<div class="${p}-bg" id="${p}-bg" data-layout-allow-overflow></div><div class="${p}-blur" id="${p}-blur" data-layout-allow-overflow></div><div class="${p}-tintb"></div>${atm.html}`;
  const tl = [
    atmosphereTl(p, atm, D),
    `tl.fromTo("#${p}-blur",{scale:1.1},{scale:1.2,duration:${D},ease:"none"},0);`,
    `tl.fromTo("#${p}-card",{opacity:0,scale:0.86,y:60},{opacity:1,scale:1,y:0,duration:0.6,ease:"power3.out"},0.1);`,
    `tl.fromTo("#${p}-img",{scale:1.25},{scale:1.04,duration:${D},ease:"power1.out"},0.1);`,
    `tl.fromTo("#${p}-chip",{opacity:0,y:40},{opacity:1,y:0,duration:0.45,ease:"back.out(1.6)"},0.55);`,
    ...BEN.map(
      (b, i) => `tl.fromTo("#${p}-b${i}",{opacity:0,x:-60},{opacity:1,x:0,duration:0.35,ease:"power3.out"},${r2(b.at - 0.12)});
tl.fromTo("#${p}-ck${i}",{strokeDashoffset:40},{strokeDashoffset:0,duration:0.22,ease:"power2.out"},${b.at});`,
    ),
    grainTl(p, D, 813),
  ].join("\n");
  return { file: "03-hospital.html", content: frameFile({ id: "03-hospital", p, D, css, ground, stage, tl }) };
}

// 04 — preço: 3 vidas a partir de R$ 1.014,97 (trava em 4.0 s = linha de compasso)
export const PRICE_MARKS = { lives: 0.42, from: 1.3, countFrom: 1.9, lockAt: 4.0, footAt: 4.3 };

function price() {
  const p = "s4";
  const D = 6.0;
  const M = PRICE_MARKS;
  const atm = atmosphere(p, 444, { rays: 2, bokeh: 10, color: "255,170,120" });
  const wheel = priceWheel(p, "1.014,97");
  const stage = `
<div class="${p}-pill-wrap" style="top:280px"><div class="${p}-pill" id="${p}-pill">${SA_WORD(p, 70)}</div></div>
<div class="${p}-tag-wrap" style="top:450px"><div class="${p}-tag" id="${p}-tag">EXCLUSIVO PARA CNPJ</div></div>
<div class="${p}-card" id="${p}-card">
  <div class="${p}-lives" id="${p}-lives"><b>3 vidas</b></div>
  <div class="${p}-from" id="${p}-from">a partir de</div>
  <div class="${p}-price" id="${p}-price"><span class="${p}-cur">R$</span><span class="${p}-pw">${wheel.html}</span><span class="${p}-ast">*</span><span class="${p}-flare" id="${p}-flare"></span></div>
  <div class="${p}-hr"></div>
  <div class="${p}-foot" id="${p}-foot">${footText}</div>
</div>`;
  const css =
    baseCss(p, "transparent") +
    pillCss(p) +
    `
.${p}-bg{background:radial-gradient(80% 55% at 50% 45%,#0b2a73 0%,${SA_NAVY} 50%,${NAVY} 90%);}
.${p}-blur{position:absolute;inset:-6%;background:url('assets/img/nursing-care.png') 50% 40%/cover no-repeat;filter:blur(30px) brightness(0.4);opacity:0.55;}
.${p}-orb{position:absolute;left:50%;top:52%;width:1100px;height:1100px;margin:-550px 0 0 -550px;border-radius:50%;background:radial-gradient(closest-side,rgba(242,101,34,0.4),rgba(242,101,34,0));}
.${p}-card{position:absolute;left:60px;right:60px;top:600px;padding:60px 56px 52px;border-radius:44px;background:linear-gradient(160deg,rgba(255,255,255,0.14),rgba(255,255,255,0.04));border:1.5px solid rgba(255,255,255,0.24);box-shadow:0 40px 90px rgba(0,0,0,0.45),inset 0 1px 0 rgba(255,255,255,0.25);backdrop-filter:blur(26px);text-align:center;}
.${p}-lives b{font-weight:900;font-size:120px;line-height:1;letter-spacing:-0.02em;}
.${p}-from{margin-top:14px;font-weight:600;font-size:52px;color:rgba(244,247,255,0.85);}
.${p}-price{position:relative;display:flex;justify-content:center;align-items:flex-start;margin-top:18px;font-weight:900;font-size:176px;line-height:1;letter-spacing:-0.03em;color:#fff;text-shadow:0 0 50px rgba(242,101,34,0.6);}
.${p}-cur{font-size:70px;margin:26px 16px 0 0;color:rgba(244,247,255,0.9);}
.${p}-ast{font-size:90px;margin-left:6px;color:${ORANGE};}
.${p}-pw{display:inline-flex;align-items:flex-start;font-variant-numeric:tabular-nums;}
.${p}-pw-digit{display:inline-block;height:1em;overflow:hidden;}
.${p}-pw-strip{display:grid;}
.${p}-pw-strip span{height:1em;line-height:1em;text-align:center;}
.${p}-pw-sep{display:inline-block;line-height:1em;}
.${p}-flare{position:absolute;left:-10%;top:-30%;width:120%;height:160%;background:radial-gradient(closest-side,rgba(255,255,255,0.6),rgba(242,101,34,0.3) 50%,rgba(255,255,255,0));mix-blend-mode:screen;opacity:0;pointer-events:none;}
.${p}-hr{height:2px;margin:44px 0 30px;background:linear-gradient(90deg,rgba(255,255,255,0),rgba(255,255,255,0.45),rgba(255,255,255,0));}
.${p}-foot{font-weight:500;font-size:28px;line-height:1.4;color:rgba(244,247,255,0.75);}
`;
  const ground = `<div class="${p}-bg" id="${p}-bg" data-layout-allow-overflow></div><div class="${p}-blur" id="${p}-blur" data-layout-allow-overflow></div><div class="${p}-orb" id="${p}-orb"></div>${atm.html}`;
  const tl = [
    atmosphereTl(p, atm, D),
    `tl.fromTo("#${p}-blur",{scale:1.1},{scale:1.2,duration:${D},ease:"none"},0);`,
    `tl.fromTo("#${p}-stage",{scale:1.0},{scale:1.04,duration:${D},ease:"none"},0);`,
    `tl.fromTo("#${p}-pill",{opacity:0,y:-30,scale:0.85},{opacity:1,y:0,scale:1,duration:0.45,ease:"back.out(1.6)"},0.1);`,
    `tl.fromTo("#${p}-tag",{opacity:0,scale:0.6},{opacity:1,scale:1,duration:0.4,ease:"back.out(2)"},0.25);`,
    `tl.fromTo("#${p}-card",{opacity:0,y:100,rotationX:16,transformPerspective:1400},{opacity:1,y:0,rotationX:0,duration:0.55,ease:"power3.out"},0.2);`,
    `tl.fromTo("#${p}-lives",{opacity:0,scale:0.7},{opacity:1,scale:1,duration:0.4,ease:"back.out(1.8)"},${M.lives});`,
    `tl.fromTo("#${p}-from",{opacity:0,y:20},{opacity:1,y:0,duration:0.3,ease:"power3.out"},${M.from});`,
    `tl.fromTo("#${p}-price",{opacity:0,y:30},{opacity:1,y:0,duration:0.25,ease:"power3.out"},${M.countFrom});`,
    ...wheel.strips.map(
      (s, i) =>
        `tl.fromTo("${s.sel}",{yPercent:0},{yPercent:${s.yp},duration:${r2(M.lockAt - M.countFrom - 0.05 - (wheel.strips.length - 1 - i) * 0.05)},ease:"power3.out"},${r2(M.countFrom + 0.05)});`,
    ),
    `tl.fromTo("#${p}-price",{scale:1},{scale:1.07,duration:0.12,ease:"power2.out",immediateRender:false},${M.lockAt});`,
    `tl.to("#${p}-price",{scale:1,duration:0.45,ease:"elastic.out(1,0.5)"},${r2(M.lockAt + 0.12)});`,
    `tl.fromTo("#${p}-flare",{opacity:0,scale:0.6},{opacity:1,scale:1.1,duration:0.15,ease:"power2.out"},${M.lockAt});`,
    `tl.to("#${p}-flare",{opacity:0,scale:1.4,duration:0.7,ease:"power2.out"},${r2(M.lockAt + 0.15)});`,
    `tl.fromTo("#${p}-orb",{opacity:0.5,scale:0.8},{opacity:1,scale:1.15,duration:0.5,ease:"power2.out"},${M.lockAt});`,
    `tl.fromTo("#${p}-foot",{opacity:0},{opacity:1,duration:0.4,ease:"power1.out"},${M.footAt});`,
    grainTl(p, D, 814),
  ].join("\n");
  return { file: "04-preco.html", content: frameFile({ id: "04-preco", p, D, css, ground, stage, tl }) };
}

// 05 — CTA neutro (sem marca de corretora)
function cta() {
  const p = "s5";
  const D = 6.0;
  const atm = atmosphere(p, 555, { rays: 2, bokeh: 10, color: "255,170,120" });
  const stage = `
<div class="${p}-head"><div class="${p}-h" id="${p}-h0">Pare de pagar caro.</div><div class="${p}-h ${p}-hi" id="${p}-h1">Simule agora.</div></div>
<div class="${p}-btn" id="${p}-btn"><span class="${p}-btn-shine" id="${p}-shine"></span><span class="${p}-btn-t">Simulação Gratuita 100% Online</span><span class="${p}-arrow">›</span></div>
<div class="${p}-row" id="${p}-row">${SA_WORD(p, 44).replace(`color:${SA_NAVY}`, "color:#fff")}<span class="${p}-dot"></span><span class="${p}-ex">Exclusivo para CNPJ</span></div>
<div class="${p}-sub" id="${p}-sub">Planos a partir de <b>3 vidas</b> · Rede D'Or · Odontológico</div>
<div class="${p}-foot" id="${p}-foot">${footText}</div>
<div class="${p}-flash" id="${p}-flash"></div>
<div class="${p}-black" id="${p}-black"></div>`;
  const css =
    baseCss(p, "transparent") +
    `
.${p}-bg{background:radial-gradient(85% 60% at 50% 40%,#0b2a73 0%,${SA_NAVY} 48%,${NAVY} 88%);}
.${p}-o{position:absolute;width:760px;height:760px;border-radius:50%;filter:blur(90px);mix-blend-mode:screen;opacity:0.6;}
.${p}-head{position:absolute;left:40px;right:40px;top:470px;text-align:center;}
.${p}-h{font-weight:900;font-size:104px;line-height:1.1;letter-spacing:-0.025em;text-wrap:balance;}
.${p}-hi{font-family:"Lora",Georgia,serif;font-style:italic;font-weight:500;font-size:120px;color:${ORANGE};letter-spacing:0;text-shadow:0 0 50px rgba(242,101,34,0.45);}
.${p}-btn{position:absolute;left:60px;right:60px;top:860px;height:156px;border-radius:999px;display:flex;align-items:center;justify-content:center;gap:22px;overflow:hidden;background:linear-gradient(180deg,#ff8a4a 0%,${ORANGE} 60%,#d4521a 100%);box-shadow:0 26px 70px rgba(242,101,34,0.5),inset 0 2px 0 rgba(255,255,255,0.5);color:#fff;}
.${p}-btn-t{position:relative;font-weight:800;font-size:50px;letter-spacing:-0.01em;white-space:nowrap;}
.${p}-arrow{position:relative;display:flex;align-items:center;justify-content:center;width:64px;height:64px;border-radius:50%;background:#fff;color:${ORANGE};font-weight:800;font-size:48px;line-height:1;padding-bottom:6px;}
.${p}-btn-shine{position:absolute;top:0;bottom:0;left:0;width:200px;background:linear-gradient(100deg,rgba(255,255,255,0),rgba(255,255,255,0.7),rgba(255,255,255,0));}
.${p}-row{position:absolute;left:0;right:0;top:1080px;display:flex;justify-content:center;align-items:center;gap:22px;}
.${p}-wm{font-weight:800;line-height:1;letter-spacing:-0.02em;}
.${p}-dot{width:12px;height:12px;border-radius:50%;background:${ORANGE};}
.${p}-ex{font-weight:800;font-size:40px;letter-spacing:0.06em;}
.${p}-sub{position:absolute;left:60px;right:60px;top:1170px;text-align:center;font-weight:500;font-size:38px;color:rgba(244,247,255,0.88);text-wrap:balance;}
.${p}-sub b{font-weight:800;color:#fff;}
.${p}-foot{position:absolute;left:90px;right:90px;top:1300px;text-align:center;font-weight:500;font-size:26px;line-height:1.45;color:rgba(244,247,255,0.65);}
.${p}-flash{position:absolute;inset:0;background:#fff;opacity:0;pointer-events:none;}
.${p}-black{position:absolute;inset:0;background:#000;opacity:0;pointer-events:none;}
`;
  const ground = `<div class="${p}-bg" id="${p}-bg" data-layout-allow-overflow></div>
<div class="${p}-o" id="${p}-o0" style="left:-300px;top:160px;background:${ORANGE}"></div>
<div class="${p}-o" id="${p}-o1" style="left:620px;top:1100px;background:#2a5cff"></div>
${atm.html}`;
  const tl = [
    atmosphereTl(p, atm, D),
    `tl.fromTo("#${p}-flash",{opacity:0.8},{opacity:0,duration:0.35,ease:"power2.out"},0);`,
    `tl.fromTo("#${p}-o0",{x:0,y:0},{x:300,y:200,duration:${D},ease:"sine.inOut"},0);`,
    `tl.fromTo("#${p}-o1",{x:0,y:0},{x:-260,y:-240,duration:${D},ease:"sine.inOut"},0);`,
    `tl.fromTo("#${p}-stage",{scale:1.03},{scale:1.0,duration:${D},ease:"power1.out"},0);`,
    `tl.fromTo("#${p}-h0",{opacity:0,y:50,filter:"blur(12px)"},{opacity:1,y:0,filter:"blur(0px)",duration:0.45,ease:"power3.out"},0.2);`,
    `tl.fromTo("#${p}-h1",{opacity:0,y:50,filter:"blur(12px)"},{opacity:1,y:0,filter:"blur(0px)",duration:0.45,ease:"power3.out"},0.5);`,
    `tl.fromTo("#${p}-btn",{opacity:0,scale:0.6,y:40},{opacity:1,scale:1,y:0,duration:0.5,ease:"back.out(1.7)"},1.25);`,
    `tl.fromTo("#${p}-btn",{scale:1},{scale:1.035,duration:0.5,ease:"sine.inOut",yoyo:true,repeat:7,immediateRender:false},1.8);`,
    ...[1.9, 3.1, 4.5].map((t, i) => `tl.fromTo("#${p}-shine",{x:-260},{x:1100,duration:0.7,ease:"power2.inOut"${i ? ",immediateRender:false" : ""}},${t});`),
    `tl.fromTo("#${p}-row",{opacity:0,y:24},{opacity:1,y:0,duration:0.4,ease:"power3.out"},2.1);`,
    `tl.fromTo("#${p}-sub",{opacity:0,y:24},{opacity:1,y:0,duration:0.4,ease:"power3.out"},2.4);`,
    `tl.fromTo("#${p}-foot",{opacity:0},{opacity:1,duration:0.5,ease:"power1.out"},2.7);`,
    `tl.fromTo("#${p}-black",{opacity:0},{opacity:1,duration:0.35,ease:"power1.in"},${r2(D - 0.35)});`,
    grainTl(p, D, 815),
  ].join("\n");
  return { file: "05-cta.html", content: frameFile({ id: "05-cta", p, D, css, ground, stage, tl }) };
}

// ───────────────────────── main ─────────────────────────

mkdirSync(OUT, { recursive: true });
for (const f of [pain(), turn(), hospital(), price(), cta()]) {
  writeFileSync(join(OUT, f.file), f.content);
  console.log(`compositions/frames/${f.file}  ${(f.content.length / 1024).toFixed(1)} kB`);
}
