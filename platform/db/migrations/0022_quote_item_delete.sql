-- =============================================================================
-- 0022 — Remover item de orcamento
--
-- `crm_app` nasceu sem DELETE em nenhuma tabela de negocio (0014). A postura
-- esta certa e deve continuar: prontuario, pagamento e movimentacao de estoque
-- sao registros do que ACONTECEU, e o que aconteceu nao se apaga.
--
-- Item de orcamento nao e isso. Uma linha de proposta em edicao e rascunho de
-- uma oferta: tirar um procedimento antes de enviar e uso normal, nao
-- adulteracao. Forcar soft delete aqui encheria a tabela de linhas mortas que
-- todo relatorio precisaria aprender a ignorar.
--
-- A regra para estender esta lista: pode apagar o que e COMPOSICAO de um
-- documento ainda em edicao, ou vinculo entre duas entidades. Nunca o que
-- registra um fato. Em duvida, nao conceda.
--
-- A exclusao continua auditada: `quote_item` esta na lista de tabelas com
-- trigger de auditoria (0015), entao a linha removida fica no `audit_log` com
-- autor e hora.
-- =============================================================================

grant delete on quote_item to crm_app;

comment on table quote_item is
  'Linha de proposta. Pode ser removida enquanto o orcamento esta em edicao; a remocao fica no audit_log.';
