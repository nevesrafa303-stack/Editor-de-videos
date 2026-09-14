-- =============================================================================
-- 0011 — Financeiro: recebivel, parcela, pagamento, contas a pagar, caixa,
-- gateway, conciliacao e comissao.
--
-- Invariante que organiza o dominio inteiro: PARCELA NAO SE EDITA. O saldo de
-- uma parcela e a soma dos pagamentos ligados a ela; corrigir e estornar, nunca
-- sobrescrever. Isso e o que permite fechar caixa e auditar.
-- =============================================================================

create table financial_category (
  id         uuid primary key default uuid_generate_v7(),
  tenant_id  uuid not null references tenant (id) on delete cascade,
  parent_id  uuid references financial_category (id) on delete set null,
  code       text not null,
  name       text not null,
  direction  text not null check (direction in ('income', 'expense')),
  is_active  boolean not null default true,

  constraint financial_category_code_uk unique (tenant_id, code)
);

create table cost_center (
  id         uuid primary key default uuid_generate_v7(),
  tenant_id  uuid not null references tenant (id) on delete cascade,
  unit_id    uuid references unit (id) on delete cascade,
  code       text not null,
  name       text not null,
  is_active  boolean not null default true,

  constraint cost_center_code_uk unique (tenant_id, code)
);

create type payment_kind as enum
  ('cash', 'pix', 'debit', 'credit', 'boleto', 'transfer', 'insurance', 'credit_note');

create table payment_method (
  id              uuid primary key default uuid_generate_v7(),
  tenant_id       uuid not null references tenant (id) on delete cascade,
  kind            payment_kind not null,
  name            text not null,
  -- Taxa da adquirente e prazo de liquidacao: sem isso o "recebido" do sistema
  -- nunca bate com o extrato.
  fee_percent     numeric(5, 2) not null default 0 check (fee_percent between 0 and 100),
  fee_fixed_cents bigint not null default 0 check (fee_fixed_cents >= 0),
  settlement_days int not null default 0 check (settlement_days >= 0),
  max_installments int not null default 1 check (max_installments between 1 and 48),
  requires_gateway boolean not null default false,
  affects_cash_session boolean not null default false,
  is_active       boolean not null default true,
  sort_order      int not null default 0,

  constraint payment_method_name_uk unique (tenant_id, name)
);

-- --------------------------------------------------------------- recebivel --
create type receivable_origin as enum
  ('quote', 'treatment_plan', 'orthodontic', 'product_sale', 'manual', 'membership_fee');

create type receivable_status as enum ('open', 'partially_paid', 'paid', 'canceled', 'renegotiated');

create table receivable (
  id             uuid primary key default uuid_generate_v7(),
  tenant_id      uuid not null references tenant (id) on delete restrict,
  unit_id        uuid not null references unit (id) on delete restrict,
  patient_id     uuid not null references patient (id) on delete restrict,
  -- Quem paga pode nao ser o paciente (responsavel financeiro, convenio).
  responsible_id uuid references patient_responsible (id) on delete set null,
  payer_id       uuid references payer (id) on delete set null,
  origin         receivable_origin not null,
  quote_id       uuid references quote (id) on delete set null,
  treatment_plan_id uuid references treatment_plan (id) on delete set null,
  orthodontic_case_id uuid references orthodontic_case (id) on delete set null,
  category_id    uuid references financial_category (id) on delete set null,
  cost_center_id uuid references cost_center (id) on delete set null,
  code           bigint,
  status         receivable_status not null default 'open',
  total_cents    bigint not null check (total_cents > 0),
  paid_cents     bigint not null default 0 check (paid_cents >= 0),
  description    text,
  issued_on      date not null default current_date,
  renegotiated_into_id uuid references receivable (id) on delete set null,
  canceled_at    timestamptz,
  cancel_reason  text,
  created_by     uuid references membership (id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),

  constraint receivable_code_uk unique nulls not distinct (tenant_id, code),
  constraint receivable_paid_bound check (paid_cents <= total_cents),
  constraint receivable_cancel_reason check (status <> 'canceled' or cancel_reason is not null)
);

