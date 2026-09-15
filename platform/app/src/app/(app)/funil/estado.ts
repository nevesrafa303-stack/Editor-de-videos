/**
 * Vocabulario do funil, num lugar so.
 *
 * O quadro, a ficha e a fila de pendencias falam das mesmas coisas — esfriando,
 * atrasado, tipo de contato — e precisam falar igual.
 */
import type { Tone } from "@/ui";
import type { ActivityKind, TaskPriority } from "@/modules/funnel";

export const CONTATO: Record<ActivityKind | "stage_change" | "system", string> = {
  note: "Anotação",
  call: "Ligação",
  whatsapp: "Mensagem",
  email: "E-mail",
  meeting: "Reunião",
  visit: "Visita",
  stage_change: "Mudança de etapa",
  system: "Sistema",
};

export const PRIORIDADE: Record<TaskPriority, { rotulo: string; tom: Tone }> = {
  low: { rotulo: "Pode esperar", tom: "neutral" },
  normal: { rotulo: "Normal", tom: "neutral" },
  high: { rotulo: "Urgente", tom: "critical" },
};

/**
 * Como a tela fala do tempo sem contato.
 *
 * "12 dias" nao alarma ninguem; "parado há 12 dias" alarma. E negocio que nunca
 * foi tocado nao e "novo demais para cobrar" — e exatamente o que se perde por
 * silencio, entao ele aparece com o mesmo peso.
 */
export function semContato(dias: number | null, esfriando: boolean): {
  texto: string;
  tom: Tone;
} {
  if (dias === null) return { texto: "sem contato", tom: esfriando ? "warning" : "neutral" };
  if (dias === 0) return { texto: "falado hoje", tom: "positive" };
  if (dias === 1) return { texto: "ontem", tom: "positive" };
  return {
    texto: `${dias} dias`,
    tom: esfriando ? "warning" : "neutral",
  };
}

/** Quanto falta (ou passou) para a próxima ação. */
export function prazoDaAcao(quando: Date | null): { texto: string; tom: Tone } | null {
  if (!quando) return null;

  const horas = Math.round((quando.getTime() - Date.now()) / 3_600_000);

  if (horas < -24) return { texto: `atrasada ${Math.floor(-horas / 24)} d`, tom: "critical" };
  if (horas < 0) return { texto: "atrasada", tom: "critical" };
  if (horas < 24) return { texto: "hoje", tom: "warning" };
  if (horas < 48) return { texto: "amanhã", tom: "warning" };
  return { texto: `em ${Math.floor(horas / 24)} d`, tom: "neutral" };
}
