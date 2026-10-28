#!/usr/bin/env node
// build.mjs — anúncio "plano empresarial no CNPJ a partir de R$ 1.800 para 3 pessoas", com
// locução (ElevenLabs), só no formato story 9:16 para o Meta Ads, com as informações no centro da
// tela.
//
//   node tools/build.mjs   -> compositions/*.html + index.html
//
// Roteiro do cliente: gancho ("Tenha acesso às principais redes hospitalares de São Paulo através
// do seu CNPJ!"), plano empresarial com hospitais de referência (Sírio-Libanês, São Luiz Itaim,
// Morumbi, Vila Nova Star, Oswaldo Cruz e Santa Catarina) conforme a rede do plano, o preço a
// partir de R$ 1.800/mês para 3 pessoas (casal de 30 anos e um jovem de até 18), a comparação entre
// Omint, SulAmérica, Bradesco Saúde e Amil, a melhor opção pro perfil, a pergunta do
// custo-benefício e o cartão final com o formulário. Cada texto entra na palavra falada
// (assets/voice/vo.words.json); a trilha usa a mesma grade (tools/grid.json: drop no
// "Sírio-Libanês", refrão no "Clique no link").

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const W = 1080;
const H = 1920;
const FPS = 30;
const r3 = (x) => Math.round(x * 1000) / 1000;

// paleta: azul-meia-noite, champanhe e branco
const NIGHT = "#070B14";
const NAVY = "#0E1A2E";
const CH = "#E8C27A";
const CH2 = "#F7DFA8";
const INK = "#0B1220";
const SLATE = "#4F5F75";
const MUTED = "#C3CEDD";
const GREEN = "#22A06B";

// ───────────── locução e grade da trilha ─────────────
const WORDS = JSON.parse(readFileSync(join(ROOT, "assets/voice/vo.words.json"), "utf8"));
const GRID = JSON.parse(readFileSync(join(ROOT, "tools/grid.json"), "utf8"));
const D = GRID.total;
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
T.principais = at("principais");
T.sao = at("sao");
T.atraves = at("atraves");
T.cnpj = at("cnpj");
T.com = at("com", T.cnpj);
T.s2 = r3(T.com - 0.2);
T.empresarial = at("empresarial");
T.voce = at("voce", T.empresarial);
T.hospitais = at("hospitais", T.voce);
T.como = at("como", T.hospitais);
T.drop = GRID.drop; // "Sírio-Libanês" (mesma âncora da trilha)
T.s3 = r3(T.drop - 0.3);
T.hosp = [T.drop, at("sao", T.drop), at("morumbi"), at("vila"), at("oswaldo"), at("santa")];
T.conforme = at("conforme");
T.escolhidoEnd = end("escolhido");
T.e4 = at("e", T.escolhidoEnd);
T.s4 = r3(T.e4 - 0.15);
T.melhor1 = at("melhor", T.e4);
T.planos = at("planos");
T.mil = at("mil");
T.oitocentosEnd = end("oitocentos");
T.mes = at("mes");
T.tres = at("tres");
T.casal = at("casal");
T.jovem = at("jovem");
T.anosEnd = end("anos", T.jovem);
T.nos = at("nos", T.anosEnd);
T.s5 = r3(T.nos - 0.2);
T.comparamos = at("comparamos");
T.operadoras = at("operadoras");
T.ops = [at("omint"), at("sulamerica"), at("bradesco"), at("amil")];
T.amilEnd = end("amil");
T.apresentamos = at("apresentamos");
T.s6 = r3(T.amilEnd + 0.05);
T.opcao = at("opcao");
T.para6 = at("para", T.opcao);
T.quer = at("quer");
T.s7 = r3(T.quer - 0.15);
T.custo = at("custobeneficio");
T.clique = GRID.cta; // "Clique" (refrão da trilha)
T.en = r3(T.clique - 0.18);
T.link = at("link");
T.preencha = at("preencha");
T.formulario = at("formulario");
T.nossa = at("nossa");
T.contato = at("contato");
T.melhores = at("melhores", T.contato);
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

const base = (p) => `
${FONTS}
#${p}-root{position:absolute;inset:0;width:${W}px;height:${H}px;overflow:hidden;font-family:"Poppins",Arial,sans-serif;color:#fff;}
.${p}-full{position:absolute;left:0;top:0;width:${W}px;height:${H}px;}
.d{font-family:"Mont",Arial,sans-serif;}
.w{display:inline-block;overflow:hidden;vertical-align:top;padding:0.1em 0.04em 0.06em;margin:-0.1em -0.04em -0.06em;}
.wi{display:inline-block;}
.ln{position:absolute;left:0;width:${W}px;text-align:center;white-space:nowrap;}
.ch{color:${CH};}
.kk{position:absolute;left:0;width:${W}px;text-align:center;font-weight:700;font-size:28px;letter-spacing:.18em;color:${CH};}
.pill{position:absolute;left:0;width:${W}px;display:flex;justify-content:center;}
.pill>div{display:flex;align-items:center;gap:12px;padding:12px 30px;border:2px solid rgba(232,194,122,.7);border-radius:60px;background:rgba(232,194,122,.1);font-weight:700;font-size:26px;letter-spacing:.12em;color:${CH};}
.sweep{position:absolute;left:0;top:0;width:100%;height:100%;background:linear-gradient(105deg,rgba(255,255,255,0) 35%,rgba(255,255,255,.55) 50%,rgba(255,255,255,0) 65%);mix-blend-mode:screen;}
.shift{position:absolute;left:0;width:${W}px;}
.legal{position:absolute;left:90px;width:${W - 180}px;text-align:center;font-size:20px;line-height:1.4;color:rgba(255,255,255,.86);}
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
  pin: `<path d="M24 44s14-13.5 14-24a14 14 0 0 0-28 0c0 10.5 14 24 14 24z"/><circle cx="24" cy="20" r="5"/>`,
  building: `<path d="M8 42V10l16-5v37M24 16l16 5v21M4 42h40M14 16h4M14 23h4M14 30h4M30 26h4M30 33h4"/>`,
  person: `<circle cx="24" cy="16" r="8"/><path d="M8 44c0-9 7-15 16-15s16 6 16 15"/>`,
  family: `<circle cx="17" cy="14" r="6"/><circle cx="33" cy="17" r="5"/><path d="M5 42c0-8 5-14 12-14s12 6 12 14M27 42c0-6 3-11 7-11s9 5 9 11"/>`,
  calendar: `<rect x="7" y="10" width="34" height="32" rx="4"/><path d="M7 19h34M16 5v9M32 5v9M15 27h4M22 27h4M29 27h4M15 34h4M22 34h4"/>`,
  hospital: `<path d="M9 42V12h30v30M4 42h40M20 42v-8h8v8M24 17v9M19.5 21.5h9"/>`,
  star: `<path d="M24 5l5.6 12.2 13.4 1.5-10 9 2.8 13.2L24 34.2 12.2 40.9 15 27.7l-10-9 13.4-1.5z"/>`,
  search: `<circle cx="21" cy="21" r="13"/><path d="M31 31l11 11M15 21l4.5 4.5L27 17"/>`,
  form: `<rect x="10" y="8" width="28" height="36" rx="4"/><path d="M18 8V5h12v3M16 20h16M16 28h16M16 36h10"/>`,
  down: `<path d="M12 10l12 12 12-12M12 24l12 12 12-12"/>`,
};
const icon = (name, size, { id = "", sw = 3.4, color = "#fff", fill = "none" } = {}) =>
  `<svg ${id ? `id="${id}" ` : ""}viewBox="0 0 48 48" width="${size}" height="${size}" fill="${fill}" stroke="${color}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`;

