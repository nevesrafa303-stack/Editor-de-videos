-- =============================================================================
-- 0027 — Faturamento por guia: co-participacao, guia, lote e glosa.
--
-- Este e o ciclo de vida PARALELO ao do recebimento particular, e a razao de o
-- modulo de convenio ter saido em duas fatias (ver docs/decisoes-produto.md, 4).
-- No particular, aceitar o orcamento cria uma divida do paciente e acabou. Aqui
-- ele cria DUAS coisas: uma guia contra o convenio e, quando existe
-- co-participacao, um recebivel no nome do paciente pela parte dele.
--
-- O que este modelo assume, e por que:
--
-- 1. CO-PARTICIPACAO VARIA POR PROCEDIMENTO. Um plano isenta prevencao e cobra
--    30% em protese; um percentual unico no cadastro do convenio nao descreve
--    isso. Entao a parte do paciente mora na LINHA da tabela de preco, e e
--    congelada no item do orcamento como todo o resto.
--
-- 2. A CONFERENCIA E POR PROCEDIMENTO, nao por guia nem por lote. E o unico
--    nivel em que se responde "qual procedimento este convenio glosa sempre?",
--    que e a informacao que muda a negociacao do contrato. Conferir so o total
--    do lote guarda o prejuizo sem guardar a causa.
--
-- 3. GLOSA TEM PRAZO. Glosa nao recorrida dentro do prazo vira perda silenciosa,
--    e o prazo e exatamente o que ninguem lembra. Por isso ela e uma entidade
--    com maquina de estados propria e uma data de vencimento do recurso — nao
--    uma coluna de valor com um texto ao lado.
--
-- 4. AUTORIZACAO PREVIA NAO ENTRA nesta fatia. A guia guarda o numero da senha
--    e a validade, preenchidos a mao por quem conseguiu no portal do convenio.
--    O fluxo de pedir, aguardar e receber autorizacao e outra fatia, e depende
--    de integracao que nao existe.
-- =============================================================================

-- ------------------------------------------------------- co-participacao ----

-- Prazo de recurso de glosa. Varia por contrato; o padrao de 30 dias e o mais
-- comum e serve de ponto de partida, nao de verdade.
alter table payer
  add column appeal_days int not null default 30 check (appeal_days between 0 and 365);

comment on column payer.appeal_days is
  'Prazo para recorrer de glosa, contado da data do demonstrativo de repasse.';

-- Quanto DESTE procedimento o paciente paga do proprio bolso. O convenio paga
-- o resto. Zero (o padrao) significa cobertura integral — que e a leitura certa
-- para a tabela particular, onde a coluna nao tem sentido.
alter table price_list_item
  add column patient_share_cents bigint not null default 0
    check (patient_share_cents >= 0),
  add constraint price_list_item_share_bound
    check (patient_share_cents <= price_cents);

comment on column price_list_item.patient_share_cents is
  'Co-participacao: a parte do paciente. O convenio paga price_cents - patient_share_cents.';

-- Congelada no item, como o preco. Reajustar a co-participacao amanha nao muda
-- a proposta que o paciente assinou — mesmo motivo de a tabela ser versionada.
alter table quote_item
  add column patient_share_cents bigint not null default 0
    check (patient_share_cents >= 0);

comment on column quote_item.patient_share_cents is
  'Co-participacao congelada na emissao. Unitaria, como unit_price_cents.';

-- ------------------------------------------------------------------ lote ----
create type claim_batch_status as enum ('open', 'submitted', 'settled', 'canceled');

create table claim_batch (
  id             uuid primary key default uuid_generate_v7(),
  tenant_id      uuid not null references tenant (id) on delete restrict,
  unit_id        uuid not null references unit (id) on delete restrict,
  payer_id       uuid not null references payer (id) on delete restrict,
  code           text,
  status         claim_batch_status not null default 'open',
  -- Mes de competencia: o convenio fatura por mes, nao por data de emissao.
  competence     date not null,
  submitted_at   timestamptz,
  submitted_by   uuid references membership (id) on delete set null,
  -- Data do demonstrativo de repasse. E dela que sai o prazo de recurso de
  -- toda glosa do lote, entao ela nao e detalhe de relatorio.
  remittance_date date,
  -- Somas mantidas por trigger a partir das guias. Existem para a tela nao
  -- precisar somar o lote inteiro a cada abertura.
  billed_cents   bigint not null default 0 check (billed_cents >= 0),
  paid_cents     bigint not null default 0 check (paid_cents >= 0),
  notes          text,
  canceled_at    timestamptz,
  cancel_reason  text,
  created_by     uuid references membership (id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),

  constraint claim_batch_submitted check (status = 'open' or submitted_at is not null),
  constraint claim_batch_settled check (status <> 'settled' or remittance_date is not null),
  constraint claim_batch_cancel_reason check (status <> 'canceled' or cancel_reason is not null)
);

