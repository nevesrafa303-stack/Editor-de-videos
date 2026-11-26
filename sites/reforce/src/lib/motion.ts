import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import Lenis from "lenis";
import { definirEstadoGantt, marcarSlide } from "./interacoes";

gsap.registerPlugin(ScrollTrigger, SplitText);
ScrollTrigger.config({ ignoreMobileResize: true });

const $ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) => root.querySelector<T>(sel);
const $$ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) =>
  Array.from(root.querySelectorAll<T>(sel));

// Coreografia de rolagem da home, em JavaScript puro (usada pelo componente Motion e pela prévia em
// arquivo único). Cada seção tem o seu movimento, sempre preso à rolagem (scrub): ao descer acontece,
// ao subir se desfaz. Sem JavaScript, ou com "reduzir movimento", tudo aparece no estado final e os
// carrosséis viram trilhos de rolagem lateral (dedo, arrastar com o mouse ou setas).

/** Rolagem suave (Lenis) sincronizada com o ScrollTrigger. Devolve a limpeza. */
export function iniciarRolagemSuave() {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return () => {};
  const lenis = new Lenis({ lerp: 0.1, anchors: { offset: -72 }, allowNestedScroll: true });
  lenis.on("scroll", ScrollTrigger.update);
  const tick = (time: number) => lenis.raf(time * 1000);
  gsap.ticker.add(tick);
  gsap.ticker.lagSmoothing(0);
  // Pedidos de rolagem das setas dos carrosséis (lib/interacoes.ts).
  const rolar = (e: Event) => {
    const d = (e as CustomEvent<{ y: number; tratado: boolean }>).detail;
    lenis.scrollTo(d.y, { duration: 1.2 });
    d.tratado = true;
  };
  window.addEventListener("reforce:rolar", rolar);
  return () => {
    window.removeEventListener("reforce:rolar", rolar);
    gsap.ticker.remove(tick);
    lenis.destroy();
  };
}

const formatar = (v: number, d: number) => v.toLocaleString("pt-BR", { minimumFractionDigits: d, maximumFractionDigits: d });
const entrada = (trigger: Element, inicio = "top 90%", fim = "top 60%") => ({ trigger, start: inicio, end: fim, scrub: 0.6 });

/** Largura que o trilho passa da tela (medida pelo último cartão, sem depender de transformações). */
function sobra(trilho: HTMLElement, visivel = window.innerWidth) {
  const ultimo = trilho.lastElementChild as HTMLElement | null;
  if (!ultimo) return 0;
  const pad = parseFloat(getComputedStyle(trilho).paddingRight) || 0;
  return Math.max(0, ultimo.offsetLeft + ultimo.offsetWidth + pad - visivel);
}

/** Guarda na seção onde a fixação começa e termina, para as setas rolarem a página até cada cartão. */
function guardarPin(sec: HTMLElement, st: ScrollTrigger, progressos: number[]) {
  sec.dataset.pinInicio = String(st.start);
  sec.dataset.pinFim = String(st.end);
  sec.dataset.pinProgressos = progressos.map((p) => p.toFixed(4)).join(",");
}
function soltarPin(sec: HTMLElement) {
  delete sec.dataset.pinInicio;
  delete sec.dataset.pinFim;
  delete sec.dataset.pinProgressos;
}

type Cond = { desktop: boolean; fixar: boolean; mouse: boolean };
type Limpezas = (() => void)[];

// ---------- Geral: títulos, textos, contadores, faixas ----------
function geral() {
  $$("[data-split]").forEach((el) => {
    SplitText.create(el, {
      type: "lines",
      mask: "lines",
      autoSplit: true,
      onSplit: (self) =>
        gsap.fromTo(self.lines, { yPercent: 110 }, { yPercent: 0, stagger: 0.12, ease: "power2.out", scrollTrigger: entrada(el, "top 92%", "top 62%") }),
    });
  });

  $$("[data-reveal]").forEach((el) => {
    const alvos = el.dataset.reveal === "stagger" ? Array.from(el.children) : el;
    gsap.fromTo(alvos, { y: 50, autoAlpha: 0 }, { y: 0, autoAlpha: 1, stagger: 0.1, ease: "power2.out", scrollTrigger: entrada(el) });
  });

  $$("[data-parallax]").forEach((el) => {
    const v = Number(el.dataset.parallax) || 10;
    gsap.fromTo(el, { yPercent: -v / 2 }, { yPercent: v / 2, ease: "none", scrollTrigger: { trigger: el.parentElement ?? el, start: "top bottom", end: "bottom top", scrub: true } });
  });

  // Contadores: contam até o valor ao entrar na tela (por tempo, para nunca parar no meio).
  $$("[data-count]").forEach((el) => {
    const alvo = Number(el.dataset.count);
    const dec = Number(el.dataset.decimais) || 0;
    const obj = { v: 0 };
    el.textContent = formatar(0, dec);
    gsap.to(obj, {
      v: alvo,
      duration: 1.8,
      ease: "power3.out",
      scrollTrigger: { trigger: el, start: "top 92%", toggleActions: "play none none reverse" },
      onUpdate: () => (el.textContent = formatar(obj.v, dec)),
    });
  });
}

