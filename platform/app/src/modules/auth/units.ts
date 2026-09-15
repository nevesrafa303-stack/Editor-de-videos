/**
 * Unidades ao alcance da sessao.
 *
 * `session.unitIds` vazio significa "todas as unidades da rede" — um papel de
 * coordenacao que circula. A consulta respeita isso em vez de exigir vinculo
 * explicito, senao a dona da rede nao trocaria de unidade.
 */
import type { TenantContext } from "@/server/context";

export type UnitOption = { id: string; name: string; city: string | null };

export async function listReachableUnits(ctx: TenantContext): Promise<UnitOption[]> {
  let query = ctx.db
    .selectFrom("unit")
    .select(["id", "name", "city"])
    .where("is_active", "=", true)
    .where("deleted_at", "is", null);

  if (ctx.session.unitIds.length > 0) {
    query = query.where("id", "in", ctx.session.unitIds);
  }

  const rows = await query.orderBy("name", "asc").execute();

  return rows.map((u) => ({ id: u.id as string, name: u.name, city: u.city }));
}
