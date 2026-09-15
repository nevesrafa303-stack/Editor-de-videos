/**
 * Testes de integracao do financeiro.
 *
 * Aqui errar custa dinheiro de verdade, nos dois sentidos: cobrar do paciente
 * o que ele nao deve, ou deixar de cobrar o que ele deve. O que estes testes
 * travam: o aceite vira parcela, a multa e o juro saem do banco e nao da tela,
 * dinheiro em especie exige caixa aberto, e estorno desfaz a comissao.
 */
process.env.DB_POOL_MAX = "1";

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { sql } from "kysely";
import { closeDb } from "@/server/db";
import { withTenant, type TenantSession } from "@/server/context";
import {
  addCashMovement,
  closeCashSession,
  getFinanceOverview,
  getOpenCashSession,
  getPaymentMethods,
  listInstallments,
  openCashSession,
  receivePayment,
  reversePayment,
} from "@/modules/finance";
import { acceptQuote, addQuoteItem, changeQuoteStatus, createQuote, setQuoteTerms } from "@/modules/quote";
import { BusinessRuleError, Forbidden, NotFound, ValidationError } from "@/shared/errors";
import { parcelar } from "@/shared/money";
import { adminDb, entrar, SEED, USUARIOS } from "./helpers";

let dona: TenantSession;
let recepcao: TenantSession;
let outraRede: TenantSession;
const admin = adminDb();

const MARIANA = SEED.pacienteMariana;

beforeAll(async () => {
  dona = (await entrar(USUARIOS.dona)).session;
  recepcao = (await entrar(USUARIOS.recepcao)).session;
  outraRede = (await entrar(USUARIOS.outraRede)).session;
});

afterAll(async () => {
  await admin.destroy();
  await closeDb();
});

describe("do aceite para o a receber", () => {
  it("aceitar o orcamento cria as parcelas na mesma transacao", async () => {
    const id = await umOrcamentoAceito({ totalCents: 238000, parcelas: 6 });

    const parcelas = await admin
      .selectFrom("installment as i")
      .innerJoin("receivable as r", "r.id", "i.receivable_id")
      .select(["i.number", "i.amount_cents", "i.due_on", "i.status"])
      .where("r.quote_id", "=", id)
      .orderBy("i.number", "asc")
      .execute();

    expect(parcelas).toHaveLength(6);
    expect(parcelas.reduce((soma, p) => soma + p.amount_cents, 0)).toBe(238000);
    expect(parcelas.every((p) => p.status === "open")).toBe(true);
  });

  it("a divisao do banco e a da tela dao o mesmo resultado", async () => {
    // A tela usa `parcelar()` para mostrar; o banco usa `split_amount` para
    // gerar. Se divergirem, o paciente ve um numero e recebe outro.
    for (const [total, n] of [
      [238000, 6],
      [100000, 7],
      [1, 3],
      [999999, 12],
    ] as const) {
      const noBanco = await withTenant(dona, async (ctx) => {
        const r = await sql<{ v: number[] }>`select split_amount(${total}, ${n}) as v`.execute(
          ctx.db,
        );
        return (r.rows[0]?.v ?? []).map(Number);
      });

      expect(noBanco).toEqual(parcelar(total, n));
    }
  });

  it("orcamento sem entrada nao cria parcela de zero", async () => {
    const id = await umOrcamentoAceito({ totalCents: 120000, parcelas: 3 });

    const parcelas = await admin
      .selectFrom("installment as i")
      .innerJoin("receivable as r", "r.id", "i.receivable_id")
      .select("i.amount_cents")
      .where("r.quote_id", "=", id)
      .execute();

    expect(parcelas).toHaveLength(3);
    expect(parcelas.every((p) => p.amount_cents > 0)).toBe(true);
  });
});

