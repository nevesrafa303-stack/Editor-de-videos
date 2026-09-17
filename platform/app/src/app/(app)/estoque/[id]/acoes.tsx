"use client";

import { useActionState, useState } from "react";
import {
  acertarSaldoAction,
  bloquearLoteAction,
  registrarPerdaAction,
  transferirAction,
} from "@/modules/stock/server-actions";
import { EMPTY_STATE } from "@/shared/action-state";
import { Button, Field, FormError, Input, Panel, PanelHead, Select, Textarea } from "@/ui";
import type { LoteLinha } from "@/modules/stock";
import { formatQuantidade } from "@/modules/stock";

/**
 * Perda e acerto, um ao lado do outro.
 *
 * Sao as duas unicas formas de material sair sem paciente por tras, e ficam
 * juntas de proposito: quem abre esta tela ja sabe que o numero esta errado e
 * precisa escolher entre "sumiu material" (perda, com motivo) e "o sistema
 * estava errado" (acerto, com o que foi contado).
 */
export function AcoesDoProduto({
  productId,
  stockUnit,
  lotes,
  outrasUnidades,
}: {
  productId: string;
  stockUnit: string;
  lotes: LoteLinha[];
  /** Unidades de destino possíveis. Vazio = a rede tem uma unidade só. */
  outrasUnidades: { id: string; name: string }[];
}) {
  return (
    <div className="grid items-start gap-5 lg:grid-cols-2">
      <FormPerda productId={productId} stockUnit={stockUnit} lotes={lotes} />
      <FormAcerto productId={productId} stockUnit={stockUnit} lotes={lotes} />
      {/* Transferência só aparece quando há para onde transferir. Numa clínica
          de uma unidade só, o formulário seria uma pergunta sem resposta. */}
      {outrasUnidades.length > 0 ? (
        <FormTransferencia
          productId={productId}
          stockUnit={stockUnit}
          lotes={lotes}
          unidades={outrasUnidades}
          className="lg:col-span-2"
        />
      ) : null}
    </div>
  );
}

