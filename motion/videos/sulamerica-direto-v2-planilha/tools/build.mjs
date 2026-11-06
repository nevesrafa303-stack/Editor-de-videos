// build.mjs — variação 2 do anúncio SulAmérica Direto Nacional 3 vidas, estilo planilha (story 9:16).
// Fundo claro e interface de planilha: os custos da empresa em dia, a linha que "não aparece"
// (emergência na família, conta sem limite), a virada para custo fixo pelo CNPJ/MEI, a cotação em
// formato de documento, a rede e o formulário. Tudo preso às palavras da locução (Roberta).
//   node tools/build.mjs   (ou bash tools/assemble.sh, que também faz o carve da trilha)

import {
  W, H, D, r3, at, seq, fontFaces, wspans, baseCss, scene, video, TL, rollHTML, icon,
  Q, QUOTE_TXT, HOSP_TXT, BP_CREDIT, OBS, LEGAL_ALL, uiScene, writeOutput,
} from "./core.mjs";

const BG = "#EEF2F7";
const NAVY = "#0C2148";
const SLATE = "#475569";
const LINE = "#D5DDE8";
const OR = "#F26B1D";
const ORD = "#C2410C";
const GR = "#166534";
const GRB = "#DCFCE7";
const RD = "#B91C1C";
const RDB = "#FEE2E2";
const XL = "#107C41";

const FONTS = fontFaces([
  ["Mont", 700, "Montserrat-700"],
  ["Mont", 800, "Montserrat-800"],
  ["Mont", 900, "Montserrat-900"],
  ["Poppins", 400, "Poppins-normal-400"],
  ["Poppins", 500, "Poppins-normal-500"],
  ["Poppins", 600, "Poppins-normal-600"],
]);

const css0 = (p) =>
  FONTS +
  baseCss(p) +
  `
#${p}-root{font-family:"Poppins",Arial,sans-serif;color:${NAVY};}
.mt{font-family:"Mont",Arial,sans-serif;}
.blk{position:absolute;left:90px;width:${W - 180}px;text-align:center;}
.legal{position:absolute;left:80px;width:${W - 160}px;text-align:center;font-size:20px;line-height:1.4;color:${SLATE};}
.card{position:absolute;background:#fff;border-radius:28px;box-shadow:0 24px 60px rgba(12,33,72,.14),0 2px 0 rgba(12,33,72,.04);}
.chip{display:inline-flex;align-items:center;gap:10px;padding:8px 20px;border-radius:40px;font-weight:600;font-size:28px;white-space:nowrap;}
.ok{background:${GRB};color:${GR};}
.bad{background:${RDB};color:${RD};}
`;

// tempos (absolutos, da locução)
const T = {};
T.voce = at("voce");
T.aluguel = at("aluguel");
T.folha = at("folha");
T.imposto = at("imposto");
T.mas = at("mas");
T.custo2 = at("custo", T.mas);
T.ate = at("ate", T.custo2);
T.uma = at("uma", T.ate);
T.emergencia = at("emergencia");
T.semp = at("sem", T.emergencia);
T.conta = at("conta", T.semp);
T.limite = at("limite");
T.pelo = at("pelo");
T.cnpj = at("cnpj", T.pelo);
T.ou = at("ou", T.cnpj);
T.mei = at("mei", T.ou);
T.voce3 = at("voce", T.mei);
T.custo3 = at("custo", T.voce3);
T.fixo = at("fixo");
T.prev = at("previsivel");
T.olha = at("olha");
T.sula = at("sulamerica");
T.direto = at("direto");
T.enf = at("enfermaria");
T.semc = at("sem", T.enf);
T.duas = at("duas");
T.uma2 = at("uma", T.duas + 2.4);
T.total = at("total");
T.mil = at("mil", T.total);
T.mes = at("mes", T.mil);
T.ja = at("ja", T.mes);
T.com = at("com", T.ja + 0.5);
T.hospitais = at("hospitais");
T.bp = at("bp");
T.sepaco = at("sepaco");
T.rede = at("rede", T.sepaco);
T.e6 = at("e", T.rede + 0.5);
T.consulta = at("consulta");
T.exame = at("exame");
T.clica = at("clica");
T.preenche = at("preenche");
T.formulario = at("formulario");
T.idades = at("idades");

const ST = { sh: 0, q: r3(T.olha - 0.1), rd: r3(T.com - 0.1), en: r3(T.clica - 0.1) };
const ORDER = ["sh", "q", "rd", "en"];
const DUR = Object.fromEntries(ORDER.map((k, i) => [k, r3((i < ORDER.length - 1 ? ST[ORDER[i + 1]] : D) - ST[k] + (i < ORDER.length - 1 ? 0.04 : 0))]));
const scenes = [];
const push = (p, css, body, a) => scenes.push({ st: ST[p], track: 1, ...scene(p, DUR[p], css, body, a) });
const fadeUp = (add, sel, t, d = 0.45, y = 30) =>
  add(`tl.fromTo("${sel}",{y:${y},opacity:0},{y:0,opacity:1,duration:${d},ease:"power3.out"},${r3(t)});`);
const fadeOut = (add, sel, t, d = 0.25) => add(`tl.to("${sel}",{opacity:0,y:-20,duration:${d},ease:"power2.in"},${r3(t)});`);

