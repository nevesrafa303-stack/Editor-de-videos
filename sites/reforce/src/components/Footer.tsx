import { marca, nav } from "@/content/site";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="relative border-t border-white/[0.07] bg-abismo pt-16 pb-10">
      <div className="container-site">
        <div className="grid gap-12 md:grid-cols-[1.3fr_1fr_1fr]">
          <div>
            <Logo className="h-7 w-auto text-white" />
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-mute">
              {marca.nome} | {marca.assinatura}. Planejamento que chega até a execução.
            </p>
          </div>
          <nav aria-label="Rodapé">
            <p className="font-display text-xs font-semibold uppercase tracking-[0.16em] text-menta">Navegação</p>
            <ul className="mt-4 grid gap-2.5 text-sm">
              {[...nav, { href: "#presenca", label: "Presença nacional" }, { href: "#contato", label: "Contato" }].map((n) => (
                <li key={n.href}>
                  <a href={n.href} className="text-nevoa/80 transition hover:text-white">
                    {n.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <div>
            <p className="font-display text-xs font-semibold uppercase tracking-[0.16em] text-menta">Contato</p>
            <ul className="mt-4 grid gap-2.5 text-sm text-nevoa/80">
              <li>
                <a href={`mailto:${marca.email}`} className="break-all transition hover:text-white">
                  {marca.email}
                </a>
              </li>
              <li>
                <a href={`https://wa.me/${marca.whatsapp}`} target="_blank" rel="noopener" className="transition hover:text-white">
                  {marca.telefone}
                  <span className="sr-only">(WhatsApp, abre em nova aba)</span>
                </a>
              </li>
              {marca.escritorios.map((e) => (
                <li key={e.cidade}>
                  {e.cidade} – {e.uf} <span className="text-mute">({e.tipo.toLowerCase()})</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-white/[0.07] pt-6 text-xs text-mute md:flex-row md:items-center md:justify-between">
          <p>© 2026 {marca.nome}. Todos os direitos reservados.</p>
          <p className="flex flex-wrap gap-x-5 gap-y-2">
            <a href="/politica-de-privacidade" className="transition hover:text-white">
              Política de privacidade
            </a>
            <span>
              Mapa:{" "}
              <a href="https://github.com/VictorCazanave/svg-maps" className="underline decoration-white/20 underline-offset-2 hover:text-white">
                SVG Maps
              </a>{" "}
              (CC BY 4.0)
            </span>
            <span>Imagens de setores meramente ilustrativas.</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
