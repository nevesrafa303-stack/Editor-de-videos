import type { StaticImageData } from "next/image";
import { placas } from "@/content/site";
import g2v from "@/assets/img/placas/g2v-company.webp";
import lure from "@/assets/img/placas/lure-digital.webp";
import lvx from "@/assets/img/placas/lvx-digital.webp";
import suntech from "@/assets/img/placas/suntech-midia.webp";
import vitor from "@/assets/img/placas/vitor-hugo-marketproads.webp";
import whale from "@/assets/img/placas/whale-marketing.webp";
import { PrintPlaca } from "./PrintPlaca";

const prints: Record<string, StaticImageData> = {
  "placa-lure-digital": lure,
  "placa-lvx-digital": lvx,
  "placa-suntech-midia": suntech,
  "placa-whale-marketing": whale,
  "placa-vitor-hugo-marketproads": vitor,
  "placa-g2v-company": g2v,
};

const reais = (mil: number) => `R$ ${mil.toLocaleString("pt-BR")} mil`;

// Cada placa: faturamento antes e depois da RISE em barras que crescem com a rolagem, e o print original.
export function Placas() {
  return (
    <section id="resultados" aria-labelledby="resultados-titulo" className="py-24 md:py-36">
      <div className="container-site">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-end">
          <h2
            id="resultados-titulo"
            data-split
            className="font-expanded text-[clamp(2rem,5vw,4rem)] font-bold uppercase leading-[0.96] tracking-tight text-white"
          >
            {placas.titulo}
          </h2>
          <p data-reveal className="max-w-md leading-relaxed text-mute md:text-lg lg:justify-self-end">
            {placas.intro}
          </p>
        </div>

        <ul data-placas className="mt-10 grid gap-4 sm:grid-cols-2 md:mt-14 lg:grid-cols-3">
          {placas.itens.map((p) => {
            const vezes = (p.depois / p.antes).toLocaleString("pt-BR", { maximumFractionDigits: 1 });
            return (
              <li
                key={p.agencia}
                data-placa
                className="flex flex-col rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.05] to-white/[0.01] p-6 md:p-7"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold leading-tight text-white">{p.agencia}</h3>
                    {p.pessoa && <p className="mt-1 text-sm text-mute">{p.pessoa}</p>}
                  </div>
                  <p className="font-expanded texto-ouro shrink-0 text-2xl font-bold leading-none md:text-3xl" aria-label={`${vezes} vezes`}>
                    {vezes}×
                  </p>
                </div>

                <div className="mt-8 flex h-40 items-end gap-3" aria-hidden="true">
                  <div className="flex h-full flex-1 flex-col justify-end">
                    <span
                      data-barra
                      className="block w-full origin-bottom rounded-t-xl bg-white/15"
                      style={{ height: `${Math.max(8, (p.antes / p.depois) * 100)}%` }}
                    />
                  </div>
                  <div className="flex h-full flex-1 flex-col justify-end">
                    <span data-barra className="bg-ouro block h-full w-full origin-bottom rounded-t-xl" />
                  </div>
                </div>

                <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-white/10 pt-4">
                  <div>
                    <dt className="text-xs uppercase tracking-[0.14em] text-mute">Antes da RISE</dt>
                    <dd className="font-expanded mt-1 text-lg font-bold text-fog">{reais(p.antes)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-[0.14em] text-mute">Faturamento atingido</dt>
                    <dd className="font-expanded mt-1 text-lg font-bold text-white">
                      R$ <span data-count={p.depois}>{p.depois}</span> mil
                    </dd>
                  </div>
                </dl>

                <PrintPlaca imagem={prints[p.imagem]} alt={`Print da #PlacaRISE de ${p.agencia}: ${reais(p.antes)} antes, ${reais(p.depois)} de MRR depois.`} />
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
