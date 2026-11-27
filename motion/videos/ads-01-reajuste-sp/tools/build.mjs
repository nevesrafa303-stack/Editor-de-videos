// Gera index.html e compositions/*.html do anúncio "Ads 01 · reajuste" (v2: talking head 9:16, 56,5 s).
//
// v2, pedido do cliente: "corta só as pausas, destaca quem está falando e destaca melhor os hospitais".
// - o apresentador fica em tela cheia o tempo todo (#vw), com a imagem original (sem correção de cor, pedido do
//   cliente) e zoom alternado a cada corte de pausa (o corte some e o rosto ganha destaque), mais punch-ins nas
//   palavras fortes;
// - nada cobre o rosto: selos curtos no topo, logo abaixo do cabeçalho (tc), e cartões no terço inferior só nos
//   planos abertos (lc); texto legal logo acima da legenda (lf); legenda palavra a palavra (cap);
// - hospitais: fachada real de cada um (foto com movimento de câmera), um por nome, com o apresentador num
//   círculo (hi + #pipA); só fotos do hospital certo;
// - cartão final em tela cheia com o apresentador no círculo (ec + #pipB);
// - cabeçalho fixo (hd): "PLANOS DE SAÚDE" + selo "EXCLUSIVO PARA CNPJ/MEI" + "a partir de 2 vidas · São Paulo";
// - trilha, voz e efeitos sonoros na raiz.
//
//   node tools/build.mjs
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const W = 1080, H = 1920, D = 56.5;
const WORDS = JSON.parse(readFileSync(join(ROOT, "tools/words.json"), "utf8"));
const HITS = JSON.parse(readFileSync(join(ROOT, "assets/audio/sfx_hits.json"), "utf8"));
const SEGS = JSON.parse(readFileSync(join(ROOT, "tools/timeline.json"), "utf8")).segments;
const r3 = (x) => Math.round(x * 1000) / 1000;
const norm = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9%]/g, "");
const find = (w, after = 0) => {
  const x = WORDS.find((o) => norm(o.word) === w && o.start >= after - 1e-3);
  if (!x) throw new Error(`palavra não encontrada: ${w} depois de ${after}`);
  return x;
};
const at = (w, after) => find(w, after).start;
const endOf = (w, after) => find(w, after).end;
const seg = (id) => SEGS.find((c) => c.id === id);

// ───────────── tempos (absolutos, presos à fala) ─────────────
const T = {};
T.subiu = at("subiu"); T.presta = at("presta"); T.atencao = at("atencao"); T.todo = at("todo"); T.reajuste = at("reajuste");
T.mensalidade = at("mensalidade"); T.pesa = at("pesa"); T.mesma = at("mesma"); T.pior = at("pior");
T.se2 = at("se", 11); T.cnpj = at("cnpj"); T.duas = at("duas"); T.vidas = at("vidas"); T.da = at("da");
T.dessa = at("dessa"); T.o = at("o", 15); T.empresarial = at("empresarial"); T.regras = at("regras"); T.precos = at("precos");
T.em = at("em", T.precos); T.rede2 = at("rede", T.em); T.melhor = at("melhor"); T.hospitais = at("hospitais");
T.luiz = at("luiz"); T.camilo = at("camilo"); T.bp = at("bp"); T.dependendo = at("dependendo"); T.plano3 = endOf("plano", T.dependendo);
T.e3 = at("e", T.dependendo); T.beneficios = at("beneficios"); T.tele = at("telemedicina"); T.cobertura = at("cobertura");
T.reembolso = at("reembolso"); T.nao = at("nao", 30); T.trocar2 = at("trocar", at("por", T.nao)); T.e4 = at("e", T.trocar2 - 0.5);
T.parar = at("parar"); T.mais = at("mais", T.parar); T.excl = at("exclusivo"); T.cnpj2 = at("cnpj", T.excl);
T.duas2 = at("duas", T.excl); T.clica = at("clica"); T.formulario = at("formulario"); T.nosso = at("nosso");
T.compara = at("compara"); T.voce = at("voce", T.compara); T.empresa = at("empresa", T.voce); T.e5 = at("e", T.empresa);
T.familia = at("familia"); T.empresa2 = at("empresa", T.familia); T.nossos = at("nossos"); T.fim = WORDS[WORDS.length - 1].end;

// tomadas no vídeo cortado (tools/timeline.json): plano aberto (wide) ou selfie
const TAKES = [[0, "wide"], [5.234, "selfie"], [seg("s2").out_in, "selfie"], [16.3, "wide"], [seg("s10").out_in, "wide"],
  [41.434, "wide"], [seg("s16").out_in, "selfie"]];
const takeAt = (t) => TAKES.filter(([t0]) => t0 <= t + 1e-6).pop()[1];
const CUTS = SEGS.slice(1).map((s) => s.out_in);           // cortes de pausa (e trocas de tomada)

// janelas especiais
const HI = [r3(T.hospitais - 0.1), r3(T.plano3 + 0.08)];   // hospitais em tela cheia
const ENDC = r3(T.fim + 0.1);                               // cartão final

// ───────────── estilo ─────────────
const NAVY = "#0B1F3A", NAVY_D = "#071429", NAVY_DD = "#030A17", INK = "#0B1F3A";
const TEAL = "#14B8A6", TEAL_D = "#0F766E", MINT = "#99F6E4", ORANGE_D = "#C2410C", GREEN = "#16A34A", RED = "#DC2626";
const FONT_FILES = [
  ["Montserrat", 700, "Montserrat-700"], ["Montserrat", 800, "Montserrat-800"], ["Montserrat", 900, "Montserrat-900"],
  ["Poppins", 400, "Poppins-normal-400"], ["Poppins", 500, "Poppins-normal-500"], ["Poppins", 600, "Poppins-normal-600"],
  ["Poppins", 800, "Poppins-800"], ["Saira Semi Condensed", 700, "SairaSemiCondensed-normal-700"],
  ["Saira Semi Condensed", 800, "SairaSemiCondensed-normal-800"],
];
const FONTS = FONT_FILES.map(([f, w, file]) =>
  `@font-face{font-family:"${f}";font-weight:${w};font-style:normal;font-display:block;src:url("assets/fonts/${file}.woff2") format("woff2");}`).join("\n");

const OBS = {
  rede: "A rede credenciada pode variar conforme plano contratado.",
  disp: "Consulte a disponibilidade da rede hospitalar.",
  eleg: "Consulte condições e elegibilidade.",
  analise: "Condições sujeitas à análise comercial.",
  faixa: "Valores sujeitos à faixa etária e região.",
  ref: "Valores referenciais sujeitos às regras da operadora.",
  perfil: "Os valores podem variar conforme perfil do beneficiário.",
  cob: "Cobertura e rede sujeitas à modalidade contratada.",
};
const LEGAL_FIM = [
  "Planos de saúde empresariais para CNPJ/MEI, a partir de 2 vidas. Hospitais citados como exemplos de rede, conforme o plano.",
  OBS.eleg, OBS.analise, OBS.ref, OBS.faixa, OBS.rede, OBS.disp, OBS.cob,
].join(" ");

