"use client";

import { useEffect } from "react";
import { track } from "@/lib/tracking";

export function ObrigadoEvento({ qualificado }: { qualificado: boolean }) {
  useEffect(() => {
    track("pagina_obrigado", { lead_qualificado: qualificado });
  }, [qualificado]);
  return null;
}
