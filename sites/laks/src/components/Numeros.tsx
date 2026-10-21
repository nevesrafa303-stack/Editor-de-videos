import Image from "next/image";
import { numeros } from "@/content/site";
import plateia from "@/assets/img/plateia-evento.webp";
import brilho from "@/assets/img/fundo-brilho-laranja.webp";
import { Eyebrow } from "./ui";

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
          className="scale-110 object-cover object-top opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-ink via-ink/70 to-ink" />
        <Image
          src={brilho}
          alt=""
          data-glow
          sizes="100vw"
          className="absolute inset-x-0 bottom-[-35%] h-auto w-full rotate-180 opacity-70 mix-blend-screen"
        />
      </div>

      <div className="container-site">
        <div data-reveal className="max-w-3xl">
          <Eyebrow numero="01">Em números</Eyebrow>
          <h2 id="numeros-titulo" className="font-expanded mt-6 text-[clamp(1.9rem,4.4vw,3.8rem)] font-bold uppercase leading-[1] tracking-tight text-white">
            Quem joga todo dia <span className="text-laranja">sabe fazer gol.</span>
          </h2>
          <p className="mt-6 max-w-xl text-mute md:text-lg">
            Escala de quem já acelera centenas de corretoras em todo o Brasil, com dados de milhões de reais em campanhas.
          </p>
        </div>

        <dl data-reveal="stagger" className="mt-16 grid grid-cols-1 gap-px sm:grid-cols-2 overflow-hidden rounded-3xl border border-white/10 bg-white/10 md:mt-20 lg:grid-cols-4">
          {numeros.map((n) => (
            <div key={n.rotulo} className="flex items-center justify-between gap-6 bg-ink/85 p-6 backdrop-blur sm:flex-col sm:items-start sm:gap-10 md:p-8">
              <dt className="order-2 max-w-[11rem] text-right text-sm leading-snug text-mute sm:max-w-none sm:text-left md:text-base">{n.rotulo}</dt>
              <dd className="font-expanded order-1 whitespace-nowrap text-[clamp(1.6rem,7.6vw,2.4rem)] font-bold leading-none tracking-tight text-white lg:text-[clamp(2rem,3vw,3rem)]">
                {n.prefixo}
                <span data-count={n.valor}>{formatar(n.valor)}</span>
                <span className="text-laranja">{n.sufixo}</span>
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
