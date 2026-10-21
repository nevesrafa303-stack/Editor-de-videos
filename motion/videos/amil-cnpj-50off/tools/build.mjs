#!/usr/bin/env node
// build.mjs — anúncio Amil "Metade." (50% na 1ª e na 2ª mensalidade, PME), story 9:16 e feed 1:1.
//
//   node tools/build.mjs story   -> compositions/*.html + index.html
//   node tools/build.mjs feed    -> feed/compositions/*.html + feed/index.html
//
// Sete cenas + fundo animado + camada de toque/grão. Os tempos saem das palavras da
// locução (assets/voice/vo.words.json). Visual tirado das peças da campanha: gradiente
// azul-violeta com brilho neon e anel (ADS01), faturas em papel creme com a conta
// 100% − 50% = 50% (v3), calendário de outubro (v4) e a serifa itálica das versões e1/e4.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const FMT = process.argv[2] === "feed" ? "feed" : "story";
const ST = FMT === "story";
const W = 1080;
const H = ST ? 1920 : 1080;
const FPS = 30;
const D = 39;
const r3 = (x) => Math.round(x * 1000) / 1000;
const pick = (s, f) => (ST ? s : f);

// paleta (das peças)
const NAVY = "#0E0A55";
const INDIGO = "#2A1BE0";
const CYAN = "#4FE3F7";
const VIOLET = "#9B3BFF";
const CREAM = "#F4F1EA";
const AMBER = "#FFC542";
const MUTED = "#5B5F7A";

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

// ───────────── utilidades ─────────────
const FONTS = `@font-face{font-family:"Sora";font-weight:100 800;font-style:normal;font-display:block;src:url("assets/fonts/Sora-Variable.woff2") format("woff2");}
@font-face{font-family:"Instrument Serif";font-weight:400;font-style:italic;font-display:block;src:url("assets/fonts/InstrumentSerif-Italic.woff2") format("woff2");}`;

function wspans(p, text, cls = "") {
  let i = 0;
  let on = false;
  return text
    .split(" ")
    .map((w) => {
      if (w.startsWith("*")) on = true;
      const it = on;
      if (/\*[.,:?!]?$/.test(w)) on = false;
      const clean = w.replace(/\*/g, "");
      return `<span class="w"><span class="wi${it ? " it" : ""}${cls ? " " + cls : ""}" id="${p}${i++}">${clean}</span></span>`;
    })
    .join(" ");
}

const base = (p) => `
${FONTS}
#${p}-root{position:absolute;inset:0;width:${W}px;height:${H}px;overflow:hidden;font-family:"Sora",Arial,sans-serif;color:#fff;}
.${p}-full{position:absolute;left:0;top:0;width:${W}px;height:${H}px;}
.${p}-lbl{position:absolute;font-weight:600;letter-spacing:.2em;text-transform:uppercase;white-space:nowrap;}
.${p}-h{position:absolute;font-weight:800;letter-spacing:-.045em;line-height:1;white-space:nowrap;}
.${p}-c{left:0;width:${W}px;text-align:center;}
.it{font-family:"Instrument Serif",Georgia,serif;font-style:italic;font-weight:400;letter-spacing:-.01em;}
.w{display:inline-block;overflow:hidden;vertical-align:top;padding:0.12em 0.04em 0.08em;margin:-0.12em -0.04em -0.08em;}
.wi{display:inline-block;}
.logo{display:inline-block;-webkit-mask:url("assets/img/amil-logo.png") center/contain no-repeat;mask:url("assets/img/amil-logo.png") center/contain no-repeat;}
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
  const words = (p, n, times, dur = 0.42, from = 110) => {
    for (let i = 0; i < n; i++)
      add(`tl.fromTo("#${p}${i}",{yPercent:${from},opacity:0},{yPercent:0,opacity:1,duration:${dur},ease:"power3.out"},${r3(Math.max(0, L(times[i]) - 0.08))});`);
  };
  // entrada/saída padrão da cena
  const enter = (sel, t = 0) => add(`tl.fromTo("${sel}",{opacity:0,y:${pick(90, 60)}},{opacity:1,y:0,duration:0.32,ease:"power3.out"},${r3(t)});`);
  const leave = (sel, dur) => add(`tl.to("${sel}",{opacity:0,y:-${pick(110, 70)},scale:0.97,duration:0.26,ease:"power2.in"},${r3(dur - 0.26)});`);
  return { a, L, add, words, enter, leave };
}

const ICONS = {
  check: `<path d="M12 25l8 8 16-18"/>`,
  pin: `<path d="M24 43s13-12.5 13-23a13 13 0 1 0-26 0c0 10.5 13 23 13 23z"/><circle cx="24" cy="20" r="5"/>`,
  alert: `<path d="M24 7L43 40H5z"/><path d="M24 19v10M24 34v.5"/>`,
  hand: `<path d="M19 26V10a3 3 0 0 1 6 0v12m0-2a3 3 0 0 1 6 0v3m0-1a3 3 0 0 1 6 0v3m0-1a3 3 0 0 1 6 0v8c0 7-5 12-12 12h-3c-4 0-6-2-8-5l-6-9a3 3 0 0 1 5-3l3 4"/>`,
  bed: `<path d="M5 36V12M5 28h38v8M43 28v-4a6 6 0 0 0-6-6H22v10"/><circle cx="13" cy="22" r="4"/>`,
  globe: `<circle cx="24" cy="24" r="17"/><path d="M7 24h34M24 7c5 5 7 11 7 17s-2 12-7 17c-5-5-7-11-7-17s2-12 7-17z"/>`,
  plane: `<path d="M42 10L6 24l13 4 4 13 6-9 9 6z"/><path d="M19 28l23-18"/>`,
  person: `<circle cx="24" cy="14" r="8"/><path d="M8 44c0-9 7-15 16-15s16 6 16 15"/>`,
};
const icon = (name, size, { id = "", sw = 3.2, color = "#fff", fill = "none" } = {}) =>
  `<svg ${id ? `id="${id}" ` : ""}viewBox="0 0 48 48" width="${size}" height="${size}" fill="${fill}" stroke="${color}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${ICONS[name]}</svg>`;

// fatura em papel creme (v3): rótulo, mensalidade, desconto, você paga
function invoice(p, { w, h, k, title = "Fatura", mini = false }) {
  const pad = Math.round(44 * k);
  if (!mini)
    return `<div class="${p}-inv" style="width:${w}px;height:${h}px;padding:${pad}px">
      <div style="display:flex;justify-content:space-between;align-items:flex-start">
        <div><div style="font-weight:700;font-size:${Math.round(32 * k)}px;letter-spacing:.14em;color:${NAVY}">FATURA</div><div style="margin-top:${Math.round(10 * k)}px;font-weight:500;font-size:${Math.round(24 * k)}px;color:${MUTED}">Plano de saúde · CNPJ</div></div>
        <span class="logo" style="width:${Math.round(130 * k)}px;height:${Math.round(50 * k)}px;background:${INDIGO}"></span>
      </div>
      <div style="margin-top:${Math.round(40 * k)}px;border-top:${Math.max(2, Math.round(3 * k))}px dashed #D6D1E6"></div>
      <div style="margin-top:${Math.round(30 * k)}px;display:flex;justify-content:space-between;align-items:flex-end">
        <span style="font-weight:500;font-size:${Math.round(28 * k)}px;color:${MUTED}">Mensalidade</span>
        <span style="font-weight:800;font-size:${Math.round(60 * k)}px;letter-spacing:-.03em;color:${NAVY};font-variant-numeric:tabular-nums">R$ ●.●●●,●●</span>
      </div>
      <div style="margin-top:${Math.round(18 * k)}px;display:flex;justify-content:space-between;font-weight:500;font-size:${Math.round(24 * k)}px;color:${MUTED}"><span>Vencimento</span><span>●●/●●/2026</span></div>
      <div style="position:absolute;left:${pad}px;right:${pad}px;bottom:${pad}px;height:${Math.round(70 * k)}px;background:repeating-linear-gradient(90deg,${NAVY} 0 3px,transparent 3px 7px,${NAVY} 7px 8px,transparent 8px 12px,${NAVY} 12px 16px,transparent 16px 19px);opacity:.85"></div>
    </div>`;
  return `<div class="${p}-inv" style="width:${w}px;height:${h}px;padding:${pad}px ${pad}px">
      <div style="font-weight:800;font-size:${Math.round(44 * k)}px;letter-spacing:-.03em;color:${NAVY}">${title}</div>
      <div style="margin-top:${Math.round(22 * k)}px;border-top:${Math.max(2, Math.round(3 * k))}px dashed #D6D1E6"></div>
      <div class="${p}-row" style="margin-top:${Math.round(26 * k)}px;font-size:${Math.round(27 * k)}px"><span style="color:${MUTED};font-weight:500">Mensalidade</span><span class="${p}-full100" style="position:relative;color:#8A86A6;font-weight:700">100%<i class="${p}-strike"></i></span></div>
      <div class="${p}-row ${p}-disc" style="margin-top:${Math.round(18 * k)}px;font-size:${Math.round(27 * k)}px;color:${INDIGO};font-weight:700"><span>Desconto de outubro</span><span>−50%</span></div>
      <div style="margin-top:${Math.round(20 * k)}px;border-top:2px solid #E6E2F0"></div>
      <div class="${p}-row ${p}-pay" style="margin-top:${Math.round(18 * k)}px;align-items:flex-end"><span style="font-weight:700;font-size:${Math.round(28 * k)}px;color:${NAVY}">Você paga</span><span style="font-weight:800;font-size:${Math.round(76 * k)}px;letter-spacing:-.04em;color:${NAVY};line-height:.9">50%</span></div>
    </div>`;
}
const invCss = (p, k) => `
.${p}-inv{position:relative;box-sizing:border-box;border-radius:${Math.round(36 * k)}px;background:${CREAM};color:${NAVY};box-shadow:0 40px 90px rgba(5,4,40,.45);overflow:hidden;}
.${p}-row{display:flex;justify-content:space-between;align-items:center;white-space:nowrap;}
.${p}-strike{position:absolute;left:-4%;top:50%;width:108%;height:${Math.max(3, Math.round(4 * k))}px;background:${NAVY};transform-origin:0 50%;}
`;

