import type { Metadata, Viewport } from "next";
import { DM_Sans, Poppins } from "next/font/google";
import { siteUrl } from "@/lib/site-url";
import "./globals.css";

// Tipografia da apresentação: Poppins nos títulos, DM Sans nos textos.
const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});
const dmSans = DM_Sans({
  variable: "--font-dm",
  subsets: ["latin"],
  display: "swap",
});

const titulo = "Reforce Consultoria | Planejamento e gestão de projetos industriais e paradas";
const descricao =
  "Planejamento que chega até a execução: planejamento de projetos e paradas, gestão de materiais, gestão contratual e fiscalização de campo para projetos industriais complexos. +25 consultores, atuação em 5 estados.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: titulo, template: "%s | Reforce Consultoria" },
  description: descricao,
  applicationName: "Reforce Consultoria",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "Reforce Consultoria",
    title: titulo,
    description: descricao,
    url: "/",
  },
  twitter: { card: "summary_large_image", title: titulo, description: descricao },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#011417",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${poppins.variable} ${dmSans.variable}`}>
      <body className="grao min-h-dvh overflow-x-clip">
        <a
          href="#conteudo"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-menta focus:px-4 focus:py-2 focus:text-abismo"
        >
          Pular para o conteúdo
        </a>
        {children}
      </body>
    </html>
  );
}
