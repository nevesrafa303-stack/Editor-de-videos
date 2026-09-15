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

/**
 * "1.234,56" vira 123456.
 *
 * Dinheiro entra por campo de texto e sai em centavo inteiro. Esta funcao e
 * unica de proposito: existiam tres copias em `server-actions` diferentes, e
 * elas ja tinham divergido — uma lia "1.234" como mil duzentos e trinta e
 * quatro, outra como um real e vinte e tres. O mesmo numero digitado em duas
 * telas virava dois valores.
 *
 * A leitura e pt-BR, porque e o que a recepcao digita:
 *
 * - com virgula, a virgula e o decimal e o ponto e milhar: "1.234,56" -> 123456
 * - sem virgula, ponto so e milhar quando separa grupos de tres: "1.234" ->
 *   123400, mas "1.23" -> 123 e "1234.56" -> 123456
 *
 * Texto que nao vira numero devolve 0 em vez de `NaN`: um campo em branco e um
 * campo com lixo significam a mesma coisa para quem preenche, e `NaN` chegando
 * ao banco viraria erro de coluna, nao mensagem de tela.
 *
 * A conta e feita em INTEIRO, digito a digito, e nao por `Number(x) * 100`.
 * Multiplicar por 100 e arredondar parece equivalente e nao e: `1,005` vira
 * `100.49999999999999` em ponto flutuante, e o centavo some. As tres copias
 * anteriores desta funcao tinham esse furo.
 */
export function centavosDeTexto(valor: unknown): number {
  const texto = String(valor ?? "").trim();
  if (!texto) return 0;

  const limpo = texto.replace(/[^\d,.-]/g, "");
  if (!limpo) return 0;

  const normalizado = limpo.includes(",")
    ? limpo.replace(/\./g, "").replace(",", ".")
    : /^-?\d{1,3}(\.\d{3})+$/.test(limpo)
      ? limpo.replace(/\./g, "")
      : limpo;

  const negativo = normalizado.startsWith("-");
  const [inteiro = "", decimal = ""] = normalizado.replace(/^-/, "").split(".");
  if (!/^\d*$/.test(inteiro)) return 0;

  // Tres casas: as duas primeiras sao o centavo, a terceira so decide o
  // arredondamento.
  const casas = `${decimal.replace(/\D/g, "")}000`.slice(0, 3);
  const reais = Number(inteiro || "0");
  if (!Number.isSafeInteger(reais)) return 0;

  const centavos = reais * 100 + Number(casas.slice(0, 2)) + (Number(casas[2]) >= 5 ? 1 : 0);
  return negativo ? -centavos : centavos;
}
