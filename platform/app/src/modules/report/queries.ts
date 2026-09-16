/**
 * Relatorios gerenciais.
 *
 * Cinco perguntas que a dona da clinica faz toda segunda-feira, e que ate aqui
 * so tinham resposta em planilha paralela:
 *
 *   quanto cada profissional produziu e recebeu · onde o funil trava · quanto
 *   esta vencido em cada unidade · qual procedimento paga a conta · qual canal
 *   traz gente que fecha.
 *
 * Tres regras atravessam o arquivo:
 *
 * 1. NADA E MATERIALIZADO. Todo numero sai dos fatos que a operacao ja
 *    escreveu — pagamento, orcamento, historico de etapa. Nao ha coluna de
 *    total guardada para o relatorio ler; se houvesse, existiria um dia em que
 *    ela e o extrato discordam, e a partir daquele dia ninguem mais confia na
 *    tela.
 *
 * 2. O PERIODO E FECHADO, EM DATA LOCAL. `>= de 00:00` e `< ate+1 00:00`, no
 *    fuso da clinica. Comparar `timestamptz` com `date` direto usaria o fuso
 *    do servidor, e um pagamento das 21h de Sao Paulo cairia no dia seguinte.
 *
 * 3. RECEBIDO E RECEBIDO. Faturamento conta pagamento confirmado; estorno nao
 *    entra, porque o par pagamento/estorno se anula e contar o primeiro sem o
 *    segundo e inflar o mes. Quem assina esse recorte e o proprio banco: a
 *    comissao ja usa a mesma regra.
 */
import { sql } from "kysely";
import type { TenantContext } from "@/server/context";
import { toValidationError } from "@/shared/zod";
import { periodSchema, type Period, type PeriodInput } from "@/modules/report/schema";

/**
 * Le o periodo, e recusa com frase de gente.
 *
 * `periodSchema.parse` cru lancaria `ZodError`, que a borda nao sabe traduzir:
 * a pessoa digita 30/09 a 01/09 e leva um erro 500 em vez de "a data final nao
 * pode ser anterior a inicial". Um `parse` solto em consulta e sempre isso.
 */
function lerPeriodo(input: PeriodInput): Period {
  const r = periodSchema.safeParse(input);
  if (!r.success) throw toValidationError(r.error, "Confira o período escolhido.");
  return r.data;
}

/**
 * Janela do periodo como par de instantes.
 *
 * O `+ 1 day` com limite ABERTO no fim e o que inclui o ultimo dia inteiro sem
 * depender de `23:59:59` — que perde o ultimo segundo, e perde mais em bancos
 * com precisao de microssegundo.
 */
function janela(period: Period, timezone: string) {
  const inicio = sql<Date>`(${period.de}::date)::timestamp at time zone ${timezone}`;
  const fim = sql<Date>`((${period.ate}::date + 1))::timestamp at time zone ${timezone}`;
  return { inicio, fim };
}

/**
 * Recorte de unidade. `null` = tudo o que a sessao ja enxerga por RLS.
 *
 * `sql.raw` no nome da coluna e seguro aqui e so aqui: `coluna` e literal
 * escrito neste arquivo em toda chamada, nunca entrada. O VALOR — que e o que
 * vem da URL — continua parametrizado.
 */
function naUnidade(period: Period, coluna: string) {
  return period.unitId
    ? sql`and ${sql.raw(coluna)} = ${period.unitId}::uuid`
    : sql``;
}

// ------------------------------------------------------------------ resumo --

export type ResumoGerencial = {
  recebidoCents: number;
  aceitoCents: number;
  vencidoCents: number;
  ganhos: number;
  perdidos: number;
  /** Ganhos sobre negocios FECHADOS no periodo. `null` quando nada fechou. */
  taxaGanho: number | null;
};

