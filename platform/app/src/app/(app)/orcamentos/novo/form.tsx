"use client";

import { useActionState, useState } from "react";
import { criarOrcamentoAction } from "@/modules/quote/server-actions";
import { EMPTY_STATE } from "@/shared/action-state";
import { Button, Field, FormError, Input, Notice, Panel, Select } from "@/ui";
import { formatBRL } from "@/shared/format";
import type { BillingMode } from "@/modules/payer";
import { MODO } from "../../convenios/modo";

type Planejado = { id: string; descricao: string; local: string; precoCents: number };
type Convenio = { id: string; name: string; billingMode: BillingMode };

export function NovoOrcamentoForm({
  patientId,
  patientName,
  planejados,
  convenios,
}: {
  patientId: string;
  patientName: string;
  planejados: Planejado[];
  convenios: Convenio[];
}) {
  const [state, action, pending] = useActionState(criarOrcamentoAction, EMPTY_STATE);
  const [payerId, setPayerId] = useState("");

  const escolhido = convenios.find((c) => c.id === payerId) ?? null;

  return (
    <form action={action} className="space-y-5">
      <FormError error={state.error} fieldErrors={state.fieldErrors} />

      <input type="hidden" name="patientId" value={patientId} />

      <Panel className="grid gap-4 p-5 sm:grid-cols-[minmax(0,2fr)_140px]">
        <Field label="Título" hint="Como o paciente vai reconhecer esta proposta.">
          <Input
            id="title"
            name="title"
            autoFocus
            defaultValue={`Tratamento de ${patientName.split(" ")[0]}`}
          />
        </Field>
        <Field label="Validade (dias)" hint="Depois disso, vence.">
          <Input id="validDays" name="validDays" type="number" min={1} max={365} defaultValue={15} />
        </Field>

        {convenios.length > 0 ? (
          <Field
            label="Quem paga"
            className="sm:col-span-2"
            hint="Escolha antes de trazer os itens: é o convênio que decide o preço de cada um."
          >
            <Select
              id="payerId"
              name="payerId"
              value={payerId}
              onChange={(e) => setPayerId(e.currentTarget.value)}
            >
              <option value="">Particular</option>
              {convenios.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} · {MODO[c.billingMode].rotulo}
                </option>
              ))}
            </Select>
          </Field>
        ) : null}

        {escolhido && escolhido.billingMode === "invoiced" ? (
          <div className="sm:col-span-2">
            <Notice tone="warning">{MODO.invoiced.explica}</Notice>
          </div>
        ) : null}
      </Panel>

      <Panel className="overflow-hidden">
        <header className="border-b border-line px-5 py-3.5">
          <h2 className="text-sm font-semibold text-ink">Trazer do plano de tratamento</h2>
          <p className="mt-0.5 text-xs text-muted">
            Item trazido some desta lista: o mesmo procedimento não entra em dois orçamentos.
          </p>
        </header>

        {planejados.length === 0 ? (
          <p className="px-5 py-6 text-sm text-muted">
            Nenhum item planejado em aberto. Você pode criar o orçamento vazio e adicionar itens
            avulsos depois.
          </p>
        ) : (
          <ul className="divide-y divide-line">
            {planejados.map((item) => (
              <li key={item.id}>
                <label className="flex cursor-pointer items-center gap-3 px-5 py-3 hover:bg-sunken/50">
                  <input
                    type="checkbox"
                    name="planItemIds"
                    value={item.id}
                    defaultChecked
                    className="size-4 rounded border-line text-structure focus:ring-structure"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-ink">{item.descricao}</span>
                    {item.local ? (
                      <span className="block text-xs text-muted">{item.local}</span>
                    ) : null}
                  </span>
                  <span className="num text-sm text-ink-soft">{formatBRL(item.precoCents)}</span>
                </label>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <div className="flex justify-end">
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? "Criando…" : "Criar orçamento"}
        </Button>
      </div>
    </form>
  );
}
