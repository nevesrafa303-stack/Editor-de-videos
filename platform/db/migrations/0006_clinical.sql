-- =============================================================================
-- 0006 — Prontuario: formulario dinamico versionado, evolucao, receituario,
-- atestado, documento assinado e exame.
--
-- Regra que atravessa o dominio: registro clinico NAO se apaga nem se reescreve.
-- Correcao vira aditamento encadeado. E exigencia de conselho e a unica forma
-- de o prontuario valer alguma coisa numa auditoria ou num processo.
-- =============================================================================

create type form_kind as enum (
  'anamnesis',        -- ficha de saude geral
  'anamnesis_hof',    -- anamnese especifica de estetica injetavel
  'evaluation',       -- avaliacao clinica
  'protocol',         -- protocolo de sessao
  'satisfaction',     -- NPS pos-atendimento
  'custom'
);

-- Formulario versionado. Mudar a pergunta cria versao nova; ficha antiga
-- continua legivel exatamente como foi respondida.
create table form_template (
  id          uuid primary key default uuid_generate_v7(),
  tenant_id   uuid not null references tenant (id) on delete cascade,
  kind        form_kind not null,
  code        text not null,
  name        text not null,
  version     int not null default 1 check (version > 0),
  -- Definicao dos campos: [{key,label,type,required,options,alert_if}]
  schema      jsonb not null,
  is_active   boolean not null default true,
  published_at timestamptz,
  created_by  uuid references membership (id) on delete set null,
  created_at  timestamptz not null default now(),

  constraint form_template_version_uk unique (tenant_id, code, version)
);

create index form_template_active_idx on form_template (tenant_id, kind) where is_active;

create table form_response (
  id                uuid primary key default uuid_generate_v7(),
  tenant_id         uuid not null references tenant (id) on delete cascade,
  patient_id        uuid not null references patient (id) on delete restrict,
  form_template_id  uuid not null references form_template (id) on delete restrict,
  appointment_id    uuid references appointment (id) on delete set null,
  answers           jsonb not null default '{}'::jsonb,
  -- Alertas derivados das respostas (alergia, anticoagulante, gestante).
  -- Materializados na resposta para o alerta nao depender de reinterpretar
  -- o schema de uma versao antiga.
  alerts            text[] not null default '{}',
  filled_by         uuid references membership (id) on delete set null,
  -- Quando o proprio paciente respondeu pelo link de pre-atendimento.
  filled_by_patient boolean not null default false,
  signed_at         timestamptz,
  signature_hash    text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index form_response_patient_idx
  on form_response (tenant_id, patient_id, created_at desc);
create index form_response_alerts_idx on form_response using gin (alerts);

create trigger form_response_set_updated_at
  before update on form_response for each row execute function set_updated_at();

-- ---------------------------------------------------------------- evolucao --
create table clinical_note (
  id             uuid primary key default uuid_generate_v7(),
  tenant_id      uuid not null references tenant (id) on delete restrict,
  unit_id        uuid references unit (id) on delete set null,
  patient_id     uuid not null references patient (id) on delete restrict,
  appointment_id uuid references appointment (id) on delete set null,
  provider_id    uuid not null references membership (id) on delete restrict,
  content        text not null,
  -- Aditamento: aponta para a nota que corrige. A original permanece.
  amends_note_id uuid references clinical_note (id) on delete restrict,
  amendment_reason text,
  -- Assinatura eletronica simples: hash do conteudo + evidencia.
  signed_at      timestamptz,
  signature_hash text,
  signature_ip   inet,
  locked_at      timestamptz,
  created_at     timestamptz not null default now(),

  constraint clinical_note_amendment_reason check (
    amends_note_id is null or amendment_reason is not null
  )
);

create index clinical_note_patient_idx
  on clinical_note (tenant_id, patient_id, created_at desc);
create index clinical_note_appointment_idx on clinical_note (appointment_id);

-- Janela curta para corrigir erro de digitacao; depois disso, so aditamento.
create or replace function protect_clinical_note() returns trigger
language plpgsql
as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'Evolucao clinica nao pode ser apagada. Registre um aditamento.'
      using errcode = 'insufficient_privilege';
  end if;

  if old.locked_at is not null or old.created_at < now() - interval '30 minutes' then
    if new.content is distinct from old.content then
      raise exception 'Evolucao fechada nao pode ser reescrita. Crie um aditamento (amends_note_id).'
        using errcode = 'insufficient_privilege';
    end if;
  end if;

  return new;
end;
$$;

create trigger clinical_note_protect
  before update or delete on clinical_note
  for each row execute function protect_clinical_note();

-- ------------------------------------------------------------- documentos ---
create type clinical_document_kind as enum (
  'prescription',        -- receituario
  'certificate',         -- atestado
  'referral_letter',     -- encaminhamento
  'consent_term',        -- TCLE assinado
  'treatment_report',    -- relatorio para convenio
  'other'
);

create type document_status as enum ('draft', 'issued', 'signed', 'delivered', 'canceled');

create table clinical_document (
  id             uuid primary key default uuid_generate_v7(),
  tenant_id      uuid not null references tenant (id) on delete restrict,
  unit_id        uuid references unit (id) on delete set null,
  patient_id     uuid not null references patient (id) on delete restrict,
  provider_id    uuid not null references membership (id) on delete restrict,
  appointment_id uuid references appointment (id) on delete set null,
  kind           clinical_document_kind not null,
  status         document_status not null default 'draft',
  title          text not null,
  body           text not null,
  -- Numero sequencial por tenant e tipo, para o documento ser citavel.
  number         bigint,
  file_url       text,
  content_hash   text,
  signed_at      timestamptz,
  signed_by      uuid references membership (id) on delete set null,
  signature_evidence jsonb,
  canceled_at    timestamptz,
  cancel_reason  text,
  delivered_at   timestamptz,
  delivery_channel text check (delivery_channel in ('whatsapp', 'email', 'print', 'portal')),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),

  constraint clinical_document_number_uk unique nulls not distinct (tenant_id, kind, number),
  constraint clinical_document_signed check (
    status not in ('signed', 'delivered') or (signed_at is not null and content_hash is not null)
  ),
  constraint clinical_document_cancel check (status <> 'canceled' or cancel_reason is not null)
);

