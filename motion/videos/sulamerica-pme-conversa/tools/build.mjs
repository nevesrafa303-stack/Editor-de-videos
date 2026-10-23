#!/usr/bin/env node
// build.mjs — variação "conversa em áudios" do anúncio SulAmérica PME (3 vidas, R$ 1.770,30/mês com
// IOF), story 9:16 e feed 1:1.
//
//   node tools/build.mjs story   -> compositions/*.html + index.html
//   node tools/build.mjs feed    -> feed/compositions/*.html + feed/index.html
//
// A tela é uma conversa: a cliente manda áudios (voz Adriane) e o consultor responde (voz Kaique, a
// mesma da versão 1). Camadas: conversa (cabeçalho, bolhas de áudio com a forma de onda real de cada
// fala, rolagem, reações), cartões que abrem em zoom (gancho, preço, cotação), cartão final, legendas
// palavra a palavra com quem fala, dedo e grão. Tempos: assets/voice/vo.lines.json e vo.words.json
// (tools/prep_voice.py). Informações da cotação enviada (assets/ref/cotacao-sulamerica.jpg).

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
const k = pick(1, 0.78); // escala das bolhas no feed
const K = (v) => Math.round(v * k);

// paleta SulAmérica + tons de conversa
const NAVY = "#001E62";
const DEEP = "#00123D";
const ORANGE = "#F26522";
const ORANGE2 = "#F7941D";
const INK = "#0B1B4A";
const SOFT = "#EEF3FF";
const MUTED = "#4A5578";
const GREEN = "#0E9F4A";
const HL = "#FF9A4D"; // palavra do consultor na legenda
const CHAT = "#EFEAE2";
const OUT_BG = "#D9FDD3";
const META = "#54656F";
const TXT = "#111B21";
const WA = "#1FAA59";
const CLI_HL = "#7CF0A8"; // palavra da cliente na legenda
const TICK = "#53BDEB";

// ───────────── conversa ─────────────
const LINES = JSON.parse(readFileSync(join(ROOT, "assets/voice/vo.lines.json"), "utf8"));
const WORDS = JSON.parse(readFileSync(join(ROOT, "assets/voice/vo.words.json"), "utf8"));
const LN = Object.fromEntries(LINES.map((l) => [l.id, l]));
const D = Math.round((LINES[LINES.length - 1].end + 2.6) * 10) / 10; // igual ao TOTAL da trilha
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
T.cnpj = at("cnpj");
T.olha = at("olha");
T.cotacao = at("cotacao");
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
T.pessoas = at("pessoas");
T.serio2 = at("serio", T.serio1 + 0.5);
T.essas = at("essas");
T.aqui = at("aqui");
T.o = at("o", T.aqui);
T.abr = at("abrangencia");
T.apt = at("apartamento");
T.cop = at("coparticipacao");
T.ree = at("reembolso");
T.sem = at("sem");
T.insc = at("inscricao");
T.amei = at("amei");
T.faco = at("faco");
T.clica = at("clica");
T.botao = at("botao");
T.whats = at("whatsapp");

const HOOK_OUT = r3(Math.min(3.1, T.cnpj + 0.9));
const O2_IN = r3(T.sula - 0.42);
const O2_OUT = r3(LN.c2.start - 0.42);
const O3_IN = r3(T.serio2 + 0.3);
const O3_OUT = r3(LN.c3.start - 0.42);
const TAP = r3(T.whats + 0.2);
const END_IN = r3(TAP + 0.42);

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
  const shake = (sel, t, amp = 10) =>
    [1, -0.8, 0.5, -0.25, 0].forEach((q, i) => add(`tl.set("${sel}",{x:${r3(q * amp)},y:${r3(-q * amp * 0.6)}},${r3(t + i / FPS)});`));
  return { a, L, add, words, shake };
}

const ICONS = {
  check: `<path d="M12 25l8 8 16-18"/>`,
  globe: `<circle cx="24" cy="24" r="17"/><path d="M7 24h34M24 7c5 5 7 11 7 17s-2 12-7 17c-5-5-7-11-7-17s2-12 7-17z"/>`,
  bed: `<path d="M5 36V12M5 28h38v8M43 28v-4a6 6 0 0 0-6-6H22v10"/><circle cx="13" cy="22" r="4"/>`,
  percent: `<path d="M12 36L36 12"/><circle cx="14" cy="14" r="5"/><circle cx="34" cy="34" r="5"/>`,
  refund: `<path d="M38 18A15 15 0 1 0 39 30"/><path d="M39 9v9h-9"/><path d="M24 15v18M28 19.5c-1-1.5-2.5-2-4-2-2.5 0-4 1.3-4 3s1.6 2.6 4 3 4 1.3 4 3.2-1.8 3-4 3c-1.8 0-3.3-.6-4.4-2"/>`,
  ticket: `<path d="M6 16a4 4 0 0 0 0 8v8h36v-8a4 4 0 0 0 0-8V8H6z" transform="translate(0 4)"/><path d="M10 40L38 10"/>`,
  chat: `<path d="M24 6C13 6 5 13.5 5 23c0 3.6 1.2 7 3.3 9.7L6 42l9.7-3.1c2.5 1.2 5.3 1.9 8.3 1.9 11 0 19-7.5 19-17S35 6 24 6z"/><path d="M17 20c0 6 5 11 11 11l3-3-4-2-2 2c-2-1-4-3-5-5l2-2-2-4z"/>`,
  person: `<circle cx="24" cy="16" r="8"/><path d="M8 44c0-9 7-15 16-15s16 6 16 15"/>`,
  mic: `<rect x="17" y="6" width="14" height="24" rx="7"/><path d="M10 22c0 8 6 13 14 13s14-5 14-13M24 35v7"/>`,
  back: `<path d="M30 10L16 24l14 14"/>`,
  video: `<rect x="5" y="14" width="26" height="20" rx="4"/><path d="M31 21l12-7v20l-12-7"/>`,
  phone: `<path d="M14 6l6 10-4 4c2 5 6 9 11 11l4-4 10 6-3 7C24 40 8 24 7 9z"/>`,
};
const icon = (name, size, { id = "", sw = 3.4, color = "#fff", fill = "none" } = {}) =>
  `<svg ${id ? `id="${id}" ` : ""}viewBox="0 0 48 48" width="${size}" height="${size}" fill="${fill}" stroke="${color}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`;

// rosto surpreso (reação ao preço) e coração (reação aos benefícios)
const face = (size, id) => `<svg id="${id}" viewBox="0 0 100 100" width="${size}" height="${size}" aria-hidden="true">
  <circle cx="50" cy="50" r="46" fill="#FFD25A" stroke="${INK}" stroke-width="4"/>
  <path d="M26 30q8-8 16-2M58 28q8-6 16 2" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>
  <circle cx="35" cy="44" r="6" fill="${INK}"/><circle cx="65" cy="44" r="6" fill="${INK}"/>
  <ellipse cx="50" cy="70" rx="9" ry="12" fill="${INK}"/></svg>`;
