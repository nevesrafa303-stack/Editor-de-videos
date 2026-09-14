# Diagramas por domínio

Um diagrama por domínio, com as colunas que importam para entender o
relacionamento. O schema completo está em `db/migrations/`.

Convenção: `PK` chave primária · `FK` chave estrangeira · `UK` chave única.
Toda tabela de negócio tem `tenant_id` (omitido nos diagramas para não poluir) e
está sob RLS.

---

## 1. Tenancy e acesso

Rede → unidade → vínculo. O usuário é **global**: o mesmo dentista atende em duas
clínicas de donos diferentes com um login só.

```mermaid
erDiagram
    subscription_plan ||--o{ tenant : "assina"
    subscription_plan ||--o{ plan_feature : "libera"
    tenant ||--o{ unit : "possui"
    tenant ||--|| tenant_policy : "configura"
    tenant ||--o{ tenant_feature_override : "contrata avulso"
    tenant ||--o{ role : "define"
    tenant ||--o{ membership : "tem"
    tenant ||--o{ invitation : "envia"
    app_user ||--o{ membership : "atua como"
    app_user ||--o{ user_session : "abre"
    role ||--o{ membership : "classifica"
    role ||--o{ role_permission : "recebe"
    permission ||--o{ role_permission : "concede"
    membership ||--o{ membership_unit : "acessa"
    unit ||--o{ membership_unit : "é acessada por"

    tenant {
        uuid id PK
        citext slug UK
        text legal_name
        tenant_status status
        uuid plan_id FK
    }
    unit {
        uuid id PK
        text code UK
        text health_license
    }
    app_user {
        uuid id PK
        citext email UK
        text password_hash
        timestamptz mfa_enabled_at
    }
    membership {
        uuid id PK
        uuid user_id FK
        uuid role_id FK
        boolean is_provider
        text council_number
        numeric commission_pct
    }
    tenant_policy {
        boolean restrict_chart_to_own_patients
        boolean require_lot_for_injectable
        boolean require_image_consent_for_photo
    }
```

---

## 2. Paciente, consentimento e indicação

```mermaid
erDiagram
    patient ||--o{ patient_contact : "tem"
    patient ||--o{ patient_responsible : "responde por"
    patient ||--o{ patient_tag : "recebe"
    tag ||--o{ patient_tag : "classifica"
    acquisition_source ||--o{ patient : "originou"
    patient ||--o{ patient_consent : "assina"
    consent_document ||--o{ patient_consent : "é assinado em"
    patient ||--o{ patient_data_request : "solicita"
    patient ||--o{ patient_provider_link : "é cuidado por"
    membership ||--o{ patient_provider_link : "cuida de"
    referral_program ||--o{ referral : "rege"
    patient ||--o{ referral : "indica"

    patient {
        uuid id PK
        bigint code UK
        text full_name
        text tax_id UK
        date birth_date
        patient_status status
        timestamptz last_visit_at
        numeric no_show_risk
        bigint open_balance_cents
        timestamptz anonymized_at
    }
    consent_document {
        uuid id PK
        consent_kind kind
        int version UK
        text body_hash
        text legal_basis
    }
    patient_consent {
        timestamptz granted_at
        timestamptz revoked_at
        text signed_hash
        inet ip_address
    }
    patient_provider_link {
        uuid patient_id PK
        uuid membership_id PK
        text relation
    }
    referral {
        uuid referrer_patient_id FK
        uuid referred_patient_id FK
        referral_status status
        bigint reward_amount_cents
    }
```

---

## 3. CRM comercial e WhatsApp

**Lead** é a pessoa que ainda não é paciente. **Oportunidade** é o negócio — e
paciente antigo gera nova oportunidade sem virar lead de novo.

