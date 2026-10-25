// Link do formulário de aplicação (Respondi). Os parâmetros de campanha da primeira página vista na
// sessão (UTMs e click IDs) vão junto no link, para o time de tráfego saber de onde veio cada aplicação.
import { lerRastreio } from "./tracking";

export const FORM_URL = process.env.NEXT_PUBLIC_FORM_URL || "https://form.respondi.app/BPhjlgeA";

export const rastreioChaves = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "gclid",
  "fbclid",
] as const;

/** Acrescenta os parâmetros de campanha guardados aos links marcados com data-aplicar. */
export function atualizarLinksAplicacao() {
  const dados = lerRastreio();
  const params = rastreioChaves.filter((k) => dados[k]);
  if (!params.length) return;
  document.querySelectorAll<HTMLAnchorElement>("a[data-aplicar]").forEach((a) => {
    const url = new URL(a.href);
    params.forEach((k) => url.searchParams.set(k, dados[k]));
    a.href = url.toString();
  });
}
