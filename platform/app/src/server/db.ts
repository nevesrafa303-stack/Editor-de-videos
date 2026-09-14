/**
 * Conexao com o banco.
 *
 * Dois cuidados que valem mais que o resto deste arquivo:
 *
 * - O usuario do banco NAO pode ser dono das tabelas nem superusuario. Ambos
 *   ignoram RLS, e um deploy com a string de conexao errada transformaria o
 *   isolamento em enfeite. Por isso `assertNotBypassingRls()` roda na primeira
 *   conexao e derruba o processo se detectar.
 * - Os parsers de tipo sao parte do contrato dos tipos gerados
 *   (scripts/gen-db-types.mjs). Mudar um sem o outro produz erro silencioso de
 *   dinheiro ou de data.
 */
import { Kysely, PostgresDialect, sql } from "kysely";
import pg from "pg";
import type { DB } from "@/server/db-types";

const { Pool, types } = pg;

// int8 -> number. Todo dinheiro do sistema e bigint de centavos; deixar como
// string espalharia conversao por toda a base.
types.setTypeParser(types.builtins.INT8, (value) => {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed)) {
    throw new Error(
      `Valor bigint fora da faixa segura de JavaScript: ${value}. ` +
        "Trate esta coluna como string explicitamente.",
    );
  }
  return parsed;
});

// date -> 'YYYY-MM-DD'. Sem isto, vencimento vira Date em meia-noite local e
// atravessa o dia ao virar UTC.
types.setTypeParser(types.builtins.DATE, (value) => value);

// numeric continua string: percentual de comissao e quantidade de insumo nao
// podem passar por float.

let pool: pg.Pool | undefined;
let database: Kysely<DB> | undefined;

export type DbConfig = {
  connectionString: string;
  maxConnections?: number;
  statementTimeoutMs?: number;
};

function readConfig(): DbConfig {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL nao definida. Copie .env.example para .env antes de subir a aplicacao.",
    );
  }
  return {
    connectionString,
    maxConnections: Number(process.env.DB_POOL_MAX ?? 10),
    statementTimeoutMs: Number(process.env.DB_STATEMENT_TIMEOUT_MS ?? 15_000),
  };
}

export function getPool(): pg.Pool {
  if (pool) return pool;
  const config = readConfig();

  pool = new Pool({
    connectionString: config.connectionString,
    max: config.maxConnections ?? 10,
    // Uma conexao entregue ao proximo request tem de vir limpa. `SET LOCAL` ja
    // morre com a transacao; o timeout evita que uma consulta travada segure a
    // conexao e, com ela, o contexto.
    statement_timeout: config.statementTimeoutMs ?? 15_000,
    idleTimeoutMillis: 30_000,
    application_name: "clinica-app",
  });

  pool.on("error", (error) => {
    console.error("[db] erro em conexao ociosa", error);
  });

  return pool;
}

export function getDb(): Kysely<DB> {
  if (database) return database;
  database = new Kysely<DB>({ dialect: new PostgresDialect({ pool: getPool() }) });
  return database;
}

/**
 * Confere que a aplicacao NAO esta conectada com um papel que ignora RLS.
 *
 * Superusuario e dono da tabela passam por cima de toda policy. Se a string de
 * conexao apontar para um deles, todo o isolamento entre clinicas some — e sem
 * nenhum sintoma visivel ate o dia do vazamento. Por isso a checagem e fatal.
 */
export async function assertNotBypassingRls(db: Kysely<DB> = getDb()): Promise<void> {
  const { rows } = await sql<{
    is_superuser: boolean;
    bypassrls: boolean;
    owns_tables: number;
    role_name: string;
  }>`
    select
      rolsuper as is_superuser,
      rolbypassrls as bypassrls,
      (select count(*) from pg_class c
         join pg_namespace n on n.oid = c.relnamespace
        where n.nspname = 'public' and c.relkind = 'r'
          and c.relowner = r.oid)::int as owns_tables,
      rolname as role_name
    from pg_roles r
    where rolname = current_user
  `.execute(db);

  const info = rows[0];
  if (!info) throw new Error("Nao foi possivel identificar o papel de banco em uso.");

  const problems: string[] = [];
  if (info.is_superuser) problems.push("e superusuario");
  if (info.bypassrls) problems.push("tem BYPASSRLS");
  if (info.owns_tables > 0) problems.push(`e dono de ${info.owns_tables} tabelas`);

  if (problems.length > 0) {
    throw new Error(
      `O papel de banco "${info.role_name}" ${problems.join(", ")} e por isso ignora RLS. ` +
        "Conecte com um papel sem privilegios que herde crm_app.",
    );
  }
}

export async function closeDb(): Promise<void> {
  await database?.destroy();
  database = undefined;
  pool = undefined;
}

export type { DB };
