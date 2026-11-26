import { numeros } from "@/content/site";

function formatar(valor: number, decimais = 0) {
  return valor.toLocaleString("pt-BR", { minimumFractionDigits: decimais, maximumFractionDigits: decimais });
}

// Faixa de números logo depois da abertura: cada número vira de baixo para cima (3D) e conta até o valor.
export function Numeros() {
  return (
    <section data-numeros aria-label="A Reforce em números" className="relative border-b border-white/[0.07] bg-abismo">
      <dl className="container-site grid grid-cols-2 gap-x-6 gap-y-10 py-14 [perspective:900px] md:py-20 lg:grid-cols-4">
        {numeros.map((n) => (
          <div key={n.rotulo} data-numero className="relative flex flex-col pl-5">
            <span data-barra-v className="barra-marca-v absolute left-0 top-1 h-[calc(100%-0.5rem)] w-[3px] origin-top" aria-hidden="true" />
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