const scenes = [];

// ═════════════ fundo animado (gradiente da campanha + brilhos + arcos) ═════════════
{
  const p = "bg";
  const { a, add } = TL(0);
  const css =
    base(p) +
    `
#bg-base{background:linear-gradient(160deg,#170C78 0%,#2116C8 42%,#1530C8 68%,#0A0F55 100%);}
.bg-blob{position:absolute;border-radius:50%;}
#bg-b1{left:${pick(-420, -380)}px;top:${pick(-380, -420)}px;width:${pick(1200, 1000)}px;height:${pick(1200, 1000)}px;background:radial-gradient(closest-side,rgba(155,59,255,.75),rgba(155,59,255,0));}
#bg-b2{left:${pick(380, 480)}px;top:${pick(1100, 520)}px;width:${pick(1200, 1000)}px;height:${pick(1200, 1000)}px;background:radial-gradient(closest-side,rgba(47,211,243,.55),rgba(47,211,243,0));}
#bg-b3{left:${pick(200, 180)}px;top:${pick(500, 160)}px;width:${pick(900, 760)}px;height:${pick(900, 760)}px;background:radial-gradient(closest-side,rgba(70,90,255,.45),rgba(70,90,255,0));}
#bg-arcs{position:absolute;left:0;top:0;}
#bg-vig{background:radial-gradient(120% 80% at 50% 45%,rgba(0,0,0,0) 55%,rgba(4,3,30,.55) 100%);}
`;
  const body = `
  <div id="bg-base" class="${p}-full"></div>
  <div id="bg-b1" class="bg-blob" data-layout-allow-overflow></div><div id="bg-b2" class="bg-blob" data-layout-allow-overflow></div><div id="bg-b3" class="bg-blob" data-layout-allow-overflow></div>
  <svg id="bg-arcs" data-layout-allow-overflow viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
    <g id="bg-arc1"><circle cx="${pick(-200, -260)}" cy="${pick(2150, 1300)}" r="${pick(900, 700)}" fill="none" stroke="rgba(160,120,255,.45)" stroke-width="3"/></g>
    <g id="bg-arc2"><circle cx="${pick(1350, 1400)}" cy="${pick(2200, 1350)}" r="${pick(700, 560)}" fill="none" stroke="rgba(79,227,247,.5)" stroke-width="4"/></g>
    <g id="bg-arc3"><circle cx="${pick(1350, 1400)}" cy="${pick(2200, 1350)}" r="${pick(780, 630)}" fill="none" stroke="rgba(79,227,247,.22)" stroke-width="2"/></g>
  </svg>
  <div id="bg-vig" class="${p}-full"></div>`;
  add(`tl.fromTo("#bg-b1",{x:0,y:0},{x:${pick(160, 120)},y:${pick(220, 120)},duration:9.75,ease:"sine.inOut",repeat:3,yoyo:true},0);`);
  add(`tl.fromTo("#bg-b2",{x:0,y:0},{x:${pick(-220, -160)},y:${pick(-260, -140)},duration:7.8,ease:"sine.inOut",repeat:4,yoyo:true},0);`);
  add(`tl.fromTo("#bg-b3",{scale:1,opacity:.7},{scale:1.25,opacity:1,duration:6.5,ease:"sine.inOut",repeat:5,yoyo:true},0);`);
  add(`tl.fromTo("#bg-arc1",{rotation:0},{rotation:18,duration:${D},ease:"none",svgOrigin:"${pick(-200, -260)} ${pick(2150, 1300)}"},0);`);
  add(`tl.fromTo("#bg-arc2",{rotation:0},{rotation:-14,duration:${D},ease:"none",svgOrigin:"${pick(1350, 1400)} ${pick(2200, 1350)}"},0);`);
  add(`tl.fromTo("#bg-arc3",{rotation:0},{rotation:-9,duration:${D},ease:"none",svgOrigin:"${pick(1350, 1400)} ${pick(2200, 1350)}"},0);`);
  scenes.push({ st: 0, track: 0, ...scene(p, D, css, body, a) });
}

// ═════════════ 1 · "Metade." — a fatura cortada ao meio ═════════════
{
  const p = "s1";
  const st = 0;
  const dur = at("cinquenta") - 0.15;
  const { a, L, add, words, leave } = TL(st);
  const c = pick({ x: 140, y: 600, w: 800, h: 520, k: 1 }, { x: 220, y: 200, w: 640, h: 416, k: 0.8 });
  const g = pick(
    { m0: 1170, m1: 470, ms: 300, la: 850, lb: 930, lc: 1050, ld: 1130, fa: 56, fb: 92, fc: 56, fd: 64, lh: 76 },
    { m0: 650, m1: 230, ms: 220, la: 512, lb: 578, lc: 680, ld: 748, fa: 44, fb: 76, fc: 44, fd: 52, lh: 60 },
  );
  // linha do corte: do canto de baixo à esquerda ao de cima à direita (com sobra)
  const P1 = [c.x - 70, c.y + c.h + 50];
  const P2 = [c.x + c.w + 70, c.y - 50];
  const yAt = (x) => P1[1] + ((x - P1[0]) * (P2[1] - P1[1])) / (P2[0] - P1[0]);
  const yl = r3(yAt(c.x) - c.y);
  const yr = r3(yAt(c.x + c.w) - c.y);
  const len = Math.round(Math.hypot(P2[0] - P1[0], P2[1] - P1[1]));
  const css =
    base(p) +
    invCss(p, c.k) +
    `
.s1-half{position:absolute;left:${c.x}px;top:${c.y}px;width:${c.w}px;height:${c.h}px;}
#s1-ha .s1-inv{clip-path:polygon(0 0,100% 0,100% ${yr}px,0 ${yl}px);}
#s1-hb .s1-inv{clip-path:polygon(0 ${yl}px,100% ${yr}px,100% 100%,0 100%);}
#s1-cut{position:absolute;left:0;top:0;filter:drop-shadow(0 0 14px rgba(79,227,247,.95)) drop-shadow(0 0 40px rgba(79,227,247,.6));}
#s1-flash{background:radial-gradient(60% 40% at 50% ${Math.round(((c.y + c.h / 2) / H) * 100)}%,rgba(140,240,255,.55),rgba(140,240,255,0));opacity:0;}
#s1-met{position:absolute;left:0;width:${W}px;top:${g.m0}px;text-align:center;font-size:${g.ms}px;line-height:1;color:#fff;text-shadow:0 0 40px rgba(79,227,247,.55),0 10px 40px rgba(0,0,0,.35);}
.s1-l{position:absolute;left:0;width:${W}px;text-align:center;white-space:nowrap;letter-spacing:-.035em;line-height:1;}
#s1-la{top:${g.la}px;font-size:${g.fa}px;font-weight:600;color:rgba(255,255,255,.82);}
#s1-lb{top:${g.lb}px;font-size:${g.fb}px;font-weight:800;}
#s1-lb .hl{color:${CYAN};}
#s1-lc{top:${g.lc}px;font-size:${g.fc}px;font-weight:600;color:rgba(255,255,255,.82);}
#s1-ld{top:${g.ld}px;display:flex;justify-content:center;align-items:center;gap:${pick(22, 18)}px;font-size:${g.fd}px;font-weight:800;}
#s1-logo{width:${pick(190, 150)}px;height:${pick(74, 58)}px;background:#fff;}
#s1-ld .hl{color:${CYAN};}
`;
  const body = `
  <div id="s1-flash" class="${p}-full"></div>
  <div id="s1-ha" class="s1-half">${invoice(p, { ...c })}</div>
  <div id="s1-hb" class="s1-half">${invoice(p, { ...c })}</div>
  <svg id="s1-cut" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}"><path id="s1-cutp" d="M${P1[0]} ${P1[1]} L${P2[0]} ${P2[1]}" stroke="#BFF8FF" stroke-width="7" stroke-linecap="round" fill="none" stroke-dasharray="${len} ${len + 40}" stroke-dashoffset="${len}"/></svg>
  <div id="s1-met" class="it">Metade.</div>
  <div id="s1-la" class="s1-l">${wspans("s1a", "É isso que você paga")}</div>
  <div id="s1-lb" class="s1-l">${wspans("s1b", "nas 2 primeiras faturas").replace('class="wi" id="s1b1"', 'class="wi hl" id="s1b1"')}</div>
  <div id="s1-lc" class="s1-l">${wspans("s1c", "do plano de saúde")}</div>
  <div id="s1-ld" class="s1-l"><span class="w"><span class="wi logo" id="s1-logo"></span></span><span class="w"><span class="wi" id="s1d0">para</span></span><span class="w"><span class="wi hl" id="s1d1">CNPJ.</span></span></div>`;
  // a fatura entra com peso
  add(`tl.fromTo(".s1-half",{scale:1.18,opacity:0,rotation:-3},{scale:1,opacity:1,rotation:0,duration:0.22,ease:"power3.out"},0);`);
  // corte a laser no "Metade."
  const tc = at("metade");
  add(`tl.fromTo("#s1-cutp",{attr:{"stroke-dashoffset":${len}}},{attr:{"stroke-dashoffset":0},duration:0.2,ease:"power2.in"},${r3(tc)});`);
  add(`tl.fromTo("#s1-flash",{opacity:0},{opacity:1,duration:0.08},${r3(tc + 0.2)});`);
  add(`tl.to("#s1-flash",{opacity:0,duration:0.5,ease:"power2.out"},${r3(tc + 0.28)});`);
  add(`tl.to("#s1-cut",{opacity:0,duration:0.3},${r3(tc + 0.3)});`);
  // metade de cima sai voando; a outra fica
  add(`tl.to("#s1-ha",{x:${pick(-330, -260)},y:${pick(-260, -180)},rotation:-16,opacity:0,duration:0.7,ease:"power2.in"},${r3(tc + 0.24)});`);
  add(`tl.fromTo("#s1-hb",{x:0,y:0},{x:${pick(26, 20)},y:${pick(16, 12)},duration:0.25,ease:"power2.out"},${r3(tc + 0.22)});`);
  add(`tl.fromTo("#s1-met",{scale:1.6,opacity:0},{scale:1,opacity:1,duration:0.32,ease:"power4.out"},${r3(tc + 0.26)});`);
  // tremida curta no impacto
  [0, 1, 2, 3].forEach((i) => add(`tl.set("#s1-root",{x:${[10, -8, 5, 0][i]},y:${[-6, 5, -3, 0][i]}},${r3(tc + 0.26 + i / FPS)});`));
  // abre espaço para a frase
  const t2 = at("e") - 0.12;
  add(`tl.to("#s1-hb",{y:${pick(420, 320)},rotation:9,opacity:0,duration:0.6,ease:"power2.in"},${r3(t2)});`);
  add(`tl.to("#s1-met",{y:${g.m1 - g.m0},duration:0.6,ease:"power3.inOut"},${r3(t2)});`);
  words("s1a", 5, [at("e"), at("isso"), at("que"), at("voce"), at("paga")]);
  words("s1b", 4, [at("nas"), at("duas"), at("primeiras"), at("faturas")]);
  words("s1c", 4, [at("do"), at("plano"), at("de"), at("saude")]);
  add(`tl.fromTo("#s1-logo",{yPercent:110,opacity:0},{yPercent:0,opacity:1,duration:0.45,ease:"power3.out"},${r3(at("amil") - 0.08)});`);
  words("s1d", 2, [at("para"), at("cnpj")]);
  leave("#s1-root", dur);
  scenes.push({ st, track: 1, ...scene(p, dur, css, body, a) });
}

