import "server-only";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import type { Role } from "@/generated/prisma/enums";

const COOKIE_NAME = "odontocrm_session";
const ALG = "HS256";

export type SessionPayload = {
  userId: string;
  clinicId: string;
  role: Role;
  name: string;
  clinicName: string;
};

function secret(): Uint8Array {
  const value = process.env.AUTH_SECRET;
  if (!value || value.length < 16) {
    throw new Error(
      "AUTH_SECRET ausente ou curto demais. Gere um com: openssl rand -base64 32",
    );
  }
  return new TextEncoder().encode(value);
}

function sessionHours(): number {
  const parsed = Number(process.env.SESSION_HOURS ?? 12);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 12;
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export async function createSession(payload: SessionPayload): Promise<void> {
  const hours = sessionHours();
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setExpirationTime(`${hours}h`)
    .sign(secret());

  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: hours * 3600,
  });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

/** Le a sessão do cookie. Devolve null se ausente, inválida ou expirada. */
export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secret(), { algorithms: [ALG] });
    const { userId, clinicId, role, name, clinicName } = payload as Record<string, unknown>;

    if (typeof userId !== "string" || typeof clinicId !== "string") return null;

    return {
      userId,
      clinicId,
      role: role as Role,
      name: typeof name === "string" ? name : "",
      clinicName: typeof clinicName === "string" ? clinicName : "",
    };
  } catch {
    return null;
  }
}
