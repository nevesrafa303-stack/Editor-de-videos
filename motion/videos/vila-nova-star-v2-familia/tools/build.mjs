// build.mjs — variação 2 (família) do anúncio "Vila Nova Star pelo CNPJ/MEI" (story 9:16, capital de SP).
// Diferente da variação 1 de propósito: gancho de dor ("se o seu filho passar mal de madrugada…") em vez de
// curiosidade; lista de 3 provas numeradas (pediatria com pronto-socorro em suítes, UTI com acompanhante, exames
// ali dentro) em vez de tour pela hotelaria; pergunta "o seu plano tem o Vila Nova Star na rede?"; família pelo
// CNPJ. Visual claro e editorial (marfim, azul-marinho e dourado escuro), serifada itálica, imagens em molduras em
// arco. Voz: Roberta.
//   node tools/build.mjs   (ou bash tools/assemble.sh, que também faz o carve da trilha)

import { W, H, D, r3, at, seq, fontFaces, wspans, baseCss, scene, video, TL, icon, OBS, LEGAL_ALL, SRC_TXT, NET_TXT, uiScene, writeOutput } from "./core.mjs";

const IV = "#F4EFE6"; // marfim
const NV = "#0E1A2B"; // azul-marinho
const GD = "#8E6E33"; // dourado escuro (texto sobre marfim)
const GL = "#D9BC82"; // dourado claro (sobre azul)

const FONTS = fontFaces([
  ["InstSerif", 400, "InstrumentSerif-Italic", "italic"],
  ["Mont", 800, "Montserrat-800"],
  ["Mont", 900, "Montserrat-900"],
  ["Poppins", 400, "Poppins-normal-400"],
  ["Poppins", 500, "Poppins-normal-500"],
  ["Poppins", 600, "Poppins-normal-600"],
]);

// duração de cada vídeo preparado (tools/prep_clips.py), para conferir que nenhum trecho passa do fim
const CLIP = { noite: 4.5, a_corredor: 2.97, a_quarto01: 1.87, a_quarto02: 4.1, a_quarto03: 1.87, a_centro: 2.53, a_medica: 1.87, a_fachada: 2.77, a_lobby: 2.77, a_vista: 2.78 };

const css0 = (p, dark = false) =>
  FONTS +
  baseCss(p) +
  `
#${p}-root{font-family:"Poppins",Arial,sans-serif;color:${dark ? IV : NV};background:${dark ? NV : IV};}
.se{font-family:"InstSerif",Georgia,serif;font-style:italic;font-weight:400;line-height:1.05;}
.mt{font-family:"Mont",Arial,sans-serif;font-weight:800;text-transform:uppercase;letter-spacing:.22em;}
.legal{position:absolute;left:80px;width:${W - 160}px;text-align:center;font-size:20px;line-height:1.4;color:${dark ? "rgba(244,239,230,.92)" : NV};}
.arch{position:absolute;left:260px;top:520px;width:560px;height:600px;border-radius:280px 280px 26px 26px;overflow:hidden;border:3px solid ${GD};box-shadow:0 24px 60px rgba(14,26,43,.22);}
.archo{position:absolute;left:244px;top:504px;width:592px;height:632px;border-radius:296px 296px 34px 34px;border:1.5px solid rgba(142,110,51,.45);}
.num{position:absolute;left:76px;top:960px;font-size:190px;color:${GD};line-height:1;}
.kick{top:1146px;font-size:26px;color:${GD};}
.ttl{top:1186px;font-size:66px;}
.sub{top:1262px;font-size:40px;color:${GD};}
.pills{position:absolute;left:0;width:${W}px;top:1330px;display:flex;justify-content:center;gap:14px;}
.pill{display:flex;align-items:center;gap:8px;padding:8px 20px;border-radius:30px;border:2px solid ${NV};background:#fff;font-family:"Poppins";font-weight:600;font-size:28px;white-space:nowrap;}
`;

