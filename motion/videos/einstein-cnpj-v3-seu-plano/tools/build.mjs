#!/usr/bin/env node
// build.mjs — variação 3 do anúncio do Einstein: "Seu plano de saúde te dá acesso ao Einstein?".
// Ângulo: pergunta que qualifica (quem já paga plano sem o Einstein na rede e quem ainda não tem),
// o risco de descobrir na hora errada, o caminho do plano empresarial pelo CNPJ, as operadoras
// com o Einstein na rede, o preço de entrada e "antes de renovar ou contratar, compara".
// Locução ElevenLabs (voz Roberta), story 9:16 para o Meta Ads, informações no centro da tela.
//
//   node tools/build.mjs   -> compositions/*.html + index.html
//
// Texto da locução em tools/voice_prompt.txt. Cada elemento entra na palavra falada
// (assets/voice/vo.words.json); a trilha usa a mesma grade (tools/grid.json).

import {
  W, H, r3, CH, CH2, INK, SLATE, MUTED, GREEN, RED, RED2, GRID, D, at, end, seq,
  base, wspans, scene, TL, rollHTML, icon, IMG, cube, OBS, QUOTES, cotacoes, bgScene, uiScene, writeOutput,
} from "./lib.mjs";

const T = {};
T.einstein1 = at("einstein");
T.se = at("se", T.einstein1);
T.nao1 = at("nao", T.se);
T.presta = at("presta");
T.s2 = r3(T.presta - 0.12);
T.muita = at("muita");
T.paga = at("paga", T.muita);
T.mes = at("mes", T.paga);
T.hora = at("hora");
T.hospital2 = at("hospital", T.hora);
T.nao2 = at("nao", T.hospital2);
T.rede2 = at("rede", T.nao2);
T.e3 = at("e", end("rede", T.nao2));
T.s3 = r3(T.e3 - 0.12);
T.cirurgia = at("cirurgia");
T.duzentos = at("duzentos");
T.reais3End = end("reais", T.duzentos);
T.so4 = at("so", T.reais3End);
T.s4 = r3(T.so4 - 0.12);
T.caminho = at("caminho");
T.conhece = at("conhece");
T.empresarial = at("empresarial");
T.cnpj4 = at("cnpj", T.empresarial);
T.existem = at("existem");
T.s5 = r3(T.existem - 0.12);
T.einstein5 = at("einstein", T.existem);
T.ops = [at("alice"), at("amil"), at("bradesco"), at("sulamerica")];
T.partir = at("partir");
T.s6 = r3(T.partir - 0.25);
T.mes6 = at("mes", T.partir);
T.pessoa = at("pessoa");
T.entao = at("entao");
T.s7 = r3(T.entao - 0.12);
T.renovar = at("renovar");
T.contratar = at("contratar");
T.qualquer = at("qualquer");
T.compara = at("compara");
T.clica = GRID.cta; // "Clica" (refrão da trilha)
T.en = r3(T.clica - 0.15);
T.link = at("link");
T.preenche = at("preenche");
T.formulario = at("formulario");
T.mostra = at("mostra");
T.einstein8 = at("einstein", T.mostra);
T.fin = GRID.fin;

const scenes = [bgScene()];

