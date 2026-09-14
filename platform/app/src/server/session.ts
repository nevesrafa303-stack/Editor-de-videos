/**
 * Sessao.
 *
 * O cookie carrega um token OPACO e aleatorio; o banco guarda o SHA-256 dele.
 * Nao usamos JWT de proposito: um JWT valido continua valendo ate expirar, e
 * clinica precisa de revogacao imediata — demissao, celular perdido, suspeita
 * de acesso indevido. Com sessao no banco, revogar e um UPDATE.
 *
 * O custo e uma consulta por requisicao. Como ela ja traz vinculo, papel,
 * unidades e permissoes de uma vez (`auth_resolve_session`), e uma ida so.
 */
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { sql } from "kysely";
import { withUser, withoutContext, type TenantSession } from "@/server/context";
import { isPermission, type Permission } from "@/shared/permissions";

const SESSION_HOURS = Number(process.env.SESSION_HOURS ?? 12);

export function generateSessionToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Comparacao em tempo constante, para o proprio hash nao virar oraculo. */
export function tokensMatch(a: string, b: string): boolean {
  const bufferA = Buffer.from(a);
  const bufferB = Buffer.from(b);
  return bufferA.length === bufferB.length && timingSafeEqual(bufferA, bufferB);
}

export type CreateSessionInput = {
  userId: string;
  tenantId: string;
  activeUnitId?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  mfaSatisfied?: boolean;
};

export type IssuedSession = {
  token: string;
  sessionId: string;
  expiresAt: Date;
};

export async function createSession(input: CreateSessionInput): Promise<IssuedSession> {
  const token = generateSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_HOURS * 3_600_000);

  const sessionId = await withUser(input.userId, async (trx) => {
    const row = await trx
      .insertInto("user_session")
      .values({
        user_id: input.userId,
        tenant_id: input.tenantId,
        active_unit_id: input.activeUnitId ?? null,
        token_hash: hashToken(token),
        ip_address: input.ip ?? null,
        user_agent: input.userAgent ?? null,
        mfa_satisfied_at: input.mfaSatisfied ? new Date() : null,
        expires_at: expiresAt,
      })
      .returning("id")
      .executeTakeFirstOrThrow();

    return row.id;
  });

  return { token, sessionId, expiresAt };
}

type ResolvedRow = {
  session_id: string;
  user_id: string;
  user_name: string;
  tenant_id: string;
  tenant_name: string;
  tenant_status: string;
  membership_id: string;
  role_id: string;
  role_code: string;
  is_provider: boolean;
  active_unit_id: string | null;
  unit_ids: string[];
  permissions: string[];
  mfa_enabled_at: Date | null;
  mfa_satisfied_at: Date | null;
  expires_at: Date;
};

/**
 * Resolve o token em sessao completa. Devolve null para token invalido,
 * expirado ou revogado — a borda decide se isso vira redirecionamento ou 401.
 */
export async function resolveSession(token: string): Promise<TenantSession | null> {
  if (!token) return null;

  const row = await withoutContext(async (db) => {
    const result = await sql<ResolvedRow>`
      select * from auth_resolve_session(${hashToken(token)})
    `.execute(db);
    return result.rows[0] ?? null;
  });

  if (!row) return null;

  // Rede suspensa ou cancelada nao entra, mesmo com sessao valida.
  if (row.tenant_status !== "active" && row.tenant_status !== "trial") {
    return null;
  }

  const permissions = new Set<Permission>(
    row.permissions.filter((key): key is Permission => isPermission(key)),
  );

  return {
    sessionId: row.session_id,
    userId: row.user_id,
    userName: row.user_name,
    tenantId: row.tenant_id,
    tenantName: row.tenant_name,
    membershipId: row.membership_id,
    roleId: row.role_id,
    roleCode: row.role_code,
    isProvider: row.is_provider,
    activeUnitId: row.active_unit_id,
    unitIds: row.unit_ids,
    permissions,
    mfaEnabledAt: row.mfa_enabled_at,
    mfaSatisfiedAt: row.mfa_satisfied_at,
    expiresAt: row.expires_at,
  };
}

/**
 * Revoga a sessao. Devolve true se havia o que revogar.
 *
 * Passa pela funcao `auth_revoke_session` porque no logout nao existe contexto
 * de usuario aplicado, e a policy de `user_session` exige um. Escrever o UPDATE
 * direto aqui afetaria zero linhas em silencio: o usuario sairia da tela e o
 * token continuaria valendo.
 */
export async function revokeSession(token: string): Promise<boolean> {
  return withoutContext(async (db) => {
    const result = await sql<{ auth_revoke_session: number }>`
      select auth_revoke_session(${hashToken(token)})
    `.execute(db);
    return (result.rows[0]?.auth_revoke_session ?? 0) > 0;
  });
}

/** Revoga tudo do usuario. Usado em troca de senha e em suspeita de acesso. */
export async function revokeAllSessions(userId: string): Promise<number> {
  return withUser(userId, async (trx) => {
    const result = await trx
      .updateTable("user_session")
      .set({ revoked_at: new Date() })
      .where("user_id", "=", userId)
      .where("revoked_at", "is", null)
      .executeTakeFirst();

    return Number(result.numUpdatedRows);
  });
}

/** Troca a unidade ativa sem derrubar a sessao. */
export async function setActiveUnit(
  session: TenantSession,
  unitId: string | null,
): Promise<void> {
  if (unitId && session.unitIds.length > 0 && !session.unitIds.includes(unitId)) {
    throw new Error("Unidade fora do alcance deste usuario.");
  }

  await withUser(session.userId, async (trx) => {
    await trx
      .updateTable("user_session")
      .set({ active_unit_id: unitId })
      .where("id", "=", session.sessionId)
      .execute();
  });
}

/** Marca a sessao como recem-verificada por MFA. */
export async function markMfaSatisfied(session: TenantSession): Promise<void> {
  await withUser(session.userId, async (trx) => {
    await trx
      .updateTable("user_session")
      .set({ mfa_satisfied_at: new Date() })
      .where("id", "=", session.sessionId)
      .execute();
  });
}

export async function cleanupExpiredSessions(): Promise<number> {
  return withoutContext(async (db) => {
    const result = await sql<{ count: number }>`
      with removed as (
        delete from user_session
        where expires_at < now() - interval '7 days'
        returning 1
      )
      select count(*)::int as count from removed
    `.execute(db);
    return result.rows[0]?.count ?? 0;
  });
}
