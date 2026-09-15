/**
 * Consultas do importador.
 *
 * A importacao fica guardada como fato, entao existe historico: "quem trouxe o
 * que, quando, e o que entrou". Isso responde a pergunta que aparece meses
 * depois — "por que esta paciente esta com o telefone errado?" — que e
 * exatamente a pergunta que importacao em massa costuma deixar sem resposta.
 */
import { sql } from "kysely";
import type { TenantContext } from "@/server/context";
import { NotFound } from "@/shared/errors";
import type { ImportStatus, RowStatus } from "@/modules/import/schema";

export type ImportJobRow = {
  id: string;
  status: ImportStatus;
  filename: string | null;
  total: number;
  validas: number;
  duplicadas: number;
  comErro: number;
  importadas: number;
  createdBy: string | null;
  createdAt: Date;
  appliedAt: Date | null;
};

export async function listImports(ctx: TenantContext): Promise<ImportJobRow[]> {
  ctx.assert("import.read");

  const rows = await ctx.db
    .selectFrom("import_job as j")
    .leftJoin("membership as m", "m.id", "j.created_by")
    .leftJoin("app_user as u", "u.id", "m.user_id")
    .select([
      "j.id", "j.status", "j.filename", "j.total_rows", "j.valid_rows",
      "j.duplicate_rows", "j.error_rows", "j.imported_rows",
      "j.created_at", "j.applied_at", "u.full_name as created_by",
    ])
    .where("j.status", "<>", "canceled")
    .orderBy("j.created_at", "desc")
    .limit(30)
    .execute();

  return rows.map(mapear);
}

export type ImportRowDetail = {
  id: string;
  line: number;
  status: RowStatus;
  message: string | null;
  patientId: string | null;
  nome: string;
  telefone: string;
  raw: Record<string, string>;
};

export type ImportDetail = {
  job: ImportJobRow;
  rows: ImportRowDetail[];
};

export async function getImport(ctx: TenantContext, jobId: string): Promise<ImportDetail> {
  ctx.assert("import.read");

  const job = await ctx.db
    .selectFrom("import_job as j")
    .leftJoin("membership as m", "m.id", "j.created_by")
    .leftJoin("app_user as u", "u.id", "m.user_id")
    .select([
      "j.id", "j.status", "j.filename", "j.total_rows", "j.valid_rows",
      "j.duplicate_rows", "j.error_rows", "j.imported_rows",
      "j.created_at", "j.applied_at", "u.full_name as created_by",
    ])
    .where("j.id", "=", jobId)
    .executeTakeFirst();

  if (!job) throw new NotFound("Importação");

  const rows = await ctx.db
    .selectFrom("import_row")
    .select(["id", "line_number", "status", "message", "patient_id", "raw"])
    .where("job_id", "=", jobId)
    // Erro e duplicado primeiro: e o que a clinica precisa olhar para corrigir
    // a planilha e trazer o resto. O que entrou certo nao pede atencao.
    .orderBy(
      sql`case status when 'error' then 0 when 'duplicate' then 1 else 2 end`,
    )
    .orderBy("line_number", "asc")
    .execute();

  return {
    job: mapear(job),
    rows: rows.map((r) => {
      const raw = (r.raw ?? {}) as Record<string, string>;
      return {
        id: r.id as string,
        line: r.line_number,
        status: r.status as RowStatus,
        message: r.message,
        patientId: (r.patient_id as string) ?? null,
        nome: primeiro(raw, ["nome", "nome_completo", "paciente", "cliente"]),
        telefone: primeiro(raw, ["telefone", "celular", "fone", "whatsapp", "contato"]),
        raw,
      };
    }),
  };
}

function primeiro(raw: Record<string, string>, chaves: string[]): string {
  for (const k of chaves) if (raw[k]) return raw[k];
  return "—";
}

type Linha = {
  id: unknown;
  status: string;
  filename: string | null;
  total_rows: number;
  valid_rows: number;
  duplicate_rows: number;
  error_rows: number;
  imported_rows: number;
  created_at: Date;
  applied_at: Date | null;
  created_by: string | null;
};

function mapear(j: Linha): ImportJobRow {
  return {
    id: j.id as string,
    status: j.status as ImportStatus,
    filename: j.filename,
    total: j.total_rows,
    validas: j.valid_rows,
    duplicadas: j.duplicate_rows,
    comErro: j.error_rows,
    importadas: j.imported_rows,
    createdBy: j.created_by,
    createdAt: j.created_at,
    appliedAt: j.applied_at,
  };
}
