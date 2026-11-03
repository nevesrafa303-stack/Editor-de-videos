import { Fragment } from "react";
import { faixa } from "@/content/site";
import { Simbolo } from "./Logo";

// Duas linhas de texto grande que andam em sentidos opostos com a rolagem e inclinam com a velocidade
// (data-kinetic em src/lib/motion.ts).
export function Faixa() {
  const linha = (palavras: readonly string[], contorno: boolean, id: string) => (
    <>
      {[0, 1, 2].map((rep) => (
        <Fragment key={rep}>
          {palavras.map((p, i) => (
            <Fragment key={`${rep}-${p}`}>
              <span className={contorno ? "text-outline" : "text-white"}>{p}</span>
              <Simbolo id={`faixa-${id}-${rep}-${i}`} className="mx-[0.45em] inline-block size-[0.62em] shrink-0 align-middle" />
            </Fragment>
          ))}
        </Fragment>
      ))}
    </>
  );

  return (
    <section aria-label={faixa.flat().join(", ")} className="overflow-hidden border-y border-white/10 bg-carbon py-8 md:py-12">
      <div aria-hidden="true" className="font-expanded flex flex-col gap-2 text-[clamp(2rem,6.4vw,6rem)] font-bold uppercase leading-none tracking-tight md:gap-3">
        <p data-kinetic="esquerda" data-forca="0.3" className="flex w-max items-center whitespace-nowrap">
          {linha(faixa[0], false, "a")}
        </p>
        <p data-kinetic="direita" data-forca="0.3" className="flex w-max -translate-x-1/4 items-center whitespace-nowrap">
          {linha(faixa[1], true, "b")}
        </p>
      </div>
    </section>
  );
}
