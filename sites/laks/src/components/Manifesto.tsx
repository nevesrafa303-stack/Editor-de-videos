import { manifesto } from "@/content/site";
import { Seta } from "./ui";

// Cena "o jogo". Sem animação: súmula estática (placar, lista de lances e o bloco laranja da virada).
// Com animação (data-cena="ativa", em src/lib/motion.ts): a tela fixa, cada lance entra gigante e vira
// gol contra no placar; no fim a tela gira como uma placa e mostra o verso laranja com a virada.

function Placar({ casa, fora, legenda, verso = false }: { casa: number; fora: number; legenda: string; verso?: boolean }) {
  const num = verso ? "bg-ink text-laranja" : "bg-ink text-white";
  return (
    <div aria-hidden="true" className="flex flex-col items-center gap-3">
      <div
        className={`flex items-center gap-3 rounded-2xl border px-3 py-2.5 md:gap-5 md:px-5 md:py-3 lg:gap-6 lg:px-6 lg:py-4 ${
          verso ? "border-ink/15 bg-ink/10" : "border-white/10 bg-white/[0.04]"
        }`}
      >
        <span className={`w-[5.5rem] text-[0.62rem] font-semibold uppercase leading-tight tracking-[0.14em] md:w-28 md:text-xs lg:w-36 lg:text-sm ${verso ? "text-ink" : "text-mute"}`}>
          {manifesto.placar.casa}
        </span>
        <span className={`font-expanded grid h-12 w-11 place-items-center overflow-hidden rounded-lg text-3xl font-bold md:h-16 md:w-14 md:text-5xl lg:h-20 lg:w-[4.5rem] lg:text-6xl ${num}`}>
          <span data-placar={verso ? "virada-casa" : "casa"} className="inline-block">
            {casa}
          </span>
        </span>
        <span className={`font-expanded text-xl font-bold lg:text-3xl ${verso ? "text-ink/60" : "text-mute"}`}>×</span>
        <span className={`font-expanded grid h-12 w-11 place-items-center overflow-hidden rounded-lg text-3xl font-bold md:h-16 md:w-14 md:text-5xl lg:h-20 lg:w-[4.5rem] lg:text-6xl ${num}`}>
          <span data-placar={verso ? "virada-fora" : "fora"} className="inline-block">
            {fora}
          </span>
        </span>
        <span className={`w-[5.5rem] text-right text-[0.62rem] font-semibold uppercase leading-tight tracking-[0.14em] md:w-28 md:text-xs lg:w-36 lg:text-sm ${verso ? "text-ink" : "text-mute"}`}>
          {manifesto.placar.fora}
        </span>
      </div>
      <p className={`flex items-center gap-2 text-[0.65rem] font-semibold uppercase tracking-[0.24em] md:text-xs lg:text-sm ${verso ? "text-ink" : "text-mute"}`}>
        <span className={`size-1.5 rounded-full ${verso ? "bg-ink" : "bg-laranja"}`} />
        <span data-placar={verso ? "virada-legenda" : "tempo"}>{legenda}</span>
      </p>
    </div>
  );
}

export function Manifesto() {
  const total = manifesto.lances.length;
  const palavras = manifesto.virada.split(" ");
  return (
    <section aria-labelledby="jogo-titulo" data-jogo className="relative bg-ink">
      <h2 id="jogo-titulo" className="sr-only">
        {manifesto.titulo}
      </h2>
      <div data-jogo-palco className="jogo-palco">
        <div data-jogo-cena className="jogo-cena">
          <div data-jogo-frente className="jogo-frente container-site flex flex-col py-24">
            <svg aria-hidden="true" className="jogo-campo" viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid slice" fill="none">
              <line x1="500" y1="-50" x2="500" y2="650" />
              <circle cx="500" cy="300" r="130" />
              <circle cx="500" cy="300" r="5" className="fill-current" />
            </svg>
            <div data-jogo-flash aria-hidden="true" className="jogo-flash" />

            <Placar casa={0} fora={total} legenda="Ao vivo · 90'" />

            <ol data-jogo-lances className="jogo-lances mt-12 border-t border-white/10">
              {manifesto.lances.map((l) => (
                <li
                  key={l.minuto}
                  data-lance
                  data-minuto={l.minuto}
                  data-tamanho={l.texto.length <= 12 ? "curto" : l.texto.length <= 32 ? "medio" : "longo"}
                  className="jogo-lance flex items-baseline gap-5 border-b border-white/10 py-4"
                >
                  <span className="jogo-minuto font-expanded w-9 shrink-0 text-sm font-bold text-laranja">{l.minuto}</span>
                  <span className="jogo-texto font-expanded text-[clamp(1.2rem,3vw,2rem)] font-bold uppercase leading-tight text-white">
                    {l.texto}
                  </span>
                </li>
              ))}
            </ol>

            <ol aria-hidden="true" className="jogo-sumula">
              {manifesto.lances.map((l) => (
                <li key={l.minuto} data-sumula-item className="flex items-center gap-2 text-sm text-mute lg:gap-3">
                  <span className="size-1.5 shrink-0 rounded-full bg-laranja" />
                  <span className="font-expanded text-xs font-bold text-fog">{l.minuto}</span>
                  <span className="jogo-sumula-texto">{l.texto.length > 24 ? `${l.texto.slice(0, 22).trim()}…` : l.texto}</span>
                </li>
              ))}
            </ol>
          </div>

          <div data-jogo-verso className="jogo-verso bg-laranja text-ink">
            <div className="container-site flex h-full flex-col justify-center py-24">
              <Placar casa={manifesto.placar.placarVirada} fora={total} legenda="Virada" verso />
              <p className="font-expanded mt-10 text-[clamp(2.4rem,10.5vw,7.4rem)] font-black uppercase leading-[0.92] tracking-tight md:mt-14">
                {palavras.map((p, i) => (
                  <span key={i}>
                    <span className="inline-block overflow-hidden pb-[0.05em] align-bottom">
                      <span data-virada-palavra className="inline-block">
                        {p}
                      </span>
                    </span>
                    {i < palavras.length - 1 ? " " : ""}
                  </span>
                ))}
              </p>
              <a
                href="#comofunciona"
                data-virada-link
                className="mt-10 inline-flex w-fit items-center gap-2 border-b-2 border-ink pb-1 font-semibold transition hover:gap-3"
              >
                {manifesto.viradaLink} <Seta className="size-4 rotate-90" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
