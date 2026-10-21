"use client";

import { useEffect, useState } from "react";
import { nav } from "@/content/site";
import { track } from "@/lib/tracking";
import { Logo } from "./Logo";

export function Header() {
  const [rolou, setRolou] = useState(false);
  const [menu, setMenu] = useState(false);

  useEffect(() => {
    const onScroll = () => setRolou(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!menu) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenu(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menu]);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,backdrop-filter] duration-500 ${
        rolou || menu ? "border-b border-white/[0.07] bg-ink/75 backdrop-blur-xl" : "border-b border-transparent"
      }`}
    >
      <div className="container-site flex h-16 items-center justify-between md:h-20">
        <a href="#topo" className="text-fog" aria-label="LAKS Company, voltar ao início" onClick={() => setMenu(false)}>
          <Logo className="h-5 w-auto md:h-6" />
        </a>

        <nav aria-label="Principal" className="hidden items-center gap-9 md:flex">
          {nav.map((item) => (
            <a key={item.href} href={item.href} className="text-sm font-medium text-mute transition hover:text-white">
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <a
            href="#forms"
            onClick={() => track("cta_clique", { local: "header" })}
            className="hidden rounded-full bg-laranja px-5 py-2.5 text-sm font-semibold text-ink transition hover:bg-laranja-claro sm:inline-flex"
          >
            Diagnóstico gratuito
          </a>
          <button
            type="button"
            className="grid size-11 place-items-center rounded-full border border-white/10 md:hidden"
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

      <nav
        id="menu-mobile"
        aria-label="Menu"
        hidden={!menu}
        className="container-site border-t border-white/[0.07] pb-6 pt-2 md:hidden"
      >
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
          href="#forms"
          onClick={() => {
            setMenu(false);
            track("cta_clique", { local: "menu" });
          }}
          className="mt-5 flex justify-center rounded-full bg-laranja px-5 py-4 font-semibold text-ink"
        >
          Quero meu diagnóstico gratuito
        </a>
      </nav>
    </header>
  );
}