export async function getResumo(
  ctx: TenantContext,
  input: PeriodInput,
): Promise<ResumoGerencial> {
  ctx.assert("report.financial");
  const period = lerPeriodo(input);
  const { inicio, fim } = janela(period, ctx.session.timezone);

  const linha = await sql<{
    recebido_cents: string;
    aceito_cents: string;
    vencido_cents: string;
    ganhos: string;
    perdidos: string;
  }>`
    select
      (select coalesce(sum(p.amount_cents), 0)
         from payment p
        where p.status = 'confirmed'
          and p.paid_at >= ${inicio} and p.paid_at < ${fim}
          ${naUnidade(period, "p.unit_id")}) as recebido_cents,

      (select coalesce(sum(q.total_cents), 0)
         from quote q
        where q.accepted_at >= ${inicio} and q.accepted_at < ${fim}
          and q.deleted_at is null
          ${naUnidade(period, "q.unit_id")}) as aceito_cents,

      -- Vencido NAO usa o periodo: inadimplencia e uma foto de hoje, nao um
      -- recorte de mes. Filtrar por periodo aqui responderia "o que venceu em
      -- setembro e ainda nao foi pago", que esconde o de agosto — que e
      -- justamente o que mais dói.
      (select coalesce(sum(i.amount_cents - i.paid_cents), 0)
         from installment i
        where i.status in ('open', 'partially_paid')
          and i.due_on < current_date
          ${naUnidade(period, "i.unit_id")}) as vencido_cents,

      (select count(*) from opportunity o
        where o.status = 'won' and o.deleted_at is null
          and o.closed_at >= ${inicio} and o.closed_at < ${fim}
          ${naUnidade(period, "o.unit_id")}) as ganhos,

      (select count(*) from opportunity o
        where o.status = 'lost' and o.deleted_at is null
          and o.closed_at >= ${inicio} and o.closed_at < ${fim}
          ${naUnidade(period, "o.unit_id")}) as perdidos
  `.execute(ctx.db);

  const r = linha.rows[0];
  const ganhos = Number(r?.ganhos ?? 0);
  const perdidos = Number(r?.perdidos ?? 0);
  const fechados = ganhos + perdidos;

  return {
    recebidoCents: Number(r?.recebido_cents ?? 0),
    aceitoCents: Number(r?.aceito_cents ?? 0),
    vencidoCents: Number(r?.vencido_cents ?? 0),
    ganhos,
    perdidos,
    // Zero fechado nao e 0% de conversao: e ausencia de resposta. Mostrar "0%"
    // ali seria inventar um mes ruim onde houve um mes parado.
    taxaGanho: fechados > 0 ? ganhos / fechados : null,
  };
}

// ------------------------------------------------ faturamento por profissional --

export type LinhaProfissional = {
  membershipId: string | null;
  nome: string;
  aceitoCents: number;
  recebidoCents: number;
};

/**
 * Quem produziu e quem recebeu.
 *
 * Os dois numeros sao propositalmente diferentes e ficam lado a lado: "aceito"
 * e o que a pessoa vendeu no periodo, "recebido" e o dinheiro que entrou nele —
 * e entre um e outro existe o parcelamento. Uma clinica que so olha o primeiro
 * comemora um mes que ainda nao aconteceu; uma que so olha o segundo nao ve a
 * venda parando.
 *
 * A atribuicao segue `quote.provider_id`, que e a MESMA regra que o banco ja
 * usa para decidir de quem e a comissao (`build_commission_from_payment`).
 * Duas definicoes de "quem atendeu" seria uma a mais.
 */