// ───────────── tempos (absolutos, da locução) ─────────────
const T = {};
T.se = at("se");
T.filho = at("filho");
T.madrugada = at("madrugada");
T.pra = at("pra");
T.hospital1 = at("hospital", T.pra);
T.leva = at("leva");
T.no = at("no");
T.pediatria = at("pediatria");
T.ps = at("prontosocorro");
T.vinte = at("vinte");
T.suites = at("suites");
T.triagem = at("triagem");
T.exames1 = at("exames");
T.medicacao = at("medicacao");
T.leito = at("leito");
T.se2 = at("se", T.leito);
T.uti = at("uti");
T.banheiro = at("banheiro");
T.acomp = at("acompanhante");
T.todo = at("todo");
T.e3 = at("e", T.todo);
T.ress = at("ressonancia");
T.pet = at("petct");
T.dentro = at("dentro");
T.sair = at("sair");
T.agora = at("agora");
T.importa = at("importa");
T.seu2 = at("seu", T.importa);
T.vila2 = at("vila", T.importa);
T.rede1 = at("rede", T.vila2);
T.se3 = at("se", T.rede1);
T.cnpj = at("cnpj");
T.tres = at("tres");
T.da = at("da", T.tres);
T.familia = at("familia");
T.empresarial = at("empresarial");
T.rede2 = at("rede", T.empresarial);
T.gente = at("gente");
T.compara = at("compara");
T.clica = at("clica");
T.preenche = at("preenche");
T.formulario = at("formulario");

const ST = {
  h: 0,
  i1: r3(T.no - 0.1),
  i2: r3(T.se2 - 0.1),
  i3: r3(T.e3 - 0.1),
  q: r3(T.agora - 0.1),
  c: r3(T.se3 - 0.1),
  en: r3(T.clica - 0.1),
};
const ORDER = ["h", "i1", "i2", "i3", "q", "c", "en"];
const DUR = Object.fromEntries(ORDER.map((k, i) => [k, r3((i < ORDER.length - 1 ? ST[ORDER[i + 1]] : D) - ST[k] + (i < ORDER.length - 1 ? 0.04 : 0))]));

const scenes = [];
const push = (p, css, body, a) => scenes.push({ st: ST[p], track: 1, ...scene(p, DUR[p], css, body, a) });

// vídeos em sequência dentro de um contêiner (moldura em arco ou tela cheia), com empurrão lento
function seqClips(p, wrapCls, list) {
  let html = "", anim = [];
  list.forEach(([name, t0, t1, z0 = 1.0, z1 = 1.08]) => {
    if (t1 - t0 > CLIP[name] + 0.01) throw new Error(`${p}: ${name} tem ${CLIP[name]} s, trecho pede ${r3(t1 - t0)} s`);
  });
  list.forEach(([name, t0, t1, z0 = 1.0, z1 = 1.08], i) => {
    const id = `${p}-v${i}`;
    html += `<div class="vw ${wrapCls}" id="${id}w" data-layout-allow-overflow>${video(id, name, t0, r3(Math.min(CLIP[name], t1 - t0 + 0.04)))}</div>`;
    anim.push(`tl.fromTo("#${id}w",{scale:${z0}},{scale:${z1},duration:${r3(t1 - t0 + 0.04)},ease:"none"},${r3(t0)});`);
  });
  return { html, anim };
}
const fadeUp = (add, sel, t, d = 0.45, y = 30) =>
  add(`tl.fromTo("${sel}",{y:${y},opacity:0},{y:0,opacity:1,duration:${d},ease:"power3.out"},${r3(Math.max(0, t))});`);
const pop = (add, sel, t) =>
  add(`tl.fromTo("${sel}",{scale:0.7,opacity:0},{scale:1,opacity:1,duration:0.38,ease:"back.out(2)"},${r3(Math.max(0, t))});`);

