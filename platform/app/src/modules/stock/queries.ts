/**
 * Consultas do estoque.
 *
 * Uma regra atravessa o arquivo: SALDO SE SOMA, NUNCA SE LE DE UMA LINHA SO.
 * `stock_balance` e por (unidade, produto, lote, local) — quatro dimensoes —
 * e ler uma linha daria o saldo de um lote num local, que nao e a pergunta que
 * ninguem faz. A pergunta e "quanto tem de resina aqui", e isso e soma.
 *
 * Toda quantidade devolvida esta em UNIDADE DE ESTOQUE (frasco, seringa,
 * tubo), pela decisao da migration 0032.
 */
import { sql } from "kysely";
import type { TenantContext } from "@/server/context";
import { NotFound } from "@/shared/errors";
import { toValidationError } from "@/shared/zod";
import {
  listProductsSchema,
  type ListProductsInput,
} from "@/modules/stock/schema";

/**
 * De qual estoque estamos falando.
 *
 * A UNIDADE ATIVA manda. Estoque e a coisa mais local que existe num produto de
 * rede: ninguem conta o armario de outra cidade, e todas as acoes destas telas
 * — entrada, perda, acerto — gravam na unidade ativa. Mostrar o saldo somado da
 * rede ao lado de um botao que mexe em uma unidade so e como a tela dizia
 * "49,85 tubos" e o acerto de 20 nao batia: dois numeros para duas perguntas
 * diferentes, na mesma tela, sem dizer qual e qual.
 *
 * Sem unidade ativa (papel de coordenacao que circula), cai para tudo o que a
 * sessao alcanca — e ai o total da rede e a resposta certa mesmo.
 */
function noAlcance(ctx: TenantContext, coluna: string) {
  const ativa = ctx.session.activeUnitId;
  if (ativa) return sql`and ${sql.raw(coluna)} = ${ativa}::uuid`;

  const unidades = ctx.session.unitIds;
  return unidades.length > 0
    ? sql`and ${sql.raw(coluna)} = any(${unidades}::uuid[])`
    : sql``;
}

export type ProdutoLinha = {
  id: string;
  code: string;
  nome: string;
  marca: string | null;
  tipo: string;
  stockUnit: string;
  usageUnit: string;
  saldo: number;
  minimo: number;
  exigeLote: boolean;
  refrigerado: boolean;
  custoCents: number;
  valorEmEstoqueCents: number;
  /** Lotes com saldo que vencem nos proximos 60 dias. */
  lotesVencendo: number;
  /** Menor validade entre os lotes com saldo. */
  proximaValidade: string | null;
};

