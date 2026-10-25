// Comportamento do cabeçalho na rolagem, em JavaScript puro (usado pelo Header e pela prévia):
// data-rolou: fundo aparece depois do topo; data-oculto: some ao descer e volta ao subir;
// [data-progresso]: barra dourada com o quanto da página já foi lido.
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

  atualizar();
  window.addEventListener("scroll", agendar, { passive: true });
  window.addEventListener("resize", agendar);
  header.addEventListener("focusin", mostrar);
  return () => {
    window.removeEventListener("scroll", agendar);
    window.removeEventListener("resize", agendar);
    header.removeEventListener("focusin", mostrar);
  };
}