create index receivable_patient_idx on receivable (tenant_id, patient_id, issued_on desc);
create index receivable_open_idx on receivable (tenant_id, status) where status in ('open', 'partially_paid');

create trigger receivable_set_updated_at
  before update on receivable for each row execute function set_updated_at();

create type installment_status as enum ('open', 'partially_paid', 'paid', 'canceled', 'renegotiated');

create table installment (
  id             uuid primary key default uuid_generate_v7(),
  tenant_id      uuid not null references tenant (id) on delete restrict,
  unit_id        uuid not null references unit (id) on delete restrict,
  receivable_id  uuid not null references receivable (id) on delete restrict,
  patient_id     uuid not null references patient (id) on delete restrict,
  number         int not null check (number > 0),
  total_count    int not null check (total_count > 0),
  due_on         date not null,
  amount_cents   bigint not null check (amount_cents > 0),
  paid_cents     bigint not null default 0 check (paid_cents >= 0),
  status         installment_status not null default 'open',
  payment_method_id uuid references payment_method (id) on delete set null,
  -- Boleto/Pix emitido para esta parcela.
  gateway_charge_id uuid,                              -- FK adicionada abaixo
  paid_at        timestamptz,
  canceled_at    timestamptz,
  -- Cobranca: quantas vezes ja avisamos e quando foi a ultima.
  dunning_count  int not null default 0 check (dunning_count >= 0),
  last_dunning_at timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),

  constraint installment_number_uk unique (receivable_id, number),
  constraint installment_paid_bound check (paid_cents <= amount_cents),
  constraint installment_paid_consistent check (
    (status = 'paid') = (paid_cents = amount_cents and paid_cents > 0)
  )
);

create index installment_due_idx on installment (tenant_id, due_on)
  where status in ('open', 'partially_paid');
create index installment_patient_idx on installment (tenant_id, patient_id, due_on);
-- Inadimplencia: vencidas e em aberto.
create index installment_overdue_idx on installment (tenant_id, unit_id, due_on)
  where status in ('open', 'partially_paid');

create trigger installment_set_updated_at
  before update on installment for each row execute function set_updated_at();

alter table orthodontic_maintenance
  add constraint orthodontic_maintenance_installment_fk
  foreign key (installment_id) references installment (id) on delete set null;

-- ---------------------------------------------------------------- caixa -----
create type cash_session_status as enum ('open', 'closed', 'audited');

create table cash_session (
  id              uuid primary key default uuid_generate_v7(),
  tenant_id       uuid not null references tenant (id) on delete restrict,
  unit_id         uuid not null references unit (id) on delete restrict,
  opened_by       uuid not null references membership (id) on delete restrict,
  closed_by       uuid references membership (id) on delete set null,
  status          cash_session_status not null default 'open',
  opened_at       timestamptz not null default now(),
  closed_at       timestamptz,
  opening_cents   bigint not null default 0 check (opening_cents >= 0),
  -- Valor contado fisicamente no fechamento.
  counted_cents   bigint check (counted_cents is null or counted_cents >= 0),
  -- Valor que o sistema esperava; a diferenca e a quebra de caixa.
  expected_cents  bigint,
  difference_cents bigint generated always as (counted_cents - expected_cents) stored,
  notes           text,

  constraint cash_session_closed check (
    (status = 'open') or (closed_at is not null and counted_cents is not null)
  )
);

-- Um caixa aberto por unidade e operador por vez.
create unique index cash_session_open_uk
  on cash_session (unit_id, opened_by) where status = 'open';
create index cash_session_unit_idx on cash_session (tenant_id, unit_id, opened_at desc);

create type cash_movement_kind as enum ('payment', 'withdrawal', 'supply', 'refund', 'adjustment');

create table cash_movement (
  id           uuid primary key default uuid_generate_v7(),
  tenant_id    uuid not null references tenant (id) on delete restrict,
  session_id   uuid not null references cash_session (id) on delete restrict,
  kind         cash_movement_kind not null,
  amount_cents bigint not null check (amount_cents <> 0),
  payment_id   uuid,                                   -- FK adicionada abaixo
  category_id  uuid references financial_category (id) on delete set null,
  description  text,
  created_by   uuid references membership (id) on delete set null,
  created_at   timestamptz not null default now()
);

