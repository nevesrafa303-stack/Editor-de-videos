// Gera index.html e compositions/*.html do anúncio "Ads 03 Bradesco" (talking head 9:16, 41,4 s).
//
// Mesmo formato do caio-ads-01, na paleta da Bradesco Saúde (vermelho #cc092f + branco):
// - o vídeo do apresentador (mudo; a voz tratada vai em <audio>) fica num invólucro (#vw) que o timeline da raiz move:
//   em tela cheia ele desce FULL_Y px para o cabeçalho caber acima da cabeça; com o painel de infográficos (#pbg)
//   ele desce SPLIT_Y px e o rosto fica inteiro na metade de baixo;
// - cenas do painel (p1–p6), uma por trecho da fala, cada uma com a sua observação obrigatória;
// - cabeçalho fixo (hd): "PLANOS DE SAÚDE" + selo "EXCLUSIVO PARA CNPJ/MEI" + "a partir de 3 vidas";
// - legendas palavra a palavra (cap) e o texto legal das partes em tela cheia (lf);
// - trilha, voz e efeitos sonoros na raiz.
//
//   node tools/build.mjs
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const W = 1080, H = 1920, D = 41.4;
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

// ───────────── tempos (absolutos, presos à fala) ─────────────
const T = {};
T.contar = at("contar"); T.bradesco = at("bradesco"); T.ah = at("ah"); T.top = at("top"); T.caro = at("caro");
T.entao = at("entao"); T.prepara = at("prepara"); T.talvez = at("talvez"); T.a = at("a"); T.regiao = at("regiao");
T.empresas = at("empresas"); T.n3 = at("3"); T.n199 = at("199"); T.pessoas = at("pessoas"); T.um = at("um", T.n199);
T.abrangencia = at("abrangencia"); T.excelentes = at("excelentes"); T.alto = at("alto"); T.seguranca = at("seguranca");
T.e2 = at("e", T.seguranca); T.olha = at("olha"); T.custo2 = at("custo", T.olha); T.surpreender = at("surpreender");
T.talvez2 = at("talvez", T.surpreender); T.mais = at("mais", T.talvez2); T.clica = at("clica"); T.cotacao = at("cotacao");
T.fim = WORDS[WORDS.length - 1].end;

// modos: tela cheia ↔ painel de infográficos
const S1 = r3(T.ah - 0.25);     // painel desce na objeção "Ah, João…"
const S2 = r3(T.talvez2 - 0.42); // painel sobe no "Talvez a sua empresa…"
const S3 = r3(T.clica - 0.3);   // painel desce de novo (CTA)
const MOVE = 0.5;
const FULL_Y = 100;             // neste vídeo a cabeça fica entre y 390 e 630 no quadro: basta descer 100 px
const SPLIT_Y = 800;            // com o painel, o rosto fica inteiro abaixo dele nos planos fechados e nos abertos
const ORIGIN = "50% 40%";       // centro do rosto no quadro original (punch-ins)
const OFF = 48;                 // conteúdo do painel abaixo do cabeçalho (cabeçalho a partir de 240 px)
const split = (t) => (t >= S1 + 0.25 && t < S2 + 0.25) || t >= S3 + 0.25;

const PANELS = {
  p1: [S1, r3(T.entao - 0.1)],
  p2: [r3(T.entao - 0.1), r3(T.a - 0.1)],
  p3: [r3(T.a - 0.1), r3(T.um - 0.1)],
  p4: [r3(T.um - 0.1), r3(T.e2 - 0.1)],
  p5: [r3(T.e2 - 0.1), r3(S2 + MOVE)],
  p6: [S3, D],
};

// ───────────── estilo (Bradesco Saúde) ─────────────
const RED = "#CC092F", RED_D = "#7A0019", RED_DD = "#4A0010", INK = "#2A0710", PINK = "#FFD3DC";
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
const LEGAL_FIM = [
  "Plano de saúde empresarial Bradesco Saúde para empresas de 3 a 199 vidas, com abrangência nacional conforme o plano contratado.",
  "Exclusivo para CNPJ/MEI.",
  OBS.eleg, OBS.analise, OBS.ref, OBS.cob,
].join(" ");

