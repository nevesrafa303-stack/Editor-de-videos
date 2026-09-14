import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { withPage } from "@/server/next/page";
import { LinkButton, PageHead } from "@/ui";
import { EncaixarForm } from "./form";

export const metadata: Metadata = { title: "Encaixar na agenda" };

export default async function NovoAgendamentoPage({
  searchParams,
}: {
  searchParams: Promise<{ data?: string; paciente?: string }>;
}) {
  const params = await searchParams;

  const dados = await withPage(async (ctx) => {
    if (!ctx.can("appointment.write")) return null;

    const [pacientes, profissionais, procedimentos] = await Promise.all([
      ctx.db
        .selectFrom("patient")
        .select(["id", "full_name", "phone"])
        .where("status", "=", "active")
        .where("deleted_at", "is", null)
        .orderBy("full_name", "asc")
        .limit(500)
        .execute(),

      ctx.db
        .selectFrom("membership as m")
        .innerJoin("app_user as u", "u.id", "m.user_id")
        .select(["m.id", "u.full_name", "m.specialty"])
        .where("m.is_provider", "=", true)
        .where("m.status", "=", "active")
        .orderBy("u.full_name", "asc")
        .execute(),

      ctx.db
        .selectFrom("procedure")
        .select(["id", "name", "default_duration_minutes"])
        .where("is_active", "=", true)
        .orderBy("name", "asc")
        .execute(),
    ]);

    return { pacientes, profissionais, procedimentos };
  }, "appointment.read");

  if (!dados) redirect("/agenda");

  const hoje = new Date().toISOString().slice(0, 10);
  const data = /^\d{4}-\d{2}-\d{2}$/.test(params.data ?? "") ? (params.data as string) : hoje;

  return (
    <>
      <PageHead
        title="Encaixar na agenda"
        meta="Conflito de horário é recusado pelo banco, não pela tela."
        action={
          <LinkButton href={`/agenda?data=${data}`} variant="secondary">
            Cancelar
          </LinkButton>
        }
      />
      <div className="max-w-3xl">
        <EncaixarForm
          data={data}
          pacienteId={params.paciente ?? ""}
          pacientes={dados.pacientes.map((p) => ({ id: p.id, nome: p.full_name }))}
          profissionais={dados.profissionais.map((p) => ({
            id: p.id,
            nome: p.full_name + (p.specialty ? ` · ${p.specialty}` : ""),
          }))}
          procedimentos={dados.procedimentos.map((p) => ({
            id: p.id,
            nome: p.name,
            duracao: p.default_duration_minutes,
          }))}
        />
      </div>
    </>
  );
}
