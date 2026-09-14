-- =============================================================================
-- 0001 — Fundacao: extensoes, tipos base, funcoes e infraestrutura transversal.
--
-- Tudo que as outras migrations assumem existir mora aqui: geracao de UUID v7,
-- carimbo de updated_at, maquina de estados generica, auditoria imutavel e o
-- outbox transacional.
-- =============================================================================

create extension if not exists pgcrypto;   -- gen_random_uuid, digest
create extension if not exists citext;     -- e-mail sem case-sensitivity
create extension if not exists btree_gist; -- exclusion constraint com uuid + range
create extension if not exists pg_trgm;    -- busca por nome de paciente

-- -----------------------------------------------------------------------------
-- UUID v7: ordenavel por tempo. Importa porque PK aleatoria (v4) fragmenta o
-- indice e degrada insert em tabela grande (agendamento, movimentacao, mensagem).
-- PostgreSQL 18 traz uuidv7() nativo; ate la, esta implementacao.
-- -----------------------------------------------------------------------------
create or replace function uuid_generate_v7() returns uuid
language plpgsql
volatile
as $$
declare
  unix_ts_ms bytea;
  uuid_bytes bytea;
begin
  unix_ts_ms := substring(
    int8send(floor(extract(epoch from clock_timestamp()) * 1000)::bigint) from 3
  );

  -- Aproveita o v4 do pgcrypto: ele ja traz aleatoriedade e os bits de variante
  -- corretos. Sobrescrevemos os 48 bits de timestamp e o nibble de versao.
  uuid_bytes := uuid_send(gen_random_uuid());
  uuid_bytes := overlay(uuid_bytes placing unix_ts_ms from 1 for 6);
  uuid_bytes := set_byte(uuid_bytes, 6, (get_byte(uuid_bytes, 6) & 15) | 112);

  return encode(uuid_bytes, 'hex')::uuid;
end;
$$;

comment on function uuid_generate_v7() is
  'UUID v7 (48 bits de timestamp + aleatorio). PK padrao de todas as tabelas.';

-- -----------------------------------------------------------------------------
-- Contexto da requisicao. O app abre a transacao e faz:
--   set local app.tenant_id = '...'; set local app.user_id = '...';
-- As policies de RLS leem daqui. `true` no current_setting evita erro quando a
-- variavel nao existe (migrations, jobs de manutencao).
-- -----------------------------------------------------------------------------
create or replace function current_tenant_id() returns uuid
language sql
stable
as $$
  select nullif(current_setting('app.tenant_id', true), '')::uuid;
$$;

create or replace function current_user_id() returns uuid
language sql
stable
as $$
  select nullif(current_setting('app.user_id', true), '')::uuid;
$$;

-- -----------------------------------------------------------------------------
-- updated_at automatico.
-- -----------------------------------------------------------------------------
create or replace function set_updated_at() returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- Maquina de estados generica.
--
-- As transicoes validas sao DADO, nao codigo: ficam em state_transition e o
-- trigger consulta. Assim a mesma tabela documenta o fluxo, alimenta a UI
-- ("para onde posso mover isto?") e barra a transicao invalida no banco.
-- -----------------------------------------------------------------------------
create table state_transition (
  entity      text    not null,
  from_state  text    not null,
  to_state    text    not null,
  label       text    not null,
  is_terminal boolean not null default false,
  primary key (entity, from_state, to_state)
);

comment on table state_transition is
  'Transicoes permitidas por entidade. Fonte unica: banco, app e UI leem daqui.';

create or replace function assert_state_transition() returns trigger
language plpgsql
as $$
declare
  entity_name text := tg_argv[0];
  status_col  text := coalesce(tg_argv[1], 'status');
  old_state   text := to_jsonb(old) ->> status_col;
  new_state   text := to_jsonb(new) ->> status_col;
begin
  if old_state is not distinct from new_state then
    return new;
  end if;

  if not exists (
    select 1 from state_transition
    where entity = entity_name
      and from_state = old_state
      and to_state = new_state
  ) then
    raise exception
      'Transicao invalida em %: % -> %', entity_name, old_state, new_state
      using errcode = 'check_violation',
            hint = 'Consulte state_transition para as transicoes permitidas.';
  end if;

  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- Auditoria.
