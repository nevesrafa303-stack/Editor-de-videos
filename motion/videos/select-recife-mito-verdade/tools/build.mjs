#!/usr/bin/env node
// build.mjs — variação "Mito ou verdade" do motion da saída da Select de Recife, com locução
// (HeyGen), story 9:16 e feed 1:1.
//
//   node tools/build.mjs story   -> compositions/*.html + index.html
//   node tools/build.mjs feed    -> feed/compositions/*.html + feed/index.html
//
// Gancho "A Select saiu de Recife. Mito ou verdade?" e três rodadas de quiz: cada afirmação entra
// num cartão de citação, leva o carimbo MITO/VERDADE na palavra falada e a resposta aparece embaixo
// (hospitais; a rede muda de plano pra plano e o consultor compara; os dois hospitais). Cartão
// final com "A Select saiu. O Português fica. Troque de plano, não de hospital." e o botão do
// formulário. Só conteúdo do brief; sem logo, cores ou identidade da Select; sem preço. Tempos de
// assets/voice/vo.words.json (tools/voice.py) e da grade da trilha em tools/grid.json
// (tools/synth_audio.py).

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

// paleta própria (noite azul + dourado), sem relação com a identidade da Select
const NIGHT = "#060E1A";
const NAVY = "#0B1C30";
const GOLD = "#F5B83D";
const GOLD2 = "#FFD27A";
const CORAL = "#FF7A6B";
const INK = "#0B1626";
const SLATE = "#4F5F75";
const MUTED = "#B9C5D6";
const GREEN = "#1F9D5C";
const MITO = "#E0483B"; // carimbo MITO


// ───────────── locução ─────────────
const WORDS = JSON.parse(readFileSync(join(ROOT, "assets/voice/vo.words.json"), "utf8"));
const VO_END = WORDS[WORDS.length - 1].end;
const GRID = JSON.parse(readFileSync(join(ROOT, "tools/grid.json"), "utf8")); // tools/synth_audio.py
const D = GRID.total;
const norm = (s) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
function word(text, after = 0) {
  const w = WORDS.find((x) => norm(x.word) === norm(text) && x.start >= after - 0.001);
  if (!w) throw new Error(`palavra não encontrada: ${text} depois de ${after}`);
  return w;
}
const at = (t, after = 0) => word(t, after).start;
const end = (t, after = 0) => word(t, after).end;
// inícios de uma sequência de palavras faladas, a partir de `after`
function seq(text, after = 0) {
  const out = [];
  let t = after;
  for (const w of text.split(" ")) {
    t = at(w, t);
    out.push(t);
    t += 0.01;
  }
  return out;
}

const T = {};
T.de = at("de");
T.recife = at("recife");
T.mito0 = at("mito");
T.ou0 = at("ou", T.mito0);
T.verdade0 = at("verdade", T.ou0);
T.r1 = r3(at("se") - 0.22);
T.mito1 = at("mito", at("hospital"));
T.existem = at("existem");
T.real = at("real");
T.santa = at("santa");
T.outros = at("outros");
T.r2 = r3(at("todo") - 0.3);
T.mito2 = at("mito", at("todo"));
T.rede = at("rede", T.mito2);
T.muda = at("muda");
T.porIsso = at("por", T.muda);
T.compara = at("compara");
T.operadoras = at("operadoras");
T.e5 = at("e", T.operadoras);
T.encontra = at("encontra");
T.mantem = at("mantem");
T.r3 = r3(at("da", T.mantem) - 0.3);
T.verdade1 = at("verdade", T.r3);
T.cta = GRID.cta; // "A Select saiu." do fim (mesma âncora da trilha)
T.en = r3(T.cta - 0.3);
T.saiuEnd = end("saiu", T.cta);
T.oFica = at("o", T.saiuEnd);
T.ficaEnd = end("fica", T.oFica);
T.toca = at("toca");
T.aqui = at("aqui", T.toca);
T.preenche = at("preenche");
T.formulario = at("formulario");
T.drop = GRID.drop; // primeiro "Mito!" (drop da trilha)
T.fin = GRID.fin; // acorde final da trilha

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
const nw = (text) => text.split(" ").length;

const base = (p) => `
${FONTS}
#${p}-root{position:absolute;inset:0;width:${W}px;height:${H}px;overflow:hidden;font-family:"Poppins",Arial,sans-serif;color:#fff;}
.${p}-full{position:absolute;left:0;top:0;width:${W}px;height:${H}px;}
.d{font-family:"Mont",Arial,sans-serif;}
.w{display:inline-block;overflow:hidden;vertical-align:top;padding:0.1em 0.04em 0.06em;margin:-0.1em -0.04em -0.06em;}
.wi{display:inline-block;}
.ln{position:absolute;left:0;width:${W}px;text-align:center;white-space:nowrap;}
.gold{color:${GOLD};}
.coral{color:${CORAL};}
.sweep{position:absolute;left:0;top:0;width:100%;height:100%;background:linear-gradient(105deg,rgba(255,255,255,0) 35%,rgba(255,255,255,.5) 50%,rgba(255,255,255,0) 65%);mix-blend-mode:screen;}
.ph{position:absolute;overflow:hidden;background:${NAVY};}
.ph img{display:block;width:100%;height:100%;object-fit:cover;}
.legal{position:absolute;left:${pick(70, 90)}px;width:${W - pick(140, 180)}px;text-align:center;font-size:${pick(20, 16)}px;line-height:1.4;color:rgba(255,255,255,.86);}
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
  // palavras de uma linha subindo em sequência (tempo absoluto do vídeo)
  // palavras de uma linha subindo cada uma na hora em que é falada (tempos absolutos)
  const words = (p, times, dur = 0.4) =>
    times.forEach((t, i) =>
      add(`tl.fromTo("#${p}${i}",{yPercent:110,opacity:0},{yPercent:0,opacity:1,duration:${dur},ease:"power3.out"},${r3(Math.max(0, L(t) - 0.06))});`),
    );
  const shake = (sel, t, amp = 10) =>
    [1, -0.8, 0.5, -0.25, 0].forEach((q, i) => add(`tl.set("${sel}",{x:${r3(q * amp)},y:${r3(-q * amp * 0.6)}},${r3(t + i / FPS)});`));
  return { a, L, add, words, shake };
}

const ICONS = {
  check: `<path d="M12 25l8 8 16-18"/>`,
  x: `<path d="M16 16l16 16M32 16L16 32"/>`,
  pin: `<path d="M24 44s14-13.5 14-24a14 14 0 0 0-28 0c0 10.5 14 24 14 24z"/><circle cx="24" cy="20" r="5"/>`,
  heart: `<path d="M24 41S7 31 7 18.5A9.5 9.5 0 0 1 24 13a9.5 9.5 0 0 1 17 5.5C41 31 24 41 24 41z"/><path d="M24 20v10M19 25h10"/>`,
  hospital: `<path d="M9 42V12h30v30M4 42h40M20 42v-8h8v8M24 17v9M19.5 21.5h9"/>`,
  building: `<path d="M8 42V10l16-5v37M24 16l16 5v21M4 42h40M14 16h4M14 23h4M14 30h4M30 26h4M30 33h4"/>`,
  person: `<circle cx="24" cy="16" r="8"/><path d="M8 44c0-9 7-15 16-15s16 6 16 15"/>`,
  family: `<circle cx="17" cy="14" r="6"/><circle cx="33" cy="17" r="5"/><path d="M5 42c0-8 5-14 12-14s12 6 12 14M27 42c0-6 3-11 7-11s9 5 9 11"/>`,
  form: `<rect x="10" y="8" width="28" height="36" rx="4"/><path d="M18 8V5h12v3M16 20h16M16 28h16M16 36h10"/>`,
  down: `<path d="M12 10l12 12 12-12M12 24l12 12 12-12"/>`,
};
const icon = (name, size, { id = "", sw = 3.4, color = "#fff", fill = "none" } = {}) =>
  `<svg ${id ? `id="${id}" ` : ""}viewBox="0 0 48 48" width="${size}" height="${size}" fill="${fill}" stroke="${color}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`;

