-- =============================================================================
-- 0005 — Agenda: recurso, disponibilidade, bloqueio, agendamento, confirmacao
-- e lista de espera.
--
-- Conflito de horario NAO e validado no app. E uma exclusion constraint: o
-- banco recusa duas ocupacoes sobrepostas do mesmo profissional ou da mesma
-- cadeira, mesmo sob concorrencia (duas recepcionistas clicando junto).
-- =============================================================================

create type resource_kind as enum ('chair', 'room', 'equipment');

create table resource (
  id         uuid primary key default uuid_generate_v7(),
  tenant_id  uuid not null references tenant (id) on delete cascade,
  unit_id    uuid not null references unit (id) on delete cascade,
  kind       resource_kind not null default 'chair',
  code       text not null,
  name       text not null,
  -- Equipamento com manutencao preventiva (laser, autoclave) para o alerta.
  next_maintenance_on date,
  is_active  boolean not null default true,
  created_at timestamptz not null default now(),

  constraint resource_code_uk unique (unit_id, code)
);

create index resource_unit_idx on resource (tenant_id, unit_id) where is_active;

-- Agenda-base do profissional: recorrencia semanal com vigencia.
create table provider_availability (
  id            uuid primary key default uuid_generate_v7(),
  tenant_id     uuid not null references tenant (id) on delete cascade,
  unit_id       uuid not null references unit (id) on delete cascade,
  membership_id uuid not null references membership (id) on delete cascade,
  weekday       int not null check (weekday between 0 and 6),   -- 0 = domingo
  starts_at     time not null,
  ends_at       time not null,
  slot_minutes  int not null default 30 check (slot_minutes between 5 and 240),
  valid_from    date not null default current_date,
  valid_to      date,
  created_at    timestamptz not null default now(),

  constraint provider_availability_window check (ends_at > starts_at),
  constraint provider_availability_validity check (valid_to is null or valid_to >= valid_from)
);

create index provider_availability_lookup_idx
  on provider_availability (tenant_id, membership_id, weekday);

create type block_reason as enum
  ('lunch', 'vacation', 'holiday', 'training', 'maintenance', 'personal', 'other');

create table schedule_block (
  id            uuid primary key default uuid_generate_v7(),
  tenant_id     uuid not null references tenant (id) on delete cascade,
  unit_id       uuid not null references unit (id) on delete cascade,
  membership_id uuid references membership (id) on delete cascade,
  resource_id   uuid references resource (id) on delete cascade,
  reason        block_reason not null default 'other',
  notes         text,
  starts_at     timestamptz not null,
  ends_at       timestamptz not null,
  period        tstzrange generated always as (tstzrange(starts_at, ends_at, '[)')) stored,
  created_by    uuid references membership (id) on delete set null,
  created_at    timestamptz not null default now(),

  constraint schedule_block_window check (ends_at > starts_at),
  constraint schedule_block_target check (membership_id is not null or resource_id is not null)
);

create index schedule_block_period_idx on schedule_block using gist (period);
create index schedule_block_unit_idx   on schedule_block (tenant_id, unit_id, starts_at);

-- ---------------------------------------------------------- agendamento -----
create type appointment_status as enum (
  'scheduled',    -- criado
  'confirmed',    -- paciente confirmou
  'arrived',      -- check-in na recepcao
  'in_progress',  -- em atendimento
  'completed',    -- atendido
  'no_show',      -- faltou
  'canceled'      -- cancelado (pela clinica ou pelo paciente)
);

create type appointment_origin as enum
  ('reception', 'phone', 'whatsapp', 'online_booking', 'recurrence', 'waitlist', 'import');

