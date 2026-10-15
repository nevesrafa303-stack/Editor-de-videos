'use client';

import { createContext, useContext, useMemo, type ReactNode } from 'react';

const AvailableImagesContext = createContext<Set<string> | null>(null);

/**
 * Leva a lista de imagens existentes do servidor para as molduras no cliente.
 *
 * Fica no layout, envolvendo a pagina inteira. Sem provider, `MediaFrame`
 * assume que a imagem existe e tenta carregar — comportamento seguro para
 * testes isolados.
 */
export function AvailableImagesProvider({
  images,
  children,
}: {
  images: string[];
  children: ReactNode;
}) {
  const value = useMemo(() => new Set(images), [images]);
  return <AvailableImagesContext.Provider value={value}>{children}</AvailableImagesContext.Provider>;
}

/** `true` quando o arquivo existe em /public (ou quando nao ha provider). */
export function useImageExists(src: string): boolean {
  const images = useContext(AvailableImagesContext);
  if (images === null) return true;
  return images.has(src);
}
