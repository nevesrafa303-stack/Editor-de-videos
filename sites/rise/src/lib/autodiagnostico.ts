// Autodiagnóstico da seção "Para quem é": a pessoa marca o que acontece na agência dela, o medidor enche
// e a resposta muda; com 3 ou mais marcados aparece o botão de aplicação. JavaScript puro (site e prévia).
import { track } from "./tracking";

export function iniciarAutodiagnostico() {
  const raiz = document.querySelector<HTMLElement>("[data-auto]");
  if (!raiz) return () => {};
  const caixas = Array.from(raiz.querySelectorAll<HTMLInputElement>('input[type="checkbox"]'));
  const contagem = raiz.querySelector<HTMLElement>("[data-auto-contagem]");
  const barra = raiz.querySelector<HTMLElement>("[data-auto-barra]");
  const resposta = raiz.querySelector<HTMLElement>("[data-auto-resposta]");
  const cta = raiz.querySelector<HTMLElement>("[data-auto-cta]");
  const respostas: string[] = JSON.parse(raiz.dataset.respostas || "[]");

  const atualizar = (registrar: boolean) => {
    const n = caixas.filter((c) => c.checked).length;
    if (contagem) contagem.textContent = String(n);
    if (barra) barra.style.transform = `scaleX(${caixas.length ? n / caixas.length : 0})`;
    const faixa = n === 0 ? 0 : n < 3 ? 1 : n < 6 ? 2 : 3;
    if (resposta && respostas[faixa]) resposta.textContent = respostas[faixa];
    raiz.dataset.faixa = String(faixa);
    if (cta) cta.hidden = n < 3;
    if (registrar) track("autodiagnostico", { marcados: n, total: caixas.length });
  };
  const onChange = () => atualizar(true);
  raiz.addEventListener("change", onChange);
  atualizar(false);
  return () => raiz.removeEventListener("change", onChange);
}
