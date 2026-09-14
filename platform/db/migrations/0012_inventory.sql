-- =============================================================================
-- 0012 — Estoque: produto, lote com validade, local, movimentacao, inventario
-- e log de temperatura.
--
-- Duas regras estruturam o dominio:
--
-- 1. MOVIMENTACAO E APPEND-ONLY. Saldo nao e um campo que alguem edita: e a
--    soma das movimentacoes. Ajuste de inventario tambem e movimentacao, com
--    motivo e autor.
-- 2. LOTE E OBRIGATORIO para produto que exige rastreio (toxina, preenchedor,
--    fio). Sem isso nao existe recall reverso nem defesa em fiscalizacao.
-- =============================================================================

create type product_kind as enum
  ('consumable', 'injectable', 'medication', 'instrument', 'equipment', 'retail');

create table product (
  id             uuid primary key default uuid_generate_v7(),
  tenant_id      uuid not null references tenant (id) on delete cascade,
  kind           product_kind not null default 'consumable',
  code           text not null,
  name           text not null,
  brand          text,
  -- Registro ANVISA do produto: exigido em fiscalizacao de injetavel.
  anvisa_code    text,
  -- Unidade de estoque e unidade de uso podem diferir: compra-se o frasco de
  -- 100U e aplica-se 2U. conversion_factor traduz uma na outra.
  stock_unit     text not null,
  usage_unit     text not null,
  conversion_factor numeric(12, 4) not null default 1 check (conversion_factor > 0),
  requires_lot   boolean not null default false,
  requires_refrigeration boolean not null default false,
  min_temperature numeric(4, 1),
  max_temperature numeric(4, 1),
  -- Politica de reposicao.
  min_quantity   numeric(12, 3) not null default 0 check (min_quantity >= 0),
  max_quantity   numeric(12, 3) check (max_quantity is null or max_quantity >= min_quantity),
  lead_time_days int not null default 7 check (lead_time_days >= 0),
  default_cost_cents bigint not null default 0 check (default_cost_cents >= 0),
  is_active      boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),

  constraint product_code_uk unique (tenant_id, code),
  constraint product_temperature check (
    not requires_refrigeration or (min_temperature is not null and max_temperature is not null)
  )
);

create index product_active_idx on product (tenant_id, kind) where is_active;

create trigger product_set_updated_at
  before update on product for each row execute function set_updated_at();

alter table procedure_bom
  add constraint procedure_bom_product_fk
  foreign key (product_id) references product (id) on delete restrict;

alter table aesthetic_protocol_step
  add constraint aesthetic_protocol_step_product_fk
  foreign key (product_id) references product (id) on delete set null;

create table stock_location (
  id         uuid primary key default uuid_generate_v7(),
  tenant_id  uuid not null references tenant (id) on delete cascade,
  unit_id    uuid not null references unit (id) on delete cascade,
  code       text not null,
  name       text not null,
  kind       text not null default 'storage'
             check (kind in ('storage', 'room', 'fridge', 'cart', 'quarantine')),
  is_active  boolean not null default true,

  constraint stock_location_code_uk unique (unit_id, code)
);

create table product_lot (
  id             uuid primary key default uuid_generate_v7(),
  tenant_id      uuid not null references tenant (id) on delete restrict,
  product_id     uuid not null references product (id) on delete restrict,
  lot_number     text not null,
  expires_on     date not null,
  manufactured_on date,
  supplier_id    uuid references supplier (id) on delete set null,
  invoice_number text,
  unit_cost_cents bigint not null default 0 check (unit_cost_cents >= 0),
  received_on    date not null default current_date,
  -- Bloqueio sanitario: lote recolhido nao pode ser aplicado.
  is_blocked     boolean not null default false,
  blocked_reason text,
  created_at     timestamptz not null default now(),

  constraint product_lot_uk unique (tenant_id, product_id, lot_number),
  constraint product_lot_expiry check (manufactured_on is null or expires_on > manufactured_on),
  constraint product_lot_block_reason check (not is_blocked or blocked_reason is not null)
);

-- Alerta de vencimento e consulta FEFO (first expired, first out).
create index product_lot_expiry_idx on product_lot (tenant_id, product_id, expires_on)
  where not is_blocked;

alter table injectable_application
  add constraint injectable_application_product_fk
  foreign key (product_id) references product (id) on delete restrict;

alter table injectable_application
  add constraint injectable_application_lot_fk
  foreign key (product_lot_id) references product_lot (id) on delete restrict;

