import Image from "next/image";
import { campo } from "@/content/site";
import { imagens } from "@/lib/imagens";
import { Kicker, TituloSecao } from "./ui";

// Mosaico das fotos de campo (fotos reais da apresentação). Cada foto abre maior num diálogo.
const formatos = [
  "md:col-span-7 md:row-span-2 aspect-[4/3] md:aspect-auto",
  "md:col-span-5 aspect-[16/10]",
  "md:col-span-5 aspect-[16/10]",
  "md:col-span-4 aspect-[4/3]",
  "md:col-span-4 aspect-[4/3]",
  "md:col-span-4 aspect-[4/3]",
];

export function Campo() {
  return (
    <section id="campo" className="relative bg-fundo py-24 md:py-32">
      <div className="container-site">
        <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="max-w-3xl">
            <Kicker>{campo.kicker}</Kicker>
            <TituloSecao className="mt-6">{campo.titulo}</TituloSecao>
          </div>
          <p data-reveal className="max-w-md text-lg leading-relaxed text-mute">
            {campo.texto}
          </p>
        </div>

        <ul className="mt-14 grid gap-4 md:grid-cols-12 md:gap-5">
          {campo.fotos.map((f, i) => (
            <li key={f.id} data-reveal className={`relative ${formatos[i]}`}>
              <button
                type="button"
                data-abre-visor={`visor-${f.id}`}
                className="group absolute inset-0 overflow-hidden rounded-[1.5rem] text-left"
                aria-label={`Ampliar foto: ${f.legenda}`}
              >
                <span data-parallax="8" className="absolute -inset-y-[6%] inset-x-0 block">
                  <Image
                    src={imagens[f.id]}
                    alt=""
                    fill
                    sizes={i === 0 ? "(min-width: 768px) 58vw, 92vw" : "(min-width: 768px) 36vw, 92vw"}
                    quality={75}
                    className="object-cover transition-transform duration-[1.2s] ease-out-expo group-hover:scale-105"
                  />
                </span>
                <span className="absolute inset-0 bg-gradient-to-t from-abismo/95 via-abismo/20 to-transparent" aria-hidden="true" />
                <span className="absolute inset-x-0 bottom-0 flex items-end gap-3 p-5">
                  <span className="text-sm leading-snug text-white md:text-[0.95rem]">{f.legenda}</span>
                </span>
              </button>
              <dialog id={`visor-${f.id}`} className="visor" aria-label={f.legenda}>
                <figure className="relative">
                  <Image src={imagens[f.id]} alt={f.legenda} sizes="92vw" quality={80} className="h-auto max-h-[80vh] w-auto rounded-xl" />
                  <figcaption className="mt-3 text-center text-sm text-nevoa">{f.legenda}</figcaption>
                  <form method="dialog">
                    <button type="submit" aria-label="Fechar" className="absolute -top-3 -right-3 grid size-10 place-items-center rounded-full bg-white text-abismo shadow-lg">
                      <svg viewBox="0 0 20 20" className="size-4" fill="none" aria-hidden="true">
                        <path d="m5 5 10 10M15 5 5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    </button>
                  </form>
                </figure>
              </dialog>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
