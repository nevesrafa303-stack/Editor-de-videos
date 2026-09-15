"use client";

import { useActionState, useState } from "react";
import type { QuoteDetail } from "@/modules/quote";
import {
  aceitarAction,
  adicionarItemAction,
  condicoesAction,
  descontoAction,
  mudarStatusAction,
  removerItemAction,
} from "@/modules/quote/server-actions";
import { EMPTY_STATE } from "@/shared/action-state";
import { Badge, Button, Field, FormError, Input, Notice, Panel, PanelHead, Select } from "@/ui";
import { formatBRL } from "@/shared/format";
import { resumoParcelas } from "@/shared/money";
import { PROXIMOS, STATUS } from "../status";

const EDITAVEL = ["draft", "negotiating"];

export function Itens({ quote }: { quote: QuoteDetail }) {
  const [state, action, pending] = useActionState(adicionarItemAction, EMPTY_STATE);
  const [remocao, remover, removendo] = useActionState(removerItemAction, EMPTY_STATE);
  const editavel = EDITAVEL.includes(quote.status) && quote.can.write;

  return (
    <Panel className="overflow-hidden">
      <PanelHead
        title="Itens"
        hint="O preço fica congelado aqui. Reajustar a tabela amanhã não muda esta proposta."
      />

      {quote.items.length === 0 ? (
        <p className="px-5 py-6 text-center text-sm text-muted">
          Nenhum item. Um orçamento sem item não pode ser enviado.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="grid-table">
            <thead>
              <tr>
                <th>Procedimento</th>
                <th className="text-right">Qtd.</th>
                <th className="text-right">Unitário</th>
                <th className="text-right">Total</th>
                {editavel ? <th /> : null}
              </tr>
            </thead>
            <tbody>
              {quote.items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <span className="font-medium text-ink">{item.description}</span>
                    {item.toothCode || item.regionCode ? (
                      <span className="block text-xs text-muted">
                        {item.toothCode ? `Dente ${item.toothCode}` : item.regionCode}
                      </span>
                    ) : null}
                  </td>
                  <td className="num text-right">{item.quantity}</td>
                  <td className="num text-right">{formatBRL(item.unitPriceCents)}</td>
                  <td className="num text-right font-medium text-ink">
                    {formatBRL(item.totalCents)}
                  </td>
                  {editavel ? (
                    <td className="text-right">
                      <form action={remover}>
                        <input type="hidden" name="quoteId" value={quote.id} />
                        <input type="hidden" name="itemId" value={item.id} />
                        <button
                          type="submit"
                          disabled={removendo}
                          className="text-xs text-muted underline-offset-2 hover:text-critical hover:underline disabled:opacity-50"
                        >
                          Remover
                        </button>
                      </form>
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {remocao.error ? (
        <div className="px-5 pb-3">
          <Notice>{remocao.error}</Notice>
        </div>
      ) : null}

      {editavel ? (
        <form action={action} className="border-t border-line bg-sunken/40 px-5 py-4">
          <FormError error={state.error} fieldErrors={state.fieldErrors} />
          {state.success ? (
            <p className="mb-2 text-sm font-medium text-positive">{state.success}</p>
          ) : null}

          <input type="hidden" name="quoteId" value={quote.id} />

          <div className="grid gap-3 sm:grid-cols-[minmax(0,2fr)_80px_110px_120px_auto] sm:items-end">
            <Field label="Item avulso" error={state.fieldErrors?.description?.[0]}>
              <Input name="description" required placeholder="Descrição do procedimento" />
            </Field>
            <Field label="Dente" error={state.fieldErrors?.toothCode?.[0]}>
              <Input name="toothCode" placeholder="36" maxLength={2} className="num" />
            </Field>
            <Field label="Qtd.">
              <Input name="quantity" type="number" min="0.1" step="0.1" defaultValue="1" />
            </Field>
            <Field label="Unitário (R$)" error={state.fieldErrors?.unitPriceCents?.[0]}>
              <Input name="unitPrice" required placeholder="0,00" className="num" />
            </Field>
            <Button type="submit" size="sm" disabled={pending} className="mb-0.5">
              {pending ? "Adicionando…" : "Adicionar"}
            </Button>
          </div>

          <p className="mt-2 text-xs text-muted">
            Item avulso não tem tabela de preço por trás — o teto de desconto passa a ser só o do
            seu papel.
          </p>
        </form>
      ) : null}
    </Panel>
  );
}

export function Comercial({ quote }: { quote: QuoteDetail }) {
  const [desconto, aplicarDesconto, aplicando] = useActionState(descontoAction, EMPTY_STATE);
  const [condicao, aplicarCondicoes, salvando] = useActionState(condicoesAction, EMPTY_STATE);
  const editavel = EDITAVEL.includes(quote.status) && quote.can.write;

  const excede = quote.discountCents > quote.ceiling.effectiveCents;

  return (
    <Panel className="overflow-hidden">
      <PanelHead title="Condições comerciais" />

      <div className="space-y-2 border-b border-line px-5 py-4 text-sm">
        <Linha rotulo="Subtotal" valor={formatBRL(quote.subtotalCents)} />
        <Linha rotulo="Desconto" valor={`− ${formatBRL(quote.discountCents)}`} />
        <Linha rotulo="Total" valor={formatBRL(quote.totalCents)} forte />
        {quote.downPaymentCents > 0 ? (
          <Linha rotulo="Entrada" valor={formatBRL(quote.downPaymentCents)} />
        ) : null}
        <Parcelamento
          totalCents={quote.totalCents - quote.downPaymentCents}
          parcelas={quote.installmentCount}
        />
      </div>

      {editavel ? (
        <>
          <form action={aplicarDesconto} className="border-b border-line px-5 py-4">
            <FormError error={desconto.error} fieldErrors={desconto.fieldErrors} />
            {desconto.success ? (
              <p className="mb-2 text-sm font-medium text-positive">{desconto.success}</p>
            ) : null}

            <input type="hidden" name="quoteId" value={quote.id} />

            <div className="flex flex-wrap items-end gap-3">
              <Field
                label="Desconto (R$)"
                className="min-w-32 flex-1"
                hint={`Sua alçada: ${quote.ceiling.rolePercent}% · até ${formatBRL(quote.ceiling.effectiveCents)}`}
              >
                <Input
                  name="discount"
                  defaultValue={(quote.discountCents / 100).toFixed(2).replace(".", ",")}
                  className="num"
                />
              </Field>

              <Button type="submit" size="sm" disabled={aplicando} className="mb-0.5">
                {aplicando ? "Aplicando…" : "Aplicar"}
              </Button>

              {quote.can.approveDiscount ? (
                <Button
                  type="submit"
                  name="approve"
                  value="1"
                  size="sm"
                  variant="accent"
                  disabled={aplicando}
                  className="mb-0.5"
                >
                  Aplicar e aprovar
                </Button>
              ) : null}
            </div>

            {excede ? (
              <p className="mt-2 text-xs text-warning">
                Este desconto passa do seu teto. O envio será recusado até um gestor aprovar.
              </p>
            ) : null}

            {quote.discountApprovedBy ? (
              <p className="mt-2 text-xs text-muted">
                Desconto aprovado por <strong>{quote.discountApprovedBy}</strong>.
              </p>
            ) : null}
          </form>

          <form action={aplicarCondicoes} className="px-5 py-4">
            <FormError error={condicao.error} fieldErrors={condicao.fieldErrors} />
            {condicao.success ? (
              <p className="mb-2 text-sm font-medium text-positive">{condicao.success}</p>
            ) : null}

            <input type="hidden" name="quoteId" value={quote.id} />

            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Parcelas">
                <Select name="installmentCount" defaultValue={String(quote.installmentCount)}>
                  {Array.from({ length: 24 }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>
                      {n}x
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Entrada (R$)">
                <Input
                  name="downPayment"
                  defaultValue={(quote.downPaymentCents / 100).toFixed(2).replace(".", ",")}
                  className="num"
                />
              </Field>
              <Field label="Validade">
                <Input name="validUntil" type="date" defaultValue={quote.validUntil ?? ""} />
              </Field>
            </div>

            <div className="mt-3 flex justify-end">
              <Button type="submit" size="sm" variant="secondary" disabled={salvando}>
                {salvando ? "Salvando…" : "Salvar condições"}
              </Button>
            </div>
          </form>
        </>
      ) : null}
    </Panel>
  );
}

/**
 * O parcelamento mostrado tem que somar o total.
 *
 * "6x de R$ 396,67" para R$ 2.380,00 dá R$ 2.380,02 — e a recepção repete esse
 * número para o paciente.
 */
function Parcelamento({ totalCents, parcelas }: { totalCents: number; parcelas: number }) {
  const { primeira, demais, iguais } = resumoParcelas(totalCents, parcelas);

  if (iguais) return <Linha rotulo={`${parcelas}x de`} valor={formatBRL(demais)} />;

  return (
    <>
      <Linha rotulo="1ª parcela" valor={formatBRL(primeira)} />
      <Linha rotulo={`+ ${parcelas - 1}x de`} valor={formatBRL(demais)} />
    </>
  );
}

function Linha({ rotulo, valor, forte }: { rotulo: string; valor: string; forte?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className={forte ? "font-semibold text-ink" : "text-muted"}>{rotulo}</span>
      <span className={forte ? "num text-lg font-bold text-ink" : "num text-ink-soft"}>
        {valor}
      </span>
    </div>
  );
}

export function Acoes({
  quote,
  motivos,
}: {
  quote: QuoteDetail;
  motivos: { id: string; name: string }[];
}) {
  const [state, action, pending] = useActionState(mudarStatusAction, EMPTY_STATE);
  const [aceite, aceitar, aceitando] = useActionState(aceitarAction, EMPTY_STATE);
  const [perdendo, setPerdendo] = useState(false);
  const [aceitando_, setAceitando] = useState(false);

  const proximos = PROXIMOS[quote.status];
  const meta = STATUS[quote.status];

  return (
    <Panel className="overflow-hidden">
      <PanelHead title="Situação" hint={meta.explica} />

      <div className="space-y-3 px-5 py-4">
        <FormError error={state.error} fieldErrors={state.fieldErrors} />
        {state.success ? (
          <p className="text-sm font-medium text-positive">{state.success}</p>
        ) : null}
        <FormError error={aceite.error} fieldErrors={aceite.fieldErrors} />
        {aceite.success ? (
          <p className="text-sm font-medium text-positive">{aceite.success}</p>
        ) : null}

        <Badge tone={meta.tom}>{meta.rotulo}</Badge>

        {quote.can.write && proximos.length > 0 ? (
          <form action={action} className="flex flex-wrap gap-2">
            <input type="hidden" name="quoteId" value={quote.id} />

            {proximos.map((p) =>
              p.to === "rejected" ? (
                <Button
                  key={p.to}
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => setPerdendo(true)}
                >
                  {p.rotulo}
                </Button>
              ) : (
                <Button
                  key={p.to}
                  type="submit"
                  name="to"
                  value={p.to}
                  size="sm"
                  variant={p.principal ? "primary" : "secondary"}
                  disabled={pending}
                >
                  {p.rotulo}
                </Button>
              ),
            )}
          </form>
        ) : null}

        {perdendo ? (
          <form action={action} className="space-y-2 rounded-md border border-line bg-sunken/40 p-3">
            <input type="hidden" name="quoteId" value={quote.id} />
            <input type="hidden" name="to" value="rejected" />

            <Field label="Motivo da perda" error={state.fieldErrors?.lossReasonId?.[0]}>
              <Select name="lossReasonId" required>
                <option value="">Escolha</option>
                {motivos.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Observação" hint="O que o paciente disse, nas palavras dele.">
              <Input name="lossNotes" />
            </Field>

            <div className="flex gap-2">
              <Button type="submit" size="sm" variant="danger" disabled={pending}>
                Registrar perda
              </Button>
              <Button type="button" size="sm" variant="secondary" onClick={() => setPerdendo(false)}>
                Voltar
              </Button>
            </div>
          </form>
        ) : null}

        {quote.can.accept && (quote.status === "sent" || quote.status === "negotiating") ? (
          aceitando_ ? (
            <form
              action={aceitar}
              className="space-y-2 rounded-md border border-positive/30 bg-positive-soft/40 p-3"
            >
              <input type="hidden" name="quoteId" value={quote.id} />

              <Field
                label="Quem está aceitando"
                error={aceite.fieldErrors?.signedBy?.[0]}
                hint="Nome de quem assina. Fica no documento junto com a hora e o IP."
              >
                <Input name="signedBy" required defaultValue={quote.patient.name} />
              </Field>

              <p className="text-xs text-muted">
                O aceite fecha o orçamento: ele para de aceitar edição, e o total vira o que a
                clínica tem a receber.
              </p>

              <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={aceitando}>
                  {aceitando ? "Registrando…" : "Confirmar aceite"}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => setAceitando(false)}
                >
                  Voltar
                </Button>
              </div>
            </form>
          ) : (
            <Button type="button" onClick={() => setAceitando(true)} className="w-full">
              Registrar aceite do paciente
            </Button>
          )
        ) : null}
      </div>
    </Panel>
  );
}
