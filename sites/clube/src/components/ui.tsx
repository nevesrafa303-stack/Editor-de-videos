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

type CtaProps = ComponentProps<"a"> & { local: string; rotulo?: string; children: ReactNode };

// Botão principal (degradê da marca): "puxa" o cursor no desktop e um reflexo atravessa de tempos em tempos.
// Link externo (WhatsApp) abre em nova aba e avisa leitores de tela.
export function Cta({ local, rotulo = "Garantir", className = "", children, href = "#ingressos", ...props }: CtaProps) {
  const externo = /^https?:/.test(href);
  return (
    <a
      href={href}
      data-cta={local}
      data-magnetic
      data-cursor={rotulo}
      {...(externo ? { target: "_blank", rel: "noopener" } : {})}
      className={`bg-ouro brilho reflexo group inline-flex items-center justify-center gap-3 rounded-full px-7 py-[1.05rem] text-[0.95rem] font-bold text-ink shadow-[0_10px_40px_-12px] shadow-brasa/60 transition-shadow duration-300 hover:shadow-[0_14px_50px_-10px] hover:shadow-brasa/80 ${className}`}
      {...props}
    >
      <span data-magnetic-texto className="inline-flex items-center gap-3">
        {children}
        {externo && <span className="sr-only">(abre em nova aba)</span>}
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

// Selo de verificado (o mesmo azul das redes sociais).
export function Verificado({ className = "size-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-label="verificado" role="img">
      <path
        fill="#3897f0"
        d="M12 1.5l2.6 1.9 3.2-.2 1 3 2.6 1.9-.9 3.1.9 3.1-2.6 1.9-1 3-3.2-.2L12 22.5l-2.6-1.9-3.2.2-1-3-2.6-1.9.9-3.1-.9-3.1 2.6-1.9 1-3 3.2.2z"
      />
      <path d="M8 12.2l2.6 2.6L16.2 9" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
