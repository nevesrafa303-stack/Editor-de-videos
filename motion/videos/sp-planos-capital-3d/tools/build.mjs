// build.mjs — "Planos de saúde em São Paulo pelo CNPJ/MEI" (story 9:16, ~45 s, voz Roberta).
// Público: empresários, MEI e viajantes da capital de SP, 3 vidas ou mais. Gancho nos 3 primeiros segundos ("Com CNPJ ou MEI,
// você pode ter Einstein, Sírio-Libanês e Vila Nova Star no seu plano de saúde"), operadoras mais conhecidas com os logos,
// benefícios de um plano empresarial e CTA para o formulário. Imagens reais dos hospitais (banco de vídeos do repositório)
// e elementos 3D feitos em CSS 3D (perspectiva + preserve-3d, determinísticos): texto extrudado, cartões de vídeo que voam
// em profundidade, anel giratório de logos, túnel de hospitais, celular 3D e globo em wireframe.
//   node tools/build.mjs   (ou bash tools/assemble.sh, que também faz o carve da trilha)

import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { W, H, D, r3, at, seq, fontFaces, wspans, baseCss, scene, video, TL, icon, OBS, LEGAL_ALL, SRC_TXT, NET_TXT, uiScene, writeOutput } from "./core.mjs";

const BG = "#050A16"; // azul quase preto
const BG2 = "#0E1F3E";
const CY = "#3AD0FF"; // ciano das luzes 3D
const AMB = "#FFC23D"; // âmbar dos destaques
const NAVY = "#0B1E3D";

const FONTS = fontFaces([
  ["Saira", 700, "SairaSemiCondensed-normal-700"],
  ["Saira", 800, "SairaSemiCondensed-normal-800"],
  ["Mont", 800, "Montserrat-800"],
  ["Mont", 900, "Montserrat-900"],
  ["Poppins", 400, "Poppins-normal-400"],
  ["Poppins", 500, "Poppins-normal-500"],
  ["Poppins", 600, "Poppins-normal-600"],
]);

const CLIP = {
  f_einstein: 2.6, f_einstein_porta: 0.8, f_einstein_marq: 1.1, f_sirio: 1.8, f_sirio_ent: 1.4, f_sirio_torre: 2.43, f_vns: 2.77,
  f_vns_letreiro: 2.1, i_einstein_atrio: 2.33, i_sirio_recepcao: 3.53, i_vns_quarto: 3.6, i_vns_corredor: 4.1, i_robotica: 2.5,
  a_medico_tablet: 4.3, a_ultrassom: 2.7, a_esteira: 1.87, a_enfermeira: 2.5, a_consulta: 6.23, a_equipe: 2.33, a_recepcao: 2.5,
};

// mistura de cores (#rrggbb) para as camadas do texto extrudado
const mix = (a, b, t) => {
  const p = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [x, y] = [p(a), p(b)];
  return "#" + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, "0")).join("");
};
// texto 3D: a face da frente e N camadas atrás dela em translateZ (a lateral do "bloco"), dentro de preserve-3d
const ext = (id, text, { size = 200, front = "#fff", side = "#1C64C8", n = 18, step = 2.4, cls = "sa" } = {}) => {
  let ly = "";
  for (let i = n; i >= 1; i--)
    ly += `<span class="ly" aria-hidden="true" data-layout-allow-occlusion style="transform:translateZ(${-r3(i * step)}px);color:${mix(side, "#061430", i / n * 0.5)}">${text}</span>`;
  return `<div class="x3 ${cls}" id="${id}" data-layout-allow-overlap style="font-size:${size}px">${ly}<span class="fr" style="color:${front}">${text}</span></div>`;
};

const css0 = (p) =>
  FONTS +
  baseCss(p) +
  `
#${p}-root{font-family:"Poppins",Arial,sans-serif;color:#fff;background:radial-gradient(90% 55% at 50% 46%,${BG2},${BG} 72%);}
.sa{font-family:"Saira",Arial,sans-serif;font-weight:800;text-transform:uppercase;line-height:1;}
.am{color:${AMB};}
.cy{color:${CY};}
.legal{position:absolute;left:80px;width:${W - 160}px;top:1450px;text-align:center;font-size:20px;line-height:1.4;color:rgba(255,255,255,.9);}
.stage{position:absolute;left:0;top:0;width:${W}px;height:${H}px;perspective:1500px;perspective-origin:50% 46%;}
.p3{position:absolute;transform-style:preserve-3d;}
.floor{position:absolute;left:-1100px;top:1180px;width:3280px;height:2600px;transform-origin:50% 0;transform:rotateX(80deg);
  background-image:linear-gradient(rgba(58,208,255,.55) 3px,transparent 3px),linear-gradient(90deg,rgba(58,208,255,.55) 3px,transparent 3px);
  background-size:130px 130px;-webkit-mask-image:radial-gradient(60% 55% at 50% 0%,#000 0%,transparent 100%);mask-image:radial-gradient(60% 55% at 50% 0%,#000 0%,transparent 100%);opacity:.5;}
.halo{position:absolute;border-radius:50%;background:radial-gradient(closest-side,rgba(58,208,255,.35),rgba(58,208,255,0));}
.x3{position:relative;display:inline-block;transform-style:preserve-3d;white-space:nowrap;}
.x3 .ly{position:absolute;left:0;top:0;white-space:nowrap;}
.x3 .fr{position:relative;display:inline-block;text-shadow:0 0 30px rgba(58,208,255,.35);}
.panel{position:absolute;border-radius:30px;overflow:hidden;border:6px solid rgba(255,255,255,.95);box-shadow:0 40px 90px rgba(0,0,0,.6);background:#000;}
.panel .vw{position:absolute;inset:0;}
.panel .nm{position:absolute;left:0;right:0;bottom:22px;display:flex;justify-content:center;}
.panel .nm span{padding:8px 22px;border-radius:30px;background:#fff;color:${NAVY};font-family:"Saira";font-weight:800;font-size:36px;text-transform:uppercase;white-space:nowrap;box-shadow:0 10px 24px rgba(0,0,0,.45);}
.tag{display:inline-flex;align-items:center;gap:12px;padding:10px 26px 10px 14px;border-radius:44px;background:#fff;color:${NAVY};font-family:"Saira";font-weight:800;font-size:40px;text-transform:uppercase;white-space:nowrap;box-shadow:0 14px 30px rgba(0,0,0,.45);}
.tag .ck{width:52px;height:52px;border-radius:50%;background:${NAVY};display:flex;align-items:center;justify-content:center;}
`;

