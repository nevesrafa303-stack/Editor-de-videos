/** Porta publica dos relatorios. So leitura: relatorio nao escreve nada. */
export {
  getResumo,
  getFaturamentoPorProfissional,
  getConversaoFunil,
  getInadimplenciaPorUnidade,
  getProducaoPorProcedimento,
  getOrigemCaptacao,
  getCustoRealPorProcedimento,
  getSaidaSemProcedimento,
  type ResumoGerencial,
  type LinhaProfissional,
  type EtapaFunil,
  type LinhaInadimplencia,
  type LinhaProcedimento,
  type LinhaOrigem,
  type LinhaCustoReal,
  type LinhaSaidaAvulsa,
} from "@/modules/report/queries";

export {
  periodSchema,
  periodoPadrao,
  periodoAnterior,
  rotuloPeriodo,
  rotuloCanal,
  type Period,
  type PeriodInput,
} from "@/modules/report/schema";
