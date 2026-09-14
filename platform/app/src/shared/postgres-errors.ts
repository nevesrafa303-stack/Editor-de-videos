/**
 * Traducao de erro do PostgreSQL para erro de dominio.
 *
 * As invariantes moram no banco (ver ADR-003), entao a aplicacao precisa saber
 * ler a recusa. Sem isto, a recepcao ve "violates exclusion constraint
 * appointment_provider_overlap" — que e verdade, e nao ajuda ninguem.
 */
import {
  BusinessRuleError,
  Conflict,
  TenantViolation,
  type AppError,
} from "@/shared/errors";

type PgError = {
  code?: string;
  message?: string;
  constraint?: string;
  detail?: string;
  hint?: string;
  table?: string;
};

/** Mensagem de produto para cada constraint que o usuario pode encostar. */
const BY_CONSTRAINT: Record<string, string> = {
  appointment_provider_overlap:
    "Este profissional ja tem atendimento marcado nesse horario.",
  resource_booking_overlap:
    "A sala ou cadeira escolhida ja esta ocupada nesse horario.",
  appointment_cancel_reason: "Informe o motivo do cancelamento.",
  quote_accepted_signature:
    "O aceite do orcamento exige a assinatura do paciente.",
  quote_discount_bound: "O desconto nao pode ser maior que o valor do orcamento.",
  quote_down_payment: "A entrada nao pode ser maior que o total do orcamento.",
  installment_paid_bound: "O valor recebido excede o saldo da parcela.",
  payment_reversed_reason: "Informe o motivo do estorno.",
  patient_tax_id_uk: "Ja existe um paciente com este CPF nesta clinica.",
  procedure_code_uk: "Ja existe um procedimento com este codigo.",
  price_list_no_overlap:
    "Ja existe uma tabela de precos vigente para este publico no periodo.",
  product_lot_uk: "Este lote ja foi cadastrado para o produto.",
  stock_movement_reason: "Perda e ajuste de estoque exigem motivo.",
  membership_provider_council:
    "Profissional que atende precisa de registro no conselho.",
  outbox_message_idempotency_uk: "Este envio ja foi registrado.",
  gateway_charge_idempotency_uk: "Esta cobranca ja foi emitida.",
  automation_run_uk: "Esta automacao ja foi disparada para este alvo.",
};

/**
 * Mensagens levantadas por trigger chegam como texto. Casamos por trecho
 * estavel da mensagem, nao pela frase inteira.
 */
const BY_MESSAGE: [RegExp, string][] = [
  [/Transicao invalida em (\w+): (\w+) -> (\w+)/, "Esta mudanca de status nao e permitida a partir do estado atual."],
  [/exige lote rastreado/, "Aplicacao de injetavel exige lote rastreado."],
  [/venceu em/, "Este lote esta vencido e nao pode ser aplicado."],
  [/bloqueado/, "Este lote esta bloqueado e nao pode ser usado."],
  [/consentimento de uso de imagem/, "O paciente nao autorizou o uso de imagem."],
  [/nao pode ser apagada|nao pode ser apagado/, "Este registro nao pode ser apagado, apenas corrigido."],
  [/nao pode ser reescrita/, "Evolucao fechada nao pode ser reescrita. Registre um aditamento."],
  [/imutavel/, "Este lancamento e imutavel. Estorne e lance novamente."],
  [/excede o teto/, "O desconto excede o teto permitido e precisa de aprovacao de gestor."],
  [/sem itens/, "Adicione ao menos um item antes de enviar o orcamento."],
  [/ja fechado/, "O caixa ja foi fechado e nao aceita novos lancamentos."],
  [/profissional ativo e habilitado/, "Registro clinico exige profissional ativo com registro no conselho."],
  [/exige dente/, "Este procedimento exige informar o dente."],
  [/exige regiao/, "Este procedimento exige informar a regiao."],
  [/exige ao menos uma face/, "Este procedimento exige informar ao menos uma face."],
];

export function translatePgError(error: unknown): AppError | null {
  if (!error || typeof error !== "object") return null;
  const pg = error as PgError;
  if (!pg.code) return null;

  const constraint = pg.constraint ?? "";
  const message = pg.message ?? "";

  // Violacao de RLS: o banco recusou uma escrita fora do tenant da sessao.
  // Nunca deveria acontecer; quando acontece, e bug nosso, nao do usuario.
  if (pg.code === "42501" || /row-level security/i.test(message)) {
    return new TenantViolation();
  }

  const friendly = BY_CONSTRAINT[constraint];
  if (friendly) {
    return pg.code === "23505" ? new Conflict(friendly) : new BusinessRuleError(friendly, error);
  }

  for (const [pattern, text] of BY_MESSAGE) {
    if (pattern.test(message)) return new BusinessRuleError(text, error);
  }

  switch (pg.code) {
    case "23505":
      return new Conflict("Ja existe um registro com estes dados.");
    case "23503":
      return new BusinessRuleError(
        "Este registro depende de outro que nao existe ou nao pode ser removido.",
        error,
      );
    case "23514":
    case "23P01":
      return new BusinessRuleError("A operacao viola uma regra do sistema.", error);
    case "23502":
      return new BusinessRuleError("Um campo obrigatorio nao foi preenchido.", error);
    default:
      return null;
  }
}
