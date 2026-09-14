import type { Metadata } from "next";
import { requireTenant } from "@/server/tenant";
import { can, ROLE_DESCRIPTION, ROLE_LABEL } from "@/server/permissions";
import { toggleProcedure, toggleRoom } from "@/server/actions/settings";
import { formatBRL } from "@/lib/money";
import { Badge, Card, CardHeader, PageHeader } from "@/components/ui";
import {
  ClinicForm,
  NewProcedureForm,
  NewRoomForm,
  NewUserForm,
  UserRow,
} from "./forms";
import type { Role } from "@/generated/prisma/enums";

export const metadata: Metadata = { title: "Configurações" };

export default async function SettingsPage() {
  const { db, session, clinicId } = await requireTenant();

  const canManageClinic = can(session.role, "clinic:manage");
  const canManageUsers = can(session.role, "users:manage");

  const [clinic, users, procedures, rooms] = await Promise.all([
    db.clinic.findUnique({ where: { id: clinicId } }),
    db.user.findMany({ orderBy: [{ active: "desc" }, { name: "asc" }] }),
    db.procedure.findMany({ orderBy: [{ category: "asc" }, { name: "asc" }] }),
    db.room.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!clinic) throw new Error("Clínica não encontrada.");

  return (
    <>
      <PageHeader
        title="Configurações"
        description="Dados da clínica, equipe, catalogo de procedimentos e salas."
      />

      <div className="space-y-4">
        <Card>
          <CardHeader title="Clínica" description={`Identificador: ${clinic.slug}`} />
          {canManageClinic ? (
            <ClinicForm
              clinic={{
                name: clinic.name,
                document: clinic.document,
                phone: clinic.phone,
                email: clinic.email,
                defaultCommissionPct: Number(clinic.defaultCommissionPct),
              }}
            />
          ) : (
            <div className="p-5 text-sm text-slate-600">
              Somente o proprietário edita os dados da clínica.
            </div>
          )}
        </Card>

        <Card>
          <CardHeader
            title={`Equipe (${users.filter((user) => user.active).length} ativos)`}
            description="Cada perfil enxerga uma parte diferente do sistema."
          />

          <div className="grid gap-2 border-b border-slate-100 px-5 py-4 sm:grid-cols-2 lg:grid-cols-5">
            {(Object.keys(ROLE_LABEL) as Role[]).map((role) => (
              <div key={role} className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs font-semibold text-slate-700">{ROLE_LABEL[role]}</p>
                <p className="mt-0.5 text-[11px] leading-snug text-slate-500">
                  {ROLE_DESCRIPTION[role]}
                </p>
              </div>
            ))}
          </div>

          {canManageUsers ? (
            <div className="divide-y divide-slate-100">
              {users.map((user) => (
                <UserRow
                  key={user.id}
                  user={{
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    active: user.active,
                    isProfessional: user.isProfessional,
                    specialty: user.specialty,
                    councilNumber: user.councilNumber,
                    color: user.color,
                    commissionPct:
                      user.commissionPct === null ? null : Number(user.commissionPct),
                  }}
                />
              ))}
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {users.map((user) => (
                <li key={user.id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{user.name}</p>
                    <p className="text-xs text-slate-500">{user.specialty ?? user.email}</p>
                  </div>
                  <Badge tone={user.active ? "success" : "neutral"}>
                    {ROLE_LABEL[user.role]}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {canManageUsers ? (
          <Card>
            <CardHeader
              title="Adicionar pessoa a equipe"
              description="A senha inicial deve ser trocada pela pessoa no primeiro acesso."
            />
            <NewUserForm />
          </Card>
        ) : null}

        <Card>
          <CardHeader
            title={`Catalogo de procedimentos (${procedures.filter((p) => p.active).length} ativos)`}
            description="Preço e duração alimentam a agenda e o orçamento."
          />

          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Procedimento</th>
                  <th>Categoria</th>
                  <th className="text-right">Preço</th>
                  <th className="text-right">Custo</th>
                  <th className="text-right">Margem</th>
                  <th className="text-right">Duração</th>
                  {canManageClinic ? <th /> : null}
                </tr>
              </thead>
              <tbody>
                {procedures.map((procedure) => (
                  <tr key={procedure.id} className={procedure.active ? "" : "opacity-50"}>
                    <td className="font-medium text-slate-800">{procedure.name}</td>
                    <td>
                      <Badge tone={procedure.category === "ESTETICA" ? "info" : "brand"}>
                        {procedure.category.toLowerCase()}
                      </Badge>
                    </td>
                    <td className="text-right tabular-nums">{formatBRL(procedure.priceCents)}</td>
                    <td className="text-right tabular-nums">{formatBRL(procedure.costCents)}</td>
                    <td className="text-right tabular-nums">
                      {procedure.priceCents > 0
                        ? `${Math.round(((procedure.priceCents - procedure.costCents) / procedure.priceCents) * 100)}%`
                        : "—"}
                    </td>
                    <td className="text-right tabular-nums">{procedure.durationMin} min</td>
                    {canManageClinic ? (
                      <td className="text-right">
                        <form action={toggleProcedure}>
                          <input type="hidden" name="id" value={procedure.id} />
                          <button
                            type="submit"
                            className="rounded border border-slate-200 px-2 py-0.5 text-[11px] font-medium text-slate-600 hover:bg-slate-50"
                          >
                            {procedure.active ? "Desativar" : "Ativar"}
                          </button>
                        </form>
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {canManageClinic ? (
            <div className="border-t border-slate-100">
              <NewProcedureForm />
            </div>
          ) : null}
        </Card>

        <Card>
          <CardHeader
            title="Salas e cadeiras"
            description="A agenda impede dois atendimentos na mesma sala no mesmo horário."
          />

          <ul className="divide-y divide-slate-100">
            {rooms.map((room) => (
              <li key={room.id} className="flex items-center justify-between gap-3 px-5 py-3">
                <span className={`text-sm ${room.active ? "text-slate-800" : "text-slate-400"}`}>
                  {room.name}
                </span>
                {canManageClinic ? (
                  <form action={toggleRoom}>
                    <input type="hidden" name="id" value={room.id} />
                    <button
                      type="submit"
                      className="rounded border border-slate-200 px-2 py-0.5 text-[11px] font-medium text-slate-600 hover:bg-slate-50"
                    >
                      {room.active ? "Desativar" : "Ativar"}
                    </button>
                  </form>
                ) : null}
              </li>
            ))}
          </ul>

          {canManageClinic ? (
            <div className="border-t border-slate-100">
              <NewRoomForm />
            </div>
          ) : null}
        </Card>
      </div>
    </>
  );
}