export async function listProducts(
  ctx: TenantContext,
  input: ListProductsInput = {},
): Promise<ProdutoLinha[]> {
  ctx.assert("inventory.read");

  const r = listProductsSchema.safeParse(input);
  if (!r.success) throw toValidationError(r.error, "Confira o filtro.");
  const filtro = r.data;

  const busca = filtro.search?.length ? `%${filtro.search}%` : null;

  const linhas = await sql<{
    id: string;
    code: string;
    nome: string;
    marca: string | null;
    tipo: string;
    stock_unit: string;
    usage_unit: string;
    saldo: string;
    minimo: string;
    exige_lote: boolean;
    refrigerado: boolean;
    custo_cents: string;
    valor_cents: string;
    lotes_vencendo: string;
    proxima_validade: string | null;
  }>`
    with saldo as (
      select sb.product_id,
             sum(sb.quantity) as quantidade,
             -- Valor a custo do LOTE, caindo para o custo de catalogo quando
             -- o produto nao tem lote. A primeira versao usava zero no lugar
             -- do catalogo, e a tela mostrava "R$ 0,00 parado" em cima de 20
             -- tubos de resina — enquanto o total la em cima contava os mesmos
             -- 20 tubos. Dois numeros para a mesma coisa, na mesma tela.
             sum(sb.quantity * coalesce(pl.unit_cost_cents, cat.default_cost_cents))::bigint as valor_cents,
             count(*) filter (
               where sb.quantity > 0
                 and pl.expires_on is not null
                 and pl.expires_on <= current_date + 60
             ) as lotes_vencendo,
             min(pl.expires_on) filter (where sb.quantity > 0) as proxima_validade
        from stock_balance sb
        join product cat on cat.id = sb.product_id
        left join product_lot pl on pl.id = sb.lot_id
       where true ${noAlcance(ctx, "sb.unit_id")}
       group by sb.product_id
    )
    select
      p.id, p.code, p.name as nome, p.brand as marca, p.kind::text as tipo,
      p.stock_unit, p.usage_unit,
      coalesce(s.quantidade, 0) as saldo,
      p.min_quantity as minimo,
      p.requires_lot as exige_lote,
      p.requires_refrigeration as refrigerado,
      p.default_cost_cents as custo_cents,
      coalesce(s.valor_cents, 0) as valor_cents,
      coalesce(s.lotes_vencendo, 0) as lotes_vencendo,
      s.proxima_validade
      from product p
      left join saldo s on s.product_id = p.id
     where p.is_active
       and (${busca}::text is null
            or p.name ilike ${busca} or p.code ilike ${busca} or p.brand ilike ${busca})
       and (${filtro.recorte}::text <> 'abaixo'
            or coalesce(s.quantidade, 0) <= p.min_quantity)
       and (${filtro.recorte}::text <> 'vencendo'
            or coalesce(s.lotes_vencendo, 0) > 0)
       and (${filtro.productId ?? null}::uuid is null or p.id = ${filtro.productId ?? null}::uuid)
     order by
       -- Quem esta abaixo do minimo sobe: a lista existe para essa linha.
       (coalesce(s.quantidade, 0) <= p.min_quantity) desc,
       p.name
  `.execute(ctx.db);

  return linhas.rows.map((l) => ({
    id: l.id,
    code: l.code,
    nome: l.nome,
    marca: l.marca,
    tipo: l.tipo,
    stockUnit: l.stock_unit,
    usageUnit: l.usage_unit,
    saldo: Number(l.saldo),
    minimo: Number(l.minimo),
    exigeLote: l.exige_lote,
    refrigerado: l.refrigerado,
    custoCents: Number(l.custo_cents),
    valorEmEstoqueCents: Number(l.valor_cents),
    lotesVencendo: Number(l.lotes_vencendo),
    proximaValidade: l.proxima_validade,
  }));
}

export type ResumoEstoque = {
  abaixoDoMinimo: number;
  vencendoEm60: number;
  vencidosComSaldo: number;
  valorEmEstoqueCents: number;
};

export async function getStockSummary(ctx: TenantContext): Promise<ResumoEstoque> {
  ctx.assert("inventory.read");

  const linha = await sql<{
    abaixo: string;
    vencendo: string;
    vencidos: string;
    valor_cents: string;
  }>`
    with saldo as (
      select sb.product_id, sb.lot_id, sum(sb.quantity) as quantidade
        from stock_balance sb
       where true ${noAlcance(ctx, "sb.unit_id")}
       group by sb.product_id, sb.lot_id
    ),
    por_produto as (
      select s.product_id, sum(s.quantidade) as quantidade
        from saldo s group by s.product_id
    )
    select
      (select count(*) from product p
        left join por_produto pp on pp.product_id = p.id
       where p.is_active and coalesce(pp.quantidade, 0) <= p.min_quantity) as abaixo,

      -- Vencendo e VENCIDO sao contagens separadas porque sao acoes
      -- diferentes: uma e comprar antes de perder, a outra e dar baixa de
      -- perda hoje. Somar as duas esconde a que ja passou do ponto.
      (select count(*) from saldo s
        join product_lot pl on pl.id = s.lot_id
       where s.quantidade > 0
         and pl.expires_on between current_date and current_date + 60) as vencendo,

      (select count(*) from saldo s
        join product_lot pl on pl.id = s.lot_id
       where s.quantidade > 0 and pl.expires_on < current_date) as vencidos,

      (select coalesce(sum(s.quantidade * coalesce(pl.unit_cost_cents, p.default_cost_cents)), 0)::bigint
         from saldo s
         join product p on p.id = s.product_id
         left join product_lot pl on pl.id = s.lot_id
        where s.quantidade > 0) as valor_cents
  `.execute(ctx.db);

  const r = linha.rows[0];
  return {
    abaixoDoMinimo: Number(r?.abaixo ?? 0),
    vencendoEm60: Number(r?.vencendo ?? 0),
    vencidosComSaldo: Number(r?.vencidos ?? 0),
    valorEmEstoqueCents: Number(r?.valor_cents ?? 0),
  };
}

