// build.mjs — variação 3 (benefícios, viajantes) do anúncio "Vila Nova Star pelo CNPJ/MEI" (story 9:16).
// Público: empresários e viajantes frequentes da capital de SP, CNPJ/MEI, 3 vidas ou mais. Foco nos benefícios de um
// plano empresarial com o Vila Nova Star na rede (material comercial do SulAmérica Especial Mais): seguro viagem
// nacional e internacional, abrangência nacional, atendimento médico por vídeo e check-up no Vila Nova Star.
// Visual de viagem, diferente das variações 1 e 2: painel de partidas (âmbar sobre azul-noite), cartões de embarque
// brancos e o hospital visto por uma janela de avião. Voz: Roberta.
//   node tools/build.mjs   (ou bash tools/assemble.sh, que também faz o carve da trilha)

import { W, H, D, r3, at, seq, fontFaces, wspans, baseCss, scene, video, TL, icon, OBS, LEGAL_ALL, SRC_TXT, NET_TXT, uiScene, writeOutput } from "./core.mjs";

const NAV = "#0B1E33"; // azul-noite
const NAV2 = "#13304F";
const AMB = "#FFB81C"; // âmbar de painel de aeroporto
const PAPER = "#FAF8F3"; // cartão de embarque
const TILE = "#0E1520";

const FONTS = fontFaces([
  ["Saira", 500, "SairaSemiCondensed-normal-500"],
  ["Saira", 700, "SairaSemiCondensed-normal-700"],
  ["Saira", 800, "SairaSemiCondensed-normal-800"],
  ["Mont", 800, "Montserrat-800"],
  ["Mont", 900, "Montserrat-900"],
  ["Poppins", 400, "Poppins-normal-400"],
  ["Poppins", 500, "Poppins-normal-500"],
  ["Poppins", 600, "Poppins-normal-600"],
]);

const CLIP = { w_fachada: 2.77, w_letreiro: 2.1, w_vista: 2.37, w_lobby: 2.77, w_medica: 1.67, w_centro: 2.1, w_corredor: 2.97, w_quarto01: 1.87 };

const css0 = (p) =>
  FONTS +
  baseCss(p) +
  `
#${p}-root{font-family:"Poppins",Arial,sans-serif;color:#fff;background:radial-gradient(90% 60% at 50% 40%,${NAV2},${NAV} 70%);}
.sa{font-family:"Saira",Arial,sans-serif;font-weight:800;text-transform:uppercase;line-height:1;}
.am{color:${AMB};}
.legal{position:absolute;left:80px;width:${W - 160}px;text-align:center;font-size:20px;line-height:1.4;color:rgba(255,255,255,.9);}
.port{position:absolute;overflow:hidden;border-radius:200px;border:18px solid #E9EDF3;box-shadow:0 0 0 6px #C9D1DC,0 30px 70px rgba(0,0,0,.5),inset 0 0 30px rgba(0,0,0,.35);}
.port .vw{position:absolute;inset:0;}
.pass{position:absolute;background:${PAPER};color:${NAV};border-radius:26px;box-shadow:0 26px 60px rgba(0,0,0,.45);}
.perf{position:absolute;top:18px;bottom:18px;width:0;border-left:4px dashed rgba(11,30,51,.25);}
.lbl{font-family:"Poppins";font-weight:600;font-size:22px;letter-spacing:.12em;color:rgba(11,30,51,.6);text-transform:uppercase;}
.val{font-family:"Saira";font-weight:800;font-size:44px;text-transform:uppercase;line-height:1.05;}
`;

// ───────────── tempos (absolutos, da locução) ─────────────
const T = {};
T.voce = at("voce");
T.mala = at("mala");
T.reunioes = at("reunioes");
T.voos = at("voos");
T.exterior = at("exterior");
T.entao = at("entao");
T.plano1 = at("plano", T.entao);
T.precisa = at("precisa");
T.viajar = at("viajar");
T.pelo = at("pelo");
T.cnpj1 = at("cnpj");
T.empresarial = at("empresarial");
T.vila1 = at("vila", T.empresarial);
T.rede = at("rede", T.vila1);
T.inclui = at("inclui");
T.um = at("um", T.inclui);
T.seguro = at("seguro");
T.nacional1 = at("nacional", T.seguro);
T.internacional = at("internacional");
T.dois = at("dois");
T.abrang = at("abrangencia");
T.atendido = at("atendido");
T.brasil = at("brasil");
T.tres1 = at("tres", T.brasil);
T.atendimento = at("atendimento", T.tres1);
T.video = at("video");
T.celular = at("celular");
T.e4 = at("e", T.celular);
T.checkup = at("checkup");
T.vila2 = at("vila", T.checkup);
T.tudo = at("tudo");
T.so = at("so", T.tudo);
T.voce3 = at("voce", T.so);
T.socios = at("socios");
T.familia = at("familia");
T.se = at("se", T.familia);
T.cnpj2 = at("cnpj", T.se);
T.tres2 = at("tres", T.cnpj2);
T.gente = at("gente");
T.opcoes = at("opcoes");
T.quais = at("quais");
T.beneficios = at("beneficios");
T.clica = at("clica");
T.preenche = at("preenche");
T.formulario = at("formulario");

const ST = {
  s1: 0,
  s2: r3(T.entao - 0.1),
  s3: r3(T.pelo - 0.1),
  b1: r3(T.um - 0.1),
  b2: r3(T.dois - 0.1),
  b3: r3(T.tres1 - 0.1),
  b4: r3(T.e4 - 0.1),
  s5: r3(T.tudo - 0.1),
  s6: r3(T.se - 0.1),
  en: r3(T.clica - 0.1),
};
const ORDER = ["s1", "s2", "s3", "b1", "b2", "b3", "b4", "s5", "s6", "en"];
const DUR = Object.fromEntries(ORDER.map((k, i) => [k, r3((i < ORDER.length - 1 ? ST[ORDER[i + 1]] : D) - ST[k] + (i < ORDER.length - 1 ? 0.04 : 0))]));