const ICON = {
  shield: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.5l8 3v6c0 5-3.4 8.8-8 10-4.6-1.2-8-5-8-10v-6z"/><path d="M8.5 12l2.5 2.5 4.5-5"/></svg>`,
  check: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>`,
  cal: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="5" width="17" height="15" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/></svg>`,
  user: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/></svg>`,
  hosp: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M12 7v6M9 10h6M10 21v-4h4v4"/></svg>`,
  lab: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3h6M10 3v6.5L4.8 18.2A2 2 0 0 0 6.5 21h11a2 2 0 0 0 1.7-2.8L14 9.5V3"/><path d="M7.5 15h9"/></svg>`,
  refund: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/><path d="M12 7v10M14.5 9.5c0-1.4-1.1-2-2.5-2s-2.5.7-2.5 2 1.1 1.8 2.5 2.1 2.5.8 2.5 2.2-1.1 2-2.5 2-2.5-.6-2.5-2"/></svg>`,
  alarm: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2.5M5 3L2 6M19 3l3 3"/></svg>`,
  down: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>`,
  brief: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 13h18"/></svg>`,
  scale: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v18M7 21h10M5 7h14M5 7l-3 7h6zM19 7l-3 7h6z"/></svg>`,
  globe: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></svg>`,
  pin: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>`,
  doubt: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.5l8 3v6c0 5-3.4 8.8-8 10-4.6-1.2-8-5-8-10v-6z"/><path d="M9.8 9.5a2.3 2.3 0 1 1 3.4 2c-.8.4-1.2 1-1.2 1.8M12 16.3h.01"/></svg>`,
  priceup: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/></svg>`,
  form: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="3" width="16" height="18" rx="2.5"/><path d="M8 8h8M8 12h8M8 16h5"/></svg>`,
};
const icon = (k, size, color) => `<span class="ic" style="width:${size}px;height:${size}px;color:${color}">${ICON[k]}</span>`;
const BRAD_SVG = readFileSync(join(ROOT, "assets/logos/bradesco.svg"), "utf8").replace(/<title>.*?<\/title>/, "").replace("<svg ", '<svg width="100%" ');

function sceneFile(id, css, body, js) {
  return `<template>
  <style>
${FONTS}
#root{position:absolute;inset:0;overflow:visible;font-family:"Poppins",Arial,sans-serif;color:#fff;}
.ic{display:inline-flex;}
.ic svg{width:100%;height:100%;}
.pt{position:absolute;left:0;width:${W}px;text-align:center;font-family:"Saira Semi Condensed",Arial,sans-serif;font-weight:800;text-transform:uppercase;line-height:1.02;letter-spacing:.005em;}
.lab{position:absolute;left:0;width:${W}px;text-align:center;font-family:"Poppins",Arial,sans-serif;font-weight:600;font-size:30px;letter-spacing:.08em;text-transform:uppercase;color:${PINK};}
.legal{position:absolute;left:100px;width:${W - 200}px;text-align:center;font-family:"Poppins",Arial,sans-serif;font-weight:500;font-size:19px;line-height:1.32;color:rgba(255,255,255,.92);}
.wcard{background:#fff;color:${INK};border-radius:26px;box-shadow:0 18px 40px rgba(40,0,10,.35);}
.rdot{border-radius:50%;background:${RED};display:flex;align-items:center;justify-content:center;flex:none;}
.lgsv{color:${RED};}
.lgsv svg{display:block;}
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
const legalIn = (id) => `    tl.fromTo("#${id}-lg",{opacity:0},{opacity:1,duration:0.3},0.3);`;

mkdirSync(join(ROOT, "compositions"), { recursive: true });

// ═════════════ hd · cabeçalho fixo ═════════════
{
  const css = `
#hd-band{position:absolute;left:0;width:${W}px;top:240px;display:flex;justify-content:center;}
#hd-band>div{position:relative;overflow:hidden;padding:10px 38px 12px;border-radius:14px;background:#fff;color:${RED};font-family:"Montserrat",Arial,sans-serif;font-weight:900;font-size:62px;line-height:1;letter-spacing:.01em;white-space:nowrap;box-shadow:0 12px 32px rgba(40,0,10,.35);}
#hd-sweep{position:absolute;top:-20px;left:-160px;width:110px;height:140px;background:linear-gradient(90deg,rgba(255,211,220,0),rgba(255,211,220,.9),rgba(255,211,220,0));}
#hd-seal{position:absolute;left:0;width:${W}px;top:342px;display:flex;justify-content:center;}
#hd-seal>div{display:flex;align-items:center;gap:14px;padding:9px 30px 9px 10px;border-radius:60px;background:${RED};border:3px solid #fff;color:#fff;font-family:"Montserrat",Arial,sans-serif;font-weight:900;font-size:39px;line-height:1;white-space:nowrap;box-shadow:0 12px 32px rgba(40,0,10,.35);}
#hd-seal .sh{width:58px;height:58px;border-radius:50%;background:#fff;display:flex;align-items:center;justify-content:center;}
#hd-sub{position:absolute;left:0;width:${W}px;top:426px;display:flex;justify-content:center;}
#hd-sub>div{padding:6px 24px 7px;border-radius:26px;background:rgba(58,4,16,.9);border:2px solid rgba(255,255,255,.75);font-family:"Poppins",Arial,sans-serif;font-weight:600;font-size:28px;line-height:1.25;white-space:nowrap;}`;
  const body = `
    <div id="hd-band"><div id="hd-bandi" data-layout-allow-overflow>PLANOS DE SAÚDE<span id="hd-sweep" data-layout-ignore aria-hidden="true"></span></div></div>
    <div id="hd-seal"><div id="hd-seali"><span class="sh">${icon("shield", 34, RED)}</span>EXCLUSIVO PARA CNPJ/MEI</div></div>
    <div id="hd-sub"><div>a partir de 3 vidas</div></div>`;
  const js = [
    `    tl.fromTo("#hd-sweep",{x:0},{x:${W},duration:0.9,ease:"power2.inOut"},0.35);`,
    `    tl.fromTo("#hd-sweep",{x:0},{x:${W},duration:0.9,ease:"power2.inOut",immediateRender:false},${r3(S3 + 0.6)});`,
    `    tl.fromTo("#hd-seali",{scale:1},{scale:1.1,duration:0.16,ease:"power2.out",yoyo:true,repeat:1},${r3(T.n3 - 0.04)});`,
  ].join("\n");
  addScene("hd", 0, D, css, body, js, { track: 5, z: 5 });
}

