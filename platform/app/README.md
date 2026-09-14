# Camada de acesso

Tudo que fica entre uma feature e o banco: contexto de tenant, tipos gerados,
sessão, RBAC e tradução de erro. **Sem interface** — a primeira tela virá depois,
e vai consumir isto.

```
src/
  server/
    db.ts            pool + parsers + guarda contra papel que ignora RLS
    db-types.ts      GERADO do banco (npm run db:types)
    context.ts       withTenant / withUser / withoutContext
    session.ts       sessão opaca no banco, revogável na hora
    auth.ts          login, escolha de rede, logout
  modules/
    patient/         módulo de exemplo, com porta única em index.ts
  shared/
    errors.ts        erros de domínio com código e status
    postgres-errors.ts  constraint do banco -> mensagem de produto
    permissions.ts   GERADO do banco (npm run gen:permissions)
    br.ts            CPF, telefone
tests/               26 testes de integração contra PostgreSQL de verdade
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
npm test              # 26 testes (a suíte recria o banco antes)
npm run test:all      # + os 78 testes SQL
```

O `DATABASE_URL` aponta para um papel **sem privilégios** que herda `crm_app`.
Conectar como dono das tabelas ou superusuário faz o PostgreSQL ignorar toda
policy — por isso `assertNotBypassingRls()` existe e derruba o processo em vez
de logar um aviso.

## Duas coisas que os testes acharam

**Logout não deslogava.** `revokeSession` fazia `UPDATE user_session` sem
contexto de usuário aplicado. A policy é `user_id = current_user_id()`, então o
update afetava zero linhas **em silêncio**: a tela voltava para o login e o
token seguia válido. Virou `auth_revoke_session` (SECURITY DEFINER) e o retorno
agora diz se havia o que revogar.

**Vencimento andava um dia para trás.** `date` chega do driver como `Date` em
meia-noite local; em UTC-3, `toISOString()` de `2026-03-14` devolve `2026-03-13`.
Parcela, validade de lote e competência todas passam por aí. Agora `date` é
string `'YYYY-MM-DD'`, que é o que ela é.

## Próximo passo

Adaptador de borda para Next.js: ler o cookie, resolver a sessão e chamar
`withTenant` — umas 40 linhas. Os módulos e os testes não mudam, porque nada
aqui importa Next.