// ═════════════ 1 · gancho: enquete "Seu plano de saúde te dá acesso ao Einstein?" → toque no NÃO ═════════════
{
  const p = "s1";
  const st = 0;
  const dur = r3(T.s2 + 0.1);
  const { a, L, add, shake } = TL(st);
  const css =
    base(p) +
    `
#s1-bgw{position:absolute;left:0;top:0;width:${W}px;height:${H}px;}
#s1-bgw img{position:absolute;left:-60px;top:-40px;width:${W + 120}px;height:${H + 80}px;object-fit:cover;}
#s1-scr{background:linear-gradient(180deg,rgba(7,11,20,.88),rgba(7,11,20,.7) 40%,rgba(7,11,20,.92));}
#s1-cw{position:absolute;left:100px;top:330px;width:880px;height:990px;}
#s1-cd{position:absolute;inset:0;border-radius:44px;background:#fff;color:${INK};overflow:hidden;box-shadow:0 40px 90px rgba(0,0,0,.6);}
#s1-pw{left:0;top:0;width:880px;height:400px;}
#s1-tg{position:absolute;left:28px;top:28px;display:flex;align-items:center;gap:10px;padding:10px 22px;border-radius:40px;background:rgba(7,11,20,.82);color:#fff;font-weight:800;font-size:24px;letter-spacing:.1em;}
#s1-q{position:absolute;left:56px;top:440px;width:768px;font-weight:900;font-size:66px;line-height:1.12;letter-spacing:-.01em;}
#s1-q .ch2{color:#8A6418;}
.s1-bt{position:absolute;top:800px;width:370px;height:130px;border-radius:30px;background:#EEF1F6;border:3px solid #D5DBE5;display:flex;align-items:center;justify-content:center;gap:14px;font-weight:900;font-size:54px;letter-spacing:.04em;}
#s1-b0{left:56px;color:#157A45;}
#s1-b1{left:454px;color:${RED};}
#s1-rp{position:absolute;left:639px;top:865px;width:40px;height:40px;margin:-20px 0 0 -20px;border-radius:50%;border:5px solid ${RED};opacity:0;}
#s1-fg{position:absolute;left:660px;top:880px;width:110px;height:110px;opacity:0;}
`;
  const finger = `<svg id="s1-fg" viewBox="0 0 48 48" width="110" height="110" aria-hidden="true" data-layout-allow-overlap><path d="M18 22V9a3 3 0 0 1 6 0v11l1-1a3 3 0 0 1 6 1v1a3 3 0 0 1 6 1v2a3 3 0 0 1 6 1v8c0 7-5 12-12 12h-3c-4 0-7-2-9-5l-7-10a3 3 0 0 1 5-4z" fill="#fff" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/></svg>`;
  const body = `
  <div id="s1-main" class="${p}-full">
    <div id="s1-bgw" data-layout-allow-overflow aria-hidden="true"><img id="s1-bgi" src="${IMG.atrio}" alt="" /></div>
    <div id="s1-scr" class="${p}-full"></div>
    <div class="shift" id="s1-sh" style="top:20px;height:${H - 20}px">
    <div id="s1-cw" data-layout-allow-overlap>
      <div id="s1-cd">
        <div class="ph" id="s1-pw"><img id="s1-pi" data-layout-allow-overflow src="${IMG.fachada}" alt="Hospital Israelita Albert Einstein" style="object-position:55% 45%" /><div id="s1-sw" class="sweep" data-layout-allow-overflow aria-hidden="true"></div></div>
        <div id="s1-tg" class="d">${icon("search", 30, { color: CH, sw: 3.6 })}<span>PERGUNTA RÁPIDA</span></div>
        <div id="s1-q" class="d">Seu plano de saúde te dá acesso ao <span class="ch2" id="s1-qe" style="display:inline-block">Einstein?</span></div>
        <div class="s1-bt d" id="s1-b0">${icon("check", 52, { color: "#157A45", sw: 5 })}<span>SIM</span></div>
        <div class="s1-bt d" id="s1-b1"><span id="s1-b1x" style="display:inline-flex">${icon("x", 52, { color: RED, sw: 5 })}</span><span id="s1-b1t">NÃO</span></div>
        <i id="s1-rp" aria-hidden="true"></i>
      </div>
      ${finger}
    </div>
    <div class="legal" id="${p}-lg" style="top:1350px">${OBS.rede} ${OBS.varia} ${OBS.img}</div>
    </div>
  </div>`;
  // enquete inteira já no quadro 0 (miniatura); o "NÃO" é tocado no "Se a resposta foi não"
  add(`tl.fromTo("#s1-bgi",{scale:1.12},{scale:1,duration:${dur},ease:"none"},0);`);
  add(`tl.fromTo("#s1-cw",{y:50,rotation:-1.5},{y:0,rotation:0,duration:0.7,ease:"power3.out"},0);`);
  add(`tl.fromTo("#s1-pi",{scale:1.2},{scale:1.02,duration:${dur},ease:"power1.out"},0);`);
  add(`tl.fromTo("#s1-qe",{scale:1.3},{scale:1,duration:0.35,ease:"back.out(2.4)",immediateRender:false},${L(T.einstein1 - 0.04)});`);
  add(`tl.fromTo("#s1-sw",{xPercent:-100},{xPercent:100,duration:0.8,ease:"power2.inOut"},${L(T.einstein1)});`);
  add(`tl.fromTo("#s1-fg",{x:200,y:260,opacity:0},{x:0,y:0,opacity:1,duration:0.4,ease:"power3.out"},${L(T.nao1 - 0.55)});`);
  add(`tl.to("#s1-fg",{scale:0.86,duration:0.1,yoyo:true,repeat:1,transformOrigin:"30% 10%"},${L(T.nao1 - 0.08)});`);
  add(`tl.fromTo("#s1-rp",{opacity:0.9,scale:0.4},{opacity:0,scale:5,duration:0.6,ease:"power2.out"},${L(T.nao1)});`);
  add(`tl.to("#s1-b1",{backgroundColor:"${RED}",borderColor:"${RED}",color:"#fff",duration:0.15},${L(T.nao1)});`);
  add(`tl.to("#s1-b1x svg",{stroke:"#fff",duration:0.15},${L(T.nao1)});`);
  // o "SIM" apaga para cinza (sem perder contraste)
  add(`tl.to("#s1-b0",{color:"${SLATE}",borderColor:"#E3E7EE",duration:0.25},${L(T.nao1)});`);
  add(`tl.to("#s1-b0 svg",{stroke:"${SLATE}",duration:0.25},${L(T.nao1)});`);
  shake("#s1-cw", r3(L(T.nao1) + 0.1), 9);
  add(`tl.fromTo("#${p}-lg",{opacity:0},{opacity:1,duration:0.4},0.4);`);
  add(`tl.to("#s1-main",{scale:1.1,opacity:0,duration:0.22,ease:"power2.in"},${r3(dur - 0.22)});`);
  scenes.push({ st, track: 1, ...scene(p, dur, css, body, a) });
}

