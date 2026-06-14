import { fromZonedTime, toZonedTime, format } from "date-fns-tz";
import { ru } from "date-fns/locale";

/**
 * Преобразует локальные дату+время (в заданном timezone) в UTC Date.
 * @param dateStr "YYYY-MM-DD"
 * @param timeStr "HH:mm"
 * @param timeZone IANA tz, напр. "Europe/Moscow"
 */
export function zonedToUtc(dateStr: string, timeStr: string, timeZone: string): Date {
  // fromZonedTime трактует переданную "стену часов" как время в timeZone и возвращает UTC.
  return fromZonedTime(`${dateStr}T${timeStr}:00`, timeZone);
}

/** Форматирует UTC-дату в человекочитаемую строку в указанном timezone. */
export function formatInTz(
  date: Date,
  timeZone: string,
  pattern = "d MMM yyyy, HH:mm",
): string {
  return format(toZonedTime(date, timeZone), pattern, { timeZone, locale: ru });
}

/** Короткое представление времени занятия (день недели + дата + время). */
export function formatLessonTime(date: Date, timeZone: string): string {
  return formatInTz(date, timeZone, "EEEE, d MMM, HH:mm");
}

/** Текущий offset зоны в виде "+03:00" — для подписей. */
export function tzOffsetLabel(timeZone: string): string {
  return format(toZonedTime(new Date(), timeZone), "XXX", { timeZone });
}

/** Парсит "1,3,5" -> [1,3,5]. */
export function parseDaysOfWeek(s: string): number[] {
  return s
    .split(",")
    .map((x) => parseInt(x.trim(), 10))
    .filter((n) => !Number.isNaN(n) && n >= 0 && n <= 6);
}
