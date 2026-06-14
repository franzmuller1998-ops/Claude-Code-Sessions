import Link from "next/link";
import { requireTutor } from "@/lib/auth";
import { logoutAction } from "@/app/actions/auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const tutor = await requireTutor();

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="text-lg font-semibold text-slate-900">
              📚 Репетитор
            </Link>
            <nav className="flex items-center gap-4 text-sm">
              <Link href="/dashboard" className="text-slate-600 hover:text-slate-900">
                Обзор
              </Link>
              <Link href="/students" className="text-slate-600 hover:text-slate-900">
                Ученики
              </Link>
              <Link href="/schedule" className="text-slate-600 hover:text-slate-900">
                Расписание
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden text-slate-500 sm:inline">{tutor.name}</span>
            <form action={logoutAction}>
              <button className="rounded-lg border border-slate-300 px-3 py-1.5 text-slate-600 transition-colors hover:bg-slate-100">
                Выйти
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
