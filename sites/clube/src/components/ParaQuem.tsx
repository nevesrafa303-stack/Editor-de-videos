import { paraQuem } from "@/content/site";
import { Cabecalho } from "./Cabecalho";
import { Perfil } from "./Perfil";
import { Cta } from "./ui";

// "Para quem é" como um diagnóstico: a pessoa liga as chaves que valem para a agência dela e o medidor
// em anel acende um segmento por chave; a resposta muda e, com 3 ou mais, aparece o botão de ingresso
// (src/lib/perfil.ts). Desktop: título e medidor à esquerda (o medidor acompanha a rolagem), chaves à direita.
export function ParaQuem() {
  // O fim da frase de resumo ("e não apenas ter tudo organizado") fica apagado, como uma ressalva.
  const [resumo, ressalva] = paraQuem.resumo.split(", e não apenas ");
  const total = paraQuem.itens.length;
  return (
    <section id="para-quem" aria-labelledby="paraquem-titulo" className="relative border-y border-white/10 bg-carbon py-24 md:py-32">
      <div className="container-site">
        <div
          data-perfil
          data-respostas={JSON.stringify(paraQuem.respostas)}
          className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:grid-rows-[auto_1fr] lg:gap-x-20 lg:gap-y-12"
        >
          <Cabecalho id="paraquem-titulo" titulo={paraQuem.titulo} destaque="time, método e escala" intro={paraQuem.intro} esquerda />

          <div data-reveal className="overflow-hidden rounded-[28px] border border-white/10 bg-ink lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-center">
            <p className="border-b border-white/10 px-6 py-4 text-sm text-mute md:px-8">{paraQuem.instrucao}</p>
            <ul>
              {paraQuem.itens.map((item, i) => (
                <li key={item} className="border-b border-white/10 last:border-b-0">
                  <button
                    type="button"
                    role="switch"
                    aria-checked="false"
                    data-cursor="Ligar"
                    className="group flex w-full items-center gap-5 px-6 py-5 text-left text-base leading-snug text-fog transition-colors hover:bg-white/[0.03] aria-checked:bg-ouro/[0.05] aria-checked:text-white md:px-8 md:py-6 md:text-lg"
                  >
                    <span aria-hidden="true" className="font-expanded w-6 shrink-0 text-xs font-bold text-mute transition-colors group-aria-checked:text-ouro">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="flex-1">{item}</span>
                    <span className="chave" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Medidor: um segmento do anel por chave ligada. */}
          <div data-reveal className="flex flex-col items-center gap-6 text-center sm:flex-row sm:text-left lg:sticky lg:top-28 lg:self-start" aria-live="polite">
            <div className="relative grid size-40 shrink-0 place-items-center">
              <svg viewBox="0 0 120 120" className="absolute inset-0 size-full -rotate-90" aria-hidden="true">
                {Array.from({ length: total }, (_, i) => (
                  <circle
                    key={i}
                    data-segmento
                    cx="60"
                    cy="60"
                    r="52"
                    pathLength={100}
                    className="perfil-segmento"
                    style={{ strokeDasharray: `${100 / total - 2.4} 100`, strokeDashoffset: -(i * 100) / total }}
                  />
                ))}
              </svg>
              <p className="font-expanded leading-none text-white">
                <span data-perfil-contagem className="text-5xl font-bold">
                  0
                </span>
                <span className="text-lg font-bold text-mute">/{total}</span>
              </p>
            </div>
            <div className="max-w-sm">
              <p data-perfil-resposta className="font-expanded text-pretty text-lg font-bold leading-snug text-white md:text-xl">
                {paraQuem.respostas[0]}
              </p>
              <div data-perfil-cta hidden className="mt-5">
                <Cta local="perfil" className="w-full sm:w-auto">
                  {paraQuem.cta}
                </Cta>
              </div>
            </div>
          </div>
          <Perfil />
        </div>

        <p
          data-reveal
          className="font-expanded mx-auto mt-20 max-w-4xl text-balance text-center text-[clamp(1.25rem,2.4vw,1.95rem)] font-bold leading-[1.28] tracking-tight text-white md:mt-28"
        >
          {resumo}
          {ressalva && <span className="text-mute">, e não apenas {ressalva}</span>}
        </p>
      </div>
    </section>
  );
}
