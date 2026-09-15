-- =============================================================================
-- 0026 — Retirar procedimento da tabela de um convenio
--
-- Mesma regra de 0022: pode apagar o que e COMPOSICAO de um documento ainda em
-- edicao, ou vinculo entre duas entidades. Nunca o que registra um fato.
--
-- Uma linha de `price_list_item` e composicao de uma tabela de precos — um
-- catalogo, nao um acontecimento. E "este convenio nao cobre resina" precisa de
-- uma forma de ser dito: guardar preco zero faria a resina aparecer como
-- gratuita na proposta, que e pior do que nao aparecer.
--
-- O que NAO se apaga continua de pe: a tabela em si (`price_list`) e
-- versionada e so muda de status, e o orcamento ja emitido guarda o preco
-- congelado no proprio item, com `price_list_item_id` apenas como referencia.
-- Tirar a linha da tabela de hoje nao mexe em nenhuma proposta de ontem.
--
-- A exclusao fica auditada: `price_list_item` tem trigger de auditoria (0015),
-- entao a linha removida permanece no `audit_log` com autor e hora.
-- =============================================================================

grant delete on price_list_item to crm_app;

comment on table price_list_item is
  'Preco de um procedimento numa tabela. Pode ser removido — remover significa "nao cobre" — e a remocao fica no audit_log.';
