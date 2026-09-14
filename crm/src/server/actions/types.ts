import { ZodError } from "zod";

/** Estado devolvido pelas server actions para os formularios (useActionState). */
export type ActionState = {
  error?: string;
  success?: string;
  /** Erros por campo, quando a validacao do zod falha. */
  fieldErrors?: Record<string, string[]>;
};

export const EMPTY_STATE: ActionState = {};

/** Converte excecoes conhecidas em mensagem para o usuário final. */
export function toActionState(error: unknown): ActionState {
  if (error instanceof ZodError) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of error.issues) {
      const key = issue.path.join(".") || "_";
      fieldErrors[key] = [...(fieldErrors[key] ?? []), issue.message];
    }
    return { error: "Confira os campos destacados.", fieldErrors };
  }

  if (error instanceof Error) return { error: error.message };
  return { error: "Não foi possivel concluir a operação." };
}
