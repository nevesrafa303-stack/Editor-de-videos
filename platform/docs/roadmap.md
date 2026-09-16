# Plano em fases

Recorte por **o que permite cobrar da primeira clínica**, não por ordem de
conforto técnico. O alvo definido é clínica **mista** (odonto + estética), então
as duas verticais precisam existir no MVP — mas cada uma na versão mínima que
resolve o dia.

O schema inteiro já está modelado; fasear aqui é decidir **o que ganha tela e
serviço**, não o que existe no banco. Modelar depois o que já se sabe que vem
custa migration destrutiva com cliente dentro.

---

## Fase 1 — MVP fechável (o que a primeira clínica paga)

**Objetivo:** substituir agenda de papel, planilha de orçamento e caderno de
lote. Se um desses três continuar fora do sistema, a clínica não migra.

| Módulo | Escopo da fase |
|---|---|
| Tenancy | Cadastro de rede e unidade, convite, 5 papéis de sistema, RLS ativa |
| Paciente | Cadastro, contatos, responsável legal, consentimento versionado |
| Agenda | Multi-profissional e multi-cadeira, status, bloqueio, lista de espera |
| Clínico | Anamnese dinâmica, evolução assinada, anexos |
| Odonto | Odontograma interativo, plano por etapa |
| HOF | Mapa facial, aplicação com lote, antes/depois |
| Catálogo | Procedimento, ficha técnica, tabela de preço versionada |
| Orçamento | Item por dente/face e por região, desconto com teto, aceite assinado |
| Financeiro | Recebível, parcela, baixa, caixa diário, inadimplência |
| ~~Estoque~~ | **Feito.** Produto, lote com validade, entrada/baixa, mínimo, alerta de vencimento — e a baixa automática pela ficha técnica, que não estava prevista aqui e é o que impede o estoque de virar caderno paralelo |
| Painel | Resumo do paciente em uma tela; agenda do dia; a receber |

**Fora da fase 1, de propósito:** WhatsApp automático, gateway de pagamento,
contas a pagar, comissão, ~~relatório gerencial de rede~~, portal do paciente.

> **O painel gerencial saiu antes da hora, e por um motivo bom.** Ele estava
> aqui como "fase 2 ou 3", e a razão era custo: relatório costuma exigir
> agregação materializada, job noturno e um segundo modelo de dados. Não
> exigiu. Depois do funil e do faturamento por guia, os fatos que o painel
> precisa ler já estavam todos escritos — pagamento, orçamento aceito,
> histórico de etapa, origem do contato — e a fatia inteira coube em **cinco
> consultas, seis índices e nenhuma tabela nova**. Entregar o que já está
> pago é diferente de antecipar escopo.
>
> Com ele veio, de quebra, a **margem por procedimento** que a fase 3 listava
> como diferencial: preço e custo já ficam congelados no item do orçamento
> desde a fase 1, então a conta era subtração. O que a fase 3 ainda deve é a
> margem sobre o **consumo real** de insumo (ficha técnica × baixa de estoque),
> que é outra pergunta e depende do estoque operando.

**Critério de pronto:** uma clínica opera uma semana inteira sem planilha
paralela.

---

## Fase 2 — o que aumenta receita por cliente

| Entrega | Por que aqui |
|---|---|
| WhatsApp oficial (Cloud API) com caixa de entrada | É o canal real da clínica; depende de aprovação de template pela Meta, que leva tempo — começar cedo |
| Confirmação automática e régua de cobrança | Falta é a maior perda de receita de clínica; primeiro efeito mensurável |
| Funil comercial completo com automação | Transforma o CRM de cadastro em máquina de conversão |
| Gateway (Pix, boleto, cartão) com conciliação | Tira o "vou pagar depois" do fluxo |
| Contas a pagar, centro de custo e comissão | Fecha o financeiro; comissão é o que faz o profissional usar o sistema |
| Ortodontia com manutenção recorrente | Receita recorrente que o concorrente costuma tratar mal |
| Programa de indicação com recompensa | Aquisição mais barata da clínica |
| Relatórios exportáveis | Substitui a planilha que sobreviveu à fase 1 |

---

## Fase 3 — o que diferencia de verdade

