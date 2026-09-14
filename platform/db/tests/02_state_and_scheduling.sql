\set QUIET on
\set ON_ERROR_STOP on

set app.tenant_id = '11111111-1111-7111-8111-111111111111';
set app.user_id = 'c1111111-1111-7111-8111-111111111111';
set app.membership_id = 'd1111111-1111-7111-8111-111111111111';

do $$
declare
  v_appt uuid;
  v_other uuid;
  v_status appointment_status;
  v_stamped boolean;
  v_count int;
  v_base timestamptz := date_trunc('hour', now()) + interval '2 days';
begin
  -- ------------------------------------------------------------ agenda -----
  insert into appointment (tenant_id, unit_id, patient_id, provider_id, starts_at, ends_at, procedure_id)
  values ('11111111-1111-7111-8111-111111111111', 'a1111111-1111-7111-8111-111111111111',
          '0a111111-1111-7111-8111-111111111111', 'd1111111-1111-7111-8111-111111111111',
          v_base, v_base + interval '1 hour', '03111111-1111-7111-8111-111111111111')
  returning id into v_appt;

  perform test.check('agenda', 'agendamento criado grava historico de status',
    (select count(*) from appointment_status_history where appointment_id = v_appt) = 1);

  -- Conflito de profissional: exclusion constraint, nao validacao de app.
  perform test.rejects('agenda',
    'mesmo profissional em horario sobreposto e recusado pelo banco',
    format($sql$insert into appointment (tenant_id, unit_id, patient_id, provider_id, starts_at, ends_at)
      values ('11111111-1111-7111-8111-111111111111', 'a1111111-1111-7111-8111-111111111111',
              '0a222222-2222-7222-8222-222222222222', 'd1111111-1111-7111-8111-111111111111',
              %L, %L)$sql$, v_base + interval '30 minutes', v_base + interval '90 minutes'),
    'appointment_provider_overlap');

  -- Outro profissional no mesmo horario e legitimo.
  insert into appointment (tenant_id, unit_id, patient_id, provider_id, starts_at, ends_at)
  values ('11111111-1111-7111-8111-111111111111', 'a1111111-1111-7111-8111-111111111111',
          '0a222222-2222-7222-8222-222222222222', 'd2222222-2222-7222-8222-222222222222',
          v_base, v_base + interval '1 hour')
  returning id into v_other;
  perform test.check('agenda', 'profissional diferente no mesmo horario e aceito', v_other is not null);

  -- Cadeira ocupada por dois atendimentos: recusado.
  insert into resource_booking (tenant_id, resource_id, appointment_id, starts_at, ends_at)
  values ('11111111-1111-7111-8111-111111111111', '0b111111-1111-7111-8111-111111111111',
          v_appt, v_base, v_base + interval '1 hour');

  perform test.rejects('agenda',
    'mesma cadeira em horario sobreposto e recusada',
    format($sql$insert into resource_booking (tenant_id, resource_id, appointment_id, starts_at, ends_at)
      values ('11111111-1111-7111-8111-111111111111', '0b111111-1111-7111-8111-111111111111',
              %L, %L, %L)$sql$, v_other, v_base + interval '15 minutes', v_base + interval '45 minutes'),
    'resource_booking_overlap');

  -- ------------------------------------------------- maquina de estados ----
  perform test.rejects('estados',
    'agendamento nao pula de scheduled direto para completed',
    format('update appointment set status = ''completed'' where id = %L', v_appt),
    'Transicao invalida');

  update appointment set status = 'confirmed' where id = v_appt;
  update appointment set status = 'arrived' where id = v_appt;
  update appointment set status = 'in_progress' where id = v_appt;
  update appointment set status = 'completed' where id = v_appt;

  select status, completed_at is not null into v_status, v_stamped
  from appointment where id = v_appt;
  perform test.check('estados', 'fluxo valido de agendamento carimba completed_at',
    v_status = 'completed' and v_stamped, format('%s / carimbo=%s', v_status, v_stamped));

  select count(*) into v_count from appointment_status_history where appointment_id = v_appt;
  perform test.check('estados', 'cada transicao deixa linha no historico', v_count = 5,
    format('%s linhas', v_count));

  -- Cancelado libera o horario do profissional.
  update appointment set status = 'canceled', cancel_reason = 'Paciente remarcou'
   where id = v_other;

  insert into appointment (tenant_id, unit_id, patient_id, provider_id, starts_at, ends_at)
  values ('11111111-1111-7111-8111-111111111111', 'a1111111-1111-7111-8111-111111111111',
          '0a222222-2222-7222-8222-222222222222', 'd2222222-2222-7222-8222-222222222222',
          v_base, v_base + interval '1 hour');
  perform test.check('agenda', 'cancelamento libera a janela do profissional', true);

  -- Cancelamento sem motivo: recusado (em um agendamento que ainda pode ser
  -- cancelado, para o teste medir a regra certa e nao a maquina de estados).
  insert into appointment (tenant_id, unit_id, patient_id, provider_id, starts_at, ends_at)
  values ('11111111-1111-7111-8111-111111111111', 'a1111111-1111-7111-8111-111111111111',
          '0a111111-1111-7111-8111-111111111111', 'd1111111-1111-7111-8111-111111111111',
          v_base + interval '4 hours', v_base + interval '5 hours')
  returning id into v_other;

  perform test.rejects('estados',
    'cancelamento exige motivo registrado',
    format($sql$update appointment set status = 'canceled' where id = %L$sql$, v_other),
    'appointment_cancel_reason');
