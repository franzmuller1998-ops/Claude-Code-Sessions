"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  hashPassword,
  verifyPassword,
  createSession,
  destroySession,
} from "@/lib/auth";
import { notifyAdmin } from "@/lib/bot";

export type AuthState = { error?: string };

export async function registerAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const timezone = String(formData.get("timezone") || "Europe/Moscow");

  if (!name || !email || !password) return { error: "Заполните все поля." };
  if (password.length < 6) return { error: "Пароль должен быть не короче 6 символов." };

  const existing = await prisma.tutor.findUnique({ where: { email } });
  if (existing) return { error: "Пользователь с таким email уже существует." };

  const tutor = await prisma.tutor.create({
    data: { name, email, passwordHash: await hashPassword(password), timezone },
  });

  // Уведомить администратора о новой регистрации (без @username — Telegram
  // репетитор ещё не привязал; @username придёт отдельным уведомлением при привязке).
  await notifyAdmin(`🆕 Новый репетитор зарегистрировался: ${tutor.name} (${email}).`);

  await createSession(tutor.id);
  redirect("/dashboard");
}

export async function loginAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");

  if (!email || !password) return { error: "Введите email и пароль." };

  const tutor = await prisma.tutor.findUnique({ where: { email } });
  if (!tutor || !(await verifyPassword(password, tutor.passwordHash))) {
    return { error: "Неверный email или пароль." };
  }

  await createSession(tutor.id);
  redirect("/dashboard");
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/login");
}
