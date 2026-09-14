import type { Metadata } from "next";
import { requireSession } from "@/server/next/session";
import { redirect } from "next/navigation";
import { LinkButton, PageHead } from "@/ui";
import { NovoPacienteForm } from "./form";

export const metadata: Metadata = { title: "Novo paciente" };

export default async function NovoPacientePage() {
  const session = await requireSession();
  if (!session.permissions.has("patient.write")) redirect("/pacientes");

  return (
    <>
      <PageHead
        title="Novo paciente"
        meta="Nome e telefone bastam para começar; o resto pode vir depois."
        action={
          <LinkButton href="/pacientes" variant="secondary">
            Cancelar
          </LinkButton>
        }
      />
      <div className="max-w-3xl">
        <NovoPacienteForm />
      </div>
    </>
  );
}
