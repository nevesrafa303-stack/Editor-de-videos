import type { Metadata } from "next";
import Link from "next/link";
import { withPage } from "@/server/next/page";
import {
  formatQuantidade,
  getStockSummary,
  listProducts,
  rotuloTipo,
} from "@/modules/stock";
import { Badge, Empty, LinkButton, Metric, Notice, PageHead, Panel } from "@/ui";
import { formatBRL } from "@/shared/format";
import { lerAviso } from "@/shared/flash";

export const metadata: Metadata = { title: "Estoque" };

const RECORTES = [
  { chave: "todos", rotulo: "Todos" },
  { chave: "abaixo", rotulo: "Abaixo do mínimo" },
  { chave: "vencendo", rotulo: "Com lote vencendo" },
] as const;

export default async function EstoquePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; recorte?: string; aviso?: string }>;
}) {
  const params = await searchParams;
  const aviso = lerAviso(params.aviso);
  const recorte = RECORTES.some((r) => r.chave === params.recorte)
    ? (params.recorte as "todos" | "abaixo" | "vencendo")
    : "todos";

  const { produtos, resumo, podeEscrever } = await withPage(async (ctx) => {
    const [produtos, resumo] = await Promise.all([
      listProducts(ctx, { search: params.q ?? null, recorte }),
      getStockSummary(ctx),
    ]);
    return { produtos, resumo, podeEscrever: ctx.can("inventory.write") };
  }, "inventory.read");

  const link = (chave: string) =>
    `/estoque?recorte=${chave}${params.q ? `&q=${encodeURIComponent(params.q)}` : ""}`;

  return (
    <>
      <PageHead
        title="Estoque"
        meta="Saldo em unidade de compra — frasco, seringa, tubo"
        action={
          <span className="flex gap-2">
            <LinkButton href="/estoque/validade" variant="secondary">
              Validade
            </LinkButton>
            {podeEscrever ? <LinkButton href="/estoque/entrada">Registrar entrada</LinkButton> : null}
          </span>
        }
      />

      {aviso ? (
        <div className="mb-4">
          <Notice tone="positive">{aviso}</Notice>
        </div>
      ) : null}

      <Panel
        aria-label="Resumo do estoque"
        className="mb-4 grid gap-5 p-5 sm:grid-cols-2 lg:grid-cols-4"
      >
        <Metric
          label="Abaixo do mínimo"
          value={String(resumo.abaixoDoMinimo)}
          hint="Precisa comprar antes de faltar"
          tone={resumo.abaixoDoMinimo > 0 ? "warning" : "neutral"}
        />
        <Metric
          label="Vencendo em 60 dias"
          value={String(resumo.vencendoEm60)}
          hint="Lotes com saldo, ainda dá para usar"
          tone={resumo.vencendoEm60 > 0 ? "warning" : "neutral"}
        />
        <Metric
          label="Vencido com saldo"
          value={String(resumo.vencidosComSaldo)}
          hint="Material na prateleira esperando baixa de perda"
          tone={resumo.vencidosComSaldo > 0 ? "critical" : "neutral"}
        />
        <Metric
          label="Parado em estoque"
          value={formatBRL(resumo.valorEmEstoqueCents)}
          hint="A custo do lote, não de tabela"
        />
      </Panel>

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <form method="get" className="flex items-end gap-2" aria-label="Buscar produto">
          <input type="hidden" name="recorte" value={recorte} />
          <input
            name="q"
            defaultValue={params.q ?? ""}
            placeholder="Produto, código ou marca"
            className="field w-64"
            aria-label="Buscar produto"
          />
        </form>

        <nav aria-label="Recorte" className="flex gap-1.5">
          {RECORTES.map((r) => (
            <Link
              key={r.chave}
              href={link(r.chave)}
              className={
                r.chave === recorte
                  ? "rounded-md bg-structure px-3 py-2 text-sm font-medium text-white"
                  : "rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink-soft hover:bg-sunken"
              }
            >
              {r.rotulo}
            </Link>
          ))}
        </nav>
      </div>

      <Panel>
        {produtos.length === 0 ? (
          <Empty
            title="Nada por aqui"
            hint={
              recorte === "abaixo"
                ? "Nenhum produto abaixo do mínimo — é a notícia boa."
                : recorte === "vencendo"
                  ? "Nenhum lote vencendo nos próximos 60 dias."
                  : "Nenhum produto cadastrado."
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="grid-table">
              <thead>
                <tr>
                  <th>Produto</th>
                  <th className="text-right">Saldo</th>
                  <th className="text-right">Mínimo</th>
                  <th>Validade mais próxima</th>
                  <th className="text-right">Parado</th>
                </tr>
              </thead>
              <tbody>
                {produtos.map((p) => {
                  const faltando = p.saldo <= p.minimo;

                  return (
                    <tr key={p.id}>
                      <td>
                        <Link href={`/estoque/${p.id}`} className="font-medium text-ink hover:underline">
                          {p.nome}
                        </Link>
                        <span className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-muted">
                          {p.code} · {rotuloTipo(p.tipo)}
                          {p.refrigerado ? <Badge tone="structure">Refrigerado</Badge> : null}
                          {p.exigeLote ? <Badge tone="neutral">Lote</Badge> : null}
                        </span>
                      </td>
                      <td className="num text-right">
                        <span className={faltando ? "font-semibold text-warning" : undefined}>
                          {formatQuantidade(p.saldo, p.stockUnit)}
                        </span>
                      </td>
                      <td className="num text-right text-muted">
                        {formatQuantidade(p.minimo)}
                      </td>
                      <td>
                        {p.proximaValidade ? (
                          <span className={p.lotesVencendo > 0 ? "text-warning" : undefined}>
                            {p.proximaValidade.split("-").reverse().join("/")}
                            {p.lotesVencendo > 0 ? (
                              <span className="block text-xs">
                                {p.lotesVencendo === 1
                                  ? "1 lote vencendo"
                                  : `${p.lotesVencendo} lotes vencendo`}
                              </span>
                            ) : null}
                          </span>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                      <td className="num text-right">{formatBRL(p.valorEmEstoqueCents)}</td>
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