const heart = (size) => `<svg viewBox="0 0 48 48" width="${size}" height="${size}" aria-hidden="true"><path d="M24 42S6 31 6 18a9.5 9.5 0 0 1 18-4.3A9.5 9.5 0 0 1 42 18c0 13-18 24-18 24z" fill="#E8455A"/></svg>`;
const ticks = (h) =>
  `<svg viewBox="0 0 36 20" width="${Math.round(h * 1.8)}" height="${h}" aria-hidden="true"><path d="M2 11l5 5 11-12M14 14l2 2 11-12" fill="none" stroke="${TICK}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

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

// ═════════════ geometria da conversa ═════════════
const G = pick(
  { hdH: 380, hdC: 300, av: 84, nm: 38, stt: 27, ib: 44, vpTop: 380, vpBot: 1340, inY: 1560, inH: 112, capY: 1378, capH: 104, capFs: 50, lbH: 36, lbFs: 21 },
  { hdH: 118, hdC: 59, av: 64, nm: 30, stt: 21, ib: 34, vpTop: 118, vpBot: 866, inY: 1004, inH: 62, capY: 900, capH: 86, capFs: 40, lbH: 30, lbFs: 17 },
);
const HG = { chip: 50, voice: 140, quote: 500, cta: 250 };
const MSG = [
  { id: "m0", type: "chip", t: 0 },
  { id: "m1", type: "voice", line: "c1", t: LN.c1.start - 0.3, time: "19:42" },
  { id: "m2", type: "voice", line: "k1", t: LN.k1.start - 0.12, time: "19:43" },
  { id: "m3", type: "quote", spk: "consultor", t: T.cotacao - 0.1, time: "19:43", react: { t: T.serio1, kind: "wow" } },
  { id: "m4", type: "voice", line: "c2", t: LN.c2.start - 0.28, time: "19:44" },
  { id: "m5", type: "voice", line: "k2", t: LN.k2.start - 0.12, time: "19:44", react: { t: T.amei, kind: "heart" } },
  { id: "m6", type: "voice", line: "c3", t: LN.c3.start - 0.28, time: "19:45" },
  { id: "m7", type: "voice", line: "k3", t: LN.k3.start - 0.12, time: "19:45" },
  { id: "m8", type: "cta", spk: "consultor", t: T.botao - 0.05, time: "19:45" },
];
{
  let y = K(24);
  let prev = null;
  for (const m of MSG) {
    m.spk = m.spk ?? (m.line ? LN[m.line].spk : null);
    m.w = m.type === "chip" ? K(130) : K(m.type === "voice" ? 680 : 620);
    m.h = K(HG[m.type]);
    if (prev) y += K(prev.spk && prev.spk === m.spk ? 10 : 22) + (prev.react ? K(26) : 0);
    m.y = y;
    m.x = m.type === "chip" ? Math.round((W - m.w) / 2) : m.spk === "cliente" ? W - K(28) - m.w : K(28);
    m.first = !prev || prev.spk !== m.spk;
    y += m.h;
    prev = m;
  }
  const HV = G.vpBot - G.vpTop;
  MSG.forEach((m) => (m.scroll = Math.max(0, m.y + m.h + K(20) - HV)));
}
const scrollAt = (t) => MSG.filter((m) => m.t <= t + 1e-6).reduce((s, m) => Math.max(s, m.scroll), 0);
const msg = (id) => MSG.find((m) => m.id === id);
// retângulo da prévia (cartão marinho) da cotação na tela, num instante
const quoteRect = (t) => {
  const m = msg("m3");
  return { x: m.x + K(10), y: G.vpTop + m.y - scrollAt(t) + K(10), w: K(600), h: K(290) };
};

// ═════════════ 1 · conversa ═════════════
// textos da conversa ficam de propósito sob os cartões em zoom e o cartão final
const UNDER = "data-layout-allow-occlusion data-layout-allow-overlap";
{
  const p = "ch";
  const { a, add } = TL(0);
  const PAT = `<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180' viewBox='0 0 180 180'><g fill='none' stroke='#001E62' stroke-opacity='.07' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'><path d='M30 18v22M19 29h22'/><path d='M124 58s-16-9-16-18a8 8 0 0 1 16-3 8 8 0 0 1 16 3c0 9-16 18-16 18z'/><circle cx='58' cy='122' r='11'/><path d='M140 124v18M131 133h18'/><path d='M84 74l8 8 15-17'/><path d='M14 150c6-6 12 6 18 0s12 6 18 0'/></g></svg>`;
  const ww = K(440);
  const wh = K(64);
  const css =
    base(p) +
    `
#ch-cam{transform-origin:50% 50%;}
#ch-bg{background-color:${CHAT};background-image:url("data:image/svg+xml,${encodeURIComponent(PAT)}");background-size:${K(180)}px ${K(180)}px;}
#ch-vp{position:absolute;left:0;top:${G.vpTop}px;width:${W}px;height:${G.inY - G.vpTop}px;overflow:hidden;}
#ch-ls{position:absolute;left:0;top:0;width:${W}px;height:${K(1900)}px;}
#ch-hd{position:absolute;left:0;top:0;width:${W}px;height:${G.hdH}px;background:${NAVY};box-shadow:0 4px 14px rgba(0,8,30,.25);}
.hd-i{position:absolute;top:${G.hdC - G.ib / 2}px;}
#ch-av{position:absolute;left:${pick(82, 58)}px;top:${G.hdC - G.av / 2}px;width:${G.av}px;height:${G.av}px;border-radius:50%;background:#fff url("assets/img/logo-wave.png") no-repeat ${-Math.round(G.av * 0.35)}px ${Math.round(G.av / 2 - ((G.av * 1.7 * 280) / 1097) * 0.2)}px/${Math.round(G.av * 1.7)}px auto;}
#ch-nm{position:absolute;left:${pick(186, 138)}px;top:${G.hdC - Math.round(G.nm * 1.12)}px;font-weight:600;font-size:${G.nm}px;line-height:1.1;white-space:nowrap;}
.st{position:absolute;left:${pick(186, 138)}px;top:${G.hdC + Math.round(G.nm * 0.12)}px;font-size:${G.stt}px;line-height:1.2;white-space:nowrap;}
#st-on{color:rgba(255,255,255,.8);}
#st-rec{color:${CLI_HL};opacity:0;display:flex;align-items:center;gap:${K(6)}px;}
.bb{position:absolute;border-radius:${K(24)}px;box-shadow:0 1px 1.5px rgba(11,20,26,.16);color:${TXT};}
.out{background:${OUT_BG};}
.in{background:#fff;}
.out.first{border-top-right-radius:${K(6)}px;}
.in.first{border-top-left-radius:${K(6)}px;}
.chip{position:absolute;border-radius:${K(14)}px;background:#FFFFFF;color:${META};font-weight:500;font-size:${K(22)}px;letter-spacing:.08em;display:flex;align-items:center;justify-content:center;box-shadow:0 1px 1.5px rgba(11,20,26,.12);}
.pp{position:absolute;left:${K(26)}px;top:${K(30)}px;width:${K(60)}px;height:${K(60)}px;}
.pp svg{position:absolute;left:0;top:0;}
.wf{position:absolute;left:${K(100)}px;top:${K(28)}px;width:${ww}px;height:${wh}px;}
.wg,.wc{position:absolute;left:0;top:0;width:100%;height:100%;}
.vb{position:absolute;width:${Math.max(3, K(6))}px;border-radius:${Math.max(3, K(6))}px;}
.out .g{background:#A3C4AC;}
.in .g{background:#C6CDD5;}
.out .c{background:${WA};}
.in .c{background:${ORANGE};}
.dot{position:absolute;left:${-K(10)}px;top:${Math.round(wh / 2 - K(10))}px;width:${K(20)}px;height:${K(20)}px;border-radius:50%;}
.out .dot{background:${WA};}
.in .dot{background:${ORANGE};}
.du{position:absolute;left:${K(100)}px;top:${K(100)}px;font-size:${K(22)}px;color:${META};background:inherit;}
.tm{position:absolute;top:${K(100)}px;font-size:${K(21)}px;color:${META};display:flex;align-items:center;gap:${K(6)}px;background:inherit;}
.av{position:absolute;left:${K(566)}px;top:${K(22)}px;width:${K(94)}px;height:${K(94)}px;border-radius:50%;overflow:hidden;}
.av-c{background:#CDE8D6;}
.av-c svg{position:absolute;left:${K(17)}px;top:${K(14)}px;}
.av-k{background:${NAVY} url("assets/img/logo-wave.png") no-repeat ${-K(33)}px ${K(39)}px/${K(160)}px auto;}
.mic{position:absolute;left:${K(552)}px;top:${K(84)}px;width:${K(38)}px;height:${K(38)}px;border-radius:50%;display:flex;align-items:center;justify-content:center;}
.out .mic{background:${WA};}
.in .mic{background:${ORANGE};}
.q-pv{position:absolute;left:${K(10)}px;top:${K(10)}px;width:${K(600)}px;height:${K(290)}px;border-radius:${K(18)}px;background:radial-gradient(90% 90% at 50% 10%,#0A2C80 0%,${NAVY} 55%,${DEEP} 100%);color:#fff;text-align:center;overflow:hidden;}
.q-lw{position:absolute;left:0;width:100%;top:${K(26)}px;}
.q-r1{position:absolute;left:0;width:100%;top:${K(108)}px;display:flex;justify-content:center;align-items:center;gap:${K(14)}px;}
.q-pme{font-weight:900;font-size:${K(52)}px;line-height:1;}
.q-ch{padding:${K(5)}px ${K(14)}px;border-radius:${K(10)}px;background:${ORANGE};font-weight:800;font-size:${K(24)}px;}
.q-pr{position:absolute;left:0;width:100%;top:${K(168)}px;font-weight:900;font-size:${K(70)}px;line-height:1;letter-spacing:-.04em;}
.q-pr small{font-size:.38em;letter-spacing:0;font-weight:700;margin-left:.12em;}
.q-io{position:absolute;left:0;width:100%;top:${K(248)}px;}
.q-io span{display:inline-block;padding:${K(3)}px ${K(14)}px;border-radius:${K(14)}px;background:rgba(255,255,255,.14);font-weight:600;font-size:${K(20)}px;}
.q-doc{position:absolute;left:${K(20)}px;top:${K(314)}px;width:${K(580)}px;height:${K(76)}px;display:flex;align-items:center;gap:${K(16)}px;}
.q-di{width:${K(56)}px;height:${K(66)}px;border-radius:${K(8)}px;background:${ORANGE};color:#fff;font-weight:800;font-size:${K(17)}px;display:flex;align-items:flex-end;justify-content:center;padding-bottom:${K(8)}px;}
.q-dt b{display:block;font-weight:600;font-size:${K(25)}px;line-height:1.25;background:#fff;}
.q-dt span{display:block;font-size:${K(20)}px;color:${META};background:#fff;}
.q-tx{position:absolute;left:${K(22)}px;top:${K(404)}px;font-size:${K(27)}px;background:inherit;}
.c-tx{position:absolute;left:${K(24)}px;top:${K(22)}px;font-size:${K(27)}px;background:inherit;}
.c-bw{position:absolute;left:${K(20)}px;top:${K(76)}px;width:${K(580)}px;height:${K(100)}px;}
.c-ring{position:absolute;left:0;top:0;width:100%;height:100%;border-radius:${K(50)}px;border:${K(5)}px solid rgba(37,211,102,.9);opacity:0;}
.c-bt{position:absolute;left:0;top:0;width:100%;height:100%;border-radius:${K(50)}px;background:${GREEN};color:#fff;display:flex;align-items:center;justify-content:center;gap:${K(14)}px;font-weight:800;font-size:${K(31)}px;box-shadow:0 ${K(8)}px ${K(20)}px rgba(14,159,74,.35);}
.c-sb{position:absolute;left:${K(24)}px;top:${K(192)}px;font-size:${K(20)}px;color:${META};background:inherit;}
.rx{position:absolute;width:${K(78)}px;height:${K(52)}px;border-radius:${K(26)}px;background:#fff;border:${K(3)}px solid ${CHAT};box-shadow:0 2px 6px rgba(11,20,26,.18);display:flex;align-items:center;justify-content:center;}
#ch-in{position:absolute;left:0;top:${G.inY}px;width:${W}px;height:${H - G.inY}px;}
#ch-if{position:absolute;left:${K(24)}px;top:0;width:${W - K(24) * 2 - G.inH - K(14)}px;height:${G.inH}px;border-radius:${G.inH}px;background:#fff;color:#8A96A0;font-size:${Math.round(G.inH * 0.3)}px;display:flex;align-items:center;padding-left:${Math.round(G.inH * 0.35)}px;box-shadow:0 1px 1.5px rgba(11,20,26,.12);}
#ch-mb{position:absolute;left:${W - K(24) - G.inH}px;top:0;width:${G.inH}px;height:${G.inH}px;border-radius:50%;background:${WA};display:flex;align-items:center;justify-content:center;}
`;
  const playSvg = (id, show) =>
    `<svg id="${id}" viewBox="0 0 60 60" width="${K(60)}" height="${K(60)}" style="opacity:${show ? 1 : 0}" aria-hidden="true">${
      show ? `<path d="M18 11L48 30 18 49z" fill="#54656F"/>` : `<rect x="15" y="12" width="10" height="36" rx="3" fill="#54656F"/><rect x="35" y="12" width="10" height="36" rx="3" fill="#54656F"/>`
    }</svg>`;
  const bubble = (m) => {
    const cls = `bb ${m.spk === "cliente" ? "out" : "in"}${m.first ? " first" : ""}`;
    const st = `left:${m.x}px;top:${m.y}px;width:${m.w}px;height:${m.h}px`;
    if (m.type === "chip") return `<div class="chip" id="${m.id}" style="${st}" ${UNDER}>HOJE</div>`;
    if (m.type === "voice") {
      const L = LN[m.line];
      const cli = L.spk === "cliente";
      const bw = Math.max(3, K(6));
      const step = (ww - bw) / (L.bars.length - 1);
      const bars = (c) =>
        L.bars
          .map((v) => Math.max(bw, Math.round(K(8) + v * (wh - K(8)))))
          .map((bh, i) => `<i class="vb ${c}" style="left:${Math.round(i * step)}px;top:${Math.round((wh - bh) / 2)}px;height:${bh}px"></i>`)
          .join("");
      const dur = `0:${String(Math.round(L.dur)).padStart(2, "0")}`;
      const av = cli
        ? `<div class="av av-c">${icon("person", K(60), { color: "#2F6B45", sw: 3.4 })}</div>`
        : `<div class="av av-k"></div>`;
      return `<div class="${cls}" id="${m.id}" style="${st}">
      <div class="pp">${playSvg(`${m.id}-pl`, true)}${playSvg(`${m.id}-pa`, false)}</div>
      <div class="wf"><div class="wg">${bars("g")}</div><div class="wc" id="${m.id}-wc">${bars("c")}</div><div class="dot" id="${m.id}-dot"></div></div>
      <div class="du" ${UNDER}>${dur}</div><div class="tm" style="right:${K(132)}px" ${UNDER}>${m.time}${cli ? ticks(K(16)) : ""}</div>
      ${av}<div class="mic">${icon("mic", K(24), { color: "#fff", sw: 3.6 })}</div>
    </div>`;
    }
    if (m.type === "quote")
      return `<div class="${cls}" id="${m.id}" style="${st}">
      <div class="q-pv"><div class="q-lw">${logo("q", K(260))}</div>
        <div class="q-r1"><span class="q-pme d" ${UNDER}>PME</span><span class="q-ch d" ${UNDER}>3 vidas</span></div>
        <div class="q-pr d" ${UNDER}>R$ 1.770,30<small ${UNDER}>/mês</small></div>
        <div class="q-io"><span ${UNDER}>já com IOF</span></div></div>
      <div class="q-doc"><div class="q-di d" ${UNDER}>PDF</div><div class="q-dt"><b ${UNDER}>Cotação SulAmérica PME.pdf</b><span ${UNDER}>Capital · 03 a 04 vidas · Apólice 12 meses</span></div></div>
      <div class="q-tx" ${UNDER}>Segue a cotação pra 3 vidas</div>
      <div class="tm" style="right:${K(20)}px;top:${K(458)}px" ${UNDER}>${m.time}</div>
    </div>`;
    return `<div class="${cls}" id="${m.id}" style="${st}">
      <div class="c-tx" ${UNDER}>Toque no botão e fale comigo:</div>
      <div class="c-bw"><div class="c-ring" id="c-ring"></div><div class="c-bt d" id="c-bt">${icon("chat", K(44), { color: "#fff", sw: 3.2 })}<span ${UNDER}>Fale comigo no WhatsApp</span></div></div>
      <div class="c-sb" ${UNDER}>Cotação SulAmérica PME · 3 vidas</div>
      <div class="tm" style="right:${K(20)}px;top:${K(214)}px" ${UNDER}>${m.time}</div>
    </div>`;
  };
  const reacts = MSG.filter((m) => m.react)
    .map((m) => `<div class="rx" id="${m.id}-rx" style="left:${m.x + K(24)}px;top:${m.y + m.h - K(16)}px">${m.react.kind === "wow" ? face(K(36), `${m.id}-rf`) : heart(K(34))}</div>`)
    .join("\n      ");
  const body = `
  <div id="ch-cam" class="${p}-full">
    <div id="ch-bg" class="${p}-full"></div>
    <div id="ch-vp"><div id="ch-ls" data-layout-allow-overflow>
      ${MSG.map(bubble).join("\n      ")}
      ${reacts}
    </div></div>
    <div id="ch-in"><div id="ch-if" ${UNDER}>Mensagem</div><div id="ch-mb">${icon("mic", Math.round(G.inH * 0.5), { color: "#fff", sw: 3.6 })}</div></div>
    <div id="ch-hd">
      <div class="hd-i" style="left:${pick(22, 14)}px">${icon("back", G.ib, { color: "#fff", sw: 4 })}</div>
      <div id="ch-av"></div>
      <div id="ch-nm" ${UNDER}>Consultor SulAmérica PME</div>
      <div class="st" id="st-on" ${UNDER}>online</div>
      <div class="st" id="st-rec">${icon("mic", Math.round(G.stt * 1.1), { color: CLI_HL, sw: 3.6 })}<span ${UNDER}>gravando áudio…</span></div>
      <div class="hd-i" style="left:${pick(870, 902)}px">${icon("video", G.ib, { color: "#fff", sw: 3.4 })}</div>
      <div class="hd-i" style="left:${pick(966, 986)}px">${icon("phone", Math.round(G.ib * 0.92), { color: "#fff", sw: 3.4 })}</div>
    </div>
  </div>`;
  // bolhas entrando e a conversa rolando
  let sc = 0;
  for (const m of MSG) {
    const t = r3(Math.max(0, m.t));
    const orig = m.type === "chip" ? "50% 50%" : m.spk === "cliente" ? "100% 100%" : "0% 100%";
    add(`tl.fromTo("#${m.id}",{opacity:0,scale:0.7,y:${K(30)}},{opacity:1,scale:1,y:0,duration:0.32,ease:"back.out(1.7)",transformOrigin:"${orig}"},${t});`);
    if (m.scroll > sc) {
      add(`tl.fromTo("#ch-ls",{y:${-sc}},{y:${-m.scroll},duration:0.38,ease:"power2.out",immediateRender:false},${r3(Math.max(0, t - 0.04))});`);
      sc = m.scroll;
    }
    if (m.type === "voice") {
      const L = LN[m.line];
      add(`tl.set("#${m.id}-pl",{opacity:0},${r3(L.start)});`);
      add(`tl.set("#${m.id}-pa",{opacity:1},${r3(L.start)});`);
      add(`tl.fromTo("#${m.id}-wc",{clipPath:"inset(0% 100% 0% 0%)"},{clipPath:"inset(0% 0% 0% 0%)",duration:${r3(L.dur)},ease:"none"},${r3(L.start)});`);
      add(`tl.fromTo("#${m.id}-dot",{x:0},{x:${ww},duration:${r3(L.dur)},ease:"none"},${r3(L.start)});`);
      add(`tl.set("#${m.id}-pl",{opacity:1},${r3(L.end)});`);
      add(`tl.set("#${m.id}-pa",{opacity:0},${r3(L.end)});`);
    }
    if (m.react) {
      add(`tl.fromTo("#${m.id}-rx",{scale:0,opacity:0},{scale:1,opacity:1,duration:0.4,ease:"back.out(3)"},${r3(m.react.t)});`);
      add(`tl.fromTo("#${m.id}-rx",{y:0},{y:${-K(10)},duration:0.14,ease:"sine.out",yoyo:true,repeat:1,immediateRender:false},${r3(m.react.t + 0.4)});`);
    }
  }
  // "gravando áudio…" no cabeçalho antes de cada resposta do consultor
  for (const [c, kk] of [
    ["c1", "k1"],
    ["c2", "k2"],
    ["c3", "k3"],
  ]) {
    const a0 = r3(LN[c].end - 0.35);
    const b0 = r3(LN[kk].start - 0.12);
    add(`tl.set("#st-on",{opacity:0},${a0});`);
    add(`tl.set("#st-rec",{opacity:1},${a0});`);
    add(`tl.set("#st-on",{opacity:1},${b0});`);
    add(`tl.set("#st-rec",{opacity:0},${b0});`);
  }
  // "Sério?!" da cliente: a conversa dá um soquinho
  add(`tl.fromTo("#ch-cam",{scale:1},{scale:1.03,duration:0.16,ease:"power2.out"},${r3(T.serio1)});`);
  add(`tl.to("#ch-cam",{scale:1,duration:0.6,ease:"power2.inOut"},${r3(T.serio1 + 0.16)});`);
  // "Clica no botão": brilho e toque no botão da bolha
  add(`tl.fromTo("#c-bt",{scale:1},{scale:0.94,duration:0.1,ease:"power2.in"},${TAP});`);
  add(`tl.to("#c-bt",{scale:1,duration:0.28,ease:"back.out(2)"},${r3(TAP + 0.1)});`);
  add(`tl.fromTo("#c-ring",{opacity:0.95,scale:1},{opacity:0,scale:1.12,duration:0.6,ease:"power2.out"},${r3(TAP + 0.04)});`);
  scenes.push({ st: 0, track: 0, ...scene(p, END_IN + 0.6, css, body, a) });
}

