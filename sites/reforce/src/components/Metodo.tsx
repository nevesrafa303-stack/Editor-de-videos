import { metodo } from "@/content/site";
import { Kicker, TituloSecao, vars } from "./ui";

// Jornada da execução: a linha em degradê avança com a rolagem e acende cada fase ao passar por ela.
export function Metodo() {
  return (
    <section id="metodo" data-metodo className="relative overflow-hidden bg-papel py-24 text-tinta md:py-32">
      <div className="container-site">
        <div className="max-w-3xl">
          <Kicker className="!text-[#066b5b]">{metodo.kicker}</Kicker>
          <TituloSecao className="mt-6 !text-tinta">{metodo.titulo}</TituloSecao>
        </div>

        <ol className="relative mt-16 grid gap-10 pl-10 md:grid-cols-4 md:gap-6 md:pl-0 md:pt-16">
          {/* Linha da jornada: vertical no celular, horizontal no desktop. */}
          <span aria-hidden="true" className="absolute bottom-2 left-3 top-2 w-0.5 bg-tinta/10 md:inset-x-0 md:bottom-auto md:left-0 md:top-5 md:h-0.5 md:w-auto">
            <span data-metodo-linha className="bg-degrade absolute inset-0 origin-top md:origin-left" />
          </span>
          {metodo.fases.map((f, i) => (
            <li key={f.titulo} data-fase className="group relative" style={vars({ "--i": i })}>
              <span
                aria-hidden="true"
                className="absolute -left-10 top-0 grid size-7 place-items-center rounded-full border-2 border-tinta/15 bg-papel transition-colors duration-500 group-data-[ativa=true]:border-verde group-data-[ativa=true]:bg-verde md:-top-[3.75rem] md:left-0 md:size-8"
              >
                <span className="size-2 rounded-full bg-tinta/30 transition-colors duration-500 group-data-[ativa=true]:bg-white" />
              </span>
              <div className="rounded-[1.75rem] bg-tinta p-6 text-nevoa shadow-[0_30px_60px_-35px_rgb(4_37_42/0.6)] transition-transform duration-700 ease-out-expo md:min-h-[15rem] md:flex md:flex-col group-data-[ativa=true]:md:-translate-y-2">
                <p className="font-display text-lg font-semibold">
                  <span className="texto-degrade">Fase {i + 1}</span>
                </p>
                <h3 className="font-display mt-3 text-xl font-medium text-white">{f.titulo}</h3>
                <ul className="mb-6 mt-4 flex flex-wrap gap-1.5">
                  {f.itens.map((item) => (
                    <li key={item} className="rounded-full bg-white/[0.07] px-2.5 py-1 text-xs text-nevoa/85">
                      {item}
                    </li>
                  ))}
                </ul>
                <span className="barra-marca mt-6 block md:mt-auto" aria-hidden="true" />
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
