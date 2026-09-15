# Plataforma clínica — fundação (v2)

Modelagem de dados, decisões de arquitetura e regras de negócio de um **CRM/ERP
multi-rede para clínicas de odontologia e harmonização facial**.

A fundação é **schema e regra**: o objetivo era ter uma base que aguentasse o
produto inteiro antes de a primeira tela existir. Sobre ela já estão de pé os
cinco módulos que fecham o ciclo — **pacientes**, **agenda**, **prontuário**,
**orçamento** e **financeiro**. O produto se chama **Áurea**.

## O que tem aqui

```
db/migrations/   24 migrations SQL, aplicadas em ordem — a fonte da verdade
db/seeds/        duas redes de demonstração (para provar o isolamento)
db/tests/        118 testes de invariante, rodando contra PostgreSQL de verdade
db/reset.sh      recria o banco do zero (usado pelas duas suítes)
app/             camada de acesso (withTenant, tipos gerados, sessão, RBAC)
                 e a primeira fatia de interface
docs/            ADR, diagramas, matriz de permissões, invariantes, fases
```

## Rodando

```bash
createdb crm
psql -d crm -f db/migrations/0001_foundation.sql   # ... até 0024
psql -d crm -f db/seeds/dev_seed.sql

./db/tests/run_tests.sh                             # 118 testes de invariante
(cd app && npm install && npm run test:all)         # + 111 de integração + 48 de navegador
(cd app && npm run dev)                             # http://localhost:3000
python3 docs/build_page.py > /tmp/arquitetura.html  # documento de referência
```

`run_tests.sh` recria o banco do zero, aplica tudo em ordem e roda a suíte
**como o papel da aplicação** (`crm_app`), nunca como superusuário — superusuário
ignora RLS, e um teste de isolamento rodado assim não prova nada.

## Números (do catálogo do banco, não estimados)

| | |
|---|---|
| Tabelas | 117 |
| Policies de RLS | 119 |
| Chaves estrangeiras | 410 |
| Constraints `check` | 236 |
| Triggers | 95 |
| Enums | 63 |
| Transições de estado declaradas | 74 |
| Permissões no catálogo | 66 |
| Testes | 118 no banco + 111 na camada de acesso + 48 no navegador, todos passando |

## Por onde começar a ler

1. [`docs/adr.md`](docs/adr.md) — as 8 decisões que o resto assume.
2. [`docs/erd.md`](docs/erd.md) — um diagrama por domínio.
3. [`docs/invariants.md`](docs/invariants.md) — o que o sistema nunca pode violar.
4. [`docs/roadmap.md`](docs/roadmap.md) — o que é MVP e onde o escopo está torto.
5. [`docs/decisoes-produto.md`](docs/decisoes-produto.md) — as decisões de
   produto já tomadas, com o custo de cada uma.
6. [`db/migrations/`](db/migrations/) — o schema em si.
7. [`app/README.md`](app/README.md) — como uma feature fala com o banco, e as
   telas que já existem.

## Três coisas que este projeto assume

**Isolamento não depende de ninguém lembrar do `WHERE`.** RLS forçada em 117
tabelas, `SET LOCAL app.tenant_id` por transação, papel de aplicação que não é
dono das tabelas, e `assert_rls_coverage()` quebrando o CI se aparecer tabela
descoberta.

**Invariante mora no banco.** Conflito de agenda é exclusion constraint;
transição de status é tabela de transições + trigger; pagamento e evolução
clínica são imutáveis por trigger e por `REVOKE`. Validação que só existe na
aplicação não alcança importador, script de correção nem concorrência.

**Preço e custo são congelados no documento.** Reajustar tabela não altera
orçamento enviado nem recalcula comissão de procedimento executado.

## Relação com `crm/`

`crm/` é o protótipo v1: aplicação Next.js funcional que validou os fluxos
(funil, agenda, prontuário, orçamento) com clínica piloto. Ele continua servindo
de referência de fluxo e de UI.

O schema aqui é **novo**, não uma migração do v1 — o v1 funde rede e unidade, usa
`cuid()`, `ON DELETE CASCADE` em prontuário e não tem RLS, estoque, lote nem
outbox. Sem dado em produção, reescrever custa uma semana; migrar custaria meses
e carregaria as escolhas erradas por anos.