// ═════════════ 2 · 50% de desconto na 1ª e na 2ª mensalidade ═════════════
function ringSvg(id, r, sw, extra = "") {
  const C = r3(2 * Math.PI * r);
  const s = 2 * (r + sw);
  return `<svg id="${id}" viewBox="0 0 ${s} ${s}" width="${s}" height="${s}" ${extra}>
    <defs><linearGradient id="${id}-g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${CYAN}"/><stop offset=".55" stop-color="#5B6BFF"/><stop offset="1" stop-color="${VIOLET}"/></linearGradient></defs>
    <circle cx="${s / 2}" cy="${s / 2}" r="${r}" fill="none" stroke="rgba(255,255,255,.08)" stroke-width="${sw}"/>
    <circle cx="${s / 2}" cy="${s / 2}" r="${r - sw * 1.6}" fill="rgba(10,6,70,.35)" stroke="rgba(155,59,255,.35)" stroke-width="2"/>
    <circle id="${id}-arc" cx="${s / 2}" cy="${s / 2}" r="${r}" fill="none" stroke="url(#${id}-g)" stroke-width="${sw}" stroke-linecap="round" stroke-dasharray="${C} ${C}" stroke-dashoffset="${C}" transform="rotate(-90 ${s / 2} ${s / 2})"/>
  </svg>`;
}
{
  const p = "s2";
  const st = at("cinquenta") - 0.25;
  const dur = at("para", 1) - 0.12 - st;
  const { a, L, add, words, enter, leave } = TL(st);
  const g = pick(
    { rc: [540, 590], r: 290, sw: 26, pc: 600, ps: 290, dd: 930, ds: 68, cards: { y: 1050, w: 450, h: 440, xs: [60, 570], k: 0.9 }, bx: 380 },
    { rc: [540, 330], r: 220, sw: 22, pc: 336, ps: 220, dd: 590, ds: 54, cards: { y: 672, w: 440, h: 360, xs: [70, 570], k: 0.74 }, bx: 370 },
  );
  const C = r3(2 * Math.PI * g.r);
  const css =
    base(p) +
    invCss(p, g.cards.k) +
    `
#s2-ring{position:absolute;left:${g.rc[0] - g.r - g.sw}px;top:${g.rc[1] - g.r - g.sw}px;filter:drop-shadow(0 0 26px rgba(79,227,247,.55));}
#s2-pct{position:absolute;left:0;width:${W}px;top:${g.pc - g.ps * 0.52}px;text-align:center;font-weight:800;font-size:${g.ps}px;letter-spacing:-.06em;line-height:1;color:#fff;font-variant-numeric:tabular-nums;}
#s2-pct sup{font-size:.42em;vertical-align:.95em;margin-left:.02em;letter-spacing:0;}
#s2-dd{top:${g.dd}px;font-size:${g.ds}px;}
.s2-card{position:absolute;top:${g.cards.y}px;}
.s2-badge{position:absolute;right:${Math.round(-18 * g.cards.k)}px;top:${Math.round(-26 * g.cards.k)}px;width:${Math.round(140 * g.cards.k)}px;height:${Math.round(140 * g.cards.k)}px;border-radius:50%;background:${INDIGO};box-shadow:0 0 0 ${Math.round(6 * g.cards.k)}px rgba(255,255,255,.9) inset,0 20px 40px rgba(20,10,120,.45);display:flex;flex-direction:column;align-items:center;justify-content:center;color:#fff;transform:rotate(-12deg);}
.s2-badge b{font-weight:800;font-size:${Math.round(44 * g.cards.k)}px;letter-spacing:-.04em;line-height:1;}
.s2-badge span{font-weight:700;font-size:${Math.round(18 * g.cards.k)}px;letter-spacing:.16em;}
`;
  const cards = [0, 1]
    .map(
      (i) =>
        `<div class="s2-card" id="s2-c${i}" style="left:${g.cards.xs[i]}px">${invoice(`${p}`, { w: g.cards.w, h: g.cards.h, k: g.cards.k, mini: true, title: i ? "2ª fatura" : "1ª fatura" }).replace(`class="${p}-inv"`, `class="${p}-inv" id="s2-inv${i}"`)}<div class="s2-bw" id="s2-bw${i}" style="position:absolute;right:0;top:0"><div class="s2-badge"><b>50%</b><span>OFF</span></div></div></div>`,
    )
    .join("");
  const body = `
  <div id="s2-wrap" class="${p}-full">
    ${ringSvg("s2-ring", g.r, g.sw)}
    <div id="s2-pct"><span id="s2-num">0</span><sup>%</sup></div>
    <div id="s2-dd" class="${p}-h ${p}-c">${wspans("s2a", "DE DESCONTO")}</div>
    ${cards}
  </div>`;
  enter("#s2-wrap");
  const t0 = L(at("cinquenta"));
  add(`tl.fromTo("#s2-ring-arc",{attr:{"stroke-dashoffset":${C}}},{attr:{"stroke-dashoffset":${r3(C * 0.5)}},duration:0.7,ease:"power3.out"},${t0});`);
  add(`tl.fromTo("#s2-pct",{scale:1.35,opacity:0},{scale:1,opacity:1,duration:0.35,ease:"power4.out"},${r3(t0 - 0.05)});`);
  for (let s = 0; s <= 15; s++) add(`tl.set("#s2-num",{textContent:"${Math.round(50 * (1 - Math.pow(1 - s / 15, 3)))}"},${r3(t0 + (s / 15) * 0.6)});`);
  add(`tl.fromTo("#s2-ring",{rotation:-30},{rotation:0,duration:1.2,ease:"power3.out"},${t0});`);
  words("s2a", 2, [at("de", 1), at("desconto")], 0.4);
  // as duas faturas: mensalidade riscada, desconto, você paga 50%
  const ct = [at("primeira") - 0.2, at("segunda") - 0.2];
  ct.forEach((t, i) => {
    add(`tl.fromTo("#s2-c${i}",{y:${pick(160, 120)},opacity:0,rotation:${i ? 4 : -4}},{y:0,opacity:1,rotation:${i ? 1.5 : -1.5},duration:0.5,ease:"power3.out"},${L(t)});`);
    add(`tl.fromTo("#s2-inv${i} .s2-strike",{scaleX:0},{scaleX:1,duration:0.22,ease:"power2.out"},${r3(L(t) + 0.32)});`);
    add(`tl.fromTo("#s2-inv${i} .s2-disc",{opacity:0,x:-20},{opacity:1,x:0,duration:0.3,ease:"power3.out"},${r3(L(t) + 0.42)});`);
    add(`tl.fromTo("#s2-inv${i} .s2-pay",{opacity:0,y:16},{opacity:1,y:0,duration:0.35,ease:"power3.out"},${r3(L(t) + 0.55)});`);
  });
  [at("mensalidade") - 0.05, at("mensalidade") + 0.12].forEach((t, i) =>
    add(`tl.fromTo("#s2-bw${i}",{scale:2.2,opacity:0},{scale:1,opacity:1,duration:0.2,ease:"power3.in"},${L(t)});`),
  );
  leave("#s2-wrap", dur);
  scenes.push({ st, track: 2, ...scene(p, dur, css, body, a) });
}

