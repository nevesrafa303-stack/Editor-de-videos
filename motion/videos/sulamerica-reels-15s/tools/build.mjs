#!/usr/bin/env node
// build.mjs — gera compositions/anuncio.html + index.html do anúncio SulAmérica para CNPJ (Reels/Stories 15 s).
//
//   node tools/build.mjs   -> compositions/anuncio.html, index.html  (depois: carve da trilha, ver tools/assemble.sh)
//
// Uma composição só, fiel à peça "AD - Nursing Care Preço SulAmérica STORY":
// toda a arte da referência sobe 120 px (DY) para caber nas zonas seguras
// (nada importante nos 12% de cima nem nos 20% de baixo) e a faixa do CTA
// ganha o botão "Simule agora". Tudo determinístico: os quadros do contador de
// preço e os passos da curva são calculados AQUI e gravados como tl.set/tl.to.

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const W = 1080;
const H = 1920;
const D = 15;
const FPS = 30;
const DY = -120; // deslocamento vertical da arte da referência

const NAVY = "#0C2153";
const ORANGE = "#E3602A";
const r3 = (x) => Math.round(x * 1000) / 1000;

// ───────────── geometria (coordenadas da referência + DY) ─────────────
const BLOCK = { top: 725 + DY, h: 521, w: 743, r: 60 }; // bloco laranja
const CARD = { top: 1065 + DY, h: 410, w: 691, r: 50 }; // cartão branco
const LOGO = { left: 715, top: 1300 + DY, w: 297 }; // onda + "SulAmérica"
const FOOT = { left: 715, top: 1395 + DY, w: 340 }; // rodapé legal
const CTA = { top: 1395, h: 138 }; // faixa: termina em 1533 (< 80% da altura)
const PLATE_TOP = DY; // foto 1080x1920 já no enquadramento da story
const TOTEM = { left: 81, top: 83 + DY, w: 196, h: 641 }; // recorte do totem
const CAM_ORIGIN = { x: 700, y: 723 + DY }; // entrada do hospital / base do totem

// curva azul-marinho: círculo que passa por (679, yB) no fundo e toca x=1080 em yR
const CX = 679;
function circle(yB, yR) {
  const d = yR - yB;
  const r = (401 * 401 + d * d) / (-2 * d);
  return { cy: r3(yB - r), r: r3(r) };
}
const BASE = circle(1000, 967); // base azul (1.5–8.5 s): borda suave em ~1000
const FINAL = circle(866, 465); // curva da referência (r = 401, centro 679,465)
const BASE_HIDDEN = { cy: r3(BASE.cy + 950), r: BASE.r }; // abaixo da tela

// ───────────── marcos (s) ─────────────
const T = {
  block: 0.12,
  words: [0.4, 0.52, 0.64, 0.86, 1.0],
  base: 1.35,
  lives: 1.5,
  foot: 1.65,
  priceIn: 2.0,
  countFrom: 2.1,
  lock: 4.4, // linha de compasso (109 BPM: 0,55 s por tempo)
  card: 4.55,
  items: [5.5, 7.05],
  curve: 8.5,
  curveDur: 0.7,
  wave: 9.05,
  logoText: 9.55,
  cta: 11.0,
  ctaText: 11.2,
  btn: 11.45,
  pulses: [11.95, 12.95],
  rings: [12.2, 13.2],
  still: 14.0,
};

// ───────────── áudio ─────────────
const VOICES = [
  { n: 1, at: 0.0, dur: 2.85 },
  { n: 2, at: 2.5, dur: 4.21 },
  { n: 3, at: 6.55, dur: 2.98 },
  { n: 4, at: 11.0, dur: 3.71 },
];
const SFX_LEN = {
  whoosh: 1.0,
  tick: 0.14,
  counter: 2.5,
  impact: 3.0,
  shimmer: 3.0,
  pop: 0.5,
  chime: 2.2,
};
const SFX = [
  ["whoosh", 0.0, 0.35], // bloco laranja entra
  ["tick", T.lives, 0.2],
  ["counter", T.countFrom, 0.35], // tiques em power3.out, último na trava
  ["impact", T.lock, 0.4],
  ["shimmer", T.lock, 0.2],
  ["whoosh", 4.25, 0.22], // cartão sobe
  ...T.items.flatMap((t) => [
    ["pop", t, 0.35],
    ["tick", t + 0.1, 0.22],
  ]),
  ["whoosh", 8.3, 0.35], // curva varre a lateral
  ["chime", T.logoText + 0.05, 0.4],
  ["whoosh", 10.75, 0.3], // faixa do CTA
  ["pop", T.btn, 0.4],
  ["tick", T.rings[0], 0.2],
  ["tick", T.rings[1], 0.14],
];

