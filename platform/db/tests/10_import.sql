-- =============================================================================
-- Importacao: o que o banco garante sozinho.
--
-- A leitura da planilha e o casamento de duplicado vivem na aplicacao — sao
-- interpretacao, e mudam. O que nao muda, e por isso mora aqui: a importacao e
-- um FATO guardado linha a linha, aplicada uma vez so, e invisivel para outra
-- rede.
-- =============================================================================
\set QUIET on
\set ON_ERROR_STOP on

set app.tenant_id = '11111111-1111-7111-8111-111111111111';
set app.user_id = 'c1111111-1111-7111-8111-111111111111';
set app.membership_id = 'd1111111-1111-7111-8111-111111111111';
set app.role = 'owner';

do $$
declare
  TENANT  constant uuid := '11111111-1111-7111-8111-111111111111';
  UNIDADE constant uuid := 'a1111111-1111-7111-8111-111111111111';
  PROF    constant uuid := 'd1111111-1111-7111-8111-111111111111';

  v_job uuid;
  v_row uuid;
  v_pac uuid;
  v_n   int;
begin
  insert into import_job (tenant_id, unit_id, filename, created_by)
  values (TENANT, UNIDADE, 'base_antiga.csv', PROF)
  returning id into v_job;

  perform test.check('importacao', 'a importacao nasce analisando, sem nada aplicado',
    (select status from import_job where id = v_job) = 'analyzing'
      and (select applied_at from import_job where id = v_job) is null);

  insert into import_row (tenant_id, job_id, line_number, raw, status)
  values (TENANT, v_job, 2, '{"nome":"Aurora","telefone":"11988887777"}'::jsonb, 'valid')
  returning id into v_row;

  -- A linha crua fica como veio: e a unica forma de responder depois "o
  -- sistema leu errado ou a planilha estava errada?".
  perform test.check('importacao', 'a linha guarda o que veio no arquivo',
    (select raw ->> 'nome' from import_row where id = v_row) = 'Aurora');

  perform test.rejects('importacao', 'duas linhas com o mesmo numero sao recusadas',
    format($sql$insert into import_row (tenant_id, job_id, line_number, raw, status)
      values (%L, %L, 2, '{}'::jsonb, 'valid')$sql$, TENANT, v_job),
    'import_row_line_uk');

  -- "Importada" e "tem paciente" sao a mesma afirmacao: uma sem a outra seria
  -- um relatorio que diz que entrou sem dizer quem.
  perform test.rejects('importacao', 'linha importada sem paciente e recusada',
    format('update import_row set status = ''imported'' where id = %L', v_row),
    'import_row_imported');

  select id into v_pac from patient where tenant_id = TENANT limit 1;

  perform test.rejects('importacao', 'e paciente sem estar importada tambem',
    format('update import_row set patient_id = %L where id = %L', v_pac, v_row),
    'import_row_imported');

  update import_row set status = 'imported', patient_id = v_pac where id = v_row;
  perform test.check('importacao', 'as duas juntas passam',
    (select patient_id from import_row where id = v_row) = v_pac);

  -- ---------------------------------------------------- maquina de estado --
  perform test.rejects('importacao', 'nao se aplica o que ainda esta analisando',
    format('update import_job set status = ''applied'', applied_at = now() where id = %L', v_job),
    'Transicao invalida');

  update import_job set status = 'ready' where id = v_job;
  update import_job set status = 'applied', applied_at = now(), imported_rows = 1
   where id = v_job;

  perform test.rejects('importacao', 'aplicada e terminal: nao volta para conferencia',
    format('update import_job set status = ''ready'', applied_at = null where id = %L', v_job),
    'Transicao invalida');

  perform test.rejects('importacao', 'aplicada sem carimbo de quando e recusada',
    format('update import_job set applied_at = null where id = %L', v_job),
    'import_job_applied');

  -- ------------------------------------------------------------ auditoria --
  select count(*) into v_n
    from audit_log where entity = 'import_job' and entity_id = v_job;

  -- A planilha traz dado pessoal em volume: quem trouxe fica registrado.
  perform test.check('importacao', 'a importacao deixa rastro na auditoria',
    v_n >= 1, format('linhas=%s', v_n));

  -- ----------------------------------------------------------- isolamento --
  declare
    v_visiveis int;
  begin
    set local app.tenant_id = '22222222-2222-7222-8222-222222222222';
    set local app.membership_id = 'd9999999-9999-7999-8999-999999999999';

    select count(*) into v_visiveis from import_job where id = v_job;
    perform test.check('importacao', 'importacao da rede A e invisivel na rede B',
      v_visiveis = 0);

    select count(*) into v_visiveis from import_row where job_id = v_job;
    perform test.check('importacao', 'e as linhas dela tambem',
      v_visiveis = 0);

    set local app.tenant_id = '11111111-1111-7111-8111-111111111111';
    set local app.membership_id = 'd1111111-1111-7111-8111-111111111111';
  end;
end;
$$;
