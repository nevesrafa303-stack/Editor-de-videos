import { empresa, nav } from "@/content/site";
import { Logo } from "./Logo";
import { PreferenciasCookies } from "./PreferenciasCookies";

export function Footer({ ancoras = true }: { ancoras?: boolean }) {
  const prefixo = ancoras ? "" : "/";
  return (
    <footer className="border-t border-white/[0.07] bg-carbon">
      <div className="container-site grid gap-12 py-16 md:grid-cols-[2fr_1fr_1fr] md:py-20">
        <div>
          <Logo className="h-6 w-auto text-fog" />
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-mute">
            Aceleradora de marketing e vendas para corretoras de planos de saúde e seguros. Impulsionar, educar e acelerar empresas.
          </p>
          <p className="mt-5 text-sm text-mute">
            Sede física em {empresa.cidade}, {empresa.uf}
            <br />
            {empresa.horario}
          </p>
        </div>
        <nav aria-label="Rodapé">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white">Navegue</p>
          <ul className="mt-5 grid gap-3 text-sm text-mute">
            {nav.map((n) => (
              <li key={n.href}>
                <a href={`${prefixo}${n.href}`} className="transition hover:text-white">
                  {n.label}
                </a>
              </li>
            ))}
            <li>
              <a href={`${prefixo}#forms`} className="transition hover:text-white">
                Diagnóstico gratuito
              </a>
            </li>
          </ul>
        </nav>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white">Redes</p>
          <ul className="mt-5 grid gap-3 text-sm text-mute">
            {empresa.redes.map((r) => (
              <li key={r.nome}>
                <a href={r.url} target="_blank" rel="noopener noreferrer" className="transition hover:text-white">
                  {r.nome} <span className="sr-only">(abre em nova aba)</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div aria-hidden="true" className="container-site overflow-hidden pb-6 md:pb-10">
        <div data-rodape-marca>
          <Logo decorativo className="h-auto w-full text-fog" />
        </div>
      </div>
      <div className="border-t border-white/[0.07]">
        <div className="container-site flex flex-col gap-3 py-6 text-xs text-mute md:flex-row md:items-center md:justify-between">
          <p>
            © 2026 {empresa.nome}. Todos os direitos reservados. CNPJ {empresa.cnpj}
          </p>
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
