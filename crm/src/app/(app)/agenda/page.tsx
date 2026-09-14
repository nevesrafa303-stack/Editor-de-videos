import type { Metadata } from "next";
import Link from "next/link";
import { requirePermission } from "@/server/tenant";
import { can } from "@/server/permissions";
import {
  DEFAULT_WORKING_HOURS,
  addDays,
  daySlots,
  endOfDay,
  startOfDay,
  startOfWeek,
} from "@/domain/scheduling";
import { formatDate, formatTime, formatWeekday, parseISODate, toISODate, toISODateTime } from "@/lib/date";
import { Badge, Card, EmptyState, LinkButton, PageHeader, Select } from "@/components/ui";
import { IconChevronLeft, IconChevronRight } from "@/components/icons";
import { AppointmentForm } from "@/components/appointment-form";
import { StatusActions } from "./status-actions";
import type { AppointmentStatus } from "@/generated/prisma/enums";

export const metadata: Metadata = { title: "Agenda" };

const STATUS_TONE: Record<AppointmentStatus, "neutral" | "info" | "success" | "warning" | "danger"> = {
  AGENDADO: "neutral",
  CONFIRMADO: "info",
  ATENDIDO: "success",
  FALTOU: "warning",
  CANCELADO: "danger",
};

const STATUS_LABEL: Record<AppointmentStatus, string> = {
  AGENDADO: "Agendado",
  CONFIRMADO: "Confirmado",
  ATENDIDO: "Atendido",
  FALTOU: "Faltou",
  CANCELADO: "Cancelado",
};

