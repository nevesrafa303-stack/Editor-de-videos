"use client";

import { useEffect, useId, useRef, useState } from "react";
import { cn } from "@/components/ui";

type Option = { id: string; name: string; phone: string };

/**
 * Seletor de paciente com busca no servidor. Uma clínica com dez mil pacientes
 * não cabe num <select>, e a recepção busca por nome parcial ou telefone.
 */
export function PatientPicker({
  name = "patientId",
  initial,
  required,
}: {
  name?: string;
  initial?: { id: string; name: string };
  required?: boolean;
}) {
  const [term, setTerm] = useState(initial?.name ?? "");
  const [selected, setSelected] = useState<string>(initial?.id ?? "");
  const [options, setOptions] = useState<Option[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  useEffect(() => {
    if (!open) return;

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/pacientes?q=${encodeURIComponent(term)}`,
          { signal: controller.signal },
        );
        if (response.ok) setOptions(await response.json());
      } catch {
        // Busca cancelada ou rede indisponivel: mantem a lista anterior.
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [term, open]);

  useEffect(() => {
    function onClickOutside(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <input type="hidden" name={name} value={selected} required={required} />

      <input
        className="field-input"
        placeholder="Buscar por nome, telefone ou CPF"
        value={term}
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        autoComplete="off"
        onFocus={() => setOpen(true)}
        onChange={(event) => {
          setTerm(event.target.value);
          setSelected("");
          setOpen(true);
        }}
      />

      {open ? (
        <ul
          id={listId}
          className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
        >
          {loading && options.length === 0 ? (
            <li className="px-3 py-2 text-sm text-slate-400">Buscando...</li>
          ) : null}

          {!loading && options.length === 0 ? (
            <li className="px-3 py-2 text-sm text-slate-400">
              Nenhum paciente encontrado.
            </li>
          ) : null}

          {options.map((option) => (
            <li key={option.id}>
              <button
                type="button"
                className={cn(
                  "flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-brand-50",
                  selected === option.id && "bg-brand-50",
                )}
                onClick={() => {
                  setSelected(option.id);
                  setTerm(option.name);
                  setOpen(false);
                }}
              >
                <span className="font-medium text-slate-800">{option.name}</span>
                <span className="text-xs text-slate-500">{option.phone}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {required && !selected ? (
        <p className="mt-1 text-xs text-slate-400">Selecione um paciente da lista.</p>
      ) : null}
    </div>
  );
}