// ═════════════ p1 · a objeção: "Ah, João, mas é um plano top demais, mas é muito caro." ═════════════
{
  const id = "p1";
  const [st, et] = PANELS[id];
  const L = (t) => r3(t - st);
  const d = et - st;
  const css = `
#p1-q{position:absolute;left:90px;width:900px;top:466px;height:290px;border-radius:30px;background:#fff;color:${INK};padding:40px 44px 0;box-shadow:0 18px 40px rgba(40,0,10,.35);}
#p1-q .mk{position:absolute;left:30px;top:-46px;font-family:"Montserrat",Arial,sans-serif;font-weight:900;font-size:150px;line-height:1;color:#fff;text-shadow:0 8px 20px rgba(40,0,10,.35);}
#p1-q p{font-family:"Poppins",Arial,sans-serif;font-weight:600;font-size:48px;line-height:1.18;}
#p1-q p b{font-weight:800;color:${RED};}
#p1-tag{position:absolute;left:800px;top:676px;width:150px;height:150px;border-radius:50%;background:${RED};border:6px solid #fff;display:flex;align-items:center;justify-content:center;font-family:"Montserrat",Arial,sans-serif;font-weight:900;font-size:58px;color:#fff;box-shadow:0 14px 30px rgba(40,0,10,.4);}
#p1-lg{top:900px;}`;
  const body = `
    <div id="p1-q"><span class="mk">“</span><p>Ah, João, mas é um plano<br><b id="p1-top">top demais</b>…<br>mas é <b id="p1-caro">muito caro</b>!</p></div>
    <span id="p1-tag">R$</span>
    <div id="p1-lg" class="legal">${OBS.ref} ${OBS.perfil}</div>`;
  const js = [
    `    tl.fromTo("#p1-q",{opacity:0,y:60,rotation:-2},{opacity:1,y:0,rotation:0,duration:0.42,ease:"back.out(1.6)"},${L(T.ah - 0.1)});`,
    `    tl.fromTo("#p1-top",{color:"${INK}"},{color:"${RED}",duration:0.15},${L(T.top)});`,
    popIn("#p1-tag", L(T.caro - 0.25), { s: 0.2, d: 0.36 }),
    `    tl.fromTo("#p1-tag",{rotation:0},{keyframes:[{rotation:-14,duration:0.06},{rotation:12,duration:0.06},{rotation:-8,duration:0.06},{rotation:0,duration:0.06}],immediateRender:false},${L(T.caro + 0.15)});`,
    legalIn(id),
    outUp("#p1-q,#p1-tag,#p1-lg", r3(d - 0.24), 0.22),
  ].join("\n");
  addScene(id, st, d, css, body, js);
}

// ═════════════ p2 · "Então se prepara, porque talvez você ainda não saiba disso." ═════════════
{
  const id = "p2";
  const [st, et] = PANELS[id];
  const L = (t) => r3(t - st);
  const d = et - st;
  const css = `
#p2-lab{top:470px;}
#p2-t{position:absolute;left:0;width:${W}px;top:520px;text-align:center;font-family:"Saira Semi Condensed",Arial,sans-serif;font-weight:800;font-size:132px;line-height:1;text-transform:uppercase;text-shadow:0 0 40px rgba(255,255,255,.3);}
#p2-s{position:absolute;left:0;width:${W}px;top:700px;text-align:center;font-family:"Poppins",Arial,sans-serif;font-weight:600;font-size:40px;line-height:1.25;}
#p2-s b{font-weight:800;color:${PINK};}
#p2-lg{top:900px;}`;
  const body = `
    <div id="p2-lab" class="lab">Então…</div>
    <div id="p2-t">Se prepara!</div>
    <div id="p2-s">talvez você ainda <b>não saiba disso</b></div>
    <div id="p2-lg" class="legal">${OBS.eleg} ${OBS.analise}</div>`;
  const js = [
    fadeUp("#p2-lab", L(T.entao), { y: 24 }),
    `    tl.fromTo("#p2-t",{opacity:0,scale:2.2},{opacity:1,scale:1,duration:0.24,ease:"power4.in"},${L(T.prepara - 0.16)});`,
    `    tl.fromTo("#p2-t",{x:0},{keyframes:[{x:-10,duration:0.04},{x:8,duration:0.04},{x:-4,duration:0.04},{x:0,duration:0.05}],immediateRender:false},${L(T.prepara + 0.08)});`,
    fadeUp("#p2-s", L(T.talvez - 0.1), { y: 24 }),
    legalIn(id),
    outUp("#p2-lab,#p2-t,#p2-s,#p2-lg", r3(d - 0.24), 0.22),
  ].join("\n");
  addScene(id, st, d, css, body, js);
}

