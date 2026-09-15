-- =============================================================================
-- Faturamento por guia: do aceite ao recurso de glosa.
--
-- O que estes testes travam:
--
--   - aceitar orcamento de convenio faturado cria GUIA para o convenio e
--     recebivel so da co-participacao do paciente;
--   - desconto sai da parte do paciente, nunca da parte do convenio;
--   - conferir o repasse abaixo do faturado cria glosa COM PRAZO, sozinho;
--   - recuperar a glosa devolve o dinheiro para a LINHA, nao so para o total.
--
-- O ultimo e o que impede o relatorio de "quanto este convenio glosa" contar
-- para sempre o que ja foi recuperado.
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
  PACIENTE constant uuid := '0a111111-1111-7111-8111-111111111111';
  PROF     constant uuid := 'd1111111-1111-7111-8111-111111111111';
  DENTAL   constant uuid := '09222222-2222-7222-8222-222222222222';
  RESINA   constant uuid := '03111111-1111-7111-8111-111111111111';
  IMPLANTE constant uuid := '03222222-2222-7222-8222-222222222222';

  v_quote   uuid;
  v_claim   uuid;
  v_recv    uuid;
  v_batch   uuid;
  v_item    uuid;
  v_item2   uuid;
  v_denial  uuid;
  v_n       int;
  v_valor   bigint;
  v_valor2  bigint;
  v_prazo   date;
  v_status  text;
