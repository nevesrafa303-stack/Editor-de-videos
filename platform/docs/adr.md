# ADR — decisões estruturais

Oito decisões que o resto da arquitetura assume. Cada uma traz o que foi rejeitado,
porque decisão sem alternativa descartada é só preferência.

---

## ADR-001 · Multi-tenancy: banco único, `tenant_id` em tudo, RLS forçado

**Contexto.** O produto é vendido para redes com várias unidades e para clínicas
solo, em self-service com trial. Vazamento entre clientes aqui não é bug de
produto: é dado de saúde de terceiro na tela errada, com ANPD e conselho
profissional envolvidos.

**Decisão.** Banco único, schema compartilhado, `tenant_id` em toda tabela de
negócio, com `ENABLE` **e** `FORCE ROW LEVEL SECURITY`. O app conecta com um papel
(`crm_app`) que **não é dono das tabelas** — dono ignora RLS por padrão, e ninguém
quer descobrir isso em produção. Cada transação abre com
`SET LOCAL app.tenant_id`, e as policies leem daí.

Sem contexto definido, `current_tenant_id()` é `NULL` e as policies não casam com
nada: o sistema **falha fechado**. Isso é testado (`sessao sem tenant nao enxerga
nenhum paciente`).

**Rejeitado.**
- *Schema por tenant*: migration em 2.000 schemas vira evento de manutenção, não
  deploy. E o relatório consolidado de rede — nosso diferencial — viraria `UNION
  ALL` dinâmico.
- *Banco por tenant*: inviabiliza trial self-service pelo custo e pelo tempo de
  provisionamento.
- *Só filtro na aplicação*: é a aposta de que ninguém vai esquecer um `WHERE` em
  cinco anos de código. Mantemos o filtro na aplicação **também**, como
  conveniência de tipos — mas ele não é a garantia.

**Consequências.** Toda tabela nova precisa de `tenant_id` e policy. Para isso não
depender de memória: as policies são criadas por laço sobre o catálogo
(`0014`), e `assert_rls_coverage()` falha o CI se aparecer tabela descoberta.
Foi assim que encontramos cinco tabelas de junção sem RLS — `membership_unit`
entre elas, onde nada impedia ligar um membro da rede A a uma unidade da rede B.

---

## ADR-002 · SQL puro como fonte da verdade, ORM só na leitura

**Contexto.** O produto exige — por requisito, não por gosto — constraint de
exclusão temporal, trigger de máquina de estados, RLS, coluna gerada, índice
parcial, `UNIQUE NULLS NOT DISTINCT` e log append-only.

**Decisão.** O DDL é **SQL versionado** em `db/migrations/NNNN_*.sql`, aplicado em
ordem, reversível por migration de compensação. O acesso tipado no app usa
**Kysely** com tipos gerados por introspecção (`kysely-codegen`).

**Rejeitado.**
- *Prisma como dono do schema*: a linguagem do `schema.prisma` não expressa
  exclusion constraint, trigger, policy, coluna gerada nem grant. Metade do DDL
  viveria em SQL bruto dentro de migrations e a outra metade no `.prisma` — duas
  fontes de verdade e deriva garantida. (O protótipo em `crm/` usa Prisma e
  funciona; ele não tem nenhuma dessas exigências.)
- *Drizzle*: expressa policy e check, mas trigger e exclusion continuam em SQL
  cru. Fica como segunda opção se a equipe preferir schema em TypeScript.

**Consequências.** Perdemos `prisma migrate dev` e Studio; ganhamos um schema que
diz a verdade. O time escreve SQL — o que para um ERP clínico é competência
necessária de qualquer jeito.

---

## ADR-003 · Invariante de negócio mora no banco

**Contexto.** Validação que só existe na aplicação não alcança importador de base,
script de correção, integração futura nem corrida entre dois cliques simultâneos.

**Decisão.** Toda regra cuja violação é **irreversível ou não auditável** é
constraint, trigger ou exclusion constraint:

