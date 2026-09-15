# Aplicação

**Áurea** — CRM e prontuário para clínicas de odontologia e harmonização
facial. A camada de acesso ao banco e os cinco módulos que fecham o ciclo:
**pacientes**, **agenda**, **prontuário**, **orçamento**, **financeiro** e
**convênios**.

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
    scheduling/      grade do dia, máquina de estados do atendimento, encaixe
    chart/           odontograma, anamnese, evolução assinada e aditamento
    quote/           proposta a partir do plano, alçada de desconto, aceite
    finance/         parcelas, mora, recebimento, caixa e comissão
    payer/           convênio, tabela de preço própria e modo de faturamento
  shared/
    errors.ts        erros de domínio com código e status
    postgres-errors.ts  constraint do banco -> mensagem de produto
    permissions.ts   GERADO do banco (npm run gen:permissions)
    action-state.ts  contrato de formulário, sem framework e sem banco
    brand.ts         o nome do produto, em um lugar só
    money.ts         divisão de dinheiro que soma exatamente, e "1.234,56" -> 123456
    flash.ts         recado que sobrevive ao recarregamento
    br.ts            CPF, telefone
    format.ts        moeda, data, telefone, idade
  ui/                primitivos visuais (Panel, Field, Badge, Metric, Rail)
  app/               rotas (App Router)
tests/               129 testes (integração contra PostgreSQL + unidade)
e2e/                 60 testes de navegador sobre o build de produção
scripts/demo.mjs     monta o cenário de demonstração pela interface
scripts/capturas.mjs captura as telas em PNG (documentação, não teste)
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
| Hora na tela é a da clínica, não a do servidor | fuso vem na sessão; formatação exige ele |
| Abrir prontuário deixa rastro, na mesma transação | `ctx.recordChartAccess()` |
| Registro clínico não se apaga nem se reescreve | `REVOKE` + trigger; correção é aditamento |
| Desconto respeita alçada e tabela, o menor manda | trigger `check_quote_discount` |
| Parcelas somam exatamente o total | `parcelar()` e `split_amount()`, resto na primeira |
| Aceitar orçamento gera o a receber | trigger, na mesma transação |
| Multa e juros nunca são gravados | `installment_charges()`, calculado na hora |
| Dinheiro em espécie exige caixa aberto | `payment_method.affects_cash_session` |
| Trocar de unidade muda agenda, caixa e fuso | unidade ativa vive na sessão, no banco |
| Preço de convênio vence o particular | `resolve_price`, uma vez, no banco |
| Convênio faturado por guia não vira dívida do paciente | trigger recusa o aceite, com a saída na frase |

## As telas

| Rota | O que resolve |
|---|---|
| `/entrar` | senha + escolha de rede quando a pessoa atende em mais de uma |
| `/pacientes` | busca por nome, telefone ou CPF; próxima consulta e saldo em aberto na mesma linha |
| `/pacientes/[id]` | dinheiro, agenda, tratamento pendente e alerta clínico numa tela só |
| `/pacientes/novo` | nome e telefone bastam; o resto pode vir depois |
| `/agenda` | grade do dia por profissional, ocupação, e a fila com as transições |
| `/agenda/novo` | encaixe; conflito de horário é recusado pelo banco |
| `/pacientes/[id]/prontuario` | odontograma, anamnese, evoluções e a trilha de quem abriu |
| `/orcamentos` | quanto está parado em cada estágio, e onde |
| `/orcamentos/[id]` | itens congelados, desconto com alçada, aceite assinado, margem |
| `/orcamentos/novo` | nasce do plano de tratamento, sem duplicar procedimento |
| `/financeiro` | o que venceu, o que vence, o que entrou — e o recebimento |
| `/financeiro/caixa` | abertura, sangria, e o fechamento que expõe a diferença |
| `/convenios` | quem paga, como fatura, e quantos preços cada um tem |
| `/convenios/[id]` | a tabela do convênio ao lado da particular, e o que a clínica abre mão |
| `/sem-permissao` | explica qual permissão faltou, em vez de 404 |

Os módulos ainda sem tela (funil, estoque)
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

