# OdontoCRM

CRM para **clínicas de odontologia e estética**. Multi-clínica (SaaS), em
português, com os quatro módulos que a operação de uma clínica realmente usa:

| Módulo | O que resolve |
|---|---|
| **Funil de vendas** | Lead do Instagram/indicação até virar paciente, com follow-up e motivo de perda |
| **Agenda** | Marcação por profissional e sala, com bloqueio de conflito e controle de falta |
| **Prontuário** | Anamnese, evolução assinada, odontograma FDI e anexos com consentimento |
| **Orçamentos e financeiro** | Plano de tratamento, aprovação que gera as parcelas, baixa de pagamento e comissão |

Stack: **Next.js 16 (App Router) · TypeScript · Prisma 7 · PostgreSQL · Tailwind 4**.

---

## Rodando localmente

```bash
docker compose up -d          # Postgres em localhost:5432
cp .env.example .env          # ajuste AUTH_SECRET
npm install
npm run db:migrate            # cria o schema
npm run db:seed               # duas clínicas de demonstração
npm run dev                   # http://localhost:3000
```

Sem Docker, basta apontar `DATABASE_URL` para qualquer PostgreSQL 14+.

### Entrar

O seed cria duas clínicas. Todas as senhas são `odonto123`.

| E-mail | Perfil | O que enxerga |
|---|---|---|
| `ana@sorrisoestetica.com.br` | Proprietária | Tudo |
| `bruno@sorrisoestetica.com.br` | Profissional | Agenda, prontuário, orçamentos |
| `recepcao@sorrisoestetica.com.br` | Recepção | Agenda, pacientes, funil — **sem** prontuário |
| `financeiro@sorrisoestetica.com.br` | Financeiro | Recebíveis e relatórios — **sem** prontuário |
| `helena@bellavita.com.br` | Proprietária (outra clínica) | Só os dados da Bella Vita |

Entrar com a Helena é a forma mais rápida de conferir o isolamento: nenhum
paciente, lead ou parcela da Clínica Sorriso aparece na conta dela.

---

## Decisões que sustentam o produto

### Isolamento entre clínicas não depende de disciplina

Filtrar por `clinicId` em cada consulta é o tipo de coisa que se esquece uma vez
e vira prontuário de um cliente aparecendo na conta de outro. Aqui o filtro está
uma camada abaixo das features: `scopedDb(clinicId)`
([`src/server/tenant-scope.ts`](src/server/tenant-scope.ts)) devolve um Prisma
Client que injeta o `clinicId` em toda leitura, confere a posse antes de todo
`update`/`delete`/`upsert`, e **recusa** um `clinicId` explícito diferente do da
sessão em vez de silenciosamente devolver os dados certos — erro de programação
deve quebrar alto, não virar dado errado em produção.

Nas criações o tipo do Prisma continua exigindo `clinicId`: o compilador cobra o
campo, o runtime confere o valor. As páginas nunca tocam o `PrismaClient` cru;
recebem o cliente já preso à clínica via `requireTenant()` / `requirePermission()`.

Isso é coberto por [teste de integração contra o Postgres de verdade](tests/tenant-isolation.test.ts),
incluindo o caso que passou despercebido na primeira versão: um `upsert` por
campo único (o odontograma é único por paciente) encontrava o registro da outra
clínica e o sobrescrevia.

### Dinheiro é inteiro em centavos

Nenhum valor monetário é `float`. O parcelamento
([`src/domain/installments.ts`](src/domain/installments.ts)) distribui a sobra de
centavos na primeira parcela — prática de mercado, e o teste varre 2.400
combinações de valor × número de parcelas para garantir que a soma das parcelas é
sempre exatamente o total.

### Papéis desenham telas diferentes

A recepção marca e remarca o dia inteiro, mas não abre prontuário. O financeiro
vê recebíveis, não evolução clínica. A matriz está em
[`src/server/permissions.ts`](src/server/permissions.ts) e vale nos dois níveis:
o menu some **e** a rota redireciona.