end;
$$;

-- ------------------------------------------------------------- orcamento ---
do $$
declare
  v_quote uuid;
  v_total bigint;
  v_sub bigint;
begin
  insert into quote (tenant_id, unit_id, patient_id, provider_id, price_list_id, valid_until, installment_count)
  values ('11111111-1111-7111-8111-111111111111', 'a1111111-1111-7111-8111-111111111111',
          '0a111111-1111-7111-8111-111111111111', 'd1111111-1111-7111-8111-111111111111',
          '07111111-1111-7111-8111-111111111111', current_date + 15, 6)
  returning id into v_quote;

  perform test.rejects('orcamento',
    'orcamento sem itens nao pode ser enviado',
    format('update quote set status = ''sent'' where id = %L', v_quote),
    'sem itens');

  -- Procedimento com scope de face exige dente e face.
  perform test.rejects('orcamento',
    'item de restauracao sem dente e recusado',
    format($sql$insert into quote_item (tenant_id, quote_id, procedure_id, description, unit_price_cents)
      values ('11111111-1111-7111-8111-111111111111', %L, '03111111-1111-7111-8111-111111111111',
              'Restauracao', 28000)$sql$, v_quote),
    'exige dente');

  insert into quote_item (tenant_id, quote_id, procedure_id, description, tooth_code, surfaces,
                          quantity, unit_price_cents, unit_cost_cents, price_list_item_id)
  select '11111111-1111-7111-8111-111111111111', v_quote, '03111111-1111-7111-8111-111111111111',
         'Restauracao em resina', '16', array['O']::tooth_surface[], 1, 28000, 1800, pli.id
  from price_list_item pli
  where pli.procedure_id = '03111111-1111-7111-8111-111111111111';

  insert into quote_item (tenant_id, quote_id, procedure_id, description, region_code,
                          quantity, quantity_unit, unit_price_cents, unit_cost_cents, price_list_item_id)
  select '11111111-1111-7111-8111-111111111111', v_quote, '03333333-3333-7333-8333-333333333333',
         'Toxina botulinica - glabela', 'glabela', 1, 'sessao', 150000, 29040, pli.id
  from price_list_item pli
  where pli.procedure_id = '03333333-3333-7333-8333-333333333333';

  select subtotal_cents, total_cents into v_sub, v_total from quote where id = v_quote;
  perform test.check('orcamento', 'totais sao recalculados pelo banco a partir dos itens',
    v_sub = 178000 and v_total = 178000, format('subtotal=%s total=%s', v_sub, v_total));

  -- Teto de desconto: resina 20% de 28000 + toxina 20% de 150000 = 35600.
  perform test.rejects('orcamento',
    'desconto acima do teto exige aprovacao de gestor',
    format('update quote set discount_cents = 60000, status = ''sent'' where id = %L', v_quote),
    'excede o teto');

  update quote set discount_cents = 20000 where id = v_quote;
  update quote set status = 'sent', sent_at = now() where id = v_quote;

  select total_cents into v_total from quote where id = v_quote;
  perform test.check('orcamento', 'desconto dentro do teto e aplicado no total',
    v_total = 158000, format('total=%s', v_total));

  perform test.rejects('orcamento',
    'orcamento nao pula de sent direto para draft',
    format('update quote set status = ''draft'' where id = %L', v_quote),
    'Transicao invalida');

  perform test.rejects('orcamento',
    'aceite sem assinatura e recusado',
    format('update quote set status = ''accepted'', accepted_at = now() where id = %L', v_quote),
    'quote_accepted_signature');

  update quote
     set status = 'accepted', accepted_at = now(), signed_hash = md5('aceite'), signed_ip = '203.0.113.9'
   where id = v_quote;
  perform test.check('orcamento', 'aceite com assinatura eletronica e aceito',
    (select status from quote where id = v_quote) = 'accepted');
end;
$$;
