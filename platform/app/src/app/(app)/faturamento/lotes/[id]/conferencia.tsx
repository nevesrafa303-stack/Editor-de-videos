"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import type { BatchDetail } from "@/modules/claim";
import {
  conferirAction,
  datarRepasseAction,
  enviarLoteAction,
  fecharLoteAction,
  tirarDoLoteAction,
} from "@/modules/claim/server-actions";
import { EMPTY_STATE } from "@/shared/action-state";
import { Badge, Button, Field, FormError, Input, Notice, Panel, PanelHead } from "@/ui";
import { formatBRL } from "@/shared/format";
import { GUIA } from "../../estado";

export function Conferencia({
  batch,
  claims,
  podeEnviar,
  podeConferir,
}: {
  batch: BatchDetail["batch"];
  claims: BatchDetail["claims"];
  podeEnviar: boolean;
  podeConferir: boolean;
}) {
  const [envio, enviar, enviando] = useActionState(enviarLoteAction, EMPTY_STATE);
  const [data, datar, datando] = useActionState(datarRepasseAction, EMPTY_STATE);
  const [fecho, fechar, fechando] = useActionState(fecharLoteAction, EMPTY_STATE);
  const [remocao, remover, removendo] = useActionState(tirarDoLoteAction, EMPTY_STATE);

  const montando = batch.status === "open";
  const enviado = batch.status === "submitted";

  return (
    <div className="space-y-5">
      {/* ---------------------------------------------------------- envio -- */}
      {montando && podeEnviar ? (
        <Panel className="p-5">
          <form action={enviar} className="flex flex-wrap items-center justify-between gap-3">
            <input type="hidden" name="batchId" value={batch.id} />
            <span className="min-w-0">
              <span className="block text-sm font-medium text-ink">Enviar ao convênio</span>
              <span className="block text-xs text-muted">
                Depois disso a guia não sai mais do lote, e a clínica passa a esperar o repasse.
              </span>
            </span>
            <Button type="submit" disabled={enviando || batch.claimCount === 0}>
              {enviando ? "Enviando…" : "Enviar lote"}
            </Button>
          </form>
          {envio.error ? (
            <div className="mt-3">
              <Notice>{envio.error}</Notice>
            </div>
          ) : null}
        </Panel>
      ) : null}

      {/* ---------------------------------------------- data do repasse --- */}
      {enviado && podeConferir ? (
        <Panel className="p-5">
          <form action={datar} className="flex flex-wrap items-end gap-3">
            <input type="hidden" name="batchId" value={batch.id} />
            <Field
              label="Data do demonstrativo"
              className="min-w-48"
              hint="O prazo de recurso de toda glosa deste lote conta desta data."
            >
              <Input
                type="date"
                name="remittanceDate"
                defaultValue={batch.remittanceDate ?? ""}
                required
              />
            </Field>
            <Button type="submit" size="sm" variant="secondary" disabled={datando} className="mb-0.5">
              {datando ? "Salvando…" : "Registrar"}
            </Button>
          </form>

          {data.error ? (
            <div className="mt-3">
              <Notice>{data.error}</Notice>
            </div>
          ) : null}
          {data.success ? (
            <p className="mt-2 text-sm font-medium text-positive">{data.success}</p>
          ) : null}

          {!batch.remittanceDate ? (
            <div className="mt-3">
              <Notice tone="warning">
                Sem a data, a glosa nasce com prazo contado de hoje — mais tempo do que a clínica
                realmente tem. Registre antes de conferir.
              </Notice>
            </div>
          ) : null}
        </Panel>
      ) : null}

      {/* ---------------------------------------------------------- guias -- */}
      {claims.map((c) => {
        const meta = GUIA[c.status];

        return (
          <Panel key={c.id} className="overflow-hidden">
            <PanelHead
              title={c.patientName}
              hint={`Guia #${c.number}${c.authorizationCode ? ` · senha ${c.authorizationCode}` : " · sem senha"}`}
              action={
                <span className="flex items-center gap-2">
                  <Badge tone={meta.tom}>{meta.rotulo}</Badge>
                  <Link
                    href={`/faturamento/guias/${c.id}`}
                    className="text-xs text-structure hover:underline"
                  >
                    abrir
                  </Link>
                </span>
              }
            />

            <div className="overflow-x-auto">
              <table className="grid-table">
                <thead>
                  <tr>
                    <th>Procedimento</th>
                    <th className="text-right">Faturado</th>
                    <th className="text-right">Pago</th>
                    {enviado && podeConferir ? <th className="text-right">Conferir</th> : null}
                  </tr>
                </thead>
                <tbody>
                  {c.items.map((item) => (
                    <LinhaDaGuia
                      key={item.id}
                      batchId={batch.id}
                      item={item}
                      conferivel={enviado && podeConferir}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            {montando && podeEnviar ? (
              <form action={remover} className="border-t border-line px-5 py-2.5 text-right">
                <input type="hidden" name="claimId" value={c.id} />
                <input type="hidden" name="batchId" value={batch.id} />
                <button
                  type="submit"
                  disabled={removendo}
                  className="text-xs text-muted underline-offset-2 hover:text-critical hover:underline disabled:opacity-50"
                >
                  Tirar do lote
                </button>
              </form>
            ) : null}
          </Panel>
        );
      })}

      {remocao.error ? <Notice>{remocao.error}</Notice> : null}

      {/* -------------------------------------------------------- fechar -- */}
      {enviado && podeConferir ? (
        <Panel className="p-5">
          <form action={fechar} className="flex flex-wrap items-center justify-between gap-3">
            <input type="hidden" name="batchId" value={batch.id} />
            <span className="min-w-0">
              <span className="block text-sm font-medium text-ink">Fechar o lote</span>
              <span className="block text-xs text-muted">
                {batch.pendentes > 0
                  ? `${batch.pendentes} linha(s) ainda sem conferência. Fechar agora esconderia o que falta receber.`
                  : "Tudo conferido. Fechar arquiva o lote; a glosa continua no recurso."}
              </span>
            </span>
            <Button
              type="submit"
              variant="secondary"
              disabled={fechando || batch.pendentes > 0}
            >
              {fechando ? "Fechando…" : "Fechar lote"}
            </Button>
          </form>
          {fecho.error ? (
            <div className="mt-3">
              <Notice>{fecho.error}</Notice>
            </div>
          ) : null}
        </Panel>
      ) : null}
    </div>
  );
}

/**
 * Uma linha do demonstrativo.
 *
 * O campo de glosa so aparece quando o valor digitado e MENOR que o faturado —
 * porque e nesse momento que o motivo passa a ser obrigatorio, e pedir motivo
 * antes disso seria pedir explicacao de um pagamento normal.
 */
function LinhaDaGuia({
  batchId,
  item,
  conferivel,
}: {
  batchId: string;
  item: BatchDetail["claims"][number]["items"][number];
  conferivel: boolean;
}) {
  const [state, action, pending] = useActionState(conferirAction, EMPTY_STATE);

  const gravado =
    item.paidCents === null ? "" : (item.paidCents / 100).toFixed(2).replace(".", ",");
  const [pago, setPago] = useState(gravado);

  const digitado = Math.round(Number(pago.replace(/\./g, "").replace(",", ".")) * 100);
  const glosa = Number.isFinite(digitado) ? item.billedCents - digitado : 0;

  // O motivo so e pedido quando o numero na tela DIFERE do que ja esta
  // gravado. Sem essa comparacao, a linha ja conferida continuava exibindo
  // "sem motivo nao ha o que recorrer" com os campos vazios — convidando a
  // conferir de novo o que acabou de ser conferido, e sugerindo que a glosa
  // registrada nao tinha motivo. Ela tinha.
  const mudou = pago !== gravado;
  const pedeMotivo = pago !== "" && glosa > 0 && mudou;

  return (
    <tr>
      <td>
        <span className="font-medium text-ink">{item.description}</span>
        {item.toothCode || item.regionCode ? (
          <span className="block text-xs text-muted">
            {item.toothCode ? `Dente ${item.toothCode}` : item.regionCode}
          </span>
        ) : null}
        {state.error ? (
          <span className="block text-xs text-critical">{state.error}</span>
        ) : null}
        {state.success ? (
          <span className="block text-xs text-positive">{state.success}</span>
        ) : null}
      </td>

      <td className="num text-right text-ink-soft">{formatBRL(item.billedCents)}</td>

      <td className="num text-right">
        {item.paidCents === null ? (
          <span className="text-muted">a conferir</span>
        ) : (
          <>
            <span className="font-medium text-ink">{formatBRL(item.paidCents)}</span>
            {item.deniedCents > 0 ? (
              <span className="block text-xs whitespace-nowrap text-critical">
                {`−${formatBRL(item.deniedCents)}`} glosado
              </span>
            ) : null}
          </>
        )}
      </td>

      {conferivel ? (
        <td className="text-right">
          <form action={action} className="flex flex-col items-end gap-2">
            <input type="hidden" name="batchId" value={batchId} />
            <input type="hidden" name="itemId" value={item.id} />

            <span className="flex items-center gap-2">
              <Input
                name="paid"
                value={pago}
                onChange={(e) => setPago(e.currentTarget.value)}
                placeholder="0,00"
                aria-label={`Pago em ${item.description}`}
                className="num h-8 w-24 text-right"
              />
              <Button
                type="submit"
                size="sm"
                variant="secondary"
                disabled={pending || (gravado !== "" && !mudou)}
                className="shrink-0"
              >
                {pending ? "…" : gravado === "" ? "Conferir" : "Corrigir"}
              </Button>
            </span>

            {pedeMotivo ? (
              <span className="flex w-full max-w-sm flex-col gap-1.5">
                <span className="text-xs text-critical">
                  Glosa de {formatBRL(glosa)} — sem motivo não há o que recorrer.
                </span>
                <span className="flex gap-1.5">
                  <Input
                    name="reasonCode"
                    placeholder="código"
                    aria-label="Código da glosa"
                    className="num h-8 w-20"
                  />
                  <Input
                    name="reason"
                    required
                    placeholder="Motivo informado pelo convênio"
                    aria-label="Motivo da glosa"
                    className="h-8 flex-1"
                  />
                </span>
              </span>
            ) : null}
          </form>
        </td>
      ) : null}
    </tr>
  );
}