-- Um lote em aberto por convenio, unidade e competencia: dois lotes abertos
-- para o mesmo mes e a forma mais facil de enviar a mesma guia duas vezes.
create unique index claim_batch_open_uk
  on claim_batch (tenant_id, unit_id, payer_id, competence)
  where status = 'open';

create unique index claim_batch_code_uk
  on claim_batch (tenant_id, code) where code is not null;

create index claim_batch_payer_idx on claim_batch (tenant_id, payer_id, competence desc);

create trigger claim_batch_set_updated_at
  before update on claim_batch for each row execute function set_updated_at();

comment on table claim_batch is
  'Lote de guias enviado ao convenio. A competencia e o mes faturado, nao a data de envio.';

-- ------------------------------------------------------------------ guia ----
create type claim_status as enum ('open', 'batched', 'submitted', 'settled', 'canceled');

create table claim (
  id             uuid primary key default uuid_generate_v7(),
  tenant_id      uuid not null references tenant (id) on delete restrict,
  unit_id        uuid not null references unit (id) on delete restrict,
  payer_id       uuid not null references payer (id) on delete restrict,
  patient_id     uuid not null references patient (id) on delete restrict,
  provider_id    uuid references membership (id) on delete set null,
  quote_id       uuid references quote (id) on delete set null,
  batch_id       uuid references claim_batch (id) on delete set null,
  number         bigint,
  status         claim_status not null default 'open',
  -- Senha do convenio, anotada a mao. Sem ela, auditoria do convenio glosa o
  -- que ja foi pago — e a clinica devolve dinheiro meses depois.
  authorization_code text,
  authorization_valid_until date,
  billed_cents   bigint not null default 0 check (billed_cents >= 0),
  paid_cents     bigint not null default 0 check (paid_cents >= 0),
  denied_cents   bigint not null default 0 check (denied_cents >= 0),
  issued_on      date not null default current_date,
  notes          text,
  canceled_at    timestamptz,
  cancel_reason  text,
  created_by     uuid references membership (id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),

  constraint claim_batched check ((status in ('open', 'canceled')) or batch_id is not null),
  constraint claim_cancel_reason check (status <> 'canceled' or cancel_reason is not null)
);

create unique index claim_number_uk on claim (tenant_id, number) where number is not null;
create index claim_batch_idx on claim (tenant_id, batch_id);
create index claim_patient_idx on claim (tenant_id, patient_id, issued_on desc);
-- Guias emitidas esperando lote: e a fila de trabalho do faturamento.
create index claim_open_idx on claim (tenant_id, payer_id, issued_on) where status = 'open';

create trigger claim_set_updated_at
  before update on claim for each row execute function set_updated_at();

comment on table claim is
  'Guia: o que a clinica cobra do convenio por um paciente. Paralela ao receivable, que cobra do paciente.';

-- --------------------------------------------------------- item da guia ----
create table claim_item (
  id             uuid primary key default uuid_generate_v7(),
  tenant_id      uuid not null references tenant (id) on delete restrict,
  claim_id       uuid not null references claim (id) on delete cascade,
  quote_item_id  uuid references quote_item (id) on delete set null,
  procedure_id   uuid references procedure (id) on delete set null,
  description    text not null,
  tooth_code     text references tooth (code) on delete set null,
  surfaces       tooth_surface[] not null default '{}',
  region_code    text,
  quantity       numeric(10, 3) not null default 1 check (quantity > 0),
  -- O que foi faturado AO CONVENIO nesta linha: ja liquido da co-participacao.
  billed_cents   bigint not null check (billed_cents >= 0),
  -- NULL enquanto o demonstrativo nao chega. Zero e uma afirmacao diferente:
  -- "conferido, e o convenio nao pagou nada desta linha".
  paid_cents     bigint check (paid_cents >= 0),
  settled_at     timestamptz,
  sort_order     int not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),

  denied_cents   bigint generated always as (
    case when paid_cents is null then 0 else greatest(billed_cents - paid_cents, 0) end
  ) stored,

  constraint claim_item_settled check ((paid_cents is null) = (settled_at is null)),
  constraint claim_item_paid_bound check (paid_cents is null or paid_cents <= billed_cents)
);

