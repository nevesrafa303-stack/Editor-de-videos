import { z } from 'zod';

import { serviceSlugs } from '@/lib/config/services';
import { digitsOnly, toE164BR } from '@/lib/utils/format';

/**
 * Schemas compartilhados entre navegador e servidor.
 *
 * O frontend usa isto para dar feedback imediato; o backend usa EXATAMENTE o
 * mesmo schema antes de gravar qualquer coisa. A validacao do cliente e'
 * conveniencia — a do servidor e' a que vale, e nenhuma request escapa dela.
 */

/** Remove caracteres de controle e normaliza espacos. */
const sanitize = (value: string): string =>
  value
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const shortText = (min: number, max: number, message: string) =>
  z
    .string()
    .transform(sanitize)
    .pipe(z.string().min(min, message).max(max, `Máximo de ${max} caracteres.`));

export const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida.')
  .refine((value) => !Number.isNaN(Date.parse(`${value}T12:00:00Z`)), 'Data inválida.');

export const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Horário inválido.');

export const serviceSlugSchema = z.enum(serviceSlugs as [string, ...string[]], {
  message: 'Selecione um serviço válido.',
});

const currentYear = new Date().getFullYear();

export const bookingRequestSchema = z.object({
  name: shortText(3, 90, 'Informe seu nome completo.'),

  phone: z
    .string()
    .transform((value) => toE164BR(value))
    .refine((value): value is string => value !== null, 'Informe um WhatsApp válido com DDD.'),

  email: z
    .string()
    .transform((value) => value.trim().toLowerCase())
    .pipe(z.email('Informe um e-mail válido.').max(120)),

  vehicleBrand: shortText(2, 40, 'Informe a marca do veículo.'),
  vehicleModel: shortText(1, 60, 'Informe o modelo do veículo.'),

  vehicleYear: z
    .union([z.string(), z.number(), z.null()])
    .optional()
    .transform((value) => {
      if (value === null || value === undefined || value === '') return null;
      const parsed = Number(digitsOnly(String(value)));
      return Number.isFinite(parsed) ? parsed : null;
    })
    .refine(
      (value) => value === null || (value >= 1900 && value <= currentYear + 1),
      `Informe um ano entre 1900 e ${currentYear + 1}.`,
    ),

  serviceSlug: serviceSlugSchema,
  date: isoDateSchema,
  time: timeSchema,

  notes: z
    .union([z.string(), z.null()])
    .optional()
    .transform((value) => {
      if (value === null || value === undefined) return null;
      const clean = sanitize(value);
      return clean.length > 0 ? clean.slice(0, 600) : null;
    }),

  consent: z.literal(true, { message: 'É necessário autorizar o contato sobre o agendamento.' }),

  /** Token do Turnstile. Opcional aqui; obrigatorio quando a chave existe. */
  turnstileToken: z.string().max(4000).nullable().optional(),

  /**
   * Honeypot: campo invisivel para humanos. Bot preenche tudo que encontra.
   * Qualquer conteudo aqui derruba a request.
   */
  website: z
    .string()
    .max(0, 'Requisição inválida.')
    .optional()
    .or(z.literal('')),
});

export type BookingRequest = z.infer<typeof bookingRequestSchema>;

export const availabilityQuerySchema = z.object({
  date: isoDateSchema,
  service: serviceSlugSchema,
});

export type AvailabilityQuery = z.infer<typeof availabilityQuerySchema>;

/** Erros de campo no formato consumido pelo formulario. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const result: Record<string, string> = {};

  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === 'string' && !(key in result)) {
      result[key] = issue.message;
    }
  }

  return result;
}
