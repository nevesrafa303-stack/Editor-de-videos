"use client";

import { useActionState, useState } from "react";
import type { CashSession } from "@/modules/finance";
import {
  abrirCaixaAction,
  fecharCaixaAction,
  movimentarCaixaAction,
} from "@/modules/finance/server-actions";
import { EMPTY_STATE } from "@/shared/action-state";
import { Badge, Button, Field, FormError, Input, Panel, PanelHead, Select } from "@/ui";
import { formatBRL, formatDateTime } from "@/shared/format";

const MOVIMENTO: Record<string, { rotulo: string; tom: "positive" | "critical" | "neutral" }> = {
  payment: { rotulo: "Recebimento", tom: "positive" },
  supply: { rotulo: "Suprimento", tom: "positive" },
  withdrawal: { rotulo: "Sangria", tom: "critical" },
  refund: { rotulo: "Estorno", tom: "critical" },
  adjustment: { rotulo: "Ajuste", tom: "neutral" },
};

export function AbrirCaixa() {
  const [state, action, pending] = useActionState(abrirCaixaAction, EMPTY_STATE);

  return (
    <Panel className="max-w-lg overflow-hidden">
      <PanelHead
        title="Abrir o caixa"
        hint="O valor de abertura é o troco que já está na gaveta."
      />
      <form action={action} className="space-y-4 px-5 py-4">
        <FormError error={state.error} fieldErrors={state.fieldErrors} />

        <Field label="Abertura (R$)" error={state.fieldErrors?.openingCents?.[0]}>
          <Input name="opening" className="num" defaultValue="0,00" autoFocus />
        </Field>

        <Field label="Observação">
          <Input name="notes" placeholder="Opcional" />
        </Field>

        <Button type="submit" disabled={pending}>
          {pending ? "Abrindo…" : "Abrir caixa"}
        </Button>
      </form>
    </Panel>
  );
}

