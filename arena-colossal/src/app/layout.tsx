import type { Metadata, Viewport } from 'next';
import { Inter, Manrope } from 'next/font/google';

import { Analytics, GtmNoScript } from '@/components/analytics/Analytics';
import { CustomCursor } from '@/components/layout/CustomCursor';
import { Footer } from '@/components/layout/Footer';
import { MobileActionBar } from '@/components/layout/MobileActionBar';
import { Navbar } from '@/components/layout/Navbar';
import { Preloader } from '@/components/layout/Preloader';
import { SmoothScroll } from '@/components/layout/SmoothScroll';
import { AvailableImagesProvider } from '@/components/ui/AvailableImagesProvider';
import { site } from '@/lib/config/site';
import { getAvailableImages } from '@/lib/images';
import { buildLocalBusinessJsonLd, buildWebSiteJsonLd } from '@/lib/seo/structured-data';
import { getOpeningWindows } from '@/services/booking/schedule';

import './globals.css';

/**
 * Fontes servidas pelo proprio dominio (next/font): sem request a terceiros,
 * sem layout shift e sem cookie do Google Fonts.
 */
const manrope = Manrope({
  subsets: ['latin'],
  weight: ['700', '800'],
  variable: '--font-manrope',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-inter',
  display: 'swap',
});

const title = 'Arena Colossal | Estética Automotiva em Balneário Camboriú';
const description =
  'Estética automotiva premium em Balneário Camboriú. Lavagem técnica, polimento, vitrificação, higienização e proteção — com processo, critério e agendamento online.';

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: title,
    template: '%s | Arena Colossal',
  },
  description,
  applicationName: site.name,
  keywords: [
    'estética automotiva',
    'polimento técnico',
    'vitrificação',
    'lavagem detalhada',
    'higienização automotiva',
    'Balneário Camboriú',
  ],
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: site.url,
    siteName: site.name,
    title,
    description,
    // A imagem vem de src/app/opengraph-image.tsx, injetada automaticamente.
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
  category: 'automotive',
};

export const viewport: Viewport = {
  themeColor: '#000000',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const jsonLd = [buildLocalBusinessJsonLd(getOpeningWindows()), buildWebSiteJsonLd()];
  const availableImages = getAvailableImages();

  return (
    <html lang="pt-BR" className={`${manrope.variable} ${inter.variable}`}>
      <body>
        <AvailableImagesProvider images={availableImages}>
          <GtmNoScript />

          <a className="skip-link" href="#main">
            Pular para o conteúdo
          </a>

          <Preloader />
          <SmoothScroll />
          <CustomCursor />

          <Navbar />

          <main id="main">{children}</main>

          <Footer />
          <MobileActionBar />

          <script
            type="application/ld+json"
            // Conteudo estatico montado no servidor a partir da propria config.
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
          />

          <Analytics />
        </AvailableImagesProvider>
      </body>
    </html>
  );
}
