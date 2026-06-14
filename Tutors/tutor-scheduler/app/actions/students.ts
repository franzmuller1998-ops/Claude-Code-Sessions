"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireTutor } from "@/lib/auth";
import { generateLinkToken } from "@/lib/tokens";

export async function createStudentAction(formData: FormData): Promise<void> {
  const tutor = await requireTutor();
  const name = String(formData.get("name") || "").trim();
  const subject = String(formData.get("subject") || "").trim() || null;
  const timezone = String(formData.get("timezone") || tutor.timezone);
  if (!name) return;

  await prisma.student.create({
    data: {
      tutorId: tutor.id,
      name,
      subject,
      timezone,
      linkToken: generateLinkToken(),
    },
  });
  revalidatePath("/students");
}

export async function deleteStudentAction(formData: FormData): Promise<void> {
  const tutor = await requireTutor();
  const id = String(formData.get("id") || "");
  // ownership check
  await prisma.student.deleteMany({ where: { id, tutorId: tutor.id } });
  revalidatePath("/students");
  redirect("/students");
}

/** Перевыпустить ссылку-приглашение (например, если старую потеряли или отвязались). */
export async function regenerateLinkAction(formData: FormData): Promise<void> {
  const tutor = await requireTutor();
  const id = String(formData.get("id") || "");
  const student = await prisma.student.findFirst({ where: { id, tutorId: tutor.id } });
  if (!student) return;

  await prisma.student.update({
    where: { id },
    data: { linkToken: generateLinkToken(), telegramChatId: null, linkedAt: null },
  });
  revalidatePath(`/students/${id}`);
  revalidatePath("/students");
}