export async function getFaturamentoPorProfissional(
  ctx: TenantContext,
  input: PeriodInput,
): Promise<LinhaProfissional[]> {
  ctx.assert("report.financial");
  const period = lerPeriodo(input);
  const { inicio, fim } = janela(period, ctx.session.timezone);

  const linhas = await sql<{
    membership_id: string | null;
    nome: string | null;
    aceito_cents: string;
    recebido_cents: string;
  }>`
    with aceito as (
      select q.provider_id as membership_id, sum(q.total_cents) as cents
        from quote q
       where q.accepted_at >= ${inicio} and q.accepted_at < ${fim}
         and q.deleted_at is null
         ${naUnidade(period, "q.unit_id")}
       group by 1
    ),
    recebido as (
      select q.provider_id as membership_id, sum(p.amount_cents) as cents
        from payment p
        join installment i on i.id = p.installment_id
        join receivable r on r.id = i.receivable_id
        left join quote q on q.id = r.quote_id and q.deleted_at is null
       where p.status = 'confirmed'
         and p.paid_at >= ${inicio} and p.paid_at < ${fim}
         ${naUnidade(period, "p.unit_id")}
       group by 1
    ),
    -- A lista de chaves sai de um UNION, e nao de um FULL JOIN: quem vendeu e
    -- nao recebeu, e quem recebeu sem ter vendido no periodo, precisam os dois
    -- aparecer. O Postgres recusa um full join cuja condicao e is not distinct from
    -- (a condicao nao e hash nem merge joinable), e trocar por igualdade perderia
    -- exatamente a linha sem profissional — que e a que menos pode sumir,
    -- porque e a diferenca entre o relatorio e o caixa.
    chaves as (
      select membership_id from aceito
      union
      select membership_id from recebido
    )
    select
      k.membership_id,
      au.full_name as nome,
      coalesce(a.cents, 0)  as aceito_cents,
      coalesce(rc.cents, 0) as recebido_cents
      from chaves k
      left join aceito a    on a.membership_id  is not distinct from k.membership_id
      left join recebido rc on rc.membership_id is not distinct from k.membership_id
      left join membership m on m.id = k.membership_id
      left join app_user au on au.id = m.user_id
     order by coalesce(rc.cents, 0) + coalesce(a.cents, 0) desc, au.full_name
  `.execute(ctx.db);

  return linhas.rows.map((l) => ({
    membershipId: l.membership_id,
    // Recebimento sem orcamento por tras existe e e legitimo (cobranca avulsa,
    // acordo). Some-lo a alguem seria mentira; escondê-lo faria o relatorio
    // nao bater com o caixa. Fica visivel, com nome proprio.
    nome: l.nome ?? "Sem profissional vinculado",
    aceitoCents: Number(l.aceito_cents),
    recebidoCents: Number(l.recebido_cents),
  }));
}

// ------------------------------------------------------ conversao do funil --

export type EtapaFunil = {
  stageId: string;
  nome: string;
  ordem: number;
  /** Negocios do periodo que chegaram a esta etapa (ou passaram dela). */
  alcancaram: number;
  /** Fracao sobre o total de negocios abertos no periodo. */
  fracao: number;
  /** Fracao dos que chegaram na etapa anterior e avancaram. `null` na primeira. */
  avancaram: number | null;
};

/**
 * Onde o funil trava.
 *
 * A coorte e por ABERTURA, nao por movimento: "dos negocios que entraram neste
 * periodo, ate onde cada um chegou". E a unica definicao em que o denominador
 * nao se mexe embaixo do numerador — contar "quem passou pela etapa X no mes"
 * mistura negocio de marco com negocio de setembro e produz taxa maior que
 * 100% num mes de faxina no funil.
 *
 * O preco e conhecido e esta escrito na tela: negocio aberto ha tres dias
 * ainda vai andar, entao as ultimas etapas de um periodo recente sempre
 * parecem piores do que serao.
 */
