// Script da prévia em arquivo único (sem servidor, sem React). As animações e o vídeo da abertura são os
// mesmos do site (src/lib/motion.ts e src/lib/video-evento.ts); aqui só ficam as interações que no site o
// React faz: menu, playlist dos depoimentos, botões da galeria, contagem regressiva e o painel de chaves do
// "Para quem é".
import { iniciarBarraAplicar, iniciarCabecalho } from "../../../clube/src/lib/cabecalho";
import { iniciarContagem } from "../../../clube/src/lib/contagem";
import { iniciarDepoimentos } from "../../../clube/src/lib/depoimentos";
import { iniciarGaleria } from "../../../clube/src/lib/galeria";
import { iniciarAnimacoes, iniciarRolagemSuave } from "../../../clube/src/lib/motion";
import { iniciarPerfil } from "../../../clube/src/lib/perfil";
import { iniciarVideoEvento } from "../../../clube/src/lib/video-evento";

declare global {
  interface Window {
    __CLUBE_VIDEOS__?: Record<string, string>;
    __CLUBE_EVENTO__?: string;
  }
}

const $ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) => root.querySelector<T>(sel);
const $$ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) =>
  Array.from(root.querySelectorAll<T>(sel));

function menuCelular() {
  const header = $("[data-header]");
  const menuBtn = $<HTMLButtonElement>('[aria-controls="menu-mobile"]');
  const menu = $<HTMLElement>("#menu-mobile");
  if (!header || !menuBtn || !menu) return;
  const linhas = $$("span span", menuBtn);
  let aberto = false;
  const alternar = (v: boolean) => {
    aberto = v;
    header.dataset.menu = String(v);
    menu.hidden = !v;
    menuBtn.setAttribute("aria-expanded", String(v));
    menuBtn.setAttribute("aria-label", v ? "Fechar menu" : "Abrir menu");
    linhas[0]?.classList.toggle("translate-y-[5px]", v);
    linhas[0]?.classList.toggle("rotate-45", v);
    linhas[1]?.classList.toggle("-translate-y-[5px]", v);
    linhas[1]?.classList.toggle("-rotate-45", v);
  };
  menuBtn.addEventListener("click", () => alternar(!aberto));
  menu.addEventListener("click", (e) => (e.target as Element).closest("a") && alternar(false));
  window.addEventListener("keydown", (e) => e.key === "Escape" && alternar(false));
}

// Vídeo da abertura: a versão embutida entra como fonte única (o site escolhe 480 ou 720 conforme a tela).
function videoAbertura() {
  const video = $<HTMLVideoElement>("[data-video-evento]");
  if (!video || !window.__CLUBE_EVENTO__) return;
  const fonte = document.createElement("source");
  fonte.dataset.src = window.__CLUBE_EVENTO__;
  fonte.type = "video/mp4";
  video.append(fonte);
}

// Depoimentos: na prévia os vídeos vêm embutidos; o palco usa o mesmo script do site (src/lib/depoimentos.ts).
function depoimentos() {
  const fontes = window.__CLUBE_VIDEOS__ ?? {};
  $$<HTMLElement>("[data-cases-play]").forEach((btn) => {
    const id = btn.dataset.video;
    if (!id || !fontes[id]) return;
    btn.dataset.src = fontes[id];
    btn.dataset.previaSrc = fontes[id];
  });
}

function avisoLinks() {
  $$<HTMLAnchorElement>("a[data-previa-link]").forEach((a) =>
    a.addEventListener("click", (e) => {
      e.preventDefault();
      window.alert("Na prévia, esta página não está incluída. No site publicado ela abre normalmente.");
    }),
  );
}

iniciarCabecalho();
iniciarBarraAplicar();
menuCelular();
videoAbertura();
iniciarVideoEvento();
iniciarContagem();
iniciarPerfil();
iniciarGaleria();
depoimentos();
iniciarDepoimentos();
avisoLinks();
iniciarRolagemSuave();
iniciarAnimacoes();
