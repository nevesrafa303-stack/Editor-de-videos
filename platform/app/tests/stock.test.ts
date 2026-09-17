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
  transferStock,
} from "@/modules/stock";
import { Forbidden, NotFound, ValidationError } from "@/shared/errors";
import { sql } from "kysely";
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

/**
 * Um item de resina planejado, novo a cada chamada.
 *
 * Os testes disputavam o item que o seed deixa planejado: o primeiro executava,
 * e o seguinte não achava mais nenhum. Pescar "algum executado" era pior —
 * pegava um atendimento do seed, de outra unidade, e o teste passava a medir
 * outra coisa. Cada teste cria o seu.
 */
let planoDeTeste: string | null = null;

async function itemDeResina(): Promise<string> {
  if (!planoDeTeste) {
    const plano = await admin
      .insertInto("treatment_plan")
      .values({
        tenant_id: SEED.redeSorriso,
        unit_id: SEED.unidadeCentro,
        patient_id: SEED.pacienteRoberto,
        title: "Plano da suíte de estoque",
        status: "active",
        code: BigInt(8000 + Math.floor(Math.random() * 900)) as unknown as number,
      })
      .returning("id")
      .executeTakeFirstOrThrow();

    planoDeTeste = plano.id as string;
  }

  const item = await admin
    .insertInto("treatment_plan_item")
    .values({
      tenant_id: SEED.redeSorriso,
      treatment_plan_id: planoDeTeste,
      procedure_id: SEED.procedimentoResina,
      description: "Restauração em resina",
      tooth_code: "37",
      surfaces: ["O"] as unknown as never,
      quantity: "1" as unknown as number,
      unit_price_cents: BigInt(28000) as unknown as number,
    })
    .returning("id")
    .executeTakeFirstOrThrow();

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

    const { rows } = await sql<{ total: string }>`
      select coalesce(sum(quantity), 0) as total
        from stock_balance
       where product_id = ${PRODUTOS.resina}
         and unit_id = ${SEED.unidadeCentro}
    `.execute(admin);

    // Da unidade ATIVA, não da rede: as ações desta tela gravam numa unidade
    // só, e um total somado ao lado delas é um número que não bate com nada.
    expect(resina?.saldo).toBe(Number(rows[0]?.total ?? 0));
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
    expect(resina?.valorEmEstoqueCents).toBe(Math.round((resina?.saldo ?? 0) * 12000));
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

  it("a perda entra valorada, não a zero", async () => {
    // `total_cost_cents` é coluna gerada e a movimentação é append-only: se a
    // perda nasce com custo zero, ela vale zero para sempre — a clínica joga
    // material fora e o relatório de desperdício diz R$ 0,00.
    const movimento = await withTenant(dona, (ctx) =>
      registerLoss(ctx, {
        productId: PRODUTOS.resina,
        quantity: 1,
        reason: "Teste de valoração.",
      }),
    );

    const linha = await admin
      .selectFrom("stock_movement")
      .select(["unit_cost_cents", "total_cost_cents"])
      .where("id", "=", movimento)
      .executeTakeFirstOrThrow();

    expect(Number(linha.unit_cost_cents)).toBe(12000);
    expect(Number(linha.total_cost_cents)).toBe(12000);
  });

  it("a perda de um lote vale o custo daquele lote, não o de catálogo", async () => {
    const ficha = await withTenant(dona, (ctx) => getProduct(ctx, PRODUTOS.toxina));
    const lote = ficha.lotes.find((l) => l.saldo > 0 && l.custoCents > 0);
    expect(lote).toBeDefined();

    const movimento = await withTenant(dona, (ctx) =>
      registerLoss(ctx, {
        productId: PRODUTOS.toxina,
        lotId: lote!.id,
        quantity: 1,
        reason: "Frasco quebrou.",
      }),
    );

    const linha = await admin
      .selectFrom("stock_movement")
      .select("unit_cost_cents")
      .where("id", "=", movimento)
      .executeTakeFirstOrThrow();

    expect(Number(linha.unit_cost_cents)).toBe(lote!.custoCents);
  });

  it("perda sem motivo é recusada", async () => {
    await expect(
      withTenant(dona, (ctx) =>
        registerLoss(ctx, { productId: PRODUTOS.resina, quantity: 1, reason: "" }),
      ),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("o acerto recebe o que foi contado e calcula a diferença", async () => {
    // Conta três a menos do que o sistema tem, seja qual for o saldo de agora:
    // fixar o número contado fazia o teste virar no-op quando outra suíte já
    // tinha deixado o estoque naquele valor.
    const antes = await saldo(PRODUTOS.resina);
    const contado = antes - 3;

    const { diferenca } = await withTenant(dona, (ctx) =>
      adjustBalance(ctx, {
        productId: PRODUTOS.resina,
        countedQuantity: contado,
        reason: "Contagem de fim de mês.",
      }),
    );

    expect(diferenca).toBeCloseTo(-3, 4);
    expect(await saldo(PRODUTOS.resina)).toBeCloseTo(contado, 4);
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
    // Executa o próprio item em vez de pescar "algum executado": o seed já tem
    // procedimentos executados, e pegar o primeiro da tabela estornaria um
    // atendimento de outra unidade — o teste passaria a medir outra coisa.
    const itemId = await itemDeResina();
    await withTenant(dona, (ctx) => executePlanItem(ctx, { itemId }));
    const item = { id: itemId };

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

describe("transferência entre unidades", () => {
  /** Saldo de um produto numa unidade específica, por fora do RLS. */
  async function saldoNa(unitId: string, productId: string): Promise<number> {
    const { rows } = await sql<{ total: string }>`
      select coalesce(sum(quantity), 0) as total
        from stock_balance
       where product_id = ${productId} and unit_id = ${unitId}
    `.execute(admin);

    return Number(rows[0]?.total ?? 0);
  }

  it("tira daqui e põe lá, na mesma transação", async () => {
    const antesAqui = await saldoNa(SEED.unidadeCentro, PRODUTOS.resina);
    const antesLa = await saldoNa(SEED.unidadeZonaSul, PRODUTOS.resina);

    const { groupId } = await withTenant(dona, (ctx) =>
      transferStock(ctx, {
        productId: PRODUTOS.resina,
        toUnitId: SEED.unidadeZonaSul,
        quantity: 4,
        notes: "Reposição da agenda de quinta.",
      }),
    );

    // `toBeCloseTo` e não `toBe`: o saldo é fracionário (a baixa por ficha
    // técnica deixa quatro casas), e ponto flutuante não fecha na igualdade.
    expect(await saldoNa(SEED.unidadeCentro, PRODUTOS.resina)).toBeCloseTo(antesAqui - 4, 4);
    expect(await saldoNa(SEED.unidadeZonaSul, PRODUTOS.resina)).toBeCloseTo(antesLa + 4, 4);

    // As duas linhas com o mesmo grupo: é ele que liga as pontas quando alguém
    // for entender, meses depois, por que o saldo caiu de um lado.
    const movimentos = await admin
      .selectFrom("stock_movement")
      .select(["kind", "quantity", "reason"])
      .where("transfer_group_id", "=", groupId)
      .execute();

    expect(movimentos).toHaveLength(2);
    expect(movimentos.map((m) => m.kind).sort()).toEqual(["transfer_in", "transfer_out"]);

    // A frase basta na linha em que aparece: quem lê o histórico de uma
    // unidade não vai buscar a outra ponta para saber para onde o material foi.
    expect(movimentos.find((m) => m.kind === "transfer_out")?.reason).toContain("Zona Sul");
    expect(movimentos.find((m) => m.kind === "transfer_in")?.reason).toContain("Centro");
    expect(movimentos.every((m) => m.reason?.includes("quinta"))).toBe(true);
  });

  it("não transfere mais do que existe aqui", async () => {
    // Diferente do consumo, que avisa e deixa negativo: consumo registra um
    // procedimento que já aconteceu; transferência executa uma decisão agora,
    // e não dá para pôr no carro o que não está na prateleira.
    const aqui = await saldoNa(SEED.unidadeCentro, PRODUTOS.resina);

    await expect(
      withTenant(dona, (ctx) =>
        transferStock(ctx, {
          productId: PRODUTOS.resina,
          toUnitId: SEED.unidadeZonaSul,
          quantity: aqui + 10,
        }),
      ),
    ).rejects.toThrow(/mais do que existe/i);

    expect(await saldoNa(SEED.unidadeCentro, PRODUTOS.resina)).toBeCloseTo(aqui, 4);
  });

  it("transferir para a própria unidade é recusado", async () => {
    await expect(
      withTenant(dona, (ctx) =>
        transferStock(ctx, {
          productId: PRODUTOS.resina,
          toUnitId: SEED.unidadeCentro,
          quantity: 1,
        }),
      ),
    ).rejects.toThrow(/diferente da de origem/i);
  });

  it("não dá para mandar material para unidade fora do seu acesso", async () => {
    // Mandar para um lugar que a pessoa não enxerga é material que ela não
    // consegue nem conferir se chegou.
    await expect(
      withTenant(dona, (ctx) =>
        transferStock(ctx, {
          productId: PRODUTOS.resina,
          toUnitId: SEED.unidadeBella,
          quantity: 1,
        }),
      ),
    ).rejects.toThrow();
  });

  it("recepção não transfere estoque", async () => {
    await expect(
      withTenant(recepcao, (ctx) =>
        transferStock(ctx, {
          productId: PRODUTOS.resina,
          toUnitId: SEED.unidadeZonaSul,
          quantity: 1,
        }),
      ),
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
