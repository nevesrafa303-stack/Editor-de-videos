-- =============================================================================
-- Estoque operando: FEFO, conversao de unidade e execucao que baixa.
--
-- O que estes testes travam e o conjunto de coisas que fazem um estoque parar
-- de bater com a prateleira — que e o unico jeito de um estoque falhar:
--
--   - o lote que sai nao e o que vence primeiro;
--   - lote bloqueado ou vencido entra no consumo;
--   - a ficha tecnica e convertida errado entre unidade de uso e de estoque;
--   - o item fica marcado como executado sem o material ter saido;
--   - o estorno apaga o consumo em vez de devolver ao lado dele.
-- =============================================================================
\set QUIET on
\set ON_ERROR_STOP on

set app.tenant_id = '11111111-1111-7111-8111-111111111111';
set app.user_id = 'c1111111-1111-7111-8111-111111111111';
set app.membership_id = 'd1111111-1111-7111-8111-111111111111';
set app.role = 'owner';

do $$
declare
  TENANT   constant uuid := '11111111-1111-7111-8111-111111111111';
  UNIDADE  constant uuid := 'a1111111-1111-7111-8111-111111111111';
  TOXINA   constant uuid := '04111111-1111-7111-8111-111111111111';
  RESINA   constant uuid := '04333333-3333-7333-8333-333333333333';
  PROC_RES constant uuid := '03111111-1111-7111-8111-111111111111';

  v_cedo   uuid;
  v_tarde  uuid;
  v_bloq   uuid;
  v_item   uuid;
  v_plano  uuid;
  v_fatias int;
  v_prim   text;
  v_saldo  numeric;
  v_saldo2 numeric;
  v_qtd    numeric;
  v_status text;
  v_linhas int;