const IMG = {
  rhp: ["assets/img/real-hospital-portugues.jpg", "Real Hospital Português"],
  rhp2: ["assets/img/real-hospital-portugues-2.jpg", "Real Hospital Português"],
  sjf: ["assets/img/santa-joana-fachada.jpg", "Hospital Santa Joana"],
  sja: ["assets/img/santa-joana-aerea.jpg", "Hospital Santa Joana"],
};
const photo = (id, key, pos = "50% 50%") => `<img id="${id}" src="${IMG[key][0]}" alt="${IMG[key][1]}" style="object-position:${pos}" />`;

// observações obrigatórias (texto exato, só por escrito — ver CLAUDE.md da raiz)
const OBS = {
  rede: "Consulte a disponibilidade da rede hospitalar.",
  varia: "A rede credenciada pode variar conforme plano contratado.",
  img: "Imagem meramente ilustrativa.",
  eleg: "Consulte condições e elegibilidade.",
  analise: "Condições sujeitas à análise comercial.",
};

const scenes = [];

// ═════════════ fundo: noite azul, brilho coral na dor e dourado depois da virada ═════════════
{
  const p = "bg";
  const { a, add } = TL(0);
  const css =
    base(p) +
    `
#bg-base{background:radial-gradient(90% 60% at 50% 24%,#163352 0%,${NAVY} 48%,${NIGHT} 100%);}
.bg-gl{position:absolute;border-radius:50%;}
#bg-red{left:${pick(-300, -260)}px;top:${pick(1050, 520)}px;width:${pick(1300, 1000)}px;height:${pick(1300, 1000)}px;background:radial-gradient(closest-side,rgba(255,122,107,.2),rgba(255,122,107,0));}
#bg-gold{left:${pick(80, 140)}px;top:${pick(700, 300)}px;width:${pick(1300, 1000)}px;height:${pick(1300, 1000)}px;background:radial-gradient(closest-side,rgba(245,184,61,.24),rgba(245,184,61,0));opacity:0;}
#bg-dots{position:absolute;left:0;top:-72px;}
#bg-vig{background:radial-gradient(110% 75% at 50% 45%,rgba(0,0,0,0) 55%,rgba(2,6,14,.6) 100%);}
`;
  const body = `
  <div id="bg-base" class="${p}-full"></div>
  <div id="bg-red" class="bg-gl" data-layout-allow-overflow aria-hidden="true"></div>
  <div id="bg-gold" class="bg-gl" data-layout-allow-overflow aria-hidden="true"></div>
  <svg id="bg-dots" width="${W}" height="${H + 144}" aria-hidden="true" data-layout-allow-overflow>
    <defs><pattern id="bg-pt" width="36" height="36" patternUnits="userSpaceOnUse"><circle cx="18" cy="18" r="1.8" fill="rgba(255,255,255,.07)"/></pattern></defs>
    <rect width="${W}" height="${H + 144}" fill="url(#bg-pt)"/></svg>
  <div id="bg-vig" class="${p}-full"></div>`;
  add(`tl.fromTo("#bg-dots",{y:0},{y:72,duration:${D},ease:"none"},0);`);
  add(`tl.fromTo("#bg-red",{x:0,y:0,scale:1},{x:${pick(160, 120)},y:${pick(-180, -100)},scale:1.15,duration:${T.drop},ease:"sine.inOut"},0);`);
  add(`tl.to("#bg-red",{opacity:0,duration:0.8,ease:"power2.out"},${r3(T.drop - 0.2)});`);
  add(`tl.to("#bg-gold",{opacity:1,duration:0.6,ease:"power2.out"},${T.drop});`);
  add(`tl.fromTo("#bg-gold",{x:0,y:0,scale:1},{x:${pick(-160, -120)},y:${pick(160, 80)},scale:1.15,duration:${r3(D - T.drop)},ease:"sine.inOut"},${T.drop});`);
  scenes.push({ st: 0, track: 0, ...scene(p, D, css, body, a) });
}

