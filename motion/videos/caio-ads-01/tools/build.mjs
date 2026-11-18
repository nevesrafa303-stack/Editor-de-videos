// Gera index.html e compositions/*.html do anúncio "Ads 01 vídeo Caio" (talking head 9:16, 41 s).
//
// Estrutura:
// - o vídeo do Caio (mudo; a voz tratada vai em <audio>) fica num invólucro (#vw) que o timeline da raiz move:
//   tela cheia no gancho, na pergunta da simulação e com punch-ins; desce para a metade de baixo quando o
//   painel de infográficos (#pbg) cai de cima;
// - cenas do painel (p1–p7), uma por trecho da fala, cada uma com a sua observação obrigatória;
// - cabeçalho fixo (hd): "PLANOS DE SAÚDE" + selo "EXCLUSIVO PARA CNPJ/MEI" + "a partir de 3 vidas";
// - legendas palavra a palavra (cap) e o texto legal das partes em tela cheia (lf);
// - trilha, voz e efeitos sonoros na raiz.
//
//   node tools/build.mjs
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const W = 1080, H = 1920, D = 41.0;
const WORDS = JSON.parse(readFileSync(join(ROOT, "tools/words.json"), "utf8"));
const HITS = JSON.parse(readFileSync(join(ROOT, "assets/audio/sfx_hits.json"), "utf8"));
const r3 = (x) => Math.round(x * 1000) / 1000;
const norm = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9%]/g, "");
const find = (w, after = 0) => {
  const x = WORDS.find((o) => norm(o.word) === w && o.start >= after - 1e-3);
  if (!x) throw new Error(`palavra não encontrada: ${w} depois de ${after}`);
  return x;
};
const at = (w, after) => find(w, after).start;
const en = (w, after) => find(w, after).end;

// ───────────── tempos (todos absolutos, em segundos, presos à fala) ─────────────
const T = {};
T.voce = at("voce"); T.melhores = at("melhores"); T.hospitais = at("hospitais"); T.sao = at("sao");
T.qualidade = at("qualidade"); T.como = at("como"); T.einstein = at("einstein"); T.sirio = at("sirio");
T.fleury = at("fleury"); T.laboratorios = at("laboratorios"); T.saiba = at("saiba"); T.trabalhamos = at("trabalhamos"); T.todas = at("todas");
T.operadoras = at("operadoras"); T.cobertura = at("cobertura"); T.caso = at("caso"); T.plano = at("plano");
T.ano = at("ano"); T.revisamos = at("revisamos"); T.contrato = at("contrato"); T.muitas = at("muitas");
T.reducoes = at("reducoes"); T.n10 = at("10%"); T.n50 = at("50%"); T.desconto = at("desconto");
T.sem = at("sem"); T.beneficios = at("beneficios", T.sem); T.rede2 = at("rede", T.sem); T.lembrando = at("lembrando");
T.necessario = at("necessario"); T.cnpj = at("cnpj"); T.para = at("para", T.cnpj); T.quer = at("quer");
T.simulacao = at("simulacao"); T.clique = at("clique"); T.preencha = at("preencha"); T.formulario = at("formulario");
T.nossa = at("nossa"); T.fim = WORDS[WORDS.length - 1].end;

// modos: tela cheia ↔ painel de infográficos
const S1 = r3(T.como - 0.3);   // painel desce
const S2 = r3(T.quer - 0.42);  // painel sobe (pergunta da simulação em tela cheia)
const S3 = r3(T.clique - 0.3); // painel desce de novo (CTA)
const MOVE = 0.5;
const SPLIT_Y = 680;
const OFF = 48;          // conteúdo do painel desce 48 px junto com o cabeçalho
const split = (t) => (t >= S1 + 0.25 && t < S2 + 0.25) || t >= S3 + 0.25;

// trechos do painel
const PANELS = {
  p1: [S1, r3(T.trabalhamos - 0.3)],
  p2: [r3(T.trabalhamos - 0.3), r3(T.caso - 0.12)],
  p3: [r3(T.caso - 0.12), r3(T.muitas - 0.3)],
  p4: [r3(T.muitas - 0.3), r3(T.sem - 0.12)],
  p5: [r3(T.sem - 0.12), r3(T.lembrando - 0.1)],
  p6: [r3(T.lembrando - 0.1), r3(S2 + MOVE)],
  p7: [S3, D],
};

// ───────────── estilo ─────────────
const NAVY = "#0A1A36", NAVY2 = "#13305F", AMB = "#FFC23D", GREEN = "#22C55E", INK = "#0B1E3D";
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
  img: "Imagem meramente ilustrativa.",
  oferta: "Oferta sujeita à disponibilidade comercial.",
};
const NOTA_REDUCAO = "*Percentual varia conforme o contrato atual e a análise.";
const LEGAL_FIM = [
  "Hospitais e laboratório citados como exemplos de rede. Redução conforme o contrato atual e a análise.",
  "Exclusivo para CNPJ/MEI, a partir de 3 vidas.",
  OBS.eleg, OBS.analise, OBS.ref, OBS.rede, OBS.cob, OBS.img,
].join(" ");