begin
  -- ------------------------------------------------------------------ FEFO --
  -- Dois lotes do mesmo produto, um vencendo antes. O que vence antes sai
  -- primeiro: nao e otimizacao, e a regra sanitaria — e e o que impede a
  -- clinica de jogar fora produto bom porque o velho ficou no fundo.
  insert into product_lot (tenant_id, product_id, lot_number, expires_on, unit_cost_cents)
  values (TENANT, TOXINA, 'FEFO-CEDO', current_date + 20, 80000)
  returning id into v_cedo;

  insert into product_lot (tenant_id, product_id, lot_number, expires_on, unit_cost_cents)
  values (TENANT, TOXINA, 'FEFO-TARDE', current_date + 400, 90000)
  returning id into v_tarde;

  insert into stock_movement (tenant_id, unit_id, product_id, lot_id, kind, quantity, unit_cost_cents)
  values (TENANT, UNIDADE, TOXINA, v_cedo,  'purchase', 2, 80000),
         (TENANT, UNIDADE, TOXINA, v_tarde, 'purchase', 4, 90000);

  select pl.lot_number into v_prim
    from pick_stock_lots(TOXINA, UNIDADE, 1) f
    join product_lot pl on pl.id = f.lot_id
   limit 1;

  perform test.check('estoque', 'FEFO tira do lote que vence primeiro',
    v_prim = 'FEFO-CEDO', format('saiu de %s', v_prim));

  -- Pedido maior do que o primeiro lote cobre: quebra entre lotes em vez de
  -- estourar um so. Uma unica fatia negativa esconderia que ha produto bom
  -- logo atras.
  select count(*) into v_fatias from pick_stock_lots(TOXINA, UNIDADE, 3);
  perform test.check('estoque', 'pedido maior que o lote se divide entre lotes',
    v_fatias >= 2, format('%s fatias', v_fatias));

  -- Bloqueado nao sai. Recall e recall.
  insert into product_lot (tenant_id, product_id, lot_number, expires_on, unit_cost_cents,
                           is_blocked, blocked_reason)
  values (TENANT, TOXINA, 'FEFO-BLOQ', current_date + 5, 80000, true, 'Recall do fabricante')
  returning id into v_bloq;

  insert into stock_movement (tenant_id, unit_id, product_id, lot_id, kind, quantity, unit_cost_cents)
  values (TENANT, UNIDADE, TOXINA, v_bloq, 'purchase', 9, 80000);

  select pl.lot_number into v_prim
    from pick_stock_lots(TOXINA, UNIDADE, 1) f
    join product_lot pl on pl.id = f.lot_id
   limit 1;

  perform test.check('estoque', 'lote bloqueado nao entra no FEFO, mesmo vencendo antes',
    v_prim = 'FEFO-CEDO', format('saiu de %s', v_prim));

  -- Vencido tambem nao: sair como consumo seria registrar aplicacao de produto
  -- vencido, que e exatamente o que a trigger de 0015 recusa.
  perform test.check('estoque', 'lote vencido com saldo nao entra no FEFO',
    not exists (
      select 1 from pick_stock_lots(TOXINA, UNIDADE, 1) f
      join product_lot pl on pl.id = f.lot_id
      where pl.expires_on < current_date
    ));

  -- ----------------------------------------------- conversao de unidade ----
  -- Resina: ficha tecnica pede 0,5 g, perda 15%, tubo de 4 g.
  -- 0,5 x 1,15 / 4 = 0,14375 -> 0,1438 (a coluna guarda quatro casas).
  select i.id, i.treatment_plan_id into v_item, v_plano
    from treatment_plan_item i
   where i.procedure_id = PROC_RES and i.status = 'planned'
   limit 1;

  perform test.check('estoque', 'o seed tem item de resina planejado', v_item is not null);

  select quantity into v_saldo from stock_balance
   where product_id = RESINA and lot_id is null and unit_id = UNIDADE;

  perform execute_plan_item(v_item, UNIDADE);

  select quantity into v_qtd from stock_movement
   where treatment_plan_item_id = v_item and kind = 'consumption';

  perform test.check('estoque', 'ficha tecnica em grama vira tubo, com a perda dentro',
    v_qtd = -0.1438, format('baixou %s', v_qtd));

  -- Sempre com a UNIDADE: saldo e por unidade, e o seed tem resina nas duas.
  -- E sempre RELATIVO ao saldo de antes: fixar "20" amarrava o teste a quanto
  -- o seed tem hoje, e a cada perda ou compra nova no seed ele quebrava sem
  -- que nada da regra tivesse mudado.
  select quantity into v_saldo2 from stock_balance
   where product_id = RESINA and lot_id is null and unit_id = UNIDADE;

  perform test.check('estoque', 'o saldo caiu exatamente o que foi consumido',
    v_saldo2 = v_saldo - 0.1438, format('antes=%s depois=%s', v_saldo, v_saldo2));

  select status into v_status from treatment_plan_item where id = v_item;
  perform test.check('estoque', 'e o item ficou marcado como executado', v_status = 'executed');

  -- ------------------------------------------------------------- estorno ---
  perform revert_plan_item(v_item, 'Dente errado');

  select count(*) into v_linhas from stock_movement where treatment_plan_item_id = v_item;
  perform test.check('estoque', 'o estorno soma uma linha em vez de apagar a do consumo',
    v_linhas = 2, format('%s linhas', v_linhas));

  select quantity into v_saldo2 from stock_balance
   where product_id = RESINA and lot_id is null and unit_id = UNIDADE;
  perform test.check('estoque', 'e o material volta ao saldo', v_saldo2 = v_saldo,
    format('antes=%s depois=%s', v_saldo, v_saldo2));

  select status into v_status from treatment_plan_item where id = v_item;
  perform test.check('estoque', 'o item volta para planejado', v_status = 'planned');

  perform test.rejects('estoque',
    'estorno sem motivo e recusado',
    format($sql$select revert_plan_item(%L, '  ')$sql$, v_item),
    'estornada');

  -- ------------------------------------------------- executar so uma vez ---
  perform execute_plan_item(v_item, UNIDADE);

  perform test.rejects('estoque',
    'o mesmo item nao e executado duas vezes',
    format($sql$select execute_plan_item(%L, %L)$sql$, v_item, UNIDADE),
    'já foi executado');

  perform revert_plan_item(v_item, 'Voltando para o estado do seed');
end;
$$;

-- --------------------------------------------- lote obrigatorio e politica ---
do $$
declare
  TENANT   constant uuid := '11111111-1111-7111-8111-111111111111';
  UNIDADE  constant uuid := 'a1111111-1111-7111-8111-111111111111';
  RESINA   constant uuid := '04333333-3333-7333-8333-333333333333';
  TOXINA   constant uuid := '04111111-1111-7111-8111-111111111111';
  PROC_TOX constant uuid := '03333333-3333-7333-8333-333333333333';

  v_plano  uuid;
  v_item   uuid;
  v_status text;
  v_saldo  numeric;
