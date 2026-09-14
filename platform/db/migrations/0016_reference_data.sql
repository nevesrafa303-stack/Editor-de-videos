-- =============================================================================
-- 0016 — Dados de referencia: catalogo de permissoes, dentes (FDI), regioes
-- anatomicas e bootstrap de papeis do tenant.
-- =============================================================================

insert into permission (key, resource, action, description, is_phi) values
  ('tenant.read',            'tenant',         'read',            'Ver dados da rede', false),
  ('tenant.write',           'tenant',         'write',           'Editar dados e plano da rede', false),
  ('unit.read',              'unit',           'read',            'Ver unidades', false),
  ('unit.write',             'unit',           'write',           'Criar e editar unidades', false),
  ('user.read',              'user',           'read',            'Ver equipe', false),
  ('user.write',             'user',           'write',           'Convidar, editar e desativar membros', false),
  ('role.write',             'role',           'write',           'Editar papeis e permissoes', false),
  ('audit.read',             'audit',          'read',            'Ver trilha de auditoria', false),

  ('patient.read',           'patient',        'read',            'Ver cadastro de pacientes', false),
  ('patient.write',          'patient',        'write',           'Criar e editar pacientes', false),
  ('patient.delete',         'patient',        'delete',          'Inativar paciente', false),
  ('consent.read',           'consent',        'read',            'Ver consentimentos', false),
  ('consent.collect',        'consent',        'collect',         'Coletar e revogar consentimento', false),
  ('lgpd.export',            'lgpd',           'export',          'Exportar dados do titular', true),
  ('lgpd.anonymize',         'lgpd',           'anonymize',       'Anonimizar paciente', true),

  ('chart.read',             'chart',          'read',            'Abrir prontuario dos proprios pacientes', true),
  ('chart.read_all',         'chart',          'read_all',        'Abrir prontuario de qualquer paciente', true),
  ('chart.write',            'chart',          'write',           'Registrar evolucao, anamnese e odontograma', true),
  ('chart.sign',             'chart',          'sign',            'Assinar receituario e atestado', true),
  ('chart.amend',            'chart',          'amend',           'Registrar aditamento em evolucao fechada', true),

  ('lead.read',              'lead',           'read',            'Ver leads', false),
  ('lead.write',             'lead',           'write',           'Criar e editar leads', false),
  ('opportunity.read',       'opportunity',    'read',            'Ver funil', false),
  ('opportunity.write',      'opportunity',    'write',           'Mover oportunidade no funil', false),
  ('conversation.read',      'conversation',   'read',            'Ver conversas de WhatsApp', false),
  ('conversation.write',     'conversation',   'write',           'Responder conversas', false),
  ('conversation.assign',    'conversation',   'assign',          'Atribuir conversa a outra pessoa', false),
  ('automation.read',        'automation',     'read',            'Ver automacoes', false),
  ('automation.write',       'automation',     'write',           'Criar e editar automacoes', false),
  ('campaign.read',          'campaign',       'read',            'Ver campanhas', false),
  ('campaign.write',         'campaign',       'write',           'Criar e editar campanhas', false),

  ('appointment.read',       'appointment',    'read',            'Ver agenda', false),
  ('appointment.write',      'appointment',    'write',           'Marcar e remarcar', false),
  ('appointment.cancel',     'appointment',    'cancel',          'Cancelar e registrar falta', false),
  ('agenda.manage',          'agenda',         'manage',          'Definir disponibilidade, bloqueio e recursos', false),

  ('quote.read',             'quote',          'read',            'Ver orcamentos', false),
  ('quote.write',            'quote',          'write',           'Criar e editar orcamentos', false),
  ('quote.approve_discount', 'quote',          'approve_discount','Aprovar desconto acima do teto', false),
  ('quote.accept',           'quote',          'accept',          'Registrar aceite do paciente', false),
  ('treatment_plan.read',    'treatment_plan', 'read',            'Ver planos de tratamento', true),
  ('treatment_plan.write',   'treatment_plan', 'write',           'Montar plano e etapas', true),
  ('treatment_plan.execute', 'treatment_plan', 'execute',         'Marcar item como executado', true),

  ('price.read',             'price',          'read',            'Ver tabela de precos', false),
  ('price.write',            'price',          'write',           'Publicar nova tabela de precos', false),
  ('procedure.read',         'procedure',      'read',            'Ver catalogo de procedimentos', false),
  ('procedure.write',        'procedure',      'write',           'Editar catalogo e ficha tecnica', false),

  ('receivable.read',        'receivable',     'read',            'Ver contas a receber', false),
  ('receivable.write',       'receivable',     'write',           'Criar e renegociar recebiveis', false),
  ('payment.register',       'payment',        'register',        'Registrar recebimento', false),
  ('payment.reverse',        'payment',        'reverse',         'Estornar pagamento', false),
  ('payable.read',           'payable',        'read',            'Ver contas a pagar', false),
  ('payable.write',          'payable',        'write',           'Lancar e pagar contas', false),
  ('cash.open',              'cash',           'open',            'Abrir caixa', false),
  ('cash.close',             'cash',           'close',           'Fechar caixa', false),
  ('cash.audit',             'cash',           'audit',           'Auditar caixa de outro operador', false),
  ('commission.read',        'commission',     'read',            'Ver a propria comissao', false),
  ('commission.read_all',    'commission',     'read_all',        'Ver comissao de toda a equipe', false),
  ('commission.approve',     'commission',     'approve',         'Aprovar comissao para pagamento', false),

  ('inventory.read',         'inventory',      'read',            'Ver estoque', false),
  ('inventory.write',        'inventory',      'write',           'Entrada, transferencia e baixa', false),
  ('inventory.count',        'inventory',      'count',           'Realizar inventario', false),
  ('inventory.adjust',       'inventory',      'adjust',          'Ajustar saldo divergente', false),

  ('report.read',            'report',         'read',            'Ver relatorios operacionais', false),
  ('report.financial',       'report',         'financial',       'Ver relatorios financeiros', false),
  ('report.clinical',        'report',         'clinical',        'Ver relatorios clinicos', true),
  ('report.export',          'report',         'export',          'Exportar relatorio', false);