export async function getConversaoFunil(
  ctx: TenantContext,
  input: PeriodInput,
): Promise<EtapaFunil[]> {
  ctx.assert("report.read");
  const period = lerPeriodo(input);
  const { inicio, fim } = janela(period, ctx.session.timezone);

  const linhas = await sql<{
    stage_id: string;
    nome: string;
    ordem: number;
    alcancaram: string;
    total: string;
  }>`
    -- Só o funil PADRÃO, dos dois lados. O schema aceita mais de um pipeline
    -- (odonto vende plano longo, HOF vende sessão), e misturar os dois num
    -- gráfico só de etapas somaria degraus que não são os mesmos. Contar no
    -- denominador um negócio de outro funil seria pior ainda: ele nunca
    -- apareceria em etapa nenhuma, e a conversão cairia sem ninguém perder
    -- negócio.
    with coorte as (
      select o.id
        from opportunity o
        join pipeline p on p.id = o.pipeline_id and p.is_default
       where o.created_at >= ${inicio} and o.created_at < ${fim}
         and o.deleted_at is null
         ${naUnidade(period, "o.unit_id")}
    ),
    -- Etapas do funil padrao, sem as de desfecho: "ganho" e "perdido" nao sao
    -- degraus do caminho, sao o fim dele — e entram no resumo, nao no funil.
    etapas as (
      select s.id, s.name, s.sort_order
        from pipeline_stage s
        join pipeline p on p.id = s.pipeline_id
       where p.is_default and not s.is_won and not s.is_lost
    ),
    -- Chegou na etapa = existe passagem por ela OU por qualquer etapa adiante.
    -- Sem o "adiante", quem pulou de "Contato" direto para "Proposta" some da
    -- linha do meio, e o funil mostra um buraco que nao existe.
    alcance as (
      select e.id as stage_id, count(distinct h.opportunity_id) as qtd
        from etapas e
        left join opportunity_stage_history h
               on h.to_stage_id in (
                    select e2.id from etapas e2 where e2.sort_order >= e.sort_order
                    union all
                    select s3.id from pipeline_stage s3
                      join pipeline p3 on p3.id = s3.pipeline_id
                     where p3.is_default and s3.is_won
                  )
              and h.opportunity_id in (select id from coorte)
       group by e.id
    )
    select e.id as stage_id, e.name as nome, e.sort_order as ordem,
           coalesce(a.qtd, 0) as alcancaram,
           (select count(*) from coorte) as total
      from etapas e
      left join alcance a on a.stage_id = e.id
     order by e.sort_order
  `.execute(ctx.db);

  const total = Number(linhas.rows[0]?.total ?? 0);

  return linhas.rows.map((l, i) => {
    const alcancaram = Number(l.alcancaram);
    const anterior = i > 0 ? Number(linhas.rows[i - 1]?.alcancaram ?? 0) : null;

    return {
      stageId: l.stage_id,
      nome: l.nome,
      ordem: l.ordem,
      alcancaram,
      fracao: total > 0 ? alcancaram / total : 0,
      avancaram: anterior === null ? null : anterior > 0 ? alcancaram / anterior : 0,
    };
  });
}

// ---------------------------------------------------- inadimplencia por unidade --

export type LinhaInadimplencia = {
  unitId: string;
  nome: string;
  vencidoCents: number;
  abertoCents: number;
  parcelas: number;
  pacientes: number;
  /** Vencido sobre tudo o que a unidade tem a receber. */
  fracao: number;
};

/**
 * Quanto cada unidade tem parado.
 *
 * Valor absoluto sozinho premia a unidade pequena: a que fatura o dobro deve um
 * vencido maior sem estar pior. Por isso a fracao sobre a CARTEIRA da unidade
 * vem junto — e e ela que ordena a leitura, mesmo que a barra mostre o dinheiro.
 */
