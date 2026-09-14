# Matriz de permissões

> Gerada a partir do banco (`permission` × `system_role_permission`). Para atualizar:
> `psql -d crm -f docs/gen_permissions.sql`. O documento não pode divergir do código porque não é escrito à mão.

Papéis de sistema, criados em toda rede nova por `bootstrap_tenant_roles()`. O dono da rede pode
criar papéis próprios e ajustar permissões — toda alteração cai em `audit_log`.

Legenda: **●** tem a permissão · **·** não tem · 🔒 dá acesso a dado de saúde (exige MFA e gera `phi_access_log`).

| Recurso | Ação | O que permite | Dono | Gestor | Profissional | Recepção | Financeiro |
|---|---|---|:--:|:--:|:--:|:--:|:--:|
| `agenda` | `manage` | Definir disponibilidade, bloqueio e recursos | ● | ● | · | ● | · |
| `appointment` | `cancel` | Cancelar e registrar falta | ● | ● | ● | ● | · |
| `appointment` | `read` | Ver agenda | ● | ● | ● | ● | ● |
| `appointment` | `write` | Marcar e remarcar | ● | ● | ● | ● | · |
| `audit` | `read` | Ver trilha de auditoria | ● | ● | · | · | · |
| `automation` | `read` | Ver automacoes | ● | ● | · | · | · |
| `automation` | `write` | Criar e editar automacoes | ● | ● | · | · | · |
| `campaign` | `read` | Ver campanhas | ● | ● | · | · | · |
| `campaign` | `write` | Criar e editar campanhas | ● | ● | · | · | · |
| `cash` | `audit` | Auditar caixa de outro operador | ● | ● | · | · | ● |
| `cash` | `close` | Fechar caixa | ● | ● | · | ● | ● |
| `cash` | `open` | Abrir caixa | ● | ● | · | ● | ● |
| `chart` | `amend` 🔒 | Registrar aditamento em evolucao fechada | ● | ● | ● | · | · |
| `chart` | `read` 🔒 | Abrir prontuario dos proprios pacientes | ● | ● | ● | · | · |
| `chart` | `read_all` 🔒 | Abrir prontuario de qualquer paciente | ● | ● | · | · | · |
| `chart` | `sign` 🔒 | Assinar receituario e atestado | ● | ● | ● | · | · |
| `chart` | `write` 🔒 | Registrar evolucao, anamnese e odontograma | ● | ● | ● | · | · |
| `commission` | `approve` | Aprovar comissao para pagamento | ● | ● | · | · | ● |
| `commission` | `read` | Ver a propria comissao | ● | ● | ● | · | · |
| `commission` | `read_all` | Ver comissao de toda a equipe | ● | ● | · | · | ● |
| `consent` | `collect` | Coletar e revogar consentimento | ● | ● | ● | ● | · |
| `consent` | `read` | Ver consentimentos | ● | ● | ● | ● | · |
| `conversation` | `assign` | Atribuir conversa a outra pessoa | ● | ● | · | · | · |
| `conversation` | `read` | Ver conversas de WhatsApp | ● | ● | · | ● | · |
| `conversation` | `write` | Responder conversas | ● | ● | · | ● | · |
| `inventory` | `adjust` | Ajustar saldo divergente | ● | ● | · | · | · |
| `inventory` | `count` | Realizar inventario | ● | ● | · | · | · |
| `inventory` | `read` | Ver estoque | ● | ● | ● | ● | ● |
| `inventory` | `write` | Entrada, transferencia e baixa | ● | ● | ● | · | · |
| `lead` | `read` | Ver leads | ● | ● | ● | ● | · |
| `lead` | `write` | Criar e editar leads | ● | ● | · | ● | · |
| `lgpd` | `anonymize` 🔒 | Anonimizar paciente | ● | · | · | · | · |
| `lgpd` | `export` 🔒 | Exportar dados do titular | ● | ● | · | · | · |
| `opportunity` | `read` | Ver funil | ● | ● | ● | ● | · |
| `opportunity` | `write` | Mover oportunidade no funil | ● | ● | ● | ● | · |
| `patient` | `delete` | Inativar paciente | ● | ● | · | · | · |
| `patient` | `read` | Ver cadastro de pacientes | ● | ● | ● | ● | ● |
| `patient` | `write` | Criar e editar pacientes | ● | ● | ● | ● | · |
| `payable` | `read` | Ver contas a pagar | ● | ● | · | · | ● |
| `payable` | `write` | Lancar e pagar contas | ● | ● | · | · | ● |
| `payment` | `register` | Registrar recebimento | ● | ● | · | ● | ● |
| `payment` | `reverse` | Estornar pagamento | ● | ● | · | · | ● |
| `price` | `read` | Ver tabela de precos | ● | ● | ● | ● | ● |
| `price` | `write` | Publicar nova tabela de precos | ● | ● | · | · | · |
| `procedure` | `read` | Ver catalogo de procedimentos | ● | ● | ● | ● | ● |
| `procedure` | `write` | Editar catalogo e ficha tecnica | ● | ● | · | · | · |
| `quote` | `accept` | Registrar aceite do paciente | ● | ● | · | · | · |
| `quote` | `approve_discount` | Aprovar desconto acima do teto | ● | ● | · | · | · |
| `quote` | `read` | Ver orcamentos | ● | ● | ● | ● | ● |
| `quote` | `write` | Criar e editar orcamentos | ● | ● | ● | ● | · |
| `receivable` | `read` | Ver contas a receber | ● | ● | · | ● | ● |
| `receivable` | `write` | Criar e renegociar recebiveis | ● | ● | · | · | ● |
| `report` | `clinical` 🔒 | Ver relatorios clinicos | ● | ● | ● | · | · |
| `report` | `export` | Exportar relatorio | ● | ● | · | · | ● |
| `report` | `financial` | Ver relatorios financeiros | ● | ● | · | · | ● |
| `report` | `read` | Ver relatorios operacionais | ● | ● | ● | ● | ● |
| `role` | `write` | Editar papeis e permissoes | ● | ● | · | · | · |
| `tenant` | `read` | Ver dados da rede | ● | ● | · | · | · |
| `tenant` | `write` | Editar dados e plano da rede | ● | · | · | · | · |
| `treatment_plan` | `execute` 🔒 | Marcar item como executado | ● | ● | ● | · | · |
| `treatment_plan` | `read` 🔒 | Ver planos de tratamento | ● | ● | ● | · | · |
| `treatment_plan` | `write` 🔒 | Montar plano e etapas | ● | ● | ● | · | · |
| `unit` | `read` | Ver unidades | ● | ● | · | · | · |
| `unit` | `write` | Criar e editar unidades | ● | ● | · | · | · |
| `user` | `read` | Ver equipe | ● | ● | · | · | · |
| `user` | `write` | Convidar, editar e desativar membros | ● | ● | · | · | · |