// Faixas de texto: andam de lado com a rolagem e inclinam com a velocidade.
function faixas(limpezas: Limpezas) {
  const lista = $$("[data-kinetic]");
  lista.forEach((el) => {
    const dir = el.dataset.kinetic === "direita" ? 1 : -1;
    const forca = Number(el.dataset.forca) || 0.25;
    gsap.fromTo(
      el,
      { x: () => (dir > 0 ? -window.innerWidth * forca : 0) },
      {
        x: () => (dir > 0 ? 0 : -window.innerWidth * forca),
        ease: "none",
        scrollTrigger: { trigger: el.parentElement ?? el, start: "top bottom", end: "bottom top", scrub: 0.4, invalidateOnRefresh: true },
      },
    );
  });
  if (!lista.length) return;
  const inclinar = lista.map((el) => gsap.quickTo(el, "skewX", { duration: 0.5, ease: "power3.out" }));
  const st = ScrollTrigger.create({
    onUpdate: (self) => {
      const v = gsap.utils.clamp(-12, 12, self.getVelocity() / -240);
      inclinar.forEach((f) => f(v));
    },
  });
  const endireitar = () => inclinar.forEach((f) => f(0));
  ScrollTrigger.addEventListener("scrollEnd", endireitar);
  limpezas.push(() => {
    ScrollTrigger.removeEventListener("scrollEnd", endireitar);
    st.kill();
  });
}

// ---------- Abertura ----------
function hero() {
  const hero = $("[data-hero]");
  if (!hero) return;
  const st = { trigger: hero, start: "top top", end: "bottom top", scrub: true };
  gsap.to("[data-hero-r]", { yPercent: 20, rotate: -8, scale: 1.15, ease: "none", scrollTrigger: st });
  // As três linhas do título se separam para lados diferentes.
  $$("[data-hero-linha]", hero).forEach((l, i) => gsap.to(l, { xPercent: [-10, 8, -6][i] ?? 0, ease: "none", scrollTrigger: st }));
  gsap.to("[data-hero-sub]", { y: -70, autoAlpha: 0, ease: "none", scrollTrigger: { ...st, end: "bottom 35%" } });
  gsap.to("[data-hero-painel]", { yPercent: -28, rotateX: 8, ease: "none", scrollTrigger: st });
  $$("[data-hero-chip]", hero).forEach((c) => gsap.to(c, { y: -(Number(c.dataset.heroChip) || 80), ease: "none", scrollTrigger: st }));

  // A curva "realizado" continua de hoje até o fim do plano enquanto a página desce.
  const futuro = $<SVGPathElement>("[data-curva-futuro]", hero);
  const marco = $<SVGGElement>("[data-curva-marco]", hero);
  const clip = $<SVGRectElement>("[data-curva-clip]", hero);
  if (futuro && marco) {
    const total = futuro.getTotalLength();
    const obj = { p: 0 };
    gsap.set(futuro, { strokeDasharray: total, strokeDashoffset: total });
    gsap.to(obj, {
      p: 1,
      ease: "none",
      scrollTrigger: { trigger: hero, start: "top top", end: "bottom 30%", scrub: 0.5 },
      onUpdate: () => {
        const pt = futuro.getPointAtLength(total * obj.p);
        marco.setAttribute("transform", `translate(${pt.x} ${pt.y})`);
        futuro.style.strokeDashoffset = String(total * (1 - obj.p));
        clip?.setAttribute("width", String(pt.x + 8));
      },
    });
  }
}

