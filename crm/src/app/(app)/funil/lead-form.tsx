"use client";

import { useActionState } from "react";
import { createLead } from "@/server/actions/leads";
import { SOURCE_LABEL } from "@/domain/funnel";
import { Alert, Button, Field, Input, Select } from "@/components/ui";

export function NewLeadForm({ owners }: { owners: { id: string; name: string }[] }) {
  const [state, formAction, pending] = useActionState(createLead, {});

  return (
    <form action={formAction} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {state.error ? (
        <div className="sm:col-span-2 lg:col-span-4">
          <Alert>{state.error}</Alert>
        </div>
      ) : null}
      {state.success ? (
        <div className="sm:col-span-2 lg:col-span-4">
          <Alert tone="success">{state.success}</Alert>
        </div>
      ) : null}

      <Field label="Nome">
        <Input name="name" required placeholder="Maria Silva" />
      </Field>

      <Field label="WhatsApp">
        <Input name="phone" required placeholder="(11) 98765-4321" />
      </Field>

      <Field label="Origem">
        <Select name="source" defaultValue="INSTAGRAM">
          {Object.entries(SOURCE_LABEL).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Interesse">
        <Input name="interest" placeholder="Clareamento, lentes, botox..." />
      </Field>

      <Field label="Valor potencial">
        <Input name="value" placeholder="R$ 3.500,00" />
      </Field>

      <Field label="Responsável">
        <Select name="ownerId" defaultValue="">
          <option value="">Eu</option>
          {owners.map((owner) => (
            <option key={owner.id} value={owner.id}>
              {owner.name}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Próximo contato">
        <Input name="nextFollowUpAt" type="date" />
      </Field>

      <div className="flex items-end">
        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {pending ? "Salvando..." : "Adicionar lead"}
        </Button>
      </div>
    </form>
  );
}