const ICON = {
  shield: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.5l8 3v6c0 5-3.4 8.8-8 10-4.6-1.2-8-5-8-10v-6z"/><path d="M8.5 12l2.5 2.5 4.5-5"/></svg>`,
  check: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>`,
  cal: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="5" width="17" height="15" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/><path d="M9 15l2 2 4-4"/></svg>`,
  doc: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2.5H6.5a2 2 0 0 0-2 2v15a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V8z"/><path d="M14 2.5V8h5.5M8.5 13h7M8.5 17h5"/></svg>`,
  lab: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3h6M10 3v6.5L4.8 18.2A2 2 0 0 0 6.5 21h11a2 2 0 0 0 1.7-2.8L14 9.5V3"/><path d="M7.5 15h9"/></svg>`,
  down: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>`,
  form: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="3" width="16" height="18" rx="2.5"/><path d="M8 8h8M8 12h8M8 16h5"/></svg>`,
  search: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><circle cx="10.5" cy="10.5" r="6"/><path d="M15 15l5.5 5.5"/></svg>`,
};
const icon = (k, size, color) => `<span class="ic" style="width:${size}px;height:${size}px;color:${color}">${ICON[k]}</span>`;

function sceneFile(id, css, body, js) {
  return `<template>
  <style>
${FONTS}
#root{position:absolute;inset:0;overflow:visible;font-family:"Poppins",Arial,sans-serif;color:#fff;}
.ic{display:inline-flex;}
.ic svg{width:100%;height:100%;}
.pt{position:absolute;left:0;width:${W}px;text-align:center;font-family:"Saira Semi Condensed",Arial,sans-serif;font-weight:800;text-transform:uppercase;line-height:1.02;letter-spacing:.005em;}
.lab{position:absolute;left:0;width:${W}px;text-align:center;font-family:"Poppins",Arial,sans-serif;font-weight:600;font-size:30px;letter-spacing:.08em;text-transform:uppercase;color:${AMB};}
.legal{position:absolute;left:100px;width:${W - 200}px;text-align:center;font-family:"Poppins",Arial,sans-serif;font-weight:500;font-size:19px;line-height:1.32;color:rgba(255,255,255,.88);}
${css}
  </style>
  <div id="root" data-composition-id="${id}" data-width="${W}" data-height="${H}">
${/^p\d$/.test(id) ? `<div class="pw" style="position:absolute;left:0;top:${OFF}px;width:${W}px;height:${H}px">${body}</div>` : body}
  </div>
  <script>
    const tl = gsap.timeline({ paused: true });
${js}
    window.__timelines["${id}"] = tl;
  </script>
</template>
`;
}

const scenes = []; // {id, st, dur, track, kind, z}
function addScene(id, st, dur, css, body, js, { track = 3, kind = "graphics", z = 3 } = {}) {
  writeFileSync(join(ROOT, "compositions", `${id}.html`), sceneFile(id, css, body, js));
  scenes.push({ id, st: r3(st), dur: r3(dur), track, kind, z });
}

// animações comuns, em tempo local de cada cena
const fadeUp = (sel, t, { y = 40, d = 0.4, ease = "power3.out" } = {}) =>
  `    tl.fromTo("${sel}",{opacity:0,y:${y}},{opacity:1,y:0,duration:${d},ease:"${ease}"},${r3(Math.max(0, t))});`;
const popIn = (sel, t, { s = 0.6, d = 0.42 } = {}) =>
  `    tl.fromTo("${sel}",{opacity:0,scale:${s}},{opacity:1,scale:1,duration:${d},ease:"back.out(1.9)"},${r3(Math.max(0, t))});`;
const outUp = (sel, t, d = 0.24) => `    tl.to("${sel}",{opacity:0,y:-36,duration:${d},ease:"power2.in"},${r3(t)});`;

mkdirSync(join(ROOT, "compositions"), { recursive: true });

// ═════════════ hd · cabeçalho fixo ═════════════
{
  const id = "hd";
  const css = `
#hd-band{position:absolute;left:0;width:${W}px;top:240px;display:flex;justify-content:center;}
#hd-band>div{position:relative;overflow:hidden;padding:10px 38px 12px;border-radius:14px;background:${AMB};color:${INK};font-family:"Montserrat",Arial,sans-serif;font-weight:900;font-size:62px;line-height:1;letter-spacing:.01em;white-space:nowrap;box-shadow:0 12px 32px rgba(0,0,0,.35);}
#hd-sweep{position:absolute;top:-20px;left:-160px;width:110px;height:140px;background:linear-gradient(90deg,rgba(255,255,255,0),rgba(255,255,255,.75),rgba(255,255,255,0));}
#hd-seal{position:absolute;left:0;width:${W}px;top:342px;display:flex;justify-content:center;}
#hd-seal>div{display:flex;align-items:center;gap:14px;padding:9px 30px 9px 10px;border-radius:60px;background:#fff;color:${INK};font-family:"Montserrat",Arial,sans-serif;font-weight:900;font-size:39px;line-height:1;white-space:nowrap;box-shadow:0 12px 32px rgba(0,0,0,.3);}
#hd-seal .sh{width:58px;height:58px;border-radius:50%;background:${INK};display:flex;align-items:center;justify-content:center;}
#hd-sub{position:absolute;left:0;width:${W}px;top:426px;display:flex;justify-content:center;}
#hd-sub>div{padding:6px 24px 7px;border-radius:26px;background:rgba(7,16,34,.88);border:2px solid rgba(255,194,61,.75);font-family:"Poppins",Arial,sans-serif;font-weight:600;font-size:28px;line-height:1.25;white-space:nowrap;}`;
  const body = `
    <div id="hd-band"><div id="hd-bandi" data-layout-allow-overflow>PLANOS DE SAÚDE<span id="hd-sweep" data-layout-ignore aria-hidden="true"></span></div></div>
    <div id="hd-seal"><div id="hd-seali"><span class="sh">${icon("shield", 34, AMB)}</span>EXCLUSIVO PARA CNPJ/MEI</div></div>
    <div id="hd-sub"><div>a partir de 3 vidas · São Paulo</div></div>`;
  const js = [
    `    tl.fromTo("#hd-sweep",{x:0},{x:${W},duration:0.9,ease:"power2.inOut"},0.35);`,
    `    tl.fromTo("#hd-sweep",{x:0},{x:${W},duration:0.9,ease:"power2.inOut",immediateRender:false},${r3(S3 + 0.6)});`,
    // o selo pulsa quando o Caio fala "CNPJ"
    `    tl.fromTo("#hd-seali",{scale:1},{scale:1.1,duration:0.16,ease:"power2.out",yoyo:true,repeat:1},${r3(T.cnpj - 0.04)});`,
  ].join("\n");
  addScene(id, 0, D, css, body, js, { track: 5, z: 5 });
}

