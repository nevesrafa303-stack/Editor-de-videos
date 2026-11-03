"use client";

import { useEffect } from "react";
import { iniciarGaleria } from "@/lib/galeria";

// Liga os botões e o contador da galeria (a lógica fica em src/lib/galeria.ts, usada também pela prévia).
export function GaleriaControles() {
  useEffect(() => iniciarGaleria(), []);
  return null;
}
