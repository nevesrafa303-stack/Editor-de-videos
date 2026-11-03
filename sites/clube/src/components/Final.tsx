import Image from "next/image";
import { cta, evento, final } from "@/content/site";
import palco from "@/assets/img/palco-placas.webp";
import { Simbolo } from "./Logo";

// Chamada final centralizada: as letras de "Hora de agir" entram uma a uma e, com mouse, reagem ao cursor;
// um botão redondo com o texto girando em volta é atraído pelo mouse dentro da seção (src/lib/motion.ts).
export function Final() {
  const anel = `${cta} · ${evento.vagas} vagas · ${evento.datasCurtas} · `;
  return (
    <section id="agir" data-ima-area aria-labelledby="final-titulo" className="relative isolate overflow-clip py-28 md:py-40">
      <div aria-hidden="true" className="absolute inset-0 -z-10">
        <Image src={palco} alt="" fill sizes="100vw" data-parallax="12" className="scale-110 object-cover opacity-25 grayscale" />
        <div className="absolute inset-0 bg-[radial-gradient(55%_60%_at_50%_50%,rgb(5_5_5/0.55),#050505_100%)]" />
      </div>
      <div className="container-site flex flex-col items-center text-center">
        <h2
          id="final-titulo"
          aria-label={final.titulo}
          data-letras
          className="font-expanded flex flex-wrap justify-center gap-x-[0.28em] text-[clamp(2.6rem,9vw,8rem)] font-bold uppercase leading-[0.9] tracking-tight text-white"
        >
          {/* Uma letra por <span>: com mouse, as letras perto do cursor sobem e douram (src/lib/motion.ts). */}
          {final.titulo.split(" ").map((palavra) => (
            <span key={palavra} aria-hidden="true" className="inline-flex whitespace-nowrap">
              {palavra.split("").map((l, i) => (
                <span key={i} data-letra className="letra-final inline-block">
                  {l}
                </span>
              ))}
            </span>
          ))}
        </h2>
        <p data-reveal className="mt-6 max-w-xl text-pretty text-lg leading-relaxed text-fog/85">
          {final.texto}
        </p>

        <div data-reveal className="mt-12 md:mt-14">
          <a
            href="#ingressos"
            data-cta="final"
            data-ima
            className="group relative grid size-44 place-items-center rounded-full md:size-56"
          >
            <span className="sr-only">{cta}</span>
            <svg viewBox="0 0 200 200" className="anel-giro absolute inset-0 size-full text-fog" aria-hidden="true">
              <defs>
                <path id="anel-caminho" d="M100,100 m-82,0 a82,82 0 1,1 164,0 a82,82 0 1,1 -164,0" />
              </defs>
              <text className="fill-current text-[13px] font-semibold uppercase tracking-[0.32em]">
                <textPath href="#anel-caminho">{anel}</textPath>
              </text>
            </svg>
            <span
              data-ima-miolo
              className="bg-ouro relative grid size-24 place-items-center rounded-full text-ink shadow-[0_18px_50px_-12px] shadow-brasa/70 transition-transform duration-500 ease-out-expo group-hover:scale-110 md:size-28"
            >
              <svg viewBox="0 0 24 24" className="size-8 transition-transform duration-500 ease-out-expo group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12h13m-5-6 6 6-6 6" />
              </svg>
            </span>
          </a>
        </div>
        <Simbolo id="final-simbolo" className="mt-14 size-8 opacity-60" />
      </div>
    </section>
  );
}
