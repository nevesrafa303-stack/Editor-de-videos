import { z } from "zod";

export const INSTALLMENT_STATUS = [
  "open",
  "partially_paid",
  "paid",
  "canceled",
  "renegotiated",
] as const;

export type InstallmentStatus = (typeof INSTALLMENT_STATUS)[number];

/** Recortes que a tela de financeiro oferece. */
export const RECORTES = ["vencidas", "hoje", "semana", "abertas", "pagas"] as const;
export type Recorte = (typeof RECORTES)[number];

export const listInstallmentsSchema = z.object({
  recorte: z.enum(RECORTES).default("abertas"),
  patientId: z.uuid().optional(),
  search: z.string().trim().max(120).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export type ListInstallmentsInput = z.input<typeof listInstallmentsSchema>;

export const receivePaymentSchema = z.object({
  installmentId: z.uuid(),
  paymentMethodId: z.uuid("Escolha a forma de pagamento."),
  amountCents: z.coerce.number().int().min(1, "Informe o valor recebido."),
  /** Perdoar multa e juros. Fica registrado com o nome de quem perdoou. */
  waiveCharges: z.boolean().default(false),
  notes: z.string().trim().max(300).nullish(),
});

export type ReceivePaymentInput = z.input<typeof receivePaymentSchema>;

export const reversePaymentSchema = z.object({
  paymentId: z.uuid(),
  reason: z.string().trim().min(3, "Diga por que o pagamento está sendo estornado.").max(300),
});

export type ReversePaymentInput = z.input<typeof reversePaymentSchema>;

export const openCashSchema = z.object({
  openingCents: z.coerce.number().int().min(0).default(0),
  notes: z.string().trim().max(300).nullish(),
});

export type OpenCashInput = z.input<typeof openCashSchema>;

export const closeCashSchema = z.object({
  sessionId: z.uuid(),
  countedCents: z.coerce.number().int().min(0),
  notes: z.string().trim().max(300).nullish(),
});

export type CloseCashInput = z.input<typeof closeCashSchema>;

export const CASH_MOVEMENT_KINDS = ["withdrawal", "supply", "adjustment"] as const;
export type CashMovementKind = (typeof CASH_MOVEMENT_KINDS)[number];

export const cashMovementSchema = z.object({
  sessionId: z.uuid(),
  kind: z.enum(CASH_MOVEMENT_KINDS),
  amountCents: z.coerce.number().int().min(1, "Informe o valor."),
  description: z.string().trim().min(3, "Diga do que se trata.").max(300),
});

export type CashMovementInput = z.input<typeof cashMovementSchema>;
