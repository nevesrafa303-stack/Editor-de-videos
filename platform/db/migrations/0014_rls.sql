-- =============================================================================
-- 0014 — Isolamento: papeis de banco, grants e Row Level Security.
--
-- Estrategia: BANCO UNICO, SCHEMA COMPARTILHADO, tenant_id em toda tabela de
-- negocio, com RLS obrigatorio.
--
-- Por que nao schema-por-tenant: migration em 2.000 schemas e um evento de
-- manutencao, nao um deploy; e consolidacao gerencial de rede (que e o nosso
-- diferencial) viraria UNION ALL dinamico. Por que nao banco-por-tenant: custo
-- e tempo de provisionamento inviabilizam o self-service de trial.
--
-- O preco dessa escolha e o vazamento entre tenants ser catastrofico — e por
-- isso ele nao pode depender do app lembrar do WHERE. RLS e a rede de baixo.
-- =============================================================================

-- Papel da aplicacao. NAO e dono das tabelas: dono ignora RLS por padrao, e
-- ninguem quer descobrir isso em producao. Alem disso, forcamos RLS tambem
-- para o dono, para migration mal escrita nao virar vazamento.
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'crm_app') then
    create role crm_app nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'crm_job') then
    create role crm_job nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'crm_readonly') then
    create role crm_readonly nologin;
  end if;
end;
$$;

grant usage on schema public to crm_app, crm_job, crm_readonly;

-- --------------------------------------------------------- helpers de RLS ---
create or replace function current_membership_id() returns uuid
language sql
stable
as $$
  select nullif(current_setting('app.membership_id', true), '')::uuid;
$$;

create or replace function current_unit_ids() returns uuid[]
language sql
stable
as $$
  select case
    when coalesce(current_setting('app.unit_ids', true), '') = '' then null
    else string_to_array(current_setting('app.unit_ids', true), ',')::uuid[]
  end;
$$;

comment on function current_unit_ids() is
  'Unidades que a sessao pode ver. NULL = todas as unidades do tenant (dono/gestor).';

-- Restricao de prontuario por politica do tenant. Sai do app e entra no banco
-- porque "profissional so ve o proprio paciente" e promessa contratual, nao
-- preferencia de tela.
create or replace function can_view_patient_chart(p_patient_id uuid) returns boolean
language sql
stable
as $$
  select case
    when current_membership_id() is null then false
    -- Rede que nao restringe: todo mundo com permissao de prontuario ve tudo.
    when not coalesce(
      (select restrict_chart_to_own_patients from tenant_policy
        where tenant_id = current_tenant_id()), false)
      then true
    -- Papel com acesso amplo (coordenacao clinica, auditoria interna).
    when exists (
      select 1
      from membership m
      join role_permission rp on rp.role_id = m.role_id
      where m.id = current_membership_id()
        and rp.permission_key = 'chart.read_all'
    ) then true
    -- Caso restrito: so quem tem vinculo assistencial registrado.
    --
    -- Le APENAS patient_provider_link. Consultar aqui qualquer tabela com a
    -- policy chart_scope causaria recursao (policy -> funcao -> policy).
    else exists (
      select 1 from patient_provider_link l
      where l.patient_id = p_patient_id
        and l.membership_id = current_membership_id()
        and l.relation = 'assistencial'
    )
  end;
$$;

-- --------------------------------------------------- politicas automaticas --
-- Toda tabela com tenant_id ganha a mesma politica base. Fazer isso em laco
-- (e nao a mao, 90 vezes) elimina a chance de esquecer uma tabela nova — que e
-- exatamente como vazamento acontece na vida real.
do $$
declare
  t record;
  has_unit boolean;
