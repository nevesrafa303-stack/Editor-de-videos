"use client";

import { useActionState } from "react";
import type { ClaimRow } from "@/modules/claim";
import { autorizarAction } from "@/modules/claim/server-actions";
import { EMPTY_STATE } from "@/shared/action-state";
import { Button, Field, FormError, Input, Notice, Panel, PanelHead } from "@/ui";

/**
 * A senha do convenio, anotada a mao.
 *
 * Nao existe fluxo de pedir autorizacao aqui — isso depende do portal do
 * convenio, e e outra fatia. O que existe e o LUGAR de guardar o numero: sem
 * ele, a auditoria do convenio glosa o que ja foi pago, e a clinica devolve
 * dinheiro meses depois, com o insumo ja gasto.
 */
export function Autorizacao({ claim, editavel }: { claim: ClaimRow; editavel: boolean }) {
  const [state, action, pending] = useActionState(autorizarAction, EMPTY_STATE);

  return (
    <Panel className="overflow-hidden">
      <PanelHead
        title="Autorização"
        hint="O número da senha, como veio do convênio."
      />

      {!editavel ? (
        <div className="px-5 py-4">
          {claim.authorizationCode ? (
            <p className="num text-sm font-medium text-ink">{claim.authorizationCode}</p>
          ) : (
            <Notice tone="warning">
              Esta guia foi faturada sem senha. Se o convênio exigir na auditoria, o valor volta.
            </Notice>
          )}
        </div>
      ) : (
        <form action={action} className="space-y-3 px-5 py-4">
          <FormError error={state.error} fieldErrors={state.fieldErrors} />
          {state.success ? (
            <p className="text-sm font-medium text-positive">{state.success}</p>
          ) : null}

          <input type="hidden" name="claimId" value={claim.id} />

          <Field label="Número">
            <Input
              name="code"
              defaultValue={claim.authorizationCode ?? ""}
              placeholder="Como veio do convênio"
              className="num"
            />
          </Field>

          <Field label="Válida até">
            <Input type="date" name="validUntil" />
          </Field>

          <div className="flex justify-end">
            <Button type="submit" size="sm" variant="secondary" disabled={pending}>
              {pending ? "Salvando…" : "Salvar"}
            </Button>
          </div>
        </form>
      )}
    </Panel>
  );
}
