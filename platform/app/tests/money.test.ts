/**
 * Divisão de dinheiro. Teste puro, sem banco.
 *
 * Existe porque a tela mostrava "6x de R$ 396,67" para um total de
 * R$ 2.380,00 — seis vezes isso dá R$ 2.380,02. Dois centavos que o paciente
 * não deve e que o caixa nunca fecha.
 */
import { describe, expect, it } from "vitest";
import { centavosDeTexto, parcelar, resumoParcelas } from "@/shared/money";

describe("parcelar", () => {
  it("as parcelas somam exatamente o total", () => {
    for (const total of [238000, 100000, 1, 99, 333333, 700007]) {
      for (const n of [1, 2, 3, 6, 7, 12, 48]) {
        const parcelas = parcelar(total, n);
        expect(parcelas).toHaveLength(n);
        expect(parcelas.reduce((a, b) => a + b, 0)).toBe(total);
      }
    }
  });

  it("o resto fica na primeira, e as demais ficam iguais", () => {
    expect(parcelar(238000, 6)).toEqual([39670, 39666, 39666, 39666, 39666, 39666]);
  });

  it("divisao exata nao inventa diferenca", () => {
    expect(parcelar(120000, 3)).toEqual([40000, 40000, 40000]);
  });

  it("uma parcela e o total", () => {
    expect(parcelar(12345, 1)).toEqual([12345]);
  });

  it("valor zero nao quebra", () => {
    expect(parcelar(0, 4)).toEqual([0, 0, 0, 0]);
  });

  it("recusa entrada que nao e centavo inteiro", () => {
    expect(() => parcelar(100.5, 2)).toThrow(/inválido/i);
    expect(() => parcelar(100, 0)).toThrow(/inválido/i);
  });
});

describe("resumoParcelas", () => {
  it("avisa quando a primeira e diferente", () => {
    expect(resumoParcelas(238000, 6)).toEqual({
      primeira: 39670,
      demais: 39666,
      iguais: false,
    });
  });

  it("e quando sao todas iguais", () => {
    expect(resumoParcelas(120000, 3)).toEqual({
      primeira: 40000,
      demais: 40000,
      iguais: true,
    });
  });
});

/**
 * Existiam tres copias deste parser, em `server-actions` diferentes, e elas ja
 * tinham divergido: "1.234" virava R$ 1.234,00 numa tela e R$ 1,23 na outra. O
 * teste trava a leitura pt-BR num lugar so.
 */
describe("centavosDeTexto", () => {
  it("le o que a recepcao digita de verdade", () => {
    expect(centavosDeTexto("1.234,56")).toBe(123456);
    expect(centavosDeTexto("R$ 1.234,56")).toBe(123456);
    expect(centavosDeTexto("1234,56")).toBe(123456);
    expect(centavosDeTexto("1234.56")).toBe(123456);
    expect(centavosDeTexto("280")).toBe(28000);
    expect(centavosDeTexto("0,01")).toBe(1);
  });

  it("ponto separando milhar nao vira decimal", () => {
    expect(centavosDeTexto("1.234")).toBe(123400);
    expect(centavosDeTexto("12.345.678")).toBe(1234567800);
  });

  it("mas ponto com um ou dois digitos continua sendo decimal", () => {
    expect(centavosDeTexto("1.23")).toBe(123);
    expect(centavosDeTexto("1.2")).toBe(120);
  });

  it("branco e lixo valem zero, nunca NaN", () => {
    expect(centavosDeTexto("")).toBe(0);
    expect(centavosDeTexto(null)).toBe(0);
    expect(centavosDeTexto("abc")).toBe(0);
    expect(centavosDeTexto("R$")).toBe(0);
  });

  it("arredonda o centavo em vez de truncar", () => {
    expect(centavosDeTexto("1,005")).toBe(101);
    expect(centavosDeTexto("1,004")).toBe(100);
  });
});
