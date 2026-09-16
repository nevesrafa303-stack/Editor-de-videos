\set QUIET on
\set ON_ERROR_STOP on

set app.tenant_id = '11111111-1111-7111-8111-111111111111';
set app.user_id = 'c3333333-3333-7333-8333-333333333333';
set app.membership_id = 'd3333333-3333-7333-8333-333333333333';

-- --------------------------------------------------------------- prontuario
do $$
declare
  v_note uuid;
  v_amend uuid;
begin
  insert into clinical_note (tenant_id, unit_id, patient_id, provider_id, content)
  values ('11111111-1111-7111-8111-111111111111', 'a2222222-2222-7222-8222-222222222222',
          '0a111111-1111-7111-8111-111111111111', 'd3333333-3333-7333-8333-333333333333',
          'Aplicacao de toxina em glabela. Paciente sem intercorrencias.')
  returning id into v_note;

  perform test.check('prontuario', 'evolucao registrada por profissional habilitado', v_note is not null);

  -- Duas camadas barram isto: o GRANT (o app nao tem DELETE) e o trigger.
  -- O teste exige a recusa; o detalhe registra qual camada respondeu.
  perform test.rejects('prontuario',
    'evolucao nao pode ser apagada',
    format('delete from clinical_note where id = %L', v_note));

  -- Fechada a nota, so cabe aditamento.
  update clinical_note set locked_at = now() where id = v_note;

  perform test.rejects('prontuario',
    'evolucao fechada nao pode ser reescrita',
    format('update clinical_note set content = ''Texto trocado'' where id = %L', v_note),
    'nao pode ser reescrita');

  insert into clinical_note (tenant_id, patient_id, provider_id, content, amends_note_id, amendment_reason)
  values ('11111111-1111-7111-8111-111111111111', '0a111111-1111-7111-8111-111111111111',
          'd3333333-3333-7333-8333-333333333333',
          'Correcao: foram 20U e nao 30U.', v_note, 'Erro de digitacao na dose')
  returning id into v_amend;

  perform test.check('prontuario', 'correcao entra como aditamento encadeado', v_amend is not null);

  perform test.rejects('prontuario',
    'aditamento sem motivo e recusado',
    $sql$insert into clinical_note (tenant_id, patient_id, provider_id, content, amends_note_id)
         values ('11111111-1111-7111-8111-111111111111', '0a111111-1111-7111-8111-111111111111',
                 'd3333333-3333-7333-8333-333333333333', 'Outra correcao',
                 (select id from clinical_note limit 1))$sql$,
    'clinical_note_amendment_reason');

  -- Recepcao nao e profissional habilitado.
  perform test.rejects('prontuario',
    'evolucao assinada por quem nao atende e recusada',
    $sql$insert into clinical_note (tenant_id, patient_id, provider_id, content)
         values ('11111111-1111-7111-8111-111111111111', '0a111111-1111-7111-8111-111111111111',
                 'd4444444-4444-7444-8444-444444444444', 'Registro indevido')$sql$,
    'profissional ativo e habilitado');
end;
$$;

-- ------------------------------------------------------------------- LGPD --
do $$
begin
  perform test.check('lgpd', 'consentimento de imagem vigente e reconhecido',
    has_active_consent('0a111111-1111-7111-8111-111111111111', 'uso_imagem'));

  perform test.check('lgpd', 'paciente sem termo de imagem e reconhecido como sem consentimento',
    not has_active_consent('0a222222-2222-7222-8222-222222222222', 'uso_imagem'));

  -- Foto de quem autorizou: aceita.
  insert into clinical_file (tenant_id, patient_id, kind, storage_key, file_name, mime_type)
  values ('11111111-1111-7111-8111-111111111111', '0a111111-1111-7111-8111-111111111111',
          'photo_before', 'tenant-a/pac-1/antes.jpg', 'antes.jpg', 'image/jpeg');
  perform test.check('lgpd', 'foto de paciente com consentimento e aceita', true);

  -- Foto de quem nao autorizou: recusada no banco, nao so escondida na tela.
  perform test.rejects('lgpd',
    'foto de paciente sem consentimento de imagem e recusada',
    $sql$insert into clinical_file (tenant_id, patient_id, kind, storage_key, file_name, mime_type)
         values ('11111111-1111-7111-8111-111111111111', '0a222222-2222-7222-8222-222222222222',
                 'photo_after', 'tenant-a/pac-2/depois.jpg', 'depois.jpg', 'image/jpeg')$sql$,
    'consentimento de uso de imagem');

  -- Revogar o termo passa a bloquear novas fotos.
  update patient_consent set revoked_at = now(), revoked_reason = 'Pedido do paciente'
   where patient_id = '0a111111-1111-7111-8111-111111111111'
     and consent_document_id = '09222222-2222-7222-8222-222222222222';

  perform test.check('lgpd', 'revogacao derruba o consentimento na hora',
    not has_active_consent('0a111111-1111-7111-8111-111111111111', 'uso_imagem'));

  perform test.rejects('lgpd',
    'apos revogacao, nova foto e recusada',
    $sql$insert into clinical_file (tenant_id, patient_id, kind, storage_key, file_name, mime_type)
         values ('11111111-1111-7111-8111-111111111111', '0a111111-1111-7111-8111-111111111111',
                 'photo_after', 'tenant-a/pac-1/depois.jpg', 'depois.jpg', 'image/jpeg')$sql$,
    'consentimento de uso de imagem');
