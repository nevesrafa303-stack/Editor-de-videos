// build.mjs — variação 1 do anúncio SulAmérica Direto Nacional 3 vidas, estilo cinema (story 9:16).
// Vídeos de banco em tela cheia com faixas de cinema, tipografia condensada (Saira) e serifada
// (Instrument Serif) em branco e laranja, tudo preso às palavras da locução (Jhony Tygas).
//   node tools/build.mjs   (ou bash tools/assemble.sh, que também faz o carve da trilha)

import {
  W, H, D, r3, at, seq, fontFaces, wspans, baseCss, scene, video, TL, rollHTML, icon,
  Q, QUOTE_TXT, HOSP_TXT, BP_CREDIT, OBS, LEGAL_ALL, uiScene, writeOutput,
} from "./core.mjs";

const OR = "#FF8A2A";
const INK = "#05070B";

const FONTS = fontFaces([
  ["Saira", 500, "SairaSemiCondensed-normal-500"],
  ["Saira", 700, "SairaSemiCondensed-normal-700"],
  ["Saira", 800, "SairaSemiCondensed-normal-800"],
  ["Serif", 400, "InstrumentSerif-Italic", "italic"],
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
.se{font-family:"Serif",Georgia,serif;font-style:italic;font-weight:400;line-height:1.05;}
.or{color:${OR};}
.dim{background:rgba(5,7,11,.3);}
.grad{background:linear-gradient(180deg,rgba(5,7,11,.7) 0%,rgba(5,7,11,.2) 26%,rgba(5,7,11,.35) 52%,rgba(5,7,11,.92) 82%,rgba(5,7,11,.96) 100%);}
.legal{position:absolute;left:80px;width:${W - 160}px;text-align:center;font-size:20px;line-height:1.4;color:rgba(255,255,255,.9);}
.tagk{font-family:"Saira",Arial,sans-serif;font-weight:700;font-size:40px;letter-spacing:.24em;color:${OR};}
`;

// tempos (absolutos, da locução)
const T = {};
T.hoje = at("hoje");
T.voce1 = at("voce");
T.no2 = at("no");
T.uma2 = at("uma", T.no2);
T.pode = at("pode");
T.fortuna = at("fortuna");
T.e2 = at("e", T.fortuna);
T.esta = at("esta");
T.dificil = at("dificil");
T.mas = at("mas");
T.cnpj = at("cnpj", T.mas);
T.ou = at("ou", T.cnpj);
T.tem3 = at("tem", T.ou);
T.plano3 = at("plano", T.tem3);
T.empresarial = at("empresarial");
T.no4 = at("no", T.empresarial);
T.sula = at("sulamerica");
T.direto = at("direto");
T.sem = at("sem", T.direto);
T.voce4 = at("voce", T.sem);
T.consulta = at("consulta");
T.exame = at("exame");
T.pronto = at("prontosocorro");
T.e5 = at("e", T.pronto);
T.hospitais = at("hospitais");
T.em5 = at("em", T.hospitais);
T.bp = at("bp");
T.sepaco = at("sepaco");
T.unidades = at("unidades");
T.rede = at("rede", T.unidades);
T.pra = at("pra");
T.tres = at("tres", T.pra);
T.casal = at("casal");
T.filho = at("filho");
T.fica = at("fica");
T.mil = at("mil", T.fica);
T.mes = at("mes", T.mil);
T.ja = at("ja", T.mes);
T.clica = at("clica");
T.preenche = at("preenche");
T.formulario = at("formulario");

const ST = {
  c1: 0,
  c2: r3(T.no2 - 0.12),
  c3: r3(T.mas - 0.1),
  c4: r3(T.no4 - 0.1),
  c5: r3(T.e5 - 0.1),
  c6: r3(T.pra - 0.1),
  en: r3(T.clica - 0.1),
};
const ORDER = ["c1", "c2", "c3", "c4", "c5", "c6", "en"];
const DUR = Object.fromEntries(ORDER.map((k, i) => [k, r3((i < ORDER.length - 1 ? ST[ORDER[i + 1]] : D) - ST[k] + (i < ORDER.length - 1 ? 0.04 : 0))]));

const scenes = [];
const push = (p, css, body, a) => scenes.push({ st: ST[p], track: 1, ...scene(p, DUR[p], css, body, a) });

// vídeo em tela cheia com empurrão lento de câmera (o wrapper anima; o vídeo só toca)
const full = (p, k, name, t0, dur, z0 = 1.0, z1 = 1.08) => ({
  html: `<div class="vw ${p}-full" id="${p}-${k}w">${video(`${p}-${k}`, name, t0, dur)}</div>`,
  anim: `tl.fromTo("#${p}-${k}w",{scale:${z0}},{scale:${z1},duration:${r3(dur)},ease:"none"},${r3(t0)});`,
});
const slam = (add, sel, t, from = 1.5) =>
  add(`tl.fromTo("${sel}",{scale:${from},opacity:0},{scale:1,opacity:1,duration:0.32,ease:"power4.out"},${r3(t)});`);
const fadeUp = (add, sel, t, d = 0.45, y = 40) =>
  add(`tl.fromTo("${sel}",{y:${y},opacity:0},{y:0,opacity:1,duration:${d},ease:"power3.out"},${r3(t)});`);

// ═════════════ c1 · gancho: "Se alguém da sua família precisar de um hospital hoje… você sabe quanto isso vai custar?" ═════════════
{
  const p = "c1";
  const { a, L, add, words, shake } = TL(ST[p]);
  const v = full(p, "v", "v-mae-filha", 0, DUR[p], 1.0, 1.1);
  const css = css0(p) + `
#c1-t1{top:690px;font-size:70px;}
#c1-t2{top:772px;font-size:70px;}
#c1-hoje{top:860px;font-size:250px;color:${OR};text-shadow:0 12px 50px rgba(255,138,42,.35);}
#c1-q{top:1126px;font-size:80px;}
#c1-ecg{position:absolute;left:0;top:1236px;}
#c1-lg{top:1452px;}
`;
  const body = `
  ${v.html}
  <div class="${p}-full dim"></div><div class="${p}-full grad"></div>
  <div id="c1-t1" class="ln sa">Se alguém da sua família</div>
  <div id="c1-t2" class="ln sa">precisar de um hospital</div>
  <div id="c1-hoje" class="ln sa">hoje…</div>
  <div id="c1-q" class="ln se">${wspans("c1q", "você sabe quanto isso vai custar?")}</div>
  <svg id="c1-ecg" width="${W}" height="140" viewBox="0 0 1080 140" aria-hidden="true">
    <path id="c1-ecgp" d="M0 70H300l24-30 22 60 30-110 34 150 24-70h120l18-24 18 24H1080" fill="none" stroke="${OR}" stroke-width="5" stroke-linejoin="round" stroke-linecap="round" stroke-dasharray="1500" stroke-dashoffset="1500"/></svg>
  <div id="c1-lg" class="legal">${OBS.img}</div>`;
  add(v.anim);
  add(`tl.fromTo("#c1-t1,#c1-t2",{scale:1.06},{scale:1,duration:1.2,ease:"power2.out"},0);`);
  slam(add, "#c1-hoje", L(T.hoje) - 0.04, 1.7);
  shake(`#${p}-root`, r3(L(T.hoje) + 0.12), 12);
  words("c1q", seq("voce sabe quanto isso vai custar", T.voce1));
  add(`tl.fromTo("#c1-ecgp",{strokeDashoffset:1500},{strokeDashoffset:0,duration:${r3(L(T.hoje) + 0.1)},ease:"none"},0);`);
  add(`tl.to("#c1-ecgp",{strokeDashoffset:-1500,duration:2.4,ease:"none"},${r3(L(T.hoje) + 0.1)});`);
  push(p, css, body, a);
}

// ═════════════ c2 · dor: "No particular, uma internação pode custar uma fortuna. E plano individual…" ═════════════
{
  const p = "c2";
  const { a, L, add, words } = TL(ST[p]);
  const cut = r3(L(T.e2) - 0.08);
  const v1 = full(p, "v1", "v-soro", 0, cut + 0.04, 1.04, 1.12);
  const v2 = full(p, "v2", "v-preocupado", cut, DUR[p] - cut, 1.0, 1.06);
  const css = css0(p) + `
#c2-k{top:740px;}
#c2-a{top:810px;font-size:116px;}
#c2-b{top:950px;font-size:84px;}
#c2-c{top:1036px;font-size:160px;color:${OR};}
#c2-sb{position:absolute;left:110px;top:720px;width:860px;height:118px;border-radius:60px;background:#fff;display:flex;align-items:center;gap:22px;padding:0 40px;color:#1B2230;}
#c2-st{font-family:"Poppins";font-weight:500;font-size:44px;white-space:nowrap;}
#c2-cur{display:inline-block;width:4px;height:52px;background:${OR};margin-left:6px;vertical-align:middle;}
#c2-d{top:900px;font-size:84px;}
#c2-e{top:1004px;font-size:112px;color:${OR};}
#c2-x{position:absolute;left:0;width:${W}px;top:1170px;display:flex;justify-content:center;}
#c2-x>div{display:flex;align-items:center;gap:14px;padding:12px 30px;border-radius:50px;background:rgba(229,72,77,.92);font-weight:600;font-size:32px;}
#c2-lg{top:1452px;}
`;
  const body = `
  ${v1.html}${v2.html}
  <div class="${p}-full dim"></div><div class="${p}-full grad"></div>
  <div id="c2-pa">
    <div id="c2-k" class="ln tagk">NO PARTICULAR,</div>
    <div id="c2-a" class="ln sa">${wspans("c2a", "uma internação")}</div>
    <div id="c2-b" class="ln se">${wspans("c2b", "pode custar")}</div>
    <div id="c2-c" class="ln se">${wspans("c2c", "uma fortuna.")}</div>
  </div>
  <div id="c2-pb">
    <div id="c2-sb">${icon("search", 54, { color: "#1B2230", sw: 4 })}<span id="c2-st">plano de saúde individual</span><span id="c2-cur"></span></div>
    <div id="c2-d" class="ln sa">${wspans("c2d", "cada vez mais")}</div>
    <div id="c2-e" class="ln se">${wspans("c2e", "difícil de encontrar.")}</div>
    <div id="c2-x"><div>${icon("x", 34, { sw: 5 })}<span>poucas opções no mercado</span></div></div>
  </div>
  <div id="c2-lg" class="legal">${OBS.img}</div>`;
  add(v1.anim);
  add(v2.anim);
  fadeUp(add, "#c2-k", L(T.no2) - 0.05, 0.4, 24);
  words("c2a", seq("uma internacao", T.uma2), 0.42);
  words("c2b", seq("pode custar", T.pode));
  words("c2c", seq("uma fortuna", T.fortuna - 0.2), 0.45);
  add(`tl.to("#c2-pa",{y:-60,opacity:0,duration:0.25,ease:"power2.in"},${r3(cut - 0.2)});`);
  add(`tl.fromTo("#c2-sb",{y:50,opacity:0},{y:0,opacity:1,duration:0.35,ease:"back.out(1.6)"},${cut});`);
  add(`tl.fromTo("#c2-st",{clipPath:"inset(0 100% 0 0)"},{clipPath:"inset(0 0% 0 0)",duration:0.75,ease:"steps(25)"},${r3(cut + 0.12)});`);
  add(`tl.fromTo("#c2-cur",{opacity:1},{opacity:0,duration:0.25,repeat:9,yoyo:true,ease:"steps(1)"},${r3(cut + 0.12)});`);
  words("c2d", seq("cada vez mais", T.esta), 0.4);
  words("c2e", seq("dificil de encontrar", T.dificil), 0.42);
  add(`tl.fromTo("#c2-x",{scale:0.6,opacity:0},{scale:1,opacity:1,duration:0.35,ease:"back.out(2)"},${r3(L(T.dificil) + 0.5)});`);
  push(p, css, body, a);
}

// ═════════════ c3 · virada: "Mas quem tem CNPJ ou MEI tem um caminho melhor: o plano de saúde empresarial." ═════════════
{
  const p = "c3";
  const { a, L, add, words, shake } = TL(ST[p]);
  const v = full(p, "v", "v-reuniao", 0, DUR[p], 1.1, 1.0);
  const css = css0(p) + `
#c3-a{top:560px;font-size:70px;}
#c3-cnpj{top:640px;font-size:270px;color:${OR};text-shadow:0 14px 60px rgba(255,138,42,.4);}
#c3-mei{position:absolute;left:0;width:${W}px;top:930px;display:flex;justify-content:center;}
#c3-mei>div{font-family:"Saira";font-weight:800;font-size:96px;line-height:1;padding:10px 40px 14px;border:5px solid #fff;border-radius:22px;text-transform:uppercase;}
#c3-b{top:1080px;font-size:86px;}
#c3-card{position:absolute;left:90px;top:1200px;width:900px;height:150px;border-radius:24px;background:${OR};color:#170B02;display:flex;align-items:center;justify-content:center;gap:22px;}
#c3-ct{font-family:"Saira";font-weight:800;font-size:64px;text-transform:uppercase;line-height:1;white-space:nowrap;}
#c3-lg{top:1430px;}
`;
  const body = `
  ${v.html}
  <div class="${p}-full dim"></div><div class="${p}-full grad"></div>
  <div id="c3-a" class="ln sa">${wspans("c3a", "Mas quem tem")}</div>
  <div id="c3-cnpj" class="ln sa">CNPJ</div>
  <div id="c3-mei"><div>ou MEI</div></div>
  <div id="c3-b" class="ln se">${wspans("c3b", "tem um caminho melhor:")}</div>
  <div id="c3-card">${icon("building", 76, { color: "#170B02", sw: 3.6 })}<span id="c3-ct">Plano empresarial</span></div>
  <div id="c3-lg" class="legal">${OBS.eleg} ${OBS.analise}</div>`;
  add(v.anim);
  words("c3a", seq("mas quem tem", T.mas - 0.05), 0.35);
  slam(add, "#c3-cnpj", L(T.cnpj) - 0.04, 1.8);
  shake(`#${p}-root`, r3(L(T.cnpj) + 0.1), 14);
  add(`tl.fromTo("#c3-mei",{scale:0.5,opacity:0},{scale:1,opacity:1,duration:0.35,ease:"back.out(2.2)"},${r3(L(T.ou) - 0.04)});`);
  words("c3b", seq("tem um caminho melhor", T.tem3));
  add(`tl.fromTo("#c3-card",{clipPath:"inset(0 100% 0 0 round 24px)"},{clipPath:"inset(0 0% 0 0 round 24px)",duration:0.5,ease:"power3.inOut"},${r3(L(T.plano3) - 0.1)});`);
  add(`tl.fromTo("#c3-card",{scale:1},{scale:1.05,duration:0.16,yoyo:true,repeat:1,ease:"power2.out"},${r3(L(T.empresarial))});`);
  push(p, css, body, a);
}

// ═════════════ c4 · solução: "No SulAmérica Direto Nacional sem coparticipação, você não paga nada a mais…" ═════════════
{
  const p = "c4";
  const { a, L, add, words, shake } = TL(ST[p]);
  const cut = r3(L(T.voce4) - 0.1);
  const v1 = full(p, "v1", "v-consulta", 0, cut + 0.04, 1.02, 1.1);
  const v2 = full(p, "v2", "v-exame", cut, DUR[p] - cut, 1.0, 1.08);
  const css = css0(p) + `
#c4-top{position:absolute;left:0;top:0;width:${W}px;height:${H}px;}
#c4-logo{position:absolute;left:290px;top:610px;width:500px;height:128px;}
#c4-logo img{position:absolute;inset:0;width:100%;height:100%;}
#c4-dn{top:770px;font-size:104px;}
#c4-stamp{position:absolute;left:0;width:${W}px;top:910px;display:flex;justify-content:center;}
#c4-stamp>div{font-family:"Saira";font-weight:800;font-size:66px;line-height:1;text-transform:uppercase;color:${OR};padding:14px 34px 18px;border:6px solid ${OR};border-radius:16px;background:rgba(5,7,11,.55);transform:rotate(-4deg);}
#c4-q{top:886px;font-size:60px;}
.c4-row{position:absolute;left:150px;width:780px;height:104px;border-radius:22px;background:rgba(5,7,11,.72);border:2px solid rgba(255,255,255,.28);display:flex;align-items:center;gap:22px;padding:0 30px;}
.c4-ck{width:62px;height:62px;border-radius:50%;background:${OR};display:flex;align-items:center;justify-content:center;flex:none;}
.c4-l{font-family:"Saira";font-weight:800;font-size:54px;text-transform:uppercase;flex:1;}
.c4-r{font-weight:600;font-size:28px;color:${OR};white-space:nowrap;}
#c4-r0{top:990px;}#c4-r1{top:1110px;}#c4-r2{top:1230px;}
#c4-lg{top:1400px;}
`;
  const rows = ["Consulta", "Exame", "Pronto-socorro"]
    .map((t, i) => `<div class="c4-row" id="c4-r${i}"><div class="c4-ck">${icon("check", 40, { color: "#170B02", sw: 6 })}</div><span class="c4-l">${t}</span><span class="c4-r">nada a mais</span></div>`)
    .join("");
  const body = `
  ${v1.html}${v2.html}
  <div class="${p}-full dim"></div><div class="${p}-full grad"></div>
  <div id="c4-top">
    <div id="c4-logo"><img src="assets/img/logo-text.png" alt="SulAmérica" /><img id="c4-wave" src="assets/img/logo-wave.png" alt="" /></div>
    <div id="c4-dn" class="ln sa">${wspans("c4dn", "Direto Nacional")}</div>
    <div id="c4-stamp"><div>Sem coparticipação</div></div>
  </div>
  <div id="c4-q" class="ln se">${wspans("c4q", "você não paga nada a mais quando usa:")}</div>
  ${rows}
  <div id="c4-lg" class="legal">${OBS.cob} ${OBS.img}</div>`;
  add(v1.anim);
  add(v2.anim);
  add(`tl.fromTo("#c4-logo",{y:30,opacity:0},{y:0,opacity:1,duration:0.45,ease:"power3.out"},${r3(L(T.sula) - 0.08)});`);
  add(`tl.fromTo("#c4-wave",{clipPath:"inset(0 100% 0 0)"},{clipPath:"inset(0 0% 0 0)",duration:0.7,ease:"power2.inOut"},${r3(L(T.sula) + 0.05)});`);
  words("c4dn", seq("direto nacional", T.direto), 0.4);
  add(`tl.fromTo("#c4-stamp",{scale:2,opacity:0},{scale:1,opacity:1,duration:0.22,ease:"power4.in"},${r3(L(T.sem) - 0.15)});`);
  shake("#c4-top", r3(L(T.sem) + 0.08), 10);
  add(`tl.to("#c4-top",{y:-250,scale:0.82,transformOrigin:"50% 40%",duration:0.5,ease:"power3.inOut"},${r3(cut - 0.1)});`);
  words("c4q", seq("voce nao paga nada a mais quando usa", T.voce4), 0.4);
  [T.consulta, T.exame, T.pronto].forEach((t, i) =>
    add(`tl.fromTo("#c4-r${i}",{x:-80,opacity:0},{x:0,opacity:1,duration:0.4,ease:"back.out(1.6)"},${r3(L(t) - 0.1)});`),
  );
  push(p, css, body, a);
}

// ═════════════ c5 · rede: "E tem hospitais de referência em São Paulo, como a BP… o Sepaco e unidades da Rede D'Or São Luiz." ═════════════
{
  const p = "c5";
  const { a, L, add, words } = TL(ST[p]);
  const v = full(p, "v", "v-equipe", 0, DUR[p], 1.0, 1.08);
  const css = css0(p) + `
#c5-h{top:364px;font-size:78px;}
#c5-sp{top:452px;font-size:78px;}
#c5-card{position:absolute;left:60px;top:580px;width:960px;height:540px;border-radius:28px;overflow:hidden;box-shadow:0 30px 80px rgba(0,0,0,.6);border:3px solid rgba(255,255,255,.85);}
#c5-iw{position:absolute;inset:0;}
#c5-iw img{width:100%;height:100%;object-fit:cover;display:block;}
#c5-cap{position:absolute;left:0;bottom:0;width:100%;padding:70px 34px 26px;background:linear-gradient(180deg,rgba(5,7,11,0),rgba(5,7,11,.9));display:flex;align-items:center;gap:16px;}
#c5-capt{font-family:"Mont";font-weight:900;font-size:44px;line-height:1.05;}
#c5-capt small{display:block;font-family:"Poppins";font-weight:500;font-size:28px;color:#E9EDF3;}
#c5-chips{position:absolute;left:0;width:${W}px;top:1160px;display:flex;justify-content:center;gap:20px;}
.c5-chip{display:flex;align-items:center;gap:12px;padding:14px 28px;border-radius:50px;background:rgba(5,7,11,.8);border:2px solid ${OR};font-family:"Mont";font-weight:800;font-size:38px;white-space:nowrap;}
#c5-lg{top:1296px;}
`;
  const chip = (id, t) => `<div class="c5-chip" id="${id}">${icon("hospital", 40, { color: OR, sw: 3.6 })}<span>${t}</span></div>`;
  const body = `
  ${v.html}
  <div class="${p}-full dim"></div><div class="${p}-full grad"></div>
  <div id="c5-h" class="ln sa">${wspans("c5h", "Hospitais de referência")}</div>
  <div id="c5-sp" class="ln se">${wspans("c5sp", "em São Paulo")}</div>
  <div id="c5-card"><div id="c5-iw"><img src="assets/img/bp-fachada.jpg" alt="Hospital BP – Beneficência Portuguesa" /></div>
    <div id="c5-cap">${icon("hospital", 56, { color: OR, sw: 3.4 })}<div id="c5-capt">BP<small>Beneficência Portuguesa</small></div></div></div>
  <div id="c5-chips">${chip("c5-c0", "Sepaco")}${chip("c5-c1", "Rede D'Or São Luiz")}</div>
  <div id="c5-lg" class="legal">${OBS.rede} ${OBS.varia} ${OBS.img} ${BP_CREDIT}</div>`;
  add(v.anim);
  words("c5h", seq("hospitais de referencia", T.hospitais), 0.42);
  words("c5sp", seq("em sao paulo", T.em5));
  add(`tl.fromTo("#c5-card",{y:120,opacity:0,rotation:3},{y:0,opacity:1,rotation:0,duration:0.55,ease:"power4.out"},${r3(L(T.bp) - 0.35)});`);
  add(`tl.fromTo("#c5-iw",{scale:1.18,x:60},{scale:1.04,x:-20,duration:${r3(DUR[p] - L(T.bp) + 0.35)},ease:"none"},${r3(L(T.bp) - 0.35)});`);
  add(`tl.fromTo("#c5-cap",{opacity:0},{opacity:1,duration:0.35},${r3(L(T.bp))});`);
  add(`tl.fromTo("#c5-c0",{y:40,opacity:0,scale:0.8},{y:0,opacity:1,scale:1,duration:0.38,ease:"back.out(2)"},${r3(L(T.sepaco) - 0.08)});`);
  add(`tl.fromTo("#c5-c1",{y:40,opacity:0,scale:0.8},{y:0,opacity:1,scale:1,duration:0.38,ease:"back.out(2)"},${r3(L(T.rede) - 0.08)});`);
  add(`tl.fromTo("#c5-lg",{opacity:0},{opacity:1,duration:0.4},${r3(L(T.bp))});`);
  push(p, css, body, a);
}

// ═════════════ c6 · preço: "Pra três vidas, um casal… e um filho de até dezoito, fica R$ 1.593,54 por mês, já com IOF." ═════════════
{
  const p = "c6";
  const { a, L, add, shake, roll } = TL(ST[p]);
  const v = full(p, "v", "v-familia", 0, DUR[p], 1.0, 1.1);
  const LH = 184;
  const css = css0(p) + `
#c6-3v{top:360px;font-size:220px;color:${OR};text-shadow:0 14px 60px rgba(255,138,42,.4);}
#c6-ic{position:absolute;left:0;width:${W}px;top:610px;display:flex;justify-content:center;gap:26px;align-items:flex-end;}
.c6-i{width:124px;height:124px;border-radius:50%;background:rgba(255,255,255,.95);display:flex;align-items:center;justify-content:center;}
#c6-i2{width:100px;height:100px;}
#c6-lb{position:absolute;left:0;width:${W}px;top:760px;display:flex;justify-content:center;gap:40px;font-weight:600;font-size:34px;}
#c6-lb span b{color:${OR};font-weight:600;}
#c6-pr{position:absolute;left:0;width:${W}px;top:870px;display:flex;justify-content:center;align-items:flex-start;font-family:"Saira";font-weight:800;}
#c6-rs{font-size:68px;line-height:1;margin-top:32px;margin-right:10px;}
#c6-nb{color:#fff;}
#c6-ms{font-size:52px;line-height:1;margin-top:110px;margin-left:8px;}
#c6-fx{top:1080px;font-size:24px;color:#fff;}
#c6-iof{position:absolute;left:0;width:${W}px;top:1132px;display:flex;justify-content:center;}
#c6-iof>div{font-family:"Saira";font-weight:800;font-size:54px;line-height:1;color:#170B02;background:${OR};padding:12px 30px 14px;border-radius:12px;transform:rotate(-3deg);text-transform:uppercase;}
#c6-pl{position:absolute;left:0;width:${W}px;top:1234px;display:flex;justify-content:center;}
#c6-pl>div{padding:12px 28px;border-radius:40px;background:rgba(5,7,11,.8);border:2px solid rgba(255,255,255,.4);font-weight:500;font-size:28px;white-space:nowrap;}
#c6-lg{top:1352px;}
`;
  const person = (id, kind, size) => `<div class="c6-i" id="${id}">${icon(kind, size, { color: "#141821", sw: 3.6 })}</div>`;
  const body = `
  ${v.html}
  <div class="${p}-full dim"></div><div class="${p}-full grad"></div>
  <div id="c6-3v" class="ln sa">3 vidas</div>
  <div id="c6-ic">${person("c6-i0", "person", 76)}${person("c6-i1", "person", 76)}${person("c6-i2", "child", 66)}</div>
  <div id="c6-lb"><span id="c6-l0"><b>Casal</b> · 34 a 38 anos</span><span id="c6-l1"><b>Filho</b> · até 18 anos</span></div>
  <div id="c6-pr"><span id="c6-rs">R$</span><span id="c6-nb">${rollHTML("c6-n", Q.total, 178, LH)}</span><span id="c6-ms">/mês</span></div>
  <div id="c6-fx" class="ln">${OBS.faixa}</div>
  <div id="c6-iof"><div>Já com IOF</div></div>
  <div id="c6-pl"><div>SulAmérica Direto Nacional · Enfermaria · Sem coparticipação</div></div>
  <div id="c6-lg" class="legal">${OBS.ref} ${OBS.perfil} ${OBS.img}</div>`;
  add(v.anim);
  slam(add, "#c6-3v", L(T.tres) - 0.05, 1.6);
  [["#c6-i0", T.casal], ["#c6-i1", T.casal + 0.12], ["#c6-i2", T.filho]].forEach(([s, t]) =>
    add(`tl.fromTo("${s}",{scale:0,opacity:0},{scale:1,opacity:1,duration:0.4,ease:"back.out(2.4)"},${r3(L(t) - 0.08)});`),
  );
  fadeUp(add, "#c6-l0", L(T.casal), 0.4, 20);
  fadeUp(add, "#c6-l1", L(T.filho), 0.4, 20);
  add(`tl.fromTo("#c6-rs,#c6-ms",{opacity:0},{opacity:1,duration:0.3},${r3(L(T.fica) - 0.05)});`);
  roll("c6-n", Q.total, L(T.mil) - 0.05, L(T.mes), LH);
  add(`tl.fromTo("#c6-fx",{opacity:0},{opacity:1,duration:0.3},${r3(L(T.mil) - 0.05)});`);
  add(`tl.fromTo("#c6-iof",{scale:2,opacity:0},{scale:1,opacity:1,duration:0.22,ease:"power4.in"},${r3(L(T.ja) - 0.15)});`);
  shake("#c6-pr", r3(L(T.ja) + 0.08), 8);
  fadeUp(add, "#c6-pl", L(T.ja) + 0.3, 0.4, 20);
  add(`tl.fromTo("#c6-lg",{opacity:0},{opacity:1,duration:0.4},${r3(L(T.mil) - 0.05)});`);
  push(p, css, body, a);
}

// ═════════════ en · CTA: "Clica no link, preenche o formulário e a gente monta a cotação com as idades da sua família." ═════════════
{
  const p = "en";
  const { a, L, add } = TL(ST[p]);
  const v = full(p, "v", "v-por-do-sol", 0, DUR[p], 1.0, 1.08);
  const css = css0(p) + `
#en-k{position:absolute;left:0;width:${W}px;top:268px;display:flex;justify-content:center;}
#en-k>div{padding:10px 26px;border-radius:40px;border:2px solid ${OR};background:rgba(5,7,11,.7);font-family:"Saira";font-weight:700;font-size:30px;letter-spacing:.12em;color:${OR};text-transform:uppercase;white-space:nowrap;}
#en-logo{position:absolute;left:330px;top:344px;width:420px;height:107px;}
#en-logo img{position:absolute;inset:0;width:100%;height:100%;}
#en-t{top:478px;font-size:66px;line-height:1.05;}
#en-pr{top:634px;font-family:"Saira";font-weight:800;font-size:52px;}
#en-fx{top:700px;font-size:22px;}
#en-btn{position:absolute;left:110px;top:752px;width:860px;height:150px;border-radius:80px;background:linear-gradient(180deg,#FFA04D,${OR});color:#170B02;display:flex;align-items:center;justify-content:center;gap:26px;box-shadow:0 18px 50px rgba(255,138,42,.4);}
#en-bt{font-family:"Mont";font-weight:900;font-size:50px;line-height:1.05;}
#en-bt small{display:block;font-family:"Poppins";font-weight:600;font-size:27px;}
#en-ar{position:absolute;left:0;width:${W}px;top:924px;display:flex;justify-content:center;align-items:center;gap:14px;font-family:"Mont";font-weight:800;font-size:36px;}
#en-lg{top:1000px;font-size:19px;line-height:1.38;}
`;
  const body = `
  ${v.html}
  <div class="${p}-full" style="background:rgba(5,7,11,.66)"></div><div class="${p}-full grad"></div>
  <div id="en-k"><div>Exclusivo CNPJ/MEI · a partir de 3 vidas</div></div>
  <div id="en-logo"><img src="assets/img/logo-text.png" alt="SulAmérica" /><img src="assets/img/logo-wave.png" alt="" /></div>
  <div id="en-t" class="ln sa">A cotação com as idades<br/>da sua família</div>
  <div id="en-pr" class="ln">3 vidas por <span class="or">R$ ${Q.total}/mês</span></div>
  <div id="en-fx" class="ln">${OBS.faixa}</div>
  <div id="en-btn">${icon("form", 76, { color: "#170B02", sw: 3.6 })}<div id="en-bt">Preencha o formulário<small>e receba sua cotação</small></div></div>
  <div id="en-ar">${icon("down", 40, { color: OR, sw: 5 })}<span>Clique no link abaixo</span>${icon("down", 40, { color: OR, sw: 5 })}</div>
  <div id="en-lg" class="legal">${QUOTE_TXT} ${HOSP_TXT} ${BP_CREDIT} ${LEGAL_ALL}</div>`;
  add(v.anim);
  fadeUp(add, "#en-k", 0.05, 0.4, 20);
  fadeUp(add, "#en-logo", 0.1, 0.45, 20);
  fadeUp(add, "#en-t", 0.2, 0.5, 30);
  fadeUp(add, "#en-pr,#en-fx", 0.35, 0.45, 20);
  add(`tl.fromTo("#en-btn",{scale:0.6,opacity:0},{scale:1,opacity:1,duration:0.45,ease:"back.out(2)"},${r3(L(T.preenche) - 0.25)});`);
  for (let i = 0; i < 4; i++) add(`tl.to("#en-btn",{scale:1.05,duration:0.22,yoyo:true,repeat:1,ease:"sine.inOut"},${r3(L(T.formulario) + 0.4 + i * 1.3)});`);
  add(`tl.fromTo("#en-ar",{y:20,opacity:0},{y:0,opacity:1,duration:0.4},${r3(L(T.formulario) + 0.1)});`);
  add(`tl.fromTo("#en-ar svg",{y:-8},{y:8,duration:0.45,yoyo:true,repeat:9,ease:"sine.inOut"},${r3(L(T.formulario) + 0.5)});`);
  add(`tl.fromTo("#en-lg",{opacity:0},{opacity:1,duration:0.5},0.4);`);
  push(p, css, body, a);
}

// ═════════════ faixas de cinema (acima das cenas) ═════════════
{
  const p = "bars";
  const { a } = TL(0);
  const css = `#bars-root{position:absolute;inset:0;width:${W}px;height:${H}px;pointer-events:none;}
.bars-b{position:absolute;left:0;width:${W}px;height:170px;background:#000;}
#bars-t{top:0;}#bars-u{bottom:0;}`;
  const body = `<div id="bars-t" class="bars-b"></div><div id="bars-u" class="bars-b"></div>`;
  scenes.push({ st: 0, track: 8, ...scene(p, D, css, body, a) });
}

scenes.push(uiScene([
  [T.hoje, 0.35],
  [T.mas, 0.6],
  [T.sem, 0.3],
  [T.ja, 0.3],
  [ST.en, 0.3],
], { grain: 0.06 }));

const SFX = [
  ["impact", T.hoje, 0.45],
  ["whoosh", ST.c2, 0.4],
  ["tap", ST.c2 + (T.e2 - ST.c2) + 0.15, 0.35],
  ["tap", T.e2 + 0.4, 0.35],
  ["tap", T.e2 + 0.65, 0.35],
  ["pop", T.dificil + 0.5, 0.4],
  ["riser", T.mas, 0.4],
  ["impact", T.mas, 0.55],
  ["impact", T.cnpj, 0.35],
  ["whoosh", T.plano3 - 0.1, 0.35],
  ["whoosh", ST.c4, 0.35],
  ["shimmer", T.sula, 0.35],
  ["stamp", T.sem, 0.55],
  ["check", T.consulta, 0.4],
  ["check", T.exame, 0.4],
  ["check", T.pronto, 0.4],
  ["whoosh", ST.c5, 0.35],
  ["card", T.bp - 0.3, 0.45],
  ["pop", T.sepaco, 0.4],
  ["pop", T.rede, 0.4],
  ["whoosh", ST.c6, 0.35],
  ["impact", T.tres, 0.35],
  ["pop", T.casal, 0.35],
  ["pop", T.filho, 0.35],
  ["counter", T.mil, 0.35],
  ["stamp", T.ja, 0.55],
  ["whoosh", ST.en, 0.35],
  ["chime", T.formulario, 0.35],
];

writeOutput(scenes, SFX, { bg: INK });
