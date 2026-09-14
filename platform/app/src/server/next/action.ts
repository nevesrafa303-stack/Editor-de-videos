import "server-only";
import { AppError } from "@/shared/errors";
import type { ActionState } from "@/shared/action-state";
import { withTenant, type TenantContext } from "@/server/context";
import { currentRequestInfo, requireSession } from "@/server/next/session";
import type { Permission } from "@/shared/permissions";

export { EMPTY_STATE, type ActionState } from "@/shared/action-state";

/**
 * Envolve uma server action.
 *
 * Erro de dominio vira mensagem em portugues no formulario; erro inesperado
 * vira uma frase generica e um log — mensagem de banco nao vaza para a tela.
 *
 * `redirect()` do Next funciona lancando; por isso ele passa reto pelo catch.
 */
export function formAction(
  handler: (ctx: TenantContext, formData: FormData) => Promise<ActionState | void>,
  permission?: Permission,
): (previous: ActionState, formData: FormData) => Promise<ActionState> {
  return async (_previous, formData) => {
    try {
      const session = await requireSession();
      const info = await currentRequestInfo();

      return await withTenant(
        session,
        async (ctx) => {
          if (permission) ctx.assert(permission);
          return (await handler(ctx, formData)) ?? {};
        },
        info,
      );
    } catch (error) {
      if (isRedirect(error)) throw error;

      if (error instanceof AppError) {
        const state: ActionState = { error: error.message };
        if (error.details) state.fieldErrors = error.details;
        return state;
      }

      console.error("[action] erro inesperado", error);
      return { error: "Nao foi possivel concluir a operacao. Tente novamente." };
    }
  };
}

/** Acao sem formulario (botao com `action={...}`). */
export function buttonAction(
  handler: (ctx: TenantContext, formData: FormData) => Promise<void>,
  permission?: Permission,
): (formData: FormData) => Promise<void> {
  return async (formData) => {
    const session = await requireSession();
    const info = await currentRequestInfo();

    await withTenant(
      session,
      async (ctx) => {
        if (permission) ctx.assert(permission);
        await handler(ctx, formData);
      },
      info,
    );
  };
}

function isRedirect(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof (error as { digest: unknown }).digest === "string" &&
    (error as { digest: string }).digest.startsWith("NEXT_REDIRECT")
  );
}