// ═════════════ 2 · "presta atenção. Muita gente paga plano todo mês e só descobre… não está na rede." ═════════════
{
  const p = "s2";
  const st = r3(T.s2 - 0.05);
  const dur = r3(T.s3 + 0.1 - st);
  const { a, L, add, words, shake } = TL(st);
  const MESES = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];
  const css =
    base(p) +
    `
#s2-al{position:absolute;left:0;width:${W}px;top:300px;display:flex;justify-content:center;align-items:center;gap:18px;font-weight:900;font-size:64px;}
#s2-a{top:410px;font-weight:800;font-size:56px;line-height:1.05;}
#s2-cal{position:absolute;left:140px;top:500px;width:800px;height:440px;border-radius:36px;background:rgba(255,255,255,.06);border:2px solid rgba(255,255,255,.18);}
#s2-ch{position:absolute;left:0;top:26px;width:100%;text-align:center;font-weight:800;font-size:26px;letter-spacing:.14em;color:${MUTED};}
.s2-m{position:absolute;width:168px;height:96px;border-radius:20px;background:rgba(255,255,255,.08);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;}
.s2-ml{font-weight:800;font-size:24px;letter-spacing:.08em;color:${MUTED};}
.s2-mk{width:40px;height:40px;border-radius:50%;background:${GREEN};display:flex;align-items:center;justify-content:center;}
#s2-nt{position:absolute;left:100px;top:990px;width:880px;height:220px;border-radius:34px;background:#fff;color:${INK};box-shadow:0 30px 70px rgba(0,0,0,.6);}
#s2-ni{position:absolute;left:34px;top:46px;width:128px;height:128px;border-radius:30px;background:#FDECEC;display:flex;align-items:center;justify-content:center;}
#s2-n1{position:absolute;left:190px;top:44px;font-weight:700;font-size:28px;color:${SLATE};letter-spacing:.06em;}
#s2-n2{position:absolute;left:190px;top:88px;font-weight:900;font-size:46px;line-height:1.1;}
#s2-n3{position:absolute;left:190px;top:148px;font-weight:600;font-size:26px;color:${SLATE};}
#s2-st{position:absolute;right:-18px;top:-58px;padding:10px 22px;border-radius:14px;border:6px solid ${RED};color:${RED};background:rgba(255,255,255,.96);font-weight:900;font-size:32px;letter-spacing:.04em;transform:rotate(-6deg);white-space:nowrap;}
`;
  const body = `
  <div id="s2-wrap" class="${p}-full">
    <div class="shift" style="top:40px;height:${H - 40}px">
    <div id="s2-al" class="d"><span id="s2-ai" style="display:inline-flex">${icon("alert", 70, { color: CH, sw: 3.6 })}</span><span id="s2-at">Presta atenção.</span></div>
    <div id="s2-a" class="ln d">${wspans("s2a", "Muita gente paga plano todo mês")}</div>
    <div id="s2-cal"><div id="s2-ch" class="d">MENSALIDADE DO PLANO</div>
      ${MESES.map((m, i) => `<div class="s2-m" id="s2-m${i}" style="left:${28 + (i % 4) * 188}px;top:${76 + Math.floor(i / 4) * 116}px"><span class="s2-ml d">${m}</span><span class="s2-mk" id="s2-k${i}">${icon("check", 26, { color: "#fff", sw: 5.5 })}</span></div>`).join("")}
    </div>
    <div id="s2-nt" data-layout-allow-overlap><div id="s2-ni">${icon("hospital", 80, { color: RED, sw: 3.4 })}</div>
      <div id="s2-n1" class="d">NA HORA QUE PRECISA…</div><div id="s2-n2" class="d">O hospital que você queria</div><div id="s2-n3">não faz parte da rede do seu plano</div>
      <div id="s2-st" class="d" data-layout-allow-overlap>NÃO ESTÁ NA REDE</div></div>
    <div class="legal" id="${p}-lg" style="top:1270px">${OBS.rede} ${OBS.varia} ${OBS.img}</div>
    </div>
  </div>`;
  add(`tl.fromTo("#s2-al",{scale:1.5,opacity:0},{scale:1,opacity:1,duration:0.3,ease:"power4.out"},0.05);`);
  add(`tl.fromTo("#s2-ai",{rotation:-12},{rotation:12,duration:0.12,ease:"sine.inOut",yoyo:true,repeat:5},0.2);`);
  words("s2a", seq("muita gente paga plano todo mes", T.muita));
  add(`tl.fromTo("#s2-cal",{y:120,opacity:0},{y:0,opacity:1,duration:0.4,ease:"power3.out"},${L(T.muita)});`);
  const step = Math.max(0.06, (T.mes + 0.5 - T.paga) / 12);
  for (let i = 0; i < 12; i++) add(`tl.fromTo("#s2-k${i}",{scale:0},{scale:1,duration:0.2,ease:"back.out(3)"},${r3(L(T.paga) + i * step)});`);
  add(`tl.fromTo("#s2-nt",{y:300,opacity:0},{y:0,opacity:1,duration:0.45,ease:"back.out(1.5)"},${L(T.hora - 0.3)});`);
  add(`tl.to("#s2-cal",{opacity:0.45,scale:0.96,duration:0.3},${L(T.hora - 0.2)});`);
  add(`tl.fromTo("#s2-st",{scale:2.4,opacity:0},{scale:1,opacity:1,duration:0.22,ease:"power4.in"},${L(T.nao2 - 0.04)});`);
  shake("#s2-nt", r3(L(T.nao2) + 0.18), 10);
  add(`tl.fromTo("#${p}-lg",{opacity:0},{opacity:1,duration:0.4},${L(T.hora)});`);
  add(`tl.to("#s2-wrap",{y:-140,opacity:0,duration:0.26,ease:"power3.in"},${r3(dur - 0.28)});`);
  scenes.push({ st, track: 2, ...scene(p, dur, css, body, a) });
}

// ═════════════ 3 · "E no Einstein, uma cirurgia pode passar dos duzentos mil reais." ═════════════
{
  const p = "s3";
  const st = r3(T.s3 - 0.05);
  const dur = r3(T.s4 + 0.1 - st);
  const { a, L, add, shake, roll } = TL(st);
  const LH = 128;
  const css =
    base(p) +
    `
#s3-bgw{position:absolute;left:0;top:0;width:${W}px;height:${H}px;}
#s3-bgw img{width:100%;height:100%;object-fit:cover;}
#s3-scr{background:linear-gradient(180deg,rgba(20,4,8,.92),rgba(14,6,12,.8) 45%,rgba(7,11,20,.95));}
#s3-k{top:420px;}
#s3-ki{display:flex;align-items:center;gap:10px;padding:12px 30px;border-radius:60px;background:${RED};color:#fff;font-weight:800;font-size:28px;letter-spacing:.14em;}
#s3-rc{position:absolute;left:110px;top:510px;width:860px;height:560px;border-radius:30px;background:#FBFAF6;color:${INK};box-shadow:0 40px 90px rgba(0,0,0,.6);}
#s3-hd{position:absolute;left:0;top:44px;width:100%;text-align:center;font-weight:900;font-size:36px;letter-spacing:.16em;}
#s3-hr{position:absolute;left:56px;top:110px;width:748px;border-top:3px dashed #C9CED8;}
#s3-lb{position:absolute;left:56px;top:150px;font-weight:800;font-size:54px;}
#s3-sb{position:absolute;left:56px;top:222px;font-weight:500;font-size:28px;color:${SLATE};}
#s3-vl{position:absolute;left:0;width:100%;top:300px;display:flex;justify-content:center;align-items:flex-start;gap:10px;font-weight:900;color:${RED};}
#s3-rs{font-size:58px;line-height:${LH}px;}
#s3-pl{font-size:110px;line-height:${LH}px;}
#s3-ft{position:absolute;left:0;width:100%;top:462px;text-align:center;font-weight:700;font-size:28px;color:${SLATE};}
`;
  const body = `
  <div id="s3-wrap" class="${p}-full">
    <div id="s3-bgw" aria-hidden="true"><img id="s3-bgi" src="${IMG.robo}" alt="" data-layout-allow-overflow /></div>
    <div id="s3-scr" class="${p}-full"></div>
    <div class="shift" style="top:20px;height:${H - 20}px">
    <div class="pill" id="s3-k"><div id="s3-ki" class="d">NO EINSTEIN, NO PARTICULAR</div></div>
    <div id="s3-rc"><div id="s3-hd" class="d">CONTA HOSPITALAR</div><div id="s3-hr"></div>
      <div id="s3-lb" class="d">Cirurgia</div><div id="s3-sb">procedimento + equipe + materiais</div>
      <div id="s3-vl" class="d"><span id="s3-rs">R$</span>${rollHTML("s3-n", "200.000", 118, LH)}<span id="s3-pl">+</span></div>
      <div id="s3-ft" class="d">pode passar disso</div></div>
    <div class="legal" id="${p}-lg" style="top:1110px">${OBS.img}</div>
    </div>
  </div>`;
  add(`tl.fromTo("#s3-bgi",{scale:1.2},{scale:1,duration:${dur},ease:"none"},0);`);
  add(`tl.fromTo("#s3-ki",{scale:0.5,opacity:0},{scale:1,opacity:1,duration:0.35,ease:"back.out(2.4)"},0.05);`);
  add(`tl.fromTo("#s3-rc",{y:900,rotation:4},{y:0,rotation:-1.5,duration:0.55,ease:"power4.out"},0.08);`);
  roll("s3-n", "200.000", L(T.duzentos - 0.35), L(T.reais3End - 0.15), LH);
  add(`tl.fromTo("#s3-pl",{scale:0,opacity:0},{scale:1,opacity:1,duration:0.3,ease:"back.out(3)"},${L(T.reais3End - 0.15)});`);
  shake("#s3-rc", r3(L(T.reais3End) - 0.05), 14);
  add(`tl.fromTo("#s3-ft",{opacity:0},{opacity:1,duration:0.3},${L(T.reais3End)});`);
  add(`tl.fromTo("#${p}-lg",{opacity:0},{opacity:1,duration:0.4},0.4);`);
  add(`tl.to("#s3-wrap",{y:-140,opacity:0,duration:0.26,ease:"power3.in"},${r3(dur - 0.28)});`);
  scenes.push({ st, track: 1, ...scene(p, dur, css, body, a) });
}

