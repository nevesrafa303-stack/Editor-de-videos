#!/usr/bin/env node
// build.mjs — anúncio "O Einstein é só pra milionário?", com locução (ElevenLabs, voz Roberta), só no
// formato story 9:16 para o Meta Ads, com as informações no centro da tela.
//
//   node tools/build.mjs   -> compositions/*.html + index.html
//
// Copy modelada de um vídeo de referência: gancho ("Você acha que o Einstein é só pra milionário?"),
// o custo no particular (diária de R$ 20 mil, cirurgia de R$ 200 mil), a autoridade (16º melhor
// hospital do mundo, 1º da América Latina — Newsweek 2026), os diferenciais, a quebra de crença
// (quem se trata lá usa plano), conta × mensalidade, as cotações no CNPJ (Alice, Amil, Bradesco
// Saúde, SulAmérica), a frase "não é o dinheiro, é a informação" e o CTA do formulário. Cada texto
// entra na palavra falada (assets/voice/vo.words.json); a trilha usa a mesma grade (tools/grid.json).

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const W = 1080;
const H = 1920;
const FPS = 30;
const r3 = (x) => Math.round(x * 1000) / 1000;

// paleta: azul-meia-noite, champanhe, vermelho da conta e verde da economia
const NIGHT = "#070B14";
const NAVY = "#0E1A2E";
const CH = "#E8C27A";
const CH2 = "#F7DFA8";
const INK = "#0B1220";
const SLATE = "#4F5F75";
const MUTED = "#C3CEDD";
const GREEN = "#22A06B";
const RED = "#E5484D";
const RED2 = "#FF6B6B";

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
T.einstein = at("einstein");
T.milionario = at("milionario");
T.drop = GRID.drop; // "Lá, uma diária…"
T.s2 = r3(T.drop - 0.12);
T.vinte = at("vinte");
T.reais1End = end("reais", T.vinte);
T.cirurgia = at("cirurgia");
T.duzentos1 = at("duzentos");
T.mil2End = end("mil", T.duzentos1);
T.e3 = at("e", T.mil2End); // "É o hospital…"
T.s3 = r3(T.e3 - 0.15);
T.hospital3 = at("hospital", T.e3);
T.decimo = at("decimo");
T.sexto = at("sexto");
T.melhor3 = at("melhor", T.sexto);
T.primeiro = at("primeiro");
T.tecnologia = at("tecnologia");
T.s4 = r3(T.tecnologia - 0.18);
T.medicos = at("medicos");
T.quartos = at("quartos");
T.cinco = at("cinco");
T.e5 = at("e", end("estrelas"));
T.s5 = r3(T.e5 - 0.12);
T.nao5 = at("nao", T.e5);
T.proprio = at("proprio");
T.ate = at("ate", T.e5);
T.empresarios = at("empresarios");
T.executivos = at("executivos");
T.plano5 = at("plano", T.executivos);
T.em6 = at("em", T.plano5);
T.s6 = r3(T.em6 - 0.12);
T.duzentos6 = at("duzentos", T.em6);
T.trezentos6 = at("trezentos", T.em6);
T.voce6 = at("voce", T.trezentos6);
T.mensalidade = at("mensalidade");
T.protegido = at("protegido");
T.e7 = at("e", end("protegido"));
T.s7 = r3(T.e7 - 0.12);
T.cnpj7 = at("cnpj", T.e7);
T.custa = at("custa");
T.imagina = at("imagina");
T.pessoa = at("pessoa");
T.mil7a = at("mil", T.pessoa);
T.alice = at("alice");
T.casal = at("casal");
T.dois = at("dois");
T.amil = at("amil");
T.familia = at("familia");
T.quatro = at("quatro");
T.bradesco = at("bradesco");
T.sulamerica = at("sulamerica");
T.muito = at("muito");
T.s8 = r3(T.muito - 0.15);
T.duzentos8 = at("duzentos", T.muito);
T.ne = at("ne");
T.a9 = at("a", end("ne"));
T.s9 = r3(T.a9 - 0.12);
T.dinheiro = at("dinheiro");
T.informacao = at("informacao");
T.se10 = at("se", end("informacao"));
T.en = r3(T.se10 - 0.12);
T.cnpj10 = at("cnpj", T.se10);
T.clique = GRID.cta; // "clique" (refrão da trilha)
T.link = at("link");
T.preencha = at("preencha");
T.formulario = at("formulario");
T.mostra = at("mostra");
T.einstein10 = at("einstein", T.mostra);
T.fin = GRID.fin;

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
.red{color:${RED2};}
.kk{position:absolute;left:0;width:${W}px;text-align:center;font-weight:700;font-size:28px;letter-spacing:.18em;color:${CH};}
.pill{position:absolute;left:0;width:${W}px;display:flex;justify-content:center;}
.pill>div{display:flex;align-items:center;gap:12px;padding:12px 30px;border:2px solid rgba(232,194,122,.7);border-radius:60px;background:rgba(232,194,122,.1);font-weight:700;font-size:26px;letter-spacing:.12em;color:${CH};}
.sweep{position:absolute;left:0;top:0;width:100%;height:100%;background:linear-gradient(105deg,rgba(255,255,255,0) 35%,rgba(255,255,255,.55) 50%,rgba(255,255,255,0) 65%);mix-blend-mode:screen;}
.shift{position:absolute;left:0;width:${W}px;}
.ph{position:absolute;overflow:hidden;background:${NAVY};}
.ph img{display:block;width:100%;height:100%;object-fit:cover;}
.roll{display:inline-flex;overflow:hidden;vertical-align:top;font-variant-numeric:tabular-nums;}
.rd{display:inline-block;overflow:hidden;}
.rs{display:flex;flex-direction:column;text-align:center;}
.rs span{display:block;}
.rc{display:inline-block;}
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
  // número que rola até o valor: uma coluna 0–9 por dígito (só transform, seguro para seek)
  const roll = (id, text, t0, t1, lh) => {
    // os dígitos só aparecem quando começam a rolar (antes disso o valor ficaria "000.000")
    add(`tl.fromTo("#${id}-rw",{opacity:0},{opacity:1,duration:0.15},${r3(Math.max(0, t0 - 0.05))});`);
    [...text]
      .filter((c) => /\d/.test(c))
      .map(Number)
      .forEach((d, i) => {
        const s = r3(t0 + i * 0.05);
        add(`tl.fromTo("#${id}${i}",{y:0},{y:${-(10 + d) * lh},duration:${r3(Math.max(0.3, t1 - s))},ease:"power3.out"},${s});`);
      });
  };
  return { a, L, add, words, shake, roll };
}
function rollHTML(id, text, size, lh) {
  let k = 0;
  return (
    `<span class="roll" id="${id}-rw" style="height:${lh}px;font-size:${size}px;line-height:${lh}px">` +
    [...text]
      .map((ch) => {
        if (!/\d/.test(ch)) return `<span class="rc">${ch}</span>`;
        const i = k++;
        return `<span class="rd" style="height:${lh}px"><span class="rs" id="${id}${i}" data-layout-allow-overflow data-layout-allow-occlusion>${Array.from({ length: 20 }, (_, j) => `<span>${j % 10}</span>`).join("")}</span></span>`;
      })
      .join("") +
    `</span>`
  );
}

const ICONS = {
  check: `<path d="M12 25l8 8 16-18"/>`,
  x: `<path d="M14 14l20 20M34 14L14 34"/>`,
  pin: `<path d="M24 44s14-13.5 14-24a14 14 0 0 0-28 0c0 10.5 14 24 14 24z"/><circle cx="24" cy="20" r="5"/>`,
  building: `<path d="M8 42V10l16-5v37M24 16l16 5v21M4 42h40M14 16h4M14 23h4M14 30h4M30 26h4M30 33h4"/>`,
  person: `<circle cx="24" cy="16" r="8"/><path d="M8 44c0-9 7-15 16-15s16 6 16 15"/>`,
  briefcase: `<rect x="5" y="15" width="38" height="26" rx="4"/><path d="M17 15v-5a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v5M5 26h38M21 26v4h6v-4"/>`,
  tie: `<circle cx="24" cy="11" r="6"/><path d="M8 44c0-9 7-15 16-15s16 6 16 15"/><path d="M24 29l-3 4 3 9 3-9z"/>`,
  shield: `<path d="M24 4l16 6v12c0 10-7 18-16 22C15 40 8 32 8 22V10z"/><path d="M17 24l5 5 9-10"/>`,
  wallet: `<rect x="5" y="12" width="38" height="28" rx="5"/><path d="M33 22h10v8H33a4 4 0 0 1 0-8zM9 12l22-6 3 6"/>`,
  robot: `<rect x="10" y="16" width="28" height="20" rx="6"/><path d="M24 16V9M20 9h8M17 26h.01M31 26h.01M18 32h12M6 24v6M42 24v6"/>`,
  stetho: `<path d="M12 6v12a8 8 0 0 0 16 0V6M12 6h-3M28 6h3M20 26v6a8 8 0 0 0 16 0v-4"/><circle cx="36" cy="25" r="3"/>`,
  bed: `<path d="M5 38V10M5 30h38v8M43 30v-5a6 6 0 0 0-6-6H22v11"/><circle cx="13.5" cy="23" r="4"/>`,
  star: `<path d="M24 5l5.6 12.2 13.4 1.5-10 9 2.8 13.2L24 34.2 12.2 40.9 15 27.7l-10-9 13.4-1.5z"/>`,
  globe: `<circle cx="24" cy="24" r="18"/><path d="M6 24h36M24 6c6 6 6 30 0 36M24 6c-6 6-6 30 0 36"/>`,
  form: `<rect x="10" y="8" width="28" height="36" rx="4"/><path d="M18 8V5h12v3M16 20h16M16 28h16M16 36h10"/>`,
  down: `<path d="M12 10l12 12 12-12M12 24l12 12 12-12"/>`,
  family: `<circle cx="17" cy="14" r="6"/><circle cx="33" cy="17" r="5"/><path d="M5 42c0-8 5-14 12-14s12 6 12 14M27 42c0-6 3-11 7-11s9 5 9 11"/>`,
};
const icon = (name, size, { id = "", sw = 3.4, color = "#fff", fill = "none" } = {}) =>
  `<svg ${id ? `id="${id}" ` : ""}viewBox="0 0 48 48" width="${size}" height="${size}" fill="${fill}" stroke="${color}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`;
