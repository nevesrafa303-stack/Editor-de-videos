"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactElement } from "react";
import { cn } from "@/ui";
import {
  IconBox,
  IconCalendar,
  IconDocument,
  IconExit,
  IconFunnel,
  IconMoney,
  IconPeople,
  IconTooth,
} from "@/ui/icons";

export type UnitChoice = { id: string; name: string; city: string | null };

export type RailItem = {
  href: string;
  label: string;
  icon: string;
  /** Módulo modelado no banco, ainda sem tela. Aparece inativo, não some. */
  planned?: boolean;
};

const ICONS: Record<string, (props: { className?: string }) => ReactElement> = {
  people: IconPeople,
  calendar: IconCalendar,
  funnel: IconFunnel,
  document: IconDocument,
  money: IconMoney,
  box: IconBox,
};

export function Rail({
  items,
  clinicName,
  userName,
  roleName,
  units,
  activeUnitId,
  trocarUnidade,
  sair,
}: {
  items: RailItem[];
  clinicName: string;
  userName: string;
  roleName: string;
  units: UnitChoice[];
  activeUnitId: string | null;
  trocarUnidade: (formData: FormData) => Promise<void>;
  sair: () => Promise<void>;
}) {
  const pathname = usePathname();

  // Cidade só quando ela distingue: numa rede toda em São Paulo, repetir "São
  // Paulo" em cada opção só rouba espaço do nome da unidade.
  const mostrarCidade = new Set(units.map((u) => u.city)).size > 1;

  return (
    <nav className="flex h-full flex-col gap-6 border-r border-line bg-surface px-3 py-5">
      <div className="flex items-center gap-2.5 px-2">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-structure text-white">
          <IconTooth />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold text-ink">{clinicName}</span>
          <span className="font-mono block text-[10px] tracking-[0.1em] text-muted uppercase">
            {roleName}
          </span>
        </span>
      </div>

      {units.length > 1 ? (
        <form action={trocarUnidade} className="px-2">
          <label htmlFor="unitId" className="label">
            Unidade
          </label>
          <input type="hidden" name="de" value={pathname} />
          <select
            id="unitId"
            name="unitId"
            defaultValue={activeUnitId ?? ""}
            onChange={(e) => e.currentTarget.form?.requestSubmit()}
            className="field"
          >
            {units.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
                {mostrarCidade && u.city ? ` · ${u.city}` : ""}
              </option>
            ))}
          </select>
          {/* Sem JavaScript o select nao dispara sozinho; o botao garante. */}
          <noscript>
            <button type="submit" className="mt-1 text-xs text-structure underline">
              Trocar
            </button>
          </noscript>
        </form>
      ) : units.length === 1 ? (
        <p className="px-2">
          <span className="label">Unidade</span>
          <span className="block truncate text-sm text-ink-soft">{units[0]?.name}</span>
        </p>
      ) : null}

      <ul className="flex-1 space-y-0.5">
        {items.map((item) => {
          const Icon = ICONS[item.icon] ?? IconPeople;
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

          if (item.planned) {
            return (
              <li key={item.href}>
                <span
                  aria-disabled="true"
                  className="flex cursor-default items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted/55"
                >
                  <Icon className="text-muted/45" />
                  <span className="flex-1">{item.label}</span>
                  <span className="font-mono text-[9px] tracking-[0.08em] uppercase">breve</span>
                </span>
              </li>
            );
          }

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition",
                  active
                    ? "bg-structure-soft text-structure"
                    : "text-ink-soft hover:bg-sunken hover:text-ink",
                )}
              >
                <Icon className={active ? "text-structure" : "text-muted"} />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="border-t border-line pt-3">
        <p className="truncate px-3 text-sm font-medium text-ink">{userName}</p>
        <form action={sair}>
          <button
            type="submit"
            className="mt-1 flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted transition hover:bg-sunken hover:text-ink"
          >
            <IconExit className="text-muted" />
            Sair
          </button>
        </form>
      </div>
    </nav>
  );
}
