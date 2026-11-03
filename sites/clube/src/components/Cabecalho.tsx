import type { ReactNode } from "react";
import { Simbolo } from "./Logo";

// Cabeçalho padrão das seções: a seta da marca, o título e um texto curto, tudo centralizado.
export function Cabecalho({
  id,
  titulo,
  intro,
  className = "",
}: {
  id: string;
  titulo: ReactNode;
  intro?: ReactNode;
  className?: string;
}) {
  return (
    <header className={`mx-auto max-w-3xl text-center ${className}`}>
      <Simbolo id={`${id}-marca`} className="mx-auto size-7 md:size-8" />
      <h2
        id={id}
        data-split
        className="font-expanded mt-6 text-balance text-[clamp(1.85rem,4.2vw,3.5rem)] font-bold uppercase leading-[1] tracking-tight text-white"
      >
        {titulo}
      </h2>
      {intro && (
        <p data-reveal className="mx-auto mt-5 max-w-2xl text-pretty leading-relaxed text-mute md:text-lg">
          {intro}
        </p>
      )}
    </header>
  );
}
