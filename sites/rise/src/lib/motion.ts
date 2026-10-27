import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import Lenis from "lenis";
import { iniciarBrasas, iniciarCursor, iniciarLanterna, iniciarPreviaVideos } from "./efeitos";

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

      // Hero: a foto aproxima e o texto sobe enquanto a página rola; no desktop a foto acompanha o mouse.
      const hero = document.querySelector<HTMLElement>("[data-hero]");
      if (hero) {
        const st = { trigger: hero, start: "top top", end: "bottom top", scrub: true };
        gsap.to("[data-hero-media]", { scale: 1.15, yPercent: 8, ease: "none", scrollTrigger: st });
        gsap.to("[data-hero-content]", { yPercent: -18, autoAlpha: 0, ease: "none", scrollTrigger: { ...st, end: "bottom 15%" } });
        if (mouse && desktop) {
          const foto = hero.querySelector("[data-hero-media] picture");
          const x = gsap.quickTo(foto, "xPercent", { duration: 1.4, ease: "power3.out" });
          const y = gsap.quickTo(foto, "yPercent", { duration: 1.4, ease: "power3.out" });
          const onMove = (e: PointerEvent) => {
            x(((e.clientX / window.innerWidth) * 2 - 1) * -1.6);
            y(((e.clientY / window.innerHeight) * 2 - 1) * -1.2);
          };
          hero.addEventListener("pointermove", onMove);
          limpezas.push(() => hero.removeEventListener("pointermove", onMove));
        }
      }

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

      // Paralaxe de fundos e molduras.
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

      // Contadores: contam até o valor quando entram na tela e voltam a zero quando a pessoa sobe de novo.
      // Por tempo (e não preso à rolagem) para o número nunca ficar parado no meio da contagem.
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

      // Faixas de texto grande: andam em sentidos opostos com a rolagem.
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
      // ...e inclinam com a velocidade da rolagem (para um lado ao descer, para o outro ao subir).
      if (faixas.length) {
        const inclinar = faixas.map((el) => gsap.quickTo(el, "skewX", { duration: 0.45, ease: "power3.out" }));
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

      // Diagnóstico: uma linha de leitura desce pela lista e acende cada gargalo ao passar por ele;
      // o painel acima conta os gargalos encontrados.
      $$("[data-scan]").forEach((scan) => {
        const area = scan.querySelector<HTMLElement>("[data-scan-area]") ?? scan;
        const linha = scan.querySelector<HTMLElement>("[data-scan-linha]");
        const itens = $$("[data-gargalo]", scan);
        const contador = scan.querySelector<HTMLElement>("[data-scan-contador]");
        const barra = scan.querySelector<HTMLElement>("[data-scan-barra]");
        if (!linha || !itens.length) return;
        linha.classList.remove("hidden");
        let achados = -1;
        const marcar = (p: number) => {
          let n = 0;
          itens.forEach((item, i) => {
            const aceso = p >= (i + 0.55) / itens.length;
            item.dataset.detectado = String(aceso);
            n += Number(aceso);
          });
          if (n === achados) return;
          achados = n;
          if (contador) contador.textContent = String(n);
          if (barra) gsap.to(barra, { scaleX: n / itens.length, duration: 0.5, ease: "power3.out", overwrite: true });
        };
        marcar(0);
        gsap.fromTo(
          linha,
          { y: 0, autoAlpha: 0 },
          {
            y: () => area.offsetHeight,
            autoAlpha: 1,
            ease: "none",
            scrollTrigger: {
              trigger: area,
              start: "top 70%",
              end: "bottom 45%",
              scrub: 0.5,
              invalidateOnRefresh: true,
              onUpdate: (self) => marcar(self.progress),
            },
          },
        );
        limpezas.push(() => {
          linha.classList.add("hidden");
          itens.forEach((item) => delete item.dataset.detectado);
          if (contador) contador.textContent = String(itens.length);
          if (barra) gsap.set(barra, { clearProps: "transform" });
        });
      });

      // "A RISE não é fuga. É método.": a tela fixa, o risco corta "fuga", as letras despencam como
      // peças soltas e "método" sobe letra por letra em dourado.
      const manifesto = document.querySelector<HTMLElement>("[data-manifesto]");
      if (manifesto) {
        // Cada letra afunda um pouco e tomba para um lado: a palavra desmorona sem sair da linha do risco.
        const queda = [
          { y: 9, r: -9 },
          { y: 16, r: 7 },
          { y: 5, r: -12 },
          { y: 18, r: 10 },
          { y: 11, r: -5 },
        ];
        const letrasFuga = $$("[data-fuga-letra]", manifesto);
        const tl = gsap.timeline({ defaults: { ease: "power2.out" } });
        tl.fromTo("[data-manifesto-foto]", { scale: 1.18 }, { scale: 1, duration: 3.4, ease: "none" }, 0)
          .fromTo("[data-fuga]", { opacity: 1 }, { opacity: 0.5, duration: 0.5 }, 0.5)
          .fromTo("[data-fuga-risco]", { scaleX: 0 }, { scaleX: 1, duration: 0.6, ease: "power2.inOut" }, 0.35);
        letrasFuga.forEach((letra, i) => {
          const q = queda[i % queda.length];
          tl.fromTo(
            letra,
            { yPercent: 0, rotate: 0, autoAlpha: 1 },
            { yPercent: q.y, rotate: q.r, autoAlpha: 0.45, duration: 0.7, ease: "power2.in" },
            1 + i * 0.07,
          );
        });
        tl.fromTo("[data-metodo-letra]", { yPercent: 115 }, { yPercent: 0, stagger: 0.07, duration: 0.6 }, 1.45)
          .fromTo("[data-manifesto-texto]", { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.6 }, 2.3)
          .to({}, { duration: 0.6 });
        ScrollTrigger.create({
          animation: tl,
          trigger: "[data-manifesto-palco]",
          start: "top top",
          end: () => `+=${window.innerHeight * 1.8}`,
          pin: true,
          scrub: 0.6,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        });
      }

      // Frase da estrutura: a primeira parte apaga palavra por palavra e a segunda acende.
      $$("[data-preencher]").forEach((frase) => {
        const antes = $$("[data-antes]", frase);
        const depois = $$("[data-depois]", frase);
        const tl = gsap.timeline({
          scrollTrigger: { trigger: frase, start: "top 75%", end: "bottom 40%", scrub: 0.6 },
        });
        tl.fromTo(antes, { opacity: 1 }, { opacity: 0.22, stagger: 0.1, ease: "none" }, 0).fromTo(
          depois,
          { opacity: 0.1 },
          { opacity: 1, stagger: 0.12, ease: "none" },
          0.35,
        );
      });

      // Sintomas: os cartões caem para a frente como dominós, um depois do outro.
      $$("[data-domino]").forEach((lista) => {
        gsap.fromTo(
          Array.from(lista.children),
          { rotateX: -78, autoAlpha: 0.1, transformOrigin: "50% 0%" },
          { rotateX: 0, autoAlpha: 1, stagger: 0.15, ease: "power2.out", scrollTrigger: entrada(lista, "top 92%", "top 45%") },
        );
      });

      // Ingressos das entregas.
      const entregas = document.querySelector<HTMLElement>("[data-entregas]");
      const ingressos = $$("[data-ingresso-cartao]");
      if (entregas && ingressos.length) {
        const giros = [-9, 5, -4, 10];
        if (desktop) {
          // Saem de um monte no centro da lista e se espalham até o lugar de cada um.
          const lista = entregas.querySelector<HTMLElement>("[data-ingressos]")!;
          const paraOCentro = (el: HTMLElement) => {
            const l = lista.getBoundingClientRect();
            const r = (el.parentElement as HTMLElement).getBoundingClientRect();
            return l.left + l.width / 2 - (r.left + r.width / 2);
          };
          const tl = gsap.timeline();
          ingressos.forEach((el, i) => {
            tl.fromTo(
              el,
              { x: () => paraOCentro(el), y: 40 + i * 6, rotate: giros[i % giros.length], scale: 0.9 },
              { x: 0, y: 0, rotate: 0, scale: 1, duration: 1, ease: "power2.inOut" },
              i * 0.18,
            );
          });
          tl.to({}, { duration: 0.4 });
          ScrollTrigger.create({
            animation: tl,
            trigger: "[data-entregas-palco]",
            start: "top top",
            end: () => `+=${window.innerHeight * 1.1}`,
            pin: true,
            scrub: 0.7,
            anticipatePin: 1,
            invalidateOnRefresh: true,
          });
        } else if (!tablet) {
          // Celular: os ingressos viram um baralho. A seção fixa e, a cada trecho de rolagem, o ingresso da
          // frente sai para o lado e os de trás sobem um degrau.
          entregas.dataset.baralho = "true";
          const n = ingressos.length;
          const degrau = (k: number) => ({ y: k * 16, scale: 1 - k * 0.05, rotate: k === 0 ? 0 : k % 2 ? 2.5 : -2.5 });
          ingressos.forEach((el, i) => {
            gsap.set(el.parentElement, { zIndex: n - i });
            gsap.set(el, degrau(i));
          });
          const tl = gsap.timeline({ defaults: { duration: 1 } });
          for (let k = 0; k < n - 1; k++) {
            tl.to(ingressos[k], { xPercent: k % 2 ? 115 : -115, rotate: k % 2 ? 14 : -14, autoAlpha: 0, ease: "power2.in" }, k);
            for (let j = k + 1; j < n; j++) tl.to(ingressos[j], { ...degrau(j - k - 1), ease: "power2.out" }, k + 0.15);
          }
          tl.to({}, { duration: 0.4 });
          ScrollTrigger.create({
            animation: tl,
            trigger: "[data-entregas-palco]",
            start: "top top",
            end: () => `+=${(n - 1) * window.innerHeight * 0.55}`,
            pin: true,
            scrub: 0.6,
            anticipatePin: 1,
            invalidateOnRefresh: true,
          });
          limpezas.push(() => delete entregas.dataset.baralho);
        } else {
          // Tablet: cada ingresso entra girando, alternando os lados.
          ingressos.forEach((el, i) => {
            gsap.fromTo(
              el,
              { y: 90, rotate: i % 2 ? 6 : -6, autoAlpha: 0 },
              { y: 0, rotate: 0, autoAlpha: 1, ease: "power2.out", scrollTrigger: entrada(el, "top 98%", "top 62%") },
            );
          });
        }
        // Com mouse, o ingresso inclina na direção do cursor e um brilho holográfico acompanha a luz.
        if (mouse) {
          ingressos.forEach((el) => {
            const rx = gsap.quickTo(el, "rotationX", { duration: 0.6, ease: "power3.out" });
            const ry = gsap.quickTo(el, "rotationY", { duration: 0.6, ease: "power3.out" });
            const onMove = (e: PointerEvent) => {
              const r = el.getBoundingClientRect();
              const px = (e.clientX - r.left) / r.width;
              const py = (e.clientY - r.top) / r.height;
              ry((px - 0.5) * 14);
              rx((py - 0.5) * -14);
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
        }
      }

      // Focos da mentoria: o dourado enche cada linha da esquerda para a direita ao passar pela tela.
      $$("[data-foco]").forEach((foco) => {
        gsap.fromTo(
          foco.querySelector(".foco-cheio"),
          { clipPath: "inset(0 100% 0 0)" },
          { clipPath: "inset(0 0% 0 0)", ease: "none", scrollTrigger: { trigger: foco, start: "top 82%", end: "top 42%", scrub: 0.5 } },
        );
      });

      // Órbitas douradas giram devagar com a rolagem.
      $$("[data-orbita]").forEach((el) => {
        gsap.fromTo(
          el,
          { rotate: -4, scale: 1.12 },
          {
            rotate: 4,
            scale: 1,
            ease: "none",
            scrollTrigger: { trigger: el.closest("section") ?? el, start: "top bottom", end: "bottom top", scrub: true },
          },
        );
      });

      // Placas: as barras de antes e depois crescem a partir da base.
      $$("[data-placa]").forEach((placa) => {
        gsap.fromTo(
          $$("[data-barra]", placa),
          { scaleY: 0 },
          { scaleY: 1, stagger: 0.25, ease: "power2.out", scrollTrigger: entrada(placa, "top 90%", "top 50%") },
        );
      });

      // Depoimentos: no desktop a seção fixa, os vídeos correm na horizontal e cada um gira e cresce ao entrar.
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

      // Foto do evento: abre de um quadro recortado até a largura total.
      const expande = document.querySelector<HTMLElement>("[data-expand]");
      if (expande) {
        const st = { trigger: expande, start: "top 90%", end: "top 15%", scrub: true };
        gsap.fromTo(
          expande,
          { clipPath: desktop ? "inset(8% 14% 8% 14% round 32px)" : "inset(5% 5% 5% 5% round 20px)" },
          { clipPath: "inset(0% 0% 0% 0% round 0px)", ease: "none", scrollTrigger: st },
        );
        gsap.fromTo($$("[data-expand-img]", expande), { scale: 1.25 }, { scale: 1, ease: "none", scrollTrigger: st });
      }

      // Listas "para quem é": cada item desliza para o lugar e é marcado quando chega perto do meio da tela.
      $$("[data-check]").forEach((el) => {
        gsap.fromTo(el, { x: 40, autoAlpha: 0.2 }, { x: 0, autoAlpha: 1, ease: "power2.out", scrollTrigger: entrada(el, "top 96%", "top 76%") });
        ScrollTrigger.create({
          trigger: el,
          start: "top 74%",
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

      // Trajetória do Hermano: a linha dourada desce e acende cada marco ao alcançá-lo.
      const trajetoria = document.querySelector<HTMLElement>("[data-trajetoria]");
      if (trajetoria) {
        const marcos = $$("[data-marco]", trajetoria);
        const acender = (p: number) => {
          const alcance = p * trajetoria.offsetHeight;
          marcos.forEach((m) => (m.dataset.aceso = String(alcance >= m.offsetTop + 6)));
        };
        acender(0);
        gsap.fromTo(
          "[data-trajetoria-linha]",
          { scaleY: 0 },
          {
            scaleY: 1,
            ease: "none",
            scrollTrigger: { trigger: trajetoria, start: "top 72%", end: "bottom 55%", scrub: 0.5, onUpdate: (self) => acender(self.progress) },
          },
        );
        limpezas.push(() => marcos.forEach((m) => delete m.dataset.aceso));
      }

      // Brasas douradas na abertura e na chamada final; sobem mais rápido enquanto a página corre.
      const brasas = $$<HTMLCanvasElement>("canvas[data-brasas]").map((c) => iniciarBrasas(c, desktop ? 12000 : 8000));
      if (brasas.length) {
        const st = ScrollTrigger.create({
          onUpdate: (self) => brasas.forEach((b) => b.impulso(Math.abs(self.getVelocity()) / 900)),
        });
        limpezas.push(() => {
          st.kill();
          brasas.forEach((b) => b.parar());
        });
      }

      // Com mouse: cursor dourado, lanterna nos cartões e prévia dos vídeos ao passar o mouse.
      if (mouse) limpezas.push(iniciarCursor(), iniciarLanterna(), iniciarPreviaVideos());

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
