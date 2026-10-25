#!/usr/bin/env node
// build.mjs — motion "A Select saiu. O Português fica. Troque de plano, não de hospital." (32,5 s,
// sem locução), story 9:16 e feed 1:1.
//
//   node tools/build.mjs story   -> compositions/*.html + index.html
//   node tools/build.mjs feed    -> feed/compositions/*.html + feed/index.html
//
// Roteiro do brief "A saída da Select de Recife": o que aconteceu, a dor (perder o hospital), a
// virada ("O Português fica."), a saída (trocar de plano sem trocar de hospital), o consultor que
// compara as operadoras e o cartão final com a chamada "Fale com um consultor" no botão do
// formulário do anúncio. Sem logo, cores ou identidade da Select; sem preço. As cenas caem na grade
// da trilha (96 BPM, compasso de 2,5 s, tools/synth_audio.py).

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

// ───────────── grade (igual à de tools/synth_audio.py) ─────────────
const BAR = 2.5;
const T = { s2: 2 * BAR, s3: 4 * BAR, drop: 5 * BAR, s4: 6 * BAR, s5: 8 * BAR, en: 10 * BAR, fin: 12 * BAR };
const D = 13 * BAR; // 32,5 s

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
  const words = (p, n, t0, step = 0.09, dur = 0.42) => {
    for (let i = 0; i < n; i++)
      add(`tl.fromTo("#${p}${i}",{yPercent:110,opacity:0},{yPercent:0,opacity:1,duration:${dur},ease:"power3.out"},${r3(Math.max(0, L(t0) + i * step))});`);
  };
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