// ═════════════ 3 · SP e RJ, de 2 a 99 vidas ═════════════
{
  const p = "s3";
  const st = at("para", 1) - 0.2;
  const dur = at("nas", 1) - 0.12 - st;
  const { a, L, add, words, enter, leave } = TL(st);
  const g = pick(
    { lbl: [72, 296], chips: [72, 346], ch: 88, cf: 44, num: { x: 72, y: 590, s: 260 }, sub: 880, grid: { x: 94, y: 990, cols: 11, sx: 82, sy: 52, ic: 44 } },
    { lbl: [60, 84], chips: [60, 128], ch: 72, cf: 34, num: { x: 60, y: 236, s: 200 }, sub: 456, grid: { x: 110, y: 516, cols: 11, sx: 80, sy: 56, ic: 44 } },
  );
  const css =
    base(p) +
    `
#s3-lbl{left:${g.lbl[0]}px;top:${g.lbl[1]}px;font-size:${pick(24, 20)}px;color:${CYAN};}
#s3-chips{position:absolute;left:${g.chips[0]}px;top:${g.chips[1]}px;display:flex;flex-direction:${pick("column", "row")};align-items:flex-start;gap:${pick(18, 16)}px;}
.s3-chip{position:relative;height:${g.ch}px;padding:0 ${Math.round(g.ch * 0.42)}px 0 ${Math.round(g.ch * 0.22)}px;border-radius:${g.ch / 2}px;display:flex;align-items:center;gap:${Math.round(g.ch * 0.14)}px;background:rgba(255,255,255,.1);border:1.5px solid rgba(255,255,255,.28);font-weight:700;font-size:${g.cf}px;letter-spacing:-.02em;white-space:nowrap;box-shadow:0 20px 50px rgba(5,4,40,.3);}
.s3-pin{width:${Math.round(g.ch * 0.66)}px;height:${Math.round(g.ch * 0.66)}px;border-radius:50%;background:${CYAN};display:flex;align-items:center;justify-content:center;flex:none;}
#s3-num{position:absolute;left:${g.num.x}px;top:${g.num.y}px;display:flex;align-items:baseline;gap:${pick(26, 18)}px;white-space:nowrap;}
#s3-de{font-weight:600;font-size:${pick(56, 44)}px;color:rgba(255,255,255,.8);letter-spacing:-.03em;}
#s3-n{font-weight:800;font-size:${g.num.s}px;letter-spacing:-.06em;line-height:.9;font-variant-numeric:tabular-nums;}
#s3-v{font-size:${Math.round(g.num.s * 0.55)}px;color:${CYAN};line-height:.9;}
#s3-sub{left:${g.num.x}px;top:${g.sub}px;font-size:${pick(30, 24)}px;font-weight:600;color:rgba(255,255,255,.78);letter-spacing:-.01em;}
#s3-grid{position:absolute;left:${g.grid.x}px;top:${g.grid.y}px;}
.s3-p{position:absolute;width:${g.grid.ic}px;height:${g.grid.ic}px;opacity:.18;}
.s3-p.hi svg{filter:drop-shadow(0 0 10px rgba(79,227,247,.9));}
`;
  let grid = "";
  for (let i = 0; i < 99; i++) {
    const cx = (i % g.grid.cols) * g.grid.sx;
    const cy = Math.floor(i / g.grid.cols) * g.grid.sy;
    grid += `<div class="s3-p${i < 2 ? " hi" : " rest"}" id="s3-p${i}" style="left:${cx}px;top:${cy}px">${icon("person", g.grid.ic, { color: i < 2 ? CYAN : "#fff", fill: i < 2 ? CYAN : "#fff", sw: 2 })}</div>`;
  }
  const body = `
  <div id="s3-wrap" class="${p}-full">
    <div id="s3-lbl" class="${p}-lbl">Para empresas em</div>
    <div id="s3-chips"><div class="s3-chip" id="s3-sp"><span class="s3-pin">${icon("pin", Math.round(g.ch * 0.4), { color: NAVY, sw: 4 })}</span>São Paulo</div><div class="s3-chip" id="s3-rj"><span class="s3-pin">${icon("pin", Math.round(g.ch * 0.4), { color: NAVY, sw: 4 })}</span>Rio de Janeiro</div></div>
    <div id="s3-num"><span id="s3-de">de 2 a</span><span id="s3-n">2</span><span id="s3-v" class="it">vidas</span></div>
    <div id="s3-sub" class="${p}-h">PME · mínimo de 2 vidas</div>
    <div id="s3-grid">${grid}</div>
  </div>`;
  enter("#s3-wrap");
  add(`tl.fromTo("#s3-lbl",{opacity:0},{opacity:1,duration:0.3},${r3(L(at("empresas")) - 0.2)});`);
  add(`tl.fromTo("#s3-sp",{opacity:0,x:-40,scale:0.9},{opacity:1,x:0,scale:1,duration:0.42,ease:"back.out(1.7)"},${r3(L(at("sao")) - 0.12)});`);
  add(`tl.fromTo("#s3-rj",{opacity:0,x:-40,scale:0.9},{opacity:1,x:0,scale:1,duration:0.42,ease:"back.out(1.7)"},${r3(L(at("rio")) - 0.12)});`);
  add(`tl.fromTo("#s3-num",{opacity:0,y:40},{opacity:1,y:0,duration:0.4,ease:"power3.out"},${r3(L(at("de", 3)) - 0.1)});`);
  add(`tl.fromTo(".s3-p.hi",{opacity:0.18,scale:0.6},{opacity:1,scale:1,duration:0.3,ease:"back.out(2)",stagger:0.08},${r3(L(at("duas", 1)) - 0.05)});`);
  const c0 = L(at("a")) - 0.05;
  const c1 = L(at("vidas")) + 0.1;
  add(`tl.to(".s3-p.rest",{opacity:1,duration:0.18,ease:"power1.out",stagger:${r3((c1 - c0 - 0.18) / 97)}},${r3(c0)});`);
  const n = Math.round((c1 - c0) * FPS);
  for (let s = 1; s <= n; s++) add(`tl.set("#s3-n",{textContent:"${s === n ? 99 : Math.round(2 + 97 * (s / n))}"},${r3(c0 + (s / n) * (c1 - c0))});`);
  add(`tl.fromTo("#s3-n",{scale:1},{scale:1.08,duration:0.12,ease:"power2.out",transformOrigin:"50% 80%"},${r3(c1)});`);
  add(`tl.to("#s3-n",{scale:1,duration:0.35,ease:"power2.out"},${r3(c1 + 0.12)});`);
  add(`tl.fromTo("#s3-sub",{opacity:0},{opacity:1,duration:0.4},${r3(c1)});`);
  leave("#s3-wrap", dur);
  scenes.push({ st, track: 3, ...scene(p, dur, css, body, a) });
}