// hospitais citados (fotos enviadas pelo cliente) e cubos das operadoras
const HOSP = [
  { src: "assets/img/sirio-libanes.jpg", name: "Sírio-Libanês", alt: "Hospital Sírio-Libanês", pos: "50% 60%" },
  { src: "assets/img/sao-luiz-itaim.jpg", name: "São Luiz Itaim", alt: "Hospital São Luiz Itaim", pos: "50% 18%" },
  { src: "assets/img/sao-luiz-morumbi.jpg", name: "São Luiz Morumbi", alt: "Hospital São Luiz Morumbi", pos: "40% 50%" },
  { src: "assets/img/vila-nova-star.jpg", name: "Vila Nova Star", alt: "Hospital Vila Nova Star", pos: "52% 40%" },
  { src: "assets/img/oswaldo-cruz.jpg", name: "Oswaldo Cruz", alt: "Hospital Alemão Oswaldo Cruz", pos: "50% 78%" },
  { src: "assets/img/santa-catarina.jpg", name: "Santa Catarina", alt: "Hospital Santa Catarina", pos: "30% 40%" },
];
HOSP.forEach((h, i) => (h.t = T.hosp[i]));
// k = largura da imagem para a face do cubo ficar do mesmo tamanho visual
const OPS = [
  { src: "assets/img/cubo-omint.png", alt: "Omint", k: 1.0, ar: 528 / 441 },
  { src: "assets/img/cubo-sulamerica.png", alt: "SulAmérica", k: 1.1, ar: 242 / 259 },
  { src: "assets/img/cubo-bradesco.png", alt: "Bradesco", k: 1.03, ar: 196 / 193 },
  { src: "assets/img/cubo-amil.png", alt: "Amil", k: 1.0, ar: 532 / 451 },
];
const opImg = (id, i, w, cx, cy, style = "") => {
  const iw = Math.round(w * OPS[i].k);
  const ih = Math.round(iw * OPS[i].ar);
  return `<img id="${id}" src="${OPS[i].src}" alt="${OPS[i].alt}" style="position:absolute;left:${Math.round(cx - iw / 2)}px;top:${Math.round(cy - ih / 2)}px;width:${iw}px;height:${ih}px;${style}" />`;
};

// observações obrigatórias (texto exato, só por escrito — ver CLAUDE.md da raiz)
const OBS = {
  rede: "Consulte a disponibilidade da rede hospitalar.",
  varia: "A rede credenciada pode variar conforme plano contratado.",
  eleg: "Consulte condições e elegibilidade.",
  analise: "Condições sujeitas à análise comercial.",
  faixa: "Valores sujeitos à faixa etária e região.",
  ref: "Valores referenciais sujeitos às regras da operadora.",
  perfil: "Os valores podem variar conforme perfil do beneficiário.",
  img: "Imagem meramente ilustrativa.",
};
// dados da cotação (cartão final)
const COT = "Valor a partir de R$ 1.800/mês para 3 pessoas: casal de 30 anos e um jovem de até 18 anos.";

const scenes = [];

// ═════════════ fundo: azul-meia-noite com brilho champanhe ═════════════
{
  const p = "bg";
  const { a, add } = TL(0);
  const css =
    base(p) +
    `
#bg-base{background:radial-gradient(95% 55% at 50% 32%,#16294A 0%,${NAVY} 46%,${NIGHT} 100%);}
.bg-gl{position:absolute;border-radius:50%;}
#bg-ch{left:-220px;top:280px;width:1300px;height:1300px;background:radial-gradient(closest-side,rgba(232,194,122,.2),rgba(232,194,122,0));}
#bg-bl{left:120px;top:860px;width:1300px;height:1300px;background:radial-gradient(closest-side,rgba(80,130,230,.18),rgba(80,130,230,0));}
#bg-dots{position:absolute;left:0;top:-72px;}
#bg-vig{background:radial-gradient(110% 75% at 50% 45%,rgba(0,0,0,0) 55%,rgba(2,5,12,.66) 100%);}
`;
  const body = `
  <div id="bg-base" class="${p}-full"></div>
  <div id="bg-ch" class="bg-gl" data-layout-allow-overflow aria-hidden="true"></div>
  <div id="bg-bl" class="bg-gl" data-layout-allow-overflow aria-hidden="true"></div>
  <svg id="bg-dots" width="${W}" height="${H + 144}" aria-hidden="true" data-layout-allow-overflow>
    <defs><pattern id="bg-pt" width="36" height="36" patternUnits="userSpaceOnUse"><circle cx="18" cy="18" r="1.8" fill="rgba(255,255,255,.06)"/></pattern></defs>
    <rect width="${W}" height="${H + 144}" fill="url(#bg-pt)"/></svg>
  <div id="bg-vig" class="${p}-full"></div>`;
  add(`tl.fromTo("#bg-dots",{y:0},{y:72,duration:${D},ease:"none"},0);`);
  add(`tl.fromTo("#bg-ch",{x:0,y:0,scale:1},{x:240,y:-160,scale:1.18,duration:${D},ease:"sine.inOut"},0);`);
  add(`tl.fromTo("#bg-bl",{x:0,y:0,scale:1},{x:-260,y:120,scale:1.12,duration:${D},ease:"sine.inOut"},0);`);
  add(`tl.fromTo("#bg-ch",{opacity:0.7},{opacity:1,duration:0.6,ease:"power2.out"},${T.drop});`);
  scenes.push({ st: 0, track: 0, ...scene(p, D, css, body, a) });
}

// ═════════════ 1 · gancho: "Tenha acesso às principais redes hospitalares de São Paulo através do seu CNPJ!" ═════════════
{
  const p = "s1";
  const st = 0;
  const dur = r3(T.s2 + 0.1);
  const { a, L, add, shake } = TL(st);
  const TW = 400;
  const TH = 290;
  const GAP = 22;
  const cols = [0, 1, 2].map((c) => Array.from({ length: 8 }, (_, r) => HOSP[(r + c * 2) % HOSP.length]));
  const css =
    base(p) +
    `
#s1-mzw{position:absolute;left:0;top:0;width:${W}px;height:${H}px;}
#s1-mz{position:absolute;left:-210px;top:-420px;width:1500px;height:2760px;transform:rotate(-8deg);}
.s1-col{position:absolute;top:0;width:${TW}px;}
.s1-t{position:absolute;left:0;width:${TW}px;height:${TH}px;border-radius:26px;background-size:cover;background-repeat:no-repeat;box-shadow:0 18px 40px rgba(0,0,0,.45);}
#s1-scr{background:linear-gradient(180deg,rgba(7,11,20,.94) 0%,rgba(7,11,20,.74) 20%,rgba(7,11,20,.72) 50%,rgba(7,11,20,.76) 80%,rgba(7,11,20,.95) 100%);}
#s1-rad{background:radial-gradient(70% 36% at 50% 46%,rgba(7,11,20,.66),rgba(7,11,20,0));}
.s1-tx{text-shadow:0 4px 24px rgba(0,0,0,.6);}
#s1-l1{top:466px;font-weight:800;font-size:64px;line-height:1.05;}
#s1-l2{top:550px;font-weight:900;font-size:100px;line-height:1.05;letter-spacing:-.02em;color:${CH};}
#s1-l2i{position:relative;display:inline-block;}
#s1-ul{position:absolute;left:0;bottom:-6px;width:100%;height:10px;border-radius:6px;background:${CH};}
#s1-l3{top:664px;font-weight:900;font-size:100px;line-height:1.05;letter-spacing:-.02em;}
#s1-l4{top:788px;font-weight:800;font-size:76px;line-height:1.05;}
#s1-cd{position:absolute;left:130px;top:930px;width:820px;height:200px;border-radius:44px;background:rgba(14,26,46,.94);border:2px solid rgba(232,194,122,.6);box-shadow:0 26px 60px rgba(0,0,0,.5);}
#s1-ci{position:absolute;left:34px;top:38px;width:124px;height:124px;border-radius:50%;background:linear-gradient(135deg,${CH2},${CH});display:flex;align-items:center;justify-content:center;}
#s1-c1{position:absolute;left:190px;top:30px;font-weight:700;font-size:40px;color:${MUTED};white-space:nowrap;}
#s1-c2{position:absolute;left:186px;top:76px;font-weight:900;font-size:96px;line-height:1.05;letter-spacing:-.02em;color:${CH};white-space:nowrap;}
`;
  const body = `
  <div id="s1-main" class="${p}-full">
    <div id="s1-mzw" data-layout-allow-overflow aria-hidden="true"><div id="s1-mz" data-layout-allow-overflow>
      ${cols
        .map(
          (col, c) =>
            `<div class="s1-col" id="s1-col${c}" style="left:${100 + c * 450}px">${col
              .map((h, r) => `<div class="s1-t" style="top:${r * (TH + GAP)}px;background-image:url('${h.src}');background-position:${h.pos}"></div>`)
              .join("")}</div>`,
        )
        .join("\n      ")}
    </div></div>
    <div id="s1-scr" class="${p}-full"></div>
    <div id="s1-rad" class="${p}-full"></div>
    <div class="shift" id="s1-sh" style="top:40px;height:${H - 40}px">
    <div class="pill" id="s1-pill" style="top:392px"><div class="d">${icon("building", 30, { color: CH, sw: 3.6 })}<span>PLANO DE SAÚDE EMPRESARIAL</span></div></div>
    <div id="s1-l1" class="ln d s1-tx">Tenha acesso às</div>
    <div id="s1-l2" class="ln d s1-tx"><span id="s1-l2i">principais redes<i id="s1-ul" aria-hidden="true"></i></span></div>
    <div id="s1-l3" class="ln d s1-tx">hospitalares</div>
    <div id="s1-l4" class="ln d s1-tx"><span id="s1-pin" style="display:inline-block">${icon("pin", 62, { color: CH, sw: 3.8 })}</span> de <span class="ch">São Paulo</span></div>
    <div id="s1-cd">
      <div id="s1-ci">${icon("building", 70, { color: INK, sw: 3.4 })}</div>
      <div id="s1-c1" class="d">através do seu</div>
      <div id="s1-c2" class="d"><span id="s1-cn" style="display:inline-block">CNPJ!</span></div>
    </div>
    <div class="legal" id="${p}-lg" style="top:1190px">${OBS.rede} ${OBS.varia} ${OBS.eleg} ${OBS.img}</div>
    </div>
  </div>`;
  // título inteiro já no quadro 0 (miniatura e autoplay), sobre o mosaico com as fotos dos hospitais
  add(`tl.fromTo("#s1-mzw",{scale:1.12},{scale:1,duration:${dur},ease:"none"},0);`);
  [0, 1, 2].forEach((c) => add(`tl.fromTo("#s1-col${c}",{y:${c % 2 ? -360 : 0}},{y:${c % 2 ? 0 : -360},duration:${dur},ease:"none"},0);`));
  add(`tl.fromTo(["#s1-l1","#s1-l2","#s1-l3","#s1-l4"],{scale:1.06},{scale:1,duration:0.6,ease:"power3.out",stagger:0.05},0);`);
  // a fala vai sublinhando: "principais redes" e o pino de "São Paulo"
  add(`tl.fromTo("#s1-ul",{scaleX:0},{scaleX:1,duration:0.7,ease:"power2.inOut",transformOrigin:"0% 50%"},${L(T.principais)});`);
  add(`tl.fromTo("#s1-pin",{y:-40,scale:0.6},{y:0,scale:1,duration:0.45,ease:"back.out(3)",immediateRender:false},${L(T.sao - 0.08)});`);
  // "através do seu CNPJ!": o cartão já está no quadro 0 (miniatura completa); a fala acende o cartão e
  // o "CNPJ!" dá o soco
  add(`tl.fromTo("#s1-cd",{y:40},{y:0,duration:0.7,ease:"power3.out"},0);`);
  add(`tl.fromTo("#s1-ci",{rotation:0},{rotation:360,duration:0.6,ease:"back.out(1.6)"},${L(T.atraves - 0.05)});`);
  add(`tl.fromTo("#s1-cd",{borderColor:"rgba(232,194,122,.6)"},{borderColor:"rgba(247,223,168,1)",duration:0.3,ease:"power2.out",immediateRender:false},${L(T.atraves)});`);
  add(`tl.fromTo("#s1-cn",{scale:1.4},{scale:1,duration:0.3,ease:"power4.out",immediateRender:false},${L(T.cnpj - 0.04)});`);
  shake("#s1-sh", r3(L(T.cnpj) + 0.18), 12); // só o texto treme; o mosaico não mostra a borda
  add(`tl.fromTo("#${p}-lg",{opacity:0},{opacity:1,duration:0.4},0.6);`);
  add(`tl.to("#s1-main",{scale:1.06,opacity:0,duration:0.3,ease:"power2.in"},${r3(dur - 0.3)});`);
  scenes.push({ st, track: 1, ...scene(p, dur, css, body, a) });
}

