import Image, { type StaticImageData } from "next/image";
import { mentores } from "@/content/site";
import gabriel from "@/assets/img/mentor-gabriel.webp";
import hermano from "@/assets/img/mentor-hermano.webp";
import saimon from "@/assets/img/mentor-saimon.webp";
import { Verificado } from "./ui";

const fotos: Record<string, StaticImageData> = { hermano, saimon, gabriel };

// Mentores: a foto abre de baixo para cima com a rolagem (data-mentor em src/lib/motion.ts).
export function Mentores() {
  return (
    <section id="mentores" aria-labelledby="mentores-titulo" className="relative border-t border-white/10 bg-carbon py-24 md:py-36">
      <div className="container-site">
        <h2
          id="mentores-titulo"
          data-split
          className="font-expanded max-w-[18ch] text-[clamp(1.9rem,4.2vw,3.6rem)] font-bold uppercase leading-[0.98] tracking-tight text-white"
        >
          {mentores.titulo}
        </h2>
        <ul className="mt-12 grid gap-10 md:mt-16 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
          {mentores.itens.map((m) => (
            <li key={m.id} data-mentor className="group">
              <figure data-spotlight className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[#2b2b2b]">
                <Image
                  src={fotos[m.id]}
                  alt={`${m.nome}${m.apelido ? `, o ${m.apelido}` : ""}`}
                  sizes="(min-width: 1024px) 30vw, (min-width: 768px) 46vw, 92vw"
                  data-mentor-foto
                  className="aspect-[9/10] h-auto w-full object-cover transition duration-700 ease-out-expo group-hover:scale-[1.04]"
                />
                <figcaption className="absolute bottom-4 left-4 rounded-full border border-white/10 bg-ink/70 px-3.5 py-1.5 text-xs font-semibold text-fog backdrop-blur">
                  {m.tema}
                </figcaption>
              </figure>
              <div data-reveal className="mt-6">
                <h3 className="font-expanded flex items-center gap-2 text-lg font-bold uppercase text-white xl:text-xl">
                  {m.nome}
                  <Verificado className="size-5 shrink-0" />
                </h3>
                <a
                  href={`https://www.instagram.com/${m.instagram}/`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-block text-sm text-ouro transition hover:text-white"
                >
                  @{m.instagram}
                  <span className="sr-only"> no Instagram (abre em nova aba)</span>
                </a>
                <div className="mt-4 grid gap-3 leading-relaxed text-mute">
                  {m.bio.map((b) => (
                    <p key={b}>{b}</p>
                  ))}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
