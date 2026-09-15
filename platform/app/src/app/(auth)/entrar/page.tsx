import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { currentSession } from "@/server/next/session";
import { BRAND } from "@/shared/brand";
import { EntrarForm } from "./form";

export const metadata: Metadata = { title: "Entrar" };

export default async function EntrarPage() {
  if (await currentSession()) redirect("/pacientes");

  return (
    <div>
      <p className="mb-6 text-lg font-bold tracking-tight text-structure lg:hidden">
        {BRAND.name}
      </p>

      <h1 className="text-2xl font-bold tracking-tight text-ink">Entrar</h1>
      <p className="mt-1 mb-8 text-sm text-muted">
        Use o e-mail cadastrado pela sua clínica.
      </p>

      <EntrarForm />
    </div>
  );
}
