/**
 * Testes de integracao da agenda.
 *
 * A agenda e o modulo em que as regras moram no banco e nao no codigo: janela
 * de horario e exclusion constraint, mudanca de status e trigger. Estes testes
 * existem para provar que a camada de acesso REPASSA essas recusas em vez de
 * inventar as proprias.
 */
process.env.DB_POOL_MAX = "1";

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { closeDb } from "@/server/db";
import { withTenant, type TenantSession } from "@/server/context";
import { getDayAgenda, changeAppointmentStatus, createAppointment } from "@/modules/scheduling";
import { Forbidden } from "@/shared/errors";
import { adminDb, entrar, SEED, USUARIOS } from "./helpers";

let dona: TenantSession;
let recepcao: TenantSession;
let financeiro: TenantSession;
let outraRede: TenantSession;
const admin = adminDb();

/** O dia da clinica: o seed ancora tudo no fuso da unidade. */
const HOJE = new Date().toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" });

beforeAll(async () => {
  dona = (await entrar(USUARIOS.dona)).session;
  recepcao = (await entrar(USUARIOS.recepcao)).session;
  financeiro = (await entrar(USUARIOS.financeiro)).session;
  outraRede = (await entrar(USUARIOS.outraRede)).session;
});

afterAll(async () => {
  await admin.destroy();
  await closeDb();
});

describe("grade do dia", () => {
  it("monta a grade da unidade com expediente e bloqueio", async () => {
    const agenda = await withTenant(dona, (ctx) => getDayAgenda(ctx, { date: HOJE }));

    expect(agenda.unit.id).toBe(SEED.unidadeCentro);
    expect(agenda.providers.map((p) => p.name)).toEqual(["Ana Souza", "Bruno Lima"]);
    expect(agenda.blocks.map((b) => b.reason)).toContain("lunch");
    expect(agenda.appointments.length).toBeGreaterThanOrEqual(9);
  });

  it("recorta o dia no fuso da unidade, nao no do servidor", async () => {
    const agenda = await withTenant(dona, (ctx) => getDayAgenda(ctx, { date: HOJE }));

    const naData = agenda.appointments.every(
      (a) => a.startsAt.toLocaleDateString("sv-SE", { timeZone: agenda.unit.timezone }) === HOJE,
    );

    expect(naData).toBe(true);
    // 08:00 local = minuto 480, independente do fuso do processo.
    expect(agenda.appointments[0]?.startMinute).toBe(480);
  });

  it("ocupacao ignora falta e cancelamento — a cadeira voltou a ser vendavel", async () => {
    const agenda = await withTenant(dona, (ctx) => getDayAgenda(ctx, { date: HOJE }));

    const somaBruta = agenda.appointments.reduce(
      (soma, a) => soma + (a.endMinute - a.startMinute),
      0,
    );

    expect(agenda.totals.faltas + agenda.totals.cancelados).toBeGreaterThan(0);
    expect(agenda.totals.minutosOcupados).toBeLessThan(somaBruta);
  });

  it("outra rede nao ve o dia desta", async () => {
    const agenda = await withTenant(outraRede, (ctx) => getDayAgenda(ctx, { date: HOJE }));

    expect(agenda.unit.id).not.toBe(SEED.unidadeCentro);
    expect(agenda.appointments).toHaveLength(0);
  });

  it("filtra por profissional quando pedido", async () => {
    const agenda = await withTenant(dona, (ctx) =>
      getDayAgenda(ctx, { date: HOJE, providerId: SEED.drAna }),
    );

    expect(agenda.providers).toHaveLength(1);
    expect(agenda.appointments.every((a) => a.providerId === SEED.drAna)).toBe(true);
  });
});

