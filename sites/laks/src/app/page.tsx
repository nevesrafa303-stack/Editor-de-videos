import { Checklist } from "@/components/Checklist";
import { Clientes } from "@/components/Clientes";
import { Depoimentos } from "@/components/Depoimentos";
import { Faixa } from "@/components/Faixa";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { LeadSection } from "@/components/LeadSection";
import { Manifesto } from "@/components/Manifesto";
import { Mapa } from "@/components/Mapa";
import { MotionLazy } from "@/components/MotionLazy";
import { Numeros } from "@/components/Numeros";
import { Proposito } from "@/components/Proposito";
import { QuemSomos } from "@/components/QuemSomos";
import { empresa } from "@/content/site";
import { siteUrl } from "@/lib/site-url";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: empresa.nome,
  url: siteUrl,
  logo: `${siteUrl}/icon.svg`,
  description: "Aceleradora de marketing e vendas para corretoras de planos de saúde e seguros.",
  taxID: empresa.cnpj,
  address: { "@type": "PostalAddress", addressLocality: empresa.cidade, addressRegion: empresa.uf, addressCountry: "BR" },
  sameAs: empresa.redes.map((r) => r.url),
};

export default function Home() {
  return (
    <>
      <Header />
      <main id="conteudo" className="overflow-x-clip">
        <Hero />
        <Clientes />
        <Numeros />
        <Manifesto />
        <Faixa />
        <Mapa />
        <Depoimentos />
        <QuemSomos />
        <Proposito />
        <Checklist />
        <LeadSection />
      </main>
      <Footer />
      <MotionLazy />
      <script
        type="application/ld+json"
        // JSON estático gerado no build; "<" escapado para não fechar a tag.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
    </>
  );
}
