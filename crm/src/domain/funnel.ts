/** Etapas do funil comercial e metricas derivadas. */

export const LEAD_STAGES = [
  "NOVO",
  "CONTATO",
  "AGENDADO",
  "AVALIACAO",
  "PROPOSTA",
  "GANHO",
  "PERDIDO",
] as const;

export type Stage = (typeof LEAD_STAGES)[number];

/** Etapas que aparecem no kanban, na ordem. GANHO/PERDIDO fecham o funil. */
export const PIPELINE_STAGES: Stage[] = [
  "NOVO",
  "CONTATO",
  "AGENDADO",
  "AVALIACAO",
  "PROPOSTA",
  "GANHO",
];

export const STAGE_LABEL: Record<Stage, string> = {
  NOVO: "Novo lead",
  CONTATO: "Em contato",
  AGENDADO: "Avaliação agendada",
  AVALIACAO: "Avaliação feita",
  PROPOSTA: "Proposta enviada",
  GANHO: "Fechado",
  PERDIDO: "Perdido",
};

export const STAGE_COLOR: Record<Stage, string> = {
  NOVO: "bg-slate-100 text-slate-700 border-slate-200",
  CONTATO: "bg-sky-50 text-sky-700 border-sky-200",
  AGENDADO: "bg-indigo-50 text-indigo-700 border-indigo-200",
  AVALIACAO: "bg-violet-50 text-violet-700 border-violet-200",
  PROPOSTA: "bg-amber-50 text-amber-700 border-amber-200",
  GANHO: "bg-emerald-50 text-emerald-700 border-emerald-200",
  PERDIDO: "bg-rose-50 text-rose-700 border-rose-200",
};

export const SOURCE_LABEL: Record<string, string> = {
  INDICACAO: "Indicação",
  INSTAGRAM: "Instagram",
  FACEBOOK: "Facebook",
  GOOGLE: "Google",
  TRAFEGO_PAGO: "Tráfego pago",
  WHATSAPP: "WhatsApp",
  SITE: "Site",
  PASSANTE: "Passante",
  OUTRO: "Outro",
};

export type LeadLike = { stage: Stage | string; valueCents: number };

export type FunnelMetrics = {
  total: number;
  open: number;
  won: number;
  lost: number;
  /** Ganhos / (ganhos + perdidos), em percentual. */
  conversionRate: number;
  /** Valor em centavos ainda em aberto no funil. */
  pipelineCents: number;
  wonCents: number;
  /** Ticket médio dos leads ganhos, em centavos. */
  averageTicketCents: number;
};

export function funnelMetrics(leads: LeadLike[]): FunnelMetrics {
  const won = leads.filter((lead) => lead.stage === "GANHO");
  const lost = leads.filter((lead) => lead.stage === "PERDIDO");
  const open = leads.filter(
    (lead) => lead.stage !== "GANHO" && lead.stage !== "PERDIDO",
  );

  const closed = won.length + lost.length;
  const wonCents = won.reduce((sum, lead) => sum + lead.valueCents, 0);

  return {
    total: leads.length,
    open: open.length,
    won: won.length,
    lost: lost.length,
    conversionRate: closed === 0 ? 0 : Math.round((won.length / closed) * 100),
    pipelineCents: open.reduce((sum, lead) => sum + lead.valueCents, 0),
    wonCents,
    averageTicketCents: won.length === 0 ? 0 : Math.round(wonCents / won.length),
  };
}

/** Agrupa leads por origem para o relatório de aquisicao. */
export function bySource<T extends { source: string; stage: Stage | string; valueCents: number }>(
  leads: T[],
): { source: string; total: number; won: number; wonCents: number; conversionRate: number }[] {
  const map = new Map<string, { total: number; won: number; wonCents: number; closed: number }>();

  for (const lead of leads) {
    const entry = map.get(lead.source) ?? { total: 0, won: 0, wonCents: 0, closed: 0 };
    entry.total += 1;
    if (lead.stage === "GANHO") {
      entry.won += 1;
      entry.wonCents += lead.valueCents;
      entry.closed += 1;
    }
    if (lead.stage === "PERDIDO") entry.closed += 1;
    map.set(lead.source, entry);
  }

  return [...map.entries()]
    .map(([source, entry]) => ({
      source,
      total: entry.total,
      won: entry.won,
      wonCents: entry.wonCents,
      conversionRate: entry.closed === 0 ? 0 : Math.round((entry.won / entry.closed) * 100),
    }))
    .sort((a, b) => b.total - a.total);
}
