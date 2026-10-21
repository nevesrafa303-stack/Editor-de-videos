import Image, { getImageProps, type StaticImageData } from "next/image";
import { hero } from "@/content/site";
import heroWide from "@/assets/img/hero-camisa-10-wide.webp";
import heroMobile from "@/assets/img/hero-camisa-10.webp";
import seloMeta from "@/assets/img/selo-meta-business-partners.webp";
import amil from "@/assets/img/cubos/amil.webp";
import bradesco from "@/assets/img/cubos/bradesco.webp";
import hapvida from "@/assets/img/cubos/hapvida.webp";
import porto from "@/assets/img/cubos/porto.webp";
import sulamerica from "@/assets/img/cubos/sulamerica.webp";
import { Cta, vars } from "./ui";

type Cubo = { src: StaticImageData; alt: string; className: string; depth: number; dur: string; blur?: boolean };

// depth: quanto o cubo sobe com a rolagem (paralaxe); valores maiores parecem mais perto.
const cubos: Cubo[] = [
  { src: sulamerica, alt: "SulAmérica", className: "left-[5%] top-[11%] w-[11vw] max-w-40 hidden md:block", depth: 0.5, dur: "7s" },
  { src: porto, alt: "Porto", className: "right-[4%] top-[9%] w-[22vw] max-w-36 md:right-[7%] md:top-[12%] md:w-[9vw]", depth: 0.8, dur: "6s" },
  { src: hapvida, alt: "Hapvida", className: "right-[-2%] top-[18%] w-[13vw] max-w-56 hidden lg:block", depth: 1.3, dur: "8s" },
  { src: bradesco, alt: "Bradesco Seguros", className: "left-[-5%] top-[13%] w-[22vw] max-w-32 md:hidden lg:block lg:left-[17%] lg:top-[24%] lg:w-[6vw]", depth: 1, dur: "6.5s", blur: true },
  { src: amil, alt: "Amil", className: "right-[29%] top-[7%] w-[5vw] max-w-20 hidden lg:block", depth: 0.3, dur: "9s", blur: true },
];

export function Hero() {
  const common = { alt: "", sizes: "100vw", quality: 80 };
  const {
    props: { srcSet: desktop },
  } = getImageProps({ ...common, src: heroWide });
  const {
    props: { srcSet: mobile, ...img },
  } = getImageProps({ ...common, src: heroMobile, quality: 70, fetchPriority: "high", loading: "eager" });

  return (
    <section
      id="topo"
      data-hero
      className="relative isolate flex min-h-[100svh] flex-col justify-end overflow-hidden pb-14 pt-[64vw] md:pb-16 md:pt-[28vw] xl:pt-[24vw]"
    >
      {/* A foto fica no topo na proporção original: a camisa "A camisa 10 das corretoras" é a mensagem. */}
      <div data-hero-media className="absolute inset-x-0 top-0 -z-10 origin-[50%_25%]">
        <picture className="hero-media block">
          <source media="(min-width: 768px)" srcSet={desktop} />
          <img {...img} alt="" srcSet={mobile} className="h-auto max-h-[84svh] w-full object-cover object-top" />
        </picture>
        <div className="absolute inset-0 bg-[radial-gradient(90%_80%_at_50%_10%,transparent_45%,#020202_95%)]" />
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-ink via-ink/70 to-transparent" />
      </div>

      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        {cubos.map((c) => (
          <div key={c.alt} data-depth={c.depth} className={`absolute ${c.className}`}>
            <div className="float" style={vars({ "--float-dur": c.dur })}>
              <Image
                src={c.src}
                alt=""
                sizes="(min-width: 768px) 14vw, 24vw"
                className={`h-auto w-full drop-shadow-[0_30px_40px_rgba(0,0,0,.6)] ${c.blur ? "blur-[2px] brightness-75" : ""}`}
              />
            </div>
          </div>
        ))}
      </div>

      <div data-hero-content className="container-site relative">
        {/* Palavras quebram naturalmente; max-w em "em" garante 3 linhas no desktop e 4 no celular. */}
        <h1 className="font-expanded max-w-[14em] text-[clamp(1.5rem,8vw,4.6rem)] font-bold uppercase leading-[0.98] tracking-[-0.02em] text-white">
          {hero.titulo
            .join(" ")
            .split(" ")
            .map((palavra, i, todas) => (
              <span key={i}>
                <span className="inline-block overflow-hidden pb-[0.06em] align-bottom">
                  <span
                    className={`hero-rise inline-block ${palavra === hero.destaque ? "text-laranja" : ""}`}
                    style={vars({ "--i": i * 0.6 })}
                  >
                    {palavra}
                  </span>
                </span>
                {i < todas.length - 1 ? " " : ""}
              </span>
            ))}
        </h1>

        <div className="mt-7 grid gap-7 md:mt-10 lg:grid-cols-[minmax(0,30rem)_auto] lg:items-end lg:justify-between lg:gap-10">
          <p className="hero-rise max-w-xl text-[0.95rem] leading-relaxed text-mute md:text-lg" style={vars({ "--i": 4 })}>
            {hero.subtitulo}
          </p>
          <div className="hero-rise flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:gap-6" style={vars({ "--i": 5 })}>
            <Cta href="#forms" data-cta="hero">
              {hero.ctaPrincipal}
            </Cta>
            <Cta href="#casesdesucesso" variante="link" className="self-start sm:self-auto">
              {hero.ctaSecundario}
            </Cta>
          </div>
        </div>

        <div className="hero-rise mt-10 flex items-center gap-5 border-t border-white/10 pt-6 md:mt-14" style={vars({ "--i": 6 })}>
          <Image src={seloMeta} alt="Meta Business Partners" className="h-7 w-auto shrink-0 opacity-90 md:h-8" sizes="140px" />
          <span className="h-8 w-px shrink-0 bg-white/15" aria-hidden="true" />
          <p className="text-sm leading-tight text-mute">
            <strong className="font-expanded text-base font-bold text-white">400+</strong>
            <br className="sm:hidden" /> corretoras ativas
          </p>
          <span className="hidden h-8 w-px shrink-0 bg-white/15 md:block" aria-hidden="true" />
          <p className="hidden text-sm leading-tight text-mute md:block">
            Sede física em <span className="text-fog">Balneário Camboriú, SC</span>
          </p>
        </div>
      </div>

      <div aria-hidden="true" className="absolute bottom-6 right-6 hidden items-center gap-3 text-[0.7rem] uppercase tracking-[0.3em] text-mute lg:flex">
        Role
        <span className="relative block h-10 w-px overflow-hidden bg-white/15">
          <span className="absolute inset-x-0 top-0 h-1/2 animate-[scroll-cue_1.8s_ease-in-out_infinite] bg-laranja" />
        </span>
      </div>
    </section>
  );
}
