/**
 * Testes de integracao da camada de acesso, contra o PostgreSQL de verdade.
 *
 * O que estes testes existem para provar: o isolamento continua valendo depois
 * de passar pelo TypeScript. Um teste com banco falso provaria apenas que o
 * mock foi escrito de acordo com a expectativa.
 */

// Pool de uma conexao so: e a unica forma de provar que o contexto de um
// request nao volta grudado na conexao para o proximo.
process.env.DB_POOL_MAX = "1";

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { sql } from "kysely";
import { assertNotBypassingRls, closeDb, getDb } from "@/server/db";
import { withTenant, withoutContext, type TenantSession } from "@/server/context";
import { login } from "@/server/auth";
import { resolveSession, revokeSession } from "@/server/session";
import { createPatient, getPatientChart, listPatients } from "@/modules/patient";
import { Forbidden, NotAuthenticated, TenantViolation } from "@/shared/errors";
import { adminDb, entrar, horarioLivre, SEED, SENHA, USUARIOS } from "./helpers";

let dona: TenantSession;
let recepcao: TenantSession;
let outraRede: TenantSession;
const admin = adminDb();

beforeAll(async () => {
  dona = (await entrar(USUARIOS.dona)).session;
  recepcao = (await entrar(USUARIOS.recepcao)).session;
  outraRede = (await entrar(USUARIOS.outraRede)).session;
});

afterAll(async () => {
  await admin.destroy();
  await closeDb();
});

describe("conexao", () => {
  it("recusa papel de banco que ignora RLS", async () => {
    // O papel da aplicacao passa.
    await expect(assertNotBypassingRls()).resolves.toBeUndefined();

    // O dono das tabelas (superusuario) e barrado: se a string de conexao
    // apontar para ele em producao, o isolamento inteiro vira enfeite.
    await expect(assertNotBypassingRls(admin)).rejects.toThrow(/ignora RLS/);
  });
});

