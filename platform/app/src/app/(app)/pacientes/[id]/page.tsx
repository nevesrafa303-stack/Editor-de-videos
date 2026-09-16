import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { withPage } from "@/server/next/page";
import { getPatientOverview } from "@/modules/patient";
import {
  listRecentExecutions,
  previewConsumption,
  type ConsumoPrevisto,
  type ExecucaoRecente,
} from "@/modules/stock";
import { ExecutarItem, EstornarItem } from "./executar";
import { NotFound } from "@/shared/errors";
import { lerAviso } from "@/shared/flash";
import { Badge, Empty, LinkButton, Metric, Notice, PageHead, Panel, PanelHead, type Tone } from "@/ui";
import { IconAlert } from "@/ui/icons";
import {
  ageFrom,
  formatBRL,
  formatCPF,
  formatDateOnly,
  formatDateTime,
  formatPhone,
  relativeDays,
} from "@/shared/format";

export const metadata: Metadata = { title: "Paciente" };

const SINAL: Record<string, { rotulo: string; tom: Tone }> = {
  overdue_installment: { rotulo: "Parcela em atraso", tom: "critical" },
  pending_treatment: { rotulo: "Tratamento pendente", tom: "warning" },
  open_quote: { rotulo: "Orçamento em aberto", tom: "accent" },
  cooling_quote: { rotulo: "Orçamento esfriando", tom: "accent" },
  overdue_return: { rotulo: "Retorno vencido", tom: "warning" },
  inactive_patient: { rotulo: "Paciente inativo", tom: "neutral" },
  no_show_risk: { rotulo: "Risco de falta", tom: "warning" },
  birthday: { rotulo: "Aniversário", tom: "structure" },
  followup_due: { rotulo: "Retorno pós-procedimento", tom: "structure" },
  maintenance_due: { rotulo: "Manutenção ortodôntica", tom: "structure" },
};

const CONSULTA: Record<string, { rotulo: string; tom: Tone }> = {
  scheduled: { rotulo: "Agendado", tom: "neutral" },
  confirmed: { rotulo: "Confirmado", tom: "structure" },
  arrived: { rotulo: "Na recepção", tom: "structure" },
  in_progress: { rotulo: "Em atendimento", tom: "accent" },
  completed: { rotulo: "Atendido", tom: "positive" },
  no_show: { rotulo: "Faltou", tom: "warning" },
  canceled: { rotulo: "Cancelado", tom: "critical" },
};

