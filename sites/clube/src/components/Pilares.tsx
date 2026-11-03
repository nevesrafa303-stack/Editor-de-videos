import { pilares } from "@/content/site";
import { Cabecalho } from "./Cabecalho";
import { Simbolo } from "./Logo";

// Os 5 pilares num acordeão. Desktop: a seção fixa e cinco colunas; a rolagem (ou o mouse) abre uma coluna
// de cada vez. Celular: lista em que o item no meio da tela se abre (data-pilares em src/lib/motion.ts).
// Sem animação, todos ficam abertos.
export function Pilares() {
  return (
    <section id="pilares" data-pilares aria-labelledby="pilares-titulo" className="relative bg-ink">
      <div data-pilares-espaco>
        <div data-pilares-palco className="py-24 md:py-32 lg:flex lg:min-h-[100svh] lg:flex-col lg:justify-center lg:py-20">
          <div className="container-site">
            <Cabecalho id="pilares-titulo" titulo={pilares.titulo} intro={pilares.intro} />

            <ol data-pilares-lista className="mt-12 grid gap-3 md:mt-14">
              {pilares.itens.map((p, i) => (
                <li
                  key={p.nome}
                  data-pilar-painel
                  data-cursor="Abrir"
                  className="group relative overflow-hidden rounded-[26px] border border-white/10 bg-graphite transition-colors data-[ativo=true]:border-ouro/40 data-[ativo=true]:bg-[#1c1813]"
                >
                  <button
                    type="button"
                    data-pilar-botao
                    aria-expanded="true"
                    className="flex w-full items-start justify-between gap-4 p-6 text-left md:p-8"
                  >
                    <span className="flex flex-col gap-3">
                      <span className="font-expanded text-sm font-bold text-ouro">{String(i + 1).padStart(2, "0")}</span>
                      <span className="pilar-titulo font-expanded text-xl font-bold uppercase leading-tight text-white transition-opacity duration-300 md:text-2xl">
                        {p.nome}
                      </span>
                    </span>
                    <Simbolo
                      id={`pilar-simbolo-${i}`}
                      className="size-7 shrink-0 opacity-40 transition duration-500 group-data-[ativo=true]:rotate-90 group-data-[ativo=true]:opacity-100"
                    />
                  </button>
                  <span aria-hidden="true" className="pilar-vertical font-expanded text-lg font-bold uppercase tracking-wide text-fog/80">
                    {p.nome}
                  </span>
                  <div className="pilar-corpo">
                    <div>
                      <div className="pilar-texto px-6 pb-7 md:px-8 md:pb-9">
                        <h3 className="font-expanded text-[clamp(1.3rem,2.4vw,2rem)] font-bold uppercase leading-[1.05] tracking-tight text-white">
                          {p.titulo}
                        </h3>
                        <p className="mt-4 max-w-xl leading-relaxed text-mute md:text-lg">{p.texto}</p>
                      </div>
                    </div>
                  </div>
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute -bottom-10 -right-6 hidden font-expanded text-[11rem] font-black leading-none text-white/[0.04] opacity-0 transition-opacity duration-700 before:content-[attr(data-numero)] group-data-[ativo=true]:opacity-100 lg:block"
                    data-numero={String(i + 1).padStart(2, "0")}
                  />
                </li>
              ))}
            </ol>
            <div aria-hidden="true" className="mx-auto mt-8 hidden max-w-xs items-center gap-4 lg:flex">
              <span className="font-expanded text-sm font-bold text-white">
                <span data-pilar-atual>01</span>
                <span className="text-mute"> / {String(pilares.itens.length).padStart(2, "0")}</span>
              </span>
              <span className="h-px flex-1 overflow-hidden bg-white/15">
                <span data-pilares-progresso className="bg-ouro block h-full w-full origin-left" style={{ transform: "scaleX(0.2)" }} />
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