npm test              # 129 testes (a suíte recria o banco antes)
npm run test:e2e      # 60 testes de navegador sobre o build de produção
npm run test:all      # os 118 testes SQL + os dois acima
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

## A agenda

A grade é desenhada a partir de `provider_availability`; cada atendimento é
posicionado pelo **minuto local**, calculado no banco a partir do fuso da
unidade. Bloqueio aparece hachurado porque um buraco sem explicação faz a
recepção remarcar em cima do almoço de alguém.

A fila abaixo da grade opera a máquina de estados — confirmar, receber,
iniciar, concluir, faltar, cancelar. A lista de botões espelha
`state_transition`, mas **não é a autoridade**: quem recusa transição inválida
é o trigger. A tela existe só para não oferecer um botão que vai dar erro.

Encaixe em horário ocupado não é validado na tela: a `exclusion constraint`
recusa, e a mensagem do Postgres vira português na borda. Duas abas abertas ao
mesmo tempo não conseguem furar isso.

## O prontuário

Três regras mandam neste módulo, e nenhuma delas mora no TypeScript:

**Nada se apaga.** `crm_app` não tem `DELETE` em `clinical_note` — o `GRANT` é a
primeira linha, a trigger é a segunda. Evolução fechada também não se reescreve:
corrige-se com **aditamento**, e a original fica ao lado da correção, fechada.

**Abrir a ficha deixa rastro.** `ctx.recordChartAccess()` grava na mesma
transação da leitura — se a transação volta atrás, o log volta junto. A tela diz
isso a quem abre, e quem tem `audit.read` vê a lista. Trilha que ninguém
consegue ler é custo de armazenamento com aparência de conformidade.

**Quem não pode ver o prontuário não descobre que ele existe.** A política
restritiva da rede (`restrict_chart_to_own_patients`) é aplicada pelo banco nas
tabelas clínicas. O módulo pergunta ao banco — `can_view_patient_chart()`, a
mesma função que as policies usam — antes de montar a ficha, e responde
"paciente não encontrado". Reimplementar a regra aqui criaria duas versões dela.

No odontograma, o que um registro **substitui** é regra de produto, não do
banco: condição de dente inteiro (ausente, canal, coroa) substitui tudo daquele
dente; condição de face substitui só o que disputa a mesma face. Cárie na
oclusal e restauração na mesial convivem — e o registro substituído continua
existindo, apontando para quem o substituiu.

## O orçamento

Nasce do plano de tratamento: o item planejado vira linha da proposta, com o
preço resolvido pela tabela vigente e **congelado** ali. Reajustar a tabela
amanhã não altera a proposta que o paciente recebeu — que é a razão de a tabela
de preços ser versionada. O vínculo é nos dois sentidos, então o mesmo
procedimento não entra em dois orçamentos e a clínica não cobra duas vezes.

**Desconto tem dono.** Dois tetos valem juntos e o menor manda: o da tabela de
preços (por procedimento, protege margem) e a **alçada do papel** — recepção 5%,
profissional 10%, gestor 20%, dono sem teto. A tela mostra o teto de quem está
olhando *antes* de digitar; o banco recusa depois. Aprovar não é carimbo que
libera qualquer valor: troca o teto pelo de quem aprovou.

**O aceite fecha.** Assinatura eletrônica simples — hash do conteúdo, de quem
assinou, de quando, mais o IP — e o `quote_accepted_signature` do banco recusa
aceite sem ela. Depois de aceito, o orçamento para de aceitar edição.

## O convênio

**A tabela do convênio vence a particular, e quem decide é o banco.** Uma função
só — `resolve_price` — resolve a precedência (unidade sobre rede, convênio sobre
particular) e é chamada tanto pelo plano de tratamento quanto pela tela de item.
Reimplementar essa ordem na aplicação daria dois lugares para o preço sair
diferente, e preço errado numa proposta é um desconto que ninguém autorizou.

**Procedimento sem preço na tabela do convênio não é gratuito, é não coberto.**
Definir preço zero REMOVE a linha, e o orçamento volta a usar a particular.
Guardar um zero faria o procedimento aparecer valendo nada na proposta — que é
pior do que não aparecer.

