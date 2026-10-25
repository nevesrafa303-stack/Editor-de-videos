#!/usr/bin/env node
// build.mjs — variação "Você tinha Select?" do motion da saída da Select de Recife, com locução
// (HeyGen), story 9:16 e feed 1:1.
//
//   node tools/build.mjs story   -> compositions/*.html + index.html
//   node tools/build.mjs feed    -> feed/compositions/*.html + feed/index.html
//
// Fala direto com quem tinha o plano: "Você tinha Select em Recife?" com a carteirinha do plano
// anterior; no "A Select saiu, mas trocar de plano não significa trocar de hospital" ela sai e
// entra a carteirinha do novo plano, cuja rede hospitalar se preenche quando cada hospital é dito;
// o consultor numa tabela comparando três planos; respiro com eletrocardiograma no "cada dia sem
// plano é um dia de risco"; cartão final com o botão do formulário. Só conteúdo do brief; sem
// logo, cores ou identidade da Select; sem preço. Tempos de assets/voice/vo.words.json
// (tools/voice.py) e da grade da trilha em tools/grid.json (tools/synth_audio.py).

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
T.de = at("select"); // "Select em Recife?" bate na tela
T.recife1 = at("recife");
T.presta = at("presta");
T.a2 = at("a", T.presta);
T.saiuEnd = end("saiu", T.a2);
T.mas = at("mas");
T.existem = at("existem");
T.real = at("real");
T.santa = at("santa");
T.outros = at("outros");
T.s2 = r3(at("e", end("recife", T.outros)) - 0.3);
T.busca = at("busca");
T.o2 = at("o", at("propria"));
T.compara = at("compara");
T.operadoras = at("operadoras");
T.e5 = at("e", T.operadoras);
T.mantem = at("mantem");
T.pro = at("pro");
T.familia = at("familia", T.pro);
T.ou = at("ou", T.familia);
T.empresa = at("empresa", T.pro);
T.so = at("so");
T.s3 = r3(T.so - 0.3);
T.cada = at("cada");
T.troque = at("troque");
T.en = r3(GRID.cta - 0.3); // "Troque de plano" (mesma âncora da trilha)
T.nao = at("nao", T.troque);
T.hosp3 = at("hospital", T.troque);
T.toca = at("toca");
T.aqui = at("aqui", T.toca);
T.preenche = at("preenche");
T.formulario = at("formulario");
T.consultor2 = at("consultor", T.formulario);
T.drop = GRID.drop; // "mas trocar de plano…" (drop da trilha)
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

