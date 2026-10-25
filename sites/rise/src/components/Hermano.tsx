import Image from "next/image";
import { hermano } from "@/content/site";
import foto from "@/assets/img/hermano-bio.webp";

export function Hermano() {
  return (
    <section id="hermano" aria-labelledby="hermano-titulo" className="relative overflow-clip border-t border-white/10 bg-carbon py-24 md:py-36">
      <div className="container-site grid items-center gap-14 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-20">
        <figure data-reveal className="relative mx-auto w-full max-w-md lg:max-w-none">
          <div aria-hidden="true" data-parallax="-6" className="absolute -inset-3 rounded-[34px] border border-ouro/30" />
          <div className="relative overflow-hidden rounded-[28px] bg-[#2b2b2b]">
            <Image
              src={foto}
              alt="Leonardo Fernandes, o Hermano, de camisa polo laranja da LAKS"
              sizes="(min-width: 1024px) 34vw, (min-width: 448px) 28rem, 90vw"
              className="aspect-[9/10] h-auto w-full object-cover"
            />
          </div>
          <figcaption className="absolute bottom-4 left-4 rounded-full border border-white/10 bg-ink/70 px-3.5 py-1.5 text-xs font-semibold text-fog backdrop-blur">
            Diretor da LAKS Company
          </figcaption>
        </figure>

        <div>
          <h2
            id="hermano-titulo"
            data-split
            className="font-expanded text-[clamp(2rem,4.6vw,4rem)] font-bold uppercase leading-[0.96] tracking-tight text-white"
          >
            {hermano.nome} <span className="texto-ouro">{hermano.apelido}</span>
          </h2>
          <div data-reveal="stagger" className="mt-8 grid gap-5 leading-relaxed text-mute md:text-lg">
            {hermano.bio.map((b) => (
              <p key={b}>{b}</p>
            ))}
          </div>
          <dl className="mt-10 grid grid-cols-2 gap-x-6 gap-y-8 border-t border-white/10 pt-8">
            {hermano.numeros.map((n) => (
              <div key={n.rotulo} className="flex flex-col">
                <dt className="order-2 mt-1 text-sm leading-snug text-mute">{n.rotulo}</dt>
                <dd className="font-expanded order-1 text-[clamp(1.7rem,3.4vw,2.6rem)] font-bold leading-none text-white">
                  {n.prefixo}
                  <span data-count={n.valor}>{n.valor.toLocaleString("pt-BR")}</span>
                  <span className="text-ouro">{n.unidade}</span>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
