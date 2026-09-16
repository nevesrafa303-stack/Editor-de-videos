"use client";

import { useActionState, useState } from "react";
import { registrarEntradaAction } from "@/modules/stock/server-actions";
import { EMPTY_STATE } from "@/shared/action-state";
import { Button, Field, FormError, Input, Panel, Select, Textarea } from "@/ui";
import type { ProdutoOpcao } from "@/modules/stock";

/**
 * Entrada de material, com o lote nascendo junto.
 *
 * Um formulario so. Separar em "cadastre o lote" e depois "lance a entrada"
 * seria pedir duas coisas a quem esta com a caixa na mao e a nota fiscal do
 * lado — e a segunda metade e a que fica para depois.
 *
 * Os campos de lote aparecem conforme o produto: quem lanca resina nao devia
 * ver "número do lote" em cinza, e quem lanca toxina precisa que eles sejam
 * obrigatorios na cara, e nao so na mensagem de erro depois de enviar.
 */
export function EntradaForm({ produtos }: { produtos: ProdutoOpcao[] }) {
  const [state, action, pending] = useActionState(registrarEntradaAction, EMPTY_STATE);
  const [produtoId, setProdutoId] = useState("");

  const produto = produtos.find((p) => p.id === produtoId);
  const erro = (campo: string) => state.fieldErrors?.[campo]?.[0];

  return (
    <form action={action} className="space-y-5">
      <FormError error={state.error} fieldErrors={state.fieldErrors} />

      <Panel className="grid gap-4 p-5 sm:grid-cols-2">
        <Field label="Produto" className="sm:col-span-2" error={erro("productId")}>
          <Select
            name="productId"
            required
            value={produtoId}
            onChange={(e) => setProdutoId(e.target.value)}
          >
            <option value="">Escolha o produto</option>
            {produtos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome} ({p.code})
              </option>
            ))}
          </Select>
        </Field>

        <Field
          label={produto ? `Quantidade (${produto.stockUnit})` : "Quantidade"}
          error={erro("quantity")}
          hint="Na unidade em que se compra e se conta."
        >
          <Input name="quantity" required placeholder="0" className="num" inputMode="decimal" />
        </Field>

        <Field
          label="Custo unitário (R$)"
          error={erro("unitCostCents")}
          hint="Em branco usa o custo de catálogo."
        >
          <Input name="unitCost" placeholder="0,00" className="num" inputMode="decimal" />
        </Field>

        {produto?.exigeLote ? (
          <>
            <Field
              label="Número do lote"
              error={erro("lotNumber")}
              hint="É o que responde “quem recebeu deste lote” num recall."
            >
              <Input name="lotNumber" required />
            </Field>

            <Field label="Validade" error={erro("expiresOn")}>
              <Input name="expiresOn" type="date" required />
            </Field>
          </>
        ) : (
          // Produto sem rastreio nao ganha campo de lote nem desabilitado:
          // campo cinza na tela e uma pergunta que a pessoa ainda le.
          <input type="hidden" name="lotNumber" value="" />
        )}

        <Field label="Nota fiscal" hint="Opcional. Ajuda a achar a compra depois.">
          <Input name="invoiceNumber" />
        </Field>

        <Field label="Observação" className="sm:col-span-2">
          <Textarea name="notes" rows={2} placeholder="Fornecedor, condição, o que for útil" />
        </Field>
      </Panel>

      <div className="flex justify-end">
        <Button type="submit" size="lg" disabled={pending || !produtoId}>
          {pending ? "Registrando…" : "Registrar entrada"}
        </Button>
      </div>
    </form>
  );
}
