# Aplicação

A camada de acesso ao banco e a primeira fatia vertical de interface em cima
dela: entrar, listar pacientes, abrir a visão de um paciente, cadastrar.

```
src/
  server/
    db.ts            pool + parsers + guarda contra papel que ignora RLS
    db-types.ts      GERADO do banco (npm run db:types)
    context.ts       withTenant / withUser / withoutContext
    session.ts       sessão opaca no banco, revogável na hora
    auth.ts          login, escolha de rede, logout
    next/            adaptador de borda — o ÚNICO lugar que importa Next
      session.ts       cookie -> sessão resolvida (cache por request)
      page.ts          withPage: sessão + permissão + withTenant
      action.ts        formAction / buttonAction
      pending-login.ts cookie assinado de 5 min entre senha e escolha de rede
  modules/
    auth/            ações de login e logout
    patient/         consultas, comandos e a porta única em index.ts
  shared/
    errors.ts        erros de domínio com código e status
    postgres-errors.ts  constraint do banco -> mensagem de produto
    permissions.ts   GERADO do banco (npm run gen:permissions)
    action-state.ts  contrato de formulário, sem framework e sem banco
    br.ts            CPF, telefone
    format.ts        moeda, data, telefone, idade
  ui/                primitivos visuais (Panel, Field, Badge, Metric, Rail)
  app/               rotas (App Router)
tests/               28 testes de integração contra PostgreSQL de verdade
e2e/                 12 testes de navegador sobre o build de produção
```

## A regra que organiza tudo

```ts
const resumo = await withTenant(session, async (ctx) => {
  ctx.assert("patient.read");
  return listPatients(ctx, { search: "maria" });
});
```

`withTenant` abre **uma transação**, aplica o contexto que as policies de RLS
leem (`set_config(..., is_local => true)`) e entrega um cliente já preso à
clínica da sessão. Ninguém pega conexão solta.

A transação não é zelo excessivo — é o que torna o pool seguro. O contexto vive
na transação e morre com ela. Se fosse `SET` de sessão, a conexão voltaria ao
pool ainda carregando o tenant do request anterior, e o próximo request leria a
clínica errada. Há um teste exatamente para isso, com pool de **uma** conexão.

O efeito colateral é bom: tudo dentro do bloco compartilha a transação. "Aprovar
orçamento gera as parcelas" é uma coisa só, não duas que podem discordar.

## A borda é fina de propósito

Uma página não abre transação nem monta contexto. Ela chama `withPage`:

```tsx
const { items, total } = await withPage(
  (ctx) => listPatients(ctx, { search: busca }),
  "patient.read",
);
```

E um formulário chama `formAction`, que faz o mesmo e ainda traduz erro de
domínio em mensagem no campo certo.

Tudo que sabe da existência do Next mora em `src/server/next/`. Os módulos não
importam framework nenhum — é por isso que os 28 testes de integração rodam sem
subir servidor. Se um dia a borda for outra coisa, troca-se essa pasta.

O caminho inverso também vale: `src/shared/action-state.ts` não importa nada,
justamente porque componentes de cliente precisam do valor inicial do
formulário. Importá-lo do adaptador arrastaria `pg` para dentro do bundle do
navegador — o `next build` reprova, e com razão.

## O que a camada garante

| Garantia | Como |
|---|---|
| Consulta sem `where tenant_id` volta escopada | RLS, testado com query crua |
| Contexto não vaza entre requests | `set_config` local + transação |
| Conexão com papel errado derruba o processo | `assertNotBypassingRls()` no boot |
| Permissão conferida no servidor | `ctx.assert(...)` antes de tocar o banco |
| Erro de permissão diz qual faltou | `Forbidden.permission` |
| Leitura de prontuário deixa rastro | `ctx.recordChartAccess()` |
| Constraint do banco vira português | `translatePgError` |
| Dinheiro é número, não string | parser `int8` + tipo gerado |
| Data de vencimento não atravessa o dia | parser `date` -> `'YYYY-MM-DD'` |
| Redirecionar não desfaz o que foi escrito | sinal de controle comita a transação |