| Regra | Mecanismo |
|---|---|
| Profissional em dois atendimentos no mesmo horário | `EXCLUDE USING gist` com `tstzrange` |
| Transição de status inválida | `state_transition` (dado) + trigger genérico |
| Pagamento e evolução clínica imutáveis | trigger + `REVOKE UPDATE/DELETE` |
| Aplicação de injetável com lote vencido | trigger com mensagem de negócio |
| Foto sem consentimento de imagem | trigger consultando `has_active_consent()` |
| Total do orçamento divergir dos itens | coluna gerada |

As transições ficam em **tabela**, não em `CASE` no código: a mesma linha
documenta o fluxo, alimenta a interface ("para onde posso mover isto?") e barra a
transição inválida.

**Rejeitado.** *Só validação no app* — ver acima. *Só constraint, sem validação no
app* — mensagem de erro de banco não é mensagem de produto; a aplicação valida
antes para explicar bonito, o banco valida sempre para garantir.

**Consequências.** Erro de banco precisa virar mensagem em português na interface.
Em compensação, 78 testes de invariante rodam sem subir aplicação nenhuma.

---

## ADR-004 · Dinheiro em inteiro, tempo com fuso, id ordenável

**Decisão.**
- **Dinheiro**: `bigint` em centavos. Nunca `float`, nunca `numeric` para valor
  monetário. `bigint` e não `int` porque `int` estoura em R$ 21.474.836,47 — o que
  um orçamento não alcança, mas um acumulado de rede alcança.
- **Tempo**: `timestamptz` em tudo. `date` só onde o dia é o fato (vencimento,
  validade de lote, competência).
- **Id**: UUID v7 (`uuid_generate_v7()`). Ordenável por tempo, então o índice não
  fragmenta como com v4 — e isso importa em `appointment`, `message` e
  `stock_movement`, que crescem sem parar.

**Rejeitado.** *`serial`*: entrega contagem de clientes ao concorrente e dificulta
merge de bases. *UUID v4*: escrita aleatória no índice. *`numeric` para dinheiro*:
convida a comparação com `=` e a arredondamento silencioso na aplicação.

**Consequência.** Todo valor é `bigint` até a borda da interface. Formatação e
parse acontecem em um único lugar.

---

## ADR-005 · Preço versionado e congelado no documento

**Contexto.** Reajuste de tabela não pode alterar orçamento já enviado, nem
recalcular comissão de procedimento já executado. Esse é um erro clássico e caro:
o paciente mostra o print, a clínica mostra o sistema, e os números não batem.

**Decisão.** Duas camadas.
1. **Tabela versionada**: `price_list` tem vigência (`daterange`) e uma exclusion
   constraint impede duas tabelas ativas para o mesmo par unidade/pagador — não
   existe ambiguidade de preço.
2. **Congelamento**: na emissão, `quote_item` copia `unit_price_cents`,
   `unit_cost_cents` e `commission_percent`. O item aponta para
   `price_list_item_id` como proveniência, mas **não depende dele** para valer.

`resolve_price()` centraliza a precedência (unidade+pagador > unidade > pagador >
rede), para orçamento, agenda e simulador não divergirem.

**Consequência.** O custo também é congelado — então a margem histórica de um
atendimento não muda quando o insumo sobe de preço.

---

## ADR-006 · Nada se apaga: soft delete, auditoria imutável e log de leitura

**Decisão.**
- `deleted_at` em entidade sensível; o papel da aplicação **não tem `DELETE`**
  em tabela de negócio. FK usa `ON DELETE RESTRICT` onde apagar o pai destruiria
  histórico (o protótipo em `crm/` usa `CASCADE` — apagar a clínica levava o
  prontuário junto).
- `audit_log` registra escrita: autor, papel, campos alterados, antes e depois,
  IP. Append-only por `REVOKE` **e** trigger.
- `phi_access_log` registra **leitura** de prontuário. É a exigência de LGPD que
  quase nenhum concorrente cumpre: numa investigação, a pergunta é quem *abriu* a
  ficha, não quem editou.
- Evolução clínica não se reescreve: correção é aditamento encadeado
  (`amends_note_id`), com janela de 30 minutos para erro de digitação.

**Consequência.** O banco cresce mais. É o preço de ter o que mostrar quando o
questionamento chega — e chega.

---

