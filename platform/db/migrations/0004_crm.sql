-- =============================================================================
-- 0004 — CRM comercial: lead, pipeline, oportunidade, atividade, campanha e
-- conversa de WhatsApp (Cloud API oficial).
--
-- Separacao proposital: LEAD e a pessoa que ainda nao e paciente; OPORTUNIDADE
-- e o negocio. Um paciente antigo pode gerar nova oportunidade (segundo
-- tratamento) sem virar lead de novo — e e ai que mora a receita recorrente.
-- =============================================================================

create type lead_status as enum ('new', 'working', 'qualified', 'converted', 'disqualified');

create table lead (
  id             uuid primary key default uuid_generate_v7(),
  tenant_id      uuid not null references tenant (id) on delete cascade,
  unit_id        uuid references unit (id) on delete set null,
  full_name      text not null,
  phone          text not null,
  email          citext,
  source_id      uuid references acquisition_source (id) on delete set null,
  campaign_id    uuid,                                -- FK adicionada abaixo
  status         lead_status not null default 'new',
  interest       text,
  -- Rastreio de midia paga, para fechar o ciclo custo -> receita.
  utm_source     text,
  utm_medium     text,
  utm_campaign   text,
  utm_content    text,
  owner_id       uuid references membership (id) on delete set null,
  converted_patient_id uuid references patient (id) on delete set null,
  converted_at   timestamptz,
  disqualify_reason text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  deleted_at     timestamptz,

  constraint lead_converted_consistent check (
    (status = 'converted') = (converted_patient_id is not null)
  )
);

create index lead_tenant_status_idx on lead (tenant_id, status) where deleted_at is null;
create index lead_phone_idx         on lead (tenant_id, phone);
create index lead_owner_idx         on lead (tenant_id, owner_id) where deleted_at is null;

create trigger lead_set_updated_at
  before update on lead for each row execute function set_updated_at();

alter table referral
  add constraint referral_lead_fk
  foreign key (referred_lead_id) references lead (id) on delete set null;

-- --------------------------------------------------------------- pipeline ---
create table pipeline (
  id         uuid primary key default uuid_generate_v7(),
  tenant_id  uuid not null references tenant (id) on delete cascade,
  code       text not null,
  name       text not null,
  -- Pipelines diferentes para verticais diferentes: odonto vende plano longo,
  -- HOF vende sessao e recorrencia.
  vertical   text not null default 'geral'
             check (vertical in ('geral', 'odontologia', 'estetica')),
  is_default boolean not null default false,
  is_active  boolean not null default true,

  constraint pipeline_code_uk unique (tenant_id, code)
);

create unique index pipeline_default_uk
  on pipeline (tenant_id) where is_default;

create table pipeline_stage (
  id           uuid primary key default uuid_generate_v7(),
  tenant_id    uuid not null references tenant (id) on delete cascade,
  pipeline_id  uuid not null references pipeline (id) on delete cascade,
  code         text not null,
  name         text not null,
  sort_order   int not null,
  -- Probabilidade usada na previsao de receita ponderada do funil.
  win_probability numeric(4, 3) not null default 0 check (win_probability between 0 and 1),
  -- Dias sem atividade a partir dos quais a oportunidade "esfria".
  cooling_days int not null default 7 check (cooling_days > 0),
  is_won       boolean not null default false,
  is_lost      boolean not null default false,

  constraint pipeline_stage_code_uk  unique (pipeline_id, code),
  constraint pipeline_stage_order_uk unique (pipeline_id, sort_order) deferrable initially deferred,
  constraint pipeline_stage_outcome  check (not (is_won and is_lost))
);

create table loss_reason (
  id         uuid primary key default uuid_generate_v7(),
  tenant_id  uuid not null references tenant (id) on delete cascade,
  code       text not null,
  name       text not null,
  -- Agrupador para o relatorio: preco, timing, concorrencia, fit, sem resposta.
  category   text not null default 'outro'
             check (category in ('preco', 'timing', 'concorrencia', 'fit', 'sem_resposta', 'outro')),
  is_active  boolean not null default true,

  constraint loss_reason_code_uk unique (tenant_id, code)
);

create type opportunity_status as enum ('open', 'won', 'lost');

create table opportunity (
  id             uuid primary key default uuid_generate_v7(),
  tenant_id      uuid not null references tenant (id) on delete cascade,
  unit_id        uuid references unit (id) on delete set null,
  pipeline_id    uuid not null references pipeline (id) on delete restrict,
  stage_id       uuid not null references pipeline_stage (id) on delete restrict,
  lead_id        uuid references lead (id) on delete set null,
  patient_id     uuid references patient (id) on delete set null,
  title          text not null,
  status         opportunity_status not null default 'open',
  amount_cents   bigint not null default 0 check (amount_cents >= 0),
  owner_id       uuid references membership (id) on delete set null,
  source_id      uuid references acquisition_source (id) on delete set null,
  loss_reason_id uuid references loss_reason (id) on delete set null,
  loss_notes     text,
  expected_close_on date,
  stage_changed_at  timestamptz not null default now(),
  last_activity_at  timestamptz,
  next_action_at    timestamptz,
  closed_at      timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  deleted_at     timestamptz,

  -- Oportunidade sem pessoa nao existe.
  constraint opportunity_has_subject check (lead_id is not null or patient_id is not null),
  constraint opportunity_lost_reason  check (status <> 'lost' or loss_reason_id is not null),
  constraint opportunity_closed_time  check ((status = 'open') = (closed_at is null))
);

