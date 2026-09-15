import { z } from "zod";

export const CLAIM_STATUS = ["open", "batched", "submitted", "settled", "canceled"] as const;
export type ClaimStatus = (typeof CLAIM_STATUS)[number];

export const BATCH_STATUS = ["open", "submitted", "settled", "canceled"] as const;
export type BatchStatus = (typeof BATCH_STATUS)[number];

export const DENIAL_STATUS = [
  "open",
  "appealed",
  "recovered",
  "written_off",
  "expired",
] as const;
export type DenialStatus = (typeof DENIAL_STATUS)[number];

/** Desfechos que ESTA tela opera. O banco continua sendo quem diz nao. */
export const DENIAL_ACTIONS = ["appealed", "recovered", "written_off"] as const;
export type DenialAction = (typeof DENIAL_ACTIONS)[number];

const dataISO = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida.");

export const addToBatchSchema = z.object({
  claimIds: z.array(z.uuid()).min(1, "Escolha ao menos uma guia."),
  /** Mês de competência. Ausente = o mês de hoje. */
  competence: dataISO.nullish(),
});

export type AddToBatchInput = z.input<typeof addToBatchSchema>;

export const settleItemSchema = z
  .object({
    itemId: z.uuid(),
    paidCents: z.coerce.number().int().min(0),
    reasonCode: z.string().trim().max(40).nullish(),
    reason: z.string().trim().max(500).nullish(),
  })
  .transform((v) => ({
    ...v,
    reasonCode: v.reasonCode?.length ? v.reasonCode : null,
    reason: v.reason?.length ? v.reason : null,
  }));

export type SettleItemInput = z.input<typeof settleItemSchema>;

export const resolveDenialSchema = z
  .object({
    denialId: z.uuid(),
    status: z.enum(DENIAL_ACTIONS),
    recoveredCents: z.coerce.number().int().min(0).default(0),
    notes: z.string().trim().max(1000).nullish(),
  })
  .transform((v) => ({ ...v, notes: v.notes?.length ? v.notes : null }))
  .refine((v) => v.status !== "recovered" || v.recoveredCents > 0, {
    message: "Informe quanto o convênio pagou.",
    path: ["recoveredCents"],
  });

export type ResolveDenialInput = z.input<typeof resolveDenialSchema>;

export const authorizationSchema = z
  .object({
    claimId: z.uuid(),
    code: z.string().trim().max(60).nullish(),
    validUntil: z.union([z.literal(""), dataISO]).nullish(),
  })
  .transform((v) => ({
    ...v,
    code: v.code?.length ? v.code : null,
    validUntil: v.validUntil?.length ? v.validUntil : null,
  }));

export type AuthorizationInput = z.input<typeof authorizationSchema>;
