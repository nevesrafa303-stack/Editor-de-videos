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
  ('e2222222-2222-7222-8222-222222222222', '11111111-1111-7111-8111-111111111111', 'INDICACAO', 'Indicação', 'indicacao'),
  ('e3333333-3333-7333-8333-333333333333', '11111111-1111-7111-8111-111111111111', 'TRAFEGO',   'Tráfego pago', 'pago');

insert into pipeline (id, tenant_id, code, name, vertical, is_default) values
  ('f1111111-1111-7111-8111-111111111111', '11111111-1111-7111-8111-111111111111', 'PADRAO', 'Funil padrão', 'geral', true);

insert into pipeline_stage (tenant_id, pipeline_id, code, name, sort_order, win_probability, cooling_days, is_won, is_lost) values
  ('11111111-1111-7111-8111-111111111111', 'f1111111-1111-7111-8111-111111111111', 'NOVO',      'Novo lead',            1, 0.05, 2,  false, false),
  ('11111111-1111-7111-8111-111111111111', 'f1111111-1111-7111-8111-111111111111', 'CONTATO',   'Em contato',           2, 0.15, 3,  false, false),
  ('11111111-1111-7111-8111-111111111111', 'f1111111-1111-7111-8111-111111111111', 'AVALIACAO', 'Avaliação agendada',   3, 0.40, 5,  false, false),
  ('11111111-1111-7111-8111-111111111111', 'f1111111-1111-7111-8111-111111111111', 'PROPOSTA',  'Proposta enviada',     4, 0.65, 7,  false, false),
  ('11111111-1111-7111-8111-111111111111', 'f1111111-1111-7111-8111-111111111111', 'GANHO',     'Fechado',              5, 1.00, 30, true,  false),
  ('11111111-1111-7111-8111-111111111111', 'f1111111-1111-7111-8111-111111111111', 'PERDIDO',   'Perdido',              6, 0.00, 30, false, true);

insert into loss_reason (tenant_id, code, name, category) values
  ('11111111-1111-7111-8111-111111111111', 'PRECO',       'Preço acima do esperado',       'preco'),
  ('11111111-1111-7111-8111-111111111111', 'SEM_RESPOSTA','Sem resposta após tentativas',  'sem_resposta'),
  ('11111111-1111-7111-8111-111111111111', 'CONCORRENTE', 'Escolheu outra clínica',        'concorrencia'),
  ('11111111-1111-7111-8111-111111111111', 'ADIOU',       'Adiou o tratamento',            'timing');

-- Funil com movimento: um contato quente, um esfriando e um com a ação
-- atrasada. Sem os três, a tela do funil não mostra o que ela existe para
-- mostrar — que é onde os negócios param.
insert into lead (id, tenant_id, unit_id, full_name, phone, email, source_id,
                  interest, status, owner_id, created_at) values
  ('0c111111-1111-7111-8111-111111111111', '11111111-1111-7111-8111-111111111111',
   'a1111111-1111-7111-8111-111111111111', 'Beatriz Lemos', '11987651111',
   'beatriz@exemplo.com', 'e1111111-1111-7111-8111-111111111111',
   'Clareamento e facetas', 'working', 'd1111111-1111-7111-8111-111111111111',
   now() - interval '2 days'),
  ('0c222222-2222-7222-8222-222222222222', '11111111-1111-7111-8111-111111111111',
   'a1111111-1111-7111-8111-111111111111', 'Otávio Prado', '11987652222',
   null, 'e3333333-3333-7333-8333-333333333333',
   'Implante no lugar do 36', 'new', 'd1111111-1111-7111-8111-111111111111',
   now() - interval '12 days'),
  ('0c333333-3333-7333-8333-333333333333', '11111111-1111-7111-8111-111111111111',
   'a1111111-1111-7111-8111-111111111111', 'Renata Vieira', '11987653333',
   'renata@exemplo.com', 'e2222222-2222-7222-8222-222222222222',
   'Harmonização facial', 'working', 'd3333333-3333-7333-8333-333333333333',
   now() - interval '6 days');

insert into opportunity (id, tenant_id, unit_id, pipeline_id, stage_id, lead_id,
                         title, amount_cents, owner_id, source_id, created_at) values
  ('0d111111-1111-7111-8111-111111111111', '11111111-1111-7111-8111-111111111111',
   'a1111111-1111-7111-8111-111111111111', 'f1111111-1111-7111-8111-111111111111',
   (select id from pipeline_stage where pipeline_id = 'f1111111-1111-7111-8111-111111111111' and code = 'AVALIACAO'),
   '0c111111-1111-7111-8111-111111111111', 'Clareamento e facetas', 450000,
   'd1111111-1111-7111-8111-111111111111', 'e1111111-1111-7111-8111-111111111111',
   now() - interval '2 days'),
  ('0d222222-2222-7222-8222-222222222222', '11111111-1111-7111-8111-111111111111',
   'a1111111-1111-7111-8111-111111111111', 'f1111111-1111-7111-8111-111111111111',
   (select id from pipeline_stage where pipeline_id = 'f1111111-1111-7111-8111-111111111111' and code = 'NOVO'),
   '0c222222-2222-7222-8222-222222222222', 'Implante no lugar do 36', 320000,
   'd1111111-1111-7111-8111-111111111111', 'e3333333-3333-7333-8333-333333333333',
   now() - interval '12 days'),
  ('0d333333-3333-7333-8333-333333333333', '11111111-1111-7111-8111-111111111111',
   'a1111111-1111-7111-8111-111111111111', 'f1111111-1111-7111-8111-111111111111',
   (select id from pipeline_stage where pipeline_id = 'f1111111-1111-7111-8111-111111111111' and code = 'CONTATO'),
   '0c333333-3333-7333-8333-333333333333', 'Harmonização facial', 600000,
   'd3333333-3333-7333-8333-333333333333', 'e2222222-2222-7222-8222-222222222222',
   now() - interval '6 days');

-- Beatriz foi falada ontem; Renata há seis dias, e a etapa dela esfria em três.
insert into activity (tenant_id, opportunity_id, kind, body, performed_by, occurred_at) values
  ('11111111-1111-7111-8111-111111111111', '0d111111-1111-7111-8111-111111111111',
   'whatsapp', 'Mandei os valores e as fotos do antes e depois. Vai conversar com o marido.',
   'd1111111-1111-7111-8111-111111111111', now() - interval '1 day'),
  ('11111111-1111-7111-8111-111111111111', '0d333333-3333-7333-8333-333333333333',
   'call', 'Ligou perguntando preço de preenchimento. Passei a faixa e ofereci avaliação.',
   'd3333333-3333-7333-8333-333333333333', now() - interval '6 days');

-- A ação da Renata venceu anteontem: é a linha que a tela precisa gritar.
insert into task (tenant_id, unit_id, opportunity_id, title, due_at, priority,
                  assigned_to, created_by) values
  ('11111111-1111-7111-8111-111111111111', 'a1111111-1111-7111-8111-111111111111',
   '0d111111-1111-7111-8111-111111111111', 'Ligar para saber da decisão',
   now() + interval '2 days', 'normal',
   'd1111111-1111-7111-8111-111111111111', 'd1111111-1111-7111-8111-111111111111'),
  ('11111111-1111-7111-8111-111111111111', 'a1111111-1111-7111-8111-111111111111',
   '0d333333-3333-7333-8333-333333333333', 'Mandar o orçamento de harmonização',
   now() - interval '2 days', 'high',
   'd3333333-3333-7333-8333-333333333333', 'd1111111-1111-7111-8111-111111111111');

