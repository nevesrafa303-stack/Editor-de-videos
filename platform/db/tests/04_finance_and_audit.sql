\set QUIET on
\set ON_ERROR_STOP on

set app.tenant_id = '11111111-1111-7111-8111-111111111111';
set app.user_id = 'c5555555-5555-7555-8555-555555555555';
set app.membership_id = 'd5555555-5555-7555-8555-555555555555';
set app.role = 'finance';

do $$
declare
  v_receivable uuid;
  v_i1 uuid;
  v_i2 uuid;
  v_payment uuid;
  v_status installment_status;
  v_rstatus receivable_status;
  v_paid bigint;
begin
  insert into receivable (tenant_id, unit_id, patient_id, origin, total_cents, description)
  values ('11111111-1111-7111-8111-111111111111', 'a1111111-1111-7111-8111-111111111111',
          '0a111111-1111-7111-8111-111111111111', 'quote', 100000, 'Tratamento em 2x')
  returning id into v_receivable;

  -- A sobra de centavo vai na primeira parcela: 50000 + 50000.
  insert into installment (tenant_id, unit_id, receivable_id, patient_id, number, total_count, due_on, amount_cents)
  values ('11111111-1111-7111-8111-111111111111', 'a1111111-1111-7111-8111-111111111111',
          v_receivable, '0a111111-1111-7111-8111-111111111111', 1, 2, current_date, 50000)
  returning id into v_i1;

  insert into installment (tenant_id, unit_id, receivable_id, patient_id, number, total_count, due_on, amount_cents)
  values ('11111111-1111-7111-8111-111111111111', 'a1111111-1111-7111-8111-111111111111',
          v_receivable, '0a111111-1111-7111-8111-111111111111', 2, 2, current_date + 30, 50000)
  returning id into v_i2;

  -- Pagamento parcial.
  insert into payment (tenant_id, unit_id, installment_id, patient_id, payment_method_id, amount_cents)
  values ('11111111-1111-7111-8111-111111111111', 'a1111111-1111-7111-8111-111111111111',
          v_i1, '0a111111-1111-7111-8111-111111111111', '08111111-1111-7111-8111-111111111111', 20000)
  returning id into v_payment;

  select status, paid_cents into v_status, v_paid from installment where id = v_i1;
  perform test.check('financeiro', 'pagamento parcial muda a parcela para partially_paid',
    v_status = 'partially_paid' and v_paid = 20000, format('%s / %s', v_status, v_paid));

  select status into v_rstatus from receivable where id = v_receivable;
  perform test.check('financeiro', 'recebivel acompanha o saldo das parcelas',
    v_rstatus = 'partially_paid', v_rstatus::text);

  -- Quitacao.
  insert into payment (tenant_id, unit_id, installment_id, patient_id, payment_method_id, amount_cents)
  values ('11111111-1111-7111-8111-111111111111', 'a1111111-1111-7111-8111-111111111111',
          v_i1, '0a111111-1111-7111-8111-111111111111', '08111111-1111-7111-8111-111111111111', 30000);

  select status, paid_cents into v_status, v_paid from installment where id = v_i1;
  perform test.check('financeiro', 'soma dos pagamentos quita a parcela',
    v_status = 'paid' and v_paid = 50000, format('%s / %s', v_status, v_paid));

  -- Imutabilidade.
  perform test.rejects('financeiro',
    'pagamento confirmado nao pode ter o valor editado',
    format('update payment set amount_cents = 999 where id = %L', v_payment),
    'imutavel');

  perform test.rejects('financeiro',
    'pagamento nao pode ser apagado',
    format('delete from payment where id = %L', v_payment));

  perform test.rejects('financeiro',
    'parcela quitada nao pode ter valor ou vencimento alterado',
    format('update installment set amount_cents = 1 where id = %L', v_i1),
    'nao pode ser editada');

  -- Estorno: muda status, recalcula saldo, nada some.
  update payment
     set status = 'reversed', reversed_at = now(), reversal_reason = 'Cobranca em duplicidade'
   where id = v_payment;

  select status, paid_cents into v_status, v_paid from installment where id = v_i1;
  perform test.check('financeiro', 'estorno devolve a parcela para partially_paid',
    v_status = 'partially_paid' and v_paid = 30000, format('%s / %s', v_status, v_paid));

  perform test.check('financeiro', 'o pagamento estornado continua existindo para auditoria',
    (select count(*) from payment where id = v_payment) = 1);

  -- Estorno sem motivo, agora sobre um pagamento que existe de fato.
  perform test.rejects('financeiro',
    'estorno sem motivo e recusado',
    format($sql$update payment set status = 'reversed', reversed_at = now()
           where installment_id = %L and status = 'confirmed'$sql$, v_i1),
    'payment_reversed');

  -- Caixa fechado nao recebe lancamento.
  declare
    v_session uuid;
  begin
    insert into cash_session (tenant_id, unit_id, opened_by, opening_cents)
    values ('11111111-1111-7111-8111-111111111111', 'a1111111-1111-7111-8111-111111111111',
            'd5555555-5555-7555-8555-555555555555', 10000)
    returning id into v_session;

    insert into cash_movement (tenant_id, session_id, kind, amount_cents, description)
    values ('11111111-1111-7111-8111-111111111111', v_session, 'payment', 5000, 'Recebimento em dinheiro');

    update cash_session
       set status = 'closed', closed_at = now(), counted_cents = 15000, expected_cents = 15000,
           closed_by = 'd5555555-5555-7555-8555-555555555555'
     where id = v_session;

    perform test.check('financeiro', 'fechamento de caixa calcula a diferenca',
      (select difference_cents from cash_session where id = v_session) = 0);

    perform test.rejects('financeiro',
      'caixa fechado nao aceita nova movimentacao',
      format($sql$insert into cash_movement (tenant_id, session_id, kind, amount_cents)
             values ('11111111-1111-7111-8111-111111111111', %L, 'payment', 100)$sql$, v_session),
      'ja fechado');
  end;