// ═════════════ 4 · "Só que tem um caminho que pouca gente conhece: o plano empresarial, pelo seu CNPJ." ═════════════
{
  const p = "s4";
  const st = r3(T.s4 - 0.05);
  const dur = r3(T.s5 + 0.1 - st);
  const { a, L, add, words, shake } = TL(st);
  const css =
    base(p) +
    `
#s4-a{top:320px;font-weight:900;font-size:76px;line-height:1.05;}
#s4-b{top:410px;font-weight:700;font-size:54px;color:${MUTED};}
#s4-path{position:absolute;left:0;top:500px;width:${W}px;height:420px;}
#s4-cw{position:absolute;left:150px;top:880px;width:780px;height:300px;}
#s4-cd{position:absolute;inset:0;border-radius:40px;background:linear-gradient(135deg,#1B2B48 0%,#0B1424 60%,#2A2112 100%);border:4px solid ${CH};box-shadow:0 30px 80px rgba(232,194,122,.25),0 30px 70px rgba(0,0,0,.5);overflow:hidden;}
#s4-ci{position:absolute;left:44px;top:66px;width:168px;height:168px;border-radius:50%;background:linear-gradient(135deg,${CH2},${CH});display:flex;align-items:center;justify-content:center;}
#s4-c1{position:absolute;left:250px;top:76px;font-weight:900;font-size:56px;line-height:1.05;}
#s4-c2{position:absolute;left:252px;top:150px;font-weight:800;font-size:44px;color:${CH};}
`;
  const body = `
  <div id="s4-wrap" class="${p}-full">
    <div class="shift" style="top:40px;height:${H - 40}px">
    <div id="s4-a" class="ln d">${wspans("s4a", "Tem um caminho")}</div>
    <div id="s4-b" class="ln d">${wspans("s4b", "que pouca gente conhece:")}</div>
    <svg id="s4-path" viewBox="0 0 ${W} 420" width="${W}" height="420" aria-hidden="true">
      <path id="s4-p0" pathLength="1" d="M120 40 C 420 40, 160 220, 540 230 S 760 300, 540 410" fill="none" stroke="rgba(232,194,122,.25)" stroke-width="34" stroke-linecap="round"/>
      <path id="s4-p1" pathLength="1" d="M120 40 C 420 40, 160 220, 540 230 S 760 300, 540 410" fill="none" stroke="${CH}" stroke-width="8" stroke-linecap="round" stroke-dasharray="1" stroke-dashoffset="1"/>
      <circle id="s4-dot" cx="120" cy="40" r="16" fill="${CH2}"/></svg>
    <div id="s4-cw" data-layout-allow-overlap><div id="s4-cd"><div id="s4-ci">${icon("building", 96, { color: INK, sw: 3.2 })}</div>
      <div id="s4-c1" class="d">Plano empresarial</div><div id="s4-c2" class="d"><span id="s4-c2i" style="display:inline-block">pelo seu CNPJ</span></div><div id="s4-sw" class="sweep" data-layout-allow-overflow aria-hidden="true"></div></div></div>
    <div class="legal" id="${p}-lg" style="top:1230px">${OBS.eleg} ${OBS.analise}</div>
    </div>
  </div>`;
  words("s4a", seq("tem um caminho", T.so4));
  words("s4b", seq("que pouca gente conhece", T.caminho));
  add(`tl.fromTo("#s4-p0",{opacity:0},{opacity:1,duration:0.3},${L(T.caminho - 0.1)});`);
  add(`tl.to("#s4-p1",{strokeDashoffset:0,duration:${r3(Math.max(0.6, T.empresarial - T.caminho))},ease:"power1.inOut"},${L(T.caminho)});`);
  add(`tl.fromTo("#s4-dot",{scale:0,transformOrigin:"50% 50%"},{scale:1,duration:0.3,ease:"back.out(3)"},${L(T.caminho - 0.1)});`);
  add(`tl.fromTo("#s4-cw",{scale:0.5,opacity:0,y:60},{scale:1,opacity:1,y:0,duration:0.45,ease:"back.out(1.8)"},${L(T.empresarial - 0.3)});`);
  add(`tl.fromTo("#s4-ci",{rotation:-90,scale:0.4},{rotation:0,scale:1,duration:0.5,ease:"back.out(2.2)"},${L(T.empresarial - 0.2)});`);
  add(`tl.fromTo("#s4-c2i",{scale:1.3,opacity:0},{scale:1,opacity:1,duration:0.3,ease:"back.out(2.4)"},${L(T.cnpj4 - 0.25)});`);
  add(`tl.fromTo("#s4-sw",{xPercent:-100},{xPercent:100,duration:0.8,ease:"power2.inOut"},${L(T.cnpj4)});`);
  shake("#s4-cw", r3(L(T.cnpj4) + 0.1), 8);
  add(`tl.fromTo("#${p}-lg",{opacity:0},{opacity:1,duration:0.4},${L(T.empresarial)});`);
  add(`tl.to("#s4-wrap",{y:-140,opacity:0,duration:0.26,ease:"power3.in"},${r3(dur - 0.28)});`);
  scenes.push({ st, track: 2, ...scene(p, dur, css, body, a) });
}