// ═════════════ 1 · gancho: "A Select saiu de Recife." ═════════════
{
  const p = "s1";
  const st = 0;
  const dur = r3(T.s2 + 0.1);
  const { a, L, add, words, shake } = TL(st);
  const g = pick(
    { py: 290, pz: 56, pf: 38, ay: 384, as: 112, by: 505, bs: 150, uy: 676, uw: 560, cy: 782, cw: 760, ty: 1262, tsz: 62, qy: 790, qs: 210 },
    { py: 36, pz: 46, pf: 32, ay: 100, as: 84, by: 190, bs: 112, uy: 318, uw: 420, cy: 362, cw: 600, ty: 718, tsz: 48, qy: 420, qs: 170 },
  );
  const k = g.cw / 760;
  const q = (v) => Math.round(v * k);
  const ch = q(430);
  const css =
    base(p) +
    `
#s1-pin{position:absolute;left:0;width:${W}px;top:${g.py}px;display:flex;justify-content:center;align-items:center;gap:12px;font-weight:700;font-size:${g.pf}px;color:${MUTED};letter-spacing:.04em;}
#s1-a{top:${g.ay}px;font-weight:900;font-size:${g.as}px;line-height:1.05;letter-spacing:-.02em;}
#s1-b{top:${g.by}px;font-weight:900;font-size:${g.bs}px;line-height:1.05;letter-spacing:-.03em;}
#s1-u{position:absolute;left:${(W - g.uw) / 2}px;top:${g.uy}px;width:${g.uw}px;height:${pick(14, 10)}px;border-radius:8px;background:${CORAL};}
#s1-cw{position:absolute;left:${(W - g.cw) / 2}px;top:${g.cy}px;width:${g.cw}px;height:${ch}px;}
#s1-card{position:absolute;inset:0;border-radius:${q(36)}px;background:linear-gradient(135deg,#FFFFFF 0%,#E3EAF4 100%);color:${INK};box-shadow:0 30px 70px rgba(0,0,0,.5);overflow:hidden;}
#s1-band{position:absolute;left:0;top:0;width:100%;height:${q(8)}px;background:${GOLD};}
#s1-ic{position:absolute;left:${q(40)}px;top:${q(40)}px;width:${q(88)}px;height:${q(88)}px;border-radius:50%;background:${GOLD};display:flex;align-items:center;justify-content:center;}
#s1-t1{position:absolute;left:${q(150)}px;top:${q(48)}px;font-weight:900;font-size:${q(36)}px;letter-spacing:.06em;}
#s1-t2{position:absolute;left:${q(150)}px;top:${q(94)}px;font-weight:500;font-size:${q(26)}px;color:${SLATE};}
#s1-chip{position:absolute;left:${q(40)}px;top:${q(176)}px;width:${q(100)}px;height:${q(76)}px;border-radius:${q(14)}px;background:linear-gradient(135deg,#F7DB98,#D9A93E);}
.s1-lb{position:absolute;left:${q(40)}px;font-weight:600;font-size:${q(22)}px;color:${SLATE};}
.s1-bar{position:absolute;left:${q(40)}px;height:${q(22)}px;border-radius:${q(11)}px;background:#C7D1DE;}
#s1-st{position:absolute;left:${q(150)}px;top:${q(150)}px;padding:${q(10)}px ${q(26)}px;border:${q(8)}px solid ${CORAL};border-radius:${q(18)}px;color:${CORAL};font-weight:900;font-size:${q(66)}px;letter-spacing:.04em;background:rgba(255,255,255,.92);white-space:nowrap;}
#s1-tx{position:absolute;left:0;width:${W}px;top:${g.ty}px;text-align:center;font-weight:800;font-size:${g.tsz}px;line-height:1.18;}
#s1-q{top:${g.qy}px;font-weight:900;font-size:${g.qs}px;line-height:1;letter-spacing:-.03em;opacity:0;}
`;
  const body = `
  <div id="s1-main" class="${p}-full">
    <div id="s1-pin">${icon("pin", g.pz, { color: CORAL, sw: 3.6 })}<span>Recife · PE</span></div>
    <div id="s1-a" class="ln d">${wspans("s1a", "A Select saiu")}</div>
    <div id="s1-b" class="ln d"><span id="s1-bi" style="display:inline-block">de Recife.</span></div>
    <div id="s1-u" aria-hidden="true"></div>
    <div id="s1-cw" data-layout-allow-overlap>
      <div id="s1-card">
        <div id="s1-band"></div>
        <div id="s1-ic">${icon("heart", q(56), { color: INK, sw: 3.6 })}</div>
        <div id="s1-t1" class="d">PLANO DE SAÚDE</div>
        <div id="s1-t2">Carteirinha</div>
        <div id="s1-chip"></div>
        <div class="s1-lb" style="top:${q(278)}px">Titular</div>
        <div class="s1-bar" style="top:${q(316)}px;width:${q(380)}px"></div>
        <div class="s1-bar" style="top:${q(356)}px;width:${q(250)}px"></div>
      </div>
      <div id="s1-st" class="d" data-layout-allow-overlap>SEM PLANO</div>
    </div>
    <div id="s1-tx" class="d">${wspans("s1x", "Famílias e empresas")}<br>${wspans("s1y", "perderam o plano.")}</div>
  </div>
  <div id="s1-q" class="ln d">E agora?</div>`;
  // primeira linha já na tela no quadro 0 (miniatura e autoplay), "de Recife." bate logo depois
  add(`tl.fromTo("#s1-pin",{y:-12},{y:0,duration:0.45,ease:"power3.out"},0);`);
  add(`tl.fromTo("#s1-a",{scale:1.08},{scale:1,duration:0.5,ease:"power3.out"},0);`);
  add(`tl.fromTo("#s1-bi",{scale:1.9,opacity:0},{scale:1,opacity:1,duration:0.24,ease:"power4.out"},0.28);`);
  shake("#s1-main", 0.52, pick(12, 9));
  add(`tl.fromTo("#s1-u",{scaleX:0},{scaleX:1,duration:0.35,ease:"power3.out",transformOrigin:"0% 50%"},0.55);`);
  // a carteirinha chega e leva o carimbo
  add(`tl.fromTo("#s1-cw",{y:${pick(240, 180)},opacity:0,rotation:-4},{y:0,opacity:1,rotation:0,duration:0.5,ease:"power3.out"},1.2);`);
  add(`tl.fromTo("#s1-st",{scale:2.4,opacity:0,rotation:-12},{scale:1,opacity:1,rotation:-12,duration:0.18,ease:"power4.in"},2.0);`);
  add(`tl.fromTo("#s1-card",{filter:"grayscale(0) brightness(1)"},{filter:"grayscale(1) brightness(0.72)",duration:0.3,ease:"power2.out"},2.18);`);
  shake("#s1-cw", 2.18, pick(10, 8));
  words("s1x", 3, 2.35, 0.09, 0.36);
  words("s1y", 3, 2.62, 0.09, 0.36);
  // "E agora?"
  add(`tl.to("#s1-main",{y:-110,opacity:0,duration:0.28,ease:"power3.in"},3.9);`);
  add(`tl.fromTo("#s1-q",{scale:1.7,opacity:0},{scale:1,opacity:1,duration:0.3,ease:"power4.out"},4.12);`);
  add(`tl.to("#s1-q",{opacity:0,duration:0.2},${r3(dur - 0.22)});`);
  scenes.push({ st, track: 1, ...scene(p, dur, css, body, a) });
}

