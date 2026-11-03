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
import { GaleriaControles } from "./GaleriaControles";

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

const seta = (
  <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12h13m-5-6 6 6-6 6" />
  </svg>
);

// Galeria da última edição: faixa lateral que se arrasta (mouse, com inércia e as fotos inclinando com a
// velocidade) ou desliza (toque), com botões e contador. As fotos se deslocam por dentro do quadro enquanto
// a faixa anda (data-galeria em src/lib/motion.ts; botões em src/lib/galeria.ts).
export function Galeria() {
  const total = String(galeria.itens.length).padStart(2, "0");
  return (
    <section id="galeria" aria-labelledby="galeria-titulo" className="overflow-clip py-24 md:py-32">
      <div className="container-site">
        <Cabecalho
          id="galeria-titulo"
          titulo={galeria.titulo}
          intro={galeria.intro}
          lado
          extra={
            <div className="flex items-center gap-5">
              <p aria-hidden="true" className="font-expanded text-sm font-bold text-white">
                <span data-galeria-atual>01</span>
                <span className="text-mute"> / {total}</span>
              </p>
              <div className="ml-auto flex gap-2">
                <button type="button" data-galeria-anterior aria-label="Foto anterior" className="galeria-botao rotate-180">
                  {seta}
                </button>
                <button type="button" data-galeria-proxima aria-label="Próxima foto" className="galeria-botao">
                  {seta}
                </button>
              </div>
            </div>
          }
        />
      </div>
      <div
        data-galeria
        data-cursor="Arraste"
        tabIndex={0}
        aria-label="Fotos da última edição (use as setas do teclado ou role para os lados)"
        className="mt-10 flex snap-x snap-mandatory scroll-px-5 gap-3 overflow-x-auto px-5 pb-2 md:mt-14 md:scroll-px-8 md:gap-5 md:px-8 lg:snap-none lg:px-[max(2rem,calc((100vw-82rem)/2+2rem))]"
      >
        {galeria.itens.map((g, i) => (
          <figure
            key={g.img}
            data-galeria-item
            className={`group relative shrink-0 snap-start overflow-hidden rounded-[22px] bg-graphite md:h-[min(30rem,58svh)] md:w-auto ${
              g.formato === "largo" ? "aspect-[4/3] w-[84vw] md:aspect-[16/10]" : "aspect-[3/4] w-[62vw]"
            }`}
          >
            <div data-galeria-quadro className="absolute inset-0">
              <Image
                src={fotos[g.img]}
                alt={g.legenda}
                sizes="(min-width: 768px) 48rem, 84vw"
                draggable={false}
                data-galeria-foto
                className="pointer-events-none absolute inset-0 size-full scale-[1.18] select-none object-cover"
              />
            </div>
            <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-ink/85 to-transparent" />
            <figcaption className="absolute inset-x-5 bottom-4 flex items-baseline gap-3 text-sm font-semibold text-white">
              <span aria-hidden="true" className="font-expanded text-xs text-ouro">
                {String(i + 1).padStart(2, "0")}
              </span>
              {g.legenda}
            </figcaption>
          </figure>
        ))}
        <span aria-hidden="true" className="w-px shrink-0" />
      </div>
      <div aria-hidden="true" className="container-site mt-8">
        <span className="block h-px overflow-hidden bg-white/15">
          <span data-galeria-progresso className="bg-ouro block h-full w-full origin-left" style={{ transform: "scaleX(0.11)" }} />
        </span>
      </div>
      <GaleriaControles />
    </section>
  );
}
