// Galeria: botões anterior/próxima, contador "03 / 09" e setas do teclado. JavaScript puro (site e prévia);
// funciona também com "reduzir movimento" (aí a rolagem é instantânea). O arraste com inércia fica em motion.ts.
export function iniciarGaleria() {
  const faixa = document.querySelector<HTMLElement>("[data-galeria]");
  if (!faixa) return () => {};
  const itens = Array.from(faixa.querySelectorAll<HTMLElement>("[data-galeria-item]"));
  const atual = document.querySelector<HTMLElement>("[data-galeria-atual]");
  const anterior = document.querySelector<HTMLButtonElement>("[data-galeria-anterior]");
  const proxima = document.querySelector<HTMLButtonElement>("[data-galeria-proxima]");
  const suave = () => (matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth");
  const inicio = () => parseFloat(getComputedStyle(faixa).paddingLeft) || 0;

  // Item cujo começo está mais perto do começo da faixa.
  const indice = () => {
    const base = faixa.getBoundingClientRect().left + inicio();
    let melhor = 0;
    let menor = Infinity;
    itens.forEach((it, i) => {
      const d = Math.abs(it.getBoundingClientRect().left - base);
      if (d < menor) {
        menor = d;
        melhor = i;
      }
    });
    const fim = faixa.scrollLeft >= faixa.scrollWidth - faixa.clientWidth - 2;
    return fim ? itens.length - 1 : melhor;
  };
  const irPara = (i: number) => {
    const alvo = itens[Math.max(0, Math.min(itens.length - 1, i))];
    if (!alvo) return;
    const dx = alvo.getBoundingClientRect().left - faixa.getBoundingClientRect().left - inicio();
    faixa.scrollBy({ left: dx, behavior: suave() });
  };
  const atualizar = () => {
    const i = indice();
    if (atual) atual.textContent = String(i + 1).padStart(2, "0");
    if (anterior) anterior.disabled = faixa.scrollLeft <= 2;
    if (proxima) proxima.disabled = faixa.scrollLeft >= faixa.scrollWidth - faixa.clientWidth - 2;
  };
  const voltar = () => irPara(indice() - 1);
  const avancar = () => irPara(indice() + 1);
  const tecla = (e: KeyboardEvent) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    if (e.key === "ArrowRight") avancar();
    else voltar();
  };
  anterior?.addEventListener("click", voltar);
  proxima?.addEventListener("click", avancar);
  faixa.addEventListener("keydown", tecla);
  faixa.addEventListener("scroll", atualizar, { passive: true });
  atualizar();
  return () => {
    anterior?.removeEventListener("click", voltar);
    proxima?.removeEventListener("click", avancar);
    faixa.removeEventListener("keydown", tecla);
    faixa.removeEventListener("scroll", atualizar);
  };
}