```mermaid
erDiagram
    pipeline ||--o{ pipeline_stage : "tem"
    pipeline ||--o{ opportunity : "organiza"
    pipeline_stage ||--o{ opportunity : "posiciona"
    lead ||--o{ opportunity : "gera"
    patient ||--o{ opportunity : "gera"
    opportunity ||--o{ opportunity_stage_history : "registra"
    opportunity ||--o{ activity : "acumula"
    opportunity ||--o{ task : "dispara"
    loss_reason ||--o{ opportunity : "explica perda"
    campaign ||--o{ lead : "captou"
    whatsapp_account ||--o{ conversation : "atende por"
    conversation ||--o{ message : "contém"
    message_template ||--o{ message : "formata"
    patient ||--o{ conversation : "conversa"
    lead ||--o{ conversation : "conversa"

    lead {
        uuid id PK
        text full_name
        text phone
        lead_status status
        text utm_source
        uuid converted_patient_id FK
    }
    opportunity {
        uuid id PK
        opportunity_status status
        bigint amount_cents
        timestamptz stage_changed_at
        timestamptz last_activity_at
    }
    conversation {
        uuid id PK
        text contact_phone UK
        conversation_status status
        timestamptz last_inbound_at
        timestamptz window_expires_at
    }
    message {
        uuid id PK
        message_direction direction
        message_status status
        text provider_message_id UK
        bigint billed_cents
    }
    message_template {
        text code UK
        int version UK
        template_status status
        jsonb variables
    }
```

---

## 4. Agenda

Conflito não é validado no app: é `EXCLUDE USING gist` sobre `tstzrange`.

```mermaid
erDiagram
    unit ||--o{ resource : "tem"
    unit ||--o{ appointment : "recebe"
    patient ||--o{ appointment : "agenda"
    membership ||--o{ appointment : "atende"
    membership ||--o{ provider_availability : "define"
    appointment ||--o{ resource_booking : "ocupa"
    resource ||--o{ resource_booking : "é ocupado por"
    schedule_block ||--o{ resource_booking : "bloqueia"
    appointment ||--o{ appointment_status_history : "registra"
    appointment ||--o{ appointment_confirmation : "confirma por"
    waitlist_entry ||--o| appointment : "vira"

    appointment {
        uuid id PK
        timestamptz starts_at
        timestamptz ends_at
        tstzrange period
        appointment_status status
        appointment_origin origin
        numeric no_show_risk
    }
    resource {
        uuid id PK
        resource_kind kind
        text code UK
        date next_maintenance_on
    }
    resource_booking {
        tstzrange period
        boolean is_active
    }
    provider_availability {
        int weekday
        time starts_at
        time ends_at
        int slot_minutes
        date valid_from
    }
    appointment_confirmation {
        confirmation_channel channel
        int hours_before UK
        confirmation_outcome outcome
    }
```

---

## 5. Prontuário

```mermaid
erDiagram
    form_template ||--o{ form_response : "estrutura"
    patient ||--o{ form_response : "responde"
    patient ||--o{ clinical_note : "acumula"
    membership ||--o{ clinical_note : "assina"
    clinical_note ||--o| clinical_note : "adita"
    patient ||--o{ clinical_document : "recebe"
    clinical_document ||--o{ prescription_item : "lista"
    patient ||--o{ clinical_file : "tem"
    appointment ||--o| clinical_note : "origina"

    form_template {
        uuid id PK
        form_kind kind
        int version UK
        jsonb schema
    }
    form_response {
        jsonb answers
        text[] alerts
        boolean filled_by_patient
        timestamptz signed_at
    }
    clinical_note {
        uuid id PK
        text content
        uuid amends_note_id FK
        text amendment_reason
        timestamptz locked_at
        text signature_hash
    }
    clinical_document {
        clinical_document_kind kind
        document_status status
        bigint number UK
        text content_hash
        jsonb signature_evidence
    }
    clinical_file {
        clinical_file_kind kind
        text storage_key
        text checksum_sha256
        jsonb capture_metadata
    }
```

---

## 6. Odontologia

O odontograma é **log de eventos por dente**, não JSON no paciente: cada condição
tem autor, data e origem.

```mermaid
erDiagram
    tooth ||--o{ odontogram_entry : "descreve"
    patient ||--o{ odontogram_entry : "possui"
    odontogram_entry ||--o| odontogram_entry : "supera"
    patient ||--o{ treatment_plan : "segue"
    treatment_plan ||--o{ treatment_plan_phase : "divide em"
    treatment_plan ||--o{ treatment_plan_item : "contém"
    treatment_plan_phase ||--o{ treatment_plan_item : "agrupa"
    tooth ||--o{ treatment_plan_item : "localiza"
    appointment ||--o| treatment_plan_item : "executa"
    patient ||--o{ orthodontic_case : "trata"
    orthodontic_case ||--o{ orthodontic_maintenance : "gera"
    installment ||--o| orthodontic_maintenance : "cobra"

    tooth {
        char code PK
        int quadrant
        text dentition
        text arch
    }
    odontogram_entry {
        uuid id PK
        char tooth_code FK
        tooth_surface[] surfaces
        tooth_condition condition
        odontogram_entry_status status
        timestamptz recorded_at
        timestamptz superseded_at
    }
    treatment_plan_item {
        text description
        char tooth_code FK
        tooth_surface[] surfaces
        plan_item_status status
        bigint unit_price_cents
        timestamptz executed_at
    }
    orthodontic_case {
        orthodontic_status status
        date installed_on
        bigint monthly_fee_cents
        int maintenance_interval_days
    }
```

