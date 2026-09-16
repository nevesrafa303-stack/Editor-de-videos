/**
 * Comandos do estoque.
 *
 * Nenhum deles escreve saldo. Saldo e consequencia: a trigger `stock_movement_apply`
 * o mantem a partir das movimentacoes, e movimentacao e append-only. Corrigir
 * estoque e lancar movimento, nunca editar numero — e o que faz a soma do
 * historico bater com a prateleira.
 */
import { sql } from "kysely";
import type { TenantContext } from "@/server/context";
import { BusinessRuleError, NotFound, ValidationError } from "@/shared/errors";
import { translatePgError } from "@/shared/postgres-errors";
import { toValidationError } from "@/shared/zod";
import {
  adjustSchema,
  executeItemSchema,
  lossSchema,
  purchaseSchema,
  revertItemSchema,
  type AdjustInput,
  type ExecuteItemInput,
  type LossInput,
  type PurchaseInput,
  type RevertItemInput,
} from "@/modules/stock/schema";


/**
 * Quanto vale uma unidade deste produto, para valorar a movimentacao.
 *
 * Custo do LOTE quando ha lote, custo de catalogo quando nao ha. Nao e detalhe
 * de arredondamento: `total_cost_cents` e coluna GERADA a partir de
 * `unit_cost_cents`, e a movimentacao e append-only. Entrar com zero significa
 * que aquela perda vale zero para sempre — a clinica joga dois tubos fora e o
 * relatorio de desperdicio diz "R$ 0,00", que e pior do que nao ter relatorio.
 */
async function custoUnitario(
  ctx: TenantContext,
  productId: string,
  lotId: string | null,
): Promise<number> {
  if (lotId) {
    const lote = await ctx.db
      .selectFrom("product_lot")
      .select("unit_cost_cents")
      .where("id", "=", lotId)
      .executeTakeFirst();

    const custo = Number(lote?.unit_cost_cents ?? 0);
    if (custo > 0) return custo;
  }

  const produto = await ctx.db
    .selectFrom("product")
    .select("default_cost_cents")
    .where("id", "=", productId)
    .executeTakeFirst();

  return Number(produto?.default_cost_cents ?? 0);
}

/**
 * Entrada de material, com o lote nascendo junto.
 *
 * Produto com rastreio EXIGE numero de lote e validade. Nao e burocracia: sem
 * eles nao existe recall reverso — a pergunta "quem recebeu deste lote" fica
 * sem resposta, e ela e a unica coisa que a clinica tem numa fiscalizacao.
 */
export async function registerPurchase(
  ctx: TenantContext,
  input: PurchaseInput,
): Promise<{ movementId: string; lotId: string | null }> {
  ctx.assert("inventory.write");
  const parsed = purchaseSchema.safeParse(input);
  if (!parsed.success) throw toValidationError(parsed.error, "Confira os dados da entrada.");
  const dados = parsed.data;

  const produto = await ctx.db
    .selectFrom("product")
    .select(["id", "name", "requires_lot", "default_cost_cents"])
    .where("id", "=", dados.productId)
    .executeTakeFirst();

  if (!produto) throw new NotFound("Produto não encontrado.");

  if (produto.requires_lot) {
    const faltando: Record<string, string[]> = {};
    if (!dados.lotNumber) faltando["lotNumber"] = ["Este produto exige número de lote."];
    if (!dados.expiresOn) faltando["expiresOn"] = ["Este produto exige data de validade."];

    if (Object.keys(faltando).length > 0) {
      throw new ValidationError(
        faltando,
        `${produto.name} tem controle de lote: sem número e validade não há como rastrear.`,
      );
    }
  }

  const custo = dados.unitCostCents > 0 ? dados.unitCostCents : produto.default_cost_cents;

  // Sem `transaction()` aninhada: `withTenant` ja abriu uma, e e nela que o
  // contexto de RLS vive. Abrir outra por dentro perderia o `set_config`
  // local — e a segunda transacao leria o banco sem tenant nenhum.
  let lotId: string | null = null;

  if (dados.lotNumber) {
      // Lote que ja existe recebe mais quantidade em vez de virar duplicata: a
      // mesma caixa comprada duas vezes e o mesmo lote, e dois registros dele
      // quebrariam o rastreio em duas metades.
    const existente = await ctx.db
      .selectFrom("product_lot")
      .select("id")
      .where("product_id", "=", dados.productId)
      .where("lot_number", "=", dados.lotNumber)
      .executeTakeFirst();

    if (existente) {
      lotId = existente.id as string;
    } else {
      const novo = await ctx.db
        .insertInto("product_lot")
        .values({
          tenant_id: ctx.session.tenantId,
          product_id: dados.productId,
          lot_number: dados.lotNumber,
          expires_on: dados.expiresOn as unknown as Date,
          unit_cost_cents: BigInt(custo) as unknown as number,
          invoice_number: dados.invoiceNumber,
        })
        .returning("id")
        .executeTakeFirstOrThrow();

      lotId = novo.id as string;
    }
  }

  const movimento = await ctx.db
    .insertInto("stock_movement")
    .values({
      tenant_id: ctx.session.tenantId,
      unit_id: ctx.unitId(),
      product_id: dados.productId,
      lot_id: lotId,
      kind: "purchase",
      quantity: String(dados.quantity) as unknown as number,
      unit_cost_cents: BigInt(custo) as unknown as number,
      reason: dados.notes,
      performed_by: ctx.session.membershipId,
    })
    .returning("id")
    .executeTakeFirstOrThrow();

  return { movementId: movimento.id as string, lotId };
}

