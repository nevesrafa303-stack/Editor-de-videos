import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { withPage } from "@/server/next/page";
import { getPayer } from "@/modules/payer";
import { NotFound } from "@/shared/errors";
import { Badge, LinkButton, Metric, Notice, PageHead, Panel } from "@/ui";
import { formatBRL } from "@/shared/format";
import { EditarConvenioForm } from "../form";
import { MODO, TIPO } from "../modo";
import { TabelaDePrecos } from "./precos";

export const metadata: Metadata = { title: "Convênio" };

export default async function ConvenioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const dados = await withPage(async (ctx) => {
    const detalhe = await getPayer(ctx, id).catch((error: unknown) => {
      if (error instanceof NotFound) return null;
      throw error;
    });

    if (!detalhe) return null;
    return { ...detalhe, podeEscrever: ctx.can("price.write") };
  }, "price.read");

  if (!dados) notFound();

  const { payer, precos, diferencaCents, podeEscrever } = dados;
  const modo = MODO[payer.billingMode];
  const cobertos = precos.filter((p) => p.convenioCents !== null);

  // Quanto da tabela o convênio paga, em média. Um número só, porque é a
  // pergunta que o dono faz antes de assinar: "vale a pena atender este aqui?"
  const somaParticular = cobertos.reduce((s, p) => s + (p.particularCents ?? 0), 0);
  const somaConvenio = cobertos.reduce((s, p) => s + (p.convenioCents ?? 0), 0);
  const percentual = somaParticular > 0 ? Math.round((somaConvenio / somaParticular) * 100) : null;

  return (
    <>
      <PageHead
        title={payer.name}
        meta={
          <span className="num flex flex-wrap items-center gap-x-3 gap-y-1">
            <span>{payer.code}</span>
            <span>{TIPO[payer.kind]}</span>
            {payer.settlementDays > 0 ? <span>repasse em {payer.settlementDays} dias</span> : null}
            {payer.isActive ? null : <span>inativo</span>}
          </span>
        }
        action={
          <LinkButton href="/convenios" variant="secondary">
            Voltar
          </LinkButton>
        }
      />

      <Panel aria-label="Resumo do convênio" className="mb-4 grid gap-5 p-5 sm:grid-cols-3">
        <Metric
          label="Procedimentos cobertos"
          value={String(cobertos.length)}
          hint={`de ${precos.length} no catálogo`}
          tone={cobertos.length > 0 ? "structure" : "warning"}
        />
        <Metric
          label="Paga da tabela"
          value={percentual === null ? "—" : `${percentual}%`}
          hint="Média ponderada sobre o que cobre"
          tone={percentual !== null && percentual < 70 ? "warning" : "neutral"}
        />
        <Metric
          label="Diferença para o particular"
          value={formatBRL(diferencaCents)}
          hint="O que a clínica abre mão por procedimento coberto"
          tone={diferencaCents > 0 ? "critical" : "neutral"}
        />
      </Panel>

      <div className="mb-4">
        <Notice tone={modo.tom}>
          <strong>{modo.rotulo}.</strong> {modo.explica}
        </Notice>
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
        <TabelaDePrecos payerId={payer.id} precos={precos} editavel={podeEscrever} />

        <div className="space-y-5">
          {podeEscrever ? (
            <EditarConvenioForm
              convenio={{
                id: payer.id,
                code: payer.code,
                name: payer.name,
                kind: payer.kind,
                billingMode: payer.billingMode,
                settlementDays: payer.settlementDays,
                adminFeePercent: payer.adminFeePercent,
                notes: payer.notes,
                isActive: payer.isActive,
              }}
            />
          ) : (
            <Panel className="p-5">
              <p className="text-sm text-muted">
                Seu perfil vê a tabela, mas não altera preço.{" "}
                <Badge tone="neutral">price.write</Badge>
              </p>
            </Panel>
          )}
        </div>
      </div>
    </>
  );
}