// ═════════════ 2 · cartões em zoom: gancho, preço, cotação ═════════════
{
  const p = "ov";
  const { a, add, shake } = TL(0);
  // gancho
  const hk = pick({ x: 150, y: 760, w: 780, h: 300, t1: 104, t2: 44 }, { x: 210, y: 400, w: 660, h: 240, t1: 82, t2: 36 });
  // preço (O2) e cotação (O3)
  const C2 = pick({ x: 70, y: 430, w: 940, h: 880 }, { x: 140, y: 140, w: 800, h: 712 });
  const g2 = pick(
    { lw: 500, ly: 56, my: 220, ms: 104, bh: 74, bs: 34, ay: 340, as: 28, vy: 400, vs: 54, ps: 82, ry: 530, rs: 136, uy: 690, us: 44, kx: 520, ky: 752, ks: 44 },
    { lw: 400, ly: 40, my: 170, ms: 84, bh: 60, bs: 28, ay: 266, as: 23, vy: 316, vs: 44, ps: 66, ry: 418, rs: 112, uy: 552, us: 36, kx: 440, ky: 606, ks: 36 },
  );
  const C3 = pick({ x: 70, y: 420, w: 940, h: 920 }, { x: 140, y: 126, w: 800, h: 750 });
  const g3 = pick(
    { hh: 130, hs: 42, ss: 24, ly: 156, rows: [194, 292, 390], rh: 86, rs: 42, ic: 56, fy: 500, fh: 110, fl: 32, fp: 64, cy: [640, 732, 824], ch: 76, cs: 29 },
    { hh: 106, hs: 34, ss: 20, ly: 126, rows: [158, 238, 318], rh: 70, rs: 34, ic: 46, fy: 406, fh: 90, fl: 26, fp: 52, cy: [520, 596, 672], ch: 62, cs: 24 },
  );
  const R = rollPrice("o2", g2.rs, [1, 7, 7, 0, 3, 0]);
  const pad = 46;
  const ages = [
    ["0 a 18 anos", "R$ 379,08"],
    ["29 a 33 anos", "R$ 652,21"],
    ["34 a 38 anos", "R$ 697,86"],
  ];
  const chips = [
    ["globe", "Nacional", T.abr],
    ["bed", "Apartamento", T.apt],
    ["percent", "Coparticipação 30%", T.cop],
    ["refund", "Reembolso", T.ree],
    ["ticket", "Sem taxa de inscrição", T.sem],
  ];
  const cw = Math.round((C3.w - pad * 2 - 18) / 2);
  const chipPos = (i) => (i < 4 ? { x: pad + (i % 2) * (cw + 18), y: g3.cy[i >> 1], w: cw } : { x: pad, y: g3.cy[2], w: C3.w - pad * 2 });
  const css =
    base(p) +
    R.css +
    `
#ov-dim{background:rgba(0,10,30,.62);opacity:0;}
#hk-w{position:absolute;left:${hk.x}px;top:${hk.y}px;width:${hk.w}px;height:${hk.h}px;opacity:0;}
#hk{position:absolute;left:0;top:0;width:100%;height:100%;border-radius:${K(40)}px;background:${ORANGE};box-shadow:0 30px 70px rgba(0,8,30,.35);transform:rotate(-3deg);text-align:center;}
#hk-t1{position:absolute;left:0;width:100%;top:${Math.round(hk.h * 0.14)}px;font-weight:900;font-size:${hk.t1}px;line-height:1;letter-spacing:-.02em;}
#hk-t2{position:absolute;left:0;width:100%;top:${Math.round(hk.h * 0.6)}px;display:flex;justify-content:center;align-items:center;gap:${K(14)}px;font-weight:800;font-size:${hk.t2}px;}
.ovc{position:absolute;opacity:0;}
#o2{position:absolute;left:0;top:0;width:100%;height:100%;border-radius:${K(44)}px;background:radial-gradient(90% 60% at 50% 18%,#0A2C80 0%,${NAVY} 50%,${DEEP} 100%);box-shadow:0 40px 90px rgba(0,8,30,.6);overflow:hidden;}
#o2-lw{position:absolute;left:0;width:100%;top:${g2.ly}px;text-align:center;}
#o2-row{position:absolute;left:0;width:100%;top:${g2.my}px;display:flex;justify-content:center;align-items:center;gap:${K(24)}px;}
#o2-pme{font-weight:900;font-size:${g2.ms}px;line-height:1;letter-spacing:-.02em;}
#o2-bd{display:inline-flex;height:${g2.bh}px;border-radius:10px;overflow:hidden;font-weight:800;font-size:${g2.bs}px;box-shadow:0 10px 24px rgba(0,8,30,.4);}
#o2-bd span{display:flex;align-items:center;padding:0 ${K(20)}px;}
#o2-bd .o{background:${ORANGE};}
#o2-bd .n{background:#fff;color:${NAVY};}
#o2-ap{position:absolute;left:0;width:100%;top:${g2.ay}px;text-align:center;font-weight:500;font-size:${g2.as}px;color:rgba(255,255,255,.85);letter-spacing:.04em;}
#o2-vr{position:absolute;left:0;width:100%;top:${g2.vy}px;display:flex;justify-content:center;align-items:center;gap:${K(16)}px;}
.o2-p{width:${g2.ps}px;height:${g2.ps}px;border-radius:50%;background:rgba(255,255,255,.12);border:3px solid rgba(255,255,255,.5);display:flex;align-items:center;justify-content:center;}
#o2-v{font-weight:800;font-size:${g2.vs}px;margin-left:${K(12)}px;}
#o2-rw{position:absolute;left:0;width:100%;top:${g2.ry - 10}px;height:${g2.rs + 20}px;text-align:center;overflow:hidden;}
#o2-pr{display:inline-block;margin-top:10px;font-weight:900;font-size:${g2.rs}px;letter-spacing:-.045em;white-space:nowrap;text-shadow:0 0 40px rgba(242,101,34,.45);}
#o2-um{position:absolute;left:0;width:100%;top:${g2.uy}px;text-align:center;font-weight:700;font-size:${g2.us}px;color:rgba(255,255,255,.9);}
#o2-kw{position:absolute;left:${g2.kx}px;top:${g2.ky}px;}
#o2-k{padding:${K(12)}px ${K(28)}px;border-radius:${K(18)}px;background:${ORANGE};font-weight:900;font-size:${g2.ks}px;letter-spacing:.02em;transform:rotate(-6deg);box-shadow:0 16px 40px rgba(0,8,30,.45);border:4px solid rgba(255,255,255,.85);}
#o3{position:absolute;left:0;top:0;width:100%;height:100%;border-radius:${K(44)}px;background:#fff;color:${INK};overflow:hidden;box-shadow:0 40px 90px rgba(0,8,30,.6);}
#o3-hd{position:absolute;left:0;top:0;width:100%;height:${g3.hh}px;background:${NAVY};}
#o3-ht{position:absolute;left:${pad}px;top:${Math.round(g3.hh / 2 - g3.hs * 0.95)}px;font-weight:800;font-size:${g3.hs}px;color:#fff;}
#o3-hs{position:absolute;left:${pad}px;top:${Math.round(g3.hh / 2 + g3.hs * 0.25)}px;font-weight:500;font-size:${g3.ss}px;color:rgba(255,255,255,.85);}
#o3-hb{position:absolute;right:${pad}px;top:${Math.round(g3.hh / 2 - K(26))}px;height:${K(52)}px;padding:0 ${K(20)}px;border-radius:${K(26)}px;background:${ORANGE};display:flex;align-items:center;font-family:"Mont",Arial,sans-serif;font-weight:800;font-size:${Math.round(g3.ss * 1.05)}px;color:#fff;}
.o3-lb{position:absolute;top:${g3.ly}px;font-weight:600;font-size:${Math.round(g3.ss * 0.92)}px;color:${MUTED};letter-spacing:.08em;}
.o3-r{position:absolute;left:${pad - 16}px;width:${C3.w - (pad - 16) * 2}px;height:${g3.rh}px;border-radius:${K(22)}px;background:${SOFT};}
.o3-ic{position:absolute;left:${K(16)}px;top:${Math.round((g3.rh - g3.ic) / 2)}px;width:${g3.ic}px;height:${g3.ic}px;border-radius:50%;background:${NAVY};display:flex;align-items:center;justify-content:center;}
.o3-a{position:absolute;left:${K(16) + g3.ic + K(22)}px;top:${Math.round(g3.rh / 2 - g3.rs * 0.62)}px;font-weight:800;font-size:${g3.rs}px;line-height:1;}
.o3-v{position:absolute;right:${K(24)}px;top:${Math.round(g3.rh / 2 - g3.rs * 0.62)}px;font-weight:800;font-size:${g3.rs}px;line-height:1;color:${NAVY};}
#o3-ci{position:absolute;left:${pad - 30}px;top:${g3.rows[0] - 22}px;}
#o3-f{position:absolute;left:${pad - 16}px;top:${g3.fy}px;width:${C3.w - (pad - 16) * 2}px;height:${g3.fh}px;border-radius:${K(28)}px;background:${ORANGE};color:#fff;box-shadow:0 18px 40px rgba(242,101,34,.35);}
#o3-fl{position:absolute;left:${K(30)}px;top:${Math.round(g3.fh / 2 - g3.fl * 0.6)}px;font-weight:800;font-size:${g3.fl}px;line-height:1.05;}
#o3-fp{position:absolute;right:${K(30)}px;top:${Math.round(g3.fh / 2 - g3.fp * 0.62)}px;font-weight:900;font-size:${g3.fp}px;line-height:1;letter-spacing:-.04em;}
.o3-c{position:absolute;height:${g3.ch}px;border-radius:${g3.ch}px;background:#E7F7EE;color:${NAVY};display:flex;align-items:center;gap:${K(12)}px;padding-left:${K(10)}px;font-weight:800;font-size:${g3.cs}px;white-space:nowrap;}
.o3-ck{width:${g3.ch - K(18)}px;height:${g3.ch - K(18)}px;border-radius:50%;background:${GREEN};display:flex;align-items:center;justify-content:center;flex:none;}
`;
  const ciW = Math.round(C3.w * 0.56);
  const ciH = g3.rows[2] + g3.rh - g3.rows[0] + 44;
  const body = `
  <div id="ov-dim" class="${p}-full"></div>
  <div id="hk-w"><div id="hk"><div id="hk-t1" class="d">Tem CNPJ?</div><div id="hk-t2" class="d"><svg viewBox="0 0 48 48" width="${Math.round(hk.t2 * 1.3)}" height="${Math.round(hk.t2 * 1.3)}" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 18h8l10-8v28l-10-8H6z" fill="#fff"/><path id="hk-w1" d="M30 18c2.5 3.5 2.5 8.5 0 12"/><path id="hk-w2" d="M36 13c4.5 6 4.5 16 0 22"/></svg><span>Ouve essa conversa</span></div></div></div>
  <div id="o2-w" class="ovc" style="left:${C2.x}px;top:${C2.y}px;width:${C2.w}px;height:${C2.h}px"><div id="o2">
    <div id="o2-lw">${logo("o2", g2.lw)}</div>
    <div id="o2-row"><span id="o2-pme" class="d">PME</span><span id="o2-bd" class="d"><span class="o">Capital</span><span class="n">03 a 04 vidas</span></span></div>
    <div id="o2-ap">Apólice 12 meses</div>
    <div id="o2-vr">${[0, 1, 2].map((i) => `<span class="o2-p" id="o2-p${i}">${icon("person", Math.round(g2.ps * 0.6), { color: "#fff", sw: 3.4 })}</span>`).join("")}<span id="o2-v" class="d">3 vidas</span></div>
    <div id="o2-rw"><span id="o2-pr" class="d">${R.html}</span><div id="o2-psw" class="sweep" aria-hidden="true"></div></div>
    <div id="o2-um" class="d">por mês</div>
    <div id="o2-kw"><div id="o2-k" class="d">JÁ COM IOF</div></div>
  </div></div>
  <div id="o3-w" class="ovc" style="left:${C3.x}px;top:${C3.y}px;width:${C3.w}px;height:${C3.h}px"><div id="o3">
    <div id="o3-hd"><div id="o3-ht" class="d">Sua cotação</div><div id="o3-hs">SulAmérica PME · Capital · Apólice 12 meses</div><div id="o3-hb">3 vidas</div></div>
    <div class="o3-lb" style="left:${pad}px">FAIXA ETÁRIA</div><div class="o3-lb" style="right:${pad}px">VALOR</div>
    ${ages
      .map(
        ([a_, v], i) => `<div class="o3-r" id="o3-r${i}" style="top:${g3.rows[i]}px"><div class="o3-ic">${icon("person", Math.round(g3.ic * 0.58), { color: "#fff", sw: 3.6 })}</div>
      <div class="o3-a d">${a_}</div><div class="o3-v d">${v}</div></div>`,
      )
      .join("")}
    <svg id="o3-ci" viewBox="0 0 ${ciW} ${ciH}" width="${ciW}" height="${ciH}" aria-hidden="true" data-layout-allow-overlap><path id="o3-cp" d="M${ciW * 0.52} ${6} C${ciW * 0.95} ${4} ${ciW - 6} ${ciH * 0.2} ${ciW - 8} ${ciH * 0.5} C${ciW - 10} ${ciH * 0.86} ${ciW * 0.7} ${ciH - 6} ${ciW * 0.42} ${ciH - 8} C${ciW * 0.12} ${ciH - 10} 8 ${ciH * 0.78} 8 ${ciH * 0.46} C8 ${ciH * 0.14} ${ciW * 0.22} ${10} ${ciW * 0.6} ${16}" fill="none" stroke="${ORANGE}" stroke-width="${K(7)}" stroke-linecap="round" pathLength="1" stroke-dasharray="1 1" stroke-dashoffset="1"/></svg>
    <div id="o3-f"><div id="o3-fl" class="d">Total<br>com IOF</div><div id="o3-fp" class="d">R$ 1.770,30</div></div>
    ${chips
      .map(([ic, tx], i) => {
        const q = chipPos(i);
        return `<div class="o3-c d" id="o3-c${i}" style="left:${q.x}px;top:${q.y}px;width:${q.w}px"><span class="o3-ck">${icon(ic, Math.round((g3.ch - K(18)) * 0.6), { color: "#fff", sw: 3.6 })}</span>${tx}</div>`;
      })
      .join("")}
  </div></div>`;
  // gancho: "Tem CNPJ? Ouve essa conversa"
  add(`tl.fromTo("#hk-w",{scale:0.4,opacity:0},{scale:1,opacity:1,duration:0.45,ease:"back.out(2)"},0.08);`);
  add(`tl.fromTo(["#hk-w1","#hk-w2"],{opacity:0.25},{opacity:1,duration:0.3,ease:"sine.inOut",stagger:0.15,repeat:5,yoyo:true},0.4);`);
  add(`tl.to("#hk-w",{scale:0.85,y:${-K(40)},opacity:0,duration:0.3,ease:"power2.in"},${HOOK_OUT});`);
  // zoom a partir da prévia da cotação na conversa
  const zoom = (sel, C, rect, tIn, tOut) => {
    const s = r3(rect.w / C.w);
    const dx = Math.round(rect.x + rect.w / 2 - (C.x + C.w / 2));
    const dy = Math.round(rect.y + rect.h / 2 - (C.y + C.h / 2));
    add(`tl.fromTo("#ov-dim",{opacity:0},{opacity:1,duration:0.35,ease:"power2.out",immediateRender:false},${tIn});`);
    add(`tl.fromTo("${sel}",{x:${dx},y:${dy},scale:${s},opacity:0},{x:0,y:0,scale:1,opacity:1,duration:0.45,ease:"power3.out"},${tIn});`);
    add(`tl.to("${sel}",{x:${dx},y:${dy},scale:${s},opacity:0,duration:0.38,ease:"power3.in"},${tOut});`);
    add(`tl.to("#ov-dim",{opacity:0,duration:0.38,ease:"power2.in"},${tOut});`);
  };
  zoom("#o2-w", C2, quoteRect(O2_IN), O2_IN, O2_OUT);
  zoom("#o3-w", C3, quoteRect(O3_IN), O3_IN, O3_OUT);
  // preço: "SulAmérica PME, três vidas, por R$ 1.770,30 por mês… já com IOF!"
  add(`tl.fromTo("#o2-lgw",{clipPath:"inset(0% 100% 0% 0%)"},{clipPath:"inset(0% 0% 0% 0%)",duration:0.6,ease:"power2.inOut"},${r3(T.sula - 0.2)});`);
  add(`tl.fromTo("#o2-lgt",{opacity:0,y:14},{opacity:1,y:0,duration:0.4,ease:"power3.out"},${r3(T.sula + 0.05)});`);
  add(`tl.fromTo("#o2-pme",{scale:1.5,opacity:0},{scale:1,opacity:1,duration:0.3,ease:"power4.out"},${r3(T.pme - 0.05)});`);
  add(`tl.fromTo("#o2-bd",{x:60,opacity:0},{x:0,opacity:1,duration:0.4,ease:"power3.out"},${r3(T.pme + 0.15)});`);
  add(`tl.fromTo("#o2-ap",{opacity:0},{opacity:1,duration:0.4},${r3(T.pme + 0.35)});`);
  [0, 1, 2].forEach((i) => add(`tl.fromTo("#o2-p${i}",{scale:0,y:20},{scale:1,y:0,duration:0.4,ease:"back.out(2.4)"},${r3(T.tres + i * 0.12)});`));
  add(`tl.fromTo("#o2-v",{opacity:0,x:-20},{opacity:1,x:0,duration:0.35,ease:"power3.out"},${r3(T.vidas - 0.05)});`);
  const t0 = r3(T.mil - 0.08);
  add(`tl.fromTo("#o2-pr",{opacity:0},{opacity:1,duration:0.08},${t0});`);
  add(`tl.fromTo("#o2-rs",{scale:1.4,opacity:0},{scale:1,opacity:1,duration:0.3,ease:"power4.out"},${t0});`);
  const lands = [T.mil + 0.14, T.setecentos + 0.14, T.setenta + 0.12, T.setenta + 0.3, T.trinta + 0.12, T.trinta + 0.3];
  lands.forEach((tl_, i) => add(`tl.fromTo("#o2-ds${i}",{y:0},{y:${-R.finals[i] * R.LH},duration:${r3(tl_ - t0)},ease:"power3.out"},${t0});`));
  add(`tl.fromTo("#o2-psw",{xPercent:-100},{xPercent:100,duration:0.8,ease:"power2.inOut"},${r3(T.centavos + 0.1)});`);
  add(`tl.fromTo("#o2-um",{opacity:0,y:20},{opacity:1,y:0,duration:0.35,ease:"power3.out"},${r3(T.mes - 0.15)});`);
  add(`tl.fromTo("#o2-kw",{scale:2.2,opacity:0},{scale:1,opacity:1,duration:0.2,ease:"power4.in"},${r3(T.iof - 0.12)});`);
  shake("#o2", r3(T.iof + 0.08), pick(10, 8));
  // cotação: idades circuladas no "essas idades aqui, ó" e os benefícios marcados quando ditos
  ages.forEach((_, i) => add(`tl.fromTo("#o3-r${i}",{x:80,opacity:0},{x:0,opacity:1,duration:0.35,ease:"back.out(1.6)"},${r3(O3_IN + 0.25 + i * 0.1)});`));
  add(`tl.fromTo("#o3-f",{scale:0.9,opacity:0},{scale:1,opacity:1,duration:0.4,ease:"back.out(1.8)"},${r3(O3_IN + 0.5)});`);
  add(`tl.to("#o3-cp",{attr:{"stroke-dashoffset":0},duration:0.6,ease:"power2.inOut"},${r3(T.essas - 0.05)});`);
  add(`tl.fromTo("#o3-ci",{scale:1},{scale:1.04,duration:0.15,ease:"sine.out",yoyo:true,repeat:1,transformOrigin:"50% 50%"},${r3(T.o)});`);
  chips.forEach(([, , t], i) => add(`tl.fromTo("#o3-c${i}",{scale:0.6,opacity:0},{scale:1,opacity:1,duration:0.35,ease:"back.out(2.2)"},${r3(t - 0.08)});`));
  scenes.push({ st: 0, track: 1, ...scene(p, D, css, body, a) });
}

