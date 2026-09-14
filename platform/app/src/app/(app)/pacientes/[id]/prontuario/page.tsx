import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { withPage } from "@/server/next/page";
import { getChartAccessLog, getPatientChart } from "@/modules/chart";
import { NotFound } from "@/shared/errors";
import { LinkButton, Notice, PageHead, Panel, PanelHead } from "@/ui";
import { IconAlert } from "@/ui/icons";
import { ageFrom, formatCPF, formatDateTime, formatPhone } from "@/shared/format";
import { PainelOdontograma } from "./painel-odontograma";
import { Anamnese } from "./anamnese";
import { Evolucoes, NovaEvolucao } from "./evolucoes";

export const metadata: Metadata = { title: "Prontuário" };

export default async function ProntuarioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const dados = await withPage(async (ctx) => {
    const chart = await getPatientChart(ctx, id).catch((error: unknown) => {
      if (error instanceof NotFound) return null;
      throw error;
    });

    if (!chart) return null;

    // A trilha so aparece para quem pode auditar. Mostra-la a todos seria
    // transformar o registro de acesso em vigilancia lateral entre colegas.
    const acessos = ctx.can("audit.read") ? await getChartAccessLog(ctx, id) : [];

    return {
      chart,
      acessos,
      fuso: ctx.session.timezone,
      ehProfissional: ctx.session.isProvider,
    };
  }, "chart.read");

  // Paciente de outra rede, paciente apagado, ou prontuário que a política da
  // clínica não deixa esta pessoa abrir: os três respondem a mesma coisa.
  if (!dados) notFound();

  const { chart, acessos, fuso, ehProfissional } = dados;
  const idade = ageFrom(chart.patient.birthDate, fuso);

  return (
    <>
      <PageHead
        title={chart.patient.fullName}
        meta={
          <span className="num flex flex-wrap items-center gap-x-3 gap-y-1">
            <span>Prontuário</span>
            <span>#{chart.patient.code}</span>
            {idade !== null ? <span>{idade} anos</span> : null}
            <span>{formatPhone(chart.patient.phone)}</span>
            <span>{formatCPF(chart.patient.taxId)}</span>
          </span>
        }
        action={
          <LinkButton href={`/pacientes/${chart.patient.id}`} variant="secondary">
            Ver resumo
          </LinkButton>
        }
      />

      {chart.alerts.length > 0 ? (
        <div className="mb-5">
          <Notice tone="critical">
            <span className="flex items-start gap-2">
              <IconAlert className="mt-0.5 shrink-0" />
              <span>
                <strong className="font-semibold">Atenção clínica:</strong>{" "}
                {chart.alerts.join(" · ")}
              </span>
            </span>
          </Notice>
        </div>
      ) : null}

      <p className="mb-5 rounded-md border border-line bg-sunken/60 px-4 py-2.5 text-xs text-muted">
        Esta abertura ficou registrada na trilha de acesso, com seu nome, a hora e o IP. É
        exigência da LGPD para dado de saúde, e vale para todo mundo — inclusive a dona da
        clínica.
      </p>

      <div className="space-y-5">
        <Panel className="overflow-hidden">
          <PanelHead
            title="Odontograma"
            hint="Clique em um dente para ver o histórico ou lançar uma condição."
          />
          <PainelOdontograma
            patientId={chart.patient.id}
            teeth={chart.teeth}
            podeEscrever={chart.can.write && ehProfissional}
            fuso={fuso}
          />
        </Panel>

        {chart.anamnesis ? (
          <Panel className="overflow-hidden">
            <PanelHead
              title={chart.anamnesis.templateName}
              hint="As respostas marcadas viram o alerta vermelho do topo."
            />
            <Anamnese
              patientId={chart.patient.id}
              anamnesis={chart.anamnesis}
              podeEscrever={chart.can.write}
              fuso={fuso}
            />
          </Panel>
        ) : null}

        <Panel className="overflow-hidden">
          <PanelHead
            title="Evoluções"
            hint="Assinadas, imutáveis depois de fechadas. Correção é aditamento."
          />
          {chart.can.write && ehProfissional ? (
            <NovaEvolucao patientId={chart.patient.id} />
          ) : (
            <p className="border-b border-line px-5 py-3 text-xs text-muted">
              {chart.can.write
                ? "Somente profissional de saúde registra evolução clínica."
                : "Seu perfil lê o prontuário, mas não escreve nele."}
            </p>
          )}
          <Evolucoes
            patientId={chart.patient.id}
            notes={chart.notes}
            podeAditar={chart.can.amend && ehProfissional}
            fuso={fuso}
          />
        </Panel>

        {acessos.length > 0 ? (
          <Panel className="overflow-hidden">
            <PanelHead
              title="Quem abriu este prontuário"
              hint="Trilha exigida pela LGPD. Não pode ser alterada nem apagada — nem por quem administra a clínica."
            />
            <details className="px-5 py-3">
              <summary className="cursor-pointer text-sm text-ink-soft">
                {acessos.length} {acessos.length === 1 ? "acesso registrado" : "acessos registrados"}
              </summary>
              <ul className="mt-3 divide-y divide-line">
                {acessos.map((a) => (
                  <li key={a.id} className="flex flex-wrap items-center gap-x-3 gap-y-0.5 py-2">
                    <span className="num w-36 shrink-0 text-xs text-muted">
                      {formatDateTime(a.occurred_at, fuso)}
                    </span>
                    <span className="text-sm text-ink-soft">{a.actor ?? "—"}</span>
                    <span className="text-xs text-muted">{a.purpose}</span>
                    {a.ip_address ? (
                      <span className="num text-xs text-muted">{a.ip_address}</span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </details>
          </Panel>
        ) : null}
      </div>
    </>
  );
}