export function Gaveta({
  caixa,
  podeFechar,
  fuso,
}: {
  caixa: CashSession;
  podeFechar: boolean;
  fuso: string;
}) {
  const [fecho, fechar, fechando] = useActionState(fecharCaixaAction, EMPTY_STATE);
  const [mov, movimentar, movimentando] = useActionState(movimentarCaixaAction, EMPTY_STATE);
  const [conferindo, setConferindo] = useState(false);
  const [contado, setContado] = useState("");

  const diferenca =
    contado.trim().length > 0
      ? Math.round(Number(contado.replace(/\./g, "").replace(",", ".")) * 100) -
        caixa.esperadoCents
      : null;

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
      <div className="space-y-5">
        <Panel className="overflow-hidden">
          <PanelHead
            title="Na gaveta"
            hint={`Aberto por ${caixa.openedBy} em ${formatDateTime(caixa.openedAt, fuso)}`}
          />
          <div className="space-y-2 px-5 py-4 text-sm">
            <Linha rotulo="Abertura" valor={formatBRL(caixa.openingCents)} />
            <Linha rotulo="Entradas" valor={formatBRL(caixa.entradasCents)} />
            <Linha rotulo="Saídas" valor={formatBRL(caixa.saidasCents)} />
            <div className="flex items-baseline justify-between gap-4 border-t border-line pt-2">
              <span className="font-semibold text-ink">Esperado</span>
              <span className="num text-xl font-bold text-ink">
                {formatBRL(caixa.esperadoCents)}
              </span>
            </div>
            <p className="text-xs text-muted">
              Só dinheiro em espécie passa pela gaveta. PIX e cartão caem na conta e não mudam
              esta conta.
            </p>
          </div>
        </Panel>

        <Panel className="overflow-hidden">
          <PanelHead title="Sangria e suprimento" />
          <form action={movimentar} className="space-y-3 px-5 py-4">
            <FormError error={mov.error} fieldErrors={mov.fieldErrors} />
            {mov.success ? (
              <p className="text-sm font-medium text-positive">{mov.success}</p>
            ) : null}

            <input type="hidden" name="sessionId" value={caixa.id} />

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Tipo">
                <Select name="kind" defaultValue="withdrawal">
                  <option value="withdrawal">Sangria (tira da gaveta)</option>
                  <option value="supply">Suprimento (põe na gaveta)</option>
                  <option value="adjustment">Ajuste</option>
                </Select>
              </Field>
              <Field label="Valor (R$)" error={mov.fieldErrors?.amountCents?.[0]}>
                <Input name="amount" className="num" required />
              </Field>
            </div>

            <Field label="Do que se trata" error={mov.fieldErrors?.description?.[0]}>
              <Input name="description" required placeholder="Ex.: sangria para o cofre" />
            </Field>

            <Button type="submit" size="sm" variant="secondary" disabled={movimentando}>
              {movimentando ? "Registrando…" : "Registrar"}
            </Button>
          </form>
        </Panel>

        {podeFechar ? (
          <Panel className="overflow-hidden">
            <PanelHead
              title="Fechar o caixa"
              hint="Conte o dinheiro antes. A diferença fica registrada, com ou sem explicação."
            />
            <div className="px-5 py-4">
              <FormError error={fecho.error} fieldErrors={fecho.fieldErrors} />
              {fecho.success ? (
                <p className="mb-3 text-sm font-medium text-positive">{fecho.success}</p>
              ) : null}

              {!conferindo ? (
                <Button type="button" variant="secondary" onClick={() => setConferindo(true)}>
                  Conferir e fechar
                </Button>
              ) : (
                <form action={fechar} className="space-y-3">
                  <input type="hidden" name="sessionId" value={caixa.id} />

                  <Field
                    label="Contado na gaveta (R$)"
                    error={fecho.fieldErrors?.countedCents?.[0]}
                  >
                    <Input
                      name="counted"
                      className="num"
                      required
                      autoFocus
                      value={contado}
                      onChange={(e) => setContado(e.target.value)}
                      placeholder="0,00"
                    />
                  </Field>

                  {diferenca !== null && Number.isFinite(diferenca) ? (
                    <p
                      className={`text-sm ${diferenca === 0 ? "text-positive" : "text-warning"}`}
                    >
                      {diferenca === 0
                        ? "Bate com o esperado."
                        : diferenca > 0
                          ? `Sobra de ${formatBRL(diferenca)}.`
                          : `Falta de ${formatBRL(Math.abs(diferenca))}.`}
                    </p>
                  ) : null}

                  <Field label="Observação">
                    <Input name="notes" placeholder="Explicação da diferença, se houver" />
                  </Field>

                  <div className="flex gap-2">
                    <Button type="submit" disabled={fechando}>
                      {fechando ? "Fechando…" : "Fechar caixa"}
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setConferindo(false)}
                    >
                      Voltar
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </Panel>
        ) : null}
      </div>

      <Panel className="overflow-hidden">
        <PanelHead title="Movimento do caixa" hint={`${caixa.movimentos.length} lançamentos`} />
        {caixa.movimentos.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-muted">
            Nada na gaveta além da abertura.
          </p>
        ) : (
          <ul className="divide-y divide-line">
            {caixa.movimentos.map((m) => {
              const meta = MOVIMENTO[m.kind] ?? { rotulo: m.kind, tom: "neutral" as const };

              return (
                <li key={m.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-5 py-2.5">
                  <span className="num w-32 shrink-0 text-xs text-muted">
                    {formatDateTime(m.at, fuso)}
                  </span>
                  <Badge tone={meta.tom}>{meta.rotulo}</Badge>
                  <span className="min-w-0 flex-1 truncate text-sm text-ink-soft">
                    {m.description ?? "—"}
                  </span>
                  <span
                    className={`num text-sm font-medium ${m.amountCents < 0 ? "text-critical" : "text-ink"}`}
                  >
                    {formatBRL(m.amountCents)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
    </div>
  );
}

function Linha({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className="text-muted">{rotulo}</span>
      <span className="num text-ink-soft">{valor}</span>
    </div>
  );
}