// ───────────── tempos (absolutos, da locução) ─────────────
const T = {};
T.cnpj1 = at("cnpj");
T.mei1 = at("mei");
T.voce1 = at("voce");
T.einstein = at("einstein");
T.sirio = at("siriolibanes");
T.vila = at("vila");
T.no = at("no", T.vila);
T.plano1 = at("plano", T.no);
T.e1 = at("e", T.plano1);
T.nao1 = at("nao", T.e1);
T.nao2 = at("nao", T.nao1 + 0.1);
T.milionario = at("milionario");
T.apartir = at("a", T.milionario);
T.tres = at("tres");
T.vidas = at("vidas");
T.empresario = at("empresario");
T.mei2 = at("mei", T.empresario);
T.contratar = at("contratar");
T.a2 = at("a", T.contratar);
T.compara = at("compara");
T.principais = at("principais");
T.operadoras = at("operadoras");
T.amil = at("amil");
T.bradesco = at("bradesco");
T.sula = at("sulamerica");
T.porto = at("porto");
T.omint = at("omint");
T.alice = at("alice");
T.muito = at("muito");
T.com2 = at("com", T.muito);
T.empresarial = at("empresarial");
T.melhores1 = at("melhores");
T.hospitais = at("hospitais");
T.checkup = at("checkup");
T.exames = at("exames");
T.tele = at("telemedicina");
T.vinte = at("vinte");
T.horas = at("horas");
T.e2 = at("e", T.horas);
T.viajando = at("viajando");
T.cobertura = at("cobertura");
T.seguro = at("seguro");
T.dependendo = at("dependendo");
T.pra2 = at("pra", T.dependendo);
T.voce2 = at("voce", T.pra2);
T.socios = at("socios");
T.familia = at("familia");
T.tudo = at("tudo");
T.cnpj2 = at("cnpj", T.tudo);
T.clica = at("clica");
T.preenche = at("preenche");
T.formulario = at("formulario");

const ST = {
  s1: 0,
  s2: r3(T.e1 - 0.07),
  s3: r3(T.a2 - 0.1),
  b1: r3(T.com2 - 0.1),
  b2: r3(T.checkup - 0.15),
  b3: r3(T.tele - 0.12),
  b4: r3(T.e2 - 0.1),
  s5: r3(T.pra2 - 0.1),
  en: r3(T.clica - 0.1),
};
const ORDER = ["s1", "s2", "s3", "b1", "b2", "b3", "b4", "s5", "en"];
const DUR = Object.fromEntries(ORDER.map((k, i) => [k, r3((i < ORDER.length - 1 ? ST[ORDER[i + 1]] : D) - ST[k] + (i < ORDER.length - 1 ? 0.04 : 0))]));

const scenes = [];
const push = (p, css, body, a) => scenes.push({ st: ST[p], track: 1, ...scene(p, DUR[p], css, body, a) });

// vídeos em sequência dentro de um quadro (tempos locais da cena), com zoom lento
function seqClips(p, list, tag = "v") {
  let html = "";
  const anim = [];
  list.forEach(([name, t0, t1]) => {
    if (t1 - t0 > CLIP[name] + 0.01) throw new Error(`${p}: ${name} tem ${CLIP[name]} s, trecho pede ${r3(t1 - t0)} s`);
  });
  list.forEach(([name, t0, t1, z0 = 1.0, z1 = 1.1], i) => {
    const id = `${p}-${tag}${i}`;
    html += `<div class="vw" id="${id}w" data-layout-allow-overflow>${video(id, name, t0, r3(Math.min(CLIP[name], t1 - t0 + 0.04)))}</div>`;
    anim.push(`tl.fromTo("#${id}w",{scale:${z0}},{scale:${z1},duration:${r3(t1 - t0 + 0.04)},ease:"none"},${r3(t0)});`);
  });
  return { html, anim };
}
const fadeUp = (add, sel, t, d = 0.45, y = 30) =>
  add(`tl.fromTo("${sel}",{y:${y},opacity:0},{y:0,opacity:1,duration:${d},ease:"power3.out"},${r3(Math.max(0, t))});`);
const pop = (add, sel, t, s0 = 0.5) =>
  add(`tl.fromTo("${sel}",{scale:${s0},opacity:0},{scale:1,opacity:1,duration:0.4,ease:"back.out(2.2)"},${r3(Math.max(0, t))});`);
// chão em grade que corre em perspectiva (dá profundidade a toda cena)
const floor = (p) => `<div class="floor" id="${p}-fl" data-layout-allow-overflow aria-hidden="true"></div>`;
const floorRun = (add, p, dur) => add(`tl.fromTo("#${p}-fl",{backgroundPosition:"0px 0px"},{backgroundPosition:"0px 1040px",duration:${r3(dur)},ease:"none"},0);`);