// ═════════════ fundo claro com a grade de planilha ═════════════
{
  const p = "bg";
  const { a, add } = TL(0);
  const css = `#bg-root{position:absolute;inset:0;width:${W}px;height:${H}px;overflow:hidden;background:linear-gradient(180deg,#F5F7FB 0%,${BG} 55%,#E4EAF2 100%);}
#bg-grid{position:absolute;left:0;top:-60px;}
.bg-gl{position:absolute;border-radius:50%;}
#bg-o{left:520px;top:-260px;width:900px;height:900px;background:radial-gradient(closest-side,rgba(242,107,29,.16),rgba(242,107,29,0));}
#bg-b{left:-380px;top:1100px;width:1100px;height:1100px;background:radial-gradient(closest-side,rgba(12,33,72,.1),rgba(12,33,72,0));}`;
  const body = `
  <svg id="bg-grid" width="${W}" height="${H + 120}" aria-hidden="true" data-layout-allow-overflow>
    <defs><pattern id="bg-pt" width="120" height="60" patternUnits="userSpaceOnUse"><path d="M120 0V60M0 60H120" fill="none" stroke="rgba(12,33,72,.05)" stroke-width="2"/></pattern></defs>
    <rect width="${W}" height="${H + 120}" fill="url(#bg-pt)"/></svg>
  <div id="bg-o" class="bg-gl" data-layout-allow-overflow aria-hidden="true"></div>
  <div id="bg-b" class="bg-gl" data-layout-allow-overflow aria-hidden="true"></div>`;
  add(`tl.fromTo("#bg-grid",{y:0},{y:60,duration:${D},ease:"none"},0);`);
  add(`tl.fromTo("#bg-o",{x:0,y:0},{x:-260,y:180,duration:${D},ease:"sine.inOut"},0);`);
  scenes.push({ st: 0, track: 0, ...scene(p, D, css, body, a) });
}

