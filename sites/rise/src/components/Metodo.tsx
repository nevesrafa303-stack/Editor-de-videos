import Image from "next/image";
import { metodo } from "@/content/site";
import orbitas from "@/assets/img/bg-rise-orbitas.webp";
import { Icone } from "./Icones";

// Mentoria anual: os quatro focos começam só no contorno e "enchem" de dourado conforme passam pela tela.
export function Metodo() {
  return (
    <section id="metodo" aria-labelledby="metodo-titulo" className="relative isolate overflow-clip py-24 md:py-36">
      <div aria-hidden="true" className="absolute inset-x-0 top-0 -z-10 h-[34rem] md:h-[46rem]">
        <Image src={orbitas} alt="" fill sizes="100vw" data-orbita className="object-cover object-[78%_center] opacity-70" />
        <div className="absolute inset-0 bg-gradient-to-b from-ink/30 via-ink/40 to-ink" />
        <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/50 to-transparent" />
      </div>

      <div className="container-site">
        <h2
          id="metodo-titulo"
          data-split
          className="font-expanded max-w-[20ch] text-[clamp(1.7rem,3.6vw,3rem)] font-bold uppercase leading-[1] tracking-tight text-white"
        >
          {metodo.titulo}
        </h2>

        <ol className="mt-10 border-t border-white/10 md:mt-14">
          {metodo.focos.map((f, i) => (
            <li key={f} data-foco className="flex items-baseline gap-4 border-b border-white/10 py-4 md:gap-8 md:py-6">
              <span className="font-expanded w-8 shrink-0 text-sm font-bold text-brasa md:w-12 md:text-base">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="font-expanded relative inline-block text-[clamp(1.5rem,5.6vw,5.4rem)] font-bold uppercase leading-[1.02] tracking-tight">
                <span className="text-outline">{f}</span>
                <span aria-hidden="true" className="foco-cheio texto-ouro absolute inset-0">
                  {f}
                </span>
              </span>
            </li>
          ))}
        </ol>

        <p data-reveal className="font-expanded mt-14 max-w-[32ch] text-[clamp(1.2rem,2.4vw,2rem)] font-semibold uppercase leading-tight text-white">
          {metodo.frase}
        </p>

        <h3 data-reveal className="mt-20 text-sm font-semibold uppercase tracking-[0.2em] text-mute">
          {metodo.pilaresTitulo}
        </h3>
        <ul data-reveal="stagger" className="mt-6 grid gap-4 md:grid-cols-3">
          {metodo.pilares.map((p) => (
            <li key={p.titulo} className="flex min-h-52 flex-col justify-between rounded-3xl border border-white/10 bg-white/[0.02] p-7">
              <span className="grid size-12 place-items-center rounded-2xl bg-ouro/12 text-ouro">
                <Icone nome={p.icone} />
              </span>
              <span className="mt-10 text-xl font-semibold leading-snug text-white">{p.titulo}</span>
            </li>
          ))}
        </ul>
        <p data-reveal className="mt-10 max-w-2xl leading-relaxed text-mute md:text-lg">
          {metodo.laks}
        </p>
      </div>
    </section>
  );
}