// ═════════════ 3 · cartão final ═════════════
const BTN = pick({ x: 90, y: 1030, w: 900, h: 136 }, { x: 140, y: 580, w: 800, h: 100 });
{
  const p = "en";
  const st = END_IN;
  const dur = D - st;
  const { a, add } = TL(st);
  const g = pick(
    { lw: 500, ly: 270, ty: 430, ts: 84, cy: 650, ch: 340, cl: 38, cp: 108, cx: 70, cw: 940, ks: 24, bt: 48, fy: 1196, fs: 19, y1: 30, y2: 82, y3: 200, y4: 256 },
    { lw: 340, ly: 24, ty: 134, ts: 56, cy: 284, ch: 270, cl: 30, cp: 84, cx: 140, cw: 800, ks: 19, bt: 40, fy: 702, fs: 16, y1: 22, y2: 64, y3: 158, y4: 204 },
  );
  const css =
    base(p) +
    `
#en-wrap{background:radial-gradient(90% 60% at 50% 22%,#0A2C80 0%,${NAVY} 45%,${DEEP} 100%);}
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
#en-ring{position:absolute;inset:0;border-radius:${BTN.h}px;border:5px solid rgba(37,211,102,.9);opacity:0;}
#en-btn{position:absolute;inset:0;border-radius:${BTN.h}px;background:${GREEN};display:flex;align-items:center;justify-content:center;gap:22px;font-weight:800;font-size:${g.bt}px;box-shadow:0 20px 50px rgba(14,159,74,.5),inset 0 2px 0 rgba(255,255,255,.3);overflow:hidden;}
#en-f{position:absolute;left:${pick(70, 60)}px;width:${W - pick(140, 120)}px;top:${g.fy}px;text-align:center;font-size:${g.fs}px;line-height:1.4;color:rgba(255,255,255,.8);}
`;
  const body = `
  <div id="en-wrap" class="${p}-full">
    <div id="en-lw">${logo(p, g.lw)}</div>
    <div id="en-t" class="d">${wspans("ena", "Tem CNPJ?")}<br>${wspans("enb", "Faça sua cotação", "hl")}</div>
    <div id="en-c">
      <div id="en-cl" class="d">SulAmérica PME · 3 vidas</div>
      <div id="en-cp" class="d">R$ 1.770,30<small>/mês</small></div>
      <div id="en-ci"><span>já com IOF</span></div>
      <div id="en-ck">Nacional · Apartamento · Coparticipação · Reembolso · Sem taxa de inscrição</div>
    </div>
    <div id="en-bw"><div id="en-ring"></div><div id="en-btn" class="d">${icon("chat", Math.round(g.bt * 1.25), { id: "en-chat", color: "#fff", sw: 3.2 })}<span>Fale comigo no WhatsApp</span><div id="en-bsw" class="sweep" aria-hidden="true"></div></div></div>
    <div id="en-f">Cotação SulAmérica PME | Capital – 03 a 04 vidas – Apólice 12 meses · Especial Vital QP R1 · Compulsório · 30% de coparticipação · Reembolso. Valores para 3 beneficiários (0 a 18, 29 a 33 e 34 a 38 anos): R$ 1.729,15 + IOF de 2,38% = R$ 1.770,30/mês. Sem taxa de inscrição. Contratação sujeita à análise e às condições da operadora.</div>
  </div>`;
  add(`tl.fromTo("#en-wrap",{yPercent:100},{yPercent:0,duration:0.55,ease:"power3.out"},0);`);
  add(`tl.fromTo("#en-lgw",{clipPath:"inset(0% 100% 0% 0%)"},{clipPath:"inset(0% 0% 0% 0%)",duration:0.6,ease:"power2.inOut"},0.35);`);
  add(`tl.fromTo("#en-lgt",{opacity:0},{opacity:1,duration:0.4},0.55);`);
  [0, 1].forEach((i) => add(`tl.fromTo("#ena${i}",{yPercent:110,opacity:0},{yPercent:0,opacity:1,duration:0.4,ease:"power3.out"},${r3(0.45 + i * 0.1)});`));
  [0, 1, 2].forEach((i) => add(`tl.fromTo("#enb${i}",{yPercent:110,opacity:0},{yPercent:0,opacity:1,duration:0.4,ease:"power3.out"},${r3(0.7 + i * 0.1)});`));
  add(`tl.fromTo("#en-c",{y:${pick(200, 150)},opacity:0},{y:0,opacity:1,duration:0.5,ease:"power3.out"},0.6);`);
  add(`tl.fromTo("#en-bw",{scale:0.6,opacity:0},{scale:1,opacity:1,duration:0.5,ease:"back.out(1.8)"},0.9);`);
  add(`tl.fromTo("#en-f",{opacity:0},{opacity:1,duration:0.5},1.1);`);
  add(`tl.fromTo("#en-bsw",{xPercent:-100},{xPercent:100,duration:0.8,ease:"power2.inOut"},1.3);`);
  add(`tl.fromTo("#en-chat",{rotation:0},{rotation:14,duration:0.1,ease:"sine.inOut",repeat:5,yoyo:true},1.4);`);
  for (let t = 1.9; t + 1.0 <= dur - 0.6; t += 1.0) {
    add(`tl.fromTo("#en-btn",{scale:1},{scale:1.04,duration:0.5,ease:"sine.inOut",immediateRender:false},${r3(t)});`);
    add(`tl.to("#en-btn",{scale:1,duration:0.5,ease:"sine.inOut"},${r3(t + 0.5)});`);
    add(`tl.fromTo("#en-ring",{opacity:0.7,scale:1},{opacity:0,scale:1.12,duration:0.9,ease:"power2.out",immediateRender:false},${r3(t)});`);
  }
  scenes.push({ st, track: 2, ...scene(p, dur, css, body, a) });
}