// ═════════════ 1 · "Você tinha Select em Recife?" → troca de carteirinha → rede hospitalar ═════════════
{
  const p = "s1";
  const st = 0;
  const dur = r3(T.s2 + 0.1);
  const { a, L, add, words, shake } = TL(st);
  const g = pick(
    {
      a1: 290, a1s: 104, a2: 410, a2s: 84, py: 536, ph: 64, pf: 30,
      ox: 160, oy: 640, ow: 760,
      b1: 286, b1s: 58, b2: [356, 444, 532], b2s: 80, c: [400, 486], cs: 70,
      nx: 90, ny: 660, nw: 900, nh: 690, hb: 110, hf: 40, lb: 128, lf: 30, ry: [178, 342, 506], rh: 154, tw: 210, nf: 36, ck: 64, ly: 1384,
    },
    {
      a1: 40, a1s: 72, a2: 126, a2s: 60, py: 214, ph: 50, pf: 24,
      ox: 240, oy: 300, ow: 600,
      b1: 22, b1s: 40, b2: [72, 134, 196], b2s: 54, c: [100, 162], cs: 50,
      nx: 160, ny: 280, nw: 760, nh: 560, hb: 84, hf: 32, lb: 96, lf: 24, ry: [136, 274, 412], rh: 128, tw: 172, nf: 30, ck: 52, ly: 862,
    },
  );
  const k = g.ow / 760;
  const q = (v) => Math.round(v * k);
  const och = q(430);
  const pad = Math.round(g.rh * 0.1);
  const css =
    base(p) +
    `
#s1-a1{top:${g.a1}px;font-weight:900;font-size:${g.a1s}px;line-height:1.05;letter-spacing:-.02em;}
#s1-a2{top:${g.a2}px;font-weight:900;font-size:${g.a2s}px;line-height:1.05;letter-spacing:-.02em;}
#s1-pw{position:absolute;left:0;width:${W}px;top:${g.py}px;text-align:center;}
#s1-pill{display:inline-flex;align-items:center;gap:12px;height:${g.ph}px;padding:0 ${Math.round(g.ph * 0.5)}px;border-radius:${g.ph}px;background:${GOLD};color:${INK};font-weight:900;font-size:${g.pf}px;letter-spacing:.04em;}
#s1-ow{position:absolute;left:${g.ox}px;top:${g.oy}px;width:${g.ow}px;height:${och}px;}
#s1-oc{position:absolute;inset:0;border-radius:${q(36)}px;background:linear-gradient(135deg,#E9EDF2 0%,#C9D1DC 100%);color:${INK};box-shadow:0 30px 70px rgba(0,0,0,.5);overflow:hidden;}
#s1-oic{position:absolute;left:${q(40)}px;top:${q(40)}px;width:${q(88)}px;height:${q(88)}px;border-radius:50%;background:#8D99AA;display:flex;align-items:center;justify-content:center;}
#s1-ot1{position:absolute;left:${q(150)}px;top:${q(48)}px;font-weight:900;font-size:${q(36)}px;letter-spacing:.06em;}
#s1-ot2{position:absolute;left:${q(150)}px;top:${q(94)}px;font-weight:500;font-size:${q(26)}px;color:${SLATE};}
#s1-ochip{position:absolute;left:${q(40)}px;top:${q(176)}px;width:${q(100)}px;height:${q(76)}px;border-radius:${q(14)}px;background:linear-gradient(135deg,#C9CED6,#9AA3B0);}
.s1-obar{position:absolute;left:${q(40)}px;height:${q(22)}px;border-radius:${q(11)}px;background:#A9B4C3;}
#s1-b1{top:${g.b1}px;font-weight:800;font-size:${g.b1s}px;line-height:1.1;color:${MUTED};}
#s1-b1i{position:relative;display:inline-block;}
#s1-bx{position:absolute;left:-3%;top:50%;width:106%;height:${pick(8, 6)}px;margin-top:-${pick(2, 2)}px;border-radius:6px;background:${CORAL};}
.s1-b2{font-weight:900;font-size:${g.b2s}px;line-height:1.1;letter-spacing:-.02em;}
.s1-c{font-weight:900;font-size:${g.cs}px;line-height:1.1;letter-spacing:-.02em;}
#s1-nw{position:absolute;left:${g.nx}px;top:${g.ny}px;width:${g.nw}px;height:${g.nh}px;}
#s1-nc{position:absolute;inset:0;border-radius:${pick(36, 30)}px;background:#fff;color:${INK};box-shadow:0 30px 80px rgba(0,0,0,.55),0 0 0 ${pick(5, 4)}px rgba(255,210,122,.85);overflow:hidden;}
#s1-nh{position:absolute;left:0;top:0;width:100%;height:${g.hb}px;background:linear-gradient(135deg,${GOLD2},${GOLD});display:flex;align-items:center;gap:${pick(18, 14)}px;padding-left:${pick(34, 28)}px;}
#s1-nhi{width:${Math.round(g.hb * 0.64)}px;height:${Math.round(g.hb * 0.64)}px;border-radius:50%;background:#fff;display:flex;align-items:center;justify-content:center;}
#s1-nht{font-weight:900;font-size:${g.hf}px;letter-spacing:.05em;}
#s1-nl{position:absolute;left:${pick(34, 28)}px;top:${g.lb}px;font-weight:700;font-size:${g.lf}px;color:${SLATE};letter-spacing:.04em;}
.s1-r{position:absolute;left:${pick(24, 20)}px;right:${pick(24, 20)}px;height:${g.rh}px;border-radius:${Math.round(g.rh * 0.16)}px;background:#F1F4F8;}
.s1-pb{position:absolute;left:${pad}px;top:${Math.round(g.rh * 0.3)}px;height:${Math.round(g.rh * 0.14)}px;border-radius:12px;background:#DCE2EA;}
.s1-rc{position:absolute;inset:0;opacity:0;}
.s1-t{left:${pad}px;top:${pad}px;width:${g.tw}px;height:${g.rh - 2 * pad}px;border-radius:${Math.round(g.rh * 0.1)}px;}
.s1-ti{position:absolute;left:${pad}px;top:${pad}px;width:${g.tw}px;height:${g.rh - 2 * pad}px;border-radius:${Math.round(g.rh * 0.1)}px;background:linear-gradient(135deg,${GOLD2},${GOLD});display:flex;align-items:center;justify-content:center;}
.s1-n{position:absolute;left:${pad * 2 + g.tw + 6}px;top:0;height:${g.rh}px;display:flex;align-items:center;font-weight:800;font-size:${g.nf}px;line-height:1.12;}
.s1-n.sm{font-size:${Math.round(g.nf * 0.8)}px;}
.s1-k{position:absolute;right:${pad}px;top:${Math.round((g.rh - g.ck) / 2)}px;width:${g.ck}px;height:${g.ck}px;border-radius:50%;background:${GREEN};display:flex;align-items:center;justify-content:center;}
`;
  const rows = [
    ["rhp", "80% 32%", "Real Hospital<br>Português"],
    ["sjf", "50% 62%", "Hospital<br>Santa Joana"],
    [null, "", "E outros hospitais<br>de referência do Recife"],
  ];
  const th = g.rh - 2 * pad;
  const body = `
  <div id="s1-wrap" class="${p}-full">
    <div id="s1-A" class="${p}-full">
      <div id="s1-a1" class="ln d">${wspans("s1a", "Você tinha")}</div>
      <div id="s1-a2" class="ln d"><span id="s1-a2i" style="display:inline-block">Select em <span class="coral">Recife?</span></span></div>
      <div id="s1-pw"><span id="s1-pill" class="d">${icon("pin", Math.round(g.ph * 0.5), { color: INK, sw: 4 })}Presta atenção</span></div>
    </div>
    <div id="s1-ow" data-layout-allow-overflow><div id="s1-oc">
      <div id="s1-oic">${icon("heart", q(56), { color: "#fff", sw: 3.6 })}</div>
      <div id="s1-ot1" class="d">PLANO ANTERIOR</div>
      <div id="s1-ot2">Carteirinha</div>
      <div id="s1-ochip"></div>
      <div class="s1-obar" style="top:${q(300)}px;width:${q(380)}px"></div>
      <div class="s1-obar" style="top:${q(344)}px;width:${q(250)}px"></div></div></div>
    <div id="s1-B" class="${p}-full">
      <div id="s1-b1" class="ln d"><span id="s1-b1i" data-layout-allow-occlusion>${wspans("s1b", "A Select saiu,")}<i id="s1-bx" data-layout-allow-overlap aria-hidden="true"></i></span></div>
      <div class="ln d s1-b2" style="top:${g.b2[0]}px">${wspans("s1c", "Trocar de plano")}</div>
      <div class="ln d s1-b2" style="top:${g.b2[1]}px">${wspans("s1d", "não significa")}</div>
      <div class="ln d s1-b2" style="top:${g.b2[2]}px">${wspans("s1e", "trocar de hospital.", "gold")}</div>
    </div>
    <div id="s1-C" class="${p}-full">
      <div class="ln d s1-c" style="top:${g.c[0]}px">${wspans("s1f", "Existem planos com")}</div>
      <div class="ln d s1-c" style="top:${g.c[1]}px">${wspans("s1g", "atendimento no:")}</div>
    </div>
    <div id="s1-nw" data-layout-allow-overflow><div id="s1-nc">
      <div id="s1-nh"><div id="s1-nhi">${icon("heart", Math.round(g.hb * 0.4), { color: INK, sw: 3.6 })}</div><div id="s1-nht" class="d">NOVO PLANO</div></div>
      <div id="s1-nl">REDE HOSPITALAR</div>
      ${rows
        .map(
          ([img, pos, name], i) => `<div class="s1-r" style="top:${g.ry[i]}px"><div class="s1-pb" id="s1-pb${i}" style="width:${Math.round(g.nw * (0.5 - i * 0.06))}px"></div>
        <div class="s1-rc" id="s1-rc${i}">${img ? `<div class="ph s1-t">${photo(`s1-i${i}`, img, pos)}</div>` : `<div class="s1-ti">${icon("hospital", Math.round(th * 0.6), { color: INK, sw: 3 })}</div>`}<div class="s1-n d${img ? "" : " sm"}">${name}</div></div>
        <div class="s1-k" id="s1-k${i}">${icon("check", Math.round(g.ck * 0.62), { color: "#fff", sw: 5.5 })}</div></div>`,
        )
        .join("\n      ")}
    </div></div>
    <div class="legal" id="s1-lg" style="top:${g.ly}px">${OBS.rede} ${OBS.varia} ${OBS.img}</div>
  </div>`;
  // "Você tinha" já na tela no quadro 0; "Select em Recife?" bate quando é dito
  add(`tl.fromTo("#s1-a1",{scale:1.08},{scale:1,duration:0.5,ease:"power3.out"},0);`);
  add(`tl.fromTo("#s1-a2i",{scale:1.8,opacity:0},{scale:1,opacity:1,duration:0.26,ease:"power4.out"},${L(T.de - 0.04)});`);
  shake("#s1-A", r3(L(T.de) + 0.2), pick(12, 9));
  add(`tl.fromTo("#s1-ow",{y:${pick(240, 180)},opacity:0,rotation:-4},{y:0,opacity:1,rotation:-2,duration:0.5,ease:"power3.out"},${L(T.recife1 + 0.1)});`);
  add(`tl.fromTo("#s1-pill",{scale:0.4,opacity:0},{scale:1,opacity:1,duration:0.32,ease:"back.out(2.2)"},${L(T.presta - 0.05)});`);
  // "A Select saiu, mas…": a carteirinha antiga sai e entra a do novo plano
  add(`tl.to("#s1-A",{y:-80,opacity:0,duration:0.26,ease:"power3.in"},${L(T.a2 - 0.3)});`);
  words("s1b", seq("a select saiu", T.presta));
  add(`tl.fromTo("#s1-bx",{scaleX:0},{scaleX:1,duration:0.3,ease:"power3.inOut",transformOrigin:"0% 50%"},${L(T.saiuEnd + 0.02)});`);
  add(`tl.to("#s1-b1i",{opacity:0.5,duration:0.3},${L(T.saiuEnd + 0.2)});`);
  add(`tl.to("#s1-ow",{x:-1250,rotation:-14,opacity:0.6,duration:0.5,ease:"power3.in"},${L(T.saiuEnd - 0.1)});`);
  add(`tl.fromTo("#s1-nw",{x:1250,rotation:8},{x:0,rotation:0,duration:0.55,ease:"power3.out"},${L(T.drop - 0.12)});`);
  shake("#s1-nw", r3(L(T.drop) + 0.45), pick(8, 6));
  const sB = seq("trocar de plano nao significa trocar de hospital", T.mas);
  words("s1c", sB.slice(0, 3));
  words("s1d", sB.slice(3, 5));
  words("s1e", sB.slice(5, 8));
  // "Existem planos com atendimento no Real Hospital Português, no Santa Joana e em outros…"
  add(`tl.to("#s1-B",{y:-60,opacity:0,duration:0.24,ease:"power3.in"},${L(T.existem - 0.3)});`);
  const sC = seq("existem planos com atendimento no", T.existem - 0.05);
  words("s1f", sC.slice(0, 3));
  words("s1g", sC.slice(3, 5));
  [T.real, T.santa, T.outros].forEach((t, i) => {
    add(`tl.to("#s1-pb${i}",{opacity:0,duration:0.15},${L(t - 0.12)});`);
    add(`tl.fromTo("#s1-rc${i}",{opacity:0,x:40},{opacity:1,x:0,duration:0.35,ease:"power3.out"},${L(t - 0.1)});`);
    add(`tl.fromTo("#s1-k${i}",{scale:0},{scale:1,duration:0.3,ease:"back.out(2.6)"},${L(t + 0.3)});`);
  });
  add(`tl.fromTo("#s1-lg",{opacity:0},{opacity:1,duration:0.4},${L(T.real + 0.3)});`);
  add(`tl.to("#s1-wrap",{y:${-pick(140, 90)},opacity:0,duration:0.3,ease:"power3.in"},${r3(dur - 0.3)});`);
  scenes.push({ st, track: 1, ...scene(p, dur, css, body, a) });
}

