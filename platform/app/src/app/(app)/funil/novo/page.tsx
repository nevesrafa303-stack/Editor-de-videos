import type { Metadata } from "next";
import { withPage } from "@/server/next/page";
import { listSources } from "@/modules/funnel";
import { LinkButton, PageHead } from "@/ui";
import { NovoContatoForm } from "./form";

export const metadata: Metadata = { title: "Novo contato" };

export default async function NovoContatoPage() {
  const origens = await withPage((ctx) => listSources(ctx), "lead.read");

  return (
    <>
      <PageHead
        title="Novo contato"
        meta="Quem ligou, quem mandou mensagem, quem apareceu no balcão. Vira paciente quando fechar."
        action={
          <LinkButton href="/funil" variant="secondary">
            Cancelar
          </LinkButton>
        }
      />

      <div className="max-w-2xl">
        <NovoContatoForm origens={origens} />
      </div>
    </>
  );
}