describe("multa e juros", () => {
  it("parcela vencida chega na tela com multa e juros calculados", async () => {
    const parcela = await umaParcelaVencida(30);

    const { items } = await withTenant(dona, (ctx) =>
      listInstallments(ctx, { recorte: "vencidas" }),
    );

    const linha = items.find((i) => i.id === parcela.id);
    expect(linha).toBeDefined();
    expect(linha?.lateDays).toBe(30);
    expect(linha?.fineCents).toBe(Math.floor((linha!.balanceCents * 2) / 100));
    expect(linha?.interestCents).toBe(Math.floor((linha!.balanceCents * 1 * 30) / 3000));
    expect(linha?.totalDueCents).toBe(
      linha!.balanceCents + linha!.fineCents + linha!.interestCents,
    );
  });

  it("parcela em dia nao cobra nada a mais", async () => {
    const parcela = await umaParcelaVencida(0);

    const { items } = await withTenant(dona, (ctx) => listInstallments(ctx, { recorte: "abertas" }));
    const linha = items.find((i) => i.id === parcela.id);

    expect(linha?.fineCents).toBe(0);
    expect(linha?.interestCents).toBe(0);
  });

  it("nao aceita receber mais do que o devido", async () => {
    const parcela = await umaParcelaVencida(10);
    const metodo = await umMetodo("pix");

    await expect(
      withTenant(recepcao, (ctx) =>
        receivePayment(ctx, {
          installmentId: parcela.id,
          paymentMethodId: metodo,
          amountCents: parcela.amountCents * 3,
        }),
      ),
    ).rejects.toThrow(ValidationError);
  });

  it("o que passa do saldo da parcela e registrado como mora, nao como principal", async () => {
    const parcela = await umaParcelaVencida(30);
    const metodo = await umMetodo("pix");

    const { items } = await withTenant(dona, (ctx) =>
      listInstallments(ctx, { recorte: "vencidas" }),
    );
    const linha = items.find((i) => i.id === parcela.id)!;

    const recibo = await withTenant(recepcao, (ctx) =>
      receivePayment(ctx, {
        installmentId: parcela.id,
        paymentMethodId: metodo,
        amountCents: linha.totalDueCents,
      }),
    );

    expect(recibo.principalCents).toBe(linha.balanceCents);
    expect(recibo.fineCents + recibo.interestCents).toBe(
      linha.fineCents + linha.interestCents,
    );
    expect(recibo.installmentStatus).toBe("paid");

    const pagamento = await admin
      .selectFrom("payment")
      .select(["amount_cents", "fine_cents", "interest_cents", "gross_cents"])
      .where("id", "=", recibo.paymentId)
      .executeTakeFirstOrThrow();

    // A parcela so ve o principal; o total entregue fica em gross_cents.
    expect(pagamento.amount_cents).toBe(linha.balanceCents);
    expect(Number(pagamento.gross_cents)).toBe(linha.totalDueCents);
    expect(pagamento.fine_cents + pagamento.interest_cents).toBeGreaterThan(0);
  });

  it("comissao e calculada sobre o principal, nao sobre a mora", async () => {
    const parcela = await umaParcelaVencida(60);
    const metodo = await umMetodo("pix");

    await admin
      .insertInto("commission_rule")
      .values({
        tenant_id: SEED.redeSorriso,
        membership_id: SEED.drAna,
        basis: "received",
        trigger_event: "on_payment",
        percent: "10",
      })
      .execute();

    const { items } = await withTenant(dona, (ctx) =>
      listInstallments(ctx, { recorte: "vencidas" }),
    );
    const linha = items.find((i) => i.id === parcela.id)!;

    const recibo = await withTenant(recepcao, (ctx) =>
      receivePayment(ctx, {
        installmentId: parcela.id,
        paymentMethodId: metodo,
        amountCents: linha.totalDueCents,
      }),
    );

    const comissao = await admin
      .selectFrom("commission_entry")
      .select(["base_cents", "amount_cents"])
      .where("payment_id", "=", recibo.paymentId)
      .executeTakeFirst();

    // Mora e da clinica, que financiou o atraso.
    expect(Number(comissao?.base_cents)).toBe(linha.balanceCents);
    expect(Number(comissao?.amount_cents)).toBe(Math.floor((linha.balanceCents * 10) / 100));
  });

  it("perdoar multa e juros fica registrado com o nome de quem perdoou", async () => {
    const parcela = await umaParcelaVencida(45);
    const metodo = await umMetodo("pix");

    const recibo = await withTenant(recepcao, (ctx) =>
      receivePayment(ctx, {
        installmentId: parcela.id,
        paymentMethodId: metodo,
        amountCents: parcela.amountCents,
        waiveCharges: true,
      }),
    );

    expect(recibo.fineCents).toBe(0);
    expect(recibo.installmentStatus).toBe("paid");

    const pagamento = await admin
      .selectFrom("payment")
      .select("notes")
      .where("id", "=", recibo.paymentId)
      .executeTakeFirstOrThrow();

    expect(pagamento.notes).toContain("perdoados por Juliana Rocha");
  });
});

