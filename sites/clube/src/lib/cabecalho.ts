// Comportamento do cabeçalho na rolagem, em JavaScript puro (usado pelo Header e pela prévia):
// data-rolou: fundo aparece depois do topo; data-oculto: some ao descer e volta ao subir;
// [data-progresso]: barra dourada com o quanto da página já foi lido;
// [data-nav-link]: o link da seção que está na tela fica marcado (data-ativo).
export function iniciarCabecalho() {
  const header = document.querySelector<HTMLElement>("[data-header]");
  if (!header) return () => {};
  const barra = header.querySelector<HTMLElement>("[data-progresso]");
  let anterior = window.scrollY;
  let agendado = false;

  const atualizar = () => {
    agendado = false;
    const y = window.scrollY;
    const menuAberto = header.dataset.menu === "true";
    header.dataset.rolou = String(y > 24);
    if (Math.abs(y - anterior) > 6) {
      header.dataset.oculto = String(!menuAberto && y > anterior && y > 480);
      anterior = y;
    }
    if (barra) {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      barra.style.transform = `scaleX(${max > 0 ? Math.min(1, y / max) : 0})`;
    }
  };
  const agendar = () => {
    if (!agendado) {
      agendado = true;
      requestAnimationFrame(atualizar);
    }
  };
  // Foco por teclado dentro do cabeçalho sempre o traz de volta.
  const mostrar = () => (header.dataset.oculto = "false");

  // Seção na tela: a que cruza a faixa do meio da janela.
  const links = Array.from(header.querySelectorAll<HTMLAnchorElement>("[data-nav-link]"));
  const secoes = links
    .map((a) => document.querySelector<HTMLElement>(a.getAttribute("href") ?? ""))
    .filter((s): s is HTMLElement => Boolean(s));
  const espia = new IntersectionObserver(
    (entradas) => {
      entradas.forEach((e) => {
        if (!e.isIntersecting) return;
        links.forEach((a) => (a.dataset.ativo = String(a.getAttribute("href") === `#${e.target.id}`)));
      });
    },
    { rootMargin: "-45% 0px -50% 0px" },
  );
  secoes.forEach((s) => espia.observe(s));
  // Antes da primeira seção do menu, nenhum link fica marcado.
  const topo = new IntersectionObserver(([e]) => e.isIntersecting && links.forEach((a) => (a.dataset.ativo = "false")), {
    rootMargin: "0px 0px -60% 0px",
  });
  const hero = document.querySelector("#topo");
  if (hero) topo.observe(hero);

  atualizar();
  window.addEventListener("scroll", agendar, { passive: true });
  window.addEventListener("resize", agendar);
  header.addEventListener("focusin", mostrar);
  return () => {
    window.removeEventListener("scroll", agendar);
    window.removeEventListener("resize", agendar);
    header.removeEventListener("focusin", mostrar);
    espia.disconnect();
    topo.disconnect();
  };
}

/** Celular: barra fixa com o botão de ingresso. Some enquanto a abertura, a seção de ingressos ou a
 *  chamada final estão na tela, para não repetir o botão que já está ali. */
export function iniciarBarraAplicar() {
  const barra = document.querySelector<HTMLElement>("[data-barra-aplicar]");
  const alvos = ["#topo", "#ingressos", "#agir"]
    .map((s) => document.querySelector(s))
    .filter((e): e is Element => Boolean(e));
  if (!barra || !alvos.length) return () => {};
  const visiveis = new Set<Element>();
  const obs = new IntersectionObserver((entradas) => {
    entradas.forEach((e) => (e.isIntersecting ? visiveis.add(e.target) : visiveis.delete(e.target)));
    const mostrar = visiveis.size === 0;
    barra.dataset.visivel = String(mostrar);
    barra.inert = !mostrar;
  });
  alvos.forEach((a) => obs.observe(a));
  return () => obs.disconnect();
}
