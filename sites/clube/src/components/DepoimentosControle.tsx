"use client";

import { useEffect } from "react";
import { iniciarDepoimentos } from "@/lib/depoimentos";

// Liga a playlist de depoimentos (a lógica fica em src/lib/depoimentos.ts, usada também pela prévia).
export function DepoimentosControle() {
  useEffect(() => iniciarDepoimentos(), []);
  return null;
}
