import type { ReactNode } from "react";
import { requireSession } from "@/server/next/session";
import { withPage } from "@/server/next/page";
import { sairAction, trocarUnidadeAction } from "@/modules/auth/actions";
import { listReachableUnits } from "@/modules/auth/units";
import { Rail, type RailItem } from "@/ui/rail";
import type { Permission } from "@/shared/permissions";

/**
 * Os módulos marcados como `planned` estão modelados no banco e ainda não têm
 * tela. Aparecem inativos em vez de sumir: quem usa precisa saber que o produto
 * tem essa forma, e quem constrói precisa ver o que falta.
 */
const NAV: (RailItem & { permission?: Permission })[] = [
  { href: "/pacientes", label: "Pacientes", icon: "people", permission: "patient.read" },
  { href: "/agenda", label: "Agenda", icon: "calendar", permission: "appointment.read" },
  { href: "/funil", label: "Funil", icon: "funnel", permission: "opportunity.read" },
  { href: "/orcamentos", label: "Orçamentos", icon: "document", permission: "quote.read" },
  { href: "/financeiro", label: "Financeiro", icon: "money", permission: "receivable.read" },
  { href: "/convenios", label: "Convênios", icon: "card", permission: "price.read" },
  { href: "/faturamento", label: "Faturamento", icon: "clipboard", permission: "claim.read" },
  { href: "/estoque", label: "Estoque", icon: "box", permission: "inventory.read", planned: true },
];

export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await requireSession();
  const units = await withPage((ctx) => listReachableUnits(ctx));

  const items = NAV.filter(
    (item) => !item.permission || session.permissions.has(item.permission),
  ).map(({ href, label, icon, planned }) => ({
    href,
    label,
    icon,
    ...(planned ? { planned } : {}),
  }));

  return (
    <div className="lg:grid lg:min-h-screen lg:grid-cols-[232px_minmax(0,1fr)]">
      <div className="lg:sticky lg:top-0 lg:h-screen">
        <Rail
          items={items}
          clinicName={session.tenantName}
          userName={session.userName}
          roleName={session.roleCode}
          units={units}
          activeUnitId={session.activeUnitId}
          trocarUnidade={trocarUnidadeAction}
          sair={sairAction}
        />
      </div>

      <main className="min-w-0 px-5 py-8 sm:px-8">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
