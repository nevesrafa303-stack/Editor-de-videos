import { evento, nav } from "@/content/site";
import { Logo } from "./Logo";
import { PreferenciasCookies } from "./PreferenciasCookies";

export function Footer({ ancoras = true }: { ancoras?: boolean }) {
  const prefixo = ancoras ? "" : "/";
  return (
    <footer className="border-t border-white/[0.07] bg-carbon pb-28 md:pb-0">
      <div className="container-site flex flex-col gap-10 py-14 md:flex-row md:items-start md:justify-between md:py-20">
        <div>
          <Logo className="h-12 w-auto text-white" />
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-mute">
            Imersão presencial para donos de agência em {evento.cidade}. Realização Skill Sales.
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
              <a href={`${prefixo}#ingressos`} data-cta="rodape" className="font-semibold text-ouro transition hover:text-white">
                Garantir ingresso
              </a>
            </li>
          </ul>
        </nav>
      </div>
      <div aria-hidden="true" className="container-site overflow-hidden pb-6 md:pb-10">
        <div data-rodape-marca>
          <Logo decorativo className="h-auto w-full text-white/90" />
        </div>
      </div>
      <div className="border-t border-white/[0.07]">
        <div className="container-site flex flex-col gap-3 py-6 text-xs text-mute md:flex-row md:items-center md:justify-between">
          <p>Copyright © 2026 Skill Sales. Todos os direitos reservados.</p>
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
