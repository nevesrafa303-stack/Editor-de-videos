// build.mjs — variação 3 do anúncio SulAmérica Direto Nacional 3 vidas, "3 motivos", estilo cinético
// (story 9:16). Fundos laranja / azul-marinho / branco que se alternam a cada motivo, números
// gigantes, adesivos e vídeos em máscaras, tudo preso às palavras da locução (Roberta).
//   node tools/build.mjs   (ou bash tools/assemble.sh, que também faz o carve da trilha)

import {
  W, H, D, r3, at, seq, fontFaces, wspans, baseCss, scene, video, TL, rollHTML, icon,
  Q, QUOTE_TXT, HOSP_TXT, BP_CREDIT, OBS, LEGAL_ALL, uiScene, writeOutput,
} from "./core.mjs";

const OR = "#E8590C";
const NV = "#0A1A3F";
const YL = "#FFD23F";
const WH = "#FFFFFF";

const FONTS = fontFaces([
  ["Mont", 700, "Montserrat-700"],
  ["Mont", 800, "Montserrat-800"],
  ["Mont", 900, "Montserrat-900"],
  ["Pop", 600, "Poppins-normal-600"],
  ["Pop", 500, "Poppins-normal-500"],
  ["Pop", 800, "Poppins-800"],
  ["Pop", 900, "Poppins-900"],
]);

const css0 = (p, bg, fg = WH) =>
  FONTS +
  baseCss(p) +
  `
#${p}-root{font-family:"Pop",Arial,sans-serif;color:${fg};background:${bg};}
.mt{font-family:"Mont",Arial,sans-serif;font-weight:900;line-height:1;}
.pat{position:absolute;left:-60px;top:-60px;}
.legal{position:absolute;left:80px;width:${W - 160}px;text-align:center;font-size:20px;line-height:1.4;}
.pill{position:absolute;left:0;width:${W}px;display:flex;justify-content:center;}
.pill>div{padding:10px 28px;border-radius:40px;font-family:"Mont";font-weight:800;font-size:30px;letter-spacing:.14em;text-transform:uppercase;white-space:nowrap;}
.stk{display:inline-flex;align-items:center;gap:12px;padding:12px 26px;border-radius:18px;font-family:"Mont";font-weight:900;white-space:nowrap;box-shadow:0 10px 0 rgba(0,0,0,.18);}
.blk{position:absolute;left:70px;width:${W - 140}px;text-align:center;}
`;
// fundo com padrão de pontos (gira devagar) — cor do ponto conforme o fundo
const dots = (p, c) =>
  `<svg class="pat" id="${p}-pat" width="${W + 120}" height="${H + 120}" aria-hidden="true" data-layout-allow-overflow><defs><pattern id="${p}-pp" width="44" height="44" patternUnits="userSpaceOnUse"><circle cx="22" cy="22" r="3" fill="${c}"/></pattern></defs><rect width="${W + 120}" height="${H + 120}" fill="url(#${p}-pp)"/></svg>`;

// tempos (absolutos, da locução)
const T = {};
T.ainda = at("ainda");
T.entao = at("entao");
T.tres0 = at("tres", T.entao);
T.motivos = at("motivos");
T.pra = at("pra", T.motivos);
T.um = at("um", at("agora"));
T.sem1 = at("sem", T.um);
T.consulta = at("consulta");
T.exame = at("exame");
T.pronto = at("prontosocorro");
T.sem2 = at("sem", T.pronto);
T.dois = at("dois");
T.hospitais = at("hospitais");
T.em = at("em", T.hospitais);
T.bp = at("bp");
T.sepaco = at("sepaco");
T.unidades = at("unidades");
T.rede = at("rede", T.unidades);
T.tres3 = at("tres", T.rede);
T.familia = at("familia", T.tres3);
T.protegida = at("protegida");
T.tresv = at("tres", T.protegida);
T.sula = at("sulamerica", T.tresv);
T.mil = at("mil", T.sula);
T.mes = at("mes", T.mil);
T.ja = at("ja", T.mes);
T.clica = at("clica");
T.formulario = at("formulario");
T.essa = at("essa", T.formulario);
T.dezenove = at("dezenove");

