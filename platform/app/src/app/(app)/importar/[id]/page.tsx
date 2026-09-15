import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { withPage } from "@/server/next/page";
import { getImport } from "@/modules/import";
import { NotFound } from "@/shared/errors";
import { Badge, LinkButton, Metric, Notice, PageHead, Panel, PanelHead } from "@/ui";
import { formatDateTime } from "@/shared/format";
import { lerAviso } from "@/shared/flash";
import { LINHA, SITUACAO } from "../situacao";
import { Confirmar } from "./confirmar";

export const metadata: Metadata = { title: "Importação" };

export default async function ImportacaoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ aviso?: string }>;
}) {
  const { id } = await params;
  const aviso = lerAviso((await searchParams).aviso);

  const dados = await withPage(async (ctx) => {
    const detalhe = await getImport(ctx, id).catch((error: unknown) => {
      if (error instanceof NotFound) return null;
      throw error;
    });

    if (!detalhe) return null;
    return { ...detalhe, podeImportar: ctx.can("import.write"), fuso: ctx.session.timezone };
  }, "import.read");

  if (!dados) notFound();

  const { job, rows, podeImportar, fuso } = dados;
  const meta = SITUACAO[job.status];
  const esperando = job.status === "ready";

  return (
    <>
      <PageHead
        title={job.filename ?? "Planilha colada"}
        meta={
          <span className="num flex flex-wrap items-center gap-x-3 gap-y-1">
            <span>{formatDateTime(job.createdAt, fuso)}</span>
            {job.createdBy ? <span>{job.createdBy}</span> : null}
            {job.appliedAt ? <span>importada em {formatDateTime(job.appliedAt, fuso)}</span> : null}
          </span>
        }
        action={
          <LinkButton href="/importar" variant="secondary">
            Voltar
          </LinkButton>
        }
      />

      {aviso ? (
        <div className="mb-4">
          <Notice tone="positive">{aviso}</Notice>
        </div>
      ) : null}

      <Panel aria-label="Resumo da importação" className="mb-4 grid gap-5 p-5 sm:grid-cols-4">
        <Metric
          label="Situação"
          value={meta.rotulo}
          hint={`${job.total} ${job.total === 1 ? "linha" : "linhas"} na planilha`}
          tone={job.status === "applied" ? "positive" : "neutral"}
        />
        <Metric
          label={job.status === "applied" ? "Importados" : "Vão entrar"}
          value={String(job.status === "applied" ? job.importadas : job.validas)}
          hint="Cadastros novos"
          tone={(job.status === "applied" ? job.importadas : job.validas) > 0 ? "structure" : "neutral"}
        />
        <Metric
          label="Já existem"
          value={String(job.duplicadas)}
          hint="Pulados, sem sobrescrever"
          tone={job.duplicadas > 0 ? "warning" : "neutral"}
        />
        <Metric
          label="Não entram"
          value={String(job.comErro)}
          hint="Falta nome ou telefone"
          tone={job.comErro > 0 ? "critical" : "neutral"}
        />
      </Panel>

      {esperando && podeImportar ? <Confirmar job={job} /> : null}

      {job.duplicadas > 0 ? (
        <div className="mb-4">
          <Notice tone="warning">
            Quem já está no sistema é <strong>pulado</strong>, nunca sobrescrito. A planilha do
            sistema antigo quase sempre é a fonte pior — atualizar em massa um cadastro que a
            clínica já editou destruiria trabalho sem pedir licença.
          </Notice>
        </div>
      ) : null}

      <Panel className="overflow-hidden">
        <PanelHead
          title="Linha a linha"
          hint="O que não entrou vem primeiro: é o que dá para corrigir na planilha e trazer depois."
        />

        <div className="overflow-x-auto">
          <table className="grid-table">
            <thead>
              <tr>
                <th className="text-right">Linha</th>
                <th>Nome</th>
                <th>Telefone</th>
                <th>Situação</th>
                <th>Observação</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const l = LINHA[r.status];

                return (
                  <tr key={r.id}>
                    <td className="num text-right text-muted">{r.line}</td>
                    <td>
                      {r.patientId ? (
                        <Link
                          href={`/pacientes/${r.patientId}`}
                          className="font-medium text-ink hover:text-structure"
                        >
                          {r.nome}
                        </Link>
                      ) : (
                        <span className="font-medium text-ink">{r.nome}</span>
                      )}
                    </td>
                    <td className="num text-ink-soft">{r.telefone}</td>
                    <td>
                      <Badge tone={l.tom}>{l.rotulo}</Badge>
                    </td>
                    <td className="text-xs text-muted">{r.message ?? "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}
