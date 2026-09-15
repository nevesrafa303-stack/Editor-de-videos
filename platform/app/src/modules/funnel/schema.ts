import { z } from "zod";

export const OPPORTUNITY_STATUS = ["open", "won", "lost"] as const;
export type OpportunityStatus = (typeof OPPORTUNITY_STATUS)[number];

export const LEAD_STATUS = [
  "new",
  "working",
  "qualified",
  "converted",
  "disqualified",
] as const;
export type LeadStatus = (typeof LEAD_STATUS)[number];

export const ACTIVITY_KINDS = [
  "note",
  "call",
  "whatsapp",
  "email",
  "meeting",
  "visit",
] as const;
export type ActivityKind = (typeof ACTIVITY_KINDS)[number];

export const TASK_PRIORITIES = ["low", "normal", "high"] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

const telefone = z
  .string()
  .trim()
  .min(8, "Telefone é como se volta a falar com a pessoa.")
  .max(20);

/**
 * Lead e oportunidade nascem JUNTOS.
 *
 * Um sem o outro nao serve para nada: lead sem negocio e um contato solto que
 * ninguem volta a olhar, e negocio sem pessoa nao existe (o banco recusa). A
 * tela pede os dois de uma vez porque quem atende o telefone tem uma pessoa do
 * outro lado esperando, nao dois formularios.
 */
export const newLeadSchema = z
  .object({
    fullName: z.string().trim().min(2, "Informe o nome.").max(160),
    phone: telefone,
    email: z.union([z.literal(""), z.email("E-mail inválido.")]).nullish(),
    sourceId: z.uuid().nullish(),
    interest: z.string().trim().max(300).nullish(),
    /** Estimativa do negócio. Some quando existe orçamento. */
    amountCents: z.coerce.number().int().min(0).default(0),
    ownerId: z.uuid().nullish(),
  })
  .transform((v) => ({
    ...v,
    email: v.email?.length ? v.email : null,
    interest: v.interest?.length ? v.interest : null,
  }));

export type NewLeadInput = z.input<typeof newLeadSchema>;

export const moveStageSchema = z.object({
  opportunityId: z.uuid(),
  stageId: z.uuid(),
});

export type MoveStageInput = z.input<typeof moveStageSchema>;

export const loseSchema = z
  .object({
    opportunityId: z.uuid(),
    lossReasonId: z.uuid("Escolha o motivo da perda."),
    notes: z.string().trim().max(500).nullish(),
  })
  .transform((v) => ({ ...v, notes: v.notes?.length ? v.notes : null }));

export type LoseInput = z.input<typeof loseSchema>;

export const logActivitySchema = z.object({
  opportunityId: z.uuid(),
  kind: z.enum(ACTIVITY_KINDS).default("note"),
  body: z.string().trim().min(2, "Escreva o que aconteceu.").max(2000),
});

export type LogActivityInput = z.input<typeof logActivitySchema>;

export const newTaskSchema = z
  .object({
    opportunityId: z.uuid(),
    title: z.string().trim().min(2, "Diga o que precisa ser feito.").max(200),
    /** Data e hora locais, como o navegador manda: "2026-09-20T14:30". */
    dueAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "Data inválida."),
    priority: z.enum(TASK_PRIORITIES).default("normal"),
    assignedTo: z.uuid().nullish(),
  })
  .transform((v) => ({ ...v, assignedTo: v.assignedTo?.length ? v.assignedTo : null }));

export type NewTaskInput = z.input<typeof newTaskSchema>;
