# Invariantes de negócio

Regras que o sistema nunca pode violar — e onde cada uma é garantida.

A coluna **Onde** importa mais que a regra: invariante que só vive na aplicação
não alcança importador de base, script de correção, integração futura nem duas
pessoas clicando ao mesmo tempo.

Todas as linhas marcadas com ✅ têm teste automatizado em `db/tests/`
(229 testes, `./db/tests/run_tests.sh`).

## Isolamento e acesso

| # | Invariante | Onde | Teste |
|---|---|---|---|
| 1 | Nenhuma consulta retorna linha de outra rede | RLS `tenant_isolation` em 109 tabelas | ✅ |
| 2 | Escrita com `tenant_id` de outra rede é recusada | `WITH CHECK` da policy | ✅ |
| 3 | Tabela de junção não liga entidades de redes diferentes | policy derivada dos dois pais | ✅ |
| 4 | Sessão sem contexto de tenant não enxerga nada (falha fechado) | `current_tenant_id()` nulo | ✅ |
| 5 | Usuário restrito a uma unidade não vê dado de outra | `current_unit_ids()` na policy | ✅ |
| 6 | Com política restritiva, profissional só abre prontuário de quem atende | policy restritiva + `patient_provider_link` | ✅ |
| 7 | A aplicação não tem `DELETE` físico em tabela de negócio | `GRANT` | ✅ |
| 8 | Toda tabela de negócio tem RLS e policy | `assert_rls_coverage()` no CI | ✅ |

## Prontuário e LGPD

| # | Invariante | Onde | Teste |
|---|---|---|---|
| 9 | Evolução clínica não pode ser apagada | trigger + `GRANT` | ✅ |
| 10 | Evolução fechada não pode ser reescrita; correção é aditamento | trigger (janela de 30 min) | ✅ |
| 11 | Aditamento exige motivo | `CHECK` | ✅ |
| 12 | Registro clínico exige profissional ativo com registro de conselho | trigger | ✅ |
| 13 | Foto clínica exige consentimento de imagem **vigente** | trigger + `has_active_consent()` | ✅ |
| 14 | Revogação de consentimento vale imediatamente | função, sem cache | ✅ |
| 15 | Consentimento aponta para a **versão do termo** que a pessoa assinou | FK para `consent_document` versionado | ✅ |
| 16 | Leitura de prontuário deixa rastro | `phi_access_log` append-only | ✅ |
| 17 | Trilha de auditoria não pode ser alterada nem apagada | `REVOKE` + trigger | ✅ |
| 18 | Alteração de permissão de papel é auditada | trigger com resolução pelo pai | ✅ |

## Rastreabilidade sanitária

| # | Invariante | Onde | Teste |
|---|---|---|---|
| 19 | Aplicação de injetável exige lote rastreado (configurável por rede) | trigger + `tenant_policy` | ✅ |
| 20 | Lote vencido não pode ser aplicado | trigger | ✅ |
| 21 | Lote bloqueado por recall não pode ser aplicado | trigger | ✅ |
| 22 | Lote informado tem de pertencer ao produto informado | trigger | ✅ |
| 23 | Número e validade do lote são congelados no registro clínico | trigger de congelamento | ✅ |
| 24 | Dado um lote recolhido, o sistema lista quem recebeu | índice `injectable_application_lot_idx` | ✅ |
| 25 | Produto com controle de lote exige lote na movimentação | trigger | ✅ |
| 26 | Lote vencido sai como perda, nunca como consumo | trigger | ✅ |
| 27 | Perda e ajuste exigem motivo registrado | `CHECK` | ✅ |
| 28 | Movimentação de estoque é append-only; saldo é derivado | trigger + `REVOKE` | ✅ |

## Agenda