create index claim_item_claim_idx on claim_item (tenant_id, claim_id, sort_order);
-- "Qual procedimento este convenio glosa sempre?" — a consulta que muda a
-- negociacao do contrato, e a razao de a conferencia ser por linha.
create index claim_item_denied_idx on claim_item (tenant_id, procedure_id)
  where denied_cents > 0;

create trigger claim_item_set_updated_at
  before update on claim_item for each row execute function set_updated_at();

comment on table claim_item is
  'Linha da guia. A conferencia do repasse acontece aqui, nao no total da guia.';

-- ----------------------------------------------------------------- glosa ----
create type claim_denial_status as enum
  ('open', 'appealed', 'recovered', 'written_off', 'expired');

create table claim_denial (
  id             uuid primary key default uuid_generate_v7(),
  tenant_id      uuid not null references tenant (id) on delete restrict,
  claim_item_id  uuid not null references claim_item (id) on delete cascade,
  -- Desnormalizado de proposito: toda consulta de glosa parte da guia ou do
  -- convenio, e nao ha caminho em que o item mude de guia.
  claim_id       uuid not null references claim (id) on delete cascade,
  amount_cents   bigint not null check (amount_cents > 0),
  reason_code    text,
  reason         text not null,
  status         claim_denial_status not null default 'open',
  -- Contado da data do demonstrativo. Passar dele sem recorrer e perder o
  -- dinheiro por silencio.
  appeal_deadline date,
  appealed_at    timestamptz,
  appeal_notes   text,
  recovered_cents bigint not null default 0 check (recovered_cents >= 0),
  resolved_at    timestamptz,
  resolution_notes text,
  created_by     uuid references membership (id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),

  constraint claim_denial_recovered_bound check (recovered_cents <= amount_cents),
  constraint claim_denial_recovered_consistent check (
    status <> 'recovered' or recovered_cents > 0
  ),
  constraint claim_denial_appealed check (status <> 'appealed' or appealed_at is not null)
);

create index claim_denial_claim_idx on claim_denial (tenant_id, claim_id);
-- O prazo que vence: a fila que a clinica precisa olhar toda semana.
create index claim_denial_deadline_idx on claim_denial (tenant_id, appeal_deadline)
  where status in ('open', 'appealed');

create trigger claim_denial_set_updated_at
  before update on claim_denial for each row execute function set_updated_at();

comment on table claim_denial is
  'Glosa: o convenio pagou menos do que foi faturado. Tem prazo de recurso, e o prazo e o que se perde.';

-- ------------------------------------------------------ somas por trigger ---
-- As somas vivem em coluna porque a tela de lote lista dezenas de guias e a de
-- guia lista dezenas de linhas. Recalcular por trigger, na mesma transacao, e o
-- que impede o total de discordar das partes — que e o erro que ninguem percebe
-- ate o fechamento do mes.
create or replace function refresh_claim_totals() returns trigger
language plpgsql
as $$
declare
  v_claim uuid := coalesce(new.claim_id, old.claim_id);
begin
  update claim c
     set billed_cents = t.billed,
         paid_cents   = t.paid,
         denied_cents = t.denied
    from (
      select coalesce(sum(billed_cents), 0)        as billed,
             coalesce(sum(paid_cents), 0)          as paid,
             coalesce(sum(denied_cents), 0)        as denied
        from claim_item where claim_id = v_claim
    ) t
   where c.id = v_claim;

  return null;
end;
$$;

create trigger claim_item_refresh_totals
  after insert or update or delete on claim_item
  for each row execute function refresh_claim_totals();

create or replace function refresh_claim_batch_totals() returns trigger
language plpgsql
as $$
declare
  v_batch uuid;
begin
  foreach v_batch in array array_remove(
    array[coalesce(new.batch_id, null), coalesce(old.batch_id, null)], null
  )
  loop
    update claim_batch b
       set billed_cents = t.billed,
           paid_cents   = t.paid
      from (
        select coalesce(sum(billed_cents), 0) as billed,
               coalesce(sum(paid_cents), 0)   as paid
          from claim where batch_id = v_batch and status <> 'canceled'
      ) t
     where b.id = v_batch;
  end loop;

  return null;
