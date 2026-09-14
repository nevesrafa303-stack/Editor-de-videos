-- =============================================================================
-- Seed de desenvolvimento.
--
-- Duas redes de proposito: uma rede com duas unidades (para exercitar
-- consolidacao e escopo por unidade) e uma clinica solo (para provar que nada
-- de uma aparece na outra).
--
-- IDs fixos para os testes poderem referenciar sem adivinhar.
-- =============================================================================

-- Rede A: odonto + estetica, duas unidades.
insert into tenant (id, slug, legal_name, trade_name, tax_id, status, timezone) values
  ('11111111-1111-7111-8111-111111111111', 'rede-sorriso',
   'Rede Sorriso Odontologia LTDA', 'Rede Sorriso', '11222333000181', 'active', 'America/Sao_Paulo');

-- Rede B: clinica solo de estetica.
insert into tenant (id, slug, legal_name, trade_name, status) values
  ('22222222-2222-7222-8222-222222222222', 'bella-vita',
   'Bella Vita Estetica ME', 'Bella Vita', 'active');

select bootstrap_tenant_roles('11111111-1111-7111-8111-111111111111');
select bootstrap_tenant_roles('22222222-2222-7222-8222-222222222222');

-- Papel da rede B com id fixo: o teste de isolamento precisa de um id literal
-- da outra rede para provar que o WITH CHECK recusa a escrita cruzada.
insert into role (id, tenant_id, code, name, description, is_system) values
  ('0f222222-2222-7222-8222-222222222222', '22222222-2222-7222-8222-222222222222',
   'auditor', 'Auditor externo', 'Papel customizado da rede B', false);

insert into unit (id, tenant_id, code, name, city, state_code) values
  ('a1111111-1111-7111-8111-111111111111', '11111111-1111-7111-8111-111111111111',
   'CENTRO', 'Sorriso Centro', 'Sao Paulo', 'SP'),
  ('a2222222-2222-7222-8222-222222222222', '11111111-1111-7111-8111-111111111111',
   'ZONASUL', 'Sorriso Zona Sul', 'Sao Paulo', 'SP'),
  ('b1111111-1111-7111-8111-111111111111', '22222222-2222-7222-8222-222222222222',
   'MATRIZ', 'Bella Vita', 'Campinas', 'SP');

-- Senha de todos: "senha-de-teste-123".
-- Hash bcrypt real (custo 12), fixo para o seed ser reproduzivel. Vale so para
-- desenvolvimento e teste; producao nunca recebe este arquivo.
insert into app_user (id, email, full_name, password_hash) values
  ('c1111111-1111-7111-8111-111111111111', 'ana@sorriso.com.br',      'Ana Souza',    '$2b$12$ekMg/cgknKkLyWGLKf9SG.JHM94tfYvjnJKVbSs0AuGocGqdVRwU6'),
  ('c2222222-2222-7222-8222-222222222222', 'bruno@sorriso.com.br',    'Bruno Lima',   '$2b$12$ekMg/cgknKkLyWGLKf9SG.JHM94tfYvjnJKVbSs0AuGocGqdVRwU6'),
  ('c3333333-3333-7333-8333-333333333333', 'carla@sorriso.com.br',    'Carla Mendes', '$2b$12$ekMg/cgknKkLyWGLKf9SG.JHM94tfYvjnJKVbSs0AuGocGqdVRwU6'),
  ('c4444444-4444-7444-8444-444444444444', 'recepcao@sorriso.com.br', 'Juliana Rocha','$2b$12$ekMg/cgknKkLyWGLKf9SG.JHM94tfYvjnJKVbSs0AuGocGqdVRwU6'),
  ('c5555555-5555-7555-8555-555555555555', 'financeiro@sorriso.com.br','Marcos Dias', '$2b$12$ekMg/cgknKkLyWGLKf9SG.JHM94tfYvjnJKVbSs0AuGocGqdVRwU6'),
  ('c6666666-6666-7666-8666-666666666666', 'helena@bellavita.com.br', 'Helena Martins','$2b$12$ekMg/cgknKkLyWGLKf9SG.JHM94tfYvjnJKVbSs0AuGocGqdVRwU6');