// ═════════════ s1 · gancho: "Com CNPJ ou MEI, você pode ter Einstein, Sírio-Libanês e Vila Nova Star no seu plano de saúde." ═════════════
{
  const p = "s1";
  const { a, L, add, words, shake } = TL(ST[p]);
  const d = DUR[p];
  const E = seqClips(p, [["f_einstein", L(T.einstein) - 0.3, L(T.einstein) + 2.3], ["f_einstein_marq", L(T.einstein) + 2.3, L(T.einstein) + 3.4], ["f_einstein_porta", L(T.einstein) + 3.4, d]], "e");
  const S = seqClips(p, [["f_sirio", L(T.sirio) - 0.2, L(T.sirio) + 1.6], ["f_sirio_torre", L(T.sirio) + 1.6, d]], "s");
  const V = seqClips(p, [["f_vns", L(T.vila) - 0.2, d]], "n");
  const BGV = seqClips(p, [["f_einstein_marq", 0, 1.1, 1.12, 1.0], ["f_sirio_ent", 1.1, 2.5, 1.1, 1.0]], "b");
  const css = css0(p) + `
#s1-bg{position:absolute;left:0;top:0;width:${W}px;height:${H}px;overflow:hidden;}
#s1-bg .vw{position:absolute;inset:0;}
#s1-bgv{position:absolute;inset:0;background:linear-gradient(180deg,rgba(5,10,22,.82) 0%,rgba(5,10,22,.45) 30%,rgba(5,10,22,.55) 62%,rgba(5,10,22,.95) 100%);}
#s1-cnw{left:0;top:690px;width:${W}px;text-align:center;}
#s1-mw{left:0;top:975px;width:${W}px;text-align:center;}
#s1-cards{left:0;top:0;width:${W}px;height:${H}px;}
.s1-c{left:290px;top:520px;width:500px;height:690px;}
#s1-t1{top:1240px;font-size:56px;}
#s1-t2{top:1306px;font-size:84px;color:${AMB};}
#s1-lg{top:1452px;}`;
  const body = `<div id="s1-bg" class="s1-full">${BGV.html}<div id="s1-bgv"></div></div>
  <div class="stage" id="s1-st">${floor(p)}
    <div class="halo" style="left:140px;top:560px;width:800px;height:640px" aria-hidden="true"></div>
    <div class="p3" id="s1-cnw">${ext("s1-cn", "CNPJ", { size: 270, side: "#3D8BFF", n: 24, step: 3 })}</div>
    <div class="p3" id="s1-mw">${ext("s1-m", "ou MEI", { size: 140, front: AMB, side: "#C98A00", n: 16, step: 2.6 })}</div>
    <div class="p3" id="s1-cards">
      <div class="panel s1-c" id="s1-cE">${E.html}<div class="nm"><span>Einstein</span></div></div>
      <div class="panel s1-c" id="s1-cS">${S.html}<div class="nm"><span>Sírio-Libanês</span></div></div>
      <div class="panel s1-c" id="s1-cV">${V.html}<div class="nm"><span>Vila Nova Star</span></div></div>
    </div>
  </div>
  <div id="s1-t1" class="ln sa">${wspans("s1a", "no seu")}</div>
  <div id="s1-t2" class="ln sa">${wspans("s1b", "plano de saúde")}</div>
  <div id="s1-lg" class="legal">${OBS.varia} ${OBS.rede} ${OBS.img}</div>`;
  [...E.anim, ...S.anim, ...V.anim, ...BGV.anim].forEach(add);
  add(`tl.to("#s1-bg",{opacity:0,duration:0.5,ease:"power2.in"},${r3(L(T.einstein) - 0.45)});`);
  floorRun(add, p, d);
  // CNPJ 3D vem do fundo e bate na tela; gira devagar para mostrar a espessura
  add(`tl.fromTo("#s1-cnw",{z:-2600,rotationY:-40,opacity:0},{z:0,rotationY:-24,rotationX:8,opacity:1,duration:0.36,ease:"expo.out"},${r3(Math.max(0, L(T.cnpj1) - 0.2))});`);
  add(`tl.to("#s1-cnw",{rotationY:22,rotationX:-8,duration:${r3(L(T.voce1) - L(T.cnpj1))},ease:"sine.inOut"},${r3(L(T.cnpj1) + 0.16)});`);
  add(`tl.fromTo("#s1-mw",{z:-900,rotationX:70,opacity:0},{z:0,rotationX:0,opacity:1,duration:0.4,ease:"back.out(1.8)"},${r3(L(T.mei1) - 0.1)});`);
  add(`tl.to("#s1-cnw",{z:1100,opacity:0,duration:0.42,ease:"power2.in"},${r3(L(T.voce1))});`);
  add(`tl.to("#s1-mw",{z:900,opacity:0,duration:0.42,ease:"power2.in"},${r3(L(T.voce1) + 0.05)});`);
  shake("#s1-st", r3(L(T.cnpj1) + 0.12), 14);
  // cartões dos hospitais: cada um chega do fundo girando e os anteriores abrem em leque
  add(`tl.set(".s1-c",{opacity:0});`);
  add(`tl.fromTo("#s1-cE",{z:-2300,rotationY:42,opacity:0},{z:0,rotationY:0,x:0,opacity:1,duration:0.5,ease:"power3.out"},${r3(L(T.einstein) - 0.28)});`);
  add(`tl.to("#s1-cE",{x:-345,z:-420,rotationY:30,duration:0.5,ease:"power3.inOut"},${r3(L(T.sirio) - 0.2)});`);
  add(`tl.fromTo("#s1-cS",{z:-2300,rotationY:-42,opacity:0},{z:0,rotationY:0,x:0,opacity:1,duration:0.5,ease:"power3.out"},${r3(L(T.sirio) - 0.2)});`);
  add(`tl.to("#s1-cS",{x:345,z:-420,rotationY:-30,duration:0.5,ease:"power3.inOut"},${r3(L(T.vila) - 0.2)});`);
  add(`tl.fromTo("#s1-cV",{z:-2300,rotationY:42,opacity:0},{z:0,rotationY:0,x:0,opacity:1,duration:0.5,ease:"power3.out"},${r3(L(T.vila) - 0.2)});`);
  add(`tl.to("#s1-cV",{z:90,duration:${r3(d - L(T.vila) - 0.3)},ease:"sine.out"},${r3(L(T.vila) + 0.3)});`);
  add(`tl.fromTo("#s1-cards",{rotationY:-5},{rotationY:5,duration:${r3(d - L(T.einstein))},ease:"sine.inOut"},${r3(L(T.einstein))});`);
  words("s1a", seq("no seu", T.vila), 0.35);
  words("s1b", seq("plano de saude", T.vila), 0.38);
  add(`tl.fromTo("#s1-lg",{opacity:0},{opacity:1,duration:0.4},${r3(L(T.einstein))});`);
  push(p, css, body, a);
}

// ═════════════ s2 · "E não, isso não é só pra milionário: a partir de três vidas, empresário e MEI já podem contratar." ═════════════
{
  const p = "s2";
  const { a, L, add, words, shake } = TL(ST[p]);
  const d = DUR[p];
  const css = css0(p) + `
#s2-card{left:110px;top:640px;width:860px;height:360px;border-radius:32px;background:#F4F7FB;color:${NAVY};display:flex;flex-direction:column;justify-content:center;align-items:center;box-shadow:0 40px 90px rgba(0,0,0,.55);}
#s2-card .q1{font-family:"Saira";font-weight:800;font-size:76px;text-transform:uppercase;line-height:1;}
#s2-card .q2{position:relative;font-family:"Saira";font-weight:800;font-size:112px;text-transform:uppercase;line-height:1.05;}
#s2-strike{position:absolute;left:-10px;right:-10px;top:50%;height:14px;margin-top:-7px;background:#E5243B;border-radius:7px;transform-origin:0 50%;}
#s2-stamp{left:640px;top:488px;padding:8px 30px;border:12px solid #E5243B;border-radius:22px;color:#E5243B;font-family:"Saira";font-weight:800;font-size:120px;line-height:1;background:rgba(255,255,255,.92);box-shadow:0 18px 40px rgba(0,0,0,.35);}
#s2-apw{left:0;top:600px;width:${W}px;}
#s2-ap{font-size:56px;}
#s2-3w{left:0;top:660px;width:${W}px;text-align:center;}
#s2-vw{left:0;top:1075px;width:${W}px;text-align:center;}
#s2-chips{position:absolute;left:0;width:${W}px;top:1262px;display:flex;justify-content:center;gap:24px;}
#s2-ok{position:absolute;left:0;width:${W}px;top:1356px;display:flex;justify-content:center;}
#s2-ok>div{display:flex;align-items:center;gap:12px;font-family:"Saira";font-weight:800;font-size:44px;text-transform:uppercase;color:${AMB};}
#s2-lg{top:1452px;}`;
  const body = `<div class="stage" id="s2-st">${floor(p)}
    <div class="halo" style="left:190px;top:600px;width:700px;height:600px" aria-hidden="true"></div>
    <div class="p3" id="s2-cw" style="left:0;top:0;width:${W}px;height:${H}px">
      <div class="p3" id="s2-card"><div class="q1">É só pra</div><div class="q2">milionário?<div id="s2-strike"></div></div></div>
      <div class="p3" id="s2-stamp">NÃO!</div>
    </div>
    <div id="s2-apw" class="ln sa"><span id="s2-ap">${wspans("s2a", "a partir de")}</span></div>
    <div class="p3" id="s2-3w">${ext("s2-3", "3", { size: 420, front: AMB, side: "#D08C00", n: 28, step: 3.4 })}</div>
    <div class="p3" id="s2-vw">${ext("s2-v", "vidas", { size: 150, side: "#3D8BFF", n: 18, step: 2.6 })}</div>
  </div>
  <div id="s2-chips"><div class="tag" id="s2-c1"><span class="ck">${icon("building", 32, { color: AMB, sw: 3.6 })}</span>Empresário</div><div class="tag" id="s2-c2"><span class="ck">${icon("person", 32, { color: AMB, sw: 3.6 })}</span>MEI</div></div>
  <div id="s2-ok"><div>${icon("check", 50, { color: AMB, sw: 5 })}<span>já podem contratar</span></div></div>
  <div id="s2-lg" class="legal">${OBS.eleg} ${OBS.analise}</div>`;
  floorRun(add, p, d);
  add(`tl.fromTo("#s2-card",{rotationX:-75,z:-600,opacity:0},{rotationX:0,z:0,opacity:1,duration:0.38,ease:"back.out(1.4)"},0.02);`);
  add(`tl.fromTo("#s2-stamp",{scale:2.6,rotation:-30,opacity:0},{scale:1,rotation:-12,opacity:1,duration:0.22,ease:"power4.in"},${r3(L(T.nao1) - 0.05)});`);
  shake("#s2-st", r3(L(T.nao1) + 0.17), 16);
  add(`tl.fromTo("#s2-strike",{scaleX:0},{scaleX:1,duration:0.3,ease:"power2.out"},${r3(L(T.milionario) + 0.1)});`);
  add(`tl.to("#s2-cw",{rotationX:85,z:-500,opacity:0,duration:0.36,ease:"power2.in"},${r3(L(T.apartir) - 0.3)});`);
  words("s2a", seq("a partir de", T.milionario), 0.35);
  add(`tl.fromTo("#s2-3w",{z:-1600,rotationY:200,opacity:0},{z:0,rotationY:-16,opacity:1,duration:0.62,ease:"back.out(1.3)"},${r3(L(T.tres) - 0.25)});`);
  add(`tl.to("#s2-3w",{rotationY:16,duration:${r3(d - L(T.tres) - 0.4)},ease:"sine.inOut"},${r3(L(T.tres) + 0.37)});`);
  add(`tl.fromTo("#s2-vw",{z:-700,rotationX:-70,opacity:0},{z:0,rotationX:0,opacity:1,duration:0.42,ease:"back.out(1.6)"},${r3(L(T.vidas) - 0.1)});`);
  pop(add, "#s2-c1", L(T.empresario) - 0.08);
  pop(add, "#s2-c2", L(T.mei2) - 0.08);
  fadeUp(add, "#s2-ok", L(T.contratar) - 0.1, 0.4, 24);
  add(`tl.fromTo("#s2-lg",{opacity:0},{opacity:1,duration:0.4},0.3);`);
  push(p, css, body, a);
}

