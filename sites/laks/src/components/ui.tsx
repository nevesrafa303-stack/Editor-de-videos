import type { ComponentProps, CSSProperties, ReactNode } from "react";

// Variáveis CSS inline (ex.: atraso da animação de entrada).
export const vars = (v: Record<`--${string}`, string | number>) => v as CSSProperties;

export function Seta({ className = "size-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <path d="M4 10h11m-4.5-5L15 10l-4.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

type CtaProps = ComponentProps<"a"> & { variante?: "primario" | "link"; children: ReactNode };

// Primário: botão laranja que "puxa" o cursor no desktop (data-magnetic). Link: texto sublinhado.
export function Cta({ variante = "primario", className = "", children, ...props }: CtaProps) {
  if (variante === "link") {
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
  return (
    <a
      data-magnetic
      className={`group inline-flex items-center justify-center gap-3 rounded-full bg-laranja px-7 py-[1.05rem] text-[0.95rem] font-semibold text-ink transition-colors duration-300 hover:bg-laranja-claro ${className}`}
      {...props}
    >
      <span data-magnetic-texto className="inline-flex items-center gap-3">
        {children}
        <Seta className="size-4 transition duration-300 ease-out-expo group-hover:translate-x-1" />
      </span>
    </a>
  );
}