// cena de prova numerada: moldura em arco com os vídeos, número grande, título e detalhes
function item(p, n, clips, { kick, ttl, sub, pills, tTtl, tSub, tPills, legal, from = 1 }) {
  const { a, L, add, words } = TL(ST[p]);
  const v = seqClips(p, `${p}-in`, clips.map(([nm, t0, t1, z0, z1]) => [nm, t0, t1, z0, z1]));
  const css = css0(p) + `
#${p}-arch .vw{position:absolute;inset:0;}
.${p}-in{position:absolute;inset:0;}
`;
  const body = `
  <div class="archo" id="${p}-ao"></div>
  <div class="arch" id="${p}-arch">${v.html}</div>
  <div class="num se" id="${p}-n">${n}</div>
  <div class="ln mt kick" id="${p}-k">${kick}</div>
  <div class="ln se ttl" id="${p}-t">${wspans(`${p}t`, ttl)}</div>
  <div class="ln se sub" id="${p}-s">${sub}</div>
  <div class="pills" id="${p}-pl">${pills.map((t, i) => `<div class="pill" id="${p}-p${i}">${icon("check", 24, { color: GD, sw: 6 })}<span>${t}</span></div>`).join("")}</div>
  <div class="legal" id="${p}-lg" style="top:1410px">${legal}</div>`;
  v.anim.forEach(add);
  add(`tl.fromTo("#${p}-arch",{x:${from * 120},opacity:0},{x:0,opacity:1,duration:0.6,ease:"power3.out"},0);`);
  add(`tl.fromTo("#${p}-ao",{opacity:0,scale:0.96},{opacity:1,scale:1,duration:0.8,ease:"power2.out"},0.15);`);
  add(`tl.fromTo("#${p}-n",{y:60,opacity:0},{y:0,opacity:1,duration:0.6,ease:"power3.out"},0.2);`);
  fadeUp(add, `#${p}-k`, 0.3, 0.4, 16);
  words(`${p}t`, seq(tTtl[0], tTtl[1]), 0.42);
  fadeUp(add, `#${p}-s`, L(tSub) - 0.05, 0.4, 16);
  tPills.forEach((t, i) => pop(add, `#${p}-p${i}`, L(t) - 0.08));
  fadeUp(add, `#${p}-lg`, 0.5, 0.4, 0);
  return { p, a, css, body };
}

// ═════════════ h · gancho: "Se o seu filho passar mal de madrugada… pra qual hospital você leva?" ═════════════
{
  const p = "h";
  const { a, L, add, words } = TL(ST[p]);
  const v = seqClips(p, `${p}-full`, [["noite", 0, DUR[p], 1.08, 1.0]]);
  const css = css0(p, true) + `
#h-ov{position:absolute;inset:0;background:radial-gradient(70% 55% at 50% 45%,rgba(14,26,43,.62),rgba(14,26,43,.9));}
#h-clk{position:absolute;left:0;width:${W}px;top:560px;display:flex;justify-content:center;align-items:center;gap:22px;}
#h-clk .t{font-family:"Mont";font-weight:800;font-size:150px;line-height:1;color:${GL};letter-spacing:.02em;}
#h-clk .c{display:inline-block;}
#h-a{top:790px;font-size:68px;}
#h-b{top:868px;font-size:68px;}
#h-c{top:1000px;font-size:74px;color:${GL};}
#h-lg{top:1452px;}
`;
  const body = `
  ${v.html}
  <div id="h-ov"></div>
  <div id="h-clk">${icon("moon", 92, { color: GL, sw: 3 })}<div class="t">02<span class="c" id="h-col">:</span>47</div></div>
  <div id="h-a" class="ln se">${wspans("ha", "Se o seu filho passar mal")}</div>
  <div id="h-b" class="ln se">${wspans("hb", "de madrugada…")}</div>
  <div id="h-c" class="ln se">${wspans("hc", "pra qual hospital você leva?")}</div>
  <div id="h-lg" class="legal">${OBS.eleg} ${OBS.img}</div>`;
  v.anim.forEach(add);
  add(`tl.fromTo("#h-col",{opacity:1},{opacity:0.15,duration:0.5,repeat:7,yoyo:true,ease:"steps(1)"},0);`);
  words("hb", seq("de madrugada", T.madrugada - 0.25), 0.45);
  words("hc", seq("pra qual hospital voce leva", T.pra), 0.42);
  push(p, css, body, a);
}