export async function getInadimplenciaPorUnidade(
  ctx: TenantContext,
  input: PeriodInput,
): Promise<LinhaInadimplencia[]> {
  ctx.assert("report.financial");
  const period = lerPeriodo(input);

  // Lista vazia em `unitIds` significa "a rede inteira" — papel de coordenacao.
  const alcance =
    ctx.session.unitIds.length > 0
      ? sql`and u.id = any(${ctx.session.unitIds}::uuid[])`
      : sql``;

  const linhas = await sql<{
    unit_id: string;
    nome: string;
    vencido_cents: string;
    aberto_cents: string;
    parcelas: string;
    pacientes: string;
  }>`
    select
      u.id as unit_id,
      u.name as nome,
      coalesce(sum(i.amount_cents - i.paid_cents)
               filter (where i.due_on < current_date), 0) as vencido_cents,
      coalesce(sum(i.amount_cents - i.paid_cents), 0)     as aberto_cents,
      count(*) filter (where i.due_on < current_date)     as parcelas,
      count(distinct i.patient_id) filter (where i.due_on < current_date) as pacientes
      from unit u
      left join installment i
             on i.unit_id = u.id
            and i.status in ('open', 'partially_paid')
     where u.is_active and u.deleted_at is null
       -- RLS isola a REDE, nao a unidade: a policy da tabela unit e por tenant, e
       -- sem este recorte o gestor de uma unidade leria o vencido da outra
       -- numa tela que ele abre para cobrar a propria equipe.
       ${alcance}
       ${naUnidade(period, "u.id")}
     group by u.id, u.name
     order by vencido_cents desc, u.name
  `.execute(ctx.db);

  return linhas.rows.map((l) => {
    const vencido = Number(l.vencido_cents);
    const aberto = Number(l.aberto_cents);
    return {
      unitId: l.unit_id,
      nome: l.nome,
      vencidoCents: vencido,
      abertoCents: aberto,
      parcelas: Number(l.parcelas),
      pacientes: Number(l.pacientes),
      fracao: aberto > 0 ? vencido / aberto : 0,
    };
  });
}

// -------------------------------------------------------- producao e margem --

export type LinhaProcedimento = {
  procedureId: string | null;
  nome: string;
  quantidade: number;
  receitaCents: number;
  custoCents: number;
  margemCents: number;
  /** `null` quando o custo do procedimento nunca foi preenchido. */
  margemPercent: number | null;
};

/**
 * O que paga a conta.
 *
 * Receita sozinha engana: o procedimento que mais fatura pode ser o que menos
 * sobra depois do material. A margem aqui e a do ORCAMENTO — preco e custo
 * congelados na emissao — e nao a margem contabil da clinica: nao ha aluguel,
 * cadeira nem folha dentro dela. Serve para comparar procedimentos entre si,
 * que e a pergunta que ela responde.
 *
 * Custo zerado nao vira margem de 100%: vira margem desconhecida. Um catalogo
 * onde ninguem preencheu custo produziria uma tabela inteira de "100%", que e
 * a forma mais rapida de o relatorio perder credibilidade.
 *
 * O DESCONTO DO ORCAMENTO E RATEADO entre os itens, e isso nao e detalhe. O
 * desconto vive no cabecalho (`quote.discount_cents`), nao nas linhas: somar
 * `quote_item.total_cents` cru daria a receita BRUTA, e a mesma tela mostraria
 * "Vendido R$ 10.000" no resumo e R$ 10.100 na tabela logo abaixo. Dois numeros
 * que nao fecham na mesma tela custam mais credibilidade do que qualquer
 * relatorio ganha.
 *
 * O rateio e proporcional ao valor do item, e a SOBRA de arredondamento vai
 * inteira para o item mais caro do orcamento. Sem isso, cada orcamento com
 * desconto erraria alguns centavos, e alguns centavos por orcamento viram
 * reais no fim do mes — sempre para o mesmo lado.
 */
