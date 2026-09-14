"use client";

import { useActionState } from "react";
import { Alert, Button, Card, Field, Input, Select, Textarea } from "@/components/ui";
import { SOURCE_LABEL } from "@/domain/funnel";
import type { ActionState } from "@/server/actions/types";

export type PatientFormValues = {
  id?: string;
  name: string;
  phone: string;
  email: string | null;
  document: string | null;
  birthDate: string | null;
  source: string | null;
  notes: string | null;
  zipCode: string | null;
  street: string | null;
  number: string | null;
  city: string | null;
  state: string | null;
  consentData: boolean;
  consentImage: boolean;
};

export function PatientForm({
  action,
  patient,
  submitLabel,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  patient?: PatientFormValues;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const error = (field: string) => state.fieldErrors?.[field]?.[0];

  return (
    <form action={formAction} className="space-y-5">
      {state.error ? <Alert>{state.error}</Alert> : null}
      {state.success ? <Alert tone="success">{state.success}</Alert> : null}
      {patient?.id ? <input type="hidden" name="id" value={patient.id} /> : null}

      <Card className="p-5">
        <h2 className="mb-4 text-sm font-semibold text-slate-900">Dados pessoais</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nome completo" hint={error("name")} className="sm:col-span-2">
            <Input name="name" required defaultValue={patient?.name} />
          </Field>

          <Field label="Telefone / WhatsApp" hint={error("phone")}>
            <Input name="phone" required defaultValue={patient?.phone} placeholder="(11) 98765-4321" />
          </Field>

          <Field label="E-mail" hint={error("email")}>
            <Input name="email" type="email" defaultValue={patient?.email ?? ""} />
          </Field>

          <Field label="CPF" hint={error("document")}>
            <Input name="document" defaultValue={patient?.document ?? ""} placeholder="000.000.000-00" />
          </Field>

          <Field label="Data de nascimento">
            <Input name="birthDate" type="date" defaultValue={patient?.birthDate ?? ""} />
          </Field>

          <Field label="Como conheceu a clínica">
            <Select name="source" defaultValue={patient?.source ?? ""}>
              <option value="">Não informado</option>
              {Object.entries(SOURCE_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="mb-4 text-sm font-semibold text-slate-900">Endereço</h2>

        <div className="grid gap-4 sm:grid-cols-6">
          <Field label="CEP" className="sm:col-span-2">
            <Input name="zipCode" defaultValue={patient?.zipCode ?? ""} />
          </Field>
          <Field label="Rua" className="sm:col-span-3">
            <Input name="street" defaultValue={patient?.street ?? ""} />
          </Field>
          <Field label="Número">
            <Input name="number" defaultValue={patient?.number ?? ""} />
          </Field>
          <Field label="Cidade" className="sm:col-span-4">
            <Input name="city" defaultValue={patient?.city ?? ""} />
          </Field>
          <Field label="UF" className="sm:col-span-2">
            <Input name="state" maxLength={2} defaultValue={patient?.state ?? ""} />
          </Field>
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="text-sm font-semibold text-slate-900">Consentimentos (LGPD)</h2>
        <p className="mt-1 mb-4 text-xs text-slate-500">
          Dado de saúde exige base legal. Marque apenas o que o paciente assinou.
        </p>

        <div className="space-y-3">
          <label className="flex items-start gap-3 text-sm text-slate-700">
            <input
              type="checkbox"
              name="consentData"
              defaultChecked={patient?.consentData}
              className="mt-0.5 size-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            />
            Autoriza o tratamento dos dados pessoais e de saúde para o atendimento.
          </label>

          <label className="flex items-start gap-3 text-sm text-slate-700">
            <input
              type="checkbox"
              name="consentImage"
              defaultChecked={patient?.consentImage}
              className="mt-0.5 size-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            />
            Autoriza o uso de imagens (antes e depois) em materiais da clínica.
          </label>
        </div>

        <Field label="Observações internas" className="mt-4">
          <Textarea name="notes" rows={3} defaultValue={patient?.notes ?? ""} />
        </Field>
      </Card>

      <div className="flex justify-end gap-2">
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? "Salvando..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
