import Link from "next/link";
import NavLink from "@/components/NavLink";
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
        {/* Десктоп: три колонки (лого слева, меню по центру, действия справа).
            Узкие экраны: лого и «Выйти» в строке, меню переносится по центру ниже. */}
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-y-2 px-4 py-3 sm:grid sm:grid-cols-3">
          <Link
            href="/dashboard"
            className="whitespace-nowrap text-lg font-semibold text-slate-900 sm:justify-self-start"
          >
            📚 Репетитор
          </Link>
          <nav className="order-last flex w-full items-center justify-center gap-5 text-sm font-medium sm:order-none sm:w-auto sm:justify-self-center">
            <NavLink href="/dashboard" className="text-slate-600 hover:text-slate-900">
              Главная
            </NavLink>
            <NavLink href="/students" className="text-slate-600 hover:text-slate-900">
              Ученики
            </NavLink>
            <NavLink href="/schedule" className="text-slate-600 hover:text-slate-900">
              Расписание
            </NavLink>
          </nav>
          <div className="ml-auto flex items-center gap-3 text-sm sm:ml-0 sm:justify-self-end">
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
