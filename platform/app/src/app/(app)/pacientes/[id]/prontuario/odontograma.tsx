"use client";

import { useState } from "react";
import type { ToothState } from "@/modules/chart";
import type { Surface, ToothCondition } from "@/modules/chart/schema";
import { cn } from "@/ui";

/**
 * Odontograma FDI.
 *
 * Cada dente e uma caixa 3x3: o centro e a face oclusal (ou incisal, nos
 * anteriores) e as bordas sao as outras faces. A face vestibular fica sempre
 * para FORA do arco — para cima no superior, para baixo no inferior — porque e
 * assim que o dentista le, e um odontograma que exige traducao mental na hora
 * do atendimento nao serve.
 *
 * Mesial e a face voltada para a linha media. Como o quadrante 1 (superior
 * direito do paciente) e desenhado a esquerda de quem olha, mesial fica a
 * direita da caixa nos quadrantes 1 e 4, e a esquerda nos quadrantes 2 e 3.
 */

export const CONDICAO: Record<ToothCondition, { rotulo: string; cor: string; texto: string }> = {
  healthy: { rotulo: "Hígido", cor: "#ffffff", texto: "#14201d" },
  caries: { rotulo: "Cárie", cor: "#9f1239", texto: "#ffffff" },
  restoration: { rotulo: "Restauração", cor: "#0b6b5e", texto: "#ffffff" },
  sealant: { rotulo: "Selante", cor: "#7dd3c4", texto: "#14201d" },
  missing: { rotulo: "Ausente", cor: "#b9c4bf", texto: "#3d4b46" },
  implant: { rotulo: "Implante", cor: "#1e3a8a", texto: "#ffffff" },
  prosthesis: { rotulo: "Prótese", cor: "#6d28d9", texto: "#ffffff" },
  crown: { rotulo: "Coroa", cor: "#a8500d", texto: "#ffffff" },
  root_canal: { rotulo: "Canal", cor: "#be185d", texto: "#ffffff" },
  extraction_indicated: { rotulo: "Extração indicada", cor: "#92400e", texto: "#ffffff" },
  fractured: { rotulo: "Fratura", cor: "#ea580c", texto: "#ffffff" },
  bridge_pontic: { rotulo: "Pôntico", cor: "#4c1d95", texto: "#ffffff" },
  impacted: { rotulo: "Incluso", cor: "#334155", texto: "#ffffff" },
  mobility: { rotulo: "Mobilidade", cor: "#b45309", texto: "#ffffff" },
  periapical_lesion: { rotulo: "Lesão periapical", cor: "#7f1d1d", texto: "#ffffff" },
};

export const FACE: Record<Surface, string> = {
  O: "Oclusal",
  I: "Incisal",
  M: "Mesial",
  D: "Distal",
  V: "Vestibular",
  L: "Lingual",
  P: "Palatina",
  C: "Cervical",
};

/** Faces que um dente oferece, conforme arcada e posicao. */
export function facesDoDente(dente: ToothState): Surface[] {
  const centro: Surface = dente.position <= 3 ? "I" : "O";
  const interna: Surface = dente.arch === "upper" ? "P" : "L";
  return [centro, "M", "D", "V", interna];
}

function condicaoDaFace(dente: ToothState, face: Surface): ToothCondition | null {
  // O registro mais recente vence: as entradas ja vem em ordem de gravacao.
  let achado: ToothCondition | null = null;
  for (const e of dente.entries) {
    if (e.surfaces.includes(face)) achado = e.condition;
  }
  return achado;
}

function condicaoDoDente(dente: ToothState): ToothCondition | null {
  let achado: ToothCondition | null = null;
  for (const e of dente.entries) {
    if (e.surfaces.length === 0) achado = e.condition;
  }
  return achado;
}

export function Odontograma({
  teeth,
  selecionado,
  onSelecionar,
}: {
  teeth: ToothState[];
  selecionado: string | null;
  onSelecionar: (code: string) => void;
}) {
  const porQuadrante = (q: number) => teeth.filter((d) => d.quadrant === q);

  // Permanentes ocupam os quadrantes 1–4; decíduos, 5–8. Desenhar os dois
  // juntos é a dentição mista — a boca de quem tem entre 6 e 12 anos.
  const superior = [
    ...porQuadrante(1).slice().sort((a, b) => b.position - a.position),
    ...porQuadrante(5).slice().sort((a, b) => b.position - a.position),
    ...porQuadrante(6).slice().sort((a, b) => a.position - b.position),
    ...porQuadrante(2).slice().sort((a, b) => a.position - b.position),
  ];
  const inferior = [
    ...porQuadrante(4).slice().sort((a, b) => b.position - a.position),
    ...porQuadrante(8).slice().sort((a, b) => b.position - a.position),
    ...porQuadrante(7).slice().sort((a, b) => a.position - b.position),
    ...porQuadrante(3).slice().sort((a, b) => a.position - b.position),
  ];

  // Mais de 32 dentes e denticao mista: os dentes encolhem para a boca inteira
  // caber sem rolagem. Ler metade do odontograma por vez nao serve.
  const compacto = teeth.length > 32;

  return (
    <div className="overflow-x-auto px-5 py-4">
      <div className={cn("space-y-1", compacto ? "min-w-[900px]" : "min-w-[680px]")}>
        <Arcada
          dentes={superior}
          selecionado={selecionado}
          onSelecionar={onSelecionar}
          compacto={compacto}
        />
        <div className="h-px bg-line-strong" />
        <Arcada
          dentes={inferior}
          selecionado={selecionado}
          onSelecionar={onSelecionar}
          compacto={compacto}
        />
      </div>
    </div>
  );
}

