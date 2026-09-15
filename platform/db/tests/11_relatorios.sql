-- =============================================================================
-- Relatorios gerenciais.
--
-- As consultas do painel vivem no aplicativo, e a suite de integracao ja prova
-- que elas somam certo. O que fica AQUI e o que so o banco pode responder:
--
--   - a janela do periodo em fuso local pega o ultimo dia inteiro e nao invade
--     o dia seguinte — a conta que decide se o pagamento das 21h entra no mes;
--   - o par pagamento/estorno se anula, entao faturamento nao conta os dois;
--   - abrir uma oportunidade ja escreve historico de etapa, que e a materia
--     prima da conversao: sem isso o funil zera sem nenhuma consulta errar;
--   - os indices de leitura da 0031 existem. Indice apagado num refactor nao
--     quebra teste nenhum — a consulta continua respondendo, so que varrendo a
--     tabela inteira. E quando doi, doi em producao com a rede cheia.
-- =============================================================================
\set QUIET on
\set ON_ERROR_STOP on

set app.tenant_id = '11111111-1111-7111-8111-111111111111';
set app.user_id = 'c1111111-1111-7111-8111-111111111111';
set app.membership_id = 'd1111111-1111-7111-8111-111111111111';
set app.role = 'owner';

do $$
declare
  TENANT   constant uuid := '11111111-1111-7111-8111-111111111111';
  UNIDADE  constant uuid := 'a1111111-1111-7111-8111-111111111111';
  PACIENTE constant uuid := '0a222222-2222-7222-8222-222222222222';
  PIX      constant uuid := '08111111-1111-7111-8111-111111111111';
  FUNIL    constant uuid := 'f1111111-1111-7111-8111-111111111111';

  v_inicio timestamptz;
  v_fim    timestamptz;
  v_tarde  timestamptz;
  v_recv   uuid;
  v_inst   uuid;
  v_pag    uuid;
  v_estorno uuid;
  v_soma   bigint;
  v_lead   uuid;
  v_opp    uuid;
  v_hist   int;
  v_idx    int;
