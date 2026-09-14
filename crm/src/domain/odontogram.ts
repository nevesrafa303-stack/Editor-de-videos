/** Odontograma em notação FDI (ISO 3950). */

export const UPPER_RIGHT = ["18", "17", "16", "15", "14", "13", "12", "11"];
export const UPPER_LEFT = ["21", "22", "23", "24", "25", "26", "27", "28"];
export const LOWER_LEFT = ["31", "32", "33", "34", "35", "36", "37", "38"];
export const LOWER_RIGHT = ["48", "47", "46", "45", "44", "43", "42", "41"];

/** Deciduos (dentes de leite), para atendimento infantil. */
export const DECIDUOUS_UPPER_RIGHT = ["55", "54", "53", "52", "51"];
export const DECIDUOUS_UPPER_LEFT = ["61", "62", "63", "64", "65"];
export const DECIDUOUS_LOWER_LEFT = ["71", "72", "73", "74", "75"];
export const DECIDUOUS_LOWER_RIGHT = ["85", "84", "83", "82", "81"];

export const PERMANENT_TEETH = [
  ...UPPER_RIGHT,
  ...UPPER_LEFT,
  ...LOWER_RIGHT,
  ...LOWER_LEFT,
];

export const TOOTH_STATUSES = [
  "HIGIDO",
  "CARIE",
  "RESTAURADO",
  "AUSENTE",
  "IMPLANTE",
  "PROTESE",
  "CANAL",
  "EXTRACAO_INDICADA",
  "FRATURADO",
] as const;

export type ToothStatus = (typeof TOOTH_STATUSES)[number];

export const STATUS_LABEL: Record<ToothStatus, string> = {
  HIGIDO: "Hígido",
  CARIE: "Cárie",
  RESTAURADO: "Restaurado",
  AUSENTE: "Ausente",
  IMPLANTE: "Implante",
  PROTESE: "Prótese",
  CANAL: "Tratamento de canal",
  EXTRACAO_INDICADA: "Extração indicada",
  FRATURADO: "Fraturado",
};

/** Cor de preenchimento do dente no mapa. */
export const STATUS_COLOR: Record<ToothStatus, string> = {
  HIGIDO: "#ffffff",
  CARIE: "#ef4444",
  RESTAURADO: "#3b82f6",
  AUSENTE: "#94a3b8",
  IMPLANTE: "#8b5cf6",
  PROTESE: "#f59e0b",
  CANAL: "#ec4899",
  EXTRACAO_INDICADA: "#dc2626",
  FRATURADO: "#f97316",
};

export type ToothState = {
  status: ToothStatus;
  /** Faces envolvidas: O(clusal), M(esial), D(istal), V(estibular), L(ingual). */
  faces?: string[];
  note?: string;
};

export type ChartData = Record<string, ToothState>;

export function isValidTooth(tooth: string): boolean {
  return (
    PERMANENT_TEETH.includes(tooth) ||
    [
      ...DECIDUOUS_UPPER_RIGHT,
      ...DECIDUOUS_UPPER_LEFT,
      ...DECIDUOUS_LOWER_LEFT,
      ...DECIDUOUS_LOWER_RIGHT,
    ].includes(tooth)
  );
}

/** Le o JSON gravado no banco descartando dentes e estados desconhecidos. */
export function parseChart(raw: unknown): ChartData {
  if (!raw || typeof raw !== "object") return {};
  const chart: ChartData = {};

  for (const [tooth, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!isValidTooth(tooth) || !value || typeof value !== "object") continue;
    const state = value as Partial<ToothState>;
    if (!state.status || !TOOTH_STATUSES.includes(state.status as ToothStatus)) continue;

    chart[tooth] = {
      status: state.status as ToothStatus,
      faces: Array.isArray(state.faces) ? state.faces.filter((f) => typeof f === "string") : undefined,
      note: typeof state.note === "string" ? state.note : undefined,
    };
  }

  return chart;
}

/** Resumo textual para o cabecalho do prontuário. */
export function chartSummary(chart: ChartData): { status: ToothStatus; count: number }[] {
  const counts = new Map<ToothStatus, number>();
  for (const state of Object.values(chart)) {
    if (state.status === "HIGIDO") continue;
    counts.set(state.status, (counts.get(state.status) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([status, count]) => ({ status, count }))
    .sort((a, b) => b.count - a.count);
}