create index cash_movement_session_idx on cash_movement (tenant_id, session_id, created_at);

-- -------------------------------------------------------------- gateway -----
create type gateway_charge_status as enum
  ('created', 'pending', 'authorized', 'paid', 'failed', 'expired', 'refunded', 'canceled');

create table gateway_charge (
  id              uuid primary key default uuid_generate_v7(),
  tenant_id       uuid not null references tenant (id) on delete restrict,
  unit_id         uuid references unit (id) on delete set null,
  provider        text not null,
  -- Chave enviada ao provedor: garante que retry de rede nao gera duas cobrancas.
  idempotency_key text not null,
  external_id     text,
  kind            payment_kind not null,
  status          gateway_charge_status not null default 'created',
  amount_cents    bigint not null check (amount_cents > 0),
  fee_cents       bigint not null default 0 check (fee_cents >= 0),
  net_cents       bigint generated always as (amount_cents - fee_cents) stored,
  installment_id  uuid references installment (id) on delete set null,
  receivable_id   uuid references receivable (id) on delete set null,
  qr_code         text,
  barcode         text,
  checkout_url    text,
  expires_at      timestamptz,
  paid_at         timestamptz,
  -- Data prevista de liquidacao na conta da clinica.
  settlement_on   date,
  raw_payload     jsonb,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  constraint gateway_charge_idempotency_uk unique (tenant_id, provider, idempotency_key),
  constraint gateway_charge_external_uk unique nulls not distinct (provider, external_id)
);

create index gateway_charge_pending_idx on gateway_charge (tenant_id, status)
  where status in ('created', 'pending', 'authorized');

create trigger gateway_charge_set_updated_at
  before update on gateway_charge for each row execute function set_updated_at();

alter table installment
  add constraint installment_gateway_charge_fk
  foreign key (gateway_charge_id) references gateway_charge (id) on delete set null;

-- ------------------------------------------------------------- pagamento ----
create type payment_status as enum ('confirmed', 'reversed');

create table payment (
  id              uuid primary key default uuid_generate_v7(),
  tenant_id       uuid not null references tenant (id) on delete restrict,
  unit_id         uuid not null references unit (id) on delete restrict,
  installment_id  uuid not null references installment (id) on delete restrict,
  patient_id      uuid not null references patient (id) on delete restrict,
  payment_method_id uuid not null references payment_method (id) on delete restrict,
  gateway_charge_id uuid references gateway_charge (id) on delete set null,
  cash_session_id uuid references cash_session (id) on delete set null,
  status          payment_status not null default 'confirmed',
  amount_cents    bigint not null check (amount_cents > 0),
  fee_cents       bigint not null default 0 check (fee_cents >= 0),
  net_cents       bigint generated always as (amount_cents - fee_cents) stored,
  paid_at         timestamptz not null default now(),
  settlement_on   date,
  -- Estorno nao apaga: cria vinculo para o par pagamento/estorno.
  reverses_payment_id uuid references payment (id) on delete restrict,
  reversal_reason text,
  reversed_at     timestamptz,
  receipt_number  bigint,
  notes           text,
  created_by      uuid references membership (id) on delete set null,
  created_at      timestamptz not null default now(),

  constraint payment_reversal_reason check (
    reverses_payment_id is null or reversal_reason is not null
  ),
  -- Estorno e mudanca de status com motivo e data, nunca exclusao de linha.
  constraint payment_reversed_consistent check (
    (status = 'reversed') = (reversed_at is not null)
  ),
  constraint payment_reversed_reason check (
    status <> 'reversed' or reversal_reason is not null
  )
);

create index payment_installment_idx on payment (tenant_id, installment_id);
create index payment_date_idx on payment (tenant_id, unit_id, paid_at desc);
create index payment_settlement_idx on payment (tenant_id, settlement_on)
  where settlement_on is not null;
-- Um pagamento so pode ser estornado uma vez.
create unique index payment_reversal_uk on payment (reverses_payment_id)
  where reverses_payment_id is not null;

alter table cash_movement
  add constraint cash_movement_payment_fk
  foreign key (payment_id) references payment (id) on delete set null;

