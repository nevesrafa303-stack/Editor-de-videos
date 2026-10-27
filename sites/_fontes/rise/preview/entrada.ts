// Script da prévia em arquivo único (sem servidor, sem React). As animações são as mesmas do site
// (src/lib/motion.ts); aqui só ficam as interações que no site o React faz: menu, vídeos e prints.
import { atualizarLinksAplicacao, rastreioChaves } from "../../../rise/src/lib/aplicacao";
import { iniciarAutodiagnostico } from "../../../rise/src/lib/autodiagnostico";
import { iniciarBarraAplicar, iniciarCabecalho } from "../../../rise/src/lib/cabecalho";
import { iniciarAnimacoes, iniciarRolagemSuave } from "../../../rise/src/lib/motion";
import { guardarRastreio } from "../../../rise/src/lib/tracking";

declare global {
  interface Window {
    __RISE_VIDEOS__?: Record<string, string>;
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

function videos() {
  const fontes = window.__RISE_VIDEOS__ ?? {};
  // Prévia muda ao passar o mouse (src/lib/efeitos.ts) usa o mesmo vídeo embutido.
  $$<HTMLElement>("[data-video]").forEach((btn) => {
    const id = btn.dataset.video;
    if (id && fontes[id]) btn.dataset.previaSrc = fontes[id];
  });
  $$<HTMLButtonElement>("figure button[data-video]").forEach((btn) => {
    const id = btn.dataset.video;
    if (!id || !fontes[id]) return;
    btn.addEventListener("click", () => {
      const v = document.createElement("video");
      v.src = fontes[id];
      v.controls = true;
      v.autoplay = true;
      v.playsInline = true;
      v.className = "size-full object-contain";
      v.addEventListener("play", () => $$<HTMLVideoElement>("figure video").forEach((o) => o !== v && o.pause()));
      btn.replaceWith(v);
    });
  });
}

// "Ver o print" das placas: o botão vem logo antes do diálogo com a imagem.
function prints() {
  $$<HTMLDialogElement>("[data-placa] dialog").forEach((d) => {
    const btn = d.previousElementSibling as HTMLButtonElement | null;
    btn?.addEventListener("click", () => d.showModal());
    d.addEventListener("click", (e) => e.target === d && d.close());
    $('button[aria-label="Fechar"]', d)?.addEventListener("click", () => d.close());
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

guardarRastreio(rastreioChaves);
atualizarLinksAplicacao();
iniciarCabecalho();
iniciarBarraAplicar();
iniciarAutodiagnostico();
menuCelular();
videos();
prints();
avisoLinks();
iniciarRolagemSuave();
iniciarAnimacoes();
