-- =============================================================================
-- 0009 — Catalogo, ficha tecnica, tabela de precos versionada e comissao.
--
-- Duas decisoes centrais:
--
-- 1. PRECO E VERSIONADO. Reajustar a tabela nao pode alterar orcamento ja
--    enviado nem recalcular comissao de procedimento executado. Por isso
--    preco vive em price_list (com vigencia) e e COPIADO para o item na
--    emissao.
-- 2. CUSTO VEM DA FICHA TECNICA (procedure_bom), nao de um campo solto. Sem
--    isso nao existe margem por atendimento — so faturamento, que e o que os
--    concorrentes entregam.
-- =============================================================================

create table procedure_category (
  id         uuid primary key default uuid_generate_v7(),
  tenant_id  uuid not null references tenant (id) on delete cascade,
  parent_id  uuid references procedure_category (id) on delete set null,
  code       text not null,
  name       text not null,
  vertical   text not null default 'geral'
             check (vertical in ('geral', 'odontologia', 'estetica')),
  sort_order int not null default 0,
  is_active  boolean not null default true,

  constraint procedure_category_code_uk unique (tenant_id, code)
);

create type procedure_scope as enum ('tooth', 'surface', 'region', 'arch', 'quadrant', 'session', 'general');

create table procedure (
  id             uuid primary key default uuid_generate_v7(),
  tenant_id      uuid not null references tenant (id) on delete cascade,
  category_id    uuid references procedure_category (id) on delete set null,
  code           text not null,
  name           text not null,
  description    text,
  vertical       text not null default 'geral'
                 check (vertical in ('geral', 'odontologia', 'estetica')),
  -- Define o que o item precisa informar: dente, face, regiao, sessao.
  scope          procedure_scope not null default 'general',
  -- Unidade de venda: 'U' de toxina, 'ml' de preenchedor, 'fio', 'sessao'.
  pricing_unit   text not null default 'procedimento'
                 check (pricing_unit in ('procedimento', 'U', 'ml', 'fio', 'sessao', 'dente', 'face', 'cm2')),
  default_duration_minutes int not null default 30 check (default_duration_minutes between 5 and 480),
  -- Codigo TUSS/ANS para faturamento de convenio.
  tuss_code      text,
  requires_lot   boolean not null default false,
  requires_consent_kind consent_kind,
  is_recurring   boolean not null default false,
  is_active      boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),

  constraint procedure_code_uk unique (tenant_id, code)
);

create index procedure_active_idx on procedure (tenant_id, vertical) where is_active;
create index procedure_name_trgm_idx on procedure using gin (name gin_trgm_ops);

create trigger procedure_set_updated_at
  before update on procedure for each row execute function set_updated_at();

alter table appointment
  add constraint appointment_procedure_fk
  foreign key (procedure_id) references procedure (id) on delete set null;

alter table waitlist_entry
  add constraint waitlist_procedure_fk
  foreign key (procedure_id) references procedure (id) on delete set null;

alter table treatment_plan_item
  add constraint treatment_plan_item_procedure_fk
  foreign key (procedure_id) references procedure (id) on delete restrict;

alter table aesthetic_protocol_step
  add constraint aesthetic_protocol_step_procedure_fk
  foreign key (procedure_id) references procedure (id) on delete set null;

-- ---------------------------------------------------------- ficha tecnica ---
-- Quanto de cada insumo um procedimento consome. Base do custo real e da baixa
-- automatica de estoque na execucao.
create table procedure_bom (
  id            uuid primary key default uuid_generate_v7(),
  tenant_id     uuid not null references tenant (id) on delete cascade,
  procedure_id  uuid not null references procedure (id) on delete cascade,
  product_id    uuid not null,                       -- FK adicionada em 0012
  quantity      numeric(12, 4) not null check (quantity > 0),
  unit          text not null,
  -- Perda esperada (sobra de seringa, material descartado): entra no custo.
  waste_percent numeric(5, 2) not null default 0 check (waste_percent between 0 and 100),
  is_optional   boolean not null default false,
  -- Consome automaticamente ao executar, ou exige confirmacao do profissional.
  auto_consume  boolean not null default true,
  notes         text,

  constraint procedure_bom_uk unique (procedure_id, product_id)
);

create index procedure_bom_procedure_idx on procedure_bom (tenant_id, procedure_id);

-- --------------------------------------------------------------- pagadores --
create type payer_kind as enum ('private', 'insurance', 'agreement', 'partnership');

create table payer (
  id            uuid primary key default uuid_generate_v7(),
  tenant_id     uuid not null references tenant (id) on delete cascade,
  kind          payer_kind not null default 'private',
  code          text not null,
  name          text not null,
  ans_code      text,
  tax_id        text,
  -- Prazo medio de repasse do convenio; alimenta a previsao de caixa.
  settlement_days int not null default 0 check (settlement_days >= 0),
  -- Taxa administrativa retida pelo convenio.
  admin_fee_percent numeric(5, 2) not null default 0 check (admin_fee_percent between 0 and 100),
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),

  constraint payer_code_uk unique (tenant_id, code)
);

-- ---------------------------------------------------- tabela de precos ------
create type price_list_status as enum ('draft', 'active', 'archived');

