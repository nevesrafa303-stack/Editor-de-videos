/**
 * Faturamento por guia, pela camada de acesso.
 *
 * O que travam: aceitar orcamento de convenio faturado separa quem deve o que,
 * montar e enviar lote respeita permissao, conferir o repasse abaixo do
 * faturado cria glosa com prazo, e recorrer devolve o dinheiro para a linha.
 *
 * A suite SQL ja prova as invariantes no banco. Aqui o que se prova e o
 * CAMINHO: que a permissao certa barra, que o erro do banco chega como frase de
 * produto, e que as consultas somam o que a tela vai mostrar.
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
  setQuoteDiscount,
} from "@/modules/quote";
import {
  addClaimsToBatch,
  getBatch,
  getClaim,
  getClaimSummary,
  listBatches,
  listDenials,
  listPendingClaims,
  removeClaimFromBatch,
  resolveDenial,
  setClaimAuthorization,
  setRemittanceDate,
  settleBatch,
  settleItem,
  submitBatch,
} from "@/modules/claim";
import { Forbidden } from "@/shared/errors";
import { adminDb, entrar, SEED, USUARIOS } from "./helpers";

let dona: TenantSession;
let recepcao: TenantSession;
const admin = adminDb();

const MARIANA = SEED.pacienteMariana;
const RESINA = SEED.procedimentoResina;
const IMPLANTE = SEED.procedimentoImplante;
const FATURADO = SEED.convenioFaturado;

beforeAll(async () => {
  dona = (await entrar(USUARIOS.dona)).session;
  recepcao = (await entrar(USUARIOS.recepcao)).session;
});

afterAll(async () => {
  await admin.destroy();
  await closeDb();
});

/** Orcamento faturado, aceito, com resina e implante. Devolve a guia. */
async function guiaAceita(titulo: string, desconto = 0) {
  const { id } = await withTenant(dona, (ctx) =>
    createQuote(ctx, { patientId: MARIANA, title: titulo, payerId: FATURADO }),
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

  await withTenant(dona, (ctx) =>
    addQuoteItem(ctx, {
      quoteId: id,
      procedureId: IMPLANTE,
      description: "Implante unitário",
      toothCode: "46",
      unitPriceCents: 300000,
    }),
  );

  if (desconto > 0) {
    await withTenant(dona, (ctx) =>
      setQuoteDiscount(ctx, { quoteId: id, discountCents: desconto, approve: true }),
    );
  }

  await withTenant(dona, (ctx) => changeQuoteStatus(ctx, { quoteId: id, to: "sent" }));
  await withTenant(dona, (ctx) => acceptQuote(ctx, { quoteId: id, signedBy: "Mariana Alves" }));

  const guia = await admin
    .selectFrom("claim")
    .select("id")
    .where("quote_id", "=", id)
    .executeTakeFirstOrThrow();

  return { quoteId: id, claimId: guia.id as string };
}

describe("o aceite separa quem deve o que", () => {
  it("a guia cobra o convênio e o paciente deve só a co-participação", async () => {
    const { quoteId, claimId } = await guiaAceita("Guia e co-participação");

    const { claim, items } = await withTenant(dona, (ctx) => getClaim(ctx, claimId));

    // 260,00 − 60,00 de co-participação + 3.000,00 − 900,00 = 2.300,00.
    expect(claim.billedCents).toBe(230000);
    expect(items).toHaveLength(2);
    expect(claim.status).toBe("open");

    const recebivel = await admin
      .selectFrom("receivable")
      .select(["total_cents", "description"])
      .where("quote_id", "=", quoteId)
      .executeTakeFirstOrThrow();

    expect(Number(recebivel.total_cents)).toBe(96000);
    expect(recebivel.description).toMatch(/Co-participacao/);
  });

  it("o desconto sai da parte do paciente, e a guia não muda", async () => {
    // O teto da tabela do convênio é 5%, então R$ 100,00 cabe. Quem barra um
    // desconto grande demais é a alçada, antes de a co-participação entrar na
    // conta — a regra da co-participação é a rede de baixo, e quem a prova é a
    // suíte SQL, que escreve direto na tabela.
    const { quoteId, claimId } = await guiaAceita("Desconto no convênio", 10000);

    const { claim } = await withTenant(dona, (ctx) => getClaim(ctx, claimId));
    expect(claim.billedCents).toBe(230000);

    const recebivel = await admin
      .selectFrom("receivable")
      .select("total_cents")
      .where("quote_id", "=", quoteId)
      .executeTakeFirstOrThrow();

    // 96.000 de co-participação − 10.000 de desconto.
    expect(Number(recebivel.total_cents)).toBe(86000);
  });

  it("convênio de reembolso não emite guia", async () => {
    const { id } = await withTenant(dona, (ctx) =>
      createQuote(ctx, {
        patientId: MARIANA,
        title: "Reembolso sem guia",
        payerId: SEED.convenioReembolso,
      }),
    );

    await withTenant(dona, (ctx) =>
      addQuoteItem(ctx, { quoteId: id, description: "Procedimento", unitPriceCents: 40000 }),
    );
    await withTenant(dona, (ctx) => changeQuoteStatus(ctx, { quoteId: id, to: "sent" }));
    await withTenant(dona, (ctx) => acceptQuote(ctx, { quoteId: id, signedBy: "Mariana" }));

    const guias = await admin
      .selectFrom("claim")
      .select("id")
      .where("quote_id", "=", id)
      .execute();

    expect(guias).toHaveLength(0);
  });
});

describe("montar e enviar o lote", () => {
  it("a guia entra no lote da competência e volta se tirarem", async () => {
    const { claimId } = await guiaAceita("Para o lote");

    const pendentes = await withTenant(dona, (ctx) => listPendingClaims(ctx));
    expect(pendentes.some((c) => c.id === claimId)).toBe(true);

    const { guias } = await withTenant(dona, (ctx) =>
      addClaimsToBatch(ctx, { claimIds: [claimId] }),
    );
    expect(guias).toBe(1);

    const depois = await withTenant(dona, (ctx) => getClaim(ctx, claimId));
    expect(depois.claim.status).toBe("batched");
    expect(depois.batch).not.toBeNull();

    await withTenant(dona, (ctx) => removeClaimFromBatch(ctx, claimId));
    const devolta = await withTenant(dona, (ctx) => getClaim(ctx, claimId));
    expect(devolta.claim.status).toBe("open");
    expect(devolta.batch).toBeNull();
  });

  it("recepção monta o lote mas não envia", async () => {
    const { claimId } = await guiaAceita("Recepção monta");

    await withTenant(recepcao, (ctx) => addClaimsToBatch(ctx, { claimIds: [claimId] }));

    const { batch } = await withTenant(dona, (ctx) => getClaim(ctx, claimId)).then((c) => ({
      batch: c.batch,
    }));

    await expect(
      withTenant(recepcao, (ctx) => submitBatch(ctx, batch!.id)),
    ).rejects.toThrow(Forbidden);
  });

  it("enviar o lote envia as guias junto", async () => {
    const { claimId } = await guiaAceita("Enviar junto");
    await withTenant(dona, (ctx) => addClaimsToBatch(ctx, { claimIds: [claimId] }));

    const detalhe = await withTenant(dona, (ctx) => getClaim(ctx, claimId));
    const { guias } = await withTenant(dona, (ctx) => submitBatch(ctx, detalhe.batch!.id));

    expect(guias).toBeGreaterThanOrEqual(1);

    const depois = await withTenant(dona, (ctx) => getClaim(ctx, claimId));
    expect(depois.claim.status).toBe("submitted");
  });
});

describe("conferência do repasse", () => {
  it("pagar menos do que foi faturado cria a glosa, com prazo", async () => {
    const { claimId } = await guiaAceita("Para conferir");
    await withTenant(dona, (ctx) => addClaimsToBatch(ctx, { claimIds: [claimId] }));

    const antes = await withTenant(dona, (ctx) => getClaim(ctx, claimId));
    const loteId = antes.batch!.id;
    await withTenant(dona, (ctx) => submitBatch(ctx, loteId));

    // O demonstrativo é de 5 dias atrás: o prazo conta de lá, não de hoje.
    const cincoDiasAtras = new Date(Date.now() - 5 * 86_400_000).toISOString().slice(0, 10);
    await withTenant(dona, (ctx) => setRemittanceDate(ctx, loteId, cincoDiasAtras));

    const detalhe = await withTenant(dona, (ctx) => getClaim(ctx, claimId));
    const resina = detalhe.items.find((i) => i.description.includes("resina"))!;
    const implante = detalhe.items.find((i) => i.description.includes("Implante"))!;

    const inteira = await withTenant(dona, (ctx) =>
      settleItem(ctx, { itemId: resina.id, paidCents: resina.billedCents }),
    );
    expect(inteira.glosou).toBe(false);

    const glosa = await withTenant(dona, (ctx) =>
      settleItem(ctx, {
        itemId: implante.id,
        paidCents: 160000,
        reasonCode: "1707",
        reason: "Procedimento não coberto pelo plano contratado",
      }),
    );
    expect(glosa.glosou).toBe(true);

    const glosas = await withTenant(dona, (ctx) => listDenials(ctx, { claimId }));
    expect(glosas).toHaveLength(1);
    expect(glosas[0]?.amountCents).toBe(50000);
    // 5 dias atrás + 30 de prazo do convênio = faltam 25.
    expect(glosas[0]?.diasParaPrazo).toBe(25);
  });

  it("glosa sem motivo é recusada: sem motivo não há o que recorrer", async () => {
    const { claimId } = await guiaAceita("Glosa sem motivo");
    await withTenant(dona, (ctx) => addClaimsToBatch(ctx, { claimIds: [claimId] }));
    const d = await withTenant(dona, (ctx) => getClaim(ctx, claimId));
    await withTenant(dona, (ctx) => submitBatch(ctx, d.batch!.id));

    const detalhe = await withTenant(dona, (ctx) => getClaim(ctx, claimId));

    await expect(
      withTenant(dona, (ctx) =>
        settleItem(ctx, { itemId: detalhe.items[0]!.id, paidCents: 100 }),
      ),
    ).rejects.toThrow(/exige motivo/i);
  });

  it("o lote não fecha com linha sem conferir", async () => {
    const { claimId } = await guiaAceita("Lote incompleto");
    await withTenant(dona, (ctx) => addClaimsToBatch(ctx, { claimIds: [claimId] }));
    const d = await withTenant(dona, (ctx) => getClaim(ctx, claimId));
    const loteId = d.batch!.id;
    await withTenant(dona, (ctx) => submitBatch(ctx, loteId));

    const detalhe = await withTenant(dona, (ctx) => getClaim(ctx, claimId));
    await withTenant(dona, (ctx) =>
      settleItem(ctx, {
        itemId: detalhe.items[0]!.id,
        paidCents: detalhe.items[0]!.billedCents,
      }),
    );

    await expect(withTenant(dona, (ctx) => settleBatch(ctx, loteId))).rejects.toThrow(
      /sem conferencia/i,
    );
  });

  it("recepção não confere repasse", async () => {
    const { claimId } = await guiaAceita("Recepção não confere");
    await withTenant(dona, (ctx) => addClaimsToBatch(ctx, { claimIds: [claimId] }));
    const d = await withTenant(dona, (ctx) => getClaim(ctx, claimId));
    await withTenant(dona, (ctx) => submitBatch(ctx, d.batch!.id));

    const detalhe = await withTenant(dona, (ctx) => getClaim(ctx, claimId));

    await expect(
      withTenant(recepcao, (ctx) =>
        settleItem(ctx, {
          itemId: detalhe.items[0]!.id,
          paidCents: detalhe.items[0]!.billedCents,
        }),
      ),
    ).rejects.toThrow(Forbidden);
  });
});

describe("recurso de glosa", () => {
  it("recuperar devolve o dinheiro para a linha, não só para o total", async () => {
    const { claimId } = await guiaAceita("Para recorrer");
    await withTenant(dona, (ctx) => addClaimsToBatch(ctx, { claimIds: [claimId] }));
    const d = await withTenant(dona, (ctx) => getClaim(ctx, claimId));
    const loteId = d.batch!.id;
    await withTenant(dona, (ctx) => submitBatch(ctx, loteId));
    await withTenant(dona, (ctx) =>
      setRemittanceDate(ctx, loteId, new Date().toISOString().slice(0, 10)),
    );

    const detalhe = await withTenant(dona, (ctx) => getClaim(ctx, claimId));
    const implante = detalhe.items.find((i) => i.description.includes("Implante"))!;

    await withTenant(dona, (ctx) =>
      settleItem(ctx, {
        itemId: implante.id,
        paidCents: 160000,
        reason: "Procedimento não coberto",
      }),
    );

    const [glosa] = await withTenant(dona, (ctx) => listDenials(ctx, { claimId }));

    await withTenant(dona, (ctx) =>
      resolveDenial(ctx, {
        denialId: glosa!.id,
        status: "appealed",
        notes: "Enviado o comprovante de autorização.",
      }),
    );

    await withTenant(dona, (ctx) =>
      resolveDenial(ctx, {
        denialId: glosa!.id,
        status: "recovered",
        recoveredCents: 30000,
        notes: "Pago no repasse seguinte.",
      }),
    );

    const depois = await withTenant(dona, (ctx) => getClaim(ctx, claimId));
    const linha = depois.items.find((i) => i.id === implante.id)!;

    expect(linha.paidCents).toBe(190000);
    // E o que sobra continua contando como glosa.
    expect(linha.deniedCents).toBe(20000);
  });

  it("recuperar sem dizer quanto é recusado antes de chegar ao banco", async () => {
    const { claimId } = await guiaAceita("Recurso sem valor");
    await withTenant(dona, (ctx) => addClaimsToBatch(ctx, { claimIds: [claimId] }));
    const d = await withTenant(dona, (ctx) => getClaim(ctx, claimId));
    await withTenant(dona, (ctx) => submitBatch(ctx, d.batch!.id));

    const detalhe = await withTenant(dona, (ctx) => getClaim(ctx, claimId));
    await withTenant(dona, (ctx) =>
      settleItem(ctx, {
        itemId: detalhe.items[0]!.id,
        paidCents: 0,
        reason: "Glosa integral",
      }),
    );

    const [glosa] = await withTenant(dona, (ctx) => listDenials(ctx, { claimId }));

    await expect(
      withTenant(dona, (ctx) =>
        resolveDenial(ctx, { denialId: glosa!.id, status: "recovered", recoveredCents: 0 }),
      ),
    ).rejects.toMatchObject({
      // A frase vai para o CAMPO, que é onde ela ajuda; o banner fica com a
      // frase geral. Medir no banner mediria a convenção errada.
      details: { recoveredCents: [expect.stringMatching(/quanto o convênio pagou/i)] },
    });
  });
});

describe("o que a tela mostra", () => {
  it("o resumo separa as três filas de dinheiro", async () => {
    await guiaAceita("Para o resumo");

    const resumo = await withTenant(dona, (ctx) => getClaimSummary(ctx));

    expect(resumo.aFaturarCount).toBeGreaterThan(0);
    expect(resumo.aFaturarCents).toBeGreaterThan(0);
    expect(resumo.glosadoCents).toBeGreaterThan(0);
  });

  it("o que já foi glosado não conta também como esperando repasse", async () => {
    const { claimId } = await guiaAceita("Sem contar duas vezes");
    await withTenant(dona, (ctx) => addClaimsToBatch(ctx, { claimIds: [claimId] }));
    const d = await withTenant(dona, (ctx) => getClaim(ctx, claimId));
    const loteId = d.batch!.id;
    await withTenant(dona, (ctx) => submitBatch(ctx, loteId));
    await withTenant(dona, (ctx) =>
      setRemittanceDate(ctx, loteId, new Date().toISOString().slice(0, 10)),
    );

    const antes = await withTenant(dona, (ctx) => getClaimSummary(ctx));
    const detalhe = await withTenant(dona, (ctx) => getClaim(ctx, claimId));

    // Confere TUDO desta guia: uma linha paga inteira, a outra glosada por
    // completo. Depois disso nada dela está esperando repasse.
    const [primeira, segunda] = detalhe.items;
    await withTenant(dona, (ctx) =>
      settleItem(ctx, { itemId: primeira!.id, paidCents: primeira!.billedCents }),
    );
    await withTenant(dona, (ctx) =>
      settleItem(ctx, { itemId: segunda!.id, paidCents: 0, reason: "Glosa integral" }),
    );

    const depois = await withTenant(dona, (ctx) => getClaimSummary(ctx));

    // O glosado subiu exatamente o que o "esperando repasse" desceu: é o mesmo
    // dinheiro mudando de fila, não dinheiro novo.
    expect(depois.glosadoCents - antes.glosadoCents).toBe(segunda!.billedCents);
    expect(antes.enviadoCents - depois.enviadoCents).toBe(
      primeira!.billedCents + segunda!.billedCents,
    );
  });

  it("o lote sabe quantas linhas ainda faltam conferir", async () => {
    const { claimId } = await guiaAceita("Pendentes do lote");
    await withTenant(dona, (ctx) => addClaimsToBatch(ctx, { claimIds: [claimId] }));
    const d = await withTenant(dona, (ctx) => getClaim(ctx, claimId));
    const loteId = d.batch!.id;
    await withTenant(dona, (ctx) => submitBatch(ctx, loteId));

    const { batch, claims } = await withTenant(dona, (ctx) => getBatch(ctx, loteId));

    expect(batch.pendentes).toBeGreaterThan(0);
    expect(claims.some((c) => c.id === claimId)).toBe(true);
    expect(claims.find((c) => c.id === claimId)?.items.length).toBe(2);
  });

  it("a senha do convênio fica guardada na guia", async () => {
    const { claimId } = await guiaAceita("Com autorização");

    await withTenant(dona, (ctx) =>
      setClaimAuthorization(ctx, {
        claimId,
        code: "AUT-99120",
        validUntil: "2027-01-31",
      }),
    );

    const { claim } = await withTenant(dona, (ctx) => getClaim(ctx, claimId));
    expect(claim.authorizationCode).toBe("AUT-99120");
  });

  it("os lotes aparecem com convênio, competência e totais", async () => {
    const lotes = await withTenant(dona, (ctx) => listBatches(ctx));

    expect(lotes.length).toBeGreaterThan(0);
    expect(lotes[0]?.payerName).toBeTruthy();
    expect(lotes[0]?.competence).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