export type LoteLinha = {
  id: string;
  numero: string;
  validade: string;
  saldo: number;
  custoCents: number;
  bloqueado: boolean;
  motivoBloqueio: string | null;
  diasParaVencer: number;
};

export type MovimentoLinha = {
  id: string;
  kind: string;
  quantidade: number;
  custoTotalCents: number;
  lote: string | null;
  motivo: string | null;
  paciente: string | null;
  pacienteId: string | null;
  autor: string | null;
  em: Date;
};

export type ProdutoDetalhe = ProdutoLinha & {
  fatorConversao: number;
  lotes: LoteLinha[];
  movimentos: MovimentoLinha[];
};

export async function getProduct(ctx: TenantContext, id: string): Promise<ProdutoDetalhe> {
  ctx.assert("inventory.read");

  // Reaproveita a linha da lista em vez de repetir o calculo de saldo: dois
  // lugares somando estoque e dois lugares para divergir, e a ficha do produto
  // e justamente onde alguem confere o numero da lista.
  const produto = (await listProducts(ctx, { productId: id }))[0];
  if (!produto) throw new NotFound("Produto não encontrado.");

  const [fator, lotes, movimentos] = await Promise.all([
    ctx.db
      .selectFrom("product")
      .select("conversion_factor")
      .where("id", "=", id)
      .executeTakeFirst(),

    sql<{
      id: string;
      numero: string;
      validade: string;
      saldo: string;
      custo_cents: string;
      bloqueado: boolean;
      motivo: string | null;
      dias: string;
    }>`
      select pl.id, pl.lot_number as numero, pl.expires_on as validade,
             coalesce(sum(sb.quantity), 0) as saldo,
             pl.unit_cost_cents as custo_cents,
             pl.is_blocked as bloqueado, pl.blocked_reason as motivo,
             (pl.expires_on - current_date) as dias
        from product_lot pl
        left join stock_balance sb
               on sb.lot_id = pl.id ${noAlcance(ctx, "sb.unit_id")}
       where pl.product_id = ${id}
       group by pl.id
      having coalesce(sum(sb.quantity), 0) <> 0 or pl.expires_on >= current_date
       order by pl.expires_on
    `.execute(ctx.db),

    sql<{
      id: string;
      kind: string;
      quantity: string;
      total_cost_cents: string;
      lote: string | null;
      reason: string | null;
      paciente: string | null;
      paciente_id: string | null;
      autor: string | null;
      occurred_at: Date;
    }>`
      select m.id, m.kind::text, m.quantity, m.total_cost_cents,
             pl.lot_number as lote, m.reason,
             pa.full_name as paciente, pa.id as paciente_id,
             au.full_name as autor, m.occurred_at
        from stock_movement m
        left join product_lot pl on pl.id = m.lot_id
        left join patient pa on pa.id = m.patient_id
        left join membership me on me.id = m.performed_by
        left join app_user au on au.id = me.user_id
       where m.product_id = ${id} ${noAlcance(ctx, "m.unit_id")}
       order by m.occurred_at desc, m.id desc
       limit 40
    `.execute(ctx.db),
  ]);

  return {
    ...produto,
    fatorConversao: Number(fator?.conversion_factor ?? 1),
    lotes: lotes.rows.map((l) => ({
      id: l.id,
      numero: l.numero,
      validade: l.validade,
      saldo: Number(l.saldo),
      custoCents: Number(l.custo_cents),
      bloqueado: l.bloqueado,
      motivoBloqueio: l.motivo,
      diasParaVencer: Number(l.dias),
    })),
    movimentos: movimentos.rows.map((m) => ({
      id: m.id,
      kind: m.kind,
      quantidade: Number(m.quantity),
      custoTotalCents: Number(m.total_cost_cents),
      lote: m.lote,
      motivo: m.reason,
      paciente: m.paciente,
      pacienteId: m.paciente_id,
      autor: m.autor,
      em: m.occurred_at,
    })),
  };
}