-- Papeis de sistema e suas permissoes padrao. Pensados como MENOR PRIVILEGIO
-- que ainda permite a pessoa trabalhar: recepcao nao abre prontuario,
-- financeiro nao ve evolucao clinica, profissional nao mexe em tabela de preco.
create table system_role_permission (
  role_code      text not null,
  permission_key text not null references permission (key) on delete cascade,
  primary key (role_code, permission_key)
);

insert into system_role_permission (role_code, permission_key)
select 'owner', key from permission;

insert into system_role_permission (role_code, permission_key)
select 'manager', key from permission
where key not in ('tenant.write', 'lgpd.anonymize');

insert into system_role_permission (role_code, permission_key) values
  ('professional', 'patient.read'),
  ('professional', 'patient.write'),
  ('professional', 'consent.read'),
  ('professional', 'consent.collect'),
  ('professional', 'chart.read'),
  ('professional', 'chart.write'),
  ('professional', 'chart.sign'),
  ('professional', 'chart.amend'),
  ('professional', 'treatment_plan.read'),
  ('professional', 'treatment_plan.write'),
  ('professional', 'treatment_plan.execute'),
  ('professional', 'appointment.read'),
  ('professional', 'appointment.write'),
  ('professional', 'appointment.cancel'),
  ('professional', 'quote.read'),
  ('professional', 'quote.write'),
  ('professional', 'lead.read'),
  ('professional', 'opportunity.read'),
  ('professional', 'opportunity.write'),
  ('professional', 'procedure.read'),
  ('professional', 'price.read'),
  ('professional', 'inventory.read'),
  ('professional', 'inventory.write'),
  ('professional', 'commission.read'),
  ('professional', 'report.read'),
  ('professional', 'report.clinical');

