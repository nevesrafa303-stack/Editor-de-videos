"use client";

import { useActionState, useState } from "react";
import type { ToothState } from "@/modules/chart";
import { TOOTH_CONDITIONS, WHOLE_TOOTH, type ToothCondition } from "@/modules/chart/schema";
import { registrarDenteAction } from "@/modules/chart/server-actions";
import { EMPTY_STATE } from "@/shared/action-state";
import { Badge, Button, Field, Input, Notice, Select, cn, FormError } from "@/ui";
import { CONDICAO, FACE, Odontograma, facesDoDente } from "./odontograma";

const DENTICOES = ["permanente", "decidua", "mista"] as const;
type Denticao = (typeof DENTICOES)[number];

const ROTULO: Record<Denticao, string> = {
  permanente: "Permanente",
  decidua: "Decídua",
  mista: "Mista",
};

const MAPA: Record<Denticao, "permanent" | "deciduous"> = {
  permanente: "permanent",
  decidua: "deciduous",
  mista: "permanent",
};

export function PainelOdontograma({
  patientId,
  teeth,
  podeEscrever,
  fuso,
}: {
  patientId: string;
  teeth: ToothState[];
  podeEscrever: boolean;
  fuso: string;
}) {
  const [selecionado, setSelecionado] = useState<string | null>(null);

  // A dentição é escolhida à mão, não deduzida da idade: criança de 11 anos
  // está em plena troca, e adivinhar erra justamente em quem mais aparece na
  // odontopediatria.
  const [denticao, setDenticao] = useState<Denticao>(() =>
    teeth.some((d) => d.dentition === "deciduous" && d.entries.length > 0)
      ? "mista"
      : "permanente",
  );

  const visiveis = teeth.filter((d) =>
    denticao === "mista" ? true : d.dentition === MAPA[denticao],
  );

  const dente = visiveis.find((d) => d.code === selecionado) ?? null;
  const comRegistro = visiveis.filter((d) => d.entries.length > 0);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-1.5 px-5 pt-4">
        {DENTICOES.map((opcao) => (
          <button
            key={opcao}
            type="button"
            aria-pressed={denticao === opcao}
            onClick={() => {
              setDenticao(opcao);
              setSelecionado(null);
            }}
            className={cn(
              "rounded-md border px-2.5 py-1 text-xs font-medium transition",
              denticao === opcao
                ? "border-structure bg-structure-soft text-structure"
                : "border-line bg-surface text-ink-soft hover:bg-sunken",
            )}
          >
            {ROTULO[opcao]}
          </button>
        ))}
        <span className="text-xs text-muted">
          {denticao === "mista"
            ? "Permanentes e decíduos juntos, como na troca."
            : denticao === "decidua"
              ? "Numeração 51–85."
              : "Numeração 11–48."}
        </span>
      </div>

      <Odontograma teeth={visiveis} selecionado={selecionado} onSelecionar={setSelecionado} />

      <div className="flex flex-wrap gap-1.5 border-t border-line px-5 py-3">
        {TOOTH_CONDITIONS.filter((c) => c !== "healthy").map((c) => (
          <span
            key={c}
            className="inline-flex items-center gap-1.5 rounded-full border border-line px-2 py-0.5 text-[11px] text-ink-soft"
          >
            <span
              aria-hidden
              className="size-2.5 rounded-sm border border-line"
              style={{ backgroundColor: CONDICAO[c].cor }}
            />
            {CONDICAO[c].rotulo}
          </span>
        ))}
      </div>

      {dente ? (
        <DetalheDente
          key={dente.code}
          patientId={patientId}
          dente={dente}
          podeEscrever={podeEscrever}
          fuso={fuso}
          onFechar={() => setSelecionado(null)}
        />
      ) : (
        <p className="border-t border-line px-5 py-4 text-sm text-muted">
          {comRegistro.length === 0
            ? "Nenhum dente com registro. Clique em um dente para lançar o primeiro."
            : `${comRegistro.length} ${comRegistro.length === 1 ? "dente registrado" : "dentes registrados"}. Clique em um dente para ver o histórico ou lançar.`}
        </p>
      )}
    </div>
  );
}

