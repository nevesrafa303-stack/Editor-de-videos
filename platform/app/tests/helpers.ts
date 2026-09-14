import { Kysely, PostgresDialect } from "kysely";
import pg from "pg";
import { login, type LoginResult } from "@/server/auth";
import { resolveSession } from "@/server/session";
import type { TenantSession } from "@/server/context";
import type { DB } from "@/server/db-types";

export const SEED = {
  redeSorriso: "11111111-1111-7111-8111-111111111111",
  bellaVita: "22222222-2222-7222-8222-222222222222",
  unidadeCentro: "a1111111-1111-7111-8111-111111111111",
  unidadeZonaSul: "a2222222-2222-7222-8222-222222222222",
  unidadeBella: "b1111111-1111-7111-8111-111111111111",
  pacienteMariana: "0a111111-1111-7111-8111-111111111111",
  pacienteRoberto: "0a222222-2222-7222-8222-222222222222",
  pacienteBella: "0a333333-3333-7333-8333-333333333333",
  drAna: "d1111111-1111-7111-8111-111111111111",
  drBruno: "d2222222-2222-7222-8222-222222222222",
  procedimentoResina: "03111111-1111-7111-8111-111111111111",
} as const;

export const SENHA = "senha-de-teste-123";

export const USUARIOS = {
  dona: "ana@sorriso.com.br",
  profissional: "carla@sorriso.com.br",
  recepcao: "recepcao@sorriso.com.br",
  financeiro: "financeiro@sorriso.com.br",
  outraRede: "helena@bellavita.com.br",
} as const;

/** Faz login e devolve a sessao ja resolvida, como a borda faria. */
export async function entrar(email: string): Promise<{ session: TenantSession; token: string }> {
  const result: LoginResult = await login({ email, password: SENHA, ip: "203.0.113.7" });

  if (result.kind !== "authenticated") {
    throw new Error(`Esperava sessao unica para ${email}, veio escolha de rede.`);
  }

  const session = await resolveSession(result.session.token);
  if (!session) throw new Error("Sessao nao resolveu logo apos o login.");

  return { session, token: result.session.token };
}

/**
 * Horario futuro unico por execucao.
 *
 * A agenda tem exclusion constraint de verdade, e o banco de teste nao e
 * recriado entre execucoes do vitest. Sem deslocar a janela, a segunda rodada
 * esbarraria no agendamento que a primeira deixou — e o teste falharia por
 * sujeira, nao por regressao.
 */
const DESLOCAMENTO_MIN = Math.floor(Date.now() / 1000) % 400_000;

export function horarioLivre(slot = 0): { inicio: Date; fim: Date } {
  const base = new Date();
  base.setDate(base.getDate() + 30);
  base.setHours(8, 0, 0, 0);

  const inicio = new Date(base.getTime() + (DESLOCAMENTO_MIN + slot * 90) * 60_000);
  return { inicio, fim: new Date(inicio.getTime() + 3_600_000) };
}

/** Conexao administrativa, para preparar cenario e conferir por fora do RLS. */
export function adminDb(): Kysely<DB> {
  return new Kysely<DB>({
    dialect: new PostgresDialect({
      pool: new pg.Pool({
        connectionString:
          process.env.ADMIN_DATABASE_URL ??
          "postgresql://crm:crm@127.0.0.1:5432/crm_v2_test",
        max: 2,
      }),
    }),
  });
}
