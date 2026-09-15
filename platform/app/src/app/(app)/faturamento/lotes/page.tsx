import type { Metadata } from "next";
import Link from "next/link";
import { withPage } from "@/server/next/page";
import { listBatches } from "@/modules/claim";
import { Badge, Empty, LinkButton, PageHead, Panel } from "@/ui";
import { formatBRL, formatDateOnly } from "@/shared/format";
import { competencia, LOTE } from "../estado";

export const metadata: Metadata = { title: "Lotes" };

export default async function LotesPage() {
  const lotes = await withPage((ctx) => listBatches(ctx), "claim.read");

  return (
    <>
      <PageHead
        title="Lotes"
        meta={`${lotes.length} ${lotes.length === 1 ? "lote" : "lotes"} · um por convênio e competência`}
        action={
          <LinkButton href="/faturamento" variant="secondary">
            Voltar
          </LinkButton>
        }
      />

      <Panel className="overflow-hidden">
        {lotes.length === 0 ? (
          <Empty
            title="Nenhum lote ainda"
            hint="O lote nasce quando a primeira guia do convênio é faturada na competência."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="grid-table">
              <thead>
                <tr>
                  <th>Lote</th>
                  <th>Situação</th>
                  <th className="text-right">Faturado</th>
                  <th className="text-right">Recebido</th>
                  <th className="text-right">Diferença</th>
                </tr>
              </thead>
              <tbody>
                {lotes.map((l) => {
                  const meta = LOTE[l.status];
                  const diferenca = l.billedCents - l.paidCents;
                  const conferido = l.status === "settled";

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
                        {l.remittanceDate ? (
                          <span className="block text-xs text-muted">
                            {formatDateOnly(l.remittanceDate)}
                          </span>
                        ) : null}
                      </td>
                      <td className="num text-right text-ink-soft">{formatBRL(l.billedCents)}</td>
                      <td className="num text-right font-medium text-ink">
                        {formatBRL(l.paidCents)}
                      </td>
                      <td className="num text-right">
                        {conferido && diferenca > 0 ? (
                          <span className="text-critical">
                            {`−${formatBRL(diferenca)}`}
                          </span>
                        ) : conferido ? (
                          <span className="text-positive">integral</span>
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
      </Panel>
    </>
  );
}