// ═════════════ p1 · rede: Einstein, Sírio, Fleury ═════════════
{
  const id = "p1";
  const [st, et] = PANELS[id];
  const L = (t) => r3(t - st);
  const d = et - st;
  const tE = T.einstein - 0.1, tS = T.sirio - 0.1, tF = T.laboratorios - 0.1; // Fleury entra no "laboratórios"
  const vE = Math.min(2.6 / 0.85, d - L(tE)), vS = Math.min(2.43, d - L(tS)); // Einstein a 0,85× para cobrir o trecho todo
  const css = `
#p1-lab{top:452px;}
.p1-c{position:absolute;top:506px;width:296px;height:330px;border-radius:26px;overflow:hidden;border:5px solid #fff;background:#0b1428;box-shadow:0 22px 50px rgba(0,0,0,.5);}
.p1-c video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;}
.p1-c .nm{position:absolute;left:0;right:0;bottom:16px;display:flex;justify-content:center;}
.p1-c .nm span{padding:7px 16px;border-radius:22px;background:#fff;color:${INK};font-family:"Saira Semi Condensed",Arial,sans-serif;font-weight:800;font-size:27px;text-transform:uppercase;white-space:nowrap;box-shadow:0 8px 18px rgba(0,0,0,.35);}
#p1-cF{background:#fff;display:flex;align-items:center;justify-content:center;}
#p1-cF img{width:270px;margin-top:-34px;}
#p1-cF .nm span{background:${INK};color:#fff;}
#p1-lg{top:888px;}`;
  const body = `
    <div id="p1-lab" class="lab">Uma rede de qualidade, como:</div>
    <div class="p1-c" id="p1-cE" style="left:72px" data-layout-allow-overflow><video id="p1-vE" class="clip" data-start="${L(tE)}" data-duration="${r3(vE)}" data-track-index="0" data-playback-rate="0.85" muted playsinline src="assets/video/f_einstein.mp4"></video><div class="nm"><span>Einstein</span></div></div>
    <div class="p1-c" id="p1-cS" style="left:392px" data-layout-allow-overflow><video id="p1-vS" class="clip" data-start="${L(tS)}" data-duration="${r3(vS)}" data-track-index="1" muted playsinline src="assets/video/f_sirio_torre.mp4"></video><div class="nm"><span>Sírio-Libanês</span></div></div>
    <div class="p1-c" id="p1-cF" style="left:712px"><img src="assets/logos/fleury.png" alt="Fleury"><div class="nm"><span>Laboratórios</span></div></div>
    <div id="p1-lg" class="legal">${OBS.rede} ${OBS.disp} ${OBS.img}</div>`;
  const card = (sel, t) => `    tl.fromTo("${sel}",{opacity:0,y:80,rotationY:-70,scale:0.85,transformPerspective:900},{opacity:1,y:0,rotationY:0,scale:1,duration:0.5,ease:"back.out(1.5)"},${L(t)});`;
  const js = [
    fadeUp("#p1-lab", 0.3),
    card("#p1-cE", tE), card("#p1-cS", tS), card("#p1-cF", tF),
    `    tl.fromTo("#p1-lg",{opacity:0},{opacity:1,duration:0.3},0.35);`,
    outUp("#p1-lab,#p1-cE,#p1-cS,#p1-cF,#p1-lg", r3(d - 0.26)),
  ].join("\n");
  addScene(id, st, d, css, body, js);
}

// ═════════════ p2 · operadoras ═════════════
{
  const id = "p2";
  const [st, et] = PANELS[id];
  const L = (t) => r3(t - st);
  const d = et - st;
  const svg = (f) => readFileSync(join(ROOT, "assets/logos", f), "utf8").replace(/<title>.*?<\/title>/, "").replace("<svg ", '<svg width="100%" ');
  const OPS = [
    { k: "amil", bg: "#2B3FE0", inner: `<div class="lsv" style="width:170px;color:#fff">${svg("amil.svg")}</div>` },
    { k: "brad", bg: "#CC092F", inner: `<div class="lsv" style="width:200px;color:#fff">${svg("bradesco.svg")}</div>` },
    { k: "sula", bg: "#0B2354", inner: `<img src="assets/logos/sulamerica-branco.png" style="width:206px" alt="">` },
    { k: "porto", bg: "#FFFFFF", inner: `<img src="assets/logos/porto.svg" style="width:190px" alt="">` },
    { k: "omint", bg: "#FFFFFF", inner: `<img src="assets/logos/omint.png" style="width:196px" alt="">` },
    { k: "alice", bg: "#B5007E", inner: `<img src="assets/logos/alice.png" style="height:104px;border-radius:18px" alt="">` },
  ];
  const t0 = T.todas - 0.08, t1 = T.cobertura - 0.2;
  const css = `
#p2-t1{top:452px;font-size:54px;}
#p2-t2{top:510px;font-size:54px;color:${AMB};}
.p2-l{position:absolute;width:290px;height:128px;border-radius:24px;display:flex;align-items:center;justify-content:center;overflow:hidden;border:4px solid rgba(255,255,255,.9);box-shadow:0 16px 36px rgba(0,0,0,.45);}
.p2-l .lsv svg{display:block;}
#p2-lg{top:888px;}`;
  const body = `
    <div id="p2-t1" class="pt">Trabalhamos com as principais</div>
    <div id="p2-t2" class="pt">seguradoras e operadoras</div>
    ${OPS.map((o, i) => `<div class="p2-l" id="p2-l${i}" style="left:${83 + (i % 3) * 312}px;top:${600 + Math.floor(i / 3) * 150}px;background:${o.bg}">${o.inner}</div>`).join("\n    ")}
    <div id="p2-lg" class="legal">${OBS.rede} ${OBS.eleg}</div>`;
  const js = [
    fadeUp("#p2-t1", L(T.trabalhamos - 0.2)), fadeUp("#p2-t2", L(T.trabalhamos + 0.05)),
    ...OPS.map((_, i) => popIn(`#p2-l${i}`, L(t0 + ((t1 - t0) * i) / 5), { s: 0.4, d: 0.38 })),
    // brilho em onda quando ele fala "cobertura nessa rede"
    ...OPS.map((_, i) => `    tl.to("#p2-l${i}",{scale:1.07,duration:0.16,ease:"power2.out",yoyo:true,repeat:1},${L(T.cobertura + 0.25 + i * 0.07)});`),
    `    tl.fromTo("#p2-lg",{opacity:0},{opacity:1,duration:0.3},0.3);`,
    outUp("#p2-t1,#p2-t2,.p2-l,#p2-lg", r3(d - 0.26)),
  ].join("\n");
  addScene(id, st, d, css, body, js);
  PANELS.p2.logoTimes = OPS.map((_, i) => t0 + ((t1 - t0) * i) / 5);
}