// ═════════════ 1 · gancho: "A Select saiu de Recife. Mito ou verdade?" ═════════════
{
  const p = "s1";
  const st = 0;
  const dur = r3(T.r1 + 0.1);
  const { a, L, add, shake } = TL(st);
  const g = pick(
    { py: 290, pz: 56, pf: 38, ay: 384, as: 112, by: 505, bs: 150, uy: 676, uw: 560, qy: 820, qw: 410, qh: 170, qs: 62, os: 40 },
    { py: 36, pz: 46, pf: 32, ay: 100, as: 84, by: 190, bs: 112, uy: 318, uw: 420, qy: 430, qw: 380, qh: 140, qs: 52, os: 32 },
  );
  const gap = pick(110, 100);
  const qx = Math.round((W - (2 * g.qw + gap)) / 2);
  const css =
    base(p) +
    `
#s1-pin{position:absolute;left:0;width:${W}px;top:${g.py}px;display:flex;justify-content:center;align-items:center;gap:12px;font-weight:700;font-size:${g.pf}px;color:${MUTED};letter-spacing:.04em;}
#s1-a{top:${g.ay}px;font-weight:900;font-size:${g.as}px;line-height:1.05;letter-spacing:-.02em;}
#s1-b{top:${g.by}px;font-weight:900;font-size:${g.bs}px;line-height:1.05;letter-spacing:-.03em;}
#s1-u{position:absolute;left:${(W - g.uw) / 2}px;top:${g.uy}px;width:${g.uw}px;height:${pick(14, 10)}px;border-radius:8px;background:${CORAL};}
.s1-qw{position:absolute;top:${g.qy}px;width:${g.qw}px;height:${g.qh}px;}
.s1-q{position:absolute;inset:0;border-radius:${Math.round(g.qh * 0.28)}px;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:${g.qs}px;letter-spacing:.02em;color:#fff;box-shadow:0 24px 54px rgba(0,0,0,.45);border:${pick(6, 5)}px solid rgba(255,255,255,.9);}
#s1-m{background:${MITO};}
#s1-v{background:${GREEN};}
#s1-ou{position:absolute;left:${qx + g.qw}px;width:${gap}px;top:${g.qy}px;height:${g.qh}px;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:${g.os}px;color:${MUTED};}
`;
  const body = `
  <div id="s1-main" class="${p}-full">
    <div id="s1-pin">${icon("pin", g.pz, { color: CORAL, sw: 3.6 })}<span>Recife · PE</span></div>
    <div id="s1-a" class="ln d">${wspans("s1a", "A Select saiu")}</div>
    <div id="s1-b" class="ln d"><span id="s1-bi" style="display:inline-block">de Recife.</span></div>
    <div id="s1-u" aria-hidden="true"></div>
    <div class="s1-qw" id="s1-mw" style="left:${qx}px"><div class="s1-q d" id="s1-m">MITO</div></div>
    <div id="s1-ou" class="d">ou</div>
    <div class="s1-qw" id="s1-vw" style="left:${qx + g.qw + gap}px"><div class="s1-q d" id="s1-v">VERDADE?</div></div>
  </div>`;
  // "A Select saiu" já na tela no quadro 0; "de Recife." bate quando é dito
  add(`tl.fromTo("#s1-pin",{y:-12},{y:0,duration:0.45,ease:"power3.out"},0);`);
  add(`tl.fromTo("#s1-a",{scale:1.08},{scale:1,duration:0.5,ease:"power3.out"},0);`);
  add(`tl.fromTo("#s1-bi",{scale:1.9,opacity:0},{scale:1,opacity:1,duration:0.24,ease:"power4.out"},${L(T.de - 0.04)});`);
  shake("#s1-main", r3(L(T.de) + 0.2), pick(12, 9));
  add(`tl.fromTo("#s1-u",{scaleX:0},{scaleX:1,duration:0.4,ease:"power3.out",transformOrigin:"0% 50%"},${L(T.recife + 0.2)});`);
  // "Mito ou verdade?": os dois botões do quiz
  add(`tl.fromTo("#s1-mw",{scale:0,rotation:-8},{scale:1,rotation:-3,duration:0.35,ease:"back.out(2.4)"},${L(T.mito0 - 0.05)});`);
  add(`tl.fromTo("#s1-ou",{opacity:0},{opacity:1,duration:0.2},${L(T.ou0 - 0.03)});`);
  add(`tl.fromTo("#s1-vw",{scale:0,rotation:8},{scale:1,rotation:3,duration:0.35,ease:"back.out(2.4)"},${L(T.verdade0 - 0.05)});`);
  add(`tl.fromTo(["#s1-m","#s1-v"],{scale:1},{scale:1.06,duration:0.2,ease:"sine.inOut",yoyo:true,repeat:3},${L(T.verdade0 + 0.45)});`);
  add(`tl.to("#s1-main",{y:-90,opacity:0,duration:0.28,ease:"power3.in"},${r3(dur - 0.3)});`);
  scenes.push({ st, track: 1, ...scene(p, dur, css, body, a) });
}

// ═════════════ rodadas do quiz: afirmação, carimbo MITO/VERDADE e a resposta ═════════════
const RG = pick(
  { py: 246, ph: 60, pf: 28, cy: 350, cx: 70, cw: 940, cp: 50, qf: 60, qm: 130, ss: 96 },
  { py: 22, ph: 50, pf: 24, cy: 96, cx: 120, cw: 840, cp: 40, qf: 46, qm: 96, ss: 76 },
);
// texto da tela -> palavras faladas (sem pontuação, "Dá" vira "da")
const spoken = (text) =>
  text
    .split(" ")
    .map((w) => norm(w))
    .join(" ");
function roundScene({ p, n, st, dur, text, ch, verdict, tVerdict, answerCss, answerBody, answer }) {
  const { a, L, add, words, shake } = TL(st);
  const ok = verdict === "VERDADE";
  const css =
    base(p) +
    `
#${p}-pw{position:absolute;left:0;width:${W}px;top:${RG.py}px;text-align:center;}
#${p}-pill{display:inline-flex;align-items:center;height:${RG.ph}px;padding:0 ${Math.round(RG.ph * 0.5)}px;border-radius:${RG.ph}px;background:${GOLD};color:${INK};font-weight:900;font-size:${RG.pf}px;letter-spacing:.08em;}
#${p}-cw{position:absolute;left:${RG.cx}px;top:${RG.cy}px;width:${RG.cw}px;height:${ch}px;}
#${p}-card{position:absolute;inset:0;border-radius:${pick(36, 30)}px;background:#fff;color:${INK};box-shadow:0 30px 70px rgba(0,0,0,.5);}
#${p}-qm{position:absolute;left:${Math.round(RG.cp * 0.5)}px;top:${Math.round(RG.qm * 0.02)}px;font-family:Georgia,serif;font-weight:700;font-size:${RG.qm}px;line-height:1;color:#B07F22;}
#${p}-tx{position:absolute;left:${RG.cp + pick(40, 30)}px;right:${RG.cp}px;top:0;height:${ch}px;display:flex;align-items:center;justify-content:center;text-align:center;font-weight:800;font-size:${RG.qf}px;line-height:1.15;letter-spacing:-.01em;}
#${p}-stw{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;}
#${p}-st{padding:${pick(14, 10)}px ${pick(40, 30)}px;border-radius:${pick(24, 18)}px;background:${ok ? GREEN : MITO};color:#fff;font-weight:900;font-size:${RG.ss}px;letter-spacing:.04em;border:${pick(6, 5)}px solid #fff;box-shadow:0 18px 40px rgba(0,0,0,.45);white-space:nowrap;}
${answerCss}`;
  const body = `
  <div id="${p}-wrap" class="${p}-full">
    <div id="${p}-pw"><span id="${p}-pill" class="d">MITO OU VERDADE? · ${n}/3</span></div>
    <div id="${p}-cw" data-layout-allow-overlap>
      <div id="${p}-card"><div id="${p}-qm" aria-hidden="true">“</div>
        <div id="${p}-tx" class="d" data-layout-allow-occlusion><div>${wspans(`${p}q`, text).replace(/class="wi"/g, 'class="wi" data-layout-allow-occlusion')}</div></div></div>
      <div id="${p}-stw"><div id="${p}-st" class="d">${verdict}!</div></div>
    </div>
    ${answerBody}
  </div>`;
  add(`tl.fromTo("#${p}-pill",{scale:0.5,opacity:0},{scale:1,opacity:1,duration:0.3,ease:"back.out(2)"},0.05);`);
  add(`tl.fromTo("#${p}-cw",{y:${pick(120, 80)},opacity:0},{y:0,opacity:1,duration:0.4,ease:"power3.out"},0.08);`);
  words(`${p}q`, seq(spoken(text), st + 0.1));
  // o carimbo bate na palavra "Mito!"/"Verdade!"
  add(`tl.fromTo("#${p}-st",{scale:2.6,opacity:0,rotation:${ok ? 8 : -10}},{scale:1,opacity:1,rotation:${ok ? 6 : -8},duration:0.18,ease:"power4.in"},${L(tVerdict - 0.06)});`);
  shake(`#${p}-cw`, r3(L(tVerdict) + 0.12), pick(10, 8));
  if (!ok) add(`tl.to("#${p}-tx",{color:"${SLATE}",duration:0.3},${L(tVerdict + 0.1)});`);
  answer({ L, add, words });
  add(`tl.to("#${p}-wrap",{y:${-pick(140, 90)},opacity:0,duration:0.3,ease:"power3.in"},${r3(dur - 0.3)});`);
  return { a, css, body };
}

