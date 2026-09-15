"use client";

import { useActionState } from "react";
import { cadastrarContatoAction } from "@/modules/funnel/server-actions";
import { EMPTY_STATE } from "@/shared/action-state";
import { Button, Field, FormError, Input, Panel, Select, Textarea } from "@/ui";

/**
 * Lead e negocio no mesmo formulario.
 *
 * Quem preenche isto esta com uma pessoa do outro lado do telefone. Pedir dois
 * cadastros seguidos e o jeito de metade dos contatos ficar pela metade — e um
 * contato pela metade e um paciente que a clinica nunca teve.
 */
export function NovoContatoForm({ origens }: { origens: { id: string; name: string }[] }) {
  const [state, action, pending] = useActionState(cadastrarContatoAction, EMPTY_STATE);
  const erro = (campo: string) => state.fieldErrors?.[campo]?.[0];

  return (
    <form action={action} className="space-y-5">
      <FormError error={state.error} fieldErrors={state.fieldErrors} />

      <Panel className="grid gap-4 p-5 sm:grid-cols-2">
        <Field label="Nome" className="sm:col-span-2" error={erro("fullName")}>
          <Input name="fullName" required autoFocus />
        </Field>

        <Field label="Telefone" error={erro("phone")} hint="É como se volta a falar com a pessoa.">
          <Input name="phone" required placeholder="(11) 98765-4321" />
        </Field>

        <Field label="E-mail" error={erro("email")}>
          <Input name="email" type="email" />
        </Field>

        <Field label="Como chegou" hint="Alimenta o relatório de captação.">
          <Select name="sourceId" defaultValue="">
            <option value="">Não informado</option>
            {origens.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </Select>
        </Field>

        <Field
          label="Valor estimado (R$)"
          error={erro("amountCents")}
          hint="Um chute serve. Vira o valor do orçamento quando existir um."
        >
          <Input name="amount" placeholder="0,00" className="num" />
        </Field>

        <Field
          label="O que a pessoa quer"
          className="sm:col-span-2"
          hint="Vira o nome do negócio no quadro."
        >
          <Textarea name="interest" rows={2} placeholder="Clareamento e faceta" />
        </Field>
      </Panel>

      <div className="flex justify-end">
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? "Cadastrando…" : "Cadastrar contato"}
        </Button>
      </div>
    </form>
  );
}