// ═════════════ p3 · já tem plano? revisão do contrato ═════════════
{
  const id = "p3";
  const [st, et] = PANELS[id];
  const L = (t) => r3(t - st);
  const d = et - st;
  const css = `
#p3-t{top:452px;font-size:66px;}
.p3-r{position:absolute;left:84px;width:912px;border-radius:26px;display:flex;align-items:center;gap:26px;padding:0 30px;box-shadow:0 18px 40px rgba(0,0,0,.4);}
#p3-r1{top:566px;height:128px;background:#fff;color:${INK};}
#p3-r1 .ci{width:80px;height:80px;border-radius:50%;background:${INK};display:flex;align-items:center;justify-content:center;flex:none;}
#p3-r1 b{font-family:"Poppins",Arial,sans-serif;font-weight:600;font-size:38px;flex:1;}
#p3-ok{width:74px;height:74px;border-radius:50%;background:${GREEN};display:flex;align-items:center;justify-content:center;flex:none;}
#p3-r2{top:722px;height:150px;background:${NAVY2};border:3px solid rgba(255,194,61,.7);}
#p3-doc{position:relative;width:96px;height:118px;border-radius:12px;background:#fff;flex:none;overflow:hidden;}
#p3-doc i{position:absolute;left:16px;height:8px;border-radius:4px;background:#c9d3e6;}
#p3-scan{position:absolute;left:0;right:0;top:0;height:6px;background:${AMB};box-shadow:0 0 14px 4px rgba(255,194,61,.8);}
#p3-mag{position:absolute;left:58px;top:40px;width:56px;height:56px;color:${INK};}
#p3-r2 b{font-family:"Saira Semi Condensed",Arial,sans-serif;font-weight:800;font-size:50px;text-transform:uppercase;line-height:1;}
#p3-r2 b em{font-style:normal;color:${AMB};}
#p3-lg{top:900px;}`;
  const body = `
    <div id="p3-t" class="pt">Já tem plano de saúde?</div>
    <div id="p3-r1" class="p3-r"><span class="ci">${icon("cal", 46, AMB)}</span><b>Ativo há mais de 1 ano</b><span id="p3-ok">${icon("check", 46, "#fff")}</span></div>
    <div id="p3-r2" class="p3-r" data-layout-allow-overflow><div id="p3-doc"><i style="top:22px;width:62px"></i><i style="top:42px;width:50px"></i><i style="top:62px;width:62px"></i><i style="top:82px;width:40px"></i><span id="p3-scan"></span><span id="p3-mag" class="ic">${ICON.search}</span></div><b>Revisamos o seu <em>contrato</em></b></div>
    <div id="p3-lg" class="legal">${OBS.eleg} ${OBS.analise}</div>`;
  const tr = L(T.revisamos - 0.12);
  const js = [
    fadeUp("#p3-t", L(T.caso - 0.05), { y: 30 }),
    `    tl.fromTo("#p3-r1",{opacity:0,x:-120},{opacity:1,x:0,duration:0.42,ease:"power3.out"},${L(T.plano - 0.15)});`,
    popIn("#p3-ok", L(T.ano - 0.06), { s: 0.2, d: 0.36 }),
    `    tl.fromTo("#p3-r2",{opacity:0,x:120},{opacity:1,x:0,duration:0.42,ease:"power3.out"},${tr});`,
    `    tl.fromTo("#p3-scan",{y:0},{y:112,duration:0.55,ease:"sine.inOut",yoyo:true,repeat:2},${r3(tr + 0.3)});`,
    `    tl.fromTo("#p3-mag",{x:-40,y:-20},{x:-10,y:10,duration:0.55,ease:"sine.inOut",yoyo:true,repeat:2},${r3(tr + 0.3)});`,
    `    tl.fromTo("#p3-lg",{opacity:0},{opacity:1,duration:0.3},0.3);`,
    outUp("#p3-t,#p3-r1,#p3-r2,#p3-lg", r3(d - 0.26)),
  ].join("\n");
  addScene(id, st, d, css, body, js);
}