| # | Invariante | Onde | Teste |
|---|---|---|---|
| 29 | Profissional não tem dois atendimentos sobrepostos | `EXCLUDE USING gist` | ✅ |
| 30 | Cadeira/sala não recebe dois atendimentos sobrepostos | `EXCLUDE USING gist` | ✅ |
| 31 | Cancelamento e falta liberam a janela | cláusula `WHERE` da exclusion | ✅ |
| 32 | Agendamento não pula etapas (ex.: `scheduled` → `completed`) | `state_transition` + trigger | ✅ |
| 33 | Cancelamento exige motivo | `CHECK` | ✅ |
| 34 | Toda mudança de status entra no histórico | trigger | ✅ |
| 35 | Fim do atendimento é posterior ao início | `CHECK` | ✅ |

## Comercial e orçamento

| # | Invariante | Onde | Teste |
|---|---|---|---|
| 36 | Orçamento sem item não pode ser enviado nem aprovado | trigger | ✅ |
| 37 | Total do orçamento é sempre subtotal − desconto | coluna gerada | ✅ |
| 38 | Desconto acima do teto da tabela exige aprovação nominal | trigger | ✅ |
| 39 | Desconto não excede o subtotal | `CHECK` | ✅ |
| 40 | Aceite exige evidência de assinatura | `CHECK` | ✅ |
| 41 | Preço e custo do item ficam congelados na emissão | cópia no `quote_item` | ✅ |
| 42 | Item exige "onde" compatível com o procedimento (dente, face ou região) | trigger lendo `procedure.scope` | ✅ |
| 43 | Não existem duas tabelas de preço ativas para o mesmo público | `EXCLUDE` com `daterange` | — |
| 44 | Oportunidade perdida exige motivo | `CHECK` | — |

## Financeiro

| # | Invariante | Onde | Teste |
|---|---|---|---|
| 45 | Pagamento confirmado é imutável; correção é estorno | trigger | ✅ |
| 46 | Pagamento não pode ser apagado | trigger + `GRANT` | ✅ |
| 47 | Estorno exige motivo e data | `CHECK` | ✅ |
| 48 | Saldo da parcela é a soma dos pagamentos confirmados | trigger de recálculo | ✅ |
| 49 | Recebível acompanha o saldo das parcelas | trigger de recálculo | ✅ |
| 50 | Parcela quitada não muda de valor nem de vencimento | trigger | ✅ |
| 51 | Pago nunca excede o valor da parcela | `CHECK` | ✅ |
| 52 | Caixa fechado não aceita movimentação nova | trigger | ✅ |
| 53 | Um caixa aberto por operador e unidade | índice único parcial | — |
| 54 | Um pagamento só é estornado uma vez | índice único parcial | — |
| 55 | Cobrança no gateway não duplica sob retry | `UNIQUE (tenant, provider, idempotency_key)` | — |
| 56 | Webhook repetido não vira segundo pagamento | `UNIQUE (source, external_id)` | — |

## Automação

| # | Invariante | Onde | Teste |
|---|---|---|---|
| 57 | A mesma automação não dispara duas vezes para o mesmo alvo | `UNIQUE (rule_id, target_entity, target_id)` | — |
| 58 | Efeito externo só sai depois do commit | `outbox_message` na mesma transação | — |
| 59 | Mensagem fora da janela de 24h exige template aprovado | `conversation.window_expires_at` + regra de envio | — |
| 60 | Envio respeita janela de horário e teto por paciente/dia | `automation_rule` | — |

### Faturamento por guia

