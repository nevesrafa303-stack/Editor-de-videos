# Decisões de produto

Dezesseis decisões tomadas em 14/09/2026, com a consequência de cada uma para o
que é construído. Decisão que só existe em conversa vira discussão de novo em
três semanas — este arquivo existe para isso não acontecer.

O formato repete o do ADR: o que foi decidido, e o que isso custa. Decisão sem
custo declarado é só preferência.

---

## 1 · Próximo módulo: orçamento + financeiro

Fecha o ciclo do dinheiro — plano de tratamento vira proposta, proposta aceita
vira parcelas, parcela paga vira caixa. É o que a clínica de fato cobra.

**Custo.** O funil de vendas fica para depois, então a captação de paciente novo
continua fora do sistema até lá.

## 2 · Recebimento manual agora, gateway na fase 2

A recepção lança o que recebeu, escolhendo a forma. O sistema controla parcela,
saldo e caixa, sem conversar com banco nem maquininha.

**Custo.** Conciliação é humana, e baixa esquecida existe. Em compensação, não
depende de contrato, taxa nem credencial em produção para funcionar no dia 1.
`gateway_charge` e o outbox já estão modelados: a fase 2 pluga sem refazer nada.

## 3 · Particular **e** convênio odontológico

## 4 · Convênio: os dois modelos, conforme o convênio

Alguns convênios a clínica fatura por guia; outros o paciente paga e pede
reembolso. O cadastro do convênio (`payer`) ganha o campo que diz qual é qual, e
o financeiro ganha as duas rotas.

**Custo — e este é o maior de todos.** O modelo de faturamento por guia traz
guia, lote, prazo de repasse e **glosa** (o convênio pagar menos do que foi
faturado, meses depois). Isso não é um campo a mais: é um ciclo de vida paralelo
ao do recebimento do particular, com seu próprio "em aberto".

**Por isso o módulo sai em duas fatias:** primeiro particular e convênio por
reembolso — que é financeiramente idêntico ao particular —, depois faturamento
por guia. A primeira fatia entrega uma clínica operando; a segunda entrega a
clínica que vive de convênio.

### Como a segunda fatia ficou, e o que ela custou

O que foi decidido junto com ela, e por quê:

**Co-participação varia por procedimento.** Um percentual único no cadastro do
convênio não descreve um plano que isenta prevenção e cobra 30% em prótese. O
preço da parte do paciente mora na linha da tabela e é congelado no item do
orçamento. Custo: uma coluna a mais na tabela de preço e no item, e uma coluna a
mais para preencher em cada procedimento coberto.

**Desconto sai da parte do paciente.** A clínica não reduz por conta própria o
que fatura ao convênio — o valor está no contrato, e reduzir é subfaturar. O que
ela negocia é a co-participação. Custo: desconto grande num orçamento de convênio
é recusado, e a frase precisa explicar por quê, senão parece bug.

**Conferência por procedimento.** É o único nível em que se responde "qual
procedimento este convênio glosa sempre?". Custo: a conferência é linha a linha,
mais trabalhosa que digitar o total do lote — e é o trabalho que produz o
argumento na renegociação do contrato.

**Glosa é entidade, não coluna.** Tem motivo obrigatório, prazo contado do
demonstrativo e desfecho. Custo: mais uma máquina de estados. Em troca, glosa não
recorrida deixa de ser prejuízo invisível: ela aparece numa fila ordenada por
prazo, e o que venceu não some — vira a linha mais importante da lista.

**Autorização prévia ficou de fora.** A guia guarda o número da senha e a
validade, preenchidos à mão. O fluxo de pedir, aguardar e receber autorização
depende do portal do convênio, e é uma fatia do mesmo tamanho desta.

## 5 · Desconto: teto por papel, configurável

Cada papel tem um limite (profissional, gestor, dono), guardado na política da
rede e cobrado pelo banco. Acima do teto, o orçamento trava esperando aprovação
de quem tem alçada.

**Custo.** Mais uma tela de configuração, e a certeza de que alguém vai ligar
pedindo para aumentar o próprio teto. O `quote_discount_bound` já existe; falta
a alçada por papel e a fila de aprovação.

