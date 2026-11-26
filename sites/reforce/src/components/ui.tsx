import type { ComponentProps, CSSProperties, ReactNode } from "react";
import { cta } from "@/content/site";

// Variáveis CSS inline (ex.: atraso da animação de entrada).
export const vars = (v: Record<`--${string}`, string | number>) => v as CSSProperties;

/** A seta ↘ da marca. */
export function SetaDiagonal({ className = "size-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <path d="M5 5l10 10M15 6.5V15H6.5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Seta({ className = "size-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <path d="M4 10h11m-4.5-5L15 10l-4.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Círculo verde com a seta ↘. */
export function SeloSeta({ className = "size-12" }: { className?: string }) {
  return (
    <span className={`selo-seta ${className}`} aria-hidden="true">
      <SetaDiagonal className="size-[42%]" />
    </span>
  );
}

/** Botão principal: pílula em degradê com a seta ↘ num círculo escuro. */
export function BotaoMarca({
  href = "#contato",
  children = cta,
  className = "",
  ...props
}: Omit<ComponentProps<"a">, "children"> & { children?: ReactNode }) {
  return (
    <a href={href} data-cta className={`botao-marca ${className}`} {...props}>
      <span className="seta-circulo" aria-hidden="true">
        <SetaDiagonal className="size-4" />
      </span>
      {children}
    </a>
  );
}

export function Kicker({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <p className={`kicker ${className}`}>
      <span className="barra-marca h-[3px] w-7" aria-hidden="true" />
      {children}
    </p>
  );
}

/** Título de seção: entra linha a linha com a rolagem (data-split). */
export function TituloSecao({
  children,
  className = "",
  as: Tag = "h2",
  id,
}: {
  children: ReactNode;
  className?: string;
  as?: "h2" | "h3";
  id?: string;
}) {
  return (
    <Tag id={id} data-split className={`font-display text-[clamp(2rem,4.4vw,3.6rem)] font-light leading-[1.05] tracking-[-0.02em] text-white ${className}`}>
      {children}
    </Tag>
  );
}
