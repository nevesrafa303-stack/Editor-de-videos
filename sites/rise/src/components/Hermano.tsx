import Image from "next/image";
import { hermano } from "@/content/site";
import foto from "@/assets/img/hermano-bio.webp";

// Foto fixa ao lado (desktop) e a trajetória do Hermano numa linha do tempo: a linha dourada desce com
// a rolagem e cada marco acende quando ela chega (data-trajetoria em src/lib/motion.ts).
export function Hermano() {
  return (
    <section id="hermano" aria-labelledby="hermano-titulo" className="relative overflow-clip border-t border-white/10 bg-carbon py-24 md:py-36">
      <div className="container-site grid gap-14 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-20">
        <figure data-reveal className="relative mx-auto w-full max-w-md self-start lg:sticky lg:top-28 lg:max-w-none">
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

          <dl className="mt-10 grid grid-cols-2 gap-x-6 gap-y-8 border-y border-white/10 py-8">
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

          <ol data-trajetoria className="relative mt-12 grid gap-9 pl-10">
            <span aria-hidden="true" className="absolute bottom-3 left-[0.55rem] top-3 w-px bg-white/10">
              <span data-trajetoria-linha className="bg-ouro block h-full w-full origin-top" />
            </span>
            {hermano.trajetoria.map((m) => (
              <li key={m.marco} data-marco className="relative">
                <span
                  aria-hidden="true"
                  className="marco-ponto absolute -left-10 top-0.5 size-[1.15rem] rounded-full border border-white/25 bg-carbon"
                />
                <p className="font-expanded text-sm font-bold uppercase tracking-wide text-ouro">{m.marco}</p>
                <p className="mt-2 leading-relaxed text-mute md:text-lg">{m.texto}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
