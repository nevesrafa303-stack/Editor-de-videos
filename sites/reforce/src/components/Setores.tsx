import Image from "next/image";
import { setores } from "@/content/site";
import { imagens } from "@/lib/imagens";
import { Kicker, TituloSecao } from "./ui";

export function SetasCarrossel({ total, rotulo, className = "" }: { total: number; rotulo: string; className?: string }) {
  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <p className="flex items-center gap-3 text-sm tabular-nums text-mute" aria-hidden="true">
        <span data-carrossel-atual className="font-display font-semibold text-white">
          01
        </span>
        <span className="relative h-px w-16 overflow-hidden bg-white/15 sm:w-24">
          <span data-carrossel-barra className="bg-degrade absolute inset-0 origin-left transition-transform duration-500" style={{ transform: `scaleX(${1 / total})` }} />
        </span>
        {String(total).padStart(2, "0")}
      </p>
      <div className="flex gap-2">
        {[-1, 1].map((passo) => (
          <button
            key={passo}
            type="button"
            data-carrossel-passo={passo}
            aria-label={`${passo < 0 ? "Anterior" : "Próximo"}: ${rotulo}`}
            className="grid size-11 place-items-center rounded-full border border-white/15 text-nevoa transition hover:border-menta hover:bg-menta/10 disabled:opacity-30 disabled:hover:border-white/15 disabled:hover:bg-transparent"
          >
            <svg viewBox="0 0 20 20" fill="none" className={`size-4 ${passo < 0 ? "rotate-180" : ""}`} aria-hidden="true">
              <path d="M4 10h11m-4.5-5L15 10l-4.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        ))}
      </div>
    </div>
  );
}

// Galeria dos setores. A seção fixa e os cartões passam da direita para a esquerda conforme a página
// desce, girando em 3D ao cruzar o centro (lib/motion.ts). Sem animação, é um trilho de rolagem lateral
// (dedo, arrastar com o mouse ou setas).
export function Setores() {
  return (
    <section id="setores" data-setores data-carrossel className="relative overflow-hidden bg-abismo">
      <div className="flex min-h-[100svh] flex-col justify-center py-20">
        <div className="container-site flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-3xl">
            <Kicker>Setores</Kicker>
            <TituloSecao className="mt-5 lg:!text-[clamp(2rem,3.6vw,3.3rem)]">{setores.titulo}</TituloSecao>
          </div>
          <SetasCarrossel total={setores.lista.length} rotulo="setor" />
        </div>

        <ul
          data-carrossel-trilho
          data-arrastar
          aria-label="Setores atendidos"
          className="trilho relative mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 py-6 [perspective:1300px] md:gap-6 md:px-9 lg:pl-[max(2.25rem,calc((100vw-84rem)/2+2.25rem))]"
        >
          {setores.lista.map((s, i) => (
            <li
              key={s.id}
              data-slide
              aria-label={`${i + 1} de ${setores.lista.length}: ${s.nome}`}
              className="group relative aspect-[4/5] w-[74vw] shrink-0 snap-center overflow-hidden rounded-[1.75rem] shadow-[0_40px_80px_-40px_rgb(0_0_0/0.9)] [transform-style:preserve-3d] sm:w-[44vw] lg:aspect-[3/4] lg:h-[clamp(20rem,56svh,33rem)] lg:w-auto"
            >
              <span data-slide-img className="absolute -inset-x-[12%] inset-y-0 block">
                <Image
                  src={imagens[`setor-${s.id}`]}
                  alt=""
                  fill
                  draggable={false}
                  sizes="(min-width: 1024px) 34vw, (min-width: 640px) 54vw, 90vw"
                  quality={80}
                  className="object-cover transition-transform duration-[1.4s] ease-out-expo group-hover:scale-110"
                />
              </span>
              <span className="absolute inset-0 bg-gradient-to-t from-abismo via-abismo/40 to-transparent" aria-hidden="true" />
              <span className="font-display absolute right-5 top-4 text-[4.5rem] font-bold leading-none text-white/10" aria-hidden="true">
                0{i + 1}
              </span>
              <div className="absolute inset-x-0 bottom-0 p-6">
                <h3 className="font-display text-2xl font-semibold text-white md:text-[1.7rem]">{s.nome}</h3>
                <p className="mt-2 max-w-[22rem] text-sm leading-relaxed text-nevoa/85">{s.texto}</p>
                <span className="barra-marca mt-5 block origin-left scale-x-[0.35] transition-transform duration-700 ease-out-expo group-[.is-ativo]:scale-x-100" aria-hidden="true" />
              </div>
            </li>
          ))}
        </ul>
        <p className="container-site mt-2 flex flex-wrap items-center justify-between gap-3 text-xs text-mute">
          <span className="italic">Imagens ilustrativas.</span>
          <span className="flex items-center gap-2" aria-hidden="true">
            <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.6">
              <rect x="7" y="3" width="10" height="16" rx="5" />
              <path d="M12 7v3" strokeLinecap="round" />
            </svg>
            Role para ver os setores
          </span>
        </p>
      </div>
    </section>
  );
}
