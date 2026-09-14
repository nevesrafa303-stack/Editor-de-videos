"use client";

import { useActionState } from "react";
import {
  createProcedure,
  createRoom,
  createUser,
  updateClinic,
  updateUser,
} from "@/server/actions/settings";
import { ROLE_DESCRIPTION, ROLE_LABEL } from "@/server/permissions";
import { Alert, Button, Field, Input, Select } from "@/components/ui";
import type { Role } from "@/generated/prisma/enums";

const ROLES = Object.keys(ROLE_LABEL) as Role[];

export function ClinicForm({
  clinic,
}: {
  clinic: {
    name: string;
    document: string | null;
    phone: string | null;
    email: string | null;
    defaultCommissionPct: number;
  };
}) {
  const [state, formAction, pending] = useActionState(updateClinic, {});

  return (
    <form action={formAction} className="grid gap-4 p-5 sm:grid-cols-2">
      {state.error ? (
        <div className="sm:col-span-2">
          <Alert>{state.error}</Alert>
        </div>
      ) : null}
      {state.success ? (
        <div className="sm:col-span-2">
          <Alert tone="success">{state.success}</Alert>
        </div>
      ) : null}

      <Field label="Nome da clínica">
        <Input name="name" defaultValue={clinic.name} required />
      </Field>

      <Field label="CNPJ">
        <Input name="document" defaultValue={clinic.document ?? ""} placeholder="00.000.000/0001-00" />
      </Field>

      <Field label="Telefone">
        <Input name="phone" defaultValue={clinic.phone ?? ""} />
      </Field>

      <Field label="E-mail de contato">
        <Input name="email" type="email" defaultValue={clinic.email ?? ""} />
      </Field>

      <Field
        label="Comissão padrão (%)"
        hint="Usada quando o profissional não tem percentual próprio."
      >
        <Input
          name="defaultCommissionPct"
          type="number"
          min={0}
          max={100}
          step={0.5}
          defaultValue={clinic.defaultCommissionPct}
        />
      </Field>

      <div className="flex items-end">
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando..." : "Salvar"}
        </Button>
      </div>
    </form>
  );
}

