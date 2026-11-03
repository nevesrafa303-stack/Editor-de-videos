import { depoimentos } from "@/content/site";
import { Cabecalho } from "./Cabecalho";
import { Seta } from "./ui";
import { VideoCard } from "./VideoCard";

// Depoimentos em vídeo (os mesmos da RISE). Desktop: a seção fixa com o título no alto e os vídeos correm na
// horizontal com a rolagem (src/lib/motion.ts). Celular e tablet: carrossel com deslize nativo.
export function Depoimentos() {
  return (
    <section id="depoimentos" aria-labelledby="cases-titulo" data-cases className="relative py-24 md:py-32 lg:py-0">
      <div data-cases-espaco>
        <div data-cases-pin className="lg:flex lg:h-[100svh] lg:flex-col lg:justify-center lg:overflow-hidden">
          <div className="container-site">
            <Cabecalho id="cases-titulo" titulo={depoimentos.titulo} intro={depoimentos.intro} />
          </div>

          <div className="mt-10 lg:mt-10 lg:overflow-hidden">
            <div
              data-cases-track
              className="flex w-full min-w-0 snap-x snap-mandatory scroll-px-5 items-stretch gap-4 overflow-x-auto px-5 pb-4 [scrollbar-width:none] md:scroll-px-8 md:gap-5 md:px-8 lg:px-[max(2rem,calc((100vw-82rem)/2+2rem))] data-[pinned=true]:snap-none data-[pinned=true]:overflow-visible data-[pinned=true]:pb-0"
            >
              {/* Primeiro cartão: os resultados em números, antes dos vídeos. */}
              <div className="flex w-[70vw] max-w-[18rem] shrink-0 snap-start flex-col justify-between rounded-3xl border border-ouro/25 bg-gradient-to-b from-ouro/[0.08] to-transparent p-6 md:w-[17rem] lg:w-[19rem] lg:max-w-none">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ouro">Resultados</p>
                  <ul className="mt-6 grid gap-5">
                    {depoimentos.destaques.map((d) => (
                      <li key={d.valor} className="border-t border-white/10 pt-4">
                        <p className="font-expanded text-xl font-bold leading-tight text-white">{d.valor}</p>
                        <p className="mt-1 text-sm text-mute">{d.texto}</p>
                      </li>
                    ))}
                  </ul>
                </div>
                <p className="mt-6 flex items-center gap-2 text-sm font-semibold text-fog">
                  Assista aos depoimentos <Seta className="size-4 text-ouro" />
                </p>
              </div>
              {depoimentos.videos.map((v) => (
                <div key={v.id} className="w-[70vw] max-w-[18rem] shrink-0 snap-start md:w-[17rem] lg:w-[16.5rem] lg:max-w-none">
                  <VideoCard {...v} alturaDaTela />
                </div>
              ))}
              <div className="w-px shrink-0 lg:w-[6vw]" aria-hidden="true" />
            </div>
          </div>

          <div aria-hidden="true" className="container-site mt-8 hidden lg:block">
            <span className="mx-auto block h-px max-w-xs overflow-hidden bg-white/15">
              <span data-cases-progresso className="bg-ouro block h-full w-full origin-left" style={{ transform: "scaleX(0)" }} />
            </span>
          </div>
          <p className="container-site mt-3 flex items-center justify-center gap-2 text-xs text-mute lg:hidden" aria-hidden="true">
            Deslize para ver mais depoimentos <Seta className="size-3.5" />
          </p>
        </div>
      </div>
    </section>
  );
}
