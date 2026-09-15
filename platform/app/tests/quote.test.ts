/**
 * Testes de integracao do orcamento.
 *
 * O orcamento e o documento que liga o clinico ao dinheiro. O que estes testes
 * travam: o preco fica congelado na emissao, o mesmo procedimento nao entra em
 * dois orcamentos, e desconto nao e negociacao livre — o teto de quem concede
 * vale junto com o teto do procedimento.
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
  listQuotes,
  removeQuoteItem,
  setQuoteDiscount,
} from "@/modules/quote";
import { getPlanItemsForQuote } from "@/modules/quote/queries";
import { Forbidden, NotFound, ValidationError } from "@/shared/errors";
import { adminDb, entrar, SEED, USUARIOS } from "./helpers";

let dona: TenantSession;
let recepcao: TenantSession;
let outraRede: TenantSession;
const admin = adminDb();

const ROBERTO = SEED.pacienteRoberto;
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

describe("nascer do plano de tratamento", () => {
  it("traz o item planejado com o preco da tabela vigente, congelado", async () => {
    const planejados = await withTenant(dona, (ctx) => getPlanItemsForQuote(ctx, ROBERTO));
    expect(planejados.length).toBeGreaterThan(0);

    const implante = planejados.find((i) => i.description.includes("Implante"));
    expect(implante).toBeDefined();

    const { id } = await withTenant(dona, (ctx) =>
      createQuote(ctx, {
        patientId: ROBERTO,
        title: "Reabilitação inferior direita",
        planItemIds: [implante!.id as string],
      }),
    );

    const quote = await withTenant(dona, (ctx) => getQuote(ctx, id));

    expect(quote.items).toHaveLength(1);
    expect(quote.items[0]?.unitPriceCents).toBe(320000);
    expect(quote.subtotalCents).toBe(320000);
    expect(quote.totalCents).toBe(320000);

    // O preco congelado veio da tabela, com o item de tabela amarrado — e o que
    // permite o teto de desconto existir.
    const linha = await admin
      .selectFrom("quote_item")
      .select(["price_list_item_id", "unit_cost_cents"])
      .where("quote_id", "=", id)
      .executeTakeFirstOrThrow();

    expect(linha.price_list_item_id).not.toBeNull();
    expect(linha.unit_cost_cents).toBeGreaterThan(0);
  });

  it("o mesmo item do plano nao entra em dois orcamentos", async () => {
    const planejados = await withTenant(dona, (ctx) => getPlanItemsForQuote(ctx, ROBERTO));
    const resina = planejados.find((i) => i.description.includes("Restaura"));
    expect(resina).toBeDefined();

    await withTenant(dona, (ctx) =>
      createQuote(ctx, { patientId: ROBERTO, planItemIds: [resina!.id as string] }),
    );

    // Depois de orcado, o item some da lista de disponiveis.
    const depois = await withTenant(dona, (ctx) => getPlanItemsForQuote(ctx, ROBERTO));
    expect(depois.map((i) => i.id)).not.toContain(resina!.id);

    // E um segundo orcamento pedindo o mesmo item nasce vazio, em vez de
    // duplicar a cobranca em silencio.
    const { id } = await withTenant(dona, (ctx) =>
      createQuote(ctx, { patientId: ROBERTO, planItemIds: [resina!.id as string] }),
    );
    const quote = await withTenant(dona, (ctx) => getQuote(ctx, id));
    expect(quote.items).toHaveLength(0);
  });

  it("remover o item devolve o procedimento ao plano", async () => {
    const planejados = await withTenant(dona, (ctx) => getPlanItemsForQuote(ctx, MARIANA));
    const { id } = await withTenant(dona, (ctx) =>
      createQuote(ctx, { patientId: MARIANA, planItemIds: planejados.map((i) => i.id as string) }),
    );

    const { id: itemId } = await withTenant(dona, (ctx) =>
      addQuoteItem(ctx, {
        quoteId: id,
        description: "Clareamento de consultório",
        unitPriceCents: 90000,
      }),
    );

    await withTenant(dona, (ctx) => removeQuoteItem(ctx, itemId));

    const quote = await withTenant(dona, (ctx) => getQuote(ctx, id));
    expect(quote.items.map((i) => i.description)).not.toContain("Clareamento de consultório");
  });
});

describe("totais", () => {
  it("o total vem do banco, nao da aplicacao", async () => {
    const { id } = await withTenant(dona, (ctx) =>
      createQuote(ctx, { patientId: MARIANA, title: "Teste de totais" }),
    );

    await withTenant(dona, (ctx) =>
      addQuoteItem(ctx, { quoteId: id, description: "Item A", unitPriceCents: 50000, quantity: 2 }),
    );
    await withTenant(dona, (ctx) =>
      addQuoteItem(ctx, { quoteId: id, description: "Item B", unitPriceCents: 30000 }),
    );

    const quote = await withTenant(dona, (ctx) => getQuote(ctx, id));
    expect(quote.subtotalCents).toBe(130000);
    expect(quote.totalCents).toBe(130000);

    await withTenant(dona, (ctx) => setQuoteDiscount(ctx, { quoteId: id, discountCents: 30000 }));

    const comDesconto = await withTenant(dona, (ctx) => getQuote(ctx, id));
    expect(comDesconto.totalCents).toBe(100000);
  });
});

describe("alcada de desconto", () => {
  it("a tela sabe o teto antes de a pessoa digitar", async () => {
    const { id } = await withTenant(dona, (ctx) =>
      createQuote(ctx, { patientId: MARIANA, title: "Teto visivel" }),
    );
    await withTenant(dona, (ctx) =>
      addQuoteItem(ctx, { quoteId: id, description: "Item", unitPriceCents: 100000 }),
    );

    const comoDona = await withTenant(dona, (ctx) => getQuote(ctx, id));
    const comoRecepcao = await withTenant(recepcao, (ctx) => getQuote(ctx, id));

    expect(comoDona.ceiling.rolePercent).toBe(100);
    expect(comoRecepcao.ceiling.rolePercent).toBe(5);
    expect(comoRecepcao.ceiling.effectiveCents).toBeLessThan(comoDona.ceiling.effectiveCents);
  });

  it("recepcao nao envia acima da propria alcada", async () => {
    const { id } = await withTenant(recepcao, (ctx) =>
      createQuote(ctx, { patientId: MARIANA, title: "Desconto da recepcao" }),
    );
    await withTenant(recepcao, (ctx) =>
      addQuoteItem(ctx, { quoteId: id, description: "Item", unitPriceCents: 100000 }),
    );

    // 5% de 100.000 = 5.000.
    await withTenant(recepcao, (ctx) =>
      setQuoteDiscount(ctx, { quoteId: id, discountCents: 20000 }),
    );

    await expect(
      withTenant(recepcao, (ctx) => changeQuoteStatus(ctx, { quoteId: id, to: "sent" })),
    ).rejects.toThrow(/teto/i);

    await withTenant(recepcao, (ctx) =>
      setQuoteDiscount(ctx, { quoteId: id, discountCents: 5000 }),
    );

    const enviado = await withTenant(recepcao, (ctx) =>
      changeQuoteStatus(ctx, { quoteId: id, to: "sent" }),
    );
    expect(enviado.status).toBe("sent");
  });

  it("quem nao aprova desconto nao carimba a propria aprovacao", async () => {
    const { id } = await withTenant(recepcao, (ctx) =>
      createQuote(ctx, { patientId: MARIANA, title: "Autoaprovacao" }),
    );
    await withTenant(recepcao, (ctx) =>
      addQuoteItem(ctx, { quoteId: id, description: "Item", unitPriceCents: 100000 }),
    );

    await expect(
      withTenant(recepcao, (ctx) =>
        setQuoteDiscount(ctx, { quoteId: id, discountCents: 30000, approve: true }),
      ),
    ).rejects.toThrow(Forbidden);
  });

  it("gestor aprovando troca o teto pelo dele", async () => {
    const { id } = await withTenant(recepcao, (ctx) =>
      createQuote(ctx, { patientId: MARIANA, title: "Aprovado pela dona" }),
    );
    await withTenant(recepcao, (ctx) =>
      addQuoteItem(ctx, { quoteId: id, description: "Item", unitPriceCents: 100000 }),
    );

    await withTenant(dona, (ctx) =>
      setQuoteDiscount(ctx, { quoteId: id, discountCents: 30000, approve: true }),
    );

    const enviado = await withTenant(dona, (ctx) =>
      changeQuoteStatus(ctx, { quoteId: id, to: "sent" }),
    );

    expect(enviado.status).toBe("sent");

    const quote = await withTenant(dona, (ctx) => getQuote(ctx, id));
    expect(quote.discountApprovedBy).toBe("Ana Souza");
    expect(quote.totalCents).toBe(70000);
  });
});

describe("ciclo de vida", () => {
  it("orcamento sem item nao e enviado", async () => {
    const { id } = await withTenant(dona, (ctx) =>
      createQuote(ctx, { patientId: MARIANA, title: "Vazio" }),
    );

    await expect(
      withTenant(dona, (ctx) => changeQuoteStatus(ctx, { quoteId: id, to: "sent" })),
    ).rejects.toThrow(/item/i);
  });

  it("perda exige motivo", async () => {
    const id = await umOrcamentoEnviado();

    await expect(
      withTenant(dona, (ctx) => changeQuoteStatus(ctx, { quoteId: id, to: "rejected" })),
    ).rejects.toThrow(ValidationError);

    const motivo = await admin
      .selectFrom("loss_reason")
      .select("id")
      .where("tenant_id", "=", SEED.redeSorriso)
      .executeTakeFirstOrThrow();

    const perdido = await withTenant(dona, (ctx) =>
      changeQuoteStatus(ctx, {
        quoteId: id,
        to: "rejected",
        lossReasonId: motivo.id as string,
        lossNotes: "Achou caro.",
      }),
    );

    expect(perdido.status).toBe("rejected");
  });

  it("transicao invalida e recusada pelo banco", async () => {
    const id = await umOrcamentoEnviado();

    // sent -> draft nao existe: proposta enviada nao volta a rascunho.
    await expect(
      withTenant(dona, (ctx) =>
        ctx.db.updateTable("quote").set({ status: "draft" }).where("id", "=", id).execute(),
      ),
    ).rejects.toThrow(/mudanca de status nao e permitida|não é permitida/i);
  });

  it("aceite nasce assinado e o orcamento para de aceitar edicao", async () => {
    const id = await umOrcamentoEnviado();

    await withTenant(dona, (ctx) => acceptQuote(ctx, { quoteId: id, signedBy: "Mariana Alves" }), {
      ip: "203.0.113.7",
      userAgent: "teste",
    });

    const linha = await admin
      .selectFrom("quote")
      .select(["status", "signed_hash", "signed_ip", "accepted_at"])
      .where("id", "=", id)
      .executeTakeFirstOrThrow();

    expect(linha.status).toBe("accepted");
    expect(linha.signed_hash).toMatch(/^[0-9a-f]{64}$/);
    expect(String(linha.signed_ip)).toBe("203.0.113.7");

    await expect(
      withTenant(dona, (ctx) =>
        addQuoteItem(ctx, { quoteId: id, description: "Item tardio", unitPriceCents: 1000 }),
      ),
    ).rejects.toThrow(/não está mais em edição/i);
  });
});

describe("isolamento", () => {
  it("orcamento de outra rede nao existe", async () => {
    const id = await umOrcamentoEnviado();

    await expect(withTenant(outraRede, (ctx) => getQuote(ctx, id))).rejects.toThrow(NotFound);
  });

  it("a lista soma por estagio so o que e da rede", async () => {
    const daRede = await withTenant(dona, (ctx) => listQuotes(ctx));
    const daOutra = await withTenant(outraRede, (ctx) => listQuotes(ctx));

    expect(daRede.total).toBeGreaterThan(0);
    expect(daOutra.total).toBe(0);
    expect(Object.values(daOutra.totals)).toHaveLength(0);
  });
});

/** Orcamento com item, ja enviado — o ponto de partida de metade dos testes. */
async function umOrcamentoEnviado(): Promise<string> {
  const { id } = await withTenant(dona, (ctx) =>
    createQuote(ctx, { patientId: MARIANA, title: "Proposta de teste" }),
  );

  await withTenant(dona, (ctx) =>
    addQuoteItem(ctx, { quoteId: id, description: "Procedimento", unitPriceCents: 120000 }),
  );

  await withTenant(dona, (ctx) => changeQuoteStatus(ctx, { quoteId: id, to: "sent" }));
  return id;
}
