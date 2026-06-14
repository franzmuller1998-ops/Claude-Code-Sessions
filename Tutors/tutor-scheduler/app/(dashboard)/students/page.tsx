import Link from "next/link";
import { requireTutor } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createStudentAction } from "@/app/actions/students";
import TimezoneSelect from "@/components/TimezoneSelect";

const input =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500";
const label = "block text-sm font-medium text-slate-700 mb-1";

export default async function StudentsPage() {
  const tutor = await requireTutor();
  const students = await prisma.student.findMany({
    where: { tutorId: tutor.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">Ученики</h1>

      {/* Добавить ученика */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="mb-4 font-semibold text-slate-900">Добавить ученика</h2>
        <form
          action={createStudentAction}
          className="grid grid-cols-1 gap-4 sm:grid-cols-4"
        >
          <div>
            <label className={label} htmlFor="name">
              Имя
            </label>
            <input id="name" name="name" className={input} required />
          </div>
          <div>
            <label className={label} htmlFor="subject">
              Предмет
            </label>
            <input id="subject" name="subject" className={input} placeholder="напр. Математика" />
          </div>
          <div>
            <label className={label} htmlFor="timezone">
              Часовой пояс
            </label>
            <TimezoneSelect defaultValue={tutor.timezone} />
          </div>
          <div className="flex items-end">
            <button className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
              Добавить
            </button>
          </div>
        </form>
      </section>

      {/* Список */}
      <section className="rounded-2xl border border-slate-200 bg-white">
        {students.length === 0 ? (
          <p className="p-5 text-sm text-slate-500">Пока нет учеников.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {students.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/students/${s.id}`}
                  className="flex items-center justify-between px-5 py-4 transition-colors hover:bg-indigo-50"
                >
                  <div>
                    <div className="font-medium text-slate-900">{s.name}</div>
                    <div className="text-sm text-slate-500">
                      {s.subject || "—"} · {s.timezone}
                    </div>
                  </div>
                  {s.telegramChatId ? (
                    <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
                      Telegram привязан
                    </span>
                  ) : (
                    <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
                      Не привязан
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
