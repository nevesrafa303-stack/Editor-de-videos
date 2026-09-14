-- =============================================================================
-- 0007 — Odontologia: odontograma, plano de tratamento por etapa e ortodontia.
--
-- O odontograma NAO e um JSON no paciente. E um log de eventos por dente/face:
-- cada condicao registrada tem autor, data e origem. So assim da para responder
-- "o 26 estava cariado antes de eu assumir o caso?" — que e exatamente a
-- pergunta que aparece em processo.
-- =============================================================================

-- Dentes em notacao FDI (ISO 3950). Tabela de referencia global, nao por tenant.
create table tooth (
  code        char(2) primary key,
  quadrant    int not null check (quadrant between 1 and 8),
  position    int not null check (position between 1 and 8),
  dentition   text not null check (dentition in ('permanent', 'deciduous')),
  name_pt     text not null,
  arch        text not null check (arch in ('upper', 'lower')),
  side        text not null check (side in ('right', 'left'))
);

comment on table tooth is 'Referencia FDI: 11-48 permanentes, 51-85 deciduos.';

-- Faces dentarias validas. Usadas em array com check via funcao.
create type tooth_surface as enum ('O', 'I', 'M', 'D', 'V', 'L', 'P', 'C');

comment on type tooth_surface is
  'O=oclusal I=incisal M=mesial D=distal V=vestibular L=lingual P=palatina C=cervical';

create type tooth_condition as enum (
  'healthy', 'caries', 'restoration', 'missing', 'implant', 'prosthesis',
  'root_canal', 'extraction_indicated', 'fractured', 'sealant', 'crown',
  'bridge_pontic', 'impacted', 'mobility', 'periapical_lesion'
);

create type odontogram_entry_status as enum ('existing', 'planned', 'executed', 'canceled');

create table odontogram_entry (
  id            uuid primary key default uuid_generate_v7(),
  tenant_id     uuid not null references tenant (id) on delete restrict,
  patient_id    uuid not null references patient (id) on delete restrict,
  tooth_code    char(2) not null references tooth (code) on delete restrict,
  surfaces      tooth_surface[] not null default '{}',
  condition     tooth_condition not null,
  status        odontogram_entry_status not null default 'existing',
  -- De onde veio: exame inicial, plano aprovado, execucao.
  source        text not null default 'exam'
                check (source in ('exam', 'plan', 'execution', 'import')),
  treatment_plan_item_id uuid,                       -- FK adicionada abaixo
  appointment_id uuid references appointment (id) on delete set null,
  provider_id   uuid references membership (id) on delete set null,
  notes         text,
  recorded_at   timestamptz not null default now(),
  superseded_at timestamptz,
  superseded_by uuid references odontogram_entry (id) on delete set null,

  constraint odontogram_entry_supersede check (
    (superseded_at is null) = (superseded_by is null)
  )
);

-- Estado atual = entradas nao superadas. Indice parcial deixa a leitura barata.
create index odontogram_current_idx
  on odontogram_entry (tenant_id, patient_id, tooth_code)
  where superseded_at is null;
create index odontogram_history_idx
  on odontogram_entry (tenant_id, patient_id, recorded_at desc);

-- ------------------------------------------------- plano de tratamento ------
create type treatment_plan_status as enum
  ('draft', 'active', 'suspended', 'completed', 'canceled');

create table treatment_plan (
  id           uuid primary key default uuid_generate_v7(),
  tenant_id    uuid not null references tenant (id) on delete restrict,
  unit_id      uuid references unit (id) on delete set null,
  patient_id   uuid not null references patient (id) on delete restrict,
  provider_id  uuid references membership (id) on delete set null,
  quote_id     uuid,                                  -- FK adicionada em 0010
  code         bigint,
  title        text not null,
  status       treatment_plan_status not null default 'draft',
  diagnosis    text,
  notes        text,
  started_at   timestamptz,
  completed_at timestamptz,
  canceled_at  timestamptz,
  cancel_reason text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  deleted_at   timestamptz,

  constraint treatment_plan_code_uk unique nulls not distinct (tenant_id, code)
);

create index treatment_plan_patient_idx on treatment_plan (tenant_id, patient_id)
  where deleted_at is null;
create index treatment_plan_active_idx on treatment_plan (tenant_id, status)
  where status = 'active' and deleted_at is null;

create trigger treatment_plan_set_updated_at
  before update on treatment_plan for each row execute function set_updated_at();

-- Etapa: o que precisa acontecer antes do que. Ex.: periodontia antes de
-- protese; enxerto antes de implante.
create table treatment_plan_phase (
  id              uuid primary key default uuid_generate_v7(),
  tenant_id       uuid not null references tenant (id) on delete cascade,
  treatment_plan_id uuid not null references treatment_plan (id) on delete cascade,
  sort_order      int not null,
  name            text not null,
  description     text,
  -- Espera clinica minima apos a etapa anterior (osseointegracao, cicatrizacao).
  min_days_after_previous int not null default 0 check (min_days_after_previous >= 0),
  status          text not null default 'pending'
                  check (status in ('pending', 'in_progress', 'completed', 'skipped')),
  started_at      timestamptz,
  completed_at    timestamptz,

  constraint treatment_plan_phase_order_uk
    unique (treatment_plan_id, sort_order) deferrable initially deferred
);

