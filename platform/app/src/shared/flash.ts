/**
 * Recado que sobrevive ao recarregamento da pagina.
 *
 * Mensagem de sucesso presa ao formulario some quando a linha some — e a linha
 * some justamente no caso de sucesso: parcela quitada sai do recorte "em
 * aberto", caixa recem-aberto troca o formulario pela gaveta. A pessoa clica,
 * tudo muda, e nada confirma o que aconteceu.
 *
 * Por isso o recado viaja na URL e e desenhado pela pagina, que continua
 * existindo depois da acao.
 */
export const FLASH = "aviso";

export function comAviso(url: string, mensagem: string): string {
  const separador = url.includes("?") ? "&" : "?";
  return `${url}${separador}${FLASH}=${encodeURIComponent(mensagem)}`;
}

/** Limite defensivo: a URL nao e lugar para texto longo, nem para HTML. */
export function lerAviso(valor: string | undefined): string | null {
  if (!valor) return null;
  const limpo = valor.replace(/[<>]/g, "").trim();
  return limpo.length > 0 && limpo.length <= 240 ? limpo : null;
}