end;
$$;

-- ------------------------------------------- rastreabilidade sanitaria -----
do $$
declare
  v_session uuid;
  v_app uuid;
  v_lot text;
  v_exp date;
  v_qty numeric;
begin
  insert into aesthetic_session (tenant_id, unit_id, patient_id, provider_id, session_number, status, performed_at)
  values ('11111111-1111-7111-8111-111111111111', 'a2222222-2222-7222-8222-222222222222',
          '0a111111-1111-7111-8111-111111111111', 'd3333333-3333-7333-8333-333333333333',
          1, 'completed', now())
  returning id into v_session;

  -- Sem lote: recusado (politica padrao exige rastreio).
  perform test.rejects('rastreio',
    'aplicacao de injetavel sem lote e recusada',
    format($sql$insert into injectable_application
      (tenant_id, session_id, patient_id, provider_id, region_code, product_id, quantity, quantity_unit)
      values ('11111111-1111-7111-8111-111111111111', %L, '0a111111-1111-7111-8111-111111111111',
              'd3333333-3333-7333-8333-333333333333', 'glabela',
              '04111111-1111-7111-8111-111111111111', 20, 'U')$sql$, v_session),
    'exige lote rastreado');

  -- Lote vencido: recusado.
  perform test.rejects('rastreio',
    'aplicacao com lote vencido e recusada',
    format($sql$insert into injectable_application
      (tenant_id, session_id, patient_id, provider_id, region_code, product_id, product_lot_id, quantity, quantity_unit)
      values ('11111111-1111-7111-8111-111111111111', %L, '0a111111-1111-7111-8111-111111111111',
              'd3333333-3333-7333-8333-333333333333', 'glabela',
              '04111111-1111-7111-8111-111111111111', '06222222-2222-7222-8222-222222222222', 20, 'U')$sql$, v_session),
    'venceu em');

  -- Lote de outro produto: recusado.
  perform test.rejects('rastreio',
    'lote de produto diferente e recusado',
    format($sql$insert into injectable_application
      (tenant_id, session_id, patient_id, provider_id, region_code, product_id, product_lot_id, quantity, quantity_unit)
      values ('11111111-1111-7111-8111-111111111111', %L, '0a111111-1111-7111-8111-111111111111',
              'd3333333-3333-7333-8333-333333333333', 'glabela',
              '04111111-1111-7111-8111-111111111111', '06333333-3333-7333-8333-333333333333', 20, 'U')$sql$, v_session),
    'outro produto');

  -- Lote valido: aceito, e o banco congela numero e validade no registro clinico.
  insert into injectable_application
    (tenant_id, session_id, patient_id, provider_id, region_code, product_id, product_lot_id,
     quantity, quantity_unit, unit_cost_cents, unit_price_cents, depth)
  values ('11111111-1111-7111-8111-111111111111', v_session, '0a111111-1111-7111-8111-111111111111',
          'd3333333-3333-7333-8333-333333333333', 'glabela',
          '04111111-1111-7111-8111-111111111111', '06111111-1111-7111-8111-111111111111',
          20, 'U', 880, 5000, 'intramuscular')
  returning id into v_app;

  select lot_number, lot_expires_on into v_lot, v_exp
  from injectable_application where id = v_app;

  perform test.check('rastreio', 'lote e validade sao congelados no registro clinico',
    v_lot = 'TOX-2027A' and v_exp > current_date, format('lote=%s validade=%s', v_lot, v_exp));

  -- Lote bloqueado (recall) deixa de poder ser aplicado.
  update product_lot set is_blocked = true, blocked_reason = 'Recall do fabricante'
   where id = '06111111-1111-7111-8111-111111111111';

  perform test.rejects('rastreio',
    'lote bloqueado por recall nao pode mais ser aplicado',
    format($sql$insert into injectable_application
      (tenant_id, session_id, patient_id, provider_id, region_code, product_id, product_lot_id, quantity, quantity_unit)
      values ('11111111-1111-7111-8111-111111111111', %L, '0a111111-1111-7111-8111-111111111111',
              'd3333333-3333-7333-8333-333333333333', 'malar_dir',
              '04111111-1111-7111-8111-111111111111', '06111111-1111-7111-8111-111111111111', 10, 'U')$sql$, v_session),
    'bloqueado');

  -- Recall reverso: quem recebeu o lote recolhido.
  select count(*) into v_qty
  from injectable_application
  where product_lot_id = '06111111-1111-7111-8111-111111111111';
  perform test.check('rastreio', 'recall reverso encontra quem recebeu o lote', v_qty = 1,
    format('%s aplicacoes', v_qty));

  update product_lot set is_blocked = false, blocked_reason = null
   where id = '06111111-1111-7111-8111-111111111111';
