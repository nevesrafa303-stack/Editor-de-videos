import type { Metadata } from "next";
import Link from "next/link";
import { requirePermission } from "@/server/tenant";
import { can } from "@/server/permissions";
import { planTotals } from "@/domain/plan";
import { formatBRL } from "@/lib/money";
import { formatDate } from "@/lib/date";
import { Badge, Card, EmptyState, PageHeader, Select, Stat } from "@/components/ui";
import { NewPlanForm } from "./new-plan-form";
import type { PlanStatus } from "@/generated/prisma/enums";

export const metadata: Metadata = { title: "Orçamentos" };

const STATUS_LABEL: Record<PlanStatus, string> = {
  RASCUNHO: "Rascunho",
  ENVIADO: "Enviado",
  APROVADO: "Aprovado",
  RECUSADO: "Recusado",
  CONCLUIDO: "Concluído",
};

const STATUS_TONE: Record<PlanStatus, "neutral" | "info" | "success" | "danger" | "brand"> = {
  RASCUNHO: "neutral",
  ENVIADO: "info",
  APROVADO: "success",
  RECUSADO: "danger",
  CONCLUIDO: "brand",
};

export default async function PlansPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { db, session } = await requirePermission("plans:read");
  const { status } = await searchParams;

  const statusFilter = status && status in STATUS_LABEL ? (status as PlanStatus) : undefined;

  const [plans, professionals] = await Promise.all([
    db.treatmentPlan.findMany({
      where: statusFilter ? { status: statusFilter } : {},
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        patient: { select: { id: true, name: true } },
        professional: { select: { name: true } },
        items: { select: { quantity: true, unitPriceCents: true, done: true } },
      },
    }),
    db.user.findMany({
      where: { isProfessional: true, active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  const rows = plans.map((plan) => ({ plan, totals: planTotals(plan.items, plan.discountCents) }));
  const openRows = rows.filter(({ plan }) => plan.status === "ENVIADO" || plan.status === "RASCUNHO");
  const approvedRows = rows.filter(({ plan }) => plan.status === "APROVADO" || plan.status === "CONCLUIDO");

  return (
    <>
      <PageHeader
        title="Orçamentos"
        description="Plano de tratamento por paciente. Aprovar gera as parcelas a receber."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Stat
          label="Em negociacao"
          value={openRows.length}
          hint={formatBRL(openRows.reduce((sum, row) => sum + row.totals.totalCents, 0))}
        />
        <Stat
          label="Aprovados"
          value={approvedRows.length}
          hint={formatBRL(approvedRows.reduce((sum, row) => sum + row.totals.totalCents, 0))}
          tone="positive"
        />
        <Stat
          label="Taxa de aprovacao"
          value={`${rows.length === 0 ? 0 : Math.round((approvedRows.length / rows.length) * 100)}%`}
          hint={`${rows.length} orçamentos`}
          tone="brand"
        />
      </div>

      {can(session.role, "plans:write") ? (
        <Card className="mb-6">
          <details>
            <summary className="cursor-pointer list-none px-5 py-4 text-sm font-semibold text-brand-700 select-none hover:text-brand-800">
              + Novo orçamento
            </summary>
            <div className="border-t border-slate-100 p-5">
              <NewPlanForm professionals={professionals} />
            </div>
          </details>
        </Card>
      ) : null}

      <Card className="mb-4 p-4">
        <form className="flex flex-wrap items-end gap-3">
          <label className="min-w-52">
            <span className="field-label">Status</span>
            <Select name="status" defaultValue={statusFilter ?? ""}>
              <option value="">Todos</option>
              {Object.entries(STATUS_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </label>
          <button
            type="submit"
            className="mb-0.5 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Filtrar
          </button>
        </form>
      </Card>

      <Card className="overflow-hidden">
        {rows.length === 0 ? (
          <EmptyState
            title="Nenhum orçamento"
            description="Crie o primeiro orçamento a partir de um paciente."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Número</th>
                  <th>Paciente</th>
                  <th>Profissional</th>
                  <th>Criado</th>
                  <th>Itens</th>
                  <th className="text-right">Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ plan, totals }) => (
                  <tr key={plan.id}>
                    <td>
                      <Link
                        href={`/orcamentos/${plan.id}`}
                        className="font-medium text-slate-900 tabular-nums hover:text-brand-700"
                      >
                        ORC-{String(plan.number).padStart(4, "0")}
                      </Link>
                    </td>
                    <td>
                      <Link
                        href={`/pacientes/${plan.patient.id}`}
                        className="hover:text-brand-700"
                      >
                        {plan.patient.name}
                      </Link>
                    </td>
                    <td>{plan.professional?.name ?? "—"}</td>
                    <td className="tabular-nums">{formatDate(plan.createdAt)}</td>
                    <td className="tabular-nums">
                      {totals.doneCount}/{totals.itemCount}
                    </td>
                    <td className="text-right font-medium tabular-nums">
                      {formatBRL(totals.totalCents)}
                    </td>
                    <td>
                      <Badge tone={STATUS_TONE[plan.status]}>{STATUS_LABEL[plan.status]}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