// ═════════════ sh · a planilha: custos em dia → o custo que não aparece → custo fixo pelo CNPJ/MEI ═════════════
{
  const p = "sh";
  const { a, L, add, words, shake } = TL(ST[p]);
  const ROWS = ["Aluguel", "Folha de pagamento", "Impostos"];
  const RH = 96;
  const css = css0(p) + `
#sh-h1a{top:330px;font-family:"Mont";font-weight:900;font-size:96px;line-height:1;}
#sh-h1b{top:448px;font-weight:600;font-size:48px;line-height:1.25;}
#sh-h2{top:350px;font-weight:700;font-size:54px;line-height:1.22;}
#sh-h3a{top:330px;font-family:"Mont";font-weight:900;font-size:84px;line-height:1;}
#sh-h3a b{color:${OR};font-weight:900;}
#sh-h3b{top:440px;font-weight:600;font-size:46px;line-height:1.25;}
#sh-win{left:70px;top:620px;width:940px;height:${64 + 56 + 4 * RH}px;overflow:hidden;}
#sh-tb{position:absolute;left:0;top:0;width:100%;height:64px;background:${XL};border-radius:28px 28px 0 0;display:flex;align-items:center;gap:12px;padding:0 26px;color:#fff;font-weight:600;font-size:26px;}
#sh-al{margin-left:auto;display:flex;align-items:center;gap:8px;padding:6px 16px;border-radius:30px;background:${RD};font-size:22px;font-weight:600;}
.sh-dot{width:16px;height:16px;border-radius:50%;background:rgba(255,255,255,.55);}
#sh-hd{position:absolute;left:0;top:64px;width:100%;height:56px;background:#F1F5F9;border-bottom:2px solid ${LINE};display:flex;font-weight:600;font-size:24px;color:${SLATE};}
.sh-n{width:64px;flex:none;display:flex;align-items:center;justify-content:center;border-right:2px solid ${LINE};color:${SLATE};font-size:24px;}
.sh-a{width:540px;flex:none;display:flex;align-items:center;padding:0 22px;border-right:2px solid ${LINE};}
.sh-b{flex:1;display:flex;align-items:center;padding:0 22px;}
.sh-r{position:absolute;left:0;width:100%;height:${RH}px;display:flex;border-bottom:2px solid ${LINE};font-weight:500;font-size:34px;color:${NAVY};background:#fff;}
#sh-r3f{position:absolute;inset:0;display:flex;background:#fff;}
#sh-r3b{position:absolute;inset:0;display:flex;background:#F0FDF4;}
#sh-sel{position:absolute;left:62px;top:120px;width:878px;height:${RH}px;border:4px solid ${XL};box-shadow:0 0 0 2px rgba(16,124,65,.2);pointer-events:none;}
#sh-cur{position:absolute;left:760px;top:680px;}
#sh-ph{color:#94A3B8;font-style:italic;}
#sh-mod{left:110px;top:690px;width:860px;height:760px;overflow:hidden;}
#sh-mh{position:absolute;left:0;top:0;width:100%;height:84px;background:${RD};color:#fff;display:flex;align-items:center;gap:16px;padding:0 30px;font-family:"Mont";font-weight:800;font-size:36px;}
.sh-vw{position:absolute;left:0;top:84px;width:860px;height:490px;overflow:hidden;}
#sh-mf{position:absolute;left:0;top:574px;width:100%;height:186px;display:flex;align-items:center;justify-content:space-between;padding:0 40px;}
#sh-mfl{font-weight:600;font-size:34px;color:${SLATE};line-height:1.2;}
#sh-inf{display:flex;align-items:center;gap:10px;font-family:"Mont";font-weight:900;font-size:64px;color:${RD};}
#sh-ch{left:70px;top:1150px;width:940px;height:300px;}
#sh-chl{position:absolute;left:36px;top:26px;font-family:"Mont";font-weight:800;font-size:30px;}
#sh-cleg{position:absolute;right:36px;top:30px;display:flex;gap:22px;font-weight:600;font-size:24px;}
#sh-cleg span{display:flex;align-items:center;gap:8px;}
#sh-cleg i{display:inline-block;width:26px;height:6px;border-radius:3px;}
#sh-svg{position:absolute;left:30px;top:66px;}
#sh-lg1,#sh-lg2{top:1474px;}
`;
  const row = (i, a2, b2) => `<div class="sh-r" id="sh-r${i}" style="top:${120 + i * RH}px"><div class="sh-n">${i + 1}</div><div class="sh-a">${a2}</div><div class="sh-b">${b2}</div></div>`;
  const okc = (t) => `<span class="chip ok">${icon("check", 26, { color: GR, sw: 5 })}${t}</span>`;
  const body = `
  <div id="sh-h1"><div id="sh-h1a" class="ln">Empresário,</div><div id="sh-h1b" class="blk">${wspans("sh1", "você controla cada custo da sua empresa, né?")}</div></div>
  <div id="sh-h2" class="blk">${wspans("sh2", "Mas tem um custo que não aparece em planilha nenhuma…")}</div>
  <div id="sh-h3"><div id="sh-h3a" class="ln">Pelo <b>CNPJ</b> ou <b>MEI</b>,</div><div id="sh-h3b" class="blk">${wspans("sh3", "você transforma esse risco num custo fixo e previsível.")}</div></div>
  <div id="sh-win" class="card">
    <div id="sh-tb"><span class="sh-dot"></span><span class="sh-dot"></span><span class="sh-dot"></span><span style="margin-left:12px">custos-da-empresa.xlsx</span><span id="sh-al">${icon("alert", 26, { color: "#fff", sw: 4 })}1 custo não previsto</span></div>
    <div id="sh-hd"><div class="sh-n"></div><div class="sh-a">A · Custo</div><div class="sh-b">B · Situação</div></div>
    ${ROWS.map((r, i) => row(i, r, `<span id="sh-s${i}">${okc("Em dia")}</span>`)).join("")}
    <div class="sh-r" id="sh-r3" style="top:${120 + 3 * RH}px">
      <div id="sh-r3e" style="position:absolute;inset:0;display:flex"><div class="sh-n">4</div><div class="sh-a"><span id="sh-ph">???</span></div><div class="sh-b"></div></div>
      <div id="sh-r3f"><div class="sh-n">4</div><div class="sh-a" style="color:${RD};font-weight:600">Emergência na família</div><div class="sh-b"><span class="chip bad">${icon("alert", 26, { color: RD, sw: 4 })}Não previsto</span></div></div>
      <div id="sh-r3b"><div class="sh-n">4</div><div class="sh-a" style="color:${GR};font-weight:600">Plano de saúde (CNPJ/MEI)</div><div class="sh-b">${okc("Custo fixo")}</div></div>
    </div>
    <div id="sh-sel"></div>
  </div>
  <div id="sh-mod" class="card">
    <div id="sh-mh">${icon("alert", 40, { sw: 4 })}<span>Emergência na família</span></div>
    <div class="vw sh-vw" id="sh-v1w">${video("sh-v1", "v-ambulancia", L(T.uma) - 0.1, L(T.semp) - L(T.uma) + 0.2)}</div>
    <div class="vw sh-vw" id="sh-v2w">${video("sh-v2", "v-soro", L(T.semp) - 0.05, L(T.pelo) - L(T.semp) + 0.1)}</div>
    <div id="sh-mf"><div id="sh-mfl">Conta da internação<br/>sem plano</div><div id="sh-inf">${icon("infinity", 84, { color: RD, sw: 4 })}<span>sem limite</span></div></div>
  </div>
  <div id="sh-cur">${icon("cursor", 64, { color: "#fff", fill: NAVY, sw: 2.5 })}</div>
  <div id="sh-ch" class="card">
    <div id="sh-chl">Gasto com saúde</div>
    <div id="sh-cleg"><span style="color:${RD}"><i style="background:${RD}"></i>Sem plano</span><span style="color:${GR}"><i style="background:${GR}"></i>Com plano</span></div>
    <svg id="sh-svg" width="880" height="230" viewBox="0 0 880 230" aria-hidden="true">
      <path d="M0 200H880" stroke="${LINE}" stroke-width="2"/>
      <path id="sh-lr" d="M10 170L120 160 200 175 280 60 340 150 450 165 520 20 580 140 690 170 760 90 870 150" fill="none" stroke="${RD}" stroke-width="7" stroke-linejoin="round" stroke-linecap="round" stroke-dasharray="1600" stroke-dashoffset="1600"/>
      <path id="sh-lg" d="M10 120H870" fill="none" stroke="${GR}" stroke-width="9" stroke-linecap="round" stroke-dasharray="900" stroke-dashoffset="900"/>
    </svg>
  </div>
  <div id="sh-lg1" class="legal">${OBS.img}</div>
  <div id="sh-lg2" class="legal">${OBS.eleg} ${OBS.analise}</div>`;
  // fase 1: custos em dia
  words("sh1", seq("voce controla cada custo da sua empresa ne", T.voce), 0.35);
  add(`tl.fromTo("#sh-al",{scale:1},{scale:1.12,duration:0.3,yoyo:true,repeat:15,ease:"sine.inOut"},0);`);
  add(`tl.set("#sh-s0,#sh-s1,#sh-s2,#sh-r0 .sh-a,#sh-r1 .sh-a,#sh-r2 .sh-a",{opacity:0},0);`);
  add(`tl.set("#sh-r3f,#sh-r3b,#sh-ph",{opacity:0},0);`);
  [T.aluguel, T.folha, T.imposto].forEach((t, i) => {
    add(`tl.to("#sh-sel",{y:${i * RH},duration:0.25,ease:"power2.out"},${r3(L(t) - 0.2)});`);
    add(`tl.to("#sh-cur",{x:${-40 + i * 6},y:${100 + i * RH},duration:0.3,ease:"power2.out"},${r3(L(t) - 0.25)});`);
    add(`tl.fromTo("#sh-r${i} .sh-a",{x:-30,opacity:0},{x:0,opacity:1,duration:0.3,ease:"power3.out"},${r3(L(t) - 0.05)});`);
    add(`tl.fromTo("#sh-s${i}",{scale:0.5,opacity:0},{scale:1,opacity:1,duration:0.3,ease:"back.out(2.4)"},${r3(L(t) + 0.2)});`);
  });
  // fase 2: o custo que não aparece
  fadeOut(add, "#sh-h1", L(T.mas) - 0.25);
  words("sh2", seq("mas tem um custo que nao aparece em planilha nenhuma", T.mas), 0.35);
  add(`tl.to("#sh-sel",{y:${3 * RH},duration:0.3,ease:"power2.out"},${r3(L(T.custo2))});`);
  add(`tl.to("#sh-cur",{x:-20,y:${100 + 3 * RH},duration:0.35,ease:"power2.out"},${r3(L(T.custo2) - 0.05)});`);
  add(`tl.fromTo("#sh-ph",{opacity:0},{opacity:1,duration:0.2,repeat:5,yoyo:true,ease:"steps(1)"},${r3(L(T.custo2) + 0.2)});`);
  add(`tl.set("#sh-ph",{opacity:1},${r3(L(T.custo2) + 1.45)});`);
  add(`tl.fromTo("#sh-r3f",{opacity:0,x:-20},{opacity:1,x:0,duration:0.25},${r3(L(T.emergencia) - 0.1)});`);
  add(`tl.set("#sh-r3e",{opacity:0},${r3(L(T.emergencia) + 0.15)});`);
  add(`tl.to("#sh-sel",{borderColor:"${RD}",duration:0.15},${r3(L(T.emergencia) - 0.1)});`);
  shake("#sh-win", r3(L(T.emergencia) + 0.05), 12);
  add(`tl.to("#sh-win",{opacity:0,scale:0.92,duration:0.3,ease:"power2.in"},${r3(L(T.uma) - 0.15)});`);
  add(`tl.fromTo("#sh-mod",{y:80,scale:0.9,opacity:0},{y:0,scale:1,opacity:1,duration:0.45,ease:"back.out(1.6)"},${r3(L(T.uma) - 0.1)});`);
  add(`tl.fromTo("#sh-v1w",{scale:1.05},{scale:1.15,duration:2,ease:"none"},${r3(L(T.uma) - 0.1)});`);
  add(`tl.fromTo("#sh-v2w",{opacity:0},{opacity:1,duration:0.2},${r3(L(T.semp) - 0.05)});`);
  add(`tl.fromTo("#sh-v2w",{scale:1.0},{scale:1.1,duration:3.3,ease:"none"},${r3(L(T.semp) - 0.05)});`);
  add(`tl.fromTo("#sh-mf",{opacity:0},{opacity:1,duration:0.3},${r3(L(T.semp))});`);
  add(`tl.fromTo("#sh-inf",{scale:0.5,opacity:0},{scale:1,opacity:1,duration:0.35,ease:"back.out(2.5)"},${r3(L(T.conta) - 0.05)});`);
  shake("#sh-mod", r3(L(T.limite)), 12);
  add(`tl.fromTo("#sh-lg1",{opacity:0},{opacity:1,duration:0.3},${r3(L(T.uma))});`);
  // fase 3: pelo CNPJ ou MEI, custo fixo e previsível
  add(`tl.to("#sh-mod",{scale:0.85,opacity:0,duration:0.3,ease:"power2.in"},${r3(L(T.pelo) - 0.3)});`);
  add(`tl.to("#sh-lg1",{opacity:0,duration:0.3},${r3(L(T.pelo) - 0.3)});`);
  add(`tl.to("#sh-win",{opacity:1,scale:1,duration:0.4,ease:"power3.out"},${r3(L(T.pelo) - 0.1)});`);
  fadeOut(add, "#sh-h2", L(T.pelo) - 0.3);
  add(`tl.to("#sh-al",{opacity:0,duration:0.3},${r3(L(T.voce3))});`);
  add(`tl.fromTo("#sh-h3a",{scale:1.3,opacity:0},{scale:1,opacity:1,duration:0.35,ease:"power4.out"},${r3(L(T.pelo) - 0.05)});`);
  words("sh3", seq("voce transforma esse risco num custo fixo e previsivel", T.voce3), 0.35);
  add(`tl.to("#sh-r3f",{rotationX:90,duration:0.2,ease:"power2.in"},${r3(L(T.voce3))});`);
  add(`tl.set("#sh-r3f",{opacity:0},${r3(L(T.voce3) + 0.2)});`);
  add(`tl.fromTo("#sh-r3b",{opacity:0,rotationX:-90},{opacity:1,rotationX:0,duration:0.3,ease:"power2.out"},${r3(L(T.voce3) + 0.2)});`);
  add(`tl.to("#sh-sel",{borderColor:"${XL}",duration:0.2},${r3(L(T.voce3) + 0.2)});`);
  add(`tl.fromTo("#sh-ch",{y:60,opacity:0},{y:0,opacity:1,duration:0.45,ease:"power3.out"},${r3(L(T.custo3) - 0.6)});`);
  add(`tl.fromTo("#sh-lr",{strokeDashoffset:1600},{strokeDashoffset:0,duration:0.9,ease:"none"},${r3(L(T.custo3) - 0.4)});`);
  add(`tl.fromTo("#sh-lg",{strokeDashoffset:900},{strokeDashoffset:0,duration:0.7,ease:"power2.out"},${r3(L(T.fixo) - 0.1)});`);
  add(`tl.to("#sh-lr",{opacity:0.35,duration:0.4},${r3(L(T.prev))});`);
  add(`tl.fromTo("#sh-lg2",{opacity:0},{opacity:1,duration:0.3},${r3(L(T.pelo))});`);
  add(`tl.to("#sh-cur",{opacity:0,duration:0.2},${r3(L(T.uma) - 0.1)});`);
  push(p, css, body, a);
}

