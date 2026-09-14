-- =============================================================================
-- 0010 — Orcamento: itens com preco congelado, desconto controlado, aprovacao
-- assinada e conversao em plano de tratamento e recebivel.
--
-- O orcamento e o documento comercial: uma vez enviado, o que o paciente viu
-- nao muda. Reajuste de tabela, alteracao de ficha tecnica e troca de convenio
-- nao alcancam item ja emitido — por isso preco, custo e comissao sao copiados
-- no ato da emissao.
-- =============================================================================

create type quote_status as enum (
  'draft',        -- em elaboracao
  'sent',         -- enviado ao paciente (em aberto)
  'negotiating',  -- em andamento
  'accepted',     -- fechado
  'rejected',     -- perdido
  'expired',      -- perdeu a validade
  'canceled'
);

create table quote (
  id             uuid primary key default uuid_generate_v7(),
  tenant_id      uuid not null references tenant (id) on delete restrict,
  unit_id        uuid not null references unit (id) on delete restrict,
  patient_id     uuid not null references patient (id) on delete restrict,
  opportunity_id uuid references opportunity (id) on delete set null,
  provider_id    uuid references membership (id) on delete set null,
  created_by     uuid references membership (id) on delete set null,
  payer_id       uuid references payer (id) on delete set null,
  price_list_id  uuid references price_list (id) on delete set null,
  number         bigint not null,
  status         quote_status not null default 'draft',
  title          text,
  notes          text,
  -- Condicoes comerciais propostas.
  valid_until    date,
  installment_count int not null default 1 check (installment_count between 1 and 48),
  down_payment_cents bigint not null default 0 check (down_payment_cents >= 0),

  -- Subtotal e custo vem dos itens (trigger). O total NAO e campo mantido a
  -- mao: e coluna gerada. Assim nao existe estado em que total e desconto
  -- discordem — nem por update parcial, nem por import, nem por script.
  subtotal_cents bigint not null default 0 check (subtotal_cents >= 0),
  discount_cents bigint not null default 0 check (discount_cents >= 0),
  total_cents    bigint generated always as (greatest(subtotal_cents - discount_cents, 0)) stored,
  expected_cost_cents bigint not null default 0 check (expected_cost_cents >= 0),

  -- Desconto acima do permitido exige aprovacao nominal de um gestor.
  discount_approved_by uuid references membership (id) on delete set null,
  discount_approved_at timestamptz,

  sent_at        timestamptz,
  last_interaction_at timestamptz,
  accepted_at    timestamptz,
  rejected_at    timestamptz,
  loss_reason_id uuid references loss_reason (id) on delete set null,
  loss_notes     text,

  -- Aceite do paciente (assinatura eletronica simples).
  signature_image_url text,
  signed_hash    text,
  signed_ip      inet,
  signed_user_agent text,
  signed_by_responsible_id uuid references patient_responsible (id) on delete set null,

  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  deleted_at     timestamptz,

  constraint quote_number_uk unique (tenant_id, number),
  constraint quote_discount_bound check (discount_cents <= subtotal_cents),
  constraint quote_down_payment check (down_payment_cents <= subtotal_cents - discount_cents),
  constraint quote_rejected_reason check (status <> 'rejected' or loss_reason_id is not null),
  constraint quote_accepted_signature check (
    status <> 'accepted' or (accepted_at is not null and signed_hash is not null)
  )
);

create index quote_patient_idx on quote (tenant_id, patient_id, created_at desc)
  where deleted_at is null;
create index quote_status_idx on quote (tenant_id, status) where deleted_at is null;
-- Alerta de orcamento esfriando e de validade vencendo.
create index quote_open_idx on quote (tenant_id, last_interaction_at)
  where status in ('sent', 'negotiating') and deleted_at is null;
create index quote_expiring_idx on quote (tenant_id, valid_until)
  where status in ('sent', 'negotiating') and deleted_at is null;

create trigger quote_set_updated_at
  before update on quote for each row execute function set_updated_at();

create sequence quote_number_seq;

create or replace function assign_quote_number() returns trigger
language plpgsql
as $$
begin
  if new.number is null then
    select coalesce(max(number), 0) + 1 into new.number
    from quote where tenant_id = new.tenant_id;
  end if;
  return new;
