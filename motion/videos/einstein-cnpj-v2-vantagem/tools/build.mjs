#!/usr/bin/env node
// build.mjs — variação 2 do anúncio do Einstein: "Se você tem CNPJ, você tem uma vantagem que quase
// ninguém usa". Ângulo: a vantagem do CNPJ e os preços exatos, um de cada vez, em tela cheia.
// Locução ElevenLabs (voz Roberta), story 9:16 para o Meta Ads, informações no centro da tela.
//
//   node tools/build.mjs   -> compositions/*.html + index.html
//
// Texto da locução em tools/voice_prompt.txt. Cada elemento entra na palavra falada
// (assets/voice/vo.words.json); a trilha usa a mesma grade (tools/grid.json).

import {
  W, H, r3, CH, CH2, INK, SLATE, MUTED, GREEN, RED, RED2, GRID, D, at, end, atAny, seq,
  base, wspans, scene, TL, rollHTML, icon, IMG, cube, OBS, QUOTES, cotacoes, bgScene, uiScene, writeOutput,
} from "./lib.mjs";

const T = {};
T.cnpj = at("cnpj");
T.vantagem = at("vantagem");
T.ninguem = at("ninguem");
T.da = at("da", T.ninguem);
T.s2 = r3(T.da - 0.15);
T.plano2 = at("plano", T.da);
T.einstein2 = at("einstein", T.da);
T.rede = at("rede", T.da);
T.pagando = at("pagando");
T.menos = at("menos", T.pagando);
T.imagina = at("imagina");
T.o3 = at("o", end("imagina"));
T.s3 = r3(T.o3 - 0.15);
T.dezesseis = atAny(["decimo", "16o", "16"], T.o3);
T.melhor3 = at("melhor", T.dezesseis);
T.diaria = at("diaria");
T.vinte = at("vinte");
T.reais3End = end("reais", T.vinte);
T.mas = at("mas");
T.s4 = r3(T.mas - 0.15);
T.cnpj4 = at("cnpj", T.mas);
T.olha = at("olha");
T.pessoa = at("pessoa");
T.paga = at("paga", T.pessoa);
T.alice = at("alice");
T.casal = at("casal");
T.casalEnd = end("casal");
T.amil = at("amil");
T.familia = at("familia");
T.partir4 = at("partir", T.familia);
T.bradesco = at("bradesco");
T.ou = at("ou", end("saude", T.bradesco));
T.s5 = r3(T.ou - 0.15);
T.melhores = at("melhores", T.ou);
T.cnpj5 = at("cnpj", T.ou);
T.a6 = at("a", end("empresa"));
T.gente = at("gente", T.a6);
T.s6 = r3(T.a6 - 0.15);
T.compara = at("compara");
T.ops6 = [at("alice", T.compara), at("amil", T.compara), at("bradesco", T.compara), at("sulamerica", T.compara)];
T.outras = at("outras");
T.opcao = at("opcao");
T.clica = GRID.cta; // "Clica" (refrão da trilha)
T.en = r3(T.clica - 0.15);
T.link = at("link");
T.preenche = at("preenche");
T.formulario = at("formulario");
T.descobre = at("descobre");
T.fin = GRID.fin;

const scenes = [bgScene()];

