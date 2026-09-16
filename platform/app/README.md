# Aplicação

**Áurea** — CRM e prontuário para clínicas de odontologia e harmonização
facial. A camada de acesso ao banco e os módulos que fecham o ciclo:
**funil**, **pacientes**, **agenda**, **prontuário**, **orçamento**,
**financeiro**, **convênios**, **faturamento por guia**, **estoque** e o
**painel gerencial** que lê tudo isso de volta.

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
    funnel/          lead, quadro por etapa, contato, próxima ação e perda
    import/          leitura da planilha, conferência e aplicação
    patient/         consultas, comandos e a porta única em index.ts
    scheduling/      grade do dia, máquina de estados do atendimento, encaixe
    chart/           odontograma, anamnese, evolução assinada e aditamento
    quote/           proposta a partir do plano, alçada de desconto, aceite
    finance/         parcelas, mora, recebimento, caixa e comissão
    payer/           convênio, tabela de preço própria e modo de faturamento
    claim/           guia, lote, conferência do repasse e recurso de glosa
    report/          o painel: cinco perguntas, nenhuma tabela de totais
    stock/           saldo, lote, FEFO e a baixa pela ficha técnica
  shared/
    errors.ts        erros de domínio com código e status
    postgres-errors.ts  constraint do banco -> mensagem de produto
    permissions.ts   GERADO do banco (npm run gen:permissions)
    action-state.ts  contrato de formulário, sem framework e sem banco
    brand.ts         o nome do produto, em um lugar só
    money.ts         divisão de dinheiro que soma exatamente, e "1.234,56" -> 123456
    flash.ts         recado que sobrevive ao recarregamento
    br.ts            CPF, telefone
    csv.ts           leitor de CSV que aguenta planilha de verdade
    format.ts        moeda, data, telefone, idade
  ui/                primitivos visuais (Panel, Field, Badge, Metric, Rail)
  ui/barras.tsx      barras horizontais comparativas, em CSS — sem biblioteca
  app/               rotas (App Router)
tests/               278 testes (integração contra PostgreSQL + unidade)
e2e/                 104 testes de navegador sobre o build de produção
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
| Convênio faturado por guia cobra o convênio, não o paciente | o aceite emite a guia; o paciente deve só a co-participação |
| Desconto em convênio faturado sai da parte do paciente | o que o convênio paga é o que está no contrato |
| Glosa nasce com prazo, sem ninguém abrir | `settle_claim_item` cria junto com a conferência |
| Mensagem escrita por nós chega inteira ao usuário | `P0001` é repassado; o Postgres nunca o emite sozinho |
| Ganhar no funil é aceitar o orçamento | trigger na mesma transação; não há botão de "ganhei" |
| Perder exige motivo | `opportunity_lost_reason`, e o motivo vira relatório |
| Etapa pertence ao funil | chave composta `(stage_id, pipeline_id)` |
| A próxima ação é mantida pelo sistema | trigger recalcula a menor data entre as tarefas abertas |
| Importar confere antes de criar | dois passos, e o primeiro não escreve nada |
| Importar nunca sobrescreve quem já existe | duplicado é pulado, com o nome de quem é |
| A planilha fica guardada linha a linha | `import_row.raw`, com o que veio e o que aconteceu |
| Relatório não guarda total | tudo sai dos fatos; não há tabela que possa discordar do extrato |
| O período do relatório está no endereço | dá para mandar o link; captura de tela ninguém confere |
| O último dia do período entra inteiro | janela em fuso local, aberta só no fim |
| Saldo é contado na unidade em que se compra | frasco, seringa, tubo — o que dá para conferir abrindo o armário |
| Executar o procedimento baixa o material | mesma transação; baixa que depende de lembrar não acontece |
| O lote que sai é o que vence primeiro | FEFO em `pick_stock_lots`, quebrando entre lotes |
| Injetável sem lote válido não é consumido | não é falta de saldo, é falta de rastreio |
| Corrigir estoque é lançar movimento | `stock_movement` é append-only; nada é editado nem apagado |
| Perda entra valorada, nunca a zero | custo do lote, ou o de catálogo; `total_cost_cents` é gerado e não dá para corrigir depois |
| Telas de estoque leem a unidade ativa | conta-se o armário daqui, não o da outra cidade |
| Sem ficha técnica não há margem | custo zero é "ninguém cadastrou", não "de graça" |

