"use client";

import { useActionState, useState } from "react";
import type { PayerPriceRow } from "@/modules/payer";
import { precificarAction } from "@/modules/payer/server-actions";
import { EMPTY_STATE } from "@/shared/action-state";
import { Button, FormError, Input, Notice, Panel, PanelHead } from "@/ui";
import { formatBRL } from "@/shared/format";

/**
 * Tabela de preços do convênio, com o particular ao lado.
 *
 * A pergunta que a clínica faz não é "quanto o convênio paga", é "quanto eu
 * deixo de ganhar" — por isso as duas colunas e a diferença andam juntas, em
 * vez de uma tela só com o preço do convênio.
 */
export function TabelaDePrecos({
  payerId,
  precos,
  editavel,
  faturado,
}: {
  payerId: string;
  precos: PayerPriceRow[];
  editavel: boolean;
  /** Convênio faturado por guia: aí a co-participação tem sentido. */
  faturado: boolean;
}) {
  const [state, action, pending] = useActionState(precificarAction, EMPTY_STATE);
  const [soCobertos, setSoCobertos] = useState(false);

  const linhas = soCobertos ? precos.filter((p) => p.convenioCents !== null) : precos;

  return (
    <Panel className="overflow-hidden">
      <PanelHead
        title="Tabela de preços"
        hint="Deixe em branco ou zere para dizer que o convênio não cobre."
        action={
          <label className="flex items-center gap-2 text-xs text-muted">
            <input
              type="checkbox"
              checked={soCobertos}
              onChange={(e) => setSoCobertos(e.currentTarget.checked)}
              className="size-3.5 rounded border-line"
            />
            Só o que cobre
          </label>
        }
      />

      {state.error ? (
        <div className="px-5 pt-4">
          <FormError error={state.error} fieldErrors={state.fieldErrors} />
        </div>
      ) : null}
      {state.success ? (
        <p className="px-5 pt-4 text-sm font-medium text-positive">{state.success}</p>
      ) : null}

      {linhas.length === 0 ? (
        <p className="px-5 py-6 text-center text-sm text-muted">
          {soCobertos
            ? "Este convênio ainda não cobre nenhum procedimento."
            : "Nenhum procedimento ativo no catálogo."}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="grid-table">
            <thead>
              <tr>
                <th>Procedimento</th>
                <th className="text-right">Particular</th>
                <th className="text-right">Convênio</th>
                {faturado ? <th className="text-right">Paciente</th> : null}
                {editavel ? <th className="text-right">Alterar</th> : null}
              </tr>
            </thead>
            <tbody>
              {linhas.map((p) => {
                const cobre = p.convenioCents !== null;
                const diferenca =
                  cobre && p.particularCents !== null
                    ? p.particularCents - (p.convenioCents ?? 0)
                    : null;

                // Abaixo do custo é dinheiro saindo a cada atendimento. É o
                // erro que passa despercebido por meses, porque a agenda fica
                // cheia e o caixa não fecha.
                const noPrejuizo = cobre && (p.convenioCents ?? 0) < p.custoCents;

                return (
                  <tr key={p.procedureId}>
                    <td>
                      <span className="font-medium text-ink">{p.procedureName}</span>
                      {p.categoria ? (
                        <span className="block text-xs text-muted">{p.categoria}</span>
                      ) : null}
                    </td>
                    <td className="num text-right text-ink-soft">
                      {p.particularCents === null ? "—" : formatBRL(p.particularCents)}
                    </td>
                    <td className="num text-right">
                      {cobre ? (
                        <span
                          className={noPrejuizo ? "font-medium text-critical" : "font-medium text-ink"}
                        >
                          {formatBRL(p.convenioCents ?? 0)}
                        </span>
                      ) : (
                        <span className="text-muted">não cobre</span>
                      )}
                      {noPrejuizo ? (
                        <span className="block text-xs whitespace-nowrap text-critical">
                          abaixo do custo ({formatBRL(p.custoCents)})
                        </span>
                      ) : null}
                      {diferenca !== null && diferenca > 0 ? (
                        <span className="block text-xs whitespace-nowrap text-warning">
                          {`\u2212${formatBRL(diferenca)}`} vs. particular
                        </span>
                      ) : null}
                    </td>
                    {faturado ? (
                      <td className="num text-right">
                        {cobre ? (
                          <>
                            <span className="text-ink-soft">
                              {formatBRL(p.patientShareCents)}
                            </span>
                            <span className="block text-xs text-muted">
                              convênio paga{" "}
                              {formatBRL((p.convenioCents ?? 0) - p.patientShareCents)}
                            </span>
                          </>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                    ) : null}

                    {editavel ? (
                      <td className="text-right">
                        <form action={action} className="flex items-center justify-end gap-2">
                          <input type="hidden" name="payerId" value={payerId} />
                          <input type="hidden" name="procedureId" value={p.procedureId} />
                          <Input
                            name="price"
                            defaultValue={
                              cobre ? ((p.convenioCents ?? 0) / 100).toFixed(2).replace(".", ",") : ""
                            }
                            placeholder="não cobre"
                            aria-label={`Preço de ${p.procedureName}`}
                            className="num h-8 w-24 text-right"
                          />
                          {faturado ? (
                            <Input
                              name="patientShare"
                              defaultValue={
                                cobre ? (p.patientShareCents / 100).toFixed(2).replace(".", ",") : ""
                              }
                              placeholder="co-part."
                              aria-label={`Co-participação de ${p.procedureName}`}
                              className="num h-8 w-24 text-right"
                            />
                          ) : null}
                          <Button
                            type="submit"
                            size="sm"
                            variant="secondary"
                            disabled={pending}
                            className="shrink-0"
                          >
                            Salvar
                          </Button>
                        </form>
                      </td>
                    ) : null}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {editavel ? (
        <div className="border-t border-line px-5 py-3">
          <Notice tone="neutral">
            Preço zero remove a linha: o procedimento volta a sair pelo particular no orçamento, em
            vez de aparecer como gratuito na proposta.
            {faturado ? (
              <>
                {" "}
                A co-participação é a parte do paciente — o convênio é faturado pelo resto.
              </>
            ) : null}
          </Notice>
        </div>
      ) : null}
    </Panel>
  );
}