/** Perda: quebrou, caiu, venceu. Sai do estoque com motivo e autor. */
export async function registerLoss(ctx: TenantContext, input: LossInput): Promise<string> {
  ctx.assert("inventory.write");
  const parsed = lossSchema.safeParse(input);
  if (!parsed.success) throw toValidationError(parsed.error, "Confira os dados da perda.");
  const dados = parsed.data;

  const movimento = await ctx.db
    .insertInto("stock_movement")
    .values({
      tenant_id: ctx.session.tenantId,
      unit_id: ctx.unitId(),
      product_id: dados.productId,
      lot_id: dados.lotId ?? null,
      kind: "loss",
      quantity: String(-dados.quantity) as unknown as number,
      unit_cost_cents: BigInt(
        await custoUnitario(ctx, dados.productId, dados.lotId ?? null),
      ) as unknown as number,
      reason: dados.reason,
      performed_by: ctx.session.membershipId,
    })
    .returning("id")
    .executeTakeFirstOrThrow();

  return movimento.id as string;
}

/**
 * Acerto de inventario.
 *
 * Recebe o saldo CONTADO e calcula a diferenca. Fazer o contrario — pedir a
 * diferenca — transfere para quem esta com a prancheta na mao uma subtracao
 * com sinal, que e exatamente onde o erro entra.
 */
export async function adjustBalance(
  ctx: TenantContext,
  input: AdjustInput,
): Promise<{ movementId: string | null; diferenca: number }> {
  ctx.assert("inventory.write");
  const parsed = adjustSchema.safeParse(input);
  if (!parsed.success) throw toValidationError(parsed.error, "Confira os dados do acerto.");
  const dados = parsed.data;

  const atual = await sql<{ saldo: string }>`
    select coalesce(sum(quantity), 0) as saldo
      from stock_balance
     where product_id = ${dados.productId}
       and unit_id = ${ctx.unitId()}
       and lot_id is not distinct from ${dados.lotId ?? null}::uuid
  `.execute(ctx.db);

  const saldo = Number(atual.rows[0]?.saldo ?? 0);
  const diferenca = Number((dados.countedQuantity - saldo).toFixed(4));

  // Contagem que bate nao vira movimentacao. Lancar zero sujaria o historico
  // com linhas que nao aconteceram, e o historico e o que se le para entender
  // uma divergencia.
  if (diferenca === 0) return { movementId: null, diferenca: 0 };

  const movimento = await ctx.db
    .insertInto("stock_movement")
    .values({
      tenant_id: ctx.session.tenantId,
      unit_id: ctx.unitId(),
      product_id: dados.productId,
      lot_id: dados.lotId ?? null,
      kind: "adjustment",
      quantity: String(diferenca) as unknown as number,
      unit_cost_cents: BigInt(
        await custoUnitario(ctx, dados.productId, dados.lotId ?? null),
      ) as unknown as number,
      reason: dados.reason,
      performed_by: ctx.session.membershipId,
    })
    .returning("id")
    .executeTakeFirstOrThrow();

  return { movementId: movimento.id as string, diferenca };
}

/**
 * Executar o procedimento — e o material sair da prateleira junto.
 *
 * As duas coisas acontecem na MESMA transacao, e e o ponto da fatia. Marcar
 * "feito" numa tela e dar baixa em outra e o desenho que garante que as duas
 * vao divergir: a primeira sempre acontece, a segunda depende de alguem
 * lembrar.
 */
export async function executePlanItem(
  ctx: TenantContext,
  input: ExecuteItemInput,
): Promise<number> {
  ctx.assert("treatment_plan.execute");
  const parsed = executeItemSchema.safeParse(input);
  if (!parsed.success) throw toValidationError(parsed.error, "Confira o item.");
  const dados = parsed.data;

  try {
    const r = await sql<{ movimentos: number }>`
      select execute_plan_item(
        ${dados.itemId}::uuid,
        ${ctx.unitId()}::uuid,
        ${dados.appointmentId ?? null}::uuid
      ) as movimentos
    `.execute(ctx.db);

    return Number(r.rows[0]?.movimentos ?? 0);
  } catch (erro) {
    throw translatePgError(erro);
  }
}

/** Desfaz a execucao devolvendo o material ao lote de onde saiu. */
export async function revertPlanItem(
  ctx: TenantContext,
  input: RevertItemInput,
): Promise<number> {
  ctx.assert("treatment_plan.execute");
  const parsed = revertItemSchema.safeParse(input);
  if (!parsed.success) throw toValidationError(parsed.error, "Confira o estorno.");
  const dados = parsed.data;

  try {
    const r = await sql<{ estornos: number }>`
      select revert_plan_item(${dados.itemId}::uuid, ${dados.reason}::text) as estornos
    `.execute(ctx.db);

    return Number(r.rows[0]?.estornos ?? 0);
  } catch (erro) {
    throw translatePgError(erro);
  }
}

/** Bloqueio sanitario de lote: recall, suspeita, fiscalizacao. */
export async function blockLot(
  ctx: TenantContext,
  lotId: string,
  reason: string,
): Promise<void> {
  ctx.assert("inventory.write");

  if (reason.trim().length < 3) {
    throw new BusinessRuleError("Diga por que o lote está sendo bloqueado.");
  }

  const r = await ctx.db
    .updateTable("product_lot")
    .set({ is_blocked: true, blocked_reason: reason.trim() })
    .where("id", "=", lotId)
    .executeTakeFirst();

  if (Number(r.numUpdatedRows) === 0) throw new NotFound("Lote não encontrado.");
}

export async function unblockLot(ctx: TenantContext, lotId: string): Promise<void> {
  ctx.assert("inventory.write");

  const r = await ctx.db
    .updateTable("product_lot")
    .set({ is_blocked: false, blocked_reason: null })
    .where("id", "=", lotId)
    .executeTakeFirst();

  if (Number(r.numUpdatedRows) === 0) throw new NotFound("Lote não encontrado.");
}
