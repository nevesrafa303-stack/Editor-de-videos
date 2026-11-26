import { metodo } from "@/content/site";
import { TextoFundo } from "./TextoFundo";
import { Kicker, TituloSecao, vars } from "./ui";

// Jornada da execução. No desktop a seção fixa: a linha em degradê atravessa a tela e cada fase sobe
// girando quando a linha chega nela; o número grande acompanha a fase. No celular, a linha desce.
export function Metodo() {
  return (
    <section id="metodo" data-metodo className="relative overflow-hidden bg-papel py-24 text-tinta lg:flex lg:min-h-[100svh] lg:items-center lg:py-16">
      <TextoFundo texto="Jornada da execução" direcao="direita" escuro className="top-6" />
      <div className="container-site relative w-full">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-3xl">
            <Kicker className="!text-[#066b5b]">{metodo.kicker}</Kicker>
            <TituloSecao className="mt-6 !text-tinta">{metodo.titulo}</TituloSecao>
          </div>
          <p className="font-display hidden items-baseline gap-2 text-tinta/75 lg:flex" aria-hidden="true">
            Fase
            <span data-metodo-numero className="texto-degrade text-[clamp(4rem,8vw,7rem)] font-bold leading-none tabular-nums">
              01
            </span>
            <span className="text-2xl">/ 04</span>
          </p>
        </div>

        <ol className="relative mt-14 grid gap-10 pl-10 [perspective:1000px] lg:grid-cols-4 lg:gap-6 lg:pl-0 lg:pt-16">
          <span aria-hidden="true" className="absolute bottom-2 left-3 top-2 w-0.5 bg-tinta/10 lg:inset-x-0 lg:bottom-auto lg:left-0 lg:top-5 lg:h-0.5 lg:w-auto">
            <span data-metodo-linha className="bg-degrade absolute inset-0 origin-top lg:origin-left" />
          </span>
          {metodo.fases.map((f, i) => (
            <li key={f.titulo} data-fase className="group relative" style={vars({ "--i": i })}>
              <span
                aria-hidden="true"
                className="absolute -left-10 top-0 grid size-7 place-items-center rounded-full border-2 border-tinta/15 bg-papel transition-[background-color,border-color,scale] duration-500 group-data-[ativa=true]:scale-125 group-data-[ativa=true]:border-verde group-data-[ativa=true]:bg-verde lg:-top-[3.75rem] lg:left-0 lg:size-8"
              >
                <span className="size-2 rounded-full bg-tinta/30 transition-colors duration-500 group-data-[ativa=true]:bg-white" />
              </span>
              <div
                data-fase-cartao
                className="relative overflow-hidden rounded-[1.75rem] bg-tinta p-6 text-nevoa shadow-[0_30px_60px_-35px_rgb(4_37_42/0.6)] transition-shadow duration-700 lg:flex lg:min-h-[15rem] lg:flex-col group-data-[ativa=true]:shadow-[0_40px_80px_-30px_rgb(0_189_161/0.45)]"
              >
                <span className="font-display pointer-events-none absolute -right-2 -top-4 text-[6rem] font-bold leading-none text-white/[0.05]" aria-hidden="true">
                  {i + 1}
                </span>
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
                <span className="barra-marca mt-auto block origin-left scale-x-[0.3] transition-transform duration-700 group-data-[ativa=true]:scale-x-100" aria-hidden="true" />
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