// ═════════════ 2 · "Com um plano de saúde empresarial, você pode ter acesso a hospitais de referência como…" ═════════════
{
  const p = "s2";
  const st = r3(T.s2 - 0.05);
  const dur = r3(T.s3 + 0.1 - st);
  const { a, L, add, words } = TL(st);
  const css =
    base(p) +
    `
.s2-ic{position:absolute;top:420px;width:156px;height:156px;border-radius:50%;background:linear-gradient(135deg,${CH2},${CH});display:flex;align-items:center;justify-content:center;box-shadow:0 18px 40px rgba(0,0,0,.4);}
.s2-il{position:absolute;top:596px;width:300px;text-align:center;font-weight:700;font-size:26px;letter-spacing:.1em;color:${MUTED};}
#s2-ar{position:absolute;left:430px;top:468px;width:220px;height:60px;}
#s2-a{top:670px;font-weight:700;font-size:54px;color:${MUTED};}
#s2-b{top:744px;font-weight:900;font-size:90px;line-height:1.05;letter-spacing:-.02em;}
#s2-c{top:850px;font-weight:900;font-size:104px;line-height:1.05;letter-spacing:-.02em;}
#s2-d{top:990px;font-weight:600;font-size:50px;}
#s2-e{top:1058px;font-weight:900;font-size:76px;line-height:1.05;}
`;
  const body = `
  <div id="s2-wrap" class="${p}-full">
    <div class="shift" style="top:40px;height:${H - 40}px">
    <div class="s2-ic" id="s2-i0" style="left:252px">${icon("building", 84, { color: INK, sw: 3.2 })}</div>
    <div class="s2-ic" id="s2-i1" style="left:672px">${icon("hospital", 84, { color: INK, sw: 3.2 })}</div>
    <div class="s2-il d" id="s2-n0" style="left:180px">SUA EMPRESA</div>
    <div class="s2-il d" id="s2-n1" style="left:600px">HOSPITAIS</div>
    <svg id="s2-ar" viewBox="0 0 220 60" width="220" height="60" aria-hidden="true">
      <path id="s2-ap" pathLength="1" d="M10 30H196M178 12l20 18-20 18" fill="none" stroke="${CH}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="1" stroke-dashoffset="1"/></svg>
    <div id="s2-a" class="ln d">${wspans("s2a", "Com um")}</div>
    <div id="s2-b" class="ln d">${wspans("s2b", "plano de saúde")}</div>
    <div id="s2-c" class="ln d">${wspans("s2c", "empresarial", "ch")}</div>
    <div id="s2-d" class="ln">${wspans("s2d", "você pode ter acesso a")}</div>
    <div id="s2-e" class="ln d">${wspans("s2e", "hospitais de referência")}</div>
    <div class="legal" id="${p}-lg" style="top:1210px">${OBS.rede} ${OBS.varia}</div>
    </div>
  </div>`;
  const s = seq("com um plano de saude empresarial voce pode ter acesso a hospitais de referencia", T.com);
  words("s2a", s.slice(0, 2));
  words("s2b", s.slice(2, 5));
  words("s2c", s.slice(5, 6));
  words("s2d", s.slice(6, 11));
  words("s2e", s.slice(11, 14));
  // empresa → hospitais
  add(`tl.fromTo("#s2-i0",{scale:0,rotation:-60},{scale:1,rotation:0,duration:0.45,ease:"back.out(2.2)"},${L(T.empresarial - 0.1)});`);
  add(`tl.fromTo("#s2-n0",{opacity:0,y:10},{opacity:1,y:0,duration:0.3},${L(T.empresarial + 0.1)});`);
  add(`tl.to("#s2-ap",{strokeDashoffset:0,duration:0.6,ease:"power2.inOut"},${L(T.voce)});`);
  add(`tl.fromTo("#s2-i1",{scale:0,rotation:60},{scale:1,rotation:0,duration:0.45,ease:"back.out(2.2)"},${L(T.hospitais - 0.1)});`);
  add(`tl.fromTo("#s2-n1",{opacity:0,y:10},{opacity:1,y:0,duration:0.3},${L(T.hospitais + 0.1)});`);
  add(`tl.to("#s2-i1",{scale:1.12,duration:0.25,ease:"power2.out",yoyo:true,repeat:1},${L(T.como)});`);
  add(`tl.fromTo("#${p}-lg",{opacity:0},{opacity:1,duration:0.4},${L(T.hospitais)});`);
  add(`tl.to("#s2-wrap",{y:-120,opacity:0,duration:0.3,ease:"power3.in"},${r3(dur - 0.32)});`);
  scenes.push({ st, track: 2, ...scene(p, dur, css, body, a) });
}

