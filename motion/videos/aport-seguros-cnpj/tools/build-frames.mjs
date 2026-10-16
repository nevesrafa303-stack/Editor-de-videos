#!/usr/bin/env node
// build-frames.mjs — gera as 6 sub-composições HyperFrames do filme Aport Seguros.
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

// Locução: cada fala entra 0.3 s após o início da cena (tools/voice.py).
// Os marcos abaixo vêm dos word_timestamps da HeyGen + esse 0.3 s.
const HOOK_WORDS = [0.51, 0.81, 1.32, 1.71, 1.84, 2.13, 2.3, 2.86, 3.29];
const NAVY = "#07122B";
const GOLD = "#C9A86A";
const PAPER = "#F4F7FF";

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

// ───────────────────────── 01 — hook ─────────────────────────

function hook() {
  const p = "h1";
  const D = 4.8;
  const atm = atmosphere(p, 101, { rays: 3, bokeh: 12 });
  const lines = [
    { words: ["Sua", "empresa"], cls: "l1" },
    { words: ["merece", "um", "plano"], cls: "l2" },
    { words: ["de", "saúde"], cls: "l2" },
    { words: ["à", "altura."], cls: "l3" },
  ];
  let wi = 0;
  const stage = [`<div class="${p}-eyebrow" id="${p}-eyebrow">PLANO DE SAÚDE EMPRESARIAL</div>`, `<div class="${p}-head">`];
  const wordTl = [];
  for (const ln of lines) {
    stage.push(`<div class="${p}-line ${p}-${ln.cls}">`);
    for (const w of ln.words) {
      stage.push(`<span class="${p}-w" id="${p}-w${wi}">${w}</span>`);
      const at = HOOK_WORDS[wi] - 0.08;
      wordTl.push(
        `tl.fromTo("#${p}-w${wi}",{opacity:0,y:46,filter:"blur(14px)"},{opacity:1,y:0,filter:"blur(0px)",duration:${ln.cls === "l3" ? 0.9 : 0.7},ease:"power3.out"},${r2(at)});`,
      );
      wi++;
    }
    stage.push(`</div>`);
  }
  stage.push(`</div>`, `<div class="${p}-rule" id="${p}-rule"></div>`);
  const css =
    baseCss(p, "transparent") +
    `
.${p}-bg{background:radial-gradient(90% 60% at 50% 30%,#13306b 0%,#0a1a3d 45%,${NAVY} 80%);}
.${p}-glow{position:absolute;left:50%;top:44%;width:900px;height:900px;margin:-450px 0 0 -450px;border-radius:50%;background:radial-gradient(circle,rgba(201,168,106,0.22) 0%,rgba(201,168,106,0) 65%);}
.${p}-eyebrow{position:absolute;left:0;right:0;top:600px;text-align:center;font-weight:700;font-size:30px;letter-spacing:0.42em;color:${GOLD};}
.${p}-head{position:absolute;left:60px;right:60px;top:680px;display:flex;flex-direction:column;align-items:center;}
.${p}-line{display:flex;gap:0.26em;justify-content:center;line-height:1.08;}
.${p}-l1{font-weight:800;font-size:112px;letter-spacing:-0.025em;}
.${p}-l2{font-weight:800;font-size:92px;letter-spacing:-0.02em;color:rgba(244,247,255,0.92);}
.${p}-l3{font-family:"Lora",Georgia,serif;font-style:italic;font-weight:500;font-size:168px;color:${GOLD};margin-top:18px;text-shadow:0 0 60px rgba(201,168,106,0.45);}
.${p}-w{display:inline-block;}
.${p}-rule{position:absolute;left:50%;top:1330px;width:360px;height:3px;margin-left:-180px;background:linear-gradient(90deg,transparent,${GOLD},transparent);transform-origin:50% 50%;}
`;
  const ground = `<div class="${p}-bg" id="${p}-bg" data-layout-allow-overflow></div><div class="${p}-glow" id="${p}-glow"></div>${atm.html}`;
  const tl = [
    atmosphereTl(p, atm, D),
    `tl.fromTo("#${p}-bg",{scale:1.12},{scale:1.02,duration:${D},ease:"sine.out"},0);`,
    `tl.fromTo("#${p}-glow",{opacity:0,scale:0.7},{opacity:1,scale:1.1,duration:3.2,ease:"sine.out"},0.2);`,
    `tl.fromTo("#${p}-stage",{scale:1.0},{scale:1.06,duration:${D},ease:"none"},0);`,
    `tl.fromTo("#${p}-eyebrow",{opacity:0,scale:1.12},{opacity:1,scale:1,duration:1.4,ease:"power2.out"},0.15);`,
    ...wordTl,
    `tl.fromTo("#${p}-rule",{scaleX:0,opacity:0},{scaleX:1,opacity:1,duration:1.0,ease:"power2.inOut"},3.7);`,
    grainTl(p, D, 901),
  ].join("\n");
  return { file: "01-hook.html", content: frameFile({ id: "01-hook", p, D, css, ground, stage: stage.join("\n"), tl }) };
}

