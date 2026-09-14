import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "OdontoCRM",
    template: "%s · OdontoCRM",
  },
  description:
    "CRM para clínicas de odontologia e estética: funil de vendas, agenda, prontuário e financeiro.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