// ───────────── HTML ─────────────
const FONTS = [500, 700, 800, 900]
  .map(
    (w) =>
      `@font-face{font-family:"Montserrat";font-weight:${w};font-style:normal;font-display:block;src:url("assets/fonts/Montserrat-${w}.woff2") format("woff2");}`,
  )
  .join("\n");

const TITLE_WORDS = [["Plano", "de", "Saúde"], ["para", "CNPJ"]];
let wi = 0;
const titleHtml = TITLE_WORDS.map(
  (line) =>
    `<div class="tl-line">${line
      .map((w) => `<span class="w"><span class="wi" id="w${wi++}">${w}</span></span>`)
      .join(" ")}</div>`,
).join("");

const ITEMS = ["Atendimento Rede D'Or", "Plano odontológico"];
const itemsHtml = ITEMS.map(
  (t, i) => `
        <div class="item" style="top:${[147, 239][i]}px">
          <div class="ck" id="ck${i}"><svg viewBox="0 0 48 48" width="46" height="46"><circle cx="24" cy="24" r="24" fill="${ORANGE}"/><path id="ckp${i}" d="M14 24.5 l7 7 l13 -14" fill="none" stroke="#fff" stroke-width="4.6" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="34" stroke-dashoffset="34"/></svg></div>
          <div class="it-t" id="itt${i}">${t}</div>
        </div>`,
).join("");

const FOOT_TEXT =
  "*2 adultos até 38 anos e 1 jovem até 18 anos | Os valores podem variar conforme o perfil do beneficiário.";

const css = `
${FONTS}
#stage{position:absolute;inset:0;width:${W}px;height:${H}px;overflow:hidden;background:${NAVY};font-family:"Montserrat",Arial,sans-serif;}
.abs{position:absolute;}
#cam{position:absolute;inset:0;transform-origin:${CAM_ORIGIN.x}px ${CAM_ORIGIN.y}px;}
#plate{position:absolute;left:0;top:${PLATE_TOP}px;width:${W}px;height:${H}px;}
#totem{position:absolute;left:${TOTEM.left}px;top:${TOTEM.top}px;width:${TOTEM.w}px;height:${TOTEM.h}px;transform-origin:50% 100%;}
#totem img{display:block;width:100%;height:100%;}
#shade{position:absolute;inset:0;background:linear-gradient(180deg,rgba(12,33,83,0) 0px,rgba(12,33,83,0) 960px,rgba(12,33,83,0.78) 1260px,${NAVY} 1480px);}
#navy{position:absolute;left:0;top:0;width:${W}px;height:${H}px;}
#block{position:absolute;left:0;top:${BLOCK.top}px;width:${BLOCK.w}px;height:${BLOCK.h}px;background:${ORANGE};border-radius:0 ${BLOCK.r}px ${BLOCK.r}px 0;color:#fff;}
#title{position:absolute;left:87px;top:28px;font-weight:700;font-size:57px;line-height:68px;letter-spacing:-0.005em;white-space:nowrap;}
.w{display:inline-block;overflow:hidden;vertical-align:top;padding:8px 0 10px;margin:-8px 0 -10px;}
.wi{display:inline-block;}
#lives{position:absolute;left:87px;top:188px;font-weight:700;font-size:38px;line-height:46px;white-space:nowrap;}
#price{position:absolute;left:84px;top:244px;height:80px;display:flex;align-items:flex-end;white-space:nowrap;}
#price-z{position:relative;display:flex;align-items:flex-end;transform-origin:20% 80%;}
#cur{font-weight:700;font-size:25px;line-height:1;margin:0 10px 9px 3px;}
#num{font-weight:800;font-size:74px;line-height:1;letter-spacing:-0.01em;font-variant-numeric:tabular-nums;}
#ast{font-weight:800;font-size:58px;line-height:1;margin-left:2px;align-self:flex-start;margin-top:-2px;}
#flare{position:absolute;left:-60px;top:-70px;width:520px;height:220px;border-radius:50%;background:radial-gradient(closest-side,rgba(255,255,255,0.55),rgba(255,214,170,0.22) 55%,rgba(255,255,255,0));opacity:0;}
#card{position:absolute;left:0;top:${CARD.top}px;width:${CARD.w}px;height:${CARD.h}px;background:#fff;border-radius:0 ${CARD.r}px ${CARD.r}px 0;box-shadow:0 18px 48px rgba(4,12,36,0.28);}
.item{position:absolute;left:80px;height:0;display:flex;align-items:center;}
.ck{width:46px;height:46px;flex:none;}
.ck svg{display:block;}
.it-t{margin-left:22px;font-weight:700;font-size:36px;line-height:46px;color:${NAVY};white-space:nowrap;}
#logo{position:absolute;left:${LOGO.left}px;top:${LOGO.top}px;width:${LOGO.w}px;height:${r3((LOGO.w * 280) / 1097)}px;}
#logo img{position:absolute;left:0;top:0;width:100%;height:100%;}
#foot{position:absolute;left:${FOOT.left}px;top:${FOOT.top}px;width:${FOOT.w}px;font-weight:500;font-size:20px;line-height:26px;color:rgba(255,255,255,0.94);}
#cta{position:absolute;left:0;top:${CTA.top}px;width:${W}px;height:${CTA.h}px;background:${ORANGE};}
#cta-in{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;}
#cta-text{font-weight:800;font-size:40px;line-height:46px;letter-spacing:-0.015em;color:#fff;white-space:nowrap;}
#btn-pop{position:relative;}
#ring{position:absolute;inset:0;border-radius:999px;border:3px solid rgba(255,255,255,0.9);opacity:0;}
#btn{position:relative;height:56px;padding:0 10px 0 30px;display:flex;align-items:center;gap:16px;border-radius:999px;background:#fff;box-shadow:0 8px 22px rgba(12,33,83,0.28);}
#btn-t{font-weight:800;font-size:27px;line-height:1;color:${NAVY};white-space:nowrap;}
#btn-a{width:40px;height:40px;border-radius:50%;background:${ORANGE};display:flex;align-items:center;justify-content:center;}
#btn-a svg{display:block;}
`;

