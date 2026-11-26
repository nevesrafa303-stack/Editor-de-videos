import { LOGO_BLOCO, LOGO_LETRAS, LOGO_VIEWBOX, MARCA_BLOCO, MARCA_R, MARCA_VIEWBOX } from "@/lib/logo-paths";

type Props = { className?: string; decorativo?: boolean; monocromatico?: boolean };

/** Logo REFORCE (vetorizado da apresentação). As letras usam a cor do texto; o bloco é verde-água. */
export function Logo({ className = "h-6 w-auto", decorativo = false, monocromatico = false }: Props) {
  return (
    <svg
      viewBox={LOGO_VIEWBOX}
      className={className}
      role={decorativo ? undefined : "img"}
      aria-hidden={decorativo || undefined}
      aria-label={decorativo ? undefined : "Reforce"}
    >
      <path fill="currentColor" fillRule="evenodd" d={LOGO_LETRAS} />
      <path fill={monocromatico ? "currentColor" : "#00bda1"} d={LOGO_BLOCO} />
    </svg>
  );
}

/** Só o R da marca. */
export function MarcaR({ className = "size-8" }: { className?: string }) {
  return (
    <svg viewBox={MARCA_VIEWBOX} className={className} aria-hidden="true">
      <path fill="currentColor" fillRule="evenodd" d={MARCA_R} />
      <path fill="#00bda1" d={MARCA_BLOCO} />
    </svg>
  );
}

export { MARCA_R, MARCA_BLOCO, MARCA_VIEWBOX };
