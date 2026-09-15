/**
 * Funil de vendas, pela camada de acesso.
 *
 * A suíte SQL já prova as invariantes no banco. Aqui o que se prova é o
 * CAMINHO: que a permissão certa barra, que a recusa chega como frase de
 * produto, e que o quadro soma o que a tela vai mostrar.
 *
 * O teste que mais importa é o último: ganhar no funil e ter dinheiro no
 * financeiro são o mesmo evento. É a razão de este módulo existir ligado ao
 * orçamento em vez de solto.
 */
process.env.DB_POOL_MAX = "1";

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { closeDb } from "@/server/db";
import { withTenant, type TenantSession } from "@/server/context";
import {
  completeTask,
  convertLead,
  createLead,
  createTask,
  getBoard,
  getOpportunity,
  listLossReasons,
  listOpenTasks,
  listStages,
  logActivity,
  loseOpportunity,
  moveStage,
  reopenOpportunity,
} from "@/modules/funnel";
import { acceptQuote, addQuoteItem, changeQuoteStatus, createQuote } from "@/modules/quote";
import { Forbidden } from "@/shared/errors";
import { adminDb, entrar, SEED, USUARIOS } from "./helpers";

let dona: TenantSession;
let financeiro: TenantSession;
const admin = adminDb();

beforeAll(async () => {
  dona = (await entrar(USUARIOS.dona)).session;
  financeiro = (await entrar(USUARIOS.financeiro)).session;
});

afterAll(async () => {
  await admin.destroy();
  await closeDb();
});

let contador = 0;

/** Um contato novo, com telefone único por execução. */
async function contato(nome: string, amountCents = 300000) {
  contador += 1;
  const phone = `1198760${String(contador).padStart(4, "0")}`;

  return withTenant(dona, (ctx) =>
    createLead(ctx, {
      fullName: nome,
      phone,
      interest: `Interesse de ${nome}`,
      amountCents,
    }),
  );
}

describe("o contato entra no funil", () => {
  it("lead e negócio nascem juntos, na primeira etapa", async () => {
    const { leadId, opportunityId } = await contato("Beatriz Lemos");

    const { card, lead, stageName } = await withTenant(dona, (ctx) =>
      getOpportunity(ctx, opportunityId),
    );

    expect(lead?.id).toBe(leadId);
    expect(lead?.status).toBe("new");
    expect(card.patientId).toBeNull();
    expect(card.personName).toBe("Beatriz Lemos");
    expect(stageName).toBe("Novo lead");
  });

  it("negócio sem contato nenhum já nasce esfriando", async () => {
    const { opportunityId } = await contato("Ainda sem contato");

    const { card } = await withTenant(dona, (ctx) => getOpportunity(ctx, opportunityId));

    // Nunca tocado é exatamente o que se perde por silêncio — não é "novo
    // demais para cobrar".
    expect(card.diasSemContato).toBeNull();
    expect(card.esfriando).toBe(true);
  });

  it("quem não mexe no funil não cadastra contato", async () => {
    await expect(
      withTenant(financeiro, (ctx) =>
        createLead(ctx, { fullName: "Não devia entrar", phone: "11999990000" }),
      ),
    ).rejects.toThrow(Forbidden);
  });
});

describe("mover pelo funil", () => {
  it("move para a etapa seguinte e guarda o tempo parado", async () => {
    const { opportunityId } = await contato("Para mover");
    const { pipelineId } = await withTenant(dona, (ctx) =>
      getOpportunity(ctx, opportunityId),
    );

    const etapas = await withTenant(dona, (ctx) => listStages(ctx, pipelineId));
    const avaliacao = etapas.find((e) => e.name === "Avaliação agendada")!;

    await withTenant(dona, (ctx) =>
      moveStage(ctx, { opportunityId, stageId: avaliacao.id }),
    );

    const depois = await withTenant(dona, (ctx) => getOpportunity(ctx, opportunityId));
    expect(depois.stageName).toBe("Avaliação agendada");
    expect(depois.historico).toHaveLength(2);
  });

  it("não dá para ganhar arrastando o cartão", async () => {
    const { opportunityId } = await contato("Sem atalho");
    const { pipelineId } = await withTenant(dona, (ctx) =>
      getOpportunity(ctx, opportunityId),
    );

    const etapas = await withTenant(dona, (ctx) => listStages(ctx, pipelineId));
    const ganho = etapas.find((e) => e.isWon)!;

    await expect(
      withTenant(dona, (ctx) => moveStage(ctx, { opportunityId, stageId: ganho.id })),
    ).rejects.toThrow(/aceita o orçamento/i);
  });

  it("nem perder sem dizer por quê", async () => {
    const { opportunityId } = await contato("Sem motivo");
    const { pipelineId } = await withTenant(dona, (ctx) =>
      getOpportunity(ctx, opportunityId),
    );

    const etapas = await withTenant(dona, (ctx) => listStages(ctx, pipelineId));
    const perdido = etapas.find((e) => e.isLost)!;

    await expect(
      withTenant(dona, (ctx) => moveStage(ctx, { opportunityId, stageId: perdido.id })),
    ).rejects.toThrow(/motivo/i);
  });

  it("perder com motivo fecha, e reabrir devolve para o funil", async () => {
    const { opportunityId } = await contato("Perdida e reaberta");
    const [motivo] = await withTenant(dona, (ctx) => listLossReasons(ctx));

    await withTenant(dona, (ctx) =>
      loseOpportunity(ctx, {
        opportunityId,
        lossReasonId: motivo!.id,
        notes: "Vai fazer depois das férias.",
      }),
    );

    const perdida = await withTenant(dona, (ctx) => getOpportunity(ctx, opportunityId));
    expect(perdida.card.status).toBe("lost");
    expect(perdida.lossReason).toBe(motivo!.name);

    await withTenant(dona, (ctx) => reopenOpportunity(ctx, opportunityId));
    const reaberta = await withTenant(dona, (ctx) => getOpportunity(ctx, opportunityId));
    expect(reaberta.card.status).toBe("open");
  });
});