--
-- audit_log registra ESCRITA (insert/update/delete) em entidade sensivel.
-- phi_access_log registra LEITURA de dado clinico — exigencia de LGPD que
-- praticamente nenhum concorrente cumpre: e preciso saber quem abriu o
-- prontuario, nao so quem alterou.
--
-- Ambas sao append-only: o trigger bloqueia update/delete ate para quem tem
-- permissao de tabela, e o grant e revogado em 0014.
-- -----------------------------------------------------------------------------
create table audit_log (
  id           uuid primary key default uuid_generate_v7(),
  tenant_id    uuid not null,
  unit_id      uuid,
  actor_id     uuid,
  actor_role   text,
  action       text not null check (action in ('insert', 'update', 'delete', 'restore')),
  entity       text not null,
  -- Nulo em tabela de juncao (sem id proprio); nesse caso entity_key identifica.
  entity_id    uuid,
  entity_key   text,
  before_data  jsonb,
  after_data   jsonb,
  changed_keys text[],
  request_id   text,
  ip_address   inet,
  user_agent   text,
  occurred_at  timestamptz not null default now()
);

create index audit_log_tenant_time_idx  on audit_log (tenant_id, occurred_at desc);
create index audit_log_entity_idx       on audit_log (tenant_id, entity, entity_id, occurred_at desc);
create index audit_log_actor_idx        on audit_log (tenant_id, actor_id, occurred_at desc);

create table phi_access_log (
  id          uuid primary key default uuid_generate_v7(),
  tenant_id   uuid not null,
  unit_id     uuid,
  actor_id    uuid not null,
  patient_id  uuid not null,
  entity      text not null,
  entity_id   uuid,
  purpose     text not null check (purpose in
    ('atendimento', 'faturamento', 'auditoria', 'suporte', 'exportacao_lgpd')),
  request_id  text,
  ip_address  inet,
  occurred_at timestamptz not null default now()
);

create index phi_access_log_patient_idx on phi_access_log (tenant_id, patient_id, occurred_at desc);
create index phi_access_log_actor_idx   on phi_access_log (tenant_id, actor_id, occurred_at desc);

create or replace function forbid_mutation() returns trigger
language plpgsql
as $$
begin
  raise exception 'Tabela % e append-only: registro nao pode ser alterado nem apagado.', tg_table_name
    using errcode = 'insufficient_privilege';
end;
$$;

create trigger audit_log_append_only
  before update or delete on audit_log
  for each row execute function forbid_mutation();

create trigger phi_access_log_append_only
  before update or delete on phi_access_log
  for each row execute function forbid_mutation();

-- Trigger de auditoria.
--
-- Serve tambem tabela de juncao, que nao tem tenant_id nem id proprios. Nesse
-- caso passe dois argumentos ao trigger:
--   arg0 = coluna que aponta para o pai (ex.: 'role_id')
--   arg1 = tabela do pai, de onde o tenant_id e resolvido (ex.: 'role')
create or replace function write_audit_log() returns trigger
language plpgsql
security definer
as $$
declare
  before_data jsonb := case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) end;
  after_data  jsonb := case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) end;
  row_data    jsonb := coalesce(after_data, before_data);
  row_tenant  uuid  := nullif(row_data ->> 'tenant_id', '')::uuid;
  row_unit    uuid  := nullif(row_data ->> 'unit_id', '')::uuid;
  row_id      uuid  := nullif(row_data ->> 'id', '')::uuid;
  row_key     text;
  parent_col  text  := tg_argv[0];
  parent_tbl  text  := tg_argv[1];
  op          text  := lower(tg_op);
  keys        text[];