const SLOT_HEIGHT_PX = 46;

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ data?: string; visao?: string; profissional?: string }>;
}) {
  const { db, session } = await requirePermission("agenda:read");
  const params = await searchParams;

  const day = params.data ? parseISODate(params.data) : startOfDay(new Date());
  const view = params.visao === "semana" ? "semana" : "dia";
  const professionalFilter = params.profissional ?? "";

  const rangeStart = view === "semana" ? startOfWeek(day) : startOfDay(day);
  const rangeEnd = view === "semana" ? endOfDay(addDays(rangeStart, 6)) : endOfDay(day);

  const [professionals, rooms, procedures, appointments] = await Promise.all([
    db.user.findMany({
      where: { isProfessional: true, active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, color: true },
    }),
    db.room.findMany({ where: { active: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    db.procedure.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, durationMin: true },
    }),
    db.appointment.findMany({
      where: {
        startsAt: { gte: rangeStart, lte: rangeEnd },
        ...(professionalFilter ? { professionalId: professionalFilter } : {}),
      },
      orderBy: { startsAt: "asc" },
      include: {
        patient: { select: { id: true, name: true, phone: true } },
        professional: { select: { id: true, name: true, color: true } },
        room: { select: { name: true } },
        procedure: { select: { name: true } },
      },
    }),
  ]);

  const columns = professionalFilter
    ? professionals.filter((professional) => professional.id === professionalFilter)
    : professionals;

  const writable = can(session.role, "agenda:write");
  const slots = daySlots(day);
  const dayStart = slots[0] ?? startOfDay(day);

  const linkFor = (date: Date, nextView = view) =>
    `/agenda?data=${toISODate(date)}&visao=${nextView}${professionalFilter ? `&profissional=${professionalFilter}` : ""}`;

  return (
    <>
      <PageHeader
        title="Agenda"
        description={
          view === "dia"
            ? `${formatWeekday(day)}, ${formatDate(day)}`
            : `Semana de ${formatDate(rangeStart)} a ${formatDate(addDays(rangeStart, 6))}`
        }
        action={
          <>
            <LinkButton
              variant="secondary"
              href={linkFor(addDays(day, view === "semana" ? -7 : -1))}
              aria-label="Período anterior"
            >
              <IconChevronLeft />
            </LinkButton>
            <LinkButton variant="secondary" href={linkFor(new Date())}>
              Hoje
            </LinkButton>
            <LinkButton
              variant="secondary"
              href={linkFor(addDays(day, view === "semana" ? 7 : 1))}
              aria-label="Próximo período"
            >
              <IconChevronRight />
            </LinkButton>
          </>
        }
      />

      <Card className="mb-4 p-4">
        <form className="flex flex-wrap items-end gap-3">
          <label>
            <span className="field-label">Data</span>
            <input className="field-input" type="date" name="data" defaultValue={toISODate(day)} />
          </label>

          <label>
            <span className="field-label">Visao</span>
            <Select name="visao" defaultValue={view}>
              <option value="dia">Dia</option>
              <option value="semana">Semana</option>
            </Select>
          </label>

          <label className="min-w-52">
            <span className="field-label">Profissional</span>
            <Select name="profissional" defaultValue={professionalFilter}>
              <option value="">Todos</option>
              {professionals.map((professional) => (
                <option key={professional.id} value={professional.id}>
                  {professional.name}
                </option>
              ))}
            </Select>
          </label>

          <button
            type="submit"
            className="mb-0.5 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Aplicar
          </button>
        </form>
      </Card>

      {writable ? (
        <Card className="mb-4">
          <details>
            <summary className="cursor-pointer list-none px-5 py-4 text-sm font-semibold text-brand-700 select-none hover:text-brand-800">
              + Novo agendamento
            </summary>
            <div className="border-t border-slate-100 p-5">
              <AppointmentForm
                professionals={professionals}
                rooms={rooms}
                procedures={procedures}
                defaultStartsAt={toISODateTime(
                  new Date(day.getFullYear(), day.getMonth(), day.getDate(), 9, 0),
                )}
                defaultProfessionalId={professionalFilter || undefined}
              />
            </div>
          </details>
        </Card>
      ) : null}

      {view === "dia" ? (
        columns.length === 0 ? (
          <Card>
            <EmptyState
              title="Nenhum profissional cadastrado"
              description="Cadastre ao menos um profissional para montar a agenda."
              action={
                <LinkButton href="/configuracoes" variant="subtle">
                  Ir para configurações
                </LinkButton>
              }
            />
          </Card>
        ) : (
          <Card className="overflow-x-auto p-4">
            <div
              className="grid min-w-[640px] gap-x-2"
              style={{ gridTemplateColumns: `64px repeat(${columns.length}, minmax(160px, 1fr))` }}
            >
              <div />
              {columns.map((professional) => (
                <div key={professional.id} className="pb-2 text-center">
                  <span
                    className="inline-flex items-center gap-2 text-sm font-semibold text-slate-800"
                    style={{ color: professional.color }}
                  >
                    <span
                      className="size-2.5 rounded-full"
                      style={{ backgroundColor: professional.color }}
                    />
                    {professional.name}
                  </span>
                </div>
              ))}

              <div
                className="grid"
                style={{ gridTemplateRows: `repeat(${slots.length}, ${SLOT_HEIGHT_PX}px)` }}
              >
                {slots.map((slot) => (
                  <div key={slot.toISOString()} className="pr-2 text-right text-xs text-slate-400">
                    {formatTime(slot)}
                  </div>
                ))}
              </div>

              {columns.map((professional) => (
                <div
                  key={professional.id}
                  className="relative grid rounded-lg bg-slate-50/60"
                  style={{ gridTemplateRows: `repeat(${slots.length}, ${SLOT_HEIGHT_PX}px)` }}
                >
                  {slots.map((slot) => (
                    <div key={slot.toISOString()} className="border-t border-slate-100" />
                  ))}

                  {appointments
                    .filter((appointment) => appointment.professionalId === professional.id)
                    .map((appointment) => {
                      const offsetMin =
                        (appointment.startsAt.getTime() - dayStart.getTime()) / 60_000;
                      const durationMin =
                        (appointment.endsAt.getTime() - appointment.startsAt.getTime()) / 60_000;
                      const top = (offsetMin / DEFAULT_WORKING_HOURS.slotMinutes) * SLOT_HEIGHT_PX;
                      const height = Math.max(
                        (durationMin / DEFAULT_WORKING_HOURS.slotMinutes) * SLOT_HEIGHT_PX - 4,
                        26,
                      );
                      const cancelled =
                        appointment.status === "CANCELADO" || appointment.status === "FALTOU";

                      return (
                        <div
                          key={appointment.id}
                          className="absolute right-1 left-1 overflow-hidden rounded-md border-l-4 bg-white px-2 py-1 text-xs shadow-xs"
                          style={{
                            top: `${Math.max(top, 0)}px`,
                            height: `${height}px`,
                            borderLeftColor: professional.color,
                            opacity: cancelled ? 0.55 : 1,
                          }}
                        >
                          <Link
                            href={`/pacientes/${appointment.patient.id}`}
                            className={`block truncate font-semibold text-slate-800 hover:text-brand-700 ${cancelled ? "line-through" : ""}`}
                          >
                            {appointment.patient.name}
                          </Link>
                          <span className="block truncate text-slate-500">
                            {formatTime(appointment.startsAt)} · {appointment.procedure?.name ?? "Atendimento"}
                          </span>
                          {height > 60 ? (
                            <span className="mt-1 block">
                              <Badge tone={STATUS_TONE[appointment.status]}>
                                {STATUS_LABEL[appointment.status]}
                              </Badge>
                            </span>
                          ) : null}
                        </div>
                      );
                    })}
                </div>
              ))}
            </div>
          </Card>
        )
      ) : (
        <div className="grid gap-3 lg:grid-cols-7">
          {Array.from({ length: 7 }, (_, index) => addDays(rangeStart, index)).map((date) => {
            const dayAppointments = appointments.filter(
              (appointment) => toISODate(appointment.startsAt) === toISODate(date),
            );
            const isToday = toISODate(date) === toISODate(new Date());

            return (
              <Card key={date.toISOString()} className={isToday ? "border-brand-300" : undefined}>
                <div className="border-b border-slate-100 px-3 py-2">
                  <Link href={linkFor(date, "dia")} className="block hover:text-brand-700">
                    <span className="text-xs text-slate-500 capitalize">{formatWeekday(date)}</span>
                    <span className="block text-sm font-semibold text-slate-800">
                      {date.getDate()}
                    </span>
                  </Link>
                </div>

                <ul className="space-y-1 p-2">
                  {dayAppointments.length === 0 ? (
                    <li className="px-1 py-2 text-xs text-slate-400">Sem atendimentos</li>
                  ) : null}

                  {dayAppointments.map((appointment) => (
                    <li
                      key={appointment.id}
                      className="rounded-md border-l-4 bg-slate-50 px-2 py-1.5 text-xs"
                      style={{ borderLeftColor: appointment.professional.color }}
                    >
                      <span className="block font-medium text-slate-700">
                        {formatTime(appointment.startsAt)}
                      </span>
                      <Link
                        href={`/pacientes/${appointment.patient.id}`}
                        className="block truncate text-slate-600 hover:text-brand-700"
                      >
                        {appointment.patient.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </Card>
            );
          })}
        </div>
      )}

      <Card className="mt-6">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="text-sm font-semibold text-slate-900">
            Lista do periodo ({appointments.length})
          </h2>
        </div>

        {appointments.length === 0 ? (
          <EmptyState title="Nenhum atendimento no período" />
        ) : (
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Horario</th>
                  <th>Paciente</th>
                  <th>Profissional</th>
                  <th>Procedimento</th>
                  <th>Sala</th>
                  <th>Status</th>
                  {writable ? <th className="no-print">Ações</th> : null}
                </tr>
              </thead>
              <tbody>
                {appointments.map((appointment) => (
                  <tr key={appointment.id}>
                    <td className="whitespace-nowrap tabular-nums">
                      {formatDate(appointment.startsAt)} {formatTime(appointment.startsAt)}
                    </td>
                    <td>
                      <Link
                        href={`/pacientes/${appointment.patient.id}`}
                        className="font-medium text-slate-800 hover:text-brand-700"
                      >
                        {appointment.patient.name}
                      </Link>
                    </td>
                    <td>{appointment.professional.name}</td>
                    <td>{appointment.procedure?.name ?? "—"}</td>
                    <td>{appointment.room?.name ?? "—"}</td>
                    <td>
                      <Badge tone={STATUS_TONE[appointment.status]}>
                        {STATUS_LABEL[appointment.status]}
                      </Badge>
                    </td>
                    {writable ? (
                      <td className="no-print">
                        <StatusActions id={appointment.id} status={appointment.status} />
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
