-- =============================================================================
-- Funil de vendas: do lead ao orcamento aceito.
--
-- O que estes testes travam:
--
--   - GANHAR e o mesmo evento que aceitar o orcamento, na mesma transacao —
--     nao ha funil dizendo "ganhei" com o financeiro vazio;
--   - PERDER continua sendo decisao de gente, com motivo: orcamento recusado
--     nao perde a oportunidade sozinho, porque a conversa costuma seguir;
--   - etapa pertence ao funil, e o banco recusa apontar para a de outro;
--   - a proxima acao e mantida pelo sistema, e concluir a mais proxima revela
--     a seguinte em vez de deixar a data velha para tras.
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
  PROF     constant uuid := 'd1111111-1111-7111-8111-111111111111';
  FUNIL    constant uuid := 'f1111111-1111-7111-8111-111111111111';

  v_novo     uuid;
  v_proposta uuid;
  v_ganho    uuid;
  v_lead     uuid;
  v_opp      uuid;
  v_pac      uuid;
  v_quote    uuid;
  v_task_a   uuid;
  v_task_b   uuid;
  v_valor    bigint;
  v_status   text;
  v_data     timestamptz;
  v_n        int;
begin
  select id into v_novo     from pipeline_stage where pipeline_id = FUNIL and code = 'NOVO';
  select id into v_proposta from pipeline_stage where pipeline_id = FUNIL and code = 'PROPOSTA';
  select id into v_ganho    from pipeline_stage where pipeline_id = FUNIL and code = 'GANHO';

  -- ------------------------------------------------------------- lead -----
  insert into lead (tenant_id, unit_id, full_name, phone, email, interest,
                    source_id, owner_id)
  values (TENANT, UNIDADE, 'Beatriz Lemos', '11987651234', 'bia@exemplo.com',
          'Clareamento e faceta', 'e1111111-1111-7111-8111-111111111111', PROF)
  returning id into v_lead;

  perform test.check('funil', 'lead nasce novo, e ainda nao e paciente',
    (select status from lead where id = v_lead) = 'new'
      and (select converted_patient_id from lead where id = v_lead) is null);

  insert into opportunity (tenant_id, unit_id, pipeline_id, stage_id, lead_id,
                           title, amount_cents, owner_id)
  values (TENANT, UNIDADE, FUNIL, v_novo, v_lead, 'Clareamento e faceta', 500000, PROF)
  returning id into v_opp;

  perform test.check('funil', 'abrir oportunidade ja grava a etapa no historico',
    (select count(*) from opportunity_stage_history where opportunity_id = v_opp) = 1);

  -- ------------------------------------------- etapa pertence ao funil ----
  declare
    v_outro uuid;
    v_etapa_alheia uuid;
  begin
    insert into pipeline (tenant_id, code, name, vertical)
    values (TENANT, 'HOF', 'Funil de harmonizacao', 'estetica')
    returning id into v_outro;

    insert into pipeline_stage (tenant_id, pipeline_id, code, name, sort_order)
    values (TENANT, v_outro, 'TRIAGEM', 'Triagem', 1)
    returning id into v_etapa_alheia;

    perform test.rejects('funil',
      'oportunidade nao aponta para etapa de outro funil',
      format('update opportunity set stage_id = %L where id = %L', v_etapa_alheia, v_opp),
      'opportunity_stage_fk');
  end;

  -- --------------------------------------------------------- atividade ----
  perform test.check('funil', 'oportunidade nova ainda nao tem contato registrado',
    (select last_activity_at from opportunity where id = v_opp) is null);

  insert into activity (tenant_id, opportunity_id, kind, body, performed_by)
  values (TENANT, v_opp, 'whatsapp', 'Mandei os valores e as fotos do antes e depois.', PROF);

  perform test.check('funil', 'registrar contato esquenta o negocio',
    (select last_activity_at from opportunity where id = v_opp) is not null);

  -- ------------------------------------------------------ proxima acao ----
  insert into task (tenant_id, unit_id, opportunity_id, title, due_at,
                    assigned_to, created_by)
  values (TENANT, UNIDADE, v_opp, 'Ligar para confirmar a avaliacao',
          now() + interval '3 days', PROF, PROF)
  returning id into v_task_a;

  insert into task (tenant_id, unit_id, opportunity_id, title, due_at,
                    assigned_to, created_by)
  values (TENANT, UNIDADE, v_opp, 'Mandar o plano por escrito',
          now() + interval '1 day', PROF, PROF)
  returning id into v_task_b;

  select next_action_at into v_data from opportunity where id = v_opp;
  perform test.check('funil', 'a proxima acao e a tarefa aberta mais proxima',
    v_data::date = (now() + interval '1 day')::date,
    format('proxima=%s', v_data));

  -- Concluir a mais proxima tem de REVELAR a seguinte, nao deixar a data velha.
  update task set status = 'done', completed_at = now(), completed_by = PROF
   where id = v_task_b;

  select next_action_at into v_data from opportunity where id = v_opp;
  perform test.check('funil', 'concluir a mais proxima revela a seguinte',
    v_data::date = (now() + interval '3 days')::date,
    format('proxima=%s', v_data));

  perform test.rejects('funil', 'tarefa nao pula de concluida para cancelada',
    format('update task set status = ''canceled'' where id = %L', v_task_b),
    'Transicao invalida');

  update task set status = 'done', completed_at = now() where id = v_task_a;

  select next_action_at into v_data from opportunity where id = v_opp;
  perform test.check('funil', 'sem tarefa aberta, nao ha proxima acao',
    v_data is null, format('proxima=%s', v_data));

  -- ----------------------------------------------- lead vira paciente -----
  v_pac := convert_lead_to_patient(v_lead);

  perform test.check('funil', 'converter cria o paciente e fecha o lead',
    v_pac is not null
      and (select status from lead where id = v_lead) = 'converted'
      and (select converted_patient_id from lead where id = v_lead) = v_pac);

  perform test.check('funil', 'e a oportunidade passa a apontar para a pessoa',
    (select patient_id from opportunity where id = v_opp) = v_pac);

  perform test.check('funil', 'converter duas vezes devolve o mesmo paciente',
    convert_lead_to_patient(v_lead) = v_pac);

  -- Telefone ja cadastrado e a mesma pessoa voltando: espalhar o historico
  -- clinico em dois cadastros e o pior estrago que um CRM de clinica faz.
  declare
    v_lead2 uuid;
    v_pac2  uuid;
  begin
    insert into lead (tenant_id, unit_id, full_name, phone)
    values (TENANT, UNIDADE, 'Beatriz L.', '11987651234')
    returning id into v_lead2;

    v_pac2 := convert_lead_to_patient(v_lead2);

    perform test.check('funil', 'lead com telefone ja cadastrado reaproveita o paciente',
      v_pac2 = v_pac, format('pac=%s pac2=%s', v_pac, v_pac2));
  end;

  -- --------------------------------------------------------- orcamento ----
  update opportunity set stage_id = v_proposta where id = v_opp;

  perform test.check('funil', 'mover de etapa grava no historico com o tempo parado',
    (select count(*) from opportunity_stage_history where opportunity_id = v_opp) = 2
      and (select seconds_in_previous_stage from opportunity_stage_history
            where opportunity_id = v_opp and to_stage_id = v_proposta) is not null);

  insert into quote (tenant_id, unit_id, patient_id, provider_id, opportunity_id,
                     valid_until, installment_count, title)
  values (TENANT, UNIDADE, v_pac, PROF, v_opp, current_date + 15, 1, 'Clareamento e faceta')
  returning id into v_quote;

  insert into quote_item (tenant_id, quote_id, description, quantity, unit_price_cents)
  values (TENANT, v_quote, 'Clareamento de consultorio', 1, 90000);

  select amount_cents into v_valor from opportunity where id = v_opp;
  perform test.check('funil', 'o valor do negocio passa a ser o do orcamento',
    v_valor = 90000, format('valor=%s', v_valor));

  -- ------------------------------------------- recusar nao perde sozinho --
  update quote set status = 'sent', sent_at = now() where id = v_quote;
  update quote set status = 'rejected', rejected_at = now(),
                   loss_reason_id = (select id from loss_reason where code = 'PRECO')
   where id = v_quote;

  perform test.check('funil', 'orcamento recusado NAO perde a oportunidade',
    (select status from opportunity where id = v_opp) = 'open',
    format('status=%s', (select status from opportunity where id = v_opp)));

  -- --------------------------------------------- aceitar ganha o negocio --
  declare
    v_q2 uuid;
  begin
    insert into quote (tenant_id, unit_id, patient_id, provider_id, opportunity_id,
                       valid_until, installment_count, title)
    values (TENANT, UNIDADE, v_pac, PROF, v_opp, current_date + 15, 1,
            'Clareamento e faceta — v2')
    returning id into v_q2;

    insert into quote_item (tenant_id, quote_id, description, quantity, unit_price_cents)
    values (TENANT, v_q2, 'Clareamento, faseado', 1, 70000);

    update quote set status = 'sent', sent_at = now() where id = v_q2;
    update quote set status = 'accepted', accepted_at = now(), signed_hash = 'x'
     where id = v_q2;

    select status, amount_cents, stage_id into v_status, v_valor, v_ganho
      from opportunity where id = v_opp;

    perform test.check('funil', 'aceitar o orcamento ganha a oportunidade',
      v_status = 'won', format('status=%s', v_status));

    perform test.check('funil', 'e o valor ganho e o do documento, nao a estimativa',
      v_valor = 70000, format('valor=%s', v_valor));

    perform test.check('funil', 'e ela vai para a etapa de ganho do proprio funil',
      (select is_won from pipeline_stage where id = v_ganho));

    perform test.check('funil', 'ganhar carimba o fechamento',
      (select closed_at from opportunity where id = v_opp) is not null);

    -- A prova de que os dois numeros nao divergem: ganhou, entao ha recebivel.
    perform test.check('funil', 'ganhar no funil deixa dinheiro no financeiro',
      (select count(*) from receivable where quote_id = v_q2) = 1);
  end;

  -- ------------------------------------------------ perder e decisao ------
  declare
    v_opp2 uuid;
  begin
    insert into opportunity (tenant_id, unit_id, pipeline_id, stage_id, lead_id,
                             title, amount_cents, owner_id)
    values (TENANT, UNIDADE, FUNIL, v_novo, v_lead, 'Segundo tratamento', 200000, PROF)
    returning id into v_opp2;

    perform test.rejects('funil', 'perder sem motivo e recusado',
      format('update opportunity set status = ''lost'', closed_at = now() where id = %L', v_opp2),
      'opportunity_lost_reason');

    update opportunity
       set status = 'lost', closed_at = now(),
           loss_reason_id = (select id from loss_reason where code = 'ADIOU'),
           loss_notes = 'Vai fazer depois das ferias.'
     where id = v_opp2;

    perform test.check('funil', 'perdida com motivo fecha e guarda a razao',
      (select status from opportunity where id = v_opp2) = 'lost');

    perform test.rejects('funil', 'oportunidade nao pula de perdida para ganha',
      format('update opportunity set status = ''won'' where id = %L', v_opp2),
      'Transicao invalida');

    -- Reabrir existe: negocio que voltou e mais comum do que erro de marcacao.
    update opportunity set status = 'open', closed_at = null where id = v_opp2;
    perform test.check('funil', 'perdida pode ser reaberta',
      (select status from opportunity where id = v_opp2) = 'open');
  end;

  -- ---------------------------------------------------- isolamento --------
  declare
    v_visiveis int;
  begin
    set local app.tenant_id = '22222222-2222-7222-8222-222222222222';
    set local app.membership_id = 'd9999999-9999-7999-8999-999999999999';

    select count(*) into v_visiveis from lead where id = v_lead;
    perform test.check('funil', 'lead da rede A e invisivel na rede B',
      v_visiveis = 0);

    select count(*) into v_visiveis from opportunity where id = v_opp;
    perform test.check('funil', 'e a oportunidade dela tambem',
      v_visiveis = 0);

    set local app.tenant_id = '11111111-1111-7111-8111-111111111111';
    set local app.membership_id = 'd1111111-1111-7111-8111-111111111111';
  end;
end;
$$;
