import { diferenciais } from "@/content/site";
import { BotaoMarca, Kicker, SeloSeta, TituloSecao } from "./ui";

export function Diferenciais() {
  return (
    <section id="diferenciais" className="relative grid bg-fundo lg:grid-cols-[0.8fr_1.2fr]">
      <div className="relative bg-papel px-5 py-20 text-tinta md:px-9 lg:py-32 lg:pl-[max(2.25rem,calc((100vw-84rem)/2+2.25rem))] lg:pr-14">
        <div className="lg:sticky lg:top-32">
          <Kicker className="!text-[#066b5b]">{diferenciais.kicker}</Kicker>
          <TituloSecao className="mt-6 !text-tinta">Nossos diferenciais</TituloSecao>
          <p data-reveal className="font-display mt-6 text-xl font-light text-tinta/80">
            {diferenciais.titulo}
          </p>
          <span className="barra-marca mt-8 block w-48" aria-hidden="true" />
          <BotaoMarca className="mt-10">Quero uma proposta</BotaoMarca>
        </div>
      </div>
      <ul className="grid content-center gap-4 overflow-x-clip px-5 py-20 md:px-9 lg:py-32 lg:pr-[max(2.25rem,calc((100vw-84rem)/2+2.25rem))] lg:pl-14">
        {diferenciais.lista.map((d) => (
          <li key={d.titulo} data-diferencial className="cartao lanterna group flex items-center gap-6 p-6 sm:p-8">
            <SeloSeta className="size-16 transition-transform duration-500 ease-out-expo group-hover:-rotate-45 sm:size-20" />
            <p className="text-[1.05rem] leading-relaxed text-nevoa/90">
              <strong className="font-display block text-xl font-semibold text-white">{d.titulo}</strong>
              {d.texto}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
