import { z } from "zod";
import { isValidCPF, isValidPhone, onlyDigits } from "@/shared/br";

const optionalText = z
  .string()
  .trim()
  .transform((value) => (value === "" ? null : value))
  .nullable();

export const createPatientSchema = z.object({
  fullName: z.string().trim().min(3, "Informe o nome completo."),
  phone: z
    .string()
    .trim()
    .transform(onlyDigits)
    .refine(isValidPhone, "Telefone deve ter DDD e numero."),
  email: optionalText.refine(
    (value) => value === null || z.email().safeParse(value).success,
    "E-mail invalido.",
  ),
  taxId: optionalText
    .transform((value) => (value ? onlyDigits(value) : null))
    .refine((value) => value === null || isValidCPF(value), "CPF invalido."),
  birthDate: optionalText.refine(
    (value) => value === null || /^\d{4}-\d{2}-\d{2}$/.test(value),
    "Data de nascimento invalida.",
  ),
  gender: z.enum(["feminino", "masculino", "outro", "nao_informado"]).nullish(),
  sourceId: z.uuid().nullish(),
  notes: optionalText,
});

export type CreatePatientInput = z.infer<typeof createPatientSchema>;

export const listPatientsSchema = z.object({
  search: z.string().trim().default(""),
  includeInactive: z.boolean().default(false),
  limit: z.number().int().min(1).max(100).default(25),
  offset: z.number().int().min(0).default(0),
});

export type ListPatientsInput = z.input<typeof listPatientsSchema>;
