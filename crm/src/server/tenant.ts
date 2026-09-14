import "server-only";
import { redirect } from "next/navigation";
import { getSession, type SessionPayload } from "@/server/auth";
import { can, type Permission } from "@/server/permissions";
import { scopedDb } from "@/server/tenant-scope";

export { scopedDb, TenantViolationError } from "@/server/tenant-scope";

export type TenantDb = ReturnType<typeof scopedDb>;

export type TenantContext = {
  session: SessionPayload;
  clinicId: string;
  db: TenantDb;
};

/** Contexto obrigatório de pagina/acao autenticada. Redireciona se deslogado. */
export async function requireTenant(): Promise<TenantContext> {
  const session = await getSession();
  if (!session) redirect("/entrar");

  return {
    session,
    clinicId: session.clinicId,
    db: scopedDb(session.clinicId),
  };
}

/** Igual a `requireTenant`, mas exige uma permissão especifica. */
export async function requirePermission(
  permission: Permission,
): Promise<TenantContext> {
  const context = await requireTenant();
  if (!can(context.session.role, permission)) {
    redirect("/painel?erro=sem-permissao");
  }
  return context;
}

/** Versao para server actions: erro em vez de redirect, para virar mensagem. */
export async function assertPermission(permission: Permission): Promise<TenantContext> {
  const context = await requireTenant();
  if (!can(context.session.role, permission)) {
    throw new Error("Seu perfil não tem permissão para esta acao.");
  }
  return context;
}
