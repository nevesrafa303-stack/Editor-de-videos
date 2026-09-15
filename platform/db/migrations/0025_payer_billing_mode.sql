-- =============================================================================
-- 0025 — Como cada convenio fatura
--
-- Convenio odontologico cobra de dois jeitos, e a diferenca nao e um detalhe
-- de cadastro: e QUEM DEVE o dinheiro.
--
--   reembolso  — o paciente paga a clinica e corre atras do convenio depois.
--                Financeiramente identico ao particular; so a TABELA DE PRECO
--                muda.
--   faturado   — o paciente nao paga (ou paga so a coparticipacao), e a
--                clinica emite guia, envia lote e espera o repasse, que vem
--                parcial quando ha glosa. E um ciclo de vida paralelo ao do
--                recebimento particular.
--
-- Esta migration entrega o REEMBOLSO inteiro e recusa explicitamente o
-- faturado. Aceitar um orcamento faturado hoje geraria parcelas no nome do
-- paciente — uma divida que ele nao tem. Recusar com uma frase que explica e
-- melhor do que cobrar a pessoa errada e descobrir no telefonema dela.
-- =============================================================================

create type payer_billing_mode as enum ('reimbursement', 'invoiced');

comment on type payer_billing_mode is
  'reimbursement: o paciente paga e pede reembolso. invoiced: a clinica fatura o convenio por guia.';

alter table payer
  add column billing_mode payer_billing_mode not null default 'reimbursement',
  add column notes text;

comment on column payer.billing_mode is
  'Decide quem deve o dinheiro. Muda o financeiro inteiro, nao so a tabela de preco.';

-- --------------------------------------------- recusa explicita do faturado --
create or replace function build_receivable_from_quote(p_quote_id uuid)
returns uuid
language plpgsql
as $$
declare
  q            record;
  v_mode       payer_billing_mode;
  v_payer_name text;
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
    select p.billing_mode, p.name into v_mode, v_payer_name
    from payer p where p.id = q.payer_id;

    if v_mode = 'invoiced' then
      raise exception
        'O convenio % e faturado por guia, e esse fluxo ainda nao existe no sistema. '
        'Emita a guia por fora, ou use um convenio de reembolso.', v_payer_name
        using errcode = 'check_violation';
    end if;
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
  'Cria o recebivel e as parcelas de um orcamento aceito. Idempotente. Recusa convenio faturado por guia.';
