"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { moveLeadStage } from "@/server/actions/leads";
import { PIPELINE_STAGES, SOURCE_LABEL, STAGE_LABEL, type Stage } from "@/domain/funnel";
import { formatBRL } from "@/lib/money";
import { relativeDays } from "@/lib/date";
import { firstName, formatPhone, whatsappLink } from "@/lib/br";
import { Badge, cn } from "@/components/ui";
import { IconWhatsapp } from "@/components/icons";

export type KanbanLead = {
  id: string;
  name: string;
  phone: string;
  stage: Stage;
  source: string;
  interest: string | null;
  valueCents: number;
  ownerName: string | null;
  nextFollowUpAt: string | null;
};

export function Kanban({ leads, canWrite }: { leads: KanbanLead[]; canWrite: boolean }) {
  const [items, setItems] = useState(leads);
  const [lastServerLeads, setLastServerLeads] = useState(leads);
  const [dragging, setDragging] = useState<string | null>(null);
  const [hovered, setHovered] = useState<Stage | null>(null);
  const [, startTransition] = useTransition();

  // Quando o servidor manda uma lista nova (lead criado, outra aba mexeu no
  // funil), o estado local precisa ceder — senao o quadro congela no que
  // estava na tela quando o componente montou.
  if (leads !== lastServerLeads) {
    setLastServerLeads(leads);
    setItems(leads);
  }

  // A lista local se ajusta antes da resposta do servidor: arrastar um card e
  // esperar meio segundo pelo re-render deixa a operação com cara de travada.
  function move(leadId: string, stage: Stage) {
    const previous = items;
    setItems((current) =>
      current.map((lead) => (lead.id === leadId ? { ...lead, stage } : lead)),
    );

    startTransition(async () => {
      try {
        await moveLeadStage(leadId, stage);
      } catch {
        setItems(previous);
      }
    });
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-4">
      {PIPELINE_STAGES.map((stage) => {
        const stageLeads = items.filter((lead) => lead.stage === stage);
        const stageTotal = stageLeads.reduce((sum, lead) => sum + lead.valueCents, 0);

        return (
          <section
            key={stage}
            onDragOver={(event) => {
              if (!canWrite || !dragging) return;
              event.preventDefault();
              setHovered(stage);
            }}
            onDragLeave={() => setHovered((current) => (current === stage ? null : current))}
            onDrop={(event) => {
              event.preventDefault();
              setHovered(null);
              if (canWrite && dragging) move(dragging, stage);
              setDragging(null);
            }}
            className={cn(
              "flex w-72 shrink-0 flex-col rounded-xl border bg-slate-100/70 transition",
              hovered === stage ? "border-brand-400 bg-brand-50" : "border-slate-200",
            )}
          >
            <header className="flex items-baseline justify-between gap-2 px-3 py-3">
              <h2 className="text-sm font-semibold text-slate-700">{STAGE_LABEL[stage]}</h2>
              <span className="text-xs text-slate-500 tabular-nums">{stageLeads.length}</span>
            </header>

            <p className="px-3 pb-2 text-xs text-slate-500 tabular-nums">
              {formatBRL(stageTotal)}
            </p>

            <ul className="flex-1 space-y-2 p-2">
              {stageLeads.length === 0 ? (
                <li className="rounded-lg border border-dashed border-slate-300 px-3 py-6 text-center text-xs text-slate-400">
                  {canWrite ? "Arraste um lead para ca" : "Vazio"}
                </li>
              ) : null}

              {stageLeads.map((lead) => {
                const overdue =
                  lead.nextFollowUpAt && new Date(lead.nextFollowUpAt) < new Date();

                return (
                  <li
                    key={lead.id}
                    draggable={canWrite}
                    onDragStart={() => setDragging(lead.id)}
                    onDragEnd={() => {
                      setDragging(null);
                      setHovered(null);
                    }}
                    className={cn(
                      "rounded-lg border border-slate-200 bg-white p-3 shadow-xs transition",
                      canWrite && "cursor-grab active:cursor-grabbing hover:border-brand-300",
                      dragging === lead.id && "opacity-40",
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        href={`/funil/${lead.id}`}
                        className="text-sm font-semibold text-slate-800 hover:text-brand-700"
                      >
                        {lead.name}
                      </Link>
                      <a
                        href={whatsappLink(lead.phone, `Olá ${firstName(lead.name)}!`)}
                        target="_blank"
                        rel="noreferrer"
                        title="Abrir no WhatsApp"
                        className="text-emerald-600 hover:text-emerald-700"
                      >
                        <IconWhatsapp />
                      </a>
                    </div>

                    <p className="mt-0.5 text-xs text-slate-500">{formatPhone(lead.phone)}</p>

                    {lead.interest ? (
                      <p className="mt-1.5 line-clamp-2 text-xs text-slate-600">{lead.interest}</p>
                    ) : null}

                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      {lead.valueCents > 0 ? (
                        <Badge tone="brand">{formatBRL(lead.valueCents)}</Badge>
                      ) : null}
                      <Badge>{SOURCE_LABEL[lead.source] ?? lead.source}</Badge>
                      {lead.nextFollowUpAt ? (
                        <Badge tone={overdue ? "danger" : "info"}>
                          Retorno {relativeDays(new Date(lead.nextFollowUpAt))}
                        </Badge>
                      ) : null}
                    </div>

                    {lead.ownerName ? (
                      <p className="mt-2 truncate text-[11px] text-slate-400">
                        Responsável: {lead.ownerName}
                      </p>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