export default async function PacientePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ aviso?: string }>;
}) {
  const { id } = await params;

  // A confirmação de "executei" chega pela URL, como no financeiro e no
  // faturamento: o item sai da lista de planejados no exato caso de sucesso, e
  // levaria junto qualquer mensagem presa ao formulário que o mostrava.
  const aviso = lerAviso((await searchParams).aviso);

  const dados = await withPage(async (ctx) => {
    const overview = await getPatientOverview(ctx, id).catch((error: unknown) => {
      if (error instanceof NotFound) return null;
      throw error;
    });

    if (!overview) return null;

    /*
     * A prévia do que sai do estoque, por item planejado.
     *
     * Vem junto com a tela, e não num clique depois: quem vai executar precisa
     * ver o material ANTES de marcar como feito. Descobrir que faltava produto
     * depois de o procedimento estar registrado é a ordem errada — e é assim
     * que nasce um estoque que ninguém confia.
     *
     * Só para quem pode executar. Para a recepção seria informação que ela não
     * usa, e uma consulta por item que ninguém leria.
     */
    const podeExecutar = ctx.can("treatment_plan.execute") && ctx.can("inventory.read");

    const previas: Record<string, ConsumoPrevisto[]> = {};
    let executados: ExecucaoRecente[] = [];

    if (podeExecutar) {
      for (const item of overview.pendentes) {
        previas[item.id as string] = await previewConsumption(ctx, item.id as string);
      }
      executados = await listRecentExecutions(ctx, id);
    }

    return {
      ...overview,
      previas,
      executados,
      podeExecutar,
      podeVerProntuario: ctx.can("chart.read"),
      podeOrcar: ctx.can("quote.write"),
      fuso: ctx.session.timezone,
    };
  }, "patient.read");

  if (!dados) notFound();

  const { patient, consultas, parcelas, orcamentos, pendentes, sinais, alertas, totais } = dados;
  const fuso = dados.fuso;
  const idade = ageFrom(patient.birth_date, fuso);
  const proxima = consultas.find(
    (c) => c.starts_at >= new Date() && (c.status === "scheduled" || c.status === "confirmed"),
  );

  return (
    <>
      <PageHead
        title={patient.full_name}
        meta={
          <span className="num flex flex-wrap items-center gap-x-3 gap-y-1">
            <span>#{patient.code}</span>
            {idade !== null ? <span>{idade} anos</span> : null}
            <span>{formatPhone(patient.phone)}</span>
            <span>{formatCPF(patient.tax_id)}</span>
          </span>
        }
        action={
          <span className="flex gap-2">
            {dados.podeVerProntuario ? (
              <LinkButton href={`/pacientes/${patient.id}/prontuario`}>Prontuário</LinkButton>
            ) : null}
            <LinkButton href="/pacientes" variant="secondary">
              Voltar
            </LinkButton>
          </span>
        }
      />

      {aviso ? (
        <div className="mb-4">
          <Notice tone="positive">{aviso}</Notice>
        </div>
      ) : null}

      {alertas.length > 0 ? (
        <div className="mb-5">
          <Notice tone="critical">
            <span className="flex items-start gap-2">
              <IconAlert className="mt-0.5 shrink-0" />
              <span>
                <strong className="font-semibold">Atenção clínica:</strong>{" "}
                {alertas.join(" · ")}
              </span>
            </span>
          </Notice>
        </div>
      ) : null}

      <Panel aria-label="Resumo do paciente" className="mb-5 grid gap-5 p-5 sm:grid-cols-2 lg:grid-cols-4">
        <Metric
          label="Em aberto"
          value={formatBRL(totais.emAbertoCents)}
          hint={
            totais.atrasadoCents > 0
              ? `${formatBRL(totais.atrasadoCents)} vencidos`
              : "Nada vencido"
          }
          tone={totais.atrasadoCents > 0 ? "critical" : totais.emAbertoCents > 0 ? "warning" : "neutral"}
        />
        <Metric
          label="Próxima consulta"
          value={proxima ? formatDateTime(proxima.starts_at, fuso) : "Sem agendamento"}
          hint={proxima ? `${relativeDays(proxima.starts_at, fuso)} · ${proxima.profissional}` : undefined}
          tone={proxima ? "structure" : "neutral"}
        />
        <Metric
          label="Tratamento pendente"
          value={formatBRL(totais.pendentesCents)}
          hint={`${pendentes.length} ${pendentes.length === 1 ? "procedimento" : "procedimentos"} planejados`}
          tone={pendentes.length > 0 ? "warning" : "neutral"}
        />
        <Metric
          label="Orçamento em aberto"
          value={formatBRL(totais.orcamentoAbertoCents)}
          hint={`${orcamentos.length} ${orcamentos.length === 1 ? "proposta" : "propostas"} sem resposta`}
          tone={orcamentos.length > 0 ? "accent" : "neutral"}
        />
      </Panel>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <div className="space-y-5">
          <Panel>
            <PanelHead
              title="Oportunidades"
              hint="Calculadas pelo sistema. O motivo fica junto do sinal."
            />
            {sinais.length === 0 ? (
              <Empty title="Nada pendente para este paciente" />
            ) : (
              <ul className="divide-y divide-line">
                {sinais.map((sinal) => {
                  const meta = SINAL[sinal.kind] ?? { rotulo: sinal.kind, tom: "neutral" as Tone };

                  return (
                    <li key={sinal.id} className="flex items-start gap-3 px-5 py-3.5">
                      <Badge tone={meta.tom}>{meta.rotulo}</Badge>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-ink-soft">{sinal.reason}</p>
                        {sinal.due_on ? (
                          <p className="mt-0.5 text-xs text-muted">
                            {relativeDays(new Date(`${sinal.due_on}T12:00:00Z`), fuso)}
                          </p>
                        ) : null}
                      </div>
                      {sinal.value_cents > 0 ? (
                        <span className="num text-sm font-semibold text-ink">
                          {formatBRL(sinal.value_cents)}
                        </span>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>

          <Panel>
            <PanelHead
              title="Tratamentos planejados"
              hint="Itens aprovados que ainda não foram executados."
            />
            {pendentes.length === 0 ? (
              <Empty title="Nenhum procedimento pendente" />
            ) : (
              <ul className="divide-y divide-line">
                {pendentes.map((item) => (
                  <li key={item.id} className="flex items-start gap-3 px-5 py-3">
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-ink">{item.description}</span>
                      <span className="block text-xs text-muted">
                        {item.tooth_code
                          ? `Dente ${item.tooth_code}`
                          : (item.region_code ?? "Sem localização")}
                      </span>
                    </span>
                    <span className="num pt-0.5 text-sm text-ink-soft">
                      {formatBRL(Math.round(Number(item.quantity) * item.unit_price_cents))}
                    </span>
                    {dados.podeExecutar ? (
                      <ExecutarItem
                        itemId={item.id as string}
                        patientId={patient.id as string}
                        previa={dados.previas[item.id as string] ?? []}
                      />
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          {dados.podeExecutar && dados.executados.length > 0 ? (
            <Panel>
              <PanelHead
                title="Executado nos últimos dias"
                hint="Clicou no dente errado? Desfazer devolve o material ao lote de onde saiu."
              />
              <ul className="divide-y divide-line">
                {dados.executados.map((e) => (
                  <li key={e.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-ink">{e.descricao}</span>
                      <span className="block text-xs text-muted">
                        {[
                          e.onde,
                          formatDateTime(e.executadoEm, fuso),
                          e.profissional,
                          e.materiais === 0
                            ? "sem material"
                            : e.materiais === 1
                              ? "1 material baixado"
                              : `${e.materiais} materiais baixados`,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                    </span>
                    <EstornarItem itemId={e.id} patientId={patient.id as string} />
                  </li>
                ))}
              </ul>
            </Panel>
          ) : null}

          <Panel>
            <PanelHead title="Atendimentos" hint={`${consultas.length} entre os próximos e os últimos`} />
            {consultas.length === 0 ? (
              <Empty title="Nenhum atendimento registrado" />
            ) : (
              <ul className="divide-y divide-line">
                {consultas.map((consulta) => {
                  const meta = CONSULTA[consulta.status] ?? {
                    rotulo: consulta.status,
                    tom: "neutral" as Tone,
                  };

                  return (
                    <li key={consulta.id} className="flex items-center gap-3 px-5 py-3">
                      <span
                        aria-hidden
                        className="h-8 w-1 shrink-0 rounded-full"
                        style={{ backgroundColor: consulta.cor }}
                      />
                      <span className="num w-32 shrink-0 text-sm text-ink-soft">
                        {formatDateTime(consulta.starts_at, fuso)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm text-ink">
                          {consulta.procedimento ?? "Atendimento"}
                        </span>
                        <span className="block truncate text-xs text-muted">
                          {consulta.profissional}
                        </span>
                      </span>
                      <Badge tone={meta.tom}>{meta.rotulo}</Badge>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>
        </div>

        <div className="space-y-5">
          <Panel>
            <PanelHead title="Parcelas" hint="Somente o que está em aberto." />
            {parcelas.length === 0 ? (
              <Empty title="Nada a receber" />
            ) : (
              <ul className="divide-y divide-line">
                {parcelas.map((parcela) => {
                  const vencida = new Date(`${parcela.due_on}T12:00:00Z`) < new Date();
                  const saldo = parcela.amount_cents - parcela.paid_cents;

                  return (
                    <li key={parcela.id} className="flex items-center gap-3 px-5 py-3">
                      <span className="num w-10 shrink-0 text-xs text-muted">
                        {parcela.number}/{parcela.total_count}
                      </span>
                      <span className="num min-w-0 flex-1 text-sm text-ink-soft">
                        {formatDateOnly(parcela.due_on)}
                      </span>
                      <span
                        className={`num text-sm font-medium ${vencida ? "text-critical" : "text-ink"}`}
                      >
                        {formatBRL(saldo)}
                      </span>
                      {vencida ? <Badge tone="critical">vencida</Badge> : null}
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>

          <Panel>
            <PanelHead
              title="Orçamentos em aberto"
              action={
                dados.podeOrcar ? (
                  <LinkButton
                    href={`/orcamentos/novo?paciente=${patient.id}`}
                    variant="secondary"
                    size="sm"
                  >
                    Novo
                  </LinkButton>
                ) : null
              }
            />
            {orcamentos.length === 0 ? (
              <Empty
                title="Nenhum orçamento aguardando resposta"
                hint={
                  pendentes.length > 0
                    ? "Há tratamento planejado esperando virar proposta."
                    : undefined
                }
                action={
                  dados.podeOrcar ? (
                    <LinkButton
                      href={`/orcamentos/novo?paciente=${patient.id}`}
                      variant="secondary"
                    >
                      Montar orçamento
                    </LinkButton>
                  ) : null
                }
              />
            ) : (
              <ul className="divide-y divide-line">
                {orcamentos.map((orcamento) => (
                  <li key={orcamento.id} className="px-5 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <Link
                        href={`/orcamentos/${orcamento.id}`}
                        className="num text-sm font-medium text-ink hover:text-structure"
                      >
                        ORC-{String(orcamento.number).padStart(4, "0")}
                      </Link>
                      <span className="num text-sm font-semibold text-ink">
                        {formatBRL(orcamento.total_cents ?? 0)}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-muted">
                      {orcamento.sent_at ? `Enviado ${relativeDays(orcamento.sent_at, fuso)}` : "Não enviado"}
                      {orcamento.valid_until
                        ? ` · vale até ${formatDateOnly(orcamento.valid_until)}`
                        : ""}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel>
            <PanelHead
              title="Prontuário"
              hint={
                dados.podeVerProntuario
                  ? "Abrir registra o acesso."
                  : "Seu perfil não acessa dado clínico."
              }
            />
            <div className="px-5 py-4">
              {dados.podeVerProntuario ? (
                dados.ultimaEvolucao ? (
                  <p className="text-sm text-ink-soft">
                    Última evolução em{" "}
                    <strong className="font-medium text-ink">
                      {formatDateTime(dados.ultimaEvolucao.created_at, fuso)}
                    </strong>
                    {dados.ultimaEvolucao.profissional
                      ? `, por ${dados.ultimaEvolucao.profissional}.`
                      : "."}
                  </p>
                ) : (
                  <p className="text-sm text-muted">Nenhuma evolução registrada.</p>
                )
              ) : (
                <p className="text-sm text-muted">
                  Prontuário é dado de saúde: o acesso é restrito ao time clínico.
                </p>
              )}
            </div>
          </Panel>
        </div>
      </div>
    </>
  );
}
