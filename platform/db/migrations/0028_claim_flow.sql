-- =============================================================================
-- 0028 — O fluxo do faturamento: aceite que rota, conferencia e recurso.
--
-- NOTA SOBRE ERRO: as excecoes daqui saem com o codigo PADRAO de RAISE em
-- PL/pgSQL (P0001), sem `using errcode`. Isso e de proposito. O Postgres nunca
-- emite P0001 sozinho — constraint violada e 23514, FK e 23503 —, entao P0001
-- significa exatamente "alguem escreveu esta frase para ser lida". A aplicacao
-- repassa esse codigo inteiro ao usuario com UMA regra, em vez de uma lista de
-- regex que cresce a cada mensagem nova (ver src/shared/postgres-errors.ts).
--
-- A 0025 recusava o aceite de convenio faturado porque nao havia para onde
-- mandar a divida. Agora ha, e a recusa vira roteamento.
--
-- A REGRA DE DINHEIRO QUE ESTE ARQUIVO DEFINE:
--
--   desconto sai da parte do PACIENTE, nunca da parte do convenio.
--
-- A clinica nao pode reduzir por conta propria o que fatura ao convenio: isso
-- e subfaturamento, e o contrato diz quanto vale cada procedimento. O que ela
-- pode negociar e a co-participacao. Entao desconto de item e de cabecalho
-- saem os dois do lado do paciente, e se o desconto passar da parte dele o
-- aceite e recusado com essa frase — em vez de, silenciosamente, a clinica
-- faturar o convenio a menos.
-- =============================================================================

-- -------------------------------------------------------- guia do aceite ----
create or replace function build_claim_from_quote(p_quote_id uuid)
returns uuid
language plpgsql
as $$
declare
  q       record;
  v_claim uuid;
  it      record;
  ordem   int := 0;
begin
  select * into q from quote where id = p_quote_id;
  if q is null or q.payer_id is null then
    return null;
  end if;

  -- Idempotencia, pelo mesmo motivo do recebivel: reabrir e reaceitar nao pode
  -- faturar o convenio duas vezes.
  select id into v_claim
    from claim
   where quote_id = p_quote_id and status <> 'canceled'
   limit 1;

  if v_claim is not null then
    return v_claim;
  end if;

  insert into claim (
    tenant_id, unit_id, payer_id, patient_id, provider_id, quote_id,
    notes, created_by
  ) values (
    q.tenant_id, q.unit_id, q.payer_id, q.patient_id, q.provider_id, q.id,
    coalesce(q.title, 'Orcamento ' || q.number), q.created_by
  )
  returning id into v_claim;

  for it in
    select * from quote_item where quote_id = p_quote_id order by sort_order, created_at
  loop
    -- So entra na guia o que o convenio paga. Item integralmente de
    -- co-participacao (share = preco) nao vira linha de guia: faturar zero ao
    -- convenio e pedir uma glosa de graca.
    if (it.quantity * (it.unit_price_cents - it.patient_share_cents))::bigint > 0 then
      insert into claim_item (
        tenant_id, claim_id, quote_item_id, procedure_id, description,
        tooth_code, surfaces, region_code, quantity, billed_cents, sort_order
      ) values (
        q.tenant_id, v_claim, it.id, it.procedure_id, it.description,
        it.tooth_code, it.surfaces, it.region_code, it.quantity,
        (it.quantity * (it.unit_price_cents - it.patient_share_cents))::bigint,
        ordem
      );
      ordem := ordem + 1;
    end if;
  end loop;

  return v_claim;
end;
$$;

comment on function build_claim_from_quote(uuid) is
  'Cria a guia de um orcamento aceito com convenio faturado. Idempotente.';

-- ------------------------------------------------- aceite: quem deve o que --
create or replace function build_receivable_from_quote(p_quote_id uuid)
returns uuid
language plpgsql
as $$
declare
  q            record;
  v_mode       payer_billing_mode;
  v_share      bigint;
  v_devido     bigint;
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

  if q.payer_id is not null then
    select p.billing_mode into v_mode from payer p where p.id = q.payer_id;
  end if;

  if v_mode = 'invoiced' then
    perform build_claim_from_quote(p_quote_id);

    -- A parte do paciente: co-participacao menos os descontos, que so podem
    -- sair daqui.
    select coalesce(sum((qi.quantity * qi.patient_share_cents)::bigint - qi.discount_cents), 0)
      into v_share
      from quote_item qi where qi.quote_id = q.id;

    v_devido := v_share - q.discount_cents;

    if v_devido < 0 then
      raise exception
        'O desconto de % passa da co-participacao do paciente (%). '
        'Num orcamento faturado por guia o desconto so pode sair da parte dele — '
        'o que o convenio paga e o que esta no contrato.',
        q.discount_cents, v_share;
    end if;
  else
    v_devido := q.total_cents;
  end if;

  -- Convenio que cobre tudo nao deixa divida nenhuma no nome do paciente, e
  -- isso nao e erro: e o caso normal de cobertura integral.
  if v_devido = 0 then
    return null;
  end if;

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
    v_devido,
    case when v_mode = 'invoiced'
      then 'Co-participacao — ' || coalesce(q.title, 'Orcamento ' || q.number)
      else coalesce(q.title, 'Orcamento ' || q.number)
    end,
    q.created_by
  )
  returning id into v_receivable;

  v_entrada  := least(q.down_payment_cents, v_devido);
  v_restante := v_devido - v_entrada;

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
  'Aceite: cria a guia quando o convenio e faturado, e o recebivel do que sobra para o paciente. Idempotente.';