## 6 · Atraso: multa 2% + juros 1% ao mês

O padrão de mora do CDC. Calculado no recebimento, mostrado como valor
atualizado, e perdoável com um clique — com registro de quem perdoou.

**Custo.** O valor da parcela deixa de ser um número e passa a ser uma função do
dia em que se paga. Todo relatório precisa dizer qual dos dois está somando.

## 7 · Caixa aberto e fechado por unidade

A recepção abre com o troco, lança o que recebe, e fecha conferindo o contado
contra o esperado. A diferença fica registrada.

**Custo.** Um ritual diário a mais. É o que detecta dinheiro sumindo no balcão —
e `cash_session`, com a trava de lançar em caixa fechado, já está no banco.

## 8 · Seletor de unidade no menu

Quem atende em mais de uma unidade troca a qualquer hora, e a tela inteira passa
a falar daquela unidade.

**Custo.** Baixo: `setActiveUnit` já existe na sessão. Falta a tela e o cuidado
de revalidar tudo que depende da unidade ao trocar.

## 9 · Prontuário: todos com permissão veem tudo

`restrict_chart_to_own_patients` fica **desligada**. Quem tem `chart.read` abre
qualquer ficha da rede, e a trilha de acesso registra.

**Custo.** Nenhum trabalho agora — a política já está construída e testada, e
liga com um `UPDATE` quando a primeira rede grande pedir. O controle é
posterior (auditoria), não anterior (bloqueio).

## 10 · Ocupação: mostrar os dois números

Sobre o tempo vendável (descontando almoço e bloqueios) como número principal, e
sobre o expediente cheio ao lado, como referência.

**Custo.** Um pouco mais de ruído no painel, em troca de não punir o
profissional pelo próprio almoço nem inflar o indicador.

## 11 · Odontograma: dentição alternada manualmente

Um botão troca entre permanente, decídua e mista. O sistema não adivinha pela
idade.

**Custo.** Um clique a mais. Em troca, não erra com criança de 11 anos em plena
troca de dentição — que é exatamente quem mais aparece em odontopediatria. Os 52
dentes já estão no banco.

## 12 · Marca: nome a definir, opções propostas

O produto não se nomeia em lugar nenhum hoje — o que é proposital, e insustentável
para vender. Opções e o racional de cada uma foram entregues; a escolha, o
registro no INPI e o domínio são do dono.

## 13 · Hospedagem: Vercel + Postgres gerenciado

**Consequência boa, e não é sorte.** O contexto de tenant vive em
`set_config(..., is_local => true)`, que morre com a transação. Isso torna o
sistema compatível com pooler em modo transação (Neon, Supabase, PgBouncer) sem
nenhuma adaptação — que é justamente onde uma solução baseada em `SET` de sessão
vazaria tenant entre requisições.

**Cuidado obrigatório no provisionamento.** O usuário padrão de Neon e Supabase
é **dono das tabelas**, e dono ignora RLS. O deploy precisa criar o papel
`crm_app` sem privilégios e conectar com ele. `assertNotBypassingRls()` derruba
o processo se isso for esquecido — de propósito.

## 14 · Retenção do prontuário: configurável por rede, padrão 10 anos

O prazo entra na política da rede, começando em 10 anos após o último
atendimento.

**Custo.** O expurgo automático é trabalho de verdade (varredura, anonimização
parcial, registro do que foi eliminado) e fica para depois. Por ora o sistema
guarda o prazo e não apaga nada sozinho. **Confirme o número com o jurídico
antes do primeiro cliente:** gravei 10 anos como padrão, não como certeza legal.

## 15 · WhatsApp: cada clínica usa o próprio número

A clínica conecta o WhatsApp Business dela; a conversa continua no número que o
paciente já conhece.

**Custo.** Atrito no onboarding: verificação na Meta e aprovação dos modelos de
mensagem, por clínica. Em troca, o paciente não recebe mensagem de número
desconhecido, e um bloqueio por denúncia atinge uma clínica, não o produto
inteiro.

## 16 · Estoque: automático com ajuste na conclusão

A ficha de insumos (`procedure_bom`) sugere o consumo, e o profissional confirma
ou corrige antes de fechar o atendimento.

