// build.mjs — anúncio "Vila Nova Star pelo CNPJ/MEI" (story 9:16, público de alto padrão na capital de SP).
// Modelado no Reel 05 de referência (tour do hospital): gancho com pergunta, tour pelos espaços, o pronto-socorro em
// suíte individual como detalhe que surpreende, virada "nem todo mundo paga no particular", filtro CNPJ/MEI e 3 vidas,
// comparação de operadoras, frase-tese e CTA do formulário. Imagens: cortes do banco de vídeos (Vila Nova Star).
// Visual: preto-azulado e dourado champanhe, Saira condensada + Instrument Serif itálico. Voz: Roberta.
//   node tools/build.mjs   (ou bash tools/assemble.sh, que também faz o carve da trilha)

import { W, H, D, r3, at, seq, fontFaces, wspans, baseCss, scene, video, TL, icon, OBS, LEGAL_ALL, SRC_TXT, NET_TXT, uiScene, writeOutput } from "./core.mjs";

const INK = "#07090E";
const GOLD = "#D4B06A";
const GOLD2 = "#F0D9A8";

const FONTS = fontFaces([
  ["Saira", 500, "SairaSemiCondensed-normal-500"],
  ["Saira", 700, "SairaSemiCondensed-normal-700"],
  ["Saira", 800, "SairaSemiCondensed-normal-800"],
  ["InstSerif", 400, "InstrumentSerif-Italic", "italic"],
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
#${p}-root{font-family:"Poppins",Arial,sans-serif;color:#fff;background:${INK};}
.sa{font-family:"Saira",Arial,sans-serif;font-weight:800;text-transform:uppercase;line-height:1;}
.se{font-family:"InstSerif",Georgia,serif;font-style:italic;font-weight:400;line-height:1.05;}
.gd{color:${GOLD};}
.ts{text-shadow:0 4px 24px rgba(0,0,0,.55);}
.dim{background:rgba(7,9,14,.2);}
.grad{background:linear-gradient(180deg,rgba(7,9,14,.5) 0%,rgba(7,9,14,.08) 30%,rgba(7,9,14,.14) 44%,rgba(7,9,14,.84) 64%,rgba(7,9,14,.95) 100%);}
.legal{position:absolute;left:80px;width:${W - 160}px;text-align:center;font-size:20px;line-height:1.4;color:rgba(255,255,255,.9);}
.chip{position:absolute;left:150px;width:780px;height:96px;border-radius:20px;background:rgba(7,9,14,.74);border:2px solid rgba(212,176,106,.55);display:flex;align-items:center;gap:22px;padding:0 28px;}
.chip .ic{width:58px;height:58px;border-radius:50%;background:${GOLD};display:flex;align-items:center;justify-content:center;flex:none;}
.chip span{font-family:"Saira";font-weight:700;font-size:44px;text-transform:uppercase;letter-spacing:.02em;white-space:nowrap;}
`;

// ───────────── tempos (absolutos, da locução) ─────────────
const T = {};
T.por = at("por");
T.quando = at("quando");
T.parece = at("parece");
T.hotel = at("hotel");
T.do1 = at("do", T.hotel);
T.apart = at("apartamentos");
T.vista = at("vista");
T.concierge = at("concierge");
T.cardapio = at("cardapio");
T.chef = at("chef");
T.mas = at("mas");
T.ps = at("prontosocorro");
T.suite = at("suite");
T.consulta = at("consulta");
T.exames = at("exames");
T.dentro = at("dentro");
T.equipe = at("equipe");
T.nem = at("nem");
T.paga = at("paga");
T.particular = at("particular");
T.se = at("se");
T.cnpj = at("cnpj");
T.mei = at("mei");
T.tres = at("tres");
T.existem = at("existem");
T.vila2 = at("vila", T.existem);
T.rede = at("rede", T.vila2);
T.gente = at("gente", T.rede);
T.compara = at("compara");
T.melhor = at("melhor", T.compara);
T.nao = at("nao", T.melhor);
T.e_padrao = at("padrao", T.nao);
T.plano_certo = at("certo");
T.clica = at("clica");
T.preenche = at("preenche");
T.formulario = at("formulario");

const ST = {
  s1: 0,
  s2: r3(T.quando - 0.1),
  s3: r3(T.mas - 0.1),
  s4: r3(T.nem - 0.14),
  s5: r3(T.se - 0.1),
  s6: r3(T.nao - 0.1),
  en: r3(T.clica - 0.1),
};
const ORDER = ["s1", "s2", "s3", "s4", "s5", "s6", "en"];
const DUR = Object.fromEntries(ORDER.map((k, i) => [k, r3((i < ORDER.length - 1 ? ST[ORDER[i + 1]] : D) - ST[k] + (i < ORDER.length - 1 ? 0.04 : 0))]));

const scenes = [];
const push = (p, css, body, a) => scenes.push({ st: ST[p], track: 1, ...scene(p, DUR[p], css, body, a) });

// sequência de vídeos em tela cheia com empurrão lento de câmera (o wrapper anima; o vídeo só toca)
function reel(p, list) {
  let html = "", anim = [];
  list.forEach(([name, t0, t1, z0 = 1.0, z1 = 1.07], i) => {
    const id = `${p}-v${i}`;
    html += `<div class="vw ${p}-full" id="${id}w" data-layout-allow-overflow>${video(id, name, t0, r3(t1 - t0 + 0.04))}</div>`;
    anim.push(`tl.fromTo("#${id}w",{scale:${z0}},{scale:${z1},duration:${r3(t1 - t0 + 0.04)},ease:"none"},${r3(t0)});`);
  });
  return { html, anim };
}
const slam = (add, sel, t, from = 1.5) =>
  add(`tl.fromTo("${sel}",{scale:${from},opacity:0},{scale:1,opacity:1,duration:0.32,ease:"power4.out"},${r3(Math.max(0, t))});`);
const fadeUp = (add, sel, t, d = 0.45, y = 36) =>
  add(`tl.fromTo("${sel}",{y:${y},opacity:0},{y:0,opacity:1,duration:${d},ease:"power3.out"},${r3(Math.max(0, t))});`);
const fadeOut = (add, sel, t, d = 0.25) => add(`tl.to("${sel}",{opacity:0,y:-30,duration:${d},ease:"power2.in"},${r3(t)});`);
const chip = (id, ic, text) => `<div class="chip" id="${id}"><div class="ic">${icon(ic, 34, { color: INK, sw: 3.6 })}</div><span>${text}</span></div>`;

// ═════════════ s1 · gancho: "Por que tanta gente em São Paulo quer o Vila Nova Star no plano de saúde?" ═════════════
{
  const p = "s1";
  const { a, L, add } = TL(ST[p]);
  const cut = 2.1;
  const r = reel(p, [["fachada", 0, cut, 1.0, 1.06], ["letreiro", cut, DUR[p], 1.04, 1.0]]);
  const css = css0(p) + `
#s1-a{top:980px;font-size:60px;}
#s1-b{top:1052px;font-size:60px;}
#s1-c{top:1128px;font-size:116px;color:${GOLD};letter-spacing:.01em;}
#s1-d{top:1262px;font-size:60px;}
#s1-lg{top:1452px;}
`;
  const body = `
  ${r.html}
  <div class="${p}-full dim"></div><div class="${p}-full grad"></div>
  <div id="s1-a" class="ln se ts">Por que tanta gente em São Paulo</div>
  <div id="s1-b" class="ln se ts">quer o</div>
  <div id="s1-c" class="ln sa ts">Vila Nova Star</div>
  <div id="s1-d" class="ln se ts">no plano de saúde?</div>
  <div id="s1-lg" class="legal">${OBS.rede} ${OBS.varia} ${OBS.img}</div>`;
  r.anim.forEach(add);
  add(`tl.fromTo("#s1-a,#s1-b,#s1-d",{opacity:0.85},{opacity:1,duration:0.6},0);`);
  add(`tl.fromTo("#s1-c",{scale:1.08},{scale:1,duration:1.4,ease:"power3.out"},0);`);
  add(`tl.fromTo("#s1-c",{textShadow:"0 0 0 rgba(212,176,106,0)"},{textShadow:"0 0 40px rgba(212,176,106,.45)",duration:0.5,yoyo:true,repeat:1},${r3(L(at("vila")) - 0.05)});`);
  push(p, css, body, a);
}

// ═════════════ s2 · tour: "Quando você entra, parece mais um hotel de alto padrão… vista, concierge, chef" ═════════════
{
  const p = "s2";
  const { a, L, add, words } = TL(ST[p]);
  const c = [L(T.parece) + 0.75, L(T.do1) + 0.45, L(T.apart) - 0.08, L(T.vista) + 0.68, L(T.concierge) - 0.05, L(T.cardapio) - 0.1];
  const r = reel(p, [
    ["lobby", 0, c[0]],
    ["quarto01", c[0], c[1]],
    ["enxoval", c[1], c[2], 1.05, 1.0],
    ["quartovista", c[2], c[3]],
    ["suite", c[3], c[4]],
    ["quarto03", c[4], c[5]],
    ["restaurante", c[5], DUR[p], 1.0, 1.05],
  ]);
  const css = css0(p) + `
#s2-a{top:1020px;font-size:60px;}
#s2-b{top:1098px;font-size:84px;color:${GOLD};}
#s2-c{top:1210px;font-size:60px;}
#s2-k{top:1000px;font-family:"Saira";font-weight:700;font-size:34px;letter-spacing:.22em;color:${GOLD2};}
#s2-c0{top:1060px;}#s2-c1{top:1170px;}#s2-c2{top:1280px;}
#s2-lg{top:1452px;}
`;
  const body = `
  ${r.html}
  <div class="${p}-full dim"></div><div class="${p}-full grad"></div>
  <div id="s2-pa">
    <div id="s2-a" class="ln se ts">${wspans("s2a", "parece mais um")}</div>
    <div id="s2-b" class="ln sa ts">${wspans("s2b", "hotel de alto padrão")}</div>
    <div id="s2-c" class="ln se ts">${wspans("s2c", "do que um hospital.")}</div>
  </div>
  <div id="s2-k" class="ln">HOTELARIA DE ALTO PADRÃO</div>
  ${chip("s2-c0", "view", "Apartamentos com vista")}
  ${chip("s2-c1", "bell", "Concierge")}
  ${chip("s2-c2", "chef", "Cardápio assinado por chef")}
  <div id="s2-lg" class="legal">${OBS.rede} ${OBS.varia} ${OBS.img}</div>`;
  r.anim.forEach(add);
  words("s2a", seq("parece mais um", T.parece), 0.4);
  words("s2b", seq("hotel de alto padrao", T.hotel), 0.42);
  words("s2c", seq("do que um hospital", T.do1), 0.4);
  fadeOut(add, "#s2-pa", L(T.apart) - 0.3);
  fadeUp(add, "#s2-k", L(T.apart) - 0.1, 0.4, 20);
  [T.apart, T.concierge, T.cardapio].forEach((t, i) =>
    add(`tl.fromTo("#s2-c${i}",{x:-70,opacity:0},{x:0,opacity:1,duration:0.42,ease:"back.out(1.6)"},${r3(L(t) - 0.08)});`),
  );
  push(p, css, body, a);
}

// ═════════════ s3 · prova: "o pronto-socorro: suíte individual, consulta e exames ali dentro, a equipe vai até você" ═════════════
{
  const p = "s3";
  const { a, L, add, words, shake } = TL(ST[p]);
  const c = [L(T.ps) - 0.05, L(T.consulta) - 0.15, L(T.dentro) - 0.2, L(T.equipe) + 0.27];
  const r = reel(p, [
    ["corredorA", 0, c[0]],
    ["quarto02", c[0], c[1], 1.0, 1.08],
    ["medica", c[1], c[2]],
    ["centro", c[2], c[3]],
    ["corredorB", c[3], DUR[p]],
  ]);
  const css = css0(p) + `
#s3-a{top:990px;font-size:58px;}
#s3-b{top:1062px;font-size:104px;color:${GOLD};}
#s3-c{top:1176px;font-size:80px;}
#s3-row{position:absolute;left:0;width:${W}px;top:1290px;display:flex;justify-content:center;gap:16px;}
.s3-it{display:flex;align-items:center;gap:10px;padding:12px 22px;border-radius:40px;background:rgba(7,9,14,.78);border:2px solid rgba(212,176,106,.6);font-family:"Saira";font-weight:700;font-size:34px;text-transform:uppercase;white-space:nowrap;}
#s3-e{top:1296px;font-size:62px;color:${GOLD2};}
#s3-lg{top:1430px;}
`;
  const it = (id, t) => `<div class="s3-it" id="${id}">${icon("check", 30, { color: GOLD, sw: 6 })}<span>${t}</span></div>`;
  const body = `
  ${r.html}
  <div class="${p}-full dim"></div><div class="${p}-full grad"></div>
  <div id="s3-a" class="ln se ts">${wspans("s3a", "mas o que mais impressiona é")}</div>
  <div id="s3-b" class="ln sa ts">o pronto-socorro</div>
  <div id="s3-c" class="ln sa ts">em suíte individual</div>
  <div id="s3-row">${it("s3-i0", "Consulta")}${it("s3-i1", "Exames")}${it("s3-i2", "Na própria suíte")}</div>
  <div id="s3-e" class="ln se ts">${wspans("s3e", "a equipe vai até você.")}</div>
  <div id="s3-lg" class="legal">Pronto-socorro adulto do Hospital Vila Nova Star em suítes individuais, segundo o site oficial do hospital. ${OBS.rede} ${OBS.cob} ${OBS.img}</div>`;
  r.anim.forEach(add);
  words("s3a", seq("mas o que mais impressiona e", T.mas), 0.4);
  slam(add, "#s3-b", L(T.ps) - 0.04, 1.6);
  shake(`#${p}-root`, r3(L(T.ps) + 0.1), 10);
  add(`tl.fromTo("#s3-c",{clipPath:"inset(0 100% 0 0)"},{clipPath:"inset(0 0% 0 0)",duration:0.5,ease:"power3.inOut"},${r3(L(T.suite) - 0.1)});`);
  [T.consulta, T.exames, T.dentro].forEach((t, i) =>
    add(`tl.fromTo("#s3-i${i}",{y:30,opacity:0,scale:0.85},{y:0,opacity:1,scale:1,duration:0.36,ease:"back.out(2)"},${r3(L(t) - 0.08)});`),
  );
  fadeOut(add, "#s3-row", L(T.equipe) - 0.35, 0.22);
  words("s3e", seq("a equipe vai ate voce", T.equipe - 0.1), 0.4);
  push(p, css, body, a);
}

// ═════════════ s4 · virada: "E nem todo mundo que é atendido lá paga tudo no particular." ═════════════
{
  const p = "s4";
  const { a, L, add, words, shake } = TL(ST[p]);
  const cut = 1.85;
  const r = reel(p, [["robo1", 0, cut, 1.0, 1.06], ["robo2", cut, DUR[p], 1.03, 1.0]]);
  const css = css0(p) + `
#s4-a{top:1010px;font-size:58px;}
#s4-b{top:1090px;font-size:96px;}
#s4-c{top:1196px;font-size:140px;color:${GOLD};}
#s4-st{position:absolute;left:150px;top:1262px;width:780px;height:12px;border-radius:6px;background:#fff;transform-origin:0 50%;box-shadow:0 2px 14px rgba(0,0,0,.5);}
#s4-lg{top:1452px;}
`;
  const body = `
  ${r.html}
  <div class="${p}-full dim"></div><div class="${p}-full grad"></div>
  <div id="s4-a" class="ln se ts">${wspans("s4a", "nem todo mundo que é atendido lá")}</div>
  <div id="s4-b" class="ln sa ts">${wspans("s4b", "paga tudo no")}</div>
  <div id="s4-c" class="ln sa ts">particular</div>
  <div id="s4-st"></div>
  <div id="s4-lg" class="legal">${OBS.img}</div>`;
  r.anim.forEach(add);
  words("s4a", seq("nem todo mundo que e atendido la", T.nem), 0.38);
  words("s4b", seq("paga tudo no", T.paga), 0.38);
  slam(add, "#s4-c", L(T.particular) - 0.05, 1.5);
  add(`tl.fromTo("#s4-st",{scaleX:0},{scaleX:1,duration:0.26,ease:"power3.inOut"},${r3(L(T.particular) + 0.22)});`);
  add(`tl.to("#s4-c",{opacity:0.55,duration:0.25},${r3(L(T.particular) + 0.3)});`);
  shake(`#${p}-root`, r3(L(T.particular) + 0.46), 8);
  push(p, css, body, a);
}

// ═════════════ s5 · CNPJ: "Se você tem CNPJ ou MEI e três vidas ou mais… a gente compara as operadoras" ═════════════
{
  const p = "s5";
  const { a, L, add, words } = TL(ST[p]);
  const css = css0(p) + `
#s5-bg{position:absolute;inset:0;}
#s5-bg img{width:100%;height:100%;object-fit:cover;opacity:.32;}
#s5-glow{position:absolute;inset:0;background:radial-gradient(60% 40% at 50% 55%,rgba(212,176,106,.16),rgba(7,9,14,0) 70%),linear-gradient(180deg,rgba(7,9,14,.55),rgba(7,9,14,.86));}
#s5-a{top:540px;font-size:62px;}
.s5-row{position:absolute;left:130px;width:820px;height:118px;border-radius:24px;background:rgba(255,255,255,.06);border:2px solid rgba(212,176,106,.5);display:flex;align-items:center;gap:24px;padding:0 32px;}
.s5-ck{width:66px;height:66px;border-radius:50%;background:${GOLD};display:flex;align-items:center;justify-content:center;flex:none;}
.s5-row span{font-family:"Saira";font-weight:800;font-size:62px;text-transform:uppercase;white-space:nowrap;}
#s5-r0{top:636px;}#s5-r1{top:774px;}
#s5-b{top:930px;font-size:56px;}
#s5-card{position:absolute;left:110px;top:1012px;width:860px;height:240px;border-radius:28px;background:linear-gradient(180deg,rgba(212,176,106,.18),rgba(212,176,106,.06));border:3px solid ${GOLD};display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;}
#s5-card .k{font-family:"Saira";font-weight:700;font-size:30px;letter-spacing:.2em;color:${GOLD2};}
#s5-card .n{font-family:"Saira";font-weight:800;font-size:92px;line-height:1;text-transform:uppercase;color:${GOLD};}
#s5-card .r{font-family:"Poppins";font-weight:600;font-size:34px;}
#s5-pb{position:absolute;inset:0;}
#s5-t{top:560px;font-size:72px;}
#s5-t2{top:648px;font-size:58px;color:${GOLD2};}
.s5-op{position:absolute;left:110px;width:860px;height:150px;border-radius:24px;background:rgba(255,255,255,.06);border:2px solid rgba(255,255,255,.22);padding:22px 30px;}
.s5-op .nm{font-family:"Mont";font-weight:800;font-size:40px;}
.s5-op .bars{display:flex;gap:18px;margin-top:18px;}
.s5-op .bar{flex:1;}
.s5-op .lb{font-family:"Poppins";font-weight:500;font-size:22px;color:rgba(255,255,255,.85);}
.s5-op .tr{height:12px;border-radius:6px;background:rgba(255,255,255,.16);margin-top:6px;overflow:hidden;}
.s5-op .fl{height:100%;border-radius:6px;background:#E9EDF3;transform-origin:0 50%;}
#s5-o0{top:760px;}#s5-o1{top:930px;}#s5-o2{top:1100px;}
#s5-badge{position:absolute;right:130px;top:906px;padding:8px 20px;border-radius:30px;background:${GOLD};color:${INK};font-family:"Mont";font-weight:900;font-size:26px;white-space:nowrap;display:flex;align-items:center;gap:8px;}
#s5-lg{top:1400px;font-size:20px;}
`;
  const ops = [
    ["Operadora A", [0.55, 0.7, 0.62]],
    ["Operadora B", [0.92, 0.88, 0.8]],
    ["Operadora C", [0.68, 0.6, 0.74]],
  ];
  const op = (i, [nm, v]) =>
    `<div class="s5-op" id="s5-o${i}"><div class="nm">${nm}</div><div class="bars">${["Rede", "Cobertura", "Valor"]
      .map((lb, k) => `<div class="bar"><div class="lb">${lb}</div><div class="tr"><div class="fl" id="s5-f${i}${k}"></div></div></div>`)
      .join("")}</div></div>`;
  const body = `
  <div id="s5-bg"><img src="assets/img/lobby-blur.jpg" alt="" /></div><div id="s5-glow"></div>
  <div id="s5-pa">
    <div id="s5-a" class="ln se">${wspans("s5a", "Se você tem")}</div>
    <div class="s5-row" id="s5-r0"><div class="s5-ck">${icon("check", 42, { color: INK, sw: 6 })}</div><span>CNPJ ou MEI</span></div>
    <div class="s5-row" id="s5-r1"><div class="s5-ck">${icon("check", 42, { color: INK, sw: 6 })}</div><span>3 vidas ou mais</span></div>
    <div id="s5-b" class="ln se">${wspans("s5b", "existem planos empresariais com o")}</div>
    <div id="s5-card"><div class="k">NA REDE</div><div class="n">Vila Nova Star</div><div class="r">pelo CNPJ da sua empresa</div></div>
  </div>
  <div id="s5-pb">
    <div id="s5-t" class="ln sa">A gente compara</div>
    <div id="s5-t2" class="ln se">as operadoras pra você</div>
    ${ops.map((o, i) => op(i, o)).join("")}
    <div id="s5-badge">${icon("check", 26, { color: INK, sw: 6 })}<span>Melhor pro seu perfil</span></div>
  </div>
  <div id="s5-lg" class="legal">${OBS.eleg} ${OBS.analise} ${OBS.faixa} ${OBS.perfil} ${OBS.varia} ${OBS.cob} Operadoras ilustrativas.</div>`;
  add(`tl.fromTo("#s5-bg img",{scale:1.08},{scale:1,duration:${DUR[p]},ease:"none"},0);`);
  words("s5a", seq("se voce tem", T.se), 0.38);
  [T.cnpj, T.tres].forEach((t, i) =>
    add(`tl.fromTo("#s5-r${i}",{x:-80,opacity:0},{x:0,opacity:1,duration:0.42,ease:"back.out(1.6)"},${r3(L(t) - 0.12)});`),
  );
  words("s5b", seq("existem planos empresariais com o", T.existem), 0.38);
  add(`tl.fromTo("#s5-card",{scale:0.85,opacity:0},{scale:1,opacity:1,duration:0.5,ease:"back.out(1.7)"},${r3(L(T.vila2) - 0.2)});`);
  add(`tl.fromTo("#s5-card",{boxShadow:"0 0 0 rgba(212,176,106,0)"},{boxShadow:"0 0 60px rgba(212,176,106,.45)",duration:0.4,yoyo:true,repeat:1},${r3(L(T.rede))});`);
  // segunda parte: comparação
  add(`tl.to("#s5-pa",{opacity:0,y:-40,duration:0.3,ease:"power2.in"},${r3(L(T.gente) - 0.35)});`);
  add(`tl.set("#s5-pb",{opacity:0},0);`);
  add(`tl.set("#s5-pb",{opacity:1},${r3(L(T.gente) - 0.06)});`);
  slam(add, "#s5-t", L(T.gente) - 0.06, 1.3);
  fadeUp(add, "#s5-t2", L(T.compara) + 0.2, 0.4, 20);
  ops.forEach(([, v], i) => {
    const t0 = L(T.compara) + 0.35 + i * 0.22;
    add(`tl.fromTo("#s5-o${i}",{x:80,opacity:0},{x:0,opacity:1,duration:0.4,ease:"power3.out"},${r3(t0)});`);
    v.forEach((w, k) => add(`tl.fromTo("#s5-f${i}${k}",{scaleX:0},{scaleX:${w},duration:0.6,ease:"power2.out"},${r3(t0 + 0.2 + k * 0.08)});`));
  });
  add(`tl.to("#s5-o0,#s5-o2",{opacity:0.4,duration:0.3},${r3(L(T.melhor) - 0.1)});`);
  add(`tl.to("#s5-o1",{scale:1.04,duration:0.3,ease:"back.out(2)"},${r3(L(T.melhor) - 0.1)});`);
  add(`tl.to("#s5-o1",{borderColor:"${GOLD}",duration:0.25},${r3(L(T.melhor) - 0.1)});`);
  [0, 1, 2].forEach((k) => add(`tl.to("#s5-f1${k}",{backgroundColor:"${GOLD}",duration:0.25},${r3(L(T.melhor) - 0.05)});`));
  add(`tl.fromTo("#s5-badge",{scale:0,opacity:0},{scale:1,opacity:1,duration:0.4,ease:"back.out(2.2)"},${r3(L(T.melhor))});`);
  push(p, css, body, a);
}

// ═════════════ s6 · tese: "Não é só um hospital bonito. É um padrão de atendimento que você acessa com o plano certo." ═════════════
{
  const p = "s6";
  const { a, L, add, words } = TL(ST[p]);
  const c = [1.7, 3.4];
  const r = reel(p, [["lobby", 0, c[0], 1.06, 1.0], ["quartovista", c[0], c[1]], ["fachada", c[1], DUR[p], 1.0, 1.05]]);
  const css = css0(p) + `
#s6-a{top:1000px;font-family:"Saira";font-weight:700;font-size:44px;letter-spacing:.2em;}
#s6-b{top:1056px;font-size:104px;}
#s6-c{top:1190px;font-size:60px;}
#s6-d{top:1262px;font-size:56px;color:${GOLD2};}
#s6-lg{top:1452px;}
`;
  const body = `
  ${r.html}
  <div class="${p}-full dim"></div><div class="${p}-full grad"></div>
  <div id="s6-a" class="ln ts">NÃO É SÓ UM</div>
  <div id="s6-b" class="ln sa ts">${wspans("s6b", "hospital bonito.")}</div>
  <div id="s6-c" class="ln se ts">${wspans("s6c", "É um padrão de atendimento")}</div>
  <div id="s6-d" class="ln se ts">${wspans("s6d", "que você acessa com o plano certo.")}</div>
  <div id="s6-lg" class="legal">${OBS.rede} ${OBS.img}</div>`;
  r.anim.forEach(add);
  fadeUp(add, "#s6-a", L(T.nao) - 0.05, 0.4, 20);
  words("s6b", seq("hospital bonito", at("hospital", T.nao)), 0.42);
  words("s6c", seq("e um padrao de atendimento", T.e_padrao - 0.35), 0.4);
  words("s6d", seq("que voce acessa com o plano certo", at("que", T.e_padrao)), 0.4);
  push(p, css, body, a);
}

// ═════════════ en · CTA: "Clica no link, preenche o formulário e receba sua cotação." ═════════════
{
  const p = "en";
  const { a, L, add } = TL(ST[p]);
  const css = css0(p) + `
#en-bg{position:absolute;inset:0;}
#en-bg img{width:100%;height:100%;object-fit:cover;opacity:.5;}
#en-ov{position:absolute;inset:0;background:linear-gradient(180deg,rgba(7,9,14,.7),rgba(7,9,14,.82) 40%,rgba(7,9,14,.94));}
#en-band{position:absolute;left:0;width:${W}px;top:250px;display:flex;justify-content:center;}
#en-band>div{padding:14px 44px 16px;border-radius:12px;background:${GOLD};color:${INK};font-family:"Mont";font-weight:900;font-size:66px;line-height:1;letter-spacing:.02em;white-space:nowrap;}
#en-seal{position:absolute;left:0;width:${W}px;top:364px;display:flex;justify-content:center;}
#en-seal>div{display:flex;align-items:center;gap:16px;padding:12px 34px 12px 16px;border-radius:60px;background:#fff;color:${INK};font-family:"Mont";font-weight:900;font-size:44px;white-space:nowrap;box-shadow:0 10px 30px rgba(0,0,0,.35);}
#en-seal .sh{width:64px;height:64px;border-radius:50%;background:${INK};display:flex;align-items:center;justify-content:center;}
#en-sub{position:absolute;left:0;width:${W}px;top:474px;display:flex;justify-content:center;}
#en-sub>div{padding:8px 26px;border-radius:30px;background:rgba(7,9,14,.8);border:2px solid rgba(212,176,106,.6);font-family:"Poppins";font-weight:600;font-size:30px;color:${GOLD2};white-space:nowrap;}
#en-t{top:572px;font-size:58px;}
#en-n{top:640px;font-size:110px;color:${GOLD};}
#en-btn{position:absolute;left:110px;top:792px;width:860px;height:150px;border-radius:80px;background:linear-gradient(180deg,${GOLD2},${GOLD});color:${INK};display:flex;align-items:center;justify-content:center;gap:24px;box-shadow:0 18px 50px rgba(212,176,106,.35);}
#en-bt{font-family:"Mont";font-weight:900;font-size:54px;line-height:1.05;}
#en-bt small{display:block;font-family:"Poppins";font-weight:600;font-size:27px;}
#en-ar{position:absolute;left:0;width:${W}px;top:968px;display:flex;justify-content:center;align-items:center;gap:14px;font-family:"Mont";font-weight:800;font-size:36px;}
#en-lg{top:1046px;font-size:19px;line-height:1.38;}
`;
  const body = `
  <div id="en-bg"><img src="assets/img/fachada-blur.jpg" alt="" /></div><div id="en-ov"></div>
  <div id="en-band"><div>PLANOS DE SAÚDE</div></div>
  <div id="en-seal"><div><div class="sh">${icon("shield", 42, { color: GOLD, sw: 3.6 })}</div><span>EXCLUSIVO PARA CNPJ/MEI</span></div></div>
  <div id="en-sub"><div>a partir de 3 vidas · capital de São Paulo</div></div>
  <div id="en-t" class="ln se">Atendimento no</div>
  <div id="en-n" class="ln sa">Vila Nova Star</div>
  <div id="en-btn">${icon("form", 76, { color: INK, sw: 3.6 })}<div id="en-bt">Solicite sua cotação<small>Preencha o formulário</small></div></div>
  <div id="en-ar">${icon("down", 40, { color: GOLD, sw: 5 })}<span>Clique no link abaixo</span>${icon("down", 40, { color: GOLD, sw: 5 })}</div>
  <div id="en-lg" class="legal">${NET_TXT} ${SRC_TXT} ${LEGAL_ALL}</div>`;
  add(`tl.fromTo("#en-bg img",{scale:1.06},{scale:1,duration:${DUR[p]},ease:"none"},0);`);
  fadeUp(add, "#en-band", 0.02, 0.4, 20);
  fadeUp(add, "#en-seal", 0.1, 0.4, 20);
  fadeUp(add, "#en-sub", 0.18, 0.4, 16);
  fadeUp(add, "#en-t", 0.26, 0.45, 24);
  add(`tl.fromTo("#en-n",{scale:1.2,opacity:0},{scale:1,opacity:1,duration:0.5,ease:"power3.out"},0.34);`);
  add(`tl.fromTo("#en-btn",{scale:0.6,opacity:0},{scale:1,opacity:1,duration:0.45,ease:"back.out(2)"},${r3(L(T.preenche) - 0.25)});`);
  for (let i = 0; i < 4; i++) add(`tl.to("#en-btn",{scale:1.05,duration:0.22,yoyo:true,repeat:1,ease:"sine.inOut"},${r3(L(T.formulario) + 0.45 + i * 1.3)});`);
  add(`tl.fromTo("#en-ar",{y:20,opacity:0},{y:0,opacity:1,duration:0.4},${r3(L(T.formulario) + 0.1)});`);
  add(`tl.fromTo("#en-ar svg",{y:-8},{y:8,duration:0.45,yoyo:true,repeat:9,ease:"sine.inOut"},${r3(L(T.formulario) + 0.5)});`);
  add(`tl.fromTo("#en-lg",{opacity:0},{opacity:1,duration:0.5},0.4);`);
  push(p, css, body, a);
}

// ═════════════ cabeçalho fixo (s1–s6): PLANOS DE SAÚDE + EXCLUSIVO PARA CNPJ/MEI ═════════════
{
  const p = "hd";
  const { a, add } = TL(0);
  const css =
    FONTS +
    `#hd-root{position:absolute;inset:0;width:${W}px;height:${H}px;pointer-events:none;}
#hd-band{position:absolute;left:0;width:${W}px;top:250px;display:flex;justify-content:center;}
#hd-band>div{position:relative;padding:12px 40px 14px;border-radius:12px;background:${GOLD};color:${INK};font-family:"Mont";font-weight:900;font-size:56px;line-height:1;letter-spacing:.02em;white-space:nowrap;box-shadow:0 10px 30px rgba(0,0,0,.35);}
#hd-sw{position:absolute;inset:0;overflow:hidden;border-radius:12px;}
#hd-shine{position:absolute;top:0;left:-160px;width:120px;height:100%;background:linear-gradient(90deg,rgba(255,255,255,0),rgba(255,255,255,.55),rgba(255,255,255,0));transform:skewX(-20deg);}
#hd-seal{position:absolute;left:0;width:${W}px;top:350px;display:flex;justify-content:center;}
#hd-seal>div{display:flex;align-items:center;gap:14px;padding:10px 30px 10px 12px;border-radius:60px;background:#fff;color:${INK};font-family:"Mont";font-weight:900;font-size:38px;white-space:nowrap;box-shadow:0 10px 30px rgba(0,0,0,.35);}
#hd-seal .sh{width:56px;height:56px;border-radius:50%;background:${INK};display:flex;align-items:center;justify-content:center;}
#hd-sub{position:absolute;left:0;width:${W}px;top:442px;display:flex;justify-content:center;}
#hd-sub>div{padding:6px 22px;border-radius:26px;background:rgba(7,9,14,.82);border:2px solid rgba(212,176,106,.6);font-family:"Poppins";font-weight:600;font-size:26px;color:${GOLD2};white-space:nowrap;}`;
  const body = `<div id="hd-band"><div><span>PLANOS DE SAÚDE</span><div id="hd-sw" data-layout-allow-overflow aria-hidden="true"><div id="hd-shine" data-layout-allow-overflow></div></div></div></div>
  <div id="hd-seal"><div><div class="sh">${icon("shield", 36, { color: GOLD, sw: 3.6 })}</div><span>EXCLUSIVO PARA CNPJ/MEI</span></div></div>
  <div id="hd-sub"><div>a partir de 3 vidas · capital de São Paulo</div></div>`;
  [0.4, ST.s2 + 0.1, ST.s5 + 0.1].forEach((t) => add(`tl.fromTo("#hd-shine",{x:0},{x:900,duration:0.9,ease:"power2.inOut",immediateRender:false},${r3(t)});`));
  add(`tl.fromTo("#hd-seal",{scale:1},{scale:1.06,duration:0.18,yoyo:true,repeat:1,ease:"power2.out"},${r3(T.cnpj)});`);
  scenes.push({ st: 0, track: 6, ...scene(p, ST.en + 0.04, css, body, a) });
}

scenes.push(uiScene([
  [ST.s2, 0.35],
  [T.ps, 0.3],
  [T.particular + 0.46, 0.35],
  [ST.en, 0.3],
], { color: "255,240,214", grain: 0.05 }));

const SFX = [
  ["riser", T.quando - 0.05, 0.35],
  ["impact", T.quando, 0.4],
  ["whoosh", T.hotel - 0.1, 0.3],
  ["tap", T.apart, 0.35],
  ["tap", T.concierge, 0.35],
  ["tap", T.cardapio, 0.35],
  ["whoosh", ST.s3, 0.35],
  ["impact", T.ps, 0.4],
  ["shimmer", T.suite, 0.3],
  ["check", T.consulta, 0.35],
  ["check", T.exames, 0.35],
  ["check", T.dentro, 0.35],
  ["whoosh", ST.s4, 0.35],
  ["stamp", T.particular + 0.46, 0.5],
  ["whoosh", ST.s5, 0.35],
  ["check", T.cnpj, 0.4],
  ["check", T.tres, 0.4],
  ["shimmer", T.vila2, 0.35],
  ["card", T.compara + 0.35, 0.35],
  ["pop", T.melhor, 0.4],
  ["whoosh", ST.s6, 0.35],
  ["whoosh", ST.en, 0.35],
  ["chime", T.formulario, 0.35],
];

writeOutput(scenes, SFX, { bg: INK });