// ═════════════ p4 · redução de 10% a 50% ═════════════
{
  const id = "p4";
  const [st, et] = PANELS[id];
  const L = (t) => r3(t - st);
  const d = et - st;
  const css = `
#p4-lab{top:452px;}
#p4-t{top:494px;font-size:62px;}
#p4-num{position:absolute;left:40px;width:560px;top:566px;text-align:center;font-family:"Montserrat",Arial,sans-serif;font-weight:900;font-size:206px;line-height:1;color:${AMB};text-shadow:0 0 40px rgba(255,194,61,.45);}
#p4-sub{position:absolute;left:40px;width:560px;top:790px;text-align:center;font-family:"Saira Semi Condensed",Arial,sans-serif;font-weight:800;font-size:48px;text-transform:uppercase;line-height:1;}
#p4-ch{position:absolute;left:640px;top:584px;width:380px;height:280px;}
.p4-b{position:absolute;bottom:40px;width:120px;border-radius:16px 16px 6px 6px;transform-origin:50% 100%;}
#p4-bA{left:20px;height:230px;background:linear-gradient(180deg,#8fa3c7,#5b6f96);}
#p4-bB{left:190px;height:230px;background:linear-gradient(180deg,#ffd36e,${AMB});box-shadow:0 0 30px rgba(255,194,61,.5);}
.p4-x{position:absolute;bottom:0;width:120px;text-align:center;font-family:"Poppins",Arial,sans-serif;font-weight:600;font-size:24px;color:rgba(255,255,255,.9);}
#p4-arrow{position:absolute;left:218px;top:10px;width:64px;height:64px;color:${AMB};}
#p4-lg{top:888px;}`;
  const body = `
    <div id="p4-lab" class="lab">Muitas vezes conseguimos</div>
    <div id="p4-t" class="pt">reduções de</div>
    <div id="p4-num"><span id="p4-v">10</span>%</div>
    <div id="p4-sub">de desconto*</div>
    <div id="p4-ch" data-layout-allow-overflow>
      <div class="p4-b" id="p4-bA"></div><div class="p4-b" id="p4-bB"></div>
      <div class="p4-x" style="left:20px">antes</div><div class="p4-x" style="left:190px">depois</div>
      <span id="p4-arrow" class="ic">${ICON.down}</span>
    </div>
    <div id="p4-lg" class="legal">${NOTA_REDUCAO} ${OBS.ref} ${OBS.perfil}</div>`;
  const tc = L(T.n50 - 0.28);
  const js = [
    fadeUp("#p4-lab", L(T.muitas - 0.05), { y: 24 }),
    fadeUp("#p4-t", L(T.reducoes - 0.08), { y: 30 }),
    `    tl.fromTo("#p4-ch",{opacity:0,x:80},{opacity:1,x:0,duration:0.45,ease:"power3.out"},${L(T.reducoes + 0.2)});`,
    popIn("#p4-num", L(T.n10 - 0.06), { s: 0.5 }),
    // contagem 10 → 50 até o "50%"
    `    const cnt={v:10};`,
    `    tl.fromTo(cnt,{v:10},{v:50,duration:0.34,ease:"power1.in",onUpdate:()=>{document.getElementById("p4-v").textContent=Math.round(cnt.v);}},${tc});`,
    `    tl.fromTo("#p4-num",{scale:1},{scale:1.18,duration:0.12,ease:"power2.out",yoyo:true,repeat:1,immediateRender:false},${r3(tc + 0.34)});`,
    `    tl.fromTo("#p4-bB",{scaleY:1},{scaleY:0.5,duration:0.5,ease:"power3.inOut"},${r3(tc)});`,
    `    tl.fromTo("#p4-arrow",{opacity:0,y:-20},{opacity:1,y:55,duration:0.5,ease:"power2.out"},${r3(tc + 0.1)});`,
    fadeUp("#p4-sub", L(T.desconto - 0.08), { y: 24 }),
    `    tl.fromTo("#p4-lg",{opacity:0},{opacity:1,duration:0.3},0.3);`,
    outUp("#p4-lab,#p4-t,#p4-num,#p4-sub,#p4-ch,#p4-lg", r3(d - 0.26)),
  ].join("\n");
  addScene(id, st, d, css, body, js);
}

// ═════════════ p5 · sem perder ═════════════
{
  const id = "p5";
  const [st, et] = PANELS[id];
  const L = (t) => r3(t - st);
  const d = et - st;
  const css = `
#p5-t{top:452px;font-size:78px;color:${AMB};}
.p5-c{position:absolute;left:84px;width:912px;height:128px;border-radius:26px;background:#fff;color:${INK};display:flex;align-items:center;gap:24px;padding:0 30px;box-shadow:0 18px 40px rgba(0,0,0,.4);}
.p5-c .ok{width:78px;height:78px;border-radius:50%;background:${GREEN};display:flex;align-items:center;justify-content:center;flex:none;}
.p5-c b{font-family:"Saira Semi Condensed",Arial,sans-serif;font-weight:800;font-size:48px;text-transform:uppercase;line-height:1;}
#p5-c1{top:580px;}
#p5-c2{top:730px;}
#p5-lg{top:888px;}`;
  const body = `
    <div id="p5-t" class="pt">Sem perder</div>
    <div class="p5-c" id="p5-c1"><span class="ok" id="p5-k1">${icon("check", 48, "#fff")}</span><b>os seus benefícios</b></div>
    <div class="p5-c" id="p5-c2"><span class="ok" id="p5-k2">${icon("check", 48, "#fff")}</span><b>a sua rede de preferência</b></div>
    <div id="p5-lg" class="legal">${OBS.cob} ${OBS.rede}</div>`;
  const js = [
    popIn("#p5-t", L(T.sem - 0.02), { s: 0.7, d: 0.36 }),
    `    tl.fromTo("#p5-c1",{opacity:0,y:50},{opacity:1,y:0,duration:0.4,ease:"power3.out"},${L(T.beneficios - 0.2)});`,
    popIn("#p5-k1", L(T.beneficios + 0.02), { s: 0.2, d: 0.34 }),
    `    tl.fromTo("#p5-c2",{opacity:0,y:50},{opacity:1,y:0,duration:0.4,ease:"power3.out"},${L(T.rede2 - 0.2)});`,
    popIn("#p5-k2", L(T.rede2 + 0.02), { s: 0.2, d: 0.34 }),
    `    tl.fromTo("#p5-lg",{opacity:0},{opacity:1,duration:0.3},0.3);`,
    outUp("#p5-t,.p5-c,#p5-lg", r3(d - 0.26)),
  ].join("\n");
  addScene(id, st, d, css, body, js);
}

