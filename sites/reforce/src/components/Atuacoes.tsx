import { atuacoes } from "@/content/site";
import { SetasCarrossel } from "./Setores";
import { TextoFundo } from "./TextoFundo";
import { Kicker, SetaDiagonal, TituloSecao, vars } from "./ui";

// Ícones de linha das cinco atuações (mesmo traço dos ícones da apresentação).
const icones: Record<string, React.ReactNode> = {
  projetos: <path d="M4 20V14m5 6V10m5 10v-7m5 7V6M3 9l5-4 5 3 7-5m0 0h-4m4 0v4" />,
  paradas: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7v5l3.5 3.5" />
    </>
  ),
  materiais: (
    <>
      <path d="M9 4h6v3H9zM7 5.5H5v15h8" />
      <path d="M7.5 10h6M7.5 13.5h3M14 13l4-2 4 2v4.5l-4 2-4-2z M14 13l4 2 4-2M18 15v4.5" />
    </>
  ),
  contratos: (
    <>
      <circle cx="12" cy="7" r="3" />
      <circle cx="5.5" cy="10" r="2.2" />
      <circle cx="18.5" cy="10" r="2.2" />
      <path d="M6.5 20v-2.5a5.5 5.5 0 0 1 11 0V20M2 19v-1.5A3.5 3.5 0 0 1 5.5 14M22 19v-1.5a3.5 3.5 0 0 0-3.5-3.5" />
    </>
  ),
  fiscalizacao: (
    <>
      <circle cx="11" cy="13" r="8" />
      <circle cx="11" cy="13" r="4.2" />
      <circle cx="11" cy="13" r="1" />
      <path d="M11 13 20 4m0 0h-3.5M20 4v3.5" />
    </>
  ),
};

export function Icone({ id, className = "size-7" }: { id: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      {icones[id]}
    </svg>
  );
}

