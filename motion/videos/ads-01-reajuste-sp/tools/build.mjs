// Gera index.html e compositions/*.html do anúncio "Ads 01 · reajuste" (talking head 9:16, 48,4 s).
//
// Mesmo formato dos vídeos da Bradesco e do Caio, numa paleta própria (azul-marinho + verde-água), porque o
// anúncio não é de uma operadora só:
// - o vídeo do apresentador (mudo; a voz tratada vai em <audio>) fica num invólucro (#vw) que o timeline da raiz
//   move: em tela cheia ele fica no lugar; com o painel de infográficos (#pbg) ele desce e o rosto fica inteiro na
//   metade de baixo;
// - cenas do painel (p1–p7), uma por trecho da fala, cada uma com a sua observação obrigatória;
// - cabeçalho fixo (hd): "PLANOS DE SAÚDE" + selo "EXCLUSIVO PARA CNPJ/MEI" + "a partir de 3 vidas · São Paulo";
// - legendas palavra a palavra (cap) e o texto legal das partes em tela cheia (lf);
// - cartão final: o painel cresce até o pé da tela depois da última palavra;
// - trilha, voz e efeitos sonoros na raiz.
//
//   node tools/build.mjs
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const W = 1080, H = 1920, D = 49.4;
const WORDS = JSON.parse(readFileSync(join(ROOT, "tools/words.json"), "utf8"));
const HITS = JSON.parse(readFileSync(join(ROOT, "assets/audio/sfx_hits.json"), "utf8"));
const CUTS = JSON.parse(readFileSync(join(ROOT, "tools/timeline.json"), "utf8")).segments;
const r3 = (x) => Math.round(x * 1000) / 1000;
const norm = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9%]/g, "");
const find = (w, after = 0) => {
  const x = WORDS.find((o) => norm(o.word) === w && o.start >= after - 1e-3);
  if (!x) throw new Error(`palavra não encontrada: ${w} depois de ${after}`);
  return x;
};
const at = (w, after) => find(w, after).start;
const cut = (id) => CUTS.find((c) => c.id === id).out_in;

// ───────────── tempos (absolutos, presos à fala) ─────────────
const T = {};
T.subiu = at("subiu"); T.atencao = at("atencao"); T.proximos = at("proximos"); T.todo = at("todo");
T.reajuste = at("reajuste"); T.mensalidade = at("mensalidade"); T.pesa = at("pesa"); T.orcamento = at("orcamento");
T.mesma = at("mesma"); T.rede = at("rede"); T.pior = at("pior"); T.cnpj = at("cnpj"); T.da = at("da");
T.o = at("o", 14); T.empresarial = at("empresarial"); T.regras = at("regras"); T.precos = at("precos");
T.em = at("em", 17); T.rede2 = at("rede", T.em); T.hospitais = at("hospitais"); T.luiz = at("luiz");
T.camilo = at("camilo"); T.bp = at("bp"); T.dependendo = at("dependendo"); T.e2 = at("e", T.dependendo);
T.beneficios = at("beneficios"); T.vem = at("vem"); T.tele = at("telemedicina"); T.cobertura = at("cobertura");
T.varios = at("varios"); T.reembolso = at("reembolso"); T.nao = at("nao", 30); T.trocar = at("trocar");
T.parar = at("parar"); T.mais = at("mais", T.parar); T.nosso = at("nosso"); T.time = at("time");
T.compara = at("compara"); T.operadoras = at("operadoras"); T.voce = at("voce", T.operadoras);
T.sua = at("sua", T.voce); T.exclusivo = at("exclusivo"); T.cnpj2 = at("cnpj", T.exclusivo); T.clica = at("clica");
T.formulario = at("formulario");
T.fim = WORDS[WORDS.length - 1].end;

// cortes no vídeo cortado (tools/timeline.json)
const C = { s2: cut("s2"), s3: cut("s3"), s4: cut("s4"), s5: cut("s5"), s6: cut("s6"), s7: cut("s7"), s8: cut("s8"), s9: cut("s9") };
const TAKE_WIDE = r3(C.s4 + (17.5 - 16.3));   // dentro de s4 o vídeo troca do plano de selfie para o plano aberto
const TAKE_C = r3(C.s6 + (36.633 - 30.2));    // dentro de s6 entra uma nova tomada do plano aberto

// modos: tela cheia ↔ painel de infográficos (a troca cobre os cortes de tomada)
const MOVE = 0.5;
const S1 = r3(C.s2 - 0.25);        // painel desce no "Todo ano chega o reajuste"
const S2 = r3(C.s3 - 0.25);        // painel sobe no "Se você tem CNPJ"
const S3 = r3(TAKE_WIDE - 0.25);   // painel desce no "O plano empresarial"
const S4 = r3(TAKE_C - 0.25);      // painel sobe na frase-tese "Não é trocar por trocar"
const S5 = r3(C.s7 - 0.25);        // painel desce no "Nosso time de especialistas"
const ENDC = r3(T.fim + 0.12);     // cartão final: o painel cresce até o pé
const SPLIT_SELFIE = 470;          // plano de selfie: o rosto (y 580–1350) fica de 1050 a 1820, a testa sob o painel
const SPLIT_WIDE = 520;            // plano aberto: o rosto (y 700–1160) fica inteiro abaixo do painel
const OFF = 48;                    // conteúdo do painel abaixo do cabeçalho (cabeçalho a partir de 240 px)
const PANEL_H = 1120 + OFF;
const split = (t) => (t >= S1 + 0.25 && t < S2 + 0.25) || (t >= S3 + 0.25 && t < S4 + 0.25) || t >= S5 + 0.25;

const PANELS = {
  p1: [S1, r3(S2 + MOVE)],
  p2: [S3, r3(T.em - 0.12)],
  p3: [r3(T.em - 0.12), r3(T.e2 - 0.12)],
  p4: [r3(T.e2 - 0.12), r3(S4 + MOVE)],
  p5: [S5, r3(cut("s8") - 0.1)],
  p6: [r3(cut("s8") - 0.1), r3(T.clica - 0.12)],
  p7: [r3(T.clica - 0.12), D],
};