end;
$$;

-- ------------------------------------------------------------- auditoria ---
do $$
declare
  v_before int;
  v_after int;
  v_keys text[];
begin
  select count(*) into v_before from audit_log where entity = 'patient';

  update patient set notes = 'Prefere atendimento pela manha'
   where id = '0a111111-1111-7111-8111-111111111111';

  select count(*) into v_after from audit_log where entity = 'patient';
  perform test.check('auditoria', 'alteracao em paciente gera registro de auditoria',
    v_after = v_before + 1, format('%s -> %s', v_before, v_after));

  select changed_keys into v_keys from audit_log
  where entity = 'patient' order by occurred_at desc limit 1;
  perform test.check('auditoria', 'auditoria registra exatamente quais campos mudaram',
    v_keys @> array['notes'], array_to_string(v_keys, ','));

  perform test.check('auditoria', 'auditoria registra o autor da alteracao',
    (select actor_id from audit_log where entity = 'patient' order by occurred_at desc limit 1)
      = 'c5555555-5555-7555-8555-555555555555');

  perform test.rejects('auditoria',
    'trilha de auditoria nao pode ser alterada',
    $sql$update audit_log set actor_id = null where entity = 'patient'$sql$);

  perform test.rejects('auditoria',
    'trilha de auditoria nao pode ser apagada',
    $sql$delete from audit_log where entity = 'patient'$sql$);

  -- Leitura de prontuario tambem deixa rastro.
  insert into phi_access_log (tenant_id, actor_id, patient_id, entity, purpose)
  values ('11111111-1111-7111-8111-111111111111', 'c5555555-5555-7555-8555-555555555555',
          '0a111111-1111-7111-8111-111111111111', 'clinical_note', 'auditoria');

  perform test.rejects('auditoria',
    'log de acesso a prontuario nao pode ser apagado',
    $sql$delete from phi_access_log$sql$);

  -- Mudanca de permissao de papel entra na auditoria pelo pai.
  perform test.check('auditoria', 'permissao de papel e auditada resolvendo o tenant pelo papel',
    (select count(*) from audit_log where entity = 'role_permission') > 0);
end;
$$;

-- ------------------------------------ prontuario restrito ao profissional ---
do $$
begin
  update tenant_policy set restrict_chart_to_own_patients = true
   where tenant_id = '11111111-1111-7111-8111-111111111111';

  perform set_config('app.membership_id', 'd2222222-2222-7222-8222-222222222222', false);

  perform test.check('prontuario', 'com politica restritiva, profissional nao ve prontuario alheio',
    not can_view_patient_chart('0a111111-1111-7111-8111-111111111111'));

  perform test.check('prontuario', 'evolucao de outro profissional some da consulta',
    (select count(*) from clinical_note
      where patient_id = '0a111111-1111-7111-8111-111111111111') = 0);

  perform set_config('app.membership_id', 'd3333333-3333-7333-8333-333333333333', false);

  perform test.check('prontuario', 'quem atendeu continua vendo o proprio registro',
    can_view_patient_chart('0a111111-1111-7111-8111-111111111111'));

  perform set_config('app.membership_id', 'd1111111-1111-7111-8111-111111111111', false);
  perform test.check('prontuario', 'papel com chart.read_all ve todos os prontuarios',
    can_view_patient_chart('0a111111-1111-7111-8111-111111111111'));

  update tenant_policy set restrict_chart_to_own_patients = false
   where tenant_id = '11111111-1111-7111-8111-111111111111';
end;
$$;