**Trocar o convênio reprecifica a proposta inteira**, e a tela diz quantos itens
mudaram. Trocar o pagador sem mexer no preço deixaria valor de particular com
carimbo de convênio: o pior dos dois mundos, e um erro que só aparece quando o
paciente questiona a diferença.

**Faturado por guia é recusado, não improvisado.** Enquanto o faturamento por
lote não existir, aceitar um orçamento de convênio faturado é recusado **pelo
banco**, com uma frase que nomeia o convênio e diz o que fazer no lugar. A
alternativa — deixar o aceite passar — geraria parcelas no nome do paciente para
uma conta que é do convênio, e a clínica só descobriria na cobrança.

## O financeiro

**Aceitar o orçamento gera as parcelas — no banco, por trigger, na mesma
transação.** Não é a aplicação que lembra de chamar: se fosse, um importador,
um script de correção ou um retry pela metade deixaria orçamento fechado sem
nada a receber, e a clínica descobriria no fechamento do mês. A entrada vira a
primeira parcela, vencendo hoje; o restante se divide em parcelas mensais que
somam exatamente o total.

**Multa e juros nunca são gravados.** Parcela vencida vale um número diferente
a cada dia — congelar isso numa coluna seria mentir amanhã. `installment_charges()`
calcula na hora, com os percentuais da política da rede (2% de multa, 1% ao mês
*pro rata die*), e arredonda **para baixo**: numa cobrança contra o paciente, o
centavo da fração fica com ele. A mesma função alimenta a tela e o recebimento,
então os dois nunca discordam.

**O pagamento separa principal de mora.** A parcela só enxerga o principal — é
o que `installment_paid_bound` exige, e está certo. Multa e juros vão em colunas
próprias, entram na gaveta e ficam de fora da comissão: quem financiou o atraso
foi a clínica, não o profissional.

**Comissão nasce do recebimento e morre com o estorno.** Paciente que parcelou
em 10x e parou na 3ª não gera comissão sobre as 7 restantes.

**O caixa é só para dinheiro vivo.** PIX e cartão caem na conta e não mudam o
que a gaveta tem que ter no fim do dia — quem decide é
`payment_method.affects_cash_session`. Receber em espécie sem caixa aberto é
recusado, porque sem isso não há o que conferir no fechamento.

## Três acabamentos que faltavam

**Seletor de unidade.** Quem atende em mais de uma escolhe no menu, e a tela
inteira acompanha — agenda, caixa e o fuso que formata a hora. A escolha vive na
**sessão, no banco**, não num cookie: é ela que decide em que caixa o dinheiro
entra, e isso não pode depender do navegador lembrar. Quem atende em uma
unidade só não vê seletor nenhum.

**Ocupação com os dois números.** O principal desconta almoço e bloqueios — é o
tempo que dá para vender. Ao lado, o percentual sobre o expediente cheio, que é
a referência de quem combinou o horário com o profissional. Contar o almoço
como capacidade ociosa punia o profissional pelo próprio almoço.

**Dentição alternável.** Permanente, decídua e mista, escolhidas à mão. Não é
deduzido da idade de propósito: criança de 11 anos está em plena troca, e
adivinhar erra justamente em quem mais aparece na odontopediatria. Na mista os
dentes encolhem para os 52 caberem sem rolagem — ler metade do odontograma por
vez não serve.

## Onze coisas que os testes acharam

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

**A lista mostrava "sem próxima consulta" para quem tinha consulta marcada.**
`patient.next_appointment_at` estava documentada como "mantida por job noturno",
e o job não existia. Cache que só um job atualiza é cache que mente o dia
inteiro: a denormalização passou a ser mantida **na escrita**, por trigger, na
mesma transação que marca a consulta. O job continua fazendo sentido como
reparo — uma consulta que passou deixa de ser a próxima sem que ninguém escreva
nada. A auditoria ignora esse recálculo: sem isso, cada confirmação viraria uma
linha na trilha e a trilha clínica ficaria ilegível.