describe("caixa", () => {
  it("dinheiro em especie exige caixa aberto", async () => {
    const parcela = await umaParcelaVencida(0);
    const dinheiro = await umMetodo("cash");

    await expect(
      withTenant(recepcao, (ctx) =>
        receivePayment(ctx, {
          installmentId: parcela.id,
          paymentMethodId: dinheiro,
          amountCents: 1000,
        }),
      ),
    ).rejects.toThrow(/caixa aberto/i);
  });

  it("recebimento em dinheiro entra no caixa; PIX nao", async () => {
    await fecharCaixasAbertos();
    await withTenant(recepcao, (ctx) => openCashSession(ctx, { openingCents: 10000 }));

    const emDinheiro = await umaParcelaVencida(0);
    const noPix = await umaParcelaVencida(0);

    const dinheiro = await umMetodo("cash");
    const pix = await umMetodo("pix");

    await withTenant(recepcao, (ctx) =>
      receivePayment(ctx, {
        installmentId: emDinheiro.id,
        paymentMethodId: dinheiro,
        amountCents: 5000,
      }),
    );

    await withTenant(recepcao, (ctx) =>
      receivePayment(ctx, { installmentId: noPix.id, paymentMethodId: pix, amountCents: 5000 }),
    );

    const caixa = await withTenant(recepcao, (ctx) => getOpenCashSession(ctx));

    expect(caixa?.entradasCents).toBe(5000);
    expect(caixa?.esperadoCents).toBe(15000);
  });

  it("sangria sai do esperado", async () => {
    const caixa = await withTenant(recepcao, (ctx) => getOpenCashSession(ctx));

    await withTenant(recepcao, (ctx) =>
      addCashMovement(ctx, {
        sessionId: caixa!.id,
        kind: "withdrawal",
        amountCents: 3000,
        description: "Sangria para o cofre",
      }),
    );

    const depois = await withTenant(recepcao, (ctx) => getOpenCashSession(ctx));
    expect(depois?.esperadoCents).toBe(caixa!.esperadoCents - 3000);
  });

  it("fechar registra a diferenca entre o contado e o esperado", async () => {
    const caixa = await withTenant(recepcao, (ctx) => getOpenCashSession(ctx));

    const fechamento = await withTenant(recepcao, (ctx) =>
      closeCashSession(ctx, {
        sessionId: caixa!.id,
        countedCents: caixa!.esperadoCents - 500,
      }),
    );

    expect(fechamento.expectedCents).toBe(caixa!.esperadoCents);
    expect(fechamento.differenceCents).toBe(-500);

    const linha = await admin
      .selectFrom("cash_session")
      .select(["status", "difference_cents"])
      .where("id", "=", caixa!.id)
      .executeTakeFirstOrThrow();

    expect(linha.status).toBe("closed");
    expect(Number(linha.difference_cents)).toBe(-500);
  });

  it("caixa fechado nao aceita novo lancamento", async () => {
    const fechado = await admin
      .selectFrom("cash_session")
      .select("id")
      .where("status", "=", "closed")
      .orderBy("closed_at", "desc")
      .executeTakeFirstOrThrow();

    await expect(
      withTenant(recepcao, (ctx) =>
        addCashMovement(ctx, {
          sessionId: fechado.id as string,
          kind: "supply",
          amountCents: 1000,
          description: "Tentativa em caixa fechado",
        }),
      ),
    ).rejects.toThrow(/fechado/i);
  });

  it("dois caixas abertos na mesma unidade nao existem", async () => {
    await fecharCaixasAbertos();
    await withTenant(recepcao, (ctx) => openCashSession(ctx, { openingCents: 0 }));

    await expect(
      withTenant(recepcao, (ctx) => openCashSession(ctx, { openingCents: 0 })),
    ).rejects.toThrow(BusinessRuleError);

    await fecharCaixasAbertos();
  });
});

describe("estorno", () => {
  it("estorno nao apaga o pagamento e devolve a parcela", async () => {
    const parcela = await umaParcelaVencida(0);
    const metodo = await umMetodo("pix");

    const recibo = await withTenant(recepcao, (ctx) =>
      receivePayment(ctx, {
        installmentId: parcela.id,
        paymentMethodId: metodo,
        amountCents: parcela.amountCents,
      }),
    );

    await withTenant(dona, (ctx) =>
      reversePayment(ctx, { paymentId: recibo.paymentId, reason: "Cobrado em duplicidade." }),
    );

    const [pagamento, depois] = await Promise.all([
      admin
        .selectFrom("payment")
        .select(["status", "reversal_reason"])
        .where("id", "=", recibo.paymentId)
        .executeTakeFirstOrThrow(),
      admin
        .selectFrom("installment")
        .select("status")
        .where("id", "=", parcela.id)
        .executeTakeFirstOrThrow(),
    ]);

    expect(pagamento.status).toBe("reversed");
    expect(pagamento.reversal_reason).toBe("Cobrado em duplicidade.");
    expect(depois.status).toBe("open");
  });

  it("quem nao pode estornar nao estorna", async () => {
    const parcela = await umaParcelaVencida(0);

    const pix = await umMetodo("pix");

    const recibo = await withTenant(recepcao, (ctx) =>
      receivePayment(ctx, { installmentId: parcela.id, paymentMethodId: pix, amountCents: 1000 }),
    );

    await expect(
      withTenant(recepcao, (ctx) =>
        reversePayment(ctx, { paymentId: recibo.paymentId, reason: "Tentativa sem permissao." }),
      ),
    ).rejects.toThrow(Forbidden);
  });
});