const ICON = {
  shield: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.5l8 3v6c0 5-3.4 8.8-8 10-4.6-1.2-8-5-8-10v-6z"/><path d="M8.5 12l2.5 2.5 4.5-5"/></svg>`,
  check: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>`,
  cal: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="5" width="17" height="15" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/></svg>`,
  hosp: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M12 7v6M9 10h6M10 21v-4h4v4"/></svg>`,
  refund: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/><path d="M12 7v10M14.5 9.5c0-1.4-1.1-2-2.5-2s-2.5.7-2.5 2 1.1 1.8 2.5 2.1 2.5.8 2.5 2.2-1.1 2-2.5 2-2.5-.6-2.5-2"/></svg>`,
  down: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>`,
  globe: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></svg>`,
  phone: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="2.5" width="12" height="19" rx="2.5"/><path d="M10.5 18.5h3"/><path d="M12 7.5v5M9.5 10h5"/></svg>`,
  wallet: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7.5h14.5a1.5 1.5 0 0 1 1.5 1.5v9.5a1.5 1.5 0 0 1-1.5 1.5H5.5A1.5 1.5 0 0 1 4 18.5z"/><path d="M4 7.5V6a2 2 0 0 1 2-2h10v3.5"/><path d="M16 13.5h4"/></svg>`,
  priceup: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/></svg>`,
  thumbdown: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 14V4h3v10z"/><path d="M17 14l-4 7a2.5 2.5 0 0 1-2.5-2.5V15H5.5a2 2 0 0 1-2-2.3l1.2-6.5A2 2 0 0 1 6.7 4.5H17"/></svg>`,
  eye: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>`,
  exit: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>`,
  brief: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 13h18"/></svg>`,
  team: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6"/><circle cx="17" cy="9" r="2.8"/><path d="M16 14.2c3 .2 5.5 2.3 5.5 5.3"/></svg>`,
  heart: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20.5s-8-4.6-8-10.5A4.5 4.5 0 0 1 12 7a4.5 4.5 0 0 1 8 3c0 5.9-8 10.5-8 10.5z"/></svg>`,
  form: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="3" width="16" height="18" rx="2.5"/><path d="M8 8h8M8 12h8M8 16h5"/></svg>`,
  info: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 11v5.5M12 7.5h.01"/></svg>`,
  swap: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8h13l-3-3M20 16H7l3 3"/></svg>`,
};
const icon = (k, size, color) => `<span class="ic" style="width:${size}px;height:${size}px;color:${color}">${ICON[k]}</span>`;

function sceneFile(id, css, body, js) {
  return `<template>
  <style>
${FONTS}
#root{position:absolute;inset:0;overflow:visible;font-family:"Poppins",Arial,sans-serif;color:#fff;}
.ic{display:inline-flex;}
.ic svg{width:100%;height:100%;}
.wcard{background:#fff;color:${INK};border-radius:28px;box-shadow:0 18px 44px rgba(2,8,20,.45);}
.tdot{border-radius:50%;background:${TEAL_D};display:flex;align-items:center;justify-content:center;flex:none;}
.chip{display:flex;align-items:center;gap:14px;height:84px;padding:0 34px 0 12px;border-radius:44px;background:#fff;color:${INK};border:3px solid #fff;font-family:"Saira Semi Condensed",Arial,sans-serif;font-weight:800;font-size:46px;line-height:1;text-transform:uppercase;white-space:nowrap;box-shadow:0 14px 34px rgba(2,8,20,.45);}
.chip .cd{width:62px;height:62px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex:none;background:${TEAL_D};}
.chip.or{background:${ORANGE_D};color:#fff;} .chip.or .cd{background:#fff;}
.chip.rd{background:${RED};color:#fff;} .chip.rd .cd{background:#fff;}
.chip.gr{background:${GREEN};color:#fff;} .chip.gr .cd{background:#fff;}
.chip.nv{background:${NAVY};color:#fff;border-color:rgba(153,246,228,.85);} .chip.nv .cd{background:${TEAL};}
${css}
  </style>
  <div id="root" data-composition-id="${id}" data-width="${W}" data-height="${H}">
${body}
  </div>
  <script>
    const tl = gsap.timeline({ paused: true });
${js}
    window.__timelines["${id}"] = tl;
  </script>
</template>
`;
}

const scenes = [];
function addScene(id, st, dur, css, body, js, { track = 3, kind = "graphics", z = 3 } = {}) {
  writeFileSync(join(ROOT, "compositions", `${id}.html`), sceneFile(id, css, body, js));
  scenes.push({ id, st: r3(st), dur: r3(dur), track, kind, z });
}
const popIn = (sel, t, { s = 0.6, d = 0.4 } = {}) =>
  `    tl.fromTo("${sel}",{opacity:0,scale:${s}},{opacity:1,scale:1,duration:${d},ease:"back.out(1.9)"},${r3(Math.max(0, t))});`;
const fadeUp = (sel, t, { y = 40, d = 0.38 } = {}) =>
  `    tl.fromTo("${sel}",{opacity:0,y:${y}},{opacity:1,y:0,duration:${d},ease:"power3.out"},${r3(Math.max(0, t))});`;
const stamp = (sel, t, from = 1.9) => [
  `    tl.fromTo("${sel}",{opacity:0,scale:${from}},{opacity:1,scale:1,duration:0.2,ease:"power4.in"},${r3(Math.max(0, t))});`,
  `    tl.fromTo("${sel}",{x:0},{keyframes:[{x:-9,duration:0.04},{x:7,duration:0.04},{x:-3,duration:0.04},{x:0,duration:0.05}],immediateRender:false},${r3(t + 0.2)});`,
].join("\n");

mkdirSync(join(ROOT, "compositions"), { recursive: true });

// ═════════════ hd · cabeçalho fixo ═════════════
{
  const css = `
#hd-band{position:absolute;left:0;width:${W}px;top:240px;display:flex;justify-content:center;}
#hd-band>div{position:relative;overflow:hidden;padding:10px 38px 12px;border-radius:14px;background:${TEAL_D};color:#fff;font-family:"Montserrat",Arial,sans-serif;font-weight:900;font-size:62px;line-height:1;letter-spacing:.01em;white-space:nowrap;box-shadow:0 12px 32px rgba(2,8,20,.4);border:3px solid rgba(255,255,255,.9);}
#hd-sweep{position:absolute;top:-20px;left:-160px;width:110px;height:140px;background:linear-gradient(90deg,rgba(153,246,228,0),rgba(153,246,228,.75),rgba(153,246,228,0));}
#hd-seal{position:absolute;left:0;width:${W}px;top:342px;display:flex;justify-content:center;}
#hd-seal>div{display:flex;align-items:center;gap:14px;padding:9px 30px 9px 10px;border-radius:60px;background:${NAVY};border:3px solid #fff;color:#fff;font-family:"Montserrat",Arial,sans-serif;font-weight:900;font-size:39px;line-height:1;white-space:nowrap;box-shadow:0 12px 32px rgba(2,8,20,.45);}
#hd-seal .sh{width:58px;height:58px;border-radius:50%;background:${TEAL};display:flex;align-items:center;justify-content:center;}
#hd-sub{position:absolute;left:0;width:${W}px;top:426px;display:flex;justify-content:center;}
#hd-sub>div{padding:6px 24px 7px;border-radius:26px;background:rgba(3,10,23,.86);border:2px solid rgba(255,255,255,.75);font-family:"Poppins",Arial,sans-serif;font-weight:600;font-size:28px;line-height:1.25;white-space:nowrap;}`;
  const body = `
    <div id="hd-band"><div id="hd-bandi" data-layout-allow-overflow>PLANOS DE SAÚDE<span id="hd-sweep" data-layout-ignore aria-hidden="true"></span></div></div>
    <div id="hd-seal"><div id="hd-seali"><span class="sh">${icon("shield", 34, "#fff")}</span>EXCLUSIVO PARA CNPJ/MEI</div></div>
    <div id="hd-sub"><div id="hd-subi">a partir de 2 vidas · São Paulo</div></div>`;
  const js = [
    `    tl.fromTo("#hd-sweep",{x:0},{x:${W},duration:0.9,ease:"power2.inOut"},0.45);`,
    `    tl.fromTo("#hd-sweep",{x:0},{x:${W},duration:0.9,ease:"power2.inOut",immediateRender:false},${r3(ENDC + 0.4)});`,
    ...[T.cnpj, T.cnpj2].map((t) => `    tl.fromTo("#hd-seali",{scale:1},{scale:1.12,duration:0.16,ease:"power2.out",yoyo:true,repeat:1,immediateRender:false},${r3(t - 0.04)});`),
    ...[T.duas, T.duas2].map((t) => `    tl.fromTo("#hd-subi",{scale:1},{scale:1.15,duration:0.16,ease:"power2.out",yoyo:true,repeat:1,immediateRender:false},${r3(t - 0.04)});`),
  ].join("\n");
  addScene("hd", 0, D, css, body, js, { track: 6, z: 6 });
}