// ── rodada 1: "Se a Select saiu, eu perdi o meu hospital." → MITO → hospitais ──
{
  const p = "r1";
  const st = r3(T.r1 - 0.05);
  const dur = r3(T.r2 + 0.1 - st);
  const ch = pick(300, 220);
  const g = pick(
    { ey: 700, es: 38, cx: 70, cw: 940, chh: 160, cy: [760, 936, 1112], tw: 210, ns: 40, n3: 32, ck: 70, ly: 1300 },
    { ey: 336, es: 28, cx: 140, cw: 800, chh: 112, cy: [382, 504, 626], tw: 170, ns: 30, n3: 24, ck: 52, ly: 766 },
  );
  const pad = Math.round(g.chh * 0.09);
  const th = g.chh - 2 * pad;
  const nx = pad * 2 + g.tw + Math.round(g.chh * 0.08);
  const rows = [
    ["rhp", "80% 32%", "Real Hospital<br>Português"],
    ["sjf", "50% 62%", "Hospital<br>Santa Joana"],
    [null, "", "E outros hospitais<br>de referência do Recife"],
  ];
  const answerCss = `
#r1-e{position:absolute;left:0;width:${W}px;top:${g.ey}px;text-align:center;font-weight:600;font-size:${g.es}px;color:${MUTED};}
.r1-c{position:absolute;left:${g.cx}px;width:${g.cw}px;height:${g.chh}px;border-radius:${Math.round(g.chh * 0.18)}px;background:#fff;color:${INK};box-shadow:0 24px 54px rgba(0,0,0,.45);}
.r1-t{left:${pad}px;top:${pad}px;width:${g.tw}px;height:${th}px;border-radius:${Math.round(g.chh * 0.12)}px;}
.r1-ti{position:absolute;left:${pad}px;top:${pad}px;width:${g.tw}px;height:${th}px;border-radius:${Math.round(g.chh * 0.12)}px;background:linear-gradient(135deg,${GOLD2},${GOLD});display:flex;align-items:center;justify-content:center;}
.r1-n{position:absolute;left:${nx}px;top:0;height:${g.chh}px;display:flex;align-items:center;font-weight:800;font-size:${g.ns}px;line-height:1.12;letter-spacing:-.01em;}
.r1-n.sm{font-size:${g.n3}px;}
.r1-k{position:absolute;right:${pad + 4}px;top:${Math.round((g.chh - g.ck) / 2)}px;width:${g.ck}px;height:${g.ck}px;border-radius:50%;background:${GREEN};display:flex;align-items:center;justify-content:center;}
`;
  const answerBody = `
    <div id="r1-e">Existem planos com atendimento no:</div>
    ${rows
      .map(
        ([img, pos, name], i) => `<div class="r1-c" id="r1-c${i}" style="top:${g.cy[i]}px" data-layout-allow-overflow>${
          img ? `<div class="ph r1-t">${photo(`r1-i${i}`, img, pos)}</div>` : `<div class="r1-ti">${icon("hospital", Math.round(th * 0.6), { color: INK, sw: 3 })}</div>`
        }<div class="r1-n d${img ? "" : " sm"}">${name}</div><div class="r1-k" id="r1-k${i}">${icon("check", Math.round(g.ck * 0.62), { color: "#fff", sw: 5.5 })}</div></div>`,
      )
      .join("\n    ")}
    <div class="legal" id="r1-lg" style="top:${g.ly}px">${OBS.rede} ${OBS.varia} ${OBS.img}</div>`;
  const { a, css, body } = roundScene({
    p, n: 1, st, dur, ch, text: "Se a Select saiu, eu perdi o meu hospital.", verdict: "MITO", tVerdict: T.mito1, answerCss, answerBody,
    answer: ({ L, add }) => {
      add(`tl.fromTo("#r1-e",{opacity:0,y:16},{opacity:1,y:0,duration:0.35,ease:"power3.out"},${L(T.existem - 0.05)});`);
      [T.real - 0.15, T.santa - 0.15, T.outros - 0.15].forEach((t, i) => {
        add(`tl.fromTo("#r1-c${i}",{x:${i % 2 ? -1100 : 1100}},{x:0,duration:0.45,ease:"power4.out"},${L(t)});`);
        add(`tl.fromTo("#r1-k${i}",{scale:0},{scale:1,duration:0.3,ease:"back.out(2.6)"},${L(t + 0.35)});`);
      });
      add(`tl.fromTo("#r1-lg",{opacity:0},{opacity:1,duration:0.4},${L(T.outros + 0.5)});`);
    },
  });
  scenes.push({ st, track: 2, ...scene(p, dur, css, body, a) });
}

