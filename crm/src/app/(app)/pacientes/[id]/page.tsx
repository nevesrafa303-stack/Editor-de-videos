import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePermission } from "@/server/tenant";
import { can } from "@/server/permissions";
import { updatePatient, setPatientActive } from "@/server/actions/patients";
import { planTotals } from "@/domain/plan";
import { parseChart, chartSummary, STATUS_LABEL as TOOTH_LABEL } from "@/domain/odontogram";
import { ANAMNESIS_QUESTIONS } from "@/domain/anamnesis";
import { SOURCE_LABEL } from "@/domain/funnel";
import { firstName, formatCPF, formatPhone, whatsappLink } from "@/lib/br";
import { formatBRL } from "@/lib/money";
import { age, formatDate, formatDateTime } from "@/lib/date";
import { Alert, Badge, Card, CardHeader, EmptyState, LinkButton, PageHeader, cn } from "@/components/ui";
import { IconWhatsapp } from "@/components/icons";
import { PatientForm } from "@/components/patient-form";
import { Odontogram } from "@/components/odontogram";
import { AnamnesisForm, AttachmentForm, ClinicalNoteForm } from "./clinical-forms";

export const metadata: Metadata = { title: "Paciente" };

const TABS = [
  { key: "resumo", label: "Resumo" },
  { key: "prontuario", label: "Prontuário" },
  { key: "orcamentos", label: "Orçamentos" },
  { key: "financeiro", label: "Financeiro" },
  { key: "dados", label: "Cadastro" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default async function PatientPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ aba?: string }>;
}) {
  const { db, session } = await requirePermission("patients:read");
  const { id } = await params;
  const { aba } = await searchParams;

  const canReadClinical = can(session.role, "clinical:read");
  const canWriteClinical = can(session.role, "clinical:write");
  const canWritePatient = can(session.role, "patients:write");

  const patient = await db.patient.findUnique({
    where: { id },
    include: {
      anamnesis: true,
      toothChart: true,
      lead: { select: { id: true, source: true } },
      appointments: {
        orderBy: { startsAt: "desc" },
        take: 30,
        include: {
          professional: { select: { name: true } },
          procedure: { select: { name: true } },
        },
      },
      plans: {
        orderBy: { createdAt: "desc" },
        include: { items: true },
      },
      installments: { orderBy: { dueDate: "asc" }, include: { plan: { select: { number: true } } } },
      notes_: {
        orderBy: { createdAt: "desc" },
        include: { professional: { select: { name: true, councilNumber: true } } },
      },
      attachments: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!patient) notFound();

  const tab: TabKey = TABS.some((item) => item.key === aba) ? (aba as TabKey) : "resumo";
  const chart = parseChart(patient.toothChart?.data);
  const summary = chartSummary(chart);

  const openCents = patient.installments
    .filter((installment) => installment.status === "ABERTA")
    .reduce((sum, installment) => sum + installment.amountCents - installment.paidCents, 0);

  const paidCents = patient.installments.reduce(
    (sum, installment) => sum + installment.paidCents,
    0,
  );

  const upcoming = patient.appointments.filter(
    (appointment) =>
      appointment.startsAt >= new Date() &&
      (appointment.status === "AGENDADO" || appointment.status === "CONFIRMADO"),
  );

  const answers = (patient.anamnesis?.answers ?? {}) as Record<string, boolean>;
  const flaggedAnswers = ANAMNESIS_QUESTIONS.filter((question) => answers[question.key]);

  return (
    <>
      <PageHeader
        title={patient.name}
        description={[
          formatPhone(patient.phone),
          patient.birthDate ? `${age(patient.birthDate)} anos` : null,
          patient.document ? formatCPF(patient.document) : null,
        ]
          .filter(Boolean)
          .join(" · ")}
        action={
          <>
            <a
              href={whatsappLink(patient.phone, `Olá ${firstName(patient.name)}!`)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3.5 py-2 text-sm font-medium text-white shadow-xs transition hover:bg-emerald-700"
            >
              <IconWhatsapp /> WhatsApp
            </a>
            {can(session.role, "plans:write") ? (
              <LinkButton href="/orcamentos" variant="secondary">
                Novo orçamento
              </LinkButton>
            ) : null}
          </>
        }
      />

      {patient.anamnesis?.allergies ? (
        <div className="mb-4">
          <Alert>
            <strong>Alergias:</strong> {patient.anamnesis.allergies}
          </Alert>
        </div>
      ) : null}

      {!patient.active ? (
        <div className="mb-4">
          <Alert tone="info">Este paciente esta marcado como inativo.</Alert>
        </div>
      ) : null}

      <nav className="mb-5 flex gap-1 overflow-x-auto border-b border-slate-200">
        {TABS.filter((item) => item.key !== "prontuario" || canReadClinical).map((item) => (
          <Link
            key={item.key}
            href={`/pacientes/${patient.id}?aba=${item.key}`}
            className={cn(
              "-mb-px border-b-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap transition",
              tab === item.key
                ? "border-brand-600 text-brand-700"
                : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700",
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      {tab === "resumo" ? (
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="p-5">
            <p className="text-xs font-medium tracking-wide text-slate-500 uppercase">Em aberto</p>
            <p
              className={cn(
                "mt-2 text-2xl font-semibold tabular-nums",
                openCents > 0 ? "text-amber-600" : "text-slate-900",
              )}
            >
              {formatBRL(openCents)}
            </p>
            <p className="mt-1 text-xs text-slate-500">{formatBRL(paidCents)} já recebidos</p>
          </Card>

          <Card className="p-5">
            <p className="text-xs font-medium tracking-wide text-slate-500 uppercase">
              Próxima consulta
            </p>
            <p className="mt-2 text-lg font-semibold text-slate-900">
              {upcoming.length > 0 && upcoming[upcoming.length - 1]
                ? formatDateTime(upcoming[upcoming.length - 1]!.startsAt)
                : "Sem agendamento"}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {patient.appointments.length} atendimentos no historico
            </p>
          </Card>

          <Card className="p-5">
            <p className="text-xs font-medium tracking-wide text-slate-500 uppercase">Origem</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">
              {patient.source ? (SOURCE_LABEL[patient.source] ?? patient.source) : "Não informada"}
            </p>
            {patient.lead ? (
              <Link
                href={`/funil/${patient.lead.id}`}
                className="mt-1 inline-block text-xs text-brand-700 hover:underline"
              >
                Ver histórico do lead
              </Link>
            ) : null}
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader title="Histórico de atendimentos" />
            {patient.appointments.length === 0 ? (
              <EmptyState title="Nenhum atendimento registrado" />
            ) : (
              <div className="overflow-x-auto">
                <table className="table-base">
                  <thead>
                    <tr>
                      <th>Data</th>
                      <th>Profissional</th>
                      <th>Procedimento</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {patient.appointments.map((appointment) => (
                      <tr key={appointment.id}>
                        <td className="whitespace-nowrap tabular-nums">
                          {formatDateTime(appointment.startsAt)}
                        </td>
                        <td>{appointment.professional.name}</td>
                        <td>{appointment.procedure?.name ?? "—"}</td>
                        <td>
                          <Badge
                            tone={
                              appointment.status === "ATENDIDO"
                                ? "success"
                                : appointment.status === "FALTOU"
                                  ? "warning"
                                  : appointment.status === "CANCELADO"
                                    ? "danger"
                                    : "info"
                            }
                          >
                            {appointment.status.toLowerCase()}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          <Card>
            <CardHeader title="Alertas de saúde" />
            {flaggedAnswers.length === 0 && !patient.anamnesis ? (
              <EmptyState
                title="Anamnese não preenchida"
                description={canWriteClinical ? "Preencha na aba Prontuário." : undefined}
              />
            ) : (
              <ul className="space-y-2 p-5 text-sm text-slate-700">
                {flaggedAnswers.length === 0 ? (
                  <li className="text-slate-500">Nenhuma condicao sinalizada.</li>
                ) : null}
                {flaggedAnswers.map((question) => (
                  <li key={question.key} className="flex gap-2">
                    <span className="text-amber-500">•</span>
                    {question.label}
                  </li>
                ))}
                {patient.anamnesis?.medications ? (
                  <li className="border-t border-slate-100 pt-2 text-slate-600">
                    <strong className="text-slate-700">Medicamentos:</strong>{" "}
                    {patient.anamnesis.medications}
                  </li>
                ) : null}
              </ul>
            )}
          </Card>
        </div>
      ) : null}

      {tab === "prontuario" && canReadClinical ? (
        <div className="space-y-4">
          <Card>
            <CardHeader
              title="Odontograma"
              description={
                summary.length > 0
                  ? summary.map((row) => `${row.count}x ${TOOTH_LABEL[row.status]}`).join(" · ")
                  : "Nenhuma alteracao registrada."
              }
            />
            <Odontogram patientId={patient.id} initial={chart} readOnly={!canWriteClinical} />
          </Card>

          {canWriteClinical ? (
            <Card>
              <CardHeader
                title="Nova evolução"
                description="O registro fica assinado com seu nome e não pode ser apagado."
              />
              <ClinicalNoteForm patientId={patient.id} />
            </Card>
          ) : null}

          <Card>
            <CardHeader title={`Evoluções (${patient.notes_.length})`} />
            {patient.notes_.length === 0 ? (
              <EmptyState title="Nenhuma evolução registrada" />
            ) : (
              <ol className="divide-y divide-slate-100">
                {patient.notes_.map((note) => (
                  <li key={note.id} className="px-5 py-4">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span>{formatDateTime(note.createdAt)}</span>
                      {note.professional ? (
                        <span>
                          · {note.professional.name}
                          {note.professional.councilNumber
                            ? ` (${note.professional.councilNumber})`
                            : ""}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1.5 text-sm whitespace-pre-wrap text-slate-700">
                      {note.content}
                    </p>
                    {note.performed ? (
                      <p className="mt-1.5 text-xs text-slate-500">
                        <strong>Realizado:</strong> {note.performed}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ol>
            )}
          </Card>

          <Card>
            <CardHeader
              title="Anamnese"
              description={
                patient.anamnesis
                  ? `Atualizada em ${formatDate(patient.anamnesis.updatedAt)}`
                  : "Ainda não preenchida."
              }
            />
            {canWriteClinical ? (
              <AnamnesisForm
                patientId={patient.id}
                answers={answers}
                allergies={patient.anamnesis?.allergies ?? null}
                medications={patient.anamnesis?.medications ?? null}
                conditions={patient.anamnesis?.conditions ?? null}
              />
            ) : (
              <ul className="space-y-1.5 p-5 text-sm text-slate-700">
                {flaggedAnswers.map((question) => (
                  <li key={question.key}>• {question.label}</li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <CardHeader
              title={`Anexos (${patient.attachments.length})`}
              description="Fotos de antes e depois exigem o consentimento de imagem no cadastro."
            />
            {canWriteClinical ? <AttachmentForm patientId={patient.id} /> : null}

            {patient.attachments.length === 0 ? (
              <EmptyState title="Nenhum anexo" />
            ) : (
              <ul className="divide-y divide-slate-100">
                {patient.attachments.map((attachment) => (
                  <li key={attachment.id} className="flex items-center justify-between gap-3 px-5 py-3">
                    <div className="min-w-0">
                      <a
                        href={attachment.url}
                        target="_blank"
                        rel="noreferrer"
                        className="truncate text-sm font-medium text-brand-700 hover:underline"
                      >
                        {attachment.caption || attachment.url}
                      </a>
                      <p className="text-xs text-slate-500">
                        {formatDate(attachment.createdAt)}
                      </p>
                    </div>
                    <Badge>{attachment.kind.replace("_", " ").toLowerCase()}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      ) : null}

      {tab === "orcamentos" ? (
        <Card className="overflow-hidden">
          <CardHeader title={`Orçamentos (${patient.plans.length})`} />
          {patient.plans.length === 0 ? (
            <EmptyState
              title="Nenhum orçamento"
              description="Crie um orçamento na tela de Orçamentos."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="table-base">
                <thead>
                  <tr>
                    <th>Número</th>
                    <th>Criado</th>
                    <th>Itens</th>
                    <th className="text-right">Total</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {patient.plans.map((plan) => {
                    const totals = planTotals(plan.items, plan.discountCents);
                    return (
                      <tr key={plan.id}>
                        <td>
                          <Link
                            href={`/orcamentos/${plan.id}`}
                            className="font-medium text-slate-900 tabular-nums hover:text-brand-700"
                          >
                            ORC-{String(plan.number).padStart(4, "0")}
                          </Link>
                        </td>
                        <td className="tabular-nums">{formatDate(plan.createdAt)}</td>
                        <td className="tabular-nums">
                          {totals.doneCount}/{totals.itemCount}
                        </td>
                        <td className="text-right font-medium tabular-nums">
                          {formatBRL(totals.totalCents)}
                        </td>
                        <td>
                          <Badge
                            tone={
                              plan.status === "APROVADO" || plan.status === "CONCLUIDO"
                                ? "success"
                                : plan.status === "RECUSADO"
                                  ? "danger"
                                  : "neutral"
                            }
                          >
                            {plan.status.toLowerCase()}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      ) : null}

      {tab === "financeiro" ? (
        <Card className="overflow-hidden">
          <CardHeader
            title="Parcelas"
            description={`${formatBRL(openCents)} em aberto · ${formatBRL(paidCents)} recebidos`}
          />
          {patient.installments.length === 0 ? (
            <EmptyState title="Nenhuma parcela" />
          ) : (
            <div className="overflow-x-auto">
              <table className="table-base">
                <thead>
                  <tr>
                    <th>Vencimento</th>
                    <th>Origem</th>
                    <th>Parcela</th>
                    <th className="text-right">Valor</th>
                    <th className="text-right">Pago</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {patient.installments.map((installment) => (
                    <tr key={installment.id}>
                      <td className="tabular-nums">{formatDate(installment.dueDate)}</td>
                      <td>
                        {installment.plan
                          ? `ORC-${String(installment.plan.number).padStart(4, "0")}`
                          : "Avulso"}
                      </td>
                      <td className="tabular-nums">
                        {installment.number}/{installment.totalCount}
                      </td>
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
                          {installment.status.toLowerCase()}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      ) : null}

      {tab === "dados" ? (
        <div className="max-w-3xl space-y-4">
          {canWritePatient ? (
            <PatientForm
              action={updatePatient}
              submitLabel="Salvar cadastro"
              patient={{
                id: patient.id,
                name: patient.name,
                phone: patient.phone,
                email: patient.email,
                document: patient.document,
                birthDate: patient.birthDate
                  ? patient.birthDate.toISOString().slice(0, 10)
                  : null,
                source: patient.source,
                notes: patient.notes,
                zipCode: patient.zipCode,
                street: patient.street,
                number: patient.number,
                city: patient.city,
                state: patient.state,
                consentData: !!patient.consentDataAt,
                consentImage: !!patient.consentImageAt,
              }}
            />
          ) : (
            <Card className="p-5 text-sm text-slate-600">
              Seu perfil pode consultar, mas não editar o cadastro.
            </Card>
          )}

          {canWritePatient ? (
            <Card className="flex items-center justify-between gap-4 p-5">
              <div>
                <p className="text-sm font-medium text-slate-800">
                  {patient.active ? "Inativar paciente" : "Reativar paciente"}
                </p>
                <p className="text-xs text-slate-500">
                  Inativar apenas esconde o paciente das listas; o histórico e preservado.
                </p>
              </div>
              <form action={setPatientActive}>
                <input type="hidden" name="id" value={patient.id} />
                <input type="hidden" name="active" value={String(!patient.active)} />
                <button
                  type="submit"
                  className="rounded-lg border border-slate-300 px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  {patient.active ? "Inativar" : "Reativar"}
                </button>
              </form>
            </Card>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