// ═════════════ 4 · linhas Bronze, Prata, Ouro, Platinum e Amil Black ═════════════
const LINES = [
  ["Bronze", "linear-gradient(135deg,#E9B27B 0%,#B06A32 45%,#6E3B17 100%)", "#fff", "rgba(255,255,255,.9)"],
  ["Prata", "linear-gradient(135deg,#FAFBFC 0%,#C7CDD5 50%,#8A94A2 100%)", NAVY, NAVY],
  ["Ouro", "linear-gradient(135deg,#FFE9A8 0%,#D8A73A 50%,#946812 100%)", "#2E2104", "#2E2104"],
  ["Platinum", "linear-gradient(135deg,#F6F7FB 0%,#CCD6EA 45%,#8796B8 100%)", NAVY, NAVY],
  ["Amil Black", "linear-gradient(135deg,#34343D 0%,#121216 55%,#000 100%)", "#fff", "#fff"],
];
const CARD4 = pick({ x: 190, y0: 560, dy: 104, w: 700, h: 420, k: 1 }, { x: 260, y0: 206, dy: 86, w: 560, h: 336, k: 0.8 });
{
  const p = "s4";
  const st = at("nas", 1) - 0.25;
  const dur = at("e", 5) - 0.1 - st;
  const { a, L, add, enter } = TL(st);
  const k = CARD4.k;
  const css =
    base(p) +
    `
#s4-lbl{left:0;width:${W}px;text-align:center;top:${pick(286, 58)}px;font-size:${pick(24, 19)}px;color:${CYAN};}
#s4-tt{position:absolute;left:0;width:${W}px;text-align:center;top:${pick(330, 92)}px;font-weight:800;font-size:${pick(86, 64)}px;letter-spacing:-.045em;line-height:1;white-space:nowrap;}
#s4-tt .it{font-size:1.2em;color:${CYAN};}
.s4-cd{position:absolute;left:${CARD4.x}px;width:${CARD4.w}px;height:${CARD4.h}px;border-radius:${Math.round(34 * k)}px;overflow:hidden;box-shadow:0 30px 70px rgba(4,3,30,.55),0 0 0 1px rgba(255,255,255,.15) inset;}
.s4-nm{position:absolute;left:${Math.round(40 * k)}px;top:${Math.round(26 * k)}px;font-weight:800;font-size:${Math.round(46 * k)}px;letter-spacing:-.035em;line-height:1;}
.s4-lg{position:absolute;right:${Math.round(38 * k)}px;top:${Math.round(30 * k)}px;width:${Math.round(118 * k)}px;height:${Math.round(46 * k)}px;}
.s4-chip{position:absolute;left:${Math.round(40 * k)}px;top:${Math.round(160 * k)}px;width:${Math.round(86 * k)}px;height:${Math.round(64 * k)}px;border-radius:${Math.round(12 * k)}px;background:linear-gradient(135deg,#FFF3C4,#C9A44A);opacity:.92;}
.s4-pme{position:absolute;left:${Math.round(40 * k)}px;bottom:${Math.round(34 * k)}px;font-weight:600;font-size:${Math.round(22 * k)}px;letter-spacing:.2em;}
.s4-off{position:absolute;right:${Math.round(38 * k)}px;bottom:${Math.round(28 * k)}px;font-weight:800;font-size:${Math.round(40 * k)}px;letter-spacing:-.03em;}
.s4-sheen{position:absolute;left:-60%;top:-20%;width:40%;height:140%;background:linear-gradient(90deg,rgba(255,255,255,0),rgba(255,255,255,.45),rgba(255,255,255,0));transform:rotate(18deg);}
`;
  const cards = LINES.map(
    ([nm, bg, fg, lg], i) =>
      `<div class="s4-cd" id="s4-c${i}" style="top:${CARD4.y0 + i * CARD4.dy}px;background:${bg};color:${fg}"><div class="s4-nm">${nm}</div><span class="logo s4-lg" style="background:${lg}"></span><div class="s4-chip"></div>${i === 4 ? `<div class="s4-pme">PME · CNPJ</div><div class="s4-off">50% OFF*</div>` : ""}<div class="s4-sheen" id="s4-sh${i}"></div></div>`,
  ).join("");
  const body = `
  <div id="s4-wrap" class="${p}-full">
    <div id="s4-lbl" class="${p}-lbl">Linhas com o desconto</div>
    <div id="s4-tt">Do Bronze ao <span class="it">Black</span></div>
    ${cards}
  </div>`;
  enter("#s4-wrap");
  add(`tl.fromTo("#s4-tt",{opacity:0,y:30},{opacity:1,y:0,duration:0.45,ease:"power3.out"},${r3(L(at("linhas")) - 0.15)});`);
  const tt = [at("bronze"), at("prata"), at("ouro"), at("platinum"), at("black")];
  tt.forEach((t, i) => {
    const last = i === 4;
    add(`tl.fromTo("#s4-c${i}",{x:${pick(820, 700)},y:${last ? 60 : 30},rotation:${last ? 14 : 10},opacity:0},{x:0,y:0,rotation:${last ? 0 : [-2, 1.5, -1, 1][i]},opacity:1,duration:${last ? 0.55 : 0.42},ease:"${last ? "back.out(1.3)" : "power3.out"}"},${r3(L(t) - 0.12)});`);
    add(`tl.fromTo("#s4-sh${i}",{x:0},{x:${Math.round(CARD4.w * 2.4)},duration:0.7,ease:"power2.inOut"},${r3(L(t) + 0.2)});`);
  });
  // o Black cresce e vira a janela para o hospital (a próxima cena continua o gesto)
  add(`tl.to("#s4-c4",{scale:1.04,duration:0.4,ease:"power2.out"},${r3(L(tt[4]) + 0.45)});`);
  add(`tl.to(["#s4-c0","#s4-c1","#s4-c2","#s4-c3","#s4-tt","#s4-lbl"],{opacity:0,duration:0.25,ease:"power1.in"},${r3(dur - 0.3)});`);
  scenes.push({ st, track: 4, ...scene(p, dur, css, body, a) });
}

// ═════════════ 5 · Amil Black: Albert Einstein, Sírio-Libanês e Fleury ═════════════
{
  const p = "s5";
  const st = at("e", 5) - 0.18;
  const dur = at("mas") - 0.12 - st;
  const { a, L, add, words, leave } = TL(st);
  const g = pick(
    { chip: 300, acc: 372, band: { y: 450, h: 560 }, name: { y: 1046, s: 150 }, more: 1222, mh: 76, mf: 36, ben: 1326, bf: 27, foot: 1462 },
    { chip: 56, acc: 112, band: { y: 168, h: 400 }, name: { y: 594, s: 108 }, more: 732, mh: 64, mf: 30, ben: 828, bf: 22, foot: 1000 },
  );
  const bw = Math.round((W * g.band.h) / 436 > W ? (W * g.band.h) / 436 : W);
  const css =
    base(p) +
    `
#s5-bg{background:url("assets/img/einstein-bg-${FMT}.jpg") 50% 50%/cover no-repeat;}
#s5-shade{background:linear-gradient(180deg,rgba(6,5,30,.72) 0%,rgba(6,5,30,.45) 30%,rgba(6,5,30,.7) 60%,rgba(6,5,30,.92) 100%);}
#s5-wipe{position:absolute;left:0;top:0;width:${W}px;height:${H}px;background:#121216;}
#s5-chip{position:absolute;left:0;width:${W}px;top:${g.chip}px;display:flex;justify-content:center;}
#s5-chip span{display:flex;align-items:center;gap:14px;height:${pick(56, 46)}px;padding:0 ${pick(26, 22)}px;border-radius:99px;background:#0B0B10;border:1.5px solid rgba(255,255,255,.35);font-weight:700;font-size:${pick(22, 18)}px;letter-spacing:.2em;}
#s5-chip i{width:${pick(84, 70)}px;height:${pick(32, 27)}px;background:#fff;}
#s5-acc{top:${g.acc}px;font-size:${pick(52, 40)}px;font-weight:600;letter-spacing:-.03em;color:rgba(255,255,255,.9);}
#s5-band{position:absolute;left:0;top:${g.band.y}px;width:${W}px;height:${g.band.h}px;overflow:hidden;box-shadow:0 30px 80px rgba(0,0,0,.5);}
#s5-img{position:absolute;left:${-Math.round((bw - W) / 2)}px;top:0;width:${bw}px;height:${g.band.h}px;background:url("assets/img/einstein.png") 50% 50%/cover no-repeat;transform-origin:50% 45%;}
#s5-bandsh{position:absolute;inset:0;background:linear-gradient(180deg,rgba(6,5,30,0) 60%,rgba(6,5,30,.55) 100%);}
#s5-tag{position:absolute;left:${pick(40, 32)}px;bottom:${pick(26, 22)}px;font-weight:600;font-size:${pick(19, 16)}px;letter-spacing:.2em;color:rgba(255,255,255,.85);}
#s5-name{top:${g.name.y}px;font-size:${g.name.s}px;color:#fff;line-height:1;text-shadow:0 10px 40px rgba(0,0,0,.4);}
#s5-more{position:absolute;left:0;width:${W}px;top:${g.more}px;display:flex;justify-content:center;gap:${pick(18, 14)}px;}
.s5-pl{height:${g.mh}px;padding:0 ${Math.round(g.mh * 0.4)}px;border-radius:${g.mh / 2}px;display:flex;align-items:center;gap:12px;background:rgba(255,255,255,.1);border:1.5px solid rgba(255,255,255,.3);font-weight:700;font-size:${g.mf}px;letter-spacing:-.02em;white-space:nowrap;}
.s5-pl b{color:${CYAN};font-weight:800;}
#s5-ben{position:absolute;left:${pick(72, 60)}px;right:${pick(72, 60)}px;top:${g.ben}px;display:flex;justify-content:center;flex-wrap:wrap;gap:${pick(14, 10)}px ${pick(30, 24)}px;}
.s5-b{display:flex;align-items:center;gap:12px;font-weight:600;font-size:${g.bf}px;color:rgba(255,255,255,.85);white-space:nowrap;}
.s5-bi{width:${Math.round(g.bf * 1.8)}px;height:${Math.round(g.bf * 1.8)}px;border-radius:50%;background:rgba(79,227,247,.16);display:flex;align-items:center;justify-content:center;}
#s5-foot{left:0;width:${W}px;text-align:center;top:${g.foot}px;font-weight:400;font-size:${pick(18, 15)}px;color:rgba(255,255,255,.6);letter-spacing:0;}
`;
  const s4last = { x: CARD4.x, y: CARD4.y0 + 4 * CARD4.dy, w: CARD4.w, h: CARD4.h };
  const BEN = [
    ["bed", "Apartamento"],
    ["globe", "Cobertura nacional"],
    ["plane", "Assistência viagem internacional"],
  ];
  const body = `
  <div id="s5-bg" class="${p}-full"></div>
  <div id="s5-shade" class="${p}-full"></div>
  <div id="s5-wrap" class="${p}-full">
    <div id="s5-chip"><span>LINHA <i class="logo"></i> BLACK</span></div>
    <div id="s5-acc" class="${p}-h ${p}-c">${wspans("s5a", "Você tem acesso ao")}</div>
    <div id="s5-band"><div id="s5-img"></div><div id="s5-bandsh"></div><div id="s5-tag">HOSPITAL DE REFERÊNCIA · SÃO PAULO</div></div>
    <div id="s5-name" class="${p}-h ${p}-c it">${wspans("s5n", "*Albert Einstein*")}</div>
    <div id="s5-more"><div class="s5-pl" id="s5-m0"><b>+</b>Sírio-Libanês</div><div class="s5-pl" id="s5-m1"><b>+</b>Fleury</div></div>
    <div id="s5-ben">${BEN.map(([ic, t], i) => `<div class="s5-b" id="s5-b${i}"><span class="s5-bi">${icon(ic, Math.round(g.bf * 1.1), { color: CYAN, sw: 3 })}</span>${t}</div>`).join("")}</div>
    <div id="s5-foot" class="${p}-h">Linha Amil Black · rede conforme o plano contratado.</div>
  </div>
  <div id="s5-wipe"></div>`;
  // o cartão Black cresce até cobrir a tela e se abre no hospital
  const ins = `${s4last.y}px ${W - s4last.x - s4last.w}px ${H - s4last.y - s4last.h}px ${s4last.x}px round ${Math.round(34 * CARD4.k)}px`;
  add(`tl.fromTo("#s5-wipe",{clipPath:"inset(${ins})"},{clipPath:"inset(0px 0px 0px 0px round 0px)",duration:0.5,ease:"power3.inOut"},0);`);
  // o fundo do hospital só aparece quando o preto já cobriu a tela
  add(`tl.fromTo(["#s5-bg","#s5-shade"],{opacity:0},{opacity:1,duration:0.05,ease:"none"},0.45);`);
  add(`tl.to("#s5-wipe",{opacity:0,duration:0.35,ease:"power1.out"},0.5);`);
  add(`tl.fromTo("#s5-band",{clipPath:"inset(50% 0% 50% 0%)"},{clipPath:"inset(0% 0% 0% 0%)",duration:0.6,ease:"power3.out"},0.45);`);
  add(`tl.fromTo("#s5-img",{scale:1.14},{scale:1,duration:${r3(dur - 0.45)},ease:"power1.out"},0.45);`);
  add(`tl.fromTo("#s5-chip",{opacity:0,y:-14},{opacity:1,y:0,duration:0.4,ease:"power3.out"},${r3(L(at("amil", 2)) - 0.1)});`);
  words("s5a", 4, [at("voce", 1), at("tem"), at("acesso"), at("ao")], 0.42);
  add(`tl.fromTo("#s5n0",{yPercent:110,opacity:0},{yPercent:0,opacity:1,duration:0.5,ease:"power3.out"},${r3(L(at("albert")) - 0.08)});`);
  add(`tl.fromTo("#s5n1",{yPercent:110,opacity:0},{yPercent:0,opacity:1,duration:0.5,ease:"power3.out"},${r3(L(at("einstein")) - 0.08)});`);
  add(`tl.fromTo("#s5-m0",{opacity:0,y:20,scale:0.9},{opacity:1,y:0,scale:1,duration:0.4,ease:"back.out(1.8)"},${r3(L(at("siriolibanes")) - 0.12)});`);
  add(`tl.fromTo("#s5-m1",{opacity:0,y:20,scale:0.9},{opacity:1,y:0,scale:1,duration:0.4,ease:"back.out(1.8)"},${r3(L(at("fleury")) - 0.12)});`);
  BEN.forEach((_, i) => add(`tl.fromTo("#s5-b${i}",{opacity:0,y:14},{opacity:1,y:0,duration:0.35,ease:"power3.out"},${r3(L(at("e", 6)) + i * 0.12)});`));
  add(`tl.fromTo("#s5-foot",{opacity:0},{opacity:1,duration:0.4},${r3(L(at("e", 6)) + 0.4)});`);
  leave("#s5-root", dur);
  scenes.push({ st, track: 5, ...scene(p, dur, css, body, a) });
}

