import Image from "next/image";
import { paraQuem } from "@/content/site";
import plateia from "@/assets/img/palestra-plateia.webp";
import { Cta } from "./ui";

// Para quem é: cada item tem uma chave (a mesma do site atual) que liga quando chega perto do meio da tela.
export function ParaQuem() {
  return (
    <section id="para-quem" aria-labelledby="paraquem-titulo" className="relative overflow-clip border-y border-white/10 bg-carbon py-24 md:py-36">
      <div aria-hidden="true" className="pointer-events-none absolute -left-40 top-1/4 size-[34rem] rounded-full bg-brasa/10 blur-[120px]" />
      <div className="container-site relative grid gap-14 lg:grid-cols-2 lg:gap-20">
        <div>
          <h2
            id="paraquem-titulo"
            data-split
            className="font-expanded text-[clamp(1.6rem,3.2vw,2.8rem)] font-bold uppercase leading-[1.02] tracking-tight text-white"
          >
            {paraQuem.titulo}
          </h2>
          <p data-reveal className="mt-6 max-w-xl leading-relaxed text-mute md:text-lg">
            {paraQuem.intro}
          </p>
          <figure data-reveal className="relative mt-10 hidden max-w-md lg:block">
            <Image
              src={plateia}
              alt="Hermano palestrando e a plateia de donos de agência na edição anterior"
              sizes="28rem"
              data-parallax="-8"
              className="h-auto w-full rotate-[-2deg] drop-shadow-[0_30px_40px_rgba(0,0,0,0.6)]"
            />
          </figure>
        </div>

        <div>
          <ul className="border-t border-white/10">
            {paraQuem.itens.map((item) => (
              <li key={item} data-chave-item className="flex items-center gap-4 border-b border-white/10 py-5 text-lg leading-snug text-fog md:text-xl">
                <span className="chave" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
          <blockquote data-reveal className="mt-10 rounded-3xl border border-ouro/20 bg-gradient-to-br from-ouro/[0.08] to-transparent p-6 md:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-ouro">De forma resumida…</p>
            <p className="mt-3 text-lg leading-relaxed text-white md:text-xl">{paraQuem.resumo}</p>
          </blockquote>
          <div data-reveal className="mt-8">
            <Cta local="para-quem" className="w-full sm:w-auto">
              {paraQuem.cta}
            </Cta>
          </div>
        </div>
      </div>
    </section>
  );
}
