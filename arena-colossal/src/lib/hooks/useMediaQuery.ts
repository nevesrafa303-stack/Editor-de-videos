'use client';

import { useEffect, useState } from 'react';

/**
 * Media query reativa com estado inicial `false`.
 *
 * O valor inicial e' deliberadamente pessimista: no primeiro paint (servidor e
 * hidratacao) assumimos "sem recurso extra". Assim o conteudo aparece antes de
 * qualquer animacao decidir entrar, o que evita flash e mismatch de hidratacao.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    setMatches(mediaQuery.matches);

    const onChange = (event: MediaQueryListEvent) => setMatches(event.matches);
    mediaQuery.addEventListener('change', onChange);
    return () => mediaQuery.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}

/** `true` quando o sistema pede menos movimento. */
export function usePrefersReducedMotion(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)');
}

/**
 * `true` apenas em desktop com ponteiro fino — o criterio usado para ligar
 * cursor customizado, hover magnetico e scroll horizontal.
 */
export function useIsDesktopPointer(): boolean {
  return useMediaQuery('(min-width: 1024px) and (hover: hover) and (pointer: fine)');
}