describe("mudanca de status", () => {
  it("segue a maquina de estados do banco", async () => {
    const id = await umAgendamento("scheduled");

    const confirmado = await withTenant(recepcao, (ctx) =>
      changeAppointmentStatus(ctx, { appointmentId: id, to: "confirmed" }),
    );
    expect(confirmado.status).toBe("confirmed");

    const chegou = await withTenant(recepcao, (ctx) =>
      changeAppointmentStatus(ctx, { appointmentId: id, to: "arrived" }),
    );
    expect(chegou.status).toBe("arrived");
  });

  it("transicao invalida e recusada pelo banco, em portugues", async () => {
    const id = await umAgendamento("confirmed");

    // confirmed -> completed nao existe em state_transition: passa-se por
    // arrived e in_progress. Quem recusa e o trigger, nao este arquivo.
    await expect(
      withTenant(recepcao, (ctx) =>
        changeAppointmentStatus(ctx, { appointmentId: id, to: "completed" }),
      ),
    ).rejects.toThrow(/mudanca de status nao e permitida|não é permitida/i);
  });

  it("cancelar sem motivo nao passa", async () => {
    const id = await umAgendamento("scheduled");

    await expect(
      withTenant(recepcao, (ctx) =>
        changeAppointmentStatus(ctx, { appointmentId: id, to: "canceled" }),
      ),
    ).rejects.toThrow(/motivo/i);
  });

  it("papel sem permissao de cancelar nao cancela", async () => {
    const id = await umAgendamento("scheduled");

    await expect(
      withTenant(financeiro, (ctx) =>
        changeAppointmentStatus(ctx, {
          appointmentId: id,
          to: "canceled",
          reason: "Teste de permissao.",
        }),
      ),
    ).rejects.toThrow(Forbidden);
  });

  it("a mudanca deixa historico", async () => {
    const id = await umAgendamento("scheduled");

    await withTenant(recepcao, (ctx) =>
      changeAppointmentStatus(ctx, { appointmentId: id, to: "confirmed" }),
    );

    const historico = await admin
      .selectFrom("appointment_status_history")
      .select(["from_status", "to_status"])
      .where("appointment_id", "=", id)
      .orderBy("changed_at", "asc")
      .execute();

    expect(historico.at(-1)).toMatchObject({ from_status: "scheduled", to_status: "confirmed" });
  });
});

describe("encaixe", () => {
  it("conflito com atendimento existente e recusado", async () => {
    const existente = await admin
      .selectFrom("appointment")
      .select(["starts_at", "provider_id"])
      .where("unit_id", "=", SEED.unidadeCentro)
      .where("status", "=", "confirmed")
      .orderBy("starts_at", "asc")
      .executeTakeFirstOrThrow();

    const hora = existente.starts_at.toLocaleTimeString("pt-BR", {
      timeZone: "America/Sao_Paulo",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    await expect(
      withTenant(recepcao, (ctx) =>
        createAppointment(ctx, {
          patientId: SEED.pacienteMariana,
          providerId: existente.provider_id,
          date: HOJE,
          time: hora,
          durationMinutes: 30,
        }),
      ),
    ).rejects.toThrow(/ja tem atendimento marcado/i);
  });

  it("horario livre entra e aparece na grade do dia", async () => {
    const criado = await withTenant(recepcao, (ctx) =>
      createAppointment(ctx, {
        patientId: SEED.pacienteMariana,
        providerId: SEED.drAna,
        date: HOJE,
        time: "17:15",
        durationMinutes: 30,
        notes: "Encaixe de teste.",
      }),
    );

    const agenda = await withTenant(dona, (ctx) => getDayAgenda(ctx, { date: HOJE }));
    const linha = agenda.appointments.find((a) => a.id === criado.id);

    expect(linha).toBeDefined();
    expect(linha?.startMinute).toBe(17 * 60 + 15);
    expect(linha?.status).toBe("scheduled");
  });
});

/** Um agendamento do dia no status pedido, para nao amarrar teste com teste. */
async function umAgendamento(status: "scheduled" | "confirmed"): Promise<string> {
  const row = await admin
    .selectFrom("appointment")
    .select("id")
    .where("unit_id", "=", SEED.unidadeCentro)
    .where("status", "=", status)
    .orderBy("starts_at", "desc")
    .executeTakeFirst();

  if (row) return row.id;

  // Nenhum sobrou: cria um no fim do dia, longe dos horarios do seed.
  const criado = await withTenant(recepcao, (ctx) =>
    createAppointment(ctx, {
      patientId: SEED.pacienteMariana,
      providerId: SEED.drAna,
      date: HOJE,
      time: horarioLivreDoDia(),
      durationMinutes: 15,
    }),
  );

  if (status === "confirmed") {
    await withTenant(recepcao, (ctx) =>
      changeAppointmentStatus(ctx, { appointmentId: criado.id, to: "confirmed" }),
    );
  }

  return criado.id;
}

/** Janela unica por chamada: a exclusion constraint e de verdade. */
let proximo = 0;
function horarioLivreDoDia(): string {
  const minuto = 19 * 60 + proximo * 15;
  proximo += 1;
  return `${String(Math.floor(minuto / 60)).padStart(2, "0")}:${String(minuto % 60).padStart(2, "0")}`;
}