-- Pagamento e imutavel: corrigir e estornar.
create or replace function protect_payment() returns trigger
language plpgsql
as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'Pagamento nao pode ser apagado. Registre um estorno.'
      using errcode = 'insufficient_privilege';
  end if;

  if (new.amount_cents, new.installment_id, new.payment_method_id, new.paid_at)
     is distinct from
     (old.amount_cents, old.installment_id, old.payment_method_id, old.paid_at)
  then
    raise exception 'Pagamento confirmado e imutavel. Estorne e lance novamente.'
      using errcode = 'insufficient_privilege';
  end if;

  return new;
end;
$$;

create trigger payment_protect
  before update or delete on payment
  for each row execute function protect_payment();

-- Saldo da parcela e do recebivel derivam dos pagamentos, sempre.
create or replace function recalc_installment_balance() returns trigger
language plpgsql
as $$
declare
  target_installment uuid := coalesce(new.installment_id, old.installment_id);
  v_paid bigint;
  v_amount bigint;
  v_receivable uuid;
begin
  select coalesce(sum(case when p.status = 'confirmed' then p.amount_cents else 0 end), 0)
    into v_paid
  from payment p
  where p.installment_id = target_installment;

  select i.amount_cents, i.receivable_id into v_amount, v_receivable
  from installment i where i.id = target_installment;

  update installment
     set paid_cents = v_paid,
         status = case
                    when status = 'canceled' then status
                    when v_paid >= v_amount then 'paid'::installment_status
                    when v_paid > 0 then 'partially_paid'::installment_status
                    else 'open'::installment_status
                  end,
         paid_at = case when v_paid >= v_amount then now() else null end,
         updated_at = now()
   where id = target_installment;

  update receivable r
     set paid_cents = sub.total_paid,
         status = case
                    when r.status in ('canceled', 'renegotiated') then r.status
                    when sub.total_paid >= r.total_cents then 'paid'::receivable_status
                    when sub.total_paid > 0 then 'partially_paid'::receivable_status
                    else 'open'::receivable_status
                  end,
         updated_at = now()
  from (
    select coalesce(sum(i.paid_cents), 0) as total_paid
    from installment i
    where i.receivable_id = v_receivable and i.status <> 'canceled'
  ) sub
  where r.id = v_receivable;

  return coalesce(new, old);
end;
$$;

create trigger payment_recalc_balance
  after insert or update or delete on payment
  for each row execute function recalc_installment_balance();

-- ------------------------------------------------------- credito do paciente
-- Credito por indicacao, estorno ou pagamento a maior.
create table patient_credit (
  id           uuid primary key default uuid_generate_v7(),
  tenant_id    uuid not null references tenant (id) on delete restrict,
  patient_id   uuid not null references patient (id) on delete restrict,
  origin       text not null check (origin in ('referral', 'refund', 'overpayment', 'courtesy', 'adjustment')),
  amount_cents bigint not null check (amount_cents > 0),
  used_cents   bigint not null default 0 check (used_cents >= 0),
  expires_on   date,
  notes        text,
  created_by   uuid references membership (id) on delete set null,
  created_at   timestamptz not null default now(),

  constraint patient_credit_used_bound check (used_cents <= amount_cents)
);

create index patient_credit_available_idx on patient_credit (tenant_id, patient_id)
  where used_cents < amount_cents;

alter table referral
  add constraint referral_credit_fk
  foreign key (reward_credit_id) references patient_credit (id) on delete set null;

-- ----------------------------------------------------------- contas a pagar -
create table supplier (
  id         uuid primary key default uuid_generate_v7(),
  tenant_id  uuid not null references tenant (id) on delete cascade,
  name       text not null,
  tax_id     text,
  email      citext,
  phone      text,
  notes      text,
  is_active  boolean not null default true,
  created_at timestamptz not null default now(),

  constraint supplier_name_uk unique (tenant_id, name)
);

create type payable_status as enum ('open', 'partially_paid', 'paid', 'canceled');