describe("login", () => {
  it("recusa senha errada sem revelar se o e-mail existe", async () => {
    const comEmailReal = login({ email: USUARIOS.dona, password: "errada" });
    const comEmailFalso = login({ email: "ninguem@exemplo.com", password: "errada" });

    await expect(comEmailReal).rejects.toThrow(NotAuthenticated);
    await expect(comEmailFalso).rejects.toThrow(NotAuthenticated);

    const [a, b] = await Promise.all([
      comEmailReal.catch((e) => (e as Error).message),
      comEmailFalso.catch((e) => (e as Error).message),
    ]);
    expect(a).toBe(b);
  });

  it("entrega sessao com papel, unidades e permissoes", async () => {
    const { session } = await entrar(USUARIOS.dona);

    expect(session.tenantId).toBe(SEED.redeSorriso);
    expect(session.roleCode).toBe("owner");
    expect(session.unitIds).toHaveLength(2);
    expect(session.permissions.has("chart.read_all")).toBe(true);
    expect(session.expiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  it("recepcao recebe um recorte menor de permissoes", async () => {
    expect(recepcao.permissions.has("appointment.write")).toBe(true);
    expect(recepcao.permissions.has("chart.read")).toBe(false);
    expect(recepcao.permissions.has("payment.reverse")).toBe(false);
    expect(recepcao.permissions.size).toBeLessThan(dona.permissions.size);
  });

  it("sessao revogada para de resolver imediatamente", async () => {
    const { token } = await entrar(USUARIOS.financeiro);
    expect(await resolveSession(token)).not.toBeNull();

    await expect(revokeSession(token)).resolves.toBe(true);
    expect(await resolveSession(token)).toBeNull();

    // Revogar de novo nao quebra, e informa que nao havia o que revogar.
    await expect(revokeSession(token)).resolves.toBe(false);
  });

  it("token inventado nao resolve", async () => {
    expect(await resolveSession("token-que-eu-inventei")).toBeNull();
  });

  it("nao entra em rede a que o usuario nao pertence", async () => {
    await expect(
      login({ email: USUARIOS.dona, password: SENHA, tenantId: SEED.bellaVita }),
    ).rejects.toThrow(NotAuthenticated);
  });
});

describe("isolamento atraves da camada", () => {
  it("cada rede enxerga apenas os proprios pacientes", async () => {
    const daRede = await withTenant(dona, (ctx) => listPatients(ctx));
    const daOutra = await withTenant(outraRede, (ctx) => listPatients(ctx));

    expect(daRede.total).toBe(2);
    expect(daOutra.total).toBe(1);
    expect(daRede.items.map((p) => p.id)).not.toContain(SEED.pacienteBella);
  });

  it("consulta crua sem filtro de tenant ainda volta escopada", async () => {
    // Simula o esquecimento classico: alguem escreve a query a mao e nao poe
    // `where tenant_id = ...`. O RLS resolve por baixo.
    const rows = await withTenant(outraRede, async (ctx) =>
      ctx.db.selectFrom("patient").select(["id", "tenant_id"]).execute(),
    );

    expect(rows).toHaveLength(1);
    expect(rows.every((row) => row.tenant_id === SEED.bellaVita)).toBe(true);
  });

  it("paciente de outra rede nao aparece nem com o id em maos", async () => {
    const found = await withTenant(dona, async (ctx) =>
      ctx.db
        .selectFrom("patient")
        .select("id")
        .where("id", "=", SEED.pacienteBella)
        .executeTakeFirst(),
    );

    expect(found).toBeUndefined();
  });

  it("escrita com tenant de outra rede vira erro de isolamento", async () => {
    await expect(
      withTenant(dona, async (ctx) =>
        ctx.db
          .insertInto("tag")
          .values({ tenant_id: SEED.bellaVita, name: "invasao" })
          .execute(),
      ),
    ).rejects.toBeInstanceOf(TenantViolation);
  });

  it("o contexto nao sobrevive a transacao, mesmo com a conexao reaproveitada", async () => {
    await withTenant(dona, async (ctx) => {
      const inside = await sql<{ tenant: string | null }>`
        select current_setting('app.tenant_id', true) as tenant
      `.execute(ctx.db);
      expect(inside.rows[0]?.tenant).toBe(SEED.redeSorriso);
    });

    // Mesma conexao (pool de 1), fora da transacao: o contexto tem de ter sumido.
    const outside = await withoutContext(async (db) =>
      sql<{ tenant: string | null }>`
        select current_setting('app.tenant_id', true) as tenant
      `.execute(db),
    );

    expect(outside.rows[0]?.tenant ?? "").toBe("");
  });

  it("uma sessao nao contamina a seguinte na mesma conexao", async () => {
    const primeira = await withTenant(dona, async (ctx) => {
      const r = await sql<{ t: string }>`select current_setting('app.tenant_id') as t`.execute(ctx.db);
      return r.rows[0]?.t;
    });

    const segunda = await withTenant(outraRede, async (ctx) => {
      const r = await sql<{ t: string }>`select current_setting('app.tenant_id') as t`.execute(ctx.db);
      return r.rows[0]?.t;
    });

    expect(primeira).toBe(SEED.redeSorriso);
    expect(segunda).toBe(SEED.bellaVita);
  });
});

describe("permissao", () => {
  it("recepcao nao abre prontuario", async () => {
    await expect(
      withTenant(recepcao, (ctx) => getPatientChart(ctx, SEED.pacienteRoberto)),
    ).rejects.toBeInstanceOf(Forbidden);
  });

  it("o erro de permissao diz qual permissao faltou", async () => {
    let captured: Forbidden | null = null;
    try {
      await withTenant(recepcao, (ctx) => getPatientChart(ctx, SEED.pacienteRoberto));
    } catch (error) {
      captured = error as Forbidden;
    }

    expect(captured).toBeInstanceOf(Forbidden);
    expect(captured?.permission).toBe("chart.read");
    expect(captured?.status).toBe(403);
  });

  it("quem tem a permissao passa", async () => {
    const chart = await withTenant(dona, (ctx) =>
      getPatientChart(ctx, SEED.pacienteRoberto),
    );
    expect(Array.isArray(chart.notes)).toBe(true);
  });

  it("leitura de prontuario deixa rastro em phi_access_log", async () => {
    const antes = await contarAcessos(SEED.pacienteMariana);
    await withTenant(dona, (ctx) => getPatientChart(ctx, SEED.pacienteMariana));
    const depois = await contarAcessos(SEED.pacienteMariana);

    expect(depois).toBe(antes + 1);
  });

  it("o rastro registra quem leu", async () => {
    await withTenant(dona, (ctx) => getPatientChart(ctx, SEED.pacienteMariana));

    const row = await admin
      .selectFrom("phi_access_log")
      .select(["actor_id", "purpose", "entity"])
      .where("patient_id", "=", SEED.pacienteMariana)
      .orderBy("occurred_at", "desc")
      .executeTakeFirst();

    expect(row?.actor_id).toBe(dona.userId);
    expect(row?.purpose).toBe("atendimento");
  });
});

describe("escrita e auditoria", () => {
  it("cria paciente na rede da sessao e numera sozinho", async () => {
    const criado = await withTenant(dona, (ctx) =>
      createPatient(ctx, {
        fullName: "Paciente de Teste",
        phone: "(11) 98888-1234",
        email: null,
        taxId: null,
        birthDate: null,
        notes: null,
      }),
    );

    expect(criado.code).toBeGreaterThan(0);
    expect(typeof criado.code).toBe("number");

    const row = await admin
      .selectFrom("patient")
      .select(["tenant_id", "origin_unit_id"])
      .where("id", "=", criado.id)
      .executeTakeFirstOrThrow();

    expect(row.tenant_id).toBe(SEED.redeSorriso);
  });

  it("recusa CPF invalido antes de tocar o banco", async () => {
    await expect(
      withTenant(dona, (ctx) =>
        createPatient(ctx, {
          fullName: "CPF Errado",
          phone: "11988881234",
          taxId: "111.111.111-11",
          email: null,
          birthDate: null,
          notes: null,
        }),
      ),
    ).rejects.toMatchObject({ code: "dados_invalidos" });
  });

  it("a alteracao entra na trilha de auditoria com autor e campos", async () => {
    const criado = await withTenant(dona, (ctx) =>
      createPatient(ctx, {
        fullName: "Auditoria Teste",
        phone: "11977776666",
        email: null,
        taxId: null,
        birthDate: null,
        notes: null,
      }),
    );

    await withTenant(
      dona,
      async (ctx) => {
        await ctx.db
          .updateTable("patient")
          .set({ notes: "Prefere manha" })
          .where("id", "=", criado.id)
          .execute();
      },
      { requestId: "req-teste-1", ip: "203.0.113.9" },
    );

    const log = await admin
      .selectFrom("audit_log")
      .select(["actor_id", "action", "changed_keys", "request_id"])
      .where("entity", "=", "patient")
      .where("entity_id", "=", criado.id)
      .orderBy("occurred_at", "desc")
      .executeTakeFirstOrThrow();

    expect(log.action).toBe("update");
    expect(log.actor_id).toBe(dona.userId);
    expect(log.changed_keys).toContain("notes");
    expect(log.request_id).toBe("req-teste-1");
  });

  it("a transacao inteira volta atras quando algo falha no meio", async () => {
    const antes = await withTenant(dona, (ctx) => listPatients(ctx));

    await expect(
      withTenant(dona, async (ctx) => {
        await createPatient(ctx, {
          fullName: "Nao Deve Sobrar",
          phone: "11966665555",
          email: null,
          taxId: null,
          birthDate: null,
          notes: null,
        });
        throw new Error("falha depois da escrita");
      }),
    ).rejects.toThrow("falha depois da escrita");

    const depois = await withTenant(dona, (ctx) => listPatients(ctx));
    expect(depois.total).toBe(antes.total);
  });
});

describe("traducao de erro do banco", () => {
  it("conflito de agenda vira mensagem de produto", async () => {
    const { inicio, fim } = horarioLivre(0);

    const marcar = (patientId: string) =>
      withTenant(dona, async (ctx) => {
        await ctx.db
          .insertInto("appointment")
          .values({
            tenant_id: ctx.session.tenantId,
            unit_id: ctx.unitId(),
            patient_id: patientId,
            provider_id: SEED.drBruno,
            starts_at: inicio,
            ends_at: fim,
          })
          .execute();
      });

    await marcar(SEED.pacienteMariana);

    await expect(marcar(SEED.pacienteRoberto)).rejects.toThrow(
      /ja tem atendimento marcado nesse horario/,
    );
  });

  it("transicao de status invalida vira mensagem de produto", async () => {
    const { inicio, fim } = horarioLivre(1);

    const id = await withTenant(dona, async (ctx) => {
      const row = await ctx.db
        .insertInto("appointment")
        .values({
          tenant_id: ctx.session.tenantId,
          unit_id: ctx.unitId(),
          patient_id: SEED.pacienteMariana,
          provider_id: SEED.drAna,
          starts_at: inicio,
          ends_at: fim,
        })
        .returning("id")
        .executeTakeFirstOrThrow();
      return row.id;
    });

    await expect(
      withTenant(dona, async (ctx) => {
        await ctx.db
          .updateTable("appointment")
          .set({ status: "completed" })
          .where("id", "=", id)
          .execute();
      }),
    ).rejects.toThrow(/mudanca de status nao e permitida/);
  });
});

describe("tipos vindos do banco", () => {
  it("dinheiro chega como numero, nao string", async () => {
    const row = await withTenant(dona, (ctx) =>
      ctx.db
        .selectFrom("price_list_item")
        .select(["price_cents", "expected_cost_cents"])
        .where("procedure_id", "=", SEED.procedimentoResina)
        .executeTakeFirstOrThrow(),
    );

    expect(typeof row.price_cents).toBe("number");
    expect(row.price_cents + row.expected_cost_cents).toBe(29800);
  });

  it("data sem hora chega como string ISO, sem atravessar o dia", async () => {
    const [row] = await withTenant(dona, (ctx) =>
      ctx.db
        .selectFrom("product_lot")
        .select(["lot_number", "expires_on"])
        .where("lot_number", "=", "TOX-2027A")
        .execute(),
    );

    expect(typeof row?.expires_on).toBe("string");
    expect(row?.expires_on).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

/** Paciente minimo: so o que o cadastro exige de verdade. */
const VAZIO = (fullName: string, phone: string) => ({
  fullName,
  phone,
  email: null,
  taxId: null,
  birthDate: null,
  notes: null,
});

describe("sinal de controle dentro da transacao", () => {
  it("redirecionamento comita o que ja foi escrito", async () => {
    const nome = `Regressao Redirect ${Date.now()}`;
    const sinal = Object.assign(new Error("NEXT_REDIRECT"), {
      digest: "NEXT_REDIRECT;replace;/pacientes;307;",
    });

    // O framework sinaliza redirecionamento LANCANDO. Se a transacao tratasse
    // isso como erro, o paciente seria desfeito e o navegador cairia numa
    // ficha inexistente — foi exatamente o que aconteceu antes desta correcao.
    await expect(
      withTenant(dona, async (ctx) => {
        await createPatient(ctx, VAZIO(nome, "11988887777"));
        throw sinal;
      }),
    ).rejects.toBe(sinal);

    const row = await admin
      .selectFrom("patient")
      .select("id")
      .where("full_name", "=", nome)
      .executeTakeFirst();

    expect(row).toBeDefined();
  });

  it("erro de verdade continua desfazendo tudo", async () => {
    const nome = `Regressao Rollback ${Date.now()}`;

    await expect(
      withTenant(dona, async (ctx) => {
        await createPatient(ctx, VAZIO(nome, "11988886666"));
        throw new Error("falha de verdade");
      }),
    ).rejects.toThrow("falha de verdade");

    const row = await admin
      .selectFrom("patient")
      .select("id")
      .where("full_name", "=", nome)
      .executeTakeFirst();

    expect(row).toBeUndefined();
  });
});

async function contarAcessos(patientId: string): Promise<number> {
  const row = await admin
    .selectFrom("phi_access_log")
    .select((eb) => eb.fn.countAll<number>().as("total"))
    .where("patient_id", "=", patientId)
    .executeTakeFirst();
  return Number(row?.total ?? 0);
}