const stars = (n, size, idp) =>
  Array.from({ length: n }, (_, i) => `<span id="${idp}${i}" style="display:inline-block">${icon("star", size, { color: CH, fill: CH, sw: 2 })}</span>`).join("");

const IMG = {
  fachada: "assets/img/einstein-fachada.jpg",
  atrio: "assets/img/einstein-atrio.jpg",
  suite: "assets/img/quarto-suite.jpg",
  robo: "assets/img/cirurgia-robotica.jpg",
};
// cubos das operadoras (k = largura relativa para a face ficar do mesmo tamanho visual)
const CUBE = {
  alice: { src: "assets/img/cubo-alice.png", alt: "Alice", k: 1.0, ar: 529 / 445 },
  amil: { src: "assets/img/cubo-amil.png", alt: "Amil", k: 1.0, ar: 532 / 451 },
  bradesco: { src: "assets/img/cubo-bradesco.png", alt: "Bradesco", k: 1.03, ar: 196 / 193 },
  sulamerica: { src: "assets/img/cubo-sulamerica.png", alt: "SulAmérica", k: 1.1, ar: 242 / 259 },
};
const cube = (id, key, w, style = "") => {
  const c = CUBE[key];
  const iw = Math.round(w * c.k);
  return `<img id="${id}" src="${c.src}" alt="${c.alt}" style="width:${iw}px;height:${Math.round(iw * c.ar)}px;${style}" />`;
};

// observações obrigatórias (texto exato, só por escrito — ver CLAUDE.md da raiz)
const OBS = {
  rede: "Consulte a disponibilidade da rede hospitalar.",
  varia: "A rede credenciada pode variar conforme plano contratado.",
  cob: "Cobertura e rede sujeitas à modalidade contratada.",
  eleg: "Consulte condições e elegibilidade.",
  analise: "Condições sujeitas à análise comercial.",
  faixa: "Valores sujeitos à faixa etária e região.",
  ref: "Valores referenciais sujeitos às regras da operadora.",
  perfil: "Os valores podem variar conforme perfil do beneficiário.",
  img: "Imagem meramente ilustrativa.",
};
// dados das cotações (cartão final)
const COT =
  "Cotações referenciais Saúde PME, apartamento: 1 pessoa de 30 anos – Alice Exclusivo, coparticipação 30%, R$ 1.345,06/mês; casal – Amil Black I R1, com coparticipação, R$ 2.745,50/mês; família de 3 pessoas – Bradesco Saúde Nacional Plus 4, coparticipação 30%, R$ 4.238,19/mês, e SulAmérica Saúde Executivo R1, coparticipação 30%, R$ 4.351,21/mês. Ranking: Newsweek World's Best Hospitals 2026.";

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
  scenes.push({ st: 0, track: 0, ...scene(p, D, css, body, a) });
}

// ═════════════ 1 · gancho: "Você acha que o Einstein é só pra milionário?" ═════════════
{
  const p = "s1";
  const st = 0;
  const dur = r3(T.s2 + 0.1);
  const { a, L, add, shake } = TL(st);
  // faíscas douradas (posições fixas, determinísticas) que saem do "MILIONÁRIO?"
  const SP = Array.from({ length: 18 }, (_, i) => {
    const ang = (i / 18) * Math.PI * 2 + (i % 2) * 0.17;
    const r = 260 + (i % 3) * 70;
    return [Math.round(Math.cos(ang) * r), Math.round(Math.sin(ang) * r * 0.55), 8 + (i % 3) * 4];
  });
  const css =
    base(p) +
    `
#s1-bgw{position:absolute;left:0;top:0;width:${W}px;height:${H}px;}
#s1-bgw img{position:absolute;left:-60px;top:-40px;width:${W + 120}px;height:${H + 80}px;object-fit:cover;}
#s1-scr{background:linear-gradient(180deg,rgba(7,11,20,.9) 0%,rgba(7,11,20,.7) 30%,rgba(7,11,20,.74) 60%,rgba(7,11,20,.95) 100%);}
#s1-a{top:306px;font-weight:800;font-size:56px;line-height:1.05;}
#s1-b{top:374px;font-weight:900;font-size:150px;line-height:1;letter-spacing:.02em;}
#s1-pw{position:absolute;left:70px;top:556px;width:940px;height:520px;border-radius:40px;box-shadow:0 34px 80px rgba(0,0,0,.6),0 0 0 4px rgba(232,194,122,.9);}
#s1-c{top:1108px;font-weight:800;font-size:62px;line-height:1.05;}
#s1-gw{position:absolute;left:0;top:1176px;width:${W}px;height:150px;}
#s1-gl{position:absolute;left:140px;top:-40px;width:800px;height:230px;border-radius:50%;background:radial-gradient(closest-side,rgba(232,194,122,.45),rgba(232,194,122,0));opacity:0;}
#s1-d{position:absolute;left:0;top:0;width:${W}px;text-align:center;font-weight:900;font-size:118px;line-height:1.1;letter-spacing:-.01em;color:${CH};text-shadow:0 6px 30px rgba(0,0,0,.5);}
.s1-sp{position:absolute;left:540px;top:70px;border-radius:50%;background:${CH2};opacity:0;box-shadow:0 0 14px ${CH};}
`;
  const body = `
  <div id="s1-main" class="${p}-full">
    <div id="s1-bgw" data-layout-allow-overflow aria-hidden="true"><img id="s1-bgi" src="${IMG.atrio}" alt="" /></div>
    <div id="s1-scr" class="${p}-full"></div>
    <div class="shift" id="s1-sh" style="top:80px;height:${H - 80}px">
    <div id="s1-a" class="ln d">Você acha que o</div>
    <div id="s1-b" class="ln d"><span id="s1-bi" style="display:inline-block">EINSTEIN</span></div>
    <div class="ph" id="s1-pw"><img id="s1-pi" data-layout-allow-overflow src="${IMG.fachada}" alt="Hospital Israelita Albert Einstein" style="object-position:55% 50%" /><div id="s1-sw" class="sweep" data-layout-allow-overflow aria-hidden="true"></div></div>
    <div id="s1-c" class="ln d">é só pra</div>
    <div id="s1-gw" data-layout-allow-overlap>
      <div id="s1-gl" aria-hidden="true"></div>
      ${SP.map((_, i) => `<i class="s1-sp" id="s1-p${i}" style="width:${SP[i][2]}px;height:${SP[i][2]}px" aria-hidden="true"></i>`).join("")}
      <div id="s1-d" class="d"><span id="s1-di" style="display:inline-block">MILIONÁRIO?</span></div>
    </div>
    <div class="legal" id="${p}-lg" style="top:1360px">${OBS.rede} ${OBS.varia} ${OBS.img}</div>
    </div>
  </div>`;
  // tudo já no quadro 0 (miniatura e autoplay); a fala dá o ritmo: EINSTEIN acende, MILIONÁRIO? explode
  add(`tl.fromTo("#s1-bgi",{scale:1.15},{scale:1,duration:${dur},ease:"none"},0);`);
  add(`tl.fromTo("#s1-pi",{scale:1.22},{scale:1.02,duration:${dur},ease:"power1.out"},0);`);
  add(`tl.fromTo("#s1-pw",{y:30},{y:0,duration:0.6,ease:"power3.out"},0);`);
  add(`tl.fromTo("#s1-bi",{scale:1.25},{scale:1,duration:0.35,ease:"back.out(2.2)",immediateRender:false},${L(T.einstein - 0.04)});`);
  add(`tl.fromTo("#s1-sw",{xPercent:-100},{xPercent:100,duration:0.7,ease:"power2.inOut"},${L(T.einstein)});`);
  add(`tl.fromTo("#s1-di",{scale:1.5},{scale:1,duration:0.32,ease:"power4.out",immediateRender:false},${L(T.milionario - 0.04)});`);
  add(`tl.fromTo("#s1-gl",{opacity:0,scale:0.6},{opacity:1,scale:1.1,duration:0.4,ease:"power2.out"},${L(T.milionario)});`);
  SP.forEach(([x, y], i) => {
    add(`tl.fromTo("#s1-p${i}",{x:0,y:0,opacity:1,scale:1},{x:${x},y:${y},opacity:0,scale:0.3,duration:0.75,ease:"power3.out"},${r3(L(T.milionario) + 0.02 + (i % 4) * 0.02)});`);
  });
  shake("#s1-sh", r3(L(T.milionario) + 0.12), 12);
  add(`tl.fromTo("#${p}-lg",{opacity:0},{opacity:1,duration:0.4},0.4);`);
  add(`tl.to("#s1-main",{scale:1.12,opacity:0,duration:0.22,ease:"power2.in"},${r3(dur - 0.22)});`);
  scenes.push({ st, track: 1, ...scene(p, dur, css, body, a) });
}