create index opportunity_stage_idx    on opportunity (tenant_id, stage_id) where deleted_at is null;
create index opportunity_owner_idx    on opportunity (tenant_id, owner_id) where status = 'open';
create index opportunity_patient_idx  on opportunity (tenant_id, patient_id);
-- Alerta de oportunidade esfriando.
create index opportunity_cooling_idx
  on opportunity (tenant_id, last_activity_at)
  where status = 'open' and deleted_at is null;

create trigger opportunity_set_updated_at
  before update on opportunity for each row execute function set_updated_at();

create table opportunity_stage_history (
  id             uuid primary key default uuid_generate_v7(),
  tenant_id      uuid not null references tenant (id) on delete cascade,
  opportunity_id uuid not null references opportunity (id) on delete cascade,
  from_stage_id  uuid references pipeline_stage (id) on delete set null,
  to_stage_id    uuid not null references pipeline_stage (id) on delete restrict,
  changed_by     uuid references membership (id) on delete set null,
  changed_at     timestamptz not null default now(),
  -- Tempo parado na etapa anterior: materia-prima do relatorio de gargalo.
  seconds_in_previous_stage bigint
);

create index opportunity_stage_history_idx
  on opportunity_stage_history (tenant_id, opportunity_id, changed_at desc);

-- --------------------------------------------------- atividades e tarefas ---
create type activity_kind as enum
  ('note', 'call', 'whatsapp', 'email', 'meeting', 'visit', 'stage_change', 'system');

create table activity (
  id             uuid primary key default uuid_generate_v7(),
  tenant_id      uuid not null references tenant (id) on delete cascade,
  opportunity_id uuid references opportunity (id) on delete cascade,
  lead_id        uuid references lead (id) on delete cascade,
  patient_id     uuid references patient (id) on delete cascade,
  kind           activity_kind not null default 'note',
  subject        text,
  body           text not null,
  outcome        text,
  performed_by   uuid references membership (id) on delete set null,
  occurred_at    timestamptz not null default now(),
  created_at     timestamptz not null default now(),

  constraint activity_has_subject check (
    opportunity_id is not null or lead_id is not null or patient_id is not null
  )
);

create index activity_opportunity_idx on activity (tenant_id, opportunity_id, occurred_at desc);
create index activity_patient_idx     on activity (tenant_id, patient_id, occurred_at desc);

create type task_status as enum ('open', 'done', 'canceled');

create table task (
  id             uuid primary key default uuid_generate_v7(),
  tenant_id      uuid not null references tenant (id) on delete cascade,
  unit_id        uuid references unit (id) on delete set null,
  title          text not null,
  description    text,
  status         task_status not null default 'open',
  priority       text not null default 'normal' check (priority in ('low', 'normal', 'high')),
  due_at         timestamptz,
  assigned_to    uuid references membership (id) on delete set null,
  opportunity_id uuid references opportunity (id) on delete cascade,
  lead_id        uuid references lead (id) on delete cascade,
  patient_id     uuid references patient (id) on delete cascade,
  completed_at   timestamptz,
  completed_by   uuid references membership (id) on delete set null,
  created_by     uuid references membership (id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),

  constraint task_completed_consistent check ((status = 'done') = (completed_at is not null))
);

create index task_open_idx on task (tenant_id, assigned_to, due_at) where status = 'open';

create trigger task_set_updated_at
  before update on task for each row execute function set_updated_at();

-- --------------------------------------------------------------- campanha ---
create table campaign (
  id            uuid primary key default uuid_generate_v7(),
  tenant_id     uuid not null references tenant (id) on delete cascade,
  name          text not null,
  channel       text not null check (channel in ('whatsapp', 'email', 'sms', 'ads', 'offline')),
  starts_on     date,
  ends_on       date,
  budget_cents  bigint not null default 0 check (budget_cents >= 0),
  -- Custo real importado da plataforma de anuncio, para calcular CAC de verdade.
  spend_cents   bigint not null default 0 check (spend_cents >= 0),
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),

  constraint campaign_period check (ends_on is null or starts_on is null or ends_on >= starts_on)
);

alter table lead
  add constraint lead_campaign_fk
  foreign key (campaign_id) references campaign (id) on delete set null;

-- ------------------------------------------------------- WhatsApp oficial ---
-- Conta conectada a Cloud API. O token nunca fica aqui: guardamos a referencia
-- para o cofre de segredos.
create table whatsapp_account (
  id                uuid primary key default uuid_generate_v7(),
  tenant_id         uuid not null references tenant (id) on delete cascade,
  unit_id           uuid references unit (id) on delete set null,
  waba_id           text not null,
  phone_number_id   text not null,
  display_phone     text not null,
  verified_name     text,
  token_secret_ref  text not null,
  webhook_secret_ref text,
  quality_rating    text,
  is_active         boolean not null default true,
  connected_at      timestamptz not null default now(),

  constraint whatsapp_account_phone_uk unique (phone_number_id)
);