**Custo.** Um passo a mais em cada conclusão. Pega o caso real do frasco que
rendeu menos — que é o que faz o saldo automático descolar da realidade em duas
semanas.

## 17 · Nota fiscal: só recibo

A NFS-e continua saindo no portal da prefeitura.

**Custo.** Retrabalho para a clínica. Em troca, o produto não precisa integrar
com milhares de prefeituras, que é o problema mais caro e mais chato do
faturamento brasileiro. O gancho fica no recebimento para a fase 2.

## 18 · Migração: importador de planilha

CSV de pacientes — nome, telefone, CPF, nascimento — e, se houver, saldo em
aberto.

**Custo.** Baixo, e resolve a maior parte da ansiedade de quem troca de sistema.
Importar prontuário e histórico financeiro de outro software fica de fora.

## 19 · Cobrança do SaaS: por unidade, por mês

Preço fixo por clínica, sem contar profissionais.

**Custo.** Deixa dinheiro na mesa em rede grande, onde uma unidade com doze
profissionais paga o mesmo que uma com dois. Em troca, é simples de vender e não
cria o incentivo perverso de compartilhar login para economizar.

---

## O que já está construído

| Decisão | Estado |
|---|---|
| 1 · Orçamento + financeiro | pronto, com telas e testes |
| 2 · Recebimento manual | pronto; gateway segue para a fase 2 |
| 5 · Teto de desconto por papel | pronto, cobrado pelo banco |
| 6 · Multa 2% + juros 1% ao mês | pronto, calculado na hora |
| 7 · Caixa por unidade | pronto, com conferência e diferença |
| 8 · Seletor de unidade | pronto |
| 9 · Prontuário sem restrição | pronto (a política existe e está desligada) |
| 10 · Ocupação com os dois números | pronto |
| 11 · Dentição alternada à mão | pronto |
| 12 · Marca | **Áurea** |
| 14 · Retenção configurável | política gravada; expurgo ainda não |
| 16 · Comissão no recebimento | pronto, e cancelada pelo estorno |
| 3 · Particular **e** convênio | pronto na fatia de reembolso |
| 4 · Os dois modelos de convênio | **os dois prontos**: reembolso e faturado por guia |
| 17 · Co-participação por procedimento | pronto; mora na linha da tabela de preço |
| 18 · Glosa com prazo de recurso | pronto, com fila ordenada por prazo |
| 19 · Conferência por procedimento | pronto; é o nível que responde "o que este convênio glosa sempre" |
| 20 · Autorização prévia | só o campo da senha; o fluxo de pedir é outra fatia |
| 21 · Funil por lista, não arrastável | pronto; funciona no teclado e no celular |
| 22 · Ganhar é o aceite do orçamento | pronto, por trigger — não há botão de "ganhei" |
| 23 · Próxima ação com data e responsável | pronto, com fila de pendências |
| 24 · Entrada só por lead cadastrado à mão | pronto; oportunidade a partir de paciente antigo fica para depois |
| 18 · Importador de planilha | pronto: dois passos, duplicado pulado, saldo vira dívida |
| 25 · Painel gerencial sem tabela de totais | pronto; todo número sai dos fatos, nada materializado |
| 26 · Quem atendeu é o profissional do orçamento | pronto; é a mesma regra da comissão |
| 27 · Coorte do funil por abertura, não por movimento | pronto; é a única em que o denominador não se mexe |
| 28 · Saldo em unidade de compra, não de uso | pronto; saldo tem de ser conferível contando o armário |
| 29 · Executar o procedimento é o que baixa o estoque | pronto, na mesma transação |
| 30 · FEFO automático, com o lote podendo ser trocado | pronto; é regra sanitária, não preferência |
| 31 · Sem saldo avisa; sem lote válido recusa | pronto; rastreio não é configurável |
| 32 · Local de estoque fica para depois | um estoque por unidade; `stock_location` segue modelado |
| 33 · Orçado e executado em tabelas separadas | são coortes diferentes; juntar faria sobrar "qual é o certo?" |
| 34 · Desperdício não se dilui no custo do atendimento | painel próprio; é assim que ele some de vista |
| 35 · Telas de estoque leem a unidade ativa | conta-se o armário daqui, não o da outra cidade |
| 36 · Mês fechado compara com o mês calendário | "30 dias antes" não é agosto, e não bate com o fechamento |
| 37 · Exportação é um arquivo por seção | bloco empilhado vira apagar linha para poder somar |

