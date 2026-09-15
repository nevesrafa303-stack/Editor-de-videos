import type { Metadata } from "next";
import { withPage } from "@/server/next/page";
import { getFinanceOverview, getPaymentMethods, listInstallments, RECORTES } from "@/modules/finance";
import type { Recorte } from "@/modules/finance";
import { Badge, LinkButton, Metric, Notice, PageHead, Panel, PanelHead } from "@/ui";
import { formatBRL, formatDateTime } from "@/shared/format";
import { lerAviso } from "@/shared/flash";
import { Parcelas } from "./receber";

export const metadata: Metadata = { title: "Financeiro" };

const ROTULO: Record<Recorte, string> = {
  vencidas: "Vencidas",
  hoje: "Vencem hoje",
  semana: "Próximos 7 dias",
  abertas: "Todas em aberto",
  pagas: "Recebidas",
};

export default async function FinanceiroPage({
  searchParams,
}: {
  searchParams: Promise<{ recorte?: string; busca?: string; aviso?: string }>;
}) {
  const params = await searchParams;
  const recorte = RECORTES.includes(params.recorte as Recorte)
    ? (params.recorte as Recorte)
    : "vencidas";
  const busca = params.busca?.trim() ?? "";
  const aviso = lerAviso(params.aviso);

  const dados = await withPage(async (ctx) => {
    const [resumo, lista, metodos] = await Promise.all([
      getFinanceOverview(ctx),
      listInstallments(ctx, { recorte, ...(busca ? { search: busca } : {}), limit: 100 }),
      getPaymentMethods(ctx),
    ]);

    return {
      resumo,
      lista,
      metodos: metodos.map((m) => ({
        id: m.id as string,
        name: m.name,
        affectsCash: m.affects_cash_session,
      })),
      podeReceber: ctx.can("payment.register"),
      fuso: ctx.session.timezone,
    };
  }, "receivable.read");

  const { resumo, lista, metodos, podeReceber, fuso } = dados;

  return (
    <>
      <PageHead
        title="Financeiro"
        meta={
          resumo.caixa
            ? `Caixa aberto desde ${formatDateTime(resumo.caixa.openedAt, fuso)} por ${resumo.caixa.openedBy}`
            : "Nenhum caixa aberto nesta unidade"
        }
        action={
          <LinkButton href="/financeiro/caixa" variant={resumo.caixa ? "secondary" : "primary"}>
            {resumo.caixa ? "Ver caixa" : "Abrir caixa"}
          </LinkButton>
        }
      />

      {aviso ? (
        <div className="mb-4">
          <Notice tone="positive">{aviso}</Notice>
        </div>
      ) : null}

      <Panel
        aria-label="Resumo financeiro"
        className="mb-4 grid gap-5 p-5 sm:grid-cols-2 lg:grid-cols-4"
      >
        <Metric
          label="Vencido"
          value={formatBRL(resumo.vencidoCents)}
          hint={`${resumo.vencidoCount} ${resumo.vencidoCount === 1 ? "parcela" : "parcelas"} em atraso`}
          tone={resumo.vencidoCents > 0 ? "critical" : "positive"}
        />
        <Metric
          label="Vence em 7 dias"
          value={formatBRL(resumo.venceSemanaCents)}
          hint="Hora de confirmar com o paciente"
          tone={resumo.venceSemanaCents > 0 ? "warning" : "neutral"}
        />
        <Metric
          label="A receber"
          value={formatBRL(resumo.aReceberCents)}
          hint="Tudo que ainda não entrou"
          tone="structure"
        />
        <Metric
          label="Recebido no mês"
          value={formatBRL(resumo.recebidoMesCents)}
          hint={
            resumo.comissaoMesCents > 0
              ? `${formatBRL(resumo.comissaoMesCents)} de comissão gerada`
              : "Nenhuma comissão no mês"
          }
          tone={resumo.recebidoMesCents > 0 ? "positive" : "neutral"}
        />
      </Panel>

      <Panel className="mb-4 p-4">
        <form className="flex flex-wrap items-end gap-3">
          <label className="min-w-56 flex-1">
            <span className="label">Buscar paciente</span>
            <input id="busca" name="busca" defaultValue={busca} className="field" />
          </label>

          <label className="min-w-44">
            <span className="label">Recorte</span>
            <select id="recorte" name="recorte" defaultValue={recorte} className="field">
              {RECORTES.map((r) => (
                <option key={r} value={r}>
                  {ROTULO[r]}
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
        <PanelHead
          title={ROTULO[recorte]}
          hint="Multa e juros são calculados na hora, nunca gravados — parcela vencida vale outro valor amanhã."
          action={<Badge tone="neutral">{lista.total}</Badge>}
        />
        <Parcelas
          items={lista.items}
          metodos={metodos}
          podeReceber={podeReceber}
          temCaixaAberto={resumo.caixa !== null}
          recorte={recorte}
          busca={busca}
        />
      </Panel>
    </>
  );
}
