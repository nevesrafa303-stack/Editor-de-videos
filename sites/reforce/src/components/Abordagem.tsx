import { abordagem } from "@/content/site";
import { Kicker, TituloSecao, vars } from "./ui";

const DIAS = 28;

// Cronograma ilustrativo de uma parada em três estados: no modelo tradicional as tarefas escorregam e
// estouram o prazo; com a gestão integrada ficam no plano; no resultado aparecem as rotinas diárias.
// No desktop a seção fica fixa e a rolagem troca os estados; em qualquer tela os botões também trocam.
export function Abordagem() {
  const { estados, tarefas, diasPlano } = abordagem;
  const atrasoFinal = Math.max(...tarefas.map((t) => t.atraso));
  return (
    <section id="abordagem" data-abordagem className="relative bg-fundo">
      <div className="container-site grid min-h-[100svh] items-center gap-12 py-24 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16 lg:py-20">
        <div>
          <Kicker>{abordagem.kicker}</Kicker>
          <TituloSecao className="mt-5 lg:!text-[clamp(2rem,3vw,2.9rem)]">{abordagem.titulo}</TituloSecao>
          <p data-reveal className="mt-5 max-w-xl text-lg leading-relaxed text-mute lg:text-base">
            {abordagem.texto}
          </p>

          <div role="group" aria-label="Comparar modelos" className="mt-8 grid gap-2.5">
            {estados.map((e, i) => (
              <button
                key={e.id}
                type="button"
                data-estado-botao={e.id}
                aria-current={e.id === "reforce" ? "true" : "false"}
                className="estado-card group relative flex items-center gap-5 overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02] px-5 py-3.5 text-left transition-colors duration-500 hover:border-white/20"
              >
                <span className="estado-luz bg-degrade absolute inset-y-0 left-0 w-1 opacity-0 transition-opacity duration-500" aria-hidden="true" />
                <span className="font-display w-6 text-sm tabular-nums text-mute">0{i + 1}</span>
                <span className="flex-1">
                  <span className="font-display block text-base font-semibold text-white">{e.rotulo}</span>
                  <span className="mt-0.5 block text-sm text-mute">{e.texto}</span>
                </span>
                <span
                  className={`font-display hidden rounded-full px-3 py-1 text-xs font-semibold sm:block ${
                    e.id === "tradicional" ? "bg-laranja/15 text-laranja" : "bg-menta/15 text-menta"
                  }`}
                >
                  {e.resultado}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div data-reveal className="cartao relative p-5 sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="font-display text-sm font-semibold uppercase tracking-[0.14em] text-nevoa">Cronograma da parada</p>
            <p className="text-xs italic text-mute">ilustração</p>
          </div>

          <div data-gantt data-estado="reforce" className="gantt mt-6" style={vars({ "--dias": DIAS, "--prazo": diasPlano })}>
            {/* Régua de dias */}
            <div className="relative ml-[38%] h-6 text-[0.65rem] tabular-nums text-mute sm:ml-[34%]" aria-hidden="true">
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
              {/* Marco do prazo */}
              <li aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-[38%] right-0 sm:left-[34%]">
                <span className="gantt-prazo absolute -top-2 bottom-0 w-px bg-white/40">
                  <span className="font-display absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-white px-1.5 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider text-abismo">
                    Prazo
                  </span>
                </span>
              </li>
              {tarefas.map((t, i) => (
                <li key={t.nome} className="flex h-12 items-center border-t border-white/[0.06]">
                  <span className="w-[38%] pr-3 text-[0.78rem] leading-tight text-nevoa sm:w-[34%] sm:text-sm">{t.nome}</span>
                  <span className="relative h-full flex-1">
                    <span
                      className="gantt-barra"
                      style={vars({ "--ini": t.inicio, "--dur": t.duracao, "--atraso": t.atraso, "--i": i })}
                    >
                      <span className="gantt-alerta absolute -top-2 -right-1 grid size-4 translate-x-full place-items-center rounded-full bg-laranja text-[0.6rem] font-bold text-abismo" style={vars({ "--i": i })} aria-hidden="true">
                        !
                      </span>
                      <span className="gantt-check absolute -right-2 top-1/2 grid size-4 -translate-y-1/2 translate-x-full place-items-center rounded-full bg-menta text-abismo" style={vars({ "--i": i })} aria-hidden="true">
                        <svg viewBox="0 0 12 12" className="size-2.5" fill="none">
                          <path d="M2.5 6.2 5 8.5l4.5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                    </span>
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-6 grid gap-3 border-t border-white/[0.08] pt-5 sm:grid-cols-3" aria-live="polite">
              <div>
                <p className="text-xs uppercase tracking-wider text-mute">Desvio no prazo</p>
                <p className="font-display mt-1 text-2xl font-semibold">
                  <span data-mostra="tradicional" className="text-laranja">
                    +{atrasoFinal} dias
                  </span>
                  <span data-mostra="reforce resultado" className="text-menta">
                    No prazo
                  </span>
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-mute">Leitura</p>
                <p className="font-display mt-1 text-2xl font-semibold text-white">
                  {estados.map((e) => (
                    <span key={e.id} data-mostra={e.id}>
                      {e.resultado}
                    </span>
                  ))}
                </p>
              </div>
              <div>
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
    </section>
  );
}
