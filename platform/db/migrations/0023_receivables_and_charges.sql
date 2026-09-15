-- =============================================================================
-- 0023 — Do aceite ao caixa
--
-- Tres regras entram no banco aqui, e nenhuma delas pode viver so na aplicacao:
--
-- 1. ACEITAR ORCAMENTO GERA AS PARCELAS. Na mesma transacao, sempre. Se isso
--    dependesse de a aplicacao lembrar de chamar, um importador, um script de
--    correcao ou um retry pela metade deixaria orcamento fechado sem nada a
--    receber — e a clinica descobriria no fechamento do mes.
--
-- 2. AS PARCELAS SOMAM O TOTAL. Dividir R$ 2.380,00 em 6 da R$ 396,666…
--    Arredondar cada uma para cima produz R$ 2.380,02: dois centavos que o
--    paciente nao deve e que o caixa nunca fecha.
--
-- 3. COMISSAO NASCE DO RECEBIMENTO, nao da execucao. Paciente que parcelou em
--    10x e parou na 3a nao gera comissao sobre as 7 restantes. E estorno
--    desfaz a comissao junto — senao a clinica paga por dinheiro que devolveu.
--
-- Multa e juros de mora ficam como POLITICA da rede, com os padroes do CDC
-- (2% de multa, 1% ao mes de juros). O valor devido e calculado na hora do
-- recebimento, nunca gravado: parcela vencida vale um numero diferente a cada
-- dia, e congelar isso numa coluna seria mentir amanha.
-- =============================================================================

-- ------------------------------------------------------------- politica ----
alter table tenant_policy
  add column late_fine_percent numeric(5, 2) not null default 2.00
    check (late_fine_percent between 0 and 20),
  add column late_interest_percent_month numeric(5, 2) not null default 1.00
    check (late_interest_percent_month between 0 and 20);

comment on column tenant_policy.late_fine_percent is
  'Multa de mora, uma vez sobre o saldo vencido. Padrao 2% (CDC).';
comment on column tenant_policy.late_interest_percent_month is
  'Juros de mora ao mes, pro rata die sobre o saldo vencido. Padrao 1% (CDC).';

-- ------------------------------------------------------ divisao exata ------
create or replace function split_amount(p_total bigint, p_parts int)
returns bigint[]
language plpgsql
immutable
as $$
declare
  v_base bigint;
  v_rest bigint;
  v_out  bigint[];
begin
  if p_parts < 1 then
    raise exception 'Numero de parcelas invalido: %', p_parts using errcode = 'check_violation';
  end if;

  v_base := p_total / p_parts;
  v_rest := p_total - (v_base * p_parts);

  -- O resto vai para a PRIMEIRA: as seguintes ficam todas iguais, que e o que
  -- o paciente confere no carne, e a diferenca e cobrada no comeco.
  v_out := array_fill(v_base, array[p_parts]);
  v_out[1] := v_base + v_rest;

  return v_out;
end;
$$;

comment on function split_amount(bigint, int) is
  'Divide um valor em centavos em parcelas que somam EXATAMENTE o valor.';

-- --------------------------------------------- aceite gera o recebivel -----
create or replace function build_receivable_from_quote(p_quote_id uuid)
returns uuid
language plpgsql
as $$
declare
  q            record;
  v_receivable uuid;
  v_entrada    bigint;
  v_restante   bigint;
  v_valores    bigint[];
  v_total_par  int;
  i            int;
