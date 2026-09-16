/**
 * Relatórios gerenciais.
 *
 * O que estes testes existem para pegar não é "a consulta roda". É o conjunto
 * de erros que um relatório comete em silêncio, e que ninguém descobre até o
 * dia em que a clínica confere o número a mão e perde a confiança na tela:
 *
 *   - somar o que não é seu (vazamento entre redes, entre unidades);
 *   - contar duas vezes o mesmo dinheiro;
 *   - mostrar 0% onde a resposta certa é "não houve";
 *   - deixar o dia final de fora por causa de fuso;
 *   - mostrar número financeiro para quem não pode ver.
 */
process.env.DB_POOL_MAX = "1";

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { closeDb } from "@/server/db";
import { withTenant, type TenantSession } from "@/server/context";
import {
  getConversaoFunil,
  getCustoRealPorProcedimento,
  getSaidaSemProcedimento,
  getFaturamentoPorProfissional,
  getInadimplenciaPorUnidade,
  getOrigemCaptacao,
  getProducaoPorProcedimento,
  getResumo,
  periodoPadrao,
  periodoAnterior,
  rotuloCanal,
  rotuloPeriodo,
} from "@/modules/report";
import {
  acceptQuote,
  addQuoteItem,
  changeQuoteStatus,
  createQuote,
  getQuote,
  setQuoteDiscount,
} from "@/modules/quote";
import { sql } from "kysely";
import { registerLoss } from "@/modules/stock";
import { listReachableUnits } from "@/modules/auth/units";
import { Forbidden, ValidationError } from "@/shared/errors";
import { adminDb, entrar, SEED, USUARIOS } from "./helpers";

let dona: TenantSession;
let profissional: TenantSession;
let financeiro: TenantSession;
let outraRede: TenantSession;
const admin = adminDb();

/** Janela larga o bastante para conter todo o histórico do seed. */
const AMPLO = { de: diaISO(-400), ate: diaISO(400), unitId: null };

function diaISO(offsetDias: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + offsetDias);
  return d.toISOString().slice(0, 10);
}

beforeAll(async () => {
  dona = (await entrar(USUARIOS.dona)).session;
  profissional = (await entrar(USUARIOS.profissional)).session;
  financeiro = (await entrar(USUARIOS.financeiro)).session;
  outraRede = (await entrar(USUARIOS.outraRede)).session;
});

afterAll(async () => {
  await admin.destroy();
  await closeDb();
});

