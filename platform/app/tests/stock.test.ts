/**
 * Estoque, pela camada de acesso.
 *
 * O que estes testes seguram é o que faz um estoque deixar de bater com a
 * prateleira — que é o único jeito de um estoque falhar:
 *
 *   - saldo lido numa unidade diferente da que somou;
 *   - ficha técnica convertida errado entre unidade de uso e de estoque;
 *   - lote escolhido que não é o que vence primeiro;
 *   - execução marcada sem o material ter saído (ou o contrário);
 *   - estorno que apaga histórico em vez de devolver.
 */
process.env.DB_POOL_MAX = "1";

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { closeDb } from "@/server/db";
import { withTenant, type TenantSession } from "@/server/context";
import {
  adjustBalance,
  formatQuantidade,
  executePlanItem,
  getProduct,
  getStockSummary,
  listExpiringLots,
  listProducts,
  previewConsumption,
  registerLoss,
  registerPurchase,
  revertPlanItem,
} from "@/modules/stock";
import { Forbidden, NotFound, ValidationError } from "@/shared/errors";
import { adminDb, entrar, SEED, USUARIOS } from "./helpers";

const PRODUTOS = {
  toxina: "04111111-1111-7111-8111-111111111111",
  acido: "04222222-2222-7222-8222-222222222222",
  resina: "04333333-3333-7333-8333-333333333333",
} as const;

const LOTE_TOXINA = "06111111-1111-7111-8111-111111111111";

let dona: TenantSession;
let recepcao: TenantSession;
let outraRede: TenantSession;
const admin = adminDb();

/** Item planejado de resina no plano do Roberto, criado pelo seed. */
async function itemDeResina(): Promise<string> {
  const item = await admin
    .selectFrom("treatment_plan_item")
    .select("id")
    .where("procedure_id", "=", SEED.procedimentoResina)
    .where("status", "=", "planned")
    .executeTakeFirst();

  if (!item) throw new Error("O seed deveria ter um item de resina planejado.");
  return item.id as string;
}

async function saldo(productId: string): Promise<number> {
  const linhas = await withTenant(dona, (ctx) => listProducts(ctx, { productId }));
  return linhas[0]?.saldo ?? 0;
}

beforeAll(async () => {
  dona = (await entrar(USUARIOS.dona)).session;
  recepcao = (await entrar(USUARIOS.recepcao)).session;
  outraRede = (await entrar(USUARIOS.outraRede)).session;
});

afterAll(async () => {
  await admin.destroy();
  await closeDb();
});

describe("como o número aparece", () => {
  it("a tela nunca arredonda além do que a coluna guarda", async () => {
    // Já foi bug duas vezes nesta fatia. Com três casas, a prévia dizia
    // "0,144 tubo" e o estoque baixava 0,1438 — número de tela que não fecha
    // com o saldo é número que ninguém consegue conferir.
    expect(formatQuantidade(0.1438, "tubo")).toBe("0,1438 tubos");
    expect(formatQuantidade(5)).toBe("5");
    expect(formatQuantidade(4.8, "frasco")).toBe("4,8 frascos");
  });

  it("pluraliza unidade por extenso e deixa abreviação em paz", () => {
    // "5 frasco" está errado em português; "5 mls" também. A regra acrescenta
    // "s" só depois de vogal, que separa os dois casos sem tabela de plurais.
    expect(formatQuantidade(1, "frasco")).toBe("1 frasco");
    expect(formatQuantidade(3, "seringa")).toBe("3 seringas");
    expect(formatQuantidade(2, "ml")).toBe("2 ml");
    expect(formatQuantidade(30, "U")).toBe("30 U");
  });
});

