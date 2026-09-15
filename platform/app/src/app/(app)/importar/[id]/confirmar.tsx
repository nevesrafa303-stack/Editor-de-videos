"use client";

import { useActionState } from "react";
import type { ImportJobRow } from "@/modules/import";
import { aplicarAction, descartarAction } from "@/modules/import/server-actions";
import { EMPTY_STATE } from "@/shared/action-state";
import { Button, Notice, Panel } from "@/ui";

/**
 * O segundo passo.
 *
 * O botao diz o NUMERO que vai entrar, nao "Importar": importacao nao tem
 * desfazer, e a ultima coisa que a pessoa le antes de clicar precisa ser o
 * tamanho do que vai acontecer.
 */
export function Confirmar({ job }: { job: ImportJobRow }) {
  const [aplicacao, aplicar, aplicando] = useActionState(aplicarAction, EMPTY_STATE);
  const [descarte, descartar, descartando] = useActionState(descartarAction, EMPTY_STATE);

  return (
    <Panel className="mb-4 p-5">
      {aplicacao.error ? (
        <div className="mb-3">
          <Notice>{aplicacao.error}</Notice>
        </div>
      ) : null}
      {descarte.error ? (
        <div className="mb-3">
          <Notice>{descarte.error}</Notice>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="min-w-0">
          <span className="block text-sm font-medium text-ink">
            Nada foi criado ainda
          </span>
          <span className="block text-xs text-muted">
            Confirmar cria os cadastros. Não há como desfazer depois.
          </span>
        </span>

        <span className="flex gap-2">
          <form action={descartar}>
            <input type="hidden" name="jobId" value={job.id} />
            <Button type="submit" variant="secondary" disabled={descartando}>
              {descartando ? "Descartando…" : "Descartar"}
            </Button>
          </form>

          <form action={aplicar}>
            <input type="hidden" name="jobId" value={job.id} />
            <Button type="submit" disabled={aplicando || job.validas === 0}>
              {aplicando
                ? "Importando…"
                : job.validas === 0
                  ? "Nada para importar"
                  : `Importar ${job.validas} ${job.validas === 1 ? "paciente" : "pacientes"}`}
            </Button>
          </form>
        </span>
      </div>
    </Panel>
  );
}
