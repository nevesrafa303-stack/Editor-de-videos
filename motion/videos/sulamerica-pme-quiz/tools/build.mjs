#!/usr/bin/env node
// build.mjs — variação "quiz de preço" do anúncio SulAmérica PME (3 vidas, R$ 1.770,30/mês com IOF),
// story 9:16 e feed 1:1.
//
//   node tools/build.mjs story   -> compositions/*.html + index.html
//   node tools/build.mjs feed    -> feed/compositions/*.html + feed/index.html
//
// Gancho ("Ei… você tem CNPJ?"), quiz na tela ("Quanto custa um plano de saúde empresarial pra 3
// pessoas?", três faixas de preço, contagem 3-2-1), revelação com o preço rolando no ritmo da fala,
// reação da cliente ("Sério?! Pra três pessoas?!"), idades e benefícios, e o CTA do formulário do
// anúncio. Falas reaproveitadas das versões 1 e 2 (tools/prep_voice.py); tempos em
// assets/voice/vo.lines.json e vo.words.json. Informações da cotação enviada
// (assets/ref/cotacao-sulamerica.jpg).

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const FMT = process.argv[2] === "feed" ? "feed" : "story";
const ST = FMT === "story";
const W = 1080;
const H = ST ? 1920 : 1080;
const FPS = 30;
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
const HL = "#FF9A4D"; // palavra do consultor na legenda
const CLI_HL = "#7CF0A8"; // palavra da cliente na legenda

// ───────────── locução ─────────────
const LINES = JSON.parse(readFileSync(join(ROOT, "assets/voice/vo.lines.json"), "utf8"));
const WORDS = JSON.parse(readFileSync(join(ROOT, "assets/voice/vo.words.json"), "utf8"));
const LN = Object.fromEntries(LINES.map((l) => [l.id, l]));
const D = Math.round((WORDS[WORDS.length - 1].end + 2.4) * 10) / 10; // igual ao TOTAL da trilha
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
T.cnpjEnd = end("cnpj");
T.sula = at("sulamerica");
T.pme = at("pme");
T.tres = at("tres");
T.vidas = at("vidas");
T.mil = at("mil");
T.setecentos = at("setecentos");
T.setenta = at("setenta");
T.trinta = at("trinta");
T.centavos = at("centavos");
T.mes = at("mes");
T.iof = at("iof");
T.serio1 = at("serio");
T.pra1 = at("pra", T.serio1);
T.pessoas = at("pessoas");
T.serio2 = at("serio", T.pessoas);
T.essas = at("essas");
T.aqui = at("aqui", T.essas);
T.o = at("o", T.aqui);
T.abr = at("abrangencia");
T.apt = at("apartamento");
T.cop = at("coparticipacao");
T.ree = at("reembolso");
T.sem = at("sem");
T.toca = at("toca");
T.embaixo = at("embaixo");
T.cotacao = at("cotacao");

// quiz entre o gancho e a revelação
const Q_IN = r3(T.cnpjEnd + 0.02);
const OPT = [0.35, 0.6, 0.85].map((d) => r3(Q_IN + d));
const TICK = [1.0, 1.85, 2.7].map((d) => r3(Q_IN + d)); // 3, 2, 1
const REVEAL = r3(LN.k1.start - 0.25);
const S3_OUT = r3(LN.c2.start - 0.2);
const S4_OUT = r3(LN.k2.start - 0.15);
const END_IN = r3(T.toca - 0.25);

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
    [1, -0.8, 0.5, -0.25, 0].forEach((q, i) => add(`tl.set("${sel}",{x:${r3(q * amp)},y:${r3(-q * amp * 0.6)}},${r3(t + i / FPS)});`));
  return { a, L, add, words, drift, shake };
}

const ICONS = {
  check: `<path d="M12 25l8 8 16-18"/>`,
  building: `<path d="M8 42V10l16-5v37M24 16l16 5v21M4 42h40M14 16h4M14 23h4M14 30h4M30 26h4M30 33h4"/>`,
  globe: `<circle cx="24" cy="24" r="17"/><path d="M7 24h34M24 7c5 5 7 11 7 17s-2 12-7 17c-5-5-7-11-7-17s2-12 7-17z"/>`,
  bed: `<path d="M5 36V12M5 28h38v8M43 28v-4a6 6 0 0 0-6-6H22v10"/><circle cx="13" cy="22" r="4"/>`,
  percent: `<path d="M12 36L36 12"/><circle cx="14" cy="14" r="5"/><circle cx="34" cy="34" r="5"/>`,
  refund: `<path d="M38 18A15 15 0 1 0 39 30"/><path d="M39 9v9h-9"/><path d="M24 15v18M28 19.5c-1-1.5-2.5-2-4-2-2.5 0-4 1.3-4 3s1.6 2.6 4 3 4 1.3 4 3.2-1.8 3-4 3c-1.8 0-3.3-.6-4.4-2"/>`,
  ticket: `<path d="M6 16a4 4 0 0 0 0 8v8h36v-8a4 4 0 0 0 0-8V8H6z" transform="translate(0 4)"/><path d="M10 40L38 10"/>`,
  person: `<circle cx="24" cy="16" r="8"/><path d="M8 44c0-9 7-15 16-15s16 6 16 15"/>`,
  form: `<rect x="10" y="8" width="28" height="36" rx="4"/><path d="M18 8V5h12v3M16 20h16M16 28h16M16 36h10"/>`,
  down: `<path d="M12 10l12 12 12-12M12 24l12 12 12-12"/>`,
  mic: `<rect x="17" y="6" width="14" height="24" rx="7"/><path d="M10 22c0 8 6 13 14 13s14-5 14-13M24 35v7"/>`,
};
const icon = (name, size, { id = "", sw = 3.4, color = "#fff", fill = "none" } = {}) =>
  `<svg ${id ? `id="${id}" ` : ""}viewBox="0 0 48 48" width="${size}" height="${size}" fill="${fill}" stroke="${color}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`;

// rosto surpreso (reação da cliente)
const face = (size, id) => `<svg id="${id}" viewBox="0 0 100 100" width="${size}" height="${size}" aria-hidden="true">
  <circle cx="50" cy="50" r="46" fill="#FFD25A" stroke="${INK}" stroke-width="4"/>
  <path d="M26 30q8-8 16-2M58 28q8-6 16 2" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>
  <circle cx="35" cy="44" r="6" fill="${INK}"/><circle cx="65" cy="44" r="6" fill="${INK}"/>
  <ellipse id="${id}-m" cx="50" cy="70" rx="9" ry="12" fill="${INK}"/></svg>`;

