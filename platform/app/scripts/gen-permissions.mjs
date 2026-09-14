/**
 * Gera src/shared/permissions.ts a partir do catalogo no banco.
 *
 * A lista de permissoes e dado (tabela `permission`), nao constante no codigo.
 * Gerar o tipo daqui faz o TypeScript recusar `assert('quote.aprovar')` — erro
 * de digitacao em permissao seria uma falha silenciosa de seguranca.
 *
 * Uso: node scripts/gen-permissions.mjs
 */
import { writeFileSync } from "node:fs";
import pg from "pg";
import "dotenv/config";

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

const { rows } = await client.query(`
  select p.key, p.resource, p.action, p.description, p.is_phi,
         coalesce(array_agg(srp.role_code order by srp.role_code)
                  filter (where srp.role_code is not null), '{}') as roles
  from permission p
  left join system_role_permission srp on srp.permission_key = p.key
  group by p.key, p.resource, p.action, p.description, p.is_phi
  order by p.key
`);
await client.end();

const union = rows.map((r) => `  | "${r.key}"`).join("\n");
const phi = rows.filter((r) => r.is_phi).map((r) => `  "${r.key}",`).join("\n");
const meta = rows
  .map(
    (r) =>
      `  "${r.key}": { resource: "${r.resource}", action: "${r.action}", ` +
      `isPhi: ${r.is_phi}, description: ${JSON.stringify(r.description)} },`,
  )
  .join("\n");
const defaults = rows
  .filter((r) => r.roles.length > 0)
  .map((r) => `  "${r.key}": [${r.roles.map((c) => `"${c}"`).join(", ")}],`)
  .join("\n");

writeFileSync(
  new URL("../src/shared/permissions.ts", import.meta.url),
  `/**
 * GERADO POR scripts/gen-permissions.mjs — nao edite a mao.
 *
 * Fonte: tabela \`permission\` do banco. Para alterar, mexa na migration de
 * dados de referencia e rode \`npm run gen:permissions\`.
 */

export type Permission =
${union};

export type SystemRoleCode = "owner" | "manager" | "professional" | "reception" | "finance";

/** Permissoes que dao acesso a dado de saude: exigem MFA e geram phi_access_log. */
export const PHI_PERMISSIONS: readonly Permission[] = [
${phi}
];

export const PERMISSION_META: Record<
  Permission,
  { resource: string; action: string; isPhi: boolean; description: string }
> = {
${meta}
};

/** Recorte padrao de cada papel de sistema. Espelha system_role_permission. */
export const DEFAULT_ROLE_PERMISSIONS: Partial<Record<Permission, SystemRoleCode[]>> = {
${defaults}
};

export const ALL_PERMISSIONS = Object.keys(PERMISSION_META) as Permission[];

export function isPermission(value: string): value is Permission {
  return value in PERMISSION_META;
}

export function isPhiPermission(permission: Permission): boolean {
  return PERMISSION_META[permission].isPhi;
}
`,
  "utf8",
);

console.log(`${rows.length} permissoes geradas`);
