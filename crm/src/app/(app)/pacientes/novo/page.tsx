import type { Metadata } from "next";
import { requirePermission } from "@/server/tenant";
import { createPatient } from "@/server/actions/patients";
import { PageHeader, LinkButton } from "@/components/ui";
import { PatientForm } from "@/components/patient-form";

export const metadata: Metadata = { title: "Novo paciente" };

export default async function NewPatientPage() {
  await requirePermission("patients:write");

  return (
    <>
      <PageHeader
        title="Novo paciente"
        description="O cadastro mínimo e nome e telefone; o resto pode vir depois."
        action={
          <LinkButton href="/pacientes" variant="secondary">
            Cancelar
          </LinkButton>
        }
      />
      <div className="max-w-3xl">
        <PatientForm action={createPatient} submitLabel="Cadastrar paciente" />
      </div>
    </>
  );
}
