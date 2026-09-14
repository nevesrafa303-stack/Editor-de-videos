/**
 * Contexto de tenant.
 *
 * Esta e a unica porta de acesso ao banco no codigo de feature. Ninguem pega
 * conexao solta: `withTenant` abre uma transacao, aplica o contexto que as
 * policies de RLS leem e entrega um cliente ja preso a clinica da sessao.
 *
 * Por que transacao mesmo para leitura simples:
 *
 * O contexto vive em `set_config(..., is_local => true)`, que morre com a
 * transacao. Se fosse `SET` de sessao, a conexao voltaria para o pool ainda
 * carregando o tenant do request anterior — e o proximo request leria a
 * clinica errada. A transacao e o que torna o pool seguro.
 */
import { sql, type Transaction } from "kysely";
import { getDb, type DB } from "@/server/db";
import { Forbidden, NotAuthenticated } from "@/shared/errors";
import { translatePgError } from "@/shared/postgres-errors";
import { isPhiPermission, type Permission } from "@/shared/permissions";

export type TenantSession = {
  sessionId: string;
  userId: string;
  userName: string;
  tenantId: string;
  tenantName: string;
  membershipId: string;
  roleId: string;
  roleCode: string;
  isProvider: boolean;
  /** Unidade selecionada na interface. Padrao de escrita. */
  activeUnitId: string | null;
  /** Unidades visiveis. Lista VAZIA significa "todas as unidades da rede". */
  unitIds: string[];
  permissions: ReadonlySet<Permission>;
  /**
   * Fuso da unidade ativa (ou da rede). Toda data mostrada na tela e formatada
   * nele: `timestamptz` guarda o instante, e o instante so vira "14:00" depois
   * de escolher o fuso. O do servidor nunca e a resposta certa.
   */
  timezone: string;
  mfaEnabledAt: Date | null;
  mfaSatisfiedAt: Date | null;
  expiresAt: Date;
};

export type RequestInfo = {
  requestId?: string;
  ip?: string;
  userAgent?: string;
};

export type PhiPurpose =
  | "atendimento"
  | "faturamento"
  | "auditoria"
  | "suporte"
  | "exportacao_lgpd";

export type TenantContext = {
  /** Cliente escopado. Toda consulta dentro dele passa por RLS. */
  db: Transaction<DB>;
  session: TenantSession;
  /** Unidade de escrita. Lanca se a sessao nao tiver unidade ativa. */
  unitId(): string;
  can(permission: Permission): boolean;
  /** Recusa a operacao se faltar permissao (ou MFA, para dado clinico). */
  assert(permission: Permission): void;
  /**
   * Registra leitura de dado de saude. Exigencia de LGPD: numa investigacao a
   * pergunta e quem ABRIU a ficha, nao quem editou.
   */
  recordChartAccess(input: {
    patientId: string;
    entity: string;
    entityId?: string;
    purpose?: PhiPurpose;
  }): Promise<void>;
};

const MFA_WINDOW_MINUTES = Number(process.env.MFA_WINDOW_MINUTES ?? 720);

function buildContext(
  trx: Transaction<DB>,
  session: TenantSession,
  request: RequestInfo,
): TenantContext {
  const can = (permission: Permission) => session.permissions.has(permission);

  return {
    db: trx,
    session,

    unitId() {
      if (session.activeUnitId) return session.activeUnitId;
      if (session.unitIds.length === 1) return session.unitIds[0] as string;
      throw new Forbidden(
        "Escolha a unidade antes de continuar: esta operacao precisa saber onde acontece.",
      );
    },

    can,

    assert(permission: Permission) {
      if (!can(permission)) {
        throw new Forbidden(
          "Seu perfil nao tem permissao para esta acao.",
          permission,
        );
      }

      // MFA so e cobrado de quem ja ativou. Exigir de quem nao configurou
      // trancaria a clinica para fora do proprio prontuario.
      if (isPhiPermission(permission) && session.mfaEnabledAt) {
        const satisfiedAt = session.mfaSatisfiedAt?.getTime() ?? 0;
        const expired = Date.now() - satisfiedAt > MFA_WINDOW_MINUTES * 60_000;
        if (expired) {
          throw new Forbidden(
            "Confirme sua identidade novamente para acessar dados clinicos.",
            permission,
          );
        }
      }
    },

    async recordChartAccess({ patientId, entity, entityId, purpose = "atendimento" }) {
      await trx
        .insertInto("phi_access_log")
        .values({
          tenant_id: session.tenantId,
          unit_id: session.activeUnitId,
          actor_id: session.userId,
          patient_id: patientId,
          entity,
          entity_id: entityId ?? null,
          purpose,
          request_id: request.requestId ?? null,
          ip_address: request.ip ?? null,
        })
        .execute();
    },
  };
}