// ═════════════ legendas palavra a palavra, com quem fala ═════════════
// grupos com o texto de exibição e o intervalo de palavras (índices em vo.words.json)
const CAP = [
  [["Oi,", 0], ["tudo", 1], ["bem?", 2]],
  [["Eu", 3], ["tenho", 4], ["CNPJ…", 5]],
  [["Será", 6], ["que", 7], ["eu", 8], ["consigo", 9]],
  [["um", 10], ["plano", 11], ["de", 12], ["saúde", 13]],
  [["empresarial", 14], ["pra", 15], ["minha", 16], ["família?", 17]],
  [["Oi!", 18], ["Consegue", 19], ["sim!", 20]],
  [["Olha", 21], ["só", 22], ["a", 23], ["cotação", 24]],
  [["que", 25], ["eu", 26], ["fiz", 27], ["pra", 28], ["você:", 29]],
  [["SulAmérica", 30], ["PME,", 31]],
  [["3", 32], ["vidas,", 33]],
  [["por", 34], ["R$ 1.770,30", 35, 42]],
  [["por", 43], ["mês…", 44]],
  [["já", 45], ["com", 46], ["IOF!", 47]],
  [["Sério?!", 48]],
  [["Pra", 49], ["três", 50], ["pessoas?!", 51]],
  [["Sério!", 52]],
  [["Pra", 53], ["essas", 54], ["idades", 55], ["aqui,", 56], ["ó.", 57]],
  [["Abrangência", 58], ["nacional,", 59]],
  [["apartamento,", 60]],
  [["coparticipação,", 61]],
  [["reembolso…", 62]],
  [["e", 63], ["sem", 64], ["taxa", 65], ["de", 66], ["inscrição!", 67]],
  [["Amei!", 68]],
  [["E", 69], ["como", 70], ["é", 71], ["que", 72], ["eu", 73], ["faço?", 74]],
  [["Clica", 75], ["no", 76], ["botão", 77]],
  [["e", 78], ["me", 79], ["chama", 80], ["no", 81], ["WhatsApp,", 82]],
  [["que", 83], ["eu", 84], ["vejo", 85], ["as", 86], ["condições", 87]],
  [["de", 88], ["contratação", 89], ["pra", 90], ["você!", 91]],
];
{
  const p = "cap";
  const { a, add } = TL(0);
  const css =
    base(p) +
    `
.cap-g{position:absolute;left:40px;width:${W - 80}px;top:${G.capY}px;height:${G.capH}px;display:flex;justify-content:center;align-items:center;opacity:0;}
.cap-in{display:inline-block;padding:${K(10)}px ${K(26)}px;border-radius:${K(24)}px;background:rgba(0,12,40,.82);font-family:"Mont",Arial,sans-serif;font-weight:800;font-size:${G.capFs}px;line-height:1.15;letter-spacing:-.01em;word-spacing:.06em;white-space:nowrap;box-shadow:0 10px 30px rgba(0,8,30,.25);}
.cap-w{display:inline-block;color:rgba(255,255,255,.45);}
.lb{position:absolute;left:0;width:${W}px;top:${G.capY - G.lbH - K(8)}px;height:${G.lbH}px;display:flex;justify-content:center;opacity:0;}
.lb span{display:inline-flex;align-items:center;gap:${K(8)}px;height:${G.lbH}px;padding:0 ${K(16)}px;border-radius:${G.lbH}px;font-family:"Mont",Arial,sans-serif;font-weight:800;font-size:${G.lbFs}px;letter-spacing:.08em;}
.lb i{display:inline-block;width:${K(10)}px;height:${K(10)}px;border-radius:50%;background:#fff;}
.lb-c span{background:#12813F;color:#fff;}
.lb-k span{background:#C24A12;color:#fff;}
`;
  const tok = (gi, q) => `cap-w${gi}-${q}`;
  const spkOf = (gi) => WORDS[CAP[gi][0][1]].spk;
  const body =
    LINES.map((l) => `<div class="lb ${l.spk === "cliente" ? "lb-c" : "lb-k"}" id="lb-${l.id}"><span><i></i>${l.spk === "cliente" ? "CLIENTE" : "CONSULTOR"}</span></div>`).join("\n") +
    "\n" +
    CAP.map(
      (grp, gi) =>
        `<div class="cap-g" id="cap-g${gi}"><span class="cap-in">${grp.map(([tx], q) => `<span class="cap-w" id="${tok(gi, q)}">${tx}</span>`).join(" ")}</span></div>`,
    ).join("\n");
  LINES.forEach((l) => {
    const on = r3(Math.max(0, l.start - 0.05));
    const off = r3(Math.min(END_IN + 0.3, l.end + 0.15));
    add(`tl.fromTo("#lb-${l.id}",{opacity:0,y:${K(10)}},{opacity:1,y:0,duration:0.18,ease:"power2.out"},${on});`);
    add(`tl.to("#lb-${l.id}",{opacity:0,duration:0.12},${off});`);
  });
  const s0 = (gi) => WORDS[CAP[gi][0][1]].start;
  const e0 = (gi) => {
    const last = CAP[gi][CAP[gi].length - 1];
    return WORDS[last[2] ?? last[1]].end;
  };
  CAP.forEach((grp, gi) => {
    const on = r3(Math.max(0, s0(gi) - 0.08));
    // a frase seguinte só entra depois que esta sumiu (corte limpo, sem duas frases juntas)
    const next = gi + 1 < CAP.length ? s0(gi + 1) - 0.15 : D - 0.2;
    const off = r3(Math.min(next, e0(gi) + 0.6));
    const hl = spkOf(gi) === "cliente" ? CLI_HL : HL;
    add(`tl.fromTo("#cap-g${gi}",{opacity:0,y:18},{opacity:1,y:0,duration:0.14,ease:"power2.out"},${on});`);
    add(`tl.to("#cap-g${gi}",{opacity:0,duration:0.06},${r3(Math.max(on + 0.2, off))});`);
    grp.forEach(([, i0, i1], q) => {
      const ws = WORDS[i0].start;
      const we = WORDS[i1 ?? i0].end;
      add(`tl.set("#${tok(gi, q)}",{color:"${hl}"},${r3(ws)});`);
      add(`tl.set("#${tok(gi, q)}",{color:"#FFFFFF"},${r3(Math.max(ws + 0.12, we))});`);
    });
  });
  scenes.push({ st: 0, track: 3, ...scene(p, D, css, body, a) });
}

