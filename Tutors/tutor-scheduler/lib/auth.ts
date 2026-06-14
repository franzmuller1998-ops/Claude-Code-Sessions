import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const COOKIE_NAME = "tutor_session";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 дней

function secret(): Uint8Array {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error("AUTH_SECRET не задан в окружении");
  return new TextEncoder().encode(s);
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSession(tutorId: string): Promise<void> {
  const token = await new SignJWT({ sub: tutorId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secret());

  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

/** Возвращает id репетитора из cookie или null. */
export async function getSessionTutorId(): Promise<string | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}

/** Текущий репетитор (или null), подгруженный из БД. */
export async function getCurrentTutor() {
  const id = await getSessionTutorId();
  if (!id) return null;
  return prisma.tutor.findUnique({ where: { id } });
}

/** Гарантирует авторизацию; иначе редирект на /login. */
export async function requireTutor() {
  const tutor = await getCurrentTutor();
  if (!tutor) redirect("/login");
  return tutor;
}