const scenes = [];
const push = (p, css, body, a) => scenes.push({ st: ST[p], track: 1, ...scene(p, DUR[p], css, body, a) });

function seqClips(p, list) {
  let html = "", anim = [];
  list.forEach(([name, t0, t1]) => {
    if (t1 - t0 > CLIP[name] + 0.01) throw new Error(`${p}: ${name} tem ${CLIP[name]} s, trecho pede ${r3(t1 - t0)} s`);
  });
  list.forEach(([name, t0, t1, z0 = 1.0, z1 = 1.08], i) => {
    const id = `${p}-v${i}`;
    html += `<div class="vw" id="${id}w" data-layout-allow-overflow>${video(id, name, t0, r3(Math.min(CLIP[name], t1 - t0 + 0.04)))}</div>`;
    anim.push(`tl.fromTo("#${id}w",{scale:${z0}},{scale:${z1},duration:${r3(t1 - t0 + 0.04)},ease:"none"},${r3(t0)});`);
  });
  return { html, anim };
}
const fadeUp = (add, sel, t, d = 0.45, y = 30) =>
  add(`tl.fromTo("${sel}",{y:${y},opacity:0},{y:0,opacity:1,duration:${d},ease:"power3.out"},${r3(Math.max(0, t))});`);
const pop = (add, sel, t, s0 = 0.6) =>
  add(`tl.fromTo("${sel}",{scale:${s0},opacity:0},{scale:1,opacity:1,duration:0.38,ease:"back.out(2)"},${r3(Math.max(0, t))});`);

// painel de partidas: uma linha = blocos de letras (cada bloco gira no eixo X para "virar" a letra)
const tiles = (id, text, w = 30) =>
  [...text].map((ch, i) => `<span class="tl" id="${id}${i}" style="width:${w}px">${ch === " " ? "&nbsp;" : ch}</span>`).join("");

// ═════════════ s1 · gancho: "Você vive com a mala pronta, entre reuniões em outras cidades e voos pro exterior?" ═════════════
{
  const p = "s1";
  const { a, L, add } = TL(ST[p]);
  const rows = [
    ["07:40", "RIO DE JANEIRO", "CONFIRMADO"],
    ["09:15", "BRASILIA      ", "CONFIRMADO"],
    ["13:30", "RECIFE        ", "CONFIRMADO"],
    ["22:30", "NOVA YORK     ", "EMBARQUE  "],
  ];
  const css = css0(p) + `
#s1-board{position:absolute;left:60px;top:540px;width:960px;padding:22px 20px 26px;border-radius:22px;background:#05090F;box-shadow:0 24px 60px rgba(0,0,0,.55),inset 0 0 0 2px rgba(255,184,28,.25);}
#s1-bh{display:flex;align-items:center;gap:14px;font-family:"Saira";font-weight:700;font-size:34px;letter-spacing:.18em;color:${AMB};margin:0 4px 16px;}
.s1-r{display:flex;gap:16px;margin-top:10px;}
.s1-c{display:flex;gap:3px;}
.tl{display:inline-flex;justify-content:center;align-items:center;height:50px;background:${TILE};border-radius:5px;font-family:"Saira";font-weight:700;font-size:36px;color:#F4F1E8;box-shadow:inset 0 -24px 0 rgba(255,255,255,.03);}
.s1-st .tl{color:${AMB};}
#s1-a{top:1030px;font-size:50px;font-weight:600;}
#s1-b{top:1094px;font-size:132px;color:${AMB};}
#s1-c{top:1244px;font-size:40px;font-weight:500;color:#DCE3EC;}
#s1-d{top:1298px;font-size:40px;font-weight:500;color:#DCE3EC;}
#s1-lg{top:1452px;}
`;
  const body = `
  <div id="s1-board">
    <div id="s1-bh">${icon("plane", 40, { color: AMB, fill: AMB, sw: 1 })}<span>PARTIDAS</span></div>
    ${rows.map((r, i) => `<div class="s1-r" id="s1-r${i}"><div class="s1-c">${tiles(`s1t${i}a`, r[0], 26)}</div><div class="s1-c">${tiles(`s1t${i}b`, r[1], 30)}</div><div class="s1-c s1-st">${tiles(`s1t${i}c`, r[2], 26)}</div></div>`).join("")}
  </div>
  <div id="s1-a" class="ln">Você vive com a</div>
  <div id="s1-b" class="ln sa">mala pronta?</div>
  <div id="s1-c" class="ln">${wspans("s1c", "entre reuniões em outras cidades")}</div>
  <div id="s1-d" class="ln">${wspans("s1d", "e voos pro exterior?")}</div>
  <div id="s1-lg" class="legal">${OBS.eleg} ${OBS.img}</div>`;
  // as letras do status giram em sequência (a última linha "EMBARQUE" pisca)
  rows.forEach((r, i) => {
    [...r[2]].forEach((_, k) => add(`tl.fromTo("#s1t${i}c${k}",{rotationX:-90},{rotationX:0,duration:0.18,ease:"power2.out"},${r3(0.15 + i * 0.35 + k * 0.03)});`));
  });
  add(`tl.to("#s1-r3 .s1-st",{opacity:0.35,duration:0.3,repeat:7,yoyo:true,ease:"steps(1)"},1.8);`);
  add(`tl.fromTo("#s1-b",{scale:1.06},{scale:1,duration:1.2,ease:"power3.out"},0);`);
  const { words } = TL(ST[p]);
  const w2 = TL(ST[p]);
  w2.words("s1c", seq("entre reunioes em outras cidades", at("entre")), 0.4);
  w2.words("s1d", seq("e voos pro exterior", at("e", at("cidades"))), 0.4);
  w2.a.forEach(add);
  push(p, css, body, a);
}

