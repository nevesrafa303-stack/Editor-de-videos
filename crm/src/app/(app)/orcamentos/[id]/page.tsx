import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePermission } from "@/server/tenant";
import { can } from "@/server/permissions";
import { removePlanItem, togglePlanItemDone } from "@/server/actions/plans";
import { planProgress, planTotals } from "@/domain/plan";
import { formatBRL } from "@/lib/money";
import { formatDate } from "@/lib/date";
import { formatCPF, formatPhone } from "@/lib/br";
import { Alert, Badge, Card, CardHeader, LinkButton, PageHeader } from "@/components/ui";
import { AddItemForm, ApproveForm, PlanSettingsForm } from "./forms";
import type { PlanStatus } from "@/generated/prisma/enums";

export const metadata: Metadata = { title: "Orçamento" };

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

export default async function PlanPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ aprovado?: string }>;
}) {
  const { db, session } = await requirePermission("plans:read");
  const { id } = await params;
  const { aprovado } = await searchParams;

  const [plan, procedures] = await Promise.all([
    db.treatmentPlan.findUnique({
      where: { id },
      include: {
        patient: true,
        professional: { select: { name: true, councilNumber: true } },
        items: { orderBy: { id: "asc" }, include: { procedure: { select: { category: true } } } },
        installments: { orderBy: { number: "asc" } },
      },
    }),
    db.procedure.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, priceCents: true, category: true },
    }),
  ]);

  if (!plan) notFound();

  const totals = planTotals(plan.items, plan.discountCents);
  const locked = plan.status === "APROVADO" || plan.status === "CONCLUIDO";
  const canWrite = can(session.role, "plans:write");
  const canApprove = can(session.role, "finance:write");

  return (
    <>
      <PageHeader
        title={`ORC-${String(plan.number).padStart(4, "0")}`}
        description={`${plan.patient.name} · criado em ${formatDate(plan.createdAt)}`}
        action={
          <>
            <LinkButton href="/orcamentos" variant="secondary" className="no-print">
              Voltar
            </LinkButton>
            <LinkButton
              href={`/pacientes/${plan.patient.id}`}
              variant="secondary"
              className="no-print"
            >
              Ver paciente
            </LinkButton>
          </>
        }
      />

      {aprovado ? (
        <div className="mb-4 no-print">
          <Alert tone="success">
            Orcamento aprovado. {aprovado}{" "}
            {aprovado === "1" ? "parcela gerada" : "parcelas geradas"} no financeiro.
          </Alert>
        </div>
      ) : null}

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <Badge tone={STATUS_TONE[plan.status]}>{STATUS_LABEL[plan.status]}</Badge>
        <Badge tone="brand">{formatBRL(totals.totalCents)}</Badge>
        {totals.itemCount > 0 ? (
          <Badge>
            {totals.doneCount}/{totals.itemCount} executados ({planProgress(totals)}%)
          </Badge>
        ) : null}
        {plan.approvedAt ? <Badge tone="success">Aprovado em {formatDate(plan.approvedAt)}</Badge> : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <Card>
            <CardHeader
              title="Itens do tratamento"
              description={
                locked
                  ? "Orçamento aprovado: itens travados, mas você pode marcar o que foi executado."
                  : "Adicione procedimentos do catalogo ou itens avulsos."
              }
            />

            {plan.items.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-slate-400">
                Nenhum item adicionado.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="table-base">
                  <thead>
                    <tr>
                      <th>Procedimento</th>
                      <th>Local</th>
                      <th className="text-right">Qtd.</th>
                      <th className="text-right">Unitário</th>
                      <th className="text-right">Subtotal</th>
                      <th className="no-print">Execucao</th>
                    </tr>
                  </thead>
                  <tbody>
                    {plan.items.map((item) => (
                      <tr key={item.id}>
                        <td className="font-medium text-slate-800">
                          {item.description}
                          {item.done ? (
                            <Badge tone="success" className="ml-2">
                              Feito
                            </Badge>
                          ) : null}
                        </td>
                        <td className="text-slate-600">
                          {item.teeth.length > 0
                            ? `Dentes ${item.teeth.join(", ")}`
                            : (item.region ?? "—")}
                        </td>
                        <td className="text-right tabular-nums">{item.quantity}</td>
                        <td className="text-right tabular-nums">{formatBRL(item.unitPriceCents)}</td>
                        <td className="text-right font-medium tabular-nums">
                          {formatBRL(item.quantity * item.unitPriceCents)}
                        </td>
                        <td className="no-print">
                          {canWrite ? (
                            <div className="flex gap-1">
                              <form action={togglePlanItemDone}>
                                <input type="hidden" name="id" value={item.id} />
                                <button
                                  type="submit"
                                  className="rounded border border-slate-200 px-2 py-0.5 text-[11px] font-medium text-slate-600 hover:bg-slate-50"
                                >
                                  {item.done ? "Desfazer" : "Marcar feito"}
                                </button>
                              </form>

                              {!locked ? (
                                <form action={removePlanItem}>
                                  <input type="hidden" name="id" value={item.id} />
                                  <button
                                    type="submit"
                                    className="rounded border border-rose-200 px-2 py-0.5 text-[11px] font-medium text-rose-600 hover:bg-rose-50"
                                  >
                                    Remover
                                  </button>
                                </form>
                              ) : null}
                            </div>
                          ) : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={4} className="text-right text-slate-500">
                        Subtotal
                      </td>
                      <td className="text-right tabular-nums">{formatBRL(totals.subtotalCents)}</td>
                      <td className="no-print" />
                    </tr>
                    {totals.discountCents > 0 ? (
                      <tr>
                        <td colSpan={4} className="text-right text-slate-500">
                          Desconto
                        </td>
                        <td className="text-right text-rose-600 tabular-nums">
                          − {formatBRL(totals.discountCents)}
                        </td>
                        <td className="no-print" />
                      </tr>
                    ) : null}
                    <tr>
                      <td colSpan={4} className="text-right font-semibold text-slate-700">
                        Total
                      </td>
                      <td className="text-right text-base font-semibold text-slate-900 tabular-nums">
                        {formatBRL(totals.totalCents)}
                      </td>
                      <td className="no-print" />
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}

            {canWrite && !locked ? (
              <div className="border-t border-slate-100 no-print">
                <AddItemForm planId={plan.id} procedures={procedures} />
              </div>
            ) : null}
          </Card>

          {plan.installments.length > 0 ? (
            <Card>
              <CardHeader
                title="Parcelas geradas"
                description="Gerenciadas na tela de financeiro."
              />
              <div className="overflow-x-auto">
                <table className="table-base">
                  <thead>
                    <tr>
                      <th>Parcela</th>
                      <th>Vencimento</th>
                      <th className="text-right">Valor</th>
                      <th className="text-right">Pago</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {plan.installments.map((installment) => (
                      <tr key={installment.id}>
                        <td className="tabular-nums">
                          {installment.number}/{installment.totalCount}
                        </td>
                        <td className="tabular-nums">{formatDate(installment.dueDate)}</td>
                        <td className="text-right tabular-nums">
                          {formatBRL(installment.amountCents)}
                        </td>
                        <td className="text-right tabular-nums">
                          {formatBRL(installment.paidCents)}
                        </td>
                        <td>
                          <Badge
                            tone={
                              installment.status === "PAGA"
                                ? "success"
                                : installment.status === "CANCELADA"
                                  ? "neutral"
                                  : "warning"
                            }
                          >
                            {installment.status === "PAGA"
                              ? "Paga"
                              : installment.status === "CANCELADA"
                                ? "Cancelada"
                                : "Em aberto"}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          ) : null}
        </div>

        <div className="space-y-4">
          <Card className="p-5">
            <h2 className="text-sm font-semibold text-slate-900">Paciente</h2>
            <dl className="mt-3 space-y-1.5 text-sm">
              <div>
                <dt className="inline text-slate-500">Nome: </dt>
                <dd className="inline text-slate-800">
                  <Link href={`/pacientes/${plan.patient.id}`} className="hover:text-brand-700">
                    {plan.patient.name}
                  </Link>
                </dd>
              </div>
              <div>
                <dt className="inline text-slate-500">Telefone: </dt>
                <dd className="inline text-slate-800">{formatPhone(plan.patient.phone)}</dd>
              </div>
              {plan.patient.document ? (
                <div>
                  <dt className="inline text-slate-500">CPF: </dt>
                  <dd className="inline text-slate-800">{formatCPF(plan.patient.document)}</dd>
                </div>
              ) : null}
              {plan.professional ? (
                <div>
                  <dt className="inline text-slate-500">Profissional: </dt>
                  <dd className="inline text-slate-800">
                    {plan.professional.name}
                    {plan.professional.councilNumber ? ` · ${plan.professional.councilNumber}` : ""}
                  </dd>
                </div>
              ) : null}
            </dl>

            {plan.notes ? (
              <p className="mt-4 border-t border-slate-100 pt-3 text-sm text-slate-600">
                {plan.notes}
              </p>
            ) : null}
          </Card>

          {canApprove && !locked && plan.items.length > 0 ? (
            <Card className="no-print">
              <CardHeader
                title="Aprovar orçamento"
                description="Gera as parcelas a receber e trava a edicao."
              />
              <ApproveForm planId={plan.id} totalCents={totals.totalCents} />
            </Card>
          ) : null}

          {canWrite ? (
            <Card className="no-print">
              <CardHeader title="Ajustes" />
              <PlanSettingsForm
                planId={plan.id}
                discountCents={plan.discountCents}
                notes={plan.notes}
                status={plan.status}
                locked={locked}
              />
            </Card>
          ) : null}
        </div>
      </div>
    </>
  );
}