// ───────────────────────── 02 — marca ─────────────────────────

function brand() {
  const p = "h2";
  const D = 7.2;
  const atm = atmosphere(p, 202, { rays: 2, bokeh: 10, color: "232,210,160" });
  const stage = `
<div class="${p}-mark" id="${p}-mark"><span class="${p}-aport" id="${p}-aport">APORT</span></div>
<div class="${p}-seg" id="${p}-seg">SEGUROS</div>
<div class="${p}-div" id="${p}-div"></div>
<div class="${p}-plan"><div class="${p}-pl" id="${p}-pl0">Plano de Saúde</div><div class="${p}-pl ${p}-cnpj" id="${p}-pl1">para <em>CNPJ</em></div></div>
<div class="${p}-badge-wrap"><div class="${p}-badge" id="${p}-badge">a partir de <b>3 vidas</b></div></div>
<div class="${p}-chips">
  <span class="${p}-chip" id="${p}-c0" style="--c:#CC092F">Bradesco Saúde</span>
  <span class="${p}-chip" id="${p}-c1" style="--c:#F26522">SulAmérica</span>
  <span class="${p}-chip" id="${p}-c2" style="--c:#2F7BFF">Porto</span>
</div>`;
  const css =
    baseCss(p, "transparent") +
    `
.${p}-bg{background:radial-gradient(80% 55% at 50% 35%,#18346f 0%,#0b1b40 50%,${NAVY} 85%);}
.${p}-halo{position:absolute;left:50%;top:560px;width:1200px;height:520px;margin-left:-600px;border-radius:50%;background:radial-gradient(closest-side,rgba(201,168,106,0.28),rgba(201,168,106,0));filter:blur(10px);}
.${p}-mark{position:absolute;left:0;right:0;top:420px;display:flex;justify-content:center;overflow:hidden;height:230px;}
.${p}-aport{display:block;font-weight:900;font-size:210px;line-height:230px;letter-spacing:0.1em;padding-left:0.1em;background-image:linear-gradient(100deg,rgba(255,236,190,0) 42%,rgba(255,236,190,0.95) 50%,rgba(255,236,190,0) 58%),linear-gradient(180deg,#ffffff 0%,#dfe6f5 60%,#b9c4dc 100%);background-size:250% 100%,100% 100%;background-repeat:no-repeat;background-position:160% 0%,0% 0%;-webkit-background-clip:text;background-clip:text;color:transparent;}
.${p}-seg{position:absolute;left:0;right:0;top:668px;text-align:center;font-weight:600;font-size:42px;letter-spacing:0.62em;padding-left:0.62em;color:${GOLD};}
.${p}-div{position:absolute;left:50%;top:780px;width:120px;height:3px;margin-left:-60px;background:${GOLD};}
.${p}-plan{position:absolute;left:40px;right:40px;top:840px;text-align:center;}
.${p}-pl{font-weight:800;font-size:104px;line-height:1.1;letter-spacing:-0.02em;}
.${p}-cnpj em{font-family:"Lora",Georgia,serif;font-style:italic;font-weight:500;color:${GOLD};font-size:122px;letter-spacing:0;}
.${p}-badge-wrap{position:absolute;left:0;right:0;top:1150px;display:flex;justify-content:center;}
.${p}-badge{padding:26px 56px;border-radius:999px;font-weight:500;font-size:46px;white-space:nowrap;background:rgba(255,255,255,0.07);border:2px solid rgba(201,168,106,0.65);box-shadow:0 0 50px rgba(201,168,106,0.25),inset 0 0 30px rgba(255,255,255,0.05);backdrop-filter:blur(14px);}
.${p}-badge b{font-weight:800;color:${GOLD};}
.${p}-chips{position:absolute;left:40px;right:40px;top:1330px;display:flex;justify-content:center;gap:22px;}
.${p}-chip{display:inline-flex;align-items:center;gap:14px;padding:16px 26px;border-radius:999px;font-weight:700;font-size:30px;background:rgba(255,255,255,0.06);border:1.5px solid rgba(255,255,255,0.16);white-space:nowrap;}
.${p}-chip::before{content:"";width:16px;height:16px;border-radius:50%;background:var(--c);box-shadow:0 0 14px var(--c);}
`;
  const ground = `<div class="${p}-bg" id="${p}-bg" data-layout-allow-overflow></div><div class="${p}-halo" id="${p}-halo"></div>${atm.html}`;
  const tl = [
    atmosphereTl(p, atm, D),
    `tl.fromTo("#${p}-bg",{scale:1.1},{scale:1.0,duration:${D},ease:"sine.out"},0);`,
    `tl.fromTo("#${p}-stage",{scale:1.04},{scale:1.0,duration:${D},ease:"power1.out"},0);`,
    `tl.fromTo("#${p}-halo",{opacity:0,scaleX:0.4},{opacity:1,scaleX:1,duration:1.6,ease:"power2.out"},0.2);`,
    `tl.fromTo("#${p}-aport",{yPercent:100,opacity:0},{yPercent:0,opacity:1,duration:0.9,ease:"expo.out"},0.35);`,
    `tl.fromTo("#${p}-aport",{backgroundPosition:"160% 0%, 0% 0%"},{backgroundPosition:"-60% 0%, 0% 0%",duration:1.2,ease:"power2.inOut",immediateRender:false},0.75);`,
    `tl.fromTo("#${p}-seg",{opacity:0,scale:1.12},{opacity:1,scale:1,duration:1.2,ease:"power3.out"},0.9);`,
    `tl.fromTo("#${p}-div",{scaleX:0},{scaleX:1,duration:0.7,ease:"power2.out"},1.4);`,
    `tl.fromTo("#${p}-pl0",{opacity:0,y:50,filter:"blur(12px)"},{opacity:1,y:0,filter:"blur(0px)",duration:0.8,ease:"power3.out"},1.95);`,
    `tl.fromTo("#${p}-pl1",{opacity:0,y:50,filter:"blur(12px)"},{opacity:1,y:0,filter:"blur(0px)",duration:0.8,ease:"power3.out"},2.15);`,
    `tl.fromTo("#${p}-badge",{opacity:0,scale:0.7},{opacity:1,scale:1,duration:0.6,ease:"back.out(1.8)"},4.05);`,
    `tl.fromTo(["#${p}-c0","#${p}-c1","#${p}-c2"],{opacity:0,y:30},{opacity:1,y:0,duration:0.55,ease:"power3.out",stagger:0.18},5.3);`,
    grainTl(p, D, 902),
  ].join("\n");
  return { file: "02-aport.html", content: frameFile({ id: "02-aport", p, D, css, ground, stage, tl }) };
}