// ── rodada 2: "Todo plano tem os mesmos hospitais." → MITO → a rede muda; o consultor compara ──
{
  const p = "r2";
  const st = r3(T.r2 - 0.05);
  const dur = r3(T.r3 + 0.1 - st);
  const ch = pick(230, 170);
  const g = pick(
    { ly1: 640, l1s: 50, cw: 300, chh: 380, cg: 20, cy: 730, hh: 76, hf: 34, ry: [96, 220], rh: 108, nf: 21, mk: 46, mg: 140, e1: 1150, e1s: 42, e2: 1206, e2s: 46, lg: 1300 },
    { ly1: 290, l1s: 38, cw: 260, chh: 290, cg: 18, cy: 350, hh: 58, hf: 26, ry: [70, 162], rh: 82, nf: 16, mk: 36, mg: 110, e1: 664, e1s: 32, e2: 708, e2s: 36, lg: 780 },
  );
  const x0 = Math.round((W - (3 * g.cw + 2 * g.cg)) / 2);
  const ip = Math.round(g.cw * 0.06);
  const tw = g.cw - 2 * ip;
  const marks = [
    [true, false],
    [true, true],
    [false, true],
  ];
  const answerCss = `
.r2-l{top:${g.ly1}px;font-weight:800;font-size:${g.l1s}px;line-height:1.1;}
.r2-c{position:absolute;top:${g.cy}px;width:${g.cw}px;height:${g.chh}px;}
.r2-cb{position:absolute;inset:0;border-radius:${Math.round(g.cw * 0.09)}px;background:#fff;color:${INK};overflow:hidden;box-shadow:0 24px 54px rgba(0,0,0,.45);}
.r2-hd{position:absolute;left:0;top:0;width:100%;height:${g.hh}px;background:#E4EAF2;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:${g.hf}px;}
.r2-t{left:${ip}px;width:${tw}px;height:${g.rh}px;border-radius:${Math.round(g.rh * 0.14)}px;}
.r2-nm{position:absolute;left:${Math.round(ip * 0.6)}px;bottom:${Math.round(ip * 0.6)}px;padding:${Math.round(g.nf * 0.2)}px ${Math.round(g.nf * 0.5)}px;border-radius:${Math.round(g.nf * 0.4)}px;background:${INK};color:#fff;font-weight:700;font-size:${g.nf}px;white-space:nowrap;}
.r2-m{position:absolute;right:${Math.round(ip * 0.6)}px;top:${Math.round(ip * 0.6)}px;width:${g.mk}px;height:${g.mk}px;border-radius:50%;display:flex;align-items:center;justify-content:center;}
.r2-m.ok{background:${GREEN};}
.r2-m.no{background:#9AA6B6;}
#r2-ring{position:absolute;left:-${pick(10, 8)}px;top:-${pick(10, 8)}px;right:-${pick(10, 8)}px;bottom:-${pick(10, 8)}px;border-radius:${Math.round(g.cw * 0.11)}px;border:${pick(7, 6)}px solid ${GOLD};opacity:0;}
#r2-win{position:absolute;right:-${Math.round(g.mk * 0.5)}px;top:-${Math.round(g.mk * 0.5)}px;width:${Math.round(g.mk * 1.3)}px;height:${Math.round(g.mk * 1.3)}px;border-radius:50%;background:${GOLD};display:flex;align-items:center;justify-content:center;box-shadow:0 10px 24px rgba(0,0,0,.35);}
#r2-lp{position:absolute;left:${x0 + g.cw / 2 - g.mg / 2}px;top:${g.cy + Math.round(g.chh * 0.45) - g.mg / 2}px;width:${g.mg}px;height:${g.mg}px;}
#r2-e1{top:${g.e1}px;font-weight:700;font-size:${g.e1s}px;line-height:1.1;}
#r2-e2{top:${g.e2}px;font-weight:900;font-size:${g.e2s}px;line-height:1.1;letter-spacing:-.01em;}
`;
  const card = (i) => {
    const rows = [
      ["rhp2", "60% 40%", "Português"],
      ["sja", "45% 45%", "Santa Joana"],
    ];
    return `<div class="r2-c" id="r2-c${i}" style="left:${x0 + i * (g.cw + g.cg)}px"${i === 1 ? " data-layout-allow-overlap" : ""}>${
      i === 1 ? `<div id="r2-ring" aria-hidden="true"></div>` : ""
    }<div class="r2-cb"><div class="r2-hd d">Plano ${"ABC"[i]}</div>
      ${rows
        .map(
          ([img, pos, nm], r) =>
            `<div class="ph r2-t" style="top:${g.ry[r]}px;background:url('${IMG[img][0]}') ${pos}/cover no-repeat"><div class="r2-nm">${nm}</div><div class="r2-m ${marks[i][r] ? "ok" : "no"}" id="r2-m${i}${r}">${icon(
              marks[i][r] ? "check" : "x",
              Math.round(g.mk * 0.64),
              { color: "#fff", sw: 5.5 },
            )}</div></div>`,
        )
        .join("")}</div>${i === 1 ? `<div id="r2-win">${icon("check", Math.round(g.mk * 0.8), { color: INK, sw: 5.5 })}</div>` : ""}</div>`;
  };
  const answerBody = `
    <div id="r2-l1" class="ln d r2-l" data-layout-allow-overlap>${wspans("r2a", "A rede muda de um plano pro outro.")}</div>
    <div id="r2-l2" class="ln d r2-l" data-layout-allow-overlap>${wspans("r2b", "O consultor")} <span class="w"><span class="wi gold" id="r2b2">compara</span></span> ${wspans("r2c", "as operadoras")}</div>
    ${[0, 1, 2].map(card).join("\n    ")}
    <svg id="r2-lp" viewBox="0 0 100 100" width="${g.mg}" height="${g.mg}" aria-hidden="true" data-layout-allow-overlap>
      <circle cx="42" cy="42" r="28" fill="rgba(255,255,255,.16)" stroke="#fff" stroke-width="7"/>
      <path d="M63 63l22 22" stroke="#fff" stroke-width="11" stroke-linecap="round"/></svg>
    <div id="r2-e1" class="ln d">${wspans("r2d", "e encontra o plano que mantém")}</div>
    <div id="r2-e2" class="ln d gold">${wspans("r2e", "seus hospitais de confiança.")}</div>
    <div class="legal" id="r2-lg" style="top:${g.lg}px">${OBS.eleg} ${OBS.varia} ${OBS.img}</div>`;
  const step = g.cw + g.cg;
  const { a, css, body } = roundScene({
    p, n: 2, st, dur, ch, text: "Todo plano tem os mesmos hospitais.", verdict: "MITO", tVerdict: T.mito2, answerCss, answerBody,
    answer: ({ L, add, words }) => {
      // "A rede muda de um plano pro outro.": os três planos, cada um com uma rede diferente
      words("r2a", seq("a rede muda de um plano pro outro", T.mito2));
      [0, 1, 2].forEach((i) => add(`tl.fromTo("#r2-c${i}",{y:${pick(140, 100)},opacity:0},{y:0,opacity:1,duration:0.45,ease:"back.out(1.5)"},${L(T.rede + i * 0.12)});`));
      [0, 1, 2].forEach((i) => [0, 1].forEach((r) => add(`tl.fromTo("#r2-m${i}${r}",{scale:0},{scale:1,duration:0.26,ease:"back.out(2.6)"},${L(T.muda + 0.15 + i * 0.22 + r * 0.08)});`)));
      // "Por isso o consultor compara as operadoras e encontra o plano que mantém…"
      add(`tl.to("#r2-l1",{y:-30,opacity:0,duration:0.22,ease:"power3.in"},${L(T.porIsso - 0.1)});`);
      words("r2b", seq("o consultor", T.porIsso));
      add(`tl.fromTo("#r2b2",{yPercent:110,opacity:0},{yPercent:0,opacity:1,duration:0.4,ease:"power3.out"},${L(T.compara - 0.06)});`);
      words("r2c", seq("as operadoras", T.compara));
      add(`tl.fromTo("#r2-lp",{scale:0,x:0},{scale:1,x:0,duration:0.25,ease:"back.out(2)"},${L(T.compara - 0.05)});`);
      add(`tl.to("#r2-lp",{x:${step},duration:0.32,ease:"power2.inOut"},${L(T.operadoras - 0.05)});`);
      add(`tl.to("#r2-lp",{x:${2 * step},duration:0.32,ease:"power2.inOut"},${L(T.e5 - 0.05)});`);
      add(`tl.to("#r2-lp",{scale:0,duration:0.2,ease:"power2.in"},${L(T.encontra + 0.3)});`);
      add(`tl.to(["#r2-c0","#r2-c2"],{opacity:0.42,scale:0.95,duration:0.3,ease:"power2.out"},${L(T.mantem - 0.08)});`);
      add(`tl.to("#r2-c1",{y:${-pick(22, 16)},scale:1.05,duration:0.35,ease:"back.out(2)"},${L(T.mantem - 0.1)});`);
      add(`tl.to("#r2-ring",{opacity:1,duration:0.2},${L(T.mantem - 0.1)});`);
      add(`tl.fromTo("#r2-win",{scale:0,rotation:-30},{scale:1,rotation:0,duration:0.35,ease:"back.out(2.6)"},${L(T.mantem - 0.02)});`);
      words("r2d", seq("e encontra o plano que mantem", T.operadoras));
      words("r2e", seq("seus hospitais de confianca", T.mantem));
      add(`tl.fromTo("#r2-lg",{opacity:0},{opacity:1,duration:0.4},${L(T.compara + 0.3)});`);
    },
  });
  scenes.push({ st, track: 1, ...scene(p, dur, css, body, a) });
}

