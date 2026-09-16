import type { Metadata } from "next";
import { withPage } from "@/server/next/page";
import { listProductOptions } from "@/modules/stock";
import { PageHead } from "@/ui";
import { EntradaForm } from "./form";

export const metadata: Metadata = { title: "Entrada de estoque" };

export default async function EntradaPage() {
  const produtos = await withPage((ctx) => listProductOptions(ctx), "inventory.write");

  return (
    <>
      <PageHead
        title="Registrar entrada"
        meta="O que chegou. Produto com rastreio entra com lote e validade."
      />
      <div className="max-w-3xl">
        <EntradaForm produtos={produtos} />
      </div>
    </>
  );
}
