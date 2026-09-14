"use server";

import { redirect } from "next/navigation";
import { login, loadMemberships, logout, selectTenant, type MembershipOption } from "@/server/auth";
import {
  clearSessionCookie,
  currentRequestInfo,
  readSessionToken,
  setSessionCookie,
} from "@/server/next/session";
import {
  clearPendingLogin,
  readPendingLogin,
  startPendingLogin,
} from "@/server/next/pending-login";
import { AppError } from "@/shared/errors";
import type { ActionState } from "@/shared/action-state";

export type LoginState = ActionState & {
  /** Preenchido quando o usuário atende em mais de uma rede. */
  options?: MembershipOption[];
  email?: string;
};

export async function entrarAction(_previous: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const tenantId = String(formData.get("tenantId") ?? "").trim();

  if (!email || !password) {
    return { error: "Informe e-mail e senha.", email };
  }

  let destino = "/pacientes";

  try {
    const info = await currentRequestInfo();
    const result = await login({
      email,
      password,
      ...(tenantId ? { tenantId } : {}),
      ...(info.ip ? { ip: info.ip } : {}),
      ...(info.userAgent ? { userAgent: info.userAgent } : {}),
    });

    if (result.kind === "choose_tenant") {
      await startPendingLogin(result.userId);
      return { options: result.options, email };
    }

    await setSessionCookie(result.session.token, result.session.expiresAt);
    await clearPendingLogin();
  } catch (error) {
    if (error instanceof AppError) return { error: error.message, email };
    console.error("[login] erro inesperado", error);
    return { error: "Não foi possível entrar agora. Tente novamente.", email };
  }

  redirect(destino);
}

/** Segunda etapa: a rede foi escolhida e o login pendente está assinado. */
export async function escolherClinicaAction(
  _previous: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const tenantId = String(formData.get("tenantId") ?? "").trim();

  try {
    const userId = await readPendingLogin();
    if (!userId) {
      return { error: "A escolha expirou. Entre novamente." };
    }
    if (!tenantId) {
      return { error: "Escolha a clínica.", options: await loadMemberships(userId) };
    }

    const info = await currentRequestInfo();
    const { session } = await selectTenant({
      userId,
      tenantId,
      ...(info.ip ? { ip: info.ip } : {}),
      ...(info.userAgent ? { userAgent: info.userAgent } : {}),
    });

    await setSessionCookie(session.token, session.expiresAt);
    await clearPendingLogin();
  } catch (error) {
    if (error instanceof AppError) return { error: error.message };
    console.error("[login] erro inesperado ao escolher clínica", error);
    return { error: "Não foi possível entrar agora. Tente novamente." };
  }

  redirect("/pacientes");
}

export async function sairAction(): Promise<void> {
  const token = await readSessionToken();
  if (token) await logout(token);
  await clearSessionCookie();
  redirect("/entrar");
}
