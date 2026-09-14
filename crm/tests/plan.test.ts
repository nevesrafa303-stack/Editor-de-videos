import { describe, expect, it } from "vitest";
import { planProgress, planTotals } from "@/domain/plan";
import { parseBRL, formatBRL, percentOf } from "@/lib/money";

describe("planTotals", () => {
  it("soma itens considerando quantidade", () => {
    const totals = planTotals([
      { quantity: 2, unitPriceCents: 45_000 },
      { quantity: 1, unitPriceCents: 120_000 },
    ]);

    expect(totals.subtotalCents).toBe(210_000);
    expect(totals.totalCents).toBe(210_000);
    expect(totals.itemCount).toBe(2);
  });

  it("aplica desconto sem deixar o total negativo", () => {
    const totals = planTotals([{ quantity: 1, unitPriceCents: 50_000 }], 80_000);
    expect(totals.discountCents).toBe(50_000);
    expect(totals.totalCents).toBe(0);
  });

  it("dilui o desconto no valor já executado", () => {
    const totals = planTotals(
      [
        { quantity: 1, unitPriceCents: 100_000, done: true },
        { quantity: 1, unitPriceCents: 100_000 },
      ],
      20_000,
    );

    expect(totals.totalCents).toBe(180_000);
    expect(totals.executedCents).toBe(90_000);
    expect(planProgress(totals)).toBe(50);
  });

  it("plano vazio não quebra", () => {
    const totals = planTotals([]);
    expect(totals.totalCents).toBe(0);
    expect(planProgress(totals)).toBe(0);
  });
});

describe("parseBRL", () => {
  it("le o formato brasileiro", () => {
    expect(parseBRL("1.234,56")).toBe(123_456);
    expect(parseBRL("R$ 89,90")).toBe(8_990);
    expect(parseBRL("1200")).toBe(120_000);
  });

  it("le o formato americano", () => {
    expect(parseBRL("1234.56")).toBe(123_456);
  });

  it("devolve zero para entrada vazia ou inválida", () => {
    expect(parseBRL("")).toBe(0);
    expect(parseBRL(null)).toBe(0);
    expect(parseBRL("abc")).toBe(0);
  });

  it("aceita número direto", () => {
    expect(parseBRL(12.5)).toBe(1250);
  });
});

describe("formatBRL", () => {
  it("formata centavos em reais", () => {
    expect(formatBRL(123_456).replace(/ /g, " ")).toBe("R$ 1.234,56");
  });
});

describe("percentOf", () => {
  it("calcula comissão arredondando ao centavo", () => {
    expect(percentOf(100_000, 30)).toBe(30_000);
    expect(percentOf(33_333, 10)).toBe(3_333);
  });
});