// ═════════════ tc · selos no topo (logo abaixo do cabeçalho; não cobrem o rosto) ═════════════
{
  const TOP = 488;
  const C = [];   // [id, início, fim, html, entrada]
  const chip = (cls, ic, icColor, txt, id) => `<div class="chip ${cls}" id="${id}"><span class="cd">${icon(ic, 38, icColor)}</span>${txt}</div>`;
  C.push(["c1", T.subiu - 0.12, T.presta - 0.05, chip("or", "priceup", ORANGE_D, "Subiu de novo?", "c1i"), "pop"]);
  C.push(["c2", T.presta - 0.05, T.todo - 0.12, chip("", "eye", "#fff", "Presta atenção", "c2i"), "pop"]);
  C.push(["c3", T.todo - 0.08, T.reajuste - 0.06, chip("", "cal", "#fff", "Todo ano chega o", "c3i"), "pop"]);
  C.push(["c4", T.reajuste - 0.06, T.mensalidade - 0.1, chip("or", "priceup", ORANGE_D, "Reajuste", "c4i"), "stamp"]);
  C.push(["c5", T.mensalidade - 0.1, T.mesma - 0.1, chip("or", "wallet", ORANGE_D, "Pesa no orçamento", "c5i"), "pop"]);
  C.push(["c6", T.mesma - 0.1, T.pior - 0.04, chip("", "hosp", "#fff", "A mesma rede…", "c6i"), "pop"]);
  C.push(["c7", T.pior - 0.04, T.se2 - 0.05, chip("rd", "thumbdown", RED, "…ou pior", "c7i"), "stamp"]);
  C.push(["c8", T.cnpj - 0.1, T.da - 0.08,
    `<div class="chip" id="c8a"><span class="cd">${icon("check", 38, "#fff")}</span>CNPJ ou MEI</div><div class="chip" id="c8b"><span class="cd">${icon("team", 38, "#fff")}</span>2 vidas ou +</div>`, "pair"]);
  C.push(["c9", T.da - 0.08, T.o - 0.05, chip("gr", "exit", GREEN, "Dá pra sair dessa", "c9i"), "stamp"]);
  C.push(["c10", T.em - 0.06, T.rede2 - 0.1, chip("nv", "info", "#fff", "Em muitos casos", "c10i"), "pop"]);
  C.push(["c11", T.rede2 - 0.1, HI[0], chip("", "priceup", "#fff", "Uma rede melhor", "c11i"), "pop"]);
  C.push(["c12", T.e3 - 0.05, T.nao - 0.08, chip("nv", "check", "#fff", "Os benefícios vêm junto", "c12i"), "pop"]);
  C.push(["c13", T.nao - 0.08, T.e4 - 0.05, chip("", "swap", "#fff", "Não é trocar por trocar", "c13i"), "pop"]);
  C.push(["c14", T.e4 - 0.05, T.excl - 0.1, chip("or", "wallet", ORANGE_D, "É parar de pagar mais", "c14i"), "stamp"]);
  C.push(["c15", T.clica - 0.1, T.nosso - 0.1, chip("nv", "down", "#fff", "Clique no link abaixo", "c15i"), "pop"]);
  C.push(["c16", T.nosso - 0.1, seg("s16").out_in - 0.05, chip("nv", "team", "#fff", "Nosso time de especialistas", "c16i"), "pop"]);
  C.push(["c17", T.familia - 0.12, T.nossos - 0.1,
    `<div class="chip" id="c17a"><span class="cd">${icon("heart", 38, "#fff")}</span>Sua família</div><div class="chip" id="c17b"><span class="cd">${icon("brief", 38, "#fff")}</span>Sua empresa</div>`, "pair2"]);
  C.push(["c18", T.nossos - 0.1, ENDC, chip("gr", "shield", GREEN, "Em nossos planos", "c18i"), "stamp"]);
  const css = `.tc{position:absolute;left:0;width:${W}px;top:${TOP}px;display:flex;justify-content:center;gap:16px;}`;
  let body = "";
  const js = [];
  C.forEach(([id, a, b, html, kind]) => {
    a = r3(a); b = r3(b);
    body += `\n    <div class="tc clip" id="${id}" data-start="${a}" data-duration="${r3(b - a)}" data-track-index="0">${html}</div>`;
    if (kind === "stamp") js.push(stamp(`#${id}i`, a));
    else if (kind === "pop") js.push(popIn(`#${id}i`, a, { s: 0.5, d: 0.34 }));
    else if (kind === "pair") {
      js.push(popIn("#c8a", a, { s: 0.5, d: 0.34 }));
      js.push(popIn("#c8b", T.duas - 0.1, { s: 0.5, d: 0.34 }));
    } else if (kind === "pair2") {
      js.push(popIn("#c17a", a, { s: 0.5, d: 0.34 }));
      js.push(popIn("#c17b", T.empresa2 - 0.12, { s: 0.5, d: 0.34 }));
    }
  });
  addScene("tc", 0, D, css, body, js.join("\n"), { track: 4, z: 5 });
}

