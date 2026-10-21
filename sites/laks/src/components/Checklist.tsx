import Image from "next/image";
import { checklist } from "@/content/site";
import fundo from "@/assets/img/fundo-escritorio-desfocado.webp";
import { Cta, Eyebrow } from "./ui";

export function Checklist() {
  return (
    <section aria-labelledby="check-titulo" className="relative isolate overflow-hidden py-24 md:py-36">
      <div aria-hidden="true" className="absolute inset-0 -z-10">
        <Image src={fundo} alt="" fill sizes="100vw" className="object-cover opacity-50" />
        <div className="absolute inset-0 bg-gradient-to-b from-ink via-ink/60 to-ink" />
      </div>
      <div className="container-site grid gap-12 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:gap-20">
        <div data-reveal>
          <Eyebrow numero="06">Ainda em dúvida?</Eyebrow>
          <h2 id="check-titulo" className="font-expanded mt-6 text-[clamp(1.9rem,3.8vw,3.4rem)] font-bold uppercase leading-[1] tracking-tight text-white">
            {checklist.titulo}
          </h2>
        </div>
        <div>
          <ul data-checklist className="divide-y divide-white/10 border-y border-white/10">
            {checklist.itens.map((item) => (
              <li key={item} data-check className="check-item flex items-start gap-5 py-5 text-lg leading-snug text-mute md:py-6 md:text-xl">
                <span className="check-box mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg border border-white/20" aria-hidden="true">
                  <svg viewBox="0 0 24 24" className="size-5" fill="none">
                    <path d="M5 12.5l4.5 4.5L19 7.5" stroke="white" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                {item}
              </li>
            ))}
          </ul>
          <div className="mt-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-expanded text-lg font-semibold uppercase text-white">{checklist.fechamento}</p>
            <Cta href="#forms" data-cta="checklist" className="shrink-0">
              Vamos conversar
            </Cta>
          </div>
        </div>
      </div>
    </section>
  );
}