## As telas

| Rota | O que resolve |
|---|---|
| `/entrar` | senha + escolha de rede quando a pessoa atende em mais de uma |
| `/funil` | onde os negócios param, quanto se espera fechar, o que esfriou |
| `/funil/[id]` | contatos, próxima ação, propostas — e o botão que vira paciente |
| `/funil/novo` | quem ligou, em um formulário só |
| `/funil/pendencias` | o que a clínica combinou fazer, atrasado primeiro |
| `/importar` | a planilha do sistema antigo, e o histórico do que já veio |
| `/importar/[id]` | o que entra, o que já existe, o que não entra — linha a linha |
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
| `/faturamento` | o que executei, o que enviei, o que recusaram — as três filas |
| `/faturamento/lotes/[id]` | o lote, e a conferência do repasse linha a linha |
| `/faturamento/guias/[id]` | a guia, seus procedimentos, a senha e as glosas dela |
| `/faturamento/glosas` | a fila de recurso, ordenada por prazo |
| `/relatorios` | vendido × recebido por profissional, onde o funil trava, vencido por unidade, margem orçada × custo real por procedimento, desperdício e de onde vem quem fecha |
| `/estoque` | saldo por produto na unidade de compra, quem está abaixo do mínimo, quanto está parado |
| `/estoque/[id]` | lotes, perda, acerto por contagem, bloqueio sanitário e todo o histórico de movimentação |
| `/estoque/entrada` | o que chegou; produto com rastreio entra com lote e validade no mesmo formulário |
| `/estoque/validade` | o que vence — e o que já venceu e continua na prateleira |
| `/sem-permissao` | explica qual permissão faltou, em vez de 404 |

O módulo ainda sem tela (estoque)
aparecem no menu marcados como **breve**, inativos. Sumir esconderia a forma do
produto de quem usa e o que falta de quem constrói.

## Tipos e permissões são gerados, não escritos

```bash
npm run db:types          # introspecção + correção de int8 e date
npm run gen:permissions   # union type a partir da tabela permission
```

`Permission` é um tipo união das 75 permissões do banco. `ctx.assert("quote.aprovar")`
não compila — erro de digitação em permissão seria falha silenciosa de segurança,
e o compilador é mais confiável que revisão.

## Rodando

