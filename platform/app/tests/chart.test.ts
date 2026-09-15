/**
 * Testes de integracao do prontuario.
 *
 * Este e o modulo em que errar tem consequencia juridica, nao so comercial:
 * evolucao clinica e prova em pericia, e acesso a dado de saude e rastreado
 * por lei. O que estes testes travam e exatamente isso — que nada se apaga,
 * que correcao vira aditamento, e que abrir a ficha deixa rastro.
 */
process.env.DB_POOL_MAX = "1";

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { sql } from "kysely";
import { closeDb } from "@/server/db";
import { withTenant, type TenantSession } from "@/server/context";
import {
  addClinicalNote,
  amendClinicalNote,
  getPatientChart,
  recordTooth,
  saveAnamnesis,
} from "@/modules/chart";
import { Forbidden, NotFound, ValidationError } from "@/shared/errors";
import { adminDb, entrar, SEED, USUARIOS } from "./helpers";

let dona: TenantSession;
let profissional: TenantSession;
let recepcao: TenantSession;
let outraRede: TenantSession;
const admin = adminDb();

const ROBERTO = SEED.pacienteRoberto;
const MARIANA = SEED.pacienteMariana;

beforeAll(async () => {
  dona = (await entrar(USUARIOS.dona)).session;
  profissional = (await entrar(USUARIOS.profissional)).session;
  recepcao = (await entrar(USUARIOS.recepcao)).session;
  outraRede = (await entrar(USUARIOS.outraRede)).session;
});

afterAll(async () => {
  await admin.destroy();
  await closeDb();
});

describe("leitura", () => {
  it("monta a ficha com odontograma, anamnese e evolucoes", async () => {
    const chart = await withTenant(dona, (ctx) => getPatientChart(ctx, ROBERTO));

    expect(chart.patient.fullName).toBe("Roberto Carvalho");
    // 32 permanentes e 20 decíduos: a ficha traz as duas dentições, e a tela
    // escolhe qual desenhar.
    expect(chart.teeth).toHaveLength(52);
    expect(chart.teeth.filter((d) => d.dentition === "permanent")).toHaveLength(32);
    expect(chart.teeth.filter((d) => d.dentition === "deciduous")).toHaveLength(20);
    expect(chart.alerts).toContain("Alergia: penicilina");

    const dente36 = chart.teeth.find((d) => d.code === "36");
    expect(dente36?.entries.some((e) => e.condition === "caries")).toBe(true);

    const ausente = chart.teeth.find((d) => d.code === "46");
    expect(ausente?.entries[0]?.condition).toBe("missing");
  });

  it("faces do dente chegam como array, nao como texto do banco", async () => {
    const chart = await withTenant(dona, (ctx) => getPatientChart(ctx, ROBERTO));
    const dente36 = chart.teeth.find((d) => d.code === "36");

    // `"{O,M}".includes("M")` tambem e true: sem esta assercao o teste passa
    // com o tipo errado e a tela quebra no `.join()`.
    expect(Array.isArray(dente36?.entries[0]?.surfaces)).toBe(true);
    expect(dente36?.entries[0]?.surfaces).toEqual(["O", "M"]);
  });

  it("aditamento aparece junto da evolucao que corrige, nao solto", async () => {
    const chart = await withTenant(dona, (ctx) => getPatientChart(ctx, ROBERTO));

    const corrigida = chart.notes.find((n) => n.amendments.length > 0);
    expect(corrigida).toBeDefined();
    expect(corrigida?.amendments[0]?.reason).toMatch(/dente anotado errado/i);

    // O aditamento nao pode aparecer tambem como evolucao independente: a
    // linha do tempo mostraria duas versoes sem dizer qual corrige qual.
    const ids = chart.notes.map((n) => n.id);
    expect(ids).not.toContain(corrigida?.amendments[0]?.id);
  });

  it("abrir a ficha deixa rastro", async () => {
    const antes = await contarAcessos(ROBERTO);
    await withTenant(dona, (ctx) => getPatientChart(ctx, ROBERTO));
    const depois = await contarAcessos(ROBERTO);

    expect(depois).toBe(antes + 1);
  });

  it("paciente de outra rede nao existe", async () => {
    await expect(
      withTenant(outraRede, (ctx) => getPatientChart(ctx, ROBERTO)),
    ).rejects.toThrow(NotFound);
  });

  it("papel sem permissao de prontuario nao abre — e nao deixa rastro", async () => {
    const antes = await contarAcessos(ROBERTO);

    await expect(
      withTenant(recepcao, (ctx) => getPatientChart(ctx, ROBERTO)),
    ).rejects.toThrow(Forbidden);

    expect(await contarAcessos(ROBERTO)).toBe(antes);
  });
});

