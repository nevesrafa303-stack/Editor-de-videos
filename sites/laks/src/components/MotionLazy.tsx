"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

// GSAP, ScrollTrigger e Lenis ficam fora do pacote inicial. Carregam na primeira interação
// (rolar, tocar, teclar) ou, sem interação, alguns segundos depois do carregamento: o hero aparece
// sem esperar por eles e o conteúdo é completo mesmo sem animação.
const Motion = dynamic(() => import("./Motion").then((m) => m.Motion), { ssr: false });

const EVENTOS = ["scroll", "wheel", "touchstart", "pointerdown", "keydown"] as const;

export function MotionLazy() {
  const [ativo, setAtivo] = useState(false);

  useEffect(() => {
    const iniciar = () => {
      EVENTOS.forEach((e) => window.removeEventListener(e, iniciar));
      window.clearTimeout(t);
      setAtivo(true);
    };
    EVENTOS.forEach((e) => window.addEventListener(e, iniciar, { passive: true, once: true }));
    const t = window.setTimeout(iniciar, 3500);
    return () => {
      EVENTOS.forEach((e) => window.removeEventListener(e, iniciar));
      window.clearTimeout(t);
    };
  }, []);

  return ativo ? <Motion /> : null;
}