create table appointment (
  id              uuid primary key default uuid_generate_v7(),
  tenant_id       uuid not null references tenant (id) on delete restrict,
  unit_id         uuid not null references unit (id) on delete restrict,
  patient_id      uuid not null references patient (id) on delete restrict,
  provider_id     uuid not null references membership (id) on delete restrict,
  procedure_id    uuid,                                  -- FK adicionada em 0009
  treatment_plan_item_id uuid,                           -- FK adicionada em 0007
  orthodontic_case_id    uuid,                           -- FK adicionada em 0007
  status          appointment_status not null default 'scheduled',
  origin          appointment_origin not null default 'reception',
  starts_at       timestamptz not null,
  ends_at         timestamptz not null,
  period          tstzrange generated always as (tstzrange(starts_at, ends_at, '[)')) stored,
  notes           text,
  -- Preenchidos pelas transicoes; alimentam o relatorio de pontualidade.
  confirmed_at    timestamptz,
  arrived_at      timestamptz,
  started_at      timestamptz,
  completed_at    timestamptz,
  canceled_at     timestamptz,
  cancel_reason   text,
  canceled_by     text check (canceled_by in ('patient', 'clinic', 'system')),
  no_show_at      timestamptz,
  -- Risco calculado por job; usado para priorizar confirmacao ativa.
  no_show_risk    numeric(4, 3) check (no_show_risk between 0 and 1),
  created_by      uuid references membership (id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  deleted_at      timestamptz,

  constraint appointment_window check (ends_at > starts_at),
  constraint appointment_cancel_reason check (status <> 'canceled' or cancel_reason is not null),

  -- Um profissional nao pode estar em dois atendimentos ao mesmo tempo.
  -- Cancelado e falta liberam a janela.
  constraint appointment_provider_overlap exclude using gist (
    provider_id with =,
    period with &&
  ) where (status not in ('canceled', 'no_show') and deleted_at is null)
);

create index appointment_agenda_idx on appointment (tenant_id, unit_id, starts_at)
  where deleted_at is null;
create index appointment_provider_day_idx on appointment (tenant_id, provider_id, starts_at)
  where deleted_at is null;
create index appointment_patient_idx on appointment (tenant_id, patient_id, starts_at desc);
create index appointment_period_gist_idx on appointment using gist (period);
-- Fila de confirmacao: quem ainda nao confirmou e se aproxima.
create index appointment_to_confirm_idx on appointment (tenant_id, starts_at)
  where status = 'scheduled' and deleted_at is null;

create trigger appointment_set_updated_at
  before update on appointment for each row execute function set_updated_at();

-- Ocupacao de cadeira/sala/equipamento. Tabela propria porque um atendimento
-- pode ocupar dois recursos (cadeira + laser) e cada um tem seu conflito.
create table resource_booking (
  id             uuid primary key default uuid_generate_v7(),
  tenant_id      uuid not null references tenant (id) on delete cascade,
  resource_id    uuid not null references resource (id) on delete restrict,
  appointment_id uuid references appointment (id) on delete cascade,
  block_id       uuid references schedule_block (id) on delete cascade,
  starts_at      timestamptz not null,
  ends_at        timestamptz not null,
  period         tstzrange generated always as (tstzrange(starts_at, ends_at, '[)')) stored,
  is_active      boolean not null default true,

  constraint resource_booking_window check (ends_at > starts_at),
  constraint resource_booking_source check (
    (appointment_id is not null) <> (block_id is not null)
  ),
  constraint resource_booking_overlap exclude using gist (
    resource_id with =,
    period with &&
  ) where (is_active)
);

create index resource_booking_resource_idx on resource_booking (tenant_id, resource_id, starts_at);

-- Historico de status: base do relatorio de falta, cancelamento e pontualidade.
create table appointment_status_history (
  id             uuid primary key default uuid_generate_v7(),
  tenant_id      uuid not null references tenant (id) on delete cascade,
  appointment_id uuid not null references appointment (id) on delete cascade,
  from_status    appointment_status,
  to_status      appointment_status not null,
  reason         text,
  changed_by     uuid references membership (id) on delete set null,
  changed_at     timestamptz not null default now()
);

create index appointment_status_history_idx
  on appointment_status_history (tenant_id, appointment_id, changed_at desc);

-- Confirmacao automatica: uma linha por tentativa, para nao mandar duas vezes
-- e para medir qual antecedencia converte melhor.
create type confirmation_channel as enum ('whatsapp', 'sms', 'email', 'phone', 'app');
create type confirmation_outcome as enum ('pending', 'confirmed', 'declined', 'no_answer', 'failed');

create table appointment_confirmation (
  id             uuid primary key default uuid_generate_v7(),
  tenant_id      uuid not null references tenant (id) on delete cascade,
  appointment_id uuid not null references appointment (id) on delete cascade,
  channel        confirmation_channel not null,
  -- Quantas horas antes esta tentativa foi disparada.
  hours_before   int not null check (hours_before >= 0),
  outcome        confirmation_outcome not null default 'pending',
  message_id     uuid references message (id) on delete set null,
  sent_at        timestamptz,
  responded_at   timestamptz,
  created_at     timestamptz not null default now(),

  constraint appointment_confirmation_attempt_uk
    unique (appointment_id, channel, hours_before)
);

create index appointment_confirmation_pending_idx
  on appointment_confirmation (tenant_id, outcome) where outcome = 'pending';

-- ------------------------------------------------------- lista de espera ----
create type waitlist_status as enum ('waiting', 'offered', 'scheduled', 'expired', 'canceled');

create table waitlist_entry (
  id            uuid primary key default uuid_generate_v7(),
  tenant_id     uuid not null references tenant (id) on delete cascade,
  unit_id       uuid not null references unit (id) on delete cascade,
  patient_id    uuid not null references patient (id) on delete cascade,
  procedure_id  uuid,                                   -- FK adicionada em 0009
  provider_id   uuid references membership (id) on delete set null,
  status        waitlist_status not null default 'waiting',
  priority      int not null default 0,
  -- Janelas aceitas pelo paciente: [{"weekday":1,"from":"08:00","to":"12:00"}]
  preferences   jsonb not null default '[]'::jsonb,
  earliest_on   date,
  latest_on     date,
  offered_appointment_id uuid references appointment (id) on delete set null,
  offered_at    timestamptz,
  scheduled_at  timestamptz,
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  constraint waitlist_period check (latest_on is null or earliest_on is null or latest_on >= earliest_on)
);

create index waitlist_active_idx
  on waitlist_entry (tenant_id, unit_id, priority desc, created_at)
  where status = 'waiting';

create trigger waitlist_set_updated_at
  before update on waitlist_entry for each row execute function set_updated_at();