// ═════════════ 2 · a conta: "diária de R$ 20 mil… cirurgia passa fácil dos R$ 200 mil" ═════════════
{
  const p = "s2";
  const st = r3(T.s2 - 0.05);
  const dur = r3(T.s3 + 0.1 - st);
  const { a, L, add, shake, roll } = TL(st);
  const LH = 108;
  const css =
    base(p) +
    `
#s2-bgw{position:absolute;left:0;top:0;width:${W}px;height:${H}px;}
#s2-bgw img{width:100%;height:100%;object-fit:cover;object-position:60% 50%;}
#s2-scr{background:linear-gradient(180deg,rgba(20,4,8,.9),rgba(14,6,12,.78) 45%,rgba(7,11,20,.95));}
#s2-k{top:300px;}
#s2-ki{display:flex;align-items:center;gap:10px;padding:12px 30px;border-radius:60px;background:${RED};color:#fff;font-weight:800;font-size:28px;letter-spacing:.14em;}
#s2-rc{position:absolute;left:130px;top:390px;width:820px;height:860px;}
#s2-pp{position:absolute;inset:0;background:#FBFAF6;color:${INK};border-radius:28px 28px 0 0;box-shadow:0 40px 90px rgba(0,0,0,.6);}
#s2-zz{position:absolute;left:0;bottom:-22px;width:820px;height:24px;}
#s2-hd{position:absolute;left:0;top:44px;width:100%;text-align:center;font-weight:900;font-size:38px;letter-spacing:.16em;}
#s2-sub{position:absolute;left:0;top:96px;width:100%;text-align:center;font-weight:500;font-size:24px;color:${SLATE};}
.s2-hr{position:absolute;left:56px;width:708px;border-top:3px dashed #C9CED8;}
.s2-it{position:absolute;left:56px;width:708px;}
.s2-lb{font-weight:700;font-size:34px;}
.s2-sm{font-weight:500;font-size:24px;color:${SLATE};margin-top:4px;}
.s2-vl{display:flex;justify-content:flex-end;align-items:flex-start;gap:8px;margin-top:10px;font-weight:900;color:${RED};}
.s2-rs{font-size:48px;line-height:${LH}px;}
.s2-pl{font-size:84px;line-height:${LH}px;}
.s2-fill{position:absolute;left:56px;height:18px;border-radius:9px;background:#E6E9EF;}
`;
  const zig = Array.from({ length: 42 }, (_, i) => `${i * 20},0 ${i * 20 + 10},22`).join(" ");
  const body = `
  <div id="s2-wrap" class="${p}-full">
    <div id="s2-bgw" aria-hidden="true"><img id="s2-bgi" src="${IMG.suite}" alt="" data-layout-allow-overflow /></div>
    <div id="s2-scr" class="${p}-full"></div>
    <div class="shift" style="top:100px;height:${H - 100}px">
    <div class="pill" id="s2-k"><div id="s2-ki" class="d">SEM PLANO, NO PARTICULAR</div></div>
    <div id="s2-rc">
      <div id="s2-pp">
        <div id="s2-hd" class="d">CONTA HOSPITALAR</div>
        <div id="s2-sub">Hospital de alto padrão · São Paulo</div>
        <div class="s2-hr" style="top:150px"></div>
        <div class="s2-it" id="s2-i0" style="top:186px"><div class="s2-lb d">Diária de internação</div><div class="s2-sm">por dia</div>
          <div class="s2-vl d"><span class="s2-rs">R$</span>${rollHTML("s2-n0", "20.000", 96, LH)}</div></div>
        <div class="s2-hr" style="top:430px"></div>
        <div class="s2-it" id="s2-i1" style="top:466px"><div class="s2-lb d">Cirurgia</div><div class="s2-sm">procedimento + equipe + materiais</div>
          <div class="s2-vl d"><span class="s2-rs">R$</span>${rollHTML("s2-n1", "200.000", 96, LH)}<span class="s2-pl" id="s2-plus">+</span></div></div>
        <div class="s2-hr" style="top:716px"></div>
        <div class="s2-fill" style="top:752px;width:420px"></div>
        <div class="s2-fill" style="top:790px;width:300px"></div>
      </div>
      <svg id="s2-zz" viewBox="0 0 820 24" width="820" height="24" aria-hidden="true"><polygon points="0,0 ${zig} 820,0" fill="#FBFAF6"/></svg>
    </div>
    <div class="legal" id="${p}-lg" style="top:1300px">${OBS.img}</div>
    </div>
  </div>`;
  add(`tl.fromTo("#s2-bgi",{scale:1.15},{scale:1,duration:${dur},ease:"none"},0);`);
  add(`tl.fromTo("#s2-ki",{scale:0.5,opacity:0},{scale:1,opacity:1,duration:0.35,ease:"back.out(2.4)"},0.02);`);
  add(`tl.fromTo("#s2-rc",{y:900,rotation:4},{y:0,rotation:-1.5,duration:0.6,ease:"power4.out"},0.05);`);
  add(`tl.fromTo("#s2-i0",{opacity:0,x:-30},{opacity:1,x:0,duration:0.35,ease:"power3.out"},${L(at("diaria") - 0.1)});`);
  roll("s2-n0", "20.000", L(T.vinte - 0.25), L(T.reais1End - 0.2), LH);
  shake("#s2-rc", r3(L(T.reais1End) - 0.15), 9);
  add(`tl.fromTo("#s2-i1",{opacity:0,x:-30},{opacity:1,x:0,duration:0.35,ease:"power3.out"},${L(T.cirurgia - 0.1)});`);
  roll("s2-n1", "200.000", L(T.duzentos1 - 0.35), L(T.mil2End - 0.15), LH);
  add(`tl.fromTo("#s2-plus",{scale:0,opacity:0},{scale:1,opacity:1,duration:0.3,ease:"back.out(3)"},${L(T.mil2End - 0.1)});`);
  shake("#s2-rc", r3(L(T.mil2End) - 0.05), 14);
  add(`tl.fromTo("#${p}-lg",{opacity:0},{opacity:1,duration:0.4},0.5);`);
  add(`tl.to("#s2-wrap",{y:-140,opacity:0,duration:0.28,ease:"power3.in"},${r3(dur - 0.3)});`);
  scenes.push({ st, track: 2, ...scene(p, dur, css, body, a) });
}

// ═════════════ 3 · autoridade: "16º melhor hospital do mundo e o 1º da América Latina" ═════════════
{
  const p = "s3";
  const st = r3(T.s3 - 0.05);
  const dur = r3(T.s4 + 0.1 - st);
  const { a, L, add, words, shake, roll } = TL(st);
  const NL = 330;
  // ramo de louro: folhas ao longo de um arco (graus, 0 = direita, 90 = baixo), tangentes ao arco
  const laurel = (from, to) => {
    const out = [];
    const n = 8;
    for (let i = 0; i < n; i++) {
      const a = from + ((to - from) * i) / (n - 1);
      const rad = (a * Math.PI) / 180;
      const rr = 290 + (i % 2 ? 22 : -22);
      const x = Math.round(350 + Math.cos(rad) * rr);
      const y = Math.round(320 + Math.sin(rad) * rr);
      out.push(`<ellipse cx="${x}" cy="${y}" rx="15" ry="38" transform="rotate(${Math.round(a + (i % 2 ? 20 : -20))} ${x} ${y})" fill="${CH}"/>`);
    }
    return out.join("");
  };
  const css =
    base(p) +
    `
#s3-ry{position:absolute;left:-460px;top:-60px;width:2000px;height:2000px;background:repeating-conic-gradient(from 0deg at 50% 50%,rgba(232,194,122,.08) 0deg 6deg,rgba(232,194,122,0) 6deg 18deg);border-radius:50%;}
#s3-a{top:300px;font-weight:700;font-size:46px;color:${MUTED};}
#s3-b{top:362px;font-weight:900;font-size:64px;line-height:1.05;}
#s3-lw{position:absolute;left:190px;top:385px;width:700px;height:640px;}
#s3-nw{position:absolute;left:0;width:${W}px;top:540px;display:flex;justify-content:center;align-items:flex-start;}
#s3-nb{font-weight:900;color:${CH};text-shadow:0 10px 40px rgba(232,194,122,.35);}
#s3-o{font-weight:900;font-size:120px;line-height:1;color:${CH};margin-top:40px;}
#s3-c{top:960px;font-weight:900;font-size:56px;line-height:1.05;letter-spacing:-.01em;}
#s3-pl{top:1060px;}
#s3-pli{display:flex;align-items:center;gap:14px;padding:16px 34px;border-radius:60px;background:rgba(232,194,122,.14);border:3px solid ${CH};font-weight:900;font-size:40px;}
#s3-src{top:1170px;font-weight:600;font-size:24px;color:${MUTED};letter-spacing:.04em;}
`;
  const body = `
  <div id="s3-wrap" class="${p}-full">
    <div id="s3-ry" data-layout-allow-overflow aria-hidden="true"></div>
    <div class="shift" style="top:130px;height:${H - 130}px">
    <div id="s3-a" class="ln d">${wspans("s3a", "É o hospital mais famoso")}</div>
    <div id="s3-b" class="ln d">${wspans("s3b", "do Brasil")}</div>
    <svg id="s3-lw" viewBox="0 0 700 640" width="700" height="640" aria-hidden="true">
      <g id="s3-l0" style="opacity:.9">${laurel(145, 235)}</g><g id="s3-l1" style="opacity:.9">${laurel(35, -55)}</g></svg>
    <div id="s3-nw" class="d"><span id="s3-nb">${rollHTML("s3-n", "16", 300, NL)}</span><span id="s3-o">º</span></div>
    <div id="s3-c" class="ln d">${wspans("s3c", "MELHOR HOSPITAL DO MUNDO")}</div>
    <div class="pill" id="s3-pl"><div id="s3-pli" class="d">${icon("globe", 46, { color: CH, sw: 3.4 })}<span>1º da América Latina</span></div></div>
    <div id="s3-src" class="ln">Ranking Newsweek · World's Best Hospitals 2026</div>
    <div class="legal" id="${p}-lg" style="top:1290px">${OBS.rede} ${OBS.varia}</div>
    </div>
  </div>`;
  add(`tl.fromTo("#s3-ry",{rotation:0,opacity:0},{rotation:40,opacity:1,duration:${dur},ease:"none"},0);`);
  words("s3a", seq("e o hospital mais famoso", T.e3));
  words("s3b", seq("do brasil", T.e3 + 0.5));
  // "eleito o décimo sexto": o número rola até 16 e o louro se fecha
  add(`tl.fromTo("#s3-nw",{scale:0.6,opacity:0},{scale:1,opacity:1,duration:0.35,ease:"back.out(2)"},${L(T.decimo - 0.35)});`);
  roll("s3-n", "16", L(T.decimo - 0.3), L(T.sexto + 0.3), NL);
  add(`tl.fromTo("#s3-o",{scale:0,opacity:0},{scale:1,opacity:1,duration:0.3,ease:"back.out(3)"},${L(T.sexto + 0.2)});`);
  add(`tl.fromTo("#s3-l0",{x:-80,opacity:0,rotation:-20,transformOrigin:"50% 100%"},{x:0,opacity:0.9,rotation:0,duration:0.5,ease:"power3.out"},${L(T.sexto)});`);
  add(`tl.fromTo("#s3-l1",{x:80,opacity:0,rotation:20,transformOrigin:"50% 100%"},{x:0,opacity:0.9,rotation:0,duration:0.5,ease:"power3.out"},${L(T.sexto)});`);
  shake("#s3-nw", r3(L(T.sexto) + 0.35), 10);
  words("s3c", seq("melhor hospital do mundo", T.sexto));
  add(`tl.fromTo("#s3-pli",{scale:0.5,opacity:0},{scale:1,opacity:1,duration:0.4,ease:"back.out(2.2)"},${L(T.primeiro - 0.12)});`);
  add(`tl.fromTo("#s3-src",{opacity:0},{opacity:1,duration:0.4},${L(T.primeiro + 0.3)});`);
  add(`tl.fromTo("#${p}-lg",{opacity:0},{opacity:1,duration:0.4},${L(T.decimo)});`);
  add(`tl.to("#s3-wrap",{scale:0.9,opacity:0,duration:0.26,ease:"power3.in"},${r3(dur - 0.28)});`);
  scenes.push({ st, track: 1, ...scene(p, dur, css, body, a) });
}