const ST = { m1: 0, m2: r3(T.entao - 0.12), m3: r3(T.um - 0.12), m4: r3(T.dois - 0.12), m5: r3(T.tres3 - 0.12), en: r3(T.clica - 0.12) };
const ORDER = ["m1", "m2", "m3", "m4", "m5", "en"];
const DUR = Object.fromEntries(ORDER.map((k, i) => [k, r3((i < ORDER.length - 1 ? ST[ORDER[i + 1]] : D) - ST[k] + (i < ORDER.length - 1 ? 0.04 : 0))]));
const scenes = [];
const push = (p, css, body, a) => scenes.push({ st: ST[p], track: 1, ...scene(p, DUR[p], css, body, a) });
const pop = (add, sel, t, rot = 0, from = 0.3) =>
  add(`tl.fromTo("${sel}",{scale:${from},opacity:0,rotation:${rot - 12}},{scale:1,opacity:1,rotation:${rot},duration:0.42,ease:"back.out(2.6)"},${r3(t)});`);
const slam = (add, sel, t, from = 1.7) =>
  add(`tl.fromTo("${sel}",{scale:${from},opacity:0},{scale:1,opacity:1,duration:0.3,ease:"power4.out"},${r3(t)});`);
const enter = (add, p, dir = 1) => add(`tl.fromTo("#${p}-in",{xPercent:${dir * 100}},{xPercent:0,duration:0.32,ease:"power4.out"},0);`);
const drift = (add, p, d) => add(`tl.fromTo("#${p}-pat",{x:0,y:0},{x:44,y:44,duration:${r3(d)},ease:"none"},0);`);

// ═════════════ m1 · gancho: "Tem CNPJ ou MEI e ainda não tem plano de saúde?" ═════════════
{
  const p = "m1";
  const { a, L, add, words } = TL(ST[p]);
  const css = css0(p, OR) + `
#m1-tem{top:280px;font-size:118px;color:${NV};}
#m1-s1{position:absolute;left:0;width:${W}px;top:400px;display:flex;justify-content:center;}
#m1-s1>div{background:${WH};color:${NV};font-size:170px;padding:6px 40px 14px;transform:rotate(-5deg);}
#m1-s2{position:absolute;left:0;width:${W}px;top:600px;display:flex;justify-content:center;}
#m1-s2>div{background:${NV};color:${WH};font-size:120px;padding:6px 36px 14px;transform:rotate(4deg);}
#m1-cw{position:absolute;left:290px;top:790px;width:500px;height:500px;border-radius:50%;overflow:hidden;border:10px solid ${WH};box-shadow:0 20px 50px rgba(0,0,0,.25);}
#m1-q{top:1330px;font-family:"Pop";font-weight:800;font-size:54px;line-height:1.15;color:${WH};}
#m1-q .hl{color:${NV};}
`;
  const body = `
  ${dots(p, "rgba(255,255,255,.12)")}
  <div id="m1-in" class="${p}-full">
    <div id="m1-tem" class="ln mt">TEM</div>
    <div id="m1-s1"><div class="stk">CNPJ</div></div>
    <div id="m1-s2"><div class="stk">OU MEI?</div></div>
    <div id="m1-cw" class="vw">${video("m1-v", "v-contrato", 0, DUR[p])}</div>
    <div id="m1-q" class="blk">${wspans("m1q", "e ainda não tem")} <span class="hl">${wspans("m1r", "plano de saúde?")}</span></div>
  </div>`;
  drift(add, p, DUR[p]);
  add(`tl.fromTo("#m1-s1",{scale:1.08},{scale:1,duration:0.6,ease:"power2.out"},0);`);
  add(`tl.fromTo("#m1-s1>div,#m1-s2>div",{y:0},{y:-10,duration:0.5,yoyo:true,repeat:5,ease:"sine.inOut"},0.3);`);
  add(`tl.fromTo("#m1-cw",{scale:0.9},{scale:1.04,duration:${DUR[p]},ease:"none"},0);`);
  words("m1q", seq("e ainda nao tem", T.ainda - 0.08), 0.32);
  words("m1r", seq("plano de saude", T.ainda + 0.7), 0.32);
  push(p, css, body, a);
}

