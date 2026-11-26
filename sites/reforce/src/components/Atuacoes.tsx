import { atuacoes } from "@/content/site";
import { Kicker, SetaDiagonal, TituloSecao } from "./ui";

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

// Abas acessíveis (setas do teclado trocam a aba; ver lib/interacoes.ts). Sem JavaScript, todos os
// painéis aparecem (regra no <noscript>).
export function Atuacoes() {
  const { lista } = atuacoes;
  return (
    <section id="atuacao" className="relative bg-fundo py-24 md:py-32">
      <div className="container-site">
        <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <Kicker>Atuação</Kicker>
            <TituloSecao className="mt-6">{atuacoes.titulo}</TituloSecao>
          </div>
          <p data-reveal className="max-w-md text-lg leading-relaxed text-mute">
            {atuacoes.texto}
          </p>
        </div>

        <div data-abas className="mt-14 grid gap-6 lg:grid-cols-[minmax(0,22rem)_1fr] lg:gap-10">
          <div role="tablist" aria-label="Atuações" aria-orientation="vertical" className="flex flex-col gap-2">
            {lista.map((a, i) => (
              <button
                key={a.id}
                type="button"
                role="tab"
                id={`aba-${a.id}`}
                aria-controls={`painel-${a.id}`}
                aria-selected={i === 0}
                tabIndex={i === 0 ? 0 : -1}
                className="aba group relative flex items-center gap-4 overflow-hidden rounded-2xl border border-white/[0.07] px-4 py-4 text-left text-mute transition-colors duration-300 hover:text-white"
              >
                <span className="aba-numero font-display grid size-10 shrink-0 place-items-center rounded-full bg-white/[0.06] text-sm font-semibold tabular-nums transition-colors duration-300">
                  {i + 1}
                </span>
                <span className="font-display flex-1 text-[1.05rem] font-medium">{a.titulo}</span>
                <Icone id={a.id} className="size-6 shrink-0 text-menta/80" />
                <span className="aba-barra bg-degrade absolute inset-x-0 bottom-0 h-0.5 origin-left scale-x-0 transition-transform duration-500" aria-hidden="true" />
              </button>
            ))}
          </div>

          <div className="cartao relative overflow-hidden p-6 sm:p-9">
            <span className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-menta/10 blur-3xl" aria-hidden="true" />
            {lista.map((a, i) => (
              <div
                key={a.id}
                id={`painel-${a.id}`}
                role="tabpanel"
                aria-labelledby={`aba-${a.id}`}
                tabIndex={0}
                hidden={i !== 0}
                className="painel-aba relative"
              >
                <div className="flex items-start gap-5">
                  <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-verde/15 text-menta ring-1 ring-menta/25">
                    <Icone id={a.id} className="size-7" />
                  </span>
                  <div>
                    <p className="font-display text-xs font-semibold uppercase tracking-[0.16em] text-menta">Atuação {i + 1}</p>
                    <h3 className="font-display mt-1 text-[clamp(1.6rem,3vw,2.3rem)] font-medium leading-tight text-white">{a.titulo}</h3>
                  </div>
                </div>
                <p className="mt-6 max-w-2xl text-lg leading-relaxed text-nevoa/90">{a.texto}</p>

                <ul className="mt-6 flex flex-wrap gap-2" aria-label="Entregas">
                  {a.entregas.map((e) => (
                    <li key={e} className="rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-1.5 text-sm text-nevoa">
                      {e}
                    </li>
                  ))}
                </ul>

                <h4 className="font-display mt-10 text-sm font-semibold uppercase tracking-[0.14em] text-mute">{a.fluxoTitulo}</h4>
                <ol className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {a.fluxo.map((f, j) => (
                    <li key={f.titulo} className="relative rounded-2xl border border-white/[0.07] bg-abismo/50 p-5">
                      <span className="font-display texto-degrade text-3xl font-semibold">0{j + 1}</span>
                      <p className="font-display mt-3 font-semibold text-white">{f.titulo}</p>
                      <p className="mt-2 text-sm leading-relaxed text-mute">{f.texto}</p>
                      {j < a.fluxo.length - 1 && (
                        <span className="absolute -right-3 top-8 z-10 hidden size-6 place-items-center rounded-full bg-fundo text-menta xl:grid" aria-hidden="true">
                          <SetaDiagonal className="size-3 -rotate-45" />
                        </span>
                      )}
                    </li>
                  ))}
                </ol>

                {a.prova && (
                  <a href={a.prova.href} className="group mt-8 inline-flex items-center gap-3 text-sm font-medium text-white">
                    <span className="selo-seta size-8">
                      <SetaDiagonal className="size-3.5" />
                    </span>
                    <span className="border-b border-white/20 pb-0.5 transition group-hover:border-menta">{a.prova.texto}</span>
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
