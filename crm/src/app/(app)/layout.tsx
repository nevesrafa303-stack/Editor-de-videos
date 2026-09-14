import type { ReactNode } from "react";
import { requireTenant } from "@/server/tenant";
import { can, ROLE_LABEL, type Permission } from "@/server/permissions";
import { logout } from "@/server/actions/auth";
import { Sidebar, type NavItem } from "@/components/sidebar";

const NAV: (NavItem & { permission?: Permission })[] = [
  { href: "/painel", label: "Painel", icon: "dashboard" },
  { href: "/funil", label: "Funil de vendas", icon: "funnel", permission: "leads:read" },
  { href: "/agenda", label: "Agenda", icon: "calendar", permission: "agenda:read" },
  { href: "/pacientes", label: "Pacientes", icon: "users", permission: "patients:read" },
  { href: "/orcamentos", label: "Orçamentos", icon: "document", permission: "plans:read" },
  { href: "/financeiro", label: "Financeiro", icon: "money", permission: "finance:read" },
  { href: "/configuracoes", label: "Configurações", icon: "settings" },
];

export default async function AppLayout({ children }: { children: ReactNode }) {
  const { session } = await requireTenant();

  const items = NAV.filter(
    (item) => !item.permission || can(session.role, item.permission),
  ).map(({ href, label, icon }) => ({ href, label, icon }));

  return (
    <div className="lg:grid lg:min-h-screen lg:grid-cols-[240px_1fr]">
      <div className="lg:sticky lg:top-0 lg:h-screen">
        <Sidebar
          items={items}
          clinicName={session.clinicName}
          userName={session.name}
          roleLabel={ROLE_LABEL[session.role]}
          logout={logout}
        />
      </div>

      <main className="min-w-0 px-5 py-8 sm:px-8">
        <div className="mx-auto max-w-7xl">{children}</div>
      </main>
    </div>
  );
}