// ---------- Números ----------
function numeros() {
  const sec = $("[data-numeros]");
  if (!sec) return;
  const st = { trigger: sec, start: "top 92%", end: "top 40%", scrub: 0.6 };
  gsap.fromTo($$("[data-numero]", sec), { y: 90, rotateX: -60, autoAlpha: 0, transformOrigin: "50% 100%" }, { y: 0, rotateX: 0, autoAlpha: 1, stagger: 0.12, ease: "power3.out", scrollTrigger: st });
  gsap.fromTo($$("[data-barra-v]", sec), { scaleY: 0 }, { scaleY: 1, stagger: 0.12, ease: "none", scrollTrigger: st });
}

// ---------- Abordagem: cronograma fixo ao lado, os três passos rolam e trocam o estado ----------
function abordagem({ desktop }: Cond) {
  const sec = $("[data-abordagem]");
  if (!sec) return;
  definirEstadoGantt("tradicional");
  const linha = desktop ? "55%" : "72%";
  $$("[data-estado-passo]", sec).forEach((li) =>
    ScrollTrigger.create({
      trigger: li,
      start: `top ${linha}`,
      end: `bottom ${linha}`,
      onToggle: (s) => s.isActive && definirEstadoGantt(li.dataset.estadoPasso ?? "reforce"),
    }),
  );
  const cartao = $("[data-gantt-cartao]", sec);
  if (cartao)
    gsap.fromTo(cartao, { rotateX: 22, y: 90, scale: 0.92, autoAlpha: 0.2 }, { rotateX: 0, y: 0, scale: 1, autoAlpha: 1, ease: "power2.out", scrollTrigger: entrada(cartao, "top 98%", "top 55%") });
  $$("[data-estado-passo] > *", sec).forEach((c, i) =>
    gsap.fromTo(c, { x: i % 2 ? 90 : -90, rotate: i % 2 ? 2 : -2, autoAlpha: 0 }, { x: 0, rotate: 0, autoAlpha: 1, ease: "power2.out", scrollTrigger: entrada(c, "top 95%", "top 62%") }),
  );
}

// ---------- Setores: a seção fixa e os cartões passam de lado (em qualquer tela) ----------
function setores(limpezas: Limpezas) {
  const sec = $("[data-setores]");
  const trilho = sec && $<HTMLElement>("[data-carrossel-trilho]", sec);
  if (!sec || !trilho) return;
  const cartoes = $$("[data-slide]", trilho);
  gsap.set(trilho, { overflow: "visible", scrollSnapType: "none", cursor: "auto" });
  const dist = () => sobra(trilho);
  // Cada cartão gira em 3D conforme a distância do centro da tela; a foto anda ao contrário (profundidade).
  const progressos = () => cartoes.map((c) => gsap.utils.clamp(0, 1, (c.offsetLeft - cartoes[0].offsetLeft) / (dist() || 1)));
  let marcos = progressos();
  const efeito = (p = 0) => {
    const meio = window.innerWidth / 2;
    cartoes.forEach((c) => {
      const r = c.getBoundingClientRect();
      const o = gsap.utils.clamp(-1.5, 1.5, (r.left + r.width / 2 - meio) / window.innerWidth);
      gsap.set(c, { rotateY: o * -24, z: -Math.abs(o) * 160, transformPerspective: 1300 });
      const img = $("[data-slide-img]", c);
      if (img) gsap.set(img, { xPercent: o * -14 });
    });
    // Cartão ativo: o marco de rolagem mais próximo do ponto atual (o primeiro no início, o último no fim).
    let ativo = 0;
    marcos.forEach((m, i) => Math.abs(m - p) < Math.abs(marcos[ativo] - p) && (ativo = i));
    marcarSlide(sec, ativo);
  };
  gsap.to(trilho, {
    x: () => -dist(),
    ease: "none",
    scrollTrigger: {
      trigger: sec,
      start: "top top",
      end: () => `+=${dist() * 1.15}`,
      pin: true,
      anticipatePin: 1,
      scrub: 0.6,
      invalidateOnRefresh: true,
      onUpdate: (s) => efeito(s.progress),
      onRefresh: (s) => {
        marcos = progressos();
        guardarPin(sec, s, marcos);
        efeito(s.progress);
      },
    },
  });
  // Os cartões chegam em leque antes da fixação.
  gsap.fromTo(cartoes, { y: (i) => 60 + i * 30, rotate: (i) => 4 + i }, { y: 0, rotate: 0, ease: "power2.out", stagger: 0.05, scrollTrigger: { trigger: sec, start: "top 85%", end: "top top", scrub: 0.6 } });
  limpezas.push(() => soltarPin(sec));
}

