import Link from "next/link";
import { notFound } from "next/navigation";
import { requireTutor } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { inviteLink } from "@/lib/tokens";
import { formatLessonTime } from "@/lib/time";
import { LessonStatus } from "@/lib/constants";
import {
  regenerateLinkAction,
  deleteStudentAction,
} from "@/app/actions/students";
import CopyLink from "@/components/CopyLink";

export default async function StudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tutor = await requireTutor();
  const student = await prisma.student.findFirst({
    where: { id, tutorId: tutor.id },
    include: {
      lessons: {
        where: { status: LessonStatus.Scheduled, startAt: { gte: new Date() } },
        orderBy: { startAt: "asc" },
        take: 10,
      },
    },
  });
  if (!student) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link href="/students" className="text-sm text-indigo-600 hover:underline">
          ← К ученикам
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">{student.name}</h1>
        <p className="text-sm text-slate-500">
          {student.subject || "—"} · {student.timezone}
        </p>
      </div>

      {/* Привязка Telegram */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="mb-3 font-semibold text-slate-900">Напоминания в Telegram</h2>
        {student.telegramChatId ? (
          <div className="space-y-3">
            <p className="text-sm text-green-700">
              ✅ Привязан {student.linkedAt ? `(${formatLessonTime(student.linkedAt, tutor.timezone)})` : ""}
            </p>
            <form action={regenerateLinkAction}>
              <input type="hidden" name="id" value={student.id} />
              <button className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-600 transition-colors hover:bg-slate-100">
                Отвязать и создать новую ссылку
              </button>
            </form>
          </div>
        ) : student.linkToken ? (
          <div className="space-y-2">
            <p className="text-sm text-slate-600">
              Отправьте ученику эту ссылку. Он откроет её, нажмёт «Старт» — и начнёт
              получать напоминания:
            </p>
            <CopyLink url={inviteLink(student.linkToken)} />
            <form action={regenerateLinkAction} className="pt-1">
              <input type="hidden" name="id" value={student.id} />
              <button className="text-xs text-slate-500 hover:underline">
                Создать новую ссылку
              </button>
            </form>
          </div>
        ) : (
          <form action={regenerateLinkAction}>
            <input type="hidden" name="id" value={student.id} />
            <button className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
              Создать ссылку-приглашение
            </button>
          </form>
        )}
      </section>

      {/* Ближайшие занятия ученика */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="mb-3 font-semibold text-slate-900">Ближайшие занятия</h2>
        {student.lessons.length === 0 ? (
          <p className="text-sm text-slate-500">
            Нет запланированных занятий.{" "}
            <Link href="/schedule" className="text-indigo-600 hover:underline">
              Создать
            </Link>
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {student.lessons.map((l) => (
              <li key={l.id} className="py-2.5 text-sm text-slate-700">
                {formatLessonTime(l.startAt, tutor.timezone)} · {l.durationMin} мин
                {l.subject ? ` · ${l.subject}` : ""}
                {l.recurrenceId ? " · 🔁" : ""}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Удаление */}
      <section className="rounded-2xl border border-red-200 bg-white p-5">
        <h2 className="mb-2 font-semibold text-red-700">Внимание!</h2>
        <p className="mb-3 text-sm text-slate-500">
          Удаление ученика удалит все его занятия и напоминания.
        </p>
        <form action={deleteStudentAction}>
          <input type="hidden" name="id" value={student.id} />
          <button className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50">
            Удалить ученика
          </button>
        </form>
      </section>
    </div>
  );
}
