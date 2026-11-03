// Depoimentos em playlist: escolher alguém na lista troca o vídeo do palco (cortina em CSS); o play cria o
// <video> com som e controles, e a linha da lista mostra o andamento. Só um vídeo toca por vez.
// JavaScript puro (site e prévia: na prévia o data-src aponta para o vídeo embutido).
import { track } from "./tracking";

export function iniciarDepoimentos() {
  const raiz = document.querySelector<HTMLElement>("[data-cases]");
  if (!raiz) return () => {};
  const palco = raiz.querySelector<HTMLElement>("[data-cases-palco]");
  const slides = Array.from(raiz.querySelectorAll<HTMLElement>("[data-cases-slide]"));
  const itens = Array.from(raiz.querySelectorAll<HTMLButtonElement>("[data-cases-item]"));

  const pararTodos = (exceto?: HTMLVideoElement) =>
    raiz.querySelectorAll<HTMLVideoElement>("video[data-cases-video]").forEach((v) => v !== exceto && v.pause());

  const selecionar = (id: string) => {
    slides.forEach((s) => {
      const ativo = s.dataset.id === id;
      s.dataset.ativo = String(ativo);
      s.inert = !ativo;
    });
    itens.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.id === id)));
    pararTodos();
  };

  const tocar = (botao: HTMLButtonElement) => {
    const slide = botao.closest<HTMLElement>("[data-cases-slide]");
    const id = botao.dataset.video ?? "";
    const src = botao.dataset.src;
    if (!slide || !src) return;
    const v = document.createElement("video");
    v.dataset.casesVideo = id;
    v.src = src;
    v.controls = true;
    v.autoplay = true;
    v.playsInline = true;
    v.className = "absolute inset-0 size-full bg-black object-contain";
    v.setAttribute("aria-label", botao.querySelector(".sr-only")?.textContent?.replace("Assistir ao depoimento: ", "Depoimento em vídeo: ") ?? "Depoimento em vídeo");
    const linha = itens.find((b) => b.dataset.id === id);
    v.addEventListener("play", () => pararTodos(v));
    v.addEventListener("timeupdate", () => linha?.style.setProperty("--andamento", String(v.duration ? v.currentTime / v.duration : 0)));
    botao.replaceWith(v);
    v.focus({ preventScroll: true });
    track("depoimento_play", { depoimento: id });
  };

  const onClick = (e: Event) => {
    const alvo = e.target as Element;
    const item = alvo.closest<HTMLButtonElement>("[data-cases-item]");
    if (item && item.dataset.id) {
      selecionar(item.dataset.id);
      // No celular o palco fica acima da lista: traz o vídeo para a tela se ele estiver fora dela.
      if (palco) {
        const r = palco.getBoundingClientRect();
        if (r.bottom < 80 || r.top > innerHeight - 80) palco.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }
    const play = alvo.closest<HTMLButtonElement>("[data-cases-play]");
    if (play) tocar(play);
  };
  raiz.addEventListener("click", onClick);
  return () => raiz.removeEventListener("click", onClick);
}