// ═════════════ lc · cartões no terço inferior (só nos planos abertos: o rosto fica acima) ═════════════
{
  const TOP = 1240;
  const L = [];   // [id, início, fim, html, animações]
  L.push(["l1", T.o - 0.05, T.em - 0.1, `
      <div class="lcard wcard" id="l1c"><span class="tdot" style="width:84px;height:84px">${icon("brief", 48, "#fff")}</span>
        <div><b class="lt">Plano empresarial</b><div class="mini"><span id="l1a">${icon("check", 26, GREEN)}outras regras</span><span id="l1b">${icon("check", 26, GREEN)}outros preços</span></div></div></div>`,
  [popIn("#l1c", T.o - 0.05, { s: 0.7, d: 0.4 }), popIn("#l1a", T.regras - 0.1, { s: 0.5, d: 0.3 }), popIn("#l1b", T.precos - 0.1, { s: 0.5, d: 0.3 })]]);
  const BEN = [["phone", "Telemedicina<br>24 h", "", T.tele], ["globe", "Cobertura<br>nacional", "", T.cobertura], ["refund", "Reembolso<br>de consultas", "em vários planos", T.reembolso]];
  L.push(["l2", T.tele - 0.25, T.nao - 0.08, `
      <div class="bens">${BEN.map(([ic, t, sm], i) => `<div class="ben wcard" id="l2b${i}"><span class="tdot" style="width:50px;height:50px">${icon(ic, 30, "#fff")}</span><b>${t}</b>${sm ? `<small>${sm}</small>` : ""}<span class="ok" id="l2k${i}">${icon("check", 26, "#fff")}</span></div>`).join("")}</div>`,
  BEN.flatMap(([, , , t], i) => [
    `    tl.fromTo("#l2b${i}",{opacity:0,y:70,rotationX:-60,transformPerspective:900},{opacity:1,y:0,rotationX:0,duration:0.42,ease:"back.out(1.5)"},${r3(t - 0.25)});`,
    popIn(`#l2k${i}`, t + 0.15, { s: 0.2, d: 0.3 }),
  ])]);
  L.push(["l3", T.excl - 0.12, T.clica - 0.1, `
      <div class="lcard wcard" id="l3c" style="box-shadow:0 18px 44px rgba(2,8,20,.45),0 0 0 7px rgba(20,184,166,.55)"><span class="tdot" style="width:92px;height:92px">${icon("shield", 56, "#fff")}</span>
        <div><i class="lk">Exclusivo para</i><b class="lt" style="font-size:60px;color:${TEAL_D}">CNPJ/MEI</b></div>
        <span class="vid" id="l3v">A partir de<br><b>2 vidas</b></span></div>`,
  [stamp("#l3c", T.excl - 0.1, 1.6), stamp("#l3v", T.duas2 - 0.75, 2.2)]]);
  L.push(["l4", T.clica - 0.1, T.nosso - 0.1, `
      <div class="lcard wcard" id="l4c" style="box-shadow:0 20px 44px rgba(2,8,20,.5),0 0 0 7px rgba(20,184,166,.5)"><span class="tdot" style="width:88px;height:88px">${icon("form", 52, "#fff")}</span>
        <div><b class="lt" style="color:${TEAL_D}">Solicite sua cotação</b><i class="lk2">Preencha o formulário</i></div></div><span id="l4r"></span>`,
  [popIn("#l4c", T.clica - 0.05, { s: 0.7, d: 0.42 }),
    `    tl.fromTo("#l4c",{scale:1},{scale:0.95,duration:0.1,ease:"power2.out",yoyo:true,repeat:1,immediateRender:false},${r3(T.formulario - 0.05)});`,
    `    tl.fromTo("#l4r",{opacity:0.9,scale:0.4},{opacity:0,scale:4,duration:0.6,ease:"power2.out",immediateRender:false},${r3(T.formulario - 0.02)});`]]);
  const COLS = [[0.78, 0.55, 0.66], [0.92, 0.84, 0.9], [0.6, 0.72, 0.5]];
  L.push(["l5", T.compara - 0.15, seg("s16").out_in - 0.05, `
      <div class="cmp">${COLS.map((v, i) => `<div class="opt wcard" id="l5o${i}"><h4>Opção ${i + 1}</h4>${i === 1 ? `<span id="l5best">${icon("check", 20, "#fff")}pra você</span>` : ""}${["Rede", "Preço", "Benefícios"].map((k, j) => `<div class="br"><span>${k}</span><i><em id="l5m${i}${j}" style="width:${Math.round(v[j] * 100)}%"></em></i></div>`).join("")}</div>`).join("")}</div>`,
  [...COLS.map((_, i) => `    tl.fromTo("#l5o${i}",{opacity:0,y:60},{opacity:1,y:0,duration:0.36,ease:"power3.out"},${r3(T.compara - 0.1 + i * 0.12)});`),
    ...COLS.flatMap((v, i) => v.map((_, j) => `    tl.fromTo("#l5m${i}${j}",{scaleX:0},{scaleX:1,duration:0.45,ease:"power2.out"},${r3(T.compara + 0.2 + i * 0.12 + j * 0.06)});`)),
    `    tl.fromTo("#l5o1",{scale:1},{scale:1.08,duration:0.3,ease:"back.out(2)"},${r3(T.voce - 0.1)});`,
    popIn("#l5best", T.voce - 0.05, { s: 0.4, d: 0.34 })]]);
  const css = `
.lc{position:absolute;left:0;width:${W}px;top:${TOP}px;height:140px;}
.lcard{position:absolute;left:70px;width:940px;height:140px;display:flex;align-items:center;gap:26px;padding:0 34px;}
.lt{display:block;font-family:"Saira Semi Condensed",Arial,sans-serif;font-weight:800;font-size:52px;line-height:1;text-transform:uppercase;color:${INK};}
.lk{display:block;font-style:normal;font-family:"Saira Semi Condensed",Arial,sans-serif;font-weight:800;font-size:34px;text-transform:uppercase;color:${INK};}
.lk2{display:block;font-style:normal;font-family:"Poppins",Arial,sans-serif;font-weight:600;font-size:30px;color:#475569;margin-top:6px;}
.mini{display:flex;gap:22px;margin-top:6px;}
.mini span{display:flex;align-items:center;gap:6px;font-family:"Poppins",Arial,sans-serif;font-weight:600;font-size:26px;color:#334155;}
.vid{margin-left:auto;text-align:center;padding:10px 18px;border-radius:20px;background:${ORANGE_D};color:#fff;font-family:"Poppins",Arial,sans-serif;font-weight:600;font-size:24px;line-height:1.1;}
.vid b{display:block;font-family:"Montserrat",Arial,sans-serif;font-weight:900;font-size:36px;}
.bens{position:absolute;left:60px;width:960px;top:0;display:flex;gap:18px;}
.ben{position:relative;flex:1;height:140px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;padding:0 10px;}
.ben b{font-family:"Saira Semi Condensed",Arial,sans-serif;font-weight:800;font-size:26px;line-height:1.02;text-transform:uppercase;text-align:center;color:${INK};}
.ben small{font-family:"Poppins",Arial,sans-serif;font-weight:600;font-size:19px;color:${TEAL_D};}
.ben .ok{position:absolute;right:10px;top:10px;width:36px;height:36px;border-radius:50%;background:${GREEN};display:flex;align-items:center;justify-content:center;}
#l4r{position:absolute;left:500px;top:30px;width:80px;height:80px;border-radius:50%;border:5px solid ${TEAL};opacity:0;}
.cmp{position:absolute;left:70px;width:940px;top:0;display:flex;gap:20px;}
.opt{position:relative;flex:1;height:140px;padding:12px 18px 0;}
.opt h4{font-family:"Poppins",Arial,sans-serif;font-weight:600;font-size:20px;line-height:1.2;color:#64748B;margin-bottom:8px;}
.br{display:flex;align-items:center;gap:8px;height:24px;margin-bottom:6px;}
.br span{width:104px;font-family:"Poppins",Arial,sans-serif;font-weight:600;font-size:19px;line-height:1.1;color:${INK};}
.br i{position:relative;flex:1;height:12px;border-radius:6px;background:#E2E8F0;overflow:hidden;}
.br i em{position:absolute;left:0;top:0;bottom:0;border-radius:7px;background:${TEAL};transform-origin:0 50%;}
#l5o1{box-shadow:0 0 0 6px ${TEAL},0 18px 40px rgba(2,8,20,.45);}
#l5best{position:absolute;right:8px;top:8px;display:flex;align-items:center;gap:4px;padding:4px 12px 5px 8px;border-radius:16px;background:${GREEN};color:#fff;font-family:"Poppins",Arial,sans-serif;font-weight:800;font-size:19px;white-space:nowrap;}`;
  let body = "";
  const js = [];
  L.forEach(([id, a, b, html, tw]) => {
    a = r3(a); b = r3(b);
    body += `\n    <div class="lc clip" id="${id}" data-start="${a}" data-duration="${r3(b - a)}" data-track-index="0">${html}\n    </div>`;
    js.push(...tw);
    js.push(`    tl.to("#${id}",{opacity:0,y:30,duration:0.18,ease:"power2.in"},${r3(b - 0.2)});`);
  });
  addScene("lc", 0, D, css, body, js.join("\n"), { track: 3, z: 5 });
}

