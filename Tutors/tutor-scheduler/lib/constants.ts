// Строковые "enum"-ы (SQLite не поддерживает нативные enum).

export const LessonStatus = {
  Scheduled: "scheduled",
  Completed: "completed",
  Cancelled: "cancelled",
} as const;
export type LessonStatus = (typeof LessonStatus)[keyof typeof LessonStatus];

export const Recipient = {
  Tutor: "tutor",
  Student: "student",
} as const;
export type Recipient = (typeof Recipient)[keyof typeof Recipient];

export const ReminderStatus = {
  Pending: "pending",
  Sent: "sent",
  Failed: "failed",
} as const;
export type ReminderStatus = (typeof ReminderStatus)[keyof typeof ReminderStatus];

// Напоминания по умолчанию: за сколько минут до занятия и подпись.
export const DEFAULT_REMINDER_OFFSETS: { minutesBefore: number; label: string }[] = [
  { minutesBefore: 24 * 60, label: "за 24 часа" },
  { minutesBefore: 60, label: "за 1 час" },
];

// На какой горизонт (недель) вперёд материализуем повторяющиеся занятия.
export const RECURRENCE_HORIZON_WEEKS = 8;

export const WEEKDAY_LABELS = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];

// Полные названия дней недели — для текстов уведомлений.
export const WEEKDAY_LABELS_FULL = [
  "воскресенье",
  "понедельник",
  "вторник",
  "среда",
  "четверг",
  "пятница",
  "суббота",
];

// Часто используемые часовые пояса для выпадающих списков.
export const COMMON_TIMEZONES = [
  "Europe/Kaliningrad",
  "Europe/Moscow",
  "Europe/Samara",
  "Asia/Yekaterinburg",
  "Asia/Omsk",
  "Asia/Krasnoyarsk",
  "Asia/Irkutsk",
  "Asia/Yakutsk",
  "Asia/Vladivostok",
  "Asia/Almaty",
  "Asia/Tbilisi",
  "Europe/Kyiv",
  "Europe/Minsk",
  "UTC",
];
