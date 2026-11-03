import { depoimentos } from "@/content/site";
import { Cabecalho } from "./Cabecalho";
import { DepoimentosControle } from "./DepoimentosControle";

// Depoimentos como uma playlist: um palco com o vídeo escolhido (a fala aparece por cima, como legenda) e
// a lista de quem fala ao lado. Escolher alguém troca o vídeo com uma cortina; no play o vídeo toca com
// som, e a linha da lista mostra o andamento (src/lib/depoimentos.ts). Com mouse, o palco mostra uma prévia
// sem som. Celular: título, palco e a lista embaixo.
export function Depoimentos() {
  const { videos } = depoimentos;
  return (
    <section id="depoimentos" aria-labelledby="cases-titulo" data-cases className="relative py-24 md:py-32">
      <div className="container-site grid grid-cols-1 gap-10 lg:grid-cols-[auto_minmax(0,1fr)] lg:grid-rows-[auto_auto] lg:gap-x-[clamp(3rem,6vw,6rem)] lg:gap-y-10">
        <div className="lg:col-start-2 lg:row-start-1 lg:self-end">
          <Cabecalho id="cases-titulo" titulo={depoimentos.titulo} destaque="escalaram" intro={depoimentos.intro} esquerda />
        </div>

        <div className="lg:col-start-1 lg:row-span-2 lg:row-start-1 lg:self-center">
          <div
            data-cases-palco
            data-reveal
            className="relative mx-auto aspect-[9/16] w-full max-w-[22rem] overflow-hidden rounded-[28px] border border-white/10 bg-black shadow-[0_40px_80px_-40px_rgba(0,0,0,0.9)] lg:h-[min(76svh,42rem)] lg:w-auto lg:max-w-none"
          >
            {videos.map((v, i) => (
              <div key={v.id} data-cases-slide data-id={v.id} data-ativo={i === 0} inert={i !== 0} className="cases-slide absolute inset-0">
                <button
                  type="button"
                  data-cases-play
                  data-video={v.id}
                  data-src={`/videos/depoimento-${v.id}.mp4`}
                  data-previa-src={`/videos/depoimento-${v.id}.mp4`}
                  data-cursor="Assistir"
                  className="group absolute inset-0 flex flex-col justify-end overflow-hidden p-6 text-left md:p-7"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- poster já otimizado (WebP ~15 KB) */}
                  <img
                    src={`/videos/depoimento-${v.id}-poster.webp`}
                    alt=""
                    width={408}
                    height={720}
                    loading="lazy"
                    decoding="async"
                    className="cases-poster absolute inset-0 size-full object-cover"
                  />
                  <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
                  <span className="sr-only">
                    Assistir ao depoimento: {v.nome}, {v.empresa}, {v.duracao}
                  </span>
                  <span
                    aria-hidden="true"
                    className="absolute left-1/2 top-[38%] grid size-[4.5rem] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-ouro text-ink shadow-[0_0_0_12px] shadow-brasa/25 transition duration-500 ease-out-expo group-hover:scale-110 group-hover:shadow-[0_0_0_18px]"
                  >
                    <svg viewBox="0 0 24 24" className="ml-1 size-7" fill="currentColor">
                      <path d="M8 5.5v13l10.5-6.5z" />
                    </svg>
                  </span>
                  <span aria-hidden="true" className="cases-fala relative block">
                    <span className="block text-pretty text-[1.05rem] font-semibold leading-snug text-white md:text-lg">“{v.citacao}”</span>
                    <span className="mt-4 flex items-center justify-between gap-3 text-sm">
                      <span className="min-w-0 text-fog">
                        <strong className="font-semibold text-white">{v.nome}</strong> · {v.empresa}
                      </span>
                      <span className="shrink-0 rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur">{v.duracao}</span>
                    </span>
                  </span>
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-start-2 lg:row-start-2 lg:self-start">
          <ol data-reveal="stagger" className="border-t border-white/10" aria-label="Escolha um depoimento">
            {videos.map((v, i) => (
              <li key={v.id} className="border-b border-white/10">
                <button
                  type="button"
                  data-cases-item
                  data-id={v.id}
                  aria-pressed={i === 0}
                  data-cursor="Ver"
                  className="cases-item group relative flex w-full items-center gap-5 py-5 text-left md:gap-6"
                >
                  <span aria-hidden="true" className="font-expanded w-7 shrink-0 text-sm font-bold text-mute transition-colors group-aria-pressed:text-ouro">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-white md:text-lg">{v.nome}</span>
                    <span className="block text-sm text-mute">{v.empresa}</span>
                  </span>
                  <span className="shrink-0 text-sm tabular-nums text-mute">{v.duracao}</span>
                  <span aria-hidden="true" className="cases-seta grid size-10 shrink-0 place-items-center rounded-full border border-white/15 text-white">
                    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h13m-5-6 6 6-6 6" />
                    </svg>
                  </span>
                  <span aria-hidden="true" className="cases-andamento" />
                </button>
              </li>
            ))}
          </ol>
          <dl data-reveal="stagger" className="mt-10 grid gap-6 sm:grid-cols-3 sm:gap-0">
            {depoimentos.destaques.map((d, i) => (
              <div key={d.valor} className={`sm:px-5 ${i ? "sm:border-l sm:border-white/10" : "sm:pl-0"}`}>
                <dt className="font-expanded text-lg font-bold leading-tight text-white">{d.valor}</dt>
                <dd className="mt-1.5 text-sm leading-snug text-mute">{d.texto}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
      <DepoimentosControle />
    </section>
  );
}