-- --------------------------------------------------------- movimentacao -----
create type stock_movement_kind as enum (
  'purchase',       -- entrada por compra
  'consumption',    -- baixa por execucao de procedimento
  'loss',           -- perda, quebra, vencimento
  'transfer_in',
  'transfer_out',
  'adjustment',     -- acerto de inventario
  'return',         -- devolucao ao fornecedor
  'sale'            -- venda de produto ao paciente
);

create table stock_movement (
  id             uuid primary key default uuid_generate_v7(),
  tenant_id      uuid not null references tenant (id) on delete restrict,
  unit_id        uuid not null references unit (id) on delete restrict,
  product_id     uuid not null references product (id) on delete restrict,
  lot_id         uuid references product_lot (id) on delete restrict,
  location_id    uuid references stock_location (id) on delete restrict,
  kind           stock_movement_kind not null,
  -- Sinal do movimento: positivo entra, negativo sai. Um so campo evita a
  -- eterna confusao de "quantidade" com significado dependente do tipo.
  quantity       numeric(14, 4) not null check (quantity <> 0),
  unit_cost_cents bigint not null default 0 check (unit_cost_cents >= 0),
  total_cost_cents bigint generated always as
                  ((abs(quantity) * unit_cost_cents)::bigint) stored,
  -- Rastro de origem.
  appointment_id uuid references appointment (id) on delete set null,
  treatment_plan_item_id uuid references treatment_plan_item (id) on delete set null,
  aesthetic_session_id uuid references aesthetic_session (id) on delete set null,
  patient_id     uuid references patient (id) on delete set null,
  inventory_count_id uuid,
  transfer_group_id uuid,
  reason         text,
  performed_by   uuid references membership (id) on delete set null,
  occurred_at    timestamptz not null default now(),
  created_at     timestamptz not null default now(),

  constraint stock_movement_direction check (
    (kind in ('purchase', 'transfer_in', 'return') and quantity > 0)
    or (kind in ('consumption', 'loss', 'transfer_out', 'sale') and quantity < 0)
    or (kind = 'adjustment')
  ),
  constraint stock_movement_reason check (
    kind not in ('loss', 'adjustment') or reason is not null
  )
);

create index stock_movement_product_idx
  on stock_movement (tenant_id, product_id, occurred_at desc);
create index stock_movement_lot_idx on stock_movement (tenant_id, lot_id)
  where lot_id is not null;
create index stock_movement_patient_idx on stock_movement (tenant_id, patient_id)
  where patient_id is not null;

create trigger stock_movement_append_only
  before update or delete on stock_movement
  for each row execute function forbid_mutation();

alter table injectable_application
  add constraint injectable_application_movement_fk
  foreign key (stock_movement_id) references stock_movement (id) on delete set null;

-- Saldo materializado. Existe porque somar o log inteiro a cada tela de agenda
-- nao escala; e mantido exclusivamente por trigger, nunca pelo app.
-- lot_id e location_id sao opcionais (produto sem controle de lote, estoque
-- unico). Por isso a chave natural e uma unique NULLS NOT DISTINCT e nao uma
-- PK composta: PK exigiria NOT NULL e inviabilizaria esses casos.
create table stock_balance (
  id          uuid primary key default uuid_generate_v7(),
  tenant_id   uuid not null references tenant (id) on delete cascade,
  unit_id     uuid not null references unit (id) on delete cascade,
  product_id  uuid not null references product (id) on delete cascade,
  lot_id      uuid references product_lot (id) on delete cascade,
  location_id uuid references stock_location (id) on delete cascade,
  quantity    numeric(14, 4) not null default 0,
  updated_at  timestamptz not null default now(),

  constraint stock_balance_uk
    unique nulls not distinct (unit_id, product_id, lot_id, location_id)
);

create index stock_balance_product_idx on stock_balance (tenant_id, product_id);
create index stock_balance_low_idx on stock_balance (tenant_id, unit_id, product_id)
  where quantity <= 0;

create or replace function apply_stock_movement() returns trigger
language plpgsql
as $$
begin
  insert into stock_balance as sb
    (tenant_id, unit_id, product_id, lot_id, location_id, quantity, updated_at)
  values
    (new.tenant_id, new.unit_id, new.product_id, new.lot_id, new.location_id,
     new.quantity, now())
  on conflict on constraint stock_balance_uk do update
    set quantity = sb.quantity + excluded.quantity,
        updated_at = now();

  return new;
