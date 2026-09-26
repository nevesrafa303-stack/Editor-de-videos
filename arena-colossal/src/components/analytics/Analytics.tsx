'use client';

import Script from 'next/script';
import { useEffect } from 'react';

import { track } from '@/lib/analytics';
import { site } from '@/lib/config/site';

/**
 * Carrega GA4, GTM e Meta Pixel — e apenas os que estiverem configurados.
 *
 * `strategy="afterInteractive"` mantem os scripts fora do caminho critico de
 * renderizacao: nenhum deles concorre com o hero pelo tempo do usuario.
 */
export function Analytics() {
  const { ga4, gtm, metaPixel } = site.analytics;

  useEffect(() => {
    // Uma unica pagina: o page_view do funil e' disparado aqui.
    track('page_view', { page_path: window.location.pathname });
  }, []);

  return (
    <>
      {gtm ? (
        <Script id="gtm" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});
var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';
j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${gtm}');`}
        </Script>
      ) : null}

      {ga4 ? (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${ga4}`}
            strategy="afterInteractive"
          />
          <Script id="ga4" strategy="afterInteractive">
            {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
window.gtag = gtag;
gtag('js', new Date());
gtag('config', '${ga4}', { send_page_view: true });`}
          </Script>
        </>
      ) : null}

      {metaPixel ? (
        <Script id="meta-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window,document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${metaPixel}');
fbq('track', 'PageView');`}
        </Script>
      ) : null}
    </>
  );
}

/** Fallback do GTM para navegadores sem JS. Vai logo apos a abertura do body. */
export function GtmNoScript() {
  if (!site.analytics.gtm) return null;

  return (
    <noscript>
      <iframe
        src={`https://www.googletagmanager.com/ns.html?id=${site.analytics.gtm}`}
        height="0"
        width="0"
        style={{ display: 'none', visibility: 'hidden' }}
        title="Google Tag Manager"
      />
    </noscript>
  );
}