// ═════════════ i1 · prova 01: pediatria com pronto-socorro 24 h em suítes privativas ═════════════
{
  const p = "i1";
  const L = (t) => r3(t - ST[p]);
  const c = [2.6, 5.5, 7.3]; // cortes distribuídos para caber na duração de cada vídeo
  const it = item(p, "01", [
    ["a_lobby", 0, c[0]],
    ["a_corredor", c[0], c[1]],
    ["a_quarto01", c[1], c[2]],
    ["a_quarto03", c[2], DUR[p]],
  ], {
    kick: "PEDIATRIA STAR",
    ttl: "Pronto-socorro infantil 24 h",
    sub: "em suítes privativas",
    pills: ["Triagem", "Exames", "Medicação no próprio leito"],
    tTtl: ["prontosocorro vinte quatro horas", T.ps - 0.05],
    tSub: T.suites,
    tPills: [T.triagem, T.exames1, T.medicacao],
    legal: `Pediatria Star: pronto-socorro 24 h em suítes privativas, segundo o site oficial do hospital. ${OBS.rede} ${OBS.img}`,
  });
  push(p, it.css, it.body, it.a);
}

// ═════════════ i2 · prova 02: UTI com banheiro privativo e acompanhante em tempo integral ═════════════
{
  const p = "i2";
  const L = (t) => r3(t - ST[p]);
  const c = [r3(DUR[p] - 1.86)]; // a médica fecha a cena; o quarto com leito vem antes
  const it = item(p, "02", [
    ["a_quarto02", 0, c[0], 1.0, 1.1],
    ["a_medica", c[0], DUR[p]],
  ], {
    kick: "UTI · 40 LEITOS",
    ttl: "Banheiro privativo",
    sub: "e acompanhante o tempo todo",
    pills: ["Todos os leitos da UTI"],
    tTtl: ["banheiro privativo", T.banheiro],
    tSub: T.acomp,
    tPills: [T.uti + 0.3],
    legal: `UTI com 40 leitos, todos com banheiro privativo e acomodação para acompanhante em tempo integral, segundo o site oficial. ${OBS.rede} ${OBS.cob} ${OBS.img}`,
    from: -1,
  });
  push(p, it.css, it.body, it.a);
}

// ═════════════ i3 · prova 03: exames da ressonância ao PET-CT ali dentro ═════════════
{
  const p = "i3";
  const L = (t) => r3(t - ST[p]);
  const c = [Math.min(L(T.dentro) - 0.2, 2.53)];
  const it = item(p, "03", [
    ["a_centro", 0, c[0]],
    ["a_vista", c[0], DUR[p]],
  ], {
    kick: "CENTRO DE DIAGNÓSTICOS",
    ttl: "Exames ali dentro",
    sub: "da ressonância ao PET-CT",
    pills: ["Sem sair do hospital"],
    tTtl: ["exames ali dentro", T.e3],
    tSub: T.ress,
    tPills: [T.sair],
    legal: `Exames de imagem como ressonância e PET/CT feitos nas dependências do hospital, segundo o site oficial. ${OBS.rede} ${OBS.img}`,
  });
  push(p, it.css, it.body, it.a);
}