export async function getProducaoPorProcedimento(
  ctx: TenantContext,
  input: PeriodInput,
): Promise<LinhaProcedimento[]> {
  ctx.assert("report.financial");
  const period = lerPeriodo(input);
  const { inicio, fim } = janela(period, ctx.session.timezone);

  const linhas = await sql<{
    procedure_id: string | null;
    nome: string | null;
    quantidade: string;
    receita_cents: string;
    custo_cents: string;
  }>`
    with item as (
      select
        qi.id, qi.procedure_id, qi.quantity, qi.total_cents, qi.unit_cost_cents,
        q.id as quote_id, q.discount_cents,
        case
          when q.discount_cents = 0 or q.subtotal_cents = 0 then 0::bigint
          else (q.discount_cents::numeric * qi.total_cents / q.subtotal_cents)::bigint
        end as rateio,
        row_number() over (
          partition by q.id order by qi.total_cents desc, qi.id
        ) as posicao
        from quote_item qi
        join quote q on q.id = qi.quote_id
       where q.accepted_at >= ${inicio} and q.accepted_at < ${fim}
         and q.deleted_at is null
         ${naUnidade(period, "q.unit_id")}
    ),
    sobra as (
      select quote_id, discount_cents - sum(rateio) as centavos
        from item group by quote_id, discount_cents
    )
    select
      i.procedure_id,
      pr.name as nome,
      sum(i.quantity)::numeric as quantidade,
      sum(i.total_cents - i.rateio
          - case when i.posicao = 1 then s.centavos else 0 end) as receita_cents,
      sum((i.quantity * i.unit_cost_cents)::bigint) as custo_cents
      from item i
      join sobra s on s.quote_id = i.quote_id
      left join procedure pr on pr.id = i.procedure_id
     group by i.procedure_id, pr.name
     order by receita_cents desc
  `.execute(ctx.db);

  return linhas.rows.map((l) => {
    const receita = Number(l.receita_cents);
    const custo = Number(l.custo_cents);
    return {
      procedureId: l.procedure_id,
      nome: l.nome ?? "Item avulso",
      quantidade: Number(l.quantidade),
      receitaCents: receita,
      custoCents: custo,
      margemCents: receita - custo,
      margemPercent: custo > 0 && receita > 0 ? (receita - custo) / receita : null,
    };
  });
}

// ----------------------------------------------------- origem de captacao --

export type LinhaOrigem = {
  sourceId: string | null;
  nome: string;
  canal: string;
  contatos: number;
  ganhos: number;
  ganhoCents: number;
  /** Ganhos sobre contatos do periodo. */
  conversao: number;
};

/**
 * De onde vem quem fecha.
 *
 * Volume e conversao contam historias opostas com frequencia: o canal que mais
 * traz contato costuma ser o que menos fecha, e cortar verba pelo volume e o
 * erro classico. As duas barras ficam juntas por isso.
 *
 * A coorte e a mesma do funil — contatos ABERTOS no periodo — e o ganho e o
 * desfecho desses contatos, mesmo que tenha vindo depois. Contar ganho do mes
 * contra contato do mes compararia numeradores e denominadores de gente
 * diferente.
 */
export async function getOrigemCaptacao(
  ctx: TenantContext,
  input: PeriodInput,
): Promise<LinhaOrigem[]> {
  ctx.assert("report.read");
  const period = lerPeriodo(input);
  const { inicio, fim } = janela(period, ctx.session.timezone);

  const linhas = await sql<{
    source_id: string | null;
    nome: string | null;
    canal: string | null;
    contatos: string;
    ganhos: string;
    ganho_cents: string;
  }>`
    select
      o.source_id,
      s.name as nome,
      s.channel as canal,
      count(*) as contatos,
      count(*) filter (where o.status = 'won') as ganhos,
      coalesce(sum(o.amount_cents) filter (where o.status = 'won'), 0) as ganho_cents
      from opportunity o
      left join acquisition_source s on s.id = o.source_id
     where o.created_at >= ${inicio} and o.created_at < ${fim}
       and o.deleted_at is null
       ${naUnidade(period, "o.unit_id")}
     group by o.source_id, s.name, s.channel
     order by contatos desc, nome
  `.execute(ctx.db);

  return linhas.rows.map((l) => {
    const contatos = Number(l.contatos);
    const ganhos = Number(l.ganhos);
    return {
      sourceId: l.source_id,
      nome: l.nome ?? "Sem origem registrada",
      canal: l.canal ?? "outro",
      contatos,
      ganhos,
      ganhoCents: Number(l.ganho_cents),
      conversao: contatos > 0 ? ganhos / contatos : 0,
    };
  });
}