// ───────────────────────── 03-05 — operadoras ─────────────────────────

const CARRIERS = [
  {
    file: "03-bradesco.html",
    id: "03-bradesco",
    p: "h3",
    idx: 0,
    color: "#CC092F",
    deep: "#5a0016",
    glow: "255,60,90",
    photo: "assets/img/dr-beda.png",
    photoPos: "60% 50%",
    word: `<span class="W-wm" style="color:#CC092F">bradesco</span><span class="W-wm2" style="color:#CC092F">saúde</span>`,
    benefits: ["Ampla rede referenciada", "Telemedicina", "Suporte para pacientes com TEA"],
    price: "1.697,90",
    marks: { benefits: [1.76, 2.82, 4.0], lives: 5.38 },
    seed: 303,
  },
  {
    file: "04-sulamerica.html",
    id: "04-sulamerica",
    p: "h4",
    idx: 1,
    color: "#F26522",
    deep: "#001E62",
    glow: "255,140,70",
    photo: "assets/img/nursing-care.png",
    photoPos: "50% 35%",
    word: `<span class="W-wm" style="color:#001E62">Sul<span style="color:#F26522">América</span></span>`,
    benefits: ["Atendimento Rede D'Or", "Plano odontológico"],
    price: "1.014,97",
    marks: { benefits: [1.6, 3.55], lives: 5.06 },
    seed: 404,
  },
  {
    file: "05-porto.html",
    id: "05-porto",
    p: "h5",
    idx: 2,
    color: "#0046C0",
    deep: "#001a4d",
    glow: "0,160,223",
    photo: null,
    word: `<span class="W-wm" style="color:#0046C0">Porto</span><span class="W-wm2" style="color:#0046C0">saúde</span>`,
    benefits: ["Plano odontológico", "Seguro de vida", "Serviços ocupacionais", "Proteção antiácaro"],
    price: "942,80",
    marks: { benefits: [1.24, 2.5, 3.76, 4.45], lives: 5.5 },
    seed: 505,
  },
];