// ═════════════ 6 · só para contratos fechados em outubro ═════════════
{
  const p = "s6";
  const st = at("mas") - 0.2;
  const dur = at("faca") - 0.12 - st;
  const { a, L, add, words, enter, leave } = TL(st);
  const g = pick(
    { al: [72, 292], t1: [72, 372, 64], t2: [72, 452, 64], t3: [60, 520, 190], cal: { x: 72, y: 760, w: 936, cw: 120, chh: 96, hd: 118 } },
    { al: [60, 262], t1: [60, 340, 50], t2: [60, 404, 50], t3: [52, 458, 150], cal: { x: 548, y: 262, w: 472, cw: 62, chh: 70, hd: 92 } },
  );
  const cal = g.cal;
  const first = new Date(Date.UTC(2026, 9, 1)).getUTCDay(); // 0 = domingo
  const DOW = ["D", "S", "T", "Q", "Q", "S", "S"];
  const gx = (cal.w - 7 * cal.cw) / 2;
  let cells = DOW.map((d, i) => `<div class="s6-dw" style="left:${gx + i * cal.cw}px;top:${cal.hd - Math.round(cal.chh * 0.42)}px;width:${cal.cw}px">${d}</div>`).join("");
  for (let d = 1; d <= 31; d++) {
    const idx = first + d - 1;
    const cx = gx + (idx % 7) * cal.cw;
    const cy = cal.hd + Math.floor(idx / 7) * cal.chh + Math.round(cal.chh * 0.15);
    cells += `<div class="s6-d${d === 31 ? " last" : ""}" id="s6-d${d}" style="left:${cx}px;top:${cy}px;width:${cal.cw}px;height:${cal.chh}px"><span>${d}</span></div>`;
  }
  const rows = Math.ceil((first + 31) / 7);
  const calH = cal.hd + rows * cal.chh + Math.round(cal.chh * 0.6);
  const css =
    base(p) +
    `
#s6-al{position:absolute;left:${g.al[0]}px;top:${g.al[1]}px;display:flex;align-items:center;gap:12px;height:${pick(58, 48)}px;padding:0 ${pick(24, 20)}px 0 ${pick(16, 14)}px;border-radius:99px;background:${AMBER};color:${NAVY};font-weight:800;font-size:${pick(24, 20)}px;letter-spacing:.16em;}
.s6-t{position:absolute;white-space:nowrap;letter-spacing:-.04em;line-height:1;}
#s6-t1{left:${g.t1[0]}px;top:${g.t1[1]}px;font-size:${g.t1[2]}px;font-weight:700;}
#s6-t2{left:${g.t2[0]}px;top:${g.t2[1]}px;font-size:${g.t2[2]}px;font-weight:700;}
#s6-t3{left:${g.t3[0]}px;top:${g.t3[1]}px;font-size:${g.t3[2]}px;color:${CYAN};}
#s6-cal{position:absolute;left:${cal.x}px;top:${cal.y}px;width:${cal.w}px;height:${calH}px;border-radius:${pick(40, 30)}px;background:rgba(255,255,255,.08);border:1.5px solid rgba(255,255,255,.2);box-shadow:0 30px 80px rgba(4,3,30,.4);}
#s6-ch{position:absolute;left:0;width:${cal.w}px;top:${pick(28, 22)}px;display:flex;justify-content:space-between;padding:0 ${pick(40, 26)}px;font-weight:800;font-size:${pick(30, 22)}px;letter-spacing:.12em;}
#s6-ch span{color:${CYAN};}
.s6-dw{position:absolute;text-align:center;font-weight:600;font-size:${pick(22, 16)}px;color:rgba(255,255,255,.82);}
.s6-d{position:absolute;display:flex;align-items:center;justify-content:center;}
.s6-d span{display:flex;align-items:center;justify-content:center;width:${Math.round(cal.cw * 0.7)}px;height:${Math.round(cal.cw * 0.7)}px;border-radius:50%;font-weight:700;font-size:${pick(30, 20)}px;color:rgba(255,255,255,.8);}
#s6-last{position:absolute;font-weight:800;font-size:${pick(18, 13)}px;letter-spacing:.12em;color:${AMBER};white-space:nowrap;}
`;
  const lastIdx = first + 30;
  const lx = gx + (lastIdx % 7) * cal.cw + cal.cw / 2;
  const ly = cal.hd + Math.floor(lastIdx / 7) * cal.chh + Math.round(cal.chh * 0.15) + cal.chh;
  const body = `
  <div id="s6-wrap" class="${p}-full">
    <div id="s6-al">${icon("alert", pick(32, 26), { color: NAVY, sw: 4 })}ATENÇÃO</div>
    <div id="s6-t1" class="s6-t">${wspans("s6a", ST ? "A oferta vale só para" : "A oferta vale só")}</div>
    <div id="s6-t2" class="s6-t">${wspans("s6b", ST ? "contratos fechados em" : "para contratos em")}</div>
    <div id="s6-t3" class="s6-t it">${wspans("s6c", "outubro.")}</div>
    <div id="s6-cal"><div id="s6-ch">OUTUBRO <span>2026</span></div>${cells}<div id="s6-last" style="left:${lx}px;top:${ly - Math.round(cal.chh * 0.08)}px;transform:translateX(-50%)">ÚLTIMO DIA</div></div>
  </div>`;
  enter("#s6-wrap");
  add(`tl.fromTo("#s6-al",{opacity:0,scale:0.7},{opacity:1,scale:1,duration:0.4,ease:"back.out(2)"},${r3(L(at("atencao")) - 0.1)});`);
  [0, 1, 2].forEach((k) => add(`tl.fromTo("#s6-al",{x:0},{x:${[8, -6, 0][k]},duration:0.05,ease:"none",immediateRender:false},${r3(L(at("atencao")) + 0.3 + k * 0.05)});`));
  words("s6a", ST ? 5 : 4, ST ? [at("a", 1), at("oferta"), at("vale"), at("so"), at("para", 2)] : [at("a", 1), at("oferta"), at("vale"), at("so")]);
  words("s6b", 3, ST ? [at("contratos"), at("fechados"), at("em")] : [at("para", 2), at("contratos"), at("em")]);
  add(`tl.fromTo("#s6c0",{yPercent:100,opacity:0,scale:1.2},{yPercent:0,opacity:1,scale:1,duration:0.5,ease:"back.out(1.4)"},${r3(L(at("outubro")) - 0.1)});`);
  add(`tl.fromTo("#s6-cal",{opacity:0,y:50},{opacity:1,y:0,duration:0.5,ease:"power3.out"},${r3(L(at("oferta")) - 0.3)});`);
  // os dias acendem em sequência até o 31
  const d0 = L(at("vale"));
  const d1 = L(at("outubro")) - 0.05;
  for (let d = 1; d <= 31; d++) {
    const t = r3(d0 + ((d - 1) / 30) * (d1 - d0));
    if (d < 31) add(`tl.fromTo("#s6-d${d} span",{backgroundColor:"rgba(79,227,247,0)",color:"rgba(255,255,255,.8)"},{backgroundColor:"rgba(79,227,247,.22)",color:"#fff",duration:0.12,ease:"power1.out"},${t});`);
  }
  add(`tl.fromTo("#s6-d31 span",{backgroundColor:"rgba(255,197,66,0)",color:"rgba(255,255,255,.8)",scale:1},{backgroundColor:"${AMBER}",color:"${NAVY}",scale:1.18,duration:0.3,ease:"back.out(2.5)"},${r3(d1)});`);
  add(`tl.fromTo("#s6-last",{opacity:0,y:-8},{opacity:1,y:0,duration:0.3,ease:"power2.out"},${r3(d1 + 0.12)});`);
  leave("#s6-wrap", dur);
  scenes.push({ st, track: 6, ...scene(p, dur, css, body, a) });
}