// ═════════════ 1 · gancho: "Se você tem CNPJ, você tem uma vantagem que quase ninguém usa." ═════════════
{
  const p = "s1";
  const st = 0;
  const dur = r3(T.s2 + 0.1);
  const { a, L, add, shake } = TL(st);
  const SP = Array.from({ length: 16 }, (_, i) => {
    const ang = (i / 16) * Math.PI * 2;
    const r = 200 + (i % 3) * 60;
    return [Math.round(Math.cos(ang) * r), Math.round(Math.sin(ang) * r * 0.7), 8 + (i % 3) * 4];
  });
  const css =
    base(p) +
    `
#s1-a{top:330px;font-weight:800;font-size:64px;line-height:1.05;}
#s1-b{top:400px;font-weight:900;font-size:190px;line-height:1;letter-spacing:-.02em;color:${CH};}
#s1-cw{position:absolute;left:130px;top:640px;width:820px;height:250px;}
#s1-cd{position:absolute;inset:0;border-radius:36px;background:linear-gradient(135deg,#1B2B48 0%,#0B1424 60%,#2A2112 100%);border:3px solid ${CH};box-shadow:0 30px 70px rgba(0,0,0,.55);overflow:hidden;}
#s1-lk{position:absolute;left:40px;top:40px;width:170px;height:170px;border-radius:50%;background:rgba(232,194,122,.12);border:3px solid rgba(232,194,122,.6);display:flex;align-items:center;justify-content:center;}
#s1-lkw{position:relative;width:110px;height:110px;}
#s1-lkw svg{position:absolute;left:0;top:0;}
#s1-t1{position:absolute;left:250px;top:52px;font-weight:900;font-size:40px;letter-spacing:.08em;color:${CH};}
#s1-t2{position:absolute;left:250px;top:110px;font-weight:600;font-size:32px;color:${MUTED};letter-spacing:.04em;white-space:nowrap;}
#s1-t3{position:absolute;left:250px;top:162px;display:flex;align-items:center;gap:10px;padding:8px 20px;border-radius:30px;background:#157A45;font-weight:800;font-size:24px;letter-spacing:.08em;}
#s1-gl{position:absolute;left:-60px;top:-60px;width:290px;height:290px;border-radius:50%;background:radial-gradient(closest-side,rgba(247,223,168,.7),rgba(232,194,122,0));opacity:0;}
.s1-sp{position:absolute;left:125px;top:125px;border-radius:50%;background:${CH2};opacity:0;box-shadow:0 0 14px ${CH};}
#s1-c{top:956px;font-weight:800;font-size:60px;line-height:1.05;}
#s1-d{top:1026px;font-weight:900;font-size:136px;line-height:1.05;letter-spacing:-.02em;color:${CH};}
#s1-dw{position:relative;display:inline-block;}
#s1-ul{position:absolute;left:0;bottom:-4px;width:100%;height:12px;border-radius:6px;background:${CH};}
#s1-e{top:1192px;font-weight:800;font-size:58px;line-height:1.05;}
`;
  const body = `
  <div id="s1-main" class="${p}-full">
    <div class="shift" id="s1-sh" style="top:40px;height:${H - 40}px">
    <div id="s1-a" class="ln d">Se você tem</div>
    <div id="s1-b" class="ln d"><span id="s1-bi" style="display:inline-block">CNPJ,</span></div>
    <div id="s1-cw" data-layout-allow-overlap>
      <div id="s1-cd">
        <div id="s1-lk"><div id="s1-lkw">${icon("lockBody", 110, { id: "s1-lb", color: CH, sw: 3.4 })}${icon("shackle", 110, { id: "s1-ls", color: CH, sw: 3.4 })}</div></div>
        <div id="s1-t1" class="d">SUA EMPRESA</div>
        <div id="s1-t2">CNPJ ••.•••.•••/0001-••</div>
        <div id="s1-t3" class="d" data-layout-allow-overlap>${icon("check", 26, { color: "#fff", sw: 5.5 })}<span>VANTAGEM LIBERADA</span></div>
        <div id="s1-sw" class="sweep" data-layout-allow-overflow aria-hidden="true"></div>
      </div>
      <div id="s1-gl" aria-hidden="true"></div>
      ${SP.map((s, i) => `<i class="s1-sp" id="s1-p${i}" style="width:${s[2]}px;height:${s[2]}px" aria-hidden="true"></i>`).join("")}
    </div>
    <div id="s1-c" class="ln d">você tem uma</div>
    <div id="s1-d" class="ln d"><span id="s1-dw"><span id="s1-di" style="display:inline-block">vantagem</span><i id="s1-ul" aria-hidden="true"></i></span></div>
    <div id="s1-e" class="ln d">que quase <span id="s1-ei" class="ch" style="display:inline-block">ninguém</span> usa.</div>
    <div class="legal" id="${p}-lg" style="top:1300px">${OBS.eleg} ${OBS.analise}</div>
    </div>
  </div>`;
  // frase inteira já no quadro 0 (miniatura); o cadeado abre no "vantagem"
  add(`tl.fromTo("#s1-cw",{y:40,rotation:-2},{y:0,rotation:0,duration:0.7,ease:"power3.out"},0);`);
  add(`tl.fromTo("#s1-bi",{scale:1.35},{scale:1,duration:0.3,ease:"power4.out",immediateRender:false},${L(T.cnpj - 0.04)});`);
  shake("#s1-sh", r3(L(T.cnpj) + 0.15), 10);
  add(`tl.fromTo("#s1-t3",{scale:0,opacity:0},{scale:1,opacity:1,duration:0.35,ease:"back.out(2.6)"},${L(T.vantagem + 0.1)});`);
  add(`tl.to("#s1-ls",{y:-22,rotation:-25,transformOrigin:"80% 100%",duration:0.35,ease:"back.out(2.2)"},${L(T.vantagem - 0.05)});`);
  add(`tl.to(["#s1-lb","#s1-ls"],{stroke:"${CH2}",duration:0.2},${L(T.vantagem)});`);
  add(`tl.fromTo("#s1-gl",{opacity:0,scale:0.5},{opacity:1,scale:1.2,duration:0.4,ease:"power2.out"},${L(T.vantagem)});`);
  add(`tl.to("#s1-gl",{opacity:0.35,duration:0.6},${L(T.vantagem + 0.4)});`);
  SP.forEach(([x, y], i) => add(`tl.fromTo("#s1-p${i}",{x:0,y:0,opacity:1,scale:1},{x:${x},y:${y},opacity:0,scale:0.3,duration:0.75,ease:"power3.out"},${r3(L(T.vantagem) + (i % 4) * 0.02)});`));
  add(`tl.fromTo("#s1-sw",{xPercent:-100},{xPercent:100,duration:0.8,ease:"power2.inOut"},${L(T.vantagem)});`);
  add(`tl.fromTo("#s1-di",{scale:1.3},{scale:1,duration:0.3,ease:"power4.out",immediateRender:false},${L(T.vantagem - 0.04)});`);
  add(`tl.fromTo("#s1-ul",{scaleX:0},{scaleX:1,duration:0.5,ease:"power2.inOut",transformOrigin:"0% 50%"},${L(T.vantagem + 0.2)});`);
  add(`tl.fromTo("#s1-ei",{scale:1.35},{scale:1,duration:0.3,ease:"back.out(2.4)",immediateRender:false},${L(T.ninguem - 0.04)});`);
  add(`tl.fromTo("#${p}-lg",{opacity:0},{opacity:1,duration:0.4},0.4);`);
  add(`tl.to("#s1-main",{scale:1.1,opacity:0,duration:0.22,ease:"power2.in"},${r3(dur - 0.22)});`);
  scenes.push({ st, track: 1, ...scene(p, dur, css, body, a) });
}

