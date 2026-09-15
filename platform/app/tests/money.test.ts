/**
 * Divisão de dinheiro. Teste puro, sem banco.
 *
 * Existe porque a tela mostrava "6x de R$ 396,67" para um total de
 * R$ 2.380,00 — seis vezes isso dá R$ 2.380,02. Dois centavos que o paciente
 * não deve e que o caixa nunca fecha.
 */
import { describe, expect, it } from "vitest";
import { parcelar, resumoParcelas } from "@/shared/money";

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
