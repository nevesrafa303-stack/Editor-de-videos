import Image from "next/image";
import { cta, final } from "@/content/site";
import palco from "@/assets/img/palco-placas.webp";
import { Simbolo } from "./Logo";
import { Cta } from "./ui";

// Chamada final: a seta gigante da marca gira com a rolagem por trás do texto (data-girar em motion.ts).
export function Final() {
  return (
    <section id="agir" aria-labelledby="final-titulo" className="relative isolate overflow-clip py-28 md:py-44">
      <div aria-hidden="true" className="absolute inset-0 -z-10">
        <Image src={palco} alt="" fill sizes="100vw" className="object-cover opacity-30 grayscale" />
        <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/85 to-ink/40" />
        <div className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-ink to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-ink to-transparent" />
      </div>
      <div aria-hidden="true" className="pointer-events-none absolute -right-24 top-1/2 -z-10 -translate-y-1/2 md:right-[4%]">
        <div data-girar>
          <Simbolo id="final-simbolo" className="size-[22rem] opacity-25 md:size-[34rem] md:opacity-40" />
        </div>
      </div>
      <div className="container-site">
        <h2
          id="final-titulo"
          data-split
          className="font-expanded text-[clamp(2.6rem,9vw,8rem)] font-bold uppercase leading-[0.9] tracking-tight text-white"
        >
          {final.titulo}
        </h2>
        <p data-reveal className="mt-6 max-w-xl text-lg leading-relaxed text-fog/85">
          {final.texto}
        </p>
        <div data-reveal className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
          <Cta local="final" className="w-full px-9 py-5 text-base sm:w-auto">
            {cta}
          </Cta>
        </div>
      </div>
    </section>
  );
}
