"use client";

import { useEffect, useRef, useState } from "react";
import { track } from "@/lib/tracking";

type Props = {
  id: string;
  nome: string;
  empresa: string;
  citacao: string;
  duracao: string;
  // Na seção de cases (fixa na tela no desktop) a altura do vídeo acompanha a altura da janela.
  alturaDaTela?: boolean;
};

const EVENTO_PLAY = "rise:depoimento-play";

export function VideoCard({ id, nome, empresa, citacao, duracao, alturaDaTela = false }: Props) {
  const [ativo, setAtivo] = useState(false);
  const video = useRef<HTMLVideoElement>(null);

  // Só um depoimento tocando por vez.
  useEffect(() => {
    const onPlay = (e: Event) => {
      if ((e as CustomEvent<string>).detail !== id) video.current?.pause();
    };
    window.addEventListener(EVENTO_PLAY, onPlay);
    return () => window.removeEventListener(EVENTO_PLAY, onPlay);
  }, [id]);

  const poster = `/videos/depoimento-${id}-poster.webp`;

  return (
    <figure className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-white/10 bg-graphite">
      {/* Com alturaDaTela, no desktop o card inteiro (vídeo + depoimento) cabe na janela sem encostar nas bordas. */}
      <div
        className={`relative aspect-[9/16] w-full overflow-hidden bg-black ${
          alturaDaTela ? "lg:aspect-auto lg:h-[clamp(12rem,calc(100svh-23rem),31.1rem)]" : ""
        }`}
      >
        {ativo ? (
          <video
            ref={video}
            src={`/videos/depoimento-${id}.mp4`}
            poster={poster}
            controls
            autoPlay
            playsInline
            preload="metadata"
            className="size-full object-contain"
            onPlay={() => window.dispatchEvent(new CustomEvent(EVENTO_PLAY, { detail: id }))}
            aria-label={`Depoimento em vídeo de ${nome}, ${empresa}`}
          />
        ) : (
          <button
            type="button"
            data-video={id}
            onClick={() => {
              setAtivo(true);
              track("depoimento_play", { depoimento: id });
            }}
            className="absolute inset-0 block size-full cursor-pointer text-left"
          >
            <span className="sr-only">
              Assistir ao depoimento de {nome}, {empresa}, duração
            </span>
            {/* eslint-disable-next-line @next/next/no-img-element -- poster já otimizado (WebP ~25 KB) */}
            <img
              src={poster}
              alt=""
              width={408}
              height={720}
              loading="lazy"
              decoding="async"
              className="size-full object-cover transition duration-700 ease-out-expo group-hover:scale-[1.04]"
            />
            <span className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent" />
            <span className="absolute left-1/2 top-1/2 grid size-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-ouro text-ink shadow-[0_0_0_10px] shadow-brasa/25 transition duration-500 ease-out-expo group-hover:scale-110 group-hover:shadow-[0_0_0_16px]">
              <svg viewBox="0 0 24 24" className="ml-1 size-6" fill="currentColor" aria-hidden="true">
                <path d="M7 4.5v15a1 1 0 0 0 1.53.85l12-7.5a1 1 0 0 0 0-1.7l-12-7.5A1 1 0 0 0 7 4.5Z" />
              </svg>
            </span>
            <span className="absolute right-4 top-4 rounded-full bg-black/50 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur">
              {duracao}
            </span>
          </button>
        )}
      </div>
      <figcaption className="flex flex-1 flex-col gap-4 p-5 md:p-6">
        <blockquote className="text-[0.95rem] leading-relaxed text-fog">“{citacao}”</blockquote>
        <p className="mt-auto text-sm">
          <span className="block font-semibold text-white">{nome}</span>
          <span className="text-mute">{empresa}</span>
        </p>
      </figcaption>
    </figure>
  );
}
