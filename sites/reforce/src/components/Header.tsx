import { cta, nav } from "@/content/site";
import { Logo } from "./Logo";
import { SetaDiagonal } from "./ui";

// Cabeçalho fixo. O comportamento (rolagem, menu do celular) é ligado por lib/cabecalho.ts no
// componente Interacoes, o mesmo código da prévia em arquivo único.
export function Header() {
  return (
    <header
      data-header
      data-menu="false"
      className="group/header fixed inset-x-0 top-0 z-50 border-b border-transparent transition-[translate,background-color,border-color] duration-500 ease-out-expo data-[menu=true]:border-white/[0.07] data-[menu=true]:bg-abismo/95 data-[menu=true]:backdrop-blur-xl data-[oculto=true]:-translate-y-full data-[rolou=true]:border-white/[0.07] data-[rolou=true]:bg-abismo/80 data-[rolou=true]:backdrop-blur-xl"
    >
      <div className="container-site flex h-16 items-center justify-between gap-6 md:h-20">
        <a href="#topo" className="text-white" aria-label="Reforce Consultoria, voltar ao início">
          <Logo className="h-[1.05rem] w-auto md:h-[1.3rem]" decorativo />
        </a>

        <nav aria-label="Principal" className="hidden items-center gap-8 lg:flex">
          {nav.map((item) => (
            <a
              key={item.href}
              href={item.href}
              data-nav-link
              className="relative py-2 text-sm font-medium text-mute transition hover:text-white data-[ativo=true]:text-white after:absolute after:inset-x-0 after:-bottom-0.5 after:h-0.5 after:origin-left after:scale-x-0 after:rounded after:bg-degrade after:transition-transform after:duration-500 data-[ativo=true]:after:scale-x-100"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <p className="hidden items-center gap-2 text-xs text-mute xl:flex" aria-hidden="true">
            Avanço da leitura
            <span data-avanco className="font-display w-9 tabular-nums font-semibold text-white">
              0%
            </span>
          </p>
          <a
            href="#contato"
            data-cta
            className="hidden items-center gap-2 rounded-full bg-white px-5 py-2.5 font-display text-sm font-semibold text-abismo transition hover:bg-menta sm:inline-flex"
          >
            {cta}
            <SetaDiagonal className="size-3.5" />
          </a>
          <button
            type="button"
            className="group/menu grid size-11 place-items-center rounded-full border border-white/15 lg:hidden"
            aria-expanded="false"
            aria-controls="menu-mobile"
            aria-label="Abrir menu"
          >
            <span className="relative block h-3 w-5" aria-hidden="true">
              <span className="absolute left-0 top-0 h-0.5 w-5 bg-nevoa transition group-aria-expanded/menu:translate-y-[5px] group-aria-expanded/menu:rotate-45" />
              <span className="absolute bottom-0 left-0 h-0.5 w-5 bg-nevoa transition group-aria-expanded/menu:-translate-y-[5px] group-aria-expanded/menu:-rotate-45" />
            </span>
          </button>
        </div>
      </div>

      <nav id="menu-mobile" aria-label="Menu" hidden className="container-site pb-6 pt-2 lg:hidden">
        <ul className="flex flex-col">
          {nav.map((item, i) => (
            <li key={item.href}>
              <a
                href={item.href}
                className="font-display flex items-center justify-between border-b border-white/[0.07] py-4 text-xl font-light text-white"
              >
                {item.label}
                <span className="text-xs tabular-nums text-mute">0{i + 1}</span>
              </a>
            </li>
          ))}
        </ul>
        <a
          href="#contato"
          data-cta
          className="bg-degrade font-display mt-5 flex items-center justify-center gap-2 rounded-full px-5 py-4 font-semibold text-abismo"
        >
          {cta}
          <SetaDiagonal className="size-4" />
        </a>
      </nav>

      <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-0.5 overflow-hidden">
        <span data-progresso className="bg-degrade block h-full w-full origin-left" style={{ transform: "scaleX(0)" }} />
      </span>
    </header>
  );
}
