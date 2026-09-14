import { describe, expect, it } from "vitest";
import { addMonths, buildInstallments, isOverdue } from "@/domain/installments";

const sum = (list: { amountCents: number }[]) =>
  list.reduce((total, item) => total + item.amountCents, 0);

describe("buildInstallments", () => {
  it("divide o total em parcelas iguais quando não ha sobra", () => {
    const parcels = buildInstallments({
      totalCents: 300_000,
      count: 3,
      firstDueDate: new Date(2026, 0, 10),
    });

    expect(parcels.map((p) => p.amountCents)).toEqual([100_000, 100_000, 100_000]);
    expect(sum(parcels)).toBe(300_000);
  });

  it("joga a sobra de centavos na primeira parcela", () => {
    const parcels = buildInstallments({
      totalCents: 100_001,
      count: 3,
      firstDueDate: new Date(2026, 0, 10),
    });

    expect(parcels.map((p) => p.amountCents)).toEqual([33_335, 33_333, 33_333]);
    expect(sum(parcels)).toBe(100_001);
  });

  it("nunca perde nem cria centavos, em qualquer divisao", () => {
    for (let total = 1; total <= 200; total += 1) {
      for (let count = 1; count <= 12; count += 1) {
        const parcels = buildInstallments({
          totalCents: total * 997,
          count,
          firstDueDate: new Date(2026, 0, 5),
        });
        expect(sum(parcels)).toBe(total * 997);
        expect(parcels).toHaveLength(count);
      }
    }
  });

  it("registra a entrada como primeira parcela e financia o resto", () => {
    const parcels = buildInstallments({
      totalCents: 500_000,
      count: 4,
      firstDueDate: new Date(2026, 2, 15),
      downPaymentCents: 100_000,
    });

    expect(parcels).toHaveLength(5);
    expect(parcels[0].amountCents).toBe(100_000);
    expect(parcels[0].dueDate).toEqual(new Date(2026, 2, 15));
    expect(parcels[1].dueDate).toEqual(new Date(2026, 3, 15));
    expect(sum(parcels)).toBe(500_000);
    expect(parcels.every((p) => p.totalCount === 5)).toBe(true);
  });

  it("devolve lista vazia para orçamento zerado", () => {
    expect(
      buildInstallments({ totalCents: 0, count: 3, firstDueDate: new Date() }),
    ).toEqual([]);
  });

  it("recusa número de parcelas inválido", () => {
    expect(() =>
      buildInstallments({ totalCents: 1000, count: 0, firstDueDate: new Date() }),
    ).toThrow();
  });
});

describe("addMonths", () => {
  it("mantem o dia do vencimento", () => {
    expect(addMonths(new Date(2026, 0, 15), 2)).toEqual(new Date(2026, 2, 15));
  });

  it("ancora no ultimo dia quando o mês destino e mais curto", () => {
    expect(addMonths(new Date(2026, 0, 31), 1)).toEqual(new Date(2026, 1, 28));
    expect(addMonths(new Date(2024, 0, 31), 1)).toEqual(new Date(2024, 1, 29));
  });

  it("atravessa a virada de ano", () => {
    expect(addMonths(new Date(2026, 10, 20), 3)).toEqual(new Date(2027, 1, 20));
  });
});

describe("isOverdue", () => {
  const today = new Date(2026, 5, 10);

  it("não considera atrasada a parcela quitada", () => {
    expect(isOverdue(new Date(2026, 4, 1), 5000, 5000, today)).toBe(false);
  });

  it("marca atraso quando o vencimento passou e falta valor", () => {
    expect(isOverdue(new Date(2026, 4, 1), 0, 5000, today)).toBe(true);
    expect(isOverdue(new Date(2026, 4, 1), 4999, 5000, today)).toBe(true);
  });

  it("não marca atraso no proprio dia do vencimento", () => {
    expect(isOverdue(new Date(2026, 5, 10), 0, 5000, today)).toBe(false);
  });
});