// ═════════════ m2 · "Então olha esses três motivos pra fazer agora." ═════════════
{
  const p = "m2";
  const { a, L, add, words, shake } = TL(ST[p]);
  const css = css0(p, NV) + `
#m2-3{top:330px;font-size:560px;color:${OR};text-shadow:0 20px 60px rgba(232,89,12,.4);}
#m2-mt{top:880px;font-size:132px;color:${WH};}
#m2-pa{top:1040px;font-family:"Pop";font-weight:800;font-size:56px;color:${YL};}
#m2-sl{position:absolute;left:0;width:${W}px;top:1160px;display:flex;justify-content:center;gap:28px;}
.m2-s{width:140px;height:140px;border-radius:30px;border:6px solid ${WH};display:flex;align-items:center;justify-content:center;font-family:"Mont";font-weight:900;font-size:76px;color:${WH};}
`;
  const body = `
  ${dots(p, "rgba(255,255,255,.07)")}
  <div id="m2-in" class="${p}-full">
    <div id="m2-3" class="ln mt">3</div>
    <div id="m2-mt" class="ln mt">MOTIVOS</div>
    <div id="m2-pa" class="ln">${wspans("m2p", "pra fazer agora")}</div>
    <div id="m2-sl"><div class="m2-s" id="m2-s0">1</div><div class="m2-s" id="m2-s1">2</div><div class="m2-s" id="m2-s2">3</div></div>
  </div>`;
  drift(add, p, DUR[p]);
  enter(add, p, 1);
  slam(add, "#m2-3", L(T.tres0) - 0.06, 2.2);
  shake(`#${p}-in`, r3(L(T.tres0) + 0.1), 14);
  add(`tl.fromTo("#m2-mt",{yPercent:60,opacity:0},{yPercent:0,opacity:1,duration:0.35,ease:"power4.out"},${r3(L(T.motivos) - 0.08)});`);
  words("m2p", seq("pra fazer agora", T.pra), 0.32);
  [0, 1, 2].forEach((i) => pop(add, `#m2-s${i}`, L(T.pra) + 0.15 + i * 0.12));
  push(p, css, body, a);
}