// ═════════════ s3 · operadoras: anel 3D de logos que gira até cada uma quando ela é dita ═════════════
const OPS = [
  { k: "amil", nome: "Amil", bg: "#2B3FE0", inner: `<div class="lg-svg" style="width:210px;color:#fff">${"__AMIL__"}</div>`, t: () => T.amil },
  { k: "bradesco", nome: "Bradesco Saúde", bg: "#CC092F", inner: `<div class="lg-svg" style="width:220px;color:#fff">__BRAD__</div>`, t: () => T.bradesco },
  { k: "sula", nome: "SulAmérica", bg: "#0B2354", inner: `<img src="assets/logos/sulamerica-branco.png" style="width:236px" alt="">`, t: () => T.sula },
  { k: "porto", nome: "Porto", bg: "#FFFFFF", inner: `<img src="assets/logos/porto.svg" style="width:220px" alt="">`, t: () => T.porto },
  { k: "omint", nome: "Omint", bg: "#FFFFFF", inner: `<img src="assets/logos/omint.png" style="width:250px" alt="">`, t: () => T.omint },
  { k: "alice", nome: "Alice", bg: "#B5007E", inner: `<img src="assets/logos/alice.png" style="width:300px;height:300px;border-radius:40px" alt="">`, t: () => T.alice },
];
const ROOTD = join(dirname(fileURLToPath(import.meta.url)), "..");
const svgInline = (f) => readFileSync(join(ROOTD, "assets/logos", f), "utf8").replace(/<title>.*?<\/title>/, "").replace("<svg ", '<svg width="100%" ');
const LOGO_HTML = (o) => o.inner.replace("__AMIL__", svgInline("amil.svg")).replace("__BRAD__", svgInline("bradesco.svg"));

function ring(p, R, size) {
  return OPS.map(
    (o, i) => `<div class="p3 rs" style="left:${-size / 2}px;top:${-size / 2}px;width:${size}px;height:${size}px;transform:rotateY(${i * 60}deg) translateZ(${R}px)">
      <div class="p3 rc" id="${p}-k${i}" style="width:${size}px;height:${size}px">
        <div class="rf" style="background:${o.bg}">${LOGO_HTML(o)}</div>
        <div class="rb" style="background:${o.bg}" aria-hidden="true"></div>
      </div></div>`,
  ).join("");
}
const RING_CSS = (p) => `
#${p}-tilt{left:540px;top:0;width:0;height:0;}
#${p}-ring{left:0;top:0;width:0;height:0;}
.rf,.rb{position:absolute;inset:0;border-radius:44px;display:flex;align-items:center;justify-content:center;overflow:hidden;backface-visibility:hidden;-webkit-backface-visibility:hidden;border:5px solid rgba(255,255,255,.85);box-shadow:0 26px 60px rgba(0,0,0,.5);}
.rb{transform:rotateY(180deg);filter:brightness(.55);}
.lg-svg svg{display:block;width:100%;height:auto;}`;

{
  const p = "s3";
  const { a, L, add, words } = TL(ST[p]);
  const d = DUR[p];
  const css = css0(p) + RING_CSS(p) + `
#s3-tilt{top:1010px;}
#s3-t1{top:540px;font-size:84px;}
#s3-t2{top:640px;font-size:36px;font-family:"Poppins";font-weight:600;text-transform:none;}
#s3-nm{position:absolute;left:0;width:${W}px;top:1262px;height:70px;}
#s3-nm span{position:absolute;left:0;width:${W}px;text-align:center;font-family:"Saira";font-weight:800;font-size:62px;text-transform:uppercase;color:${AMB};opacity:0;}
#s3-mais{top:1262px;font-size:74px;color:${AMB};}
#s3-lg{top:1452px;}`;
  const body = `<div class="stage" id="s3-st" style="perspective:1700px;perspective-origin:50% 50%">${floor(p)}
    <div class="halo" style="left:90px;top:760px;width:900px;height:520px" aria-hidden="true"></div>
    <div class="p3" id="s3-tilt"><div class="p3" id="s3-ring">${ring(p, 440, 300)}</div></div>
  </div>
  <div id="s3-t1" class="ln sa">${wspans("s3a", "A gente compara")}</div>
  <div id="s3-t2" class="ln">${wspans("s3b", "as principais operadoras de São Paulo")}</div>
  <div id="s3-nm">${OPS.map((o, i) => `<span id="s3-n${i}">${o.nome}</span>`).join("")}</div>
  <div id="s3-mais" class="ln sa">${wspans("s3c", "+ muito mais")}</div>
  <div id="s3-lg" class="legal">${OBS.eleg} ${OBS.img}</div>`;
  floorRun(add, p, d);
  words("s3a", seq("a gente compara", ST[p]), 0.38);
  words("s3b", seq("as principais operadoras de sao paulo", T.compara), 0.32);
  add(`tl.set("#s3-tilt",{rotationX:-12});`);
  add(`tl.fromTo("#s3-ring",{z:-2200,rotationY:-240,opacity:0},{z:0,rotationY:40,opacity:1,duration:0.9,ease:"power3.out"},${r3(L(T.operadoras) - 0.4)});`);
  add(`tl.to("#s3-ring",{rotationY:30,duration:${r3(L(T.amil) - L(T.operadoras) - 0.66)},ease:"none"},${r3(L(T.operadoras) + 0.5)});`);
  OPS.forEach((o, i) => {
    const t = L(o.t());
    add(`tl.to("#s3-ring",{rotationY:${-60 * i},duration:0.34,ease:"power3.out"},${r3(t - 0.14)});`);
    add(`tl.fromTo("#s3-k${i}",{scale:1},{scale:1.16,duration:0.3,ease:"back.out(2)"},${r3(t - 0.1)});`);
    const tn = i < OPS.length - 1 ? L(OPS[i + 1].t()) : L(T.muito);
    add(`tl.to("#s3-k${i}",{scale:1,duration:0.25,ease:"power2.out"},${r3(tn - 0.14)});`);
    add(`tl.fromTo("#s3-n${i}",{opacity:0,y:18},{opacity:1,y:0,duration:0.2,ease:"power2.out"},${r3(t - 0.1)});`);
    add(`tl.to("#s3-n${i}",{opacity:0,y:-14,duration:0.15,ease:"power2.in"},${r3(tn - 0.16)});`);
  });
  add(`tl.to("#s3-ring",{rotationY:-300 - 780,duration:1.3,ease:"power2.inOut"},${r3(L(T.muito) - 0.25)});`);
  words("s3c", [at("e", T.alice), ...seq("muito mais", T.alice)], 0.35);
  add(`tl.fromTo("#s3-lg",{opacity:0},{opacity:1,duration:0.4},${r3(L(T.operadoras))});`);
  push(p, css, body, a);
}

