import type { Metadata } from "next";
import { LinkButton, PageHead, Panel } from "@/ui";
import { PERMISSION_META, isPermission } from "@/shared/permissions";

export const metadata: Metadata = { title: "Sem permissão" };

/**
 * Destino de quem clicou onde o papel não alcança.
 *
 * Existe como tela própria porque mandar a pessoa "de volta" é um convite a
 * loop: se a permissão que falta é justamente a da tela inicial, o redirect
 * volta pra cá eternamente. Aqui ela lê o que faltou e a quem pedir.
 */
export default async function SemPermissaoPage({
  searchParams,
}: {
  searchParams: Promise<{ permissao?: string }>;
}) {
  const { permissao } = await searchParams;
  const rotulo = permissao && isPermission(permissao) ? PERMISSION_META[permissao].description : null;

  return (
    <>
      <PageHead title="Sem permissão" meta="Seu papel nesta clínica não alcança esta tela." />

      <Panel className="max-w-xl space-y-4 p-6">
        <p className="text-sm text-ink-soft">
          {rotulo ? (
            <>
              Esta tela exige <strong className="font-semibold text-ink">{rotulo}</strong>, e o seu
              papel não tem essa permissão.
            </>
          ) : (
            <>Esta tela exige uma permissão que o seu papel não tem.</>
          )}
        </p>
        <p className="text-sm text-muted">
          Quem administra a clínica pode ajustar isso nas permissões do seu papel.
        </p>
        <LinkButton href="/" variant="secondary">
          Voltar ao início
        </LinkButton>
      </Panel>
    </>
  );
}
