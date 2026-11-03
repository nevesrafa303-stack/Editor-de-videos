import { evento, ingressos } from "@/content/site";
import { Cabecalho } from "./Cabecalho";
import { Simbolo } from "./Logo";
import { Cta, vars } from "./ui";

// Ingressos Black e Diamond. Cada benefício tem a chave do site atual: as incluídas ligam em sequência
// quando o cartão entra na tela; as que o ingresso não tem ficam desligadas e riscadas.
export function Ingressos() {
  return (
    <section id="ingressos" aria-labelledby="ingressos-titulo" className="relative overflow-clip py-24 md:py-32">
      <div className="container-site relative">
        <Cabecalho id="ingressos-titulo" titulo={ingressos.titulo} intro={`${ingressos.aviso}: são só ${evento.vagas} vagas por edição.`} />
        <div className="text-center">
          <div data-reveal className="mx-auto mt-8 max-w-md">
            <p className="flex items-baseline justify-between text-sm text-mute">
              <span>
                <span className="font-expanded text-2xl font-bold text-white">
                  <span data-count={evento.vendidos}>{evento.vendidos}</span>%
                </span>{" "}
                dos ingressos vendidos
              </span>
              <span>{evento.vagas} vagas</span>
            </p>
            <span className="mt-3 block h-2 overflow-hidden rounded-full bg-white/10" aria-hidden="true">
              <span
                data-vendidos
                className="bg-ouro block h-full origin-left rounded-full"
                style={{ width: `${evento.vendidos}%` }}
              />
            </span>
          </div>
        </div>

        <ul className="mx-auto mt-14 grid max-w-5xl grid-cols-1 items-start gap-6 md:grid-cols-2">
          {ingressos.itens.map((ing) => (
            <li key={ing.nome} data-ingresso className="drop-shadow-[0_30px_40px_rgba(0,0,0,0.6)] [perspective:1400px]">
              <article
                data-ingresso-cartao
                aria-label={`Ingresso ${ing.nome}${ing.esgotado ? " (esgotado)" : ""}`}
                className={`ingresso @container relative flex flex-col overflow-hidden rounded-[28px] border ${
                  ing.esgotado ? "border-white/10 bg-graphite" : "border-ouro/40 bg-gradient-to-b from-[#1d1812] to-graphite"
                }`}
                style={vars({ "--picote": "calc(100% - 15.5rem)" })}
              >
                <div className="p-7 md:p-8">
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="font-expanded text-2xl font-bold uppercase text-white md:text-3xl">
                      <span className="block text-xs font-semibold tracking-[0.2em] text-mute">Ingresso</span>
                      {ing.nome}
                    </h3>
                    {ing.esgotado ? (
                      <p
                        aria-hidden="true"
                        className="carimbo font-expanded shrink-0 rounded-md border-2 border-brasa/80 px-2.5 py-1 text-sm font-black uppercase tracking-[0.1em] text-brasa md:text-base"
                      >
                        Esgotado
                      </p>
                    ) : (
                      <Simbolo id={`ingresso-simbolo-${ing.nome}`} className="size-10" />
                    )}
                  </div>
                  <ul data-beneficios className="mt-7 grid gap-3.5">
                    {ingressos.beneficios.map((b, i) => {
                      const incluso = i < ing.inclui;
                      return (
                        <li
                          key={b}
                          data-chave-item
                          data-ligado={incluso ? undefined : "false"}
                          className={`flex items-center gap-3 text-[0.95rem] leading-snug ${incluso ? "text-fog" : "text-mute/70 line-through"}`}
                        >
                          <span className="chave" aria-hidden="true" />
                          <span>
                            {b}
                            {!incluso && <span className="sr-only"> (não incluso)</span>}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                <div aria-hidden="true" className="mx-7 border-t-2 border-dashed border-white/15 md:mx-8" />

                <div className="flex h-[15.5rem] flex-col justify-center p-7 md:p-8">
                  <p className="text-sm text-mute">
                    de <span className="line-through">{ing.de}</span> por
                  </p>
                  <p className="font-expanded mt-1 text-[min(2.8rem,8cqi)] font-bold leading-none text-white">{ing.parcelas}</p>
                  <p className="mt-2 text-sm text-fog">
                    ou <strong className="text-ouro">{ing.pix}</strong> à vista no Pix
                  </p>
                  {ing.esgotado ? (
                    <p className="mt-6 inline-flex w-full items-center justify-center rounded-full border border-white/15 px-7 py-4 text-sm font-bold uppercase tracking-[0.16em] text-mute">
                      Ingresso esgotado
                    </p>
                  ) : (
                    <Cta href={ing.link} local={`ingresso-${ing.nome.toLowerCase()}`} rotulo="Quero" className="mt-6 w-full">
                      Quero o ingresso {ing.nome}
                    </Cta>
                  )}
                </div>

                <span aria-hidden="true" className="ingresso-brilho pointer-events-none absolute inset-0 rounded-[28px]" />
              </article>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
