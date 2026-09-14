import type { Metadata } from "next";
import Link from "next/link";
import { requirePermission } from "@/server/tenant";
import { can } from "@/server/permissions";
import { Badge, Card, EmptyState, Input, LinkButton, PageHeader } from "@/components/ui";
import { IconPlus, IconSearch } from "@/components/icons";
import { formatCPF, formatPhone } from "@/lib/br";
import { age, formatDate } from "@/lib/date";
import { formatBRL } from "@/lib/money";

export const metadata: Metadata = { title: "Pacientes" };

const PAGE_SIZE = 25;

export default async function PatientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; pagina?: string; inativos?: string }>;
}) {
  const { db, session } = await requirePermission("patients:read");
  const { q = "", pagina, inativos } = await searchParams;

  const page = Math.max(1, Number(pagina) || 1);
  const showInactive = inativos === "1";
  const term = q.trim();

  const where = {
    ...(showInactive ? {} : { active: true }),
    ...(term
      ? {
          OR: [
            { name: { contains: term, mode: "insensitive" as const } },
            { phone: { contains: term.replace(/\D/g, "") } },
            { document: { contains: term.replace(/\D/g, "") } },
            { email: { contains: term, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [patients, total] = await Promise.all([
    db.patient.findMany({
      where,
      orderBy: { name: "asc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        appointments: {
          where: { status: { in: ["AGENDADO", "CONFIRMADO"] }, startsAt: { gte: new Date() } },
          orderBy: { startsAt: "asc" },
          take: 1,
          select: { startsAt: true },
        },
        installments: {
          where: { status: "ABERTA" },
          select: { amountCents: true, paidCents: true },
        },
      },
    }),
    db.patient.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <>
      <PageHeader
        title="Pacientes"
        description={`${total} ${total === 1 ? "paciente" : "pacientes"} ${showInactive ? "no total" : "ativos"}.`}
        action={
          can(session.role, "patients:write") ? (
            <LinkButton href="/pacientes/novo">
              <IconPlus /> Novo paciente
            </LinkButton>
          ) : null
        }
      />

      <Card className="mb-4 p-4">
        <form className="flex flex-wrap items-end gap-3">
          <label className="min-w-64 flex-1">
            <span className="field-label">Buscar</span>
            <span className="relative block">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
                <IconSearch />
              </span>
              <Input
                name="q"
                defaultValue={q}
                className="pl-9"
                placeholder="Nome, telefone, CPF ou e-mail"
              />
            </span>
          </label>

          <label className="flex items-center gap-2 pb-2 text-sm text-slate-600">
            <input
              type="checkbox"
              name="inativos"
              value="1"
              defaultChecked={showInactive}
              className="size-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            />
            Incluir inativos
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
        {patients.length === 0 ? (
          <EmptyState
            title={term ? "Nenhum paciente encontrado" : "Nenhum paciente cadastrado"}
            description={
              term
                ? "Tente outro nome, telefone ou CPF."
                : "Cadastre o primeiro paciente ou converta um lead do funil."
            }
            action={
              can(session.role, "patients:write") ? (
                <LinkButton href="/pacientes/novo" variant="subtle">
                  Cadastrar paciente
                </LinkButton>
              ) : null
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Paciente</th>
                  <th>Contato</th>
                  <th>CPF</th>
                  <th>Próxima consulta</th>
                  <th className="text-right">Em aberto</th>
                </tr>
              </thead>
              <tbody>
                {patients.map((patient) => {
                  const openCents = patient.installments.reduce(
                    (sum, installment) => sum + installment.amountCents - installment.paidCents,
                    0,
                  );
                  const next = patient.appointments[0];

                  return (
                    <tr key={patient.id}>
                      <td>
                        <Link
                          href={`/pacientes/${patient.id}`}
                          className="font-medium text-slate-900 hover:text-brand-700"
                        >
                          {patient.name}
                        </Link>
                        <div className="flex items-center gap-2">
                          {patient.birthDate ? (
                            <span className="text-xs text-slate-500">
                              {age(patient.birthDate)} anos
                            </span>
                          ) : null}
                          {!patient.active ? <Badge tone="neutral">Inativo</Badge> : null}
                        </div>
                      </td>
                      <td>
                        <div>{formatPhone(patient.phone)}</div>
                        {patient.email ? (
                          <div className="text-xs text-slate-500">{patient.email}</div>
                        ) : null}
                      </td>
                      <td className="tabular-nums">
                        {patient.document ? formatCPF(patient.document) : "—"}
                      </td>
                      <td>
                        {next ? (
                          <Badge tone="info">{formatDate(next.startsAt)}</Badge>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="text-right tabular-nums">
                        {openCents > 0 ? (
                          <span className="font-medium text-amber-700">{formatBRL(openCents)}</span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {totalPages > 1 ? (
        <nav className="mt-4 flex items-center justify-between text-sm text-slate-600">
          <span>
            Pagina {page} de {totalPages}
          </span>
          <span className="flex gap-2">
            {page > 1 ? (
              <LinkButton
                variant="secondary"
                size="sm"
                href={`/pacientes?q=${encodeURIComponent(q)}&pagina=${page - 1}`}
              >
                Anterior
              </LinkButton>
            ) : null}
            {page < totalPages ? (
              <LinkButton
                variant="secondary"
                size="sm"
                href={`/pacientes?q=${encodeURIComponent(q)}&pagina=${page + 1}`}
              >
                Próxima
              </LinkButton>
            ) : null}
          </span>
        </nav>
      ) : null}
    </>
  );
}
