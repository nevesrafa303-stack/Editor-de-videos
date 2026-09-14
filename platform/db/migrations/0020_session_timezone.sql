-- =============================================================================
-- 0020 — Fuso horario na sessao
--
-- A primeira captura de tela do produto mostrou "15/09/2026 17:00" para uma
-- consulta marcada as 14:00. O banco estava certo: `timestamptz` guarda o
-- instante. Quem errava era a formatacao em JavaScript, que usava o fuso do
-- PROCESSO — UTC no servidor — e nao o da clinica.
--
-- Fuso nao e preferencia de quem olha: e propriedade da unidade onde o
-- atendimento acontece. Uma rede com unidade em Manaus e outra em Sao Paulo
-- tem dois "14:00" diferentes, e o servidor nao esta em nenhum dos dois.
--
-- Por isso o fuso passa a vir com a sessao: e o mesmo lugar que ja responde
-- "em qual clinica e em qual unidade esta pessoa esta".
-- =============================================================================

drop function if exists auth_resolve_session(text);

create function auth_resolve_session(p_token_hash text)
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
  timezone         text,
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
    -- Unidade ativa manda; sem unidade escolhida, o fuso da rede.
    coalesce(
      (select un.timezone from unit un where un.id = s.active_unit_id),
      t.timezone
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

revoke all on function auth_resolve_session(text) from public;
grant execute on function auth_resolve_session(text) to crm_app;

comment on function auth_resolve_session(text) is
  'Unica porta de leitura pre-contexto. Recebe hash de token, nunca predicado do cliente.';
