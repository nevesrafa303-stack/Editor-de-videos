#!/usr/bin/env node
// build.mjs — filme Porto 47 s "A conta que ninguém revisa", story 9:16 e feed 1:1.
//
//   node tools/build.mjs story   -> compositions/*.html + index.html
//   node tools/build.mjs feed    -> feed/compositions/*.html + feed/index.html
//
// Oito cenas (uma sub-composição cada) + grão de filme por cima. Os tempos saem das
// palavras da locução (assets/voice/vo.words.json); cada cena tem a própria linha do
// tempo local e entra por cima da anterior com uma cortina (as cenas se sobrepõem
// ~0,3 s). Determinístico: dígitos sorteados, tremidas e contadores são calculados aqui.
//
// Direção de arte: cinema escuro no gancho (foto do Figma AI tratada na Adobe), papel
// claro na virada ("não é gasto"), azul Porto na solução. Tipografia: League Gothic
// (versão aberta da Alternate Gothic da paleta sugerida pela Adobe) + Poppins (marca).

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const FMT = process.argv[2] === "feed" ? "feed" : "story";
const ST = FMT === "story";
const W = 1080;
const H = ST ? 1920 : 1080;
const FPS = 30;
const D = 47;
const r3 = (x) => Math.round(x * 1000) / 1000;
const pick = (s, f) => (ST ? s : f);

// cores
const INK = "#0A1630";
const NAVY = "#0A1630";
const ROYAL = "#2146C3";
const LIGHT = "#3A90EE";
const PBLUE = "#0A84D6"; // azul Porto escurecido para texto sobre claro (contraste)
const CORAL = "#FF5A4E";
const MINT = "#2BD4A4";
const LAV = "#E9ECF4";
const PAPER = "#F3F5FA";

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
const LOCK = word("oitenta").end;

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
  [400, 500, 600, 700, 800, 900]
    .map(
      (w) =>
        `@font-face{font-family:"Poppins";font-weight:${w};font-style:normal;font-display:block;src:url("assets/fonts/Poppins-${w}.woff2") format("woff2");}`,
    )
    .join("\n") +
  `\n@font-face{font-family:"League Gothic";font-weight:400;font-style:normal;font-display:block;src:url("assets/fonts/LeagueGothic-400.woff2") format("woff2");}`;

// palavras com máscara (sobem de dentro de uma janela)
const wspans = (p, text) =>
  text
    .split(" ")
    .map((w, i) => `<span class="w"><span class="wi" id="${p}${i}">${w}</span></span>`)
    .join(" ");

// CSS comum (prefixado por cena)
const base = (p) => `
${FONTS}
#${p}-root{position:absolute;inset:0;width:${W}px;height:${H}px;overflow:hidden;font-family:"Poppins",Arial,sans-serif;}
.${p}-full{position:absolute;left:0;top:0;width:${W}px;height:${H}px;}
.${p}-row{position:absolute;left:0;width:${W}px;text-align:center;white-space:nowrap;}
.${p}-disp{font-family:"League Gothic",sans-serif;font-weight:400;text-transform:uppercase;line-height:0.92;letter-spacing:0.004em;}
.${p}-tag{position:absolute;left:${pick(72, 60)}px;top:${pick(252, 40)}px;font-weight:600;font-size:${pick(22, 18)}px;letter-spacing:0.32em;white-space:nowrap;}
.${p}-tag i{display:inline-block;width:46px;height:2px;margin:0 16px 6px 0;vertical-align:middle;background:currentColor;}
.w{display:inline-block;overflow:hidden;vertical-align:top;padding:0.1em 0.02em 0.04em;margin:-0.1em -0.02em -0.04em;}
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

// linha do tempo local de uma cena
function TL(st) {
  const a = [];
  const L = (g) => r3(g - st);
  const add = (s) => a.push(s);
  const words = (p, n, times, dur = 0.38) => {
    for (let i = 0; i < n; i++)
      add(`tl.fromTo("#${p}${i}",{yPercent:115,opacity:0},{yPercent:0,opacity:1,duration:${dur},ease:"power3.out"},${r3(Math.max(0, L(times[i]) - 0.08))});`);
  };
  return { a, L, add, words };
}

const ICONS = {
  tooth: `<path d="M14 9c-4 0-6 3-6 7 0 4 2 6 3 10 1 4 1 9 3 9s2-5 4-8c1-1 2-1 3 0 2 3 2 8 4 8s2-5 3-9c1-4 3-6 3-10 0-4-2-7-6-7-3 0-4 2-6 2s-3-2-5-2z"/>`,
  heart: `<path d="M24 38S8 28 8 17c0-5 4-8 8-8 3 0 6 2 8 5 2-3 5-5 8-5 4 0 8 3 8 8 0 11-16 21-16 21z"/><path d="M11 22h7l3-5 4 9 3-4h9"/>`,
  case: `<rect x="7" y="15" width="34" height="23" rx="4"/><path d="M18 15v-4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v4M7 25h34M24 23v5"/>`,
  shield: `<path d="M24 6l15 5v11c0 9-6 16-15 20C15 38 9 31 9 22V11z"/><path d="M17 23l5 5 9-10"/>`,
  check: `<path d="M12 25l8 8 16-18"/>`,
  hand: `<path d="M19 26V10a3 3 0 0 1 6 0v12m0-2a3 3 0 0 1 6 0v3m0-1a3 3 0 0 1 6 0v3m0-1a3 3 0 0 1 6 0v8c0 7-5 12-12 12h-3c-4 0-6-2-8-5l-6-9a3 3 0 0 1 5-3l3 4"/>`,
};
const icon = (name, size, id = "", sw = 3.2, color = "#fff") =>
  `<svg ${id ? `id="${id}"` : ""} viewBox="0 0 48 48" width="${size}" height="${size}" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${ICONS[name]}</svg>`;

const scenes = [];

// ═════════════ 1 · A CONTA (gancho) ═════════════
{
  const st = 0;
  const dur = 3.6;
  const p = "s1";
  const { a, L, add, words } = TL(st);
  const lines = pick(
    { top: [900, 1012, 1124], size: 128, lh: 112 },
    { top: [440, 536, 632], size: 108, lh: 96 },
  );
  const tick = pick({ top: 1340, w: 660, h: 124, size: 76 }, { top: 838, w: 560, h: 104, size: 64 });
  const css =
    base(p) +
    `