// ═════════════ s2 · "Então o seu plano de saúde precisa viajar com você." ═════════════
{
  const p = "s2";
  const { a, L, add, words } = TL(ST[p]);
  const css = css0(p) + `
#s2-a{top:560px;font-size:46px;font-weight:600;}
#s2-b{top:626px;font-size:98px;color:${AMB};}
#s2-c{top:726px;font-size:98px;color:${AMB};}
#s2-pass{left:90px;top:872px;width:900px;height:420px;overflow:hidden;}
#s2-pass .hd{position:absolute;left:0;top:0;width:100%;height:84px;background:${NAV};color:#fff;display:flex;align-items:center;gap:14px;padding:0 34px;font-family:"Saira";font-weight:700;font-size:34px;letter-spacing:.16em;}
#s2-pass .perf{left:640px;top:100px;}
.s2-f{position:absolute;left:40px;}
#s2-f0{top:116px;}#s2-f1{top:206px;}#s2-f2{top:296px;}
#s2-stub{position:absolute;left:672px;top:110px;width:200px;height:290px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;}
#s2-stub .ok{width:110px;height:110px;border-radius:50%;background:${AMB};display:flex;align-items:center;justify-content:center;}
#s2-stub .t{font-family:"Saira";font-weight:800;font-size:30px;text-align:center;line-height:1.05;}
#s2-lg{top:1452px;}
`;
  const body = `
  <div id="s2-a" class="ln">${wspans("s2a", "Então o seu plano de saúde")}</div>
  <div id="s2-b" class="ln sa">${wspans("s2b", "precisa viajar")}</div>
  <div id="s2-c" class="ln sa">${wspans("s2c", "com você.")}</div>
  <div class="pass" id="s2-pass">
    <div class="hd">${icon("plane", 40, { color: AMB, fill: AMB, sw: 1 })}<span>CARTÃO DE EMBARQUE</span></div>
    <div class="s2-f" id="s2-f0"><div class="lbl">Passageiro</div><div class="val">Você</div></div>
    <div class="s2-f" id="s2-f1"><div class="lbl">Destino</div><div class="val">Onde o trabalho levar</div></div>
    <div class="s2-f" id="s2-f2"><div class="lbl">Na bagagem</div><div class="val">Plano de saúde</div></div>
    <div class="perf"></div>
    <div id="s2-stub"><div class="ok">${icon("check", 70, { color: NAV, sw: 6 })}</div><div class="t">EMBARQUE<br/>LIBERADO</div></div>
  </div>
  <div id="s2-lg" class="legal">${OBS.img}</div>`;
  words("s2a", seq("entao o seu plano de saude", T.entao), 0.38);
  words("s2b", seq("precisa viajar", T.precisa), 0.42);
  words("s2c", seq("com voce", T.precisa), 0.42);
  add(`tl.fromTo("#s2-pass",{y:260,opacity:0,rotation:-4},{y:0,opacity:1,rotation:0,duration:0.6,ease:"power4.out"},${r3(L(T.plano1) - 0.2)});`);
  [0, 1, 2].forEach((i) => fadeUp(add, `#s2-f${i}`, L(T.plano1) + 0.2 + i * 0.25, 0.35, 14));
  add(`tl.fromTo("#s2-stub .ok",{scale:0,rotation:-30},{scale:1,rotation:0,duration:0.45,ease:"back.out(2.4)"},${r3(L(T.viajar) + 0.1)});`);
  push(p, css, body, a);
}

// ═════════════ s3 · "Pelo CNPJ, tem plano empresarial com o Vila Nova Star na rede que já inclui:" ═════════════
{
  const p = "s3";
  const { a, L, add, words } = TL(ST[p]);
  const v = seqClips(p, [["w_fachada", 0, 1.7], ["w_lobby", 1.7, 3.3], ["w_letreiro", 3.3, DUR[p]]]);
  const css = css0(p) + `
#s3-port{left:300px;top:520px;width:480px;height:620px;}
#s3-k{top:1172px;font-family:"Saira";font-weight:700;font-size:34px;letter-spacing:.22em;color:${AMB};}
#s3-a{top:1218px;font-size:40px;font-weight:500;}
#s3-b{top:1270px;font-size:78px;}
#s3-c{top:1360px;font-size:40px;font-weight:600;color:${AMB};}
#s3-lg{top:1430px;}
`;
  const body = `
  <div class="port" id="s3-port">${v.html}</div>
  <div id="s3-k" class="ln">PELO CNPJ</div>
  <div id="s3-a" class="ln">${wspans("s3a", "plano empresarial com o")}</div>
  <div id="s3-b" class="ln sa">${wspans("s3b", "Vila Nova Star na rede")}</div>
  <div id="s3-c" class="ln">${wspans("s3c", "que já inclui:")}</div>
  <div id="s3-lg" class="legal">${OBS.rede} ${OBS.varia} ${OBS.img}</div>`;
  v.anim.forEach(add);
  add(`tl.fromTo("#s3-port",{scale:0.8,opacity:0},{scale:1,opacity:1,duration:0.55,ease:"back.out(1.6)"},0);`);
  fadeUp(add, "#s3-k", L(T.pelo) - 0.05, 0.35, 14);
  words("s3a", seq("plano empresarial com o", at("plano", T.cnpj1)), 0.38);
  words("s3b", seq("vila nova star na rede", T.vila1), 0.42);
  words("s3c", seq("que ja inclui", at("que", T.rede)), 0.38);
  push(p, css, body, a);
}