create index clinical_document_patient_idx
  on clinical_document (tenant_id, patient_id, created_at desc);

create trigger clinical_document_set_updated_at
  before update on clinical_document for each row execute function set_updated_at();

-- Itens da receita: separados do corpo para permitir alerta de interacao e
-- relatorio de medicamento mais prescrito.
create table prescription_item (
  id            uuid primary key default uuid_generate_v7(),
  tenant_id     uuid not null references tenant (id) on delete cascade,
  document_id   uuid not null references clinical_document (id) on delete cascade,
  drug_name     text not null,
  presentation  text,
  dosage        text not null,
  route         text,
  frequency     text,
  duration      text,
  quantity      text,
  instructions  text,
  is_controlled boolean not null default false,
  sort_order    int not null default 0
);

create index prescription_item_document_idx on prescription_item (document_id);

-- ------------------------------------------------------------------ exame ---
create type clinical_file_kind as enum (
  'radiograph', 'photo_clinical', 'photo_before', 'photo_after',
  'exam_report', 'scan_3d', 'document', 'other'
);

create table clinical_file (
  id             uuid primary key default uuid_generate_v7(),
  tenant_id      uuid not null references tenant (id) on delete restrict,
  patient_id     uuid not null references patient (id) on delete restrict,
  appointment_id uuid references appointment (id) on delete set null,
  aesthetic_session_id uuid,                        -- FK adicionada em 0008
  kind           clinical_file_kind not null,
  -- Guardamos a CHAVE no storage privado, nunca URL publica. O acesso e por
  -- URL assinada de curta duracao, registrada em phi_access_log.
  storage_key    text not null,
  file_name      text not null,
  mime_type      text not null,
  size_bytes     bigint check (size_bytes >= 0),
  checksum_sha256 text,
  caption        text,
  taken_at       timestamptz not null default now(),
  -- Metadados de foto padronizada (angulo, distancia) para comparar antes/depois.
  capture_metadata jsonb,
  uploaded_by    uuid references membership (id) on delete set null,
  created_at     timestamptz not null default now(),
  deleted_at     timestamptz
);

create index clinical_file_patient_idx
  on clinical_file (tenant_id, patient_id, taken_at desc) where deleted_at is null;
create index clinical_file_kind_idx on clinical_file (tenant_id, kind);
