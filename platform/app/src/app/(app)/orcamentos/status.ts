import type { Tone } from "@/ui";
import type { QuoteStatus } from "@/modules/quote";

export const STATUS: Record<QuoteStatus, { rotulo: string; tom: Tone; explica: string }> = {
  draft: { rotulo: "Rascunho", tom: "neutral", explica: "Ainda não saiu da clínica." },
  sent: { rotulo: "Enviado", tom: "structure", explica: "Com o paciente, aguardando resposta." },
  negotiating: { rotulo: "Em negociação", tom: "accent", explica: "O paciente respondeu." },
  accepted: { rotulo: "Fechado", tom: "positive", explica: "Aceito e assinado." },
  rejected: { rotulo: "Perdido", tom: "critical", explica: "Recusado, com motivo registrado." },
  expired: { rotulo: "Vencido", tom: "warning", explica: "Passou da validade sem resposta." },
  canceled: { rotulo: "Cancelado", tom: "neutral", explica: "Descartado pela clínica." },
};

/** O que a tela oferece a partir de cada estado. O banco continua decidindo. */
export const PROXIMOS: Record<QuoteStatus, { to: string; rotulo: string; principal?: boolean }[]> = {
  draft: [
    { to: "sent", rotulo: "Enviar ao paciente", principal: true },
    { to: "canceled", rotulo: "Descartar" },
  ],
  sent: [
    { to: "negotiating", rotulo: "Paciente respondeu", principal: true },
    { to: "rejected", rotulo: "Registrar perda" },
    { to: "expired", rotulo: "Marcar vencido" },
  ],
  negotiating: [
    { to: "sent", rotulo: "Enviar nova versão", principal: true },
    { to: "rejected", rotulo: "Registrar perda" },
  ],
  accepted: [],
  rejected: [{ to: "negotiating", rotulo: "Reativar" }],
  expired: [{ to: "negotiating", rotulo: "Reativar" }],
  canceled: [],
};
