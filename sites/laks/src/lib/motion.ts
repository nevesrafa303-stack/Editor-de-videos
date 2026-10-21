import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger, SplitText);

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

/** Animações de rolagem (GSAP + ScrollTrigger + SplitText). Devolve a função de limpeza. */
export function iniciarAnimacoes() {
  const mm = gsap.matchMedia();

  mm.add(
    {
      motion: "(prefers-reduced-motion: no-preference)",
      reduce: "(prefers-reduced-motion: reduce)",
      desktop: "(min-width: 1024px)",
      tablet: "(min-width: 768px)",
      mouse: "(hover: hover) and (pointer: fine)",
    },
    (ctx) => {
      const { reduce, desktop, tablet, mouse } = ctx.conditions as Record<string, boolean>;
      const limpezas: (() => void)[] = [];

      if (reduce) {
        $$("[data-check]").forEach((el) => el.classList.add("is-checked"));
        return;
      }

      const root = document.documentElement;
      root.classList.add("js-motion");

      // Hero: a foto aproxima e o texto sobe enquanto a página rola; cubos em profundidades diferentes.
      const hero = document.querySelector<HTMLElement>("[data-hero]");
      const cubos = $$("[data-depth]");
      if (hero) {
        const st = { trigger: hero, start: "top top", end: "bottom top", scrub: true };
        gsap.to("[data-hero-media]", { scale: 1.18, yPercent: 10, ease: "none", scrollTrigger: st });
        gsap.to("[data-hero-content]", { yPercent: -18, autoAlpha: 0, ease: "none", scrollTrigger: { ...st, end: "bottom 15%" } });
        cubos.forEach((el) => {
          const d = Number(el.dataset.depth) || 0.5;
          gsap.to(el, { y: () => -window.innerHeight * d * 0.7, rotate: d * 14, ease: "none", scrollTrigger: st });
        });
        // No desktop os cubos também acompanham o mouse, cada um na sua profundidade.
        if (mouse) {
          const moverCubos = cubos.map((el) => {
            const d = Number(el.dataset.depth) || 0.5;
            const x = gsap.quickTo(el, "xPercent", { duration: 1.2, ease: "power3.out" });
            const y = gsap.quickTo(el, "yPercent", { duration: 1.2, ease: "power3.out" });
            return (nx: number, ny: number) => (x(nx * d * 14), y(ny * d * 14));
          });
          const onMove = (e: PointerEvent) => {
            const nx = (e.clientX / window.innerWidth) * 2 - 1;
            const ny = (e.clientY / window.innerHeight) * 2 - 1;
            moverCubos.forEach((f) => f(nx, ny));
          };
          hero.addEventListener("pointermove", onMove);
          limpezas.push(() => hero.removeEventListener("pointermove", onMove));
        }
      }

      // Títulos entram linha a linha, saindo de uma máscara.
      $$("[data-split]").forEach((el) => {
        SplitText.create(el, {
          type: "lines",
          mask: "lines",
          autoSplit: true,
          onSplit: (self) =>
            gsap.from(self.lines, {
              yPercent: 115,
              duration: 1.15,
              stagger: 0.09,
              ease: "expo.out",
              scrollTrigger: { trigger: el, start: "top 88%", once: true },
            }),
        });
      });

      // Entradas genéricas.
      $$("[data-reveal]").forEach((el) => {
        const alvos = el.dataset.reveal === "stagger" ? Array.from(el.children) : el;
        gsap.from(alvos, {
          y: 40,
          autoAlpha: 0,
          duration: 1.1,
          stagger: 0.09,
          ease: "expo.out",
          scrollTrigger: { trigger: el, start: "top 88%", once: true },
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
          scrollTrigger: { trigger: el, start: "top 92%", once: true },
          onUpdate: () => {
            el.textContent = Math.round(obj.v).toLocaleString("pt-BR");
          },
        });
      });

      // Manifesto: a tela segura e as palavras acendem uma a uma; a virada entra no fim.
      const manifesto = document.querySelector("[data-manifesto]");
      if (manifesto) {
        const palavras = $$(".manifesto-w", manifesto);
        gsap
          .timeline({
            scrollTrigger: {
              trigger: "[data-manifesto-pin]",
              start: "top top",
              end: "+=150%",
              pin: true,
              scrub: 0.6,
              anticipatePin: 1,
            },
          })
          .fromTo(palavras, { opacity: 0.4 }, { opacity: 1, stagger: 0.1, duration: 0.1, ease: "none" })
          .from("[data-virada]", { yPercent: 50, autoAlpha: 0, duration: 0.5, ease: "power2.out" }, ">-0.05")
          .to({}, { duration: 0.3 });
      }

      // Faixas de texto grande: andam em sentidos opostos com a rolagem.
      $$("[data-kinetic]").forEach((el) => {
        const dir = el.dataset.kinetic === "direita" ? 1 : -1;
        const forca = Number(el.dataset.forca) || 0.18;
        gsap.fromTo(
          el,
          { x: () => -dir * window.innerWidth * forca },
          {
            x: () => dir * window.innerWidth * forca,
            ease: "none",
            scrollTrigger: { trigger: el.closest("section") ?? el, start: "top bottom", end: "bottom top", scrub: 0.4, invalidateOnRefresh: true },
          },
        );
      });

      // Método MAPA: o título revela da esquerda e as etapas se empilham; a de baixo recua e escurece.
      const mapa = document.querySelector<HTMLElement>("[data-mapa]");
      const pilha = mapa?.querySelector<HTMLElement>("[data-mapa-pilha]");
      if (mapa && pilha) {
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
        pilha.dataset.pilha = "true";
        limpezas.push(() => delete pilha.dataset.pilha);
        const cartoes = $$("[data-mapa-cartao] > article", pilha);
        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: desktop ? mapa : pilha,
            start: desktop ? "top top" : "top 16%",
            end: () => `+=${(cartoes.length - 1) * window.innerHeight * 0.7}`,
            pin: true,
            scrub: 0.6,
            anticipatePin: 1,
            invalidateOnRefresh: true,
          },
        });
        cartoes.forEach((card, i) => {
          if (i === 0) return;
          const anterior = cartoes[i - 1];
          tl.fromTo(card, { yPercent: 115 }, { yPercent: 0, duration: 1 }, i - 1)
            .to(anterior, { scale: 0.92, yPercent: -4, duration: 1 }, i - 1)
            .to(anterior.querySelector("[data-mapa-sombra]"), { opacity: 0.6, duration: 1 }, i - 1);
        });
      }

      // Cases: a seção fixa e os depoimentos correm na horizontal; a barra mostra o progresso.
      const track = document.querySelector<HTMLElement>("[data-cases-track]");
      if (track && desktop) {
        track.dataset.pinned = "true";
        const barra = document.querySelector<HTMLElement>("[data-cases-progresso]");
        const distancia = () => Math.max(0, track.scrollWidth - track.clientWidth);
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
            onUpdate: (self) => barra && gsap.set(barra, { scaleX: self.progress }),
          },
        });
      }

      // Foto do fundador: abre de um quadro recortado até a largura total.
      const expande = document.querySelector<HTMLElement>("[data-expand]");
      if (expande) {
        const st = { trigger: expande, start: "top 90%", end: "top 10%", scrub: true };
        gsap.fromTo(
          expande,
          { clipPath: tablet ? "inset(10% 16% 10% 16% round 28px)" : "inset(6% 5% 6% 5% round 18px)" },
          { clipPath: "inset(0% 0% 0% 0% round 0px)", ease: "none", scrollTrigger: st },
        );
        gsap.fromTo("[data-expand-img]", { scale: 1.3 }, { scale: 1, ease: "none", scrollTrigger: st });
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

      // Checklist marca item a item.
      $$("[data-check]").forEach((el) => {
        ScrollTrigger.create({
          trigger: el,
          start: "top 72%",
          onEnter: () => el.classList.add("is-checked"),
          onLeaveBack: () => el.classList.remove("is-checked"),
        });
      });

      // Marca gigante do rodapé sobe no fim da página.
      gsap.from("[data-rodape-marca]", {
        yPercent: 70,
        autoAlpha: 0,
        ease: "none",
        scrollTrigger: { trigger: "[data-rodape-marca]", start: "top bottom", end: "bottom bottom", scrub: true },
      });

      // Botões principais "puxam" levemente o cursor (só com mouse).
      if (mouse) {
        $$("[data-magnetic]").forEach((btn) => {
          const x = gsap.quickTo(btn, "x", { duration: 0.8, ease: "elastic.out(1, 0.4)" });
          const y = gsap.quickTo(btn, "y", { duration: 0.8, ease: "elastic.out(1, 0.4)" });
          const onMove = (e: PointerEvent) => {
            const r = btn.getBoundingClientRect();
            x((e.clientX - (r.left + r.width / 2)) * 0.22);
            y((e.clientY - (r.top + r.height / 2)) * 0.35);
          };
          const onLeave = () => (x(0), y(0));
          btn.addEventListener("pointermove", onMove);
          btn.addEventListener("pointerleave", onLeave);
          limpezas.push(() => {
            btn.removeEventListener("pointermove", onMove);
            btn.removeEventListener("pointerleave", onLeave);
          });
        });
      }

      // Gatilhos criados fora da ordem da página (os genéricos) são reordenados pelas áreas fixas.
      ScrollTrigger.sort();

      return () => {
        limpezas.forEach((f) => f());
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