end;
$$;

create trigger stock_movement_apply
  after insert on stock_movement
  for each row execute function apply_stock_movement();

-- ------------------------------------------------------------ inventario ----
create type inventory_count_status as enum ('draft', 'counting', 'closed', 'canceled');

create table inventory_count (
  id          uuid primary key default uuid_generate_v7(),
  tenant_id   uuid not null references tenant (id) on delete restrict,
  unit_id     uuid not null references unit (id) on delete restrict,
  location_id uuid references stock_location (id) on delete set null,
  status      inventory_count_status not null default 'draft',
  started_at  timestamptz not null default now(),
  closed_at   timestamptz,
  started_by  uuid references membership (id) on delete set null,
  closed_by   uuid references membership (id) on delete set null,
  notes       text
);

create table inventory_count_item (
  id                 uuid primary key default uuid_generate_v7(),
  tenant_id          uuid not null references tenant (id) on delete cascade,
  inventory_count_id uuid not null references inventory_count (id) on delete cascade,
  product_id         uuid not null references product (id) on delete restrict,
  lot_id             uuid references product_lot (id) on delete restrict,
  expected_quantity  numeric(14, 4) not null default 0,
  counted_quantity   numeric(14, 4),
  difference         numeric(14, 4) generated always as
                     (counted_quantity - expected_quantity) stored,
  adjustment_movement_id uuid references stock_movement (id) on delete set null,
  counted_by         uuid references membership (id) on delete set null,
  counted_at         timestamptz,

  constraint inventory_count_item_uk unique nulls not distinct (inventory_count_id, product_id, lot_id)
);

alter table stock_movement
  add constraint stock_movement_inventory_fk
  foreign key (inventory_count_id) references inventory_count (id) on delete set null;

-- ----------------------------------------------------------------- compra ---
create type purchase_order_status as enum ('draft', 'sent', 'partially_received', 'received', 'canceled');

create table purchase_order (
  id          uuid primary key default uuid_generate_v7(),
  tenant_id   uuid not null references tenant (id) on delete restrict,
  unit_id     uuid not null references unit (id) on delete restrict,
  supplier_id uuid references supplier (id) on delete set null,
  status      purchase_order_status not null default 'draft',
  number      bigint,
  expected_on date,
  received_on date,
  total_cents bigint not null default 0 check (total_cents >= 0),
  payable_id  uuid references payable (id) on delete set null,
  created_by  uuid references membership (id) on delete set null,
  created_at  timestamptz not null default now(),

  constraint purchase_order_number_uk unique nulls not distinct (tenant_id, number)
);

create table purchase_order_item (
  id                uuid primary key default uuid_generate_v7(),
  tenant_id         uuid not null references tenant (id) on delete cascade,
  purchase_order_id uuid not null references purchase_order (id) on delete cascade,
  product_id        uuid not null references product (id) on delete restrict,
  quantity          numeric(14, 4) not null check (quantity > 0),
  received_quantity numeric(14, 4) not null default 0 check (received_quantity >= 0),
  unit_cost_cents   bigint not null default 0 check (unit_cost_cents >= 0),
  lot_id            uuid references product_lot (id) on delete set null,

  constraint purchase_order_item_received check (received_quantity <= quantity)
);

alter table payable
  add constraint payable_purchase_order_fk
  foreign key (purchase_order_id) references purchase_order (id) on delete set null;

-- -------------------------------------------------------- temperatura -------
-- Toxina e preenchedor perdem eficacia fora da faixa. O log e prova de
-- conservacao — e o gatilho do alerta quando a geladeira falha de madrugada.
create table temperature_log (
  id           uuid primary key default uuid_generate_v7(),
  tenant_id    uuid not null references tenant (id) on delete cascade,
  unit_id      uuid not null references unit (id) on delete cascade,
  location_id  uuid not null references stock_location (id) on delete cascade,
  temperature  numeric(4, 1) not null,
  humidity     numeric(5, 2),
  source       text not null default 'manual' check (source in ('manual', 'sensor')),
  is_breach    boolean not null default false,
  recorded_by  uuid references membership (id) on delete set null,
  recorded_at  timestamptz not null default now()
);

create index temperature_log_location_idx
  on temperature_log (tenant_id, location_id, recorded_at desc);
create index temperature_log_breach_idx on temperature_log (tenant_id, recorded_at desc)
  where is_breach;
