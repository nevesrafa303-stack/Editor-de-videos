"use client";

import { useActionState } from "react";
import { createPlan } from "@/server/actions/plans";
import { PatientPicker } from "@/components/patient-picker";
import { Alert, Button, Field, Input, Select } from "@/components/ui";

export function NewPlanForm({
  professionals,
  patient,
}: {
  professionals: { id: string; name: string }[];
  patient?: { id: string; name: string };
}) {
  const [state, formAction, pending] = useActionState(createPlan, {});

  return (
    <form action={formAction} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {state.error ? (
        <div className="sm:col-span-2 lg:col-span-4">
          <Alert>{state.error}</Alert>
        </div>
      ) : null}

      <Field label="Paciente">
        <PatientPicker initial={patient} required />
      </Field>

      <Field label="Profissional responsável">
        <Select name="professionalId" defaultValue="">
          <option value="">Eu</option>
          {professionals.map((professional) => (
            <option key={professional.id} value={professional.id}>
              {professional.name}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Observação" className="sm:col-span-2 lg:col-span-1">
        <Input name="notes" placeholder="Ex.: paciente quer comecar pelos superiores" />
      </Field>

      <div className="flex items-end">
        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {pending ? "Criando..." : "Criar orçamento"}
        </Button>
      </div>
    </form>
  );
}
