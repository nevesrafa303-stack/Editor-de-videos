-- =============================================================================
-- Denormalizacoes do paciente.
--
-- A regra que estes testes travam: marcar, cancelar ou concluir consulta
-- atualiza o paciente NA MESMA TRANSACAO. A versao anterior confiava num job
-- noturno que nao existia, e a lista de pacientes mostrava "sem proxima
-- consulta" para quem tinha consulta marcada para daqui a uma hora.
-- =============================================================================
\set QUIET on
\set ON_ERROR_STOP on

set app.tenant_id = '11111111-1111-7111-8111-111111111111';
set app.user_id = 'c1111111-1111-7111-8111-111111111111';
set app.membership_id = 'd1111111-1111-7111-8111-111111111111';
set app.role = 'owner';

do $$
declare
  -- Paciente proprio da suite: as demais suites tambem marcam consulta no
  -- mesmo banco, e um teste de rollup que depende do que a suite anterior
  -- deixou mede sujeira, nao regressao.
  v_patient uuid;
  v_appt    uuid;
  v_next    timestamptz;
  v_before  timestamptz;
  v_faltas  int;
  v_visitas int;
  v_saldo   bigint;
  v_audit   int;
  -- Longe de tudo que as outras suites usam: a exclusion constraint e real.
  v_base    timestamptz := date_trunc('hour', now()) + interval '120 days';
begin
  insert into patient (tenant_id, origin_unit_id, full_name, phone)
  values ('11111111-1111-7111-8111-111111111111', 'a1111111-1111-7111-8111-111111111111',
          'Paciente de Rollup', '11900000001')
  returning id into v_patient;

  perform test.check('rollup', 'paciente novo nasce sem proxima consulta',
    (select next_appointment_at from patient where id = v_patient) is null);
  -- ------------------------------------------------------- proxima consulta --
  insert into appointment (tenant_id, unit_id, patient_id, provider_id, starts_at, ends_at)
  values ('11111111-1111-7111-8111-111111111111', 'a1111111-1111-7111-8111-111111111111',
          v_patient, 'd1111111-1111-7111-8111-111111111111',
          v_base, v_base + interval '1 hour')
  returning id into v_appt;

  select next_appointment_at into v_next from patient where id = v_patient;
  perform test.check('rollup', 'marcar consulta preenche a proxima consulta do paciente',
    v_next = v_base, format('next=%s esperado=%s', v_next, v_base));

  -- Uma consulta MAIS CEDO passa a ser a proxima.
  insert into appointment (tenant_id, unit_id, patient_id, provider_id, starts_at, ends_at)
  values ('11111111-1111-7111-8111-111111111111', 'a1111111-1111-7111-8111-111111111111',
          v_patient, 'd2222222-2222-7222-8222-222222222222',
          v_base - interval '1 day', v_base - interval '1 day' + interval '30 minutes');

  select next_appointment_at into v_next from patient where id = v_patient;
  perform test.check('rollup', 'consulta mais cedo vira a proxima',
    v_next = v_base - interval '1 day', format('next=%s', v_next));

  -- ------------------------------------------------------------ cancelamento --
  update appointment
     set status = 'canceled', cancel_reason = 'Teste de rollup', canceled_by = 'clinic'
   where starts_at = v_base - interval '1 day' and patient_id = v_patient;

  select next_appointment_at into v_next from patient where id = v_patient;
  perform test.check('rollup', 'cancelar devolve a proxima consulta para a seguinte',
    v_next = v_base, format('next=%s', v_next));

  -- ------------------------------------------------------------------ falta --
  select no_show_count into v_faltas from patient where id = v_patient;

  update appointment set status = 'no_show' where id = v_appt;

  perform test.check('rollup', 'falta entra na contagem do paciente',
    (select no_show_count from patient where id = v_patient) = v_faltas + 1);

  perform test.check('rollup', 'paciente sem consulta futura fica sem proxima consulta',
    (select next_appointment_at from patient where id = v_patient) is null);

  -- ------------------------------------------------------------ atendimento --
  select visit_count into v_visitas from patient where id = v_patient;

  insert into appointment (tenant_id, unit_id, patient_id, provider_id, starts_at, ends_at, status)
  values ('11111111-1111-7111-8111-111111111111', 'a1111111-1111-7111-8111-111111111111',
          v_patient, 'd1111111-1111-7111-8111-111111111111',
          v_base + interval '5 days', v_base + interval '5 days 1 hour', 'scheduled')
  returning id into v_appt;

  update appointment set status = 'confirmed' where id = v_appt;
  update appointment set status = 'arrived'   where id = v_appt;
  update appointment set status = 'in_progress' where id = v_appt;
  update appointment set status = 'completed' where id = v_appt;

  perform test.check('rollup', 'atendimento concluido entra na contagem de visitas',
    (select visit_count from patient where id = v_patient) = v_visitas + 1);

  -- -------------------------------------------------------------- financeiro --
  select open_balance_cents into v_saldo
    from patient where id = '0a222222-2222-7222-8222-222222222222';

  perform test.check('rollup', 'saldo em aberto vem das parcelas, nao de campo solto',
    v_saldo = (
      select coalesce(sum(amount_cents - paid_cents), 0)
      from installment
      where patient_id = '0a222222-2222-7222-8222-222222222222'
        and status in ('open', 'partially_paid')
    ), format('saldo=%s', v_saldo));

  -- --------------------------------------------------------------- auditoria --
  -- Recalculo de cache nao e alteracao de dado do paciente: se entrasse na
  -- trilha, cada confirmacao de consulta viraria uma linha e a auditoria
  -- clinica ficaria impossivel de ler.
  select count(*) into v_audit
    from audit_log
   where entity = 'patient'
     and entity_id = v_patient
     and changed_keys <@ array['updated_at', 'next_appointment_at', 'visit_count',
                               'no_show_count', 'last_visit_at', 'first_visit_at',
                               'open_balance_cents', 'lifetime_value_cents', 'no_show_risk'];

  perform test.check('rollup', 'recalculo de denormalizacao nao polui a auditoria',
    v_audit = 0, format('%s linhas de auditoria so com coluna derivada', v_audit));

  -- Alteracao de verdade continua sendo auditada.
  select count(*) into v_audit from audit_log where entity = 'patient' and entity_id = v_patient;
  update patient set notes = 'Alteracao real para teste de auditoria.' where id = v_patient;

  perform test.check('rollup', 'alteracao de verdade continua na trilha',
    (select count(*) from audit_log where entity = 'patient' and entity_id = v_patient) = v_audit + 1);

  -- ------------------------------------------------------------------ reparo --
  update patient set next_appointment_at = null, visit_count = 0 where id = v_patient;
  perform refresh_patient_rollup(v_patient);

  perform test.check('rollup', 'reparo recalcula o que foi corrompido',
    (select visit_count from patient where id = v_patient) = v_visitas + 1);
end;
$$;