insert into system_role_permission (role_code, permission_key) values
  ('reception', 'patient.read'),
  ('reception', 'patient.write'),
  ('reception', 'consent.read'),
  ('reception', 'consent.collect'),
  ('reception', 'lead.read'),
  ('reception', 'lead.write'),
  ('reception', 'opportunity.read'),
  ('reception', 'opportunity.write'),
  ('reception', 'conversation.read'),
  ('reception', 'conversation.write'),
  ('reception', 'appointment.read'),
  ('reception', 'appointment.write'),
  ('reception', 'appointment.cancel'),
  ('reception', 'agenda.manage'),
  ('reception', 'quote.read'),
  ('reception', 'quote.write'),
  ('reception', 'procedure.read'),
  ('reception', 'price.read'),
  ('reception', 'receivable.read'),
  ('reception', 'payment.register'),
  ('reception', 'cash.open'),
  ('reception', 'cash.close'),
  ('reception', 'inventory.read'),
  ('reception', 'report.read');

insert into system_role_permission (role_code, permission_key) values
  ('finance', 'patient.read'),
  ('finance', 'appointment.read'),
  ('finance', 'quote.read'),
  ('finance', 'price.read'),
  ('finance', 'procedure.read'),
  ('finance', 'receivable.read'),
  ('finance', 'receivable.write'),
  ('finance', 'payment.register'),
  ('finance', 'payment.reverse'),
  ('finance', 'payable.read'),
  ('finance', 'payable.write'),
  ('finance', 'cash.open'),
  ('finance', 'cash.close'),
  ('finance', 'cash.audit'),
  ('finance', 'commission.read_all'),
  ('finance', 'commission.approve'),
  ('finance', 'inventory.read'),
  ('finance', 'report.read'),
  ('finance', 'report.financial'),
  ('finance', 'report.export');

grant select on system_role_permission to crm_app, crm_readonly, crm_job;

-- Cria os papeis de sistema de um tenant novo. Chamada no cadastro da clinica.
create or replace function bootstrap_tenant_roles(p_tenant_id uuid) returns void
language plpgsql
as $$
declare
  r record;
  v_role_id uuid;
begin
  for r in
    select * from (values
      ('owner',        'Proprietario', 'Acesso total, incluindo dados da rede e faturamento'),
      ('manager',      'Gestor',       'Opera a rede inteira, menos dados cadastrais da empresa'),
      ('professional', 'Profissional', 'Agenda, prontuario e plano de tratamento dos seus atendimentos'),
      ('reception',    'Recepcao',     'Agenda, pacientes, funil e recebimento no balcao'),
      ('finance',      'Financeiro',   'Contas, caixa, comissao e relatorios financeiros')
    ) as t(code, name, description)
  loop
    insert into role (tenant_id, code, name, description, is_system)
    values (p_tenant_id, r.code, r.name, r.description, true)
    on conflict (tenant_id, code) do update set name = excluded.name
    returning id into v_role_id;

    insert into role_permission (role_id, permission_key)
    select v_role_id, srp.permission_key
    from system_role_permission srp
    where srp.role_code = r.code
    on conflict do nothing;
  end loop;

  insert into tenant_policy (tenant_id) values (p_tenant_id)
  on conflict (tenant_id) do nothing;
end;
$$;

-- ------------------------------------------------------------------ dentes --
insert into tooth (code, quadrant, position, dentition, name_pt, arch, side)
select
  (q * 10 + p)::text::char(2),
  q,
  p,
  case when q between 1 and 4 then 'permanent' else 'deciduous' end,
  case p
    when 1 then 'Incisivo central'
    when 2 then 'Incisivo lateral'
    when 3 then 'Canino'
    when 4 then 'Primeiro pre-molar'
    when 5 then 'Segundo pre-molar'
    when 6 then 'Primeiro molar'
    when 7 then 'Segundo molar'
    when 8 then 'Terceiro molar'
  end,
  case when q in (1, 2, 5, 6) then 'upper' else 'lower' end,
  case when q in (1, 4, 5, 8) then 'right' else 'left' end
from generate_series(1, 8) q
cross join generate_series(1, 8) p
where (q between 1 and 4)
   or (q between 5 and 8 and p <= 5);