// ═════════════ 2 · "Dá pra ter um plano de saúde com o Einstein na rede… pagando bem menos…" ═════════════
{
  const p = "s2";
  const st = r3(T.s2 - 0.05);
  const dur = r3(T.s3 + 0.1 - st);
  const { a, L, add, words } = TL(st);
  const css =
    base(p) +
    `
#s2-a{top:320px;font-weight:700;font-size:54px;color:${MUTED};}
#s2-b{top:392px;font-weight:900;font-size:96px;line-height:1.05;letter-spacing:-.01em;}
#s2-pw{position:absolute;left:70px;top:530px;width:940px;height:480px;border-radius:40px;box-shadow:0 34px 80px rgba(0,0,0,.55),0 0 0 4px rgba(232,194,122,.85);}
#s2-pg{position:absolute;left:0;bottom:0;width:100%;height:50%;background:linear-gradient(180deg,rgba(7,11,20,0),rgba(7,11,20,.88));}
#s2-ck{position:absolute;left:34px;bottom:30px;display:flex;align-items:center;gap:12px;padding:12px 26px 12px 14px;border-radius:50px;background:${GREEN};font-weight:900;font-size:36px;box-shadow:0 10px 26px rgba(0,0,0,.4);}
#s2-tg{position:absolute;left:0;width:${W}px;top:1050px;display:flex;justify-content:center;align-items:center;gap:22px;}
#s2-ti{width:110px;height:110px;border-radius:50%;background:linear-gradient(135deg,${CH2},${CH});display:flex;align-items:center;justify-content:center;flex:none;}
#s2-tt{font-weight:900;font-size:66px;line-height:1.05;}
#s2-c{top:1180px;font-weight:700;font-size:48px;color:${MUTED};}
`;
  const body = `
  <div id="s2-wrap" class="${p}-full">
    <div class="shift" style="top:50px;height:${H - 50}px">
    <div id="s2-a" class="ln d">${wspans("s2a", "Plano de saúde com o")}</div>
    <div id="s2-b" class="ln d">${wspans("s2b", "Einstein na rede", "ch")}</div>
    <div class="ph" id="s2-pw"><img id="s2-pi" data-layout-allow-overflow src="${IMG.fachada}" alt="Hospital Israelita Albert Einstein" style="object-position:55% 45%" /><div id="s2-pg"></div>
      <div id="s2-ck" class="d">${icon("check", 40, { color: "#fff", sw: 5.5 })}<span>Einstein na rede</span></div></div>
    <div id="s2-tg"><div id="s2-ti">${icon("tag", 66, { color: INK, sw: 3.4 })}</div><div id="s2-tt" class="d">${wspans("s2t", "pagando bem menos")}</div></div>
    <div id="s2-c" class="ln d">${wspans("s2c", "do que você imagina")}</div>
    <div class="legal" id="${p}-lg" style="top:1270px">${OBS.rede} ${OBS.varia} ${OBS.img}</div>
    </div>
  </div>`;
  words("s2a", seq("plano de saude com o", T.plano2));
  words("s2b", seq("einstein na rede", T.einstein2));
  add(`tl.fromTo("#s2-pw",{y:120,opacity:0,scale:0.92},{y:0,opacity:1,scale:1,duration:0.5,ease:"power3.out"},0.05);`);
  add(`tl.fromTo("#s2-pi",{scale:1.25},{scale:1.02,duration:${dur},ease:"power1.out"},0.05);`);
  add(`tl.fromTo("#s2-ck",{scale:0,opacity:0},{scale:1,opacity:1,duration:0.4,ease:"back.out(2.6)"},${L(T.rede - 0.05)});`);
  add(`tl.fromTo("#s2-ti",{scale:0,rotation:-120},{scale:1,rotation:0,duration:0.45,ease:"back.out(2.4)"},${L(T.pagando - 0.1)});`);
  words("s2t", seq("pagando bem menos", T.pagando));
  words("s2c", seq("do que voce imagina", T.menos));
  add(`tl.fromTo("#${p}-lg",{opacity:0},{opacity:1,duration:0.4},0.4);`);
  add(`tl.to("#s2-wrap",{y:-140,opacity:0,duration:0.28,ease:"power3.in"},${r3(dur - 0.3)});`);
  scenes.push({ st, track: 2, ...scene(p, dur, css, body, a) });
}

