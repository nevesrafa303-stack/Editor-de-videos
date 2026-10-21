import type { Metadata } from "next";
import { Obrigado } from "@/components/Obrigado";

// Mesma URL do site anterior: leads com faturamento abaixo de R$ 10 mil.
export const metadata: Metadata = {
  title: "Obrigado",
  robots: { index: false, follow: false },
  alternates: { canonical: null },
};

export default function Page() {
  return <Obrigado qualificado={false} />;
}