begin
  for t in
    select c.relname as table_name
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    join pg_attribute a on a.attrelid = c.oid and a.attname = 'tenant_id' and a.attnum > 0
    where n.nspname = 'public'
      and c.relkind = 'r'
      and not a.attisdropped
    order by 1
  loop
    execute format('alter table %I enable row level security', t.table_name);
    execute format('alter table %I force row level security', t.table_name);

    select exists (
      select 1 from pg_attribute a
      join pg_class c on c.oid = a.attrelid
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relname = t.table_name
        and a.attname = 'unit_id' and a.attnum > 0 and not a.attisdropped
    ) into has_unit;

    if has_unit then
      execute format($f$
        create policy tenant_isolation on %I
          using (
            tenant_id = current_tenant_id()
            and (current_unit_ids() is null or unit_id is null or unit_id = any (current_unit_ids()))
          )
          with check (
            tenant_id = current_tenant_id()
            and (current_unit_ids() is null or unit_id is null or unit_id = any (current_unit_ids()))
          )
      $f$, t.table_name);
    else
      execute format($f$
        create policy tenant_isolation on %I
          using (tenant_id = current_tenant_id())
          with check (tenant_id = current_tenant_id())
      $f$, t.table_name);
    end if;

    execute format('grant select, insert, update on %I to crm_app', t.table_name);
    execute format('grant select on %I to crm_readonly', t.table_name);
    execute format('grant select, insert, update, delete on %I to crm_job', t.table_name);
  end loop;
end;
$$;

-- ------------------------------------------------------ excecoes pontuais ---

-- Tabela tenant: identificada por id, nao por tenant_id.
alter table tenant enable row level security;
alter table tenant force row level security;
create policy tenant_self on tenant
  using (id = current_tenant_id())
  with check (id = current_tenant_id());
grant select, update on tenant to crm_app;
grant select on tenant to crm_readonly;

-- Referencia global: leitura para todos, escrita so por migration/job.
grant select on tooth, body_region, permission, subscription_plan, plan_feature,
                state_transition to crm_app, crm_readonly, crm_job;

-- Identidade global. O usuario enxerga a si mesmo e a quem divide o tenant
-- ativo com ele — nunca a base inteira de usuarios da plataforma.
alter table app_user enable row level security;
alter table app_user force row level security;
create policy app_user_visible on app_user
  using (
    id = current_user_id()
    or exists (
      select 1 from membership m
      where m.user_id = app_user.id
        and m.tenant_id = current_tenant_id()
        and m.deleted_at is null
    )
  )
  with check (id = current_user_id());
grant select, insert, update on app_user to crm_app;

alter table user_session enable row level security;
alter table user_session force row level security;
create policy user_session_own on user_session
  using (user_id = current_user_id())
  with check (user_id = current_user_id());
grant select, insert, update on user_session to crm_app;

-- Logs append-only: o app insere (via trigger security definer) e le, nunca
-- altera. O REVOKE e a garantia real; o trigger de 0001 e o cinto de seguranca.
revoke update, delete on audit_log, phi_access_log from crm_app, crm_job, crm_readonly;
grant select, insert on audit_log, phi_access_log to crm_app;
grant select on audit_log, phi_access_log to crm_readonly;

revoke update, delete on stock_movement from crm_app;
grant select, insert on stock_movement to crm_app;

-- Fila e outbox: o worker precisa de delete para limpeza; o app so escreve.
grant select, insert, update on outbox_message, job, inbound_event to crm_app;
grant select, insert, update, delete on outbox_message, job, inbound_event to crm_job;

grant usage, select on all sequences in schema public to crm_app, crm_job;

-- ------------------------------------------- politicas de dado clinico ------
-- Camada extra sobre o isolamento de tenant: mesmo dentro da clinica certa,
-- prontuario pode ser restrito ao profissional que atende.
do $$
declare
  t text;
begin
  foreach t in array array[
    'clinical_note', 'clinical_document', 'clinical_file', 'form_response',
    'odontogram_entry', 'aesthetic_session', 'injectable_application', 'photo_set'
  ]
  loop
    execute format($f$
      create policy chart_scope on %I
        as restrictive
        using (can_view_patient_chart(patient_id))
        with check (can_view_patient_chart(patient_id))
    $f$, t);
  end loop;
end;
$$;

comment on function can_view_patient_chart(uuid) is
  'Policy restritiva: aplicada em AND com tenant_isolation, nunca substitui.';
