-- =============================================================================
-- 0029 — O funil operando: elo com o orcamento, conversao de lead e proxima acao.
--
-- As tabelas do funil existem desde a 0004 (`lead`, `pipeline`, `opportunity`,
-- `activity`, `task`). O que faltava nao era estrutura, era LIGACAO: nada no
-- banco dizia que ganhar uma oportunidade e o mesmo evento que aceitar um
-- orcamento, e por isso os dois numeros podiam divergir — funil dizendo
-- "ganhei R$ 8.000" e financeiro sem nada a receber. E um relatorio em que
-- ninguem confia e pior do que nenhum.
--
-- O que este arquivo estabelece:
--
-- 1. UMA VERDADE SOBRE GANHAR. O orcamento aceito e o que ganha a oportunidade.
--    Nao ha botao de "marcar como ganha" que dispense o documento.
-- 2. PERDER CONTINUA SENDO DECISAO. Orcamento recusado NAO perde a oportunidade
--    sozinho: recusar uma proposta e comum, e a conversa segue com outra. Quem
--    perde e a pessoa, com motivo — e o motivo e o que alimenta o relatorio.
-- 3. ETAPA PERTENCE AO FUNIL. Ate aqui nada impedia apontar uma oportunidade do
--    funil A para uma etapa do funil B.
-- 4. PROXIMA ACAO E DO SISTEMA. A data da proxima tarefa aberta vive na
--    oportunidade, mantida por trigger: depender de alguem atualizar a mao e
--    como o lead esfria em silencio.
-- =============================================================================

-- ------------------------------------------------- etapa pertence ao funil --
-- Chave composta em vez de trigger: o proprio motor recusa, e nao ha caminho
-- (import, script, correcao manual) que escape.
alter table pipeline_stage
  add constraint pipeline_stage_pipeline_uk unique (id, pipeline_id);

alter table opportunity
  add constraint opportunity_stage_fk
  foreign key (stage_id, pipeline_id)
  references pipeline_stage (id, pipeline_id) on update restrict on delete restrict;

-- --------------------------------------------- orcamento e a oportunidade ---
-- A coluna existe desde a 0010: uma oportunidade pode gerar mais de um
-- orcamento ao longo da conversa (v1 cara demais, v2 faseada), e todos eles
-- pertencem ao mesmo negocio. O que faltava era INDICE — a consulta "quais
-- propostas saíram deste negocio" varria a tabela inteira — e as triggers
-- abaixo, que sao o que torna o vinculo uma verdade so.
create index quote_opportunity_idx on quote (tenant_id, opportunity_id)
  where opportunity_id is not null;

comment on column quote.opportunity_id is
  'De qual negocio do funil esta proposta saiu. Aceitar o orcamento ganha a oportunidade.';

-- O valor da oportunidade passa a ser o do orcamento assim que existe um: um
-- numero apurado vale mais do que a estimativa digitada na abertura.
create or replace function sync_opportunity_amount() returns trigger
language plpgsql
as $$
begin
  if new.opportunity_id is null then
    return null;
  end if;

  update opportunity o
     set amount_cents = new.total_cents
   where o.id = new.opportunity_id
     and o.status = 'open'
     and new.total_cents > 0;

  return null;
end;
$$;

create trigger quote_sync_opportunity_amount
  after insert or update of total_cents, opportunity_id on quote
  for each row execute function sync_opportunity_amount();

-- ---------------------------------------------------- ganhar e a mesma coisa --
create or replace function win_opportunity_from_quote() returns trigger
language plpgsql
as $$
declare
  v_stage uuid;
begin
  -- `after update of status` garante que `old` existe, entao a comparacao e
  -- direta. `coalesce(old.status, '')` pareceria defensivo e nao e: forcaria o
  -- Postgres a converter string vazia para o enum, e quebraria toda edicao de
  -- orcamento com "invalid input value for enum quote_status".
  if new.status <> 'accepted' or old.status = 'accepted' then
    return null;
  end if;

  if new.opportunity_id is null then
    return null;
  end if;

  -- A etapa de ganho e a que o proprio funil declara como tal. Funil sem etapa
  -- de ganho continua funcionando: o status muda e a etapa fica onde estava.
  select ps.id into v_stage
    from pipeline_stage ps
    join opportunity o on o.pipeline_id = ps.pipeline_id
   where o.id = new.opportunity_id and ps.is_won
   limit 1;

  update opportunity
     set status       = 'won',
         closed_at    = now(),
         amount_cents = new.total_cents,
         stage_id     = coalesce(v_stage, stage_id)
   where id = new.opportunity_id
     and status = 'open';

  return null;
