/** Calculo de orçamento (plano de tratamento). */

export type PlanItemLike = {
  quantity: number;
  unitPriceCents: number;
  done?: boolean;
};

export type PlanTotals = {
  /** Soma dos itens, antes do desconto. */
  subtotalCents: number;
  discountCents: number;
  /** Subtotal menos desconto, nunca negativo. */
  totalCents: number;
  /** Valor já executado (itens marcados como feitos), proporcional ao desconto. */
  executedCents: number;
  itemCount: number;
  doneCount: number;
};

export function planTotals(
  items: PlanItemLike[],
  discountCents = 0,
): PlanTotals {
  const subtotalCents = items.reduce(
    (sum, item) => sum + item.quantity * item.unitPriceCents,
    0,
  );
  const discount = Math.min(Math.max(discountCents, 0), subtotalCents);
  const totalCents = subtotalCents - discount;

  const doneSubtotal = items
    .filter((item) => item.done)
    .reduce((sum, item) => sum + item.quantity * item.unitPriceCents, 0);

  // O desconto e diluido proporcionalmente entre os itens executados.
  const executedCents =
    subtotalCents === 0
      ? 0
      : Math.round((doneSubtotal * totalCents) / subtotalCents);

  return {
    subtotalCents,
    discountCents: discount,
    totalCents,
    executedCents,
    itemCount: items.length,
    doneCount: items.filter((item) => item.done).length,
  };
}

/** Percentual de execucao do plano, 0-100. */
export function planProgress(totals: PlanTotals): number {
  if (totals.totalCents === 0) return totals.itemCount > 0 && totals.doneCount === totals.itemCount ? 100 : 0;
  return Math.round((totals.executedCents / totals.totalCents) * 100);
}
