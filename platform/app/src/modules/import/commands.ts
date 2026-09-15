/**
 * Escritas do importador.
 *
 * Dois passos, sempre: ANALISAR guarda o que a planilha traz e o que o sistema
 * achou de cada linha; APLICAR cria os cadastros. Importacao nao tem desfazer,
 * e quem traz 2.000 pacientes precisa ver quantos vao entrar antes de
 * confirmar.
 */
import { sql } from "kysely";
import type { TenantContext } from "@/server/context";
import { NotFound, ValidationError } from "@/shared/errors";
import { toValidationError } from "@/shared/zod";
import { lerPlanilha, type LinhaLida } from "@/modules/import/parse";
import { analyzeSchema, type AnalyzeInput } from "@/modules/import/schema";

export type Analise = {
  jobId: string;
  total: number;
  validas: number;
  duplicadas: number;
  comErro: number;
  ignoradas: string[];
  reconhecidas: string[];
};

/**
 * Le a planilha, confere cada linha contra o que ja existe, e guarda o
 * resultado. Nao cria paciente nenhum.
 */
export async function analyzeImport(
  ctx: TenantContext,
  input: AnalyzeInput,
): Promise<Analise> {
  ctx.assert("import.write");

  const parsed = analyzeSchema.safeParse(input);
  if (!parsed.success) throw toValidationError(parsed.error, "Confira o arquivo.");
  const data = parsed.data;

  const leitura = lerPlanilha(data.csv);

  if (leitura.fatal) {
    throw new ValidationError({ csv: [leitura.fatal] }, leitura.fatal);
  }

  if (leitura.linhas.length === 0) {
    throw new ValidationError(
      { csv: ["A planilha tem cabeçalho, mas nenhuma linha."] },
      "A planilha tem cabeçalho, mas nenhuma linha.",
    );
  }

  const job = await ctx.db
    .insertInto("import_job")
    .values({
      tenant_id: ctx.session.tenantId,
      unit_id: ctx.unitId(),
      kind: "patient",
      filename: data.filename ?? null,
      created_by: ctx.session.membershipId,
    })
    .returning("id")
    .executeTakeFirstOrThrow();

  const jobId = job.id as string;
  const classificadas = await classificar(ctx, leitura.linhas);

  for (const { linha, status, message } of classificadas) {
    await ctx.db
      .insertInto("import_row")
      .values({
        tenant_id: ctx.session.tenantId,
        job_id: jobId,
        line_number: linha.line,
        raw: JSON.stringify(linha.raw),
        status,
        message,
      })
      .execute();
  }

  const conta = (s: string) => classificadas.filter((c) => c.status === s).length;

  const totais = {
    total_rows: classificadas.length,
    valid_rows: conta("valid"),
    duplicate_rows: conta("duplicate"),
    error_rows: conta("error"),
  };

  await ctx.db
    .updateTable("import_job")
    .set({ ...totais, status: "ready" })
    .where("id", "=", jobId)
    .execute();

  return {
    jobId,
    total: totais.total_rows,
    validas: totais.valid_rows,
    duplicadas: totais.duplicate_rows,
    comErro: totais.error_rows,
    ignoradas: leitura.ignoradas,
    reconhecidas: leitura.reconhecidas,
  };
}

type Classificada = {
  linha: LinhaLida;
  status: "valid" | "duplicate" | "error";
  message: string | null;
};

/**
 * Decide o destino de cada linha.
 *
 * Duplicado e checado contra o banco E contra as linhas anteriores DA PROPRIA
 * PLANILHA: arquivo exportado de sistema velho costuma ter a mesma pessoa duas
 * vezes, e importar as duas cria exatamente o problema que o importador
 * deveria evitar.
 */
async function classificar(
  ctx: TenantContext,
  linhas: LinhaLida[],
): Promise<Classificada[]> {
  const cpfs = linhas.map((l) => l.taxId).filter((v): v is string => v !== null);
  const fones = linhas.map((l) => l.phone).filter(Boolean);

  const existentes = await ctx.db
    .selectFrom("patient")
    .select(["id", "full_name", "phone", "tax_id"])
    .where("deleted_at", "is", null)
    .where((eb) =>
      eb.or([
        ...(cpfs.length > 0 ? [eb("tax_id", "in", cpfs)] : []),
        ...(fones.length > 0 ? [eb("phone", "in", fones)] : []),
      ]),
    )
    .execute();

  const porCpf = new Map(
    existentes.filter((p) => p.tax_id).map((p) => [p.tax_id as string, p.full_name]),
  );
  const porFone = new Map(existentes.map((p) => [p.phone, p.full_name]));

  const vistosCpf = new Set<string>();
  const vistosFone = new Set<string>();

  return linhas.map((linha) => {
    if (linha.erros.length > 0) {
      return { linha, status: "error" as const, message: linha.erros.join(" · ") };
    }

    const jaNoBanco =
      (linha.taxId && porCpf.get(linha.taxId)) || porFone.get(linha.phone) || null;

    if (jaNoBanco) {
      return {
        linha,
        status: "duplicate" as const,
        message: `Já cadastrado: ${jaNoBanco}`,
      };
    }

    if (
      (linha.taxId && vistosCpf.has(linha.taxId)) ||
      vistosFone.has(linha.phone)
    ) {
      return {
        linha,
        status: "duplicate" as const,
        message: "Repetido na própria planilha",
      };
    }

    if (linha.taxId) vistosCpf.add(linha.taxId);
    vistosFone.add(linha.phone);

    return {
      linha,
      status: "valid" as const,
      message: linha.avisos.length > 0 ? linha.avisos.join(" · ") : null,
    };
  });
}

