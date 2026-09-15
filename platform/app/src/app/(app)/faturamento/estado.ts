/**
 * Vocabulario de faturamento, num lugar so.
 *
 * Guia, lote e glosa tem estados que so fazem sentido juntos: uma guia
 * "enviada" e uma guia cujo LOTE saiu. Escrever o rotulo em cada tela deixaria
 * as tres contando historias ligeiramente diferentes do mesmo momento.
 */
import type { Tone } from "@/ui";
import type { BatchStatus, ClaimStatus, DenialStatus } from "@/modules/claim";

export const GUIA: Record<ClaimStatus, { rotulo: string; tom: Tone }> = {
  open: { rotulo: "A faturar", tom: "warning" },
  batched: { rotulo: "Em lote", tom: "accent" },
  submitted: { rotulo: "Enviada", tom: "structure" },
  settled: { rotulo: "Conferida", tom: "positive" },
  canceled: { rotulo: "Cancelada", tom: "neutral" },
};

export const LOTE: Record<BatchStatus, { rotulo: string; tom: Tone }> = {
  open: { rotulo: "Montando", tom: "warning" },
  submitted: { rotulo: "Enviado", tom: "structure" },
  settled: { rotulo: "Conferido", tom: "positive" },
  canceled: { rotulo: "Cancelado", tom: "neutral" },
};

export const GLOSA: Record<DenialStatus, { rotulo: string; tom: Tone }> = {
  open: { rotulo: "Sem recurso", tom: "critical" },
  appealed: { rotulo: "Recorrida", tom: "accent" },
  recovered: { rotulo: "Recuperada", tom: "positive" },
  written_off: { rotulo: "Perda aceita", tom: "neutral" },
  expired: { rotulo: "Prazo vencido", tom: "critical" },
};

/**
 * Como a tela fala do prazo.
 *
 * Numero de dias sozinho nao alarma ninguem; "vence amanha" alarma. E o prazo
 * vencido nao some da lista: ele vira a linha mais importante dela.
 */
export function prazo(dias: number | null): { texto: string; tom: Tone } {
  if (dias === null) return { texto: "sem prazo", tom: "neutral" };
  if (dias < 0) return { texto: `venceu há ${Math.abs(dias)} d`, tom: "critical" };
  if (dias === 0) return { texto: "vence hoje", tom: "critical" };
  if (dias === 1) return { texto: "vence amanhã", tom: "critical" };
  if (dias <= 7) return { texto: `${dias} dias`, tom: "warning" };
  return { texto: `${dias} dias`, tom: "neutral" };
}

/** "2026-09-01" -> "set/2026". Competencia e mes, nao dia. */
export function competencia(iso: string): string {
  const [ano, mes] = iso.split("-");
  const nomes = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  return `${nomes[Number(mes) - 1] ?? mes}/${ano}`;
}
