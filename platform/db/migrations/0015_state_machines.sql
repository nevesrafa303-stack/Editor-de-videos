-- =============================================================================
-- 0015 — Maquinas de estado, auditoria e invariantes de negocio no banco.
--
-- Tudo aqui existe porque validacao que so mora no app vaza: import, script de
-- correcao, integracao futura e bug de concorrencia nao passam pelo app.
-- =============================================================================

-- ------------------------------------------------- transicoes permitidas ----
insert into state_transition (entity, from_state, to_state, label, is_terminal) values
  -- Agendamento
  ('appointment', 'scheduled',   'confirmed',   'Paciente confirmou',        false),
  ('appointment', 'scheduled',   'arrived',     'Chegou sem confirmar',      false),
  ('appointment', 'scheduled',   'canceled',    'Cancelado',                 true),
  ('appointment', 'scheduled',   'no_show',     'Faltou',                    true),
  ('appointment', 'confirmed',   'arrived',     'Check-in na recepcao',      false),
  ('appointment', 'confirmed',   'canceled',    'Cancelado',                 true),
  ('appointment', 'confirmed',   'no_show',     'Faltou',                    true),
  ('appointment', 'arrived',     'in_progress', 'Atendimento iniciado',      false),
  ('appointment', 'arrived',     'canceled',    'Desistiu na recepcao',      true),
  ('appointment', 'in_progress', 'completed',   'Atendimento concluido',     true),
  ('appointment', 'in_progress', 'canceled',    'Interrompido',              true),
  -- Reabertura controlada: erro de marcacao acontece, mas fica auditado.
  ('appointment', 'no_show',     'scheduled',   'Reaberto (marcado por engano)', false),
  ('appointment', 'canceled',    'scheduled',   'Reaberto (cancelado por engano)', false),
  ('appointment', 'completed',   'in_progress', 'Reaberto para correcao',    false),

  -- Orcamento
  ('quote', 'draft',       'sent',        'Enviado ao paciente',   false),
  ('quote', 'draft',       'canceled',    'Descartado',            true),
  ('quote', 'sent',        'negotiating', 'Paciente respondeu',    false),
  ('quote', 'sent',        'accepted',    'Fechado',               true),
  ('quote', 'sent',        'rejected',    'Perdido',               true),
  ('quote', 'sent',        'expired',     'Validade vencida',      true),
  ('quote', 'sent',        'canceled',    'Cancelado',             true),
  ('quote', 'negotiating', 'sent',        'Nova versao enviada',   false),
  ('quote', 'negotiating', 'accepted',    'Fechado',               true),
  ('quote', 'negotiating', 'rejected',    'Perdido',               true),
  ('quote', 'negotiating', 'expired',     'Validade vencida',      true),
  ('quote', 'negotiating', 'canceled',    'Cancelado',             true),
  ('quote', 'expired',     'negotiating', 'Reativado',             false),
  ('quote', 'rejected',    'negotiating', 'Reativado',             false),

  -- Parcela
  ('installment', 'open',           'partially_paid', 'Pagamento parcial', false),
  ('installment', 'open',           'paid',           'Quitada',           true),
  ('installment', 'open',           'canceled',       'Cancelada',         true),
  ('installment', 'open',           'renegotiated',   'Renegociada',       true),
  ('installment', 'partially_paid', 'paid',           'Quitada',           true),
  ('installment', 'partially_paid', 'open',           'Pagamento estornado', false),
  ('installment', 'partially_paid', 'renegotiated',   'Renegociada',       true),
  ('installment', 'paid',           'partially_paid', 'Estorno parcial',   false),
  ('installment', 'paid',           'open',           'Estorno total',     false),

  -- Recebivel
  ('receivable', 'open',           'partially_paid', 'Pagamento parcial', false),
  ('receivable', 'open',           'paid',           'Quitado',           true),
  ('receivable', 'open',           'canceled',       'Cancelado',         true),
  ('receivable', 'open',           'renegotiated',   'Renegociado',       true),
  ('receivable', 'partially_paid', 'paid',           'Quitado',           true),
  ('receivable', 'partially_paid', 'open',           'Estornado',         false),
  ('receivable', 'partially_paid', 'renegotiated',   'Renegociado',       true),
  ('receivable', 'paid',           'partially_paid', 'Estorno parcial',   false),
  ('receivable', 'paid',           'open',           'Estorno total',     false),

  -- Plano de tratamento
  ('treatment_plan', 'draft',     'active',    'Plano iniciado',   false),
  ('treatment_plan', 'draft',     'canceled',  'Descartado',       true),
  ('treatment_plan', 'active',    'suspended', 'Suspenso',         false),
  ('treatment_plan', 'active',    'completed', 'Concluido',        true),
  ('treatment_plan', 'active',    'canceled',  'Cancelado',        true),
  ('treatment_plan', 'suspended', 'active',    'Retomado',         false),
  ('treatment_plan', 'suspended', 'canceled',  'Cancelado',        true),

  -- Oportunidade
  ('opportunity', 'open', 'won',  'Ganha',   true),
  ('opportunity', 'open', 'lost', 'Perdida', true),
  ('opportunity', 'lost', 'open', 'Reaberta', false),
  ('opportunity', 'won',  'open', 'Reaberta (erro de marcacao)', false),

  -- Cobranca no gateway
  ('gateway_charge', 'created',    'pending',    'Aguardando pagamento', false),
  ('gateway_charge', 'created',    'failed',     'Falha na emissao',     true),
  ('gateway_charge', 'pending',    'authorized', 'Autorizada',           false),
  ('gateway_charge', 'pending',    'paid',       'Paga',                 true),
  ('gateway_charge', 'pending',    'expired',    'Expirada',             true),
  ('gateway_charge', 'pending',    'canceled',   'Cancelada',            true),
  ('gateway_charge', 'pending',    'failed',     'Recusada',             true),
  ('gateway_charge', 'authorized', 'paid',       'Capturada',            true),
  ('gateway_charge', 'authorized', 'canceled',   'Cancelada',            true),
  ('gateway_charge', 'paid',       'refunded',   'Estornada',            true),

  -- Caso ortodontico
  ('orthodontic_case', 'planning',  'active',      'Aparelho instalado', false),
  ('orthodontic_case', 'planning',  'abandoned',   'Desistiu',           true),
  ('orthodontic_case', 'active',    'retention',   'Fase de contencao',  false),
  ('orthodontic_case', 'active',    'abandoned',   'Abandonou',          true),
  ('orthodontic_case', 'active',    'transferred', 'Transferido',        true),
  ('orthodontic_case', 'retention', 'completed',   'Alta',               true),
  ('orthodontic_case', 'retention', 'abandoned',   'Abandonou',          true);

