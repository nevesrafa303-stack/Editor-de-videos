import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { withPage } from "@/server/next/page";
import { getClaim } from "@/modules/claim";
import { NotFound } from "@/shared/errors";
import { Badge, LinkButton, Metric, PageHead, Panel, PanelHead } from "@/ui";
import { formatBRL, formatDateOnly } from "@/shared/format";
import { GUIA, LOTE } from "../../estado";
import { Autorizacao } from "./autorizacao";
import { Glosas } from "../../glosas/lista";

export const metadata: Metadata = { title: "Guia" };

export default async function GuiaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const dados = await withPage(async (ctx) => {
    const detalhe = await getClaim(ctx, id).catch((error: unknown) => {
      if (error instanceof NotFound) return null;
      throw error;
    });

    if (!detalhe) return null;

    return {
      ...detalhe,
      podeEditar: ctx.can("claim.write"),
      podeRecorrer: ctx.can("claim.appeal"),
    };
  }, "claim.read");

  if (!dados) notFound();

  const { claim, items, batch, denials, podeEditar, podeRecorrer } = dados;
  const meta = GUIA[claim.status];
  const emAberto = claim.billedCents - claim.paidCents;

  return (
    <>
      <PageHead
        title={`Guia #${claim.number}`}
        meta={
          <span className="num flex flex-wrap items-center gap-x-3 gap-y-1">
            <Link href={`/pacientes/${claim.patientId}`} className="hover:text-structure">
              {claim.patientName}
            </Link>
            <span>{claim.payerName}</span>
            <span>emitida em {formatDateOnly(claim.issuedOn)}</span>
          </span>
        }
        action={
          <LinkButton href="/faturamento" variant="secondary">
            Voltar
          </LinkButton>
        }
      />

      <Panel aria-label="Resumo da guia" className="mb-4 grid gap-5 p-5 sm:grid-cols-4">
        <Metric label="Situação" value={meta.rotulo} hint={`${items.length} procedimentos`} />
        <Metric label="Faturado" value={formatBRL(claim.billedCents)} hint="Ao convênio" />
        <Metric
          label="Recebido"
          value={formatBRL(claim.paidCents)}
          tone={claim.paidCents > 0 ? "positive" : "neutral"}
          hint={claim.status === "settled" ? "Repasse conferido" : "Ainda não conferido"}
        />
        <Metric
          label={claim.deniedCents > 0 ? "Glosado" : "Em aberto"}
          value={formatBRL(claim.deniedCents > 0 ? claim.deniedCents : emAberto)}
          tone={claim.deniedCents > 0 ? "critical" : "neutral"}
          hint={claim.deniedCents > 0 ? "O convênio recusou" : "Falta receber"}
        />
      </Panel>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="space-y-5">
          <Panel className="overflow-hidden">
            <PanelHead
              title="Procedimentos"
              hint="Só o que o convênio paga. A co-participação do paciente virou cobrança dele."
            />
            <div className="overflow-x-auto">
              <table className="grid-table">
                <thead>
                  <tr>
                    <th>Procedimento</th>
                    <th className="text-right">Faturado</th>
                    <th className="text-right">Pago</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((i) => (
                    <tr key={i.id}>
                      <td>
                        <span className="font-medium text-ink">{i.description}</span>
                        {i.toothCode || i.regionCode ? (
                          <span className="block text-xs text-muted">
                            {i.toothCode ? `Dente ${i.toothCode}` : i.regionCode}
                          </span>
                        ) : null}
                      </td>
                      <td className="num text-right text-ink-soft">{formatBRL(i.billedCents)}</td>
                      <td className="num text-right">
                        {i.paidCents === null ? (
                          <span className="text-muted">a conferir</span>
                        ) : (
                          <>
                            <span className="font-medium text-ink">{formatBRL(i.paidCents)}</span>
                            {i.deniedCents > 0 ? (
                              <span className="block text-xs whitespace-nowrap text-critical">
                                {`−${formatBRL(i.deniedCents)}`} glosado
                              </span>
                            ) : null}
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>

          {denials.length > 0 ? (
            <Glosas glosas={denials} podeRecorrer={podeRecorrer} titulo="Glosas desta guia" />
          ) : null}
        </div>

        <div className="space-y-5">
          <Autorizacao claim={claim} editavel={podeEditar && claim.status === "open"} />

          {batch ? (
            <Panel className="overflow-hidden">
              <PanelHead title="Lote" />
              <div className="flex items-center justify-between gap-3 px-5 py-4">
                <Link
                  href={`/faturamento/lotes/${batch.id}`}
                  className="num text-sm font-medium text-ink hover:text-structure"
                >
                  {batch.code}
                </Link>
                <Badge tone={LOTE[batch.status].tom}>{LOTE[batch.status].rotulo}</Badge>
              </div>
            </Panel>
          ) : (
            <Panel className="p-5">
              <p className="text-sm text-muted">
                Ainda não entrou em lote. Ela aparece na fila de{" "}
                <Link href="/faturamento" className="text-structure hover:underline">
                  guias a faturar
                </Link>
                .
              </p>
            </Panel>
          )}
        </div>
      </div>
    </>
  );
}
