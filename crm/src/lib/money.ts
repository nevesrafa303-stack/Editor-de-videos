/** Todo valor monetario do sistema e um inteiro em centavos. */

const BRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function formatBRL(cents: number): string {
  return BRL.format(cents / 100);
}

/** Formata sem o simbolo, para uso dentro de inputs. */
export function centsToInput(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",");
}

/**
 * Le um valor digitado por um humano ("1.234,56", "1234.56", "R$ 89").
 * Devolve centavos. Entrada inválida vira 0.
 */
export function parseBRL(input: string | number | null | undefined): number {
  if (typeof input === "number") return Math.round(input * 100);
  if (!input) return 0;

  const cleaned = String(input)
    .replace(/[^\d,.-]/g, "")
    .trim();
  if (!cleaned) return 0;

  const lastComma = cleaned.lastIndexOf(",");
  const lastDot = cleaned.lastIndexOf(".");
  let normalized: string;

  if (lastComma > lastDot) {
    // pt-BR: ponto e milhar, virgula e decimal.
    normalized = cleaned.replace(/\./g, "").replace(",", ".");
  } else if (lastDot > lastComma) {
    normalized = cleaned.replace(/,/g, "");
  } else {
    normalized = cleaned;
  }

  const value = Number(normalized);
  return Number.isFinite(value) ? Math.round(value * 100) : 0;
}

export function percentOf(cents: number, pct: number): number {
  return Math.round((cents * pct) / 100);
}