describe("evolucao clinica", () => {
  it("nasce assinada", async () => {
    const { id } = await withTenant(profissional, (ctx) =>
      addClinicalNote(ctx, {
        patientId: MARIANA,
        content: "Profilaxia e orientacao de higiene. Sem intercorrencias.",
      }),
    );

    const row = await admin
      .selectFrom("clinical_note")
      .select(["signed_at", "signature_hash", "provider_id"])
      .where("id", "=", id)
      .executeTakeFirstOrThrow();

    expect(row.signed_at).not.toBeNull();
    expect(row.signature_hash).toMatch(/^[0-9a-f]{64}$/);
    expect(row.provider_id).toBe(profissional.membershipId);
  });

  it("texto curto demais nao vira evolucao", async () => {
    await expect(
      withTenant(profissional, (ctx) =>
        addClinicalNote(ctx, { patientId: MARIANA, content: "ok" }),
      ),
    ).rejects.toThrow(ValidationError);
  });

  it("evolucao fechada nao pode ser reescrita — nem por caminho torto", async () => {
    const { id } = await withTenant(profissional, (ctx) =>
      addClinicalNote(ctx, {
        patientId: MARIANA,
        content: "Registro que sera fechado para o teste de imutabilidade.",
      }),
    );

    await admin.updateTable("clinical_note").set({ locked_at: new Date() }).where("id", "=", id).execute();

    // UPDATE cru, sem passar pelo modulo: quem recusa e o trigger.
    await expect(
      withTenant(profissional, (ctx) =>
        ctx.db
          .updateTable("clinical_note")
          .set({ content: "Texto trocado por fora do modulo." })
          .where("id", "=", id)
          .execute(),
      ),
    ).rejects.toThrow(/nao pode ser reescrita|aditamento/i);
  });

  it("evolucao nao pode ser apagada", async () => {
    const { id } = await withTenant(profissional, (ctx) =>
      addClinicalNote(ctx, {
        patientId: MARIANA,
        content: "Registro para o teste de exclusao de evolucao clinica.",
      }),
    );

    await expect(
      withTenant(profissional, (ctx) =>
        ctx.db.deleteFrom("clinical_note").where("id", "=", id).execute(),
      ),
    ).rejects.toThrow(/nao pode ser apagad/i);
  });

  it("aditamento fecha a original e preserva as duas versoes", async () => {
    const { id: original } = await withTenant(profissional, (ctx) =>
      addClinicalNote(ctx, {
        patientId: MARIANA,
        content: "Restauracao no 37, face oclusal.",
      }),
    );

    const { id: aditamento } = await withTenant(profissional, (ctx) =>
      amendClinicalNote(ctx, {
        noteId: original,
        content: "Correcao: a restauracao foi no 36.",
        reason: "Dente trocado no registro.",
      }),
    );

    const [antiga, nova] = await Promise.all([
      admin.selectFrom("clinical_note").select(["content", "locked_at"]).where("id", "=", original).executeTakeFirstOrThrow(),
      admin.selectFrom("clinical_note").select(["amends_note_id", "amendment_reason"]).where("id", "=", aditamento).executeTakeFirstOrThrow(),
    ]);

    expect(antiga.content).toContain("37");
    expect(antiga.locked_at).not.toBeNull();
    expect(nova.amends_note_id).toBe(original);
    expect(nova.amendment_reason).toBe("Dente trocado no registro.");
  });

  it("aditamento de aditamento e recusado", async () => {
    const { id: original } = await withTenant(profissional, (ctx) =>
      addClinicalNote(ctx, { patientId: MARIANA, content: "Evolucao base do teste de corrente." }),
    );

    const { id: aditamento } = await withTenant(profissional, (ctx) =>
      amendClinicalNote(ctx, {
        noteId: original,
        content: "Primeira correcao do teste de corrente.",
        reason: "Motivo qualquer.",
      }),
    );

    await expect(
      withTenant(profissional, (ctx) =>
        amendClinicalNote(ctx, {
          noteId: aditamento,
          content: "Correcao da correcao.",
          reason: "Nao deveria passar.",
        }),
      ),
    ).rejects.toThrow(/aditamento/i);
  });

  it("quem nao atende nao registra evolucao", async () => {
    // A dona tem chart.write (tem todas as permissoes), mas o vinculo dela
    // e de profissional — entao passa. O caso que interessa e o oposto:
    // permissao sem vinculo assistencial.
    const semVinculo: TenantSession = { ...dona, isProvider: false };

    await expect(
      withTenant(semVinculo, (ctx) =>
        addClinicalNote(ctx, {
          patientId: MARIANA,
          content: "Tentativa de evolucao sem vinculo de profissional.",
        }),
      ),
    ).rejects.toThrow(Forbidden);
  });
});