// ═════════════ 2 · consultor: tabela comparando os planos ═════════════
{
  const p = "s2";
  const st = r3(T.s2 - 0.05);
  const dur = r3(T.s3 + 0.1 - st);
  const { a, L, add, words } = TL(st);
  const g = pick(
    { h: [266, 344], hs: 60, tx: 70, tw: 940, ty: 470, hr: 96, rr: 150, lc: 360, cf: 34, nf: 26, th: 80, mk: 62, e1: 900, e1s: 44, e2: 958, e2s: 50, fy: 1070, fs: 38, py: 1130, pw: 280, pph: 88, pf: 34, ly: 1270 },
    { h: [24, 84], hs: 46, tx: 120, tw: 840, ty: 168, hr: 70, rr: 112, lc: 300, cf: 26, nf: 22, th: 66, mk: 48, e1: 480, e1s: 34, e2: 524, e2s: 38, fy: 596, fs: 28, py: 640, pw: 230, pph: 70, pf: 28, ly: 740 },
  );
  const cw = Math.round((g.tw - g.lc) / 3);
  const tabH = g.hr + 2 * g.rr;
  const marks = [
    [true, false],
    [true, true],
    [false, true],
  ];
  const css =
    base(p) +
    `
.s2-h{font-weight:900;font-size:${g.hs}px;line-height:1.1;letter-spacing:-.02em;}
#s2-tb{position:absolute;left:${g.tx}px;top:${g.ty}px;width:${g.tw}px;height:${tabH}px;border-radius:${pick(30, 24)}px;background:#fff;color:${INK};box-shadow:0 30px 70px rgba(0,0,0,.5);overflow:hidden;}
.s2-hc{position:absolute;top:0;height:${g.hr}px;width:${cw}px;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:${g.cf}px;background:#E4EAF2;}
#s2-h0{position:absolute;left:0;top:0;width:${g.lc}px;height:${g.hr}px;background:#E4EAF2;display:flex;align-items:center;padding-left:${pick(24, 18)}px;font-weight:700;font-size:${Math.round(g.cf * 0.7)}px;color:${SLATE};letter-spacing:.04em;}
.s2-rl{position:absolute;left:0;width:${g.lc}px;height:${g.rr}px;display:flex;align-items:center;gap:${pick(16, 12)}px;padding-left:${pick(20, 14)}px;font-weight:800;font-size:${g.nf}px;line-height:1.1;border-top:2px solid #E4EAF2;}
.s2-th{width:${g.th}px;height:${g.th}px;border-radius:${Math.round(g.th * 0.2)}px;flex:none;}
.s2-cl{position:absolute;width:${cw}px;height:${g.rr}px;display:flex;align-items:center;justify-content:center;border-top:2px solid #E4EAF2;border-left:2px solid #E4EAF2;}
.s2-m{width:${g.mk}px;height:${g.mk}px;border-radius:50%;display:flex;align-items:center;justify-content:center;}
.s2-m.ok{background:${GREEN};}
.s2-m.no{background:#9AA6B6;}
.s2-sc{position:absolute;top:0;width:${cw}px;height:${tabH}px;background:rgba(245,184,61,.22);}
#s2-win{position:absolute;left:${g.tx + g.lc + cw - 6}px;top:${g.ty - 6}px;width:${cw + 12}px;height:${tabH + 12}px;border-radius:${pick(18, 14)}px;border:${pick(7, 6)}px solid ${GOLD};opacity:0;}
#s2-wb{position:absolute;left:${g.tx + g.lc + cw + cw / 2 - g.mk * 0.65}px;top:${g.ty - g.mk * 0.7}px;width:${Math.round(g.mk * 1.3)}px;height:${Math.round(g.mk * 1.3)}px;border-radius:50%;background:${GOLD};display:flex;align-items:center;justify-content:center;box-shadow:0 10px 24px rgba(0,0,0,.35);}
#s2-e1{top:${g.e1}px;font-weight:700;font-size:${g.e1s}px;line-height:1.1;}
#s2-e2{top:${g.e2}px;font-weight:900;font-size:${g.e2s}px;line-height:1.1;letter-spacing:-.01em;}
#s2-f{top:${g.fy}px;font-weight:500;font-size:${g.fs}px;color:${MUTED};}
#s2-pr{position:absolute;left:0;width:${W}px;top:${g.py}px;display:flex;justify-content:center;align-items:center;gap:${pick(22, 18)}px;}
.s2-p{width:${g.pw}px;height:${g.pph}px;border-radius:${g.pph}px;border:${pick(4, 3)}px solid ${GOLD};display:flex;align-items:center;justify-content:center;gap:${pick(14, 10)}px;font-weight:800;font-size:${g.pf}px;color:#fff;background:rgba(245,184,61,.14);}
#s2-ou{font-weight:600;font-size:${Math.round(g.pf * 0.8)}px;color:${MUTED};}
`;
  const hosp = [
    ["rhp2", "60% 40%", "Real Hospital<br>Português"],
    ["sja", "45% 45%", "Hospital<br>Santa Joana"],
  ];
  const body = `
  <div id="s2-wrap" class="${p}-full">
    <div id="s2-H1" class="${p}-full">
      <div class="ln d s2-h" style="top:${g.h[0]}px" data-layout-allow-overlap>${wspans("s2a", "Não precisa fazer essa")}</div>
      <div class="ln d s2-h" style="top:${g.h[1]}px" data-layout-allow-overlap>${wspans("s2b", "busca por conta própria:")}</div>
    </div>
    <div id="s2-H2" class="${p}-full">
      <div class="ln d s2-h" style="top:${g.h[0]}px" data-layout-allow-overlap>${wspans("s2c", "O consultor")} <span class="w"><span class="wi gold" id="s2c2">compara</span></span></div>
      <div class="ln d s2-h" style="top:${g.h[1]}px" data-layout-allow-overlap>${wspans("s2d", "as operadoras")}</div>
    </div>
    <div id="s2-tb">
      <div id="s2-h0">HOSPITAL</div>
      ${[0, 1, 2].map((c) => `<div class="s2-sc" id="s2-sc${c}" style="left:${g.lc + c * cw}px;opacity:0" aria-hidden="true"></div>`).join("")}
      ${[0, 1, 2].map((c) => `<div class="s2-hc d" style="left:${g.lc + c * cw}px">Plano ${"ABC"[c]}</div>`).join("")}
      ${hosp
        .map(
          ([img, pos, nm], r) =>
            `<div class="s2-rl d" style="top:${g.hr + r * g.rr}px"><div class="s2-th" style="background:url('${IMG[img][0]}') ${pos}/cover no-repeat"></div><span>${nm}</span></div>` +
            [0, 1, 2]
              .map(
                (c) =>
                  `<div class="s2-cl" style="left:${g.lc + c * cw}px;top:${g.hr + r * g.rr}px"><div class="s2-m ${marks[c][r] ? "ok" : "no"}" id="s2-m${c}${r}">${icon(marks[c][r] ? "check" : "x", Math.round(g.mk * 0.62), { color: "#fff", sw: 5.5 })}</div></div>`,
              )
              .join(""),
        )
        .join("\n      ")}
    </div>
    <div id="s2-win" aria-hidden="true" data-layout-allow-overlap></div>
    <div id="s2-wb" data-layout-allow-overlap>${icon("check", Math.round(g.mk * 0.8), { color: INK, sw: 5.5 })}</div>
    <div id="s2-e1" class="ln d">${wspans("s2e", "e encontra o plano que mantém")}</div>
    <div id="s2-e2" class="ln d gold">${wspans("s2f", "seus hospitais de confiança,")}</div>
    <div id="s2-f" class="ln">pro perfil da sua</div>
    <div id="s2-pr"><div class="s2-p d" id="s2-p0">${icon("family", Math.round(g.pf * 1.3), { color: GOLD, sw: 3.4 })}família</div><span id="s2-ou">ou</span><div class="s2-p d" id="s2-p1">${icon("building", Math.round(g.pf * 1.2), { color: GOLD, sw: 3.4 })}empresa</div></div>
    <div class="legal" id="s2-lg" style="top:${g.ly}px">${OBS.eleg} ${OBS.varia} ${OBS.img}</div>
  </div>`;
  const sH = seq("nao precisa fazer essa busca por conta propria", T.s2);
  words("s2a", sH.slice(0, 4));
  words("s2b", sH.slice(4, 8));
  add(`tl.fromTo("#s2-tb",{y:${pick(140, 100)},opacity:0},{y:0,opacity:1,duration:0.45,ease:"power3.out"},${L(T.busca)});`);
  // "o consultor compara as operadoras e encontra…": a coluna de cada plano acende e marca os hospitais
  add(`tl.to("#s2-H1",{y:-30,opacity:0,duration:0.22,ease:"power3.in"},${L(T.o2 - 0.25)});`);
  words("s2c", seq("o consultor", T.o2 - 0.05));
  add(`tl.fromTo("#s2c2",{yPercent:110,opacity:0},{yPercent:0,opacity:1,duration:0.4,ease:"power3.out"},${L(T.compara - 0.06)});`);
  words("s2d", seq("as operadoras", T.compara));
  [T.compara, T.operadoras, T.e5].forEach((t, c) => {
    add(`tl.fromTo("#s2-sc${c}",{opacity:0},{opacity:1,duration:0.15},${L(t - 0.05)});`);
    add(`tl.to("#s2-sc${c}",{opacity:0,duration:0.25},${L(t + 0.5)});`);
    [0, 1].forEach((r) => add(`tl.fromTo("#s2-m${c}${r}",{scale:0},{scale:1,duration:0.26,ease:"back.out(2.6)"},${L(t + 0.1 + r * 0.1)});`));
  });
  // "mantém": a coluna do plano B (os dois hospitais) ganha o contorno dourado
  add(`tl.fromTo("#s2-win",{opacity:0,scale:1.08},{opacity:1,scale:1,duration:0.3,ease:"back.out(2)"},${L(T.mantem - 0.1)});`);
  add(`tl.fromTo("#s2-wb",{scale:0,rotation:-30},{scale:1,rotation:0,duration:0.35,ease:"back.out(2.6)"},${L(T.mantem)});`);
  words("s2e", seq("e encontra o plano que mantem", T.operadoras));
  words("s2f", seq("seus hospitais de confianca", T.mantem));
  add(`tl.fromTo("#s2-f",{opacity:0,y:14},{opacity:1,y:0,duration:0.35,ease:"power3.out"},${L(T.pro - 0.1)});`);
  add(`tl.fromTo("#s2-p0",{scale:0.5,opacity:0},{scale:1,opacity:1,duration:0.35,ease:"back.out(2)"},${L(T.familia - 0.05)});`);
  add(`tl.fromTo("#s2-ou",{opacity:0},{opacity:1,duration:0.2},${L(T.ou - 0.03)});`);
  add(`tl.fromTo("#s2-p1",{scale:0.5,opacity:0},{scale:1,opacity:1,duration:0.35,ease:"back.out(2)"},${L(T.empresa - 0.05)});`);
  add(`tl.fromTo("#s2-lg",{opacity:0},{opacity:1,duration:0.4},${L(T.compara + 0.4)});`);
  add(`tl.to("#s2-wrap",{y:${-pick(140, 90)},opacity:0,duration:0.3,ease:"power3.in"},${r3(dur - 0.3)});`);
  scenes.push({ st, track: 2, ...scene(p, dur, css, body, a) });
}