-- Catalogo.
insert into procedure_category (id, tenant_id, code, name, vertical) values
  ('01111111-1111-7111-8111-111111111111', '11111111-1111-7111-8111-111111111111', 'ODONTO', 'Odontologia', 'odontologia'),
  ('02222222-2222-7222-8222-222222222222', '11111111-1111-7111-8111-111111111111', 'HOF',    'Harmonizacao facial', 'estetica');

insert into procedure (id, tenant_id, category_id, code, name, vertical, scope, pricing_unit, default_duration_minutes, requires_lot, requires_consent_kind) values
  ('03111111-1111-7111-8111-111111111111', '11111111-1111-7111-8111-111111111111', '01111111-1111-7111-8111-111111111111', 'REST_RESINA', 'Restauração em resina', 'odontologia', 'surface', 'face',   60, false, null),
  ('03222222-2222-7222-8222-222222222222', '11111111-1111-7111-8111-111111111111', '01111111-1111-7111-8111-111111111111', 'IMPLANTE',    'Implante unitário',     'odontologia', 'tooth',   'dente',  120, true,  'procedimento'),
  ('03333333-3333-7333-8333-333333333333', '11111111-1111-7111-8111-111111111111', '02222222-2222-7222-8222-222222222222', 'TOXINA',      'Toxina botulínica',     'estetica',    'region',  'U',      60, true,  'procedimento'),
  ('03444444-4444-7444-8444-444444444444', '11111111-1111-7111-8111-111111111111', '02222222-2222-7222-8222-222222222222', 'PREENCH',     'Preenchimento com ácido hialurônico', 'estetica', 'region', 'ml', 60, true, 'procedimento'),
  -- Escopo `arch`: clareamento é por arcada, não por dente. Serve de exemplo de
  -- procedimento que não pede dente nem face na tela do orçamento.
  ('03555555-5555-7555-8555-555555555555', '11111111-1111-7111-8111-111111111111', '01111111-1111-7111-8111-111111111111', 'CLAREAMENTO', 'Clareamento de consultório', 'odontologia', 'arch', 'sessao', 90, false, null);

-- Insumos com controle de lote.
insert into product (id, tenant_id, kind, code, name, brand, stock_unit, usage_unit, conversion_factor, requires_lot, requires_refrigeration, min_temperature, max_temperature, min_quantity, default_cost_cents) values
  ('04111111-1111-7111-8111-111111111111', '11111111-1111-7111-8111-111111111111', 'injectable', 'TOX100', 'Toxina botulínica 100U', 'Genérico', 'frasco', 'U',  100, true, true,  2, 8, 2, 90000),
  ('04222222-2222-7222-8222-222222222222', '11111111-1111-7111-8111-111111111111', 'injectable', 'AH1ML',  'Ácido hialurônico 1ml',  'Genérico', 'seringa','ml', 1,   true, true,  2, 25, 3, 55000),
  ('04333333-3333-7333-8333-333333333333', '11111111-1111-7111-8111-111111111111', 'consumable', 'RESINA', 'Resina composta A2',     'Genérico', 'tubo',   'g',  4,   false, false, null, null, 5, 12000);

insert into stock_location (id, tenant_id, unit_id, code, name, kind) values
  ('05111111-1111-7111-8111-111111111111', '11111111-1111-7111-8111-111111111111', 'a1111111-1111-7111-8111-111111111111', 'GELADEIRA', 'Geladeira clínica', 'fridge'),
  ('05222222-2222-7222-8222-222222222222', '11111111-1111-7111-8111-111111111111', 'a2222222-2222-7222-8222-222222222222', 'ALMOX',     'Almoxarifado',      'storage');

-- Um lote valido e um vencido: o vencido existe para o teste provar que o banco
-- recusa aplicacao.
insert into product_lot (id, tenant_id, product_id, lot_number, expires_on, unit_cost_cents, received_on) values
  ('06111111-1111-7111-8111-111111111111', '11111111-1111-7111-8111-111111111111', '04111111-1111-7111-8111-111111111111', 'TOX-2027A', current_date + 300, 88000, current_date - 20),
  ('06222222-2222-7222-8222-222222222222', '11111111-1111-7111-8111-111111111111', '04111111-1111-7111-8111-111111111111', 'TOX-VENC',  current_date - 5,   88000, current_date - 400),
  ('06333333-3333-7333-8333-333333333333', '11111111-1111-7111-8111-111111111111', '04222222-2222-7222-8222-222222222222', 'AH-2026B',  current_date + 500, 52000, current_date - 10),
  -- Vencendo em 25 dias, com saldo: é a linha que a tela de validade existe
  -- para mostrar, e sem ela a clínica abre a tela semanal e vê nada.
  ('06444444-4444-7444-8444-444444444444', '11111111-1111-7111-8111-111111111111', '04222222-2222-7222-8222-222222222222', 'AH-CEDO',   current_date + 25,  52000, current_date - 150);

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
  ('11111111-1111-7111-8111-111111111111', '07111111-1111-7111-8111-111111111111', '03444444-4444-7444-8444-444444444444', 180000, 150000, 54600, 15, 35),
  ('11111111-1111-7111-8111-111111111111', '07111111-1111-7111-8111-111111111111', '03555555-5555-7555-8555-555555555555',  90000,  80000,  12000, 10, 20);

-- Convênios: um de reembolso (o paciente paga e pede de volta) e um faturado
-- por guia, que emite guia, entra em lote e espera o repasse.
insert into payer (id, tenant_id, kind, code, name, billing_mode, settlement_days, admin_fee_percent, appeal_days, notes) values
  ('09111111-1111-7111-8111-111111111111', '11111111-1111-7111-8111-111111111111',
   'insurance', 'ODONTO_SAUDE', 'Odonto Saúde', 'reimbursement', 0, 0, 30,
   'Paciente paga a clínica e solicita reembolso com o recibo.'),
  ('09222222-2222-7222-8222-222222222222', '11111111-1111-7111-8111-111111111111',
   'insurance', 'DENTAL_MAIS', 'Dental Mais', 'invoiced', 45, 8, 30,
   'Faturado por guia, com repasse em 45 dias e 30 para recorrer de glosa.');

-- Tabela do Odonto Saúde: mais barata que a particular, como convênio costuma
-- ser. `resolve_price` prefere a tabela do convênio quando há uma.
insert into price_list (id, tenant_id, payer_id, code, name, status, valid_from, activated_at) values
  ('07222222-2222-7222-8222-222222222222', '11111111-1111-7111-8111-111111111111',
   '09111111-1111-7111-8111-111111111111', 'ODONTO_SAUDE_2026', 'Odonto Saúde 2026',
   'active', current_date - 30, now());

