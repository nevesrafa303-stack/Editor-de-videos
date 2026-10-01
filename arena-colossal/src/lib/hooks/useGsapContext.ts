'use client';

import { useEffect, type RefObject } from 'react';

import { loadGsap } from '@/lib/motion';
import { usePrefersReducedMotion } from '@/lib/hooks/useMediaQuery';

type SetupArgs = Awaited<ReturnType<typeof loadGsap>> & {
  root: HTMLElement;
};

/**
 * Executa uma animacao GSAP com escopo no elemento `ref`, limpando tudo no
 * unmount via `gsap.context()`.
 *
 * A animacao e' pulada por completo quando:
 *   - o usuario pediu movimento reduzido, ou
 *   - `enabled` e' `false` (tipicamente: mobile, onde usamos reveals em CSS).
 *
 * O conteudo precisa estar legivel sem a animacao rodar — este hook so
 * acrescenta movimento, nunca revela conteudo escondido.
 */
export function useGsapContext(
  ref: RefObject<HTMLElement | null>,
  setup: (args: SetupArgs) => void,
  { enabled = true, deps = [] as unknown[] } = {},
): void {
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const root = ref.current;
    if (!root || !enabled || prefersReducedMotion) return;

    let context: { revert: () => void } | null = null;
    let cancelled = false;

    void loadGsap().then((bundle) => {
      if (cancelled) return;
      context = bundle.gsap.context(() => setup({ ...bundle, root }), root);
      // Layout pode ter mudado enquanto o GSAP carregava.
      bundle.ScrollTrigger.refresh();
    });

    return () => {
      cancelled = true;
      context?.revert();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref, enabled, prefersReducedMotion, ...deps]);
}
