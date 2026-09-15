import type { Metadata } from "next";
import Link from "next/link";
import { withPage } from "@/server/next/page";
import { listQuotes } from "@/modules/quote";
import { QUOTE_STATUS, type QuoteStatus } from "@/modules/quote";
import { Badge, Empty, LinkButton, Metric, PageHead, Panel } from "@/ui";
import { formatBRL, formatDateOnly, formatDateTime } from "@/shared/format";
import { STATUS } from "./status";

export const metadata: Metadata = { title: "Orçamentos" };

const POR_PAGINA = 25;

export default async function OrcamentosPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; busca?: string; pagina?: string }>;
}) {
  const params = await searchParams;
  const status = QUOTE_STATUS.includes(params.status as QuoteStatus)
    ? (params.status as QuoteStatus)
    : undefined;
  const busca = params.busca?.trim() ?? "";
  const pagina = Math.max(1, Number(params.pagina) || 1);

  const { items, total, totals, fuso } = await withPage(async (ctx) => {
    const resultado = await listQuotes(ctx, {
      ...(status ? { status } : {}),
      ...(busca ? { search: busca } : {}),
      limit: POR_PAGINA,
      offset: (pagina - 1) * POR_PAGINA,
    });
    return { ...resultado, fuso: ctx.session.timezone };
  }, "quote.read");

  const emAberto = (totals.sent ?? 0) + (totals.negotiating ?? 0);
  const paginas = Math.max(1, Math.ceil(total / POR_PAGINA));

  return (
    <>
      <PageHead
        title="Orçamentos"
        meta={`${total} ${total === 1 ? "orçamento" : "orçamentos"}${status ? ` · ${STATUS[status].rotulo.toLowerCase()}` : ""}`}
      />

      <Panel aria-label="Resumo dos orçamentos" className="mb-4 grid gap-5 p-5 sm:grid-cols-2 lg:grid-cols-4">
        <Metric
          label="Esperando resposta"
          value={formatBRL(emAberto)}
          hint="Enviados e em negociação"
          tone={emAberto > 0 ? "structure" : "neutral"}
        />
        <Metric
          label="Fechado"
          value={formatBRL(totals.accepted ?? 0)}
          hint="Aceito e assinado"
          tone={(totals.accepted ?? 0) > 0 ? "positive" : "neutral"}
        />
        <Metric
          label="Perdido"
          value={formatBRL(totals.rejected ?? 0)}
          hint="Com motivo registrado"
          tone={(totals.rejected ?? 0) > 0 ? "critical" : "neutral"}
        />
        <Metric
          label="Vencido"
          value={formatBRL(totals.expired ?? 0)}
          hint="Passou da validade sem resposta"
          tone={(totals.expired ?? 0) > 0 ? "warning" : "neutral"}
        />
      </Panel>

      <Panel className="mb-4 p-4">
        <form className="flex flex-wrap items-end gap-3">
          <label className="min-w-56 flex-1">
            <span className="label">Buscar</span>
            <input
              id="busca"
              name="busca"
              defaultValue={busca}
              placeholder="Paciente, título ou número"
              className="field"
            />
          </label>

          <label className="min-w-40">
            <span className="label">Estágio</span>
            <select id="status" name="status" defaultValue={status ?? ""} className="field">
              <option value="">Todos</option>
              {QUOTE_STATUS.map((s) => (
                <option key={s} value={s}>
                  {STATUS[s].rotulo}
                </option>
              ))}
            </select>
          </label>

          <button
            type="submit"
            className="mb-0.5 h-9 rounded-md bg-ink px-4 text-sm font-medium text-white transition hover:bg-ink/90"
          >
            Filtrar
          </button>
        </form>
      </Panel>

      <Panel className="overflow-hidden">
        {items.length === 0 ? (
          <Empty
            title="Nenhum orçamento aqui"
            hint="Orçamentos nascem do plano de tratamento, na ficha do paciente."
            action={
              <LinkButton href="/pacientes" variant="secondary">
                Ir para pacientes
              </LinkButton>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="grid-table">
              <thead>
                <tr>
                  <th>Orçamento</th>
                  <th>Paciente</th>
                  <th>Estágio</th>
                  <th>Validade</th>
                  <th className="text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {items.map((q) => {
                  const meta = STATUS[q.status];
                  const vencido =
                    q.validUntil !== null &&
                    new Date(`${q.validUntil}T12:00:00Z`) < new Date() &&
                    (q.status === "sent" || q.status === "negotiating");

                  return (
                    <tr key={q.id}>
                      <td>
                        <Link
                          href={`/orcamentos/${q.id}`}
                          className="font-medium text-ink hover:text-structure"
                        >
                          {q.title ?? `Orçamento #${q.number}`}
                        </Link>
                        <div className="num flex items-center gap-2 text-xs text-muted">
                          <span>#{q.number}</span>
                          <span>
                            {q.itemCount} {q.itemCount === 1 ? "item" : "itens"}
                          </span>
                          <span>{formatDateTime(q.createdAt, fuso)}</span>
                        </div>
                      </td>
                      <td>
                        <Link
                          href={`/pacientes/${q.patientId}`}
                          className="text-ink-soft hover:text-structure"
                        >
                          {q.patientName}
                        </Link>
                      </td>
                      <td>
                        <Badge tone={meta.tom}>{meta.rotulo}</Badge>
                      </td>
                      <td className="num">
                        {q.validUntil ? (
                          <span className={vencido ? "text-critical" : "text-ink-soft"}>
                            {formatDateOnly(q.validUntil)}
                            {vencido ? " · vencido" : ""}
                          </span>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                      <td className="num text-right">
                        <span className="font-medium text-ink">{formatBRL(q.totalCents)}</span>
                        {q.discountCents > 0 ? (
                          <span className="block text-xs text-muted">
                            −{formatBRL(q.discountCents)}
                          </span>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {paginas > 1 ? (
        <nav className="mt-4 flex items-center justify-between text-sm text-muted">
          <span className="num">
            Página {pagina} de {paginas}
          </span>
          <span className="flex gap-2">
            {pagina > 1 ? (
              <LinkButton variant="secondary" size="sm" href={`/orcamentos?pagina=${pagina - 1}`}>
                Anterior
              </LinkButton>
            ) : null}
            {pagina < paginas ? (
              <LinkButton variant="secondary" size="sm" href={`/orcamentos?pagina=${pagina + 1}`}>
                Próxima
              </LinkButton>
            ) : null}
          </span>
        </nav>
      ) : null}
    </>
  );
}
