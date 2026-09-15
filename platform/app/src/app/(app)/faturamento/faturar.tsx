"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import type { ClaimRow } from "@/modules/claim";
import { faturarAction } from "@/modules/claim/server-actions";
import { EMPTY_STATE } from "@/shared/action-state";
import { Button, FormError, Input, Notice } from "@/ui";
import { formatBRL, formatDateOnly } from "@/shared/format";

/**
 * A fila do faturamento.
 *
 * Marca-se o que vai no lote e pronto — o lote em si e escolhido pelo sistema,
 * por convenio e competencia. Pedir para a pessoa escolher o lote seria pedir
 * que ela soubesse quais existem, e o erro possivel (guia no lote do convenio
 * errado) e um que o convenio devolve inteiro.
 */
export function FaturarForm({
  guias,
  podeFaturar,
}: {
  guias: ClaimRow[];
  podeFaturar: boolean;
}) {
  const [state, action, pending] = useActionState(faturarAction, EMPTY_STATE);
  const [marcadas, setMarcadas] = useState<string[]>([]);

  const total = guias
    .filter((g) => marcadas.includes(g.id))
    .reduce((s, g) => s + g.billedCents, 0);

  const alternar = (id: string) =>
    setMarcadas((atual) =>
      atual.includes(id) ? atual.filter((x) => x !== id) : [...atual, id],
    );

  const convenios = new Set(guias.filter((g) => marcadas.includes(g.id)).map((g) => g.payerId));

  return (
    <form action={action}>
      <div className="px-5 pt-4">
        <FormError error={state.error} fieldErrors={state.fieldErrors} />
        {state.success ? (
          <p className="mb-2 text-sm font-medium text-positive">{state.success}</p>
        ) : null}
      </div>

      <ul className="divide-y divide-line">
        {guias.map((g) => (
          <li key={g.id}>
            <label className="flex cursor-pointer items-center gap-3 px-5 py-3 hover:bg-sunken/50">
              <input
                type="checkbox"
                name="claimIds"
                value={g.id}
                checked={marcadas.includes(g.id)}
                onChange={() => alternar(g.id)}
                disabled={!podeFaturar}
                className="size-4 rounded border-line"
              />
              <span className="min-w-0 flex-1">
                <Link
                  href={`/faturamento/guias/${g.id}`}
                  className="block truncate text-sm font-medium text-ink hover:text-structure"
                  onClick={(e) => e.stopPropagation()}
                >
                  {g.patientName}
                </Link>
                <span className="num block truncate text-xs text-muted">
                  #{g.number} · {g.payerName} · {formatDateOnly(g.issuedOn)} · {g.itemCount}{" "}
                  {g.itemCount === 1 ? "procedimento" : "procedimentos"}
                  {g.authorizationCode ? ` · senha ${g.authorizationCode}` : " · sem senha"}
                </span>
              </span>
              <span className="num text-sm font-medium text-ink">
                {formatBRL(g.billedCents)}
              </span>
            </label>
          </li>
        ))}
      </ul>

      {podeFaturar ? (
        <div className="space-y-3 border-t border-line bg-sunken/40 px-5 py-4">
          {convenios.size > 1 ? (
            <Notice tone="neutral">
              {convenios.size} convênios marcados: vão para {convenios.size} lotes separados.
              Convênio não recebe lote misturado.
            </Notice>
          ) : null}

          <div className="flex flex-wrap items-end justify-between gap-3">
            <label className="min-w-40">
              <span className="label">Competência</span>
              <Input
                type="month"
                name="competenceMonth"
                onChange={(e) => {
                  const campo = e.currentTarget.form?.elements.namedItem("competence");
                  if (campo instanceof HTMLInputElement) {
                    campo.value = e.currentTarget.value ? `${e.currentTarget.value}-01` : "";
                  }
                }}
              />
              <input type="hidden" name="competence" defaultValue="" />
            </label>

            <span className="flex items-center gap-3">
              <span className="num text-sm text-muted">
                {marcadas.length > 0 ? `${marcadas.length} · ${formatBRL(total)}` : "nada marcado"}
              </span>
              <Button type="submit" size="sm" disabled={pending || marcadas.length === 0}>
                {pending ? "Faturando…" : "Faturar no lote"}
              </Button>
            </span>
          </div>

          <p className="text-xs text-muted">
            Sem competência, vale o mês de hoje. O lote do convênio é criado na primeira guia.
          </p>
        </div>
      ) : null}
    </form>
  );
}