// ------------------------------------------------------- custo real ---------

export type LinhaCustoReal = {
  procedureId: string;
  nome: string;
  execucoes: number;
  receitaCents: number;
  /** Ficha tecnica x custo de catalogo: o que a clinica esperava gastar. */
  previstoCents: number;
  /** O que saiu dos lotes de verdade. */
  realCents: number;
  margemCents: number;
  margemPercent: number | null;
  /** `false` = procedimento executado sem ficha tecnica: custo cego. */
  temFicha: boolean;
};

/**
 * O que o procedimento REALMENTE custou.
 *
 * O painel ja mostrava margem por procedimento, mas com o custo congelado no
 * orcamento — uma estimativa feita antes de qualquer material sair. Aqui o
 * custo vem dos LOTES que sairam: a soma das movimentacoes de consumo ligadas
 * aos itens executados no periodo.
 *
 * As duas colunas ficam lado a lado porque a diferenca entre elas e a unica
 * coisa acionavel. Hoje ela e quase toda EFEITO PRECO — o lote custou mais (ou
 * menos) que o catalogo —, porque a baixa segue a ficha tecnica e a quantidade
 * consumida e a prevista por construcao. A diferenca de QUANTIDADE existe e
 * nao cabe aqui: material que sai a mais sai como perda ou acerto, sem
 * paciente do outro lado. Essa metade tem painel proprio
 * (`getSaidaSemProcedimento`), e e proposital que ela nao entre na margem de
 * procedimento nenhum: diluir desperdicio no custo dos atendimentos e como se
 * esconde desperdicio.
 *
 * `temFicha` e o campo mais importante da linha. Procedimento executado sem
 * ficha tecnica aparece com custo real ZERO — e zero aqui nao e "barato", e
 * "ninguem cadastrou o que ele consome". Um implante de R$ 3.200 com custo
 * zero mostraria 100% de margem, que e o numero mais perigoso que um
 * relatorio pode exibir.
 */
