import { hero, setores } from "@/content/site";
import { MARCA_BLOCO, MARCA_R, MARCA_VIEWBOX } from "@/lib/logo-paths";
import { BotaoMarca, SetaDiagonal, vars } from "./ui";

// Curva S ilustrativa (avanço físico previsto x realizado). O realizado vai até "hoje" na entrada;
// ao rolar a página, a parte futura se desenha e o marcador "hoje" anda até o fim do plano.
const PREVISTO = "M0 150 C 40 149, 70 146, 100 136 S 160 92, 190 64 S 250 18, 300 12";
const REALIZADO = "M0 150 C 40 149.5, 72 147, 102 138 S 158 96, 186 70";
const FUTURO = "M186 70 C 214 44, 246 22, 300 14";
const AREA = `${REALIZADO} C 214 44, 246 22, 300 14 L300 150 L0 150 Z`;

export function Hero() {
  return (
    <section
      id="topo"
      data-hero
      className="relative isolate flex min-h-[100svh] flex-col overflow-hidden bg-[radial-gradient(120%_90%_at_85%_20%,#06363d_0%,#021c20_45%,#011417_80%)] pt-28 md:pt-32"
    >
      <div className="malha absolute inset-0 -z-10" aria-hidden="true" />

      {/* O R da marca, desenhado em linha e depois preenchido de leve. */}
      <div
        data-hero-r
        aria-hidden="true"
        className="pointer-events-none absolute -right-[30vw] top-[10%] -z-10 h-[70svh] w-auto opacity-60 sm:-right-[14vw] lg:-right-[12vw] lg:top-[6%] lg:h-[96svh] lg:opacity-100"
      >
        <svg viewBox={MARCA_VIEWBOX} className="h-full w-auto overflow-visible">
          <defs>
            <linearGradient id="r-linha" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#4fd1a5" stopOpacity="0.9" />
              <stop offset="0.6" stopColor="#4fd1a5" stopOpacity="0.35" />
              <stop offset="1" stopColor="#f7852a" stopOpacity="0.6" />
            </linearGradient>
          </defs>
          <path
            d={MARCA_R}
            pathLength={1}
            className="r-traco r-preenche"
            fill="#ffffff"
            fillOpacity="0.025"
            fillRule="evenodd"
            stroke="url(#r-linha)"
            strokeWidth="0.3"
          />
          <path d={MARCA_BLOCO} className="r-bloco" fill="#00bda1" fillOpacity="0.14" stroke="#4fd1a5" strokeOpacity="0.6" strokeWidth="0.24" />
        </svg>
      </div>

      <div className="container-site relative grid flex-1 items-center gap-12 pb-16 lg:grid-cols-[1.15fr_0.85fr]">
        <div>
          <p data-hero-sub className="hero-sobe relative inline-flex rounded-full bg-white/[0.04] p-1.5 ring-1 ring-white/10" style={vars({ "--i": 0 })}>
            <span className="pilula-enche bg-degrade font-display inline-flex items-center gap-3 rounded-full py-2 pl-2.5 pr-5 text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-abismo sm:text-xs">
              <SetaDiagonal className="size-4" />
              {hero.etiqueta}
            </span>
          </p>

          <h1 className="font-display mt-8 text-[clamp(2.6rem,6vw,5.5rem)] font-bold leading-[1] tracking-[-0.035em] text-white">
            {hero.titulo.map((linha, i) => (
              <span key={linha} data-hero-linha className="mascara-linha">
                <span className="hero-palavra texto-metal" style={vars({ "--i": i })}>
                  {linha}
                </span>
              </span>
            ))}
          </h1>

          <div data-hero-sub>
            <p className="hero-sobe mt-7 max-w-[34rem] text-lg leading-relaxed tracking-wide text-mute md:text-xl" style={vars({ "--i": 3 })}>
              {hero.texto}
            </p>
            <div className="hero-sobe mt-10 flex flex-wrap items-center gap-4" style={vars({ "--i": 4 })}>
              <BotaoMarca />
              <a href="#cases" className="botao-contorno">
                {hero.secundario}
                <SetaDiagonal className="size-3.5 text-menta" />
              </a>
            </div>
          </div>
        </div>

        {/* Painel flutuante: curva S (ilustração) e dois números reais da apresentação. */}
        <div data-hero-painel className="relative hidden [perspective:1200px] lg:block" aria-hidden="true">
          <div className="painel-entra cartao relative ml-auto max-w-[27rem] p-6 shadow-[0_40px_120px_-40px_rgb(0_0_0/0.8)] backdrop-blur-md">
            <div className="flex items-center justify-between text-xs text-mute">
              <span className="font-display font-semibold uppercase tracking-[0.14em] text-nevoa">Curva S · avanço físico</span>
              <span className="flex items-center gap-3">
                <span className="pulso relative size-2 rounded-full bg-menta text-menta" />
                role para avançar
              </span>
            </div>
            <svg viewBox="-8 0 316 162" className="mt-5 w-full overflow-visible">
              <defs>
                <linearGradient id="curva-real" x1="0" x2="1">
                  <stop offset="0" stopColor="#4fd1a5" />
                  <stop offset="1" stopColor="#f7852a" />
                </linearGradient>
                <linearGradient id="curva-area" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#4fd1a5" stopOpacity="0.28" />
                  <stop offset="1" stopColor="#4fd1a5" stopOpacity="0" />
                </linearGradient>
                <clipPath id="curva-clip">
                  <rect data-curva-clip x="-8" y="0" width="194" height="160" />
                </clipPath>
              </defs>
              {[12, 47, 82, 117, 150].map((y) => (
                <line key={y} x1="0" x2="300" y1={y} y2={y} stroke="rgb(255 255 255 / 0.07)" />
              ))}
              <path d={AREA} fill="url(#curva-area)" clipPath="url(#curva-clip)" className="hero-sobe" style={vars({ "--i": 9 })} />
              <path
                d={PREVISTO}
                pathLength={1}
                className="curva-desenha"
                fill="none"
                stroke="rgb(230 239 238 / 0.55)"
                strokeWidth="1.6"
                style={vars({ "--atraso": "0.8s" })}
              />
              <path
                d={REALIZADO}
                pathLength={1}
                className="curva-desenha"
                fill="none"
                stroke="url(#curva-real)"
                strokeWidth="3"
                strokeLinecap="round"
                style={vars({ "--atraso": "1.3s" })}
              />
              <path data-curva-futuro d={FUTURO} fill="none" stroke="#f7852a" strokeWidth="3" strokeLinecap="round" style={{ strokeDasharray: 200, strokeDashoffset: 200 }} />
              <g data-curva-marco transform="translate(186 70)">
                <line x1="0" x2="0" y1="-70" y2="80" stroke="#f7852a" strokeOpacity="0.6" strokeDasharray="2 4" />
                <circle r="5" fill="#f7852a" className="hero-sobe" style={vars({ "--i": 14 })} />
                <text x="6" y="-60" fill="#f7852a" fontSize="9" fontFamily="var(--font-dm)">
                  hoje
                </text>
              </g>
            </svg>
            <div className="mt-4 flex gap-5 text-xs text-mute">
              <span className="flex items-center gap-2">
                <span className="h-0.5 w-5 bg-nevoa/60" /> Previsto
              </span>
              <span className="flex items-center gap-2">
                <span className="bg-degrade h-1 w-5 rounded" /> Realizado
              </span>
              <span className="ml-auto italic opacity-70">ilustração</span>
            </div>
          </div>

          <div data-hero-chip="140" className="absolute -left-6 top-[62%]">
            <div className="hero-sobe cartao flex items-center gap-4 px-5 py-4 backdrop-blur-md" style={vars({ "--i": 8 })}>
              <span className="font-display text-3xl font-semibold text-white">95,87%</span>
              <span className="text-xs leading-snug text-mute">
                das restrições
                <br />
                concluídas na parada
              </span>
            </div>
          </div>
          <div data-hero-chip="60" className="absolute -top-8 right-6">
            <div className="hero-sobe cartao flex items-center gap-3 px-4 py-3 backdrop-blur-md" style={vars({ "--i": 10 })}>
              <span className="selo-seta size-8">
                <SetaDiagonal className="size-3.5" />
              </span>
              <span className="text-xs leading-snug text-nevoa">
                Parada entregue
                <br />
                <strong className="font-semibold text-menta">antes do prazo previsto</strong>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Setores atendidos: faixa que anda com a rolagem e inclina com a velocidade. */}
      <div className="relative overflow-hidden border-y border-white/[0.07] bg-abismo/60 py-5 backdrop-blur-sm" aria-label="Setores atendidos">
        <div data-kinetic="esquerda" data-forca="0.6" className="flex w-max items-center gap-10 whitespace-nowrap">
          {[0, 1, 2].flatMap((rep) =>
            setores.lista.map((s) => (
              <span
                key={`${rep}-${s.id}`}
                aria-hidden={rep > 0 || undefined}
                className="font-display flex items-center gap-10 text-[clamp(1.1rem,2vw,1.6rem)] font-light text-white/80"
              >
                {s.nome}
                <SetaDiagonal className="size-5 text-menta" />
              </span>
            )),
          )}
        </div>
      </div>
    </section>
  );
}