// ═════════════ b1–b4 · os 4 benefícios: visual próprio + canhoto de cartão de embarque ═════════════
function benefit(p, n, { title, sub, tTitle, tSub, visCss, visHtml, visAnim, legal }) {
  const { a, L, add } = TL(ST[p]);
  const css = css0(p) + `
#${p}-pg{position:absolute;left:0;width:${W}px;top:520px;display:flex;justify-content:center;align-items:center;gap:14px;font-family:"Saira";font-weight:700;font-size:28px;letter-spacing:.18em;color:#C9D4E2;}
.${p}-dot{width:16px;height:16px;border-radius:50%;background:rgba(255,255,255,.25);}
.${p}-dot.on{background:${AMB};}
#${p}-stub{left:90px;top:1140px;width:900px;height:236px;display:flex;overflow:hidden;}
#${p}-stub .nb{width:220px;height:100%;background:${NAV};color:${AMB};display:flex;flex-direction:column;align-items:center;justify-content:center;}
#${p}-stub .nb b{font-family:"Saira";font-weight:800;font-size:110px;line-height:1;}
#${p}-stub .nb i{font-style:normal;font-family:"Saira";font-weight:700;font-size:22px;letter-spacing:.2em;color:#C9D4E2;}
#${p}-stub .tx{flex:1;padding:0 34px;display:flex;flex-direction:column;justify-content:center;gap:6px;}
#${p}-stub .t1{font-family:"Saira";font-weight:800;font-size:56px;text-transform:uppercase;line-height:1;}
#${p}-stub .t2{font-family:"Poppins";font-weight:500;font-size:32px;color:#3B4A5E;line-height:1.15;}
#${p}-lg{top:1408px;}
${visCss}`;
  const body = `
  <div id="${p}-pg"><span>BENEFÍCIO</span>${[1, 2, 3, 4].map((k) => `<div${k === n ? ` id="${p}-cur"` : ""} class="${p}-dot${k <= n ? " on" : ""}"></div>`).join("")}</div>
  ${visHtml}
  <div class="pass" id="${p}-stub"><div class="nb"><i>Nº</i><b>0${n}</b></div><div class="tx"><div class="t1">${title}</div><div class="t2" id="${p}-sub">${sub}</div></div></div>
  <div id="${p}-lg" class="legal">${legal}</div>`;
  add(`tl.fromTo("#${p}-stub",{x:${n % 2 ? 140 : -140},opacity:0},{x:0,opacity:1,duration:0.5,ease:"power3.out"},${r3(Math.max(0, L(tTitle) - 0.15))});`);
  fadeUp(add, `#${p}-sub`, L(tSub) - 0.05, 0.35, 12);
  add(`tl.fromTo("#${p}-cur",{scale:0.4},{scale:1,duration:0.3,ease:"back.out(3)"},0.05);`);
  visAnim({ add, L });
  return { a, css, body };
}

{
  const p = "b1";
  const it = benefit(p, 1, {
    title: "Seguro viagem",
    sub: "nacional e internacional",
    tTitle: T.seguro,
    tSub: T.nacional1,
    visCss: `
#b1-vis{position:absolute;left:290px;top:600px;width:500px;height:500px;}
#b1-gl{position:absolute;left:100px;top:100px;width:300px;height:300px;}
#b1-orb{position:absolute;left:0;top:0;width:500px;height:500px;border-radius:50%;border:3px dashed rgba(255,184,28,.45);}
#b1-pl{position:absolute;left:226px;top:-24px;}
#b1-n{position:absolute;left:0;top:430px;padding:10px 22px;border-radius:30px;background:#fff;color:${NAV};font-family:"Saira";font-weight:800;font-size:34px;}
#b1-i{position:absolute;right:-40px;top:20px;padding:10px 22px;border-radius:30px;background:${AMB};color:${NAV};font-family:"Saira";font-weight:800;font-size:34px;}`,
    visHtml: `<div id="b1-vis"><div id="b1-gl">${icon("globe", 300, { color: "#DCE3EC", sw: 1.6 })}</div><div id="b1-orb"><div id="b1-pl">${icon("plane", 54, { color: AMB, fill: AMB, sw: 1 })}</div></div><div id="b1-n">NACIONAL</div><div id="b1-i">INTERNACIONAL</div></div>`,
    visAnim: ({ add, L }) => {
      add(`tl.fromTo("#b1-vis",{scale:0.8,opacity:0},{scale:1,opacity:1,duration:0.5,ease:"back.out(1.6)"},0);`);
      add(`tl.fromTo("#b1-orb",{rotation:0},{rotation:300,duration:${DUR[p]},ease:"none"},0);`);
      pop(add, "#b1-n", L(T.nacional1) - 0.05);
      pop(add, "#b1-i", L(T.internacional) - 0.05);
    },
    legal: `Seguro viagem nacional e internacional incluído em planos específicos, conforme regras da operadora. ${OBS.cob}`,
  });
  push(p, it.css, it.body, it.a);
}

{
  const p = "b2";
  const codes = ["GRU", "GIG", "BSB", "CNF", "POA", "CWB", "REC", "SSA", "FOR", "BEL", "MAO", "FLN"];
  const it = benefit(p, 2, {
    title: "Abrangência nacional",
    sub: "atendido onde você estiver no Brasil",
    tTitle: T.abrang,
    tSub: T.atendido,
    visCss: `
#b2-vis{position:absolute;left:120px;top:600px;width:840px;display:grid;grid-template-columns:repeat(4,1fr);gap:18px;}
.b2-c{height:140px;border-radius:16px;background:#05090F;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;box-shadow:inset 0 0 0 2px rgba(255,255,255,.08);}
.b2-c b{font-family:"Saira";font-weight:800;font-size:56px;color:#5B6B80;line-height:1;}
.b2-c i{font-style:normal;width:14px;height:14px;border-radius:50%;background:#2A3B52;}`,
    visHtml: `<div id="b2-vis">${codes.map((c, i) => `<div class="b2-c" id="b2-c${i}"><b id="b2-k${i}">${c}</b><i id="b2-d${i}"></i></div>`).join("")}</div>`,
    visAnim: ({ add, L }) => {
      add(`tl.fromTo("#b2-vis",{y:40,opacity:0},{y:0,opacity:1,duration:0.45,ease:"power3.out"},0);`);
      codes.forEach((_, i) => {
        const t = r3(L(T.abrang) + 0.1 + i * 0.16);
        add(`tl.to("#b2-k${i}",{color:"${AMB}",duration:0.15},${t});`);
        add(`tl.to("#b2-d${i}",{backgroundColor:"#3DDC84",duration:0.15},${t});`);
        add(`tl.fromTo("#b2-c${i}",{scale:1},{scale:1.06,duration:0.12,yoyo:true,repeat:1},${t});`);
      });
    },
    legal: `${OBS.cob} ${OBS.varia} Siglas de aeroportos meramente ilustrativas.`,
  });
  push(p, it.css, it.body, it.a);
}

