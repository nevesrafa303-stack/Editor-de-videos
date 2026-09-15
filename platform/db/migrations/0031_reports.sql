-- =============================================================================
-- 0031 — Relatorios gerenciais: nenhuma tabela nova, so os caminhos de leitura.
--
-- Esta migration nao cria estado. E deliberado, e vale dizer por que: a
-- tentacao em todo ERP e materializar o relatorio — uma tabela `report_daily`
-- alimentada por trigger, um total por profissional guardado em coluna. Toda
-- vez que isso e feito nasce uma segunda versao do numero, e a partir dai
-- existe um dia em que o relatorio e o extrato discordam. Nao ha conserto
-- bom para isso: e um numero que a clinica precisa checar a mao.
--
-- Entao o relatorio e uma CONSULTA sobre os fatos que ja existem — pagamento,
-- parcela, orcamento, oportunidade, lead. Se a consulta e lenta, o remedio e
-- indice, nao copia. O que este arquivo faz e exatamente isso: abrir os
-- caminhos que os agregados percorrem e que ninguem tinha percorrido antes.
--
-- Os quatro recortes que faltavam:
--
--   1. "quanto entrou no periodo"     -> payment por data, so o confirmado
--   2. "o que foi aceito no periodo"  -> quote por accepted_at
--   3. "quem chegou em cada etapa"    -> opportunity_stage_history por etapa
--   4. "quantos contatos entraram"    -> lead e opportunity por created_at
--
-- Os indices sao PARCIAIS onde o relatorio ignora linhas: pagamento estornado,
-- orcamento nunca aceito, registro apagado. Um indice parcial que cobre a
-- clausula do relatorio e menor e mais rapido que o total, e torna explicito
-- no proprio schema qual e a pergunta que ele responde.
-- =============================================================================

-- ------------------------------------------------------- dinheiro que entrou --
-- `payment_date_idx` ja existe em (tenant, unit, paid_at), mas o relatorio da
-- rede inteira nao filtra unidade — e a unidade no meio da chave impede o
-- range scan por data. Este e o mesmo indice sem o degrau do meio, e sem os
-- estornados, que nenhum relatorio de faturamento conta.
create index payment_confirmed_idx on payment (tenant_id, paid_at)
  where status = 'confirmed';

comment on index payment_confirmed_idx is
  'Faturamento por periodo. Estorno nao entra: o par pagamento/estorno se anula.';

-- ---------------------------------------------------------- o que foi vendido --
create index quote_accepted_idx on quote (tenant_id, accepted_at)
  where accepted_at is not null and deleted_at is null;

comment on index quote_accepted_idx is
  'Producao vendida no periodo. A data do aceite, nao a da emissao.';

-- ----------------------------------------------------------- funil no periodo --
-- Conversao por etapa le o historico pela ETAPA, nao pela oportunidade — que e
-- a direcao oposta a do indice de 0004. Sem este, contar quem passou pela
-- etapa "Proposta" no mes varre o historico inteiro da rede.
create index opportunity_stage_history_stage_idx
  on opportunity_stage_history (tenant_id, to_stage_id, changed_at);

create index opportunity_created_idx on opportunity (tenant_id, created_at)
  where deleted_at is null;

create index opportunity_closed_idx on opportunity (tenant_id, closed_at)
  where closed_at is not null and deleted_at is null;

-- ------------------------------------------------------------- captacao --------
create index lead_created_idx on lead (tenant_id, created_at)
  where deleted_at is null;

comment on index lead_created_idx is
  'Origem de captacao: quantos contatos entraram no periodo, por canal.';
