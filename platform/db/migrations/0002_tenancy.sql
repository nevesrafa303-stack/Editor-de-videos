-- =============================================================================
-- 0002 — Tenancy e acesso: rede, unidade, identidade, papel, permissao, plano.
--
-- Hierarquia: tenant (rede) -> unit (unidade) -> membership (usuario na rede,
-- com acesso a N unidades).
--
-- app_user e identidade GLOBAL, sem tenant_id: o mesmo dentista atende em duas
-- clinicas de donos diferentes e deve ter um login so. O vinculo (e o papel)
-- mora em membership.
-- =============================================================================

-- ---------------------------------------------------------------- planos ----
create table subscription_plan (
  id             uuid primary key default uuid_generate_v7(),
  code           text not null unique,
  name           text not null,
  price_cents    bigint not null default 0 check (price_cents >= 0),
  billing_period text not null default 'monthly'
                 check (billing_period in ('monthly', 'yearly')),
  max_units      int check (max_units is null or max_units > 0),
  max_users      int check (max_users is null or max_users > 0),
  is_active      boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create table plan_feature (
  plan_id    uuid not null references subscription_plan (id) on delete cascade,
  feature_key text not null,
  enabled     boolean not null default true,
  limit_value int,
  primary key (plan_id, feature_key)
);

comment on table plan_feature is
  'Feature flag por plano. O app le a uniao disto com tenant_feature_override.';

-- ---------------------------------------------------------------- tenant ----
create type tenant_status as enum ('trial', 'active', 'past_due', 'suspended', 'canceled');

create table tenant (
  id             uuid primary key default uuid_generate_v7(),
  slug           citext not null unique,
  legal_name     text not null,
  trade_name     text not null,
  tax_id         text,                               -- CNPJ, apenas digitos
  status         tenant_status not null default 'trial',
  plan_id        uuid references subscription_plan (id) on delete restrict,
  trial_ends_at  timestamptz,
  timezone       text not null default 'America/Sao_Paulo',
  locale         text not null default 'pt-BR',
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  deleted_at     timestamptz,

  constraint tenant_tax_id_digits check (tax_id is null or tax_id ~ '^[0-9]{14}$')
);

create trigger tenant_set_updated_at
  before update on tenant for each row execute function set_updated_at();

-- Override de feature por tenant (venda de modulo avulso, piloto, cortesia).
create table tenant_feature_override (
  tenant_id   uuid not null references tenant (id) on delete cascade,
  feature_key text not null,
  enabled     boolean not null,
  limit_value int,
  expires_at  timestamptz,
  note        text,
  primary key (tenant_id, feature_key)
);

-- Politicas de comportamento decididas pela rede, nao pelo codigo.
create table tenant_policy (
  tenant_id                       uuid primary key references tenant (id) on delete cascade,
  -- Se true, profissional so enxerga prontuario de paciente que ele atendeu.
  restrict_chart_to_own_patients  boolean not null default false,
  -- Exige consentimento de imagem vigente para anexar foto clinica.
  require_image_consent_for_photo boolean not null default true,
  -- Exige lote valido para registrar aplicacao de injetavel.
  require_lot_for_injectable      boolean not null default true,
  -- Bloqueia execucao de procedimento sem estoque suficiente.
  block_execution_without_stock   boolean not null default false,
  no_show_risk_threshold          numeric(4, 3) not null default 0.35
                                  check (no_show_risk_threshold between 0 and 1),
  inactive_patient_months         int not null default 6 check (inactive_patient_months > 0),
  quote_cooling_days              int not null default 7 check (quote_cooling_days > 0),
  updated_at                      timestamptz not null default now()
);

-- ---------------------------------------------------------------- unidade ---
create table unit (
  id            uuid primary key default uuid_generate_v7(),
  tenant_id     uuid not null references tenant (id) on delete restrict,
  code          text not null,
  name          text not null,
  tax_id        text,
  phone         text,
  email         citext,
  zip_code      text,
  street        text,
  number        text,
  complement    text,
  district      text,
  city          text,
  state_code    char(2),
  timezone      text not null default 'America/Sao_Paulo',
  -- Registro sanitario da unidade (alvara / CNES), exigido em fiscalizacao.
  health_license text,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz,

  constraint unit_code_uk unique (tenant_id, code)
);

create index unit_tenant_idx on unit (tenant_id) where deleted_at is null;

create trigger unit_set_updated_at
  before update on unit for each row execute function set_updated_at();

-- ------------------------------------------------------------- identidade ---
create table app_user (
  id                  uuid primary key default uuid_generate_v7(),
  email               citext not null unique,
  full_name           text not null,
  password_hash       text,
  phone               text,
  avatar_url          text,
  -- MFA e obrigatorio para quem ve prontuario; guardamos o segredo cifrado.
  mfa_secret          text,
  mfa_enabled_at      timestamptz,
  email_verified_at   timestamptz,
  last_login_at       timestamptz,
  failed_login_count  int not null default 0,
  locked_until        timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  deleted_at          timestamptz
);

create trigger app_user_set_updated_at
  before update on app_user for each row execute function set_updated_at();

-- ----------------------------------------------------------------- papeis ---
-- Catalogo global de permissoes. Uma linha por par recurso.acao.
create table permission (
  key         text primary key,
  resource    text not null,
  action      text not null,
  description text not null,
  is_phi      boolean not null default false,

  constraint permission_key_format check (key = resource || '.' || action)
);

comment on column permission.is_phi is
  'Permissao que da acesso a dado de saude: exige MFA e gera phi_access_log.';

create table role (
  id          uuid primary key default uuid_generate_v7(),
  tenant_id   uuid not null references tenant (id) on delete cascade,
  code        text not null,
  name        text not null,
  description text,
  -- Papel de sistema nao pode ser apagado; suas permissoes podem ser ajustadas
  -- pelo dono da rede, e a customizacao fica registrada em audit_log.
  is_system   boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  constraint role_code_uk unique (tenant_id, code)
);

create table role_permission (
  role_id        uuid not null references role (id) on delete cascade,
  permission_key text not null references permission (key) on delete cascade,
  primary key (role_id, permission_key)
);

-- ------------------------------------------------------------- vinculos -----
create type membership_status as enum ('invited', 'active', 'suspended', 'removed');

create table membership (
  id             uuid primary key default uuid_generate_v7(),
  tenant_id      uuid not null references tenant (id) on delete restrict,
  user_id        uuid not null references app_user (id) on delete restrict,
  role_id        uuid not null references role (id) on delete restrict,
  status         membership_status not null default 'active',
  -- Dados profissionais: so preenchidos para quem atende.
  is_provider    boolean not null default false,
  council_type   text check (council_type in ('CRO', 'CRM', 'CRBM', 'COREN', 'CRF', 'OUTRO')),
  council_number text,
  council_state  char(2),
  specialty      text,
  agenda_color   text not null default '#0f766e'
                 check (agenda_color ~ '^#[0-9a-fA-F]{6}$'),
  started_at     date not null default current_date,
  ended_at       date,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  deleted_at     timestamptz,

  constraint membership_user_uk unique (tenant_id, user_id),
  constraint membership_provider_council check (
    not is_provider or (council_type is not null and council_number is not null)
  ),
  constraint membership_period check (ended_at is null or ended_at >= started_at)
);

create index membership_tenant_idx   on membership (tenant_id) where deleted_at is null;
create index membership_user_idx     on membership (user_id)   where deleted_at is null;
create index membership_provider_idx on membership (tenant_id, is_provider) where deleted_at is null;

create trigger membership_set_updated_at
  before update on membership for each row execute function set_updated_at();

-- A quais unidades o vinculo da acesso.
create table membership_unit (
  membership_id uuid not null references membership (id) on delete cascade,
  unit_id       uuid not null references unit (id) on delete cascade,
  is_primary    boolean not null default false,
  primary key (membership_id, unit_id)
);

create unique index membership_unit_primary_uk
  on membership_unit (membership_id)
  where is_primary;

-- Convite pendente. O token e guardado como hash: vazamento de banco nao vira
-- acesso.
create table invitation (
  id            uuid primary key default uuid_generate_v7(),
  tenant_id     uuid not null references tenant (id) on delete cascade,
  email         citext not null,
  role_id       uuid not null references role (id) on delete restrict,
  invited_by    uuid references app_user (id) on delete set null,
  token_hash    text not null unique,
  expires_at    timestamptz not null,
  accepted_at   timestamptz,
  revoked_at    timestamptz,
  created_at    timestamptz not null default now(),

  constraint invitation_not_both check (accepted_at is null or revoked_at is null)
);

create index invitation_pending_idx
  on invitation (tenant_id, email)
  where accepted_at is null and revoked_at is null;

create table invitation_unit (
  invitation_id uuid not null references invitation (id) on delete cascade,
  unit_id       uuid not null references unit (id) on delete cascade,
  primary key (invitation_id, unit_id)
);

-- Sessao ativa. Guardada no banco para permitir revogacao imediata (demissao,
-- suspeita de vazamento) — algo que JWT puro nao entrega.
create table user_session (
  id                uuid primary key default uuid_generate_v7(),
  user_id           uuid not null references app_user (id) on delete cascade,
  tenant_id         uuid references tenant (id) on delete cascade,
  active_unit_id    uuid references unit (id) on delete set null,
  token_hash        text not null unique,
  ip_address        inet,
  user_agent        text,
  mfa_satisfied_at  timestamptz,
  created_at        timestamptz not null default now(),
  last_seen_at      timestamptz not null default now(),
  expires_at        timestamptz not null,
  revoked_at        timestamptz
);

create index user_session_user_idx on user_session (user_id) where revoked_at is null;
create index user_session_expiry_idx on user_session (expires_at) where revoked_at is null;
