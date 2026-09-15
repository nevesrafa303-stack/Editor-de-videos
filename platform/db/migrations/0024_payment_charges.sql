-- =============================================================================
-- 0024 — Multa e juros dentro do pagamento
--
-- A parcela nao aceita receber mais do que vale: `installment_paid_bound`
-- garante `paid_cents <= amount_cents`, e esta certo — uma parcela de R$ 870
-- nao pode ter R$ 890 de principal pago.
--
-- So que o paciente atrasado paga R$ 890: R$ 870 de parcela e R$ 20 de mora.
-- Sem lugar para os R$ 20, o recebimento era recusado com "o valor excede o
-- saldo da parcela" — e a recepcao ficava sem saber o que fazer com o dinheiro
-- que o paciente acabou de entregar.
--
-- O pagamento passa a separar principal de encargo. A parcela continua vendo
-- so o principal; o caixa e a conta veem o total. Alem de destravar o
-- recebimento, isso e o que permite responder depois "quanto entrou de mora
-- no mes?" — que e receita de natureza diferente da do procedimento.
-- =============================================================================

alter table payment
  add column fine_cents bigint not null default 0 check (fine_cents >= 0),
  add column interest_cents bigint not null default 0 check (interest_cents >= 0);

comment on column payment.amount_cents is
  'Principal: abate a parcela. Nunca inclui multa nem juros.';
comment on column payment.fine_cents is
  'Multa de mora recebida junto. Nao abate a parcela.';
comment on column payment.interest_cents is
  'Juros de mora recebidos junto. Nao abatem a parcela.';

-- `net_cents` era `amount_cents - fee_cents`. Com encargos, o liquido que cai
-- na conta da clinica e o total recebido menos a taxa do meio de pagamento.
alter table payment drop column net_cents;

alter table payment
  add column gross_cents bigint
    generated always as (amount_cents + fine_cents + interest_cents) stored,
  add column net_cents bigint
    generated always as (amount_cents + fine_cents + interest_cents - fee_cents) stored;

comment on column payment.gross_cents is
  'O que o paciente entregou: principal + multa + juros.';
comment on column payment.net_cents is
  'O que sobra para a clinica depois da taxa do meio de pagamento.';

-- ---------------------------------------------- comissao sobre o principal --
-- A trigger de comissao usava `amount_cents`, que agora e so o principal —
-- entao ela ja faz a coisa certa por construcao. Vale deixar explicito por
-- que: multa e juros sao da CLINICA, que financiou o atraso. Comissionar
-- sobre mora pagaria o profissional pelo paciente ter atrasado.
comment on function build_commission_from_payment() is
  'Comissao nasce do recebimento e morre com o estorno. Base e o principal: mora e da clinica.';