// ═════════════ m3 · "Um: sem coparticipação. Consulta, exame e pronto-socorro… sem pagar nada a mais." ═════════════
{
  const p = "m3";
  const { a, L, add, words } = TL(ST[p]);
  const css = css0(p, WH, NV) + `
#m3-k{top:270px;}
#m3-k>div{background:${OR};color:${WH};}
#m3-t{top:350px;font-size:104px;color:${NV};line-height:.98;}
#m3-cw{position:absolute;left:90px;top:580px;width:900px;height:560px;border-radius:40px;overflow:hidden;box-shadow:0 24px 60px rgba(10,26,63,.25);}
#m3-tags{position:absolute;left:0;width:${W}px;top:1170px;display:flex;justify-content:center;gap:16px;}
.m3-tg{background:${NV};color:${WH};font-size:40px;}
#m3-nm{top:1286px;font-family:"Pop";font-weight:800;font-size:54px;color:${NV};}
#m3-hl{position:absolute;left:240px;top:1300px;width:600px;height:56px;background:${YL};border-radius:8px;transform-origin:0 50%;}
#m3-lg{top:1410px;color:#334155;}
`;
  const tag = (i, t) => `<div class="stk m3-tg" id="m3-g${i}">${icon("check", 40, { color: YL, sw: 5 })}${t}</div>`;
  const body = `
  ${dots(p, "rgba(10,26,63,.06)")}
  <div id="m3-in" class="${p}-full">
    <div id="m3-k" class="pill"><div>Motivo 1</div></div>
    <div id="m3-t" class="ln mt">SEM<br/>COPARTICIPAÇÃO</div>
    <div id="m3-cw" class="vw">${video("m3-v", "v-pressao", 0, DUR[p])}</div>
    <div id="m3-tags">${tag(0, "Consulta")}${tag(1, "Exame")}${tag(2, "Pronto-socorro")}</div>
    <div id="m3-hl"></div>
    <div id="m3-nm" class="ln">${wspans("m3m", "sem pagar nada a mais")}</div>
    <div id="m3-lg" class="legal">${OBS.cob} ${OBS.img}</div>
  </div>`;
  drift(add, p, DUR[p]);
  enter(add, p, -1);
  pop(add, "#m3-k", 0.05);
  add(`tl.fromTo("#m3-t",{yPercent:40,opacity:0},{yPercent:0,opacity:1,duration:0.35,ease:"power4.out"},${r3(L(T.sem1) - 0.1)});`);
  add(`tl.fromTo("#m3-cw",{y:120,opacity:0},{y:0,opacity:1,duration:0.45,ease:"power4.out"},${r3(L(T.sem1) + 0.4)});`);
  [T.consulta, T.exame, T.pronto].forEach((t, i) => pop(add, `#m3-g${i}`, L(t) - 0.08, [-3, 2, -2][i]));
  add(`tl.fromTo("#m3-hl",{scaleX:0},{scaleX:1,duration:0.45,ease:"power2.out"},${r3(L(T.sem2) - 0.05)});`);
  words("m3m", seq("sem pagar nada a mais", T.sem2), 0.3);
  push(p, css, body, a);
}

// ═════════════ m4 · "Dois: hospitais de referência em São Paulo, como a BP… o Sepaco e unidades da Rede D'Or São Luiz." ═════════════
{
  const p = "m4";
  const { a, L, add, words } = TL(ST[p]);
  const VD = 6.9;
  const css = css0(p, NV) + `
#m4-vw{position:absolute;inset:0;}
#m4-ov{position:absolute;inset:0;background:rgba(10,26,63,.82);}
#m4-k{top:270px;}
#m4-k>div{background:${YL};color:${NV};}
#m4-t{top:350px;font-size:92px;line-height:1.02;}
#m4-t .o{color:${YL};}
#m4-card{position:absolute;left:90px;top:600px;width:900px;height:506px;border-radius:30px;overflow:hidden;border:8px solid ${WH};box-shadow:0 26px 70px rgba(0,0,0,.45);transform:rotate(-3deg);}
#m4-iw{position:absolute;inset:0;}
#m4-iw img{width:100%;height:100%;object-fit:cover;display:block;}
#m4-bp{position:absolute;left:150px;top:1060px;}
#m4-bp>div{background:${OR};color:${WH};font-size:46px;transform:rotate(-4deg);}
#m4-bp small{font-family:"Pop";font-weight:600;font-size:28px;}
#m4-s0{position:absolute;left:180px;top:1180px;}
#m4-s1{position:absolute;left:470px;top:1180px;}
#m4-s0>div,#m4-s1>div{background:${WH};color:${NV};font-size:44px;}
#m4-lg{top:1320px;color:#E2E8F0;}
`;
  const body = `
  <div id="m4-vw" class="vw">${video("m4-v", "v-corredor", 0, VD)}</div>
  <div id="m4-ov"></div>
  <div id="m4-in" class="${p}-full">
    <div id="m4-k" class="pill"><div>Motivo 2</div></div>
    <div id="m4-t" class="ln mt">HOSPITAIS DE<br/><span class="o">REFERÊNCIA EM SP</span></div>
    <div id="m4-card"><div id="m4-iw"><img src="assets/img/bp-bloco.jpg" alt="Hospital BP – Beneficência Portuguesa" /></div></div>
    <div id="m4-bp"><div class="stk">${icon("hospital", 46, { sw: 3.6 })}BP <small>Beneficência Portuguesa</small></div></div>
    <div id="m4-s0"><div class="stk">Sepaco</div></div>
    <div id="m4-s1"><div class="stk">Rede D'Or São Luiz</div></div>
    <div id="m4-lg" class="legal">${OBS.rede} ${OBS.varia} ${OBS.img} ${BP_CREDIT}</div>
  </div>`;
  enter(add, p, 1);
  pop(add, "#m4-k", 0.05);
  add(`tl.fromTo("#m4-vw",{scale:1.0},{scale:1.12,duration:${VD},ease:"none"},0);`);
  add(`tl.to("#m4-vw",{opacity:0,duration:0.4},${r3(VD - 0.45)});`);
  add(`tl.fromTo("#m4-t",{yPercent:40,opacity:0},{yPercent:0,opacity:1,duration:0.35,ease:"power4.out"},${r3(L(T.hospitais) - 0.12)});`);
  add(`tl.fromTo("#m4-card",{y:160,opacity:0,rotation:6},{y:0,opacity:1,rotation:-3,duration:0.5,ease:"back.out(1.4)"},${r3(L(T.bp) - 0.45)});`);
  add(`tl.fromTo("#m4-iw",{scale:1.2,x:40},{scale:1.04,x:-20,duration:${r3(DUR[p] - L(T.bp) + 0.45)},ease:"none"},${r3(L(T.bp) - 0.45)});`);
  pop(add, "#m4-bp", L(T.bp) - 0.05, 0);
  pop(add, "#m4-s0", L(T.sepaco) - 0.08, -5);
  pop(add, "#m4-s1", L(T.rede) - 0.08, 4);
  add(`tl.fromTo("#m4-lg",{opacity:0},{opacity:1,duration:0.3},${r3(L(T.bp) - 0.3)});`);
  push(p, css, body, a);
}

