import type { Metadata } from "next";
import Link from "next/link";
import { withPage } from "@/server/next/page";
import { listOpenTasks } from "@/modules/funnel";
import { Badge, Empty, LinkButton, Metric, Notice, PageHead, Panel } from "@/ui";
import { formatDateTime } from "@/shared/format";
import { lerAviso } from "@/shared/flash";
import { PRIORIDADE, prazoDaAcao } from "../estado";
import { ConcluirTarefa } from "./concluir";

export const metadata: Metadata = { title: "Pendências" };

export default async function PendenciasPage({
  searchParams,
}: {
  searchParams: Promise<{ aviso?: string }>;
}) {
  const aviso = lerAviso((await searchParams).aviso);

  const { tarefas, podeConcluir, fuso } = await withPage(
    async (ctx) => ({
      tarefas: await listOpenTasks(ctx),
      podeConcluir: ctx.can("task.write"),
      fuso: ctx.session.timezone,
    }),
    "task.read",
  );

  const agora = Date.now();
  const atrasadas = tarefas.filter((t) => t.dueAt !== null && t.dueAt.getTime() < agora);

  return (
    <>
      <PageHead
        title="Pendências"
        meta="O que a clínica combinou fazer, e quando. É isto que impede o contato de esfriar."
        action={
          <LinkButton href="/funil" variant="secondary">
            Voltar ao funil
          </LinkButton>
        }
      />

      {aviso ? (
        <div className="mb-4">
          <Notice tone="positive">{aviso}</Notice>
        </div>
      ) : null}

      <Panel aria-label="Resumo das pendências" className="mb-4 grid gap-5 p-5 sm:grid-cols-2">
        <Metric
          label="Abertas"
          value={String(tarefas.length)}
          hint="De toda a equipe, não só suas"
        />
        <Metric
          label="Atrasadas"
          value={String(atrasadas.length)}
          hint="A data combinada já passou"
          tone={atrasadas.length > 0 ? "critical" : "positive"}
        />
      </Panel>

      <Panel className="overflow-hidden">
        {tarefas.length === 0 ? (
          <Empty
            title="Nada pendente"
            hint="Tarefas nascem na ficha do negócio, em “próxima ação”."
            action={
              <LinkButton href="/funil" variant="secondary">
                Ir para o funil
              </LinkButton>
            }
          />
        ) : (
          <ul className="divide-y divide-line">
            {tarefas.map((t) => {
              const prazo = prazoDaAcao(t.dueAt);
              const prio = PRIORIDADE[t.priority];

              return (
                <li key={t.id} className="flex flex-wrap items-center gap-x-3 gap-y-1.5 px-5 py-3.5">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-ink">
                      {t.title}
                    </span>
                    <span className="block truncate text-xs text-muted">
                      {t.opportunityId ? (
                        <Link
                          href={`/funil/${t.opportunityId}`}
                          className="hover:text-structure"
                        >
                          {t.personName ?? t.opportunityTitle}
                        </Link>
                      ) : (
                        "Sem negócio ligado"
                      )}
                      {t.assignedTo ? ` · ${t.assignedTo}` : ""}
                    </span>
                  </span>

                  {t.priority !== "normal" ? (
                    <Badge tone={prio.tom}>{prio.rotulo}</Badge>
                  ) : null}
                  {prazo ? <Badge tone={prazo.tom}>{prazo.texto}</Badge> : null}

                  <span className="num w-36 shrink-0 text-right text-xs text-muted">
                    {t.dueAt ? formatDateTime(t.dueAt, fuso) : "sem data"}
                  </span>

                  {podeConcluir ? <ConcluirTarefa taskId={t.id} /> : null}
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
    </>
  );
}