describe("odontograma", () => {
  it("condicao de dente inteiro substitui os registros de face", async () => {
    await withTenant(profissional, (ctx) =>
      recordTooth(ctx, {
        patientId: MARIANA,
        toothCode: "24",
        condition: "caries",
        surfaces: ["O"],
      }),
    );

    const { superseded } = await withTenant(profissional, (ctx) =>
      recordTooth(ctx, { patientId: MARIANA, toothCode: "24", condition: "missing", surfaces: [] }),
    );

    expect(superseded).toBeGreaterThanOrEqual(1);

    const chart = await withTenant(dona, (ctx) => getPatientChart(ctx, MARIANA));
    const dente = chart.teeth.find((d) => d.code === "24");

    expect(dente?.entries).toHaveLength(1);
    expect(dente?.entries[0]?.condition).toBe("missing");
  });

  it("faces diferentes do mesmo dente convivem", async () => {
    await withTenant(profissional, (ctx) =>
      recordTooth(ctx, { patientId: MARIANA, toothCode: "25", condition: "caries", surfaces: ["O"] }),
    );
    await withTenant(profissional, (ctx) =>
      recordTooth(ctx, {
        patientId: MARIANA,
        toothCode: "25",
        condition: "restoration",
        surfaces: ["M"],
      }),
    );

    const chart = await withTenant(dona, (ctx) => getPatientChart(ctx, MARIANA));
    const dente = chart.teeth.find((d) => d.code === "25");

    expect(dente?.entries.map((e) => e.condition).sort()).toEqual(["caries", "restoration"]);
  });

  it("mesma face registrada de novo substitui a anterior", async () => {
    await withTenant(profissional, (ctx) =>
      recordTooth(ctx, { patientId: MARIANA, toothCode: "26", condition: "caries", surfaces: ["O"] }),
    );

    const { superseded } = await withTenant(profissional, (ctx) =>
      recordTooth(ctx, {
        patientId: MARIANA,
        toothCode: "26",
        condition: "restoration",
        surfaces: ["O"],
      }),
    );

    expect(superseded).toBe(1);

    const chart = await withTenant(dona, (ctx) => getPatientChart(ctx, MARIANA));
    const dente = chart.teeth.find((d) => d.code === "26");

    expect(dente?.entries).toHaveLength(1);
    expect(dente?.entries[0]?.condition).toBe("restoration");
  });

  it("registro substituido continua existindo, com quem o substituiu", async () => {
    const substituidos = await admin
      .selectFrom("odontogram_entry")
      .select(["id", "superseded_by"])
      .where("patient_id", "=", MARIANA)
      .where("superseded_at", "is not", null)
      .execute();

    expect(substituidos.length).toBeGreaterThan(0);
    expect(substituidos.every((r) => r.superseded_by !== null)).toBe(true);
  });

  it("condicao de face exige face", async () => {
    await expect(
      withTenant(profissional, (ctx) =>
        recordTooth(ctx, { patientId: MARIANA, toothCode: "27", condition: "caries", surfaces: [] }),
      ),
      // A frase especifica fica no campo; o topo traz o resumo.
    ).rejects.toMatchObject({
      details: { surfaces: ["Escolha ao menos uma face."] },
    });
  });
});

