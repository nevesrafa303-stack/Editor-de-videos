import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { withPage } from "@/server/next/page";
import {
  formatQuantidade,
  getProduct,
  rotuloMovimento,
  rotuloTipo,
} from "@/modules/stock";
import { Badge, Empty, Metric, Notice, PageHead, Panel, PanelHead, type Tone } from "@/ui";
import { formatBRL, formatDateTime } from "@/shared/format";
import { NotFound } from "@/shared/errors";
import { lerAviso } from "@/shared/flash";
import { AcoesDoProduto, BloquearLote } from "./acoes";

export const metadata: Metadata = { title: "Produto" };

const TOM_MOVIMENTO: Record<string, Tone> = {
  purchase: "positive",
  transfer_in: "positive",
  return: "positive",
  consumption: "neutral",
  sale: "neutral",
  transfer_out: "neutral",
  loss: "critical",
  adjustment: "warning",
};

export default async function ProdutoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ aviso?: string }>;
}) {
  const { id } = await params;
  const aviso = lerAviso((await searchParams).aviso);

  const dados = await withPage(async (ctx) => {
    try {
      return {
        produto: await getProduct(ctx, id),
        podeEscrever: ctx.can("inventory.write"),
        fuso: ctx.session.timezone,
      };
    } catch (erro) {
      if (erro instanceof NotFound) return null;
      throw erro;
    }
  }, "inventory.read");

  if (!dados) notFound();
  const { produto, podeEscrever, fuso } = dados;

  const comSaldo = produto.lotes.filter((l) => l.saldo > 0);
  const faltando = produto.saldo <= produto.minimo;

  return (
    <>
      <PageHead
        title={produto.nome}
        meta={
          <>
            {produto.code} · {rotuloTipo(produto.tipo)}
            {produto.marca ? ` · ${produto.marca}` : ""} ·{" "}
            <Link href="/estoque" className="hover:underline">
              voltar ao estoque
            </Link>
          </>
        }
      />

      {aviso ? (
        <div className="mb-4">
          <Notice tone="positive">{aviso}</Notice>
        </div>
      ) : null}

      <Panel
        aria-label="Situação do produto"
        className="mb-4 grid gap-5 p-5 sm:grid-cols-2 lg:grid-cols-4"
      >
        <Metric
          label="Em estoque"
          value={formatQuantidade(produto.saldo, produto.stockUnit)}
          hint={`Mínimo ${formatQuantidade(produto.minimo, produto.stockUnit)}`}
          tone={faltando ? "warning" : "positive"}
        />
        <Metric
          label="Equivale a"
          value={formatQuantidade(produto.saldo * produto.fatorConversao, produto.usageUnit)}
          hint={`1 ${produto.stockUnit} = ${formatQuantidade(produto.fatorConversao, produto.usageUnit)}`}
        />
        <Metric
          label="Lotes com saldo"
          value={String(comSaldo.length)}
          hint={produto.exigeLote ? "Este produto exige rastreio" : "Rastreio não exigido"}
        />
        <Metric label="Parado" value={formatBRL(produto.valorEmEstoqueCents)} hint="A custo do lote" />
      </Panel>

      <Panel className="mb-4">
        <PanelHead
          title="Lotes"
          hint="O que vence antes sai antes. Lote bloqueado não sai em consumo nenhum."
        />
        {produto.lotes.length === 0 ? (
          <Empty
            title="Sem lote"
            hint={
              produto.exigeLote
                ? "Este produto exige rastreio: registre uma entrada com número de lote."
                : "Este produto não tem controle de lote."
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="grid-table">
              <thead>
                <tr>
                  <th>Lote</th>
                  <th>Validade</th>
                  <th className="text-right">Saldo</th>
                  <th className="text-right">Custo</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {produto.lotes.map((l) => (
                  <tr key={l.id}>
                    <td className="font-medium text-ink">
                      {l.numero}
                      {l.bloqueado ? (
                        <span className="mt-0.5 block">
                          <Badge tone="critical">Bloqueado</Badge>{" "}
                          <span className="text-xs text-muted">{l.motivoBloqueio}</span>
                        </span>
                      ) : null}
                    </td>
                    <td>
                      <span
                        className={
                          l.diasParaVencer < 0
                            ? "text-critical"
                            : l.diasParaVencer <= 60
                              ? "text-warning"
                              : undefined
                        }
                      >
                        {l.validade.split("-").reverse().join("/")}
                      </span>
                      <span className="block text-xs text-muted">
                        {l.diasParaVencer < 0
                          ? `venceu há ${Math.abs(l.diasParaVencer)} dias`
                          : `faltam ${l.diasParaVencer} dias`}
                      </span>
                    </td>
                    <td className="num text-right">{formatQuantidade(l.saldo, produto.stockUnit)}</td>
                    <td className="num text-right">{formatBRL(l.custoCents)}</td>
                    <td className="text-right">
                      {podeEscrever ? <BloquearLote productId={produto.id} lote={l} /> : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {podeEscrever ? (
        <div className="mb-4">
          <AcoesDoProduto
            productId={produto.id}
            stockUnit={produto.stockUnit}
            lotes={comSaldo}
          />
        </div>
      ) : null}

      <Panel>
        <PanelHead
          title="Movimentações"
          hint="Nada é editado nem apagado. Corrigir estoque é lançar movimento."
        />
        {produto.movimentos.length === 0 ? (
          <Empty title="Nenhuma movimentação" />
        ) : (
          <ul className="divide-y divide-line">
            {produto.movimentos.map((m) => (
              <li key={m.id} className="flex flex-wrap items-start gap-3 px-5 py-3">
                <Badge tone={TOM_MOVIMENTO[m.kind] ?? "neutral"}>{rotuloMovimento(m.kind)}</Badge>

                <span className="min-w-0 flex-1">
                  <span className="block text-sm text-ink">
                    {m.paciente && m.pacienteId ? (
                      <Link href={`/pacientes/${m.pacienteId}`} className="hover:underline">
                        {m.paciente}
                      </Link>
                    ) : (
                      (m.motivo ?? "—")
                    )}
                  </span>
                  <span className="block text-xs text-muted">
                    {formatDateTime(m.em, fuso)}
                    {m.lote ? ` · lote ${m.lote}` : ""}
                    {m.autor ? ` · ${m.autor}` : ""}
                    {m.paciente && m.motivo ? ` · ${m.motivo}` : ""}
                  </span>
                </span>

                <span className="text-right">
                  <span
                    className={
                      m.quantidade > 0
                        ? "num block text-sm font-semibold text-positive"
                        : "num block text-sm font-semibold text-ink"
                    }
                  >
                    {m.quantidade > 0 ? "+" : ""}
                    {formatQuantidade(m.quantidade, produto.stockUnit)}
                  </span>
                  <span className="num block text-xs text-muted">
                    {formatBRL(m.custoTotalCents)}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}