// ═════════════ p6 · CNPJ ═════════════
{
  const id = "p6";
  const [st, et] = PANELS[id];
  const L = (t) => r3(t - st);
  const d = et - st;
  const css = `
#p6-lab{top:452px;}
#p6-t{top:498px;font-size:58px;}
#p6-st{position:absolute;left:0;width:${W}px;top:574px;display:flex;justify-content:center;}
#p6-sti{padding:4px 56px 14px;border:9px solid ${AMB};border-radius:28px;font-family:"Saira Semi Condensed",Arial,sans-serif;font-weight:800;font-size:200px;line-height:1;color:#fff;text-shadow:0 10px 30px rgba(0,0,0,.4);box-shadow:0 0 50px rgba(255,194,61,.35),inset 0 0 30px rgba(255,194,61,.2);}
#p6-sub{position:absolute;left:0;width:${W}px;top:818px;text-align:center;font-family:"Poppins",Arial,sans-serif;font-weight:600;font-size:34px;color:rgba(255,255,255,.92);}
#p6-lg{top:888px;}`;
  const body = `
    <div id="p6-lab" class="lab">Lembrando:</div>
    <div id="p6-t" class="pt">é necessário ter</div>
    <div id="p6-st"><div id="p6-sti">CNPJ</div></div>
    <div id="p6-sub">para ter acesso aos benefícios</div>
    <div id="p6-lg" class="legal">${OBS.eleg} ${OBS.analise}</div>`;
  const js = [
    fadeUp("#p6-lab", L(T.lembrando), { y: 24 }),
    fadeUp("#p6-t", L(T.necessario - 0.12), { y: 30 }),
    `    tl.fromTo("#p6-sti",{opacity:0,scale:2.6,rotation:-16},{opacity:1,scale:1,rotation:-4,duration:0.2,ease:"power4.in"},${L(T.cnpj - 0.16)});`,
    `    tl.fromTo("#p6-st",{x:0,y:0},{keyframes:[{x:-12,y:6,duration:0.04},{x:10,y:-5,duration:0.04},{x:-6,y:3,duration:0.04},{x:0,y:0,duration:0.05}]},${L(T.cnpj + 0.04)});`,
    fadeUp("#p6-sub", L(T.para - 0.1), { y: 24 }),
    `    tl.fromTo("#p6-lg",{opacity:0},{opacity:1,duration:0.3},0.3);`,
    outUp("#p6-lab,#p6-t,#p6-st,#p6-sub,#p6-lg", r3(S2 - st - 0.05), 0.22),
  ].join("\n");
  addScene(id, st, d, css, body, js);
}

// ═════════════ p7 · CTA ═════════════
{
  const id = "p7";
  const [st, et] = PANELS[id];
  const L = (t) => r3(t - st);
  const d = et - st;
  const css = `
#p7-t{top:452px;font-size:62px;}
.p7-ch{position:absolute;top:452px;width:60px;height:60px;color:${AMB};}
#p7-bt{position:absolute;left:100px;width:880px;top:542px;height:156px;border-radius:40px;background:linear-gradient(180deg,#ffd36e,${AMB});color:${INK};display:flex;align-items:center;gap:26px;padding:0 40px;box-shadow:0 20px 44px rgba(0,0,0,.45),0 0 0 6px rgba(255,194,61,.25);}
#p7-bt .ci{width:92px;height:92px;border-radius:50%;background:${INK};display:flex;align-items:center;justify-content:center;flex:none;}
#p7-bt b{display:block;font-family:"Montserrat",Arial,sans-serif;font-weight:900;font-size:50px;line-height:1.02;}
#p7-bt i{display:block;font-style:normal;font-family:"Poppins",Arial,sans-serif;font-weight:600;font-size:30px;opacity:.85;margin-top:6px;}
#p7-rip{position:absolute;left:452px;top:582px;width:80px;height:80px;border-radius:50%;border:5px solid #fff;opacity:0;}
#p7-req{position:absolute;left:0;width:${W}px;top:726px;display:flex;justify-content:center;}
#p7-req>div{display:flex;align-items:center;gap:12px;padding:8px 26px 8px 10px;border-radius:40px;background:#fff;color:${INK};font-family:"Poppins",Arial,sans-serif;font-weight:600;font-size:28px;white-space:nowrap;}
#p7-req .ok{width:44px;height:44px;border-radius:50%;background:${GREEN};display:flex;align-items:center;justify-content:center;}
#p7-lg{top:790px;font-size:19px;line-height:1.3;}`;
  const body = `
    <span id="p7-a1" class="p7-ch ic" style="left:60px">${ICON.down}</span><span id="p7-a2" class="p7-ch ic" style="left:960px">${ICON.down}</span>
    <div id="p7-t" class="pt">Clique no link abaixo</div>
    <div id="p7-bt"><span class="ci">${icon("form", 54, AMB)}</span><div><b>SOLICITE SUA COTAÇÃO</b><i>Preencha o formulário</i></div></div>
    <span id="p7-rip"></span>
    <div id="p7-req"><div><span class="ok">${icon("check", 28, "#fff")}</span>Exclusivo para CNPJ/MEI · a partir de 3 vidas</div></div>
    <div id="p7-lg" class="legal">${LEGAL_FIM}</div>`;
  const js = [
    fadeUp("#p7-t", L(T.clique - 0.08), { y: 30 }),
    `    tl.fromTo("#p7-a1,#p7-a2",{opacity:0,y:-18},{opacity:1,y:10,duration:0.45,ease:"sine.inOut",yoyo:true,repeat:9},${L(T.clique)});`,
    popIn("#p7-bt", L(T.clique + 0.4), { s: 0.7, d: 0.45 }),
    `    tl.fromTo("#p7-bt",{scale:1},{scale:0.95,duration:0.1,ease:"power2.out",yoyo:true,repeat:1,immediateRender:false},${L(T.formulario - 0.05)});`,
    `    tl.fromTo("#p7-rip",{opacity:0.9,scale:0.4},{opacity:0,scale:4,duration:0.6,ease:"power2.out"},${L(T.formulario - 0.02)});`,
    fadeUp("#p7-req", L(T.nossa - 0.1), { y: 24 }),
    `    tl.fromTo("#p7-lg",{opacity:0},{opacity:1,duration:0.4},0.5);`,
    `    tl.fromTo("#p7-bt",{scale:1},{scale:1.04,duration:0.5,ease:"sine.inOut",yoyo:true,repeat:1,immediateRender:false},${L(T.fim + 0.2)});`,
  ].join("\n");
  addScene(id, st, d, css, body, js);
}