insert into price_list_item (tenant_id, price_list_id, procedure_id, price_cents, floor_price_cents, expected_cost_cents, max_discount_percent, commission_percent) values
  ('11111111-1111-7111-8111-111111111111', '07222222-2222-7222-8222-222222222222', '03111111-1111-7111-8111-111111111111',  18000,  16000,  1800,  5, 20),
  ('11111111-1111-7111-8111-111111111111', '07222222-2222-7222-8222-222222222222', '03222222-2222-7222-8222-222222222222', 240000, 220000, 90000,  5, 25);

-- Tabela do Dental Mais, com co-participação: a resina tem R$ 60,00 de parte do
-- paciente e o implante R$ 900,00 (30%). A toxina não está aqui — convênio
-- odontológico não cobre harmonização, e "não cobre" é a ausência da linha.
insert into price_list (id, tenant_id, payer_id, code, name, status, valid_from, activated_at) values
  ('07333333-3333-7333-8333-333333333333', '11111111-1111-7111-8111-111111111111',
   '09222222-2222-7222-8222-222222222222', 'DENTAL_MAIS_2026', 'Dental Mais 2026',
   'active', current_date - 30, now());

insert into price_list_item (tenant_id, price_list_id, procedure_id, price_cents, floor_price_cents, expected_cost_cents, max_discount_percent, commission_percent, patient_share_cents) values
  ('11111111-1111-7111-8111-111111111111', '07333333-3333-7333-8333-333333333333', '03111111-1111-7111-8111-111111111111',  26000,  24000,  1800,  5, 20,   6000),
  ('11111111-1111-7111-8111-111111111111', '07333333-3333-7333-8333-333333333333', '03222222-2222-7222-8222-222222222222', 300000, 280000, 90000,  5, 25,  90000);

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

-- Estoque inicial, em UNIDADE DE ESTOQUE.
--
-- Estava em duas línguas: a toxina lançada em U (500 unidades de uso) e a
-- resina em tubo. Dois significados no mesmo campo é como um estoque começa a
-- divergir da prateleira. A 0032 decidiu — saldo é sempre na unidade em que se
-- compra e se conta — e o seed passou a falar só isso: 5 frascos, 10 seringas,
-- 20 tubos, cada um com o custo do seu frasco/seringa/tubo.
--
-- Sem `location_id`, e isso importa mais do que parece. A chave do saldo é
-- (unidade, produto, lote, LOCAL) com NULLS NOT DISTINCT, então entrada com
-- local e baixa sem local viram DUAS linhas de saldo do mesmo produto. A tela
-- mostraria o mesmo item duas vezes, uma delas negativa. Enquanto local não
-- tem tela, ninguém escreve local — `stock_location` segue modelado e vazio de
-- uso, esperando a clínica que tenha duas geladeiras.
insert into stock_movement (tenant_id, unit_id, product_id, lot_id, kind, quantity, unit_cost_cents, performed_by, reason) values
  ('11111111-1111-7111-8111-111111111111', 'a1111111-1111-7111-8111-111111111111', '04111111-1111-7111-8111-111111111111', '06111111-1111-7111-8111-111111111111', 'purchase', 5,  88000, 'd1111111-1111-7111-8111-111111111111', null),
  ('11111111-1111-7111-8111-111111111111', 'a1111111-1111-7111-8111-111111111111', '04222222-2222-7222-8222-222222222222', '06333333-3333-7333-8333-333333333333', 'purchase', 10, 52000, 'd1111111-1111-7111-8111-111111111111', null),
  ('11111111-1111-7111-8111-111111111111', 'a1111111-1111-7111-8111-111111111111', '04333333-3333-7333-8333-333333333333', null, 'purchase', 20, 12000, 'd1111111-1111-7111-8111-111111111111', null),
  -- Saldo no lote vencido e no que vence em 25 dias. Os dois casos da tela de
  -- validade, e eles pedem coisas diferentes: o vencido pede baixa de perda
  -- hoje, o que vence pede usar antes. Sem saldo, os dois lotes existiriam no
  -- cadastro e em tela nenhuma.
  ('11111111-1111-7111-8111-111111111111', 'a1111111-1111-7111-8111-111111111111', '04111111-1111-7111-8111-111111111111', '06222222-2222-7222-8222-222222222222', 'purchase', 2, 88000, 'd1111111-1111-7111-8111-111111111111', null),
  ('11111111-1111-7111-8111-111111111111', 'a1111111-1111-7111-8111-111111111111', '04222222-2222-7222-8222-222222222222', '06444444-4444-7444-8444-444444444444', 'purchase', 1, 52000, 'd1111111-1111-7111-8111-111111111111', null);

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
   (date_trunc('day', now() at time zone 'America/Sao_Paulo') - interval '9 days' + interval '17 hours') at time zone 'America/Sao_Paulo',
   (date_trunc('day', now() at time zone 'America/Sao_Paulo') - interval '9 days' + interval '18 hours') at time zone 'America/Sao_Paulo',
   'completed', 'Paciente relatou sensibilidade no 26.'),
  ('0c222222-2222-7222-8222-222222222222', '11111111-1111-7111-8111-111111111111',
   'a1111111-1111-7111-8111-111111111111', '0a222222-2222-7222-8222-222222222222',
   'd1111111-1111-7111-8111-111111111111', '03222222-2222-7222-8222-222222222222',
   (date_trunc('day', now() at time zone 'America/Sao_Paulo') + interval '1 day 14 hours') at time zone 'America/Sao_Paulo',
   (date_trunc('day', now() at time zone 'America/Sao_Paulo') + interval '1 day 16 hours') at time zone 'America/Sao_Paulo',
   'confirmed', 'Instalação do implante no 46.');

-- Anamnese com alerta: é o que aparece em vermelho no topo do prontuário.
-- `alert_if` e o que transforma resposta em alerta vermelho no topo da ficha.
-- `equals`: alerta se a resposta for aquilo. `filled`: alerta se houver texto,
-- e `{valor}` no texto e substituido pela resposta.
insert into form_template (id, tenant_id, kind, code, name, version, schema, published_at) values
  ('0d111111-1111-7111-8111-111111111111', '11111111-1111-7111-8111-111111111111', 'anamnesis',
   'ANAMNESE_GERAL', 'Anamnese geral', 1,
   '[{"key":"alergia","label":"Tem alergia a algum medicamento?","type":"boolean","required":true,
      "alert_if":{"equals":true,"text":"Alergia medicamentosa"}},
     {"key":"alergia_qual","label":"Qual alergia?","type":"text",
      "alert_if":{"filled":true,"text":"Alergia: {valor}"}},
     {"key":"hipertensao","label":"Tem pressão alta?","type":"boolean","required":true,
      "alert_if":{"equals":true,"text":"Hipertensão"}},
     {"key":"diabetes","label":"Tem diabetes?","type":"boolean","required":true,
      "alert_if":{"equals":true,"text":"Diabetes"}},
     {"key":"anticoagulante","label":"Usa anticoagulante?","type":"boolean","required":true,
      "alert_if":{"equals":true,"text":"Usa anticoagulante"}},
     {"key":"gestante","label":"Está grávida?","type":"boolean",
      "alert_if":{"equals":true,"text":"Gestante"}},
     {"key":"fumante","label":"Fuma?","type":"boolean"},
     {"key":"medicamentos","label":"Medicamentos em uso","type":"textarea"},
     {"key":"cirurgias","label":"Cirurgias anteriores","type":"textarea"}]'::jsonb,
   now());

