import { numeros } from "@/content/site";

// Números da operação que os participantes veem por dentro: contam ao entrar na tela.
export function Numeros() {
  return (
    <section aria-labelledby="numeros-titulo" className="py-24 md:py-32">
      <div className="container-site">
        <h2 id="numeros-titulo" data-reveal className="mx-auto max-w-xl text-center text-sm font-semibold uppercase tracking-[0.22em] text-mute">
          {numeros.titulo}
        </h2>
        <dl data-reveal="stagger" className="mt-12 grid grid-cols-2 gap-y-12 md:mt-16 lg:grid-cols-4">
          {numeros.itens.map((n, i) => (
            <div
              key={n.rotulo}
              data-spotlight
              className={`flex flex-col items-center px-4 text-center md:px-8 ${i % 2 ? "border-l border-white/10" : ""} ${i > 0 ? "lg:border-l lg:border-white/10" : ""}`}
            >
              <dt className="order-2 mt-4 max-w-[16rem] text-sm leading-snug text-mute md:text-base">{n.rotulo}</dt>
              <dd className="font-expanded order-1 whitespace-nowrap text-[clamp(1.6rem,7.6vw,3.4rem)] lg:text-[clamp(2.6rem,3.6vw,3.6rem)] font-bold leading-none text-white">
                <span className="text-ouro">{n.prefixo}</span>
                <span data-count={n.valor}>{n.valor}</span>
                <span className="text-ouro">{n.unidade}</span>
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