{
  const p = "b3";
  const it = benefit(p, 3, {
    title: "Médico por vídeo",
    sub: "atendimento direto do celular",
    tTitle: T.atendimento,
    tSub: T.celular,
    visCss: `
#b3-ph{position:absolute;left:350px;top:580px;width:380px;height:540px;border-radius:48px;background:#05090F;border:10px solid #2A3B52;box-shadow:0 30px 70px rgba(0,0,0,.55);overflow:hidden;}
#b3-sc{position:absolute;inset:0;background:linear-gradient(180deg,#1B3A5E,#0F2440);}
#b3-av{position:absolute;left:95px;top:70px;width:170px;height:170px;border-radius:50%;background:#E9EDF3;display:flex;align-items:center;justify-content:center;}
#b3-nm{position:absolute;left:0;width:100%;top:262px;text-align:center;font-family:"Poppins";font-weight:600;font-size:28px;}
#b3-tm{position:absolute;left:0;width:100%;top:304px;text-align:center;font-family:"Saira";font-weight:700;font-size:30px;color:#3DDC84;letter-spacing:.08em;}
#b3-me{position:absolute;right:14px;top:62px;width:80px;height:108px;border-radius:14px;background:#2A3B52;border:2px solid rgba(255,255,255,.3);display:flex;align-items:center;justify-content:center;}
#b3-bt{position:absolute;left:0;width:100%;bottom:26px;display:flex;justify-content:center;gap:30px;}
#b3-bt span{width:70px;height:70px;border-radius:50%;display:flex;align-items:center;justify-content:center;}
#b3-rec{position:absolute;left:24px;top:22px;display:flex;align-items:center;gap:8px;font-family:"Poppins";font-weight:600;font-size:22px;}
#b3-rec i{width:14px;height:14px;border-radius:50%;background:#FF4D4D;}`,
    visHtml: `<div id="b3-ph"><div id="b3-sc"></div>
      <div id="b3-rec"><i id="b3-dot"></i><span>Consulta por vídeo</span></div>
      <div id="b3-av">${icon("stetho", 110, { color: NAV, sw: 3 })}</div>
      <div id="b3-nm">Médico na tela</div><div id="b3-tm">● conectado</div>
      <div id="b3-me">${icon("person", 50, { color: "#DCE3EC", sw: 3 })}</div>
      <div id="b3-bt"><span style="background:#2A3B52">${icon("video", 38, { color: "#fff", sw: 3.4 })}</span><span style="background:#FF4D4D">${icon("phone", 38, { color: "#fff", sw: 3.4 })}</span></div>
    </div>`,
    visAnim: ({ add, L }) => {
      add(`tl.fromTo("#b3-ph",{y:200,opacity:0,rotation:6},{y:0,opacity:1,rotation:0,duration:0.6,ease:"power4.out"},0);`);
      pop(add, "#b3-av", L(T.video) - 0.2, 0.3);
      add(`tl.fromTo("#b3-dot",{opacity:1},{opacity:0.2,duration:0.4,repeat:7,yoyo:true,ease:"steps(1)"},0.3);`);
    },
    legal: `Atendimento por vídeo (telemedicina) oferecido como serviço da operadora em planos específicos, conforme regras do plano. ${OBS.cob} ${OBS.img}`,
  });
  push(p, it.css, it.body, it.a);
}

{
  const p = "b4";
  const v = seqClips(p, [["w_medica", 0, 1.62], ["w_centro", 1.62, DUR[p]]]);
  const it = benefit(p, 4, {
    title: "Check-up",
    sub: "no próprio Vila Nova Star",
    tTitle: T.checkup,
    tSub: T.vila2,
    visCss: `#b4-port{left:320px;top:580px;width:440px;height:540px;}`,
    visHtml: `<div class="port" id="b4-port">${v.html}</div>`,
    visAnim: ({ add }) => {
      v.anim.forEach(add);
      add(`tl.fromTo("#b4-port",{scale:0.8,opacity:0},{scale:1,opacity:1,duration:0.5,ease:"back.out(1.6)"},0);`);
    },
    legal: `Check-up no Hospital Vila Nova Star incluído em planos específicos para empresas, conforme regras da operadora. ${OBS.rede} ${OBS.img}`,
  });
  push(p, it.css, it.body, it.a);
}

