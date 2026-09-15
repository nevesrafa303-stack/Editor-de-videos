/**
 * Vocabulario de convenio, num lugar so.
 *
 * O modo de faturamento e a informacao que muda o que a clinica pode fazer com
 * a proposta, entao ele aparece em toda tela que menciona convenio — e precisa
 * dizer a mesma coisa em todas.
 */
import type { Tone } from "@/ui";
import type { BillingMode, PayerKind } from "@/modules/payer";

export const MODO: Record<BillingMode, { rotulo: string; tom: Tone; explica: string }> = {
  reimbursement: {
    rotulo: "Reembolso",
    tom: "positive",
    explica:
      "O paciente paga a clínica e pede reembolso ao convênio. A cobrança nasce normal, no nome dele.",
  },
  invoiced: {
    rotulo: "Faturado por guia",
    tom: "accent",
    explica:
      "O convênio paga a clínica por guia. O aceite emite a guia, que entra em lote e espera o repasse; o paciente só deve a co-participação.",
  },
};

/**
 * Cobre TODOS os valores do enum, nao so os que o formulario oferece: linha
 * gravada antes desta tela existir, ou por importacao, ainda precisa de rotulo.
 * Sem `private` aqui, a celula ficava em branco e ninguem sabia o que era.
 */
export const TIPO: Record<PayerKind, string> = {
  private: "Particular",
  insurance: "Plano odontológico",
  agreement: "Convênio de empresa",
  partnership: "Parceria",
};