create table price_list (
  id          uuid primary key default uuid_generate_v7(),
  tenant_id   uuid not null references tenant (id) on delete cascade,
  unit_id     uuid references unit (id) on delete cascade,   -- null = toda a rede
  payer_id    uuid references payer (id) on delete cascade,  -- null = particular padrao
  code        text not null,
  name        text not null,
  version     int not null default 1 check (version > 0),
  status      price_list_status not null default 'draft',
  valid_from  date not null default current_date,
  valid_to    date,
  validity    daterange generated always as (daterange(valid_from, valid_to, '[)')) stored,
  created_by  uuid references membership (id) on delete set null,
  created_at  timestamptz not null default now(),
  activated_at timestamptz,

  constraint price_list_version_uk unique (tenant_id, code, version),
  constraint price_list_period check (valid_to is null or valid_to > valid_from),

  -- Duas tabelas ativas para o mesmo publico e ambiguidade de preco: o banco
  -- recusa. nulls not distinct faz "toda a rede" e "particular" colidirem
  -- corretamente entre si.
  constraint price_list_no_overlap exclude using gist (
    tenant_id with =,
    coalesce(unit_id, '00000000-0000-0000-0000-000000000000'::uuid) with =,
    coalesce(payer_id, '00000000-0000-0000-0000-000000000000'::uuid) with =,
    validity with &&
  ) where (status = 'active')
);

create index price_list_active_idx on price_list (tenant_id, status) where status = 'active';

create table price_list_item (
  id            uuid primary key default uuid_generate_v7(),
  tenant_id     uuid not null references tenant (id) on delete cascade,
  price_list_id uuid not null references price_list (id) on delete cascade,
  procedure_id  uuid not null references procedure (id) on delete restrict,
  price_cents   bigint not null check (price_cents >= 0),
  -- Piso de negociacao: desconto abaixo disso exige aprovacao de gestor.
  floor_price_cents bigint check (floor_price_cents is null or floor_price_cents >= 0),
  -- Custo previsto congelado (soma da BOM na data). Serve de referencia de
  -- margem mesmo se a ficha tecnica mudar depois.
  expected_cost_cents bigint not null default 0 check (expected_cost_cents >= 0),
  max_discount_percent numeric(5, 2) not null default 100
                       check (max_discount_percent between 0 and 100),
  commission_percent   numeric(5, 2)
                       check (commission_percent is null or commission_percent between 0 and 100),

  constraint price_list_item_uk unique (price_list_id, procedure_id),
  constraint price_list_item_floor check (
    floor_price_cents is null or floor_price_cents <= price_cents
  )
);

create index price_list_item_procedure_idx on price_list_item (tenant_id, procedure_id);

-- Resolve o preco vigente. Precedencia: unidade+pagador > unidade > pagador >
-- rede. Centralizada aqui para orcamento, agenda e simulador nao divergirem.
create or replace function resolve_price(
  p_tenant_id uuid,
  p_procedure_id uuid,
  p_unit_id uuid default null,
  p_payer_id uuid default null,
  p_on date default current_date
) returns table (
  price_list_item_id uuid,
  price_cents bigint,
  floor_price_cents bigint,
  expected_cost_cents bigint,
  price_list_id uuid
)
language sql
stable
as $$
  select pli.id, pli.price_cents, pli.floor_price_cents, pli.expected_cost_cents, pl.id
  from price_list pl
  join price_list_item pli on pli.price_list_id = pl.id
  where pl.tenant_id = p_tenant_id
    and pl.status = 'active'
    and pli.procedure_id = p_procedure_id
    and pl.validity @> p_on
    and (pl.unit_id is null or pl.unit_id = p_unit_id)
    and (pl.payer_id is null or pl.payer_id = p_payer_id)
  order by
    (pl.unit_id is not null) desc,
    (pl.payer_id is not null) desc,
    pl.valid_from desc
  limit 1;
$$;

-- ---------------------------------------------------------------- comissao --
create type commission_basis as enum (
  'gross_price',    -- sobre o valor bruto do item
  'net_price',      -- sobre o valor apos desconto
  'received',       -- sobre o que efetivamente entrou (protege o caixa)
  'margin'          -- sobre a margem (preco - custo de insumo)
);

create type commission_trigger as enum ('on_execution', 'on_payment');

-- Regra de comissao com escopo. A mais especifica vence; o desempate esta em
-- priority, e nao na ordem de insercao.
create table commission_rule (
  id            uuid primary key default uuid_generate_v7(),
  tenant_id     uuid not null references tenant (id) on delete cascade,
  unit_id       uuid references unit (id) on delete cascade,
  membership_id uuid references membership (id) on delete cascade,
  procedure_id  uuid references procedure (id) on delete cascade,
  category_id   uuid references procedure_category (id) on delete cascade,
  payer_id      uuid references payer (id) on delete cascade,
  basis         commission_basis not null default 'received',
  trigger_event commission_trigger not null default 'on_payment',
  percent       numeric(5, 2) check (percent is null or percent between 0 and 100),
  fixed_cents   bigint check (fixed_cents is null or fixed_cents >= 0),
  priority      int not null default 0,
  valid_from    date not null default current_date,
  valid_to      date,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),

  constraint commission_rule_value check (
    (percent is not null) <> (fixed_cents is not null)
  ),
  constraint commission_rule_period check (valid_to is null or valid_to >= valid_from)
);

create index commission_rule_lookup_idx
  on commission_rule (tenant_id, membership_id, procedure_id, priority desc)
  where is_active;
