-- =============================================================================
-- 0013 — Automacao, notificacao, sinais de oportunidade e metricas.
--
-- "Alerta preditivo" aqui nao e IA: e um sinal calculado por job com regra
-- explicita e explicavel (por que este paciente apareceu na lista?). A tabela
-- patient_signal guarda o motivo junto com o sinal, porque recepcao que nao
-- entende o alerta ignora o alerta.
-- =============================================================================

create type automation_trigger as enum (
  'appointment_created',
  'appointment_upcoming',        -- N horas antes
  'appointment_no_show',
  'appointment_completed',
  'patient_birthday',
  'patient_inactive',
  'quote_sent',
  'quote_cooling',
  'quote_accepted',
  'installment_due',
  'installment_overdue',
  'lead_created',
  'session_followup_due',
  'orthodontic_maintenance_due',
  'stock_below_minimum',
  'lot_expiring',
  'temperature_breach'
);

create type automation_channel as enum ('whatsapp', 'email', 'sms', 'in_app', 'webhook', 'task');

create table automation_rule (
  id            uuid primary key default uuid_generate_v7(),
  tenant_id     uuid not null references tenant (id) on delete cascade,
  unit_id       uuid references unit (id) on delete cascade,
  name          text not null,
  trigger_event automation_trigger not null,
  channel       automation_channel not null,
  template_id   uuid references message_template (id) on delete set null,
  -- Deslocamento em relacao ao evento. Negativo = antes (confirmacao 24h
  -- antes = -1440); positivo = depois (follow-up 7 dias = 10080).
  offset_minutes int not null default 0,
  -- Filtros adicionais: {"procedure_ids":[...],"min_amount_cents":50000}
  conditions    jsonb not null default '{}'::jsonb,
  -- Janela em que a clinica aceita disparar (nao mandar WhatsApp as 3h).
  send_window_start time not null default '08:00',
  send_window_end   time not null default '20:00',
  send_on_weekend   boolean not null default false,
  -- Teto de disparos por pessoa por dia: antisspam interno.
  max_per_patient_per_day int not null default 2 check (max_per_patient_per_day > 0),
  assignee_id   uuid references membership (id) on delete set null,
  is_active     boolean not null default true,
  created_by    uuid references membership (id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  constraint automation_rule_window check (send_window_end > send_window_start),
  constraint automation_rule_template check (
    channel not in ('whatsapp', 'email', 'sms') or template_id is not null
  )
);

create index automation_rule_trigger_idx on automation_rule (tenant_id, trigger_event)
  where is_active;

create trigger automation_rule_set_updated_at
  before update on automation_rule for each row execute function set_updated_at();

alter table message
  add constraint message_automation_rule_fk
  foreign key (automation_rule_id) references automation_rule (id) on delete set null;

create type automation_run_status as enum ('scheduled', 'sent', 'skipped', 'failed', 'canceled');

-- Uma linha por (regra, entidade alvo). A unique e o que impede a clinica de
-- mandar a mesma confirmacao tres vezes quando o job reprocessa.
create table automation_run (
  id              uuid primary key default uuid_generate_v7(),
  tenant_id       uuid not null references tenant (id) on delete cascade,
  rule_id         uuid not null references automation_rule (id) on delete cascade,
  target_entity   text not null,
  target_id       uuid not null,
  patient_id      uuid references patient (id) on delete set null,
  status          automation_run_status not null default 'scheduled',
  scheduled_for   timestamptz not null,
  executed_at     timestamptz,
  skip_reason     text,
  message_id      uuid references message (id) on delete set null,
  outbox_id       uuid references outbox_message (id) on delete set null,
  error_message   text,
  created_at      timestamptz not null default now(),

  constraint automation_run_uk unique (rule_id, target_entity, target_id)
);

create index automation_run_due_idx on automation_run (scheduled_for)
  where status = 'scheduled';
create index automation_run_patient_idx on automation_run (tenant_id, patient_id, created_at desc);

-- ----------------------------------------------------------- notificacao ----
create type notification_kind as enum
  ('info', 'warning', 'critical', 'task', 'mention', 'financial', 'clinical');

create table notification (
  id           uuid primary key default uuid_generate_v7(),
  tenant_id    uuid not null references tenant (id) on delete cascade,
  unit_id      uuid references unit (id) on delete cascade,
  membership_id uuid references membership (id) on delete cascade,
  -- Sem destinatario = notificacao de unidade (toda a recepcao ve).
  role_id      uuid references role (id) on delete cascade,
  kind         notification_kind not null default 'info',
  title        text not null,
  body         text,
  entity       text,
  entity_id    uuid,
  action_url   text,
  read_at      timestamptz,
  dismissed_at timestamptz,
  created_at   timestamptz not null default now(),

  constraint notification_target check (membership_id is not null or role_id is not null)
);

create index notification_inbox_idx on notification (tenant_id, membership_id, created_at desc)
  where read_at is null and dismissed_at is null;

create table notification_preference (
  membership_id uuid not null references membership (id) on delete cascade,
  kind          notification_kind not null,
  in_app        boolean not null default true,
  email         boolean not null default false,
  whatsapp      boolean not null default false,
  push          boolean not null default false,
  primary key (membership_id, kind)
);

-- ------------------------------------------------ sinais de oportunidade ----
create type patient_signal_kind as enum (
  'pending_treatment',       -- item de plano planejado e nao executado
  'open_quote',              -- orcamento enviado sem resposta
  'cooling_quote',           -- orcamento esfriando
  'overdue_return',          -- retorno recomendado vencido
  'inactive_patient',        -- sem vir ha X meses
  'no_show_risk',            -- risco alto de faltar
  'overdue_installment',     -- parcela vencida
  'birthday',
  'followup_due',            -- retorno pos-procedimento HOF
  'maintenance_due'          -- manutencao ortodontica
);

-- Recalculada por job. severity e value_cents permitem ordenar a lista de
-- oportunidades por quanto dinheiro ela representa, nao por ordem alfabetica.
create table patient_signal (
  id          uuid primary key default uuid_generate_v7(),
  tenant_id   uuid not null references tenant (id) on delete cascade,
  unit_id     uuid references unit (id) on delete set null,
  patient_id  uuid not null references patient (id) on delete cascade,
  kind        patient_signal_kind not null,
  severity    int not null default 1 check (severity between 1 and 5),
  value_cents bigint not null default 0 check (value_cents >= 0),
  -- Por que o paciente entrou nesta lista, em texto que a recepcao entende.
  reason      text not null,
  entity      text,
  entity_id   uuid,
  due_on      date,
  assigned_to uuid references membership (id) on delete set null,
  resolved_at timestamptz,
  resolution  text check (resolution in ('converted', 'dismissed', 'contacted', 'expired')),
  computed_at timestamptz not null default now(),

  constraint patient_signal_uk unique nulls not distinct (patient_id, kind, entity_id)
);

create index patient_signal_open_idx
  on patient_signal (tenant_id, unit_id, severity desc, value_cents desc)
  where resolved_at is null;
create index patient_signal_patient_idx on patient_signal (tenant_id, patient_id)
  where resolved_at is null;

-- ------------------------------------------------------------- metricas -----
-- Snapshot diario por unidade. Existe para o painel gerencial de rede nao
-- varrer milhoes de linhas a cada abertura, e para o historico nao mudar
-- retroativamente quando alguem corrige um lancamento antigo.
create table metric_snapshot (
  id             uuid primary key default uuid_generate_v7(),
  tenant_id      uuid not null references tenant (id) on delete cascade,
  unit_id        uuid references unit (id) on delete cascade,
  reference_date date not null,
  granularity    text not null default 'day' check (granularity in ('day', 'week', 'month')),

  appointments_total     int not null default 0,
  appointments_completed int not null default 0,
  appointments_no_show   int not null default 0,
  appointments_canceled  int not null default 0,
  occupancy_percent      numeric(5, 2),

  leads_created      int not null default 0,
  opportunities_won  int not null default 0,
  opportunities_lost int not null default 0,

  quotes_sent_cents     bigint not null default 0,
  quotes_accepted_cents bigint not null default 0,

  revenue_billed_cents   bigint not null default 0,
  revenue_received_cents bigint not null default 0,
  overdue_cents          bigint not null default 0,
  -- Custo de insumo consumido: o que transforma faturamento em margem.
  cogs_cents             bigint not null default 0,
  commission_cents       bigint not null default 0,

  new_patients    int not null default 0,
  active_patients int not null default 0,

  computed_at timestamptz not null default now(),

  constraint metric_snapshot_uk unique nulls not distinct (tenant_id, unit_id, reference_date, granularity)
);

create index metric_snapshot_period_idx
  on metric_snapshot (tenant_id, reference_date desc);

-- Exportacao de relatorio pedida pelo usuario (estoque, financeiro, producao).
create table report_export (
  id           uuid primary key default uuid_generate_v7(),
  tenant_id    uuid not null references tenant (id) on delete cascade,
  requested_by uuid references membership (id) on delete set null,
  report_code  text not null,
  format       text not null check (format in ('csv', 'xlsx', 'pdf')),
  filters      jsonb not null default '{}'::jsonb,
  status       text not null default 'queued'
               check (status in ('queued', 'processing', 'ready', 'failed', 'expired')),
  storage_key  text,
  row_count    int,
  error_message text,
  requested_at timestamptz not null default now(),
  completed_at timestamptz,
  expires_at   timestamptz
);

create index report_export_user_idx on report_export (tenant_id, requested_by, requested_at desc);