/**
 * Executa `fn` dentro de uma transacao com o contexto da sessao aplicado.
 *
 * Tudo que acontece dentro compartilha a transacao: ou o efeito inteiro entra,
 * ou nada entra. E o que faz "aprovar orcamento gera as parcelas" ser uma coisa
 * so, e nao duas que podem discordar.
 */
export async function withTenant<T>(
  session: TenantSession,
  fn: (ctx: TenantContext) => Promise<T>,
  request: RequestInfo = {},
): Promise<T> {
  if (session.expiresAt.getTime() <= Date.now()) {
    throw new NotAuthenticated();
  }

  let signal: unknown;

  try {
    const result = await getDb()
      .transaction()
      .execute(async (trx) => {
        await applyContext(trx, session, request);

        try {
          return await fn(buildContext(trx, session, request));
        } catch (error) {
          // Sinal de controle nao e falha: guardar e sair normalmente deixa a
          // transacao COMITAR antes de o sinal seguir viagem.
          if (!isControlFlowSignal(error)) throw error;
          signal = error;
          return undefined as T;
        }
      });

    if (signal) throw signal;
    return result;
  } catch (error) {
    throw translatePgError(error) ?? error;
  }
}

/**
 * Distingue "deu errado" de "acabou aqui".
 *
 * Frameworks de UI sinalizam redirecionamento LANCANDO. Dentro de uma
 * transacao isso e indistinguivel de erro, e o banco desfaz tudo: o paciente
 * seria cadastrado, o navegador seria mandado para a ficha dele — e a ficha
 * nao existiria. Custou um teste de navegador para aparecer.
 *
 * A checagem e uma comparacao de string em `digest`, nao um import: o nucleo
 * continua sem depender de framework nenhum.
 */
function isControlFlowSignal(error: unknown): boolean {
  if (typeof error !== "object" || error === null || !("digest" in error)) return false;

  const digest = (error as { digest: unknown }).digest;

  // `NEXT_REDIRECT`, `NEXT_HTTP_ERROR_FALLBACK;404` e afins. Erro de verdade
  // do servidor recebe um digest numerico, entao o prefixo nao colide.
  return typeof digest === "string" && digest.startsWith("NEXT_");
}

async function applyContext(
  trx: Transaction<DB>,
  session: TenantSession,
  request: RequestInfo,
): Promise<void> {
  // `is_local => true` e o ponto critico: o contexto morre com a transacao e
  // nao volta para o pool grudado na conexao.
  await sql`
    select
      set_config('app.tenant_id',     ${session.tenantId},                    true),
      set_config('app.user_id',       ${session.userId},                      true),
      set_config('app.membership_id', ${session.membershipId},                true),
      set_config('app.role',          ${session.roleCode},                    true),
      set_config('app.unit_ids',      ${session.unitIds.join(",")},           true),
      set_config('app.request_id',    ${request.requestId ?? ""},             true),
      set_config('app.ip',            ${request.ip ?? ""},                    true),
      set_config('app.user_agent',    ${request.userAgent ?? ""},             true)
  `.execute(trx);
}

/**
 * Transacao com apenas o usuario no contexto, sem tenant.
 *
 * Usada no login, entre "a senha confere" e "a clinica foi escolhida": e a
 * janela em que existe usuario e ainda nao existe rede. Serve para escrever a
 * propria sessao, cuja policy e `user_id = current_user_id()`.
 */
export async function withUser<T>(
  userId: string,
  fn: (trx: Transaction<DB>) => Promise<T>,
): Promise<T> {
  try {
    return await getDb()
      .transaction()
      .execute(async (trx) => {
        await sql`select set_config('app.user_id', ${userId}, true)`.execute(trx);
        return fn(trx);
      });
  } catch (error) {
    throw translatePgError(error) ?? error;
  }
}

/**
 * Acesso sem nenhum contexto. So para as funcoes de autenticacao
 * (`auth_*`, SECURITY DEFINER) e para health check.
 */
export async function withoutContext<T>(fn: (db: ReturnType<typeof getDb>) => Promise<T>): Promise<T> {
  try {
    return await fn(getDb());
  } catch (error) {
    throw translatePgError(error) ?? error;
  }
}