describe("painel", () => {
  it("separa o que venceu do que vai vencer", async () => {
    const resumo = await withTenant(dona, (ctx) => getFinanceOverview(ctx));

    expect(resumo.aReceberCents).toBeGreaterThan(0);
    expect(resumo.vencidoCents).toBeGreaterThan(0);
    expect(resumo.vencidoCount).toBeGreaterThan(0);
    expect(resumo.aReceberCents).toBeGreaterThanOrEqual(resumo.vencidoCents);
  });

  it("outra rede nao ve nada disto", async () => {
    const resumo = await withTenant(outraRede, (ctx) => getFinanceOverview(ctx));
    const { items } = await withTenant(outraRede, (ctx) =>
      listInstallments(ctx, { recorte: "abertas" }),
    );

    expect(resumo.aReceberCents).toBe(0);
    expect(items).toHaveLength(0);
  });

  it("parcela de outra rede nao aparece nem com o id em maos", async () => {
    const parcela = await umaParcelaVencida(0);

    const pix = await umMetodo("pix");

    await expect(
      withTenant(outraRede, (ctx) =>
        receivePayment(ctx, { installmentId: parcela.id, paymentMethodId: pix, amountCents: 100 }),
      ),
    ).rejects.toThrow(NotFound);
  });
});

// ---------------------------------------------------------------- apoio ----

async function umOrcamentoAceito({
  totalCents,
  parcelas,
}: {
  totalCents: number;
  parcelas: number;
}): Promise<string> {
  const { id } = await withTenant(dona, (ctx) =>
    createQuote(ctx, { patientId: MARIANA, title: "Proposta do teste financeiro" }),
  );

  await withTenant(dona, (ctx) =>
    addQuoteItem(ctx, { quoteId: id, description: "Procedimento", unitPriceCents: totalCents }),
  );

  await withTenant(dona, (ctx) =>
    setQuoteTerms(ctx, { quoteId: id, installmentCount: parcelas, downPaymentCents: 0 }),
  );

  await withTenant(dona, (ctx) => changeQuoteStatus(ctx, { quoteId: id, to: "sent" }));
  await withTenant(dona, (ctx) => acceptQuote(ctx, { quoteId: id, signedBy: "Mariana Alves" }));

  return id;
}

/** Uma parcela nova, vencida ha `dias`, para nao amarrar teste com teste. */
async function umaParcelaVencida(dias: number): Promise<{ id: string; amountCents: number }> {
  const quote = await umOrcamentoAceito({ totalCents: 60000, parcelas: 1 });

  const parcela = await admin
    .selectFrom("installment as i")
    .innerJoin("receivable as r", "r.id", "i.receivable_id")
    .select(["i.id", "i.amount_cents"])
    .where("r.quote_id", "=", quote)
    .executeTakeFirstOrThrow();

  if (dias > 0) {
    await admin
      .updateTable("installment")
      .set({ due_on: sql`current_date - ${dias}::int` })
      .where("id", "=", parcela.id)
      .execute();
  }

  return { id: parcela.id as string, amountCents: parcela.amount_cents };
}

async function umMetodo(kind: "pix" | "cash" | "credit"): Promise<string> {
  const metodos = await withTenant(dona, (ctx) => getPaymentMethods(ctx));
  const achado = metodos.find((m) => m.kind === kind);
  if (!achado) throw new Error(`Forma de pagamento ${kind} nao existe no seed.`);
  return achado.id as string;
}

async function fecharCaixasAbertos(): Promise<void> {
  const abertos = await admin
    .selectFrom("cash_session")
    .select("id")
    .where("status", "=", "open")
    .execute();

  for (const sessao of abertos) {
    await admin
      .updateTable("cash_session")
      .set({
        status: "closed",
        closed_at: new Date(),
        counted_cents: 0,
        expected_cents: 0,
      })
      .where("id", "=", sessao.id)
      .execute();
  }
}
