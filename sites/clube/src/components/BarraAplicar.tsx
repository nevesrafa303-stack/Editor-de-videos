import { cta, evento } from "@/content/site";
import { Seta } from "./ui";

// Celular: botão de ingresso fixo no rodapé da tela, com a barra de ingressos vendidos
// (iniciarBarraAplicar em src/lib/cabecalho.ts mostra e esconde).
export function BarraAplicar() {
  return (
    <div
      data-barra-aplicar
      inert
      className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-ink/85 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2.5 backdrop-blur-xl md:hidden"
    >
      <div className="mb-2 flex items-center gap-3 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-mute">
        <span className="h-1 flex-1 overflow-hidden rounded-full bg-white/10" aria-hidden="true">
          <span className="bg-ouro block h-full rounded-full" style={{ width: `${evento.vendidos}%` }} />
        </span>
        {evento.vendidos}% vendidos
      </div>
      <a
        href="#ingressos"
        data-cta="barra-celular"
        className="bg-ouro reflexo flex items-center justify-center gap-3 rounded-full px-6 py-3.5 font-bold text-ink"
      >
        {cta}
        <Seta className="size-4" />
      </a>
    </div>
  );
}
