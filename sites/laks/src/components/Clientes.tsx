import Image from "next/image";
import dpWhite from "@/assets/img/clientes/dp-white.webp";
import escudoM from "@/assets/img/clientes/escudo-m.webp";
import estilo from "@/assets/img/clientes/estilo-seguros.webp";
import evoluir from "@/assets/img/clientes/evoluir.webp";
import laBrasil from "@/assets/img/clientes/la-brasil.webp";
import libero from "@/assets/img/clientes/libero.webp";
import mybro from "@/assets/img/clientes/mybro.webp";
import priorizar from "@/assets/img/clientes/priorizar.webp";

const logos = [
  { src: priorizar, alt: "Priorizar Soluções Financeiras e Seguros" },
  { src: mybro, alt: "myBro Corretora" },
  { src: estilo, alt: "Estilo Seguros" },
  { src: evoluir, alt: "Evoluir Corretora de Seguros" },
  { src: dpWhite, alt: "DP White Corretora" },
  { src: laBrasil, alt: "L.A Brasil Seguros" },
  { src: libero, alt: "Líbero" },
  // CONFIRMAR: nome da corretora do escudo "M".
  { src: escudoM, alt: "Corretora parceira" },
];

export function Clientes() {
  const lista = (dup: boolean) => (
    <ul className={`flex shrink-0 items-center gap-14 pr-14 md:gap-20 md:pr-20 ${dup ? "marquee-dup" : ""}`} aria-hidden={dup || undefined}>
      {logos.map((l) => (
        <li key={l.alt} className="shrink-0">
          <Image src={l.src} alt={dup ? "" : l.alt} sizes="200px" className="h-8 w-auto opacity-60 transition hover:opacity-100 md:h-10" />
        </li>
      ))}
    </ul>
  );

  return (
    <section aria-label="Corretoras que aceleram com a LAKS" className="relative border-y border-white/[0.07] bg-carbon py-10 md:py-12">
      <p className="container-site mb-8 text-center text-xs font-semibold uppercase tracking-[0.22em] text-mute">
        Corretoras que aceleram com a LAKS
      </p>
      <div className="marquee overflow-hidden">
        <div data-marquee className="marquee-track">
          {lista(false)}
          {lista(true)}
        </div>
      </div>
    </section>
  );
}
