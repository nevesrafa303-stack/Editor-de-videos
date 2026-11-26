import Image from "next/image";
import { areasEquipe, equipe, lideranca } from "@/content/site";
import { imagens } from "@/lib/imagens";
import { TextoFundo } from "./TextoFundo";
import { Kicker, TituloSecao } from "./ui";

export function Equipe() {
  return (
    <section id="equipe" className="relative overflow-hidden bg-abismo py-24 md:py-32">
      {/* Arcos em degradê, como nas páginas de equipe da apresentação. */}
      <span aria-hidden="true" className="bg-degrade pointer-events-none absolute -right-40 -top-40 size-[26rem] rounded-full opacity-[0.12] blur-2xl" />
      <TextoFundo texto="Pessoas · Método · Presença" direcao="direita" className="top-[38%]" />
      <div className="container-site relative">
        <Kicker>Liderança Reforce</Kicker>
        <TituloSecao className="mt-6 max-w-3xl">Gente que já esteve na parada, no canteiro e na mesa de decisão</TituloSecao>

        <ul className="mt-14 grid gap-6 md:grid-cols-3">
          {lideranca.map((p) => (
            <li key={p.id} data-lider className="cartao group overflow-hidden">
              {/* Quadrado: rosto e ombros inteiros; a sombra fica só no pé da foto, abaixo do queixo. */}
              <div className="relative aspect-square overflow-hidden">
                <Image
                  src={imagens[p.id]}
                  alt={`${p.nome}, ${p.cargo}`}
                  fill
                  sizes="(min-width: 768px) 30vw, 92vw"
                  quality={80}
                  className="object-cover object-center transition-transform duration-[1.2s] ease-out-expo group-hover:scale-105"
                />
                <span className="absolute inset-x-0 bottom-0 h-1/5 bg-gradient-to-t from-[#04272c] to-transparent" aria-hidden="true" />
                <span className="font-display absolute right-4 top-4 rounded-full bg-abismo/80 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur">
                  +{p.anos} anos de experiência
                </span>
              </div>
              <div className="p-6 pt-2">
                <h3 className="font-display text-xl font-semibold text-white">{p.nome}</h3>
                <p className="font-display text-sm font-medium uppercase tracking-[0.12em] text-menta">{p.cargo}</p>
                <span className="barra-marca mt-4 block w-24" aria-hidden="true" />
                <p className="mt-4 text-[0.95rem] leading-relaxed text-mute">{p.bio}</p>
              </div>
            </li>
          ))}
        </ul>

        <div data-equipe className="mt-24">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <h3 className="font-display text-[clamp(1.7rem,3.4vw,2.6rem)] font-light leading-tight text-white">Equipe da Reforce</h3>
              <p className="mt-2 text-mute">Consultores de planejamento, materiais e administrativo, mobilizados onde o projeto está.</p>
            </div>
            <div role="group" aria-label="Filtrar equipe por área" className="flex flex-wrap gap-2">
              {areasEquipe.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  data-filtro={a.id}
                  aria-pressed={a.id === "todos"}
                  className="filtro rounded-full border border-white/15 px-4 py-2 text-sm text-nevoa transition hover:border-white/40"
                >
                  {a.rotulo}
                </button>
              ))}
            </div>
          </div>

          <ul data-equipe-grade className="mt-10 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-6" aria-live="polite">
            {equipe.map((p) => (
              <li key={p.id} data-area={p.area} data-pessoa className="pessoa group">
                <div className="relative aspect-square overflow-hidden rounded-[1.4rem] bg-petroleo">
                  <Image
                    src={imagens[p.id]}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 14vw, (min-width: 640px) 30vw, 45vw"
                    quality={75}
                    className="object-cover transition-transform duration-700 ease-out-expo group-hover:scale-105"
                  />
                </div>
                <span className="barra-marca mt-4 block" aria-hidden="true" />
                <p className="font-display mt-3 text-[0.95rem] font-semibold leading-tight text-white">{p.nome}</p>
                <p className="mt-0.5 text-xs uppercase tracking-wide text-mute">{p.cargo}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
