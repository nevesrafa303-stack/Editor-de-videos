import Image from "next/image";
import { cta, evento, final } from "@/content/site";
import palco from "@/assets/img/palco-placas.webp";
import { Simbolo } from "./Logo";

// Chamada final centralizada: um botão redondo com o texto girando em volta. No desktop o botão é atraído
// pelo mouse dentro da seção (data-ima em src/lib/motion.ts).
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
          data-split
          className="font-expanded text-[clamp(2.6rem,9vw,8rem)] font-bold uppercase leading-[0.9] tracking-tight text-white"
        >
          {final.titulo}
        </h2>
        <p data-reveal className="mt-6 max-w-xl text-pretty text-lg leading-relaxed text-fog/85">
          {final.texto}
        </p>

        <div data-reveal className="mt-12 md:mt-14">
          <a
            href="#ingressos"
            data-cta="final"
            data-ima
            aria-label={cta}
            className="group relative grid size-44 place-items-center rounded-full md:size-56"
          >
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
