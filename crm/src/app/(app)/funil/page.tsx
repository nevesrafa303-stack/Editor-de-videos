import type { Metadata } from "next";
import { requirePermission } from "@/server/tenant";
import { can } from "@/server/permissions";
import { bySource, funnelMetrics, SOURCE_LABEL, type Stage } from "@/domain/funnel";
import { formatBRL } from "@/lib/money";
import { Card, CardHeader, PageHeader, Stat } from "@/components/ui";
import { Kanban, type KanbanLead } from "./kanban";
import { NewLeadForm } from "./lead-form";

export const metadata: Metadata = { title: "Funil de vendas" };

export default async function FunnelPage() {
  const { db, session } = await requirePermission("leads:read");
  const canWrite = can(session.role, "leads:write");

  const [leads, owners] = await Promise.all([
    db.lead.findMany({
      orderBy: [{ stageChangedAt: "desc" }],
      include: { owner: { select: { name: true } } },
    }),
    db.user.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  const metrics = funnelMetrics(leads.map((lead) => ({ stage: lead.stage, valueCents: lead.valueCents })));
  const sources = bySource(
    leads.map((lead) => ({ source: lead.source, stage: lead.stage, valueCents: lead.valueCents })),
  );

  const cards: KanbanLead[] = leads
    .filter((lead) => lead.stage !== "PERDIDO")
    .map((lead) => ({
      id: lead.id,
      name: lead.name,
      phone: lead.phone,
      stage: lead.stage as Stage,
      source: lead.source,
      interest: lead.interest,
      valueCents: lead.valueCents,
      ownerName: lead.owner?.name ?? null,
      nextFollowUpAt: lead.nextFollowUpAt ? lead.nextFollowUpAt.toISOString() : null,
    }));

  const lostLeads = leads.filter((lead) => lead.stage === "PERDIDO").slice(0, 8);

  return (
    <>
      <PageHeader
        title="Funil de vendas"
        description="Arraste o card para mover o lead de etapa. Cada movimento fica registrado."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Leads em aberto" value={metrics.open} hint={`${metrics.total} no total`} />
        <Stat
          label="Pipeline"
          value={formatBRL(metrics.pipelineCents)}
          hint="Valor potencial em aberto"
          tone="brand"
        />
        <Stat
          label="Conversão"
          value={`${metrics.conversionRate}%`}
          hint={`${metrics.won} ganhos · ${metrics.lost} perdidos`}
          tone={metrics.conversionRate >= 50 ? "positive" : "neutral"}
        />
        <Stat
          label="Ticket médio"
          value={formatBRL(metrics.averageTicketCents)}
          hint="Média dos leads fechados"
        />
      </div>

      {canWrite ? (
        <Card className="mb-6">
          <details>
            <summary className="cursor-pointer list-none px-5 py-4 text-sm font-semibold text-brand-700 select-none hover:text-brand-800">
              + Novo lead
            </summary>
            <div className="border-t border-slate-100 p-5">
              <NewLeadForm owners={owners} />
            </div>
          </details>
        </Card>
      ) : null}

      <Kanban leads={cards} canWrite={canWrite} />

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Origem dos leads"
            description="Onde o dinheiro de marketing está virando paciente."
          />
          {sources.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-slate-400">
              Nenhum lead cadastrado ainda.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="table-base">
                <thead>
                  <tr>
                    <th>Origem</th>
                    <th className="text-right">Leads</th>
                    <th className="text-right">Fechados</th>
                    <th className="text-right">Conversão</th>
                    <th className="text-right">Faturado</th>
                  </tr>
                </thead>
                <tbody>
                  {sources.map((row) => (
                    <tr key={row.source}>
                      <td className="font-medium text-slate-800">
                        {SOURCE_LABEL[row.source] ?? row.source}
                      </td>
                      <td className="text-right tabular-nums">{row.total}</td>
                      <td className="text-right tabular-nums">{row.won}</td>
                      <td className="text-right tabular-nums">{row.conversionRate}%</td>
                      <td className="text-right tabular-nums">{formatBRL(row.wonCents)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card>
          <CardHeader
            title="Perdidos recentes"
            description="Motivo da perda e matéria-prima para ajustar o discurso."
          />
          {lostLeads.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-slate-400">
              Nenhum lead perdido registrado.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {lostLeads.map((lead) => (
                <li key={lead.id} className="px-5 py-3">
                  <p className="text-sm font-medium text-slate-800">{lead.name}</p>
                  <p className="text-xs text-slate-500">
                    {lead.lostReason ?? "Motivo não registrado"}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
