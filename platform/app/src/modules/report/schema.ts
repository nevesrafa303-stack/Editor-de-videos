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


/**
 * O periodo anterior, para o painel poder dizer "melhor ou pior que o que?".
 *
 * Numero sem base e dificil de agir: "recebi R$ 12 mil" nao diz nada sozinho;
 * "R$ 12 mil, 18% a menos que agosto" diz o que fazer na segunda-feira.
 *
 * A regra tem dois casos, e o segundo existe porque o primeiro nao cobre tudo:
 *
 * 1. MES FECHADO (dia 1 ao ultimo dia do mesmo mes) -> o MES CALENDARIO
 *    anterior. E o que a pessoa quer dizer quando escolhe setembro inteiro, e
 *    uma janela de "30 dias antes" devolveria 2 a 31 de agosto — que nao e
 *    agosto, e faria o numero nao bater com o fechamento do mes passado.
 * 2. QUALQUER OUTRO RECORTE -> a janela do MESMO TAMANHO imediatamente antes.
 *    Comparar 12 dias com um mes inteiro seria pior do que nao comparar.
 */
export function periodoAnterior(period: { de: string; ate: string }): {
  de: string;
  ate: string;
  rotulo: string;
} {
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  const de = new Date(`${period.de}T00:00:00Z`);
  const ate = new Date(`${period.ate}T00:00:00Z`);

  const ultimoDiaDoMes = (d: Date) =>
    new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();

  const mesFechado =
    de.getUTCDate() === 1 &&
    ate.getUTCDate() === ultimoDiaDoMes(ate) &&
    de.getUTCMonth() === ate.getUTCMonth() &&
    de.getUTCFullYear() === ate.getUTCFullYear();

  if (mesFechado) {
    const inicio = new Date(Date.UTC(de.getUTCFullYear(), de.getUTCMonth() - 1, 1));
    const fim = new Date(Date.UTC(inicio.getUTCFullYear(), inicio.getUTCMonth() + 1, 0));

    return {
      de: iso(inicio),
      ate: iso(fim),
      rotulo: new Intl.DateTimeFormat("pt-BR", { month: "long", timeZone: "UTC" }).format(inicio),
    };
  }

  const DIA = 86_400_000;
  const dias = Math.round((ate.getTime() - de.getTime()) / DIA) + 1;
  const fim = new Date(de.getTime() - DIA);
  const inicio = new Date(fim.getTime() - (dias - 1) * DIA);

  return {
    de: iso(inicio),
    ate: iso(fim),
    rotulo: dias === 1 ? "o dia anterior" : `os ${dias} dias antes`,
  };
}
