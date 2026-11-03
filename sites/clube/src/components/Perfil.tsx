"use client";

import { useEffect } from "react";
import { iniciarPerfil } from "@/lib/perfil";

// Liga as chaves do "Para quem é" (a lógica fica em src/lib/perfil.ts, usada também pela prévia).
export function Perfil() {
  useEffect(() => iniciarPerfil(), []);
  return null;
}
