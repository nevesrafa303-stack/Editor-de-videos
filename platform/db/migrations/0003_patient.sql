-- =============================================================================
-- 0003 — Paciente, consentimento (LGPD) e indicacao.
--
-- O paciente pertence a REDE (tenant), nao a unidade: quem faz botox na unidade
-- A e canal na unidade B e uma pessoa so, com um prontuario so. unit_id aqui e
-- so a unidade de origem, para relatorio.
-- =============================================================================

create table acquisition_source (
  id         uuid primary key default uuid_generate_v7(),
  tenant_id  uuid not null references tenant (id) on delete cascade,
  code       text not null,
  name       text not null,
  -- Agrupador para o relatorio de aquisicao (organico, pago, indicacao...).
  channel    text not null default 'outro'
             check (channel in ('organico', 'pago', 'indicacao', 'parceria', 'recorrencia', 'outro')),
  is_active  boolean not null default true,
  sort_order int not null default 0,

  constraint acquisition_source_code_uk unique (tenant_id, code)
);

create type patient_status as enum ('active', 'inactive', 'archived', 'anonymized');

create table patient (
  id               uuid primary key default uuid_generate_v7(),
  tenant_id        uuid not null references tenant (id) on delete restrict,
  origin_unit_id   uuid references unit (id) on delete set null,
  code             bigint not null,                 -- numero legivel por rede
  full_name        text not null,
  preferred_name   text,
  tax_id           text,                            -- CPF, so digitos
  national_id      text,                            -- RG
  birth_date       date,
  gender           text check (gender in ('feminino', 'masculino', 'outro', 'nao_informado')),
  phone            text not null,
  email            citext,
  photo_url        text,
  source_id        uuid references acquisition_source (id) on delete set null,
  status           patient_status not null default 'active',
  notes            text,

  zip_code   text,
  street     text,
  number     text,
  complement text,
  district   text,
  city       text,
  state_code char(2),

  -- Denormalizacoes mantidas por job noturno. Existem para o painel e os
  -- alertas preditivos nao varrerem a base inteira a cada abertura de tela.
  first_visit_at      timestamptz,
  last_visit_at       timestamptz,
  next_appointment_at timestamptz,
  no_show_count       int not null default 0 check (no_show_count >= 0),
  visit_count         int not null default 0 check (visit_count >= 0),
  no_show_risk        numeric(4, 3) check (no_show_risk between 0 and 1),
  lifetime_value_cents bigint not null default 0 check (lifetime_value_cents >= 0),
  open_balance_cents   bigint not null default 0,

  anonymized_at timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz,

  constraint patient_code_uk   unique (tenant_id, code),
  constraint patient_tax_digits check (tax_id is null or tax_id ~ '^[0-9]{11}$'),
  constraint patient_birth_sane check (birth_date is null or birth_date > '1900-01-01'),
  constraint patient_anonymized_consistent check (
    (status = 'anonymized') = (anonymized_at is not null)
  )
);

-- CPF unico por rede, ignorando excluidos e anonimizados.
create unique index patient_tax_id_uk
  on patient (tenant_id, tax_id)
  where tax_id is not null and deleted_at is null and anonymized_at is null;

create index patient_name_trgm_idx on patient using gin (full_name gin_trgm_ops);
create index patient_phone_idx     on patient (tenant_id, phone) where deleted_at is null;
create index patient_status_idx    on patient (tenant_id, status) where deleted_at is null;
-- Aniversariantes: indice funcional por mes/dia resolve "quem faz aniversario hoje".
create index patient_birthday_idx
  on patient (tenant_id, (extract(month from birth_date)), (extract(day from birth_date)))
  where birth_date is not null and deleted_at is null;
create index patient_inactive_idx on patient (tenant_id, last_visit_at) where deleted_at is null;

create trigger patient_set_updated_at
  before update on patient for each row execute function set_updated_at();

create sequence patient_code_seq;

-- Numero sequencial por rede.
create or replace function assign_patient_code() returns trigger
language plpgsql
as $$
begin
  if new.code is null then
    select coalesce(max(code), 0) + 1 into new.code
    from patient where tenant_id = new.tenant_id;
  end if;
  return new;
end;
$$;

create trigger patient_assign_code
  before insert on patient for each row execute function assign_patient_code();

-- Contatos adicionais (celular do filho, telefone do trabalho, e-mail da NF).
create table patient_contact (
  id          uuid primary key default uuid_generate_v7(),
  tenant_id   uuid not null references tenant (id) on delete cascade,
  patient_id  uuid not null references patient (id) on delete cascade,
  kind        text not null check (kind in ('phone', 'email', 'whatsapp', 'instagram')),
  value       text not null,
  label       text,
  is_primary  boolean not null default false,
  opted_out_at timestamptz,                        -- descadastro de marketing
  created_at  timestamptz not null default now()
);

