import { paraQuem } from "@/content/site";
import { Autodiagnostico } from "./Autodiagnostico";
import { Aplicar } from "./ui";

// "A RISE é pra você se…" vira um autodiagnóstico: cada item é uma caixa que a pessoa marca, e o medidor
// responde (src/lib/autodiagnostico.ts). "E não é pra você se…" segue informativo, marcado com a rolagem.
export function ParaQuem() {
  const { sim, nao } = paraQuem;
  return (
    <section id="para-quem" aria-labelledby="paraquem-titulo" className="py-24 md:py-36">
      <div className="container-site">
        <h2
          id="paraquem-titulo"
          data-split
          className="font-expanded text-[clamp(2rem,5vw,4rem)] font-bold uppercase leading-[0.96] tracking-tight text-white"
        >
          {paraQuem.titulo}
        </h2>
        <div className="mt-10 grid items-start gap-5 md:mt-14 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-6">
          <fieldset
            data-auto
            data-respostas={JSON.stringify(sim.respostas)}
            className="rounded-3xl border border-ouro/20 bg-gradient-to-b from-ouro/[0.07] to-transparent p-6 md:p-10"
          >
            <legend className="sr-only">{sim.titulo}</legend>
            <p aria-hidden="true" className="font-expanded text-xl font-bold uppercase text-white md:text-2xl">
              {sim.titulo}
            </p>
            <p className="mt-2 text-sm text-mute">{sim.instrucao}</p>
            <ul data-reveal="stagger" className="mt-5 divide-y divide-white/10">
              {sim.itens.map((item) => (
                <li key={item}>
                  <label className="auto-item flex cursor-pointer items-start gap-4 py-4 leading-snug text-fog transition-colors hover:text-white md:text-lg">
                    <input type="checkbox" name="autodiagnostico" value={item} className="sr-only" />
                    <span
                      aria-hidden="true"
                      className="auto-caixa mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg border border-white/25 transition-colors duration-300"
                    >
                      <svg viewBox="0 0 24 24" className="size-4" fill="none">
                        <path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                    {item}
                  </label>
                </li>
              ))}
            </ul>

            <div className="mt-6 rounded-2xl border border-white/10 bg-ink/70 p-5" aria-live="polite">
              <div className="flex items-baseline justify-between gap-4">
                <p className="text-sm text-mute">
                  <span data-auto-contagem className="font-expanded mr-1 text-3xl font-bold text-white">
                    0
                  </span>
                  de {sim.itens.length} marcados
                </p>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ouro">Perfil RISE</p>
              </div>
              <div aria-hidden="true" className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                <span
                  data-auto-barra
                  className="bg-ouro block h-full origin-left rounded-full transition-transform duration-500 ease-out-expo"
                  style={{ transform: "scaleX(0)" }}
                />
              </div>
              <p data-auto-resposta className="mt-3 font-semibold leading-snug text-fog">
                {sim.respostas[0]}
              </p>
              <div data-auto-cta hidden className="mt-5">
                <Aplicar local="autodiagnostico" className="w-full sm:w-auto" />
              </div>
            </div>
            <Autodiagnostico />
          </fieldset>

          <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 md:p-10">
            <h3 className="font-expanded text-xl font-bold uppercase text-fog md:text-2xl">{nao.titulo}</h3>
            <ul className="mt-6 divide-y divide-white/10">
              {nao.itens.map((item) => (
                <li key={item} data-check className="flex items-start gap-4 py-4 leading-snug text-mute md:text-lg">
                  <span aria-hidden="true" className="marca mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-white/[0.06] text-mute">
                    <svg viewBox="0 0 24 24" className="size-4" fill="none">
                      <path d="M7 7l10 10M17 7 7 17" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div data-reveal className="mt-12 flex justify-center">
          <Aplicar local="para-quem" className="w-full sm:w-auto" />
        </div>
      </div>
    </section>
  );
}
