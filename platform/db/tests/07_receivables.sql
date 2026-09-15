-- =============================================================================
-- Do aceite ao caixa.
--
-- O que estes testes travam: aceitar orcamento GERA as parcelas na mesma
-- transacao, as parcelas somam exatamente o total, e a comissao nasce do
-- recebimento — morrendo junto com o estorno.
-- =============================================================================
\set QUIET on
\set ON_ERROR_STOP on

set app.tenant_id = '11111111-1111-7111-8111-111111111111';
set app.user_id = 'c1111111-1111-7111-8111-111111111111';
set app.membership_id = 'd1111111-1111-7111-8111-111111111111';
set app.role = 'owner';

do $$
declare
  v_quote     uuid;
  v_recv      uuid;
  v_inst      uuid;
  v_soma      bigint;
  v_count     int;
  v_valores   bigint[];
  v_saldo     bigint;
  v_multa     bigint;
  v_juros     bigint;
  v_total     bigint;
  v_pay       uuid;
  v_comissao  bigint;
  v_status    text;
begin
  -- --------------------------------------------------- divisao exata -------
  v_valores := split_amount(238000, 6);
  select sum(x) into v_soma from unnest(v_valores) x;
  perform test.check('recebivel', 'parcelas somam exatamente o total',
    v_soma = 238000, format('soma=%s', v_soma));
  perform test.check('recebivel', 'o resto fica na primeira parcela',
    v_valores[1] = 39670 and v_valores[6] = 39666,
    format('primeira=%s ultima=%s', v_valores[1], v_valores[6]));

  perform test.check('recebivel', 'divisao exata nao inventa diferenca',
    split_amount(120000, 3) = array[40000, 40000, 40000]::bigint[]);

  perform test.rejects('recebivel', 'zero parcelas e recusado',
    'select split_amount(1000, 0)', 'invalido');

  -- ------------------------------------------- aceite gera o recebivel -----
  insert into quote (tenant_id, unit_id, patient_id, provider_id, created_by,
                     title, installment_count)
  values ('11111111-1111-7111-8111-111111111111', 'a1111111-1111-7111-8111-111111111111',
          '0a111111-1111-7111-8111-111111111111', 'd1111111-1111-7111-8111-111111111111',
          'd1111111-1111-7111-8111-111111111111', 'Teste de recebivel', 6)
  returning id into v_quote;

  insert into quote_item (tenant_id, quote_id, description, quantity, unit_price_cents)
  values ('11111111-1111-7111-8111-111111111111', v_quote, 'Procedimento', 1, 318000);

  -- A entrada so pode ser definida depois dos itens: `quote_down_payment`
  -- exige que ela caiba no total, e antes do primeiro item o total e zero.
  perform test.rejects('recebivel',
    'entrada maior que o total e recusada',
    format('update quote set down_payment_cents = 400000 where id = %L', v_quote),
    'quote_down_payment');

  update quote set down_payment_cents = 80000 where id = v_quote;

  update quote set status = 'sent', sent_at = now() where id = v_quote;

  perform test.check('recebivel', 'orcamento enviado ainda nao gera parcela',
    (select count(*) from receivable where quote_id = v_quote) = 0);

  update quote
     set status = 'accepted', accepted_at = now(), signed_hash = md5('aceite-teste')
   where id = v_quote;

  select id into v_recv from receivable where quote_id = v_quote;
  perform test.check('recebivel', 'aceitar o orcamento gera o recebivel', v_recv is not null);

  select count(*), sum(amount_cents) into v_count, v_soma
  from installment where receivable_id = v_recv;

  -- Entrada de 80.000 + 6 parcelas do restante (238.000).
  perform test.check('recebivel', 'entrada vira a primeira parcela, vencendo hoje',
    (select amount_cents from installment where receivable_id = v_recv and number = 1) = 80000
    and (select due_on from installment where receivable_id = v_recv and number = 1) = current_date);

  perform test.check('recebivel', 'sao 7 parcelas: a entrada e as seis combinadas',
    v_count = 7, format('parcelas=%s', v_count));

  perform test.check('recebivel', 'a soma das parcelas e o total do orcamento',
    v_soma = 318000, format('soma=%s', v_soma));

  -- ------------------------------------------------------ idempotencia -----
  -- `accepted -> negotiating` nao existe: orcamento fechado esta fechado. O
  -- risco real e um script de correcao chamar a geracao de novo.
  perform build_receivable_from_quote(v_quote);

  perform test.check('recebivel', 'gerar de novo nao cobra o paciente duas vezes',
    (select count(*) from receivable where quote_id = v_quote) = 1);

  perform test.check('recebivel', 'nem duplica as parcelas',
    (select count(*) from installment where receivable_id = v_recv) = 7);

  -- -------------------------------------------------------- multa e juros --
  select id into v_inst from installment
   where receivable_id = v_recv and number = 2;

  update installment set due_on = current_date - 30 where id = v_inst;

  select balance_cents, fine_cents, interest_cents
    into v_saldo, v_multa, v_juros
  from installment_charges(v_inst);

  -- 2% de multa e 1% ao mes por 30 dias de atraso.
  perform test.check('recebivel', 'parcela vencida cobra multa de 2%',
    v_multa = (v_saldo * 2 / 100)::bigint, format('multa=%s saldo=%s', v_multa, v_saldo));

  perform test.check('recebivel', 'juros sao pro rata die, 1% ao mes',
    v_juros = (v_saldo * 1 * 30 / 3000)::bigint, format('juros=%s', v_juros));

  perform test.check('recebivel', 'parcela em dia nao cobra nada a mais',
    (select fine_cents + interest_cents from installment_charges(
       (select id from installment where receivable_id = v_recv and number = 3))) = 0);

  select installment_total_due(v_inst) into v_total;
  perform test.check('recebivel', 'o total devido soma saldo, multa e juros',
    v_total = v_saldo + v_multa + v_juros, format('total=%s', v_total));

  -- ------------------------------------------------ comissao no recebimento --
  insert into commission_rule (tenant_id, membership_id, basis, trigger_event, percent)
  values ('11111111-1111-7111-8111-111111111111', 'd1111111-1111-7111-8111-111111111111',
          'received', 'on_payment', 10);

  insert into payment (tenant_id, unit_id, installment_id, patient_id,
                       payment_method_id, amount_cents, created_by)
  select '11111111-1111-7111-8111-111111111111', 'a1111111-1111-7111-8111-111111111111',
         v_inst, '0a111111-1111-7111-8111-111111111111', pm.id,
         (select amount_cents from installment where id = v_inst),
         'd1111111-1111-7111-8111-111111111111'
  from payment_method pm where pm.tenant_id = '11111111-1111-7111-8111-111111111111' limit 1
  returning id into v_pay;

  select amount_cents into v_comissao from commission_entry where payment_id = v_pay;
  perform test.check('recebivel', 'comissao nasce do recebimento, nao da execucao',
    v_comissao = ((select amount_cents from payment where id = v_pay) * 10 / 100)::bigint,
    format('comissao=%s', v_comissao));

  perform test.check('recebivel', 'a parcela paga fecha sozinha',
    (select status::text from installment where id = v_inst) = 'paid');

  -- --------------------------------------------------------- estorno -------
  update payment
     set status = 'reversed', reversed_at = now(), reversal_reason = 'Teste de estorno'
   where id = v_pay;

  select status::text into v_status from commission_entry where payment_id = v_pay;
  perform test.check('recebivel', 'estorno cancela a comissao junto',
    v_status = 'canceled', format('status=%s', v_status));

  perform test.check('recebivel', 'estorno devolve a parcela para em aberto',
    (select status::text from installment where id = v_inst) = 'open');
end;
$$;