// ── rodada 3: "Dá pra trocar de plano sem trocar de hospital?" → VERDADE → os dois hospitais ──
{
  const p = "r3";
  const st = r3(T.r3 - 0.05);
  const dur = r3(T.en + 0.1 - st);
  const ch = pick(300, 220);
  const g = pick({ py: 710, pw: 460, phh: 440, pg: 20, nf: 24, ck: 64, ly: 1186 }, { py: 346, pw: 400, phh: 300, pg: 20, nf: 20, ck: 52, ly: 676 });
  const px0 = Math.round((W - (2 * g.pw + g.pg)) / 2);
  const answerCss = `
.r3-ph{top:${g.py}px;width:${g.pw}px;height:${g.phh}px;border-radius:${pick(28, 22)}px;box-shadow:0 22px 50px rgba(0,0,0,.5),0 0 0 ${pick(5, 4)}px rgba(255,210,122,.9);}
.r3-nm{position:absolute;left:${pick(14, 12)}px;bottom:${pick(14, 12)}px;padding:${pick(6, 5)}px ${pick(14, 12)}px;border-radius:${pick(12, 10)}px;background:${INK};color:#fff;font-weight:700;font-size:${g.nf}px;white-space:nowrap;}
.r3-k{position:absolute;right:${pick(14, 12)}px;top:${pick(14, 12)}px;width:${g.ck}px;height:${g.ck}px;border-radius:50%;background:${GREEN};display:flex;align-items:center;justify-content:center;box-shadow:0 8px 20px rgba(0,0,0,.35);}
`;
  const answerBody = `
    <div class="ph r3-ph" id="r3-p0" style="left:${px0}px">${photo("r3-i0", "rhp", "62% 45%")}<div class="r3-nm">Real Hospital Português</div><div class="r3-k" id="r3-k0">${icon("check", Math.round(g.ck * 0.62), { color: "#fff", sw: 5.5 })}</div></div>
    <div class="ph r3-ph" id="r3-p1" style="left:${px0 + g.pw + g.pg}px">${photo("r3-i1", "sjf", "50% 58%")}<div class="r3-nm">Hospital Santa Joana</div><div class="r3-k" id="r3-k1">${icon("check", Math.round(g.ck * 0.62), { color: "#fff", sw: 5.5 })}</div></div>
    <div class="legal" id="r3-lg" style="top:${g.ly}px">${OBS.rede} ${OBS.varia} ${OBS.img}</div>`;
  const { a, css, body } = roundScene({
    p, n: 3, st, dur, ch, text: "Dá pra trocar de plano sem trocar de hospital?", verdict: "VERDADE", tVerdict: T.verdade1, answerCss, answerBody,
    answer: ({ L, add }) => {
      [0, 1].forEach((i) => {
        add(`tl.fromTo("#r3-p${i}",{y:80,opacity:0},{y:0,opacity:1,duration:0.45,ease:"power3.out"},${L(T.verdade1 + 0.05 + i * 0.12)});`);
        add(`tl.fromTo("#r3-i${i}",{scale:1.12},{scale:1,duration:${r3(dur - L(T.verdade1))},ease:"none"},${L(T.verdade1)});`);
        add(`tl.fromTo("#r3-k${i}",{scale:0},{scale:1,duration:0.3,ease:"back.out(2.6)"},${L(T.verdade1 + 0.45 + i * 0.12)});`);
      });
      add(`tl.fromTo("#r3-lg",{opacity:0},{opacity:1,duration:0.4},${L(T.verdade1 + 0.5)});`);
    },
  });
  scenes.push({ st, track: 2, ...scene(p, dur, css, body, a) });
}

