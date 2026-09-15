/**
 * Consultas da agenda.
 *
 * O dia e recortado no fuso da UNIDADE, nao no do servidor nem no do navegador.
 * Uma rede com unidade em Manaus e outra em Sao Paulo tem dois "hoje"
 * diferentes, e a agenda que abre errado por uma hora nao e usavel.
 */
import { sql } from "kysely";
import type { TenantContext } from "@/server/context";
import { NotFound } from "@/shared/errors";
import { agendaFilterSchema, type AgendaFilter } from "@/modules/scheduling/schema";

export type AgendaProvider = {
  membershipId: string;
  name: string;
  color: string;
  specialty: string | null;
  /** Minutos desde a meia-noite local. Ausente = sem expediente no dia. */
  startMinute: number | null;
  endMinute: number | null;
  slotMinutes: number;
};

export type AgendaAppointment = {
  id: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  providerId: string;
  procedure: string | null;
  status: string;
  startsAt: Date;
  endsAt: Date;
  startMinute: number;
  endMinute: number;
  notes: string | null;
  priceCents: number | null;
};

export type AgendaBlock = {
  id: string;
  providerId: string | null;
  reason: string;
  notes: string | null;
  startMinute: number;
  endMinute: number;
};

export type DayAgenda = {
  date: string;
  unit: { id: string; name: string; timezone: string };
  /** Janela desenhada na grade, em minutos desde a meia-noite local. */
  window: { startMinute: number; endMinute: number };
  providers: AgendaProvider[];
  appointments: AgendaAppointment[];
  blocks: AgendaBlock[];
  waitlist: number;
  totals: {
    total: number;
    confirmados: number;
    aConfirmar: number;
    emAtendimento: number;
    atendidos: number;
    faltas: number;
    cancelados: number;
    minutosOcupados: number;
    /** Expediente cadastrado, sem descontar nada. */
    minutosDisponiveis: number;
    /** Expediente menos almoço, férias e bloqueios: o tempo que dá para vender. */
    minutosVendaveis: number;
    receitaPrevistaCents: number;
  };
};

/** Fallback quando ninguem tem disponibilidade cadastrada no dia. */
const JANELA_PADRAO = { startMinute: 7 * 60, endMinute: 20 * 60 };