// ═════════════ 3 · hospitais: um cartão com foto para cada nome, empilhando ═════════════
{
  const p = "s3";
  const st = r3(T.s3 - 0.05);
  const dur = r3(T.s4 + 0.1 - st);
  const { a, L, add, words } = TL(st);
  const ROT = [-2.5, 2, -1.5, 2.5, -2, 0];
  const css =
    base(p) +
    `
#s3-k{top:300px;}
#s3-h{top:344px;font-weight:900;font-size:76px;line-height:1.05;}
#s3-dk{position:absolute;left:90px;top:456px;width:900px;height:560px;}
.s3-c{position:absolute;left:0;top:0;width:900px;height:560px;border-radius:36px;overflow:hidden;background:${NAVY};box-shadow:0 34px 80px rgba(0,0,0,.6),0 0 0 3px rgba(232,194,122,.6);}
.s3-c img{display:block;width:100%;height:100%;object-fit:cover;}
.s3-gr{position:absolute;left:0;right:0;bottom:0;height:62%;background:linear-gradient(180deg,rgba(7,11,20,0),rgba(7,11,20,.92));}
.s3-dim{position:absolute;inset:0;background:${NIGHT};opacity:0;}
.s3-kk{position:absolute;left:44px;bottom:112px;font-weight:700;font-size:26px;letter-spacing:.18em;color:${CH};}
.s3-nm{position:absolute;left:44px;bottom:32px;font-weight:900;font-size:68px;line-height:1.1;letter-spacing:-.01em;color:#fff;white-space:nowrap;}
.s3-ix{position:absolute;left:30px;top:30px;padding:8px 20px;border-radius:40px;background:rgba(7,11,20,.8);font-weight:800;font-size:24px;letter-spacing:.08em;color:#fff;}
.s3-ck{position:absolute;right:30px;top:26px;width:74px;height:74px;border-radius:50%;background:${GREEN};display:flex;align-items:center;justify-content:center;box-shadow:0 10px 24px rgba(0,0,0,.4);}
.s3-row{position:absolute;left:0;width:${W}px;display:flex;justify-content:center;gap:16px;}
.s3-ch{height:72px;border-radius:40px;background:rgba(255,255,255,.08);border:2px solid rgba(232,194,122,.5);display:flex;align-items:center;gap:14px;padding:0 26px 0 12px;font-weight:700;font-size:29px;white-space:nowrap;}
.s3-ch .ck{width:50px;height:50px;border-radius:50%;background:${GREEN};display:flex;align-items:center;justify-content:center;}
#s3-nt{top:1310px;font-weight:600;font-size:32px;color:#fff;}
`;
  const chip = (i) => `<div class="s3-ch d" id="s3-p${i}"><span class="ck" id="s3-q${i}">${icon("check", 30, { color: "#fff", sw: 5.5 })}</span><span>${HOSP[i].name}</span></div>`;
  const body = `
  <div id="s3-wrap" class="${p}-full">
    <div class="shift" style="top:30px;height:${H - 30}px">
    <div id="s3-k" class="kk d">SÃO PAULO · SP</div>
    <div id="s3-h" class="ln d">Hospitais de referência</div>
    <div id="s3-dk" data-layout-allow-overlap>
      ${HOSP.map(
        (h, i) => `<div class="s3-c" id="s3-c${i}" data-layout-allow-occlusion><img id="s3-i${i}" data-layout-allow-overflow src="${h.src}" alt="${h.alt}" style="object-position:${h.pos}" />
        <div class="s3-gr"></div>
        <div class="s3-ix d" data-layout-allow-occlusion>0${i + 1} / 0${HOSP.length}</div>
        <div class="s3-ck" id="s3-k${i}">${icon("check", 46, { color: "#fff", sw: 5.5 })}</div>
        <div class="s3-kk d" data-layout-allow-occlusion>HOSPITAL</div>
        <div class="s3-nm d" data-layout-allow-occlusion>${h.name}</div>
        <div class="s3-dim" id="s3-d${i}"></div></div>`,
      ).join("\n      ")}
    </div>
    <div class="s3-row" style="top:1046px">${chip(0)}${chip(1)}</div>
    <div class="s3-row" style="top:1132px">${chip(2)}${chip(3)}</div>
    <div class="s3-row" style="top:1218px">${chip(4)}${chip(5)}</div>
    <div id="s3-nt" class="ln"><span class="ch" id="s3-ast" style="display:inline-block">*</span>${wspans("s3n", "conforme a rede credenciada do plano escolhido")}</div>
    <div class="legal" id="${p}-lg" style="top:1380px">${OBS.rede} ${OBS.varia} ${OBS.img}</div>
    </div>
  </div>`;
  add(`tl.fromTo(["#s3-k","#s3-h"],{opacity:0,y:16},{opacity:1,y:0,duration:0.35,ease:"power3.out",stagger:0.06},0.02);`);
  // cada hospital entra quando é dito; o anterior recua e escurece
  const enter = HOSP.map((h, i) => (i === 0 ? T.drop - 0.12 : h.t - 0.2));
  HOSP.forEach((h, i) => {
    const t = L(enter[i]);
    add(`tl.fromTo("#s3-c${i}",{x:1150,rotation:14},{x:0,rotation:${ROT[i]},duration:0.5,ease:"power4.out"},${t});`);
    add(`tl.fromTo("#s3-i${i}",{scale:1.18},{scale:1,duration:2.6,ease:"power1.out"},${t});`);
    add(`tl.fromTo("#s3-k${i}",{scale:0},{scale:1,duration:0.3,ease:"back.out(2.6)"},${L(h.t + 0.22)});`);
    add(`tl.fromTo("#s3-p${i}",{scale:0.6,opacity:0},{scale:1,opacity:1,duration:0.35,ease:"back.out(2)"},${L(h.t + 0.1)});`);
    add(`tl.fromTo("#s3-q${i}",{scale:0},{scale:1,duration:0.3,ease:"back.out(2.6)"},${L(h.t + 0.3)});`);
    if (i > 0) {
      add(`tl.to("#s3-c${i - 1}",{scale:0.92,duration:0.45,ease:"power3.out"},${t});`);
      add(`tl.to("#s3-d${i - 1}",{opacity:0.55,duration:0.4},${t});`);
    }
  });
  words("s3n", seq("conforme a rede credenciada do plano escolhido", T.conforme), 0.35);
  add(`tl.fromTo("#s3-ast",{opacity:0},{opacity:1,duration:0.2},${L(T.conforme - 0.06)});`);
  add(`tl.fromTo("#${p}-lg",{opacity:0},{opacity:1,duration:0.4},${L(T.drop + 0.6)});`);
  add(`tl.to("#s3-wrap",{y:-120,opacity:0,duration:0.3,ease:"power3.in"},${r3(dur - 0.32)});`);
  scenes.push({ st, track: 1, ...scene(p, dur, css, body, a) });
}

