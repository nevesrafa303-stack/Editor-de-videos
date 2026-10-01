'use client';

import Image from 'next/image';
import { useState } from 'react';

import { useImageExists } from './AvailableImagesProvider';
import styles from './MediaFrame.module.css';

type MediaFrameProps = {
  /** Caminho dentro de /public. Se o arquivo ainda nao existir, cai no placeholder. */
  src: string;
  /** Texto alternativo real e descritivo — obrigatorio. */
  alt: string;
  /** Rotulo mostrado no placeholder, indicando que foto entra ali. */
  placeholderLabel: string;
  /** Proporcao CSS (`16 / 9`, `3 / 4`...). */
  ratio?: string;
  /** `true` apenas para a imagem acima da dobra. */
  priority?: boolean;
  sizes?: string;
  className?: string;
};

/**
 * Moldura de imagem do site.
 *
 * O projeto nasce sem as fotos reais da Arena. Em vez de usar banco de imagem
 * generico, a moldura desenha um placeholder intencional (gradiente escuro +
 * grão + rotulo do que entra ali). Basta colocar o arquivo no caminho indicado
 * em /public que a foto real assume automaticamente — sem mexer no codigo.
 *
 * A existencia do arquivo e' decidida no servidor (ver `src/lib/images.ts`):
 * assim nenhuma requisicao com erro sai do navegador enquanto as fotos nao
 * chegam. O `onError` fica como rede de seguranca para o caso de o arquivo
 * sumir depois do build.
 */
export function MediaFrame({
  src,
  alt,
  placeholderLabel,
  ratio = '4 / 3',
  priority = false,
  sizes = '(max-width: 768px) 100vw, 50vw',
  className,
}: MediaFrameProps) {
  const exists = useImageExists(src);
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const hasImage = exists && !failed;

  return (
    <div
      className={['media-frame', styles.frame, className].filter(Boolean).join(' ')}
      style={{ aspectRatio: ratio }}
    >
      {hasImage ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          loading={priority ? undefined : 'lazy'}
          className={styles.image}
          data-loaded={loaded}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
        />
      ) : null}

      {!hasImage || !loaded ? (
        <div className={styles.placeholder} aria-hidden="true">
          <span className={styles.grain} />
          <span className={styles.crosshair} />
          <span className={styles.monogram}>AC</span>
          <span className={styles.placeholderLabel}>
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.4">
              <path d="M3 8.5h3.2l1.4-2.2h7.8l1.4 2.2H21v10.5H3z" strokeLinejoin="round" />
              <circle cx="12" cy="13" r="3.4" />
            </svg>
            {placeholderLabel}
          </span>
        </div>
      ) : null}
    </div>
  );
}