describe("contato e próxima ação", () => {
  it("registrar contato esquenta o negócio", async () => {
    const { opportunityId } = await contato("Para esquentar");

    await withTenant(dona, (ctx) =>
      logActivity(ctx, {
        opportunityId,
        kind: "whatsapp",
        body: "Mandei os valores e as fotos do antes e depois.",
      }),
    );

    const { card, activities } = await withTenant(dona, (ctx) =>
      getOpportunity(ctx, opportunityId),
    );

    expect(activities).toHaveLength(1);
    expect(card.lastActivityAt).not.toBeNull();
    expect(card.esfriando).toBe(false);
  });

  it("a próxima ação é a tarefa aberta mais próxima, e some quando conclui", async () => {
    const { opportunityId } = await contato("Com tarefas");

    const emDias = (d: number) =>
      new Date(Date.now() + d * 86_400_000).toISOString().slice(0, 16);

    await withTenant(dona, (ctx) =>
      createTask(ctx, { opportunityId, title: "Ligar de novo", dueAt: emDias(3) }),
    );
    await withTenant(dona, (ctx) =>
      createTask(ctx, { opportunityId, title: "Mandar o plano", dueAt: emDias(1) }),
    );

    const comTarefas = await withTenant(dona, (ctx) => getOpportunity(ctx, opportunityId));
    expect(comTarefas.tasks).toHaveLength(2);
    expect(comTarefas.card.nextActionAt).not.toBeNull();

    // Concluir a mais próxima revela a seguinte, não deixa a data velha.
    const proxima = comTarefas.tasks.find((t) => t.title === "Mandar o plano")!;
    const antes = comTarefas.card.nextActionAt!.getTime();

    await withTenant(dona, (ctx) => completeTask(ctx, proxima.id));

    const depois = await withTenant(dona, (ctx) => getOpportunity(ctx, opportunityId));
    expect(depois.card.nextActionAt!.getTime()).toBeGreaterThan(antes);
  });

  it("a fila mostra de qual negócio cada tarefa é, e de quem", async () => {
    const { opportunityId } = await contato("Na fila");
    await withTenant(dona, (ctx) =>
      createTask(ctx, {
        opportunityId,
        title: "Confirmar a avaliação",
        dueAt: new Date(Date.now() + 86_400_000).toISOString().slice(0, 16),
      }),
    );

    const tarefas = await withTenant(dona, (ctx) => listOpenTasks(ctx));
    const minha = tarefas.find((t) => t.opportunityId === opportunityId);

    expect(minha?.personName).toBe("Na fila");
    expect(minha?.opportunityTitle).toBeTruthy();
    // O responsável aparece porque a fila é da clínica, não de cada um.
    expect(minha?.assignedTo).toBeTruthy();
  });
});