// ═════════════ hi · hospitais: fachada real de cada um, no instante em que o nome é falado ═════════════
// Só fotos do hospital certo: São Luiz Itaim (foto enviada pelo cliente, com o logo e o letreiro) e BP (Beneficência
// Portuguesa, prédio com o logo "bp"; Cecilia Melozi, Wikimedia Commons, CC BY-SA 4.0). Não há foto ou vídeo de uso
// livre do São Camilo de São Paulo: o cartão dele fica sem imagem até o cliente enviar uma (HOS[1].img).
// As fotos ganham movimento de câmera (aproximação lenta + deslize), como um plano de vídeo.
const HOS = [
  { n: "São Luiz", t: T.luiz, img: "assets/img/sao-luiz-itaim.jpg", pos: "50% 35%", sub: "Unidade Itaim · São Paulo" },
  { n: "São Camilo", t: T.camilo, img: null, pos: "50% 50%", sub: "Hospital · São Paulo" },
  { n: "BP", t: T.bp, img: "assets/img/bp-melozi.jpg", pos: "42% 50%", sub: "Beneficência Portuguesa · São Paulo" },
];
const HI_CREDIT = "Foto do BP: Cecilia Melozi/Wikimedia Commons, CC BY-SA 4.0.";
{
  const [st, et] = HI;
  const L = (t) => r3(t - st);
  const d = et - st;
  const css = `
#hi-all{position:absolute;inset:0;}
#hi-bg{position:absolute;inset:0;background:radial-gradient(110% 60% at 50% 38%, #17406E 0%, ${NAVY} 45%, ${NAVY_DD} 100%);}
#hi-grid{position:absolute;inset:0;opacity:.7;background-image:linear-gradient(rgba(153,246,228,.07) 2px, transparent 2px),linear-gradient(90deg, rgba(153,246,228,.07) 2px, transparent 2px);background-size:60px 60px;}
#hi-t{position:absolute;left:0;width:${W}px;top:494px;text-align:center;font-family:"Saira Semi Condensed",Arial,sans-serif;font-weight:800;font-size:40px;letter-spacing:.06em;text-transform:uppercase;color:${MINT};}
.hp{position:absolute;left:60px;top:558px;width:960px;height:712px;border-radius:32px;overflow:hidden;background:#fff;box-shadow:0 24px 60px rgba(2,8,20,.6),0 0 0 6px #fff;}
.hp img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transform-origin:50% 45%;}
.hp .gr{position:absolute;left:0;right:0;bottom:0;height:300px;background:linear-gradient(180deg,rgba(3,10,23,0),rgba(3,10,23,.86));}
.hp .nm{position:absolute;left:40px;bottom:34px;width:680px;}
.hp .nm b{display:block;font-family:"Montserrat",Arial,sans-serif;font-weight:900;font-size:96px;line-height:1;color:#fff;letter-spacing:-.01em;white-space:nowrap;text-shadow:0 6px 24px rgba(0,0,0,.45);}
.hp .nm i{display:flex;align-items:center;gap:10px;margin-top:10px;font-style:normal;font-family:"Poppins",Arial,sans-serif;font-weight:600;font-size:28px;color:${MINT};white-space:nowrap;}
.hp .tag{position:absolute;left:40px;top:34px;display:flex;align-items:center;gap:10px;padding:8px 20px 8px 10px;border-radius:30px;background:${TEAL_D};font-family:"Saira Semi Condensed",Arial,sans-serif;font-weight:800;font-size:30px;text-transform:uppercase;}
.hp .tag .cd{width:40px;height:40px;border-radius:50%;background:#fff;display:flex;align-items:center;justify-content:center;}
.hp.noimg{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;}
.hp.noimg .tdot{width:120px;height:120px;}
.hp.noimg b{font-family:"Montserrat",Arial,sans-serif;font-weight:900;font-size:110px;line-height:1;color:${INK};white-space:nowrap;}
.hp.noimg i{font-style:normal;font-family:"Poppins",Arial,sans-serif;font-weight:600;font-size:30px;color:#475569;}
.hp .sw{position:absolute;top:-60px;left:-260px;width:160px;height:760px;transform:rotate(18deg);background:linear-gradient(90deg,rgba(255,255,255,0),rgba(255,255,255,.35),rgba(255,255,255,0));}
#hi-row{position:absolute;left:0;width:${W}px;top:560px;display:flex;justify-content:center;gap:18px;}
#hi-row>div{position:relative;width:300px;height:300px;border-radius:26px;overflow:hidden;background:#fff;box-shadow:0 18px 44px rgba(2,8,20,.5),0 0 0 5px #fff;}
#hi-row img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;}
#hi-row .gr{position:absolute;left:0;right:0;bottom:0;height:150px;background:linear-gradient(180deg,rgba(3,10,23,0),rgba(3,10,23,.85));}
#hi-row b{position:absolute;left:0;right:0;bottom:18px;text-align:center;font-family:"Montserrat",Arial,sans-serif;font-weight:900;font-size:40px;color:#fff;white-space:nowrap;}
#hi-row .ni{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;height:100%;}
#hi-row .ni .tdot{width:90px;height:90px;}
#hi-row .ni b{position:static;color:${INK};}
#hi-dep{position:absolute;left:0;width:${W}px;top:900px;display:flex;justify-content:center;}
#hi-dep>div{display:flex;align-items:center;gap:12px;height:76px;padding:0 32px 0 10px;border-radius:40px;background:${ORANGE_D};font-family:"Saira Semi Condensed",Arial,sans-serif;font-weight:800;font-size:42px;text-transform:uppercase;white-space:nowrap;box-shadow:0 14px 34px rgba(2,8,20,.5);}
#hi-dep .cd{width:56px;height:56px;border-radius:50%;background:#fff;display:flex;align-items:center;justify-content:center;}
#hi-lg{position:absolute;left:66px;width:680px;top:1292px;text-align:left;font-family:"Poppins",Arial,sans-serif;font-weight:500;font-size:19px;line-height:1.3;color:rgba(255,255,255,.92);}`;
  const card = (h, i) => h.img
    ? `<div class="hp" id="hc${i}"><img id="hm${i}" src="${h.img}" style="object-position:${h.pos}" alt=""><span class="gr"></span><span class="sw" id="hs${i}"></span>
      <div class="nm"><b>${h.n}</b><i>${icon("info", 26, MINT)}${h.sub}</i></div></div>`
    : `<div class="hp noimg" id="hc${i}"><span class="sw" id="hs${i}"></span><span class="tdot">${icon("hosp", 70, "#fff")}</span><b>${h.n}</b><i>${h.sub}</i></div>`;
  const body = `
    <div id="hi-all">
    <div id="hi-bg"></div><div id="hi-grid"></div>
    <div id="hi-t">Hospitais de referência em SP</div>
    ${HOS.map(card).join("\n    ")}
    <div id="hi-row">${HOS.map((h, i) => h.img
      ? `<div id="hr${i}"><img src="${h.img}" style="object-position:${h.pos}" alt=""><span class="gr"></span><b>${h.n}</b></div>`
      : `<div id="hr${i}"><div class="ni"><span class="tdot">${icon("hosp", 52, "#fff")}</span><b>${h.n}</b></div></div>`).join("")}</div>
    <div id="hi-dep"><div id="hi-depi"><span class="cd">${icon("info", 38, ORANGE_D)}</span>Dependendo do plano</div></div>
    <div id="hi-lg">${OBS.rede} ${OBS.disp} Imagem meramente ilustrativa. ${HI_CREDIT}</div>
    </div>`;
  const js = [
    `    tl.fromTo("#hi-all",{clipPath:"circle(0% at 50% 62%)"},{clipPath:"circle(150% at 50% 62%)",duration:0.45,ease:"power3.inOut"},0);`,
    fadeUp("#hi-t", 0.2, { y: 24 }),
    `    tl.fromTo("#hi-lg",{opacity:0},{opacity:1,duration:0.3},0.3);`,
    ...HOS.flatMap((h, i) => {
      const t0 = i ? L(h.t - 0.22) : L(T.hospitais + 0.15);
      const nx = HOS[i + 1] ? HOS[i + 1].t : T.dependendo;
      const t1 = L(nx - 0.24);
      const out = [
        `    tl.fromTo("#hc${i}",{opacity:0,x:${i ? 520 : 0},rotationY:${i ? -35 : 0},scale:${i ? 0.92 : 0.7},transformPerspective:1400},{opacity:1,x:0,rotationY:0,scale:1,duration:0.36,ease:"back.out(1.3)"},${t0});`,
        `    tl.fromTo("#hs${i}",{x:0},{x:1500,duration:0.7,ease:"power2.inOut"},${r3(t0 + 0.25)});`,
        `    tl.to("#hc${i}",{opacity:0,x:-520,rotationY:35,scale:0.92,duration:0.24,ease:"power2.in"},${t1});`,
      ];
      if (h.img) out.push(`    tl.fromTo("#hm${i}",{scale:1.02,x:${i ? 26 : -18}},{scale:1.16,x:${i ? -26 : 18},duration:${r3(t1 - t0 + 0.24)},ease:"none"},${t0});`);
      return out;
    }),
    ...HOS.map((_, i) => `    tl.fromTo("#hr${i}",{opacity:0,y:70},{opacity:1,y:0,duration:0.34,ease:"back.out(1.6)"},${L(T.dependendo - 0.12 + i * 0.07)});`),
    stamp("#hi-depi", L(T.dependendo + 0.18), 1.8),
    `    tl.to("#hi-all",{clipPath:"circle(0% at 50% 62%)",duration:0.4,ease:"power3.inOut"},${r3(d - 0.4)});`,
  ].join("\n");
  addScene("hi", st, d, css, body, js, { track: 2, z: 4 });
}

