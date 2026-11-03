import Image, { type StaticImageData } from "next/image";
import { mentores } from "@/content/site";
import gabriel from "@/assets/img/mentor-gabriel.webp";
import hermano from "@/assets/img/mentor-hermano.webp";
import saimon from "@/assets/img/mentor-saimon.webp";
import { Cabecalho } from "./Cabecalho";
import { Verificado } from "./ui";

const fotos: Record<string, StaticImageData> = { hermano, saimon, gabriel };

// Mentores como cartas: no desktop saem de um monte no centro e se abrem lado a lado com a rolagem; com o
// mouse, cada carta inclina e brilha e as outras se apagam (foco); src/lib/motion.ts e globals.css. A bio
// fica embaixo, alinhada à esquerda (leitura de texto longo).
export function Mentores() {
  return (
    <section id="mentores" aria-labelledby="mentores-titulo" className="relative overflow-clip border-t border-white/10 bg-carbon py-24 md:py-32">
      <div className="container-site">
        <Cabecalho id="mentores-titulo" titulo={mentores.titulo} intro="Quem constrói a operação da LAKS no dia a dia é quem sobe ao palco." lado />
        <ul data-mentores className="mt-12 grid gap-14 md:mt-16 md:grid-cols-3 md:gap-6 lg:gap-8">
          {mentores.itens.map((m) => (
            <li key={m.id} data-mentor className="flex flex-col">
              <div data-mentor-carta className="w-full [perspective:1200px]">
                <figure
                  data-mentor-figura
                  className="relative overflow-hidden rounded-[26px] border border-white/10 bg-[#2b2b2b] shadow-[0_30px_60px_-28px_rgba(0,0,0,0.9)]"
                >
                  <Image
                    src={fotos[m.id]}
                    alt={`${m.nome}${m.apelido ? `, o ${m.apelido}` : ""}`}
                    sizes="(min-width: 768px) 30vw, 90vw"
                    data-mentor-foto
                    className="aspect-[9/10] h-auto w-full object-cover"
                  />
                  <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/90 to-transparent px-5 pb-4 pt-12 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-fog">
                    {m.tema}
                  </figcaption>
                  <span aria-hidden="true" className="ingresso-brilho pointer-events-none absolute inset-0" />
                </figure>
              </div>
              <div data-reveal className="mt-6 max-w-md">
                <h3 className="font-expanded inline-flex items-center gap-2 text-lg font-bold uppercase text-white xl:text-xl">
                  {m.nome}
                  <Verificado className="size-5 shrink-0" />
                </h3>
                <a
                  href={`https://www.instagram.com/${m.instagram}/`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 block text-sm text-ouro transition hover:text-white"
                >
                  @{m.instagram}
                  <span className="sr-only"> no Instagram (abre em nova aba)</span>
                </a>
                <div className="mt-4 grid gap-3 text-pretty leading-relaxed text-mute">
                  {m.bio.map((b) => (
                    <p key={b}>{b}</p>
                  ))}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
