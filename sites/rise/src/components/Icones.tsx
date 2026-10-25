import type { ReactNode } from "react";

// Ícones de traço (24×24) das entregas e dos pilares. Herdam a cor do texto.
const caminhos: Record<string, ReactNode> = {
  diagnostico: (
    <>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m15.5 15.5 5 5M7.8 10.6l1.9 1.9 3.5-3.6" />
    </>
  ),
  plano: (
    <>
      <rect x="4.5" y="3.5" width="15" height="17" rx="2.5" />
      <path d="M8 8.5l1.2 1.2L11.5 7.5M8 14.5l1.2 1.2 2.3-2.2M14 9h2.5M14 15h2.5" />
    </>
  ),
  squads: (
    <>
      <circle cx="12" cy="7.5" r="2.8" />
      <circle cx="5.5" cy="10" r="2.2" />
      <circle cx="18.5" cy="10" r="2.2" />
      <path d="M7 19.5c.4-3 2.4-5 5-5s4.6 2 5 5M2.5 18c.3-2 1.5-3.4 3.2-3.6M21.5 18c-.3-2-1.5-3.4-3.2-3.6" />
    </>
  ),
  acompanhamento: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="m15.3 8.7-2.1 4.5-4.5 2.1 2.1-4.5 4.5-2.1Z" />
    </>
  ),
  posicionamento: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.5" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
    </>
  ),
  comercial: (
    <>
      <path d="M3.5 4.5h17l-6.5 8v6l-4 2v-8l-6.5-8Z" />
    </>
  ),
  operacao: (
    <>
      <path d="m12 3 8.5 4.5L12 12 3.5 7.5 12 3Z" />
      <path d="m3.5 12 8.5 4.5 8.5-4.5M3.5 16.5 12 21l8.5-4.5" />
    </>
  ),
};

export function Icone({ nome, className = "size-6" }: { nome: string; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {caminhos[nome]}
    </svg>
  );
}