-- ------------------------------------------------------------------ lote ----
-- Devolve o lote aberto do convenio na competencia, criando se nao houver. O
-- indice parcial `claim_batch_open_uk` e quem garante que ele e unico; aqui so
-- se evita a corrida de duas telas abrindo o mesmo lote ao mesmo tempo.
create or replace function open_claim_batch(
  p_tenant_id uuid, p_unit_id uuid, p_payer_id uuid,
  p_competence date, p_created_by uuid default null
) returns uuid
language plpgsql
as $$
declare
  v_batch uuid;
  v_mes   date := date_trunc('month', p_competence)::date;
begin
  select id into v_batch
    from claim_batch
   where tenant_id = p_tenant_id and unit_id = p_unit_id
     and payer_id = p_payer_id and competence = v_mes and status = 'open';

  if v_batch is not null then
    return v_batch;
  end if;

  insert into claim_batch (tenant_id, unit_id, payer_id, competence, created_by)
  values (p_tenant_id, p_unit_id, p_payer_id, v_mes, p_created_by)
  on conflict do nothing
  returning id into v_batch;

  if v_batch is null then
    select id into v_batch
      from claim_batch
     where tenant_id = p_tenant_id and unit_id = p_unit_id
       and payer_id = p_payer_id and competence = v_mes and status = 'open';
  end if;

  return v_batch;
end;
$$;

create or replace function submit_claim_batch(p_batch_id uuid, p_by uuid default null)
returns int
language plpgsql
as $$
declare
  v_qtd int;
begin
  select count(*) into v_qtd
    from claim where batch_id = p_batch_id and status = 'batched';

  if v_qtd = 0 then
    raise exception 'Lote sem guias nao pode ser enviado.';
  end if;

  update claim_batch
     set status = 'submitted', submitted_at = now(), submitted_by = p_by
   where id = p_batch_id;

  update claim
     set status = 'submitted'
   where batch_id = p_batch_id and status = 'batched';

  return v_qtd;
end;
$$;

comment on function submit_claim_batch(uuid, uuid) is
  'Envia o lote: ele e todas as guias dele passam a submitted, na mesma transacao.';

-- ----------------------------------------------------------- conferencia ----
-- Conferir uma linha do demonstrativo. Pagou menos do que foi faturado? A
-- diferenca vira glosa, com o motivo e o prazo — automaticamente, porque
-- depender de alguem lembrar de abrir a glosa e como a clinica perde o prazo.
create or replace function settle_claim_item(
  p_item_id uuid, p_paid_cents bigint,
  p_reason_code text default null, p_reason text default null
) returns uuid
language plpgsql
as $$
declare
  it        record;
  v_data    date;
  v_prazo   int;
  v_glosa   bigint;
  v_denial  uuid;
begin
  select ci.*, c.batch_id, c.payer_id, c.tenant_id as t_id, c.status as claim_status
    into it
    from claim_item ci join claim c on c.id = ci.claim_id
   where ci.id = p_item_id;

  if it is null then
    raise exception 'Linha de guia nao encontrada.';
  end if;

  if it.claim_status not in ('submitted', 'settled') then
    raise exception
      'A guia ainda nao foi enviada ao convenio; nao ha repasse para conferir.';
  end if;

  if p_paid_cents > it.billed_cents then
    raise exception
      'O convenio nao pode ter pago mais do que foi faturado nesta linha (% de %).',
      p_paid_cents, it.billed_cents;
  end if;

  v_glosa := it.billed_cents - p_paid_cents;

  if v_glosa > 0 and coalesce(p_reason, '') = '' then
    raise exception
      'Glosa exige motivo: sem ele nao ha o que recorrer, nem o que negociar no contrato.';
  end if;

  update claim_item
     set paid_cents = p_paid_cents, settled_at = now()
   where id = p_item_id;

  -- Reconferir a mesma linha refaz a glosa: erro de digitacao no demonstrativo
  -- acontece, e o numero errado nao pode virar prejuizo registrado. So vale
  -- enquanto ninguem mexeu nela — a trigger `protect_touched_denial` recusa o
  -- resto, e essa recusa e a mensagem certa para quem esta conferindo.
  if exists (
    select 1 from claim_denial
     where claim_item_id = p_item_id
       and (status <> 'open' or appealed_at is not null)
  ) then
    raise exception
      'Esta linha ja tem glosa com andamento. Corrija pelo recurso, nao reconferindo.';
  end if;

  delete from claim_denial where claim_item_id = p_item_id;

  if v_glosa > 0 then
    select remittance_date into v_data from claim_batch where id = it.batch_id;
    select appeal_days into v_prazo from payer where id = it.payer_id;

    insert into claim_denial (
      tenant_id, claim_item_id, claim_id, amount_cents,
      reason_code, reason, appeal_deadline
    ) values (
      it.t_id, p_item_id, it.claim_id, v_glosa,
      p_reason_code, p_reason,
      coalesce(v_data, current_date) + coalesce(v_prazo, 30)
    )
    returning id into v_denial;
  end if;

  return v_denial;