// ═════════════ q · pergunta: "Agora, a pergunta que importa: o seu plano de saúde tem o Vila Nova Star na rede?" ═════════════
{
  const p = "q";
  const { a, L, add, words } = TL(ST[p]);
  const css = css0(p, true) + `
#q-k{top:560px;font-size:30px;color:${GL};}
#q-a{top:636px;font-size:74px;}
#q-b{top:716px;font-size:74px;}
#q-n{top:800px;font-size:118px;color:${GL};}
#q-c{top:934px;font-size:74px;}
#q-box{position:absolute;left:110px;top:1080px;width:860px;height:118px;border-radius:24px;background:${IV};color:${NV};display:flex;align-items:center;gap:20px;padding:0 30px;box-shadow:0 20px 50px rgba(0,0,0,.35);}
#q-lbl{position:absolute;left:110px;top:1040px;font-family:"Poppins";font-weight:600;font-size:26px;color:${GL};}
#q-tx{font-family:"Poppins";font-weight:600;font-size:46px;white-space:nowrap;}
#q-cur{display:inline-block;width:4px;height:52px;background:${GD};margin-left:4px;vertical-align:middle;}
#q-qm{margin-left:auto;width:78px;height:78px;border-radius:50%;background:${GD};color:#fff;display:flex;align-items:center;justify-content:center;font-family:"Mont";font-weight:900;font-size:50px;}
#q-lg{top:1452px;}
`;
  const body = `
  <div id="q-k" class="ln mt">A PERGUNTA QUE IMPORTA</div>
  <div id="q-a" class="ln se">${wspans("qa", "O seu plano de saúde")}</div>
  <div id="q-b" class="ln se">${wspans("qb", "tem o")}</div>
  <div id="q-n" class="ln se">Vila Nova Star</div>
  <div id="q-c" class="ln se">${wspans("qc", "na rede?")}</div>
  <div id="q-lbl">Rede do seu plano</div>
  <div id="q-box">${icon("search", 50, { color: NV, sw: 4 })}<span id="q-tx">Vila Nova Star</span><span id="q-cur"></span><div id="q-qm">?</div></div>
  <div id="q-lg" class="legal">${OBS.rede} ${OBS.varia} ${OBS.img}</div>`;
  fadeUp(add, "#q-k", L(T.agora), 0.4, 16);
  words("qa", seq("o seu plano de saude", T.importa), 0.4);
  words("qb", seq("tem o", at("tem", T.seu2)), 0.4);
  add(`tl.fromTo("#q-n",{scale:1.2,opacity:0},{scale:1,opacity:1,duration:0.5,ease:"power3.out"},${r3(L(T.vila2) - 0.06)});`);
  words("qc", seq("na rede", at("na", T.vila2)), 0.4);
  fadeUp(add, "#q-lbl", L(T.importa), 0.4, 10);
  add(`tl.fromTo("#q-box",{y:40,opacity:0},{y:0,opacity:1,duration:0.45,ease:"power3.out"},${r3(L(T.importa) - 0.05)});`);
  add(`tl.fromTo("#q-tx",{clipPath:"inset(0 100% 0 0)"},{clipPath:"inset(0 0% 0 0)",duration:0.8,ease:"steps(14)"},${r3(L(T.vila2) - 0.1)});`);
  add(`tl.fromTo("#q-cur",{opacity:1},{opacity:0,duration:0.25,repeat:11,yoyo:true,ease:"steps(1)"},${r3(L(T.importa))});`);
  pop(add, "#q-qm", L(T.rede1) - 0.05);
  add(`tl.to("#q-qm",{scale:1.15,duration:0.25,yoyo:true,repeat:3,ease:"sine.inOut"},${r3(L(T.rede1) + 0.4)});`);
  push(p, css, body, a);
}

