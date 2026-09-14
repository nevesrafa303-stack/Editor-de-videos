"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/server/db";
import { createSession, destroySession, hashPassword, verifyPassword } from "@/server/auth";
import { slugify } from "@/lib/br";
import { toActionState, type ActionState } from "@/server/actions/types";

const loginSchema = z.object({
  email: z.email("Informe um e-mail valido.").trim().toLowerCase(),
  password: z.string().min(1, "Informe a senha."),
});

export async function login(_prev: ActionState, formData: FormData): Promise<ActionState> {
  let target = "/painel";

  try {
    const { email, password } = loginSchema.parse({
      email: formData.get("email"),
      password: formData.get("password"),
    });

    const user = await prisma.user.findFirst({
      where: { email, active: true },
      include: { clinic: true },
    });

    // Mensagem única para e-mail inexistente e senha errada: não entregamos a
    // quem esta tentando adivinhar a informacao de que o e-mail existe.
    const invalid: ActionState = { error: "E-mail ou senha inválidos." };
    if (!user) {
      await hashPassword(password); // iguala o tempo de resposta
      return invalid;
    }

    if (!(await verifyPassword(password, user.passwordHash))) return invalid;

    await createSession({
      userId: user.id,
      clinicId: user.clinicId,
      role: user.role,
      name: user.name,
      clinicName: user.clinic.name,
    });

    const next = formData.get("next");
    if (typeof next === "string" && next.startsWith("/")) target = next;
  } catch (error) {
    return toActionState(error);
  }

  redirect(target);
}

const signupSchema = z.object({
  clinicName: z.string().trim().min(3, "Informe o nome da clínica."),
  name: z.string().trim().min(3, "Informe seu nome."),
  email: z.email("Informe um e-mail valido.").trim().toLowerCase(),
  password: z.string().min(8, "A senha precisa de ao menos 8 caracteres."),
});

/** Cadastro de uma nova clínica: cria o tenant, o dono e um catalogo inicial. */
export async function signup(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const input = signupSchema.parse({
      clinicName: formData.get("clinicName"),
      name: formData.get("name"),
      email: formData.get("email"),
      password: formData.get("password"),
    });

    const existing = await prisma.user.findFirst({ where: { email: input.email } });
    if (existing) {
      return { error: "Já existe uma conta com este e-mail." };
    }

    const passwordHash = await hashPassword(input.password);
    const clinic = await prisma.clinic.create({
      data: {
        name: input.clinicName,
        slug: await uniqueSlug(input.clinicName),
        defaultCommissionPct: 30,
        users: {
          create: {
            name: input.name,
            email: input.email,
            passwordHash,
            role: "OWNER",
            isProfessional: true,
          },
        },
        rooms: {
          create: [{ name: "Consultório 1" }, { name: "Sala de estética" }],
        },
        procedures: { create: STARTER_CATALOG },
      },
      include: { users: true },
    });

    const owner = clinic.users[0];
    if (!owner) throw new Error("Falha ao criar o usuário da clínica.");

    await createSession({
      userId: owner.id,
      clinicId: clinic.id,
      role: owner.role,
      name: owner.name,
      clinicName: clinic.name,
    });
  } catch (error) {
    return toActionState(error);
  }

  redirect("/painel");
}

export async function logout(): Promise<void> {
  await destroySession();
  redirect("/entrar");
}

async function uniqueSlug(name: string): Promise<string> {
  const base = slugify(name) || "clinica";
  let candidate = base;
  let suffix = 1;

  while (await prisma.clinic.findUnique({ where: { slug: candidate } })) {
    suffix += 1;
    candidate = `${base}-${suffix}`;
  }

  return candidate;
}

/** Catalogo mínimo para a clínica não comecar com a tela vazia. */
const STARTER_CATALOG = [
  { name: "Consulta de avaliação", category: "ODONTOLOGIA" as const, priceCents: 0, durationMin: 30 },
  { name: "Limpeza / profilaxia", category: "ODONTOLOGIA" as const, priceCents: 18_000, durationMin: 40 },
  { name: "Restauração em resina", category: "ODONTOLOGIA" as const, priceCents: 28_000, durationMin: 60 },
  { name: "Clareamento a laser", category: "ODONTOLOGIA" as const, priceCents: 120_000, durationMin: 90 },
  { name: "Toxina botulínica (3 regiões)", category: "ESTETICA" as const, priceCents: 150_000, durationMin: 60 },
  { name: "Preenchimento labial", category: "ESTETICA" as const, priceCents: 180_000, durationMin: 60 },
  { name: "Limpeza de pele profunda", category: "ESTETICA" as const, priceCents: 25_000, durationMin: 60 },
];
