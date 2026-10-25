"use client";

import Image, { type StaticImageData } from "next/image";
import { useRef } from "react";

// Botão "Ver print" que abre o print original da #PlacaRISE numa janela (diálogo nativo do navegador).
export function PrintPlaca({ imagem, alt }: { imagem: StaticImageData; alt: string }) {
  const dialogo = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button
        type="button"
        onClick={() => dialogo.current?.showModal()}
        className="mt-5 inline-flex items-center gap-2 self-start text-sm font-semibold text-ouro transition hover:text-white"
      >
        <svg viewBox="0 0 24 24" className="size-4" fill="none" aria-hidden="true">
          <rect x="6" y="2.5" width="12" height="19" rx="2.5" stroke="currentColor" strokeWidth="1.8" />
          <path d="M10.5 18.5h3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
        Ver o print
      </button>
      <dialog
        ref={dialogo}
        aria-label={alt}
        onClick={(e) => e.target === e.currentTarget && dialogo.current?.close()}
        className="m-auto max-h-[92svh] w-[min(26rem,92vw)] overflow-visible bg-transparent p-0 backdrop:bg-black/80 backdrop:backdrop-blur-sm"
      >
        <div className="relative">
          <Image src={imagem} alt={alt} sizes="(min-width: 640px) 26rem, 92vw" className="h-auto max-h-[86svh] w-full rounded-2xl object-contain" />
          <button
            type="button"
            onClick={() => dialogo.current?.close()}
            aria-label="Fechar"
            className="absolute -top-3 -right-3 grid size-10 place-items-center rounded-full bg-white text-ink shadow-lg"
          >
            <svg viewBox="0 0 24 24" className="size-4" fill="none" aria-hidden="true">
              <path d="M7 7l10 10M17 7 7 17" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </dialog>
    </>
  );
}
