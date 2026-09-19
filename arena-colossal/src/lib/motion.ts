'use client';

import type gsapType from 'gsap';
import type { ScrollTrigger as ScrollTriggerType } from 'gsap/ScrollTrigger';

type GsapBundle = {
  gsap: typeof gsapType;
  ScrollTrigger: typeof ScrollTriggerType;
};

let bundlePromise: Promise<GsapBundle> | null = null;

/**
 * Carrega GSAP + ScrollTrigger sob demanda.
 *
 * GSAP nunca entra no bundle inicial: so as secoes que realmente precisam de
 * scroll-linked animation (timeline do processo, scroll horizontal dos
 * servicos, parallax do hero) disparam este import, e apenas depois de
 * confirmarem que o usuario nao pediu movimento reduzido.
 */
export function loadGsap(): Promise<GsapBundle> {
  bundlePromise ??= (async () => {
    const [{ gsap }, { ScrollTrigger }] = await Promise.all([
      import('gsap'),
      import('gsap/ScrollTrigger'),
    ]);

    gsap.registerPlugin(ScrollTrigger);
    return { gsap, ScrollTrigger };
  })();

  return bundlePromise;
}