// ═════════════ 4 · diferenciais: robótica, médicos, quarto padrão hotel ═════════════
{
  const p = "s4";
  const st = r3(T.s4 - 0.05);
  const dur = r3(T.s5 + 0.1 - st);
  const { a, L, add } = TL(st);
  const PH = 300;
  const rows = [
    { img: IMG.robo, pos: "50% 40%", ic: "robot", t1: "Tecnologia", t2: "robótica", t: T.tecnologia, size: "cover" },
    { img: IMG.robo, pos: "", ic: "stetho", t1: "Médicos de", t2: "referência mundial", t: T.medicos, size: "bg" },
    { img: IMG.suite, pos: "50% 62%", ic: "bed", t1: "Quarto padrão", t2: "hotel 5 estrelas", t: T.quartos, size: "cover" },
  ];
  const css =
    base(p) +
    `
.s4-c{position:absolute;left:70px;width:940px;height:${PH}px;border-radius:34px;box-shadow:0 26px 60px rgba(0,0,0,.5),0 0 0 3px rgba(232,194,122,.55);}
.s4-gr{position:absolute;left:0;top:0;width:62%;height:100%;background:linear-gradient(90deg,rgba(7,11,20,.92),rgba(7,11,20,.55) 70%,rgba(7,11,20,0));}
.s4-ic{position:absolute;left:34px;top:${PH / 2 - 46}px;width:92px;height:92px;border-radius:50%;background:linear-gradient(135deg,${CH2},${CH});display:flex;align-items:center;justify-content:center;}
.s4-tx{position:absolute;left:150px;top:0;height:${PH}px;display:flex;flex-direction:column;justify-content:center;}
.s4-t1{font-weight:700;font-size:34px;color:${MUTED};line-height:1.15;}
.s4-t2{font-weight:900;font-size:48px;line-height:1.1;white-space:nowrap;}
#s4-st{display:flex;gap:6px;margin-top:8px;}
`;
  const body = `
  <div id="s4-wrap" class="${p}-full">
    <div class="shift" style="top:80px;height:${H - 80}px">
    ${rows
      .map(
        (r, i) => `<div class="s4-c ph" id="s4-c${i}" style="top:${320 + i * (PH + 34)}px">${
          r.size === "bg"
            ? `<div id="s4-i${i}" role="img" aria-label="Equipe cirúrgica" data-layout-allow-overflow style="position:absolute;inset:0;background:url('${r.img}') right 26%/1750px auto no-repeat"></div>`
            : `<img id="s4-i${i}" data-layout-allow-overflow src="${r.img}" alt="${r.t1} ${r.t2}" style="object-position:${r.pos}" />`
        }
      <div class="s4-gr"></div><div class="s4-ic" id="s4-k${i}">${icon(r.ic, 58, { color: INK, sw: 3.4 })}</div>
      <div class="s4-tx"><div class="s4-t1">${r.t1}</div><div class="s4-t2 d">${r.t2}</div>${i === 2 ? `<div id="s4-st">${stars(5, 34, "s4-s")}</div>` : ""}</div></div>`,
      )
      .join("\n    ")}
    <div class="legal" id="${p}-lg" style="top:1340px">${OBS.img} ${OBS.rede}</div>
    </div>
  </div>`;
  rows.forEach((r, i) => {
    add(`tl.fromTo("#s4-c${i}",{x:${i % 2 ? -1100 : 1100}},{x:0,duration:0.5,ease:"power4.out"},${L(r.t - 0.15)});`);
    add(`tl.fromTo("#s4-i${i}",{scale:1.2},{scale:1,duration:2.4,ease:"power1.out"},${L(r.t - 0.15)});`);
    add(`tl.fromTo("#s4-k${i}",{scale:0,rotation:-90},{scale:1,rotation:0,duration:0.45,ease:"back.out(2.4)"},${L(r.t + 0.1)});`);
  });
  [0, 1, 2, 3, 4].forEach((i) => add(`tl.fromTo("#s4-s${i}",{scale:0,rotation:-60},{scale:1,rotation:0,duration:0.3,ease:"back.out(3)"},${r3(L(T.cinco) + i * 0.08)});`));
  add(`tl.fromTo("#${p}-lg",{opacity:0},{opacity:1,duration:0.4},0.4);`);
  add(`tl.to("#s4-wrap",{x:-160,opacity:0,duration:0.28,ease:"power3.in"},${r3(dur - 0.3)});`);
  scenes.push({ st, track: 2, ...scene(p, dur, css, body, a) });
}

