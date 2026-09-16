"use client";

import { useActionState, useState } from "react";
import {
  estornarProcedimentoAction,
  executarProcedimentoAction,
} from "@/modules/stock/server-actions";
import { EMPTY_STATE } from "@/shared/action-state";
import { Button, Input } from "@/ui";
import { formatQuantidade, type ConsumoPrevisto } from "@/modules/stock";

/**
 * Executar o procedimento — e o material sair da prateleira junto.
 *
 * O botao mostra ANTES o que vai sair, e nao depois. A pessoa que clica e a
 * mesma que vai ouvir do paciente "acabou o produto?" — descobrir que o
 * estoque nao tinha depois de marcar como feito e a ordem errada.
 */
export function ExecutarItem({
  itemId,
  patientId,
  previa,
}: {
  itemId: string;
  patientId: string;
  previa: ConsumoPrevisto[];
}) {
  const [state, action, pending] = useActionState(executarProcedimentoAction, EMPTY_STATE);

  const faltando = previa.filter((p) => !p.opcional && p.saldo < p.precisa);

  return (
    <form action={action} className="flex flex-col items-end gap-1">
      <input type="hidden" name="itemId" value={itemId} />
      <input type="hidden" name="patientId" value={patientId} />

      <Button type="submit" variant="secondary" size="sm" disabled={pending}>
        {pending ? "Executando…" : "Executar"}
      </Button>

      <span className="text-right text-xs text-muted">
        {previa.length > 0
          ? `Baixa ${previa
              .map((p) => `${formatQuantidade(p.precisa, p.stockUnit)} de ${p.produto}`)
              .join(", ")}`
          : // Ficha tecnica vazia nao e erro, mas precisa aparecer: e a
            // diferenca entre "nao consome material" e "ninguem cadastrou o
            // que consome" — e so quem executa sabe qual das duas e.
            "Sem ficha técnica: nada sai do estoque"}
      </span>

      {faltando.length > 0 ? (
        // Aviso, nao bloqueio: travar aqui impede o dentista de fechar o
        // atendimento por causa de cadastro desatualizado — e clinica que nao
        // consegue trabalhar registra errado para conseguir.
        <span className="text-right text-xs text-warning">
          Estoque abaixo do necessário: {faltando.map((p) => p.produto).join(", ")}
        </span>
      ) : null}

      {state.error ? (
        <span className="text-right text-xs text-critical">{state.error}</span>
      ) : null}
    </form>
  );
}

/**
 * Desfazer a execucao.
 *
 * "Cliquei no dente errado" e o erro mais provavel desta tela. O motivo e
 * obrigatorio e o material volta ao lote de onde saiu — sem apagar a linha do
 * consumo, que continua no historico ao lado da devolucao.
 */
export function EstornarItem({
  itemId,
  patientId,
}: {
  itemId: string;
  patientId: string;
}) {
  const [state, action, pending] = useActionState(estornarProcedimentoAction, EMPTY_STATE);
  const [abrindo, setAbrindo] = useState(false);

  if (!abrindo) {
    return (
      <Button type="button" variant="ghost" size="sm" onClick={() => setAbrindo(true)}>
        Desfazer
      </Button>
    );
  }

  return (
    <form action={action} className="flex flex-wrap items-center justify-end gap-2">
      <input type="hidden" name="itemId" value={itemId} />
      <input type="hidden" name="patientId" value={patientId} />
      <Input name="reason" required placeholder="Por que está desfazendo?" className="w-52" autoFocus />
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Desfazendo…" : "Confirmar"}
      </Button>
      {state.error ? <span className="text-xs text-critical">{state.error}</span> : null}
    </form>
  );
}
