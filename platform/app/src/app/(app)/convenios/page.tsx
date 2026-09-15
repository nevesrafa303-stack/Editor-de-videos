import type { Metadata } from "next";
import Link from "next/link";
import { withPage } from "@/server/next/page";
import { listPayers } from "@/modules/payer";
import { Badge, Empty, Metric, PageHead, Panel, PanelHead } from "@/ui";
import { MODO, TIPO } from "./modo";
import { NovoConvenioForm } from "./form";

export const metadata: Metadata = { title: "Convênios" };

export default async function ConveniosPage() {
  const { convenios, podeEscrever } = await withPage(
    async (ctx) => ({
      convenios: await listPayers(ctx),
      podeEscrever: ctx.can("price.write"),
    }),
    "price.read",
  );

  const ativos = convenios.filter((c) => c.isActive);
  const comTabela = ativos.filter((c) => c.precos > 0).length;
  const faturados = ativos.filter((c) => c.billingMode === "invoiced").length;

  return (
    <>
      <PageHead
        title="Convênios"
        meta={`${ativos.length} ${ativos.length === 1 ? "convênio ativo" : "convênios ativos"}`}
      />

      <Panel
        aria-label="Resumo dos convênios"
        className="mb-4 grid gap-5 p-5 sm:grid-cols-3"
      >
        <Metric label="Ativos" value={String(ativos.length)} hint="Aparecem no orçamento" />
        <Metric
          label="Com tabela própria"
          value={String(comTabela)}
          hint="Sem tabela, o orçamento usa o preço particular"
          tone={comTabela < ativos.length ? "warning" : "positive"}
        />
        <Metric
          label="Faturados por guia"
          value={String(faturados)}
          hint="Emitem guia e esperam repasse"
          tone={faturados > 0 ? "accent" : "neutral"}
        />
      </Panel>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
        <Panel className="overflow-hidden">
          <PanelHead
            title="Cadastrados"
            hint="A tabela do convênio vence a particular na hora de orçar."
          />

          {convenios.length === 0 ? (
            <Empty
              title="Nenhum convênio ainda"
              hint="Enquanto não houver convênio, todo orçamento sai pelo preço particular."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="grid-table">
                <thead>
                  <tr>
                    <th>Convênio</th>
                    <th>Faturamento</th>
                    <th className="text-right">Repasse</th>
                    <th className="text-right">Preços</th>
                  </tr>
                </thead>
                <tbody>
                  {convenios.map((c) => {
                    const modo = MODO[c.billingMode];

                    return (
                      <tr key={c.id} className={c.isActive ? undefined : "opacity-55"}>
                        <td>
                          <Link
                            href={`/convenios/${c.id}`}
                            className="font-medium text-ink hover:text-structure"
                          >
                            {c.name}
                          </Link>
                          <div className="num flex items-center gap-2 text-xs text-muted">
                            <span>{c.code}</span>
                            <span>{TIPO[c.kind]}</span>
                            {c.isActive ? null : <span>inativo</span>}
                          </div>
                        </td>
                        <td>
                          <Badge tone={modo.tom}>{modo.rotulo}</Badge>
                        </td>
                        <td className="num text-right text-ink-soft">
                          {c.settlementDays > 0 ? `${c.settlementDays} dias` : "—"}
                          {c.adminFeePercent > 0 ? (
                            <span className="block text-xs text-muted">
                              taxa {c.adminFeePercent}%
                            </span>
                          ) : null}
                        </td>
                        <td className="num text-right">
                          {c.precos > 0 ? (
                            <span className="font-medium text-ink">{c.precos}</span>
                          ) : (
                            <span className="text-warning">sem tabela</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Panel>

        <div className="space-y-5">
          {podeEscrever ? <NovoConvenioForm /> : null}

          <Panel className="overflow-hidden">
            <PanelHead title="Como o preço é escolhido" />
            <ul className="space-y-2 px-5 py-4 text-sm text-ink-soft">
              <li>
                A tabela do <strong className="text-ink">convênio</strong> vence a particular, e a
                da <strong className="text-ink">unidade</strong> vence a da rede.
              </li>
              <li>
                Procedimento <strong className="text-ink">sem preço</strong> na tabela do convênio
                cai na particular — é assim que se diz &ldquo;não cobre&rdquo; sem zerar o valor.
              </li>
              <li>
                O preço entra <strong className="text-ink">congelado</strong> no orçamento.
                Reajustar a tabela amanhã não muda a proposta de hoje.
              </li>
              <li>
                A tela de cada convênio mostra a{" "}
                <strong className="text-ink">diferença para o particular</strong>: é o que a clínica
                abre mão por atendê-lo.
              </li>
              <li>
                Em convênio <strong className="text-ink">faturado por guia</strong>, a
                co-participação é a parte do paciente: o aceite cobra o convênio pelo resto, e o
                desconto só pode sair do lado dele.
              </li>
            </ul>
          </Panel>
        </div>
      </div>
    </>
  );
}
