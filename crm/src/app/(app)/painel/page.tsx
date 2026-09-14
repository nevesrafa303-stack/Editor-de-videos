import type { Metadata } from "next";
import Link from "next/link";
import { requireTenant } from "@/server/tenant";
import { can } from "@/server/permissions";
import { funnelMetrics } from "@/domain/funnel";
import { endOfDay, endOfMonth, startOfDay, startOfMonth } from "@/domain/scheduling";
import { formatBRL } from "@/lib/money";
import { formatDate, formatTime, relativeDays, toISODate } from "@/lib/date";
import { firstName, formatPhone, whatsappLink } from "@/lib/br";
import { Alert, Badge, Card, CardHeader, EmptyState, LinkButton, PageHeader, Stat } from "@/components/ui";
import { IconWhatsapp } from "@/components/icons";

export const metadata: Metadata = { title: "Painel" };

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const { db, session } = await requireTenant();
  const { erro } = await searchParams;

  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const canSeeFinance = can(session.role, "finance:read");
  const canSeeLeads = can(session.role, "leads:read");

  const [
    todayAppointments,
    monthAppointments,
    leads,
    followUps,
    receivedMonth,
    overdue,
    birthdays,
  ] = await Promise.all([
    db.appointment.findMany({
      where: { startsAt: { gte: todayStart, lte: todayEnd } },
      orderBy: { startsAt: "asc" },
      include: {
        patient: { select: { id: true, name: true, phone: true } },
        professional: { select: { name: true, color: true } },
        procedure: { select: { name: true } },
      },
    }),
    db.appointment.findMany({
      where: { startsAt: { gte: monthStart, lte: monthEnd } },
      select: { status: true },
    }),
    canSeeLeads
      ? db.lead.findMany({ select: { stage: true, valueCents: true } })
      : Promise.resolve([]),
    canSeeLeads
      ? db.lead.findMany({
          where: {
            nextFollowUpAt: { lte: todayEnd },
            stage: { notIn: ["GANHO", "PERDIDO"] },
          },
          orderBy: { nextFollowUpAt: "asc" },
          take: 10,
          select: { id: true, name: true, phone: true, nextFollowUpAt: true, interest: true },
        })
      : Promise.resolve([]),
    canSeeFinance
      ? db.payment.aggregate({
          where: { paidAt: { gte: monthStart, lte: monthEnd } },
          _sum: { amountCents: true },
        })
      : Promise.resolve({ _sum: { amountCents: 0 } }),
    canSeeFinance
      ? db.installment.findMany({
          where: { status: "ABERTA", dueDate: { lt: todayStart } },
          select: { amountCents: true, paidCents: true },
        })
      : Promise.resolve([]),
    db.patient.findMany({
      where: { active: true, birthDate: { not: null } },
      select: { id: true, name: true, phone: true, birthDate: true },
    }),
  ]);

  const attended = monthAppointments.filter((a) => a.status === "ATENDIDO").length;
  const noShow = monthAppointments.filter((a) => a.status === "FALTOU").length;
  const noShowRate =
    attended + noShow === 0 ? 0 : Math.round((noShow / (attended + noShow)) * 100);

  const metrics = funnelMetrics(leads);
  const overdueCents = overdue.reduce((sum, row) => sum + row.amountCents - row.paidCents, 0);

  const birthdaysThisWeek = birthdays
    .filter((patient) => {
      if (!patient.birthDate) return false;
      const next = new Date(
        now.getFullYear(),
        patient.birthDate.getMonth(),
        patient.birthDate.getDate(),
      );
      const diff = (next.getTime() - todayStart.getTime()) / 86_400_000;
      return diff >= 0 && diff <= 7;
    })
    .slice(0, 6);

  const confirmedToday = todayAppointments.filter(
    (a) => a.status === "CONFIRMADO" || a.status === "ATENDIDO",
  ).length;

  return (
    <>
      <PageHeader
        title={`Olá, ${firstName(session.name)}`}
        description={`${session.clinicName} · ${formatDate(now)}`}
        action={
          <LinkButton href={`/agenda?data=${toISODate(now)}`} variant="secondary">
            Abrir agenda
          </LinkButton>
        }
      />

      {erro === "sem-permissao" ? (
        <div className="mb-4">
          <Alert>Seu perfil não tem acesso a essa área.</Alert>
        </div>
      ) : null}

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Atendimentos hoje"
          value={todayAppointments.length}
          hint={`${confirmedToday} confirmados`}
        />
        <Stat
          label="Faltas no mês"
          value={`${noShowRate}%`}
          hint={`${noShow} faltas em ${attended + noShow} atendimentos`}
          tone={noShowRate > 15 ? "negative" : "neutral"}
        />
        {canSeeLeads ? (
          <Stat
            label="Pipeline"
            value={formatBRL(metrics.pipelineCents)}
            hint={`${metrics.open} leads em aberto`}
            tone="brand"
          />
        ) : null}
        {canSeeFinance ? (
          <Stat
            label="Recebido no mês"
            value={formatBRL(receivedMonth._sum.amountCents ?? 0)}
            hint={overdueCents > 0 ? `${formatBRL(overdueCents)} em atraso` : "Sem atrasos"}
            tone={overdueCents > 0 ? "negative" : "positive"}
          />
        ) : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Agenda de hoje"
            description={`${todayAppointments.length} atendimentos`}
            action={
              <LinkButton href={`/agenda?data=${toISODate(now)}`} variant="ghost" size="sm">
                Ver tudo
              </LinkButton>
            }
          />

          {todayAppointments.length === 0 ? (
            <EmptyState
              title="Nenhum atendimento hoje"
              description="Bom momento para reativar pacientes antigos e trabalhar o funil."
            />
          ) : (
            <ul className="divide-y divide-slate-100">
              {todayAppointments.map((appointment) => (
                <li key={appointment.id} className="flex items-center gap-3 px-5 py-3">
                  <span
                    className="h-9 w-1 shrink-0 rounded-full"
                    style={{ backgroundColor: appointment.professional.color }}
                  />
                  <span className="w-12 shrink-0 text-sm font-semibold text-slate-700 tabular-nums">
                    {formatTime(appointment.startsAt)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <Link
                      href={`/pacientes/${appointment.patient.id}`}
                      className="block truncate text-sm font-medium text-slate-800 hover:text-brand-700"
                    >
                      {appointment.patient.name}
                    </Link>
                    <span className="block truncate text-xs text-slate-500">
                      {appointment.procedure?.name ?? "Atendimento"} ·{" "}
                      {appointment.professional.name}
                    </span>
                  </span>
                  <Badge
                    tone={
                      appointment.status === "ATENDIDO"
                        ? "success"
                        : appointment.status === "CONFIRMADO"
                          ? "info"
                          : appointment.status === "FALTOU"
                            ? "warning"
                            : appointment.status === "CANCELADO"
                              ? "danger"
                              : "neutral"
                    }
                  >
                    {appointment.status.toLowerCase()}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <div className="space-y-4">
          {canSeeLeads ? (
            <Card>
              <CardHeader
                title="Retornos de hoje"
                description="Leads com follow-up agendado ou vencido."
                action={
                  <LinkButton href="/funil" variant="ghost" size="sm">
                    Funil
                  </LinkButton>
                }
              />

              {followUps.length === 0 ? (
                <EmptyState title="Nenhum retorno pendente" />
              ) : (
                <ul className="divide-y divide-slate-100">
                  {followUps.map((lead) => (
                    <li key={lead.id} className="flex items-center gap-2 px-5 py-3">
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/funil/${lead.id}`}
                          className="block truncate text-sm font-medium text-slate-800 hover:text-brand-700"
                        >
                          {lead.name}
                        </Link>
                        <span className="block truncate text-xs text-slate-500">
                          {lead.interest ?? formatPhone(lead.phone)}
                        </span>
                      </div>
                      {lead.nextFollowUpAt ? (
                        <Badge tone={lead.nextFollowUpAt < todayStart ? "danger" : "info"}>
                          {relativeDays(lead.nextFollowUpAt)}
                        </Badge>
                      ) : null}
                      <a
                        href={whatsappLink(lead.phone, `Olá ${firstName(lead.name)}!`)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-emerald-600 hover:text-emerald-700"
                        title="Abrir no WhatsApp"
                      >
                        <IconWhatsapp />
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          ) : null}

          <Card>
            <CardHeader
              title="Aniversariantes"
              description="Próximos 7 dias — motivo facil para reaproximar."
            />
            {birthdaysThisWeek.length === 0 ? (
              <EmptyState title="Nenhum aniversário na semana" />
            ) : (
              <ul className="divide-y divide-slate-100">
                {birthdaysThisWeek.map((patient) => (
                  <li key={patient.id} className="flex items-center gap-2 px-5 py-3">
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/pacientes/${patient.id}`}
                        className="block truncate text-sm font-medium text-slate-800 hover:text-brand-700"
                      >
                        {patient.name}
                      </Link>
                      <span className="block text-xs text-slate-500">
                        {patient.birthDate
                          ? `${patient.birthDate.getDate()}/${patient.birthDate.getMonth() + 1}`
                          : ""}
                      </span>
                    </div>
                    <a
                      href={whatsappLink(
                        patient.phone,
                        `Feliz aniversário, ${firstName(patient.name)}!`,
                      )}
                      target="_blank"
                      rel="noreferrer"
                      className="text-emerald-600 hover:text-emerald-700"
                      title="Parabenizar no WhatsApp"
                    >
                      <IconWhatsapp />
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
