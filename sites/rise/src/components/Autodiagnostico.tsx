"use client";

import { useEffect } from "react";
import { iniciarAutodiagnostico } from "@/lib/autodiagnostico";

// Liga o autodiagnóstico (a lógica fica em src/lib/autodiagnostico.ts, usada também pela prévia).
export function Autodiagnostico() {
  useEffect(() => iniciarAutodiagnostico(), []);
  return null;
}
