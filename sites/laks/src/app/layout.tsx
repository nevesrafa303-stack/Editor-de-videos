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

// Archivo expandida (largura 125, pesos 600-900): faz as vezes da Neuething Sans do site atual.
// Arquivo reduzido de 90 KB para 22 KB; ver src/assets/fonts/OFL.txt.
const archivo = localFont({
  src: "../assets/fonts/archivo-expanded-600-900.woff2",
  variable: "--font-archivo",
  weight: "600 900",
  display: "swap",
});

const titulo = "LAKS Company | Marketing e vendas para corretoras de planos de saúde e seguros";
const descricao =
  "A #1 aceleradora de marketing e vendas para corretoras de planos de saúde e seguros. Leads qualificados, anúncios que convertem e processo comercial com o Método MAPA. Diagnóstico gratuito.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: titulo, template: "%s | LAKS Company" },
  description: descricao,
  applicationName: "LAKS Company",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "LAKS Company",
    title: titulo,
    description: descricao,
    url: "/",
  },
  twitter: { card: "summary_large_image", title: titulo, description: descricao },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#020202",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${jakarta.variable} ${archivo.variable}`}>
      <body className="grain min-h-dvh overflow-x-clip">
        <a
          href="#conteudo"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-laranja focus:px-4 focus:py-2 focus:text-ink"
        >
          Pular para o conteúdo
        </a>
        {children}
        <Tracking />
      </body>
    </html>
  );
}