---

## 7. Estética / HOF

`injectable_application` é o coração da rastreabilidade sanitária.

```mermaid
erDiagram
    body_region ||--o{ injectable_application : "localiza"
    aesthetic_protocol ||--o{ aesthetic_protocol_step : "define"
    aesthetic_protocol ||--o{ aesthetic_session : "guia"
    patient ||--o{ aesthetic_session : "faz"
    membership ||--o{ aesthetic_session : "executa"
    aesthetic_session ||--o{ injectable_application : "aplica"
    product ||--o{ injectable_application : "é aplicado"
    product_lot ||--o{ injectable_application : "rastreia"
    stock_movement ||--o| injectable_application : "dá baixa"
    patient ||--o{ photo_set : "fotografa"
    photo_set ||--o{ photo_set_file : "agrupa"
    clinical_file ||--o{ photo_set_file : "compõe"

    body_region {
        text code PK
        text area_group
        numeric map_x
        numeric map_y
        text risk_notes
    }
    aesthetic_session {
        uuid id PK
        int session_number
        aesthetic_session_status status
        date followup_due_on
        text adverse_event
    }
    injectable_application {
        uuid id PK
        text region_code FK
        uuid product_lot_id FK
        text lot_number
        date lot_expires_on
        numeric quantity
        injectable_unit quantity_unit
        jsonb points
        text depth
        bigint unit_cost_cents
    }
    photo_set {
        text moment
        int days_after
        timestamptz captured_at
    }
```

---

## 8. Catálogo, ficha técnica e preço

```mermaid
erDiagram
    procedure_category ||--o{ procedure : "agrupa"
    procedure ||--o{ procedure_bom : "consome"
    product ||--o{ procedure_bom : "é consumido em"
    price_list ||--o{ price_list_item : "contém"
    procedure ||--o{ price_list_item : "é precificado em"
    payer ||--o{ price_list : "tem tabela"
    unit ||--o{ price_list : "tem tabela"
    commission_rule }o--|| procedure : "incide sobre"
    commission_rule }o--|| membership : "remunera"

    procedure {
        uuid id PK
        text code UK
        procedure_scope scope
        text pricing_unit
        int default_duration_minutes
        text tuss_code
        boolean requires_lot
    }
    procedure_bom {
        numeric quantity
        text unit
        numeric waste_percent
        boolean auto_consume
    }
    price_list {
        uuid id PK
        int version UK
        price_list_status status
        daterange validity
    }
    price_list_item {
        bigint price_cents
        bigint floor_price_cents
        bigint expected_cost_cents
        numeric max_discount_percent
        numeric commission_percent
    }
    commission_rule {
        commission_basis basis
        commission_trigger trigger_event
        numeric percent
        int priority
    }
```

---

## 9. Orçamento

```mermaid
erDiagram
    patient ||--o{ quote : "recebe"
    opportunity ||--o| quote : "materializa"
    price_list ||--o{ quote : "precifica"
    quote ||--o{ quote_item : "contém"
    quote ||--o{ quote_status_history : "registra"
    procedure ||--o{ quote_item : "detalha"
    price_list_item ||--o{ quote_item : "originou preço"
    quote ||--o| treatment_plan : "vira"
    quote_item ||--o| treatment_plan_item : "vira"
    quote ||--o{ receivable : "gera"
    loss_reason ||--o{ quote : "explica recusa"

    quote {
        uuid id PK
        bigint number UK
        quote_status status
        date valid_until
        bigint subtotal_cents
        bigint discount_cents
        bigint total_cents
        bigint expected_cost_cents
        uuid discount_approved_by FK
        text signed_hash
    }
    quote_item {
        text description
        char tooth_code FK
        tooth_surface[] surfaces
        text region_code FK
        numeric quantity
        bigint unit_price_cents
        bigint unit_cost_cents
        bigint discount_cents
        bigint total_cents
    }
```

---

## 10. Financeiro

