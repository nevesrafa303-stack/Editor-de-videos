import { cta } from "@/content/site";
import { FORM_URL } from "@/lib/aplicacao";
import { Seta } from "./ui";

// Celular: botão de aplicação fixo no rodapé da tela, que aparece depois da abertura e some quando a
// chamada final entra (iniciarBarraAplicar em src/lib/cabecalho.ts).
export function BarraAplicar() {
  return (
    <div
      data-barra-aplicar
      inert
      className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-ink/85 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl md:hidden"
    >
      <a
        href={FORM_URL}
        target="_blank"
        rel="noopener"
        data-aplicar
        data-cta="barra-celular"
        className="bg-ouro reflexo flex items-center justify-center gap-3 rounded-full px-6 py-3.5 font-bold text-ink"
      >
        {cta}
        <span className="sr-only">(abre em nova aba)</span>
        <Seta className="size-4" />
      </a>
    </div>
  );
}
