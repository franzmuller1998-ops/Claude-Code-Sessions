"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  hashPassword,
  verifyPassword,
  createSession,
  destroySession,
} from "@/lib/auth";
import { notifyAdmin, formatHandle } from "@/lib/bot";

export type AuthState = { error?: string };

export async function registerAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const timezone = String(formData.get("timezone") || "Europe/Moscow");
  const tgCode = String(formData.get("tgCode") || "").trim().toUpperCase();

  if (!name || !email || !password) return { error: "Заполните все поля." };
  if (password.length < 6) return { error: "Пароль должен быть не короче 6 символов." };

  const existing = await prisma.tutor.findUnique({ where: { email } });
  if (existing) return { error: "Пользователь с таким email уже существует." };

  const tutor = await prisma.tutor.create({
    data: { name, email, passwordHash: await hashPassword(password), timezone },
  });

  // Если введён код из бота и он не просрочен — сразу привязываем Telegram.
  let linkedHandle: string | null = null;
  let telegramLinked = false;
  if (tgCode) {
    const link = await prisma.telegramLinkCode.findUnique({ where: { code: tgCode } });
    if (link && link.expiresAt > new Date()) {
      // Снимаем этот chatId с других репетиторов, чтобы не дублировать напоминания.
      await prisma.tutor.updateMany({
        where: { telegramChatId: link.chatId, NOT: { id: tutor.id } },
        data: { telegramChatId: null },
      });
      await prisma.tutor.update({
        where: { id: tutor.id },
        data: {
          telegramChatId: link.chatId,
          telegramUsername: link.username,
          linkedAt: new Date(),
        },
      });
      await prisma.telegramLinkCode.delete({ where: { id: link.id } });
      telegramLinked = true;
      linkedHandle = link.username;
    }
  }

  await notifyAdmin(
    telegramLinked
      ? `🆕 Новый репетитор: ${tutor.name} (${email}), Telegram ${formatHandle(linkedHandle)} ✅`
      : `🆕 Новый репетитор зарегистрировался: ${tutor.name} (${email}).`,
  );

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