begin
  -- --------------------------------------------------------- janela local --
  -- "De 1 a 30 de setembro" e um par de instantes, e qual par depende do fuso.
  v_inicio := ('2026-09-01'::date)::timestamp at time zone 'America/Sao_Paulo';
  v_fim    := ('2026-09-30'::date + 1)::timestamp at time zone 'America/Sao_Paulo';

  -- 30/09 as 21:00 em Sao Paulo ja e 01/10 em UTC. Um relatorio que comparasse
  -- `timestamptz` com `date` direto jogaria este pagamento para outubro — e o
  -- caixa do dia 30 nao bateria com o mes.
  v_tarde := '2026-09-30 21:00:00-03'::timestamptz;

  perform test.check('relatorios', 'o ultimo dia entra inteiro, mesmo as 21h',
    v_tarde >= v_inicio and v_tarde < v_fim,
    format('tarde=%s inicio=%s fim=%s', v_tarde, v_inicio, v_fim));

  perform test.check('relatorios', 'o primeiro instante do dia seguinte fica de fora',
    not (('2026-10-01 00:00:00-03'::timestamptz) < v_fim));

  perform test.check('relatorios', 'e o instante anterior ao periodo tambem',
    not (('2026-08-31 23:59:59-03'::timestamptz) >= v_inicio));

  -- --------------------------------------------- estorno anula o recebido --
  insert into receivable (tenant_id, unit_id, patient_id, origin, total_cents,
                          description, issued_on)
  values (TENANT, UNIDADE, PACIENTE, 'manual', 50000,
          'Cobranca para provar o estorno no relatorio', current_date)
  returning id into v_recv;

  insert into installment (tenant_id, unit_id, receivable_id, patient_id,
                           number, total_count, due_on, amount_cents)
  values (TENANT, UNIDADE, v_recv, PACIENTE, 1, 1, current_date, 50000)
  returning id into v_inst;

  insert into payment (tenant_id, unit_id, installment_id, patient_id,
                       payment_method_id, amount_cents)
  values (TENANT, UNIDADE, v_inst, PACIENTE, PIX, 50000)
  returning id into v_pag;

  select coalesce(sum(amount_cents), 0) into v_soma
    from payment where installment_id = v_inst and status = 'confirmed';
  perform test.check('relatorios', 'pagamento confirmado entra no faturamento',
    v_soma = 50000, format('somou %s', v_soma));

  -- Estornar NAO apaga: cria o par. O relatorio precisa deixar os dois de fora,
  -- senao o mes em que a devolucao aconteceu aparece maior do que foi.
  update payment
     set status = 'reversed', reversed_at = now(),
         reversal_reason = 'Cobranca em duplicidade.'
   where id = v_pag;

  insert into payment (tenant_id, unit_id, installment_id, patient_id,
                       payment_method_id, amount_cents, status,
                       reverses_payment_id, reversal_reason)
  values (TENANT, UNIDADE, v_inst, PACIENTE, PIX, 50000, 'confirmed',
          v_pag, 'Cobranca em duplicidade.')
  returning id into v_estorno;

  select coalesce(sum(amount_cents), 0) into v_soma
    from payment
   where installment_id = v_inst
     and status = 'confirmed'
     and reverses_payment_id is null;
  perform test.check('relatorios', 'estornado sai do faturamento, e o par nao dobra',
    v_soma = 0, format('somou %s', v_soma));

  -- ---------------------------------------- historico nasce com a abertura --
  insert into lead (tenant_id, unit_id, full_name, phone, status)
  values (TENANT, UNIDADE, 'Contato de teste de relatorio', '11999990000', 'new')
  returning id into v_lead;

  insert into opportunity (tenant_id, unit_id, pipeline_id, stage_id, lead_id,
                           title, amount_cents)
  values (TENANT, UNIDADE, FUNIL,
          (select id from pipeline_stage where pipeline_id = FUNIL and code = 'NOVO'),
          v_lead, 'Negocio de teste de relatorio', 100000)
  returning id into v_opp;

  select count(*) into v_hist
    from opportunity_stage_history where opportunity_id = v_opp;
  perform test.check('relatorios', 'abrir negocio ja escreve historico de etapa',
    v_hist = 1, format('%s linhas', v_hist));

  update opportunity
     set stage_id = (select id from pipeline_stage where pipeline_id = FUNIL and code = 'PROPOSTA')
   where id = v_opp;

  select count(*) into v_hist
    from opportunity_stage_history where opportunity_id = v_opp;
  perform test.check('relatorios', 'e cada movimento acrescenta uma linha',
    v_hist = 2, format('%s linhas', v_hist));

  -- ----------------------------------------------------------- indices ----
  select count(*) into v_idx
    from pg_indexes
   where schemaname = 'public'
     and indexname in ('payment_confirmed_idx', 'quote_accepted_idx',
                       'opportunity_stage_history_stage_idx',
                       'opportunity_created_idx', 'opportunity_closed_idx',
                       'lead_created_idx');
  perform test.check('relatorios', 'os seis indices de leitura do painel existem',
    v_idx = 6, format('achei %s de 6', v_idx));

  -- Parcial de propósito: o relatorio nunca soma estorno, e um indice que
  -- cobre a clausula e menor que o total. Se alguem "simplificar" tirando o
  -- WHERE, o indice deixa de servir para a consulta que ele existe para servir.
  perform test.check('relatorios', 'o indice de pagamento e parcial no confirmado',
    (select indexdef like '%WHERE (status = ''confirmed''::payment_status)%'
       from pg_indexes where indexname = 'payment_confirmed_idx'));

  perform test.check('relatorios', 'o de orcamento aceito ignora o apagado',
    (select indexdef like '%deleted\_at IS NULL%'
       from pg_indexes where indexname = 'quote_accepted_idx'));
end;
$$;