// ---------- Atuações: a seção (ou, no celular, o carrossel) fixa e as atuações deslizam com a rolagem ----------
function atuacoes({ fixar }: Cond, limpezas: Limpezas) {
  const sec = $("[data-atuacoes]");
  const trilho = sec && $<HTMLElement>("[data-carrossel-trilho]", sec);
  if (!sec || !trilho) return;
  const slides = $$("[data-slide]", trilho);
  const n = slides.length;
  const coluna = trilho.parentElement as HTMLElement;
  // No celular e no tablet fixa só a coluna do carrossel, quando ela cabe inteira na tela.
  const cabe = coluna.offsetHeight <= window.innerHeight - 24;
  if ((fixar || cabe) && n > 1) {
    gsap.set(trilho, { overflow: "visible", scrollSnapType: "none", cursor: "auto" });
    const posicao = (i: number) => -(slides[i].offsetLeft - slides[0].offsetLeft);
    const efeito = () => {
      const base = coluna.getBoundingClientRect();
      slides.forEach((s) => {
        const r = s.getBoundingClientRect();
        const o = gsap.utils.clamp(-1.2, 1.2, (r.left - base.left) / base.width);
        gsap.set(s, { autoAlpha: 1 - Math.min(0.75, Math.abs(o) * 0.7), scale: 1 - Math.abs(o) * 0.09, rotateY: o * -14, transformPerspective: 1400, transformOrigin: o < 0 ? "100% 50%" : "0% 50%" });
      });
    };
    // Linha do tempo com pausas: cada atuação fica parada um trecho da rolagem e desliza rápido para a
    // próxima. Assim o cartão nunca para no meio do caminho (sem "snap", que disputaria com a rolagem suave).
    const PAUSA = 0.7;
    const marcos: number[] = [0];
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: fixar ? sec : coluna,
        start: fixar ? "top top" : "center center",
        end: () => `+=${window.innerHeight * (n - 1) * (fixar ? 0.95 : 0.75)}`,
        pin: true,
        anticipatePin: 1,
        scrub: 0.6,
        invalidateOnRefresh: true,
        onUpdate: () => {
          efeito();
          const t = tl.time();
          let ativo = 0;
          marcos.forEach((m, i) => Math.abs(m - t) < Math.abs(marcos[ativo] - t) && (ativo = i));
          marcarSlide(sec, ativo);
        },
        onRefresh: (s) => {
          if (tl.duration()) guardarPin(sec, s, marcos.map((m) => m / tl.duration()));
          efeito();
        },
      },
    });
    tl.to({}, { duration: PAUSA * 0.6 });
    for (let i = 1; i < n; i++) {
      tl.to(trilho, { x: () => posicao(i), duration: 1, ease: "power2.inOut" });
      marcos.push(tl.duration());
      tl.to({}, { duration: i === n - 1 ? PAUSA * 0.6 : PAUSA });
    }
    if (tl.scrollTrigger) guardarPin(sec, tl.scrollTrigger, marcos.map((m) => m / tl.duration()));
    limpezas.push(() => soltarPin(sec));
  } else {
    // Celular e tablet: carrossel de arrastar; os cartões chegam de lado, um atrás do outro.
    gsap.fromTo(slides, { x: 160, rotate: 4, autoAlpha: 0 }, { x: 0, rotate: 0, autoAlpha: 1, stagger: 0.08, ease: "power2.out", scrollTrigger: entrada(trilho, "top 95%", "top 55%") });
  }
  gsap.fromTo($$("[data-carrossel-ir]", sec), { x: -50, autoAlpha: 0 }, { x: 0, autoAlpha: 1, stagger: 0.06, ease: "power2.out", scrollTrigger: entrada(sec, "top 85%", "top 35%") });
}

