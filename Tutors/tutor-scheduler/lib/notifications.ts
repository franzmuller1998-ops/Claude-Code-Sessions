import { prisma } from "@/lib/prisma";
import { sendTelegramMessage, lessonKeyboard } from "@/lib/bot";
import { formatLessonTime, formatInTz, parseDaysOfWeek } from "@/lib/time";
import { WEEKDAY_LABELS_FULL } from "@/lib/constants";

// Порядок дней недели для красивого вывода: Пн..Вс.
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];

/**
 * Мгновенное оповещение ученику о новом разовом занятии (с кнопками
 * подтверждения). Тихо пропускается, если ученик не привязал Telegram.
 */
export async function notifyStudentNewLesson(lessonId: string): Promise<void> {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: { student: true },
  });
  if (!lesson?.student.telegramChatId) return;

  const when = formatLessonTime(lesson.startAt, lesson.student.timezone);
  const subj = lesson.subject ? ` «${lesson.subject}»` : "";
  const text =
    `📅 Вам назначено занятие${subj}:\n${when} (${lesson.durationMin} мин).\n\n` +
    `Напоминания придут за 24 часа и за 1 час до начала.`;

  await sendTelegramMessage(lesson.student.telegramChatId, text, lessonKeyboard(lesson.id));
}

/**
 * Мгновенное оповещение ученику об отмене занятия репетитором.
 * Тихо пропускается, если ученик не привязал Telegram.
 */
export async function notifyStudentCancelledLesson(lessonId: string): Promise<void> {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: { student: true },
  });
  if (!lesson?.student.telegramChatId) return;

  const when = formatLessonTime(lesson.startAt, lesson.student.timezone);
  const subj = lesson.subject ? ` «${lesson.subject}»` : "";
  const text =
    `❌ Занятие${subj} отменено:\n${when}.\n\n` +
    `Напоминания по нему больше не придут.`;

  await sendTelegramMessage(lesson.student.telegramChatId, text);
}

/**
 * Мгновенное сводное оповещение ученику о новой серии регулярных занятий.
 * Одно сообщение вместо десятков. Тихо пропускается, если Telegram не привязан.
 */
export async function notifyStudentNewRecurrence(recurrenceId: string): Promise<void> {
  const rec = await prisma.recurrence.findUnique({
    where: { id: recurrenceId },
    include: { student: true },
  });
  if (!rec?.student.telegramChatId) return;

  const days = parseDaysOfWeek(rec.daysOfWeek);
  const dayLabels = WEEK_ORDER.filter((d) => days.includes(d))
    .map((d) => WEEKDAY_LABELS_FULL[d])
    .join(", ");

  const subj = rec.subject ? ` «${rec.subject}»` : "";
  const from = formatInTz(rec.startDate, rec.student.timezone, "d MMM yyyy");
  const until = rec.endDate
    ? ` по ${formatInTz(rec.endDate, rec.student.timezone, "d MMM yyyy")}`
    : "";

  const text =
    `📅 Вам назначены регулярные занятия${subj}:\n` +
    `${dayLabels} в ${rec.timeOfDay} (${rec.durationMin} мин), с ${from}${until}.\n\n` +
    `Перед каждым занятием придут напоминания за 24 часа и за 1 час.`;

  await sendTelegramMessage(rec.student.telegramChatId, text);
}
