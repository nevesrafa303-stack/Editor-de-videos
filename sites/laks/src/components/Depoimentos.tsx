import { depoimentos } from "@/content/site";
import { Seta } from "./ui";
import { VideoCard } from "./VideoCard";

// Desktop (lg+): a seção fixa, o texto fica à esquerda e os vídeos correm na horizontal (src/lib/motion.ts).
// Celular e tablet: texto em cima e carrossel de vídeos com deslize nativo.
export function Depoimentos() {
  return (
    <section id="casesdesucesso" aria-labelledby="cases-titulo" data-cases className="relative py-24 lg:py-0">
      <div data-cases-pin className="lg:flex lg:h-[100svh] lg:items-center">
        <div className="container-site lg:w-[calc(max(2rem,calc((100vw-82rem)/2+2rem))+min(40vw,30rem))] lg:max-w-none lg:shrink-0 lg:pl-[max(2rem,calc((100vw-82rem)/2+2rem))] lg:pr-10">
          <h2
            id="cases-titulo"
            data-split
            className="font-expanded text-[clamp(1.8rem,3.2vw,3rem)] font-bold uppercase leading-[0.98] tracking-tight text-white"
          >
            {depoimentos.titulo}
          </h2>
          <p data-reveal className="mt-5 max-w-md text-base leading-relaxed text-mute lg:text-lg">{depoimentos.intro}</p>
          <ul data-reveal="stagger" className="mt-8 grid max-w-xl border-t border-white/10 lg:mt-10">
            {depoimentos.destaques.map((d) => (
              <li key={d.fonte} className="flex items-end justify-between gap-4 border-b border-white/10 py-3.5">
                <div>
                  <p className="font-expanded text-lg font-bold leading-tight text-white md:text-xl">{d.valor}</p>
                  <p className="text-sm text-mute">{d.texto}</p>
                </div>
                <p className="shrink-0 pb-0.5 text-right text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-laranja">{d.fonte}</p>
              </li>
            ))}
          </ul>
          <div aria-hidden="true" className="mt-10 hidden h-px overflow-hidden bg-white/15 lg:block">
            <span data-cases-progresso className="block h-full w-full origin-left bg-laranja" style={{ transform: "scaleX(0)" }} />
          </div>
        </div>

        <div className="mt-10 lg:mt-0 lg:flex lg:h-full lg:min-w-0 lg:flex-1 lg:items-center lg:overflow-hidden lg:[mask-image:linear-gradient(90deg,transparent,#000_5%)]">
          <div
            data-cases-track
            className="flex w-full min-w-0 snap-x snap-mandatory scroll-px-5 gap-4 overflow-x-auto px-5 pb-4 [scrollbar-width:none] md:scroll-px-8 md:gap-6 md:px-8 lg:pl-10 lg:pr-8 data-[pinned=true]:snap-none data-[pinned=true]:overflow-visible data-[pinned=true]:pb-0"
          >
            {depoimentos.videos.map((v) => (
              <div key={v.id} className="w-[70vw] max-w-[18rem] shrink-0 snap-start md:w-[17rem] lg:w-[17.5rem] lg:max-w-none">
                <VideoCard {...v} alturaDaTela />
              </div>
            ))}
            <div className="w-px shrink-0 lg:w-[6vw]" aria-hidden="true" />
          </div>
          <p className="container-site mt-3 flex items-center gap-2 text-xs text-mute lg:hidden" aria-hidden="true">
            Deslize para ver mais depoimentos <Seta className="size-3.5" />
          </p>
        </div>
      </div>
    </section>
  );
}
