"use client";

import { useEffect } from "react";
import { iniciarCabecalho, iniciarMenu } from "@/lib/cabecalho";
import { iniciarInteracoes } from "@/lib/interacoes";

// Liga o comportamento do cabeçalho, das abas, do cronograma, do mapa e do formulário. O mesmo código
// roda na prévia em arquivo único (sites/_fontes/reforce/preview).
export function Interacoes() {
  useEffect(() => iniciarCabecalho(), []);
  useEffect(() => iniciarMenu(), []);
  useEffect(() => iniciarInteracoes(), []);
  return null;
}
