import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { withPage } from "@/server/next/page";
import { getBatch } from "@/modules/claim";
import { NotFound } from "@/shared/errors";
import { Badge, LinkButton, Metric, Notice, PageHead, Panel } from "@/ui";
import { formatBRL, formatDateOnly } from "@/shared/format";
import { lerAviso } from "@/shared/flash";
import { competencia, LOTE } from "../../estado";
import { Conferencia } from "./conferencia";

export const metadata: Metadata = { title: "Lote" };

export default async function LotePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ aviso?: string }>;
}) {
  const { id } = await params;
  const aviso = lerAviso((await searchParams).aviso);

  const dados = await withPage(async (ctx) => {
    const detalhe = await getBatch(ctx, id).catch((error: unknown) => {
      if (error instanceof NotFound) return null;
      throw error;
    });

    if (!detalhe) return null;

    return {
      ...detalhe,
      podeEnviar: ctx.can("claim.submit"),
      podeConferir: ctx.can("claim.settle"),
    };
  }, "claim.read");

  if (!dados) notFound();

  const { batch, claims, podeEnviar, podeConferir } = dados;
  const meta = LOTE[batch.status];
  const glosado = claims.reduce((s, c) => s + c.deniedCents, 0);

  return (
    <>
      <PageHead
        title={batch.payerName}
        meta={
          <span className="num flex flex-wrap items-center gap-x-3 gap-y-1">
            <span>{batch.code}</span>
            <span>competência {competencia(batch.competence)}</span>
            <span>
              {batch.claimCount} {batch.claimCount === 1 ? "guia" : "guias"}
            </span>
            {batch.remittanceDate ? (
              <span>demonstrativo de {formatDateOnly(batch.remittanceDate)}</span>
            ) : null}
          </span>
        }
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

      <Panel aria-label="Resumo do lote" className="mb-4 grid gap-5 p-5 sm:grid-cols-4">
        <Metric label="Situação" value={meta.rotulo} hint={rotuloDeEtapa(batch.status)} />
        <Metric label="Faturado" value={formatBRL(batch.billedCents)} hint="Ao convênio" />
        <Metric
          label="Recebido"
          value={formatBRL(batch.paidCents)}
          hint={
            batch.billedCents > 0
              ? `${Math.round((batch.paidCents / batch.billedCents) * 100)}% do faturado`
              : "—"
          }
          tone={batch.paidCents > 0 ? "positive" : "neutral"}
        />
        <Metric
          label="Glosado"
          value={formatBRL(glosado)}
          hint={batch.pendentes > 0 ? `${batch.pendentes} linhas a conferir` : "tudo conferido"}
          tone={glosado > 0 ? "critical" : "neutral"}
        />
      </Panel>

      {batch.status === "open" ? (
        <div className="mb-4">
          <Notice tone="warning">
            O lote ainda não saiu da clínica. Enquanto está montando, guia pode entrar e sair;
            depois do envio, não.
          </Notice>
        </div>
      ) : null}

      <Conferencia
        batch={batch}
        claims={claims}
        podeEnviar={podeEnviar}
        podeConferir={podeConferir}
      />
    </>
  );
}

function rotuloDeEtapa(status: string): string {
  if (status === "open") return "Montando o lote";
  if (status === "submitted") return "Esperando o repasse";
  if (status === "settled") return "Repasse conferido";
  return "Cancelado";
}
