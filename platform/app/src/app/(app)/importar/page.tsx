import type { Metadata } from "next";
import Link from "next/link";
import { withPage } from "@/server/next/page";
import { listImports } from "@/modules/import";
import { Badge, Empty, Notice, PageHead, Panel, PanelHead } from "@/ui";
import { formatDateTime } from "@/shared/format";
import { lerAviso } from "@/shared/flash";
import { SITUACAO } from "./situacao";
import { EnviarPlanilha } from "./enviar";

export const metadata: Metadata = { title: "Importar" };

export default async function ImportarPage({
  searchParams,
}: {
  searchParams: Promise<{ aviso?: string }>;
}) {
  const aviso = lerAviso((await searchParams).aviso);

  const { historico, podeImportar, fuso } = await withPage(
    async (ctx) => ({
      historico: await listImports(ctx),
      podeImportar: ctx.can("import.write"),
      fuso: ctx.session.timezone,
    }),
    "import.read",
  );

  return (
    <>
      <PageHead
        title="Importar pacientes"
        meta="A planilha do sistema antigo. Nome e telefone bastam; o resto entra se vier."
      />

      {aviso ? (
        <div className="mb-4">
          <Notice tone="positive">{aviso}</Notice>
        </div>
      ) : null}

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        {podeImportar ? <EnviarPlanilha /> : null}

        <Panel className="overflow-hidden">
          <PanelHead
            title="Importações feitas"
            hint="Fica guardado quem trouxe o quê, e o que entrou."
          />

          {historico.length === 0 ? (
            <Empty
              title="Nenhuma importação ainda"
              hint="A primeira costuma ser a base inteira do sistema anterior."
            />
          ) : (
            <ul className="divide-y divide-line">
              {historico.map((h) => {
                const meta = SITUACAO[h.status];

                return (
                  <li key={h.id} className="px-5 py-3.5">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <Link
                        href={`/importar/${h.id}`}
                        className="min-w-0 flex-1 truncate text-sm font-medium text-ink hover:text-structure"
                      >
                        {h.filename ?? "Planilha colada"}
                      </Link>
                      <Badge tone={meta.tom}>{meta.rotulo}</Badge>
                    </div>

                    <p className="num mt-0.5 text-xs text-muted">
                      {formatDateTime(h.createdAt, fuso)}
                      {h.createdBy ? ` · ${h.createdBy}` : ""}
                      {" · "}
                      {h.status === "applied"
                        ? `${h.importadas} de ${h.total} importados`
                        : `${h.total} linhas`}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}
