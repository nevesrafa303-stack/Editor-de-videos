import Image from "next/image";
import { numeros } from "@/content/site";
import plateia from "@/assets/img/plateia-evento.webp";
import brilho from "@/assets/img/fundo-brilho-laranja.webp";

const formatar = (n: number) => n.toLocaleString("pt-BR");

export function Numeros() {
  return (
    <section aria-labelledby="numeros-titulo" className="relative isolate overflow-hidden py-24 md:py-36">
      <div aria-hidden="true" className="absolute inset-0 -z-10">
        <Image
          src={plateia}
          alt=""
          fill
          sizes="100vw"
          data-parallax="-12"
          className="scale-110 object-cover object-top opacity-35"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-ink via-ink/75 to-ink" />
        <Image
          src={brilho}
          alt=""
          data-glow
          sizes="100vw"
          className="absolute inset-x-0 bottom-[-35%] h-auto w-full rotate-180 opacity-60 mix-blend-screen"
        />
      </div>

      <div className="container-site">
        <h2
          id="numeros-titulo"
          data-split
          className="font-expanded max-w-[14ch] text-[clamp(2.1rem,7vw,5.4rem)] font-bold uppercase leading-[0.95] tracking-tight text-white"
        >
          {numeros.titulo} <span className="text-laranja">{numeros.destaque}</span>
        </h2>

        <dl data-reveal="stagger" className="mt-14 grid grid-cols-2 gap-px border-y border-white/15 bg-white/15 md:mt-20 lg:grid-cols-4">
          {numeros.itens.map((n) => (
            <div key={n.rotulo} className="flex flex-col justify-between gap-6 bg-ink py-7 pr-4 even:pl-5 md:gap-10 md:py-10 md:pr-8 md:even:pl-8 lg:pl-8 lg:first:pl-0">
              <dt className="order-2 max-w-[14rem] text-sm leading-snug text-mute md:text-base">{n.rotulo}</dt>
              <dd className="order-1 font-expanded flex items-start font-bold leading-[0.85] tracking-tight text-white">
                {n.prefixo && <span className="mr-1 mt-[0.3em] text-[clamp(0.9rem,3.2vw,1.6rem)] text-mute">{n.prefixo}</span>}
                <span data-count={n.valor} className="text-[clamp(2.7rem,12vw,6.2rem)] lg:text-[clamp(3.6rem,6vw,6.2rem)]">
                  {formatar(n.valor)}
                </span>
                <span className="ml-1 mt-[0.15em] text-[clamp(1rem,3.8vw,2rem)] text-laranja">{n.unidade}</span>
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
