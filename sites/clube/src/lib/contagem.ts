// Contagem regressiva para o evento (JavaScript puro, site e prévia). Fica escondida se a data já passou.
export function iniciarContagem() {
  const els = Array.from(document.querySelectorAll<HTMLElement>("[data-contagem]"));
  if (!els.length) return () => {};
  const atualizar = () => {
    els.forEach((el) => {
      const falta = new Date(el.dataset.contagem!).getTime() - Date.now();
      const saida = el.querySelector<HTMLElement>("[data-contagem-texto]");
      if (!(falta > 0) || !saida) return (el.hidden = true);
      const dias = Math.floor(falta / 86400000);
      const horas = Math.floor((falta % 86400000) / 3600000);
      saida.textContent = dias > 0 ? `Faltam ${dias} ${dias === 1 ? "dia" : "dias"} e ${horas}h` : `Faltam ${horas}h`;
      el.hidden = false;
    });
  };
  atualizar();
  const t = window.setInterval(atualizar, 60000);
  return () => window.clearInterval(t);
}