describe("anamnese", () => {
  it("alerta e derivado do formulario e materializado na resposta", async () => {
    const { alerts } = await withTenant(profissional, (ctx) =>
      saveAnamnesis(ctx, {
        patientId: MARIANA,
        templateId: "0d111111-1111-7111-8111-111111111111",
        answers: {
          alergia: true,
          alergia_qual: "dipirona",
          hipertensao: false,
          diabetes: false,
          anticoagulante: true,
          gestante: false,
        },
      }),
    );

    expect(alerts).toContain("Alergia medicamentosa");
    expect(alerts).toContain("Alergia: dipirona");
    expect(alerts).toContain("Usa anticoagulante");
    expect(alerts).not.toContain("Hipertensão");

    const chart = await withTenant(dona, (ctx) => getPatientChart(ctx, MARIANA));
    expect(chart.alerts).toEqual(alerts);
  });

  it("campo obrigatorio em branco nao salva", async () => {
    await expect(
      withTenant(profissional, (ctx) =>
        saveAnamnesis(ctx, {
          patientId: MARIANA,
          templateId: "0d111111-1111-7111-8111-111111111111",
          answers: { alergia: false },
        }),
      ),
    ).rejects.toThrow(ValidationError);
  });

  it("resposta anterior continua no historico", async () => {
    const versoes = await admin
      .selectFrom("form_response")
      .select("id")
      .where("patient_id", "=", MARIANA)
      .execute();

    expect(versoes.length).toBeGreaterThan(1);
  });
});

describe("politica restritiva da rede", () => {
  it("com a politica ligada, profissional so ve quem atendeu", async () => {
    await ligarRestricao(true);

    try {
      // Carla nunca atendeu o Roberto.
      await expect(
        withTenant(profissional, (ctx) => getPatientChart(ctx, ROBERTO)),
      ).rejects.toThrow(NotFound);

      // A dona tem chart.read_all: continua vendo.
      const chart = await withTenant(dona, (ctx) => getPatientChart(ctx, ROBERTO));
      expect(chart.patient.id).toBe(ROBERTO);
    } finally {
      await ligarRestricao(false);
    }
  });

  it("atender cria o vinculo e abre o prontuario", async () => {
    await ligarRestricao(true);

    try {
      await expect(
        withTenant(profissional, (ctx) => getPatientChart(ctx, ROBERTO)),
      ).rejects.toThrow(NotFound);
    } finally {
      await ligarRestricao(false);
    }

    // Com a politica desligada, Carla registra a evolucao — e o vinculo nasce
    // do atendimento, nao de um cadastro a parte.
    await withTenant(profissional, (ctx) =>
      addClinicalNote(ctx, {
        patientId: ROBERTO,
        content: "Avaliacao de harmonizacao facial. Paciente encaminhado pela dentista.",
      }),
    );

    await ligarRestricao(true);

    try {
      const chart = await withTenant(profissional, (ctx) => getPatientChart(ctx, ROBERTO));
      expect(chart.patient.id).toBe(ROBERTO);
    } finally {
      await ligarRestricao(false);
    }
  });
});

async function ligarRestricao(valor: boolean): Promise<void> {
  await admin
    .updateTable("tenant_policy")
    .set({ restrict_chart_to_own_patients: valor })
    .where("tenant_id", "=", SEED.redeSorriso)
    .execute();
}

async function contarAcessos(patientId: string): Promise<number> {
  const row = await admin
    .selectFrom("phi_access_log")
    .select((eb) => eb.fn.countAll<number>().as("total"))
    .where("patient_id", "=", patientId)
    .executeTakeFirst();
  return Number(row?.total ?? 0);
}
