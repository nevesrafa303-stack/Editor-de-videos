import Link from "next/link";
import type { AgendaAppointment, AgendaBlock, AgendaProvider } from "@/modules/scheduling";
import { Badge, cn, type Tone } from "@/ui";
import { formatBRL } from "@/shared/format";

/** Altura de um minuto. 1.2px deixa uma consulta de 30 min legivel sem rolar. */
const PX_POR_MINUTO = 1.2;

export const STATUS: Record<string, { rotulo: string; tom: Tone; classe: string }> = {
  scheduled: { rotulo: "A confirmar", tom: "neutral", classe: "border-dashed bg-surface" },
  confirmed: { rotulo: "Confirmado", tom: "structure", classe: "bg-structure-soft" },
  arrived: { rotulo: "Na recepção", tom: "structure", classe: "bg-structure-soft" },
  in_progress: { rotulo: "Em atendimento", tom: "accent", classe: "bg-accent-soft" },
  completed: { rotulo: "Atendido", tom: "positive", classe: "bg-positive-soft" },
  no_show: { rotulo: "Faltou", tom: "warning", classe: "bg-warning-soft" },
  canceled: { rotulo: "Cancelado", tom: "critical", classe: "bg-sunken opacity-60" },
};

const MOTIVO_BLOQUEIO: Record<string, string> = {
  lunch: "Almoço",
  vacation: "Férias",
  holiday: "Feriado",
  training: "Treinamento",
  maintenance: "Manutenção",
  other: "Bloqueado",
};

export function hhmm(minuto: number): string {
  const h = Math.floor(minuto / 60);
  const m = minuto % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function Grade({
  window: janela,
  providers,
  appointments,
  blocks,
  agora,
}: {
  window: { startMinute: number; endMinute: number };
  providers: AgendaProvider[];
  appointments: AgendaAppointment[];
  blocks: AgendaBlock[];
  /** Minuto local atual, ou null se a grade nao e de hoje. */
  agora: number | null;
}) {
  const altura = (janela.endMinute - janela.startMinute) * PX_POR_MINUTO;
  const horas: number[] = [];
  for (let m = janela.startMinute; m <= janela.endMinute; m += 60) horas.push(m);

  const topo = (minuto: number) => (minuto - janela.startMinute) * PX_POR_MINUTO;

  return (
    <div className="overflow-x-auto">
      <div
        className="grid min-w-[640px] gap-px bg-line"
        style={{ gridTemplateColumns: `64px repeat(${providers.length}, minmax(148px, 1fr))` }}
      >
        {/* cabeçalho */}
        <div className="bg-surface" />
        {providers.map((p) => (
          <div key={p.membershipId} className="bg-surface px-3 py-2.5">
            <span className="flex items-center gap-2">
              <span
                aria-hidden
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: p.color }}
              />
              <span className="truncate text-sm font-semibold text-ink">{p.name}</span>
            </span>
            <span className="num mt-0.5 block truncate text-xs text-muted">
              {p.startMinute !== null && p.endMinute !== null
                ? `${hhmm(p.startMinute)}–${hhmm(p.endMinute)}`
                : "Sem expediente"}
              {p.specialty ? ` · ${p.specialty}` : ""}
            </span>
          </div>
        ))}

        {/* régua */}
        <div className="relative bg-surface" style={{ height: altura }}>
          {horas.map((m) => (
            <span
              key={m}
              className="num absolute right-2 -translate-y-1/2 text-[11px] text-muted"
              style={{ top: topo(m) }}
            >
              {hhmm(m)}
            </span>
          ))}
        </div>

        {/* colunas */}
        {providers.map((p) => {
          const doDia = appointments.filter((a) => a.providerId === p.membershipId);
          const bloqueios = blocks.filter((b) => b.providerId === p.membershipId);

          return (
            <div
              key={p.membershipId}
              className="relative bg-surface"
              style={{
                height: altura,
                backgroundImage:
                  "repeating-linear-gradient(to bottom, var(--color-line) 0 1px, transparent 1px " +
                  `${60 * PX_POR_MINUTO}px)`,
              }}
            >
              {/* fora do expediente */}
              {p.startMinute !== null && p.startMinute > janela.startMinute ? (
                <div
                  className="absolute inset-x-0 bg-sunken/70"
                  style={{ top: 0, height: topo(p.startMinute) }}
                />
              ) : null}
              {p.endMinute !== null && p.endMinute < janela.endMinute ? (
                <div
                  className="absolute inset-x-0 bg-sunken/70"
                  style={{ top: topo(p.endMinute), bottom: 0 }}
                />
              ) : null}

              {bloqueios.map((b) => (
                <div
                  key={b.id}
                  title={b.notes ?? MOTIVO_BLOQUEIO[b.reason] ?? b.reason}
                  className="absolute inset-x-1 rounded border border-line bg-[repeating-linear-gradient(45deg,var(--color-sunken)_0_6px,transparent_6px_12px)] px-2 py-1"
                  style={{ top: topo(b.startMinute), height: (b.endMinute - b.startMinute) * PX_POR_MINUTO }}
                >
                  <span className="text-[11px] font-medium text-muted">
                    {MOTIVO_BLOQUEIO[b.reason] ?? b.reason}
                  </span>
                </div>
              ))}

              {doDia.map((a) => {
                const meta = STATUS[a.status] ?? STATUS.scheduled;
                const duracao = a.endMinute - a.startMinute;

                return (
                  <Link
                    key={a.id}
                    href={`/pacientes/${a.patientId}`}
                    title={`${hhmm(a.startMinute)}–${hhmm(a.endMinute)} · ${a.patientName}${a.procedure ? ` · ${a.procedure}` : ""}`}
                    className={cn(
                      "absolute inset-x-1 overflow-hidden rounded border-l-3 border border-line px-2 py-1 transition hover:shadow-sm",
                      meta?.classe,
                    )}
                    style={{
                      top: topo(a.startMinute),
                      height: Math.max(duracao * PX_POR_MINUTO, 22),
                      borderLeftColor: p.color,
                    }}
                  >
                    <span
                      className={cn(
                        "num block text-[11px] leading-tight text-muted",
                        a.status === "canceled" && "line-through",
                      )}
                    >
                      {hhmm(a.startMinute)}
                    </span>
                    <span
                      className={cn(
                        "block truncate text-[13px] leading-tight font-medium text-ink",
                        a.status === "canceled" && "line-through",
                      )}
                    >
                      {a.patientName}
                    </span>
                    {duracao >= 45 && a.procedure ? (
                      <span className="block truncate text-[11px] leading-tight text-muted">
                        {a.procedure}
                      </span>
                    ) : null}
                    {duracao >= 75 && a.priceCents ? (
                      <span className="num mt-0.5 block text-[11px] text-muted">
                        {formatBRL(a.priceCents)}
                      </span>
                    ) : null}
                  </Link>
                );
              })}

              {/* linha do agora */}
              {agora !== null && agora >= janela.startMinute && agora <= janela.endMinute ? (
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-x-0 border-t-2 border-critical/70"
                  style={{ top: topo(agora) }}
                />
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2 px-5 py-3">
        {Object.entries(STATUS).map(([chave, meta]) => (
          <Badge key={chave} tone={meta.tom}>
            {meta.rotulo}
          </Badge>
        ))}
      </div>
    </div>
  );
}