// ═════════════ m5 · "Três: a família toda protegida. Três vidas no SulAmérica Direto Nacional por R$ 1.593,54 por mês, já com IOF." ═════════════
{
  const p = "m5";
  const { a, L, add, shake, roll } = TL(ST[p]);
  const LH = 150;
  const css = css0(p, OR) + `
#m5-k{top:270px;}
#m5-k>div{background:${NV};color:${WH};}
#m5-t{top:350px;font-size:96px;color:${WH};line-height:1.02;}
#m5-t .n{color:${NV};}
#m5-cw{position:absolute;left:260px;top:600px;width:560px;height:560px;border-radius:50%;overflow:hidden;border:12px solid ${WH};box-shadow:0 24px 60px rgba(0,0,0,.25);}
#m5-card{position:absolute;left:70px;top:560px;width:940px;height:700px;border-radius:40px;background:${WH};color:${NV};box-shadow:0 14px 0 rgba(10,26,63,.25);}
#m5-logo{position:absolute;left:300px;top:40px;width:340px;height:87px;}
#m5-logo img{position:absolute;inset:0;width:100%;height:100%;}
#m5-pl{position:absolute;left:0;width:100%;top:150px;text-align:center;font-family:"Mont";font-weight:800;font-size:40px;}
#m5-pd{position:absolute;left:0;width:100%;top:204px;text-align:center;font-family:"Pop";font-weight:600;font-size:28px;color:#334155;}
#m5-v{position:absolute;left:0;width:100%;top:262px;display:flex;justify-content:center;gap:14px;}
.m5-pp{width:84px;height:84px;border-radius:50%;background:${NV};display:flex;align-items:center;justify-content:center;}
#m5-vl{position:absolute;left:0;width:100%;top:360px;text-align:center;font-family:"Pop";font-weight:600;font-size:28px;color:#334155;}
#m5-pr{position:absolute;left:0;width:100%;top:410px;display:flex;justify-content:center;align-items:flex-start;font-family:"Mont";font-weight:900;}
#m5-rs{font-size:56px;margin-top:22px;margin-right:10px;}
#m5-ms{font-size:44px;margin-top:88px;margin-left:8px;}
#m5-fx{position:absolute;left:0;width:100%;top:574px;text-align:center;font-size:22px;color:#334155;}
#m5-iof{position:absolute;left:0;width:100%;top:612px;display:flex;justify-content:center;}
#m5-iof>div{background:${YL};color:${NV};font-size:44px;transform:rotate(-3deg);}
#m5-lg{top:1300px;color:${NV};}
`;
  const pp = (i, k) => `<div class="m5-pp" id="m5-p${i}">${icon(k, k === "child" ? 48 : 56, { color: WH, sw: 3.6 })}</div>`;
  const body = `
  ${dots(p, "rgba(255,255,255,.12)")}
  <div id="m5-in" class="${p}-full">
    <div id="m5-k" class="pill"><div>Motivo 3</div></div>
    <div id="m5-t" class="ln mt">A FAMÍLIA TODA<br/><span class="n">PROTEGIDA</span></div>
    <div id="m5-cw" class="vw">${video("m5-vid", "v-mae-filha-medico", 0, DUR[p])}</div>
    <div id="m5-card">
      <div id="m5-logo"><img src="assets/img/logo-text-navy.png" alt="SulAmérica" /><img src="assets/img/logo-wave.png" alt="" /></div>
      <div id="m5-pl">Direto Nacional</div>
      <div id="m5-pd">Enfermaria · Sem coparticipação · ${Q.reg}</div>
      <div id="m5-v">${pp(0, "person")}${pp(1, "person")}${pp(2, "child")}</div>
      <div id="m5-vl">3 vidas: 2 de 34 a 38 anos + 1 de 0 a 18 anos</div>
      <div id="m5-pr"><span id="m5-rs">R$</span>${rollHTML("m5-n", Q.total, 140, LH)}<span id="m5-ms">/mês</span></div>
      <div id="m5-fx">${OBS.faixa}</div>
      <div id="m5-iof"><div class="stk">${icon("check", 40, { color: NV, sw: 5 })}JÁ COM IOF</div></div>
    </div>
    <div id="m5-lg" class="legal">${OBS.ref} ${OBS.perfil} ${OBS.img}</div>
  </div>`;
  drift(add, p, DUR[p]);
  enter(add, p, -1);
  pop(add, "#m5-k", 0.05);
  add(`tl.fromTo("#m5-t",{yPercent:40,opacity:0},{yPercent:0,opacity:1,duration:0.35,ease:"power4.out"},${r3(L(T.familia) - 0.2)});`);
  add(`tl.fromTo("#m5-cw",{scale:0.4,opacity:0},{scale:1,opacity:1,duration:0.5,ease:"back.out(1.8)"},${r3(L(T.familia))});`);
  // o círculo sai e entra o cartão da cotação
  add(`tl.to("#m5-cw",{scale:0.3,opacity:0,duration:0.3,ease:"power2.in"},${r3(L(T.tresv) - 0.35)});`);
  add(`tl.fromTo("#m5-card",{y:200,opacity:0,rotation:3},{y:0,opacity:1,rotation:0,duration:0.5,ease:"back.out(1.5)"},${r3(L(T.tresv) - 0.2)});`);
  add(`tl.set("#m5-p0,#m5-p1,#m5-p2,#m5-vl,#m5-rs,#m5-ms,#m5-fx,#m5-iof",{opacity:0},0);`);
  [0, 1, 2].forEach((i) => pop(add, `#m5-p${i}`, L(T.tresv) + 0.05 + i * 0.12));
  add(`tl.fromTo("#m5-vl",{opacity:0},{opacity:1,duration:0.3},${r3(L(T.tresv) + 0.4)});`);
  add(`tl.fromTo("#m5-rs,#m5-ms,#m5-fx",{opacity:0},{opacity:1,duration:0.3},${r3(L(T.mil) - 0.1)});`);
  roll("m5-n", Q.total, L(T.mil) - 0.05, L(T.mes), LH);
  add(`tl.fromTo("#m5-iof",{scale:2,opacity:0},{scale:1,opacity:1,duration:0.22,ease:"power4.in"},${r3(L(T.ja) - 0.15)});`);
  shake("#m5-card", r3(L(T.ja) + 0.08), 10);
  add(`tl.fromTo("#m5-lg",{opacity:0},{opacity:1,duration:0.3},${r3(L(T.mil) - 0.1)});`);
  push(p, css, body, a);
}