// ═════════════ 7 · CTA: simulação gratuita, toque no botão ═════════════
const BTN = pick({ x: 110, y: 1336, w: 860, h: 104 }, { x: 160, y: 748, w: 760, h: 92 });
const TAP = at("botao") - 0.02;
{
  const p = "s7";
  const st = at("faca") - 0.25;
  const dur = D - st;
  const { a, L, add, enter } = TL(st);
  const g = pick(
    { logo: { x: 445, y: 250, w: 190 }, rc: [540, 600], r: 250, sw: 24, ps: 230, dd: [872, 62], df: [944, 52], p1: [1028, 74], p2: [1106, 74], pill: { y: 1206, h: 76, fs: 40 }, line: 1300, foot: 1458 },
    { logo: { x: 836, y: 52, w: 170 }, rc: [300, 366], r: 205, sw: 20, ps: 180, dd: [218, 48], df: [280, 40], p1: [362, 52], p2: [424, 52], pill: { y: 506, h: 62, fs: 30 }, line: 678, foot: 872 },
  );
  const C = r3(2 * Math.PI * g.r);
  const colX = ST ? null : 560;
  const txt = (y, extra = "") => (ST ? `left:0;width:${W}px;text-align:center;top:${y}px;${extra}` : `left:${colX}px;top:${y}px;${extra}`);
  const css =
    base(p) +
    `
#s7-logo{position:absolute;left:${g.logo.x}px;top:${g.logo.y}px;width:${g.logo.w}px;height:${Math.round(g.logo.w * 0.386)}px;background:#fff;}
#s7-ring{position:absolute;left:${g.rc[0] - g.r - g.sw}px;top:${g.rc[1] - g.r - g.sw}px;filter:drop-shadow(0 0 26px rgba(79,227,247,.55));}
#s7-pct{position:absolute;left:${g.rc[0] - 400}px;width:800px;top:${g.rc[1] - g.ps * 0.52}px;text-align:center;font-weight:800;font-size:${g.ps}px;letter-spacing:-.06em;line-height:1;font-variant-numeric:tabular-nums;}
#s7-pct sup{font-size:.42em;vertical-align:.95em;letter-spacing:0;}
.s7-t{position:absolute;white-space:nowrap;letter-spacing:-.04em;line-height:1;}
#s7-dd{${txt(g.dd[0])}font-weight:800;font-size:${g.dd[1]}px;}
#s7-df{${txt(g.df[0])}font-weight:700;font-size:${g.df[1]}px;}
#s7-df b{color:${CYAN};font-weight:800;}
#s7-p1{${txt(g.p1[0])}font-weight:800;font-size:${g.p1[1]}px;}
#s7-p2{${txt(g.p2[0])}font-weight:800;font-size:${g.p2[1]}px;color:${CYAN};}
#s7-pill{position:absolute;${ST ? `left:0;width:${W}px;display:flex;justify-content:center;` : `left:${colX}px;`}top:${g.pill.y}px;}
#s7-pill span{display:block;height:${g.pill.h}px;line-height:${g.pill.h - 4}px;padding:0 ${Math.round(g.pill.h * 0.6)}px;border-radius:${g.pill.h / 2}px;border:3px solid ${CYAN};box-shadow:0 0 24px rgba(79,227,247,.45),inset 0 0 18px rgba(79,227,247,.25);font-weight:600;font-size:${g.pill.fs}px;white-space:nowrap;background:rgba(10,6,70,.35);}
#s7-pill b{color:${CYAN};font-weight:800;}
#s7-line{left:0;width:${W}px;text-align:center;top:${g.line}px;font-weight:500;font-size:${pick(26, 22)}px;color:rgba(255,255,255,.85);letter-spacing:-.01em;}
#s7-line b{font-weight:800;color:#fff;}
#s7-btnw{position:absolute;left:${BTN.x}px;top:${BTN.y}px;width:${BTN.w}px;height:${BTN.h}px;}
#s7-ring2{position:absolute;inset:0;border-radius:999px;border:3px solid rgba(255,255,255,.95);opacity:0;}
#s7-btn{position:absolute;inset:0;border-radius:999px;background:#fff;display:flex;align-items:center;justify-content:center;gap:${pick(22, 18)}px;box-shadow:0 20px 50px rgba(5,4,40,.45),0 0 40px rgba(79,227,247,.35);}
#s7-btn span{font-weight:800;font-size:${pick(40, 34)}px;letter-spacing:-.03em;color:${INDIGO};white-space:nowrap;}
#s7-arrow{flex:none;}
#s7-foot{position:absolute;left:${pick(72, 60)}px;right:${pick(72, 60)}px;top:${g.foot}px;text-align:center;font-weight:400;font-size:${pick(17, 14)}px;line-height:${pick(22, 18)}px;color:rgba(255,255,255,.82);}
`;
  const FOOT =
    "Desconto de 50% na 1ª e na 2ª mensalidade para novos contratos PME Amil (2 a 99 vidas) firmados em outubro de 2026, em SP e RJ. Sujeito às regras de elegibilidade, carências e condições contratuais da operadora. Amil · ANS nº 326305.";
  const body = `
  <div id="s7-wrap" class="${p}-full">
    <div id="s7-logo" class="logo"></div>
    ${ringSvg("s7-ring", g.r, g.sw)}
    <div id="s7-pct"><span id="s7-num">50</span><sup>%</sup></div>
    <div id="s7-dd" class="s7-t">DE DESCONTO</div>
    <div id="s7-df" class="s7-t">na 1ª e 2ª <b>fatura</b></div>
    <div id="s7-p1" class="s7-t">Planos de Saúde</div>
    <div id="s7-p2" class="s7-t">para CNPJ</div>
    <div id="s7-pill"><span>A partir de <b>2 vidas</b></span></div>
    <div id="s7-line" class="s7-t">Oferta válida só para contratações em <b>outubro</b> · SP e RJ</div>
    <div id="s7-btnw"><div id="s7-ring2"></div><div id="s7-btn"><span>Simulação Gratuita 100% Online</span><svg id="s7-arrow" viewBox="0 0 24 24" width="${pick(34, 30)}" height="${pick(34, 30)}"><path d="M9 5l7 7-7 7" fill="none" stroke="${INDIGO}" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/></svg></div></div>
    <div id="s7-foot">${FOOT}</div>
  </div>`;
  enter("#s7-wrap");
  const t0 = L(at("faca"));
  add(`tl.fromTo("#s7-ring-arc",{attr:{"stroke-dashoffset":${C}}},{attr:{"stroke-dashoffset":${r3(C * 0.5)}},duration:0.8,ease:"power3.out"},${r3(t0 - 0.1)});`);
  add(`tl.fromTo("#s7-ring",{rotation:-40},{rotation:0,duration:1.2,ease:"power3.out"},${r3(t0 - 0.1)});`);
  add(`tl.fromTo("#s7-pct",{scale:1.3,opacity:0},{scale:1,opacity:1,duration:0.35,ease:"power4.out"},${r3(t0 - 0.05)});`);
  add(`tl.fromTo("#s7-logo",{opacity:0,y:-16},{opacity:1,y:0,duration:0.45,ease:"power3.out"},${r3(t0 + 0.1)});`);
  const seq = [
    ["#s7-dd", L(at("agora")) - 0.15],
    ["#s7-df", L(at("agora")) + 0.05],
    ["#s7-p1", L(at("sua")) - 0.05],
    ["#s7-p2", L(at("simulacao")) - 0.05],
    ["#s7-pill", L(at("gratuita")) - 0.05],
    ["#s7-line", L(at("gratuita")) + 0.25],
  ];
  seq.forEach(([sel, t]) => add(`tl.fromTo("${sel}",{opacity:0,y:24},{opacity:1,y:0,duration:0.4,ease:"power3.out"},${r3(t)});`));
  add(`tl.fromTo("#s7-btnw",{opacity:0,scale:0.7},{opacity:1,scale:1,duration:0.5,ease:"back.out(1.6)"},${r3(L(at("cem")) - 0.1)});`);
  add(`tl.fromTo("#s7-foot",{opacity:0},{opacity:1,duration:0.5},${r3(L(at("online")))});`);
  // toque no botão
  const tp = L(TAP);
  add(`tl.fromTo("#s7-btn",{scale:1},{scale:0.95,duration:0.1,ease:"power2.in"},${tp});`);
  add(`tl.to("#s7-btn",{scale:1,duration:0.3,ease:"back.out(2)"},${r3(tp + 0.1)});`);
  add(`tl.fromTo("#s7-ring2",{opacity:0.95,scale:1},{opacity:0,scale:1.25,duration:0.7,ease:"power2.out"},${r3(tp + 0.05)});`);
  add(`tl.fromTo("#s7-ring2",{opacity:0.9,scale:1},{opacity:0,scale:1.25,duration:0.7,ease:"power2.out",immediateRender:false},${r3(L(at("especialista")) + 0.1)});`);
  for (let t = L(at("especialista")) + 0.9, i = 0; t + 1.0 <= dur - 1.4; t += 1.0, i++) {
    add(`tl.fromTo("#s7-btn",{scale:1},{scale:1.04,duration:0.5,ease:"sine.inOut",immediateRender:false},${r3(t)});`);
    add(`tl.to("#s7-btn",{scale:1,duration:0.5,ease:"sine.inOut"},${r3(t + 0.5)});`);
    add(`tl.fromTo("#s7-arrow",{x:0},{x:6,duration:0.5,ease:"sine.inOut"${i ? ",immediateRender:false" : ""}},${r3(t)});`);
    add(`tl.to("#s7-arrow",{x:0,duration:0.5,ease:"sine.inOut"},${r3(t + 0.5)});`);
  }
  scenes.push({ st, track: 7, ...scene(p, dur, css, body, a) });
}