-- --------------------------------------------------- triggers de transicao --
create trigger appointment_assert_transition
  before update of status on appointment
  for each row execute function assert_state_transition('appointment');

create trigger quote_assert_transition
  before update of status on quote
  for each row execute function assert_state_transition('quote');

create trigger installment_assert_transition
  before update of status on installment
  for each row execute function assert_state_transition('installment');

create trigger receivable_assert_transition
  before update of status on receivable
  for each row execute function assert_state_transition('receivable');

create trigger treatment_plan_assert_transition
  before update of status on treatment_plan
  for each row execute function assert_state_transition('treatment_plan');

create trigger opportunity_assert_transition
  before update of status on opportunity
  for each row execute function assert_state_transition('opportunity');

create trigger gateway_charge_assert_transition
  before update of status on gateway_charge
  for each row execute function assert_state_transition('gateway_charge');

create trigger orthodontic_case_assert_transition
  before update of status on orthodontic_case
  for each row execute function assert_state_transition('orthodontic_case');

-- ------------------------------------------- carimbos e historico de status -
create or replace function stamp_appointment_status() returns trigger
language plpgsql
as $$
begin
  if new.status is distinct from old.status then
    new.confirmed_at := case when new.status = 'confirmed'   then now() else new.confirmed_at end;
    new.arrived_at   := case when new.status = 'arrived'     then now() else new.arrived_at end;
    new.started_at   := case when new.status = 'in_progress' then now() else new.started_at end;
    new.completed_at := case when new.status = 'completed'   then now() else new.completed_at end;
    new.canceled_at  := case when new.status = 'canceled'    then now() else null end;
    new.no_show_at   := case when new.status = 'no_show'     then now() else null end;
  end if;
  return new;
