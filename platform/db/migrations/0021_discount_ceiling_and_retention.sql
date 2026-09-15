-- =============================================================================
-- 0021 — Teto de desconto por papel, e prazo de retencao do prontuario
--
-- Duas decisoes de produto viram regra de banco aqui.
--
-- TETO DE DESCONTO. Ate agora o unico limite vinha da tabela de precos
-- (`price_list_item.max_discount_percent`), que e um limite por PROCEDIMENTO —
-- serve para proteger margem de item, nao para dizer quem na clinica pode
-- conceder o que. Faltava a alcada: recepcao nao desconta como o dono.
--
-- Os dois limites passam a valer juntos, e o menor manda. Um desconto so entra
-- se couber no teto da tabela E no teto do papel de quem responde por ele —
-- quem edita, ou quem aprovou, se houve aprovacao. Aprovacao nao e um carimbo
-- que libera qualquer valor: ela troca o teto pelo de quem aprovou.
--
-- RETENCAO. O prazo de guarda do prontuario vira configuracao da rede, com
-- padrao de 10 anos. O expurgo automatico NAO esta implementado: o campo
-- registra a politica, e apagar dado clinico e operacao que exige mais do que
-- um job silencioso.
-- =============================================================================

-- ------------------------------------------------------------- alcada -------
alter table role
  add column max_discount_percent numeric(5, 2) not null default 0
  check (max_discount_percent between 0 and 100);

comment on column role.max_discount_percent is
  'Teto de desconto que este papel concede sozinho, em % do subtotal do orcamento.';

-- Padroes para as redes que ja existem. Numeros conservadores de proposito:
-- e mais facil afrouxar depois do que explicar por que a margem sumiu.
update role set max_discount_percent = case code
  when 'owner'        then 100
  when 'manager'      then 20
  when 'professional' then 10
  when 'reception'    then 5
  else 0
end
where is_system;

-- E para as proximas.
create or replace function bootstrap_tenant_roles(p_tenant_id uuid) returns void
language plpgsql
as $$
declare
  r record;
  v_role_id uuid;
begin
  for r in
    select * from (values
      ('owner',        'Proprietario', 'Acesso total, incluindo dados da rede e faturamento', 100),
      ('manager',      'Gestor',       'Opera a rede inteira, menos dados cadastrais da empresa', 20),
      ('professional', 'Profissional', 'Agenda, prontuario e plano de tratamento dos seus atendimentos', 10),
      ('reception',    'Recepcao',     'Agenda, pacientes, funil e recebimento no balcao', 5),
      ('finance',      'Financeiro',   'Contas, caixa, comissao e relatorios financeiros', 0)
    ) as t(code, name, description, discount)
  loop
    insert into role (tenant_id, code, name, description, is_system, max_discount_percent)
    values (p_tenant_id, r.code, r.name, r.description, true, r.discount)
    on conflict (tenant_id, code) do update
      set name = excluded.name,
          max_discount_percent = excluded.max_discount_percent
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

-- --------------------------------------------------------- retencao --------
alter table tenant_policy
  add column chart_retention_years int not null default 10
  check (chart_retention_years between 1 and 50);

comment on column tenant_policy.chart_retention_years is
  'Anos de guarda do prontuario apos o ultimo atendimento. Registra a politica; o expurgo nao e automatico.';

-- ------------------------------------------------- teto combinado ----------
create or replace function check_quote_discount() returns trigger
language plpgsql
as $$
declare
  v_table_cap    bigint;
  v_role_percent numeric(5, 2);
  v_role_cap     bigint;
  v_cap          bigint;
  v_actor        uuid;
begin
  -- Rascunho e onde se experimenta numero. O teto vale na hora de sair da
  -- clinica: enviar, negociar, fechar.
  if new.status = 'draft' or new.discount_cents = 0 then
    return new;
  end if;

  select coalesce(sum(
           ((qi.quantity * qi.unit_price_cents)
             * coalesce(pli.max_discount_percent, 100) / 100)::bigint
         ), 0)
    into v_table_cap
  from quote_item qi
  left join price_list_item pli on pli.id = qi.price_list_item_id
  where qi.quote_id = new.id;

  -- Item digitado a mao, sem tabela de precos por tras, nao tem teto DE TABELA
  -- (o coalesce acima ja cuida). O teto do papel continua valendo — e e ele
  -- que impede o item avulso virar a porta dos fundos do desconto.
  v_actor := coalesce(new.discount_approved_by, current_membership_id(), new.created_by);

  select r.max_discount_percent into v_role_percent
  from membership m
  join role r on r.id = m.role_id
  where m.id = v_actor;

  v_role_cap := ((new.subtotal_cents * coalesce(v_role_percent, 0)) / 100)::bigint;
  v_cap := least(v_table_cap, v_role_cap);

  if new.discount_cents > v_cap then
    raise exception
      'Desconto de % excede o teto de % (tabela: %, alcada do papel: %).',
      new.discount_cents, v_cap, v_table_cap, v_role_cap
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

comment on function check_quote_discount() is
  'Teto de desconto: o menor entre o limite da tabela de precos e a alcada do papel de quem responde.';
