import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { withPage } from "@/server/next/page";
import { getOpportunity, listLossReasons, listStages } from "@/modules/funnel";
import { NotFound } from "@/shared/errors";
import { Badge, LinkButton, Metric, Notice, PageHead, Panel, PanelHead } from "@/ui";
import { formatBRL, formatDateTime, formatPhone } from "@/shared/format";
import { lerAviso } from "@/shared/flash";
import { STATUS as QUOTE_STATUS } from "../../orcamentos/status";
import { CONTATO, prazoDaAcao, semContato } from "../estado";
import { Acoes, Contatos, ProximaAcao } from "./acoes";

export const metadata: Metadata = { title: "Negócio" };

export default async function NegocioPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ aviso?: string }>;
}) {
  const { id } = await params;
  const aviso = lerAviso((await searchParams).aviso);

  const dados = await withPage(async (ctx) => {
    const detalhe = await getOpportunity(ctx, id).catch((error: unknown) => {
      if (error instanceof NotFound) return null;
      throw error;
    });

    if (!detalhe) return null;

    return {
      ...detalhe,
      etapas: await listStages(ctx, detalhe.pipelineId),
      motivos: await listLossReasons(ctx),
      podeMover: ctx.can("opportunity.write"),
      podeConverter: ctx.can("patient.write"),
      podeOrcar: ctx.can("quote.write"),
      podeTarefa: ctx.can("task.write"),
      fuso: ctx.session.timezone,
    };
  }, "opportunity.read");

  if (!dados) notFound();

  const {
    card, stageName, lead, activities, tasks, quotes, historico,
    lossReason, lossNotes, etapas, motivos,
    podeMover, podeConverter, podeOrcar, podeTarefa, fuso,
  } = dados;

  const contato = semContato(card.diasSemContato, card.esfriando);
  const acao = prazoDaAcao(card.nextActionAt);
  const aberta = card.status === "open";

  return (
    <>
      <PageHead
        title={card.personName}
        meta={
          <span className="num flex flex-wrap items-center gap-x-3 gap-y-1">
            <span>{formatPhone(card.phone)}</span>
            <span>{card.title}</span>
            {card.ownerName ? <span>{card.ownerName}</span> : null}
            {card.patientId ? (
              <Link href={`/pacientes/${card.patientId}`} className="hover:text-structure">
                ver ficha do paciente
              </Link>
            ) : null}
          </span>
        }
        action={
          <LinkButton href="/funil" variant="secondary">
            Voltar
          </LinkButton>
        }
      />

      {aviso ? (
        <div className="mb-4">
          <Notice tone="positive">{aviso}</Notice>
        </div>
      ) : null}

      <Panel aria-label="Resumo do negócio" className="mb-4 grid gap-5 p-5 sm:grid-cols-4">
        <Metric
          label="Etapa"
          value={stageName}
          hint={
            card.status === "won"
              ? "Fechado pelo aceite do orçamento"
              : card.status === "lost"
                ? (lossReason ?? "Perdido")
                : "Em andamento"
          }
          tone={card.status === "won" ? "positive" : card.status === "lost" ? "critical" : "neutral"}
        />
        <Metric
          label="Valor"
          value={formatBRL(card.amountCents)}
          hint={quotes.length > 0 ? "Do orçamento" : "Estimativa"}
        />
        <Metric
          label="Último contato"
          value={contato.texto}
          hint={card.lastActivityAt ? formatDateTime(card.lastActivityAt, fuso) : "Ninguém falou ainda"}
          tone={contato.tom === "warning" ? "warning" : "neutral"}
        />
        <Metric
          label="Próxima ação"
          value={acao?.texto ?? "nenhuma"}
          hint={
            card.nextActionAt
              ? formatDateTime(card.nextActionAt, fuso)
              : "Sem isto, o contato esfria"
          }
          tone={acao?.tom === "critical" ? "critical" : acao ? "warning" : "neutral"}
        />
      </Panel>

      {card.status === "lost" && lossNotes ? (
        <div className="mb-4">
          <Notice tone="neutral">
            <strong>{lossReason}.</strong> {lossNotes}
          </Notice>
        </div>
      ) : null}

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <div className="space-y-5">
          <Contatos
            opportunityId={card.id}
            activities={activities}
            podeRegistrar={podeMover && aberta}
            fuso={fuso}
          />

          <Panel className="overflow-hidden">
            <PanelHead
              title="Propostas"
              hint="Aceitar uma delas fecha o negócio — não há ganho sem documento."
              action={
                podeOrcar && aberta && card.patientId ? (
                  <Link
                    href={`/orcamentos/novo?paciente=${card.patientId}&oportunidade=${card.id}`}
                    className="text-xs text-structure hover:underline"
                  >
                    nova proposta
                  </Link>
                ) : null
              }
            />

            {quotes.length === 0 ? (
              <p className="px-5 py-6 text-center text-sm text-muted">
                {card.patientId
                  ? "Nenhuma proposta ainda."
                  : "Converta o contato em paciente para poder orçar."}
              </p>
            ) : (
              <ul className="divide-y divide-line">
                {quotes.map((q) => {
                  const meta = QUOTE_STATUS[q.status as keyof typeof QUOTE_STATUS];
                  return (
                    <li key={q.id} className="flex items-center gap-3 px-5 py-3">
                      <Link
                        href={`/orcamentos/${q.id}`}
                        className="num min-w-0 flex-1 truncate text-sm font-medium text-ink hover:text-structure"
                      >
                        Orçamento #{q.number}
                      </Link>
                      <Badge tone={meta?.tom ?? "neutral"}>{meta?.rotulo ?? q.status}</Badge>
                      <span className="num text-sm text-ink-soft">
                        {formatBRL(q.totalCents)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>

          <Panel className="overflow-hidden">
            <PanelHead title="Histórico de etapas" hint="Cada movimento, com autor e hora." />
            <ul className="divide-y divide-line">
              {historico.map((h) => (
                <li key={h.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-5 py-2.5">
                  <span className="num w-36 shrink-0 text-xs text-muted">
                    {formatDateTime(h.at, fuso)}
                  </span>
                  <span className="flex items-center gap-2 text-sm text-ink-soft">
                    {h.from ? (
                      <>
                        <span>{h.from}</span>
                        <span aria-hidden className="text-muted">
                          →
                        </span>
                      </>
                    ) : null}
                    <span className="font-medium text-ink">{h.to}</span>
                  </span>
                  {h.by ? <span className="text-xs text-muted">{h.by}</span> : null}
                </li>
              ))}
            </ul>
          </Panel>
        </div>

        <div className="space-y-5">
          <Acoes
            card={card}
            lead={lead}
            etapas={etapas}
            motivos={motivos}
            podeMover={podeMover}
            podeConverter={podeConverter}
          />

          <ProximaAcao
            opportunityId={card.id}
            tasks={tasks}
            podeTarefa={podeTarefa && aberta}
            fuso={fuso}
          />
        </div>
      </div>
    </>
  );
}