A recepção consulta o que o paciente deve (para cobrar no balcão) mas não dá
baixa em pagamento — essa separação é proposital; se a sua clínica trabalha
diferente, é uma linha na matriz.

### LGPD desde o cadastro

Consentimento de dados e de uso de imagem são campos com data, não caixinhas
soltas: anexar foto de "antes e depois" de paciente que não autorizou é
bloqueado na ação, não só escondido na interface. Evolução clínica fica assinada
com nome e registro de quem escreveu e não tem botão de apagar.

### Aprovar orçamento é o ponto onde o comercial vira financeiro

`approvePlan` grava o plano e as parcelas na mesma transação: não existe
orçamento aprovado sem recebível correspondente. A prévia das parcelas na tela
usa a mesma função do servidor, então o que a recepção mostra ao paciente é
exatamente o que será cobrado.

---

## Arquitetura

```
src/
  domain/      Regras puras, sem banco e sem framework — testadas isoladamente
               (parcelamento, conflito de agenda, funil, odontograma, orçamento)
  lib/         Formatação e validação BR (CPF, CNPJ, telefone, WhatsApp, datas, moeda)
  server/
    db.ts             PrismaClient único por processo
    auth.ts           Sessão em cookie httpOnly assinado (JWT/jose) + bcrypt
    tenant-scope.ts   Isolamento multi-tenant (sem dependência do Next, para ser testável)
    tenant.ts         requireTenant / requirePermission para páginas e ações
    permissions.ts    Matriz de papéis
    actions/          Server actions (validação com zod, uma por módulo)
  app/
    (auth)/    Entrar e cadastrar clínica
    (app)/     Painel, funil, agenda, pacientes, orçamentos, financeiro, configurações
    api/       Busca de pacientes usada pelo seletor
  components/  Design system enxuto + odontograma + formulários compartilhados
```

Mutação passa por **server action** (validada com zod, com permissão conferida no
servidor); leitura acontece em **server component** com o cliente já escopado. O
cliente só carrega o que precisa de interação: kanban, odontograma, seletor de
paciente e formulários.

---

## Testes

```bash
npm test          # 64 testes: domínio + isolamento multi-tenant (precisa do banco)
npm run test:e2e  # 9 fluxos no navegador (precisa do app rodando)
npm run test:all
```

Os testes de navegador ([`e2e/smoke.spec.ts`](e2e/smoke.spec.ts)) percorrem login,
painel, agenda (inclusive a recusa de horário em conflito), funil, aprovação de
orçamento com geração de parcelas, prontuário com odontograma e o recorte de
permissão da recepção. Para usar um Chromium já instalado:

```bash
E2E_CHROMIUM=/caminho/para/chrome npm run test:e2e
```

---

## O que ainda não está aqui

Escopo consciente de uma primeira versão. Em ordem de valor para a clínica:

1. **WhatsApp automático** — hoje os links abrem a conversa já com a mensagem
   pronta; falta integração com a API oficial para lembrete de consulta e
   confirmação automática (é o que mais derruba falta).
2. **Upload de arquivos** — anexos guardam URL; falta storage (S3/R2) com
   thumbnail e visualização de antes/depois lado a lado.
3. **Recorrência e bloqueio de agenda** — férias, almoço e retorno programado.
4. **Relatórios gerenciais** — faturamento por profissional e por procedimento,
   ticket médio por origem, previsão de caixa.
5. **Emissão fiscal e conciliação de maquininha.**
6. **Trilha de auditoria exposta** — a tabela `AuditLog` existe no schema mas
   ainda não é alimentada nem exibida.

### Dependências

`npm audit` está em zero, incluindo produção. Duas advisories chegavam
transitivamente pelo CLI do Prisma (`deepmerge-ts` e `mysql2` — este último um
driver MySQL que o projeto nem usa) e são resolvidas por `overrides` no
`package.json`. As versões forçadas foram verificadas contra o CLI real:
`prisma validate`, `generate`, `migrate` e o seed continuam funcionando. Quando
o Prisma publicar uma versão já corrigida, os `overrides` podem sair.