// ═════════════ dedo e grão ═════════════
{
  const p = "ui";
  const { a, add } = TL(0);
  const FS = pick(96, 76);
  const m8 = msg("m8");
  const fx = m8.x + K(20) + Math.round(K(580) * 0.72);
  const fy = G.vpTop + m8.y - scrollAt(TAP) + K(76) + K(56);
  const NOISE =
    "data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E";
  const css = `#ui-root{position:absolute;inset:0;width:${W}px;height:${H}px;overflow:hidden;pointer-events:none;}
#ui-f{position:absolute;left:${fx - FS / 2}px;top:${fy - FS / 2}px;width:${FS}px;height:${FS}px;border-radius:50%;background:radial-gradient(circle,rgba(255,255,255,.8) 0 34%,rgba(255,255,255,.35) 36% 100%);border:2px solid rgba(255,255,255,.95);box-shadow:0 0 0 1.5px rgba(0,18,61,.4),0 10px 26px rgba(0,8,30,.45);opacity:0;}
#ui-tex{position:absolute;left:-128px;top:-128px;width:${W + 256}px;height:${H + 256}px;background:url("${NOISE}") 0 0/256px 256px repeat;opacity:.035;mix-blend-mode:overlay;}`;
  const body = `<div id="ui-tex" data-layout-allow-overflow aria-hidden="true"></div><div id="ui-f"></div>`;
  add(`tl.fromTo("#ui-f",{opacity:0,x:${pick(150, 120)},y:${pick(200, 150)},scale:1.15},{opacity:1,x:0,y:0,scale:1,duration:0.45,ease:"power3.out"},${r3(TAP - 0.5)});`);
  add(`tl.to("#ui-f",{scale:0.82,duration:0.1,ease:"power2.in"},${TAP});`);
  add(`tl.to("#ui-f",{scale:1,duration:0.16,ease:"power2.out"},${r3(TAP + 0.12)});`);
  add(`tl.to("#ui-f",{opacity:0,duration:0.2,ease:"power2.in"},${r3(END_IN - 0.05)});`);
  let s = 53;
  const R = () => ((s = (s * 1103515245 + 12345) % 2147483648) / 2147483648);
  const pos = [];
  for (let t = 0; t < D; t += 2 / FPS) pos.push(Math.round((R() - 0.5) * 200), Math.round((R() - 0.5) * 200));
  add(`const P = [${pos.join(",")}];`);
  add(`for (let i = 0; i < P.length / 2; i++) tl.set("#ui-tex", { x: P[2 * i], y: P[2 * i + 1] }, Math.round((i * 2 / ${FPS}) * 1000) / 1000);`);
  scenes.push({ st: 0, track: 4, ...scene(p, D, css, body, a) });
}

