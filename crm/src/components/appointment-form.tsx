"use client";

import { useActionState, useState } from "react";
import { createAppointment } from "@/server/actions/appointments";
import { PatientPicker } from "@/components/patient-picker";
import { Alert, Button, Field, Input, Select, Textarea } from "@/components/ui";

export type PickerOption = { id: string; name: string; durationMin?: number };

export function AppointmentForm({
  professionals,
  rooms,
  procedures,
  defaultStartsAt,
  defaultProfessionalId,
  patient,
}: {
  professionals: PickerOption[];
  rooms: PickerOption[];
  procedures: PickerOption[];
  defaultStartsAt: string;
  defaultProfessionalId?: string;
  patient?: { id: string; name: string };
}) {
  const [state, formAction, pending] = useActionState(createAppointment, {});
  const [duration, setDuration] = useState(30);

  return (
    <form action={formAction} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {state.error ? (
        <div className="sm:col-span-2 lg:col-span-3">
          <Alert>{state.error}</Alert>
        </div>
      ) : null}
      {state.success ? (
        <div className="sm:col-span-2 lg:col-span-3">
          <Alert tone="success">{state.success}</Alert>
        </div>
      ) : null}

      <Field label="Paciente" className="sm:col-span-2 lg:col-span-1">
        <PatientPicker initial={patient} required />
      </Field>

      <Field label="Profissional">
        <Select name="professionalId" required defaultValue={defaultProfessionalId ?? ""}>
          <option value="">Selecione</option>
          {professionals.map((professional) => (
            <option key={professional.id} value={professional.id}>
              {professional.name}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Procedimento">
        <Select
          name="procedureId"
          defaultValue=""
          onChange={(event) => {
            const procedure = procedures.find((item) => item.id === event.target.value);
            if (procedure?.durationMin) setDuration(procedure.durationMin);
          }}
        >
          <option value="">Não definido</option>
          {procedures.map((procedure) => (
            <option key={procedure.id} value={procedure.id}>
              {procedure.name}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Inicio">
        <Input name="startsAt" type="datetime-local" required defaultValue={defaultStartsAt} />
      </Field>

      <Field label="Duração (min)">
        <Input
          name="durationMin"
          type="number"
          min={5}
          max={480}
          step={5}
          required
          value={duration}
          onChange={(event) => setDuration(Number(event.target.value))}
        />
      </Field>

      <Field label="Sala">
        <Select name="roomId" defaultValue="">
          <option value="">Sem sala definida</option>
          {rooms.map((room) => (
            <option key={room.id} value={room.id}>
              {room.name}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Observação" className="sm:col-span-2">
        <Textarea name="notes" rows={2} placeholder="Ex.: paciente ansioso, confirmar na véspera" />
      </Field>

      <div className="flex items-end">
        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {pending ? "Agendando..." : "Agendar"}
        </Button>
      </div>
    </form>
  );
}