// marcos (tempo local) — usados também pelo audio_meta.json
// trava do preço em 7.2 s = linha de compasso (impacto da trilha)
export const CARRIER_MARKS = {
  countFrom: 5.8,
  lockAt: 7.2,
  footAt: 7.9,
};

function carrier(c) {
  const { p } = c;
  const D = 9.6;
  const n = c.benefits.length;
  const atm = atmosphere(p, c.seed, { rays: 2, bokeh: 10, color: c.glow });
  const wheel = priceWheel(p, c.price);
  const benefitsHtml = c.benefits
    .map((b, i) => `<div class="${p}-ben" id="${p}-b${i}">${CHECK_SVG(p, i, c.color)}<span>${b}</span></div>`)
    .join("\n");
  const dots = [0, 1, 2]
    .map((k) => `<span class="${p}-dot${k === c.idx ? ` ${p}-on` : ""}" id="${p}-d${k}"></span>`)
    .join("");
  const stage = `
<div class="${p}-pill-wrap"><div class="${p}-pill" id="${p}-pill">${c.word.replaceAll("W-", `${p}-`)}</div></div>
<div class="${p}-eyebrow" id="${p}-eyebrow">PLANO DE SAÚDE PARA CNPJ</div>
<div class="${p}-card" id="${p}-card">
  <div class="${p}-bens">
${benefitsHtml}
  </div>
  <div class="${p}-hr" id="${p}-hr"></div>
  <div class="${p}-lives" id="${p}-lives"><b>3 vidas</b> a partir de</div>
  <div class="${p}-price" id="${p}-price"><span class="${p}-cur">R$</span><span class="${p}-pw">${wheel.html}</span><span class="${p}-ast">*</span><span class="${p}-flare" id="${p}-flare"></span></div>
  <div class="${p}-foot" id="${p}-foot">*2 adultos até 38 anos e 1 jovem até 18 anos. Os valores podem variar conforme o perfil do beneficiário.</div>
</div>
<div class="${p}-prog" id="${p}-prog">${dots}<span class="${p}-pnum">0${c.idx + 1} / 03</span></div>
<div class="${p}-leak" id="${p}-leak"></div>`;

  const big = n >= 4 ? 44 : 50;
  const gap = n >= 4 ? 26 : 34;
  const css =
    baseCss(p, `linear-gradient(180deg,${c.deep}cc 0%,${c.color}55 38%,${NAVY}f2 78%,${NAVY} 100%)`) +
    `
.${p}-photo{position:absolute;inset:-4%;background-size:cover;background-position:${c.photoPos || "50% 50%"};filter:blur(5px) saturate(0.8) brightness(0.75);}
.${p}-mesh{position:absolute;left:-20%;right:-20%;bottom:-10%;height:70%;background-image:linear-gradient(rgba(0,160,223,0.35) 2px,transparent 2px),linear-gradient(90deg,rgba(0,160,223,0.35) 2px,transparent 2px);background-size:120px 120px;transform:perspective(900px) rotateX(62deg);transform-origin:50% 100%;opacity:0.55;}
.${p}-orb{position:absolute;border-radius:50%;filter:blur(60px);mix-blend-mode:screen;}
.${p}-pill-wrap{position:absolute;left:0;right:0;top:250px;display:flex;justify-content:center;}
.${p}-pill{height:140px;padding:0 64px;display:flex;flex-direction:column;align-items:flex-start;justify-content:center;border-radius:999px;background:#ffffff;box-shadow:0 24px 60px rgba(0,0,0,0.35),0 0 0 6px rgba(255,255,255,0.12);white-space:nowrap;}
.${p}-wm{font-weight:800;font-size:72px;line-height:0.95;letter-spacing:-0.02em;}
.${p}-wm2{font-weight:500;font-size:38px;line-height:1.05;}
.${p}-eyebrow{position:absolute;left:0;right:0;top:438px;text-align:center;font-weight:700;font-size:28px;letter-spacing:0.36em;padding-left:0.36em;color:rgba(244,247,255,0.85);}
.${p}-card{position:absolute;left:56px;right:56px;top:510px;padding:56px 56px 50px;border-radius:44px;background:linear-gradient(160deg,rgba(255,255,255,0.13),rgba(255,255,255,0.04));border:1.5px solid rgba(255,255,255,0.22);box-shadow:0 40px 90px rgba(0,0,0,0.45),inset 0 1px 0 rgba(255,255,255,0.25);backdrop-filter:blur(26px) saturate(1.2);}
.${p}-bens{display:flex;flex-direction:column;gap:${gap}px;}
.${p}-ben{display:flex;align-items:center;gap:28px;font-weight:700;font-size:${big}px;line-height:1.15;}
.${p}-check{flex:0 0 auto;width:${big + 12}px;height:${big + 12}px;filter:drop-shadow(0 0 16px ${c.color});}
.${p}-hr{height:2px;margin:${n >= 4 ? 40 : 48}px 0 ${n >= 4 ? 30 : 36}px;background:linear-gradient(90deg,rgba(255,255,255,0.45),rgba(255,255,255,0));transform-origin:0 50%;}
.${p}-lives{font-weight:500;font-size:44px;color:rgba(244,247,255,0.85);}
.${p}-lives b{font-weight:800;font-size:64px;color:#fff;margin-right:12px;}
.${p}-price{position:relative;display:flex;align-items:flex-start;margin-top:10px;font-weight:800;font-size:150px;line-height:1;letter-spacing:-0.02em;color:#fff;text-shadow:0 0 40px rgba(${c.glow},0.55);}
.${p}-cur{font-size:62px;margin:22px 18px 0 0;color:rgba(244,247,255,0.9);}
.${p}-ast{font-size:80px;margin-left:6px;color:${GOLD};}
.${p}-pw{display:inline-flex;align-items:flex-start;font-variant-numeric:tabular-nums;}
.${p}-pw-digit{display:inline-block;height:1em;overflow:hidden;}
.${p}-pw-strip{display:grid;}
.${p}-pw-strip span{height:1em;line-height:1em;text-align:center;}
.${p}-pw-sep{display:inline-block;line-height:1em;}
.${p}-flare{position:absolute;left:-10%;top:-30%;width:120%;height:160%;background:radial-gradient(closest-side,rgba(255,255,255,0.55),rgba(${c.glow},0.25) 50%,rgba(255,255,255,0));mix-blend-mode:screen;opacity:0;pointer-events:none;}
.${p}-foot{margin-top:34px;font-weight:500;font-size:27px;line-height:1.4;color:rgba(244,247,255,0.72);}
.${p}-prog{position:absolute;left:0;right:0;top:1540px;display:flex;justify-content:center;align-items:center;gap:14px;}
.${p}-prog span[class*="dot"]{width:72px;height:6px;border-radius:6px;background:rgba(255,255,255,0.22);}
.${p}-prog .${p}-on{background:${c.color};box-shadow:0 0 18px ${c.color};}
.${p}-pnum{margin-left:18px;font-weight:700;font-size:26px;letter-spacing:0.2em;color:rgba(244,247,255,0.7);}
.${p}-leak{position:absolute;inset:-20%;pointer-events:none;mix-blend-mode:screen;background:radial-gradient(40% 30% at 30% 40%,rgba(255,220,170,0.9),rgba(${c.glow},0.5) 40%,rgba(0,0,0,0) 75%);opacity:0;}
`;
  let ground = `<div class="${p}-bg" id="${p}-bg" data-layout-allow-overflow>`;
  if (c.photo) {
    ground += `<div class="${p}-photo" id="${p}-photo" style="background-image:url('${c.photo}')"></div>`;
  } else {
    ground += `<div class="${p}-photo" style="background:radial-gradient(70% 50% at 50% 30%,#0a3a9e 0%,#002266 45%,${NAVY} 85%);filter:none"></div><div class="${p}-mesh" id="${p}-mesh"></div>`;
    ground += `<div class="${p}-orb" id="${p}-orb0" style="left:-120px;top:200px;width:620px;height:620px;background:rgba(0,160,223,0.55)"></div>`;
    ground += `<div class="${p}-orb" id="${p}-orb1" style="left:620px;top:900px;width:560px;height:560px;background:rgba(0,70,192,0.7)"></div>`;
  }
  ground += `</div><div class="${p}-tint"></div>${atm.html}`;

  const M = CARRIER_MARKS;
  const tl = [
    atmosphereTl(p, atm, D),
    c.photo
      ? `tl.fromTo("#${p}-photo",{scale:1.08,x:-20},{scale:1.2,x:20,duration:${D},ease:"none"},0);`
      : `tl.fromTo("#${p}-mesh",{backgroundPosition:"0px 0px"},{backgroundPosition:"0px 480px",duration:${D},ease:"none"},0);
tl.fromTo("#${p}-orb0",{x:0,y:0},{x:160,y:120,duration:${D},ease:"sine.inOut"},0);
tl.fromTo("#${p}-orb1",{x:0,y:0},{x:-180,y:-140,duration:${D},ease:"sine.inOut"},0);`,
    `tl.fromTo("#${p}-stage",{scale:1.0},{scale:1.045,duration:${D},ease:"none"},0);`,
    `tl.fromTo("#${p}-leak",{opacity:0,x:-300},{opacity:0.95,x:0,duration:0.35,ease:"power2.out"},0);`,
    `tl.to("#${p}-leak",{opacity:0,x:500,duration:0.9,ease:"power2.in"},0.35);`,
    `tl.fromTo("#${p}-pill",{opacity:0,y:-40,scale:0.86},{opacity:1,y:0,scale:1,duration:0.8,ease:"back.out(1.6)"},0.25);`,
    `tl.fromTo("#${p}-eyebrow",{opacity:0,scale:1.12},{opacity:1,scale:1,duration:1.1,ease:"power2.out"},0.5);`,
    `tl.fromTo("#${p}-card",{opacity:0,y:120,rotationX:18,transformPerspective:1400},{opacity:1,y:0,rotationX:0,duration:1.0,ease:"power3.out"},0.55);`,
    ...c.benefits.map((_, i) => {
      const at = r2(c.marks.benefits[i]);
      return `tl.fromTo("#${p}-b${i}",{opacity:0,x:-60},{opacity:1,x:0,duration:0.55,ease:"power3.out"},${r2(at - 0.15)});
tl.fromTo("#${p}-ck${i}",{strokeDashoffset:40},{strokeDashoffset:0,duration:0.35,ease:"power2.out"},${at});`;
    }),
    `tl.fromTo("#${p}-hr",{scaleX:0},{scaleX:1,duration:0.7,ease:"power2.inOut"},${r2(c.marks.lives - 0.3)});`,
    `tl.fromTo("#${p}-lives",{opacity:0,y:24},{opacity:1,y:0,duration:0.5,ease:"power3.out"},${c.marks.lives});`,
    `tl.fromTo("#${p}-price",{opacity:0,y:30},{opacity:1,y:0,duration:0.4,ease:"power3.out"},${M.countFrom});`,
    ...wheel.strips.map(
      (s, i) =>
        `tl.fromTo("${s.sel}",{yPercent:0},{yPercent:${s.yp},duration:${r2(M.lockAt - M.countFrom - 0.05 - (wheel.strips.length - 1 - i) * 0.05)},ease:"power3.out"},${r2(M.countFrom + 0.05)});`,
    ),
    `tl.fromTo("#${p}-price",{scale:1},{scale:1.06,duration:0.12,ease:"power2.out",transformOrigin:"0% 50%"},${M.lockAt});`,
    `tl.to("#${p}-price",{scale:1,duration:0.6,ease:"elastic.out(1,0.5)"},${r2(M.lockAt + 0.12)});`,
    `tl.fromTo("#${p}-flare",{opacity:0,scale:0.6},{opacity:1,scale:1.1,duration:0.15,ease:"power2.out"},${M.lockAt});`,
    `tl.to("#${p}-flare",{opacity:0,scale:1.4,duration:1.0,ease:"power2.out"},${r2(M.lockAt + 0.15)});`,
    `tl.fromTo("#${p}-foot",{opacity:0},{opacity:1,duration:0.7,ease:"power1.out"},${M.footAt});`,
    `tl.fromTo("#${p}-prog",{opacity:0,y:20},{opacity:1,y:0,duration:0.6,ease:"power2.out"},0.9);`,
    `tl.fromTo("#${p}-d${c.idx}",{scaleX:0.2},{scaleX:1,duration:0.8,ease:"power2.out",transformOrigin:"0% 50%"},1.0);`,
    grainTl(p, D, 903 + c.idx),
  ].join("\n");
  return { file: c.file, content: frameFile({ id: c.id, p, D, css, ground, stage, tl }) };
}

