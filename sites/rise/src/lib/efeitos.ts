import gsap from "gsap";

// Efeitos de interação carregados junto com as animações (src/lib/motion.ts): brasas douradas,
// cursor, "lanterna" nos cartões e prévia muda dos vídeos ao passar o mouse.

type Brasa = { x: number; y: number; r: number; vy: number; vx: number; fase: number; vida: number; max: number };

/** Brasas douradas subindo num canvas (RISE = subir). Reagem ao mouse e aceleram com a rolagem.
 *  Só desenham enquanto o canvas está na tela e a aba está visível. */
export function iniciarBrasas(canvas: HTMLCanvasElement, densidade: number) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return { parar: () => {}, impulso: () => {} };
  const dpr = Math.min(2, window.devicePixelRatio || 1);

  // Uma brasa pré-desenhada (brilho radial) e copiada: bem mais leve que desenhar sombra em cada quadro.
  const sprite = document.createElement("canvas");
  sprite.width = sprite.height = 64;
  const s = sprite.getContext("2d")!;
  const g = s.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, "rgba(255,236,190,1)");
  g.addColorStop(0.18, "rgba(247,190,86,0.95)");
  g.addColorStop(0.45, "rgba(255,138,69,0.35)");
  g.addColorStop(1, "rgba(255,138,69,0)");
  s.fillStyle = g;
  s.fillRect(0, 0, 64, 64);

  let w = 0;
  let h = 0;
  let impulso = 0;
  let rodando = false;
  let quadro = 0;
  const mouse = { x: -9999, y: -9999 };
  const brasas: Brasa[] = [];
  const nova = (espalhada: boolean): Brasa => ({
    x: Math.random() * w,
    y: espalhada ? Math.random() * h : h + 12,
    r: 0.5 + Math.random() * 1.6,
    vy: 0.25 + Math.random() * 0.65,
    vx: (Math.random() - 0.5) * 0.2,
    fase: Math.random() * Math.PI * 2,
    vida: 0,
    max: 420 + Math.random() * 520,
  });

  const medir = () => {
    w = canvas.clientWidth;
    h = canvas.clientHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const alvo = Math.round(Math.min(110, (w * h) / densidade));
    while (brasas.length < alvo) brasas.push(nova(true));
    brasas.length = alvo;
  };

  const desenhar = (t: number) => {
    if (!rodando) return;
    quadro = requestAnimationFrame(desenhar);
    ctx.clearRect(0, 0, w, h);
    ctx.globalCompositeOperation = "lighter";
    impulso *= 0.93;
    for (let i = 0; i < brasas.length; i++) {
      const b = brasas[i];
      b.vida++;
      b.y -= b.vy * (1 + impulso);
      b.x += b.vx + Math.sin(t * 0.0009 + b.fase) * 0.22;
      // O mouse afasta as brasas próximas, como se soprasse.
      const dx = b.x - mouse.x;
      const dy = b.y - mouse.y;
      const d2 = dx * dx + dy * dy;
      if (d2 < 14000) {
        const f = (1 - d2 / 14000) * 1.6;
        const d = Math.sqrt(d2) || 1;
        b.x += (dx / d) * f;
        b.y += (dy / d) * f;
      }
      if (b.y < -20 || b.vida > b.max || b.x < -20 || b.x > w + 20) {
        brasas[i] = nova(false);
        continue;
      }
      const entra = Math.min(1, b.vida / 60);
      const sai = Math.min(1, (b.max - b.vida) / 90);
      const topo = Math.min(1, b.y / (h * 0.3));
      const pisca = 0.75 + Math.sin(t * 0.004 + b.fase * 3) * 0.25;
      ctx.globalAlpha = Math.max(0, entra * sai * topo * pisca) * 0.85;
      const tam = b.r * 9;
      ctx.drawImage(sprite, b.x - tam / 2, b.y - tam / 2, tam, tam);
    }
    ctx.globalAlpha = 1;
  };
  const ligar = (v: boolean) => {
    if (v === rodando) return;
    rodando = v;
    if (v) quadro = requestAnimationFrame(desenhar);
    else cancelAnimationFrame(quadro);
  };

  let naTela = false;
  const obs = new IntersectionObserver(([e]) => {
    naTela = e.isIntersecting;
    ligar(naTela && !document.hidden);
  });
  const onVisibilidade = () => ligar(naTela && !document.hidden);
  const alvoMouse = canvas.parentElement ?? canvas;
  const onMove = (e: PointerEvent) => {
    const r = canvas.getBoundingClientRect();
    mouse.x = e.clientX - r.left;
    mouse.y = e.clientY - r.top;
  };
  const onLeave = () => ((mouse.x = -9999), (mouse.y = -9999));
  const ro = new ResizeObserver(medir);

  medir();
  ro.observe(canvas);
  obs.observe(canvas);
  document.addEventListener("visibilitychange", onVisibilidade);
  alvoMouse.addEventListener("pointermove", onMove);
  alvoMouse.addEventListener("pointerleave", onLeave);

  return {
    parar: () => {
      ligar(false);
      ro.disconnect();
      obs.disconnect();
      document.removeEventListener("visibilitychange", onVisibilidade);
      alvoMouse.removeEventListener("pointermove", onMove);
      alvoMouse.removeEventListener("pointerleave", onLeave);
      ctx.clearRect(0, 0, w, h);
    },
    /** Velocidade da rolagem (0 = parado): as brasas sobem mais rápido enquanto a página corre. */
    impulso: (v: number) => (impulso = Math.max(impulso, Math.min(6, v))),
  };
}

