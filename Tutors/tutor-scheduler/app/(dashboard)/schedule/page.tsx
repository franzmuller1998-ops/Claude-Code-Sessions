import Link from "next/link";
import { requireTutor } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatInTz, formatLessonTime, tzOffsetLabel } from "@/lib/time";
import { LessonStatus } from "@/lib/constants";
import { cancelLessonAction, completeLessonAction } from "@/app/actions/lessons";
import LessonForms, { type StudentLite } from "@/components/schedule/LessonForms";

export default async function SchedulePage() {
  const tutor = await requireTutor();
  const now = new Date();
  // Сегодня в поясе репетитора (YYYY-MM-DD) — нижняя граница для полей даты.
  const today = formatInTz(now, tutor.timezone, "yyyy-MM-dd");

  const [students, lessons] = await Promise.all([
    prisma.student.findMany({
      where: { tutorId: tutor.id },
      orderBy: { name: "asc" },
    }),
    prisma.lesson.findMany({
      where: {
        tutorId: tutor.id,
        status: LessonStatus.Scheduled,
        startAt: { gte: now },
      },
      include: { student: true },
      orderBy: { startAt: "asc" },
      take: 50,
    }),
  ]);

  if (students.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold text-slate-900">Расписание</h1>
        <p className="text-sm text-slate-500">
          Сначала{" "}
          <Link href="/students" className="text-indigo-600 hover:underline">
            добавьте ученика
          </Link>
          , чтобы создавать занятия.
        </p>
      </div>
    );
  }

  const studentsLite: StudentLite[] = students.map((s) => ({
    id: s.id,
    name: s.name,
    subject: s.subject,
    linked: !!s.telegramChatId,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Расписание</h1>
        <span className="text-sm text-slate-500">
          Время в вашем поясе: {tutor.timezone} (UTC{tzOffsetLabel(tutor.timezone)})
        </span>
      </div>

      {/* Формы создания занятий + toast-уведомления (клиентский компонент) */}
      <LessonForms students={studentsLite} minDate={today} />

      {/* Список занятий */}
      <section className="rounded-2xl border border-slate-200 bg-white">
        <h2 className="border-b border-slate-100 p-5 font-semibold text-slate-900">
          Ближайшие занятия
        </h2>
        {lessons.length === 0 ? (
          <p className="p-5 text-sm text-slate-500">Нет запланированных занятий.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {lessons.map((l) => (
              <li
                key={l.id}
                className="flex flex-wrap items-center justify-between gap-3 px-5 py-3"
              >
                <div className="text-sm">
                  <div className="font-medium text-slate-900">
                    {l.student.name}
                    {l.recurrenceId ? " 🔁" : ""}
                  </div>
                  <div className="text-slate-500">
                    {formatLessonTime(l.startAt, tutor.timezone)} · {l.durationMin} мин
                    {l.subject ? ` · ${l.subject}` : ""}
                  </div>
                </div>
                <div className="flex gap-2">
                  <form action={completeLessonAction}>
                    <input type="hidden" name="id" value={l.id} />
                    <button className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-600 transition-colors hover:bg-slate-100">
                      Проведено
                    </button>
                  </form>
                  <form action={cancelLessonAction}>
                    <input type="hidden" name="id" value={l.id} />
                    <button className="rounded-lg border border-red-300 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50">
                      Отменить
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