// ═════════════ 5 · "Existem planos com o Einstein na rede na Alice, na Amil, na Bradesco Saúde e na SulAmérica…" ═════════════
{
  const p = "s5";
  const st = r3(T.s5 - 0.05);
  const dur = r3(T.s6 + 0.1 - st);
  const { a, L, add, words } = TL(st);
  const KEYS = ["alice", "amil", "bradesco", "sulamerica"];
  const NAMES = ["Alice", "Amil", "Bradesco Saúde", "SulAmérica"];
  const css =
    base(p) +
    `
#s5-a{top:320px;font-weight:700;font-size:54px;color:${MUTED};}
#s5-b{top:392px;font-weight:900;font-size:86px;line-height:1.05;}
.s5-r{position:absolute;left:90px;width:900px;height:150px;border-radius:32px;background:rgba(255,255,255,.07);border:2px solid rgba(232,194,122,.35);display:flex;align-items:center;gap:26px;padding:0 30px;}
.s5-n{flex:1;font-weight:900;font-size:46px;white-space:nowrap;}
.s5-ok{display:flex;align-items:center;gap:8px;padding:10px 20px;border-radius:40px;background:${GREEN};font-weight:800;font-size:24px;white-space:nowrap;}
`;
  const body = `
  <div id="s5-wrap" class="${p}-full">
    <div class="shift" style="top:40px;height:${H - 40}px">
    <div id="s5-a" class="ln d">${wspans("s5a", "Existem planos com o")}</div>
    <div id="s5-b" class="ln d">${wspans("s5b", "Einstein na rede", "ch")}</div>
    ${KEYS.map((k, i) => `<div class="s5-r" id="s5-r${i}" style="top:${520 + i * 172}px">${cube(`s5-q${i}`, k, 104, "flex:none")}<span class="s5-n d">${NAMES[i]}</span><span class="s5-ok d" id="s5-k${i}">${icon("check", 26, { color: "#fff", sw: 5.5 })}<span>Einstein na rede</span></span></div>`).join("\n    ")}
    <div class="legal" id="${p}-lg" style="top:1230px">${OBS.rede} ${OBS.varia} ${OBS.eleg} ${OBS.img}</div>
    </div>
  </div>`;
  words("s5a", seq("existem planos com o", T.existem));
  words("s5b", seq("einstein na rede", T.einstein5));
  KEYS.forEach((_, i) => {
    add(`tl.fromTo("#s5-r${i}",{x:${i % 2 ? -1100 : 1100}},{x:0,duration:0.45,ease:"power4.out"},${L(T.ops[i] - 0.2)});`);
    add(`tl.fromTo("#s5-q${i}",{scale:0.3,rotation:-30},{scale:1,rotation:0,duration:0.45,ease:"back.out(2.2)"},${L(T.ops[i] - 0.1)});`);
    add(`tl.fromTo("#s5-k${i}",{scale:0,opacity:0},{scale:1,opacity:1,duration:0.3,ease:"back.out(2.6)"},${L(T.ops[i] + 0.25)});`);
  });
  add(`tl.fromTo("#${p}-lg",{opacity:0},{opacity:1,duration:0.4},${L(T.ops[0])});`);
  add(`tl.to("#s5-wrap",{y:-140,opacity:0,duration:0.26,ease:"power3.in"},${r3(dur - 0.28)});`);
  scenes.push({ st, track: 1, ...scene(p, dur, css, body, a) });
}

