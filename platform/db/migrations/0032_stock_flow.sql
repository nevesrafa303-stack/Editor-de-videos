-- =============================================================================
-- 0032 — Estoque operando: unidade definida, execucao que baixa, FEFO e estorno.
--
-- O estoque esta modelado desde a 0012 e nunca saiu do papel. O que faltava nao
-- era tabela: era a LIGACAO entre executar um procedimento e o material sair da
-- prateleira. Sem ela, "baixa de estoque" depende de alguem lembrar de digitar
-- — e ninguem lembra. O estoque vira um caderno paralelo que diverge da
-- realidade em uma semana, e a margem por consumo real nunca existe.
--
-- -------------------------------------------------------------------------
-- A DECISAO QUE FALTAVA: EM QUE UNIDADE O SALDO E CONTADO
-- -------------------------------------------------------------------------
-- A 0012 criou `stock_movement.quantity` sem dizer em qual unidade. O seed
-- respondeu das duas formas: toxina lancada em U (unidade de uso) e resina em
-- tubo (unidade de estoque). Dois significados no mesmo campo e o comeco de um
-- estoque que ninguem confere.
--
-- A partir daqui, SALDO E MOVIMENTACAO SAO SEMPRE EM UNIDADE DE ESTOQUE —
-- frasco, seringa, tubo: a unidade em que se compra e em que se conta.
--
-- O motivo e operacional, nao teorico: saldo tem de ser conferivel abrindo o
-- armario. Ninguem conta "467 unidades de toxina"; conta quatro frascos e um
-- pela metade. E `min_quantity`, `max_quantity`, `default_cost_cents` e
-- `product_lot.unit_cost_cents` ja falavam essa lingua ("minimo 2 frascos",
-- "R$ 900 o frasco"). Saldo fracionario nao e defeito: 4,67 frascos e
-- exatamente "quatro fechados e um comecado".
--
-- A FICHA TECNICA (`procedure_bom`) continua em unidade de USO — 30 U de
-- toxina, 0,5 g de resina — porque e assim que se prescreve. A conversao
-- acontece no consumo, com `product.conversion_factor`.
--
-- -------------------------------------------------------------------------
-- FEFO, E POR QUE NAO E PREFERENCIA
-- -------------------------------------------------------------------------
-- O lote que sai e o que vence primeiro (first expired, first out), quebrando
-- entre lotes quando um nao cobre. Nao e otimizacao: e a regra sanitaria, e e
-- o que impede a clinica de jogar fora produto bom porque o lote velho ficou
-- no fundo da geladeira.
--
-- -------------------------------------------------------------------------
-- SEM SALDO: AVISA OU BLOQUEIA
-- -------------------------------------------------------------------------
-- Duas situacoes diferentes, tratadas diferente de proposito:
--
--   - Produto SEM controle de lote e sem saldo: o saldo fica negativo e a tela
--     avisa. Bloquear aqui impede o dentista de fechar o atendimento porque o
--     estoque estava desatualizado — e clinica que nao consegue trabalhar
--     registra errado para conseguir. Quem quiser travar liga
--     `tenant_policy.block_execution_without_stock`.
--
--   - Produto COM controle de lote e sem lote valido: RECUSA sempre, com ou
--     sem politica. Nao e falta de saldo, e falta de rastreio: gravar consumo
--     de injetavel sem numero de lote e destruir a unica evidencia que existe
--     num recall ou numa fiscalizacao. Nao ha configuracao que torne isso
--     aceitavel.
-- =============================================================================

comment on column stock_movement.quantity is
  'Em UNIDADE DE ESTOQUE (frasco, seringa, tubo). Positivo entra, negativo sai. A ficha tecnica fala em unidade de uso; a conversao acontece no consumo.';

comment on column stock_balance.quantity is
  'Em UNIDADE DE ESTOQUE. Saldo tem de ser conferivel contando o que esta no armario.';

comment on column procedure_bom.quantity is
  'Em UNIDADE DE USO do produto (U, ml, g). Convertida para unidade de estoque por conversion_factor no momento do consumo.';