```bash
cp .env.example .env
npm install
npm run db:reset      # migrations + seed + papel da aplicação
npm run dev           # http://localhost:3000

npm test              # 278 testes (a suíte recria o banco antes)
npm run test:e2e      # 104 testes de navegador sobre o build de produção
npm run test:all      # os 224 testes SQL + os dois acima
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

## O importador

**Dois passos, sempre.** Conferir não escreve nada; importar cria. Quem traz
2.000 pacientes precisa ver quantos vão entrar, quantos já existem e quantos têm
erro antes de confirmar — e importação não tem desfazer. Por isso o botão diz o
número (*"Importar 47 pacientes"*), e não "Importar": a última coisa que se lê
antes de clicar é o tamanho do que vai acontecer.

**Duplicado nunca sobrescreve.** Linha que casa por CPF ou telefone é pulada,
com o nome de quem já está lá. Atualizar em massa um cadastro que a clínica já
editou destrói trabalho sem pedir licença — e a planilha do sistema antigo quase
sempre é a fonte pior. O mesmo vale dentro da própria planilha: export de sistema
velho costuma ter a mesma pessoa duas vezes.

**Um dígito errado não custa uma paciente.** CPF inválido, e-mail torto e data
que não dá para ler entram como *aviso*, e o cadastro nasce sem aquele campo. Só
falta de nome ou de telefone reprova a linha — porque sem telefone não há como
voltar a falar com a pessoa.

**A planilha fica guardada linha a linha**, com o que veio e o que aconteceu com
cada uma. É o que responde, meses depois, *"por que esta paciente está com o
telefone errado?"* — e importação em massa é exatamente de onde vem dado errado
em massa.

**O leitor de CSV é código de verdade, não `split(",")`.** A planilha que a
clínica exporta tem vírgula dentro de aspas, ponto e vírgula como separador
(Excel em português), aspas escapadas, quebra de linha dentro do campo e BOM no
começo. Cada um transforma uma linha boa em cadastro errado, sem avisar.

**O que não é importado:** prontuário e histórico financeiro. Registro clínico de
origem desconhecida não pode virar registro próprio — seria assinar um documento
que ninguém escreveu. Saldo em aberto entra, mas como dívida de origem `manual`,
com a procedência na descrição.

## O funil

**Ganhar é o aceite do orçamento.** Não existe botão de "marcar como ganha": a
oportunidade é fechada por um trigger que observa o aceite, na mesma transação. A
razão é dura — funil que diz "fechei R$ 8.000" com o financeiro vazio é um
relatório em que ninguém confia, e um relatório em que ninguém confia é pior do
que nenhum. **Perder continua sendo decisão de gente**, com motivo obrigatório:
recusar uma proposta é comum e a conversa costuma seguir com outra, então
orçamento recusado *não* perde o negócio sozinho.

**O quadro não é arrastável, de propósito.** Arrastar é agradável no computador
e não funciona no teclado nem bem no celular — então exigiria o botão de mover do
mesmo jeito, e duas formas de fazer a mesma coisa é o dobro de superfície para
quebrar. Quem usa isto é a recepção, no balcão, com o paciente na frente.

**A próxima ação é o que faz o funil funcionar.** Cada negócio carrega uma data
combinada, mantida por trigger a partir das tarefas abertas: concluir a mais
próxima revela a seguinte em vez de deixar a data velha para trás. Sem isso o
quadro vira uma lista de nomes que ninguém volta a olhar, e o contato esfria em
silêncio — que é literalmente o que a coluna "esfriando" conta.

**Lead vira paciente no meio do caminho**, não no fim: o orçamento exige
paciente. Converter cria o cadastro (ou reaproveita o de mesmo telefone —
espalhar o histórico clínico em dois cadastros é o pior estrago que um CRM de
clínica faz) e liga o negócio na pessoa.

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

## O faturamento por guia

Convênio de reembolso é financeiramente igual ao particular: o paciente paga e
pede de volta. **Faturado por guia é outro ciclo de vida inteiro**, paralelo ao
do recebimento, e é o que separa uma clínica que aceita convênio de uma que vive
dele.

**O aceite separa quem deve o quê.** A guia cobra do convênio o que o contrato
diz; o paciente deve a **co-participação**, e só ela. Os dois documentos nascem
na mesma transação, do mesmo aceite. A co-participação varia por procedimento —
um plano isenta prevenção e cobra 30% em prótese —, então ela mora na linha da
tabela de preço e é congelada no item como o resto.

**Desconto sai da parte do paciente, nunca da do convênio.** A clínica não pode
reduzir por conta própria o que fatura ao convênio: isso é subfaturamento, e o
valor está no contrato. O que ela negocia é a co-participação. Desconto maior que
ela é recusado, com essa frase.

**A conferência é por procedimento, não por guia nem por lote.** É o único nível
em que se responde *"qual procedimento este convênio glosa sempre?"* — que é a
informação que muda a negociação do contrato. Conferir só o total do lote guarda
o prejuízo sem guardar a causa.

**Glosa nasce com prazo, sozinha.** Pagar menos do que foi faturado cria a glosa
dentro da própria conferência, com motivo obrigatório e uma data de vencimento do
recurso contada do **demonstrativo** — não de hoje. Depender de alguém lembrar de
abrir a glosa é como se perde o prazo, e glosa não recorrida a tempo vira
prejuízo silencioso. Por isso a fila é ordenada por prazo, não por valor: a glosa
de R$ 80,00 que vence amanhã custa mais que a de R$ 5.000,00 que vence em trinta
dias.

**O que não está aqui:** autorização prévia tem lugar para o número da senha, mas
não o fluxo de pedir e aguardar — isso depende do portal do convênio e é outra
fatia.

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

## O painel gerencial

**Nenhuma tabela de totais.** A tentação em todo ERP é materializar o relatório:
uma `report_daily` alimentada por trigger, um total por profissional guardado em
coluna. Toda vez que isso é feito nasce uma segunda versão do número, e a partir
daí existe um dia em que o relatório e o extrato discordam — e não há conserto
bom para esse dia. Aqui o painel são cinco consultas sobre os fatos que a
operação já escreve. Quando ficar lento, o remédio é índice, não cópia.

**Vendido e recebido ficam lado a lado.** São números diferentes de propósito:
vendido é o orçamento aceito no período, recebido é o dinheiro que entrou nele,
e entre os dois está o parcelamento. Clínica que só olha o primeiro comemora um
mês que ainda não aconteceu; a que só olha o segundo não vê a venda parando.

**Quem atendeu é o profissional do orçamento** — a mesma regra que o banco já
usa para decidir de quem é a comissão. Duas definições de "quem atendeu" seria
uma a mais. Recebimento sem orçamento por trás existe e é legítimo (cobrança
avulsa, acordo): aparece com nome próprio, porque somá-lo a alguém seria mentira
e escondê-lo faria o painel não bater com o caixa.

**A coorte do funil é por abertura, não por movimento.** "Dos negócios que
entraram neste período, até onde cada um chegou" é a única definição em que o
denominador não se mexe embaixo do numerador. Contar "quem passou pela etapa X
no mês" mistura negócio de março com negócio de setembro e produz taxa acima de
100% num mês de faxina no funil. O preço está escrito na tela: negócio aberto
há três dias ainda vai andar.

**O vencido não obedece ao período.** Inadimplência é foto de hoje. Recortá-la
por mês responderia "o que venceu em setembro e não foi pago", que esconde o de
agosto — justamente o que mais dói.

**O desconto do orçamento é rateado entre os itens**, com a sobra de
arredondamento inteira para o item mais caro. O desconto vive no cabeçalho;
somar as linhas cruas mostraria receita bruta na tabela e líquida no resumo, na
mesma tela. Dois números que não fecham lado a lado custam mais credibilidade do
que o relatório inteiro ganha.

**Quatro números por linha viram tabela, não barra.** Margem por procedimento
tem quantidade, receita, custo, margem e percentual: comparar isso se faz lendo
a coluna, não medindo comprimento de barra a olho. As barras ficam onde a
pergunta é de tamanho relativo — quem vendeu mais, onde o funil afunila, qual
unidade deve mais.

**As barras são CSS, não SVG, e não vem biblioteca nenhuma junto.** A primeira
versão foi SVG inline, e SVG obriga a decidir a largura antes de saber quanto
espaço existe: nome de procedimento longo em tela de 13" passava por cima da
barra, porque texto dentro de `viewBox` não reflui. O par de cores foi conferido
por script, não a olho — o teal da identidade **reprova** no piso de croma para
marca: num texto de 13px lê como teal, numa barra de 8px lê como cinza.

**Orçado e executado são duas tabelas, não uma.** "Vendido: margem orçada" conta
orçamentos ACEITOS no período, com preço e custo congelados na emissão — a
expectativa. "Executado: custo real" conta procedimentos FEITOS, com o custo
vindo dos lotes que saíram. São coortes diferentes com colunas parecidas, e sem
o rótulo dizendo qual é qual a pergunta que sobra é "qual número é o certo?" —
e aí nenhum dos dois serve.

**Procedimento sem ficha técnica não vira margem cheia.** É o número mais
perigoso que este painel poderia exibir: custo real zero porque ninguém
cadastrou o que o procedimento consome, lido como 100% de margem. Um implante
de R$ 3.200 com custo zero. A linha aparece, avisa, e não mostra percentual —
a ausência de informação fica visível em vez de virar um número bonito.

**O desperdício tem painel próprio.** Perda e acerto de inventário não entram
na margem de atendimento nenhum, de propósito: diluir esse valor no custo dos
procedimentos é exatamente como o desperdício some de vista. No seed de
demonstração ele é cinco vezes o material que virou atendimento — que é mais
ou menos o tamanho que ele tem numa clínica que nunca olhou para ele.

**O período mora no endereço.** Relatório que não dá para mandar pronto vira
captura de tela no WhatsApp, e ninguém confere uma captura de tela. Período
inválido na URL não derruba o painel: volta para o mês corrente e **diz** que
voltou — cair em silêncio seria pior, a pessoa leria setembro achando que pediu
março.

## O estoque

**Saldo é contado na unidade em que se compra.** A 0012 criou
`stock_movement.quantity` sem dizer em qual unidade, e o seed respondeu das
duas formas: toxina lançada em U (unidade de uso) e resina em tubo (unidade de
estoque). Dois significados no mesmo campo é como um estoque começa a divergir
da prateleira. Agora é sempre frasco, seringa, tubo — porque saldo tem de ser
conferível abrindo o armário, e ninguém conta "467 unidades de toxina"; conta
quatro frascos e um pela metade. Saldo fracionário não é defeito: 4,67 frascos
é exatamente isso.

**A ficha técnica continua em unidade de uso** (30 U de toxina, 0,5 g de
resina), porque é assim que se prescreve. A conversão acontece no consumo, com
a perda esperada dentro — ela saiu da prateleira igual, e fingir que não saiu é
o que faz o inventário nunca fechar.

**Executar o procedimento é o que baixa o material.** Na mesma transação, na
tela do paciente, sem ninguém abrir o estoque. Marcar "feito" numa tela e dar
baixa em outra é o desenho que garante que as duas vão divergir: a primeira
sempre acontece, a segunda depende de alguém lembrar. O consumo roda **antes**
do carimbo de executado — assim uma falha no estoque derruba as duas coisas
juntas, em vez de deixar o item marcado como feito sem o material ter saído.

**O botão diz o que vai sair antes de você clicar.** Quem executa é quem vai
ouvir do paciente "acabou o produto?". Descobrir que faltava depois de o
procedimento estar registrado é a ordem errada.

**FEFO, e não é preferência.** Sai o lote que vence primeiro, quebrando entre
lotes quando um não cobre. É regra sanitária, e é o que impede a clínica de
jogar fora produto bom porque o lote velho ficou no fundo da geladeira.

**Sem saldo avisa; sem lote válido recusa.** São situações diferentes de
propósito. Produto sem rastreio e sem saldo deixa o saldo negativo e visível:
travar aqui impede o dentista de fechar o atendimento por causa de cadastro
desatualizado, e clínica que não consegue trabalhar registra errado para
conseguir (quem quiser travar liga `block_execution_without_stock`). Injetável
sem lote válido é **recusado sempre** — não é falta de saldo, é falta de
rastreio, e não há configuração que torne aceitável gravar consumo de
injetável sem número de lote.

**"Cliquei no dente errado" tem caminho de volta.** Executado não é estado
terminal. Desfazer devolve o material ao lote de onde saiu e escreve uma linha
nova — a do consumo continua ali, ao lado. Estoque que apaga histórico não
defende ninguém numa fiscalização.

**O acerto pergunta o que você contou, não a diferença.** Quem está com a
prancheta na mão escreve o que viu; calcular a diferença de cabeça, com sinal,
é exatamente onde o erro entra. E a confirmação diz o sinal — "faltou 2 tubos",
não "acerto registrado".

**Local de estoque ficou de fora**, e isso teve consequência visível: a chave
do saldo é (unidade, produto, lote, **local**) com `NULLS NOT DISTINCT`, então
entrada com local e baixa sem local viravam duas linhas do mesmo produto, uma
delas negativa. Enquanto local não tem tela, ninguém escreve local.

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

1. ~~**Convênio**~~, ~~**funil de vendas**~~, ~~**importador de planilha**~~ e
   ~~**painel gerencial**~~ — feitos, nesta ordem.
2. **Documentos e anexos** — esperando a decisão de armazenamento. É o único
   item bloqueado por algo que não é trabalho: bucket, retenção e expurgo por
   LGPD são escolha de quem paga a conta.
3. **Orçado contra consumido**, por procedimento. Os dois lados da conta agora
   existem: a margem orçada saiu com o painel, a baixa por ficha técnica saiu
   com o estoque. Falta confrontá-los numa tela — é onde o desperdício
   aparece, e está a um relatório de distância.
4. **Exportar o relatório** (CSV) e **comparar com o mês anterior** — o painel
   responde as cinco perguntas, mas ainda não substitui a planilha de quem
   presta contas para fora.
