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

type CtaProps = ComponentProps<"a"> & { variante?: "primario" | "secundario"; children: ReactNode };

export function Cta({ variante = "primario", className = "", children, ...props }: CtaProps) {
  const base =
    "group inline-flex items-center justify-center gap-3 rounded-full px-6 py-4 text-[0.95rem] font-semibold tracking-tight transition duration-300 ease-out-expo md:px-7";
  const estilos =
    variante === "primario"
      ? "bg-laranja text-ink shadow-[0_10px_40px_-10px] shadow-laranja/70 hover:bg-laranja-claro hover:shadow-laranja"
      : "border border-white/15 bg-white/[0.03] text-fog backdrop-blur hover:border-white/40 hover:bg-white/[0.06]";
  return (
    <a className={`${base} ${estilos} ${className}`} {...props}>
      {children}
      <span className="grid size-7 place-items-center rounded-full bg-black/15 transition duration-300 ease-out-expo group-hover:translate-x-1">
        <Seta />
      </span>
    </a>
  );
}

export function Eyebrow({ numero, children }: { numero?: string; children: ReactNode }) {
  return (
    <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.22em] text-mute">
      {numero && <span className="font-expanded text-laranja">{numero}</span>}
      <span className="h-px w-8 bg-white/25" aria-hidden="true" />
      {children}
    </p>
  );
}
