/**
 * Estado de formulario — o contrato entre uma server action e o `useActionState`
 * que a consome.
 *
 * Mora aqui, e nao junto do `formAction`, porque componentes de cliente
 * precisam do valor inicial: se importassem do adaptador do servidor,
 * arrastariam `withTenant` → `pg` para dentro do bundle do navegador.
 * Este arquivo nao importa nada.
 */
export type ActionState = {
  error?: string;
  success?: string;
  fieldErrors?: Record<string, string[]>;
};

export const EMPTY_STATE: ActionState = {};