**A consulta das 14:00 aparecia às 17:00.** O banco estava certo — `timestamptz`
guarda o instante. Quem errava era a formatação, que usava o fuso do processo
(UTC no servidor). Fuso não é preferência de quem olha: é propriedade da unidade
onde o atendimento acontece. Agora ele vem com a sessão, e nenhuma função de
data tem valor padrão — passar o fuso é obrigatório, ou não compila.

**Array de enum chegava como texto, e o teste de integração passou assim.** O
`pg` traz parser para `text[]` e `uuid[]`, mas não para `tooth_surface[]`: a
coluna chegava como a string `"{O,M}"` enquanto o tipo gerado dizia
`ToothSurface[]`. O erro é do pior tipo — `"{O,M}".includes("M")` é `true` e
`.length > 0` também, então o teste de integração passou e a **tela** quebrou no
`.join()`. Os parsers agora são descobertos no catálogo do banco, uma vez por
processo, e as três portas de acesso esperam por eles.

**Com a política restritiva ligada, o prontuário abria vazio.** A tabela
`patient` não carrega a policy de prontuário — quem carrega são as tabelas
clínicas. Um profissional barrado via a ficha abrir com odontograma vazio e
nenhuma evolução: parecia paciente sem histórico, e era acesso negado. Pior, a
abertura entrava na trilha como se tivesse acontecido.

**O botão não fazia nada e não dizia por quê.** O campo "Dente", em branco,
virava string vazia e falhava a validação — e a mensagem não tinha onde
aparecer, porque o aviso de topo se calava quando a frase já estava em algum
campo, e aquele campo não desenhava erro. O aviso passou a nunca se calar:
silêncio é pior que repetição. A frase específica só sobe para o topo quando
não tem campo onde encostar.

**As parcelas não somavam o total.** R$ 2.380,00 em 6 vezes aparecia como
"6x de R$ 396,67" — que dá R$ 2.380,02. `parcelar()` divide em centavos
inteiros e joga o resto na primeira parcela; as demais ficam idênticas. Há um
teste que soma as parcelas de dezenas de combinações e exige o total exato.

**Cada rede só podia ter um recebível sem número.** `receivable_code_uk` era
`unique nulls not distinct (tenant_id, code)` com `code` anulável — e em NULLS
NOT DISTINCT dois nulos colidem. O segundo recebível manual da rede era
recusado com um erro de chave duplicada que não explica nada. Virou índice
parcial, e o número passa a ser atribuído sempre.

**Multa e juros não tinham onde ser registrados.** A parcela não aceita receber
mais do que vale, o que está certo; mas o paciente atrasado entrega mais do que
a parcela. O recebimento era recusado com "o valor excede o saldo" e a recepção
ficava com o dinheiro na mão. O pagamento passou a separar principal de
encargo.

**A confirmação sumia junto com a linha.** Parcela quitada sai do recorte "em
aberto" e leva a mensagem de sucesso embora; caixa recém-aberto troca o
formulário pela gaveta. A pessoa clicava, tudo mudava, e nada confirmava o que
tinha acontecido. O recado passou a viajar na URL e a ser desenhado pela
página, que continua existindo depois da ação.

Nenhuma das onze apareceria em revisão de código. Apareceram porque a suíte roda
contra PostgreSQL de verdade, contra o build de produção de verdade — e porque
alguém olhou as telas.

## O que o prontuário ainda não tem

Documentos (receituário, atestado, encaminhamento), anexos de imagem e
prescrição estão modelados no banco (`clinical_document`, `clinical_file`,
`prescription_item`) e ainda não têm tela. Foram deixados de fora desta fatia de
propósito: anexo exige decisão de armazenamento (bucket, retenção, expurgo por
LGPD) que ainda não foi tomada.

## Próximo passo

O ciclo comercial está fechado e os acabamentos decididos entraram. Faltam, em
ordem de valor:

1. **Convênio**: tabela de preço por convênio (reembolso), depois faturamento
   por guia com lote, repasse e glosa. É o maior item de escopo que resta.
2. **Funil de vendas** — a ponta de captação que o CRM ainda não tem.
3. **Importador de planilha** — quando houver cliente definido.
4. **Documentos e anexos** — esperando a decisão de armazenamento.
