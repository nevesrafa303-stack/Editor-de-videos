'use client';

import { useEffect } from 'react';

import { useIsDesktopPointer, usePrefersReducedMotion } from '@/lib/hooks/useMediaQuery';
import { loadGsap } from '@/lib/motion';

/**
 * Smooth scrolling (Lenis) — apenas no desktop.
 *
 * No mobile o scroll nativo ganha: e' o que o usuario espera, respeita o
 * momentum do sistema e nao briga com a barra de endereco. Com
 * `prefers-reduced-motion` o smooth scroll tambem sai de cena.
 *
 * Quando o Lenis esta ativo ele vira a fonte de verdade do scroll, entao o
 * ScrollTrigger e' sincronizado ao ticker do GSAP — sem isso as secoes com pin
 * ficam meio quadro atrasadas.
 */
export function SmoothScroll() {
  const isDesktopPointer = useIsDesktopPointer();
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (!isDesktopPointer || prefersReducedMotion) return;

    let disposed = false;
    let cleanup: (() => void) | undefined;

    void (async () => {
      const [{ default: Lenis }, { gsap, ScrollTrigger }] = await Promise.all([
        import('lenis'),
        loadGsap(),
      ]);
      if (disposed) return;

      const lenis = new Lenis({
        duration: 1.05,
        easing: (t: number) => Math.min(1, 1.001 - 2 ** (-10 * t)),
        smoothWheel: true,
        touchMultiplier: 1.6,
      });

      lenis.on('scroll', ScrollTrigger.update);

      const tick = (time: number) => lenis.raf(time * 1000);
      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(0);

      cleanup = () => {
        gsap.ticker.remove(tick);
        lenis.destroy();
      };
    })();

    return () => {
      disposed = true;
      cleanup?.();
    };
  }, [isDesktopPointer, prefersReducedMotion]);

  return null;
}
