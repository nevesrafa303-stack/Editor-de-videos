import { BarraAplicar } from "@/components/BarraAplicar";
import { Depoimentos } from "@/components/Depoimentos";
import { Dominar } from "@/components/Dominar";
import { Entregas } from "@/components/Entregas";
import { Estrutura } from "@/components/Estrutura";
import { Faixa } from "@/components/Faixa";
import { Final } from "@/components/Final";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Hermano } from "@/components/Hermano";
import { Hero } from "@/components/Hero";
import { Manifesto } from "@/components/Manifesto";
import { Metodo } from "@/components/Metodo";
import { MotionLazy } from "@/components/MotionLazy";
import { ParaQuem } from "@/components/ParaQuem";
import { Placas } from "@/components/Placas";
import { Problema } from "@/components/Problema";
import { siteUrl } from "@/lib/site-url";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Mentoria RISE",
  url: siteUrl,
  logo: `${siteUrl}/icon.svg`,
  description: "Mentoria anual de aceleração para donos de agência.",
  founder: { "@type": "Person", name: "Leonardo Fernandes", alternateName: "Hermano" },
};

export default function Home() {
  return (
    <>
      <Header />
      <main id="conteudo" className="overflow-x-clip">
        <Hero />
        <Faixa />
        <Problema />
        <Manifesto />
        <ParaQuem />
        <Estrutura />
        <Entregas />
        <Metodo />
        <Placas />
        <Depoimentos />
        <Dominar />
        <Hermano />
        <Final />
      </main>
      <Footer />
      <BarraAplicar />
      <MotionLazy />
      <script
        type="application/ld+json"
        // JSON estático gerado no build; "<" escapado para não fechar a tag.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
    </>
  );
}
