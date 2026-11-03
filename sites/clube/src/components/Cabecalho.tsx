import type { ReactNode } from "react";

// Cabeçalho das seções. Títulos curtos vão em caixa alta (palavra de impacto); os longos ficam em caixa
// normal, que se lê melhor e não "grita". `destaque` pinta em dourado um trecho do título.
// `lado`: no desktop o título fica à esquerda e o texto de apoio à direita, alinhados pela base (a seção
// ganha altura útil e foge do molde "tudo centralizado"). `esquerda`: alinhado à esquerda, empilhado.
// Sem nenhum dos dois, tudo centralizado.
export function Cabecalho({
  id,
  titulo,
  destaque,
  intro,
  lado = false,
  esquerda = false,
  compacto = false,
  extra,
  className = "",
}: {
  id: string;
  titulo: string;
  destaque?: string;
  intro?: ReactNode;
  lado?: boolean;
  esquerda?: boolean;
  // Título menor, para colunas estreitas (uma palavra longa em caixa alta não pode passar da coluna).
  compacto?: boolean;
  extra?: ReactNode;
  className?: string;
}) {
  const curto = titulo.length <= 34;
  const longo = titulo.length > 70;
  const partes = destaque && titulo.includes(destaque) ? titulo.split(destaque) : [titulo];
  const h2 = (
    <h2
      id={id}
      data-split
      className={`font-expanded text-balance font-bold text-white ${
        curto && compacto
          ? "text-[clamp(2rem,3.3vw,3rem)] uppercase leading-[0.96] tracking-tight"
          : curto
            ? "text-[clamp(2.1rem,4.6vw,4rem)] uppercase leading-[0.94] tracking-tight"
            : longo
              ? "text-[clamp(1.75rem,3vw,2.75rem)] leading-[1.08] tracking-[-0.02em]"
              : "text-[clamp(1.85rem,3.9vw,3.4rem)] leading-[1.04] tracking-[-0.02em]"
      }`}
    >
      {partes[0]}
      {partes.length > 1 && (
        <>
          <span className="texto-ouro">{destaque}</span>
          {partes[1]}
        </>
      )}
    </h2>
  );
  const apoio = intro && (
    <p data-reveal className="text-pretty text-base leading-relaxed text-fog/75 md:text-lg">
      {intro}
    </p>
  );

  if (lado) {
    return (
      <header className={`grid gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)] lg:items-end lg:gap-16 ${className}`}>
        <div className="max-w-3xl">{h2}</div>
        {(apoio || extra) && (
          <div className="grid max-w-md gap-6 lg:justify-self-end lg:pb-1">
            {apoio}
            {extra}
          </div>
        )}
      </header>
    );
  }
  if (esquerda) {
    return (
      <header className={`max-w-2xl ${className}`}>
        {h2}
        {apoio && <div className="mt-5 max-w-xl">{apoio}</div>}
        {extra && <div className="mt-6">{extra}</div>}
      </header>
    );
  }
  return (
    <header className={`mx-auto max-w-4xl text-center ${className}`}>
      {h2}
      {apoio && <div className="mx-auto mt-5 max-w-2xl">{apoio}</div>}
      {extra && <div className="mt-6">{extra}</div>}
    </header>
  );
}
