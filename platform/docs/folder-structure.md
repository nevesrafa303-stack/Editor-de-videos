# Estrutura de pastas

Separação por **domínio**, não por tipo de arquivo. A pergunta que a estrutura
responde é "onde mexo para alterar orçamento?" — e a resposta é uma pasta, não
sete.

```
platform/
├── db/                          # O schema é o produto. Vem primeiro.
│   ├── migrations/              # SQL versionado, aplicado em ordem
│   │   ├── 0001_foundation.sql      # uuid v7, auditoria, outbox, fila
│   │   ├── 0002_tenancy.sql         # rede, unidade, usuário, papel
│   │   ├── 0003_patient.sql         # paciente, consentimento, indicação
│   │   ├── 0004_crm.sql             # lead, funil, WhatsApp
│   │   ├── 0005_scheduling.sql      # agenda, recurso, confirmação
│   │   ├── 0006_clinical.sql        # anamnese, evolução, documento
│   │   ├── 0007_dentistry.sql       # odontograma, plano, ortodontia
│   │   ├── 0008_aesthetics.sql      # mapa facial, injetável, antes/depois
│   │   ├── 0009_catalog_pricing.sql # procedimento, ficha técnica, preço
│   │   ├── 0010_quote.sql           # orçamento
│   │   ├── 0011_finance.sql         # recebível, pagamento, caixa, comissão
│   │   ├── 0012_inventory.sql       # produto, lote, movimentação
│   │   ├── 0013_notifications.sql   # automação, sinal, métrica
│   │   ├── 0014_rls.sql             # papéis, grants, policies
│   │   ├── 0015_state_machines.sql  # transições, auditoria, invariantes
│   │   ├── 0016_reference_data.sql  # permissões, dentes, regiões
│   │   └── 0017_rls_join_tables.sql # policies das tabelas de junção
│   ├── seeds/dev_seed.sql       # duas redes, para provar isolamento
│   └── tests/                   # 78 testes de invariante, sem subir o app
│       ├── run_tests.sh
│       └── 0*.sql
│
├── docs/
│   ├── adr.md                   # as 9 decisões estruturais
│   ├── erd.md                   # diagramas por domínio
│   ├── permissions.md           # gerado do banco
│   ├── invariants.md
│   ├── roadmap.md
│   └── folder-structure.md
│
└── app/                         # Camada de acesso (construída) + Next.js (a seguir)
    ├── src/
    │   ├── app/                 # SÓ roteamento e composição de tela (a seguir)
    │   │   ├── (auth)/
    │   │   ├── (app)/
    │   │   │   ├── painel/
    │   │   │   ├── funil/
    │   │   │   ├── agenda/
    │   │   │   ├── pacientes/[id]/
    │   │   │   ├── orcamentos/
    │   │   │   ├── financeiro/
    │   │   │   ├── estoque/
    │   │   │   ├── relatorios/
    │   │   │   └── configuracoes/
    │   │   └── api/
    │   │       └── webhooks/{pagamento,whatsapp}/
    │   │
    │   ├── modules/             # O CÓDIGO DE VERDADE. Um módulo por domínio.
    │   │   ├── tenancy/
    │   │   │   ├── domain/          # regras puras, sem banco e sem framework
    │   │   │   ├── data/            # queries Kysely
    │   │   │   ├── actions/         # server actions (entrada validada)
    │   │   │   ├── permissions.ts
    │   │   │   └── index.ts         # ÚNICA porta pública do módulo
    │   │   ├── patient/
    │   │   ├── crm/
    │   │   ├── scheduling/
    │   │   ├── clinical/
    │   │   ├── dentistry/
    │   │   ├── aesthetics/
    │   │   ├── catalog/
    │   │   ├── quote/
    │   │   ├── finance/
    │   │   ├── inventory/
    │   │   ├── report/          # só leitura: relatório não escreve nada
    │   │   └── automation/
    │   │
    │   ├── server/              # PRONTO
    │   │   ├── db.ts            # pool, parsers e guarda contra papel que ignora RLS
    │   │   ├── db-types.ts      # gerado por introspecção
    │   │   ├── context.ts       # withTenant: transação + SET LOCAL app.*
    │   │   ├── session.ts       # sessão opaca no banco, revogável na hora
    │   │   └── auth.ts          # login, escolha de rede, logout
    │   │
    │   ├── jobs/                # workers: outbox, automação, snapshot
    │   ├── shared/              # money, datas, BR (CPF/CNPJ), erros
    │   └── ui/                  # design system, sem regra de negócio
    │
    └── tests/
```

## As quatro regras que sustentam a estrutura

**1. Módulo tem porta única.** Fora dele, só se importa de `modules/<nome>`.
Nada de `modules/finance/data/queries`. Isso permite trocar o interior sem caçar
importações — e torna óbvio quando dois domínios estão grudados demais.

**2. `app/` não tem regra de negócio.** Página compõe tela e chama módulo. Se
aparecer cálculo de comissão dentro de `app/`, o módulo está incompleto.

**3. `domain/` não conhece banco nem Next.** Parcelamento, conflito de agenda,
total de orçamento, precedência de preço: funções puras, testadas em
milissegundos, sem subir nada. O protótipo em `crm/` já provou o valor — 514
linhas de domínio puro e 64 testes que rodam em 1,5s.

**4. Acesso ao banco passa pelo contexto de tenant.** Ninguém pega conexão
solta: `withTenant(session, fn)` abre a transação, aplica
`set_config('app.tenant_id', ..., is_local => true)` e entrega o cliente. Sem
isso, RLS não vê contexto e a consulta volta vazia — o erro aparece na primeira
execução, não em produção. Implementado em
[`app/src/server/context.ts`](../app/src/server/context.ts), com teste de que o
contexto não sobrevive à transação nem contamina a conexão seguinte.

## Dependência permitida entre módulos

```
tenancy ← (todos)
patient ← crm, scheduling, clinical, quote, finance
catalog ← quote, clinical, inventory
quote   → finance (aprovação gera recebível)
clinical → inventory (execução dá baixa)
automation ← (todos, por evento)
```

Seta é "depende de". `finance` não importa `crm`; se precisar de dado comercial,
é por evento ou consulta de leitura, não por acoplamento direto.
