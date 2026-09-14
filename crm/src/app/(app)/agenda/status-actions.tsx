"use client";

import { setAppointmentStatus } from "@/server/actions/appointments";
import { cn } from "@/components/ui";
import type { AppointmentStatus } from "@/generated/prisma/enums";

const NEXT_ACTIONS: Record<AppointmentStatus, { status: AppointmentStatus; label: string }[]> = {
  AGENDADO: [
    { status: "CONFIRMADO", label: "Confirmar" },
    { status: "ATENDIDO", label: "Atendido" },
    { status: "FALTOU", label: "Faltou" },
    { status: "CANCELADO", label: "Cancelar" },
  ],
  CONFIRMADO: [
    { status: "ATENDIDO", label: "Atendido" },
    { status: "FALTOU", label: "Faltou" },
    { status: "CANCELADO", label: "Cancelar" },
  ],
  ATENDIDO: [{ status: "AGENDADO", label: "Reabrir" }],
  FALTOU: [{ status: "AGENDADO", label: "Reabrir" }],
  CANCELADO: [{ status: "AGENDADO", label: "Reabrir" }],
};

export function StatusActions({
  id,
  status,
  className,
}: {
  id: string;
  status: AppointmentStatus;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap gap-1", className)}>
      {NEXT_ACTIONS[status].map((action) => (
        <form key={action.status} action={setAppointmentStatus}>
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="status" value={action.status} />
          <button
            type="submit"
            className="rounded border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
          >
            {action.label}
          </button>
        </form>
      ))}
    </div>
  );
}