end;
$$;

create trigger appointment_stamp_status
  before update of status on appointment
  for each row execute function stamp_appointment_status();

create or replace function log_appointment_status() returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' or new.status is distinct from old.status then
    insert into appointment_status_history
      (tenant_id, appointment_id, from_status, to_status, reason, changed_by)
    values
      (new.tenant_id, new.id,
       case when tg_op = 'UPDATE' then old.status end,
       new.status, new.cancel_reason, current_membership_id());
  end if;
  return new;
end;
$$;

create trigger appointment_log_status
  after insert or update of status on appointment
  for each row execute function log_appointment_status();

create or replace function log_quote_status() returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' or new.status is distinct from old.status then
    insert into quote_status_history
      (tenant_id, quote_id, from_status, to_status, reason, changed_by)
    values
      (new.tenant_id, new.id,
       case when tg_op = 'UPDATE' then old.status end,
       new.status, new.loss_notes, current_membership_id());
  end if;
  return new;
end;
$$;

create trigger quote_log_status
  after insert or update of status on quote
  for each row execute function log_quote_status();

create or replace function log_opportunity_stage() returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' or new.stage_id is distinct from old.stage_id then
    insert into opportunity_stage_history
      (tenant_id, opportunity_id, from_stage_id, to_stage_id, changed_by,
       seconds_in_previous_stage)
    values
      (new.tenant_id, new.id,
       case when tg_op = 'UPDATE' then old.stage_id end,
       new.stage_id, current_membership_id(),
       case when tg_op = 'UPDATE'
         then extract(epoch from now() - old.stage_changed_at)::bigint end);

    new.stage_changed_at := now();
  end if;
  return new;
end;
$$;

create trigger opportunity_log_stage
  before insert or update of stage_id on opportunity
  for each row execute function log_opportunity_stage();

-- ------------------------------------------------- auditoria nas sensiveis --
do $$
declare
  t text;
begin
  foreach t in array array[
    'patient', 'patient_consent', 'clinical_note', 'clinical_document',
    'clinical_file', 'form_response', 'odontogram_entry', 'treatment_plan',
    'treatment_plan_item', 'aesthetic_session', 'injectable_application',
    'quote', 'quote_item', 'receivable', 'installment', 'payment',
    'payable', 'commission_entry', 'product_lot', 'membership',
    'price_list', 'price_list_item', 'tenant_policy'
  ]
  loop
    execute format(
      'create trigger %I after insert or update or delete on %I
         for each row execute function write_audit_log()',
      t || '_audit', t
    );
  end loop;
end;
$$;

-- role_permission nao tem tenant_id nem id: o tenant vem do papel. Mudanca de
-- permissao e o tipo de alteracao que precisa aparecer na auditoria com nome e
-- hora — e um dos primeiros lugares onde se olha depois de um incidente.
create trigger role_permission_audit
  after insert or update or delete on role_permission
  for each row execute function write_audit_log('role_id', 'role');

-- ------------------------------------------- vinculo paciente/profissional --
create or replace function link_patient_provider() returns trigger
language plpgsql
as $$
declare
  -- Lido via jsonb porque as tabelas de origem nao tem o mesmo conjunto de
  -- colunas; acessar new.<coluna> inexistente quebraria em tempo de execucao.
  row_data   jsonb := to_jsonb(new);
  v_member   uuid  := nullif(coalesce(row_data ->> 'provider_id',
                                      row_data ->> 'performed_by',
                                      row_data ->> 'filled_by'), '')::uuid;
  v_patient  uuid  := nullif(row_data ->> 'patient_id', '')::uuid;
  v_tenant   uuid  := nullif(row_data ->> 'tenant_id', '')::uuid;
begin
  if v_member is null or v_patient is null or v_tenant is null then
    return new;
  end if;

  insert into patient_provider_link as l
    (tenant_id, patient_id, membership_id, relation, first_at, last_at)
  values (v_tenant, v_patient, v_member, 'assistencial', now(), now())
  on conflict (patient_id, membership_id) do update set last_at = now();

  return new;