export async function getCustoRealPorProcedimento(
  ctx: TenantContext,
  input: PeriodInput,
): Promise<LinhaCustoReal[]> {
  ctx.assert("report.financial");
  const period = lerPeriodo(input);
  const { inicio, fim } = janela(period, ctx.session.timezone);

  const linhas = await sql<{
    procedure_id: string;
    nome: string;
    execucoes: string;
    receita_cents: string;
    previsto_cents: string;
    real_cents: string;
    tem_ficha: boolean;
  }>`
    with executados as (
      select i.id, i.procedure_id, i.quantity, i.unit_price_cents
        from treatment_plan_item i
        join treatment_plan tp on tp.id = i.treatment_plan_id
       where i.status = 'executed'
         and i.executed_at >= ${inicio} and i.executed_at < ${fim}
         and i.procedure_id is not null
         ${naUnidade(period, "tp.unit_id")}
    ),
    -- Mesma conta da consume_plan_item, com o mesmo arredondamento de quatro
    -- casas: previsto que arredonda diferente do consumido inventaria uma
    -- diferenca de centavos que nao existe.
    previsto as (
      select e.procedure_id,
             sum(round(b.quantity * e.quantity * (1 + b.waste_percent / 100.0)
                       / pr.conversion_factor, 4) * pr.default_cost_cents)::bigint as cents
        from executados e
        join procedure_bom b on b.procedure_id = e.procedure_id and b.auto_consume
        join product pr on pr.id = b.product_id and pr.is_active
       group by e.procedure_id
    ),
    consumido as (
      select e.procedure_id, sum(m.total_cost_cents)::bigint as cents
        from executados e
        join stock_movement m
          on m.treatment_plan_item_id = e.id and m.kind = 'consumption'
       group by e.procedure_id
    )
    select
      p.id as procedure_id, p.name as nome,
      count(*) as execucoes,
      sum((e.quantity * e.unit_price_cents)::bigint) as receita_cents,
      coalesce(max(pv.cents), 0) as previsto_cents,
      coalesce(max(c.cents), 0)  as real_cents,
      exists (
        select 1 from procedure_bom b
         where b.procedure_id = p.id and b.auto_consume
      ) as tem_ficha
      from executados e
      join procedure p on p.id = e.procedure_id
      left join previsto  pv on pv.procedure_id = e.procedure_id
      left join consumido c  on c.procedure_id = e.procedure_id
     group by p.id, p.name
     order by receita_cents desc
  `.execute(ctx.db);

  return linhas.rows.map((l) => {
    const receita = Number(l.receita_cents);
    const real = Number(l.real_cents);

    return {
      procedureId: l.procedure_id,
      nome: l.nome,
      execucoes: Number(l.execucoes),
      receitaCents: receita,
      previstoCents: Number(l.previsto_cents),
      realCents: real,
      margemCents: receita - real,
      // Sem ficha tecnica nao ha margem para calcular. Mostrar 100% seria
      // inventar a informacao que o relatorio existe para dar.
      margemPercent: l.tem_ficha && receita > 0 ? (receita - real) / receita : null,
      temFicha: l.tem_ficha,
    };
  });
}

export type LinhaSaidaAvulsa = {
  produtoId: string;
  produto: string;
  stockUnit: string;
  kind: "loss" | "adjustment";
  quantidade: number;
  valorCents: number;
};

/**
 * O que saiu do estoque sem procedimento por tras.
 *
 * Perda (quebrou, venceu, caiu) e acerto negativo de inventario (o sistema
 * dizia que tinha, e nao tinha). E a metade da conta de custo que nenhum
 * atendimento carrega — e e de proposito que ela fique fora da margem por
 * procedimento: diluir esse valor no custo dos atendimentos e exatamente como
 * o desperdicio some de vista.
 *
 * Acerto POSITIVO nao entra. Material que apareceu a mais nao e custo; e sinal
 * de que a contagem anterior estava errada, e somar como se fosse economia
 * mascararia a perda de outro mes.
 */
export async function getSaidaSemProcedimento(
  ctx: TenantContext,
  input: PeriodInput,
): Promise<LinhaSaidaAvulsa[]> {
  ctx.assert("report.financial");
  const period = lerPeriodo(input);
  const { inicio, fim } = janela(period, ctx.session.timezone);

  const linhas = await sql<{
    produto_id: string;
    produto: string;
    stock_unit: string;
    kind: "loss" | "adjustment";
    quantidade: string;
    valor_cents: string;
  }>`
    select
      pr.id as produto_id, pr.name as produto, pr.stock_unit,
      m.kind::text as kind,
      sum(-m.quantity) as quantidade,
      sum(m.total_cost_cents)::bigint as valor_cents
      from stock_movement m
      join product pr on pr.id = m.product_id
     where m.kind in ('loss', 'adjustment')
       and m.quantity < 0
       and m.occurred_at >= ${inicio} and m.occurred_at < ${fim}
       ${naUnidade(period, "m.unit_id")}
     group by pr.id, pr.name, pr.stock_unit, m.kind
     order by valor_cents desc
  `.execute(ctx.db);

  return linhas.rows.map((l) => ({
    produtoId: l.produto_id,
    produto: l.produto,
    stockUnit: l.stock_unit,
    kind: l.kind,
    quantidade: Number(l.quantidade),
    valorCents: Number(l.valor_cents),
  }));
}
