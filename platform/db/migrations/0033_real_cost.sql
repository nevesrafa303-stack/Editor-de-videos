-- =============================================================================
-- 0033 — Custo real: o caminho de leitura de "o que saiu por causa do que foi
-- feito".
--
-- Nenhuma tabela nova, pela mesma razao da 0031: o custo real ja esta escrito.
-- Ele e a soma das movimentacoes de consumo ligadas aos itens executados, e
-- guardar esse total numa coluna criaria a segunda versao do numero que um dia
-- discorda da primeira.
--
-- O que falta e indice. Ate aqui `treatment_plan_item` so tinha caminho para
-- os PENDENTES (`treatment_plan_item_pending_idx`, parcial em planned e
-- scheduled) — que faz sentido, porque a operacao pergunta o que falta fazer.
-- O relatorio pergunta o contrario: o que foi feito, e quando. Sem indice isso
-- varre o plano inteiro da rede a cada abertura do painel.
-- =============================================================================

create index treatment_plan_item_executed_idx
  on treatment_plan_item (tenant_id, executed_at)
  where status = 'executed';

comment on index treatment_plan_item_executed_idx is
  'Custo real por periodo: o que foi executado e quando. O indice de 0007 cobre o oposto, os pendentes.';

-- "Saiu do estoque sem procedimento por tras": perda e acerto no periodo. E a
-- outra metade da conta de custo, e a que ninguem quer ver grande — material
-- que sumiu sem paciente nenhum do outro lado.
create index stock_movement_sem_paciente_idx
  on stock_movement (tenant_id, occurred_at)
  where kind in ('loss', 'adjustment');

comment on index stock_movement_sem_paciente_idx is
  'Perda e acerto por periodo. Custo que nenhum procedimento carrega — e por isso mesmo precisa de tela.';
