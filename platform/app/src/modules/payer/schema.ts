import { z } from "zod";

export const BILLING_MODES = ["reimbursement", "invoiced"] as const;
export type BillingMode = (typeof BILLING_MODES)[number];

/**
 * Tipos que o formulario OFERECE.
 *
 * O enum do banco tem um quarto valor, `private`, que e o default da coluna
 * desde a 0009. Ele nao entra aqui de proposito: neste desenho "particular" e a
 * AUSENCIA de pagador (`quote.payer_id is null`), entao um `payer` de tipo
 * particular seria uma contradicao. A tela precisa saber ler esse valor mesmo
 * assim — ver `PAYER_KINDS_TODOS`.
 */
export const PAYER_KINDS = ["insurance", "agreement", "partnership"] as const;

/** Tudo que a coluna pode conter, para a tela nunca ficar sem rotulo. */
export const PAYER_KINDS_TODOS = ["private", ...PAYER_KINDS] as const;

export type PayerKind = (typeof PAYER_KINDS_TODOS)[number];
export type PayerKindEditavel = (typeof PAYER_KINDS)[number];

export const savePayerSchema = z
  .object({
    id: z.uuid().nullish(),
    code: z
      .string()
      .trim()
      .min(2, "O código identifica o convênio nos relatórios.")
      .max(40)
      .regex(/^[A-Z0-9_]+$/, "Use letras maiúsculas, números e _."),
    name: z.string().trim().min(2, "Informe o nome do convênio.").max(120),
    kind: z.enum(PAYER_KINDS).default("insurance"),
    billingMode: z.enum(BILLING_MODES).default("reimbursement"),
    settlementDays: z.coerce.number().int().min(0).max(365).default(0),
    adminFeePercent: z.coerce.number().min(0).max(100).default(0),
    notes: z.string().trim().max(1000).nullish(),
    isActive: z.boolean().default(true),
  })
  .transform((v) => ({ ...v, notes: v.notes?.length ? v.notes : null }));

export type SavePayerInput = z.input<typeof savePayerSchema>;

export const setPriceSchema = z.object({
  payerId: z.uuid(),
  procedureId: z.uuid(),
  priceCents: z.coerce.number().int().min(0),
  maxDiscountPercent: z.coerce.number().min(0).max(100).default(0),
  /**
   * Parte do paciente. O convênio paga `priceCents - patientShareCents`, e o
   * banco recusa uma co-participação maior que o próprio preço.
   */
  patientShareCents: z.coerce.number().int().min(0).default(0),
});

export type SetPriceInput = z.input<typeof setPriceSchema>;
