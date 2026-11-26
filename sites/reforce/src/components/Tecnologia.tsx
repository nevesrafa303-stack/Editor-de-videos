import Image from "next/image";
import { tecnologia } from "@/content/site";
import { imagens } from "@/lib/imagens";
import { Kicker, TituloSecao, vars } from "./ui";

// Painéis reais da Reforce (telas da apresentação) numa moldura que inclina com o mouse; os números
// principais flutuam ao lado. Clicar na tela abre a imagem inteira.
export function Tecnologia() {
  return (
    <section id="tecnologia" className="relative overflow-hidden bg-abismo py-24 md:py-32">
      <div className="malha absolute inset-0 opacity-60" aria-hidden="true" />
      <div className="container-site relative">
        <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="max-w-3xl">
            <Kicker>{tecnologia.kicker}</Kicker>
            <TituloSecao className="mt-6">{tecnologia.titulo}</TituloSecao>
          </div>
          <p data-reveal className="max-w-md text-lg leading-relaxed text-mute">
            {tecnologia.texto}
          </p>
        </div>

        <div data-abas className="mt-14">
          <div role="tablist" aria-label="Painéis de gestão" className="inline-flex rounded-full border border-white/10 bg-white/[0.03] p-1.5">
            {tecnologia.paineis.map((p, i) => (
              <button
                key={p.id}
                type="button"
                role="tab"
                id={`aba-painel-${p.id}`}
                aria-controls={`painel-tela-${p.id}`}
                aria-selected={i === 0}
                tabIndex={i === 0 ? 0 : -1}
                className="font-display rounded-full px-5 py-2.5 text-sm font-medium text-mute transition-colors aria-selected:bg-white aria-selected:text-abismo"
              >
                {p.rotulo}
              </button>
            ))}
          </div>

          {tecnologia.paineis.map((p, i) => (
            <div
              key={p.id}
              id={`painel-tela-${p.id}`}
              role="tabpanel"
              aria-labelledby={`aba-painel-${p.id}`}
              hidden={i !== 0}
              className="painel-aba mt-8 grid items-center gap-10 lg:grid-cols-[0.75fr_1.25fr]"
            >
              <div>
                <h3 className="font-display text-[clamp(1.6rem,3vw,2.2rem)] font-medium text-white">{p.titulo}</h3>
                <p className="mt-4 text-lg leading-relaxed text-mute">{p.texto}</p>
                <dl className="mt-8 grid grid-cols-3 gap-3">
                  {p.kpis.map((k) => (
                    <div key={k.rotulo} className="cartao flex flex-col p-4">
                      <dt className="order-2 mt-1 text-[0.72rem] leading-snug text-mute">{k.rotulo}</dt>
                      <dd className={`font-display text-xl font-semibold sm:text-2xl ${"alerta" in k && k.alerta ? "text-laranja" : "text-white"}`}>
                        {k.valor}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>

              <div data-inclina className="[perspective:1400px]">
                <button
                  type="button"
                  data-abre-visor={`visor-${p.id}`}
                  data-inclina-alvo
                  className="group relative block w-full overflow-hidden rounded-[1.25rem] bg-white p-1.5 text-left shadow-[0_50px_120px_-40px_rgb(0_0_0/0.9),0_0_0_1px_rgb(255_255_255/0.08)] transition-transform duration-300 ease-out [transform-style:preserve-3d]"
                  aria-label={`Ampliar: ${p.alt}`}
                >
                  <Image
                    src={imagens[p.imagem]}
                    alt={p.alt}
                    sizes="(min-width: 1024px) 58vw, 92vw"
                    quality={80}
                    className="h-auto w-full rounded-[0.9rem]"
                  />
                  <span className="font-display absolute bottom-4 right-4 inline-flex items-center gap-2 rounded-full bg-abismo/85 px-3.5 py-2 text-xs font-medium text-white opacity-0 backdrop-blur transition group-hover:opacity-100 group-focus-visible:opacity-100">
                    Ampliar painel
                  </span>
                </button>
                <p className="mt-3 text-xs text-mute">
                  Tela real de acompanhamento ({p.rotulo.toLowerCase()}).
                </p>
              </div>

              <dialog id={`visor-${p.id}`} className="visor" aria-label={p.titulo}>
                <div className="relative">
                  <Image src={imagens[p.imagem]} alt={p.alt} sizes="92vw" quality={80} className="h-auto max-h-[86vh] w-auto rounded-xl bg-white" />
                  <form method="dialog">
                    <button type="submit" aria-label="Fechar" className="absolute -top-3 -right-3 grid size-10 place-items-center rounded-full bg-white text-abismo shadow-lg">
                      <svg viewBox="0 0 20 20" className="size-4" fill="none" aria-hidden="true">
                        <path d="m5 5 10 10M15 5 5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    </button>
                  </form>
                </div>
              </dialog>
            </div>
          ))}
        </div>

        {/* Faixa de recursos de gestão visual. */}
        <ul data-reveal="stagger" className="mt-16 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Previsto x realizado", "Avanço acumulado e por turno, com desvio calculado na hora."],
            ["Restrições críticas", "Status, criticidade, responsável e dias para o prazo."],
            ["Atualização automática", "Informação célere para quem decide no campo e no escritório."],
            ["Gestão visual", "Painéis que qualquer equipe entende na reunião diária."],
          ].map(([t, d], i) => (
            <li key={t} className="cartao lanterna p-5" style={vars({ "--i": i })}>
              <p className="font-display font-semibold text-white">{t}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-mute">{d}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
