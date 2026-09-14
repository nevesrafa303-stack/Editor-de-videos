import type { Metadata } from "next";
import Link from "next/link";
import { withPage } from "@/server/next/page";
import { listPatients } from "@/modules/patient";
import { Badge, Empty, Input, LinkButton, PageHead, Panel } from "@/ui";
import { IconPlus, IconSearch } from "@/ui/icons";
import { ageFrom, formatBRL, formatCPF, formatDateTime, formatPhone } from "@/shared/format";

export const metadata: Metadata = { title: "Pacientes" };

const POR_PAGINA = 25;

export default async function PacientesPage({
  searchParams,
}: {
  searchParams: Promise<{ busca?: string; pagina?: string; inativos?: string }>;
}) {
  const params = await searchParams;
  const busca = params.busca?.trim() ?? "";
  const pagina = Math.max(1, Number(params.pagina) || 1);
  const incluirInativos = params.inativos === "1";

  const { items, total, podeCadastrar, fuso } = await withPage(async (ctx) => {
    const resultado = await listPatients(ctx, {
      search: busca,
      includeInactive: incluirInativos,
      limit: POR_PAGINA,
      offset: (pagina - 1) * POR_PAGINA,
    });
    return {
      ...resultado,
      podeCadastrar: ctx.can("patient.write"),
      fuso: ctx.session.timezone,
    };
  }, "patient.read");

  const paginas = Math.max(1, Math.ceil(total / POR_PAGINA));

  return (
    <>
      <PageHead
        title="Pacientes"
        meta={`${total} ${total === 1 ? "paciente" : "pacientes"}${incluirInativos ? "" : " ativos"}`}
        action={
          podeCadastrar ? (
            <LinkButton href="/pacientes/novo">
              <IconPlus /> Novo paciente
            </LinkButton>
          ) : null
        }
      />

      <Panel className="mb-4 p-4">
        <form className="flex flex-wrap items-end gap-3">
          <label className="min-w-64 flex-1">
            <span className="label">Buscar</span>
            <span className="relative block">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted">
                <IconSearch />
              </span>
              <Input
                id="busca"
                name="busca"
                defaultValue={busca}
                className="pl-9"
                placeholder="Nome, telefone ou CPF"
              />
            </span>
          </label>

          <label className="flex items-center gap-2 pb-2 text-sm text-ink-soft">
            <input
              id="inativos"
              type="checkbox"
              name="inativos"
              value="1"
              defaultChecked={incluirInativos}
              className="size-4 rounded border-line text-structure focus:ring-structure"
            />
            Incluir inativos
          </label>

          <button
            type="submit"
            className="mb-0.5 rounded-md bg-ink px-4 py-2 text-sm font-medium text-white transition hover:bg-ink/90"
          >
            Filtrar
          </button>
        </form>
      </Panel>

      <Panel className="overflow-hidden">
        {items.length === 0 ? (
          <Empty
            title={busca ? "Nenhum paciente encontrado" : "Nenhum paciente cadastrado"}
            hint={
              busca
                ? "Tente outro nome, telefone ou CPF."
                : "Cadastre o primeiro paciente para começar."
            }
            action={
              podeCadastrar ? (
                <LinkButton href="/pacientes/novo" variant="secondary">
                  Cadastrar paciente
                </LinkButton>
              ) : null
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="grid-table">
              <thead>
                <tr>
                  <th>Paciente</th>
                  <th>Contato</th>
                  <th>CPF</th>
                  <th>Próxima consulta</th>
                  <th className="text-right">Em aberto</th>
                </tr>
              </thead>
              <tbody>
                {items.map((paciente) => {
                  const idade = ageFrom(paciente.birthDate, fuso);

                  return (
                    <tr key={paciente.id}>
                      <td>
                        <Link
                          href={`/pacientes/${paciente.id}`}
                          className="font-medium text-ink hover:text-structure"
                        >
                          {paciente.fullName}
                        </Link>
                        <div className="num flex items-center gap-2 text-xs text-muted">
                          <span>#{paciente.code}</span>
                          {idade !== null ? <span>{idade} anos</span> : null}
                          {paciente.status !== "active" ? (
                            <Badge tone="neutral">{paciente.status}</Badge>
                          ) : null}
                        </div>
                      </td>
                      <td className="num">{formatPhone(paciente.phone)}</td>
                      <td className="num">{formatCPF(paciente.taxId)}</td>
                      <td>
                        {paciente.nextAppointmentAt ? (
                          <Badge tone="structure">
                            {formatDateTime(paciente.nextAppointmentAt, fuso)}
                          </Badge>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                      <td className="num text-right">
                        {paciente.openBalanceCents > 0 ? (
                          <span className="font-medium text-warning">
                            {formatBRL(paciente.openBalanceCents)}
                          </span>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {paginas > 1 ? (
        <nav className="mt-4 flex items-center justify-between text-sm text-muted">
          <span className="num">
            Página {pagina} de {paginas}
          </span>
          <span className="flex gap-2">
            {pagina > 1 ? (
              <LinkButton
                variant="secondary"
                size="sm"
                href={`/pacientes?busca=${encodeURIComponent(busca)}&pagina=${pagina - 1}`}
              >
                Anterior
              </LinkButton>
            ) : null}
            {pagina < paginas ? (
              <LinkButton
                variant="secondary"
                size="sm"
                href={`/pacientes?busca=${encodeURIComponent(busca)}&pagina=${pagina + 1}`}
              >
                Próxima
              </LinkButton>
            ) : null}
          </span>
        </nav>
      ) : null}
    </>
  );
}