```mermaid
erDiagram
    patient ||--o{ receivable : "deve"
    receivable ||--o{ installment : "divide em"
    installment ||--o{ payment : "recebe"
    payment_method ||--o{ payment : "classifica"
    gateway_charge ||--o| installment : "cobra"
    cash_session ||--o{ cash_movement : "registra"
    payment ||--o| cash_movement : "entra no caixa"
    payment ||--o| payment : "estorna"
    supplier ||--o{ payable : "cobra"
    financial_category ||--o{ payable : "classifica"
    cost_center ||--o{ payable : "aloca"
    commission_entry ||--o| payable : "vira"
    membership ||--o{ commission_entry : "recebe"
    bank_account ||--o{ bank_statement_entry : "extrai"
    payment ||--o| bank_statement_entry : "concilia"
    patient ||--o{ patient_credit : "acumula"

    receivable {
        uuid id PK
        receivable_origin origin
        receivable_status status
        bigint total_cents
        bigint paid_cents
    }
    installment {
        int number UK
        date due_on
        bigint amount_cents
        bigint paid_cents
        installment_status status
        int dunning_count
    }
    payment {
        uuid id PK
        payment_status status
        bigint amount_cents
        bigint fee_cents
        bigint net_cents
        timestamptz reversed_at
    }
    gateway_charge {
        text idempotency_key UK
        text external_id UK
        gateway_charge_status status
        date settlement_on
    }
    cash_session {
        cash_session_status status
        bigint opening_cents
        bigint counted_cents
        bigint difference_cents
    }
    commission_entry {
        commission_basis basis
        bigint base_cents
        bigint amount_cents
        commission_status status
        date reference_month
    }
```

---

## 11. Estoque

Saldo é **derivado**: `stock_movement` é append-only e `stock_balance` é mantido
por trigger.

```mermaid
erDiagram
    product ||--o{ product_lot : "tem"
    product ||--o{ stock_movement : "movimenta"
    product_lot ||--o{ stock_movement : "rastreia"
    stock_location ||--o{ stock_movement : "guarda"
    stock_movement ||--|| stock_balance : "atualiza"
    inventory_count ||--o{ inventory_count_item : "conta"
    inventory_count_item ||--o| stock_movement : "ajusta por"
    purchase_order ||--o{ purchase_order_item : "pede"
    supplier ||--o{ purchase_order : "fornece"
    purchase_order ||--o| payable : "gera"
    stock_location ||--o{ temperature_log : "monitora"

    product {
        uuid id PK
        product_kind kind
        text anvisa_code
        text stock_unit
        text usage_unit
        numeric conversion_factor
        boolean requires_lot
        boolean requires_refrigeration
        numeric min_quantity
    }
    product_lot {
        uuid id PK
        text lot_number UK
        date expires_on
        bigint unit_cost_cents
        boolean is_blocked
    }
    stock_movement {
        uuid id PK
        stock_movement_kind kind
        numeric quantity
        bigint unit_cost_cents
        uuid patient_id FK
        timestamptz occurred_at
    }
    stock_balance {
        numeric quantity
    }
    temperature_log {
        numeric temperature
        boolean is_breach
        timestamptz recorded_at
    }
```

---

## 12. Automação, sinais e métricas

```mermaid
erDiagram
    automation_rule ||--o{ automation_run : "dispara"
    message_template ||--o{ automation_rule : "formata"
    automation_run ||--o| message : "envia"
    automation_run ||--o| outbox_message : "publica"
    patient ||--o{ patient_signal : "apresenta"
    membership ||--o{ notification : "recebe"
    membership ||--o{ notification_preference : "configura"
    unit ||--o{ metric_snapshot : "consolida"
    outbox_message ||--o| job : "processa"

    automation_rule {
        uuid id PK
        automation_trigger trigger_event
        automation_channel channel
        int offset_minutes
        jsonb conditions
        time send_window_start
        int max_per_patient_per_day
    }
    automation_run {
        uuid rule_id UK
        text target_entity UK
        uuid target_id UK
        automation_run_status status
        timestamptz scheduled_for
    }
    patient_signal {
        patient_signal_kind kind
        int severity
        bigint value_cents
        text reason
        date due_on
    }
    outbox_message {
        text topic UK
        text idempotency_key UK
        outbox_status status
        int attempts
    }
    metric_snapshot {
        date reference_date UK
        bigint revenue_received_cents
        bigint cogs_cents
        numeric occupancy_percent
    }
```