// ═════════════ 6 · "a partir de R$ 1.345,06 por mês, pra uma pessoa de 30 anos" ═════════════
{
  const p = "s6";
  const st = r3(T.s6 - 0.05);
  const dur = r3(T.s7 + 0.1 - st);
  const { a, L, add, shake, roll } = TL(st);
  const LH = 160;
  const q = QUOTES.alice;
  const css =
    base(p) +
    `
#s6-gl{position:absolute;left:90px;top:420px;width:900px;height:360px;border-radius:50%;background:radial-gradient(closest-side,rgba(232,194,122,.32),rgba(232,194,122,0));opacity:0;}
#s6-a{top:430px;font-weight:800;font-size:40px;letter-spacing:.16em;color:${MUTED};}
#s6-pr{position:absolute;left:0;width:${W}px;top:490px;display:flex;justify-content:center;align-items:flex-start;gap:8px;font-weight:900;color:${CH};}
#s6-rs{font-size:66px;line-height:${LH}px;}
#s6-ms{font-size:50px;line-height:${LH + 60}px;color:#fff;}
#s6-fx{top:668px;font-size:24px;color:#fff;}
#s6-cd{position:absolute;left:110px;top:760px;width:860px;height:250px;border-radius:36px;background:#fff;color:${INK};box-shadow:0 26px 60px rgba(0,0,0,.5);}
#s6-lb{position:absolute;left:30px;top:-24px;display:flex;align-items:center;gap:8px;padding:10px 24px 10px 16px;border-radius:40px;background:${INK};color:${CH};font-weight:800;font-size:28px;}
#s6-cq{position:absolute;left:40px;top:58px;}
#s6-op{position:absolute;left:220px;top:64px;font-weight:900;font-size:46px;}
#s6-pl{position:absolute;left:220px;top:122px;font-weight:700;font-size:32px;color:#8A6A2A;}
#s6-sp{position:absolute;left:220px;top:172px;font-weight:500;font-size:24px;color:${SLATE};}
`;
  const body = `
  <div id="s6-wrap" class="${p}-full">
    <div class="shift" style="top:20px;height:${H - 20}px">
    <div id="s6-gl" aria-hidden="true"></div>
    <div id="s6-a" class="ln d">A PARTIR DE</div>
    <div id="s6-pr" class="d"><span id="s6-rs">R$</span>${rollHTML("s6-n", q.price, 160, LH)}<span id="s6-ms">/mês</span></div>
    <div id="s6-fx" class="ln">${OBS.faixa}</div>
    <div id="s6-cd"><div id="s6-lb" class="d">${icon("person", 32, { color: CH, sw: 3.6 })}<span>${q.label}</span></div>
      <div id="s6-cq">${cube("s6-q", "alice", 150)}</div><div id="s6-op" class="d">${q.op}</div><div id="s6-pl" class="d">${q.plan}</div><div id="s6-sp">${q.spec}</div></div>
    <div class="legal" id="${p}-lg" style="top:1060px">${OBS.ref} ${OBS.perfil} ${OBS.cob} ${OBS.img}</div>
    </div>
  </div>`;
  add(`tl.fromTo("#s6-a",{opacity:0,y:20},{opacity:1,y:0,duration:0.3,ease:"power3.out"},${L(T.partir - 0.1)});`);
  roll("s6-n", q.price, L(T.partir + 0.2), L(T.mes6 + 0.1), LH);
  add(`tl.fromTo("#s6-gl",{opacity:0,scale:0.6},{opacity:1,scale:1.1,duration:0.4,ease:"power2.out"},${L(T.mes6)});`);
  shake("#s6-pr", r3(L(T.mes6) + 0.1), 10);
  add(`tl.fromTo("#s6-fx",{opacity:0},{opacity:1,duration:0.3},${L(T.mes6)});`);
  add(`tl.fromTo("#s6-cd",{y:200,opacity:0},{y:0,opacity:1,duration:0.45,ease:"back.out(1.6)"},${L(T.pessoa - 0.3)});`);
  add(`tl.fromTo("#s6-q",{scale:0.3,rotation:-30},{scale:1,rotation:0,duration:0.45,ease:"back.out(2.2)"},${L(T.pessoa - 0.2)});`);
  add(`tl.fromTo("#${p}-lg",{opacity:0},{opacity:1,duration:0.4},${L(T.mes6)});`);
  add(`tl.to("#s6-wrap",{y:-140,opacity:0,duration:0.26,ease:"power3.in"},${r3(dur - 0.28)});`);
  scenes.push({ st, track: 2, ...scene(p, dur, css, body, a) });
}

// ═════════════ 7 · "Então, antes de renovar ou contratar qualquer plano… compara." ═════════════
{
  const p = "s7";
  const st = r3(T.s7 - 0.05);
  const dur = r3(T.en + 0.1 - st);
  const { a, L, add, words, shake } = TL(st);
  const css =
    base(p) +
    `
#s7-a{top:400px;font-weight:700;font-size:56px;color:${MUTED};}
#s7-ps{position:absolute;left:0;width:${W}px;top:490px;display:flex;justify-content:center;gap:22px;}
.s7-p{display:flex;align-items:center;gap:14px;padding:16px 34px 16px 22px;border-radius:50px;background:rgba(255,255,255,.08);border:2px solid rgba(232,194,122,.5);font-weight:800;font-size:44px;}
#s7-b{top:610px;font-weight:800;font-size:60px;}
#s7-ic{position:absolute;left:450px;top:720px;width:180px;height:180px;border-radius:50%;background:linear-gradient(135deg,${CH2},${CH});display:flex;align-items:center;justify-content:center;box-shadow:0 20px 50px rgba(0,0,0,.45);}
#s7-gl{position:absolute;left:90px;top:860px;width:900px;height:360px;border-radius:50%;background:radial-gradient(closest-side,rgba(232,194,122,.45),rgba(232,194,122,0));opacity:0;}
#s7-c{top:930px;font-weight:900;font-size:170px;line-height:1.05;letter-spacing:-.02em;color:${CH};}
`;
  const body = `
  <div id="s7-wrap" class="${p}-full">
    <div class="shift" style="top:20px;height:${H - 20}px">
    <div id="s7-a" class="ln d">${wspans("s7a", "Então, antes de")}</div>
    <div id="s7-ps"><div class="s7-p d" id="s7-p0">${icon("refresh", 50, { color: CH, sw: 3.6 })}renovar</div><div class="s7-p d" id="s7-p1">${icon("form", 50, { color: CH, sw: 3.4 })}contratar</div></div>
    <div id="s7-b" class="ln d">${wspans("s7b", "qualquer plano…")}</div>
    <div id="s7-ic">${icon("scale", 108, { color: INK, sw: 3.4 })}</div>
    <div id="s7-gl" aria-hidden="true"></div>
    <div id="s7-c" class="ln d"><span id="s7-ci" style="display:inline-block">compara.</span></div>
    </div>
  </div>`;
  words("s7a", seq("entao antes de", T.entao));
  add(`tl.fromTo("#s7-p0",{scale:0.4,opacity:0},{scale:1,opacity:1,duration:0.38,ease:"back.out(2.2)"},${L(T.renovar - 0.08)});`);
  add(`tl.fromTo("#s7-p1",{scale:0.4,opacity:0},{scale:1,opacity:1,duration:0.38,ease:"back.out(2.2)"},${L(T.contratar - 0.08)});`);
  words("s7b", seq("qualquer plano", T.qualquer));
  add(`tl.fromTo("#s7-ic",{scale:0,rotation:-60},{scale:1,rotation:0,duration:0.45,ease:"back.out(2.4)"},${L(T.compara - 0.35)});`);
  add(`tl.to("#s7-ic",{rotation:10,duration:0.16,ease:"sine.inOut",yoyo:true,repeat:3},${L(T.compara + 0.2)});`);
  add(`tl.fromTo("#s7-ci",{scale:2.2,opacity:0},{scale:1,opacity:1,duration:0.3,ease:"power4.out"},${L(T.compara - 0.04)});`);
  add(`tl.fromTo("#s7-gl",{opacity:0,scale:0.6},{opacity:1,scale:1.1,duration:0.5,ease:"power2.out"},${L(T.compara)});`);
  shake("#s7-c", r3(L(T.compara) + 0.2), 10);
  add(`tl.to("#s7-wrap",{scale:1.15,opacity:0,duration:0.24,ease:"power3.in"},${r3(dur - 0.26)});`);
  scenes.push({ st, track: 1, ...scene(p, dur, css, body, a) });
}