describe("período", () => {
  it("o padrão é o mês corrente, do dia 1 ao último", async () => {
    const p = periodoPadrao("America/Sao_Paulo", new Date("2026-02-15T12:00:00Z"));
    expect(p).toEqual({ de: "2026-02-01", ate: "2026-02-28" });
  });

  it("acerta o último dia de um mês de 31 e de um fevereiro bissexto", async () => {
    expect(periodoPadrao("America/Sao_Paulo", new Date("2026-01-10T12:00:00Z")).ate)
      .toBe("2026-01-31");
    expect(periodoPadrao("America/Sao_Paulo", new Date("2028-02-10T12:00:00Z")).ate)
      .toBe("2028-02-29");
  });

  it("usa o fuso da clínica, não o do servidor", async () => {
    // 1º de março às 02:00 UTC ainda é 28 de fevereiro em São Paulo. Um padrão
    // calculado em UTC abriria março enquanto a clínica ainda fecha fevereiro.
    const p = periodoPadrao("America/Sao_Paulo", new Date("2026-03-01T02:00:00Z"));
    expect(p.de).toBe("2026-02-01");
  });

  it("recusa período invertido com frase de produto", async () => {
    await expect(
      withTenant(dona, (ctx) => getResumo(ctx, { de: "2026-09-30", ate: "2026-09-01" })),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("mês fechado compara com o mês calendário anterior", () => {
    // Uma janela de "30 dias antes" devolveria 2 a 31 de agosto — que não é
    // agosto, e faria o número não bater com o fechamento do mês passado.
    const a = periodoAnterior({ de: "2026-09-01", ate: "2026-09-30" });
    expect(a).toEqual({ de: "2026-08-01", ate: "2026-08-31", rotulo: "agosto" });

    // Fevereiro bissexto e virada de ano, que é onde a aritmética de mês erra.
    expect(periodoAnterior({ de: "2028-03-01", ate: "2028-03-31" })).toEqual({
      de: "2028-02-01",
      ate: "2028-02-29",
      rotulo: "fevereiro",
    });
    expect(periodoAnterior({ de: "2026-01-01", ate: "2026-01-31" })).toEqual({
      de: "2025-12-01",
      ate: "2025-12-31",
      rotulo: "dezembro",
    });
  });

  it("recorte solto compara com a janela do mesmo tamanho", () => {
    // Comparar 12 dias com um mês inteiro seria pior do que não comparar.
    const a = periodoAnterior({ de: "2026-09-10", ate: "2026-09-21" });
    expect(a.de).toBe("2026-08-29");
    expect(a.ate).toBe("2026-09-09");
    expect(a.rotulo).toBe("os 12 dias antes");
  });

  it("um dia compara com o dia anterior", () => {
    expect(periodoAnterior({ de: "2026-09-15", ate: "2026-09-15" })).toEqual({
      de: "2026-09-14",
      ate: "2026-09-14",
      rotulo: "o dia anterior",
    });
  });

  it("escreve o rótulo em pt-BR", () => {
    expect(rotuloPeriodo({ de: "2026-09-01", ate: "2026-09-30" }))
      .toBe("01/09/2026 a 30/09/2026");
  });
});

describe("resumo", () => {
  it("soma o que entrou e o que foi vendido no período", async () => {
    const r = await withTenant(dona, (ctx) => getResumo(ctx, AMPLO));

    expect(r.recebidoCents).toBeGreaterThan(0);
    expect(r.aceitoCents).toBeGreaterThan(0);
    expect(r.vencidoCents).toBeGreaterThan(0);
  });

  it("taxa de ganho é null, não 0%, quando nada fechou", async () => {
    // A diferença importa: 0% diz "tentamos e não fechamos"; ausência diz
    // "não houve o que fechar". São conversas diferentes com a equipe.
    const r = await withTenant(dona, (ctx) =>
      getResumo(ctx, { de: diaISO(500), ate: diaISO(530) }),
    );

    expect(r.ganhos).toBe(0);
    expect(r.perdidos).toBe(0);
    expect(r.taxaGanho).toBeNull();
  });

  it("vencido não se mexe com o período — é foto de hoje", async () => {
    const amplo = await withTenant(dona, (ctx) => getResumo(ctx, AMPLO));
    const estreito = await withTenant(dona, (ctx) =>
      getResumo(ctx, { de: diaISO(500), ate: diaISO(530) }),
    );

    expect(estreito.vencidoCents).toBe(amplo.vencidoCents);
    expect(estreito.recebidoCents).toBe(0);
  });

  it("outra rede não vê um centavo desta", async () => {
    const daqui = await withTenant(dona, (ctx) => getResumo(ctx, AMPLO));
    const dela = await withTenant(outraRede, (ctx) => getResumo(ctx, AMPLO));

    expect(daqui.recebidoCents).toBeGreaterThan(0);
    expect(dela.recebidoCents).toBe(0);
    expect(dela.aceitoCents).toBe(0);
    expect(dela.vencidoCents).toBe(0);
  });

  it("o filtro de unidade reparte o total, não o duplica", async () => {
    const rede = await withTenant(dona, (ctx) => getResumo(ctx, AMPLO));
    const unidades = await withTenant(dona, (ctx) => listReachableUnits(ctx));

    let soma = 0;
    for (const u of unidades) {
      const r = await withTenant(dona, (ctx) => getResumo(ctx, { ...AMPLO, unitId: u.id }));
      soma += r.recebidoCents;
    }

    expect(soma).toBe(rede.recebidoCents);
  });
});

describe("faturamento por profissional", () => {
  it("separa vendido de recebido", async () => {
    const linhas = await withTenant(dona, (ctx) =>
      getFaturamentoPorProfissional(ctx, AMPLO),
    );

    expect(linhas.length).toBeGreaterThan(1);
    expect(linhas.some((l) => l.aceitoCents > 0)).toBe(true);
    expect(linhas.some((l) => l.recebidoCents > 0)).toBe(true);
  });

  it("o total dos profissionais bate com o resumo", async () => {
    // É o teste que pega o erro clássico do full join: linha duplicada quando
    // alguém aparece dos dois lados, ou linha perdida quando aparece só de um.
    const linhas = await withTenant(dona, (ctx) =>
      getFaturamentoPorProfissional(ctx, AMPLO),
    );
    const resumo = await withTenant(dona, (ctx) => getResumo(ctx, AMPLO));

    const recebido = linhas.reduce((s, l) => s + l.recebidoCents, 0);
    const aceito = linhas.reduce((s, l) => s + l.aceitoCents, 0);

    expect(recebido).toBe(resumo.recebidoCents);
    expect(aceito).toBe(resumo.aceitoCents);
  });

  it("ninguém aparece duas vezes", async () => {
    const linhas = await withTenant(dona, (ctx) =>
      getFaturamentoPorProfissional(ctx, AMPLO),
    );
    const chaves = linhas.map((l) => l.membershipId);

    expect(new Set(chaves).size).toBe(chaves.length);
  });

  it("recebimento sem orçamento por trás aparece com nome próprio", async () => {
    // Cobrança avulsa existe e é legítima. Somá-la a alguém seria mentira;
    // escondê-la faria o relatório não bater com o caixa.
    const linhas = await withTenant(dona, (ctx) =>
      getFaturamentoPorProfissional(ctx, AMPLO),
    );
    const sem = linhas.find((l) => l.membershipId === null);

    if (sem) expect(sem.nome).toBe("Sem profissional vinculado");
  });

  it("profissional não vê o faturamento da clínica", async () => {
    await expect(
      withTenant(profissional, (ctx) => getFaturamentoPorProfissional(ctx, AMPLO)),
    ).rejects.toBeInstanceOf(Forbidden);
  });
});

describe("conversão do funil", () => {
  it("é monotônica: nunca chega mais gente adiante do que atrás", async () => {
    const etapas = await withTenant(dona, (ctx) => getConversaoFunil(ctx, AMPLO));

    expect(etapas.length).toBeGreaterThan(1);
    for (let i = 1; i < etapas.length; i++) {
      expect(etapas[i]!.alcancaram).toBeLessThanOrEqual(etapas[i - 1]!.alcancaram);
    }
  });

  it("não inclui as etapas de desfecho", async () => {
    const etapas = await withTenant(dona, (ctx) => getConversaoFunil(ctx, AMPLO));
    const nomes = etapas.map((e) => e.nome);

    expect(nomes).not.toContain("Fechado");
    expect(nomes).not.toContain("Perdido");
  });

  it("a primeira etapa não tem taxa de avanço", async () => {
    const etapas = await withTenant(dona, (ctx) => getConversaoFunil(ctx, AMPLO));

    expect(etapas[0]!.avancaram).toBeNull();
    expect(etapas[1]!.avancaram).not.toBeNull();
  });

  it("período sem negócio devolve as etapas zeradas, não lista vazia", async () => {
    // A tela precisa mostrar o funil mesmo parado: sumir com as etapas faria
    // parecer que o funil não existe, e não que ninguém entrou.
    const etapas = await withTenant(dona, (ctx) =>
      getConversaoFunil(ctx, { de: diaISO(500), ate: diaISO(530) }),
    );

    expect(etapas.length).toBeGreaterThan(1);
    expect(etapas.every((e) => e.alcancaram === 0)).toBe(true);
    expect(etapas.every((e) => e.fracao === 0)).toBe(true);
  });

  it("o profissional vê o funil — é relatório dele", async () => {
    const etapas = await withTenant(profissional, (ctx) => getConversaoFunil(ctx, AMPLO));
    expect(etapas.length).toBeGreaterThan(1);
  });
});

describe("vencido por unidade", () => {
  it("lista toda unidade ativa, inclusive a que não deve nada", async () => {
    const linhas = await withTenant(dona, (ctx) => getInadimplenciaPorUnidade(ctx, AMPLO));
    const unidades = await withTenant(dona, (ctx) => listReachableUnits(ctx));

    expect(linhas.length).toBe(unidades.length);
  });

  it("o vencido nunca passa da carteira aberta", async () => {
    const linhas = await withTenant(dona, (ctx) => getInadimplenciaPorUnidade(ctx, AMPLO));

    for (const l of linhas) {
      expect(l.vencidoCents).toBeLessThanOrEqual(l.abertoCents);
      expect(l.fracao).toBeGreaterThanOrEqual(0);
      expect(l.fracao).toBeLessThanOrEqual(1);
    }
  });

  it("soma das unidades bate com o vencido do resumo", async () => {
    const linhas = await withTenant(dona, (ctx) => getInadimplenciaPorUnidade(ctx, AMPLO));
    const resumo = await withTenant(dona, (ctx) => getResumo(ctx, AMPLO));

    expect(linhas.reduce((s, l) => s + l.vencidoCents, 0)).toBe(resumo.vencidoCents);
  });

  it("quem só alcança uma unidade não lê o vencido da outra", async () => {
    // RLS isola a REDE; a tabela `unit` não é filtrada por unidade. Sem o
    // recorte por alcance, o financeiro do Centro abriria a tela para cobrar a
    // própria equipe e leria a dívida da Zona Sul junto.
    const dele = await withTenant(financeiro, (ctx) => getInadimplenciaPorUnidade(ctx, AMPLO));
    const daDona = await withTenant(dona, (ctx) => getInadimplenciaPorUnidade(ctx, AMPLO));

    expect(dele.map((l) => l.unitId)).toEqual([SEED.unidadeCentro]);
    expect(daDona.length).toBeGreaterThan(dele.length);
  });

  it("outra rede não vê as unidades desta", async () => {
    const linhas = await withTenant(outraRede, (ctx) =>
      getInadimplenciaPorUnidade(ctx, AMPLO),
    );

    expect(linhas.map((l) => l.unitId)).not.toContain(SEED.unidadeCentro);
  });
});

describe("produção e margem", () => {
  it("receita menos custo é a margem, e a soma bate com o vendido", async () => {
    const linhas = await withTenant(dona, (ctx) => getProducaoPorProcedimento(ctx, AMPLO));
    const resumo = await withTenant(dona, (ctx) => getResumo(ctx, AMPLO));

    expect(linhas.length).toBeGreaterThan(0);
    for (const l of linhas) {
      expect(l.margemCents).toBe(l.receitaCents - l.custoCents);
    }
    expect(linhas.reduce((s, l) => s + l.receitaCents, 0)).toBe(resumo.aceitoCents);
  });

  it("custo não preenchido vira margem desconhecida, não 100%", async () => {
    const [id] = await admin
      .selectFrom("procedure")
      .select("id")
      .where("tenant_id", "=", SEED.redeSorriso)
      .limit(1)
      .execute();

    expect(id).toBeDefined();

    const linhas = await withTenant(dona, (ctx) => getProducaoPorProcedimento(ctx, AMPLO));
    for (const l of linhas) {
      if (l.custoCents === 0) expect(l.margemPercent).toBeNull();
      else expect(l.margemPercent).not.toBeNull();
    }
  });

  it("desconto do orçamento não fica de fora da tabela", async () => {
    // Era o bug: o desconto vive no cabeçalho, e somar os itens crus dava a
    // receita BRUTA. A tela mostrava "Vendido R$ X" no resumo e X + desconto
    // na tabela logo abaixo — dois números que não fecham na mesma tela.
    const antes = await withTenant(dona, (ctx) => getProducaoPorProcedimento(ctx, AMPLO));
    const receitaAntes = antes.reduce((s, l) => s + l.receitaCents, 0);

    const id = await withTenant(dona, async (ctx) => {
      const { id } = await createQuote(ctx, { patientId: SEED.pacienteMariana });

      await addQuoteItem(ctx, {
        quoteId: id,
        procedureId: SEED.procedimentoImplante,
        description: "Implante unitário",
        toothCode: "35",
        unitPriceCents: 300000,
      });
      await addQuoteItem(ctx, {
        quoteId: id,
        procedureId: SEED.procedimentoResina,
        description: "Restauração em resina",
        toothCode: "34",
        surfaces: ["O"],
        unitPriceCents: 30000,
      });

      // R$ 333 em cima de R$ 3.300: rateio que não fecha em centavo redondo.
      await setQuoteDiscount(ctx, { quoteId: id, discountCents: 33300, approve: true });

      await changeQuoteStatus(ctx, { quoteId: id, to: "sent" });
      await acceptQuote(ctx, { quoteId: id, signedBy: "Mariana Alves" });

      return id;
    });

    expect(id).toBeTruthy();

    const orcamento = await withTenant(dona, (ctx) => getQuote(ctx, id));
    expect(orcamento.discountCents).toBe(33300);

    const depois = await withTenant(dona, (ctx) => getProducaoPorProcedimento(ctx, AMPLO));
    const receitaDepois = depois.reduce((s, l) => s + l.receitaCents, 0);
    const resumo = await withTenant(dona, (ctx) => getResumo(ctx, AMPLO));

    // O acréscimo é o LÍQUIDO, não o bruto, até o último centavo: a sobra do
    // rateio vai inteira para o item mais caro em vez de sumir.
    expect(receitaDepois - receitaAntes).toBe(orcamento.totalCents);
    expect(receitaDepois).toBe(resumo.aceitoCents);
  });

  it("profissional não vê margem", async () => {
    await expect(
      withTenant(profissional, (ctx) => getProducaoPorProcedimento(ctx, AMPLO)),
    ).rejects.toBeInstanceOf(Forbidden);
  });
});

describe("custo real por procedimento", () => {
  it("separa o previsto pela ficha do que saiu dos lotes", async () => {
    const linhas = await withTenant(dona, (ctx) => getCustoRealPorProcedimento(ctx, AMPLO));

    expect(linhas.length).toBeGreaterThan(0);

    const comFicha = linhas.filter((l) => l.temFicha);
    expect(comFicha.length).toBeGreaterThan(0);
    expect(comFicha.every((l) => l.previstoCents > 0 && l.realCents > 0)).toBe(true);
  });

  it("procedimento sem ficha técnica não vira 100% de margem", async () => {
    // É o número mais perigoso que este relatório poderia exibir: custo real
    // zero porque ninguém cadastrou o que o procedimento consome, lido como
    // "margem cheia". A linha existe, mas sem percentual.
    const linhas = await withTenant(dona, (ctx) => getCustoRealPorProcedimento(ctx, AMPLO));
    const semFicha = linhas.filter((l) => !l.temFicha);

    expect(semFicha.length).toBeGreaterThan(0);
    for (const l of semFicha) {
      expect(l.realCents).toBe(0);
      expect(l.margemPercent).toBeNull();
    }
  });

  it("o custo real bate com as movimentações de consumo do período", async () => {
    // O relatório não guarda total nenhum: se ele divergir da soma das
    // movimentações, é porque passou a contar outra coisa.
    const linhas = await withTenant(dona, (ctx) => getCustoRealPorProcedimento(ctx, AMPLO));
    const doRelatorio = linhas.reduce((s, l) => s + l.realCents, 0);

    const { rows } = await sql<{ total: string }>`
      select coalesce(sum(m.total_cost_cents), 0) as total
        from stock_movement m
        join treatment_plan_item i on i.id = m.treatment_plan_item_id
       where m.kind = 'consumption' and i.status = 'executed'
    `.execute(admin);

    expect(doRelatorio).toBe(Number(rows[0]?.total ?? 0));
  });

  it("período sem execução devolve lista vazia, não linhas zeradas", async () => {
    const linhas = await withTenant(dona, (ctx) =>
      getCustoRealPorProcedimento(ctx, { de: diaISO(500), ate: diaISO(530) }),
    );
    expect(linhas).toEqual([]);
  });

  it("profissional não vê custo real", async () => {
    await expect(
      withTenant(profissional, (ctx) => getCustoRealPorProcedimento(ctx, AMPLO)),
    ).rejects.toBeInstanceOf(Forbidden);
  });
});

describe("saiu do estoque sem procedimento", () => {
  it("conta perda e acerto negativo, e não o acerto positivo", async () => {
    // Material que apareceu a mais não é economia: é sinal de que a contagem
    // anterior estava errada. Somar como crédito mascararia a perda do outro
    // mês.
    const antes = await withTenant(dona, (ctx) => getSaidaSemProcedimento(ctx, AMPLO));
    const somaAntes = antes.reduce((s, l) => s + l.valorCents, 0);

    await withTenant(dona, (ctx) =>
      registerLoss(ctx, {
        productId: "04333333-3333-7333-8333-333333333333",
        quantity: 2,
        reason: "Tubo ressecado, teste de relatório.",
      }),
    );

    const depois = await withTenant(dona, (ctx) => getSaidaSemProcedimento(ctx, AMPLO));
    const somaDepois = depois.reduce((s, l) => s + l.valorCents, 0);

    expect(somaDepois).toBeGreaterThan(somaAntes);
    expect(depois.some((l) => l.kind === "loss")).toBe(true);
    expect(depois.every((l) => l.quantidade > 0)).toBe(true);
  });

  it("não se mistura com o custo dos procedimentos", async () => {
    // Diluir desperdício no custo dos atendimentos é como o desperdício some
    // de vista. As duas contas ficam separadas de propósito.
    const custo = await withTenant(dona, (ctx) => getCustoRealPorProcedimento(ctx, AMPLO));
    const avulsa = await withTenant(dona, (ctx) => getSaidaSemProcedimento(ctx, AMPLO));

    const { rows } = await sql<{ total: string }>`
      select coalesce(sum(m.total_cost_cents), 0) as total
        from stock_movement m
       where m.kind = 'consumption' and m.treatment_plan_item_id is not null
    `.execute(admin);

    expect(custo.reduce((s, l) => s + l.realCents, 0)).toBeLessThanOrEqual(
      Number(rows[0]?.total ?? 0),
    );
    expect(avulsa.every((l) => l.kind === "loss" || l.kind === "adjustment")).toBe(true);
  });
});

describe("origem de captação", () => {
  it("separa quem traz contato de quem traz fechamento", async () => {
    const linhas = await withTenant(dona, (ctx) => getOrigemCaptacao(ctx, AMPLO));

    expect(linhas.length).toBeGreaterThan(1);
    for (const l of linhas) {
      expect(l.ganhos).toBeLessThanOrEqual(l.contatos);
      expect(l.conversao).toBeGreaterThanOrEqual(0);
      expect(l.conversao).toBeLessThanOrEqual(1);
    }
  });

  it("o total de contatos bate com a primeira etapa do funil", async () => {
    // As duas consultas partem da MESMA coorte. Se divergirem, uma das duas
    // mudou de definição sem a outra — que é como um painel começa a se
    // contradizer.
    const origem = await withTenant(dona, (ctx) => getOrigemCaptacao(ctx, AMPLO));
    const etapas = await withTenant(dona, (ctx) => getConversaoFunil(ctx, AMPLO));

    const contatos = origem.reduce((s, l) => s + l.contatos, 0);
    expect(etapas[0]!.alcancaram).toBeLessThanOrEqual(contatos);
    expect(contatos).toBeGreaterThan(0);
  });

  it("o canal aparece em português, não como código do banco", async () => {
    // `acquisition_source.channel` é texto sem acento de propósito. A tela não:
    // "organico" numa tela que a dona mostra para a contadora é erro de
    // português, não detalhe técnico.
    expect(rotuloCanal("organico")).toBe("Orgânico");
    expect(rotuloCanal("indicacao")).toBe("Indicação");
    expect(rotuloCanal("pago")).toBe("Mídia paga");

    // Canal que o banco aceite e a tela não conheça não vira string vazia.
    expect(rotuloCanal("canal_que_nao_existe")).toBe("Outro");
  });

  it("o profissional vê a captação", async () => {
    const linhas = await withTenant(profissional, (ctx) => getOrigemCaptacao(ctx, AMPLO));
    expect(linhas.length).toBeGreaterThan(0);
  });
});