// ---------- Método: a linha da jornada atravessa a tela e cada fase sobe quando a linha chega ----------
function metodo({ fixar }: Cond) {
  const sec = $("[data-metodo]");
  if (!sec) return;
  const linha = $("[data-metodo-linha]", sec);
  const fases = $$("[data-fase]", sec);
  const numero = $("[data-metodo-numero]", sec);
  const horizontal = matchMedia("(min-width: 1024px)").matches;
  const marcar = (p: number) => {
    let atual = 0;
    fases.forEach((f, i) => {
      const ativa = p >= (horizontal ? i / fases.length + 0.05 : i / fases.length);
      f.dataset.ativa = String(ativa);
      if (ativa) atual = i;
    });
    if (numero) numero.textContent = String(atual + 1).padStart(2, "0");
  };
  if (fixar && horizontal) {
    const tl = gsap.timeline({ scrollTrigger: { trigger: sec, start: "top top", end: "+=150%", pin: true, anticipatePin: 1, scrub: 0.6, onUpdate: (s) => marcar(s.progress) } });
    if (linha) tl.fromTo(linha, { scaleX: 0 }, { scaleX: 1, ease: "none", duration: 1 }, 0);
    fases.forEach((f, i) =>
      tl.fromTo($("[data-fase-cartao]", f), { y: 160, rotateX: 60, autoAlpha: 0, transformPerspective: 1000 }, { y: 0, rotateX: 0, autoAlpha: 1, ease: "power2.out", duration: 0.2 }, 0.02 + i * 0.24),
    );
    return;
  }
  if (linha)
    gsap.fromTo(linha, horizontal ? { scaleX: 0 } : { scaleY: 0 }, {
      ...(horizontal ? { scaleX: 1 } : { scaleY: 1 }),
      ease: "none",
      scrollTrigger: { trigger: $("ol", sec), start: "top 75%", end: "bottom 55%", scrub: 0.5, onUpdate: (s) => marcar(s.progress) },
    });
  fases.forEach((f, i) =>
    gsap.fromTo($("[data-fase-cartao]", f), { x: i % 2 ? 90 : -40, rotate: i % 2 ? 3 : -3, autoAlpha: 0 }, { x: 0, rotate: 0, autoAlpha: 1, ease: "power2.out", scrollTrigger: entrada(f, "top 95%", "top 60%") }),
  );
}

// ---------- Tecnologia: as telas deitadas levantam em 3D; os números voam para os lados ----------
function tecnologia() {
  $$("[data-painel]").forEach((p, i) => {
    const lado = i % 2 ? 1 : -1;
    const moldura = $("[data-painel-moldura]", p);
    if (moldura)
      gsap.fromTo(
        moldura,
        { rotateX: 38, rotateY: lado * -20, scale: 0.74, yPercent: 22, autoAlpha: 0.15, transformPerspective: 1400 },
        { rotateX: 0, rotateY: 0, scale: 1, yPercent: 0, autoAlpha: 1, ease: "power2.out", scrollTrigger: { trigger: p, start: "top 95%", end: "center 55%", scrub: 0.7 } },
      );
    gsap.fromTo(
      $$("[data-chip]", p),
      { x: (j) => (j % 2 ? 180 : -180), y: 40, scale: 0.6, autoAlpha: 0 },
      { x: 0, y: 0, scale: 1, autoAlpha: 1, stagger: 0.15, ease: "back.out(1.6)", scrollTrigger: { trigger: p, start: "top 70%", end: "center 50%", scrub: 0.6 } },
    );
    const texto = $("[data-painel-texto]", p);
    if (texto) gsap.fromTo(texto, { x: lado * 100, autoAlpha: 0 }, { x: 0, autoAlpha: 1, ease: "power2.out", scrollTrigger: entrada(p, "top 85%", "top 45%") });
  });
  const recursos = $("[data-recursos]");
  if (recursos)
    gsap.fromTo(
      $$("[data-recurso]", recursos),
      { x: () => window.innerWidth * 0.45, rotate: 6, autoAlpha: 0 },
      { x: 0, rotate: 0, autoAlpha: 1, stagger: 0.12, ease: "power2.out", scrollTrigger: { trigger: recursos, start: "top 98%", end: "top 55%", scrub: 0.7, invalidateOnRefresh: true } },
    );
}

