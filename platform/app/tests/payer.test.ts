/**
 * Testes de integracao de convenio.
 *
 * O que travam: a tabela do convenio vence a particular na hora de orcar, e
 * trocar o convenio REPRECIFICA a proposta.
 *
 * O aceite de convenio faturado mora em `claim.test.ts`: ele deixou de ser uma
 * recusa e virou um fluxo, e o fluxo tem suite propria.
 */
process.env.DB_POOL_MAX = "1";

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { closeDb } from "@/server/db";
import { withTenant, type TenantSession } from "@/server/context";
import {
  acceptQuote,
  addQuoteItem,
  changeQuoteStatus,
  createQuote,
  getQuote,
  setQuotePayer,
} from "@/modules/quote";
import { getPayer, listActivePayers, listPayers, savePayer, setPayerPrice } from "@/modules/payer";
import { Conflict, Forbidden, NotFound } from "@/shared/errors";
import { adminDb, entrar, SEED, USUARIOS } from "./helpers";

let dona: TenantSession;
let recepcao: TenantSession;
let outraRede: TenantSession;
const admin = adminDb();

const MARIANA = SEED.pacienteMariana;
const RESINA = SEED.procedimentoResina;
const ODONTO_SAUDE = "09111111-1111-7111-8111-111111111111";
const DENTAL_MAIS = "09222222-2222-7222-8222-222222222222";

beforeAll(async () => {
  dona = (await entrar(USUARIOS.dona)).session;
  recepcao = (await entrar(USUARIOS.recepcao)).session;
  outraRede = (await entrar(USUARIOS.outraRede)).session;
});

afterAll(async () => {
  await admin.destroy();
  await closeDb();
});

describe("cadastro", () => {
  it("lista os convenios com quantos precos cada um tem", async () => {
    const convenios = await withTenant(dona, (ctx) => listPayers(ctx));

    const odonto = convenios.find((c) => c.id === ODONTO_SAUDE);
    expect(odonto?.billingMode).toBe("reimbursement");
    expect(odonto?.precos).toBe(2);

    const dental = convenios.find((c) => c.id === DENTAL_MAIS);
    expect(dental?.billingMode).toBe("invoiced");
    expect(dental?.precos).toBe(2);
  });

  it("codigo repetido e recusado com o nome de quem ja usa", async () => {
    await expect(
      withTenant(dona, (ctx) =>
        savePayer(ctx, { code: "ODONTO_SAUDE", name: "Outro qualquer" }),
      ),
    ).rejects.toThrow(/Odonto Saúde/);
  });

  it("quem nao mexe em preco nao cadastra convenio", async () => {
    await expect(
      withTenant(recepcao, (ctx) => savePayer(ctx, { code: "NOVO", name: "Novo convênio" })),
    ).rejects.toThrow(Forbidden);
  });

  it("convenio de outra rede nao existe", async () => {
    await expect(withTenant(outraRede, (ctx) => getPayer(ctx, ODONTO_SAUDE))).rejects.toThrow(
      NotFound,
    );
  });
});

describe("tabela de preco", () => {
  it("mostra o particular e o do convenio lado a lado, e o que a clinica abre mao", async () => {
    const { precos, diferencaCents } = await withTenant(dona, (ctx) =>
      getPayer(ctx, ODONTO_SAUDE),
    );

    const resina = precos.find((p) => p.procedureId === RESINA);
    expect(resina?.particularCents).toBe(28000);
    expect(resina?.convenioCents).toBe(18000);

    // Resina 10.000 + implante 80.000.
    expect(diferencaCents).toBe(90000);
  });

  it("definir preco cria a tabela do convenio na primeira vez", async () => {
    const { id } = await withTenant(dona, (ctx) =>
      savePayer(ctx, { code: "AMIL_DENTAL", name: "Amil Dental" }),
    );

    await withTenant(dona, (ctx) =>
      setPayerPrice(ctx, { payerId: id, procedureId: RESINA, priceCents: 20000 }),
    );

    const detalhe = await withTenant(dona, (ctx) => getPayer(ctx, id));
    const resina = detalhe.precos.find((p) => p.procedureId === RESINA);

    expect(resina?.convenioCents).toBe(20000);
    // O custo vem da particular: e o mesmo insumo, quem quer que pague.
    expect(resina?.custoCents).toBe(1800);
  });

  it("preco zero significa nao coberto, e some da tabela", async () => {
    const { id } = await withTenant(dona, (ctx) =>
      savePayer(ctx, { code: "SEM_COBERTURA", name: "Sem cobertura" }),
    );

    await withTenant(dona, (ctx) =>
      setPayerPrice(ctx, { payerId: id, procedureId: RESINA, priceCents: 15000 }),
    );
    await withTenant(dona, (ctx) =>
      setPayerPrice(ctx, { payerId: id, procedureId: RESINA, priceCents: 0 }),
    );

    const detalhe = await withTenant(dona, (ctx) => getPayer(ctx, id));
    const resina = detalhe.precos.find((p) => p.procedureId === RESINA);

    expect(resina?.convenioCents).toBeNull();
  });
});