| # | Invariante | Onde vive | Teste |
|---|---|---|---|
| 61 | Aceite de convênio faturado cria guia, e o paciente deve só a co-participação | `build_receivable_from_quote()` | `08_claims` |
| 62 | Faturar o mesmo orçamento duas vezes não cobra o convênio duas vezes | `build_claim_from_quote()`, idempotente | `08_claims` |
| 63 | Desconto não pode passar da co-participação do paciente | `build_receivable_from_quote()` | `08_claims` |
| 64 | Co-participação é congelada na emissão, como o preço | `quote_item.patient_share_cents` | `claim.test.ts` |
| 65 | Um lote aberto por convênio, unidade e competência | `claim_batch_open_uk` (índice parcial) | `08_claims` |
| 66 | Lote sem guia não pode ser enviado | `submit_claim_batch()` | `08_claims` |
| 67 | Guia só é conferida depois de enviada | `settle_claim_item()` | `08_claims` |
| 68 | O convênio não pode ter pago mais do que foi faturado na linha | `settle_claim_item()` + `claim_item_paid_bound` | `08_claims` |
| 69 | Glosa exige motivo: sem ele não há o que recorrer | `settle_claim_item()` | `08_claims` |
| 70 | O prazo de recurso conta do demonstrativo, não de hoje | `settle_claim_item()` + `claim_batch.remittance_date` | `08_claims` |
| 71 | Lote não fecha com linha sem conferência | `settle_claim_batch()` | `08_claims` |
| 72 | Glosa recuperada devolve o valor para a LINHA, não só para o total | `resolve_claim_denial()` | `08_claims` |
| 73 | Totais de guia e de lote não discordam das partes | triggers `refresh_claim_totals` e `refresh_claim_batch_totals` | `08_claims` |
| 74 | Linha de guia enviada não pode ser removida | `protect_sent_claim_item()` | `08_claims` |
| 75 | Glosa com andamento não pode ser apagada | `protect_touched_denial()` | `08_claims` |
| 76 | Glosa sem recurso vence sozinha, pela passagem do tempo | `expire_claim_denials()` (job noturno) | `08_claims` |

### Funil

| # | Invariante | Onde vive | Teste |
|---|---|---|---|
| 77 | Ganhar é aceitar o orçamento, na mesma transação | trigger `quote_win_opportunity` | `09_funnel` |
| 78 | Orçamento recusado não perde o negócio sozinho | ausência deliberada de trigger | `09_funnel` |
| 79 | Perder exige motivo | `opportunity_lost_reason` | `09_funnel` |
| 80 | Etapa pertence ao funil da oportunidade | FK composta `(stage_id, pipeline_id)` | `09_funnel` |
| 81 | Negócio sem pessoa não existe | `opportunity_has_subject` | — |
| 82 | O valor do negócio passa a ser o do orçamento | trigger `quote_sync_opportunity_amount` | `09_funnel` |
| 83 | Registrar contato atualiza o último contato | trigger `activity_touch_opportunity` | `09_funnel` |
| 84 | A próxima ação é a menor data entre as tarefas abertas | trigger `task_refresh_next_action` | `09_funnel` |
| 85 | Tarefa concluída não vira cancelada | `state_transition` + `assert_state_transition` | `09_funnel` |
| 86 | Lead com telefone já cadastrado reaproveita o paciente | `convert_lead_to_patient()` | `09_funnel` |
| 87 | Cada movimento de etapa fica no histórico, com o tempo parado | trigger `opportunity_log_stage` | `09_funnel` |

### Importação

| # | Invariante | Onde vive | Teste |
|---|---|---|---|
| 88 | A importação nasce sem nada aplicado | `import_job.status` + `import_job_applied` | `10_import` |
| 89 | Aplicada é terminal: não volta para conferência | `state_transition` + `assert_state_transition` | `10_import` |
| 90 | Linha importada e paciente criado são a mesma afirmação | `import_row_imported` | `10_import` |
| 91 | Duas linhas com o mesmo número são recusadas | `import_row_line_uk` | `10_import` |
| 92 | O que veio na planilha fica guardado como veio | `import_row.raw` (jsonb) | `10_import` |
| 93 | Quem trouxe a planilha fica na auditoria | trigger `import_job_audit` | `10_import` |

### Relatórios

| # | Invariante | Onde vive | Teste |
|---|---|---|---|
| 94 | O período fechado inclui o último dia inteiro, no fuso da clínica | `(data + 1)::timestamp at time zone` | `11_relatorios` |
| 95 | Pagamento estornado e seu par não entram no faturamento | `status`/`reverses_payment_id` na consulta | `11_relatorios` |
| 96 | Abrir um negócio já escreve histórico de etapa | trigger `opportunity_log_stage` | `11_relatorios` |
| 97 | Os índices de leitura do painel existem e são parciais | `payment_confirmed_idx` e os cinco de 0031 | `11_relatorios` |

### Estoque operando