end;
$$;

create trigger quote_win_opportunity
  after update of status on quote
  for each row execute function win_opportunity_from_quote();

comment on function win_opportunity_from_quote() is
  'Aceitar o orcamento ganha a oportunidade, na mesma transacao. Nao existe ganho sem documento.';

-- --------------------------------- historico de etapa: consertando a 0015 ---
-- A trigger de 0015 era `BEFORE insert or update` e gravava o historico ali
-- dentro. No UPDATE funciona; no INSERT, nao: a linha do historico aponta para
-- uma oportunidade que ainda nao existe, e o banco recusa pela chave
-- estrangeira. Ninguem tinha percebido porque nada no sistema inseria
-- oportunidade — e a primeira coisa que esta fatia faz e inserir uma.
--
-- A correcao e separar os dois trabalhos pelo momento em que cada um pode
-- acontecer: carimbar `stage_changed_at` na propria linha exige BEFORE, e
-- gravar o historico exige AFTER.
drop trigger opportunity_log_stage on opportunity;

create or replace function stamp_opportunity_stage() returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' or new.stage_id is distinct from old.stage_id then
    new.stage_changed_at := now();
  end if;
  return new;
end;
$$;

create trigger opportunity_stamp_stage
  before insert or update of stage_id on opportunity
  for each row execute function stamp_opportunity_stage();

create or replace function log_opportunity_stage() returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' or new.stage_id is distinct from old.stage_id then
    insert into opportunity_stage_history
      (tenant_id, opportunity_id, from_stage_id, to_stage_id, changed_by,
       seconds_in_previous_stage)
    values
      (new.tenant_id, new.id,
       case when tg_op = 'UPDATE' then old.stage_id end,
       new.stage_id, current_membership_id(),
       -- `old.stage_changed_at` ainda e o valor ANTERIOR: o BEFORE mexeu em
       -- `new`, nao em `old`. E dai que sai o tempo parado na etapa.
       case when tg_op = 'UPDATE'
         then extract(epoch from now() - old.stage_changed_at)::bigint end);
  end if;
  return null;
end;
$$;

create trigger opportunity_log_stage
  after insert or update of stage_id on opportunity
  for each row execute function log_opportunity_stage();

-- ------------------------------------------------ atividade esquenta o negocio --
create or replace function touch_opportunity_activity() returns trigger
language plpgsql
as $$
begin
  if new.opportunity_id is null then
    return null;
  end if;

  update opportunity
     set last_activity_at = greatest(coalesce(last_activity_at, new.occurred_at), new.occurred_at)
   where id = new.opportunity_id;

  return null;
end;
$$;

create trigger activity_touch_opportunity
  after insert on activity
  for each row execute function touch_opportunity_activity();

-- ------------------------------------------------------------ proxima acao --
-- `next_action_at` e a menor data entre as tarefas ABERTAS da oportunidade.
-- Recalculado inteiro em vez de ajustado incrementalmente: concluir a tarefa
-- mais proxima tem de revelar a seguinte, e nao deixar a data velha para tras.
create or replace function refresh_next_action() returns trigger
language plpgsql
as $$
declare
  v_opp uuid := coalesce(new.opportunity_id, old.opportunity_id);
begin
  if v_opp is null then
    return null;
  end if;

  update opportunity o
     set next_action_at = (
       select min(t.due_at) from task t
        where t.opportunity_id = v_opp and t.status = 'open'
     )
   where o.id = v_opp;

  return null;
end;
$$;

create trigger task_refresh_next_action
  after insert or update or delete on task
  for each row execute function refresh_next_action();