describe("orcamento com convenio", () => {
  it("o item nasce com o preco do convenio, nao com o particular", async () => {
    const { id } = await withTenant(dona, (ctx) =>
      createQuote(ctx, {
        patientId: MARIANA,
        title: "Com convênio",
        payerId: ODONTO_SAUDE,
      }),
    );

    await withTenant(dona, (ctx) =>
      addQuoteItem(ctx, {
        quoteId: id,
        procedureId: RESINA,
        description: "Restauração em resina",
        toothCode: "36",
        surfaces: ["O"],
        unitPriceCents: 28000,
      }),
    );

    const quote = await withTenant(dona, (ctx) => getQuote(ctx, id));
    expect(quote.items[0]?.unitPriceCents).toBe(18000);
  });

  it("trocar o convenio reprecifica a proposta inteira", async () => {
    const { id } = await withTenant(dona, (ctx) =>
      createQuote(ctx, { patientId: MARIANA, title: "Troca de convênio" }),
    );

    await withTenant(dona, (ctx) =>
      addQuoteItem(ctx, {
        quoteId: id,
        procedureId: RESINA,
        description: "Restauração em resina",
        toothCode: "36",
        surfaces: ["O"],
        unitPriceCents: 28000,
      }),
    );

    const particular = await withTenant(dona, (ctx) => getQuote(ctx, id));
    expect(particular.items[0]?.unitPriceCents).toBe(28000);

    const { reprecificados } = await withTenant(dona, (ctx) =>
      setQuotePayer(ctx, id, ODONTO_SAUDE),
    );
    expect(reprecificados).toBe(1);

    const comConvenio = await withTenant(dona, (ctx) => getQuote(ctx, id));
    expect(comConvenio.items[0]?.unitPriceCents).toBe(18000);
    expect(comConvenio.totalCents).toBe(18000);

    // E voltar para particular devolve o preco cheio.
    await withTenant(dona, (ctx) => setQuotePayer(ctx, id, null));
    const devolta = await withTenant(dona, (ctx) => getQuote(ctx, id));
    expect(devolta.items[0]?.unitPriceCents).toBe(28000);
  });

  it("item avulso, sem procedimento, nao e reprecificado", async () => {
    const { id } = await withTenant(dona, (ctx) =>
      createQuote(ctx, { patientId: MARIANA, title: "Avulso com convênio" }),
    );

    await withTenant(dona, (ctx) =>
      addQuoteItem(ctx, { quoteId: id, description: "Item combinado", unitPriceCents: 50000 }),
    );

    const { reprecificados } = await withTenant(dona, (ctx) =>
      setQuotePayer(ctx, id, ODONTO_SAUDE),
    );

    expect(reprecificados).toBe(0);

    const quote = await withTenant(dona, (ctx) => getQuote(ctx, id));
    expect(quote.items[0]?.unitPriceCents).toBe(50000);
  });
});

describe("faturado por guia", () => {
  it("o aceite emite guia para o convenio, nao divida para o paciente", async () => {
    const { id } = await withTenant(dona, (ctx) =>
      createQuote(ctx, { patientId: MARIANA, title: "Faturado", payerId: DENTAL_MAIS }),
    );

    await withTenant(dona, (ctx) =>
      addQuoteItem(ctx, {
        quoteId: id,
        procedureId: RESINA,
        description: "Restauração em resina",
        toothCode: "36",
        surfaces: ["O"],
        unitPriceCents: 26000,
      }),
    );

    await withTenant(dona, (ctx) => changeQuoteStatus(ctx, { quoteId: id, to: "sent" }));
    await withTenant(dona, (ctx) => acceptQuote(ctx, { quoteId: id, signedBy: "Mariana Alves" }));

    // A guia cobra do convenio o que nao e co-participacao: 260,00 − 60,00.
    const guia = await admin
      .selectFrom("claim")
      .select(["id", "billed_cents", "status"])
      .where("quote_id", "=", id)
      .executeTakeFirstOrThrow();

    expect(Number(guia.billed_cents)).toBe(20000);
    expect(guia.status).toBe("open");

    // E o paciente deve so a parte dele, nem um centavo a mais.
    const recebiveis = await admin
      .selectFrom("receivable")
      .select("total_cents")
      .where("quote_id", "=", id)
      .execute();

    expect(recebiveis).toHaveLength(1);
    expect(Number(recebiveis[0]?.total_cents)).toBe(6000);
  });

  it("convenio de reembolso fecha normalmente", async () => {
    const { id } = await withTenant(dona, (ctx) =>
      createQuote(ctx, { patientId: MARIANA, title: "Reembolso", payerId: ODONTO_SAUDE }),
    );

    await withTenant(dona, (ctx) =>
      addQuoteItem(ctx, { quoteId: id, description: "Procedimento", unitPriceCents: 40000 }),
    );
    await withTenant(dona, (ctx) => changeQuoteStatus(ctx, { quoteId: id, to: "sent" }));
    await withTenant(dona, (ctx) => acceptQuote(ctx, { quoteId: id, signedBy: "Mariana Alves" }));

    const recebivel = await admin
      .selectFrom("receivable")
      .select(["id", "payer_id"])
      .where("quote_id", "=", id)
      .executeTakeFirstOrThrow();

    // O recebivel guarda de qual convenio veio: e o que permite medir depois
    // quanto do faturamento e de cada um.
    expect(recebivel.payer_id).toBe(ODONTO_SAUDE);
  });

  it("o seletor do orcamento diz qual convenio e faturado", async () => {
    const opcoes = await withTenant(dona, (ctx) => listActivePayers(ctx));

    expect(opcoes.find((o) => o.id === DENTAL_MAIS)?.billingMode).toBe("invoiced");
    expect(opcoes.find((o) => o.id === ODONTO_SAUDE)?.billingMode).toBe("reimbursement");
  });
});
