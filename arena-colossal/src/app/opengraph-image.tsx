import { ImageResponse } from 'next/og';

import { site } from '@/lib/config/site';

export const alt = 'Arena Colossal — Estética Automotiva em Balneário Camboriú';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/**
 * Imagem de compartilhamento gerada no build.
 *
 * Evita duas coisas ruins: depender de uma foto que ainda nao existe, e deixar
 * um `/og.jpg` quebrado no `<head>`. Quando as fotos reais chegarem, basta
 * trocar este arquivo por um `opengraph-image.jpg` na mesma pasta.
 */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '72px',
          background: 'linear-gradient(140deg, #121216 0%, #000000 58%, #0d0d10 100%)',
          color: '#ffffff',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '54px',
              height: '54px',
              border: '1px solid rgba(201,162,39,0.55)',
              color: '#c9a227',
              fontSize: '20px',
              fontWeight: 700,
              letterSpacing: '2px',
            }}
          >
            AC
          </div>
          <div style={{ fontSize: '22px', letterSpacing: '10px', textTransform: 'uppercase' }}>
            Arena Colossal
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ fontSize: '86px', fontWeight: 800, lineHeight: 1, letterSpacing: '-3px' }}>
            Seu carro.
          </div>
          <div
            style={{
              fontSize: '86px',
              fontWeight: 800,
              lineHeight: 1,
              letterSpacing: '-3px',
              color: '#c9a227',
            }}
          >
            Outro nível.
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            fontSize: '22px',
            color: '#a9a9b0',
          }}
        >
          <div>Estética automotiva</div>
          <div style={{ letterSpacing: '4px', textTransform: 'uppercase', fontSize: '18px' }}>
            {`${site.location.city} — ${site.location.state}`}
          </div>
        </div>
      </div>
    ),
    size,
  );
}
