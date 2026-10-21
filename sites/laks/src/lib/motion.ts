import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger);

const $$ = <T extends HTMLElement = HTMLElement>(sel: string, root: ParentNode = document) =>
  Array.from(root.querySelectorAll<T>(sel));

// Toda a coreografia de rolagem da home, em JavaScript puro (usada pelo componente Motion e pela
// prévia em arquivo único). As seções marcam o que anima com atributos data-*; sem JavaScript,
// ou com "reduzir movimento", o conteúdo aparece completo.

/** Rolagem suave (Lenis) sincronizada com o ScrollTrigger. Devolve a função de limpeza. */
export function iniciarRolagemSuave() {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return () => {};
  const lenis = new Lenis({ lerp: 0.11, anchors: { offset: -72 }, allowNestedScroll: true });
  lenis.on("scroll", ScrollTrigger.update);
  const tick = (time: number) => lenis.raf(time * 1000);
  gsap.ticker.add(tick);
  gsap.ticker.lagSmoothing(0);
  return () => {
    gsap.ticker.remove(tick);
    lenis.destroy();
  };
}

/** Animações de rolagem (GSAP + ScrollTrigger). Devolve a função de limpeza. */
export function iniciarAnimacoes() {
  const mm = gsap.matchMedia();

  mm.add(
    {
      motion: "(prefers-reduced-motion: no-preference)",
      reduce: "(prefers-reduced-motion: reduce)",
      desktop: "(min-width: 768px)",
    },
    (ctx) => {
      const { reduce, desktop } = ctx.conditions as { motion: boolean; reduce: boolean; desktop: boolean };

      if (reduce) {
        $$("[data-check]").forEach((el) => el.classList.add("is-checked"));
        return;
      }

      const root = document.documentElement;
      root.classList.add("js-motion");

      // Hero: a foto aproxima e o texto sobe enquanto a página rola; cubos em profundidades diferentes.
      const hero = document.querySelector("[data-hero]");
      if (hero) {
        const st = { trigger: hero, start: "top top", end: "bottom top", scrub: true };
        gsap.to("[data-hero-media]", { scale: 1.18, yPercent: 10, ease: "none", scrollTrigger: st });
        gsap.to("[data-hero-content]", { yPercent: -18, autoAlpha: 0, ease: "none", scrollTrigger: { ...st, end: "bottom 15%" } });
        $$("[data-depth]").forEach((el) => {
          const d = Number(el.dataset.depth) || 0.5;
          gsap.to(el, { y: () => -window.innerHeight * d * 0.7, rotate: d * 14, ease: "none", scrollTrigger: st });
        });
      }

      // Entradas genéricas.
      $$("[data-reveal]").forEach((el) => {
        const alvos = el.dataset.reveal === "stagger" ? Array.from(el.children) : el;
        gsap.from(alvos, {
          y: 48,
          autoAlpha: 0,
          duration: 1.1,
          stagger: 0.09,
          ease: "expo.out",
          scrollTrigger: { trigger: el, start: "top 86%", once: true },
        });
      });

      // Paralaxe de fundos.
      $$("[data-parallax]").forEach((el) => {
        const v = Number(el.dataset.parallax) || 10;
        gsap.fromTo(
          el,
          { yPercent: -v / 2 },
          {
            yPercent: v / 2,
            ease: "none",
            scrollTrigger: { trigger: el.closest("section") ?? el, start: "top bottom", end: "bottom top", scrub: true },
          },
        );
      });

      // Brilho laranja nasce como um "sol" ao entrar na tela.
      $$("[data-glow]").forEach((el) => {
        gsap.fromTo(
          el,
          { scaleX: 0.55, autoAlpha: 0 },
          {
            scaleX: 1,
            autoAlpha: Number(getComputedStyle(el).opacity) || 1,
            ease: "none",
            scrollTrigger: { trigger: el.closest("section") ?? el, start: "top 95%", end: "top 25%", scrub: true },
          },
        );
      });

      // Contadores.
      $$("[data-count]").forEach((el) => {
        const alvo = Number(el.dataset.count);
        const obj = { v: 0 };
        el.textContent = "0";
        gsap.to(obj, {
          v: alvo,
          duration: 2.2,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 90%", once: true },
          onUpdate: () => {
            el.textContent = Math.round(obj.v).toLocaleString("pt-BR");
          },
        });
      });

      // Manifesto: cada palavra acende com a rolagem.
      const manifesto = document.querySelector("[data-manifesto]");
      if (manifesto) {
        const palavras = $$(".manifesto-w", manifesto);
        gsap.fromTo(
          palavras,
          { opacity: 0.4 },
          {
            opacity: 1,
            stagger: 0.12,
            ease: "none",
            scrollTrigger: { trigger: palavras[0]?.parentElement ?? manifesto, start: "top 78%", end: "bottom 42%", scrub: true },
          },
        );
        gsap.from("[data-virada]", {
          yPercent: 60,
          autoAlpha: 0,
          ease: "none",
          scrollTrigger: { trigger: "[data-virada]", start: "top 95%", end: "top 60%", scrub: true },
        });
      }

      // Método MAPA: título revela da esquerda; etapas acendem e o indicador acompanha.
      const mapa = document.querySelector("[data-mapa]");
      if (mapa) {
        gsap.fromTo(
          "[data-mapa-titulo]",
          { clipPath: "inset(0 100% 0 0)" },
          {
            clipPath: "inset(0 0% 0 0)",
            duration: 1.6,
            ease: "expo.inOut",
            scrollTrigger: { trigger: "[data-mapa-titulo]", start: "top 85%", once: true },
          },
        );
        const passos = $$("[data-mapa-passo]", mapa);
        const chips = $$("[data-mapa-chip]", mapa);
        passos.forEach((passo, i) => {
          const card = passo.firstElementChild;
          gsap.fromTo(
            card,
            { autoAlpha: 0.25, y: 60, scale: 0.96 },
            {
              autoAlpha: 1,
              y: 0,
              scale: 1,
              ease: "none",
              scrollTrigger: { trigger: passo, start: "top 92%", end: desktop ? "center 55%" : "top 55%", scrub: true },
            },
          );
          ScrollTrigger.create({
            trigger: passo,
            start: "top center",
            end: "bottom center",
            onToggle: (self) => {
              if (self.isActive) chips.forEach((c, j) => (c.dataset.ativo = String(j === i)));
            },
          });
        });
        if (passos.length) {
          gsap.to("[data-mapa-progresso]", {
            scaleX: 1,
            ease: "none",
            scrollTrigger: { trigger: passos[0].parentElement, start: "top center", end: "bottom center", scrub: true },
          });
        }
      }

      // Cases: no desktop a seção fixa e os depoimentos correm na horizontal.
      const track = document.querySelector<HTMLElement>("[data-cases-track]");
      if (track && desktop) {
        track.dataset.pinned = "true";
        const distancia = () => Math.max(0, track.scrollWidth - window.innerWidth);
        gsap.to(track, {
          x: () => -distancia(),
          ease: "none",
          scrollTrigger: {
            trigger: "[data-cases-pin]",
            start: "top top",
            end: () => `+=${distancia()}`,
            pin: true,
            scrub: 1,
            anticipatePin: 1,
            invalidateOnRefresh: true,
          },
        });
      }

      // Polaroid da equipe "cai" e balança até assentar.
      gsap.fromTo(
        "[data-polaroid]",
        { rotate: -16, y: -80, autoAlpha: 0 },
        {
          rotate: 0,
          y: 0,
          autoAlpha: 1,
          duration: 1.8,
          ease: "elastic.out(1, 0.45)",
          scrollTrigger: { trigger: "[data-polaroid]", start: "top 82%", once: true },
        },
      );

      gsap.from("[data-proposito]", {
        xPercent: -12,
        autoAlpha: 0,
        duration: 1.2,
        stagger: 0.14,
        ease: "expo.out",
        scrollTrigger: { trigger: "[data-proposito]", start: "top 85%", once: true },
      });

      // Checklist marca item a item.
      $$("[data-check]").forEach((el) => {
        ScrollTrigger.create({
          trigger: el,
          start: "top 72%",
          onEnter: () => el.classList.add("is-checked"),
          onLeaveBack: () => el.classList.remove("is-checked"),
        });
      });

      return () => {
        root.classList.remove("js-motion");
        if (track) delete track.dataset.pinned;
      };
    },
  );

  // Fontes e imagens mudam alturas: recalcula os gatilhos quando terminarem de carregar.
  document.fonts?.ready.then(() => ScrollTrigger.refresh());
  const onLoad = () => ScrollTrigger.refresh();
  window.addEventListener("load", onLoad);
  return () => {
    window.removeEventListener("load", onLoad);
    mm.revert();
  };
}