export async function getDayAgenda(ctx: TenantContext, input: AgendaFilter): Promise<DayAgenda> {
  ctx.assert("appointment.read");
  const filter = agendaFilterSchema.parse(input);

  const unitId = filter.unitId ?? ctx.session.activeUnitId;

  const unit = await ctx.db
    .selectFrom("unit")
    .select(["id", "name", "timezone"])
    .$if(!!unitId, (q) => q.where("id", "=", unitId as string))
    .where("is_active", "=", true)
    .where("deleted_at", "is", null)
    .orderBy("name", "asc")
    .executeTakeFirst();

  if (!unit) throw new NotFound("Unidade");

  const tz = unit.timezone;

  // Limites do dia e dia da semana, resolvidos pelo banco: e ele que tem a
  // tabela de fuso horario, inclusive o historico de horario de verao.
  const janela = await sql<{ inicio: Date; fim: Date; weekday: number }>`
    select
      (${filter.date}::date)::timestamp at time zone ${tz}              as inicio,
      (${filter.date}::date + 1)::timestamp at time zone ${tz}          as fim,
      extract(dow from ${filter.date}::date)::int                       as weekday
  `.execute(ctx.db);

  const { inicio, fim, weekday } = janela.rows[0] as { inicio: Date; fim: Date; weekday: number };

  /** Minuto local do dia, a partir de um timestamptz. */
  const minuto = (coluna: string) =>
    sql<number>`(extract(epoch from (${sql.ref(coluna)} at time zone ${tz})::time) / 60)::int`;

  const [profissionais, consultas, bloqueios, espera] = await Promise.all([
    ctx.db
      .selectFrom("membership as m")
      .innerJoin("app_user as u", "u.id", "m.user_id")
      .innerJoin("membership_unit as mu", "mu.membership_id", "m.id")
      .leftJoin("provider_availability as pa", (join) =>
        join
          .onRef("pa.membership_id", "=", "m.id")
          .onRef("pa.unit_id", "=", "mu.unit_id")
          .on("pa.weekday", "=", weekday)
          .on("pa.valid_from", "<=", filter.date)
          .on((eb) => eb.or([eb("pa.valid_to", "is", null), eb("pa.valid_to", ">=", filter.date)])),
      )
      .select([
        "m.id as membership_id",
        "u.full_name as name",
        "m.agenda_color as color",
        "m.specialty",
        sql<number | null>`(extract(epoch from min(pa.starts_at)) / 60)::int`.as("start_minute"),
        sql<number | null>`(extract(epoch from max(pa.ends_at)) / 60)::int`.as("end_minute"),
        sql<number>`coalesce(min(pa.slot_minutes), 30)`.as("slot_minutes"),
      ])
      .where("m.is_provider", "=", true)
      .where("m.status", "=", "active")
      .where("mu.unit_id", "=", unit.id)
      .$if(!!filter.providerId, (q) => q.where("m.id", "=", filter.providerId as string))
      .groupBy(["m.id", "u.full_name", "m.agenda_color", "m.specialty"])
      .orderBy("u.full_name", "asc")
      .execute(),

    ctx.db
      .selectFrom("appointment as a")
      .innerJoin("patient as p", "p.id", "a.patient_id")
      .leftJoin("procedure as proc", "proc.id", "a.procedure_id")
      .select([
        "a.id",
        "a.patient_id",
        "p.full_name as patient_name",
        "p.phone as patient_phone",
        "a.provider_id",
        "proc.name as procedure_name",
        "a.status",
        "a.starts_at",
        "a.ends_at",
        "a.notes",
        minuto("a.starts_at").as("start_minute"),
        minuto("a.ends_at").as("end_minute"),
        // Preco do dia, resolvido pela tabela vigente. Nao e cobranca: e a
        // previsao que a recepcao usa para saber quanto vale a cadeira vazia.
        sql<number | null>`(
          select rp.price_cents
          from resolve_price(${ctx.session.tenantId}::uuid, a.procedure_id, a.unit_id, null, ${filter.date}::date) as rp
          limit 1
        )`.as("price_cents"),
      ])
      .where("a.unit_id", "=", unit.id)
      .where("a.deleted_at", "is", null)
      .where("a.starts_at", ">=", inicio)
      .where("a.starts_at", "<", fim)
      .$if(!!filter.providerId, (q) => q.where("a.provider_id", "=", filter.providerId as string))
      .orderBy("a.starts_at", "asc")
      .execute(),

    ctx.db
      .selectFrom("schedule_block")
      .select([
        "id",
        "membership_id",
        "reason",
        "notes",
        minuto("starts_at").as("start_minute"),
        minuto("ends_at").as("end_minute"),
      ])
      .where("unit_id", "=", unit.id)
      .where("starts_at", "<", fim)
      .where("ends_at", ">", inicio)
      .execute(),

    ctx.db
      .selectFrom("waitlist_entry")
      .select((eb) => eb.fn.countAll<number>().as("total"))
      .where("status", "=", "waiting")
      .executeTakeFirst(),
  ]);

  const providers: AgendaProvider[] = profissionais.map((p) => ({
    membershipId: p.membership_id,
    name: p.name,
    color: p.color,
    specialty: p.specialty,
    startMinute: p.start_minute,
    endMinute: p.end_minute,
    slotMinutes: Number(p.slot_minutes),
  }));

  const appointments: AgendaAppointment[] = consultas.map((c) => ({
    id: c.id as string,
    patientId: c.patient_id,
    patientName: c.patient_name,
    patientPhone: c.patient_phone,
    providerId: c.provider_id,
    procedure: c.procedure_name,
    status: c.status,
    startsAt: c.starts_at,
    endsAt: c.ends_at,
    startMinute: c.start_minute,
    endMinute: c.end_minute,
    notes: c.notes,
    priceCents: c.price_cents,
  }));

  const blocks: AgendaBlock[] = bloqueios.map((b) => ({
    id: b.id,
    providerId: b.membership_id,
    reason: b.reason,
    notes: b.notes,
    startMinute: b.start_minute,
    endMinute: b.end_minute,
  }));

  return {
    date: filter.date,
    unit: { id: unit.id, name: unit.name, timezone: tz },
    window: calcularJanela(providers, appointments, blocks),
    providers,
    appointments,
    blocks,
    waitlist: Number(espera?.total ?? 0),
    totals: totalizar(providers, appointments, blocks),
  };
}

