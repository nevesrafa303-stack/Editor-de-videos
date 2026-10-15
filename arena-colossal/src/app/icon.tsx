import { ImageResponse } from 'next/og';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

/**
 * Favicon gerado no build — o monograma da Arena.
 *
 * Quando a marca tiver um simbolo definitivo, troque este arquivo por um
 * `icon.svg`/`icon.png` na mesma pasta: o Next passa a usar o arquivo.
 */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#000000',
          color: '#c9a227',
          fontSize: 17,
          fontWeight: 700,
          letterSpacing: '-1px',
          fontFamily: 'sans-serif',
        }}
      >
        AC
      </div>
    ),
    size,
  );
}
