import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import Lenis from "lenis";
import { definirEstadoGantt } from "./interacoes";

gsap.registerPlugin(ScrollTrigger, SplitText);

const $$ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) =>
  Array.from(root.querySelectorAll<T>(sel));

// Coreografia de rolagem da home, em JavaScript puro (usada pelo componente Motion e pela prévia em
// arquivo único). As seções marcam o que anima com atributos data-*. Sem JavaScript, ou com
// "reduzir movimento", o conteúdo aparece completo e no estado final.

/** Rolagem suave (Lenis) sincronizada com o ScrollTrigger. Devolve a limpeza. */
export function iniciarRolagemSuave() {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return () => {};
  const lenis = new Lenis({ lerp: 0.1, anchors: { offset: -72 }, allowNestedScroll: true });
  lenis.on("scroll", ScrollTrigger.update);
  const tick = (time: number) => lenis.raf(time * 1000);
  gsap.ticker.add(tick);
  gsap.ticker.lagSmoothing(0);
  return () => {
    gsap.ticker.remove(tick);
    lenis.destroy();
  };
}

const formatar = (v: number, d: number) =>
  v.toLocaleString("pt-BR", { minimumFractionDigits: d, maximumFractionDigits: d });

/** Animações ligadas à rolagem (scrub: ao subir, desfazem; ao descer, acontecem de novo). */
export function iniciarAnimacoes() {
  const mm = gsap.matchMedia();

  mm.add(
    {
      motion: "(prefers-reduced-motion: no-preference)",
      desktop: "(min-width: 1024px) and (min-height: 700px)",
    },
    (ctx) => {
      const { motion, desktop } = ctx.conditions as Record<string, boolean>;
      if (!motion) return;
      const limpezas: (() => void)[] = [];
      document.documentElement.classList.add("js-motion");

      const entrada = (trigger: Element, inicio = "top 90%", fim = "top 60%") => ({ trigger, start: inicio, end: fim, scrub: 0.6 });

      // Abertura: o R se afasta e o texto sobe enquanto a página rola.
      const hero = document.querySelector("[data-hero]");
      if (hero) {
        const st = { trigger: hero, start: "top top", end: "bottom top", scrub: true };
        gsap.to("[data-hero-r]", { yPercent: 18, scale: 1.08, ease: "none", scrollTrigger: st });
        gsap.to("[data-hero-painel]", { yPercent: -25, ease: "none", scrollTrigger: st });
        gsap.to("[data-hero-conteudo]", { yPercent: -12, autoAlpha: 0.15, ease: "none", scrollTrigger: { ...st, end: "bottom 20%" } });
      }

      // Títulos: linha a linha saindo de uma máscara.
      $$("[data-split]").forEach((el) => {
        SplitText.create(el, {
          type: "lines",
          mask: "lines",
          autoSplit: true,
          onSplit: (self) =>
            gsap.fromTo(self.lines, { yPercent: 110 }, { yPercent: 0, stagger: 0.12, ease: "power2.out", scrollTrigger: entrada(el, "top 92%", "top 62%") }),
        });
      });

      // Blocos e listas sobem e aparecem.
      $$("[data-reveal]").forEach((el) => {
        const alvos = el.dataset.reveal === "stagger" ? Array.from(el.children) : el;
        gsap.fromTo(alvos, { y: 50, autoAlpha: 0 }, { y: 0, autoAlpha: 1, stagger: 0.1, ease: "power2.out", scrollTrigger: entrada(el) });
      });

      // Paralaxe das fotos.
      $$("[data-parallax]").forEach((el) => {
        const v = Number(el.dataset.parallax) || 10;
        gsap.fromTo(
          el,
          { yPercent: -v / 2 },
          { yPercent: v / 2, ease: "none", scrollTrigger: { trigger: el.parentElement ?? el, start: "top bottom", end: "bottom top", scrub: true } },
        );
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

      // Faixa dos setores: anda com a rolagem.
      $$("[data-kinetic]").forEach((el) => {
        const dir = el.dataset.kinetic === "direita" ? 1 : -1;
        const forca = Number(el.dataset.forca) || 0.15;
        gsap.fromTo(
          el,
          { x: () => (dir > 0 ? -window.innerWidth * forca * 2 : 0) },
          {
            x: () => (dir > 0 ? 0 : -window.innerWidth * forca * 2),
            ease: "none",
            scrollTrigger: { trigger: el, start: "top bottom", end: () => `+=${window.innerHeight * 1.4}`, scrub: 0.4, invalidateOnRefresh: true },
          },
        );
      });

      // Abordagem: no desktop a seção fixa e a rolagem passa pelos três estados do cronograma;
      // no celular, o cronograma muda para "Nossa abordagem" quando chega ao meio da tela.
      const abordagem = document.querySelector<HTMLElement>("[data-abordagem]");
      if (abordagem) {
        const porProgresso = (p: number) => {
          if (abordagem.dataset.manual === "true") return;
          definirEstadoGantt(p < 0.3 ? "tradicional" : p < 0.68 ? "reforce" : "resultado");
        };
        if (desktop) {
          ScrollTrigger.create({
            trigger: abordagem,
            start: "top top",
            end: "+=160%",
            pin: true,
            onUpdate: (self) => porProgresso(self.progress),
            onLeave: () => delete abordagem.dataset.manual,
            onLeaveBack: () => delete abordagem.dataset.manual,
          });
        } else {
          const gantt = abordagem.querySelector("[data-gantt]");
          if (gantt)
            ScrollTrigger.create({
              trigger: gantt,
              start: "top 45%",
              end: "bottom 30%",
              onUpdate: (self) => porProgresso(0.3 + self.progress * 0.69),
              onLeaveBack: () => {
                delete abordagem.dataset.manual;
                definirEstadoGantt("tradicional");
              },
            });
        }
      }

      // Setores: no desktop a seção fixa e os cartões correm para a esquerda.
      const setores = document.querySelector<HTMLElement>("[data-setores]");
      const trilho = setores?.querySelector<HTMLElement>("[data-setores-trilho]");
      if (desktop && setores && trilho) {
        trilho.style.overflow = "visible";
        const contador = setores.querySelector<HTMLElement>("[data-setores-contador]");
        const barra = setores.querySelector<HTMLElement>("[data-setores-barra]");
        const cartoes = $$("[data-setor]", trilho);
        const distancia = () => Math.max(0, trilho.scrollWidth - window.innerWidth);
        gsap.to(trilho, {
          x: () => -distancia(),
          ease: "none",
          scrollTrigger: {
            trigger: setores,
            start: "top top",
            end: () => `+=${distancia()}`,
            pin: true,
            scrub: 0.5,
            invalidateOnRefresh: true,
            onUpdate: (self) => {
              const i = Math.min(cartoes.length, Math.floor(self.progress * cartoes.length) + 1);
              if (contador) contador.textContent = String(i).padStart(2, "0");
              if (barra) barra.style.transform = `scaleX(${0.2 + self.progress * 0.8})`;
            },
          },
        });
        // Cada cartão gira levemente ao entrar, como se viesse de uma esteira.
        cartoes.forEach((c, i) =>
          gsap.fromTo(c, { rotate: 3 + i * 0.4, y: 40 }, { rotate: 0, y: 0, ease: "power2.out", scrollTrigger: { trigger: setores, start: "top 80%", end: "top top", scrub: 0.6 } }),
        );
        limpezas.push(() => (trilho.style.overflow = ""));
      }

      // Método: a linha da jornada avança e acende cada fase.
      const metodo = document.querySelector<HTMLElement>("[data-metodo]");
      if (metodo) {
        const linha = metodo.querySelector<HTMLElement>("[data-metodo-linha]");
        const fases = $$("[data-fase]", metodo);
        const horizontal = matchMedia("(min-width: 768px)").matches;
        if (linha)
          gsap.fromTo(
            linha,
            horizontal ? { scaleX: 0, scaleY: 1 } : { scaleY: 0, scaleX: 1 },
            {
              ...(horizontal ? { scaleX: 1 } : { scaleY: 1 }),
              ease: "none",
              scrollTrigger: {
                trigger: metodo.querySelector("ol"),
                start: "top 75%",
                end: horizontal ? "bottom 70%" : "bottom 55%",
                scrub: 0.5,
                onUpdate: (self) =>
                  fases.forEach((f, i) => (f.dataset.ativa = String(self.progress >= (horizontal ? i / fases.length + 0.04 : i / fases.length)))),
              },
            },
          );
        gsap.fromTo(fases, { y: 60, autoAlpha: 0 }, { y: 0, autoAlpha: 1, stagger: 0.15, ease: "power2.out", scrollTrigger: entrada(metodo.querySelector("ol")!, "top 88%", "top 55%") });
      }

      // Valor capturado: as duas partes crescem lado a lado.
      const partes = $$("[data-valor-parte]");
      if (partes.length)
        gsap.fromTo(partes, { scaleX: 0 }, { scaleX: 1, stagger: 0.25, ease: "power3.out", scrollTrigger: entrada(partes[0].parentElement!, "top 90%", "top 60%") });

      $$("[data-barra-proporcao]").forEach((b) =>
        gsap.fromTo(b, { scaleX: 0 }, { scaleX: 1, ease: "power2.out", scrollTrigger: entrada(b, "top 95%", "top 70%") }),
      );

      // Presença: as rotas de mobilização se desenham saindo dos escritórios.
      const presenca = document.querySelector("[data-presenca]");
      if (presenca) {
        const rotas = $$<SVGPathElement>("[data-rota]", presenca);
        gsap.set(rotas, { strokeDasharray: 1, strokeDashoffset: 1 });
        gsap.to(rotas, { strokeDashoffset: 0, stagger: 0.12, ease: "power1.inOut", scrollTrigger: entrada(presenca.querySelector("figure")!, "top 75%", "center 50%") });
        gsap.fromTo(
          $$("path[data-ativo]", presenca),
          { fillOpacity: 0.15 },
          { fillOpacity: 1, stagger: 0.1, ease: "none", scrollTrigger: entrada(presenca.querySelector("figure")!, "top 80%", "center 55%") },
        );
      }

      // Depois de as fontes carregarem, as medidas mudam: recalcula.
      document.fonts?.ready.then(() => ScrollTrigger.refresh());

      return () => {
        limpezas.forEach((f) => f());
        document.documentElement.classList.remove("js-motion");
      };
    },
  );

  return () => mm.revert();
}