insert into form_response (tenant_id, patient_id, form_template_id, answers, alerts, filled_by) values
  ('11111111-1111-7111-8111-111111111111', '0a222222-2222-7222-8222-222222222222',
   '0d111111-1111-7111-8111-111111111111',
   '{"alergia": true, "alergia_qual": "penicilina", "hipertensao": true, "diabetes": false,
     "anticoagulante": false, "gestante": false, "fumante": true,
     "medicamentos": "Losartana 50mg, 1x ao dia.", "cirurgias": "Extração dos sisos em 2018."}'::jsonb,
   array['Alergia medicamentosa', 'Alergia: penicilina', 'Hipertensão'],
   'd1111111-1111-7111-8111-111111111111'),
  ('11111111-1111-7111-8111-111111111111', '0a111111-1111-7111-8111-111111111111',
   '0d111111-1111-7111-8111-111111111111',
   '{"alergia": false, "hipertensao": false, "diabetes": false, "anticoagulante": false,
     "gestante": false, "fumante": false, "medicamentos": "Nenhum."}'::jsonb,
   array[]::text[],
   'd1111111-1111-7111-8111-111111111111');

insert into clinical_note (tenant_id, unit_id, patient_id, provider_id, appointment_id, content, signed_at, signature_hash, created_at) values
  ('11111111-1111-7111-8111-111111111111', 'a1111111-1111-7111-8111-111111111111',
   '0a222222-2222-7222-8222-222222222222', 'd1111111-1111-7111-8111-111111111111',
   '0c111111-1111-7111-8111-111111111111',
   'Restauração em resina no 16 (face oclusal). Anestesia infiltrativa, isolamento absoluto. Orientado sobre sensibilidade nas primeiras 48h.',
   now() - interval '9 days', md5('restauracao-16'), now() - interval '9 days');

-- Plano de tratamento com item pendente: alimenta "tratamentos pendentes".
insert into treatment_plan (id, tenant_id, unit_id, patient_id, provider_id, code, title, status, started_at) values
  ('0e111111-1111-7111-8111-111111111111', '11111111-1111-7111-8111-111111111111',
   'a1111111-1111-7111-8111-111111111111', '0a222222-2222-7222-8222-222222222222',
   'd1111111-1111-7111-8111-111111111111', 1, 'Reabilitação inferior direita', 'active', now() - interval '20 days');

-- A resina precisa das faces: o procedimento tem escopo de superfície, e o
-- banco recusa orçar sem elas. Plano incompleto vira orçamento impossível.
insert into treatment_plan_item (tenant_id, treatment_plan_id, procedure_id, description, tooth_code,
                                 surfaces, quantity, status, unit_price_cents, sort_order) values
  ('11111111-1111-7111-8111-111111111111', '0e111111-1111-7111-8111-111111111111',
   '03222222-2222-7222-8222-222222222222', 'Implante unitário', '46',
   array[]::tooth_surface[], 1, 'planned', 320000, 1),
  ('11111111-1111-7111-8111-111111111111', '0e111111-1111-7111-8111-111111111111',
   '03111111-1111-7111-8111-111111111111', 'Restauração em resina', '36',
   array['O','M']::tooth_surface[], 1, 'planned', 28000, 2);

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


-- ---------------------------------------------------------------------------
-- Um dia de agenda de verdade.
--
-- Sem isto a tela da agenda abre vazia, e agenda vazia nao mostra nada do que
-- a agenda resolve: conflito de horario, confirmacao pendente, falta, encaixe.
-- Todos os horarios sao ancorados em "hoje" no fuso da unidade.
-- ---------------------------------------------------------------------------

-- Mais pacientes: um dia com dois pacientes nao parece um dia.
insert into patient (id, tenant_id, origin_unit_id, full_name, tax_id, birth_date, phone, email, status) values
  ('0a444444-4444-7444-8444-444444444444', '11111111-1111-7111-8111-111111111111', 'a1111111-1111-7111-8111-111111111111', 'Camila Duarte',   '39053344705', '1993-05-22', '11987650004', 'camila@exemplo.com',  'active'),
  ('0a555555-5555-7555-8555-555555555555', '11111111-1111-7111-8111-111111111111', 'a1111111-1111-7111-8111-111111111111', 'Paulo Henrique',  '16899535009', '1978-01-09', '11987650005', null,                  'active'),
  ('0a666666-6666-7666-8666-666666666666', '11111111-1111-7111-8111-111111111111', 'a1111111-1111-7111-8111-111111111111', 'Luiza Prado',     '71428793860', '2001-09-30', '11987650006', 'luiza@exemplo.com',   'active'),
  ('0a777777-7777-7777-8777-777777777777', '11111111-1111-7111-8111-111111111111', 'a1111111-1111-7111-8111-111111111111', 'Sergio Tavares',  '05893784094', '1965-12-03', '11987650007', null,                  'active');

-- Expediente: e o que desenha a grade e o que define ocupacao.
insert into provider_availability (tenant_id, unit_id, membership_id, weekday, starts_at, ends_at, slot_minutes)
select '11111111-1111-7111-8111-111111111111'::uuid, 'a1111111-1111-7111-8111-111111111111'::uuid,
       'd1111111-1111-7111-8111-111111111111'::uuid, d, time '08:00', time '18:00', 30
from generate_series(1, 5) as d
union all
select '11111111-1111-7111-8111-111111111111'::uuid, 'a1111111-1111-7111-8111-111111111111'::uuid,
       'd2222222-2222-7222-8222-222222222222'::uuid, d, time '09:00', time '17:00', 30
from generate_series(1, 5) as d
union all
select '11111111-1111-7111-8111-111111111111'::uuid, 'a2222222-2222-7222-8222-222222222222'::uuid,
       'd3333333-3333-7333-8333-333333333333'::uuid, d, time '10:00', time '19:00', 60
from generate_series(1, 5) as d;

-- Almoco da Ana: a grade tem que mostrar por que aquele buraco existe.
insert into schedule_block (tenant_id, unit_id, membership_id, reason, notes, starts_at, ends_at)
values (
  '11111111-1111-7111-8111-111111111111', 'a1111111-1111-7111-8111-111111111111',
  'd1111111-1111-7111-8111-111111111111', 'lunch', 'Almoço',
  (date_trunc('day', now() at time zone 'America/Sao_Paulo') + interval '12 hours') at time zone 'America/Sao_Paulo',
  (date_trunc('day', now() at time zone 'America/Sao_Paulo') + interval '13 hours') at time zone 'America/Sao_Paulo'
);

-- O dia: cada status que a recepcao ve de manha ate a noite.
insert into appointment (tenant_id, unit_id, patient_id, provider_id, procedure_id,
                         starts_at, ends_at, status, cancel_reason, canceled_by, notes)
select
  '11111111-1111-7111-8111-111111111111'::uuid,
  'a1111111-1111-7111-8111-111111111111'::uuid,
  d.patient_id::uuid,
  d.provider_id::uuid,
  d.procedure_id::uuid,
  (date_trunc('day', now() at time zone 'America/Sao_Paulo') + d.inicio) at time zone 'America/Sao_Paulo',
  (date_trunc('day', now() at time zone 'America/Sao_Paulo') + d.fim)    at time zone 'America/Sao_Paulo',
  d.status::appointment_status,
  d.cancel_reason,
  d.canceled_by,
  d.notes