// ═════════════ dedo e grão ═════════════
{
  const p = "ui";
  const { a, add } = TL(0);
  const FS = pick(96, 82);
  const fx = BTN.x + BTN.w * 0.62;
  const fy = BTN.y + BTN.h * 0.55;
  const NOISE =
    "data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E";
  const css = `#ui-root{position:absolute;inset:0;width:${W}px;height:${H}px;overflow:hidden;pointer-events:none;}
#ui-f{position:absolute;left:${fx - FS / 2}px;top:${fy - FS / 2}px;width:${FS}px;height:${FS}px;border-radius:50%;background:radial-gradient(circle,rgba(255,255,255,.75) 0 34%,rgba(255,255,255,.32) 36% 100%);border:2px solid rgba(255,255,255,.95);box-shadow:0 0 0 1.5px rgba(14,10,85,.25),0 10px 26px rgba(5,4,40,.4);opacity:0;}
#ui-tex{position:absolute;left:-128px;top:-128px;width:${W + 256}px;height:${H + 256}px;background:url("${NOISE}") 0 0/256px 256px repeat;opacity:.045;mix-blend-mode:overlay;}`;
  const body = `<div id="ui-tex" data-layout-allow-overflow></div><div id="ui-f"></div>`;
  add(`tl.fromTo("#ui-f",{opacity:0,x:${pick(170, 130)},y:${pick(230, 170)},scale:1.15},{opacity:1,x:0,y:0,scale:1,duration:0.5,ease:"power3.out"},${r3(TAP - 0.55)});`);
  add(`tl.to("#ui-f",{scale:0.82,duration:0.1,ease:"power2.in"},${r3(TAP)});`);
  add(`tl.to("#ui-f",{scale:1,duration:0.18,ease:"power2.out"},${r3(TAP + 0.12)});`);
  add(`tl.to("#ui-f",{opacity:0,x:${pick(90, 70)},y:${pick(120, 90)},duration:0.4,ease:"power2.in"},${r3(TAP + 0.5)});`);
  // grão: posições sorteadas aqui (fixas), trocadas a cada 2 quadros
  let s = 99;
  const R = () => ((s = (s * 1103515245 + 12345) % 2147483648) / 2147483648);
  const pos = [];
  for (let t = 0; t < D; t += 2 / FPS) pos.push(Math.round((R() - 0.5) * 200), Math.round((R() - 0.5) * 200));
  add(`const P = [${pos.join(",")}];`);
  add(`for (let i = 0; i < P.length / 2; i++) tl.set("#ui-tex", { x: P[2 * i], y: P[2 * i + 1] }, Math.round((i * 2 / ${FPS}) * 1000) / 1000);`);
  scenes.push({ st: 0, track: 9, ...scene(p, D, css, body, a) });
}

// ═════════════ áudio ═════════════
const SFX_LEN = {
  impact: 3.0, zap: 0.5, rip: 0.6, whoosh: 1.0, pop: 0.5, tick: 0.14, chime: 2.2, shimmer: 3.0, stamp: 0.5,
  counter: 0.8, counter99: 1.15, card: 0.5, alert: 0.7, days: 2.4, tap: 0.3, swipe: 0.5,
};
const tc = at("metade");
const SFX = [
  ["stamp", 0.02, 0.5],
  ["zap", r3(tc), 0.55],
  ["rip", r3(tc + 0.2), 0.55],
  ["impact", r3(tc + 0.24), 0.55],
  ["whoosh", r3(tc + 0.3), 0.3],
  ["swipe", r3(at("e") - 0.12), 0.25],
  ["tick", r3(at("duas")), 0.22],
  ["chime", r3(at("amil")), 0.3],
  ["whoosh", r3(at("cinquenta") - 0.4), 0.35],
  ["impact", r3(at("cinquenta")), 0.5],
  ["counter", r3(at("cinquenta")), 0.35],
  ["pop", r3(at("desconto") - 0.05), 0.3],
  ["card", r3(at("primeira") - 0.2), 0.45],
  ["card", r3(at("segunda") - 0.2), 0.45],
  ["stamp", r3(at("mensalidade") - 0.05), 0.5],
  ["stamp", r3(at("mensalidade") + 0.12), 0.4],
  ["whoosh", r3(at("para", 1) - 0.35), 0.3],
  ["pop", r3(at("sao") - 0.12), 0.35],
  ["pop", r3(at("rio") - 0.12), 0.35],
  ["tick", r3(at("duas", 1)), 0.25],
  ["counter99", r3(at("a")), 0.35],
  ["whoosh", r3(at("nas", 1) - 0.4), 0.3],
  ...[at("bronze"), at("prata"), at("ouro"), at("platinum")].map((t) => ["card", r3(t - 0.14), 0.45]),
  ["card", r3(at("black") - 0.14), 0.55],
  ["shimmer", r3(at("black") + 0.15), 0.25],
  ["whoosh", r3(at("e", 5) - 0.2), 0.4],
  ["impact", r3(at("e", 5) + 0.3), 0.3],
  ["shimmer", r3(at("einstein")), 0.3],
  ["pop", r3(at("siriolibanes") - 0.12), 0.3],
  ["pop", r3(at("fleury") - 0.12), 0.3],
  ["whoosh", r3(at("mas") - 0.35), 0.3],
  ["alert", r3(at("atencao") - 0.05), 0.4],
  ["days", r3(at("vale")), 0.3],
  ["impact", r3(at("outubro")), 0.4],
  ["stamp", r3(at("outubro") - 0.02), 0.35],
  ["whoosh", r3(at("faca") - 0.35), 0.35],
  ["impact", r3(at("faca") - 0.05), 0.5],
  ["chime", r3(at("faca") + 0.1), 0.25],
  ["pop", r3(at("cem") - 0.1), 0.4],
  ["tap", r3(TAP), 0.55],
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
  JSON.stringify({ metade: tc, drop: at("cinquenta"), cta: at("faca"), tap: TAP, end: D }, null, 1),
);
console.log(`${FMT} ${W}x${H}: ${D}s, ${scenes.length} composições, ${SFX.length} SFX`);