-- ------------------------------------------- item do plano: maquina de estado --
-- Ate aqui o item do plano so tinha auditoria. Ganha maquina porque executar
-- passa a ter CONSEQUENCIA no estoque: um item que oscila de estado sem regra
-- consome material duas vezes.
insert into state_transition (entity, from_state, to_state, label, is_terminal) values
  ('treatment_plan_item', 'planned',   'scheduled', 'Agendado',           false),
  ('treatment_plan_item', 'planned',   'executed',  'Executado',          false),
  ('treatment_plan_item', 'planned',   'canceled',  'Cancelado',          true),
  ('treatment_plan_item', 'scheduled', 'planned',   'Voltou para o plano', false),
  ('treatment_plan_item', 'scheduled', 'executed',  'Executado',          false),
  ('treatment_plan_item', 'scheduled', 'canceled',  'Cancelado',          true),
  -- Executado NAO e terminal, e e deliberado. "Cliquei no dente errado" e o
  -- erro mais provavel desta tela, e a alternativa a desfazer seria a clinica
  -- conviver com um plano mentiroso. O caminho de volta nao apaga nada: o
  -- consumo estornado vira movimentacao nova, em sentido contrario.
  ('treatment_plan_item', 'executed',  'planned',   'Execucao estornada', false);

create trigger treatment_plan_item_assert_transition
  before update of status on treatment_plan_item
  for each row execute function assert_state_transition('treatment_plan_item');

-- --------------------------------------------------------- saldo do produto --
-- Saldo consolidado de um produto numa unidade, somando lotes.
create or replace function stock_on_hand(p_product uuid, p_unit uuid)
returns numeric
language sql
stable
as $$
  select coalesce(sum(quantity), 0)
    from stock_balance
   where product_id = p_product and unit_id = p_unit;
$$;

comment on function stock_on_hand(uuid, uuid) is
  'Saldo do produto na unidade, em unidade de estoque, somando todos os lotes.';

-- ------------------------------------------------------------------- FEFO ----
-- Distribui a quantidade pedida entre os lotes disponiveis, o que vence antes
-- primeiro. Devolve as fatias; quem chama e que escreve as movimentacoes.
--
-- `p_needed` sempre sai atendido por inteiro: se os lotes nao cobrem, a ultima
-- fatia leva o restante (e o saldo daquele lote fica negativo). Devolver menos
-- do que foi pedido faria a baixa sumir em silencio — que e pior do que um
-- saldo negativo visivel na tela.
create or replace function pick_stock_lots(
  p_product uuid,
  p_unit    uuid,
  p_needed  numeric
)
returns table (lot_id uuid, quantity numeric)
language plpgsql
stable
as $$
declare
  v_resta numeric := p_needed;
  v_lot   record;
  v_fatia numeric;
begin
  if p_needed <= 0 then
    return;
  end if;

  for v_lot in
    select sb.lot_id, sb.quantity, pl.expires_on
      from stock_balance sb
      join product_lot pl on pl.id = sb.lot_id
     where sb.product_id = p_product
       and sb.unit_id = p_unit
       and sb.quantity > 0
       and not pl.is_blocked
       and pl.expires_on >= current_date
     order by pl.expires_on, pl.received_on, sb.lot_id
  loop
    exit when v_resta <= 0;

    v_fatia := least(v_lot.quantity, v_resta);
    v_resta := v_resta - v_fatia;

    lot_id := v_lot.lot_id;
    quantity := v_fatia;
    return next;
  end loop;

  -- Sobrou pedido sem lote que cubra: a diferenca vai para o lote que vence
  -- antes, mesmo estourando o saldo dele. O negativo e o aviso.
  if v_resta > 0 then
    select pl.id into lot_id
      from product_lot pl
     where pl.product_id = p_product
       and not pl.is_blocked
       and pl.expires_on >= current_date
     order by pl.expires_on, pl.received_on
     limit 1;

    if lot_id is null then
      raise exception 'Não há lote válido em estoque para este produto. Registre a entrada antes de executar.'
        using errcode = 'P0001';
    end if;

    quantity := v_resta;
    return next;
  end if;
end;
$$;

-- ------------------------------------------------- consumo pela ficha tecnica --
create or replace function consume_plan_item(p_item uuid, p_unit uuid default null)
returns int
language plpgsql
as $$
declare
  v_item     record;
  v_bom      record;
  v_politica boolean;
  v_unidade  uuid;
  v_precisa  numeric;
  v_saldo    numeric;
  v_fatia    record;
  v_custo    bigint;
  v_linhas   int := 0;
