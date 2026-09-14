"use client";

import { useActionState } from "react";
import { signup } from "@/server/actions/auth";
import { Alert, Button, Field, Input } from "@/components/ui";

export function SignupForm() {
  const [state, formAction, pending] = useActionState(signup, {});
  const error = (field: string) => state.fieldErrors?.[field]?.[0];

  return (
    <form action={formAction} className="space-y-4">
      {state.error ? <Alert>{state.error}</Alert> : null}

      <Field label="Nome da clínica" hint={error("clinicName")}>
        <Input name="clinicName" required autoFocus placeholder="Clínica Sorriso" />
      </Field>

      <Field label="Seu nome" hint={error("name")}>
        <Input name="name" required placeholder="Dra. Ana Souza" />
      </Field>

      <Field label="E-mail" hint={error("email")}>
        <Input name="email" type="email" autoComplete="email" required />
      </Field>

      <Field
        label="Senha"
        hint={error("password") ?? "Mínimo de 8 caracteres."}
      >
        <Input name="password" type="password" autoComplete="new-password" required />
      </Field>

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? "Criando..." : "Criar clínica"}
      </Button>
    </form>
  );
}