| # | Invariante | Onde vive | Teste |
|---|---|---|---|
| 98 | Saldo e movimentação estão sempre em unidade de ESTOQUE | `comment on column` + a 0032 | `12_estoque` |
| 99 | O lote que sai é o que vence primeiro, quebrando entre lotes | `pick_stock_lots()` | `12_estoque` |
| 100 | Lote bloqueado ou vencido não entra no consumo | `pick_stock_lots()` + `check_stock_lot` | `12_estoque` |
| 101 | A ficha técnica vira unidade de estoque com a perda dentro | `consume_plan_item()` | `12_estoque` |
| 102 | Sem lote válido, injetável não é consumido — nem com política permissiva | `pick_stock_lots()` | `12_estoque` |
| 103 | Item não fica executado se a baixa falhar | consumo antes do carimbo, mesma transação | `12_estoque` |
| 104 | O estorno soma uma linha em vez de apagar a do consumo | `revert_plan_item()` | `12_estoque` |
| 105 | O mesmo item não é executado duas vezes | `execute_plan_item()` | `12_estoque` |
| 106 | Executado não é terminal: desfazer tem caminho | `state_transition` | `12_estoque` |

### Custo real

| # | Invariante | Onde vive | Teste |
|---|---|---|---|
| 107 | Perda e acerto entram valorados, nunca a zero | `custoUnitario()` no comando | `stock.test` |
| 108 | O custo real sai das movimentações, não de coluna guardada | `getCustoRealPorProcedimento` | `report.test` |
| 109 | Procedimento sem ficha técnica não vira 100% de margem | `temFicha` + `margemPercent` nulo | `report.test` |
| 110 | Perda e acerto não entram na margem de atendimento nenhum | painel separado | `report.test` |

### Transferência entre unidades

| # | Invariante | Onde vive | Teste |
|---|---|---|---|
| 111 | Transferência é um par ou não é nada | constraint trigger diferida `stock_movement_transfer_paired` | `12_estoque` |
| 112 | Movimentação de transferência sem grupo é recusada | `stock_movement_transfer_group` | `12_estoque` |
| 113 | Sai e entra a mesma quantidade, do mesmo produto e lote | `assert_transfer_paired()` | `12_estoque` |
| 114 | Não se transfere mais do que existe na origem | `transferStock()` | `stock.test` |

Três regras de relatório NÃO são invariantes de banco, e ficam registradas aqui
porque são decisões, não descuido — vivem em `modules/report/queries.ts`, com
teste em `app/tests/report.test.ts`:

- **Nada é materializado.** Todo número do painel sai dos fatos que a operação
  já escreveu. Não existe tabela de totais mantida por trigger: no dia em que
  ela discordasse do extrato, ninguém mais confiaria na tela.
- **Quem atendeu é `quote.provider_id`** — a mesma regra que o banco já usa para
  decidir de quem é a comissão (`build_commission_from_payment`). Duas
  definições de "quem atendeu" seria uma a mais.
- **O desconto do orçamento é rateado entre os itens**, com a sobra de
  arredondamento inteira para o item mais caro. O desconto vive no cabeçalho;
  somar os itens crus mostraria receita bruta na mesma tela em que o resumo
  mostra a líquida.

---

## Invariantes que **não** estão no banco (e por quê)

Honestidade sobre os limites do que foi construído:

- **"Não executar procedimento sem baixa de insumo"** — está como política
  (`tenant_policy.block_execution_without_stock`), não como trigger. Bloquear no
  banco significa impedir o dentista de fechar o atendimento porque o estoque
  estava desatualizado, o que na prática faz a clínica registrar errado para
  conseguir trabalhar. O caminho correto é baixa automática pela ficha técnica +
  alerta de divergência, com bloqueio opcional por rede.
- **Cálculo de comissão** — a regra (`commission_rule`) é dado, mas a aplicação
  dela é serviço da aplicação, não trigger: envolve precedência, rateio entre
  profissionais e reprocessamento de mês fechado.
- **Risco de no-show e sinais de oportunidade** — job, não trigger. São
  aproximações que mudam de fórmula; não devem travar escrita.
