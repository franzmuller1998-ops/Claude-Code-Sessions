"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireTutor } from "@/lib/auth";
import { generateLinkToken } from "@/lib/tokens";

/** Выдать репетитору новый токен для привязки собственного Telegram. */
export async function connectTutorTelegramAction(): Promise<void> {
  const tutor = await requireTutor();
  await prisma.tutor.update({
    where: { id: tutor.id },
    data: { linkToken: generateLinkToken(), telegramChatId: null, linkedAt: null },
  });
  revalidatePath("/dashboard");
}
