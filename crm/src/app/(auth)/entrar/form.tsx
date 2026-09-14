"use client";

import { useActionState } from "react";
import { login } from "@/server/actions/auth";
import { Alert, Button, Field, Input } from "@/components/ui";

export function LoginForm({ next }: { next?: string }) {
  const [state, formAction, pending] = useActionState(login, {});

  return (
    <form action={formAction} className="space-y-4">
      {state.error ? <Alert>{state.error}</Alert> : null}
      {next ? <input type="hidden" name="next" value={next} /> : null}

      <Field label="E-mail">
        <Input
          name="email"
          type="email"
          autoComplete="email"
          required
          autoFocus
          placeholder="voce@clinica.com.br"
        />
      </Field>

      <Field label="Senha">
        <Input name="password" type="password" autoComplete="current-password" required />
      </Field>

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? "Entrando..." : "Entrar"}
      </Button>
    </form>
  );
}
