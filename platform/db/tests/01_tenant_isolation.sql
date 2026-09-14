-- Isolamento entre redes. Roda como crm_test (papel da aplicacao), nao como
-- superusuario: superusuario ignora RLS e o teste nao provaria nada.
\set QUIET on
\set ON_ERROR_STOP on

set app.tenant_id = '11111111-1111-7111-8111-111111111111';
set app.user_id = 'c1111111-1111-7111-8111-111111111111';
set app.membership_id = 'd1111111-1111-7111-8111-111111111111';

do $$
declare
  v_count int;
begin
  -- Cobertura: nenhuma tabela de negocio pode ficar sem RLS.
  select count(*) into v_count from assert_rls_coverage();
  perform test.check('isolamento', 'toda tabela de negocio tem RLS e policy', v_count = 0,
    format('%s tabelas descobertas', v_count));

  -- Conta nao entra na assercao: o seed cresce, e teste de isolamento que
  -- quebra porque alguem cadastrou paciente novo vira ruido.
  select count(*) into v_count from patient
   where tenant_id <> '11111111-1111-7111-8111-111111111111';
  perform test.check('isolamento', 'rede A ve apenas os proprios pacientes', v_count = 0,
    format('viu %s de outra rede', v_count));

  select count(*) into v_count from patient
   where id = '0a333333-3333-7333-8333-333333333333';
  perform test.check('isolamento', 'paciente da rede B e invisivel mesmo com o id em maos', v_count = 0);

  -- Escrita cruzada: RLS recusa via WITH CHECK.
  perform test.rejects('isolamento',
    'insert com tenant_id de outra rede e recusado',
    $sql$insert into patient (tenant_id, full_name, phone)
         values ('22222222-2222-7222-8222-222222222222', 'Invasor', '11999999999')$sql$,
    'row-level security');

  -- Update cruzado nao acha a linha: afeta zero, nao levanta erro.
  update patient set full_name = 'Sequestrado'
   where id = '0a333333-3333-7333-8333-333333333333';
  get diagnostics v_count = row_count;
  perform test.check('isolamento', 'update em paciente de outra rede nao afeta nada', v_count = 0,
    format('%s linhas', v_count));

  -- O papel da aplicacao nao tem DELETE em tabela de negocio: exclusao e
  -- sempre logica (deleted_at), para prontuario e financeiro nao evaporarem.
  perform test.rejects('isolamento',
    'aplicacao nao tem permissao de delete fisico em tabela de negocio',
    $sql$delete from opportunity where tenant_id = '22222222-2222-7222-8222-222222222222'$sql$,
    'permission denied');

  -- Tabela de juncao: o buraco classico. Ligar membro da rede A a unidade da B.
  perform test.rejects('isolamento',
    'ligar membro da rede A a unidade da rede B e recusado',
    $sql$insert into membership_unit (membership_id, unit_id)
         values ('d1111111-1111-7111-8111-111111111111', 'b1111111-1111-7111-8111-111111111111')$sql$,
    'row-level security');

  -- Com id literal da outra rede: o WITH CHECK precisa recusar a escrita.
  perform test.rejects('isolamento',
    'dar permissao a papel de outra rede e recusado',
    $sql$insert into role_permission (role_id, permission_key)
         values ('0f222222-2222-7222-8222-222222222222', 'tenant.write')$sql$,
    'row-level security');

  -- E o papel da outra rede sequer aparece na consulta.
  select count(*) into v_count from role
   where id = '0f222222-2222-7222-8222-222222222222';
  perform test.check('isolamento', 'papel customizado da rede B e invisivel para a rede A', v_count = 0);
end;
$$;

-- Troca de contexto: a mesma conexao, outra rede.
set app.tenant_id = '22222222-2222-7222-8222-222222222222';
set app.membership_id = 'd6666666-6666-7666-8666-666666666666';

do $$
declare
  v_count int;
begin
  select count(*) into v_count from patient;
  perform test.check('isolamento', 'rede B ve apenas o proprio paciente', v_count = 1,
    format('viu %s', v_count));

  select count(*) into v_count from procedure;
  perform test.check('isolamento', 'catalogo da rede A nao aparece na rede B', v_count = 0);
end;
$$;

-- Sem contexto: o sistema deve falhar FECHADO (nao ver nada), nunca aberto.
reset app.tenant_id;
reset app.membership_id;

do $$
declare
  v_count int;
begin
  select count(*) into v_count from patient;
  perform test.check('isolamento', 'sessao sem tenant nao enxerga nenhum paciente', v_count = 0,
    format('viu %s', v_count));

  select count(*) into v_count from clinical_note;
  perform test.check('isolamento', 'sessao sem tenant nao enxerga prontuario', v_count = 0);
end;
$$;

-- Escopo por unidade: gestor restrito a uma unidade nao ve agenda da outra.
set app.tenant_id = '11111111-1111-7111-8111-111111111111';
set app.membership_id = 'd4444444-4444-7444-8444-444444444444';
set app.unit_ids = 'a1111111-1111-7111-8111-111111111111';

do $$
declare
  v_count int;
begin
  select count(*) into v_count from resource;
  perform test.check('isolamento', 'usuario restrito a uma unidade ve so os recursos dela', v_count = 1,
    format('viu %s', v_count));
end;
$$;

reset app.unit_ids;
