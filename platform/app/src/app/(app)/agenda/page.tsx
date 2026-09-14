import type { Metadata } from "next";
import { withPage } from "@/server/next/page";
import { getDayAgenda } from "@/modules/scheduling";
import { Badge, Empty, LinkButton, Metric, Panel, PanelHead, PageHead } from "@/ui";
import { IconPlus } from "@/ui/icons";
import { formatBRL } from "@/shared/format";
import { Grade, hhmm } from "./grade";
import { Fila } from "./fila";

export const metadata: Metadata = { title: "Agenda" };

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ data?: string; profissional?: string; agendado?: string }>;
}) {
  const params = await searchParams;

  const dados = await withPage(async (ctx) => {
    // O "hoje" da tela e o da clinica, nao o do servidor: a sessao ja carrega
    // o fuso da unidade ativa.
    const tz = ctx.session.timezone;
    const hoje = emFuso(new Date(), tz);
    const dia = /^\d{4}-\d{2}-\d{2}$/.test(params.data ?? "") ? (params.data as string) : hoje;

    const agenda = await getDayAgenda(ctx, {
      date: dia,
      ...(params.profissional ? { providerId: params.profissional } : {}),
    });

    return {
      agenda,
      hoje,
      podeAgendar: ctx.can("appointment.write"),
      agoraMinuto: dia === hoje ? minutoLocal(new Date(), tz) : null,
    };
  }, "appointment.read");

  const { agenda, hoje, podeAgendar, agoraMinuto } = dados;
  const { totals: t } = agenda;

  const ocupacao =
    t.minutosDisponiveis > 0 ? Math.round((t.minutosOcupados / t.minutosDisponiveis) * 100) : 0;

  return (
    <>
      <PageHead
        title="Agenda"
        meta={
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span>{agenda.unit.name}</span>
            <span aria-hidden>·</span>
            <span className="num">{porExtenso(agenda.date)}</span>
            {agenda.waitlist > 0 ? (
              <Badge tone="accent">
                {agenda.waitlist} na lista de espera
              </Badge>
            ) : null}
          </span>
        }
        action={
          podeAgendar ? (
            <LinkButton href={`/agenda/novo?data=${agenda.date}`}>
              <IconPlus /> Encaixar
            </LinkButton>
          ) : null
        }
      />

      <Panel className="mb-4 flex flex-wrap items-end justify-between gap-3 p-4">
        <form className="flex flex-wrap items-end gap-2">
          <label>
            <span className="label">Dia</span>
            <input
              type="date"
              id="data"
              name="data"
              defaultValue={agenda.date}
              className="h-9 rounded-md border border-line bg-surface px-3 text-sm text-ink shadow-xs focus:border-structure focus:ring-2 focus:ring-structure/20 focus:outline-none"
            />
          </label>
          <button
            type="submit"
            className="mb-0.5 h-9 rounded-md bg-ink px-4 text-sm font-medium text-white transition hover:bg-ink/90"
          >
            Ir
          </button>
        </form>

        <span className="flex flex-wrap gap-2">
          <LinkButton variant="secondary" size="sm" href={`/agenda?data=${somarDias(agenda.date, -1)}`}>
            ← Ontem
          </LinkButton>
          <LinkButton variant={agenda.date === hoje ? "primary" : "secondary"} size="sm" href="/agenda">
            Hoje
          </LinkButton>
          <LinkButton variant="secondary" size="sm" href={`/agenda?data=${somarDias(agenda.date, 1)}`}>
            Amanhã →
          </LinkButton>
        </span>
      </Panel>

      <Panel aria-label="Resumo do dia" className="mb-4 grid gap-5 p-5 sm:grid-cols-2 lg:grid-cols-4">
        <Metric
          label="Atendimentos"
          value={String(t.total)}
          hint={`${t.atendidos} concluídos · ${t.emAtendimento} em curso`}
          tone={t.total > 0 ? "structure" : "neutral"}
        />
        <Metric
          label="A confirmar"
          value={String(t.aConfirmar)}
          hint={t.aConfirmar > 0 ? "Confirme antes da véspera" : "Tudo confirmado"}
          tone={t.aConfirmar > 0 ? "warning" : "positive"}
        />
        <Metric
          label="Ocupação"
          value={`${ocupacao}%`}
          hint={`${Math.round(t.minutosOcupados / 60)}h de ${Math.round(t.minutosDisponiveis / 60)}h de expediente`}
          tone={ocupacao >= 70 ? "positive" : ocupacao >= 40 ? "warning" : "critical"}
        />
        <Metric
          label="Receita prevista"
          value={formatBRL(t.receitaPrevistaCents)}
          hint={
            t.faltas + t.cancelados > 0
              ? `${t.faltas} falta(s) · ${t.cancelados} cancelado(s)`
              : "Nenhuma falta hoje"
          }
          tone={t.faltas + t.cancelados > 0 ? "warning" : "positive"}
        />
      </Panel>

      {params.agendado ? (
        <p className="mb-4 rounded-md border border-positive/25 bg-positive-soft px-4 py-2.5 text-sm font-medium text-positive">
          Agendamento criado.
        </p>
      ) : null}

      <Panel className="mb-5 overflow-hidden">
        <PanelHead
          title="Grade do dia"
          hint={
            agenda.providers.length > 0
              ? `${agenda.providers.length} profissionais · ${hhmm(agenda.window.startMinute)} às ${hhmm(agenda.window.endMinute)}`
              : undefined
          }
        />
        {agenda.providers.length === 0 ? (
          <Empty
            title="Nenhum profissional com expediente nesta unidade"
            hint="Cadastre a disponibilidade para a grade aparecer."
          />
        ) : (
          <Grade
            window={agenda.window}
            providers={agenda.providers}
            appointments={agenda.appointments}
            blocks={agenda.blocks}
            agora={agoraMinuto}
          />
        )}
      </Panel>

      <Panel className="overflow-hidden">
        <PanelHead
          title="Fila do dia"
          hint="Confirmar, receber, iniciar e concluir — a transição é validada no banco."
        />
        <Fila appointments={agenda.appointments} />
      </Panel>
    </>
  );
}

/** `YYYY-MM-DD` no fuso pedido, sem biblioteca: `sv-SE` ja e ISO. */
function emFuso(date: Date, timeZone: string): string {
  return date.toLocaleDateString("sv-SE", { timeZone });
}

function minutoLocal(date: Date, timeZone: string): number {
  const [h, m] = date
    .toLocaleTimeString("pt-BR", { timeZone, hour: "2-digit", minute: "2-digit", hour12: false })
    .split(":");
  return Number(h) * 60 + Number(m);
}

function somarDias(iso: string, dias: number): string {
  const base = new Date(`${iso}T12:00:00Z`);
  base.setUTCDate(base.getUTCDate() + dias);
  return base.toISOString().slice(0, 10);
}

function porExtenso(iso: string): string {
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    timeZone: "UTC",
  });
}