// Carrossel das cinco atuações. No desktop a seção fixa e cada atuação desliza para o lado conforme a
// página desce (lib/motion.ts); os botões da esquerda pulam para a atuação. No celular e no tablet é um
// trilho de arrastar (dedo, mouse ou setas). Sem JavaScript, todas aparecem no trilho.
export function Atuacoes() {
  const { lista } = atuacoes;
  return (
    <section id="atuacao" data-atuacoes data-carrossel className="relative overflow-hidden bg-fundo py-24 lg:flex lg:min-h-[100svh] lg:items-center lg:py-10">
      <TextoFundo texto="Planejamento · Paradas · Materiais · Contratos · Campo" className="bottom-4 opacity-80" />
      <div className="container-site relative grid gap-10 lg:grid-cols-[minmax(0,18.5rem)_minmax(0,1fr)] lg:items-center lg:gap-12">
        <div className="min-w-0">
          <Kicker>Atuação</Kicker>
          <TituloSecao className="mt-5 lg:!text-[clamp(2rem,3.2vw,3rem)]">{atuacoes.titulo}</TituloSecao>
          <p data-reveal className="mt-4 text-lg leading-relaxed text-mute lg:text-base">
            {atuacoes.texto}
          </p>
          <div
            role="group"
            aria-label="Escolha a atuação"
            className="trilho -mx-5 mt-8 flex gap-2 overflow-x-auto px-5 pb-1 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0"
          >
            {lista.map((a, i) => (
              <button
                key={a.id}
                type="button"
                data-carrossel-ir={i}
                aria-controls={`atuacao-${a.id}`}
                aria-current={i === 0}
                className="aba group relative flex shrink-0 items-center gap-3 overflow-hidden rounded-2xl border border-white/[0.07] px-3.5 py-3 text-left text-mute transition-colors duration-300 hover:text-white lg:w-full lg:gap-4 lg:px-4"
              >
                <span className="aba-numero font-display grid size-9 shrink-0 place-items-center rounded-full bg-white/[0.06] text-sm font-semibold tabular-nums transition-colors duration-300">
                  {i + 1}
                </span>
                <span className="font-display flex-1 whitespace-nowrap text-[0.98rem] font-medium">{a.titulo}</span>
                <Icone id={a.id} className="hidden size-6 shrink-0 text-menta/80 lg:block" />
                <span className="aba-barra bg-degrade absolute inset-x-0 bottom-0 h-0.5 origin-left scale-x-0 transition-transform duration-500" aria-hidden="true" />
              </button>
            ))}
          </div>
        </div>

        <div className="relative min-w-0 lg:[clip-path:inset(-30%_-100vw_-30%_0)]">
          <div
            data-carrossel-trilho
            data-arrastar
            className="trilho relative -mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-2 sm:gap-6 lg:mx-0 lg:gap-8 lg:px-0"
          >
            {lista.map((a, i) => (
              <article
                key={a.id}
                id={`atuacao-${a.id}`}
                data-slide
                aria-roledescription="slide"
                aria-label={`${i + 1} de ${lista.length}: ${a.titulo}`}
                className="cartao relative w-[86vw] shrink-0 snap-center overflow-hidden p-5 sm:w-[72vw] sm:p-8 lg:w-full lg:p-9"
              >
                <span className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-menta/10 blur-3xl" aria-hidden="true" />
                <span className="font-display pointer-events-none absolute -bottom-6 right-4 text-[8rem] font-bold leading-none text-white/[0.04]" aria-hidden="true">
                  0{i + 1}
                </span>
                <div className="relative flex items-start gap-5">
                  <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-verde/15 text-menta ring-1 ring-menta/25">
                    <Icone id={a.id} className="size-7" />
                  </span>
                  <div>
                    <p className="font-display text-xs font-semibold uppercase tracking-[0.16em] text-menta">Atuação {i + 1}</p>
                    <h3 className="font-display mt-1 text-[clamp(1.5rem,2.8vw,2.2rem)] font-medium leading-tight text-white">{a.titulo}</h3>
                  </div>
                </div>
                <p className="relative mt-4 max-w-2xl text-[0.95rem] leading-relaxed text-nevoa/90 sm:mt-5 sm:text-[1.05rem]">{a.texto}</p>

                <ul className="relative mt-5 hidden flex-wrap gap-2 sm:flex" aria-label="Entregas">
                  {a.entregas.map((e, j) => (
                    <li key={e} data-fluxo-item style={vars({ "--i": j })} className="rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-1.5 text-sm text-nevoa">
                      {e}
                    </li>
                  ))}
                </ul>

                <h4 className="font-display relative mt-8 text-sm font-semibold uppercase tracking-[0.14em] text-mute">{a.fluxoTitulo}</h4>
                <ol className="relative mt-4 grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
                  {a.fluxo.map((f, j) => (
                    <li key={f.titulo} data-fluxo-item style={vars({ "--i": j + 3 })} className="relative rounded-2xl border border-white/[0.07] bg-abismo/50 p-3 sm:p-4">
                      <span className="font-display texto-degrade text-2xl font-semibold">0{j + 1}</span>
                      <p className="font-display mt-2 text-[0.95rem] font-semibold leading-snug text-white">{f.titulo}</p>
                      <p className="mt-1.5 hidden text-[0.82rem] leading-relaxed text-mute lg:block">{f.texto}</p>
                    </li>
                  ))}
                </ol>

                {a.prova && (
                  <a href={a.prova.href} className="group/prova relative mt-6 inline-flex items-center gap-3 text-sm font-medium text-white">
                    <span className="selo-seta size-8">
                      <SetaDiagonal className="size-3.5" />
                    </span>
                    <span className="border-b border-white/20 pb-0.5 transition group-hover/prova:border-menta">{a.prova.texto}</span>
                  </a>
                )}
              </article>
            ))}
          </div>
          <SetasCarrossel total={lista.length} rotulo="atuação" className="mt-6 justify-between lg:justify-end" />
        </div>
      </div>
    </section>
  );
}
