-- =============================================================================
-- 0019 — Denormalizacoes do paciente, mantidas na escrita
--
-- `patient.next_appointment_at`, `last_visit_at`, `visit_count`,
-- `no_show_count` e `open_balance_cents` existem para a lista de pacientes e
-- os alertas nao varrerem agenda e financeiro a cada abertura de tela.
--
-- Estavam documentadas como "mantidas por job noturno" — e o job nao existe.
-- O resultado apareceu na primeira captura de tela do produto: cinco pacientes
-- com consulta marcada para hoje e a coluna "proxima consulta" vazia.
--
-- Job noturno continua fazendo sentido como REPARO (uma consulta que passou
-- deixa de ser a proxima sem que ninguem escreva nada), mas a fonte da verdade
-- passa a ser a escrita: marcar consulta atualiza o paciente na mesma
-- transacao. Cache que so o job atualiza e cache que mente o dia inteiro.
-- =============================================================================

create or replace function refresh_patient_rollup(p_patient_id uuid) returns void
language plpgsql
as $$
begin
  if p_patient_id is null then
    return;
  end if;

  update patient p
     set first_visit_at      = a.first_visit,
         last_visit_at       = a.last_visit,
         next_appointment_at = a.next_appointment,
         visit_count         = a.visits,
         no_show_count       = a.no_shows,
         open_balance_cents  = f.open_balance
    from (
      select
        min(starts_at) filter (where status = 'completed')            as first_visit,
        max(starts_at) filter (where status = 'completed')            as last_visit,
        min(starts_at) filter (
          where status in ('scheduled', 'confirmed', 'arrived')
            and starts_at >= now()
        )                                                             as next_appointment,
        count(*) filter (where status = 'completed')::int             as visits,
        count(*) filter (where status = 'no_show')::int               as no_shows
      from appointment
      where patient_id = p_patient_id
        and deleted_at is null
    ) a
    cross join (
      select coalesce(sum(amount_cents - paid_cents), 0) as open_balance
      from installment
      where patient_id = p_patient_id
        and status in ('open', 'partially_paid')
    ) f
   where p.id = p_patient_id;
end;
$$;

comment on function refresh_patient_rollup(uuid) is
  'Recalcula as denormalizacoes de um paciente a partir de agenda e financeiro.';

-- Reparo em lote: e o que o job noturno roda para corrigir o que o tempo
-- invalidou (consulta que passou deixa de ser a proxima sem ninguem escrever).
create or replace function refresh_patient_rollups() returns int
language plpgsql
as $$
declare
  v_count int := 0;
  v_id    uuid;
begin
  for v_id in select id from patient where deleted_at is null loop
    perform refresh_patient_rollup(v_id);
    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$$;

comment on function refresh_patient_rollups() is
  'Reparo em lote das denormalizacoes. Uso: job noturno.';

create or replace function sync_patient_rollup() returns trigger
language plpgsql
as $$
begin
  perform refresh_patient_rollup(coalesce(new.patient_id, old.patient_id));

  -- Remarcacao pode trocar o paciente: os dois lados precisam ser recalculados.
  if tg_op = 'UPDATE' and new.patient_id is distinct from old.patient_id then
    perform refresh_patient_rollup(old.patient_id);
  end if;

  return coalesce(new, old);
end;
$$;

create trigger appointment_sync_patient_rollup
  after insert or update or delete on appointment
  for each row execute function sync_patient_rollup();

create trigger installment_sync_patient_rollup
  after insert or update or delete on installment
  for each row execute function sync_patient_rollup();

-- -----------------------------------------------------------------------------
-- Auditoria nao registra recalculo de cache.
--
-- Sem isto, cada confirmacao de consulta gravaria uma linha de auditoria em
-- `patient` dizendo que `next_appointment_at` mudou. A trilha existe para
-- responder "quem alterou o dado do paciente"; enche-la de recalculo do
-- sistema e a forma mais rapida de torna-la inutil.
-- -----------------------------------------------------------------------------
create or replace function write_audit_log() returns trigger
language plpgsql
security definer
as $$
declare
  before_data jsonb := case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) end;
  after_data  jsonb := case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) end;
  row_data    jsonb := coalesce(after_data, before_data);
  row_tenant  uuid  := nullif(row_data ->> 'tenant_id', '')::uuid;
  row_unit    uuid  := nullif(row_data ->> 'unit_id', '')::uuid;
  row_id      uuid  := nullif(row_data ->> 'id', '')::uuid;
  row_key     text;
  parent_col  text  := tg_argv[0];
  parent_tbl  text  := tg_argv[1];
  op          text  := lower(tg_op);
  keys        text[];
  -- Colunas que o proprio sistema recalcula. Update que so mexe nelas nao e
  -- alteracao de dado do paciente e nao entra na trilha.
  derived     text[] := array[
    'updated_at', 'first_visit_at', 'last_visit_at', 'next_appointment_at',
    'visit_count', 'no_show_count', 'no_show_risk', 'lifetime_value_cents',
    'open_balance_cents'
  ];
begin
  if row_id is null and parent_col is not null then
    row_id := nullif(row_data ->> parent_col, '')::uuid;
  end if;

  if row_tenant is null and parent_col is not null and parent_tbl is not null then
    execute format('select tenant_id from %I where id = $1', parent_tbl)
      into row_tenant
      using nullif(row_data ->> parent_col, '')::uuid;
  end if;

  -- Sem tenant nao ha a quem atribuir o registro; melhor nao auditar do que
  -- gravar linha orfa que quebra o relatorio de auditoria.
  if row_tenant is null then
    return coalesce(new, old);
  end if;

  if row_id is null then
    row_key := row_data::text;
  end if;

  if tg_op = 'UPDATE' then
    select array_agg(key order by key) into keys
    from jsonb_each(after_data)
    where after_data -> key is distinct from before_data -> key;

    if keys is null or keys <@ derived then
      return new;
    end if;

    -- Soft delete e restore aparecem como update; classificamos para o relatorio.
    if (before_data ->> 'deleted_at') is null and (after_data ->> 'deleted_at') is not null then
      op := 'delete';
    elsif (before_data ->> 'deleted_at') is not null and (after_data ->> 'deleted_at') is null then
      op := 'restore';
    end if;

    if keys is null then
      return coalesce(new, old);
    end if;
  end if;

  insert into audit_log (
    tenant_id, unit_id, actor_id, actor_role, action, entity, entity_id, entity_key,
    before_data, after_data, changed_keys, request_id, ip_address, user_agent
  )
  values (
    row_tenant, row_unit, current_user_id(),
    nullif(current_setting('app.role', true), ''),
    op, tg_table_name, row_id, row_key,
    before_data, after_data, keys,
    nullif(current_setting('app.request_id', true), ''),
    nullif(current_setting('app.ip', true), '')::inet,
    nullif(current_setting('app.user_agent', true), '')
  );

  return coalesce(new, old);
end;
$$;

comment on function write_audit_log() is
  'Trigger de auditoria. security definer: o app nao precisa de INSERT direto em audit_log. Update que so mexeu em coluna derivada nao entra na trilha.';