end;
$$;

do $$
declare
  t text;
begin
  foreach t in array array[
    'appointment', 'clinical_note', 'clinical_document', 'treatment_plan',
    'aesthetic_session', 'injectable_application', 'form_response'
  ]
  loop
    execute format(
      'create trigger %I after insert on %I
         for each row execute function link_patient_provider()',
      t || '_link_provider', t
    );
  end loop;
end;
$$;

-- ------------------------------------------------ invariantes de negocio ----

-- 1. Injetavel com lote: nao aplicar lote vencido, bloqueado ou de outro produto.
create or replace function check_injectable_lot() returns trigger
language plpgsql
as $$
declare
  v_requires boolean;
  v_lot record;
begin
  select coalesce(tp.require_lot_for_injectable, true) into v_requires
  from tenant_policy tp where tp.tenant_id = new.tenant_id;

  if coalesce(v_requires, true) and new.product_lot_id is null then
    raise exception 'Aplicacao de injetavel exige lote rastreado.'
      using errcode = 'check_violation',
            hint = 'Informe product_lot_id ou desative require_lot_for_injectable.';
  end if;

  if new.product_lot_id is not null then
    select * into v_lot from product_lot where id = new.product_lot_id;

    if v_lot.is_blocked then
      raise exception 'Lote % esta bloqueado: %', v_lot.lot_number, v_lot.blocked_reason
        using errcode = 'check_violation';
    end if;

    if v_lot.expires_on < new.applied_at::date then
      raise exception 'Lote % venceu em % e nao pode ser aplicado.',
        v_lot.lot_number, v_lot.expires_on
        using errcode = 'check_violation';
    end if;

    if new.product_id is not null and v_lot.product_id <> new.product_id then
      raise exception 'Lote informado pertence a outro produto.'
        using errcode = 'check_violation';
    end if;

    -- Congela numero e validade no registro clinico: o lote pode ser corrigido
    -- no estoque depois, o que foi aplicado no paciente nao muda.
    new.lot_number     := v_lot.lot_number;
    new.lot_expires_on := v_lot.expires_on;
    new.product_id     := coalesce(new.product_id, v_lot.product_id);
  end if;

  return new;
end;
$$;

create trigger injectable_application_check_lot
  before insert or update on injectable_application
  for each row execute function check_injectable_lot();

-- 2. Consumo de estoque nao pode usar lote vencido ou bloqueado.
create or replace function check_stock_lot() returns trigger
language plpgsql
as $$
declare
  v_lot record;
begin
  if new.lot_id is null then
    if exists (select 1 from product where id = new.product_id and requires_lot) then
      raise exception 'Produto exige controle de lote; informe lot_id.'
        using errcode = 'check_violation';
    end if;
    return new;
  end if;

  select * into v_lot from product_lot where id = new.lot_id;

  if new.kind in ('consumption', 'sale') then
    if v_lot.is_blocked then
      raise exception 'Lote % bloqueado nao pode ser consumido.', v_lot.lot_number
        using errcode = 'check_violation';
    end if;
    if v_lot.expires_on < new.occurred_at::date then
      raise exception 'Lote % vencido em %; registre como perda (loss), nao consumo.',
        v_lot.lot_number, v_lot.expires_on
        using errcode = 'check_violation';
    end if;
  end if;

  return new;
end;
$$;

create trigger stock_movement_check_lot
  before insert on stock_movement
  for each row execute function check_stock_lot();

-- 3. Foto clinica exige consentimento de imagem vigente.
create or replace function check_photo_consent() returns trigger
language plpgsql
as $$
declare
  v_required boolean;
begin
  if new.kind not in ('photo_before', 'photo_after', 'photo_clinical') then
    return new;
  end if;

  select coalesce(tp.require_image_consent_for_photo, true) into v_required
  from tenant_policy tp where tp.tenant_id = new.tenant_id;

  if coalesce(v_required, true) and not has_active_consent(new.patient_id, 'uso_imagem') then
    raise exception 'Paciente sem consentimento de uso de imagem vigente.'
      using errcode = 'check_violation',
            hint = 'Colete o termo de imagem antes de anexar a foto.';
  end if;

  return new;
