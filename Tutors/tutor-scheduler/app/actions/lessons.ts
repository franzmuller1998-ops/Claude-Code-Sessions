"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireTutor } from "@/lib/auth";
import { zonedToUtc, formatInTz } from "@/lib/time";
import { generateRemindersForLesson, materializeRecurrence } from "@/lib/reminders";
import {
  notifyStudentNewLesson,
  notifyStudentNewRecurrence,
  notifyStudentCancelledLesson,
} from "@/lib/notifications";
import { LessonStatus, ReminderStatus } from "@/lib/constants";

async function ownsStudent(tutorId: string, studentId: string) {
  return prisma.student.findFirst({ where: { id: studentId, tutorId } });
}

/** Дата "YYYY-MM-DD" раньше сегодняшнего дня в поясе репетитора? */
function isPastDate(dateStr: string, timeZone: string): boolean {
  return dateStr < formatInTz(new Date(), timeZone, "yyyy-MM-dd");
}

/** Длительность занятия: целое число минут в диапазоне 1..360 (по умолчанию 60). */
function clampDuration(value: number): number {
  if (!Number.isFinite(value)) return 60;
  return Math.min(360, Math.max(1, Math.round(value)));
}

/** Результат создания занятия — для toast-уведомления на клиенте. */
export type LessonActionState = {
  ok: boolean;
  error?: string;
  studentName?: string;
  studentId?: string;
  notified?: boolean; // привязан ли Telegram ученика (т.е. уведомление дошло)
  createdCount?: number; // сколько занятий создано (для серии)
};

/** Разовое занятие. Время вводится в timezone репетитора. */
export async function createLessonAction(
  _prev: LessonActionState,
  formData: FormData,
): Promise<LessonActionState> {
  const tutor = await requireTutor();
  const studentId = String(formData.get("studentId") || "");
  const date = String(formData.get("date") || "");
  const time = String(formData.get("time") || "");
  const durationMin = clampDuration(parseInt(String(formData.get("durationMin") || "60"), 10));
  const subject = String(formData.get("subject") || "").trim() || null;

  if (!studentId || !date || !time) {
    return { ok: false, error: "Укажите ученика, дату и время." };
  }
  if (isPastDate(date, tutor.timezone)) {
    return { ok: false, error: "Дата занятия не может быть в прошлом." };
  }
  const student = await ownsStudent(tutor.id, studentId);
  if (!student) return { ok: false, error: "Ученик не найден." };

  const startAt = zonedToUtc(date, time, tutor.timezone);
  const lesson = await prisma.lesson.create({
    data: { tutorId: tutor.id, studentId, startAt, durationMin, subject },
  });
  await generateRemindersForLesson(lesson.id, startAt);
  await notifyStudentNewLesson(lesson.id); // мгновенное оповещение ученику
  revalidatePath("/schedule");
  revalidatePath("/dashboard");

  return {
    ok: true,
    studentName: student.name,
    studentId: student.id,
    notified: !!student.telegramChatId,
    createdCount: 1,
  };
}

/** Повторяющееся занятие: серия по дням недели. */
export async function createRecurrenceAction(
  _prev: LessonActionState,
  formData: FormData,
): Promise<LessonActionState> {
  const tutor = await requireTutor();
  const studentId = String(formData.get("studentId") || "");
  const days = formData.getAll("daysOfWeek").map(String).filter(Boolean);
  const time = String(formData.get("time") || "");
  const durationMin = clampDuration(parseInt(String(formData.get("durationMin") || "60"), 10));
  const subject = String(formData.get("subject") || "").trim() || null;
  const startDate = String(formData.get("startDate") || "");
  const endDateRaw = String(formData.get("endDate") || "");

  if (!studentId || days.length === 0 || !time || !startDate) {
    return { ok: false, error: "Выберите ученика, дни недели, время и дату начала." };
  }
  if (isPastDate(startDate, tutor.timezone)) {
    return { ok: false, error: "Дата начала не может быть в прошлом." };
  }
  const student = await ownsStudent(tutor.id, studentId);
  if (!student) return { ok: false, error: "Ученик не найден." };

  const tz = tutor.timezone;
  const rec = await prisma.recurrence.create({
    data: {
      tutorId: tutor.id,
      studentId,
      daysOfWeek: days.join(","),
      timeOfDay: time,
      durationMin,
      subject,
      startDate: zonedToUtc(startDate, "00:00", tz),
      endDate: endDateRaw ? zonedToUtc(endDateRaw, "23:59", tz) : null,
    },
  });
  const createdCount = await materializeRecurrence(rec.id);
  await notifyStudentNewRecurrence(rec.id); // одно сводное оповещение ученику
  revalidatePath("/schedule");
  revalidatePath("/dashboard");

  return {
    ok: true,
    studentName: student.name,
    studentId: student.id,
    notified: !!student.telegramChatId,
    createdCount,
  };
}

export async function cancelLessonAction(formData: FormData): Promise<void> {
  const tutor = await requireTutor();
  const id = String(formData.get("id") || "");
  const lesson = await prisma.lesson.findFirst({ where: { id, tutorId: tutor.id } });
  if (!lesson) return;

  await prisma.lesson.update({ where: { id }, data: { status: LessonStatus.Cancelled } });
  await prisma.reminder.deleteMany({ where: { lessonId: id, status: ReminderStatus.Pending } });
  await notifyStudentCancelledLesson(id); // мгновенно оповещаем ученика об отмене
  revalidatePath("/schedule");
  revalidatePath("/dashboard");
}

export async function completeLessonAction(formData: FormData): Promise<void> {
  const tutor = await requireTutor();
  const id = String(formData.get("id") || "");
  const lesson = await prisma.lesson.findFirst({ where: { id, tutorId: tutor.id } });
  if (!lesson) return;

  await prisma.lesson.update({ where: { id }, data: { status: LessonStatus.Completed } });
  await prisma.reminder.deleteMany({ where: { lessonId: id, status: ReminderStatus.Pending } });
  revalidatePath("/schedule");
  revalidatePath("/dashboard");
}