// ───────────── estilo ─────────────
const NAVY = "#0B1F3A", NAVY_D = "#071429", NAVY_DD = "#030A17", INK = "#0B1F3A";
const TEAL = "#14B8A6", TEAL_D = "#0F766E", MINT = "#99F6E4", ORANGE = "#FB923C", ORANGE_D = "#C2410C", GREEN = "#16A34A";
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
  "Planos de saúde empresariais para CNPJ/MEI, a partir de 3 vidas. Hospitais citados como exemplos de rede, conforme o plano.",
  OBS.eleg, OBS.analise, OBS.ref, OBS.faixa, OBS.rede, OBS.cob,
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
  pricedown: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7l6 6 4-4 8 8"/><path d="M15 17h6v-6"/></svg>`,
  brief: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 13h18"/></svg>`,
  rules: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 3.5V2h6v1.5M8.5 9.5l1.5 1.5 3-3M8.5 15.5l1.5 1.5 3-3M15 10h1.5M15 16h1.5"/></svg>`,
  tag: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.5 13.5l-7 7a1.5 1.5 0 0 1-2.1 0L3 12V3h9l8.5 8.4a1.5 1.5 0 0 1 0 2.1z"/><circle cx="7.5" cy="7.5" r="1.5"/></svg>`,
  team: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6"/><circle cx="17" cy="9" r="2.8"/><path d="M16 14.2c3 .2 5.5 2.3 5.5 5.3"/></svg>`,
  search: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5L21 21"/></svg>`,
  form: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="3" width="16" height="18" rx="2.5"/><path d="M8 8h8M8 12h8M8 16h5"/></svg>`,
  info: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 11v5.5M12 7.5h.01"/></svg>`,
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
.lab{position:absolute;left:0;width:${W}px;text-align:center;font-family:"Poppins",Arial,sans-serif;font-weight:600;font-size:30px;letter-spacing:.08em;text-transform:uppercase;color:${MINT};}
.legal{position:absolute;left:100px;width:${W - 200}px;text-align:center;font-family:"Poppins",Arial,sans-serif;font-weight:500;font-size:19px;line-height:1.32;color:rgba(255,255,255,.92);}
.wcard{background:#fff;color:${INK};border-radius:26px;box-shadow:0 18px 40px rgba(2,8,20,.4);}
.tdot{border-radius:50%;background:${TEAL_D};display:flex;align-items:center;justify-content:center;flex:none;}
.chip{display:flex;align-items:center;gap:12px;padding:8px 26px 8px 10px;border-radius:40px;background:rgba(3,10,23,.82);border:2px solid rgba(153,246,228,.75);font-family:"Poppins",Arial,sans-serif;font-weight:600;font-size:30px;white-space:nowrap;}
.chip .ci{width:48px;height:48px;border-radius:50%;background:${TEAL};display:flex;align-items:center;justify-content:center;flex:none;}
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

const scenes = [];
function addScene(id, st, dur, css, body, js, { track = 3, kind = "graphics", z = 3 } = {}) {
  writeFileSync(join(ROOT, "compositions", `${id}.html`), sceneFile(id, css, body, js));
  scenes.push({ id, st: r3(st), dur: r3(dur), track, kind, z });
}
const fadeUp = (sel, t, { y = 40, d = 0.4, ease = "power3.out" } = {}) =>
  `    tl.fromTo("${sel}",{opacity:0,y:${y}},{opacity:1,y:0,duration:${d},ease:"${ease}"},${r3(Math.max(0, t))});`;
const popIn = (sel, t, { s = 0.6, d = 0.42 } = {}) =>
  `    tl.fromTo("${sel}",{opacity:0,scale:${s}},{opacity:1,scale:1,duration:${d},ease:"back.out(1.9)"},${r3(Math.max(0, t))});`;
const outUp = (sel, t, d = 0.24) => `    tl.to("${sel}",{opacity:0,y:-36,duration:${d},ease:"power2.in"},${r3(t)});`;
const legalIn = (id, t = 0.3) => `    tl.fromTo("#${id}-lg",{opacity:0},{opacity:1,duration:0.3},${r3(t)});`;
const stampIn = (sel, t, from = 2.2) => [
  `    tl.fromTo("${sel}",{opacity:0,scale:${from}},{opacity:1,scale:1,duration:0.22,ease:"power4.in"},${r3(Math.max(0, t))});`,
  `    tl.fromTo("${sel}",{x:0},{keyframes:[{x:-10,duration:0.04},{x:8,duration:0.04},{x:-4,duration:0.04},{x:0,duration:0.05}],immediateRender:false},${r3(t + 0.22)});`,
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
    <div id="hd-sub"><div>a partir de 3 vidas · São Paulo</div></div>`;
  const js = [
    `    tl.fromTo("#hd-sweep",{x:0},{x:${W},duration:0.9,ease:"power2.inOut"},0.45);`,
    `    tl.fromTo("#hd-sweep",{x:0},{x:${W},duration:0.9,ease:"power2.inOut",immediateRender:false},${r3(ENDC + 0.3)});`,
    `    tl.fromTo("#hd-seali",{scale:1},{scale:1.12,duration:0.16,ease:"power2.out",yoyo:true,repeat:1,immediateRender:false},${r3(T.cnpj - 0.04)});`,
    `    tl.fromTo("#hd-seali",{scale:1},{scale:1.12,duration:0.16,ease:"power2.out",yoyo:true,repeat:1,immediateRender:false},${r3(T.cnpj2 - 0.04)});`,
  ].join("\n");
  addScene("hd", 0, D, css, body, js, { track: 5, z: 5 });
}

// ═════════════ p1 · a dor: "Todo ano chega o reajuste e a mensalidade pesa no orçamento, e você continua com a mesma rede ou pior." ═════════════
{
  const id = "p1";
  const [st, et] = PANELS[id];
  const L = (t) => r3(t - st);
  const d = et - st;
  const BARS = [62, 104, 150, 206];
  const css = `
#p1-lab{top:452px;display:flex;justify-content:center;align-items:center;gap:12px;}
#p1-t{position:absolute;left:0;width:${W}px;top:494px;text-align:center;font-family:"Saira Semi Condensed",Arial,sans-serif;font-weight:800;font-size:118px;line-height:1;text-transform:uppercase;color:${ORANGE};text-shadow:0 0 36px rgba(251,146,60,.35);}
#p1-ch{position:absolute;left:96px;top:640px;width:420px;height:230px;}
.p1-b{position:absolute;bottom:0;width:72px;border-radius:12px 12px 4px 4px;background:linear-gradient(180deg,${ORANGE},${ORANGE_D});transform-origin:50% 100%;}
#p1-base{position:absolute;left:0;bottom:-6px;width:420px;height:6px;border-radius:3px;background:rgba(255,255,255,.55);}
#p1-arr{position:absolute;left:298px;top:-6px;width:104px;height:104px;color:#fff;}
#p1-ml{position:absolute;left:0;top:-4px;font-family:"Poppins",Arial,sans-serif;font-weight:600;font-size:26px;color:${MINT};letter-spacing:.06em;text-transform:uppercase;}
.p1-c{position:absolute;left:556px;width:428px;height:106px;display:flex;align-items:center;gap:18px;padding:0 22px;}
.p1-c .cd{width:62px;height:62px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex:none;}
.p1-c b{font-family:"Saira Semi Condensed",Arial,sans-serif;font-weight:800;font-size:38px;line-height:1.02;text-transform:uppercase;color:${INK};}
.p1-c b i{font-style:normal;color:${ORANGE_D};}
#p1-lg{top:900px;}`;
  const body = `
    <div id="p1-lab" class="lab">${icon("cal", 34, MINT)}Todo ano chega o</div>
    <div id="p1-t">Reajuste</div>
    <div id="p1-ch"><span id="p1-ml">mensalidade</span>${BARS.map((h, i) => `<span class="p1-b" id="p1-b${i}" style="left:${i * 96 + 12}px;height:${h}px"></span>`).join("")}<span id="p1-base"></span><span id="p1-arr" class="ic">${ICON.priceup}</span></div>
    <div class="p1-c wcard" id="p1-c0" style="top:640px"><span class="cd" style="background:${ORANGE_D}">${icon("wallet", 36, "#fff")}</span><b>Pesa no<br><i>orçamento</i></b></div>
    <div class="p1-c wcard" id="p1-c1" style="top:764px"><span class="cd" id="p1-cd1" style="background:#64748B">${icon("hosp", 36, "#fff")}</span><b>A mesma rede…<br><i id="p1-pior">ou pior</i></b></div>
    <div id="p1-lg" class="legal">${OBS.ref} ${OBS.perfil}</div>`;
  const js = [
    fadeUp("#p1-lab", L(T.todo - 0.05), { y: 24 }),
    stampIn("#p1-t", L(T.reajuste - 0.12)),
    `    tl.fromTo("#p1-ch",{opacity:0},{opacity:1,duration:0.25},${L(T.mensalidade - 0.25)});`,
    ...BARS.map((_, i) => `    tl.fromTo("#p1-b${i}",{scaleY:0},{scaleY:1,duration:0.38,ease:"back.out(1.6)"},${L(T.mensalidade - 0.15 + i * 0.13)});`),
    `    tl.fromTo("#p1-arr",{opacity:0,x:-30,y:30},{opacity:1,x:0,y:0,duration:0.35,ease:"power3.out"},${L(T.mensalidade + 0.42)});`,
    `    tl.fromTo("#p1-c0",{opacity:0,x:120},{opacity:1,x:0,duration:0.38,ease:"power3.out"},${L(T.pesa - 0.2)});`,
    `    tl.fromTo("#p1-c0",{y:0},{keyframes:[{y:10,duration:0.08},{y:-4,duration:0.08},{y:0,duration:0.1}],immediateRender:false},${L(T.orcamento)});`,
    `    tl.fromTo("#p1-c1",{opacity:0,x:120},{opacity:1,x:0,duration:0.38,ease:"power3.out"},${L(T.mesma - 0.2)});`,
    `    tl.fromTo("#p1-pior",{opacity:0},{opacity:1,duration:0.12},${L(T.pior - 0.04)});`,
    `    tl.fromTo("#p1-cd1",{backgroundColor:"#64748B"},{backgroundColor:"#DC2626",duration:0.15},${L(T.pior - 0.04)});`,
    `    tl.fromTo("#p1-c1",{x:0},{keyframes:[{x:-10,duration:0.04},{x:8,duration:0.04},{x:-4,duration:0.04},{x:0,duration:0.05}],immediateRender:false},${L(T.pior + 0.1)});`,
    legalIn(id, L(T.mensalidade)),
    outUp("#p1-lab,#p1-t,#p1-ch,.p1-c,#p1-lg", r3(S2 - st - 0.05), 0.22),
  ].join("\n");
  addScene(id, st, d, css, body, js);
}

// ═════════════ p2 · "O plano empresarial tem outras regras e preços." ═════════════
{
  const id = "p2";
  const [st, et] = PANELS[id];
  const L = (t) => r3(t - st);
  const d = et - st;
  const css = `
#p2-lab{top:470px;}
#p2-t{top:522px;font-size:96px;text-shadow:0 0 40px rgba(20,184,166,.35);}
#p2-t2{top:640px;font-size:52px;color:${MINT};}
.p2-r{position:absolute;top:740px;width:420px;height:112px;display:flex;align-items:center;gap:18px;padding:0 24px;}
.p2-r .tdot{width:66px;height:66px;}
.p2-r b{flex:1;font-family:"Saira Semi Condensed",Arial,sans-serif;font-weight:800;font-size:44px;line-height:1;text-transform:uppercase;color:${INK};}
#p2-lg{top:900px;}`;
  const body = `
    <div id="p2-lab" class="lab">Pelo CNPJ, o</div>
    <div id="p2-t" class="pt">Plano empresarial</div>
    <div id="p2-t2" class="pt">tem outras</div>
    <div class="p2-r wcard" id="p2-r0" style="left:90px"><span class="tdot">${icon("rules", 40, "#fff")}</span><b>Regras</b></div>
    <div class="p2-r wcard" id="p2-r1" style="left:570px"><span class="tdot">${icon("tag", 40, "#fff")}</span><b>Preços</b></div>
    <div id="p2-lg" class="legal">${OBS.ref} ${OBS.faixa}</div>`;
  const js = [
    fadeUp("#p2-lab", L(T.o - 0.05), { y: 24 }),
    popIn("#p2-t", L(T.empresarial - 0.18), { s: 0.7, d: 0.4 }),
    fadeUp("#p2-t2", L(T.empresarial + 0.75), { y: 24 }),
    `    tl.fromTo("#p2-r0",{opacity:0,x:-140},{opacity:1,x:0,duration:0.38,ease:"power3.out"},${L(T.regras - 0.22)});`,
    `    tl.fromTo("#p2-r1",{opacity:0,x:140},{opacity:1,x:0,duration:0.38,ease:"power3.out"},${L(T.precos - 0.22)});`,
    legalIn(id, 0.3),
    outUp("#p2-lab,#p2-t,#p2-t2,.p2-r,#p2-lg", r3(d - 0.24), 0.22),
  ].join("\n");
  addScene(id, st, d, css, body, js);
}

// ═════════════ p3 · "Em muitos casos, uma rede melhor, como hospitais São Luiz, São Camilo, BP, dependendo do plano." ═════════════
{
  const id = "p3";
  const [st, et] = PANELS[id];
  const L = (t) => r3(t - st);
  const d = et - st;
  const HOSP = [["São Luiz", T.luiz], ["São Camilo", T.camilo], ["BP", T.bp]];
  const css = `
#p3-lab{top:452px;}
#p3-t{top:494px;font-size:96px;}
#p3-t b{color:${MINT};font-weight:800;}
#p3-h{top:606px;font-size:30px;font-family:"Poppins",Arial,sans-serif;font-weight:600;letter-spacing:.08em;color:rgba(255,255,255,.85);}
.p3-c{position:absolute;top:656px;width:292px;height:156px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;}
.p3-c .tdot{width:62px;height:62px;}
.p3-c b{font-family:"Montserrat",Arial,sans-serif;font-weight:900;font-size:40px;line-height:1;color:${INK};white-space:nowrap;}
#p3-dep{position:absolute;left:0;width:${W}px;top:836px;display:flex;justify-content:center;}
#p3-lg{top:906px;}`;
  const body = `
    <div id="p3-lab" class="lab">Em muitos casos,</div>
    <div id="p3-t" class="pt">Uma rede <b>melhor</b></div>
    <div id="p3-h" class="pt">como hospitais</div>
    ${HOSP.map(([n], i) => `<div class="p3-c wcard" id="p3-c${i}" style="left:${70 + i * 322}px"><span class="tdot">${icon("hosp", 36, "#fff")}</span><b>${n}</b></div>`).join("\n    ")}
    <div id="p3-dep"><div class="chip"><span class="ci">${icon("info", 30, "#fff")}</span>dependendo do plano</div></div>
    <div id="p3-lg" class="legal">${OBS.rede} ${OBS.disp}</div>`;
  const js = [
    fadeUp("#p3-lab", L(T.em - 0.02), { y: 24 }),
    popIn("#p3-t", L(T.rede2 - 0.2), { s: 0.7, d: 0.4 }),
    fadeUp("#p3-h", L(T.hospitais - 0.15), { y: 20 }),
    ...HOSP.map(([, t], i) => `    tl.fromTo("#p3-c${i}",{opacity:0,y:70,rotationX:-70,transformPerspective:900},{opacity:1,y:0,rotationX:0,duration:0.45,ease:"back.out(1.5)"},${L(t - 0.18)});`),
    popIn("#p3-dep", L(T.dependendo - 0.1), { s: 0.7, d: 0.36 }),
    legalIn(id, L(T.hospitais)),
    outUp("#p3-lab,#p3-t,#p3-h,.p3-c,#p3-dep,#p3-lg", r3(d - 0.24), 0.22),
  ].join("\n");
  addScene(id, st, d, css, body, js);
}

// ═════════════ p4 · "E os benefícios vêm junto. Telemedicina 24 horas, cobertura nacional e, em vários planos, reembolso de consultas." ═════════════
{
  const id = "p4";
  const [st, et] = PANELS[id];
  const L = (t) => r3(t - st);
  const ROWS = [["phone", "Telemedicina 24 h", "", T.tele], ["globe", "Cobertura nacional", "", T.cobertura], ["refund", "Reembolso de consultas", "em vários planos", T.reembolso]];
  const css = `
#p4-lab{top:452px;}
#p4-t{top:494px;font-size:66px;}
.p4-r{position:absolute;left:100px;width:880px;height:96px;display:flex;align-items:center;gap:22px;padding:0 24px;}
.p4-r .tdot{width:64px;height:64px;}
.p4-r b{flex:1;font-family:"Saira Semi Condensed",Arial,sans-serif;font-weight:800;font-size:42px;text-transform:uppercase;line-height:1;color:${INK};}
.p4-r b small{display:block;margin-top:4px;font-family:"Poppins",Arial,sans-serif;font-weight:600;font-size:22px;letter-spacing:.02em;text-transform:none;color:${TEAL_D};}
.p4-r .ok{width:56px;height:56px;border-radius:50%;background:${GREEN};display:flex;align-items:center;justify-content:center;flex:none;}
#p4-lg{top:906px;}`;
  const body = `
    <div id="p4-lab" class="lab">E os benefícios</div>
    <div id="p4-t" class="pt">Vêm junto</div>
    ${ROWS.map(([ic, txt, sm], i) => `<div class="p4-r wcard" id="p4-r${i}" style="top:${586 + i * 106}px"><span class="tdot">${icon(ic, 38, "#fff")}</span><b>${txt}${sm ? `<small>${sm}</small>` : ""}</b><span class="ok" id="p4-k${i}">${icon("check", 34, "#fff")}</span></div>`).join("\n    ")}
    <div id="p4-lg" class="legal">${OBS.cob} ${OBS.rede}</div>`;
  const js = [
    fadeUp("#p4-lab", L(T.beneficios - 0.1), { y: 24 }),
    popIn("#p4-t", L(T.vem - 0.1), { s: 0.7, d: 0.36 }),
    ...ROWS.flatMap(([, , , t], i) => [
      `    tl.fromTo("#p4-r${i}",{opacity:0,x:${i % 2 ? 120 : -120}},{opacity:1,x:0,duration:0.38,ease:"power3.out"},${L(t - 0.2)});`,
      popIn(`#p4-k${i}`, L(t + 0.15), { s: 0.2, d: 0.32 }),
    ]),
    legalIn(id, L(T.tele)),
    outUp("#p4-lab,#p4-t,.p4-r,#p4-lg", r3(S4 - st - 0.05), 0.22),
  ].join("\n");
  addScene(id, st, et - st, css, body, js);
}

// ═════════════ p5 · "Nosso time de especialistas compara as principais operadoras pra você ou sua empresa." ═════════════
{
  const id = "p5";
  const [st, et] = PANELS[id];
  const L = (t) => r3(t - st);
  const d = et - st;
  const COLS = [[0.78, 0.55, 0.66], [0.92, 0.84, 0.9], [0.6, 0.72, 0.5]];
  const css = `
#p5-t1{position:absolute;left:0;width:${W}px;top:458px;display:flex;justify-content:center;align-items:center;gap:16px;font-family:"Saira Semi Condensed",Arial,sans-serif;font-weight:800;font-size:58px;line-height:1;text-transform:uppercase;}
#p5-t1 .tdot{width:64px;height:64px;}
#p5-t{top:536px;font-size:42px;color:${MINT};}
.p5-c{position:absolute;top:606px;width:280px;height:212px;padding:18px 22px 0;}
.p5-c h4{font-family:"Poppins",Arial,sans-serif;font-weight:600;font-size:24px;color:#64748B;margin-bottom:12px;}
.p5-row{display:flex;align-items:center;gap:10px;margin-bottom:12px;}
.p5-row span{width:96px;font-family:"Poppins",Arial,sans-serif;font-weight:600;font-size:20px;color:${INK};}
.p5-row i{position:relative;flex:1;height:16px;border-radius:8px;background:#E2E8F0;overflow:hidden;}
.p5-row i em{position:absolute;left:0;top:0;bottom:0;border-radius:8px;background:${TEAL};transform-origin:0 50%;}
#p5-c1{box-shadow:0 0 0 6px ${TEAL},0 18px 40px rgba(2,8,20,.45);}
#p5-best{position:absolute;left:400px;top:832px;width:280px;display:flex;justify-content:center;}
#p5-best>div{padding:5px 18px 6px;border-radius:20px;background:${GREEN};font-family:"Poppins",Arial,sans-serif;font-weight:800;font-size:22px;white-space:nowrap;}
#p5-lens{position:absolute;left:96px;top:640px;width:100px;height:100px;color:#fff;filter:drop-shadow(0 6px 14px rgba(2,8,20,.5));}
#p5-lg{top:906px;}`;
  const body = `
    <div id="p5-t1"><span class="tdot">${icon("team", 40, "#fff")}</span>Nosso time de especialistas</div>
    <div id="p5-t" class="pt">compara as principais operadoras</div>
    ${COLS.map((v, i) => `<div class="p5-c wcard" id="p5-c${i}" style="left:${70 + i * 330}px"><h4>Opção ${i + 1}</h4>${["Rede", "Preço", "Benefícios"].map((k, j) => `<div class="p5-row"><span>${k}</span><i><em id="p5-m${i}${j}" style="width:${Math.round(v[j] * 100)}%"></em></i></div>`).join("")}</div>`).join("\n    ")}
    <div id="p5-best"><div>✓ a melhor pra você</div></div>
    <span id="p5-lens" class="ic">${ICON.search}</span>
    <div id="p5-lg" class="legal">${OBS.eleg} ${OBS.analise}</div>`;
  const js = [
    popIn("#p5-t1", L(T.nosso - 0.05), { s: 0.75, d: 0.4 }),
    fadeUp("#p5-t", L(T.compara - 0.15), { y: 24 }),
    ...COLS.map((_, i) => `    tl.fromTo("#p5-c${i}",{opacity:0,y:60},{opacity:1,y:0,duration:0.38,ease:"power3.out"},${L(T.compara + 0.05 + i * 0.12)});`),
    ...COLS.flatMap((v, i) => v.map((_, j) => `    tl.fromTo("#p5-m${i}${j}",{scaleX:0},{scaleX:1,duration:0.45,ease:"power2.out"},${L(T.compara + 0.3 + i * 0.12 + j * 0.06)});`)),
    `    tl.fromTo("#p5-lens",{opacity:0},{opacity:1,duration:0.2},${L(T.compara + 0.3)});`,
    `    tl.to("#p5-lens",{x:660,duration:1.2,ease:"sine.inOut"},${L(T.compara + 0.5)});`,
    `    tl.to("#p5-lens",{x:330,duration:0.45,ease:"power2.out"},${L(T.compara + 1.8)});`,
    `    tl.to("#p5-lens",{opacity:0,duration:0.2},${L(T.voce - 0.05)});`,
    `    tl.fromTo("#p5-c1",{scale:1},{scale:1.08,duration:0.3,ease:"back.out(2)"},${L(T.voce - 0.1)});`,
    popIn("#p5-best", L(T.voce - 0.05), { s: 0.4, d: 0.36 }),
    legalIn(id, L(T.compara)),
    outUp("#p5-t1,#p5-t,.p5-c,#p5-best,#p5-lg", r3(d - 0.24), 0.22),
  ].join("\n");
  addScene(id, st, d, css, body, js);
}

// ═════════════ p6 · "É exclusivo pra CNPJ." ═════════════
{
  const id = "p6";
  const [st, et] = PANELS[id];
  const L = (t) => r3(t - st);
  const d = et - st;
  const css = `
#p6-lab{top:466px;}
#p6-seal{position:absolute;left:110px;width:860px;top:520px;height:236px;border-radius:36px;background:#fff;color:${INK};display:flex;align-items:center;gap:30px;padding:0 44px;box-shadow:0 20px 44px rgba(2,8,20,.5),0 0 0 8px rgba(20,184,166,.45);}
#p6-seal .tdot{width:132px;height:132px;}
#p6-seal b{display:block;font-family:"Montserrat",Arial,sans-serif;font-weight:900;font-size:92px;line-height:.95;color:${TEAL_D};letter-spacing:-.01em;}
#p6-seal i{display:block;font-style:normal;font-family:"Saira Semi Condensed",Arial,sans-serif;font-weight:800;font-size:44px;text-transform:uppercase;color:${INK};}
#p6-v{position:absolute;left:0;width:${W}px;top:790px;display:flex;justify-content:center;}
#p6-lg{top:906px;}`;
  const body = `
    <div id="p6-lab" class="lab">É exclusivo</div>
    <div id="p6-seal"><span class="tdot">${icon("shield", 84, "#fff")}</span><div><i>Exclusivo para</i><b>CNPJ/MEI</b></div></div>
    <div id="p6-v"><div class="chip"><span class="ci">${icon("team", 30, "#fff")}</span>a partir de 3 vidas</div></div>
    <div id="p6-lg" class="legal">${OBS.eleg} ${OBS.analise}</div>`;
  const js = [
    fadeUp("#p6-lab", L(T.exclusivo - 0.15), { y: 24 }),
    stampIn("#p6-seal", L(T.exclusivo - 0.05), 1.8),
    popIn("#p6-v", L(T.exclusivo + 0.25), { s: 0.6, d: 0.36 }),
    legalIn(id, 0.3),
    outUp("#p6-lab,#p6-seal,#p6-v,#p6-lg", r3(d - 0.24), 0.22),
  ].join("\n");
  addScene(id, st, d, css, body, js);
}

// ═════════════ p7 · CTA + cartão final ═════════════
{
  const id = "p7";
  const [st] = PANELS[id];
  const L = (t) => r3(t - st);
  const RECAP = [["hosp", "Rede de<br>referência*"], ["phone", "Telemedicina<br>24 h"], ["globe", "Cobertura<br>nacional"]];
  const css = `
#p7-t{top:452px;font-size:58px;}
.p7-ch{position:absolute;top:452px;width:58px;height:58px;color:#fff;}
#p7-bt{position:absolute;left:100px;width:880px;top:542px;height:156px;border-radius:40px;background:#fff;color:${INK};display:flex;align-items:center;gap:26px;padding:0 40px;box-shadow:0 20px 44px rgba(2,8,20,.5),0 0 0 6px rgba(20,184,166,.45);}
#p7-bt .tdot{width:92px;height:92px;}
#p7-bt b{display:block;font-family:"Montserrat",Arial,sans-serif;font-weight:900;font-size:50px;line-height:1.02;color:${TEAL_D};}
#p7-bt i{display:block;font-style:normal;font-family:"Poppins",Arial,sans-serif;font-weight:600;font-size:30px;opacity:.85;margin-top:6px;}
#p7-rip{position:absolute;left:452px;top:582px;width:80px;height:80px;border-radius:50%;border:5px solid ${TEAL};opacity:0;}
#p7-req{position:absolute;left:0;width:${W}px;top:726px;display:flex;justify-content:center;}
#p7-req .ci{background:${GREEN};}
#p7-lg{top:800px;}
#p7-rt{top:1046px;font-size:40px;color:${MINT};}
.p7-rc{position:absolute;top:1108px;width:300px;height:196px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;padding:0 12px;}
.p7-rc .tdot{width:76px;height:76px;}
.p7-rc b{font-family:"Saira Semi Condensed",Arial,sans-serif;font-weight:800;font-size:30px;text-transform:uppercase;line-height:1.02;text-align:center;color:${INK};}
#p7-nt{position:absolute;left:100px;width:${W - 200}px;top:1330px;text-align:center;font-family:"Poppins",Arial,sans-serif;font-weight:500;font-size:19px;line-height:1.32;color:rgba(255,255,255,.92);}`;
  const body = `
    <span id="p7-a1" class="p7-ch ic" style="left:50px">${ICON.down}</span><span id="p7-a2" class="p7-ch ic" style="left:972px">${ICON.down}</span>
    <div id="p7-t" class="pt">Clique no link abaixo</div>
    <div id="p7-bt"><span class="tdot">${icon("form", 54, "#fff")}</span><div><b>SOLICITE SUA COTAÇÃO</b><i>Preencha o formulário</i></div></div>
    <span id="p7-rip"></span>
    <div id="p7-req"><div class="chip"><span class="ci">${icon("check", 28, "#fff")}</span>Exclusivo para CNPJ/MEI · a partir de 3 vidas</div></div>
    <div id="p7-lg" class="legal">${LEGAL_FIM}</div>
    <div id="p7-rt" class="pt">Pelo CNPJ, com</div>
    ${RECAP.map(([ic, txt], i) => `<div class="p7-rc wcard" id="p7-rc${i}" style="left:${60 + i * 330}px"><span class="tdot">${icon(ic, 44, "#fff")}</span><b>${txt}</b></div>`).join("\n    ")}
    <div id="p7-nt">*Rede conforme o plano contratado. Telemedicina e cobertura nacional conforme o plano.</div>`;
  const js = [
    fadeUp("#p7-t", L(T.clica - 0.08), { y: 30 }),
    `    tl.fromTo("#p7-a1,#p7-a2",{opacity:0,y:-18},{opacity:1,y:10,duration:0.45,ease:"sine.inOut",yoyo:true,repeat:7},${L(T.clica)});`,
    popIn("#p7-bt", L(T.clica + 0.25), { s: 0.7, d: 0.45 }),
    `    tl.fromTo("#p7-bt",{scale:1},{scale:0.95,duration:0.1,ease:"power2.out",yoyo:true,repeat:1,immediateRender:false},${L(T.formulario - 0.05)});`,
    `    tl.fromTo("#p7-rip",{opacity:0.9,scale:0.4},{opacity:0,scale:4,duration:0.6,ease:"power2.out",immediateRender:false},${L(T.formulario - 0.02)});`,
    fadeUp("#p7-req", L(T.formulario + 0.2), { y: 24 }),
    `    tl.fromTo("#p7-lg",{opacity:0},{opacity:1,duration:0.4},0.5);`,
    fadeUp("#p7-rt", L(ENDC + 0.15), { y: 24 }),
    ...RECAP.map((_, i) => `    tl.fromTo("#p7-rc${i}",{opacity:0,y:60},{opacity:1,y:0,duration:0.4,ease:"back.out(1.6)"},${L(ENDC + 0.25 + i * 0.12)});`),
    `    tl.fromTo("#p7-nt",{opacity:0},{opacity:1,duration:0.3},${L(ENDC + 0.5)});`,
    `    tl.fromTo("#p7-bt",{scale:1},{scale:1.04,duration:0.35,ease:"sine.inOut",yoyo:true,repeat:1,immediateRender:false},${L(ENDC + 0.6)});`,
  ].join("\n");
  addScene(id, st, D - st, css, body, js);
}

// ═════════════ lf · texto legal nas partes em tela cheia ═════════════
{
  const WIN = [[0.4, S1 + 0.1, `${OBS.eleg} ${OBS.analise}`], [S2 + 0.45, S3 + 0.05, `${OBS.eleg} ${OBS.analise}`],
    [S4 + 0.3, S5 + 0.25, `${OBS.ref} ${OBS.perfil}`]];
  const css = `
.lf{position:absolute;left:0;width:${W}px;top:496px;display:flex;justify-content:center;}
.lf>div{max-width:900px;padding:8px 20px;border-radius:14px;background:rgba(3,10,23,.8);text-align:center;font-family:"Poppins",Arial,sans-serif;font-weight:500;font-size:19px;line-height:1.32;color:#fff;}`;
  const body = WIN.map(([a, b, txt], i) => `
    <div class="lf clip" id="lf-${i}" data-start="${r3(a)}" data-duration="${r3(b - a)}" data-track-index="0"><div id="lf-${i}i">${txt}</div></div>`).join("");
  const js = WIN.flatMap(([a, b], i) => [
    `    tl.fromTo("#lf-${i}i",{opacity:0},{opacity:1,duration:0.3},${r3(a)});`,
    `    tl.to("#lf-${i}i",{opacity:0,duration:0.2},${r3(b - 0.22)});`,
  ]).join("\n");
  addScene("lf", 0, D, css, body, js, { track: 7, z: 6 });
}

// ═════════════ cap · legendas palavra a palavra ═════════════
{
  const EMPH = new Set(["subiu", "atencao", "reajuste", "mensalidade", "orcamento", "pior", "cnpj", "empresarial", "regras", "precos",
    "melhor", "luiz", "camilo", "bp", "beneficios", "telemedicina", "24", "nacional", "reembolso", "trocar", "parar", "mais",
    "especialistas", "operadoras", "exclusivo", "link", "formulario"]);
  const PAIN = new Set(["reajuste", "pior", "orcamento", "mais"]);
  const BOUNDS = [S1, S2, S3, S4, S5].map((s) => s + 0.25);
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
    const e = r3(Math.min(nextStart, g[g.length - 1].end + 0.35, D));
    const top = split(g[0].start) ? 966 + OFF : 1440;
    const chars = g.map(disp).join(" ").length;
    const fs = Math.max(44, Math.min(70, Math.floor(880 / (chars * 0.9))));
    html += `    <div class="cg clip" id="cg${gi}" data-start="${s}" data-duration="${r3(e - s)}" data-track-index="0" style="top:${top}px"><div class="gi" id="cg${gi}i" style="font-size:${fs}px">${g
      .map((w) => `<span class="w" id="cw${w.i}"${EMPH.has(norm(w.word)) ? ` style="color:${color(w)}"` : ""}>${disp(w)}</span>`)
      .join(" ")}</div></div>\n`;
    js.push(`    tl.fromTo("#cg${gi}i",{opacity:0,y:22,scale:0.9},{opacity:1,y:0,scale:1,duration:0.14,ease:"power3.out"},${s});`);
    g.forEach((w) => {
      const em = EMPH.has(norm(w.word));
      js.push(`    tl.fromTo("#cw${w.i}",{scale:1},{scale:${em ? 1.14 : 1.06},duration:0.1,ease:"power2.out",yoyo:true,repeat:1},${r3(w.start)});`);
      if (!em) {
        js.push(`    tl.set("#cw${w.i}",{color:"${TEAL_D}"},${r3(w.start)});`);
        js.push(`    tl.set("#cw${w.i}",{color:"${INK}"},${r3(Math.min(w.end, e - 0.01))});`);
      }
    });
    js.push(`    tl.to("#cg${gi}i",{opacity:0,duration:0.1,ease:"power2.in"},${r3(Math.max(s + 0.15, e - 0.1))});`);
  });
  const css = `
.cg{position:absolute;left:0;width:${W}px;text-align:center;}
.gi{display:inline-block;max-width:960px;padding:10px 26px 14px;border-radius:22px;background:rgba(255,255,255,.97);box-shadow:0 12px 30px rgba(2,8,20,.4);font-family:"Montserrat",Arial,sans-serif;font-weight:900;line-height:1.08;color:${INK};letter-spacing:.005em;}
.gi .w{display:inline-block;margin:0 .07em;}`;
  addScene("cap", 0, D, css, html, js.join("\n"), { track: 6, kind: "captions", z: 7 });
}