// ═════════════ 3 · "O Einstein é o 16º melhor hospital do mundo. E lá, uma diária… vinte mil reais." ═════════════
{
  const p = "s3";
  const st = r3(T.s3 - 0.05);
  const dur = r3(T.s4 + 0.1 - st);
  const { a, L, add, words, shake, roll } = TL(st);
  const NL = 236;
  const LH = 108;
  const laurel = (from, to) => {
    const out = [];
    const n = 7;
    for (let i = 0; i < n; i++) {
      const ang = from + ((to - from) * i) / (n - 1);
      const rad = (ang * Math.PI) / 180;
      const rr = 205 + (i % 2 ? 16 : -16);
      const x = Math.round(250 + Math.cos(rad) * rr);
      const y = Math.round(230 + Math.sin(rad) * rr);
      out.push(`<ellipse cx="${x}" cy="${y}" rx="11" ry="28" transform="rotate(${Math.round(ang + (i % 2 ? 20 : -20))} ${x} ${y})" fill="${CH}"/>`);
    }
    return out.join("");
  };
  const css =
    base(p) +
    `
#s3-lw{position:absolute;left:290px;top:300px;width:500px;height:460px;}
#s3-nw{position:absolute;left:0;width:${W}px;top:410px;display:flex;justify-content:center;align-items:flex-start;}
#s3-nb{font-weight:900;color:${CH};text-shadow:0 10px 40px rgba(232,194,122,.35);}
#s3-o{font-weight:900;font-size:90px;line-height:1;color:${CH};margin-top:28px;}
#s3-a{top:690px;font-weight:900;font-size:52px;line-height:1.05;}
#s3-src{top:760px;font-weight:600;font-size:23px;color:${MUTED};}
#s3-rc{position:absolute;left:150px;top:850px;width:780px;height:330px;border-radius:30px;background:#FBFAF6;color:${INK};box-shadow:0 30px 70px rgba(0,0,0,.55);}
#s3-rh{position:absolute;left:44px;top:34px;font-weight:800;font-size:26px;letter-spacing:.14em;color:${RED};}
#s3-rl{position:absolute;left:44px;top:78px;font-weight:700;font-size:40px;}
#s3-rv{position:absolute;right:44px;top:150px;display:flex;align-items:flex-start;gap:8px;font-weight:900;color:${RED};}
#s3-rs{font-size:50px;line-height:${LH}px;}
#s3-rp{position:absolute;left:44px;top:260px;font-weight:500;font-size:24px;color:${SLATE};}
`;
  const body = `
  <div id="s3-wrap" class="${p}-full">
    <div class="shift" style="top:60px;height:${H - 60}px">
    <svg id="s3-lw" viewBox="0 0 500 460" width="500" height="460" aria-hidden="true"><g id="s3-l0">${laurel(150, 250)}</g><g id="s3-l1">${laurel(30, -70)}</g></svg>
    <div id="s3-nw" class="d"><span id="s3-nb">${rollHTML("s3-n", "16", 210, NL)}</span><span id="s3-o">º</span></div>
    <div id="s3-a" class="ln d">${wspans("s3a", "MELHOR HOSPITAL DO MUNDO")}</div>
    <div id="s3-src" class="ln">Ranking Newsweek · World's Best Hospitals 2026</div>
    <div id="s3-rc"><div id="s3-rh" class="d">NO PARTICULAR</div><div id="s3-rl" class="d">Diária de internação</div>
      <div id="s3-rv" class="d"><span id="s3-rs">R$</span>${rollHTML("s3-v", "20.000", 98, LH)}</div><div id="s3-rp">por dia, sem plano de saúde</div></div>
    <div class="legal" id="${p}-lg" style="top:1220px">${OBS.rede} ${OBS.varia} ${OBS.img}</div>
    </div>
  </div>`;
  add(`tl.fromTo("#s3-nw",{scale:0.6,opacity:0},{scale:1,opacity:1,duration:0.35,ease:"back.out(2)"},0.05);`);
  roll("s3-n", "16", L(T.dezesseis - 0.25), L(T.melhor3 + 0.1), NL);
  add(`tl.fromTo("#s3-o",{scale:0,opacity:0},{scale:1,opacity:1,duration:0.3,ease:"back.out(3)"},${L(T.melhor3)});`);
  add(`tl.fromTo("#s3-l0",{x:-60,opacity:0},{x:0,opacity:0.9,duration:0.5,ease:"power3.out"},${L(T.melhor3 - 0.1)});`);
  add(`tl.fromTo("#s3-l1",{x:60,opacity:0},{x:0,opacity:0.9,duration:0.5,ease:"power3.out"},${L(T.melhor3 - 0.1)});`);
  words("s3a", seq("melhor hospital do mundo", T.melhor3));
  add(`tl.fromTo("#s3-src",{opacity:0},{opacity:1,duration:0.4},${L(T.melhor3 + 0.6)});`);
  add(`tl.fromTo("#s3-rc",{y:500,rotation:5,opacity:0},{y:0,rotation:-1.5,opacity:1,duration:0.55,ease:"power4.out"},${L(T.diaria - 0.4)});`);
  roll("s3-v", "20.000", L(T.vinte - 0.25), L(T.reais3End - 0.15), LH);
  shake("#s3-rc", r3(L(T.reais3End) - 0.1), 10);
  add(`tl.fromTo("#${p}-lg",{opacity:0},{opacity:1,duration:0.4},0.4);`);
  add(`tl.to("#s3-wrap",{scale:0.9,opacity:0,duration:0.26,ease:"power3.in"},${r3(dur - 0.28)});`);
  scenes.push({ st, track: 1, ...scene(p, dur, css, body, a) });
}