begin
  select * into q from quote where id = p_quote_id;

  if q is null or q.total_cents <= 0 then
    return null;
  end if;

  -- Idempotencia: reabrir e reaceitar nao pode cobrar duas vezes.
  select id into v_receivable
    from receivable
   where quote_id = p_quote_id and status <> 'canceled'
   limit 1;

  if v_receivable is not null then
    return v_receivable;
  end if;

  insert into receivable (
    tenant_id, unit_id, patient_id, payer_id, origin, quote_id,
    total_cents, description, created_by
  ) values (
    q.tenant_id, q.unit_id, q.patient_id, q.payer_id, 'quote', q.id,
    q.total_cents, coalesce(q.title, 'Orcamento ' || q.number), q.created_by
  )
  returning id into v_receivable;

  v_entrada  := least(q.down_payment_cents, q.total_cents);
  v_restante := q.total_cents - v_entrada;

  v_valores  := split_amount(v_restante, greatest(q.installment_count, 1));
  v_total_par := array_length(v_valores, 1) + (case when v_entrada > 0 then 1 else 0 end);

  if v_entrada > 0 then
    insert into installment (
      tenant_id, unit_id, receivable_id, patient_id,
      number, total_count, due_on, amount_cents
    ) values (
      q.tenant_id, q.unit_id, v_receivable, q.patient_id,
      1, v_total_par, current_date, v_entrada
    );
  end if;

  for i in 1 .. array_length(v_valores, 1) loop
    -- Parcela de valor zero nao existe: `amount_cents > 0` recusaria, e uma
    -- linha de R$ 0,00 no carne do paciente nao significa nada.
    if v_valores[i] > 0 then
      insert into installment (
        tenant_id, unit_id, receivable_id, patient_id,
        number, total_count, due_on, amount_cents
      ) values (
        q.tenant_id, q.unit_id, v_receivable, q.patient_id,
        i + (case when v_entrada > 0 then 1 else 0 end),
        v_total_par,
        current_date + (i * interval '30 days'),
        v_valores[i]
      );
    end if;
  end loop;

  return v_receivable;
end;
$$;

comment on function build_receivable_from_quote(uuid) is
  'Cria o recebivel e as parcelas de um orcamento aceito. Idempotente por orcamento.';

create or replace function quote_accept_builds_receivable() returns trigger
language plpgsql
as $$
begin
  if new.status = 'accepted' and old.status is distinct from 'accepted' then
    perform build_receivable_from_quote(new.id);
  end if;

  return new;
end;
$$;

create trigger quote_build_receivable
  after update of status on quote
  for each row execute function quote_accept_builds_receivable();

-- ------------------------------------------------------ multa e juros ------
create or replace function installment_charges(p_installment_id uuid, p_on date default current_date)
returns table (
  balance_cents  bigint,
  late_days      int,
  fine_cents     bigint,
  interest_cents bigint,
  total_cents    bigint
)
language sql
stable
as $$
  with i as (
    select inst.amount_cents - inst.paid_cents as saldo,
           greatest(p_on - inst.due_on, 0)     as dias,
           inst.status
    from installment inst
    where inst.id = p_installment_id
  ),
  p as (
    select coalesce(tp.late_fine_percent, 0)           as multa,
           coalesce(tp.late_interest_percent_month, 0) as juros
    from tenant_policy tp
    where tp.tenant_id = current_tenant_id()
  )
  select
    i.saldo::bigint,
    i.dias::int,
    -- `floor`, nao arredondamento: numa cobranca contra o paciente, o centavo
    -- da fracao fica com ele. Arredondar para cima cobraria um centavo que a
    -- conta exata nao produziu, e isso aparece no extrato.
    case when i.dias > 0 and i.status <> 'canceled'
         then floor(i.saldo * (select multa from p) / 100)::bigint else 0::bigint end,
    case when i.dias > 0 and i.status <> 'canceled'
         -- Pro rata die: juros do mes divididos por 30 e multiplicados pelos
         -- dias de atraso. Cobrar o mes inteiro no primeiro dia seria multa
         -- disfarcada de juros.
         then floor(i.saldo * (select juros from p) * i.dias / 3000)::bigint else 0::bigint end,
    0::bigint
  from i;
$$;

