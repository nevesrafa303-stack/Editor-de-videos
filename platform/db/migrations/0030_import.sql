-- =============================================================================
-- 0030 — Importador de planilha: a migracao de quem troca de sistema.
--
-- Escopo decidido em docs/decisoes-produto.md (18): CSV de pacientes — nome,
-- telefone, CPF, nascimento — e, se houver, saldo em aberto. Prontuario e
-- historico financeiro de outro software ficam de fora, de proposito: importar
-- registro clinico de origem desconhecida como se fosse registro proprio e
-- assinar um documento que ninguem escreveu.
--
-- TRES DECISOES QUE ESTE MODELO TOMA:
--
-- 1. A IMPORTACAO E UM FATO, nao uma operacao. Fica guardada linha a linha, com
--    o que veio no arquivo e o que aconteceu com cada uma. Sem isso, "por que
--    esta paciente esta com o telefone errado?" nao tem resposta tres meses
--    depois — e importacao e exatamente de onde vem dado errado em massa.
--
-- 2. DOIS PASSOS, SEMPRE. Analisar e aplicar sao coisas separadas: quem importa
--    2.000 pacientes precisa VER quantos vao entrar, quantos ja existem e
--    quantos tem erro antes de confirmar. Importacao nao tem desfazer.
--
-- 3. DUPLICADO NUNCA SOBRESCREVE. Linha que casa com paciente existente e
--    PULADA, com o nome de quem ja esta la. Atualizar em massa um cadastro que
--    a clinica ja editou e destruir trabalho sem pedir licenca — e a planilha
--    velha quase sempre e a fonte pior.
-- =============================================================================

create type import_kind as enum ('patient');
create type import_status as enum ('analyzing', 'ready', 'applied', 'canceled');

create table import_job (
  id             uuid primary key default uuid_generate_v7(),
  tenant_id      uuid not null references tenant (id) on delete cascade,
  unit_id        uuid not null references unit (id) on delete restrict,
  kind           import_kind not null default 'patient',
  status         import_status not null default 'analyzing',
  filename       text,
  -- Contagens do que a analise encontrou. Colunas, e nao consulta, porque a
  -- tela de confirmacao e a de historico leem isto o tempo todo — e depois de
  -- aplicado o numero nao muda mais.
  total_rows     int not null default 0 check (total_rows >= 0),
  valid_rows     int not null default 0 check (valid_rows >= 0),
  duplicate_rows int not null default 0 check (duplicate_rows >= 0),
  error_rows     int not null default 0 check (error_rows >= 0),
  imported_rows  int not null default 0 check (imported_rows >= 0),
  created_by     uuid references membership (id) on delete set null,
  created_at     timestamptz not null default now(),
  applied_at     timestamptz,
  updated_at     timestamptz not null default now(),

  constraint import_job_applied check ((status = 'applied') = (applied_at is not null))
);

create index import_job_recent_idx on import_job (tenant_id, created_at desc);

create trigger import_job_set_updated_at
  before update on import_job for each row execute function set_updated_at();

comment on table import_job is
  'Uma importacao de planilha. Guardada como fato: quem trouxe o que, quando, e o que entrou.';

create type import_row_status as enum ('valid', 'duplicate', 'error', 'imported');

create table import_row (
  id            uuid primary key default uuid_generate_v7(),
  tenant_id     uuid not null references tenant (id) on delete cascade,
  job_id        uuid not null references import_job (id) on delete cascade,
  line_number   int not null check (line_number > 0),
  -- O que veio no arquivo, como veio. E a unica forma de responder depois
  -- "o sistema leu errado ou a planilha estava errada?".
  raw           jsonb not null,
  status        import_row_status not null,
  message       text,
  patient_id    uuid references patient (id) on delete set null,
  created_at    timestamptz not null default now(),

  constraint import_row_line_uk unique (job_id, line_number),
  constraint import_row_imported check ((status = 'imported') = (patient_id is not null))
);

create index import_row_job_idx on import_row (tenant_id, job_id, line_number);

comment on table import_row is
  'Uma linha da planilha, com o que veio e o que aconteceu com ela.';

-- ------------------------------------------------------- maquina de estado --
insert into state_transition (entity, from_state, to_state, label, is_terminal) values
  ('import_job', 'analyzing', 'ready',    'Analise concluida', false),
  ('import_job', 'analyzing', 'canceled', 'Descartada',        true),
  ('import_job', 'ready',     'applied',  'Importada',         true),
  ('import_job', 'ready',     'canceled', 'Descartada',        true);

create trigger import_job_assert_transition
  before update of status on import_job
  for each row execute function assert_state_transition('import_job');

-- ------------------------------------------------------------- auditoria ----
-- A planilha traz nome, telefone, CPF e nascimento de gente que nunca pisou na
-- clinica ainda: dado pessoal sob LGPD, e em volume. Quem trouxe fica no log.
create trigger import_job_audit
  after insert or update or delete on import_job
  for each row execute function write_audit_log();

-- ------------------------------------------------------------------- RLS ----
do $$
declare
  t text;
begin
  execute 'alter table import_job enable row level security';
  execute 'alter table import_job force row level security';
  execute $f$
    create policy tenant_isolation on import_job
      using (
        tenant_id = current_tenant_id()
        and (current_unit_ids() is null or unit_id = any (current_unit_ids()))
      )
      with check (
        tenant_id = current_tenant_id()
        and (current_unit_ids() is null or unit_id = any (current_unit_ids()))
      )
  $f$;

  execute 'alter table import_row enable row level security';
  execute 'alter table import_row force row level security';
  execute $f$
    create policy tenant_isolation on import_row
      using (tenant_id = current_tenant_id())
      with check (tenant_id = current_tenant_id())
  $f$;

  foreach t in array array['import_job', 'import_row']
  loop
    execute format('grant select, insert, update on %I to crm_app', t);
    execute format('grant select on %I to crm_readonly', t);
    execute format('grant select, insert, update, delete on %I to crm_job', t);
  end loop;
end;
$$;

-- ------------------------------------------------------------ permissoes ----
insert into permission (key, resource, action, description, is_phi) values
  ('import.read',  'import', 'read',  'Ver importacoes feitas', false),
  ('import.write', 'import', 'write', 'Importar planilha de pacientes', false);

-- Importacao mexe no cadastro em massa e traz dado pessoal em volume: fica com
-- quem responde pela rede, nao com quem atende o balcao.
insert into system_role_permission (role_code, permission_key) values
  ('owner',   'import.read'),
  ('owner',   'import.write'),
  ('manager', 'import.read'),
  ('manager', 'import.write');

do $$
declare
  t uuid;
begin
  for t in select id from tenant loop
    perform bootstrap_tenant_roles(t);
  end loop;
end;
$$;
