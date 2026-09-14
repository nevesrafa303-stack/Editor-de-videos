"use client";

import { useActionState } from "react";
import { createManualInstallment, registerPayment } from "@/server/actions/finance";
import { PatientPicker } from "@/components/patient-picker";
import { Alert, Button, Field, Input, Select, Textarea } from "@/components/ui";
import { centsToInput, formatBRL } from "@/lib/money";
import { toISODate } from "@/lib/date";

const METHODS = [
  ["PIX", "PIX"],
  ["DINHEIRO", "Dinheiro"],
  ["DEBITO", "Débito"],
  ["CREDITO", "Crédito"],
  ["BOLETO", "Boleto"],
  ["TRANSFERENCIA", "Transferência"],
  ["CONVENIO", "Convênio"],
] as const;

export function PaymentForm({
  installmentId,
  remainingCents,
  defaultMethod,
}: {
  installmentId: string;
  remainingCents: number;
  defaultMethod?: string | null;
}) {
  const [state, formAction, pending] = useActionState(registerPayment, {});

  return (
    <form action={formAction} className="grid gap-3 p-5 sm:grid-cols-4">
      {state.error ? (
        <div className="sm:col-span-4">
          <Alert>{state.error}</Alert>
        </div>
      ) : null}
      {state.success ? (
        <div className="sm:col-span-4">
          <Alert tone="success">{state.success}</Alert>
        </div>
      ) : null}

      <input type="hidden" name="installmentId" value={installmentId} />

      <Field label="Valor recebido" hint={`Saldo: ${formatBRL(remainingCents)}`}>
        <Input name="amount" defaultValue={centsToInput(remainingCents)} />
      </Field>

      <Field label="Forma">
        <Select name="method" defaultValue={defaultMethod ?? "PIX"}>
          {METHODS.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Data">
        <Input name="paidAt" type="date" defaultValue={toISODate(new Date())} />
      </Field>

      <div className="flex items-end">
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Registrando..." : "Registrar recebimento"}
        </Button>
      </div>

      <Field label="Observação" className="sm:col-span-4">
        <Textarea name="note" rows={2} placeholder="Ex.: pago em duas maquininhas" />
      </Field>
    </form>
  );
}

export function ManualInstallmentForm() {
  const [state, formAction, pending] = useActionState(createManualInstallment, {});

  return (
    <form action={formAction} className="grid gap-3 p-5 sm:grid-cols-4">
      {state.error ? (
        <div className="sm:col-span-4">
          <Alert>{state.error}</Alert>
        </div>
      ) : null}
      {state.success ? (
        <div className="sm:col-span-4">
          <Alert tone="success">{state.success}</Alert>
        </div>
      ) : null}

      <Field label="Paciente">
        <PatientPicker required />
      </Field>

      <Field label="Valor">
        <Input name="amount" placeholder="R$ 0,00" required />
      </Field>

      <Field label="Vencimento">
        <Input name="dueDate" type="date" defaultValue={toISODate(new Date())} required />
      </Field>

      <div className="flex items-end">
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Criando..." : "Criar lançamento"}
        </Button>
      </div>
    </form>
  );
}
