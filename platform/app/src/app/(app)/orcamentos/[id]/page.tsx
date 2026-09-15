import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { withPage } from "@/server/next/page";
import { getQuote } from "@/modules/quote";
import { NotFound } from "@/shared/errors";
import { Badge, LinkButton, PageHead, Panel, PanelHead } from "@/ui";
import { formatBRL, formatDateOnly, formatDateTime, formatPhone } from "@/shared/format";
import { STATUS } from "../status";
import { Acoes, Comercial, Itens } from "./editor";

export const metadata: Metadata = { title: "Orçamento" };

export default async function OrcamentoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const dados = await withPage(async (ctx) => {
    const quote = await getQuote(ctx, id).catch((error: unknown) => {
      if (error instanceof NotFound) return null;
      throw error;
    });

    if (!quote) return null;

    const motivos = await ctx.db
      .selectFrom("loss_reason")
      .select(["id", "name"])
      .where("is_active", "=", true)
      .orderBy("name", "asc")
      .execute();

    return {
      quote,
      motivos: motivos.map((m) => ({ id: m.id as string, name: m.name })),
      fuso: ctx.session.timezone,
    };
  }, "quote.read");

  if (!dados) notFound();

  const { quote, motivos, fuso } = dados;
  const margem = quote.totalCents - quote.expectedCostCents;

  return (
    <>
      <PageHead
        title={quote.title ?? `Orçamento #${quote.number}`}
        meta={
          <span className="num flex flex-wrap items-center gap-x-3 gap-y-1">
            <span>#{quote.number}</span>
            <Link href={`/pacientes/${quote.patient.id}`} className="hover:text-structure">
              {quote.patient.name}
            </Link>
            <span>{formatPhone(quote.patient.phone)}</span>
            {quote.validUntil ? <span>vale até {formatDateOnly(quote.validUntil)}</span> : null}
          </span>
        }
        action={
          <LinkButton href="/orcamentos" variant="secondary">
            Voltar
          </LinkButton>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="space-y-5">
          <Itens quote={quote} />

          {quote.notes ? (
            <Panel className="overflow-hidden">
              <PanelHead title="Observações" />
              <p className="px-5 py-4 text-sm whitespace-pre-wrap text-ink-soft">{quote.notes}</p>
            </Panel>
          ) : null}

          <Panel className="overflow-hidden">
            <PanelHead title="Histórico" hint="Cada mudança de estágio, com autor e hora." />
            <ul className="divide-y divide-line">
              {quote.historico.map((h) => (
                <li key={h.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-5 py-2.5">
                  <span className="num w-36 shrink-0 text-xs text-muted">
                    {formatDateTime(h.at, fuso)}
                  </span>
                  <span className="flex items-center gap-2 text-sm">
                    {h.from ? (
                      <>
                        <Badge tone={STATUS[h.from as keyof typeof STATUS]?.tom ?? "neutral"}>
                          {STATUS[h.from as keyof typeof STATUS]?.rotulo ?? h.from}
                        </Badge>
                        <span aria-hidden className="text-muted">
                          →
                        </span>
                      </>
                    ) : null}
                    <Badge tone={STATUS[h.to as keyof typeof STATUS]?.tom ?? "neutral"}>
                      {STATUS[h.to as keyof typeof STATUS]?.rotulo ?? h.to}
                    </Badge>
                  </span>
                  {h.by ? <span className="text-xs text-muted">{h.by}</span> : null}
                </li>
              ))}
            </ul>
          </Panel>
        </div>

        <div className="space-y-5">
          <Acoes quote={quote} motivos={motivos} />
          <Comercial quote={quote} />

          <Panel className="overflow-hidden">
            <PanelHead title="Margem prevista" hint="Só a clínica vê. Não sai no documento." />
            <div className="space-y-2 px-5 py-4 text-sm">
              <div className="flex items-baseline justify-between gap-4">
                <span className="text-muted">Custo previsto</span>
                <span className="num text-ink-soft">{formatBRL(quote.expectedCostCents)}</span>
              </div>
              <div className="flex items-baseline justify-between gap-4">
                <span className="font-semibold text-ink">Margem</span>
                <span
                  className={`num text-lg font-bold ${margem > 0 ? "text-positive" : "text-critical"}`}
                >
                  {formatBRL(margem)}
                </span>
              </div>
              {quote.totalCents > 0 ? (
                <p className="text-xs text-muted">
                  {Math.round((margem / quote.totalCents) * 100)}% do total. O custo vem da ficha
                  técnica congelada na emissão.
                </p>
              ) : null}
            </div>
          </Panel>
        </div>
      </div>
    </>
  );
}
