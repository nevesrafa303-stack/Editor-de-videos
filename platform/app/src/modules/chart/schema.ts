import { z } from "zod";

/**
 * Superficies dentarias, notacao FDI.
 * O=oclusal I=incisal M=mesial D=distal V=vestibular L=lingual P=palatina C=cervical
 */
export const SURFACES = ["O", "I", "M", "D", "V", "L", "P", "C"] as const;
export type Surface = (typeof SURFACES)[number];

export const TOOTH_CONDITIONS = [
  "healthy",
  "caries",
  "restoration",
  "missing",
  "implant",
  "prosthesis",
  "root_canal",
  "extraction_indicated",
  "fractured",
  "sealant",
  "crown",
  "bridge_pontic",
  "impacted",
  "mobility",
  "periapical_lesion",
] as const;
export type ToothCondition = (typeof TOOTH_CONDITIONS)[number];

export const ENTRY_STATUS = ["existing", "planned", "executed", "canceled"] as const;

/**
 * Condicoes que valem para o dente inteiro.
 *
 * A distincao decide o que um registro novo SUBSTITUI: "ausente" apaga
 * qualquer restauracao anterior daquele dente, enquanto "carie na oclusal"
 * convive com uma restauracao na mesial. Sem isso o odontograma vira uma pilha
 * de registros contraditorios que ninguem consegue ler.
 */
export const WHOLE_TOOTH: ReadonlySet<ToothCondition> = new Set([
  "healthy",
  "missing",
  "implant",
  "prosthesis",
  "root_canal",
  "extraction_indicated",
  "crown",
  "bridge_pontic",
  "impacted",
  "mobility",
  "periapical_lesion",
]);

export const recordToothSchema = z
  .object({
    patientId: z.uuid(),
    toothCode: z.string().regex(/^\d{2}$/, "Dente invalido."),
    condition: z.enum(TOOTH_CONDITIONS),
    surfaces: z.array(z.enum(SURFACES)).max(8).default([]),
    status: z.enum(ENTRY_STATUS).default("existing"),
    notes: z.string().trim().max(500).nullish(),
  })
  .transform((v) => ({
    ...v,
    notes: v.notes?.length ? v.notes : null,
    // Condicao de dente inteiro nao carrega superficie: guardar uma seria
    // gravar informacao que o proximo leitor interpretaria errado.
    surfaces: WHOLE_TOOTH.has(v.condition) ? [] : v.surfaces,
  }))
  .refine((v) => WHOLE_TOOTH.has(v.condition) || v.surfaces.length > 0, {
    message: "Escolha ao menos uma face.",
    path: ["surfaces"],
  });

export type RecordToothInput = z.input<typeof recordToothSchema>;

export const addNoteSchema = z.object({
  patientId: z.uuid(),
  appointmentId: z.uuid().nullish(),
  content: z.string().trim().min(10, "A evolucao precisa de ao menos 10 caracteres.").max(20_000),
});

export type AddNoteInput = z.input<typeof addNoteSchema>;

export const amendNoteSchema = z.object({
  noteId: z.uuid(),
  content: z.string().trim().min(10, "O aditamento precisa de ao menos 10 caracteres.").max(20_000),
  reason: z.string().trim().min(3, "Diga por que a evolucao esta sendo corrigida.").max(500),
});

export type AmendNoteInput = z.input<typeof amendNoteSchema>;

export const saveAnamnesisSchema = z.object({
  patientId: z.uuid(),
  templateId: z.uuid(),
  answers: z.record(z.string(), z.union([z.string(), z.boolean()])),
});

export type SaveAnamnesisInput = z.input<typeof saveAnamnesisSchema>;

/** Um campo do formulario, como o template guarda. */
export type FormField = {
  key: string;
  label: string;
  type: "boolean" | "text" | "textarea" | "select";
  required?: boolean;
  options?: string[];
  /** `equals`: alerta se a resposta for isso. `filled`: alerta se houver texto. */
  alert_if?: { equals?: boolean | string; filled?: boolean; text: string };
};
