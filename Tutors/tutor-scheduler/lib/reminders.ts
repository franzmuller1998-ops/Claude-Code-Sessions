import { addDays } from "date-fns";
import { toZonedTime, format as tzFormat } from "date-fns-tz";
import { prisma } from "@/lib/prisma";
import { sendTelegramMessage, lessonKeyboard } from "@/lib/bot";
import { formatLessonTime, zonedToUtc, parseDaysOfWeek } from "@/lib/time";
import {
  DEFAULT_REMINDER_OFFSETS,
  RECURRENCE_HORIZON_WEEKS,
  LessonStatus,
  Recipient,
  ReminderStatus,
} from "@/lib/constants";

/**
 * (Пере)создаёт напоминания для одного занятия: для репетитора и ученика,
 * по офсетам из DEFAULT_REMINDER_OFFSETS. Прошедшие офсеты пропускаются.
 * Перед созданием удаляет старые pending-напоминания этого занятия (для reschedule).
 */
export async function generateRemindersForLesson(
  lessonId: string,
  startAt: Date,
  now: Date = new Date(),
): Promise<void> {
  await prisma.reminder.deleteMany({
    where: { lessonId, status: ReminderStatus.Pending },
  });

  const data: {
    lessonId: string;
    recipient: string;
    remindAt: Date;
    offsetLabel: string;
  }[] = [];

  for (const recipient of [Recipient.Tutor, Recipient.Student]) {
    for (const off of DEFAULT_REMINDER_OFFSETS) {
      const remindAt = new Date(startAt.getTime() - off.minutesBefore * 60_000);
      if (remindAt <= now) continue; // не создаём напоминания в прошлом
      data.push({ lessonId, recipient, remindAt, offsetLabel: off.label });
    }
  }

  if (data.length) await prisma.reminder.createMany({ data });
}

/**
 * Материализует повторяющееся занятие в конкретные Lesson-ы на горизонт вперёд
 * и создаёт для каждого напоминания. Идемпотентна: уже существующие занятия серии
 * (по времени старта) пропускаются.
 */
export async function materializeRecurrence(recurrenceId: string): Promise<number> {
  const rec = await prisma.recurrence.findUnique({
    where: { id: recurrenceId },
    include: { tutor: true },
  });
  if (!rec) return 0;

  const tz = rec.tutor.timezone;
  const days = parseDaysOfWeek(rec.daysOfWeek);
  if (days.length === 0) return 0;

  const now = new Date();
  const horizonDays = RECURRENCE_HORIZON_WEEKS * 7;

  const existing = await prisma.lesson.findMany({
    where: { recurrenceId },
    select: { startAt: true },
  });
  const existingTimes = new Set(existing.map((l) => l.startAt.getTime()));

  let created = 0;
  for (let i = 0; i <= horizonDays; i++) {
    const zoned = toZonedTime(addDays(now, i), tz);
    if (!days.includes(zoned.getDay())) continue;

    const dateStr = tzFormat(zoned, "yyyy-MM-dd", { timeZone: tz });
    const startAt = zonedToUtc(dateStr, rec.timeOfDay, tz);

    if (startAt <= now) continue;
    if (startAt < rec.startDate) continue;
    if (rec.endDate && startAt > rec.endDate) continue;
    if (existingTimes.has(startAt.getTime())) continue;

    const lesson = await prisma.lesson.create({
      data: {
        tutorId: rec.tutorId,
        studentId: rec.studentId,
        startAt,
        durationMin: rec.durationMin,
        subject: rec.subject,
        recurrenceId: rec.id,
      },
    });
    await generateRemindersForLesson(lesson.id, startAt, now);
    existingTimes.add(startAt.getTime());
    created++;
  }
  return created;
}

/**
 * Находит наступившие pending-напоминания и рассылает их в Telegram.
 * Идемпотентно по статусу: отправленные/упавшие повторно не шлёт.
 */
export async function processDueReminders(now: Date = new Date()) {
  const due = await prisma.reminder.findMany({
    where: {
      status: ReminderStatus.Pending,
      remindAt: { lte: now },
      lesson: { status: LessonStatus.Scheduled },
    },
    include: { lesson: { include: { tutor: true, student: true } } },
    orderBy: { remindAt: "asc" },
    take: 50,
  });

  let sent = 0;
  let failed = 0;

  for (const r of due) {
    const { lesson } = r;
    const isStudent = r.recipient === Recipient.Student;
    const chatId = isStudent ? lesson.student.telegramChatId : lesson.tutor.telegramChatId;
    const tz = isStudent ? lesson.student.timezone : lesson.tutor.timezone;

    if (!chatId) {
      // Получатель не привязал Telegram — помечаем как failed, чтобы не зависало.
      await prisma.reminder.update({
        where: { id: r.id },
        data: { status: ReminderStatus.Failed, sentAt: new Date() },
      });
      failed++;
      continue;
    }

    const when = formatLessonTime(lesson.startAt, tz);
    const subj = lesson.subject ? ` «${lesson.subject}»` : "";
    const text = isStudent
      ? `🔔 Напоминание: занятие${subj} ${when} (${r.offsetLabel}). До встречи!`
      : `🔔 Напоминание: занятие с ${lesson.student.name}${subj} ${when} (${r.offsetLabel}).`;

    const ok = await sendTelegramMessage(
      chatId,
      text,
      isStudent ? lessonKeyboard(lesson.id) : undefined,
    );

    await prisma.reminder.update({
      where: { id: r.id },
      data: { status: ok ? ReminderStatus.Sent : ReminderStatus.Failed, sentAt: new Date() },
    });
    if (ok) sent++;
    else failed++;
  }

  return { processed: due.length, sent, failed };
}
