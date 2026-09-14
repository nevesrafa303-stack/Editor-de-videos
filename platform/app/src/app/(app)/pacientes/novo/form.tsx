"use client";

import { useActionState } from "react";
import { cadastrarPacienteAction } from "@/modules/patient/server-actions";
import { EMPTY_STATE } from "@/shared/action-state";
import { Button, Field, Input, Notice, Panel, Select, Textarea } from "@/ui";

export function NovoPacienteForm() {
  const [state, action, pending] = useActionState(cadastrarPacienteAction, EMPTY_STATE);
  const erro = (campo: string) => state.fieldErrors?.[campo]?.[0];

  return (
    <form action={action} className="space-y-5">
      {state.error ? <Notice>{state.error}</Notice> : null}

      <Panel className="grid gap-4 p-5 sm:grid-cols-2">
        <Field label="Nome completo" className="sm:col-span-2" error={erro("fullName")}>
          <Input id="fullName" name="fullName" required autoFocus />
        </Field>

        <Field label="Telefone" error={erro("phone")} hint="Com DDD.">
          <Input id="phone" name="phone" required placeholder="(11) 98765-4321" />
        </Field>

        <Field label="E-mail" error={erro("email")}>
          <Input id="email" name="email" type="email" />
        </Field>

        <Field label="CPF" error={erro("taxId")}>
          <Input id="taxId" name="taxId" placeholder="000.000.000-00" />
        </Field>

        <Field label="Data de nascimento" error={erro("birthDate")}>
          <Input id="birthDate" name="birthDate" type="date" />
        </Field>

        <Field label="Gênero">
          <Select id="gender" name="gender" defaultValue="nao_informado">
            <option value="nao_informado">Não informado</option>
            <option value="feminino">Feminino</option>
            <option value="masculino">Masculino</option>
            <option value="outro">Outro</option>
          </Select>
        </Field>

        <Field label="Observações" className="sm:col-span-2">
          <Textarea id="notes" name="notes" rows={3} />
        </Field>
      </Panel>

      <div className="flex justify-end">
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? "Cadastrando…" : "Cadastrar paciente"}
        </Button>
      </div>
    </form>
  );
}