// ═════════════ 4 · preço: "E o melhor: planos a partir de R$ 1.800 por mês para três pessoas…" ═════════════
{
  const p = "s4";
  const st = r3(T.s4 - 0.05);
  const dur = r3(T.s5 + 0.1 - st);
  const { a, L, add, words, shake } = TL(st);
  const DH = 214; // altura de cada dígito no contador
  const digits = [1, 8, 0, 0];
  const css =
    base(p) +
    `
#s4-a{top:330px;font-weight:800;font-size:68px;color:${CH};}
#s4-b{top:420px;font-weight:600;font-size:50px;}
#s4-pr{position:absolute;left:0;width:${W}px;top:486px;height:${DH}px;display:flex;justify-content:center;align-items:flex-start;gap:6px;}
#s4-rs{font-weight:900;font-size:60px;line-height:1;color:${CH};margin-top:40px;margin-right:10px;}
#s4-gl{position:absolute;left:90px;top:440px;width:900px;height:320px;border-radius:50%;background:radial-gradient(closest-side,rgba(232,194,122,.3),rgba(232,194,122,0));opacity:0;}
.s4-dg{position:relative;height:${DH}px;overflow:hidden;}
.s4-st{display:flex;flex-direction:column;font-weight:900;font-size:198px;line-height:${DH}px;letter-spacing:-.02em;color:${CH};font-variant-numeric:tabular-nums;text-align:center;}
#s4-dot{font-weight:900;font-size:198px;line-height:${DH}px;color:${CH};}
#s4-ms{font-weight:800;font-size:54px;line-height:1;color:#fff;margin-top:134px;margin-left:10px;}
#s4-fx{top:712px;font-size:24px;color:rgba(255,255,255,.9);}
#s4-pp{position:absolute;left:0;width:${W}px;top:780px;display:flex;justify-content:center;}
#s4-ppi{display:flex;align-items:center;gap:18px;padding:16px 40px 16px 26px;border-radius:60px;background:rgba(232,194,122,.14);border:3px solid ${CH};font-weight:900;font-size:46px;}
#s4-ppi .ic{display:flex;gap:2px;}
#s4-cd{position:absolute;left:150px;top:920px;width:780px;height:260px;border-radius:36px;background:#fff;color:${INK};box-shadow:0 26px 60px rgba(0,0,0,.45);}
#s4-cl{position:absolute;left:0;width:100%;top:22px;text-align:center;font-weight:700;font-size:24px;letter-spacing:.16em;color:${SLATE};}
.s4-r{position:absolute;left:40px;width:700px;height:86px;display:flex;align-items:center;gap:22px;font-weight:800;font-size:38px;}
.s4-av{display:flex;gap:6px;}
.s4-av span{width:68px;height:68px;border-radius:50%;background:#F3E6C8;display:flex;align-items:center;justify-content:center;}
.s4-av span.sm{width:56px;height:56px;margin-top:12px;}
`;
  const body = `
  <div id="s4-wrap" class="${p}-full">
    <div class="shift" style="top:80px;height:${H - 80}px">
    <div id="s4-a" class="ln d">${wspans("s4a", "E o melhor:")}</div>
    <div id="s4-b" class="ln">${wspans("s4b", "planos a partir de")}</div>
    <div id="s4-gl" aria-hidden="true"></div>
    <div id="s4-pr" class="d">
      <span id="s4-rs">R$</span>
      ${digits
        .map(
          (d, i) =>
            `${i === 1 ? `<span id="s4-dot">.</span>` : ""}<div class="s4-dg" data-layout-allow-overflow><div class="s4-st" id="s4-d${i}" data-layout-allow-overflow data-layout-allow-occlusion>${Array.from({ length: 20 }, (_, k) => `<span>${k % 10}</span>`).join("")}</div></div>`,
        )
        .join("")}
      <span id="s4-ms">/mês</span>
    </div>
    <div id="s4-fx" class="ln">${OBS.faixa}</div>
    <div id="s4-pp"><div id="s4-ppi" class="d"><span class="ic">${[0, 1, 2].map((i) => `<span id="s4-pi${i}" style="display:inline-block">${icon("person", 44, { color: CH, sw: 3.8 })}</span>`).join("")}</span><span>para 3 pessoas</span></div></div>
    <div id="s4-cd">
      <div id="s4-cl" class="d">CONSIDERANDO</div>
      <div class="s4-r" id="s4-r0" style="top:66px"><span class="s4-av"><span>${icon("person", 44, { color: INK, sw: 3.6 })}</span><span>${icon("person", 44, { color: INK, sw: 3.6 })}</span></span><span class="d">Casal de 30 anos</span></div>
      <div class="s4-r" id="s4-r1" style="top:160px"><span class="s4-av"><span class="sm">${icon("person", 36, { color: INK, sw: 3.8 })}</span></span><span class="d">+ 1 jovem de até 18 anos</span></div>
    </div>
    <div class="legal" id="${p}-lg" style="top:1214px">${OBS.ref} ${OBS.perfil}</div>
    </div>
  </div>`;
  words("s4a", seq("e o melhor", T.e4));
  words("s4b", seq("planos a partir de", T.planos));
  // contador: R$ aparece no "de", os dígitos rolam no "mil e oitocentos"
  add(`tl.fromTo("#s4-pr",{opacity:0,scale:0.8},{opacity:1,scale:1,duration:0.35,ease:"back.out(1.8)"},${L(T.mil - 0.3)});`);
  const rollEnd = T.oitocentosEnd;
  digits.forEach((d, i) => {
    const t0 = r3(L(T.mil - 0.2) + i * 0.08);
    add(`tl.fromTo("#s4-d${i}",{y:0},{y:${-(10 + d) * DH},duration:${r3(L(rollEnd) - t0)},ease:"power3.out"},${t0});`);
  });
  add(`tl.fromTo("#s4-dot",{opacity:0},{opacity:1,duration:0.2},${L(T.mil)});`);
  shake("#s4-pr", r3(L(rollEnd) + 0.02), 8);
  add(`tl.fromTo("#s4-gl",{opacity:0,scale:0.6},{opacity:1,scale:1,duration:0.4,ease:"power2.out"},${L(rollEnd)});`);
  add(`tl.fromTo("#s4-ms",{x:-30,opacity:0},{x:0,opacity:1,duration:0.3,ease:"power3.out"},${L(T.mes - 0.08)});`);
  add(`tl.fromTo("#s4-fx",{opacity:0},{opacity:1,duration:0.35},${L(rollEnd + 0.1)});`);
  add(`tl.fromTo("#s4-ppi",{scale:0.5,opacity:0},{scale:1,opacity:1,duration:0.4,ease:"back.out(2)"},${L(T.tres - 0.12)});`);
  [0, 1, 2].forEach((i) => add(`tl.fromTo("#s4-pi${i}",{y:-26,opacity:0},{y:0,opacity:1,duration:0.3,ease:"back.out(3)"},${r3(L(T.tres) + i * 0.1)});`));
  add(`tl.fromTo("#s4-cd",{y:80,opacity:0},{y:0,opacity:1,duration:0.4,ease:"power3.out"},${L(T.casal - 0.5)});`);
  add(`tl.fromTo("#s4-r0",{x:-40,opacity:0},{x:0,opacity:1,duration:0.35,ease:"power3.out"},${L(T.casal - 0.06)});`);
  add(`tl.fromTo("#s4-r1",{x:-40,opacity:0},{x:0,opacity:1,duration:0.35,ease:"power3.out"},${L(T.jovem - 0.1)});`);
  add(`tl.fromTo("#${p}-lg",{opacity:0},{opacity:1,duration:0.4},${L(rollEnd + 0.3)});`);
  add(`tl.to("#s4-wrap",{y:-120,opacity:0,duration:0.3,ease:"power3.in"},${r3(dur - 0.32)});`);
  scenes.push({ st, track: 2, ...scene(p, dur, css, body, a) });
}

// ═════════════ 5 · operadoras: "Nós comparamos as principais operadoras do mercado… Omint, SulAmérica, Bradesco Saúde e Amil" ═════════════
const CUBE_XY = [
  [315, 815],
  [765, 815],
  [315, 1165],
  [765, 1165],
];
{
  const p = "s5";
  const st = r3(T.s5 - 0.05);
  const dur = r3(T.s6 + 0.1 - st);
  const { a, L, add, words } = TL(st);
  const css =
    base(p) +
    `
#s5-a{top:334px;font-weight:900;font-size:84px;line-height:1.05;}
#s5-b{top:440px;font-weight:800;font-size:56px;line-height:1.05;}
#s5-c{top:516px;font-weight:700;font-size:44px;line-height:1.05;color:${MUTED};}
#s5-bd{position:absolute;left:90px;top:640px;width:900px;height:700px;border-radius:44px;background:rgba(255,255,255,.05);border:2px solid rgba(232,194,122,.32);overflow:hidden;}
#s5-v{position:absolute;left:449px;top:40px;width:2px;height:620px;background:rgba(255,255,255,.1);}
#s5-hz{position:absolute;left:40px;top:349px;width:820px;height:2px;background:rgba(255,255,255,.1);}
#s5-scan{position:absolute;left:0;top:-160px;width:100%;height:160px;background:linear-gradient(180deg,rgba(232,194,122,0),rgba(232,194,122,.32),rgba(232,194,122,0));}
.s5-gl{position:absolute;width:380px;height:380px;border-radius:50%;background:radial-gradient(closest-side,rgba(232,194,122,.5),rgba(232,194,122,0));opacity:0;}
.s5-ok{position:absolute;width:58px;height:58px;border-radius:50%;background:${GREEN};display:flex;align-items:center;justify-content:center;box-shadow:0 8px 20px rgba(0,0,0,.4);}
`;
  const body = `
  <div id="s5-wrap" class="${p}-full">
    <div class="shift" style="top:50px;height:${H - 50}px">
    <div id="s5-a" class="ln d">${wspans("s5a", "Nós comparamos")}</div>
    <div id="s5-b" class="ln d">${wspans("s5b", "as principais operadoras")}</div>
    <div id="s5-c" class="ln d">${wspans("s5c", "do mercado")}</div>
    <div id="s5-bd"><div id="s5-v"></div><div id="s5-hz"></div><div id="s5-scan" data-layout-allow-overflow aria-hidden="true"></div></div>
    ${CUBE_XY.map(([x, y], i) => `<div class="s5-gl" id="s5-g${i}" style="left:${x - 190}px;top:${y - 190}px" aria-hidden="true"></div>`).join("")}
    ${OPS.map((o, i) => opImg(`s5-o${i}`, i, 270, CUBE_XY[i][0], CUBE_XY[i][1] - 8)).join("\n    ")}
    ${CUBE_XY.map(([x, y], i) => `<div class="s5-ok" id="s5-k${i}" style="left:${x + 112}px;top:${y - 158}px">${icon("check", 36, { color: "#fff", sw: 5.5 })}</div>`).join("\n    ")}
    <div class="legal" id="${p}-lg" style="top:1380px">${OBS.eleg} ${OBS.analise} ${OBS.img}</div>
    </div>
  </div>`;
  words("s5a", seq("nos comparamos", T.nos));
  words("s5b", seq("as principais operadoras", T.comparamos));
  words("s5c", seq("do mercado", T.operadoras));
  add(`tl.fromTo("#s5-bd",{opacity:0,scale:0.94},{opacity:1,scale:1,duration:0.45,ease:"power3.out"},${L(T.comparamos)});`);
  // os quatro cubos chegam apagados no "operadoras"; cada um acende quando a operadora é dita
  T.ops.forEach((t, i) => {
    add(`tl.fromTo("#s5-o${i}",{y:60,scale:0.5,opacity:0,filter:"grayscale(1) brightness(0.7)"},{y:0,scale:0.8,opacity:0.4,filter:"grayscale(1) brightness(0.7)",duration:0.4,ease:"power3.out"},${r3(L(T.operadoras) + 0.05 + i * 0.07)});`);
    add(`tl.to("#s5-o${i}",{scale:1,opacity:1,filter:"grayscale(0) brightness(1)",duration:0.36,ease:"back.out(2.2)"},${L(t - 0.08)});`);
    add(`tl.to("#s5-o${i}",{y:-26,duration:0.16,ease:"power2.out",yoyo:true,repeat:1},${L(t - 0.08)});`);
    add(`tl.fromTo("#s5-g${i}",{opacity:0,scale:0.6},{opacity:1,scale:1,duration:0.3,ease:"power2.out"},${L(t - 0.06)});`);
    add(`tl.to("#s5-g${i}",{opacity:0.35,duration:0.6,ease:"power2.out"},${L(t + 0.3)});`);
  });
  // comparação: a faixa de luz passa pelo quadro e marca as quatro
  const sc = r3(L(T.ops[3] + 0.1));
  add(`tl.to("#s5-scan",{y:${700 + 160},duration:0.55,ease:"power1.inOut"},${sc});`);
  [0, 1, 2, 3].forEach((i) => add(`tl.fromTo("#s5-k${i}",{scale:0},{scale:1,duration:0.26,ease:"back.out(2.6)"},${r3(sc + 0.12 + (i >> 1) * 0.2 + (i & 1) * 0.06)});`));
  add(`tl.fromTo("#${p}-lg",{opacity:0},{opacity:1,duration:0.4},${L(T.comparamos + 0.4)});`);
  add(`tl.to("#s5-wrap",{scale:0.92,opacity:0,duration:0.28,ease:"power3.in"},${r3(dur - 0.3)});`);
  scenes.push({ st, track: 1, ...scene(p, dur, css, body, a) });
}