create index patient_contact_patient_idx on patient_contact (tenant_id, patient_id);
create unique index patient_contact_primary_uk
  on patient_contact (patient_id, kind) where is_primary;

-- Responsavel legal: obrigatorio para menor de 18, e quem assina consentimento.
create table patient_responsible (
  id             uuid primary key default uuid_generate_v7(),
  tenant_id      uuid not null references tenant (id) on delete cascade,
  patient_id     uuid not null references patient (id) on delete cascade,
  full_name      text not null,
  tax_id         text,
  relationship   text not null,
  phone          text,
  email          citext,
  is_financial   boolean not null default true,     -- responde pelo pagamento
  is_legal       boolean not null default true,     -- assina termo
  created_at     timestamptz not null default now(),

  constraint patient_responsible_tax_digits check (tax_id is null or tax_id ~ '^[0-9]{11}$')
);

create index patient_responsible_patient_idx on patient_responsible (tenant_id, patient_id);

create table tag (
  id        uuid primary key default uuid_generate_v7(),
  tenant_id uuid not null references tenant (id) on delete cascade,
  name      text not null,
  color     text not null default '#64748b' check (color ~ '^#[0-9a-fA-F]{6}$'),
  kind      text not null default 'patient' check (kind in ('patient', 'lead', 'both')),

  constraint tag_name_uk unique (tenant_id, name)
);

create table patient_tag (
  tenant_id  uuid not null references tenant (id) on delete cascade,
  patient_id uuid not null references patient (id) on delete cascade,
  tag_id     uuid not null references tag (id) on delete cascade,
  tagged_at  timestamptz not null default now(),
  tagged_by  uuid references app_user (id) on delete set null,
  primary key (patient_id, tag_id)
);

-- ---------------------------------------------------- vinculo assistencial --
-- Quem cuida deste paciente. Alimentada por trigger quando nasce agendamento,
-- evolucao, sessao ou plano.
--
-- Existe por dois motivos. O primeiro e responder rapido "este profissional
-- pode abrir este prontuario?" quando a rede usa a politica restritiva. O
-- segundo e evitar recursao: a policy de prontuario chama uma funcao, e essa
-- funcao NAO pode consultar as tabelas que a propria policy protege. Esta
-- tabela e o unico lugar que a funcao le, e ela carrega apenas a policy de
-- tenant.
create table patient_provider_link (
  tenant_id     uuid not null references tenant (id) on delete cascade,
  patient_id    uuid not null references patient (id) on delete cascade,
  membership_id uuid not null references membership (id) on delete cascade,
  relation      text not null default 'assistencial'
                check (relation in ('assistencial', 'comercial', 'administrativo')),
  first_at      timestamptz not null default now(),
  last_at       timestamptz not null default now(),

  primary key (patient_id, membership_id)
);

create index patient_provider_link_member_idx
  on patient_provider_link (tenant_id, membership_id, last_at desc);

-- ------------------------------------------------------------------ LGPD ----
-- Termo versionado. Alterar o texto cria uma VERSAO NOVA; consentimento antigo
-- continua apontando para a versao que a pessoa realmente leu e assinou.
create type consent_kind as enum (
  'tratamento_dados',     -- base legal para tratar dado pessoal e de saude
  'uso_imagem',           -- foto antes/depois em material da clinica
  'procedimento',         -- TCLE especifico do procedimento
  'comunicacao_marketing',
  'compartilhamento_terceiros'
);

create table consent_document (
  id             uuid primary key default uuid_generate_v7(),
  tenant_id      uuid not null references tenant (id) on delete cascade,
  kind           consent_kind not null,
  version        int not null check (version > 0),
  title          text not null,
  body           text not null,
  body_hash      text not null,
  -- Base legal LGPD art. 7/11 que esse termo sustenta.
  legal_basis    text not null check (legal_basis in (
                   'consentimento', 'tutela_da_saude', 'execucao_contrato',
                   'obrigacao_legal', 'legitimo_interesse'
                 )),
  requires_signature boolean not null default true,
  effective_from timestamptz not null default now(),
  effective_to   timestamptz,
  created_by     uuid references app_user (id) on delete set null,
  created_at     timestamptz not null default now(),

  constraint consent_document_version_uk unique (tenant_id, kind, version),
  constraint consent_document_period check (effective_to is null or effective_to > effective_from)
);

