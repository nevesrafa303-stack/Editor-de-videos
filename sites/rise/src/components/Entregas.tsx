import { entregas } from "@/content/site";
import { Icone } from "./Icones";
import { vars } from "./ui";

// Código de barras decorativo, sempre igual para o mesmo texto (não muda entre renderizações).
function CodigoBarras({ semente, className = "" }: { semente: string; className?: string }) {
  let h = 2166136261;
  for (const c of semente) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  const barras: { x: number; w: number }[] = [];
  let x = 0;
  while (x < 116) {
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    const w = 1 + (Math.abs(h) % 3);
    const espaco = 1 + ((Math.abs(h) >>> 4) % 3);
    barras.push({ x, w });
    x += w + espaco;
  }
  return (
    <svg viewBox="0 0 120 36" preserveAspectRatio="none" className={className} aria-hidden="true">
      {barras.map((b) => (
        <rect key={b.x} x={b.x} y="0" width={b.w} height="36" fill="currentColor" />
      ))}
    </svg>
  );
}

// "O que você recebe": quatro ingressos. No desktop a seção fixa e os ingressos saem de um monte no centro
// e se espalham até o lugar; no celular entram girando um a um (data-entregas em src/lib/motion.ts).
export function Entregas() {
  return (
    <section id="entregas" data-entregas aria-labelledby="entregas-titulo" className="relative overflow-clip py-24 md:py-36 lg:py-0">
      <div data-entregas-palco className="lg:flex lg:min-h-[100svh] lg:flex-col lg:justify-center lg:py-24">
        <div className="container-site">
          <h2
            id="entregas-titulo"
            data-split
            className="font-expanded max-w-[16ch] text-[clamp(2rem,5vw,4rem)] font-bold uppercase leading-[0.96] tracking-tight text-white"
          >
            {entregas.titulo}
          </h2>

          <ul data-ingressos className="mt-10 grid gap-5 sm:grid-cols-2 md:mt-14 lg:grid-cols-4">
            {entregas.itens.map((item, i) => (
              <li key={item.titulo} data-ingresso className="drop-shadow-[0_28px_36px_rgba(0,0,0,0.65)] [perspective:1200px]">
                <article
                  data-ingresso-cartao
                  className="ingresso relative flex h-full min-h-[21rem] flex-col rounded-[22px] bg-papel text-ink lg:min-h-[25rem]"
                  style={vars({ "--picote": "calc(100% - 4.5rem)" })}
                >
                  <div className="flex flex-1 flex-col p-6">
                    <div className="flex items-start justify-between">
                      <span className="grid size-12 place-items-center rounded-xl bg-[#e8a64f] text-ink">
                        <Icone nome={item.icone} className="size-6" />
                      </span>
                      <span className="text-[0.7rem] font-semibold tracking-[0.12em] text-ink/70">Nº {String(i + 1).padStart(2, "0")}</span>
                    </div>
                    <h3 className="mt-auto pt-10 text-[1.4rem] font-bold leading-[1.08] tracking-tight">{item.titulo}</h3>
                    <p className="mt-3 text-[0.93rem] leading-snug text-ink/70">{item.texto}</p>
                  </div>
                  <div aria-hidden="true" className="absolute inset-x-6 bottom-[4.5rem] border-t-2 border-dashed border-ink/25" />
                  <span aria-hidden="true" className="ingresso-brilho pointer-events-none absolute inset-0 rounded-[22px]" />
                  <div className="flex h-[4.5rem] items-center justify-between px-6">
                    <span className="text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-ink/70">Mentoria RISE</span>
                    <CodigoBarras semente={item.titulo} className="h-8 w-28 text-ink" />
                  </div>
                </article>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