// ---------- Campo: duas fileiras de fotos andam em sentidos opostos ----------
function campo() {
  const sec = $("[data-campo]");
  if (!sec) return;
  $$("[data-campo-linha]", sec).forEach((l) => {
    gsap.set(l, { overflow: "visible", scrollSnapType: "none", cursor: "auto" });
    const esquerda = l.dataset.campoLinha === "esquerda";
    const dist = () => sobra(l) + window.innerWidth * 0.08;
    gsap.fromTo(
      l,
      { x: () => (esquerda ? window.innerWidth * 0.08 : -dist()) },
      { x: () => (esquerda ? -dist() : window.innerWidth * 0.08), ease: "none", scrollTrigger: { trigger: l, start: "top bottom", end: "bottom top", scrub: 0.6, invalidateOnRefresh: true } },
    );
  });
  $$("[data-campo-foto]", sec).forEach((f) => {
    gsap.fromTo(f, { clipPath: "inset(14% 10% 14% 10% round 1.5rem)" }, { clipPath: "inset(0% 0% 0% 0% round 1.5rem)", ease: "none", scrollTrigger: { trigger: f, start: "top bottom", end: "center 55%", scrub: true } });
    const img = $("img", f);
    if (img) gsap.fromTo(img, { scale: 1.35 }, { scale: 1, ease: "none", scrollTrigger: { trigger: f, start: "top bottom", end: "bottom 30%", scrub: true } });
  });
}

// ---------- Cases ----------
function cases({ desktop }: Cond) {
  const casos = $$("[data-case]");
  if (desktop) {
    // O cartão de baixo cobre o de cima, que encolhe e escurece.
    casos.forEach((c, i) => {
      const prox = casos[i + 1];
      if (!prox) return;
      const st = { trigger: prox, start: "top bottom", end: "top 15%", scrub: true };
      gsap.to(c, { scale: 0.9, ease: "none", scrollTrigger: st });
      const sombra = $("[data-case-sombra]", c);
      if (sombra) gsap.fromTo(sombra, { opacity: 0 }, { opacity: 0.6, ease: "none", scrollTrigger: st });
    });
  } else {
    casos.forEach((c, i) =>
      gsap.fromTo(c, { x: i % 2 ? -90 : 90, rotate: i % 2 ? -3 : 3, autoAlpha: 0 }, { x: 0, rotate: 0, autoAlpha: 1, ease: "power2.out", scrollTrigger: entrada(c, "top 98%", "top 60%") }),
    );
  }
  casos.forEach((c) => {
    const itens = $$("[data-case-item]", c);
    if (itens.length) gsap.fromTo(itens, { y: 40, autoAlpha: 0 }, { y: 0, autoAlpha: 1, stagger: 0.1, ease: "power2.out", scrollTrigger: entrada(c, "top 80%", "top 30%") });
  });

  const partes = $$("[data-valor-parte]");
  if (partes.length)
    gsap.fromTo(partes, { scaleX: 0 }, { scaleX: 1, stagger: 0.3, ease: "power3.out", scrollTrigger: entrada(partes[0].parentElement!, "top 92%", "top 55%") });
  const total = $("[data-valor-total]");
  if (total) gsap.fromTo(total, { scale: 0.6, autoAlpha: 0, transformOrigin: "100% 100%" }, { scale: 1, autoAlpha: 1, ease: "power3.out", scrollTrigger: entrada(total, "top 95%", "top 60%") });

  // Projetos em leque: saem do centro empilhados e se abrem.
  const projs = $$("[data-projeto]");
  if (projs.length) {
    if (desktop)
      gsap.fromTo(
        projs,
        { xPercent: (i) => [105, 0, -105][i] ?? 0, rotate: (i) => [-9, 0, 9][i] ?? 0, y: 80, scale: 0.88 },
        { xPercent: 0, rotate: 0, y: 0, scale: 1, ease: "power2.out", scrollTrigger: { trigger: projs[0].parentElement, start: "top 92%", end: "top 35%", scrub: 0.7 } },
      );
    else projs.forEach((p, i) => gsap.fromTo(p, { x: i % 2 ? -90 : 90, autoAlpha: 0 }, { x: 0, autoAlpha: 1, ease: "power2.out", scrollTrigger: entrada(p) }));
  }
  $$("[data-barra-proporcao]").forEach((b) => gsap.fromTo(b, { scaleX: 0 }, { scaleX: 1, ease: "power2.out", scrollTrigger: entrada(b, "top 95%", "top 65%") }));
}