insert into membership (id, tenant_id, user_id, role_id, is_provider, council_type, council_number, council_state, specialty, agenda_color)
select
  m.id, m.tenant_id, m.user_id,
  (select r.id from role r where r.tenant_id = m.tenant_id and r.code = m.role_code),
  m.is_provider, m.council_type, m.council_number, m.council_state, m.specialty, m.color
from (values
  ('d1111111-1111-7111-8111-111111111111'::uuid, '11111111-1111-7111-8111-111111111111'::uuid, 'c1111111-1111-7111-8111-111111111111'::uuid, 'owner',        true,  'CRO',  '45123', 'SP', 'Implantodontia',       '#0f766e'),
  ('d2222222-2222-7222-8222-222222222222'::uuid, '11111111-1111-7111-8111-111111111111'::uuid, 'c2222222-2222-7222-8222-222222222222'::uuid, 'professional', true,  'CRO',  '51877', 'SP', 'Ortodontia',           '#7c3aed'),
  ('d3333333-3333-7333-8333-333333333333'::uuid, '11111111-1111-7111-8111-111111111111'::uuid, 'c3333333-3333-7333-8333-333333333333'::uuid, 'professional', true,  'CRBM', '9921',  'SP', 'Harmonizacao facial',  '#db2777'),
  ('d4444444-4444-7444-8444-444444444444'::uuid, '11111111-1111-7111-8111-111111111111'::uuid, 'c4444444-4444-7444-8444-444444444444'::uuid, 'reception',    false, null,    null,   null, null,                   '#64748b'),
  ('d5555555-5555-7555-8555-555555555555'::uuid, '11111111-1111-7111-8111-111111111111'::uuid, 'c5555555-5555-7555-8555-555555555555'::uuid, 'finance',      false, null,    null,   null, null,                   '#64748b'),
  ('d6666666-6666-7666-8666-666666666666'::uuid, '22222222-2222-7222-8222-222222222222'::uuid, 'c6666666-6666-7666-8666-666666666666'::uuid, 'owner',        true,  'CRBM', '7744',  'SP', 'Estetica avancada',    '#b45309')
) as m(id, tenant_id, user_id, role_code, is_provider, council_type, council_number, council_state, specialty, color);

insert into membership_unit (membership_id, unit_id, is_primary) values
  ('d1111111-1111-7111-8111-111111111111', 'a1111111-1111-7111-8111-111111111111', true),
  ('d1111111-1111-7111-8111-111111111111', 'a2222222-2222-7222-8222-222222222222', false),
  ('d2222222-2222-7222-8222-222222222222', 'a1111111-1111-7111-8111-111111111111', true),
  ('d3333333-3333-7333-8333-333333333333', 'a2222222-2222-7222-8222-222222222222', true),
  ('d4444444-4444-7444-8444-444444444444', 'a1111111-1111-7111-8111-111111111111', true),
  ('d5555555-5555-7555-8555-555555555555', 'a1111111-1111-7111-8111-111111111111', true),
  ('d6666666-6666-7666-8666-666666666666', 'b1111111-1111-7111-8111-111111111111', true);

-- Origem de lead e funil.
insert into acquisition_source (id, tenant_id, code, name, channel) values
  ('e1111111-1111-7111-8111-111111111111', '11111111-1111-7111-8111-111111111111', 'INSTAGRAM', 'Instagram', 'organico'),
  ('e2222222-2222-7222-8222-222222222222', '11111111-1111-7111-8111-111111111111', 'INDICACAO', 'Indicacao', 'indicacao'),
  ('e3333333-3333-7333-8333-333333333333', '11111111-1111-7111-8111-111111111111', 'TRAFEGO',   'Trafego pago', 'pago');

insert into pipeline (id, tenant_id, code, name, vertical, is_default) values
  ('f1111111-1111-7111-8111-111111111111', '11111111-1111-7111-8111-111111111111', 'PADRAO', 'Funil padrao', 'geral', true);

