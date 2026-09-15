"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import type { InstallmentRow } from "@/modules/finance";
import { receberAction } from "@/modules/finance/server-actions";
import { EMPTY_STATE } from "@/shared/action-state";
import { Badge, Button, Empty, Field, FormError, Input, Select, cn } from "@/ui";
import { formatBRL, formatDateOnly, formatPhone } from "@/shared/format";

type Metodo = { id: string; name: string; affectsCash: boolean };

export function Parcelas({
  items,
  metodos,
  podeReceber,
  temCaixaAberto,
  recorte,
  busca,
}: {
  items: InstallmentRow[];
  metodos: Metodo[];
  podeReceber: boolean;
  temCaixaAberto: boolean;
  recorte: string;
  busca: string;
}) {
  if (items.length === 0) {
    return <Empty title="Nada aqui" hint="Nenhuma parcela neste recorte." />;
  }

  return (
    <ul className="divide-y divide-line">
      {items.map((parcela) => (
        <Parcela
          key={parcela.id}
          parcela={parcela}
          metodos={metodos}
          podeReceber={podeReceber}
          temCaixaAberto={temCaixaAberto}
          recorte={recorte}
          busca={busca}
        />
      ))}
    </ul>
  );
}

function Parcela({
  parcela,
  metodos,
  podeReceber,
  temCaixaAberto,
  recorte,
  busca,
}: {
  parcela: InstallmentRow;
  metodos: Metodo[];
  podeReceber: boolean;
  temCaixaAberto: boolean;
  recorte: string;
  busca: string;
}) {
  const [state, action, pending] = useActionState(receberAction, EMPTY_STATE);
  const [aberto, setAberto] = useState(false);
  const [metodo, setMetodo] = useState(metodos[0]?.id ?? "");
  const [perdoar, setPerdoar] = useState(false);

  const vencida = parcela.lateDays > 0;
  const encargos = parcela.fineCents + parcela.interestCents;
  const aCobrar = perdoar ? parcela.balanceCents : parcela.totalDueCents;
  const precisaCaixa = metodos.find((m) => m.id === metodo)?.affectsCash ?? false;

  return (
    <li className={cn("px-5 py-3", parcela.status === "paid" && "opacity-70")}>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <span className="num w-24 shrink-0 text-sm">
          <span className={vencida ? "font-medium text-critical" : "text-ink-soft"}>
            {formatDateOnly(parcela.dueOn)}
          </span>
          <span className="block text-xs text-muted">
            {parcela.number}/{parcela.totalCount}
          </span>
        </span>

        <span className="min-w-40 flex-1">
          <Link
            href={`/pacientes/${parcela.patientId}`}
            className="text-sm font-medium text-ink hover:text-structure"
          >
            {parcela.patientName}
          </Link>
          <span className="num block text-xs text-muted">
            {formatPhone(parcela.patientPhone)}
            {parcela.description ? ` · ${parcela.description}` : ""}
          </span>
        </span>

        {vencida ? (
          <Badge tone="critical">
            {parcela.lateDays} {parcela.lateDays === 1 ? "dia" : "dias"}
          </Badge>
        ) : null}

        {parcela.status === "paid" ? <Badge tone="positive">Quitada</Badge> : null}
        {parcela.status === "partially_paid" ? <Badge tone="warning">Parcial</Badge> : null}

        <span className="num w-32 shrink-0 text-right">
          <span className="block text-sm font-semibold text-ink">
            {formatBRL(parcela.totalDueCents)}
          </span>
          {encargos > 0 ? (
            <span className="block text-xs text-critical">
              +{formatBRL(encargos)} multa e juros
            </span>
          ) : null}
        </span>

        {podeReceber && parcela.status !== "paid" ? (
          <Button
            type="button"
            size="sm"
            variant={aberto ? "secondary" : "primary"}
            onClick={() => setAberto((v) => !v)}
          >
            {aberto ? "Fechar" : "Receber"}
          </Button>
        ) : null}
      </div>

      {aberto ? (
        <form action={action} className="mt-3 rounded-md border border-line bg-sunken/40 p-3">
          <FormError error={state.error} fieldErrors={state.fieldErrors} />

          <input type="hidden" name="installmentId" value={parcela.id} />
          <input type="hidden" name="recorte" value={recorte} />
          <input type="hidden" name="busca" value={busca} />

          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_140px_auto] sm:items-end">
            <Field label="Forma de pagamento" error={state.fieldErrors?.paymentMethodId?.[0]}>
              <Select
                name="paymentMethodId"
                value={metodo}
                onChange={(e) => setMetodo(e.target.value)}
                required
              >
                {metodos.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </Select>
            </Field>

            <Field
              label="Valor (R$)"
              error={state.fieldErrors?.amountCents?.[0]}
              hint={encargos > 0 && !perdoar ? "Total entregue, mora inclusa" : undefined}
            >
              <Input
                name="amount"
                className="num"
                required
                key={`${perdoar}-${aCobrar}`}
                defaultValue={(aCobrar / 100).toFixed(2).replace(".", ",")}
              />
            </Field>

            <Button type="submit" disabled={pending} className="mb-0.5">
              {pending ? "Registrando…" : "Confirmar"}
            </Button>
          </div>

          {encargos > 0 ? (
            <label className="mt-3 flex items-center gap-2 text-sm text-ink-soft">
              <input
                type="checkbox"
                name="waiveCharges"
                checked={perdoar}
                onChange={(e) => setPerdoar(e.target.checked)}
                className="size-4 rounded border-line text-structure focus:ring-structure"
              />
              Perdoar {formatBRL(encargos)} de multa e juros
              <span className="text-xs text-muted">— fica registrado com o seu nome</span>
            </label>
          ) : null}

          {precisaCaixa && !temCaixaAberto ? (
            <p className="mt-3 text-xs text-warning">
              Dinheiro em espécie precisa de caixa aberto.{" "}
              <Link href="/financeiro/caixa" className="underline underline-offset-2">
                Abrir o caixa
              </Link>
              .
            </p>
          ) : null}

          <Field label="Observação" className="mt-3">
            <Input name="notes" placeholder="Opcional" />
          </Field>
        </form>
      ) : null}
    </li>
  );
}