// ---------- Presença: o mapa levanta, os estados acendem um a um e as rotas se desenham ----------
function presenca({ fixar }: Cond) {
  const sec = $("[data-presenca]");
  const fig = sec && $("figure", sec);
  if (!sec || !fig) return;
  const ordem = ["rs", "sp", "rj", "mg", "am"];
  const estados = ordem.map((uf) => $<SVGPathElement>(`path[data-uf="${uf}"]`, sec)).filter(Boolean) as SVGPathElement[];
  const botoes = ordem.map((uf) => $(`[data-estado-mapa="${uf}"]`, sec));
  const rotas = $$<SVGPathElement>("[data-rota]", sec);
  const pinos = $$<SVGGElement>("[data-pino]", sec);
  const inicioEstados = 0.45;
  const passo = 0.32;
  const tl = gsap.timeline({
    scrollTrigger: fixar
      ? { trigger: sec, start: "top top", end: "+=140%", pin: true, anticipatePin: 1, scrub: 0.6, onUpdate: () => acender() }
      : { trigger: fig, start: "top 85%", end: "bottom 55%", scrub: 0.6, onUpdate: () => acender() },
  });
  const acender = () => botoes.forEach((b, i) => b?.classList.toggle("is-aceso", tl.time() >= inicioEstados + i * passo));
  tl.fromTo($("svg", fig), { rotateX: 32, scale: 0.86, autoAlpha: 0.35, transformPerspective: 1200 }, { rotateX: 0, scale: 1, autoAlpha: 1, ease: "power2.out", duration: 0.6 }, 0);
  estados.forEach((e, i) => tl.fromTo(e, { fillOpacity: 0.06 }, { fillOpacity: 1, duration: 0.3, ease: "none" }, inicioEstados + i * passo));
  tl.fromTo(pinos, { scale: 0 }, { scale: 1, svgOrigin: "0 0", ease: "back.out(2.4)", stagger: 0.15, duration: 0.3 }, inicioEstados + ordem.length * passo);
  gsap.set(rotas, { strokeDasharray: 1, strokeDashoffset: 1 });
  tl.to(rotas, { strokeDashoffset: 0, stagger: 0.1, duration: 0.5, ease: "power1.inOut" }, inicioEstados + ordem.length * passo + 0.2);
  tl.fromTo($$("[data-presenca-dado]", sec), { y: 40, autoAlpha: 0 }, { y: 0, autoAlpha: 1, stagger: 0.1, duration: 0.3 }, 0.1);
}

// ---------- Diferenciais: os cartões entram pela direita e a seta gira até apontar ----------
function diferenciais() {
  $$("[data-diferencial]").forEach((d) => {
    const st = { trigger: d, start: "top 98%", end: "top 62%", scrub: 0.6 };
    gsap.fromTo(d, { x: () => window.innerWidth * 0.35, rotate: 5, autoAlpha: 0 }, { x: 0, rotate: 0, autoAlpha: 1, ease: "power3.out", scrollTrigger: { ...st, invalidateOnRefresh: true } });
    const selo = $(".selo-seta", d);
    if (selo) gsap.fromTo(selo, { rotate: -180, scale: 0.5 }, { rotate: 0, scale: 1, ease: "power2.out", scrollTrigger: st });
  });
}

// ---------- Equipe ----------
function equipe(limpezas: Limpezas) {
  $$("[data-lider]").forEach((l, i) => {
    gsap.fromTo(l, { clipPath: "inset(40% 0% 0% 0% round 1.75rem)", y: 120 + i * 40 }, { clipPath: "inset(0% 0% 0% 0% round 1.75rem)", y: 0, ease: "power2.out", scrollTrigger: entrada(l, "top 100%", "top 55%") });
    const img = $("img", l);
    if (img) gsap.fromTo(img, { scale: 1.12, transformOrigin: "50% 35%" }, { scale: 1, ease: "none", scrollTrigger: { trigger: l, start: "top bottom", end: "bottom 40%", scrub: true } });
  });
  // Colunas da equipe em velocidades diferentes (paralaxe por coluna).
  const grade = $("[data-equipe-grade]");
  if (grade) {
    const pessoas = $$("[data-pessoa]", grade);
    const coluna = (el: HTMLElement) => {
      const xs = [...new Set(pessoas.filter((p) => !p.hidden).map((p) => p.offsetLeft))].sort((a, b) => a - b);
      return Math.max(0, xs.indexOf(el.offsetLeft));
    };
    gsap.fromTo(
      pessoas,
      { y: (_, el) => [140, 60, 190, 90, 220, 120][coluna(el as HTMLElement) % 6], autoAlpha: 0.2 },
      { y: 0, autoAlpha: 1, ease: "none", scrollTrigger: { trigger: grade, start: "top bottom", end: "bottom 75%", scrub: 0.6, invalidateOnRefresh: true } },
    );
    const refazer = () => ScrollTrigger.refresh();
    window.addEventListener("reforce:layout", refazer);
    limpezas.push(() => window.removeEventListener("reforce:layout", refazer));
  }
}