insert into pipeline_stage (tenant_id, pipeline_id, code, name, sort_order, win_probability, cooling_days, is_won, is_lost) values
  ('11111111-1111-7111-8111-111111111111', 'f1111111-1111-7111-8111-111111111111', 'NOVO',      'Novo lead',            1, 0.05, 2,  false, false),
  ('11111111-1111-7111-8111-111111111111', 'f1111111-1111-7111-8111-111111111111', 'CONTATO',   'Em contato',           2, 0.15, 3,  false, false),
  ('11111111-1111-7111-8111-111111111111', 'f1111111-1111-7111-8111-111111111111', 'AVALIACAO', 'Avaliacao agendada',   3, 0.40, 5,  false, false),
  ('11111111-1111-7111-8111-111111111111', 'f1111111-1111-7111-8111-111111111111', 'PROPOSTA',  'Proposta enviada',     4, 0.65, 7,  false, false),
  ('11111111-1111-7111-8111-111111111111', 'f1111111-1111-7111-8111-111111111111', 'GANHO',     'Fechado',              5, 1.00, 30, true,  false),
  ('11111111-1111-7111-8111-111111111111', 'f1111111-1111-7111-8111-111111111111', 'PERDIDO',   'Perdido',              6, 0.00, 30, false, true);

insert into loss_reason (tenant_id, code, name, category) values
  ('11111111-1111-7111-8111-111111111111', 'PRECO',       'Preco acima do esperado',       'preco'),
  ('11111111-1111-7111-8111-111111111111', 'SEM_RESPOSTA','Sem resposta apos tentativas',  'sem_resposta'),
  ('11111111-1111-7111-8111-111111111111', 'CONCORRENTE', 'Escolheu outra clinica',        'concorrencia'),
  ('11111111-1111-7111-8111-111111111111', 'ADIOU',       'Adiou o tratamento',            'timing');

-- Catalogo.
insert into procedure_category (id, tenant_id, code, name, vertical) values
  ('01111111-1111-7111-8111-111111111111', '11111111-1111-7111-8111-111111111111', 'ODONTO', 'Odontologia', 'odontologia'),
  ('02222222-2222-7222-8222-222222222222', '11111111-1111-7111-8111-111111111111', 'HOF',    'Harmonizacao facial', 'estetica');

insert into procedure (id, tenant_id, category_id, code, name, vertical, scope, pricing_unit, default_duration_minutes, requires_lot, requires_consent_kind) values
  ('03111111-1111-7111-8111-111111111111', '11111111-1111-7111-8111-111111111111', '01111111-1111-7111-8111-111111111111', 'REST_RESINA', 'Restauracao em resina', 'odontologia', 'surface', 'face',   60, false, null),
  ('03222222-2222-7222-8222-222222222222', '11111111-1111-7111-8111-111111111111', '01111111-1111-7111-8111-111111111111', 'IMPLANTE',    'Implante unitario',     'odontologia', 'tooth',   'dente',  120, true,  'procedimento'),
  ('03333333-3333-7333-8333-333333333333', '11111111-1111-7111-8111-111111111111', '02222222-2222-7222-8222-222222222222', 'TOXINA',      'Toxina botulinica',     'estetica',    'region',  'U',      60, true,  'procedimento'),
  ('03444444-4444-7444-8444-444444444444', '11111111-1111-7111-8111-111111111111', '02222222-2222-7222-8222-222222222222', 'PREENCH',     'Preenchimento com acido hialuronico', 'estetica', 'region', 'ml', 60, true, 'procedimento');

-- Insumos com controle de lote.
insert into product (id, tenant_id, kind, code, name, brand, stock_unit, usage_unit, conversion_factor, requires_lot, requires_refrigeration, min_temperature, max_temperature, min_quantity, default_cost_cents) values
  ('04111111-1111-7111-8111-111111111111', '11111111-1111-7111-8111-111111111111', 'injectable', 'TOX100', 'Toxina botulinica 100U', 'Generico', 'frasco', 'U',  100, true, true,  2, 8, 2, 90000),
  ('04222222-2222-7222-8222-222222222222', '11111111-1111-7111-8111-111111111111', 'injectable', 'AH1ML',  'Acido hialuronico 1ml',  'Generico', 'seringa','ml', 1,   true, true,  2, 25, 3, 55000),
  ('04333333-3333-7333-8333-333333333333', '11111111-1111-7111-8111-111111111111', 'consumable', 'RESINA', 'Resina composta A2',     'Generico', 'tubo',   'g',  4,   false, false, null, null, 5, 12000);

