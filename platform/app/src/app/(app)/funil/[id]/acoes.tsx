"use client";

import { useActionState, useState } from "react";
import type { ActivityRow, CardRow, TaskRow } from "@/modules/funnel";
import { ACTIVITY_KINDS } from "@/modules/funnel";
import {
  converterLeadAction,
  marcarAcaoAction,
  moverEtapaAction,
  reabrirAction,
  registrarContatoAction,
  registrarPerdaAction,
} from "@/modules/funnel/server-actions";
import { concluirTarefaAction } from "@/modules/funnel/server-actions";
import { EMPTY_STATE } from "@/shared/action-state";
import {
  Badge, Button, Field, FormError, Input, Notice, Panel, PanelHead, Select, Textarea,
} from "@/ui";
import { formatDateTime } from "@/shared/format";
import { CONTATO, PRIORIDADE, prazoDaAcao } from "../estado";

type Etapa = { id: string; name: string; isWon: boolean; isLost: boolean };
type Motivo = { id: string; name: string; category: string };

export function Acoes({
  card,
  lead,
  etapas,
  motivos,
  podeMover,
  podeConverter,
}: {
  card: CardRow;
  lead: { id: string; status: string; interest: string | null } | null;
  etapas: Etapa[];
  motivos: Motivo[];
  podeMover: boolean;
  podeConverter: boolean;
}) {
  const [mov, mover, movendo] = useActionState(moverEtapaAction, EMPTY_STATE);
  const [perda, perder, perdendo] = useActionState(registrarPerdaAction, EMPTY_STATE);
  const [conv, converter, convertendo] = useActionState(converterLeadAction, EMPTY_STATE);
  const [reab, reabrir, reabrindo] = useActionState(reabrirAction, EMPTY_STATE);
  const [mostrarPerda, setMostrarPerda] = useState(false);

  const destinos = etapas.filter((e) => !e.isWon && !e.isLost && e.id !== card.stageId);
  const aberta = card.status === "open";
  const precisaConverter = aberta && card.patientId === null && lead !== null;

  return (
    <Panel className="overflow-hidden">
      <PanelHead title="O que fazer agora" />

      <div className="space-y-4 px-5 py-4">
        {mov.error ? <Notice>{mov.error}</Notice> : null}
        {conv.error ? <Notice>{conv.error}</Notice> : null}
        {reab.error ? <Notice>{reab.error}</Notice> : null}

        {/* ------------------------------------------- virar paciente ---- */}
        {precisaConverter ? (
          <form action={converter} className="space-y-2">
            <input type="hidden" name="leadId" value={lead.id} />
            <input type="hidden" name="opportunityId" value={card.id} />
            <Notice tone="accent">
              Ainda é um contato, não um paciente. Converter cria o cadastro — e é o que
              permite orçar.
            </Notice>
            <Button type="submit" size="sm" disabled={convertendo} className="w-full">
              {convertendo ? "Convertendo…" : "Converter em paciente"}
            </Button>
          </form>
        ) : null}

        {/* --------------------------------------------------- mover ----- */}
        {podeMover && aberta && destinos.length > 0 ? (
          <form action={mover} className="flex flex-wrap items-end gap-2">
            <input type="hidden" name="opportunityId" value={card.id} />
            <Field label="Mover para" className="min-w-40 flex-1">
              <Select name="stageId" defaultValue="">
                <option value="" disabled>
                  Escolha a etapa…
                </option>
                {destinos.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Button
              type="submit"
              size="sm"
              variant="secondary"
              disabled={movendo}
              className="mb-0.5"
            >
              {movendo ? "Movendo…" : "Mover"}
            </Button>
          </form>
        ) : null}

        {/* --------------------------------------------------- ganhar ---- */}
        {aberta ? (
          <p className="rounded-md bg-sunken/60 px-3 py-2 text-xs text-muted">
            <strong className="text-ink-soft">Ganhar é o aceite do orçamento.</strong> Não há
            botão: assim o funil e o financeiro nunca discordam sobre quanto a clínica fechou.
          </p>
        ) : null}

        {/* --------------------------------------------------- perder ---- */}
        {podeMover && aberta ? (
          mostrarPerda ? (
            <form action={perder} className="space-y-2 rounded-md bg-sunken/60 p-3">
              <FormError error={perda.error} fieldErrors={perda.fieldErrors} />
              <input type="hidden" name="opportunityId" value={card.id} />

              <Field label="Por que perdeu" error={perda.fieldErrors?.lossReasonId?.[0]}>
                <Select name="lossReasonId" required defaultValue="">
                  <option value="" disabled>
                    Escolha o motivo…
                  </option>
                  {motivos.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </Select>
              </Field>

              <Textarea
                name="notes"
                rows={2}
                placeholder="O que a pessoa disse, com as palavras dela."
                aria-label="Observações da perda"
              />

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => setMostrarPerda(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" size="sm" variant="accent" disabled={perdendo}>
                  {perdendo ? "Registrando…" : "Registrar perda"}
                </Button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setMostrarPerda(true)}
              className="text-xs text-muted underline-offset-2 hover:text-critical hover:underline"
            >
              Registrar perda
            </button>
          )
        ) : null}

        {/* -------------------------------------------------- reabrir ---- */}
        {podeMover && !aberta ? (
          <form action={reabrir}>
            <input type="hidden" name="opportunityId" value={card.id} />
            <Button type="submit" size="sm" variant="secondary" disabled={reabrindo}>
              {reabrindo ? "Reabrindo…" : "Reabrir negócio"}
            </Button>
            <p className="mt-1.5 text-xs text-muted">
              Negócio que volta é mais comum do que erro de marcação. O histórico fica.
            </p>
          </form>
        ) : null}
      </div>
    </Panel>
  );
}

/**
 * Os contatos: o que foi dito, quando e por quem.
 *
 * Registrar contato e o que mantem o negocio quente — e a data do ultimo e o
 * que faz o cartao aparecer como esfriando no quadro. Nao e diario: e o sinal.
 */
export function Contatos({
  opportunityId,
  activities,
  podeRegistrar,
  fuso,
}: {
  opportunityId: string;
  activities: ActivityRow[];
  podeRegistrar: boolean;
  fuso: string;
}) {
  const [state, action, pending] = useActionState(registrarContatoAction, EMPTY_STATE);

  return (
    <Panel className="overflow-hidden">
      <PanelHead
        title="Contatos"
        hint="Cada conversa registrada esquenta o negócio — e prova que foi feita."
      />

      {podeRegistrar ? (
        <form action={action} className="space-y-2 border-b border-line bg-sunken/40 px-5 py-4">
          <FormError error={state.error} fieldErrors={state.fieldErrors} />
          {state.success ? (
            <p className="text-sm font-medium text-positive">{state.success}</p>
          ) : null}

          <input type="hidden" name="opportunityId" value={opportunityId} />

          <div className="flex flex-wrap items-end gap-2">
            <Field label="Como" className="min-w-36">
              <Select name="kind" defaultValue="whatsapp">
                {ACTIVITY_KINDS.map((k) => (
                  <option key={k} value={k}>
                    {CONTATO[k]}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="O que aconteceu" className="min-w-48 flex-1">
              <Input name="body" required placeholder="Mandei os valores e as fotos." />
            </Field>

            <Button type="submit" size="sm" disabled={pending} className="mb-0.5">
              {pending ? "Registrando…" : "Registrar"}
            </Button>
          </div>
        </form>
      ) : null}

      {activities.length === 0 ? (
        <p className="px-5 py-6 text-center text-sm text-muted">
          Ninguém falou com esta pessoa ainda.
        </p>
      ) : (
        <ul className="divide-y divide-line">
          {activities.map((a) => (
            <li key={a.id} className="px-5 py-3">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <Badge tone="neutral">{CONTATO[a.kind]}</Badge>
                <span className="num text-xs text-muted">
                  {formatDateTime(a.occurredAt, fuso)}
                </span>
                {a.by ? <span className="text-xs text-muted">{a.by}</span> : null}
              </div>
              <p className="mt-1 text-sm whitespace-pre-wrap text-ink-soft">{a.body}</p>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

export function ProximaAcao({
  opportunityId,
  tasks,
  podeTarefa,
  fuso,
}: {
  opportunityId: string;
  tasks: TaskRow[];
  podeTarefa: boolean;
  fuso: string;
}) {
  const [state, action, pending] = useActionState(marcarAcaoAction, EMPTY_STATE);
  const [, concluir, concluindo] = useActionState(concluirTarefaAction, EMPTY_STATE);

  const abertas = tasks.filter((t) => t.status === "open");
  const feitas = tasks.filter((t) => t.status !== "open");

  return (
    <Panel className="overflow-hidden">
      <PanelHead
        title="Próxima ação"
        hint="Sem uma data combinada, o contato esfria em silêncio."
      />

      {podeTarefa ? (
        <form action={action} className="space-y-2 border-b border-line px-5 py-4">
          <FormError error={state.error} fieldErrors={state.fieldErrors} />
          {state.success ? (
            <p className="text-sm font-medium text-positive">{state.success}</p>
          ) : null}

          <input type="hidden" name="opportunityId" value={opportunityId} />

          <Field label="O que fazer" error={state.fieldErrors?.title?.[0]}>
            <Input name="title" required placeholder="Ligar para confirmar a avaliação" />
          </Field>

          <div className="flex flex-wrap items-end gap-2">
            <Field label="Quando" className="min-w-44 flex-1" error={state.fieldErrors?.dueAt?.[0]}>
              <Input name="dueAt" type="datetime-local" required />
            </Field>
            <Field label="Prioridade" className="min-w-32">
              <Select name="priority" defaultValue="normal">
                <option value="low">Pode esperar</option>
                <option value="normal">Normal</option>
                <option value="high">Urgente</option>
              </Select>
            </Field>
            <Button type="submit" size="sm" variant="secondary" disabled={pending} className="mb-0.5">
              {pending ? "Marcando…" : "Marcar"}
            </Button>
          </div>
        </form>
      ) : null}

      {abertas.length === 0 && feitas.length === 0 ? (
        <p className="px-5 py-6 text-center text-sm text-muted">Nada combinado ainda.</p>
      ) : (
        <ul className="divide-y divide-line">
          {abertas.map((t) => {
            const prazo = prazoDaAcao(t.dueAt);
            const prio = PRIORIDADE[t.priority];

            return (
              <li key={t.id} className="px-5 py-3">
                <p className="text-sm font-medium text-ink">{t.title}</p>

                <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="num text-xs text-muted">
                    {t.dueAt ? formatDateTime(t.dueAt, fuso) : "sem data"}
                  </span>
                  {t.priority !== "normal" ? <Badge tone={prio.tom}>{prio.rotulo}</Badge> : null}
                  {prazo ? <Badge tone={prazo.tom}>{prazo.texto}</Badge> : null}

                  {podeTarefa ? (
                    <form action={concluir} className="ml-auto">
                      <input type="hidden" name="taskId" value={t.id} />
                      <button
                        type="submit"
                        disabled={concluindo}
                        className="text-xs text-muted underline-offset-2 hover:text-positive hover:underline disabled:opacity-50"
                      >
                        Concluir
                      </button>
                    </form>
                  ) : null}
                </div>
              </li>
            );
          })}

          {feitas.map((t) => (
            <li key={t.id} className="flex items-center gap-2 px-5 py-2.5 opacity-55">
              <span className="min-w-0 flex-1 truncate text-sm text-ink-soft line-through">
                {t.title}
              </span>
              <Badge tone="neutral">feita</Badge>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
