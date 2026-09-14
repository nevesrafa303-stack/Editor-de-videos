"use client";

import { useActionState, useState } from "react";
import { addPlanItem, approvePlan, updatePlan } from "@/server/actions/plans";
import { Alert, Button, Field, Input, Select, Textarea } from "@/components/ui";
import { centsToInput, formatBRL, parseBRL } from "@/lib/money";
import { buildInstallments } from "@/domain/installments";
import { formatDate, toISODate } from "@/lib/date";

type Procedure = { id: string; name: string; priceCents: number; category: string };

export function AddItemForm({
  planId,
  procedures,
}: {
  planId: string;
  procedures: Procedure[];
}) {
  const [state, formAction, pending] = useActionState(addPlanItem, {});
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState<string>("");

  return (
    <form action={formAction} className="grid gap-3 p-5 sm:grid-cols-6">
      {state.error ? (
        <div className="sm:col-span-6">
          <Alert>{state.error}</Alert>
        </div>
      ) : null}
      <input type="hidden" name="planId" value={planId} />

      <Field label="Procedimento" className="sm:col-span-3">
        <Select
          name="procedureId"
          defaultValue=""
          onChange={(event) => {
            const procedure = procedures.find((item) => item.id === event.target.value);
            setPrice(procedure ? centsToInput(procedure.priceCents) : "");
            setCategory(procedure?.category ?? "");
          }}
        >
          <option value="">Item avulso (descrever ao lado)</option>
          {procedures.map((procedure) => (
            <option key={procedure.id} value={procedure.id}>
              {procedure.name} — {formatBRL(procedure.priceCents)}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Descrição livre" className="sm:col-span-3">
        <Input name="description" placeholder="Usado quando não ha item no catalogo" />
      </Field>

      <Field
        label={category === "ESTETICA" ? "Região" : "Dentes (FDI)"}
        className="sm:col-span-2"
      >
        {category === "ESTETICA" ? (
          <Input name="region" placeholder="Terço médio, mento, glúteo..." />
        ) : (
          <Input name="teeth" placeholder="11, 12, 21" />
        )}
      </Field>

      <Field label="Qtd.">
        <Input name="quantity" type="number" min={1} max={99} defaultValue={1} />
      </Field>

      <Field label="Valor unitário" className="sm:col-span-2">
        <Input
          name="unitPrice"
          value={price}
          onChange={(event) => setPrice(event.target.value)}
          placeholder="R$ 0,00"
        />
      </Field>

      <div className="flex items-end">
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "..." : "Adicionar"}
        </Button>
      </div>
    </form>
  );
}

export function PlanSettingsForm({
  planId,
  discountCents,
  notes,
  status,
  locked,
}: {
  planId: string;
  discountCents: number;
  notes: string | null;
  status: string;
  locked: boolean;
}) {
  const [state, formAction, pending] = useActionState(updatePlan, {});

  return (
    <form action={formAction} className="space-y-3 p-5">
      {state.error ? <Alert>{state.error}</Alert> : null}
      {state.success ? <Alert tone="success">{state.success}</Alert> : null}
      <input type="hidden" name="id" value={planId} />

      <Field label="Desconto">
        <Input name="discount" defaultValue={centsToInput(discountCents)} disabled={locked} />
      </Field>

      <Field label="Status">
        <Select name="status" defaultValue={status} disabled={locked}>
          <option value="RASCUNHO">Rascunho</option>
          <option value="ENVIADO">Enviado ao paciente</option>
          <option value="RECUSADO">Recusado</option>
        </Select>
      </Field>

      <Field label="Observações do orçamento">
        <Textarea name="notes" rows={3} defaultValue={notes ?? ""} />
      </Field>

      <Button type="submit" variant="secondary" disabled={pending}>
        {pending ? "Salvando..." : "Salvar"}
      </Button>
    </form>
  );
}

export function ApproveForm({
  planId,
  totalCents,
}: {
  planId: string;
  totalCents: number;
}) {
  const [state, formAction, pending] = useActionState(approvePlan, {});
  const [count, setCount] = useState(1);
  const [downPayment, setDownPayment] = useState("");
  const [firstDueDate, setFirstDueDate] = useState(toISODate(new Date()));

  // Prévia no cliente usando a mesma funcao do servidor: o que a recepção ve na
  // tela e exatamente o que será gravado.
  let preview: { number: number; amountCents: number; dueDate: Date }[] = [];
  try {
    preview = buildInstallments({
      totalCents,
      count,
      firstDueDate: new Date(`${firstDueDate}T00:00:00`),
      downPaymentCents: parseBRL(downPayment),
    });
  } catch {
    preview = [];
  }

  return (
    <form action={formAction} className="space-y-3 p-5">
      {state.error ? <Alert>{state.error}</Alert> : null}
      {state.success ? <Alert tone="success">{state.success}</Alert> : null}
      <input type="hidden" name="id" value={planId} />

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Parcelas">
          <Input
            name="count"
            type="number"
            min={1}
            max={48}
            value={count}
            onChange={(event) => setCount(Math.max(1, Number(event.target.value)))}
          />
        </Field>

        <Field label="Entrada">
          <Input
            name="downPayment"
            value={downPayment}
            onChange={(event) => setDownPayment(event.target.value)}
            placeholder="R$ 0,00"
          />
        </Field>

        <Field label="1o vencimento">
          <Input
            name="firstDueDate"
            type="date"
            value={firstDueDate}
            onChange={(event) => setFirstDueDate(event.target.value)}
            required
          />
        </Field>

        <Field label="Forma de pagamento">
          <Select name="method" defaultValue="PIX">
            <option value="PIX">PIX</option>
            <option value="DINHEIRO">Dinheiro</option>
            <option value="DEBITO">Débito</option>
            <option value="CREDITO">Crédito</option>
            <option value="BOLETO">Boleto</option>
            <option value="TRANSFERENCIA">Transferência</option>
            <option value="CONVENIO">Convênio</option>
          </Select>
        </Field>
      </div>

      {preview.length > 0 ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <p className="mb-2 text-xs font-medium tracking-wide text-slate-500 uppercase">
            Prévia das parcelas
          </p>
          <ul className="max-h-40 space-y-1 overflow-auto text-xs text-slate-600">
            {preview.map((parcel) => (
              <li key={parcel.number} className="flex justify-between tabular-nums">
                <span>
                  {parcel.number}/{preview.length} · {formatDate(parcel.dueDate)}
                </span>
                <span className="font-medium">{formatBRL(parcel.amountCents)}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? "Aprovando..." : `Aprovar e gerar ${preview.length || 1} parcela(s)`}
      </Button>
    </form>
  );
}