end;
$$;

create trigger clinical_file_check_consent
  before insert on clinical_file
  for each row execute function check_photo_consent();

-- 4. Item de orcamento precisa do "onde" compativel com o procedimento.
create or replace function check_quote_item_scope() returns trigger
language plpgsql
as $$
declare
  v_scope procedure_scope;
begin
  if new.procedure_id is null then
    return new;
  end if;

  select scope into v_scope from procedure where id = new.procedure_id;

  if v_scope in ('tooth', 'surface') and new.tooth_code is null then
    raise exception 'Procedimento exige dente (notacao FDI).'
      using errcode = 'check_violation';
  end if;

  if v_scope = 'surface' and cardinality(new.surfaces) = 0 then
    raise exception 'Procedimento exige ao menos uma face dentaria.'
      using errcode = 'check_violation';
  end if;

  if v_scope = 'region' and new.region_code is null then
    raise exception 'Procedimento exige regiao anatomica.'
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

create trigger quote_item_check_scope
  before insert or update on quote_item
  for each row execute function check_quote_item_scope();

-- 5. Desconto acima do teto da tabela exige aprovacao nominal.
create or replace function check_quote_discount() returns trigger
language plpgsql
as $$
declare
  v_max_discount bigint;
begin
  if new.status = 'draft' then
    return new;
  end if;

  select coalesce(sum(
           ((qi.quantity * qi.unit_price_cents) * pli.max_discount_percent / 100)::bigint
         ), 0)
    into v_max_discount
  from quote_item qi
  left join price_list_item pli on pli.id = qi.price_list_item_id
  where qi.quote_id = new.id;

  if new.discount_cents > v_max_discount and new.discount_approved_at is null then
    raise exception
      'Desconto de % excede o teto de % e exige aprovacao de gestor.',
      new.discount_cents, v_max_discount
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

create trigger quote_check_discount
  before update on quote
  for each row execute function check_quote_discount();

-- 6. Orcamento so vira "accepted" com pelo menos um item.
create or replace function check_quote_has_items() returns trigger
language plpgsql
as $$
begin
  if new.status in ('sent', 'accepted')
     and not exists (select 1 from quote_item where quote_id = new.id) then
    raise exception 'Orcamento sem itens nao pode ser enviado nem aprovado.'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger quote_check_items
  before update of status on quote
  for each row execute function check_quote_has_items();

-- 7. Parcela quitada nao muda de valor nem de vencimento.
create or replace function protect_paid_installment() returns trigger
language plpgsql
as $$
begin
  if old.status = 'paid'
     and (new.amount_cents, new.due_on) is distinct from (old.amount_cents, old.due_on) then
    raise exception 'Parcela quitada nao pode ser editada. Estorne o pagamento antes.'
      using errcode = 'insufficient_privilege';
  end if;
  return new;
end;
$$;

create trigger installment_protect_paid
  before update on installment
  for each row execute function protect_paid_installment();

-- 8. Caixa fechado nao recebe movimentacao nova.
create or replace function check_cash_session_open() returns trigger
language plpgsql
as $$
begin
  if exists (select 1 from cash_session where id = new.session_id and status <> 'open') then
    raise exception 'Caixa ja fechado nao aceita nova movimentacao.'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger cash_movement_check_session
  before insert on cash_movement
  for each row execute function check_cash_session_open();

-- 9. Evolucao clinica exige profissional com registro ativo no conselho.
create or replace function check_provider_is_licensed() returns trigger
language plpgsql
as $$
begin
  if not exists (
    select 1 from membership m
    where m.id = new.provider_id
      and m.is_provider
      and m.status = 'active'
      and m.deleted_at is null
  ) then
    raise exception 'Registro clinico exige profissional ativo e habilitado.'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger clinical_note_check_provider
  before insert on clinical_note
  for each row execute function check_provider_is_licensed();

create trigger injectable_application_check_provider
  before insert on injectable_application
  for each row execute function check_provider_is_licensed();
