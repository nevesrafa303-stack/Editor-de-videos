import Image, { type StaticImageData } from "next/image";
import { galeria } from "@/content/site";
import caderno from "@/assets/img/galeria/caderno.webp";
import coffee from "@/assets/img/galeria/coffee.webp";
import hermanoPalco from "@/assets/img/galeria/hermano-palco.webp";
import mentoradosPlacas from "@/assets/img/galeria/mentorados-placas.webp";
import networking from "@/assets/img/galeria/networking.webp";
import palco from "@/assets/img/galeria/palco.webp";
import placa from "@/assets/img/galeria/placa.webp";
import plateia from "@/assets/img/galeria/plateia.webp";
import praia from "@/assets/img/galeria/praia.webp";
import { Cabecalho } from "./Cabecalho";

const fotos: Record<string, StaticImageData> = {
  praia,
  "hermano-palco": hermanoPalco,
  caderno,
  networking,
  palco,
  coffee,
  placa,
  "mentorados-placas": mentoradosPlacas,
  plateia,
};

// Galeria da última edição: faixa lateral que se arrasta (mouse, com inércia) ou desliza (toque). As fotos
// se deslocam por dentro do quadro enquanto a faixa anda (data-galeria em src/lib/motion.ts).
export function Galeria() {
  return (
    <section id="galeria" aria-labelledby="galeria-titulo" className="py-24 md:py-32">
      <div className="container-site">
        <Cabecalho id="galeria-titulo" titulo={galeria.titulo} intro={galeria.intro} />
      </div>
      <div
        data-galeria
        data-cursor="Arraste"
        tabIndex={0}
        aria-label="Fotos da última edição (role para os lados)"
        className="mt-12 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-2 md:mt-16 md:gap-5 md:px-8 lg:snap-none lg:px-[max(2rem,calc((100vw-82rem)/2+2rem))]"
      >
        {galeria.itens.map((g) => (
          <figure
            key={g.img}
            data-galeria-item
            className={`group relative h-[min(26rem,62vh)] shrink-0 snap-center overflow-hidden rounded-[24px] bg-graphite ${
              g.formato === "largo" ? "aspect-[4/3] md:aspect-[16/10]" : "aspect-[3/4]"
            }`}
          >
            <Image
              src={fotos[g.img]}
              alt={g.legenda}
              sizes="(min-width: 768px) 42rem, 85vw"
              draggable={false}
              data-galeria-foto
              className="pointer-events-none absolute inset-0 size-full scale-[1.18] select-none object-cover transition duration-700 ease-out-expo group-hover:scale-[1.24]"
            />
            <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-ink/85 to-transparent" />
            <figcaption className="absolute inset-x-5 bottom-4 text-sm font-semibold text-white">{g.legenda}</figcaption>
          </figure>
        ))}
        <span aria-hidden="true" className="w-px shrink-0" />
      </div>
      <div aria-hidden="true" className="container-site mt-8 hidden md:block">
        <span className="mx-auto block h-px max-w-xs overflow-hidden bg-white/15">
          <span data-galeria-progresso className="bg-ouro block h-full w-full origin-left" style={{ transform: "scaleX(0.15)" }} />
        </span>
      </div>
    </section>
  );
}
