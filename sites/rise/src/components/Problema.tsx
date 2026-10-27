import Image from "next/image";
import { problema } from "@/content/site";
import fundo from "@/assets/img/bg-dono-tablet.webp";

// "Você já tem cliente…": uma linha de leitura desce pela lista e acende cada gargalo que encontra
// (data-scan em src/lib/motion.ts). Sem animação, todos os gargalos já aparecem acesos.
export function Problema() {
  return (
    <section id="problema" aria-labelledby="problema-titulo" className="relative isolate overflow-clip lg:py-36">
      <div className="relative -z-10 h-[64vw] md:h-[46vw] lg:absolute lg:inset-0 lg:h-auto">
        <Image
          src={fundo}
          alt="Dono de agência olhando os números no tablet, à noite"
          fill
          sizes="100vw"
          data-parallax="8"
          className="scale-110 object-cover object-[22%_center]"
        />
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-ink to-transparent lg:hidden" />
        <div className="absolute inset-y-0 right-0 hidden w-[62%] bg-gradient-to-l from-ink via-ink/90 to-transparent lg:block" />
      </div>

      <div className="container-site pb-24 lg:grid lg:grid-cols-2 lg:pb-0">
        <div className="lg:col-start-2">
          <h2
            id="problema-titulo"
            data-split
            className="font-expanded text-[clamp(2rem,5vw,4rem)] font-bold uppercase leading-[0.96] tracking-tight text-white"
          >
            {problema.titulo}
          </h2>
          <p data-reveal className="font-expanded mt-4 text-[clamp(1.15rem,2.2vw,1.6rem)] font-semibold uppercase leading-tight text-ouro">
            {problema.subtitulo}
          </p>
          <p data-reveal className="mt-6 max-w-xl leading-relaxed text-mute md:text-lg">
            {problema.texto}
          </p>

          <div data-scan className="relative mt-8">
            {/* Painel do diagnóstico: conta os gargalos conforme a linha de leitura passa por eles. */}
            <div className="relative mb-3 flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-ink/70 px-4 py-3 backdrop-blur">
              <p className="flex items-center gap-2.5 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-mute">
                <span className="relative flex size-2" aria-hidden="true">
                  <span className="absolute inset-0 animate-ping rounded-full bg-brasa/60 motion-reduce:hidden" />
                  <span className="relative size-2 rounded-full bg-brasa" />
                </span>
                Diagnóstico da operação
              </p>
              <p className="font-expanded text-sm font-bold text-white">
                <span data-scan-contador>{problema.gargalos.length}</span>/{problema.gargalos.length}{" "}
                <span className="font-sans text-xs font-medium text-mute">gargalos</span>
              </p>
              <span aria-hidden="true" className="absolute inset-x-4 bottom-0 h-px overflow-hidden bg-white/10">
                <span data-scan-barra className="bg-ouro block h-full w-full origin-left" />
              </span>
            </div>
            <div data-scan-area className="relative">
              <span
                data-scan-linha
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-0 hidden h-px bg-gradient-to-r from-transparent via-ouro to-transparent shadow-[0_0_18px_2px] shadow-ouro/50"
              />
              <ul className="border-t border-white/10">
                {problema.gargalos.map((g) => (
                  <li key={g} data-gargalo className="flex items-center gap-4 border-b border-white/10 py-4 md:py-5">
                    <span className="gargalo-sinal size-2.5 shrink-0 rounded-full bg-white/20" aria-hidden="true" />
                    <span className="gargalo-texto text-base leading-snug text-mute md:text-lg">{g}</span>
                    <span
                      aria-hidden="true"
                      className="gargalo-tag ml-auto hidden shrink-0 rounded-full border border-brasa/40 px-2.5 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-brasa sm:inline"
                    >
                      Gargalo
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <p data-reveal className="font-expanded mt-8 text-lg font-semibold uppercase leading-snug text-white md:text-xl">
            {problema.fecho}
          </p>

          <div data-reveal className="mt-10 rounded-3xl border border-white/10 bg-carbon/80 p-6 backdrop-blur md:p-8">
            <p className="text-mute">{problema.virada}</p>
            <ul className="mt-5 grid gap-3">
              {problema.estrutura.map((e) => (
                <li key={e} className="flex items-center gap-3 font-semibold text-white md:text-lg">
                  <span className="bg-ouro grid size-6 shrink-0 place-items-center rounded-full text-ink" aria-hidden="true">
                    <svg viewBox="0 0 24 24" className="size-3.5" fill="none">
                      <path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  {e}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