// ═════════════ ec · cartão final ═════════════
{
  const st = ENDC;
  const RECAP = [["hosp", "Rede de<br>referência*"], ["phone", "Telemedicina<br>24 h"], ["globe", "Cobertura<br>nacional"]];
  const css = `
#ec-all{position:absolute;inset:0;}
#ec-bg{position:absolute;inset:0;background:radial-gradient(110% 60% at 50% 38%, #17406E 0%, ${NAVY} 45%, ${NAVY_DD} 100%);}
#ec-grid{position:absolute;inset:0;opacity:.7;background-image:linear-gradient(rgba(153,246,228,.07) 2px, transparent 2px),linear-gradient(90deg, rgba(153,246,228,.07) 2px, transparent 2px);background-size:60px 60px;}
#ec-bt{position:absolute;left:90px;width:900px;top:520px;height:160px;border-radius:40px;display:flex;align-items:center;gap:26px;padding:0 38px;box-shadow:0 20px 44px rgba(2,8,20,.5),0 0 0 7px rgba(20,184,166,.5);}
#ec-bt .tdot{width:100px;height:100px;}
#ec-bt b{display:block;font-family:"Montserrat",Arial,sans-serif;font-weight:900;font-size:52px;line-height:1.02;color:${TEAL_D};}
#ec-bt i{display:block;font-style:normal;font-family:"Poppins",Arial,sans-serif;font-weight:600;font-size:30px;color:#475569;margin-top:6px;}
#ec-req{position:absolute;left:0;width:${W}px;top:706px;display:flex;justify-content:center;}
#ec-req>div{display:flex;align-items:center;gap:12px;padding:8px 26px 8px 10px;border-radius:40px;background:rgba(3,10,23,.85);border:2px solid rgba(153,246,228,.75);font-family:"Poppins",Arial,sans-serif;font-weight:600;font-size:30px;white-space:nowrap;}
#ec-req .ok{width:48px;height:48px;border-radius:50%;background:${GREEN};display:flex;align-items:center;justify-content:center;}
.ec-rc{position:absolute;top:796px;width:292px;height:168px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;}
.ec-rc .tdot{width:68px;height:68px;}
.ec-rc b{font-family:"Saira Semi Condensed",Arial,sans-serif;font-weight:800;font-size:28px;line-height:1.02;text-transform:uppercase;text-align:center;color:${INK};}
#ec-lg{position:absolute;left:100px;width:${W - 200}px;top:1404px;text-align:center;font-family:"Poppins",Arial,sans-serif;font-weight:500;font-size:19px;line-height:1.32;color:rgba(255,255,255,.92);}`;
  const body = `
    <div id="ec-all">
    <div id="ec-bg"></div><div id="ec-grid"></div>
    <div id="ec-bt" class="wcard"><span class="tdot">${icon("form", 58, "#fff")}</span><div><b>SOLICITE SUA COTAÇÃO</b><i>Preencha o formulário</i></div></div>
    <div id="ec-req"><div><span class="ok">${icon("check", 30, "#fff")}</span>Exclusivo para CNPJ/MEI · a partir de 2 vidas</div></div>
    ${RECAP.map(([ic, txt], i) => `<div class="ec-rc wcard" id="ec-rc${i}" style="left:${76 + i * 316}px"><span class="tdot">${icon(ic, 40, "#fff")}</span><b>${txt}</b></div>`).join("\n    ")}
    <div id="ec-lg">${LEGAL_FIM} *Rede, telemedicina e cobertura conforme o plano contratado.</div>
    </div>`;
  const js = [
    `    tl.fromTo("#ec-all",{clipPath:"circle(0% at 50% 62%)"},{clipPath:"circle(150% at 50% 62%)",duration:0.5,ease:"power3.inOut"},0);`,
    popIn("#ec-bt", 0.25, { s: 0.7, d: 0.45 }),
    fadeUp("#ec-req", 0.45, { y: 24 }),
    ...RECAP.map((_, i) => `    tl.fromTo("#ec-rc${i}",{opacity:0,y:50},{opacity:1,y:0,duration:0.36,ease:"back.out(1.6)"},${r3(0.55 + i * 0.1)});`),
    `    tl.fromTo("#ec-lg",{opacity:0},{opacity:1,duration:0.3},0.5);`,
    `    tl.fromTo("#ec-bt",{scale:1},{scale:1.04,duration:0.35,ease:"sine.inOut",yoyo:true,repeat:1,immediateRender:false},1.2);`,
  ].join("\n");
  addScene("ec", st, D - st, css, body, js, { track: 2, z: 4 });
}

// ═════════════ lf · texto legal logo acima da legenda ═════════════
{
  const WIN = [
    [0.3, T.todo - 0.1, `${OBS.eleg} ${OBS.analise}`],
    [T.todo - 0.1, T.se2 - 0.1, `${OBS.ref} ${OBS.perfil}`],
    [T.se2 - 0.1, T.o - 0.1, `${OBS.eleg} ${OBS.faixa}`],
    [T.o - 0.1, T.em - 0.1, `${OBS.ref} ${OBS.faixa}`],
    [T.em - 0.1, HI[0], `${OBS.rede} ${OBS.disp}`],
    [HI[1], T.nao - 0.1, `${OBS.cob} ${OBS.rede}`],
    [T.nao - 0.1, T.excl - 0.12, `${OBS.ref} ${OBS.perfil}`],
    [T.excl - 0.12, T.e5 - 0.1, `${OBS.eleg} ${OBS.analise}`],
    [T.e5 - 0.1, ENDC, `${OBS.eleg} ${OBS.cob}`],
  ];
  const css = `
.lf{position:absolute;left:0;width:${W}px;bottom:${H - 1433}px;display:flex;justify-content:center;}
.lf>div{max-width:920px;padding:6px 18px;border-radius:12px;background:rgba(3,10,23,.78);text-align:center;font-family:"Poppins",Arial,sans-serif;font-weight:500;font-size:19px;line-height:1.3;color:#fff;}`;
  const body = WIN.map(([a, b, txt], i) => `
    <div class="lf clip" id="lf-${i}" data-start="${r3(a)}" data-duration="${r3(b - a)}" data-track-index="0"><div id="lf-${i}i">${txt}</div></div>`).join("");
  const js = WIN.map(([a], i) => `    tl.fromTo("#lf-${i}i",{opacity:0},{opacity:1,duration:0.25},${r3(a)});`).join("\n");
  addScene("lf", 0, D, css, body, js, { track: 7, z: 6 });
}

