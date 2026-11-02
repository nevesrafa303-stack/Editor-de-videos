// Vídeo do evento na abertura (JavaScript puro, usado pelo site e pela prévia).
// - Só começa a baixar depois que a página carregou: o pôster aparece na hora e não atrasa o resto.
// - Toca sem som, em loop, e pausa quando sai da tela. O botão liga e desliga o som.
// - Com "reduzir movimento" não toca sozinho: o botão passa a ser "Assistir com som".
import { track } from "./tracking";

export function iniciarVideoEvento() {
  const video = document.querySelector<HTMLVideoElement>("[data-video-evento]");
  const botao = document.querySelector<HTMLButtonElement>("[data-som]");
  const rotulo = document.querySelector<HTMLElement>("[data-som-rotulo]");
  if (!video) return () => {};
  const reduzir = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let carregado = false;
  let naTela = true;

  const carregar = () => {
    if (carregado) return;
    carregado = true;
    video.querySelectorAll<HTMLSourceElement>("source[data-src]").forEach((s) => (s.src = s.dataset.src!));
    video.load();
    if (!reduzir) video.play().catch(() => {});
  };
  const agendar = () => window.setTimeout(carregar, 600);
  if (document.readyState === "complete") agendar();
  else window.addEventListener("load", agendar, { once: true });

  const atualizarBotao = () => {
    if (!botao || !rotulo) return;
    const comSom = !video.muted && !video.paused;
    botao.setAttribute("aria-pressed", String(comSom));
    botao.dataset.comSom = String(comSom);
    rotulo.textContent = comSom ? "Desligar som" : reduzir && video.paused ? "Assistir com som" : "Ligar som";
  };
  const alternarSom = () => {
    carregar();
    if (video.muted || video.paused) {
      video.muted = false;
      if (video.ended || video.currentTime > video.duration - 1) video.currentTime = 0;
      video.play().catch(() => {});
      track("video_evento_som", { ligado: true });
    } else {
      video.muted = true;
      if (reduzir) video.pause();
      track("video_evento_som", { ligado: false });
    }
    atualizarBotao();
  };
  botao?.addEventListener("click", alternarSom);
  video.addEventListener("play", atualizarBotao);
  video.addEventListener("pause", atualizarBotao);
  video.addEventListener("volumechange", atualizarBotao);
  atualizarBotao();

  // Fora da tela: pausa (economiza bateria e dados); de volta: continua se estava tocando sozinho.
  const obs = new IntersectionObserver(([e]) => {
    naTela = e.isIntersecting;
    if (!carregado) return;
    if (!naTela) video.pause();
    else if (!reduzir || !video.muted) video.play().catch(() => {});
  });
  obs.observe(video);

  return () => {
    obs.disconnect();
    botao?.removeEventListener("click", alternarSom);
    video.removeEventListener("play", atualizarBotao);
    video.removeEventListener("pause", atualizarBotao);
    video.removeEventListener("volumechange", atualizarBotao);
  };
}