| Entrega | Por que é diferencial |
|---|---|
| ~~**Custo real e margem por atendimento**~~ | **Feito.** Orçado e consumido lado a lado por procedimento, com o custo vindo dos lotes que saíram — e o desperdício em painel próprio, porque diluí-lo no custo dos atendimentos é como ele some de vista. O que a fase 3 ainda deve aqui é a diferença de QUANTIDADE por atendimento, que só existe com consumo manual por procedimento |
| ~~**Consolidação de rede**~~ | Saiu parcial com o painel: comparação entre unidades (vencido, recebido) e por profissional já existem. **Continua faltando:** previsão de caixa consolidada |
| **Alertas preditivos** | No-show, paciente inativo, orçamento esfriando, lote que vence antes de ser consumido no ritmo atual |
| **Rastreabilidade sanitária completa** | Recall reverso, log de temperatura, relatório para fiscalização |
| **LGPD operacional** | Exportação e anonimização do titular, relatório de acesso ao prontuário, RoPA |
| **Portal do paciente** | Pré-anamnese, documentos, confirmação, segunda via de recibo |
| **Assinatura ICP-Brasil** | Receituário e atestado com peso jurídico pleno (a fase 1 usa assinatura eletrônica simples com trilha) |

---

## Onde você está complicando demais para o MVP

Dito com franqueza, porque é mais barato agora:

1. **Log de temperatura com sensor.** Está modelado (`temperature_log`), e deve
   ficar modelado. Mas integração com sensor IoT na fase 1 é projeto de hardware
   dentro de um projeto de software. Comece com registro manual duas vezes ao dia
   — que é o que a vigilância cobra hoje.
2. **Conciliação bancária automática.** Exige Open Finance ou OFX por banco. Na
   fase 1, conciliação é tela de conferência com importação de CSV.
3. ~~**Convênio/TUSS.**~~ Este aviso estava certo e foi cobrado: faturamento de
   convênio é um produto inteiro, e saiu em duas fatias — reembolso primeiro
   (financeiramente igual ao particular), guia/lote/glosa depois. A segunda
   custou o que este parágrafo previa: quatro tabelas, três máquinas de estado e
   um ciclo de vida paralelo ao do recebimento. **O que continua fora:**
   autorização prévia com fluxo (só o campo da senha existe), remessa em arquivo
   no padrão da ANS, e `tuss_code` como catálogo mantido.
4. **Formulário dinâmico com construtor visual.** O schema versionado está certo.
   O construtor arrastar-e-soltar não: comece com dois ou três formulários fixos
   bem-feitos, editáveis por JSON.
5. **Cinco papéis configuráveis com permissão granular na fase 1.** A matriz de
   75 permissões existe e está certa. A *tela* de edição de papel pode esperar:
   entregue os cinco papéis prontos e edite no banco enquanto ninguém pede.

## Onde você está simplificando demais e vai pagar caro

1. **"Mensagens automáticas por gatilho" sem controle de janela e de frequência.**
   Sem `window_expires_at`, teto por paciente e horário permitido, a clínica vira
   spam, o número é denunciado e a Meta bloqueia — e aí o produto perde o canal
   principal, não a clínica. Isso está modelado; **não corte na implementação**.
2. **Orçamento sem versão.** Você pediu status, mas não versão. Na prática o
   paciente negocia: sai uma v1 de R$ 12 mil e fecha uma v2 de R$ 9 mil. Sem
   versão você perde a taxa de desconto real e a discussão "mas você tinha me
   falado outro valor". Hoje `quote_status_history` registra a mudança de estado;
   avalie `quote_revision` na fase 2.
3. **Comissão sobre "valor do procedimento".** Sem escolher entre bruto, líquido,
   recebido e margem, você vai pagar comissão sobre dinheiro que não entrou. Por
   isso `commission_rule.basis` tem quatro opções e o padrão é `received`.
4. **"Antes/depois" sem consentimento separado.** Consentimento de tratamento e
   de uso de imagem são bases legais diferentes. Juntar os dois é o erro que vira
   processo quando a foto aparece no Instagram da clínica.
5. **Sem `patient_provider_link`.** Parece detalhe, mas "quem cuida deste
   paciente" é a base de acesso restrito ao prontuário, de comissão por
   indicação interna e de relatório de carteira por profissional. Inferir isso
   varrendo cinco tabelas é lento e — como este projeto descobriu na prática —
   recursivo dentro de uma policy.
6. **Multi-unidade tratado como "vários cadastros".** Paciente é da rede, agenda é
   da unidade, estoque é da unidade, preço pode ser dos dois. Se a primeira
   versão fundir rede e unidade (como o protótipo em `crm/` faz), a separação
   depois é migration destrutiva com cliente dentro.