describe("do lead ao dinheiro", () => {
  it("converter cria o paciente e liga o negócio nele", async () => {
    const { leadId, opportunityId } = await contato("Vira paciente");

    const { patientId } = await withTenant(dona, (ctx) => convertLead(ctx, leadId));

    const depois = await withTenant(dona, (ctx) => getOpportunity(ctx, opportunityId));
    expect(depois.card.patientId).toBe(patientId);
    expect(depois.lead?.status).toBe("converted");

    // Converter duas vezes não duplica o cadastro.
    const outra = await withTenant(dona, (ctx) => convertLead(ctx, leadId));
    expect(outra.patientId).toBe(patientId);
  });

  it("aceitar o orçamento ganha o negócio E deixa dinheiro no financeiro", async () => {
    const { leadId, opportunityId } = await contato("Fecha o ciclo", 500000);
    const { patientId } = await withTenant(dona, (ctx) => convertLead(ctx, leadId));

    const { id: quoteId } = await withTenant(dona, (ctx) =>
      createQuote(ctx, {
        patientId,
        opportunityId,
        title: "Proposta do funil",
      }),
    );

    await withTenant(dona, (ctx) =>
      addQuoteItem(ctx, {
        quoteId,
        description: "Clareamento de consultório",
        unitPriceCents: 90000,
      }),
    );

    // O valor do negócio passa a ser o do documento, não a estimativa.
    const comProposta = await withTenant(dona, (ctx) =>
      getOpportunity(ctx, opportunityId),
    );
    expect(comProposta.card.amountCents).toBe(90000);
    expect(comProposta.quotes).toHaveLength(1);

    await withTenant(dona, (ctx) => changeQuoteStatus(ctx, { quoteId, to: "sent" }));
    await withTenant(dona, (ctx) =>
      acceptQuote(ctx, { quoteId, signedBy: "Fecha o ciclo" }),
    );

    const ganha = await withTenant(dona, (ctx) => getOpportunity(ctx, opportunityId));
    expect(ganha.card.status).toBe("won");
    expect(ganha.stageName).toBe("Fechado");

    // A prova de que os dois números não divergem.
    const recebiveis = await admin
      .selectFrom("receivable")
      .select("total_cents")
      .where("quote_id", "=", quoteId)
      .execute();

    expect(recebiveis).toHaveLength(1);
    expect(Number(recebiveis[0]?.total_cents)).toBe(ganha.card.amountCents);
  });

  it("orçamento recusado NÃO perde o negócio: a conversa costuma seguir", async () => {
    const { leadId, opportunityId } = await contato("Recusou a primeira");
    const { patientId } = await withTenant(dona, (ctx) => convertLead(ctx, leadId));

    const { id: quoteId } = await withTenant(dona, (ctx) =>
      createQuote(ctx, { patientId, opportunityId, title: "Primeira proposta" }),
    );
    await withTenant(dona, (ctx) =>
      addQuoteItem(ctx, { quoteId, description: "Tratamento", unitPriceCents: 400000 }),
    );
    await withTenant(dona, (ctx) => changeQuoteStatus(ctx, { quoteId, to: "sent" }));

    const [motivo] = await withTenant(dona, (ctx) => listLossReasons(ctx));
    await withTenant(dona, (ctx) =>
      changeQuoteStatus(ctx, { quoteId, to: "rejected", lossReasonId: motivo!.id }),
    );

    const depois = await withTenant(dona, (ctx) => getOpportunity(ctx, opportunityId));
    expect(depois.card.status).toBe("open");
  });
});

describe("o que o quadro mostra", () => {
  it("soma o aberto e o previsto, e o previsto é menor", async () => {
    await contato("Para o quadro", 1000000);

    const quadro = await withTenant(dona, (ctx) => getBoard(ctx));

    expect(quadro.stages.length).toBeGreaterThan(0);
    expect(quadro.abertoCents).toBeGreaterThan(0);

    // Ponderar pela probabilidade é a diferença entre "tenho no funil" e
    // "espero fechar". A segunda é sempre menor, e é a que decide alguma coisa.
    expect(quadro.previstoCents).toBeLessThan(quadro.abertoCents);
    expect(quadro.esfriandoCount).toBeGreaterThan(0);
  });

  it("o que foi ganho no mês aparece em número, não em coluna vazia", async () => {
    const quadro = await withTenant(dona, (ctx) => getBoard(ctx));

    // O quadro só mostra os abertos, então a etapa de ganho seria uma coluna
    // vazia por construção. O número do mês diz o que ela não diria.
    expect(quadro.ganhoNoMesCount).toBeGreaterThan(0);
    expect(quadro.ganhoNoMesCents).toBeGreaterThan(0);

    const ganho = quadro.stages.find((e) => e.isWon);
    expect(ganho?.cards).toHaveLength(0);
  });

  it("negócio fechado sai do quadro", async () => {
    const { opportunityId } = await contato("Sai do quadro");
    const [motivo] = await withTenant(dona, (ctx) => listLossReasons(ctx));

    await withTenant(dona, (ctx) =>
      loseOpportunity(ctx, { opportunityId, lossReasonId: motivo!.id }),
    );

    const quadro = await withTenant(dona, (ctx) => getBoard(ctx));
    const todos = quadro.stages.flatMap((e) => e.cards);

    expect(todos.some((c) => c.id === opportunityId)).toBe(false);
  });
});