// ═════════════ 2 · dor: "Mais do que perder o plano, o medo é perder o hospital." ═════════════
{
  const p = "s2";
  const st = r3(T.s2 - 0.05);
  const dur = r3(T.s3 + 0.1 - st);
  const { a, L, add, words } = TL(st);
  const g = pick(
    { a1: 360, a2: 450, as: 76, b1: 600, b2: 690, bs: 140, c: [360, 450, 540], tx: 350, ty: 720, tw: 380, ly: 1440, pos: "50% 45%" },
    { a1: 110, a2: 180, as: 60, b1: 290, b2: 362, bs: 110, c: [110, 180, 250], tx: 390, ty: 370, tw: 300, ly: 1000, pos: "50% 38%" },
  );
  const k = g.tw / 380;
  const q = (v) => Math.round(v * k);
  const LH = q(240);
  const css =
    base(p) +
    `
#s2-ph{left:0;top:0;width:${W}px;height:${H}px;}
#s2-scr{background:linear-gradient(180deg,rgba(6,14,26,.9) 0%,rgba(6,14,26,.62) 40%,rgba(6,14,26,.55) 62%,rgba(6,14,26,.92) 100%);}
.s2-l{font-weight:800;font-size:${g.as}px;line-height:1.1;}
#s2-hb{top:${g.b2}px;font-weight:900;font-size:${g.bs}px;line-height:1;letter-spacing:-.03em;}
#s2-tile{position:absolute;left:${g.tx}px;top:${g.ty}px;width:${g.tw}px;height:${q(420)}px;border-radius:${q(34)}px;background:#fff;color:${INK};overflow:hidden;box-shadow:0 30px 70px rgba(0,0,0,.55);}
#s2-th{position:absolute;left:0;top:0;width:100%;height:${q(96)}px;background:#C8382B;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:${q(30)}px;letter-spacing:.06em;}
#s2-nw{position:absolute;left:0;width:100%;top:${q(130)}px;height:${LH}px;overflow:hidden;text-align:center;}
#s2-nc{position:absolute;left:0;width:100%;top:0;font-weight:900;font-size:${q(220)}px;line-height:${LH}px;letter-spacing:-.04em;}
#s2-nl{position:absolute;left:0;width:100%;top:${q(362)}px;text-align:center;font-weight:600;font-size:${q(28)}px;color:${SLATE};}
`;
  const body = `
  <div id="s2-wrap" class="${p}-full">
    <div class="ph" id="s2-ph">${photo("s2-img", "sjf", g.pos)}</div>
    <div id="s2-scr" class="${p}-full"></div>
    <div id="s2-A" class="${p}-full">
      <div class="ln d s2-l" style="top:${g.a1}px">${wspans("s2a", "Mais do que")}</div>
      <div class="ln d s2-l" style="top:${g.a2}px">${wspans("s2b", "perder o plano,")}</div>
      <div class="ln d s2-l" style="top:${g.b1}px">${wspans("s2c", "o medo é perder")}</div>
      <div id="s2-hb" class="ln d coral"><span id="s2-hi" style="display:inline-block">o hospital.</span></div>
    </div>
    <div id="s2-B" class="${p}-full">
      <div class="ln d s2-l" style="top:${g.c[0]}px">${wspans("s2d", "Cada dia sem plano")}</div>
      <div class="ln d s2-l" style="top:${g.c[1]}px">${wspans("s2e", "é um dia de")} <span class="w"><span class="wi coral" id="s2e4">risco</span></span></div>
      <div class="ln d s2-l" style="top:${g.c[2]}px">${wspans("s2f", "para a família.")}</div>
      <div id="s2-tile"><div id="s2-th" class="d">DIAS SEM PLANO</div>
        <div id="s2-nw"><div id="s2-nc" class="d" data-layout-allow-overflow data-layout-allow-occlusion>${[1, 2, 3, 4, 5, 6, 7, 8, 9].join("<br>")}</div></div>
        <div id="s2-nl">e contando…</div></div>
    </div>
    <div class="legal" id="${p}-lg" style="top:${g.ly}px">${OBS.img} ${OBS.varia}</div>
  </div>`;
  add(`tl.fromTo("#s2-ph",{opacity:0},{opacity:1,duration:0.35,ease:"power2.out"},0);`);
  add(`tl.fromTo("#s2-lg",{opacity:0},{opacity:1,duration:0.4},0.3);`);
  add(`tl.fromTo("#s2-img",{scale:1.16},{scale:1,duration:${dur},ease:"none"},0);`);
  words("s2a", 3, 5.12, 0.1);
  words("s2b", 3, 5.4, 0.1);
  words("s2c", 4, 5.95, 0.1);
  add(`tl.fromTo("#s2-hi",{scale:1.7,opacity:0},{scale:1,opacity:1,duration:0.28,ease:"power4.out"},${L(6.45)});`);
  add(`tl.to("#s2-A",{y:-70,opacity:0,duration:0.26,ease:"power3.in"},${L(7.38)});`);
  words("s2d", 4, 7.6, 0.09);
  words("s2e", 4, 7.95, 0.09);
  add(`tl.fromTo("#s2e4",{yPercent:110,opacity:0},{yPercent:0,opacity:1,duration:0.42,ease:"power3.out"},${L(8.31)});`);
  words("s2f", 3, 8.42, 0.09);
  add(`tl.fromTo("#s2-tile",{scale:0.6,opacity:0},{scale:1,opacity:1,duration:0.4,ease:"back.out(1.8)"},${L(7.95)});`);
  // contador de dias: um passo por meia batida
  for (let i = 1; i < 9; i++) add(`tl.to("#s2-nc",{y:${-i * LH},duration:0.1,ease:"power2.out"},${r3(L(8.25) + (i - 1) * 0.18)});`);
  add(`tl.fromTo("#s2-nl",{opacity:0},{opacity:1,duration:0.3},${L(8.6)});`);
  add(`tl.to("#s2-wrap",{opacity:0,duration:0.3,ease:"power2.in"},${r3(dur - 0.3)});`);
  scenes.push({ st, track: 2, ...scene(p, dur, css, body, a) });
}