insert into stock_location (id, tenant_id, unit_id, code, name, kind) values
  ('05111111-1111-7111-8111-111111111111', '11111111-1111-7111-8111-111111111111', 'a1111111-1111-7111-8111-111111111111', 'GELADEIRA', 'Geladeira clinica', 'fridge'),
  ('05222222-2222-7222-8222-222222222222', '11111111-1111-7111-8111-111111111111', 'a2222222-2222-7222-8222-222222222222', 'ALMOX',     'Almoxarifado',      'storage');

-- Um lote valido e um vencido: o vencido existe para o teste provar que o banco
-- recusa aplicacao.
insert into product_lot (id, tenant_id, product_id, lot_number, expires_on, unit_cost_cents, received_on) values
  ('06111111-1111-7111-8111-111111111111', '11111111-1111-7111-8111-111111111111', '04111111-1111-7111-8111-111111111111', 'TOX-2027A', current_date + 300, 88000, current_date - 20),
  ('06222222-2222-7222-8222-222222222222', '11111111-1111-7111-8111-111111111111', '04111111-1111-7111-8111-111111111111', 'TOX-VENC',  current_date - 5,   88000, current_date - 400),
  ('06333333-3333-7333-8333-333333333333', '11111111-1111-7111-8111-111111111111', '04222222-2222-7222-8222-222222222222', 'AH-2026B',  current_date + 500, 52000, current_date - 10);

-- Ficha tecnica: quanto cada procedimento consome.
insert into procedure_bom (tenant_id, procedure_id, product_id, quantity, unit, waste_percent) values
  ('11111111-1111-7111-8111-111111111111', '03333333-3333-7333-8333-333333333333', '04111111-1111-7111-8111-111111111111', 30, 'U',  10),
  ('11111111-1111-7111-8111-111111111111', '03444444-4444-7444-8444-444444444444', '04222222-2222-7222-8222-222222222222', 1,  'ml', 5),
  ('11111111-1111-7111-8111-111111111111', '03111111-1111-7111-8111-111111111111', '04333333-3333-7333-8333-333333333333', 0.5,'g',  15);

-- Tabela de precos vigente.
insert into price_list (id, tenant_id, code, name, status, valid_from, activated_at) values
  ('07111111-1111-7111-8111-111111111111', '11111111-1111-7111-8111-111111111111', 'PARTICULAR', 'Particular 2026', 'active', current_date - 30, now());

insert into price_list_item (tenant_id, price_list_id, procedure_id, price_cents, floor_price_cents, expected_cost_cents, max_discount_percent, commission_percent) values
  ('11111111-1111-7111-8111-111111111111', '07111111-1111-7111-8111-111111111111', '03111111-1111-7111-8111-111111111111',  28000,  22000,  1800, 20, 30),
  ('11111111-1111-7111-8111-111111111111', '07111111-1111-7111-8111-111111111111', '03222222-2222-7222-8222-222222222222', 320000, 280000, 90000, 12, 40),
  ('11111111-1111-7111-8111-111111111111', '07111111-1111-7111-8111-111111111111', '03333333-3333-7333-8333-333333333333', 150000, 120000, 29040, 20, 35),
  ('11111111-1111-7111-8111-111111111111', '07111111-1111-7111-8111-111111111111', '03444444-4444-7444-8444-444444444444', 180000, 150000, 54600, 15, 35);

insert into payment_method (id, tenant_id, kind, name, fee_percent, settlement_days, max_installments, affects_cash_session) values
  ('08111111-1111-7111-8111-111111111111', '11111111-1111-7111-8111-111111111111', 'pix',    'PIX',            0.99, 0,  1,  false),
  ('08222222-2222-7222-8222-222222222222', '11111111-1111-7111-8111-111111111111', 'cash',   'Dinheiro',       0,    0,  1,  true),
  ('08333333-3333-7333-8333-333333333333', '11111111-1111-7111-8111-111111111111', 'credit', 'Cartao credito', 3.49, 30, 12, false);

-- Termos versionados.
insert into consent_document (id, tenant_id, kind, version, title, body, body_hash, legal_basis) values
  ('09111111-1111-7111-8111-111111111111', '11111111-1111-7111-8111-111111111111', 'tratamento_dados', 1,
   'Tratamento de dados pessoais e de saude', 'Texto do termo v1.', md5('termo-dados-v1'), 'tutela_da_saude'),
  ('09222222-2222-7222-8222-222222222222', '11111111-1111-7111-8111-111111111111', 'uso_imagem', 1,
   'Uso de imagem', 'Texto do termo de imagem v1.', md5('termo-imagem-v1'), 'consentimento');