create table payable (
  id             uuid primary key default uuid_generate_v7(),
  tenant_id      uuid not null references tenant (id) on delete restrict,
  unit_id        uuid references unit (id) on delete set null,
  supplier_id    uuid references supplier (id) on delete set null,
  category_id    uuid references financial_category (id) on delete set null,
  cost_center_id uuid references cost_center (id) on delete set null,
  description    text not null,
  status         payable_status not null default 'open',
  total_cents    bigint not null check (total_cents > 0),
  paid_cents     bigint not null default 0 check (paid_cents >= 0),
  due_on         date not null,
  paid_on        date,
  document_number text,
  -- Vinculo com comissao e com compra de insumo.
  commission_batch_id uuid,
  purchase_order_id   uuid,
  is_recurring   boolean not null default false,
  recurrence_rule text,
  created_by     uuid references membership (id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),

  constraint payable_paid_bound check (paid_cents <= total_cents)
);

create index payable_due_idx on payable (tenant_id, due_on) where status in ('open', 'partially_paid');

create trigger payable_set_updated_at
  before update on payable for each row execute function set_updated_at();

-- ------------------------------------------------------------- comissao -----
create type commission_status as enum ('pending', 'approved', 'paid', 'canceled');

create table commission_entry (
  id             uuid primary key default uuid_generate_v7(),
  tenant_id      uuid not null references tenant (id) on delete restrict,
  unit_id        uuid not null references unit (id) on delete restrict,
  membership_id  uuid not null references membership (id) on delete restrict,
  rule_id        uuid references commission_rule (id) on delete set null,
  -- Origem: item executado ou pagamento recebido, conforme o gatilho da regra.
  treatment_plan_item_id uuid references treatment_plan_item (id) on delete set null,
  injectable_application_id uuid references injectable_application (id) on delete set null,
  payment_id     uuid references payment (id) on delete set null,
  quote_item_id  uuid references quote_item (id) on delete set null,
  basis          commission_basis not null,
  base_cents     bigint not null check (base_cents >= 0),
  percent        numeric(5, 2) check (percent is null or percent between 0 and 100),
  amount_cents   bigint not null check (amount_cents >= 0),
  status         commission_status not null default 'pending',
  reference_month date not null,
  payable_id     uuid references payable (id) on delete set null,
  approved_by    uuid references membership (id) on delete set null,
  approved_at    timestamptz,
  paid_at        timestamptz,
  notes          text,
  created_at     timestamptz not null default now(),

  constraint commission_entry_source check (
    treatment_plan_item_id is not null
    or injectable_application_id is not null
    or payment_id is not null
    or quote_item_id is not null
  )
);

create index commission_entry_member_idx
  on commission_entry (tenant_id, membership_id, reference_month);
create index commission_entry_status_idx on commission_entry (tenant_id, status);
-- Nao gerar duas comissoes para o mesmo pagamento e a mesma regra.
create unique index commission_entry_payment_uk
  on commission_entry (payment_id, membership_id, rule_id)
  where payment_id is not null;

-- ---------------------------------------------------------- conciliacao -----
create table bank_account (
  id         uuid primary key default uuid_generate_v7(),
  tenant_id  uuid not null references tenant (id) on delete cascade,
  unit_id    uuid references unit (id) on delete set null,
  name       text not null,
  bank_code  text,
  branch     text,
  account    text,
  is_active  boolean not null default true
);

create type reconciliation_status as enum ('unmatched', 'matched', 'ignored', 'divergent');

create table bank_statement_entry (
  id            uuid primary key default uuid_generate_v7(),
  tenant_id     uuid not null references tenant (id) on delete cascade,
  account_id    uuid not null references bank_account (id) on delete cascade,
  external_id   text,
  posted_on     date not null,
  amount_cents  bigint not null,
  description   text,
  status        reconciliation_status not null default 'unmatched',
  payment_id    uuid references payment (id) on delete set null,
  payable_id    uuid references payable (id) on delete set null,
  matched_at    timestamptz,
  matched_by    uuid references membership (id) on delete set null,
  raw_payload   jsonb,
  imported_at   timestamptz not null default now(),

  constraint bank_statement_external_uk unique nulls not distinct (account_id, external_id)
);

create index bank_statement_pending_idx on bank_statement_entry (tenant_id, status, posted_on)
  where status = 'unmatched';