// ═════════════ 3 · virada: "A Select saiu." → "O Português fica." ═════════════
{
  const p = "s3";
  const st = r3(T.s3 - 0.05);
  const dur = r3(T.s4 + 0.1 - st);
  const { a, L, add, words, shake } = TL(st);
  const g = pick(
    { ay: 296, as: 96, by: 430, bs: 124, cy: 566, pw: 900, py: 740, ly: 1424 },
    { ay: 60, as: 62, by: 160, bs: 84, cy: 0, pw: 760, py: 290, ly: 868 },
  );
  const ph = Math.round((g.pw * 783) / 1080);
  const css =
    base(p) +
    `
#s3-a{top:${g.ay}px;font-weight:900;font-size:${g.as}px;line-height:1.05;letter-spacing:-.02em;}
#s3-ai{position:relative;display:inline-block;}
#s3-x{position:absolute;left:-3%;top:50%;width:106%;height:${pick(12, 9)}px;margin-top:-${pick(4, 3)}px;border-radius:8px;background:${CORAL};}
.s3-b{font-weight:900;font-size:${g.bs}px;line-height:1.05;letter-spacing:-.03em;}
#s3-pw{position:absolute;left:${(W - g.pw) / 2}px;top:${g.py}px;width:${g.pw}px;height:${ph}px;}
#s3-ph{left:0;top:0;width:${g.pw}px;height:${ph}px;border-radius:${pick(34, 28)}px;box-shadow:0 34px 80px rgba(0,0,0,.55),0 0 0 ${pick(6, 5)}px rgba(255,210,122,.9);}
`;
  const bLine = ST
    ? `<div class="ln d s3-b" style="top:${g.by}px"><span id="s3-b0" style="display:inline-block">O Português</span></div>
    <div class="ln d s3-b gold" style="top:${g.cy}px"><span id="s3-b1" style="display:inline-block">fica.</span></div>`
    : `<div class="ln d s3-b" style="top:${g.by}px"><span id="s3-b0" style="display:inline-block">O Português</span> <span id="s3-b1" class="gold" style="display:inline-block">fica.</span></div>`;
  const body = `
  <div id="s3-wrap" class="${p}-full">
    <div id="s3-a" class="ln d"><span id="s3-ai" data-layout-allow-occlusion>${wspans("s3a", "A Select saiu.")}<i id="s3-x" data-layout-allow-overlap aria-hidden="true"></i></span></div>
    ${bLine}
    <div id="s3-pw"><div class="ph" id="s3-ph">${photo("s3-img", "rhp", "60% 50%")}<div id="s3-sw" class="sweep" aria-hidden="true"></div></div></div>
    <div class="legal" id="${p}-lg" style="top:${g.ly}px">${OBS.rede} ${OBS.varia} ${OBS.img}</div>
  </div>`;
  words("s3a", 3, 10.1, 0.12, 0.36);
  add(`tl.fromTo("#s3-x",{scaleX:0},{scaleX:1,duration:0.32,ease:"power3.inOut",transformOrigin:"0% 50%"},${L(11.45)});`);
  add(`tl.to("#s3-ai",{opacity:0.42,duration:0.3},${L(11.62)});`);
  // drop: "O Português fica." e a foto do hospital
  add(`tl.fromTo("#s3-b0",{scale:1.6,opacity:0},{scale:1,opacity:1,duration:0.28,ease:"power4.out"},${L(T.drop - 0.04)});`);
  add(`tl.fromTo("#s3-b1",{scale:1.8,opacity:0},{scale:1,opacity:1,duration:0.28,ease:"power4.out"},${L(T.drop + 0.16)});`);
  shake("#s3-wrap", r3(L(T.drop) + 0.02), pick(10, 8));
  add(`tl.fromTo("#s3-pw",{y:${pick(260, 200)},opacity:0},{y:0,opacity:1,duration:0.55,ease:"power3.out"},${L(T.drop + 0.06)});`);
  add(`tl.fromTo("#s3-img",{scale:1.14},{scale:1,duration:${r3(dur - L(T.drop))},ease:"none"},${L(T.drop)});`);
  add(`tl.fromTo("#s3-sw",{xPercent:-100},{xPercent:100,duration:0.9,ease:"power2.inOut"},${L(T.drop + 0.5)});`);
  add(`tl.fromTo("#s3-lg",{opacity:0},{opacity:1,duration:0.4},${L(T.drop + 0.4)});`);
  add(`tl.to("#s3-wrap",{y:${-pick(140, 90)},opacity:0,duration:0.3,ease:"power3.in"},${r3(dur - 0.3)});`);
  scenes.push({ st, track: 1, ...scene(p, dur, css, body, a) });
}

