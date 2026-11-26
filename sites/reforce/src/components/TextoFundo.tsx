// Palavra gigante só de contorno, atrás da seção, que anda de lado com a rolagem (lib/motion.ts: data-kinetic).
export function TextoFundo({
  texto,
  direcao = "esquerda",
  escuro = false,
  className = "",
}: {
  texto: string;
  direcao?: "esquerda" | "direita";
  escuro?: boolean;
  className?: string;
}) {
  return (
    <div aria-hidden="true" className={`pointer-events-none absolute inset-x-0 select-none overflow-hidden ${className}`}>
      <p
        data-kinetic={direcao}
        data-forca="0.35"
        className={`font-display w-max whitespace-nowrap text-[clamp(5rem,16vw,15rem)] font-bold uppercase leading-none tracking-tight ${escuro ? "texto-contorno-escuro" : "texto-contorno"}`}
      >
        {texto} · {texto}
      </p>
    </div>
  );
}