// faixas de áudio sem sobreposição (o lint pede uma faixa por som simultâneo)
function allocTracks(items, first) {
  const ends = [];
  return items.map((it) => {
    let k = ends.findIndex((e) => e <= it.at + 1e-6);
    if (k < 0) k = ends.push(0) - 1;
    ends[k] = it.at + it.dur;
    return first + k;
  });
}
const voiceTracks = allocTracks(VOICES, 10);
const sfxItems = SFX.map(([name, at, vol]) => ({ name, at, vol, dur: SFX_LEN[name] }));
const sfxTracks = allocTracks(sfxItems, 20);
const audioTags = [
  `<audio id="el-bgm" src="assets/audio/bgm.wav" data-start="0" data-duration="${D}" data-track-index="1" data-volume="0.5"></audio>`,
  ...VOICES.map(
    (v, i) =>
      `<audio id="el-vo${v.n}-voice" data-audio-group="voiceover" src="assets/voice/0${v.n}.wav" data-start="${v.at}" data-duration="${v.dur}" data-track-index="${voiceTracks[i]}" data-volume="1"></audio>`,
  ),
  ...sfxItems.map(
    (x, i) =>
      `<audio id="el-sfx-${i}" src="assets/audio/sfx_${x.name}.wav" data-start="${r3(x.at)}" data-duration="${x.dur}" data-track-index="${sfxTracks[i]}" data-volume="${x.vol}"></audio>`,
  ),
].join("\n      ");

// ───────────── timeline ─────────────
const tl = [];
const add = (s) => tl.push(s);

// câmera: avança para a entrada (forte no gancho, depois bem lenta) + parallax do totem
add(`tl.fromTo("#cam",{scale:1},{scale:1.03,duration:1.5,ease:"power2.out"},0);`);
add(`tl.to("#cam",{scale:1.05,duration:${T.still - 1.5},ease:"sine.inOut"},1.5);`);
add(`tl.fromTo("#totem",{scale:1},{scale:1.035,duration:1.5,ease:"power2.out"},0);`);
add(`tl.to("#totem",{scale:1.05,duration:${T.still - 1.5},ease:"sine.inOut"},1.5);`);

// bloco laranja desliza da esquerda + título palavra por palavra
add(`tl.fromTo("#block",{x:-${BLOCK.w + 40}},{x:0,duration:0.6,ease:"power3.out"},${T.block});`);
T.words.forEach((t, i) =>
  add(`tl.fromTo("#w${i}",{yPercent:115,opacity:0},{yPercent:0,opacity:1,duration:0.5,ease:"power3.out"},${t});`),
);

