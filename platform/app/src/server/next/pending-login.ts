import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

/**
 * Login em duas etapas, para quem atende em mais de uma rede.
 *
 * Entre "a senha confere" e "a clínica foi escolhida" existe um estado que
 * precisa atravessar um request. Mandar o id do usuário num campo oculto seria
 * confiar num valor que o navegador controla: qualquer um postaria o id de
 * outra pessoa. Aqui o valor vai assinado com HMAC e vale cinco minutos.
 */
const COOKIE = "clinica_login_pendente";
const TTL_MS = 5 * 60_000;

function secret(): Buffer {
  const value = process.env.AUTH_SECRET;
  if (!value || value.length < 16) {
    throw new Error("AUTH_SECRET ausente ou curto demais. Gere com: openssl rand -base64 32");
  }
  return Buffer.from(value);
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export async function startPendingLogin(userId: string): Promise<void> {
  const expiresAt = Date.now() + TTL_MS;
  const payload = `${userId}.${expiresAt}`;
  const store = await cookies();

  store.set(COOKIE, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: TTL_MS / 1000,
  });
}

export async function readPendingLogin(): Promise<string | null> {
  const store = await cookies();
  const raw = store.get(COOKIE)?.value;
  if (!raw) return null;

  const [userId, expiresAt, signature] = raw.split(".");
  if (!userId || !expiresAt || !signature) return null;

  const expected = sign(`${userId}.${expiresAt}`);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  if (Number(expiresAt) < Date.now()) return null;

  return userId;
}

export async function clearPendingLogin(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE);
}