// ═════════════ 4 · "Mas pelo CNPJ, olha só:" e os três preços, um de cada vez ═════════════
{
  const p = "s4";
  const st = r3(T.s4 - 0.05);
  const dur = r3(T.s5 + 0.1 - st);
  const { a, L, add, words, shake, roll } = TL(st);
  const LH = 132;
  const K = [
    { key: "alice", n: 1, t: T.pessoa, r0: T.paga + 0.25, r1: T.alice },
    { key: "amil", n: 2, t: T.casal, r0: T.casalEnd + 0.05, r1: T.amil },
    { key: "bradesco", n: 3, t: T.familia, r0: T.partir4 + 0.1, r1: T.bradesco },
  ];
  const css =
    base(p) +
    `
#s4-a{top:300px;font-weight:900;font-size:70px;line-height:1.05;}
.s4-c{position:absolute;left:90px;top:420px;width:900px;height:800px;border-radius:44px;background:#fff;color:${INK};box-shadow:0 34px 80px rgba(0,0,0,.55);}
.s4-lb{position:absolute;left:0;width:100%;top:-30px;display:flex;justify-content:center;}
.s4-lb>div{display:flex;align-items:center;gap:6px;padding:12px 30px 12px 22px;border-radius:50px;background:${INK};color:${CH};font-weight:900;font-size:32px;letter-spacing:.04em;}
.s4-lb span{margin-left:8px;}
.s4-cb{position:absolute;left:0;width:100%;top:62px;display:flex;justify-content:center;}
.s4-op{position:absolute;left:0;width:100%;top:330px;text-align:center;font-weight:900;font-size:56px;line-height:1.1;}
.s4-pl{position:absolute;left:0;width:100%;top:400px;text-align:center;font-weight:700;font-size:36px;color:#8A6A2A;}
.s4-sp{position:absolute;left:0;width:100%;top:452px;text-align:center;font-weight:500;font-size:25px;color:${SLATE};}
.s4-ap{position:absolute;left:0;width:100%;top:520px;text-align:center;font-weight:700;font-size:28px;color:${SLATE};letter-spacing:.06em;}
.s4-pr{position:absolute;left:0;width:100%;top:560px;display:flex;justify-content:center;align-items:flex-start;gap:8px;font-weight:900;color:${INK};}
.s4-rs{font-size:52px;line-height:${LH}px;}
.s4-ms{font-size:36px;line-height:${LH + 40}px;color:${SLATE};}
.s4-fx{position:absolute;left:0;width:100%;top:716px;text-align:center;font-size:22px;color:${SLATE};}
`;
  const card = (k, i) => {
    const q = QUOTES[k.key];
    return `<div class="s4-c" id="s4-c${i}" data-layout-allow-overlap>
      <div class="s4-lb"><div class="d">${Array.from({ length: k.n }, () => icon("person", 34, { color: CH, sw: 3.6 })).join("")}<span>${q.label}</span></div></div>
      <div class="s4-cb">${cube(`s4-q${i}`, k.key, 230)}</div>
      <div class="s4-op d">${q.op}</div><div class="s4-pl d">${q.plan}</div><div class="s4-sp">${q.spec}</div>
      <div class="s4-ap d">A PARTIR DE</div>
      <div class="s4-pr d"><span class="s4-rs">R$</span>${rollHTML(`s4-n${i}`, q.price, 120, LH)}<span class="s4-ms">/mês</span></div>
      <div class="s4-fx">${OBS.faixa}</div></div>`;
  };
  const body = `
  <div id="s4-wrap" class="${p}-full">
    <div class="shift" style="top:50px;height:${H - 50}px">
    <div id="s4-a" class="ln d">${wspans("s4a", "Mas pelo")} <span class="w"><span class="wi ch" id="s4a2">CNPJ,</span></span> ${wspans("s4b", "olha só:")}</div>
    ${K.map(card).join("\n    ")}
    <div class="legal" id="${p}-lg" style="top:1260px">${OBS.ref} ${OBS.perfil} ${OBS.cob} ${OBS.img}</div>
    </div>
  </div>`;
  words("s4a", seq("mas pelo", T.mas));
  add(`tl.fromTo("#s4a2",{yPercent:110,opacity:0},{yPercent:0,opacity:1,duration:0.4,ease:"power3.out"},${L(T.cnpj4 - 0.06)});`);
  words("s4b", seq("olha so", T.olha));
  K.forEach((k, i) => {
    const t = L(k.t - 0.25);
    add(`tl.fromTo("#s4-c${i}",{x:1100,rotation:6},{x:0,rotation:0,duration:0.5,ease:"power4.out"},${t});`);
    add(`tl.fromTo("#s4-q${i}",{scale:0.3,rotation:-40},{scale:1,rotation:0,duration:0.5,ease:"back.out(2)"},${r3(t + 0.15)});`);
    roll(`s4-n${i}`, QUOTES[k.key].price, L(k.r0), L(k.r1 + 0.1), LH);
    shake(`#s4-c${i}`, r3(L(k.r1) + 0.12), 8);
    if (i < K.length - 1) add(`tl.to("#s4-c${i}",{x:-1100,rotation:-6,duration:0.45,ease:"power3.in"},${r3(L(K[i + 1].t - 0.3))});`);
  });
  add(`tl.fromTo("#${p}-lg",{opacity:0},{opacity:1,duration:0.4},${L(T.pessoa)});`);
  add(`tl.to("#s4-wrap",{y:-140,opacity:0,duration:0.28,ease:"power3.in"},${r3(dur - 0.3)});`);
  scenes.push({ st, track: 2, ...scene(p, dur, css, body, a) });
}

// ═════════════ 5 · "Ou seja: um dos melhores hospitais do mundo, pelo CNPJ da sua empresa." ═════════════
{
  const p = "s5";
  const st = r3(T.s5 - 0.05);
  const dur = r3(T.s6 + 0.1 - st);
  const { a, L, add, words } = TL(st);
  const css =
    base(p) +
    `
#s5-bgw{position:absolute;left:0;top:0;width:${W}px;height:${H}px;}
#s5-bgw img{width:100%;height:100%;object-fit:cover;}
#s5-scr{background:linear-gradient(180deg,rgba(7,11,20,.9) 0%,rgba(7,11,20,.55) 35%,rgba(7,11,20,.6) 60%,rgba(7,11,20,.95) 100%);}
#s5-a{top:560px;font-weight:700;font-size:56px;color:${MUTED};}
#s5-b{top:636px;font-weight:900;font-size:84px;line-height:1.05;}
#s5-c{top:736px;font-weight:900;font-size:84px;line-height:1.05;color:${CH};}
.s5-tx{text-shadow:0 4px 24px rgba(0,0,0,.6);}
#s5-pl{top:880px;}
#s5-pli{display:flex;align-items:center;gap:14px;padding:18px 36px;border-radius:60px;background:rgba(7,11,20,.88);border:3px solid ${CH};font-weight:900;font-size:44px;}
`;
  const body = `
  <div id="s5-wrap" class="${p}-full">
    <div id="s5-bgw" aria-hidden="true"><img id="s5-bgi" src="${IMG.atrio}" alt="" data-layout-allow-overflow /></div>
    <div id="s5-scr" class="${p}-full"></div>
    <div class="shift" style="top:20px;height:${H - 20}px">
    <div id="s5-a" class="ln d s5-tx">${wspans("s5a", "Ou seja:")}</div>
    <div id="s5-b" class="ln d s5-tx">${wspans("s5b", "um dos melhores")}</div>
    <div id="s5-c" class="ln d s5-tx">${wspans("s5c", "hospitais do mundo,")}</div>
    <div class="pill" id="s5-pl"><div id="s5-pli" class="d">${icon("building", 50, { color: CH, sw: 3.4 })}<span>pelo CNPJ da sua empresa</span></div></div>
    <div class="legal" id="${p}-lg" style="top:1280px">${OBS.rede} ${OBS.varia} ${OBS.img}</div>
    </div>
  </div>`;
  add(`tl.fromTo("#s5-wrap",{opacity:0},{opacity:1,duration:0.3},0);`);
  add(`tl.fromTo("#s5-bgi",{scale:1.2},{scale:1,duration:${dur},ease:"none"},0);`);
  const s = seq("ou seja um dos melhores hospitais do mundo", T.ou);
  words("s5a", s.slice(0, 2));
  words("s5b", s.slice(2, 5));
  words("s5c", s.slice(5, 8));
  add(`tl.fromTo("#s5-pli",{scale:0.5,opacity:0},{scale:1,opacity:1,duration:0.45,ease:"back.out(2.2)"},${L(T.cnpj5 - 0.35)});`);
  add(`tl.fromTo("#${p}-lg",{opacity:0},{opacity:1,duration:0.4},0.4);`);
  add(`tl.to("#s5-wrap",{scale:1.08,opacity:0,duration:0.28,ease:"power2.in"},${r3(dur - 0.3)});`);
  scenes.push({ st, track: 1, ...scene(p, dur, css, body, a) });
}

