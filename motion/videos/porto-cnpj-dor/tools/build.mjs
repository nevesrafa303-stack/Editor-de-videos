#!/usr/bin/env node
// build.mjs — filme Porto "Plano de Saúde para CNPJ" (Reels/Stories), dor -> desejo -> solução.
//
//   node tools/build.mjs   -> compositions/filme.html + index.html   (depois: tools/assemble.sh)
//
// Ato 1 (dor): fundo escuro, notificação de fatura, "PAGANDO CARO" com glitch e
//   um gráfico vermelho subindo. Ato 2 (virada): um interruptor CPF -> CNPJ vira a
//   tela para o azul da Porto, a linha da mensalidade cai e o Hospital Dr. Beda
//   aparece ("com a mesma qualidade"). Ato 3 (solução): a foto abre em tela cheia e
//   a peça "AD - Dr. Beda Preço Porto STORY" se monta peça por peça até o CTA.
// Todos os marcos saem dos tempos das palavras da locução (assets/voice/vo.words.json).
// Determinístico: tremidas, glitch e contador são calculados aqui (semente fixa).

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const W = 1080;
const H = 1920;
const FPS = 30;
const r3 = (x) => Math.round(x * 1000) / 1000;

// ───────────── cores (da peça) ─────────────
const DARK = "#070B16";
const RED = "#FF3B30";
const LIGHT = "#3A90EE"; // bloco e faixa (o #4A9FF9 da peça, um tom abaixo: texto branco passa de 3:1)
const ROYAL = "#2146C3"; // cartão dos benefícios
const LAV = "#E9ECF4"; // fundo
const INK = "#2B3140";

// ───────────── locução: tempos das palavras ─────────────
const WORDS = JSON.parse(readFileSync(join(ROOT, "assets/voice/vo.words.json"), "utf8"));
const norm = (s) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]/g, "");
function word(text, n = 0) {
  const k = norm(text);
  const hits = WORDS.filter((w) => norm(w.word) === k);
  if (!hits[n]) throw new Error(`palavra não encontrada: ${text} #${n}`);
  return hits[n];
}
const at = (t, n = 0) => word(t, n).start;
const VO_END = WORDS[WORDS.length - 1].end;
const D = r3(Math.ceil((VO_END + 1.1) * 10) / 10); // 1 s parado no fim

const T = {
  pagando: at("pagando"),
  caro: at("caro"),
  noSeu: at("no"),
  muita: at("muita"),
  com0: at("com", 0),
  turn: at("cnpj", 0),
  mens: at("mensalidade"),
  cair: at("cair"),
  bastante: at("bastante"),
  com1: at("com", 1),
  qualidade: at("qualidade"),
  plano1: at("plano", 1),
  porto: at("porto"),
  para: at("para"),
  cnpj1: at("cnpj", 1),
  tres: at("tres"),
  novecentos: at("novecentos"),
  lock: word("oitenta").end,
  items: [at("plano", 2), at("seguro"), at("servicos"), at("protecao")],
  faca: at("faca"),
  simulacao: at("simulacao"),
  gratuita: at("gratuita"),
  descubra: at("descubra"),
  economizar: at("economizar"),
};
T.still = r3(VO_END + 0.1);

// ───────────── geometria final (peça + LAYOUT_DY, ver prep_assets.py) ─────────────
// o banner do hospital fica inteiro acima do bloco (como na peça) e a parte de baixo
// (cartão, logo, rodapé e faixa) é compactada para o CTA terminar antes de 1536 px
const LDY = 8;
const PHOTO_DY = 10;
const BLOCK = { top: 707 + LDY, h: 470, w: 755, r: 60 };
const CARD = { top: 1058, h: 316, w: 691, r: 48 };
const LOGO = { left: 727, top: 1214, w: 294 };
const FOOT = { left: 723, top: 1290, w: 330 };
const CTA = { top: 1402, h: 134 };
// moldura da foto no ato 2 (cartão) e escala da foto dentro dela
const FRAME = { x0: 80, y0: 340, x1: 1000, y1: 940, r: 40 };
const PHOTO_S = 0.86;
const PHOTO_OY = r3((FRAME.y0 - PHOTO_DY * PHOTO_S) / (1 - PHOTO_S)); // 1ª linha da foto -> topo da moldura
// interruptor
const SW = { cx: 540, cy: 960, w: 560, h: 200, knob: 168 };
const KNOB_L = SW.cx - SW.w / 2 + 16 + SW.knob / 2;
const KNOB_R = SW.cx + SW.w / 2 - 16 - SW.knob / 2;

// ───────────── aleatório determinístico ─────────────
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

// ───────────── HTML ─────────────
const FONTS = [400, 500, 600, 700, 800, 900]
  .map(
    (w) =>
      `@font-face{font-family:"Poppins";font-weight:${w};font-style:normal;font-display:block;src:url("assets/fonts/Poppins-${w}.woff2") format("woff2");}`,
  )
  .join("\n");