// ---------- Valores: a linha se desenha, o número entra pela esquerda e o texto pela direita ----------
function valores() {
  $$("[data-valor-linha]").forEach((li) => {
    const tl = gsap.timeline({ scrollTrigger: entrada(li, "top 95%", "top 60%") });
    tl.fromTo($("[data-valor-borda]", li), { scaleX: 0 }, { scaleX: 1, ease: "none", duration: 1 }, 0);
    tl.fromTo($("[data-valor-num]", li), { x: -80, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 0.8 }, 0.1);
    tl.fromTo($("[data-valor-texto]", li), { x: 120, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 0.8 }, 0.2);
  });
  const r = $("[data-valores-r]");
  if (r) gsap.fromTo(r, { rotate: -14, yPercent: -12 }, { rotate: 10, yPercent: 14, ease: "none", scrollTrigger: { trigger: r.parentElement, start: "top bottom", end: "bottom top", scrub: true } });
}

// ---------- Contato e rodapé ----------
function contato() {
  const form = $("[data-form-cartao]");
  if (form) gsap.fromTo(form, { rotateX: 24, y: 140, scale: 0.94, autoAlpha: 0.2, transformPerspective: 1300 }, { rotateX: 0, y: 0, scale: 1, autoAlpha: 1, ease: "power2.out", scrollTrigger: entrada(form, "top 100%", "top 50%") });
  const rede = $("[data-contato-rede]");
  if (rede) gsap.fromTo(rede, { rotate: -12, scale: 0.85 }, { rotate: 8, scale: 1.1, ease: "none", scrollTrigger: { trigger: rede.parentElement, start: "top bottom", end: "bottom top", scrub: true } });
  $$("[data-contato-canal]").forEach((c, i) => gsap.fromTo(c, { x: -70, autoAlpha: 0 }, { x: 0, autoAlpha: 1, ease: "power2.out", scrollTrigger: entrada(c, `top ${96 - i * 2}%`, "top 70%") }));
  const logo = $("[data-rodape-logo]");
  if (logo) gsap.fromTo(logo, { yPercent: 70, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, ease: "none", scrollTrigger: { trigger: logo, start: "top bottom", end: "bottom bottom", scrub: 0.5 } });
}

/** Liga todas as animações. Devolve a limpeza. */
export function iniciarAnimacoes() {
  const mm = gsap.matchMedia();
  mm.add(
    {
      motion: "(prefers-reduced-motion: no-preference)",
      desktop: "(min-width: 1024px)",
      alto: "(min-height: 640px)",
      mouse: "(hover: hover) and (pointer: fine)",
    },
    (ctx) => {
      const c = ctx.conditions as Record<string, boolean>;
      if (!c.motion) return;
      const cond: Cond = { desktop: c.desktop, fixar: c.desktop && c.alto, mouse: c.mouse };
      const limpezas: Limpezas = [];
      document.documentElement.classList.add("js-motion");

      // Na ordem da página: as fixações empurram o que vem depois.
      geral();
      hero();
      numeros();
      abordagem(cond);
      setores(limpezas);
      atuacoes(cond, limpezas);
      metodo(cond);
      tecnologia();
      campo();
      cases(cond);
      presenca(cond);
      diferenciais();
      equipe(limpezas);
      valores();
      contato();
      faixas(limpezas);

      const refrescar = () => ScrollTrigger.refresh();
      document.fonts?.ready.then(refrescar);
      window.addEventListener("load", refrescar);

      return () => {
        window.removeEventListener("load", refrescar);
        limpezas.forEach((f) => f());
        document.documentElement.classList.remove("js-motion");
      };
    },
  );
  return () => mm.revert();
}