// ═════════════ 6 · "A gente compara Alice, Amil, Bradesco, SulAmérica e outras… a melhor opção pro seu perfil." ═════════════
const CUBE_XY = [
  [315, 690],
  [765, 690],
  [315, 1010],
  [765, 1010],
];
{
  const p = "s6";
  const st = r3(T.s6 - 0.05);
  const dur = r3(T.en + 0.1 - st);
  const { a, L, add, words, shake } = TL(st);
  const KEYS = ["alice", "amil", "bradesco", "sulamerica"];
  const css =
    base(p) +
    `
#s6-a{top:300px;font-weight:900;font-size:84px;line-height:1.05;}
#s6-bd{position:absolute;left:90px;top:530px;width:900px;height:640px;border-radius:44px;background:rgba(255,255,255,.05);border:2px solid rgba(232,194,122,.32);}
#s6-v{position:absolute;left:449px;top:40px;width:2px;height:560px;background:rgba(255,255,255,.1);}
#s6-hz{position:absolute;left:40px;top:319px;width:820px;height:2px;background:rgba(255,255,255,.1);}
.s6-gl{position:absolute;width:340px;height:340px;border-radius:50%;background:radial-gradient(closest-side,rgba(232,194,122,.5),rgba(232,194,122,0));opacity:0;}
.s6-q{position:absolute;display:flex;justify-content:center;align-items:center;width:300px;height:300px;}
#s6-ou{position:absolute;left:0;width:${W}px;top:430px;display:flex;justify-content:center;}
#s6-oui{padding:10px 28px;border-radius:40px;background:rgba(255,255,255,.1);border:2px solid rgba(255,255,255,.3);font-weight:800;font-size:32px;}
#s6-bg{position:absolute;left:0;width:${W}px;top:780px;display:flex;justify-content:center;}
#s6-bgi{display:flex;align-items:center;gap:14px;padding:22px 40px;border-radius:24px;background:linear-gradient(180deg,${CH2},${CH});color:${INK};font-weight:900;font-size:44px;letter-spacing:.02em;box-shadow:0 20px 50px rgba(0,0,0,.55);transform:rotate(-4deg);}
`;
  const body = `
  <div id="s6-wrap" class="${p}-full">
    <div class="shift" style="top:90px;height:${H - 90}px">
    <div id="s6-a" class="ln d">${wspans("s6a", "A gente compara")}</div>
    <div id="s6-ou"><div id="s6-oui" class="d">e outras operadoras</div></div>
    <div id="s6-bd"><div id="s6-v"></div><div id="s6-hz"></div></div>
    ${CUBE_XY.map(([x, y], i) => `<div class="s6-gl" id="s6-g${i}" style="left:${x - 170}px;top:${y - 170}px" aria-hidden="true"></div>`).join("")}
    ${KEYS.map((k, i) => `<div class="s6-q" style="left:${CUBE_XY[i][0] - 150}px;top:${CUBE_XY[i][1] - 150}px">${cube(`s6-o${i}`, k, 250)}</div>`).join("\n    ")}
    <div id="s6-bg" data-layout-allow-overlap><div id="s6-bgi" class="d">${icon("star", 44, { color: INK, fill: INK, sw: 2 })}<span>MELHOR OPÇÃO PRO SEU PERFIL</span></div></div>
    <div class="legal" id="${p}-lg" style="top:1220px">${OBS.eleg} ${OBS.analise} ${OBS.img}</div>
    </div>
  </div>`;
  words("s6a", seq("a gente compara", T.a6));
  KEYS.forEach((_, i) => {
    // chegam apagados antes da primeira operadora ser dita
    const t0 = Math.min(L(T.compara), L(T.ops6[0]) - 0.5);
    add(`tl.fromTo("#s6-o${i}",{y:60,scale:0.5,opacity:0,filter:"grayscale(1) brightness(0.7)"},{y:0,scale:0.8,opacity:0.4,filter:"grayscale(1) brightness(0.7)",duration:0.3,ease:"power3.out"},${r3(Math.max(0.05, t0) + i * 0.03)});`);
    add(`tl.to("#s6-o${i}",{scale:1,opacity:1,filter:"grayscale(0) brightness(1)",duration:0.36,ease:"back.out(2.2)"},${L(T.ops6[i] - 0.08)});`);
    add(`tl.to("#s6-o${i}",{y:-24,duration:0.16,ease:"power2.out",yoyo:true,repeat:1},${L(T.ops6[i] - 0.08)});`);
    add(`tl.fromTo("#s6-g${i}",{opacity:0,scale:0.6},{opacity:1,scale:1,duration:0.3,ease:"power2.out"},${L(T.ops6[i] - 0.06)});`);
    add(`tl.to("#s6-g${i}",{opacity:0.3,duration:0.6},${L(T.ops6[i] + 0.3)});`);
  });
  add(`tl.fromTo("#s6-bd",{opacity:0,scale:0.94},{opacity:1,scale:1,duration:0.4,ease:"power3.out"},${L(T.compara - 0.1)});`);
  add(`tl.fromTo("#s6-oui",{scale:0.5,opacity:0},{scale:1,opacity:1,duration:0.35,ease:"back.out(2.4)"},${L(T.outras - 0.08)});`);
  add(`tl.to(["#s6-o0","#s6-o1","#s6-o2","#s6-o3"],{opacity:0.45,duration:0.3},${L(T.opcao - 0.4)});`);
  add(`tl.fromTo("#s6-bgi",{scale:2.4,opacity:0},{scale:1,opacity:1,duration:0.24,ease:"power4.in"},${L(T.opcao - 0.3)});`);
  shake("#s6-bg", r3(L(T.opcao) - 0.05), 9);
  add(`tl.fromTo("#${p}-lg",{opacity:0},{opacity:1,duration:0.4},${L(T.compara)});`);
  add(`tl.to("#s6-wrap",{y:-140,opacity:0,duration:0.26,ease:"power3.in"},${r3(dur - 0.28)});`);
  scenes.push({ st, track: 2, ...scene(p, dur, css, body, a) });
}

