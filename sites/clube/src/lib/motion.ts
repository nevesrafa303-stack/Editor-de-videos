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

/** Inclinação 3D que segue o mouse, com o brilho (--hx/--hy) acompanhando a luz. Devolve a limpeza. */
function inclinarComMouse(el: HTMLElement, graus = 10) {
  const rx = gsap.quickTo(el, "rotationX", { duration: 0.6, ease: "power3.out" });
  const ry = gsap.quickTo(el, "rotationY", { duration: 0.6, ease: "power3.out" });
  const onMove = (e: PointerEvent) => {
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    ry((px - 0.5) * graus);
    rx((py - 0.5) * -graus);
    el.style.setProperty("--hx", `${px * 100}%`);
    el.style.setProperty("--hy", `${py * 100}%`);
  };
  const onLeave = () => (rx(0), ry(0));
  el.addEventListener("pointermove", onMove);
  el.addEventListener("pointerleave", onLeave);
  return () => {
    el.removeEventListener("pointermove", onMove);
    el.removeEventListener("pointerleave", onLeave);
  };
}

/** Animações de rolagem (GSAP + ScrollTrigger + SplitText + ScrambleText). Devolve a função de limpeza.
 *  O que é cena (abertura, pilares, entradas) segue a rolagem nos dois sentidos; o que muda de estado
 *  (contadores, letras embaralhadas) acontece ao entrar na tela e se desfaz ao voltar. */
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
      // "Veja como foi a última edição". Com mouse, vídeo e texto se deslocam em camadas.
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
        if (mouse) {
          const camadas = [
            { el: hero.querySelector("[data-hero-camada='video']"), f: -1.4 },
            { el: hero.querySelector("[data-hero-camada='texto']"), f: 0.9 },
          ].map(({ el, f }) => ({
            x: gsap.quickTo(el, "xPercent", { duration: 1.2, ease: "power3.out" }),
            y: gsap.quickTo(el, "yPercent", { duration: 1.2, ease: "power3.out" }),
            f,
          }));
          const onMove = (e: PointerEvent) => {
            const nx = (e.clientX / window.innerWidth) * 2 - 1;
            const ny = (e.clientY / window.innerHeight) * 2 - 1;
            camadas.forEach((c) => (c.x(nx * c.f), c.y(ny * c.f)));
          };
          hero.addEventListener("pointermove", onMove);
          limpezas.push(() => hero.removeEventListener("pointermove", onMove));
        }
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

      // Faixa: as duas linhas andam em sentidos opostos com a rolagem e inclinam com a velocidade.
      etapa(() => {
        const faixas = $$("[data-kinetic]");
        faixas.forEach((el) => {
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
        if (!faixas.length) return;
        const inclinar = faixas.map((el) => gsap.quickTo(el, "skewX", { duration: 0.45, ease: "power3.out" }));
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
      });

      // Pilares em acordeão. Desktop: a seção fixa e a rolagem abre uma coluna de cada vez; o mouse e o
      // teclado também abrem. Celular: todos ficam abertos e o que passa pelo meio da tela acende.
      etapa(() => {
        const paineis = $$("[data-pilar-painel]");
        if (!paineis.length) return;
        const atual = document.querySelector<HTMLElement>("[data-pilar-atual]");
        const ativar = (i: number) => {
          paineis.forEach((p, j) => {
            p.dataset.ativo = String(i === j);
            p.querySelector("[data-pilar-botao]")?.setAttribute("aria-expanded", String(i === j));
          });
          if (atual) atual.textContent = String(i + 1).padStart(2, "0");
          gsap.to("[data-pilares-progresso]", { scaleX: (i + 1) / paineis.length, duration: 0.5, ease: "power3.out", overwrite: true });
        };
        ativar(0);
        paineis.forEach((p, i) => {
          const botao = p.querySelector("[data-pilar-botao]");
          const abrir = () => ativar(i);
          botao?.addEventListener("click", abrir);
          if (mouse && desktop) p.addEventListener("pointerenter", abrir);
          limpezas.push(() => {
            botao?.removeEventListener("click", abrir);
            p.removeEventListener("pointerenter", abrir);
            delete p.dataset.ativo;
            botao?.setAttribute("aria-expanded", "true");
          });
        });
        if (desktop) {
          let antes = 0;
          ScrollTrigger.create({
            trigger: "[data-pilares-palco]",
            start: "top top",
            end: () => `+=${window.innerHeight * 2.2}`,
            pin: true,
            pinSpacer: "[data-pilares-espaco]",
            anticipatePin: 1,
            invalidateOnRefresh: true,
            onUpdate: (self) => {
              const i = Math.min(paineis.length - 1, Math.floor(self.progress * paineis.length));
              if (i === antes) return;
              antes = i;
              ativar(i);
            },
          });
          // As colunas entram de baixo, uma depois da outra.
          gsap.fromTo(
            paineis,
            { yPercent: 30, autoAlpha: 0 },
            { yPercent: 0, autoAlpha: 1, stagger: 0.08, ease: "power3.out", scrollTrigger: entrada(paineis[0].parentElement!, "top 95%", "top 55%") },
          );
        } else {
          // Acende o item que está cruzando o meio da tela (as faixas não se sobrepõem: o resultado é o
          // mesmo descendo ou subindo).
          paineis.forEach((p, i) =>
            ScrollTrigger.create({
              trigger: p,
              start: "top 50%",
              end: "bottom+=12 50%", // + o espaço entre os itens
              onToggle: (self) => self.isActive && ativar(i),
              // Num salto de rolagem por cima da lista, garante o primeiro (acima) ou o último (abaixo).
              onLeaveBack: i === 0 ? () => ativar(0) : undefined,
              onLeave: i === paineis.length - 1 ? () => ativar(i) : undefined,
            }),
          );
        }
      });

      // Galeria: arrastar com o mouse (com inércia) além da rolagem lateral nativa; a foto desliza por dentro
      // do quadro conforme a faixa anda, e a barra embaixo mostra a posição.
      etapa(() => {
        const faixa = document.querySelector<HTMLElement>("[data-galeria]");
        if (!faixa) return;
        const itens = $$("[data-galeria-item]", faixa);
        const fotos = itens.map((it) => gsap.quickSetter(it.querySelector("[data-galeria-foto]"), "xPercent"));
        const barra = document.querySelector<HTMLElement>("[data-galeria-progresso]");
        const atualizar = () => {
          const centro = faixa.getBoundingClientRect().left + faixa.clientWidth / 2;
          itens.forEach((it, i) => {
            const r = it.getBoundingClientRect();
            const d = (r.left + r.width / 2 - centro) / faixa.clientWidth;
            fotos[i](gsap.utils.clamp(-8, 8, d * -12));
          });
          const max = faixa.scrollWidth - faixa.clientWidth;
          if (barra) barra.style.transform = `scaleX(${max > 0 ? 0.15 + 0.85 * (faixa.scrollLeft / max) : 1})`;
        };
        faixa.addEventListener("scroll", atualizar, { passive: true });
        atualizar();
        gsap.fromTo(itens, { x: 160, autoAlpha: 0 }, { x: 0, autoAlpha: 1, stagger: 0.06, ease: "power3.out", scrollTrigger: entrada(faixa, "top 96%", "top 55%") });

        let limparArraste = () => {};
        if (mouse) {
          let inicioX = 0;
          let inicioScroll = 0;
          let ultimoX = 0;
          let ultimoT = 0;
          let velocidade = 0;
          let arrastando = false;
          const down = (e: PointerEvent) => {
            if (e.button !== 0) return;
            arrastando = true;
            inicioX = ultimoX = e.clientX;
            inicioScroll = faixa.scrollLeft;
            ultimoT = performance.now();
            velocidade = 0;
            gsap.killTweensOf(faixa);
            faixa.setPointerCapture(e.pointerId);
          };
          const move = (e: PointerEvent) => {
            if (!arrastando) return;
            const agora = performance.now();
            velocidade = (e.clientX - ultimoX) / Math.max(1, agora - ultimoT);
            ultimoX = e.clientX;
            ultimoT = agora;
            faixa.scrollLeft = inicioScroll - (e.clientX - inicioX);
          };
          const up = () => {
            if (!arrastando) return;
            arrastando = false;
            // Inércia: continua deslizando na direção do arraste e desacelera.
            gsap.to(faixa, { scrollLeft: faixa.scrollLeft - velocidade * 420, duration: 1.1, ease: "power3.out" });
          };
          faixa.addEventListener("pointerdown", down);
          faixa.addEventListener("pointermove", move);
          faixa.addEventListener("pointerup", up);
          faixa.addEventListener("pointercancel", up);
          limparArraste = () => {
            faixa.removeEventListener("pointerdown", down);
            faixa.removeEventListener("pointermove", move);
            faixa.removeEventListener("pointerup", up);
            faixa.removeEventListener("pointercancel", up);
          };
        }
        limpezas.push(() => {
          faixa.removeEventListener("scroll", atualizar);
          limparArraste();
        });
      });

      // Bilhete: os valores embaralham até formar o texto e, com mouse, o bilhete inclina e brilha.
      etapa(() => {
        $$("[data-embaralhar]").forEach((el, i) => {
          const texto = el.textContent ?? "";
          const tween = gsap.to(el, {
            duration: 0.8 + i * 0.12,
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
        const bilhete = document.querySelector<HTMLElement>("[data-bilhete]");
        if (bilhete) {
          gsap.fromTo(bilhete, { rotateX: 18, y: 60 }, { rotateX: 0, y: 0, ease: "power2.out", scrollTrigger: entrada(bilhete, "top 95%", "top 55%") });
          if (mouse) limpezas.push(inclinarComMouse(bilhete, 8));
        }
      });

      // Benefícios dos ingressos: as chaves incluídas ligam em sequência quando o cartão aparece.
      etapa(() => {
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
        $$("[data-ingresso-cartao]").forEach((el, i) => {
          gsap.fromTo(
            el,
            { rotateX: 24, y: 90, autoAlpha: 0.2, transformOrigin: "50% 100%" },
            { rotateX: 0, y: 0, autoAlpha: 1, ease: "power2.out", scrollTrigger: entrada(el, `top ${96 - i * 2}%`, "top 55%") },
          );
          if (mouse) limpezas.push(inclinarComMouse(el, 10));
        });
      });

      // Mentores: no desktop as cartas saem de um monte no centro e se abrem lado a lado com a rolagem;
      // no celular entram de baixo. Com mouse, cada carta inclina e brilha.
      etapa(() => {
        const lista = document.querySelector<HTMLElement>("[data-mentores]");
        const cartas = $$("[data-mentor-carta]");
        if (!lista || !cartas.length) return;
        if (tablet) {
          const giros = [-10, 2, 9];
          // Distância até o centro da lista. Desconta o deslocamento que a carta já tem: no recálculo ela
          // pode estar no meio da animação (o giro não muda o centro).
          const paraOCentro = (el: HTMLElement) => {
            const l = lista.getBoundingClientRect();
            const r = el.getBoundingClientRect();
            return l.left + l.width / 2 - (r.left + r.width / 2 - Number(gsap.getProperty(el, "x")));
          };
          cartas.forEach((c, i) => {
            gsap.fromTo(
              c,
              { x: () => paraOCentro(c), rotate: giros[i % giros.length], y: 40 + i * 10 },
              { x: 0, rotate: 0, y: 0, ease: "power2.inOut", scrollTrigger: { ...entrada(lista, "top 85%", "top 30%"), invalidateOnRefresh: true } },
            );
          });
        } else {
          cartas.forEach((c) =>
            gsap.fromTo(c, { y: 80, rotate: -3, autoAlpha: 0 }, { y: 0, rotate: 0, autoAlpha: 1, ease: "power2.out", scrollTrigger: entrada(c, "top 96%", "top 62%") }),
          );
        }
        if (mouse) $$("[data-mentor-figura]").forEach((f) => limpezas.push(inclinarComMouse(f, 12)));
      });

      // Depoimentos: no desktop a seção fixa, os vídeos correm na horizontal e cada um gira e cresce ao entrar.
      const track = document.querySelector<HTMLElement>("[data-cases-track]");
      etapa(() => {
        const cartoesCases = track ? (Array.from(track.children) as HTMLElement[]).filter((c) => !c.hasAttribute("aria-hidden")) : [];
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
              pinSpacer: "[data-cases-espaco]",
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

      // Chamada final: o botão redondo é atraído pelo mouse dentro da seção (quanto mais perto, mais forte).
      etapa(() => {
        const area = document.querySelector<HTMLElement>("[data-ima-area]");
        const ima = document.querySelector<HTMLElement>("[data-ima]");
        if (!area || !ima || !mouse) return;
        const miolo = ima.querySelector<HTMLElement>("[data-ima-miolo]");
        const x = gsap.quickTo(ima, "x", { duration: 0.9, ease: "power3.out" });
        const y = gsap.quickTo(ima, "y", { duration: 0.9, ease: "power3.out" });
        const mx = gsap.quickTo(miolo, "x", { duration: 0.6, ease: "power3.out" });
        const my = gsap.quickTo(miolo, "y", { duration: 0.6, ease: "power3.out" });
        const onMove = (e: PointerEvent) => {
          const r = ima.getBoundingClientRect();
          const dx = e.clientX - (r.left + r.width / 2 - (Number(gsap.getProperty(ima, "x")) || 0));
          const dy = e.clientY - (r.top + r.height / 2 - (Number(gsap.getProperty(ima, "y")) || 0));
          const dist = Math.hypot(dx, dy);
          const forca = gsap.utils.clamp(0, 1, 1 - dist / 420);
          x(dx * 0.45 * forca);
          y(dy * 0.45 * forca);
          mx(dx * 0.12 * forca);
          my(dy * 0.12 * forca);
        };
        const onLeave = () => (x(0), y(0), mx(0), my(0));
        area.addEventListener("pointermove", onMove);
        area.addEventListener("pointerleave", onLeave);
        limpezas.push(() => {
          area.removeEventListener("pointermove", onMove);
          area.removeEventListener("pointerleave", onLeave);
        });
      });

      // Logo gigante do rodapé sobe no fim da página (termina exatamente no fim da rolagem: abaixo dele ainda
      // vem a linha do copyright, então "bottom bottom" nunca chegaria).
      etapa(() => {
        gsap.from("[data-rodape-marca]", {
          yPercent: 70,
          autoAlpha: 0,
          ease: "none",
          scrollTrigger: { trigger: "[data-rodape-marca]", start: "top bottom", end: "max", scrub: true },
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
