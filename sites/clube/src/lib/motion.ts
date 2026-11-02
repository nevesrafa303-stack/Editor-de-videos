import gsap from "gsap";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import Lenis from "lenis";
import { iniciarCursor, iniciarLanterna, iniciarPreviaVideos } from "./efeitos";

gsap.registerPlugin(ScrollTrigger, SplitText, ScrambleTextPlugin);

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

/** Animações de rolagem (GSAP + ScrollTrigger + SplitText + ScrambleText). Devolve a função de limpeza.
 *  O que é cena (abertura, pilares, entradas) segue a rolagem nos dois sentidos; o que muda de estado
 *  (chaves, contadores, letras embaralhadas) acontece ao entrar na tela e se desfaz ao voltar. */
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

      if (reduce) return;

      const root = document.documentElement;
      root.classList.add("js-motion");

      // Entrada ligada à rolagem: começa quando o elemento aparece e termina antes do meio da tela.
      const entrada = (trigger: Element, inicio = "top 92%", fim = "top 62%") => ({
        trigger,
        start: inicio,
        end: fim,
        scrub: 0.6,
      });
      // Liga ao entrar na tela e desliga quando a pessoa volta para cima.
      const aoChegar = (el: Element, inicio: string, ligar: () => void, desligar: () => void) =>
        ScrollTrigger.create({ trigger: el, start: inicio, onEnter: ligar, onLeaveBack: desligar });

      // A abertura é preparada na hora; o resto vai em etapas curtas, uma por tarefa, para o celular não
      // travar (uma preparação única levava ~0,5 s num aparelho lento). No fim, um recálculo geral.
      const etapas: (() => void)[] = [];
      const etapa = (fn: () => void) => etapas.push(fn);
      let cancelado = false;

      // Abertura: a tela fixa; o texto sobe e some e o vídeo vira um quadro com a legenda
      // "Veja como foi a última edição".
      const hero = document.querySelector<HTMLElement>("[data-hero]");
      if (hero) {
        const legenda = hero.querySelector<HTMLElement>("[data-hero-legenda]");
        legenda?.classList.remove("hidden");
        const tl = gsap.timeline({ defaults: { ease: "none" } });
        tl.to("[data-hero-conteudo]", { yPercent: -14, autoAlpha: 0, duration: 0.45 }, 0)
          .to("[data-hero-sombra]", { autoAlpha: 0.25, duration: 0.6 }, 0.1)
          .fromTo(
            "[data-hero-janela]",
            { clipPath: "inset(0% 0% 0% 0% round 0px)" },
            {
              clipPath: desktop ? "inset(15% 12% 9% 12% round 32px)" : tablet ? "inset(17% 6% 14% 6% round 26px)" : "inset(22% 4% 26% 4% round 22px)",
              duration: 1,
              ease: "power2.inOut",
            },
            0.15,
          )
          .fromTo(legenda, { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.4, ease: "power2.out" }, 0.75)
          .to({}, { duration: 0.35 });
        ScrollTrigger.create({
          animation: tl,
          trigger: "[data-hero-palco]",
          start: "top top",
          end: () => `+=${window.innerHeight * 1.1}`,
          pin: true,
          pinSpacer: "[data-hero-espaco]",
          scrub: 0.6,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        });
        limpezas.push(() => legenda?.classList.add("hidden"));
      }

      // Títulos entram linha a linha, saindo de uma máscara, no ritmo da rolagem.
      $$("[data-split]").forEach((el) =>
        etapa(() => {
          SplitText.create(el, {
            type: "lines",
            mask: "lines",
            autoSplit: true,
            onSplit: (self) =>
              gsap.fromTo(
                self.lines,
                { yPercent: 115 },
                { yPercent: 0, stagger: 0.14, ease: "power2.out", scrollTrigger: entrada(el, "top 94%", "top 60%") },
              ),
          });
        }),
      );

      // Blocos de texto e listas sobem e aparecem com a rolagem (e somem ao voltar).
      $$("[data-reveal]").forEach((el) =>
        etapa(() => {
          const alvos = el.dataset.reveal === "stagger" ? Array.from(el.children) : el;
          gsap.fromTo(
            alvos,
            { y: 56, autoAlpha: 0 },
            { y: 0, autoAlpha: 1, stagger: 0.12, ease: "power2.out", scrollTrigger: entrada(el) },
          );
        }),
      );

      // Paralaxe de fotos.
      etapa(() => {
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
      });

      // Contadores: contam até o valor ao entrar na tela e voltam a zero quando a pessoa sobe de novo.
      etapa(() => {
        $$("[data-count]").forEach((el) => {
          const alvo = Number(el.dataset.count);
          const obj = { v: 0 };
          el.textContent = "0";
          gsap.to(obj, {
            v: alvo,
            duration: 1.6,
            ease: "power3.out",
            scrollTrigger: { trigger: el, start: "top 92%", toggleActions: "play none none reverse" },
            onUpdate: () => {
              el.textContent = Math.round(obj.v).toLocaleString("pt-BR");
            },
          });
        });
      });

      // Pilares: cada cartão gruda no topo (CSS sticky); quando o próximo sobe por cima, o de baixo
      // encolhe e escurece. No desktop o contador "01 / 05" e a barra acompanham.
      etapa(() => {
        const pilares = $$("[data-pilar]");
        const atual = document.querySelector<HTMLElement>("[data-pilar-atual]");
        pilares.forEach((pilar, i) => {
          const proximo = pilares[i + 1];
          if (proximo) {
            const st = { trigger: proximo, start: "top 92%", end: "top 25%", scrub: true };
            gsap.to(pilar.querySelector("[data-pilar-cartao]"), { scale: 0.92, ease: "none", scrollTrigger: st });
            gsap.to(pilar.querySelector("[data-pilar-sombra]"), { opacity: 0.55, ease: "none", scrollTrigger: st });
          }
        });
        // Contador e barra seguem a posição da rolagem na lista (iguais descendo e subindo).
        const lista = pilares[0]?.parentElement;
        if (lista && atual) {
          let antes = -1;
          ScrollTrigger.create({
            trigger: lista,
            start: "top 60%",
            end: "bottom 40%",
            onUpdate: (self) => {
              const i = Math.min(pilares.length - 1, Math.floor(self.progress * pilares.length));
              if (i === antes) return;
              antes = i;
              atual.textContent = String(i + 1).padStart(2, "0");
              gsap.to("[data-pilares-progresso]", { scaleX: (i + 1) / pilares.length, duration: 0.5, ease: "power3.out", overwrite: true });
            },
          });
        }
      });

      // Chaves: ligam quando o item chega perto do meio da tela. Nos ingressos ligam em sequência;
      // as dos benefícios que o ingresso não tem continuam desligadas.
      etapa(() => {
        $$("#para-quem [data-chave-item]").forEach((item) =>
          aoChegar(item, "top 72%", () => (item.dataset.ligado = "true"), () => (item.dataset.ligado = "false")),
        );
        $$("[data-beneficios]").forEach((lista) => {
          const itens = $$("[data-chave-item]", lista).filter((li) => li.dataset.ligado !== "false");
          let timers: number[] = [];
          const ligar = () => {
            timers.forEach((t) => window.clearTimeout(t));
            timers = itens.map((li, i) => window.setTimeout(() => (li.dataset.ligado = "true"), 120 * i));
          };
          const desligar = () => {
            timers.forEach((t) => window.clearTimeout(t));
            itens.forEach((li) => delete li.dataset.ligado);
          };
          aoChegar(lista, "top 78%", ligar, desligar);
          limpezas.push(desligar);
        });
        limpezas.push(() => $$("#para-quem [data-chave-item]").forEach((li) => delete li.dataset.ligado));
      });

      // Painel de informações: as letras embaralham até formar o texto, como um quadro de embarque.
      etapa(() => {
        $$("[data-embaralhar]").forEach((el, i) => {
          const texto = el.textContent ?? "";
          const tween = gsap.to(el, {
            duration: 0.8 + i * 0.1,
            scrambleText: { text: texto, chars: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789", revealDelay: 0.25, speed: 0.6 },
            paused: true,
          });
          aoChegar(
            el,
            "top 88%",
            () => tween.restart(),
            () => {
              tween.pause(0);
              el.textContent = texto;
            },
          );
          limpezas.push(() => {
            tween.kill();
            el.textContent = texto;
          });
        });
      });

      // Barra de ingressos vendidos enche quando aparece.
      etapa(() => {
        $$("[data-vendidos]").forEach((barra) => {
          gsap.fromTo(
            barra,
            { scaleX: 0 },
            { scaleX: 1, duration: 1.6, ease: "power3.out", scrollTrigger: { trigger: barra, start: "top 92%", toggleActions: "play none none reverse" } },
          );
        });
      });

      // Ingressos: entram tombando para a frente; com mouse, inclinam e um brilho acompanha a luz.
      etapa(() => {
        const ingressos = $$("[data-ingresso-cartao]");
        ingressos.forEach((el, i) => {
          gsap.fromTo(
            el,
            { rotateX: 24, y: 90, autoAlpha: 0.2, transformOrigin: "50% 100%" },
            { rotateX: 0, y: 0, autoAlpha: 1, ease: "power2.out", scrollTrigger: entrada(el, `top ${96 - i * 2}%`, "top 55%") },
          );
          if (!mouse) return;
          const rx = gsap.quickTo(el, "rotationX", { duration: 0.6, ease: "power3.out" });
          const ry = gsap.quickTo(el, "rotationY", { duration: 0.6, ease: "power3.out" });
          const onMove = (e: PointerEvent) => {
            const r = el.getBoundingClientRect();
            const px = (e.clientX - r.left) / r.width;
            const py = (e.clientY - r.top) / r.height;
            ry((px - 0.5) * 10);
            rx((py - 0.5) * -10);
            el.style.setProperty("--hx", `${px * 100}%`);
            el.style.setProperty("--hy", `${py * 100}%`);
          };
          const onLeave = () => (rx(0), ry(0));
          el.addEventListener("pointermove", onMove);
          el.addEventListener("pointerleave", onLeave);
          limpezas.push(() => {
            el.removeEventListener("pointermove", onMove);
            el.removeEventListener("pointerleave", onLeave);
          });
        });
      });

      // Mentores: a foto abre de baixo para cima e desacelera o zoom, um mentor depois do outro.
      etapa(() => {
        $$("[data-mentor]").forEach((mentor, i) => {
          const foto = mentor.querySelector("[data-mentor-foto]");
          const st = entrada(mentor, `top ${94 - i * 3}%`, "top 45%");
          gsap.fromTo(mentor.querySelector("figure"), { clipPath: "inset(100% 0% 0% 0% round 28px)" }, { clipPath: "inset(0% 0% 0% 0% round 28px)", ease: "power2.out", scrollTrigger: st });
          gsap.fromTo(foto, { scale: 1.3 }, { scale: 1, ease: "power2.out", scrollTrigger: st });
        });
      });

      // A seta gigante da chamada final gira com a rolagem.
      etapa(() => {
        $$("[data-girar]").forEach((el) => {
          gsap.fromTo(
            el,
            { rotate: -120, scale: 0.8 },
            { rotate: 40, scale: 1, ease: "none", scrollTrigger: { trigger: el.closest("section") ?? el, start: "top bottom", end: "bottom top", scrub: true } },
          );
        });
      });

      // Depoimentos: no desktop a seção fixa, os vídeos correm na horizontal e cada um gira e cresce ao entrar.
      const track = document.querySelector<HTMLElement>("[data-cases-track]");
      etapa(() => {
        const cartoesCases = track ? (Array.from(track.children) as HTMLElement[]).filter((c) => c.querySelector("figure")) : [];
        if (track && desktop) {
          track.dataset.pinned = "true";
          const barra = document.querySelector<HTMLElement>("[data-cases-progresso]");
          const distancia = () => Math.max(0, track.scrollWidth - track.clientWidth);
          const horizontal = gsap.to(track, {
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
          cartoesCases.forEach((cartao) => {
            gsap.fromTo(
              cartao,
              { rotate: 7, scale: 0.86, yPercent: 10 },
              {
                rotate: 0,
                scale: 1,
                yPercent: 0,
                ease: "none",
                scrollTrigger: { trigger: cartao, containerAnimation: horizontal, start: "left right", end: "left 60%", scrub: true },
              },
            );
          });
        } else if (track) {
          gsap.fromTo(
            cartoesCases,
            { y: 70, autoAlpha: 0 },
            { y: 0, autoAlpha: 1, stagger: 0.1, ease: "power2.out", scrollTrigger: entrada(track, "top 95%", "top 55%") },
          );
        }
      });

      // Logo gigante do rodapé sobe no fim da página.
      etapa(() => {
        gsap.from("[data-rodape-marca]", {
          yPercent: 70,
          autoAlpha: 0,
          ease: "none",
          scrollTrigger: { trigger: "[data-rodape-marca]", start: "top bottom", end: "bottom bottom", scrub: true },
        });
      });

      // Com mouse: cursor com rótulo, lanterna nos cartões, prévia dos vídeos e botões que "puxam" o cursor.
      if (mouse) {
        limpezas.push(iniciarCursor(), iniciarLanterna(), iniciarPreviaVideos());
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

      // Roda as etapas, várias por tarefa enquanto couberem em ~12 ms. No fim, reordena os gatilhos pelas
      // áreas fixas e recalcula as posições (as etapas foram criadas antes de todas as áreas fixas existirem).
      let proxima = 0;
      let timer = 0;
      const rodar = () => {
        if (cancelado) return;
        const inicio = performance.now();
        while (proxima < etapas.length && performance.now() - inicio < 12) ctx.add(etapas[proxima++]);
        if (proxima < etapas.length) timer = window.setTimeout(rodar, 0);
        else
          ctx.add(() => {
            ScrollTrigger.sort();
            ScrollTrigger.refresh();
          });
      };
      timer = window.setTimeout(rodar, 0);
      limpezas.push(() => {
        cancelado = true;
        window.clearTimeout(timer);
      });

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