// ═════════════ 5 · "quem se trata lá não paga tudo do próprio bolso… usam plano de saúde" ═════════════
{
  const p = "s5";
  const st = r3(T.s5 - 0.05);
  const dur = r3(T.s6 + 0.1 - st);
  const { a, L, add, words, shake } = TL(st);
  const css =
    base(p) +
    `
#s5-a{top:300px;font-weight:700;font-size:50px;color:${MUTED};}
#s5-b{top:368px;font-weight:900;font-size:78px;line-height:1.05;}
#s5-c{top:462px;font-weight:900;font-size:92px;line-height:1.05;}
#s5-cw{position:relative;display:inline-block;}
#s5-x{position:absolute;left:-3%;top:52%;width:106%;height:12px;margin-top:-6px;border-radius:8px;background:${RED};}
#s5-ch{position:absolute;left:0;width:${W}px;top:618px;display:flex;justify-content:center;gap:20px;}
.s5-p{display:flex;align-items:center;gap:14px;padding:14px 30px 14px 18px;border-radius:60px;background:rgba(255,255,255,.08);border:2px solid rgba(232,194,122,.5);font-weight:800;font-size:38px;}
#s5-cw2{position:absolute;left:160px;top:760px;width:760px;height:450px;}
#s5-cd{position:absolute;inset:0;border-radius:40px;background:linear-gradient(135deg,#1B2B48 0%,#0B1424 60%,#2A2112 100%);border:3px solid ${CH};box-shadow:0 34px 80px rgba(0,0,0,.55);overflow:hidden;}
#s5-cdt{position:absolute;left:46px;top:42px;font-weight:900;font-size:44px;letter-spacing:.06em;color:${CH};}
#s5-cds{position:absolute;left:46px;top:102px;font-weight:600;font-size:28px;color:${MUTED};}
#s5-chip{position:absolute;left:46px;top:170px;width:110px;height:84px;border-radius:16px;background:linear-gradient(135deg,${CH2},#B88A3C);}
#s5-nm{position:absolute;left:46px;top:300px;font-weight:700;font-size:30px;letter-spacing:.1em;}
#s5-cn{position:absolute;left:46px;top:350px;font-weight:600;font-size:26px;color:${MUTED};letter-spacing:.06em;}
#s5-ok{position:absolute;right:40px;top:40px;width:96px;height:96px;border-radius:50%;background:${GREEN};display:flex;align-items:center;justify-content:center;box-shadow:0 10px 26px rgba(0,0,0,.4);}
`;
  const body = `
  <div id="s5-wrap" class="${p}-full">
    <div class="shift" style="top:130px;height:${H - 130}px">
    <div id="s5-a" class="ln d">${wspans("s5a", "E quem se trata lá")}</div>
    <div id="s5-b" class="ln d">${wspans("s5b", "não paga tudo do")}</div>
    <div id="s5-c" class="ln d"><span id="s5-cw" data-layout-allow-occlusion><span id="s5-ci" style="display:inline-block">próprio bolso</span><i id="s5-x" data-layout-allow-overlap aria-hidden="true"></i></span></div>
    <div id="s5-ch"><div class="s5-p d" id="s5-p0">${icon("briefcase", 50, { color: CH, sw: 3.4 })}Empresários</div><div class="s5-p d" id="s5-p1">${icon("tie", 50, { color: CH, sw: 3.4 })}Executivos</div></div>
    <div id="s5-cw2" data-layout-allow-overlap>
      <div id="s5-cd"><div id="s5-cdt" class="d">PLANO DE SAÚDE</div><div id="s5-cds">Empresarial · no CNPJ</div><div id="s5-chip"></div>
        <div id="s5-nm" class="d">SUA EMPRESA LTDA</div><div id="s5-cn">CNPJ ••.•••.•••/0001-••</div><div id="s5-csw" class="sweep" data-layout-allow-overflow aria-hidden="true"></div></div>
      <div id="s5-ok">${icon("check", 60, { color: "#fff", sw: 5.5 })}</div>
    </div>
    <div class="legal" id="${p}-lg" style="top:1270px">${OBS.eleg} ${OBS.img}</div>
    </div>
  </div>`;
  words("s5a", seq("e quem se trata la", T.e5));
  words("s5b", seq("nao paga tudo do", T.nao5));
  add(`tl.fromTo("#s5-ci",{scale:1.6,opacity:0},{scale:1,opacity:1,duration:0.28,ease:"power4.out"},${L(T.proprio - 0.04)});`);
  add(`tl.fromTo("#s5-x",{scaleX:0},{scaleX:1,duration:0.3,ease:"power3.inOut",transformOrigin:"0% 50%"},${L(T.proprio + 0.35)});`);
  add(`tl.to("#s5-ci",{opacity:0.5,duration:0.3},${L(T.proprio + 0.5)});`);
  add(`tl.fromTo("#s5-p0",{scale:0.4,opacity:0},{scale:1,opacity:1,duration:0.38,ease:"back.out(2.2)"},${L(T.empresarios - 0.08)});`);
  add(`tl.fromTo("#s5-p1",{scale:0.4,opacity:0},{scale:1,opacity:1,duration:0.38,ease:"back.out(2.2)"},${L(T.executivos - 0.08)});`);
  add(`tl.fromTo("#s5-cw2",{y:420,rotation:-8,opacity:0},{y:0,rotation:-3,opacity:1,duration:0.55,ease:"back.out(1.4)"},${L(T.plano5 - 0.3)});`);
  add(`tl.fromTo("#s5-ok",{scale:0},{scale:1,duration:0.35,ease:"back.out(2.8)"},${L(T.plano5 + 0.3)});`);
  add(`tl.fromTo("#s5-csw",{xPercent:-100},{xPercent:100,duration:0.8,ease:"power2.inOut"},${L(T.plano5 + 0.2)});`);
  shake("#s5-cw2", r3(L(T.plano5) + 0.25), 8);
  add(`tl.fromTo("#${p}-lg",{opacity:0},{opacity:1,duration:0.4},${L(T.plano5)});`);
  add(`tl.to("#s5-wrap",{y:-140,opacity:0,duration:0.28,ease:"power3.in"},${r3(dur - 0.3)});`);
  scenes.push({ st, track: 1, ...scene(p, dur, css, body, a) });
}

// ═════════════ 6 · "Em vez de uma conta de 200, 300 mil… você paga uma mensalidade e fica protegido" ═════════════
{
  const p = "s6";
  const st = r3(T.s6 - 0.05);
  const dur = r3(T.s7 + 0.1 - st);
  const { a, L, add, words, shake, roll } = TL(st);
  const LH = 112;
  const css =
    base(p) +
    `
#s6-k{top:300px;font-weight:800;font-size:54px;color:${MUTED};}
#s6-r{position:absolute;left:110px;top:392px;width:860px;height:330px;border-radius:40px;background:linear-gradient(135deg,#3A0E14,#1A0A10);border:3px solid ${RED};box-shadow:0 26px 60px rgba(0,0,0,.5);}
#s6-rt{position:absolute;left:0;top:36px;width:100%;text-align:center;font-weight:800;font-size:32px;letter-spacing:.14em;color:${RED2};}
#s6-rv{position:absolute;left:0;top:96px;width:100%;display:flex;justify-content:center;align-items:flex-start;gap:10px;font-weight:900;color:#fff;}
#s6-rs{font-size:52px;line-height:${LH}px;}
#s6-rp{font-size:90px;line-height:${LH}px;}
#s6-rx{position:absolute;left:60px;top:150px;width:740px;height:14px;border-radius:8px;background:${RED};transform:rotate(-6deg);}
#s6-vs{position:absolute;left:480px;top:744px;width:120px;height:120px;border-radius:50%;background:${NIGHT};border:3px solid ${CH};display:flex;align-items:center;justify-content:center;font-weight:900;font-size:40px;color:${CH};}
#s6-g{position:absolute;left:110px;top:886px;width:860px;height:330px;border-radius:40px;background:linear-gradient(135deg,#123326,#0A1A14);border:3px solid ${GREEN};box-shadow:0 26px 60px rgba(0,0,0,.5);}
#s6-gi{position:absolute;left:48px;top:76px;width:170px;height:170px;border-radius:50%;background:linear-gradient(135deg,#3CD48F,${GREEN});display:flex;align-items:center;justify-content:center;}
#s6-gt{position:absolute;left:256px;top:70px;font-weight:700;font-size:34px;color:#A7F0CB;}
#s6-gv{position:absolute;left:256px;top:118px;font-weight:900;font-size:66px;line-height:1.05;}
#s6-st{position:absolute;right:-24px;top:-34px;padding:14px 30px;border-radius:16px;border:6px solid #3CD48F;color:#3CD48F;background:rgba(7,11,20,.92);font-weight:900;font-size:44px;letter-spacing:.06em;transform:rotate(-8deg);}
`;
  const body = `
  <div id="s6-wrap" class="${p}-full">
    <div class="shift" style="top:130px;height:${H - 130}px">
    <div id="s6-k" class="ln d">${wspans("s6k", "Em vez de uma conta de")}</div>
    <div id="s6-r" data-layout-allow-overlap><div id="s6-rt" class="d">CONTA DO HOSPITAL</div>
      <div id="s6-rv" class="d"><span id="s6-rs">R$</span>${rollHTML("s6-n", "300.000", 100, LH)}<span id="s6-rp">+</span></div>
      <i id="s6-rx" data-layout-allow-overlap aria-hidden="true"></i></div>
    <div id="s6-vs" class="d">VS</div>
    <div id="s6-g" data-layout-allow-overlap><div id="s6-gi">${icon("shield", 104, { color: "#fff", sw: 3.4 })}</div>
      <div id="s6-gt" class="d">você paga uma</div><div id="s6-gv" class="d">mensalidade</div>
      <div id="s6-st" class="d" data-layout-allow-overlap>PROTEGIDO</div></div>
    <div class="legal" id="${p}-lg" style="top:1270px">${OBS.faixa}</div>
    </div>
  </div>`;
  words("s6k", seq("em vez de uma conta de", T.em6));
  add(`tl.fromTo("#s6-r",{scale:0.7,opacity:0},{scale:1,opacity:1,duration:0.4,ease:"back.out(1.8)"},${L(T.em6 + 0.3)});`);
  // "duzentos, trezentos mil reais": o valor rola para 200 mil e depois sobe para 300 mil
  roll("s6-n", "200.000", L(T.duzentos6 - 0.2), L(T.duzentos6 + 0.45), LH);
  add(`tl.to("#s6-n0",{y:${-(10 + 3) * LH},duration:0.35,ease:"power3.out"},${L(T.trezentos6 - 0.05)});`);
  shake("#s6-r", r3(L(T.trezentos6) + 0.3), 10);
  add(`tl.fromTo("#s6-rp",{scale:0,opacity:0},{scale:1,opacity:1,duration:0.3,ease:"back.out(3)"},${L(T.trezentos6 + 0.4)});`);
  add(`tl.fromTo("#s6-rx",{scaleX:0},{scaleX:1,duration:0.3,ease:"power3.inOut",transformOrigin:"0% 50%"},${L(T.voce6 - 0.05)});`);
  add(`tl.to("#s6-r",{opacity:0.55,scale:0.96,duration:0.3},${L(T.voce6 + 0.2)});`);
  add(`tl.fromTo("#s6-vs",{scale:0,rotation:-90},{scale:1,rotation:0,duration:0.4,ease:"back.out(2.4)"},${L(T.voce6 - 0.15)});`);
  add(`tl.fromTo("#s6-g",{y:300,opacity:0},{y:0,opacity:1,duration:0.45,ease:"back.out(1.5)"},${L(T.voce6)});`);
  add(`tl.fromTo("#s6-gi",{scale:0,rotation:-60},{scale:1,rotation:0,duration:0.45,ease:"back.out(2.4)"},${L(T.mensalidade - 0.1)});`);
  add(`tl.fromTo("#s6-st",{scale:2.4,opacity:0},{scale:1,opacity:1,duration:0.22,ease:"power4.in"},${L(T.protegido - 0.04)});`);
  shake("#s6-g", r3(L(T.protegido) + 0.18), 9);
  add(`tl.fromTo("#${p}-lg",{opacity:0},{opacity:1,duration:0.4},${L(T.mensalidade)});`);
  add(`tl.to("#s6-wrap",{y:-140,opacity:0,duration:0.28,ease:"power3.in"},${r3(dur - 0.3)});`);
  scenes.push({ st, track: 2, ...scene(p, dur, css, body, a) });
}