// base azul-marinho sobe por baixo (borda curva suave)
add(
  `tl.fromTo("#hole",{attr:{cy:${BASE_HIDDEN.cy}}},{attr:{cy:${BASE.cy}},duration:0.6,ease:"power3.out"},${T.base});`,
);

// "3 vidas a partir de" + rodapé legal (fica até o fim)
add(`tl.fromTo("#lives",{opacity:0,y:22},{opacity:1,y:0,duration:0.4,ease:"power3.out"},${T.lives});`);
add(`tl.fromTo("#foot",{opacity:0,y:10},{opacity:1,y:0,duration:0.5,ease:"power2.out"},${T.foot});`);

// preço: contador de R$ 0 a 1.014,97 (power3.out, um valor por quadro), trava no compasso
add(`tl.fromTo("#price",{opacity:0,y:18},{opacity:1,y:0,duration:0.3,ease:"power3.out"},${T.priceIn});`);
const fmt = (v) => {
  const cents = Math.round(v * 100);
  const int = Math.floor(cents / 100)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${int},${String(cents % 100).padStart(2, "0")}`;
};
const countDur = T.lock - T.countFrom;
const steps = Math.round(countDur * FPS);
for (let k = 0; k <= steps; k++) {
  const p = k / steps;
  const v = 1014.97 * (1 - Math.pow(1 - p, 3));
  add(`tl.set("#num",{textContent:"${k === steps ? "1.014,97" : fmt(v)}"},${r3(T.countFrom + p * countDur)});`);
}
add(`tl.fromTo("#price-z",{scale:1},{scale:1.07,duration:0.12,ease:"power2.out"},${T.lock});`);
add(`tl.to("#price-z",{scale:1,duration:0.45,ease:"power2.out"},${r3(T.lock + 0.12)});`);
add(`tl.fromTo("#flare",{opacity:0,scale:0.7},{opacity:1,scale:1,duration:0.14,ease:"power2.out"},${T.lock});`);
add(`tl.to("#flare",{opacity:0,scale:1.25,duration:0.8,ease:"power2.out"},${r3(T.lock + 0.14)});`);

// cartão branco sobe; itens um de cada vez (check + pop suave)
add(`tl.fromTo("#card",{y:420},{y:0,duration:0.6,ease:"power3.out"},${T.card});`);
add(`tl.fromTo("#card",{opacity:0},{opacity:1,duration:0.15,ease:"power1.out"},${T.card});`);
T.items.forEach((t, i) => {
  add(`tl.fromTo("#ck${i}",{scale:0.3,opacity:0},{scale:1,opacity:1,duration:0.42,ease:"back.out(1.7)"},${t});`);
  add(`tl.fromTo("#ckp${i}",{attr:{"stroke-dashoffset":34}},{attr:{"stroke-dashoffset":0},duration:0.3,ease:"power2.out"},${r3(t + 0.1)});`);
  add(`tl.fromTo("#itt${i}",{opacity:0,x:-26},{opacity:1,x:0,duration:0.45,ease:"power3.out"},${r3(t + 0.06)});`);
});

// curva azul-marinho varre a lateral direita: círculo da base -> círculo da referência,
// em passos curtos (yB e yR lineares no progresso power3.out)
const CURVE_STEPS = 24;
for (let k = 1; k <= CURVE_STEPS; k++) {
  const p = 1 - Math.pow(1 - k / CURVE_STEPS, 3);
  const c = circle(1000 + (866 - 1000) * p, 967 + (465 - 967) * p);
  const dt = T.curveDur / CURVE_STEPS;
  add(`tl.to("#hole",{attr:{cy:${c.cy},r:${c.r}},duration:${r3(dt)},ease:"none"},${r3(T.curve + (k - 1) * dt)});`);
}

// logo: a onda laranja se desenha, depois "SulAmérica" sobe
add(
  `tl.fromTo("#logo-wave",{clipPath:"inset(0% 100% 0% 0%)"},{clipPath:"inset(0% 0% 0% 0%)",duration:0.75,ease:"power2.inOut"},${T.wave});`,
);
add(
  `tl.fromTo("#logo-text",{clipPath:"inset(100% 0% 0% 0%)",y:16},{clipPath:"inset(0% 0% 0% 0%)",y:0,duration:0.6,ease:"power3.out"},${T.logoText});`,
);

// CTA: faixa laranja sobe, texto, botão com pop suave, pulsos e toque
add(`tl.fromTo("#cta",{y:${H - CTA.top + 20}},{y:0,duration:0.55,ease:"power3.out"},${T.cta});`);
add(`tl.fromTo("#cta-text",{opacity:0,y:18},{opacity:1,y:0,duration:0.4,ease:"power3.out"},${T.ctaText});`);
add(`tl.fromTo("#btn-pop",{opacity:0,scale:0.7},{opacity:1,scale:1,duration:0.45,ease:"back.out(1.4)"},${T.btn});`);
T.pulses.forEach((t, i) => {
  add(
    `tl.fromTo("#btn",{scale:1},{scale:1.045,duration:0.5,ease:"sine.inOut"${i ? ",immediateRender:false" : ""}},${t});`,
  );
  add(`tl.to("#btn",{scale:1,duration:0.5,ease:"sine.inOut"},${r3(t + 0.5)});`);
  add(
    `tl.fromTo("#btn-arrow",{x:0},{x:5,duration:0.5,ease:"sine.inOut"${i ? ",immediateRender:false" : ""}},${t});`,
  );
  add(`tl.to("#btn-arrow",{x:0,duration:0.5,ease:"sine.inOut"},${r3(t + 0.5)});`);
});
T.rings.forEach((t, i) => {
  add(
    `tl.fromTo("#ring",{opacity:0.85,scale:1},{opacity:0,scale:1.28,duration:0.7,ease:"power2.out"${i ? ",immediateRender:false" : ""}},${t});`,
  );
});

const scene = `<template>
<style>${css}</style>
<div id="stage" data-composition-id="anuncio" data-start="0" data-duration="${D}" data-width="${W}" data-height="${H}">
  <div id="cam" data-layout-allow-overflow>
    <img id="plate" src="assets/img/plate.png" alt="" data-layout-allow-overflow />
    <div id="totem" data-layout-allow-overflow><img src="assets/img/totem.png" alt="" /></div>
  </div>
  <div id="shade"></div>
  <svg id="navy" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
    <defs>
      <mask id="navy-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}">
        <rect x="0" y="${FINAL.cy}" width="${W}" height="${r3(H - FINAL.cy)}" fill="#fff" />
        <rect x="0" y="0" width="700" height="866" fill="#000" />
        <circle id="hole" cx="${CX}" cy="${BASE_HIDDEN.cy}" r="${BASE_HIDDEN.r}" fill="#000" />
      </mask>
    </defs>
    <rect x="0" y="0" width="${W}" height="${H}" fill="${NAVY}" mask="url(#navy-mask)" />
  </svg>
  <div id="block">
    <div id="title">${titleHtml}</div>
    <div id="lives">3 vidas a partir de</div>
    <div id="price"><div id="price-z"><div id="flare"></div><span id="cur">R$</span><span id="num">0,00</span><span id="ast">*</span></div></div>
  </div>
  <div id="card">${itemsHtml}
  </div>
  <div id="logo">
    <img id="logo-wave" src="assets/img/logo-wave.png" alt="" />
    <img id="logo-text" src="assets/img/logo-text.png" alt="SulAmérica" />
  </div>
  <div id="foot">${FOOT_TEXT}</div>
  <div id="cta" data-layout-allow-overflow>
    <div id="cta-in">
      <div id="cta-text">Simulação Gratuita 100% Online</div>
      <div id="btn-pop">
        <div id="ring"></div>
        <div id="btn"><span id="btn-t">Simule agora</span><span id="btn-a"><svg id="btn-arrow" viewBox="0 0 24 24" width="24" height="24"><path d="M5 12h12M12 6l6 6-6 6" fill="none" stroke="#fff" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/></svg></span></div>
      </div>
    </div>
  </div>
</div>
<script>
(function(){
const tl = gsap.timeline({ paused: true });
${tl.join("\n")}
window.__timelines["anuncio"] = tl;
})();
</script>
</template>
`;

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
      <div id="el-anuncio" class="scene" data-composition-id="anuncio" data-composition-src="compositions/anuncio.html" data-start="0" data-duration="${D}" data-track-index="0"></div>
      ${audioTags}
    </div>
    <script>
      window.__timelines = window.__timelines || {};
      window.__timelines["main"] = gsap.timeline({ paused: true });
    </script>
  </body>
</html>
`;

mkdirSync(join(ROOT, "compositions"), { recursive: true });
writeFileSync(join(ROOT, "compositions/anuncio.html"), scene);
writeFileSync(join(ROOT, "index.html"), html);
console.log(`index.html: ${tl.length} comandos de timeline, ${SFX.length} SFX, ${VOICES.length} falas`);
