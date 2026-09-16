import "server-only";
import { NextResponse } from "next/server";
import { withTenant } from "@/server/context";
import { currentRequestInfo, currentSession } from "@/server/next/session";
import { centavosCsv, numeroCsv, toCsv } from "@/shared/csv";
import {
  getConversaoFunil,
  getCustoRealPorProcedimento,
  getFaturamentoPorProfissional,
  getInadimplenciaPorUnidade,
  getOrigemCaptacao,
  getProducaoPorProcedimento,
  getSaidaSemProcedimento,
  periodSchema,
  periodoPadrao,
  rotuloCanal,
  type Period,
} from "@/modules/report";

/**
 * O painel em planilha.
 *
 * UM ARQUIVO POR SEÇÃO, e não um arquivo com tudo. Blocos empilhados separados
 * por linha em branco são a forma clássica de exportar relatório, e a primeira
 * coisa que a pessoa faz ao abrir é apagar as linhas do meio para conseguir
 * somar uma coluna. Cada seção sai como uma tabela limpa: abre, ordena, soma.
 *
 * Rota e não server action de propósito: o resultado é um DOWNLOAD, e download
 * precisa de URL — para poder ser um link, ser aberto numa aba e ser mandado
 * para a contadora do mesmo jeito que o painel já é.
 */

const SECOES = [
  "profissionais",
  "funil",
  "inadimplencia",
  "producao",
  "custo-real",
  "desperdicio",
  "captacao",
] as const;

type Secao = (typeof SECOES)[number];

function ehSecao(valor: string | null): valor is Secao {
  return valor !== null && (SECOES as readonly string[]).includes(valor);
}

export async function GET(request: Request): Promise<Response> {
  const session = await currentSession();
  if (!session) return new NextResponse("Não autenticado.", { status: 401 });

  // Rota devolve 403; ela não é tela. Redirecionar um download para a página de
  // "sem permissão" entregaria um arquivo HTML com nome .csv — que a pessoa
  // abriria no Excel e leria como dado.
  if (!session.permissions.has("report.export")) {
    return new NextResponse("Seu perfil não pode exportar relatórios.", { status: 403 });
  }

  const url = new URL(request.url);
  const secao = url.searchParams.get("secao");

  if (!ehSecao(secao)) {
    return new NextResponse(`Seção desconhecida. Use uma de: ${SECOES.join(", ")}.`, {
      status: 400,
    });
  }

  const padrao = periodoPadrao(session.timezone);
  const pedido = periodSchema.safeParse({
    de: url.searchParams.get("de") ?? padrao.de,
    ate: url.searchParams.get("ate") ?? padrao.ate,
    unitId: url.searchParams.get("unidade") || null,
  });

  if (!pedido.success) {
    return new NextResponse(
      pedido.error.issues[0]?.message ?? "Período inválido.",
      { status: 400 },
    );
  }

  const period: Period = pedido.data;
  const info = await currentRequestInfo();

  const { nome, csv } = await withTenant(
    session,
    async (ctx) => {
      switch (secao) {
        case "profissionais": {
          const linhas = await getFaturamentoPorProfissional(ctx, period);
          return {
            nome: "faturamento-por-profissional",
            csv: toCsv(
              ["Profissional", "Vendido (R$)", "Recebido (R$)"],
              linhas.map((l) => [l.nome, centavosCsv(l.aceitoCents), centavosCsv(l.recebidoCents)]),
            ),
          };
        }

        case "funil": {
          const linhas = await getConversaoFunil(ctx, period);
          return {
            nome: "conversao-do-funil",
            csv: toCsv(
              ["Etapa", "Negócios", "% do total", "% da etapa anterior"],
              linhas.map((l) => [
                l.nome,
                l.alcancaram,
                numeroCsv(l.fracao * 100, 1),
                l.avancaram === null ? "" : numeroCsv(l.avancaram * 100, 1),
              ]),
            ),
          };
        }

        case "inadimplencia": {
          const linhas = await getInadimplenciaPorUnidade(ctx, period);
          return {
            nome: "vencido-por-unidade",
            csv: toCsv(
              ["Unidade", "Vencido (R$)", "Carteira aberta (R$)", "% vencido", "Parcelas", "Pacientes"],
              linhas.map((l) => [
                l.nome,
                centavosCsv(l.vencidoCents),
                centavosCsv(l.abertoCents),
                numeroCsv(l.fracao * 100, 1),
                l.parcelas,
                l.pacientes,
              ]),
            ),
          };
        }

        case "producao": {
          const linhas = await getProducaoPorProcedimento(ctx, period);
          return {
            nome: "vendido-margem-orcada",
            csv: toCsv(
              ["Procedimento", "Quantidade", "Receita (R$)", "Custo (R$)", "Margem (R$)", "% margem"],
              linhas.map((l) => [
                l.nome,
                numeroCsv(l.quantidade, 3),
                centavosCsv(l.receitaCents),
                centavosCsv(l.custoCents),
                centavosCsv(l.margemCents),
                l.margemPercent === null ? "" : numeroCsv(l.margemPercent * 100, 1),
              ]),
            ),
          };
        }

        case "custo-real": {
          const linhas = await getCustoRealPorProcedimento(ctx, period);
          return {
            nome: "executado-custo-real",
            csv: toCsv(
              [
                "Procedimento",
                "Feitos",
                "Receita (R$)",
                "Custo previsto (R$)",
                "Custo real (R$)",
                "Margem (R$)",
                "% margem",
                "Tem ficha técnica",
              ],
              linhas.map((l) => [
                l.nome,
                l.execucoes,
                centavosCsv(l.receitaCents),
                // Sem ficha técnica a célula fica VAZIA, não zero. Zero numa
                // planilha entra na soma e na média como se fosse medição; o
                // vazio é o que diz "isto não foi medido".
                l.temFicha ? centavosCsv(l.previstoCents) : "",
                l.temFicha ? centavosCsv(l.realCents) : "",
                l.temFicha ? centavosCsv(l.margemCents) : "",
                l.margemPercent === null ? "" : numeroCsv(l.margemPercent * 100, 1),
                l.temFicha ? "sim" : "não",
              ]),
            ),
          };
        }

        case "desperdicio": {
          const linhas = await getSaidaSemProcedimento(ctx, period);
          return {
            nome: "saiu-sem-procedimento",
            csv: toCsv(
              ["Produto", "Motivo", "Quantidade", "Unidade", "Valor (R$)"],
              linhas.map((l) => [
                l.produto,
                l.kind === "loss" ? "Perda" : "Acerto de inventário",
                numeroCsv(l.quantidade, 4),
                l.stockUnit,
                centavosCsv(l.valorCents),
              ]),
            ),
          };
        }

        case "captacao": {
          const linhas = await getOrigemCaptacao(ctx, period);
          return {
            nome: "origem-de-captacao",
            csv: toCsv(
              ["Origem", "Canal", "Contatos", "Fecharam", "% conversão", "Fechado (R$)"],
              linhas.map((l) => [
                l.nome,
                rotuloCanal(l.canal),
                l.contatos,
                l.ganhos,
                numeroCsv(l.conversao * 100, 1),
                centavosCsv(l.ganhoCents),
              ]),
            ),
          };
        }
      }
    },
    info,
  );

  // O período no nome do arquivo. Três exportações na pasta de Downloads sem
  // isso são três "relatorio.csv" e ninguém sabe qual é de qual mês.
  const arquivo = `${nome}-${period.de}-a-${period.ate}.csv`;

  return new NextResponse(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${arquivo}"`,
      "cache-control": "no-store",
    },
  });
}