// ═════════════ c · CNPJ e família: "Se você tem CNPJ ou MEI e três vidas ou mais… você e a sua família… a gente compara" ═════════════
{
  const p = "c";
  const { a, L, add, words } = TL(ST[p]);
  const css = css0(p) + `
#c-a{top:540px;font-size:62px;}
.c-tag{position:absolute;left:0;width:${W}px;display:flex;justify-content:center;}
.c-tag>div{display:flex;align-items:center;gap:16px;padding:14px 34px;border-radius:60px;background:${NV};color:${IV};font-family:"Mont";font-weight:900;font-size:50px;white-space:nowrap;}
#c-t0{top:626px;}#c-t1{top:746px;}
#c-fam{position:absolute;left:0;width:${W}px;top:888px;display:flex;justify-content:center;align-items:flex-end;gap:22px;}
.c-pe{width:118px;height:118px;border-radius:50%;background:#fff;border:3px solid ${GD};display:flex;align-items:center;justify-content:center;}
#c-p2{width:96px;height:96px;}
#c-fl{top:1024px;font-size:54px;}
#c-card{position:absolute;left:110px;top:1104px;width:860px;height:160px;border-radius:26px;background:${NV};color:${IV};display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;box-shadow:0 20px 50px rgba(14,26,43,.25);}
#c-card .k{font-family:"Mont";font-weight:800;font-size:26px;letter-spacing:.2em;color:${GL};}
#c-card .n{font-family:"InstSerif";font-style:italic;font-size:66px;line-height:1;}
#c-cmp{top:1290px;font-size:52px;color:${GD};}
#c-ul{position:absolute;left:240px;top:1356px;width:600px;height:4px;background:${GD};transform-origin:0 50%;}
#c-lg{top:1392px;}
`;
  const person = (id, kind, size) => `<div class="c-pe" id="${id}">${icon(kind, size, { color: NV, sw: 3.4 })}</div>`;
  const body = `
  <div id="c-a" class="ln se">${wspans("ca", "Se você tem")}</div>
  <div class="c-tag" id="c-t0"><div>${icon("check", 44, { color: GL, sw: 6 })}<span>CNPJ ou MEI</span></div></div>
  <div class="c-tag" id="c-t1"><div>${icon("check", 44, { color: GL, sw: 6 })}<span>3 vidas ou mais</span></div></div>
  <div id="c-fam">${person("c-p0", "person", 70)}${person("c-p1", "person", 70)}${person("c-p2", "child", 60)}</div>
  <div id="c-fl" class="ln se">${wspans("cf", "você e a sua família")}</div>
  <div id="c-card"><div class="k">PLANO EMPRESARIAL · PELO CNPJ</div><div class="n">Vila Nova Star na rede</div></div>
  <div id="c-cmp" class="ln se">${wspans("cc", "a gente compara as operadoras pra você")}</div>
  <div id="c-ul"></div>
  <div id="c-lg" class="legal">${OBS.eleg} ${OBS.analise} ${OBS.faixa} ${OBS.perfil} ${OBS.varia} ${OBS.cob}</div>`;
  words("ca", seq("se voce tem", T.se3), 0.38);
  [T.cnpj, T.tres].forEach((t, i) => add(`tl.fromTo("#c-t${i}",{x:-90,opacity:0},{x:0,opacity:1,duration:0.42,ease:"back.out(1.6)"},${r3(L(t) - 0.12)});`));
  [["#c-p0", T.da], ["#c-p1", T.da + 0.14], ["#c-p2", T.da + 0.28]].forEach(([s, t]) =>
    add(`tl.fromTo("${s}",{scale:0,opacity:0},{scale:1,opacity:1,duration:0.4,ease:"back.out(2.2)"},${r3(L(t))});`),
  );
  words("cf", seq("voce e a sua familia", at("voce", T.da)), 0.4);
  add(`tl.fromTo("#c-card",{y:40,opacity:0,scale:0.95},{y:0,opacity:1,scale:1,duration:0.5,ease:"back.out(1.5)"},${r3(L(T.empresarial) - 0.25)});`);
  add(`tl.fromTo("#c-card",{boxShadow:"0 20px 50px rgba(14,26,43,.25)"},{boxShadow:"0 20px 70px rgba(142,110,51,.55)",duration:0.35,yoyo:true,repeat:1},${r3(L(T.rede2))});`);
  words("cc", seq("a gente compara as operadoras pra voce", at("a", T.rede2)), 0.4);
  add(`tl.fromTo("#c-ul",{scaleX:0},{scaleX:1,duration:0.6,ease:"power3.inOut"},${r3(L(T.compara) + 0.3)});`);
  push(p, css, body, a);
}

