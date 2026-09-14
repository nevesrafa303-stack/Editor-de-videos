"use client";

import { useActionState, useState } from "react";
import { agendarAction } from "@/modules/scheduling/server-actions";
import { EMPTY_STATE } from "@/shared/action-state";
import { Button, Field, Input, Notice, Panel, Select, Textarea, FormError } from "@/ui";

type Opcao = { id: string; nome: string };
type Procedimento = Opcao & { duracao: number };

export function EncaixarForm({
  data,
  pacienteId,
  pacientes,
  profissionais,
  procedimentos,
}: {
  data: string;
  pacienteId: string;
  pacientes: Opcao[];
  profissionais: Opcao[];
  procedimentos: Procedimento[];
}) {
  const [state, action, pending] = useActionState(agendarAction, EMPTY_STATE);
  const [duracao, setDuracao] = useState(60);
  const erro = (campo: string) => state.fieldErrors?.[campo]?.[0];

  return (
    <form action={action} className="space-y-5">
      <FormError error={state.error} fieldErrors={state.fieldErrors} />

      <Panel className="grid gap-4 p-5 sm:grid-cols-2">
        <Field label="Paciente" className="sm:col-span-2" error={erro("patientId")}>
          <Select id="patientId" name="patientId" defaultValue={pacienteId} required>
            <option value="">Escolha o paciente</option>
            {pacientes.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Profissional" error={erro("providerId")}>
          <Select id="providerId" name="providerId" required>
            <option value="">Escolha</option>
            {profissionais.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Procedimento" error={erro("procedureId")} hint="Define a duração sugerida.">
          <Select
            id="procedureId"
            name="procedureId"
            onChange={(event) => {
              const escolhido = procedimentos.find((p) => p.id === event.target.value);
              if (escolhido) setDuracao(escolhido.duracao);
            }}
          >
            <option value="">Sem procedimento definido</option>
            {procedimentos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Dia" error={erro("date")}>
          <Input id="date" name="date" type="date" defaultValue={data} required />
        </Field>

        <Field label="Horário" error={erro("time")} hint="No fuso da unidade.">
          <Input id="time" name="time" type="time" step={300} required />
        </Field>

        <Field label="Duração (minutos)" error={erro("durationMinutes")}>
          <Input
            id="durationMinutes"
            name="durationMinutes"
            type="number"
            min={5}
            max={480}
            step={5}
            value={duracao}
            onChange={(event) => setDuracao(Number(event.target.value))}
            required
          />
        </Field>

        <Field label="Observações" className="sm:col-span-2">
          <Textarea id="notes" name="notes" rows={2} />
        </Field>
      </Panel>

      <div className="flex justify-end">
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? "Agendando…" : "Agendar"}
        </Button>
      </div>
    </form>
  );
}
