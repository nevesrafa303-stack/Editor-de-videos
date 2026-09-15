/**
 * Dinheiro em centavos, sempre inteiro.
 *
 * Nada aqui usa ponto flutuante: `0.1 + 0.2` não é `0.3`, e num sistema que
 * cobra de paciente isso vira diferença de centavo que ninguém consegue
 * explicar no fechamento do mês.
 */

/**
 * Divide um valor em parcelas que somam EXATAMENTE o valor.
 *
 * Dividir R$ 2.380,00 em 6 dá R$ 396,666… Arredondar cada parcela para
 * R$ 396,67 e multiplicar por 6 dá R$ 2.380,02 — dois centavos que o paciente
 * não deve e que o caixa nunca fecha.
 *
 * O resto vai para a PRIMEIRA parcela: as seguintes ficam todas iguais, que é
 * o que o paciente confere no extrato, e a diferença é cobrada no começo, com
 * o combinado ainda fresco.
 */
export function parcelar(totalCents: number, parcelas: number): number[] {
  if (!Number.isInteger(totalCents) || totalCents < 0) {
    throw new Error(`Valor inválido para parcelar: ${totalCents}`);
  }
  if (!Number.isInteger(parcelas) || parcelas < 1) {
    throw new Error(`Número de parcelas inválido: ${parcelas}`);
  }

  const base = Math.floor(totalCents / parcelas);
  const resto = totalCents - base * parcelas;

  return Array.from({ length: parcelas }, (_, i) => (i === 0 ? base + resto : base));
}

/** Como a tela resume um parcelamento sem mentir sobre os centavos. */
export function resumoParcelas(totalCents: number, parcelas: number): {
  primeira: number;
  demais: number;
  iguais: boolean;
} {
  const valores = parcelar(totalCents, parcelas);
  const primeira = valores[0] ?? 0;
  const demais = valores[1] ?? primeira;

  return { primeira, demais, iguais: primeira === demais };
}