export type LoteVencendo = {
  id: string;
  produtoId: string;
  produto: string;
  stockUnit: string;
  numero: string;
  validade: string;
  diasParaVencer: number;
  saldo: number;
  valorCents: number;
};

/**
 * A fila que a clinica olha toda semana.
 *
 * Inclui o que JA VENCEU e ainda tem saldo, e nao so o que vai vencer. Lote
 * vencido com saldo nao e historia antiga: e material na prateleira que ainda
 * pode ser pego por engano, e a baixa de perda que ninguem deu.
 */
export async function listExpiringLots(
  ctx: TenantContext,
  dias = 90,
): Promise<LoteVencendo[]> {
  ctx.assert("inventory.read");

  const linhas = await sql<{
    id: string;
    produto_id: string;
    produto: string;
    stock_unit: string;
    numero: string;
    validade: string;
    dias: string;
    saldo: string;
    valor_cents: string;
  }>`
    select pl.id, p.id as produto_id, p.name as produto, p.stock_unit,
           pl.lot_number as numero, pl.expires_on as validade,
           (pl.expires_on - current_date) as dias,
           sum(sb.quantity) as saldo,
           (sum(sb.quantity) * pl.unit_cost_cents)::bigint as valor_cents
      from product_lot pl
      join product p on p.id = pl.product_id
      join stock_balance sb on sb.lot_id = pl.id
     where pl.expires_on <= current_date + ${dias}::int
       ${noAlcance(ctx, "sb.unit_id")}
     group by pl.id, p.id
    having sum(sb.quantity) > 0
     order by pl.expires_on
  `.execute(ctx.db);

  return linhas.rows.map((l) => ({
    id: l.id,
    produtoId: l.produto_id,
    produto: l.produto,
    stockUnit: l.stock_unit,
    numero: l.numero,
    validade: l.validade,
    diasParaVencer: Number(l.dias),
    saldo: Number(l.saldo),
    valorCents: Number(l.valor_cents),
  }));
}

export type ConsumoPrevisto = {
  produtoId: string;
  produto: string;
  stockUnit: string;
  precisa: number;
  saldo: number;
  exigeLote: boolean;
  opcional: boolean;
};

/**
 * O que sai do estoque se este item for executado.
 *
 * Existe para a tela poder AVISAR antes, em vez de a pessoa descobrir depois
 * de clicar. Repete a conta da `consume_plan_item` de proposito: o numero da
 * previa e o numero do consumo, e se um dia divergirem o teste quebra.
 */
