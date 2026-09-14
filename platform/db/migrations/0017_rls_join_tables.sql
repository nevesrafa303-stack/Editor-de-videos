-- =============================================================================
-- 0017 — RLS nas tabelas de juncao.
--
-- Elas nao tem tenant_id proprio, entao ficaram de fora do laco de 0014. Isso e
-- um buraco de verdade: sem policy, nada no banco impede ligar um membro da
-- rede A a uma unidade da rede B, ou dar a um papel da rede A uma permissao
-- criada na rede B.
--
-- A politica aqui e derivada do pai, e o WITH CHECK confere OS DOIS LADOS —
-- porque o risco nao e so ler o que nao e seu, e escrever ligando o que nao
-- deveria se ligar.
-- =============================================================================

-- membership_unit ------------------------------------------------------------
alter table membership_unit enable row level security;
alter table membership_unit force row level security;

create policy tenant_isolation on membership_unit
  using (
    exists (
      select 1 from membership m
      where m.id = membership_unit.membership_id
        and m.tenant_id = current_tenant_id()
    )
  )
  with check (
    exists (
      select 1 from membership m
      where m.id = membership_unit.membership_id
        and m.tenant_id = current_tenant_id()
    )
    and exists (
      select 1 from unit u
      where u.id = membership_unit.unit_id
        and u.tenant_id = current_tenant_id()
    )
  );

-- invitation_unit ------------------------------------------------------------
alter table invitation_unit enable row level security;
alter table invitation_unit force row level security;

create policy tenant_isolation on invitation_unit
  using (
    exists (
      select 1 from invitation i
      where i.id = invitation_unit.invitation_id
        and i.tenant_id = current_tenant_id()
    )
  )
  with check (
    exists (
      select 1 from invitation i
      where i.id = invitation_unit.invitation_id
        and i.tenant_id = current_tenant_id()
    )
    and exists (
      select 1 from unit u
      where u.id = invitation_unit.unit_id
        and u.tenant_id = current_tenant_id()
    )
  );

-- role_permission ------------------------------------------------------------
alter table role_permission enable row level security;
alter table role_permission force row level security;

create policy tenant_isolation on role_permission
  using (
    exists (
      select 1 from role r
      where r.id = role_permission.role_id
        and r.tenant_id = current_tenant_id()
    )
  )
  with check (
    exists (
      select 1 from role r
      where r.id = role_permission.role_id
        and r.tenant_id = current_tenant_id()
    )
  );

-- notification_preference ----------------------------------------------------
-- Preferencia e pessoal: so o proprio dono le e escreve.
alter table notification_preference enable row level security;
alter table notification_preference force row level security;

create policy own_preferences on notification_preference
  using (membership_id = current_membership_id())
  with check (membership_id = current_membership_id());

-- photo_set_file -------------------------------------------------------------
alter table photo_set_file enable row level security;
alter table photo_set_file force row level security;

create policy tenant_isolation on photo_set_file
  using (
    exists (
      select 1 from photo_set ps
      where ps.id = photo_set_file.photo_set_id
        and ps.tenant_id = current_tenant_id()
    )
  )
  with check (
    exists (
      select 1 from photo_set ps
      where ps.id = photo_set_file.photo_set_id
        and ps.tenant_id = current_tenant_id()
    )
    and exists (
      select 1 from clinical_file cf
      where cf.id = photo_set_file.clinical_file_id
        and cf.tenant_id = current_tenant_id()
    )
  );

grant select, insert, update, delete on
  membership_unit, invitation_unit, role_permission,
  notification_preference, photo_set_file
to crm_app;

-- Guarda de regressao: tabela nova com tenant_id e sem RLS quebra a suite de
-- testes antes de chegar em producao.
create or replace function assert_rls_coverage() returns table (table_name text, problem text)
language sql
stable
as $$
  select c.relname::text,
         case when not c.relrowsecurity then 'sem RLS habilitado'
              else 'sem policy' end
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relkind = 'r'
    and c.relname not in (
      -- Referencia global, sem dono: leitura para todos, escrita so por migration.
      'tooth', 'body_region', 'permission', 'subscription_plan', 'plan_feature',
      'state_transition', 'system_role_permission'
    )
    and (
      not c.relrowsecurity
      or not exists (select 1 from pg_policies p
                     where p.schemaname = 'public' and p.tablename = c.relname)
    );
$$;

comment on function assert_rls_coverage() is
  'Deve retornar zero linhas. Chamada no teste de isolamento e no CI.';