// ═════════════ 6 · cartão final: mensagem central + "Fale com um consultor" (formulário) ═════════════
const BTN = pick({ x: 90, y: 1040, w: 900, h: 150 }, { x: 140, y: 626, w: 800, h: 120 });
{
  const p = "en";
  const st = r3(T.en - 0.05);
  const dur = r3(D - st);
  const { a, L, add } = TL(st);
  const g = pick(
    { ay: 262, as: 58, by: 344, bs: 84, cy: [482, 590], cs: 96, py: 738, pw: 440, phh: 250, pg: 20, nf: 24, bt: 48, bsub: 28, ly: 1212, lf: 32, fy: 1282 },
    { ay: 30, as: 44, by: 92, bs: 62, cy: [190, 280], cs: 78, py: 396, pw: 390, phh: 190, pg: 20, nf: 20, bt: 40, bsub: 22, ly: 762, lf: 26, fy: 818 },
  );
  const px0 = Math.round((W - (2 * g.pw + g.pg)) / 2);
  const css =
    base(p) +
    `
#en-a{top:${g.ay}px;font-weight:800;font-size:${g.as}px;line-height:1.1;color:${MUTED};}
#en-ai{position:relative;display:inline-block;}
#en-x{position:absolute;left:-3%;top:50%;width:106%;height:${pick(8, 6)}px;margin-top:-${pick(2, 2)}px;border-radius:6px;background:${CORAL};}
#en-b{top:${g.by}px;font-weight:900;font-size:${g.bs}px;line-height:1.1;letter-spacing:-.02em;color:${GOLD};}
.en-c{font-weight:900;font-size:${g.cs}px;line-height:1.1;letter-spacing:-.03em;}
#en-hw{position:relative;display:inline-block;}
#en-ul{position:absolute;left:0;bottom:${pick(-4, -3)}px;width:100%;height:${pick(12, 9)}px;border-radius:8px;background:${GOLD};}
.en-ph{top:${g.py}px;width:${g.pw}px;height:${g.phh}px;border-radius:${pick(28, 22)}px;box-shadow:0 22px 50px rgba(0,0,0,.5);}
.en-nm{position:absolute;left:${pick(14, 12)}px;bottom:${pick(14, 12)}px;padding:${pick(6, 5)}px ${pick(14, 12)}px;border-radius:${pick(12, 10)}px;background:${INK};color:#fff;font-weight:700;font-size:${g.nf}px;white-space:nowrap;}
#en-bw{position:absolute;left:${BTN.x}px;top:${BTN.y}px;width:${BTN.w}px;height:${BTN.h}px;}
#en-ring{position:absolute;inset:0;border-radius:${BTN.h}px;border:5px solid rgba(255,210,122,.9);opacity:0;}
#en-btn{position:absolute;inset:0;border-radius:${BTN.h}px;background:linear-gradient(180deg,${GOLD2} 0%,${GOLD} 100%);color:${INK};display:flex;align-items:center;justify-content:center;gap:${pick(22, 18)}px;box-shadow:0 20px 50px rgba(245,184,61,.35),inset 0 2px 0 rgba(255,255,255,.5);overflow:hidden;}
#en-bt{display:flex;flex-direction:column;align-items:flex-start;}
#en-b1{font-weight:900;font-size:${g.bt}px;line-height:1.05;letter-spacing:-.01em;}
#en-b2{font-weight:700;font-size:${g.bsub}px;line-height:1.2;margin-top:${pick(4, 3)}px;}
#en-lb{position:absolute;left:0;width:${W}px;top:${g.ly}px;display:flex;justify-content:center;align-items:center;gap:${pick(16, 12)}px;font-weight:800;font-size:${g.lf}px;color:#fff;}
.en-ar{display:inline-flex;}
`;
  const cLines = `<div class="ln d en-c" style="top:${g.cy[0]}px"><span id="en-c0" style="display:inline-block">Troque de plano,</span></div>
    <div class="ln d en-c" style="top:${g.cy[1]}px"><span id="en-c1" style="display:inline-block">não de <span id="en-hw">hospital.<i id="en-ul" data-layout-allow-overlap aria-hidden="true"></i></span></span></div>`;
  const body = `
  <div id="en-wrap" class="${p}-full">
    <div id="en-a" class="ln d"><span id="en-ai" data-layout-allow-occlusion>A Select saiu.<i id="en-x" data-layout-allow-overlap aria-hidden="true"></i></span></div>
    <div id="en-b" class="ln d"><span id="en-bi" style="display:inline-block">O Português fica.</span></div>
    ${cLines}
    <div class="ph en-ph" id="en-p0" style="left:${px0}px">${photo("en-i0", "rhp", "62% 45%")}<div class="en-nm">Real Hospital Português</div></div>
    <div class="ph en-ph" id="en-p1" style="left:${px0 + g.pw + g.pg}px">${photo("en-i1", "sjf", "50% 58%")}<div class="en-nm">Hospital Santa Joana</div></div>
    <div id="en-bw"><div id="en-ring"></div><div id="en-btn">${icon("form", Math.round(g.bt * 1.35), { id: "en-ic", color: INK, sw: 3.4 })}<div id="en-bt"><span id="en-b1" class="d">Fale com um consultor</span><span id="en-b2">Preencha o formulário</span></div><div id="en-bsw" class="sweep" aria-hidden="true"></div></div></div>
    <div id="en-lb" class="d"><span class="en-ar" id="en-a0">${icon("down", Math.round(g.lf * 1.3), { color: GOLD, sw: 4.4 })}</span><span>Toque no botão abaixo</span><span class="en-ar" id="en-a1">${icon("down", Math.round(g.lf * 1.3), { color: GOLD, sw: 4.4 })}</span></div>
    <div class="legal" id="${p}-lg" style="top:${g.fy}px">${OBS.rede} ${OBS.varia} ${OBS.eleg} ${OBS.analise} ${OBS.img}</div>
  </div>`;
  add(`tl.fromTo("#en-ai",{y:20,opacity:0},{y:0,opacity:1,duration:0.3,ease:"power3.out"},0.05);`);
  // "A Select saiu. O Português fica." falados; "Troque de plano, não de hospital." entra logo depois
  add(`tl.fromTo("#en-x",{scaleX:0},{scaleX:1,duration:0.3,ease:"power3.inOut",transformOrigin:"0% 50%"},${r3(L(T.saiuEnd) + 0.04)});`);
  add(`tl.fromTo("#en-bi",{scale:1.4,opacity:0},{scale:1,opacity:1,duration:0.3,ease:"power4.out"},${r3(L(T.oFica) - 0.05)});`);
  add(`tl.fromTo("#en-c0",{y:50,opacity:0},{y:0,opacity:1,duration:0.4,ease:"power3.out"},${r3(L(T.ficaEnd) + 0.05)});`);
  add(`tl.fromTo("#en-c1",{y:50,opacity:0},{y:0,opacity:1,duration:0.4,ease:"power3.out"},${r3(L(T.ficaEnd) + 0.25)});`);
  add(`tl.fromTo("#en-ul",{scaleX:0},{scaleX:1,duration:0.4,ease:"power3.out",transformOrigin:"0% 50%"},${r3(L(T.ficaEnd) + 0.65)});`);
  const tp = r3(L(T.toca) - 0.3);
  [0, 1].forEach((i) => {
    add(`tl.fromTo("#en-p${i}",{y:60,opacity:0},{y:0,opacity:1,duration:0.45,ease:"power3.out"},${r3(tp + i * 0.12)});`);
    add(`tl.fromTo("#en-i${i}",{scale:1.12},{scale:1,duration:${r3(dur - tp)},ease:"none"},${tp});`);
  });
  // "Toca no botão aqui embaixo e preenche o formulário."
  add(`tl.fromTo("#en-bw",{scale:0.6,opacity:0},{scale:1,opacity:1,duration:0.45,ease:"back.out(1.8)"},${r3(L(T.toca) - 0.12)});`);
  add(`tl.fromTo("#${p}-lg",{opacity:0},{opacity:1,duration:0.5},${r3(L(T.toca) + 0.4)});`);
  const ar = r3(L(T.aqui) - 0.08);
  add(`tl.fromTo("#en-lb",{opacity:0,y:-14},{opacity:1,y:0,duration:0.35,ease:"power3.out"},${ar});`);
  const nb = Math.floor((dur - ar - 0.4) / 0.625);
  add(`tl.fromTo(["#en-a0","#en-a1"],{y:0},{y:${pick(14, 10)},duration:0.3125,ease:"sine.inOut",repeat:${nb * 2 - 1},yoyo:true},${ar});`);
  add(`tl.fromTo("#en-ic",{rotation:0},{rotation:12,duration:0.1,ease:"sine.inOut",repeat:5,yoyo:true},${r3(L(T.preenche))});`);
  add(`tl.fromTo("#en-b2",{scale:1.2},{scale:1,duration:0.35,ease:"back.out(2.4)",transformOrigin:"0% 50%",immediateRender:false},${r3(L(T.formulario) - 0.04)});`);
  [r3(L(T.formulario) + 0.5), r3(L(T.fin))].forEach((t, i) => {
    add(`tl.fromTo("#en-bsw",{xPercent:-100},{xPercent:100,duration:0.8,ease:"power2.inOut"${i ? ",immediateRender:false" : ""}},${t});`);
  });
  for (let t = L(T.formulario) + 1.2; t + 1.25 <= dur - 0.3; t += 1.25) {
    add(`tl.fromTo("#en-btn",{scale:1},{scale:1.04,duration:0.31,ease:"sine.out",immediateRender:false},${r3(t)});`);
    add(`tl.to("#en-btn",{scale:1,duration:0.5,ease:"sine.inOut"},${r3(t + 0.31)});`);
    add(`tl.fromTo("#en-ring",{opacity:0.7,scale:1},{opacity:0,scale:1.12,duration:0.9,ease:"power2.out",immediateRender:false},${r3(t)});`);
  }
  scenes.push({ st, track: 2, ...scene(p, dur, css, body, a) });
}