function DetalheDente({
  patientId,
  dente,
  podeEscrever,
  fuso,
  onFechar,
}: {
  patientId: string;
  dente: ToothState;
  podeEscrever: boolean;
  fuso: string;
  onFechar: () => void;
}) {
  const [state, action, pending] = useActionState(registrarDenteAction, EMPTY_STATE);
  const [condicao, setCondicao] = useState<ToothCondition>("caries");
  const faces = facesDoDente(dente);
  const pedeFaces = !WHOLE_TOOTH.has(condicao);

  return (
    <div className="border-t border-line bg-sunken/40 px-5 py-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-ink">
          Dente {dente.code} <span className="font-normal text-muted">· {dente.namePt}</span>
        </h3>
        <button
          type="button"
          onClick={onFechar}
          className="text-xs text-muted underline-offset-2 hover:text-ink hover:underline"
        >
          Fechar
        </button>
      </div>

      {dente.entries.length > 0 ? (
        <ul className="mb-4 space-y-1.5">
          {dente.entries.map((e) => (
            <li key={e.id} className="flex flex-wrap items-center gap-2 text-sm">
              <span
                aria-hidden
                className="size-3 rounded-sm border border-line"
                style={{ backgroundColor: CONDICAO[e.condition].cor }}
              />
              <span className="font-medium text-ink">{CONDICAO[e.condition].rotulo}</span>
              {e.surfaces.length > 0 ? (
                <span className="text-xs text-muted">
                  {e.surfaces.map((f) => FACE[f]).join(", ")}
                </span>
              ) : null}
              <Badge tone={e.status === "planned" ? "accent" : "neutral"}>
                {e.status === "planned" ? "planejado" : e.status === "executed" ? "executado" : "existente"}
              </Badge>
              <span className="num text-xs text-muted">
                {e.recordedAt.toLocaleDateString("pt-BR", { timeZone: fuso })}
                {e.provider ? ` · ${e.provider}` : ""}
              </span>
              {e.notes ? <span className="w-full text-xs text-muted">{e.notes}</span> : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mb-4 text-sm text-muted">Sem registro para este dente.</p>
      )}

      {!podeEscrever ? (
        <p className="text-xs text-muted">Seu perfil não registra no odontograma.</p>
      ) : (
        <form action={action} className="space-y-3">
          <FormError error={state.error} fieldErrors={state.fieldErrors} />
          {state.success ? (
            <p className="text-sm font-medium text-positive">{state.success}</p>
          ) : null}

          <input type="hidden" name="patientId" value={patientId} />
          <input type="hidden" name="toothCode" value={dente.code} />

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Condição">
              <Select
                id={`condicao-${dente.code}`}
                name="condition"
                value={condicao}
                onChange={(e) => setCondicao(e.target.value as ToothCondition)}
              >
                {TOOTH_CONDITIONS.map((c) => (
                  <option key={c} value={c}>
                    {CONDICAO[c].rotulo}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Observação">
              <Input name="notes" placeholder="Opcional" />
            </Field>
          </div>

          {pedeFaces ? (
            <fieldset>
              <legend className="label">Faces</legend>
              <div className="flex flex-wrap gap-1.5">
                {faces.map((f) => (
                  <label
                    key={f}
                    className={cn(
                      "cursor-pointer rounded-md border border-line bg-surface px-2.5 py-1 text-xs text-ink-soft",
                      "has-checked:border-structure has-checked:bg-structure-soft has-checked:text-structure",
                    )}
                  >
                    <input type="checkbox" name="surfaces" value={f} className="sr-only" />
                    {FACE[f]}
                  </label>
                ))}
              </div>
              {state.fieldErrors?.surfaces ? (
                <p className="mt-1 text-xs text-critical">{state.fieldErrors.surfaces[0]}</p>
              ) : null}
            </fieldset>
          ) : (
            <p className="text-xs text-muted">
              {CONDICAO[condicao].rotulo} vale para o dente inteiro e substitui os registros
              anteriores dele.
            </p>
          )}

          <Button type="submit" size="sm" disabled={pending}>
            {pending ? "Registrando…" : "Registrar no dente"}
          </Button>
        </form>
      )}
    </div>
  );
}