-- Deciduo nao tem pre-molar: os de posicao 4 e 5 sao molares deciduos.
update tooth
   set name_pt = case position when 4 then 'Primeiro molar deciduo'
                               when 5 then 'Segundo molar deciduo' end
 where dentition = 'deciduous' and position in (4, 5);

-- ------------------------------------------------------- regioes faciais ----
insert into body_region (code, name_pt, area_group, is_facial, side, map_x, map_y, risk_notes, sort_order) values
  ('fronte',            'Fronte',                  'terco_superior', true, 'center', 0.5000, 0.1500, 'Ramo frontal do nervo facial', 10),
  ('glabela',           'Glabela',                 'terco_superior', true, 'center', 0.5000, 0.2400, 'Arteria supratroclear: risco de necrose e amaurose', 20),
  ('periorbital_dir',   'Periorbital direita',     'terco_superior', true, 'right',  0.3500, 0.2800, 'Arteria angular', 30),
  ('periorbital_esq',   'Periorbital esquerda',    'terco_superior', true, 'left',   0.6500, 0.2800, 'Arteria angular', 40),
  ('temporal_dir',      'Temporal direita',        'terco_superior', true, 'right',  0.2200, 0.2200, 'Arteria temporal superficial', 50),
  ('temporal_esq',      'Temporal esquerda',       'terco_superior', true, 'left',   0.7800, 0.2200, 'Arteria temporal superficial', 60),
  ('malar_dir',         'Malar direita',           'terco_medio',    true, 'right',  0.3000, 0.4200, 'Forame infraorbitario', 70),
  ('malar_esq',         'Malar esquerda',          'terco_medio',    true, 'left',   0.7000, 0.4200, 'Forame infraorbitario', 80),
  ('sulco_nasogeniano_dir', 'Sulco nasogeniano direito', 'terco_medio', true, 'right', 0.4000, 0.5200, 'Arteria facial', 90),
  ('sulco_nasogeniano_esq', 'Sulco nasogeniano esquerdo', 'terco_medio', true, 'left', 0.6000, 0.5200, 'Arteria facial', 100),
  ('nariz',             'Dorso nasal',             'terco_medio',    true, 'center', 0.5000, 0.4400, 'Arteria dorsal do nariz: alto risco vascular', 110),
  ('labio_superior',    'Labio superior',          'terco_inferior', true, 'center', 0.5000, 0.6100, 'Arteria labial superior', 120),
  ('labio_inferior',    'Labio inferior',          'terco_inferior', true, 'center', 0.5000, 0.6700, 'Arteria labial inferior', 130),
  ('mento',             'Mento',                   'terco_inferior', true, 'center', 0.5000, 0.8000, 'Forame mentoniano', 140),
  ('mandibula_dir',     'Linha mandibular direita','terco_inferior', true, 'right',  0.3000, 0.7400, 'Nervo marginal mandibular', 150),
  ('mandibula_esq',     'Linha mandibular esquerda','terco_inferior',true, 'left',   0.7000, 0.7400, 'Nervo marginal mandibular', 160),
  ('masseter_dir',      'Masseter direito',        'terco_inferior', true, 'right',  0.2600, 0.6400, 'Ducto parotideo', 170),
  ('masseter_esq',      'Masseter esquerdo',       'terco_inferior', true, 'left',   0.7400, 0.6400, 'Ducto parotideo', 180),
  ('papada',            'Regiao submentual',       'pescoco',        true, 'center', 0.5000, 0.8800, 'Nervo marginal mandibular', 190),
  ('pescoco',           'Pescoco',                 'pescoco',        true, 'center', 0.5000, 0.9400, 'Platisma', 200),
  ('abdome',            'Abdome',                  'corpo',          false, 'center', null, null, null, 300),
  ('flancos',           'Flancos',                 'corpo',          false, 'center', null, null, null, 310),
  ('gluteo',            'Gluteo',                  'corpo',          false, 'center', null, null, 'Nervo ciatico', 320),
  ('coxas',             'Coxas',                   'corpo',          false, 'center', null, null, null, 330),
  ('bracos',            'Bracos',                  'corpo',          false, 'center', null, null, null, 340);
