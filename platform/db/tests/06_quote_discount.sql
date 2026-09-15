-- =============================================================================
-- Teto de desconto: tabela de precos E alcada do papel.
--
-- A regra que estes testes travam: desconto nao e negociacao livre. Quem
-- concede responde por ele, e o teto de quem concede vale junto com o teto do
-- procedimento. Sem a alcada, a recepcao dava o mesmo desconto que o dono e a
-- margem sumia sem ninguem ter decidido nada.
-- =============================================================================
\set QUIET on
\set ON_ERROR_STOP on

set app.tenant_id = '11111111-1111-7111-8111-111111111111';
set app.user_id = 'c1111111-1111-7111-8111-111111111111';
set app.membership_id = 'd1111111-1111-7111-8111-111111111111';
set app.role = 'owner';

do $$
declare
  v_quote uuid;
  v_avulso uuid;
  v_percent numeric;
begin
  -- Alcadas conservadoras: mais facil afrouxar do que explicar a margem.
  select max_discount_percent into v_percent
    from role where tenant_id = '11111111-1111-7111-8111-111111111111' and code = 'reception';
  perform test.check('alcada', 'recepcao tem alcada menor que gestor',
    v_percent = 5, format('recepcao=%s', v_percent));

  select max_discount_percent into v_percent
    from role where tenant_id = '11111111-1111-7111-8111-111111111111' and code = 'owner';
  perform test.check('alcada', 'dono nao tem teto de alcada', v_percent = 100);

  -- Orcamento de 178.000 (resina 28.000 + toxina 150.000), teto de tabela 20%.
  insert into quote (tenant_id, unit_id, patient_id, created_by, title)
  values ('11111111-1111-7111-8111-111111111111', 'a1111111-1111-7111-8111-111111111111',
          '0a111111-1111-7111-8111-111111111111', 'd1111111-1111-7111-8111-111111111111',
          'Orcamento do teste de alcada')
  returning id into v_quote;

  insert into quote_item (tenant_id, quote_id, procedure_id, description, tooth_code, surfaces,
                          quantity, unit_price_cents, price_list_item_id)
  select '11111111-1111-7111-8111-111111111111', v_quote, '03111111-1111-7111-8111-111111111111',
         'Restauracao em resina', '16', array['O']::tooth_surface[], 1, 28000, pli.id
  from price_list_item pli where pli.procedure_id = '03111111-1111-7111-8111-111111111111';

  insert into quote_item (tenant_id, quote_id, procedure_id, description, region_code,
                          quantity, quantity_unit, unit_price_cents, price_list_item_id)
  select '11111111-1111-7111-8111-111111111111', v_quote, '03333333-3333-7333-8333-333333333333',
         'Toxina botulinica', 'glabela', 1, 'sessao', 150000, pli.id
  from price_list_item pli where pli.procedure_id = '03333333-3333-7333-8333-333333333333';

  -- ------------------------------------------------------------ recepcao ---
  -- 5% de 178.000 = 8.900. O teto de tabela (35.600) e maior, entao quem manda
  -- e a alcada.
  set local app.membership_id = 'd4444444-4444-7444-8444-444444444444';
  set local app.user_id = 'c4444444-4444-7444-8444-444444444444';
  set local app.role = 'reception';

  perform test.rejects('alcada',
    'recepcao nao envia orcamento com desconto acima da propria alcada',
    format('update quote set discount_cents = 20000, status = ''sent'' where id = %L', v_quote),
    'excede o teto');

  update quote set discount_cents = 8000, status = 'sent', sent_at = now() where id = v_quote;
  perform test.check('alcada', 'recepcao envia dentro da propria alcada',
    (select status from quote where id = v_quote) = 'sent');

  -- ----------------------------------------------------------- aprovacao ---
  -- O gestor aprovando troca o teto pelo dele (20% = 35.600), nao libera tudo.
  set local app.membership_id = 'd1111111-1111-7111-8111-111111111111';
  set local app.user_id = 'c1111111-1111-7111-8111-111111111111';
  set local app.role = 'owner';

  update quote set status = 'negotiating' where id = v_quote;

  perform test.rejects('alcada',
    'aprovacao nao e carimbo: acima do teto da tabela continua recusado',
    format($sql$update quote
                   set discount_cents = 60000,
                       discount_approved_by = 'd1111111-1111-7111-8111-111111111111',
                       discount_approved_at = now()
                 where id = %L$sql$, v_quote),
    'excede o teto');

  update quote
     set discount_cents = 30000,
         discount_approved_by = 'd1111111-1111-7111-8111-111111111111',
         discount_approved_at = now()
   where id = v_quote;

  perform test.check('alcada', 'desconto aprovado por quem tem alcada passa',
    (select discount_cents from quote where id = v_quote) = 30000);

  -- ------------------------------------------------------- item avulso -----
  -- Item digitado a mao nao tem tabela de precos por tras. O teto de tabela
  -- deixa de limitar, mas a alcada continua — senao o item avulso viraria a
  -- porta dos fundos do desconto.
  insert into quote (tenant_id, unit_id, patient_id, created_by, title)
  values ('11111111-1111-7111-8111-111111111111', 'a1111111-1111-7111-8111-111111111111',
          '0a111111-1111-7111-8111-111111111111', 'd4444444-4444-7444-8444-444444444444',
          'Orcamento com item avulso')
  returning id into v_avulso;

  insert into quote_item (tenant_id, quote_id, description, quantity, unit_price_cents)
  values ('11111111-1111-7111-8111-111111111111', v_avulso, 'Procedimento avulso', 1, 100000);

  set local app.membership_id = 'd4444444-4444-7444-8444-444444444444';
  set local app.role = 'reception';

  perform test.rejects('alcada',
    'item avulso nao escapa da alcada do papel',
    format('update quote set discount_cents = 20000, status = ''sent'' where id = %L', v_avulso),
    'excede o teto');

  update quote set discount_cents = 5000, status = 'sent', sent_at = now() where id = v_avulso;
  perform test.check('alcada', 'item avulso aceita desconto dentro da alcada',
    (select total_cents from quote where id = v_avulso) = 95000);

  -- ------------------------------------------------------------ retencao ---
  perform test.check('alcada', 'prazo de retencao do prontuario tem padrao de 10 anos',
    (select chart_retention_years from tenant_policy
      where tenant_id = '11111111-1111-7111-8111-111111111111') = 10);
end;
$$;
