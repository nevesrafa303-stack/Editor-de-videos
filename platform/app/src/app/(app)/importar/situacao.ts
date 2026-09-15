import type { Tone } from "@/ui";
import type { ImportStatus, RowStatus } from "@/modules/import";

export const SITUACAO: Record<ImportStatus, { rotulo: string; tom: Tone }> = {
  analyzing: { rotulo: "Analisando", tom: "neutral" },
  ready: { rotulo: "Esperando confirmação", tom: "warning" },
  applied: { rotulo: "Importada", tom: "positive" },
  canceled: { rotulo: "Descartada", tom: "neutral" },
};

export const LINHA: Record<RowStatus, { rotulo: string; tom: Tone }> = {
  valid: { rotulo: "Vai entrar", tom: "structure" },
  duplicate: { rotulo: "Já existe", tom: "warning" },
  error: { rotulo: "Não entra", tom: "critical" },
  imported: { rotulo: "Importado", tom: "positive" },
};