export async function previewConsumption(
  ctx: TenantContext,
  itemId: string,
): Promise<ConsumoPrevisto[]> {
  ctx.assert("inventory.read");

  const linhas = await sql<{
    produto_id: string;
    produto: string;
    stock_unit: string;
    precisa: string;
    saldo: string;
    exige_lote: boolean;
    opcional: boolean;
  }>`
    select
      pr.id as produto_id, pr.name as produto, pr.stock_unit,
      -- Mesmo arredondamento de quatro casas da funcao consume_plan_item, e
      -- de proposito: a previa tem de mostrar o numero que vai sair, nao o
      -- numero antes de a coluna arredondar. Sem isto a tela dizia 0,14375 e
      -- o estoque baixava 0,1438.
      round(b.quantity * i.quantity * (1 + b.waste_percent / 100.0)
            / pr.conversion_factor, 4) as precisa,
      stock_on_hand(pr.id, coalesce(
        (select a.unit_id from appointment a where a.id = i.appointment_id),
        tp.unit_id
      )) as saldo,
      pr.requires_lot as exige_lote,
      b.is_optional as opcional
      from treatment_plan_item i
      join treatment_plan tp on tp.id = i.treatment_plan_id
      join procedure_bom b on b.procedure_id = i.procedure_id
      join product pr on pr.id = b.product_id
     where i.id = ${itemId} and b.auto_consume and pr.is_active
     order by pr.name
  `.execute(ctx.db);

  return linhas.rows.map((l) => ({
    produtoId: l.produto_id,
    produto: l.produto,
    stockUnit: l.stock_unit,
    precisa: Number(l.precisa),
    saldo: Number(l.saldo),
    exigeLote: l.exige_lote,
    opcional: l.opcional,
  }));
}

export type ProdutoOpcao = {
  id: string;
  nome: string;
  code: string;
  stockUnit: string;
  exigeLote: boolean;
  custoCents: number;
};

export async function listProductOptions(ctx: TenantContext): Promise<ProdutoOpcao[]> {
  ctx.assert("inventory.read");

  const linhas = await ctx.db
    .selectFrom("product")
    .select([
      "id",
      "name as nome",
      "code",
      "stock_unit as stockUnit",
      "requires_lot as exigeLote",
      "default_cost_cents as custoCents",
    ])
    .where("is_active", "=", true)
    .orderBy("name")
    .execute();

  return linhas.map((l) => ({
    id: l.id as string,
    nome: l.nome,
    code: l.code,
    stockUnit: l.stockUnit,
    exigeLote: l.exigeLote,
    custoCents: Number(l.custoCents),
  }));
}


export type ExecucaoRecente = {
  id: string;
  descricao: string;
  onde: string | null;
  executadoEm: Date;
  profissional: string | null;
  /** Quantas movimentacoes de estoque sairam por causa dela. */
  materiais: number;
};

/**
 * O que foi executado e ainda pode ser desfeito.
 *
 * Existe para o "cliquei no dente errado" ter caminho de volta na mesma tela
 * em que o erro aconteceu. Sem lista, desfazer viraria suporte por telefone.
 *
 * A janela e curta de proposito: desfazer execucao de tres meses atras nao e
 * correcao de clique, e mexer no estoque de um mes ja fechado. Fora da janela
 * o caminho e outro — perda ou acerto de inventario, com motivo.
 */
export async function listRecentExecutions(
  ctx: TenantContext,
  patientId: string,
  dias = 7,
): Promise<ExecucaoRecente[]> {
  ctx.assert("treatment_plan.read");

  const linhas = await sql<{
    id: string;
    descricao: string;
    onde: string | null;
    executado_em: Date;
    profissional: string | null;
    materiais: string;
  }>`
    select i.id, i.description as descricao,
           coalesce(
             case when i.tooth_code is not null then 'Dente ' || i.tooth_code end,
             i.region_code
           ) as onde,
           i.executed_at as executado_em,
           au.full_name as profissional,
           (select count(*) from stock_movement m
             where m.treatment_plan_item_id = i.id and m.kind = 'consumption') as materiais
      from treatment_plan_item i
      join treatment_plan tp on tp.id = i.treatment_plan_id
      left join membership me on me.id = i.executed_by
      left join app_user au on au.id = me.user_id
     where tp.patient_id = ${patientId}
       and i.status = 'executed'
       and i.executed_at >= now() - (${dias}::int || ' days')::interval
     order by i.executed_at desc
     limit 10
  `.execute(ctx.db);

  return linhas.rows.map((l) => ({
    id: l.id,
    descricao: l.descricao,
    onde: l.onde,
    executadoEm: l.executado_em,
    profissional: l.profissional,
    materiais: Number(l.materiais),
  }));
}