// ═════════════ 4 · saída: "Trocar de plano não significa trocar de hospital." ═════════════
{
  const p = "s4";
  const st = r3(T.s4 - 0.05);
  const dur = r3(T.s5 + 0.1 - st);
  const { a, L, add, words } = TL(st);
  const g = pick(
    { h: [270, 368, 466], hs: 84, ey: 606, es: 40, cx: 70, cw: 940, chh: 200, cy: [680, 900, 1120], tw: 260, ns: 44, n3: 34, ck: 80, ly: 1352 },
    { h: [40, 108, 176], hs: 58, ey: 262, es: 30, cx: 140, cw: 800, chh: 150, cy: [318, 486, 654], tw: 200, ns: 34, n3: 27, ck: 60, ly: 830 },
  );
  const pad = Math.round(g.chh * 0.08);
  const th = g.chh - 2 * pad;
  const nx = pad * 2 + g.tw + Math.round(g.chh * 0.08);
  const cards = [
    ["rhp", "80% 32%", "Real Hospital<br>Português"],
    ["sjf", "50% 62%", "Hospital<br>Santa Joana"],
    [null, "", "E outros hospitais<br>de referência do Recife"],
  ];
  const css =
    base(p) +
    `
.s4-h{font-weight:900;font-size:${g.hs}px;line-height:1.1;letter-spacing:-.02em;}
#s4-e{position:absolute;left:0;width:${W}px;top:${g.ey}px;text-align:center;font-weight:600;font-size:${g.es}px;color:${MUTED};}
.s4-c{position:absolute;left:${g.cx}px;width:${g.cw}px;height:${g.chh}px;border-radius:${Math.round(g.chh * 0.16)}px;background:#fff;color:${INK};box-shadow:0 24px 54px rgba(0,0,0,.45);}
.s4-t{left:${pad}px;top:${pad}px;width:${g.tw}px;height:${th}px;border-radius:${Math.round(g.chh * 0.1)}px;}
.s4-ti{position:absolute;left:${pad}px;top:${pad}px;width:${g.tw}px;height:${th}px;border-radius:${Math.round(g.chh * 0.1)}px;background:linear-gradient(135deg,${GOLD2},${GOLD});display:flex;align-items:center;justify-content:center;}
.s4-n{position:absolute;left:${nx}px;top:0;height:${g.chh}px;display:flex;align-items:center;font-weight:800;font-size:${g.ns}px;line-height:1.12;letter-spacing:-.01em;}
.s4-n.sm{font-size:${g.n3}px;}
.s4-k{position:absolute;right:${pad + 4}px;top:${Math.round((g.chh - g.ck) / 2)}px;width:${g.ck}px;height:${g.ck}px;border-radius:50%;background:${GREEN};display:flex;align-items:center;justify-content:center;}
`;
  const body = `
  <div id="s4-wrap" class="${p}-full">
    <div class="ln d s4-h" style="top:${g.h[0]}px">${wspans("s4a", "Trocar de plano")}</div>
    <div class="ln d s4-h" style="top:${g.h[1]}px">${wspans("s4b", "não significa")}</div>
    <div class="ln d s4-h" style="top:${g.h[2]}px">${wspans("s4c", "trocar de hospital.", "gold")}</div>
    <div id="s4-e">Existem planos com atendimento no:</div>
    ${cards
      .map(
        ([img, pos, name], i) => `<div class="s4-c" id="s4-c${i}" style="top:${g.cy[i]}px">${
          img ? `<div class="ph s4-t">${photo(`s4-i${i}`, img, pos)}</div>` : `<div class="s4-ti">${icon("hospital", Math.round(th * 0.6), { color: INK, sw: 3 })}</div>`
        }<div class="s4-n d${img ? "" : " sm"}">${name}</div><div class="s4-k" id="s4-k${i}">${icon("check", Math.round(g.ck * 0.62), { color: "#fff", sw: 5.5 })}</div></div>`,
      )
      .join("\n    ")}
    <div class="legal" id="${p}-lg" style="top:${g.ly}px">${OBS.rede} ${OBS.varia} ${OBS.img}</div>
  </div>`;
  words("s4a", 3, 15.08, 0.08);
  words("s4b", 2, 15.34, 0.08);
  words("s4c", 3, 15.55, 0.09);
  add(`tl.fromTo("#s4-e",{opacity:0,y:16},{opacity:1,y:0,duration:0.35,ease:"power3.out"},${L(16.05)});`);
  [16.3, 16.6, 16.9].forEach((t, i) => {
    add(`tl.fromTo("#s4-c${i}",{x:${i % 2 ? -1100 : 1100}},{x:0,duration:0.45,ease:"power4.out"},${L(t)});`);
    add(`tl.fromTo("#s4-k${i}",{scale:0},{scale:1,duration:0.3,ease:"back.out(2.6)"},${L(t + 0.35)});`);
  });
  add(`tl.fromTo("#${p}-lg",{opacity:0},{opacity:1,duration:0.4},${L(17.35)});`);
  add(`tl.to("#s4-wrap",{y:${-pick(140, 90)},opacity:0,duration:0.3,ease:"power3.in"},${r3(dur - 0.3)});`);
  scenes.push({ st, track: 2, ...scene(p, dur, css, body, a) });
}

