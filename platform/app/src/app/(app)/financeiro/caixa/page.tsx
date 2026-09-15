import type { Metadata } from "next";
import { withPage } from "@/server/next/page";
import { getOpenCashSession } from "@/modules/finance";
import { LinkButton, Notice, PageHead } from "@/ui";
import { lerAviso } from "@/shared/flash";
import { AbrirCaixa, Gaveta } from "./gaveta";

export const metadata: Metadata = { title: "Caixa" };

export default async function CaixaPage({
  searchParams,
}: {
  searchParams: Promise<{ aviso?: string }>;
}) {
  const aviso = lerAviso((await searchParams).aviso);

  const dados = await withPage(async (ctx) => {
    const caixa = await getOpenCashSession(ctx);

    return {
      caixa,
      podeAbrir: ctx.can("cash.open"),
      podeFechar: ctx.can("cash.close"),
      fuso: ctx.session.timezone,
    };
  }, "receivable.read");

  const { caixa, podeAbrir, podeFechar, fuso } = dados;

  return (
    <>
      <PageHead
        title="Caixa"
        meta={
          caixa
            ? "Aberto. Só dinheiro em espécie passa por aqui."
            : "Fechado. Abra para receber em dinheiro."
        }
        action={
          <LinkButton href="/financeiro" variant="secondary">
            Voltar ao financeiro
          </LinkButton>
        }
      />

      {aviso ? (
        <div className="mb-5">
          <Notice tone="positive">{aviso}</Notice>
        </div>
      ) : null}

      {caixa ? (
        <Gaveta caixa={caixa} podeFechar={podeFechar} fuso={fuso} />
      ) : podeAbrir ? (
        <AbrirCaixa />
      ) : (
        <p className="text-sm text-muted">
          Não há caixa aberto nesta unidade, e seu perfil não abre caixa.
        </p>
      )}
    </>
  );
}
