"use client";

import { useActionState } from "react";
import { entrarAction, escolherClinicaAction, type LoginState } from "@/modules/auth/actions";
import { Button, Field, Input, Notice } from "@/ui";

const EMPTY: LoginState = {};

export function EntrarForm() {
  const [state, action, pending] = useActionState(entrarAction, EMPTY);

  // Senha conferida, mas a pessoa atende em mais de uma rede: segunda etapa.
  if (state.options && state.options.length > 0) {
    return <EscolherClinica options={state.options} />;
  }

  return (
    <form action={action} className="space-y-4">
      {state.error ? <Notice>{state.error}</Notice> : null}

      <Field label="E-mail">
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          autoFocus
          defaultValue={state.email ?? ""}
          placeholder="voce@clinica.com.br"
        />
      </Field>

      <Field label="Senha">
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </Field>

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? "Entrando…" : "Entrar"}
      </Button>
    </form>
  );
}

function EscolherClinica({ options }: { options: NonNullable<LoginState["options"]> }) {
  const [state, action, pending] = useActionState(escolherClinicaAction, EMPTY);

  return (
    <form action={action} className="space-y-4">
      {state.error ? <Notice>{state.error}</Notice> : null}

      <div>
        <h2 className="text-sm font-semibold text-ink">Em qual clínica você vai trabalhar?</h2>
        <p className="mt-1 text-xs text-muted">
          Você atende em mais de uma. A escolha vale para esta sessão.
        </p>
      </div>

      <div className="space-y-2">
        {options.map((option) => (
          <button
            key={option.tenantId}
            type="submit"
            name="tenantId"
            value={option.tenantId}
            disabled={pending}
            className="flex w-full items-center justify-between gap-3 rounded-md border border-line bg-surface px-4 py-3 text-left transition hover:border-structure hover:bg-structure-soft disabled:opacity-50"
          >
            <span>
              <span className="block text-sm font-semibold text-ink">{option.tenantName}</span>
              <span className="block text-xs text-muted">{option.roleName}</span>
            </span>
            <span aria-hidden className="text-structure">
              →
            </span>
          </button>
        ))}
      </div>
    </form>
  );
}