begin
  select i.*, p.unit_id as plan_unit_id, p.patient_id
    into v_item
    from treatment_plan_item i
    join treatment_plan p on p.id = i.treatment_plan_id
   where i.id = p_item;

  if not found then
    raise exception 'Item de plano não encontrado.' using errcode = 'P0001';
  end if;

  if v_item.procedure_id is null then
    return 0;
  end if;

  -- De qual unidade o material sai, em ordem de quem sabe melhor: a unidade
  -- que o aplicativo passou (a sessao esta la), depois a do atendimento,
  -- depois a do plano. A funcao NAO le a sessao por conta propria: adivinhar
  -- unidade dentro do SQL esconde a decisao de quem chama, e o dia em que a
  -- pessoa trocar de unidade na interface o material sai do lugar errado.
  v_unidade := coalesce(
    p_unit,
    (select a.unit_id from appointment a where a.id = v_item.appointment_id),
    v_item.plan_unit_id
  );

  if v_unidade is null then
    raise exception 'Não dá para dar baixa sem saber em qual unidade o procedimento aconteceu.'
      using errcode = 'P0001';
  end if;

  select coalesce(tp.block_execution_without_stock, false) into v_politica
    from tenant_policy tp where tp.tenant_id = v_item.tenant_id;

  for v_bom in
    select b.product_id, b.quantity, b.waste_percent, b.is_optional, b.auto_consume,
           pr.name, pr.requires_lot, pr.conversion_factor, pr.default_cost_cents,
           pr.stock_unit
      from procedure_bom b
      join product pr on pr.id = b.product_id
     where b.procedure_id = v_item.procedure_id
       and b.auto_consume
       and pr.is_active
     order by pr.name
  loop
    -- Ficha tecnica em unidade de USO -> unidade de ESTOQUE. A perda esperada
    -- (sobra de seringa, material descartado) entra: ela saiu da prateleira
    -- igual, e fingir que nao saiu e o que faz o inventario nunca fechar.
    --
    -- O `round(..., 4)` e explicito porque a coluna tem 4 casas: sem ele, o
    -- arredondamento aconteceria no INSERT, em silencio, e a previa da tela
    -- (0,14375) mostraria um numero que o estoque nunca teve (0,1438). Dois
    -- numeros para a mesma coisa comecam assim.
    v_precisa := round(
      (v_bom.quantity * v_item.quantity
       * (1 + v_bom.waste_percent / 100.0)) / v_bom.conversion_factor,
      4
    );

    -- Menos do que a quarta casa guarda nao vira movimentacao: seria uma linha
    -- de zero no historico, que nao ajuda ninguem a entender divergencia.
    if v_precisa <= 0 then
      continue;
    end if;

    v_saldo := stock_on_hand(v_bom.product_id, v_unidade);

    if v_saldo < v_precisa then
      if v_bom.is_optional then
        -- Item opcional sem saldo simplesmente nao sai. E o caso do
        -- descartavel que a clinica as vezes usa e as vezes nao.
        continue;
      end if;

      if v_politica then
        raise exception 'Estoque insuficiente de % (tem %, precisa de % %).',
          v_bom.name, trim(to_char(v_saldo, 'FM999999990.999')),
          trim(to_char(v_precisa, 'FM999999990.999')), v_bom.stock_unit
          using errcode = 'P0001';
      end if;
    end if;

    if v_bom.requires_lot then
      -- Com controle de lote, cada fatia FEFO vira uma movimentacao propria:
      -- e o numero do lote na linha que responde "quem recebeu deste lote"
      -- num recall. Uma linha somada perderia isso.
      for v_fatia in select * from pick_stock_lots(v_bom.product_id, v_unidade, v_precisa)
      loop
        select coalesce(pl.unit_cost_cents, v_bom.default_cost_cents) into v_custo
          from product_lot pl where pl.id = v_fatia.lot_id;

        insert into stock_movement
          (tenant_id, unit_id, product_id, lot_id, kind, quantity, unit_cost_cents,
           treatment_plan_item_id, patient_id, appointment_id, performed_by)
        values
          (v_item.tenant_id, v_unidade, v_bom.product_id, v_fatia.lot_id,
           'consumption', -v_fatia.quantity, coalesce(v_custo, 0),
           p_item, v_item.patient_id, v_item.appointment_id, current_membership_id());

        v_linhas := v_linhas + 1;
      end loop;
    else
      insert into stock_movement
        (tenant_id, unit_id, product_id, kind, quantity, unit_cost_cents,
         treatment_plan_item_id, patient_id, appointment_id, performed_by)
      values
        (v_item.tenant_id, v_unidade, v_bom.product_id,
         'consumption', -v_precisa, v_bom.default_cost_cents,
         p_item, v_item.patient_id, v_item.appointment_id, current_membership_id());

      v_linhas := v_linhas + 1;
    end if;
  end loop;

  return v_linhas;
end;
$$;

comment on function consume_plan_item(uuid, uuid) is
  'Baixa o material da ficha tecnica do item executado, FEFO por lote. Devolve quantas movimentacoes escreveu.';