// ═════════════ lf · texto legal nas partes em tela cheia ═════════════
{
  const id = "lf";
  const a0 = 0.3, a1 = S1 + 0.1, b0 = S2 + 0.3, b1 = S3 + 0.05;
  const css = `
.lf{position:absolute;left:0;width:${W}px;top:1340px;display:flex;justify-content:center;}
.lf>div{max-width:900px;padding:8px 20px;border-radius:14px;background:rgba(6,14,32,.78);text-align:center;font-family:"Poppins",Arial,sans-serif;font-weight:500;font-size:19px;line-height:1.32;color:#fff;}`;
  const body = `
    <div class="lf clip" id="lf-a" data-start="${r3(a0)}" data-duration="${r3(a1 - a0)}" data-track-index="0"><div id="lf-ai">${OBS.rede} ${OBS.disp}</div></div>
    <div class="lf clip" id="lf-b" data-start="${r3(b0)}" data-duration="${r3(b1 - b0)}" data-track-index="0"><div id="lf-bi">${OBS.eleg} ${OBS.analise}</div></div>`;
  const js = [
    `    tl.fromTo("#lf-ai",{opacity:0},{opacity:1,duration:0.3},${r3(a0)});`,
    `    tl.to("#lf-ai",{opacity:0,duration:0.2},${r3(a1 - 0.22)});`,
    `    tl.fromTo("#lf-bi",{opacity:0},{opacity:1,duration:0.3},${r3(b0)});`,
    `    tl.to("#lf-bi",{opacity:0,duration:0.2},${r3(b1 - 0.22)});`,
  ].join("\n");
  addScene(id, 0, D, css, body, js, { track: 7, z: 6 });
}

// ═════════════ cap · legendas palavra a palavra ═════════════
{
  const id = "cap";
  const EMPH = new Set(["melhores", "hospitais", "sao", "paulo", "einstein", "sirio", "fleury", "10%", "50%", "cnpj", "simulacao", "link", "formulario"]);
  const BOUNDS = [S1 + 0.25, S2 + 0.25, S3 + 0.25];
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
  let html = "", js = [];
  groups.forEach((g, gi) => {
    const s = r3(Math.max(0.12, g[0].start - 0.06));
    const nextStart = groups[gi + 1] ? groups[gi + 1][0].start - 0.06 : D;
    const e = r3(Math.min(nextStart, g[g.length - 1].end + 0.35, D));
    const top = split(g[0].start) ? 966 + OFF : 1222;
    const chars = g.map(disp).join(" ").length;
    const fs = Math.max(46, Math.min(70, Math.floor(900 / (chars * 0.74))));
    html += `    <div class="cg clip" id="cg${gi}" data-start="${s}" data-duration="${r3(e - s)}" data-track-index="0" style="top:${top}px"><div class="gi" id="cg${gi}i" style="font-size:${fs}px">${g
      .map((w) => `<span class="w${EMPH.has(norm(w.word)) ? " em" : ""}" id="cw${w.i}">${disp(w)}</span>`)
      .join(" ")}</div></div>\n`;
    js.push(`    tl.fromTo("#cg${gi}i",{opacity:0,y:22,scale:0.9},{opacity:1,y:0,scale:1,duration:0.14,ease:"power3.out"},${s});`);
    g.forEach((w) => {
      js.push(`    tl.fromTo("#cw${w.i}",{scale:1},{scale:${EMPH.has(norm(w.word)) ? 1.14 : 1.06},duration:0.1,ease:"power2.out",yoyo:true,repeat:1},${r3(w.start)});`);
      if (!EMPH.has(norm(w.word))) {
        js.push(`    tl.set("#cw${w.i}",{color:"${AMB}"},${r3(w.start)});`);
        js.push(`    tl.set("#cw${w.i}",{color:"#ffffff"},${r3(Math.min(w.end, e - 0.01))});`);
      }
    });
    js.push(`    tl.to("#cg${gi}i",{opacity:0,duration:0.1,ease:"power2.in"},${r3(e - 0.1)});`);
  });
  const css = `
.cg{position:absolute;left:0;width:${W}px;text-align:center;}
.gi{display:inline-block;max-width:960px;padding:10px 26px 14px;border-radius:22px;background:rgba(7,18,40,.9);box-shadow:0 12px 30px rgba(0,0,0,.35);font-family:"Montserrat",Arial,sans-serif;font-weight:900;line-height:1.08;color:#fff;letter-spacing:.005em;}
.gi .w{display:inline-block;}
.gi .em{color:${AMB};}`;
  addScene(id, 0, D, css, html, js.join("\n"), { track: 6, kind: "captions", z: 7 });
}

