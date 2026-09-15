import { z } from "zod";

export const IMPORT_STATUS = ["analyzing", "ready", "applied", "canceled"] as const;
export type ImportStatus = (typeof IMPORT_STATUS)[number];

export const ROW_STATUS = ["valid", "duplicate", "error", "imported"] as const;
export type RowStatus = (typeof ROW_STATUS)[number];

export const analyzeSchema = z.object({
  filename: z.string().trim().max(255).nullish(),
  csv: z.string().min(1, "Escolha um arquivo ou cole o conteúdo da planilha."),
});

export type AnalyzeInput = z.input<typeof analyzeSchema>;

/**
 * As colunas que o importador entende, e os nomes que aceita para cada uma.
 *
 * Aceitar varios nomes nao e frescura: quem troca de sistema exporta do que
 * tinha, e cada sistema chama a mesma coluna de um jeito. Exigir o nome exato
 * seria exigir que a clinica editasse a planilha antes — e quem esta migrando
 * ja tem problema demais.
 */
export const COLUNAS = {
  fullName: ["nome", "nome_completo", "paciente", "nome_do_paciente", "cliente"],
  phone: ["telefone", "celular", "fone", "whatsapp", "telefone_1", "contato"],
  taxId: ["cpf", "documento", "cpf_cnpj"],
  birthDate: ["nascimento", "data_de_nascimento", "data_nascimento", "dt_nascimento"],
  email: ["email", "e_mail"],
  balance: ["saldo", "saldo_em_aberto", "debito", "valor_em_aberto", "a_receber"],
  dueDate: ["vencimento", "data_de_vencimento", "data_vencimento"],
} as const;

export type ColunaConhecida = keyof typeof COLUNAS;