// ═════════════ 7 · cotações no CNPJ: Alice, Amil, Bradesco Saúde e SulAmérica ═════════════
{
  const p = "s7";
  const st = r3(T.s7 - 0.05);
  const dur = r3(T.s8 + 0.1 - st);
  const { a, L, add, words, roll } = TL(st);
  const LH = 62;
  const card = (i, top, h, label, ic, n, rows) => `<div class="s7-c" id="s7-c${i}" style="top:${top}px;height:${h}px">
      <div class="s7-lb d">${Array.from({ length: n }, () => icon(ic, 30, { color: CH, sw: 3.6 })).join("")}<span>${label}</span></div>
      ${rows
        .map(
          (r, j) => `<div class="s7-r" style="top:${70 + j * 118}px">${cube(`s7-q${i}${j}`, r.key, 92, "flex:none")}
        <div class="s7-tx"><div class="s7-op d">${r.op}</div><div class="s7-pl d">${r.plan}</div><div class="s7-sp">${r.spec}</div></div>
        <div class="s7-pr d"><span class="s7-rs">R$</span>${rollHTML(`s7-n${i}${j}`, r.price, 56, LH)}<span class="s7-ms">/mês</span></div></div>`,
        )
        .join("")}</div>`;
  const C = [
    { label: "1 pessoa · 30 anos", ic: "person", n: 1, rows: [{ key: "alice", op: "Alice", plan: "Exclusivo", spec: "Saúde PME · Apartamento · Copart. 30%", price: "1.345,06" }], t: T.pessoa, tp: [[T.mil7a, T.alice]] },
    { label: "Casal", ic: "person", n: 2, rows: [{ key: "amil", op: "Amil", plan: "Black I R1", spec: "Saúde PME · Apto · Coparticipação", price: "2.745,50" }], t: T.casal, tp: [[T.dois, T.amil]] },
    {
      label: "Família · 3 pessoas",
      ic: "person",
      n: 3,
      rows: [
        { key: "bradesco", op: "Bradesco Saúde", plan: "Nacional Plus 4", spec: "Apto · Copart. 30% · 390 hospitais", price: "4.238,19" },
        { key: "sulamerica", op: "SulAmérica Saúde", plan: "Executivo R1", spec: "Apto · Copart. 30% · 341 hospitais", price: "4.351,21" },
      ],
      t: T.familia,
      tp: [
        [T.quatro, T.bradesco],
        [T.sulamerica - 0.3, T.sulamerica + 0.3],
      ],
    },
  ];
  const tops = [470, 704, 938];
  const hs = [218, 218, 336];
  const css =
    base(p) +
    `
#s7-a{top:290px;font-weight:800;font-size:56px;line-height:1.05;}
#s7-b{top:364px;font-weight:900;font-size:60px;line-height:1.05;}
.s7-c{position:absolute;left:60px;width:960px;border-radius:30px;background:#fff;color:${INK};box-shadow:0 24px 54px rgba(0,0,0,.45);}
.s7-lb{position:absolute;left:24px;top:-20px;display:flex;align-items:center;gap:4px;padding:8px 22px 8px 16px;border-radius:40px;background:${INK};color:${CH};font-weight:800;font-size:26px;letter-spacing:.04em;white-space:nowrap;}
.s7-lb span{margin-left:8px;}
.s7-r{position:absolute;left:24px;width:912px;height:110px;display:flex;align-items:center;gap:18px;}
.s7-tx{flex:1;min-width:0;}
.s7-op{font-weight:900;font-size:28px;line-height:1.12;white-space:nowrap;}
.s7-pl{font-weight:700;font-size:22px;line-height:1.2;color:#8A6A2A;white-space:nowrap;}
.s7-sp{font-weight:500;font-size:19px;color:${SLATE};margin-top:2px;white-space:nowrap;}
.s7-pr{display:flex;align-items:flex-start;gap:4px;font-weight:900;color:${INK};flex:none;}
.s7-rs{font-size:26px;line-height:${LH}px;margin-right:2px;}
.s7-ms{font-size:20px;line-height:${LH + 18}px;color:${SLATE};margin-left:2px;}
#s7-fx{top:1290px;font-size:22px;color:#fff;}
`;
  const body = `
  <div id="s7-wrap" class="${p}-full">
    <div class="shift" style="top:90px;height:${H - 90}px">
    <div id="s7-a" class="ln d">${wspans("s7a", "E no")} <span class="w"><span class="wi ch" id="s7a2">CNPJ</span></span> ${wspans("s7c", "custa bem menos")}</div>
    <div id="s7-b" class="ln d">${wspans("s7b", "do que você imagina:", "ch")}</div>
    ${C.map((c, i) => card(i, tops[i], hs[i], c.label, c.ic, c.n, c.rows)).join("\n    ")}
    <div id="s7-fx" class="ln">${OBS.faixa}</div>
    <div class="legal" id="${p}-lg" style="top:1336px">${OBS.ref} ${OBS.perfil} ${OBS.cob} ${OBS.img}</div>
    </div>
  </div>`;
  words("s7a", seq("e no", T.e7));
  add(`tl.fromTo("#s7a2",{yPercent:110,opacity:0},{yPercent:0,opacity:1,duration:0.4,ease:"power3.out"},${L(T.cnpj7 - 0.06)});`);
  words("s7c", seq("custa bem menos", T.custa));
  words("s7b", seq("do que voce imagina", T.custa + 0.6).slice(0, 4));
  C.forEach((c, i) => {
    add(`tl.fromTo("#s7-c${i}",{y:160,opacity:0,scale:0.92},{y:0,opacity:1,scale:1,duration:0.45,ease:"back.out(1.6)"},${L(c.t - 0.2)});`);
    c.rows.forEach((r, j) => {
      const [t0, t1] = c.tp[j];
      add(`tl.fromTo("#s7-q${i}${j}",{scale:0.3,rotation:-30},{scale:1,rotation:0,duration:0.45,ease:"back.out(2.2)"},${L(i === 2 && j === 1 ? t0 - 0.2 : c.t)});`);
      roll(`s7-n${i}${j}`, r.price, L(t0 - 0.15), L(t1 + 0.1), LH);
    });
  });
  add(`tl.fromTo("#s7-fx",{opacity:0},{opacity:1,duration:0.35},${L(T.alice)});`);
  add(`tl.fromTo("#${p}-lg",{opacity:0},{opacity:1,duration:0.4},${L(T.alice + 0.3)});`);
  add(`tl.to("#s7-wrap",{y:-140,opacity:0,duration:0.28,ease:"power3.in"},${r3(dur - 0.3)});`);
  scenes.push({ st, track: 1, ...scene(p, dur, css, body, a) });
}