// ═════════════ q · a cotação: "Olha essa cotação: SulAmérica Direto Nacional… Total: R$ 1.593,54 por mês, já com IOF." ═════════════
{
  const p = "q";
  const { a, L, add, words, shake, roll } = TL(ST[p]);
  const LH = 124;
  const css = css0(p) + `
#q-h{top:248px;font-family:"Mont";font-weight:800;font-size:66px;}
#q-doc{left:70px;top:350px;width:940px;height:1040px;overflow:hidden;}
#q-logo{position:absolute;left:40px;top:34px;width:330px;height:84px;}
#q-logo img{position:absolute;inset:0;width:100%;height:100%;}
#q-tag{position:absolute;right:36px;top:52px;padding:8px 18px;border-radius:30px;background:#E2E8F0;font-weight:600;font-size:24px;color:${NAVY};}
#q-t{position:absolute;left:40px;top:140px;font-family:"Mont";font-weight:900;font-size:64px;line-height:1;}
#q-sub{position:absolute;left:42px;top:212px;font-weight:500;font-size:24px;color:${SLATE};}
#q-chips{position:absolute;left:40px;top:258px;display:flex;gap:16px;}
#q-c0{background:#E2E8F0;color:${NAVY};}
#q-c1{background:#FFEAD9;color:${ORD};border:3px solid ${OR};}
#q-tbl{position:absolute;left:40px;top:350px;width:860px;}
.q-tr{display:flex;align-items:center;height:78px;border-bottom:2px solid ${LINE};font-size:31px;position:relative;}
.q-th{height:50px;font-weight:600;font-size:21px;color:${SLATE};text-transform:uppercase;letter-spacing:.06em;}
.q-c1{width:300px;}.q-c2{width:120px;text-align:center;}.q-c3{width:200px;text-align:right;}.q-c4{flex:1;text-align:right;font-weight:600;}
.q-hl{position:absolute;left:-14px;top:8px;width:888px;height:62px;border-radius:12px;background:rgba(242,107,29,.16);transform-origin:0 50%;}
#q-sum{position:absolute;left:40px;top:580px;width:860px;}
.q-sr{display:flex;justify-content:space-between;font-size:30px;height:50px;align-items:center;color:${SLATE};}
#q-div{height:3px;background:${NAVY};margin:10px 0 18px;transform-origin:0 50%;}
#q-tl{font-weight:600;font-size:30px;}
#q-tot{display:flex;align-items:flex-start;justify-content:center;font-family:"Mont";font-weight:900;margin-top:4px;}
#q-rs{font-size:52px;margin-top:20px;margin-right:10px;}
#q-ms{font-size:40px;margin-top:70px;margin-left:8px;color:${SLATE};}
#q-fx{margin-top:6px;text-align:center;font-size:22px;color:${SLATE};}
#q-iof{position:absolute;left:40px;top:956px;}
#q-val{position:absolute;right:40px;top:968px;font-size:22px;color:${SLATE};}
#q-lg{top:1408px;}
`;
  const tr = (k, f) =>
    `<div class="q-tr" id="q-r${k}"><div class="q-hl" id="q-h${k}"></div><div class="q-c1">${f.faixa}</div><div class="q-c2">${f.n}</div><div class="q-c3">R$ ${f.v}</div><div class="q-c4">R$ ${f.sub}</div></div>`;
  const body = `
  <div id="q-h" class="ln">${wspans("qh", "Olha essa cotação:")}</div>
  <div id="q-doc" class="card">
    <div id="q-logo"><img src="assets/img/logo-text-navy.png" alt="SulAmérica" /><img src="assets/img/logo-wave.png" alt="" /></div>
    <div id="q-tag">CNPJ/MEI · 3 vidas</div>
    <div id="q-t">${wspans("qt", "Direto Nacional")}</div>
    <div id="q-sub">SulAmérica Saúde · ${Q.reg}</div>
    <div id="q-chips"><span class="chip" id="q-c0">${icon("hospital", 28, { color: NAVY, sw: 3.6 })}Enfermaria</span><span class="chip" id="q-c1">${icon("check", 28, { color: ORD, sw: 5 })}Sem coparticipação</span></div>
    <div id="q-tbl">
      <div class="q-tr q-th"><div class="q-c1">Faixa etária</div><div class="q-c2">Vidas</div><div class="q-c3">Por vida</div><div class="q-c4">Subtotal</div></div>
      ${tr(0, Q.faixas[0])}${tr(1, Q.faixas[1])}
    </div>
    <div id="q-sum">
      <div class="q-sr" id="q-s0"><span>Prêmio (sem IOF)</span><span>R$ ${Q.premio}</span></div>
      <div class="q-sr" id="q-s1"><span>IOF (${Q.iofp})</span><span>+ R$ ${Q.iof}</span></div>
      <div id="q-div"></div>
      <div id="q-tl">Total por mês</div>
      <div id="q-tot"><span id="q-rs">R$</span>${rollHTML("q-n", Q.total, 120, LH)}<span id="q-ms">/mês</span></div>
      <div id="q-fx">${OBS.faixa}</div>
    </div>
    <div id="q-iof"><span class="chip ok" id="q-ok">${icon("check", 28, { color: GR, sw: 5 })}Já com IOF</span></div>
    <div id="q-val">Validade da cotação: ${Q.validade}</div>
  </div>
  <div id="q-lg" class="legal">${OBS.ref} ${OBS.perfil} ${OBS.cob} ${OBS.oferta}</div>`;
  words("qh", seq("olha essa cotacao", T.olha), 0.35);
  add(`tl.fromTo("#q-doc",{y:120,opacity:0,rotation:-2},{y:0,opacity:1,rotation:0,duration:0.55,ease:"power4.out"},0.05);`);
  add(`tl.set("#q-logo,#q-tag,#q-sub,#q-c0,#q-c1,#q-tbl,#q-sum,#q-iof,#q-val",{opacity:0},0);`);
  fadeUp(add, "#q-logo,#q-tag", L(T.sula) - 0.1, 0.4, 16);
  add(`tl.set("#qt0,#qt1",{yPercent:110,opacity:0},0);`);
  words("qt", seq("direto nacional", T.direto), 0.4);
  fadeUp(add, "#q-sub", L(T.direto) + 0.3, 0.4, 10);
  add(`tl.fromTo("#q-c0",{scale:0.5,opacity:0},{scale:1,opacity:1,duration:0.3,ease:"back.out(2.4)"},${r3(L(T.enf) - 0.05)});`);
  add(`tl.fromTo("#q-c1",{scale:1.8,opacity:0},{scale:1,opacity:1,duration:0.22,ease:"power4.in"},${r3(L(T.semc) - 0.1)});`);
  shake("#q-doc", r3(L(T.semc) + 0.1), 6);
  fadeUp(add, "#q-tbl", L(T.duas) - 0.4, 0.35, 16);
  add(`tl.set("#q-r0,#q-r1",{opacity:0},0);`);
  add(`tl.fromTo("#q-r0",{opacity:0,x:-20},{opacity:1,x:0,duration:0.3},${r3(L(T.duas) - 0.1)});`);
  add(`tl.fromTo("#q-h0",{scaleX:0},{scaleX:1,duration:0.5,ease:"power2.out"},${r3(L(T.duas))});`);
  add(`tl.fromTo("#q-r1",{opacity:0,x:-20},{opacity:1,x:0,duration:0.3},${r3(L(T.uma2) - 0.1)});`);
  add(`tl.fromTo("#q-h1",{scaleX:0},{scaleX:1,duration:0.5,ease:"power2.out"},${r3(L(T.uma2))});`);
  // total
  add(`tl.to("#q-doc",{y:-60,duration:0.6,ease:"power2.inOut"},${r3(L(T.total) - 0.4)});`);
  add(`tl.to("#q-h",{opacity:0,y:-20,duration:0.3},${r3(L(T.total) - 0.4)});`);
  add(`tl.to("#q-sum",{opacity:1,duration:0.2},${r3(L(T.total) - 0.2)});`);
  add(`tl.set("#q-s0,#q-s1,#q-tl,#q-rs,#q-ms,#q-fx",{opacity:0},0);`);
  fadeUp(add, "#q-s0", L(T.total) - 0.1, 0.3, 12);
  fadeUp(add, "#q-s1", L(T.total) + 0.2, 0.3, 12);
  add(`tl.fromTo("#q-div",{scaleX:0},{scaleX:1,duration:0.4,ease:"power2.out"},${r3(L(T.total) + 0.4)});`);
  fadeUp(add, "#q-tl", L(T.total) + 0.5, 0.3, 12);
  add(`tl.fromTo("#q-rs,#q-ms",{opacity:0},{opacity:1,duration:0.3},${r3(L(T.mil) - 0.1)});`);
  roll("q-n", Q.total, L(T.mil) - 0.05, L(T.mes), LH);
  add(`tl.fromTo("#q-fx",{opacity:0},{opacity:1,duration:0.3},${r3(L(T.mil) - 0.05)});`);
  add(`tl.fromTo("#q-iof",{opacity:0},{opacity:1,duration:0.01},${r3(L(T.ja) - 0.15)});`);
  add(`tl.fromTo("#q-ok",{scale:2,opacity:0},{scale:1,opacity:1,duration:0.22,ease:"power4.in"},${r3(L(T.ja) - 0.15)});`);
  shake("#q-doc", r3(L(T.ja) + 0.08), 8);
  fadeUp(add, "#q-val", L(T.ja) + 0.3, 0.3, 8);
  add(`tl.fromTo("#q-lg",{opacity:0},{opacity:1,duration:0.3},${r3(L(T.duas) - 0.4)});`);
  push(p, css, body, a);
}

