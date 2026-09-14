/**
 * GERADO POR scripts/gen-permissions.mjs — nao edite a mao.
 *
 * Fonte: tabela `permission` do banco. Para alterar, mexa na migration de
 * dados de referencia e rode `npm run gen:permissions`.
 */

export type Permission =
  | "agenda.manage"
  | "appointment.cancel"
  | "appointment.read"
  | "appointment.write"
  | "audit.read"
  | "automation.read"
  | "automation.write"
  | "campaign.read"
  | "campaign.write"
  | "cash.audit"
  | "cash.close"
  | "cash.open"
  | "chart.amend"
  | "chart.read"
  | "chart.read_all"
  | "chart.sign"
  | "chart.write"
  | "commission.approve"
  | "commission.read"
  | "commission.read_all"
  | "consent.collect"
  | "consent.read"
  | "conversation.assign"
  | "conversation.read"
  | "conversation.write"
  | "inventory.adjust"
  | "inventory.count"
  | "inventory.read"
  | "inventory.write"
  | "lead.read"
  | "lead.write"
  | "lgpd.anonymize"
  | "lgpd.export"
  | "opportunity.read"
  | "opportunity.write"
  | "patient.delete"
  | "patient.read"
  | "patient.write"
  | "payable.read"
  | "payable.write"
  | "payment.register"
  | "payment.reverse"
  | "price.read"
  | "price.write"
  | "procedure.read"
  | "procedure.write"
  | "quote.accept"
  | "quote.approve_discount"
  | "quote.read"
  | "quote.write"
  | "receivable.read"
  | "receivable.write"
  | "report.clinical"
  | "report.export"
  | "report.financial"
  | "report.read"
  | "role.write"
  | "tenant.read"
  | "tenant.write"
  | "treatment_plan.execute"
  | "treatment_plan.read"
  | "treatment_plan.write"
  | "unit.read"
  | "unit.write"
  | "user.read"
  | "user.write";

export type SystemRoleCode = "owner" | "manager" | "professional" | "reception" | "finance";

/** Permissoes que dao acesso a dado de saude: exigem MFA e geram phi_access_log. */
export const PHI_PERMISSIONS: readonly Permission[] = [
  "chart.amend",
  "chart.read",
  "chart.read_all",
  "chart.sign",
  "chart.write",
  "lgpd.anonymize",
  "lgpd.export",
  "report.clinical",
  "treatment_plan.execute",
  "treatment_plan.read",
  "treatment_plan.write",
];

export const PERMISSION_META: Record<
  Permission,
  { resource: string; action: string; isPhi: boolean; description: string }