function Arcada({
  dentes,
  selecionado,
  onSelecionar,
  compacto,
}: {
  dentes: ToothState[];
  selecionado: string | null;
  onSelecionar: (code: string) => void;
  compacto: boolean;
}) {
  return (
    <div className="flex justify-center gap-1">
      {dentes.map((dente, i) => (
        <div key={dente.code} className={cn(i === Math.floor(dentes.length / 2) - 1 && "mr-3")}>
          <Dente
            dente={dente}
            selecionado={selecionado === dente.code}
            onSelecionar={onSelecionar}
            compacto={compacto}
          />
        </div>
      ))}
    </div>
  );
}

function Dente({
  dente,
  selecionado,
  onSelecionar,
  compacto,
}: {
  dente: ToothState;
  selecionado: boolean;
  onSelecionar: (code: string) => void;
  compacto: boolean;
}) {
  const centro: Surface = dente.position <= 3 ? "I" : "O";
  const interna: Surface = dente.arch === "upper" ? "P" : "L";
  const direita: Surface = dente.side === "right" ? "M" : "D";
  const esquerda: Surface = dente.side === "right" ? "D" : "M";

  // Vestibular para fora do arco: cima no superior, baixo no inferior.
  const cima: Surface = dente.arch === "upper" ? "V" : interna;
  const baixo: Surface = dente.arch === "upper" ? interna : "V";

  const inteiro = condicaoDoDente(dente);
  const ausente = inteiro === "missing";

  const cel = (face: Surface) => {
    const cond = inteiro && inteiro !== "healthy" ? inteiro : condicaoDaFace(dente, face);
    const meta = cond ? CONDICAO[cond] : null;
    return (
      <span
        title={FACE[face]}
        className="border border-line"
        style={{ backgroundColor: meta?.cor ?? "var(--color-surface)" }}
      />
    );
  };

  const rotulo = [
    `Dente ${dente.code} — ${dente.namePt}`,
    ...dente.entries.map(
      (e) =>
        `${CONDICAO[e.condition].rotulo}${
          e.surfaces.length > 0 ? ` (${e.surfaces.join(", ")})` : ""
        }`,
    ),
  ].join("\n");

  return (
    <button
      type="button"
      onClick={() => onSelecionar(dente.code)}
      title={rotulo}
      aria-label={rotulo}
      aria-pressed={selecionado}
      className={cn(
        "flex flex-col items-center gap-0.5 rounded p-0.5 transition",
        compacto ? "w-8" : "w-11",
        selecionado ? "bg-structure-soft ring-2 ring-structure" : "hover:bg-sunken",
      )}
    >
      {dente.arch === "lower" ? (
        <span className={cn("num leading-none text-muted", compacto ? "text-[9px]" : "text-[11px]")}>
          {dente.code}
        </span>
      ) : null}

      <span
        className={cn(
          "relative grid rounded-sm",
          compacto
            ? "size-7 grid-cols-[6px_1fr_6px] grid-rows-[6px_1fr_6px]"
            : "size-10 grid-cols-[8px_1fr_8px] grid-rows-[8px_1fr_8px]",
        )}
        // Condicao de dente inteiro pinta a caixa toda, inclusive os cantos:
        // um dente com canal tratado tem que ser reconhecivel de relance, sem
        // o leitor precisar reparar em quais celulas estao coloridas.
        style={
          inteiro && inteiro !== "healthy"
            ? { backgroundColor: CONDICAO[inteiro].cor }
            : undefined
        }
      >
        <span />
        {cel(cima)}
        <span />
        {cel(esquerda)}
        {cel(centro)}
        {cel(direita)}
        <span />
        {cel(baixo)}
        <span />

        {ausente ? (
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm font-bold text-ink-soft"
          >
            ✕
          </span>
        ) : null}
      </span>

      {dente.arch === "upper" ? (
        <span className={cn("num leading-none text-muted", compacto ? "text-[9px]" : "text-[11px]")}>
          {dente.code}
        </span>
      ) : null}
    </button>
  );
}

/** Estado de selecao, para a tela inteira compartilhar. */
export function useDenteSelecionado(inicial: string | null = null) {
  return useState<string | null>(inicial);
}