// ═════════════ rd · rede: "Com hospitais de referência em São Paulo, como a BP, o Sepaco e a Rede D'Or São Luiz… e sem pagar nada a mais em consulta ou exame." ═════════════
{
  const p = "rd";
  const { a, L, add, words } = TL(ST[p]);
  const css = css0(p) + `
#rd-h{top:250px;font-family:"Mont";font-weight:900;font-size:62px;}
#rd-sp{top:336px;font-weight:600;font-size:46px;color:${ORD};}
#rd-card{left:60px;top:420px;width:960px;height:540px;overflow:hidden;}
#rd-iw,#rd-vw{position:absolute;inset:0;overflow:hidden;border-radius:28px;}
#rd-iw img{width:100%;height:100%;object-fit:cover;display:block;}
.rd-cap{position:absolute;left:0;bottom:0;width:100%;padding:70px 34px 24px;background:linear-gradient(180deg,rgba(12,33,72,0),rgba(12,33,72,.92));display:flex;align-items:center;gap:16px;color:#fff;font-family:"Mont";font-weight:900;font-size:42px;line-height:1.05;}
.rd-cap small{display:block;font-family:"Poppins";font-weight:500;font-size:27px;}
#rd-chips{position:absolute;left:0;width:${W}px;top:990px;display:flex;justify-content:center;gap:18px;}
.rd-chip{display:flex;align-items:center;gap:12px;padding:12px 26px;border-radius:50px;background:#fff;border:3px solid ${NAVY};font-family:"Mont";font-weight:800;font-size:36px;white-space:nowrap;}
#rd-tbl{left:110px;top:1085px;width:860px;height:200px;overflow:hidden;}
.rd-tr{display:flex;align-items:center;height:100px;padding:0 28px;font-size:32px;border-bottom:2px solid ${LINE};gap:16px;}
.rd-tr b{font-weight:600;flex:1;}
.rd-tr span{color:${SLATE};font-size:26px;}
.rd-tr em{font-style:normal;font-family:"Mont";font-weight:900;color:${GR};font-size:34px;}
#rd-lg{top:1306px;}
`;
  const chip = (id, t) => `<div class="rd-chip" id="${id}">${icon("hospital", 40, { color: NAVY, sw: 3.6 })}<span>${t}</span></div>`;
  const body = `
  <div id="rd-h" class="ln">${wspans("rdh", "Hospitais de referência")}</div>
  <div id="rd-sp" class="ln">${wspans("rdsp", "em São Paulo")}</div>
  <div id="rd-card" class="card">
    <div id="rd-iw"><img src="assets/img/bp-fachada.jpg" alt="Hospital BP – Beneficência Portuguesa" /><div class="rd-cap">${icon("hospital", 54, { color: "#FFB27A", sw: 3.4 })}<div>BP<small>Beneficência Portuguesa</small></div></div></div>
    <div id="rd-vw" class="vw">${video("rd-v", "v-bebe", L(T.e6) - 0.15, DUR[p] - (L(T.e6) - 0.15))}<div class="rd-cap">${icon("stetho", 54, { color: "#FFB27A", sw: 3.4 })}<div>Consultas e exames<small>sem coparticipação</small></div></div></div>
  </div>
  <div id="rd-chips">${chip("rd-c0", "Sepaco")}${chip("rd-c1", "Rede D'Or São Luiz")}</div>
  <div id="rd-tbl" class="card">
    <div class="rd-tr" id="rd-t0">${icon("check", 40, { color: GR, sw: 5 })}<b>Consulta</b><span>coparticipação</span><em>R$ 0,00</em></div>
    <div class="rd-tr" id="rd-t1" style="border-bottom:0">${icon("check", 40, { color: GR, sw: 5 })}<b>Exame</b><span>coparticipação</span><em>R$ 0,00</em></div>
  </div>
  <div id="rd-lg" class="legal">${OBS.rede} ${OBS.varia} ${OBS.cob} ${OBS.img} ${BP_CREDIT}</div>`;
  words("rdh", seq("hospitais de referencia", T.hospitais - 0.1), 0.4);
  words("rdsp", seq("em sao paulo", T.hospitais + 0.5), 0.35);
  add(`tl.fromTo("#rd-card",{y:80,opacity:0},{y:0,opacity:1,duration:0.5,ease:"power4.out"},${r3(L(T.bp) - 0.5)});`);
  add(`tl.fromTo("#rd-iw img",{scale:1.2,x:50},{scale:1.04,x:-20,duration:4,ease:"none"},${r3(L(T.bp) - 0.5)});`);
  add(`tl.fromTo("#rd-c0",{scale:0.6,opacity:0},{scale:1,opacity:1,duration:0.35,ease:"back.out(2.2)"},${r3(L(T.sepaco) - 0.08)});`);
  add(`tl.fromTo("#rd-c1",{scale:0.6,opacity:0},{scale:1,opacity:1,duration:0.35,ease:"back.out(2.2)"},${r3(L(T.rede) - 0.08)});`);
  add(`tl.fromTo("#rd-vw",{opacity:0},{opacity:1,duration:0.3},${r3(L(T.e6) - 0.15)});`);
  add(`tl.set("#rd-iw",{opacity:0},${r3(L(T.e6) + 0.2)});`);
  add(`tl.fromTo("#rd-tbl",{y:40,opacity:0},{y:0,opacity:1,duration:0.4,ease:"power3.out"},${r3(L(T.e6))});`);
  add(`tl.set("#rd-t0,#rd-t1",{opacity:0},0);`);
  add(`tl.fromTo("#rd-t0",{x:-30,opacity:0},{x:0,opacity:1,duration:0.3},${r3(L(T.e6) + 0.15)});`);
  add(`tl.fromTo("#rd-t1",{x:-30,opacity:0},{x:0,opacity:1,duration:0.3},${r3(L(T.e6) + 0.55)});`);
  add(`tl.fromTo("#rd-t0",{backgroundColor:"rgba(220,252,231,0)"},{backgroundColor:"rgba(220,252,231,1)",duration:0.25,yoyo:true,repeat:1},${r3(L(T.consulta))});`);
  add(`tl.fromTo("#rd-t1",{backgroundColor:"rgba(220,252,231,0)"},{backgroundColor:"rgba(220,252,231,1)",duration:0.25,yoyo:true,repeat:1,immediateRender:false},${r3(Math.min(L(T.exame), DUR[p] - 0.6))});`);
  add(`tl.fromTo("#rd-lg",{opacity:0},{opacity:1,duration:0.3},${r3(L(T.bp) - 0.3)});`);
  push(p, css, body, a);
}

