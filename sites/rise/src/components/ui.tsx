import type { ComponentProps, CSSProperties, ReactNode } from "react";
import { cta } from "@/content/site";
import { FORM_URL } from "@/lib/aplicacao";

// Variáveis CSS inline (ex.: atraso da animação de entrada).
export const vars = (v: Record<`--${string}`, string | number>) => v as CSSProperties;

export function Seta({ className = "size-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <path d="M4 10h11m-4.5-5L15 10l-4.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

type AplicarProps = Omit<ComponentProps<"a">, "href" | "children"> & { local: string; children?: ReactNode };

// Botão principal: abre o formulário de aplicação em nova aba e "puxa" o cursor no desktop (data-magnetic).
export function Aplicar({ local, className = "", children = cta, ...props }: AplicarProps) {
  return (
    <a
      href={FORM_URL}
      target="_blank"
      rel="noopener"
      data-aplicar
      data-cta={local}
      data-magnetic
      className={`bg-ouro brilho group inline-flex items-center justify-center gap-3 rounded-full px-7 py-[1.05rem] text-[0.95rem] font-bold text-ink shadow-[0_10px_40px_-12px] shadow-brasa/60 transition-shadow duration-300 hover:shadow-[0_14px_50px_-10px] hover:shadow-brasa/80 ${className}`}
      {...props}
    >
      <span data-magnetic-texto className="inline-flex items-center gap-3">
        {children}
        <span className="sr-only">(abre em nova aba)</span>
        <Seta className="size-4 transition duration-300 ease-out-expo group-hover:translate-x-1" />
      </span>
    </a>
  );
}

// Link secundário: texto sublinhado que recolhe ao passar o mouse.
export function LinkSeta({ className = "", children, ...props }: ComponentProps<"a"> & { children: ReactNode }) {
  return (
    <a
      className={`group inline-flex items-center gap-2 py-2 text-[0.95rem] font-semibold text-fog transition hover:text-white ${className}`}
      {...props}
    >
      <span className="bg-[linear-gradient(currentColor,currentColor)] bg-[length:100%_1px] bg-left-bottom bg-no-repeat pb-1 transition-[background-size] duration-500 ease-out-expo group-hover:bg-[length:0%_1px]">
        {children}
      </span>
      <Seta className="size-4 transition duration-300 ease-out-expo group-hover:translate-x-1" />
    </a>
  );
}