// ═════════════ 7 · cartão final: "Clica no link, preenche o formulário e descobre quanto fica pra você." ═════════════
{
  const p = "en";
  const st = r3(T.en - 0.05);
  const dur = r3(D - st);
  const { a, L, add } = TL(st);
  const BTN = { x: 90, y: 1000, w: 900, h: 156 };
  const OPS = ["alice", "amil", "bradesco", "sulamerica"];
  const css =
    base(p) +
    `
#en-a{top:340px;font-weight:900;font-size:76px;line-height:1.05;}
#en-pw{position:absolute;left:100px;top:456px;width:880px;height:300px;border-radius:34px;box-shadow:0 26px 60px rgba(0,0,0,.5),0 0 0 3px rgba(232,194,122,.8);}
#en-pg{position:absolute;left:0;bottom:0;width:100%;height:60%;background:linear-gradient(180deg,rgba(7,11,20,0),rgba(7,11,20,.92));}
#en-pt{position:absolute;left:34px;bottom:26px;display:flex;align-items:center;gap:12px;font-weight:900;font-size:38px;}
#en-ops{position:absolute;left:0;width:${W}px;top:780px;display:flex;justify-content:center;align-items:center;gap:30px;}
#en-ol{position:absolute;left:0;width:${W}px;top:900px;text-align:center;font-weight:600;font-size:24px;color:${MUTED};}
#en-bw{position:absolute;left:${BTN.x}px;top:${BTN.y}px;width:${BTN.w}px;height:${BTN.h}px;}
#en-ring{position:absolute;inset:0;border-radius:${BTN.h}px;border:5px solid rgba(247,223,168,.9);opacity:0;}
#en-btn{position:absolute;inset:0;border-radius:${BTN.h}px;background:linear-gradient(180deg,${CH2} 0%,${CH} 100%);color:${INK};display:flex;align-items:center;justify-content:center;gap:24px;box-shadow:0 20px 50px rgba(232,194,122,.35),inset 0 2px 0 rgba(255,255,255,.5);overflow:hidden;}
#en-bt{display:flex;flex-direction:column;align-items:flex-start;}
#en-b1{font-weight:900;font-size:52px;line-height:1.05;letter-spacing:-.01em;}
#en-b2{font-weight:700;font-size:27px;line-height:1.2;margin-top:4px;}
#en-lb{position:absolute;left:0;width:${W}px;top:1172px;display:flex;justify-content:center;align-items:center;gap:16px;font-weight:800;font-size:36px;color:#fff;}
.en-ar{display:inline-flex;}
`;
  const body = `
  <div id="en-wrap" class="${p}-full">
    <div class="shift" style="top:0px;height:${H}px">
    <div class="pill" id="en-pill" style="top:270px"><div class="d" id="en-pi">${icon("building", 30, { color: CH, sw: 3.6 })}<span>PLANO DE SAÚDE PELO CNPJ</span></div></div>
    <div id="en-a" class="ln d"><span id="en-ai" style="display:inline-block">Quanto fica pra <span class="ch">você?</span></span></div>
    <div class="ph" id="en-pw"><img id="en-pimg" data-layout-allow-overflow src="${IMG.fachada}" alt="Hospital Israelita Albert Einstein" style="object-position:56% 42%" /><div id="en-pg"></div>
      <div id="en-pt" class="d">${icon("check", 40, { color: "#3CD48F", sw: 5 })}<span>Planos com o Einstein na rede</span></div></div>
    <div id="en-ops">${OPS.map((k, i) => cube(`en-o${i}`, k, 96)).join("")}</div>
    <div id="en-ol">Comparamos Alice, Amil, Bradesco, SulAmérica e outras</div>
    <div id="en-bw"><div id="en-ring"></div><div id="en-btn">${icon("form", 70, { id: "en-ic", color: INK, sw: 3.4 })}<div id="en-bt"><span id="en-b1" class="d">Preencha o formulário</span><span id="en-b2">e descubra quanto fica pra você</span></div><div id="en-bsw" class="sweep" data-layout-allow-overflow aria-hidden="true"></div></div></div>
    <div id="en-lb" class="d"><span class="en-ar" id="en-a0">${icon("down", 48, { color: CH, sw: 4.4 })}</span><span>Clique no link abaixo</span><span class="en-ar" id="en-a1">${icon("down", 48, { color: CH, sw: 4.4 })}</span></div>
    <div class="legal" id="${p}-lg" style="top:1240px">${cotacoes(["alice", "amil", "bradesco"])} Ranking: Newsweek World's Best Hospitals 2026. ${OBS.faixa} ${OBS.ref} ${OBS.perfil} ${OBS.cob} ${OBS.rede} ${OBS.varia} ${OBS.eleg} ${OBS.analise} ${OBS.img}</div>
    </div>
  </div>`;
  add(`tl.fromTo("#en-pi",{y:-20,opacity:0},{y:0,opacity:1,duration:0.35,ease:"power3.out"},0.03);`);
  add(`tl.fromTo("#en-ai",{scale:1.4,opacity:0},{scale:1,opacity:1,duration:0.35,ease:"power4.out"},0.08);`);
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
  add(`tl.fromTo("#en-b2",{scale:1.16},{scale:1,duration:0.35,ease:"back.out(2.4)",transformOrigin:"0% 50%",immediateRender:false},${L(T.descobre - 0.04)});`);
  add(`tl.fromTo("#en-ai",{scale:1.08},{scale:1,duration:0.35,ease:"back.out(2.4)",immediateRender:false},${L(T.descobre + 0.3)});`);
  add(`tl.fromTo("#${p}-lg",{opacity:0},{opacity:1,duration:0.5},${r3(L(T.clica) + 0.4)});`);
  // brilho no botão (sem sobrepor duas passadas)
  [L(T.formulario + 0.4), L(T.descobre + 0.4), L(T.fin)]
    .filter((t, i, arr) => i === 0 || t - arr[i - 1] >= 0.9)
    .forEach((t, i) => {
      add(`tl.fromTo("#en-bsw",{xPercent:-100},{xPercent:100,duration:0.8,ease:"power2.inOut"${i ? ",immediateRender:false" : ""}},${r3(t)});`);
    });
  for (let t = L(T.descobre) + 1.0; t + 1.25 <= dur - 0.3; t += 1.25) {
    add(`tl.fromTo("#en-btn",{scale:1},{scale:1.04,duration:0.31,ease:"sine.out",immediateRender:false},${r3(t)});`);
    add(`tl.to("#en-btn",{scale:1,duration:0.5,ease:"sine.inOut"},${r3(t + 0.31)});`);
    add(`tl.fromTo("#en-ring",{opacity:0.7,scale:1},{opacity:0,scale:1.12,duration:0.9,ease:"power2.out",immediateRender:false},${r3(t)});`);
  }
  scenes.push({ st, track: 1, ...scene(p, dur, css, body, a) });
}

