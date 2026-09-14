-- =============================================================================
-- 0008 — Estetica / HOF: mapa facial, sessao, aplicacao de injetavel com lote,
-- protocolo e fotos antes/depois.
--
-- O centro deste dominio e injectable_application: cada ponto aplicado guarda
-- produto, LOTE, validade no ato, quantidade, regiao, plano e profissional.
-- E o que responde a pergunta que a vigilancia sanitaria faz quando um lote e
-- recolhido: "quem recebeu deste lote?" — hoje, em quase toda clinica, a
-- resposta esta num caderno.
-- =============================================================================

-- Regioes anatomicas. Referencia global com coordenada normalizada para o mapa
-- facial ser desenhado sem a UI carregar a anatomia no codigo.
create table body_region (
  code        text primary key,
  name_pt     text not null,
  area_group  text not null check (area_group in
                ('terco_superior', 'terco_medio', 'terco_inferior', 'pescoco', 'corpo')),
  is_facial   boolean not null default true,
  side        text check (side in ('left', 'right', 'center')),
  -- Coordenadas 0..1 sobre a face de referencia (frontal).
  map_x       numeric(5, 4) check (map_x between 0 and 1),
  map_y       numeric(5, 4) check (map_y between 0 and 1),
  -- Estruturas de risco na regiao: alimenta o alerta de seguranca na aplicacao.
  risk_notes  text,
  sort_order  int not null default 0
);

create index body_region_group_idx on body_region (area_group, sort_order);

-- Protocolo: receita de sessao que a clinica padroniza (ex.: "full face
-- basico"). Versionado para o protocolo antigo continuar auditavel.
create table aesthetic_protocol (
  id          uuid primary key default uuid_generate_v7(),
  tenant_id   uuid not null references tenant (id) on delete cascade,
  code        text not null,
  name        text not null,
  version     int not null default 1 check (version > 0),
  description text,
  -- Intervalo recomendado ate a proxima sessao; alimenta o alerta de retorno.
  recommended_interval_days int check (recommended_interval_days > 0),
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),

  constraint aesthetic_protocol_version_uk unique (tenant_id, code, version)
);

create table aesthetic_protocol_step (
  id           uuid primary key default uuid_generate_v7(),
  tenant_id    uuid not null references tenant (id) on delete cascade,
  protocol_id  uuid not null references aesthetic_protocol (id) on delete cascade,
  sort_order   int not null,
  region_code  text references body_region (code) on delete restrict,
  product_id   uuid,                                  -- FK adicionada em 0012
  procedure_id uuid,                                  -- FK adicionada em 0009
  suggested_quantity numeric(10, 3) check (suggested_quantity > 0),
  quantity_unit text check (quantity_unit in ('U', 'ml', 'fio', 'sessao', 'cm2')),
  technique    text,
  notes        text,

  constraint aesthetic_protocol_step_order_uk unique (protocol_id, sort_order)
);

-- ------------------------------------------------------------------ sessao --
create type aesthetic_session_status as enum
  ('planned', 'in_progress', 'completed', 'canceled');

create table aesthetic_session (
  id              uuid primary key default uuid_generate_v7(),
  tenant_id       uuid not null references tenant (id) on delete restrict,
  unit_id         uuid references unit (id) on delete set null,
  patient_id      uuid not null references patient (id) on delete restrict,
  provider_id     uuid not null references membership (id) on delete restrict,
  appointment_id  uuid references appointment (id) on delete set null,
  protocol_id     uuid references aesthetic_protocol (id) on delete set null,
  treatment_plan_id uuid references treatment_plan (id) on delete set null,
  session_number  int not null default 1 check (session_number > 0),
  status          aesthetic_session_status not null default 'planned',
  -- Anestesia/pre-procedimento e intercorrencia sao dado clinico relevante.
  anesthesia      text,
  adverse_event   text,
  performed_at    timestamptz,
  next_session_suggested_on date,
  -- Retorno de avaliacao (retoque de toxina em 15-30 dias).
  followup_due_on date,
  followup_done_at timestamptz,
  satisfaction_score int check (satisfaction_score between 0 and 10),
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  constraint aesthetic_session_completed check (
    (status = 'completed') = (performed_at is not null)
  )
);

