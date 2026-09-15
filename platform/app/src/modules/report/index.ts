/** Porta publica dos relatorios. So leitura: relatorio nao escreve nada. */
export {
  getResumo,
  getFaturamentoPorProfissional,
  getConversaoFunil,
  getInadimplenciaPorUnidade,
  getProducaoPorProcedimento,
  getOrigemCaptacao,
  type ResumoGerencial,
  type LinhaProfissional,
  type EtapaFunil,
  type LinhaInadimplencia,
  type LinhaProcedimento,
  type LinhaOrigem,
} from "@/modules/report/queries";

export {
  periodSchema,
  periodoPadrao,
  rotuloPeriodo,
  rotuloCanal,
  type Period,
  type PeriodInput,
} from "@/modules/report/schema";