scenes.push(
  uiScene([
    [T.cnpj, 0.25],
    [T.vantagem, 0.35],
    [T.mas, 0.3],
    [T.alice, 0.18],
    [T.amil, 0.18],
    [T.bradesco, 0.18],
    [T.opcao - 0.3, 0.25],
    [T.clica, 0.3],
  ]),
);

const SFX = [
  ["pop", T.cnpj - 0.04, 0.16],
  ["impact", T.vantagem, 0.24],
  ["shimmer", T.vantagem + 0.05, 0.2],
  ["pop", T.ninguem - 0.04, 0.12],
  ["whoosh", T.s2 - 0.05, 0.16],
  ["card", T.s2 + 0.05, 0.2],
  ["check", T.rede, 0.18],
  ["pop", T.pagando - 0.1, 0.16],
  ["whoosh", T.s3 - 0.05, 0.16],
  ["counter", T.dezesseis - 0.25, 0.12],
  ["shimmer", T.melhor3, 0.16],
  ["card", T.diaria - 0.35, 0.2],
  ["counter", T.vinte - 0.25, 0.12],
  ["impact", T.reais3End - 0.1, 0.2],
  ["whoosh", T.s4 - 0.05, 0.16],
  ["impact", T.cnpj4, 0.16],
  ["whoosh", T.pessoa - 0.25, 0.14],
  ["counter", T.paga + 0.25, 0.1],
  ["chime", T.alice + 0.1, 0.16],
  ["whoosh", T.casal - 0.25, 0.14],
  ["counter", T.casalEnd + 0.05, 0.1],
  ["chime", T.amil + 0.1, 0.16],
  ["whoosh", T.familia - 0.25, 0.14],
  ["counter", T.partir4 + 0.1, 0.1],
  ["chime", T.bradesco + 0.1, 0.16],
  ["whoosh", T.s5 - 0.05, 0.14],
  ["shimmer", T.melhores, 0.14],
  ["pop", T.cnpj5 - 0.35, 0.16],
  ["whoosh", T.s6 - 0.05, 0.14],
  ...T.ops6.map((t) => ["pop", t - 0.08, 0.14]),
  ["pop", T.outras - 0.08, 0.12],
  ["stamp", T.opcao - 0.3, 0.24],
  ["whoosh", T.en - 0.05, 0.16],
  ["impact", T.clica, 0.22],
  ["pop", T.clica + 0.02, 0.18],
  ["pop", T.link - 0.08, 0.12],
  ["shimmer", T.formulario, 0.14],
  ["shimmer", T.descobre + 0.3, 0.14],
  ["shimmer", T.fin, 0.2],
];

writeOutput(scenes, SFX);
