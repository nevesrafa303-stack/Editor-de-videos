// "Para quem é": a pessoa liga as chaves que valem para a agência dela; o medidor enche, a resposta muda e,
// com 3 ou mais ligadas, aparece o botão de ingresso. JavaScript puro (site e prévia).
import { track } from "./tracking";

export function iniciarPerfil() {
  const raiz = document.querySelector<HTMLElement>("[data-perfil]");
  if (!raiz) return () => {};
  const chaves = Array.from(raiz.querySelectorAll<HTMLButtonElement>('[role="switch"]'));
  const contagem = raiz.querySelector<HTMLElement>("[data-perfil-contagem]");
  const barra = raiz.querySelector<HTMLElement>("[data-perfil-barra]");
  const resposta = raiz.querySelector<HTMLElement>("[data-perfil-resposta]");
  const cta = raiz.querySelector<HTMLElement>("[data-perfil-cta]");
  const respostas: string[] = JSON.parse(raiz.dataset.respostas || "[]");

  const atualizar = () => {
    const n = chaves.filter((c) => c.getAttribute("aria-checked") === "true").length;
    if (contagem) contagem.textContent = String(n);
    if (barra) barra.style.transform = `scaleX(${chaves.length ? n / chaves.length : 0})`;
    const faixa = n === 0 ? 0 : n < 3 ? 1 : n < chaves.length ? 2 : 3;
    if (resposta && respostas[faixa]) resposta.textContent = respostas[faixa];
    raiz.dataset.faixa = String(faixa);
    if (cta) cta.hidden = n < 3;
    return n;
  };
  const onClick = (e: Event) => {
    const chave = (e.target as Element).closest<HTMLButtonElement>('[role="switch"]');
    if (!chave || !raiz.contains(chave)) return;
    chave.setAttribute("aria-checked", String(chave.getAttribute("aria-checked") !== "true"));
    const n = atualizar();
    track("perfil_imersao", { ligadas: n, total: chaves.length });
  };
  raiz.addEventListener("click", onClick);
  atualizar();
  return () => raiz.removeEventListener("click", onClick);
}
