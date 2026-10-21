import Image from "next/image";
import { mapa } from "@/content/site";
import tituloMapa from "@/assets/img/metodo-mapa-titulo.webp";

// Etapas em cartões que se empilham com a rolagem (src/lib/motion.ts); o de baixo recua e escurece.
export function Mapa() {
  const total = mapa.passos.length;
  return (
    <section id="comofunciona" aria-labelledby="mapa-titulo" data-mapa className="relative bg-carbon py-24 md:py-36">
      <div className="container-site grid gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <h2 id="mapa-titulo" className="sr-only">
            {mapa.titulo} para corretoras de seguros
          </h2>
          <div data-mapa-titulo className="max-w-[22rem] md:max-w-md">
            <Image src={tituloMapa} alt="" sizes="(min-width: 768px) 28rem, 90vw" className="h-auto w-full" />
          </div>
          <p className="mt-8 max-w-md text-base leading-relaxed text-mute md:text-lg">{mapa.intro}</p>
        </div>

        {/* Sem animação: lista normal. Com animação: os cartões se sobrepõem e entram um a um (data-pilha). */}
        <ol data-mapa-pilha className="relative flex flex-col gap-5">
          {mapa.passos.map((p, i) => (
            <li key={i} data-mapa-cartao>
              <article className="relative flex min-h-[19rem] origin-top flex-col overflow-hidden rounded-2xl border border-white/10 bg-graphite p-6 sm:flex-row sm:items-stretch sm:gap-10 md:min-h-[22rem] md:p-10">
                <p
                  aria-hidden="true"
                  className="font-expanded text-[5.5rem] font-black leading-[0.8] text-laranja sm:w-32 sm:shrink-0 md:text-[8.5rem] lg:w-40"
                >
                  {p.letra}
                </p>
                <div className="mt-6 flex flex-1 flex-col sm:mt-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-mute">
                    Etapa {i + 1} de {total}
                  </p>
                  <h3 className="font-expanded mt-3 text-[clamp(1.4rem,3.4vw,2.3rem)] font-bold uppercase leading-[1.02] text-white">
                    {p.nome}
                  </h3>
                  <p className="mt-4 max-w-lg text-base leading-relaxed text-mute md:text-lg">{p.texto}</p>
                </div>
                <span data-mapa-sombra aria-hidden="true" className="pointer-events-none absolute inset-0 bg-ink opacity-0" />
              </article>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
