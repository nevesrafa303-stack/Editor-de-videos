"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import type { DenialRow } from "@/modules/claim";
import { recorrerAction } from "@/modules/claim/server-actions";
import { EMPTY_STATE } from "@/shared/action-state";
import { Badge, Button, Field, FormError, Input, Panel, PanelHead, Select, Textarea } from "@/ui";
import { formatBRL, formatDateOnly } from "@/shared/format";
import { GLOSA, prazo } from "../estado";

const DESFECHO = [
  { valor: "appealed", rotulo: "Recorri" },
  { valor: "recovered", rotulo: "O convênio pagou" },
  { valor: "written_off", rotulo: "Aceitar como perda" },
] as const;

/**
 * A fila de glosa, ordenada por PRAZO.
 *
 * Nao por valor, nem por data: o que se perde aqui e por tempo, e a glosa de
 * R$ 80,00 que vence amanha custa mais do que a de R$ 5.000,00 que vence em
 * trinta dias — porque a segunda ainda da para recuperar.
 */
export function Glosas({
  glosas,
  podeRecorrer,
  titulo = "Glosas",
}: {
  glosas: DenialRow[];
  podeRecorrer: boolean;
  titulo?: string;
}) {
  return (
    <Panel className="overflow-hidden">
      <PanelHead
        title={titulo}
        hint="Ordenadas pelo prazo de recurso, não pelo valor: aqui se perde por tempo."
      />

      <ul className="divide-y divide-line">
        {glosas.map((g) => (
          <Glosa key={g.id} glosa={g} podeRecorrer={podeRecorrer} />
        ))}
      </ul>
    </Panel>
  );
}

function Glosa({ glosa, podeRecorrer }: { glosa: DenialRow; podeRecorrer: boolean }) {
  const [state, action, pending] = useActionState(recorrerAction, EMPTY_STATE);
  const [desfecho, setDesfecho] = useState<string>("");

  const p = prazo(glosa.diasParaPrazo);
  const meta = GLOSA[glosa.status];
  const emAberto = glosa.amountCents - glosa.recoveredCents;
  const resolvida = glosa.status === "recovered" || glosa.status === "written_off";

  return (
    <li className="px-5 py-3.5">
      <div className="flex flex-wrap items-start gap-x-3 gap-y-1.5">
        <span className="min-w-0 flex-1">
          <Link
            href={`/faturamento/guias/${glosa.claimId}`}
            className="block truncate text-sm font-medium text-ink hover:text-structure"
          >
            {glosa.itemDescription}
          </Link>
          <span className="block truncate text-xs text-muted">
            #{glosa.claimNumber} · {glosa.patientName} · {glosa.payerName}
          </span>
          <span className="mt-0.5 block text-xs text-ink-soft">
            {glosa.reasonCode ? (
              <span className="num mr-1.5 text-muted">{glosa.reasonCode}</span>
            ) : null}
            {glosa.reason}
          </span>
        </span>

        <span className="flex shrink-0 items-center gap-2">
          <Badge tone={meta.tom}>{meta.rotulo}</Badge>
          {resolvida ? null : <Badge tone={p.tom}>{p.texto}</Badge>}
        </span>

        <span className="num w-24 shrink-0 text-right">
          <span className={emAberto > 0 ? "font-medium text-critical" : "text-muted"}>
            {formatBRL(emAberto)}
          </span>
          {glosa.recoveredCents > 0 ? (
            <span className="block text-xs whitespace-nowrap text-positive">
              +{formatBRL(glosa.recoveredCents)} de volta
            </span>
          ) : null}
          {glosa.appealDeadline && !resolvida ? (
            <span className="block text-xs text-muted">
              {formatDateOnly(glosa.appealDeadline)}
            </span>
          ) : null}
        </span>
      </div>

      {/* O que ja foi escrito sobre esta glosa. Pedir "o que foi enviado" e
          depois esconder a resposta transformaria o campo num buraco: quem
          volta em trinta dias precisa saber o que ja foi tentado. */}
      {glosa.appealNotes || glosa.resolutionNotes ? (
        <p className="mt-2 border-l-2 border-line pl-3 text-xs text-ink-soft">
          {glosa.resolutionNotes ?? glosa.appealNotes}
        </p>
      ) : null}

      {podeRecorrer && !resolvida ? (
        <form action={action} className="mt-3 space-y-2 rounded-md bg-sunken/50 p-3">
          <FormError error={state.error} fieldErrors={state.fieldErrors} />
          {state.success ? (
            <p className="text-sm font-medium text-positive">{state.success}</p>
          ) : null}

          <input type="hidden" name="denialId" value={glosa.id} />

          <div className="flex flex-wrap items-end gap-2">
            <Field label="Desfecho" className="min-w-40 flex-1">
              <Select
                name="status"
                value={desfecho}
                onChange={(e) => setDesfecho(e.currentTarget.value)}
              >
                <option value="">Escolha…</option>
                {DESFECHO.filter(
                  // Recorrer duas vezes nao e desfecho; depois de recorrida, o
                  // que falta e o convenio responder.
                  (d) => !(glosa.status === "appealed" && d.valor === "appealed"),
                ).map((d) => (
                  <option key={d.valor} value={d.valor}>
                    {d.rotulo}
                  </option>
                ))}
              </Select>
            </Field>

            {desfecho === "recovered" ? (
              <Field
                label="Quanto voltou (R$)"
                className="min-w-32"
                error={state.fieldErrors?.recoveredCents?.[0]}
              >
                <Input
                  name="recovered"
                  defaultValue={(emAberto / 100).toFixed(2).replace(".", ",")}
                  className="num"
                />
              </Field>
            ) : null}

            <Button
              type="submit"
              size="sm"
              variant="secondary"
              disabled={pending || desfecho === ""}
              className="mb-0.5"
            >
              {pending ? "Salvando…" : "Registrar"}
            </Button>
          </div>

          <Textarea
            name="notes"
            rows={2}
            placeholder="O que foi enviado, ou o que o convênio respondeu."
            aria-label="Observações do recurso"
          />
        </form>
      ) : null}
    </li>
  );
}
