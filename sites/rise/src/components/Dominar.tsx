import Image from "next/image";
import { dominar } from "@/content/site";
import eventoDesktop from "@/assets/img/hermano-evento-desktop.webp";
import eventoMobile from "@/assets/img/hermano-evento-mobile.webp";
import { Aplicar } from "./ui";

// Foto do Hermano no evento: abre de um quadro recortado até a largura total com a rolagem (data-expand).
export function Dominar() {
  return (
    <section aria-labelledby="dominar-titulo" className="relative py-24 md:py-36">
      <figure data-expand className="relative mx-auto overflow-hidden">
        <Image
          src={eventoMobile}
          alt="Hermano palestrando para donos de agência em evento da LAKS"
          sizes="100vw"
          data-expand-img
          className="aspect-[4/5] w-full object-cover md:hidden"
        />
        <Image
          src={eventoDesktop}
          alt="Hermano palestrando para donos de agência em evento da LAKS"
          sizes="100vw"
          data-expand-img
          className="hidden aspect-[21/9] w-full object-cover object-[70%_center] md:block"
        />
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-ink via-transparent to-ink/30" />
      </figure>

      <div className="container-site -mt-24 md:-mt-40">
        <h2
          id="dominar-titulo"
          className="font-expanded relative max-w-[22ch] text-[clamp(1.9rem,4.6vw,4.2rem)] font-bold uppercase leading-[0.98] tracking-tight"
        >
          <span data-split className="block text-white">
            {dominar.titulo[0]}
          </span>
          <span data-split className="texto-ouro mt-2 block">
            {dominar.titulo[1]}
          </span>
        </h2>
        <div data-reveal="stagger" className="mt-8 grid max-w-3xl gap-5 text-lg leading-relaxed text-mute md:grid-cols-2 md:gap-8">
          {dominar.texto.map((t) => (
            <p key={t}>{t}</p>
          ))}
        </div>
        <div data-reveal className="mt-10">
          <Aplicar local="dominar" className="w-full sm:w-auto" />
        </div>
      </div>
    </section>
  );
}