// ═════════════ en · CTA: "Clica no link e preenche o formulário: a gente faz a cotação com as idades da sua família." ═════════════
{
  const p = "en";
  const { a, L, add } = TL(ST[p]);
  const css = css0(p) + `
#en-k{position:absolute;left:0;width:${W}px;top:250px;display:flex;justify-content:center;}
#en-k>div{padding:10px 26px;border-radius:40px;border:3px solid ${OR};background:#fff;font-weight:600;font-size:28px;color:${ORD};white-space:nowrap;}
#en-t{top:320px;font-family:"Mont";font-weight:900;font-size:56px;line-height:1.12;}
#en-p{position:absolute;left:0;width:${W}px;top:462px;display:flex;justify-content:center;}
#en-p>div{padding:12px 28px;border-radius:40px;background:#fff;box-shadow:0 10px 30px rgba(12,33,72,.1);font-weight:600;font-size:30px;white-space:nowrap;}
#en-p b{font-family:"Mont";font-weight:900;}
#en-fx{top:526px;font-size:20px;color:${SLATE};}
#en-f{left:110px;top:572px;width:860px;height:420px;}
#en-ft{position:absolute;left:40px;top:28px;font-family:"Mont";font-weight:800;font-size:34px;display:flex;align-items:center;gap:14px;}
.en-in{position:absolute;left:40px;width:780px;height:70px;border-radius:16px;border:3px solid ${LINE};display:flex;align-items:center;padding:0 22px;gap:14px;font-size:28px;color:${SLATE};}
.en-in i{display:inline-block;width:3px;height:36px;background:${NAVY};}
#en-i0{top:96px;}#en-i1{top:180px;}
#en-btn{position:absolute;left:40px;top:280px;width:780px;height:100px;border-radius:60px;background:${OR};display:flex;align-items:center;justify-content:center;gap:16px;font-family:"Mont";font-weight:900;font-size:40px;color:${NAVY};box-shadow:0 12px 30px rgba(242,107,29,.35);}
#en-cur{position:absolute;left:760px;top:1040px;}
#en-ar{position:absolute;left:0;width:${W}px;top:1012px;display:flex;justify-content:center;align-items:center;gap:14px;font-family:"Mont";font-weight:800;font-size:36px;}
#en-lg{top:1082px;font-size:19px;line-height:1.38;}
`;
  const body = `
  <div id="en-k"><div>Exclusivo CNPJ/MEI · a partir de 3 vidas</div></div>
  <div id="en-t" class="blk">Receba a cotação com as<br/>idades da sua família</div>
  <div id="en-p"><div>3 vidas · Direto Nacional · <b>R$ ${Q.total}/mês</b></div></div>
  <div id="en-fx" class="ln">${OBS.faixa}</div>
  <div id="en-f" class="card">
    <div id="en-ft">${icon("form", 44, { color: NAVY, sw: 3.6 })}Formulário de cotação</div>
    <div class="en-in" id="en-i0">${icon("person", 34, { color: SLATE, sw: 3.4 })}<span>Seu nome</span><i id="en-c0"></i></div>
    <div class="en-in" id="en-i1">${icon("building", 34, { color: SLATE, sw: 3.4 })}<span>CNPJ ou MEI · idades das vidas</span><i id="en-c1"></i></div>
    <div id="en-btn">Quero minha cotação</div>
  </div>
  <div id="en-ar">${icon("down", 40, { color: OR, sw: 5 })}<span>Clique no link abaixo</span>${icon("down", 40, { color: OR, sw: 5 })}</div>
  <div id="en-cur">${icon("cursor", 64, { color: "#fff", fill: NAVY, sw: 2.5 })}</div>
  <div id="en-lg" class="legal">${QUOTE_TXT} ${HOSP_TXT} ${BP_CREDIT} ${LEGAL_ALL}</div>`;
  fadeUp(add, "#en-k", 0.05, 0.35, 16);
  fadeUp(add, "#en-t", 0.12, 0.45, 24);
  fadeUp(add, "#en-p,#en-fx", 0.3, 0.4, 16);
  add(`tl.fromTo("#en-f",{y:80,opacity:0},{y:0,opacity:1,duration:0.5,ease:"power4.out"},${r3(L(T.preenche) - 0.6)});`);
  add(`tl.fromTo("#en-c0,#en-c1",{opacity:1},{opacity:0,duration:0.3,repeat:13,yoyo:true,ease:"steps(1)"},${r3(L(T.preenche) - 0.1)});`);
  add(`tl.fromTo("#en-i0",{borderColor:"${LINE}"},{borderColor:"${OR}",duration:0.2},${r3(L(T.preenche))});`);
  add(`tl.fromTo("#en-i1",{borderColor:"${LINE}"},{borderColor:"${OR}",duration:0.2},${r3(L(T.preenche) + 0.5)});`);
  add(`tl.fromTo("#en-cur",{x:120,y:200,opacity:0},{x:-260,y:-120,opacity:1,duration:0.7,ease:"power2.inOut"},${r3(L(T.formulario) - 0.2)});`);
  add(`tl.to("#en-btn",{scale:0.94,duration:0.1,yoyo:true,repeat:1},${r3(L(T.formulario) + 0.5)});`);
  for (let i = 0; i < 3; i++) add(`tl.to("#en-btn",{scale:1.04,duration:0.22,yoyo:true,repeat:1,ease:"sine.inOut"},${r3(L(T.formulario) + 1.4 + i * 1.4)});`);
  add(`tl.fromTo("#en-ar",{y:16,opacity:0},{y:0,opacity:1,duration:0.4},${r3(L(T.formulario) + 0.2)});`);
  add(`tl.fromTo("#en-ar svg",{y:-8},{y:8,duration:0.45,yoyo:true,repeat:9,ease:"sine.inOut"},${r3(L(T.formulario) + 0.6)});`);
  add(`tl.fromTo("#en-lg",{opacity:0},{opacity:1,duration:0.5},0.4);`);
  push(p, css, body, a);
}

