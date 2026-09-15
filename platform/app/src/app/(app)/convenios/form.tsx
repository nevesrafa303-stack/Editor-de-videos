"use client";

import { useActionState, useState } from "react";
import { salvarConvenioAction } from "@/modules/payer/server-actions";
import { BILLING_MODES, PAYER_KINDS, type BillingMode } from "@/modules/payer";
import { EMPTY_STATE } from "@/shared/action-state";
import { Button, Field, FormError, Input, Notice, Panel, PanelHead, Select, Textarea } from "@/ui";
import { MODO, TIPO } from "./modo";

export type ConvenioForm = {
  id: string;
  code: string;
  name: string;
  kind: string;
  billingMode: BillingMode;
  settlementDays: number;
  adminFeePercent: number;
  notes: string | null;
  isActive: boolean;
};

export function NovoConvenioForm() {
  return (
    <Panel className="overflow-hidden">
      <PanelHead title="Novo convênio" hint="Depois de salvar, a tela abre na tabela de preços." />
      <Campos />
    </Panel>
  );
}

export function EditarConvenioForm({ convenio }: { convenio: ConvenioForm }) {
  return (
    <Panel className="overflow-hidden">
      <PanelHead title="Cadastro" />
      <Campos convenio={convenio} />
    </Panel>
  );
}

function Campos({ convenio }: { convenio?: ConvenioForm }) {
  const [state, action, pending] = useActionState(salvarConvenioAction, EMPTY_STATE);
  const [modo, setModo] = useState<BillingMode>(convenio?.billingMode ?? "reimbursement");
  const erro = (campo: string) => state.fieldErrors?.[campo]?.[0];

  return (
    <form action={action} className="space-y-4 px-5 py-4">
      <FormError error={state.error} fieldErrors={state.fieldErrors} />
      {state.success ? (
        <p className="text-sm font-medium text-positive">{state.success}</p>
      ) : null}

      {convenio ? <input type="hidden" name="id" value={convenio.id} /> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nome" className="sm:col-span-2" error={erro("name")}>
          <Input name="name" required defaultValue={convenio?.name} placeholder="Nome do convênio" />
        </Field>

        <Field
          label="Código"
          error={erro("code")}
          hint="Como ele aparece nos relatórios. Não muda depois."
        >
          <Input
            name="code"
            required
            defaultValue={convenio?.code}
            placeholder="ODONTO_SAUDE"
            className="num uppercase"
          />
        </Field>

        <Field label="Tipo">
          <Select name="kind" defaultValue={convenio?.kind ?? "insurance"}>
            {PAYER_KINDS.map((k) => (
              <option key={k} value={k}>
                {TIPO[k]}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Faturamento" className="sm:col-span-2">
          <Select
            name="billingMode"
            value={modo}
            onChange={(e) => setModo(e.currentTarget.value as BillingMode)}
          >
            {BILLING_MODES.map((m) => (
              <option key={m} value={m}>
                {MODO[m].rotulo}
              </option>
            ))}
          </Select>
        </Field>

        <div className="sm:col-span-2">
          <Notice tone={MODO[modo].tom}>{MODO[modo].explica}</Notice>
        </div>

        <Field label="Prazo de repasse (dias)" error={erro("settlementDays")}>
          <Input
            name="settlementDays"
            type="number"
            min="0"
            max="365"
            defaultValue={convenio?.settlementDays ?? 0}
            className="num"
          />
        </Field>

        <Field label="Taxa administrativa (%)" error={erro("adminFeePercent")}>
          <Input
            name="adminFeePercent"
            defaultValue={convenio?.adminFeePercent ?? 0}
            className="num"
          />
        </Field>

        <Field label="Observações" className="sm:col-span-2">
          <Textarea name="notes" rows={2} defaultValue={convenio?.notes ?? ""} />
        </Field>

        {convenio ? (
          <label className="flex items-center gap-2 text-sm text-ink-soft sm:col-span-2">
            <input
              type="checkbox"
              name="isActive"
              value="1"
              defaultChecked={convenio.isActive}
              className="size-4 rounded border-line"
            />
            Ativo — convênio inativo some do seletor do orçamento, e as propostas antigas ficam
            como estão.
          </label>
        ) : null}
      </div>

      {/* Checkbox desmarcado nao e enviado; o campo escondido garante o "não". */}
      {convenio ? <input type="hidden" name="isActive" value="0" /> : null}

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando…" : convenio ? "Salvar" : "Cadastrar convênio"}
        </Button>
      </div>
    </form>
  );
}