## ADR-007 · Outbox transacional, idempotência e fila

**Contexto.** Webhook de pagamento chega duas vezes; a rede cai entre a cobrança e
a resposta; o job de confirmação reprocessa. Cobrar duas vezes ou mandar a mesma
mensagem três vezes queima a clínica com o paciente.

**Decisão.**
- **Saída**: `outbox_message` escrito na **mesma transação** do negócio, com
  `UNIQUE (tenant_id, topic, idempotency_key)`. O worker publica depois do commit.
- **Entrada**: `inbound_event` com `UNIQUE (source, external_id)` — o webhook
  repetido esbarra na unique em vez de virar segundo pagamento.
- **Cobrança**: `gateway_charge` com `idempotency_key` enviada ao provedor.
- **Automação**: `automation_run` com `UNIQUE (rule_id, target_entity, target_id)`
  — a confirmação de consulta existe uma vez por consulta, aconteça o que
  acontecer com o job.
- **Fila**: `job` com `run_at`, tentativas e `dedupe_key`.

**Rejeitado.** *Publicar direto no handler*: a mensagem sai e a transação falha, ou
o inverso. *Fila externa sem outbox*: mesmo problema, com mais infraestrutura.

---

## ADR-008 · Arquivo clínico em storage privado, com chave e não URL

**Decisão.** `clinical_file` guarda `storage_key`, `mime_type` e `checksum_sha256` —
nunca URL pública. O acesso é por URL assinada de curta duração, emitida pelo
servidor depois de checar permissão, e cada emissão vira `phi_access_log`.

**Rejeitado.** *URL pública com nome aleatório* ("ninguém vai adivinhar"): foto de
antes/depois é dado de saúde; segurança por obscuridade não é base legal.

**Consequência.** Nenhuma imagem clínica é servida por CDN pública. Galeria carrega
mais devagar; é o custo correto.

---

## ADR-009 · Relatório é consulta, nunca total guardado

**Contexto.** Todo ERP chega neste ponto: o painel gerencial fica lento, ou
parece que vai ficar, e nasce uma tabela de agregados — `report_daily`,
`faturamento_mensal`, um total por profissional mantido por trigger. A partir
dali existem **duas versões de cada número**: o fato e a cópia. Elas concordam
no começo. Depois vem o estorno lançado fora da trigger, a correção manual, o
importador, o mês fechado reprocessado — e um dia a clínica confere o relatório
contra o extrato e eles não batem. Aquele dia não tem conserto: o número volta a
ser conferido em planilha, e o painel vira enfeite.

**Decisão.** O painel são **consultas** sobre os fatos que a operação já
escreve — `payment`, `quote`, `installment`, `opportunity_stage_history`,
`lead`. Nenhuma tabela de totais, nenhum job noturno, nenhum gatilho de
agregação. Quando a leitura ficar lenta, o remédio é **índice** (a `0031` abre
seis, parciais, casados com a cláusula de cada relatório), depois *materialized
view* com refresh explícito e data do refresh na tela — nunca coluna mantida
por trigger.

Duas regras derivadas, e as duas já custaram bug:

- **Uma definição por pergunta.** "Quem atendeu" é `quote.provider_id`, que é a
  mesma coisa que o banco usa para decidir de quem é a comissão. Se o relatório
  tivesse a própria definição, comissão e faturamento divergiriam sem ninguém
  errar nada.
- **Números da mesma tela têm de fechar entre si.** O desconto vive no
  cabeçalho do orçamento; somar as linhas cruas dava receita bruta na tabela e
  líquida no resumo, na mesma tela. O desconto passou a ser rateado entre os
  itens, com a sobra de arredondamento inteira para o item mais caro.

**Rejeitado.** *Tabela de agregados desde o começo* — otimização sem medida,
pagando com a confiança no número. *Data warehouse separado* — segundo banco,
segunda verdade e atraso de replicação, para uma rede com dezenas de milhares de
linhas por mês.

**Consequência.** O painel custa uma consulta por seção a cada abertura, e esse
é o teto conhecido. Em compensação não existe estado que possa discordar do
extrato — e o relatório que a dona da clínica confere a mão bate.