-- Pacientes. Mariana autorizou imagem; Roberto nao (o teste usa isso).
insert into patient (id, tenant_id, origin_unit_id, full_name, tax_id, birth_date, phone, email, source_id, status) values
  ('0a111111-1111-7111-8111-111111111111', '11111111-1111-7111-8111-111111111111', 'a1111111-1111-7111-8111-111111111111', 'Mariana Alves',    '52998224725', '1990-03-14', '11987650001', 'mariana@exemplo.com', 'e1111111-1111-7111-8111-111111111111', 'active'),
  ('0a222222-2222-7222-8222-222222222222', '11111111-1111-7111-8111-111111111111', 'a1111111-1111-7111-8111-111111111111', 'Roberto Carvalho', '15350946056', '1982-07-02', '11987650002', 'roberto@exemplo.com', 'e2222222-2222-7222-8222-222222222222', 'active'),
  ('0a333333-3333-7333-8333-333333333333', '22222222-2222-7222-8222-222222222222', 'b1111111-1111-7111-8111-111111111111', 'Paciente da Bella','24971563792', '1995-11-20', '19987650003', null, null, 'active');

insert into patient_consent (tenant_id, patient_id, consent_document_id, signed_hash, ip_address) values
  ('11111111-1111-7111-8111-111111111111', '0a111111-1111-7111-8111-111111111111', '09111111-1111-7111-8111-111111111111', md5('assinatura-1'), '203.0.113.10'),
  ('11111111-1111-7111-8111-111111111111', '0a111111-1111-7111-8111-111111111111', '09222222-2222-7222-8222-222222222222', md5('assinatura-2'), '203.0.113.10'),
  ('11111111-1111-7111-8111-111111111111', '0a222222-2222-7222-8222-222222222222', '09111111-1111-7111-8111-111111111111', md5('assinatura-3'), '203.0.113.11');

insert into resource (id, tenant_id, unit_id, kind, code, name) values
  ('0b111111-1111-7111-8111-111111111111', '11111111-1111-7111-8111-111111111111', 'a1111111-1111-7111-8111-111111111111', 'chair', 'CAD1', 'Cadeira 1'),
  ('0b222222-2222-7222-8222-222222222222', '11111111-1111-7111-8111-111111111111', 'a2222222-2222-7222-8222-222222222222', 'room',  'SALA1', 'Sala de estetica');

-- Estoque inicial.
insert into stock_movement (tenant_id, unit_id, product_id, lot_id, location_id, kind, quantity, unit_cost_cents, performed_by, reason) values
  ('11111111-1111-7111-8111-111111111111', 'a1111111-1111-7111-8111-111111111111', '04111111-1111-7111-8111-111111111111', '06111111-1111-7111-8111-111111111111', '05111111-1111-7111-8111-111111111111', 'purchase', 500, 880, 'd1111111-1111-7111-8111-111111111111', null),
  ('11111111-1111-7111-8111-111111111111', 'a1111111-1111-7111-8111-111111111111', '04222222-2222-7222-8222-222222222222', '06333333-3333-7333-8333-333333333333', '05111111-1111-7111-8111-111111111111', 'purchase', 10,  52000,'d1111111-1111-7111-8111-111111111111', null),
  ('11111111-1111-7111-8111-111111111111', 'a1111111-1111-7111-8111-111111111111', '04333333-3333-7333-8333-333333333333', null, '05111111-1111-7111-8111-111111111111', 'purchase', 20, 12000, 'd1111111-1111-7111-8111-111111111111', null);

-- ---------------------------------------------------------------------------
-- Movimento suficiente para a tela de resumo do paciente mostrar o que ela é.
-- Sem isto, a tela-promessa do produto abre vazia na demonstração.
-- ---------------------------------------------------------------------------