// ═════════════ 8 · cartão final: "Clica no link, preenche o formulário… quais planos têm o Einstein pro seu perfil." ═════════════
{
  const p = "en";
  const st = r3(T.en - 0.05);
  const dur = r3(D - st);
  const { a, L, add } = TL(st);
  const BTN = { x: 90, y: 1010, w: 900, h: 156 };
  const OPS = ["alice", "amil", "bradesco", "sulamerica"];
  const css =
    base(p) +
    `
#en-a{top:330px;font-weight:800;font-size:58px;line-height:1.05;}
#en-b{top:398px;font-weight:900;font-size:66px;line-height:1.05;}
#en-pw{position:absolute;left:100px;top:500px;width:880px;height:280px;border-radius:34px;box-shadow:0 26px 60px rgba(0,0,0,.5),0 0 0 3px rgba(232,194,122,.8);}
#en-pg{position:absolute;left:0;bottom:0;width:100%;height:60%;background:linear-gradient(180deg,rgba(7,11,20,0),rgba(7,11,20,.92));}
#en-pt{position:absolute;left:34px;bottom:24px;display:flex;align-items:center;gap:12px;font-weight:900;font-size:36px;}
#en-ops{position:absolute;left:0;width:${W}px;top:802px;display:flex;justify-content:center;align-items:center;gap:30px;}
#en-ol{position:absolute;left:0;width:${W}px;top:920px;text-align:center;font-weight:600;font-size:24px;color:${MUTED};}
#en-bw{position:absolute;left:${BTN.x}px;top:${BTN.y}px;width:${BTN.w}px;height:${BTN.h}px;}
#en-ring{position:absolute;inset:0;border-radius:${BTN.h}px;border:5px solid rgba(247,223,168,.9);opacity:0;}
#en-btn{position:absolute;inset:0;border-radius:${BTN.h}px;background:linear-gradient(180deg,${CH2} 0%,${CH} 100%);color:${INK};display:flex;align-items:center;justify-content:center;gap:24px;box-shadow:0 20px 50px rgba(232,194,122,.35),inset 0 2px 0 rgba(255,255,255,.5);overflow:hidden;}
#en-bt{display:flex;flex-direction:column;align-items:flex-start;}
#en-b1{font-weight:900;font-size:52px;line-height:1.05;letter-spacing:-.01em;}
#en-b2{font-weight:700;font-size:27px;line-height:1.2;margin-top:4px;}
#en-lb{position:absolute;left:0;width:${W}px;top:1184px;display:flex;justify-content:center;align-items:center;gap:16px;font-weight:800;font-size:36px;color:#fff;}
.en-ar{display:inline-flex;}
`;
  const body = `
  <div id="en-wrap" class="${p}-full">
    <div class="shift" style="top:40px;height:${H - 40}px">
    <div class="pill" id="en-pill" style="top:262px"><div class="d" id="en-pi">${icon("building", 30, { color: CH, sw: 3.6 })}<span>PLANO DE SAÚDE PELO CNPJ</span></div></div>
    <div id="en-a" class="ln d"><span id="en-ai" style="display:inline-block">Quais planos têm o</span></div>
    <div id="en-b" class="ln d"><span id="en-bi" style="display:inline-block"><span class="ch">Einstein</span> pro seu perfil?</span></div>
    <div class="ph" id="en-pw"><img id="en-pimg" data-layout-allow-overflow src="${IMG.fachada}" alt="Hospital Israelita Albert Einstein" style="object-position:56% 42%" /><div id="en-pg"></div>
      <div id="en-pt" class="d">${icon("check", 38, { color: "#3CD48F", sw: 5 })}<span>Planos com o Einstein na rede</span></div></div>
    <div id="en-ops">${OPS.map((k, i) => cube(`en-o${i}`, k, 96)).join("")}</div>
    <div id="en-ol">Comparamos Alice, Amil, Bradesco Saúde, SulAmérica e outras</div>
    <div id="en-bw"><div id="en-ring"></div><div id="en-btn">${icon("form", 70, { id: "en-ic", color: INK, sw: 3.4 })}<div id="en-bt"><span id="en-b1" class="d">Preencha o formulário</span><span id="en-b2">e veja os planos com o Einstein</span></div><div id="en-bsw" class="sweep" data-layout-allow-overflow aria-hidden="true"></div></div></div>
    <div id="en-lb" class="d"><span class="en-ar" id="en-a0">${icon("down", 48, { color: CH, sw: 4.4 })}</span><span>Clique no link abaixo</span><span class="en-ar" id="en-a1">${icon("down", 48, { color: CH, sw: 4.4 })}</span></div>
    <div class="legal" id="${p}-lg" style="top:1250px">${cotacoes(["alice"])} ${OBS.faixa} ${OBS.ref} ${OBS.perfil} ${OBS.cob} ${OBS.rede} ${OBS.varia} ${OBS.eleg} ${OBS.analise} ${OBS.img}</div>
    </div>
  </div>`;
  add(`tl.fromTo("#en-pi",{y:-20,opacity:0},{y:0,opacity:1,duration:0.35,ease:"power3.out"},0.03);`);
  add(`tl.fromTo("#en-ai",{y:40,opacity:0},{y:0,opacity:1,duration:0.35,ease:"power3.out"},0.08);`);
  add(`tl.fromTo("#en-bi",{y:40,opacity:0},{y:0,opacity:1,duration:0.35,ease:"power3.out"},0.16);`);
  add(`tl.fromTo("#en-pw",{y:80,opacity:0},{y:0,opacity:1,duration:0.5,ease:"power3.out"},0.2);`);
  add(`tl.fromTo("#en-pimg",{scale:1.2},{scale:1,duration:${r3(dur - 0.2)},ease:"power1.out"},0.2);`);
  OPS.forEach((_, i) => add(`tl.fromTo("#en-o${i}",{scale:0.3,opacity:0,y:30},{scale:1,opacity:1,y:0,duration:0.4,ease:"back.out(2.2)"},${r3(0.45 + i * 0.08)});`));
  add(`tl.fromTo("#en-ol",{opacity:0},{opacity:1,duration:0.4},0.8);`);
  add(`tl.fromTo("#en-bw",{scale:0.6,opacity:0},{scale:1,opacity:1,duration:0.45,ease:"back.out(1.8)"},${L(T.clica - 0.05)});`);
  const ar = r3(L(T.link) - 0.08);
  add(`tl.fromTo("#en-lb",{opacity:0,y:-14},{opacity:1,y:0,duration:0.35,ease:"power3.out"},${ar});`);
  const beat = GRID.bar / 4;
  const nb = Math.floor((dur - ar - 0.4) / beat);
  add(`tl.fromTo(["#en-a0","#en-a1"],{y:0},{y:14,duration:${r3(beat / 2)},ease:"sine.inOut",repeat:${nb * 2 - 1},yoyo:true},${ar});`);
  add(`tl.fromTo("#en-ic",{rotation:0},{rotation:12,duration:0.1,ease:"sine.inOut",repeat:5,yoyo:true},${L(T.preenche)});`);
  add(`tl.fromTo("#en-b1",{scale:1.12},{scale:1,duration:0.35,ease:"back.out(2.4)",transformOrigin:"0% 50%",immediateRender:false},${L(T.formulario - 0.04)});`);
  add(`tl.fromTo("#en-b2",{scale:1.16},{scale:1,duration:0.35,ease:"back.out(2.4)",transformOrigin:"0% 50%",immediateRender:false},${L(T.mostra - 0.04)});`);
  add(`tl.fromTo("#en-bi",{scale:1.08},{scale:1,duration:0.35,ease:"back.out(2.4)",immediateRender:false},${L(T.einstein8 - 0.04)});`);
  add(`tl.fromTo("#${p}-lg",{opacity:0},{opacity:1,duration:0.5},${r3(L(T.clica) + 0.4)});`);
  // brilho no botão (sem sobrepor duas passadas)
  [L(T.formulario + 0.4), L(T.einstein8), L(T.fin)]
    .filter((t, i, arr) => i === 0 || t - arr[i - 1] >= 0.9)
    .forEach((t, i) => {
      add(`tl.fromTo("#en-bsw",{xPercent:-100},{xPercent:100,duration:0.8,ease:"power2.inOut"${i ? ",immediateRender:false" : ""}},${r3(t)});`);
    });
  for (let t = L(T.einstein8) + 0.9; t + 1.25 <= dur - 0.3; t += 1.25) {
    add(`tl.fromTo("#en-btn",{scale:1},{scale:1.04,duration:0.31,ease:"sine.out",immediateRender:false},${r3(t)});`);
    add(`tl.to("#en-btn",{scale:1,duration:0.5,ease:"sine.inOut"},${r3(t + 0.31)});`);
    add(`tl.fromTo("#en-ring",{opacity:0.7,scale:1},{opacity:0,scale:1.12,duration:0.9,ease:"power2.out",immediateRender:false},${r3(t)});`);
  }
  scenes.push({ st, track: 2, ...scene(p, dur, css, body, a) });
}