end;
$$;

-- ----------------------------------------------------------------- estoque --
do $$
declare
  v_saldo numeric;
begin
  select quantity into v_saldo from stock_balance
  where product_id = '04111111-1111-7111-8111-111111111111'
    and lot_id = '06111111-1111-7111-8111-111111111111';
  -- Em UNIDADE DE ESTOQUE (frasco), nao em unidade de uso (U). A 0032 fixou a
  -- lingua do campo; antes disso o seed lancava toxina em U e resina em tubo,
  -- e o mesmo numero significava coisas diferentes por produto.
  perform test.check('estoque', 'saldo inicial veio das movimentacoes', v_saldo = 5,
    format('saldo=%s', v_saldo));

  insert into stock_movement (tenant_id, unit_id, product_id, lot_id, kind, quantity,
                              unit_cost_cents, patient_id, performed_by)
  values ('11111111-1111-7111-8111-111111111111', 'a1111111-1111-7111-8111-111111111111',
          '04111111-1111-7111-8111-111111111111', '06111111-1111-7111-8111-111111111111',
          'consumption', -0.2, 88000,
          '0a111111-1111-7111-8111-111111111111', 'd3333333-3333-7333-8333-333333333333');

  select quantity into v_saldo from stock_balance
  where product_id = '04111111-1111-7111-8111-111111111111'
    and lot_id = '06111111-1111-7111-8111-111111111111'
    and unit_id = 'a1111111-1111-7111-8111-111111111111';
  -- 0,2 frasco = 20 U de um frasco de 100 U. Saldo fracionario nao e defeito:
  -- e "quatro frascos fechados e um comecado", que e o que ha na geladeira.
  perform test.check('estoque', 'baixa de consumo atualiza o saldo', v_saldo = 4.8,
    format('saldo=%s', v_saldo));

  perform test.rejects('estoque',
    'movimentacao de estoque nao pode ser alterada',
    $sql$update stock_movement set quantity = -1 where kind = 'consumption'$sql$);

  perform test.rejects('estoque',
    'movimentacao de estoque nao pode ser apagada',
    $sql$delete from stock_movement where kind = 'consumption'$sql$);

  perform test.rejects('estoque',
    'consumo de lote vencido e recusado (deve ser perda)',
    $sql$insert into stock_movement (tenant_id, unit_id, product_id, lot_id, location_id, kind, quantity, performed_by)
         values ('11111111-1111-7111-8111-111111111111', 'a1111111-1111-7111-8111-111111111111',
                 '04111111-1111-7111-8111-111111111111', '06222222-2222-7222-8222-222222222222',
                 '05111111-1111-7111-8111-111111111111', 'consumption', -5,
                 'd3333333-3333-7333-8333-333333333333')$sql$,
    'vencido');

  perform test.rejects('estoque',
    'produto com controle de lote exige lote na movimentacao',
    $sql$insert into stock_movement (tenant_id, unit_id, product_id, location_id, kind, quantity, performed_by)
         values ('11111111-1111-7111-8111-111111111111', 'a1111111-1111-7111-8111-111111111111',
                 '04111111-1111-7111-8111-111111111111',
                 '05111111-1111-7111-8111-111111111111', 'consumption', -5,
                 'd3333333-3333-7333-8333-333333333333')$sql$,
    'exige controle de lote');

  perform test.rejects('estoque',
    'perda sem motivo registrado e recusada',
    $sql$insert into stock_movement (tenant_id, unit_id, product_id, lot_id, location_id, kind, quantity, performed_by)
         values ('11111111-1111-7111-8111-111111111111', 'a1111111-1111-7111-8111-111111111111',
                 '04111111-1111-7111-8111-111111111111', '06222222-2222-7222-8222-222222222222',
                 '05111111-1111-7111-8111-111111111111', 'loss', -5,
                 'd3333333-3333-7333-8333-333333333333')$sql$,
    'stock_movement_reason');
end;
$$;
