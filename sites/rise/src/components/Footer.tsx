import { cta, marca, nav } from "@/content/site";
import { FORM_URL } from "@/lib/aplicacao";
import { Logo } from "./Logo";
import { PreferenciasCookies } from "./PreferenciasCookies";

export function Footer({ ancoras = true }: { ancoras?: boolean }) {
  const prefixo = ancoras ? "" : "/";
  return (
    <footer className="border-t border-white/[0.07] bg-carbon">
      <div className="container-site flex flex-col gap-10 py-14 md:flex-row md:items-start md:justify-between md:py-20">
        <div>
          <Logo className="h-7 w-auto text-white" />
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-mute">
            Mentoria anual de aceleração para donos de agência, com {marca.mentor} e a estrutura da LAKS Company.
          </p>
        </div>
        <nav aria-label="Rodapé">
          <ul className="grid gap-3 text-sm text-mute sm:grid-cols-2 sm:gap-x-12">
            {nav.map((n) => (
              <li key={n.href}>
                <a href={`${prefixo}${n.href}`} className="transition hover:text-white">
                  {n.label}
                </a>
              </li>
            ))}
            <li>
              <a href={FORM_URL} target="_blank" rel="noopener" data-aplicar data-cta="rodape" className="font-semibold text-ouro transition hover:text-white">
                {cta}
                <span className="sr-only">(abre em nova aba)</span>
              </a>
            </li>
          </ul>
        </nav>
      </div>
      <div aria-hidden="true" className="container-site overflow-hidden pb-6 md:pb-10">
        <div data-rodape-marca>
          <Logo decorativo gradiente registro={false} className="h-auto w-full opacity-90" />
        </div>
      </div>
      <div className="border-t border-white/[0.07]">
        <div className="container-site flex flex-col gap-3 py-6 text-xs text-mute md:flex-row md:items-center md:justify-between">
          <p>Copyright © 2026 {marca.nome}. Todos os direitos reservados.</p>
          <p className="flex gap-5">
            <a href="/politica-de-privacidade" className="transition hover:text-white">
              Política de privacidade
            </a>
            <PreferenciasCookies />
          </p>
        </div>
      </div>
    </footer>
  );
}