// ═════════════ 8 · "Muito melhor do que pagar duzentos mil numa cirurgia, né?" ═════════════
{
  const p = "s8";
  const st = r3(T.s8 - 0.05);
  const dur = r3(T.s9 + 0.1 - st);
  const { a, L, add, shake } = TL(st);
  const css =
    base(p) +
    `
#s8-a{top:340px;font-weight:900;font-size:100px;line-height:1.05;color:${CH};}
.s8-c{position:absolute;top:520px;width:450px;height:560px;border-radius:40px;box-shadow:0 26px 60px rgba(0,0,0,.5);}
#s8-l{left:70px;background:linear-gradient(160deg,#3A0E14,#1A0A10);border:3px solid ${RED};}
#s8-r{left:560px;background:linear-gradient(160deg,#123326,#0A1A14);border:3px solid ${GREEN};}
.s8-ic{position:absolute;left:155px;top:44px;width:140px;height:140px;border-radius:50%;display:flex;align-items:center;justify-content:center;}
.s8-t{position:absolute;left:0;top:196px;width:100%;text-align:center;font-weight:800;font-size:30px;letter-spacing:.06em;line-height:1.25;}
.s8-v{position:absolute;left:0;top:336px;width:100%;text-align:center;font-weight:900;font-size:66px;line-height:1.05;}
.s8-pre{position:absolute;left:0;top:296px;width:100%;text-align:center;font-weight:600;font-size:26px;color:${MUTED};}
.s8-s{position:absolute;left:0;top:420px;width:100%;text-align:center;font-weight:600;font-size:26px;color:${MUTED};}
#s8-x{position:absolute;left:30px;top:368px;width:390px;height:12px;border-radius:8px;background:${RED};transform:rotate(-10deg);}
#s8-ne{position:absolute;left:0;width:${W}px;top:1110px;display:flex;justify-content:center;}
#s8-nei{padding:16px 44px;border-radius:50px;background:${CH};color:${INK};font-weight:900;font-size:52px;}
#s8-fx{top:1220px;font-size:22px;color:#fff;}
`;
  const body = `
  <div id="s8-wrap" class="${p}-full">
    <div class="shift" style="top:130px;height:${H - 130}px">
    <div id="s8-a" class="ln d"><span id="s8-ai" style="display:inline-block">Muito melhor</span></div>
    <div class="s8-c" id="s8-l" data-layout-allow-overlap><div class="s8-ic" style="background:${RED}">${icon("wallet", 84, { color: "#fff", sw: 3.4 })}</div>
      <div class="s8-t d" style="color:${RED2}">CIRURGIA NO<br>PARTICULAR</div><div class="s8-v d">R$ 200 mil</div><div class="s8-s">de uma vez só</div><i id="s8-x" data-layout-allow-overlap aria-hidden="true"></i></div>
    <div class="s8-c" id="s8-r"><div class="s8-ic" style="background:${GREEN}">${icon("shield", 84, { color: "#fff", sw: 3.4 })}</div>
      <div class="s8-t d" style="color:#A7F0CB">PLANO NO<br>CNPJ</div><div class="s8-pre">a partir de</div><div class="s8-v d" style="font-size:58px">R$ 1.345,06</div><div class="s8-s">por mês</div></div>
    <div id="s8-ne"><div id="s8-nei" class="d">né?</div></div>
    <div id="s8-fx" class="ln">${OBS.faixa}</div>
    <div class="legal" id="${p}-lg" style="top:1266px">${OBS.ref} ${OBS.perfil}</div>
    </div>
  </div>`;
  add(`tl.fromTo("#s8-ai",{scale:1.6,opacity:0},{scale:1,opacity:1,duration:0.28,ease:"power4.out"},${L(T.muito - 0.04)});`);
  add(`tl.fromTo("#s8-l",{x:-600,rotation:-6},{x:0,rotation:-2,duration:0.45,ease:"power4.out"},${L(T.muito + 0.2)});`);
  add(`tl.fromTo("#s8-r",{x:600,rotation:6},{x:0,rotation:2,duration:0.45,ease:"power4.out"},${L(T.muito + 0.35)});`);
  add(`tl.fromTo("#s8-x",{scaleX:0},{scaleX:1,duration:0.3,ease:"power3.inOut",transformOrigin:"0% 50%"},${L(T.duzentos8 + 0.5)});`);
  add(`tl.to("#s8-l",{opacity:0.55,scale:0.95,duration:0.3},${L(T.duzentos8 + 0.7)});`);
  add(`tl.to("#s8-r",{scale:1.06,duration:0.35,ease:"back.out(2)"},${L(T.duzentos8 + 0.7)});`);
  add(`tl.fromTo("#s8-nei",{scale:0,rotation:-12},{scale:1,rotation:-4,duration:0.35,ease:"back.out(2.6)"},${L(T.ne - 0.05)});`);
  shake("#s8-ne", r3(L(T.ne) + 0.2), 7);
  add(`tl.fromTo(["#s8-fx","#${p}-lg"],{opacity:0},{opacity:1,duration:0.4},${L(T.muito + 0.5)});`);
  add(`tl.to("#s8-wrap",{scale:0.92,opacity:0,duration:0.26,ease:"power3.in"},${r3(dur - 0.28)});`);
  scenes.push({ st, track: 2, ...scene(p, dur, css, body, a) });
}

// ═════════════ 9 · "A diferença… nem sempre é o dinheiro. É a informação." ═════════════
{
  const p = "s9";
  const st = r3(T.s9 - 0.05);
  const dur = r3(T.en + 0.1 - st);
  const { a, L, add, words, shake } = TL(st);
  const css =
    base(p) +
    `
#s9-a{top:420px;font-weight:700;font-size:54px;color:${MUTED};}
#s9-b{top:494px;font-weight:900;font-size:66px;line-height:1.05;}
#s9-c{top:578px;font-weight:900;font-size:66px;line-height:1.05;}
#s9-d{top:700px;font-weight:700;font-size:50px;color:${MUTED};}
#s9-e{top:770px;font-weight:900;font-size:96px;line-height:1.05;}
#s9-ew{position:relative;display:inline-block;}
#s9-x{position:absolute;left:-3%;top:52%;width:106%;height:14px;margin-top:-7px;border-radius:8px;background:${RED};}
#s9-gl{position:absolute;left:90px;top:860px;width:900px;height:360px;border-radius:50%;background:radial-gradient(closest-side,rgba(232,194,122,.45),rgba(232,194,122,0));opacity:0;}
#s9-f{top:930px;font-weight:800;font-size:60px;}
#s9-g{top:1004px;font-weight:900;font-size:130px;line-height:1.05;letter-spacing:-.02em;color:${CH};}
`;
  const body = `
  <div id="s9-wrap" class="${p}-full">
    <div class="shift" style="top:120px;height:${H - 120}px">
    <div id="s9-a" class="ln d">${wspans("s9a", "A diferença entre")}</div>
    <div id="s9-b" class="ln d">${wspans("s9b", "quem usa o Einstein")}</div>
    <div id="s9-c" class="ln d">${wspans("s9c", "e quem não usa")}</div>
    <div id="s9-d" class="ln d">${wspans("s9d", "nem sempre é o")}</div>
    <div id="s9-e" class="ln d"><span id="s9-ew" data-layout-allow-occlusion><span id="s9-ei" style="display:inline-block">dinheiro.</span><i id="s9-x" data-layout-allow-overlap aria-hidden="true"></i></span></div>
    <div id="s9-gl" aria-hidden="true"></div>
    <div id="s9-f" class="ln d"><span id="s9-fi" style="display:inline-block">É a</span></div>
    <div id="s9-g" class="ln d"><span id="s9-gi" style="display:inline-block">informação.</span></div>
    </div>
  </div>`;
  const s = seq("a diferenca entre quem usa o einstein e quem nao usa nem sempre e o", T.a9);
  words("s9a", s.slice(0, 3));
  words("s9b", s.slice(3, 7));
  words("s9c", s.slice(7, 11));
  words("s9d", s.slice(11, 15));
  add(`tl.fromTo("#s9-ei",{scale:1.5,opacity:0},{scale:1,opacity:1,duration:0.28,ease:"power4.out"},${L(T.dinheiro - 0.04)});`);
  add(`tl.fromTo("#s9-x",{scaleX:0},{scaleX:1,duration:0.3,ease:"power3.inOut",transformOrigin:"0% 50%"},${L(T.dinheiro + 0.55)});`);
  add(`tl.to("#s9-ei",{opacity:0.45,duration:0.3},${L(T.dinheiro + 0.7)});`);
  add(`tl.fromTo("#s9-fi",{y:30,opacity:0},{y:0,opacity:1,duration:0.3,ease:"power3.out"},${L(T.informacao - 0.3)});`);
  add(`tl.fromTo("#s9-gi",{scale:2,opacity:0},{scale:1,opacity:1,duration:0.3,ease:"power4.out"},${L(T.informacao - 0.04)});`);
  add(`tl.fromTo("#s9-gl",{opacity:0,scale:0.6},{opacity:1,scale:1.1,duration:0.5,ease:"power2.out"},${L(T.informacao)});`);
  shake("#s9-g", r3(L(T.informacao) + 0.2), 10);
  add(`tl.to("#s9-wrap",{scale:1.15,opacity:0,duration:0.24,ease:"power3.in"},${r3(dur - 0.26)});`);
  scenes.push({ st, track: 1, ...scene(p, dur, css, body, a) });
}