begin
  if row_id is null and parent_col is not null then
    row_id := nullif(row_data ->> parent_col, '')::uuid;
  end if;

  if row_tenant is null and parent_col is not null and parent_tbl is not null then
    execute format('select tenant_id from %I where id = $1', parent_tbl)
      into row_tenant
      using nullif(row_data ->> parent_col, '')::uuid;
  end if;

  -- Sem tenant nao ha a quem atribuir o registro; melhor nao auditar do que
  -- gravar linha orfa que quebra o relatorio de auditoria.
  if row_tenant is null then
    return coalesce(new, old);
  end if;

  if row_id is null then
    row_key := row_data::text;
  end if;

  if tg_op = 'UPDATE' then
    select array_agg(key order by key) into keys
    from jsonb_each(after_data)
    where after_data -> key is distinct from before_data -> key;

    -- Soft delete e restore aparecem como update; classificamos para o relatorio.
    if (before_data ->> 'deleted_at') is null and (after_data ->> 'deleted_at') is not null then
      op := 'delete';
    elsif (before_data ->> 'deleted_at') is not null and (after_data ->> 'deleted_at') is null then
      op := 'restore';
    end if;

    if keys is null then
      return coalesce(new, old);
    end if;
  end if;

  insert into audit_log (
    tenant_id, unit_id, actor_id, actor_role, action, entity, entity_id, entity_key,
    before_data, after_data, changed_keys, request_id, ip_address, user_agent
  )
  values (
    row_tenant, row_unit, current_user_id(),
    nullif(current_setting('app.role', true), ''),
    op, tg_table_name, row_id, row_key,
    before_data, after_data, keys,
    nullif(current_setting('app.request_id', true), ''),
    nullif(current_setting('app.ip', true), '')::inet,
    nullif(current_setting('app.user_agent', true), '')
  );

  return coalesce(new, old);
end;
$$;

comment on function write_audit_log() is
  'Trigger de auditoria. security definer: o app nao precisa de INSERT direto em audit_log.';

-- -----------------------------------------------------------------------------
-- Outbox transacional.
--
-- Cobranca e mensagem so saem depois que a transacao de negocio commitou, e
-- exatamente uma vez. O worker le daqui; a chave de idempotencia impede
-- duplicata mesmo com retry ou com dois workers concorrentes.
-- -----------------------------------------------------------------------------
create type outbox_status as enum ('pending', 'processing', 'sent', 'failed', 'discarded');

create table outbox_message (
  id              uuid primary key default uuid_generate_v7(),
  tenant_id       uuid not null,
  topic           text not null,
  idempotency_key text not null,
  payload         jsonb not null,
  status          outbox_status not null default 'pending',
  attempts        int not null default 0 check (attempts >= 0),
  max_attempts    int not null default 8 check (max_attempts > 0),
  available_at    timestamptz not null default now(),
  locked_at       timestamptz,
  locked_by       text,
  last_error      text,
  created_at      timestamptz not null default now(),
  processed_at    timestamptz,

  constraint outbox_message_idempotency_uk unique (tenant_id, topic, idempotency_key)
);

create index outbox_message_ready_idx
  on outbox_message (available_at)
  where status = 'pending';

comment on table outbox_message is
  'Efeito externo (webhook, WhatsApp, e-mail) escrito na mesma transacao do negocio.';

-- Entrada: evento externo ja processado, para nao processar duas vezes.
create table inbound_event (
  id           uuid primary key default uuid_generate_v7(),
  tenant_id    uuid,
  source       text not null,
  external_id  text not null,
  event_type   text,
  payload      jsonb not null,
  signature_ok boolean not null default false,
  processed_at timestamptz,
  received_at  timestamptz not null default now(),

  constraint inbound_event_source_uk unique (source, external_id)
);

comment on table inbound_event is
  'Webhook recebido. A unique (source, external_id) e a defesa contra reprocessar cobranca.';

-- -----------------------------------------------------------------------------
-- Fila de jobs (confirmacao de consulta, alertas, recorrencia, snapshots).
-- -----------------------------------------------------------------------------
create type job_status as enum ('scheduled', 'running', 'done', 'failed', 'canceled');

create table job (
  id           uuid primary key default uuid_generate_v7(),
  tenant_id    uuid,
  kind         text not null,
  dedupe_key   text,
  payload      jsonb not null default '{}'::jsonb,
  status       job_status not null default 'scheduled',
  run_at       timestamptz not null default now(),
  attempts     int not null default 0,
  max_attempts int not null default 5,
  locked_at    timestamptz,
  locked_by    text,
  last_error   text,
  created_at   timestamptz not null default now(),
  finished_at  timestamptz,

  constraint job_dedupe_uk unique nulls not distinct (tenant_id, kind, dedupe_key)
);

create index job_ready_idx on job (run_at) where status = 'scheduled';
