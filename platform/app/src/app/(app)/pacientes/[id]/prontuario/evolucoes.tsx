"use client";

import { useActionState, useState } from "react";
import type { ChartNote } from "@/modules/chart";
import { aditarEvolucaoAction, novaEvolucaoAction } from "@/modules/chart/server-actions";
import { EMPTY_STATE } from "@/shared/action-state";
import { Badge, Button, Empty, Field, Notice, Textarea, FormError } from "@/ui";
import { formatDateTime } from "@/shared/format";

export function NovaEvolucao({ patientId }: { patientId: string }) {
  const [state, action, pending] = useActionState(novaEvolucaoAction, EMPTY_STATE);

  return (
    <form action={action} className="border-b border-line px-5 py-4">
      <FormError error={state.error} fieldErrors={state.fieldErrors} />
      {state.success ? (
        <p className="mb-3 text-sm font-medium text-positive">{state.success}</p>
      ) : null}

      <input type="hidden" name="patientId" value={patientId} />

      <Field
        label="Nova evolução"
        error={state.fieldErrors?.content?.[0]}
        hint="Assinada com seu nome e a hora. Depois de fechada, só é corrigida por aditamento."
      >
        <Textarea
          id="content"
          name="content"
          rows={4}
          required
          placeholder="O que foi observado, o que foi feito, o que foi orientado."
        />
      </Field>

      <div className="mt-3 flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "Registrando…" : "Registrar evolução"}
        </Button>
      </div>
    </form>
  );
}

export function Evolucoes({
  patientId,
  notes,
  podeAditar,
  fuso,
}: {
  patientId: string;
  notes: ChartNote[];
  podeAditar: boolean;
  fuso: string;
}) {
  if (notes.length === 0) {
    return (
      <Empty
        title="Nenhuma evolução registrada"
        hint="O primeiro atendimento registrado aparece aqui."
      />
    );
  }

  return (
    <ul className="divide-y divide-line">
      {notes.map((nota) => (
        <Nota
          key={nota.id}
          patientId={patientId}
          nota={nota}
          podeAditar={podeAditar}
          fuso={fuso}
        />
      ))}
    </ul>
  );
}

function Nota({
  patientId,
  nota,
  podeAditar,
  fuso,
}: {
  patientId: string;
  nota: ChartNote;
  podeAditar: boolean;
  fuso: string;
}) {
  const [state, action, pending] = useActionState(aditarEvolucaoAction, EMPTY_STATE);
  const [corrigindo, setCorrigindo] = useState(false);

  return (
    <li className="px-5 py-4">
      <div className="mb-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="num text-sm text-ink-soft">{formatDateTime(nota.createdAt, fuso)}</span>
        <span className="text-sm font-medium text-ink">{nota.provider}</span>
        {nota.signedAt ? <Badge tone="positive">assinada</Badge> : null}
        {nota.lockedAt ? <Badge tone="neutral">fechada</Badge> : null}
        {nota.amendments.length > 0 ? (
          <Badge tone="warning">
            {nota.amendments.length === 1 ? "1 aditamento" : `${nota.amendments.length} aditamentos`}
          </Badge>
        ) : null}
      </div>

      <p className="text-sm whitespace-pre-wrap text-ink-soft">{nota.content}</p>

      {nota.amendments.map((a) => (
        <div key={a.id} className="mt-3 border-l-2 border-warning/40 pl-3">
          <p className="mb-1 text-xs text-muted">
            <span className="num">{formatDateTime(a.createdAt, fuso)}</span> · {a.provider} ·{" "}
            <span className="text-warning">Aditamento: {a.reason}</span>
          </p>
          <p className="text-sm whitespace-pre-wrap text-ink-soft">{a.content}</p>
        </div>
      ))}

      {podeAditar ? (
        <div className="mt-3">
          {!corrigindo ? (
            <button
              type="button"
              onClick={() => setCorrigindo(true)}
              className="text-xs text-muted underline-offset-2 hover:text-ink hover:underline"
            >
              Corrigir por aditamento
            </button>
          ) : (
            <form action={action} className="space-y-2 rounded-md border border-line bg-sunken/40 p-3">
              <FormError error={state.error} fieldErrors={state.fieldErrors} />
              {state.success ? (
                <p className="text-sm font-medium text-positive">{state.success}</p>
              ) : null}

              <input type="hidden" name="patientId" value={patientId} />
              <input type="hidden" name="noteId" value={nota.id} />

              <Field label="Motivo da correção" error={state.fieldErrors?.reason?.[0]}>
                <input
                  name="reason"
                  required
                  placeholder="Ex.: dente anotado errado"
                  className="h-9 w-full rounded-md border border-line bg-surface px-3 text-sm text-ink shadow-xs focus:border-structure focus:ring-2 focus:ring-structure/20 focus:outline-none"
                />
              </Field>

              <Field label="Texto do aditamento" error={state.fieldErrors?.content?.[0]}>
                <Textarea name="content" rows={3} required />
              </Field>

              <p className="text-xs text-muted">
                A evolução original não é alterada nem apagada: ela fica fechada, e o aditamento
                aparece ao lado dela.
              </p>

              <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={pending}>
                  {pending ? "Registrando…" : "Registrar aditamento"}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => setCorrigindo(false)}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          )}
        </div>
      ) : null}
    </li>
  );
}