// ═════════════ s5 · "Tudo isso num plano só, pra você, seus sócios e a sua família." ═════════════
{
  const p = "s5";
  const { a, L, add, words } = TL(ST[p]);
  const css = css0(p) + `
#s5-a{top:556px;font-size:46px;font-weight:600;}
#s5-b{top:620px;font-size:104px;color:${AMB};}
#s5-pass{left:90px;top:780px;width:900px;height:560px;overflow:hidden;}
#s5-pass .hd{position:absolute;left:0;top:0;width:100%;height:84px;background:${NAV};color:#fff;display:flex;align-items:center;justify-content:space-between;padding:0 34px;font-family:"Saira";font-weight:700;font-size:32px;letter-spacing:.14em;}
#s5-ic{position:absolute;left:0;width:100%;top:118px;display:flex;justify-content:center;gap:26px;}
.s5-i{width:150px;height:150px;border-radius:24px;background:${NAV};display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;}
.s5-i span{font-family:"Saira";font-weight:700;font-size:20px;color:#C9D4E2;letter-spacing:.06em;}
#s5-pl{position:absolute;left:40px;top:316px;}
#s5-px{position:absolute;left:40px;top:362px;display:flex;gap:18px;}
.s5-p{display:flex;align-items:center;gap:10px;padding:10px 22px;border-radius:40px;border:3px solid ${NAV};font-family:"Saira";font-weight:800;font-size:40px;text-transform:uppercase;}
#s5-ft{position:absolute;left:40px;top:470px;font-family:"Poppins";font-weight:600;font-size:28px;color:#3B4A5E;}
#s5-lg{top:1430px;}
`;
  const ic = [["plane", "VIAGEM"], ["globe", "NACIONAL"], ["video", "VÍDEO"], ["stetho", "CHECK-UP"]];
  const body = `
  <div id="s5-a" class="ln">${wspans("s5a", "Tudo isso num")}</div>
  <div id="s5-b" class="ln sa">${wspans("s5b", "plano só")}</div>
  <div class="pass" id="s5-pass">
    <div class="hd"><span>1 PLANO · 4 BENEFÍCIOS</span>${icon("plane", 40, { color: AMB, fill: AMB, sw: 1 })}</div>
    <div id="s5-ic">${ic.map(([k, t], i) => `<div class="s5-i" id="s5-i${i}">${icon(k, 64, { color: AMB, fill: k === "plane" ? AMB : "none", sw: k === "plane" ? 1 : 3.2 })}<span>${t}</span></div>`).join("")}</div>
    <div id="s5-pl" class="lbl">Passageiros</div>
    <div id="s5-px"><div class="s5-p" id="s5-p0">${icon("person", 40, { color: NAV, sw: 3.6 })}Você</div><div class="s5-p" id="s5-p1">${icon("people", 40, { color: NAV, sw: 3.4 })}Sócios</div><div class="s5-p" id="s5-p2">${icon("family", 40, { color: NAV, sw: 3.2 })}Família</div></div>
    <div id="s5-ft">contratação pelo CNPJ da sua empresa</div>
  </div>
  <div id="s5-lg" class="legal">${OBS.cob} ${OBS.eleg}</div>`;
  words("s5a", seq("tudo isso num", T.tudo), 0.38);
  words("s5b", seq("plano so", at("plano", T.tudo)), 0.42);
  add(`tl.fromTo("#s5-pass",{y:220,opacity:0},{y:0,opacity:1,duration:0.55,ease:"power4.out"},0.05);`);
  [0, 1, 2, 3].forEach((i) => pop(add, `#s5-i${i}`, 0.3 + i * 0.12, 0.4));
  [T.voce3, T.socios, T.familia].forEach((t, i) => pop(add, `#s5-p${i}`, L(t) - 0.1));
  fadeUp(add, "#s5-ft", L(T.familia) + 0.3, 0.35, 10);
  push(p, css, body, a);
}

// ═════════════ s6 · "Se você tem CNPJ ou MEI e três vidas ou mais, a gente compara as opções…" ═════════════
{
  const p = "s6";
  const { a, L, add, words } = TL(ST[p]);
  const css = css0(p) + `
#s6-a{top:540px;font-size:44px;font-weight:600;}
.s6-tag{position:absolute;left:0;width:${W}px;display:flex;justify-content:center;}
.s6-tag>div{display:flex;align-items:center;gap:14px;padding:12px 32px;border-radius:60px;background:#fff;color:${NAV};font-family:"Mont";font-weight:900;font-size:46px;white-space:nowrap;}
#s6-t0{top:604px;}#s6-t1{top:704px;}
#s6-b{top:828px;font-size:44px;font-weight:600;color:${AMB};}
.s6-op{position:absolute;left:110px;width:860px;height:118px;border-radius:20px;background:${PAPER};color:${NAV};display:flex;align-items:center;gap:20px;padding:0 28px;}
.s6-op .nm{font-family:"Saira";font-weight:800;font-size:40px;width:220px;text-transform:uppercase;}
.s6-op .bx{display:flex;gap:14px;}
.s6-op .bx span{width:66px;height:66px;border-radius:14px;display:flex;align-items:center;justify-content:center;}
#s6-o0{top:900px;}#s6-o1{top:1036px;}#s6-o2{top:1172px;}
#s6-badge{position:absolute;right:130px;top:1014px;padding:8px 18px;border-radius:30px;background:${AMB};color:${NAV};font-family:"Mont";font-weight:900;font-size:28px;white-space:nowrap;}
#s6-lg{top:1320px;}
`;
  const ops = [["Opção A", [1, 1, 0, 0]], ["Opção B", [1, 1, 1, 1]], ["Opção C", [1, 0, 1, 0]]];
  const ic = ["plane", "globe", "video", "stetho"];
  const op = (i, [nm, has]) =>
    `<div class="s6-op" id="s6-o${i}"><div class="nm">${nm}</div><div class="bx">${has
      .map((h, k) => `<span style="background:${h ? NAV : "#E3E7EC"}">${icon(h ? ic[k] : "x", 40, { color: h ? AMB : "#9AA6B4", fill: h && ic[k] === "plane" ? AMB : "none", sw: h && ic[k] === "plane" ? 1 : 3.6 })}</span>`)
      .join("")}</div></div>`;
  const body = `
  <div id="s6-a" class="ln">${wspans("s6a", "Se você tem")}</div>
  <div class="s6-tag" id="s6-t0"><div>${icon("check", 40, { color: AMB, sw: 6 })}<span>CNPJ ou MEI</span></div></div>
  <div class="s6-tag" id="s6-t1"><div>${icon("check", 40, { color: AMB, sw: 6 })}<span>3 vidas ou mais</span></div></div>
  <div id="s6-b" class="ln">${wspans("s6b", "a gente compara as opções")}</div>
  ${ops.map((o, i) => op(i, o)).join("")}
  <div id="s6-badge">TEM OS 4 BENEFÍCIOS</div>
  <div id="s6-lg" class="legal">${OBS.eleg} ${OBS.analise} ${OBS.faixa} ${OBS.perfil} ${OBS.varia} ${OBS.cob} Opções ilustrativas.</div>`;
  words("s6a", seq("se voce tem", T.se), 0.38);
  [T.cnpj2, T.tres2].forEach((t, i) => add(`tl.fromTo("#s6-t${i}",{x:-90,opacity:0},{x:0,opacity:1,duration:0.42,ease:"back.out(1.6)"},${r3(L(t) - 0.12)});`));
  words("s6b", seq("a gente compara as opcoes", at("a", T.tres2)), 0.38);
  [0, 1, 2].forEach((i) => add(`tl.fromTo("#s6-o${i}",{x:90,opacity:0},{x:0,opacity:1,duration:0.4,ease:"power3.out"},${r3(L(T.opcoes) + 0.1 + i * 0.2)});`));
  add(`tl.to("#s6-o0,#s6-o2",{opacity:0.45,duration:0.3},${r3(L(T.quais) - 0.05)});`);
  add(`tl.to("#s6-o1",{scale:1.04,boxShadow:"0 0 0 4px ${AMB},0 20px 50px rgba(0,0,0,.4)",duration:0.3,ease:"back.out(2)"},${r3(L(T.quais) - 0.05)});`);
  pop(add, "#s6-badge", L(T.beneficios) - 0.2, 0.3);
  push(p, css, body, a);
}

// ═════════════ en · CTA: "Clica no link, preenche o formulário e receba sua cotação." ═════════════
{
  const p = "en";
  const { a, L, add } = TL(ST[p]);
  const css = css0(p) + `
