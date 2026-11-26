import { cases } from "@/content/site";
import { TextoFundo } from "./TextoFundo";
import { Kicker, SeloSeta, TituloSecao, vars } from "./ui";

const fmt = (v: number, d = 1) => v.toLocaleString("pt-BR", { minimumFractionDigits: d, maximumFractionDigits: d });

// Cases empilhados: cada cartão gruda no topo e o próximo sobe por cima (só CSS, position: sticky).
export function Cases() {
  const { valor, projetos } = cases;
  const totalProjetos = projetos.lista.reduce((s, p) => s + p.valor, 0);
  return (
    <section id="cases" className="relative overflow-x-clip bg-abismo py-24 md:py-32">
      <TextoFundo texto="Resultados" className="top-8" />
      <div className="container-site relative">
        <Kicker>{cases.kicker}</Kicker>
        <TituloSecao className="mt-6 max-w-3xl">{cases.titulo}</TituloSecao>

        <ol className="mt-14 grid gap-8 lg:gap-[18vh]">
          {cases.lista.map((c, i) => (
            <li
              key={c.id}
              id={c.id}
              data-case
              className="relative grid overflow-hidden rounded-[2rem] border border-white/[0.08] shadow-[0_-30px_80px_-30px_rgb(0_0_0/0.7)] lg:sticky lg:grid-cols-[0.9fr_1.1fr]"
              style={{ top: `calc(5.5rem + ${i * 1.25}rem)` }}
            >
              <span data-case-sombra className="pointer-events-none absolute inset-0 z-10 bg-abismo opacity-0" aria-hidden="true" />
              <div className="relative bg-papel p-7 text-tinta sm:p-10">
                <div className="flex items-center gap-4">
                  <SeloSeta className="size-12" />
                  <span className="font-display text-sm font-semibold uppercase tracking-[0.16em] text-tinta/80">Case {c.numero}</span>
                </div>
                <h3 className="font-display mt-8 text-[clamp(1.8rem,3.6vw,2.9rem)] font-light uppercase leading-[1.05] tracking-tight">
                  {c.titulo}
                </h3>
                <p className="mt-6 max-w-md leading-relaxed text-tinta/75">{c.contexto}</p>
                <p className="font-display mt-6 max-w-md text-xl font-medium leading-snug">{c.destaque}</p>
                <span className="font-display pointer-events-none absolute -bottom-10 right-4 text-[9rem] font-bold leading-none text-tinta/[0.06]" aria-hidden="true">
                  {c.numero}
                </span>
              </div>

              <div className="relative bg-[linear-gradient(160deg,#06363d,#021c20_70%)] p-7 sm:p-10">
                <p className="font-display texto-degrade text-4xl font-light">Resultados</p>
                {"metricas" in c && c.metricas ? (
                  <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-7 sm:grid-cols-3">
                    {c.metricas.map((m, j) => (
                      <div key={m.rotulo} data-case-item className={`flex flex-col ${j === c.metricas.length - 1 ? "col-span-2 sm:col-span-1" : ""}`}>
                        <dt className="order-2 mt-1.5 text-sm leading-snug text-mute">{m.rotulo}</dt>
                        <dd className="font-display text-[clamp(2rem,3.4vw,2.8rem)] font-semibold leading-none text-white">
                          <span data-count={m.valor}>{m.valor.toLocaleString("pt-BR")}</span>
                          <span className="text-menta">{m.sufixo}</span>
                        </dd>
                      </div>
                    ))}
                  </dl>
                ) : null}
                {"itens" in c && c.itens ? (
                  <ul className="mt-8 grid gap-5">
                    {c.itens.map((it, j) => (
                      <li key={it.valor} data-case-item className="flex gap-5 border-t border-white/[0.08] pt-5">
                        <span className="font-display grid size-10 shrink-0 place-items-center rounded-xl bg-verde text-sm font-semibold text-abismo">
                          {j + 1}
                        </span>
                        <p className="leading-relaxed text-mute">
                          <strong className="font-display block text-2xl font-semibold text-white">{it.valor}</strong>
                          {it.texto}
                        </p>
                      </li>
                    ))}
                  </ul>
                ) : null}
                {"registro" in c && c.registro ? (
                  <blockquote data-case-item className="mt-8 rounded-2xl bg-abismo/60 p-5 ring-1 ring-white/[0.06]">
                    <p className="font-display text-xs font-semibold uppercase tracking-[0.14em] text-menta">Registro gerencial</p>
                    <p className="mt-2 text-[0.95rem] leading-relaxed text-nevoa/90">{c.registro}</p>
                  </blockquote>
                ) : null}
              </div>
            </li>
          ))}
        </ol>

        {/* Valor capturado: barra empilhada que cresce com a rolagem. */}
        <div id="valor" data-valor className="cartao relative mt-24 overflow-hidden p-7 sm:p-12">
          <span className="pointer-events-none absolute -left-20 -top-28 size-80 rounded-full bg-laranja/10 blur-3xl" aria-hidden="true" />
          <div className="relative grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-end">
            <div>
              <h3 className="font-display text-[clamp(1.7rem,3.4vw,2.6rem)] font-light leading-tight text-white">{valor.titulo}</h3>
              <p className="mt-3 text-mute">{valor.periodo}</p>
            </div>
            <p data-valor-total className="font-display text-right text-[clamp(3.6rem,10vw,7.5rem)] font-semibold leading-none tracking-tight text-white lg:text-right">
              R$ <span data-count={valor.total} data-decimais="1">{fmt(valor.total)}</span>
              <span className="texto-degrade"> mi</span>
            </p>
          </div>
          <div className="relative mt-10 flex h-16 gap-1.5 overflow-hidden rounded-2xl" role="img" aria-label="Case 2: R$ 3,5 milhões. Case 3: R$ 2,6 milhões. Total: R$ 6,1 milhões.">
            {valor.partes.map((p, i) => (
              <div
                key={p.rotulo}
                data-valor-parte
                className={`relative flex items-center px-4 ${i === 0 ? "bg-[linear-gradient(90deg,#4fd1a5,#2fbf9a)]" : "bg-[linear-gradient(90deg,#c9a77b,#f7852a)]"} origin-left`}
                style={{ flexGrow: p.valor, ...vars({ "--i": i }) }}
              >
                <span className="font-display text-lg font-semibold text-abismo">R$ {fmt(p.valor)} mi</span>
              </div>
            ))}
          </div>
          <div className="mt-3 flex justify-between gap-4 text-sm text-mute">
            {valor.partes.map((p) => (
              <span key={p.rotulo}>{p.rotulo}</span>
            ))}
          </div>
        </div>

        {/* Projetos em andamento: o tamanho de cada barra é a fatia do total de R$ 520 mi. */}
        <div id="projetos" className="mt-24">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <h3 className="font-display text-[clamp(1.7rem,3.4vw,2.6rem)] font-light leading-tight text-white">{projetos.titulo}</h3>
              <p className="mt-3 text-mute">{projetos.texto}</p>
            </div>
            <p className="font-display text-mute">
              Total em projetos de capital <strong className="block text-4xl font-semibold text-white">R$ {totalProjetos} mi</strong>
            </p>
          </div>
          <ul className="mt-10 grid gap-5 md:grid-cols-3">
            {projetos.lista.map((p) => (
              <li key={p.nome} data-projeto className="cartao lanterna relative overflow-hidden p-7">
                <div className="flex items-center justify-between">
                  <SeloSeta className="size-11" />
                  <span className="bg-degrade font-display rounded-full px-4 py-1.5 text-sm font-bold text-abismo">R$ {p.valor} mi</span>
                </div>
                <h4 className="font-display texto-degrade mt-7 text-2xl font-bold uppercase tracking-wide">{p.nome}</h4>
                <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/[0.07]" aria-hidden="true">
                  <span data-barra-proporcao className="bg-degrade block h-full origin-left rounded-full" style={{ width: `${(p.valor / totalProjetos) * 100}%` }} />
                </div>
                <p className="mt-2 text-xs text-mute">{Math.round((p.valor / totalProjetos) * 100)}% do total em andamento</p>
                <ul className="mt-6 grid gap-2.5 border-t border-white/[0.08] pt-5">
                  {p.itens.map((it) => (
                    <li key={it} className="flex items-center gap-3 text-[0.95rem] text-nevoa/90">
                      <span className="size-1.5 rounded-full bg-menta" aria-hidden="true" />
                      {it}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