// ═════════════ p3 · "A Bradesco Saúde trouxe… nova opção de plano para empresas, de 3 até 199 pessoas." ═════════════
{
  const id = "p3";
  const [st, et] = PANELS[id];
  const L = (t) => r3(t - st);
  const d = et - st;
  const css = `
#p3-logo{position:absolute;left:270px;width:540px;top:452px;height:112px;display:flex;align-items:center;justify-content:center;}
#p3-reg{position:absolute;left:0;width:${W}px;top:588px;display:flex;justify-content:center;}
#p3-reg>div{display:flex;align-items:center;gap:12px;padding:8px 26px 8px 10px;border-radius:40px;background:rgba(58,4,16,.9);border:2px solid rgba(255,255,255,.8);font-family:"Poppins",Arial,sans-serif;font-weight:600;font-size:30px;white-space:nowrap;}
#p3-reg .ci{width:48px;height:48px;border-radius:50%;background:#fff;display:flex;align-items:center;justify-content:center;}
#p3-emp{top:668px;font-size:52px;}
#p3-num{position:absolute;left:0;width:${W}px;top:724px;text-align:center;font-family:"Montserrat",Arial,sans-serif;font-weight:900;font-size:120px;line-height:1;color:#fff;text-shadow:0 0 40px rgba(255,255,255,.3);white-space:nowrap;}
#p3-num small{font-size:56px;font-family:"Saira Semi Condensed",Arial,sans-serif;font-weight:800;text-transform:uppercase;letter-spacing:.01em;}
#p3-lg{top:900px;}`;
  const body = `
    <div id="p3-logo" class="wcard"><div class="lgsv" style="width:290px">${BRAD_SVG}</div></div>
    <div id="p3-reg"><div><span class="ci">${icon("pin", 30, RED)}</span>Novidade na nossa região</div></div>
    <div id="p3-emp" class="pt">Plano para empresas</div>
    <div id="p3-num"><small>de</small> <span id="p3-a">3</span> <small>a</small> <span id="p3-b">3</span> <small>pessoas</small></div>
    <div id="p3-lg" class="legal">${OBS.eleg} ${OBS.analise}</div>`;
  const js = [
    popIn("#p3-logo", L(T.a - 0.02), { s: 0.5 }),
    popIn("#p3-reg", L(T.regiao - 0.15), { s: 0.6 }),
    fadeUp("#p3-emp", L(T.empresas - 0.15), { y: 26 }),
    popIn("#p3-num", L(T.n3 - 0.15), { s: 0.6, d: 0.36 }),
    `    const cnt={v:3};`,
    `    tl.fromTo(cnt,{v:3},{v:199,duration:0.5,ease:"power2.in",onUpdate:()=>{document.getElementById("p3-b").textContent=Math.round(cnt.v);}},${L(T.n199 - 0.42)});`,
    `    tl.fromTo("#p3-num",{scale:1},{scale:1.1,duration:0.12,ease:"power2.out",yoyo:true,repeat:1,immediateRender:false},${L(T.n199 + 0.1)});`,
    legalIn(id),
    outUp("#p3-logo,#p3-reg,#p3-emp,#p3-num,#p3-lg", r3(d - 0.24), 0.22),
  ].join("\n");
  addScene(id, st, d, css, body, js);
}