end;
$$;

create trigger quote_assign_number
  before insert on quote for each row execute function assign_quote_number();

create table quote_item (
  id             uuid primary key default uuid_generate_v7(),
  tenant_id      uuid not null references tenant (id) on delete cascade,
  quote_id       uuid not null references quote (id) on delete cascade,
  procedure_id   uuid references procedure (id) on delete restrict,
  description    text not null,
  -- Onde: dente + faces (odonto) ou regiao (HOF). O scope do procedimento diz
  -- qual dos dois e obrigatorio; a checagem esta no trigger de 0015.
  tooth_code     char(2) references tooth (code) on delete restrict,
  surfaces       tooth_surface[] not null default '{}',
  region_code    text references body_region (code) on delete restrict,
  -- Sugestao de etapa; vira treatment_plan_phase na conversao.
  phase_label    text,
  phase_order    int not null default 1 check (phase_order > 0),

  quantity       numeric(10, 3) not null default 1 check (quantity > 0),
  quantity_unit  text not null default 'procedimento',
  -- Congelados na emissao.
  unit_price_cents bigint not null check (unit_price_cents >= 0),
  unit_cost_cents  bigint not null default 0 check (unit_cost_cents >= 0),
  discount_cents   bigint not null default 0 check (discount_cents >= 0),
  price_list_item_id uuid references price_list_item (id) on delete set null,
  commission_percent numeric(5, 2) check (commission_percent is null or commission_percent between 0 and 100),

  total_cents    bigint generated always as
                 (greatest((quantity * unit_price_cents)::bigint - discount_cents, 0)) stored,
  sort_order     int not null default 0,
  created_at     timestamptz not null default now(),

  constraint quote_item_discount_bound check (
    discount_cents <= (quantity * unit_price_cents)::bigint
  )
);

create index quote_item_quote_idx on quote_item (tenant_id, quote_id, sort_order);
create index quote_item_procedure_idx on quote_item (tenant_id, procedure_id);

alter table treatment_plan
  add constraint treatment_plan_quote_fk
  foreign key (quote_id) references quote (id) on delete set null;

alter table treatment_plan_item
  add constraint treatment_plan_item_quote_item_fk
  foreign key (quote_item_id) references quote_item (id) on delete set null;

-- Recalcula os totais do orcamento a partir dos itens. Manter isso em trigger
-- (e nao no app) garante que importacao, correcao manual e integracao futura
-- cheguem ao mesmo numero.
create or replace function recalc_quote_totals() returns trigger
language plpgsql
as $$
declare
  target_quote uuid := coalesce(new.quote_id, old.quote_id);
  v_subtotal bigint;
  v_item_discount bigint;
  v_cost bigint;
  v_header_discount bigint;
begin
  select coalesce(sum((qi.quantity * qi.unit_price_cents)::bigint), 0),
         coalesce(sum(qi.discount_cents), 0),
         coalesce(sum((qi.quantity * qi.unit_cost_cents)::bigint), 0)
    into v_subtotal, v_item_discount, v_cost
  from quote_item qi
  where qi.quote_id = target_quote;

  -- Desconto de cabecalho = o que o gestor concedeu alem dos descontos de item.
  select greatest(q.discount_cents - v_item_discount, 0) into v_header_discount
  from quote q where q.id = target_quote;

  update quote
     set subtotal_cents      = v_subtotal,
         discount_cents      = least(v_item_discount + v_header_discount, v_subtotal),
         expected_cost_cents = v_cost,
         updated_at          = now()
   where id = target_quote;

  return coalesce(new, old);
end;
$$;

create trigger quote_item_recalc
  after insert or update or delete on quote_item
  for each row execute function recalc_quote_totals();

create table quote_status_history (
  id          uuid primary key default uuid_generate_v7(),
  tenant_id   uuid not null references tenant (id) on delete cascade,
  quote_id    uuid not null references quote (id) on delete cascade,
  from_status quote_status,
  to_status   quote_status not null,
  reason      text,
  changed_by  uuid references membership (id) on delete set null,
  changed_at  timestamptz not null default now()
);

create index quote_status_history_idx
  on quote_status_history (tenant_id, quote_id, changed_at desc);