// ═════════════ 3 · respiro: "Só não deixa pra depois: cada dia sem plano é um dia de risco pra família." ═════════════
{
  const p = "s3";
  const st = r3(T.s3 - 0.05);
  const dur = r3(T.en + 0.1 - st);
  const { a, L, add, words } = TL(st);
  const g = pick({ ey: 330, es: 50, l: [420, 512, 604], ls: 80, ky: 790, kh: 300, kw: 940 }, { ey: 110, es: 36, l: [176, 246, 316], ls: 60, ky: 470, kh: 240, kw: 860 });
  // linha de batimento (eletrocardiograma) atravessando a tela
  const kx = (W - g.kw) / 2;
  const mid = g.kh / 2;
  const pts = [];
  const beat = (x0) => [
    [x0, mid],
    [x0 + 30, mid],
    [x0 + 46, mid - g.kh * 0.12],
    [x0 + 62, mid],
    [x0 + 80, mid],
    [x0 + 94, mid + g.kh * 0.14],
    [x0 + 112, mid - g.kh * 0.45],
    [x0 + 132, mid + g.kh * 0.32],
    [x0 + 148, mid],
    [x0 + 176, mid],
    [x0 + 200, mid - g.kh * 0.1],
    [x0 + 226, mid],
  ];
  for (let x = 0; x < g.kw - 230; x += Math.round(g.kw / 3.2)) pts.push(...beat(x));
  pts.push([g.kw, mid]);
  const d = "M" + pts.map(([x, y]) => `${Math.round(x)} ${Math.round(y)}`).join(" L");
  const css =
    base(p) +
    `
#s3-e{top:${g.ey}px;font-weight:800;font-size:${g.es}px;line-height:1.1;color:${GOLD};}
.s3-l{font-weight:900;font-size:${g.ls}px;line-height:1.1;letter-spacing:-.02em;}
#s3-k{position:absolute;left:${kx}px;top:${g.ky}px;}
`;
  const body = `
  <div id="s3-wrap" class="${p}-full">
    <div id="s3-e" class="ln d">${wspans("s3a", "Só não deixa pra depois:")}</div>
    <div class="ln d s3-l" style="top:${g.l[0]}px">${wspans("s3b", "Cada dia sem plano")}</div>
    <div class="ln d s3-l" style="top:${g.l[1]}px">${wspans("s3c", "é um dia de")} <span class="w"><span class="wi coral" id="s3c4">risco</span></span></div>
    <div class="ln d s3-l" style="top:${g.l[2]}px">${wspans("s3d", "pra família.")}</div>
    <svg id="s3-k" viewBox="0 0 ${g.kw} ${g.kh}" width="${g.kw}" height="${g.kh}" aria-hidden="true">
      <path d="M0 ${mid} H${g.kw}" stroke="rgba(255,255,255,.12)" stroke-width="2"/>
      <path id="s3-kp" d="${d}" fill="none" stroke="${CORAL}" stroke-width="${pick(7, 6)}" stroke-linecap="round" stroke-linejoin="round" pathLength="1" stroke-dasharray="1 1" stroke-dashoffset="1"/>
    </svg>
  </div>`;
  words("s3a", seq("so nao deixa pra depois", T.s3));
  const sL = seq("cada dia sem plano e um dia de risco pra familia", T.so);
  words("s3b", sL.slice(0, 4));
  words("s3c", sL.slice(4, 9));
  words("s3d", sL.slice(9, 11));
  add(`tl.to("#s3-kp",{attr:{"stroke-dashoffset":0},duration:${r3(T.en - T.cada)},ease:"none"},${L(T.cada - 0.2)});`);
  add(`tl.to("#s3-wrap",{opacity:0,duration:0.3,ease:"power2.in"},${r3(dur - 0.3)});`);
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
  add(`tl.fromTo("#en-ai",{y:20,opacity:0},{y:0,opacity:1,duration:0.3,ease:"power3.out"},0.05);`);
  add(`tl.fromTo("#en-x",{scaleX:0},{scaleX:1,duration:0.3,ease:"power3.inOut",transformOrigin:"0% 50%"},0.28);`);
  add(`tl.fromTo("#en-bi",{scale:1.4,opacity:0},{scale:1,opacity:1,duration:0.3,ease:"power4.out"},0.16);`);
  // "Troque de plano, não de hospital." no ritmo da fala
  add(`tl.fromTo("#en-c0",{y:50,opacity:0},{y:0,opacity:1,duration:0.4,ease:"power3.out"},${r3(L(T.troque) - 0.06)});`);
  add(`tl.fromTo("#en-c1",{y:50,opacity:0},{y:0,opacity:1,duration:0.4,ease:"power3.out"},${r3(L(T.nao) - 0.06)});`);
  add(`tl.fromTo("#en-ul",{scaleX:0},{scaleX:1,duration:0.4,ease:"power3.out",transformOrigin:"0% 50%"},${r3(L(T.hosp3) + 0.15)});`);
  const tp = r3(L(end("hospital", T.troque)) - 0.1);
  [0, 1].forEach((i) => {
    add(`tl.fromTo("#en-p${i}",{y:60,opacity:0},{y:0,opacity:1,duration:0.45,ease:"power3.out"},${r3(tp + i * 0.12)});`);
    add(`tl.fromTo("#en-i${i}",{scale:1.12},{scale:1,duration:${r3(dur - tp)},ease:"none"},${tp});`);
  });
  // "Toca no botão aqui embaixo, preenche o formulário e fala com um consultor."
  add(`tl.fromTo("#en-bw",{scale:0.6,opacity:0},{scale:1,opacity:1,duration:0.45,ease:"back.out(1.8)"},${r3(L(T.toca) - 0.12)});`);
  add(`tl.fromTo("#${p}-lg",{opacity:0},{opacity:1,duration:0.5},${r3(L(T.toca) + 0.4)});`);
  const ar = r3(L(T.aqui) - 0.08);
  add(`tl.fromTo("#en-lb",{opacity:0,y:-14},{opacity:1,y:0,duration:0.35,ease:"power3.out"},${ar});`);
  const nb = Math.floor((dur - ar - 0.4) / 0.625);
  add(`tl.fromTo(["#en-a0","#en-a1"],{y:0},{y:${pick(14, 10)},duration:0.3125,ease:"sine.inOut",repeat:${nb * 2 - 1},yoyo:true},${ar});`);
  add(`tl.fromTo("#en-ic",{rotation:0},{rotation:12,duration:0.1,ease:"sine.inOut",repeat:5,yoyo:true},${r3(L(T.preenche))});`);
  add(`tl.fromTo("#en-b2",{scale:1.2},{scale:1,duration:0.35,ease:"back.out(2.4)",transformOrigin:"0% 50%",immediateRender:false},${r3(L(T.formulario) - 0.04)});`);
  [r3(L(T.consultor2)), r3(L(T.fin))].forEach((t, i) => {
    add(`tl.fromTo("#en-bsw",{xPercent:-100},{xPercent:100,duration:0.8,ease:"power2.inOut"${i ? ",immediateRender:false" : ""}},${t});`);
  });
  for (let t = L(T.consultor2) + 0.9; t + 1.25 <= dur - 0.3; t += 1.25) {
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
  ["impact", T.de, 0.2],
  ["card", T.recife1 + 0.1, 0.24],
  ["pop", T.presta - 0.05, 0.2],
  ["whoosh", T.saiuEnd - 0.1, 0.16],
  ["whoosh", T.drop - 0.12, 0.2],
  ["impact", T.drop, 0.26],
  ["shimmer", T.drop + 0.3, 0.18],
  ["whoosh", T.existem - 0.3, 0.12],
  ...[T.real, T.santa, T.outros].map((t) => ["card", t - 0.12, 0.22]),
  ...[T.real, T.santa, T.outros].map((t) => ["check", t + 0.3, 0.2]),
  ["whoosh", T.s2 - 0.05, 0.18],
  ["card", T.busca, 0.22],
  ...[T.compara, T.operadoras, T.e5].map((t) => ["check", t + 0.1, 0.16]),
  ["chime", T.mantem - 0.1, 0.22],
  ["pop", T.familia - 0.05, 0.18],
  ["pop", T.empresa - 0.05, 0.18],
  ["whoosh", T.s3 - 0.05, 0.14],
  ["whoosh", T.en - 0.05, 0.2],
  ["impact", T.en + 0.02, 0.2],
  ["pop", T.toca - 0.12, 0.18],
  ["pop", T.aqui - 0.08, 0.12],
  ["shimmer", T.consultor2, 0.16],
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