function FormTransferencia({
  productId,
  stockUnit,
  lotes,
  unidades,
  className,
}: {
  productId: string;
  stockUnit: string;
  lotes: LoteLinha[];
  unidades: { id: string; name: string }[];
  className?: string;
}) {
  const [state, action, pending] = useActionState(transferirAction, EMPTY_STATE);
  const erro = (campo: string) => state.fieldErrors?.[campo]?.[0];

  return (
    <Panel className={className}>
      <PanelHead
        title="Transferir para outra unidade"
        hint="Sai daqui e entra lá, no mesmo lote e na mesma hora. Não dá para transferir mais do que existe nesta unidade."
      />
      <form action={action} className="grid gap-4 p-5 sm:grid-cols-2">
        <FormError error={state.error} fieldErrors={state.fieldErrors} />
        <input type="hidden" name="productId" value={productId} />

        <SeletorDeLote lotes={lotes} />

        <Field label="Para onde" error={erro("toUnitId")}>
          <Select name="toUnitId" required defaultValue={unidades[0]?.id ?? ""}>
            {unidades.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </Select>
        </Field>

        <Field label={`Quantidade (${stockUnit})`} error={erro("quantity")}>
          <Input name="quantity" required placeholder="0" className="num" inputMode="decimal" />
        </Field>

        <Field label="Observação" hint="Opcional. Aparece no histórico das duas unidades.">
          <Input name="notes" placeholder="Reposição da agenda de quinta" />
        </Field>

        <div className="flex justify-end sm:col-span-2">
          <Button type="submit" variant="secondary" disabled={pending}>
            {pending ? "Transferindo…" : "Transferir"}
          </Button>
        </div>
      </form>
    </Panel>
  );
}

function SeletorDeLote({ lotes }: { lotes: LoteLinha[] }) {
  if (lotes.length === 0) return <input type="hidden" name="lotId" value="" />;

  return (
    <Field label="Lote" hint="Escolha de qual caixa o material saiu.">
      <Select name="lotId" defaultValue={lotes[0]?.id ?? ""}>
        {lotes.map((l) => (
          <option key={l.id} value={l.id}>
            {l.numero} · vence {l.validade.split("-").reverse().join("/")} ·{" "}
            {formatQuantidade(l.saldo)} em estoque
          </option>
        ))}
      </Select>
    </Field>
  );
}

function FormPerda({
  productId,
  stockUnit,
  lotes,
}: {
  productId: string;
  stockUnit: string;
  lotes: LoteLinha[];
}) {
  const [state, action, pending] = useActionState(registrarPerdaAction, EMPTY_STATE);
  const erro = (campo: string) => state.fieldErrors?.[campo]?.[0];

  return (
    <Panel>
      <PanelHead title="Registrar perda" hint="Quebrou, caiu, venceu, foi descartado." />
      <form action={action} className="space-y-4 p-5">
        <FormError error={state.error} fieldErrors={state.fieldErrors} />
        <input type="hidden" name="productId" value={productId} />

        <SeletorDeLote lotes={lotes} />

        <Field label={`Quantidade (${stockUnit})`} error={erro("quantity")}>
          <Input name="quantity" required placeholder="0" className="num" inputMode="decimal" />
        </Field>

        <Field
          label="O que aconteceu"
          error={erro("reason")}
          hint="Fica no histórico. É o que responde a divergência no mês que vem."
        >
          <Textarea name="reason" rows={2} required placeholder="Frasco quebrou na bancada" />
        </Field>

        <div className="flex justify-end">
          <Button type="submit" variant="secondary" disabled={pending}>
            {pending ? "Registrando…" : "Registrar perda"}
          </Button>
        </div>
      </form>
    </Panel>
  );
}

function FormAcerto({
  productId,
  stockUnit,
  lotes,
}: {
  productId: string;
  stockUnit: string;
  lotes: LoteLinha[];
}) {
  const [state, action, pending] = useActionState(acertarSaldoAction, EMPTY_STATE);
  const erro = (campo: string) => state.fieldErrors?.[campo]?.[0];

  return (
    <Panel>
      <PanelHead
        title="Acertar pela contagem"
        hint="Escreva o que você contou. A diferença é o sistema que calcula."
      />
      <form action={action} className="space-y-4 p-5">
        <FormError error={state.error} fieldErrors={state.fieldErrors} />
        <input type="hidden" name="productId" value={productId} />

        <SeletorDeLote lotes={lotes} />

        <Field
          label={`Contei (${stockUnit})`}
          error={erro("countedQuantity")}
          hint="O saldo que está na prateleira agora, não a diferença."
        >
          <Input name="countedQuantity" required placeholder="0" className="num" inputMode="decimal" />
        </Field>

        <Field label="Por que estava diferente" error={erro("reason")}>
          <Textarea name="reason" rows={2} required placeholder="Contagem de fim de mês" />
        </Field>

        <div className="flex justify-end">
          <Button type="submit" variant="secondary" disabled={pending}>
            {pending ? "Lançando…" : "Lançar acerto"}
          </Button>
        </div>
      </form>
    </Panel>
  );
}

/**
 * Bloqueio sanitario de lote.
 *
 * Fica na linha do lote, e nao num formulario separado, porque a acao e sempre
 * sobre UM lote especifico — o que apareceu no recall. Um seletor de lote aqui
 * seria uma chance a mais de bloquear o errado.
 */
export function BloquearLote({
  productId,
  lote,
}: {
  productId: string;
  lote: LoteLinha;
}) {
  const [state, action, pending] = useActionState(bloquearLoteAction, EMPTY_STATE);
  const [abrindo, setAbrindo] = useState(false);

  if (lote.bloqueado) {
    return (
      <form action={action} className="flex items-center gap-2">
        <input type="hidden" name="productId" value={productId} />
        <input type="hidden" name="lotId" value={lote.id} />
        <input type="hidden" name="desbloquear" value="1" />
        <Button type="submit" variant="ghost" size="sm" disabled={pending}>
          {pending ? "Liberando…" : "Liberar"}
        </Button>
      </form>
    );
  }

  if (!abrindo) {
    return (
      <Button type="button" variant="ghost" size="sm" onClick={() => setAbrindo(true)}>
        Bloquear
      </Button>
    );
  }

  return (
    <form action={action} className="flex flex-wrap items-center justify-end gap-2">
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="lotId" value={lote.id} />
      <Input name="reason" required placeholder="Motivo do bloqueio" className="w-48" autoFocus />
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Bloqueando…" : "Confirmar"}
      </Button>
      {state.error ? <span className="text-xs text-critical">{state.error}</span> : null}
    </form>
  );
}