/**
 * A grade cobre o expediente, mas nunca esconde um atendimento.
 *
 * Consulta encaixada fora do horario (acontece) tem que aparecer; se a janela
 * viesse so da disponibilidade, ela sumiria da tela e ninguem saberia.
 */
function calcularJanela(
  providers: AgendaProvider[],
  appointments: AgendaAppointment[],
  blocks: AgendaBlock[],
): { startMinute: number; endMinute: number } {
  const inicios = [
    ...providers.map((p) => p.startMinute),
    ...appointments.map((a) => a.startMinute),
    ...blocks.map((b) => b.startMinute),
  ].filter((v): v is number => v !== null);

  const fins = [
    ...providers.map((p) => p.endMinute),
    ...appointments.map((a) => a.endMinute),
    ...blocks.map((b) => b.endMinute),
  ].filter((v): v is number => v !== null);

  if (inicios.length === 0 || fins.length === 0) return JANELA_PADRAO;

  // Arredonda para a hora cheia para a regua nao comecar em 08:17.
  const inicio = Math.floor(Math.min(...inicios) / 60) * 60;
  const fim = Math.ceil(Math.max(...fins) / 60) * 60;

  return { startMinute: Math.max(0, inicio), endMinute: Math.min(24 * 60, Math.max(fim, inicio + 60)) };
}

function totalizar(
  providers: AgendaProvider[],
  appointments: AgendaAppointment[],
  blocks: AgendaBlock[],
) {
  const conta = (status: string) => appointments.filter((a) => a.status === status).length;

  // Cancelado e falta nao ocupam cadeira: a janela volta a ser vendavel.
  const ocupando = appointments.filter((a) => a.status !== "canceled" && a.status !== "no_show");

  const minutosDisponiveis = providers.reduce(
    (soma, p) =>
      soma + (p.startMinute !== null && p.endMinute !== null ? p.endMinute - p.startMinute : 0),
    0,
  );

  // Bloqueio dentro do expediente nao e horario vago: e horario que nao
  // existe. Contar almoco como capacidade ociosa pune o profissional pelo
  // proprio almoco e faz a ocupacao parecer pior do que e.
  const minutosBloqueados = providers.reduce((soma, p) => {
    if (p.startMinute === null || p.endMinute === null) return soma;

    const doProfissional = blocks.filter((b) => b.providerId === p.membershipId);

    return (
      soma +
      doProfissional.reduce((parcial, b) => {
        const inicio = Math.max(b.startMinute, p.startMinute as number);
        const fim = Math.min(b.endMinute, p.endMinute as number);
        return parcial + Math.max(fim - inicio, 0);
      }, 0)
    );
  }, 0);

  return {
    total: appointments.length,
    confirmados: conta("confirmed"),
    aConfirmar: conta("scheduled"),
    emAtendimento: conta("arrived") + conta("in_progress"),
    atendidos: conta("completed"),
    faltas: conta("no_show"),
    cancelados: conta("canceled"),
    minutosOcupados: ocupando.reduce((soma, a) => soma + (a.endMinute - a.startMinute), 0),
    minutosDisponiveis,
    minutosVendaveis: Math.max(minutosDisponiveis - minutosBloqueados, 0),
    receitaPrevistaCents: ocupando.reduce((soma, a) => soma + (a.priceCents ?? 0), 0),
  };
}