/**
 * Cria os cadastros das linhas validas.
 *
 * Duplicada e com erro ficam como estao, com o motivo guardado: o relatorio
 * depois da importacao e o que permite a clinica corrigir a planilha e trazer
 * o resto.
 */
export async function applyImport(
  ctx: TenantContext,
  jobId: string,
): Promise<{ importados: number }> {
  ctx.assert("import.write");

  const job = await ctx.db
    .selectFrom("import_job")
    .select(["id", "status", "unit_id"])
    .where("id", "=", jobId)
    .executeTakeFirst();

  if (!job) throw new NotFound("Importação");

  if (job.status !== "ready") {
    throw new ValidationError(
      { _: ["Esta importação já foi aplicada ou descartada."] },
      "Esta importação já foi aplicada ou descartada. Analise a planilha de novo.",
    );
  }

  const linhas = await ctx.db
    .selectFrom("import_row")
    .select(["id", "raw", "line_number"])
    .where("job_id", "=", jobId)
    .where("status", "=", "valid")
    .orderBy("line_number", "asc")
    .execute();

  let importados = 0;

  for (const linha of linhas) {
    // A linha crua e relida pelo MESMO parser da analise: guardar o resultado
    // ja interpretado economizaria isso, mas faria a analise e a aplicacao
    // poderem divergir quando a leitura mudasse.
    const dados = relerLinha(linha.raw as Record<string, string>);
    if (!dados) continue;

    const paciente = await ctx.db
      .insertInto("patient")
      .values({
        tenant_id: ctx.session.tenantId,
        origin_unit_id: job.unit_id,
        full_name: dados.fullName,
        phone: dados.phone,
        email: dados.email,
        tax_id: dados.taxId,
        birth_date: dados.birthDate,
        status: "active",
        notes: "Importado de planilha.",
      })
      .returning("id")
      .executeTakeFirstOrThrow();

    const patientId = paciente.id as string;

    if (dados.balanceCents > 0) {
      await criarSaldo(ctx, {
        patientId,
        unitId: job.unit_id as string,
        amountCents: dados.balanceCents,
        dueDate: dados.dueDate,
      });
    }

    await ctx.db
      .updateTable("import_row")
      .set({ status: "imported", patient_id: patientId })
      .where("id", "=", linha.id)
      .execute();

    importados += 1;
  }

  await ctx.db
    .updateTable("import_job")
    .set({ status: "applied", applied_at: new Date(), imported_rows: importados })
    .where("id", "=", jobId)
    .execute();

  return { importados };
}

/**
 * O saldo que veio da planilha vira uma divida de origem `manual`.
 *
 * NAO e um orcamento: nao existe documento por tras, nem itens, nem aceite. A
 * descricao diz de onde veio, porque daqui a um ano alguem vai perguntar por
 * que esta paciente deve R$ 800 sem nenhum procedimento no prontuario.
 */
async function criarSaldo(
  ctx: TenantContext,
  dados: {
    patientId: string;
    unitId: string;
    amountCents: number;
    dueDate: string | null;
  },
): Promise<void> {
  const recebivel = await ctx.db
    .insertInto("receivable")
    .values({
      tenant_id: ctx.session.tenantId,
      unit_id: dados.unitId,
      patient_id: dados.patientId,
      origin: "manual",
      total_cents: dados.amountCents,
      description: "Saldo trazido do sistema anterior",
      created_by: ctx.session.membershipId,
    })
    .returning("id")
    .executeTakeFirstOrThrow();

  await sql`
    insert into installment (tenant_id, unit_id, receivable_id, patient_id,
                             number, total_count, due_on, amount_cents)
    values (
      ${ctx.session.tenantId}::uuid,
      ${dados.unitId}::uuid,
      ${recebivel.id}::uuid,
      ${dados.patientId}::uuid,
      1, 1,
      -- Sem vencimento na planilha, vence HOJE: o saldo veio do sistema
      -- anterior e ja e devido. Inventar uma data futura esconderia a divida
      -- do relatorio de vencidas, que e onde a clinica vai procurar.
      coalesce(${dados.dueDate}::date, current_date),
      ${dados.amountCents}::bigint
    )
  `.execute(ctx.db);
}

/** Relê a linha crua com o mesmo parser da análise. */
function relerLinha(raw: Record<string, string>): LinhaLida | null {
  const chaves = Object.keys(raw);
  if (chaves.length === 0) return null;

  const escapar = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const csv = [
    chaves.join(","),
    chaves.map((k) => escapar(raw[k] ?? "")).join(","),
  ].join("\n");

  const leitura = lerPlanilha(csv);
  return leitura.linhas[0] ?? null;
}

export async function cancelImport(ctx: TenantContext, jobId: string): Promise<void> {
  ctx.assert("import.write");

  const row = await ctx.db
    .updateTable("import_job")
    .set({ status: "canceled" })
    .where("id", "=", jobId)
    .where("status", "in", ["analyzing", "ready"])
    .returning("id")
    .executeTakeFirst();

  if (!row) throw new NotFound("Importação em aberto");
}