describe("lista", () => {
  it("soma o saldo de todos os lotes num número só", async () => {
    // A tabela de saldo é por (unidade, produto, lote, local). Ler uma linha
    // daria o saldo de um lote num local — que não é pergunta que alguém faz.
    const linhas = await withTenant(dona, (ctx) => listProducts(ctx));
    const resina = linhas.find((l) => l.id === PRODUTOS.resina);

    expect(resina?.saldo).toBe(20);
    expect(resina?.stockUnit).toBe("tubo");
    expect(resina?.usageUnit).toBe("g");
  });

  it("quem está abaixo do mínimo sobe na lista", async () => {
    const linhas = await withTenant(dona, (ctx) => listProducts(ctx));
    const abaixo = linhas.filter((l) => l.saldo <= l.minimo);
    const primeiros = linhas.slice(0, abaixo.length);

    expect(primeiros.every((l) => l.saldo <= l.minimo)).toBe(true);
  });

  it("outra rede não vê um frasco desta", async () => {
    const daqui = await withTenant(dona, (ctx) => listProducts(ctx));
    const dela = await withTenant(outraRede, (ctx) => listProducts(ctx));

    expect(daqui.length).toBeGreaterThan(0);
    expect(dela.map((l) => l.id)).not.toContain(PRODUTOS.toxina);
  });

  it("o valor da lista soma o mesmo que o valor do resumo", async () => {
    // Era o bug: a linha caía para zero quando o produto não tinha lote, e o
    // total lá em cima contava os mesmos tubos. Dois números para a mesma
    // coisa, na mesma tela — e é sempre assim que começa.
    const linhas = await withTenant(dona, (ctx) => listProducts(ctx));
    const resumo = await withTenant(dona, (ctx) => getStockSummary(ctx));

    const soma = linhas.reduce((s, l) => s + l.valorEmEstoqueCents, 0);
    expect(soma).toBe(resumo.valorEmEstoqueCents);
    expect(soma).toBeGreaterThan(0);
  });

  it("produto sem lote também tem valor parado", async () => {
    const linhas = await withTenant(dona, (ctx) => listProducts(ctx));
    const resina = linhas.find((l) => l.id === PRODUTOS.resina);

    expect(resina?.exigeLote).toBe(false);
    expect(resina?.valorEmEstoqueCents).toBe(20 * 12000);
  });

  it("o resumo separa o que vai vencer do que já venceu", async () => {
    // São ações diferentes: uma é comprar antes de perder, a outra é dar baixa
    // de perda hoje. Somar as duas esconde a que já passou do ponto.
    const resumo = await withTenant(dona, (ctx) => getStockSummary(ctx));

    expect(resumo.vencidosComSaldo).toBeGreaterThanOrEqual(0);
    expect(resumo.vencendoEm60).toBeGreaterThanOrEqual(0);
    expect(resumo.valorEmEstoqueCents).toBeGreaterThan(0);
  });
});

