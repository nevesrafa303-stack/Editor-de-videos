import "server-only";
import { redirect } from "next/navigation";
import { withTenant, type TenantContext } from "@/server/context";
import { currentRequestInfo, requireSession } from "@/server/next/session";
import type { Permission } from "@/shared/permissions";

/**
 * Ponte entre uma pagina e o banco.
 *
 * Resolve a sessao, confere a permissao e roda `fn` dentro do contexto de
 * tenant. Pagina nao abre transacao nem monta contexto a mao — se precisasse,
 * uma hora alguem esqueceria.
 */
export async function withPage<T>(
  fn: (ctx: TenantContext) => Promise<T>,
  permission?: Permission,
): Promise<T> {
  const session = await requireSession();

  if (permission && !session.permissions.has(permission)) {
    // Recusa de leitura vira tela explicativa, nao erro 500: quem clicou num
    // link que nao devia ver precisa continuar trabalhando. E precisa ser uma
    // rota que nao exige permissao nenhuma, senao o redirect se morde.
    redirect(`/sem-permissao?permissao=${encodeURIComponent(permission)}`);
  }

  const info = await currentRequestInfo();
  return withTenant(session, fn, info);
}