// ═════════════ 6 · "e te apresentamos a melhor opção para o seu perfil." ═════════════
{
  const p = "s6";
  const st = r3(T.s6 - 0.05);
  const dur = r3(T.s7 + 0.1 - st);
  const { a, L, add, words } = TL(st);
  const MX = [300, 460, 620, 780];
  const rows = [
    ["building", "Empresa com CNPJ"],
    ["family", "Quantidade de vidas"],
    ["calendar", "Idades"],
    ["hospital", "Hospitais de preferência"],
  ];
  const css =
    base(p) +
    `
#s6-fn{position:absolute;left:0;top:388px;width:${W}px;height:110px;}
#s6-a{top:514px;font-weight:900;font-size:92px;line-height:1.05;letter-spacing:-.02em;}
#s6-b{top:624px;font-weight:800;font-size:68px;line-height:1.05;}
#s6-cw{position:absolute;left:140px;top:760px;width:800px;height:536px;}
#s6-cd{position:absolute;inset:0;border-radius:40px;background:#fff;color:${INK};overflow:hidden;box-shadow:0 30px 70px rgba(0,0,0,.5);}
#s6-hd{position:absolute;left:0;top:0;width:100%;height:100px;background:${INK};color:#fff;display:flex;align-items:center;gap:16px;padding-left:36px;font-weight:900;font-size:30px;letter-spacing:.16em;}
.s6-r{position:absolute;left:0;width:100%;height:109px;display:flex;align-items:center;gap:22px;padding-left:36px;border-top:2px solid #E3E8F0;font-weight:600;font-size:34px;}
.s6-ri{width:64px;height:64px;border-radius:18px;background:#F3E6C8;display:flex;align-items:center;justify-content:center;}
.s6-ck{position:absolute;right:36px;top:24px;width:60px;height:60px;border-radius:50%;background:${GREEN};display:flex;align-items:center;justify-content:center;}
#s6-ring{position:absolute;left:-10px;top:-10px;right:-10px;bottom:-10px;border-radius:48px;border:6px solid ${CH};opacity:0;}
#s6-bd{position:absolute;right:-30px;top:-44px;display:flex;align-items:center;gap:12px;padding:16px 30px;border-radius:50px;background:linear-gradient(180deg,${CH2},${CH});color:${INK};font-weight:900;font-size:32px;letter-spacing:.04em;white-space:nowrap;box-shadow:0 14px 34px rgba(0,0,0,.45);transform:rotate(-5deg);}
`;
  const body = `
  <div id="s6-wrap" class="${p}-full">
    <div class="shift" style="top:70px;height:${H - 70}px">
    ${OPS.map((o, i) => opImg(`s6-o${i}`, i, 108, MX[i], 330)).join("\n    ")}
    <svg id="s6-fn" viewBox="0 0 ${W} 110" width="${W}" height="110" aria-hidden="true">
      ${MX.map((x, i) => `<path id="s6-l${i}" pathLength="1" d="M${x} 0C${x} 60 540 50 540 104" fill="none" stroke="${CH}" stroke-opacity=".7" stroke-width="4" stroke-linecap="round" stroke-dasharray="1" stroke-dashoffset="1"/>`).join("")}
      <circle id="s6-dot" cx="540" cy="104" r="6" fill="${CH}"/></svg>
    <div id="s6-a" class="ln d">${wspans("s6a", "A melhor opção", "ch")}</div>
    <div id="s6-b" class="ln d">${wspans("s6b", "para o seu perfil.")}</div>
    <div id="s6-cw" data-layout-allow-overlap>
      <div id="s6-ring" aria-hidden="true"></div>
      <div id="s6-cd">
        <div id="s6-hd" class="d">${icon("person", 40, { color: CH, sw: 3.6 })}<span>SEU PERFIL</span></div>
        ${rows
          .map(
            ([ic, lb], i) => `<div class="s6-r" style="top:${100 + i * 109}px"><span class="s6-ri">${icon(ic, 40, { color: INK, sw: 3.4 })}</span><span>${lb}</span><span class="s6-ck" id="s6-k${i}">${icon("check", 36, { color: "#fff", sw: 5.5 })}</span></div>`,
          )
          .join("\n        ")}
      </div>
      <div id="s6-bd" class="d" data-layout-allow-overlap>${icon("star", 34, { color: INK, fill: INK, sw: 2 })}<span>MELHOR OPÇÃO</span></div>
    </div>
    <div class="legal" id="${p}-lg" style="top:1350px">${OBS.perfil} ${OBS.faixa} ${OBS.eleg}</div>
    </div>
  </div>`;
  // as quatro operadoras convergem para o seu perfil
  [0, 1, 2, 3].forEach((i) => {
    add(`tl.fromTo("#s6-o${i}",{scale:0.4,opacity:0},{scale:1,opacity:1,duration:0.35,ease:"back.out(2)"},${r3(0.05 + i * 0.06)});`);
    add(`tl.to("#s6-l${i}",{strokeDashoffset:0,duration:0.4,ease:"power2.inOut"},${r3(0.3 + i * 0.04)});`);
  });
  add(`tl.fromTo("#s6-dot",{scale:0,transformOrigin:"50% 50%"},{scale:1,duration:0.25,ease:"back.out(3)"},0.68);`);
  add(`tl.fromTo("#s6-cw",{y:90,opacity:0},{y:0,opacity:1,duration:0.45,ease:"power3.out"},0.2);`);
  rows.forEach((_, i) => add(`tl.fromTo("#s6-k${i}",{scale:0},{scale:1,duration:0.26,ease:"back.out(2.6)"},${L(T.apresentamos + i * 0.17)});`));
  const s = seq("a melhor opcao para o seu perfil", T.apresentamos);
  words("s6a", s.slice(0, 3));
  words("s6b", s.slice(3, 7));
  add(`tl.fromTo("#s6-bd",{scale:2.2,opacity:0},{scale:1,opacity:1,duration:0.24,ease:"power4.in"},${L(T.opcao - 0.04)});`);
  add(`tl.fromTo("#s6-ring",{opacity:0,scale:0.96},{opacity:1,scale:1,duration:0.3,ease:"power2.out"},${L(T.opcao + 0.1)});`);
  add(`tl.fromTo("#${p}-lg",{opacity:0},{opacity:1,duration:0.4},0.4);`);
  add(`tl.to("#s6-wrap",{scale:0.94,opacity:0,duration:0.24,ease:"power3.in"},${r3(dur - 0.26)});`);
  scenes.push({ st, track: 2, ...scene(p, dur, css, body, a) });
}