// ═════════════ 10 · cartão final: "Se você tem CNPJ, clique no link, preencha o formulário…" ═════════════
{
  const p = "en";
  const st = r3(T.en - 0.05);
  const dur = r3(D - st);
  const { a, L, add, words } = TL(st);
  const BTN = { x: 90, y: 920, w: 900, h: 156 };
  const OPS = ["alice", "amil", "bradesco", "sulamerica"];
  const css =
    base(p) +
    `
#en-a{top:318px;font-weight:800;font-size:66px;line-height:1.05;}
#en-pw{position:absolute;left:100px;top:418px;width:880px;height:300px;border-radius:34px;box-shadow:0 26px 60px rgba(0,0,0,.5),0 0 0 3px rgba(232,194,122,.8);}
#en-pg{position:absolute;left:0;bottom:0;width:100%;height:60%;background:linear-gradient(180deg,rgba(7,11,20,0),rgba(7,11,20,.92));}
#en-pt{position:absolute;left:34px;bottom:26px;display:flex;align-items:center;gap:12px;font-weight:900;font-size:38px;}
#en-ops{position:absolute;left:0;width:${W}px;top:742px;display:flex;justify-content:center;align-items:center;gap:30px;}
#en-ol{position:absolute;left:0;width:${W}px;top:862px;text-align:center;font-weight:600;font-size:24px;color:${MUTED};}
#en-bw{position:absolute;left:${BTN.x}px;top:${BTN.y}px;width:${BTN.w}px;height:${BTN.h}px;}
#en-ring{position:absolute;inset:0;border-radius:${BTN.h}px;border:5px solid rgba(247,223,168,.9);opacity:0;}
#en-btn{position:absolute;inset:0;border-radius:${BTN.h}px;background:linear-gradient(180deg,${CH2} 0%,${CH} 100%);color:${INK};display:flex;align-items:center;justify-content:center;gap:24px;box-shadow:0 20px 50px rgba(232,194,122,.35),inset 0 2px 0 rgba(255,255,255,.5);overflow:hidden;}
#en-bt{display:flex;flex-direction:column;align-items:flex-start;}
#en-b1{font-weight:900;font-size:52px;line-height:1.05;letter-spacing:-.01em;}
#en-b2{font-weight:700;font-size:27px;line-height:1.2;margin-top:4px;}
#en-lb{position:absolute;left:0;width:${W}px;top:1094px;display:flex;justify-content:center;align-items:center;gap:16px;font-weight:800;font-size:36px;color:#fff;}
.en-ar{display:inline-flex;}
`;
  const body = `
  <div id="en-wrap" class="${p}-full">
    <div class="shift" style="top:60px;height:${H - 60}px">
    <div class="pill" id="en-pill" style="top:248px"><div class="d" id="en-pi">${icon("building", 30, { color: CH, sw: 3.6 })}<span>PLANO DE SAÚDE EMPRESARIAL</span></div></div>
    <div id="en-a" class="ln d">${wspans("en-a", "Se você tem")} <span class="w"><span class="wi ch" id="en-a3">CNPJ,</span></span></div>
    <div class="ph" id="en-pw"><img id="en-pimg" data-layout-allow-overflow src="${IMG.fachada}" alt="Hospital Israelita Albert Einstein" style="object-position:56% 42%" /><div id="en-pg"></div>
      <div id="en-pt" class="d">${icon("check", 40, { color: "#3CD48F", sw: 5 })}<span>Planos com o Einstein na rede</span></div></div>
    <div id="en-ops">${OPS.map((k, i) => cube(`en-o${i}`, k, 96)).join("")}</div>
    <div id="en-ol">Comparamos Alice, Amil, Bradesco Saúde, SulAmérica e outras</div>
    <div id="en-bw"><div id="en-ring"></div><div id="en-btn">${icon("form", 70, { id: "en-ic", color: INK, sw: 3.4 })}<div id="en-bt"><span id="en-b1" class="d">Preencha o formulário</span><span id="en-b2">A gente te mostra os planos</span></div><div id="en-bsw" class="sweep" data-layout-allow-overflow aria-hidden="true"></div></div></div>
    <div id="en-lb" class="d"><span class="en-ar" id="en-a0">${icon("down", 48, { color: CH, sw: 4.4 })}</span><span>Clique no link abaixo</span><span class="en-ar" id="en-a1">${icon("down", 48, { color: CH, sw: 4.4 })}</span></div>
    <div class="legal" id="${p}-lg" style="top:1160px">${COT} ${OBS.faixa} ${OBS.ref} ${OBS.perfil} ${OBS.cob} ${OBS.rede} ${OBS.varia} ${OBS.eleg} ${OBS.analise} ${OBS.img}</div>
    </div>
  </div>`;
  add(`tl.fromTo("#en-pi",{y:-20,opacity:0},{y:0,opacity:1,duration:0.35,ease:"power3.out"},0.03);`);
  words("en-a", seq("se voce tem", T.se10));
  add(`tl.fromTo("#en-a3",{yPercent:110,opacity:0},{yPercent:0,opacity:1,duration:0.4,ease:"power3.out"},${L(T.cnpj10 - 0.06)});`);
  add(`tl.fromTo("#en-pw",{y:80,opacity:0},{y:0,opacity:1,duration:0.5,ease:"power3.out"},0.2);`);
  add(`tl.fromTo("#en-pimg",{scale:1.2},{scale:1,duration:${r3(dur - 0.2)},ease:"power1.out"},0.2);`);
  OPS.forEach((_, i) => add(`tl.fromTo("#en-o${i}",{scale:0.3,opacity:0,y:30},{scale:1,opacity:1,y:0,duration:0.4,ease:"back.out(2.2)"},${r3(0.45 + i * 0.08)});`));
  add(`tl.fromTo("#en-ol",{opacity:0},{opacity:1,duration:0.4},0.8);`);
  // "clique no link, preencha o formulário e a gente te mostra os planos…"
  add(`tl.fromTo("#en-bw",{scale:0.6,opacity:0},{scale:1,opacity:1,duration:0.45,ease:"back.out(1.8)"},${L(T.clique - 0.05)});`);
  const ar = r3(L(T.link) - 0.08);
  add(`tl.fromTo("#en-lb",{opacity:0,y:-14},{opacity:1,y:0,duration:0.35,ease:"power3.out"},${ar});`);
  const beat = GRID.bar / 4;
  const nb = Math.floor((dur - ar - 0.4) / beat);
  add(`tl.fromTo(["#en-a0","#en-a1"],{y:0},{y:14,duration:${r3(beat / 2)},ease:"sine.inOut",repeat:${nb * 2 - 1},yoyo:true},${ar});`);
  add(`tl.fromTo("#en-ic",{rotation:0},{rotation:12,duration:0.1,ease:"sine.inOut",repeat:5,yoyo:true},${L(T.preencha)});`);
  add(`tl.fromTo("#en-b1",{scale:1.12},{scale:1,duration:0.35,ease:"back.out(2.4)",transformOrigin:"0% 50%",immediateRender:false},${L(T.formulario - 0.04)});`);
  add(`tl.fromTo("#en-b2",{scale:1.16},{scale:1,duration:0.35,ease:"back.out(2.4)",transformOrigin:"0% 50%",immediateRender:false},${L(T.mostra - 0.04)});`);
  add(`tl.fromTo("#en-pt",{scale:1.12},{scale:1,duration:0.35,ease:"back.out(2.4)",transformOrigin:"0% 50%",immediateRender:false},${L(T.einstein10 - 0.04)});`);
  add(`tl.fromTo("#${p}-lg",{opacity:0},{opacity:1,duration:0.5},${r3(L(T.clique) + 0.4)});`);
  [L(T.formulario + 0.4), L(T.einstein10), L(T.fin)].forEach((t, i) => {
    add(`tl.fromTo("#en-bsw",{xPercent:-100},{xPercent:100,duration:0.8,ease:"power2.inOut"${i ? ",immediateRender:false" : ""}},${r3(t)});`);
  });
  for (let t = L(T.einstein10) + 0.9; t + 1.25 <= dur - 0.3; t += 1.25) {
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
#ui-fl{position:absolute;inset:0;background:radial-gradient(70% 50% at 50% 45%,rgba(255,240,210,.85),rgba(232,194,122,.3) 60%,rgba(232,194,122,0));opacity:0;}
#ui-tex{position:absolute;left:-128px;top:-128px;width:${W + 256}px;height:${H + 256}px;background:url("${NOISE}") 0 0/256px 256px repeat;opacity:.05;mix-blend-mode:overlay;}`;
  const body = `<div id="ui-fl" aria-hidden="true"></div><div id="ui-tex" data-layout-allow-overflow aria-hidden="true"></div>`;
  [
    [T.milionario, 0.3],
    [T.drop, 0.25],
    [T.sexto + 0.3, 0.35],
    [T.protegido, 0.2],
    [T.informacao, 0.35],
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
  ["whoosh", 0.02, 0.14],
  ["pop", T.einstein - 0.04, 0.14],
  ["impact", T.milionario, 0.26],
  ["shimmer", T.milionario + 0.05, 0.18],
  ["whoosh", T.s2 - 0.05, 0.16],
  ["card", T.s2 + 0.05, 0.22],
  ["counter", T.vinte - 0.25, 0.14],
  ["impact", T.reais1End - 0.15, 0.18],
  ["counter", T.duzentos1 - 0.35, 0.14],
  ["impact", T.mil2End - 0.05, 0.24],
  ["whoosh", T.s3 - 0.05, 0.16],
  ["counter", T.decimo - 0.3, 0.12],
  ["impact", T.sexto + 0.3, 0.24],
  ["shimmer", T.sexto + 0.32, 0.18],
  ["pop", T.primeiro - 0.12, 0.18],
  ["whoosh", T.tecnologia - 0.15, 0.16],
  ["whoosh", T.medicos - 0.15, 0.16],
  ["whoosh", T.quartos - 0.15, 0.16],
  ...[0, 1, 2, 3, 4].map((i) => ["tap", T.cinco + i * 0.08, 0.1]),
  ["whoosh", T.s5 - 0.05, 0.14],
  ["stamp", T.proprio + 0.35, 0.2],
  ["pop", T.empresarios - 0.08, 0.16],
  ["pop", T.executivos - 0.08, 0.16],
  ["card", T.plano5 - 0.25, 0.22],
  ["check", T.plano5 + 0.3, 0.18],
  ["whoosh", T.s6 - 0.05, 0.14],
  ["counter", T.duzentos6 - 0.2, 0.12],
  ["impact", T.trezentos6 + 0.3, 0.18],
  ["whoosh", T.voce6 - 0.05, 0.14],
  ["stamp", T.protegido - 0.04, 0.26],
  ["whoosh", T.s7 - 0.05, 0.14],
  ["card", T.pessoa - 0.2, 0.2],
  ["counter", T.mil7a - 0.15, 0.1],
  ["chime", T.alice, 0.14],
  ["card", T.casal - 0.2, 0.2],
  ["counter", T.dois - 0.15, 0.1],
  ["chime", T.amil, 0.14],
  ["card", T.familia - 0.2, 0.2],
  ["counter", T.quatro - 0.15, 0.1],
  ["chime", T.sulamerica + 0.3, 0.16],
  ["whoosh", T.s8 - 0.05, 0.14],
  ["stamp", T.duzentos8 + 0.5, 0.2],
  ["pop", T.ne - 0.05, 0.18],
  ["whoosh", T.s9 - 0.05, 0.12],
  ["stamp", T.dinheiro + 0.55, 0.18],
  ["impact", T.informacao, 0.24],
  ["shimmer", T.informacao + 0.05, 0.18],
  ["whoosh", T.en - 0.05, 0.16],
  ["impact", T.clique, 0.22],
  ["pop", T.clique + 0.02, 0.18],
  ["pop", T.link - 0.08, 0.12],
  ["shimmer", T.formulario, 0.14],
  ["shimmer", T.einstein10, 0.14],
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
