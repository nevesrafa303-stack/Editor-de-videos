import { NextResponse } from "next/server";
import { getSession } from "@/server/auth";
import { scopedDb } from "@/server/tenant";
import { can } from "@/server/permissions";
import { formatPhone } from "@/lib/br";

/** Busca usada pelo seletor de pacientes (agenda, orçamentos). */
export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }
  if (!can(session.role, "patients:read")) {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }

  const term = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  const db = scopedDb(session.clinicId);

  const patients = await db.patient.findMany({
    where: {
      active: true,
      ...(term
        ? {
            OR: [
              { name: { contains: term, mode: "insensitive" as const } },
              { phone: { contains: term.replace(/\D/g, "") } },
              { document: { contains: term.replace(/\D/g, "") } },
            ],
          }
        : {}),
    },
    orderBy: { name: "asc" },
    take: 12,
    select: { id: true, name: true, phone: true },
  });

  return NextResponse.json(
    patients.map((patient) => ({
      id: patient.id,
      name: patient.name,
      phone: formatPhone(patient.phone),
    })),
  );
}
