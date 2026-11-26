import Image from "next/image";
import { setores } from "@/content/site";
import { imagens } from "@/lib/imagens";
import { Kicker, TituloSecao } from "./ui";

// Galeria dos setores. No celular é um carrossel com rolagem lateral; no desktop a seção fica fixa e
// os cartões passam da direita para a esquerda conforme a página rola.
export function Setores() {
  return (
    <section id="setores" data-setores className="relative overflow-hidden bg-abismo py-24 lg:py-0">
      <div className="lg:flex lg:h-[100svh] lg:flex-col lg:justify-center">
        <div className="container-site flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-3xl">
            <Kicker>Setores</Kicker>
            <TituloSecao className="mt-6">{setores.titulo}</TituloSecao>
          </div>
          <p className="hidden items-center gap-3 text-sm text-mute lg:flex" aria-hidden="true">
            <span className="tabular-nums" data-setores-contador>
              01
            </span>
            <span className="relative h-px w-24 bg-white/15">
              <span data-setores-barra className="bg-degrade absolute inset-0 origin-left" style={{ transform: "scaleX(0.2)" }} />
            </span>
            0{setores.lista.length}
          </p>
        </div>

        <ul
          data-setores-trilho
          className="trilho mt-12 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-4 md:gap-6 md:px-9 lg:mt-14 lg:snap-none lg:pl-[max(2.25rem,calc((100vw-84rem)/2+2.25rem))]"
        >
          {setores.lista.map((s, i) => (
            <li
              key={s.id}
              data-setor
              className="group relative aspect-[4/5] w-[78vw] shrink-0 snap-center overflow-hidden rounded-[1.75rem] sm:w-[46vw] lg:aspect-[3/4] lg:w-[min(27vw,25rem)]"
            >
              <Image
                src={imagens[`setor-${s.id}`]}
                alt=""
                fill
                sizes="(min-width: 1024px) 27vw, (min-width: 640px) 46vw, 78vw"
                quality={80}
                className="object-cover transition-transform duration-[1.4s] ease-out-expo group-hover:scale-110"
              />
              <span className="absolute inset-0 bg-gradient-to-t from-abismo via-abismo/40 to-transparent" aria-hidden="true" />
              <div className="absolute inset-x-0 bottom-0 p-6">
                <span className="font-display text-sm tabular-nums text-menta">0{i + 1}</span>
                <h3 className="font-display mt-1 text-2xl font-semibold text-white md:text-[1.7rem]">{s.nome}</h3>
                <p className="mt-2 max-w-[22rem] text-sm leading-relaxed text-nevoa/85">{s.texto}</p>
                <span className="barra-marca mt-5 block origin-left scale-x-[0.35] transition-transform duration-700 ease-out-expo group-hover:scale-x-100" aria-hidden="true" />
              </div>
            </li>
          ))}
          <li className="w-1 shrink-0 lg:w-[10vw]" aria-hidden="true" />
        </ul>
        <p className="container-site mt-3 text-xs italic text-mute">Imagens ilustrativas.</p>
      </div>
    </section>
  );
}