-- O total e a soma; calcular em SQL puro evita repetir a conta na aplicacao.
create or replace function installment_total_due(p_installment_id uuid, p_on date default current_date)
returns bigint
language sql
stable
as $$
  select c.balance_cents + c.fine_cents + c.interest_cents
  from installment_charges(p_installment_id, p_on) c;
$$;

comment on function installment_charges(uuid, date) is
  'Saldo, multa e juros de uma parcela numa data. Nunca gravado: muda todo dia.';

-- ------------------------------------------------ comissao no recebimento --
create or replace function build_commission_from_payment() returns trigger
language plpgsql
as $$
declare
  v_membership uuid;
  v_rule       record;
  v_amount     bigint;
begin
  -- Estorno desfaz a comissao: a clinica nao paga por dinheiro que devolveu.
  if tg_op = 'UPDATE' and new.status = 'reversed' and old.status = 'confirmed' then
    update commission_entry
       set status = 'canceled',
           notes = coalesce(notes || ' · ', '') || 'Cancelada por estorno do pagamento.'
     where payment_id = new.id and status <> 'paid';
    return new;
  end if;

  if tg_op <> 'INSERT' or new.status <> 'confirmed' then
    return new;
  end if;

  -- Quem atendeu: o profissional do orcamento que originou o recebivel.
  select q.provider_id into v_membership
  from installment i
  join receivable r on r.id = i.receivable_id
  join quote q on q.id = r.quote_id
  where i.id = new.installment_id;

  if v_membership is null then
    return new;
  end if;

  select * into v_rule
  from commission_rule cr
  where cr.tenant_id = new.tenant_id
    and cr.is_active
    and cr.trigger_event = 'on_payment'
    and (cr.membership_id is null or cr.membership_id = v_membership)
    and (cr.unit_id is null or cr.unit_id = new.unit_id)
    and cr.valid_from <= current_date
    and (cr.valid_to is null or cr.valid_to >= current_date)
  order by cr.priority desc, cr.membership_id nulls last
  limit 1;

  if v_rule is null then
    return new;
  end if;

  v_amount := coalesce(
    ((new.amount_cents * v_rule.percent) / 100)::bigint,
    v_rule.fixed_cents,
    0
  );

  insert into commission_entry (
    tenant_id, unit_id, membership_id, rule_id, payment_id,
    basis, base_cents, percent, amount_cents, reference_month
  ) values (
    new.tenant_id, new.unit_id, v_membership, v_rule.id, new.id,
    'received', new.amount_cents, v_rule.percent, v_amount,
    date_trunc('month', new.paid_at)::date
  );

  return new;
end;
$$;

create trigger payment_build_commission
  after insert or update of status on payment
  for each row execute function build_commission_from_payment();

comment on function build_commission_from_payment() is
  'Comissao nasce do recebimento e morre com o estorno. Nunca da execucao.';

-- ------------------------------------------------ numero do recebivel ------
-- `receivable_code_uk` era `unique nulls not distinct (tenant_id, code)` com
-- `code` anulavel. Em NULLS NOT DISTINCT dois NULLs colidem — entao cada rede
-- podia ter UM unico recebivel sem numero, e o segundo era recusado com um
-- erro de chave duplicada que nao explica nada.
--
-- A intencao era "numero unico na rede, quando existir". Duas correcoes:
-- o numero passa a ser atribuido sempre (recebivel precisa ser citavel numa
-- conversa com o paciente), e a unicidade vira indice parcial, que e o que
-- expressa a intencao original.
alter table receivable drop constraint receivable_code_uk;

create unique index receivable_code_uk
  on receivable (tenant_id, code)
  where code is not null;

create or replace function assign_receivable_code() returns trigger
language plpgsql
as $$
begin
  if new.code is null then
    select coalesce(max(code), 0) + 1 into new.code
    from receivable where tenant_id = new.tenant_id;
  end if;
  return new;
end;
$$;

create trigger receivable_assign_code
  before insert on receivable for each row execute function assign_receivable_code();
