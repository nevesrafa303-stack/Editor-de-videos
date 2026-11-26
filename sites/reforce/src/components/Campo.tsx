import Image from "next/image";
import { campo } from "@/content/site";
import { imagens } from "@/lib/imagens";
import { TextoFundo } from "./TextoFundo";
import { Kicker, TituloSecao } from "./ui";

type Foto = (typeof campo.fotos)[number];

function FotoCampo({ f, grande }: { f: Foto; grande?: boolean }) {
  return (
    <li className={`relative shrink-0 ${grande ? "w-[82vw] sm:w-[58vw] lg:w-[46vw]" : "w-[70vw] sm:w-[46vw] lg:w-[34vw]"} aspect-[4/3]`}>
      <button
        type="button"
        data-abre-visor={`visor-${f.id}`}
        data-campo-foto
        className="group absolute inset-0 overflow-hidden rounded-[1.5rem] text-left"
        aria-label={`Ampliar foto: ${f.legenda}`}
      >
        <Image
          src={imagens[f.id]}
          alt=""
          fill
          draggable={false}
          sizes={grande ? "(min-width: 1024px) 46vw, 82vw" : "(min-width: 1024px) 34vw, 70vw"}
          quality={75}
          className="object-cover transition-[filter] duration-500 group-hover:brightness-110"
        />
        <span className="absolute inset-0 bg-gradient-to-t from-abismo/95 via-abismo/10 to-transparent" aria-hidden="true" />
        <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-5">
          <span className="max-w-[28rem] text-sm leading-snug text-white md:text-[0.95rem]">{f.legenda}</span>
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-white/15 text-white backdrop-blur transition group-hover:bg-menta group-hover:text-abismo" aria-hidden="true">
            <svg viewBox="0 0 20 20" className="size-4" fill="none">
              <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </span>
        </span>
      </button>
      <dialog id={`visor-${f.id}`} className="visor" aria-label={f.legenda}>
        <figure className="relative">
          <Image src={imagens[f.id]} alt={f.legenda} sizes="92vw" quality={80} className="h-auto max-h-[80vh] w-auto rounded-xl" />
          <figcaption className="mt-3 text-center text-sm text-nevoa">{f.legenda}</figcaption>
          <form method="dialog">
            <button type="submit" aria-label="Fechar" className="absolute -right-3 -top-3 grid size-10 place-items-center rounded-full bg-white text-abismo shadow-lg">
              <svg viewBox="0 0 20 20" className="size-4" fill="none" aria-hidden="true">
                <path d="m5 5 10 10M15 5 5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </form>
        </figure>
      </dialog>
    </li>
  );
}

// Fotos reais de campo em duas fileiras que andam em sentidos opostos conforme a página desce; cada foto
// abre de um recorte e a imagem afasta (zoom). Sem animação, as fileiras rolam de lado (dedo ou mouse).
export function Campo() {
  const [a, b, c, d, e, f] = campo.fotos;
  return (
    <section id="campo" data-campo className="relative overflow-hidden bg-fundo py-24 md:py-32">
      <TextoFundo texto="No campo" className="top-10" />
      <div className="container-site relative">
        <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="max-w-3xl">
            <Kicker>{campo.kicker}</Kicker>
            <TituloSecao className="mt-6">{campo.titulo}</TituloSecao>
          </div>
          <p data-reveal className="max-w-md text-lg leading-relaxed text-mute">
            {campo.texto}
          </p>
        </div>
      </div>

      <div className="relative mt-14 grid gap-4 md:gap-6">
        <ul data-campo-linha="esquerda" data-arrastar className="trilho relative flex gap-4 overflow-x-auto px-5 md:gap-6 md:px-9">
          <FotoCampo f={a} grande />
          <FotoCampo f={b} />
          <FotoCampo f={c} />
        </ul>
        <ul data-campo-linha="direita" data-arrastar className="trilho relative flex gap-4 overflow-x-auto px-5 md:gap-6 md:px-9">
          <FotoCampo f={d} />
          <FotoCampo f={e} />
          <FotoCampo f={f} grande />
        </ul>
      </div>
    </section>
  );
}