// gráfico do ato 1: mensalidade subindo; do ato 2: caindo
const UP = [
  [80, 1470],
  [230, 1400],
  [340, 1430],
  [480, 1250],
  [600, 1290],
  [740, 1040],
  [860, 1080],
  [990, 760],
];
const DOWN = [
  [80, 720],
  [220, 760],
  [330, 735],
  [470, 900],
  [600, 870],
  [730, 1060],
  [860, 1030],
  [990, 1230],
];
const pathD = (pts) => pts.map(([x, y], i) => `${i ? "L" : "M"}${x} ${y}`).join(" ");
const pathLen = (pts) => Math.round(pts.slice(1).reduce((s, p, i) => s + Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]), 0));
const headAngle = (pts) => {
  const [a, b] = pts.slice(-2);
  return r3((Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI);
};
const grid = (color) =>
  Array.from({ length: 8 }, (_, i) => `<line x1="60" x2="1020" y1="${700 + i * 110}" y2="${700 + i * 110}" stroke="${color}" stroke-width="2"/>`).join("");
const chart = (id, pts, color, gridColor) => {
  const [ex, ey] = pts[pts.length - 1];
  return `<svg id="${id}" class="chart" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
    <g>${grid(gridColor)}</g>
    <path id="${id}-glow" d="${pathD(pts)}" fill="none" stroke="${color}" stroke-opacity="0.22" stroke-width="30" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="${pathLen(pts)} ${pathLen(pts) + 60}" stroke-dashoffset="${pathLen(pts)}"/>
    <path id="${id}-line" d="${pathD(pts)}" fill="none" stroke="${color}" stroke-width="11" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="${pathLen(pts)} ${pathLen(pts) + 60}" stroke-dashoffset="${pathLen(pts)}"/>
    <g transform="translate(${ex} ${ey}) rotate(${headAngle(pts)})"><path id="${id}-head" d="M-8 -30 L34 0 L-8 30 Z" fill="${color}"/></g>
  </svg>`;
};

const wordSpans = (prefix, text) =>
  text
    .split(" ")
    .map((w, i) => `<span class="w"><span class="wi" id="${prefix}${i}">${w}</span></span>`)
    .join(" ");

const ICONS = {
  // dente
  tooth: `<path d="M14 9c-4 0-6 3-6 7 0 4 2 6 3 10 1 4 1 9 3 9s2-5 4-8c1-1 2-1 3 0 2 3 2 8 4 8s2-5 3-9c1-4 3-6 3-10 0-4-2-7-6-7-3 0-4 2-6 2s-3-2-5-2z"/>`,
  // coração com pulso
  heart: `<path d="M24 38S8 28 8 17c0-5 4-8 8-8 3 0 6 2 8 5 2-3 5-5 8-5 4 0 8 3 8 8 0 11-16 21-16 21z"/><path d="M11 22h7l3-5 4 9 3-4h9"/>`,
  // maleta
  case: `<rect x="7" y="15" width="34" height="23" rx="4"/><path d="M18 15v-4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v4M7 25h34M24 23v5"/>`,
  // escudo com check
  shield: `<path d="M24 6l15 5v11c0 9-6 16-15 20C15 38 9 31 9 22V11z"/><path d="M17 23l5 5 9-10"/>`,
};
const ITEMS = [
  ["PLANO ODONTOLÓGICO", "tooth"],
  ["SEGURO DE VIDA", "heart"],
  ["SERVIÇOS OCUPACIONAIS", "case"],
  ["PROTEÇÃO ANTIÁCARO", "shield"],
];
const ITEM_Y = [55, 123, 191, 259];
const itemsHtml = ITEMS.map(
  ([t, ic], i) => `
    <div class="item" style="top:${ITEM_Y[i]}px">
      <div class="ic" id="ic${i}"><svg viewBox="0 0 48 48" width="30" height="30" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round">${ICONS[ic]}</svg></div>
      <div class="it" id="it${i}">${t}</div>
    </div>`,
).join("");

const FOOT_TEXT =
  "*2 adultos até 38 anos e 1 jovem até 18 anos | Os valores podem variar conforme o perfil do beneficiário.";

const css = `
${FONTS}
#stage{position:absolute;inset:0;width:${W}px;height:${H}px;overflow:hidden;background:${DARK};font-family:"Poppins",Arial,sans-serif;}
.full{position:absolute;left:0;top:0;width:${W}px;height:${H}px;}
.row{position:absolute;left:0;width:${W}px;text-align:center;white-space:nowrap;}
.w{display:inline-block;overflow:hidden;vertical-align:top;padding:10px 0 14px;margin:-10px 0 -14px;}
.wi{display:inline-block;}
.chart{position:absolute;left:0;top:0;}
/* ato 1 */
#a1-bg{background:radial-gradient(120% 70% at 50% 55%,#151B2E 0%,${DARK} 60%,#04060C 100%);}
#a1-glow{position:absolute;left:90px;top:640px;width:900px;height:760px;border-radius:50%;background:radial-gradient(closest-side,rgba(255,59,48,0.42),rgba(255,59,48,0));opacity:0;}
#a1-chart{opacity:0.75;}
#notif-wrap{position:absolute;left:60px;top:250px;width:960px;height:150px;}
#notif{position:absolute;inset:0;display:flex;align-items:center;gap:26px;padding:0 30px;border-radius:34px;background:rgba(44,48,62,0.92);border:1.5px solid rgba(255,255,255,0.12);box-shadow:0 24px 60px rgba(0,0,0,0.55);}
.n-icon{width:84px;height:84px;flex:none;border-radius:20px;background:linear-gradient(160deg,#FF6B5E,${RED});display:flex;align-items:center;justify-content:center;}
.n-txt{flex:1;min-width:0;color:#fff;}
.n-top{display:flex;justify-content:space-between;align-items:baseline;font-size:30px;line-height:38px;}
.n-top b{font-weight:700;}
.n-top span{font-size:24px;color:rgba(255,255,255,0.55);}
.n-body{font-size:28px;line-height:38px;color:rgba(255,255,255,0.86);white-space:nowrap;}
.a1t{text-shadow:0 6px 28px rgba(0,0,0,0.65);}
#t-voce{top:585px;font-weight:600;font-size:60px;line-height:72px;color:rgba(255,255,255,0.9);}
#t-pagando{top:665px;font-weight:900;font-size:150px;line-height:170px;letter-spacing:-0.02em;color:#fff;}
#caro-box{position:absolute;left:0;top:840px;width:${W}px;height:330px;}
.caro{position:absolute;left:0;top:0;width:${W}px;text-align:center;font-weight:900;font-size:300px;line-height:330px;letter-spacing:-0.03em;}
#caro{color:${RED};}
#caro-c{color:#00E5FF;mix-blend-mode:screen;opacity:0;}
#caro-m{color:#FF2D95;mix-blend-mode:screen;opacity:0;}
#t-plano{top:1185px;font-weight:600;font-size:58px;line-height:72px;color:#fff;}
#t-muita{top:560px;font-weight:700;font-size:64px;line-height:80px;color:#fff;}
/* interruptor */
#sw-wrap{position:absolute;left:${SW.cx - SW.w / 2}px;top:${SW.cy - SW.h / 2}px;width:${SW.w}px;height:${SW.h}px;}
#sw{position:absolute;inset:0;border-radius:999px;background:rgba(255,255,255,0.08);border:3px solid rgba(255,255,255,0.35);}
#sw-on{position:absolute;inset:0;border-radius:999px;background:${ROYAL};border:3px solid #fff;opacity:0;}
.sw-l{position:absolute;top:0;height:${SW.h}px;width:${SW.w / 2}px;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:64px;letter-spacing:0.02em;}
#sw-cpf{left:${SW.w / 2}px;color:#fff;}
#sw-cnpj{left:0;color:#fff;opacity:0;}
#knob{position:absolute;left:${KNOB_L - SW.knob / 2 - (SW.cx - SW.w / 2)}px;top:${(SW.h - SW.knob) / 2}px;width:${SW.knob}px;height:${SW.knob}px;border-radius:50%;background:${RED};box-shadow:0 0 50px rgba(255,59,48,0.7);}
#knob-on{position:absolute;inset:0;border-radius:50%;background:#fff;opacity:0;}
#burst{position:absolute;left:${KNOB_R - 150}px;top:${SW.cy - 150}px;width:300px;height:300px;border-radius:50%;border:10px solid rgba(255,255,255,0.9);opacity:0;}
/* ato 2 */
#a2{clip-path:circle(0px at ${KNOB_R}px ${SW.cy}px);}
#a2-bg{background:linear-gradient(160deg,${LIGHT} 0%,#3B82F0 45%,${ROYAL} 100%);}
#t-mens{top:540px;font-weight:600;font-size:62px;line-height:76px;color:#fff;}
#t-cair{top:1280px;font-weight:700;font-size:78px;line-height:92px;color:#fff;}
#t-bastante{top:1360px;font-weight:900;font-size:128px;line-height:150px;letter-spacing:-0.02em;color:#fff;}
#swoosh{position:absolute;left:270px;top:1490px;}
/* ato 3 */
#lav{background:${LAV};opacity:0;}
#ph-shadow{position:absolute;left:${FRAME.x0}px;top:${FRAME.y0}px;width:${FRAME.x1 - FRAME.x0}px;height:${FRAME.y1 - FRAME.y0}px;border-radius:${FRAME.r}px;box-shadow:0 30px 80px rgba(8,22,70,0.45),0 0 0 6px rgba(255,255,255,0.9);opacity:0;}
#ph-wrap{clip-path:inset(${FRAME.y0 + 300}px ${W / 2}px ${H - FRAME.y0 - 300}px ${W / 2}px round ${FRAME.r}px);}
#ph-cam{transform-origin:700px 250px;}
#photo{position:absolute;left:0;top:0;width:${W}px;height:${H}px;transform-origin:${W / 2}px ${PHOTO_OY}px;}
#shine{position:absolute;left:-500px;top:0;width:360px;height:${H}px;background:linear-gradient(90deg,rgba(255,255,255,0),rgba(255,255,255,0.45),rgba(255,255,255,0));}
#cap{top:985px;font-weight:600;font-size:60px;line-height:76px;color:#fff;}
#cap b{font-weight:800;}
#block{position:absolute;left:0;top:${BLOCK.top}px;width:${BLOCK.w}px;height:${BLOCK.h}px;background:${LIGHT};border-radius:0 ${BLOCK.r}px ${BLOCK.r}px 0;color:#fff;}
#title{position:absolute;left:76px;top:12px;font-weight:600;font-size:52px;line-height:64px;white-space:nowrap;}
#lives{position:absolute;left:76px;top:178px;font-weight:600;font-size:40px;line-height:50px;white-space:nowrap;}
#price{position:absolute;left:74px;top:236px;height:86px;display:flex;align-items:flex-end;white-space:nowrap;}
#price-z{position:relative;display:flex;align-items:flex-end;transform-origin:20% 80%;}
#cur{font-weight:600;font-size:26px;line-height:1;margin:0 10px 10px 2px;}
#num{font-weight:600;font-size:72px;line-height:1;letter-spacing:-0.005em;font-variant-numeric:tabular-nums;}
#ast{font-weight:600;font-size:60px;line-height:1;margin-left:4px;align-self:flex-start;}
#flare{position:absolute;left:-80px;top:-80px;width:520px;height:240px;border-radius:50%;background:radial-gradient(closest-side,rgba(255,255,255,0.6),rgba(255,255,255,0));opacity:0;}
#card{position:absolute;left:0;top:${CARD.top}px;width:${CARD.w}px;height:${CARD.h}px;background:${ROYAL};border-radius:0 ${CARD.r}px ${CARD.r}px 0;}
.item{position:absolute;left:84px;height:0;display:flex;align-items:center;}
.ic{width:50px;height:50px;flex:none;border-radius:50%;background:${LIGHT};display:flex;align-items:center;justify-content:center;}
.ic svg{display:block;}
.it{margin-left:22px;font-weight:500;font-size:33px;line-height:44px;color:#fff;white-space:nowrap;letter-spacing:0.01em;}
#logo-pill{position:absolute;left:270px;top:1240px;width:540px;height:170px;border-radius:52px;background:#fff;box-shadow:0 18px 50px rgba(20,40,110,0.25);opacity:0;}
#logo{position:absolute;left:${LOGO.left}px;top:${LOGO.top}px;width:${LOGO.w}px;height:${r3((LOGO.w * 32) / 140)}px;opacity:0;}
#foot{position:absolute;left:${FOOT.left}px;top:${FOOT.top}px;width:${FOOT.w}px;font-weight:400;font-size:20px;line-height:26px;color:${INK};opacity:0;}
#cta{position:absolute;left:0;top:${CTA.top}px;width:${W}px;height:${CTA.h}px;background:${LIGHT};}
#cta-in{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;}
#cta-text{font-weight:700;font-size:42px;line-height:48px;letter-spacing:-0.02em;color:#fff;white-space:nowrap;}
#btn-pop{position:relative;}
#ring{position:absolute;inset:0;border-radius:999px;border:3px solid rgba(255,255,255,0.95);opacity:0;}
#btn{position:relative;height:56px;padding:0 10px 0 32px;display:flex;align-items:center;gap:16px;border-radius:999px;background:#fff;box-shadow:0 8px 22px rgba(20,40,110,0.25);}
#btn-t{font-weight:700;font-size:27px;line-height:1;color:${ROYAL};white-space:nowrap;}
#btn-a{width:42px;height:42px;border-radius:50%;background:${ROYAL};display:flex;align-items:center;justify-content:center;}
#btn-a svg{display:block;}
`;

const body = `
  <div id="a1" class="full">
    <div id="a1-bg" class="full"></div>
    <div id="a1-glow"></div>
    ${chart("a1-chart", UP, RED, "rgba(255,255,255,0.06)")}
    <div id="a1-shake" class="full">
      <div id="t-voce" class="row a1t">${wordSpans("v", "Você pode estar")}</div>
      <div id="t-pagando" class="row a1t"><span class="w"><span class="wi" id="pg">PAGANDO</span></span></div>
      <div id="caro-box"><div id="caro-c" class="caro" aria-hidden="true" data-layout-allow-overlap>CARO</div><div id="caro-m" class="caro" aria-hidden="true" data-layout-allow-overlap>CARO</div><div id="caro" class="caro">CARO</div></div>
      <div id="t-plano" class="row a1t">${wordSpans("pl", "no seu plano de saúde?")}</div>
    </div>
    <div id="notif-wrap"><div id="notif">
      <div class="n-icon"><svg viewBox="0 0 48 48" width="50" height="50" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 6h24v36l-4-3-4 3-4-3-4 3-4-3-4 3z"/><path d="M18 16h12M18 23h12M18 30h7"/></svg></div>
      <div class="n-txt"><div class="n-top"><b>Plano de saúde</b><span>agora</span></div><div class="n-body">Sua fatura chegou: o valor subiu de novo.</div></div>
    </div></div>
    <div id="t-muita" class="row a1t">${wordSpans("mu", "Muita gente já descobriu:")}</div>
  </div>
  <div id="a2" class="full">
    <div id="a2-bg" class="full"></div>
    ${chart("a2-chart", DOWN, "#FFFFFF", "rgba(255,255,255,0.14)")}
    <div id="t-mens" class="row">${wordSpans("me", "a mensalidade")}</div>
    <div id="t-cair" class="row">${wordSpans("ca", "pode cair")}</div>
    <div id="t-bastante" class="row"><span class="w"><span class="wi" id="ba">bastante</span></span></div>
    <svg id="swoosh" viewBox="0 0 540 40" width="540" height="40"><path id="swoosh-p" d="M8 28 C150 6 360 4 532 20" fill="none" stroke="#fff" stroke-width="9" stroke-linecap="round" stroke-dasharray="540 600" stroke-dashoffset="540"/></svg>
  </div>
  <div id="burst"></div>
  <div id="sw-wrap">
    <div id="sw"></div>
    <div id="sw-on"></div>
    <div id="sw-cpf" class="sw-l">CPF</div>
    <div id="sw-cnpj" class="sw-l">CNPJ</div>
    <div id="knob"><div id="knob-on"></div></div>
  </div>
  <div id="lav" class="full"></div>
  <div id="ph-shadow"></div>
  <div id="ph-wrap" class="full">
    <div id="ph-cam" class="full"><img id="photo" src="assets/img/plate.png" alt="Hospital Dr. Beda" /></div>
    <div id="shine"></div>
  </div>
  <div id="cap" class="row">${wordSpans("cq", "com a mesma qualidade")}</div>
  <div id="block" data-layout-allow-overflow>
    <div id="title"><div>${wordSpans("tt", "Plano de Saúde")}</div><div>${wordSpans("tp", "para CNPJ")}</div></div>
    <div id="lives">3 vidas a partir de</div>
    <div id="price"><div id="price-z"><div id="flare"></div><span id="cur">R$</span><span id="num">0,00</span><span id="ast">*</span></div></div>
  </div>
  <div id="card">${itemsHtml}
  </div>
  <div id="logo-pill"></div>
  <img id="logo" src="assets/img/porto-logo.svg" alt="Porto" />
  <div id="foot">${FOOT_TEXT}</div>
  <div id="cta" data-layout-allow-overflow>
    <div id="cta-in">
      <div id="cta-text">Simulação Gratuita 100% Online</div>
      <div id="btn-pop">
        <div id="ring"></div>
        <div id="btn"><span id="btn-t">Simule agora</span><span id="btn-a"><svg id="btn-arrow" viewBox="0 0 24 24" width="24" height="24"><path d="M5 12h12M12 6l6 6-6 6" fill="none" stroke="#fff" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/></svg></span></div>
      </div>
    </div>
  </div>`;

// ───────────── timeline ─────────────
const tl = [];
const add = (s) => tl.push(s);
const words = (prefix, n, t0, gap, dur = 0.45) => {
  for (let i = 0; i < n; i++)
    add(`tl.fromTo("#${prefix}${i}",{yPercent:110,opacity:0},{yPercent:0,opacity:1,duration:${dur},ease:"power3.out"},${r3(t0 + i * gap)});`);
};

// ATO 1 — dor
add(`tl.fromTo("#notif-wrap",{y:-70,scale:0.94,opacity:0.55},{y:0,scale:1,opacity:1,duration:0.4,ease:"back.out(1.6)"},0);`);
add(`tl.fromTo("#a1-glow",{opacity:0.25,scale:0.8},{opacity:0.25,scale:0.8,duration:0.01},0);`);
add(`tl.fromTo("#a1-chart-line",{attr:{"stroke-dashoffset":${Math.round(pathLen(UP) * 0.65)}}},{attr:{"stroke-dashoffset":0},duration:2.2,ease:"power2.inOut"},0);`);
add(`tl.fromTo("#a1-chart-glow",{attr:{"stroke-dashoffset":${Math.round(pathLen(UP) * 0.65)}}},{attr:{"stroke-dashoffset":0},duration:2.2,ease:"power2.inOut"},0);`);
add(`tl.fromTo("#a1-chart-head",{opacity:0,scale:0.3},{opacity:1,scale:1,duration:0.3,ease:"back.out(2)"},2.3);`);
words("v", 3, 0.15, 0.2, 0.4);
add(`tl.fromTo("#pg",{yPercent:110,opacity:0},{yPercent:0,opacity:1,duration:0.35,ease:"power4.out"},${r3(T.pagando - 0.05)});`);
add(`tl.fromTo("#caro-box",{scale:2.4,opacity:0},{scale:1,opacity:1,duration:0.22,ease:"power4.in"},${r3(T.caro - 0.2)});`);
add(`tl.to("#a1-glow",{opacity:1,scale:1,duration:0.3,ease:"power2.out"},${T.caro});`);
// batimento do brilho vermelho
for (let k = 0; k < 2; k++) {
  const t = r3(T.caro + 0.4 + k * 0.42);
  add(`tl.to("#a1-glow",{opacity:0.55,duration:0.16,ease:"power1.out"},${t});`);
  add(`tl.to("#a1-glow",{opacity:1,duration:0.2,ease:"power1.in"},${r3(t + 0.16)});`);
}
// tremida + glitch RGB no "CARO" (quadros sorteados com semente fixa)
{
  const R = rng(1170);
  const n = 12;
  for (let k = 0; k < n; k++) {
    const t = r3(T.caro + 0.02 + k / FPS);
    const amp = 1 - k / n;
    const sx = Math.round((R() - 0.5) * 36 * amp);
    const sy = Math.round((R() - 0.5) * 24 * amp);
    add(`tl.set("#a1-shake",{x:${sx},y:${sy}},${t});`);
    const cx = Math.round((R() - 0.5) * 50 * amp) + 8;
    const mx = Math.round((R() - 0.5) * 50 * amp) - 8;
    const op = k % 3 === 2 ? 0 : 0.9;
    add(`tl.set("#caro-c",{x:${cx},y:${Math.round((R() - 0.5) * 10)},opacity:${op}},${t});`);
    add(`tl.set("#caro-m",{x:${mx},y:${Math.round((R() - 0.5) * 10)},opacity:${op}},${t});`);
    add(`tl.set("#caro",{skewX:${Math.round((R() - 0.5) * 16 * amp)}},${t});`);
  }
  const t = r3(T.caro + 0.02 + n / FPS);
  add(`tl.set("#a1-shake",{x:0,y:0},${t});`);
  add(`tl.set("#caro-c",{x:0,y:0,opacity:0},${t});`);
  add(`tl.set("#caro-m",{x:0,y:0,opacity:0},${t});`);
  add(`tl.set("#caro",{skewX:0},${t});`);
}
words("pl", 5, T.noSeu, 0.11, 0.4);
// sai a dor, entra "Muita gente já descobriu:"
add(`tl.to("#a1-shake",{opacity:0,y:-60,duration:0.3,ease:"power2.in"},${r3(T.muita - 0.22)});`);
add(`tl.to("#notif-wrap",{y:-280,opacity:0,duration:0.32,ease:"power2.in"},${r3(T.muita - 0.25)});`);
add(`tl.to("#a1-glow",{opacity:0.35,duration:0.5,ease:"power1.out"},${r3(T.muita - 0.2)});`);
add(`tl.to("#a1-chart",{opacity:0.3,duration:0.5,ease:"power1.out"},${r3(T.muita - 0.2)});`);
words("mu", 4, T.muita, 0.16, 0.42);

// VIRADA — interruptor CPF -> CNPJ
const swOn = r3(T.turn - 0.16);
add(`tl.fromTo("#sw-wrap",{scale:0.4,opacity:0},{scale:1,opacity:1,duration:0.4,ease:"back.out(1.6)"},${r3(T.muita + 0.85)});`);
add(`tl.fromTo("#knob",{x:0},{x:${KNOB_R - KNOB_L},duration:0.24,ease:"power3.inOut"},${swOn});`);
add(`tl.fromTo("#knob-on",{opacity:0},{opacity:1,duration:0.2,ease:"power1.out"},${swOn});`);
add(`tl.fromTo("#sw-on",{opacity:0},{opacity:1,duration:0.2,ease:"power1.out"},${r3(swOn + 0.06)});`);
add(`tl.fromTo("#sw-cpf",{opacity:1},{opacity:0,duration:0.15,ease:"power1.out"},${swOn});`);
add(`tl.fromTo("#sw-cnpj",{opacity:0},{opacity:1,duration:0.2,ease:"power1.out"},${r3(swOn + 0.1)});`);
add(`tl.fromTo("#a2",{clipPath:"circle(0px at ${KNOB_R}px ${SW.cy}px)"},{clipPath:"circle(2300px at ${KNOB_R}px ${SW.cy}px)",duration:0.7,ease:"power3.out"},${r3(T.turn + 0.02)});`);
add(`tl.fromTo("#burst",{scale:0.3,opacity:1},{scale:4.2,opacity:0,duration:0.7,ease:"power2.out",immediateRender:false},${r3(T.turn + 0.02)});`);
add(`tl.set(["#t-muita","#a1-chart","#a1-glow"],{opacity:0},${r3(T.turn + 0.75)});`);
// interruptor vira um selo no alto
add(`tl.to("#sw-wrap",{scale:0.56,y:${330 - SW.cy},duration:0.5,ease:"power3.inOut"},${r3(T.turn + 0.55)});`);
add(`tl.to("#sw-wrap",{opacity:0,y:${300 - SW.cy},duration:0.3,ease:"power2.in"},${r3(T.com1 - 0.2)});`);
// mensalidade caindo
words("me", 2, T.mens - 0.15, 0.12, 0.4);
add(`tl.fromTo("#a2-chart-line",{attr:{"stroke-dashoffset":${pathLen(DOWN)}}},{attr:{"stroke-dashoffset":0},duration:1.3,ease:"power2.inOut"},${r3(T.mens - 0.1)});`);
add(`tl.fromTo("#a2-chart-glow",{attr:{"stroke-dashoffset":${pathLen(DOWN)}}},{attr:{"stroke-dashoffset":0},duration:1.3,ease:"power2.inOut"},${r3(T.mens - 0.1)});`);
add(`tl.fromTo("#a2-chart-head",{opacity:0,scale:0.3},{opacity:1,scale:1,duration:0.3,ease:"back.out(2)"},${r3(T.mens + 1.15)});`);
words("ca", 2, r3(T.cair - 0.3), 0.14, 0.4);
add(`tl.fromTo("#ba",{yPercent:110,opacity:0},{yPercent:0,opacity:1,duration:0.4,ease:"power4.out"},${r3(T.bastante - 0.05)});`);
add(`tl.fromTo("#swoosh-p",{attr:{"stroke-dashoffset":540}},{attr:{"stroke-dashoffset":0},duration:0.4,ease:"power2.out"},${r3(T.bastante + 0.2)});`);
// sai o gráfico, entra a foto em cartão
const a2out = r3(T.com1 - 0.2);
add(`tl.to(["#t-mens","#t-cair","#t-bastante","#swoosh","#a2-chart"],{opacity:0,y:-40,duration:0.3,ease:"power2.in"},${a2out});`);
const frameIn = r3(T.com1 - 0.05);
add(
  `tl.fromTo("#ph-wrap",{clipPath:"inset(640px 540px 1280px 540px round ${FRAME.r}px)"},{clipPath:"inset(${FRAME.y0}px ${W - FRAME.x1}px ${H - FRAME.y1}px ${FRAME.x0}px round ${FRAME.r}px)",duration:0.55,ease:"power3.out"},${frameIn});`,
);
add(`tl.fromTo("#ph-shadow",{scale:0,opacity:0},{scale:1,opacity:1,duration:0.55,ease:"power3.out"},${frameIn});`);
add(`tl.fromTo("#photo",{scale:${PHOTO_S - 0.03}},{scale:${PHOTO_S},duration:${r3(T.plano1 - 0.12 - frameIn - 0.02)},ease:"power2.out"},${frameIn});`);
words("cq", 4, T.com1, 0.1, 0.4);
add(`tl.fromTo("#shine",{x:0},{x:1900,duration:0.8,ease:"power2.inOut"},${r3(T.qualidade)});`);

// ATO 3 — a foto abre em tela cheia e a peça se monta
const open = r3(T.plano1 - 0.12);
add(`tl.to("#ph-wrap",{clipPath:"inset(0px 0px 0px 0px round 0px)",duration:0.75,ease:"power3.inOut"},${open});`);
add(`tl.to("#photo",{scale:1,duration:0.75,ease:"power3.inOut"},${open});`);
add(`tl.to("#ph-shadow",{opacity:0,duration:0.3,ease:"power1.out"},${open});`);
add(`tl.to("#cap",{opacity:0,y:30,duration:0.25,ease:"power2.in"},${open});`);
add(`tl.fromTo("#lav",{opacity:0},{opacity:1,duration:0.45,ease:"power1.inOut"},${r3(open + 0.1)});`);
add(`tl.fromTo("#ph-cam",{scale:1},{scale:1.035,duration:${r3(T.still - open - 0.75)},ease:"sine.inOut"},${r3(open + 0.75)});`);
add(`tl.fromTo("#block",{x:-${BLOCK.w + 40}},{x:0,duration:0.55,ease:"power3.out"},${r3(open + 0.2)});`);
words("tt", 3, r3(open + 0.45), 0.12, 0.42);
words("tp", 2, r3(T.para - 0.05), 0.18, 0.42);
// logo da Porto: pop grande no centro, depois vai para o canto da peça
const logoMove = r3(T.tres - 0.45);
const LS = 1.45; // escala do logo no pop
const lx = 540 - (LOGO.left + LOGO.w / 2);
const ly = 1325 - (LOGO.top + (LOGO.w * 32) / 140 / 2);
add(`tl.fromTo("#logo-pill",{scale:0.5,opacity:0},{scale:1,opacity:1,duration:0.42,ease:"back.out(1.7)"},${r3(T.porto - 0.08)});`);
add(`tl.fromTo("#logo",{x:${r3(lx)},y:${r3(ly)},scale:${LS * 0.6},opacity:0},{x:${r3(lx)},y:${r3(ly)},scale:${LS},opacity:1,duration:0.42,ease:"back.out(1.7)"},${r3(T.porto - 0.05)});`);
add(`tl.to("#logo-pill",{scale:0.6,opacity:0,duration:0.35,ease:"power2.in"},${logoMove});`);
add(`tl.to("#logo",{x:0,y:0,scale:1,duration:0.6,ease:"power3.inOut"},${logoMove});`);
add(`tl.fromTo("#foot",{opacity:0,y:10},{opacity:1,y:0,duration:0.45,ease:"power2.out"},${r3(logoMove + 0.55)});`);
// preço
add(`tl.fromTo("#lives",{opacity:0,y:20},{opacity:1,y:0,duration:0.4,ease:"power3.out"},${r3(T.tres - 0.05)});`);
add(`tl.fromTo("#price",{opacity:0,y:18},{opacity:1,y:0,duration:0.3,ease:"power3.out"},${r3(T.novecentos - 0.25)});`);
{
  const t0 = T.novecentos;
  const dur = T.lock - t0;
  const steps = Math.round(dur * FPS);
  const fmt = (v) => {
    const c = Math.round(v * 100);
    return `${Math.floor(c / 100)},${String(c % 100).padStart(2, "0")}`;
  };
  for (let k = 0; k <= steps; k++) {
    const p = k / steps;
    const v = 942.8 * (1 - Math.pow(1 - p, 3));
    add(`tl.set("#num",{textContent:"${k === steps ? "942,80" : fmt(v)}"},${r3(t0 + p * dur)});`);
  }
}
add(`tl.fromTo("#price-z",{scale:1},{scale:1.08,duration:0.12,ease:"power2.out"},${r3(T.lock)});`);
add(`tl.to("#price-z",{scale:1,duration:0.45,ease:"power2.out"},${r3(T.lock + 0.12)});`);
add(`tl.fromTo("#flare",{opacity:0,scale:0.7},{opacity:1,scale:1,duration:0.14,ease:"power2.out"},${r3(T.lock)});`);
add(`tl.to("#flare",{opacity:0,scale:1.25,duration:0.8,ease:"power2.out"},${r3(T.lock + 0.14)});`);
// benefícios
const cardIn = r3(T.items[0] - 0.35);
add(`tl.fromTo("#card",{y:380,opacity:0},{y:0,opacity:1,duration:0.5,ease:"power3.out"},${cardIn});`);
T.items.forEach((t, i) => {
  add(`tl.fromTo("#ic${i}",{scale:0.2,opacity:0},{scale:1,opacity:1,duration:0.4,ease:"back.out(1.8)"},${r3(t - 0.05)});`);
  add(`tl.fromTo("#it${i}",{opacity:0,x:-30},{opacity:1,x:0,duration:0.42,ease:"power3.out"},${r3(t)});`);
});
// CTA
const ctaIn = r3(T.faca - 0.15);
add(`tl.fromTo("#cta",{y:${H - CTA.top + 20}},{y:0,duration:0.55,ease:"power3.out"},${ctaIn});`);
add(`tl.fromTo("#cta-text",{opacity:0,y:18},{opacity:1,y:0,duration:0.4,ease:"power3.out"},${r3(T.simulacao - 0.2)});`);
add(`tl.fromTo("#btn-pop",{opacity:0,scale:0.7},{opacity:1,scale:1,duration:0.45,ease:"back.out(1.4)"},${r3(T.gratuita)});`);
const pulses = [];
for (let t = T.gratuita + 0.65; t + 1.0 <= T.still + 0.01; t += 1.0) pulses.push(r3(t));
pulses.forEach((t, i) => {
  const ir = i ? ",immediateRender:false" : "";
  add(`tl.fromTo("#btn",{scale:1},{scale:1.05,duration:0.5,ease:"sine.inOut"${ir}},${t});`);
  add(`tl.to("#btn",{scale:1,duration:0.5,ease:"sine.inOut"},${r3(t + 0.5)});`);
  add(`tl.fromTo("#btn-arrow",{x:0},{x:5,duration:0.5,ease:"sine.inOut"${ir}},${t});`);
  add(`tl.to("#btn-arrow",{x:0,duration:0.5,ease:"sine.inOut"},${r3(t + 0.5)});`);
});
[T.descubra, T.economizar].forEach((t, i) => {
  add(`tl.fromTo("#ring",{opacity:0.9,scale:1},{opacity:0,scale:1.3,duration:0.7,ease:"power2.out"${i ? ",immediateRender:false" : ""}},${r3(t)});`);
});
// "economizar": o preço brilha de novo
add(`tl.fromTo("#flare",{opacity:0,scale:0.8},{opacity:0.8,scale:1,duration:0.2,ease:"power2.out",immediateRender:false},${r3(T.economizar)});`);
add(`tl.to("#flare",{opacity:0,scale:1.2,duration:0.6,ease:"power2.out"},${r3(T.economizar + 0.2)});`);

// ───────────── áudio ─────────────
const SFX_LEN = {
  whoosh: 1.0,
  tick: 0.14,
  counter: 1.96,
  impact: 3.0,
  shimmer: 3.0,
  pop: 0.5,
  chime: 2.2,
  notify: 1.2,
  glitch: 0.6,
  switch: 0.25,
  drop: 0.9,
};
const SFX = [
  ["notify", 0.12, 0.5],
  ["tick", r3(T.pagando - 0.02), 0.3],
  ["impact", r3(T.caro), 0.5],
  ["glitch", r3(T.caro), 0.4],
  ["whoosh", r3(T.muita - 0.55), 0.25],
  ["pop", r3(T.muita + 0.85), 0.3],
  ["switch", r3(swOn + 0.06), 0.65],
  ["impact", r3(T.turn), 0.45],
  ["whoosh", r3(T.turn - 0.3), 0.35],
  ["shimmer", r3(T.turn + 0.05), 0.22],
  ["drop", r3(T.cair - 0.05), 0.45],
  ["whoosh", r3(frameIn - 0.35), 0.3],
  ["shimmer", r3(T.qualidade), 0.22],
  ["whoosh", r3(open - 0.2), 0.35],
  ["pop", r3(T.porto - 0.05), 0.45],
  ["chime", r3(T.porto), 0.32],
  ["whoosh", r3(logoMove - 0.3), 0.18],
  ["tick", r3(T.tres), 0.25],
  ["counter", r3(T.novecentos), 0.35],
  ["impact", r3(T.lock), 0.38],
  ["shimmer", r3(T.lock), 0.2],
  ["whoosh", r3(cardIn - 0.3), 0.22],
  ...T.items.flatMap((t) => [
    ["pop", r3(t - 0.05), 0.32],
    ["tick", r3(t + 0.05), 0.18],
  ]),
  ["whoosh", r3(ctaIn - 0.3), 0.3],
  ["pop", r3(T.gratuita), 0.4],
  ["tick", r3(T.descubra), 0.2],
  ["tick", r3(T.economizar), 0.15],
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
const sfxItems = SFX.map(([name, at, vol]) => ({ name, at, vol, dur: SFX_LEN[name] }));
const sfxTracks = allocTracks(sfxItems, 20);
const voDur = r3(Number(readFileSync(join(ROOT, "assets/voice/vo.dur"), "utf8")));
const audioTags = [
  `<audio id="el-bgm" src="assets/audio/bgm.wav" data-start="0" data-duration="${D}" data-track-index="1" data-volume="0.5"></audio>`,
  `<audio id="el-vo-voice" data-audio-group="voiceover" src="assets/voice/vo.wav" data-start="0" data-duration="${Math.min(voDur, D)}" data-track-index="10" data-volume="1"></audio>`,
  ...sfxItems.map(
    (x, i) =>
      `<audio id="el-sfx-${i}" src="assets/audio/sfx_${x.name}.wav" data-start="${x.at}" data-duration="${x.dur}" data-track-index="${sfxTracks[i]}" data-volume="${x.vol}"></audio>`,
  ),
].join("\n      ");

const scene = `<template>
<style>${css}</style>
<div id="stage" data-composition-id="filme" data-start="0" data-duration="${D}" data-width="${W}" data-height="${H}">${body}
</div>
<script>
(function(){
const tl = gsap.timeline({ paused: true });
${tl.join("\n")}
window.__timelines["filme"] = tl;
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
      html, body { width: ${W}px; height: ${H}px; overflow: hidden; background: ${DARK}; }
      #root { position: relative; width: ${W}px; height: ${H}px; overflow: hidden; background: ${DARK}; }
      .scene { position: absolute; inset: 0; width: 100%; height: 100%; }
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="${D}" data-width="${W}" data-height="${H}">
      <div id="el-filme" class="scene" data-composition-id="filme" data-composition-src="compositions/filme.html" data-start="0" data-duration="${D}" data-track-index="0"></div>
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
writeFileSync(join(ROOT, "compositions/filme.html"), scene);
writeFileSync(join(ROOT, "index.html"), html);
console.log(`filme: ${D}s, virada em ${T.turn}s, trava do preço em ${r3(T.lock)}s; ${tl.length} comandos, ${SFX.length} SFX`);