> = {
  "agenda.manage": { resource: "agenda", action: "manage", isPhi: false, description: "Definir disponibilidade, bloqueio e recursos" },
  "appointment.cancel": { resource: "appointment", action: "cancel", isPhi: false, description: "Cancelar e registrar falta" },
  "appointment.read": { resource: "appointment", action: "read", isPhi: false, description: "Ver agenda" },
  "appointment.write": { resource: "appointment", action: "write", isPhi: false, description: "Marcar e remarcar" },
  "audit.read": { resource: "audit", action: "read", isPhi: false, description: "Ver trilha de auditoria" },
  "automation.read": { resource: "automation", action: "read", isPhi: false, description: "Ver automacoes" },
  "automation.write": { resource: "automation", action: "write", isPhi: false, description: "Criar e editar automacoes" },
  "campaign.read": { resource: "campaign", action: "read", isPhi: false, description: "Ver campanhas" },
  "campaign.write": { resource: "campaign", action: "write", isPhi: false, description: "Criar e editar campanhas" },
  "cash.audit": { resource: "cash", action: "audit", isPhi: false, description: "Auditar caixa de outro operador" },
  "cash.close": { resource: "cash", action: "close", isPhi: false, description: "Fechar caixa" },
  "cash.open": { resource: "cash", action: "open", isPhi: false, description: "Abrir caixa" },
  "chart.amend": { resource: "chart", action: "amend", isPhi: true, description: "Registrar aditamento em evolucao fechada" },
  "chart.read": { resource: "chart", action: "read", isPhi: true, description: "Abrir prontuario dos proprios pacientes" },
  "chart.read_all": { resource: "chart", action: "read_all", isPhi: true, description: "Abrir prontuario de qualquer paciente" },
  "chart.sign": { resource: "chart", action: "sign", isPhi: true, description: "Assinar receituario e atestado" },
  "chart.write": { resource: "chart", action: "write", isPhi: true, description: "Registrar evolucao, anamnese e odontograma" },
  "commission.approve": { resource: "commission", action: "approve", isPhi: false, description: "Aprovar comissao para pagamento" },
  "commission.read": { resource: "commission", action: "read", isPhi: false, description: "Ver a propria comissao" },
  "commission.read_all": { resource: "commission", action: "read_all", isPhi: false, description: "Ver comissao de toda a equipe" },
  "consent.collect": { resource: "consent", action: "collect", isPhi: false, description: "Coletar e revogar consentimento" },
  "consent.read": { resource: "consent", action: "read", isPhi: false, description: "Ver consentimentos" },
  "conversation.assign": { resource: "conversation", action: "assign", isPhi: false, description: "Atribuir conversa a outra pessoa" },
  "conversation.read": { resource: "conversation", action: "read", isPhi: false, description: "Ver conversas de WhatsApp" },
  "conversation.write": { resource: "conversation", action: "write", isPhi: false, description: "Responder conversas" },
  "inventory.adjust": { resource: "inventory", action: "adjust", isPhi: false, description: "Ajustar saldo divergente" },
  "inventory.count": { resource: "inventory", action: "count", isPhi: false, description: "Realizar inventario" },
  "inventory.read": { resource: "inventory", action: "read", isPhi: false, description: "Ver estoque" },
  "inventory.write": { resource: "inventory", action: "write", isPhi: false, description: "Entrada, transferencia e baixa" },
  "lead.read": { resource: "lead", action: "read", isPhi: false, description: "Ver leads" },
  "lead.write": { resource: "lead", action: "write", isPhi: false, description: "Criar e editar leads" },
  "lgpd.anonymize": { resource: "lgpd", action: "anonymize", isPhi: true, description: "Anonimizar paciente" },
  "lgpd.export": { resource: "lgpd", action: "export", isPhi: true, description: "Exportar dados do titular" },
  "opportunity.read": { resource: "opportunity", action: "read", isPhi: false, description: "Ver funil" },
  "opportunity.write": { resource: "opportunity", action: "write", isPhi: false, description: "Mover oportunidade no funil" },
  "patient.delete": { resource: "patient", action: "delete", isPhi: false, description: "Inativar paciente" },
  "patient.read": { resource: "patient", action: "read", isPhi: false, description: "Ver cadastro de pacientes" },
  "patient.write": { resource: "patient", action: "write", isPhi: false, description: "Criar e editar pacientes" },
  "payable.read": { resource: "payable", action: "read", isPhi: false, description: "Ver contas a pagar" },
  "payable.write": { resource: "payable", action: "write", isPhi: false, description: "Lancar e pagar contas" },
  "payment.register": { resource: "payment", action: "register", isPhi: false, description: "Registrar recebimento" },
  "payment.reverse": { resource: "payment", action: "reverse", isPhi: false, description: "Estornar pagamento" },
  "price.read": { resource: "price", action: "read", isPhi: false, description: "Ver tabela de precos" },
  "price.write": { resource: "price", action: "write", isPhi: false, description: "Publicar nova tabela de precos" },
  "procedure.read": { resource: "procedure", action: "read", isPhi: false, description: "Ver catalogo de procedimentos" },
  "procedure.write": { resource: "procedure", action: "write", isPhi: false, description: "Editar catalogo e ficha tecnica" },
  "quote.accept": { resource: "quote", action: "accept", isPhi: false, description: "Registrar aceite do paciente" },
  "quote.approve_discount": { resource: "quote", action: "approve_discount", isPhi: false, description: "Aprovar desconto acima do teto" },
  "quote.read": { resource: "quote", action: "read", isPhi: false, description: "Ver orcamentos" },
  "quote.write": { resource: "quote", action: "write", isPhi: false, description: "Criar e editar orcamentos" },
  "receivable.read": { resource: "receivable", action: "read", isPhi: false, description: "Ver contas a receber" },
  "receivable.write": { resource: "receivable", action: "write", isPhi: false, description: "Criar e renegociar recebiveis" },
  "report.clinical": { resource: "report", action: "clinical", isPhi: true, description: "Ver relatorios clinicos" },
  "report.export": { resource: "report", action: "export", isPhi: false, description: "Exportar relatorio" },
  "report.financial": { resource: "report", action: "financial", isPhi: false, description: "Ver relatorios financeiros" },
  "report.read": { resource: "report", action: "read", isPhi: false, description: "Ver relatorios operacionais" },
  "role.write": { resource: "role", action: "write", isPhi: false, description: "Editar papeis e permissoes" },
  "tenant.read": { resource: "tenant", action: "read", isPhi: false, description: "Ver dados da rede" },
  "tenant.write": { resource: "tenant", action: "write", isPhi: false, description: "Editar dados e plano da rede" },
  "treatment_plan.execute": { resource: "treatment_plan", action: "execute", isPhi: true, description: "Marcar item como executado" },
  "treatment_plan.read": { resource: "treatment_plan", action: "read", isPhi: true, description: "Ver planos de tratamento" },
  "treatment_plan.write": { resource: "treatment_plan", action: "write", isPhi: true, description: "Montar plano e etapas" },
  "unit.read": { resource: "unit", action: "read", isPhi: false, description: "Ver unidades" },
  "unit.write": { resource: "unit", action: "write", isPhi: false, description: "Criar e editar unidades" },
  "user.read": { resource: "user", action: "read", isPhi: false, description: "Ver equipe" },
  "user.write": { resource: "user", action: "write", isPhi: false, description: "Convidar, editar e desativar membros" },
};