end;
$$;

comment on function settle_claim_item(uuid, bigint, text, text) is
  'Confere uma linha do demonstrativo. A diferenca vira glosa com motivo e prazo, sem depender de ninguem abrir.';

create or replace function settle_claim_batch(p_batch_id uuid, p_remittance date default null)
returns int
language plpgsql
as $$
declare
  v_pendentes int;
  v_qtd       int;
begin
  if p_remittance is not null then
    update claim_batch set remittance_date = p_remittance where id = p_batch_id;
  end if;

  select count(*) into v_pendentes
    from claim_item ci
    join claim c on c.id = ci.claim_id
   where c.batch_id = p_batch_id and c.status = 'submitted' and ci.paid_cents is null;

  if v_pendentes > 0 then
    raise exception
      'Ainda ha % linha(s) sem conferencia neste lote. Fechar agora esconderia o que falta receber.',
      v_pendentes;
  end if;

  update claim set status = 'settled'
   where batch_id = p_batch_id and status = 'submitted';

  get diagnostics v_qtd = row_count;

  update claim_batch set status = 'settled' where id = p_batch_id;

  return v_qtd;
end;
$$;

-- --------------------------------------------------------------- recurso ----
-- Desfecho da glosa. Recuperar devolve o dinheiro para a LINHA, nao so para o
-- total: sem isso, o relatorio de "quanto este convenio glosa" continuaria
-- contando o que ja foi recuperado.
create or replace function resolve_claim_denial(
  p_denial_id uuid, p_status claim_denial_status,
  p_recovered_cents bigint default 0, p_notes text default null
) returns void
language plpgsql
as $$
declare
  d record;
begin
  select * into d from claim_denial where id = p_denial_id;

  if d is null then
    raise exception 'Glosa nao encontrada.';
  end if;

  if p_status = 'recovered' then
    if p_recovered_cents <= 0 or p_recovered_cents > d.amount_cents then
      raise exception
        'Valor recuperado invalido: % de uma glosa de %.',
        p_recovered_cents, d.amount_cents;
    end if;

    update claim_item
       set paid_cents = coalesce(paid_cents, 0) + p_recovered_cents
     where id = d.claim_item_id;
  end if;

  -- A anotacao vai para a coluna do MOMENTO: o que foi enviado ao recorrer nao
  -- e a mesma coisa que o convenio respondeu depois. Guardar os dois no mesmo
  -- campo faria o segundo apagar o primeiro — e quem volta em trinta dias
  -- precisa saber o que ja foi tentado.
  update claim_denial
     set status           = p_status,
         recovered_cents  = case when p_status = 'recovered' then p_recovered_cents else 0 end,
         appealed_at      = case when p_status = 'appealed' then now() else appealed_at end,
         appeal_notes     = case when p_status = 'appealed'
                                 then coalesce(p_notes, appeal_notes)
                                 else appeal_notes end,
         resolved_at      = case when p_status in ('recovered', 'written_off') then now() else null end,
         resolution_notes = case when p_status in ('recovered', 'written_off')
                                 then coalesce(p_notes, resolution_notes)
                                 else resolution_notes end
   where id = p_denial_id;
end;
$$;

-- Vencimento do prazo e passagem do tempo, nao acao de ninguem. Roda no job
-- noturno, junto do reparo dos rollups.
create or replace function expire_claim_denials() returns int
language plpgsql
as $$
declare
  v_qtd int;
begin
  update claim_denial
     set status = 'expired'
   where status = 'open'
     and appeal_deadline is not null
     and appeal_deadline < current_date;

  get diagnostics v_qtd = row_count;
  return v_qtd;
end;
$$;

comment on function expire_claim_denials() is
  'Marca como vencidas as glosas cujo prazo de recurso passou. Uso: job noturno.';

-- --------------------------------------------- permissoes nos papeis novos --
-- Papel ja criado nao ganha permissao nova sozinho. `bootstrap_tenant_roles` e
-- idempotente e existe exatamente para isto.
do $$
declare
  t uuid;
begin
  for t in select id from tenant loop
    perform bootstrap_tenant_roles(t);
  end loop;
end;
$$;