begin
  -- Um plano proprio para nao disputar as linhas do seed com as outras suites.
  -- `code` explicito: a unique e NULLS NOT DISTINCT, entao dois planos sem
  -- codigo colidem entre si — inclusive entre suites.
  insert into treatment_plan (tenant_id, unit_id, patient_id, title, status, code)
  values (TENANT, UNIDADE, '0a111111-1111-7111-8111-111111111111',
          'Plano de teste de estoque', 'active', 9001)
  returning id into v_plano;

  insert into treatment_plan_item (tenant_id, treatment_plan_id, procedure_id, description,
                                   region_code, quantity, unit_price_cents)
  values (TENANT, v_plano, PROC_TOX, 'Toxina para teste de estoque', 'glabela', 1, 150000)
  returning id into v_item;

  -- Sem lote valido de toxina, executar tem de RECUSAR — com ou sem politica.
  -- Nao e falta de saldo, e falta de rastreio: gravar consumo de injetavel sem
  -- numero de lote destroi a unica evidencia que existe num recall.
  update product_lot set is_blocked = true, blocked_reason = 'Teste de recusa'
   where product_id = TOXINA and not is_blocked;

  perform test.rejects('estoque',
    'sem lote valido, injetavel nao e consumido nem com estoque zerado permitido',
    format($sql$select execute_plan_item(%L, %L)$sql$, v_item, UNIDADE),
    'lote');

  select status into v_status from treatment_plan_item where id = v_item;
  perform test.check('estoque',
    'e o item NAO fica marcado como executado quando a baixa falha',
    v_status = 'planned', format('status=%s', v_status));

  update product_lot set is_blocked = false, blocked_reason = null
   where product_id = TOXINA and blocked_reason = 'Teste de recusa';

  -- Politica ligada: sem saldo, bloqueia. Padrao e desligada de proposito —
  -- travar no banco faz a clinica registrar errado para conseguir trabalhar.
  update tenant_policy set block_execution_without_stock = true where tenant_id = TENANT;

  insert into treatment_plan_item (tenant_id, treatment_plan_id, procedure_id, description,
                                   tooth_code, surfaces, quantity, unit_price_cents)
  values (TENANT, v_plano, '03111111-1111-7111-8111-111111111111',
          'Resina para teste de politica', '45', array['O']::tooth_surface[], 10000, 28000)
  returning id into v_item;

  perform test.rejects('estoque',
    'com a politica ligada, estoque insuficiente barra a execucao',
    format($sql$select execute_plan_item(%L, %L)$sql$, v_item, UNIDADE),
    'insuficiente');

  update tenant_policy set block_execution_without_stock = false where tenant_id = TENANT;

  -- Desligada, o saldo fica negativo e visivel em vez de o atendimento parar.
  perform execute_plan_item(v_item, UNIDADE);

  select sum(quantity) into v_saldo from stock_balance
   where product_id = RESINA and unit_id = UNIDADE;
  perform test.check('estoque',
    'sem a politica, o saldo fica negativo em vez de o atendimento parar',
    v_saldo < 0, format('saldo=%s', v_saldo));

  perform revert_plan_item(v_item, 'Limpando o cenario do teste');
end;
$$;

-- ------------------------------------------------------ maquina de estado ----
do $$
declare
  TENANT  constant uuid := '11111111-1111-7111-8111-111111111111';
  UNIDADE constant uuid := 'a1111111-1111-7111-8111-111111111111';
  v_plano uuid;
  v_item  uuid;
begin
  insert into treatment_plan (tenant_id, unit_id, patient_id, title, status, code)
  values (TENANT, UNIDADE, '0a111111-1111-7111-8111-111111111111',
          'Plano de teste de transicao', 'active', 9002)
  returning id into v_plano;

  insert into treatment_plan_item (tenant_id, treatment_plan_id, description, quantity, unit_price_cents)
  values (TENANT, v_plano, 'Item sem procedimento', 1, 10000)
  returning id into v_item;

  update treatment_plan_item set status = 'canceled' where id = v_item;

  perform test.rejects('estoque',
    'item cancelado nao volta a ser executado',
    format($sql$update treatment_plan_item set status = 'executed' where id = %L$sql$, v_item));

  perform test.check('estoque',
    'executado NAO e terminal: desfazer e o caminho para o dente errado',
    exists (
      select 1 from state_transition
       where entity = 'treatment_plan_item'
         and from_state = 'executed' and to_state = 'planned'
    ));
end;
$$;