// ═════════════ b1 · "Com um plano empresarial, você tem acesso aos melhores hospitais da cidade" — túnel 3D de hospitais ═════════════
{
  const p = "b1";
  const { a, L, add, words } = TL(ST[p]);
  const d = DUR[p];
  const PANELS = [
    ["i_robotica", -250, 24],
    ["a_equipe", 250, -24],
    ["i_sirio_recepcao", -250, 24],
    ["i_vns_corredor", 250, -24],
    ["i_vns_quarto", -10, 0],
  ];
  const css = css0(p) + `
#b1-cam{left:0;top:0;width:${W}px;height:${H}px;}
.b1-p{left:330px;top:560px;width:420px;height:560px;}
#b1-t0{top:1180px;font-size:38px;font-family:"Poppins";font-weight:600;text-transform:none;}
#b1-t1{top:1236px;font-size:74px;}
#b1-t2{top:1316px;font-size:74px;color:${AMB};}
#b1-lg{top:1452px;}`;
  let ph = "";
  PANELS.forEach(([name, x, ry], i) => {
    const z = -260 - 560 * i;
    const t0 = i === 4 ? 0.12 : 0;
    ph += `<div class="panel b1-p" id="b1-p${i}" style="transform:translate3d(${x}px,0,${z}px) rotateY(${ry}deg)"><div class="vw" id="b1-w${i}" data-layout-allow-overflow>${video(`b1-v${i}`, name, t0, r3(Math.min(CLIP[name], d - t0)))}</div></div>`;
  });
  const body = `<div class="stage" id="b1-st" style="perspective:1200px;perspective-origin:50% 44%">${floor(p)}
    <div class="p3" id="b1-cam">${ph}</div>
  </div>
  <div id="b1-t0" class="ln">${wspans("b1a", "com um plano empresarial, acesso aos")}</div>
  <div id="b1-t1" class="ln sa">${wspans("b1b", "melhores hospitais")}</div>
  <div id="b1-t2" class="ln sa">${wspans("b1c", "da cidade")}</div>
  <div id="b1-lg" class="legal">${OBS.varia} ${OBS.rede} ${OBS.img}</div>`;
  floorRun(add, p, d);
  add(`tl.fromTo("#b1-cam",{z:-200},{z:2380,duration:${r3(d)},ease:"none"},0);`);
  PANELS.forEach((_, i) => {
    const z = -260 - 560 * i;
    const tNear = (d * (520 - z + 200)) / 2580; // quando o painel chega a ~520 px da câmera
    if (tNear < d) add(`tl.to("#b1-p${i}",{opacity:0,duration:0.22,ease:"power1.in"},${r3(Math.max(0, tNear - 0.22))});`);
  });
  words("b1a", [...seq("com um plano empresarial", ST[p]), ...seq("acesso aos", T.empresarial)], 0.3);
  words("b1b", seq("melhores hospitais", T.empresarial), 0.36);
  words("b1c", seq("da cidade", T.hospitais), 0.36);
  add(`tl.fromTo("#b1-lg",{opacity:0},{opacity:1,duration:0.3},0.2);`);
  push(p, css, body, a);
}

// ═════════════ b2 · "check-up e exames" — painéis inclinados com vídeos reais de exames ═════════════
{
  const p = "b2";
  const { a, L, add } = TL(ST[p]);
  const d = DUR[p];
  const css = css0(p) + `
#b2-g{left:0;top:0;width:${W}px;height:${H}px;}
#b2-pa{left:80px;top:560px;width:920px;height:520px;}
#b2-pb{left:560px;top:930px;width:440px;height:290px;}
#b2-t{top:1262px;font-size:86px;}
#b2-lg{top:1452px;}`;
  const body = `<div class="stage" id="b2-st">${floor(p)}
    <div class="p3" id="b2-g">
      <div class="panel" id="b2-pa"><div class="vw" data-layout-allow-overflow>${video("b2-va", "a_ultrassom", 0, r3(Math.min(CLIP.a_ultrassom, d)))}</div></div>
      <div class="panel" id="b2-pb"><div class="vw" data-layout-allow-overflow>${video("b2-vb", "a_esteira", 0, r3(Math.min(CLIP.a_esteira, d)))}</div></div>
    </div>
  </div>
  <div id="b2-t" class="ln sa">${wspans("b2a", "check-up e exames")}</div>
  <div id="b2-lg" class="legal">${OBS.cob} ${OBS.img}</div>`;
  floorRun(add, p, d);
  add(`tl.fromTo("#b2-pa",{x:700,z:-500,rotationY:-55,rotationX:10,opacity:0},{x:0,z:0,rotationY:-14,rotationX:8,opacity:1,duration:0.45,ease:"power3.out"},0);`);
  add(`tl.to("#b2-pa",{rotationY:-6,duration:${r3(d - 0.45)},ease:"sine.inOut"},0.45);`);
  add(`tl.fromTo("#b2-pb",{x:600,z:300,rotationY:-40,opacity:0},{x:0,z:160,rotationY:-18,opacity:1,duration:0.42,ease:"back.out(1.4)"},0.18);`);
  add(`tl.fromTo("#b2-t",{scale:0.7,opacity:0},{scale:1,opacity:1,duration:0.35,ease:"back.out(2)"},${r3(L(T.checkup) - 0.05)});`);
  push(p, css, body, a);
}