create index aesthetic_session_patient_idx
  on aesthetic_session (tenant_id, patient_id, performed_at desc);
create index aesthetic_session_followup_idx
  on aesthetic_session (tenant_id, followup_due_on)
  where followup_due_on is not null and followup_done_at is null;

create trigger aesthetic_session_set_updated_at
  before update on aesthetic_session for each row execute function set_updated_at();

alter table clinical_file
  add constraint clinical_file_session_fk
  foreign key (aesthetic_session_id) references aesthetic_session (id) on delete set null;

-- ------------------------------------------------------------- aplicacao ----
create type injectable_unit as enum ('U', 'ml', 'fio', 'sessao', 'cm2');

create table injectable_application (
  id             uuid primary key default uuid_generate_v7(),
  tenant_id      uuid not null references tenant (id) on delete restrict,
  session_id     uuid not null references aesthetic_session (id) on delete restrict,
  patient_id     uuid not null references patient (id) on delete restrict,
  provider_id    uuid not null references membership (id) on delete restrict,
  region_code    text not null references body_region (code) on delete restrict,
  product_id     uuid,                                 -- FK adicionada em 0012
  -- Rastreabilidade sanitaria: lote e o elo que permite recall reverso.
  product_lot_id uuid,                                 -- FK adicionada em 0012
  lot_number     text,
  lot_expires_on date,
  quantity       numeric(10, 3) not null check (quantity > 0),
  quantity_unit  injectable_unit not null,
  -- Pontos exatos sobre o mapa: [{"x":0.42,"y":0.31,"qty":2}]
  points         jsonb not null default '[]'::jsonb,
  technique      text,
  depth          text check (depth in ('intradermica', 'subdermica', 'supraperiosteal', 'intramuscular', 'subcutanea')),
  needle_gauge   text,
  dilution       text,
  -- Custo e preco congelados no ato, para a margem do atendimento nao mudar
  -- quando o insumo subir de preco depois.
  unit_cost_cents  bigint not null default 0 check (unit_cost_cents >= 0),
  unit_price_cents bigint not null default 0 check (unit_price_cents >= 0),
  stock_movement_id uuid,                              -- FK adicionada em 0012
  applied_at     timestamptz not null default now(),
  notes          text,
  created_at     timestamptz not null default now(),

  -- Se ha lote informado, a validade no ato tambem precisa estar registrada.
  constraint injectable_application_lot_expiry check (
    lot_number is null or lot_expires_on is not null
  )
);

create index injectable_application_session_idx
  on injectable_application (tenant_id, session_id);
create index injectable_application_patient_idx
  on injectable_application (tenant_id, patient_id, applied_at desc);
-- Recall reverso: dado um lote, quem recebeu.
create index injectable_application_lot_idx
  on injectable_application (tenant_id, product_lot_id, applied_at desc);
create index injectable_application_region_idx
  on injectable_application (tenant_id, region_code);

comment on index injectable_application_lot_idx is
  'Suporta a consulta de recall: todos os pacientes que receberam um lote.';

-- --------------------------------------------------------- antes / depois ---
-- Conjunto de fotos de uma sessao, com pose padronizada. Versionado por sessao
-- para a comparacao ser entre estados reais, nao entre fotos soltas.
create table photo_set (
  id          uuid primary key default uuid_generate_v7(),
  tenant_id   uuid not null references tenant (id) on delete restrict,
  patient_id  uuid not null references patient (id) on delete restrict,
  session_id  uuid references aesthetic_session (id) on delete set null,
  moment      text not null check (moment in ('before', 'after', 'followup')),
  days_after  int check (days_after >= 0),
  captured_at timestamptz not null default now(),
  captured_by uuid references membership (id) on delete set null,
  notes       text,
  created_at  timestamptz not null default now()
);

create index photo_set_patient_idx on photo_set (tenant_id, patient_id, captured_at desc);

create table photo_set_file (
  photo_set_id     uuid not null references photo_set (id) on delete cascade,
  clinical_file_id uuid not null references clinical_file (id) on delete cascade,
  pose             text check (pose in ('frontal', 'perfil_direito', 'perfil_esquerdo', 'obliquo_direito', 'obliquo_esquerdo', 'superior', 'detalhe')),
  sort_order       int not null default 0,
  primary key (photo_set_id, clinical_file_id)
);