// ═════════════ p4 · "Um plano com abrangência nacional, excelentes hospitais e … tratamento de alto custo" ═════════════
{
  const id = "p4";
  const [st, et] = PANELS[id];
  const L = (t) => r3(t - st);
  const d = et - st;
  const ROWS = [["globe", "Abrangência nacional", T.abrangencia], ["hosp", "Excelentes hospitais", T.excelentes], ["shield", "Tratamentos de alto custo", T.alto]];
  const css = `
#p4-lab{top:452px;}
#p4-t{top:494px;font-size:62px;}
.p4-r{position:absolute;left:100px;width:880px;height:92px;display:flex;align-items:center;gap:22px;padding:0 24px;}
.p4-r .rdot{width:64px;height:64px;}
.p4-r b{flex:1;font-family:"Saira Semi Condensed",Arial,sans-serif;font-weight:800;font-size:44px;text-transform:uppercase;line-height:1;color:${INK};}
.p4-r .ok{width:56px;height:56px;border-radius:50%;background:#16a34a;display:flex;align-items:center;justify-content:center;flex:none;}
#p4-lg{top:900px;}`;
  const body = `
    <div id="p4-lab" class="lab">Bradesco Saúde empresarial</div>
    <div id="p4-t" class="pt">Um plano com</div>
    ${ROWS.map(([ic, txt], i) => `<div class="p4-r wcard" id="p4-r${i}" style="top:${586 + i * 104}px"><span class="rdot">${icon(ic, 38, "#fff")}</span><b>${txt}</b><span class="ok" id="p4-k${i}">${icon("check", 34, "#fff")}</span></div>`).join("\n    ")}
    <div id="p4-lg" class="legal">${OBS.cob} ${OBS.rede} ${OBS.disp}</div>`;
  const js = [
    fadeUp("#p4-lab", L(T.um), { y: 24 }),
    popIn("#p4-t", L(T.um + 0.05), { s: 0.7, d: 0.36 }),
    ...ROWS.flatMap(([, , t], i) => [
      `    tl.fromTo("#p4-r${i}",{opacity:0,x:${i % 2 ? 120 : -120}},{opacity:1,x:0,duration:0.38,ease:"power3.out"},${L(t - 0.2)});`,
      popIn(`#p4-k${i}`, L(t + 0.12), { s: 0.2, d: 0.32 }),
    ]),
    legalIn(id),
    outUp("#p4-lab,#p4-t,.p4-r,#p4-lg", r3(d - 0.24), 0.22),
  ].join("\n");
  addScene(id, st, d, css, body, js);
}

// ═════════════ p5 · "E olha, um custo que tenho certeza que vai surpreender você." ═════════════
{
  const id = "p5";
  const [st, et] = PANELS[id];
  const L = (t) => r3(t - st);
  const css = `
#p5-lab{top:452px;}
#p5-g{position:absolute;left:340px;top:500px;width:400px;height:220px;}
#p5-g svg{width:100%;height:100%;overflow:visible;}
#p5-nd{position:absolute;left:196px;top:30px;width:8px;height:176px;border-radius:4px;background:#fff;transform-origin:50% 100%;box-shadow:0 0 12px rgba(255,255,255,.6);}
#p5-hub{position:absolute;left:180px;top:186px;width:40px;height:40px;border-radius:50%;background:#fff;}
.p5-x{position:absolute;top:226px;font-family:"Poppins",Arial,sans-serif;font-weight:600;font-size:26px;}
#p5-t{top:770px;font-size:56px;}
#p5-t2{top:830px;font-size:44px;color:${PINK};}
#p5-lg{top:900px;}`;
  const body = `
    <div id="p5-lab" class="lab">E olha…</div>
    <div id="p5-g" data-layout-allow-overflow>
      <svg viewBox="0 0 400 220"><path d="M30 200 A170 170 0 0 1 370 200" fill="none" stroke="rgba(255,255,255,.25)" stroke-width="26" stroke-linecap="round"/><path id="p5-arc" d="M30 200 A170 170 0 0 1 370 200" fill="none" stroke="#fff" stroke-width="26" stroke-linecap="butt" pathLength="100" stroke-dasharray="100" stroke-dashoffset="100"/></svg>
      <span id="p5-nd"></span><span id="p5-hub"></span>
      <span class="p5-x" style="left:0">baixo</span><span class="p5-x" style="right:0">alto</span>
    </div>
    <div id="p5-t" class="pt">Um custo que vai</div>
    <div id="p5-t2" class="pt">surpreender você</div>
    <div id="p5-lg" class="legal">${OBS.ref} ${OBS.faixa}</div>`;
  const js = [
    fadeUp("#p5-lab", L(T.olha - 0.05), { y: 24 }),
    `    tl.fromTo("#p5-g",{opacity:0,scale:0.8},{opacity:1,scale:1,duration:0.4,ease:"back.out(1.6)"},${L(T.custo2 - 0.3)});`,
    `    tl.fromTo("#p5-nd",{rotation:70},{rotation:70,duration:0.01},${L(T.custo2 - 0.3)});`,
    `    tl.fromTo("#p5-arc",{attr:{"stroke-dashoffset":100}},{attr:{"stroke-dashoffset":12},duration:0.6,ease:"power2.out"},${L(T.custo2 - 0.1)});`,
    `    tl.to("#p5-nd",{rotation:-45,duration:0.7,ease:"back.out(1.4)"},${L(T.surpreender - 0.2)});`,
    `    tl.to("#p5-arc",{attr:{"stroke-dashoffset":78},duration:0.7,ease:"power2.out"},${L(T.surpreender - 0.2)});`,
    fadeUp("#p5-t", L(T.custo2), { y: 24 }),
    fadeUp("#p5-t2", L(T.surpreender - 0.1), { y: 24 }),
    legalIn(id),
    outUp("#p5-lab,#p5-g,#p5-t,#p5-t2,#p5-lg", r3(S2 - st - 0.05), 0.22),
  ].join("\n");
  addScene(id, st, et - st, css, body, js);
}