// ═════════════ en · CTA: "Clica no link, preenche o formulário e receba a sua cotação." ═════════════
{
  const p = "en";
  const { a, L, add } = TL(ST[p]);
  const css = css0(p) + `
#en-band{position:absolute;left:0;width:${W}px;top:250px;display:flex;justify-content:center;}
#en-band>div{padding:14px 44px 16px;border-radius:12px;background:${NV};color:${IV};font-family:"Mont";font-weight:900;font-size:64px;line-height:1;letter-spacing:.02em;white-space:nowrap;border-bottom:5px solid ${GD};}
#en-seal{position:absolute;left:0;width:${W}px;top:368px;display:flex;justify-content:center;}
#en-seal>div{display:flex;align-items:center;gap:16px;padding:12px 34px 12px 14px;border-radius:60px;background:${GL};color:${NV};font-family:"Mont";font-weight:900;font-size:44px;white-space:nowrap;box-shadow:0 10px 30px rgba(14,26,43,.2);}
#en-seal .sh{width:64px;height:64px;border-radius:50%;background:${NV};display:flex;align-items:center;justify-content:center;}
#en-sub{position:absolute;left:0;width:${W}px;top:476px;display:flex;justify-content:center;}
#en-sub>div{padding:8px 26px;border-radius:30px;background:${NV};font-family:"Poppins";font-weight:600;font-size:30px;color:${IV};white-space:nowrap;}
#en-ph{position:absolute;left:330px;top:560px;width:420px;height:330px;border-radius:210px 210px 22px 22px;overflow:hidden;border:3px solid ${GD};}
#en-ph img{width:100%;height:100%;object-fit:cover;}
#en-t{top:908px;font-size:56px;}
#en-t2{top:968px;font-size:56px;color:${GD};}
#en-btn{position:absolute;left:110px;top:1052px;width:860px;height:142px;border-radius:80px;background:${NV};color:${IV};display:flex;align-items:center;justify-content:center;gap:24px;box-shadow:0 18px 50px rgba(14,26,43,.3);}
#en-bt{font-family:"Mont";font-weight:900;font-size:52px;line-height:1.05;}
#en-bt small{display:block;font-family:"Poppins";font-weight:600;font-size:26px;color:${GL};}
#en-ar{position:absolute;left:0;width:${W}px;top:1210px;display:flex;justify-content:center;align-items:center;gap:14px;font-family:"Mont";font-weight:800;font-size:34px;}
#en-lg{top:1268px;font-size:19px;line-height:1.34;}
`;
  const body = `
  <div id="en-band"><div>PLANOS DE SAÚDE</div></div>
  <div id="en-seal"><div><div class="sh">${icon("shield", 42, { color: GL, sw: 3.6 })}</div><span>EXCLUSIVO PARA CNPJ/MEI</span></div></div>
  <div id="en-sub"><div>a partir de 3 vidas · capital de São Paulo</div></div>
  <div id="en-ph"><img src="assets/img/fachada.jpg" alt="Fachada do Hospital Vila Nova Star" /></div>
  <div id="en-t" class="ln se">O Vila Nova Star no plano</div>
  <div id="en-t2" class="ln se">da sua família, pelo CNPJ</div>
  <div id="en-btn">${icon("form", 72, { color: GL, sw: 3.6 })}<div id="en-bt">Solicite sua cotação<small>Preencha o formulário</small></div></div>
  <div id="en-ar">${icon("down", 38, { color: GD, sw: 5 })}<span>Clique no link abaixo</span>${icon("down", 38, { color: GD, sw: 5 })}</div>
  <div id="en-lg" class="legal">${NET_TXT} ${SRC_TXT} ${LEGAL_ALL}</div>`;
  fadeUp(add, "#en-band", 0.02, 0.4, 20);
  fadeUp(add, "#en-seal", 0.1, 0.4, 20);
  fadeUp(add, "#en-sub", 0.18, 0.4, 16);
  add(`tl.fromTo("#en-ph",{opacity:0,y:30},{opacity:1,y:0,duration:0.5,ease:"power3.out"},0.24);`);
  add(`tl.fromTo("#en-ph img",{scale:1.12},{scale:1,duration:${DUR[p]},ease:"none"},0);`);
  fadeUp(add, "#en-t", 0.34, 0.45, 20);
  fadeUp(add, "#en-t2", 0.44, 0.45, 20);
  add(`tl.fromTo("#en-btn",{scale:0.6,opacity:0},{scale:1,opacity:1,duration:0.45,ease:"back.out(2)"},${r3(L(T.preenche) - 0.25)});`);
  for (let i = 0; i < 4; i++) add(`tl.to("#en-btn",{scale:1.05,duration:0.22,yoyo:true,repeat:1,ease:"sine.inOut"},${r3(L(T.formulario) + 0.45 + i * 1.3)});`);
  add(`tl.fromTo("#en-ar",{y:20,opacity:0},{y:0,opacity:1,duration:0.4},${r3(L(T.formulario) + 0.1)});`);
  add(`tl.fromTo("#en-ar svg",{y:-8},{y:8,duration:0.45,yoyo:true,repeat:9,ease:"sine.inOut"},${r3(L(T.formulario) + 0.5)});`);
  add(`tl.fromTo("#en-lg",{opacity:0},{opacity:1,duration:0.5},0.4);`);
  push(p, css, body, a);
}

