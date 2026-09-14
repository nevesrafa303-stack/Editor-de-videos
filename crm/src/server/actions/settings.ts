"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertPermission } from "@/server/tenant";
import { hashPassword } from "@/server/auth";
import { isValidCNPJ, onlyDigits } from "@/lib/br";
import { parseBRL } from "@/lib/money";
import { toActionState, type ActionState } from "@/server/actions/types";
import type { ProcedureCategory, Role } from "@/generated/prisma/enums";

export async function updateClinic(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const { db, clinicId } = await assertPermission("clinic:manage");

    const name = String(formData.get("name") || "").trim();
    const document = String(formData.get("document") || "").trim();
    const commission = Number(formData.get("defaultCommissionPct") ?? 0);

    if (name.length < 3) return { error: "Informe o nome da clínica." };
    if (document && !isValidCNPJ(document)) return { error: "CNPJ inválido." };
    if (!Number.isFinite(commission) || commission < 0 || commission > 100) {
      return { error: "A comissão padrão deve estar entre 0 e 100." };
    }

    await db.clinic.update({
      where: { id: clinicId },
      data: {
        name,
        document: document ? onlyDigits(document) : null,
        phone: String(formData.get("phone") || "").trim() || null,
        email: String(formData.get("email") || "").trim() || null,
        defaultCommissionPct: commission,
      },
    });

    revalidatePath("/configuracoes");
    return { success: "Dados da clínica atualizados." };
  } catch (error) {
    return toActionState(error);
  }
}

const userSchema = z.object({
  name: z.string().trim().min(3, "Informe o nome."),
  email: z.email("E-mail inválido.").trim().toLowerCase(),
  password: z.string().min(8, "A senha precisa de ao menos 8 caracteres."),
  role: z.string(),
  isProfessional: z.boolean(),
  specialty: z.string().trim().optional(),
  councilNumber: z.string().trim().optional(),
  color: z.string().optional(),
  commissionPct: z.string().optional(),
});

const ROLES: Role[] = ["OWNER", "ADMIN", "PROFESSIONAL", "RECEPTION", "FINANCE"];

export async function createUser(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const { db, clinicId } = await assertPermission("users:manage");

    const input = userSchema.parse({
      name: formData.get("name"),
      email: formData.get("email"),
      password: formData.get("password"),
      role: formData.get("role") ?? "RECEPTION",
      isProfessional: formData.get("isProfessional") === "on",
      specialty: formData.get("specialty") ?? "",
      councilNumber: formData.get("councilNumber") ?? "",
      color: formData.get("color") ?? "#0f766e",
      commissionPct: formData.get("commissionPct") ?? "",
    });

    if (!ROLES.includes(input.role as Role)) return { error: "Perfil inválido." };

    // E-mail e a credencial de login, que e global: o mesmo endereço não pode
    // pertencer a duas clínicas.
    const existing = await db.user.findFirst({ where: { email: input.email } });
    if (existing) return { error: "Já existe um usuário com este e-mail." };

    await db.user.create({
      data: {
        clinicId,
        name: input.name,
        email: input.email,
        passwordHash: await hashPassword(input.password),
        role: input.role as Role,
        isProfessional: input.isProfessional,
        specialty: input.specialty || null,
        councilNumber: input.councilNumber || null,
        color: input.color || "#0f766e",
        commissionPct: input.commissionPct ? Number(input.commissionPct) : null,
      },
    });

    revalidatePath("/configuracoes");
    return { success: `${input.name} adicionado a equipe.` };
  } catch (error) {
    return toActionState(error);
  }
}

export async function updateUser(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const { db, session } = await assertPermission("users:manage");
    const id = String(formData.get("id"));

    const role = String(formData.get("role") || "") as Role;
    if (!ROLES.includes(role)) return { error: "Perfil inválido." };

    const active = formData.get("active") === "on";
    if (id === session.userId && !active) {
      return { error: "Você não pode desativar o proprio usuário." };
    }

    const commission = String(formData.get("commissionPct") || "");
    const password = String(formData.get("password") || "");

    await db.user.update({
      where: { id },
      data: {
        name: String(formData.get("name") || "").trim(),
        role,
        active,
        isProfessional: formData.get("isProfessional") === "on",
        specialty: String(formData.get("specialty") || "").trim() || null,
        councilNumber: String(formData.get("councilNumber") || "").trim() || null,
        color: String(formData.get("color") || "#0f766e"),
        commissionPct: commission === "" ? null : Number(commission),
        ...(password ? { passwordHash: await hashPassword(password) } : {}),
      },
    });

    revalidatePath("/configuracoes");
    return { success: "Usuário atualizado." };
  } catch (error) {
    return toActionState(error);
  }
}

export async function createProcedure(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const { db, clinicId } = await assertPermission("clinic:manage");

    const name = String(formData.get("name") || "").trim();
    if (name.length < 3) return { error: "Informe o nome do procedimento." };

    const duplicate = await db.procedure.findFirst({ where: { name } });
    if (duplicate) return { error: "Já existe um procedimento com esse nome." };

    await db.procedure.create({
      data: {
        clinicId,
        name,
        category: String(formData.get("category") || "ODONTOLOGIA") as ProcedureCategory,
        priceCents: parseBRL(String(formData.get("price") ?? "")),
        costCents: parseBRL(String(formData.get("cost") ?? "")),
        durationMin: Number(formData.get("durationMin") || 30),
      },
    });

    revalidatePath("/configuracoes");
    return { success: "Procedimento cadastrado." };
  } catch (error) {
    return toActionState(error);
  }
}

export async function toggleProcedure(formData: FormData): Promise<void> {
  const { db } = await assertPermission("clinic:manage");
  const id = String(formData.get("id"));

  const procedure = await db.procedure.findUnique({ where: { id } });
  if (!procedure) return;

  await db.procedure.update({ where: { id }, data: { active: !procedure.active } });
  revalidatePath("/configuracoes");
}

export async function createRoom(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const { db, clinicId } = await assertPermission("clinic:manage");

    const name = String(formData.get("name") || "").trim();
    if (!name) return { error: "Informe o nome da sala." };

    const duplicate = await db.room.findFirst({ where: { name } });
    if (duplicate) return { error: "Já existe uma sala com esse nome." };

    await db.room.create({ data: { clinicId, name } });

    revalidatePath("/configuracoes");
    return { success: "Sala cadastrada." };
  } catch (error) {
    return toActionState(error);
  }
}

export async function toggleRoom(formData: FormData): Promise<void> {
  const { db } = await assertPermission("clinic:manage");
  const id = String(formData.get("id"));

  const room = await db.room.findUnique({ where: { id } });
  if (!room) return;

  await db.room.update({ where: { id }, data: { active: !room.active } });
  revalidatePath("/configuracoes");
}
