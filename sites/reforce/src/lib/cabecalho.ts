// Comportamento do cabeçalho na rolagem, em JavaScript puro (usado pelo Header e pela prévia):
// data-rolou: fundo aparece depois do topo; data-oculto: some ao descer e volta ao subir;
// [data-progresso]: barra em degradê com o "avanço físico" da leitura (e o número em [data-avanco]);
// [data-nav-link]: o link da seção que está na tela fica marcado (data-ativo).
export function iniciarCabecalho() {
  const header = document.querySelector<HTMLElement>("[data-header]");
  if (!header) return () => {};
  const barra = header.querySelector<HTMLElement>("[data-progresso]");
  const avanco = header.querySelector<HTMLElement>("[data-avanco]");
  let anterior = window.scrollY;
  let agendado = false;

  const atualizar = () => {
    agendado = false;
    const y = window.scrollY;
    const menuAberto = header.dataset.menu === "true";
    header.dataset.rolou = String(y > 24);
    if (Math.abs(y - anterior) > 6) {
      header.dataset.oculto = String(!menuAberto && y > anterior && y > 520);
      anterior = y;
    }
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const p = max > 0 ? Math.min(1, y / max) : 0;
    if (barra) barra.style.transform = `scaleX(${p})`;
    if (avanco) avanco.textContent = `${Math.round(p * 100)}%`;
  };
  const agendar = () => {
    if (!agendado) {
      agendado = true;
      requestAnimationFrame(atualizar);
    }
  };
  // Foco por teclado dentro do cabeçalho sempre o traz de volta.
  const mostrar = () => (header.dataset.oculto = "false");

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

/** Menu do celular, em JavaScript puro (também usado pela prévia em arquivo único). */
export function iniciarMenu() {
  const header = document.querySelector<HTMLElement>("[data-header]");
  const botao = document.querySelector<HTMLButtonElement>('[aria-controls="menu-mobile"]');
  const menu = document.querySelector<HTMLElement>("#menu-mobile");
  if (!header || !botao || !menu) return () => {};
  const alternar = (aberto: boolean) => {
    header.dataset.menu = String(aberto);
    menu.hidden = !aberto;
    botao.setAttribute("aria-expanded", String(aberto));
    botao.setAttribute("aria-label", aberto ? "Fechar menu" : "Abrir menu");
  };
  const clique = () => alternar(botao.getAttribute("aria-expanded") !== "true");
  const link = (e: Event) => (e.target as Element).closest("a") && alternar(false);
  const tecla = (e: KeyboardEvent) => e.key === "Escape" && alternar(false);
  botao.addEventListener("click", clique);
  menu.addEventListener("click", link);
  window.addEventListener("keydown", tecla);
  return () => {
    botao.removeEventListener("click", clique);
    menu.removeEventListener("click", link);
    window.removeEventListener("keydown", tecla);
  };
}
