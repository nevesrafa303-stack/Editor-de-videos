"use client";

import { useState, useTransition } from "react";
import { saveToothChart } from "@/server/actions/clinical";
import {
  LOWER_LEFT,
  LOWER_RIGHT,
  STATUS_COLOR,
  STATUS_LABEL,
  TOOTH_STATUSES,
  UPPER_LEFT,
  UPPER_RIGHT,
  type ChartData,
  type ToothStatus,
} from "@/domain/odontogram";
import { Button, cn } from "@/components/ui";

const FACES = ["O", "M", "D", "V", "L"] as const;

export function Odontogram({
  patientId,
  initial,
  readOnly,
}: {
  patientId: string;
  initial: ChartData;
  readOnly?: boolean;
}) {
  const [chart, setChart] = useState<ChartData>(initial);
  const [selected, setSelected] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  const current = selected ? chart[selected] : undefined;

  function applyStatus(status: ToothStatus) {
    if (!selected || readOnly) return;

    setChart((currentChart) => {
      const next = { ...currentChart };
      if (status === "HIGIDO") {
        delete next[selected];
      } else {
        next[selected] = { ...next[selected], status };
      }
      return next;
    });
    setDirty(true);
    setSaved(false);
  }

  function toggleFace(face: string) {
    if (!selected || readOnly || !chart[selected]) return;

    setChart((currentChart) => {
      const tooth = currentChart[selected];
      if (!tooth) return currentChart;
      const faces = new Set(tooth.faces ?? []);
      if (faces.has(face)) faces.delete(face);
      else faces.add(face);
      return { ...currentChart, [selected]: { ...tooth, faces: [...faces] } };
    });
    setDirty(true);
    setSaved(false);
  }

  function save() {
    startTransition(async () => {
      await saveToothChart(patientId, chart);
      setDirty(false);
      setSaved(true);
    });
  }

  const renderRow = (teeth: string[]) => (
    <div className="flex gap-1">
      {teeth.map((tooth) => {
        const state = chart[tooth];
        const color = state ? STATUS_COLOR[state.status] : "#ffffff";

        return (
          <button
            key={tooth}
            type="button"
            onClick={() => setSelected(tooth)}
            title={state ? STATUS_LABEL[state.status] : `Dente ${tooth}`}
            className={cn(
              "flex size-9 flex-col items-center justify-center rounded border text-[10px] font-medium transition",
              selected === tooth
                ? "border-brand-600 ring-2 ring-brand-200"
                : "border-slate-300 hover:border-slate-400",
            )}
            style={{
              backgroundColor: color,
              color: state && state.status !== "HIGIDO" ? "#ffffff" : "#334155",
            }}
          >
            {tooth}
            {state?.faces?.length ? (
              <span className="text-[8px] opacity-80">{state.faces.join("")}</span>
            ) : null}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-4 p-5">
      <div className="overflow-x-auto">
        <div className="inline-block space-y-1">
          <div className="flex gap-4">
            {renderRow(UPPER_RIGHT)}
            {renderRow(UPPER_LEFT)}
          </div>
          <div className="h-px bg-slate-200" />
          <div className="flex gap-4">
            {renderRow(LOWER_RIGHT)}
            {renderRow(LOWER_LEFT)}
          </div>
        </div>
      </div>

      {selected ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-800">
            Dente {selected}
            {current ? ` — ${STATUS_LABEL[current.status]}` : " — Hígido"}
          </p>

          {!readOnly ? (
            <>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {TOOTH_STATUSES.map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => applyStatus(status)}
                    className={cn(
                      "rounded-full border px-2.5 py-1 text-xs font-medium transition",
                      current?.status === status || (!current && status === "HIGIDO")
                        ? "border-slate-800 bg-slate-800 text-white"
                        : "border-slate-300 bg-white text-slate-600 hover:border-slate-400",
                    )}
                  >
                    {STATUS_LABEL[status]}
                  </button>
                ))}
              </div>

              {current ? (
                <div className="mt-3">
                  <p className="mb-1.5 text-xs font-medium tracking-wide text-slate-500 uppercase">
                    Faces
                  </p>
                  <div className="flex gap-1.5">
                    {FACES.map((face) => (
                      <button
                        key={face}
                        type="button"
                        onClick={() => toggleFace(face)}
                        className={cn(
                          "size-8 rounded border text-xs font-medium transition",
                          current.faces?.includes(face)
                            ? "border-brand-600 bg-brand-600 text-white"
                            : "border-slate-300 bg-white text-slate-600 hover:border-slate-400",
                        )}
                      >
                        {face}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </>
          ) : null}
        </div>
      ) : (
        <p className="text-sm text-slate-500">
          Clique em um dente para registrar o estado.
        </p>
      )}

      <div className="flex flex-wrap gap-x-4 gap-y-2">
        {TOOTH_STATUSES.filter((status) => status !== "HIGIDO").map((status) => (
          <span key={status} className="flex items-center gap-1.5 text-xs text-slate-600">
            <span
              className="size-3 rounded-sm border border-slate-300"
              style={{ backgroundColor: STATUS_COLOR[status] }}
            />
            {STATUS_LABEL[status]}
          </span>
        ))}
      </div>

      {!readOnly ? (
        <div className="flex items-center gap-3">
          <Button type="button" onClick={save} disabled={!dirty || pending}>
            {pending ? "Salvando..." : "Salvar odontograma"}
          </Button>
          {saved ? <span className="text-sm text-emerald-600">Salvo.</span> : null}
          {dirty ? <span className="text-sm text-amber-600">Alteracoes não salvas.</span> : null}
        </div>
      ) : null}
    </div>
  );
}