// ═════════════ áudio ═════════════
const HITS = JSON.parse(readFileSync(join(ROOT, "assets/audio/sfx_hits.json"), "utf8"));
const SFX = [
  ["shimmer", 0.1, 0.22],
  ...MSG.filter((m) => m.type !== "chip").map((m) => (m.spk === "cliente" ? ["pop", m.t + 0.02, 0.32] : ["chime", m.t, 0.3])),
  ...LINES.map((l) => ["tap", l.start - 0.06, 0.16]),
  ["card", msg("m3").t + 0.02, 0.2],
  ["whoosh", O2_IN, 0.28],
  ["shimmer", T.sula, 0.26],
  ["tap", T.pme, 0.2],
  ["pop", T.tres, 0.18],
  ["pop", T.tres + 0.12, 0.17],
  ["pop", T.tres + 0.24, 0.17],
  ["counter", T.mil, 0.16],
  ["shimmer", T.centavos + 0.1, 0.2],
  ["stamp", T.iof, 0.5],
  ["whoosh", O2_OUT, 0.2],
  ["boing", T.serio1, 0.42],
  ["whoosh", O3_IN, 0.26],
  ["shimmer", T.essas, 0.18],
  ...[T.abr, T.apt, T.cop, T.ree, T.sem].map((t) => ["check", t + 0.05, 0.24]),
  ["whoosh", O3_OUT, 0.2],
  ["pop", T.amei, 0.34],
  ["tap", TAP, 0.7],
  ["check", TAP + 0.05, 0.28],
  ["whoosh", END_IN, 0.28],
  ["impact", END_IN + 0.1, 0.3],
  ["shimmer", END_IN + 0.35, 0.26],
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
  `<audio id="el-bgm" src="assets/audio/bgm.wav" data-start="0" data-duration="${D}" data-track-index="20" data-volume="0.3"></audio>`,
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
      html, body { width: ${W}px; height: ${H}px; overflow: hidden; background: ${CHAT}; }
      #root { position: relative; width: ${W}px; height: ${H}px; overflow: hidden; background: ${CHAT}; }
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
  JSON.stringify({ ...T, hookOut: HOOK_OUT, o2: [O2_IN, O2_OUT], o3: [O3_IN, O3_OUT], tap: TAP, endIn: END_IN, end: D, msgs: MSG.map(({ id, t, y, scroll }) => ({ id, t: r3(t), y, scroll })) }, null, 1),
);
console.log(`${FMT} ${W}x${H}: ${D}s, ${scenes.length} composições, ${SFX.length} SFX, ${CAP.length} grupos de legenda`);
