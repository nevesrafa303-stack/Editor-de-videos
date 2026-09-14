/**
 * Autenticacao.
 *
 * A porta de entrada e o unico lugar do sistema que fala com o banco sem
 * contexto de tenant — por isso ela usa apenas as funcoes `auth_*`
 * (SECURITY DEFINER, ver migration 0018), que nao aceitam predicado vindo do
 * cliente.
 */
import bcrypt from "bcryptjs";
import { sql } from "kysely";
import { withoutContext } from "@/server/context";
import { createSession, revokeSession, type IssuedSession } from "@/server/session";
import { NotAuthenticated, ValidationError } from "@/shared/errors";

const BCRYPT_ROUNDS = 12;

/**
 * Hash usado quando o e-mail nao existe. Sem ele, "usuario inexistente"
 * responderia em 1ms e "senha errada" em 80ms — e a diferenca entrega ao
 * atacante quais e-mails estao cadastrados.
 */
const DUMMY_HASH = "$2b$12$CJwV1lqhVcbbq9JNcoc3reD1ZLIqG0wZNe/iGIGZ.gEsI0CXdFAJy";

export async function hashPassword(plain: string): Promise<string> {
  if (plain.length < 10) {
    throw new ValidationError({ password: ["A senha precisa de ao menos 10 caracteres."] });
  }
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export type MembershipOption = {
  tenantId: string;
  tenantName: string;
  tenantSlug: string;
  membershipId: string;
  roleCode: string;
  roleName: string;
  isProvider: boolean;
  unitIds: string[];
};

export type LoginInput = {
  email: string;
  password: string;
  /** Rede escolhida. Necessario quando o usuario atende em mais de uma. */
  tenantId?: string;
  ip?: string;
  userAgent?: string;
};

export type LoginResult =
  | { kind: "authenticated"; session: IssuedSession; membership: MembershipOption }
  /** A senha confere, mas o usuario atua em mais de uma rede. */
  | { kind: "choose_tenant"; userId: string; options: MembershipOption[] };

export async function login(input: LoginInput): Promise<LoginResult> {
  const email = input.email.trim().toLowerCase();

  const user = await withoutContext(async (db) => {
    const result = await sql<{
      id: string;
      full_name: string;
      password_hash: string | null;
      locked_until: Date | null;
      mfa_enabled_at: Date | null;
      deleted_at: Date | null;
    }>`select * from auth_lookup_user(${email})`.execute(db);
    return result.rows[0] ?? null;
  });

  // Resposta unica para e-mail inexistente, conta apagada e senha errada: nao
  // entregamos a quem esta tentando adivinhar qual dos tres aconteceu.
  const invalid = new NotAuthenticated("E-mail ou senha invalidos.");

  if (!user || user.deleted_at || !user.password_hash) {
    await bcrypt.compare(input.password, DUMMY_HASH);
    throw invalid;
  }

  if (user.locked_until && user.locked_until.getTime() > Date.now()) {
    throw new NotAuthenticated(
      "Conta temporariamente bloqueada por tentativas seguidas. Tente de novo em alguns minutos.",
    );
  }

  const ok = await verifyPassword(input.password, user.password_hash);
  await registerAttempt(user.id, ok);
  if (!ok) throw invalid;

  const options = await loadMemberships(user.id);

  if (options.length === 0) {
    throw new NotAuthenticated(
      "Sua conta nao esta vinculada a nenhuma clinica ativa. Fale com o responsavel.",
    );
  }

  const chosen = input.tenantId
    ? options.find((option) => option.tenantId === input.tenantId)
    : options.length === 1
      ? options[0]
      : undefined;

  if (!chosen) {
    if (input.tenantId) throw invalid; // pediu uma rede a que nao pertence
    return { kind: "choose_tenant", userId: user.id, options };
  }

  const session = await createSession({
    userId: user.id,
    tenantId: chosen.tenantId,
    activeUnitId: chosen.unitIds[0] ?? null,
    ip: input.ip ?? null,
    userAgent: input.userAgent ?? null,
    // MFA ainda nao implantado: quem nao ativou entra direto. Quando ativar,
    // a sessao nasce sem MFA satisfeito e o segundo fator marca depois.
    mfaSatisfied: !user.mfa_enabled_at,
  });

  return { kind: "authenticated", session, membership: chosen };
}

/** Segunda etapa do login quando o usuario atua em mais de uma rede. */
export async function selectTenant(input: {
  userId: string;
  tenantId: string;
  ip?: string;
  userAgent?: string;
}): Promise<{ session: IssuedSession; membership: MembershipOption }> {
  const options = await loadMemberships(input.userId);
  const chosen = options.find((option) => option.tenantId === input.tenantId);

  if (!chosen) {
    throw new NotAuthenticated("Voce nao tem acesso a esta clinica.");
  }

  const session = await createSession({
    userId: input.userId,
    tenantId: chosen.tenantId,
    activeUnitId: chosen.unitIds[0] ?? null,
    ip: input.ip ?? null,
    userAgent: input.userAgent ?? null,
    mfaSatisfied: true,
  });

  return { session, membership: chosen };
}

export async function logout(token: string): Promise<void> {
  await revokeSession(token);
}

export async function loadMemberships(userId: string): Promise<MembershipOption[]> {
  return withoutContext(async (db) => {
    const result = await sql<{
      tenant_id: string;
      tenant_name: string;
      tenant_slug: string;
      membership_id: string;
      role_code: string;
      role_name: string;
      is_provider: boolean;
      unit_ids: string[];
    }>`select * from auth_memberships(${userId})`.execute(db);

    return result.rows.map((row) => ({
      tenantId: row.tenant_id,
      tenantName: row.tenant_name,
      tenantSlug: row.tenant_slug,
      membershipId: row.membership_id,
      roleCode: row.role_code,
      roleName: row.role_name,
      isProvider: row.is_provider,
      unitIds: row.unit_ids,
    }));
  });
}

async function registerAttempt(userId: string, success: boolean): Promise<void> {
  await withoutContext(async (db) => {
    await sql`select auth_register_login_attempt(${userId}, ${success})`.execute(db);
  });
}
