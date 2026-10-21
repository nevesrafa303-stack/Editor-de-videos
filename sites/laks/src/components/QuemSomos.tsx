import Image from "next/image";
import { quemSomos } from "@/content/site";
import banner from "@/assets/img/fundador-escritorio-banner.webp";
import polaroid from "@/assets/img/equipe-polaroid-balneario.webp";
import seloMeta from "@/assets/img/selo-meta-business-partners.webp";

export function QuemSomos() {
  const legenda = [quemSomos.fundador.nome, quemSomos.fundador.cargo].filter(Boolean).join(", ");
  return (
    <section id="quemsomos" aria-labelledby="quem-titulo" className="relative pt-24 md:pt-36">
      <div className="container-site grid gap-6 md:grid-cols-2 md:items-end md:gap-16">
        <h2
          id="quem-titulo"
          data-split
          className="font-expanded text-[clamp(2.2rem,5vw,4.6rem)] font-bold uppercase leading-[0.92] tracking-tight text-white"
        >
          {quemSomos.lema}
        </h2>
        <p data-reveal className="max-w-lg text-base leading-relaxed text-mute md:justify-self-end md:text-lg">
          {quemSomos.texto}
        </p>
      </div>

      {/* A foto abre de um quadro recortado até a largura total (data-expand em src/lib/motion.ts). */}
      <figure data-expand className="relative mt-12 h-[62svh] overflow-hidden md:mt-20 md:h-[86svh]">
        <Image
          src={banner}
          alt={`${legenda || "Fundador da LAKS"} no escritório da empresa, de camisa preta com a frase Vivemos o que vendemos`}
          fill
          sizes="100vw"
          data-expand-img
          className="object-cover object-[64%_30%] md:object-[58%_30%]"
        />
        <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-ink/80 to-transparent" />
        {legenda && (
          <figcaption className="container-site absolute inset-x-0 bottom-5 text-xs uppercase tracking-[0.2em] text-fog/80 md:bottom-8">
            {legenda}
          </figcaption>
        )}
      </figure>

      <div className="container-site grid items-center gap-14 py-20 md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] md:gap-20 md:py-32">
        <div className="relative mx-auto w-full max-w-[21rem] md:max-w-[25rem]">
          <div data-polaroid className="origin-top">
            <Image
              src={polaroid}
              alt="Time da LAKS de camisa laranja reunido na sede em Balneário Camboriú"
              sizes="(min-width: 768px) 25rem, 85vw"
              className="h-auto w-full rotate-[-3deg] drop-shadow-[0_40px_50px_rgba(0,0,0,.7)]"
            />
          </div>
        </div>

        <div>
          <h3 data-split className="font-expanded text-[clamp(1.6rem,3.6vw,2.8rem)] font-bold uppercase leading-[1] text-white">
            {quemSomos.sede}
          </h3>
          <p data-reveal className="mt-5 max-w-lg text-base leading-relaxed text-mute md:text-lg">
            {quemSomos.sedeTexto}
          </p>
          <dl data-reveal="stagger" className="mt-10 grid grid-cols-2 gap-px border-y border-white/10 bg-white/10">
            <div className="bg-ink py-5 pr-4">
              <dt className="text-sm text-mute">Especialistas no time</dt>
              <dd className="font-expanded mt-1 text-3xl font-bold text-white">
                70<span className="text-laranja">+</span>
              </dd>
            </div>
            <div className="bg-ink py-5 pl-5">
              <dt className="text-sm text-mute">Corretoras ativas</dt>
              <dd className="font-expanded mt-1 text-3xl font-bold text-white">
                400<span className="text-laranja">+</span>
              </dd>
            </div>
            <div className="col-span-2 flex items-center justify-between gap-6 bg-ink py-5">
              <dt className="text-sm text-mute">Parceria com a Meta</dt>
              <dd>
                <Image src={seloMeta} alt="Meta Business Partners" sizes="160px" className="h-8 w-auto opacity-90" />
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </section>
  );
}