// ═════════════ b3 · "telemedicina vinte e quatro horas" — celular 3D com consulta por vídeo ═════════════
{
  const p = "b3";
  const { a, L, add, words } = TL(ST[p]);
  const d = DUR[p];
  let body3d = "";
  for (let i = 12; i >= 1; i--) body3d += `<div class="ph-ly" aria-hidden="true" style="transform:translateZ(${-i * 2.6}px)"></div>`;
  const css = css0(p) + `
#b3-ph{left:120px;top:560px;width:420px;height:800px;}
.ph-ly{position:absolute;inset:0;border-radius:62px;background:#1A2230;}
#b3-fr{position:absolute;inset:0;border-radius:62px;background:#06090F;border:14px solid #222C3B;overflow:hidden;box-shadow:0 0 0 2px #3A4658;}
#b3-fr .vw{position:absolute;inset:0;}
#b3-ui{position:absolute;left:24px;top:26px;display:flex;align-items:center;gap:10px;padding:8px 16px;border-radius:22px;background:rgba(0,0,0,.6);font-family:"Poppins";font-weight:600;font-size:22px;}
#b3-ui i{width:14px;height:14px;border-radius:50%;background:#FF4D4D;}
#b3-bt{position:absolute;left:0;right:0;bottom:30px;display:flex;justify-content:center;gap:28px;}
#b3-bt span{width:78px;height:78px;border-radius:50%;display:flex;align-items:center;justify-content:center;}
#b3-24w{left:560px;top:700px;width:460px;text-align:center;}
#b3-t1{left:560px;width:460px;top:960px;font-size:62px;}
#b3-t2{left:560px;width:460px;top:1032px;font-size:40px;font-family:"Poppins";font-weight:600;text-transform:none;color:${CY};}
#b3-lg{top:1452px;}`;
  const body = `<div class="stage" id="b3-st" style="perspective-origin:30% 46%">${floor(p)}
    <div class="halo" style="left:20px;top:620px;width:620px;height:700px" aria-hidden="true"></div>
    <div class="p3" id="b3-ph">${body3d}<div id="b3-fr"><div class="vw" data-layout-allow-overflow>${video("b3-v", "a_medico_tablet", 0, r3(Math.min(CLIP.a_medico_tablet, d)))}</div>
      <div id="b3-ui"><i></i><span>Consulta por vídeo</span></div>
      <div id="b3-bt"><span style="background:#2A3B52">${icon("video", 40, { color: "#fff", sw: 3.4 })}</span><span style="background:#FF4D4D">${icon("phone", 40, { color: "#fff", sw: 3.4 })}</span></div></div></div>
    <div class="p3" id="b3-24w">${ext("b3-24", "24h", { size: 190, front: AMB, side: "#D08C00", n: 20, step: 3 })}</div>
  </div>
  <div id="b3-t1" class="ln sa" style="width:460px">${wspans("b3a", "telemedicina")}</div>
  <div id="b3-t2" class="ln" style="width:460px">${wspans("b3b", "a qualquer hora")}</div>
  <div id="b3-lg" class="legal">${OBS.cob} ${OBS.img}</div>`;
  floorRun(add, p, d);
  add(`tl.fromTo("#b3-ph",{rotationY:62,rotationX:10,z:-500,opacity:0},{rotationY:22,rotationX:4,z:0,opacity:1,duration:0.5,ease:"power3.out"},0);`);
  add(`tl.to("#b3-ph",{rotationY:-14,rotationX:0,duration:${r3(d - 0.5)},ease:"sine.inOut"},0.5);`);
  words("b3a", [T.tele], 0.35);
  add(`tl.fromTo("#b3-24w",{z:-1200,rotationY:-120,opacity:0},{z:0,rotationY:-18,opacity:1,duration:0.5,ease:"back.out(1.4)"},${r3(L(T.vinte) - 0.2)});`);
  add(`tl.to("#b3-24w",{rotationY:16,duration:${r3(Math.max(0.3, d - L(T.vinte) - 0.3))},ease:"sine.inOut"},${r3(L(T.vinte) + 0.3)});`);
  words("b3b", Array.from({ length: 3 }, (_, i) => T.vinte + 0.1 + i * 0.08), 0.3);
  add(`tl.fromTo("#b3-lg",{opacity:0},{opacity:1,duration:0.3},0.2);`);
  push(p, css, body, a);
}

// ═════════════ b4 · viajantes: "pra quem vive viajando a trabalho, cobertura nacional e até seguro viagem, dependendo do plano" ═════════════
{
  const p = "b4";
  const { a, L, add, words } = TL(ST[p]);
  const d = DUR[p];
  const R = 250;
  let globe = "";
  for (let i = 0; i < 9; i++) globe += `<div class="gm" style="transform:rotateY(${i * 20}deg)"></div>`;
  [-180, -100, 0, 100, 180].forEach((h) => {
    const r = Math.sqrt(R * R - h * h);
    globe += `<div class="gl" style="left:${r3(-r)}px;top:${r3(-r)}px;width:${r3(2 * r)}px;height:${r3(2 * r)}px;transform:translateY(${h}px) rotateX(90deg)"></div>`;
  });
  const css = css0(p) + `
#b4-t1{top:540px;font-size:54px;}
#b4-t2{top:604px;font-size:82px;color:${AMB};}
#b4-gt{left:540px;top:960px;width:0;height:0;}
#b4-gr{left:0;top:0;width:0;height:0;}
.gm{position:absolute;left:${-R}px;top:${-R}px;width:${2 * R}px;height:${2 * R}px;border-radius:50%;border:3px solid rgba(58,208,255,.75);box-shadow:0 0 18px rgba(58,208,255,.35);}
.gl{position:absolute;border-radius:50%;border:3px solid rgba(58,208,255,.55);}
#b4-orb{left:0;top:0;width:0;height:0;}
#b4-pl{position:absolute;left:-40px;top:-40px;width:80px;height:80px;transform:translateZ(${R + 90}px);}
#b4-chips{position:absolute;left:0;width:${W}px;top:1252px;display:flex;flex-direction:column;align-items:center;gap:16px;}
#b4-dep{top:1404px;font-size:26px;font-family:"Poppins";font-weight:500;text-transform:none;color:rgba(255,255,255,.92);}
#b4-lg{top:1456px;}`;
  const body = `<div class="stage" id="b4-st">${floor(p)}
    <div class="halo" style="left:190px;top:610px;width:700px;height:700px" aria-hidden="true"></div>
    <div class="p3" id="b4-gt"><div class="p3" id="b4-gr">${globe}</div>
      <div class="p3" id="b4-orb"><div id="b4-pl">${icon("plane", 80, { color: AMB, fill: AMB, sw: 1 })}</div></div></div>
  </div>
  <div id="b4-t1" class="ln sa">${wspans("b4a", "pra quem vive")}</div>
  <div id="b4-t2" class="ln sa">${wspans("b4b", "viajando a trabalho")}</div>
  <div id="b4-chips"><div class="tag" id="b4-c1"><span class="ck">${icon("check", 32, { color: AMB, sw: 5 })}</span>Cobertura nacional</div><div class="tag" id="b4-c2"><span class="ck">${icon("check", 32, { color: AMB, sw: 5 })}</span>Seguro viagem*</div></div>
  <div id="b4-dep" class="ln">${wspans("b4c", "*dependendo do plano")}</div>
  <div id="b4-lg" class="legal">${OBS.cob} ${SRC_TXT}</div>`;
  floorRun(add, p, d);
  add(`tl.set("#b4-gt",{rotationX:-16,rotationZ:-8});`);
  add(`tl.fromTo("#b4-gt",{z:-1500,opacity:0},{z:0,opacity:1,duration:0.6,ease:"power3.out"},0.05);`);
  add(`tl.fromTo("#b4-gr",{rotationY:0},{rotationY:200,duration:${r3(d)},ease:"none"},0);`);
  add(`tl.fromTo("#b4-orb",{rotationY:-40},{rotationY:-40 - 360 * 1.2,duration:${r3(d)},ease:"none"},0);`);
  add(`tl.set("#b4-orb",{rotationX:18});`);
  words("b4a", seq("pra quem vive", ST[p]), 0.35);
  words("b4b", seq("viajando a trabalho", T.e2), 0.38);
  pop(add, "#b4-c1", L(T.cobertura) - 0.08);
  pop(add, "#b4-c2", L(T.seguro) - 0.08);
  words("b4c", seq("dependendo do plano", T.seguro), 0.3);
  add(`tl.fromTo("#b4-lg",{opacity:0},{opacity:1,duration:0.3},${r3(L(T.cobertura))});`);
  push(p, css, body, a);
}

