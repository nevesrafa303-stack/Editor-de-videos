/**
 * Importador de planilha, pela camada de acesso.
 *
 * O que travam: analisar não cria ninguém, duplicado NUNCA sobrescreve, e a
 * importação fica guardada linha a linha — com o que veio e o que aconteceu.
 *
 * O último é o que responde, meses depois, "por que esta paciente está com o
 * telefone errado?". Importação em massa é exatamente de onde vem dado errado
 * em massa, e sem o registro não há como saber se o sistema leu errado ou se a
 * planilha estava errada.
 */
process.env.DB_POOL_MAX = "1";

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { closeDb } from "@/server/db";
import { withTenant, type TenantSession } from "@/server/context";
import {
  analyzeImport,
  applyImport,
  cancelImport,
  getImport,
  listImports,
} from "@/modules/import";
import { Forbidden } from "@/shared/errors";
import { adminDb, entrar, SEED, USUARIOS } from "./helpers";

let dona: TenantSession;
let recepcao: TenantSession;
const admin = adminDb();

beforeAll(async () => {
  dona = (await entrar(USUARIOS.dona)).session;
  recepcao = (await entrar(USUARIOS.recepcao)).session;
});

afterAll(async () => {
  await admin.destroy();
  await closeDb();
});

let n = 0;

/** Telefone único por execução: o banco de teste não é recriado entre elas. */
function fone(): string {
  n += 1;
  return `1194${String(n).padStart(7, "0")}`;
}

describe("analisar", () => {
  it("conta o que vai entrar, e não cria ninguém", async () => {
    const telefone = fone();
    const csv = ["nome,telefone", `Aurora Campos,${telefone}`].join("\n");

    const analise = await withTenant(dona, (ctx) =>
      analyzeImport(ctx, { csv, filename: "pacientes.csv" }),
    );

    expect(analise.total).toBe(1);
    expect(analise.validas).toBe(1);

    // Nada foi criado ainda: analisar é olhar, não escrever.
    const pacientes = await admin
      .selectFrom("patient")
      .select("id")
      .where("phone", "=", telefone)
      .execute();

    expect(pacientes).toHaveLength(0);
  });

  it("separa válida, duplicada e com erro", async () => {
    const boa = fone();
    const ruim = fone();

    const csv = [
      "nome,telefone",
      `Primeira Pessoa,${boa}`,
      ",11999998888", // sem nome
      `Repetida,${ruim}`,
      `Repetida de novo,${ruim}`, // repetida na própria planilha
    ].join("\n");

    const a = await withTenant(dona, (ctx) => analyzeImport(ctx, { csv }));

    expect(a.total).toBe(4);
    expect(a.validas).toBe(2);
    expect(a.comErro).toBe(1);
    expect(a.duplicadas).toBe(1);
  });

  it("quem já está no sistema aparece como duplicado, com o nome de quem é", async () => {
    // A Mariana do seed, pelo telefone dela.
    const mariana = await admin
      .selectFrom("patient")
      .select(["phone", "full_name"])
      .where("id", "=", SEED.pacienteMariana)
      .executeTakeFirstOrThrow();

    const csv = ["nome,telefone", `Mariana (da planilha),${mariana.phone}`].join("\n");

    const a = await withTenant(dona, (ctx) => analyzeImport(ctx, { csv }));
    expect(a.duplicadas).toBe(1);

    const { rows } = await withTenant(dona, (ctx) => getImport(ctx, a.jobId));
    expect(rows[0]?.status).toBe("duplicate");
    expect(rows[0]?.message).toBe(`Já cadastrado: ${mariana.full_name}`);
  });

  it("diz o que falta quando a planilha não tem as colunas", async () => {
    await expect(
      withTenant(dona, (ctx) => analyzeImport(ctx, { csv: "apelido,idade\nMá,30" })),
    ).rejects.toThrow(/precisa de uma coluna de nome e uma de telefone/);
  });

  it("e avisa quais colunas vai ignorar", async () => {
    const csv = ["nome,telefone,convenio", `Com Extra,${fone()},Unimed`].join("\n");

    const a = await withTenant(dona, (ctx) => analyzeImport(ctx, { csv }));
    expect(a.ignoradas).toEqual(["convenio"]);
  });

  it("recepção não importa: é cadastro em massa e dado pessoal em volume", async () => {
    await expect(
      withTenant(recepcao, (ctx) =>
        analyzeImport(ctx, { csv: `nome,telefone\nX,${fone()}` }),
      ),
    ).rejects.toThrow(Forbidden);
  });
});

