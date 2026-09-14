/** Geracao de parcelas a receber a partir de um orçamento aprovado. */

export type PlannedInstallment = {
  number: number;
  totalCount: number;
  amountCents: number;
  dueDate: Date;
};

export type InstallmentPlanInput = {
  totalCents: number;
  count: number;
  /** Vencimento da primeira parcela. */
  firstDueDate: Date;
  /** Entrada paga no ato, descontada do total antes do parcelamento. */
  downPaymentCents?: number;
};

/**
 * Divide o total em `count` parcelas mensais.
 *
 * A sobra de centavos vai para a PRIMEIRA parcela, que e a prática de mercado:
 * as parcelas seguintes ficam com valores redondos e iguais entre si.
 * Se houver entrada, ela vira a parcela 1 com vencimento no mesmo dia.
 */
export function buildInstallments({
  totalCents,
  count,
  firstDueDate,
  downPaymentCents = 0,
}: InstallmentPlanInput): PlannedInstallment[] {
  if (totalCents <= 0) return [];
  if (count < 1) throw new Error("O número de parcelas deve ser no mínimo 1.");

  const down = Math.min(Math.max(downPaymentCents, 0), totalCents);
  const financed = totalCents - down;
  const result: PlannedInstallment[] = [];
  const totalCount = down > 0 ? count + 1 : count;

  if (down > 0) {
    result.push({
      number: 1,
      totalCount,
      amountCents: down,
      dueDate: firstDueDate,
    });
  }

  if (financed > 0) {
    const base = Math.floor(financed / count);
    const remainder = financed - base * count;

    for (let i = 0; i < count; i += 1) {
      result.push({
        number: result.length + 1,
        totalCount,
        amountCents: i === 0 ? base + remainder : base,
        dueDate: addMonths(firstDueDate, down > 0 ? i + 1 : i),
      });
    }
  }

  return result.map((installment) => ({
    ...installment,
    totalCount: result.length,
  }));
}

/**
 * Soma meses preservando o dia do vencimento. Dia 31 em mês curto cai no
 * último dia do mês (31/01 + 1 mês = 28/02), nunca vaza para o mês seguinte.
 */
export function addMonths(date: Date, months: number): Date {
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();

  const lastDayOfTarget = new Date(year, month + months + 1, 0).getDate();
  return new Date(
    year,
    month + months,
    Math.min(day, lastDayOfTarget),
    date.getHours(),
    date.getMinutes(),
  );
}

export function isOverdue(dueDate: Date, paidCents: number, amountCents: number, today = new Date()): boolean {
  if (paidCents >= amountCents) return false;
  const due = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
  const ref = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return due < ref;
}