from (values
  ('0a444444-4444-7444-8444-444444444444', 'd1111111-1111-7111-8111-111111111111', '03111111-1111-7111-8111-111111111111',
   interval '8 hours',                 interval '9 hours',
   'completed', null, null, 'Restauração no 36 concluída.'),
  ('0a555555-5555-7555-8555-555555555555', 'd1111111-1111-7111-8111-111111111111', '03222222-2222-7222-8222-222222222222',
   interval '9 hours',                  interval '10 hours 30 minutes',
   'completed', null, null, null),
  ('0a666666-6666-7666-8666-666666666666', 'd1111111-1111-7111-8111-111111111111', '03111111-1111-7111-8111-111111111111',
   interval '10 hours 30 minutes',      interval '11 hours 30 minutes',
   'arrived', null, null, 'Chegou 10 minutos antes.'),
  ('0a111111-1111-7111-8111-111111111111', 'd1111111-1111-7111-8111-111111111111', '03222222-2222-7222-8222-222222222222',
   interval '14 hours',                 interval '15 hours',
   'confirmed', null, null, 'Confirmou por WhatsApp.'),
  ('0a777777-7777-7777-8777-777777777777', 'd1111111-1111-7111-8111-111111111111', '03111111-1111-7111-8111-111111111111',
   interval '15 hours 30 minutes',      interval '16 hours 30 minutes',
   'scheduled', null, null, null),
  ('0a444444-4444-7444-8444-444444444444', 'd2222222-2222-7222-8222-222222222222', '03333333-3333-7333-8333-333333333333',
   interval '9 hours 30 minutes',       interval '10 hours 30 minutes',
   'no_show', null, null, 'Não atendeu as duas ligações.'),
  ('0a666666-6666-7666-8666-666666666666', 'd2222222-2222-7222-8222-222222222222', '03333333-3333-7333-8333-333333333333',
   interval '11 hours',                 interval '12 hours',
   'confirmed', null, null, null),
  ('0a555555-5555-7555-8555-555555555555', 'd2222222-2222-7222-8222-222222222222', '03222222-2222-7222-8222-222222222222',
   interval '14 hours 30 minutes',      interval '16 hours',
   'scheduled', null, null, 'Encaixe pedido pelo paciente.'),
  ('0a777777-7777-7777-8777-777777777777', 'd2222222-2222-7222-8222-222222222222', '03111111-1111-7111-8111-111111111111',
   interval '16 hours',                 interval '17 hours',
   'canceled', 'Paciente remarcou para a proxima semana.', 'patient', null)
) as d(patient_id, provider_id, procedure_id, inicio, fim, status, cancel_reason, canceled_by, notes);

-- Alguem esperando vaga: e o contraponto da falta e do cancelamento.
insert into waitlist_entry (tenant_id, unit_id, patient_id, procedure_id, provider_id, notes)
values (
  '11111111-1111-7111-8111-111111111111', 'a1111111-1111-7111-8111-111111111111',
  '0a666666-6666-7666-8666-666666666666', '03222222-2222-7222-8222-222222222222',
  'd1111111-1111-7111-8111-111111111111', 'Aceita qualquer horário da tarde.'
);

-- Denormalizações do paciente, recalculadas depois de tudo entrar.
-- Os triggers de 0019 ja mantiveram a maior parte; esta chamada cobre o que
-- foi inserido antes deles existirem e serve de conferencia.
select refresh_patient_rollups();

-- ---------------------------------------------------------------------------
-- Odontograma e evoluções.
--
-- Prontuário vazio não mostra nada do que o prontuário resolve: o que o dente
-- tinha antes, o que foi feito, quem assinou e quando fechou.
-- ---------------------------------------------------------------------------

-- Roberto: boca com histórico. Cárie na oclusal do 36, restauração no 16,
-- ausente o 46 (motivo do implante planejado) e canal no 26.
insert into odontogram_entry (tenant_id, patient_id, tooth_code, surfaces, condition, status, source, provider_id, notes, recorded_at)
values
  ('11111111-1111-7111-8111-111111111111', '0a222222-2222-7222-8222-222222222222',
   '16', array['O']::tooth_surface[], 'restoration', 'executed', 'execution',
   'd1111111-1111-7111-8111-111111111111', 'Resina composta.', now() - interval '9 days'),
  ('11111111-1111-7111-8111-111111111111', '0a222222-2222-7222-8222-222222222222',
   '36', array['O','M']::tooth_surface[], 'caries', 'existing', 'exam',
   'd1111111-1111-7111-8111-111111111111', 'Cárie ativa, dentina.', now() - interval '9 days'),
  ('11111111-1111-7111-8111-111111111111', '0a222222-2222-7222-8222-222222222222',
   '46', array[]::tooth_surface[], 'missing', 'existing', 'exam',
   'd1111111-1111-7111-8111-111111111111', 'Extraído há cerca de dois anos.', now() - interval '9 days'),
  ('11111111-1111-7111-8111-111111111111', '0a222222-2222-7222-8222-222222222222',
   '26', array[]::tooth_surface[], 'root_canal', 'executed', 'execution',
   'd1111111-1111-7111-8111-111111111111', null, now() - interval '2 years'),
  ('11111111-1111-7111-8111-111111111111', '0a222222-2222-7222-8222-222222222222',
   '11', array['V']::tooth_surface[], 'fractured', 'existing', 'exam',
   'd1111111-1111-7111-8111-111111111111', 'Fratura de esmalte, sem exposição.', now() - interval '9 days');

-- Mariana: boca saudável, só uma restauração antiga.
insert into odontogram_entry (tenant_id, patient_id, tooth_code, surfaces, condition, status, source, provider_id, recorded_at)
values
  ('11111111-1111-7111-8111-111111111111', '0a111111-1111-7111-8111-111111111111',
   '37', array['O']::tooth_surface[], 'restoration', 'executed', 'execution',
   'd1111111-1111-7111-8111-111111111111', now() - interval '1 year');

-- Evolução mais antiga, já fechada, com o aditamento que a corrige.
-- É o caso que o produto precisa mostrar bem: o erro não some, ele fica ao
-- lado da correção.
insert into clinical_note (id, tenant_id, unit_id, patient_id, provider_id, content, signed_at, signature_hash, locked_at, created_at)
values (
  '0e999999-9999-7999-8999-999999999999',
  '11111111-1111-7111-8111-111111111111', 'a1111111-1111-7111-8111-111111111111',
  '0a222222-2222-7222-8222-222222222222', 'd1111111-1111-7111-8111-111111111111',
  'Avaliação inicial. Paciente relata dor ao mastigar do lado esquerdo. Exame clínico: cárie oclusal no 37.',
  now() - interval '30 days', md5('avaliacao-inicial'), now() - interval '29 days',
  now() - interval '30 days'
);

