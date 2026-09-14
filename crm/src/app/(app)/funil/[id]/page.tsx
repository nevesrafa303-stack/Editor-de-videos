import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePermission } from "@/server/tenant";
import { can } from "@/server/permissions";
import { convertLeadToPatient } from "@/server/actions/leads";
import { SOURCE_LABEL, STAGE_LABEL, type Stage } from "@/domain/funnel";
import { firstName, formatPhone, whatsappLink } from "@/lib/br";
import { formatBRL } from "@/lib/money";
import { formatDateTime, relativeDays } from "@/lib/date";
import { Badge, Button, Card, CardHeader, LinkButton, PageHeader } from "@/components/ui";
import { IconWhatsapp } from "@/components/icons";
import { ActivityForm, LeadEditForm, LostForm } from "./forms";

export const metadata: Metadata = { title: "Lead" };

const ACTIVITY_LABEL: Record<string, string> = {
  NOTA: "Nota",
  LIGACAO: "Ligação",
  WHATSAPP: "WhatsApp",
  EMAIL: "E-mail",
  REUNIAO: "Reunião",
  MUDANCA_ETAPA: "Etapa",
};

export default async function LeadPage({ params }: { params: Promise<{ id: string }> }) {
  const { db, session } = await requirePermission("leads:read");
  const { id } = await params;

  const [lead, owners] = await Promise.all([
    db.lead.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, name: true } },
        patient: { select: { id: true, name: true } },
        activities: {
          orderBy: { createdAt: "desc" },
          include: { user: { select: { name: true } } },
        },
      },
    }),
    db.user.findMany({ where: { active: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  if (!lead) notFound();

  const canWrite = can(session.role, "leads:write");
  const stage = lead.stage as Stage;

  return (
    <>
      <PageHeader
        title={lead.name}
        description={`${formatPhone(lead.phone)} · ${SOURCE_LABEL[lead.source] ?? lead.source}`}
        action={
          <>
            <LinkButton href="/funil" variant="secondary">
              Voltar ao funil
            </LinkButton>
            <a
              href={whatsappLink(lead.phone, `Olá ${firstName(lead.name)}!`)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3.5 py-2 text-sm font-medium text-white shadow-xs transition hover:bg-emerald-700"
            >
              <IconWhatsapp /> WhatsApp
            </a>
          </>
        }
      />

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <Badge tone={stage === "GANHO" ? "success" : stage === "PERDIDO" ? "danger" : "info"}>
          {STAGE_LABEL[stage]}
        </Badge>
        {lead.valueCents > 0 ? <Badge tone="brand">{formatBRL(lead.valueCents)}</Badge> : null}
        {lead.interest ? <Badge>{lead.interest}</Badge> : null}
        {lead.nextFollowUpAt ? (
          <Badge tone={lead.nextFollowUpAt < new Date() ? "danger" : "info"}>
            Retorno {relativeDays(lead.nextFollowUpAt)}
          </Badge>
        ) : null}
        {lead.patient ? (
          <Link href={`/pacientes/${lead.patient.id}`}>
            <Badge tone="success">Paciente: {lead.patient.name}</Badge>
          </Link>
        ) : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
        <div className="space-y-4">
          {canWrite ? (
            <Card>
              <CardHeader
                title="Registrar contato"
                description="Cada tentativa registrada evita o lead morrer no esquecimento."
              />
              <ActivityForm leadId={lead.id} />
            </Card>
          ) : null}

          <Card>
            <CardHeader title="Linha do tempo" description={`${lead.activities.length} registros`} />
            {lead.activities.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-slate-400">
                Nenhum contato registrado ainda.
              </p>
            ) : (
              <ol className="divide-y divide-slate-100">
                {lead.activities.map((activity) => (
                  <li key={activity.id} className="flex gap-3 px-5 py-4">
                    <span className="mt-1">
                      <Badge tone={activity.type === "MUDANCA_ETAPA" ? "brand" : "neutral"}>
                        {ACTIVITY_LABEL[activity.type] ?? activity.type}
                      </Badge>
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm text-slate-700">{activity.content}</p>
                      <p className="mt-0.5 text-xs text-slate-400">
                        {formatDateTime(activity.createdAt)}
                        {activity.user ? ` · ${activity.user.name}` : ""}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </Card>
        </div>

        <div className="space-y-4">
          {canWrite && can(session.role, "patients:write") && !lead.patient ? (
            <Card>
              <CardHeader
                title="Fechou o tratamento?"
                description="Cria o paciente mantendo a origem do lead para o relatório."
              />
              <form action={convertLeadToPatient} className="p-5">
                <input type="hidden" name="id" value={lead.id} />
                <Button type="submit" size="lg" className="w-full">
                  Converter em paciente
                </Button>
              </form>
            </Card>
          ) : null}

          {canWrite ? (
            <Card>
              <CardHeader title="Dados do lead" />
              <LeadEditForm
                lead={{
                  id: lead.id,
                  name: lead.name,
                  phone: lead.phone,
                  email: lead.email,
                  source: lead.source,
                  interest: lead.interest,
                  valueCents: lead.valueCents,
                  ownerId: lead.owner?.id ?? null,
                  nextFollowUpAt: lead.nextFollowUpAt
                    ? lead.nextFollowUpAt.toISOString().slice(0, 10)
                    : null,
                }}
                owners={owners}
              />
            </Card>
          ) : null}

          {canWrite && stage !== "PERDIDO" && stage !== "GANHO" ? (
            <Card>
              <CardHeader title="Não deu certo" />
              <LostForm leadId={lead.id} />
            </Card>
          ) : null}

          {lead.lostReason ? (
            <Card className="p-5">
              <p className="text-xs font-medium tracking-wide text-slate-500 uppercase">
                Motivo da perda
              </p>
              <p className="mt-1 text-sm text-slate-700">{lead.lostReason}</p>
            </Card>
          ) : null}
        </div>
      </div>
    </>
  );
}
