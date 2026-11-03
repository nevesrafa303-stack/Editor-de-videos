import { paraQuem } from "@/content/site";
import { Cabecalho } from "./Cabecalho";
import { Perfil } from "./Perfil";
import { Cta } from "./ui";

// "Para quem é": um painel de chaves (o mesmo desenho do site atual) que a pessoa liga. O medidor responde e,
// com 3 ou mais ligadas, aparece o botão de ingresso (src/lib/perfil.ts).
export function ParaQuem() {
  // O fim da frase ("e não apenas ter tudo organizado") fica apagado, como uma ressalva.
  const [resumo, ressalva] = paraQuem.resumo.split(", e não apenas ");
  return (
    <section id="para-quem" aria-labelledby="paraquem-titulo" className="relative border-y border-white/10 bg-carbon py-24 md:py-32">
      <div className="container-site">
        <Cabecalho id="paraquem-titulo" titulo={paraQuem.titulo} intro={paraQuem.intro} className="max-w-4xl" />

        <div
          data-perfil
          data-reveal
          data-respostas={JSON.stringify(paraQuem.respostas)}
          className="mx-auto mt-12 max-w-2xl overflow-hidden rounded-[28px] border border-white/10 bg-ink md:mt-14"
        >
          <p className="border-b border-white/10 px-6 py-4 text-center text-sm text-mute md:px-8">{paraQuem.instrucao}</p>
          <ul>
            {paraQuem.itens.map((item) => (
              <li key={item} className="border-b border-white/10 last:border-b-0">
                <button
                  type="button"
                  role="switch"
                  aria-checked="false"
                  data-cursor="Ligar"
                  className="flex w-full items-center justify-between gap-5 px-6 py-5 text-left text-base leading-snug text-fog transition-colors hover:bg-white/[0.03] aria-checked:text-white md:px-8 md:text-lg"
                >
                  {item}
                  <span className="chave" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
          <div className="border-t border-white/10 bg-graphite px-6 py-6 text-center md:px-8" aria-live="polite">
            <p className="font-expanded text-sm font-bold uppercase tracking-wide text-white">
              <span data-perfil-contagem>0</span> de {paraQuem.itens.length}
            </p>
            <span aria-hidden="true" className="mx-auto mt-3 block h-1.5 max-w-xs overflow-hidden rounded-full bg-white/10">
              <span
                data-perfil-barra
                className="block h-full origin-left rounded-full bg-verde transition-transform duration-500 ease-out-expo"
                style={{ transform: "scaleX(0)" }}
              />
            </span>
            <p data-perfil-resposta className="mx-auto mt-4 max-w-md text-pretty font-semibold leading-snug text-fog">
              {paraQuem.respostas[0]}
            </p>
            <div data-perfil-cta hidden className="mt-5">
              <Cta local="perfil" className="w-full sm:w-auto">
                {paraQuem.cta}
              </Cta>
            </div>
          </div>
          <Perfil />
        </div>

        <p data-reveal className="font-expanded mx-auto mt-16 max-w-3xl text-balance text-center text-[clamp(1.25rem,2.5vw,2rem)] font-bold leading-[1.25] tracking-tight text-white md:mt-20">
          {resumo}
          {ressalva && <span className="text-mute">, e não apenas {ressalva}</span>}
        </p>
      </div>
    </section>
  );
}
