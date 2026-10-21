import { depoimentos } from "@/content/site";
import { Eyebrow } from "./ui";
import { VideoCard } from "./VideoCard";

export function Depoimentos() {
  return (
    <section id="casesdesucesso" aria-labelledby="cases-titulo" data-cases className="relative overflow-hidden py-24 md:py-0">
      <div data-cases-pin className="md:flex md:h-[100svh] md:items-center">
        <div
          data-cases-track
          className="group/track flex snap-x snap-mandatory gap-5 overflow-x-auto px-5 pb-6 [scrollbar-width:none] md:gap-8 md:px-[max(2rem,calc((100vw-82rem)/2+2rem))] data-[pinned=true]:snap-none data-[pinned=true]:overflow-visible data-[pinned=true]:pb-0"
        >
          <div className="flex w-[85vw] shrink-0 snap-start flex-col justify-center md:w-[30rem] md:pr-8">
            <Eyebrow numero="04">Cases de sucesso</Eyebrow>
            <h2 id="cases-titulo" className="font-expanded mt-6 text-[clamp(1.9rem,3.8vw,3.4rem)] font-bold uppercase leading-[1] tracking-tight text-white">
              {depoimentos.titulo}
            </h2>
            <p className="mt-6 text-mute md:text-lg">{depoimentos.intro}</p>
            <ul className="mt-10 grid gap-3">
              {depoimentos.destaques.map((d) => (
                <li key={d.fonte} className="flex items-baseline justify-between gap-4 border-t border-white/10 pt-3">
                  <span>
                    <strong className="font-expanded text-xl font-bold text-white md:text-2xl">{d.valor}</strong>{" "}
                    <span className="text-mute">{d.texto}</span>
                  </span>
                  <span className="shrink-0 text-xs uppercase tracking-[0.14em] text-laranja">{d.fonte}</span>
                </li>
              ))}
            </ul>
            <p className="mt-8 hidden items-center gap-2 text-sm text-mute md:group-data-[pinned=true]/track:flex" aria-hidden="true">
              Continue rolando
              <span className="inline-block h-px w-10 bg-laranja" />
            </p>
          </div>

          {depoimentos.videos.map((v) => (
            <div key={v.id} className="w-[72vw] max-w-[20rem] shrink-0 snap-start md:w-[min(17.5rem,calc((100svh-20rem)*0.5625))] md:max-w-none">
              <VideoCard {...v} />
            </div>
          ))}
          <div className="w-px shrink-0 md:w-[10vw]" aria-hidden="true" />
        </div>
      </div>
    </section>
  );
}
