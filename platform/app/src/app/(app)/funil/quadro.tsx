"use client";

import { useActionState } from "react";
import Link from "next/link";
import type { CardRow, FunnelBoard } from "@/modules/funnel";
import { moverEtapaAction } from "@/modules/funnel/server-actions";
import { EMPTY_STATE } from "@/shared/action-state";
import { Badge, Notice, Panel } from "@/ui";
import { formatBRL, formatPhone } from "@/shared/format";
import { prazoDaAcao, semContato } from "./estado";

type Etapa = { id: string; name: string; sortOrder: number; isWon: boolean; isLost: boolean };

/**
 * O quadro: uma coluna por etapa, e o cartao anda por um seletor.
 *
 * Nao e arrastavel de proposito. Arrastar e agradavel no computador e nao
 * funciona no teclado nem bem no celular — entao exigiria o seletor do mesmo
 * jeito, e duas formas de fazer a mesma coisa e o dobro de superficie para
 * quebrar. Quem usa isto e a recepcao, no balcao, com o paciente na frente.
 */
export function Quadro({
  board,
  etapas,
  podeMover,
}: {
  board: FunnelBoard;
  etapas: Etapa[];
  podeMover: boolean;
}) {
  const [state, mover, movendo] = useActionState(moverEtapaAction, EMPTY_STATE);

  // Ganho e perda nao sao destino de "mover": um se alcanca aceitando o
  // orcamento, o outro exige motivo. Oferecer os dois aqui seria oferecer um
  // caminho que a acao recusa.
  const destinos = etapas.filter((e) => !e.isWon && !e.isLost);

  // Ganho e perda ficam FORA do quadro. Etapa de trabalho vazia diz alguma
  // coisa ("nada em proposta enviada"); estas duas sao vazias por construcao,
  // porque o quadro so mostra o que esta aberto — e coluna que nunca tera nada
  // custa uma coluna e nao informa nenhuma.
  const visiveis = board.stages.filter((e) => !e.isLost && !e.isWon);

  return (
    <div className="space-y-3">
      {state.error ? <Notice>{state.error}</Notice> : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {visiveis.map((etapa) => (
          <Panel key={etapa.id} className="flex flex-col overflow-hidden">
            <header className="border-b border-line px-4 py-3">
              <div className="flex items-baseline justify-between gap-2">
                <h2 className="text-sm font-semibold text-ink">{etapa.name}</h2>
                <span className="num text-xs text-muted">{etapa.cards.length}</span>
              </div>
              <p className="num mt-0.5 text-xs text-muted">
                {formatBRL(etapa.totalCents)}
                {etapa.winProbability > 0 ? (
                  <span> · {Math.round(etapa.winProbability * 100)}% de chance</span>
                ) : null}
              </p>
            </header>

            {etapa.cards.length === 0 ? (
              <p className="px-4 py-6 text-center text-xs text-muted">Vazia.</p>
            ) : (
              <ul className="divide-y divide-line">
                {etapa.cards.map((card) => (
                  <Cartao
                    key={card.id}
                    card={card}
                    destinos={destinos}
                    podeMover={podeMover}
                    movendo={movendo}
                    mover={mover}
                  />
                ))}
              </ul>
            )}
          </Panel>
        ))}
      </div>
    </div>
  );
}

function Cartao({
  card,
  destinos,
  podeMover,
  movendo,
  mover,
}: {
  card: CardRow;
  destinos: Etapa[];
  podeMover: boolean;
  movendo: boolean;
  mover: (formData: FormData) => void;
}) {
  const contato = semContato(card.diasSemContato, card.esfriando);
  const acao = prazoDaAcao(card.nextActionAt);

  return (
    <li className="px-4 py-3">
      <Link
        href={`/funil/${card.id}`}
        className="block truncate text-sm font-medium text-ink hover:text-structure"
      >
        {card.personName}
      </Link>
      <p className="truncate text-xs text-muted">{card.title}</p>

      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
        <span className="num text-sm font-medium text-ink">
          {formatBRL(card.amountCents)}
        </span>
        <Badge tone={contato.tom}>{contato.texto}</Badge>
        {acao ? <Badge tone={acao.tom}>{acao.texto}</Badge> : null}
        {card.patientId === null ? <Badge tone="accent">lead</Badge> : null}
        {card.quoteCount > 0 ? (
          <Badge tone="structure">
            {card.quoteCount} {card.quoteCount === 1 ? "proposta" : "propostas"}
          </Badge>
        ) : null}
      </div>

      <p className="num mt-1 truncate text-xs text-muted">
        {formatPhone(card.phone)}
        {card.ownerName ? ` · ${card.ownerName}` : ""}
      </p>

      {podeMover && destinos.length > 0 ? (
        <form action={mover} className="mt-2">
          <input type="hidden" name="opportunityId" value={card.id} />
          <input type="hidden" name="de" value="quadro" />
          <label className="sr-only" htmlFor={`mover-${card.id}`}>
            Mover {card.personName} para
          </label>
          <select
            id={`mover-${card.id}`}
            name="stageId"
            defaultValue=""
            disabled={movendo}
            onChange={(e) => e.currentTarget.form?.requestSubmit()}
            className="field h-8 text-xs"
          >
            <option value="" disabled>
              Mover para…
            </option>
            {destinos
              .filter((d) => d.id !== card.stageId)
              .map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
          </select>
          {/* Sem JavaScript o select nao dispara sozinho; o botao garante. */}
          <noscript>
            <button type="submit" className="mt-1 text-xs text-structure underline">
              Mover
            </button>
          </noscript>
        </form>
      ) : null}
    </li>
  );
}