// ═════════════ p6 · CTA ═════════════
{
  const id = "p6";
  const [st] = PANELS[id];
  const L = (t) => r3(t - st);
  const css = `
#p6-t{top:452px;font-size:58px;}
.p6-ch{position:absolute;top:452px;width:58px;height:58px;color:#fff;}
#p6-bt{position:absolute;left:100px;width:880px;top:542px;height:156px;border-radius:40px;background:#fff;color:${INK};display:flex;align-items:center;gap:26px;padding:0 40px;box-shadow:0 20px 44px rgba(40,0,10,.45),0 0 0 6px rgba(255,255,255,.25);}
#p6-bt .rdot{width:92px;height:92px;}
#p6-bt b{display:block;font-family:"Montserrat",Arial,sans-serif;font-weight:900;font-size:50px;line-height:1.02;color:${RED};}
#p6-bt i{display:block;font-style:normal;font-family:"Poppins",Arial,sans-serif;font-weight:600;font-size:30px;opacity:.85;margin-top:6px;}
#p6-rip{position:absolute;left:452px;top:582px;width:80px;height:80px;border-radius:50%;border:5px solid ${RED};opacity:0;}
#p6-req{position:absolute;left:0;width:${W}px;top:726px;display:flex;justify-content:center;}
#p6-req>div{display:flex;align-items:center;gap:12px;padding:8px 26px 8px 10px;border-radius:40px;background:rgba(58,4,16,.9);border:2px solid rgba(255,255,255,.8);font-family:"Poppins",Arial,sans-serif;font-weight:600;font-size:28px;white-space:nowrap;}
#p6-req .ok{width:44px;height:44px;border-radius:50%;background:#16a34a;display:flex;align-items:center;justify-content:center;}
#p6-lg{top:800px;}`;
  const body = `
    <span id="p6-a1" class="p6-ch ic" style="left:50px">${ICON.down}</span><span id="p6-a2" class="p6-ch ic" style="left:972px">${ICON.down}</span>
    <div id="p6-t" class="pt">Clique no botão abaixo</div>
    <div id="p6-bt"><span class="rdot">${icon("form", 54, "#fff")}</span><div><b>SOLICITE SUA COTAÇÃO</b><i>Preencha o formulário</i></div></div>
    <span id="p6-rip"></span>
    <div id="p6-req"><div><span class="ok">${icon("check", 28, "#fff")}</span>Exclusivo para CNPJ/MEI · a partir de 3 vidas</div></div>
    <div id="p6-lg" class="legal">${LEGAL_FIM}</div>`;
  const js = [
    fadeUp("#p6-t", L(T.clica - 0.08), { y: 30 }),
    `    tl.fromTo("#p6-a1,#p6-a2",{opacity:0,y:-18},{opacity:1,y:10,duration:0.45,ease:"sine.inOut",yoyo:true,repeat:7},${L(T.clica)});`,
    popIn("#p6-bt", L(T.clica + 0.3), { s: 0.7, d: 0.45 }),
    `    tl.fromTo("#p6-bt",{scale:1},{scale:0.95,duration:0.1,ease:"power2.out",yoyo:true,repeat:1,immediateRender:false},${L(T.cotacao - 0.05)});`,
    `    tl.fromTo("#p6-rip",{opacity:0.9,scale:0.4},{opacity:0,scale:4,duration:0.6,ease:"power2.out"},${L(T.cotacao - 0.02)});`,
    fadeUp("#p6-req", L(T.cotacao + 0.4), { y: 24 }),
    `    tl.fromTo("#p6-lg",{opacity:0},{opacity:1,duration:0.4},0.5);`,
  ].join("\n");
  addScene(id, st, D - st, css, body, js);
}

// ═════════════ lf · texto legal nas partes em tela cheia ═════════════
{
  const a0 = 0.3, a1 = S1 + 0.1, b0 = S2 + 0.3, b1 = S3 + 0.05;
  const css = `
.lf{position:absolute;left:0;width:${W}px;top:1340px;display:flex;justify-content:center;}
.lf>div{max-width:900px;padding:8px 20px;border-radius:14px;background:rgba(58,4,16,.82);text-align:center;font-family:"Poppins",Arial,sans-serif;font-weight:500;font-size:19px;line-height:1.32;color:#fff;}`;
  const body = `
    <div class="lf clip" id="lf-a" style="top:496px" data-start="${r3(a0)}" data-duration="${r3(a1 - a0)}" data-track-index="0"><div id="lf-ai">${OBS.eleg} ${OBS.analise}</div></div>
    <div class="lf clip" id="lf-b" data-start="${r3(b0)}" data-duration="${r3(b1 - b0)}" data-track-index="0"><div id="lf-bi">${OBS.ref} ${OBS.perfil}</div></div>`;
  const js = [
    `    tl.fromTo("#lf-ai",{opacity:0},{opacity:1,duration:0.3},${r3(a0)});`,
    `    tl.to("#lf-ai",{opacity:0,duration:0.2},${r3(a1 - 0.22)});`,
    `    tl.fromTo("#lf-bi",{opacity:0},{opacity:1,duration:0.3},${r3(b0)});`,
    `    tl.to("#lf-bi",{opacity:0,duration:0.2},${r3(b1 - 0.22)});`,
  ].join("\n");
  addScene("lf", 0, D, css, body, js, { track: 7, z: 6 });
}

