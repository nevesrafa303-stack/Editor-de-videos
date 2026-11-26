import { valores } from "@/content/site";
import { MARCA_R, MARCA_VIEWBOX } from "@/lib/logo-paths";
import { Kicker, TituloSecao } from "./ui";

export function Valores() {
  return (
    <section id="valores" className="relative overflow-hidden bg-papel py-24 text-tinta md:py-32">
      <svg data-valores-r viewBox={MARCA_VIEWBOX} aria-hidden="true" className="pointer-events-none absolute -bottom-24 -left-32 w-[34rem] opacity-[0.08] lg:-left-20 lg:w-[42rem]">
        <path d={MARCA_R} fill="none" stroke="#04252a" strokeWidth="0.5" fillRule="evenodd" />
      </svg>
      <div className="container-site relative grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="lg:sticky lg:top-32 lg:self-start">
          <Kicker className="!text-[#066b5b]">Valores</Kicker>
          <TituloSecao className="mt-6 !text-tinta">{valores.titulo}</TituloSecao>
          <p data-reveal className="font-display mt-6 max-w-md text-xl font-light leading-relaxed text-tinta/80">
            {valores.texto}
          </p>
        </div>
        <ol className="relative">
          <span className="absolute inset-x-0 top-0 h-px bg-tinta/15" aria-hidden="true" />
          {valores.lista.map((v, i) => (
            <li key={v.titulo} data-valor-linha className="group relative grid grid-cols-[3.5rem_1fr] items-baseline gap-4 py-7 sm:grid-cols-[5rem_1fr]">
              <span data-valor-borda className="bg-degrade absolute inset-x-0 bottom-0 h-px origin-left" aria-hidden="true" />
              <span data-valor-num className="font-display text-4xl font-light tabular-nums text-tinta/60 transition-colors duration-500 group-hover:text-[#0a8a74] sm:text-5xl">
                0{i + 1}
              </span>
              <div data-valor-texto>
                <h3 className="font-display text-lg font-semibold uppercase tracking-[0.08em] text-[#066b5b] sm:text-xl">{v.titulo}</h3>
                <p className="mt-1.5 text-[1.05rem] leading-relaxed text-tinta/80">{v.texto}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