create type plan_item_status as enum ('planned', 'scheduled', 'executed', 'canceled');

create table treatment_plan_item (
  id              uuid primary key default uuid_generate_v7(),
  tenant_id       uuid not null references tenant (id) on delete cascade,
  treatment_plan_id uuid not null references treatment_plan (id) on delete cascade,
  phase_id        uuid references treatment_plan_phase (id) on delete set null,
  procedure_id    uuid,                               -- FK adicionada em 0009
  quote_item_id   uuid,                               -- FK adicionada em 0010
  description     text not null,
  tooth_code      char(2) references tooth (code) on delete restrict,
  surfaces        tooth_surface[] not null default '{}',
  -- Regiao anatomica para procedimento nao dentario (HOF, periodontia por sextante).
  region_code     text,
  quantity        numeric(10, 2) not null default 1 check (quantity > 0),
  status          plan_item_status not null default 'planned',
  -- Preco congelado do orcamento de origem: mudar a tabela de precos depois
  -- nao pode mexer no que foi combinado.
  unit_price_cents bigint not null default 0 check (unit_price_cents >= 0),
  executed_at     timestamptz,
  executed_by     uuid references membership (id) on delete set null,
  appointment_id  uuid references appointment (id) on delete set null,
  sort_order      int not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  constraint treatment_plan_item_executed check (
    (status = 'executed') = (executed_at is not null)
  )
);

create index treatment_plan_item_plan_idx on treatment_plan_item (tenant_id, treatment_plan_id);
create index treatment_plan_item_pending_idx
  on treatment_plan_item (tenant_id, status) where status in ('planned', 'scheduled');
create index treatment_plan_item_tooth_idx
  on treatment_plan_item (tenant_id, tooth_code) where tooth_code is not null;

create trigger treatment_plan_item_set_updated_at
  before update on treatment_plan_item for each row execute function set_updated_at();

alter table odontogram_entry
  add constraint odontogram_entry_plan_item_fk
  foreign key (treatment_plan_item_id) references treatment_plan_item (id) on delete set null;

alter table appointment
  add constraint appointment_plan_item_fk
  foreign key (treatment_plan_item_id) references treatment_plan_item (id) on delete set null;

-- ------------------------------------------------------------- ortodontia ---
create type orthodontic_status as enum
  ('planning', 'active', 'retention', 'completed', 'abandoned', 'transferred');

create table orthodontic_case (
  id              uuid primary key default uuid_generate_v7(),
  tenant_id       uuid not null references tenant (id) on delete restrict,
  unit_id         uuid references unit (id) on delete set null,
  patient_id      uuid not null references patient (id) on delete restrict,
  provider_id     uuid references membership (id) on delete set null,
  treatment_plan_id uuid references treatment_plan (id) on delete set null,
  technique       text not null,
  appliance_type  text,
  malocclusion_class text,
  status          orthodontic_status not null default 'planning',
  installed_on    date,
  expected_months int check (expected_months is null or expected_months > 0),
  expected_end_on date,
  removed_on      date,
  -- Mensalidade da manutencao: a receita recorrente da ortodontia.
  monthly_fee_cents bigint not null default 0 check (monthly_fee_cents >= 0),
  -- Dia de vencimento e intervalo entre manutencoes.
  maintenance_interval_days int not null default 30 check (maintenance_interval_days between 7 and 120),
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  deleted_at      timestamptz,

  constraint orthodontic_case_dates check (removed_on is null or installed_on is null or removed_on >= installed_on)
);

create index orthodontic_case_patient_idx on orthodontic_case (tenant_id, patient_id);
create index orthodontic_case_active_idx
  on orthodontic_case (tenant_id, status) where status in ('active', 'retention');

create trigger orthodontic_case_set_updated_at
  before update on orthodontic_case for each row execute function set_updated_at();

alter table appointment
  add constraint appointment_orthodontic_case_fk
  foreign key (orthodontic_case_id) references orthodontic_case (id) on delete set null;

create type maintenance_status as enum ('scheduled', 'done', 'missed', 'canceled');

-- Manutencao recorrente. Gerada por job a partir do intervalo do caso; cada
-- linha vira agendamento e, se a clinica cobra por manutencao, recebivel.
create table orthodontic_maintenance (
  id             uuid primary key default uuid_generate_v7(),
  tenant_id      uuid not null references tenant (id) on delete cascade,
  case_id        uuid not null references orthodontic_case (id) on delete cascade,
  sequence       int not null check (sequence > 0),
  due_on         date not null,
  status         maintenance_status not null default 'scheduled',
  appointment_id uuid references appointment (id) on delete set null,
  installment_id uuid,                                -- FK adicionada em 0011
  performed_at   timestamptz,
  performed_by   uuid references membership (id) on delete set null,
  wire_used      text,
  notes          text,
  created_at     timestamptz not null default now(),

  constraint orthodontic_maintenance_seq_uk unique (case_id, sequence),
  constraint orthodontic_maintenance_done check ((status = 'done') = (performed_at is not null))
);

create index orthodontic_maintenance_due_idx
  on orthodontic_maintenance (tenant_id, due_on) where status = 'scheduled';