#en-band{position:absolute;left:0;width:${W}px;top:250px;display:flex;justify-content:center;}
#en-band>div{padding:14px 44px 16px;border-radius:12px;background:${AMB};color:${NAV};font-family:"Mont";font-weight:900;font-size:64px;line-height:1;letter-spacing:.02em;white-space:nowrap;}
#en-seal{position:absolute;left:0;width:${W}px;top:366px;display:flex;justify-content:center;}
#en-seal>div{display:flex;align-items:center;gap:16px;padding:12px 34px 12px 14px;border-radius:60px;background:#fff;color:${NAV};font-family:"Mont";font-weight:900;font-size:44px;white-space:nowrap;}
#en-seal .sh{width:64px;height:64px;border-radius:50%;background:${NAV};display:flex;align-items:center;justify-content:center;}
#en-sub{position:absolute;left:0;width:${W}px;top:474px;display:flex;justify-content:center;}
#en-sub>div{padding:8px 26px;border-radius:30px;background:rgba(255,255,255,.12);border:2px solid rgba(255,184,28,.6);font-family:"Poppins";font-weight:600;font-size:30px;color:#fff;white-space:nowrap;}
#en-port{left:405px;top:552px;width:270px;height:284px;border-width:12px;}
#en-port img{width:100%;height:100%;object-fit:cover;}
#en-t{top:860px;font-size:70px;}
#en-n{top:938px;font-size:38px;font-weight:600;color:${AMB};}
#en-btn{position:absolute;left:110px;top:998px;width:860px;height:142px;border-radius:80px;background:${AMB};color:${NAV};display:flex;align-items:center;justify-content:center;gap:24px;box-shadow:0 18px 50px rgba(255,184,28,.3);}
#en-bt{font-family:"Mont";font-weight:900;font-size:52px;line-height:1.05;}
#en-bt small{display:block;font-family:"Poppins";font-weight:600;font-size:26px;}
#en-ar{position:absolute;left:0;width:${W}px;top:1158px;display:flex;justify-content:center;align-items:center;gap:14px;font-family:"Mont";font-weight:800;font-size:34px;}
#en-lg{top:1212px;font-size:19px;line-height:1.32;}
`;
  const body = `
  <div id="en-band"><div>PLANOS DE SAÚDE</div></div>
  <div id="en-seal"><div><div class="sh">${icon("shield", 42, { color: AMB, sw: 3.6 })}</div><span>EXCLUSIVO PARA CNPJ/MEI</span></div></div>
  <div id="en-sub"><div>a partir de 3 vidas · capital de São Paulo</div></div>
  <div class="port" id="en-port"><img src="assets/img/fachada.jpg" alt="Fachada do Hospital Vila Nova Star" /></div>
  <div id="en-t" class="ln sa">O plano que viaja com você</div>
  <div id="en-n" class="ln">com o Vila Nova Star na rede</div>
  <div id="en-btn">${icon("form", 72, { color: NAV, sw: 3.6 })}<div id="en-bt">Solicite sua cotação<small>Preencha o formulário</small></div></div>
  <div id="en-ar">${icon("down", 38, { color: AMB, sw: 5 })}<span>Clique no link abaixo</span>${icon("down", 38, { color: AMB, sw: 5 })}</div>
  <div id="en-lg" class="legal">${NET_TXT} ${SRC_TXT} ${LEGAL_ALL} ${OBS.oferta}</div>`;
  fadeUp(add, "#en-band", 0.02, 0.4, 20);
  fadeUp(add, "#en-seal", 0.1, 0.4, 20);
  fadeUp(add, "#en-sub", 0.18, 0.4, 16);
  add(`tl.fromTo("#en-port",{scale:0.8,opacity:0},{scale:1,opacity:1,duration:0.5,ease:"back.out(1.6)"},0.22);`);
  add(`tl.fromTo("#en-port img",{scale:1.15},{scale:1,duration:${DUR[p]},ease:"none"},0);`);
  fadeUp(add, "#en-t", 0.32, 0.45, 20);
  fadeUp(add, "#en-n", 0.42, 0.45, 16);
  add(`tl.fromTo("#en-btn",{scale:0.6,opacity:0},{scale:1,opacity:1,duration:0.45,ease:"back.out(2)"},${r3(L(T.preenche) - 0.25)});`);
  for (let i = 0; i < 4; i++) add(`tl.to("#en-btn",{scale:1.05,duration:0.22,yoyo:true,repeat:1,ease:"sine.inOut"},${r3(L(T.formulario) + 0.45 + i * 1.3)});`);
  add(`tl.fromTo("#en-ar",{y:20,opacity:0},{y:0,opacity:1,duration:0.4},${r3(L(T.formulario) + 0.1)});`);
  add(`tl.fromTo("#en-ar svg",{y:-8},{y:8,duration:0.45,yoyo:true,repeat:9,ease:"sine.inOut"},${r3(L(T.formulario) + 0.5)});`);
  add(`tl.fromTo("#en-lg",{opacity:0},{opacity:1,duration:0.5},0.4);`);
  push(p, css, body, a);
}

// ═════════════ cabeçalho fixo (s1 → s6): PLANOS DE SAÚDE + EXCLUSIVO PARA CNPJ/MEI ═════════════
{
  const p = "hd";
  const { a, add } = TL(0);
  const css =
    FONTS +
    `#hd-root{position:absolute;inset:0;width:${W}px;height:${H}px;pointer-events:none;}
