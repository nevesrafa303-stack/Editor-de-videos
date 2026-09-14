/**
 * Teste de integracao contra o Postgres real.
 *
 * O isolamento entre clínicas e a única regra do sistema cujo erro não aparece
 * na tela de quem escreveu o código: aparece como prontuário de um cliente na
 * conta do outro. Por isso ele e testado com banco de verdade, não com mock.
 *
 * Requer DATABASE_URL apontando para um banco de desenvolvimento.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { scopedDb, TenantViolationError } from "../src/server/tenant-scope";

const connectionString = process.env.DATABASE_URL;
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: connectionString ?? "" }),
});

let clinicA = "";
let clinicB = "";
let patientA = "";
let patientB = "";

beforeAll(async () => {
  const suffix = `test-${Date.now()}`;

  const a = await prisma.clinic.create({
    data: { name: "Clínica A", slug: `a-${suffix}` },
  });
  const b = await prisma.clinic.create({
    data: { name: "Clínica B", slug: `b-${suffix}` },
  });

  clinicA = a.id;
  clinicB = b.id;

  patientA = (
    await prisma.patient.create({
      data: { clinicId: clinicA, name: "Paciente A", phone: "11900000001" },
    })
  ).id;

  patientB = (
    await prisma.patient.create({
      data: { clinicId: clinicB, name: "Paciente B", phone: "11900000002" },
    })
  ).id;
});

afterAll(async () => {
  await prisma.clinic.deleteMany({ where: { id: { in: [clinicA, clinicB] } } });
  await prisma.$disconnect();
});

describe("isolamento multi-tenant", () => {
  it("findMany so devolve registros da propria clínica", async () => {
    const db = scopedDb(clinicA);
    const patients = await db.patient.findMany();

    expect(patients.map((patient) => patient.id)).toContain(patientA);
    expect(patients.map((patient) => patient.id)).not.toContain(patientB);
  });

  it("findMany recusa where apontando para outra clínica", async () => {
    const db = scopedDb(clinicA);

    await expect(
      db.patient.findMany({ where: { clinicId: clinicB } }),
    ).rejects.toBeInstanceOf(TenantViolationError);
  });

  it("findUnique por id de outra clínica devolve null", async () => {
    const db = scopedDb(clinicA);

    expect(await db.patient.findUnique({ where: { id: patientB } })).toBeNull();
    expect(await db.patient.findUnique({ where: { id: patientA } })).not.toBeNull();
  });

  it("count e aggregate ficam restritos a clínica", async () => {
    const db = scopedDb(clinicA);

    expect(await db.patient.count()).toBe(1);
    expect(await db.patient.count({ where: { name: "Paciente B" } })).toBe(0);
  });

  it("create recusa gravar com clinicId de outra clínica", async () => {
    const db = scopedDb(clinicA);

    await expect(
      db.patient.create({
        data: { clinicId: clinicB, name: "Tentativa", phone: "11900000003" },
      }),
    ).rejects.toBeInstanceOf(TenantViolationError);

    expect(await prisma.patient.count({ where: { name: "Tentativa" } })).toBe(0);
  });

  it("create com a propria clínica grava normalmente", async () => {
    const db = scopedDb(clinicA);

    const created = await db.patient.create({
      data: { clinicId: clinicA, name: "Paciente novo", phone: "11900000004" },
    });

    expect(created.clinicId).toBe(clinicA);
  });

  it("createMany recusa o lote inteiro se uma linha apontar para outra clínica", async () => {
    const db = scopedDb(clinicA);

    await expect(
      db.procedure.createMany({
        data: [
          { clinicId: clinicA, name: "Proc 1", priceCents: 100 },
          { clinicId: clinicB, name: "Proc 2", priceCents: 200 },
        ],
      }),
    ).rejects.toBeInstanceOf(TenantViolationError);

    expect(
      await prisma.procedure.count({ where: { name: { in: ["Proc 1", "Proc 2"] } } }),
    ).toBe(0);
  });

  it("update em registro de outra clínica e bloqueado", async () => {
    const db = scopedDb(clinicA);

    await expect(
      db.patient.update({ where: { id: patientB }, data: { name: "Invadido" } }),
    ).rejects.toBeInstanceOf(TenantViolationError);

    const untouched = await prisma.patient.findUnique({ where: { id: patientB } });
    expect(untouched?.name).toBe("Paciente B");
  });

  it("delete em registro de outra clínica e bloqueado", async () => {
    const db = scopedDb(clinicA);

    await expect(db.patient.delete({ where: { id: patientB } })).rejects.toBeInstanceOf(
      TenantViolationError,
    );

    expect(await prisma.patient.findUnique({ where: { id: patientB } })).not.toBeNull();
  });

  it("updateMany e deleteMany não alcancam a outra clínica", async () => {
    const db = scopedDb(clinicA);

    const updated = await db.patient.updateMany({
      where: { id: patientB },
      data: { name: "Invadido" },
    });
    expect(updated.count).toBe(0);

    const deleted = await db.patient.deleteMany({ where: { id: patientB } });
    expect(deleted.count).toBe(0);

    const untouched = await prisma.patient.findUnique({ where: { id: patientB } });
    expect(untouched?.name).toBe("Paciente B");
  });

  it("relacoes aninhadas continuam dentro da clínica", async () => {
    const db = scopedDb(clinicA);

    await db.appointment.create({
      data: {
        clinicId: clinicA,
        patientId: patientA,
        professionalId: (
          await prisma.user.create({
            data: {
              clinicId: clinicA,
              name: "Dra. Teste",
              email: `teste-${Date.now()}@exemplo.com`,
              passwordHash: "x",
              isProfessional: true,
            },
          })
        ).id,
        startsAt: new Date(),
        endsAt: new Date(Date.now() + 3_600_000),
      },
    });

    const fromB = scopedDb(clinicB);
    expect(await fromB.appointment.count()).toBe(0);
    expect(await db.appointment.count()).toBe(1);
  });
});

describe("seletores unicos que não sao o id", () => {
  it("upsert por campo unico proprio cria e depois atualiza na clínica certa", async () => {
    const db = scopedDb(clinicA);

    await db.toothChart.upsert({
      where: { patientId: patientA },
      create: { clinicId: clinicA, patientId: patientA, data: { "16": { status: "CARIE" } } },
      update: { data: { "16": { status: "CARIE" } } },
    });

    await db.toothChart.upsert({
      where: { patientId: patientA },
      create: { clinicId: clinicA, patientId: patientA, data: {} },
      update: { data: { "16": { status: "RESTAURADO" } } },
    });

    const chart = await prisma.toothChart.findUnique({ where: { patientId: patientA } });
    expect(chart?.clinicId).toBe(clinicA);
    expect(chart?.data).toEqual({ "16": { status: "RESTAURADO" } });
  });

  it("upsert não alcanca registro de outra clínica", async () => {
    await prisma.toothChart.create({
      data: { clinicId: clinicB, patientId: patientB, data: { "11": { status: "CARIE" } } },
    });

    const db = scopedDb(clinicA);

    // Sem a checagem por registro alheio, o upsert cairia no ramo de update e
    // sobrescreveria o odontograma da clínica B.
    await expect(
      db.toothChart.upsert({
        where: { patientId: patientB },
        create: { clinicId: clinicA, patientId: patientB, data: {} },
        update: { data: { "11": { status: "AUSENTE" } } },
      }),
    ).rejects.toBeInstanceOf(TenantViolationError);

    const chart = await prisma.toothChart.findUnique({ where: { patientId: patientB } });
    expect(chart?.clinicId).toBe(clinicB);
    expect(chart?.data).toEqual({ "11": { status: "CARIE" } });
  });

  it("update por seletor unico composto respeita a clínica", async () => {
    await prisma.procedure.create({
      data: { clinicId: clinicB, name: "Exclusivo da B", priceCents: 1000 },
    });

    const db = scopedDb(clinicA);

    await expect(
      db.procedure.update({
        where: { clinicId_name: { clinicId: clinicB, name: "Exclusivo da B" } },
        data: { priceCents: 1 },
      }),
    ).rejects.toBeInstanceOf(TenantViolationError);

    const untouched = await prisma.procedure.findFirst({
      where: { clinicId: clinicB, name: "Exclusivo da B" },
    });
    expect(untouched?.priceCents).toBe(1000);
  });
});
