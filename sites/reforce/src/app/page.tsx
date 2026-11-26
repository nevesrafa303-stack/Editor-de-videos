import { Abordagem } from "@/components/Abordagem";
import { Atuacoes } from "@/components/Atuacoes";
import { Campo } from "@/components/Campo";
import { Cases } from "@/components/Cases";
import { Contato } from "@/components/Contato";
import { Diferenciais } from "@/components/Diferenciais";
import { Equipe } from "@/components/Equipe";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { Interacoes } from "@/components/Interacoes";
import { Metodo } from "@/components/Metodo";
import { MotionLazy } from "@/components/MotionLazy";
import { Numeros } from "@/components/Numeros";
import { Presenca } from "@/components/Presenca";
import { Setores } from "@/components/Setores";
import { Tecnologia } from "@/components/Tecnologia";
import { Valores } from "@/components/Valores";
import { atuacoes, marca } from "@/content/site";
import { siteUrl } from "@/lib/site-url";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  name: marca.nome,
  description: "Planejamento e gestão de projetos de capital, paradas de manutenção e infraestrutura industrial.",
  url: siteUrl,
  logo: `${siteUrl}/icon.svg`,
  email: marca.email,
  telephone: marca.telefone.replace(/[^\d+]/g, ""),
  areaServed: ["Rio Grande do Sul", "São Paulo", "Rio de Janeiro", "Minas Gerais", "Amazonas"],
  address: marca.escritorios.map((e) => ({
    "@type": "PostalAddress",
    addressLocality: e.cidade,
    addressRegion: e.uf,
    addressCountry: "BR",
  })),
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "Atuações",
    itemListElement: atuacoes.lista.map((a) => ({
      "@type": "Offer",
      itemOffered: { "@type": "Service", name: a.titulo, description: a.texto },
    })),
  },
};

export default function Home() {
  return (
    <>
      <Header />
      <main id="conteudo" className="overflow-x-clip">
        <Hero />
        <Numeros />
        <Abordagem />
        <Setores />
        <Atuacoes />
        <Metodo />
        <Tecnologia />
        <Campo />
        <Cases />
        <Presenca />
        <Diferenciais />
        <Equipe />
        <Valores />
        <Contato />
      </main>
      <Footer />
      <Interacoes />
      <MotionLazy />
      <script
        type="application/ld+json"
        // JSON estático gerado no build; "<" escapado para não fechar a tag.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
    </>
  );
}
