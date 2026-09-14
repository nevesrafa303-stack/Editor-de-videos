import type { Metadata } from "next";
import Link from "next/link";
import { requirePermission } from "@/server/tenant";
import { can } from "@/server/permissions";
import { cancelInstallment } from "@/server/actions/finance";
import { endOfMonth, startOfMonth } from "@/domain/scheduling";
import { isOverdue } from "@/domain/installments";
import { percentOf, formatBRL } from "@/lib/money";
import { formatDate, formatMonthYear, parseISODate } from "@/lib/date";
import { Badge, Card, CardHeader, EmptyState, LinkButton, PageHeader, Select, Stat } from "@/components/ui";
import { ManualInstallmentForm, PaymentForm } from "./forms";

export const metadata: Metadata = { title: "Financeiro" };

export default async function FinancePage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string; filtro?: string; receber?: string }>;
}) {
  const { db, session } = await requirePermission("finance:read");
  const params = await searchParams;

  const reference = params.mes ? parseISODate(`${params.mes}-01`) : new Date();
  const monthStart = startOfMonth(reference);
  const monthEnd = endOfMonth(reference);
  const filter = params.filtro ?? "abertas";
  const canWrite = can(session.role, "finance:write");

  const today = new Date();

  const statusWhere =
    filter === "pagas"
      ? { status: "PAGA" as const }
      : filter === "atrasadas"
        ? { status: "ABERTA" as const, dueDate: { lt: new Date(today.getFullYear(), today.getMonth(), today.getDate()) } }
        : filter === "todas"
          ? {}
          : { status: "ABERTA" as const };

  const [installments, receivedInMonth, dueInMonth, overdueTotal, commissions, selected] =
    await Promise.all([
      db.installment.findMany({
        where: {
          ...statusWhere,
          ...(filter === "atrasadas" ? {} : { dueDate: { gte: monthStart, lte: monthEnd } }),
        },
        orderBy: { dueDate: "asc" },
        take: 200,
        include: {
          patient: { select: { id: true, name: true } },
          plan: { select: { id: true, number: true } },
          payments: {
            orderBy: { paidAt: "desc" },
            include: { user: { select: { name: true } } },
          },
        },
      }),
      db.payment.aggregate({
        where: { paidAt: { gte: monthStart, lte: monthEnd } },
        _sum: { amountCents: true },
      }),
      db.installment.aggregate({
        where: { dueDate: { gte: monthStart, lte: monthEnd }, status: { not: "CANCELADA" } },
        _sum: { amountCents: true, paidCents: true },
      }),
      db.installment.findMany({
        where: {
          status: "ABERTA",
          dueDate: { lt: new Date(today.getFullYear(), today.getMonth(), today.getDate()) },
        },
        select: { amountCents: true, paidCents: true },
      }),
      db.treatmentPlanItem.findMany({
        where: { done: true, doneAt: { gte: monthStart, lte: monthEnd } },
        include: {
          plan: {
            select: {
              professional: { select: { id: true, name: true, commissionPct: true } },
            },
          },
        },
      }),
      params.receber
        ? db.installment.findUnique({
            where: { id: params.receber },
            include: { patient: { select: { name: true } } },
          })
        : Promise.resolve(null),
    ]);

  const overdueCents = overdueTotal.reduce(
    (sum, row) => sum + row.amountCents - row.paidCents,
    0,
  );
  const expectedCents = dueInMonth._sum.amountCents ?? 0;
  const receivedCents = receivedInMonth._sum.amountCents ?? 0;

  const clinic = await db.clinic.findUnique({
    where: { id: session.clinicId },
    select: { defaultCommissionPct: true },
  });
  const defaultPct = Number(clinic?.defaultCommissionPct ?? 0);

  const commissionByProfessional = new Map<
    string,
    { name: string; baseCents: number; commissionCents: number; pct: number }
  >();

  for (const item of commissions) {
    const professional = item.plan.professional;
    if (!professional) continue;

    const pct = professional.commissionPct === null ? defaultPct : Number(professional.commissionPct);
    const baseCents = item.quantity * item.unitPriceCents;
    const entry = commissionByProfessional.get(professional.id) ?? {
      name: professional.name,
      baseCents: 0,
      commissionCents: 0,
      pct,
    };

    entry.baseCents += baseCents;
    entry.commissionCents += percentOf(baseCents, pct);
    commissionByProfessional.set(professional.id, entry);
  }

  const monthInput = `${monthStart.getFullYear()}-${String(monthStart.getMonth() + 1).padStart(2, "0")}`;

  return (
    <>
      <PageHeader
        title="Financeiro"
        description={`Competência de ${formatMonthYear(monthStart)}`}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Recebido no mês"
          value={formatBRL(receivedCents)}
          hint="Pagamentos com data no mês"
          tone="positive"
        />
        <Stat
          label="Previsto no mês"
          value={formatBRL(expectedCents)}
          hint={`${formatBRL(expectedCents - (dueInMonth._sum.paidCents ?? 0))} ainda em aberto`}
        />
        <Stat
          label="Em atraso"
          value={formatBRL(overdueCents)}
          hint={`${overdueTotal.length} parcelas vencidas`}
          tone={overdueCents > 0 ? "negative" : "neutral"}
        />
        <Stat
          label="Comissões do mês"
          value={formatBRL(
            [...commissionByProfessional.values()].reduce((sum, row) => sum + row.commissionCents, 0),
          )}
          hint="Sobre procedimentos executados"
          tone="brand"
        />
      </div>

      {selected && canWrite && selected.status !== "PAGA" ? (
        <Card className="mb-4 border-brand-300">
          <CardHeader
            title={`Receber parcela ${selected.number}/${selected.totalCount}`}
            description={`${selected.patient.name} · vencimento ${formatDate(selected.dueDate)}`}
            action={
              <LinkButton href="/financeiro" variant="ghost" size="sm">
                Fechar
              </LinkButton>
            }
          />
          <PaymentForm
            installmentId={selected.id}
            remainingCents={selected.amountCents - selected.paidCents}
            defaultMethod={selected.method}
          />
        </Card>
      ) : null}

      <Card className="mb-4 p-4">
        <form className="flex flex-wrap items-end gap-3">
          <label>
            <span className="field-label">Mês</span>
            <input type="month" name="mes" className="field-input" defaultValue={monthInput} />
          </label>

          <label className="min-w-48">
            <span className="field-label">Mostrar</span>
            <Select name="filtro" defaultValue={filter}>
              <option value="abertas">Em aberto no mês</option>
              <option value="pagas">Pagas no mês</option>
              <option value="atrasadas">Atrasadas (todas)</option>
              <option value="todas">Todas do mês</option>
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

      {canWrite ? (
        <Card className="mb-4">
          <details>
            <summary className="cursor-pointer list-none px-5 py-4 text-sm font-semibold text-brand-700 select-none hover:text-brand-800">
              + Lançamento avulso
            </summary>
            <div className="border-t border-slate-100">
              <ManualInstallmentForm />
            </div>
          </details>
        </Card>
      ) : null}

      <Card className="mb-6 overflow-hidden">
        <CardHeader title={`Recebíveis (${installments.length})`} />

        {installments.length === 0 ? (
          <EmptyState
            title="Nenhuma parcela no filtro"
            description="Aprove um orçamento ou crie um lançamento avulso."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Vencimento</th>
                  <th>Paciente</th>
                  <th>Origem</th>
                  <th>Parcela</th>
                  <th className="text-right">Valor</th>
                  <th className="text-right">Saldo</th>
                  <th>Status</th>
                  {canWrite ? <th /> : null}
                </tr>
              </thead>
              <tbody>
                {installments.map((installment) => {
                  const remaining = installment.amountCents - installment.paidCents;
                  const late =
                    installment.status === "ABERTA" &&
                    isOverdue(installment.dueDate, installment.paidCents, installment.amountCents);

                  return (
                    <tr key={installment.id}>
                      <td className="whitespace-nowrap tabular-nums">
                        {formatDate(installment.dueDate)}
                      </td>
                      <td>
                        <Link
                          href={`/pacientes/${installment.patient.id}`}
                          className="font-medium text-slate-800 hover:text-brand-700"
                        >
                          {installment.patient.name}
                        </Link>
                      </td>
                      <td>
                        {installment.plan ? (
                          <Link
                            href={`/orcamentos/${installment.plan.id}`}
                            className="text-slate-600 tabular-nums hover:text-brand-700"
                          >
                            ORC-{String(installment.plan.number).padStart(4, "0")}
                          </Link>
                        ) : (
                          <span className="text-slate-400">Avulso</span>
                        )}
                      </td>
                      <td className="tabular-nums">
                        {installment.number}/{installment.totalCount}
                      </td>
                      <td className="text-right tabular-nums">
                        {formatBRL(installment.amountCents)}
                      </td>
                      <td className="text-right font-medium tabular-nums">
                        {formatBRL(remaining)}
                      </td>
                      <td>
                        {installment.status === "PAGA" ? (
                          <Badge tone="success">Paga</Badge>
                        ) : installment.status === "CANCELADA" ? (
                          <Badge>Cancelada</Badge>
                        ) : late ? (
                          <Badge tone="danger">Atrasada</Badge>
                        ) : (
                          <Badge tone="warning">Em aberto</Badge>
                        )}
                      </td>
                      {canWrite ? (
                        <td>
                          <div className="flex gap-1">
                            {installment.status === "ABERTA" ? (
                              <>
                                <Link
                                  href={`/financeiro?mes=${monthInput}&filtro=${filter}&receber=${installment.id}`}
                                  className="rounded border border-brand-200 bg-brand-50 px-2 py-0.5 text-[11px] font-medium text-brand-700 hover:bg-brand-100"
                                >
                                  Receber
                                </Link>

                                {installment.paidCents === 0 ? (
                                  <form action={cancelInstallment}>
                                    <input type="hidden" name="id" value={installment.id} />
                                    <button
                                      type="submit"
                                      className="rounded border border-slate-200 px-2 py-0.5 text-[11px] font-medium text-slate-500 hover:bg-slate-50"
                                    >
                                      Cancelar
                                    </button>
                                  </form>
                                ) : null}
                              </>
                            ) : null}
                          </div>
                        </td>
                      ) : null}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card>
        <CardHeader
          title="Comissões do mês"
          description="Calculadas sobre o valor dos itens marcados como executados."
        />

        {commissionByProfessional.size === 0 ? (
          <EmptyState
            title="Nenhum procedimento executado no mês"
            description="Marque os itens do orçamento como feitos para gerar comissão."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Profissional</th>
                  <th className="text-right">Produção</th>
                  <th className="text-right">%</th>
                  <th className="text-right">Comissão</th>
                </tr>
              </thead>
              <tbody>
                {[...commissionByProfessional.entries()].map(([id, row]) => (
                  <tr key={id}>
                    <td className="font-medium text-slate-800">{row.name}</td>
                    <td className="text-right tabular-nums">{formatBRL(row.baseCents)}</td>
                    <td className="text-right tabular-nums">{row.pct}%</td>
                    <td className="text-right font-medium tabular-nums">
                      {formatBRL(row.commissionCents)}
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