describe("aplicar", () => {
  it("cria só as válidas, e guarda de qual linha cada uma veio", async () => {
    const boa = fone();
    const csv = [
      "nome,telefone,cpf,nascimento",
      // CPF válido e fora do seed: usar o de uma paciente que já existe faria
      // a linha ser classificada como duplicada, que é o comportamento certo —
      // e não é o que este teste mede.
      `Aurora Campos,${boa},010.000.000-28,15/03/1990`,
      ",11999997777",
    ].join("\n");

    const a = await withTenant(dona, (ctx) => analyzeImport(ctx, { csv }));
    const { importados } = await withTenant(dona, (ctx) => applyImport(ctx, a.jobId));

    expect(importados).toBe(1);

    const paciente = await admin
      .selectFrom("patient")
      .select(["id", "full_name", "tax_id", "birth_date", "notes"])
      .where("phone", "=", boa)
      .executeTakeFirstOrThrow();

    expect(paciente.full_name).toBe("Aurora Campos");
    expect(paciente.tax_id).toBe("01000000028");
    expect(paciente.birth_date).toBe("1990-03-15");
    // A ficha diz de onde veio: daqui a um ano alguém vai perguntar.
    expect(paciente.notes).toMatch(/Importado de planilha/);

    const { rows } = await withTenant(dona, (ctx) => getImport(ctx, a.jobId));
    const importada = rows.find((r) => r.status === "imported");
    expect(importada?.patientId).toBe(paciente.id);
  });

  it("duplicado nunca sobrescreve quem já está lá", async () => {
    const mariana = await admin
      .selectFrom("patient")
      .select(["id", "phone", "full_name"])
      .where("id", "=", SEED.pacienteMariana)
      .executeTakeFirstOrThrow();

    const csv = ["nome,telefone", `NOME TROCADO,${mariana.phone}`].join("\n");

    const a = await withTenant(dona, (ctx) => analyzeImport(ctx, { csv }));
    const { importados } = await withTenant(dona, (ctx) => applyImport(ctx, a.jobId));

    expect(importados).toBe(0);

    // A planilha velha quase sempre é a fonte pior. O cadastro fica como está.
    const depois = await admin
      .selectFrom("patient")
      .select("full_name")
      .where("id", "=", mariana.id)
      .executeTakeFirstOrThrow();

    expect(depois.full_name).toBe(mariana.full_name);
  });

  it("saldo da planilha vira dívida, com a origem na descrição", async () => {
    const telefone = fone();
    const csv = [
      "nome;telefone;saldo;vencimento",
      `Deve Alguma Coisa;${telefone};1.234,56;20/10/2026`,
    ].join("\n");

    const a = await withTenant(dona, (ctx) => analyzeImport(ctx, { csv }));
    await withTenant(dona, (ctx) => applyImport(ctx, a.jobId));

    const paciente = await admin
      .selectFrom("patient")
      .select("id")
      .where("phone", "=", telefone)
      .executeTakeFirstOrThrow();

    const recebivel = await admin
      .selectFrom("receivable")
      .select(["total_cents", "description", "origin"])
      .where("patient_id", "=", paciente.id)
      .executeTakeFirstOrThrow();

    expect(Number(recebivel.total_cents)).toBe(123456);
    expect(recebivel.origin).toBe("manual");
    expect(recebivel.description).toMatch(/sistema anterior/);

    const parcela = await admin
      .selectFrom("installment")
      .select(["due_on", "amount_cents"])
      .where("patient_id", "=", paciente.id)
      .executeTakeFirstOrThrow();

    expect(parcela.due_on).toBe("2026-10-20");
    expect(Number(parcela.amount_cents)).toBe(123456);
  });

  it("saldo sem vencimento vence hoje: já é devido", async () => {
    // A planilha real quase nunca traz vencimento. Inventar uma data futura
    // esconderia a dívida do relatório de vencidas — que é onde a clínica vai
    // procurar. Este caso só apareceu ao rodar pela tela: o teste anterior
    // sempre mandava vencimento, e `installment.due_on` é obrigatório.
    const telefone = fone();
    const csv = ["nome;telefone;saldo", `Deve Sem Data;${telefone};800,00`].join("\n");

    const a = await withTenant(dona, (ctx) => analyzeImport(ctx, { csv }));
    const { importados } = await withTenant(dona, (ctx) => applyImport(ctx, a.jobId));

    expect(importados).toBe(1);

    const paciente = await admin
      .selectFrom("patient")
      .select("id")
      .where("phone", "=", telefone)
      .executeTakeFirstOrThrow();

    const parcela = await admin
      .selectFrom("installment")
      .select(["due_on", "amount_cents"])
      .where("patient_id", "=", paciente.id)
      .executeTakeFirstOrThrow();

    expect(Number(parcela.amount_cents)).toBe(80000);
    expect(parcela.due_on).toBe(new Date().toISOString().slice(0, 10));
  });

  it("aplicar duas vezes não importa de novo", async () => {
    const csv = ["nome,telefone", `Só Uma Vez,${fone()}`].join("\n");

    const a = await withTenant(dona, (ctx) => analyzeImport(ctx, { csv }));
    await withTenant(dona, (ctx) => applyImport(ctx, a.jobId));

    await expect(
      withTenant(dona, (ctx) => applyImport(ctx, a.jobId)),
    ).rejects.toThrow(/já foi aplicada/i);
  });

  it("descartada não pode ser aplicada", async () => {
    const csv = ["nome,telefone", `Descartada,${fone()}`].join("\n");

    const a = await withTenant(dona, (ctx) => analyzeImport(ctx, { csv }));
    await withTenant(dona, (ctx) => cancelImport(ctx, a.jobId));

    await expect(
      withTenant(dona, (ctx) => applyImport(ctx, a.jobId)),
    ).rejects.toThrow(/já foi aplicada ou descartada/i);
  });
});

