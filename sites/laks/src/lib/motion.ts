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

/** Animações de rolagem (GSAP + ScrollTrigger + SplitText). Devolve a função de limpeza.
 *  Tudo é ligado à posição da rolagem (scrub): ao subir a página, os movimentos se desfazem e,
 *  ao descer de novo, acontecem outra vez. */
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

      // Entrada ligada à rolagem: começa quando o elemento aparece e termina antes do meio da tela.
      const entrada = (trigger: Element, inicio = "top 92%", fim = "top 62%") => ({
        trigger,
        start: inicio,
        end: fim,
        scrub: 0.6,
      });

      // Hero: a foto aproxima e o texto sobe enquanto a página rola; cubos em profundidades diferentes.
      const hero = document.querySelector<HTMLElement>("[data-hero]");
      const cubos = $$("[data-depth]");
      if (hero) {
        const st = { trigger: hero, start: "top top", end: "bottom top", scrub: true };
        gsap.to("[data-hero-media]", { scale: 1.22, yPercent: 12, ease: "none", scrollTrigger: st });
        gsap.to("[data-hero-content]", { yPercent: -22, autoAlpha: 0, ease: "none", scrollTrigger: { ...st, end: "bottom 15%" } });
        cubos.forEach((el) => {
          const d = Number(el.dataset.depth) || 0.5;
          gsap.to(el, { y: () => -window.innerHeight * d * 0.7, rotate: d * 18, ease: "none", scrollTrigger: st });
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

      // Faixa de logos: anda sozinha, troca de sentido junto com a rolagem e acelera com a velocidade.
      $$("[data-marquee]").forEach((faixa) => {
        faixa.classList.add("marquee-js");
        const loop = gsap.to(faixa, { xPercent: -50, ease: "none", duration: 38, repeat: -1 });
        // Começa "longe" do zero para poder andar para trás sem parar no início.
        loop.totalTime(loop.duration() * 100);
        let sentido = 1;
        const st = ScrollTrigger.create({
          onUpdate: (self) => {
            sentido = self.direction;
            const extra = Math.min(5, Math.abs(self.getVelocity()) / 350);
            gsap.to(loop, { timeScale: sentido * (1 + extra), duration: 0.25, overwrite: true });
          },
        });
        const devagar = () => gsap.to(loop, { timeScale: sentido, duration: 1.2, overwrite: true });
        ScrollTrigger.addEventListener("scrollEnd", devagar);
        limpezas.push(() => {
          ScrollTrigger.removeEventListener("scrollEnd", devagar);
          st.kill();
          faixa.classList.remove("marquee-js");
        });
      });

      // Títulos entram linha a linha, saindo de uma máscara, no ritmo da rolagem.
      $$("[data-split]").forEach((el) => {
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
      });

      // Blocos de texto e listas sobem e aparecem com a rolagem (e somem ao voltar).
      $$("[data-reveal]").forEach((el) => {
        const alvos = el.dataset.reveal === "stagger" ? Array.from(el.children) : el;
        gsap.fromTo(
          alvos,
          { y: 56, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, stagger: 0.12, ease: "power2.out", scrollTrigger: entrada(el) },
        );
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

      // Contadores: sobem conforme a rolagem desce e voltam a zero ao subir.
      $$("[data-count]").forEach((el) => {
        const alvo = Number(el.dataset.count);
        const obj = { v: 0 };
        el.textContent = "0";
        gsap.to(obj, {
          v: alvo,
          ease: "power1.out",
          scrollTrigger: entrada(el, "top 95%", "top 55%"),
          onUpdate: () => {
            el.textContent = Math.round(obj.v).toLocaleString("pt-BR");
          },
        });
      });

      // Cena "o jogo": a tela fixa, cada lance entra gigante e vira gol contra no placar; no fim a tela
      // gira como uma placa e mostra o verso laranja, onde a corretora vira o jogo. Tudo segue a rolagem.
      const jogo = document.querySelector<HTMLElement>("[data-jogo]");
      if (jogo) {
        const q = <T extends Element = HTMLElement>(sel: string) => jogo.querySelector<T>(sel);
        const lances = $$("[data-lance]", jogo);
        const sumula = $$("[data-sumula-item]", jogo);
        const palavras = $$("[data-virada-palavra]", jogo);
        const placar = {
          fora: q("[data-placar='fora']"),
          tempo: q("[data-placar='tempo']"),
          viradaCasa: q("[data-placar='virada-casa']"),
        };
        const originais = Object.fromEntries(Object.entries(placar).map(([k, el]) => [k, el?.textContent ?? ""]));
        const total = lances.length;
        const golsVirada = Number(originais.viradaCasa) || total + 1;

        jogo.dataset.cena = "ativa";
        limpezas.push(() => {
          delete jogo.dataset.cena;
          Object.entries(placar).forEach(([k, el]) => el && (el.textContent = originais[k]));
        });

        // Troca o número rolando (para cima ao subir o placar, para baixo ao voltar).
        const rolar = (el: HTMLElement | null, valor: string, subiu: boolean) => {
          if (!el || el.textContent === valor) return;
          el.textContent = valor;
          gsap.fromTo(el, { yPercent: subiu ? 90 : -90, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 0.35, ease: "back.out(2.2)", overwrite: true });
        };

        const golEm: number[] = [];
        const tl = gsap.timeline({ defaults: { ease: "power2.out" } });
        lances.forEach((lance, i) => {
          tl.fromTo(lance, { autoAlpha: 0, y: 80, scale: 0.92 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.42 }, i);
          golEm.push(i + 0.32);
          if (i < total - 1) tl.to(lance, { autoAlpha: 0, y: -80, scale: 1.05, duration: 0.32, ease: "power2.in" }, i + 0.72);
          if (sumula[i]) tl.fromTo(sumula[i], { autoAlpha: 0, x: -24 }, { autoAlpha: 1, x: 0, duration: 0.25 }, i + 0.72);
        });
        // O último lance (o mais longo) fica mais tempo na tela antes da virada.
        const virada = total - 1 + 1.3;
        const contagem = [virada + 0.75, virada + 1.65];
        // A placa inteira gira (o verso já está de costas no CSS) e recua um pouco no meio do giro.
        tl.fromTo("[data-jogo-cena]", { rotateX: 0 }, { rotateX: 180, duration: 1, ease: "power2.inOut" }, virada)
          .fromTo("[data-jogo-cena]", { scale: 1 }, { scale: 0.82, duration: 0.5, ease: "power2.out", yoyo: true, repeat: 1 }, virada)
          .fromTo(palavras, { yPercent: 115 }, { yPercent: 0, stagger: 0.07, duration: 0.5 }, virada + 0.7)
          .fromTo("[data-virada-link]", { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.35 }, virada + 1.3)
          .to({}, { duration: 0.7 });

        let golsAntes = -1;
        const atualizar = () => {
          const t = tl.time();
          const gols = golEm.filter((g) => t >= g).length;
          if (gols !== golsAntes) {
            const subiu = gols > golsAntes;
            rolar(placar.fora, String(gols), subiu);
            if (subiu && golsAntes >= 0 && gols > 0) {
              gsap.fromTo("[data-jogo-flash]", { opacity: 0.32 }, { opacity: 0, duration: 0.7, ease: "power2.out", overwrite: true });
            }
            golsAntes = gols;
          }
          if (placar.tempo) placar.tempo.textContent = `Ao vivo · ${gols ? lances[gols - 1].dataset.minuto : "0'"}`;
          const p = gsap.utils.clamp(0, 1, (t - contagem[0]) / (contagem[1] - contagem[0]));
          const casa = String(Math.round(p * golsVirada));
          rolar(placar.viradaCasa, casa, Number(casa) > Number(placar.viradaCasa?.textContent ?? 0));
        };
        tl.eventCallback("onUpdate", atualizar);
        atualizar();

        ScrollTrigger.create({
          animation: tl,
          trigger: "[data-jogo-palco]",
          start: "top top",
          end: () => `+=${tl.duration() * window.innerHeight * 0.55}`,
          pin: true,
          scrub: 0.7,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        });
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

      // Textos grandes inclinam com a velocidade da rolagem (para um lado ao descer, para o outro ao subir).
      const inclinaveis = $$("[data-kinetic]");
      if (inclinaveis.length) {
        const inclinar = inclinaveis.map((el) => gsap.quickTo(el, "skewX", { duration: 0.45, ease: "power3.out" }));
        const st = ScrollTrigger.create({
          onUpdate: (self) => {
            const v = gsap.utils.clamp(-10, 10, self.getVelocity() / -260);
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

      // Método MAPA: título revela da esquerda; etapas acendem e o indicador acompanha.
      const mapa = document.querySelector("[data-mapa]");
      if (mapa) {
        gsap.fromTo(
          "[data-mapa-titulo]",
          { clipPath: "inset(0 100% 0 0)" },
          { clipPath: "inset(0 0% 0 0)", ease: "power2.inOut", scrollTrigger: entrada(mapa.querySelector("[data-mapa-titulo]")!, "top 90%", "top 50%") },
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
              scrollTrigger: { trigger: passo, start: "top 92%", end: tablet ? "center 55%" : "top 55%", scrub: true },
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

      // Cases: no desktop a seção fixa, os depoimentos correm na horizontal e cada vídeo gira e cresce ao entrar.
      const track = document.querySelector<HTMLElement>("[data-cases-track]");
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

      // Polaroid da equipe "cai" girando e assenta conforme a rolagem.
      const polaroid = document.querySelector("[data-polaroid]");
      if (polaroid) {
        gsap.fromTo(
          polaroid,
          { rotate: -18, y: -120, autoAlpha: 0 },
          { rotate: 0, y: 0, autoAlpha: 1, ease: "back.out(1.8)", scrollTrigger: entrada(polaroid, "top 95%", "top 45%") },
        );
      }

      // Checklist: cada item desliza para o lugar e é marcado quando chega ao meio da tela.
      $$("[data-check]").forEach((el) => {
        gsap.fromTo(el, { x: 48, autoAlpha: 0.2 }, { x: 0, autoAlpha: 1, ease: "power2.out", scrollTrigger: entrada(el, "top 96%", "top 75%") });
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
