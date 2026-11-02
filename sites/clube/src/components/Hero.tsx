import { cta, evento, hero } from "@/content/site";
import { Simbolo } from "./Logo";
import { Cta, vars } from "./ui";
import { VideoEvento } from "./VideoEvento";

function Icone({ tipo }: { tipo: "data" | "local" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-4 text-ouro"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      {tipo === "data" ? (
        <>
          <rect x="3.5" y="5" width="17" height="15" rx="2.5" />
          <path d="M3.5 10h17M8 3v4M16 3v4" />
        </>
      ) : (
        <>
          <path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Z" />
          <circle cx="12" cy="10" r="2.3" />
        </>
      )}
    </svg>
  );
}

// Abertura: o vídeo do evento em tela cheia, aberto a partir do círculo da marca (CSS puro).
// Com a rolagem a tela fixa, o texto sai e o vídeo vira um quadro: "Veja como foi a última edição"
// (data-hero em src/lib/motion.ts). O botão liga o som (src/lib/video-evento.ts).
export function Hero() {
  return (
    <section
      id="topo"
      data-hero
      aria-labelledby="hero-titulo"
      className="relative bg-ink"
    >
      {/* Invólucro da área fixa já no HTML: o ScrollTrigger usa este em vez de criar um e mover a abertura de
          lugar no DOM, o que faria o navegador reiniciar as animações de entrada. */}
      <div data-hero-espaco>
        <div
          data-hero-palco
          className="relative h-[100svh] min-h-[32rem] overflow-hidden"
        >
          <div data-hero-janela className="absolute inset-0 overflow-hidden">
            <div className="abertura-circulo absolute inset-0">
              <video
                data-video-evento
                muted
                loop
                playsInline
                preload="none"
                poster="/videos/evento-poster.webp"
                aria-label="Vídeo da última edição da Imersão Clube das Agências"
                className="hero-media size-full object-cover"
              >
                <source
                  data-src="/videos/evento-480.mp4"
                  media="(max-width: 767px)"
                  type="video/mp4"
                />
                <source data-src="/videos/evento-720.mp4" type="video/mp4" />
              </video>
              <div
                data-hero-sombra
                className="absolute inset-0 bg-gradient-to-t from-ink via-ink/55 to-ink/20"
              />
              <div
                data-hero-sombra
                className="absolute inset-y-0 left-0 hidden w-2/3 bg-gradient-to-r from-ink/80 to-transparent lg:block"
              />
            </div>
          </div>

          <div
            aria-hidden="true"
            className="abertura-centro pointer-events-none absolute grid -translate-x-1/2 -translate-y-1/2 place-items-center"
          >
            <Simbolo
              id="abertura-simbolo"
              className="abertura-simbolo size-20 md:size-28"
            />
          </div>

          <p
            data-hero-legenda
            aria-hidden="true"
            className="font-expanded pointer-events-none absolute inset-x-0 top-[3.25rem] hidden text-center text-[clamp(1.1rem,2.6vw,2.2rem)] font-bold uppercase text-white md:top-[4.5rem]"
          >
            {hero.video}
          </p>

          <div
            data-hero-conteudo
            className="relative z-10 flex h-full flex-col justify-end pb-20 pt-24"
          >
            <div className="container-site">
              <p
                className="hero-rise inline-flex max-w-full items-center gap-2.5 rounded-full border border-ouro/25 bg-ink/40 px-3.5 py-2 text-[0.7rem] font-semibold leading-snug text-ouro backdrop-blur md:text-xs"
                style={vars({ "--i": 6 })}
              >
                <span
                  className="size-1.5 shrink-0 rounded-full bg-ouro"
                  aria-hidden="true"
                />
                {hero.selo}
              </p>
              <p
                className="hero-rise mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold text-white md:text-base"
                style={vars({ "--i": 7 })}
              >
                <span className="inline-flex items-center gap-2">
                  <Icone tipo="data" />
                  {evento.datas}
                </span>
                <span className="inline-flex items-center gap-2">
                  <Icone tipo="local" />
                  {evento.cidade}
                </span>
              </p>
              <h1
                id="hero-titulo"
                className="font-expanded hero-sobe mt-5 max-w-[22ch] text-[clamp(1.75rem,min(4.6vw,7.4svh),4rem)] font-bold uppercase leading-[0.98] tracking-tight text-white [@media(max-height:600px)]:mt-4 [@media(max-height:600px)]:text-[1.55rem]"
                style={vars({ "--i": 8 })}
              >
                {hero.titulo}{" "}
                <span className="texto-ouro brilho mt-2 block text-[0.62em] leading-[1.05]">
                  {hero.complemento}
                </span>
              </h1>
              {/* Telas baixas (celular com a barra do navegador, notebook de 720 px): o parágrafo sai para o título e o
                botão caberem sem rolar. */}
              <p
                className="hero-rise mt-5 max-w-2xl text-base leading-relaxed text-fog/85 md:text-lg [@media(max-height:700px)]:hidden [@media(max-height:760px)_and_(max-width:767px)]:hidden"
                style={vars({ "--i": 9 })}
              >
                {hero.subtitulo}
              </p>
              <div
                className="hero-rise mt-7 flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-8"
                style={vars({ "--i": 10 })}
              >
                <Cta local="hero" className="w-full sm:w-auto">
                  {cta}
                </Cta>
                <div className="w-full max-w-60 [@media(max-height:700px)_and_(max-width:767px)]:hidden">
                  <p className="flex items-baseline justify-between text-xs font-semibold uppercase tracking-[0.14em] text-mute">
                    Ingressos vendidos
                    <span className="font-expanded text-base text-white">
                      {evento.vendidos}%
                    </span>
                  </p>
                  <span
                    className="mt-2 block h-1.5 overflow-hidden rounded-full bg-white/15"
                    aria-hidden="true"
                  >
                    <span
                      className="bg-ouro block h-full rounded-full"
                      style={{ width: `${evento.vendidos}%` }}
                    />
                  </span>
                </div>
              </div>
            </div>
          </div>

          <button
            type="button"
            data-som
            data-cursor="Som"
            aria-pressed="false"
            className="hero-rise absolute bottom-5 right-4 z-20 inline-flex items-center gap-2.5 rounded-full border border-white/20 bg-ink/50 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur transition hover:border-ouro/60 md:bottom-8 md:right-8"
            style={vars({ "--i": 11 })}
          >
            <svg
              viewBox="0 0 24 24"
              className="size-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M4 9.5h3.5L12 5v14l-4.5-4.5H4z" />
              <path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a7.5 7.5 0 0 1 0 11" />
            </svg>
            <span data-som-rotulo>Ligar som</span>
          </button>
          <VideoEvento />
        </div>
      </div>
    </section>
  );
}
