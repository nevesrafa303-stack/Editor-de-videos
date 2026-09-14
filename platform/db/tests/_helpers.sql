-- Mini framework de teste. Cada arquivo roda como papel da aplicacao (nao
-- superusuario), senao RLS seria ignorada e o teste nao provaria nada.
create schema if not exists test;

create table if not exists test.result (
  id          serial primary key,
  suite       text not null,
  description text not null,
  passed      boolean not null,
  detail      text,
  ran_at      timestamptz not null default now()
);

create or replace function test.check(p_suite text, p_desc text, p_cond boolean, p_detail text default null)
returns void
language plpgsql
as $$
begin
  insert into test.result (suite, description, passed, detail)
  values (p_suite, p_desc, coalesce(p_cond, false), p_detail);

  if coalesce(p_cond, false) then
    raise notice '  ok   %', p_desc;
  else
    raise notice '  FALHA %  (%)', p_desc, coalesce(p_detail, 'condicao falsa');
  end if;
end;
$$;

-- Executa um comando esperando que ele seja RECUSADO. O teste passa quando a
-- mensagem de erro casa com o trecho esperado.
create or replace function test.rejects(p_suite text, p_desc text, p_sql text, p_expected text default null)
returns void
language plpgsql
as $$
declare
  err text;
begin
  begin
    execute p_sql;
    perform test.check(p_suite, p_desc, false, 'comando foi aceito quando deveria falhar');
    return;
  exception when others then
    err := sqlerrm;
  end;

  if p_expected is null or err ilike '%' || p_expected || '%' then
    perform test.check(p_suite, p_desc, true, err);
  else
    perform test.check(p_suite, p_desc, false,
      format('erro diferente do esperado (%s): %s', p_expected, err));
  end if;
end;
$$;

create or replace function test.summary() returns table (suite text, total bigint, passed bigint, failed bigint)
language sql
as $$
  select r.suite, count(*), count(*) filter (where r.passed), count(*) filter (where not r.passed)
  from test.result r group by r.suite order by r.suite;
$$;

grant usage on schema test to crm_app;
grant select, insert on test.result to crm_app;
grant usage, select on sequence test.result_id_seq to crm_app;
grant execute on function test.check(text, text, boolean, text) to crm_app;
grant execute on function test.rejects(text, text, text, text) to crm_app;
