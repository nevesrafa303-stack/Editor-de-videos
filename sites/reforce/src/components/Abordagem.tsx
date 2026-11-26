import { abordagem } from "@/content/site";
import { Kicker, TituloSecao, vars } from "./ui";

const DIAS = 28;

// Cronograma ilustrativo de uma parada em três estados. O cronograma fica fixo (sticky) enquanto os três
// passos rolam ao lado (no celular, por baixo dele); cada passo que chega troca o estado: no modelo
// tradicional as tarefas escorregam e estouram o prazo; com a Reforce ficam no plano; no resultado
// aparecem as rotinas diárias. Os passos também são botões.
export function Abordagem() {
  const { estados, tarefas, diasPlano } = abordagem;
  const atrasoFinal = Math.max(...tarefas.map((t) => t.atraso));
  return (
    <section id="abordagem" data-abordagem className="relative bg-fundo py-24 md:py-32">
      <div className="container-site">
        <div className="max-w-3xl">
          <Kicker>{abordagem.kicker}</Kicker>
          <TituloSecao className="mt-6">{abordagem.titulo}</TituloSecao>
          <p data-reveal className="mt-6 max-w-xl text-lg leading-relaxed text-mute">
            {abordagem.texto}
          </p>
        </div>

        <div className="mt-12 grid gap-6 lg:mt-4 lg:grid-cols-[0.85fr_1.15fr] lg:gap-14">
          {/* Cronograma fixo */}
          <div className="sticky top-16 z-10 -mx-5 bg-fundo/95 px-5 pb-4 pt-3 backdrop-blur-md lg:order-2 lg:mx-0 lg:top-[calc(50svh-18rem)] lg:self-start lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
            <div data-gantt-cartao className="cartao relative p-4 sm:p-7">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="font-display text-xs font-semibold uppercase tracking-[0.14em] text-nevoa sm:text-sm">Cronograma da parada</p>
                <p className="text-xs italic text-mute">ilustração</p>
              </div>

              <div data-gantt data-estado="reforce" className="gantt mt-4 sm:mt-6" style={vars({ "--dias": DIAS, "--prazo": diasPlano })}>
                <div className="relative ml-[36%] h-6 text-[0.65rem] tabular-nums text-mute sm:ml-[34%]" aria-hidden="true">
                  {[0, 7, 14, 21, 28].map((d) => (
                    <span key={d} className="absolute -translate-x-1/2" style={{ left: `${(d / DIAS) * 100}%` }}>
                      D{d}
                    </span>
                  ))}
                  {Array.from({ length: diasPlano }, (_, d) => (
                    <span
                      key={d}
                      className="gantt-rotina absolute top-5 size-1 -translate-x-1/2 rounded-full bg-menta"
                      style={{ left: `${((d + 0.5) / DIAS) * 100}%`, ...vars({ "--i": d }) }}
                    />
                  ))}
                </div>

                <ul className="relative mt-2">
                  <li aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-[36%] right-0 sm:left-[34%]">
                    <span className="gantt-prazo absolute -top-2 bottom-0 w-px bg-white/40">
                      <span className="font-display absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-white px-1.5 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider text-abismo">
                        Prazo
                      </span>
                    </span>
                  </li>
                  {tarefas.map((t, i) => (
                    <li key={t.nome} className="flex h-9 items-center border-t border-white/[0.06] sm:h-12">
                      <span className="w-[36%] pr-3 text-[0.72rem] leading-tight text-nevoa sm:w-[34%] sm:text-sm">{t.nome}</span>
                      <span className="relative h-full flex-1">
                        <span className="gantt-barra" style={vars({ "--ini": t.inicio, "--dur": t.duracao, "--atraso": t.atraso, "--i": i })}>
                          <span
                            className="gantt-alerta absolute -right-1 -top-2 grid size-4 translate-x-full place-items-center rounded-full bg-laranja text-[0.6rem] font-bold text-abismo"
                            style={vars({ "--i": i })}
                            aria-hidden="true"
                          >
                            !
                          </span>
                          <span
                            className="gantt-check absolute -right-2 top-1/2 grid size-4 -translate-y-1/2 translate-x-full place-items-center rounded-full bg-menta text-abismo"
                            style={vars({ "--i": i })}
                            aria-hidden="true"
                          >
                            <svg viewBox="0 0 12 12" className="size-2.5" fill="none">
                              <path d="M2.5 6.2 5 8.5l4.5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </span>
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="mt-4 grid grid-cols-2 gap-3 border-t border-white/[0.08] pt-4 sm:mt-6 sm:grid-cols-3 sm:pt-5" aria-live="polite">
                  <div>
                    <p className="text-[0.65rem] uppercase tracking-wider text-mute sm:text-xs">Desvio no prazo</p>
                    <p className="font-display mt-1 text-lg font-semibold sm:text-2xl">
                      <span data-mostra="tradicional" className="text-laranja">
                        +{atrasoFinal} dias
                      </span>
                      <span data-mostra="reforce resultado" className="text-menta">
                        No prazo
                      </span>
                    </p>
                  </div>
                  <div>
                    <p className="text-[0.65rem] uppercase tracking-wider text-mute sm:text-xs">Leitura</p>
                    <p className="font-display mt-1 text-lg font-semibold leading-tight text-white sm:text-2xl">
                      {estados.map((e) => (
                        <span key={e.id} data-mostra={e.id}>
                          {e.resultado}
                        </span>
                      ))}
                    </p>
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-xs uppercase tracking-wider text-mute">Rotina</p>
                    <p className="mt-1 text-sm leading-snug text-nevoa">
                      <span data-mostra="tradicional">Informação chega tarde, quando o desvio já aconteceu.</span>
                      <span data-mostra="reforce">Plano e campo conectados todos os dias.</span>
                      <span data-mostra="resultado">Check-in e check-out diários: conectar, antecipar, comunicar.</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Passos que rolam e trocam o estado */}
          <ol aria-label="Comparar modelos" className="lg:order-1">
            {estados.map((e, i) => (
              <li key={e.id} data-estado-passo={e.id} className="flex min-h-[62svh] items-center py-6 lg:min-h-[78svh]">
                <button
                  type="button"
                  data-estado-botao={e.id}
                  aria-current={e.id === "reforce" ? "true" : "false"}
                  className="estado-card group relative w-full overflow-hidden rounded-[1.75rem] border border-white/[0.08] bg-white/[0.02] p-6 text-left transition-[border-color,background-color,opacity,scale] duration-500 hover:border-white/20 sm:p-8"
                >
                  <span className="estado-luz bg-degrade absolute inset-y-0 left-0 w-1 opacity-0 transition-opacity duration-500" aria-hidden="true" />
                  <span className="flex items-center justify-between gap-4">
                    <span className="font-display texto-degrade text-5xl font-semibold leading-none sm:text-6xl">0{i + 1}</span>
                    <span
                      className={`font-display rounded-full px-3 py-1 text-xs font-semibold ${
                        e.id === "tradicional" ? "bg-laranja/15 text-laranja" : "bg-menta/15 text-menta"
                      }`}
                    >
                      {e.resultado}
                    </span>
                  </span>
                  <span className="font-display mt-6 block text-2xl font-medium text-white sm:text-3xl">{e.rotulo}</span>
                  <span className="mt-2 block text-mute">{e.texto}</span>
                  <span className="mt-6 grid gap-2.5 border-t border-white/[0.07] pt-5">
                    {e.detalhes.map((d) => (
                      <span key={d} className="flex items-center gap-3 text-sm text-nevoa/90">
                        <span className={`size-1.5 shrink-0 rounded-full ${e.id === "tradicional" ? "bg-laranja" : "bg-menta"}`} aria-hidden="true" />
                        {d}
                      </span>
                    ))}
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
