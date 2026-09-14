import "server-only";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { resolveSession } from "@/server/session";
import type { RequestInfo, TenantSession } from "@/server/context";

export const SESSION_COOKIE = "clinica_sessao";

/**
 * Sessao do request atual.
 *
 * `cache` do React deduplica por requisicao: layout, pagina e server action
 * chamam a vontade e o banco e consultado uma vez so.
 */
export const currentSession = cache(async (): Promise<TenantSession | null> => {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return resolveSession(token);
});

export async function requireSession(): Promise<TenantSession> {
  const session = await currentSession();
  if (!session) redirect("/entrar");
  return session;
}

/**
 * Dados do request que alimentam a auditoria: sem eles, `audit_log` registra o
 * que mudou mas nao de onde veio.
 */
export const currentRequestInfo = cache(async (): Promise<RequestInfo> => {
  const head = await headers();
  const info: RequestInfo = {};

  const forwarded = head.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || head.get("x-real-ip") || "";
  if (ip) info.ip = ip;

  const agent = head.get("user-agent");
  if (agent) info.userAgent = agent.slice(0, 500);

  const requestId = head.get("x-request-id");
  if (requestId) info.requestId = requestId;

  return info;
});

export async function setSessionCookie(token: string, expiresAt: Date): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function readSessionToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(SESSION_COOKIE)?.value ?? null;
}
