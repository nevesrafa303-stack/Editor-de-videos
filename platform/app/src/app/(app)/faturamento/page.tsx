import type { Metadata } from "next";
import Link from "next/link";
import { withPage } from "@/server/next/page";
import { getClaimSummary, listBatches, listDenials, listPendingClaims } from "@/modules/claim";
import { Badge, Empty, LinkButton, Metric, Notice, PageHead, Panel, PanelHead } from "@/ui";
import { lerAviso } from "@/shared/flash";
import { formatBRL, formatDateOnly } from "@/shared/format";
import { competencia, GLOSA, LOTE, prazo } from "./estado";
import { FaturarForm } from "./faturar";

export const metadata: Metadata = { title: "Faturamento" };

export default async function FaturamentoPage({
  searchParams,
}: {
  searchParams: Promise<{ aviso?: string }>;
}) {
  const aviso = lerAviso((await searchParams).aviso);

  const dados = await withPage(
    async (ctx) => ({
      resumo: await getClaimSummary(ctx),
      pendentes: await listPendingClaims(ctx),
      lotes: await listBatches(ctx),
      glosas: await listDenials(ctx, { abertas: true }),
      podeFaturar: ctx.can("claim.write"),
    }),
    "claim.read",
  );

  const { resumo, pendentes, lotes, glosas, podeFaturar } = dados;
  const abertos = lotes.filter((l) => l.status !== "settled");

  return (
    <>
      <PageHead
        title="Faturamento"
        meta="Convênio faturado por guia: o que executei, o que enviei, o que recusaram."
      />

      {aviso ? (
        <div className="mb-4">
          <Notice tone="positive">{aviso}</Notice>
        </div>
      ) : null}

      <Panel aria-label="Resumo do faturamento" className="mb-4 grid gap-5 p-5 sm:grid-cols-2 lg:grid-cols-4">
        <Metric
          label="A faturar"
          value={formatBRL(resumo.aFaturarCents)}
          hint={`${resumo.aFaturarCount} ${resumo.aFaturarCount === 1 ? "guia emitida" : "guias emitidas"}`}
          tone={resumo.aFaturarCents > 0 ? "warning" : "neutral"}
        />
        <Metric
          label="Esperando repasse"
          value={formatBRL(resumo.enviadoCents)}
          hint={`${resumo.enviadoCount} em lote ou enviadas`}
          tone={resumo.enviadoCents > 0 ? "structure" : "neutral"}
        />
        <Metric
          label="Glosado em aberto"
          value={formatBRL(resumo.glosadoCents)}
          hint={`${resumo.glosadoCount} ${resumo.glosadoCount === 1 ? "glosa" : "glosas"} sem desfecho`}
          tone={resumo.glosadoCents > 0 ? "critical" : "neutral"}
        />
        <Metric
          label="Perdido por prazo"
          value={formatBRL(resumo.vencidoCents)}
          hint={
            resumo.vencendoCount > 0
              ? `e ${resumo.vencendoCount} vencendo nos próximos 7 dias`
              : "glosa que ninguém recorreu a tempo"
          }
          tone={resumo.vencidoCents > 0 ? "critical" : "neutral"}
        />
      </Panel>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="space-y-5">
          <Panel className="overflow-hidden">
            <PanelHead
              title="Guias a faturar"
              hint="Executado e emitido. Entra no lote do mês, um lote por convênio."
            />

            {pendentes.length === 0 ? (
              <Empty
                title="Nada esperando lote"
                hint="Guias nascem do aceite de orçamento com convênio faturado por guia."
              />
            ) : (
              <FaturarForm guias={pendentes} podeFaturar={podeFaturar} />
            )}
          </Panel>

          <Panel className="overflow-hidden">
            <PanelHead
              title="Glosas"
              hint="O convênio pagou menos. O prazo de recurso conta do demonstrativo."
              action={
                glosas.length > 0 ? (
                  <Link href="/faturamento/glosas" className="text-xs text-structure hover:underline">
                    ver todas
                  </Link>
                ) : null
              }
            />

            {glosas.length === 0 ? (
              <p className="px-5 py-6 text-center text-sm text-muted">
                Nenhuma glosa em aberto.
              </p>
            ) : (
              <ul className="divide-y divide-line">
                {glosas.slice(0, 6).map((g) => {
                  const p = prazo(g.diasParaPrazo);
                  const meta = GLOSA[g.status];

                  return (
                    <li key={g.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-5 py-3">
                      <span className="min-w-0 flex-1">
                        <Link
                          href={`/faturamento/guias/${g.claimId}`}
                          className="block truncate text-sm font-medium text-ink hover:text-structure"
                        >
                          {g.itemDescription}
                        </Link>
                        <span className="block truncate text-xs text-muted">
                          {g.patientName} · {g.payerName} · {g.reason}
                        </span>
                      </span>
                      <Badge tone={meta.tom}>{meta.rotulo}</Badge>
                      <Badge tone={p.tom}>{p.texto}</Badge>
                      <span className="num w-24 text-right text-sm font-medium text-critical">
                        {formatBRL(g.amountCents - g.recoveredCents)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>
        </div>

        <Panel className="overflow-hidden">
          <PanelHead
            title="Lotes"
            hint="Um por convênio e competência. Fecha quando toda linha foi conferida."
          />

          {abertos.length === 0 ? (
            <p className="px-5 py-6 text-center text-sm text-muted">
              Nenhum lote em andamento.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="grid-table">
                <thead>
                  <tr>
                    <th>Lote</th>
                    <th>Situação</th>
                    <th className="text-right">Faturado</th>
                    <th className="text-right">Recebido</th>
                  </tr>
                </thead>
                <tbody>
                  {abertos.map((l) => {
                    const meta = LOTE[l.status];

                    return (
                      <tr key={l.id}>
                        <td>
                          <Link
                            href={`/faturamento/lotes/${l.id}`}
                            className="font-medium text-ink hover:text-structure"
                          >
                            {l.payerName}
                          </Link>
                          <span className="num block text-xs text-muted">
                            {competencia(l.competence)} · {l.code} · {l.claimCount}{" "}
                            {l.claimCount === 1 ? "guia" : "guias"}
                          </span>
                        </td>
                        <td>
                          <Badge tone={meta.tom}>{meta.rotulo}</Badge>
                          {l.pendentes > 0 ? (
                            <span className="block text-xs text-warning">
                              {l.pendentes} a conferir
                            </span>
                          ) : null}
                        </td>
                        <td className="num text-right text-ink-soft">
                          {formatBRL(l.billedCents)}
                        </td>
                        <td className="num text-right">
                          {l.remittanceDate ? (
                            <>
                              <span className="font-medium text-ink">
                                {formatBRL(l.paidCents)}
                              </span>
                              <span className="block text-xs text-muted">
                                {formatDateOnly(l.remittanceDate)}
                              </span>
                            </>
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {lotes.length > abertos.length ? (
            <div className="border-t border-line px-5 py-3">
              <LinkButton href="/faturamento/lotes" variant="secondary" size="sm">
                Ver lotes fechados ({lotes.length - abertos.length})
              </LinkButton>
            </div>
          ) : null}
        </Panel>
      </div>
    </>
  );
}