// ═════════════ 7 · "Quer descobrir qual plano oferece o melhor custo-benefício para você e sua família?" ═════════════
{
  const p = "s7";
  const st = r3(T.s7 - 0.05);
  const dur = r3(T.en + 0.1 - st);
  const { a, L, add, words, shake } = TL(st);
  const css =
    base(p) +
    `
.s7-rg{position:absolute;left:440px;top:400px;width:200px;height:200px;border-radius:50%;border:4px solid ${CH};opacity:0;}
#s7-ic{position:absolute;left:450px;top:410px;width:180px;height:180px;border-radius:50%;background:linear-gradient(135deg,${CH2},${CH});display:flex;align-items:center;justify-content:center;box-shadow:0 18px 44px rgba(0,0,0,.45);}
#s7-a{top:650px;font-weight:800;font-size:62px;line-height:1.05;}
#s7-b{top:730px;font-weight:800;font-size:62px;line-height:1.05;}
#s7-c{top:826px;font-weight:900;font-size:98px;line-height:1.05;letter-spacing:-.02em;color:${CH};}
#s7-ci{position:relative;display:inline-block;}
#s7-ul{position:absolute;left:0;bottom:-8px;width:100%;height:10px;border-radius:6px;background:${CH};}
#s7-d{top:960px;font-weight:800;font-size:58px;line-height:1.05;}
`;
  const body = `
  <div id="s7-wrap" class="${p}-full">
    <div class="shift" style="top:70px;height:${H - 70}px">
    <div class="s7-rg" id="s7-r0" aria-hidden="true"></div><div class="s7-rg" id="s7-r1" aria-hidden="true"></div>
    <div id="s7-ic">${icon("search", 104, { color: INK, sw: 3.6 })}</div>
    <div id="s7-a" class="ln d">${wspans("s7a", "Quer descobrir qual plano")}</div>
    <div id="s7-b" class="ln d">${wspans("s7b", "oferece o melhor")}</div>
    <div id="s7-c" class="ln d"><span id="s7-ci"><span id="s7-cw" style="display:inline-block">custo-benefício</span><i id="s7-ul" aria-hidden="true"></i></span></div>
    <div id="s7-d" class="ln d">${wspans("s7d", "para você e sua família?")}</div>
    </div>
  </div>`;
  add(`tl.fromTo("#s7-ic",{scale:0,rotation:-90},{scale:1,rotation:0,duration:0.5,ease:"back.out(2.2)"},${L(T.quer - 0.1)});`);
  [0, 1].forEach((i) =>
    add(`tl.fromTo("#s7-r${i}",{scale:1,opacity:0.9},{scale:2.6,opacity:0,duration:1.1,ease:"power2.out"},${r3(L(T.quer) + i * 0.4)});`),
  );
  const s = seq("quer descobrir qual plano oferece o melhor custobeneficio para voce e sua familia", T.quer);
  words("s7a", s.slice(0, 4));
  words("s7b", s.slice(4, 7));
  add(`tl.fromTo("#s7-cw",{scale:1.8,opacity:0},{scale:1,opacity:1,duration:0.28,ease:"power4.out"},${L(T.custo - 0.04)});`);
  add(`tl.fromTo("#s7-ul",{scaleX:0},{scaleX:1,duration:0.5,ease:"power2.inOut",transformOrigin:"0% 50%"},${L(T.custo + 0.3)});`);
  shake("#s7-wrap", r3(L(T.custo) + 0.2), 8);
  words("s7d", s.slice(8, 13));
  add(`tl.to("#s7-ic",{rotation:12,duration:0.16,ease:"sine.inOut",yoyo:true,repeat:3},${L(T.custo + 0.5)});`);
  add(`tl.to("#s7-wrap",{scale:1.18,opacity:0,duration:0.22,ease:"power3.in"},${r3(dur - 0.24)});`);
  scenes.push({ st, track: 1, ...scene(p, dur, css, body, a) });
}