// ═════════════ en · CTA: "Clica no link e preenche o formulário… essa cotação vale até 19 de dezembro." ═════════════
{
  const p = "en";
  const { a, L, add, shake } = TL(ST[p]);
  const css = css0(p, NV) + `
#en-vw{position:absolute;inset:0;}
#en-ov{position:absolute;inset:0;background:rgba(10,26,63,.86);}
#en-k{top:250px;}
#en-k>div{background:${OR};color:${WH};font-size:26px;}
#en-ls{position:absolute;left:150px;top:330px;display:flex;flex-direction:column;gap:14px;}
.en-li{display:flex;align-items:center;gap:18px;font-family:"Mont";font-weight:800;font-size:40px;}
.en-n{width:58px;height:58px;border-radius:14px;background:${YL};color:${NV};display:flex;align-items:center;justify-content:center;font-family:"Mont";font-weight:900;font-size:34px;flex:none;}
#en-btn{position:absolute;left:110px;top:570px;width:860px;height:140px;border-radius:80px;background:${OR};display:flex;align-items:center;justify-content:center;gap:22px;box-shadow:0 12px 0 rgba(0,0,0,.25);}
#en-bt{font-family:"Mont";font-weight:900;font-size:50px;color:${WH};line-height:1.05;}
#en-bt small{display:block;font-family:"Pop";font-weight:600;font-size:26px;}
#en-ar{position:absolute;left:0;width:${W}px;top:734px;display:flex;justify-content:center;align-items:center;gap:14px;font-family:"Mont";font-weight:800;font-size:36px;}
#en-cal{position:absolute;left:0;width:${W}px;top:800px;display:flex;justify-content:center;}
#en-cal>div{background:${YL};color:${NV};font-size:38px;transform:rotate(-2deg);}
#en-pr{top:900px;font-family:"Pop";font-weight:600;font-size:30px;}
#en-pr b{font-family:"Mont";font-weight:900;color:${YL};}
#en-fx{top:950px;font-size:20px;color:#E2E8F0;}
#en-lg{top:996px;font-size:19px;line-height:1.38;color:#E2E8F0;}
`;
  const li = (i, t) => `<div class="en-li" id="en-l${i}"><span class="en-n">${i + 1}</span>${t}</div>`;
  const body = `
  <div id="en-vw" class="vw">${video("en-v", "v-equipe", 0, DUR[p])}</div>
  <div id="en-ov"></div>
  <div id="en-in" class="${p}-full">
    <div id="en-k" class="pill"><div>Exclusivo CNPJ/MEI · a partir de 3 vidas</div></div>
    <div id="en-ls">${li(0, "Sem coparticipação")}${li(1, "Hospitais de referência em SP")}${li(2, "A família toda protegida")}</div>
    <div id="en-btn">${icon("form", 72, { sw: 3.6 })}<div id="en-bt">Preencha o formulário<small>e faça sua cotação</small></div></div>
    <div id="en-ar">${icon("down", 40, { color: YL, sw: 5 })}<span>Clique no link abaixo</span>${icon("down", 40, { color: YL, sw: 5 })}</div>
    <div id="en-cal"><div class="stk">${icon("calendar", 42, { color: NV, sw: 4 })}Cotação válida até ${Q.validade}</div></div>
    <div id="en-pr" class="ln">3 vidas · Direto Nacional · <b>R$ ${Q.total}/mês</b></div>
    <div id="en-fx" class="ln">${OBS.faixa}</div>
    <div id="en-lg" class="legal">${QUOTE_TXT} ${HOSP_TXT} ${BP_CREDIT} ${LEGAL_ALL}</div>
  </div>`;
  enter(add, p, 1);
  add(`tl.fromTo("#en-vw",{scale:1.05},{scale:1.15,duration:${DUR[p]},ease:"none"},0);`);
  pop(add, "#en-k", 0.05);
  [0, 1, 2].forEach((i) => add(`tl.fromTo("#en-l${i}",{x:-60,opacity:0},{x:0,opacity:1,duration:0.35,ease:"back.out(1.8)"},${r3(0.15 + i * 0.12)});`));
  add(`tl.fromTo("#en-btn",{scale:0.5,opacity:0},{scale:1,opacity:1,duration:0.45,ease:"back.out(2.2)"},${r3(L(T.formulario) - 0.9)});`);
  for (let i = 0; i < 4; i++) add(`tl.to("#en-btn",{scale:1.05,duration:0.22,yoyo:true,repeat:1,ease:"sine.inOut"},${r3(L(T.formulario) + 0.3 + i * 1.3)});`);
  add(`tl.fromTo("#en-ar",{y:16,opacity:0},{y:0,opacity:1,duration:0.35},${r3(L(T.formulario))});`);
  add(`tl.fromTo("#en-ar svg",{y:-8},{y:8,duration:0.45,yoyo:true,repeat:9,ease:"sine.inOut"},${r3(L(T.formulario) + 0.4)});`);
  pop(add, "#en-cal", L(T.essa) - 0.05, -2);
  shake("#en-cal", r3(L(T.dezenove)), 8);
  add(`tl.fromTo("#en-pr,#en-fx",{opacity:0},{opacity:1,duration:0.4},0.5);`);
  add(`tl.fromTo("#en-lg",{opacity:0},{opacity:1,duration:0.5},0.6);`);
  push(p, css, body, a);
}