describe("entrada", () => {
  it("produto com rastreio exige número de lote e validade", async () => {
    // Sem lote não existe recall reverso, e recall reverso é a única coisa que
    // a clínica tem numa fiscalização.
    await expect(
      withTenant(dona, (ctx) =>
        registerPurchase(ctx, { productId: PRODUTOS.toxina, quantity: 2 }),
      ),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("entrada com lote novo cria o lote e soma o saldo", async () => {
    const antes = await saldo(PRODUTOS.toxina);

    const { lotId } = await withTenant(dona, (ctx) =>
      registerPurchase(ctx, {
        productId: PRODUTOS.toxina,
        quantity: 3,
        unitCostCents: 91000,
        lotNumber: `TOX-${Date.now()}`,
        expiresOn: "2030-01-31",
      }),
    );

    expect(lotId).toBeTruthy();
    expect(await saldo(PRODUTOS.toxina)).toBe(antes + 3);
  });

  it("o mesmo número de lote não vira dois lotes", async () => {
    // Duas compras da mesma caixa são o mesmo lote; dois registros dele
    // quebrariam o rastreio em duas metades.
    const numero = `TOX-REPETIDO-${Date.now()}`;

    const a = await withTenant(dona, (ctx) =>
      registerPurchase(ctx, {
        productId: PRODUTOS.toxina,
        quantity: 1,
        lotNumber: numero,
        expiresOn: "2030-06-30",
      }),
    );
    const b = await withTenant(dona, (ctx) =>
      registerPurchase(ctx, {
        productId: PRODUTOS.toxina,
        quantity: 2,
        lotNumber: numero,
        expiresOn: "2030-06-30",
      }),
    );

    expect(b.lotId).toBe(a.lotId);

    const ficha = await withTenant(dona, (ctx) => getProduct(ctx, PRODUTOS.toxina));
    const lote = ficha.lotes.find((l) => l.numero === numero);
    expect(lote?.saldo).toBe(3);
  });

  it("recepção não mexe em estoque", async () => {
    await expect(
      withTenant(recepcao, (ctx) =>
        registerPurchase(ctx, { productId: PRODUTOS.resina, quantity: 1 }),
      ),
    ).rejects.toBeInstanceOf(Forbidden);
  });
});

describe("perda e acerto", () => {
  it("perda sai do saldo com motivo", async () => {
    const antes = await saldo(PRODUTOS.resina);

    await withTenant(dona, (ctx) =>
      registerLoss(ctx, {
        productId: PRODUTOS.resina,
        quantity: 2,
        reason: "Tubo aberto ressecou.",
      }),
    );

    expect(await saldo(PRODUTOS.resina)).toBe(antes - 2);
  });

  it("perda sem motivo é recusada", async () => {
    await expect(
      withTenant(dona, (ctx) =>
        registerLoss(ctx, { productId: PRODUTOS.resina, quantity: 1, reason: "" }),
      ),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("o acerto recebe o que foi contado e calcula a diferença", async () => {
    const { diferenca } = await withTenant(dona, (ctx) =>
      adjustBalance(ctx, {
        productId: PRODUTOS.resina,
        countedQuantity: 15,
        reason: "Contagem de fim de mês.",
      }),
    );

    expect(await saldo(PRODUTOS.resina)).toBe(15);
    expect(diferenca).not.toBe(0);
  });

  it("contagem que bate não vira movimentação", async () => {
    // Lançar zero sujaria o histórico com linhas que não aconteceram — e o
    // histórico é o que se lê para entender uma divergência.
    const atual = await saldo(PRODUTOS.resina);

    const r = await withTenant(dona, (ctx) =>
      adjustBalance(ctx, {
        productId: PRODUTOS.resina,
        countedQuantity: atual,
        reason: "Conferência sem divergência.",
      }),
    );

    expect(r.movementId).toBeNull();
    expect(r.diferenca).toBe(0);
  });
});

describe("executar o procedimento", () => {
  it("a prévia converte unidade de uso em unidade de estoque", async () => {
    // Resina: 0,5 g por procedimento, 15% de perda, tubo de 4 g.
    // 0,5 × 1,15 / 4 = 0,14375 tubo.
    const itemId = await itemDeResina();
    const previa = await withTenant(dona, (ctx) => previewConsumption(ctx, itemId));

    expect(previa).toHaveLength(1);
    // 0,1438 e nao 0,14375: a coluna guarda quatro casas, e a previa mostra o
    // numero que vai sair de verdade.
    expect(previa[0]!.precisa).toBe(0.1438);
    expect(previa[0]!.stockUnit).toBe("tubo");
  });

  it("executar baixa o material e marca o item na mesma transação", async () => {
    const itemId = await itemDeResina();
    const antes = await saldo(PRODUTOS.resina);

    const movimentos = await withTenant(dona, (ctx) =>
      executePlanItem(ctx, { itemId }),
    );

    expect(movimentos).toBe(1);
    expect(await saldo(PRODUTOS.resina)).toBeCloseTo(antes - 0.1438, 5);

    const item = await admin
      .selectFrom("treatment_plan_item")
      .select(["status", "executed_at", "executed_by"])
      .where("id", "=", itemId)
      .executeTakeFirstOrThrow();

    expect(item.status).toBe("executed");
    expect(item.executed_at).not.toBeNull();
    expect(item.executed_by).toBe(SEED.drAna);
  });

  it("o mesmo item não é executado duas vezes", async () => {
    // Sem esta trava, dois cliques consomem material duas vezes — e o segundo
    // consumo não tem paciente nenhum por trás.
    const item = await admin
      .selectFrom("treatment_plan_item")
      .select("id")
      .where("status", "=", "executed")
      .executeTakeFirstOrThrow();

    await expect(
      withTenant(dona, (ctx) => executePlanItem(ctx, { itemId: item.id as string })),
    ).rejects.toThrow(/já foi executado/i);
  });

  it("estornar devolve ao mesmo lote e não apaga o consumo", async () => {
    const item = await admin
      .selectFrom("treatment_plan_item")
      .select("id")
      .where("status", "=", "executed")
      .executeTakeFirstOrThrow();

    const antes = await saldo(PRODUTOS.resina);

    const devolvidos = await withTenant(dona, (ctx) =>
      revertPlanItem(ctx, { itemId: item.id as string, reason: "Dente errado." }),
    );

    expect(devolvidos).toBe(1);
    expect(await saldo(PRODUTOS.resina)).toBeCloseTo(antes + 0.1438, 5);

    // As duas linhas continuam no histórico, lado a lado. Estoque que apaga
    // histórico não defende ninguém numa fiscalização.
    const movimentos = await admin
      .selectFrom("stock_movement")
      .select(["kind", "quantity"])
      .where("treatment_plan_item_id", "=", item.id as string)
      .execute();

    expect(movimentos.map((m) => m.kind).sort()).toEqual(["adjustment", "consumption"]);

    const item2 = await admin
      .selectFrom("treatment_plan_item")
      .select(["status", "executed_at"])
      .where("id", "=", item.id as string)
      .executeTakeFirstOrThrow();

    expect(item2.status).toBe("planned");
    expect(item2.executed_at).toBeNull();
  });

  it("estorno sem motivo é recusado", async () => {
    const itemId = await itemDeResina();
    await expect(
      withTenant(dona, (ctx) => revertPlanItem(ctx, { itemId, reason: "" })),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("recepção não executa procedimento", async () => {
    const itemId = await itemDeResina();
    await expect(
      withTenant(recepcao, (ctx) => executePlanItem(ctx, { itemId })),
    ).rejects.toBeInstanceOf(Forbidden);
  });
});

describe("validade", () => {
  it("a fila inclui o que já venceu e ainda tem saldo", async () => {
    // Lote vencido com saldo não é história antiga: é material na prateleira
    // que ainda pode ser pego por engano.
    await withTenant(dona, (ctx) =>
      registerPurchase(ctx, {
        productId: PRODUTOS.acido,
        quantity: 1,
        lotNumber: `AH-VENCIDO-${Date.now()}`,
        expiresOn: new Date(Date.now() - 86_400_000).toISOString().slice(0, 10),
      }),
    );

    const fila = await withTenant(dona, (ctx) => listExpiringLots(ctx, 90));
    expect(fila.some((l) => l.diasParaVencer < 0)).toBe(true);
    expect(fila.every((l) => l.saldo > 0)).toBe(true);
  });

  it("vem ordenada pelo que vence antes", async () => {
    const fila = await withTenant(dona, (ctx) => listExpiringLots(ctx, 365));
    const dias = fila.map((l) => l.diasParaVencer);

    expect(dias).toEqual([...dias].sort((a, b) => a - b));
  });
});

describe("ficha do produto", () => {
  it("traz lotes e movimentações do produto", async () => {
    const ficha = await withTenant(dona, (ctx) => getProduct(ctx, PRODUTOS.toxina));

    expect(ficha.nome).toContain("Toxina");
    expect(ficha.lotes.length).toBeGreaterThan(0);
    expect(ficha.movimentos.length).toBeGreaterThan(0);
    expect(ficha.fatorConversao).toBe(100);
  });

  it("o saldo da ficha é o mesmo da lista", async () => {
    // Dois lugares somando estoque são dois lugares para divergir — e a ficha
    // é justamente onde alguém confere o número da lista.
    const ficha = await withTenant(dona, (ctx) => getProduct(ctx, PRODUTOS.toxina));
    expect(ficha.saldo).toBe(await saldo(PRODUTOS.toxina));
  });

  it("produto de outra rede não é encontrado", async () => {
    await expect(
      withTenant(outraRede, (ctx) => getProduct(ctx, PRODUTOS.toxina)),
    ).rejects.toBeInstanceOf(NotFound);
  });
});