#${p}-bg{background:url("assets/img/ai-hook.png") 50% ${pick(30, 29)}%/cover no-repeat;transform-origin:50% 32%;}
#${p}-shade{background:linear-gradient(180deg,rgba(4,9,22,.55) 0%,rgba(4,9,22,.12) 20%,rgba(4,9,22,.3) ${pick(38, 34)}%,rgba(4,9,22,.9) ${pick(56, 50)}%,rgba(4,9,22,.97) 100%);}
#${p}-tag{color:#9FB4E8;}
.${p}-l{position:absolute;left:0;width:${W}px;text-align:center;font-size:${lines.size}px;line-height:${lines.lh}px;color:#fff;white-space:nowrap;text-shadow:0 8px 30px rgba(0,0,0,.45);}
#${p}-l2 .wi{color:#fff;}
#${p}-cap{position:absolute;left:0;width:${W}px;top:${tick.top - 44}px;text-align:center;font-weight:600;font-size:${pick(20, 17)}px;letter-spacing:.34em;color:rgba(255,255,255,.62);}
#${p}-tick{position:absolute;left:${(W - tick.w) / 2}px;top:${tick.top}px;width:${tick.w}px;height:${tick.h}px;border-radius:${tick.h / 2}px;background:rgba(255,255,255,.08);border:2px solid rgba(255,255,255,.28);display:flex;align-items:center;justify-content:center;gap:18px;box-shadow:0 20px 60px rgba(0,0,0,.4);}
#${p}-tick-hot{position:absolute;inset:-2px;border-radius:${tick.h / 2}px;border:3px solid ${CORAL};box-shadow:0 0 40px rgba(255,90,78,.55);opacity:0;}
#${p}-rs{font-weight:600;font-size:${Math.round(tick.size * 0.5)}px;color:rgba(255,255,255,.6);}
#${p}-dig{font-weight:700;font-size:${tick.size}px;line-height:1;color:#fff;font-variant-numeric:tabular-nums;letter-spacing:.01em;}
`;
  const body = `
  <div id="${p}-bg" class="${p}-full" data-layout-allow-overflow></div>
  <div id="${p}-shade" class="${p}-full"></div>
  <div id="${p}-tag" class="${p}-tag"><i></i>01 · A CONTA</div>
  <div id="${p}-l1" class="${p}-l ${p}-disp" style="top:${lines.top[0]}px">${wspans(`${p}a`, "Quanto você pagou")}</div>
  <div id="${p}-l2" class="${p}-l ${p}-disp" style="top:${lines.top[1]}px">${wspans(`${p}b`, "de plano de saúde")}</div>
  <div id="${p}-l3" class="${p}-l ${p}-disp" style="top:${lines.top[2]}px">${wspans(`${p}c`, "este")} <span class="w"><span class="wi" id="${p}c1" style="color:${CORAL}">mês?</span></span></div>
  <div id="${p}-cap">SUA MENSALIDADE</div>
  <div id="${p}-tick"><div id="${p}-tick-hot"></div><span id="${p}-rs">R$</span><span id="${p}-dig">1.284,90</span></div>`;
  add(`tl.fromTo("#${p}-bg",{scale:1.0},{scale:1.1,duration:${dur},ease:"sine.inOut"},0);`);
  add(`tl.fromTo("#${p}-tick",{scale:0.92,opacity:0.6},{scale:1,opacity:1,duration:0.3,ease:"power3.out"},0);`);
  add(`tl.fromTo("#${p}-tag",{opacity:0,x:-20},{opacity:1,x:0,duration:0.4,ease:"power2.out"},0.05);`);
  add(`tl.fromTo("#${p}-cap",{opacity:0},{opacity:1,duration:0.4,ease:"power1.out"},0.1);`);
  words(`${p}a`, 3, [at("quanto"), at("voce"), at("pagou")]);
  words(`${p}b`, 4, [at("de"), at("plano"), at("de", 1), at("saude")]);
  add(`tl.fromTo("#${p}c0",{yPercent:115,opacity:0},{yPercent:0,opacity:1,duration:0.38,ease:"power3.out"},${L(at("este")) - 0.08});`);
  add(`tl.fromTo("#${p}c1",{yPercent:115,opacity:0,scale:1.3},{yPercent:0,opacity:1,scale:1,duration:0.42,ease:"back.out(1.6)"},${L(at("mes")) - 0.08});`);
  // dígitos girando (sorteio fixo) até "mês?", depois "?.???,??" em vermelho
  {
    const R = rng(4711);
    const end = L(word("mes").start) + 0.25;
    for (let t = 0; t < end; t += 1 / 15) add(`tl.set("#${p}-dig",{textContent:"${brl(300 + R() * 2600)}"},${r3(t)});`);
    add(`tl.set("#${p}-dig",{textContent:"?.???,??",color:"${CORAL}"},${r3(end)});`);
    add(`tl.fromTo("#${p}-tick-hot",{opacity:0},{opacity:1,duration:0.15,ease:"power2.out"},${r3(end)});`);
    add(`tl.fromTo("#${p}-tick",{scale:1},{scale:1.07,duration:0.12,ease:"power2.out",immediateRender:false},${r3(end)});`);
    add(`tl.to("#${p}-tick",{scale:1,duration:0.4,ease:"power2.out"},${r3(end + 0.12)});`);
  }
  scenes.push({ st, track: 0, ...scene(p, dur, css, body, a) });
}

// ═════════════ 2 · VEZES DOZE ═════════════
{
  const st = 3.3;
  const dur = 4.45;
  const p = "s2";
  const { a, L, add, words } = TL(st);
  const g = pick(
    { cols: 3, rows: 4, cw: 276, ch: 186, gx: 30, gy: 26, k: 1 },
    { cols: 4, rows: 3, cw: 214, ch: 144, gx: 20, gy: 20, k: 0.78 },
  );
  g.w = g.cols * g.cw + (g.cols - 1) * g.gx;
  g.h = g.rows * g.ch + (g.rows - 1) * g.gy;
  g.x0 = Math.round((W - g.w) / 2);
  g.y0 = pick(330, 120);
  const k = g.k;
  const MESES = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];
  const q = pick({ t1: 1200, s1: 104, t2: 1300, s2: 190 }, { t1: 640, s1: 88, t2: 728, s2: 150 });
  const x12 = pick({ top: 450, size: 460 }, { top: 150, size: 360 });
  const css =
    base(p) +
    `
#${p}-bg{background:radial-gradient(90% 55% at 50% 30%,#18306E 0%,${NAVY} 62%);clip-path:inset(100% 0% 0% 0%);}
#${p}-tag{color:#8FA5D9;}
#${p}-grid{position:absolute;left:${g.x0}px;top:${g.y0}px;width:${g.w}px;height:${g.h}px;transform-origin:50% 50%;}
.${p}-rc{position:absolute;width:${g.cw}px;height:${g.ch}px;border-radius:${Math.round(18 * k)}px;background:#fff;box-shadow:0 18px 40px rgba(0,0,0,.35);overflow:hidden;}
.${p}-lb{position:absolute;left:${Math.round(18 * k)}px;top:${Math.round(16 * k)}px;font-weight:600;font-size:${Math.round(14 * k)}px;letter-spacing:.18em;color:#7A8499;}
.${p}-mo{position:absolute;left:${Math.round(16 * k)}px;top:${Math.round(36 * k)}px;font-size:${Math.round(66 * k)}px;color:${NAVY};}
.${p}-am{position:absolute;left:${Math.round(18 * k)}px;top:${Math.round(118 * k)}px;font-weight:600;font-size:${Math.round(20 * k)}px;color:#9AA3B5;}
.${p}-bc{position:absolute;right:${Math.round(18 * k)}px;bottom:${Math.round(18 * k)}px;width:${Math.round(108 * k)}px;height:${Math.round(26 * k)}px;background:repeating-linear-gradient(90deg,${NAVY} 0 2px,transparent 2px 5px,${NAVY} 5px 6px,transparent 6px 9px);opacity:.55;}
.${p}-sw{position:absolute;right:${Math.round(14 * k)}px;top:${Math.round(22 * k)}px;transform:rotate(-14deg);}
.${p}-st{padding:${Math.round(2 * k)}px ${Math.round(12 * k)}px 0;border:${Math.max(3, Math.round(4 * k))}px solid ${CORAL};border-radius:${Math.round(8 * k)}px;color:${CORAL};font-size:${Math.round(44 * k)}px;opacity:0;}
#${p}-dim{background:rgba(10,22,48,.62);opacity:0;}
#${p}-x12{position:absolute;left:0;width:${W}px;top:${x12.top}px;text-align:center;font-size:${x12.size}px;line-height:1;color:#fff;text-shadow:0 20px 60px rgba(0,0,0,.5);opacity:0;}
#${p}-x12 b{font-weight:400;color:${CORAL};}
#${p}-scan{position:absolute;left:${g.x0 - 20}px;top:${g.y0}px;width:${g.w + 40}px;height:4px;background:${CORAL};box-shadow:0 0 24px 6px rgba(255,90,78,.55);opacity:0;}
.${p}-q{position:absolute;left:0;width:${W}px;text-align:center;color:#fff;white-space:nowrap;}
`;
  const R = rng(1212);
  let cards = "";
  const rot = [];
  MESES.forEach((m, i) => {
    const cx = g.x0 * 0 + (i % g.cols) * (g.cw + g.gx);
    const cy = Math.floor(i / g.cols) * (g.ch + g.gy);
    rot.push(Math.round((R() - 0.5) * 22));
    cards += `<div class="${p}-rc" id="${p}-rc${i}" style="left:${cx}px;top:${cy}px"><div class="${p}-lb">MENSALIDADE</div><div class="${p}-mo ${p}-disp">${m}</div><div class="${p}-am">R$ ●●●,●●</div><div class="${p}-bc"></div><div class="${p}-sw"><div class="${p}-st ${p}-disp" id="${p}-st${i}">PAGO</div></div></div>`;
  });
  const body = `
  <div id="${p}-bg" class="${p}-full">
    <div id="${p}-tag" class="${p}-tag"><i></i>02 · VEZES DOZE</div>
    <div id="${p}-grid">${cards}</div>
    <div id="${p}-scan"></div>
    <div id="${p}-dim" class="${p}-full"></div>
    <div id="${p}-x12" class="${p}-disp"><b>×</b>12</div>
    <div class="${p}-q ${p}-disp" style="top:${q.t1}px;font-size:${q.s1}px;line-height:${q.s1}px">${wspans(`${p}a`, "Você sabe se esse valor")}</div>
    <div class="${p}-q ${p}-disp" style="top:${q.t2}px;font-size:${q.s2}px;line-height:${q.s2}px">${wspans(`${p}b`, "é")} <span class="w"><span class="wi" id="${p}b1" style="color:${CORAL}">justo?</span></span></div>
  </div>`;
  add(`tl.fromTo("#${p}-bg",{clipPath:"inset(100% 0% 0% 0%)"},{clipPath:"inset(0% 0% 0% 0%)",duration:0.34,ease:"power3.inOut"},0);`);
  add(`tl.fromTo("#${p}-tag",{opacity:0},{opacity:1,duration:0.3},0.25);`);
  const deal0 = L(at("multiplica")) - 0.1;
  MESES.forEach((_, i) => {
    add(`tl.fromTo("#${p}-rc${i}",{y:${pick(320, 220)},opacity:0,rotation:${rot[i]}},{y:0,opacity:1,rotation:0,duration:0.45,ease:"power3.out"},${r3(deal0 + i * 0.05)});`);
    add(`tl.fromTo("#${p}-st${i}",{scale:1.9,opacity:0},{scale:1,opacity:1,duration:0.16,ease:"power2.in"},${r3(L(at("doze")) - 0.12 + i * 0.022)});`);
  });
  add(`tl.fromTo("#${p}-dim",{opacity:0},{opacity:1,duration:0.25,ease:"power1.out"},${r3(L(at("doze")) - 0.05)});`);
  add(`tl.fromTo("#${p}-x12",{scale:2.3,opacity:0},{scale:1,opacity:1,duration:0.24,ease:"power4.in"},${r3(L(at("doze")) - 0.2)});`);
  add(`tl.to("#${p}-x12",{opacity:0.16,scale:0.92,duration:0.4,ease:"power2.out"},${r3(L(at("voce", 1)) - 0.15)});`);
  add(`tl.fromTo("#${p}-scan",{y:0,opacity:0},{y:${g.h},opacity:1,duration:1.3,ease:"sine.inOut"},${r3(L(at("voce", 1)))});`);
  add(`tl.to("#${p}-scan",{opacity:0,duration:0.2},${r3(L(at("voce", 1)) + 1.3)});`);
  words(`${p}a`, 5, [at("voce", 1), at("sabe"), at("se"), at("esse"), at("valor")]);
  add(`tl.fromTo("#${p}b0",{yPercent:115,opacity:0},{yPercent:0,opacity:1,duration:0.38,ease:"power3.out"},${L(at("e")) - 0.08});`);
  add(`tl.fromTo("#${p}b1",{yPercent:115,opacity:0,scale:1.25},{yPercent:0,opacity:1,scale:1,duration:0.42,ease:"back.out(1.6)"},${L(at("justo")) - 0.08});`);
  // saída: os boletos são sugados para o centro
  add(`tl.to("#${p}-grid",{scale:0.25,opacity:0,duration:0.32,ease:"power3.in"},${r3(dur - 0.42)});`);
  scenes.push({ st, track: 1, ...scene(p, dur, css, body, a) });
}

// ═════════════ 3 · DECISÃO ═════════════
{
  const st = 7.4;
  const dur = 5.2;
  const p = "s3";
  const { a, L, add, words } = TL(st);
  const A = pick({ t: [560, 700, 850], s: [150, 150, 330] }, { t: [150, 262, 380], s: [120, 120, 270] });
  const B = pick({ t: [570, 780, 990], s: 200, ul: 1205 }, { t: [180, 340, 500], s: 160, ul: 672 });
  const css =
    base(p) +
    `
#${p}-bg{background:${PAPER};opacity:0;}
#${p}-grid{background-image:linear-gradient(rgba(10,22,48,.05) 2px,transparent 2px),linear-gradient(90deg,rgba(10,22,48,.05) 2px,transparent 2px);background-size:90px 90px;}
#${p}-tag{color:rgba(10,22,48,.68);}
.${p}-t{position:absolute;left:0;width:${W}px;text-align:center;white-space:nowrap;}
#${p}-A{position:absolute;left:0;top:0;width:${W}px;height:${H}px;}
#${p}-B{position:absolute;left:0;top:0;width:${W}px;height:${H}px;transform-origin:50% ${B.t[1] + 80}px;}
#${p}-strike{position:absolute;left:0;top:0;}
#${p}-ul{position:absolute;left:${(W - pick(720, 560)) / 2}px;top:${B.ul}px;width:${pick(720, 560)}px;height:${pick(16, 12)}px;border-radius:8px;background:#00A1FC;transform-origin:0 50%;}
#${p}-rise{position:absolute;left:0;top:0;opacity:.18;}
`;
  const sy = A.t[2] + A.s[2] * 0.46;
  const body = `
  <div id="${p}-bg" class="${p}-full">
    <div id="${p}-grid" class="${p}-full"></div>
    <svg id="${p}-rise" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}"><path id="${p}-rise-p" d="M40 ${H - pick(260, 120)} L300 ${H - pick(420, 230)} L460 ${H - pick(380, 200)} L700 ${H - pick(760, 470)} L860 ${H - pick(700, 430)} L1060 ${H - pick(1180, 760)}" fill="none" stroke="#00A1FC" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="2400 2500" stroke-dashoffset="2400"/></svg>
    <div id="${p}-tag" class="${p}-tag"><i></i>03 · DECISÃO</div>
    <div id="${p}-A">
      <div class="${p}-t ${p}-disp" style="top:${A.t[0]}px;font-size:${A.s[0]}px;color:${NAVY}">${wspans(`${p}a`, "Plano de saúde")}</div>
      <div class="${p}-t ${p}-disp" style="top:${A.t[1]}px;font-size:${A.s[1]}px;color:${NAVY}">${wspans(`${p}b`, "não é")}</div>
      <div class="${p}-t ${p}-disp" style="top:${A.t[2]}px;font-size:${A.s[2]}px;color:${CORAL}">${wspans(`${p}c`, "gasto.")}</div>
      <svg id="${p}-strike" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}"><path id="${p}-strike-p" d="M${pick(150, 250)} ${sy + 10} C ${pick(380, 420)} ${sy - 18}, ${pick(640, 640)} ${sy + 26}, ${pick(930, 830)} ${sy - 6}" fill="none" stroke="${NAVY}" stroke-width="${pick(26, 20)}" stroke-linecap="round" stroke-dasharray="900 1000" stroke-dashoffset="900"/></svg>
    </div>
    <div id="${p}-B">
      <div class="${p}-t ${p}-disp" style="top:${B.t[0]}px;font-size:${B.s}px;color:${ROYAL}">${wspans(`${p}d`, "é decisão")}</div>
      <div class="${p}-t ${p}-disp" style="top:${B.t[1]}px;font-size:${B.s}px;color:${NAVY}">${wspans(`${p}e`, "financeira")}</div>
      <div class="${p}-t ${p}-disp" style="top:${B.t[2]}px;font-size:${B.s}px;color:${PBLUE}">${wspans(`${p}f`, "inteligente.")}</div>
      <div id="${p}-ul"></div>
    </div>
  </div>`;
  add(`tl.fromTo("#${p}-bg",{opacity:0},{opacity:1,duration:0.14,ease:"power1.out"},0);`);
  add(`tl.fromTo("#${p}-tag",{opacity:0},{opacity:1,duration:0.3},0.15);`);
  words(`${p}a`, 3, [at("plano", 1), at("de", 2), at("saude", 1)]);
  words(`${p}b`, 2, [at("nao"), at("e", 1)]);
  add(`tl.fromTo("#${p}c0",{yPercent:115,opacity:0,scale:1.25},{yPercent:0,opacity:1,scale:1,duration:0.45,ease:"back.out(1.5)"},${L(at("gasto")) - 0.08});`);
  add(`tl.fromTo("#${p}-strike-p",{attr:{"stroke-dashoffset":900}},{attr:{"stroke-dashoffset":0},duration:0.3,ease:"power2.in"},${r3(L(at("gasto")) + 0.36)});`);
  const bIn = L(word("e", 2).start);
  add(`tl.to("#${p}-A",{y:${pick(-160, -110)},opacity:0,duration:0.38,ease:"power3.in"},${r3(bIn - 0.3)});`);
  words(`${p}d`, 2, [word("e", 2).start, at("decisao")], 0.42);
  words(`${p}e`, 1, [at("financeira")], 0.42);
  words(`${p}f`, 1, [at("inteligente")], 0.42);
  add(`tl.fromTo("#${p}-ul",{scaleX:0},{scaleX:1,duration:0.5,ease:"power3.out"},${r3(L(at("inteligente")) + 0.35)});`);
  add(`tl.fromTo("#${p}-rise-p",{attr:{"stroke-dashoffset":2400}},{attr:{"stroke-dashoffset":0},duration:2.0,ease:"power2.inOut"},${r3(bIn)});`);
  add(`tl.fromTo("#${p}-B",{scale:1},{scale:1.04,duration:${r3(dur - L(at("inteligente")))},ease:"sine.inOut"},${L(at("inteligente"))});`);
  scenes.push({ st, track: 2, ...scene(p, dur, css, body, a) });
}

// ═════════════ 4 · O CAMINHO (CNPJ) ═════════════
{
  const st = 12.3;
  const dur = 7.65;
  const p = "s4";
  const { a, L, add, words } = TL(st);
  const card = pick({ x: 130, y: 680, w: 820, h: 500, k: 1 }, { x: 230, y: 300, w: 620, h: 380, k: 0.76 });
  const k = card.k;
  // depois do "CNPJ" o cartão encolhe: story -> centro alto; feed -> canto esquerdo
  const cardTo = pick({ s: 0.58, cx: 540, cy: 470 }, { s: 0.5, cx: 270, cy: 250 });
  const ch = pick(
    { pts: [[96, 720], [230, 742], [340, 726], [470, 860], [600, 842], [730, 1000], [860, 984], [984, 1150]], lbl: [96, 650] },
    { pts: [[500, 180], [600, 200], [680, 186], [770, 300], [850, 286], [930, 410], [990, 398], [1020, 470]], lbl: [500, 110] },
  );
  const txt = pick({ t1: 1225, s1: 120, t2: 1335, s2: 160 }, { t1: 600, s1: 100, t2: 690, s2: 150 });
  const hosp = pick({ x: 90, y: 570, w: 900, cap: 1235, cs: 150 }, { x: 190, y: 210, w: 700, cap: 720, cs: 120 });
  hosp.s = hosp.w / 1080;
  hosp.h = Math.round(705 * hosp.s);
  const head = pick({ t: [360, 455], s: 100 }, { t: [150], s: 84 });
  const pathD = (pts) => pts.map(([x, y], i) => `${i ? "L" : "M"}${x} ${y}`).join(" ");
  const len = Math.round(ch.pts.slice(1).reduce((s, q, i) => s + Math.hypot(q[0] - ch.pts[i][0], q[1] - ch.pts[i][1]), 0));
  const [ex, ey] = ch.pts[ch.pts.length - 1];
  const [px, py] = ch.pts[ch.pts.length - 2];
  const ang = r3((Math.atan2(ey - py, ex - px) * 180) / Math.PI);
  const css =
    base(p) +
    `
#${p}-bg{background:linear-gradient(160deg,${ROYAL} 0%,#2F6FE0 55%,${LIGHT} 100%);clip-path:inset(0% 0% 0% 100%);}
#${p}-orb{position:absolute;left:${pick(520, 640)}px;top:${pick(-200, -260)}px;width:900px;height:900px;border-radius:50%;border:2px solid rgba(255,255,255,.14);}
#${p}-orb2{position:absolute;left:${pick(-380, -420)}px;top:${pick(1200, 640)}px;width:760px;height:760px;border-radius:50%;background:radial-gradient(closest-side,rgba(255,255,255,.12),rgba(255,255,255,0));}
#${p}-tag{color:rgba(255,255,255,.62);}
.${p}-h{position:absolute;left:0;width:${W}px;text-align:center;font-size:${head.s}px;line-height:${head.s}px;color:#fff;white-space:nowrap;}
#${p}-card{position:absolute;left:${card.x}px;top:${card.y}px;width:${card.w}px;height:${card.h}px;border-radius:${Math.round(36 * k)}px;background:linear-gradient(135deg,rgba(255,255,255,.26),rgba(255,255,255,.07));border:2px solid rgba(255,255,255,.45);box-shadow:0 40px 90px rgba(5,15,60,.45);overflow:hidden;color:#fff;}
#${p}-chip{position:absolute;left:${Math.round(48 * k)}px;top:${Math.round(52 * k)}px;width:${Math.round(66 * k)}px;height:${Math.round(48 * k)}px;border-radius:${Math.round(10 * k)}px;background:linear-gradient(135deg,#F3F7FF,#A9C3F2);}
#${p}-pj{position:absolute;right:${Math.round(48 * k)}px;top:${Math.round(62 * k)}px;font-weight:600;font-size:${Math.round(20 * k)}px;letter-spacing:.26em;color:rgba(255,255,255,.85);}
#${p}-cn{position:absolute;left:${Math.round(40 * k)}px;top:${Math.round(128 * k)}px;font-size:${Math.round(240 * k)}px;line-height:1;}
#${p}-num{position:absolute;left:${Math.round(48 * k)}px;top:${Math.round(392 * k)}px;font-weight:600;font-size:${Math.round(34 * k)}px;letter-spacing:.08em;color:rgba(255,255,255,.9);}
#${p}-ring{position:absolute;right:${Math.round(-60 * k)}px;bottom:${Math.round(-90 * k)}px;width:${Math.round(320 * k)}px;height:${Math.round(320 * k)}px;border-radius:50%;border:${Math.round(26 * k)}px solid rgba(255,255,255,.12);}
#${p}-shine{position:absolute;left:-300px;top:-40px;width:200px;height:${card.h + 80}px;background:linear-gradient(90deg,rgba(255,255,255,0),rgba(255,255,255,.55),rgba(255,255,255,0));}
#${p}-chart{position:absolute;left:0;top:0;}
#${p}-lbl{position:absolute;left:${ch.lbl[0]}px;top:${ch.lbl[1]}px;font-weight:600;font-size:${pick(24, 18)}px;letter-spacing:.26em;color:rgba(255,255,255,.75);}
.${p}-tx{position:absolute;color:#fff;white-space:nowrap;}
#${p}-hosp{position:absolute;left:${hosp.x}px;top:${hosp.y}px;width:${hosp.w}px;height:${hosp.h}px;border-radius:${pick(32, 26)}px;overflow:hidden;box-shadow:0 0 0 ${pick(6, 5)}px #fff,0 40px 90px rgba(5,15,60,.45);clip-path:inset(50% 50% 50% 50% round ${pick(32, 26)}px);}
#${p}-hosp-img{position:absolute;left:0;top:${-Math.round(10 * hosp.s)}px;width:${hosp.w}px;height:${Math.round(1920 * hosp.s)}px;background:url("assets/img/plate.png") 0 0/${hosp.w}px ${Math.round(1920 * hosp.s)}px no-repeat;transform-origin:50% 20%;}
#${p}-cap{position:absolute;left:0;width:${W}px;top:${hosp.cap}px;display:flex;justify-content:center;align-items:center;gap:${pick(24, 18)}px;color:#fff;font-size:${hosp.cs}px;line-height:1;white-space:nowrap;}
#${p}-ok{width:${pick(110, 88)}px;height:${pick(110, 88)}px;flex:none;border-radius:50%;background:#fff;display:flex;align-items:center;justify-content:center;}
`;
  const body = `
  <div id="${p}-bg" class="${p}-full">
    <div id="${p}-orb"></div><div id="${p}-orb2"></div>
    <div id="${p}-tag" class="${p}-tag"><i></i>04 · O CAMINHO</div>
    <div id="${p}-head">${
      ST
        ? `<div class="${p}-h ${p}-disp" style="top:${head.t[0]}px">${wspans(`${p}a`, "E muita gente")}</div><div class="${p}-h ${p}-disp" style="top:${head.t[1]}px">${wspans(`${p}b`, "já descobriu:")}</div>`
        : `<div class="${p}-h ${p}-disp" style="top:${head.t[0]}px">${wspans(`${p}a`, "E muita gente")} ${wspans(`${p}b`, "já descobriu:")}</div>`
    }</div>
    <div id="${p}-card"><div id="${p}-ring"></div><div id="${p}-chip"></div><div id="${p}-pj">PESSOA JURÍDICA</div><div id="${p}-cn" class="${p}-disp">CNPJ</div><div id="${p}-num">••.•••.•••/0001-••</div><div id="${p}-shine"></div></div>
    <div id="${p}-lbl">MENSALIDADE</div>
    <svg id="${p}-chart" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
      <path id="${p}-cg" d="${pathD(ch.pts)}" fill="none" stroke="#fff" stroke-opacity=".22" stroke-width="30" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="${len} ${len + 60}" stroke-dashoffset="${len}"/>
      <path id="${p}-cl" d="${pathD(ch.pts)}" fill="none" stroke="#fff" stroke-width="11" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="${len} ${len + 60}" stroke-dashoffset="${len}"/>
      <g transform="translate(${ex} ${ey}) rotate(${ang})"><path id="${p}-ch" d="M-8 -30 L34 0 L-8 30 Z" fill="#fff"/></g>
    </svg>
    <div class="${p}-tx ${p}-disp" style="left:0;width:${W}px;text-align:${pick("center", "left")};${ST ? "" : "padding-left:60px;"}top:${txt.t1}px;font-size:${txt.s1}px;line-height:${txt.s1}px">${wspans(`${p}c`, "pode cair")}</div>
    <div class="${p}-tx ${p}-disp" style="left:0;width:${W}px;text-align:${pick("center", "left")};${ST ? "" : "padding-left:60px;"}top:${txt.t2}px;font-size:${txt.s2}px;line-height:${txt.s2}px">${wspans(`${p}d`, "bastante")}</div>
    <div id="${p}-hosp"><div id="${p}-hosp-img"></div></div>
    <div id="${p}-cap" class="${p}-disp"><div id="${p}-ok">${icon("check", pick(70, 56), `${p}-okc`, 5, ROYAL)}</div><span class="w"><span class="wi" id="${p}e0">mesma</span></span><span class="w"><span class="wi" id="${p}e1">qualidade</span></span></div>
  </div>`;
  add(`tl.fromTo("#${p}-bg",{clipPath:"inset(0% 0% 0% 100%)"},{clipPath:"inset(0% 0% 0% 0%)",duration:0.38,ease:"power3.inOut"},0);`);
  add(`tl.fromTo("#${p}-tag",{opacity:0},{opacity:1,duration:0.3},0.3);`);
  words(`${p}a`, 3, [at("e", 3), at("muita"), at("gente")]);
  words(`${p}b`, 2, [at("ja"), at("descobriu")]);
  const cIn = L(at("com", 0)) - 0.1;
  add(`tl.fromTo("#${p}-card",{rotationY:70,y:80,opacity:0,transformPerspective:1600},{rotationY:0,y:0,opacity:1,duration:0.62,ease:"power3.out"},${r3(cIn)});`);
  add(`tl.fromTo("#${p}-cn",{scale:1},{scale:1.08,duration:0.12,ease:"power2.out"},${L(at("cnpj"))});`);
  add(`tl.to("#${p}-cn",{scale:1,duration:0.4,ease:"power2.out"},${r3(L(at("cnpj")) + 0.12)});`);
  add(`tl.fromTo("#${p}-shine",{x:0},{x:${card.w + 600},duration:0.7,ease:"power2.inOut"},${r3(L(at("cnpj")) + 0.05)});`);
  // mensalidade caindo
  const m0 = L(at("mensalidade")) - 0.3;
  add(`tl.to("#${p}-head",{opacity:0,y:-30,duration:0.3,ease:"power2.in"},${r3(m0 - 0.1)});`);
  add(
    `tl.to("#${p}-card",{x:${cardTo.cx - (card.x + card.w / 2)},y:${cardTo.cy - (card.y + card.h / 2)},scale:${cardTo.s},duration:0.6,ease:"power3.inOut"},${r3(m0)});`,
  );
  add(`tl.fromTo("#${p}-lbl",{opacity:0,y:14},{opacity:1,y:0,duration:0.35,ease:"power2.out"},${r3(m0 + 0.35)});`);
  for (const id of ["cg", "cl"])
    add(`tl.fromTo("#${p}-${id}",{attr:{"stroke-dashoffset":${len}}},{attr:{"stroke-dashoffset":0},duration:1.2,ease:"power2.inOut"},${r3(m0 + 0.4)});`);
  add(`tl.fromTo("#${p}-ch",{opacity:0,scale:0.3},{opacity:1,scale:1,duration:0.3,ease:"back.out(2)"},${r3(m0 + 1.55)});`);
  words(`${p}c`, 2, [at("pode"), at("cair")]);
  words(`${p}d`, 1, [at("bastante")], 0.42);
  // mesma qualidade: o hospital Dr. Beda em cartão
  const q0 = L(at("mantendo")) - 0.15;
  add(`tl.to(["#${p}-card","#${p}-lbl","#${p}-chart",".${p}-tx"],{opacity:0,y:-40,duration:0.3,ease:"power2.in"},${r3(q0 - 0.1)});`);
  add(
    `tl.fromTo("#${p}-hosp",{clipPath:"inset(50% 50% 50% 50% round ${pick(32, 26)}px)"},{clipPath:"inset(0% 0% 0% 0% round ${pick(32, 26)}px)",duration:0.55,ease:"power3.out"},${r3(q0)});`,
  );
  add(`tl.fromTo("#${p}-hosp-img",{scale:1.12},{scale:1,duration:${r3(dur - q0)},ease:"power2.out"},${r3(q0)});`);
  add(`tl.fromTo("#${p}-ok",{scale:0,opacity:0},{scale:1,opacity:1,duration:0.4,ease:"back.out(2)"},${r3(L(at("mesma")) - 0.15)});`);
  words(`${p}e`, 2, [at("mesma"), at("qualidade")], 0.42);
  scenes.push({ st, track: 3, ...scene(p, dur, css, body, a) });
}

// ═════════════ 5 · A SOLUÇÃO (oferta) ═════════════
{
  const st = 19.6;
  const dur = 7.15;
  const p = "s5";
  const { a, L, add } = TL(st);
  const logo = pick({ x: 360, y: 318, w: 360 }, { x: 60, y: 52, w: 240 });
  logo.h = r3((logo.w * 32) / 140);
  const pill = pick({ top: 428, h: 58, fs: 24 }, { top: 122, h: 48, fs: 19 });
  const fam = pick({ x: 300, y: 490, h: 860 }, { x: 540, y: 250, h: 900 });
  fam.s = fam.h / 1376;
  fam.w = Math.round(768 * fam.s);
  const three = pick({ top: 380, size: 860, left: 0, w: W }, { top: 180, size: 640, left: 520, w: 560 });
  const price = pick({ x: 90, y: 1310, w: 900, h: 150 }, { x: 60, y: 470, w: 470, h: 142 });
  const foot = pick({ x: 90, y: 1476, w: 900, fs: 19, lh: 25, al: "center" }, { x: 60, y: 632, w: 470, fs: 17, lh: 22, al: "left" });
  // cabeças no recorte (px da imagem 768x1376): homem, mulher, jovem
  const HEADS = [
    [255, 450],
    [405, 555],
    [528, 535],
  ];
  const hx = (i) => Math.round(fam.x + HEADS[i][0] * fam.s);
  const hy = (i) => Math.round(fam.y + HEADS[i][1] * fam.s);
  const LABELS = [
    ["ADULTO", "até 38 anos"],
    ["ADULTO", "até 38 anos"],
    ["JOVEM", "até 18 anos"],
  ];
  const lab = [
    { cx: 200, cy: 640 },
    { cx: 553, cy: 560 },
    { cx: 880, cy: 640 },
  ];
  const css =
    base(p) +
    `
#${p}-bg{background:${LAV};opacity:0;}
#${p}-c1{position:absolute;left:${pick(380, 520)}px;top:${pick(760, 380)}px;width:${pick(1100, 900)}px;height:${pick(1100, 900)}px;border-radius:50%;background:radial-gradient(closest-side,rgba(58,144,238,.22),rgba(58,144,238,0));}
#${p}-c2{position:absolute;left:${pick(-260, -300)}px;top:${pick(180, -120)}px;width:${pick(700, 600)}px;height:${pick(700, 600)}px;border-radius:50%;border:2px solid rgba(33,70,195,.14);}
#${p}-tag{color:rgba(10,22,48,.68);${ST ? "" : "left:auto;right:60px;"}}
#${p}-logo{position:absolute;left:${logo.x}px;top:${logo.y}px;width:${logo.w}px;height:${logo.h}px;}
#${p}-pill{position:absolute;${ST ? `left:0;width:${W}px;display:flex;justify-content:center;` : `left:60px;`}top:${pill.top}px;}
#${p}-pill span{display:block;height:${pill.h}px;line-height:${pill.h}px;padding:0 ${pill.h * 0.55}px;border-radius:${pill.h / 2}px;background:${ROYAL};color:#fff;font-weight:700;font-size:${pill.fs}px;letter-spacing:.08em;white-space:nowrap;}
#${p}-three{position:absolute;left:${three.left}px;width:${three.w}px;top:${three.top}px;text-align:center;font-size:${three.size}px;line-height:1;color:${ROYAL};opacity:0;}
#${p}-fam{position:absolute;left:${fam.x}px;top:${fam.y}px;width:${fam.w}px;height:${fam.h}px;${ST ? "-webkit-mask-image:linear-gradient(180deg,#000 80%,rgba(0,0,0,0) 99%);mask-image:linear-gradient(180deg,#000 80%,rgba(0,0,0,0) 99%);" : ""}}
#${p}-fam img{display:block;width:100%;height:100%;}
.${p}-lab{position:absolute;padding:${pick(10, 8)}px ${pick(18, 14)}px;border-radius:${pick(18, 14)}px;background:#fff;box-shadow:0 12px 30px rgba(10,22,48,.18);text-align:center;white-space:nowrap;}
.${p}-lab b{display:block;font-weight:700;font-size:${pick(22, 18)}px;letter-spacing:.12em;color:${NAVY};}
.${p}-lab span{display:block;font-weight:500;font-size:${pick(19, 15)}px;color:#55607A;}
#${p}-leads{position:absolute;left:0;top:0;}
#${p}-price{position:absolute;left:${price.x}px;top:${price.y}px;width:${price.w}px;height:${price.h}px;border-radius:${pick(30, 28)}px;background:${ROYAL};color:#fff;box-shadow:0 26px 60px rgba(20,40,120,.3);}
#${p}-p3{position:absolute;left:${pick(40, 34)}px;top:${pick(24, 22)}px;font-size:${pick(66, 54)}px;line-height:1;}
#${p}-pf{position:absolute;left:${pick(42, 36)}px;top:${pick(94, 30)}px;font-weight:600;font-size:${pick(21, 18)}px;letter-spacing:.14em;color:rgba(255,255,255,.78);}
#${p}-pv{position:absolute;right:${pick(40, 34)}px;${ST ? "top:22px;" : "left:34px;top:60px;"}display:flex;align-items:flex-end;white-space:nowrap;}
#${p}-pz{position:relative;display:flex;align-items:flex-end;transform-origin:80% 80%;}
#${p}-cur{font-weight:600;font-size:${pick(30, 26)}px;line-height:1;margin:0 10px 12px 0;}
#${p}-num{font-weight:700;font-size:${pick(100, 64)}px;line-height:1;font-variant-numeric:tabular-nums;letter-spacing:-.01em;}
#${p}-ast{font-weight:700;font-size:${pick(66, 44)}px;line-height:1;align-self:flex-start;margin-left:4px;}
#${p}-flare{position:absolute;left:-60px;top:-60px;width:${pick(520, 420)}px;height:${pick(240, 200)}px;border-radius:50%;background:radial-gradient(closest-side,rgba(255,255,255,.6),rgba(255,255,255,0));opacity:0;}
#${p}-foot{position:absolute;left:${foot.x}px;top:${foot.y}px;width:${foot.w}px;text-align:${foot.al};font-weight:400;font-size:${foot.fs}px;line-height:${foot.lh}px;color:#3B4150;}
${
  ST
    ? ""
    : `#${p}-big{position:absolute;left:60px;top:196px;font-size:150px;line-height:1;color:${NAVY};}
.${p}-chip{position:absolute;left:60px;height:40px;line-height:40px;padding:0 18px;border-radius:20px;background:#fff;color:${NAVY};font-weight:600;font-size:17px;box-shadow:0 8px 20px rgba(10,22,48,.12);white-space:nowrap;}`
}
`;
  let labels = "";
  let leads = "";
  if (ST) {
    LABELS.forEach(([t1, t2], i) => {
      labels += `<div class="${p}-lab" id="${p}-lab${i}" style="left:${lab[i].cx - 115}px;top:${lab[i].cy - 38}px;width:230px"><b>${t1}</b><span>${t2}</span></div>`;
      const sx = i === 0 ? lab[i].cx + 115 : i === 2 ? lab[i].cx - 115 : lab[i].cx;
      const sy2 = i === 1 ? lab[i].cy + 38 : lab[i].cy;
      const tx = hx(i) + (i === 0 ? -34 : i === 2 ? 34 : 0);
      const ty = hy(i) - (i === 1 ? 52 : 10);
      leads += `<path id="${p}-ld${i}" d="M${sx} ${sy2} L${tx} ${ty}" stroke="${ROYAL}" stroke-width="3" fill="none" stroke-dasharray="400 500" stroke-dashoffset="400"/><circle id="${p}-dt${i}" cx="${tx}" cy="${ty}" r="9" fill="${ROYAL}" stroke="#fff" stroke-width="4" opacity="0"/>`;
    });
  } else {
    labels = `<div id="${p}-big" class="${p}-disp">3 vidas</div><div class="${p}-chip" id="${p}-lab0" style="top:356px">2 adultos até 38 anos</div><div class="${p}-chip" id="${p}-lab1" style="top:404px">1 jovem até 18 anos</div>`;
  }
  const FOOT_TEXT = "*2 adultos até 38 anos e 1 jovem até 18 anos | Os valores podem variar conforme o perfil do beneficiário.";
  const body = `
  <div id="${p}-bg" class="${p}-full">
    <div id="${p}-c1"></div><div id="${p}-c2" data-layout-allow-overflow></div>
    <div id="${p}-tag" class="${p}-tag"><i></i>05 · A SOLUÇÃO</div>
    <div id="${p}-three" class="${p}-disp" aria-hidden="true" data-layout-allow-occlusion>3</div>
    <div id="${p}-fam"><img src="assets/img/ai-family-cutout.png" alt="" /></div>
    <svg id="${p}-leads" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">${leads}</svg>
    ${labels}
    <img id="${p}-logo" src="assets/img/porto-logo.svg" alt="Porto" />
    <div id="${p}-pill"><span>PLANO DE SAÚDE PARA CNPJ</span></div>
    <div id="${p}-price">${ST ? `<div id="${p}-p3" class="${p}-disp">3 vidas</div>` : ""}<div id="${p}-pf">A PARTIR DE</div><div id="${p}-pv"><div id="${p}-pz"><div id="${p}-flare"></div><span id="${p}-cur">R$</span><span id="${p}-num">0,00</span><span id="${p}-ast">*</span></div></div></div>
    <div id="${p}-foot">${FOOT_TEXT}</div>
  </div>`;
  add(`tl.fromTo("#${p}-bg",{opacity:0},{opacity:1,duration:0.2,ease:"power1.out"},0);`);
  add(`tl.fromTo("#${p}-tag",{opacity:0},{opacity:1,duration:0.3},0.2);`);
  add(`tl.fromTo("#${p}-c2",{rotation:0},{rotation:40,duration:${dur},ease:"none"},0);`);
  const lg = L(at("porto")) - 0.12;
  add(`tl.fromTo("#${p}-logo",{clipPath:"inset(0% 100% 0% 0%)",scale:0.92},{clipPath:"inset(0% 0% 0% 0%)",scale:1,duration:0.55,ease:"power3.out"},${r3(lg)});`);
  add(`tl.fromTo("#${p}-pill",{opacity:0,y:16,scale:0.9},{opacity:1,y:0,scale:1,duration:0.4,ease:"back.out(1.6)"},${r3(L(at("plano", 2)) - 0.1)});`);
  const f0 = L(at("porto")) + 0.35;
  add(`tl.fromTo("#${p}-three",{opacity:0,scale:0.8},{opacity:0.1,scale:1,duration:0.7,ease:"power3.out"},${r3(L(at("comeca")) - 0.15)});`);
  add(`tl.fromTo("#${p}-fam",{y:${pick(160, 120)},opacity:0},{y:0,opacity:1,duration:0.75,ease:"power3.out"},${r3(f0)});`);
  add(`tl.fromTo("#${p}-fam img",{scale:1},{scale:1.03,duration:${r3(dur - f0 - 0.75)},ease:"sine.inOut"},${r3(f0 + 0.75)});`);
  const t3 = L(at("tres"));
  if (ST) {
    [0, 1, 2].forEach((i) => {
      const t = r3(t3 - 0.05 + i * 0.16);
      add(`tl.fromTo("#${p}-lab${i}",{opacity:0,scale:0.8,y:10},{opacity:1,scale:1,y:0,duration:0.35,ease:"back.out(1.8)"},${t});`);
      add(`tl.fromTo("#${p}-ld${i}",{attr:{"stroke-dashoffset":400}},{attr:{"stroke-dashoffset":0},duration:0.35,ease:"power2.out"},${r3(t + 0.1)});`);
      add(`tl.fromTo("#${p}-dt${i}",{opacity:0,scale:0},{opacity:1,scale:1,duration:0.25,ease:"back.out(2)",transformOrigin:"50% 50%"},${r3(t + 0.4)});`);
    });
  } else {
    add(`tl.fromTo("#${p}-big",{opacity:0,y:30},{opacity:1,y:0,duration:0.45,ease:"power3.out"},${r3(t3 - 0.1)});`);
    [0, 1].forEach((i) =>
      add(`tl.fromTo("#${p}-lab${i}",{opacity:0,x:-20},{opacity:1,x:0,duration:0.35,ease:"power3.out"},${r3(t3 + 0.15 + i * 0.15)});`),
    );
  }
  const pIn = L(word("a", 2).start) - 0.1;
  add(`tl.fromTo("#${p}-price",{opacity:0,y:50},{opacity:1,y:0,duration:0.45,ease:"power3.out"},${r3(pIn)});`);
  add(`tl.fromTo("#${p}-foot",{opacity:0},{opacity:1,duration:0.4,ease:"power1.out"},${r3(pIn + 0.25)});`);
  {
    const t0 = L(at("novecentos"));
    const t1 = L(LOCK);
    const steps = Math.round((t1 - t0) * FPS);
    for (let s = 0; s <= steps; s++) {
      const q = s / steps;
      add(`tl.set("#${p}-num",{textContent:"${s === steps ? "942,80" : brl(942.8 * (1 - Math.pow(1 - q, 3)))}"},${r3(t0 + q * (t1 - t0))});`);
    }
    add(`tl.fromTo("#${p}-pz",{scale:1},{scale:1.08,duration:0.12,ease:"power2.out"},${r3(t1)});`);
    add(`tl.to("#${p}-pz",{scale:1,duration:0.4,ease:"power2.out"},${r3(t1 + 0.12)});`);
    add(`tl.fromTo("#${p}-flare",{opacity:0,scale:0.7},{opacity:1,scale:1,duration:0.14,ease:"power2.out"},${r3(t1)});`);
    add(`tl.to("#${p}-flare",{opacity:0,scale:1.25,duration:0.5,ease:"power2.out"},${r3(t1 + 0.14)});`);
  }
  scenes.push({ st, track: 4, ...scene(p, dur, css, body, a) });
}

// ═════════════ 6 · BENEFÍCIOS ═════════════
{
  const st = 26.4;
  const dur = 6.05;
  const p = "s6";
  const { a, L, add } = TL(st);
  const img = pick({ x: 72, y: 300, w: 936, h: 450 }, { x: 60, y: 60, w: 380, h: 960 });
  const tiles = pick(
    { xs: [72, 552], ys: [778, 1142], w: 456, h: 340, ic: 100, fs: 33 },
    { xs: [464, 754], ys: [60, 552], w: 266, h: 468, ic: 86, fs: 25 },
  );
  const NAMES = [
    ["Plano<br>odontológico", "tooth"],
    ["Seguro<br>de vida", "heart"],
    ["Serviços<br>ocupacionais", "case"],
    ["Proteção<br>antiácaro", "shield"],
  ];
  const times = [at("plano", 3), at("seguro"), at("servicos"), at("protecao")];
  const css =
    base(p) +
    `
#${p}-bg{background:${NAVY};clip-path:inset(100% 0% 0% 0%);}
#${p}-grid{background-image:linear-gradient(rgba(255,255,255,.04) 2px,transparent 2px),linear-gradient(90deg,rgba(255,255,255,.04) 2px,transparent 2px);background-size:90px 90px;}
#${p}-tag{color:rgba(255,255,255,.5);${ST ? "" : "left:auto;right:60px;top:1040px;"}}
#${p}-img{position:absolute;left:${img.x}px;top:${img.y}px;width:${img.w}px;height:${img.h}px;border-radius:${pick(32, 28)}px;overflow:hidden;clip-path:inset(0% 0% 100% 0% round ${pick(32, 28)}px);}
#${p}-img-in{position:absolute;inset:0;background:url("assets/img/ai-doctor.png") 50% ${pick(36, 50)}%/cover no-repeat;}
#${p}-img-sh{position:absolute;inset:0;background:linear-gradient(180deg,rgba(10,22,48,0) 45%,rgba(10,22,48,.85) 100%);}
#${p}-img-t{position:absolute;left:${pick(36, 28)}px;bottom:${pick(30, 34)}px;color:#fff;}
#${p}-img-t b{display:block;font-weight:400;font-size:${pick(92, 84)}px;line-height:.92;}
#${p}-img-t span{display:block;margin-top:${pick(8, 10)}px;font-weight:600;font-size:${pick(20, 16)}px;letter-spacing:.24em;color:#8CCBFF;}
.${p}-tile{position:absolute;width:${tiles.w}px;height:${tiles.h}px;border-radius:${pick(30, 26)}px;background:linear-gradient(160deg,#2350D8 0%,#16308F 100%);border:1.5px solid rgba(255,255,255,.12);box-shadow:0 26px 60px rgba(0,0,0,.35);overflow:hidden;}
.${p}-ic{position:absolute;left:${pick(34, 26)}px;top:${pick(34, 30)}px;width:${tiles.ic}px;height:${tiles.ic}px;border-radius:50%;background:${LIGHT};display:flex;align-items:center;justify-content:center;}
.${p}-ix{position:absolute;right:${pick(30, 24)}px;top:${pick(28, 24)}px;font-size:${pick(46, 40)}px;line-height:1;color:#7DB8FF;}
.${p}-nm{position:absolute;left:${pick(36, 28)}px;bottom:${pick(32, 30)}px;font-weight:700;font-size:${tiles.fs}px;line-height:1.18;text-transform:uppercase;color:#fff;letter-spacing:.01em;}
.${p}-glow{position:absolute;inset:0;border-radius:${pick(30, 26)}px;box-shadow:inset 0 0 0 3px #8CCBFF;opacity:0;}
`;
  let tilesHtml = "";
  NAMES.forEach(([nm, ic], i) => {
    const x = tiles.xs[i % 2];
    const y = tiles.ys[Math.floor(i / 2)];
    tilesHtml += `<div class="${p}-tile" id="${p}-t${i}" style="left:${x}px;top:${y}px"><div class="${p}-glow" id="${p}-g${i}"></div><div class="${p}-ic">${icon(ic, Math.round(tiles.ic * 0.58), `${p}-i${i}`, 3.4)}</div><div class="${p}-ix ${p}-disp">0${i + 1}</div><div class="${p}-nm">${nm}</div></div>`;
  });
  const body = `
  <div id="${p}-bg" class="${p}-full">
    <div id="${p}-grid" class="${p}-full"></div>
    <div id="${p}-tag" class="${p}-tag"><i></i>06 · BENEFÍCIOS</div>
    <div id="${p}-img"><div id="${p}-img-in"></div><div id="${p}-img-sh"></div><div id="${p}-img-t"><b class="${p}-disp">E tem mais</b><span>PORTO · PLANO PARA CNPJ</span></div></div>
    ${tilesHtml}
  </div>`;
  add(`tl.fromTo("#${p}-bg",{clipPath:"inset(100% 0% 0% 0%)"},{clipPath:"inset(0% 0% 0% 0%)",duration:0.36,ease:"power3.inOut"},0);`);
  add(`tl.fromTo("#${p}-tag",{opacity:0},{opacity:1,duration:0.3},0.3);`);
  add(`tl.fromTo("#${p}-img",{clipPath:"inset(0% 0% 100% 0% round ${pick(32, 28)}px)"},{clipPath:"inset(0% 0% 0% 0% round ${pick(32, 28)}px)",duration:0.6,ease:"power3.out"},0.12);`);
  add(`tl.fromTo("#${p}-img-in",{scale:1.12},{scale:1,duration:${r3(dur - 0.12)},ease:"power2.out"},0.12);`);
  times.forEach((t, i) => {
    const t0 = r3(L(t) - 0.14);
    add(`tl.fromTo("#${p}-t${i}",{opacity:0,y:50,scale:0.92},{opacity:1,y:0,scale:1,duration:0.5,ease:"back.out(1.3)"},${t0});`);
    add(`tl.fromTo("#${p}-i${i}",{opacity:0,scale:0.4},{opacity:1,scale:1,duration:0.4,ease:"back.out(2)"},${r3(t0 + 0.12)});`);
    add(`tl.fromTo("#${p}-g${i}",{opacity:0},{opacity:1,duration:0.15,ease:"power1.out"},${r3(t0 + 0.2)});`);
    add(`tl.to("#${p}-g${i}",{opacity:0,duration:0.6,ease:"power1.in"},${r3(t0 + 0.35)});`);
  });
  scenes.push({ st, track: 5, ...scene(p, dur, css, body, a) });
}

// ═════════════ 7 · COMPARATIVO ═════════════
{
  const st = 32.1;
  const dur = 6.15;
  const p = "s7";
  const { a, L, add, words } = TL(st);
  const tt = pick({ t: [300, 412, 524], s: 112, al: "center", x: 0 }, { t: [70, 158, 246], s: 90, al: "left", x: 60 });
  const card = pick({ x: 72, y: 1060, w: 936, h: 440 }, { x: 60, y: 590, w: 960, h: 430 });
  const pad = pick(40, 36);
  const css =
    base(p) +
    `
#${p}-bg{clip-path:inset(0% 0% 0% 100%);background:${NAVY};}
#${p}-ph{background:url("assets/img/ai-consult.png") 50% ${pick(42, 40)}%/cover no-repeat;transform-origin:50% 45%;}
#${p}-top{background:linear-gradient(180deg,rgba(6,14,36,.88) 0%,rgba(6,14,36,.55) ${pick(24, 28)}%,rgba(6,14,36,0) ${pick(40, 46)}%);}
#${p}-bot{background:linear-gradient(180deg,rgba(6,14,36,0) ${pick(46, 44)}%,rgba(6,14,36,.75) ${pick(58, 56)}%,rgba(6,14,36,.92) 100%);}
#${p}-tag{color:rgba(255,255,255,.6);${ST ? "" : "left:auto;right:60px;"}}
.${p}-t{position:absolute;left:${tt.x}px;width:${W - tt.x}px;text-align:${tt.al};font-size:${tt.s}px;line-height:${tt.s}px;white-space:nowrap;text-shadow:0 8px 26px rgba(0,0,0,.4);}
#${p}-card{position:absolute;left:${card.x}px;top:${card.y}px;width:${card.w}px;height:${card.h}px;border-radius:${pick(32, 28)}px;background:rgba(8,18,44,.86);border:1.5px solid rgba(255,255,255,.14);box-shadow:0 30px 80px rgba(0,0,0,.45);}
#${p}-hd{position:absolute;left:${pad}px;top:${pick(32, 28)}px;font-weight:700;font-size:${pick(21, 19)}px;letter-spacing:.24em;color:#8CCBFF;}
#${p}-live{position:absolute;right:${pad}px;top:${pick(34, 30)}px;display:flex;align-items:center;gap:10px;font-weight:600;font-size:${pick(18, 16)}px;letter-spacing:.2em;color:rgba(255,255,255,.6);}
#${p}-dot{width:12px;height:12px;border-radius:50%;background:${MINT};}
.${p}-rw{position:absolute;left:${pad}px;width:${card.w - 2 * pad}px;}
.${p}-lb{font-weight:600;font-size:${pick(24, 22)}px;color:rgba(255,255,255,.88);}
.${p}-vl{position:absolute;right:0;top:0;font-weight:700;font-size:${pick(26, 24)}px;color:#fff;font-variant-numeric:tabular-nums;}
.${p}-tr{position:relative;margin-top:${pick(12, 10)}px;height:${pick(22, 20)}px;border-radius:11px;background:rgba(255,255,255,.1);overflow:hidden;}
.${p}-fl{position:absolute;left:0;top:0;height:100%;border-radius:11px;transform-origin:0 50%;}
#${p}-eco{position:absolute;left:${pad}px;top:${pick(300, 300)}px;width:${card.w - 2 * pad}px;height:${pick(96, 92)}px;border-radius:${pick(48, 46)}px;background:${MINT};display:flex;align-items:center;justify-content:space-between;padding:0 ${pick(34, 30)}px;overflow:hidden;}
#${p}-eco b{font-weight:700;font-size:${pick(22, 20)}px;letter-spacing:.2em;color:${NAVY};}
#${p}-eco span{font-weight:800;font-size:${pick(28, 26)}px;color:${NAVY};white-space:nowrap;}
#${p}-eshine{position:absolute;left:-200px;top:0;width:140px;height:100%;background:linear-gradient(90deg,rgba(255,255,255,0),rgba(255,255,255,.7),rgba(255,255,255,0));}
`;
  const body = `
  <div id="${p}-bg" class="${p}-full">
    <div id="${p}-ph" class="${p}-full"></div>
    <div id="${p}-top" class="${p}-full"></div>
    <div id="${p}-bot" class="${p}-full"></div>
    <div id="${p}-tag" class="${p}-tag"><i></i>07 · COMPARATIVO</div>
    <div class="${p}-t ${p}-disp" style="top:${tt.t[0]}px;color:#fff">${wspans(`${p}a`, "A gente compara")}</div>
    <div class="${p}-t ${p}-disp" style="top:${tt.t[1]}px;color:#FFC2BC">${wspans(`${p}b`, "seu plano atual")}</div>
    <div class="${p}-t ${p}-disp" style="top:${tt.t[2]}px;color:#8CCBFF">${wspans(`${p}c`, "com o mercado")}</div>
    <div id="${p}-card">
      <div id="${p}-hd">ANÁLISE COMPARATIVA</div>
      <div id="${p}-live"><div id="${p}-dot"></div>COM NÚMEROS</div>
      <div class="${p}-rw" style="top:${pick(96, 90)}px"><div class="${p}-lb">Seu plano atual</div><div class="${p}-vl" id="${p}-v0">R$ ●●●,●●</div><div class="${p}-tr"><div class="${p}-fl" id="${p}-f0" style="width:92%;background:linear-gradient(90deg,#FF8A65,${CORAL})"></div></div></div>
      <div class="${p}-rw" style="top:${pick(190, 186)}px"><div class="${p}-lb">Plano para CNPJ</div><div class="${p}-vl" id="${p}-v1">R$ ●●●,●●</div><div class="${p}-tr"><div class="${p}-fl" id="${p}-f1" style="width:58%;background:linear-gradient(90deg,#8CCBFF,#00A1FC)"></div></div></div>
      <div id="${p}-eco"><b>SUA ECONOMIA</b><span>Descubra na simulação</span><div id="${p}-eshine"></div></div>
    </div>
  </div>`;
  add(`tl.fromTo("#${p}-bg",{clipPath:"inset(0% 0% 0% 100%)"},{clipPath:"inset(0% 0% 0% 0%)",duration:0.4,ease:"power3.inOut"},0);`);
  add(`tl.fromTo("#${p}-ph",{scale:1.0},{scale:1.08,duration:${dur},ease:"sine.inOut"},0);`);
  add(`tl.fromTo("#${p}-tag",{opacity:0},{opacity:1,duration:0.3},0.3);`);
  words(`${p}a`, 3, [word("a", 3).start, at("gente", 1), at("compara")]);
  words(`${p}b`, 3, [at("seu"), at("plano", 4), at("atual")]);
  words(`${p}c`, 3, [at("com", 2), at("o", 3), at("mercado")]);
  const c0 = L(at("seu")) - 0.2;
  add(`tl.fromTo("#${p}-card",{opacity:0,y:60},{opacity:1,y:0,duration:0.5,ease:"power3.out"},${r3(c0)});`);
  add(`tl.fromTo("#${p}-f0",{scaleX:0},{scaleX:1,duration:0.8,ease:"power2.out"},${r3(L(at("atual")) - 0.1)});`);
  add(`tl.fromTo("#${p}-f1",{scaleX:0},{scaleX:1,duration:0.8,ease:"power2.out"},${r3(L(at("mercado")) - 0.05)});`);
  add(`tl.fromTo("#${p}-dot",{opacity:1},{opacity:0.25,duration:0.5,ease:"sine.inOut",repeat:${Math.floor((dur - c0) / 0.5) - 1},yoyo:true},${r3(c0 + 0.4)});`);
  {
    const R = rng(7272);
    const s0 = L(at("numeros")) - 0.1;
    for (let t = s0; t < s0 + 0.85; t += 1 / 15) {
      add(`tl.set("#${p}-v0",{textContent:"R$ ${brl(800 + R() * 2200)}"},${r3(t)});`);
      add(`tl.set("#${p}-v1",{textContent:"R$ ${brl(500 + R() * 1400)}"},${r3(t)});`);
    }
    add(`tl.set("#${p}-v0",{textContent:"R$ ?"},${r3(s0 + 0.9)});`);
    add(`tl.set("#${p}-v1",{textContent:"R$ ?"},${r3(s0 + 0.9)});`);
  }
  const e0 = L(at("economizar")) - 0.2;
  add(`tl.fromTo("#${p}-eco",{opacity:0,scale:0.85},{opacity:1,scale:1,duration:0.45,ease:"back.out(1.6)"},${r3(e0)});`);
  add(`tl.fromTo("#${p}-eshine",{x:0},{x:${card.w + 200},duration:0.8,ease:"power2.inOut"},${r3(e0 + 0.35)});`);
  scenes.push({ st, track: 6, ...scene(p, dur, css, body, a) });
}

// ═════════════ 8 · CTA (a peça da Porto se monta) ═════════════
{
  const st = 37.9;
  const dur = D - st;
  const p = "s8";
  const { a, L, add } = TL(st);
  // geometria das peças da Porto (a mesma do filme porto-cnpj-dor)
  const G = pick(
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
    },
  );
  const ITEMS = [
    ["PLANO ODONTOLÓGICO", "tooth"],
    ["SEGURO DE VIDA", "heart"],
    ["SERVIÇOS OCUPACIONAIS", "case"],
    ["PROTEÇÃO ANTIÁCARO", "shield"],
  ];
  const LOGO_H = r3((G.logo.w * 32) / 140);
  const css =
    base(p) +
    `
#${p}-lav{background:${LAV};clip-path:inset(100% 0% 0% 0%);}
#${p}-ph{clip-path:inset(0% 0% 100% 0%);}
#${p}-cam{transform-origin:${pick("700px 250px", "700px 150px")};}
#${p}-photo{position:absolute;left:0;top:0;width:${W}px;height:${H}px;}
#${p}-block{position:absolute;left:0;top:${G.block.top}px;width:${G.block.w}px;height:${G.block.h}px;background:${LIGHT};border-radius:0 ${G.block.r}px ${G.block.r}px 0;color:#fff;}
#${p}-title{position:absolute;left:${G.title.left}px;top:${G.title.top}px;font-weight:600;font-size:${G.title.size}px;line-height:${G.title.lh}px;white-space:nowrap;}
#${p}-lives{position:absolute;left:${G.title.left}px;top:${G.lives.top}px;font-weight:600;font-size:${G.lives.size}px;line-height:50px;white-space:nowrap;}
#${p}-price{position:absolute;left:${G.price.left}px;top:${G.price.top}px;height:86px;display:flex;align-items:flex-end;white-space:nowrap;}
#${p}-cur{font-weight:600;font-size:26px;line-height:1;margin:0 10px 10px 2px;}
#${p}-num{font-weight:600;font-size:${G.price.num}px;line-height:1;letter-spacing:-.005em;}
#${p}-ast{font-weight:600;font-size:60px;line-height:1;margin-left:4px;align-self:flex-start;}
#${p}-card{position:absolute;left:0;top:${G.card.top}px;width:${G.card.w}px;height:${G.card.h}px;background:${ROYAL};border-radius:0 ${G.card.r}px ${G.card.r}px 0;}
.${p}-item{position:absolute;left:${G.items.left}px;height:0;display:flex;align-items:center;}
.${p}-ic{width:${G.items.ic}px;height:${G.items.ic}px;flex:none;border-radius:50%;background:${LIGHT};display:flex;align-items:center;justify-content:center;}
.${p}-it{margin-left:${Math.round(G.items.size * 0.66)}px;font-weight:500;font-size:${G.items.size}px;line-height:44px;color:#fff;white-space:nowrap;letter-spacing:.01em;}
#${p}-logo{position:absolute;left:${G.logo.left}px;top:${G.logo.top}px;width:${G.logo.w}px;height:${LOGO_H}px;}
#${p}-foot{position:absolute;left:${G.foot.left}px;top:${G.foot.top}px;width:${G.foot.w}px;font-weight:400;font-size:${G.foot.size}px;line-height:${G.foot.lh}px;color:#2B3140;}
#${p}-cta{position:absolute;left:0;top:${G.cta.top}px;width:${W}px;height:${G.cta.h}px;background:${LIGHT};}
#${p}-cta-in{position:absolute;inset:0;display:flex;flex-direction:${G.cta.row ? "row" : "column"};align-items:center;justify-content:center;gap:${G.cta.row ? 30 : 8}px;}
#${p}-cta-text{font-weight:700;font-size:${G.cta.text}px;line-height:${G.cta.text + 6}px;letter-spacing:-.02em;color:#fff;white-space:nowrap;}
#${p}-btn-pop{position:relative;}
#${p}-ring{position:absolute;inset:0;border-radius:999px;border:3px solid rgba(255,255,255,.95);opacity:0;}
#${p}-btn{position:relative;height:56px;padding:0 10px 0 30px;display:flex;align-items:center;gap:14px;border-radius:999px;background:#fff;box-shadow:0 8px 22px rgba(20,40,110,.25);}
#${p}-btn-t{font-weight:700;font-size:${pick(25, 22)}px;line-height:1;color:${ROYAL};white-space:nowrap;}
#${p}-btn-a{width:40px;height:40px;border-radius:50%;background:${ROYAL};display:flex;align-items:center;justify-content:center;}
#${p}-hand{position:absolute;left:${pick(600, 860)}px;top:${pick(1480, 1010)}px;width:${pick(96, 80)}px;height:${pick(96, 80)}px;opacity:0;}
`;
  const itemsHtml = ITEMS.map(
    ([t, ic], i) =>
      `<div class="${p}-item" style="top:${G.items.y[i]}px"><div class="${p}-ic" id="${p}-ic${i}">${icon(ic, Math.round(G.items.ic * 0.6))}</div><div class="${p}-it" id="${p}-it${i}">${t}</div></div>`,
  ).join("");
  const FOOT_TEXT = "*2 adultos até 38 anos e 1 jovem até 18 anos | Os valores podem variar conforme o perfil do beneficiário.";
  const body = `
  <div id="${p}-lav" class="${p}-full"></div>
  <div id="${p}-ph" class="${p}-full"><div id="${p}-cam" class="${p}-full"><img id="${p}-photo" src="${G.plate}" alt="Hospital Dr. Beda" /></div></div>
  <div id="${p}-block" data-layout-allow-overflow>
    <div id="${p}-title"><div>${wspans(`${p}t`, "Plano de Saúde")}</div><div>${wspans(`${p}u`, "para CNPJ")}</div></div>
    <div id="${p}-lives">3 vidas a partir de</div>
    <div id="${p}-price"><span id="${p}-cur">R$</span><span id="${p}-num">942,80</span><span id="${p}-ast">*</span></div>
  </div>
  <div id="${p}-card">${itemsHtml}</div>
  <img id="${p}-logo" src="assets/img/porto-logo.svg" alt="Porto" />
  <div id="${p}-foot">${FOOT_TEXT}</div>
  <div id="${p}-cta" data-layout-allow-overflow>
    <div id="${p}-cta-in">
      <div id="${p}-cta-text">Simulação Gratuita 100% Online</div>
      <div id="${p}-btn-pop"><div id="${p}-ring"></div><div id="${p}-btn"><span id="${p}-btn-t">Falar com especialista</span><span id="${p}-btn-a"><svg id="${p}-arrow" viewBox="0 0 24 24" width="22" height="22"><path d="M5 12h12M12 6l6 6-6 6" fill="none" stroke="#fff" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/></svg></span></div></div>
    </div>
  </div>
  <div id="${p}-hand">${icon("hand", pick(96, 80), "", 2.6, NAVY).replace("<svg ", '<svg style="filter:drop-shadow(0 6px 14px rgba(0,0,0,.35));fill:#fff" ')}</div>`;
  add(`tl.fromTo("#${p}-lav",{clipPath:"inset(100% 0% 0% 0%)"},{clipPath:"inset(0% 0% 0% 0%)",duration:0.36,ease:"power3.inOut"},0);`);
  add(`tl.fromTo("#${p}-ph",{clipPath:"inset(0% 0% 100% 0%)"},{clipPath:"inset(0% 0% 0% 0%)",duration:0.6,ease:"power3.out"},0.12);`);
  add(`tl.fromTo("#${p}-cam",{scale:1.06},{scale:1.0,duration:${r3(dur - 1.4)},ease:"power2.out"},0.12);`);
  add(`tl.fromTo("#${p}-block",{x:-${G.block.w + 40}},{x:0,duration:0.5,ease:"power3.out"},0.2);`);
  [0, 1, 2].forEach((i) => add(`tl.fromTo("#${p}t${i}",{yPercent:110,opacity:0},{yPercent:0,opacity:1,duration:0.4,ease:"power3.out"},${r3(0.36 + i * 0.07)});`));
  [0, 1].forEach((i) => add(`tl.fromTo("#${p}u${i}",{yPercent:110,opacity:0},{yPercent:0,opacity:1,duration:0.4,ease:"power3.out"},${r3(0.58 + i * 0.07)});`));
  add(`tl.fromTo("#${p}-lives",{opacity:0,y:16},{opacity:1,y:0,duration:0.35,ease:"power3.out"},0.7);`);
  add(`tl.fromTo("#${p}-price",{opacity:0,y:16},{opacity:1,y:0,duration:0.35,ease:"power3.out"},0.78);`);
  add(`tl.fromTo("#${p}-card",{y:${pick(300, 220)},opacity:0},{y:0,opacity:1,duration:0.5,ease:"power3.out"},0.85);`);
  ITEMS.forEach((_, i) => {
    add(`tl.fromTo("#${p}-ic${i}",{scale:0.3,opacity:0},{scale:1,opacity:1,duration:0.32,ease:"back.out(1.8)"},${r3(1.0 + i * 0.09)});`);
    add(`tl.fromTo("#${p}-it${i}",{opacity:0,x:-24},{opacity:1,x:0,duration:0.35,ease:"power3.out"},${r3(1.04 + i * 0.09)});`);
  });
  add(`tl.fromTo("#${p}-logo",{clipPath:"inset(0% 100% 0% 0%)"},{clipPath:"inset(0% 0% 0% 0%)",duration:0.5,ease:"power3.out"},1.0);`);
  add(`tl.fromTo("#${p}-foot",{opacity:0},{opacity:1,duration:0.4,ease:"power1.out"},1.2);`);
  add(`tl.fromTo("#${p}-cta",{y:${H - G.cta.top + 20}},{y:0,duration:0.5,ease:"power3.out"},${r3(L(at("faca")) + 0.1)});`);
  add(`tl.fromTo("#${p}-cta-text",{opacity:0,y:14},{opacity:1,y:0,duration:0.4,ease:"power3.out"},${r3(L(at("simulacao")) - 0.15)});`);
  add(`tl.fromTo("#${p}-btn-pop",{opacity:0,scale:0.7},{opacity:1,scale:1,duration:0.45,ease:"back.out(1.5)"},${r3(L(at("gratuita")))});`);
  // "Toque no botão": a mão entra e toca
  const tq = L(at("toque"));
  const hb = pick({ x: 600, y: 1480 }, { x: 860, y: 1010 });
  const tgt = pick({ dx: -40, dy: -30 }, { dx: -60, dy: -30 });
  add(`tl.fromTo("#${p}-hand",{opacity:0,x:120,y:120},{opacity:1,x:${tgt.dx},y:${tgt.dy},duration:0.35,ease:"power3.out"},${r3(tq - 0.2)});`);
  add(`tl.to("#${p}-hand",{scale:0.86,duration:0.1,ease:"power2.in"},${r3(tq + 0.25)});`);
  add(`tl.to("#${p}-hand",{scale:1,duration:0.2,ease:"power2.out"},${r3(tq + 0.35)});`);
  add(`tl.to("#${p}-hand",{opacity:0,x:120,y:100,duration:0.35,ease:"power2.in"},${r3(tq + 0.75)});`);
  add(`tl.fromTo("#${p}-btn",{scale:1},{scale:0.95,duration:0.1,ease:"power2.in"},${r3(tq + 0.25)});`);
  add(`tl.to("#${p}-btn",{scale:1,duration:0.25,ease:"back.out(2)"},${r3(tq + 0.35)});`);
  [tq + 0.3, L(at("especialista"))].forEach((t, i) =>
    add(`tl.fromTo("#${p}-ring",{opacity:0.9,scale:1},{opacity:0,scale:1.3,duration:0.7,ease:"power2.out"${i ? ",immediateRender:false" : ""}},${r3(t)});`),
  );
  // pulsos até 1,5 s antes do fim; depois tudo parado
  for (let t = L(at("fale")) + 0.6, i = 0; t + 1.0 <= dur - 1.4; t += 1.0, i++) {
    const ir = ",immediateRender:false";
    add(`tl.fromTo("#${p}-btn",{scale:1},{scale:1.05,duration:0.5,ease:"sine.inOut"${ir}},${r3(t)});`);
    add(`tl.to("#${p}-btn",{scale:1,duration:0.5,ease:"sine.inOut"},${r3(t + 0.5)});`);
    add(`tl.fromTo("#${p}-arrow",{x:0},{x:5,duration:0.5,ease:"sine.inOut"${i ? ir : ""}},${r3(t)});`);
    add(`tl.to("#${p}-arrow",{x:0,duration:0.5,ease:"sine.inOut"},${r3(t + 0.5)});`);
  }
  scenes.push({ st, track: 7, ...scene(p, dur, css, body, a) });
}

// ═════════════ grão de filme por cima de tudo ═════════════
{
  const p = "gr";
  const NOISE =
    "data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E";
  const css = `#${p}-root{position:absolute;inset:0;width:${W}px;height:${H}px;overflow:hidden;pointer-events:none;}
#${p}-tex{position:absolute;left:-128px;top:-128px;width:${W + 256}px;height:${H + 256}px;background:url("${NOISE}") 0 0/256px 256px repeat;opacity:.07;mix-blend-mode:overlay;}
#${p}-vig{position:absolute;inset:0;background:radial-gradient(120% 85% at 50% 50%,rgba(0,0,0,0) 60%,rgba(0,0,0,.28) 100%);}`;
  const body = `<div id="${p}-vig"></div><div id="${p}-tex" data-layout-allow-overflow></div>`;
  const R = rng(99);
  // posições do grão sorteadas aqui (fixas), trocadas a cada 2 quadros
  const pos = [];
  for (let t = 0; t < D; t += 2 / FPS) pos.push(Math.round((R() - 0.5) * 200), Math.round((R() - 0.5) * 200));
  const lines = [
    `const P = [${pos.join(",")}];`,
    `for (let i = 0; i < P.length / 2; i++) tl.set("#${p}-tex", { x: P[2 * i], y: P[2 * i + 1] }, Math.round((i * 2 / ${FPS}) * 1000) / 1000);`,
  ];
  scenes.push({ st: 0, track: 9, ...scene(p, D, css, body, lines) });
}

// ═════════════ áudio ═════════════
const SFX_LEN = {
  whoosh: 1.0, tick: 0.14, counter: 2.48, impact: 3.0, shimmer: 3.0, pop: 0.5, chime: 2.2,
  stamp: 0.5, scramble: 2.9, scramble_short: 1.1, riser: 1.6, drop: 0.9,
};
const SFX = [
  ["impact", 0.02, 0.35],
  ["scramble", 0.0, 0.26],
  ["tick", r3(at("mes")), 0.3],
  ["whoosh", 3.05, 0.3],
  ["whoosh", r3(at("multiplica") - 0.25), 0.2],
  ["impact", r3(at("doze")), 0.45],
  ["stamp", r3(at("doze") - 0.02), 0.5],
  ["stamp", r3(at("doze") + 0.1), 0.3],
  ["tick", r3(at("justo")), 0.25],
  ["impact", r3(at("plano", 1) - 0.02), 0.4],
  ["whoosh", r3(at("gasto") + 0.15), 0.2],
  ["pop", r3(word("e", 2).start), 0.3],
  ["shimmer", r3(at("inteligente")), 0.25],
  ["whoosh", 12.0, 0.3],
  ["whoosh", r3(at("com", 0) - 0.3), 0.25],
  ["impact", r3(at("cnpj")), 0.35],
  ["drop", r3(at("cair") - 0.05), 0.4],
  ["whoosh", r3(at("mantendo") - 0.45), 0.25],
  ["shimmer", r3(at("qualidade")), 0.2],
  ["whoosh", 19.3, 0.3],
  ["pop", r3(at("porto") - 0.1), 0.45],
  ["chime", r3(at("porto")), 0.32],
  ["pop", r3(at("plano", 2)), 0.25],
  ["whoosh", r3(at("porto") + 0.25), 0.2],
  ["tick", r3(at("tres")), 0.2],
  ["tick", r3(at("tres") + 0.16), 0.16],
  ["tick", r3(at("tres") + 0.32), 0.14],
  ["counter", r3(at("novecentos")), 0.35],
  ["impact", r3(LOCK), 0.38],
  ["shimmer", r3(LOCK), 0.2],
  ["whoosh", 26.1, 0.3],
  ...[at("plano", 3), at("seguro"), at("servicos"), at("protecao")].flatMap((t) => [
    ["pop", r3(t - 0.12), 0.3],
    ["tick", r3(t), 0.16],
  ]),
  ["whoosh", 31.8, 0.3],
  ["tick", r3(at("atual")), 0.18],
  ["tick", r3(at("mercado")), 0.18],
  ["scramble_short", r3(at("numeros") - 0.1), 0.22],
  ["pop", r3(at("economizar") - 0.2), 0.35],
  ["chime", r3(at("economizar")), 0.22],
  ["whoosh", 37.6, 0.35],
  ["pop", r3(at("gratuita")), 0.4],
  ["tick", r3(at("toque") + 0.25), 0.32],
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
const sfxItems = SFX.map(([name, at, vol]) => ({ name, at: Math.max(0, at), vol, dur: SFX_LEN[name] }));
const sfxTracks = allocTracks(sfxItems, 30);
const voDur = r3(Number(readFileSync(join(ROOT, "assets/voice/vo.dur"), "utf8")));

// ═════════════ saída ═════════════
const OUT = ST ? ROOT : join(ROOT, "feed");
mkdirSync(join(OUT, "compositions"), { recursive: true });
for (const s of scenes) writeFileSync(join(OUT, `compositions/${s.id}.html`), s.html);
const mounts = scenes
  .map(
    (s) =>
      `<div id="el-${s.id}" class="scene" data-composition-id="${s.id}" data-composition-src="compositions/${s.id}.html" data-start="${s.st}" data-duration="${s.dur}" data-track-index="${s.track}"></div>`,
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
console.log(`${FMT} ${W}x${H}: ${D}s, ${scenes.length} composições, ${SFX.length} SFX`);
