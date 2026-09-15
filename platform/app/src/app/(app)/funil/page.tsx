import type { Metadata } from "next";
import { withPage } from "@/server/next/page";
import { getBoard, listStages } from "@/modules/funnel";
import { LinkButton, Metric, Notice, PageHead, Panel } from "@/ui";
import { formatBRL } from "@/shared/format";
import { lerAviso } from "@/shared/flash";
import { Quadro } from "./quadro";

export const metadata: Metadata = { title: "Funil" };

export default async function FunilPage({
  searchParams,
}: {
  searchParams: Promise<{ aviso?: string }>;
}) {
  const aviso = lerAviso((await searchParams).aviso);

  const { board, etapas, podeMover } = await withPage(async (ctx) => {
    const board = await getBoard(ctx);
    return {
      board,
      etapas: await listStages(ctx, board.pipelineId),
      podeMover: ctx.can("opportunity.write"),
    };
  }, "opportunity.read");

  return (
    <>
      <PageHead
        title="Funil"
        meta={board.pipelineName}
        action={
          <span className="flex gap-2">
            <LinkButton href="/funil/pendencias" variant="secondary">
              Pendências
            </LinkButton>
            <LinkButton href="/funil/novo">Novo contato</LinkButton>
          </span>
        }
      />

      {aviso ? (
        <div className="mb-4">
          <Notice tone="positive">{aviso}</Notice>
        </div>
      ) : null}

      <Panel
        aria-label="Resumo do funil"
        className="mb-4 grid gap-5 p-5 sm:grid-cols-2 lg:grid-cols-5"
      >
        <Metric
          label="No funil"
          value={formatBRL(board.abertoCents)}
          hint={`${board.stages.reduce((s, e) => s + e.cards.length, 0)} negócios abertos`}
        />
        <Metric
          label="Previsto"
          value={formatBRL(board.previstoCents)}
          hint="Ponderado pela chance de cada etapa"
          tone={board.previstoCents > 0 ? "structure" : "neutral"}
        />
        <Metric
          label="Fechado no mês"
          value={formatBRL(board.ganhoNoMesCents)}
          hint={`${board.ganhoNoMesCount} ${board.ganhoNoMesCount === 1 ? "negócio ganho" : "negócios ganhos"}`}
          tone={board.ganhoNoMesCents > 0 ? "positive" : "neutral"}
        />
        <Metric
          label="Esfriando"
          value={String(board.esfriandoCount)}
          hint="Passou do tempo da etapa sem contato"
          tone={board.esfriandoCount > 0 ? "warning" : "neutral"}
        />
        <Metric
          label="Ação atrasada"
          value={String(board.atrasadoCount)}
          hint="A data combinada já passou"
          tone={board.atrasadoCount > 0 ? "critical" : "neutral"}
        />
      </Panel>

      <Quadro board={board} etapas={etapas} podeMover={podeMover} />
    </>
  );
}