create type template_status as enum ('draft', 'pending', 'approved', 'rejected', 'paused', 'disabled');

-- Template versionado. A Meta aprova por nome+idioma; guardamos a versao para
-- saber qual texto foi realmente enviado meses depois.
create table message_template (
  id             uuid primary key default uuid_generate_v7(),
  tenant_id      uuid not null references tenant (id) on delete cascade,
  code           text not null,
  name           text not null,
  language       text not null default 'pt_BR',
  category       text not null check (category in ('marketing', 'utility', 'authentication')),
  version        int not null default 1 check (version > 0),
  status         template_status not null default 'draft',
  provider_name  text,                               -- nome aprovado na Meta
  body           text not null,
  -- Variaveis declaradas: {{1}} = nome, etc. Valida o envio antes de gastar.
  variables      jsonb not null default '[]'::jsonb,
  components     jsonb,
  rejection_reason text,
  approved_at    timestamptz,
  created_at     timestamptz not null default now(),

  constraint message_template_version_uk unique (tenant_id, code, version)
);

create type conversation_status as enum ('open', 'pending', 'snoozed', 'closed');

create table conversation (
  id              uuid primary key default uuid_generate_v7(),
  tenant_id       uuid not null references tenant (id) on delete cascade,
  unit_id         uuid references unit (id) on delete set null,
  account_id      uuid not null references whatsapp_account (id) on delete restrict,
  contact_phone   text not null,
  contact_name    text,
  patient_id      uuid references patient (id) on delete set null,
  lead_id         uuid references lead (id) on delete set null,
  status          conversation_status not null default 'open',
  assigned_to     uuid references membership (id) on delete set null,
  last_inbound_at timestamptz,
  last_outbound_at timestamptz,
  -- Janela de 24h da Cloud API: fora dela, so template aprovado.
  window_expires_at timestamptz,
  unread_count    int not null default 0 check (unread_count >= 0),
  snoozed_until   timestamptz,
  closed_at       timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  constraint conversation_contact_uk unique (account_id, contact_phone)
);

create index conversation_inbox_idx
  on conversation (tenant_id, status, last_inbound_at desc);
create index conversation_patient_idx on conversation (tenant_id, patient_id);

create trigger conversation_set_updated_at
  before update on conversation for each row execute function set_updated_at();

create type message_direction as enum ('inbound', 'outbound');
create type message_status as enum ('queued', 'sent', 'delivered', 'read', 'failed', 'deleted');

create table message (
  id               uuid primary key default uuid_generate_v7(),
  tenant_id        uuid not null references tenant (id) on delete cascade,
  conversation_id  uuid not null references conversation (id) on delete cascade,
  direction        message_direction not null,
  status           message_status not null default 'queued',
  content_type     text not null default 'text'
                   check (content_type in ('text', 'image', 'document', 'audio', 'video', 'template', 'interactive', 'location')),
  body             text,
  media_url        text,
  media_mime       text,
  template_id      uuid references message_template (id) on delete set null,
  template_variables jsonb,
  -- Id da Meta: unico, e a chave de idempotencia do webhook de status.
  provider_message_id text,
  reply_to_id      uuid references message (id) on delete set null,
  sent_by          uuid references membership (id) on delete set null,
  -- Preenchido quando a mensagem nasce de uma regra automatica.
  automation_rule_id uuid,
  error_code       text,
  error_message    text,
  -- Custo cobrado pela Meta por conversa; alimenta o custo de aquisicao.
  billed_cents     bigint not null default 0 check (billed_cents >= 0),
  created_at       timestamptz not null default now(),
  sent_at          timestamptz,
  delivered_at     timestamptz,
  read_at          timestamptz,

  constraint message_provider_uk unique nulls not distinct (tenant_id, provider_message_id),
  constraint message_outbound_author check (
    direction = 'inbound' or sent_by is not null or automation_rule_id is not null
  )
);

create index message_conversation_idx on message (tenant_id, conversation_id, created_at desc);
create index message_pending_idx on message (tenant_id, status) where status in ('queued', 'failed');

-- Mantem a janela de 24h e os contadores da conversa sem o app precisar lembrar.
create or replace function sync_conversation_on_message() returns trigger
language plpgsql
as $$
begin
  if new.direction = 'inbound' then
    update conversation
       set last_inbound_at   = new.created_at,
           window_expires_at = new.created_at + interval '24 hours',
           unread_count      = unread_count + 1,
           status            = case when status = 'closed' then 'open' else status end,
           updated_at        = now()
     where id = new.conversation_id;
  else
    update conversation
       set last_outbound_at = new.created_at,
           updated_at       = now()
     where id = new.conversation_id;
  end if;

  return new;
end;
$$;

create trigger message_sync_conversation
  after insert on message
  for each row execute function sync_conversation_on_message();
