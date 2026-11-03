import { cta, evento, hero } from "@/content/site";
import { Simbolo } from "./Logo";
import { Cta, vars } from "./ui";
import { VideoEvento } from "./VideoEvento";

// Abertura: o vídeo do evento em tela cheia, aberto a partir do círculo da marca (CSS puro), com o texto
// centralizado. Com a rolagem a tela fixa, o texto sai e o vídeo vira um quadro: "Veja como foi a última
// edição" (data-hero em src/lib/motion.ts). Com mouse, o texto e o vídeo se deslocam em camadas e uma luz de
// palco segue o cursor sobre o vídeo.
export function Hero() {
  return (
    <section id="topo" data-hero aria-labelledby="hero-titulo" className="relative bg-ink">
      {/* Invólucro da área fixa já no HTML: o ScrollTrigger usa este em vez de criar um e mover a abertura de
          lugar no DOM, o que faria o navegador reiniciar as animações de entrada. */}
      <div data-hero-espaco>
        <div data-hero-palco className="relative h-[100svh] min-h-[32rem] overflow-hidden">
          <div data-hero-janela className="absolute inset-0 overflow-hidden">
            <div className="abertura-circulo absolute inset-0">
              <div data-hero-camada="video" className="absolute -inset-[3%]">
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
                  <source data-src="/videos/evento-480.mp4" media="(max-width: 767px)" type="video/mp4" />
                  <source data-src="/videos/evento-720.mp4" type="video/mp4" />
                </video>
              </div>
              <div data-hero-sombra data-hero-lanterna className="hero-lanterna absolute inset-0" />
              <div data-hero-sombra className="absolute inset-0 bg-[radial-gradient(60%_55%_at_50%_55%,transparent,#050505_100%)]" />
              <div data-hero-sombra className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-ink to-transparent" />
            </div>
          </div>

          <div aria-hidden="true" className="abertura-centro pointer-events-none absolute grid -translate-x-1/2 -translate-y-1/2 place-items-center">
            <Simbolo id="abertura-simbolo" className="abertura-simbolo size-20 md:size-28" />
          </div>

          <p
            data-hero-legenda
            aria-hidden="true"
            className="font-expanded pointer-events-none absolute inset-x-0 top-[3.25rem] hidden text-center text-[clamp(1.1rem,2.6vw,2.2rem)] font-bold uppercase text-white md:top-[4.5rem]"
          >
            {hero.video}
          </p>

          <div data-hero-conteudo className="relative z-10 flex h-full flex-col items-center justify-end pb-20 pt-24 text-center md:justify-center md:pb-24 md:pt-28">
            <div data-hero-camada="texto" className="container-site flex flex-col items-center">
              <p
                className="hero-rise flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-fog md:text-xs"
                style={vars({ "--i": 6 })}
              >
                <span>{evento.datasCurtas.replace(" set", " de setembro")}</span>
                <span className="size-1 rounded-full bg-ouro" aria-hidden="true" />
                <span>{evento.cidade}</span>
                <span className="size-1 rounded-full bg-ouro" aria-hidden="true" />
                <span>{evento.vagas} vagas</span>
              </p>
              <h1
                id="hero-titulo"
                className="font-expanded hero-sobe mt-6 max-w-[20ch] text-balance text-[clamp(1.75rem,min(5vw,7.6svh),4.4rem)] font-bold uppercase leading-[0.98] tracking-tight text-white [@media(max-height:600px)]:mt-4 [@media(max-height:600px)]:text-[1.55rem]"
              >
                {hero.titulo} <span className="texto-ouro brilho">{hero.destaque}</span>
              </h1>
              <p
                className="hero-rise mt-5 max-w-xl text-pretty text-base leading-relaxed text-fog/85 md:text-lg [@media(max-height:700px)]:hidden [@media(max-height:760px)_and_(max-width:767px)]:hidden"
                style={vars({ "--i": 8 })}
              >
                {hero.complemento.charAt(0).toUpperCase() + hero.complemento.slice(1)} {hero.subtitulo}
              </p>
              <div className="hero-rise mt-8 flex w-full flex-col items-center gap-4 sm:w-auto" style={vars({ "--i": 9 })}>
                <Cta local="hero" className="w-full sm:w-auto sm:px-10">
                  {cta}
                </Cta>
                <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.16em] text-mute [@media(max-height:700px)_and_(max-width:767px)]:hidden">
                  <span className="block h-1 w-24 overflow-hidden rounded-full bg-white/15" aria-hidden="true">
                    <span className="bg-ouro block h-full rounded-full" style={{ width: `${evento.vendidos}%` }} />
                  </span>
                  {evento.vendidos}% dos ingressos vendidos
                </p>
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
            <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M4 9.5h3.5L12 5v14l-4.5-4.5H4z" />
              <path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a7.5 7.5 0 0 1 0 11" />
            </svg>
            <span data-som-rotulo>Ligar som</span>
          </button>
          <div aria-hidden="true" data-hero-dica className="hero-rise absolute bottom-8 left-1/2 hidden -translate-x-1/2 flex-col items-center md:flex" style={vars({ "--i": 11 })}>
            <span className="relative block h-10 w-px overflow-hidden bg-white/15">
              <span className="bg-ouro absolute inset-x-0 top-0 h-1/2 animate-[scroll-cue_1.8s_ease-in-out_infinite]" />
            </span>
          </div>
          <VideoEvento />
        </div>
      </div>
    </section>
  );
}
