import type { Metadata } from "next";
import { withPage } from "@/server/next/page";
import {
  getConversaoFunil,
  getCustoRealPorProcedimento,
  getFaturamentoPorProfissional,
  getInadimplenciaPorUnidade,
  getOrigemCaptacao,
  getProducaoPorProcedimento,
  getResumo,
  getSaidaSemProcedimento,
  periodoPadrao,
  periodSchema,
  rotuloPeriodo,
  rotuloCanal,
  type Period,
} from "@/modules/report";
import { Barras } from "@/ui/barras";
import { Metric, Notice, PageHead, Panel, PanelHead } from "@/ui";
import { listReachableUnits } from "@/modules/auth/units";
import { formatBRL } from "@/shared/format";
import { formatQuantidade } from "@/modules/stock";
import { Filtro } from "./filtro";

export const metadata: Metadata = { title: "Relatórios" };

const percent = (v: number) => `${(v * 100).toFixed(0)}%`;

/** `1` vira "1 negócio"; `0` e `2` viram "negócios". */
const plural = (n: number, um: string, muitos: string) => `${n} ${n === 1 ? um : muitos}`;

export default async function RelatoriosPage({
  searchParams,
}: {
  searchParams: Promise<{ de?: string; ate?: string; unidade?: string }>;
}) {
  const params = await searchParams;

  const dados = await withPage(async (ctx) => {
    const padrao = periodoPadrao(ctx.session.timezone);

    /*
     * O período vem da URL, e URL é campo de texto: chega invertida, chega
     * truncada, chega editada a mão. Deixar o `parse` estourar aqui daria a
     * tela branca do 500 — a página é renderizada no servidor, não há
     * formulário onde pendurar o erro.
     *
     * Então período inválido não derruba o painel: ele volta para o mês
     * corrente e DIZ que voltou. Cair em silêncio seria pior que o erro —
     * a pessoa leria os números de setembro achando que são de março.
     */
    const pedido = periodSchema.safeParse({
      de: params.de ?? padrao.de,
      ate: params.ate ?? padrao.ate,
      unitId: params.unidade?.length ? params.unidade : null,
    });

    const unidades = await listReachableUnits(ctx);

    /*
     * Unidade fora do alcance da sessão também cai fora do recorte.
     *
     * RLS já devolveria zero para ela — seguro, e péssimo de ler: a pessoa cola
     * o link de um colega, todo número zera, e a conclusão razoável é "o
     * sistema quebrou", não "esta unidade não é minha".
     */
    const pedida = pedido.success ? pedido.data.unitId : null;
    const alcancavel = pedida === null || unidades.some((u) => u.id === pedida);

    const period: Period = pedido.success
      ? { ...pedido.data, unitId: alcancavel ? pedida : null }
      : { de: padrao.de, ate: padrao.ate, unitId: null };

    const aviso = !pedido.success
      ? `${pedido.error.issues[0]?.message ?? "Período inválido."} Mostrando o mês corrente.`
      : alcancavel
        ? null
        : "Esta unidade não está no seu acesso. Mostrando o que você alcança.";

    const podeFinanceiro = ctx.can("report.financial");

    // Quem não vê dinheiro ainda vê funil e captação. Devolver a tela inteira
    // vazia para o profissional seria trancar dele o relatório que é dele.
    const [funil, origem] = await Promise.all([
      getConversaoFunil(ctx, period),
      getOrigemCaptacao(ctx, period),
    ]);

    if (!podeFinanceiro) {
      return {
        period,
        aviso,
        unidades,
        podeFinanceiro,
        funil,
        origem,
        resumo: null,
        profissionais: null,
        inadimplencia: null,
        procedimentos: null,
        custoReal: null,
        saidaAvulsa: null,
      };
    }

    const [resumo, profissionais, inadimplencia, procedimentos, custoReal, saidaAvulsa] =
      await Promise.all([
        getResumo(ctx, period),
        getFaturamentoPorProfissional(ctx, period),
        getInadimplenciaPorUnidade(ctx, period),
        getProducaoPorProcedimento(ctx, period),
        getCustoRealPorProcedimento(ctx, period),
        getSaidaSemProcedimento(ctx, period),
      ]);

    return {
      period,
      aviso,
      unidades,
      podeFinanceiro,
      funil,
      origem,
      resumo,
      profissionais,
      inadimplencia,
      procedimentos,
      custoReal,
      saidaAvulsa,
    };
  }, "report.read");

  const { period, aviso, unidades, podeFinanceiro, resumo } = dados;
  const rotulo = rotuloPeriodo(period);
  // Com uma unidade so ao alcance, "rede" seria uma palavra vazia — e pior,
  // sugeriria que existe mais coisa atras do numero do que existe.
  const unidade =
    unidades.find((u) => u.id === period.unitId) ?? (unidades.length === 1 ? unidades[0] : undefined);

  return (
    <>
      <PageHead
        title="Relatórios"
        meta={unidade ? `${rotulo} · ${unidade.name}` : `${rotulo} · rede`}
      />

      <Filtro de={period.de} ate={period.ate} unitId={period.unitId} unidades={unidades} />

      {aviso ? (
        <div className="mb-4">
          <Notice tone="warning">{aviso}</Notice>
        </div>
      ) : null}

      {resumo ? (
        <Panel aria-label="Resumo do período" className="mb-4 grid gap-5 p-5 sm:grid-cols-2 lg:grid-cols-4">
          <Metric
            label="Recebido"
            value={formatBRL(resumo.recebidoCents)}
            hint="Pagamentos confirmados no período"
            tone={resumo.recebidoCents > 0 ? "positive" : "neutral"}
          />
          <Metric
            label="Vendido"
            value={formatBRL(resumo.aceitoCents)}
            hint="Orçamentos aceitos — entra parcelado"
            tone={resumo.aceitoCents > 0 ? "structure" : "neutral"}
          />
          <Metric
            label="Vencido hoje"
            value={formatBRL(resumo.vencidoCents)}
            hint="Foto de agora, não do período"
            tone={resumo.vencidoCents > 0 ? "critical" : "neutral"}
          />
          <Metric
            label="Taxa de ganho"
            value={resumo.taxaGanho === null ? "—" : percent(resumo.taxaGanho)}
            hint={
              resumo.taxaGanho === null
                ? "Nenhum negócio fechou no período"
                : `${resumo.ganhos} ganhos · ${resumo.perdidos} perdidos`
            }
          />
        </Panel>
      ) : (
        <div className="mb-4">
          <Notice tone="warning">
            Seu perfil não vê números financeiros. Abaixo ficam os relatórios de funil e de
            captação, que são os do seu acesso.
          </Notice>
        </div>
      )}

      {dados.profissionais ? (
        <Panel className="mb-4">
          <PanelHead
            title="Faturamento por profissional"
            hint="Vendido é o orçamento aceito; recebido é o dinheiro que entrou. A diferença é o parcelamento."
          />
          <Barras
            series={[
              { rotulo: "Vendido", cor: "1" },
              { rotulo: "Recebido", cor: "2" },
            ]}
            linhas={dados.profissionais.map((p) => ({
              chave: p.membershipId ?? "sem-profissional",
              rotulo: p.nome,
              valores: [p.aceitoCents, p.recebidoCents],
              textos: [formatBRL(p.aceitoCents), formatBRL(p.recebidoCents)],
            }))}
            vazio={`Nenhum orçamento aceito nem pagamento recebido entre ${rotulo}.`}
          />
        </Panel>
      ) : null}

      <Panel className="mb-4">
        <PanelHead
          title="Conversão do funil"
          hint="Dos negócios abertos no período, até onde cada um chegou. Os mais recentes ainda vão andar."
        />
        <Barras
          series={[{ rotulo: "Negócios", cor: "1" }]}
          linhas={dados.funil.map((e) => ({
            chave: e.stageId,
            rotulo: e.nome,
            // Dois percentuais por linha se confundem quando nada os separa —
            // e na segunda etapa eles são o MESMO número por construção. Cada
            // um diz de que total está falando.
            meta: `${percent(e.fracao)} do total`,
            valores: [e.alcancaram],
            textos: [plural(e.alcancaram, "negócio", "negócios")],
            destaque:
              e.avancaram === null
                ? undefined
                : `${percent(e.avancaram)} vieram da etapa anterior`,
          }))}
          vazio={`Nenhum negócio foi aberto entre ${rotulo}.`}
        />
      </Panel>

      {dados.inadimplencia ? (
        <Panel className="mb-4">
          <PanelHead
            title="Vencido por unidade"
            hint="Parcelas vencidas e não pagas, hoje. Não depende do período escolhido."
          />
          <Barras
            series={[{ rotulo: "Vencido", cor: "critico" }]}
            linhas={dados.inadimplencia.map((u) => ({
              chave: u.unitId,
              rotulo: u.nome,
              meta:
                u.parcelas === 0
                  ? "Nada vencido"
                  : `${plural(u.parcelas, "parcela", "parcelas")} · ${plural(u.pacientes, "paciente", "pacientes")}`,
              valores: [u.vencidoCents],
              textos: [formatBRL(u.vencidoCents)],
              destaque:
                u.abertoCents > 0
                  ? `${percent(u.fracao)} da carteira aberta da unidade (${formatBRL(u.abertoCents)})`
                  : undefined,
            }))}
            vazio="Nenhuma unidade ativa."
          />
        </Panel>
      ) : null}

      {dados.procedimentos ? (
        <Panel className="mb-4">
          <PanelHead
            title="Vendido: margem orçada"
            hint="Orçamentos ACEITOS no período. Preço e custo congelados na emissão — é a expectativa, feita antes de qualquer material sair."
          />
          {dados.procedimentos.length === 0 ? (
            <p className="px-5 py-6 text-sm text-muted">
              Nenhum orçamento aceito entre {rotulo}.
            </p>
          ) : (
            <div className="overflow-x-auto">
              {/* Quatro números por linha não viram barra: viram tabela. Comparar
                  margem entre procedimentos se faz lendo a coluna, não medindo
                  comprimento de barra a olho. */}
              <table className="grid-table">
                <thead>
                  <tr>
                    <th>Procedimento</th>
                    <th className="text-right">Qtd.</th>
                    <th className="text-right">Receita</th>
                    <th className="text-right">Custo</th>
                    <th className="text-right">Margem</th>
                    <th className="text-right">%</th>
                  </tr>
                </thead>
                <tbody>
                  {dados.procedimentos.map((p) => (
                    <tr key={p.procedureId ?? p.nome}>
                      <td className="font-medium text-ink">{p.nome}</td>
                      <td className="num text-right">{p.quantidade}</td>
                      <td className="num text-right">{formatBRL(p.receitaCents)}</td>
                      <td className="num text-right">{formatBRL(p.custoCents)}</td>
                      <td className="num text-right">{formatBRL(p.margemCents)}</td>
                      <td className="num text-right">
                        {p.margemPercent === null ? (
                          <span className="text-muted" title="Custo não preenchido no catálogo">
                            —
                          </span>
                        ) : (
                          percent(p.margemPercent)
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      ) : null}

      {dados.custoReal ? (
        <Panel className="mb-4">
          <PanelHead
            title="Executado: custo real"
            hint="Procedimentos FEITOS no período. Previsto é a ficha técnica ao custo de catálogo; real é o que saiu dos lotes. Não entram aluguel, cadeira nem folha."
          />
          {dados.custoReal.length === 0 ? (
            <p className="px-5 py-6 text-sm text-muted">
              Nenhum procedimento foi executado entre {rotulo}.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="grid-table">
                <thead>
                  <tr>
                    <th>Procedimento</th>
                    <th className="text-right">Feitos</th>
                    <th className="text-right">Receita</th>
                    <th className="text-right">Previsto</th>
                    <th className="text-right">Real</th>
                    <th className="text-right">Margem</th>
                    <th className="text-right">%</th>
                  </tr>
                </thead>
                <tbody>
                  {dados.custoReal.map((p) => {
                    const desvio = p.realCents - p.previstoCents;

                    return (
                      <tr key={p.procedureId}>
                        <td className="font-medium text-ink">
                          {p.nome}
                          {!p.temFicha ? (
                            /* A linha mais importante da tabela. Custo zero aqui
                               não é "barato": é "ninguém cadastrou o que este
                               procedimento consome". Um implante de R$ 3.200 com
                               custo zero mostraria 100% de margem — o número mais
                               perigoso que um relatório pode exibir. */
                            <span className="mt-0.5 block text-xs text-warning">
                              Sem ficha técnica: o custo real deste procedimento não é medido
                            </span>
                          ) : null}
                        </td>
                        <td className="num text-right">{p.execucoes}</td>
                        <td className="num text-right">{formatBRL(p.receitaCents)}</td>
                        <td className="num text-right text-muted">
                          {p.temFicha ? formatBRL(p.previstoCents) : "—"}
                        </td>
                        <td className="num text-right">
                          {p.temFicha ? (
                            <>
                              {formatBRL(p.realCents)}
                              {desvio !== 0 ? (
                                <span
                                  className={
                                    desvio > 0
                                      ? "block text-xs whitespace-nowrap text-critical"
                                      : "block text-xs whitespace-nowrap text-positive"
                                  }
                                >
                                  {desvio > 0 ? "+" : "−"}
                                  {formatBRL(Math.abs(desvio))} vs. previsto
                                </span>
                              ) : null}
                            </>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="num text-right">
                          {p.temFicha ? formatBRL(p.margemCents) : "—"}
                        </td>
                        <td className="num text-right">
                          {p.margemPercent === null ? (
                            <span className="text-muted">—</span>
                          ) : (
                            percent(p.margemPercent)
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
      ) : null}

      {dados.saidaAvulsa ? (
        <Panel className="mb-4">
          <PanelHead
            title="Saiu do estoque sem procedimento"
            hint={(() => {
              const perdido = dados.saidaAvulsa.reduce((s, l) => s + l.valorCents, 0);
              const consumido = (dados.custoReal ?? []).reduce((s, l) => s + l.realCents, 0);

              const base =
                "Perda e acerto de inventário. Não entra na margem de atendimento nenhum — é onde o desperdício aparece.";

              // A comparação só entra quando o desperdício passa do material
              // que virou atendimento. Fora desse caso ela seria uma fração
              // pequena repetida toda vez, e número que sempre aparece some
              // da vista.
              if (perdido === 0 || consumido === 0 || perdido <= consumido) return base;

              return `${base} Foram ${formatBRL(perdido)} — ${(perdido / consumido).toFixed(1).replace(".", ",")}× o material que os atendimentos consumiram no período.`;
            })()}
          />
          {dados.saidaAvulsa.length === 0 ? (
            <p className="px-5 py-6 text-sm text-muted">
              Nada saiu do estoque sem procedimento entre {rotulo}. É a notícia boa.
            </p>
          ) : (
            <Barras
              series={[{ rotulo: "Valor", cor: "critico" }]}
              linhas={dados.saidaAvulsa.map((l) => ({
                chave: `${l.produtoId}-${l.kind}`,
                rotulo: l.produto,
                meta: l.kind === "loss" ? "Perda" : "Acerto de inventário",
                valores: [l.valorCents],
                textos: [formatBRL(l.valorCents)],
                destaque: `${formatQuantidade(l.quantidade, l.stockUnit)} fora do estoque`,
              }))}
              vazio="Nada."
            />
          )}
        </Panel>
      ) : null}

      <Panel>
        <PanelHead
          title="Origem de captação"
          hint="Quem traz mais contato raramente é quem traz mais fechamento. As duas barras existem por isso."
        />
        <Barras
          series={[
            { rotulo: "Contatos", cor: "1" },
            { rotulo: "Fecharam", cor: "2" },
          ]}
          linhas={dados.origem.map((o) => ({
            chave: o.sourceId ?? "sem-origem",
            rotulo: o.nome,
            // Origem chamada "Indicação" no canal "indicacao" repetiria a
            // palavra embaixo dela mesma. O canal só aparece quando acrescenta.
            meta: rotuloCanal(o.canal) === o.nome ? undefined : rotuloCanal(o.canal),
            valores: [o.contatos, o.ganhos],
            textos: [
              plural(o.contatos, "contato", "contatos"),
              plural(o.ganhos, "fechou", "fecharam"),
            ],
            destaque: podeFinanceiro
              ? `${percent(o.conversao)} de conversão · ${formatBRL(o.ganhoCents)} fechados`
              : `${percent(o.conversao)} de conversão`,
          }))}
          vazio={`Nenhum contato entrou entre ${rotulo}.`}
        />
      </Panel>
    </>
  );
}