scenes.push(
  uiScene([
    [T.nao1, 0.25],
    [T.presta, 0.2],
    [T.nao2, 0.25],
    [T.reais3End - 0.05, 0.25],
    [T.cnpj4, 0.25],
    [T.mes6, 0.3],
    [T.compara, 0.35],
    [T.clica, 0.3],
  ]),
);

const SFX = [
  ["pop", T.einstein1 - 0.04, 0.14],
  ["whoosh", T.nao1 - 0.55, 0.12],
  ["tap", T.nao1 - 0.04, 0.3],
  ["stamp", T.nao1, 0.18],
  ["whoosh", T.s2 - 0.05, 0.16],
  ["impact", T.presta, 0.2],
  ...Array.from({ length: 12 }, (_, i) => ["tap", T.paga + i * Math.max(0.06, (T.mes + 0.5 - T.paga) / 12), 0.07]),
  ["card", T.hora - 0.3, 0.2],
  ["stamp", T.nao2 - 0.04, 0.26],
  ["whoosh", T.s3 - 0.05, 0.16],
  ["card", T.s3 + 0.1, 0.2],
  ["counter", T.duzentos - 0.35, 0.14],
  ["impact", T.reais3End - 0.05, 0.24],
  ["whoosh", T.s4 - 0.05, 0.14],
  ["riser", T.empresarial - 0.2, 0.14],
  ["impact", T.empresarial - 0.2, 0.16],
  ["shimmer", T.cnpj4, 0.18],
  ["whoosh", T.s5 - 0.05, 0.14],
  ...T.ops.map((t) => ["card", t - 0.15, 0.16]),
  ...T.ops.map((t) => ["check", t + 0.25, 0.14]),
  ["whoosh", T.s6 - 0.05, 0.14],
  ["counter", T.partir + 0.2, 0.12],
  ["impact", T.mes6 + 0.05, 0.22],
  ["shimmer", T.mes6 + 0.1, 0.16],
  ["card", T.pessoa - 0.3, 0.16],
  ["whoosh", T.s7 - 0.05, 0.12],
  ["pop", T.renovar - 0.08, 0.16],
  ["pop", T.contratar - 0.08, 0.16],
  ["impact", T.compara, 0.26],
  ["shimmer", T.compara + 0.05, 0.18],
  ["whoosh", T.en - 0.05, 0.16],
  ["impact", T.clica, 0.22],
  ["pop", T.clica + 0.02, 0.18],
  ["pop", T.link - 0.08, 0.12],
  ["shimmer", T.formulario, 0.14],
  ["shimmer", T.einstein8, 0.14],
  ["shimmer", T.fin, 0.2],
];

writeOutput(scenes, SFX);