export function NewUserForm() {
  const [state, formAction, pending] = useActionState(createUser, {});

  return (
    <form action={formAction} className="grid gap-4 p-5 sm:grid-cols-2">
      {state.error ? (
        <div className="sm:col-span-2">
          <Alert>{state.error}</Alert>
        </div>
      ) : null}
      {state.success ? (
        <div className="sm:col-span-2">
          <Alert tone="success">{state.success}</Alert>
        </div>
      ) : null}

      <Field label="Nome">
        <Input name="name" required />
      </Field>

      <Field label="E-mail">
        <Input name="email" type="email" required />
      </Field>

      <Field label="Senha inicial">
        <Input name="password" type="password" required minLength={8} />
      </Field>

      <Field label="Perfil" hint={ROLE_DESCRIPTION.RECEPTION}>
        <Select name="role" defaultValue="RECEPTION">
          {ROLES.map((role) => (
            <option key={role} value={role}>
              {ROLE_LABEL[role]}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Especialidade">
        <Input name="specialty" placeholder="Implantodontia, harmonização facial..." />
      </Field>

      <Field label="Registro (CRO/CRM)">
        <Input name="councilNumber" placeholder="CRO-SP 12345" />
      </Field>

      <Field label="Comissão (%)" hint="Vazio usa o padrão da clínica.">
        <Input name="commissionPct" type="number" min={0} max={100} step={0.5} />
      </Field>

      <Field label="Cor na agenda">
        <Input name="color" type="color" defaultValue="#0f766e" className="h-10 p-1" />
      </Field>

      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          name="isProfessional"
          defaultChecked
          className="size-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
        />
        Atende pacientes (aparece na agenda)
      </label>

      <div className="flex items-end justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "Criando..." : "Adicionar a equipe"}
        </Button>
      </div>
    </form>
  );
}

export function UserRow({
  user,
}: {
  user: {
    id: string;
    name: string;
    email: string;
    role: Role;
    active: boolean;
    isProfessional: boolean;
    specialty: string | null;
    councilNumber: string | null;
    color: string;
    commissionPct: number | null;
  };
}) {
  const [state, formAction, pending] = useActionState(updateUser, {});

  return (
    <form action={formAction} className="space-y-3 px-5 py-4">
      {state.error ? <Alert>{state.error}</Alert> : null}
      {state.success ? <Alert tone="success">{state.success}</Alert> : null}
      <input type="hidden" name="id" value={user.id} />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Nome">
          <Input name="name" defaultValue={user.name} required />
        </Field>

        <Field label="E-mail" hint="Não editavel; e a credencial de acesso.">
          <Input defaultValue={user.email} disabled />
        </Field>

        <Field label="Perfil">
          <Select name="role" defaultValue={user.role}>
            {ROLES.map((role) => (
              <option key={role} value={role}>
                {ROLE_LABEL[role]}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Nova senha" hint="Deixe vazio para manter.">
          <Input name="password" type="password" minLength={8} />
        </Field>

        <Field label="Especialidade">
          <Input name="specialty" defaultValue={user.specialty ?? ""} />
        </Field>

        <Field label="Registro">
          <Input name="councilNumber" defaultValue={user.councilNumber ?? ""} />
        </Field>

        <Field label="Comissão (%)">
          <Input
            name="commissionPct"
            type="number"
            min={0}
            max={100}
            step={0.5}
            defaultValue={user.commissionPct ?? ""}
          />
        </Field>

        <Field label="Cor na agenda">
          <Input name="color" type="color" defaultValue={user.color} className="h-10 p-1" />
        </Field>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            name="isProfessional"
            defaultChecked={user.isProfessional}
            className="size-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
          />
          Atende pacientes
        </label>

        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            name="active"
            defaultChecked={user.active}
            className="size-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
          />
          Ativo
        </label>

        <Button type="submit" variant="secondary" size="sm" disabled={pending}>
          {pending ? "Salvando..." : "Salvar"}
        </Button>
      </div>
    </form>
  );
}

export function NewProcedureForm() {
  const [state, formAction, pending] = useActionState(createProcedure, {});

  return (
    <form action={formAction} className="grid gap-3 p-5 sm:grid-cols-5">
      {state.error ? (
        <div className="sm:col-span-5">
          <Alert>{state.error}</Alert>
        </div>
      ) : null}
      {state.success ? (
        <div className="sm:col-span-5">
          <Alert tone="success">{state.success}</Alert>
        </div>
      ) : null}

      <Field label="Nome" className="sm:col-span-2">
        <Input name="name" required />
      </Field>

      <Field label="Categoria">
        <Select name="category" defaultValue="ODONTOLOGIA">
          <option value="ODONTOLOGIA">Odontologia</option>
          <option value="ESTETICA">Estética</option>
          <option value="OUTRO">Outro</option>
        </Select>
      </Field>

      <Field label="Preço">
        <Input name="price" placeholder="R$ 0,00" />
      </Field>

      <Field label="Custo do material">
        <Input name="cost" placeholder="R$ 0,00" />
      </Field>

      <Field label="Duração (min)">
        <Input name="durationMin" type="number" min={5} step={5} defaultValue={30} />
      </Field>

      <div className="flex items-end sm:col-span-2">
        <Button type="submit" disabled={pending}>
          {pending ? "..." : "Cadastrar procedimento"}
        </Button>
      </div>
    </form>
  );
}

export function NewRoomForm() {
  const [state, formAction, pending] = useActionState(createRoom, {});

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3 p-5">
      {state.error ? (
        <div className="w-full">
          <Alert>{state.error}</Alert>
        </div>
      ) : null}
      {state.success ? (
        <div className="w-full">
          <Alert tone="success">{state.success}</Alert>
        </div>
      ) : null}

      <Field label="Nome da sala" className="min-w-60">
        <Input name="name" required placeholder="Consultório 2" />
      </Field>

      <Button type="submit" disabled={pending}>
        {pending ? "..." : "Adicionar sala"}
      </Button>
    </form>
  );
}