create table patient_consent (
  id                  uuid primary key default uuid_generate_v7(),
  tenant_id           uuid not null references tenant (id) on delete cascade,
  patient_id          uuid not null references patient (id) on delete cascade,
  consent_document_id uuid not null references consent_document (id) on delete restrict,
  -- Quem assinou: o proprio paciente ou o responsavel legal.
  signed_by_responsible_id uuid references patient_responsible (id) on delete set null,
  granted_at          timestamptz not null default now(),
  revoked_at          timestamptz,
  revoked_reason      text,
  -- Evidencia da assinatura eletronica simples.
  signature_image_url text,
  signed_hash         text,
  ip_address          inet,
  user_agent          text,
  device_fingerprint  text,
  collected_by        uuid references app_user (id) on delete set null,

  constraint patient_consent_revocation check (revoked_at is null or revoked_at >= granted_at)
);

create index patient_consent_patient_idx on patient_consent (tenant_id, patient_id);
-- Consulta quente: "este paciente tem consentimento de imagem vigente?"
create index patient_consent_active_idx
  on patient_consent (patient_id, consent_document_id)
  where revoked_at is null;

-- Responde "posso usar foto deste paciente?" sem espalhar a regra pelo app.
create or replace function has_active_consent(p_patient_id uuid, p_kind consent_kind)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from patient_consent pc
    join consent_document cd on cd.id = pc.consent_document_id
    where pc.patient_id = p_patient_id
      and cd.kind = p_kind
      and pc.revoked_at is null
      and cd.effective_from <= now()
      and (cd.effective_to is null or cd.effective_to > now())
  );
$$;

-- Pedido do titular: exportacao ou anonimizacao (LGPD art. 18).
create type data_request_kind as enum ('export', 'anonymize', 'delete', 'rectify');
create type data_request_status as enum ('received', 'in_progress', 'completed', 'rejected');

create table patient_data_request (
  id            uuid primary key default uuid_generate_v7(),
  tenant_id     uuid not null references tenant (id) on delete cascade,
  patient_id    uuid not null references patient (id) on delete restrict,
  kind          data_request_kind not null,
  status        data_request_status not null default 'received',
  requested_at  timestamptz not null default now(),
  -- Prazo legal de resposta ao titular.
  due_at        timestamptz not null default now() + interval '15 days',
  completed_at  timestamptz,
  rejection_reason text,
  export_file_url  text,
  handled_by    uuid references app_user (id) on delete set null,
  notes         text
);

create index patient_data_request_open_idx
  on patient_data_request (tenant_id, due_at)
  where status in ('received', 'in_progress');

-- ------------------------------------------------------------- indicacao ----
-- Programa de indicacoes: quem indicou quem, e o que ganha por isso.
create type referral_status as enum ('registered', 'contacted', 'scheduled', 'converted', 'lost', 'rewarded');

create table referral_program (
  id             uuid primary key default uuid_generate_v7(),
  tenant_id      uuid not null references tenant (id) on delete cascade,
  name           text not null,
  reward_kind    text not null check (reward_kind in ('credit', 'discount_percent', 'gift', 'none')),
  reward_value   bigint not null default 0 check (reward_value >= 0),
  -- Em que momento a recompensa e liberada.
  trigger_event  text not null default 'first_paid_visit'
                 check (trigger_event in ('registration', 'first_visit', 'first_paid_visit', 'quote_closed')),
  min_ticket_cents bigint not null default 0 check (min_ticket_cents >= 0),
  starts_on      date,
  ends_on        date,
  is_active      boolean not null default true,
  created_at     timestamptz not null default now(),

  constraint referral_program_period check (ends_on is null or starts_on is null or ends_on >= starts_on)
);

create table referral (
  id                  uuid primary key default uuid_generate_v7(),
  tenant_id           uuid not null references tenant (id) on delete cascade,
  program_id          uuid references referral_program (id) on delete set null,
  referrer_patient_id uuid references patient (id) on delete set null,
  referrer_name       text,                          -- indicacao de nao-paciente
  referred_patient_id uuid references patient (id) on delete set null,
  referred_lead_id    uuid,                          -- FK adicionada em 0004
  status              referral_status not null default 'registered',
  converted_at        timestamptz,
  reward_granted_at   timestamptz,
  reward_amount_cents bigint not null default 0 check (reward_amount_cents >= 0),
  reward_credit_id    uuid,                          -- FK adicionada em 0011
  notes               text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),

  constraint referral_has_referrer check (referrer_patient_id is not null or referrer_name is not null),
  constraint referral_reward_after_conversion check (
    reward_granted_at is null or converted_at is not null
  )
);

create index referral_referrer_idx on referral (tenant_id, referrer_patient_id);
create index referral_status_idx   on referral (tenant_id, status);

create trigger referral_set_updated_at
  before update on referral for each row execute function set_updated_at();
