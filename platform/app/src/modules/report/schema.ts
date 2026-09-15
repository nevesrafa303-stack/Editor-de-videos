import { z } from "zod";
import { diaLocal } from "@/shared/format";

/**
 * O periodo do relatorio.
 *
 * Tres decisoes que parecem detalhe e nao sao:
 *
 * 1. O periodo e FECHADO DOS DOIS LADOS, em datas locais da clinica. "De 1 a
 *    30 de setembro" inclui o dia 30 inteiro — quem digita a data final espera
 *    que o dia dela conte. A conversao para instante acontece no SQL, no fuso
 *    da unidade, porque `timestamptz` so vira "dia 30" depois de escolher o
 *    fuso, e o do servidor nunca e a resposta certa.
 *
 * 2. Vem da URL, nao de estado do cliente. Um relatorio que nao da para mandar
 *    por link e um relatorio que vira captura de tela no WhatsApp — e ninguem
 *    consegue conferir uma captura de tela.
 *
 * 3. Sem padrao no schema. O mes corrente e calculado no fuso da sessao
 *    (`periodoPadrao`), e nao existe `default` em zod que saiba o fuso.
 */
export const periodSchema = z
  .object({
    de: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inicial inválida."),
    ate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data final inválida."),
    /** `null` = a rede inteira, respeitando o que a sessao ja pode ver. */
    unitId: z.uuid().nullish(),
  })
  .refine((v) => v.de <= v.ate, {
    path: ["ate"],
    message: "A data final não pode ser anterior à inicial.",
  })
  .transform((v) => ({ ...v, unitId: v.unitId?.length ? v.unitId : null }));

export type PeriodInput = z.input<typeof periodSchema>;
export type Period = z.output<typeof periodSchema>;

/** Primeiro e ultimo dia do mes corrente, no fuso da clinica. */
export function periodoPadrao(timezone: string, agora = new Date()): { de: string; ate: string } {
  const [ano, mes] = diaLocal(agora, timezone).split("-") as [string, string, string];

  // Dia 0 do mes seguinte e o ultimo dia deste — a unica forma de acertar
  // fevereiro sem tabela de dias por mes.
  const ultimo = new Date(Date.UTC(Number(ano), Number(mes), 0)).getUTCDate();

  return { de: `${ano}-${mes}-01`, ate: `${ano}-${mes}-${String(ultimo).padStart(2, "0")}` };
}

/** Rotulo curto do periodo, para o titulo e para o texto de vazio. */
export function rotuloPeriodo(period: { de: string; ate: string }): string {
  const dia = (iso: string) => iso.split("-").reverse().join("/");
  return `${dia(period.de)} a ${dia(period.ate)}`;
}

/**
 * Canal de captacao em portugues de gente.
 *
 * `acquisition_source.channel` e um `check` de texto, e texto de banco e escrito
 * sem acento de proposito — comparacao, ordenacao e digitacao em script sofrem
 * com acento. Mas "organico" e "indicacao" na tela sao erro de portugues numa
 * tela que a dona da clinica mostra para a contadora.
 */
const CANAIS: Record<string, string> = {
  organico: "Orgânico",
  pago: "Mídia paga",
  indicacao: "Indicação",
  parceria: "Parceria",
  recorrencia: "Recorrência",
  outro: "Outro",
};

export function rotuloCanal(canal: string): string {
  return CANAIS[canal] ?? "Outro";
}
