"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { mudarStatusAction } from "@/modules/scheduling/server-actions";
import { EMPTY_STATE } from "@/shared/action-state";
import type { AgendaAppointment } from "@/modules/scheduling";
import { Badge, Button, Input, Notice, cn } from "@/ui";
import { formatPhone } from "@/shared/format";
import { STATUS, hhmm } from "./grade";

type Acao = { to: string; rotulo: string; principal?: boolean; pedeMotivo?: boolean };

/**
 * O que a recepcao pode fazer a seguir.
 *
 * Espelha `state_transition`, mas nao e a autoridade: quem recusa transicao
 * invalida e o trigger no banco. Aqui a lista existe so para nao oferecer um
 * botao que vai dar erro.
 */
const PROXIMAS: Record<string, Acao[]> = {
  scheduled: [
    { to: "confirmed", rotulo: "Confirmar", principal: true },
    { to: "arrived", rotulo: "Chegou" },
    { to: "no_show", rotulo: "Faltou" },
    { to: "canceled", rotulo: "Cancelar", pedeMotivo: true },
  ],
  confirmed: [
    { to: "arrived", rotulo: "Chegou", principal: true },
    { to: "no_show", rotulo: "Faltou" },
    { to: "canceled", rotulo: "Cancelar", pedeMotivo: true },
  ],
  arrived: [
    { to: "in_progress", rotulo: "Iniciar", principal: true },
    { to: "canceled", rotulo: "Cancelar", pedeMotivo: true },
  ],
  in_progress: [{ to: "completed", rotulo: "Concluir", principal: true }],
  no_show: [{ to: "scheduled", rotulo: "Reabrir" }],
  canceled: [{ to: "scheduled", rotulo: "Reabrir" }],
  completed: [],
};

export function Fila({ appointments }: { appointments: AgendaAppointment[] }) {
  if (appointments.length === 0) {
    return (
      <p className="px-5 py-8 text-center text-sm text-muted">
        Nenhum atendimento neste dia.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-line">
      {appointments.map((a) => (
        <Linha key={a.id} appointment={a} />
      ))}
    </ul>
  );
}

function Linha({ appointment: a }: { appointment: AgendaAppointment }) {
  const [state, action, pending] = useActionState(mudarStatusAction, EMPTY_STATE);
  const [pedindoMotivo, setPedindoMotivo] = useState(false);

  const meta = STATUS[a.status] ?? STATUS.scheduled;
  const acoes = PROXIMAS[a.status] ?? [];

  return (
    <li className={cn("px-5 py-3", a.status === "canceled" && "opacity-70")}>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <span className="num w-24 shrink-0 text-sm text-ink-soft">
          {hhmm(a.startMinute)}–{hhmm(a.endMinute)}
        </span>

        <span className="min-w-40 flex-1">
          <Link
            href={`/pacientes/${a.patientId}`}
            className="text-sm font-medium text-ink hover:text-structure"
          >
            {a.patientName}
          </Link>
          <span className="num block text-xs text-muted">
            {formatPhone(a.patientPhone)}
            {a.procedure ? ` · ${a.procedure}` : ""}
          </span>
        </span>

        <Badge tone={meta?.tom ?? "neutral"}>{meta?.rotulo ?? a.status}</Badge>

        <form action={action} className="flex flex-wrap items-center gap-1.5">
          <input type="hidden" name="appointmentId" value={a.id} />

          {acoes.map((acao) => (
            <Button
              key={acao.to}
              type={acao.pedeMotivo ? "button" : "submit"}
              name={acao.pedeMotivo ? undefined : "to"}
              value={acao.pedeMotivo ? undefined : acao.to}
              size="sm"
              variant={acao.principal ? "primary" : "secondary"}
              disabled={pending}
              onClick={acao.pedeMotivo ? () => setPedindoMotivo(true) : undefined}
            >
              {acao.rotulo}
            </Button>
          ))}

          {pedindoMotivo ? (
            <span className="flex items-center gap-1.5">
              <Input
                name="reason"
                required
                autoFocus
                placeholder="Motivo do cancelamento"
                className="h-8 w-56 text-xs"
              />
              <Button type="submit" name="to" value="canceled" size="sm" disabled={pending}>
                Confirmar
              </Button>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => setPedindoMotivo(false)}
              >
                Voltar
              </Button>
            </span>
          ) : null}
        </form>
      </div>

      {a.notes ? <p className="mt-1.5 pl-28 text-xs text-muted">{a.notes}</p> : null}

      {state.error ? (
        <div className="mt-2 pl-28">
          <Notice>{state.error}</Notice>
        </div>
      ) : null}
      {state.success ? (
        <p className="mt-1.5 pl-28 text-xs font-medium text-positive">{state.success}</p>
      ) : null}
    </li>
  );
}
