import { getImageProps } from "next/image";
import { hero } from "@/content/site";
import heroDesktop from "@/assets/img/hermano-hero-desktop.webp";
import heroMobile from "@/assets/img/hermano-hero-mobile.webp";
import { Aplicar, LinkSeta, vars } from "./ui";

export function Hero() {
  const common = { alt: "", quality: 80 };
  const {
    props: { srcSet: desktop },
  } = getImageProps({ ...common, src: heroDesktop, sizes: "100vw" });
  const {
    props: { srcSet: mobile, ...img },
  } = getImageProps({ ...common, src: heroMobile, sizes: "100vw", quality: 70, fetchPriority: "high", loading: "eager" });

  return (
    <section
      id="topo"
      data-hero
      className="relative isolate flex min-h-[100svh] flex-col justify-end overflow-hidden pb-12 pt-[78vw] md:pt-[52svh] lg:justify-center lg:pb-24 lg:pt-32"
    >
      {/* Celular e tablet: foto vertical no topo, com degradê para o preto. Desktop: foto larga, Hermano à direita. */}
      <div data-hero-media className="absolute inset-x-0 top-0 -z-10 origin-[50%_20%] lg:inset-0">
        <picture className="hero-media block lg:h-full">
          <source media="(min-width: 1024px)" srcSet={desktop} />
          <img
            {...img}
            alt="Leonardo Fernandes, o Hermano, de braços cruzados no escritório da LAKS"
            srcSet={mobile}
            className="h-auto max-h-[92svh] w-full object-cover object-top lg:h-full lg:max-h-none lg:object-[72%_30%]"
          />
        </picture>
        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-ink via-ink/80 to-transparent lg:h-1/3" />
        <div className="absolute inset-y-0 left-0 hidden w-[62%] bg-gradient-to-r from-ink via-ink/85 to-transparent lg:block" />
      </div>

      <div data-hero-content className="container-site">
        <div className="lg:max-w-[42rem]">
          <p
            className="hero-rise inline-flex max-w-full items-center gap-2.5 rounded-full border border-ouro/25 bg-white/[0.03] px-3.5 py-2 text-[0.7rem] font-semibold leading-snug text-ouro backdrop-blur md:text-xs"
            style={vars({ "--i": 0 })}
          >
            <span className="size-1.5 shrink-0 rounded-full bg-ouro" aria-hidden="true" />
            {hero.selo}
          </p>

          <h1 className="font-expanded mt-6 text-[clamp(2rem,8.4vw,4.3rem)] font-bold uppercase leading-[0.96] tracking-tight text-white">
            {hero.titulo.map((linha, i) => (
              <span
                key={linha}
                className={`hero-rise block ${linha === hero.destaque ? "texto-ouro brilho" : ""}`}
                style={vars({ "--i": i + 1 })}
              >
                {linha}
              </span>
            ))}
          </h1>

          <p className="hero-rise mt-6 max-w-xl text-base leading-relaxed text-mute md:text-lg" style={vars({ "--i": 4 })}>
            {hero.subtitulo}
          </p>

          <div className="hero-rise mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-7" style={vars({ "--i": 5 })}>
            <Aplicar local="hero" className="w-full sm:w-auto" />
            <LinkSeta href="#resultados" className="self-start sm:self-auto">
              {hero.secundario}
            </LinkSeta>
          </div>
        </div>

        <dl
          className="hero-rise mt-12 grid max-w-2xl grid-cols-3 gap-4 border-t border-white/10 pt-6 md:mt-14"
          style={vars({ "--i": 6 })}
        >
          {hero.provas.map((p) => (
            <div key={p.rotulo} className="flex flex-col">
              <dt className="order-2 mt-1 text-xs leading-snug text-mute md:text-sm">{p.rotulo}</dt>
              <dd className="font-expanded order-1 text-lg font-bold text-white md:text-2xl">{p.valor}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div aria-hidden="true" className="absolute bottom-6 right-6 hidden items-center gap-3 text-[0.7rem] uppercase tracking-[0.3em] text-mute lg:flex">
        Role
        <span className="relative block h-10 w-px overflow-hidden bg-white/15">
          <span className="bg-ouro absolute inset-x-0 top-0 h-1/2 animate-[scroll-cue_1.8s_ease-in-out_infinite]" />
        </span>
      </div>
    </section>
  );
}
