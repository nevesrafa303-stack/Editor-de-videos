import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { withPage } from "@/server/next/page";
import { getPlanItemsForQuote } from "@/modules/quote/queries";
import { listActivePayers } from "@/modules/payer";
import { LinkButton, PageHead } from "@/ui";
import { NovoOrcamentoForm } from "./form";

export const metadata: Metadata = { title: "Novo orçamento" };

export default async function NovoOrcamentoPage({
  searchParams,
}: {
  searchParams: Promise<{ paciente?: string }>;
}) {
  const { paciente } = await searchParams;
  if (!paciente) redirect("/pacientes");

  const dados = await withPage(async (ctx) => {
    if (!ctx.can("quote.write")) return null;

    const [pessoa, planejados, convenios] = await Promise.all([
      ctx.db
        .selectFrom("patient")
        .select(["id", "full_name"])
        .where("id", "=", paciente)
        .where("deleted_at", "is", null)
        .executeTakeFirst(),
      getPlanItemsForQuote(ctx, paciente),
      listActivePayers(ctx),
    ]);

    return pessoa ? { pessoa, planejados, convenios } : null;
  }, "quote.read");

  if (!dados) redirect("/pacientes");

  return (
    <>
      <PageHead
        title="Novo orçamento"
        meta={`Para ${dados.pessoa.full_name}. O preço vem da tabela vigente e fica congelado na proposta.`}
        action={
          <LinkButton href={`/pacientes/${dados.pessoa.id}`} variant="secondary">
            Cancelar
          </LinkButton>
        }
      />

      <div className="max-w-3xl">
        <NovoOrcamentoForm
          patientId={dados.pessoa.id as string}
          patientName={dados.pessoa.full_name}
          convenios={dados.convenios}
          planejados={dados.planejados.map((i) => ({
            id: i.id as string,
            descricao: i.description,
            local: i.tooth_code ? `Dente ${i.tooth_code}` : (i.region_code ?? ""),
            precoCents: i.unit_price_cents,
          }))}
        />
      </div>
    </>
  );
}
