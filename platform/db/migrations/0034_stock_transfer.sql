-- =============================================================================
-- 0034 — Transferencia entre unidades: material que anda, sem sumir no meio.
--
-- A 0012 criou `transfer_in`, `transfer_out` e `transfer_group_id` e parou ai.
-- Sem o par amarrado, mover uma caixa do Centro para a Zona Sul so tinha dois
-- caminhos, e os dois mentem: registrar PERDA na origem e COMPRA no destino
-- (a clinica passa a ter um desperdicio que nao teve e uma compra que nao
-- fez), ou nao registrar nada (e os dois saldos ficam errados ate o proximo
-- inventario).
--
-- -------------------------------------------------------------------------
-- TRANSFERENCIA E UM PAR, OU NAO E NADA
-- -------------------------------------------------------------------------
-- Uma saida sem a entrada correspondente e material evaporando entre unidades
-- — e some sem deixar rastro, porque cada tela olha uma unidade so e ninguem
-- ve o buraco do outro lado. O par e garantido por constraint trigger DIFERIDA:
-- as duas linhas entram na mesma transacao e a checagem roda no commit, quando
-- as duas ja existem.
--
-- Diferida e nao imediata porque a primeira linha inserida nunca teria par no
-- momento em que entra. A alternativa seria conferir na aplicacao, que e
-- exatamente o tipo de invariante que o banco existe para nao delegar: um
-- script de correcao ou um import futuro nao passam pela aplicacao.
--
-- -------------------------------------------------------------------------
-- POR QUE TRANSFERENCIA EXIGE SALDO, E CONSUMO NAO
-- -------------------------------------------------------------------------
-- A 0032 decidiu que consumo sem saldo AVISA em vez de bloquear: o
-- procedimento ja aconteceu, e travar o registro faz a clinica registrar
-- errado para conseguir trabalhar.
--
-- Transferencia e o contrario. Ela nao registra um fato passado, ela EXECUTA
-- uma decisao no momento em que e tomada — e nao da para pôr no carro o que
-- nao esta na prateleira. Transferir sem saldo criaria material do nada no
-- destino e um negativo na origem que ninguem sabe explicar. A checagem mora
-- no comando, junto com a mensagem que diz quanto ha de verdade.
-- =============================================================================

-- Movimentacao de transferencia sem grupo e meia transferencia — a metade que
-- fica orfa e a que some.
alter table stock_movement
  add constraint stock_movement_transfer_group check (
    kind not in ('transfer_in', 'transfer_out') or transfer_group_id is not null
  );

create index stock_movement_transfer_idx
  on stock_movement (tenant_id, transfer_group_id)
  where transfer_group_id is not null;

comment on column stock_movement.transfer_group_id is
  'Amarra a saida de uma unidade com a entrada na outra. As duas linhas do par compartilham este id.';

create or replace function assert_transfer_paired() returns trigger
language plpgsql
as $$
declare
  v_saidas   int;
  v_entradas int;
  v_produtos int;
  v_soma     numeric;
begin
  select count(*) filter (where kind = 'transfer_out'),
         count(*) filter (where kind = 'transfer_in'),
         count(distinct (product_id, lot_id)),
         sum(quantity)
    into v_saidas, v_entradas, v_produtos, v_soma
    from stock_movement
   where transfer_group_id = new.transfer_group_id;

  if v_saidas <> 1 or v_entradas <> 1 then
    raise exception 'Transferência precisa de exatamente uma saída e uma entrada (achei % e %).',
      v_saidas, v_entradas
      using errcode = 'P0001';
  end if;

  -- Mesmo produto e mesmo lote dos dois lados. Sem isto, uma transferencia
  -- poderia tirar resina de um lado e pôr toxina no outro — e o rastreio
  -- sanitario, que e a razao de o lote existir, quebraria no meio do caminho.
  if v_produtos <> 1 then
    raise exception 'Transferência tem de mover o mesmo produto e o mesmo lote nos dois lados.'
      using errcode = 'P0001';
  end if;

  -- O que saiu e o que entrou tem de se anular. Diferenca aqui e material
  -- criado ou destruido pela transferencia, que e o que ela nunca pode fazer.
  if v_soma <> 0 then
    raise exception 'Transferência não bate: saiu e entrou quantidade diferente (sobra de %).', v_soma
      using errcode = 'P0001';
  end if;

  return null;
end;
$$;

comment on function assert_transfer_paired() is
  'Confere no commit que a transferencia e um par completo. Diferida porque a primeira linha nunca tem par no instante em que entra.';

create constraint trigger stock_movement_transfer_paired
  after insert on stock_movement
  deferrable initially deferred
  for each row
  when (new.transfer_group_id is not null)
  execute function assert_transfer_paired();
