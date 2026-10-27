"use client";

import { useEffect, useState } from "react";
import { cta, nav } from "@/content/site";
import { FORM_URL } from "@/lib/aplicacao";
import { iniciarBarraAplicar, iniciarCabecalho } from "@/lib/cabecalho";
import { Logo } from "./Logo";

export function Header() {
  const [menu, setMenu] = useState(false);

  useEffect(() => iniciarCabecalho(), []);
  useEffect(() => iniciarBarraAplicar(), []);

  useEffect(() => {
    if (!menu) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenu(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menu]);

  return (
    <header
      data-header
      data-menu={menu}
      className="fixed inset-x-0 top-0 z-50 border-b border-transparent transition-[transform,background-color,border-color] duration-500 ease-out-expo data-[menu=true]:border-white/[0.07] data-[menu=true]:bg-ink/90 data-[menu=true]:backdrop-blur-xl data-[oculto=true]:-translate-y-full data-[rolou=true]:border-white/[0.07] data-[rolou=true]:bg-ink/80 data-[rolou=true]:backdrop-blur-xl"
    >
      <div className="container-site flex h-16 items-center justify-between md:h-20">
        <a href="#topo" className="text-white" aria-label="Mentoria RISE, voltar ao início" onClick={() => setMenu(false)}>
          <Logo className="h-[1.15rem] w-auto md:h-6" decorativo />
        </a>

        <nav aria-label="Principal" className="hidden items-center gap-10 md:flex">
          {nav.map((item) => (
            <a key={item.href} href={item.href} data-nav-link className="text-sm font-medium text-mute transition hover:text-white">
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <a
            href={FORM_URL}
            target="_blank"
            rel="noopener"
            data-aplicar
            data-cta="header"
            className="cta-borda hidden rounded-full px-5 py-2.5 text-sm font-semibold text-white sm:inline-flex"
          >
            {cta}
            <span className="sr-only">(abre em nova aba)</span>
          </a>
          <button
            type="button"
            className="grid size-11 place-items-center rounded-full border border-white/15 md:hidden"
            aria-expanded={menu}
            aria-controls="menu-mobile"
            aria-label={menu ? "Fechar menu" : "Abrir menu"}
            onClick={() => setMenu((v) => !v)}
          >
            <span className="relative block h-3 w-5" aria-hidden="true">
              <span className={`absolute left-0 top-0 h-0.5 w-5 bg-fog transition ${menu ? "translate-y-[5px] rotate-45" : ""}`} />
              <span className={`absolute bottom-0 left-0 h-0.5 w-5 bg-fog transition ${menu ? "-translate-y-[5px] -rotate-45" : ""}`} />
            </span>
          </button>
        </div>
      </div>

      <nav id="menu-mobile" aria-label="Menu" hidden={!menu} className="container-site pb-6 pt-2 md:hidden">
        <ul className="flex flex-col">
          {nav.map((item) => (
            <li key={item.href}>
              <a
                href={item.href}
                onClick={() => setMenu(false)}
                className="font-expanded block border-b border-white/[0.07] py-4 text-lg font-semibold uppercase"
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
        <a
          href={FORM_URL}
          target="_blank"
          rel="noopener"
          data-aplicar
          data-cta="menu"
          onClick={() => setMenu(false)}
          className="bg-ouro mt-5 flex justify-center rounded-full px-5 py-4 font-bold text-ink"
        >
          {cta}
          <span className="sr-only">(abre em nova aba)</span>
        </a>
      </nav>

      <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-px overflow-hidden">
        <span data-progresso className="bg-ouro block h-full w-full origin-left" style={{ transform: "scaleX(0)" }} />
      </span>
    </header>
  );
}