-- ------------------------------------------------------------- executar -----
create or replace function execute_plan_item(
  p_item        uuid,
  p_unit        uuid default null,
  p_appointment uuid default null
)
returns int
language plpgsql
as $$
declare
  v_status plan_item_status;
  v_ja     int;
begin
  select status into v_status from treatment_plan_item where id = p_item;

  if not found then
    raise exception 'Item de plano não encontrado.' using errcode = 'P0001';
  end if;

  if v_status = 'executed' then
    raise exception 'Este procedimento já foi executado.' using errcode = 'P0001';
  end if;

  -- Cinto e suspensorio: a maquina de estado ja recusaria, mas a mensagem dela
  -- fala de estado e esta fala do que a pessoa fez.
  if v_status = 'canceled' then
    raise exception 'Procedimento cancelado não pode ser executado.' using errcode = 'P0001';
  end if;

  -- Consumo ANTES de marcar executado: falta de lote derruba a transacao
  -- inteira, e o item nao fica marcado como feito sem o material ter saido.
  -- Na ordem inversa, um erro no estoque deixaria os dois lados discordando.
  update treatment_plan_item
     set appointment_id = coalesce(p_appointment, appointment_id)
   where id = p_item;

  select consume_plan_item(p_item, p_unit) into v_ja;

  update treatment_plan_item
     set status = 'executed',
         executed_at = now(),
         executed_by = current_membership_id()
   where id = p_item;

  return v_ja;
end;
$$;

-- -------------------------------------------------------------- estornar ----
create or replace function revert_plan_item(p_item uuid, p_reason text)
returns int
language plpgsql
as $$
declare
  v_status plan_item_status;
  v_mov    record;
  v_linhas int := 0;
begin
  if coalesce(trim(p_reason), '') = '' then
    raise exception 'Informe por que a execução está sendo estornada.' using errcode = 'P0001';
  end if;

  select status into v_status from treatment_plan_item where id = p_item;

  if v_status is distinct from 'executed' then
    raise exception 'Só dá para estornar um procedimento executado.' using errcode = 'P0001';
  end if;

  -- Devolve o material movimentacao a movimentacao, no mesmo lote de onde
  -- saiu. Nao ha delete: a linha do consumo continua la, e a devolucao aparece
  -- ao lado dela. Estoque que apaga historico nao defende ninguem numa
  -- fiscalizacao.
  for v_mov in
    select * from stock_movement
     where treatment_plan_item_id = p_item
       and kind = 'consumption'
  loop
    insert into stock_movement
      (tenant_id, unit_id, product_id, lot_id, kind, quantity, unit_cost_cents,
       treatment_plan_item_id, patient_id, appointment_id, reason, performed_by)
    values
      (v_mov.tenant_id, v_mov.unit_id, v_mov.product_id, v_mov.lot_id,
       'adjustment', -v_mov.quantity, v_mov.unit_cost_cents,
       p_item, v_mov.patient_id, v_mov.appointment_id,
       'Estorno de execução: ' || trim(p_reason), current_membership_id());

    v_linhas := v_linhas + 1;
  end loop;

  update treatment_plan_item
     set status = 'planned',
         executed_at = null,
         executed_by = null
   where id = p_item;

  return v_linhas;
end;
$$;

-- ----------------------------------------------------------- permissoes -----
-- `inventory.read/write` e `treatment_plan.execute` ja existem desde a 0016.
-- As funcoes rodam como o papel da aplicacao; quem checa permissao e a camada
-- de acesso, que e onde a sessao existe.
grant execute on function stock_on_hand(uuid, uuid)            to crm_app, crm_readonly;
grant execute on function pick_stock_lots(uuid, uuid, numeric) to crm_app;
grant execute on function consume_plan_item(uuid, uuid)        to crm_app;
grant execute on function execute_plan_item(uuid, uuid, uuid)  to crm_app;
grant execute on function revert_plan_item(uuid, text)         to crm_app;

-- ------------------------------------------------------------- indices ------
-- "O que saiu por causa deste procedimento" — a consulta do estorno e da
-- margem real. Sem indice, varre a tabela de movimentacao inteira.
create index stock_movement_plan_item_idx
  on stock_movement (tenant_id, treatment_plan_item_id)
  where treatment_plan_item_id is not null;

-- Alerta de vencimento na tela de estoque: os lotes que vencem em breve E
-- ainda tem saldo. O indice de 0012 e por produto; este e por data.
create index product_lot_expiring_idx on product_lot (tenant_id, expires_on)
  where not is_blocked;
