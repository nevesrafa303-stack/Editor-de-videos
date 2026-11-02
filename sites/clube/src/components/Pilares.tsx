import { pilares } from "@/content/site";
import { Simbolo } from "./Logo";
import { vars } from "./ui";

// Os 5 pilares em cartões que empilham: cada um gruda no topo e o próximo cobre o anterior, que encolhe
// e escurece (data-pilar em src/lib/motion.ts). No desktop o título fica fixo ao lado com o contador.
export function Pilares() {
  const total = pilares.itens.length;
  return (
    <section id="pilares" aria-labelledby="pilares-titulo" className="relative py-24 md:py-36">
      <div className="container-site grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <h2
            id="pilares-titulo"
            data-split
            className="font-expanded text-[clamp(1.9rem,4.2vw,3.6rem)] font-bold uppercase leading-[0.98] tracking-tight text-white"
          >
            {pilares.titulo}
          </h2>
          <p data-reveal className="mt-6 max-w-md leading-relaxed text-mute md:text-lg">
            {pilares.intro}
          </p>
          <div aria-hidden="true" className="mt-10 hidden items-center gap-4 lg:flex">
            <p className="font-expanded text-sm font-bold text-white">
              <span data-pilar-atual>01</span>
              <span className="text-mute"> / {String(total).padStart(2, "0")}</span>
            </p>
            <span className="h-px flex-1 overflow-hidden bg-white/15">
              <span data-pilares-progresso className="bg-ouro block h-full w-full origin-left" style={{ transform: "scaleX(0.2)" }} />
            </span>
          </div>
        </div>

        <ol className="grid gap-5">
          {pilares.itens.map((p, i) => (
            <li key={p.nome} data-pilar className="pilar" style={vars({ "--i": i })}>
              <article
                data-pilar-cartao
                className="relative flex min-h-[21rem] origin-top flex-col overflow-hidden rounded-[28px] border border-white/10 bg-graphite p-7 shadow-[0_-24px_60px_-24px_rgba(0,0,0,0.9)] md:min-h-[24rem] md:p-10"
              >
                <div className="flex items-start justify-between gap-4">
                  <span className="inline-flex items-center gap-2.5 rounded-full border border-ouro/30 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-ouro">
                    <Simbolo id={`pilar-simbolo-${i}`} className="size-3.5" />
                    {p.nome}
                  </span>
                  {/* Número decorativo desenhado pelo CSS (content): não é texto lido nem medido como texto. */}
                  <span
                    data-numero={String(i + 1).padStart(2, "0")}
                    className="font-expanded text-6xl font-black leading-none text-white/[0.07] before:content-[attr(data-numero)] md:text-8xl"
                    aria-hidden="true"
                  />
                </div>
                <h3 className="font-expanded mt-auto pt-10 text-[clamp(1.35rem,2.6vw,2.2rem)] font-bold uppercase leading-[1.04] tracking-tight text-white">
                  {p.titulo}
                </h3>
                <p className="mt-4 max-w-xl leading-relaxed text-mute md:text-lg">{p.texto}</p>
                <span data-pilar-sombra aria-hidden="true" className="pointer-events-none absolute inset-0 bg-ink opacity-0" />
              </article>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