insert into clinical_note (tenant_id, unit_id, patient_id, provider_id, content, amends_note_id, amendment_reason, signed_at, signature_hash, created_at)
values (
  '11111111-1111-7111-8111-111111111111', 'a1111111-1111-7111-8111-111111111111',
  '0a222222-2222-7222-8222-222222222222', 'd1111111-1111-7111-8111-111111111111',
  'Correção: a cárie oclusal é no 36, não no 37. O 37 está hígido. Radiografia interproximal anexada ao caso.',
  '0e999999-9999-7999-8999-999999999999',
  'Dente anotado errado na avaliação inicial.',
  now() - interval '29 days', md5('aditamento-1'), now() - interval '29 days'
);

select refresh_patient_rollups();

-- ---------------------------------------------------------------------------
-- Uma segunda parcela vencida, da Camila.
--
-- A do Roberto conta a história dele no resumo do paciente. Esta existe para o
-- financeiro ter o que receber sem consumir aquela — duas suítes de teste
-- disputando a mesma linha do seed passam ou falham conforme a ordem.
-- ---------------------------------------------------------------------------
insert into receivable (id, tenant_id, unit_id, patient_id, origin, total_cents, description, issued_on)
values (
  '10222222-2222-7222-8222-222222222222', '11111111-1111-7111-8111-111111111111',
  'a1111111-1111-7111-8111-111111111111', '0a444444-4444-7444-8444-444444444444',
  'manual', 45000, 'Clareamento de consultório', current_date - 40
);

insert into installment (tenant_id, unit_id, receivable_id, patient_id, number, total_count,
                         due_on, amount_cents) values
  ('11111111-1111-7111-8111-111111111111', 'a1111111-1111-7111-8111-111111111111',
   '10222222-2222-7222-8222-222222222222', '0a444444-4444-7444-8444-444444444444', 1, 1,
   current_date - 25, 45000);

select refresh_patient_rollups();


-- ---------------------------------------------------------------------------
-- Histórico dos últimos meses.
--
-- Sem isto o painel gerencial abre com cinco zeros, e uma tela de zeros não
-- prova nada: não mostra o produto, não pega bug de agregação e não deixa
-- ninguém conferir a conta. O que falta ao seed não é volume, é PASSADO —
-- negócio fechado, dinheiro que entrou, contato que virou paciente e contato
-- que se perdeu, espalhados por três meses para o filtro de período ter o que
-- filtrar.
--
-- Estes orçamentos passam pela máquina de estado de verdade (draft → sent →
-- accepted), e não nascem "aceitos" por insert direto. É mais trabalho e é o
-- ponto: quem monta o seed a mão acaba criando estados que o sistema nunca
-- produziria, e o relatório fica bonito em cima de um banco impossível. Aqui o
-- recebível, as parcelas e a comissão saem das mesmas triggers que a tela usa.
-- ---------------------------------------------------------------------------
do $$
declare
  TENANT   constant uuid := '11111111-1111-7111-8111-111111111111';
  TABELA   constant uuid := '07111111-1111-7111-8111-111111111111';  -- Particular
  PIX      constant uuid := '08111111-1111-7111-8111-111111111111';
  v        record;
  v_quote  uuid;
  v_recv   uuid;
  v_aceito timestamptz;
  v_parc   record;
  v_pagas  int;
begin
  for v in
    select * from (values
      -- Camila, com a Ana, no Centro: fechado há 20 dias e quitado.
      ('0a444444-4444-7444-8444-444444444444'::uuid, 'd1111111-1111-7111-8111-111111111111'::uuid,
       'a1111111-1111-7111-8111-111111111111'::uuid, '03555555-5555-7555-8555-555555555555'::uuid,
       'Clareamento de consultório', null::char(2), array[]::tooth_surface[], null::text,
       90000::bigint, 18000::bigint, 20, 2, 2),
      -- Paulo, com o Bruno, no Centro: fechado no mês passado, metade paga.
      ('0a555555-5555-7555-8555-555555555555'::uuid, 'd2222222-2222-7222-8222-222222222222'::uuid,
       'a1111111-1111-7111-8111-111111111111'::uuid, '03222222-2222-7222-8222-222222222222'::uuid,
       'Implante unitário', '46'::char(2), array[]::tooth_surface[], null::text,
       320000::bigint, 96000::bigint, 45, 4, 2),
      -- Luiza, com a Carla, na Zona Sul: fechado há oito dias, entrada paga.
      ('0a666666-6666-7666-8666-666666666666'::uuid, 'd3333333-3333-7333-8333-333333333333'::uuid,
       'a2222222-2222-7222-8222-222222222222'::uuid, '03333333-3333-7333-8333-333333333333'::uuid,
       'Toxina botulínica — terço superior', null::char(2), array[]::tooth_surface[], 'glabela'::text,
       150000::bigint, 29040::bigint, 8, 3, 1),
      -- Sérgio, com a Ana, na Zona Sul: o mais antigo, quitado.
      ('0a777777-7777-7777-8777-777777777777'::uuid, 'd1111111-1111-7111-8111-111111111111'::uuid,
       'a2222222-2222-7222-8222-222222222222'::uuid, '03111111-1111-7111-8111-111111111111'::uuid,
       'Restauração em resina', '26'::char(2), array['O','M']::tooth_surface[], null::text,
       28000::bigint, 5200::bigint, 70, 1, 1),
      -- Mariana, com a Carla, na Zona Sul: fechado esta semana, nada pago ainda.
      ('0a111111-1111-7111-8111-111111111111'::uuid, 'd3333333-3333-7333-8333-333333333333'::uuid,
       'a2222222-2222-7222-8222-222222222222'::uuid, '03444444-4444-7444-8444-444444444444'::uuid,
       'Preenchimento labial', null::char(2), array[]::tooth_surface[], 'labio_superior'::text,
       180000::bigint, 54600::bigint, 3, 2, 0)
    ) as t(patient_id, provider_id, unit_id, procedure_id, descricao,
           tooth_code, surfaces, region_code, preco, custo, dias, parcelas, pagas)
  loop
    v_aceito := now() - (v.dias || ' days')::interval;

    insert into quote (tenant_id, unit_id, patient_id, provider_id, price_list_id,
                       status, valid_until, installment_count, created_at, sent_at,
                       last_interaction_at)
    values (TENANT, v.unit_id, v.patient_id, v.provider_id, TABELA,
            'draft', (v_aceito + interval '30 days')::date, v.parcelas,
            v_aceito - interval '6 days', v_aceito - interval '6 days', v_aceito)
    returning id into v_quote;

    insert into quote_item (tenant_id, quote_id, procedure_id, description,
                            tooth_code, surfaces, region_code,
                            quantity, quantity_unit, unit_price_cents, unit_cost_cents)
    values (TENANT, v_quote, v.procedure_id, v.descricao,
            v.tooth_code, v.surfaces, v.region_code,
            1, 'procedimento', v.preco, v.custo);

    update quote set status = 'sent' where id = v_quote;

    -- Aceitar exige assinatura: o banco recusa `accepted` sem ela, e é por isso
    -- que o seed assina em vez de contornar. Hash de seed, não de gente.
    update quote
       set status = 'accepted',
           accepted_at = v_aceito,
           signed_hash = md5(v_quote::text || v_aceito::text),
           signed_user_agent = 'Seed de desenvolvimento'
     where id = v_quote;

    select id into v_recv from receivable where quote_id = v_quote;
    update receivable set issued_on = v_aceito::date where id = v_recv;
    update installment
       set due_on = v_aceito::date + ((number - 1) * 30)
     where receivable_id = v_recv;

    -- Pagamento de verdade em cada parcela quitada: é o insert que recalcula o
    -- saldo e gera a comissão. Marcar `paid_cents` a mão daria o mesmo número
    -- na tela e nenhum dos dois efeitos.
    v_pagas := v.pagas;
    for v_parc in
      select * from installment where receivable_id = v_recv order by number limit v_pagas
    loop
      insert into payment (tenant_id, unit_id, installment_id, patient_id,
                           payment_method_id, amount_cents, paid_at)
      values (TENANT, v.unit_id, v_parc.id, v.patient_id, PIX,
              v_parc.amount_cents, (v_parc.due_on + interval '1 day')::timestamptz);
    end loop;
  end loop;
