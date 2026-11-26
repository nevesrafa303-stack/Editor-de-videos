import { numeros } from "@/content/site";

function formatar(valor: number, decimais = 0) {
  return valor.toLocaleString("pt-BR", { minimumFractionDigits: decimais, maximumFractionDigits: decimais });
}

// Faixa de números logo depois da abertura: contam até o valor quando entram na tela.
export function Numeros() {
  return (
    <section aria-label="A Reforce em números" className="relative border-b border-white/[0.07] bg-abismo">
      <dl data-reveal="stagger" className="container-site grid grid-cols-2 gap-x-6 gap-y-10 py-14 md:py-20 lg:grid-cols-4">
        {numeros.map((n) => (
          <div key={n.rotulo} className="relative flex flex-col pl-5">
            <span className="barra-marca-v absolute left-0 top-1 h-[calc(100%-0.5rem)] w-[3px]" aria-hidden="true" />
            <dt className="order-2 mt-2 max-w-[15rem] text-sm leading-snug text-mute">{n.rotulo}</dt>
            <dd className="font-display -order-1 whitespace-nowrap text-[clamp(1.7rem,4.6vw,3.6rem)] font-semibold leading-none tracking-tight text-white">
              {n.prefixo}
              <span data-count={n.valor} data-decimais={n.decimais ?? 0}>
                {formatar(n.valor, n.decimais)}
              </span>
              {n.sufixo}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