/** Recorte padrao de cada papel de sistema. Espelha system_role_permission. */
export const DEFAULT_ROLE_PERMISSIONS: Partial<Record<Permission, SystemRoleCode[]>> = {
  "agenda.manage": ["manager", "owner", "reception"],
  "appointment.cancel": ["manager", "owner", "professional", "reception"],
  "appointment.read": ["finance", "manager", "owner", "professional", "reception"],
  "appointment.write": ["manager", "owner", "professional", "reception"],
  "audit.read": ["manager", "owner"],
  "automation.read": ["manager", "owner"],
  "automation.write": ["manager", "owner"],
  "campaign.read": ["manager", "owner"],
  "campaign.write": ["manager", "owner"],
  "cash.audit": ["finance", "manager", "owner"],
  "cash.close": ["finance", "manager", "owner", "reception"],
  "cash.open": ["finance", "manager", "owner", "reception"],
  "chart.amend": ["manager", "owner", "professional"],
  "chart.read": ["manager", "owner", "professional"],
  "chart.read_all": ["manager", "owner"],
  "chart.sign": ["manager", "owner", "professional"],
  "chart.write": ["manager", "owner", "professional"],
  "commission.approve": ["finance", "manager", "owner"],
  "commission.read": ["manager", "owner", "professional"],
  "commission.read_all": ["finance", "manager", "owner"],
  "consent.collect": ["manager", "owner", "professional", "reception"],
  "consent.read": ["manager", "owner", "professional", "reception"],
  "conversation.assign": ["manager", "owner"],
  "conversation.read": ["manager", "owner", "reception"],
  "conversation.write": ["manager", "owner", "reception"],
  "inventory.adjust": ["manager", "owner"],
  "inventory.count": ["manager", "owner"],
  "inventory.read": ["finance", "manager", "owner", "professional", "reception"],
  "inventory.write": ["manager", "owner", "professional"],
  "lead.read": ["manager", "owner", "professional", "reception"],
  "lead.write": ["manager", "owner", "reception"],
  "lgpd.anonymize": ["owner"],
  "lgpd.export": ["manager", "owner"],
  "opportunity.read": ["manager", "owner", "professional", "reception"],
  "opportunity.write": ["manager", "owner", "professional", "reception"],
  "patient.delete": ["manager", "owner"],
  "patient.read": ["finance", "manager", "owner", "professional", "reception"],
  "patient.write": ["manager", "owner", "professional", "reception"],
  "payable.read": ["finance", "manager", "owner"],
  "payable.write": ["finance", "manager", "owner"],
  "payment.register": ["finance", "manager", "owner", "reception"],
  "payment.reverse": ["finance", "manager", "owner"],
  "price.read": ["finance", "manager", "owner", "professional", "reception"],
  "price.write": ["manager", "owner"],
  "procedure.read": ["finance", "manager", "owner", "professional", "reception"],
  "procedure.write": ["manager", "owner"],
  "quote.accept": ["manager", "owner"],
  "quote.approve_discount": ["manager", "owner"],
  "quote.read": ["finance", "manager", "owner", "professional", "reception"],
  "quote.write": ["manager", "owner", "professional", "reception"],
  "receivable.read": ["finance", "manager", "owner", "reception"],
  "receivable.write": ["finance", "manager", "owner"],
  "report.clinical": ["manager", "owner", "professional"],
  "report.export": ["finance", "manager", "owner"],
  "report.financial": ["finance", "manager", "owner"],
  "report.read": ["finance", "manager", "owner", "professional", "reception"],
  "role.write": ["manager", "owner"],
  "tenant.read": ["manager", "owner"],
  "tenant.write": ["owner"],
  "treatment_plan.execute": ["manager", "owner", "professional"],
  "treatment_plan.read": ["manager", "owner", "professional"],
  "treatment_plan.write": ["manager", "owner", "professional"],
  "unit.read": ["manager", "owner"],
  "unit.write": ["manager", "owner"],
  "user.read": ["manager", "owner"],
  "user.write": ["manager", "owner"],
};

export const ALL_PERMISSIONS = Object.keys(PERMISSION_META) as Permission[];

export function isPermission(value: string): value is Permission {
  return value in PERMISSION_META;
}

export function isPhiPermission(permission: Permission): boolean {
  return PERMISSION_META[permission].isPhi;
}
