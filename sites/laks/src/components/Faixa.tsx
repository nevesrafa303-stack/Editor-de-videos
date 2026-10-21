import { Fragment } from "react";
import { faixa } from "@/content/site";
import { Simbolo } from "./Logo";

// Duas linhas de texto grande que andam em sentidos opostos com a rolagem (data-kinetic em src/lib/motion.ts).
export function Faixa() {
  const linha = (palavras: readonly string[], contorno: boolean) => (
    <>
      {[0, 1, 2].map((rep) => (
        <Fragment key={rep}>
          {palavras.map((p) => (
            <Fragment key={`${rep}-${p}`}>
              <span className={contorno ? "text-outline" : "text-white"}>{p}</span>
              <Simbolo className="mx-[0.35em] inline-block h-[0.55em] w-auto shrink-0 align-middle" />
            </Fragment>
          ))}
        </Fragment>
      ))}
    </>
  );

  return (
    <section aria-label={faixa.flat().join(", ")} className="overflow-hidden border-y border-white/10 py-10 md:py-16">
      <div aria-hidden="true" className="font-expanded flex flex-col gap-2 text-[clamp(2.2rem,8vw,7.5rem)] font-bold uppercase leading-none tracking-tight md:gap-4">
        <p data-kinetic="esquerda" data-forca="0.35" className="flex w-max items-center whitespace-nowrap">
          {linha(faixa[0], false)}
        </p>
        <p data-kinetic="direita" data-forca="0.35" className="flex w-max -translate-x-1/4 items-center whitespace-nowrap">
          {linha(faixa[1], true)}
        </p>
      </div>
    </section>
  );
}