// ═════════════ raiz: vídeo, painel, cenas e áudio ═════════════
const sfx = [];
const hitOf = (k) => (HITS[k.replace(/2$/, "")] || { hit: 0 }).hit;
const durOf = (k) => (HITS[k.replace(/2$/, "")] || { dur: 1 }).dur;
const S = (k, t, vol = 0.5, dur) => sfx.push({ k, t: r3(t + 1 / 30 - hitOf(k)), vol, dur: dur || durOf(k) });
S("pop2", T.sao, 0.42);
S("whoosh", S1 + 0.25, 0.4);
S("pop", T.einstein + 0.05, 0.45); S("pop2", T.sirio + 0.05, 0.45); S("pop", T.laboratorios + 0.05, 0.45);
S("whoosh2", PANELS.p2[0], 0.3);
PANELS.p2.logoTimes.forEach((t, i) => S(i % 2 ? "pop2" : "pop", t + 0.12, 0.3));
S("whoosh", PANELS.p3[0], 0.3);
S("check", T.ano, 0.45);
S("shimmer", T.revisamos, 0.35);
S("whoosh2", PANELS.p4[0], 0.3);
S("pop", T.n10, 0.45);
S("riser", T.n50 + 0.06, 0.4);
S("impact", T.n50 + 0.06, 0.55);
S("whoosh", PANELS.p5[0], 0.3);
S("check", T.beneficios + 0.02, 0.45); S("check", T.rede2 + 0.02, 0.45);
S("whoosh2", PANELS.p6[0], 0.3);
S("stamp", T.cnpj - 0.02, 0.6);
S("whoosh", S2 + 0.2, 0.4);
S("pop2", T.simulacao, 0.4);
S("whoosh2", S3 + 0.25, 0.4);
S("pop", T.clique + 0.55, 0.4);
S("tap", T.formulario - 0.02, 0.55);
sfx.sort((a, b) => a.t - b.t);
// trilha de efeitos: a segunda faixa só onde dois se sobrepõem
const laneEnd = [0, 0];
sfx.forEach((s) => { const l = laneEnd[0] <= s.t ? 0 : 1; s.lane = 12 + l; laneEnd[l] = s.t + s.dur; });

// timeline da raiz: modos e punch-ins do vídeo, painel
const R = [];
R.push(`      tl.set("#pbg",{y:-1260},0);`);
R.push(`      tl.set("#vw",{y:0,scale:1,transformOrigin:"50% 44%"},0);`);
// gancho: aproximação lenta e dois punch-ins
R.push(`      tl.fromTo("#vw",{scale:1},{scale:1.035,duration:${r3(T.melhores - 0.05)},ease:"none"},0);`);
R.push(`      tl.to("#vw",{scale:1.07,duration:0.18,ease:"power3.out"},${r3(T.melhores - 0.05)});`);
R.push(`      tl.to("#vw",{scale:1.1,duration:0.18,ease:"power3.out"},${r3(T.sao - 0.05)});`);
// painel desce
const toSplit = (t) => [
  `      tl.to("#vw",{y:${SPLIT_Y},scale:1,duration:${MOVE},ease:"power3.inOut"},${t});`,
  `      tl.to("#pbg",{y:0,duration:${MOVE},ease:"power3.inOut"},${t});`,
];
R.push(...toSplit(S1));
R.push(`      tl.to("#vw",{scale:1.05,duration:${r3(S2 - S1 - MOVE)},ease:"none"},${r3(S1 + MOVE)});`);
// painel sobe: pergunta da simulação em tela cheia
R.push(`      tl.to("#vw",{y:0,scale:1.04,duration:${MOVE},ease:"power3.inOut"},${S2});`);
R.push(`      tl.to("#pbg",{y:-1260,duration:${MOVE},ease:"power3.inOut"},${S2});`);
R.push(`      tl.to("#vw",{scale:1.1,duration:0.18,ease:"power3.out"},${r3(T.simulacao - 0.05)});`);
R.push(...toSplit(S3));
R.push(`      tl.to("#vw",{scale:1.04,duration:${r3(D - S3 - MOVE)},ease:"none"},${r3(S3 + MOVE)});`);

const hosts = scenes.map((s) => `      <div id="${s.id}" data-composition-id="${s.id}" data-composition-src="compositions/${s.id}.html" data-start="${s.st}" data-duration="${s.dur}" data-track-index="${s.track}" data-track-kind="${s.kind}" data-width="${W}" data-height="${H}" style="position:absolute;inset:0;z-index:${s.z}"></div>`).join("\n");
const audio = [
  `      <audio id="a-voice" class="clip" data-start="0" data-duration="${D}" data-track-index="10" data-volume="1" src="assets/audio/voice.wav"></audio>`,
  `      <audio id="a-bgm" class="clip" data-start="0" data-duration="${D}" data-track-index="11" data-volume="1" src="assets/audio/bgm_duck.wav"></audio>`,
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
      html, body { width: ${W}px; height: ${H}px; overflow: hidden; background: ${NAVY}; }
      #root { position: relative; width: ${W}px; height: ${H}px; overflow: hidden; background: ${NAVY}; }
      #vw { position: absolute; left: 0; top: 0; width: ${W}px; height: ${H}px; z-index: 1; }
      #v-caio { position: absolute; left: 0; top: 0; width: ${W}px; height: ${H}px; object-fit: cover; }
      #pbg { position: absolute; left: 0; top: 0; width: ${W}px; height: ${1120 + OFF}px; z-index: 2; border-radius: 0 0 56px 56px; overflow: hidden;
        background: radial-gradient(120% 70% at 50% 30%, #17366b 0%, ${NAVY} 62%, #071229 100%); box-shadow: 0 30px 70px rgba(0,0,0,.55); }
      #pbg-grid { position: absolute; inset: 0; opacity: .5;
        background-image: linear-gradient(rgba(58,208,255,.07) 2px, transparent 2px), linear-gradient(90deg, rgba(58,208,255,.07) 2px, transparent 2px);
        background-size: 60px 60px; }
      #pbg-line { position: absolute; left: 0; right: 0; bottom: 0; height: 6px; background: linear-gradient(90deg, rgba(255,194,61,0), ${AMB}, rgba(255,194,61,0)); }
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="${D}" data-width="${W}" data-height="${H}">
      <div id="vw">
        <video id="v-caio" class="clip" data-start="0" data-duration="${D}" data-track-index="0" muted playsinline src="assets/video/caio.mp4"></video>
      </div>
      <div id="pbg"><div id="pbg-grid"></div><div id="pbg-line"></div></div>
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
writeFileSync(join(ROOT, "tools", "timing.json"), JSON.stringify({ T, S1, S2, S3, PANELS, sfx }, null, 1));
console.log(`index.html ${W}x${H} ${D}s · ${scenes.length} cenas · ${sfx.length} efeitos · modos ${S1}/${S2}/${S3}`);