#hd-band{position:absolute;left:0;width:${W}px;top:250px;display:flex;justify-content:center;}
#hd-band>div{padding:12px 40px 14px;border-radius:12px;background:${AMB};color:${NAV};font-family:"Mont";font-weight:900;font-size:54px;line-height:1;letter-spacing:.02em;white-space:nowrap;box-shadow:0 10px 30px rgba(0,0,0,.35);}
#hd-seal{position:absolute;left:0;width:${W}px;top:348px;display:flex;justify-content:center;}
#hd-seal>div{display:flex;align-items:center;gap:14px;padding:10px 30px 10px 12px;border-radius:60px;background:#fff;color:${NAV};font-family:"Mont";font-weight:900;font-size:38px;white-space:nowrap;box-shadow:0 10px 30px rgba(0,0,0,.35);}
#hd-seal .sh{width:56px;height:56px;border-radius:50%;background:${NAV};display:flex;align-items:center;justify-content:center;}
#hd-sub{position:absolute;left:0;width:${W}px;top:438px;display:flex;justify-content:center;}
#hd-sub>div{padding:6px 22px;border-radius:26px;background:rgba(5,9,15,.85);border:2px solid rgba(255,184,28,.6);font-family:"Poppins";font-weight:600;font-size:26px;color:#fff;white-space:nowrap;}`;
  const body = `<div id="hd-band"><div>PLANOS DE SAÚDE</div></div>
  <div id="hd-seal"><div><div class="sh">${icon("shield", 36, { color: AMB, sw: 3.6 })}</div><span>EXCLUSIVO PARA CNPJ/MEI</span></div></div>
  <div id="hd-sub"><div>a partir de 3 vidas · capital de São Paulo</div></div>`;
  add(`tl.fromTo("#hd-seal",{scale:1},{scale:1.06,duration:0.18,yoyo:true,repeat:1,ease:"power2.out"},${r3(T.cnpj1)});`);
  add(`tl.fromTo("#hd-seal",{scale:1},{scale:1.06,duration:0.18,yoyo:true,repeat:1,ease:"power2.out",immediateRender:false},${r3(T.cnpj2)});`);
  scenes.push({ st: 0, track: 6, ...scene(p, ST.en + 0.04, css, body, a) });
}

scenes.push(uiScene([
  [ST.s2, 0.25],
  [ST.b1, 0.2],
  [ST.s5, 0.2],
  [ST.en, 0.25],
], { color: "255,236,200", grain: 0.04 }));

const SFX = [
  ["tap", 0.2, 0.25],
  ["tap", 0.55, 0.25],
  ["tap", 0.9, 0.25],
  ["tap", 1.25, 0.25],
  ["riser", T.entao - 0.05, 0.3],
  ["impact", T.entao, 0.35],
  ["card", T.plano1 - 0.2, 0.4],
  ["stamp", T.viajar + 0.1, 0.45],
  ["whoosh", ST.s3, 0.35],
  ["shimmer", T.vila1, 0.3],
  ["whoosh", ST.b1, 0.35],
  ["pop", T.nacional1, 0.3],
  ["pop", T.internacional, 0.3],
  ["whoosh", ST.b2, 0.35],
  ["counter", T.abrang + 0.1, 0.3],
  ["whoosh", ST.b3, 0.35],
  ["pop", T.video - 0.2, 0.3],
  ["whoosh", ST.b4, 0.35],
  ["shimmer", T.vila2, 0.3],
  ["card", ST.s5 + 0.05, 0.35],
  ["pop", T.voce3, 0.3],
  ["pop", T.socios, 0.3],
  ["pop", T.familia, 0.3],
  ["whoosh", ST.s6, 0.3],
  ["check", T.cnpj2, 0.4],
  ["check", T.tres2, 0.4],
  ["check", T.quais, 0.4],
  ["whoosh", ST.en, 0.35],
  ["chime", T.formulario, 0.35],
];

writeOutput(scenes, SFX, { bg: NAV });