// ═════════════ cap · legendas palavra a palavra ═════════════
{
  const EMPH = new Set(["bradesco", "top", "caro", "prepara", "regiao", "empresas", "3", "199", "abrangencia", "nacional", "hospitais", "alto", "custo", "surpreender", "empresa", "mais", "botao", "cotacao", "economizar"]);
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
  let html = "";
  const js = [];
  groups.forEach((g, gi) => {
    const s = r3(Math.max(0.12, g[0].start - 0.06));
    const nextStart = groups[gi + 1] ? groups[gi + 1][0].start - 0.06 : D;
    const e = r3(Math.min(nextStart, g[g.length - 1].end + 0.35, D));
    const top = split(g[0].start) ? 966 + OFF : 1190; // acima da tarja "João Olegario" que o vídeo traz no começo
    const chars = g.map(disp).join(" ").length;
    const fs = Math.max(46, Math.min(70, Math.floor(900 / (chars * 0.74))));
    html += `    <div class="cg clip" id="cg${gi}" data-start="${s}" data-duration="${r3(e - s)}" data-track-index="0" style="top:${top}px"><div class="gi" id="cg${gi}i" style="font-size:${fs}px">${g
      .map((w) => `<span class="w${EMPH.has(norm(w.word)) ? " em" : ""}" id="cw${w.i}">${disp(w)}</span>`)
      .join(" ")}</div></div>\n`;
    js.push(`    tl.fromTo("#cg${gi}i",{opacity:0,y:22,scale:0.9},{opacity:1,y:0,scale:1,duration:0.14,ease:"power3.out"},${s});`);
    g.forEach((w) => {
      const em = EMPH.has(norm(w.word));
      js.push(`    tl.fromTo("#cw${w.i}",{scale:1},{scale:${em ? 1.14 : 1.06},duration:0.1,ease:"power2.out",yoyo:true,repeat:1},${r3(w.start)});`);
      if (!em) {
        js.push(`    tl.set("#cw${w.i}",{color:"${RED}"},${r3(w.start)});`);
        js.push(`    tl.set("#cw${w.i}",{color:"${INK}"},${r3(Math.min(w.end, e - 0.01))});`);
      }
    });
    js.push(`    tl.to("#cg${gi}i",{opacity:0,duration:0.1,ease:"power2.in"},${r3(Math.max(s + 0.15, e - 0.1))});`);
  });
  const css = `
.cg{position:absolute;left:0;width:${W}px;text-align:center;}
.gi{display:inline-block;max-width:960px;padding:10px 26px 14px;border-radius:22px;background:rgba(255,255,255,.96);box-shadow:0 12px 30px rgba(40,0,10,.35);font-family:"Montserrat",Arial,sans-serif;font-weight:900;line-height:1.08;color:${INK};letter-spacing:.005em;}
.gi .w{display:inline-block;margin:0 .07em;}
.gi .em{color:${RED};}`;
  addScene("cap", 0, D, css, html, js.join("\n"), { track: 6, kind: "captions", z: 7 });
}

// ═════════════ raiz: vídeo, painel, cenas e áudio ═════════════
const sfx = [];
const hitOf = (k) => (HITS[k.replace(/2$/, "")] || { hit: 0 }).hit;
const durOf = (k) => (HITS[k.replace(/2$/, "")] || { dur: 1 }).dur;
const S = (k, t, vol = 0.5, dur) => sfx.push({ k, t: r3(t + 1 / 30 - hitOf(k)), vol, dur: dur || durOf(k) });
S("pop2", T.bradesco, 0.35);
S("whoosh", S1 + 0.25, 0.4);
S("card", T.ah, 0.35);
S("pop", T.caro - 0.1, 0.4);
S("whoosh2", PANELS.p2[0], 0.3);
S("stamp", T.prepara - 0.02, 0.5);
S("riser", T.a + 0.06, 0.4);
S("impact", T.a + 0.06, 0.55);
S("pop2", T.regiao, 0.4);
S("counter", T.n199 - 0.42, 0.3, 0.5);
S("pop", T.n199 + 0.08, 0.45);
S("whoosh2", PANELS.p4[0], 0.3);
S("check", T.abrangencia + 0.12, 0.45); S("check", T.excelentes + 0.12, 0.45); S("check", T.alto + 0.12, 0.45);
S("whoosh", PANELS.p5[0], 0.3);
S("shimmer", T.surpreender - 0.2, 0.35);
S("whoosh", S2 + 0.2, 0.4);
S("pop2", T.mais, 0.35);
S("whoosh2", S3 + 0.25, 0.4);
S("pop", T.clica + 0.55, 0.4);
S("tap", T.cotacao - 0.02, 0.55);
sfx.sort((a, b) => a.t - b.t);
const laneEnd = [0, 0, 0];
sfx.forEach((s) => { let l = laneEnd.findIndex((e) => e <= s.t); if (l < 0) l = laneEnd.length - 1; s.lane = 12 + l; laneEnd[l] = s.t + s.dur; });