/** Anel dourado que segue o mouse; cresce sobre links e mostra um rótulo em [data-cursor]. */
export function iniciarCursor() {
  const anel = document.createElement("div");
  anel.className = "cursor-anel";
  anel.setAttribute("aria-hidden", "true");
  anel.dataset.fora = "true";
  const rotulo = document.createElement("span");
  anel.append(rotulo);
  document.body.append(anel);
  const x = gsap.quickTo(anel, "x", { duration: 0.35, ease: "power3.out" });
  const y = gsap.quickTo(anel, "y", { duration: 0.35, ease: "power3.out" });

  const onMove = (e: PointerEvent) => {
    x(e.clientX);
    y(e.clientY);
    anel.dataset.fora = "false";
    const alvo = (e.target as Element | null)?.closest<HTMLElement>("[data-cursor], a, button, label, summary");
    const texto = alvo?.dataset.cursor;
    if (texto) {
      anel.dataset.rotulo = "";
      rotulo.textContent = texto;
    } else delete anel.dataset.rotulo;
    anel.dataset.sobre = String(Boolean(alvo));
  };
  const onSai = () => (anel.dataset.fora = "true");
  document.addEventListener("pointermove", onMove);
  document.documentElement.addEventListener("pointerleave", onSai);
  return () => {
    document.removeEventListener("pointermove", onMove);
    document.documentElement.removeEventListener("pointerleave", onSai);
    anel.remove();
  };
}

/** "Lanterna" dourada que acompanha o mouse dentro dos cartões marcados com data-spotlight. */
export function iniciarLanterna() {
  const onMove = (e: PointerEvent) => {
    const card = (e.target as Element | null)?.closest<HTMLElement>("[data-spotlight]");
    if (!card) return;
    const r = card.getBoundingClientRect();
    card.style.setProperty("--mx", `${e.clientX - r.left}px`);
    card.style.setProperty("--my", `${e.clientY - r.top}px`);
  };
  document.addEventListener("pointermove", onMove);
  return () => document.removeEventListener("pointermove", onMove);
}

/** Depoimentos: ao passar o mouse sobre um vídeo ainda não aberto, ele começa a tocar sem som. */
export function iniciarPreviaVideos() {
  const limpezas: (() => void)[] = [];
  document.querySelectorAll<HTMLElement>("[data-previa-src]").forEach((btn) => {
    let video: HTMLVideoElement | null = null;
    let saida = 0;
    const entrar = () => {
      window.clearTimeout(saida);
      if (!btn.isConnected) return;
      if (!video) {
        video = document.createElement("video");
        video.src = btn.dataset.previaSrc!;
        video.muted = true;
        video.loop = true;
        video.playsInline = true;
        video.preload = "auto";
        video.setAttribute("aria-hidden", "true");
        video.className = "pointer-events-none absolute inset-0 size-full object-cover opacity-0 transition-opacity duration-500";
        // Logo depois do pôster: degradê, botão de play e duração continuam por cima.
        const poster = btn.querySelector("img");
        btn.insertBefore(video, poster ? poster.nextSibling : btn.firstChild);
      }
      const v = video;
      v.play().then(() => (v.style.opacity = "1")).catch(() => {});
    };
    const sair = () => {
      if (!video) return;
      video.style.opacity = "0";
      const v = video;
      saida = window.setTimeout(() => v.pause(), 500);
    };
    btn.addEventListener("pointerenter", entrar);
    btn.addEventListener("pointerleave", sair);
    limpezas.push(() => {
      btn.removeEventListener("pointerenter", entrar);
      btn.removeEventListener("pointerleave", sair);
      window.clearTimeout(saida);
      video?.remove();
    });
  });
  return () => limpezas.forEach((f) => f());
}