end;
$$;

-- Contatos dos últimos meses, com desfecho: sem ganho E perda no mesmo período
-- a taxa de conversão não tem denominador, e o relatório de origem não separa
-- canal que traz gente de canal que traz gente que fecha.
do $$
declare
  TENANT   constant uuid := '11111111-1111-7111-8111-111111111111';
  FUNIL    constant uuid := 'f1111111-1111-7111-8111-111111111111';
  CENTRO   constant uuid := 'a1111111-1111-7111-8111-111111111111';
  ZONASUL  constant uuid := 'a2222222-2222-7222-8222-222222222222';
  v        record;
  v_lead   uuid;
  v_opp    uuid;
  v_etapa  uuid;
  v_ganho  uuid;
  v_perda  uuid;
begin
  select id into v_ganho from pipeline_stage where pipeline_id = FUNIL and code = 'GANHO';
  select id into v_perda from pipeline_stage where pipeline_id = FUNIL and code = 'PERDIDO';

  for v in
    select * from (values
      -- As duas unidades aparecem: com tudo no Centro, o filtro por unidade
      -- nunca seria exercido, e a profissional da Zona Sul abriria um painel
      -- vazio sem que isso fosse bug nenhum — que e o pior tipo de tela boa.
      ('Vanessa Correia',  '11987661111', 'INSTAGRAM', 38, 'won',  420000::bigint, null::text,           'CENTRO'),
      ('Gustavo Pinheiro', '11987662222', 'TRAFEGO',   33, 'won',  280000::bigint, null::text,           'ZONASUL'),
      ('Débora Nunes',     '11987663333', 'TRAFEGO',   30, 'lost', 150000::bigint, 'PRECO'::text,        'CENTRO'),
      ('Ricardo Salles',   '11987664444', 'TRAFEGO',   26, 'lost', 200000::bigint, 'SEM_RESPOSTA'::text, 'ZONASUL'),
      ('Patrícia Gomes',   '11987665555', 'INDICACAO', 22, 'won',  600000::bigint, null::text,           'ZONASUL'),
      ('Fábio Toledo',     '11987666666', 'INSTAGRAM', 18, 'lost', 90000::bigint,  'ADIOU'::text,        'CENTRO'),
      ('Simone Aguiar',    '11987667777', 'INDICACAO', 14, 'won',  340000::bigint, null::text,           'CENTRO'),
      ('Leandro Bastos',   '11987668888', 'INSTAGRAM',  9, 'lost', 120000::bigint, 'CONCORRENTE'::text,  'ZONASUL'),
      ('Tatiana Freire',   '11987669999', 'TRAFEGO',    5, 'open', 260000::bigint, null::text,           'ZONASUL')
    ) as t(nome, telefone, origem, dias, desfecho, valor, motivo, unidade)
  loop
    insert into lead (tenant_id, unit_id, full_name, phone, source_id, status,
                      owner_id, created_at)
    values (TENANT, case v.unidade when 'ZONASUL' then ZONASUL else CENTRO end,
            v.nome, v.telefone,
            (select id from acquisition_source where tenant_id = TENANT and code = v.origem),
            (case v.desfecho when 'won' then 'qualified'
                             when 'lost' then 'disqualified'
                             else 'working' end)::lead_status,
            'd1111111-1111-7111-8111-111111111111',
            now() - (v.dias || ' days')::interval)
    returning id into v_lead;

    insert into opportunity (tenant_id, unit_id, pipeline_id, stage_id, lead_id,
                             title, amount_cents, owner_id, source_id, created_at)
    values (TENANT, case v.unidade when 'ZONASUL' then ZONASUL else CENTRO end, FUNIL,
            (select id from pipeline_stage where pipeline_id = FUNIL and code = 'NOVO'),
            v_lead, 'Avaliação — ' || v.nome, v.valor,
            'd1111111-1111-7111-8111-111111111111',
            (select id from acquisition_source where tenant_id = TENANT and code = v.origem),
            now() - (v.dias || ' days')::interval)
    returning id into v_opp;

    -- Caminho pelas etapas, uma a uma: é o histórico que o funil de conversão
    -- lê. Quem pula direto para "Ganho" cria um relatório que diz que ninguém
    -- passou pela proposta.
    foreach v_etapa in array (
      select array_agg(id order by sort_order)
        from pipeline_stage
       where pipeline_id = FUNIL
         and sort_order between 2 and (case v.desfecho when 'open' then 3 else 4 end)
    )
    loop
      update opportunity set stage_id = v_etapa where id = v_opp;
    end loop;

    if v.desfecho = 'won' then
      update opportunity
         set stage_id = v_ganho, status = 'won',
             closed_at = now() - ((v.dias - 2) || ' days')::interval
       where id = v_opp;
    elsif v.desfecho = 'lost' then
      update opportunity
         set stage_id = v_perda, status = 'lost',
             loss_reason_id = (select id from loss_reason where tenant_id = TENANT and code = v.motivo),
             closed_at = now() - ((v.dias - 2) || ' days')::interval
       where id = v_opp;
    end if;

    -- O histórico de etapa nasce com `now()`: sem recuar, todo negócio dos
    -- últimos três meses teria passado pelo funil hoje de manhã. E não basta
    -- recuar todas para a mesma data — a ficha do negócio mostra a passagem
    -- etapa a etapa, e quatro movimentos no mesmo segundo é uma história que
    -- não aconteceu. Um dia entre cada um.
    update opportunity_stage_history h
       set changed_at = now() - ((v.dias - passo.n + 1) || ' days')::interval
      from (
        select id, row_number() over (order by changed_at, id) as n
          from opportunity_stage_history
         where opportunity_id = v_opp
      ) as passo
     where h.id = passo.id;

    -- Data da última etapa e data de fechamento saem do PRÓPRIO histórico, não
    -- de aritmética paralela. Contadas à mão elas divergiam: o negócio
    -- aparecia fechado dois dias antes do movimento que o fechou.
    update opportunity o
       set created_at = now() - (v.dias || ' days')::interval,
           stage_changed_at = h.ultimo,
           closed_at = case when o.closed_at is not null then h.ultimo end
      from (
        select max(changed_at) as ultimo
          from opportunity_stage_history
         where opportunity_id = v_opp
      ) as h
     where o.id = v_opp;
  end loop;
end;
$$;

select refresh_patient_rollups();


