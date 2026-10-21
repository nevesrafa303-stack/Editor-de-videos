import Image from "next/image";
import { mapa } from "@/content/site";
import tituloMapa from "@/assets/img/metodo-mapa-titulo.webp";
import { Eyebrow } from "./ui";

export function Mapa() {
  return (
    <section id="comofunciona" aria-labelledby="mapa-titulo" data-mapa className="relative bg-carbon py-24 md:py-32">
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-laranja/60 to-transparent" />
      <div className="container-site grid gap-14 md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] md:gap-16">
        <div className="md:sticky md:top-28 md:flex md:h-[calc(100svh-9rem)] md:flex-col md:justify-center">
          <Eyebrow numero="03">Como funciona</Eyebrow>
          <h2 id="mapa-titulo" className="sr-only">
            {mapa.titulo} para corretoras de seguros
          </h2>
          <div data-mapa-titulo className="mt-8 max-w-md">
            <Image src={tituloMapa} alt="" sizes="(min-width: 768px) 28rem, 90vw" className="h-auto w-full" />
          </div>
          <p className="mt-8 max-w-md leading-relaxed text-mute md:text-lg">{mapa.intro}</p>

          <ol aria-hidden="true" className="mt-10 hidden items-center gap-3 md:flex">
            {mapa.passos.map((p, i) => (
              <li
                key={i}
                data-mapa-chip={i}
                className="font-expanded grid size-12 place-items-center rounded-xl border border-white/10 text-lg font-bold text-white/30 transition duration-500 data-[ativo=true]:border-laranja data-[ativo=true]:bg-laranja data-[ativo=true]:text-ink"
              >
                {p.letra}
              </li>
            ))}
            <li className="ml-3 h-px flex-1 overflow-hidden bg-white/10">
              <span data-mapa-progresso className="block h-full w-full origin-left scale-x-0 bg-laranja" />
            </li>
          </ol>
        </div>

        <ol className="flex flex-col gap-6 md:gap-0">
          {mapa.passos.map((p, i) => (
            <li
              key={i}
              data-mapa-passo={i}
              className="flex md:min-h-[72svh] md:items-center"
            >
              <article className="relative w-full overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-graphite to-ink p-7 md:p-10">
                <span
                  aria-hidden="true"
                  className="font-expanded pointer-events-none absolute -right-4 -top-10 text-[11rem] font-black leading-none text-white/[0.04] md:text-[15rem]"
                >
                  {p.letra}
                </span>
                <p className="font-expanded flex items-center gap-3 text-sm font-bold uppercase tracking-[0.2em] text-laranja">
                  <span className="grid size-9 place-items-center rounded-lg bg-laranja text-base text-ink">{p.letra}</span>
                  Etapa {i + 1}
                </p>
                <h3 className="font-expanded mt-6 text-[clamp(1.5rem,2.6vw,2.4rem)] font-bold uppercase leading-[1.05] text-white">
                  {p.nome}
                </h3>
                <p className="mt-4 max-w-lg text-base leading-relaxed text-mute md:text-lg">{p.texto}</p>
              </article>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