-- --------------------------------------------------- maquina de estado da tarefa --
insert into state_transition (entity, from_state, to_state, label, is_terminal) values
  ('task', 'open', 'done',     'Concluida',  true),
  ('task', 'open', 'canceled', 'Cancelada',  true),
  -- Concluir por engano acontece; reabrir fica auditado como qualquer mudanca.
  ('task', 'done',     'open', 'Reaberta',   false),
  ('task', 'canceled', 'open', 'Reaberta',   false);

create trigger task_assert_transition
  before update of status on task
  for each row execute function assert_state_transition('task');

-- ------------------------------------------------------ lead vira paciente --
-- O orcamento exige paciente, entao converter e passo obrigatorio do caminho —
-- nao um detalhe administrativo. A funcao existe para os tres lados mudarem
-- juntos: nasce o paciente, o lead sai da fila, e a oportunidade passa a
-- apontar para a pessoa.
create or replace function convert_lead_to_patient(p_lead_id uuid) returns uuid
language plpgsql
as $$
declare
  l          record;
  v_patient  uuid;
begin
  select * into l from lead where id = p_lead_id and deleted_at is null;

  if l is null then
    raise exception 'Lead nao encontrado.';
  end if;

  if l.converted_patient_id is not null then
    return l.converted_patient_id;
  end if;

  if l.status = 'disqualified' then
    raise exception
      'Este lead foi desqualificado. Reabra antes de converter em paciente.';
  end if;

  -- Mesmo telefone ja cadastrado quase sempre e a mesma pessoa voltando. Criar
  -- um segundo cadastro aqui espalharia o historico clinico em dois lugares —
  -- que e o pior estrago que um CRM de clinica consegue fazer.
  select id into v_patient
    from patient
   where phone = l.phone and deleted_at is null
   limit 1;

  if v_patient is null then
    -- `code` e atribuido por trigger, e a unidade de origem do paciente e a do
    -- lead: e onde a pessoa procurou a clinica, que e a informacao que o
    -- relatorio de captacao usa depois.
    insert into patient (
      tenant_id, origin_unit_id, full_name, phone, email, source_id, status
    ) values (
      l.tenant_id, l.unit_id, l.full_name, l.phone, l.email, l.source_id, 'active'
    )
    returning id into v_patient;
  end if;

  update lead
     set status = 'converted',
         converted_patient_id = v_patient,
         converted_at = now()
   where id = p_lead_id;

  update opportunity
     set patient_id = v_patient
   where lead_id = p_lead_id and patient_id is null;

  return v_patient;
end;
$$;

comment on function convert_lead_to_patient(uuid) is
  'Lead vira paciente: cria o cadastro (ou reaproveita o do mesmo telefone) e liga a oportunidade nele.';

-- ------------------------------------------------------------- auditoria ----
-- Lead carrega nome, telefone e e-mail de quem ainda nem e paciente: dado
-- pessoal sob LGPD como qualquer outro. Oportunidade carrega quanto se pediu a
-- essa pessoa, e quem mexeu nisso importa.
do $$
declare
  t text;
begin
  foreach t in array array['lead', 'opportunity', 'task']
  loop
    execute format(
      'create trigger %I after insert or update or delete on %I
         for each row execute function write_audit_log()',
      t || '_audit', t
    );
  end loop;
end;
$$;

-- ------------------------------------------------------------ permissoes ----
insert into permission (key, resource, action, description, is_phi) values
  ('task.read',  'task', 'read',  'Ver tarefas e pendencias', false),
  ('task.write', 'task', 'write', 'Criar, concluir e cancelar tarefa', false);

insert into system_role_permission (role_code, permission_key) values
  ('owner',        'task.read'),
  ('owner',        'task.write'),
  ('manager',      'task.read'),
  ('manager',      'task.write'),
  ('professional', 'task.read'),
  ('professional', 'task.write'),
  ('reception',    'task.read'),
  ('reception',    'task.write'),
  ('finance',      'task.read');

do $$
declare
  t uuid;
begin
  for t in select id from tenant loop
    perform bootstrap_tenant_roles(t);
  end loop;
end;
$$;