// ═════════════ s5 · "Pra você, seus sócios e a sua família, tudo pelo CNPJ." ═════════════
{
  const p = "s5";
  const { a, L, add, words, shake } = TL(ST[p]);
  const d = DUR[p];
  const CARDS = [
    ["person", "Você", -310, 22, T.voce2],
    ["people", "Sócios", 0, 0, T.socios],
    ["family", "Família", 310, -22, T.familia],
  ];
  const css = css0(p) + `
#s5-g{left:0;top:0;width:${W}px;height:${H}px;}
.s5-c{left:410px;top:600px;width:260px;height:320px;border-radius:30px;background:#F4F7FB;color:${NAVY};display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;box-shadow:0 30px 70px rgba(0,0,0,.5);}
.s5-c .ic{width:130px;height:130px;border-radius:50%;background:${NAVY};display:flex;align-items:center;justify-content:center;}
.s5-c b{font-family:"Saira";font-weight:800;font-size:48px;text-transform:uppercase;}
#s5-t1{top:1000px;font-size:60px;}
#s5-cw{left:0;top:1066px;width:${W}px;text-align:center;}
#s5-lg{top:1452px;}`;
  const body = `<div class="stage" id="s5-st">${floor(p)}
    <div class="halo" style="left:140px;top:560px;width:800px;height:760px" aria-hidden="true"></div>
    <div id="s5-g" style="position:absolute">${CARDS.map(([ic, nm], i) => `<div class="s5-c" id="s5-c${i}" style="position:absolute"><div class="ic">${icon(ic, 80, { color: AMB, sw: 3.2 })}</div><b>${nm}</b></div>`).join("")}</div>
    <div class="p3" id="s5-cw">${ext("s5-cn", "CNPJ", { size: 250, side: "#3D8BFF", n: 24, step: 3 })}</div>
  </div>
  <div id="s5-t1" class="ln sa">${wspans("s5a", "tudo pelo")}</div>
  <div id="s5-lg" class="legal">${OBS.eleg} ${OBS.analise}</div>`;
  floorRun(add, p, d);
  CARDS.forEach(([, , x, ry, t], i) =>
    add(`tl.fromTo("#s5-c${i}",{x:${x},rotationY:${ry + (i === 1 ? 90 : ry > 0 ? 90 : -90)},z:-600,opacity:0,transformPerspective:1100},{x:${x},rotationY:${Math.round(ry * 0.8)},z:${i === 1 ? 60 : 0},opacity:1,duration:0.45,ease:"back.out(1.5)"},${r3(L(t) - 0.12)});`),
  );
  add(`tl.to("#s5-g",{y:-50,scale:0.86,duration:0.5,ease:"power2.inOut"},${r3(L(T.tudo) - 0.2)});`);
  words("s5a", seq("tudo pelo", T.familia), 0.35);
  add(`tl.fromTo("#s5-cw",{z:-2400,rotationY:-40,opacity:0},{z:0,rotationY:-22,rotationX:8,opacity:1,duration:0.36,ease:"expo.out"},${r3(L(T.cnpj2) - 0.2)});`);
  add(`tl.to("#s5-cw",{rotationY:20,rotationX:-6,duration:${r3(d - L(T.cnpj2) - 0.2)},ease:"sine.inOut"},${r3(L(T.cnpj2) + 0.16)});`);
  shake("#s5-st", r3(L(T.cnpj2) + 0.12), 12);
  add(`tl.fromTo("#s5-lg",{opacity:0},{opacity:1,duration:0.3},0.3);`);
  push(p, css, body, a);
}

// ═════════════ en · cartão final: anel de logos, botão do formulário e texto legal ═════════════
{
  const p = "en";
  const { a, L, add, words } = TL(ST[p]);
  const d = DUR[p];
  const css = css0(p) + RING_CSS(p) + `
#en-band{position:absolute;left:0;width:${W}px;top:250px;display:flex;justify-content:center;}
#en-band>div{padding:12px 40px 14px;border-radius:12px;background:${AMB};color:${NAVY};font-family:"Mont";font-weight:900;font-size:58px;line-height:1;white-space:nowrap;box-shadow:0 10px 30px rgba(0,0,0,.35);}
#en-seal{position:absolute;left:0;width:${W}px;top:352px;display:flex;justify-content:center;}
#en-seal>div{display:flex;align-items:center;gap:14px;padding:10px 30px 10px 12px;border-radius:60px;background:#fff;color:${NAVY};font-family:"Mont";font-weight:900;font-size:40px;white-space:nowrap;}
#en-seal .sh{width:58px;height:58px;border-radius:50%;background:${NAVY};display:flex;align-items:center;justify-content:center;}
#en-sub{position:absolute;left:0;width:${W}px;top:444px;display:flex;justify-content:center;}
#en-sub>div{padding:6px 22px;border-radius:26px;background:rgba(5,9,15,.85);border:2px solid rgba(255,194,61,.6);font-family:"Poppins";font-weight:600;font-size:28px;white-space:nowrap;}
#en-tilt{top:700px;}
#en-t1{top:880px;font-size:68px;}
#en-t2{top:950px;font-size:52px;color:${AMB};}
#en-btn{position:absolute;left:110px;top:1032px;width:860px;height:136px;border-radius:80px;background:${AMB};color:${NAVY};display:flex;align-items:center;justify-content:center;gap:22px;box-shadow:0 18px 50px rgba(255,194,61,.35);}
#en-bt{font-family:"Mont";font-weight:900;font-size:52px;line-height:1.05;}
#en-bt small{display:block;font-family:"Poppins";font-weight:600;font-size:26px;}
#en-ar{position:absolute;left:0;width:${W}px;top:1186px;display:flex;justify-content:center;align-items:center;gap:14px;font-family:"Mont";font-weight:800;font-size:34px;}
#en-lg{top:1240px;font-size:19px;line-height:1.32;}`;
  const body = `<div class="stage" id="en-st" style="perspective:1600px;perspective-origin:50% 36%">${floor(p)}
    <div class="p3" id="en-tilt"><div class="p3" id="en-ring">${ring(p, 330, 190)}</div></div>
  </div>
  <div id="en-band"><div>PLANOS DE SAÚDE</div></div>
  <div id="en-seal"><div><div class="sh">${icon("shield", 38, { color: AMB, sw: 3.6 })}</div><span>EXCLUSIVO PARA CNPJ/MEI</span></div></div>
  <div id="en-sub"><div>a partir de 3 vidas · capital de São Paulo</div></div>
  <div id="en-t1" class="ln sa">${wspans("ena", "as melhores opções")}</div>
  <div id="en-t2" class="ln sa">${wspans("enb", "pro seu perfil")}</div>
  <div id="en-btn"><span>${icon("form", 72, { color: NAVY, sw: 3.4 })}</span><div id="en-bt">Solicite sua cotação<small>Preencha o formulário</small></div></div>
  <div id="en-ar">${icon("down", 40, { color: AMB, sw: 4 })}<span>Clique no link abaixo</span>${icon("down", 40, { color: AMB, sw: 4 })}</div>
  <div id="en-lg" class="legal">${NET_TXT} ${SRC_TXT} ${LEGAL_ALL}</div>`;
  floorRun(add, p, d);
  fadeUp(add, "#en-band", 0.02, 0.4, 20);
  fadeUp(add, "#en-seal", 0.1, 0.4, 20);
  fadeUp(add, "#en-sub", 0.18, 0.4, 16);
  add(`tl.set("#en-tilt",{rotationX:-14});`);
  add(`tl.fromTo("#en-ring",{z:-1500,rotationY:-200,opacity:0},{z:0,rotationY:0,opacity:1,duration:0.8,ease:"power3.out"},0.1);`);
  add(`tl.to("#en-ring",{rotationY:-360,duration:${r3(d - 0.9)},ease:"none"},0.9);`);
  words("ena", seq("as melhores opcoes", T.formulario), 0.35);
  words("enb", seq("pro seu perfil", T.formulario), 0.35);
  add(`tl.fromTo("#en-btn",{scale:0.6,opacity:0},{scale:1,opacity:1,duration:0.45,ease:"back.out(2)"},${r3(L(T.preenche) - 0.25)});`);
  for (let i = 0; i < 4; i++) add(`tl.to("#en-btn",{scale:1.05,duration:0.22,yoyo:true,repeat:1,ease:"sine.inOut"},${r3(L(T.formulario) + 0.45 + i * 1.3)});`);
  add(`tl.fromTo("#en-ar",{y:20,opacity:0},{y:0,opacity:1,duration:0.4},${r3(L(T.formulario) + 0.1)});`);
  add(`tl.fromTo("#en-ar svg",{y:-8},{y:8,duration:0.45,yoyo:true,repeat:9,ease:"sine.inOut"},${r3(L(T.formulario) + 0.5)});`);
  add(`tl.fromTo("#en-lg",{opacity:0},{opacity:1,duration:0.5},0.4);`);
  push(p, css, body, a);
}

