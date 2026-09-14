"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/components/ui";
import {
  IconCalendar,
  IconDashboard,
  IconDocument,
  IconFunnel,
  IconLogout,
  IconMoney,
  IconSettings,
  IconTooth,
  IconUsers,
} from "@/components/icons";

export type NavItem = { href: string; label: string; icon: string };

const ICONS: Record<string, (props: { className?: string }) => React.ReactElement> = {
  dashboard: IconDashboard,
  funnel: IconFunnel,
  calendar: IconCalendar,
  users: IconUsers,
  document: IconDocument,
  money: IconMoney,
  settings: IconSettings,
};

export function Sidebar({
  items,
  clinicName,
  userName,
  roleLabel,
  logout,
}: {
  items: NavItem[];
  clinicName: string;
  userName: string;
  roleLabel: string;
  logout: () => Promise<void>;
}) {
  const pathname = usePathname();

  return (
    <nav className="flex h-full flex-col gap-6 border-r border-slate-200 bg-white px-4 py-5">
      <Link href="/painel" className="flex items-center gap-2 px-2">
        <span className="flex size-9 items-center justify-center rounded-lg bg-brand-600 text-white">
          <IconTooth />
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-semibold text-slate-900">OdontoCRM</span>
          <span className="block truncate text-xs text-slate-500">{clinicName}</span>
        </span>
      </Link>

      <ul className="flex-1 space-y-0.5">
        {items.map((item) => {
          const Icon = ICONS[item.icon] ?? IconDashboard;
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
                  active
                    ? "bg-brand-50 text-brand-800"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                )}
              >
                <Icon className={active ? "text-brand-600" : "text-slate-400"} />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="border-t border-slate-100 pt-4">
        <p className="truncate px-3 text-sm font-medium text-slate-800">{userName}</p>
        <p className="px-3 text-xs text-slate-500">{roleLabel}</p>

        <form action={logout}>
          <button
            type="submit"
            className="mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <IconLogout className="text-slate-400" />
            Sair
          </button>
        </form>
      </div>
    </nav>
  );
}
