"use client";

import { useActionState } from "react";
import { addLeadActivity, markLeadLost, updateLead } from "@/server/actions/leads";
import { SOURCE_LABEL } from "@/domain/funnel";
import { Alert, Button, Field, Input, Select, Textarea } from "@/components/ui";
import { centsToInput } from "@/lib/money";

export function ActivityForm({ leadId }: { leadId: string }) {
  const [state, formAction, pending] = useActionState(addLeadActivity, {});

  return (
    <form action={formAction} className="space-y-3 p-5">
      {state.error ? <Alert>{state.error}</Alert> : null}
      {state.success ? <Alert tone="success">{state.success}</Alert> : null}
      <input type="hidden" name="leadId" value={leadId} />

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Tipo de contato">
          <Select name="type" defaultValue="WHATSAPP">
            <option value="WHATSAPP">WhatsApp</option>
            <option value="LIGACAO">Ligação</option>
            <option value="EMAIL">E-mail</option>
            <option value="REUNIAO">Reunião / visita</option>
            <option value="NOTA">Nota interna</option>
          </Select>
        </Field>

        <Field label="Próximo contato">
          <Input name="nextFollowUpAt" type="date" />
        </Field>
      </div>

      <Field label="O que aconteceu">
        <Textarea
          name="content"
          rows={3}
          required
          placeholder="Respondeu que vai pensar; pediu para retornar depois do dia 20."
        />
      </Field>

      <Button type="submit" disabled={pending}>
        {pending ? "Registrando..." : "Registrar contato"}
      </Button>
    </form>
  );
}

export type LeadEditValues = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  source: string;
  interest: string | null;
  valueCents: number;
  ownerId: string | null;
  nextFollowUpAt: string | null;
};

export function LeadEditForm({
  lead,
  owners,
}: {
  lead: LeadEditValues;
  owners: { id: string; name: string }[];
}) {
  const [state, formAction, pending] = useActionState(updateLead, {});

  return (
    <form action={formAction} className="space-y-3 p-5">
      {state.error ? <Alert>{state.error}</Alert> : null}
      {state.success ? <Alert tone="success">{state.success}</Alert> : null}
      <input type="hidden" name="id" value={lead.id} />

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Nome">
          <Input name="name" defaultValue={lead.name} required />
        </Field>
        <Field label="WhatsApp">
          <Input name="phone" defaultValue={lead.phone} required />
        </Field>
        <Field label="E-mail">
          <Input name="email" type="email" defaultValue={lead.email ?? ""} />
        </Field>
        <Field label="Origem">
          <Select name="source" defaultValue={lead.source}>
            {Object.entries(SOURCE_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Interesse">
          <Input name="interest" defaultValue={lead.interest ?? ""} />
        </Field>
        <Field label="Valor potencial">
          <Input name="value" defaultValue={centsToInput(lead.valueCents)} />
        </Field>
        <Field label="Responsável">
          <Select name="ownerId" defaultValue={lead.ownerId ?? ""}>
            <option value="">Sem responsável</option>
            {owners.map((owner) => (
              <option key={owner.id} value={owner.id}>
                {owner.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Próximo contato">
          <Input name="nextFollowUpAt" type="date" defaultValue={lead.nextFollowUpAt ?? ""} />
        </Field>
      </div>

      <Button type="submit" variant="secondary" disabled={pending}>
        {pending ? "Salvando..." : "Salvar alteracoes"}
      </Button>
    </form>
  );
}

export function LostForm({ leadId }: { leadId: string }) {
  const [state, formAction, pending] = useActionState(markLeadLost, {});

  return (
    <form action={formAction} className="space-y-3 p-5">
      {state.error ? <Alert>{state.error}</Alert> : null}
      <input type="hidden" name="id" value={leadId} />

      <Field label="Motivo da perda">
        <Select name="lostReason" defaultValue="Preço acima do esperado">
          <option>Preço acima do esperado</option>
          <option>Sem resposta após várias tentativas</option>
          <option>Escolheu outra clínica</option>
          <option>Adiou o tratamento</option>
          <option>Não era o perfil do procedimento</option>
          <option>Distancia / localizacao</option>
        </Select>
      </Field>

      <Button type="submit" variant="danger" disabled={pending}>
        {pending ? "Registrando..." : "Marcar como perdido"}
      </Button>
    </form>
  );
}