begin
  -- ------------------------------------------------ orcamento faturado -----
  insert into quote (tenant_id, unit_id, patient_id, provider_id, payer_id,
                     valid_until, installment_count, title)
  values (TENANT, UNIDADE, PACIENTE, PROF, DENTAL, current_date + 15, 1,
          'Faturado por guia')
  returning id into v_quote;

  -- Resina: 260,00 com 60,00 de co-participacao -> convenio paga 200,00.
  insert into quote_item (tenant_id, quote_id, procedure_id, description,
                          tooth_code, surfaces, quantity, unit_price_cents,
                          patient_share_cents, price_list_item_id)
  select TENANT, v_quote, RESINA, 'Restauracao em resina', '36',
         array['O']::tooth_surface[], 1, 26000, 6000, pli.id
    from price_list_item pli
   where pli.procedure_id = RESINA
     and pli.price_list_id = '07333333-3333-7333-8333-333333333333';

  -- Implante: 3.000,00 com 900,00 de co-participacao -> convenio paga 2.100,00.
  insert into quote_item (tenant_id, quote_id, procedure_id, description,
                          tooth_code, quantity, unit_price_cents,
                          patient_share_cents, price_list_item_id)
  select TENANT, v_quote, IMPLANTE, 'Implante unitario', '46', 1, 300000, 90000, pli.id
    from price_list_item pli
   where pli.procedure_id = IMPLANTE
     and pli.price_list_id = '07333333-3333-7333-8333-333333333333';

  update quote set status = 'sent', sent_at = now() where id = v_quote;
  update quote set status = 'accepted', accepted_at = now(), signed_hash = 'x'
   where id = v_quote;

  -- ------------------------------------------------------ a guia nasceu ----
  select id into v_claim from claim where quote_id = v_quote;
  perform test.check('faturamento', 'aceite de convenio faturado cria a guia',
    v_claim is not null);

  select billed_cents into v_valor from claim where id = v_claim;
  perform test.check('faturamento', 'a guia cobra do convenio so o que nao e co-participacao',
    v_valor = 230000, format('billed=%s', v_valor));

  select count(*) into v_n from claim_item where claim_id = v_claim;
  perform test.check('faturamento', 'uma linha de guia por procedimento coberto',
    v_n = 2, format('linhas=%s', v_n));

  perform test.check('faturamento', 'a guia nasce fora de lote, esperando faturamento',
    (select status from claim where id = v_claim) = 'open');

  perform test.check('faturamento', 'a guia recebe numero sequencial da rede',
    (select number from claim where id = v_claim) is not null);

  -- ------------------------------------- e o paciente deve so a parte dele --
  select id, total_cents into v_recv, v_valor from receivable where quote_id = v_quote;
  perform test.check('faturamento', 'o recebivel do paciente e so a co-participacao',
    v_valor = 96000, format('total=%s', v_valor));

  perform test.check('faturamento', 'guia mais co-participacao somam o orcamento',
    (select billed_cents from claim where id = v_claim) + v_valor
      = (select total_cents from quote where id = v_quote),
    format('guia+paciente=%s', (select billed_cents from claim where id = v_claim) + v_valor));

  -- ----------------------------------------------- desconto tem um lado ----
  -- A regra: desconto sai da parte do paciente. Passar disso seria a clinica
  -- faturar o convenio a menos do que o contrato diz.
  declare
    v_q2 uuid;
  begin
    insert into quote (tenant_id, unit_id, patient_id, provider_id, payer_id,
                       valid_until, installment_count, title)
    values (TENANT, UNIDADE, PACIENTE, PROF, DENTAL, current_date + 15, 1,
            'Desconto alem da co-participacao')
    returning id into v_q2;

    insert into quote_item (tenant_id, quote_id, procedure_id, description,
                            tooth_code, surfaces, quantity, unit_price_cents,
                            patient_share_cents)
    values (TENANT, v_q2, RESINA, 'Restauracao em resina', '36',
            array['O']::tooth_surface[], 1, 26000, 6000);

    -- 70,00 de desconto para 60,00 de co-participacao.
    update quote set discount_cents = 7000, discount_approved_by = PROF,
                     discount_approved_at = now()
     where id = v_q2;
    update quote set status = 'sent', sent_at = now() where id = v_q2;

    perform test.rejects('faturamento',
      'desconto maior que a co-participacao e recusado',
      format('update quote set status = ''accepted'', accepted_at = now(), '
             'signed_hash = ''x'' where id = %L', v_q2),
      'passa da co-participacao');
  end;

  -- ------------------------------------------------------------- lote -----
  v_batch := open_claim_batch(TENANT, UNIDADE, DENTAL, current_date, PROF);
  perform test.check('faturamento', 'abrir lote e idempotente por competencia',
    v_batch = open_claim_batch(TENANT, UNIDADE, DENTAL, current_date, PROF));

  perform test.rejects('faturamento', 'lote sem guia nao pode ser enviado',
    format('select submit_claim_batch(%L)', v_batch), 'sem guias');

  update claim set batch_id = v_batch, status = 'batched' where id = v_claim;

  perform test.check('faturamento', 'o lote soma as guias que entraram nele',
    (select billed_cents from claim_batch where id = v_batch) = 230000);

  perform test.rejects('faturamento',
    'guia nao pula de emitida direto para conferida',
    format('update claim set status = ''settled'' where id = %L', v_claim),
    'Transicao invalida');

  -- ---------------------------------------------------------- envio -------
  perform submit_claim_batch(v_batch, PROF);

  perform test.check('faturamento', 'enviar o lote envia as guias junto',
    (select status from claim where id = v_claim) = 'submitted'
      and (select status from claim_batch where id = v_batch) = 'submitted');

  -- -------------------------------------------------- conferencia ---------
  select id into v_item from claim_item
   where claim_id = v_claim and procedure_id = RESINA;
  select id into v_item2 from claim_item
   where claim_id = v_claim and procedure_id = IMPLANTE;

  update claim_batch set remittance_date = current_date - 5 where id = v_batch;

  -- Resina paga inteira.
  perform settle_claim_item(v_item, 20000);
  perform test.check('faturamento', 'linha paga por inteiro nao gera glosa',
    (select count(*) from claim_denial where claim_item_id = v_item) = 0);

  -- Implante: convenio pagou 1.600,00 dos 2.100,00.
  perform test.rejects('faturamento', 'glosa sem motivo e recusada',
    format('select settle_claim_item(%L, 160000)', v_item2), 'exige motivo');

  perform test.rejects('faturamento', 'convenio nao paga mais do que foi faturado',
    format('select settle_claim_item(%L, 999999)', v_item2), 'mais do que foi faturado');

  v_denial := settle_claim_item(v_item2, 160000, 'ANS-1707',
                                'Procedimento nao coberto pelo plano contratado');

  perform test.check('faturamento', 'pagar menos do que foi faturado cria a glosa sozinho',
    v_denial is not null);

  select amount_cents, appeal_deadline into v_valor, v_prazo
    from claim_denial where id = v_denial;

  perform test.check('faturamento', 'a glosa vale a diferenca da linha',
    v_valor = 50000, format('glosa=%s', v_valor));

  -- Demonstrativo de 5 dias atras + 30 de prazo do convenio.
  perform test.check('faturamento', 'o prazo de recurso conta do demonstrativo',
    v_prazo = current_date - 5 + 30, format('prazo=%s', v_prazo));

  perform test.check('faturamento', 'a guia soma o que foi pago e o que foi glosado',
    (select paid_cents from claim where id = v_claim) = 180000
      and (select denied_cents from claim where id = v_claim) = 50000,
    format('pago=%s glosado=%s',
      (select paid_cents from claim where id = v_claim),
      (select denied_cents from claim where id = v_claim)));

  -- ------------------------------------------------- fechar o lote --------
  perform test.check('faturamento', 'lote com tudo conferido fecha',
    settle_claim_batch(v_batch) = 1);

  perform test.check('faturamento', 'fechar o lote fecha as guias dele',
    (select status from claim where id = v_claim) = 'settled');

  -- ---------------------------------------------------------- recurso -----
  perform test.rejects('faturamento', 'glosa nao pula de aberta para recuperada',
    format('update claim_denial set status = ''recovered'', recovered_cents = 1 where id = %L', v_denial),
    'Transicao invalida');

  perform resolve_claim_denial(v_denial, 'appealed', 0, 'Enviado o comprovante de autorizacao.');
  perform test.check('faturamento', 'recurso carimba a data de envio',
    (select appealed_at from claim_denial where id = v_denial) is not null);

  perform test.check('faturamento', 'e guarda o que foi enviado, na coluna do recurso',
    (select appeal_notes from claim_denial where id = v_denial) = 'Enviado o comprovante de autorizacao.');

  perform test.rejects('faturamento', 'recuperar mais do que foi glosado e recusado',
    format('select resolve_claim_denial(%L, ''recovered'', 999999)', v_denial),
    'invalido');

  -- Convenio pagou 300,00 dos 500,00 glosados.
  perform resolve_claim_denial(v_denial, 'recovered', 30000, 'Pago no repasse seguinte.');

  -- O desfecho nao apaga o que foi enviado: sao dois momentos diferentes.
  perform test.check('faturamento', 'o desfecho nao apaga a anotacao do recurso',
    (select appeal_notes from claim_denial where id = v_denial) = 'Enviado o comprovante de autorizacao.'
      and (select resolution_notes from claim_denial where id = v_denial) = 'Pago no repasse seguinte.');

  select paid_cents, denied_cents into v_valor, v_valor2
    from claim_item where id = v_item2;

  perform test.check('faturamento', 'recuperar devolve o dinheiro para a LINHA',
    v_valor = 190000, format('pago na linha=%s', v_valor));

  perform test.check('faturamento', 'e o que sobra continua contando como glosa',
    v_valor2 = 20000, format('glosa restante=%s', v_valor2));

  perform test.check('faturamento', 'a guia acompanha a recuperacao',
    (select paid_cents from claim where id = v_claim) = 210000,
    format('pago na guia=%s', (select paid_cents from claim where id = v_claim)));

  -- --------------------------------------------------- prazo que vence ----
  declare
    v_d2 uuid;
  begin
    insert into claim_denial (tenant_id, claim_item_id, claim_id, amount_cents,
                              reason, appeal_deadline)
    values (TENANT, v_item, v_claim, 1000, 'Teste de prazo', current_date - 1)
    returning id into v_d2;

    perform test.check('faturamento', 'o job noturno vence a glosa nao recorrida',
      expire_claim_denials() >= 1);

    perform test.check('faturamento', 'e ela fica vencida, nao apagada',
      (select status from claim_denial where id = v_d2) = 'expired');
  end;

  -- ------------------------------------------- guia enviada nao se mexe ---
  perform test.rejects('faturamento',
    'linha de guia enviada nao pode ser removida',
    format('delete from claim_item where id = %L', v_item),
    'ja saiu da clinica');

  -- ------------------------------------------------- isolamento da guia ---
  -- RLS coberta pelo catalogo nao prova isolamento: prova que existe policy.
  -- Guia carrega o CPF do paciente e o que ele fez; vazar entre redes aqui e
  -- tao grave quanto vazar o prontuario.
  declare
    v_visiveis int;
  begin
    set local app.tenant_id = '22222222-2222-7222-8222-222222222222';
    set local app.membership_id = 'd9999999-9999-7999-8999-999999999999';
    set local app.role = 'owner';

    select count(*) into v_visiveis from claim where id = v_claim;
    perform test.check('faturamento', 'guia da rede A e invisivel na rede B com o id em maos',
      v_visiveis = 0, format('visiveis=%s', v_visiveis));

    select count(*) into v_visiveis from claim_item where claim_id = v_claim;
    perform test.check('faturamento', 'e as linhas dela tambem',
      v_visiveis = 0, format('visiveis=%s', v_visiveis));

    select count(*) into v_visiveis from claim_denial where claim_id = v_claim;
    perform test.check('faturamento', 'e as glosas dela tambem',
      v_visiveis = 0, format('visiveis=%s', v_visiveis));

    set local app.tenant_id = '11111111-1111-7111-8111-111111111111';
    set local app.membership_id = 'd1111111-1111-7111-8111-111111111111';
  end;

  -- --------------------------------------- convenio de reembolso nao muda --
  declare
    v_q3 uuid;
  begin
    insert into quote (tenant_id, unit_id, patient_id, provider_id, payer_id,
                       valid_until, installment_count, title)
    values (TENANT, UNIDADE, PACIENTE, PROF,
            '09111111-1111-7111-8111-111111111111', current_date + 15, 1,
            'Reembolso')
    returning id into v_q3;

    insert into quote_item (tenant_id, quote_id, procedure_id, description,
                            tooth_code, surfaces, quantity, unit_price_cents)
    values (TENANT, v_q3, RESINA, 'Restauracao em resina', '36',
            array['O']::tooth_surface[], 1, 18000);

    update quote set status = 'sent', sent_at = now() where id = v_q3;
    update quote set status = 'accepted', accepted_at = now(), signed_hash = 'x'
     where id = v_q3;

    perform test.check('faturamento', 'convenio de reembolso nao emite guia',
      (select count(*) from claim where quote_id = v_q3) = 0);

    perform test.check('faturamento', 'e o paciente deve o valor inteiro',
      (select total_cents from receivable where quote_id = v_q3) = 18000);
  end;
end;
$$;
