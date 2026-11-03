import gsap from "gsap";

// Efeitos de interação carregados junto com as animações (src/lib/motion.ts): cursor com rótulo,
// "lanterna" nos cartões e prévia muda dos vídeos ao passar o mouse.

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

  // O rótulo depende do que está sob o cursor. Com a rolagem a página anda e o mouse fica parado: por isso
  // ele também é recalculado ao rolar (senão um "Ver" ficava por cima de um título qualquer).
  let ultimo = { x: -1, y: -1 };
  const marcar = (el: Element | null) => {
    const alvo = el?.closest<HTMLElement>("[data-cursor], a, button, label, summary");
    const texto = alvo?.dataset.cursor;
    if (texto) {
      anel.dataset.rotulo = "";
      rotulo.textContent = texto;
    } else delete anel.dataset.rotulo;
    anel.dataset.sobre = String(Boolean(alvo));
  };
  const onMove = (e: PointerEvent) => {
    x(e.clientX);
    y(e.clientY);
    ultimo = { x: e.clientX, y: e.clientY };
    anel.dataset.fora = "false";
    marcar(e.target as Element | null);
  };
  let quadro = 0;
  const onScroll = () => {
    if (quadro || ultimo.x < 0) return;
    quadro = requestAnimationFrame(() => {
      quadro = 0;
      marcar(document.elementFromPoint(ultimo.x, ultimo.y));
    });
  };
  const onSai = () => (anel.dataset.fora = "true");
  document.addEventListener("pointermove", onMove);
  window.addEventListener("scroll", onScroll, { passive: true });
  document.documentElement.addEventListener("pointerleave", onSai);
  return () => {
    document.removeEventListener("pointermove", onMove);
    window.removeEventListener("scroll", onScroll);
    document.documentElement.removeEventListener("pointerleave", onSai);
    cancelAnimationFrame(quadro);
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