// colunas de dígitos que rolam até o valor (formato X.XXX,XX)
function rollPrice(p, fs, digits) {
  const LH = Math.round(fs * 1.0);
  let n = 0;
  const col = (d) => {
    const seq = [];
    for (let r = 0; r < 2; r++) for (let q = 0; q < 10; q++) seq.push(q);
    for (let q = 0; q <= d; q++) seq.push(q);
    return `<span class="dc"><span class="sz">${d}</span><span class="ds" id="${p}-ds${n++}" data-layout-allow-overflow>${seq.join("<br>")}</span></span>`;
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
  </svg>
  <div id="bg-vig" class="${p}-full"></div>`;
  add(`tl.fromTo("#bg-w1",{x:0},{x:-560,duration:${D},ease:"none"},0);`);
  add(`tl.fromTo("#bg-w2",{x:-420},{x:0,duration:${D},ease:"none"},0);`);
  add(`tl.fromTo("#bg-glow",{x:0,y:0,scale:1},{x:${pick(-180, -140)},y:${pick(-200, -120)},scale:1.2,duration:8,ease:"sine.inOut",repeat:3,yoyo:true},0);`);
  scenes.push({ st: 0, track: 0, ...scene(p, D, css, body, a) });
}

// ═════════════ 1 · gancho: "Ei… você tem CNPJ?" (tela laranja) ═════════════
{
  const p = "s1";
  const st = 0;
  const dur = Q_IN + 0.35;
  const { a, L, add, words } = TL(st);
  const g = pick({ ey: 560, es: 84, ty: 690, ts: 130, cy: 860, cs: 250 }, { ey: 200, es: 64, ty: 300, ts: 100, cy: 430, cs: 190 });
  const css =
    base(p) +
    `
#s1-bg{background:linear-gradient(160deg,${ORANGE} 0%,#E4571A 55%,#C2410C 100%);}
#s1-st{position:absolute;left:-200px;top:-200px;width:${W + 400}px;height:${H + 400}px;background:repeating-linear-gradient(135deg,rgba(0,0,0,.06) 0 26px,rgba(0,0,0,0) 26px 64px);}
#s1-e{position:absolute;left:0;width:${W}px;top:${g.ey}px;text-align:center;font-weight:800;font-size:${g.es}px;line-height:1.1;}
#s1-t{position:absolute;left:0;width:${W}px;top:${g.ty}px;text-align:center;font-weight:900;font-size:${g.ts}px;line-height:1.1;letter-spacing:-.02em;}
#s1-c{position:absolute;left:0;width:${W}px;top:${g.cy}px;text-align:center;font-weight:900;font-size:${g.cs}px;line-height:1;letter-spacing:-.03em;color:${NAVY};}
`;
  const body = `
  <div id="s1-wrap" class="${p}-full">
    <div id="s1-bg" class="${p}-full"></div>
    <div id="s1-st" data-layout-allow-overflow aria-hidden="true"></div>
    <div id="s1-e" class="d">${wspans("s1e", "Ei…")}</div>
    <div id="s1-t" class="d">${wspans("s1t", "você tem")}</div>
    <div id="s1-c" class="d">${wspans("s1c", "CNPJ?")}</div>
  </div>`;
  add(`tl.fromTo("#s1-st",{x:0},{x:${pick(-90, -90)},duration:${r3(dur)},ease:"none"},0);`);
  words("s1e", [T.ei], 0.35);
  words("s1t", [T.voce, at("tem")], 0.35);
  add(`tl.fromTo("#s1c0",{scale:2.4,opacity:0},{scale:1,opacity:1,duration:0.3,ease:"power4.out"},${r3(L(T.cnpj) - 0.05)});`);
  // o painel laranja sobe e abre o quiz
  add(`tl.to("#s1-wrap",{yPercent:-100,duration:0.4,ease:"power3.inOut"},${r3(dur - 0.42)});`);
  scenes.push({ st, track: 2, ...scene(p, dur, css, body, a) });
}

// ═════════════ 2 · quiz: "Quanto custa um plano de saúde empresarial pra 3 pessoas?" ═════════════
{
  const p = "s2";
  const st = r3(Q_IN - 0.05);
  const dur = r3(LN.k1.start + 0.2 - st);
  const { a, L, add } = TL(st);
  const g = pick(
    { py: 270, ph: 64, ps: 30, qy: 370, qs: 68, ry: 700, rd: 150, oy: [880, 1040, 1200], oh: 130, ox: 90, ow: 900, os: 44, ls: 46 },
    { py: 30, ph: 52, ps: 24, qy: 104, qs: 50, ry: 268, rd: 116, oy: [418, 532, 646], oh: 98, ox: 140, ow: 800, os: 36, ls: 36 },
  );
  const opts = ["Mais de R$ 2.500", "Entre R$ 2.000 e R$ 2.500", "Menos de R$ 1.800"];
  const css =
    base(p) +
    `
#s2-pw{position:absolute;left:0;width:${W}px;top:${g.py}px;text-align:center;}
#s2-pill{display:inline-flex;align-items:center;height:${g.ph}px;padding:0 ${Math.round(g.ph * 0.5)}px;border-radius:${g.ph}px;background:${ORANGE};font-weight:800;font-size:${g.ps}px;letter-spacing:.1em;}
#s2-q{position:absolute;left:${pick(70, 110)}px;width:${W - pick(140, 220)}px;top:${g.qy}px;text-align:center;font-weight:900;font-size:${g.qs}px;line-height:1.1;letter-spacing:-.015em;}
#s2-q .hl{color:${HL};}
#s2-rw{position:absolute;left:${(W - g.rd) / 2}px;top:${g.ry}px;width:${g.rd}px;height:${g.rd}px;}
#s2-ring{position:absolute;left:0;top:0;}
.s2-n{position:absolute;left:0;top:0;width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:${Math.round(g.rd * 0.48)}px;opacity:0;}
.s2-o{position:absolute;left:${g.ox}px;width:${g.ow}px;height:${g.oh}px;border-radius:${g.oh}px;background:#fff;color:${NAVY};box-shadow:0 18px 40px rgba(0,8,30,.4);}
.s2-l{position:absolute;left:${Math.round(g.oh * 0.14)}px;top:${Math.round(g.oh * 0.14)}px;width:${Math.round(g.oh * 0.72)}px;height:${Math.round(g.oh * 0.72)}px;border-radius:50%;background:${NAVY};color:#fff;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:${g.ls}px;}
.s2-t{position:absolute;left:${Math.round(g.oh * 1.06)}px;top:${Math.round(g.oh / 2 - g.os * 0.62)}px;font-weight:800;font-size:${g.os}px;line-height:1.1;white-space:nowrap;}
#s2-ok{position:absolute;inset:0;border-radius:${g.oh}px;background:${GREEN};opacity:0;}
#s2-okt{position:absolute;left:${Math.round(g.oh * 1.06)}px;top:${Math.round(g.oh / 2 - g.os * 0.62)}px;font-weight:800;font-size:${g.os}px;line-height:1.1;white-space:nowrap;color:#fff;}
#s2-okc{position:absolute;right:${Math.round(g.oh * 0.2)}px;top:${Math.round(g.oh * 0.17)}px;width:${Math.round(g.oh * 0.66)}px;height:${Math.round(g.oh * 0.66)}px;border-radius:50%;background:#fff;display:flex;align-items:center;justify-content:center;}
`;
  const R = g.rd / 2 - 8;
  const C = 2 * Math.PI * R;
  const body = `
  <div id="s2-wrap" class="${p}-full">
    <div id="s2-pw"><span id="s2-pill" class="d">QUIZ RÁPIDO</span></div>
    <div id="s2-q" class="d">Quanto custa um plano de saúde empresarial pra <span class="hl">3&nbsp;pessoas?</span></div>
    <div id="s2-rw"><svg id="s2-ring" viewBox="0 0 ${g.rd} ${g.rd}" width="${g.rd}" height="${g.rd}" aria-hidden="true">
      <circle cx="${g.rd / 2}" cy="${g.rd / 2}" r="${R}" fill="rgba(255,255,255,.08)" stroke="rgba(255,255,255,.25)" stroke-width="10"/>
      <circle id="s2-arc" cx="${g.rd / 2}" cy="${g.rd / 2}" r="${R}" fill="none" stroke="${ORANGE2}" stroke-width="10" stroke-linecap="round" stroke-dasharray="${r3(C)} ${r3(C)}" stroke-dashoffset="0" transform="rotate(-90 ${g.rd / 2} ${g.rd / 2})"/></svg>
      ${[3, 2, 1].map((n, i) => `<div class="s2-n d" id="s2-n${i}">${n}</div>`).join("")}</div>
    ${opts
      .map(
        (o, i) => `<div class="s2-o" id="s2-o${i}" style="top:${g.oy[i]}px"><div class="s2-l d">${"ABC"[i]}</div><div class="s2-t d">${o}</div>${
          i === 2 ? `<div id="s2-ok" data-layout-allow-overlap><div class="s2-l d" style="background:#fff;color:${GREEN}">C</div><div id="s2-okt" class="d">${o}</div><div id="s2-okc">${icon("check", Math.round(g.oh * 0.42), { color: GREEN, sw: 6 })}</div></div>` : ""
        }</div>`,
      )
      .join("\n    ")}
  </div>`;
  add(`tl.fromTo("#s2-pill",{scale:0.5,opacity:0},{scale:1,opacity:1,duration:0.35,ease:"back.out(2)"},0.12);`);
  add(`tl.fromTo("#s2-q",{y:40,opacity:0},{y:0,opacity:1,duration:0.4,ease:"power3.out"},0.18);`);
  OPT.forEach((t, i) => add(`tl.fromTo("#s2-o${i}",{x:${i % 2 ? 1100 : -1100}},{x:0,duration:0.42,ease:"power4.out"},${L(t)});`));
  // contagem 3, 2, 1 com o anel esvaziando
  add(`tl.fromTo("#s2-rw",{scale:0,opacity:0},{scale:1,opacity:1,duration:0.3,ease:"back.out(2)"},${r3(L(TICK[0]) - 0.25)});`);
  add(`tl.fromTo("#s2-arc",{attr:{"stroke-dashoffset":0}},{attr:{"stroke-dashoffset":${r3(C)}},duration:${r3(REVEAL - TICK[0])},ease:"none"},${L(TICK[0])});`);
  TICK.forEach((t, i) => {
    add(`tl.fromTo("#s2-n${i}",{scale:1.6,opacity:0},{scale:1,opacity:1,duration:0.2,ease:"power3.out"},${L(t)});`);
    add(`tl.to("#s2-n${i}",{opacity:0,duration:0.1},${r3(L(i < 2 ? TICK[i + 1] : REVEAL) - 0.1)});`);
  });
  // resposta: C fica verde, A e B apagam
  add(`tl.fromTo("#s2-ok",{opacity:0},{opacity:1,duration:0.15},${L(REVEAL)});`);
  add(`tl.fromTo("#s2-o2",{scale:1},{scale:1.06,duration:0.15,ease:"power2.out"},${L(REVEAL)});`);
  add(`tl.to("#s2-o2",{scale:1,duration:0.3,ease:"back.out(2)"},${r3(L(REVEAL) + 0.15)});`);
  add(`tl.to(["#s2-o0","#s2-o1"],{opacity:0.35,duration:0.2},${L(REVEAL)});`);
  add(`tl.to("#s2-rw",{scale:0,opacity:0,duration:0.2,ease:"power2.in"},${L(REVEAL)});`);
  add(`tl.to("#s2-wrap",{y:${-pick(140, 90)},opacity:0,duration:0.3,ease:"power3.in"},${r3(dur - 0.3)});`);
  scenes.push({ st, track: 1, ...scene(p, dur, css, body, a) });
}

// ═════════════ 3 · revelação: "SulAmérica PME, três vidas, por R$ 1.770,30 por mês… já com IOF!" ═════════════
{
  const p = "s3";
  const st = r3(LN.k1.start - 0.05);
  const dur = r3(S3_OUT - st);
  const { a, L, add, drift, shake } = TL(st);
  const g = pick(
    { by: 250, bh: 66, bs: 30, lw: 620, ly: 360, my: 560, ms: 120, ch: 84, cs: 40, ay: 700, as: 32, vy: 790, vs: 66, ps: 96, ry: 940, rs: 168, uy: 1140, us: 52, kx: 600, ky: 1210, ks: 52 },
    { by: 22, bh: 52, bs: 24, lw: 440, ly: 92, my: 236, ms: 96, ch: 70, cs: 34, ay: 348, as: 28, vy: 414, vs: 56, ps: 80, ry: 524, rs: 156, uy: 694, us: 46, kx: 610, ky: 750, ks: 46 },
  );
  const R = rollPrice(p, g.rs, [1, 7, 7, 0, 3, 0]);
  const css =
    base(p) +
    R.css +
    `
#s3-bw{position:absolute;left:0;width:${W}px;top:${g.by}px;text-align:center;}
#s3-b{display:inline-flex;align-items:center;gap:12px;height:${g.bh}px;padding:0 ${Math.round(g.bh * 0.45)}px 0 ${Math.round(g.bh * 0.12)}px;border-radius:${g.bh}px;background:${GREEN};font-weight:800;font-size:${g.bs}px;}
#s3-bc{width:${g.bh - 14}px;height:${g.bh - 14}px;border-radius:50%;background:#fff;display:flex;align-items:center;justify-content:center;}
#s3-lw{position:absolute;left:0;width:${W}px;top:${g.ly}px;text-align:center;}
#s3-row{position:absolute;left:0;width:${W}px;top:${g.my}px;display:flex;justify-content:center;align-items:center;gap:28px;}
#s3-pme{font-weight:900;font-size:${g.ms}px;line-height:1;letter-spacing:-.02em;}
#s3-bd{display:inline-flex;height:${g.ch}px;border-radius:10px;overflow:hidden;font-weight:800;font-size:${g.cs}px;box-shadow:0 10px 24px rgba(0,8,30,.4);}
#s3-bd span{display:flex;align-items:center;padding:0 22px;}
#s3-bd .o{background:${ORANGE};}
#s3-bd .n{background:#fff;color:${NAVY};}
#s3-ap{position:absolute;left:0;width:${W}px;top:${g.ay}px;text-align:center;font-weight:500;font-size:${g.as}px;color:rgba(255,255,255,.85);letter-spacing:.04em;}
#s3-vr{position:absolute;left:0;width:${W}px;top:${g.vy}px;display:flex;justify-content:center;align-items:center;gap:18px;}
.s3-p{width:${g.ps}px;height:${g.ps}px;border-radius:50%;background:rgba(255,255,255,.12);border:3px solid rgba(255,255,255,.5);display:flex;align-items:center;justify-content:center;}
#s3-v{font-weight:800;font-size:${g.vs}px;margin-left:14px;}
#s3-rw{position:absolute;left:0;width:${W}px;top:${g.ry - 10}px;height:${g.rs + 20}px;text-align:center;overflow:hidden;}
#s3-pr{display:inline-block;margin-top:10px;font-weight:900;font-size:${g.rs}px;letter-spacing:-.045em;white-space:nowrap;text-shadow:0 0 40px rgba(242,101,34,.45);}
#s3-um{position:absolute;left:0;width:${W}px;top:${g.uy}px;text-align:center;font-weight:700;font-size:${g.us}px;color:rgba(255,255,255,.9);}
#s3-kw{position:absolute;left:${g.kx}px;top:${g.ky}px;}
#s3-k{padding:14px 30px;border-radius:18px;background:${ORANGE};font-weight:900;font-size:${g.ks}px;letter-spacing:.02em;transform:rotate(-6deg);box-shadow:0 16px 40px rgba(0,8,30,.45);border:4px solid rgba(255,255,255,.85);}
`;
  const body = `
  <div id="s3-cam" class="${p}-full">
  <div id="s3-wrap" class="${p}-full">
    <div id="s3-bw"><span id="s3-b" class="d"><span id="s3-bc">${icon("check", g.bh - 30, { color: GREEN, sw: 6 })}</span>Resposta C: menos de R$ 1.800</span></div>
    <div id="s3-lw">${logo(p, g.lw)}</div>
    <div id="s3-row"><span id="s3-pme" class="d">PME</span><span id="s3-bd" class="d"><span class="o">Capital</span><span class="n">03 a 04 vidas</span></span></div>
    <div id="s3-ap">Apólice 12 meses</div>
    <div id="s3-vr">${[0, 1, 2].map((i) => `<span class="s3-p" id="s3-p${i}">${icon("person", Math.round(g.ps * 0.6), { color: "#fff", sw: 3.4 })}</span>`).join("")}<span id="s3-v" class="d">3 vidas</span></div>
    <div id="s3-rw"><span id="s3-pr" class="d">${R.html}</span><div id="s3-psw" class="sweep" aria-hidden="true"></div></div>
    <div id="s3-um" class="d">por mês</div>
    <div id="s3-kw"><div id="s3-k" class="d">JÁ COM IOF</div></div>
  </div>
  </div>`;
  drift("#s3-cam", dur, 1.02);
  add(`tl.fromTo("#s3-b",{scale:0.4,opacity:0},{scale:1,opacity:1,duration:0.35,ease:"back.out(2.2)"},0.02);`);
  add(`tl.fromTo("#s3-lgw",{clipPath:"inset(0% 100% 0% 0%)"},{clipPath:"inset(0% 0% 0% 0%)",duration:0.6,ease:"power2.inOut"},${r3(L(T.sula) - 0.2)});`);
  add(`tl.fromTo("#s3-lgt",{opacity:0,y:16},{opacity:1,y:0,duration:0.45,ease:"power3.out"},${r3(L(T.sula) + 0.05)});`);
  add(`tl.fromTo("#s3-pme",{scale:1.5,opacity:0},{scale:1,opacity:1,duration:0.3,ease:"power4.out"},${r3(L(T.pme) - 0.05)});`);
  add(`tl.fromTo("#s3-bd",{x:60,opacity:0},{x:0,opacity:1,duration:0.4,ease:"power3.out"},${r3(L(T.pme) + 0.15)});`);
  add(`tl.fromTo("#s3-ap",{opacity:0},{opacity:1,duration:0.4},${r3(L(T.pme) + 0.35)});`);
  [0, 1, 2].forEach((i) => add(`tl.fromTo("#s3-p${i}",{scale:0,y:20},{scale:1,y:0,duration:0.4,ease:"back.out(2.4)"},${r3(L(T.tres) + i * 0.12)});`));
  add(`tl.fromTo("#s3-v",{opacity:0,x:-20},{opacity:1,x:0,duration:0.35,ease:"power3.out"},${r3(L(T.vidas) - 0.05)});`);
  const t0 = r3(L(T.mil) - 0.08);
  add(`tl.fromTo("#s3-pr",{opacity:0},{opacity:1,duration:0.08},${t0});`);
  add(`tl.fromTo("#s3-rs",{scale:1.4,opacity:0},{scale:1,opacity:1,duration:0.3,ease:"power4.out"},${t0});`);
  const lands = [T.mil + 0.14, T.setecentos + 0.14, T.setenta + 0.12, T.setenta + 0.3, T.trinta + 0.12, T.trinta + 0.3];
  lands.forEach((tl_, i) => add(`tl.fromTo("#s3-ds${i}",{y:0},{y:${-R.finals[i] * R.LH},duration:${r3(L(tl_) - t0)},ease:"power3.out"},${t0});`));
  add(`tl.fromTo("#s3-psw",{xPercent:-100},{xPercent:100,duration:0.8,ease:"power2.inOut"},${r3(L(T.centavos) + 0.1)});`);
  add(`tl.fromTo("#s3-um",{opacity:0,y:20},{opacity:1,y:0,duration:0.35,ease:"power3.out"},${r3(L(T.mes) - 0.15)});`);
  add(`tl.fromTo("#s3-kw",{scale:2.2,opacity:0},{scale:1,opacity:1,duration:0.2,ease:"power4.in"},${r3(L(T.iof) - 0.12)});`);
  shake("#s3-wrap", r3(L(T.iof) + 0.08), pick(10, 8));
  add(`tl.to("#s3-wrap",{x:${-pick(320, 280)},opacity:0,duration:0.24,ease:"power3.in"},${r3(dur - 0.24)});`);
  scenes.push({ st, track: 2, ...scene(p, dur, css, body, a) });
}

// ═════════════ 4 · reação da cliente: "Sério?! Pra três pessoas?!" ═════════════
{
  const p = "s4";
  const st = S3_OUT;
  const dur = r3(S4_OUT - st);
  const { a, L, add, words } = TL(st);
  const L2 = LN.c2;
  const g = pick(
    { bx: 110, by: 420, bw: 860, bh: 190, av: 120, fz: 170, sy: 700, ss: 170, py: 920, pss: 76, iy: 1060, ip: 110 },
    { bx: 170, by: 70, bw: 740, bh: 160, av: 100, fz: 130, sy: 300, ss: 130, py: 470, pss: 60, iy: 580, ip: 92 },
  );
  const ww = g.bw - g.av - 150;
  const wh = Math.round(g.bh * 0.36);
  const n = L2.bars.length;
  const bw = 7;
  const step = (ww - bw) / (n - 1);
  const bars = (c) =>
    L2.bars.map((v, i) => {
      const h = Math.max(bw, Math.round(8 + v * (wh - 8)));
      return `<i class="s4-vb ${c}" style="left:${Math.round(i * step)}px;top:${Math.round((wh - h) / 2)}px;height:${h}px"></i>`;
    });
  const css =
    base(p) +
    `
#s4-bb{position:absolute;left:${g.bx}px;top:${g.by}px;width:${g.bw}px;height:${g.bh}px;border-radius:${Math.round(g.bh * 0.3)}px;border-top-left-radius:12px;background:#D9FDD3;color:#111B21;box-shadow:0 30px 70px rgba(0,8,30,.45);}
#s4-av{position:absolute;left:24px;top:${Math.round((g.bh - g.av) / 2)}px;width:${g.av}px;height:${g.av}px;border-radius:50%;background:#CDE8D6;display:flex;align-items:flex-end;justify-content:center;overflow:hidden;}
#s4-nm{position:absolute;left:${g.av + 52}px;top:${Math.round(g.bh * 0.14)}px;font-weight:600;font-size:${Math.round(g.bh * 0.15)}px;color:#12813F;}
#s4-wf{position:absolute;left:${g.av + 52}px;top:${Math.round(g.bh * 0.45)}px;width:${ww}px;height:${wh}px;}
.s4-vb{position:absolute;width:${bw}px;border-radius:${bw}px;}
.s4-vb.g{background:#A3C4AC;}
.s4-vb.c{background:#1FAA59;}
#s4-wc{position:absolute;left:0;top:0;width:100%;height:100%;}
#s4-fw{position:absolute;left:${g.bx + g.bw - Math.round(g.fz * 0.7)}px;top:${g.by - Math.round(g.fz * 0.45)}px;}
#s4-s{position:absolute;left:0;width:${W}px;top:${g.sy}px;text-align:center;font-weight:900;font-size:${g.ss}px;line-height:1;letter-spacing:-.03em;color:${CLI_HL};}
#s4-p{position:absolute;left:0;width:${W}px;top:${g.py}px;text-align:center;font-weight:900;font-size:${g.pss}px;line-height:1.1;}
#s4-ic{position:absolute;left:0;width:${W}px;top:${g.iy}px;display:flex;justify-content:center;gap:24px;}
.s4-i{width:${g.ip}px;height:${g.ip}px;border-radius:50%;background:rgba(255,255,255,.12);border:3px solid rgba(255,255,255,.5);display:flex;align-items:center;justify-content:center;}
`;
  const body = `
  <div id="s4-wrap" class="${p}-full">
    <div id="s4-bb"><div id="s4-av">${icon("person", Math.round(g.av * 0.7), { color: "#2F6B45", sw: 3.4 })}</div>
      <div id="s4-nm">Cliente</div>
      <div id="s4-wf"><div>${bars("g").join("")}</div><div id="s4-wc">${bars("c").join("")}</div></div></div>
    <div id="s4-fw">${face(g.fz, "s4-face")}</div>
    <div id="s4-s" class="d">${wspans("s4s", "Sério?!")}</div>
    <div id="s4-p" class="d">${wspans("s4p", "Pra três pessoas?!")}</div>
    <div id="s4-ic">${[0, 1, 2].map((i) => `<span class="s4-i" id="s4-i${i}">${icon("person", Math.round(g.ip * 0.6), { color: "#fff", sw: 3.4 })}</span>`).join("")}</div>
  </div>`;
  add(`tl.fromTo("#s4-bb",{scale:0.6,opacity:0,y:40},{scale:1,opacity:1,y:0,duration:0.35,ease:"back.out(1.8)",transformOrigin:"0% 0%"},0.02);`);
  add(`tl.fromTo("#s4-wc",{clipPath:"inset(0% 100% 0% 0%)"},{clipPath:"inset(0% 0% 0% 0%)",duration:${r3(L2.dur)},ease:"none"},${L(L2.start)});`);
  add(`tl.fromTo("#s4-fw",{scale:0,rotation:-40},{scale:1,rotation:0,duration:0.4,ease:"back.out(2.6)"},${r3(L(T.serio1))});`);
  add(`tl.fromTo("#s4-face-m",{attr:{ry:4}},{attr:{ry:12},duration:0.2,ease:"power2.out"},${r3(L(T.serio1) + 0.05)});`);
  add(`tl.fromTo("#s4s0",{scale:2,opacity:0},{scale:1,opacity:1,duration:0.28,ease:"power4.out"},${r3(L(T.serio1) - 0.04)});`);
  words("s4p", [T.pra1, at("tres", T.pra1), T.pessoas], 0.32);
  [0, 1, 2].forEach((i) => add(`tl.fromTo("#s4-i${i}",{scale:0,y:20},{scale:1,y:0,duration:0.35,ease:"back.out(2.4)"},${r3(L(T.pessoas) + i * 0.1)});`));
  add(`tl.to("#s4-wrap",{scale:0.9,opacity:0,duration:0.22,ease:"power2.in"},${r3(dur - 0.22)});`);
  scenes.push({ st, track: 1, ...scene(p, dur, css, body, a) });
}

// ═════════════ 5 · "Sério! Pra essas idades aqui, ó. Abrangência nacional…" ═════════════
{
  const p = "s5";
  const st = S4_OUT;
  const dur = r3(END_IN + 0.1 - st);
  const { a, L, add } = TL(st);
  const g = pick(
    { sy: 236, ss: 110, s2: 60, ay: 470, ah: 250, aw: 300, ag: 20, as: 32, av: 42, ic: 64, ry: [760, 876, 992, 1108, 1224], rh: 104, rs: 40, ri: 72, rk: 54 },
    { sy: 18, ss: 72, s2: 40, ay: 180, ah: 176, aw: 300, ag: 20, as: 26, av: 34, ic: 44, ry: [388, 472, 556, 640, 724], rh: 76, rs: 31, ri: 54, rk: 44 },
  );
  const ages = [
    ["0 a 18 anos", "R$ 379,08"],
    ["29 a 33 anos", "R$ 652,21"],
    ["34 a 38 anos", "R$ 697,86"],
  ];
  const rows = [
    ["globe", "Abrangência nacional", T.abr],
    ["bed", "Acomodação em apartamento", T.apt],
    ["percent", "Coparticipação de 30%", T.cop],
    ["refund", "Reembolso", T.ree],
    ["ticket", "Sem taxa de inscrição", T.sem],
  ];
  const ax0 = Math.round((W - (3 * g.aw + 2 * g.ag)) / 2);
  const rw = pick(940, 900);
  const rx = Math.round((W - rw) / 2);
  const pad = Math.round((g.rh - g.ri) / 2);
  const css =
    base(p) +
    `
#s5-s{position:absolute;left:0;width:${W}px;top:${g.sy}px;text-align:center;font-weight:900;font-size:${g.ss}px;line-height:1.05;letter-spacing:-.02em;color:${HL};}
#s5-s2{position:absolute;left:0;width:${W}px;top:${g.sy + Math.round(g.ss * 1.12)}px;text-align:center;font-weight:900;font-size:${g.s2}px;line-height:1.1;}
.s5-a{position:absolute;top:${g.ay}px;width:${g.aw}px;height:${g.ah}px;border-radius:30px;background:#fff;color:${NAVY};text-align:center;box-shadow:0 22px 50px rgba(0,8,30,.4);}
.s5-ai{position:absolute;left:50%;top:${Math.round(g.ah * 0.1)}px;margin-left:-${g.ic / 2}px;width:${g.ic}px;height:${g.ic}px;border-radius:50%;background:${NAVY};display:flex;align-items:center;justify-content:center;}
.s5-at{position:absolute;left:0;width:100%;top:${Math.round(g.ah * 0.1) + g.ic + Math.round(g.ah * 0.06)}px;font-weight:800;font-size:${g.as}px;color:${MUTED};}
.s5-av{position:absolute;left:0;width:100%;top:${Math.round(g.ah * 0.1) + g.ic + Math.round(g.ah * 0.06) + Math.round(g.as * 1.35)}px;font-weight:900;font-size:${g.av}px;letter-spacing:-.02em;}
#s5-ci{position:absolute;left:${ax0 - 26}px;top:${g.ay - 26}px;}
.s5-r{position:absolute;left:${rx}px;width:${rw}px;height:${g.rh}px;border-radius:${Math.round(g.rh * 0.27)}px;background:#fff;color:${NAVY};box-shadow:0 22px 50px rgba(0,8,30,.4);}
.s5-ri{position:absolute;left:${pad}px;top:${pad}px;width:${g.ri}px;height:${g.ri}px;border-radius:50%;background:${ORANGE};display:flex;align-items:center;justify-content:center;}
.s5-rt{position:absolute;left:${pad * 2 + g.ri + 6}px;top:${Math.round(g.rh / 2 - g.rs * 0.62)}px;font-weight:800;font-size:${g.rs}px;line-height:1;white-space:nowrap;letter-spacing:-.01em;}
.s5-rk{position:absolute;right:${pad + 4}px;top:${Math.round((g.rh - g.rk) / 2)}px;width:${g.rk}px;height:${g.rk}px;}
`;
  const ciW = 3 * g.aw + 2 * g.ag + 52;
  const ciH = g.ah + 52;
  const ck = (i) => `<svg class="s5-rk" viewBox="0 0 80 80" aria-hidden="true">
      <circle cx="40" cy="40" r="36" fill="none" stroke="#D5DCEE" stroke-width="5"/>
      <circle id="s5-cf${i}" cx="40" cy="40" r="38" fill="${GREEN}" opacity="0"/>
      <path id="s5-cp${i}" d="M24 41l11 11 21-24" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" pathLength="1" stroke-dasharray="1 1" stroke-dashoffset="1"/></svg>`;
  const body = `
  <div id="s5-wrap" class="${p}-full">
    <div id="s5-s" class="d">${wspans("s5s", "Sério!")}</div>
    <div id="s5-s2" class="d">${wspans("s5t", "Pra essas idades:")}</div>
    ${ages
      .map(
        ([a_, v], i) => `<div class="s5-a" id="s5-a${i}" style="left:${ax0 + i * (g.aw + g.ag)}px"><div class="s5-ai">${icon("person", Math.round(g.ic * 0.58), { color: "#fff", sw: 3.6 })}</div>
      <div class="s5-at d">${a_}</div><div class="s5-av d">${v}</div></div>`,
      )
      .join("")}
    <svg id="s5-ci" viewBox="0 0 ${ciW} ${ciH}" width="${ciW}" height="${ciH}" aria-hidden="true" data-layout-allow-overlap data-layout-allow-overflow><rect id="s5-cr" x="6" y="6" width="${ciW - 12}" height="${ciH - 12}" rx="44" fill="none" stroke="${ORANGE2}" stroke-width="8" stroke-linecap="round" pathLength="1" stroke-dasharray="1 1" stroke-dashoffset="1"/></svg>
    ${rows
      .map(
        ([ic, tx], i) => `<div class="s5-r" id="s5-r${i}" style="top:${g.ry[i]}px" data-layout-allow-overflow><div class="s5-ri">${icon(ic, Math.round(g.ri * 0.56), { color: "#fff", sw: 3.4 })}</div>
      <div class="s5-rt d">${tx}</div>${ck(i)}</div>`,
      )
      .join("")}
  </div>`;
  // "Sério!" (com a risada) e "Pra essas idades aqui, ó": títulos, cartões das idades e o contorno
  add(`tl.fromTo("#s5s0",{scale:2,opacity:0},{scale:1,opacity:1,duration:0.28,ease:"power4.out"},${r3(Math.max(0, L(T.serio2) - 0.04))});`);
  [at("pra", T.serio2), T.essas, at("idades", T.essas)].forEach((t, i) => add(`tl.fromTo("#s5t${i}",{yPercent:110,opacity:0},{yPercent:0,opacity:1,duration:0.34,ease:"power3.out"},${r3(Math.max(0, L(t) - 0.06))});`));
  [0, 1, 2].forEach((i) => add(`tl.fromTo("#s5-a${i}",{y:${pick(120, 90)},opacity:0},{y:0,opacity:1,duration:0.4,ease:"back.out(1.6)"},${r3(L(T.essas) + i * 0.12)});`));
  add(`tl.to("#s5-cr",{attr:{"stroke-dashoffset":0},duration:0.5,ease:"power2.inOut"},${r3(L(T.aqui) - 0.1)});`);
  add(`tl.fromTo("#s5-ci",{scale:1},{scale:1.03,duration:0.14,ease:"sine.out",yoyo:true,repeat:1,transformOrigin:"50% 50%"},${r3(L(T.o))});`);
  // benefícios: cada linha entra e ganha o check quando é dita
  rows.forEach(([, , t], i) => {
    add(`tl.fromTo("#s5-r${i}",{x:1100},{x:0,duration:0.45,ease:"power4.out"},${r3(L(t) - 0.2)});`);
    add(`tl.to("#s5-cf${i}",{opacity:1,duration:0.15},${r3(L(t) + 0.3)});`);
    add(`tl.to("#s5-cp${i}",{attr:{"stroke-dashoffset":0},duration:0.3,ease:"power2.out"},${r3(L(t) + 0.35)});`);
  });
  add(`tl.to("#s5-wrap",{y:${-pick(140, 90)},opacity:0,duration:0.28,ease:"power3.in"},${r3(dur - 0.3)});`);
  scenes.push({ st, track: 2, ...scene(p, dur, css, body, a) });
}

// ═════════════ 6 · cartão final: "Toca no botão aqui embaixo e faz a sua cotação!" ═════════════
const BTN = pick({ x: 90, y: 1004, w: 900, h: 120 }, { x: 140, y: 572, w: 800, h: 84 });
{
  const p = "en";
  const st = END_IN;
  const dur = D - st;
  const { a, add } = TL(st);
  const g = pick(
    { lw: 500, ly: 270, ty: 430, ts: 84, cy: 640, ch: 340, cl: 38, cp: 108, cx: 70, cw: 940, ks: 24, bt: 46, by: 1138, bs: 30, fy: 1196, fs: 19, y1: 30, y2: 82, y3: 200, y4: 256 },
    { lw: 340, ly: 24, ty: 134, ts: 56, cy: 284, ch: 270, cl: 30, cp: 84, cx: 140, cw: 800, ks: 19, bt: 38, by: 664, bs: 21, fy: 702, fs: 16, y1: 22, y2: 64, y3: 158, y4: 204 },
  );
  const css =
    base(p) +
    `
#en-lw{position:absolute;left:0;width:${W}px;top:${g.ly}px;text-align:center;}
#en-t{position:absolute;left:0;width:${W}px;top:${g.ty}px;text-align:center;font-weight:900;font-size:${g.ts}px;line-height:1.08;letter-spacing:-.02em;}
#en-t .hl{color:${HL};}
#en-c{position:absolute;left:${g.cx}px;top:${g.cy}px;width:${g.cw}px;height:${g.ch}px;border-radius:36px;background:#fff;color:${NAVY};box-shadow:0 30px 70px rgba(0,8,30,.5);text-align:center;}
#en-cl{position:absolute;left:0;width:100%;top:${g.y1}px;font-weight:800;font-size:${g.cl}px;}
#en-cp{position:absolute;left:0;width:100%;top:${g.y2}px;font-weight:900;font-size:${g.cp}px;line-height:1;letter-spacing:-.045em;}
#en-cp small{font-size:.36em;letter-spacing:0;font-weight:700;margin-left:.15em;}
#en-ci{position:absolute;left:0;width:100%;top:${g.y3}px;}
#en-ci span{display:inline-block;padding:6px 18px;border-radius:20px;background:${ORANGE};color:#fff;font-family:"Mont",Arial,sans-serif;font-weight:800;font-size:${Math.round(g.cl * 0.72)}px;}
#en-ck{position:absolute;left:30px;right:30px;top:${g.y4}px;line-height:1.35;font-weight:500;font-size:${g.ks}px;color:${MUTED};}
#en-bw{position:absolute;left:${BTN.x}px;top:${BTN.y}px;width:${BTN.w}px;height:${BTN.h}px;}
#en-ring{position:absolute;inset:0;border-radius:${BTN.h}px;border:5px solid rgba(247,148,29,.9);opacity:0;}
#en-btn{position:absolute;inset:0;border-radius:${BTN.h}px;background:${ORANGE};display:flex;align-items:center;justify-content:center;gap:20px;font-weight:800;font-size:${g.bt}px;box-shadow:0 20px 50px rgba(242,101,34,.45),inset 0 2px 0 rgba(255,255,255,.3);overflow:hidden;}
#en-lb{position:absolute;left:0;width:${W}px;top:${g.by}px;display:flex;justify-content:center;align-items:center;gap:${pick(16, 12)}px;font-weight:800;font-size:${g.bs}px;color:#fff;}
.en-ar{display:inline-flex;}
#en-f{position:absolute;left:${pick(70, 60)}px;width:${W - pick(140, 120)}px;top:${g.fy}px;text-align:center;font-size:${g.fs}px;line-height:1.4;color:rgba(255,255,255,.8);}
`;
  const body = `
  <div id="en-wrap" class="${p}-full">
    <div id="en-lw">${logo(p, g.lw)}</div>
    <div id="en-t" class="d">${wspans("ena", "Acertou?")}<br>${wspans("enb", "Faça sua cotação", "hl")}</div>
    <div id="en-c">
      <div id="en-cl" class="d">SulAmérica PME · 3 vidas</div>
      <div id="en-cp" class="d">R$ 1.770,30<small>/mês</small></div>
      <div id="en-ci"><span>já com IOF</span></div>
      <div id="en-ck">Nacional · Apartamento · Coparticipação · Reembolso · Sem taxa de inscrição</div>
    </div>
    <div id="en-bw"><div id="en-ring"></div><div id="en-btn" class="d">${icon("form", Math.round(g.bt * 1.2), { id: "en-ic", color: "#fff", sw: 3.2 })}<span>Preencha o formulário</span><div id="en-bsw" class="sweep" aria-hidden="true"></div></div></div>
    <div id="en-lb" class="d"><span class="en-ar" id="en-a0">${icon("down", Math.round(g.bs * 1.3), { color: HL, sw: 4.4 })}</span><span>Toque no botão abaixo</span><span class="en-ar" id="en-a1">${icon("down", Math.round(g.bs * 1.3), { color: HL, sw: 4.4 })}</span></div>
    <div id="en-f">Cotação SulAmérica PME | Capital – 03 a 04 vidas – Apólice 12 meses · Especial Vital QP R1 · Compulsório · 30% de coparticipação · Reembolso. Valores para 3 beneficiários (0 a 18, 29 a 33 e 34 a 38 anos): R$ 1.729,15 + IOF de 2,38% = R$ 1.770,30/mês. Sem taxa de inscrição. Contratação sujeita à análise e às condições da operadora.</div>
  </div>`;
  add(`tl.fromTo("#en-lgw",{clipPath:"inset(0% 100% 0% 0%)"},{clipPath:"inset(0% 0% 0% 0%)",duration:0.6,ease:"power2.inOut"},0.1);`);
  add(`tl.fromTo("#en-lgt",{opacity:0},{opacity:1,duration:0.4},0.3);`);
  add(`tl.fromTo("#ena0",{yPercent:110,opacity:0},{yPercent:0,opacity:1,duration:0.4,ease:"power3.out"},0.15);`);
  [0, 1, 2].forEach((i) => add(`tl.fromTo("#enb${i}",{yPercent:110,opacity:0},{yPercent:0,opacity:1,duration:0.4,ease:"power3.out"},${r3(0.3 + i * 0.08)});`));
  add(`tl.fromTo("#en-c",{y:${pick(200, 150)},opacity:0},{y:0,opacity:1,duration:0.45,ease:"power3.out"},0.3);`);
  add(`tl.fromTo("#en-bw",{scale:0.6,opacity:0},{scale:1,opacity:1,duration:0.45,ease:"back.out(1.8)"},0.5);`);
  add(`tl.fromTo("#en-f",{opacity:0},{opacity:1,duration:0.5},0.8);`);
  // "aqui embaixo": setas descendo para o botão do anúncio; "cotação": brilho no botão
  const ar = r3(Math.max(0.7, T.embaixo - st - 0.25));
  add(`tl.fromTo("#en-lb",{opacity:0,y:-14},{opacity:1,y:0,duration:0.35,ease:"power3.out"},${ar});`);
  const nb = Math.floor((dur - ar - 0.4) / 0.5);
  add(`tl.fromTo(["#en-a0","#en-a1"],{y:0},{y:${pick(14, 10)},duration:0.25,ease:"sine.inOut",repeat:${nb * 2 - 1},yoyo:true},${ar});`);
  add(`tl.fromTo("#en-bsw",{xPercent:-100},{xPercent:100,duration:0.8,ease:"power2.inOut"},${r3(Math.max(1.0, T.cotacao - st - 0.1))});`);
  add(`tl.fromTo("#en-ic",{rotation:0},{rotation:12,duration:0.1,ease:"sine.inOut",repeat:5,yoyo:true},${r3(Math.max(1.0, T.cotacao - st))});`);
  for (let t = Math.max(1.9, T.cotacao - st + 0.9); t + 1.0 <= dur - 0.4; t += 1.0) {
    add(`tl.fromTo("#en-btn",{scale:1},{scale:1.04,duration:0.5,ease:"sine.inOut",immediateRender:false},${r3(t)});`);
    add(`tl.to("#en-btn",{scale:1,duration:0.5,ease:"sine.inOut"},${r3(t + 0.5)});`);
    add(`tl.fromTo("#en-ring",{opacity:0.7,scale:1},{opacity:0,scale:1.12,duration:0.9,ease:"power2.out",immediateRender:false},${r3(t)});`);
  }
  scenes.push({ st, track: 3, ...scene(p, dur, css, body, a) });
}

// ═════════════ legendas palavra a palavra (consultor em laranja, cliente em verde) ═════════════
const CAP = [
  [["Ei,", 0], ["você", 1], ["tem", 2], ["CNPJ?", 3]],
  [["SulAmérica", 4], ["PME,", 5]],
  [["3", 6], ["vidas,", 7]],
  [["por", 8], ["R$ 1.770,30", 9, 16]],
  [["por", 17], ["mês…", 18]],
  [["já", 19], ["com", 20], ["IOF!", 21]],
  [["Sério?!", 22]],
  [["Pra", 23], ["três", 24], ["pessoas?!", 25]],
  [["Sério!", 26]],
  [["Pra", 27], ["essas", 28], ["idades", 29], ["aqui,", 30], ["ó.", 31]],
  [["Abrangência", 32], ["nacional,", 33]],
  [["apartamento,", 34]],
  [["coparticipação,", 35]],
  [["reembolso…", 36]],
  [["e", 37], ["sem", 38], ["taxa", 39], ["de", 40], ["inscrição!", 41]],
  [["Toca", 42], ["no", 43], ["botão", 44]],
  [["aqui", 45], ["embaixo", 46]],
  [["e", 47], ["faz", 48], ["a", 49], ["sua", 50], ["cotação!", 51]],
];
{
  const p = "cap";
  const { a, add } = TL(0);
  const g = pick({ y: 1390, h: 110, fs: 54 }, { y: 950, h: 92, fs: 44 });
  const css =
    base(p) +
    `
.cap-g{position:absolute;left:40px;width:${W - 80}px;top:${g.y}px;height:${g.h}px;display:flex;justify-content:center;align-items:center;opacity:0;}
.cap-in{display:inline-block;padding:10px 26px;border-radius:24px;background:rgba(0,12,40,.7);font-family:"Mont",Arial,sans-serif;font-weight:800;font-size:${g.fs}px;line-height:1.15;letter-spacing:-.01em;word-spacing:.06em;white-space:nowrap;}
.cap-w{display:inline-block;color:rgba(255,255,255,.45);}
`;
  const tok = (gi, q) => `cap-w${gi}-${q}`;
  const body = CAP.map(
    (grp, gi) =>
      `<div class="cap-g" id="cap-g${gi}"><span class="cap-in">${grp.map(([tx], q) => `<span class="cap-w" id="${tok(gi, q)}">${tx}</span>`).join(" ")}</span></div>`,
  ).join("\n");
  const s0 = (gi) => WORDS[CAP[gi][0][1]].start;
  const e0 = (gi) => {
    const last = CAP[gi][CAP[gi].length - 1];
    return WORDS[last[2] ?? last[1]].end;
  };
  CAP.forEach((grp, gi) => {
    const on = r3(Math.max(0, s0(gi) - 0.08));
    // a frase seguinte só entra depois que esta sumiu (corte limpo)
    const next = gi + 1 < CAP.length ? s0(gi + 1) - 0.15 : D - 0.2;
    const off = r3(Math.min(next, e0(gi) + 0.6));
    const hl = WORDS[grp[0][1]].spk === "cliente" ? CLI_HL : HL;
    add(`tl.fromTo("#cap-g${gi}",{opacity:0,y:18},{opacity:1,y:0,duration:0.14,ease:"power2.out"},${on});`);
    add(`tl.to("#cap-g${gi}",{opacity:0,duration:0.06},${r3(Math.max(on + 0.2, off))});`);
    grp.forEach(([, i0, i1], q) => {
      const ws = WORDS[i0].start;
      const we = WORDS[i1 ?? i0].end;
      add(`tl.set("#${tok(gi, q)}",{color:"${hl}"},${r3(ws)});`);
      add(`tl.set("#${tok(gi, q)}",{color:"#FFFFFF"},${r3(Math.max(ws + 0.12, we))});`);
    });
  });
  scenes.push({ st: 0, track: 8, ...scene(p, D, css, body, a) });
}

// ═════════════ clarões e grão ═════════════
{
  const p = "ui";
  const { a, add } = TL(0);
  const NOISE =
    "data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E";
  const css = `#ui-root{position:absolute;inset:0;width:${W}px;height:${H}px;overflow:hidden;pointer-events:none;}
#ui-fl{position:absolute;inset:0;background:radial-gradient(70% 50% at 50% 40%,rgba(255,220,190,.85),rgba(242,101,34,.3) 60%,rgba(242,101,34,0));opacity:0;}
#ui-tex{position:absolute;left:-128px;top:-128px;width:${W + 256}px;height:${H + 256}px;background:url("${NOISE}") 0 0/256px 256px repeat;opacity:.04;mix-blend-mode:overlay;}`;
  const body = `<div id="ui-fl" aria-hidden="true"></div><div id="ui-tex" data-layout-allow-overflow aria-hidden="true"></div>`;
  [
    [REVEAL, 0.45],
    [END_IN, 0.3],
  ].forEach(([t, o], i) => {
    add(`tl.fromTo("#ui-fl",{opacity:0},{opacity:${o},duration:0.08,ease:"power2.out"${i ? ",immediateRender:false" : ""}},${r3(t)});`);
    add(`tl.to("#ui-fl",{opacity:0,duration:0.45,ease:"power2.out"},${r3(t + 0.08)});`);
  });
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
  ["pop", T.ei, 0.2],
  ["impact", T.cnpj, 0.3],
  ["whoosh", Q_IN - 0.05, 0.3],
  ["pop", Q_IN + 0.12, 0.22],
  ...OPT.map((t) => ["card", t + 0.05, 0.22]),
  ...TICK.map((t) => ["clock", t, 0.3]),
  ["riser", REVEAL, 0.32],
  ["check", REVEAL, 0.32],
  ["impact", LN.k1.start + 0.1, 0.36],
  ["shimmer", T.sula, 0.26],
  ["tap", T.pme, 0.2],
  ["pop", T.tres, 0.2],
  ["pop", T.tres + 0.12, 0.18],
  ["pop", T.tres + 0.24, 0.18],
  ["counter", T.mil, 0.16],
  ["shimmer", T.centavos + 0.1, 0.2],
  ["stamp", T.iof, 0.5],
  ["whoosh", S3_OUT, 0.24],
  ["pop", S3_OUT + 0.05, 0.26],
  ["boing", T.serio1, 0.42],
  ["pop", T.pessoas, 0.2],
  ["whoosh", S4_OUT, 0.24],
  ...[0, 1, 2].map((i) => ["card", T.essas + i * 0.12, 0.2]),
  ["shimmer", T.aqui, 0.18],
  ...[T.abr, T.apt, T.cop, T.ree, T.sem].map((t) => ["check", t + 0.3, 0.22]),
  ["whoosh", END_IN, 0.22],
  ["impact", END_IN + 0.1, 0.2],
  ["pop", T.embaixo, 0.16],
  ["shimmer", T.cotacao, 0.2],
];
const SFX_DUR = { counter: 2.4 };
function allocTracks(items, first) {
  const ends = [];
  return items.map((it) => {
    let q = ends.findIndex((e) => e <= it.at + 1e-6);
    if (q < 0) q = ends.push(0) - 1;
    ends[q] = it.at + it.dur;
    return first + q;
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
  `<audio id="el-bgm" src="assets/audio/bgm.wav" data-start="0" data-duration="${D}" data-track-index="20" data-volume="0.4"></audio>`,
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
writeFileSync(
  join(ROOT, "tools", "timing.json"),
  JSON.stringify({ ...T, quiz: Q_IN, options: OPT, ticks: TICK, reveal: REVEAL, s3out: S3_OUT, s4out: S4_OUT, endIn: END_IN, end: D }, null, 1),
);
console.log(`${FMT} ${W}x${H}: ${D}s, ${scenes.length} composições, ${SFX.length} SFX, ${CAP.length} grupos de legenda`);
