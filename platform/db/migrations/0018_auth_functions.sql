-- =============================================================================
-- 0018 — Funcoes de autenticacao.
--
-- Problema de ovo e galinha: o RLS precisa de `app.tenant_id` para liberar
-- qualquer leitura, mas quem acabou de digitar e-mail e senha ainda nao tem
-- tenant. Nao da para "consultar o membership para descobrir o tenant" — a
-- policy bloqueia antes.
--
-- A saida e um caminho estreito e explicito: tres funcoes SECURITY DEFINER,
-- com search_path fixo, que sao a UNICA porta que a aplicacao tem para
-- atravessar o RLS. Elas nao aceitam filtro livre: recebem e-mail, id de
-- usuario ou hash de token, e devolvem exatamente o que o login precisa.
--
-- Regra para quem for mexer aqui: nenhuma funcao nova neste arquivo pode
-- receber predicado vindo do cliente. Se precisar disso, a resposta esta
-- errada.
-- =============================================================================

-- Busca do usuario por e-mail. Devolve o hash da senha porque a verificacao
-- acontece na aplicacao; devolve tambem o estado de bloqueio, para a aplicacao
-- nao precisar de uma segunda consulta antes de recusar.
create or replace function auth_lookup_user(p_email citext)
returns table (
  id             uuid,
  full_name      text,
  password_hash  text,
  locked_until   timestamptz,
  mfa_enabled_at timestamptz,
  deleted_at     timestamptz
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select u.id, u.full_name, u.password_hash, u.locked_until, u.mfa_enabled_at, u.deleted_at
  from app_user u
  where u.email = p_email
  limit 1;
$$;

-- Redes em que o usuario pode entrar. O seletor de clinica do login sai daqui.
create or replace function auth_memberships(p_user_id uuid)
returns table (
  tenant_id     uuid,
  tenant_name   text,
  tenant_slug   citext,
  tenant_status tenant_status,
  membership_id uuid,
  role_id       uuid,
  role_code     text,
  role_name     text,
  is_provider   boolean,
  unit_ids      uuid[]
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select
    t.id, t.trade_name, t.slug, t.status,
    m.id, r.id, r.code, r.name, m.is_provider,
    coalesce(
      (select array_agg(mu.unit_id order by mu.unit_id)
         from membership_unit mu
         join unit u on u.id = mu.unit_id and u.deleted_at is null
        where mu.membership_id = m.id),
      '{}'::uuid[]
    )
  from membership m
  join tenant t on t.id = m.tenant_id
  join role r on r.id = m.role_id
  where m.user_id = p_user_id
    and m.status = 'active'
    and m.deleted_at is null
    and t.deleted_at is null
    and t.status in ('trial', 'active', 'past_due')
  order by t.trade_name;
$$;

-- Resolve a sessao a partir do hash do token. Uma chamada por requisicao:
-- devolve sessao, usuario, vinculo, papel, unidades e permissoes de uma vez.
create or replace function auth_resolve_session(p_token_hash text)
returns table (
  session_id       uuid,
  user_id          uuid,
  user_name        text,
  tenant_id        uuid,
  tenant_name      text,
  tenant_status    tenant_status,
  membership_id    uuid,
  role_id          uuid,
  role_code        text,
  is_provider      boolean,
  active_unit_id   uuid,
  unit_ids         uuid[],
  permissions      text[],
  mfa_enabled_at   timestamptz,
  mfa_satisfied_at timestamptz,
  expires_at       timestamptz
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select
    s.id, u.id, u.full_name,
    t.id, t.trade_name, t.status,
    m.id, r.id, r.code, m.is_provider,
    s.active_unit_id,
    coalesce(
      (select array_agg(mu.unit_id order by mu.unit_id)
         from membership_unit mu where mu.membership_id = m.id),
      '{}'::uuid[]
    ),
    coalesce(
      (select array_agg(rp.permission_key order by rp.permission_key)
         from role_permission rp where rp.role_id = r.id),
      '{}'::text[]
    ),
    u.mfa_enabled_at,
    s.mfa_satisfied_at,
    s.expires_at
  from user_session s
  join app_user u on u.id = s.user_id
  join tenant t on t.id = s.tenant_id
  join membership m on m.tenant_id = s.tenant_id and m.user_id = s.user_id
  join role r on r.id = m.role_id
  where s.token_hash = p_token_hash
    and s.revoked_at is null
    and s.expires_at > now()
    and u.deleted_at is null
    and m.status = 'active'
    and m.deleted_at is null
  limit 1;
$$;

-- Registro de tentativa de login. Precisa de definer porque falha de senha
-- acontece sem sessao — e e exatamente o caso que mais interessa registrar.
create or replace function auth_register_login_attempt(
  p_user_id uuid,
  p_success boolean,
  p_max_failures int default 5,
  p_lock_minutes int default 15
) returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if p_success then
    update app_user
       set failed_login_count = 0,
           locked_until = null,
           last_login_at = now()
     where id = p_user_id;
  else
    update app_user
       set failed_login_count = failed_login_count + 1,
           locked_until = case
             when failed_login_count + 1 >= p_max_failures
               then now() + make_interval(mins => p_lock_minutes)
             else locked_until
           end
     where id = p_user_id;
  end if;
end;
$$;

-- Revogacao de sessao.
--
-- Precisa de definer por um motivo que so aparece testando: a policy de
-- user_session e `user_id = current_user_id()`, e no logout nao ha contexto de
-- usuario aplicado. Sem esta funcao, o UPDATE afeta zero linhas em silencio —
-- o usuario clica em "sair", a tela volta para o login e o token continua
-- valendo.
create or replace function auth_revoke_session(p_token_hash text)
returns int
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  affected int;
begin
  update user_session
     set revoked_at = now()
   where token_hash = p_token_hash
     and revoked_at is null;

  get diagnostics affected = row_count;
  return affected;
end;
$$;

revoke all on function auth_lookup_user(citext) from public;
revoke all on function auth_revoke_session(text) from public;
grant execute on function auth_revoke_session(text) to crm_app;
revoke all on function auth_memberships(uuid) from public;
revoke all on function auth_resolve_session(text) from public;
revoke all on function auth_register_login_attempt(uuid, boolean, int, int) from public;

grant execute on function auth_lookup_user(citext) to crm_app;
grant execute on function auth_memberships(uuid) to crm_app;
grant execute on function auth_resolve_session(text) to crm_app;
grant execute on function auth_register_login_attempt(uuid, boolean, int, int) to crm_app;

comment on function auth_resolve_session(text) is
  'Unica porta de leitura pre-contexto. Recebe hash de token, nunca predicado do cliente.';