// ═════════════ cabeçalho fixo (h → c): PLANOS DE SAÚDE + EXCLUSIVO PARA CNPJ/MEI ═════════════
{
  const p = "hd";
  const { a, add } = TL(0);
  const css =
    FONTS +
    `#hd-root{position:absolute;inset:0;width:${W}px;height:${H}px;pointer-events:none;}
#hd-band{position:absolute;left:0;width:${W}px;top:250px;display:flex;justify-content:center;}
#hd-band>div{padding:12px 40px 14px;border-radius:12px;background:${NV};color:${IV};font-family:"Mont";font-weight:900;font-size:54px;line-height:1;letter-spacing:.02em;white-space:nowrap;border:2px solid ${GL};box-shadow:0 10px 30px rgba(14,26,43,.25);}
#hd-seal{position:absolute;left:0;width:${W}px;top:348px;display:flex;justify-content:center;}
#hd-seal>div{display:flex;align-items:center;gap:14px;padding:10px 30px 10px 12px;border-radius:60px;background:${GL};color:${NV};font-family:"Mont";font-weight:900;font-size:38px;white-space:nowrap;box-shadow:0 10px 30px rgba(14,26,43,.25);}
#hd-seal .sh{width:56px;height:56px;border-radius:50%;background:${NV};display:flex;align-items:center;justify-content:center;}
#hd-sub{position:absolute;left:0;width:${W}px;top:438px;display:flex;justify-content:center;}
#hd-sub>div{padding:6px 22px;border-radius:26px;background:${NV};font-family:"Poppins";font-weight:600;font-size:26px;color:${IV};white-space:nowrap;}`;
  const body = `<div id="hd-band"><div>PLANOS DE SAÚDE</div></div>
  <div id="hd-seal"><div><div class="sh">${icon("shield", 36, { color: GL, sw: 3.6 })}</div><span>EXCLUSIVO PARA CNPJ/MEI</span></div></div>
  <div id="hd-sub"><div>a partir de 3 vidas · capital de São Paulo</div></div>`;
  add(`tl.fromTo("#hd-seal",{scale:1},{scale:1.06,duration:0.18,yoyo:true,repeat:1,ease:"power2.out"},${r3(T.cnpj)});`);
  scenes.push({ st: 0, track: 6, ...scene(p, ST.en + 0.04, css, body, a) });
}

scenes.push(uiScene([
  [ST.i1, 0.22],
  [ST.q, 0.18],
  [ST.en, 0.2],
], { color: "255,250,240", grain: 0.035 }));

const SFX = [
  ["clock", 0.25, 0.3],
  ["clock", 1.25, 0.25],
  ["riser", T.no - 0.05, 0.3],
  ["impact", T.no, 0.35],
  ["pop", T.triagem, 0.3],
  ["pop", T.exames1, 0.3],
  ["pop", T.medicacao, 0.3],
  ["whoosh", ST.i2, 0.35],
  ["shimmer", T.banheiro, 0.3],
  ["pop", T.uti + 0.3, 0.3],
  ["whoosh", ST.i3, 0.35],
  ["pop", T.sair, 0.3],
  ["whoosh", ST.q, 0.35],
  ["tap", T.vila2, 0.3],
  ["stamp", T.rede1, 0.45],
  ["whoosh", ST.c, 0.3],
  ["check", T.cnpj, 0.4],
  ["check", T.tres, 0.4],
  ["pop", T.da, 0.3],
  ["card", T.empresarial - 0.2, 0.35],
  ["shimmer", T.rede2, 0.3],
  ["whoosh", ST.en, 0.35],
  ["chime", T.formulario, 0.35],
];

writeOutput(scenes, SFX, { bg: IV });
