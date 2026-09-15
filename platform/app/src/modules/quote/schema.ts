import { z } from "zod";
import { SURFACES } from "@/modules/chart/schema";

export const QUOTE_STATUS = [
  "draft",
  "sent",
  "negotiating",
  "accepted",
  "rejected",
  "expired",
  "canceled",
] as const;

export type QuoteStatus = (typeof QUOTE_STATUS)[number];

/** Transicoes que ESTA tela opera. O banco continua sendo quem diz nao. */
export const QUOTE_ACTIONS = [
  "sent",
  "negotiating",
  "accepted",
  "rejected",
  "expired",
  "canceled",
] as const;

export type QuoteAction = (typeof QUOTE_ACTIONS)[number];

export const listQuotesSchema = z.object({
  status: z.enum(QUOTE_STATUS).optional(),
  patientId: z.uuid().optional(),
  search: z.string().trim().max(120).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  offset: z.coerce.number().int().min(0).default(0),
});

export type ListQuotesInput = z.input<typeof listQuotesSchema>;

export const createQuoteSchema = z
  .object({
    patientId: z.uuid("Escolha o paciente."),
    providerId: z.uuid().nullish(),
    payerId: z.uuid().nullish(),
    /** De qual negócio do funil esta proposta saiu. O aceite ganha o negócio. */
    opportunityId: z.uuid().nullish(),
    title: z.string().trim().max(160).nullish(),
    notes: z.string().trim().max(2000).nullish(),
    validDays: z.coerce.number().int().min(1).max(365).default(15),
    /** Itens do plano de tratamento a trazer para o orçamento. */
    planItemIds: z.array(z.uuid()).default([]),
  })
  .transform((v) => ({
    ...v,
    title: v.title?.length ? v.title : null,
    notes: v.notes?.length ? v.notes : null,
  }));

export type CreateQuoteInput = z.input<typeof createQuoteSchema>;

export const addItemSchema = z
  .object({
    quoteId: z.uuid(),
    procedureId: z.uuid().nullish(),
    description: z.string().trim().min(2, "Descreva o item.").max(300),
    // `""` e o que um campo em branco manda. Tratar como ausente aqui evita
    // que cada formulario precise lembrar de converter.
    toothCode: z
      .union([z.literal(""), z.string().regex(/^\d{2}$/, "Dente inválido.")])
      .nullish(),
    // Procedimento de escopo `surface` exige face — quem diz nao e o banco
    // (`check_quote_item_scope`), e a proposta precisa carregar a mesma
    // informacao que o plano de tratamento carrega, senao orcar pela tela e
    // orcar pelo plano geram linhas diferentes para o mesmo dente.
    surfaces: z.array(z.enum(SURFACES)).max(8).default([]),
    regionCode: z.string().trim().max(40).nullish(),
    quantity: z.coerce.number().min(0.001).max(9999).default(1),
    unitPriceCents: z.coerce.number().int().min(0),
    discountCents: z.coerce.number().int().min(0).default(0),
  })
  .transform((v) => ({
    ...v,
    toothCode: v.toothCode?.length ? v.toothCode : null,
    regionCode: v.regionCode?.length ? v.regionCode : null,
  }));

export type AddItemInput = z.input<typeof addItemSchema>;

export const setDiscountSchema = z.object({
  quoteId: z.uuid(),
  discountCents: z.coerce.number().int().min(0),
  /** Quando quem edita não tem alçada e um gestor autoriza na hora. */
  approve: z.boolean().default(false),
});

export type SetDiscountInput = z.input<typeof setDiscountSchema>;

export const setTermsSchema = z.object({
  quoteId: z.uuid(),
  installmentCount: z.coerce.number().int().min(1).max(48).default(1),
  downPaymentCents: z.coerce.number().int().min(0).default(0),
  validUntil: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida.")
    .nullish(),
});

export type SetTermsInput = z.input<typeof setTermsSchema>;

export const changeQuoteStatusSchema = z.object({
  quoteId: z.uuid(),
  to: z.enum(QUOTE_ACTIONS),
  lossReasonId: z.uuid().nullish(),
  lossNotes: z.string().trim().max(500).nullish(),
});

export type ChangeQuoteStatusInput = z.input<typeof changeQuoteStatusSchema>;

export const acceptQuoteSchema = z.object({
  quoteId: z.uuid(),
  /** Nome digitado por quem assina, como evidência do aceite. */
  signedBy: z.string().trim().min(3, "Informe quem está aceitando."),
});

export type AcceptQuoteInput = z.input<typeof acceptQuoteSchema>;