Os demais seguem pendentes, na ordem abaixo.

## O que estas decisões mudam na ordem de construção

1. **Orçamento** — proposta a partir do plano de tratamento, desconto com teto
   por papel e alçada, aceite com assinatura.
2. **Financeiro particular** — parcelas, recebimento manual com multa e juros,
   caixa por unidade, comissão gerada no recebimento.
3. **Seletor de unidade** e os dois números de ocupação — pequenos, entram junto.
4. ~~**Convênio por reembolso**~~ — feito. Tabela de preço por convênio, escolha
   do pagador no orçamento, reprecificação ao trocar. O financeiro não mudou: o
   recebível guarda de qual convênio veio, e nada mais.
5. ~~**Faturamento por guia**~~ — feito. Guia, lote, conferência do repasse por
   procedimento, glosa com prazo e recurso. O aceite passou de recusa a
   roteamento: cobra o convênio pelo contrato e o paciente pela
   co-participação.
6. ~~**Funil de vendas**~~ — feito. Quadro por etapa, contato registrado,
   próxima ação com prazo, e o aceite do orçamento fechando o negócio. **O que
   ficou de fora:** oportunidade a partir de paciente antigo (o botão na ficha),
   formulário público no site, e o funil por vertical — o schema suporta mais de
   um `pipeline`, mas a tela usa o padrão.
7. ~~**Importador de planilha**~~ — feito. CSV de pacientes com conferência antes
   de criar, duplicado pulado e saldo em aberto virando dívida de origem
   `manual`. **O que ficou de fora**, como previsto: prontuário e histórico
   financeiro de outro sistema, e importação de leads, convênios ou tabela de
   preço.

8. ~~**Relatórios gerenciais**~~ — feito. Faturamento por profissional (vendido
   × recebido), conversão do funil por etapa, vencido por unidade, margem por
   procedimento e origem de captação, com período na URL e recorte por unidade.
   Nenhuma tabela nova: cinco consultas e seis índices sobre o que a operação já
   escreve. **O que ficou de fora:** exportação (CSV/PDF), comparação com o mês
   anterior, meta por profissional, e o relatório de acesso ao prontuário — este
   último é LGPD, não gestão, e merece a própria fatia.

9. ~~**Estoque operando**~~ — feito. Entrada com lote nascendo junto, perda,
   acerto por contagem, fila de validade, bloqueio sanitário de lote — e o que
   dá sentido a tudo: **executar o procedimento baixa o material pela ficha
   técnica**, na mesma transação, com FEFO entre lotes e desfazer que devolve
   ao lote de origem. **O que ficou de fora:** local de estoque (armário,
   geladeira), pedido de compra, inventário cíclico com contagem por lista, log
   de temperatura e transferência entre unidades. Todos seguem modelados.

10. ~~**Orçado contra consumido**~~ — feito. "Vendido: margem orçada" (orçamentos
    aceitos, custo congelado na emissão) e "Executado: custo real" (procedimentos
    feitos, custo dos lotes que saíram) lado a lado, com a diferença por
    procedimento — e um painel separado para o que saiu do estoque sem paciente
    do outro lado. **O que ficou de fora:** diferença de QUANTIDADE por
    procedimento, que hoje não existe (a baixa segue a ficha técnica); ela vai
    aparecer quando houver consumo manual por atendimento.

11. ~~**Exportar e comparar**~~ — feito. Cada seção do painel sai em CSV com o
    mesmo recorte da tela, no formato que o Excel em português abre com dois
    cliques; e os cartões do resumo passam a dizer se o período está melhor ou
    pior que o anterior, comparando mês fechado com mês calendário.

Fora desta lista, esperando decisão de terceiros ou trabalho de fora: documentos
e anexos clínicos (armazenamento), WhatsApp (Meta), NFS-e (fase 2), expurgo por
retenção (jurídico).