scenes.push(uiScene([
  [T.emergencia, 0.25],
  [T.pelo, 0.45],
  [T.semc, 0.2],
  [T.ja, 0.25],
], { color: "255,255,255", grain: 0.025 }));

const SFX = [
  ["pop", T.aluguel + 0.2, 0.35],
  ["pop", T.folha + 0.2, 0.35],
  ["pop", T.imposto + 0.2, 0.35],
  ["tap", T.custo2, 0.4],
  ["clock", T.custo2 + 0.3, 0.3],
  ["impact", T.emergencia, 0.4],
  ["whoosh", T.uma - 0.1, 0.35],
  ["stamp", T.limite, 0.45],
  ["riser", T.pelo, 0.35],
  ["impact", T.pelo, 0.45],
  ["check", T.voce3 + 0.2, 0.4],
  ["whoosh", ST.q, 0.35],
  ["card", T.sula, 0.35],
  ["pop", T.enf, 0.35],
  ["stamp", T.semc, 0.5],
  ["tap", T.duas, 0.35],
  ["tap", T.uma2, 0.35],
  ["counter", T.mil, 0.35],
  ["stamp", T.ja, 0.5],
  ["whoosh", ST.rd, 0.35],
  ["card", T.bp - 0.4, 0.4],
  ["pop", T.sepaco, 0.35],
  ["pop", T.rede, 0.35],
  ["check", T.e6 + 0.15, 0.35],
  ["check", T.e6 + 0.55, 0.35],
  ["whoosh", ST.en, 0.35],
  ["tap", T.formulario + 0.5, 0.45],
  ["chime", T.formulario + 0.55, 0.35],
];

writeOutput(scenes, SFX, { bg: BG, bgmVolume: 0.7 });