// ═════════════ 5 · consultor: compara as operadoras e encontra o plano dos seus hospitais ═════════════
{
  const p = "s5";
  const st = r3(T.s5 - 0.05);
  const dur = r3(T.en + 0.1 - st);
  const { a, L, add, words } = TL(st);
  const g = pick(
    { h: [270, 362], hs: 80, cw: 300, chh: 430, cg: 20, cy: 522, hh: 84, hf: 38, ry: [104, 240], rh: 120, nf: 22, mk: 50, mg: 150, e1: 990, e1s: 48, e2: 1060, e2s: 50, fy: 1176, fs: 40, py: 1240, pw: 290, pph: 90, pf: 36, ly: 1380 },
    { h: [22, 92], hs: 58, cw: 280, chh: 320, cg: 20, cy: 220, hh: 64, hf: 30, ry: [72, 174], rh: 92, nf: 18, mk: 40, mg: 120, e1: 562, e1s: 38, e2: 616, e2s: 42, fy: 700, fs: 30, py: 752, pw: 240, pph: 74, pf: 30, ly: 870 },
  );
  const x0 = Math.round((W - (3 * g.cw + 2 * g.cg)) / 2);
  const ip = Math.round(g.cw * 0.06);
  const tw = g.cw - 2 * ip;
  const marks = [
    [true, false],
    [true, true],
    [false, true],
  ];
  const css =
    base(p) +
    `
.s5-h{font-weight:900;font-size:${g.hs}px;line-height:1.1;letter-spacing:-.02em;}
.s5-c{position:absolute;top:${g.cy}px;width:${g.cw}px;height:${g.chh}px;}
.s5-cb{position:absolute;inset:0;border-radius:${Math.round(g.cw * 0.09)}px;background:#fff;color:${INK};overflow:hidden;box-shadow:0 24px 54px rgba(0,0,0,.45);}
.s5-hd{position:absolute;left:0;top:0;width:100%;height:${g.hh}px;background:#E4EAF2;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:${g.hf}px;}
.s5-t{left:${ip}px;width:${tw}px;height:${g.rh}px;border-radius:${Math.round(g.rh * 0.14)}px;}
.s5-nm{position:absolute;left:${Math.round(ip * 0.6)}px;bottom:${Math.round(ip * 0.6)}px;padding:${Math.round(g.nf * 0.2)}px ${Math.round(g.nf * 0.5)}px;border-radius:${Math.round(g.nf * 0.4)}px;background:${INK};color:#fff;font-weight:700;font-size:${g.nf}px;white-space:nowrap;}
.s5-m{position:absolute;right:${Math.round(ip * 0.6)}px;top:${Math.round(ip * 0.6)}px;width:${g.mk}px;height:${g.mk}px;border-radius:50%;display:flex;align-items:center;justify-content:center;}
.s5-m.ok{background:${GREEN};}
.s5-m.no{background:#9AA6B6;}
.s5-bar{position:absolute;left:${ip}px;height:${Math.round(g.chh * 0.035)}px;border-radius:8px;background:#D6DEE8;}
#s5-ring{position:absolute;left:-${pick(10, 8)}px;top:-${pick(10, 8)}px;right:-${pick(10, 8)}px;bottom:-${pick(10, 8)}px;border-radius:${Math.round(g.cw * 0.11)}px;border:${pick(7, 6)}px solid ${GOLD};opacity:0;}
#s5-win{position:absolute;right:-${Math.round(g.mk * 0.5)}px;top:-${Math.round(g.mk * 0.5)}px;width:${Math.round(g.mk * 1.3)}px;height:${Math.round(g.mk * 1.3)}px;border-radius:50%;background:${GOLD};display:flex;align-items:center;justify-content:center;box-shadow:0 10px 24px rgba(0,0,0,.35);}
#s5-lp{position:absolute;left:${x0 + g.cw / 2 - g.mg / 2}px;top:${g.cy + Math.round(g.chh * 0.42) - g.mg / 2}px;width:${g.mg}px;height:${g.mg}px;}
#s5-e1{top:${g.e1}px;font-weight:700;font-size:${g.e1s}px;line-height:1.1;}
#s5-e2{top:${g.e2}px;font-weight:900;font-size:${g.e2s}px;line-height:1.1;letter-spacing:-.01em;}
#s5-f{top:${g.fy}px;font-weight:500;font-size:${g.fs}px;color:${MUTED};}
#s5-pr{position:absolute;left:0;width:${W}px;top:${g.py}px;display:flex;justify-content:center;align-items:center;gap:${pick(22, 18)}px;}
.s5-p{width:${g.pw}px;height:${g.pph}px;border-radius:${g.pph}px;border:${pick(4, 3)}px solid ${GOLD};display:flex;align-items:center;justify-content:center;gap:${pick(14, 10)}px;font-weight:800;font-size:${g.pf}px;color:#fff;background:rgba(245,184,61,.14);}
#s5-ou{font-weight:600;font-size:${Math.round(g.pf * 0.8)}px;color:${MUTED};}
`;
  const card = (i) => {
    const rows = [
      ["rhp2", "60% 40%", "Português"],
      ["sja", "45% 45%", "Santa Joana"],
    ];
    return `<div class="s5-c" id="s5-c${i}" style="left:${x0 + i * (g.cw + g.cg)}px"${i === 1 ? " data-layout-allow-overlap" : ""}>${
      i === 1 ? `<div id="s5-ring" aria-hidden="true"></div>` : ""
    }<div class="s5-cb"><div class="s5-hd d">Plano ${"ABC"[i]}</div>
      ${rows
        .map(
          ([img, pos, nm], r) =>
            `<div class="ph s5-t" style="top:${g.ry[r]}px;background:url('${IMG[img][0]}') ${pos}/cover no-repeat"><div class="s5-nm">${nm}</div><div class="s5-m ${marks[i][r] ? "ok" : "no"}" id="s5-m${i}${r}">${icon(
              marks[i][r] ? "check" : "x",
              Math.round(g.mk * 0.64),
              { color: "#fff", sw: 5.5 },
            )}</div></div>`,
        )
        .join("")}
      <div class="s5-bar" style="top:${g.ry[1] + g.rh + Math.round(g.chh * 0.06)}px;width:${Math.round(tw * 0.8)}px"></div>
      <div class="s5-bar" style="top:${g.ry[1] + g.rh + Math.round(g.chh * 0.12)}px;width:${Math.round(tw * 0.55)}px"></div></div>${
        i === 1 ? `<div id="s5-win">${icon("check", Math.round(g.mk * 0.8), { color: INK, sw: 5.5 })}</div>` : ""
      }</div>`;
  };
  const body = `
  <div id="s5-wrap" class="${p}-full">
    <div class="ln d s5-h" style="top:${g.h[0]}px">${wspans("s5a", "Um consultor")} <span class="w"><span class="wi gold" id="s5a2">compara</span></span></div>
    <div class="ln d s5-h" style="top:${g.h[1]}px">${wspans("s5b", "as operadoras")}</div>
    ${[0, 1, 2].map(card).join("\n    ")}
    <svg id="s5-lp" viewBox="0 0 100 100" width="${g.mg}" height="${g.mg}" aria-hidden="true" data-layout-allow-overlap>
      <circle cx="42" cy="42" r="28" fill="rgba(255,255,255,.16)" stroke="#fff" stroke-width="7"/>
      <path d="M63 63l22 22" stroke="#fff" stroke-width="11" stroke-linecap="round"/></svg>
    <div id="s5-e1" class="ln d">${wspans("s5c", "e encontra o plano que mantém")}</div>
    <div id="s5-e2" class="ln d gold">${wspans("s5d", "seus hospitais de confiança,")}</div>
    <div id="s5-f" class="ln">de acordo com o perfil da sua</div>
    <div id="s5-pr"><div class="s5-p d" id="s5-p0">${icon("family", Math.round(g.pf * 1.3), { color: GOLD, sw: 3.4 })}família</div><span id="s5-ou">ou</span><div class="s5-p d" id="s5-p1">${icon("building", Math.round(g.pf * 1.2), { color: GOLD, sw: 3.4 })}empresa</div></div>
    <div class="legal" id="${p}-lg" style="top:${g.ly}px">${OBS.eleg} ${OBS.varia} ${OBS.img}</div>
  </div>`;
  words("s5a", 2, 20.1, 0.09);
  add(`tl.fromTo("#s5a2",{yPercent:110,opacity:0},{yPercent:0,opacity:1,duration:0.42,ease:"power3.out"},${L(20.28)});`);
  words("s5b", 2, 20.4, 0.09);
  [0, 1, 2].forEach((i) => add(`tl.fromTo("#s5-c${i}",{y:${pick(140, 100)},opacity:0},{y:0,opacity:1,duration:0.45,ease:"back.out(1.5)"},${L(20.45 + i * 0.12)});`));
  // a lupa passa pelos três planos e marca cada hospital
  const step = g.cw + g.cg;
  add(`tl.fromTo("#s5-lp",{scale:0,x:0},{scale:1,x:0,duration:0.25,ease:"back.out(2)"},${L(20.8)});`);
  add(`tl.to("#s5-lp",{x:${step},duration:0.32,ease:"power2.inOut"},${L(21.2)});`);
  add(`tl.to("#s5-lp",{x:${2 * step},duration:0.32,ease:"power2.inOut"},${L(21.6)});`);
  add(`tl.to("#s5-lp",{scale:0,duration:0.2,ease:"power2.in"},${L(22.0)});`);
  [21.0, 21.4, 21.8].forEach((t, i) =>
    [0, 1].forEach((r) => add(`tl.fromTo("#s5-m${i}${r}",{scale:0},{scale:1,duration:0.26,ease:"back.out(2.6)"},${L(t + r * 0.08)});`)),
  );
  // o plano B (os dois hospitais) se destaca
  add(`tl.to(["#s5-c0","#s5-c2"],{opacity:0.42,scale:0.95,duration:0.3,ease:"power2.out"},${L(22.12)});`);
  add(`tl.to("#s5-c1",{y:${-pick(26, 18)},scale:1.05,duration:0.35,ease:"back.out(2)"},${L(22.1)});`);
  add(`tl.to("#s5-ring",{opacity:1,duration:0.2},${L(22.1)});`);
  add(`tl.fromTo("#s5-win",{scale:0,rotation:-30},{scale:1,rotation:0,duration:0.35,ease:"back.out(2.6)"},${L(22.18)});`);
  words("s5c", 6, 22.3, 0.07);
  words("s5d", 4, 22.72, 0.09);
  add(`tl.fromTo("#s5-f",{opacity:0,y:14},{opacity:1,y:0,duration:0.35,ease:"power3.out"},${L(23.25)});`);
  add(`tl.fromTo("#s5-p0",{scale:0.5,opacity:0},{scale:1,opacity:1,duration:0.35,ease:"back.out(2)"},${L(23.48)});`);
  add(`tl.fromTo("#s5-ou",{opacity:0},{opacity:1,duration:0.2},${L(23.56)});`);
  add(`tl.fromTo("#s5-p1",{scale:0.5,opacity:0},{scale:1,opacity:1,duration:0.35,ease:"back.out(2)"},${L(23.64)});`);
  add(`tl.fromTo("#${p}-lg",{opacity:0},{opacity:1,duration:0.4},${L(21.1)});`);
  add(`tl.to("#s5-wrap",{y:${-pick(140, 90)},opacity:0,duration:0.3,ease:"power3.in"},${r3(dur - 0.3)});`);
  scenes.push({ st, track: 1, ...scene(p, dur, css, body, a) });
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
  add(`tl.fromTo("#en-ai",{y:20,opacity:0},{y:0,opacity:1,duration:0.35,ease:"power3.out"},0.1);`);
  add(`tl.fromTo("#en-x",{scaleX:0},{scaleX:1,duration:0.3,ease:"power3.inOut",transformOrigin:"0% 50%"},0.35);`);
  add(`tl.fromTo("#en-bi",{scale:1.4,opacity:0},{scale:1,opacity:1,duration:0.35,ease:"power4.out"},0.3);`);
  add(`tl.fromTo("#en-c0",{y:50,opacity:0},{y:0,opacity:1,duration:0.4,ease:"power3.out"},0.55);`);
  add(`tl.fromTo("#en-c1",{y:50,opacity:0},{y:0,opacity:1,duration:0.4,ease:"power3.out"},0.78);`);
  add(`tl.fromTo("#en-ul",{scaleX:0},{scaleX:1,duration:0.4,ease:"power3.out",transformOrigin:"0% 50%"},1.1);`);
  [0, 1].forEach((i) => {
    add(`tl.fromTo("#en-p${i}",{y:60,opacity:0},{y:0,opacity:1,duration:0.45,ease:"power3.out"},${r3(1.0 + i * 0.12)});`);
    add(`tl.fromTo("#en-i${i}",{scale:1.12},{scale:1,duration:${r3(dur - 1.0)},ease:"none"},1.0);`);
  });
  add(`tl.fromTo("#en-bw",{scale:0.6,opacity:0},{scale:1,opacity:1,duration:0.45,ease:"back.out(1.8)"},1.3);`);
  add(`tl.fromTo("#${p}-lg",{opacity:0},{opacity:1,duration:0.5},1.6);`);
  // setas apontando para o botão do anúncio; brilho e pulso no botão
  const ar = 1.95;
  add(`tl.fromTo("#en-lb",{opacity:0,y:-14},{opacity:1,y:0,duration:0.35,ease:"power3.out"},${ar});`);
  const nb = Math.floor((dur - ar - 0.4) / 0.625);
  add(`tl.fromTo(["#en-a0","#en-a1"],{y:0},{y:${pick(14, 10)},duration:0.3125,ease:"sine.inOut",repeat:${nb * 2 - 1},yoyo:true},${ar});`);
  [2.3, r3(L(T.fin))].forEach((t, i) => {
    add(`tl.fromTo("#en-bsw",{xPercent:-100},{xPercent:100,duration:0.8,ease:"power2.inOut"${i ? ",immediateRender:false" : ""}},${t});`);
  });
  add(`tl.fromTo("#en-ic",{rotation:0},{rotation:12,duration:0.1,ease:"sine.inOut",repeat:5,yoyo:true},2.35);`);
  for (let t = 3.2; t + 1.25 <= dur - 0.3; t += 1.25) {
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
    [0.28, 0.22],
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

// ═════════════ áudio (trilha + efeitos; sem locução) ═════════════
const HITS = JSON.parse(readFileSync(join(ROOT, "assets/audio/sfx_hits.json"), "utf8"));
const SFX = [
  ["impact", 0.28, 0.26],
  ["card", 1.22, 0.3],
  ["stamp", 2.02, 0.42],
  ["whoosh", 3.9, 0.18],
  ["impact", 4.12, 0.22],
  ["whoosh", T.s2 - 0.05, 0.2],
  ["impact", 6.45, 0.16],
  ["whoosh", 7.38, 0.14],
  ["card", 7.95, 0.26],
  ...[1, 2, 3, 4, 5, 6, 7, 8].map((i) => ["tap", 8.25 + (i - 1) * 0.18, 0.28]),
  ["whoosh", T.s3 - 0.05, 0.2],
  ["impact", 10.1, 0.24],
  ["whoosh", 11.45, 0.16],
  ["riser", T.drop, 0.26],
  ["impact", T.drop, 0.34],
  ["shimmer", T.drop + 0.16, 0.26],
  ["card", T.drop + 0.08, 0.2],
  ["whoosh", T.s4 - 0.05, 0.22],
  ...[16.3, 16.6, 16.9].map((t) => ["card", t, 0.3]),
  ...[16.65, 16.95, 17.25].map((t) => ["check", t, 0.26]),
  ["whoosh", T.s5 - 0.05, 0.22],
  ...[20.45, 20.57, 20.69].map((t) => ["pop", t, 0.22]),
  ...[21.0, 21.4, 21.8].map((t) => ["check", t, 0.24]),
  ["chime", 22.12, 0.28],
  ["pop", 23.48, 0.22],
  ["pop", 23.64, 0.22],
  ["whoosh", T.en - 0.05, 0.22],
  ["impact", T.en + 0.02, 0.26],
  ["pop", T.en + 1.3, 0.2],
  ["pop", T.en + 1.95, 0.14],
  ["shimmer", T.en + 2.3, 0.2],
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
  `<audio id="el-bgm" src="assets/audio/bgm.wav" data-start="0" data-duration="${D}" data-track-index="20" data-volume="0.8"></audio>`,
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