// ═════════════ raiz: vídeo, painel, cenas e áudio ═════════════
const sfx = [];
const hitOf = (k) => (HITS[k.replace(/2$/, "")] || { hit: 0 }).hit;
const durOf = (k) => (HITS[k.replace(/2$/, "")] || { dur: 1 }).dur;
const S = (k, t, vol = 0.5, dur) => sfx.push({ k, t: r3(t + 1 / 30 - hitOf(k)), vol, dur: dur || durOf(k) });
S("pop2", T.subiu, 0.3);
S("clock", T.proximos, 0.3);
S("whoosh", S1 + 0.25, 0.4);
S("card", T.todo, 0.3);
S("stamp", T.reajuste - 0.1, 0.5);
S("riser", T.mensalidade + 0.45, 0.3);
S("pop", T.pesa, 0.35);
S("pop", T.mesma, 0.3);
S("pop2", T.pior, 0.4);
S("whoosh", S2 + 0.2, 0.4);
S("stamp", T.cnpj, 0.45);
S("whoosh2", C.s4 + 0.02, 0.3);
S("whoosh2", S3 + 0.25, 0.4);
S("impact", T.o + 0.02, 0.45);
S("pop", T.empresarial - 0.1, 0.35);
S("check", T.regras, 0.4); S("check", T.precos, 0.4);
S("whoosh", PANELS.p3[0], 0.3);
S("pop2", T.luiz - 0.1, 0.4); S("pop2", T.camilo - 0.1, 0.4); S("pop2", T.bp - 0.1, 0.4);
S("tap", T.dependendo, 0.4);
S("whoosh2", PANELS.p4[0], 0.3);
S("check", T.tele + 0.15, 0.45); S("check", T.cobertura + 0.15, 0.45); S("check", T.reembolso + 0.15, 0.45);
S("whoosh", S4 + 0.2, 0.4);
S("pop2", T.parar, 0.35);
S("pop", T.mais, 0.35);
S("whoosh2", S5 + 0.25, 0.4);
S("card", T.compara, 0.3);
S("shimmer", T.compara + 0.5, 0.25);
S("chime", T.voce - 0.05, 0.35);
S("stamp", T.exclusivo - 0.05, 0.5);
S("impact", T.exclusivo - 0.05, 0.3);
S("whoosh", PANELS.p7[0], 0.3);
S("pop", T.clica + 0.3, 0.4);
S("tap", T.formulario - 0.02, 0.55);
S("chime", ENDC + 0.3, 0.35);
sfx.sort((a, b) => a.t - b.t);
const laneEnd = [0, 0, 0];
sfx.forEach((s) => { let l = laneEnd.findIndex((e) => e <= s.t); if (l < 0) l = laneEnd.length - 1; s.lane = 12 + l; laneEnd[l] = s.t + s.dur; });