// ═════════════ clarões e grão ═════════════
{
  const p = "ui";
  const { a, add } = TL(0);
  const NOISE =
    "data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E";
  const css = `#ui-root{position:absolute;inset:0;width:${W}px;height:${H}px;overflow:hidden;pointer-events:none;}
#ui-fl{position:absolute;inset:0;background:radial-gradient(70% 50% at 50% 40%,rgba(255,236,200,.85),rgba(245,184,61,.3) 60%,rgba(245,184,61,0));opacity:0;}
#ui-tex{position:absolute;left:-128px;top:-128px;width:${W + 256}px;height:${H + 256}px;background:url("${NOISE}") 0 0/256px 256px repeat;opacity:.05;mix-blend-mode:overlay;}`;
  const body = `<div id="ui-fl" aria-hidden="true"></div><div id="ui-tex" data-layout-allow-overflow aria-hidden="true"></div>`;
  [
    [T.de, 0.22],
    [T.drop, 0.5],
    [T.en, 0.28],
  ].forEach(([t, o], i) => {
    add(`tl.fromTo("#ui-fl",{opacity:0},{opacity:${o},duration:0.08,ease:"power2.out"${i ? ",immediateRender:false" : ""}},${r3(t)});`);
    add(`tl.to("#ui-fl",{opacity:0,duration:0.45,ease:"power2.out"},${r3(t + 0.08)});`);
  });
  let s = 71;
  const R = () => ((s = (s * 1103515245 + 12345) % 2147483648) / 2147483648);
  const pos = [];
  for (let t = 0; t < D; t += 2 / FPS) pos.push(Math.round((R() - 0.5) * 200), Math.round((R() - 0.5) * 200));
  add(`const P = [${pos.join(",")}];`);
  add(`for (let i = 0; i < P.length / 2; i++) tl.set("#ui-tex", { x: P[2 * i], y: P[2 * i + 1] }, Math.round((i * 2 / ${FPS}) * 1000) / 1000);`);
  scenes.push({ st: 0, track: 9, ...scene(p, D, css, body, a) });
}

// ═════════════ áudio (locução + trilha + efeitos) ═════════════
const HITS = JSON.parse(readFileSync(join(ROOT, "assets/audio/sfx_hits.json"), "utf8"));
const SFX = [
  ["impact", T.de, 0.22],
  ["pop", T.mito0 - 0.05, 0.22],
  ["pop", T.verdade0 - 0.05, 0.22],
  ["whoosh", T.r1 - 0.05, 0.18],
  ["card", T.r1 + 0.05, 0.22],
  ["stamp", T.mito1 - 0.06, 0.42],
  ["impact", T.mito1, 0.26],
  ...[T.real, T.santa, T.outros].map((t) => ["card", t - 0.15, 0.24]),
  ...[T.real, T.santa, T.outros].map((t) => ["check", t + 0.2, 0.2]),
  ["whoosh", T.r2 - 0.05, 0.18],
  ["card", T.r2 + 0.05, 0.22],
  ["stamp", T.mito2 - 0.06, 0.42],
  ...[0, 1, 2].map((i) => ["pop", T.rede + i * 0.12, 0.18]),
  ...[0, 1, 2].map((i) => ["check", T.muda + 0.15 + i * 0.22, 0.14]),
  ["whoosh", T.compara - 0.05, 0.12],
  ["chime", T.mantem - 0.1, 0.22],
  ["whoosh", T.r3 - 0.05, 0.18],
  ["card", T.r3 + 0.05, 0.22],
  ["stamp", T.verdade1 - 0.06, 0.42],
  ["shimmer", T.verdade1 + 0.05, 0.22],
  ["check", T.verdade1 + 0.45, 0.2],
  ["whoosh", T.en - 0.05, 0.2],
  ["impact", T.en + 0.02, 0.2],
  ["whoosh", T.saiuEnd + 0.04, 0.12],
  ["shimmer", T.oFica, 0.2],
  ["pop", T.toca - 0.12, 0.18],
  ["pop", T.aqui - 0.08, 0.12],
  ["shimmer", T.formulario + 0.5, 0.16],
  ["shimmer", T.fin, 0.22],
];
const SFX_DUR = { impact: 1.2 };
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
  `<audio id="el-bgm" src="assets/audio/bgm.wav" data-start="0" data-duration="${D}" data-track-index="20" data-volume="0.75"></audio>`,
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
writeFileSync(join(OUT, "index.html"), html);
console.log(`${FMT} ${W}x${H}: ${D}s, ${scenes.length} composições, ${SFX.length} SFX`);
