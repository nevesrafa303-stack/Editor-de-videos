"use client";

import { useActionState } from "react";
import { addAttachment, addClinicalNote, saveAnamnesis } from "@/server/actions/clinical";
import { ANAMNESIS_QUESTIONS } from "@/domain/anamnesis";
import { Alert, Button, Field, Input, Select, Textarea } from "@/components/ui";

export function AnamnesisForm({
  patientId,
  answers,
  allergies,
  medications,
  conditions,
}: {
  patientId: string;
  answers: Record<string, boolean>;
  allergies: string | null;
  medications: string | null;
  conditions: string | null;
}) {
  const [state, formAction, pending] = useActionState(saveAnamnesis, {});

  return (
    <form action={formAction} className="space-y-4 p-5">
      {state.error ? <Alert>{state.error}</Alert> : null}
      {state.success ? <Alert tone="success">{state.success}</Alert> : null}
      <input type="hidden" name="patientId" value={patientId} />

      <div className="grid gap-2 sm:grid-cols-2">
        {ANAMNESIS_QUESTIONS.map((question) => (
          <label
            key={question.key}
            className="flex items-start gap-2.5 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700"
          >
            <input
              type="checkbox"
              name={`q_${question.key}`}
              defaultChecked={answers[question.key] ?? false}
              className="mt-0.5 size-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            />
            {question.label}
          </label>
        ))}
      </div>

      <Field label="Alergias" hint="Aparece em destaque no topo do prontuário.">
        <Textarea name="allergies" rows={2} defaultValue={allergies ?? ""} />
      </Field>

      <Field label="Medicamentos em uso">
        <Textarea name="medications" rows={2} defaultValue={medications ?? ""} />
      </Field>

      <Field label="Condicoes e observações de saúde">
        <Textarea name="conditions" rows={2} defaultValue={conditions ?? ""} />
      </Field>

      <Button type="submit" disabled={pending}>
        {pending ? "Salvando..." : "Salvar anamnese"}
      </Button>
    </form>
  );
}

export function ClinicalNoteForm({ patientId }: { patientId: string }) {
  const [state, formAction, pending] = useActionState(addClinicalNote, {});

  return (
    <form action={formAction} className="space-y-3 p-5">
      {state.error ? <Alert>{state.error}</Alert> : null}
      {state.success ? <Alert tone="success">{state.success}</Alert> : null}
      <input type="hidden" name="patientId" value={patientId} />

      <Field label="Evolução do atendimento">
        <Textarea
          name="content"
          rows={4}
          required
          placeholder="Queixa, exame, conduta e orientações dadas ao paciente."
        />
      </Field>

      <Field label="Procedimentos realizados na sessão">
        <Input name="performed" placeholder="Restauração 16 (O), profilaxia" />
      </Field>

      <Button type="submit" disabled={pending}>
        {pending ? "Registrando..." : "Registrar evolução"}
      </Button>
    </form>
  );
}

export function AttachmentForm({ patientId }: { patientId: string }) {
  const [state, formAction, pending] = useActionState(addAttachment, {});

  return (
    <form action={formAction} className="grid gap-3 p-5 sm:grid-cols-4">
      {state.error ? (
        <div className="sm:col-span-4">
          <Alert>{state.error}</Alert>
        </div>
      ) : null}
      {state.success ? (
        <div className="sm:col-span-4">
          <Alert tone="success">{state.success}</Alert>
        </div>
      ) : null}
      <input type="hidden" name="patientId" value={patientId} />

      <Field label="Tipo">
        <Select name="kind" defaultValue="FOTO_ANTES">
          <option value="FOTO_ANTES">Foto antes</option>
          <option value="FOTO_DEPOIS">Foto depois</option>
          <option value="RADIOGRAFIA">Radiografia</option>
          <option value="DOCUMENTO">Documento</option>
          <option value="TERMO">Termo assinado</option>
        </Select>
      </Field>

      <Field label="Endereço do arquivo" className="sm:col-span-2">
        <Input name="url" placeholder="https://..." required />
      </Field>

      <Field label="Legenda" className="sm:col-span-3">
        <Input name="caption" placeholder="Ex.: pre-operatorio, vista frontal" />
      </Field>

      <div className="flex items-end">
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "..." : "Anexar"}
        </Button>
      </div>
    </form>
  );
}
