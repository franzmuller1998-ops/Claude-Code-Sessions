import Link from "next/link";
import { requireTutor } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatLessonTime, tzOffsetLabel } from "@/lib/time";
import { inviteLink } from "@/lib/tokens";
import { LessonStatus } from "@/lib/constants";
import { connectTutorTelegramAction } from "@/app/actions/telegram";
import CopyLink from "@/components/CopyLink";

/** Минуты → часы для подписи: "8", "8,5". */
function formatWorkedHours(minutes: number): string {
  const hours = Math.round((minutes / 60) * 10) / 10;
  return Number.isInteger(hours) ? String(hours) : hours.toFixed(1).replace(".", ",");
}

export default async function DashboardPage() {
  const tutor = await requireTutor();
  const now = new Date();

  const [studentCount, upcoming, completedStats] = await Promise.all([
    prisma.student.count({ where: { tutorId: tutor.id } }),
    prisma.lesson.findMany({
      where: {
        tutorId: tutor.id,
        status: LessonStatus.Scheduled,
        startAt: { gte: now },
      },
      include: { student: true },
      orderBy: { startAt: "asc" },
      take: 6,
    }),
    // Проведённые занятия (статус Completed) — заполняется по кнопке «Проведено».
    prisma.lesson.aggregate({
      where: { tutorId: tutor.id, status: LessonStatus.Completed },
      _count: true,
      _sum: { durationMin: true },
    }),
  ]);

  const completedCount = completedStats._count;
  const workedHours = formatWorkedHours(completedStats._sum.durationMin ?? 0);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">Привет, {tutor.name} 👋</h1>

      {/* Telegram-привязка репетитора */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="mb-2 font-semibold text-slate-900">Ваш Telegram</h2>
        {tutor.telegramChatId ? (
          <p className="text-sm text-green-700">
            ✅ Подключён — напоминания о занятиях будут приходить вам в Telegram.
          </p>
        ) : tutor.linkToken ? (
          <div className="space-y-2">
            <p className="text-sm text-slate-600">
              Откройте ссылку и нажмите «Старт» в боте, чтобы получать напоминания:
            </p>
            <CopyLink url={inviteLink(tutor.linkToken)} />
          </div>
        ) : (
          <form action={connectTutorTelegramAction}>
            <p className="mb-3 text-sm text-slate-600">
              Подключите Telegram, чтобы получать напоминания о своих занятиях.
            </p>
            <button className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
              Подключить Telegram
            </button>
          </form>
        )}
      </section>

      {/* Метрики — тёплые пастельные плитки */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-2xl bg-[#fbeae0] p-5">
          <div className="text-3xl font-semibold text-[#712b13]">{studentCount}</div>
          <div className="text-sm text-[#99603f]">Учеников</div>
        </div>
        <div className="rounded-2xl bg-[#faeeda] p-5">
          <div className="text-3xl font-semibold text-[#633806]">{upcoming.length}</div>
          <div className="text-sm text-[#854f0b]">Ближайших занятий</div>
        </div>
        <div className="rounded-2xl bg-[#fbeaf0] p-5">
          <div className="text-sm font-medium text-[#72243e]">{tutor.timezone}</div>
          <div className="text-sm text-[#993556]">
            Часовой пояс (UTC{tzOffsetLabel(tutor.timezone)})
          </div>
        </div>
        <div className="rounded-2xl bg-[#eaf3de] p-5">
          <div className="text-3xl font-semibold text-[#27500a]">{completedCount}</div>
          <div className="text-sm text-[#3b6d11]">Проведено занятий</div>
          <div className="mt-1 text-xs text-[#527a1e]">{workedHours} ч отработано</div>
        </div>
      </div>

      {/* Ближайшие занятия */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Ближайшие занятия</h2>
          <Link href="/schedule" className="text-sm text-indigo-600 hover:underline">
            Всё расписание →
          </Link>
        </div>
        {upcoming.length === 0 ? (
          <p className="text-sm text-slate-500">
            Пока нет запланированных занятий.{" "}
            <Link href="/schedule" className="text-indigo-600 hover:underline">
              Создать занятие
            </Link>
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {upcoming.map((l) => (
              <li key={l.id} className="flex items-center justify-between py-2.5 text-sm">
                <span className="font-medium text-slate-800">{l.student.name}</span>
                <span className="text-slate-500">
                  {formatLessonTime(l.startAt, tutor.timezone)}
                  {l.subject ? ` · ${l.subject}` : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