// ═════════════ cap · legendas palavra a palavra ═════════════
{
  const EMPH = new Set(["subiu", "atencao", "reajuste", "mensalidade", "orcamento", "pior", "cnpj", "mei", "duas", "vidas",
    "empresarial", "regras", "precos", "melhor", "luiz", "camilo", "bp", "beneficios", "telemedicina", "24", "nacional",
    "reembolso", "trocar", "parar", "mais", "exclusivo", "link", "formulario", "especialistas", "operadoras", "familia", "empresa", "planos"]);
  const PAIN = new Set(["reajuste", "pior", "orcamento", "mais"]);
  const BOUNDS = [HI[0], HI[1]];
  const groups = [];
  let cur = [];
  const flush = () => { if (cur.length) groups.push(cur); cur = []; };
  WORDS.forEach((w, i) => {
    const prev = WORDS[i - 1];
    const crosses = prev && BOUNDS.some((b) => prev.start < b && w.start >= b);
    if (cur.length && (crosses || w.start - prev.end >= 0.15 || cur.length >= 3)) flush();
    cur.push({ ...w, i });
    if (/[.,?!]$/.test(w.word)) flush();
  });
  flush();
  const disp = (w) => w.word.replace(/[.,!]$/, "").toUpperCase();
  const color = (w) => (PAIN.has(norm(w.word)) ? ORANGE_D : TEAL_D);
  let html = "";
  const js = [];
  groups.forEach((g, gi) => {
    const s = r3(Math.max(0.12, g[0].start - 0.06));
    const nextStart = groups[gi + 1] ? groups[gi + 1][0].start - 0.06 : D;
    const e = r3(Math.min(nextStart, g[g.length - 1].end + 0.35, ENDC));
    const chars = g.map(disp).join(" ").length;
    const fs = Math.max(44, Math.min(72, Math.floor(880 / (chars * 0.9))));
    html += `    <div class="cg clip" id="cg${gi}" data-start="${s}" data-duration="${r3(e - s)}" data-track-index="0"><div class="gi" id="cg${gi}i" style="font-size:${fs}px">${g
      .map((w) => `<span class="w" id="cw${w.i}"${EMPH.has(norm(w.word)) ? ` style="color:${color(w)}"` : ""}>${disp(w)}</span>`)
      .join(" ")}</div></div>\n`;
    js.push(`    tl.fromTo("#cg${gi}i",{opacity:0,y:22,scale:0.9},{opacity:1,y:0,scale:1,duration:0.14,ease:"power3.out"},${s});`);
    g.forEach((w) => {
      const em = EMPH.has(norm(w.word));
      js.push(`    tl.fromTo("#cw${w.i}",{scale:1},{scale:${em ? 1.1 : 1.05},duration:0.1,ease:"power2.out",yoyo:true,repeat:1},${r3(w.start)});`);
      if (!em) {
        js.push(`    tl.set("#cw${w.i}",{color:"${TEAL_D}"},${r3(w.start)});`);
        js.push(`    tl.set("#cw${w.i}",{color:"${INK}"},${r3(Math.min(w.end, e - 0.01))});`);
      }
    });
    js.push(`    tl.to("#cg${gi}i",{opacity:0,duration:0.1,ease:"power2.in"},${r3(Math.max(s + 0.15, e - 0.1))});`);
  });
  const css = `
.cg{position:absolute;left:0;width:${W}px;top:1440px;text-align:center;}
.gi{display:inline-block;max-width:960px;padding:10px 26px 14px;border-radius:22px;background:rgba(255,255,255,.97);box-shadow:0 12px 30px rgba(2,8,20,.4);font-family:"Montserrat",Arial,sans-serif;font-weight:900;line-height:1.08;color:${INK};letter-spacing:.005em;}
.gi .w{display:inline-block;margin:0 .17em;}`;
  addScene("cap", 0, D, css, html, js.join("\n"), { track: 8, kind: "captions", z: 7 });
}

// ═════════════ efeitos sonoros ═════════════
const sfx = [];
const hitOf = (k) => (HITS[k.replace(/2$/, "")] || { hit: 0 }).hit;
const durOf = (k) => (HITS[k.replace(/2$/, "")] || { dur: 1 }).dur;
const S = (k, t, vol = 0.5, dur) => sfx.push({ k, t: r3(t + 1 / 30 - hitOf(k)), vol, dur: dur || durOf(k) });
S("pop2", T.subiu - 0.12, 0.35);
S("pop", T.presta - 0.05, 0.25);
S("pop", T.todo - 0.08, 0.25);
S("stamp", T.reajuste - 0.06, 0.5);
S("pop2", T.mensalidade - 0.1, 0.3);
S("pop", T.mesma - 0.1, 0.25);
S("stamp", T.pior - 0.04, 0.45);
S("stamp", T.cnpj - 0.1, 0.4);
S("pop2", T.duas - 0.1, 0.35);
S("stamp", T.da - 0.08, 0.45);
S("riser", T.o - 0.1, 0.3);
S("impact", T.o + 0.02, 0.4);
S("card", T.o - 0.05, 0.3);
S("check", T.regras, 0.35); S("check", T.precos, 0.35);
S("pop", T.em - 0.06, 0.25);
S("pop2", T.rede2 - 0.1, 0.3);
S("whoosh", HI[0] + 0.05, 0.45);
S("impact", T.luiz - 0.2, 0.3);
S("whoosh2", T.camilo - 0.24, 0.35); S("impact", T.camilo - 0.2, 0.25);
S("whoosh2", T.bp - 0.24, 0.35); S("impact", T.bp - 0.2, 0.25);
S("shimmer", T.luiz + 0.05, 0.25);
S("stamp", T.dependendo + 0.18, 0.45);
S("whoosh", HI[1] - 0.4, 0.4);
S("pop", T.e3 - 0.05, 0.25);
S("card", T.tele - 0.25, 0.3);
S("check", T.tele + 0.15, 0.4); S("check", T.cobertura + 0.15, 0.4); S("check", T.reembolso + 0.15, 0.4);
S("pop", T.nao - 0.08, 0.25);
S("stamp", T.e4 - 0.05, 0.45);
S("stamp", T.excl - 0.1, 0.5);
S("impact", T.excl - 0.1, 0.3);
S("stamp", T.duas2 - 0.08, 0.45);
S("pop", T.clica - 0.05, 0.4);
S("tap", T.formulario - 0.02, 0.55);
S("pop", T.nosso - 0.1, 0.25);
S("card", T.compara - 0.1, 0.3);
S("chime", T.voce - 0.05, 0.35);
S("pop2", T.familia - 0.12, 0.3); S("pop2", T.empresa2 - 0.12, 0.3);
S("stamp", T.nossos - 0.1, 0.4);
S("whoosh", ENDC + 0.02, 0.4);
S("chime", ENDC + 0.3, 0.35);
sfx.sort((a, b) => a.t - b.t);
const laneEnd = [0, 0, 0, 0, 0, 0];
sfx.forEach((s) => { let l = laneEnd.findIndex((e) => e <= s.t); if (l < 0) l = laneEnd.length - 1; s.lane = 12 + l; laneEnd[l] = s.t + s.dur; });

// ═════════════ raiz: zoom do apresentador e círculo ═════════════
// Cada corte de pausa alterna o enquadramento (normal ↔ mais perto): o corte vira um "punch" e o rosto ganha
// destaque. Nas palavras fortes, um punch-in rápido. As tomadas de selfie já são próximas: zoom menor.
const ORIGIN = { wide: "50% 52%", selfie: "50% 42%" };
const LEVEL = { wide: [1.0, 1.07], selfie: [1.0, 1.06] };
const CAP = { wide: 1.13, selfie: 1.1 };
const PUNCH = [T.subiu, T.atencao, T.reajuste, T.pior, T.cnpj, T.da, T.empresarial, T.melhor, T.parar, T.mais, T.excl,
  T.formulario, T.compara, T.familia, T.nossos];
