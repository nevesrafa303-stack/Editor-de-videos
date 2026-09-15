import type { Metadata } from "next";
import { withPage } from "@/server/next/page";
import { listDenials } from "@/modules/claim";
import { Empty, LinkButton, Metric, Notice, PageHead, Panel } from "@/ui";
import { lerAviso } from "@/shared/flash";
import { formatBRL } from "@/shared/format";
import { Glosas } from "./lista";

export const metadata: Metadata = { title: "Glosas" };

export default async function GlosasPage({
  searchParams,
}: {
  searchParams: Promise<{ aviso?: string }>;
}) {
  const aviso = lerAviso((await searchParams).aviso);

  const { glosas, podeRecorrer } = await withPage(
    async (ctx) => ({
      glosas: await listDenials(ctx, { abertas: true }),
      podeRecorrer: ctx.can("claim.appeal"),
    }),
    "claim.read",
  );

  const emAberto = glosas.reduce((s, g) => s + g.amountCents - g.recoveredCents, 0);
  const vencendo = glosas.filter(
    (g) => g.status === "open" && g.diasParaPrazo !== null && g.diasParaPrazo <= 7,
  );
  const vencidas = glosas.filter((g) => g.status === "expired");

  return (
    <>
      <PageHead
        title="Glosas"
        meta="O que o convênio recusou pagar, e até quando dá para recorrer."
        action={
          <LinkButton href="/faturamento" variant="secondary">
            Voltar
          </LinkButton>
        }
      />

      {aviso ? (
        <div className="mb-4">
          <Notice tone="positive">{aviso}</Notice>
        </div>
      ) : null}

      <Panel aria-label="Resumo das glosas" className="mb-4 grid gap-5 p-5 sm:grid-cols-3">
        <Metric
          label="Em aberto"
          value={formatBRL(emAberto)}
          hint={`${glosas.length} ${glosas.length === 1 ? "glosa" : "glosas"} sem desfecho`}
          tone={emAberto > 0 ? "critical" : "neutral"}
        />
        <Metric
          label="Vencendo"
          value={String(vencendo.length)}
          hint="Prazo de recurso nos próximos 7 dias"
          tone={vencendo.length > 0 ? "warning" : "neutral"}
        />
        <Metric
          label="Prazo perdido"
          value={String(vencidas.length)}
          hint="Passou sem ninguém recorrer"
          tone={vencidas.length > 0 ? "critical" : "neutral"}
        />
      </Panel>

      {glosas.length === 0 ? (
        <Panel>
          <Empty
            title="Nenhuma glosa em aberto"
            hint="Glosa nasce da conferência do repasse, quando o convênio paga menos do que foi faturado."
          />
        </Panel>
      ) : (
        <Glosas glosas={glosas} podeRecorrer={podeRecorrer} />
      )}
    </>
  );
}
