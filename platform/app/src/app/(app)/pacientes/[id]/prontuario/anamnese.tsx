"use client";

import { useActionState, useState } from "react";
import type { PatientChart } from "@/modules/chart";
import { salvarAnamneseAction } from "@/modules/chart/server-actions";
import { EMPTY_STATE } from "@/shared/action-state";
import { Button, Field, Input, Notice, Textarea, FormError } from "@/ui";
import { formatDateTime } from "@/shared/format";

type Anamnese = NonNullable<PatientChart["anamnesis"]>;

export function Anamnese({
  patientId,
  anamnesis,
  podeEscrever,
  fuso,
}: {
  patientId: string;
  anamnesis: Anamnese;
  podeEscrever: boolean;
  fuso: string;
}) {
  const [state, action, pending] = useActionState(salvarAnamneseAction, EMPTY_STATE);
  const [editando, setEditando] = useState(anamnesis.responseId === null);

  if (!editando) {
    return (
      <div className="px-5 py-4">
        <dl className="grid gap-x-6 gap-y-2.5 sm:grid-cols-2">
          {anamnesis.fields.map((campo) => {
            const valor = anamnesis.answers[campo.key];
            const texto =
              typeof valor === "boolean" ? (valor ? "Sim" : "Não") : (valor ?? "").toString().trim();

            return (
              <div key={campo.key} className={campo.type === "textarea" ? "sm:col-span-2" : ""}>
                <dt className="text-xs text-muted">{campo.label}</dt>
                <dd
                  className={
                    valor === true && campo.alert_if
                      ? "text-sm font-semibold text-critical"
                      : "text-sm text-ink-soft"
                  }
                >
                  {texto.length > 0 ? texto : "—"}
                </dd>
              </div>
            );
          })}
        </dl>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-muted">
            {anamnesis.filledAt
              ? `Respondida em ${formatDateTime(anamnesis.filledAt, fuso)}${anamnesis.filledBy ? ` por ${anamnesis.filledBy}` : ""}.`
              : "Ainda não respondida."}
          </p>
          {podeEscrever ? (
            <Button type="button" size="sm" variant="secondary" onClick={() => setEditando(true)}>
              Atualizar anamnese
            </Button>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <form action={action} className="px-5 py-4">
      <FormError error={state.error} fieldErrors={state.fieldErrors} />
      {state.success ? (
        <p className="mb-3 text-sm font-medium text-positive">{state.success}</p>
      ) : null}

      <input type="hidden" name="patientId" value={patientId} />
      <input type="hidden" name="templateId" value={anamnesis.templateId} />
      <input type="hidden" name="campos" value={anamnesis.fields.map((f) => f.key).join(",")} />

      <p className="mb-4 text-xs text-muted">
        Cada resposta vira uma versão nova. A anterior continua no histórico — anamnese não se
        sobrescreve.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        {anamnesis.fields.map((campo) => {
          const valor = anamnesis.answers[campo.key];
          const erro = state.fieldErrors?.[campo.key]?.[0];

          if (campo.type === "boolean") {
            return (
              <Field key={campo.key} label={campo.label} error={erro}>
                <input type="hidden" name={`tipo:${campo.key}`} value="boolean" />
                <select
                  id={campo.key}
                  name={campo.key}
                  defaultValue={valor === true ? "sim" : valor === false ? "nao" : ""}
                  required={campo.required ?? false}
                  className="h-9 w-full rounded-md border border-line bg-surface px-3 text-sm text-ink shadow-xs focus:border-structure focus:ring-2 focus:ring-structure/20 focus:outline-none"
                >
                  <option value="">Não informado</option>
                  <option value="sim">Sim</option>
                  <option value="nao">Não</option>
                </select>
              </Field>
            );
          }

          return (
            <Field
              key={campo.key}
              label={campo.label}
              error={erro}
              className={campo.type === "textarea" ? "sm:col-span-2" : ""}
            >
              <input type="hidden" name={`tipo:${campo.key}`} value={campo.type} />
              {campo.type === "textarea" ? (
                <Textarea
                  id={campo.key}
                  name={campo.key}
                  rows={2}
                  defaultValue={typeof valor === "string" ? valor : ""}
                />
              ) : (
                <Input
                  id={campo.key}
                  name={campo.key}
                  defaultValue={typeof valor === "string" ? valor : ""}
                />
              )}
            </Field>
          );
        })}
      </div>

      <div className="mt-4 flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando…" : "Salvar anamnese"}
        </Button>
        {anamnesis.responseId ? (
          <Button type="button" variant="secondary" onClick={() => setEditando(false)}>
            Cancelar
          </Button>
        ) : null}
      </div>
    </form>
  );
}
