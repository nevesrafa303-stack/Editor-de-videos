import Image from "next/image";
import { final } from "@/content/site";
import orbitas from "@/assets/img/bg-rise-orbitas.webp";
import { Aplicar } from "./ui";

export function Final() {
  return (
    <section id="aplicar" aria-labelledby="final-titulo" className="relative isolate overflow-clip py-28 md:py-44">
      <div aria-hidden="true" className="absolute inset-0 -z-10">
        <Image src={orbitas} alt="" fill sizes="100vw" data-orbita className="object-cover object-[80%_center]" />
        <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/75 to-ink/10" />
        <div className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-ink to-transparent" />
      </div>
      <canvas data-brasas aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 h-full w-full" />
      <div className="container-site">
        <h2
          id="final-titulo"
          className="font-expanded max-w-[20ch] text-[clamp(1.9rem,4.8vw,4.4rem)] font-bold uppercase leading-[0.98] tracking-tight"
        >
          <span data-split className="block text-white">
            {final.titulo}
          </span>
          <span data-split className="texto-ouro brilho mt-2 block">
            {final.destaque}
          </span>
        </h2>
        <p data-reveal className="mt-6 max-w-lg text-lg text-mute">
          {final.texto}
        </p>
        <div data-reveal className="mt-10">
          <Aplicar local="final" className="w-full px-9 py-5 text-base sm:w-auto" />
        </div>
      </div>
    </section>
  );
}
