"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

// GSAP, ScrollTrigger e Lenis ficam fora do pacote inicial. Carregam na primeira interação (rolar,
// tocar, mover o mouse, teclar) ou, sem interação, quando o navegador fica ocioso alguns segundos depois
// do carregamento. A abertura aparece sem esperar por eles (animação em CSS) e o conteúdo é completo
// mesmo sem animação.
const Motion = dynamic(() => import("./Motion").then((m) => m.Motion), { ssr: false });

const EVENTOS = ["scroll", "wheel", "touchstart", "pointerdown", "pointermove", "keydown"] as const;

export function MotionLazy() {
  const [ativo, setAtivo] = useState(false);

  useEffect(() => {
    let ocioso = 0;
    const iniciar = () => {
      EVENTOS.forEach((e) => window.removeEventListener(e, iniciar));
      window.clearTimeout(t);
      if (ocioso && "cancelIdleCallback" in window) window.cancelIdleCallback(ocioso);
      setAtivo(true);
    };
    EVENTOS.forEach((e) => window.addEventListener(e, iniciar, { passive: true, once: true }));
    const t = window.setTimeout(() => {
      if ("requestIdleCallback" in window) ocioso = window.requestIdleCallback(iniciar, { timeout: 2500 });
      else iniciar();
    }, 6000);
    return () => {
      EVENTOS.forEach((e) => window.removeEventListener(e, iniciar));
      window.clearTimeout(t);
      if (ocioso && "cancelIdleCallback" in window) window.cancelIdleCallback(ocioso);
    };
  }, []);

  return ativo ? <Motion /> : null;
}
