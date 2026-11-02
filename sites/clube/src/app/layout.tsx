import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import localFont from "next/font/local";
import { Tracking } from "@/components/Tracking";
import { siteUrl } from "@/lib/site-url";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
});

// Archivo expandida (largura 125, pesos 600-900): conversa com o "IMERSÃO" largo do logo.
// Arquivo reduzido de 90 KB para 22 KB; ver src/assets/fonts/OFL.txt.
const archivo = localFont({
  src: "../assets/fonts/archivo-expanded-600-900.woff2",
  variable: "--font-archivo",
  weight: "600 900",
  display: "swap",
});

const titulo = "Imersão Clube das Agências | 2 dias presenciais em Balneário Camboriú";
const descricao =
  "Imersão presencial para donos de agência: os 5 pilares (aquisição, comercial, operação, gestão e cultura) que sustentam uma agência de R$ 15 milhões, com o Hermano, Saimon Oliveira e Gabriel Dias.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: titulo, template: "%s | Imersão Clube das Agências" },
  description: descricao,
  applicationName: "Imersão Clube das Agências",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "Imersão Clube das Agências",
    title: titulo,
    description: descricao,
    url: "/",
  },
  twitter: { card: "summary_large_image", title: titulo, description: descricao },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#050505",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${jakarta.variable} ${archivo.variable}`}>
      <body className="grain min-h-dvh overflow-x-clip">
        <a
          href="#conteudo"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-ouro focus:px-4 focus:py-2 focus:text-ink"
        >
          Pular para o conteúdo
        </a>
        {children}
        <Tracking />
      </body>
    </html>
  );
}