end;
$$;

create trigger claim_refresh_batch_totals
  after insert or update or delete on claim
  for each row execute function refresh_claim_batch_totals();

-- ------------------------------------------------------- numero e codigo ----
-- Mesma escolha do recebivel: o numero e sequencial POR REDE, atribuido na
-- insercao, e nao existe antes de a linha existir.
create or replace function assign_claim_number() returns trigger
language plpgsql
as $$
begin
  if new.number is null then
    select coalesce(max(number), 0) + 1 into new.number
      from claim where tenant_id = new.tenant_id;
  end if;
  return new;
end;
$$;

create trigger claim_assign_number
  before insert on claim for each row execute function assign_claim_number();

create or replace function assign_claim_batch_code() returns trigger
language plpgsql
as $$
declare
  v_seq bigint;
begin
  if new.code is null then
    select coalesce(max(substring(code from '[0-9]+$')::bigint), 0) + 1 into v_seq
      from claim_batch where tenant_id = new.tenant_id;

    new.code := to_char(new.competence, 'YYYY-MM') || '-' || lpad(v_seq::text, 5, '0');
  end if;
  return new;
end;
$$;

create trigger claim_batch_assign_code
  before insert on claim_batch for each row execute function assign_claim_batch_code();

-- --------------------------------------------------- maquinas de estado -----
insert into state_transition (entity, from_state, to_state, label, is_terminal) values
  -- Guia
  ('claim', 'open',      'batched',   'Incluida em lote',        false),
  ('claim', 'open',      'canceled',  'Cancelada',               true),
  ('claim', 'batched',   'open',      'Retirada do lote',        false),
  ('claim', 'batched',   'submitted', 'Lote enviado',            false),
  ('claim', 'batched',   'canceled',  'Cancelada',               true),
  ('claim', 'submitted', 'settled',   'Repasse conferido',       true),
  ('claim', 'submitted', 'canceled',  'Cancelada apos envio',    true),

  -- Lote
  ('claim_batch', 'open',      'submitted', 'Enviado ao convenio',   false),
  ('claim_batch', 'open',      'canceled',  'Descartado',            true),
  ('claim_batch', 'submitted', 'settled',   'Repasse conferido',     true),
  ('claim_batch', 'submitted', 'canceled',  'Cancelado apos envio',  true),

  -- Glosa
  ('claim_denial', 'open',     'appealed',    'Recurso enviado',            false),
  ('claim_denial', 'open',     'written_off', 'Aceita como perda',          true),
  ('claim_denial', 'open',     'expired',     'Prazo de recurso vencido',   false),
  ('claim_denial', 'appealed', 'recovered',   'Convenio pagou',             true),
  ('claim_denial', 'appealed', 'written_off', 'Recurso negado',             true),
  -- Convenio que aceita recurso fora do prazo existe; o estado nao pode ser
  -- uma parede que obriga a corrigir no banco.
  ('claim_denial', 'expired',  'appealed',    'Recurso aceito fora do prazo', false),
  ('claim_denial', 'expired',  'written_off', 'Aceita como perda',          true);

create trigger claim_check_transition
  before update on claim
  for each row execute function assert_state_transition('claim');

create trigger claim_batch_check_transition
  before update on claim_batch
  for each row execute function assert_state_transition('claim_batch');

create trigger claim_denial_check_transition
  before update on claim_denial
  for each row execute function assert_state_transition('claim_denial');

-- ------------------------------------------------------------- auditoria ----
do $$
declare
  t text;
begin
  foreach t in array array['claim_batch', 'claim', 'claim_item', 'claim_denial']
  loop
    execute format(
      'create trigger %I after insert or update or delete on %I
         for each row execute function write_audit_log()',
      t || '_audit', t
    );
  end loop;
end;
$$;

-- ------------------------------------------------------------------- RLS ----
-- Mesma politica do laco de 0014, repetida aqui porque aquele laco ja rodou.
-- `assert_rls_coverage()` quebraria o CI se isto fosse esquecido — e essa e a
-- razao de ele existir.
do $$
declare
  t text;