scenes.push(uiScene([
  [T.tres0, 0.4],
  [T.um, 0.3],
  [T.dois, 0.3],
  [T.tres3, 0.3],
  [T.ja, 0.25],
], { color: "255,226,180", grain: 0.04 }));

const SFX = [
  ["pop", 0.3, 0.3],
  ["pop", T.ainda + 0.7, 0.3],
  ["whoosh", ST.m2, 0.4],
  ["impact", T.tres0, 0.5],
  ["pop", T.pra + 0.15, 0.3],
  ["pop", T.pra + 0.27, 0.3],
  ["pop", T.pra + 0.39, 0.3],
  ["whoosh", ST.m3, 0.4],
  ["stamp", T.sem1, 0.4],
  ["pop", T.consulta, 0.35],
  ["pop", T.exame, 0.35],
  ["pop", T.pronto, 0.35],
  ["shimmer", T.sem2, 0.3],
  ["whoosh", ST.m4, 0.4],
  ["card", T.bp - 0.4, 0.4],
  ["pop", T.bp, 0.35],
  ["pop", T.sepaco, 0.35],
  ["pop", T.rede, 0.35],
  ["whoosh", ST.m5, 0.4],
  ["impact", T.tres3, 0.4],
  ["card", T.tresv - 0.2, 0.4],
  ["pop", T.tresv + 0.05, 0.3],
  ["pop", T.tresv + 0.17, 0.3],
  ["pop", T.tresv + 0.29, 0.3],
  ["counter", T.mil, 0.35],
  ["stamp", T.ja, 0.5],
  ["whoosh", ST.en, 0.4],
  ["chime", T.formulario, 0.35],
  ["stamp", T.essa, 0.4],
];

writeOutput(scenes, SFX, { bg: OR, bgmVolume: 0.72 });