// ═════════════ 8 · cartão final: rede + preço + "Preencha o formulário" + "Clique no link abaixo" ═════════════
{
  const p = "en";
  const st = r3(T.en - 0.05);
  const dur = r3(D - st);
  const { a, L, add } = TL(st);
  const CW = 132;
  const CG = 18;
  const cx0 = Math.round((W - (6 * CW + 5 * CG)) / 2);
  const BTN = { x: 90, y: 930, w: 900, h: 164 };
  const css =
    base(p) +
    `
#en-a{top:400px;font-weight:900;font-size:72px;line-height:1.05;letter-spacing:-.01em;}
#en-b{top:486px;font-weight:800;font-size:54px;line-height:1.05;}
.en-cc{position:absolute;top:586px;width:${CW}px;height:${CW}px;}
.en-ci{position:absolute;inset:0;border-radius:50%;background-size:cover;background-repeat:no-repeat;border:4px solid ${CH};box-shadow:0 14px 30px rgba(0,0,0,.45);}
.en-ck{position:absolute;right:-4px;bottom:-4px;width:42px;height:42px;border-radius:50%;background:${GREEN};border:3px solid ${NIGHT};display:flex;align-items:center;justify-content:center;}
.en-nm{position:absolute;top:${586 + CW + 10}px;width:${CW + CG}px;text-align:center;font-weight:600;font-size:20px;line-height:1.25;}
#en-pp{position:absolute;left:0;width:${W}px;top:794px;display:flex;justify-content:center;}
#en-ppi{display:flex;align-items:baseline;gap:12px;padding:14px 34px;border-radius:60px;background:rgba(232,194,122,.14);border:2px solid ${CH};font-weight:700;font-size:32px;white-space:nowrap;}
#en-ppi b{font-weight:900;font-size:44px;color:${CH};}
#en-fx{top:870px;font-size:21px;color:rgba(255,255,255,.9);}
#en-bw{position:absolute;left:${BTN.x}px;top:${BTN.y}px;width:${BTN.w}px;height:${BTN.h}px;}
#en-ring{position:absolute;inset:0;border-radius:${BTN.h}px;border:5px solid rgba(247,223,168,.9);opacity:0;}
#en-btn{position:absolute;inset:0;border-radius:${BTN.h}px;background:linear-gradient(180deg,${CH2} 0%,${CH} 100%);color:${INK};display:flex;align-items:center;justify-content:center;gap:24px;box-shadow:0 20px 50px rgba(232,194,122,.35),inset 0 2px 0 rgba(255,255,255,.5);overflow:hidden;}
#en-bt{display:flex;flex-direction:column;align-items:flex-start;}
#en-b1{font-weight:900;font-size:52px;line-height:1.05;letter-spacing:-.01em;}
#en-b2{font-weight:700;font-size:29px;line-height:1.2;margin-top:4px;}
#en-lb{position:absolute;left:0;width:${W}px;top:1126px;display:flex;justify-content:center;align-items:center;gap:16px;font-weight:800;font-size:38px;color:#fff;}
.en-ar{display:inline-flex;}
`;
  const body = `
  <div id="en-wrap" class="${p}-full">
    <div class="shift" style="top:40px;height:${H - 40}px">
    <div class="pill" id="en-pill" style="top:326px"><div class="d" id="en-pi">${icon("building", 30, { color: CH, sw: 3.6 })}<span>PLANO EMPRESARIAL · CNPJ</span></div></div>
    <div id="en-a" class="ln d"><span id="en-ai" style="display:inline-block">As principais redes</span></div>
    <div id="en-b" class="ln d"><span id="en-bi" style="display:inline-block">hospitalares de <span class="ch">São Paulo</span></span></div>
    ${HOSP.map(
      (h, i) => `<div class="en-cc" id="en-c${i}" style="left:${cx0 + i * (CW + CG)}px"><div class="en-ci" style="background-image:url('${h.src}');background-position:${h.pos}"></div><div class="en-ck" id="en-k${i}">${icon("check", 26, { color: "#fff", sw: 6 })}</div></div>
    <div class="en-nm" id="en-n${i}" style="left:${cx0 + i * (CW + CG) - CG / 2}px">${h.name.replace(/ (?=\S+$)/, "<br>")}</div>`,
    ).join("\n    ")}
    <div id="en-pp"><div id="en-ppi" class="d"><span>A partir de</span><b>R$ 1.800/mês</b><span>para 3 pessoas</span></div></div>
    <div id="en-fx" class="ln">${OBS.faixa}</div>
    <div id="en-bw"><div id="en-ring"></div><div id="en-btn">${icon("form", 72, { id: "en-ic", color: INK, sw: 3.4 })}<div id="en-bt"><span id="en-b1" class="d">Preencha o formulário</span><span id="en-b2">Nossa equipe entra em contato</span></div><div id="en-bsw" class="sweep" data-layout-allow-overflow aria-hidden="true"></div></div></div>
    <div id="en-lb" class="d"><span class="en-ar" id="en-a0">${icon("down", 50, { color: CH, sw: 4.4 })}</span><span>Clique no link abaixo</span><span class="en-ar" id="en-a1">${icon("down", 50, { color: CH, sw: 4.4 })}</span></div>
    <div class="legal" id="${p}-lg" style="top:1200px">${COT} ${OBS.faixa} ${OBS.ref} ${OBS.perfil} ${OBS.rede} ${OBS.varia} ${OBS.eleg} ${OBS.analise} ${OBS.img}</div>
    </div>
  </div>`;
  add(`tl.fromTo("#en-pi",{y:-20,opacity:0},{y:0,opacity:1,duration:0.35,ease:"power3.out"},0.05);`);
  add(`tl.fromTo("#en-ai",{y:50,opacity:0},{y:0,opacity:1,duration:0.4,ease:"power3.out"},0.1);`);
  add(`tl.fromTo("#en-bi",{y:50,opacity:0},{y:0,opacity:1,duration:0.4,ease:"power3.out"},0.2);`);
  HOSP.forEach((_, i) => {
    add(`tl.fromTo("#en-c${i}",{scale:0.4,opacity:0},{scale:1,opacity:1,duration:0.4,ease:"back.out(2)"},${r3(0.3 + i * 0.07)});`);
    add(`tl.fromTo("#en-n${i}",{opacity:0,y:10},{opacity:1,y:0,duration:0.3},${r3(0.4 + i * 0.07)});`);
    add(`tl.fromTo("#en-k${i}",{scale:0},{scale:1,duration:0.26,ease:"back.out(2.6)"},${r3(0.75 + i * 0.07)});`);
  });
  add(`tl.fromTo("#en-ppi",{scale:0.6,opacity:0},{scale:1,opacity:1,duration:0.4,ease:"back.out(2)"},0.55);`);
  add(`tl.fromTo("#en-fx",{opacity:0},{opacity:1,duration:0.35},0.75);`);
  // "Clique no link, preencha o formulário e nossa equipe entrará em contato…"
  add(`tl.fromTo("#en-bw",{scale:0.6,opacity:0},{scale:1,opacity:1,duration:0.45,ease:"back.out(1.8)"},${L(T.clique - 0.02)});`);
  const ar = r3(L(T.link) - 0.08);
  add(`tl.fromTo("#en-lb",{opacity:0,y:-14},{opacity:1,y:0,duration:0.35,ease:"power3.out"},${ar});`);
  const beat = GRID.bar / 4;
  const nb = Math.floor((dur - ar - 0.4) / beat);
  add(`tl.fromTo(["#en-a0","#en-a1"],{y:0},{y:14,duration:${r3(beat / 2)},ease:"sine.inOut",repeat:${nb * 2 - 1},yoyo:true},${ar});`);
  add(`tl.fromTo("#en-ic",{rotation:0},{rotation:12,duration:0.1,ease:"sine.inOut",repeat:5,yoyo:true},${L(T.preencha)});`);
  add(`tl.fromTo("#en-b1",{scale:1.12},{scale:1,duration:0.35,ease:"back.out(2.4)",transformOrigin:"0% 50%",immediateRender:false},${L(T.formulario - 0.04)});`);
  add(`tl.fromTo("#en-b2",{scale:1.16},{scale:1,duration:0.35,ease:"back.out(2.4)",transformOrigin:"0% 50%",immediateRender:false},${L(T.nossa - 0.04)});`);
  add(`tl.fromTo("#${p}-lg",{opacity:0},{opacity:1,duration:0.5},${r3(L(T.clique) + 0.5)});`);
  [L(T.contato), L(T.melhores), L(T.fin)].forEach((t, i) => {
    add(`tl.fromTo("#en-bsw",{xPercent:-100},{xPercent:100,duration:0.8,ease:"power2.inOut"${i ? ",immediateRender:false" : ""}},${r3(t)});`);
  });
  for (let t = L(T.contato) + 0.9; t + 1.28 <= dur - 0.3; t += 1.28) {
    add(`tl.fromTo("#en-btn",{scale:1},{scale:1.04,duration:0.32,ease:"sine.out",immediateRender:false},${r3(t)});`);
    add(`tl.to("#en-btn",{scale:1,duration:0.5,ease:"sine.inOut"},${r3(t + 0.32)});`);
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
#ui-fl{position:absolute;inset:0;background:radial-gradient(70% 50% at 50% 45%,rgba(255,240,210,.85),rgba(232,194,122,.3) 60%,rgba(232,194,122,0));opacity:0;}
#ui-tex{position:absolute;left:-128px;top:-128px;width:${W + 256}px;height:${H + 256}px;background:url("${NOISE}") 0 0/256px 256px repeat;opacity:.05;mix-blend-mode:overlay;}`;
  const body = `<div id="ui-fl" aria-hidden="true"></div><div id="ui-tex" data-layout-allow-overflow aria-hidden="true"></div>`;
  [
    [T.cnpj, 0.24],
    [T.drop, 0.45],
    [T.oitocentosEnd, 0.3],
    [T.clique, 0.3],
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
  ["shimmer", T.principais, 0.12],
  ["pop", T.sao - 0.08, 0.14],
  ["card", T.atraves - 0.1, 0.2],
  ["impact", T.cnpj, 0.22],
  ["whoosh", T.s2 - 0.05, 0.16],
  ["pop", T.empresarial - 0.1, 0.18],
  ["whoosh", T.voce, 0.1],
  ["pop", T.hospitais - 0.1, 0.18],
  ["riser", T.drop, 0.2],
  ["impact", T.drop, 0.28],
  ...HOSP.map((h, i) => ["card", (i === 0 ? T.drop - 0.12 : h.t - 0.2) + 0.05, 0.2]),
  ...HOSP.map((h) => ["check", h.t + 0.22, 0.14]),
  ["whoosh", T.s4 - 0.05, 0.16],
  ["impact", T.melhor1, 0.14],
  ["counter", T.mil - 0.2, 0.16],
  ["impact", T.oitocentosEnd, 0.24],
  ["shimmer", T.oitocentosEnd + 0.05, 0.16],
  ["pop", T.tres - 0.12, 0.18],
  ["pop", T.casal - 0.06, 0.14],
  ["pop", T.jovem - 0.1, 0.14],
  ["whoosh", T.s5 - 0.05, 0.16],
  ...T.ops.map((t) => ["card", t + 0.2, 0.22]),
  ["shimmer", T.ops[3] + 0.15, 0.14],
  ["whoosh", T.s6 - 0.05, 0.16],
  ...[0, 1, 2, 3].map((i) => ["tap", T.apresentamos + i * 0.17, 0.12]),
  ["stamp", T.opcao - 0.04, 0.26],
  ["chime", T.opcao + 0.1, 0.16],
  ["whoosh", T.s7 - 0.05, 0.14],
  ["pop", T.quer - 0.1, 0.16],
  ["impact", T.custo, 0.16],
  ["whoosh", T.en - 0.05, 0.18],
  ["impact", T.clique, 0.22],
  ["pop", T.clique + 0.02, 0.18],
  ["pop", T.link - 0.08, 0.12],
  ["shimmer", T.formulario, 0.14],
  ["shimmer", T.contato, 0.14],
  ["shimmer", T.fin, 0.2],
];
const SFX_DUR = { impact: 1.2, counter: 0.7 };
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
mkdirSync(join(ROOT, "compositions"), { recursive: true });
for (const s of scenes) writeFileSync(join(ROOT, `compositions/${s.id}.html`), s.html);
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
writeFileSync(join(ROOT, "index.html"), html);
console.log(`story ${W}x${H}: ${D}s, ${scenes.length} composições, ${SFX.length} SFX`);