-- Consultas do Roberto: uma feita, uma marcada para amanhã.
insert into appointment (id, tenant_id, unit_id, patient_id, provider_id, procedure_id,
                         starts_at, ends_at, status, notes) values
  ('0c111111-1111-7111-8111-111111111111', '11111111-1111-7111-8111-111111111111',
   'a1111111-1111-7111-8111-111111111111', '0a222222-2222-7222-8222-222222222222',
   'd1111111-1111-7111-8111-111111111111', '03111111-1111-7111-8111-111111111111',
   date_trunc('hour', now()) - interval '9 days', date_trunc('hour', now()) - interval '9 days' + interval '1 hour',
   'completed', 'Paciente relatou sensibilidade no 26.'),
  ('0c222222-2222-7222-8222-222222222222', '11111111-1111-7111-8111-111111111111',
   'a1111111-1111-7111-8111-111111111111', '0a222222-2222-7222-8222-222222222222',
   'd1111111-1111-7111-8111-111111111111', '03222222-2222-7222-8222-222222222222',
   date_trunc('day', now()) + interval '1 day 14 hours', date_trunc('day', now()) + interval '1 day 16 hours',
   'confirmed', 'Instalação do implante no 46.');

-- Anamnese com alerta: é o que aparece em vermelho no topo do prontuário.
insert into form_template (id, tenant_id, kind, code, name, version, schema, published_at) values
  ('0d111111-1111-7111-8111-111111111111', '11111111-1111-7111-8111-111111111111', 'anamnesis',
   'ANAMNESE_GERAL', 'Anamnese geral', 1,
   '[{"key":"alergia","label":"Tem alergia a algum medicamento?","type":"boolean"},
     {"key":"hipertensao","label":"Tem pressão alta?","type":"boolean"},
     {"key":"anticoagulante","label":"Usa anticoagulante?","type":"boolean"}]'::jsonb,
   now());

insert into form_response (tenant_id, patient_id, form_template_id, answers, alerts, filled_by) values
  ('11111111-1111-7111-8111-111111111111', '0a222222-2222-7222-8222-222222222222',
   '0d111111-1111-7111-8111-111111111111',
   '{"alergia": true, "hipertensao": true, "anticoagulante": false}'::jsonb,
   array['Alergia a penicilina', 'Hipertensão controlada'],
   'd1111111-1111-7111-8111-111111111111');

insert into clinical_note (tenant_id, unit_id, patient_id, provider_id, appointment_id, content, created_at) values
  ('11111111-1111-7111-8111-111111111111', 'a1111111-1111-7111-8111-111111111111',
   '0a222222-2222-7222-8222-222222222222', 'd1111111-1111-7111-8111-111111111111',
   '0c111111-1111-7111-8111-111111111111',
   'Restauração em resina no 16 (face oclusal). Anestesia infiltrativa, isolamento absoluto. Orientado sobre sensibilidade nas primeiras 48h.',
   now() - interval '9 days');

-- Plano de tratamento com item pendente: alimenta "tratamentos pendentes".
insert into treatment_plan (id, tenant_id, unit_id, patient_id, provider_id, code, title, status, started_at) values
  ('0e111111-1111-7111-8111-111111111111', '11111111-1111-7111-8111-111111111111',
   'a1111111-1111-7111-8111-111111111111', '0a222222-2222-7222-8222-222222222222',
   'd1111111-1111-7111-8111-111111111111', 1, 'Reabilitação inferior direita', 'active', now() - interval '20 days');

insert into treatment_plan_item (tenant_id, treatment_plan_id, procedure_id, description, tooth_code,
                                 quantity, status, unit_price_cents, sort_order) values
  ('11111111-1111-7111-8111-111111111111', '0e111111-1111-7111-8111-111111111111',
   '03222222-2222-7222-8222-222222222222', 'Implante unitário', '46', 1, 'planned', 320000, 1),
  ('11111111-1111-7111-8111-111111111111', '0e111111-1111-7111-8111-111111111111',
   '03111111-1111-7111-8111-111111111111', 'Restauração em resina', '36', 1, 'planned', 28000, 2);

-- Orçamento aberto da Mariana: esfriando há dez dias.
insert into quote (id, tenant_id, unit_id, patient_id, provider_id, price_list_id, number,
                   status, valid_until, installment_count, sent_at, last_interaction_at, created_at) values
  ('0f111111-1111-7111-8111-111111111111', '11111111-1111-7111-8111-111111111111',
   'a1111111-1111-7111-8111-111111111111', '0a111111-1111-7111-8111-111111111111',
   'd3333333-3333-7333-8333-333333333333', '07111111-1111-7111-8111-111111111111', 1,
   'sent', current_date + 5, 3, now() - interval '10 days', now() - interval '10 days', now() - interval '10 days');

