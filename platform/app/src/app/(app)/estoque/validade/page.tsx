import type { Metadata } from "next";
import Link from "next/link";
import { withPage } from "@/server/next/page";
import { formatQuantidade, listExpiringLots } from "@/modules/stock";
import { Badge, Empty, LinkButton, Metric, PageHead, Panel } from "@/ui";
import { formatBRL } from "@/shared/format";

export const metadata: Metadata = { title: "Validade" };

export default async function ValidadePage() {
  const lotes = await withPage((ctx) => listExpiringLots(ctx, 90), "inventory.read");

  const vencidos = lotes.filter((l) => l.diasParaVencer < 0);
  const em30 = lotes.filter((l) => l.diasParaVencer >= 0 && l.diasParaVencer <= 30);
  const perdaPotencialCents = lotes.reduce((s, l) => s + l.valorCents, 0);

  return (
    <>
      <PageHead
        title="Validade"
        meta="Lotes com saldo que vencem nos próximos 90 dias — e os que já venceram"
        action={<LinkButton href="/estoque" variant="secondary">Voltar ao estoque</LinkButton>}
      />

      <Panel
        aria-label="Resumo da validade"
        className="mb-4 grid gap-5 p-5 sm:grid-cols-3"
      >
        <Metric
          label="Já vencidos"
          value={String(vencidos.length)}
          hint="Estão na prateleira e podem ser pegos por engano"
          tone={vencidos.length > 0 ? "critical" : "neutral"}
        />
        <Metric
          label="Vencem em 30 dias"
          value={String(em30.length)}
          hint="Ainda dá para usar — é a janela de agir"
          tone={em30.length > 0 ? "warning" : "neutral"}
        />
        <Metric
          label="Valor em risco"
          value={formatBRL(perdaPotencialCents)}
          hint="O que se perde se nada for usado"
        />
      </Panel>

      <Panel>
        {lotes.length === 0 ? (
          <Empty
            title="Nada vencendo"
            hint="Nenhum lote com saldo vence nos próximos 90 dias."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="grid-table">
              <thead>
                <tr>
                  <th>Produto</th>
                  <th>Lote</th>
                  <th>Validade</th>
                  <th className="text-right">Saldo</th>
                  <th className="text-right">Valor</th>
                </tr>
              </thead>
              <tbody>
                {lotes.map((l) => (
                  <tr key={l.id}>
                    <td>
                      <Link
                        href={`/estoque/${l.produtoId}`}
                        className="font-medium text-ink hover:underline"
                      >
                        {l.produto}
                      </Link>
                    </td>
                    <td className="text-ink-soft">{l.numero}</td>
                    <td>
                      {l.diasParaVencer < 0 ? (
                        <Badge tone="critical">
                          Venceu há {Math.abs(l.diasParaVencer)} dias
                        </Badge>
                      ) : l.diasParaVencer <= 30 ? (
                        <Badge tone="warning">Faltam {l.diasParaVencer} dias</Badge>
                      ) : (
                        <span className="text-ink-soft">Faltam {l.diasParaVencer} dias</span>
                      )}
                      <span className="mt-0.5 block text-xs text-muted">
                        {l.validade.split("-").reverse().join("/")}
                      </span>
                    </td>
                    <td className="num text-right">{formatQuantidade(l.saldo, l.stockUnit)}</td>
                    <td className="num text-right">{formatBRL(l.valorCents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </>
  );
}