const ORG_WIDE = "50% 44%", ORG_SELFIE = "50% 50%";
const R = [];
R.push(`      tl.set("#pbg",{y:-${PANEL_H + 100}},0);`);
R.push(`      tl.set("#vw",{y:0,scale:1,transformOrigin:"${ORG_WIDE}"},0);`);
// gancho (plano aberto, tela cheia): aproximação lenta + punch-ins no "subiu" e no "atenção"
R.push(`      tl.fromTo("#vw",{scale:1},{scale:1.04,duration:${r3(T.subiu - 0.05)},ease:"none"},0);`);
R.push(`      tl.to("#vw",{scale:1.09,duration:0.18,ease:"power3.out"},${r3(T.subiu - 0.05)});`);
R.push(`      tl.to("#vw",{scale:1.11,duration:${r3(T.atencao - T.subiu - 0.2)},ease:"none"},${r3(T.subiu + 0.13)});`);
R.push(`      tl.to("#vw",{scale:1.16,duration:0.18,ease:"power3.out"},${r3(T.atencao - 0.05)});`);
const toSplit = (t, y) => [
  `      tl.to("#vw",{y:${y},scale:1,duration:${MOVE},ease:"power3.inOut"},${t});`,
  `      tl.to("#pbg",{y:0,duration:${MOVE},ease:"power3.inOut"},${t});`,
];
const toFull = (t, scale = 1.02) => [
  `      tl.to("#vw",{y:0,scale:${scale},duration:${MOVE},ease:"power3.inOut"},${t});`,
  `      tl.to("#pbg",{y:-${PANEL_H + 100},duration:${MOVE},ease:"power3.inOut"},${t});`,
];
// dor (selfie, painel)
R.push(...toSplit(S1, SPLIT_SELFIE));
R.push(`      tl.set("#vw",{transformOrigin:"${ORG_SELFIE}"},${r3(S1 + MOVE)});`);
R.push(`      tl.to("#vw",{scale:1.03,duration:${r3(S2 - S1 - MOVE)},ease:"none"},${r3(S1 + MOVE)});`);
// "Se você tem CNPJ, dá pra sair dessa" (selfie, tela cheia): punch-in no corte do "dá pra sair dessa"
R.push(...toFull(S2, 1));
R.push(`      tl.to("#vw",{scale:1.05,duration:${r3(C.s4 - S2 - MOVE)},ease:"none"},${r3(S2 + MOVE)});`);
R.push(`      tl.set("#vw",{scale:1.14},${r3(C.s4)});`);
R.push(`      tl.to("#vw",{scale:1.17,duration:${r3(S3 - C.s4)},ease:"none"},${r3(C.s4)});`);
// solução, hospitais e benefícios (plano aberto, painel); punch-in leve para esconder os dois cortes curtos
R.push(...toSplit(S3, SPLIT_WIDE));
R.push(`      tl.set("#vw",{transformOrigin:"${ORG_WIDE}"},${r3(S3 + MOVE)});`);
R.push(`      tl.to("#vw",{scale:1.03,duration:${r3(C.s5 - S3 - MOVE)},ease:"none"},${r3(S3 + MOVE)});`);
R.push(`      tl.set("#vw",{scale:1.08},${r3(C.s5)});`);
R.push(`      tl.set("#vw",{scale:1.02},${r3(C.s6)});`);
R.push(`      tl.to("#vw",{scale:1.05,duration:${r3(S4 - C.s6)},ease:"none"},${r3(C.s6)});`);
// frase-tese (plano aberto, tela cheia): punch-ins no "parar" e no "mais"
R.push(...toFull(S4, 1.02));
R.push(`      tl.to("#vw",{scale:1.05,duration:${r3(T.parar - S4 - MOVE - 0.05)},ease:"none"},${r3(S4 + MOVE)});`);
R.push(`      tl.to("#vw",{scale:1.1,duration:0.18,ease:"power3.out"},${r3(T.parar - 0.05)});`);
R.push(`      tl.to("#vw",{scale:1.16,duration:0.18,ease:"power3.out"},${r3(T.mais - 0.05)});`);
// time, exclusivo e CTA (plano aberto, painel); punch-in alternado nos cortes de tomada
R.push(...toSplit(S5, SPLIT_WIDE));
R.push(`      tl.to("#vw",{scale:1.03,duration:${r3(C.s8 - S5 - MOVE)},ease:"none"},${r3(S5 + MOVE)});`);
R.push(`      tl.set("#vw",{scale:1.09},${r3(C.s8)});`);
R.push(`      tl.set("#vw",{scale:1.02},${r3(C.s9)});`);
R.push(`      tl.to("#vw",{scale:1.04,duration:${r3(ENDC - C.s9)},ease:"none"},${r3(C.s9)});`);
// cartão final: o painel cresce até o pé da tela
R.push(`      tl.to("#pbg",{height:${H},duration:0.6,ease:"power3.inOut"},${ENDC});`);
R.push(`      tl.to("#vw",{y:${SPLIT_WIDE + 160},duration:0.6,ease:"power3.inOut"},${ENDC});`);

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
      #root { position: relative; width: ${W}px; height: ${H}px; overflow: hidden; background: linear-gradient(180deg, ${NAVY} 0%, ${NAVY_D} 40%, ${NAVY_DD} 100%); }
      #vw { position: absolute; left: 0; top: 0; width: ${W}px; height: ${H}px; z-index: 1; }
      #v-src { position: absolute; left: 0; top: 0; width: ${W}px; height: ${H}px; object-fit: cover; }
      #pbg { position: absolute; left: 0; top: 0; width: ${W}px; height: ${PANEL_H}px; z-index: 2; border-radius: 0 0 56px 56px; overflow: hidden;
        background: radial-gradient(120% 70% at 50% 28%, #15365F 0%, ${NAVY} 45%, ${NAVY_D} 100%); box-shadow: 0 30px 70px rgba(2,8,20,.6); }
      #pbg-grid { position: absolute; inset: 0; opacity: .7;
        background-image: linear-gradient(rgba(153,246,228,.06) 2px, transparent 2px), linear-gradient(90deg, rgba(153,246,228,.06) 2px, transparent 2px);
        background-size: 60px 60px; }
      #pbg-glow { position: absolute; left: 0; right: 0; top: 30%; height: 50%; background: radial-gradient(50% 50% at 50% 50%, rgba(20,184,166,.16), rgba(20,184,166,0)); }
      #pbg-line { position: absolute; left: 0; right: 0; bottom: 0; height: 6px; background: linear-gradient(90deg, rgba(20,184,166,0), ${TEAL}, rgba(20,184,166,0)); }
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="${D}" data-width="${W}" data-height="${H}">
      <div id="vw">
        <video id="v-src" class="clip" data-start="0" data-duration="${D}" data-track-index="0" muted playsinline src="assets/video/src.mp4"></video>
      </div>
      <div id="pbg"><div id="pbg-grid"></div><div id="pbg-glow"></div><div id="pbg-line"></div></div>
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
writeFileSync(join(ROOT, "tools", "timing.json"), JSON.stringify({ T, C, S1, S2, S3, S4, S5, ENDC, PANELS, sfx }, null, 1));
console.log(`index.html ${W}x${H} ${D}s · ${scenes.length} cenas · ${sfx.length} efeitos · modos ${S1}/${S2}/${S3}/${S4}/${S5} · fim ${ENDC}`);