// ───────────────────────── 06 — CTA ─────────────────────────

function cta() {
  const p = "h6";
  const D = 9.6;
  const atm = atmosphere(p, 606, { rays: 2, bokeh: 10, color: "232,210,160" });
  const stage = `
<div class="${p}-mark" id="${p}-mark"><span class="${p}-aport" id="${p}-aport">APORT</span></div>
<div class="${p}-seg" id="${p}-seg">SEGUROS</div>
<div class="${p}-head"><div class="${p}-h" id="${p}-h0">O plano certo</div><div class="${p}-h ${p}-hi" id="${p}-h1">para o seu CNPJ.</div></div>
<div class="${p}-btn" id="${p}-btn"><span class="${p}-btn-shine" id="${p}-shine"></span><span class="${p}-btn-t">Simulação Gratuita 100% Online</span><span class="${p}-arrow">›</span></div>
<div class="${p}-sub" id="${p}-sub">Planos a partir de <b>3 vidas</b></div>
<div class="${p}-chips">
  <span class="${p}-chip" id="${p}-c0" style="--c:#CC092F">Bradesco Saúde</span>
  <span class="${p}-chip" id="${p}-c1" style="--c:#F26522">SulAmérica</span>
  <span class="${p}-chip" id="${p}-c2" style="--c:#2F7BFF">Porto</span>
</div>
<div class="${p}-foot" id="${p}-foot">*Valores para 2 adultos até 38 anos e 1 jovem até 18 anos. Os valores podem variar conforme o perfil do beneficiário.</div>
<div class="${p}-flash" id="${p}-flash"></div>
<div class="${p}-black" id="${p}-black"></div>`;
  const css =
    baseCss(p, "transparent") +
    `
.${p}-bg{background:radial-gradient(85% 60% at 50% 40%,#16336f 0%,#0b1c42 48%,${NAVY} 85%);}
.${p}-o{position:absolute;width:760px;height:760px;border-radius:50%;filter:blur(90px);mix-blend-mode:screen;opacity:0.75;}
.${p}-mark{position:absolute;left:0;right:0;top:330px;display:flex;justify-content:center;overflow:hidden;height:180px;}
.${p}-aport{display:block;font-weight:900;font-size:160px;line-height:180px;letter-spacing:0.1em;padding-left:0.1em;background-image:linear-gradient(100deg,rgba(255,236,190,0) 42%,rgba(255,236,190,0.95) 50%,rgba(255,236,190,0) 58%),linear-gradient(180deg,#ffffff 0%,#dfe6f5 60%,#b9c4dc 100%);background-size:250% 100%,100% 100%;background-repeat:no-repeat;background-position:160% 0%,0% 0%;-webkit-background-clip:text;background-clip:text;color:transparent;}
.${p}-seg{position:absolute;left:0;right:0;top:520px;text-align:center;font-weight:600;font-size:34px;letter-spacing:0.62em;padding-left:0.62em;color:${GOLD};}
.${p}-head{position:absolute;left:40px;right:40px;top:660px;text-align:center;}
.${p}-h{font-weight:800;font-size:96px;line-height:1.12;letter-spacing:-0.02em;}
.${p}-hi{font-family:"Lora",Georgia,serif;font-style:italic;font-weight:500;font-size:112px;color:${GOLD};letter-spacing:0;text-shadow:0 0 50px rgba(201,168,106,0.4);}
.${p}-btn{position:absolute;left:60px;right:60px;top:1000px;height:150px;border-radius:999px;display:flex;align-items:center;justify-content:center;gap:22px;overflow:hidden;background:linear-gradient(180deg,#e3c78b 0%,${GOLD} 55%,#a8874c 100%);box-shadow:0 26px 70px rgba(201,168,106,0.45),inset 0 2px 0 rgba(255,255,255,0.6);color:${NAVY};}
.${p}-btn-t{position:relative;font-weight:800;font-size:50px;letter-spacing:-0.01em;white-space:nowrap;}
.${p}-arrow{position:relative;display:flex;align-items:center;justify-content:center;width:64px;height:64px;border-radius:50%;background:${NAVY};color:${GOLD};font-weight:800;font-size:48px;line-height:1;padding-bottom:6px;}
.${p}-btn-shine{position:absolute;top:0;bottom:0;left:0;width:200px;background:linear-gradient(100deg,rgba(255,255,255,0),rgba(255,255,255,0.75),rgba(255,255,255,0));}
.${p}-sub{position:absolute;left:0;right:0;top:1205px;text-align:center;font-weight:500;font-size:44px;color:rgba(244,247,255,0.9);}
.${p}-sub b{font-weight:800;color:#fff;}
.${p}-chips{position:absolute;left:40px;right:40px;top:1300px;display:flex;justify-content:center;gap:22px;}
.${p}-chip{display:inline-flex;align-items:center;gap:14px;padding:16px 26px;border-radius:999px;font-weight:700;font-size:30px;background:rgba(255,255,255,0.06);border:1.5px solid rgba(255,255,255,0.16);white-space:nowrap;}
.${p}-chip::before{content:"";width:16px;height:16px;border-radius:50%;background:var(--c);box-shadow:0 0 14px var(--c);}
.${p}-foot{position:absolute;left:90px;right:90px;top:1440px;text-align:center;font-weight:500;font-size:25px;line-height:1.45;color:rgba(244,247,255,0.62);}
.${p}-flash{position:absolute;inset:0;background:#fff;opacity:0;pointer-events:none;}
.${p}-black{position:absolute;inset:0;background:#000;opacity:0;pointer-events:none;}
`;
  const ground = `<div class="${p}-bg" id="${p}-bg" data-layout-allow-overflow></div>
<div class="${p}-o" id="${p}-o0" style="left:-380px;top:120px;background:#CC092F"></div>
<div class="${p}-o" id="${p}-o1" style="left:700px;top:260px;background:#F26522"></div>
<div class="${p}-o" id="${p}-o2" style="left:160px;top:1260px;background:#0046C0"></div>
${atm.html}`;
  const tl = [
    atmosphereTl(p, atm, D),
    `tl.fromTo("#${p}-flash",{opacity:0.85},{opacity:0,duration:0.5,ease:"power2.out"},0);`,
    `tl.fromTo("#${p}-o0",{x:0,y:0,scale:1},{x:420,y:420,scale:0.55,opacity:0.35,duration:1.8,ease:"power3.inOut"},0);`,
    `tl.fromTo("#${p}-o1",{x:0,y:0,scale:1},{x:-420,y:290,scale:0.55,opacity:0.35,duration:1.8,ease:"power3.inOut"},0);`,
    `tl.fromTo("#${p}-o2",{x:0,y:0,scale:1},{x:0,y:-560,scale:0.55,opacity:0.35,duration:1.8,ease:"power3.inOut"},0);`,
    `tl.fromTo("#${p}-stage",{scale:1.03},{scale:1.0,duration:${D},ease:"power1.out"},0);`,
    `tl.fromTo("#${p}-mark",{opacity:0,y:40,filter:"blur(16px)"},{opacity:1,y:0,filter:"blur(0px)",duration:0.9,ease:"power3.out"},5.05);`,
    `tl.fromTo("#${p}-seg",{opacity:0,scale:1.12},{opacity:1,scale:1,duration:1.1,ease:"power3.out"},5.35);`,
    `tl.fromTo("#${p}-aport",{backgroundPosition:"160% 0%, 0% 0%"},{backgroundPosition:"-60% 0%, 0% 0%",duration:1.2,ease:"power2.inOut",immediateRender:false},5.5);`,
    `tl.fromTo("#${p}-h0",{opacity:0,y:50,filter:"blur(12px)"},{opacity:1,y:0,filter:"blur(0px)",duration:0.8,ease:"power3.out"},0.35);`,
    `tl.fromTo("#${p}-h1",{opacity:0,y:50,filter:"blur(12px)"},{opacity:1,y:0,filter:"blur(0px)",duration:0.8,ease:"power3.out"},0.6);`,
    `tl.fromTo("#${p}-btn",{opacity:0,scale:0.6,y:40},{opacity:1,scale:1,y:0,duration:0.7,ease:"back.out(1.7)"},1.85);`,
    `tl.fromTo("#${p}-btn",{scale:1},{scale:1.035,duration:0.6,ease:"sine.inOut",yoyo:true,repeat:9,immediateRender:false},2.6);`,
    ...[2.7, 4.2, 6.6].map((t, i) => `tl.fromTo("#${p}-shine",{x:-260},{x:1100,duration:0.9,ease:"power2.inOut"${i ? ",immediateRender:false" : ""}},${t});`),
    `tl.fromTo("#${p}-sub",{opacity:0,y:24},{opacity:1,y:0,duration:0.6,ease:"power3.out"},2.9);`,
    `tl.fromTo(["#${p}-c0","#${p}-c1","#${p}-c2"],{opacity:0,y:30},{opacity:1,y:0,duration:0.55,ease:"power3.out",stagger:0.15},3.2);`,
    `tl.fromTo("#${p}-foot",{opacity:0},{opacity:1,duration:0.8,ease:"power1.out"},3.6);`,
    `tl.fromTo("#${p}-black",{opacity:0},{opacity:1,duration:0.8,ease:"power1.in"},${r2(D - 0.8)});`,
    grainTl(p, D, 906),
  ].join("\n");
  return { file: "06-cta.html", content: frameFile({ id: "06-cta", p, D, css, ground, stage, tl }) };
}

// ───────────────────────── main ─────────────────────────

mkdirSync(OUT, { recursive: true });
for (const f of [hook(), brand(), ...CARRIERS.map(carrier), cta()]) {
  writeFileSync(join(OUT, f.file), f.content);
  console.log(`compositions/frames/${f.file}  ${(f.content.length / 1024).toFixed(1)} kB`);
}
