import type { Role } from "@/generated/prisma/enums";

/**
 * Matriz de permissoes por papel. Uma clínica mistura perfis com necessidades
 * bem diferentes: a recepção marca e remarca o dia inteiro mas não pode abrir
 * prontuário; o financeiro ve recebíveis mas não evolução clínica.
 */
export const PERMISSIONS = [
  "clinic:manage",
  "users:manage",
  "patients:read",
  "patients:write",
  "leads:read",
  "leads:write",
  "agenda:read",
  "agenda:write",
  "clinical:read",
  "clinical:write",
  "plans:read",
  "plans:write",
  "finance:read",
  "finance:write",
  "reports:read",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

const MATRIX: Record<Role, Permission[]> = {
  OWNER: [...PERMISSIONS],
  ADMIN: PERMISSIONS.filter((p) => p !== "clinic:manage"),
  PROFESSIONAL: [
    "patients:read",
    "patients:write",
    "leads:read",
    "leads:write",
    "agenda:read",
    "agenda:write",
    "clinical:read",
    "clinical:write",
    "plans:read",
    "plans:write",
    "finance:read",
  ],
  RECEPTION: [
    "patients:read",
    "patients:write",
    "leads:read",
    "leads:write",
    "agenda:read",
    "agenda:write",
    "plans:read",
    "finance:read",
  ],
  FINANCE: [
    "patients:read",
    "agenda:read",
    "plans:read",
    "finance:read",
    "finance:write",
    "reports:read",
  ],
};

export function can(role: Role, permission: Permission): boolean {
  return MATRIX[role].includes(permission);
}

export const ROLE_LABEL: Record<Role, string> = {
  OWNER: "Proprietário",
  ADMIN: "Gestor",
  PROFESSIONAL: "Profissional",
  RECEPTION: "Recepção",
  FINANCE: "Financeiro",
};

export const ROLE_DESCRIPTION: Record<Role, string> = {
  OWNER: "Acesso total, incluindo dados da clínica e usuários.",
  ADMIN: "Gerencia a operação inteira, menos os dados cadastrais da clínica.",
  PROFESSIONAL: "Agenda, prontuário e orçamentos dos seus atendimentos.",
  RECEPTION: "Agenda, pacientes e funil. Não acessa prontuário.",
  FINANCE: "Recebíveis, pagamentos e relatórios. Não acessa prontuário.",
};