// ═════════════ cabeçalho fixo (0 → cartão final): PLANOS DE SAÚDE + EXCLUSIVO PARA CNPJ/MEI ═════════════
{
  const p = "hd";
  const { a, add } = TL(0);
  const css =
    FONTS +
    `#hd-root{position:absolute;inset:0;width:${W}px;height:${H}px;pointer-events:none;}
#hd-band{position:absolute;left:0;width:${W}px;top:250px;display:flex;justify-content:center;}
#hd-band>div{padding:12px 40px 14px;border-radius:12px;background:${AMB};color:${NAVY};font-family:"Mont";font-weight:900;font-size:54px;line-height:1;letter-spacing:.02em;white-space:nowrap;box-shadow:0 10px 30px rgba(0,0,0,.35);}
#hd-seal{position:absolute;left:0;width:${W}px;top:348px;display:flex;justify-content:center;}
#hd-seal>div{display:flex;align-items:center;gap:14px;padding:10px 30px 10px 12px;border-radius:60px;background:#fff;color:${NAVY};font-family:"Mont";font-weight:900;font-size:38px;white-space:nowrap;box-shadow:0 10px 30px rgba(0,0,0,.35);}
#hd-seal .sh{width:56px;height:56px;border-radius:50%;background:${NAVY};display:flex;align-items:center;justify-content:center;}
#hd-sub{position:absolute;left:0;width:${W}px;top:438px;display:flex;justify-content:center;}
#hd-sub>div{padding:6px 22px;border-radius:26px;background:rgba(5,9,15,.85);border:2px solid rgba(255,194,61,.6);font-family:"Poppins";font-weight:600;font-size:26px;color:#fff;white-space:nowrap;}`;
  const body = `<div id="hd-band"><div>PLANOS DE SAÚDE</div></div>
  <div id="hd-seal"><div><div class="sh">${icon("shield", 36, { color: AMB, sw: 3.6 })}</div><span>EXCLUSIVO PARA CNPJ/MEI</span></div></div>
  <div id="hd-sub"><div>a partir de 3 vidas · capital de São Paulo</div></div>`;
  add(`tl.fromTo("#hd-seal",{scale:1},{scale:1.08,duration:0.18,yoyo:true,repeat:1,ease:"power2.out"},${r3(T.cnpj1)});`);
  add(`tl.fromTo("#hd-seal",{scale:1},{scale:1.08,duration:0.18,yoyo:true,repeat:1,ease:"power2.out",immediateRender:false},${r3(T.mei2)});`);
  add(`tl.fromTo("#hd-seal",{scale:1},{scale:1.08,duration:0.18,yoyo:true,repeat:1,ease:"power2.out",immediateRender:false},${r3(T.cnpj2)});`);
  scenes.push({ st: 0, track: 6, ...scene(p, ST.en + 0.04, css, body, a) });
}

scenes.push(
  uiScene(
    [
      [T.cnpj1 + 0.12, 0.35],
      [ST.s2, 0.2],
      [T.tres + 0.1, 0.2],
      [ST.s3, 0.18],
      [ST.b1, 0.2],
      [T.cnpj2 + 0.12, 0.3],
      [ST.en, 0.25],
    ],
    { color: "190,235,255", grain: 0.045 },
  ),
);

const SFX = [
  ["whoosh", 0.05, 0.4],
  ["impact", T.cnpj1 + 0.12, 0.5],
  ["pop", T.mei1, 0.35],
  ["whoosh", T.voce1, 0.35],
  ["card", T.einstein - 0.12, 0.45],
  ["card", T.sirio - 0.05, 0.45],
  ["card", T.vila - 0.05, 0.45],
  ["shimmer", T.plano1, 0.3],
  ["riser", T.nao1, 0.3],
  ["stamp", T.nao1 + 0.17, 0.55],
  ["whoosh", T.apartir - 0.3, 0.35],
  ["impact", T.tres + 0.1, 0.4],
  ["pop", T.empresario, 0.3],
  ["pop", T.mei2, 0.3],
  ["check", T.contratar, 0.4],
  ["whoosh", T.operadoras - 0.4, 0.4],
  ["tap", T.amil, 0.35],
  ["tap", T.bradesco, 0.35],
  ["tap", T.sula, 0.35],
  ["tap", T.porto, 0.35],
  ["tap", T.omint, 0.35],
  ["tap", T.alice, 0.35],
  ["shimmer", T.muito, 0.35],
  ["whoosh", ST.b1, 0.4],
  ["shimmer", T.melhores1, 0.3],
  ["whoosh", ST.b2, 0.35],
  ["check", T.checkup, 0.35],
  ["whoosh", ST.b3, 0.35],
  ["pop", T.vinte, 0.35],
  ["whoosh", ST.b4, 0.35],
  ["check", T.cobertura, 0.4],
  ["check", T.seguro, 0.4],
  ["card", T.voce2, 0.35],
  ["card", T.socios, 0.35],
  ["card", T.familia, 0.35],
  ["impact", T.cnpj2 + 0.12, 0.45],
  ["whoosh", ST.en, 0.35],
  ["chime", T.formulario, 0.35],
];

writeOutput(scenes, SFX, { bg: BG });
