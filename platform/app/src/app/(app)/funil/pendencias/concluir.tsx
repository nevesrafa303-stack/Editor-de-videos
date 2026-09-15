"use client";

import { useActionState } from "react";
import { concluirTarefaAction } from "@/modules/funnel/server-actions";
import { EMPTY_STATE } from "@/shared/action-state";

export function ConcluirTarefa({ taskId }: { taskId: string }) {
  const [, action, pending] = useActionState(concluirTarefaAction, EMPTY_STATE);

  return (
    <form action={action}>
      <input type="hidden" name="taskId" value={taskId} />
      <input type="hidden" name="de" value="pendencias" />
      <button
        type="submit"
        disabled={pending}
        className="rounded-md border border-line bg-surface px-2.5 py-1 text-xs font-medium text-ink-soft transition hover:border-positive hover:text-positive disabled:opacity-50"
      >
        {pending ? "…" : "Concluir"}
      </button>
    </form>
  );
}