**Total: 66 permissões.** Dono 66 · Gestor 64 · Profissional 26 · Recepção 24 · Financeiro 20.

## Decisões de recorte que valem discussão

- **Recepção não abre prontuário.** Ela marca, remarca, cobra no balcão e trabalha o funil. Prontuário é dado de saúde; o acesso é do time clínico. Se a sua operação for de clínica pequena onde a recepcionista é auxiliar de saúde bucal, isso é uma linha na matriz — mas deve ser decisão consciente, não default.
- **Financeiro não vê evolução clínica**, mas vê o que foi executado (para faturar) e o valor. `report.clinical` fica fora.
- **Profissional não mexe em tabela de preço nem aprova desconto.** Vender abaixo do piso é decisão de gestão.
- **`chart.read_all` é o que diferencia** coordenador clínico de profissional comum quando a rede liga `restrict_chart_to_own_patients`.
- **`lgpd.anonymize` só o dono.** Anonimizar é irreversível e apaga base de faturamento histórico.

## Como a permissão é verificada

Em três camadas, e não em uma:

1. **Interface** — o menu e o botão somem (conveniência, não segurança).
2. **Server action / rota** — `assertPermission('quote.approve_discount')` antes de qualquer efeito.
3. **Banco** — RLS garante o tenant e a unidade; `GRANT` nega `DELETE` físico em tabela de negócio; policies restritivas fecham o prontuário quando a rede exige.

A terceira camada existe porque as duas primeiras dependem de alguém ter lembrado. A terceira vale mesmo para script de migração, importador e integração futura.