describe("o que fica guardado", () => {
  it("a linha crua fica como veio, para saber de quem foi o erro", async () => {
    const telefone = fone();
    const csv = [
      "nome,telefone,cpf",
      `Com CPF Errado,${telefone},111.111.111-11`,
    ].join("\n");

    const a = await withTenant(dona, (ctx) => analyzeImport(ctx, { csv }));
    const { rows } = await withTenant(dona, (ctx) => getImport(ctx, a.jobId));

    // O CPF errado está guardado EXATAMENTE como veio na planilha.
    expect(rows[0]?.raw.cpf).toBe("111.111.111-11");
    // E a linha entra assim mesmo, com o aviso: um dígito errado não pode
    // custar uma paciente.
    expect(rows[0]?.status).toBe("valid");
    expect(rows[0]?.message).toMatch(/CPF inválido, entra sem/);
  });

  it("o histórico mostra quem trouxe o quê", async () => {
    const csv = ["nome,telefone", `No Histórico,${fone()}`].join("\n");

    const a = await withTenant(dona, (ctx) => analyzeImport(ctx, { csv, filename: "base.csv" }));
    await withTenant(dona, (ctx) => applyImport(ctx, a.jobId));

    const historico = await withTenant(dona, (ctx) => listImports(ctx));
    const minha = historico.find((h) => h.id === a.jobId);

    expect(minha?.filename).toBe("base.csv");
    expect(minha?.status).toBe("applied");
    expect(minha?.importadas).toBe(1);
    expect(minha?.createdBy).toBeTruthy();
    expect(minha?.appliedAt).not.toBeNull();
  });

  it("importação de outra rede não existe", async () => {
    const csv = ["nome,telefone", `Da Rede A,${fone()}`].join("\n");
    const a = await withTenant(dona, (ctx) => analyzeImport(ctx, { csv }));

    const outra = (await entrar(USUARIOS.outraRede)).session;
    await expect(withTenant(outra, (ctx) => getImport(ctx, a.jobId))).rejects.toThrow(
      /nao encontrad/i,
    );
  });
});
