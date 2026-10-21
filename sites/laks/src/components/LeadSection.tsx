import Image from "next/image";
import { diagnostico } from "@/content/site";
import fundador from "@/assets/img/fundador-camisa-laranja.webp";
import brilho from "@/assets/img/fundo-brilho-laranja.webp";
import { LeadForm } from "./LeadForm";
import { Eyebrow } from "./ui";

export function LeadSection() {
  return (
    <section id="forms" aria-labelledby="form-titulo" className="relative isolate overflow-hidden pb-24 pt-28 md:pb-32 md:pt-40">
      <Image
        src={brilho}
        alt=""
        aria-hidden="true"
        data-glow
        sizes="100vw"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-auto w-full opacity-90"
      />
      <div className="container-site grid gap-14 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-20">
        <div data-reveal>
          <Eyebrow numero="07">Diagnóstico gratuito</Eyebrow>
          <h2 id="form-titulo" className="font-expanded mt-6 text-[clamp(2.4rem,5.6vw,5rem)] font-bold uppercase leading-[0.95] tracking-tight text-white">
            {diagnostico.titulo}
          </h2>
          <p className="mt-6 max-w-lg text-mute md:text-lg">{diagnostico.intro}</p>

          <ol className="mt-10 grid gap-5">
            {diagnostico.passos.map((p, i) => (
              <li key={p.titulo} className="flex gap-4">
                <span className="font-expanded grid size-10 shrink-0 place-items-center rounded-full border border-laranja/50 text-sm font-bold text-laranja">
                  {i + 1}
                </span>
                <div>
                  <p className="font-semibold text-white">{p.titulo}</p>
                  <p className="text-sm leading-relaxed text-mute md:text-base">{p.texto}</p>
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-12 flex items-center gap-5 rounded-3xl border border-white/10 bg-white/[0.03] p-4 pr-6">
            <Image
              src={fundador}
              alt="Fundador da LAKS de camisa laranja com a frase Vivemos o que vendemos"
              sizes="96px"
              className="size-20 shrink-0 rounded-2xl object-cover object-top md:size-24"
            />
            <p className="text-sm leading-relaxed text-mute">
              <span className="block font-semibold text-white">Atendimento de quem vive o que vende.</span>
              {diagnostico.retorno}
            </p>
          </div>
        </div>

        <div className="relative">
          <div className="rounded-[2rem] border border-white/10 bg-graphite/80 p-6 shadow-2xl shadow-black/50 backdrop-blur-xl md:p-10">
            <p className="font-expanded mb-8 text-xl font-bold uppercase text-white">Agende sua consultoria gratuita</p>
            <LeadForm />
          </div>
        </div>
      </div>
    </section>
  );
}