const R = [];
const bounds = [0, ...CUTS, ENDC];
let lvl = 0, prevTake = null;
for (let i = 0; i < bounds.length - 1; i++) {
  const a = r3(bounds[i]), b = r3(bounds[i + 1]);
  const tk = takeAt(a + 0.01);
  if (tk !== prevTake) { lvl = 0; R.push(`      tl.set("#vw",{transformOrigin:"${ORIGIN[tk]}"},${a});`); }
  else lvl = 1 - lvl;
  prevTake = tk;
  let s = LEVEL[tk][lvl];
  R.push(`      tl.set("#vw",{scale:${s}},${a});`);
  let t = a;
  for (const p of PUNCH.filter((p) => p > a + 0.25 && p < b - 0.3)) {
    const tp = r3(p - 0.05);
    if (tp - t > 0.05) R.push(`      tl.to("#vw",{scale:${r3(s + 0.012)},duration:${r3(tp - t)},ease:"none"},${r3(t)});`);
    s = r3(Math.min(CAP[tk], s + 0.012 + 0.04));
    R.push(`      tl.to("#vw",{scale:${s},duration:0.16,ease:"power3.out"},${tp});`);
    t = r3(tp + 0.16);
  }
  if (b - t > 0.05) R.push(`      tl.to("#vw",{scale:${r3(Math.min(CAP[tk] + 0.01, s + 0.015))},duration:${r3(b - t)},ease:"none"},${r3(t)});`);
}
// círculo do apresentador: nos hospitais, menor, no canto do cartão da fachada; no cartão final, maior e no centro
const pipFrame = (size, k, fx, fy) => ({ w: W * k, h: H * k, x: r3(size / 2 - fx * k), y: r3(size / 2 - fy * k) });
const PIPA = { size: 270, left: 770, top: 1080 }, PIPB = { size: 340, left: (W - 340) / 2, top: 1040 };
const P1 = pipFrame(PIPA.size, 0.52, 540, 930), P2 = pipFrame(PIPB.size, 0.42, 540, 960);
R.push(`      tl.set("#pipA,#pipB",{opacity:0,scale:0.4},0);`);
R.push(`      tl.to("#pipA",{opacity:1,scale:1,duration:0.4,ease:"back.out(1.6)"},${r3(HI[0] + 0.25)});`);
R.push(`      tl.to("#pipA",{opacity:0,scale:0.4,duration:0.25,ease:"power2.in"},${r3(HI[1] - 0.45)});`);
R.push(`      tl.to("#pipB",{opacity:1,scale:1,duration:0.4,ease:"back.out(1.6)"},${r3(ENDC + 0.35)});`);
R.push(`      tl.fromTo("#ringA",{rotation:0},{rotation:360,duration:${r3(HI[1] - HI[0])},ease:"none"},${HI[0]});`);
R.push(`      tl.fromTo("#ringB",{rotation:0},{rotation:240,duration:${r3(D - ENDC)},ease:"none"},${ENDC});`);

const hosts = scenes.map((s) => `      <div id="${s.id}" data-composition-id="${s.id}" data-composition-src="compositions/${s.id}.html" data-start="${s.st}" data-duration="${s.dur}" data-track-index="${s.track}" data-track-kind="${s.kind}" data-width="${W}" data-height="${H}" style="position:absolute;inset:0;z-index:${s.z}"></div>`).join("\n");
const audio = [
  `      <audio id="a-voice" class="clip" data-start="0" data-duration="${D}" data-track-index="10" data-volume="1" src="assets/audio/voice.wav"></audio>`,
  `      <audio id="a-bgm" class="clip" data-start="0" data-duration="${D}" data-track-index="11" data-volume="1.3" src="assets/audio/bgm_duck.wav"></audio>`,
  ...sfx.map((s, i) => `      <audio id="sfx-${i}-${s.k}" class="clip" data-start="${s.t}" data-duration="${s.dur}" data-track-index="${s.lane}" data-volume="${s.vol}" src="assets/audio/sfx_${s.k}.wav"></audio>`),
].join("\n");

const index = `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=${W}, height=${H}" />
    <script src="assets/vendor/gsap.min.js"></script>
    <style>
${FONTS}
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body { width: ${W}px; height: ${H}px; overflow: hidden; background: ${NAVY_D}; }
      #root { position: relative; width: ${W}px; height: ${H}px; overflow: hidden; background: ${NAVY_D}; }
      #vw { position: absolute; left: 0; top: 0; width: ${W}px; height: ${H}px; z-index: 1; }
      #v-src { position: absolute; left: 0; top: 0; width: ${W}px; height: ${H}px; object-fit: cover; }
      .pip { position: absolute; z-index: 5; }
      #pipA { left: ${PIPA.left}px; top: ${PIPA.top}px; width: ${PIPA.size}px; height: ${PIPA.size}px; }
      #pipB { left: ${PIPB.left}px; top: ${PIPB.top}px; width: ${PIPB.size}px; height: ${PIPB.size}px; }
      .pip-in { position: absolute; inset: 0; border-radius: 50%; overflow: hidden; background: ${NAVY_D}; box-shadow: 0 0 0 7px #fff, 0 18px 50px rgba(2,8,20,.6), 0 0 60px rgba(20,184,166,.55); }
      #v-pip1 { position: absolute; left: ${P1.x}px; top: ${P1.y}px; width: ${P1.w}px; height: ${P1.h}px; object-fit: cover; }
      #v-pip2 { position: absolute; left: ${P2.x}px; top: ${P2.y}px; width: ${P2.w}px; height: ${P2.h}px; object-fit: cover; }
      .pip-ring { position: absolute; inset: -20px; border-radius: 50%; border: 5px dashed rgba(153,246,228,.85); }
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="${D}" data-width="${W}" data-height="${H}">
      <div id="vw">
        <video id="v-src" class="clip" data-start="0" data-duration="${D}" data-track-index="0" muted playsinline src="assets/video/src.mp4"></video>
      </div>
      <div id="pipA" class="pip" data-layout-allow-overflow><div id="ringA" class="pip-ring" data-layout-ignore></div><div class="pip-in"><video id="v-pip1" class="clip" data-start="${HI[0]}" data-duration="${r3(HI[1] - HI[0])}" data-media-start="${HI[0]}" data-track-index="1" muted playsinline src="assets/video/src.mp4"></video></div></div>
      <div id="pipB" class="pip" data-layout-allow-overflow><div id="ringB" class="pip-ring" data-layout-ignore></div><div class="pip-in"><video id="v-pip2" class="clip" data-start="${ENDC}" data-duration="${r3(D - ENDC)}" data-media-start="${ENDC}" data-track-index="1" muted playsinline src="assets/video/src.mp4"></video></div></div>
${hosts}
${audio}
    </div>
    <script>
      window.__timelines = window.__timelines || {};
      const tl = gsap.timeline({ paused: true });
${R.join("\n")}
      window.__timelines["main"] = tl;
    </script>
  </body>
</html>
`;
writeFileSync(join(ROOT, "index.html"), index);
writeFileSync(join(ROOT, "tools", "timing.json"), JSON.stringify({ T, TAKES, CUTS, HI, ENDC, sfx }, null, 1));
console.log(`index.html ${W}x${H} ${D}s · ${scenes.length} cenas · ${sfx.length} efeitos · ${CUTS.length} cortes · hospitais ${HI[0]}–${HI[1]} · fim ${ENDC}`);