-- ---------------------------------------------------------------------------
-- O que foi executado — e o material que saiu por causa disso.
--
-- Os orçamentos aceitos acima param no dinheiro: recebível, parcela, comissão.
-- Falta o outro lado, que é a clínica trabalhando: o procedimento sendo feito
-- e o insumo saindo da prateleira. Sem isto o relatório de custo real abre
-- vazio, e a demonstração mostra um estoque que nunca foi usado — que é
-- exatamente o estoque que ninguém confia.
--
-- Cada plano nasce do orçamento aceito e é executado pela função de verdade
-- (`execute_plan_item`), com FEFO e baixa pela ficha técnica. Nada de marcar
-- `status = 'executed'` a mão: seed que pula a função cria um estado que o
-- sistema nunca produziria — item executado sem movimentação nenhuma atrás.
-- ---------------------------------------------------------------------------
do $$
declare
  TENANT  constant uuid := '11111111-1111-7111-8111-111111111111';
  v_q     record;
  v_plano uuid;
  v_item  uuid;
  v_dia   timestamptz;
  v_codigo bigint := 100;
begin
  -- Estoque de operação: os lotes de abertura mal cobrem uma semana. Uma
  -- compra maior, mais antiga, para a clínica parecer o que é — e para a
  -- baixa das execuções não deixar tudo negativo na primeira tela.
  insert into stock_movement (tenant_id, unit_id, product_id, lot_id, kind,
                              quantity, unit_cost_cents, performed_by, occurred_at)
  values
    (TENANT, 'a2222222-2222-7222-8222-222222222222', '04111111-1111-7111-8111-111111111111',
     '06111111-1111-7111-8111-111111111111', 'purchase', 6, 88000,
     'd1111111-1111-7111-8111-111111111111', now() - interval '80 days'),
    (TENANT, 'a2222222-2222-7222-8222-222222222222', '04222222-2222-7222-8222-222222222222',
     '06333333-3333-7333-8333-333333333333', 'purchase', 12, 52000,
     'd1111111-1111-7111-8111-111111111111', now() - interval '80 days'),
    (TENANT, 'a2222222-2222-7222-8222-222222222222', '04333333-3333-7333-8333-333333333333',
     null, 'purchase', 30, 12000,
     'd1111111-1111-7111-8111-111111111111', now() - interval '80 days');

  for v_q in
    select q.id, q.patient_id, q.unit_id, q.provider_id, q.accepted_at, q.title
      from quote q
     where q.tenant_id = TENANT and q.status = 'accepted' and q.accepted_at is not null
     order by q.number
  loop
    v_codigo := v_codigo + 1;
    -- O procedimento acontece alguns dias depois do aceite, não no mesmo dia:
    -- entre fechar e sentar na cadeira existe uma agenda.
    v_dia := v_q.accepted_at + interval '4 days';

    -- Orçamento aceito ontem ainda não virou atendimento.
    continue when v_dia > now();

    insert into treatment_plan (tenant_id, unit_id, patient_id, provider_id, quote_id,
                                code, title, status, started_at, created_at)
    values (TENANT, v_q.unit_id, v_q.patient_id, v_q.provider_id, v_q.id,
            v_codigo, coalesce(v_q.title, 'Tratamento'), 'active', v_dia, v_q.accepted_at)
    returning id into v_plano;

    for v_item in
      with novos as (
        insert into treatment_plan_item
          (tenant_id, treatment_plan_id, procedure_id, quote_item_id, description,
           tooth_code, surfaces, region_code, quantity, unit_price_cents, created_at)
        select TENANT, v_plano, qi.procedure_id, qi.id, qi.description,
               qi.tooth_code, qi.surfaces, qi.region_code, qi.quantity,
               qi.unit_price_cents, v_q.accepted_at
          from quote_item qi
         where qi.quote_id = v_q.id
        returning id
      )
      select id from novos
    loop
      perform execute_plan_item(v_item, v_q.unit_id);

      -- A função carimba com `now()`. O seed quer o atendimento no passado, e
      -- a movimentação junto: as duas datas são o que o relatório de período
      -- lê, e separá-las faria o custo cair num mês e a receita em outro.
      update treatment_plan_item
         set executed_at = v_dia, updated_at = v_dia
       where id = v_item;

      -- `stock_movement` é append-only, e a trigger recusa este update — está
      -- certa. Datar movimentação para trás é falsificar estoque, e nenhum
      -- caminho do produto pode fazer isso: a data de uma baixa é quando ela
      -- aconteceu, ponto.
      --
      -- O seed é o único lugar onde a regra é suspensa, porque ele não está
      -- corrigindo um fato: está FABRICANDO um passado que nunca existiu, para
      -- a demonstração ter história. É desligado e religado na mesma
      -- transação, e o teste que prova a trigger continua de pé.
      alter table stock_movement disable trigger stock_movement_append_only;

      update stock_movement
         set occurred_at = v_dia
       where treatment_plan_item_id = v_item;

      alter table stock_movement enable trigger stock_movement_append_only;
    end loop;
  end loop;
end;
$$;

select refresh_patient_rollups();


-- ---------------------------------------------------------------------------
-- O que se perdeu.
--
-- Nenhuma clínica passa três meses sem quebrar um frasco ou deixar um tubo
-- ressecar, e o relatório que mostra desperdício abrindo zerado ensina a coisa
-- errada: que desperdício é exceção. Ele não é — ele é a linha que ninguém
-- quer ver grande, e precisa existir para poder encolher.
--
-- `occurred_at` vai no INSERT, não num UPDATE depois: a movimentação é
-- append-only, e datar para trás depois de gravada é justamente o que a
-- trigger existe para impedir.
-- ---------------------------------------------------------------------------
insert into stock_movement (tenant_id, unit_id, product_id, lot_id, kind, quantity,
                            unit_cost_cents, reason, performed_by, occurred_at) values
  -- O lote venceu na prateleira. É o desfecho que a tela de validade existe
  -- para evitar, e por isso precisa aparecer no seed junto com ela.
  ('11111111-1111-7111-8111-111111111111', 'a1111111-1111-7111-8111-111111111111',
   '04111111-1111-7111-8111-111111111111', '06222222-2222-7222-8222-222222222222',
   'loss', -1, 88000, 'Lote vencido, descartado conforme protocolo.',
   'd1111111-1111-7111-8111-111111111111', now() - interval '20 days'),

  ('11111111-1111-7111-8111-111111111111', 'a1111111-1111-7111-8111-111111111111',
   '04333333-3333-7333-8333-333333333333', null,
   'loss', -2, 12000, 'Tubo aberto ressecou antes do fim.',
   'd1111111-1111-7111-8111-111111111111', now() - interval '35 days'),

  -- Acerto negativo: o sistema dizia que tinha, e não tinha. Não é perda com
  -- causa conhecida — é a diferença que a contagem revelou, e ela custa igual.
  ('11111111-1111-7111-8111-111111111111', 'a2222222-2222-7222-8222-222222222222',
   '04222222-2222-7222-8222-222222222222', '06333333-3333-7333-8333-333333333333',
   'adjustment', -1, 52000, 'Contagem de fim de mês: faltou uma seringa.',
   'd1111111-1111-7111-8111-111111111111', now() - interval '12 days');