insert into quote_item (tenant_id, quote_id, procedure_id, description, region_code,
                        quantity, quantity_unit, unit_price_cents, unit_cost_cents) values
  ('11111111-1111-7111-8111-111111111111', '0f111111-1111-7111-8111-111111111111',
   '03333333-3333-7333-8333-333333333333', 'Toxina botulínica — terço superior', 'glabela',
   1, 'sessao', 150000, 29040),
  ('11111111-1111-7111-8111-111111111111', '0f111111-1111-7111-8111-111111111111',
   '03444444-4444-7444-8444-444444444444', 'Preenchimento labial', 'labio_superior',
   1, 'ml', 180000, 54600);

-- Recebível do Roberto, com uma parcela vencida: a situação financeira real.
insert into receivable (id, tenant_id, unit_id, patient_id, origin, treatment_plan_id, code,
                        total_cents, description, issued_on) values
  ('10111111-1111-7111-8111-111111111111', '11111111-1111-7111-8111-111111111111',
   'a1111111-1111-7111-8111-111111111111', '0a222222-2222-7222-8222-222222222222',
   'treatment_plan', '0e111111-1111-7111-8111-111111111111', 1,
   348000, 'Reabilitação inferior direita em 4x', current_date - 40);

insert into installment (tenant_id, unit_id, receivable_id, patient_id, number, total_count,
                         due_on, amount_cents, paid_cents, status, payment_method_id) values
  ('11111111-1111-7111-8111-111111111111', 'a1111111-1111-7111-8111-111111111111',
   '10111111-1111-7111-8111-111111111111', '0a222222-2222-7222-8222-222222222222', 1, 4,
   current_date - 40, 87000, 87000, 'paid', '08111111-1111-7111-8111-111111111111'),
  ('11111111-1111-7111-8111-111111111111', 'a1111111-1111-7111-8111-111111111111',
   '10111111-1111-7111-8111-111111111111', '0a222222-2222-7222-8222-222222222222', 2, 4,
   current_date - 9, 87000, 0, 'open', '08111111-1111-7111-8111-111111111111'),
  ('11111111-1111-7111-8111-111111111111', 'a1111111-1111-7111-8111-111111111111',
   '10111111-1111-7111-8111-111111111111', '0a222222-2222-7222-8222-222222222222', 3, 4,
   current_date + 21, 87000, 0, 'open', '08111111-1111-7111-8111-111111111111'),
  ('11111111-1111-7111-8111-111111111111', 'a1111111-1111-7111-8111-111111111111',
   '10111111-1111-7111-8111-111111111111', '0a222222-2222-7222-8222-222222222222', 4, 4,
   current_date + 51, 87000, 0, 'open', '08111111-1111-7111-8111-111111111111');

-- Sinais de oportunidade, como o job noturno os deixaria.
insert into patient_signal (tenant_id, unit_id, patient_id, kind, severity, value_cents, reason, entity, due_on) values
  ('11111111-1111-7111-8111-111111111111', 'a1111111-1111-7111-8111-111111111111',
   '0a222222-2222-7222-8222-222222222222', 'overdue_installment', 4, 87000,
   'Parcela 2/4 venceu há 9 dias e não foi paga.', 'installment', current_date - 9),
  ('11111111-1111-7111-8111-111111111111', 'a1111111-1111-7111-8111-111111111111',
   '0a222222-2222-7222-8222-222222222222', 'pending_treatment', 3, 348000,
   'Dois procedimentos do plano ainda não foram executados.', 'treatment_plan', null),
  ('11111111-1111-7111-8111-111111111111', 'a1111111-1111-7111-8111-111111111111',
   '0a111111-1111-7111-8111-111111111111', 'cooling_quote', 4, 330000,
   'Orçamento enviado há 10 dias sem resposta; validade vence em 5 dias.', 'quote', current_date + 5);

-- Denormalizações que o job noturno manteria.
update patient set last_visit_at = now() - interval '9 days', visit_count = 3,
                   next_appointment_at = date_trunc('day', now()) + interval '1 day 14 hours',
                   open_balance_cents = 261000
 where id = '0a222222-2222-7222-8222-222222222222';
