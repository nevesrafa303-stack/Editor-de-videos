/**
 * Escritas de convenio.
 *
 * O preco de convenio mora numa `price_list` propria, versionada como qualquer
 * outra: orcamento antigo nao muda quando a tabela muda. A lista e criada na
 * primeira vez que alguem define um preco — cadastrar convenio nao deveria
 * exigir entender o que e uma tabela de precos.
 */
import type { TenantContext } from "@/server/context";
import { Conflict, NotFound } from "@/shared/errors";
import { toValidationError } from "@/shared/zod";
import {
  savePayerSchema,
  setPriceSchema,
  type SavePayerInput,
  type SetPriceInput,
} from "@/modules/payer/schema";

export async function savePayer(
  ctx: TenantContext,
  input: SavePayerInput,
): Promise<{ id: string }> {
  ctx.assert("price.write");

  const parsed = savePayerSchema.safeParse(input);
  if (!parsed.success) throw toValidationError(parsed.error, "Confira os dados do convênio.");
  const data = parsed.data;

  const valores = {
    code: data.code,
    name: data.name,
    kind: data.kind,
    billing_mode: data.billingMode,
    settlement_days: data.settlementDays,
    admin_fee_percent: String(data.adminFeePercent),
    notes: data.notes,
    is_active: data.isActive,
  };

  if (data.id) {
    const row = await ctx.db
      .updateTable("payer")
      .set(valores)
      .where("id", "=", data.id)
      .returning("id")
      .executeTakeFirst();

    if (!row) throw new NotFound("Convênio");
    return { id: row.id as string };
  }

  const duplicado = await ctx.db
    .selectFrom("payer")
    .select("name")
    .where("code", "=", data.code)
    .executeTakeFirst();

  if (duplicado) {
    throw new Conflict(`O código ${data.code} já é do convênio ${duplicado.name}.`);
  }

  const row = await ctx.db
    .insertInto("payer")
    .values({ tenant_id: ctx.session.tenantId, ...valores })
    .returning("id")
    .executeTakeFirstOrThrow();

  return { id: row.id as string };
}

/**
 * Define o preco de um procedimento para o convenio.
 *
 * Preco zero significa "este convenio nao cobre": a linha e removida, e o
 * orcamento volta a usar a tabela particular. Guardar zero faria o
 * procedimento aparecer como gratuito na proposta.
 */
export async function setPayerPrice(ctx: TenantContext, input: SetPriceInput): Promise<void> {
  ctx.assert("price.write");

  const parsed = setPriceSchema.safeParse(input);
  if (!parsed.success) throw toValidationError(parsed.error, "Confira o preço.");
  const data = parsed.data;

  const convenio = await ctx.db
    .selectFrom("payer")
    .select(["id", "code", "name"])
    .where("id", "=", data.payerId)
    .executeTakeFirst();

  if (!convenio) throw new NotFound("Convênio");

  const lista = await listaAtiva(ctx, convenio.id as string, convenio.code, convenio.name);

  if (data.priceCents === 0) {
    await ctx.db
      .deleteFrom("price_list_item")
      .where("price_list_id", "=", lista)
      .where("procedure_id", "=", data.procedureId)
      .execute();
    return;
  }

  // O custo previsto vem da particular: e o mesmo insumo, independentemente de
  // quem paga. Sem ele, a margem do convenio apareceria como 100%.
  const custo = await ctx.db
    .selectFrom("price_list as pl")
    .innerJoin("price_list_item as pli", "pli.price_list_id", "pl.id")
    .select("pli.expected_cost_cents")
    .where("pl.payer_id", "is", null)
    .where("pl.status", "=", "active")
    .where("pli.procedure_id", "=", data.procedureId)
    .executeTakeFirst();

  await ctx.db
    .insertInto("price_list_item")
    .values({
      tenant_id: ctx.session.tenantId,
      price_list_id: lista,
      procedure_id: data.procedureId,
      price_cents: data.priceCents,
      expected_cost_cents: custo?.expected_cost_cents ?? 0,
      max_discount_percent: String(data.maxDiscountPercent),
    })
    .onConflict((oc) =>
      oc.columns(["price_list_id", "procedure_id"]).doUpdateSet({
        price_cents: data.priceCents,
        max_discount_percent: String(data.maxDiscountPercent),
        expected_cost_cents: custo?.expected_cost_cents ?? 0,
      }),
    )
    .execute();
}

/** A tabela ativa do convenio, criada na primeira vez que se define um preco. */
async function listaAtiva(
  ctx: TenantContext,
  payerId: string,
  code: string,
  name: string,
): Promise<string> {
  const existente = await ctx.db
    .selectFrom("price_list")
    .select("id")
    .where("payer_id", "=", payerId)
    .where("status", "=", "active")
    .executeTakeFirst();

  if (existente) return existente.id as string;

  const criada = await ctx.db
    .insertInto("price_list")
    .values({
      tenant_id: ctx.session.tenantId,
      payer_id: payerId,
      code: `${code}_${new Date().getFullYear()}`,
      name: `${name} ${new Date().getFullYear()}`,
      status: "active",
      activated_at: new Date(),
      created_by: ctx.session.membershipId,
    })
    .returning("id")
    .executeTakeFirstOrThrow();

  return criada.id as string;
}
