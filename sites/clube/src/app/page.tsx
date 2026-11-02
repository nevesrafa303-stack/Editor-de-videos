import { BarraAplicar } from "@/components/BarraAplicar";
import { Depoimentos } from "@/components/Depoimentos";
import { Faq } from "@/components/Faq";
import { Final } from "@/components/Final";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { Informacoes } from "@/components/Informacoes";
import { Ingressos } from "@/components/Ingressos";
import { Mentores } from "@/components/Mentores";
import { MotionLazy } from "@/components/MotionLazy";
import { ParaQuem } from "@/components/ParaQuem";
import { Patrocinio } from "@/components/Patrocinio";
import { Pilares } from "@/components/Pilares";
import { evento, faq } from "@/content/site";
import { siteUrl } from "@/lib/site-url";

// Dados estruturados do evento (Google) e das perguntas frequentes.
const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "Event",
    name: evento.nome,
    startDate: evento.inicio,
    endDate: evento.fim,
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    location: {
      "@type": "Place",
      name: evento.local,
      address: { "@type": "PostalAddress", addressLocality: "Balneário Camboriú", addressRegion: "SC", addressCountry: "BR" },
    },
    image: [`${siteUrl}/opengraph-image.jpg`],
    description: "Imersão presencial de 2 dias para donos de agência.",
    organizer: { "@type": "Organization", name: "Skill Sales", url: siteUrl },
    performer: [
      { "@type": "Person", name: "Leonardo Fernandes" },
      { "@type": "Person", name: "Saimon Oliveira" },
      { "@type": "Person", name: "Gabriel Dias" },
    ],
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.itens.map((i) => ({ "@type": "Question", name: i.pergunta, acceptedAnswer: { "@type": "Answer", text: i.resposta } })),
  },
];

export default function Home() {
  return (
    <>
      <Header />
      <main id="conteudo" className="overflow-x-clip">
        <Hero />
        <Pilares />
        <ParaQuem />
        <Informacoes />
        <Depoimentos />
        <Ingressos />
        <Mentores />
        <Faq />
        <Final />
        <Patrocinio />
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