const R = [];
R.push(`      tl.set("#pbg",{y:-1260},0);`);
R.push(`      tl.set("#vw",{y:${FULL_Y},scale:1,transformOrigin:"${ORIGIN}"},0);`);
R.push(`      tl.fromTo("#vw",{scale:1},{scale:1.035,duration:${r3(T.contar - 0.05)},ease:"none"},0);`);
R.push(`      tl.to("#vw",{scale:1.07,duration:0.18,ease:"power3.out"},${r3(T.contar - 0.05)});`);
R.push(`      tl.to("#vw",{scale:1.1,duration:0.18,ease:"power3.out"},${r3(T.bradesco - 0.05)});`);
const toSplit = (t) => [
  `      tl.to("#vw",{y:${SPLIT_Y},scale:1,duration:${MOVE},ease:"power3.inOut"},${t});`,
  `      tl.to("#pbg",{y:0,duration:${MOVE},ease:"power3.inOut"},${t});`,
];
R.push(...toSplit(S1));
R.push(`      tl.to("#vw",{scale:1.02,duration:${r3(S2 - S1 - MOVE)},ease:"none"},${r3(S1 + MOVE)});`);
R.push(`      tl.to("#vw",{y:${FULL_Y},scale:1.04,duration:${MOVE},ease:"power3.inOut"},${S2});`);
R.push(`      tl.to("#pbg",{y:-1260,duration:${MOVE},ease:"power3.inOut"},${S2});`);
R.push(`      tl.to("#vw",{scale:1.1,duration:0.18,ease:"power3.out"},${r3(T.mais - 0.05)});`);
R.push(...toSplit(S3));
R.push(`      tl.to("#vw",{scale:1.02,duration:${r3(D - S3 - MOVE)},ease:"none"},${r3(S3 + MOVE)});`);

const hosts = scenes.map((s) => `      <div id="${s.id}" data-composition-id="${s.id}" data-composition-src="compositions/${s.id}.html" data-start="${s.st}" data-duration="${s.dur}" data-track-index="${s.track}" data-track-kind="${s.kind}" data-width="${W}" data-height="${H}" style="position:absolute;inset:0;z-index:${s.z}"></div>`).join("\n");
const audio = [
  `      <audio id="a-voice" class="clip" data-start="0" data-duration="${D}" data-track-index="10" data-volume="1" src="assets/audio/voice.wav"></audio>`,
  `      <audio id="a-bgm" class="clip" data-start="0" data-duration="${D}" data-track-index="11" data-volume="1.4" src="assets/audio/bgm_duck.wav"></audio>`,
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
      html, body { width: ${W}px; height: ${H}px; overflow: hidden; background: ${RED_D}; }
      #root { position: relative; width: ${W}px; height: ${H}px; overflow: hidden; background: linear-gradient(180deg, ${RED} 0%, ${RED_D} 22%, ${RED_DD} 100%); }
      #vw { position: absolute; left: 0; top: 0; width: ${W}px; height: ${H}px; z-index: 1; }
      #v-src { position: absolute; left: 0; top: 0; width: ${W}px; height: ${H}px; object-fit: cover; }
      #pbg { position: absolute; left: 0; top: 0; width: ${W}px; height: ${1120 + OFF}px; z-index: 2; border-radius: 0 0 56px 56px; overflow: hidden;
        background: radial-gradient(120% 70% at 50% 30%, #DA1840 0%, #B30A2C 42%, ${RED_D} 100%); box-shadow: 0 30px 70px rgba(40,0,10,.55); }
      #pbg-grid { position: absolute; inset: 0; opacity: .6;
        background-image: linear-gradient(rgba(255,255,255,.06) 2px, transparent 2px), linear-gradient(90deg, rgba(255,255,255,.06) 2px, transparent 2px);
        background-size: 60px 60px; }
      #pbg-line { position: absolute; left: 0; right: 0; bottom: 0; height: 6px; background: linear-gradient(90deg, rgba(255,255,255,0), #fff, rgba(255,255,255,0)); }
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="${D}" data-width="${W}" data-height="${H}">
      <div id="vw">
        <video id="v-src" class="clip" data-start="0" data-duration="${D}" data-track-index="0" muted playsinline src="assets/video/src.mp4"></video>
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
