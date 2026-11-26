import { valores } from "@/content/site";
import { Kicker, TituloSecao } from "./ui";

export function Valores() {
  return (
    <section id="valores" className="relative bg-papel py-24 text-tinta md:py-32">
      <div className="container-site grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="lg:sticky lg:top-32 lg:self-start">
          <Kicker className="!text-[#066b5b]">Valores</Kicker>
          <TituloSecao className="mt-6 !text-tinta">{valores.titulo}</TituloSecao>
          <p data-reveal className="font-display mt-6 max-w-md text-xl font-light leading-relaxed text-tinta/80">
            {valores.texto}
          </p>
        </div>
        <ol data-reveal="stagger" className="border-t border-tinta/15">
          {valores.lista.map((v, i) => (
            <li key={v.titulo} className="group grid grid-cols-[3.5rem_1fr] items-baseline gap-4 border-b border-tinta/15 py-7 sm:grid-cols-[5rem_1fr]">
              <span className="font-display text-4xl font-light tabular-nums text-tinta/30 transition-colors duration-500 group-hover:text-[#0a8a74] sm:text-5xl">
                0{i + 1}
              </span>
              <div>
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