## As telas

| Rota | O que resolve |
|---|---|
| `/entrar` | senha + escolha de rede quando a pessoa atende em mais de uma |
| `/pacientes` | busca por nome, telefone ou CPF; próxima consulta e saldo em aberto na mesma linha |
| `/pacientes/[id]` | dinheiro, agenda, tratamento pendente e alerta clínico numa tela só |
| `/pacientes/novo` | nome e telefone bastam; o resto pode vir depois |
| `/sem-permissao` | explica qual permissão faltou, em vez de 404 |

Os módulos ainda sem tela (agenda, funil, orçamento, financeiro, estoque)
aparecem no menu marcados como **breve**, inativos. Sumir esconderia a forma do
produto de quem usa e o que falta de quem constrói.

## Tipos e permissões são gerados, não escritos

```bash
npm run db:types          # introspecção + correção de int8 e date
npm run gen:permissions   # union type a partir da tabela permission
```

`Permission` é um tipo união das 66 permissões do banco. `ctx.assert("quote.aprovar")`
não compila — erro de digitação em permissão seria falha silenciosa de segurança,
e o compilador é mais confiável que revisão.

## Rodando

```bash
cp .env.example .env
npm install
npm run db:reset      # migrations + seed + papel da aplicação
npm run dev           # http://localhost:3000

npm test              # 28 testes de integração (a suíte recria o banco antes)
npm run test:e2e      # 12 testes de navegador sobre o build de produção
npm run test:all      # os 78 testes SQL + os dois acima
```

Usuários do seed, todos com a senha `senha-de-teste-123`:

| E-mail | Papel |
|---|---|
| `ana@sorriso.com.br` | dona da Rede Sorriso |
| `carla@sorriso.com.br` | profissional (harmonização) |
| `recepcao@sorriso.com.br` | recepção |
| `financeiro@sorriso.com.br` | financeiro |
| `helena@bellavita.com.br` | dona da Bella Vita (outra rede) |

O `DATABASE_URL` aponta para um papel **sem privilégios** que herda `crm_app`.
Conectar como dono das tabelas ou superusuário faz o PostgreSQL ignorar toda
policy — por isso `assertNotBypassingRls()` existe e derruba o processo em vez
de logar um aviso.

## Três coisas que os testes acharam

**Logout não deslogava.** `revokeSession` fazia `UPDATE user_session` sem
contexto de usuário aplicado. A policy é `user_id = current_user_id()`, então o
update afetava zero linhas **em silêncio**: a tela voltava para o login e o
token seguia válido. Virou `auth_revoke_session` (SECURITY DEFINER) e o retorno
agora diz se havia o que revogar.

**Vencimento andava um dia para trás.** `date` chega do driver como `Date` em
meia-noite local; em UTC-3, `toISOString()` de `2026-03-14` devolve `2026-03-13`.
Parcela, validade de lote e competência todas passam por aí. Agora `date` é
string `'YYYY-MM-DD'`, que é o que ela é.

**Cadastrar paciente levava a uma ficha inexistente.** O framework sinaliza
redirecionamento **lançando**. Dentro da transação isso é indistinguível de
erro, e o banco desfazia tudo: o paciente era inserido, o navegador era mandado
para a ficha dele, e a ficha não existia — 404. `withTenant` agora reconhece o
sinal, **comita** e só então o deixa seguir. Erro de verdade continua desfazendo
tudo; há um teste para cada um dos dois casos.

Nenhuma das três apareceria em revisão de código. Apareceram porque a suíte roda
contra PostgreSQL de verdade e contra o build de produção de verdade.

## Próximo passo

Agenda: é a tela que a clínica abre de manhã e fecha à noite. O banco já tem
`exclusion constraint` de horário, disponibilidade por profissional, bloqueio e
lista de espera — falta a interface.