begin
  foreach t in array array['claim_batch', 'claim']
  loop
    execute format('alter table %I enable row level security', t);
    execute format('alter table %I force row level security', t);
    execute format($f$
      create policy tenant_isolation on %I
        using (
          tenant_id = current_tenant_id()
          and (current_unit_ids() is null or unit_id = any (current_unit_ids()))
        )
        with check (
          tenant_id = current_tenant_id()
          and (current_unit_ids() is null or unit_id = any (current_unit_ids()))
        )
    $f$, t);
    execute format('grant select, insert, update on %I to crm_app', t);
    execute format('grant select on %I to crm_readonly', t);
    execute format('grant select, insert, update, delete on %I to crm_job', t);
  end loop;

  -- Sem unit_id proprio: a unidade vem da guia, e filtrar duas vezes so criaria
  -- uma segunda verdade sobre a mesma linha.
  foreach t in array array['claim_item', 'claim_denial']
  loop
    execute format('alter table %I enable row level security', t);
    execute format('alter table %I force row level security', t);
    execute format($f$
      create policy tenant_isolation on %I
        using (tenant_id = current_tenant_id())
        with check (tenant_id = current_tenant_id())
    $f$, t);
    execute format('grant select, insert, update on %I to crm_app', t);
    execute format('grant select on %I to crm_readonly', t);
    execute format('grant select, insert, update, delete on %I to crm_job', t);
  end loop;
end;
$$;

-- Item de guia AINDA EM EDICAO e composicao de um documento, como quote_item
-- (ver 0022): guia que nao saiu da clinica pode ter linha removida. Depois de
-- enviada, nao — e quem impede e a trigger abaixo, nao o GRANT.
grant delete on claim_item to crm_app;

create or replace function protect_sent_claim_item() returns trigger
language plpgsql
as $$
declare
  v_status claim_status;
begin
  select status into v_status from claim where id = old.claim_id;

  if v_status is not null and v_status <> 'open' then
    raise exception
      'A guia ja saiu da clinica e nao pode ter linha removida. Cancele a guia inteira.'
      using errcode = 'insufficient_privilege';
  end if;

  return old;
end;
$$;

create trigger claim_item_protect_sent
  before delete on claim_item
  for each row execute function protect_sent_claim_item();

-- Glosa ABERTA e nao recorrida e composicao da conferencia, nao fato proprio:
-- ela nasceu de um numero digitado, e corrigir o numero tem que poder corrigi-la
-- (ver a regra de 0022). Depois que alguem recorreu, ou que o prazo venceu, ela
-- passa a registrar algo que aconteceu — e ai nao se apaga mais.
grant delete on claim_denial to crm_app;

create or replace function protect_touched_denial() returns trigger
language plpgsql
as $$
begin
  if old.status <> 'open' or old.appealed_at is not null then
    raise exception
      'Esta glosa ja teve andamento e nao pode ser apagada. Registre o desfecho pelo recurso.'
      using errcode = 'insufficient_privilege';
  end if;

  return old;
end;
$$;

create trigger claim_denial_protect_touched
  before delete on claim_denial
  for each row execute function protect_touched_denial();

-- ------------------------------------------------------------ permissoes ----
insert into permission (key, resource, action, description, is_phi) values
  ('claim.read',    'claim', 'read',    'Ver guias, lotes e glosas', false),
  ('claim.write',   'claim', 'write',   'Emitir e montar guia e lote', false),
  ('claim.submit',  'claim', 'submit',  'Enviar lote ao convenio', false),
  ('claim.settle',  'claim', 'settle',  'Conferir repasse e registrar glosa', false),
  ('claim.appeal',  'claim', 'appeal',  'Recorrer de glosa e dar desfecho', false);

insert into system_role_permission (role_code, permission_key) values
  ('owner',   'claim.read'),
  ('owner',   'claim.write'),
  ('owner',   'claim.submit'),
  ('owner',   'claim.settle'),
  ('owner',   'claim.appeal'),
  ('manager', 'claim.read'),
  ('manager', 'claim.write'),
  ('manager', 'claim.submit'),
  ('manager', 'claim.settle'),
  ('manager', 'claim.appeal'),
  ('finance', 'claim.read'),
  ('finance', 'claim.write'),
  ('finance', 'claim.submit'),
  ('finance', 'claim.settle'),
  ('finance', 'claim.appeal'),
  -- Recepcao emite guia e ve o que falta; nao envia lote nem confere repasse.
  ('reception', 'claim.read'),
  ('reception', 'claim.write'),
  ('professional', 'claim.read');
