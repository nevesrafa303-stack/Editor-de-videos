"use client";

import { useActionState, useState } from "react";
import { analisarAction } from "@/modules/import/server-actions";
import { COLUNAS } from "@/modules/import";
import { EMPTY_STATE } from "@/shared/action-state";
import { Button, FormError, Notice, Panel, PanelHead, Textarea } from "@/ui";

/**
 * Arquivo OU texto colado.
 *
 * As duas portas existem porque as duas acontecem: quem exportou do sistema
 * antigo tem um arquivo; quem tem os pacientes numa planilha na nuvem copia as
 * celulas. Exigir arquivo faria a segunda pessoa salvar um CSV so para poder
 * usar o sistema.
 */
export function EnviarPlanilha() {
  const [state, action, pending] = useActionState(analisarAction, EMPTY_STATE);
  const [arquivo, setArquivo] = useState<string | null>(null);

  return (
    <Panel className="overflow-hidden">
      <PanelHead
        title="Nova importação"
        hint="Primeiro o sistema confere; nada é criado antes de você confirmar."
      />

      <form action={action} className="space-y-4 px-5 py-4">
        <FormError error={state.error} fieldErrors={state.fieldErrors} />

        {/* O botao do input de arquivo e desenhado pelo NAVEGADOR, no idioma
            dele: numa tela toda em portugues aparece "Choose File" se o
            navegador estiver em ingles. O input fica escondido e o rotulo faz
            as vezes de botao, com o texto sob nosso controle. */}
        <div>
          <span className="label">Arquivo CSV</span>
          <div className="flex flex-wrap items-center gap-3">
            <label
              htmlFor="arquivo"
              className="cursor-pointer rounded-md border border-line bg-surface px-3 py-1.5 text-sm font-medium text-ink transition hover:bg-sunken"
            >
              Escolher arquivo
            </label>
            <input
              id="arquivo"
              name="arquivo"
              type="file"
              accept=".csv,text/csv,text/plain"
              onChange={(e) => setArquivo(e.currentTarget.files?.[0]?.name ?? null)}
              className="sr-only"
            />
            <span className="num min-w-0 flex-1 truncate text-xs text-muted">
              {arquivo ?? "Nenhum arquivo escolhido"}
            </span>
          </div>
        </div>

        <div>
          <label htmlFor="csv" className="label">
            Ou cole as células aqui
          </label>
          <Textarea
            id="csv"
            name="csv"
            rows={6}
            placeholder={"nome,telefone,cpf,nascimento,saldo\nMaria Silva,(11) 98888-7777,390.533.447-05,15/03/1990,1.200,00"}
            className="font-mono text-xs"
          />
        </div>

        <Notice tone="neutral">
          <strong>Nome e telefone</strong> são obrigatórios. CPF, nascimento, e-mail e saldo em
          aberto entram se vierem. O que mais houver na planilha é ignorado —{" "}
          <strong>prontuário e histórico financeiro não são importados</strong>, porque registro
          clínico de origem desconhecida não pode virar registro próprio.
        </Notice>

        <details className="text-xs text-muted">
          <summary className="cursor-pointer select-none hover:text-ink-soft">
            Como a coluna pode se chamar
          </summary>
          <ul className="mt-2 space-y-1">
            {Object.entries(COLUNAS).map(([campo, nomes]) => (
              <li key={campo}>
                <span className="text-ink-soft">{ROTULO[campo] ?? campo}:</span>{" "}
                <span className="num">{nomes.join(", ")}</span>
              </li>
            ))}
          </ul>
          <p className="mt-2">
            Maiúscula, acento e espaço não importam: “Nome Completo” e “nome_completo” são a
            mesma coluna.
          </p>
        </details>

        <div className="flex justify-end">
          <Button type="submit" disabled={pending}>
            {pending ? "Conferindo…" : "Conferir planilha"}
          </Button>
        </div>
      </form>
    </Panel>
  );
}

const ROTULO: Record<string, string> = {
  fullName: "Nome",
  phone: "Telefone",
  taxId: "CPF",
  birthDate: "Nascimento",
  email: "E-mail",
  balance: "Saldo em aberto",
  dueDate: "Vencimento do saldo",
};
